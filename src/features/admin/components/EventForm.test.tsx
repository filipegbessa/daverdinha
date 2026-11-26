import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventForm } from './EventForm';
import { useApiClient } from '@/features/admin/lib/api-client';
import { oficina } from '@/features/admin/test-fixtures/event';

jest.mock('@/features/admin/lib/api-client');

function mockSave() {
  const apiFetch = jest.fn().mockResolvedValue(oficina);
  (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
  return apiFetch;
}

function sentFields(apiFetch: jest.Mock) {
  const body = apiFetch.mock.calls.at(-1)[1].body as FormData;
  return Object.fromEntries([...body.entries()].filter(([, v]) => typeof v === 'string'));
}

async function fillRequired() {
  await userEvent.type(screen.getByLabelText('Título'), 'Feirinha');
  await userEvent.type(screen.getByLabelText('Descrição'), 'Na praça.');
  await userEvent.type(screen.getByLabelText('Início'), '2026-11-28T09:00');
  await userEvent.type(screen.getByLabelText('Fim'), '2026-11-28T15:00');
}

describe('EventForm', () => {
  it('creates a draft with times converted to UTC and empty optional fields as ""', async () => {
    const apiFetch = mockSave();
    const onSaved = jest.fn();
    render(<EventForm event={null} onSaved={onSaved} />);

    await fillRequired();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Sem limite de vagas' }));
    await userEvent.click(screen.getByRole('button', { name: 'Criar evento' }));

    expect(apiFetch).toHaveBeenCalledWith('/events', expect.objectContaining({ method: 'POST' }));
    expect(sentFields(apiFetch)).toEqual({
      title: 'Feirinha',
      description: 'Na praça.',
      startsAt: '2026-11-28T12:00:00.000Z',
      endsAt: '2026-11-28T18:00:00.000Z',
      locationName: '',
      locationAddress: '',
      price: '',
      spots: '',
      published: 'false',
      ticketSales: 'false',
    });
    expect(onSaved).toHaveBeenCalled();
  });

  it('saves an event without an end time', async () => {
    const apiFetch = mockSave();
    render(<EventForm event={null} onSaved={jest.fn()} />);

    await userEvent.type(screen.getByLabelText('Título'), 'Festa na praça');
    await userEvent.type(screen.getByLabelText('Descrição'), 'Até acabar.');
    await userEvent.type(screen.getByLabelText('Início'), '2026-11-28T16:00');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Sem limite de vagas' }));
    await userEvent.click(screen.getByRole('button', { name: 'Criar evento' }));

    expect(sentFields(apiFetch)).toMatchObject({ startsAt: '2026-11-28T19:00:00.000Z', endsAt: '' });
  });

  it('asks for the spots unless the event has no limit, like made-to-order products', async () => {
    const apiFetch = mockSave();
    render(<EventForm event={null} onSaved={jest.fn()} />);

    await fillRequired();
    await userEvent.click(screen.getByRole('button', { name: 'Criar evento' }));
    expect(screen.getByText('Informe a quantidade de vagas, ou marque "Sem limite de vagas".')).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Vagas'), '30');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Sem limite de vagas' }));
    expect(screen.getByLabelText('Vagas')).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Criar evento' }));

    expect(sentFields(apiFetch)).toMatchObject({ spots: '' });
  });

  it('opens an event without a limit with the box checked', () => {
    mockSave();
    render(<EventForm event={{ ...oficina, spots: null }} onSaved={jest.fn()} />);

    expect(screen.getByRole('checkbox', { name: 'Sem limite de vagas' })).toBeChecked();
    expect(screen.getByLabelText('Vagas')).toBeDisabled();
  });

  it('does not save without a title or a description, with a message in Portuguese instead of the API error', async () => {
    const apiFetch = mockSave();
    render(<EventForm event={null} onSaved={jest.fn()} />);

    await userEvent.type(screen.getByLabelText('Início'), '2026-11-28T09:00');
    await userEvent.click(screen.getByRole('button', { name: 'Criar evento' }));

    expect(apiFetch).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Título')).toHaveAccessibleDescription('Informe o título do evento.');
    expect(screen.getByLabelText('Descrição')).toHaveAccessibleDescription('Informe a descrição do evento.');
  });

  it('does not send an event that ends before it starts', async () => {
    const apiFetch = mockSave();
    render(<EventForm event={null} onSaved={jest.fn()} />);

    await userEvent.type(screen.getByLabelText('Título'), 'Feirinha');
    await userEvent.type(screen.getByLabelText('Descrição'), 'Na praça.');
    await userEvent.type(screen.getByLabelText('Início'), '2026-11-28T15:00');
    await userEvent.type(screen.getByLabelText('Fim'), '2026-11-28T09:00');
    await userEvent.click(screen.getByRole('button', { name: 'Criar evento' }));

    expect(screen.getByText('O fim tem que ser depois do início.')).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('edits an event, in Rio time, with the per-order limit while selling', async () => {
    const apiFetch = mockSave();
    render(<EventForm event={oficina} onSaved={jest.fn()} />);

    expect(screen.getByLabelText('Início')).toHaveValue('2026-11-21T10:00');
    expect(screen.getByLabelText('Máximo de ingressos por compra')).toHaveValue(4);
    await userEvent.clear(screen.getByLabelText('Preço (R$)'));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(apiFetch).toHaveBeenCalledWith('/events/e1', expect.objectContaining({ method: 'PATCH' }));
    expect(sentFields(apiFetch)).toMatchObject({
      price: '',
      spots: '8',
      published: 'true',
      ticketSales: 'true',
      maxTicketsPerOrder: '4',
    });
  });

  it('hides the per-order limit while the site sale is off, and shows it with the default when turned on', async () => {
    mockSave();
    render(<EventForm event={null} onSaved={jest.fn()} />);

    expect(screen.queryByLabelText('Máximo de ingressos por compra')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('switch', { name: 'Vender ingressos pelo site' }));

    expect(screen.getByLabelText('Máximo de ingressos por compra')).toHaveValue(10);
    expect(screen.getByText(/Desligado, a inscrição é pelo/)).toBeInTheDocument();
  });

  it('rejects a per-order limit outside 1 to 50', async () => {
    const apiFetch = mockSave();
    render(<EventForm event={oficina} onSaved={jest.fn()} />);

    await userEvent.clear(screen.getByLabelText('Máximo de ingressos por compra'));
    await userEvent.type(screen.getByLabelText('Máximo de ingressos por compra'), '60');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(screen.getByText('De 1 a 50 ingressos.')).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('sends new photos, replacing the current ones', async () => {
    const apiFetch = mockSave();
    render(<EventForm event={oficina} onSaved={jest.fn()} />);

    const file = new File(['x'], 'capa.webp', { type: 'image/webp' });
    await userEvent.upload(screen.getByLabelText('Fotos'), [file]);
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    const body = apiFetch.mock.calls.at(-1)[1].body as FormData;
    expect(body.getAll('images')).toEqual([file]);
  });

  it('refuses a photo that is not JPEG, PNG or WebP', async () => {
    mockSave();
    render(<EventForm event={null} onSaved={jest.fn()} />);

    await userEvent.upload(screen.getByLabelText('Fotos'), new File(['x'], 'capa.gif', { type: 'image/gif' }), {
      applyAccept: false,
    });

    expect(screen.getByText('"capa.gif" precisa ser JPEG, PNG ou WebP.')).toBeInTheDocument();
  });

  it('only saves after a change, and can discard it', async () => {
    mockSave();
    render(<EventForm event={oficina} onSaved={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Título'), ' de verão');
    expect(screen.getByText('Alterações não salvas')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Descartar alterações' }));
    expect(screen.getByLabelText('Título')).toHaveValue(oficina.title);
  });

  it('shows the card preview and the sales of a saved event', () => {
    mockSave();
    render(<EventForm event={{ ...oficina, sold: 3, reserved: 1 }} onSaved={jest.fn()} />);

    expect(screen.getByLabelText('Prévia do card na agenda')).toHaveTextContent(oficina.title);
    expect(screen.getByText(/3 ingressos vendidos · 1 em pedido pendente/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lista de presença' })).toHaveAttribute(
      'href',
      expect.stringContaining(`/admin/eventos/${oficina.id}/participantes`),
    );
  });

  it('types the price with the reais mask, and clearing it makes the event free', async () => {
    const apiFetch = mockSave();
    render(<EventForm event={{ ...oficina, price: null }} onSaved={jest.fn()} />);

    const price = screen.getByLabelText('Preço (R$)');
    expect(price).toHaveValue('');
    await userEvent.type(price, '4550');
    expect(price).toHaveValue('R$ 45,50');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(sentFields(apiFetch)).toMatchObject({ price: '45.50' });

    await userEvent.clear(price);
    expect(screen.getByLabelText('Prévia do card na agenda')).toHaveTextContent('Gratuito');
  });
});
