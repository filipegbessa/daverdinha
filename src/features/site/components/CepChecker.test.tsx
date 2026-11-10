import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CepChecker } from './CepChecker';
import { checkCep } from '@/features/site/lib/cep-check';

jest.mock('@/features/site/lib/cep-check', () => ({
  ...jest.requireActual('@/features/site/lib/cep-check'),
  checkCep: jest.fn(),
}));

describe('CepChecker', () => {
  it('marks the button busy while the CEP is being checked', async () => {
    (checkCep as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<CepChecker />);

    await userEvent.type(screen.getByLabelText('CEP'), '22071000');
    await userEvent.click(screen.getByRole('button', { name: 'Verificar' }));

    const button = screen.getByRole('button', { name: 'Verificando...' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
  });
});
