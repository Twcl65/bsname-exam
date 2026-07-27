// =============================================
// API Route: /api/upload/subject-image
// Method: POST
// Description: Handle subject image uploads to S3
// =============================================

import { NextResponse } from 'next/server';
import pool from '@/lib/database';
import { uploadToS3, validateS3Config } from '@/lib/s3';

export async function POST(request) {
    try {
        // Validate S3 configuration
        if (!validateS3Config()) {
            return NextResponse.json(
                { success: false, error: 'S3 configuration is missing' },
                { status: 500 }
            );
        }

        const data = await request.formData();
        const file = data.get('file');

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file uploaded' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { success: false, error: 'File too large. Maximum size is 5MB.' },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique ID for the image
        const imageId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

        // Upload to S3
        console.log(`Starting S3 upload for file: ${file.name}`);
        const uploadResult = await uploadToS3(buffer, file.name, file.type, 'subjects');
        
        if (!uploadResult.success) {
            console.error('S3 upload failed:', uploadResult.error);
            return NextResponse.json(
                { 
                    success: false, 
                    error: 'Failed to upload to S3: ' + uploadResult.error,
                    details: {
                        fileName: file.name,
                        fileSize: file.size,
                        fileType: file.type,
                        environment: process.env.VERCEL ? 'Vercel' : 'Local'
                    }
                },
                { status: 500 }
            );
        }
        
        console.log('S3 upload successful:', uploadResult.url);

        // Store S3 metadata in database
        await pool.execute(
            'INSERT INTO s3_images (id, original_filename, content_type, s3_key, s3_url, file_size, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [imageId, file.name, file.type, uploadResult.key, uploadResult.url, file.size]
        );

        return NextResponse.json({
            success: true,
            data: {
                imageId,
                fileName: file.name,
                filePath: uploadResult.url,
                s3Url: uploadResult.url,
                s3Key: uploadResult.key,
                originalName: file.name,
                size: file.size,
                type: file.type
            },
            message: 'File uploaded successfully to S3'
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}
