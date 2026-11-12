import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrderLookupForm } from './OrderLookupForm';
import { requestOrderLinks } from '@/features/store/lib/store-api';

jest.mock('@/features/store/lib/store-api');
const request = requestOrderLinks as jest.Mock;

describe('OrderLookupForm', () => {
  beforeEach(() => jest.clearAllMocks());

  async function submit(email: string) {
    await userEvent.type(screen.getByLabelText('E-mail usado na compra'), email);
    await userEvent.click(screen.getByRole('button', { name: 'Enviar meus pedidos' }));
  }

  it('always gives the same answer once sent, without saying whether the email has orders', async () => {
    request.mockResolvedValue({ ok: true });
    render(<OrderLookupForm />);

    await submit('maria@exemplo.com');

    expect(request).toHaveBeenCalledWith('maria@exemplo.com');
    expect(
      await screen.findByText('Se houver pedidos nesse e-mail, mandamos os links. Confira também o spam.'),
    ).toBeInTheDocument();
  });

  it('checks the email before calling the API', async () => {
    render(<OrderLookupForm />);

    await submit('maria');

    expect(screen.getByText('Informe um e-mail válido.')).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
  });

  it('explains the rate limit', async () => {
    request.mockResolvedValue({ ok: false, reason: 'too_many' });
    render(<OrderLookupForm />);

    await submit('maria@exemplo.com');

    expect(await screen.findByText('Muitas tentativas. Tente de novo em uma hora.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar meus pedidos' })).toBeEnabled();
  });

  it('shows a generic error when the API fails', async () => {
    request.mockResolvedValue({ ok: false, reason: 'error' });
    render(<OrderLookupForm />);

    await submit('maria@exemplo.com');

    expect(await screen.findByText(/Não foi possível enviar agora/)).toBeInTheDocument();
  });

  it('keeps the button loading while it sends', async () => {
    request.mockReturnValue(new Promise(() => {}));
    render(<OrderLookupForm />);

    await submit('maria@exemplo.com');

    expect(await screen.findByRole('button', { name: 'Enviando...' })).toBeDisabled();
  });
});
