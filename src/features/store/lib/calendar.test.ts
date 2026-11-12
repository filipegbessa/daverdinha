import { calendarLocation, googleCalendarUrl, icsFile } from './calendar';

const event = {
  title: 'Oficina de terrário, com chá',
  startsAt: '2026-11-21T13:00:00.000Z',
  endsAt: '2026-11-21T15:00:00.000Z',
  locationName: null,
  locationAddress: null,
};

describe('calendar', () => {
  it('uses the atelier address for events at the atelier, and the place otherwise', () => {
    expect(calendarLocation(event)).toContain('R. Capiberibe, 32');
    expect(calendarLocation({ ...event, locationName: 'Praça da Harmonia', locationAddress: 'Gamboa, RJ' })).toBe(
      'Praça da Harmonia, Gamboa, RJ',
    );
  });

  it('builds a Google Calendar link with the dates in UTC', () => {
    const url = new URL(googleCalendarUrl(event, 'Pedido DV-0043'));

    expect(url.hostname).toBe('calendar.google.com');
    expect(url.searchParams.get('dates')).toBe('20261121T130000Z/20261121T150000Z');
    expect(url.searchParams.get('text')).toBe('Oficina de terrário, com chá');
    expect(url.searchParams.get('details')).toBe('Pedido DV-0043');
  });

  it('gives an event without an end two hours in the calendar', () => {
    const url = new URL(googleCalendarUrl({ ...event, endsAt: null }, ''));

    expect(url.searchParams.get('dates')).toBe('20261121T130000Z/20261121T150000Z');
  });

  it('writes a valid .ics with escaped text', () => {
    const ics = icsFile(event, 'DV-0043', 'Pedido DV-0043', new Date('2026-11-12T10:00:00Z'));

    expect(ics.split('\r\n')).toEqual(
      expect.arrayContaining([
        'BEGIN:VCALENDAR',
        'UID:DV-0043@daverdinha.com.br',
        'DTSTART:20261121T130000Z',
        'DTEND:20261121T150000Z',
        'SUMMARY:Oficina de terrário\\, com chá',
        'END:VCALENDAR',
      ]),
    );
  });
});
