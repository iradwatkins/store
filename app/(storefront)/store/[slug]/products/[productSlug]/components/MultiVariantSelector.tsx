'use client'

/**
 * Multi-Variant Selector Component
 * 
 * Allows customers to select variant combinations (size + color + material, etc.)
 * on product pages. Handles availability checking and price updates.
 */

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Check, AlertCircle } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

interface VariantOption {
  id: string
  type: string
  value: string
  displayName: string
  hexColor?: string
  imageUrl?: string
  icon?: string
  isActive: boolean
}

interface VariantCombination {
  id: string
  combinationKey: string
  optionValues: Record<string, string>
  price?: number
  quantity: number
  available: boolean
  inStock: boolean
  imageUrl?: string
}

interface Product {
  id: string
  name: string
  price: number
  variantTypes: string[]
  useMultiVariants: boolean
  variantOptions: VariantOption[]
  variantCombinations: VariantCombination[]
}

interface MultiVariantSelectorProps {
  product: Product
  onSelectionChange: (combination: VariantCombination | null, selectedOptions: Record<string, string>) => void
  className?: string
}

export function MultiVariantSelector({
  product,
  onSelectionChange,
  className
}: MultiVariantSelectorProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  
  // Group options by type
  const optionsByType = useMemo(() => {
    const grouped: Record<string, VariantOption[]> = {}
    
    product.variantOptions.forEach(option => {
      if (!grouped[option.type]) {
        grouped[option.type] = []
      }
      grouped[option.type].push(option)
    })
    
    // Sort options within each type
    Object.keys(grouped).forEach(type => {
      grouped[type].sort((a, b) => a.displayName.localeCompare(b.displayName))
    })
    
    return grouped
  }, [product.variantOptions])

  // Find matching combination based on selected options
  const selectedCombination = useMemo(() => {
    if (Object.keys(selectedOptions).length !== product.variantTypes.length) {
      return null
    }
    
    return product.variantCombinations.find(combination => {
      return product.variantTypes.every(type => 
        combination.optionValues[type] === selectedOptions[type]
      )
    }) || null
  }, [selectedOptions, product.variantCombinations, product.variantTypes])

  // Get available options for a specific type based on current selections
  const getAvailableOptions = (targetType: string) => {
    const currentSelections = { ...selectedOptions }
    delete currentSelections[targetType] // Don't consider the target type in filtering
    
    if (Object.keys(currentSelections).length === 0) {
      // No selections made yet, all options are potentially available
      return optionsByType[targetType] || []
    }
    
    // Find combinations that match current selections (excluding target type)
    const matchingCombinations = product.variantCombinations.filter(combination => {
      return Object.keys(currentSelections).every(type =>
        combination.optionValues[type] === currentSelections[type]
      ) && combination.available && combination.inStock
    })
    
    // Get unique values for the target type from matching combinations
    const availableValues = new Set(
      matchingCombinations.map(combo => combo.optionValues[targetType])
    )
    
    // Filter options to only those that have available combinations
    return (optionsByType[targetType] || []).filter(option =>
      availableValues.has(option.value)
    )
  }

  // Handle option selection
  const handleOptionSelect = (type: string, value: string) => {
    const newSelectedOptions = {
      ...selectedOptions,
      [type]: value
    }
    
    setSelectedOptions(newSelectedOptions)
    
    // Find the combination if all options are selected
    let combination = null
    if (Object.keys(newSelectedOptions).length === product.variantTypes.length) {
      combination = product.variantCombinations.find(combo =>
        product.variantTypes.every(variantType =>
          combo.optionValues[variantType] === newSelectedOptions[variantType]
        )
      ) || null
    }
    
    onSelectionChange(combination, newSelectedOptions)
  }

  // Clear all selections
  const clearSelections = () => {
    setSelectedOptions({})
    onSelectionChange(null, {})
  }

  // Get current price
  const currentPrice = selectedCombination?.price ?? product.price

  // Check if all options are selected
  const allOptionsSelected = Object.keys(selectedOptions).length === product.variantTypes.length

  // Check if current selection is available
  const isSelectionAvailable = selectedCombination?.available && selectedCombination?.inStock

  return (
    <div className={cn("space-y-6", className)}>
      {/* Variant Type Selectors */}
      {product.variantTypes.map((variantType) => {
        const typeOptions = optionsByType[variantType] || []
        const availableOptions = getAvailableOptions(variantType)
        const selectedValue = selectedOptions[variantType]

        return (
          <div key={variantType} className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                {variantType.charAt(0) + variantType.slice(1).toLowerCase()}
                {selectedValue && (
                  <span className="ml-2 text-muted-foreground font-normal">
                    - {typeOptions.find(opt => opt.value === selectedValue)?.displayName}
                  </span>
                )}
              </h4>
              {selectedValue && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newSelections = { ...selectedOptions }
                    delete newSelections[variantType]
                    setSelectedOptions(newSelections)
                    onSelectionChange(null, newSelections)
                  }}
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Option Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {typeOptions.map((option) => {
                const isSelected = selectedValue === option.value
                const isAvailable = availableOptions.some(availOpt => availOpt.value === option.value)
                const isDisabled = !isAvailable && Object.keys(selectedOptions).length > 0

                return (
                  <Button
                    key={option.id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    disabled={isDisabled}
                    onClick={() => handleOptionSelect(variantType, option.value)}
                    className={cn(
                      "h-auto p-3 justify-start flex-col items-center gap-2",
                      isSelected && "ring-2 ring-primary ring-offset-2",
                      isDisabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {/* Color swatch for COLOR type */}
                    {variantType === 'COLOR' && option.hexColor && (
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: option.hexColor }}
                      />
                    )}
                    
                    {/* Option icon */}
                    {option.icon && (
                      <span className="text-lg">{option.icon}</span>
                    )}
                    
                    {/* Option text */}
                    <span className="text-xs text-center leading-tight">
                      {option.displayName}
                    </span>
                    
                    {/* Selected indicator */}
                    {isSelected && (
                      <Check className="h-3 w-3 absolute top-1 right-1" />
                    )}
                  </Button>
                )
              })}
            </div>

            {/* No available options message */}
            {typeOptions.length > 0 && availableOptions.length === 0 && Object.keys(selectedOptions).length > 0 && (
              <p className="text-sm text-muted-foreground">
                No {variantType.toLowerCase()} options available for current selection
              </p>
            )}
          </div>
        )
      })}

      {/* Selection Summary */}
      {Object.keys(selectedOptions).length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {/* Selected options display */}
              <div>
                <h5 className="font-medium text-sm mb-2">Current Selection</h5>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selectedOptions).map(([type, value]) => {
                    const option = optionsByType[type]?.find(opt => opt.value === value)
                    return (
                      <Badge key={type} variant="secondary" className="flex items-center gap-1">
                        {variantType === 'COLOR' && option?.hexColor && (
                          <div
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: option.hexColor }}
                          />
                        )}
                        {type}: {option?.displayName || value}
                      </Badge>
                    )
                  })}
                </div>
              </div>

              {/* Price display */}
              <div className="flex items-center justify-between">
                <span className="font-medium">Price:</span>
                <span className="text-lg font-bold">
                  {formatCurrency(currentPrice)}
                </span>
              </div>

              {/* Availability status */}
              {allOptionsSelected && (
                <div>
                  {isSelectionAvailable ? (
                    <Badge variant="default" className="text-green-700 bg-green-100">
                      ✓ Available ({selectedCombination?.quantity || 0} in stock)
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      Out of Stock
                    </Badge>
                  )}
                </div>
              )}

              {/* Clear button */}
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelections}
                className="w-full"
              >
                Clear All Selections
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection required message */}
      {!allOptionsSelected && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select all variant options to see availability and add to cart.
          </AlertDescription>
        </Alert>
      )}

      {/* Out of stock warning */}
      {allOptionsSelected && !isSelectionAvailable && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This variant combination is currently out of stock. Please try a different combination.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}