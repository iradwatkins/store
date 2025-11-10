'use client'

/**
 * Step 3: Configure Options
 *
 * Configure specific options for each selected variant type using templates or custom values
 */

import { AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { VariantTemplateSelector } from '../VariantTemplateSelector'

interface VariantOption {
  value: string
  displayName: string
  hexColor?: string
  icon?: string
}

interface Step3ConfigureOptionsProps {
  selectedVariantTypes: string[]
  variantOptions: Record<string, {
    useTemplate?: string
    customOptions: string[]
    selectedPresetOptions: VariantOption[]
  }>
  onChange: (variantOptions: Record<string, {
    useTemplate?: string
    customOptions: string[]
    selectedPresetOptions: VariantOption[]
  }>) => void
}

const VARIANT_TYPE_INFO: Record<string, { name: string; description: string }> = {
  SIZE: {
    name: 'Size',
    description: 'Configure size options for your product',
  },
  COLOR: {
    name: 'Color',
    description: 'Select color options with visual swatches',
  },
  MATERIAL: {
    name: 'Material',
    description: 'Choose materials your product is made from',
  },
  STYLE: {
    name: 'Style',
    description: 'Define style variations',
  },
  FINISH: {
    name: 'Finish',
    description: 'Specify surface finishes',
  },
  FORMAT: {
    name: 'Format',
    description: 'Set delivery or packaging formats',
  },
}

export function Step3ConfigureOptions({
  selectedVariantTypes,
  variantOptions,
  onChange,
}: Step3ConfigureOptionsProps) {
  const handleOptionsChange = (
    variantType: string,
    options: VariantOption[],
    templateId?: string
  ) => {
    const customOptions = options.filter(opt =>
      !opt.hexColor && !opt.icon // Custom options don't have color/icon from templates
    ).map(opt => opt.value)

    const presetOptions = options.filter(opt =>
      opt.hexColor || opt.icon // Preset options have color/icon
    )

    onChange({
      ...variantOptions,
      [variantType]: {
        useTemplate: templateId,
        customOptions: customOptions.length > 0 ? customOptions :
          (variantOptions[variantType]?.customOptions || []),
        selectedPresetOptions: presetOptions.length > 0 ? presetOptions : options,
      },
    })
  }

  const getSelectedOptions = (variantType: string): VariantOption[] => {
    const options = variantOptions[variantType]
    if (!options) {return []}

    // Combine preset options and custom options
    const allOptions = [...options.selectedPresetOptions]

    // Add custom options that aren't already in preset options
    options.customOptions.forEach(custom => {
      if (!allOptions.find(opt => opt.value === custom)) {
        allOptions.push({
          value: custom,
          displayName: custom,
        })
      }
    })

    return allOptions
  }

  const getTotalCombinations = () => {
    let total = 1
    selectedVariantTypes.forEach(type => {
      const options = getSelectedOptions(type)
      if (options.length > 0) {
        total *= options.length
      }
    })
    return total
  }

  const isComplete = selectedVariantTypes.every(type => {
    const options = getSelectedOptions(type)
    return options.length > 0
  })

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
          Configure options for each variant type
        </p>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
          You can use pre-made templates for quick setup or add custom options.
        </p>
      </div>

      {/* Variant Type Configuration */}
      <Accordion type="multiple" defaultValue={selectedVariantTypes} className="space-y-3">
        {selectedVariantTypes.map((variantType, index) => {
          const info = VARIANT_TYPE_INFO[variantType]
          const selectedOptions = getSelectedOptions(variantType)
          const hasOptions = selectedOptions.length > 0

          return (
            <AccordionItem
              key={variantType}
              value={variantType}
              className="border rounded-lg px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{info.name}</span>
                      {hasOptions ? (
                        <Badge variant="default" className="ml-2">
                          {selectedOptions.length} options
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="ml-2">
                          Not configured
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {info.description}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <VariantTemplateSelector
                  variantType={variantType}
                  selectedOptions={selectedOptions}
                  onChange={(options, templateId) =>
                    handleOptionsChange(variantType, options, templateId)
                  }
                />
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      {/* Combinations Preview */}
      {isComplete && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Variant Combinations</CardTitle>
            <CardDescription className="text-xs">
              Based on your selections, we&apos;ll generate the following combinations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total combinations:</span>
                <Badge variant="default" className="text-lg">
                  {getTotalCombinations()}
                </Badge>
              </div>

              <div className="space-y-2">
                {selectedVariantTypes.map(type => {
                  const options = getSelectedOptions(type)
                  return (
                    <div key={type} className="flex items-start gap-2 text-sm">
                      <span className="font-medium min-w-[80px]">
                        {VARIANT_TYPE_INFO[type].name}:
                      </span>
                      <span className="text-muted-foreground">
                        {options.length} options
                      </span>
                    </div>
                  )
                })}
              </div>

              {getTotalCombinations() > 100 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
                      Large number of combinations
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      You&apos;re creating {getTotalCombinations()} variant combinations. Consider using bulk
                      settings in the next step to speed up configuration.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Incomplete Warning */}
      {!isComplete && (
        <div className="flex items-start gap-2 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              Configure all variant types to proceed
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Each variant type needs at least one option before you can continue.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
