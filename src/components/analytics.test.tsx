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
});
