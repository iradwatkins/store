'use client'

/**
 * Product Variant Wizard
 *
 * Multi-step wizard for creating products with multi-dimensional variants
 * Supports Size + Color + Material combinations, bulk operations, and add-ons
 */

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Check, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'

// Wizard step configuration
const WIZARD_STEPS = [
  {
    id: 'type',
    title: 'Product Type',
    description: 'Choose between simple product or variants',
  },
  {
    id: 'variant-types',
    title: 'Variant Types',
    description: 'Select variant dimensions (Size, Color, Material)',
  },
  {
    id: 'configure-options',
    title: 'Configure Options',
    description: 'Use templates or create custom options',
  },
  {
    id: 'bulk-settings',
    title: 'Bulk Settings',
    description: 'Set default pricing and inventory',
  },
  {
    id: 'review',
    title: 'Review & Generate',
    description: 'Review and generate variant combinations',
  },
]

export interface VariantWizardData {
  // Step 1: Product type
  hasVariants: boolean

  // Step 2: Variant types
  selectedVariantTypes: string[]

  // Step 3: Options per type
  variantOptions: Record<string, {
    useTemplate?: string
    customOptions: string[]
    selectedPresetOptions: Array<{
      value: string
      displayName: string
      hexColor?: string
      icon?: string
    }>
  }>

  // Step 4: Bulk settings
  bulkSettings: {
    applyDefaultPrice: boolean
    defaultPrice?: number
    applyDefaultInventory: boolean
    defaultInventory?: number
    generateSkus: boolean
    skuPattern?: string
  }

  // Step 5: Individual overrides (optional)
  variantOverrides: Record<string, {
    price?: number
    sku?: string
    quantity?: number
    available?: boolean
  }>

  // Add-ons
  addons: Array<{
    name: string
    description?: string
    price: number
    isRequired: boolean
  }>
}

interface ProductVariantWizardProps {
  productId?: string // If editing existing product
  initialData?: Partial<VariantWizardData>
  onComplete: (data: VariantWizardData) => Promise<void>
  onCancel: () => void
  onSaveDraft?: (data: Partial<VariantWizardData>) => Promise<void>
}

export function ProductVariantWizard({
  productId,
  initialData,
  onComplete,
  onCancel,
  onSaveDraft,
}: ProductVariantWizardProps) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [wizardData, setWizardData] = useState<Partial<VariantWizardData>>(
    initialData || {
      hasVariants: false,
      selectedVariantTypes: [],
      variantOptions: {},
      bulkSettings: {
        applyDefaultPrice: true,
        applyDefaultInventory: true,
        generateSkus: true,
      },
      variantOverrides: {},
      addons: [],
    }
  )

  const currentStepConfig = WIZARD_STEPS[currentStep]
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100

  const updateWizardData = (updates: Partial<VariantWizardData>) => {
    setWizardData((prev) => ({ ...prev, ...updates }))
  }

  const handleNext = () => {
    // Validate current step before proceeding
    if (currentStep === 0 && wizardData.hasVariants === undefined) {
      toast({
        title: 'Selection Required',
        description: 'Please select a product type',
        variant: 'destructive',
      })
      return
    }

    if (currentStep === 1 && wizardData.selectedVariantTypes?.length === 0) {
      toast({
        title: 'Selection Required',
        description: 'Please select at least one variant type',
        variant: 'destructive',
      })
      return
    }

    setCurrentStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1))
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const handleSaveDraft = async () => {
    if (!onSaveDraft) return

    setIsSaving(true)
    try {
      await onSaveDraft(wizardData)
      toast({
        title: 'Draft Saved',
        description: 'Your progress has been saved',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save draft',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleComplete = async () => {
    setIsSaving(true)
    try {
      await onComplete(wizardData as VariantWizardData)
      toast({
        title: 'Success',
        description: 'Product variants created successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create product variants',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Step {currentStep + 1} of {WIZARD_STEPS.length}
          </span>
          <span className="text-muted-foreground">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {WIZARD_STEPS.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center ${
              index < WIZARD_STEPS.length - 1 ? 'flex-1' : ''
            }`}
          >
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  index < currentStep
                    ? 'bg-primary border-primary text-primary-foreground'
                    : index === currentStep
                    ? 'border-primary text-primary'
                    : 'border-muted text-muted-foreground'
                }`}
              >
                {index < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <span className="text-xs mt-1 text-center max-w-[100px]">
                {step.title}
              </span>
            </div>
            {index < WIZARD_STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 ${
                  index < currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{currentStepConfig.title}</CardTitle>
          <CardDescription>{currentStepConfig.description}</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[400px]">
          {/* Step components will be rendered here */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Step 1 content will be implemented in separate component
              </p>
            </div>
          )}
          {currentStep === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Step 2 content will be implemented in separate component
              </p>
            </div>
          )}
          {/* Additional steps will be added */}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>

        <div className="flex items-center gap-2">
          {onSaveDraft && (
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
          )}

          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isSaving}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}

          {currentStep < WIZARD_STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={isSaving}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={isSaving}>
              <Check className="w-4 h-4 mr-2" />
              Complete
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
