# Push Notifications (Admin) Implementation Plan

> **Status: implementado e em produção.** Os checkboxes abaixo nunca foram
> marcados durante a implementação, mas a inscrição/desinscrição de push,
> o service worker e a contraparte em `daverdinha-api` estão no ar. Mantido
> como registro da decisão de design original.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the attendant opt into browser/phone notifications from the admin PWA, so a phone buzzes when a conversation needs them, without having to keep the tab open.

**Architecture:** Extends the minimal service worker shipped with PWA installability (`public/sw.js`, currently a no-op fetch handler with nothing else) with `push` and `notificationclick` listeners. A new `usePushSubscription` hook handles the browser-side subscribe flow (permission request → `PushManager.subscribe` → POST the subscription to the backend). A small dismissible banner in the admin layout is the only UI — notifications are opt-in via a button, never auto-requested on page load (browsers can permanently silence a origin that gets denied once, and an unprompted permission popup on every login is bad UX regardless).

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind, shadcn/ui, Jest + React Testing Library.

**Spec:** No separate spec doc. Hard dependency: `daverdinha-api/docs/plans/2026-09-14-push-notifications.md` must be fully implemented and deployed first — this plan's Task 2 calls `POST /push-subscriptions`, which doesn't exist until that plan's Task 2 ships.

## Global Constraints

- **Do not auto-request notification permission on page load.** The banner (Task 3) is the only trigger, and only shows while `Notification.permission === 'default'` (never asked yet) — it disappears for good once the attendant grants or denies, matching normal browser behavior.
- **No commit trailers:** no `Co-Authored-By:` / `Claude-Session:` line in commit messages.
- **Stage files by name:** `git add <file> <file>`, never `git add -A` or `git add .`.
- The service worker (`public/sw.js`) already exists from the PWA-installability work — it currently only has `install`/`activate`/empty `fetch` handlers. This plan adds to that same file, it does not replace it.
- `useApiClient()` (`src/features/admin/lib/api-client.ts`) is the existing authenticated fetch wrapper — it attaches the Clerk bearer token and prefixes `process.env.NEXT_PUBLIC_API_URL`. Use it for the subscription POST, don't hand-roll a new fetch call.
- Test mocking convention already used throughout `src/app/admin/**/*.test.tsx`: `jest.mock('@/features/admin/lib/api-client')` + `(useApiClient as jest.Mock).mockReturnValue({ apiFetch })`.
- The admin route for a single conversation is `/admin/conversas/[id]` — the backend's notification payload includes `url: '/admin/conversas/<id>'` already built for this exact path (see the API plan's Task 3).

---

## Task 1: Service worker — show and route notifications

**Files:**
- Modify: `public/sw.js`
- No automated test — service workers run outside jsdom/Jest's reach; this task is verified manually (Step 3).

**Interfaces:**
- Consumes: the JSON payload the backend sends via `web-push`, shape `{ title: string; body: string; url: string }` (see API plan Task 3, `PushNotificationsService.notifyNewMessage`).

- [ ] **Step 1: Add the `push` and `notificationclick` listeners**

Add to the end of `public/sw.js` (the existing `install`/`activate`/`fetch` listeners stay untouched):

```javascript
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const { title, body, url } = event.data.json();
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/admin';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url.endsWith(url));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    }),
  );
});
```

- [ ] **Step 2: Verify the file is valid JS**

```bash
node --check public/sw.js
```

Expected: no output (exit code 0).

- [ ] **Step 3: Manual verification (do this once Task 2 is also done and there's a real subscription to test against)**

In Chrome DevTools → Application → Service Workers, confirm the worker is registered and active. Use DevTools → Application → Service Workers → "Push" test button (send a raw string) to confirm `showNotification` fires, or trigger a real notification once the backend plan is deployed and a real WhatsApp message lands in a `paused_human` conversation.

- [ ] **Step 4: Commit**

```bash
git add public/sw.js
git commit -m "feat: handle push and notification-click events in the service worker"
```

---

## Task 2: `usePushSubscription` hook — permission, subscribe, register with the backend

**Files:**
- Create: `src/features/admin/lib/url-base64-to-uint8-array.ts`
- Create: `src/features/admin/lib/url-base64-to-uint8-array.test.ts`
- Create: `src/features/admin/lib/use-push-subscription.ts`
- Create: `src/features/admin/lib/use-push-subscription.test.ts`
- Modify: `.env.local.example`, `.env.local`

**Interfaces:**
- Consumes: `useApiClient()` → `apiFetch<T>(path, options)` (`src/features/admin/lib/api-client.ts`).
- Produces: `usePushSubscription(): { subscribe: () => Promise<void>; subscribing: boolean; error: string | null }` — Task 3's banner component calls `subscribe()`.

- [ ] **Step 1: Add the VAPID public key env var**

Append to `.env.local.example`:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
```

Append to `.env.local` the real public key generated in the API plan's Task 3, Step 2 (the *public* key only — the private key never goes in a frontend env file):

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<the public key printed by `npx web-push generate-vapid-keys` in the api repo>
```

- [ ] **Step 2: Write the failing test for the base64 conversion helper**

The browser's `PushManager.subscribe` needs the VAPID public key as a `Uint8Array`, not the base64url string the `web-push` CLI prints — this is a standard, well-known conversion (unrelated to this project's business logic, just Web Push API plumbing).

`src/features/admin/lib/url-base64-to-uint8-array.test.ts`:

```typescript
import { urlBase64ToUint8Array } from './url-base64-to-uint8-array';

describe('urlBase64ToUint8Array', () => {
  it('decodes a base64url string into the matching byte array', () => {
    // "AB~-_" as base64url maps to the raw bytes below — this fixture
    // exercises both the "-"/"+" and "_"/"/" substitutions.
    const result = urlBase64ToUint8Array('AA-_');
    expect(Array.from(result)).toEqual([0, 15, 191]);
  });

  it('returns an empty array for an empty string', () => {
    expect(Array.from(urlBase64ToUint8Array(''))).toEqual([]);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

```bash
npx jest src/features/admin/lib/url-base64-to-uint8-array.test.ts
```

Expected: FAIL — `Cannot find module './url-base64-to-uint8-array'`.

- [ ] **Step 4: Implement the helper**

`src/features/admin/lib/url-base64-to-uint8-array.ts`:

```typescript
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
```

- [ ] **Step 5: Run it to verify it passes**

```bash
npx jest src/features/admin/lib/url-base64-to-uint8-array.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 6: Write the failing test for the hook**

`src/features/admin/lib/use-push-subscription.test.ts`:

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePushSubscription } from './use-push-subscription';
import { useApiClient } from './api-client';

jest.mock('./api-client');

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
```

- [ ] **Step 7: Run it to verify it fails**

```bash
npx jest src/features/admin/lib/use-push-subscription.test.ts
```

Expected: FAIL — `Cannot find module './use-push-subscription'`.

- [ ] **Step 8: Implement the hook**

`src/features/admin/lib/use-push-subscription.ts`:

```typescript
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
```

- [ ] **Step 9: Run it to verify it passes**

```bash
npx jest src/features/admin/lib/use-push-subscription.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 10: Commit**

```bash
git add src/features/admin/lib/url-base64-to-uint8-array.ts src/features/admin/lib/url-base64-to-uint8-array.test.ts src/features/admin/lib/use-push-subscription.ts src/features/admin/lib/use-push-subscription.test.ts .env.local.example
git commit -m "feat: add usePushSubscription hook for the web push opt-in flow"
```

(`.env.local` is not committed — it's gitignored like every other Next.js env file in this repo. Confirm it is: `git check-ignore .env.local` should print the path.)

---

## Task 3: Opt-in banner in the admin layout

**Files:**
- Create: `src/components/push-notification-banner.tsx`
- Create: `src/components/push-notification-banner.test.tsx`
- Modify: `src/app/admin/layout.tsx`

**Interfaces:**
- Consumes: `usePushSubscription()` (Task 2).
- Produces: `<PushNotificationBanner />` — a self-contained component with no props, mounted once in the admin layout.

- [ ] **Step 1: Write the failing test**

`src/components/push-notification-banner.test.tsx`:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PushNotificationBanner } from './push-notification-banner';
import { usePushSubscription } from '@/features/admin/lib/use-push-subscription';

jest.mock('@/features/admin/lib/use-push-subscription');

describe('PushNotificationBanner', () => {
  const originalNotification = window.Notification;

  afterEach(() => {
    Object.defineProperty(window, 'Notification', { value: originalNotification, configurable: true });
  });

  it('shows the opt-in button when permission has not been asked yet', () => {
    Object.defineProperty(window, 'Notification', { value: { permission: 'default' }, configurable: true });
    (usePushSubscription as jest.Mock).mockReturnValue({ subscribe: jest.fn(), subscribing: false, error: null });

    render(<PushNotificationBanner />);

    expect(screen.getByRole('button', { name: 'Ativar notificações' })).toBeInTheDocument();
  });

  it('renders nothing when permission was already granted', () => {
    Object.defineProperty(window, 'Notification', { value: { permission: 'granted' }, configurable: true });
    (usePushSubscription as jest.Mock).mockReturnValue({ subscribe: jest.fn(), subscribing: false, error: null });

    const { container } = render(<PushNotificationBanner />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when permission was already denied', () => {
    Object.defineProperty(window, 'Notification', { value: { permission: 'denied' }, configurable: true });
    (usePushSubscription as jest.Mock).mockReturnValue({ subscribe: jest.fn(), subscribing: false, error: null });

    const { container } = render(<PushNotificationBanner />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the browser has no Notification API at all', () => {
    delete (window as { Notification?: unknown }).Notification;
    (usePushSubscription as jest.Mock).mockReturnValue({ subscribe: jest.fn(), subscribing: false, error: null });

    const { container } = render(<PushNotificationBanner />);

    expect(container).toBeEmptyDOMElement();
  });

  it('calls subscribe() when the button is clicked, and shows the error on failure', async () => {
    Object.defineProperty(window, 'Notification', { value: { permission: 'default' }, configurable: true });
    const subscribe = jest.fn().mockResolvedValue(undefined);
    (usePushSubscription as jest.Mock).mockReturnValue({
      subscribe,
      subscribing: false,
      error: 'Permissão de notificação negada.',
    });

    render(<PushNotificationBanner />);
    await userEvent.click(screen.getByRole('button', { name: 'Ativar notificações' }));

    expect(subscribe).toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Permissão de notificação negada.');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx jest src/components/push-notification-banner.test.tsx
```

Expected: FAIL — `Cannot find module './push-notification-banner'`.

- [ ] **Step 3: Implement the component**

`src/components/push-notification-banner.tsx`:

```typescript
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
```

- [ ] **Step 4: Run it to verify it passes**

```bash
npx jest src/components/push-notification-banner.test.tsx
```

Expected: PASS (5 tests).

- [ ] **Step 5: Mount it in the admin layout**

Modify `src/app/admin/layout.tsx` — add the import:

```typescript
import { PushNotificationBanner } from '@/components/push-notification-banner';
```

And render it as the first child inside the root `<div className="flex h-screen flex-col ...">`, above the existing mobile header bar:

```tsx
return (
  <div className="flex h-screen flex-col bg-paper text-ink md:flex-row">
    <PushNotificationBanner />
    <div className="flex flex-none items-center justify-between border-b border-moss-line bg-sand p-4 md:hidden">
```

Wrapping note: the existing layout is a `flex-row` on desktop / `flex-col` on mobile split between nav and `<main>`. Placing the banner as the very first flex child, before the row/column split begins, makes it a full-width strip above everything on every breakpoint — it does not need its own responsive handling.

- [ ] **Step 6: Full test run**

```bash
npx jest
npx tsc --noEmit
```

Expected: every suite passes (including the existing `src/app/admin/layout.test.tsx` — check it after this change; if it snapshots the full layout tree or asserts an exact child count, it will need the banner mock added the same way Task 3's own test does).

- [ ] **Step 7: Commit**

```bash
git add src/components/push-notification-banner.tsx src/components/push-notification-banner.test.tsx src/app/admin/layout.tsx
git commit -m "feat: add opt-in banner for push notifications to the admin layout"
```

---

## After this plan ships

Manually verify end to end on a real phone: install the PWA (per the earlier PWA-installability work), open the admin, click "Ativar notificações", grant permission, then have someone message the WhatsApp number so it lands in a `paused_human` conversation (e.g. place a test catalog order through the full CEP flow) — a notification should arrive even with the PWA closed, and tapping it should open the right conversation.
