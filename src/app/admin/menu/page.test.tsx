import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MenuPage from './page';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');

const items = [
  { id: 'm1', order: 0, topic: 'Locais de entrega', type: 'entrega' as const, reply: null, active: true },
  { id: 'm2', order: 1, topic: 'Bingo de Plantas', type: 'texto' as const, reply: 'Todo sábado', active: true },
];

describe('MenuPage', () => {
  it('shows a loading state before the items arrive', () => {
    const apiFetch = jest.fn().mockReturnValue(new Promise(() => {}));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MenuPage />);

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('lists every menu item in order', async () => {
    const apiFetch = jest.fn().mockResolvedValue(items);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MenuPage />);

    expect(await screen.findByText('Locais de entrega')).toBeInTheDocument();
    expect(screen.getByText('Bingo de Plantas')).toBeInTheDocument();
  });

  it('shows an inline error when loading the items fails', async () => {
    const apiFetch = jest.fn().mockRejectedValue(new Error('Não foi possível carregar os itens de menu.'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MenuPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar os itens de menu.');
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
  });

  it('moving the second item up sends the swapped order to /menu-items/reorder', async () => {
    const apiFetch = jest.fn().mockResolvedValue(items);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MenuPage />);
    await screen.findByText('Bingo de Plantas');

    await userEvent.click(screen.getByRole('button', { name: 'Mover Bingo de Plantas pra cima' }));

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith('/menu-items/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ orderedIds: ['m2', 'm1'] }),
      }),
    );
  });

  it('the first item cannot move further up, the last cannot move further down', async () => {
    const apiFetch = jest.fn().mockResolvedValue(items);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MenuPage />);
    await screen.findByText('Locais de entrega');

    expect(screen.getByRole('button', { name: 'Mover Locais de entrega pra cima' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Mover Bingo de Plantas pra baixo' })).toBeDisabled();
  });

  it('shows an inline error when reordering fails', async () => {
    const apiFetch = jest
      .fn()
      .mockResolvedValueOnce(items)
      .mockRejectedValueOnce(new Error('Erro ao reordenar itens de menu.'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MenuPage />);
    await screen.findByText('Bingo de Plantas');

    await userEvent.click(screen.getByRole('button', { name: 'Mover Bingo de Plantas pra cima' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro ao reordenar itens de menu.');
  });

  it('toggling active calls PATCH with the flipped value', async () => {
    const apiFetch = jest.fn().mockResolvedValue(items);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MenuPage />);
    await screen.findByText('Locais de entrega');

    await userEvent.click(screen.getByRole('switch', { name: 'Ativar Locais de entrega' }));

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith('/menu-items/m1', {
        method: 'PATCH',
        body: JSON.stringify({ active: false }),
      }),
    );
  });

  it('shows an inline error when toggling active fails', async () => {
    const apiFetch = jest
      .fn()
      .mockResolvedValueOnce(items)
      .mockRejectedValueOnce(new Error('Erro ao atualizar item de menu.'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MenuPage />);
    await screen.findByText('Locais de entrega');

    await userEvent.click(screen.getByRole('switch', { name: 'Ativar Locais de entrega' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro ao atualizar item de menu.');
  });

  it('deleting an item calls DELETE', async () => {
    const apiFetch = jest.fn().mockResolvedValue(items);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MenuPage />);
    await screen.findByText('Locais de entrega');

    await userEvent.click(screen.getAllByRole('button', { name: 'Excluir' })[0]);

    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/menu-items/m1', { method: 'DELETE' }));
  });

  it('shows an inline error when deleting fails', async () => {
    const apiFetch = jest
      .fn()
      .mockResolvedValueOnce(items)
      .mockRejectedValueOnce(new Error('Erro ao excluir item de menu.'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MenuPage />);
    await screen.findByText('Locais de entrega');

    await userEvent.click(screen.getAllByRole('button', { name: 'Excluir' })[0]);

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro ao excluir item de menu.');
  });

  it('opens the dialog to create a new item and reloads the list on save', async () => {
    const apiFetch = jest.fn().mockResolvedValue(items);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MenuPage />);
    await screen.findByText('Locais de entrega');

    await userEvent.click(screen.getByRole('button', { name: 'Novo item' }));

    expect(screen.getByText('Novo item de menu')).toBeInTheDocument();
  });

  it('opens the dialog pre-filled to edit an existing item', async () => {
    const apiFetch = jest.fn().mockResolvedValue(items);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MenuPage />);
    await screen.findByText('Locais de entrega');

    await userEvent.click(screen.getAllByRole('button', { name: 'Editar' })[0]);

    expect(screen.getByText('Editar item')).toBeInTheDocument();
    expect(screen.getByLabelText('Tema')).toHaveValue('Locais de entrega');
  });
});
