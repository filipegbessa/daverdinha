import { render, screen } from '@testing-library/react';
import ConversaDetailPage from './page';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');
jest.mock('next/navigation', () => ({ useParams: () => ({ id: 'c1' }) }));

const conversation = {
  id: 'c1',
  telefone: '5521999999999',
  nome: 'Maria',
  status: 'paused_human' as const,
  entryPoint: 'menu' as const,
  updatedAt: '2026-08-31T14:32:00Z',
  messages: [
    { id: 'msg1', direction: 'inbound' as const, body: 'Oi, boa tarde!', createdAt: '2026-08-31T14:31:00Z' },
    { id: 'msg2', direction: 'outbound' as const, body: 'Oi! Como posso ajudar?', createdAt: '2026-08-31T14:31:05Z' },
  ],
};

describe('ConversaDetailPage', () => {
  it('shows the conversation metadata and every message in order', async () => {
    const apiFetch = jest.fn().mockResolvedValue(conversation);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);

    expect(await screen.findByText('5521999999999')).toBeInTheDocument();
    expect(screen.getByText('Maria')).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledWith('/conversations/c1');

    const messages = screen.getAllByTestId('message-bubble');
    expect(messages[0]).toHaveTextContent('Oi, boa tarde!');
    expect(messages[1]).toHaveTextContent('Oi! Como posso ajudar?');
  });

  it('shows a loading state while the request is in flight', async () => {
    let resolveFetch: (value: typeof conversation) => void = () => {};
    const apiFetch = jest.fn().mockReturnValue(
      new Promise<typeof conversation>((resolve) => {
        resolveFetch = resolve;
      }),
    );
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);

    expect(screen.getByText(/carregando/i)).toBeInTheDocument();

    resolveFetch(conversation);
    await screen.findByText('5521999999999');
    expect(screen.queryByText(/carregando/i)).not.toBeInTheDocument();
  });

  it('shows an error message when the request fails', async () => {
    const apiFetch = jest.fn().mockRejectedValue(new Error('Erro 404'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversaDetailPage />);

    expect(await screen.findByText('Erro 404')).toBeInTheDocument();
    expect(screen.queryByText(/carregando/i)).not.toBeInTheDocument();
  });
});
