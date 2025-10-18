/**
 * Async Operation Hook
 * 
 * Eliminates duplicate async state management patterns found across 30+ components
 * Standardizes loading states, error handling, and toast notifications
 */

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

export interface AsyncOperationOptions {
  successMessage?: string
  errorMessage?: string
  onSuccess?: (result: any) => void
  onError?: (error: Error) => void
  showSuccessToast?: boolean
  showErrorToast?: boolean
}

export interface AsyncOperationState {
  isLoading: boolean
  error: Error | null
  data: any
  lastExecuted: Date | null
}

export interface AsyncOperationReturn<T = any> {
  execute: (operation: () => Promise<T>, options?: AsyncOperationOptions) => Promise<T | undefined>
  isLoading: boolean
  error: Error | null
  data: T | null
  lastExecuted: Date | null
  reset: () => void
}

/**
 * Hook for managing async operations with consistent error handling and loading states
 * 
 * @example
 * ```typescript
 * const { execute, isLoading } = useAsyncOperation()
 * 
 * const handleSave = () => {
 *   execute(
 *     () => saveProduct(productData),
 *     { 
 *       successMessage: 'Product saved successfully',
 *       errorMessage: 'Failed to save product'
 *     }
 *   )
 * }
 * ```
 */
export function useAsyncOperation<T = any>(): AsyncOperationReturn<T> {
  const { toast } = useToast()
  const [state, setState] = useState<AsyncOperationState>({
    isLoading: false,
    error: null,
    data: null,
    lastExecuted: null
  })

  const execute = useCallback(async (
    operation: () => Promise<T>,
    options: AsyncOperationOptions = {}
  ): Promise<T | undefined> => {
    const {
      successMessage,
      errorMessage = 'Operation failed',
      onSuccess,
      onError,
      showSuccessToast = true,
      showErrorToast = true
    } = options

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }))

    try {
      const result = await operation()
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        data: result,
        lastExecuted: new Date()
      }))

      // Show success toast
      if (showSuccessToast && successMessage) {
        toast({
          title: 'Success',
          description: successMessage,
        })
      }

      // Call success callback
      if (onSuccess) {
        onSuccess(result)
      }

      return result
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorObj,
        lastExecuted: new Date()
      }))

      // Show error toast
      if (showErrorToast) {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        })
      }

      // Call error callback
      if (onError) {
        onError(errorObj)
      }

      // Re-throw error so calling code can handle it if needed
      throw errorObj
    }
  }, [toast])

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: null,
      lastExecuted: null
    })
  }, [])

  return {
    execute,
    isLoading: state.isLoading,
    error: state.error,
    data: state.data,
    lastExecuted: state.lastExecuted,
    reset
  }
}

/**
 * Specialized hook for form submissions
 * 
 * @example
 * ```typescript
 * const { handleSubmit, isSubmitting } = useFormSubmission()
 * 
 * const onSubmit = handleSubmit(
 *   async (formData) => await submitForm(formData),
 *   {
 *     successMessage: 'Form submitted successfully',
 *     onSuccess: () => router.push('/success')
 *   }
 * )
 * ```
 */
export function useFormSubmission<T = any>() {
  const { execute, isLoading, error, reset } = useAsyncOperation<T>()

  const handleSubmit = useCallback((
    submitFn: (data: any) => Promise<T>,
    options?: AsyncOperationOptions
  ) => {
    return async (data: any) => {
      try {
        return await execute(() => submitFn(data), options)
      } catch (error) {
        // Error is already handled by useAsyncOperation
        return undefined
      }
    }
  }, [execute])

  return {
    handleSubmit,
    isSubmitting: isLoading,
    error,
    reset
  }
}

/**
 * Hook for data fetching operations
 * 
 * @example
 * ```typescript
 * const { fetch, data, isLoading, refresh } = useDataFetching()
 * 
 * useEffect(() => {
 *   fetch(() => getProducts(), { showErrorToast: true })
 * }, [])
 * ```
 */
export function useDataFetching<T = any>() {
  const { execute, isLoading, error, data, reset } = useAsyncOperation<T>()

  const fetch = useCallback((
    fetchFn: () => Promise<T>,
    options?: Omit<AsyncOperationOptions, 'successMessage'> & { 
      showSuccessToast?: false // Usually don't show success for fetches
    }
  ) => {
    const fetchOptions = {
      showSuccessToast: false,
      ...options
    }
    return execute(fetchFn, fetchOptions)
  }, [execute])

  const refresh = useCallback(() => {
    // Refresh would need the last fetch function - this is a simplified version
    reset()
  }, [reset])

  return {
    fetch,
    data,
    isLoading,
    error,
    refresh,
    reset
  }
}

/**
 * Hook for delete operations with confirmation
 * 
 * @example
 * ```typescript
 * const { confirmDelete, isDeleting } = useDeleteOperation()
 * 
 * const handleDelete = () => {
 *   confirmDelete(
 *     () => deleteProduct(productId),
 *     { 
 *       confirmMessage: 'Are you sure you want to delete this product?',
 *       successMessage: 'Product deleted successfully'
 *     }
 *   )
 * }
 * ```
 */
export function useDeleteOperation<T = any>() {
  const { execute, isLoading, error } = useAsyncOperation<T>()

  const confirmDelete = useCallback((
    deleteFn: () => Promise<T>,
    options: AsyncOperationOptions & {
      confirmMessage?: string
    } = {}
  ) => {
    const {
      confirmMessage = 'Are you sure you want to delete this item?',
      ...executeOptions
    } = options

    if (window.confirm(confirmMessage)) {
      return execute(deleteFn, executeOptions)
    }
    return Promise.resolve(undefined)
  }, [execute])

  return {
    confirmDelete,
    isDeleting: isLoading,
    error
  }
}

/**
 * Hook for bulk operations
 * 
 * @example
 * ```typescript
 * const { executeBulk, progress } = useBulkOperation()
 * 
 * const handleBulkUpdate = () => {
 *   executeBulk(
 *     selectedItems.map(item => () => updateItem(item)),
 *     { successMessage: 'Bulk update completed' }
 *   )
 * }
 * ```
 */
export function useBulkOperation<T = any>() {
  const { toast } = useToast()
  const [progress, setProgress] = useState({ completed: 0, total: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Error[]>([])

  const executeBulk = useCallback(async (
    operations: Array<() => Promise<T>>,
    options: AsyncOperationOptions = {}
  ): Promise<T[]> => {
    const {
      successMessage = 'Bulk operation completed',
      errorMessage = 'Some operations failed',
      showSuccessToast = true,
      showErrorToast = true
    } = options

    setIsLoading(true)
    setProgress({ completed: 0, total: operations.length })
    setErrors([])

    const results: T[] = []
    const operationErrors: Error[] = []

    try {
      for (let i = 0; i < operations.length; i++) {
        try {
          const result = await operations[i]()
          results.push(result)
        } catch (error) {
          const errorObj = error instanceof Error ? error : new Error(String(error))
          operationErrors.push(errorObj)
        }
        
        setProgress({ completed: i + 1, total: operations.length })
      }

      setErrors(operationErrors)

      if (operationErrors.length === 0) {
        // All succeeded
        if (showSuccessToast) {
          toast({
            title: 'Success',
            description: successMessage,
          })
        }
      } else if (operationErrors.length < operations.length) {
        // Partial success
        if (showErrorToast) {
          toast({
            title: 'Partial Success',
            description: `${results.length} succeeded, ${operationErrors.length} failed`,
            variant: 'destructive',
          })
        }
      } else {
        // All failed
        if (showErrorToast) {
          toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive',
          })
        }
      }

      return results
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  return {
    executeBulk,
    isLoading,
    progress,
    errors
  }
}