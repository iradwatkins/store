import React from 'react'
import { render, screen } from '@testing-library/react'
import LowStockBadge from '@/app/(vendor)/dashboard/components/LowStockBadge'

describe('LowStockBadge', () => {
  describe('Stock levels', () => {
    it('renders nothing when stock is above threshold', () => {
      const { container } = render(<LowStockBadge stock={10} lowStockThreshold={5} />)
      expect(container.firstChild).toBeNull()
    })

    it('renders "Out of Stock" when stock is 0', () => {
      render(<LowStockBadge stock={0} />)
      expect(screen.getByText('Out of Stock')).toBeInTheDocument()
    })

    it('renders "Low Stock" when stock is below threshold but above 0', () => {
      render(<LowStockBadge stock={3} lowStockThreshold={5} />)
      expect(screen.getByText(/Low Stock \(3 left\)/)).toBeInTheDocument()
    })

    it('renders "Low Stock" at exact threshold', () => {
      render(<LowStockBadge stock={5} lowStockThreshold={5} />)
      expect(screen.getByText(/Low Stock \(5 left\)/)).toBeInTheDocument()
    })

    it('uses default threshold of 5 when not specified', () => {
      render(<LowStockBadge stock={5} />)
      expect(screen.getByText(/Low Stock \(5 left\)/)).toBeInTheDocument()
    })
  })

  describe('Styling variants', () => {
    it('applies default variant styling', () => {
      const { container } = render(<LowStockBadge stock={3} variant="default" />)
      const badge = container.querySelector('span')
      expect(badge).toHaveClass('px-2.5', 'py-1', 'text-sm')
    })

    it('applies compact variant styling', () => {
      const { container } = render(<LowStockBadge stock={3} variant="compact" />)
      const badge = container.querySelector('span')
      expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs')
    })
  })

  describe('Visual indicators', () => {
    it('displays red background for out of stock', () => {
      const { container } = render(<LowStockBadge stock={0} />)
      const badge = container.querySelector('span')
      expect(badge).toHaveClass('bg-red-100', 'text-red-800')
    })

    it('displays orange background for low stock', () => {
      const { container } = render(<LowStockBadge stock={2} />)
      const badge = container.querySelector('span')
      expect(badge).toHaveClass('bg-orange-100', 'text-orange-800')
    })

    it('includes warning icon for low stock', () => {
      const { container } = render(<LowStockBadge stock={2} />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('includes X icon for out of stock', () => {
      const { container } = render(<LowStockBadge stock={0} />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('handles stock of 1 correctly', () => {
      render(<LowStockBadge stock={1} />)
      expect(screen.getByText(/Low Stock \(1 left\)/)).toBeInTheDocument()
    })

    it('handles custom high threshold', () => {
      const { container } = render(<LowStockBadge stock={15} lowStockThreshold={20} />)
      expect(screen.getByText(/Low Stock \(15 left\)/)).toBeInTheDocument()
    })

    it('does not render for stock just above threshold', () => {
      const { container } = render(<LowStockBadge stock={6} lowStockThreshold={5} />)
      expect(container.firstChild).toBeNull()
    })
  })
})
