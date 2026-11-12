import { CheckCircle2 } from 'lucide-react';
import { TicketQr } from '@/features/store/components/TicketQr';
import type { PublicSiteOrder } from '@/features/store/types/store';

/** Um cartão por participante, com o QR lido na entrada. */
export function TicketCards({ tickets }: { tickets: PublicSiteOrder['tickets'] }) {
  return (
    <ul aria-label="Ingressos" className="grid gap-4 sm:grid-cols-2">
      {tickets.map((ticket) => (
        <li
          key={ticket.code}
          className="flex flex-col items-center gap-3 rounded-2xl border border-sand-line bg-paper p-5 text-center"
        >
          <p className="font-semibold text-ink">{ticket.attendeeName}</p>
          <TicketQr code={ticket.code} />
          <p className="font-mono text-sm tracking-wider text-ink-soft">{ticket.code}</p>
          {ticket.checkedIn && (
            <p className="flex items-center gap-1.5 text-sm font-semibold text-moss">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Já entrou
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
