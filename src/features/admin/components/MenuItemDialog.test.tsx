import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MenuItemDialog } from '@/features/admin/components/MenuItemDialog';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');

describe('MenuItemDialog', () => {
  it('shows the reply field only when type is texto', async () => {
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch: jest.fn() });
    render(<MenuItemDialog item={null} onClose={jest.fn()} onSaved={jest.fn()} />);

    expect(screen.getByLabelText('Resposta')).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'entrega');
    expect(screen.queryByLabelText('Resposta')).not.toBeInTheDocument();
  });

  it('POSTs a new item when creating', async () => {
    const apiFetch = jest.fn().mockResolvedValue({});
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
    const onSaved = jest.fn();

    render(<MenuItemDialog item={null} onClose={jest.fn()} onSaved={onSaved} />);
    await userEvent.type(screen.getByLabelText('Tema'), 'Bingo de Plantas');
    await userEvent.type(screen.getByLabelText('Resposta'), 'Todo sábado às 16h!');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(apiFetch).toHaveBeenCalledWith(
      '/menu-items',
      expect.objectContaining({ method: 'POST' }),
    );
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it('PATCHes the existing item when editing', async () => {
    const apiFetch = jest.fn().mockResolvedValue({});
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
    const item = { id: 'm1', order: 0, topic: 'Bingo de Plantas', type: 'texto' as const, reply: 'Todo sábado', active: true };

    render(<MenuItemDialog item={item} onClose={jest.fn()} onSaved={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith('/menu-items/m1', expect.objectContaining({ method: 'PATCH' })),
    );
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
