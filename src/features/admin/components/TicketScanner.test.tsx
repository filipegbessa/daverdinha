import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketScanner } from './TicketScanner';
import { mockApi } from '@/features/admin/test-fixtures/mock-api';
import { ApiError } from '@/features/admin/lib/api-error';
import { useQrScanner } from '@/features/admin/lib/use-qr-scanner';

jest.mock('@/features/admin/lib/api-client');
// Câmera não roda no jsdom: o hook vira um falso que guarda o `onCode` pra o
// teste "ler" um QR.
jest.mock('@/features/admin/lib/use-qr-scanner');
const scanner = useQrScanner as jest.Mock;
let readQr: (code: string) => void = () => {};

const attendee = {
  id: 't1',
  attendeeName: 'Maria Souza',
  checkedInAt: '2026-11-21T22:42:00.000Z',
  order: { id: 'o1', code: 'DV-0043', customerName: 'Maria Souza', customerPhone: '5521999998888' },
};

function renderScanner(onCheckedIn = jest.fn()) {
  render(<TicketScanner eventId="e1" onCheckedIn={onCheckedIn} onClose={jest.fn()} />);
  return onCheckedIn;
}

describe('TicketScanner', () => {
  beforeEach(() => {
    scanner.mockImplementation((_ref, onCode: (code: string) => void, active: boolean) => {
      readQr = onCode;
      return active ? 'scanning' : 'off';
    });
  });

  it('checks in a scanned QR, says who entered and tells the list to refresh', async () => {
    const apiFetch = mockApi(() => attendee);
    const onCheckedIn = renderScanner();

    expect(screen.getByText('Aponte a câmera pro QR do ingresso.')).toBeInTheDocument();
    await act(async () => readQr('k7q2-m9xp'));

    expect(await screen.findByText('Maria Souza entrou')).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledWith('/site-order-tickets/check-in-by-code', {
      method: 'POST',
      body: JSON.stringify({ eventId: 'e1', code: 'K7Q2M9XP' }),
    });
    expect(onCheckedIn).toHaveBeenCalledWith(attendee);
  });

  it('reads the same QR only once while it stays in front of the camera', async () => {
    const apiFetch = mockApi(() => attendee);
    renderScanner();

    await act(async () => readQr('K7Q2M9XP'));
    await act(async () => readQr('K7Q2M9XP'));

    expect(apiFetch).toHaveBeenCalledTimes(1);
  });

  it('shows when the ticket was already used', async () => {
    mockApi(() =>
      Promise.reject(new ApiError('x', 409, { reason: 'already_checked_in', checkedInAt: '2026-11-21T22:42:00.000Z' })),
    );
    const onCheckedIn = renderScanner();

    await act(async () => readQr('K7Q2M9XP'));

    expect(await screen.findByRole('alert')).toHaveTextContent('Já entrou às 19:42');
    expect(onCheckedIn).not.toHaveBeenCalled();
  });

  it('checks in a typed code, for when the camera fails', async () => {
    scanner.mockReturnValue('unavailable');
    mockApi(() => Promise.reject(new ApiError('x', 409, { reason: 'other_event' })));
    renderScanner();

    expect(screen.getByText(/Não deu pra usar a câmera/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Código do ingresso'), 'k7q2m9xp');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar entrada' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Ingresso de outro evento');
    expect(screen.getByLabelText('Código do ingresso')).toHaveValue('');
  });

  it('turns the camera off and on', async () => {
    mockApi();
    renderScanner();

    await userEvent.click(screen.getByRole('button', { name: 'Desligar câmera' }));

    expect(screen.queryByLabelText('Câmera')).not.toBeInTheDocument();
    expect(scanner).toHaveBeenLastCalledWith(expect.anything(), expect.any(Function), false);
  });
});
