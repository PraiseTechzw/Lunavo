/**
 * Rewards Shop Logic
 */

import { spendPoints } from './points-system';
import { supabase } from './supabase';

export interface ShopItem {
    id: string;
    name: string;
    description: string;
    price: number;
    icon: string;
    category: 'profile' | 'badge' | 'charity' | 'theme';
}

export const SHOP_ITEMS: ShopItem[] = [
    {
        id: 'gold-theme',
        name: 'Golden Aesthetics',
        description: 'Unlock a premium gold theme for your entire application experience.',
        price: 1500,
        icon: 'palette',
        category: 'theme'
    },
    {
        id: 'donor-badge',
        name: 'Supportive Soul Badge',
        description: 'An exclusive badge for those who contribute back to the community.',
        price: 300,
        icon: 'favorite',
        category: 'badge'
    },
    {
        id: 'charity-counseling',
        name: 'Subsidize Counseling',
        description: 'Donate your points to help fund extra counseling sessions for students in need.',
        price: 2000,
        icon: 'volunteer-activism',
        category: 'charity'
    },
    {
        id: 'custom-frame',
        name: 'Premium Avatar Frame',
        description: 'A dynamic animated border for your profile avatar.',
        price: 800,
        icon: 'portrait',
        category: 'profile'
    },
    {
        id: 'tree-planting',
        name: 'Plant a Peace Tree',
        description: 'Redeem points to have a tree planted on campus in the PEACE Garden.',
        price: 1200,
        icon: 'park',
        category: 'charity'
    }
];

export async function buyItem(userId: string, itemId: string): Promise<{ success: boolean; message: string }> {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return { success: false, message: 'Item not found' };

    // 1. Spend points
    const spent = await spendPoints(
        userId,
        item.price,
        'purchase',
        `Purchased ${item.name} from Rewards Shop`
    );

    if (!spent) {
        return { success: false, message: 'Insufficient points' };
    }

    // Reward the item based on its category
    if (item.category === 'badge') { // Corrected 'badges' to 'badge' to match ShopItem interface
      const { awardBadge } = await import('./gamification');
      await awardBadge(userId, item.id);
    }

    // Record the purchase in the database
    await supabase.from('user_purchases').insert({
      user_id: userId,
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      price: item.price,
      metadata: { icon: item.icon }
    });

    return { success: true, message: `Successfully purchased ${item.name}!` };
}
