'use client';
import { CalendarPlus } from 'lucide-react';
import { googleCalendarUrl, icsFile, type CalendarEvent } from '@/features/store/lib/calendar';

/**
 * "Adicionar à agenda": link do Google Agenda e um arquivo `.ics` (Agenda do
 * iPhone, Outlook), montado no navegador.
 */
export function AddToCalendar({ event, orderCode }: { event: CalendarEvent; orderCode: string }) {
  const details = `Pedido ${orderCode} · Daverdinha. Mostre o QR do ingresso na entrada.`;

  function downloadIcs() {
    const blob = new Blob([icsFile(event, orderCode, details)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${orderCode}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const linkClass =
    'inline-flex cursor-pointer items-center gap-2 font-semibold text-moss underline underline-offset-4';
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
      <a href={googleCalendarUrl(event, details)} target="_blank" rel="noopener" className={linkClass}>
        <CalendarPlus className="size-4" aria-hidden="true" />
        Google Agenda
      </a>
      <button type="button" onClick={downloadIcs} className={linkClass}>
        <CalendarPlus className="size-4" aria-hidden="true" />
        Outra agenda (.ics)
      </button>
    </div>
  );
}
