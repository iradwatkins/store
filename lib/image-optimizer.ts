import sharp from 'sharp';

/**
 * Image optimization utility using Sharp
 * Compresses and resizes images for web performance
 */

export interface ImageSize {
  width: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface OptimizationOptions {
  quality?: number; // 1-100, default 80
  format?: 'jpeg' | 'png' | 'webp'; // default: webp
  sizes?: { [key: string]: ImageSize }; // e.g., { thumbnail: { width: 150 }, medium: { width: 500 } }
}

export interface OptimizedImage {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  size: number; // file size in bytes
}

/**
 * Optimize a single image
 */
export async function optimizeImage(
  input: Buffer,
  options: OptimizationOptions = {}
): Promise<OptimizedImage> {
  const {
    quality = 80,
    format = 'webp',
  } = options;

  let sharpInstance = sharp(input);

  // Convert to specified format
  if (format === 'webp') {
    sharpInstance = sharpInstance.webp({ quality });
  } else if (format === 'jpeg') {
    sharpInstance = sharpInstance.jpeg({ quality, mozjpeg: true });
  } else if (format === 'png') {
    sharpInstance = sharpInstance.png({ quality, compressionLevel: 9 });
  }

  const buffer = await sharpInstance.toBuffer();
  const metadata = await sharp(buffer).metadata();

  return {
    buffer,
    format,
    width: metadata.width || 0,
    height: metadata.height || 0,
    size: buffer.length,
  };
}

/**
 * Resize and optimize image to specific dimensions
 */
export async function resizeImage(
  input: Buffer,
  size: ImageSize,
  options: OptimizationOptions = {}
): Promise<OptimizedImage> {
  const {
    quality = 80,
    format = 'webp',
  } = options;

  let sharpInstance = sharp(input).resize({
    width: size.width,
    height: size.height,
    fit: size.fit || 'cover',
    withoutEnlargement: true, // Don't upscale small images
  });

  // Convert to specified format
  if (format === 'webp') {
    sharpInstance = sharpInstance.webp({ quality });
  } else if (format === 'jpeg') {
    sharpInstance = sharpInstance.jpeg({ quality, mozjpeg: true });
  } else if (format === 'png') {
    sharpInstance = sharpInstance.png({ quality, compressionLevel: 9 });
  }

  const buffer = await sharpInstance.toBuffer();
  const metadata = await sharp(buffer).metadata();

  return {
    buffer,
    format,
    width: metadata.width || 0,
    height: metadata.height || 0,
    size: buffer.length,
  };
}

/**
 * Generate multiple sizes of an image (thumbnail, medium, large, etc.)
 */
export async function generateImageSizes(
  input: Buffer,
  sizes: { [key: string]: ImageSize },
  options: OptimizationOptions = {}
): Promise<{ [key: string]: OptimizedImage }> {
  const results: { [key: string]: OptimizedImage } = {};

  for (const [name, size] of Object.entries(sizes)) {
    results[name] = await resizeImage(input, size, options);
  }

  return results;
}

/**
 * Default image sizes for product images
 */
export const productImageSizes: { [key: string]: ImageSize } = {
  thumbnail: { width: 150, height: 150, fit: 'cover' },
  small: { width: 300, height: 300, fit: 'cover' },
  medium: { width: 600, height: 600, fit: 'cover' },
  large: { width: 1200, height: 1200, fit: 'inside' },
};

/**
 * Default image sizes for store branding
 */
export const storeBrandingSizes: { [key: string]: ImageSize } = {
  logo_small: { width: 100, height: 100, fit: 'contain' },
  logo_medium: { width: 200, height: 200, fit: 'contain' },
  banner_desktop: { width: 1200, height: 400, fit: 'cover' },
  banner_mobile: { width: 600, height: 200, fit: 'cover' },
};

/**
 * Validate image buffer and get metadata
 */
export async function validateImage(
  input: Buffer
): Promise<{ valid: boolean; error?: string; metadata?: sharp.Metadata }> {
  try {
    const metadata = await sharp(input).metadata();

    // Check if it's a valid image format
    if (!metadata.format) {
      return { valid: false, error: 'Invalid image format' };
    }

    // Check supported formats
    const supportedFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif'];
    if (!supportedFormats.includes(metadata.format)) {
      return { valid: false, error: `Unsupported format: ${metadata.format}` };
    }

    // Check minimum dimensions (at least 100x100)
    if (metadata.width && metadata.width < 100) {
      return { valid: false, error: 'Image width must be at least 100px' };
    }
    if (metadata.height && metadata.height < 100) {
      return { valid: false, error: 'Image height must be at least 100px' };
    }

    // Check maximum dimensions (max 5000x5000)
    if (metadata.width && metadata.width > 5000) {
      return { valid: false, error: 'Image width exceeds maximum of 5000px' };
    }
    if (metadata.height && metadata.height > 5000) {
      return { valid: false, error: 'Image height exceeds maximum of 5000px' };
    }

    return { valid: true, metadata };
  } catch (error) {
    return { valid: false, error: `Failed to process image: ${error}` };
  }
}

/**
 * Calculate compression savings
 */
export function calculateCompressionRatio(originalSize: number, optimizedSize: number): {
  savedBytes: number;
  savedPercent: number;
  compressionRatio: number;
} {
  const savedBytes = originalSize - optimizedSize;
  const savedPercent = (savedBytes / originalSize) * 100;
  const compressionRatio = originalSize / optimizedSize;

  return {
    savedBytes,
    savedPercent: Math.round(savedPercent * 10) / 10,
    compressionRatio: Math.round(compressionRatio * 100) / 100,
  };
}
