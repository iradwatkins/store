/**
 * TypeScript utility functions for type safety and conversions
 */

import { Decimal } from '@prisma/client/runtime/library'

/**
 * Type guard to check if a value is not null or undefined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Type guard for non-empty strings
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

/**
 * Safely convert Decimal to number
 */
export function decimalToNumber(value: Decimal | null | undefined, fallback: number = 0): number {
  if (!value) {return fallback}
  return value.toNumber()
}

/**
 * Safely convert Decimal to string for display
 */
export function decimalToString(value: Decimal | null | undefined, fallback: string = '0'): string {
  if (!value) {return fallback}
  return value.toString()
}

/**
 * Format Decimal as currency string
 */
export function decimalToCurrency(value: Decimal | null | undefined): string {
  const num = decimalToNumber(value, 0)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num)
}

/**
 * Type guard for Tremor Color types
 */
export type TremorColor =
  | 'slate'
  | 'gray'
  | 'zinc'
  | 'neutral'
  | 'stone'
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'lime'
  | 'green'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'fuchsia'
  | 'pink'
  | 'rose'

export function isTremorColor(value: string | null | undefined): value is TremorColor {
  if (!value) {return false}
  const validColors: TremorColor[] = [
    'slate',
    'gray',
    'zinc',
    'neutral',
    'stone',
    'red',
    'orange',
    'amber',
    'yellow',
    'lime',
    'green',
    'emerald',
    'teal',
    'cyan',
    'sky',
    'blue',
    'indigo',
    'violet',
    'purple',
    'fuchsia',
    'pink',
    'rose',
  ]
  return validColors.includes(value as TremorColor)
}

/**
 * Safely get Tremor color with fallback
 */
export function getTremorColor(
  value: string | null | undefined,
  fallback: TremorColor = 'blue'
): TremorColor {
  return isTremorColor(value) ? value : fallback
}

/**
 * Type guard for Tremor BackgroundColor
 */
export type TremorBackgroundColor =
  | 'slate'
  | 'gray'
  | 'zinc'
  | 'neutral'
  | 'stone'
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'lime'
  | 'green'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'fuchsia'
  | 'pink'
  | 'rose'

export function getTremorBackgroundColor(
  value: string | null | undefined,
  fallback: TremorBackgroundColor = 'blue'
): TremorBackgroundColor {
  return isTremorColor(value) ? (value as TremorBackgroundColor) : fallback
}

/**
 * Safely access nested properties
 */
export function safeGet<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K
): T[K] | undefined {
  return obj?.[key]
}

/**
 * Safely access deeply nested properties
 */
export function safeGetNested<T>(
  obj: any,
  path: string,
  fallback?: T
): T | undefined {
  const keys = path.split('.')
  let result = obj

  for (const key of keys) {
    if (result === null || result === undefined) {
      return fallback
    }
    result = result[key]
  }

  return result ?? fallback
}

/**
 * Assert that a value is defined (throws error if not)
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message: string = 'Value is required'
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message)
  }
}

/**
 * Convert snake_case to camelCase (for Prisma migration)
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Type-safe Object.keys
 */
export function typedKeys<T extends object>(obj: T): Array<keyof T> {
  return Object.keys(obj) as Array<keyof T>
}

/**
 * Type-safe Object.entries
 */
export function typedEntries<T extends object>(
  obj: T
): Array<[keyof T, T[keyof T]]> {
  return Object.entries(obj) as Array<[keyof T, T[keyof T]]>
}

/**
 * Exhaustive check for switch statements
 */
export function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`)
}

/**
 * Parse number with fallback
 */
export function parseNumber(
  value: string | number | null | undefined,
  fallback: number = 0
): number {
  if (typeof value === 'number') {return value}
  if (!value) {return fallback}

  const parsed = parseFloat(value)
  return isNaN(parsed) ? fallback : parsed
}

/**
 * Parse integer with fallback
 */
export function parseInt10(
  value: string | number | null | undefined,
  fallback: number = 0
): number {
  if (typeof value === 'number') {return Math.floor(value)}
  if (!value) {return fallback}

  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? fallback : parsed
}

/**
 * Clamp number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Check if array is non-empty
 */
export function isNonEmptyArray<T>(arr: T[] | null | undefined): arr is [T, ...T[]] {
  return Array.isArray(arr) && arr.length > 0
}

/**
 * Safe array access with fallback
 */
export function safeArrayAccess<T>(
  arr: T[] | null | undefined,
  index: number,
  fallback?: T
): T | undefined {
  if (!arr || index < 0 || index >= arr.length) {
    return fallback
  }
  return arr[index]
}

/**
 * Filter out null and undefined from arrays
 */
export function compact<T>(arr: (T | null | undefined)[]): T[] {
  return arr.filter(isDefined)
}

/**
 * Type-safe hasOwnProperty check
 */
export function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj
}

/**
 * Convert any value to boolean
 */
export function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {return value}
  if (typeof value === 'string') {
    const lower = value.toLowerCase()
    return lower === 'true' || lower === '1' || lower === 'yes'
  }
  if (typeof value === 'number') {return value !== 0}
  return Boolean(value)
}

/**
 * Debounced promise
 */
export function debouncePromise<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: NodeJS.Timeout | null = null
  let pendingPromise: Promise<ReturnType<T>> | null = null

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    if (!pendingPromise) {
      pendingPromise = new Promise((resolve, reject) => {
        timeoutId = setTimeout(async () => {
          try {
            const result = await fn(...args)
            resolve(result)
            pendingPromise = null
          } catch (error) {
            reject(error)
            pendingPromise = null
          }
        }, delay)
      })
    }

    return pendingPromise
  }
}
