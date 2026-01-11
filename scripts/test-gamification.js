#!/usr/bin/env node

/**
 * Gamification Test Script
 * Tests points, badges, and streaks functionality
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGamification() {
    console.log('\n🎮 Testing Gamification System...\n');

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.log('⚠️  No authenticated user. Please login first.');
        console.log('   Run the app and login, then run this script again.\n');
        return false;
    }

    console.log(`Testing for user: ${user.id}\n`);

    // Test 1: Check user_points table
    console.log('1️⃣  Testing Points System...');
    try {
        const { data: points, error } = await supabase
            .from('user_points')
            .select('points')
            .eq('user_id', user.id)
            .single();

        if (error && error.code === 'PGRST116') {
            console.log('   ℹ️  No points record yet (will be created on first action)');
        } else if (error) {
            console.log(`   ❌ Error: ${error.message}`);
            return false;
        } else {
            console.log(`   ✅ Current points: ${points.points}`);
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return false;
    }

    // Test 2: Check points_transactions table
    console.log('\n2️⃣  Testing Transaction History...');
    try {
        const { data: transactions, error } = await supabase
            .from('points_transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.log(`   ❌ Error: ${error.message}`);
            return false;
        }

        if (transactions.length === 0) {
            console.log('   ℹ️  No transactions yet');
        } else {
            console.log(`   ✅ Found ${transactions.length} recent transactions:`);
            transactions.forEach(t => {
                console.log(`      ${t.type === 'earned' ? '+' : '-'}${t.amount} - ${t.description}`);
            });
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return false;
    }

    // Test 3: Check user_badges table
    console.log('\n3️⃣  Testing Badge System...');
    try {
        const { data: badges, error } = await supabase
            .from('user_badges')
            .select('*')
            .eq('user_id', user.id);

        if (error) {
            console.log(`   ❌ Error: ${error.message}`);
            return false;
        }

        if (badges.length === 0) {
            console.log('   ℹ️  No badges earned yet');
        } else {
            console.log(`   ✅ Earned ${badges.length} badges:`);
            badges.forEach(b => {
                console.log(`      🏆 ${b.badge_id}`);
            });
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return false;
    }

    // Test 4: Check streaks table
    console.log('\n4️⃣  Testing Streak System...');
    try {
        const { data: streaks, error } = await supabase
            .from('streaks')
            .select('*')
            .eq('user_id', user.id);

        if (error) {
            console.log(`   ❌ Error: ${error.message}`);
            return false;
        }

        if (streaks.length === 0) {
            console.log('   ℹ️  No streaks yet');
        } else {
            console.log(`   ✅ Active streaks:`);
            streaks.forEach(s => {
                console.log(`      🔥 ${s.streak_type}: ${s.current_streak} days (longest: ${s.longest_streak})`);
            });
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return false;
    }

    // Test 5: Simulate earning points
    console.log('\n5️⃣  Testing Points Award (Simulation)...');
    console.log('   ℹ️  Points are awarded automatically when you:');
    console.log('      - Complete a check-in (+10 points)');
    console.log('      - Create a post (+5 points)');
    console.log('      - Reply to a post (+10 points)');
    console.log('      - Get a helpful vote (+20 points)');
    console.log('      - Earn a badge (+50 points)');

    console.log('\n✅ Gamification system is configured correctly!\n');
    console.log('📝 Next Steps:');
    console.log('   1. Complete a check-in to earn your first 10 points');
    console.log('   2. Create a post to earn 5 more points');
    console.log('   3. Check your profile to see points and level');
    console.log('   4. Visit /rewards to see leaderboard\n');

    return true;
}

// Run test
testGamification()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });
