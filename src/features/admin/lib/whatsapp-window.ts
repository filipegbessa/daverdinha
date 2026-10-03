/**
 * WhatsApp only allows free-form ("session") replies within 24h of the
 * customer's last inbound message. Outside that window, only a
 * pre-approved template message can re-open the conversation. Mirrors
 * the backend's own daverdinha-api/src/common/whatsapp-window.ts — the
 * frontend check is a UX convenience (hide the form before the operator
 * wastes a submit); the backend guard is the one that actually enforces it.
 */
export const WHATSAPP_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * `null` means no inbound message has ever arrived — also outside the
 * window, since there was never a session to begin with.
 */
export function isWindowExpired(lastInboundAt: string | null): boolean {
  if (!lastInboundAt) return true;
  return Date.now() - new Date(lastInboundAt).getTime() > WHATSAPP_WINDOW_MS;
}
