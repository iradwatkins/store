/**
 * Product Categories for Stepperslife Shop
 * Based on Etsy category hierarchy
 */

export const PRODUCT_CATEGORIES = [
  { value: "ACCESSORIES", label: "Accessories" },
  { value: "ART_AND_COLLECTIBLES", label: "Art & Collectibles" },
  { value: "BAGS_AND_PURSES", label: "Bags & Purses" },
  { value: "BATH_AND_BEAUTY", label: "Bath & Beauty" },
  { value: "BOOKS_MOVIES_AND_MUSIC", label: "Books, Movies & Music" },
  { value: "CLOTHING", label: "Clothing" },
  { value: "CRAFT_SUPPLIES_AND_TOOLS", label: "Craft Supplies & Tools" },
  { value: "ELECTRONICS_AND_ACCESSORIES", label: "Electronics & Accessories" },
  { value: "HOME_AND_LIVING", label: "Home & Living" },
  { value: "JEWELRY", label: "Jewelry" },
  { value: "PAPER_AND_PARTY_SUPPLIES", label: "Paper & Party Supplies" },
  { value: "PET_SUPPLIES", label: "Pet Supplies" },
  { value: "SHOES", label: "Shoes" },
  { value: "TOYS_AND_GAMES", label: "Toys & Games" },
  { value: "WEDDINGS", label: "Weddings" },
] as const

export const CATEGORY_SUBCATEGORIES: Record<string, string[]> = {
  ACCESSORIES: [
    "Adult Bibs",
    "Aprons",
    "Belts & Suspenders",
    "Bouquets & Corsages",
    "Collars",
    "Costume Accessories",
    "Face Masks & Accessories",
    "Gloves & Sleeves",
    "Hair Accessories",
    "Hand Fans",
    "Hats & Head Coverings",
    "Keychains & Lanyards",
    "Patches & Appliques",
    "Pins & Clips",
    "Scarves & Wraps",
    "Sunglasses & Eyewear",
    "Umbrellas & Rain Accessories",
    "Wallets & Money Clips",
    "Other Accessories",
  ],

  ART_AND_COLLECTIBLES: [
    "Collectibles",
    "Dolls & Miniatures",
    "Drawing & Illustration",
    "Fiber Arts",
    "Glass Art",
    "Mixed Media & Collage",
    "Painting",
    "Photography",
    "Prints",
    "Sculpture",
    "Other Art",
  ],

  BAGS_AND_PURSES: [
    "Backpacks",
    "Belt Bags & Waist Packs",
    "Clutches & Evening Bags",
    "Crossbody Bags",
    "Diaper Bags",
    "Handbags",
    "Laptop Bags",
    "Luggage & Duffel Bags",
    "Market Bags",
    "Messenger Bags",
    "Pouches & Wristlets",
    "Shoulder Bags",
    "Totes",
    "Other Bags",
  ],

  BATH_AND_BEAUTY: [
    "Bath Accessories",
    "Fragrances",
    "Hair Care",
    "Makeup & Cosmetics",
    "Skin Care",
    "Soaps",
    "Spa & Relaxation",
    "Other Bath & Beauty",
  ],

  BOOKS_MOVIES_AND_MUSIC: [
    "Books",
    "DVDs & Videos",
    "Music",
    "Sheet Music",
    "Other Media",
  ],

  CLOTHING: [
    "Dresses",
    "Jackets & Coats",
    "Pants & Capris",
    "Shirts & Tops",
    "Shorts",
    "Skirts",
    "Sweaters",
    "Swimwear",
    "Suits & Blazers",
    "Undergarments",
    "Athletic Wear",
    "Other Clothing",
  ],

  CRAFT_SUPPLIES_AND_TOOLS: [
    "Adhesives & Tape",
    "Art & Collectibles",
    "Fabric",
    "Notions",
    "Sewing Patterns",
    "Tools",
    "Other Craft Supplies",
  ],

  ELECTRONICS_AND_ACCESSORIES: [
    "Audio",
    "Cameras & Accessories",
    "Cell Phones & Accessories",
    "Computers & Peripherals",
    "Video Games",
    "Other Electronics",
  ],

  HOME_AND_LIVING: [
    "Bathroom",
    "Bedding",
    "Clocks",
    "Decorative Pillows",
    "Home Décor",
    "Kitchen & Dining",
    "Lighting",
    "Outdoor & Garden",
    "Storage & Organization",
    "Other Home & Living",
  ],

  JEWELRY: [
    "Bracelets",
    "Brooches",
    "Earrings",
    "Necklaces",
    "Rings",
    "Jewelry Sets",
    "Body Jewelry",
    "Other Jewelry",
  ],

  PAPER_AND_PARTY_SUPPLIES: [
    "Calendars & Planners",
    "Cards",
    "Gift Wrap",
    "Invitations & Announcements",
    "Notebooks & Journals",
    "Paper",
    "Party Decorations",
    "Party Favors",
    "Stationery",
    "Other Paper Goods",
  ],

  PET_SUPPLIES: [
    "Pet Bedding",
    "Pet Clothing",
    "Pet Collars & Leashes",
    "Pet Furniture",
    "Pet Toys",
    "Other Pet Supplies",
  ],

  SHOES: [
    "Athletic Shoes",
    "Boots",
    "Flats & Oxfords",
    "Heels",
    "Sandals",
    "Slippers",
    "Sneakers",
    "Other Shoes",
  ],

  TOYS_AND_GAMES: [
    "Action Figures",
    "Board Games",
    "Dolls & Action Figures",
    "Games & Puzzles",
    "Pretend Play",
    "Stuffed Animals",
    "Toys",
    "Other Toys & Games",
  ],

  WEDDINGS: [
    "Bridal Accessories",
    "Decorations",
    "Favors",
    "Gifts",
    "Invitations & Paper",
    "Jewelry",
    "Memorabilia",
    "Reception Décor",
    "Other Wedding Items",
  ],
}

// Helper function to get category label from value
export function getCategoryLabel(value: string): string {
  const category = PRODUCT_CATEGORIES.find(cat => cat.value === value)
  return category?.label || value
}

// Helper function to get subcategories for a category
export function getSubcategories(category: string): string[] {
  return CATEGORY_SUBCATEGORIES[category] || []
}
