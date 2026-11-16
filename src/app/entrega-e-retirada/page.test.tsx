import { render, screen } from '@testing-library/react';
import EntregaERetiradaPage, { generateMetadata } from './page';
import { getCoveredDeliveryZones } from '@/features/site/lib/delivery-zones';
import { getPickupInfo } from '@/features/site/lib/pickup-info';

jest.mock('@/features/site/lib/delivery-zones', () => ({ getCoveredDeliveryZones: jest.fn() }));
jest.mock('@/features/site/lib/pickup-info', () => ({ getPickupInfo: jest.fn() }));

const zones = getCoveredDeliveryZones as jest.Mock;
const pickup = getPickupInfo as jest.Mock;

describe('EntregaERetiradaPage', () => {
  beforeEach(() => {
    zones.mockResolvedValue([{ zone: 'Zona Sul', bairros: ['Catete', 'Flamengo'] }]);
    pickup.mockResolvedValue({
      address: 'R. Capiberibe, 32',
      hours: 'Seg a sex, 10h às 18h',
      instructions: 'Toque a campainha',
    });
  });

  it('lists the covered bairros and the pickup set in the admin', async () => {
    render(await EntregaERetiradaPage());

    expect(screen.getByRole('heading', { level: 1, name: 'Entrega e retirada' })).toBeInTheDocument();
    expect(screen.getByText('Catete, Flamengo')).toBeInTheDocument();
    expect(screen.getByText('R. Capiberibe, 32')).toBeInTheDocument();
    expect(screen.getByText(/Seg a sex, 10h às 18h/)).toBeInTheDocument();
    expect(screen.getByText('Toque a campainha')).toBeInTheDocument();
  });

  it('points to WhatsApp without coverage and says delivery only without pickup', async () => {
    zones.mockResolvedValue([]);
    pickup.mockResolvedValue(null);

    render(await EntregaERetiradaPage());

    expect(screen.getByRole('link', { name: 'fale com a gente pelo WhatsApp' })).toBeInTheDocument();
    expect(screen.getByText('No momento, os pedidos do site são só com entrega.')).toBeInTheDocument();
  });

  it('has its own canonical', async () => {
    const metadata = await generateMetadata();
    expect(metadata.alternates).toEqual({ canonical: '/entrega-e-retirada' });
  });
});
