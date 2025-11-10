import Link from "next/link"
import Image from "next/image"
import { Suspense } from "react"
import prisma from "@/lib/db"

export const dynamic = 'force-dynamic'

interface CategoryPageProps {
  params: Promise<{
    slug: string
  }>
}

async function CategoryProducts({ category }: { category: string }) {
  // Convert slug to category enum (e.g., "art-and-collectibles" -> "ART_AND_COLLECTIBLES")
  const categoryEnum = category.toUpperCase().replace(/-/g, '_')

  const products = await prisma.products.findMany({
    where: {
      status: 'ACTIVE',
      category: categoryEnum,
      quantity: {
        gt: 0,
      },
    },
    take: 48,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      product_images: {
        take: 1,
      },
      vendor_stores: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  })

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products found in this category yet.</p>
        <Link href="/products" className="text-primary hover:underline mt-4 inline-block">
          Browse all products
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/store/${product.vendor_stores.slug}/products/${product.slug}`}
          className="group"
        >
          <div className="aspect-square bg-muted relative overflow-hidden rounded-lg mb-2">
            {product.product_images[0] ? (
              <Image
                src={product.product_images[0].medium || product.product_images[0].url}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                No Image
              </div>
            )}
          </div>
          <h3 className="font-medium text-sm text-card-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground mb-1">{product.vendor_stores.name}</p>
          <p className="text-sm font-semibold text-foreground">${product.price.toFixed(2)}</p>
        </Link>
      ))}
    </div>
  )
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  // Await params since they're now async in Next.js 15
  const resolvedParams = await params
  
  // Format category name for display
  const categoryName = decodeURIComponent(resolvedParams.slug)
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/" className="text-primary hover:underline text-sm mb-2 inline-block">
            ← Back to home
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">{categoryName}</h1>
          <p className="text-muted-foreground">Browse products in this category</p>
        </div>

        <Suspense fallback={
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="bg-muted rounded-lg h-64 skeleton" />
            ))}
          </div>
        }>
          <CategoryProducts category={resolvedParams.slug} />
        </Suspense>
      </div>
    </div>
  )
}
