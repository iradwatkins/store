import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

// GET /api/tenants/check-slug?slug=example
// Check if a tenant slug is available
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get("slug")

    if (!slug) {
      return NextResponse.json({ error: "Slug parameter is required" }, { status: 400 })
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        {
          available: false,
          error: "Slug must contain only lowercase letters, numbers, and hyphens",
        },
        { status: 200 }
      )
    }

    if (slug.length < 2 || slug.length > 50) {
      return NextResponse.json(
        { available: false, error: "Slug must be between 2 and 50 characters" },
        { status: 200 }
      )
    }

    // Reserved slugs (system subdomains)
    const reservedSlugs = [
      "www",
      "api",
      "admin",
      "app",
      "mail",
      "ftp",
      "localhost",
      "staging",
      "dev",
      "test",
      "demo",
      "cdn",
      "static",
      "assets",
      "files",
      "images",
      "uploads",
      "downloads",
      "blog",
      "shop",
      "store",
      "stores",
      "stepperslife",
    ]

    if (reservedSlugs.includes(slug.toLowerCase())) {
      return NextResponse.json(
        { available: false, error: "This subdomain is reserved by the system" },
        { status: 200 }
      )
    }

    // Check if slug exists in database
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (existingTenant) {
      return NextResponse.json(
        { available: false, error: "This subdomain is already taken" },
        { status: 200 }
      )
    }

    return NextResponse.json({ available: true, slug })
  } catch (error) {
    console.error("Error checking slug availability:", error)
    return NextResponse.json(
      { error: "Failed to check slug availability" },
      { status: 500 }
    )
  }
}
