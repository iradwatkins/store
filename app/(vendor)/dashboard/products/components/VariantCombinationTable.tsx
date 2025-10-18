'use client'

/**
 * Variant Combination Management Table
 * 
 * Display and manage all variant combinations for a multi-variant product
 * Features: inline editing, bulk operations, inventory tracking
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { MoreHorizontal, Edit2, Save, X, Package, DollarSign, Hash, Image, Upload, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { useRef } from 'react'

interface VariantCombination {
  id: string
  combinationKey: string
  optionValues: Record<string, string>
  sku?: string
  price?: number
  compareAtPrice?: number
  quantity: number
  available: boolean
  inStock: boolean
  imageUrl?: string
  sortOrder: number
}

interface VariantCombinationTableProps {
  productId: string
  combinations: VariantCombination[]
  variantTypes: string[]
  basePrice: number
  onUpdate: () => void // Callback to refresh data
}

export function VariantCombinationTable({
  productId,
  combinations,
  variantTypes,
  basePrice,
  onUpdate
}: VariantCombinationTableProps) {
  const { toast } = useToast()
  const [editingCells, setEditingCells] = useState<Record<string, any>>({})
  const [selectedCombinations, setSelectedCombinations] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [bulkAction, setBulkAction] = useState<string>('')
  const [bulkValue, setBulkValue] = useState<string>('')
  const [uploadingImageFor, setUploadingImageFor] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Format combination display name
  const formatCombinationName = (optionValues: Record<string, string>) => {
    return variantTypes
      .map(type => `${type}: ${optionValues[type] || 'N/A'}`)
      .join(' | ')
  }

  // Handle cell editing
  const startEditing = (combinationId: string, field: string, currentValue: any) => {
    setEditingCells({
      ...editingCells,
      [`${combinationId}-${field}`]: currentValue
    })
  }

  const cancelEditing = (combinationId: string, field: string) => {
    const key = `${combinationId}-${field}`
    const newEditingCells = { ...editingCells }
    delete newEditingCells[key]
    setEditingCells(newEditingCells)
  }

  const saveEdit = async (combinationId: string, field: string) => {
    const key = `${combinationId}-${field}`
    const newValue = editingCells[key]
    
    try {
      setIsLoading(true)
      const response = await fetch(`/api/vendor/products/${productId}/variants/combinations/${combinationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [field]: field === 'price' || field === 'compareAtPrice' 
            ? parseFloat(newValue) || null 
            : field === 'quantity' 
              ? parseInt(newValue) || 0
              : newValue
        })
      })

      if (!response.ok) throw new Error('Failed to update')

      cancelEditing(combinationId, field)
      onUpdate()
      
      toast({
        title: 'Updated',
        description: `${field} updated successfully`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to update ${field}`,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle bulk operations
  const handleBulkOperation = async () => {
    if (!bulkAction || selectedCombinations.length === 0) return

    try {
      setIsLoading(true)
      const updates: any = {}

      switch (bulkAction) {
        case 'price':
          updates.price = parseFloat(bulkValue) || null
          break
        case 'quantity':
          updates.quantity = parseInt(bulkValue) || 0
          break
        case 'available':
          updates.available = bulkValue === 'true'
          break
        case 'sku-prefix':
          // Handle SKU prefix separately for each combination
          for (const combinationId of selectedCombinations) {
            const combination = combinations.find(c => c.id === combinationId)
            if (combination) {
              const suffix = combination.combinationKey.replace(/[:|]/g, '-').toLowerCase()
              await fetch(`/api/vendor/products/${productId}/variants/combinations/${combinationId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sku: `${bulkValue}-${suffix}` })
              })
            }
          }
          setSelectedCombinations([])
          setBulkAction('')
          setBulkValue('')
          onUpdate()
          toast({
            title: 'Bulk Update Complete',
            description: `Updated ${selectedCombinations.length} combinations`,
          })
          return
      }

      const response = await fetch(`/api/vendor/products/${productId}/variants/bulk`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filter: { combinationKeys: selectedCombinations },
          updates
        })
      })

      if (!response.ok) throw new Error('Bulk update failed')

      setSelectedCombinations([])
      setBulkAction('')
      setBulkValue('')
      onUpdate()
      
      toast({
        title: 'Bulk Update Complete',
        description: `Updated ${selectedCombinations.length} combinations`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Bulk update failed',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle image upload
  const handleImageUpload = async (combinationId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file',
        variant: 'destructive',
      })
      return
    }

    try {
      setUploadingImageFor(combinationId)
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch(`/api/vendor/products/${productId}/variants/combinations/${combinationId}/image`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to upload image')

      const { imageUrl } = await response.json()

      toast({
        title: 'Image uploaded',
        description: 'Variant image updated successfully',
      })

      onUpdate()
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload variant image',
        variant: 'destructive',
      })
    } finally {
      setUploadingImageFor(null)
    }
  }

  // Handle image deletion
  const handleImageDelete = async (combinationId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/vendor/products/${productId}/variants/combinations/${combinationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: null })
      })

      if (!response.ok) throw new Error('Failed to delete image')

      toast({
        title: 'Image removed',
        description: 'Variant image deleted successfully',
      })

      onUpdate()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete variant image',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle combination selection
  const toggleCombination = (combinationId: string) => {
    setSelectedCombinations(prev =>
      prev.includes(combinationId)
        ? prev.filter(id => id !== combinationId)
        : [...prev, combinationId]
    )
  }

  const toggleAll = () => {
    setSelectedCombinations(
      selectedCombinations.length === combinations.length 
        ? [] 
        : combinations.map(c => c.id)
    )
  }

  return (
    <div className="space-y-4">
      {/* Bulk Operations */}
      {selectedCombinations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Bulk Operations ({selectedCombinations.length} selected)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Set Price</SelectItem>
                  <SelectItem value="quantity">Set Quantity</SelectItem>
                  <SelectItem value="available">Set Availability</SelectItem>
                  <SelectItem value="sku-prefix">Set SKU Prefix</SelectItem>
                </SelectContent>
              </Select>

              {bulkAction === 'available' ? (
                <Select value={bulkValue} onValueChange={setBulkValue}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Available</SelectItem>
                    <SelectItem value="false">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder={
                    bulkAction === 'price' ? 'Enter price' :
                    bulkAction === 'quantity' ? 'Enter quantity' :
                    bulkAction === 'sku-prefix' ? 'Enter SKU prefix' : 'Enter value'
                  }
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  className="w-40"
                />
              )}

              <Button 
                onClick={handleBulkOperation}
                disabled={!bulkAction || !bulkValue || isLoading}
                size="sm"
              >
                Apply to {selectedCombinations.length} items
              </Button>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedCombinations([])}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Combinations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Variant Combinations ({combinations.length})
          </CardTitle>
          <CardDescription>
            Manage pricing, inventory, and availability for each variant combination
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedCombinations.length === combinations.length}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead className="w-44">Image</TableHead>
                  <TableHead className="w-32">SKU</TableHead>
                  <TableHead className="w-32">Price</TableHead>
                  <TableHead className="w-24">Quantity</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {combinations.map((combination) => (
                  <TableRow key={combination.id}>
                    {/* Selection checkbox */}
                    <TableCell>
                      <Checkbox
                        checked={selectedCombinations.includes(combination.id)}
                        onCheckedChange={() => toggleCombination(combination.id)}
                      />
                    </TableCell>

                    {/* Variant name */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
                          {formatCombinationName(combination.optionValues)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {combination.combinationKey}
                        </div>
                      </div>
                    </TableCell>

                    {/* Image */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="relative group">
                          {combination.imageUrl ? (
                            <div className="relative">
                              <img
                                src={combination.imageUrl}
                                alt="Variant"
                                className="w-12 h-12 object-cover rounded border-2 border-gray-200"
                              />
                              <button
                                onClick={() => handleImageDelete(combination.id)}
                                disabled={isLoading}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                title="Remove image"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                              <Image className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <input
                            ref={(el) => fileInputRefs.current[combination.id] = el}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleImageUpload(combination.id, file)
                            }}
                            className="hidden"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => fileInputRefs.current[combination.id]?.click()}
                            disabled={uploadingImageFor === combination.id}
                            className="h-7 text-xs"
                          >
                            {uploadingImageFor === combination.id ? (
                              <><Upload className="h-3 w-3 mr-1 animate-pulse" /> Uploading...</>
                            ) : (
                              <><Upload className="h-3 w-3 mr-1" /> {combination.imageUrl ? 'Change' : 'Upload'}</>
                            )}
                          </Button>
                        </div>
                      </div>
                    </TableCell>

                    {/* SKU */}
                    <TableCell>
                      {editingCells[`${combination.id}-sku`] !== undefined ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editingCells[`${combination.id}-sku`] || ''}
                            onChange={(e) => setEditingCells({
                              ...editingCells,
                              [`${combination.id}-sku`]: e.target.value
                            })}
                            className="h-8 text-xs"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => saveEdit(combination.id, 'sku')}
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => cancelEditing(combination.id, 'sku')}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          className="text-left hover:bg-muted p-1 rounded text-sm"
                          onClick={() => startEditing(combination.id, 'sku', combination.sku || '')}
                        >
                          {combination.sku || (
                            <span className="text-muted-foreground italic">No SKU</span>
                          )}
                        </button>
                      )}
                    </TableCell>

                    {/* Price */}
                    <TableCell>
                      {editingCells[`${combination.id}-price`] !== undefined ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={editingCells[`${combination.id}-price`] || ''}
                            onChange={(e) => setEditingCells({
                              ...editingCells,
                              [`${combination.id}-price`]: e.target.value
                            })}
                            className="h-8 text-xs"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => saveEdit(combination.id, 'price')}
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => cancelEditing(combination.id, 'price')}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          className="text-left hover:bg-muted p-1 rounded text-sm"
                          onClick={() => startEditing(combination.id, 'price', combination.price || basePrice)}
                        >
                          {formatCurrency(combination.price || basePrice)}
                        </button>
                      )}
                    </TableCell>

                    {/* Quantity */}
                    <TableCell>
                      {editingCells[`${combination.id}-quantity`] !== undefined ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            value={editingCells[`${combination.id}-quantity`] || ''}
                            onChange={(e) => setEditingCells({
                              ...editingCells,
                              [`${combination.id}-quantity`]: e.target.value
                            })}
                            className="h-8 text-xs"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => saveEdit(combination.id, 'quantity')}
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => cancelEditing(combination.id, 'quantity')}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          className="text-left hover:bg-muted p-1 rounded text-sm"
                          onClick={() => startEditing(combination.id, 'quantity', combination.quantity)}
                        >
                          {combination.quantity}
                        </button>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <div className="space-y-1">
                        <Badge 
                          variant={combination.available ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {combination.available ? 'Available' : 'Unavailable'}
                        </Badge>
                        <Badge 
                          variant={combination.inStock ? 'default' : 'destructive'}
                          className="text-xs block"
                        >
                          {combination.inStock ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48">
                          <div className="space-y-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => startEditing(combination.id, 'price', combination.price || basePrice)}
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Edit Price
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => startEditing(combination.id, 'quantity', combination.quantity)}
                            >
                              <Hash className="h-4 w-4 mr-2" />
                              Edit Quantity
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => startEditing(combination.id, 'sku', combination.sku || '')}
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit SKU
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {combinations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No variant combinations found</p>
              <p className="text-sm">Create variants to see combinations here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}