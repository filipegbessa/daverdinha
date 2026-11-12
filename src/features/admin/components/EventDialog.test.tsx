import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventDialog } from './EventDialog';
import { useApiClient } from '@/features/admin/lib/api-client';
import { oficina } from '@/features/admin/test-fixtures/event';

jest.mock('@/features/admin/lib/api-client');

function mockSave() {
  const apiFetch = jest.fn().mockResolvedValue(undefined);
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

describe('EventDialog', () => {
  it('creates a draft with times converted to UTC and empty optional fields as ""', async () => {
    const apiFetch = mockSave();
    const onSaved = jest.fn();
    render(<EventDialog event={null} onClose={jest.fn()} onSaved={onSaved} />);

    await fillRequired();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Sem limite de vagas' }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

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
    render(<EventDialog event={null} onClose={jest.fn()} onSaved={jest.fn()} />);

    await userEvent.type(screen.getByLabelText('Título'), 'Festa na praça');
    await userEvent.type(screen.getByLabelText('Descrição'), 'Até acabar.');
    await userEvent.type(screen.getByLabelText('Início'), '2026-11-28T16:00');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Sem limite de vagas' }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(sentFields(apiFetch)).toMatchObject({ startsAt: '2026-11-28T19:00:00.000Z', endsAt: '' });
  });

  it('asks for the spots unless the event has no limit, like made-to-order products', async () => {
    const apiFetch = mockSave();
    render(<EventDialog event={null} onClose={jest.fn()} onSaved={jest.fn()} />);

    await fillRequired();
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(screen.getByText('Informe a quantidade de vagas, ou marque "Sem limite de vagas".')).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Vagas'), '30');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Sem limite de vagas' }));
    expect(screen.getByLabelText('Vagas')).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(sentFields(apiFetch)).toMatchObject({ spots: '' });
  });

  it('opens an event without a limit with the box checked', () => {
    mockSave();
    render(<EventDialog event={{ ...oficina, spots: null }} onClose={jest.fn()} onSaved={jest.fn()} />);

    expect(screen.getByRole('checkbox', { name: 'Sem limite de vagas' })).toBeChecked();
    expect(screen.getByLabelText('Vagas')).toBeDisabled();
  });

  it('does not send an event that ends before it starts', async () => {
    const apiFetch = mockSave();
    render(<EventDialog event={null} onClose={jest.fn()} onSaved={jest.fn()} />);

    await userEvent.type(screen.getByLabelText('Título'), 'Feirinha');
    await userEvent.type(screen.getByLabelText('Descrição'), 'Na praça.');
    await userEvent.type(screen.getByLabelText('Início'), '2026-11-28T15:00');
    await userEvent.type(screen.getByLabelText('Fim'), '2026-11-28T09:00');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(screen.getByText('O fim tem que ser depois do início.')).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('edits an event from the list row, in Rio time, with the per-order limit while selling', async () => {
    const apiFetch = mockSave();
    render(<EventDialog event={oficina} onClose={jest.fn()} onSaved={jest.fn()} />);

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
    render(<EventDialog event={null} onClose={jest.fn()} onSaved={jest.fn()} />);

    expect(screen.queryByLabelText('Máximo de ingressos por compra')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('switch', { name: 'Vender ingressos pelo site' }));

    expect(screen.getByLabelText('Máximo de ingressos por compra')).toHaveValue(10);
    expect(screen.getByText(/Desligado, a inscrição é pelo/)).toBeInTheDocument();
  });

  it('rejects a per-order limit outside 1 to 50', async () => {
    const apiFetch = mockSave();
    render(<EventDialog event={oficina} onClose={jest.fn()} onSaved={jest.fn()} />);

    await userEvent.clear(screen.getByLabelText('Máximo de ingressos por compra'));
    await userEvent.type(screen.getByLabelText('Máximo de ingressos por compra'), '60');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(screen.getByText('De 1 a 50 ingressos.')).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('sends a new cover photo, or asks to remove the current one', async () => {
    const apiFetch = mockSave();
    render(<EventDialog event={oficina} onClose={jest.fn()} onSaved={jest.fn()} />);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Remover a foto' }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(sentFields(apiFetch)).toMatchObject({ removeImage: 'true' });

    const file = new File(['x'], 'capa.webp', { type: 'image/webp' });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Remover a foto' }));
    await userEvent.upload(screen.getByLabelText('Foto'), file);
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    const body = apiFetch.mock.calls.at(-1)[1].body as FormData;
    expect(body.get('image')).toBe(file);
    expect(body.get('removeImage')).toBeNull();
  });

  it('refuses a photo that is not JPEG, PNG or WebP', async () => {
    mockSave();
    render(<EventDialog event={null} onClose={jest.fn()} onSaved={jest.fn()} />);

    await userEvent.upload(screen.getByLabelText('Foto'), new File(['x'], 'capa.gif', { type: 'image/gif' }), {
      applyAccept: false,
    });

    expect(screen.getByText('"capa.gif" precisa ser JPEG, PNG ou WebP.')).toBeInTheDocument();
  });
});
