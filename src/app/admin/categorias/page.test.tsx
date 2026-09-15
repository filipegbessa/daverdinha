import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoriasPage from './page';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');

const categories = [
  { id: 'cat1', name: 'Bingo', color: '#185928', conversationCount: 3 },
  { id: 'cat2', name: 'Fechou compra', color: '#7a3247', conversationCount: 0 },
];

describe('CategoriasPage', () => {
  it('lists every category with its conversation count', async () => {
    const apiFetch = jest.fn().mockResolvedValue(categories);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<CategoriasPage />);

    expect(await screen.findByText('Bingo')).toBeInTheDocument();
    expect(screen.getByText('Fechou compra')).toBeInTheDocument();
    expect(screen.getByText('3 conversa(s)')).toBeInTheDocument();
    expect(screen.getByText('0 conversa(s)')).toBeInTheDocument();
  });

  it('opens the create dialog when "Nova categoria" is clicked', async () => {
    const apiFetch = jest.fn().mockResolvedValue(categories);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<CategoriasPage />);
    await screen.findByText('Bingo');
    await userEvent.click(screen.getByRole('button', { name: 'Nova categoria' }));

    expect(screen.getByRole('heading', { name: 'Nova categoria' })).toBeInTheDocument();
  });

  it('shows a delete-confirmation dialog stating the exact affected conversation count, and deletes on confirm', async () => {
    const apiFetch = jest.fn().mockResolvedValue(categories);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<CategoriasPage />);
    const [deleteBingoButton] = await screen.findAllByRole('button', { name: 'Excluir' });
    await userEvent.click(deleteBingoButton);

    expect(screen.getByText(/Essa categoria está em 3 conversa\(s\)/)).toBeInTheDocument();

    apiFetch.mockResolvedValueOnce(undefined).mockResolvedValueOnce([categories[1]]);
    // The dialog's own confirm button is labeled distinctly from the row's
    // "Excluir" button (which is still on screen behind the dialog), so
    // this selector is unambiguous.
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));

    expect(apiFetch).toHaveBeenCalledWith('/categories/cat1', { method: 'DELETE' });
  });

  it('cancelling the delete dialog does not call the API', async () => {
    const apiFetch = jest.fn().mockResolvedValue(categories);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<CategoriasPage />);
    const [deleteBingoButton] = await screen.findAllByRole('button', { name: 'Excluir' });
    await userEvent.click(deleteBingoButton);
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(apiFetch).toHaveBeenCalledTimes(1);
  });
});
