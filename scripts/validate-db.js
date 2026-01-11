#!/usr/bin/env node

/**
 * Database Validation Script
 * Checks if all required tables, columns, and policies exist
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Required tables and their key columns
const REQUIRED_TABLES = {
    users: ['id', 'email', 'pseudonym', 'role', 'created_at'],
    user_points: ['user_id', 'points', 'created_at', 'updated_at'],
    points_transactions: ['id', 'user_id', 'amount', 'type', 'category', 'description', 'created_at'],
    user_badges: ['id', 'user_id', 'badge_id', 'earned_at'],
    streaks: ['id', 'user_id', 'streak_type', 'current_streak', 'longest_streak', 'last_activity_date'],
    check_ins: ['id', 'user_id', 'mood', 'date', 'created_at'],
    posts: ['id', 'author_id', 'title', 'content', 'category', 'created_at'],
    replies: ['id', 'post_id', 'author_id', 'content', 'created_at'],
    support_sessions: ['id', 'educator_id', 'student_pseudonym', 'status', 'priority', 'created_at'],
    support_messages: ['id', 'session_id', 'sender_id', 'content', 'created_at'],
};

async function validateDatabase() {
    console.log('\n🔍 Validating Database Schema...\n');

    let allValid = true;

    // Check each table
    for (const [tableName, columns] of Object.entries(REQUIRED_TABLES)) {
        try {
            // Try to query the table
            const { data, error } = await supabase
                .from(tableName)
                .select(columns.join(','))
                .limit(1);

            if (error) {
                console.log(`❌ Table '${tableName}': ${error.message}`);
                allValid = false;
            } else {
                console.log(`✅ Table '${tableName}': OK`);
            }
        } catch (error) {
            console.log(`❌ Table '${tableName}': ${error.message}`);
            allValid = false;
        }
    }

    console.log('\n🔐 Checking RLS Policies...\n');

    // Check if RLS is enabled (this requires service role, so we'll just note it)
    const rlsTables = [
        'user_points',
        'points_transactions',
        'user_badges',
        'streaks',
        'support_sessions',
        'support_messages',
    ];

    console.log('⚠️  RLS Policy check requires service role access');
    console.log('   Please verify manually in Supabase Dashboard:');
    rlsTables.forEach(table => {
        console.log(`   - ${table}`);
    });

    console.log('\n📊 Validation Summary:\n');
    if (allValid) {
        console.log('✅ All required tables exist and are accessible');
        console.log('✅ Database schema is valid');
        return true;
    } else {
        console.log('❌ Some tables are missing or inaccessible');
        console.log('   Run migrations: supabase db push');
        return false;
    }
}

// Run validation
validateDatabase()
    .then(valid => {
        process.exit(valid ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Validation failed:', error);
        process.exit(1);
    });
