import { render, screen, fireEvent } from '@testing-library/react'
import { CartSummary } from '@/components/CartSummary'
import { Decimal } from '@prisma/client/runtime/library'

describe('CartSummary', () => {
  const mockCartItems = [
    {
      id: 'item-1',
      productId: 'product-1',
      quantity: 2,
      price: new Decimal(29.99),
      product: {
        name: 'Test Product 1',
        slug: 'test-product-1',
      },
    },
    {
      id: 'item-2',
      productId: 'product-2',
      quantity: 1,
      price: new Decimal(49.99),
      product: {
        name: 'Test Product 2',
        slug: 'test-product-2',
      },
    },
  ]

  it('should render cart items', () => {
    render(<CartSummary items={mockCartItems} />)

    expect(screen.getByText('Test Product 1')).toBeInTheDocument()
    expect(screen.getByText('Test Product 2')).toBeInTheDocument()
  })

  it('should calculate subtotal correctly', () => {
    render(<CartSummary items={mockCartItems} />)

    // Subtotal: (29.99 * 2) + (49.99 * 1) = 109.97
    expect(screen.getByText('$109.97')).toBeInTheDocument()
  })

  it('should display quantity for each item', () => {
    render(<CartSummary items={mockCartItems} />)

    const quantities = screen.getAllByText(/qty:/i)
    expect(quantities).toHaveLength(2)
  })

  it('should display tax amount', () => {
    const taxAmount = new Decimal(8.80)
    render(<CartSummary items={mockCartItems} tax={taxAmount} />)

    expect(screen.getByText('$8.80')).toBeInTheDocument()
  })

  it('should display shipping amount', () => {
    const shippingAmount = new Decimal(5.00)
    render(<CartSummary items={mockCartItems} shipping={shippingAmount} />)

    expect(screen.getByText('$5.00')).toBeInTheDocument()
  })

  it('should calculate and display total with tax and shipping', () => {
    const taxAmount = new Decimal(8.80)
    const shippingAmount = new Decimal(5.00)

    render(
      <CartSummary
        items={mockCartItems}
        tax={taxAmount}
        shipping={shippingAmount}
      />
    )

    // Total: 109.97 + 8.80 + 5.00 = 123.77
    expect(screen.getByText('$123.77')).toBeInTheDocument()
  })

  it('should call onUpdateQuantity when quantity is changed', () => {
    const handleUpdateQuantity = jest.fn()

    render(
      <CartSummary
        items={mockCartItems}
        onUpdateQuantity={handleUpdateQuantity}
      />
    )

    const increaseButton = screen.getAllByLabelText(/increase quantity/i)[0]
    fireEvent.click(increaseButton)

    expect(handleUpdateQuantity).toHaveBeenCalledWith('item-1', 3)
  })

  it('should call onRemoveItem when remove button is clicked', () => {
    const handleRemoveItem = jest.fn()

    render(
      <CartSummary items={mockCartItems} onRemoveItem={handleRemoveItem} />
    )

    const removeButtons = screen.getAllByLabelText(/remove item/i)
    fireEvent.click(removeButtons[0])

    expect(handleRemoveItem).toHaveBeenCalledWith('item-1')
  })

  it('should display empty cart message when no items', () => {
    render(<CartSummary items={[]} />)

    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument()
  })

  it('should disable checkout button when cart is empty', () => {
    render(<CartSummary items={[]} />)

    const checkoutButton = screen.getByRole('button', { name: /checkout/i })
    expect(checkoutButton).toBeDisabled()
  })

  it('should enable checkout button when cart has items', () => {
    render(<CartSummary items={mockCartItems} />)

    const checkoutButton = screen.getByRole('button', { name: /checkout/i })
    expect(checkoutButton).not.toBeDisabled()
  })

  it('should apply discount code when provided', () => {
    const discountAmount = new Decimal(10.00)

    render(<CartSummary items={mockCartItems} discount={discountAmount} />)

    expect(screen.getByText('-$10.00')).toBeInTheDocument()
  })
})
