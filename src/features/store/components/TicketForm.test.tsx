import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketForm } from './TicketForm';
import { createTicketCheckout } from '@/features/store/lib/store-api';
import { redirectToPayment } from '@/features/store/lib/redirect-to-payment';
import type { SiteEvent } from '@/features/site/types/event';

jest.mock('@/features/store/lib/store-api');
jest.mock('@/features/store/lib/redirect-to-payment');
const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const event: SiteEvent = {
  id: 'e1',
  title: 'Oficina de terrário',
  slug: 'oficina-de-terrario',
  description: 'Monte o seu.',
  startsAt: '2099-11-21T13:00:00.000Z',
  endsAt: '2099-11-21T15:00:00.000Z',
  locationName: null,
  locationAddress: null,
  price: 45,
  spots: 20,
  imageUrl: null,
  ctaUrl: null,
  ticketSales: true,
  maxTicketsPerOrder: 4,
  spotsLeft: 10,
  soldOut: false,
};

const create = createTicketCheckout as jest.Mock;

async function fillBuyer() {
  await userEvent.type(screen.getByLabelText('Nome do participante 1'), 'Ana Lima');
  await userEvent.type(screen.getByLabelText('Seu nome'), 'Maria Souza');
  await userEvent.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com');
  await userEvent.type(screen.getByLabelText('WhatsApp'), '21999998888');
}

describe('TicketForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.gtag = jest.fn();
  });

  it('sends only the event, attendees, buyer and notes, and goes to the payment page', async () => {
    create.mockResolvedValue({ ok: true, code: 'DV-0043', token: 'tok', paymentUrl: 'https://pay.test/x' });
    render(<TicketForm event={event} />);

    await fillBuyer();
    await userEvent.click(screen.getByRole('button', { name: '+ Adicionar participante' }));
    await userEvent.type(screen.getByLabelText('Nome do participante 2'), 'Bruno Lima');
    expect(screen.getByText('2 × R$ 45,00 = R$ 90,00')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ir para o pagamento' }));

    await waitFor(() => expect(redirectToPayment).toHaveBeenCalledWith('https://pay.test/x'));
    expect(create).toHaveBeenCalledWith({
      eventId: 'e1',
      attendees: [{ name: 'Ana Lima' }, { name: 'Bruno Lima' }],
      customer: { name: 'Maria Souza', email: 'maria@exemplo.com', phone: '21999998888' },
    });
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'begin_checkout',
      expect.objectContaining({
        value: 90,
        items: [expect.objectContaining({ item_id: 'e1', item_name: 'Oficina de terrário', quantity: 2 })],
      }),
    );
  });

  it('confirms a free sign-up on the order page, without the payment page', async () => {
    create.mockResolvedValue({ ok: true, code: 'DV-0044', token: 'tok', paymentUrl: null });
    render(<TicketForm event={{ ...event, price: null }} />);

    expect(screen.getByText('Gratuito')).toBeInTheDocument();
    await fillBuyer();
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar inscrição' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/pedido/tok'));
    expect(redirectToPayment).not.toHaveBeenCalled();
  });

  it('blocks empty attendee names with a message on the field', async () => {
    render(<TicketForm event={event} />);

    await userEvent.click(screen.getByRole('button', { name: 'Ir para o pagamento' }));

    expect(screen.getByText('Informe o nome de quem vai participar.')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('stops adding attendees at the per-order limit or the spots left, whichever is lower', async () => {
    render(<TicketForm event={{ ...event, spotsLeft: 2 }} />);

    await userEvent.click(screen.getByRole('button', { name: '+ Adicionar participante' }));

    expect(screen.queryByRole('button', { name: '+ Adicionar participante' })).not.toBeInTheDocument();
    expect(screen.getByText('Máximo de 2 ingressos por compra.')).toBeInTheDocument();
  });

  it('removes an attendee', async () => {
    render(<TicketForm event={event} />);
    await userEvent.click(screen.getByRole('button', { name: '+ Adicionar participante' }));

    await userEvent.click(screen.getByRole('button', { name: 'Remover participante 2' }));

    expect(screen.queryByLabelText('Nome do participante 2')).not.toBeInTheDocument();
  });

  it('shows "Esgotado" and a WhatsApp link when sold out', () => {
    render(<TicketForm event={{ ...event, spotsLeft: 0, soldOut: true }} />);

    expect(screen.getByRole('button', { name: 'Esgotado' })).toBeDisabled();
    expect(screen.getByRole('link', { name: /Falar no WhatsApp/ })).toBeInTheDocument();
    expect(screen.queryByLabelText('Nome do participante 1')).not.toBeInTheDocument();
  });

  it('lowers the limit and says how many spots are left on a sold_out answer', async () => {
    create.mockResolvedValue({ ok: false, status: 409, message: 'x', reason: 'sold_out', spotsLeft: 1 });
    render(<TicketForm event={event} />);
    await fillBuyer();
    await userEvent.click(screen.getByRole('button', { name: '+ Adicionar participante' }));
    await userEvent.type(screen.getByLabelText('Nome do participante 2'), 'Bruno');

    await userEvent.click(screen.getByRole('button', { name: 'Ir para o pagamento' }));

    expect(await screen.findByText('Restam 1 vagas.')).toBeInTheDocument();
    expect(screen.getByText('Máximo de 1 ingressos por compra.')).toBeInTheDocument();
  });

  it('explains a too_many answer with the event limit', async () => {
    create.mockResolvedValue({ ok: false, status: 409, message: 'x', reason: 'too_many', max: 3 });
    render(<TicketForm event={event} />);
    await fillBuyer();

    await userEvent.click(screen.getByRole('button', { name: 'Ir para o pagamento' }));

    expect(await screen.findByText('O máximo por compra é 3 ingressos.')).toBeInTheDocument();
  });

  it('closes the form when sales were turned off in the meantime', async () => {
    create.mockResolvedValue({ ok: false, status: 409, message: 'x', reason: 'tickets_closed' });
    render(<TicketForm event={event} />);
    await fillBuyer();

    await userEvent.click(screen.getByRole('button', { name: 'Ir para o pagamento' }));

    expect(await screen.findByText(/A venda de ingressos pelo site está fechada no momento/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Falar no WhatsApp/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ir para o pagamento' })).not.toBeInTheDocument();
  });

  it('says the sales ended on a not_available answer', async () => {
    create.mockResolvedValue({ ok: false, status: 409, message: 'x', reason: 'not_available' });
    render(<TicketForm event={event} />);
    await fillBuyer();

    await userEvent.click(screen.getByRole('button', { name: 'Ir para o pagamento' }));

    expect(await screen.findByText('As vendas desse evento foram encerradas.')).toBeInTheDocument();
  });

  it('shows the message and gives the button back when the payment cannot start', async () => {
    create.mockResolvedValue({ ok: false, status: 503, message: 'Não foi possível iniciar o pagamento.' });
    render(<TicketForm event={event} />);
    await fillBuyer();

    await userEvent.click(screen.getByRole('button', { name: 'Ir para o pagamento' }));

    expect(await screen.findByText('Não foi possível iniciar o pagamento.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ir para o pagamento' })).toBeEnabled();
  });

  it('keeps the button loading while it sends', async () => {
    create.mockReturnValue(new Promise(() => {}));
    render(<TicketForm event={event} />);
    await fillBuyer();

    await userEvent.click(screen.getByRole('button', { name: 'Ir para o pagamento' }));

    expect(await screen.findByRole('button', { name: 'Abrindo o pagamento...' })).toBeDisabled();
  });
});
