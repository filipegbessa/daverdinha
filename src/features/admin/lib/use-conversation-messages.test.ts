import { act, renderHook, waitFor } from '@testing-library/react';
import { useConversationMessages } from './use-conversation-messages';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');

const message = (id: string, createdAt: string) => ({
  id,
  direction: 'inbound' as const,
  body: id,
  createdAt,
});

const m1 = message('m1', '2026-09-16T12:00:00.000Z');
const m2 = message('m2', '2026-09-16T12:00:01.000Z');
const m3 = message('m3', '2026-09-16T12:00:02.000Z');

describe('useConversationMessages', () => {
  let apiFetch: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    apiFetch = jest.fn().mockResolvedValue([]);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
  });

  afterEach(() => jest.useRealTimers());

  it('starts from the page that came with the conversation', () => {
    const { result } = renderHook(() => useConversationMessages('c1', [m1, m2], true));

    expect(result.current.messages).toEqual([m1, m2]);
    expect(result.current.hasMore).toBe(true);
  });

  it('polls from the newest message it holds, not from the start of the thread', async () => {
    renderHook(() => useConversationMessages('c1', [m1, m2], false));

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(apiFetch).toHaveBeenCalledWith(
      `/conversations/c1/messages?since=${encodeURIComponent(m2.createdAt)}`,
    );
  });

  it('appends what the poll returns', async () => {
    apiFetch.mockResolvedValue([m3]);
    const { result } = renderHook(() => useConversationMessages('c1', [m1, m2], false));

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => expect(result.current.messages.map((m) => m.id)).toEqual(['m1', 'm2', 'm3']));
  });

  it('drops the boundary message the inclusive `since` re-sends, instead of duplicating it', async () => {
    apiFetch.mockResolvedValue([m2, m3]);
    const { result } = renderHook(() => useConversationMessages('c1', [m1, m2], false));

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => expect(result.current.messages.map((m) => m.id)).toEqual(['m1', 'm2', 'm3']));
  });

  it('survives a failed poll and keeps what it had', async () => {
    apiFetch.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useConversationMessages('c1', [m1, m2], false));

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.messages).toEqual([m1, m2]);
  });

  it('loads older history from before the oldest message it holds', async () => {
    apiFetch.mockResolvedValue([]);
    const { result } = renderHook(() => useConversationMessages('c1', [m2, m3], true));

    await act(async () => {
      await result.current.loadOlder();
    });

    expect(apiFetch).toHaveBeenCalledWith(
      `/conversations/c1/messages?before=${encodeURIComponent(m2.createdAt)}&limit=50`,
    );
  });

  it('prepends older messages in chronological order', async () => {
    apiFetch.mockResolvedValue([m1]);
    const { result } = renderHook(() => useConversationMessages('c1', [m2, m3], true));

    await act(async () => {
      await result.current.loadOlder();
    });

    expect(result.current.messages.map((m) => m.id)).toEqual(['m1', 'm2', 'm3']);
  });

  it('stops offering more history once a short page comes back', async () => {
    apiFetch.mockResolvedValue([m1]);
    const { result } = renderHook(() => useConversationMessages('c1', [m2, m3], true));

    await act(async () => {
      await result.current.loadOlder();
    });

    expect(result.current.hasMore).toBe(false);
  });
});
