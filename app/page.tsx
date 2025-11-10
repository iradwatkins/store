import Link from "next/link"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import prisma from "@/lib/db"
import { AnimatedHero } from "@/components/animated-hero"
import { AnimatedCategories } from "@/components/animated-categories"
import { AnimatedInfoSection } from "@/components/animated-info-section"
import { AnimatedCTA } from "@/components/animated-cta"
import { AnimatedSectionHeader } from "@/components/animated-section-header"
import { auth } from "@/lib/auth"

export const dynamic = 'force-dynamic'

async function FeaturedStores() {
  const stores = await prisma.vendor_stores.findMany({
    where: {
      isActive: true,
    },
    take: 6,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
    },
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stores.map((store) => (
        <Link
          key={store.id}
          href={`/store/${store.slug}`}
          className="bg-card rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-border hover:border-primary/30 group"
        >
          <div className="flex items-center gap-4 mb-3">
            {store.logoUrl ? (
              <img
                src={store.logoUrl}
                alt={store.name}
                className="w-16 h-16 rounded-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold group-hover:scale-110 transition-transform duration-300">
                {store.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="text-xl font-semibold text-card-foreground">{store.name}</h3>
            </div>
          </div>
          {store.description && (
            <p className="text-muted-foreground text-sm line-clamp-2">{store.description}</p>
          )}
        </Link>
      ))}
    </div>
  )
}

async function FeaturedProducts() {
  const products = await prisma.products.findMany({
    where: {
      status: 'ACTIVE',
      quantity: {
        gt: 0,
      },
    },
    take: 12,
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
              <img
                src={product.product_images[0].medium || product.product_images[0].url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
          </div>
          <h3 className="font-medium text-sm text-card-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">{product.name}</h3>
          <p className="text-sm font-semibold text-foreground">${product.price.toFixed(2)}</p>
        </Link>
      ))}
    </div>
  )
}

async function TrendingProducts() {
  const products = await prisma.products.findMany({
    where: {
      status: 'ACTIVE',
      quantity: {
        gt: 0,
      },
    },
    take: 12,
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
              <img
                src={product.product_images[0].medium || product.product_images[0].url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
          </div>
          <h3 className="font-medium text-sm text-card-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">{product.name}</h3>
          <p className="text-sm font-semibold text-foreground">${product.price.toFixed(2)}</p>
        </Link>
      ))}
    </div>
  )
}

export default async function HomePage() {
  const session = await auth()

  // Redirect authenticated users based on role
  if (session?.user) {
    if (session.user.role === "ADMIN") {
      redirect("/admin")
    } else if (session.user.vendor_stores) {
      redirect("/dashboard")
    }
    // Otherwise show marketplace (for customers without stores)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Etsy Style */}
      <AnimatedHero />

      {/* Browse by Category */}
      <AnimatedCategories />

      {/* Trending Now */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <AnimatedSectionHeader title="Trending now" subtitle="Top picks from our sellers" />
        <Suspense fallback={
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <div key={i} className="bg-muted rounded-lg h-48 skeleton" />
            ))}
          </div>
        }>
          <TrendingProducts />
        </Suspense>
      </section>

      {/* Featured Collections */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <AnimatedSectionHeader title="Popular right now" subtitle="Most loved by shoppers" />
        <Suspense fallback={
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <div key={i} className="bg-muted rounded-lg h-48 skeleton" />
            ))}
          </div>
        }>
          <FeaturedProducts />
        </Suspense>
      </section>

      {/* Featured Stores Section */}
      <section className="bg-muted/30 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedSectionHeader
            title="Featured Stores"
            subtitle="Curated shops from amazing creators"
            link={{ href: "/stores", text: "Explore all" }}
          />
          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-muted rounded-lg h-32 skeleton" />
              ))}
            </div>
          }>
            <FeaturedStores />
          </Suspense>
        </div>
      </section>

      {/* What is Stepperslife Section - Etsy Style */}
      <AnimatedInfoSection />

      {/* Become a Vendor CTA */}
      <AnimatedCTA />
    </div>
  )
}
