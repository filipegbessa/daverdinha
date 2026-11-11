import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { countActiveFilters, FilterBar } from './FilterBar';

const DEFAULTS = { q: '', status: 'all' };

/** Uma página mínima: guarda os filtros e mostra o que está aplicado. */
function Harness({ onChange }: { onChange?: (values: typeof DEFAULTS) => void }) {
  const [filters, setFilters] = useState(DEFAULTS);
  return (
    <>
      <FilterBar
        values={filters}
        defaults={DEFAULTS}
        onChange={(values) => {
          setFilters(values);
          onChange?.(values);
        }}
      >
        {(values, set, layout) => (
          <>
            <Input value={values.q} onChange={(e) => set({ q: e.target.value })} aria-label="Buscar" />
            <NativeSelect
              value={values.status}
              onChange={(e) => set({ status: e.target.value })}
              aria-label="Filtrar por status"
            >
              <option value="all">Todos</option>
              <option value="open">Abertos</option>
            </NativeSelect>
            <span data-testid={`layout-${layout}`} />
          </>
        )}
      </FilterBar>
      <output data-testid="applied">{JSON.stringify(filters)}</output>
    </>
  );
}

const applied = () => JSON.parse(screen.getByTestId('applied').textContent ?? '{}');
const openSheet = () => userEvent.click(screen.getByRole('button', { name: /^Filtros/ }));
const sheet = () => screen.getByRole('dialog', { name: 'Filtros' });

describe('countActiveFilters', () => {
  it('counts values that differ from the defaults, treating a blank search as empty', () => {
    expect(countActiveFilters({ q: '  ', status: 'all' }, DEFAULTS)).toBe(0);
    expect(countActiveFilters({ q: 'maria', status: 'open' }, DEFAULTS)).toBe(2);
  });
});

describe('FilterBar', () => {
  describe('desktop (inline)', () => {
    it('renders the controls once, in a search landmark, and applies each change at once', async () => {
      const onChange = jest.fn();
      render(<Harness onChange={onChange} />);

      expect(screen.getByRole('search')).toHaveClass('hidden', 'md:flex');
      expect(screen.getAllByLabelText('Buscar')).toHaveLength(1);
      expect(screen.getByTestId('layout-inline')).toBeInTheDocument();

      await userEvent.selectOptions(screen.getByLabelText('Filtrar por status'), 'open');
      expect(applied()).toEqual({ q: '', status: 'open' });
    });
  });

  describe('mobile (sheet)', () => {
    it('has a CSS-hidden-on-desktop trigger and no sheet controls until it opens', () => {
      render(<Harness />);

      expect(screen.getByRole('button', { name: 'Filtros' }).parentElement).toHaveClass('md:hidden');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByTestId('layout-sheet')).not.toBeInTheDocument();
    });

    it('opens a "Filtros" sheet with the applied values, and keeps edits as a draft until Aplicar', async () => {
      render(<Harness />);
      await openSheet();

      expect(within(sheet()).getByTestId('layout-sheet')).toBeInTheDocument();
      await userEvent.type(within(sheet()).getByLabelText('Buscar'), 'maria');
      await userEvent.selectOptions(within(sheet()).getByLabelText('Filtrar por status'), 'open');
      expect(applied()).toEqual(DEFAULTS);

      await userEvent.click(within(sheet()).getByRole('button', { name: 'Aplicar' }));

      expect(applied()).toEqual({ q: 'maria', status: 'open' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('applies the draft when Enter is pressed in the search box', async () => {
      render(<Harness />);
      await openSheet();

      await userEvent.type(within(sheet()).getByLabelText('Buscar'), 'maria{Enter}');

      expect(applied()).toEqual({ q: 'maria', status: 'all' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('discards the draft when closed with the X', async () => {
      render(<Harness />);
      await openSheet();
      await userEvent.type(within(sheet()).getByLabelText('Buscar'), 'maria');

      await userEvent.click(within(sheet()).getByRole('button', { name: 'Fechar filtros' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(applied()).toEqual(DEFAULTS);
      await openSheet();
      expect(within(sheet()).getByLabelText('Buscar')).toHaveValue('');
    });

    it('discards the draft on Esc', async () => {
      render(<Harness />);
      await openSheet();
      await userEvent.selectOptions(within(sheet()).getByLabelText('Filtrar por status'), 'open');

      await userEvent.keyboard('{Escape}');

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(applied()).toEqual(DEFAULTS);
    });

    it('shows the active count on the trigger after Aplicar, and clears it after Redefinir', async () => {
      render(<Harness />);
      expect(screen.queryByTestId('filter-count')).not.toBeInTheDocument();

      await openSheet();
      await userEvent.type(within(sheet()).getByLabelText('Buscar'), 'maria');
      await userEvent.selectOptions(within(sheet()).getByLabelText('Filtrar por status'), 'open');
      await userEvent.click(within(sheet()).getByRole('button', { name: 'Aplicar' }));

      expect(screen.getByTestId('filter-count')).toHaveTextContent('2');
      expect(screen.getByRole('button', { name: 'Filtros (2 ativos)' })).toBeInTheDocument();

      await openSheet();
      await userEvent.click(within(sheet()).getByRole('button', { name: 'Redefinir' }));

      expect(applied()).toEqual(DEFAULTS);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByTestId('filter-count')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Filtros' })).toBeInTheDocument();
    });

    it('says "1 ativo" in the singular', async () => {
      render(<Harness />);
      await openSheet();
      await userEvent.selectOptions(within(sheet()).getByLabelText('Filtrar por status'), 'open');
      await userEvent.click(within(sheet()).getByRole('button', { name: 'Aplicar' }));

      expect(screen.getByRole('button', { name: 'Filtros (1 ativo)' })).toBeInTheDocument();
    });
  });
});
