import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/database';
import { getUserPurchases } from '@/lib/shop';

export function usePremiumTheme() {
    const [isGoldThemeUnlocked, setIsGoldThemeUnlocked] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkPurchases() {
            try {
                const user = await getCurrentUser();
                if (user) {
                    const purchases = await getUserPurchases(user.id);
                    const hasGold = purchases.some(p => p.item_id === 'gold-theme');
                    setIsGoldThemeUnlocked(hasGold);
                }
            } catch (error) {
                console.error('Error checking premium theme:', error);
            } finally {
                setLoading(false);
            }
        }

        checkPurchases();
        
        // Polling or refetching logic could go here if needed
        // For now, we'll check on mount
    }, []);

    return { isGoldThemeUnlocked, loading };
}
