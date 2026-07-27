import { NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request, { params }) {
    try {
        const { type, id } = await params;
        
        if (!type || !id) {
            return new NextResponse('Missing parameters', { status: 400 });
        }

        let query = '';
        let field = '';
        let s3Field = '';
        
        switch (type) {
            case 'profile':
                query = 'SELECT profile_picture, profile_picture_s3_url FROM users WHERE id = ?';
                field = 'profile_picture';
                s3Field = 'profile_picture_s3_url';
                break;
            case 'subject':
                query = 'SELECT subject_picture, subject_picture_s3_url FROM subjects WHERE id = ?';
                field = 'subject_picture';
                s3Field = 'subject_picture_s3_url';
                break;
            case 'question':
                query = 'SELECT question_image, question_image_s3_url FROM questions WHERE id = ?';
                field = 'question_image';
                s3Field = 'question_image_s3_url';
                break;
            case 'option-a':
                query = 'SELECT option_a_image, option_a_image_s3_url FROM questions WHERE id = ?';
                field = 'option_a_image';
                s3Field = 'option_a_image_s3_url';
                break;
            case 'option-b':
                query = 'SELECT option_b_image, option_b_image_s3_url FROM questions WHERE id = ?';
                field = 'option_b_image';
                s3Field = 'option_b_image_s3_url';
                break;
            case 'option-c':
                query = 'SELECT option_c_image, option_c_image_s3_url FROM questions WHERE id = ?';
                field = 'option_c_image';
                s3Field = 'option_c_image_s3_url';
                break;
            case 'option-d':
                query = 'SELECT option_d_image, option_d_image_s3_url FROM questions WHERE id = ?';
                field = 'option_d_image';
                s3Field = 'option_d_image_s3_url';
                break;
            case 'uploaded':
                // Check both old uploaded_images and new s3_images tables
                const [s3Rows] = await pool.execute(
                    'SELECT s3_url, content_type FROM s3_images WHERE id = ?',
                    [id]
                );
                
                if (s3Rows.length > 0) {
                    // Redirect to S3 URL
                    return NextResponse.redirect(s3Rows[0].s3_url);
                }
                
                // Fallback to old BLOB storage
                query = 'SELECT image_data, content_type FROM uploaded_images WHERE id = ?';
                field = 'image_data';
                break;
            default:
                return new NextResponse('Invalid image type', { status: 400 });
        }

        const [rows] = await pool.execute(query, [id]);
        
        if (rows.length === 0) {
            return new NextResponse('Image not found', { status: 404 });
        }

        const row = rows[0];

        // Check if S3 URL exists (for new images)
        if (s3Field && row[s3Field]) {
            return NextResponse.redirect(row[s3Field]);
        }

        // Fallback to BLOB data (for old images)
        if (!row[field]) {
            return new NextResponse('Image not found', { status: 404 });
        }

        const imageBuffer = row[field];
        
        // Determine content type
        let contentType = 'image/jpeg'; // default
        if (type === 'uploaded') {
            // For uploaded images, use the stored content type
            contentType = row.content_type || 'image/jpeg';
        } else {
            // For other images, determine from image data
            if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50 && imageBuffer[2] === 0x4E && imageBuffer[3] === 0x47) {
                contentType = 'image/png';
            } else if (imageBuffer[0] === 0x47 && imageBuffer[1] === 0x49 && imageBuffer[2] === 0x46) {
                contentType = 'image/gif';
            } else if (imageBuffer[0] === 0x52 && imageBuffer[1] === 0x49 && imageBuffer[2] === 0x46 && imageBuffer[3] === 0x46) {
                contentType = 'image/webp';
            }
        }

        return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
            },
        });

    } catch (error) {
        console.error('Error serving image:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
