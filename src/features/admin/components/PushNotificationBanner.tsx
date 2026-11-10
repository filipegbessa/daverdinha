'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePushSubscription } from '@/features/admin/lib/use-push-subscription';

const DISMISSED_STORAGE_KEY = 'daverdinha:push-banner-dismissed';

function readDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(DISMISSED_STORAGE_KEY) === 'true';
  } catch {
    // Storage may be unavailable (private browsing, disabled cookies) — the
    // banner just won't remember the dismissal across reloads in that case.
    return false;
  }
}

export function PushNotificationBanner() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [dismissed, setDismissed] = useState(readDismissed);
  const { subscribe, subscribing, error } = usePushSubscription();

  function handleDismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISSED_STORAGE_KEY, 'true');
    } catch {
      // Best-effort: the banner still hides for the rest of this session
      // even if it can't be persisted.
    }
  }

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

  if (dismissed) return null;
  if (permission !== 'default' && !error) return null;

  return (
    <div className="flex flex-none flex-wrap items-center justify-between gap-3 border-b border-moss-line bg-sand px-4 py-2 text-sm">
      <p className="text-ink-soft">Ative as notificações pra saber na hora quando chegar uma mensagem nova.</p>
      <div className="flex items-center gap-2">
        <Button type="button" onClick={handleClick} disabled={subscribing} size="sm">
          {subscribing ? 'Ativando...' : 'Ativar notificações'}
        </Button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Fechar aviso de notificações"
          className="rounded-lg p-1 text-ink-soft hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
        >
          ✕
        </button>
      </div>
      {error && (
        <p role="alert" className="w-full text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
