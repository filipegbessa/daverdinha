'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePushSubscription } from '@/features/admin/lib/use-push-subscription';

export function PushNotificationBanner() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const { subscribe, subscribing, error } = usePushSubscription();

  useEffect(() => {
    if (typeof Notification === 'undefined') {
      setPermission('unsupported');
      return;
    }
    const currentPermission = Notification.permission;
    setPermission(currentPermission);

    if (currentPermission !== 'granted' || !('serviceWorker' in navigator)) {
      return;
    }

    // Permission was already granted in the past, but we may not actually have
    // a live browser subscription (e.g. the very first subscribe attempt failed
    // after permission was granted). Check quietly and, if it's missing, try to
    // (re)establish it. This never calls requestPermission() again — it only
    // reads existing state via getSubscription().
    let cancelled = false;
    (async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();
        if (!cancelled && !existingSubscription) {
          await subscribe();
        }
      } catch {
        // Best-effort background check; any failure surfaces via the error
        // state returned from subscribe() and keeps the banner visible.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [subscribe]);

  async function handleClick() {
    await subscribe();
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission);
    }
  }

  if (permission !== 'default' && !error) return null;

  return (
    <div className="flex flex-none flex-wrap items-center justify-between gap-3 border-b border-moss-line bg-sand px-4 py-2 text-sm">
      <p className="text-ink-soft">Ative as notificações pra saber na hora quando chegar uma mensagem nova.</p>
      <Button type="button" onClick={handleClick} disabled={subscribing} size="sm">
        {subscribing ? 'Ativando...' : 'Ativar notificações'}
      </Button>
      {error && (
        <p role="alert" className="w-full text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
