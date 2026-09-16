import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('shows the title and body, and confirms only when asked to', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(
      <ConfirmDialog title="Excluir isso?" onConfirm={onConfirm} onCancel={onCancel}>
        <p>Não dá pra desfazer.</p>
      </ConfirmDialog>,
    );

    expect(screen.getByText('Excluir isso?')).toBeInTheDocument();
    expect(screen.getByText('Não dá pra desfazer.')).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('cancels without confirming', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(<ConfirmDialog title="Excluir isso?" onConfirm={onConfirm} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('locks the confirm button behind a pending label, so a slow delete is not fired twice', () => {
    render(<ConfirmDialog title="Excluir isso?" isPending onConfirm={jest.fn()} onCancel={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Excluindo...' })).toBeDisabled();
  });

  it('shows the failure inside the dialog rather than behind it', () => {
    render(
      <ConfirmDialog
        title="Excluir isso?"
        error="Categoria em uso."
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Categoria em uso.');
  });
});
