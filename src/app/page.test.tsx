import { render, screen } from '@testing-library/react';
import Page from './page';

describe('Home page', () => {
  it('renders the core static sections', () => {
    render(<Page />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Um cantinho verde pra chamar de seu');
    expect(screen.getByText('Onde entregamos')).toBeInTheDocument();
    expect(screen.getByText('Onde estamos')).toBeInTheDocument();
    expect(screen.getByText('Perguntas frequentes')).toBeInTheDocument();
    expect(screen.getAllByText('Da Verdinha').length).toBeGreaterThan(0);
  });

  it('renders the LocalBusiness JSON-LD script tag', () => {
    const { container } = render(<Page />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
  });
});
