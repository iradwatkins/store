/**
 * Form Validation Hook
 * 
 * Eliminates duplicate form validation patterns across components
 * Provides consistent validation logic and error handling
 */

import { useState, useCallback, useMemo } from 'react'
import { z, ZodSchema, ZodError } from 'zod'

export interface FormField<T = any> {
  value: T
  error: string | null
  touched: boolean
  dirty: boolean
}

export interface FormState<T extends Record<string, any>> {
  fields: { [K in keyof T]: FormField<T[K]> }
  isValid: boolean
  isDirty: boolean
  hasErrors: boolean
  touchedFields: (keyof T)[]
  dirtyFields: (keyof T)[]
}

export interface FormValidationOptions<T> {
  schema?: ZodSchema<T>
  validateOnChange?: boolean
  validateOnBlur?: boolean
  customValidators?: {
    [K in keyof T]?: (value: T[K], allValues: T) => string | null
  }
}

export interface FormValidationReturn<T extends Record<string, any>> {
  formState: FormState<T>
  setValue: (field: keyof T, value: T[keyof T]) => void
  setError: (field: keyof T, error: string) => void
  clearError: (field: keyof T) => void
  setTouched: (field: keyof T, touched?: boolean) => void
  validateField: (field: keyof T) => boolean
  validateAll: () => boolean
  reset: (newValues?: Partial<T>) => void
  getFieldProps: (field: keyof T) => {
    value: T[keyof T]
    onChange: (value: T[keyof T]) => void
    onBlur: () => void
    error: string | null
    touched: boolean
  }
}

/**
 * Hook for comprehensive form validation with Zod integration
 * 
 * @example
 * ```typescript
 * const schema = z.object({
 *   name: z.string().min(3),
 *   email: z.string().email(),
 *   price: z.number().min(0)
 * })
 * 
 * const { formState, setValue, validateAll, getFieldProps } = useFormValidation({
 *   name: '',
 *   email: '',
 *   price: 0
 * }, { schema, validateOnChange: true })
 * 
 * const nameProps = getFieldProps('name')
 * // <Input {...nameProps} />
 * ```
 */
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  options: FormValidationOptions<T> = {}
): FormValidationReturn<T> {
  const {
    schema,
    validateOnChange = false,
    validateOnBlur = true,
    customValidators = {}
  } = options

  // Initialize form state
  const [formState, setFormState] = useState<FormState<T>>(() => {
    const fields = {} as { [K in keyof T]: FormField<T[K]> }
    
    for (const key in initialValues) {
      fields[key] = {
        value: initialValues[key],
        error: null,
        touched: false,
        dirty: false
      }
    }

    return {
      fields,
      isValid: true,
      isDirty: false,
      hasErrors: false,
      touchedFields: [],
      dirtyFields: []
    }
  })

  // Validate a single field
  const validateField = useCallback((field: keyof T): boolean => {
    const fieldValue = formState.fields[field].value
    const allValues = Object.keys(formState.fields).reduce((acc, key) => {
      acc[key] = formState.fields[key].value
      return acc
    }, {} as T)

    let error: string | null = null

    // Custom validator first
    if (customValidators[field]) {
      error = customValidators[field]!(fieldValue, allValues)
    }

    // Schema validation if no custom error
    if (!error && schema) {
      try {
        const fieldSchema = schema.shape?.[field as string]
        if (fieldSchema) {
          fieldSchema.parse(fieldValue)
        }
      } catch (e) {
        if (e instanceof ZodError) {
          error = e.errors[0]?.message || 'Invalid value'
        }
      }
    }

    setFormState(prev => {
      const newFields = { ...prev.fields }
      newFields[field] = { ...newFields[field], error }

      const hasErrors = Object.values(newFields).some(f => f.error !== null)
      const touchedFields = Object.keys(newFields).filter(
        key => newFields[key as keyof T].touched
      ) as (keyof T)[]
      const dirtyFields = Object.keys(newFields).filter(
        key => newFields[key as keyof T].dirty
      ) as (keyof T)[]

      return {
        fields: newFields,
        isValid: !hasErrors,
        isDirty: dirtyFields.length > 0,
        hasErrors,
        touchedFields,
        dirtyFields
      }
    })

    return error === null
  }, [formState.fields, schema, customValidators])

  // Validate all fields
  const validateAll = useCallback((): boolean => {
    const allValues = Object.keys(formState.fields).reduce((acc, key) => {
      acc[key] = formState.fields[key].value
      return acc
    }, {} as T)

    const newFields = { ...formState.fields }
    let allValid = true

    // Validate with schema first
    if (schema) {
      try {
        schema.parse(allValues)
        // Clear all schema-related errors
        Object.keys(newFields).forEach(key => {
          if (!customValidators[key as keyof T]) {
            newFields[key as keyof T] = { ...newFields[key as keyof T], error: null }
          }
        })
      } catch (e) {
        if (e instanceof ZodError) {
          e.errors.forEach(error => {
            const field = error.path[0] as keyof T
            if (field && newFields[field]) {
              newFields[field] = { ...newFields[field], error: error.message }
              allValid = false
            }
          })
        }
      }
    }

    // Apply custom validators
    Object.keys(customValidators).forEach(key => {
      const field = key as keyof T
      const validator = customValidators[field]!
      const error = validator(newFields[field].value, allValues)
      
      if (error) {
        newFields[field] = { ...newFields[field], error }
        allValid = false
      }
    })

    const hasErrors = Object.values(newFields).some(f => f.error !== null)
    const touchedFields = Object.keys(newFields).filter(
      key => newFields[key as keyof T].touched
    ) as (keyof T)[]
    const dirtyFields = Object.keys(newFields).filter(
      key => newFields[key as keyof T].dirty
    ) as (keyof T)[]

    setFormState(prev => ({
      fields: newFields,
      isValid: allValid,
      isDirty: dirtyFields.length > 0,
      hasErrors,
      touchedFields,
      dirtyFields
    }))

    return allValid
  }, [formState.fields, schema, customValidators])

  // Set field value
  const setValue = useCallback((field: keyof T, value: T[keyof T]) => {
    setFormState(prev => {
      const newFields = { ...prev.fields }
      const originalValue = initialValues[field]
      
      newFields[field] = {
        ...newFields[field],
        value,
        dirty: value !== originalValue
      }

      const dirtyFields = Object.keys(newFields).filter(
        key => newFields[key as keyof T].dirty
      ) as (keyof T)[]

      return {
        ...prev,
        fields: newFields,
        isDirty: dirtyFields.length > 0,
        dirtyFields
      }
    })

    // Validate on change if enabled
    if (validateOnChange) {
      setTimeout(() => validateField(field), 0)
    }
  }, [validateOnChange, validateField, initialValues])

  // Set field error
  const setError = useCallback((field: keyof T, error: string) => {
    setFormState(prev => {
      const newFields = { ...prev.fields }
      newFields[field] = { ...newFields[field], error }

      const hasErrors = Object.values(newFields).some(f => f.error !== null)

      return {
        ...prev,
        fields: newFields,
        isValid: !hasErrors,
        hasErrors
      }
    })
  }, [])

  // Clear field error
  const clearError = useCallback((field: keyof T) => {
    setFormState(prev => {
      const newFields = { ...prev.fields }
      newFields[field] = { ...newFields[field], error: null }

      const hasErrors = Object.values(newFields).some(f => f.error !== null)

      return {
        ...prev,
        fields: newFields,
        isValid: !hasErrors,
        hasErrors
      }
    })
  }, [])

  // Set field touched
  const setTouched = useCallback((field: keyof T, touched = true) => {
    setFormState(prev => {
      const newFields = { ...prev.fields }
      newFields[field] = { ...newFields[field], touched }

      const touchedFields = Object.keys(newFields).filter(
        key => newFields[key as keyof T].touched
      ) as (keyof T)[]

      return {
        ...prev,
        fields: newFields,
        touchedFields
      }
    })

    // Validate on blur if enabled and field is touched
    if (validateOnBlur && touched) {
      setTimeout(() => validateField(field), 0)
    }
  }, [validateOnBlur, validateField])

  // Reset form
  const reset = useCallback((newValues?: Partial<T>) => {
    const resetValues = { ...initialValues, ...newValues }
    const fields = {} as { [K in keyof T]: FormField<T[K]> }
    
    for (const key in resetValues) {
      fields[key] = {
        value: resetValues[key],
        error: null,
        touched: false,
        dirty: false
      }
    }

    setFormState({
      fields,
      isValid: true,
      isDirty: false,
      hasErrors: false,
      touchedFields: [],
      dirtyFields: []
    })
  }, [initialValues])

  // Get field props for easy integration
  const getFieldProps = useCallback((field: keyof T) => ({
    value: formState.fields[field].value,
    onChange: (value: T[keyof T]) => setValue(field, value),
    onBlur: () => setTouched(field, true),
    error: formState.fields[field].error,
    touched: formState.fields[field].touched
  }), [formState.fields, setValue, setTouched])

  return {
    formState,
    setValue,
    setError,
    clearError,
    setTouched,
    validateField,
    validateAll,
    reset,
    getFieldProps
  }
}

/**
 * Predefined validation schemas for common form types
 */
export const validationSchemas = {
  // Product form validation
  product: z.object({
    name: z.string().min(3, 'Product name must be at least 3 characters'),
    description: z.string().min(20, 'Description must be at least 20 characters'),
    price: z.number().min(0.01, 'Price must be greater than 0'),
    category: z.string().min(1, 'Please select a category'),
    sku: z.string().optional(),
    quantity: z.number().int().min(0, 'Quantity must be 0 or greater')
  }),

  // Store settings validation
  store: z.object({
    name: z.string().min(3, 'Store name must be at least 3 characters'),
    description: z.string().optional(),
    slug: z.string().min(3, 'Slug must be at least 3 characters').regex(
      /^[a-z0-9-]+$/,
      'Slug can only contain lowercase letters, numbers, and hyphens'
    )
  }),

  // User profile validation
  userProfile: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address')
  }),

  // Shipping settings validation
  shipping: z.object({
    name: z.string().min(1, 'Shipping method name is required'),
    price: z.number().min(0, 'Price must be 0 or greater'),
    estimatedDays: z.number().int().min(1, 'Estimated days must be at least 1')
  }),

  // Coupon validation
  coupon: z.object({
    code: z.string().min(3, 'Coupon code must be at least 3 characters').regex(
      /^[A-Z0-9-_]+$/,
      'Coupon code can only contain uppercase letters, numbers, hyphens, and underscores'
    ),
    name: z.string().min(1, 'Coupon name is required'),
    value: z.number().min(0.01, 'Value must be greater than 0'),
    minimumOrderAmount: z.number().min(0, 'Minimum order amount must be 0 or greater').optional()
  })
}

/**
 * Hook for wizard-style multi-step forms
 */
export function useWizardForm<T extends Record<string, any>>(
  steps: string[],
  initialValues: T,
  options: FormValidationOptions<T> = {}
) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  
  const validation = useFormValidation(initialValues, options)

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStep(step)
    }
  }, [steps.length])

  const nextStep = useCallback(() => {
    if (validation.validateAll() && currentStep < steps.length - 1) {
      setCompletedSteps(prev => [...new Set([...prev, currentStep])])
      setCurrentStep(prev => prev + 1)
      return true
    }
    return false
  }, [validation, currentStep, steps.length])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      return true
    }
    return false
  }, [currentStep])

  const isStepComplete = useCallback((step: number) => {
    return completedSteps.includes(step)
  }, [completedSteps])

  const progress = useMemo(() => {
    return ((currentStep + 1) / steps.length) * 100
  }, [currentStep, steps.length])

  return {
    ...validation,
    currentStep,
    currentStepName: steps[currentStep],
    totalSteps: steps.length,
    progress,
    completedSteps,
    goToStep,
    nextStep,
    prevStep,
    isStepComplete,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === steps.length - 1
  }
}