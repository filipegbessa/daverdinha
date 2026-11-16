import { SITE_SETTINGS_REVALIDATE_SECONDS, SITE_SETTINGS_TAG } from '@/lib/site-settings';

export interface PickupInfo {
  address: string;
  hours: string;
  instructions: string | null;
}

/**
 * A retirada no ateliê como a cliente cadastrou no admin (Loja), lida de
 * `GET /store-settings/public` com o mesmo cache dos interruptores. `null`
 * com a retirada desligada ou a API fora do ar: a página não promete uma
 * retirada que o checkout não oferece.
 */
export async function getPickupInfo(): Promise<PickupInfo | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  try {
    const response = await fetch(`${apiUrl}/store-settings/public`, {
      next: { revalidate: SITE_SETTINGS_REVALIDATE_SECONDS, tags: [SITE_SETTINGS_TAG] },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as {
      pickupEnabled?: unknown;
      pickupAddress?: unknown;
      pickupHours?: unknown;
      pickupInstructions?: unknown;
    };
    if (body.pickupEnabled !== true || typeof body.pickupAddress !== 'string' || typeof body.pickupHours !== 'string') {
      return null;
    }
    return {
      address: body.pickupAddress,
      hours: body.pickupHours,
      instructions:
        typeof body.pickupInstructions === 'string' && body.pickupInstructions ? body.pickupInstructions : null,
    };
  } catch {
    return null;
  }
}
