import { NextResponse } from "next/server"
import {
  requireAuth,
  requireVendorStore,
  handleApiError,
} from "@/lib/utils/api"
import { getLowStockProducts } from "@/lib/stock-management"

/**
 * GET /api/dashboard/inventory/low-stock
 * Get low stock products for the vendor's store
 */
export async function GET() {
  try {
    const session = await requireAuth()
    const vendorStore = await requireVendorStore(session.user.id)

    const lowStockProducts = await getLowStockProducts(vendorStore.id)

    return NextResponse.json({
      success: true,
      products: lowStockProducts,
      count: lowStockProducts.length,
    })
  } catch (error) {
    return handleApiError(error, 'Fetch low stock products')
  }
}
