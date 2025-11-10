'use client'

/**
 * Step 1: Product Type Selection
 *
 * Choose between simple product or product with variants
 */

import { Package, Layers } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface Step1ProductTypeProps {
  value: boolean | undefined
  onChange: (hasVariants: boolean) => void
}

export function Step1ProductType({ value, onChange }: Step1ProductTypeProps) {
  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Select whether this product will have variants (like different sizes or colors) or
        if it&apos;s a simple product with no variations.
      </div>

      <RadioGroup
        value={value === undefined ? undefined : value ? 'variants' : 'simple'}
        onValueChange={(val) => onChange(val === 'variants')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Simple Product Option */}
          <Card className={`cursor-pointer transition-all hover:border-primary ${
            value === false ? 'border-primary ring-2 ring-primary/20' : ''
          }`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Simple Product</CardTitle>
                    <CardDescription className="text-sm">
                      No variants
                    </CardDescription>
                  </div>
                </div>
                <RadioGroupItem value="simple" id="simple" />
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Single product with one price</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>One inventory quantity</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Best for unique items</span>
                </li>
              </ul>
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium">Examples:</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Art prints, books, accessories, gift cards
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Product with Variants Option */}
          <Card className={`cursor-pointer transition-all hover:border-primary ${
            value === true ? 'border-primary ring-2 ring-primary/20' : ''
          }`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Layers className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Product with Variants</CardTitle>
                    <CardDescription className="text-sm">
                      Multiple options
                    </CardDescription>
                  </div>
                </div>
                <RadioGroupItem value="variants" id="variants" />
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Multiple combinations (Size + Color + Material)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Individual pricing per variant</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Separate inventory tracking</span>
                </li>
              </ul>
              <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-xs font-medium text-primary">Examples:</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Clothing, jewelry, furniture, electronics
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </RadioGroup>

      {/* Help Text */}
      {value === true && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Great choice! Next, you&apos;ll select which variant types apply to your product.
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            We&apos;ll guide you through templates and bulk operations to make setup fast and easy.
          </p>
        </div>
      )}

      {value === false && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            You can always add variants later if needed.
          </p>
          <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
            Simple products are perfect for unique items that don&apos;t have variations.
          </p>
        </div>
      )}
    </div>
  )
}
