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
    setPermission(Notification.permission);
  }, []);

  async function handleClick() {
    await subscribe();
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission);
    }
  }

  if (permission !== 'default') return null;

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
