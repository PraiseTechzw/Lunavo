const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials. Check your .env file.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('🚀 Starting Notification System Verification...');
    console.log(`📡 Connected to Supabase: ${supabaseUrl}`);

    // 1. Verify Send-Email Function
    console.log('\n📧 Testing [send-email] function...');
    try {
        const { data, error } = await supabase.functions.invoke('send-email', {
            body: {
                to: 'delivered@resend.dev',
                subject: 'PEACE System Check',
                html: '<strong>System check:</strong> Notification services are operational.',
                text: 'System check: Notification services are operational.',
            },
        });

        if (error) {
            console.error('❌ [send-email] Failed:', error);
        } else {
            console.log('✅ [send-email] Success:', data);
        }
    } catch (err) {
        console.error('❌ [send-email] Exception:', err.message);
    }

    // 2. Verify Send-Push Function
    console.log('\n📱 Testing [send-push] function...');
    try {
        const { data, error } = await supabase.functions.invoke('send-push', {
            body: {
                pushToken: 'ExponentPushToken[0000000000000000000000]', // Dummy token
                title: 'System Check',
                body: 'Notification services are operational.',
                data: { type: 'system_check' },
            },
        });

        if (error) {
            console.error('❌ [send-push] Function Error:', error);
            // It implies function ran but maybe Expo rejected token.
        } else {
            console.log('✅ [send-push] Function Invoked:', data);
        }
    } catch (err) {
        console.error('❌ [send-push] Exception:', err.message);
    }
}

test();
