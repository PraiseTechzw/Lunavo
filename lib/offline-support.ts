/**
 * Offline Support - Cache, queue actions, sync
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_QUEUE_KEY = 'offline_action_queue';
const CACHE_PREFIX = 'cache_';

export interface OfflineAction {
  id: string;
  type: 'create_post' | 'create_reply' | 'update_post' | 'delete_post' | 'create_report';
  data: any;
  timestamp: string;
  retries: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Check if device is online
 * Note: This is a simplified version. For production, use @react-native-community/netinfo
 */
export async function isOnline(): Promise<boolean> {
  try {
    // Simplified check - in production, use NetInfo
    // For now, assume online (can be enhanced with actual network detection)
    return true;
  } catch (error) {
    console.error('Error checking network status:', error);
    return false;
  }
}

/**
 * Get offline action queue
 */
export async function getOfflineQueue(): Promise<OfflineAction[]> {
  try {
    const queueJson = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return queueJson ? JSON.parse(queueJson) : [];
  } catch (error) {
    console.error('Error getting offline queue:', error);
    return [];
  }
}

/**
 * Add action to offline queue
 */
export async function queueOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retries'>): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    const newAction: OfflineAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      retries: 0,
    };
    queue.push(newAction);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error queueing offline action:', error);
  }
}

/**
 * Remove action from queue
 */
export async function removeOfflineAction(actionId: string): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    const filtered = queue.filter(a => a.id !== actionId);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing offline action:', error);
  }
}

/**
 * Clear offline queue
 */
export async function clearOfflineQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (error) {
    console.error('Error clearing offline queue:', error);
  }
}

/**
 * Sync offline queue when online
 */
export async function syncOfflineQueue(): Promise<number> {
  const online = await isOnline();
  if (!online) {
    return 0;
  }

  const queue = await getOfflineQueue();
  if (queue.length === 0) {
    return 0;
  }

  let synced = 0;
  const failed: OfflineAction[] = [];

  for (const action of queue) {
    try {
      // Execute action based on type
      await executeOfflineAction(action);
      await removeOfflineAction(action.id);
      synced++;
    } catch (error) {
      console.error(`Error syncing action ${action.id}:`, error);
      // Increment retries
      action.retries++;
      if (action.retries < 3) {
        failed.push(action);
      } else {
        // Remove after max retries
        await removeOfflineAction(action.id);
      }
    }
  }

  // Update queue with failed actions
  if (failed.length > 0) {
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failed));
  }

  return synced;
}

/**
 * Execute an offline action
 */
async function executeOfflineAction(action: OfflineAction): Promise<void> {
  // This would call the actual database functions
  // For now, it's a placeholder that would need to be implemented
  // based on the action type
  switch (action.type) {
    case 'create_post':
      // await createPost(action.data);
      break;
    case 'create_reply':
      // await createReply(action.data);
      break;
    // ... other action types
  }
}

/**
 * Cache data with expiration
 */
export async function cacheData<T>(key: string, data: T, ttlMinutes: number = 60): Promise<void> {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMinutes * 60 * 1000,
    };
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
  } catch (error) {
    console.error('Error caching data:', error);
  }
}

/**
 * Get cached data
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const entryJson = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!entryJson) return null;

    const entry: CacheEntry<T> = JSON.parse(entryJson);

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error('Error getting cached data:', error);
    return null;
  }
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));

    for (const key of cacheKeys) {
      const entryJson = await AsyncStorage.getItem(key);
      if (entryJson) {
        const entry: CacheEntry<any> = JSON.parse(entryJson);
        if (Date.now() > entry.expiresAt) {
          await AsyncStorage.removeItem(key);
        }
      }
    }
  } catch (error) {
    console.error('Error clearing expired cache:', error);
  }
}

/**
 * Get cache size (approximate)
 */
export async function getCacheSize(): Promise<number> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
    return cacheKeys.length;
  } catch (error) {
    console.error('Error getting cache size:', error);
    return 0;
  }
}

