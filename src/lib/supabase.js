// =============================================
// Supabase Configuration and Storage Utilities
// =============================================

import { createClient } from '@supabase/supabase-js';

// Get Supabase URL, fallback to parsing DATABASE_URL if available
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

if (!supabaseUrl && process.env.DATABASE_URL) {
  const userMatch = process.env.DATABASE_URL.match(/postgres\.([a-z0-9\-]+)/i);
  if (userMatch && userMatch[1] && userMatch[1] !== 'user') {
    supabaseUrl = `https://${userMatch[1]}.supabase.co`;
    console.log(`Dynamically resolved Supabase URL from DATABASE_URL: ${supabaseUrl}`);
  } else {
    const match = process.env.DATABASE_URL.match(/@db\.([a-z0-9\-]+)\.supabase\.co/i);
    if (match && match[1]) {
      supabaseUrl = `https://${match[1]}.supabase.co`;
      console.log(`Dynamically resolved Supabase URL from DATABASE_URL: ${supabaseUrl}`);
    }
  }
}

// Get Supabase Key: prioritize Service Role Key for backend storage management to bypass RLS
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const defaultBucket = process.env.SUPABASE_STORAGE_BUCKET || 'bsname-exams';

export const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
}) : null;

/**
 * Validate Supabase configuration
 * @returns {boolean}
 */
export function validateSupabaseConfig() {
  if (!supabaseUrl) {
    console.error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL (or DATABASE_URL to derive it)');
    return false;
  }
  if (!supabaseKey) {
    console.error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return false;
  }
  if (!supabase) {
    console.error('Supabase client failed to initialize');
    return false;
  }
  return true;
}

/**
 * Ensure storage bucket exists and is public
 * @param {string} bucketName 
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function ensureBucketExists(bucketName) {
  try {
    if (!validateSupabaseConfig()) {
      return { success: false, error: 'Supabase configuration is missing or invalid' };
    }

    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      throw listError;
    }

    const exists = buckets.some(b => b.name === bucketName);
    if (!exists) {
      console.log(`Storage bucket "${bucketName}" does not exist. Creating it...`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });

      if (createError) {
        console.warn(`Could not create bucket "${bucketName}" (might lack service_role permissions):`, createError.message);
      } else {
        console.log(`Storage bucket "${bucketName}" created successfully and set to public.`);
      }
    }
    return { success: true };
  } catch (error) {
    console.warn(`Warning in ensureBucketExists for "${bucketName}":`, error.message);
    // Return success: true anyway since we might not have listBuckets permissions,
    // but the bucket might already exist and be writeable.
    return { success: true };
  }
}

/**
 * Upload file to Supabase Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original file name
 * @param {string} contentType - MIME type
 * @param {string} folder - Folder path (optional)
 * @returns {Promise<{success: boolean, url?: string, key?: string, error?: string}>}
 */
export async function uploadToSupabase(fileBuffer, fileName, contentType, folder = '') {
  try {
    if (!validateSupabaseConfig()) {
      return {
        success: false,
        error: 'Supabase configuration is missing or invalid',
      };
    }

    const bucketName = defaultBucket;
    await ensureBucketExists(bucketName);

    // Generate unique key for the file
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substr(2, 9);
    const fileExtension = fileName.split('.').pop();
    const key = folder ? `${folder}/${timestamp}-${randomString}.${fileExtension}` : `${timestamp}-${randomString}.${fileExtension}`;

    console.log(`Uploading file to Supabase Storage: ${bucketName}/${key}`);

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(key, fileBuffer, {
        contentType,
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(key);

    console.log(`Upload successful. Public URL: ${publicUrl}`);

    return {
      success: true,
      url: publicUrl,
      key: key,
    };
  } catch (error) {
    console.error('Supabase upload error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete file from Supabase Storage
 * @param {string} key - Supabase storage path / key
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteFromSupabase(key) {
  try {
    if (!validateSupabaseConfig()) {
      return {
        success: false,
        error: 'Supabase configuration is missing or invalid',
      };
    }

    const bucketName = defaultBucket;
    console.log(`Deleting file from Supabase Storage: ${bucketName}/${key}`);

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([key]);

    if (error) {
      throw error;
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Supabase delete error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
