'use client'

/**
 * Step 5: Review & Generate
 *
 * Final review of all settings before generating variant combinations
 */

import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface VariantOption {
  value: string
  displayName: string
  hexColor?: string
  icon?: string
}

interface Step5ReviewProps {
  selectedVariantTypes: string[]
  variantOptions: Record<string, {
    selectedPresetOptions: VariantOption[]
    customOptions: string[]
  }>
  bulkSettings: {
    applyDefaultPrice: boolean
    defaultPrice?: number
    applyDefaultInventory: boolean
    defaultInventory?: number
    generateSkus: boolean
    skuPattern?: string
  }
  isGenerating?: boolean
}

const VARIANT_TYPE_NAMES: Record<string, string> = {
  SIZE: 'Size',
  COLOR: 'Color',
  MATERIAL: 'Material',
  STYLE: 'Style',
  FINISH: 'Finish',
  FORMAT: 'Format',
}

export function Step5Review({
  selectedVariantTypes,
  variantOptions,
  bulkSettings,
  isGenerating = false,
}: Step5ReviewProps) {
  const getTotalCombinations = () => {
    let total = 1
    selectedVariantTypes.forEach(type => {
      const options = variantOptions[type]
      if (options) {
        const optionCount = options.selectedPresetOptions.length + options.customOptions.length
        if (optionCount > 0) {
          total *= optionCount
        }
      }
    })
    return total
  }

  const getTotalInventory = () => {
    if (!bulkSettings.applyDefaultInventory || !bulkSettings.defaultInventory) return 0
    return bulkSettings.defaultInventory * getTotalCombinations()
  }

  const getOptionsList = (type: string): string[] => {
    const options = variantOptions[type]
    if (!options) return []

    const allOptions = [
      ...options.selectedPresetOptions.map(opt => opt.displayName),
      ...options.customOptions,
    ]
    return allOptions
  }

  const totalCombinations = getTotalCombinations()
  const hasWarnings = totalCombinations > 100

  return (
    <div className="space-y-6">
      {isGenerating ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">Generating variant combinations...</p>
            <p className="text-sm text-muted-foreground">
              Creating {totalCombinations} variants with your settings
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Ready to Generate Message */}
          <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Ready to generate variants
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Review your configuration below. Click "Complete" to generate all variant combinations.
                </p>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {hasWarnings && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                You're creating {totalCombinations} variant combinations. This is a large number
                and may take a few minutes to generate. Consider reducing options if possible.
              </AlertDescription>
            </Alert>
          )}

          {/* Variant Configuration Review */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Variant Configuration</CardTitle>
              <CardDescription className="text-sm">
                {selectedVariantTypes.length} variant types selected
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedVariantTypes.map((type, index) => {
                const optionsList = getOptionsList(type)
                return (
                  <div key={type}>
                    {index > 0 && <Separator className="my-4" />}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{VARIANT_TYPE_NAMES[type]}</h4>
                        <Badge variant="secondary">{optionsList.length} options</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {optionsList.slice(0, 10).map((option, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {option}
                          </Badge>
                        ))}
                        {optionsList.length > 10 && (
                          <Badge variant="outline" className="text-xs">
                            +{optionsList.length - 10} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Bulk Settings Review */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bulk Settings</CardTitle>
              <CardDescription className="text-sm">
                Default values to apply
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                {/* Pricing */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Default Price</p>
                    <p className="text-xs text-muted-foreground">
                      {bulkSettings.applyDefaultPrice
                        ? 'Applied to all variants'
                        : 'Not set'}
                    </p>
                  </div>
                  <div className="text-right">
                    {bulkSettings.applyDefaultPrice && bulkSettings.defaultPrice ? (
                      <p className="text-lg font-semibold">
                        ${bulkSettings.defaultPrice.toFixed(2)}
                      </p>
                    ) : (
                      <Badge variant="outline">Not set</Badge>
                    )}
                  </div>
                </div>

                {/* Inventory */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Default Inventory</p>
                    <p className="text-xs text-muted-foreground">
                      {bulkSettings.applyDefaultInventory
                        ? `${bulkSettings.defaultInventory} per variant`
                        : 'Not set'}
                    </p>
                  </div>
                  <div className="text-right">
                    {bulkSettings.applyDefaultInventory && bulkSettings.defaultInventory ? (
                      <div>
                        <p className="text-lg font-semibold">
                          {bulkSettings.defaultInventory}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getTotalInventory()} total
                        </p>
                      </div>
                    ) : (
                      <Badge variant="outline">Not set</Badge>
                    )}
                  </div>
                </div>

                {/* SKU Generation */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">SKU Generation</p>
                    <p className="text-xs text-muted-foreground">
                      {bulkSettings.generateSkus
                        ? bulkSettings.skuPattern
                          ? `Pattern: ${bulkSettings.skuPattern}-#`
                          : 'Auto-generated'
                        : 'Disabled'}
                    </p>
                  </div>
                  <div>
                    <Badge variant={bulkSettings.generateSkus ? 'default' : 'outline'}>
                      {bulkSettings.generateSkus ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generation Summary */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Generation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{totalCombinations}</p>
                  <p className="text-xs text-muted-foreground mt-1">Combinations</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {bulkSettings.applyDefaultPrice && bulkSettings.defaultPrice
                      ? `$${(bulkSettings.defaultPrice * totalCombinations).toFixed(0)}`
                      : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Total Value</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {getTotalInventory() || '-'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Total Stock</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <p className="text-xs font-medium">What happens next:</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{totalCombinations} variant combinations will be created</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Bulk settings will be applied to all variants</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>You can edit individual variants after generation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Product will be saved as draft until you publish</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
