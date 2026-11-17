import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeliveryAreaLocationsDialog } from './DeliveryAreaLocationsDialog';
import type { DeliveryAreaAdmin } from '@/features/admin/types/admin';

const names = [
  'Urca',
  'Botafogo',
  'Catete',
  'Flamengo',
  'Glória',
  'Laranjeiras',
  'Cosme Velho',
  'Humaitá',
  'Leme',
  'Lagoa',
  'Gávea',
];

function area(overrides: Partial<DeliveryAreaAdmin> = {}): DeliveryAreaAdmin {
  return {
    id: 'a1',
    zone: 'Zona Sul',
    name: 'Perto',
    fee: 15,
    locations: names.map((regionName, i) => ({ id: `l${i}`, regionName })),
    ...overrides,
  };
}

const items = () =>
  within(screen.getByRole('list', { name: 'Bairros de Perto' }))
    .getAllByRole('listitem')
    .map((li) => li.textContent);

describe('DeliveryAreaLocationsDialog', () => {
  it('lists the bairros in alphabetical order, with search on long lists', async () => {
    render(<DeliveryAreaLocationsDialog area={area()} onClose={jest.fn()} onEdit={jest.fn()} />);

    expect(items()[0]).toBe('Botafogo');
    expect(items()).toHaveLength(11);

    await userEvent.type(screen.getByRole('textbox', { name: 'Buscar bairro' }), 'gavea');
    expect(items()).toEqual(['Gávea']);
  });

  it('has no search on short lists and says when the delivery is free', () => {
    render(
      <DeliveryAreaLocationsDialog
        area={area({ fee: 0, locations: [{ id: 'l1', regionName: 'Catete' }] })}
        onClose={jest.fn()}
        onEdit={jest.fn()}
      />,
    );

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText('Zona Sul · Entrega grátis · 1 bairro')).toBeInTheDocument();
  });

  it('says when the area has no bairro yet', () => {
    render(<DeliveryAreaLocationsDialog area={area({ locations: [] })} onClose={jest.fn()} onEdit={jest.fn()} />);
    expect(screen.getByText('Nenhum bairro nesta área ainda.')).toBeInTheDocument();
  });

  it('closes and goes to editing', async () => {
    const onClose = jest.fn();
    const onEdit = jest.fn();
    render(<DeliveryAreaLocationsDialog area={area()} onClose={onClose} onEdit={onEdit} />);

    await userEvent.click(screen.getByRole('button', { name: 'Editar área' }));
    expect(onEdit).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onClose).toHaveBeenCalled();
  });
});
