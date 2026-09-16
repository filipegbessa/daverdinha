import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryDialog } from './CategoryDialog';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');

describe('CategoryDialog', () => {
  it('creates a new category with the initial color when the operator picks none', async () => {
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

  it('edits an existing category, pre-filling its name and color into the picker', async () => {
    const apiFetch = jest.fn().mockResolvedValue(undefined);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
    const onSaved = jest.fn();
    const category = { id: 'cat1', name: 'Bingo', color: '#7a3247' };

    render(<CategoryDialog category={category} onClose={jest.fn()} onSaved={onSaved} />);

    expect(screen.getByLabelText('Nome')).toHaveValue('Bingo');
    expect(screen.getByLabelText('Cor')).toHaveValue('#7a3247');

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(apiFetch).toHaveBeenCalledWith('/categories/cat1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Bingo', color: '#7a3247' }),
    });
    expect(onSaved).toHaveBeenCalled();
  });

  it('saves whatever colour the operator picks, not just a preset', async () => {
    const apiFetch = jest.fn().mockResolvedValue(undefined);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<CategoryDialog category={null} onClose={jest.fn()} onSaved={jest.fn()} />);

    await userEvent.type(screen.getByLabelText('Nome'), 'Urgente');
    // A colour input can't be typed into — the browser drives it through a
    // native picker, and jsdom mirrors that by only honouring a change event.
    fireEvent.change(screen.getByLabelText('Cor'), { target: { value: '#ff8800' } });
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(apiFetch).toHaveBeenCalledWith('/categories', {
      method: 'POST',
      body: JSON.stringify({ name: 'Urgente', color: '#ff8800' }),
    });
  });

  it('flips the preview text to dark on a light colour so the chip stays readable', async () => {
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch: jest.fn() });

    render(
      <CategoryDialog
        category={{ id: 'c1', name: 'Amarelo', color: '#ffee88' }}
        onClose={jest.fn()}
        onSaved={jest.fn()}
      />,
    );

    expect(screen.getByTestId('category-color-preview')).toHaveStyle({ color: '#000000' });
  });

  it('surfaces the backend error and keeps the dialog open when saving fails', async () => {
    const apiFetch = jest.fn().mockRejectedValue(new Error('Já existe uma categoria com esse nome.'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
    const onSaved = jest.fn();

    render(<CategoryDialog category={null} onClose={jest.fn()} onSaved={onSaved} />);

    await userEvent.type(screen.getByLabelText('Nome'), 'Bingo');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe uma categoria com esse nome.');
    expect(onSaved).not.toHaveBeenCalled();
  });
});
