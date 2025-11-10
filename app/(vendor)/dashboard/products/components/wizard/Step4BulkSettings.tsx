'use client'

/**
 * Step 4: Bulk Settings
 *
 * Set default pricing, inventory, and SKU generation for all variant combinations
 */

import { DollarSign, Package, Hash, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface BulkSettings {
  applyDefaultPrice: boolean
  defaultPrice?: number
  applyDefaultInventory: boolean
  defaultInventory?: number
  generateSkus: boolean
  skuPattern?: string
}

interface Step4BulkSettingsProps {
  bulkSettings: BulkSettings
  onChange: (settings: BulkSettings) => void
  totalCombinations: number
}

export function Step4BulkSettings({
  bulkSettings,
  onChange,
  totalCombinations,
}: Step4BulkSettingsProps) {
  const handleToggle = (key: keyof BulkSettings) => {
    onChange({
      ...bulkSettings,
      [key]: !bulkSettings[key],
    })
  }

  const handleValueChange = (key: keyof BulkSettings, value: any) => {
    onChange({
      ...bulkSettings,
      [key]: value,
    })
  }

  const getEstimatedTime = () => {
    if (totalCombinations <= 20) {return '< 1 minute'}
    if (totalCombinations <= 50) {return '1-2 minutes'}
    if (totalCombinations <= 100) {return '2-3 minutes'}
    return '3-5 minutes'
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Save time with bulk settings
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Apply default values to all {totalCombinations} variant combinations at once.
              You can edit individual variants later if needed.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Default Pricing */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Default Pricing</CardTitle>
                <CardDescription className="text-sm">
                  Set the same price for all variants
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Apply default price</Label>
                <p className="text-xs text-muted-foreground">
                  All variants will start with this price
                </p>
              </div>
              <Switch
                checked={bulkSettings.applyDefaultPrice}
                onCheckedChange={() => handleToggle('applyDefaultPrice')}
              />
            </div>

            {bulkSettings.applyDefaultPrice && (
              <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                <Label htmlFor="defaultPrice">Default Price ($)</Label>
                <Input
                  id="defaultPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="29.99"
                  value={bulkSettings.defaultPrice || ''}
                  onChange={(e) =>
                    handleValueChange('defaultPrice', parseFloat(e.target.value) || undefined)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  This price will be applied to all {totalCombinations} combinations
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Default Inventory */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="w-4 h-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Default Inventory</CardTitle>
                <CardDescription className="text-sm">
                  Set starting stock levels for all variants
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Apply default inventory</Label>
                <p className="text-xs text-muted-foreground">
                  All variants will start with this quantity
                </p>
              </div>
              <Switch
                checked={bulkSettings.applyDefaultInventory}
                onCheckedChange={() => handleToggle('applyDefaultInventory')}
              />
            </div>

            {bulkSettings.applyDefaultInventory && (
              <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                <Label htmlFor="defaultInventory">Default Quantity</Label>
                <Input
                  id="defaultInventory"
                  type="number"
                  min="0"
                  placeholder="10"
                  value={bulkSettings.defaultInventory || ''}
                  onChange={(e) =>
                    handleValueChange('defaultInventory', parseInt(e.target.value) || undefined)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Total stock across all variants: {' '}
                  {bulkSettings.defaultInventory
                    ? bulkSettings.defaultInventory * totalCombinations
                    : 0}{' '}
                  units
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SKU Generation */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Hash className="w-4 h-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">SKU Generation</CardTitle>
                <CardDescription className="text-sm">
                  Automatically generate unique SKUs
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-generate SKUs</Label>
                <p className="text-xs text-muted-foreground">
                  Create unique identifiers for each variant
                </p>
              </div>
              <Switch
                checked={bulkSettings.generateSkus}
                onCheckedChange={() => handleToggle('generateSkus')}
              />
            </div>

            {bulkSettings.generateSkus && (
              <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                <div className="space-y-2">
                  <Label htmlFor="skuPattern">SKU Pattern (Optional)</Label>
                  <Input
                    id="skuPattern"
                    type="text"
                    placeholder="PROD"
                    value={bulkSettings.skuPattern || ''}
                    onChange={(e) => handleValueChange('skuPattern', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for auto-generated SKUs, or provide a prefix
                  </p>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <p className="text-xs font-medium">Example SKUs:</p>
                  <div className="space-y-1 text-xs text-muted-foreground font-mono">
                    <div>{bulkSettings.skuPattern || 'PROD'}-1</div>
                    <div>{bulkSettings.skuPattern || 'PROD'}-2</div>
                    <div>{bulkSettings.skuPattern || 'PROD'}-3</div>
                    <div className="text-xs">...</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Generation Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total combinations:</p>
              <p className="font-semibold text-lg">{totalCombinations}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Estimated time:</p>
              <p className="font-semibold text-lg">{getEstimatedTime()}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-xs font-medium">Settings to apply:</p>
            <div className="space-y-1 text-xs">
              {bulkSettings.applyDefaultPrice && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="w-16 justify-center">Price</Badge>
                  <span className="text-muted-foreground">
                    ${bulkSettings.defaultPrice?.toFixed(2) || '0.00'} per variant
                  </span>
                </div>
              )}
              {bulkSettings.applyDefaultInventory && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="w-16 justify-center">Stock</Badge>
                  <span className="text-muted-foreground">
                    {bulkSettings.defaultInventory || 0} units per variant
                  </span>
                </div>
              )}
              {bulkSettings.generateSkus && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="w-16 justify-center">SKUs</Badge>
                  <span className="text-muted-foreground">
                    Auto-generated with {bulkSettings.skuPattern ? `"${bulkSettings.skuPattern}"` : 'default'} prefix
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              <strong>Note:</strong> You can edit individual variants after generation if you need
              to adjust prices or inventory for specific combinations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
