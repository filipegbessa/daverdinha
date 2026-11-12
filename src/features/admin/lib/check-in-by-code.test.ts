import { checkInByCode, normalizeTicketCode } from './check-in-by-code';
import { ApiError } from './api-error';

const attendee = {
  id: 't1',
  attendeeName: 'Maria Souza',
  checkedInAt: '2026-11-21T22:42:00.000Z',
  order: { id: 'o1', code: 'DV-0043', customerName: 'Maria Souza', customerPhone: '5521999998888' },
};

describe('checkInByCode', () => {
  it('cleans up what was read or typed', () => {
    expect(normalizeTicketCode(' k7q2-m9xp ')).toBe('K7Q2M9XP');
  });

  it('checks in and greets the attendee', async () => {
    const apiFetch = jest.fn().mockResolvedValue(attendee);

    await expect(checkInByCode(apiFetch, 'e1', 'k7q2-m9xp')).resolves.toEqual({
      tone: 'ok',
      message: 'Maria Souza entrou',
      attendee,
    });
    expect(apiFetch).toHaveBeenCalledWith('/site-order-tickets/check-in-by-code', {
      method: 'POST',
      body: JSON.stringify({ eventId: 'e1', code: 'K7Q2M9XP' }),
    });
  });

  it.each([
    [
      new ApiError('x', 409, { reason: 'already_checked_in', checkedInAt: '2026-11-21T22:42:00.000Z' }),
      'warning',
      'Já entrou às 19:42',
    ],
    [new ApiError('x', 409, { reason: 'other_event' }), 'error', 'Ingresso de outro evento'],
    [new ApiError('x', 409, { reason: 'not_paid' }), 'error', 'Ingresso não pago'],
    [new ApiError('x', 404, {}), 'error', 'Código não encontrado'],
    [new Error('Sem conexão.'), 'error', 'Sem conexão.'],
  ])('turns %s into a %s message', async (error, tone, message) => {
    const apiFetch = jest.fn().mockRejectedValue(error);

    await expect(checkInByCode(apiFetch, 'e1', 'K7Q2M9XP')).resolves.toEqual({ tone, message });
  });

  it('does not call the API without a code', async () => {
    const apiFetch = jest.fn();

    await expect(checkInByCode(apiFetch, 'e1', '  ')).resolves.toEqual({
      tone: 'error',
      message: 'Digite o código do ingresso.',
    });
    expect(apiFetch).not.toHaveBeenCalled();
  });
});
