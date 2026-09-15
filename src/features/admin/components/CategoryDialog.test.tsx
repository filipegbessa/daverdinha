import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryDialog } from './CategoryDialog';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');

describe('CategoryDialog', () => {
  it('creates a new category with the first color selected by default', async () => {
    const apiFetch = jest.fn().mockResolvedValue(undefined);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
    const onSaved = jest.fn();

    render(<CategoryDialog category={null} onClose={jest.fn()} onSaved={onSaved} />);

    await userEvent.type(screen.getByLabelText('Nome'), 'Bingo');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(apiFetch).toHaveBeenCalledWith('/categories', {
      method: 'POST',
      body: JSON.stringify({ name: 'Bingo', color: '#185928' }),
    });
    expect(onSaved).toHaveBeenCalled();
  });

  it('edits an existing category, pre-filling its name and color', async () => {
    const apiFetch = jest.fn().mockResolvedValue(undefined);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
    const onSaved = jest.fn();
    const category = { id: 'cat1', name: 'Bingo', color: '#7a3247' };

    render(<CategoryDialog category={category} onClose={jest.fn()} onSaved={onSaved} />);

    expect(screen.getByLabelText('Nome')).toHaveValue('Bingo');
    await userEvent.click(screen.getByRole('radio', { name: '#a15c38' }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(apiFetch).toHaveBeenCalledWith('/categories/cat1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Bingo', color: '#a15c38' }),
    });
    expect(onSaved).toHaveBeenCalled();
  });

  it('shows the error message and does not call onSaved when the API call fails', async () => {
    const apiFetch = jest.fn().mockRejectedValue(new Error('Já existe uma categoria com esse nome.'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
    const onSaved = jest.fn();

    render(<CategoryDialog category={null} onClose={jest.fn()} onSaved={onSaved} />);
    await userEvent.type(screen.getByLabelText('Nome'), 'Bingo');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe uma categoria com esse nome.');
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('calls onClose when Cancelar is clicked', async () => {
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch: jest.fn() });
    const onClose = jest.fn();

    render(<CategoryDialog category={null} onClose={onClose} onSaved={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalled();
  });
});
