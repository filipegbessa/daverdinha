import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeliveryAreasSection } from './DeliveryAreasSection';
import { useApiClient } from '@/features/admin/lib/api-client';
import type { DeliveryAreaAdmin, DeliveryLocation } from '@/features/admin/types/admin';

jest.mock('@/features/admin/lib/api-client');

const locations: DeliveryLocation[] = [
  { id: 'l1', zone: 'Zona Sul', regionName: 'Catete', covered: true, areaId: 'a1' },
  { id: 'l2', zone: 'Zona Sul', regionName: 'Flamengo', covered: true, areaId: null },
  { id: 'l3', zone: 'Zona Sul', regionName: 'Gávea', covered: false, areaId: 'a2' },
  { id: 'l4', zone: 'Centro', regionName: 'Gamboa', covered: true, areaId: null },
];

const areas: DeliveryAreaAdmin[] = [
  {
    id: 'a1',
    zone: 'Zona Sul',
    name: 'Perto',
    fee: 15,
    locations: [{ id: 'l1', regionName: 'Catete', covered: true }],
  },
  {
    id: 'a2',
    zone: 'Zona Sul',
    name: 'Longe',
    fee: 30,
    locations: [{ id: 'l3', regionName: 'Gávea', covered: false }],
  },
];

function setup() {
  const apiFetch = jest.fn(async (path: string, init?: RequestInit) => {
    if (init?.method === 'POST') return { id: 'new', ...JSON.parse(String(init.body)), locations: [] };
    if (init?.method === 'PATCH') return { ...areas[0], ...JSON.parse(String(init.body)) };
    return undefined;
  });
  (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
  const onChanged = jest.fn();
  render(<DeliveryAreasSection areas={areas} locations={locations} busy={false} onChanged={onChanged} />);
  return { apiFetch, onChanged };
}

describe('DeliveryAreasSection', () => {
  it('lists each zone with its areas, fee and bairro count', () => {
    setup();

    expect(screen.getByText('Perto')).toBeInTheDocument();
    expect(screen.getByText(/R\$ 15,00 · 1 bairro$/)).toBeInTheDocument();
    expect(screen.getByText('Nenhuma área nesta zona ainda.')).toBeInTheDocument();
  });

  it('warns about covered bairros that have no area, since the site will not deliver there', () => {
    setup();

    expect(screen.getByText(/Sem entrega pelo site até entrarem numa área: Flamengo\./)).toBeInTheDocument();
    expect(screen.getByText(/Sem entrega pelo site até entrarem numa área: Gamboa\./)).toBeInTheDocument();
  });

  it('creates an area in the zone, then saves its bairros', async () => {
    const { apiFetch, onChanged } = setup();

    await userEvent.click(screen.getByRole('button', { name: 'Nova área em Zona Sul' }));
    const dialog = screen.getByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('Nome'), 'Meio');
    await userEvent.type(within(dialog).getByLabelText('Valor da entrega'), '2250');
    await userEvent.click(within(dialog).getByRole('checkbox', { name: /Flamengo/ }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    expect(apiFetch).toHaveBeenNthCalledWith(1, '/delivery-areas', {
      method: 'POST',
      body: JSON.stringify({ zone: 'Zona Sul', name: 'Meio', fee: 22.5 }),
    });
    expect(apiFetch).toHaveBeenNthCalledWith(2, '/delivery-areas/new/locations', {
      method: 'PUT',
      body: JSON.stringify({ locationIds: ['l2'] }),
    });
    expect(onChanged).toHaveBeenCalled();
  });

  it('edits an area, showing where a bairro would move from and which are not covered', async () => {
    const { apiFetch } = setup();

    await userEvent.click(screen.getAllByRole('button', { name: 'Editar' })[0]);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByLabelText('Valor da entrega')).toHaveValue('R$ 15,00');
    expect(within(dialog).getByRole('checkbox', { name: /Catete/ })).toBeChecked();
    expect(within(dialog).getByText('(não atendido, hoje em Longe)')).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('checkbox', { name: /Gávea/ }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    expect(apiFetch).toHaveBeenNthCalledWith(1, '/delivery-areas/a1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Perto', fee: 15 }),
    });
    expect(apiFetch).toHaveBeenNthCalledWith(2, '/delivery-areas/a1/locations', {
      method: 'PUT',
      body: JSON.stringify({ locationIds: ['l1', 'l3'] }),
    });
  });

  it('filters the bairro list by name, ignoring accents', async () => {
    setup();

    await userEvent.click(screen.getAllByRole('button', { name: 'Editar' })[0]);
    const dialog = screen.getByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('Buscar bairro'), 'gavea');

    expect(within(dialog).getByRole('checkbox', { name: /Gávea/ })).toBeInTheDocument();
    expect(within(dialog).queryByRole('checkbox', { name: /Catete/ })).not.toBeInTheDocument();
  });

  it('deletes after confirmation', async () => {
    const { apiFetch, onChanged } = setup();

    await userEvent.click(screen.getAllByRole('button', { name: 'Excluir' })[1]);
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));

    expect(apiFetch).toHaveBeenCalledWith('/delivery-areas/a2', { method: 'DELETE' });
    expect(onChanged).toHaveBeenCalled();
  });

  it('keeps the dialog open with the API error when the name is taken', async () => {
    const apiFetch = jest.fn().mockRejectedValue(new Error('Já existe uma área com esse nome nessa zona.'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
    const onChanged = jest.fn();
    render(<DeliveryAreasSection areas={areas} locations={locations} busy={false} onChanged={onChanged} />);

    await userEvent.click(screen.getAllByRole('button', { name: 'Editar' })[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Já existe uma área com esse nome nessa zona.')).toBeInTheDocument();
    expect(onChanged).not.toHaveBeenCalled();
  });
});
