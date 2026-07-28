import pkg from '@next/env';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const { loadEnvConfig } = pkg;

// Load Environment Variables using Next.js config
loadEnvConfig(process.cwd());

const { Pool } = pg;

async function main() {
  console.log('🔄 Starting Database Reset and Clean-up Script...\n');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL environment variable is missing.');
    process.exit(1);
  }

  // 1. Resolve Supabase config
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!supabaseUrl && connectionString) {
    const userMatch = connectionString.match(/postgres\.([a-z0-9\-]+)/i);
    if (userMatch && userMatch[1] && userMatch[1] !== 'user') {
      supabaseUrl = `https://${userMatch[1]}.supabase.co`;
    } else {
      const match = connectionString.match(/@db\.([a-z0-9\-]+)\.supabase\.co/i);
      if (match && match[1]) {
        supabaseUrl = `https://${match[1]}.supabase.co`;
      }
    }
  }

  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'bsname-exams';

  console.log('🔌 Database URL found. Connecting to PostgreSQL...');
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  // Test Database Connection
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database.');
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }

  // 2. Clean up Supabase Storage images if configured
  if (supabaseUrl && supabaseKey) {
    console.log(`🔌 Supabase URL resolved: ${supabaseUrl}`);
    console.log(`🔌 Connecting to Supabase Storage (bucket: "${bucketName}")...`);
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    const foldersToClean = ['', 'uploads', 'subjects'];
    for (const folder of foldersToClean) {
      try {
        console.log(`🔍 Listing files in folder "${folder || '(root)'}"...`);
        const { data: files, error } = await supabase.storage.from(bucketName).list(folder, { limit: 1000 });
        if (error) {
          console.warn(`⚠️ Could not list files in folder "${folder}":`, error.message);
          continue;
        }

        if (files && files.length > 0) {
          // Exclude folders or placeholder files if needed, and map to full path key
          const keysToDelete = files
            .filter(f => f.id !== undefined && f.name !== '.emptyFolderPlaceholder')
            .map(f => folder ? `${folder}/${f.name}` : f.name);

          if (keysToDelete.length > 0) {
            console.log(`🗑️ Deleting ${keysToDelete.length} files from "${folder || '(root)'}"...`);
            const { error: deleteError } = await supabase.storage.from(bucketName).remove(keysToDelete);
            if (deleteError) {
              console.error(`❌ Error deleting files in "${folder}":`, deleteError.message);
            } else {
              console.log(`✅ Deleted files: ${keysToDelete.join(', ')}`);
            }
          } else {
            console.log(`ℹ️ No files to delete in "${folder || '(root)'}".`);
          }
        } else {
          console.log(`ℹ️ Folder "${folder || '(root)'}" is empty.`);
        }
      } catch (e) {
        console.error(`❌ Error cleaning up folder "${folder}":`, e.message);
      }
    }
  } else {
    console.warn('⚠️ Supabase URL or Key not found. Skipping Supabase Storage cleanup.');
  }

  // 3. Clear all database tables and keep only the Super Admin
  try {
    console.log('\n🧹 Clearing database tables (cascading constraints)...');
    
    // Truncate tables. CASCADE ensures all foreign key references are also cleaned up.
    await pool.query('TRUNCATE TABLE exam_history, questions, subtopics, subjects, uploaded_images, s3_images, users CASCADE;');
    console.log('✅ Successfully truncated all tables.');

    // 4. Generate Super Admin user
    const adminUsername = 'superadmin@gmail.com';
    const adminPassword = 'superadmin123!';
    
    console.log(`👤 Creating Super Admin account: "${adminUsername}"...`);
    
    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(adminPassword, saltRounds);

    const insertAdminQuery = `
      INSERT INTO users (
        id, 
        student_id, 
        profile_picture, 
        full_name, 
        username, 
        password, 
        role, 
        phone, 
        is_active, 
        created_at, 
        updated_at
      ) VALUES (
        gen_random_uuid()::text,
        '001',
        NULL,
        'Super Admin',
        $1,
        $2,
        'Super Admin',
        '',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      );
    `;

    await pool.query(insertAdminQuery, [adminUsername, hashedPassword]);
    console.log('✅ Super Admin account created successfully.');
    
  } catch (error) {
    console.error('❌ Database query failed during clean-up:', error.message);
  } finally {
    await pool.end();
    console.log('\n🏁 Database reset process completed.');
  }
}

main().catch(err => {
  console.error('❌ Script execution failed:', err);
  process.exit(1);
});
