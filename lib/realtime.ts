/**
 * Real-time subscription utilities for Supabase
 */

import { Post, Reply } from '@/app/types';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

/**
 * Subscribe to new posts
 */
export function subscribeToPosts(
  callback: (post: Post) => void
): RealtimeChannel {
  const channel = supabase
    .channel('posts')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
      },
      async (payload) => {
        // Fetch the full post with author info
        const { data } = await supabase
          .from('posts')
          .select(`
            *,
            users!posts_author_id_fkey(pseudonym)
          `)
          .eq('id', payload.new.id)
          .single();

        if (data) {
          const authorPseudonym = data.users?.pseudonym || 'Anonymous';
          const post: Post = {
            id: data.id,
            authorId: data.author_id,
            authorPseudonym,
            category: data.category,
            title: data.title,
            content: data.content,
            status: data.status,
            escalationLevel: data.escalation_level,
            escalationReason: data.escalation_reason || undefined,
            isAnonymous: data.is_anonymous,
            tags: data.tags || [],
            upvotes: data.upvotes || 0,
            replies: [],
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
            reportedCount: data.reported_count || 0,
            isFlagged: data.is_flagged || false,
          };
          callback(post);
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to post updates
 */
export function subscribeToPostUpdates(
  postId: string,
  callback: (post: Post) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`post:${postId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'posts',
        filter: `id=eq.${postId}`,
      },
      async (payload) => {
        const { data } = await supabase
          .from('posts')
          .select(`
            *,
            users!posts_author_id_fkey(pseudonym)
          `)
          .eq('id', payload.new.id)
          .single();

        if (data) {
          const authorPseudonym = data.users?.pseudonym || 'Anonymous';
          const post: Post = {
            id: data.id,
            authorId: data.author_id,
            authorPseudonym,
            category: data.category,
            title: data.title,
            content: data.content,
            status: data.status,
            escalationLevel: data.escalation_level,
            escalationReason: data.escalation_reason || undefined,
            isAnonymous: data.is_anonymous,
            tags: data.tags || [],
            upvotes: data.upvotes || 0,
            replies: [],
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
            reportedCount: data.reported_count || 0,
            isFlagged: data.is_flagged || false,
          };
          callback(post);
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to new replies for a post
 */
export function subscribeToReplies(
  postId: string,
  callback: (reply: Reply) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`replies:${postId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'replies',
        filter: `post_id=eq.${postId}`,
      },
      async (payload) => {
        const { data } = await supabase
          .from('replies')
          .select(`
            *,
            users!replies_author_id_fkey(pseudonym)
          `)
          .eq('id', payload.new.id)
          .single();

        if (data) {
          const authorPseudonym = data.users?.pseudonym || 'Anonymous';
          const reply: Reply = {
            id: data.id,
            postId: data.post_id,
            authorId: data.author_id,
            authorPseudonym,
            content: data.content,
            isAnonymous: data.is_anonymous,
            isHelpful: data.is_helpful || 0,
            isFromVolunteer: data.is_from_volunteer || false,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
            reportedCount: data.reported_count || 0,
          };
          callback(reply);
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to escalations
 */
export function subscribeToEscalations(
  callback: (escalation: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel('escalations')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'escalations',
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to notifications for a user
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notification: any) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from a channel
 */
export function unsubscribe(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}

/**
 * Subscribe to post updates (INSERT, UPDATE, DELETE)
 */
export function subscribeToPostChanges(
  callback: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; post: Post | null }) => void
): RealtimeChannel {
  const channel = supabase
    .channel('posts-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'posts',
      },
      async (payload) => {
        if (payload.eventType === 'DELETE') {
          callback({ eventType: 'DELETE', post: null });
          return;
        }

        const { data } = await supabase
          .from('posts')
          .select(`
            *,
            users!posts_author_id_fkey(pseudonym)
          `)
          .eq('id', payload.new.id)
          .single();

        if (data) {
          const authorPseudonym = data.users?.pseudonym || 'Anonymous';
          const post: Post = {
            id: data.id,
            authorId: data.author_id,
            authorPseudonym,
            category: data.category,
            title: data.title,
            content: data.content,
            status: data.status,
            escalationLevel: data.escalation_level,
            escalationReason: data.escalation_reason || undefined,
            isAnonymous: data.is_anonymous,
            tags: data.tags || [],
            upvotes: data.upvotes || 0,
            replies: [],
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
            reportedCount: data.reported_count || 0,
            isFlagged: data.is_flagged || false,
          };
          callback({ eventType: payload.eventType as 'INSERT' | 'UPDATE', post });
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to reply updates for a post
 */
export function subscribeToReplyChanges(
  postId: string,
  callback: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; reply: Reply | null }) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`replies-changes:${postId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'replies',
        filter: `post_id=eq.${postId}`,
      },
      async (payload) => {
        if (payload.eventType === 'DELETE') {
          callback({ eventType: 'DELETE', reply: null });
          return;
        }

        const { data } = await supabase
          .from('replies')
          .select(`
            *,
            users!replies_author_id_fkey(pseudonym)
          `)
          .eq('id', payload.new.id)
          .single();

        if (data) {
          const authorPseudonym = data.users?.pseudonym || 'Anonymous';
          const reply: Reply = {
            id: data.id,
            postId: data.post_id,
            authorId: data.author_id,
            authorPseudonym,
            content: data.content,
            isAnonymous: data.is_anonymous,
            isHelpful: data.is_helpful || 0,
            isFromVolunteer: data.is_from_volunteer || false,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
            reportedCount: data.reported_count || 0,
          };
          callback({ eventType: payload.eventType as 'INSERT' | 'UPDATE', reply });
        }
      }
    )
    .subscribe();

  return channel;
}

