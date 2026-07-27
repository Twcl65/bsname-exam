// =============================================
// AWS S3 Configuration and Utilities
// =============================================

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

/**
 * Check if bucket exists and create it if it doesn't
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function ensureBucketExists() {
  try {
    console.log(`Checking bucket: ${BUCKET_NAME} in region: ${process.env.AWS_REGION}`);
    
    // In Vercel/serverless environment, we assume bucket exists
    // and skip creation to avoid permission issues
    if (process.env.VERCEL) {
      console.log('Running in Vercel environment, skipping bucket creation');
      return { success: true };
    }
    
    // Check if bucket exists
    const headCommand = new HeadBucketCommand({
      Bucket: BUCKET_NAME,
    });

    try {
      await s3Client.send(headCommand);
      console.log(`Bucket ${BUCKET_NAME} already exists and is accessible`);
      return { success: true };
    } catch (error) {
      console.log(`HeadBucket error: ${error.name} - ${error.message}`);
      
      if (error.name === 'NotFound' || error.name === 'NoSuchBucket') {
        // Bucket doesn't exist, create it (only in non-Vercel environments)
        console.log(`Bucket ${BUCKET_NAME} doesn't exist, creating it...`);
        
        const createCommand = new CreateBucketCommand({
          Bucket: BUCKET_NAME,
          CreateBucketConfiguration: process.env.AWS_REGION === 'us-east-1' ? undefined : {
            LocationConstraint: process.env.AWS_REGION || 'us-east-1'
          }
        });

        await s3Client.send(createCommand);
        console.log(`Bucket ${BUCKET_NAME} created successfully`);
        return { success: true };
      } else {
        console.error(`Unexpected error checking bucket: ${error.name} - ${error.message}`);
        throw error;
      }
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Upload file to S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original file name
 * @param {string} contentType - MIME type
 * @param {string} folder - S3 folder path (optional)
 * @returns {Promise<{success: boolean, url?: string, key?: string, error?: string}>}
 */
export async function uploadToS3(fileBuffer, fileName, contentType, folder = '') {
  try {
    // Validate S3 configuration first
    if (!validateS3Config()) {
      return {
        success: false,
        error: 'S3 configuration is missing or invalid',
      };
    }

    // Ensure bucket exists before uploading (skip in Vercel)
    const bucketCheck = await ensureBucketExists();
    if (!bucketCheck.success) {
      return {
        success: false,
        error: `Bucket check failed: ${bucketCheck.error}`,
      };
    }

    // Generate unique key for the file
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substr(2, 9);
    const fileExtension = fileName.split('.').pop();
    const key = folder ? `${folder}/${timestamp}-${randomString}.${fileExtension}` : `${timestamp}-${randomString}.${fileExtension}`;

    console.log(`Uploading to S3: ${BUCKET_NAME}/${key}`);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      // ACL removed - bucket doesn't allow ACLs, use bucket policy instead
    });

    await s3Client.send(command);

    // Return the public URL
    const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

    console.log(`Upload successful: ${publicUrl}`);

    return {
      success: true,
      url: publicUrl,
      key: key,
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete file from S3
 * @param {string} key - S3 object key
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteFromS3(key) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    return {
      success: true,
    };
  } catch (error) {
    console.error('S3 delete error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Generate presigned URL for private files (if needed)
 * @param {string} key - S3 object key
 * @param {number} expiresIn - Expiration time in seconds (default: 3600)
 * @returns {Promise<string>}
 */
export async function getPresignedUrl(key, expiresIn = 3600) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return presignedUrl;
  } catch (error) {
    console.error('S3 presigned URL error:', error);
    throw error;
  }
}

/**
 * Extract S3 key from URL
 * @param {string} url - S3 public URL
 * @returns {string} - S3 key
 */
export function extractS3KeyFromUrl(url) {
  if (!url) return null;
  
  // Extract key from URL like: https://bucket-name.s3.region.amazonaws.com/folder/filename.jpg
  const urlParts = url.split('/');
  return urlParts.slice(3).join('/'); // Remove protocol, empty string, and domain parts
}

/**
 * Validate S3 configuration
 * @returns {boolean}
 */
export function validateS3Config() {
  const requiredEnvVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET_NAME'];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`Missing required environment variable: ${envVar}`);
      return false;
    }
  }
  
  return true;
}
