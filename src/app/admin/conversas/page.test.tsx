import { render, screen, waitFor } from '@testing-library/react';
import ConversasPage from './page';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');

const conversations = [
  {
    id: 'c1',
    phone: '5521999999999',
    name: 'Maria',
    status: 'paused_human' as const,
    entryPoint: 'menu' as const,
    updatedAt: '2026-08-31T14:32:00Z',
  },
  {
    id: 'c2',
    phone: '5521988888888',
    name: null,
    status: 'bot_active' as const,
    entryPoint: 'catalog' as const,
    updatedAt: '2026-08-30T10:00:00Z',
  },
];

describe('ConversasPage', () => {
  it('lists every conversation with phone, status and entry point', async () => {
    const apiFetch = jest.fn().mockResolvedValue(conversations);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversasPage />);

    expect(await screen.findByText('5521999999999')).toBeInTheDocument();
    expect(screen.getByText('Maria')).toBeInTheDocument();
    expect(screen.getByText('Transferida')).toBeInTheDocument();
    expect(screen.getByText('Bot ativo')).toBeInTheDocument();
  });

  it('links each row to its conversation detail page', async () => {
    const apiFetch = jest.fn().mockResolvedValue(conversations);
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversasPage />);
    await screen.findByText('5521999999999');

    expect(screen.getByRole('link', { name: /5521999999999/ })).toHaveAttribute('href', '/admin/conversas/c1');
  });

  it('shows a loading state while the request is in flight', async () => {
    let resolveFetch: (value: typeof conversations) => void = () => {};
    const apiFetch = jest.fn().mockReturnValue(
      new Promise<typeof conversations>((resolve) => {
        resolveFetch = resolve;
      }),
    );
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversasPage />);

    expect(screen.getByText(/carregando/i)).toBeInTheDocument();

    resolveFetch(conversations);
    await screen.findByText('5521999999999');
    expect(screen.queryByText(/carregando/i)).not.toBeInTheDocument();
  });

  it('shows an error message when the request fails', async () => {
    const apiFetch = jest.fn().mockRejectedValue(new Error('Erro 500'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<ConversasPage />);

    expect(await screen.findByText('Erro 500')).toBeInTheDocument();
    expect(screen.queryByText(/carregando/i)).not.toBeInTheDocument();
  });
});
