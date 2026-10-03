import { render } from '@testing-library/react';
import { Analytics } from './analytics';

const mockUsePathname = jest.fn();
jest.mock('next/navigation', () => ({ usePathname: () => mockUsePathname() }));

// next/script just renders its children/inline content as a plain <script>-like
// node in tests, so assertions can inspect id/src/dangerouslySetInnerHTML
// without actually executing anything in jsdom.
jest.mock('next/script', () => ({
  __esModule: true,
  default: ({
    id,
    src,
    children,
    dangerouslySetInnerHTML,
  }: {
    id?: string;
    src?: string;
    children?: string;
    dangerouslySetInnerHTML?: { __html: string };
  }) => (
    <script
      id={id}
      src={src}
      data-testid={id}
      dangerouslySetInnerHTML={dangerouslySetInnerHTML ?? { __html: children ?? '' }}
    />
  ),
}));

describe('Analytics', () => {
  beforeEach(() => {
    (window as unknown as { gtag?: jest.Mock }).gtag = jest.fn();
  });

  it('loads the GA script on a public page, with automatic page_view tracking turned off', () => {
    mockUsePathname.mockReturnValue('/');

    const { getByTestId } = render(<Analytics gaId="G-GYGTB5HZKF" />);

    expect(getByTestId('_next-ga')).toHaveAttribute(
      'src',
      'https://www.googletagmanager.com/gtag/js?id=G-GYGTB5HZKF',
    );
    // send_page_view: false is what stops gtag.js's own history-based
    // auto-tracking from firing page_view on every client-side navigation —
    // without it, a visit to /admin still gets counted even though this
    // component itself renders nothing there (see the regression test below).
    expect(getByTestId('_next-ga-init').innerHTML).toContain('send_page_view: false');
    expect(getByTestId('_next-ga-init').innerHTML).toContain("gtag('config', 'G-GYGTB5HZKF'");
  });

  it('does not load the GA script at all when the first page is /admin', () => {
    mockUsePathname.mockReturnValue('/admin/mensagens');

    const { container } = render(<Analytics gaId="G-GYGTB5HZKF" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('does not load the GA script at all when the first page is the /admin root', () => {
    mockUsePathname.mockReturnValue('/admin');

    const { container } = render(<Analytics gaId="G-GYGTB5HZKF" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('does not load the GA script at all when the first page is /login', () => {
    mockUsePathname.mockReturnValue('/login');

    const { container } = render(<Analytics gaId="G-GYGTB5HZKF" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('does not load the GA script on /login sub-routes (Clerk\'s catch-all, e.g. sso-callback)', () => {
    mockUsePathname.mockReturnValue('/login/sso-callback');

    const { container } = render(<Analytics gaId="G-GYGTB5HZKF" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('fires a manual page_view on client-side navigation between public pages', () => {
    mockUsePathname.mockReturnValue('/');
    const { rerender } = render(<Analytics gaId="G-GYGTB5HZKF" />);

    mockUsePathname.mockReturnValue('/politica-de-privacidade');
    rerender(<Analytics gaId="G-GYGTB5HZKF" />);

    expect(window.gtag).toHaveBeenCalledWith('event', 'page_view', {
      page_path: '/politica-de-privacidade',
    });
  });

  // Regression test for the actual bug: Home → Admin navigation (the normal
  // way the operator reaches the panel) was still being counted, because
  // gtag.js's own automatic history-based tracking doesn't care whether this
  // React component is mounted — only send_page_view: false stops it, and
  // only this effect deciding not to fire manually keeps /admin out of GA.
  it('does not fire a page_view when navigating from a public page into /admin', () => {
    mockUsePathname.mockReturnValue('/');
    const { rerender } = render(<Analytics gaId="G-GYGTB5HZKF" />);

    mockUsePathname.mockReturnValue('/admin/conversas');
    rerender(<Analytics gaId="G-GYGTB5HZKF" />);

    expect(window.gtag).not.toHaveBeenCalledWith(
      'event',
      'page_view',
      expect.objectContaining({ page_path: '/admin/conversas' }),
    );
  });

  it('resumes tracking if navigation goes from /admin back to a public page', () => {
    mockUsePathname.mockReturnValue('/admin');
    const { rerender } = render(<Analytics gaId="G-GYGTB5HZKF" />);

    mockUsePathname.mockReturnValue('/');
    rerender(<Analytics gaId="G-GYGTB5HZKF" />);

    expect(window.gtag).toHaveBeenCalledWith('event', 'page_view', { page_path: '/' });
  });
});
