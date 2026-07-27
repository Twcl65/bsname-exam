// =============================================
// API Route: /api/s3-images
// Method: GET, DELETE
// Description: Manage S3 images metadata
// =============================================

import { NextResponse } from 'next/server';
import pool from '@/lib/database';
import { deleteFromSupabase, validateSupabaseConfig } from '@/lib/supabase';

// GET - Retrieve S3 image metadata
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const imageId = searchParams.get('id');
        const limit = parseInt(searchParams.get('limit')) || 50;
        const offset = parseInt(searchParams.get('offset')) || 0;

        let query, params;

        if (imageId) {
            // Get specific image
            query = 'SELECT * FROM s3_images WHERE id = ?';
            params = [imageId];
        } else {
            // Get paginated list of images
            query = 'SELECT * FROM s3_images ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params = [limit, offset];
        }

        const [rows] = await pool.execute(query, params);

        return NextResponse.json({
            success: true,
            data: imageId ? (rows[0] || null) : rows,
            pagination: imageId ? null : {
                limit,
                offset,
                total: rows.length
            }
        });

    } catch (error) {
        console.error('S3 images GET error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to retrieve images' },
            { status: 500 }
        );
    }
}

// DELETE - Delete S3 image
export async function DELETE(request) {
    try {
        // Validate Supabase configuration
        if (!validateSupabaseConfig()) {
            return NextResponse.json(
                { success: false, error: 'Supabase configuration is missing' },
                { status: 500 }
            );
        }

        const { searchParams } = new URL(request.url);
        const imageId = searchParams.get('id');

        if (!imageId) {
            return NextResponse.json(
                { success: false, error: 'Image ID is required' },
                { status: 400 }
            );
        }

        // Get image metadata from database
        const [rows] = await pool.execute(
            'SELECT * FROM s3_images WHERE id = ?',
            [imageId]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Image not found' },
                { status: 404 }
            );
        }

        const imageData = rows[0];

        // Delete from Supabase Storage
        const deleteResult = await deleteFromSupabase(imageData.s3_key);
        
        if (!deleteResult.success) {
            return NextResponse.json(
                { success: false, error: 'Failed to delete from Supabase: ' + deleteResult.error },
                { status: 500 }
            );
        }

        // Delete from database
        await pool.execute(
            'DELETE FROM s3_images WHERE id = ?',
            [imageId]
        );

        return NextResponse.json({
            success: true,
            message: 'Image deleted successfully',
            data: {
                imageId,
                s3Key: imageData.s3_key
            }
        });

    } catch (error) {
        console.error('S3 images DELETE error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete image' },
            { status: 500 }
        );
    }
}
