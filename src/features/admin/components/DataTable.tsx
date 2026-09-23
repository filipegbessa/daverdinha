'use client';
import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number | null | undefined;
  defaultSortDirection?: 'asc' | 'desc';
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Overrides the mobile card for a row; defaults to stacking every column's label and cell. */
  renderMobileCard?: (row: T) => React.ReactNode;
}

type SortState = { key: string; direction: 'asc' | 'desc' } | null;

function compareValues(a: string | number | null | undefined, b: string | number | null | undefined): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'pt-BR');
}

export function DataTable<T>({ columns, rows, rowKey, renderMobileCard }: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>(null);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((c) => c.key === sort.key);
    if (!column?.sortValue) return rows;
    const { sortValue } = column;
    const direction = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = sortValue(a);
      const vb = sortValue(b);
      // Nulls always sort last, independent of direction — flipping the
      // direction should reorder what's comparable, not relocate the gaps.
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return compareValues(va, vb) * direction;
    });
  }, [rows, sort, columns]);

  function handleSortClick(column: DataTableColumn<T>) {
    setSort((current) => {
      if (current?.key === column.key) {
        return { key: column.key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key: column.key, direction: column.defaultSortDirection ?? 'asc' };
    });
  }

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) =>
                column.sortable ? (
                  <TableHead
                    key={column.key}
                    aria-sort={
                      sort?.key === column.key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'
                    }
                  >
                    <button type="button" onClick={() => handleSortClick(column)}>
                      {column.header}
                      {sort?.key === column.key && (
                        <span aria-hidden="true"> {sort.direction === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </button>
                  </TableHead>
                ) : (
                  <TableHead key={column.key}>{column.header}</TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRows.map((row) => (
              <TableRow key={rowKey(row)}>
                {columns.map((column) => (
                  <TableCell key={column.key}>{column.cell(row)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="space-y-2 md:hidden">
        {sortedRows.map((row) =>
          renderMobileCard ? (
            <li key={rowKey(row)}>{renderMobileCard(row)}</li>
          ) : (
            <li key={rowKey(row)} data-testid="data-table-mobile-card" className="rounded-md border border-sand-line p-3">
              {columns.map((column) => (
                <div key={column.key} className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="text-ink-soft">{column.header}</span>
                  <span>{column.cell(row)}</span>
                </div>
              ))}
            </li>
          ),
        )}
      </ul>
    </>
  );
}
