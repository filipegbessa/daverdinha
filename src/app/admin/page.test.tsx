import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardPage from './page';
import { useApiClient } from '@/features/admin/lib/api-client';
import { mockApi as mockAdminApi } from '@/features/admin/test-fixtures/mock-api';
import { refreshPublicSite } from '@/features/admin/actions/refresh-public-site';

jest.mock('@/features/admin/lib/api-client');
jest.mock('@/features/admin/actions/refresh-public-site', () => ({
  refreshPublicSite: jest.fn().mockResolvedValue(undefined),
}));

const emptySettings = { botEnabled: false, welcomeMessage: '' };

/**
 * Routes by path instead of by call order: the page reads two resources and
 * re-reads one after a toggle, so an ordered `mockResolvedValueOnce` chain
 * would break on any change to how often the page refetches.
 */
const emptySummary = {
  today: { orders: 0, revenue: 0 },
  last7Days: { orders: 0, revenue: 0 },
  last30Days: { orders: 0, revenue: 0 },
  averageTicket30Days: null,
  toPrepare: 0,
  readyToDeliver: 0,
  topProducts: [],
  lowStock: { threshold: 2, products: [] },
};

const storeSettingsOff = { siteEnabled: false, storeEnabled: false, ticketsEnabled: false, paymentConfigured: false };

function mockApi(handlers: {
  settings?: () => unknown;
  menuItems?: () => unknown;
  patch?: () => unknown;
  storeSettings?: () => unknown;
  patchStore?: () => unknown;
  summary?: () => unknown;
}) {
  return mockAdminApi((path, options) => {
    if (path === '/site-orders/summary') return handlers.summary?.() ?? emptySummary;
    if (path === '/store-settings') {
      if (options?.method === 'PATCH') return handlers.patchStore?.();
      return handlers.storeSettings?.() ?? storeSettingsOff;
    }
    if (options?.method === 'PATCH') return handlers.patch?.();
    if (path === '/menu-items') return handlers.menuItems?.() ?? [];
    return handlers.settings?.() ?? emptySettings;
  });
}

describe('DashboardPage', () => {
  it('shows the warning banner and disables the toggle when there are no active menu items', async () => {
    mockApi({ menuItems: () => [{ id: '1', active: false }] });

    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('switch', { name: 'Atendimento automático do bot' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  // Regressão do PWA: no primeiro acesso, /bot-settings respondia antes de
  // /menu-items e a página já renderizava. Como a lista ainda era null, a
  // contagem caía em 0 e o operador era acusado de não ter item de menu
  // nenhum — a mensagem sumia sozinha quando a lista chegava.
  it('does not accuse the shop of having no menu items while the list is still loading', async () => {
    let releaseMenuItems: (items: unknown) => void = () => {};
    const apiFetch = jest.fn((path: string) => {
      if (path === '/menu-items') {
        return new Promise((resolve) => {
          releaseMenuItems = resolve;
        });
      }
      if (path === '/site-orders/summary') return Promise.resolve(emptySummary);
      return Promise.resolve(emptySettings);
    });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<DashboardPage />);

    // Drena as microtasks pra garantir que /bot-settings já resolveu de fato —
    // sem isso a asserção passaria só porque nada tinha resolvido ainda, que é
    // acidente de timing e não o comportamento em teste.
    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/menu-items'));
    await act(async () => {
      await Promise.resolve();
    });

    // Configurações carregadas, lista pendente: a página espera em vez de
    // concluir que não há item nenhum.
    expect(screen.queryByText(/não há nenhum item de menu ativo/)).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();

    await act(async () => {
      releaseMenuItems([{ id: '1', active: true }]);
    });

    await waitFor(() =>
      expect(screen.getByRole('switch', { name: 'Atendimento automático do bot' })).toBeInTheDocument(),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('reports a failure to load the menu items instead of claiming there are none', async () => {
    const apiFetch = jest.fn((path: string) => {
      if (path === '/menu-items') return Promise.reject(new Error('API fora do ar'));
      if (path === '/site-orders/summary') return Promise.resolve(emptySummary);
      return Promise.resolve(emptySettings);
    });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent('API fora do ar');
    // O texto que acusa ausência de item não pode aparecer: não sabemos.
    expect(screen.queryByText(/não há nenhum item de menu ativo/)).not.toBeInTheDocument();
  });

  it('lets the operator toggle the bot on when at least one menu item is active', async () => {
    const apiFetch = mockApi({
      menuItems: () => [{ id: '1', active: true }],
      patch: () => ({ ...emptySettings, botEnabled: true }),
    });

    render(<DashboardPage />);
    await waitFor(() =>
      expect(screen.getByRole('switch', { name: 'Atendimento automático do bot' })).not.toHaveAttribute(
        'aria-disabled',
        'true',
      ),
    );

    await userEvent.click(screen.getByRole('switch', { name: 'Atendimento automático do bot' }));

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith('/bot-settings', {
        method: 'PATCH',
        body: JSON.stringify({ botEnabled: true }),
      }),
    );
  });

  it('shows the backend error message when the toggle update fails', async () => {
    mockApi({
      menuItems: () => [{ id: '1', active: true }],
      patch: () => {
        throw new Error('Não é possível ligar o bot sem nenhum item de menu ativo.');
      },
    });

    render(<DashboardPage />);
    await waitFor(() =>
      expect(screen.getByRole('switch', { name: 'Atendimento automático do bot' })).not.toHaveAttribute(
        'aria-disabled',
        'true',
      ),
    );
    await userEvent.click(screen.getByRole('switch', { name: 'Atendimento automático do bot' }));

    await waitFor(() =>
      expect(screen.getByText('Não é possível ligar o bot sem nenhum item de menu ativo.')).toBeInTheDocument(),
    );
  });

  it('shows the storage notice once mediaBytesUsed is close to the cap', async () => {
    const GB = 1024 * 1024 * 1024;
    mockApi({
      menuItems: () => [{ id: '1', active: true }],
      settings: () => ({ ...emptySettings, mediaBytesUsed: 7.2 * GB }),
    });

    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText(/Armazenamento de imagens: 7\.2 GB de 8\.0 GB/)).toBeInTheDocument());
  });

  it('does not show the storage notice for a plain settings fixture without mediaBytesUsed', async () => {
    mockApi({ menuItems: () => [{ id: '1', active: true }] });

    render(<DashboardPage />);

    await waitFor(() =>
      expect(screen.getByRole('switch', { name: 'Atendimento automático do bot' })).toBeInTheDocument(),
    );
    expect(screen.queryByText(/Armazenamento de imagens/)).not.toBeInTheDocument();
  });

  it('shows an error and stops loading when the initial data fetch fails', async () => {
    const apiFetch = jest.fn().mockRejectedValue(new Error('Não foi possível carregar os dados do painel.'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<DashboardPage />);

    await waitFor(() => expect(screen.getByText('Não foi possível carregar os dados do painel.')).toBeInTheDocument());
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
  });

  describe('site and store switches', () => {
    it('shows both off, as the site starts, and turns the full site on', async () => {
      const apiFetch = mockApi({
        menuItems: () => [{ id: '1', active: true }],
        patchStore: () => ({ ...storeSettingsOff, siteEnabled: true }),
      });

      render(<DashboardPage />);

      const site = await screen.findByRole('switch', { name: 'Site completo' });
      expect(site).not.toBeChecked();
      expect(screen.getByRole('switch', { name: 'Loja do site' })).not.toBeChecked();
      expect(screen.getByText(/mostra a página "em breve"/)).toBeInTheDocument();

      await userEvent.click(site);

      await waitFor(() =>
        expect(apiFetch).toHaveBeenCalledWith('/store-settings', {
          method: 'PATCH',
          body: JSON.stringify({ siteEnabled: true }),
        }),
      );
    });

    it('refreshes the public site right after a switch changes', async () => {
      mockApi({
        menuItems: () => [{ id: '1', active: true }],
        patchStore: () => ({ ...storeSettingsOff, siteEnabled: true }),
      });

      render(<DashboardPage />);
      await userEvent.click(await screen.findByRole('switch', { name: 'Site completo' }));

      await waitFor(() => expect(refreshPublicSite).toHaveBeenCalled());
    });

    it('turns the store on without the Pagar.me key, warning that checkout will not work yet', async () => {
      mockApi({
        menuItems: () => [{ id: '1', active: true }],
        storeSettings: () => ({ ...storeSettingsOff, storeEnabled: true }),
      });

      render(<DashboardPage />);

      expect(await screen.findByRole('switch', { name: 'Loja do site' })).toBeChecked();
      expect(screen.getByText(/O pagamento ainda não está configurado/)).toBeInTheDocument();
    });

    it('turns ticket sales on with its own switch, independent from the store', async () => {
      const apiFetch = mockApi({
        menuItems: () => [{ id: '1', active: true }],
        patchStore: () => ({ ...storeSettingsOff, ticketsEnabled: true }),
      });

      render(<DashboardPage />);

      const tickets = await screen.findByRole('switch', { name: 'Venda de ingressos' });
      expect(tickets).not.toBeChecked();
      await userEvent.click(tickets);

      await waitFor(() =>
        expect(apiFetch).toHaveBeenCalledWith('/store-settings', {
          method: 'PATCH',
          body: JSON.stringify({ ticketsEnabled: true }),
        }),
      );
      await waitFor(() => expect(refreshPublicSite).toHaveBeenCalled());
    });

    it('warns that paid tickets need the Pagar.me key while free sign-ups still work', async () => {
      mockApi({
        menuItems: () => [{ id: '1', active: true }],
        storeSettings: () => ({ ...storeSettingsOff, ticketsEnabled: true }),
      });

      render(<DashboardPage />);

      expect(await screen.findByRole('switch', { name: 'Venda de ingressos' })).toBeChecked();
      expect(screen.getByText(/ingresso pago não funciona/)).toBeInTheDocument();
    });

    it('keeps the bot switch usable when the store settings fail to load', async () => {
      mockApi({
        menuItems: () => [{ id: '1', active: true }],
        storeSettings: () => {
          throw new Error('Configurações da loja indisponíveis.');
        },
      });

      render(<DashboardPage />);

      expect(await screen.findByText('Configurações da loja indisponíveis.')).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: 'Atendimento automático do bot' })).not.toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });
  });

  describe('sales summary', () => {
    it('shows the sales, what to prepare, the best sellers and the low stock', async () => {
      mockApi({
        menuItems: () => [{ id: '1', active: true }],
        summary: () => ({
          ...emptySummary,
          today: { orders: 2, revenue: 150 },
          averageTicket30Days: 75,
          toPrepare: 3,
          topProducts: [{ name: 'Vaso M', quantity: 7 }],
          lowStock: { threshold: 2, products: [{ id: 'p1', name: 'Vaso P', stock: 0 }] },
        }),
      });

      render(<DashboardPage />);

      expect(await screen.findByText('R$ 150,00')).toBeInTheDocument();
      expect(screen.getByText('2 pedidos')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /3 a preparar/ })).toHaveAttribute('href', '/admin/pedidos');
      expect(screen.getByRole('list', { name: 'Mais vendidos' })).toHaveTextContent('Vaso M7 unidades');
      expect(screen.getByRole('list', { name: 'Estoque baixo' })).toHaveTextContent('Vaso PEsgotado');
    });
  });

  describe('WhatsApp module', () => {
    it('turns the module off, hiding the bot switch, and tells the menu to update', async () => {
      const listener = jest.fn();
      window.addEventListener('daverdinha:bot-settings-changed', listener);
      let moduleOn = true;
      const apiFetch = mockApi({
        menuItems: () => [{ id: '1', active: true }],
        settings: () => ({ ...emptySettings, whatsappModuleEnabled: moduleOn }),
        patch: () => {
          moduleOn = false;
          return { ...emptySettings, whatsappModuleEnabled: false };
        },
      });

      render(<DashboardPage />);
      await userEvent.click(await screen.findByRole('switch', { name: 'WhatsApp bot' }));

      expect(apiFetch).toHaveBeenCalledWith('/bot-settings', {
        method: 'PATCH',
        body: JSON.stringify({ whatsappModuleEnabled: false }),
      });
      await waitFor(() =>
        expect(screen.queryByRole('switch', { name: 'Atendimento automático do bot' })).not.toBeInTheDocument(),
      );
      expect(listener).toHaveBeenCalled();
      window.removeEventListener('daverdinha:bot-settings-changed', listener);
    });
  });

  describe('store pause', () => {
    it('pauses the store from the Dashboard and says when it reopens', async () => {
      let paused = false;
      const apiFetch = mockApi({
        menuItems: () => [{ id: '1', active: true }],
        storeSettings: () => ({
          ...storeSettingsOff,
          storeEnabled: true,
          storePaused: paused,
          activePause: paused ? { message: null, until: '2027-01-06T03:00:00.000Z' } : null,
        }),
        patchStore: () => {
          paused = true;
          return {};
        },
      });

      render(<DashboardPage />);
      await userEvent.click(await screen.findByRole('switch', { name: 'Loja em pausa' }));

      expect(apiFetch).toHaveBeenCalledWith('/store-settings', {
        method: 'PATCH',
        body: JSON.stringify({ storePaused: true }),
      });
      expect(await screen.findByText(/Reabre sozinha em 6 de jan/)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Editar o aviso e a data de volta da pausa' })).toHaveAttribute(
        'href',
        '/admin/loja',
      );
    });
  });
});
