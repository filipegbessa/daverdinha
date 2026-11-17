import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PromocoesPage from './page';
import { mockApi, paginated } from '@/features/admin/test-fixtures/mock-api';
import type { CouponAdmin } from '@/features/admin/types/admin';

jest.mock('@/features/admin/lib/api-client');

const coupon: CouponAdmin = {
  id: 'c1',
  code: 'BEMVINDA10',
  description: 'Instagram',
  type: 'percent',
  value: 10,
  maxDiscount: null,
  scope: 'order',
  minSubtotal: null,
  startsAt: null,
  endsAt: null,
  maxUses: 50,
  active: true,
  categoryIds: [],
  productIds: [],
  eventIds: [],
  uses: 3,
  reserved: 1,
  createdAt: '2026-11-17T12:00:00.000Z',
};

describe('/admin/promocoes', () => {
  it('lists the coupons with what they give, where they apply and how many were used', async () => {
    mockApi(() => paginated([coupon]));

    render(<PromocoesPage />);

    const item = (await screen.findByText('BEMVINDA10')).closest('li')!;
    expect(within(item).getByText('Ativo')).toBeInTheDocument();
    expect(item).toHaveTextContent(
      '10% de desconto · em todo o pedido de produtos · 3 de 50 usos (+1 em pedido pendente) · Instagram',
    );
  });

  it('warns that a used coupon is deactivated, not deleted', async () => {
    const apiFetch = mockApi((path, init) => (init?.method === 'DELETE' ? { deleted: false } : paginated([coupon])));

    render(<PromocoesPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir' }));
    expect(screen.getByText(/ele é desativado/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Excluir cupom' }));

    expect(apiFetch).toHaveBeenCalledWith('/coupons/c1', { method: 'DELETE' });
  });

  it('creates a coupon for some categories, with a sentence preview', async () => {
    const apiFetch = mockApi((path, init) => {
      if (init?.method === 'POST') return coupon;
      if (path === '/product-categories')
        return [{ id: 'cat1', name: 'Vasos', slug: 'vasos', description: '', active: true, order: 0 }];
      return paginated([]);
    });

    render(<PromocoesPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Novo cupom' }));
    const dialog = screen.getByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('Código'), 'vasos15');
    await userEvent.type(within(dialog).getByLabelText('Porcentagem (%)'), '15');
    await userEvent.selectOptions(within(dialog).getByLabelText('Onde o cupom vale'), 'categories');
    await userEvent.click(await within(dialog).findByRole('checkbox', { name: 'Vasos' }));
    await userEvent.type(within(dialog).getByLabelText('Pedido mínimo (opcional)'), '10000');

    expect(within(dialog).getByRole('status')).toHaveTextContent(
      'VASOS15: 15% de desconto, nos produtos da categoria Vasos, acima de R$ 100,00. Não soma com produto em promoção.',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    const body = JSON.parse(String(apiFetch.mock.calls.find(([, init]) => init?.method === 'POST')?.[1]?.body));
    expect(body).toMatchObject({
      code: 'VASOS15',
      type: 'percent',
      value: 15,
      scope: 'categories',
      categoryIds: ['cat1'],
      minSubtotal: 100,
      active: true,
    });
  });

  it('creates an automatic free shipping for some delivery areas', async () => {
    const apiFetch = mockApi((path, init) => {
      if (init?.method === 'POST') return {};
      if (path === '/shipping-promotions') return [];
      if (path === '/delivery-areas')
        return [
          {
            zone: 'Zona Sul',
            areas: [{ id: 'a1', zone: 'Zona Sul', name: 'Perto', fee: 15, locations: [] }],
            unassigned: [],
          },
        ];
      return paginated([]);
    });
    render(<PromocoesPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Automáticas' }));
    expect(await screen.findByText('Nenhuma promoção automática ainda.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Novo frete grátis' }));
    const dialog = screen.getByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('Frete grátis a partir de'), '20000');
    await userEvent.click(await within(dialog).findByRole('checkbox', { name: /Perto/ }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    const body = JSON.parse(String(apiFetch.mock.calls.find(([, i]) => i?.method === 'POST')?.[1]?.body));
    expect(body).toMatchObject({ minSubtotal: 200, areaIds: ['a1'], active: true });
  });

  it('lists the automatic promotions with their areas', async () => {
    mockApi((path) => {
      if (path === '/shipping-promotions')
        return [
          {
            id: 'sp1',
            name: null,
            minSubtotal: 250,
            areaIds: [],
            startsAt: null,
            endsAt: null,
            active: true,
            createdAt: '',
          },
        ];
      if (path === '/delivery-areas') return [];
      return paginated([]);
    });
    render(<PromocoesPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Automáticas' }));
    expect(await screen.findByText(/Frete grátis acima de R\$ 250,00/)).toBeInTheDocument();
    expect(screen.getByText('Todas as áreas de entrega')).toBeInTheDocument();
  });
});
