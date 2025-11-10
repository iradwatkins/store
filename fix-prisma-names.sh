#!/bin/bash

echo "🔧 Fixing Prisma field naming issues..."

# Fix .vendorStore to .vendor_stores
echo "1. Fixing .vendorStore references..."
grep -rl "\.vendorStore\b" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next . 2>/dev/null | while read file; do
  sed -i 's/\.vendorStore/.vendor_stores/g' "$file"
  echo "  ✓ Fixed: $file"
done

# Fix product.images to product.product_images
echo "2. Fixing product.images references..."
grep -rl "product\.images" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next . 2>/dev/null | while read file; do
  sed -i 's/product\.images/product.product_images/g' "$file"
  echo "  ✓ Fixed: $file"
done

# Fix include: { images: to include: { product_images:
echo "3. Fixing include { images: references..."
grep -rl "images:" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next ./app ./lib 2>/dev/null | while read file; do
  if grep -q "include.*images:" "$file"; then
    sed -i '/include.*{/,/}/ s/\bimages:/product_images:/g' "$file"
    echo "  ✓ Fixed: $file"
  fi
done

# Fix vendorStore: { in include statements to vendor_stores: {
echo "4. Fixing vendorStore in include statements..."
grep -rl "vendorStore:" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next ./app ./lib 2>/dev/null | while read file; do
  sed -i 's/vendorStore:/vendor_stores:/g' "$file"
  echo "  ✓ Fixed: $file"
done

echo "✅ All Prisma field naming issues fixed!"
