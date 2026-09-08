import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MenuItemDialog } from '@/features/admin/components/MenuItemDialog';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');

const regularItem = {
  id: 'm1',
  order: 0,
  topic: 'Bingo de Plantas',
  type: 'texto' as const,
  isSystem: false,
  reply: 'Todo sábado às 16h!',
  question: null,
  noMatchReply: null,
  answerOptions: [],
  deliveryPrompt: null,
  deliveryConfirmedMessage: null,
  deliveryNotCoveredMessage: null,
  deliveryUnrecognizedMessage: null,
  active: true,
};

const systemItem = {
  id: 'm-sys',
  order: 0,
  topic: 'Locais de entrega',
  type: 'entrega' as const,
  isSystem: true,
  reply: null,
  question: null,
  noMatchReply: null,
  answerOptions: [],
  deliveryPrompt: 'Qual o bairro?',
  deliveryConfirmedMessage: 'Entregamos sim!',
  deliveryNotCoveredMessage: 'Não entregamos aí.',
  deliveryUnrecognizedMessage: 'Não entendi o bairro.',
  active: true,
};

describe('MenuItemDialog', () => {
  it('shows no Tipo selector for a new item, only Tema and Resposta', () => {
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch: jest.fn() });
    render(<MenuItemDialog item={null} onClose={jest.fn()} onSaved={jest.fn()} />);

    expect(screen.getByLabelText('Tema')).toBeInTheDocument();
    expect(screen.getByLabelText('Resposta')).toBeInTheDocument();
    expect(screen.queryByLabelText('Tipo')).not.toBeInTheDocument();
  });

  it('POSTs a new item with type texto', async () => {
    const apiFetch = jest.fn().mockResolvedValue({});
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
    const onSaved = jest.fn();

    render(<MenuItemDialog item={null} onClose={jest.fn()} onSaved={onSaved} />);
    await userEvent.type(screen.getByLabelText('Tema'), 'Bingo de Plantas');
    await userEvent.type(screen.getByLabelText('Resposta'), 'Todo sábado às 16h!');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(apiFetch).toHaveBeenCalled());
    const [, options] = apiFetch.mock.calls[0];
    expect(JSON.parse(options.body)).toMatchObject({
      topic: 'Bingo de Plantas',
      type: 'texto',
      reply: 'Todo sábado às 16h!',
    });
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it('PATCHes an existing regular item without sending type', async () => {
    const apiFetch = jest.fn().mockResolvedValue({});
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MenuItemDialog item={regularItem} onClose={jest.fn()} onSaved={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(apiFetch).toHaveBeenCalled());
    const [url, options] = apiFetch.mock.calls[0];
    expect(url).toBe('/menu-items/m1');
    expect(options.method).toBe('PATCH');
    expect(JSON.parse(options.body)).not.toHaveProperty('type');
  });

  it('shows the 4 delivery-message fields for the system item, not Resposta', () => {
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch: jest.fn() });
    render(<MenuItemDialog item={systemItem} onClose={jest.fn()} onSaved={jest.fn()} />);

    expect(screen.getByLabelText('Pergunta inicial')).toHaveValue('Qual o bairro?');
    expect(screen.getByLabelText('Mensagem de confirmação de entrega')).toHaveValue('Entregamos sim!');
    expect(screen.getByLabelText('Mensagem de região não atendida')).toHaveValue('Não entregamos aí.');
    expect(screen.getByLabelText('Mensagem quando não reconhece o bairro')).toHaveValue('Não entendi o bairro.');
    expect(screen.queryByLabelText('Resposta')).not.toBeInTheDocument();
  });

  it('PATCHes the system item with its 4 delivery fields, no type or reply', async () => {
    const apiFetch = jest.fn().mockResolvedValue({});
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MenuItemDialog item={systemItem} onClose={jest.fn()} onSaved={jest.fn()} />);
    const field = screen.getByLabelText('Mensagem de região não atendida');
    await userEvent.clear(field);
    await userEvent.type(field, 'Novo texto');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(apiFetch).toHaveBeenCalled());
    const [url, options] = apiFetch.mock.calls[0];
    expect(url).toBe('/menu-items/m-sys');
    const body = JSON.parse(options.body);
    expect(body).toMatchObject({
      topic: 'Locais de entrega',
      deliveryPrompt: 'Qual o bairro?',
      deliveryConfirmedMessage: 'Entregamos sim!',
      deliveryNotCoveredMessage: 'Novo texto',
      deliveryUnrecognizedMessage: 'Não entendi o bairro.',
    });
    expect(body).not.toHaveProperty('type');
    expect(body).not.toHaveProperty('reply');
  });

  it('shows an inline error and does not close when saving fails', async () => {
    const apiFetch = jest.fn().mockRejectedValue(new Error('Erro ao salvar item de menu.'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
    const onSaved = jest.fn();
    const onClose = jest.fn();

    render(<MenuItemDialog item={null} onClose={onClose} onSaved={onSaved} />);
    await userEvent.type(screen.getByLabelText('Tema'), 'Bingo de Plantas');
    await userEvent.type(screen.getByLabelText('Resposta'), 'Todo sábado às 16h!');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro ao salvar item de menu.');
    expect(onSaved).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
