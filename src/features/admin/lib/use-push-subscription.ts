'use client';

import { useCallback, useState } from 'react';
import { useApiClient } from './api-client';
import { urlBase64ToUint8Array } from './url-base64-to-uint8-array';

export function usePushSubscription() {
  const { apiFetch } = useApiClient();
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribe = useCallback(async () => {
    setError(null);
    setSubscribing(true);
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Este navegador não suporta notificações push.');
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permissão de notificação negada.');
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });

      await apiFetch('/push-subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscription.toJSON()),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível ativar as notificações.');
    } finally {
      setSubscribing(false);
    }
  }, [apiFetch]);

  return { subscribe, subscribing, error };
}
