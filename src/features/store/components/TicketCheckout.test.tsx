import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketCheckout } from './TicketCheckout';
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
const pay = () => userEvent.click(screen.getByRole('button', { name: 'Ir para o pagamento' }));

async function fillBuyer() {
  await userEvent.type(screen.getByLabelText('Seu nome'), 'Maria Souza');
  await userEvent.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com');
  await userEvent.type(screen.getByLabelText('WhatsApp'), '21999998888');
}

describe('TicketCheckout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.gtag = jest.fn();
  });

  it('opens with one name field per ticket chosen on the event page, the buyer as the first one', async () => {
    render(<TicketCheckout event={event} initialQuantity={2} />);

    expect(screen.getByLabelText('Participante 1')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Participante 2')).not.toHaveAttribute('readonly');
    expect(screen.queryByLabelText('Participante 3')).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Seu nome'), 'Maria Souza');
    expect(screen.getByLabelText('Participante 1')).toHaveValue('Maria Souza');
    const summary = screen.getByRole('complementary', { name: 'Resumo' });
    expect(within(summary).getByText('2 × R$ 45,00')).toBeInTheDocument();
  });

  it('sends the buyer as an attendee, goes to the payment page and tracks begin_checkout', async () => {
    create.mockResolvedValue({ ok: true, code: 'DV-0043', token: 'tok', paymentUrl: 'https://pay.test/x' });
    render(<TicketCheckout event={event} initialQuantity={2} />);

    await fillBuyer();
    await userEvent.type(screen.getByLabelText('Participante 2'), 'Bruno Lima');
    await pay();

    await waitFor(() => expect(redirectToPayment).toHaveBeenCalledWith('https://pay.test/x'));
    expect(create).toHaveBeenCalledWith({
      eventId: 'e1',
      attendees: [{ name: 'Maria Souza' }, { name: 'Bruno Lima' }],
      customer: { name: 'Maria Souza', email: 'maria@exemplo.com', phone: '21999998888' },
    });
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'begin_checkout',
      expect.objectContaining({ value: 90, items: [expect.objectContaining({ item_id: 'e1', quantity: 2 })] }),
    );
  });

  it('lets the buyer buy for someone else', async () => {
    create.mockResolvedValue({ ok: true, code: 'DV-0043', token: 'tok', paymentUrl: 'https://pay.test/x' });
    render(<TicketCheckout event={event} initialQuantity={1} />);

    await fillBuyer();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Eu vou participar' }));
    await userEvent.type(screen.getByLabelText('Participante 1'), 'Ana Lima');
    await pay();

    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create.mock.calls[0][0].attendees).toEqual([{ name: 'Ana Lima' }]);
  });

  it('changes the quantity up to the per-order limit or the spots left, whichever is lower', async () => {
    render(<TicketCheckout event={{ ...event, spotsLeft: 2 }} initialQuantity={1} />);

    await userEvent.click(screen.getByRole('button', { name: 'Aumentar' }));

    expect(screen.getByLabelText('Participante 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aumentar' })).toBeDisabled();
    expect(screen.getByText('Até 2 por compra.')).toBeInTheDocument();
  });

  it('never trusts the quantity of the URL beyond the limit', () => {
    render(<TicketCheckout event={event} initialQuantity={50} />);

    expect(screen.getByLabelText('Participante 4')).toBeInTheDocument();
    expect(screen.queryByLabelText('Participante 5')).not.toBeInTheDocument();
  });

  it('confirms a free sign-up on the order page, without the payment page', async () => {
    create.mockResolvedValue({ ok: true, code: 'DV-0044', token: 'tok', paymentUrl: null });
    render(<TicketCheckout event={{ ...event, price: null }} initialQuantity={1} />);

    expect(screen.getAllByText('Gratuito').length).toBeGreaterThan(0);
    await fillBuyer();
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar inscrição' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/pedido/tok'));
    expect(redirectToPayment).not.toHaveBeenCalled();
  });

  it('blocks empty names with a message on the field', async () => {
    render(<TicketCheckout event={event} initialQuantity={2} />);

    await fillBuyer();
    await pay();

    expect(screen.getByText('Informe o nome de quem vai participar.')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('closes with a way back when the event is sold out', () => {
    render(<TicketCheckout event={{ ...event, spotsLeft: 0, soldOut: true }} initialQuantity={1} />);

    expect(screen.getByText('As vagas desse evento acabaram.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao evento' })).toHaveAttribute(
      'href',
      '/agenda/oficina-de-terrario',
    );
    expect(screen.getByRole('link', { name: /Falar no WhatsApp/ })).toBeInTheDocument();
  });

  it('lowers the quantity to the spots left on a sold_out answer', async () => {
    create.mockResolvedValue({ ok: false, status: 409, message: 'x', reason: 'sold_out', spotsLeft: 1 });
    render(<TicketCheckout event={event} initialQuantity={2} />);
    await fillBuyer();
    await userEvent.type(screen.getByLabelText('Participante 2'), 'Bruno');

    await pay();

    expect(await screen.findByText('Só resta 1 vaga. Ajustamos a quantidade.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Participante 2')).not.toBeInTheDocument();
  });

  it('closes when the last spot went in the meantime', async () => {
    create.mockResolvedValue({ ok: false, status: 409, message: 'x', reason: 'sold_out', spotsLeft: 0 });
    render(<TicketCheckout event={event} initialQuantity={1} />);
    await fillBuyer();

    await pay();

    expect(await screen.findByText('As vagas desse evento acabaram.')).toBeInTheDocument();
  });

  it('adjusts to the event limit on a too_many answer', async () => {
    create.mockResolvedValue({ ok: false, status: 409, message: 'x', reason: 'too_many', max: 1 });
    render(<TicketCheckout event={event} initialQuantity={2} />);
    await fillBuyer();
    await userEvent.type(screen.getByLabelText('Participante 2'), 'Bruno');

    await pay();

    expect(await screen.findByText('O máximo por compra é 1 ingressos. Ajustamos a quantidade.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Participante 2')).not.toBeInTheDocument();
  });

  it('closes when sales were turned off or ended in the meantime', async () => {
    create.mockResolvedValue({ ok: false, status: 409, message: 'x', reason: 'tickets_closed' });
    render(<TicketCheckout event={event} initialQuantity={1} />);
    await fillBuyer();

    await pay();

    expect(await screen.findByText('A venda de ingressos pelo site está fechada no momento.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ir para o pagamento' })).not.toBeInTheDocument();
  });

  it('shows the message and gives the button back when the payment cannot start', async () => {
    create.mockResolvedValue({ ok: false, status: 503, message: 'Não foi possível iniciar o pagamento.' });
    render(<TicketCheckout event={event} initialQuantity={1} />);
    await fillBuyer();

    await pay();

    expect(await screen.findByText('Não foi possível iniciar o pagamento.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ir para o pagamento' })).toBeEnabled();
  });

  it('keeps the button loading while it sends', async () => {
    create.mockReturnValue(new Promise(() => {}));
    render(<TicketCheckout event={event} initialQuantity={1} />);
    await fillBuyer();

    await pay();

    expect(await screen.findByRole('button', { name: 'Abrindo o pagamento...' })).toBeDisabled();
  });
});
