import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('shows the action running: disabled, busy and with the loading label', () => {
    render(
      <Button loading loadingText="Salvando...">
        Salvar
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Salvando...' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('keeps its label with a spinner when no loading text is given', () => {
    render(<Button loading>Enviar</Button>);

    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
  });

  it('is a plain button when not loading', () => {
    render(<Button>Salvar</Button>);

    const button = screen.getByRole('button', { name: 'Salvar' });
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute('aria-busy');
  });
});
