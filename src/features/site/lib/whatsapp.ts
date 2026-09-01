import { businessInfo } from '@/data/business';

export function getWhatsAppUrl(message?: string): string {
  const base = `https://wa.me/${businessInfo.contact.phone.number}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message).replace(/!/g, '%21')}`;
}
