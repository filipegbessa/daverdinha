import { render } from '@testing-library/react';
import { Analytics } from './analytics';

const mockUsePathname = jest.fn();
jest.mock('next/navigation', () => ({ usePathname: () => mockUsePathname() }));

jest.mock('@next/third-parties/google', () => ({
  GoogleAnalytics: ({ gaId }: { gaId: string }) => <div data-testid="google-analytics" data-ga-id={gaId} />,
}));

describe('Analytics', () => {
  it('renders GoogleAnalytics on public pages', () => {
    mockUsePathname.mockReturnValue('/');

    const { getByTestId } = render(<Analytics gaId="G-GYGTB5HZKF" />);

    expect(getByTestId('google-analytics')).toHaveAttribute('data-ga-id', 'G-GYGTB5HZKF');
  });

  it('renders nothing on /admin routes', () => {
    mockUsePathname.mockReturnValue('/admin/mensagens');

    const { container } = render(<Analytics gaId="G-GYGTB5HZKF" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing on the /admin root route', () => {
    mockUsePathname.mockReturnValue('/admin');

    const { container } = render(<Analytics gaId="G-GYGTB5HZKF" />);

    expect(container).toBeEmptyDOMElement();
  });

  // gtag loaded on a public page (e.g. /login) survives a client-side move to
  // /admin; only its own disable flag stops the history-driven page views.
  it('switches gtag off on /admin and back on when leaving it', () => {
    const flag = () => (window as unknown as Record<string, boolean>)['ga-disable-G-GYGTB5HZKF'];

    mockUsePathname.mockReturnValue('/login');
    const { rerender } = render(<Analytics gaId="G-GYGTB5HZKF" />);
    expect(flag()).toBe(false);

    mockUsePathname.mockReturnValue('/admin/docs');
    rerender(<Analytics gaId="G-GYGTB5HZKF" />);
    expect(flag()).toBe(true);

    mockUsePathname.mockReturnValue('/');
    rerender(<Analytics gaId="G-GYGTB5HZKF" />);
    expect(flag()).toBe(false);
  });
});
