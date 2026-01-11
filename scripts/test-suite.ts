/**
 * Automated Test Suite for PEACE Platform
 * Run this script to validate all core functionality
 */

import { createCheckIn, createPost, createReply, getCurrentUser } from '../lib/database';
import { checkAllBadges, getStreakInfo } from '../lib/gamification';
import { getPointsHistory, getUserPoints } from '../lib/points-system';
import { supabase } from '../lib/supabase';

// Test results tracker
const results: { test: string; passed: boolean; error?: string }[] = [];

function logTest(name: string, passed: boolean, error?: string) {
    results.push({ test: name, passed, error });
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${name}`);
    if (error) console.error(`   Error: ${error}`);
}

async function runTests() {
    console.log('\n🧪 Starting PEACE Platform Test Suite...\n');

    // Test 1: Database Connection
    try {
        const { data, error } = await supabase.from('users').select('count').limit(1);
        logTest('Database Connection', !error);
    } catch (error) {
        logTest('Database Connection', false, String(error));
    }

    // Test 2: User Authentication
    try {
        const user = await getCurrentUser();
        logTest('User Authentication', !!user);
    } catch (error) {
        logTest('User Authentication', false, String(error));
    }

    // Test 3: Points System - Get Points
    try {
        const user = await getCurrentUser();
        if (user) {
            const points = await getUserPoints(user.id);
            logTest('Points System - Get Points', typeof points === 'number');
        } else {
            logTest('Points System - Get Points', false, 'No user found');
        }
    } catch (error) {
        logTest('Points System - Get Points', false, String(error));
    }

    // Test 4: Points System - Transaction History
    try {
        const user = await getCurrentUser();
        if (user) {
            const history = await getPointsHistory(user.id, 10);
            logTest('Points System - Transaction History', Array.isArray(history));
        } else {
            logTest('Points System - Transaction History', false, 'No user found');
        }
    } catch (error) {
        logTest('Points System - Transaction History', false, String(error));
    }

    // Test 5: Streak System
    try {
        const user = await getCurrentUser();
        if (user) {
            const streak = await getStreakInfo(user.id, 'check-in');
            logTest('Streak System', typeof streak.current === 'number');
        } else {
            logTest('Streak System', false, 'No user found');
        }
    } catch (error) {
        logTest('Streak System', false, String(error));
    }

    // Test 6: Badge System
    try {
        const user = await getCurrentUser();
        if (user) {
            const badges = await checkAllBadges(user.id);
            logTest('Badge System', Array.isArray(badges));
        } else {
            logTest('Badge System', false, 'No user found');
        }
    } catch (error) {
        logTest('Badge System', false, String(error));
    }

    // Test 7: Check-in Creation
    try {
        const user = await getCurrentUser();
        if (user) {
            const checkIn = await createCheckIn({
                userId: user.id,
                mood: 'good',
                feelingStrength: 7,
                note: 'Test check-in',
                date: new Date().toISOString().split('T')[0],
            });
            logTest('Check-in Creation', !!checkIn);
        } else {
            logTest('Check-in Creation', false, 'No user found');
        }
    } catch (error) {
        logTest('Check-in Creation', false, String(error));
    }

    // Test 8: Post Creation
    try {
        const user = await getCurrentUser();
        if (user) {
            const post = await createPost({
                authorId: user.id,
                title: 'Test Post',
                content: 'This is a test post',
                category: 'general',
                isAnonymous: false,
            });
            logTest('Post Creation', !!post);
        } else {
            logTest('Post Creation', false, 'No user found');
        }
    } catch (error) {
        logTest('Post Creation', false, String(error));
    }

    // Test 9: Reply Creation
    try {
        const user = await getCurrentUser();
        if (user) {
            // Get a post to reply to
            const { data: posts } = await supabase
                .from('posts')
                .select('id')
                .limit(1)
                .single();

            if (posts) {
                const reply = await createReply({
                    postId: posts.id,
                    authorId: user.id,
                    content: 'Test reply',
                    isAnonymous: false,
                });
                logTest('Reply Creation', !!reply);
            } else {
                logTest('Reply Creation', false, 'No posts found');
            }
        } else {
            logTest('Reply Creation', false, 'No user found');
        }
    } catch (error) {
        logTest('Reply Creation', false, String(error));
    }

    // Test 10: Real-time Subscriptions
    try {
        const channel = supabase
            .channel('test-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => { })
            .subscribe();

        logTest('Real-time Subscriptions', channel.state === 'joined');
        await channel.unsubscribe();
    } catch (error) {
        logTest('Real-time Subscriptions', false, String(error));
    }

    // Print Summary
    console.log('\n📊 Test Summary:\n');
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

    if (failed > 0) {
        console.log('❌ Failed Tests:');
        results.filter(r => !r.passed).forEach(r => {
            console.log(`   - ${r.test}: ${r.error}`);
        });
    }

    return { passed, failed, total };
}

// Run tests if executed directly
if (require.main === module) {
    runTests()
        .then(({ passed, failed }) => {
            process.exit(failed > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('Test suite failed:', error);
            process.exit(1);
        });
}

export { runTests };
