import { renderHook, act, waitFor } from '@testing-library/react';
import { usePushSubscription } from './use-push-subscription';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');

describe('usePushSubscription', () => {
  const originalNotification = window.Notification;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'AA-_';
  });

  afterEach(() => {
    Object.defineProperty(window, 'Notification', { value: originalNotification, configurable: true });
    delete (window.navigator as { serviceWorker?: unknown }).serviceWorker;
  });

  it('requests permission, subscribes via the service worker, and posts the subscription to the backend', async () => {
    const apiFetch = jest.fn().mockResolvedValue(undefined);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    const requestPermission = jest.fn().mockResolvedValue('granted');
    Object.defineProperty(window, 'Notification', {
      value: { requestPermission, permission: 'default' },
      configurable: true,
    });

    const subscriptionJson = { endpoint: 'https://push.example/1', keys: { p256dh: 'a', auth: 'b' } };
    const subscribe = jest.fn().mockResolvedValue({ toJSON: () => subscriptionJson });
    Object.defineProperty(window.navigator, 'serviceWorker', {
      value: { ready: Promise.resolve({ pushManager: { subscribe } }) },
      configurable: true,
    });
    Object.defineProperty(window, 'PushManager', { value: function PushManager() {}, configurable: true });

    const { result } = renderHook(() => usePushSubscription());

    await act(async () => {
      await result.current.subscribe();
    });

    expect(requestPermission).toHaveBeenCalled();
    expect(subscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: expect.any(Uint8Array),
    });
    expect(apiFetch).toHaveBeenCalledWith('/push-subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscriptionJson),
    });
    expect(result.current.error).toBeNull();
  });

  it('sets an error and does not call the API when permission is denied', async () => {
    const apiFetch = jest.fn();
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    Object.defineProperty(window, 'Notification', {
      value: { requestPermission: jest.fn().mockResolvedValue('denied'), permission: 'default' },
      configurable: true,
    });
    Object.defineProperty(window.navigator, 'serviceWorker', { value: {}, configurable: true });
    Object.defineProperty(window, 'PushManager', { value: function PushManager() {}, configurable: true });

    const { result } = renderHook(() => usePushSubscription());

    await act(async () => {
      await result.current.subscribe();
    });

    expect(apiFetch).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Permissão de notificação negada.');
  });

  it('sets an error when the browser has no PushManager support', async () => {
    Object.defineProperty(window.navigator, 'serviceWorker', { value: {}, configurable: true });
    delete (window as { PushManager?: unknown }).PushManager;

    const { result } = renderHook(() => usePushSubscription());

    await act(async () => {
      await result.current.subscribe();
    });

    expect(result.current.error).toBe('Este navegador não suporta notificações push.');
  });
});
