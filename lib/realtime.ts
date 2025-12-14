/**
 * Real-time subscription utilities for Supabase
 */

import { Conversation, Message, Post, Reply } from '@/app/types';
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

/**
 * Subscribe to new messages in a conversation
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (message: Message) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        const { data } = await supabase
          .from('messages')
          .select(`
            *,
            users!messages_sender_id_fkey(pseudonym, role)
          `)
          .eq('id', payload.new.id)
          .single();

        if (data) {
          const senderPseudonym = data.users?.pseudonym || 'Anonymous';
          const senderRole = data.users?.role;
          const message: Message = {
            id: data.id,
            conversationId: data.conversation_id,
            senderId: data.sender_id,
            senderPseudonym,
            senderRole,
            content: data.content,
            messageType: data.message_type || 'text',
            status: data.status || 'sent',
            attachmentUrl: data.attachment_url || undefined,
            readAt: data.read_at ? new Date(data.read_at) : undefined,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
          };
          callback(message);
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to message updates (status changes, etc.)
 */
export function subscribeToMessageUpdates(
  conversationId: string,
  callback: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; message: Message | null }) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`messages-updates:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        if (payload.eventType === 'DELETE') {
          callback({ eventType: 'DELETE', message: null });
          return;
        }

        const { data } = await supabase
          .from('messages')
          .select(`
            *,
            users!messages_sender_id_fkey(pseudonym, role)
          `)
          .eq('id', payload.new.id)
          .single();

        if (data) {
          const senderPseudonym = data.users?.pseudonym || 'Anonymous';
          const senderRole = data.users?.role;
          const message: Message = {
            id: data.id,
            conversationId: data.conversation_id,
            senderId: data.sender_id,
            senderPseudonym,
            senderRole,
            content: data.content,
            messageType: data.message_type || 'text',
            status: data.status || 'sent',
            attachmentUrl: data.attachment_url || undefined,
            readAt: data.read_at ? new Date(data.read_at) : undefined,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
          };
          callback({ eventType: payload.eventType as 'INSERT' | 'UPDATE', message });
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to conversation updates (new messages, status changes, etc.)
 */
export function subscribeToConversations(
  userId: string,
  callback: (conversation: Conversation) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`conversations:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
      },
      async (payload) => {
        // Only process conversations relevant to this user
        const conversationData = payload.new || payload.old;
        if (conversationData.user_id === userId || conversationData.supporter_id === userId) {
          const { data } = await supabase
            .from('conversations')
            .select(`
              *,
              user:users!conversations_user_id_fkey(pseudonym, role),
              supporter:users!conversations_supporter_id_fkey(pseudonym, role),
              last_message:messages!conversations_last_message_id_fkey(content)
            `)
            .eq('id', conversationData.id)
            .single();

          if (data) {
            const conversation: Conversation = {
              id: data.id,
              userId: data.user_id,
              userPseudonym: data.user?.pseudonym || 'Anonymous',
              supporterId: data.supporter_id || undefined,
              supporterPseudonym: data.supporter?.pseudonym || undefined,
              supporterRole: data.supporter?.role,
              title: data.title || undefined,
              lastMessageId: data.last_message_id || undefined,
              lastMessage: data.last_message?.content || undefined,
              lastMessageAt: data.last_message_at ? new Date(data.last_message_at) : undefined,
              unreadCountUser: data.unread_count_user || 0,
              unreadCountSupporter: data.unread_count_supporter || 0,
              isArchived: data.is_archived || false,
              isResolved: data.is_resolved || false,
              createdAt: new Date(data.created_at),
              updatedAt: new Date(data.updated_at),
            };
            callback(conversation);
          }
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to typing indicators in a conversation
 */
export function subscribeToTypingIndicators(
  conversationId: string,
  callback: (payload: { userId: string; isTyping: boolean } | null) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`typing:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'typing_indicators',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        if (payload.eventType === 'DELETE') {
          callback(null);
          return;
        }

        const { data } = await supabase
          .from('typing_indicators')
          .select('user_id, is_typing, updated_at')
          .eq('conversation_id', conversationId)
          .eq('is_typing', true)
          .gt('updated_at', new Date(Date.now() - 5000).toISOString())
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data && data.is_typing) {
          callback({ userId: data.user_id, isTyping: true });
        } else {
          callback(null);
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to online status changes for a user
 */
export function subscribeToOnlineStatus(
  userId: string,
  callback: (isOnline: boolean) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`online-status:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_online_status',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const data = payload.new || payload.old;
        if (data) {
          // Check if user is considered online (marked online and seen in last 30 seconds)
          if (data.is_online) {
            const lastSeen = new Date(data.last_seen);
            const now = new Date();
            const diffSeconds = (now.getTime() - lastSeen.getTime()) / 1000;
            callback(diffSeconds < 30);
          } else {
            callback(false);
          }
        }
      }
    )
    .subscribe();

  return channel;
}

