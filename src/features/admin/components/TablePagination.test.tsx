import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TablePagination } from './TablePagination';

describe('TablePagination', () => {
  it('shows the position and the total', () => {
    render(<TablePagination page={2} totalPages={7} total={137} itemLabel="conversas" onPageChange={jest.fn()} />);

    expect(screen.getByText('Página 2 de 7')).toBeInTheDocument();
    expect(screen.getByText('137 conversas')).toBeInTheDocument();
  });

  it('renders nothing when it all fits on one page', () => {
    const { container } = render(
      <TablePagination page={1} totalPages={1} total={4} itemLabel="categorias" onPageChange={jest.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('moves one page at a time', async () => {
    const onPageChange = jest.fn();
    render(<TablePagination page={3} totalPages={7} total={137} itemLabel="conversas" onPageChange={onPageChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Próxima página' }));
    expect(onPageChange).toHaveBeenCalledWith(4);

    await userEvent.click(screen.getByRole('button', { name: 'Página anterior' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('locks the back arrow on the first page', () => {
    render(<TablePagination page={1} totalPages={7} total={137} itemLabel="conversas" onPageChange={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Próxima página' })).not.toBeDisabled();
  });

  it('locks the forward arrow on the last page', () => {
    render(<TablePagination page={7} totalPages={7} total={137} itemLabel="conversas" onPageChange={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Página anterior' })).not.toBeDisabled();
  });

  it('announces the page change to assistive tech', () => {
    render(<TablePagination page={2} totalPages={7} total={137} itemLabel="conversas" onPageChange={jest.fn()} />);

    expect(screen.getByText('Página 2 de 7')).toHaveAttribute('aria-live', 'polite');
  });
});
