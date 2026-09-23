import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable, type DataTableColumn } from './DataTable';

interface Row {
  id: string;
  name: string;
  age: number;
}

const rows: Row[] = [
  { id: '1', name: 'Bruno', age: 40 },
  { id: '2', name: 'Ana', age: 25 },
  { id: '3', name: 'Carla', age: 30 },
];

const columns: DataTableColumn<Row>[] = [
  { key: 'name', header: 'Nome', cell: (row) => row.name, sortable: true, sortValue: (row) => row.name },
  { key: 'age', header: 'Idade', cell: (row) => String(row.age), sortable: true, sortValue: (row) => row.age },
  { key: 'id', header: 'ID', cell: (row) => row.id },
];

describe('DataTable', () => {
  it('renders every column header and one row per item, in the given order', () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);

    expect(screen.getByRole('columnheader', { name: 'Nome' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Idade' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'ID' })).toBeInTheDocument();

    const dataRows = screen.getAllByRole('row').slice(1); // drop the header row
    expect(dataRows).toHaveLength(3);
    expect(within(dataRows[0]).getByText('Bruno')).toBeInTheDocument();
    expect(within(dataRows[1]).getByText('Ana')).toBeInTheDocument();
    expect(within(dataRows[2]).getByText('Carla')).toBeInTheDocument();
  });

  it('makes a sortable header a clickable button, and leaves a non-sortable header as plain text', () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);

    expect(screen.getByRole('button', { name: 'Nome' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Idade' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'ID' })).not.toBeInTheDocument();
  });

  function rowOrder() {
    return screen.getAllByRole('row').slice(1).map((row) => within(row).getAllByRole('cell')[0].textContent);
  }

  it('sorts ascending on the first click, and flips to descending on a second click of the same header', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);

    await user.click(screen.getByRole('button', { name: 'Nome' }));
    expect(rowOrder()).toEqual(['Ana', 'Bruno', 'Carla']);

    await user.click(screen.getByRole('button', { name: 'Nome' }));
    expect(rowOrder()).toEqual(['Carla', 'Bruno', 'Ana']);
  });

  it('switches to the clicked column and resets direction when a different sortable header is clicked', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);

    await user.click(screen.getByRole('button', { name: 'Nome' }));
    await user.click(screen.getByRole('button', { name: 'Nome' })); // now descending by name
    await user.click(screen.getByRole('button', { name: 'Idade' }));

    expect(rowOrder()).toEqual(['Ana', 'Carla', 'Bruno']); // ascending by age: 25, 30, 40
  });

  it('sorts rows whose sortValue is null or undefined to the end, regardless of direction', async () => {
    const user = userEvent.setup();
    const rowsWithGap: Row[] = [
      { id: '1', name: 'Bruno', age: 40 },
      { id: '2', name: '', age: NaN }, // placeholder, overridden below
      { id: '3', name: 'Ana', age: 25 },
    ];
    const columnsWithNullable: DataTableColumn<Row>[] = [
      {
        key: 'name',
        header: 'Nome',
        cell: (row) => row.name || '(sem nome)',
        sortable: true,
        sortValue: (row) => (row.id === '2' ? null : row.name),
      },
    ];

    render(<DataTable columns={columnsWithNullable} rows={rowsWithGap} rowKey={(row) => row.id} />);

    await user.click(screen.getByRole('button', { name: 'Nome' }));
    expect(rowOrder()).toEqual(['Ana', 'Bruno', '(sem nome)']);

    await user.click(screen.getByRole('button', { name: 'Nome' }));
    expect(rowOrder()).toEqual(['Bruno', 'Ana', '(sem nome)']);
  });

  it('marks the active sorted column with aria-sort, and every other sortable column as "none"', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);

    expect(screen.getByRole('columnheader', { name: 'Nome' })).toHaveAttribute('aria-sort', 'none');
    expect(screen.getByRole('columnheader', { name: 'Idade' })).toHaveAttribute('aria-sort', 'none');

    await user.click(screen.getByRole('button', { name: 'Nome' }));
    expect(screen.getByRole('columnheader', { name: 'Nome' })).toHaveAttribute('aria-sort', 'ascending');
    expect(screen.getByRole('columnheader', { name: 'Idade' })).toHaveAttribute('aria-sort', 'none');

    await user.click(screen.getByRole('button', { name: 'Nome' }));
    expect(screen.getByRole('columnheader', { name: 'Nome' })).toHaveAttribute('aria-sort', 'descending');
  });

  it('starts a column at its configured defaultSortDirection on first click, instead of always ascending', async () => {
    const user = userEvent.setup();
    const columnsWithDefault: DataTableColumn<Row>[] = [
      { key: 'name', header: 'Nome', cell: (row) => row.name, sortable: true, sortValue: (row) => row.name, defaultSortDirection: 'desc' },
    ];
    render(<DataTable columns={columnsWithDefault} rows={rows} rowKey={(row) => row.id} />);

    await user.click(screen.getByRole('button', { name: 'Nome' }));

    expect(screen.getByRole('columnheader', { name: 'Nome' })).toHaveAttribute('aria-sort', 'descending');
    expect(rowOrder()).toEqual(['Carla', 'Bruno', 'Ana']);
  });

  describe('mobile card layout', () => {
    it('renders one card per row, stacking each column label and value, alongside the (CSS-hidden) desktop table', () => {
      render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);

      const table = screen.getByRole('table');
      expect(table.closest('[data-slot="table-container"]')?.parentElement).toHaveClass('hidden', 'md:block');

      const cards = screen.getAllByTestId('data-table-mobile-card');
      expect(cards).toHaveLength(3);
      expect(within(cards[0]).getByText('Nome')).toBeInTheDocument();
      expect(within(cards[0]).getByText('Bruno')).toBeInTheDocument();
      expect(within(cards[0]).getByText('Idade')).toBeInTheDocument();
      expect(within(cards[0]).getByText('40')).toBeInTheDocument();
      expect(cards[0].parentElement).toHaveClass('md:hidden');
    });

    it('uses a custom renderMobileCard when one is provided, instead of auto-stacking columns', () => {
      render(
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          renderMobileCard={(row) => <p data-testid="custom-card">{row.name} ({row.age})</p>}
        />,
      );

      expect(screen.queryAllByTestId('data-table-mobile-card')).toHaveLength(0);
      const customCards = screen.getAllByTestId('custom-card');
      expect(customCards).toHaveLength(3);
      expect(customCards[0]).toHaveTextContent('Bruno (40)');
    });

    it('reflects the active sort in the mobile cards too, since they share the same sorted rows', async () => {
      const user = userEvent.setup();
      render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);

      await user.click(screen.getByRole('button', { name: 'Nome' }));

      const cards = screen.getAllByTestId('data-table-mobile-card');
      expect(within(cards[0]).getByText('Ana')).toBeInTheDocument();
    });
  });
});
