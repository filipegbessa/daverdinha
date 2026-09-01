import { render, screen } from '@testing-library/react';
import Page from './page';

describe('Home page', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = '5521999999999';
  });

  it('renders all 5 sections in order: header, hero, about, delivery zones, footer', () => {
    render(<Page />);
    const headings = screen.getAllByRole('heading');
    expect(headings[0]).toHaveTextContent('Um cantinho verde pra chamar de seu');
    expect(headings[1]).toHaveTextContent('Onde entregamos');
    expect(screen.getAllByText('Da Verdinha').length).toBeGreaterThan(0);
    expect(screen.getByText(/Ateliê de plantas no Santo Cristo/)).toBeInTheDocument();
  });

  it('renders the LocalBusiness JSON-LD script tag', () => {
    const { container } = render(<Page />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const json = JSON.parse(script!.textContent!);
    expect(json['@type']).toBe('LocalBusiness');
    expect(json.name).toBe('Da Verdinha');
  });
});
