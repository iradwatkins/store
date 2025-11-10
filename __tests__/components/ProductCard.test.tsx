import { render, screen } from '@testing-library/react'
import { ProductCard } from '@/components/ProductCard'
import { mockProduct } from '@/__tests__/utils/test-helpers'
import { Decimal } from '@prisma/client/runtime/library'

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: any) => {
    return <a href={href}>{children}</a>
  }
})

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

describe('ProductCard', () => {
  it('should render product name and price', () => {
    const product = mockProduct({
      name: 'Test T-Shirt',
      price: new Decimal(29.99),
    })

    render(<ProductCard product={product} />)

    expect(screen.getByText('Test T-Shirt')).toBeInTheDocument()
    expect(screen.getByText('$29.99')).toBeInTheDocument()
  })

  it('should show compare at price when available', () => {
    const product = mockProduct({
      name: 'Sale Item',
      price: new Decimal(19.99),
      compareAtPrice: new Decimal(29.99),
    })

    render(<ProductCard product={product} />)

    expect(screen.getByText('$19.99')).toBeInTheDocument()
    expect(screen.getByText('$29.99')).toBeInTheDocument()
  })

  it('should display "Out of Stock" badge when quantity is 0', () => {
    const product = mockProduct({
      quantity: 0,
      trackInventory: true,
    })

    render(<ProductCard product={product} />)

    expect(screen.getByText(/out of stock/i)).toBeInTheDocument()
  })

  it('should display "Low Stock" badge when quantity is low', () => {
    const product = mockProduct({
      quantity: 3,
      trackInventory: true,
    })

    render(<ProductCard product={product} />)

    expect(screen.getByText(/low stock/i)).toBeInTheDocument()
  })

  it('should link to product page', () => {
    const product = mockProduct({
      slug: 'test-product',
    })

    render(<ProductCard product={product} storeSlug="test-store" />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/store/test-store/products/test-product')
  })

  it('should handle missing product image gracefully', () => {
    const product = mockProduct({
      productImages: [],
    })

    render(<ProductCard product={product} />)

    const image = screen.getByRole('img')
    expect(image).toHaveAttribute('src', expect.stringContaining('placeholder'))
  })

  it('should display product category', () => {
    const product = mockProduct({
      category: 'CLOTHING',
    })

    render(<ProductCard product={product} showCategory />)

    expect(screen.getByText('Clothing')).toBeInTheDocument()
  })

  it('should calculate and display discount percentage', () => {
    const product = mockProduct({
      price: new Decimal(20.00),
      compareAtPrice: new Decimal(40.00),
    })

    render(<ProductCard product={product} />)

    expect(screen.getByText('50% OFF')).toBeInTheDocument()
  })
})
