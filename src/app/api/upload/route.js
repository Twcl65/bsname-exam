import pool from '@/lib/database';
import { uploadToSupabase, validateSupabaseConfig } from '@/lib/supabase';

export async function POST(request) {
  try {
    // Validate Supabase configuration
    if (!validateSupabaseConfig()) {
      return Response.json({ error: 'Supabase configuration is missing' }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    
    if (!file) {
      return Response.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return Response.json({ error: 'Only image files are allowed' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique ID for the image
    const imageId = Date.now().toString() + Math.random().toString(36).substr(2, 9)

    // Upload to Supabase Storage
    console.log(`Starting Supabase upload for file: ${file.name}`);
    const uploadResult = await uploadToSupabase(buffer, file.name, file.type, 'uploads')
    
    if (!uploadResult.success) {
      console.error('Supabase upload failed:', uploadResult.error);
      return Response.json({ 
        error: 'Failed to upload to Supabase: ' + uploadResult.error,
        details: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          environment: process.env.VERCEL ? 'Vercel' : 'Local'
        }
      }, { status: 500 })
    }
    
    console.log('Supabase upload successful:', uploadResult.url);

    // Store metadata in database
    await pool.execute(
      'INSERT INTO s3_images (id, original_filename, content_type, s3_key, s3_url, file_size, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [imageId, file.name, file.type, uploadResult.key, uploadResult.url, file.size]
    )

    return Response.json({ 
      success: true, 
      imageId: imageId,
      fileName: file.name,
      filePath: uploadResult.url,
      s3Url: uploadResult.url,
      s3Key: uploadResult.key
    })

  } catch (error) {
    console.error('Upload error:', error)
    return Response.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
