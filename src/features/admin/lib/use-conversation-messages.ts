'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useApiClient } from '@/features/admin/lib/api-client';
import type { Message } from '@/features/admin/types/admin';

const POLL_INTERVAL_MS = 5000;
const PAGE_SIZE = 50;

interface UseConversationMessagesResult {
  messages: Message[];
  hasMore: boolean;
  isLoadingOlder: boolean;
  loadOlder: () => void;
}

/**
 * Keeps a conversation's transcript fresh without re-downloading it.
 *
 * The page used to re-fetch every message in the conversation every five
 * seconds; a long-running customer thread meant hundreds of rows over the
 * wire, over and over, to discover that nothing had changed. This polls with
 * `?since=` instead, so a quiet conversation costs an empty array.
 *
 * `since` is inclusive on the server (timestamps are millisecond-resolution
 * and the bot can write two messages inside the same one), so the boundary
 * message comes back on every poll — merging is keyed by id to drop it.
 */
export function useConversationMessages(
  conversationId: string,
  initial: Message[],
  initialHasMore: boolean,
): UseConversationMessagesResult {
  const { apiFetch } = useApiClient();
  const [messages, setMessages] = useState<Message[]>(initial);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);

  // Held in a ref so the poll effect doesn't re-subscribe on every new
  // message — restarting the interval each time would drift it indefinitely.
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // The initial page arrives with the conversation itself; adopt it once,
  // then let polling own the list.
  const seededFor = useRef<string | null>(null);
  useEffect(() => {
    if (seededFor.current === conversationId || initial.length === 0) return;
    seededFor.current = conversationId;
    setMessages(initial);
    setHasMore(initialHasMore);
  }, [conversationId, initial, initialHasMore]);

  const merge = useCallback((incoming: Message[]) => {
    if (incoming.length === 0) return;
    setMessages((current) => {
      const byId = new Map(current.map((message) => [message.id, message]));
      for (const message of incoming) byId.set(message.id, message);
      return [...byId.values()].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    });
  }, []);

  useEffect(() => {
    if (!conversationId) return;

    let cancelled = false;
    const poll = async () => {
      const latest = messagesRef.current.at(-1);
      if (!latest) return;
      try {
        const fresh = await apiFetch<Message[]>(
          `/conversations/${conversationId}/messages?since=${encodeURIComponent(latest.createdAt)}`,
        );
        if (!cancelled) merge(fresh);
      } catch {
        // A dropped poll is not worth surfacing — the next tick retries, and
        // the page already reports failures from the conversation itself.
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [apiFetch, conversationId, merge]);

  const loadOlder = useCallback(async () => {
    const oldest = messagesRef.current[0];
    if (!oldest || isLoadingOlder) return;

    setIsLoadingOlder(true);
    try {
      const older = await apiFetch<Message[]>(
        `/conversations/${conversationId}/messages?before=${encodeURIComponent(oldest.createdAt)}&limit=${PAGE_SIZE}`,
      );
      merge(older);
      // A short page means we reached the start of the conversation.
      if (older.length < PAGE_SIZE) setHasMore(false);
    } catch {
      // Leave `hasMore` alone so the operator can try again.
    } finally {
      setIsLoadingOlder(false);
    }
  }, [apiFetch, conversationId, isLoadingOlder, merge]);

  return { messages, hasMore, isLoadingOlder, loadOlder };
}
