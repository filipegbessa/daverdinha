import { render, screen } from '@testing-library/react';
import EntregasPage from './page';
import { mockApi } from '@/features/admin/test-fixtures/mock-api';

jest.mock('@/features/admin/lib/api-client');

const locations = [
  { id: 'l1', zone: 'Zona Sul', regionName: 'Ipanema', areaId: 'a1' },
  { id: 'l2', zone: 'Zona Sul', regionName: 'Copacabana', areaId: null },
];
const zoneAreas = [
  {
    zone: 'Zona Sul',
    areas: [{ id: 'a1', zone: 'Zona Sul', name: 'Perto', fee: 15, locations: [{ id: 'l1', regionName: 'Ipanema' }] }],
    unassigned: [{ id: 'l2', regionName: 'Copacabana' }],
  },
];

describe('EntregasPage', () => {
  it('shows a loading state before the data arrives', () => {
    mockApi(() => new Promise(() => {}));
    render(<EntregasPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows the delivery areas by zone, and no "Bairros atendidos" list anymore', async () => {
    mockApi((path) => (path === '/delivery-areas' ? zoneAreas : locations));

    render(<EntregasPage />);

    expect(await screen.findByRole('heading', { name: 'Entregas' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Ver os bairros de Perto' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Bairros atendidos' })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('shows an inline error when loading the bairros fails', async () => {
    mockApi((path) => (path === '/delivery-areas' ? zoneAreas : Promise.reject(new Error('API fora do ar'))));

    render(<EntregasPage />);

    expect(await screen.findByText('API fora do ar')).toBeInTheDocument();
  });
});
