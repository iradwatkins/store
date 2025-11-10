'use client'

/**
 * Step 2: Variant Types Selection
 *
 * Select which variant dimensions apply (Size, Color, Material, Style, Finish, Format)
 */

import { Ruler, Palette, Box, Sparkles, Droplet, FileText } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'

const VARIANT_TYPES = [
  {
    id: 'SIZE',
    name: 'Size',
    description: 'Dimensions, measurements, or capacity',
    icon: Ruler,
    examples: 'Small, Medium, Large, XL, 8", 16x20',
    categories: ['Clothing', 'Shoes', 'Art', 'Home', 'Food'],
  },
  {
    id: 'COLOR',
    name: 'Color',
    description: 'Color options for the product',
    icon: Palette,
    examples: 'Black, White, Red, Blue, Navy',
    categories: ['Clothing', 'Accessories', 'Home', 'Art'],
  },
  {
    id: 'MATERIAL',
    name: 'Material',
    description: 'What the product is made from',
    icon: Box,
    examples: 'Cotton, Silk, Wood, Metal, Sterling Silver',
    categories: ['Clothing', 'Jewelry', 'Furniture', 'Art'],
  },
  {
    id: 'STYLE',
    name: 'Style',
    description: 'Design or aesthetic variation',
    icon: Sparkles,
    examples: 'Modern, Vintage, Casual, Formal, Abstract',
    categories: ['Clothing', 'Jewelry', 'Art', 'Home'],
  },
  {
    id: 'FINISH',
    name: 'Finish',
    description: 'Surface treatment or coating',
    icon: Droplet,
    examples: 'Matte, Glossy, Polished, Brushed',
    categories: ['Jewelry', 'Furniture', 'Art'],
  },
  {
    id: 'FORMAT',
    name: 'Format',
    description: 'How the product is delivered',
    icon: FileText,
    examples: 'Digital Download, Physical, Framed, Hardcover',
    categories: ['Books', 'Art', 'Digital'],
  },
]

interface Step2VariantTypesProps {
  selectedTypes: string[]
  onChange: (types: string[]) => void
  productCategory?: string
}

export function Step2VariantTypes({
  selectedTypes,
  onChange,
  productCategory,
}: Step2VariantTypesProps) {
  const handleToggle = (typeId: string) => {
    if (selectedTypes.includes(typeId)) {
      onChange(selectedTypes.filter((id) => id !== typeId))
    } else {
      if (selectedTypes.length >= 3) {
        // Maximum 3 variant types
        return
      }
      onChange([...selectedTypes, typeId])
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Select up to 3 variant types that apply to your product.
          </p>
          <Badge variant="outline">
            {selectedTypes.length} / 3 selected
          </Badge>
        </div>

        {selectedTypes.length >= 3 && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Maximum of 3 variant types reached. Deselect one to choose another.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {VARIANT_TYPES.map((type) => {
          const Icon = type.icon
          const isSelected = selectedTypes.includes(type.id)
          const isRecommended = productCategory && type.categories.includes(productCategory)
          const isDisabled = !isSelected && selectedTypes.length >= 3

          return (
            <Card
              key={type.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/20'
                  : isDisabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:border-primary/50'
              }`}
              onClick={() => !isDisabled && handleToggle(type.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm flex items-center gap-2">
                        {type.name}
                        {isRecommended && (
                          <Badge variant="secondary" className="text-xs">
                            Recommended
                          </Badge>
                        )}
                      </CardTitle>
                    </div>
                  </div>
                  <Checkbox
                    checked={isSelected}
                    disabled={isDisabled}
                    onCheckedChange={() => !isDisabled && handleToggle(type.id)}
                  />
                </div>
                <CardDescription className="text-xs">
                  {type.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Examples:</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{type.examples}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Common in:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {type.categories.map((cat) => (
                      <Badge key={cat} variant="outline" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Selection Summary */}
      {selectedTypes.length > 0 && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm font-medium">Your product will have:</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedTypes.map((typeId) => {
              const type = VARIANT_TYPES.find((t) => t.id === typeId)
              if (!type) {return null}
              const Icon = type.icon
              return (
                <div
                  key={typeId}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm"
                >
                  <Icon className="w-4 h-4" />
                  {type.name}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Next, you&apos;ll configure the specific options for each variant type using templates
            or custom values.
          </p>
        </div>
      )}

      {/* Common Combinations Examples */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm font-medium mb-3">Popular Combinations:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2">
            <Badge variant="outline">Clothing</Badge>
            <span className="text-muted-foreground">Size + Color + Material</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline">Jewelry</Badge>
            <span className="text-muted-foreground">Size + Material + Style</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline">Art</Badge>
            <span className="text-muted-foreground">Size + Material + Format</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline">Home</Badge>
            <span className="text-muted-foreground">Size + Color + Material</span>
          </div>
        </div>
      </div>
    </div>
  )
}
