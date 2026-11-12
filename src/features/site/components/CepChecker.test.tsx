import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CepChecker } from './CepChecker';
import { StoreEnabledProvider } from '@/features/store/components/StoreEnabled';
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

  async function check(result: unknown, storeEnabled = false) {
    (checkCep as jest.Mock).mockResolvedValue(result);
    render(
      <StoreEnabledProvider value={storeEnabled}>
        <CepChecker />
      </StoreEnabledProvider>,
    );
    await userEvent.type(screen.getByLabelText('CEP'), '22220000');
    await userEvent.click(screen.getByRole('button', { name: 'Verificar' }));
  }

  it('says when it does not deliver, without sending to WhatsApp', async () => {
    await check({ status: 'not_covered', bairro: 'Edson Passos (Mesquita)' });

    expect(await screen.findByText(/Ainda não entregamos em/)).toHaveTextContent(
      'Ainda não entregamos em Edson Passos (Mesquita).',
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  describe('with the store on', () => {
    it('shows the delivery fee instead of the WhatsApp link', async () => {
      await check({ status: 'covered', bairro: 'Catete', fee: 15 }, true);

      expect(await screen.findByText(/Entregamos em Catete!/)).toBeInTheDocument();
      expect(screen.getByText(/Frete:/).textContent).toMatch(/Frete: R\$\s15,00\./);
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('says it does not deliver yet when the bairro is in no delivery area', async () => {
      await check({ status: 'covered', bairro: 'Catete', fee: null }, true);

      expect(await screen.findByText(/Ainda não entregamos em/)).toHaveTextContent('Ainda não entregamos em Catete.');
      expect(screen.queryByText(/Entregamos em Catete!/)).not.toBeInTheDocument();
    });
  });

  it('with the store off, still sends a covered bairro to WhatsApp to arrange the delivery', async () => {
    await check({ status: 'covered', bairro: 'Catete', fee: 15 });

    expect(await screen.findByRole('link', { name: 'Combinar pelo WhatsApp' })).toBeInTheDocument();
    expect(screen.queryByText(/Frete:/)).not.toBeInTheDocument();
  });
});
