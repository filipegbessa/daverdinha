import { businessInfo } from '@/data/business';
import { eventPlace } from '@/features/site/components/EventCard';

/** O que o calendário precisa do evento (o mesmo formato da página do pedido). */
export type CalendarEvent = {
  title: string;
  startsAt: string;
  endsAt: string | null;
  locationName: string | null;
  locationAddress: string | null;
};

/** Sem horário de fim, a agenda do comprador recebe 2 horas (só pro calendário). */
const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

/** `20261121T130000Z`: o formato de data em UTC de `.ics` e do Google Agenda. */
function stamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

function range(event: CalendarEvent): { start: Date; end: Date } {
  const start = new Date(event.startsAt);
  const end = event.endsAt ? new Date(event.endsAt) : new Date(start.getTime() + DEFAULT_DURATION_MS);
  return { start, end };
}

/** Onde é: nome do lugar e endereço; no ateliê, o endereço da loja. */
export function calendarLocation(event: CalendarEvent): string {
  if (event.locationName === null) return `Ateliê Daverdinha, ${businessInfo.address.formatted}`;
  return [eventPlace(event), event.locationAddress].filter(Boolean).join(', ');
}

/** Link "Adicionar ao Google Agenda", já preenchido. */
export function googleCalendarUrl(event: CalendarEvent, details: string): string {
  const { start, end } = range(event);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${stamp(start)}/${stamp(end)}`,
    location: calendarLocation(event),
    details,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Texto de `.ics`: vírgula, ponto e vírgula, barra e quebra de linha escapados. */
function escapeIcs(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Um arquivo `.ics` com o evento, pra Agenda do iPhone, Outlook e afins. */
export function icsFile(event: CalendarEvent, uid: string, details: string, now: Date = new Date()): string {
  const { start, end } = range(event);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Daverdinha//Ingressos//PT-BR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}@daverdinha.com.br`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `LOCATION:${escapeIcs(calendarLocation(event))}`,
    `DESCRIPTION:${escapeIcs(details)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
