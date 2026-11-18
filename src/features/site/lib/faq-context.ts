import { DEFAULT_FAQ_CONTEXT, faqItems, type FaqContext, type FaqItem } from '@/data/faq';
import { SITE_SETTINGS_REVALIDATE_SECONDS, SITE_SETTINGS_TAG } from '@/lib/site-settings';

/**
 * O que o FAQ tira do admin, de `GET /store-settings/public`, com o mesmo
 * cache dos interruptores (o `fetch` repetido na mesma página é um só). Nunca
 * lança: sem API, as respostas ficam no padrão (pedido pelo WhatsApp).
 */
export async function getFaqContext(): Promise<FaqContext> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return DEFAULT_FAQ_CONTEXT;
  try {
    const response = await fetch(`${apiUrl}/store-settings/public`, {
      next: { revalidate: SITE_SETTINGS_REVALIDATE_SECONDS, tags: [SITE_SETTINGS_TAG] },
    });
    if (!response.ok) return DEFAULT_FAQ_CONTEXT;
    const body = (await response.json()) as Record<string, unknown>;
    const pickupOn =
      body.pickupEnabled === true && typeof body.pickupAddress === 'string' && typeof body.pickupHours === 'string';
    return {
      storeEnabled: body.storeEnabled === true,
      ticketsEnabled: body.ticketsEnabled === true,
      maxInstallments: typeof body.maxInstallments === 'number' ? body.maxInstallments : 1,
      minInstallmentValue: typeof body.minInstallmentValue === 'number' ? body.minInstallmentValue : 0,
      pickup: pickupOn ? { address: body.pickupAddress as string, hours: body.pickupHours as string } : null,
    };
  } catch {
    return DEFAULT_FAQ_CONTEXT;
  }
}

export async function getFaqItems(): Promise<FaqItem[]> {
  return faqItems(await getFaqContext());
}
