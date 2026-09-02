import { render, screen } from '@testing-library/react';
import AdminLayout from './layout';

jest.mock('@clerk/nextjs', () => ({ UserButton: () => <div data-testid="user-button" /> }));

const mockUsePathname = jest.fn();
jest.mock('next/navigation', () => ({ usePathname: () => mockUsePathname() }));

describe('AdminLayout', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/admin');
  });

  it('renders links to every admin section', () => {
    render(
      <AdminLayout>
        <p>conteúdo</p>
      </AdminLayout>,
    );
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/admin');
    expect(screen.getByRole('link', { name: 'Mensagens' })).toHaveAttribute('href', '/admin/mensagens');
    expect(screen.getByRole('link', { name: 'Menu' })).toHaveAttribute('href', '/admin/menu');
    expect(screen.getByRole('link', { name: 'Entregas' })).toHaveAttribute('href', '/admin/entregas');
    expect(screen.getByRole('link', { name: 'Destaques' })).toHaveAttribute('href', '/admin/destaques');
    expect(screen.getByRole('link', { name: 'Conversas' })).toHaveAttribute('href', '/admin/conversas');
  });

  it('renders the page content passed as children', () => {
    render(
      <AdminLayout>
        <p>conteúdo</p>
      </AdminLayout>,
    );
    expect(screen.getByText('conteúdo')).toBeInTheDocument();
  });

  it('marks the current route as the active nav link', () => {
    mockUsePathname.mockReturnValue('/admin/conversas/abc-123');
    render(
      <AdminLayout>
        <p>conteúdo</p>
      </AdminLayout>,
    );
    expect(screen.getByRole('link', { name: 'Conversas' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
  });
});
