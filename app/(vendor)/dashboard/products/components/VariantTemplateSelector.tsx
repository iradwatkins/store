'use client'

/**
 * Variant Template Selector
 *
 * Allows vendors to quickly apply pre-configured templates for common variant types
 * or create custom options
 */

import { useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  SIZE_TEMPLATES,
  COLOR_OPTIONS,
  MATERIAL_OPTIONS,
  STYLE_OPTIONS,
  FINISH_OPTIONS,
  FORMAT_OPTIONS,
} from '@/lib/variant-presets'

interface VariantOption {
  value: string
  displayName: string
  hexColor?: string
  icon?: string
}

interface VariantTemplateSelectorProps {
  variantType: string // SIZE, COLOR, MATERIAL, etc.
  selectedOptions: VariantOption[]
  onChange: (options: VariantOption[], templateId?: string) => void
}

export function VariantTemplateSelector({
  variantType,
  selectedOptions,
  onChange,
}: VariantTemplateSelectorProps) {
  const [customValue, setCustomValue] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  // Get templates based on variant type
  const getTemplates = () => {
    switch (variantType) {
      case 'SIZE':
        return Object.values(SIZE_TEMPLATES)
      case 'COLOR':
        return [{ id: 'standard-colors', name: 'Standard Colors', options: COLOR_OPTIONS }]
      case 'MATERIAL':
        return Object.entries(MATERIAL_OPTIONS).map(([key, options]) => ({
          id: key,
          name: key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          options,
        }))
      case 'STYLE':
        return Object.entries(STYLE_OPTIONS).map(([key, options]) => ({
          id: key,
          name: key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          options,
        }))
      case 'FINISH':
        return Object.entries(FINISH_OPTIONS).map(([key, options]) => ({
          id: key,
          name: key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          options,
        }))
      case 'FORMAT':
        return Object.entries(FORMAT_OPTIONS).map(([key, options]) => ({
          id: key,
          name: key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          options,
        }))
      default:
        return []
    }
  }

  const templates = getTemplates()

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)

    // Find template and convert to VariantOption format
    let options: VariantOption[] = []

    if (variantType === 'SIZE') {
      const template = SIZE_TEMPLATES[templateId]
      if (template) {
        options = template.sizes.map((size) => ({
          value: size,
          displayName: size,
        }))
      }
    } else if (variantType === 'COLOR') {
      options = COLOR_OPTIONS.map((color) => ({
        value: color.name,
        displayName: color.name,
        hexColor: color.hex,
        icon: color.emoji,
      }))
    } else {
      // For other types, find in respective options
      const allOptions = { ...MATERIAL_OPTIONS, ...STYLE_OPTIONS, ...FINISH_OPTIONS, ...FORMAT_OPTIONS }
      const templateOptions = allOptions[templateId as keyof typeof allOptions]
      if (Array.isArray(templateOptions)) {
        options = templateOptions.map((opt) => ({
          value: opt,
          displayName: opt,
        }))
      }
    }

    onChange(options, templateId)
  }

  const handleAddCustomOption = () => {
    if (!customValue.trim()) return

    const newOption: VariantOption = {
      value: customValue.trim(),
      displayName: customValue.trim(),
    }

    onChange([...selectedOptions, newOption])
    setCustomValue('')
    setSelectedTemplate(null) // Clear template selection when adding custom
  }

  const handleRemoveOption = (value: string) => {
    onChange(selectedOptions.filter((opt) => opt.value !== value))
  }

  const isOptionSelected = (value: string) => {
    return selectedOptions.some((opt) => opt.value === value)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="templates">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">Use Templates</TabsTrigger>
          <TabsTrigger value="custom">Custom Options</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {templates.map((template: any) => {
              const isSelected = selectedTemplate === template.id
              const optionCount = template.sizes?.length || template.options?.length || 0

              return (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all ${
                    isSelected ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'
                  }`}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm flex items-center gap-2">
                          {template.icon && <span>{template.icon}</span>}
                          {template.name}
                        </CardTitle>
                        {template.category && (
                          <CardDescription className="text-xs">
                            {template.category}
                          </CardDescription>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="text-xs">
                      {optionCount} options
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      {template.sizes?.slice(0, 5).join(', ') ||
                        template.options?.slice(0, 5).map((o: any) => o.name || o).join(', ')}
                      {optionCount > 5 && '...'}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <div className="space-y-2">
            <Label>Add Custom Option</Label>
            <div className="flex gap-2">
              <Input
                placeholder={`Enter ${variantType.toLowerCase()} option...`}
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCustomOption()
                  }
                }}
              />
              <Button onClick={handleAddCustomOption} disabled={!customValue.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Add your own custom options one at a time. Press Enter or click the + button.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Selected Options Display */}
      {selectedOptions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Selected Options ({selectedOptions.length})</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange([])}
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 p-4 border rounded-lg min-h-[60px]">
            {selectedOptions.map((option) => (
              <div
                key={option.value}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-md"
              >
                {option.icon && <span>{option.icon}</span>}
                {option.hexColor && (
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: option.hexColor }}
                  />
                )}
                <span className="text-sm">{option.displayName}</span>
                <button
                  onClick={() => handleRemoveOption(option.value)}
                  className="ml-1 hover:bg-destructive/10 rounded-sm p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
