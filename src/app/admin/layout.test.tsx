import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminLayout from './layout';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@clerk/nextjs', () => ({ UserButton: () => <div data-testid="user-button" /> }));

const mockUsePathname = jest.fn();
jest.mock('next/navigation', () => ({ usePathname: () => mockUsePathname() }));

jest.mock('@/features/admin/lib/use-push-subscription', () => ({
  usePushSubscription: () => ({ subscribe: jest.fn(), subscribing: false, error: null }),
}));

jest.mock('@/features/admin/lib/api-client');

describe('AdminLayout', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/admin');
    // Left pending on purpose: these tests don't exercise the unread badge,
    // and a never-resolving fetch avoids an unrelated post-test state update
    // (act() warning) from the background /conversations poll.
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch: jest.fn().mockReturnValue(new Promise(() => {})) });
  });

  it('renders links to every admin section', () => {
    render(
      <AdminLayout>
        <p>conteúdo</p>
      </AdminLayout>,
    );
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/admin');
    expect(screen.getByRole('link', { name: 'Mensagens' })).toHaveAttribute('href', '/admin/mensagens');
    expect(screen.getByRole('link', { name: 'Menu' })).toHaveAttribute('href', '/admin/menu');
    expect(screen.getByRole('link', { name: 'Entregas' })).toHaveAttribute('href', '/admin/entregas');
    expect(screen.getByRole('link', { name: 'Destaques' })).toHaveAttribute('href', '/admin/destaques');
    expect(screen.getByRole('link', { name: 'Categorias' })).toHaveAttribute('href', '/admin/categorias');
    expect(screen.getByRole('link', { name: 'Conversas' })).toHaveAttribute('href', '/admin/conversas');
  });

  it('renders the page content passed as children', () => {
    render(
      <AdminLayout>
        <p>conteúdo</p>
      </AdminLayout>,
    );
    expect(screen.getByText('conteúdo')).toBeInTheDocument();
  });

  it('marks the current route as the active nav link', () => {
    mockUsePathname.mockReturnValue('/admin/conversas/abc-123');
    render(
      <AdminLayout>
        <p>conteúdo</p>
      </AdminLayout>,
    );
    expect(screen.getByRole('link', { name: 'Conversas' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
  });

  it('starts with the mobile menu closed', () => {
    render(
      <AdminLayout>
        <p>conteúdo</p>
      </AdminLayout>,
    );
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the mobile menu when the hamburger button is clicked', async () => {
    render(
      <AdminLayout>
        <p>conteúdo</p>
      </AdminLayout>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));

    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toBeInTheDocument();
  });

  it('closes the mobile menu via the close button', async () => {
    render(
      <AdminLayout>
        <p>conteúdo</p>
      </AdminLayout>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    await userEvent.click(screen.getByRole('button', { name: 'Fechar menu' }));

    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the mobile menu after clicking a nav link', async () => {
    // jsdom logs a harmless "navigation not implemented" error when a real
    // next/link anchor is clicked outside a full router context.
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <AdminLayout>
        <p>conteúdo</p>
      </AdminLayout>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    await userEvent.click(screen.getByRole('link', { name: 'Mensagens' }));

    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'false');
    consoleError.mockRestore();
  });

  it('closes the mobile menu when the backdrop is clicked', async () => {
    const { container } = render(
      <AdminLayout>
        <p>conteúdo</p>
      </AdminLayout>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    const backdrop = container.querySelector('[aria-hidden="true"]');
    expect(backdrop).not.toBeNull();
    await userEvent.click(backdrop as Element);

    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows an unread-count badge next to "Conversas" when there are unread conversations', async () => {
    const conversations = [
      { id: 'c1', phone: '5521999999999', name: null, status: 'bot_active', unread: true, updatedAt: '' },
      { id: 'c2', phone: '5521888888888', name: null, status: 'bot_active', unread: true, updatedAt: '' },
      { id: 'c3', phone: '5521777777777', name: null, status: 'bot_active', unread: false, updatedAt: '' },
    ];
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch: jest.fn().mockResolvedValue(conversations) });

    render(
      <AdminLayout>
        <p>conteúdo</p>
      </AdminLayout>,
    );

    expect(await screen.findByText('2')).toBeInTheDocument();
    // The badge is decorative (aria-hidden) — the link's accessible name stays plain.
    expect(screen.getByRole('link', { name: 'Conversas' })).toBeInTheDocument();
  });

  it('shows no badge when there are no unread conversations', async () => {
    (useApiClient as jest.Mock).mockReturnValue({
      apiFetch: jest.fn().mockResolvedValue([{ id: 'c1', phone: '5521999999999', name: null, status: 'bot_active', unread: false, updatedAt: '' }]),
    });

    render(
      <AdminLayout>
        <p>conteúdo</p>
      </AdminLayout>,
    );

    await waitFor(() => expect(useApiClient).toHaveBeenCalled());
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('sets the app icon badge (Badging API) to the unread count when the browser supports it', async () => {
    const setAppBadge = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'setAppBadge', { value: setAppBadge, configurable: true });
    const conversations = [
      { id: 'c1', phone: '5521999999999', name: null, status: 'bot_active', unread: true, updatedAt: '' },
    ];
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch: jest.fn().mockResolvedValue(conversations) });

    render(
      <AdminLayout>
        <p>conteúdo</p>
      </AdminLayout>,
    );

    await waitFor(() => expect(setAppBadge).toHaveBeenCalledWith(1));
    delete (window.navigator as { setAppBadge?: unknown }).setAppBadge;
  });

  it('does nothing when the Badging API is unavailable', async () => {
    delete (window.navigator as { setAppBadge?: unknown }).setAppBadge;
    const conversations = [
      { id: 'c1', phone: '5521999999999', name: null, status: 'bot_active', unread: true, updatedAt: '' },
    ];
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch: jest.fn().mockResolvedValue(conversations) });

    render(
      <AdminLayout>
        <p>conteúdo</p>
      </AdminLayout>,
    );

    expect(await screen.findByText('1')).toBeInTheDocument();
  });
});
