/**
 * Variant Presets for Multi-Category Marketplace
 *
 * This file contains pre-configured templates for common product variant types.
 * Vendors can use these templates for quick setup, or create custom options.
 */

// ============================================
// SIZE TEMPLATES
// ============================================

export interface SizeTemplate {
  id: string
  name: string
  category: string
  description: string
  sizes: string[]
  icon?: string
}

export const SIZE_TEMPLATES: Record<string, SizeTemplate> = {
  // CLOTHING
  'standard-tshirt': {
    id: 'standard-tshirt',
    name: 'Standard T-Shirt Sizes',
    category: 'Clothing',
    description: 'Common t-shirt sizes (unisex)',
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    icon: '👕'
  },
  'mens-dress-shirt': {
    id: 'mens-dress-shirt',
    name: "Men's Dress Shirt Sizes",
    category: 'Clothing',
    description: 'Neck sizes for dress shirts',
    sizes: ['14', '14.5', '15', '15.5', '16', '16.5', '17', '17.5', '18'],
    icon: '👔'
  },
  'womens-dress-sizes': {
    id: 'womens-dress-sizes',
    name: "Women's Dress Sizes",
    category: 'Clothing',
    description: 'Standard US dress sizes',
    sizes: ['0', '2', '4', '6', '8', '10', '12', '14', '16', '18'],
    icon: '👗'
  },

  // FOOTWEAR
  'us-shoe-mens': {
    id: 'us-shoe-mens',
    name: 'US Shoe Sizes (Men)',
    category: 'Footwear',
    description: "Men's shoe sizes",
    sizes: ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '13', '14'],
    icon: '👟'
  },
  'us-shoe-womens': {
    id: 'us-shoe-womens',
    name: 'US Shoe Sizes (Women)',
    category: 'Footwear',
    description: "Women's shoe sizes",
    sizes: ['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11'],
    icon: '👠'
  },

  // JEWELRY
  'ring-sizes-us': {
    id: 'ring-sizes-us',
    name: 'Ring Sizes (US)',
    category: 'Jewelry',
    description: 'Standard US ring sizes',
    sizes: ['4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12'],
    icon: '💍'
  },
  'necklace-length': {
    id: 'necklace-length',
    name: 'Necklace Lengths',
    category: 'Jewelry',
    description: 'Standard necklace chain lengths',
    sizes: ['14"', '16"', '18"', '20"', '22"', '24"', '30"'],
    icon: '📿'
  },
  'bracelet-sizes': {
    id: 'bracelet-sizes',
    name: 'Bracelet Sizes',
    category: 'Jewelry',
    description: 'Standard bracelet lengths',
    sizes: ['6"', '6.5"', '7"', '7.5"', '8"', '8.5"'],
    icon: '📿'
  },

  // ART & PRINTS
  'art-print-standard': {
    id: 'art-print-standard',
    name: 'Standard Print Sizes',
    category: 'Art',
    description: 'Common art print dimensions',
    sizes: ['5x7', '8x10', '11x14', '16x20', '18x24', '24x36'],
    icon: '🖼️'
  },
  'canvas-sizes': {
    id: 'canvas-sizes',
    name: 'Canvas Sizes',
    category: 'Art',
    description: 'Standard stretched canvas sizes',
    sizes: ['8x10', '11x14', '16x20', '18x24', '24x30', '30x40'],
    icon: '🎨'
  },

  // HOME & DECOR
  'furniture-sizes': {
    id: 'furniture-sizes',
    name: 'Furniture/Bed Sizes',
    category: 'Home',
    description: 'Standard bed/furniture sizes',
    sizes: ['Twin', 'Twin XL', 'Full', 'Queen', 'King', 'Cal King'],
    icon: '🛏️'
  },
  'pillow-sizes': {
    id: 'pillow-sizes',
    name: 'Pillow Sizes',
    category: 'Home',
    description: 'Standard pillow dimensions',
    sizes: ['12x12', '16x16', '18x18', '20x20', '24x24'],
    icon: '🛋️'
  },
  'plant-pot-sizes': {
    id: 'plant-pot-sizes',
    name: 'Plant Pot Sizes',
    category: 'Plants',
    description: 'Standard pot diameters',
    sizes: ['2"', '4"', '6"', '8"', '10"', '12"'],
    icon: '🪴'
  },

  // ELECTRONICS
  'device-compatibility': {
    id: 'device-compatibility',
    name: 'Device Sizes',
    category: 'Electronics',
    description: 'Device compatibility options',
    sizes: ['Phone', 'Tablet', 'Laptop', 'Desktop'],
    icon: '📱'
  },

  // FOOD & BEVERAGE
  'cake-sizes': {
    id: 'cake-sizes',
    name: 'Cake Sizes',
    category: 'Food',
    description: 'Standard cake sizes with serving counts',
    sizes: ['6" (Serves 8-10)', '8" (Serves 12-16)', '10" (Serves 20-25)', '12" (Serves 30-40)'],
    icon: '🍰'
  }
}

// Helper function to get size templates by category
export function getSizeTemplatesByCategory(category: string): SizeTemplate[] {
  return Object.values(SIZE_TEMPLATES).filter(template => template.category === category)
}

// ============================================
// COLOR PALETTE
// ============================================

export interface ColorOption {
  name: string
  hex: string
  icon?: string
  description?: string
}

export const COLOR_PALETTE: ColorOption[] = [
  // Basic Colors (universal)
  { name: 'Black', hex: '#000000', icon: '⬛', description: 'Classic black' },
  { name: 'White', hex: '#FFFFFF', icon: '⬜', description: 'Pure white' },
  { name: 'Gray', hex: '#6B7280', icon: '🩶', description: 'Neutral gray' },

  // Primary Colors
  { name: 'Red', hex: '#DC2626', icon: '🟥', description: 'Vibrant red' },
  { name: 'Blue', hex: '#2563EB', icon: '🟦', description: 'Classic blue' },
  { name: 'Green', hex: '#16A34A', icon: '🟩', description: 'Fresh green' },
  { name: 'Yellow', hex: '#EAB308', icon: '🟨', description: 'Bright yellow' },

  // Secondary Colors
  { name: 'Orange', hex: '#EA580C', icon: '🟧', description: 'Warm orange' },
  { name: 'Purple', hex: '#9333EA', icon: '🟪', description: 'Rich purple' },
  { name: 'Pink', hex: '#EC4899', icon: '🩷', description: 'Soft pink' },

  // Earth Tones
  { name: 'Brown', hex: '#92400E', icon: '🟫', description: 'Chocolate brown' },
  { name: 'Beige', hex: '#D4A574', icon: '🟤', description: 'Warm beige' },
  { name: 'Tan', hex: '#D2B48C', icon: '🟫', description: 'Light tan' },

  // Jewel Tones
  { name: 'Navy', hex: '#1E3A8A', icon: '🔷', description: 'Deep navy' },
  { name: 'Burgundy', hex: '#7C2D12', icon: '🟥', description: 'Wine red' },
  { name: 'Forest Green', hex: '#14532D', icon: '🟩', description: 'Deep forest' },

  // Metallic
  { name: 'Gold', hex: '#D97706', icon: '🌟', description: 'Metallic gold' },
  { name: 'Silver', hex: '#9CA3AF', icon: '💿', description: 'Metallic silver' },
  { name: 'Rose Gold', hex: '#B76E79', icon: '🩷', description: 'Trendy rose gold' },
  { name: 'Copper', hex: '#B87333', icon: '🟤', description: 'Metallic copper' }
]

// ============================================
// MATERIAL OPTIONS (by Category)
// ============================================

export interface MaterialCategory {
  category: string
  materials: string[]
  icon?: string
}

export const MATERIAL_OPTIONS: Record<string, string[]> = {
  jewelry: [
    'Sterling Silver',
    'Gold',
    '14K Gold',
    '18K Gold',
    'Rose Gold',
    'White Gold',
    'Platinum',
    'Stainless Steel',
    'Brass',
    'Copper',
    'Titanium'
  ],
  art: [
    'Canvas',
    'Paper',
    'Photo Paper',
    'Metal',
    'Wood',
    'Acrylic',
    'Glass',
    'Fabric'
  ],
  clothing: [
    'Cotton',
    '100% Cotton',
    'Organic Cotton',
    'Polyester',
    'Cotton Blend',
    'Linen',
    'Silk',
    'Wool',
    'Denim',
    'Leather',
    'Suede',
    'Velvet'
  ],
  furniture: [
    'Wood',
    'Oak',
    'Pine',
    'Walnut',
    'Mahogany',
    'Metal',
    'Steel',
    'Aluminum',
    'Plastic',
    'Fabric',
    'Leather',
    'Rattan',
    'Bamboo'
  ],
  electronics: [
    'Plastic',
    'Hard Plastic',
    'Silicone',
    'TPU',
    'Leather',
    'Vegan Leather',
    'Fabric',
    'Metal',
    'Wood',
    'Carbon Fiber'
  ]
}

// ============================================
// STYLE OPTIONS (by Category)
// ============================================

export const STYLE_OPTIONS: Record<string, string[]> = {
  general: [
    'Modern',
    'Contemporary',
    'Vintage',
    'Retro',
    'Classic',
    'Traditional',
    'Rustic',
    'Minimalist',
    'Boho',
    'Industrial',
    'Farmhouse',
    'Mid-Century'
  ],
  jewelry: [
    'Dainty',
    'Delicate',
    'Statement',
    'Bold',
    'Minimalist',
    'Vintage',
    'Modern',
    'Classic',
    'Bohemian',
    'Elegant'
  ],
  art: [
    'Abstract',
    'Realistic',
    'Modern',
    'Contemporary',
    'Traditional',
    'Pop Art',
    'Impressionist',
    'Minimalist',
    'Surrealist'
  ],
  clothing: [
    'Casual',
    'Formal',
    'Business Casual',
    'Streetwear',
    'Athletic',
    'Vintage',
    'Bohemian',
    'Classic',
    'Trendy'
  ]
}

// ============================================
// FORMAT OPTIONS (by Category)
// ============================================

export const FORMAT_OPTIONS: Record<string, string[]> = {
  books: [
    'Hardcover',
    'Paperback',
    'eBook',
    'Audiobook',
    'Large Print',
    'Leather Bound'
  ],
  art: [
    'Print Only',
    'Framed',
    'Canvas Stretched',
    'Canvas Rolled',
    'Matted',
    'Mounted'
  ],
  digital: [
    'Digital Download',
    'Physical CD',
    'Physical DVD',
    'USB Drive',
    'Cloud Access',
    'Streaming'
  ],
  food: [
    'Fresh',
    'Frozen',
    'Dried',
    'Canned',
    'Pre-packaged'
  ]
}

// ============================================
// FINISH OPTIONS
// ============================================

export const FINISH_OPTIONS = {
  general: [
    'Matte',
    'Glossy',
    'Satin',
    'Textured',
    'Smooth',
    'Polished',
    'Brushed',
    'Distressed'
  ],
  wood: [
    'Natural',
    'Stained',
    'Painted',
    'Varnished',
    'Oiled',
    'Lacquered',
    'Distressed',
    'Weathered'
  ],
  metal: [
    'Polished',
    'Brushed',
    'Matte',
    'Hammered',
    'Oxidized',
    'Plated',
    'Powder Coated'
  ]
}

// ============================================
// ADDON TEMPLATES
// ============================================

export interface AddonTemplate {
  name: string
  description: string
  defaultPrice: number
  icon?: string
  category: string
}

export const ADDON_TEMPLATES: AddonTemplate[] = [
  // Universal Add-ons
  {
    name: 'Gift Wrapping',
    description: 'Beautiful gift box with ribbon',
    defaultPrice: 5.00,
    icon: '🎁',
    category: 'universal'
  },
  {
    name: 'Gift Message Card',
    description: 'Personalized card with your message',
    defaultPrice: 3.00,
    icon: '💌',
    category: 'universal'
  },
  {
    name: 'Express Shipping',
    description: '2-3 business day delivery',
    defaultPrice: 15.00,
    icon: '📦',
    category: 'universal'
  },
  {
    name: 'Rush Processing',
    description: 'Priority handling (1-2 days)',
    defaultPrice: 10.00,
    icon: '⚡',
    category: 'universal'
  },

  // Category-specific
  {
    name: 'Engraving',
    description: 'Custom text engraving',
    defaultPrice: 15.00,
    icon: '✍️',
    category: 'jewelry'
  },
  {
    name: 'Framing',
    description: 'Professional frame',
    defaultPrice: 30.00,
    icon: '🖼️',
    category: 'art'
  },
  {
    name: 'Assembly Service',
    description: 'Professional assembly included',
    defaultPrice: 50.00,
    icon: '🔧',
    category: 'furniture'
  },
  {
    name: 'Monogramming',
    description: 'Custom initials or name',
    defaultPrice: 12.00,
    icon: '✨',
    category: 'clothing'
  }
]

// ============================================
// VARIANT TYPE DEFINITIONS
// ============================================

export interface VariantType {
  id: string
  name: string
  displayName: string
  description: string
  icon: string
  commonFor: string[] // Product categories this is common for
  inputType: 'preset' | 'custom' | 'both'
  presetKey?: string // Key to preset options (e.g., 'SIZE_TEMPLATES')
}

export const VARIANT_TYPES: VariantType[] = [
  {
    id: 'SIZE',
    name: 'Size',
    displayName: 'Size',
    description: 'Product size (clothing, shoes, art prints, etc.)',
    icon: '📏',
    commonFor: ['CLOTHING', 'SHOES', 'JEWELRY', 'ART_AND_COLLECTIBLES', 'HOME_AND_LIVING'],
    inputType: 'both',
    presetKey: 'SIZE_TEMPLATES'
  },
  {
    id: 'COLOR',
    name: 'Color',
    displayName: 'Color',
    description: 'Product color or finish color',
    icon: '🎨',
    commonFor: ['CLOTHING', 'SHOES', 'HOME_AND_LIVING', 'ELECTRONICS_AND_ACCESSORIES', 'BAGS_AND_PURSES'],
    inputType: 'both',
    presetKey: 'COLOR_PALETTE'
  },
  {
    id: 'MATERIAL',
    name: 'Material',
    displayName: 'Material',
    description: 'What the product is made from',
    icon: '✨',
    commonFor: ['JEWELRY', 'ART_AND_COLLECTIBLES', 'HOME_AND_LIVING', 'CLOTHING', 'BAGS_AND_PURSES'],
    inputType: 'both',
    presetKey: 'MATERIAL_OPTIONS'
  },
  {
    id: 'STYLE',
    name: 'Style',
    displayName: 'Style',
    description: 'Design style or aesthetic',
    icon: '🎭',
    commonFor: ['JEWELRY', 'ART_AND_COLLECTIBLES', 'HOME_AND_LIVING', 'CLOTHING'],
    inputType: 'both',
    presetKey: 'STYLE_OPTIONS'
  },
  {
    id: 'FINISH',
    name: 'Finish',
    displayName: 'Finish',
    description: 'Surface finish (matte, glossy, etc.)',
    icon: '✨',
    commonFor: ['HOME_AND_LIVING', 'JEWELRY', 'ART_AND_COLLECTIBLES', 'ELECTRONICS_AND_ACCESSORIES'],
    inputType: 'both',
    presetKey: 'FINISH_OPTIONS'
  },
  {
    id: 'FORMAT',
    name: 'Format',
    displayName: 'Format',
    description: 'Product format (hardcover, digital, etc.)',
    icon: '📦',
    commonFor: ['BOOKS_MOVIES_AND_MUSIC', 'ART_AND_COLLECTIBLES'],
    inputType: 'both',
    presetKey: 'FORMAT_OPTIONS'
  }
]

// Helper function to get variant types for a product category
export function getVariantTypesForCategory(category: string): VariantType[] {
  return VARIANT_TYPES.filter(type => type.commonFor.includes(category))
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get all available size templates
 */
export function getAllSizeTemplates(): SizeTemplate[] {
  return Object.values(SIZE_TEMPLATES)
}

/**
 * Get a specific size template by ID
 */
export function getSizeTemplate(id: string): SizeTemplate | undefined {
  return SIZE_TEMPLATES[id]
}

/**
 * Get material options for a category
 */
export function getMaterialsForCategory(category: string): string[] {
  return MATERIAL_OPTIONS[category] || MATERIAL_OPTIONS.general || []
}

/**
 * Get style options for a category
 */
export function getStylesForCategory(category: string): string[] {
  return STYLE_OPTIONS[category] || STYLE_OPTIONS.general
}

/**
 * Get format options for a category
 */
export function getFormatsForCategory(category: string): string[] {
  return FORMAT_OPTIONS[category] || []
}

/**
 * Get relevant addon templates for a category
 */
export function getAddonsForCategory(category: string): AddonTemplate[] {
  return ADDON_TEMPLATES.filter(addon =>
    addon.category === 'universal' || addon.category === category.toLowerCase()
  )
}
