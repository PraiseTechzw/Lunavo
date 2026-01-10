/**
 * Apply Migration: Allow User Registration
 * 
 * This script applies the 014_allow_user_registration.sql migration
 * to fix the RLS policy error during user registration.
 * 
 * Run this with: npx tsx scripts/apply-migration.ts
 * Or: node scripts/apply-migration.js (if you transpile it)
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing environment variables');
    console.error('Please set:');
    console.error('  - EXPO_PUBLIC_SUPABASE_URL');
    console.error('  - SUPABASE_SERVICE_ROLE_KEY (from Supabase Dashboard > Settings > API)');
    process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function applyMigration() {
    console.log('🚀 Applying migration: 014_allow_user_registration.sql');

    try {
        // Read the migration file
        const migrationPath = path.join(__dirname, '../supabase/migrations/014_allow_user_registration.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

        console.log('📄 Migration SQL:');
        console.log(migrationSQL);
        console.log('\n⏳ Executing...\n');

        // Execute the migration
        const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

        if (error) {
            // If exec_sql doesn't exist, try direct query
            console.log('⚠️  exec_sql RPC not found, trying direct execution...');

            // Split by semicolons and execute each statement
            const statements = migrationSQL
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            for (const statement of statements) {
                console.log(`Executing: ${statement.substring(0, 50)}...`);
                const { error: stmtError } = await supabase.rpc('exec', { query: statement });

                if (stmtError) {
                    console.error(`❌ Error executing statement:`, stmtError);
                    throw stmtError;
                }
            }
        }

        console.log('✅ Migration applied successfully!');
        console.log('\n🎉 You can now register users without RLS errors.');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.error('\n📋 Manual steps:');
        console.error('1. Go to your Supabase Dashboard');
        console.error('2. Navigate to SQL Editor');
        console.error('3. Paste the contents of supabase/migrations/014_allow_user_registration.sql');
        console.error('4. Click Run');
        process.exit(1);
    }
}

// Run the migration
applyMigration();
