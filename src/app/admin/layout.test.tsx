import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('starts with the mobile menu closed', () => {
    render(
      <AdminLayout>
        <p>conteúdo</p>
      </AdminLayout>,
    );
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the mobile menu when the hamburger button is clicked', async () => {
    render(
      <AdminLayout>
        <p>conteúdo</p>
      </AdminLayout>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));

    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toBeInTheDocument();
  });

  it('closes the mobile menu via the close button', async () => {
    render(
      <AdminLayout>
        <p>conteúdo</p>
      </AdminLayout>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    await userEvent.click(screen.getByRole('button', { name: 'Fechar menu' }));

    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the mobile menu after clicking a nav link', async () => {
    // jsdom logs a harmless "navigation not implemented" error when a real
    // next/link anchor is clicked outside a full router context.
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <AdminLayout>
        <p>conteúdo</p>
      </AdminLayout>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    await userEvent.click(screen.getByRole('link', { name: 'Mensagens' }));

    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'false');
    consoleError.mockRestore();
  });

  it('closes the mobile menu when the backdrop is clicked', async () => {
    const { container } = render(
      <AdminLayout>
        <p>conteúdo</p>
      </AdminLayout>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    const backdrop = container.querySelector('[aria-hidden="true"]');
    expect(backdrop).not.toBeNull();
    await userEvent.click(backdrop as Element);

    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'false');
  });
});
