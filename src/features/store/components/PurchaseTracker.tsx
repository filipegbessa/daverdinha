'use client';
import { useEffect } from 'react';
import type { PublicSiteOrder } from '@/features/store/types/store';

const TRACKED_KEY = 'daverdinha:purchase-tracked';

function alreadyTracked(code: string): boolean {
  try {
    return (JSON.parse(localStorage.getItem(TRACKED_KEY) ?? '[]') as string[]).includes(code);
  } catch {
    return false;
  }
}

function markTracked(code: string) {
  try {
    const codes = JSON.parse(localStorage.getItem(TRACKED_KEY) ?? '[]') as string[];
    localStorage.setItem(TRACKED_KEY, JSON.stringify([...codes, code].slice(-50)));
  } catch {
    // Sem armazenamento, um F5 pode contar a compra de novo; é o melhor possível.
  }
}

/**
 * Conta a compra no GA (`purchase`) uma vez por pedido, quando ele está pago;
 * inscrição gratuita em evento conta como `generate_lead`.
 * Guarda os códigos já contados no navegador, pra um F5 ou uma volta à página
 * não contarem de novo.
 */
export function PurchaseTracker({ order }: { order: PublicSiteOrder }) {
  useEffect(() => {
    if (order.status !== 'paid' || alreadyTracked(order.code)) return;
    if (order.total <= 0) {
      // Inscrição gratuita não é compra: no GA4 é um `generate_lead`.
      if (order.kind === 'tickets') {
        window.gtag?.('event', 'generate_lead', { currency: 'BRL', value: 0 });
        markTracked(order.code);
      }
      return;
    }
    window.gtag?.('event', 'purchase', {
      transaction_id: order.code,
      value: order.total,
      shipping: order.deliveryFee,
      currency: 'BRL',
      items:
        order.kind === 'tickets' && order.event
          ? [
              {
                item_name: order.event.title,
                price: order.tickets[0]?.unitPrice ?? 0,
                quantity: order.tickets.length,
              },
            ]
          : order.items.map((item) => ({
              item_name: item.name,
              price: item.unitPrice,
              quantity: item.quantity,
            })),
    });
    markTracked(order.code);
  }, [order]);

  return null;
}
