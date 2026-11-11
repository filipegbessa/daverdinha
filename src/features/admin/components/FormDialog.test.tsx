import { render, screen } from '@testing-library/react';
import { FormDialog } from './FormDialog';

describe('FormDialog', () => {
  it('scrolls only the fields: title and the Cancelar/Salvar footer stay outside the scroll area', () => {
    render(
      <FormDialog title="Novo produto" onClose={jest.fn()} onSubmit={jest.fn()} isPending={false} error="Falhou.">
        <input aria-label="Nome" />
      </FormDialog>,
    );

    const body = document.querySelector('[data-slot="form-dialog-body"]')!;
    expect(body).toHaveClass('overflow-y-auto');
    expect(body).toContainElement(screen.getByLabelText('Nome'));
    expect(body).not.toContainElement(screen.getByRole('heading', { name: 'Novo produto' }));
    expect(body).not.toContainElement(screen.getByRole('button', { name: 'Salvar' }));
    expect(body).not.toContainElement(screen.getByRole('button', { name: 'Cancelar' }));
    expect(body).not.toContainElement(screen.getByText('Falhou.'));
  });
});
