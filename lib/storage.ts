import * as Minio from 'minio';
import { logger } from "@/lib/logger"

// MinIO client configuration
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const BUCKET_NAME = process.env.MINIO_BUCKET || 'stepperslife-stores';

// Ensure bucket exists
async function ensureBucket() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      logger.info(`✅ MinIO bucket created: ${BUCKET_NAME}`);

      // Set bucket policy to public for product images
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/products/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
    }
  } catch (error) {
    logger.error("MinIO bucket setup error:", error);
  }
}

// Initialize bucket on module load
ensureBucket();

export default minioClient;

// Storage helper functions
export const storageHelpers = {
  /**
   * Upload a file to MinIO
   */
  async uploadFile(
    file: Buffer | string,
    path: string,
    contentType: string = 'application/octet-stream'
  ): Promise<string> {
    const metadata = {
      'Content-Type': contentType,
    };

    // Upload using the proper minio API  
    await minioClient.putObject(BUCKET_NAME, path, file, undefined, metadata);

    return this.getPublicUrl(path);
  },

  /**
   * Get public URL for a file
   */
  getPublicUrl(path: string): string {
    // Use the public CDN endpoint if available (always HTTPS for production)
    const cdnEndpoint = process.env.MINIO_PUBLIC_ENDPOINT;
    if (cdnEndpoint) {
      return `https://${cdnEndpoint}/${BUCKET_NAME}/${path}`;
    }

    // Fallback to direct MinIO endpoint (for local development)
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '9000';
    return `${protocol}://${endpoint}:${port}/${BUCKET_NAME}/${path}`;
  },

  /**
   * Delete a file from MinIO
   */
  async deleteFile(path: string): Promise<void> {
    await minioClient.removeObject(BUCKET_NAME, path);
  },

  /**
   * Delete multiple files
   */
  async deleteFiles(paths: string[]): Promise<void> {
    await minioClient.removeObjects(BUCKET_NAME, paths);
  },

  /**
   * Get presigned URL for temporary access (for downloads)
   */
  async getPresignedUrl(path: string, expirySeconds: number = 3600): Promise<string> {
    return await minioClient.presignedGetObject(BUCKET_NAME, path, expirySeconds);
  },

  /**
   * Upload product image
   */
  async uploadProductImage(
    vendorStoreId: string,
    productId: string,
    file: Buffer,
    filename: string
  ): Promise<string> {
    const ext = filename.split('.').pop();
    const timestamp = Date.now();
    const path = `products/${vendorStoreId}/${productId}/${timestamp}.${ext}`;
    return await this.uploadFile(file, path, `image/${ext}`);
  },

  /**
   * Upload store logo/banner
   */
  async uploadStoreBranding(
    vendorStoreId: string,
    file: Buffer,
    type: 'logo' | 'banner',
    filename: string
  ): Promise<string> {
    const ext = filename.split('.').pop();
    const path = `stores/${vendorStoreId}/${type}.${ext}`;
    return await this.uploadFile(file, path, `image/${ext}`);
  },
};
