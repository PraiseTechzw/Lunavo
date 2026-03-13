/**
 * AI Assistant Logic - Rule-based intent detection
 */

export interface AIResponse {
    text: string;
    action?: string;
    actionLabel?: string;
}

export function processAIPrompt(prompt: string): AIResponse {
    const p = prompt.toLowerCase();

    // Help & Crisis
    if (p.includes('help') || p.includes('crisis') || p.includes('urgent') || p.includes('suicide') || p.includes('die') || p.includes('kill')) {
        return {
            text: "I'm here for you. If you're in immediate danger, please use our Urgent Support resources. You're not alone, and there's always someone to talk to.",
            action: '/urgent-support',
            actionLabel: 'Get Urgent Support'
        };
    }

    // Leaderboard & Points
    if (p.includes('leaderboard') || p.includes('rank') || p.includes('top')) {
        return {
            text: "Want to see how you compare? Check out the leaderboard to see the top contributors and your current standing in the community!",
            action: '/leaderboard',
            actionLabel: 'View Leaderboard'
        };
    }

    // Rewards & Shop
    if (p.includes('shop') || p.includes('buy') || p.includes('spend')) {
        return {
            text: "You can spend your hard-earned points in the Rewards Shop on profile customizations, charity donations, and more!",
            action: '/rewards-shop',
            actionLabel: 'Go to Shop'
        };
    }

    // Points
    if (p.includes('points') || p.includes('earn') || p.includes('reward')) {
        return {
            text: "You can earn points by checking in daily (+10), responding helpfully to peers (+20), and participating in meetings (+25). Visit the Rewards screen to see your history.",
            action: '/rewards',
            actionLabel: 'View Rewards'
        };
    }

    // Check-in
    if (p.includes('check') || p.includes('mood') || p.includes('journal')) {
        return {
            text: "Logging your mood daily is a great way to track your wellbeing and earn points. Would you like to check in now?",
            action: '/check-in',
            actionLabel: 'Daily Check-in'
        };
    }

    // Forum
    if (p.includes('post') || p.includes('forum') || p.includes('community') || p.includes('share')) {
        return {
            text: "The community forum is where you can share your story and support others. Try browsing a category or sharing a post about how you're feeling.",
            action: '/(tabs)/forum',
            actionLabel: 'Go to Forum'
        };
    }

    // Counselor
    if (p.includes('counselor') || p.includes('professional') || p.includes('therapy') || p.includes('talk') || p.includes('appointment')) {
        return {
            text: "Sometimes it helps to talk to a professional. You can book a session with one of our counselors anonymously through the app.",
            action: '/book-counsellor',
            actionLabel: 'Book Counselor'
        };
    }

    // Academic
    if (p.includes('study') || p.includes('exam') || p.includes('test') || p.includes('academic') || p.includes('school')) {
        return {
            text: "Academic stress is real. We have dedicated peer mentors and resources to help you with your studies and time management.",
            action: '/academic-help',
            actionLabel: 'Get Academic Help'
        };
    }

    // Profile
    if (p.includes('profile') || p.includes('settings') || p.includes('edit')) {
        return {
            text: "You can update your bio, interests, and pseudonym in your profile settings to better represent yourself in the community.",
            action: '/profile-settings',
            actionLabel: 'Profile Settings'
        };
    }

    // Default
    return {
        text: "I'm your AI Assistant. I can help you find resources, navigate the app, or connect you with support. What would you like to do?",
    };
}
