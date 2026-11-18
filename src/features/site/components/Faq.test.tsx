import { render, screen } from '@testing-library/react';
import { Faq } from './Faq';

describe('Faq', () => {
  it('renders the default questions as collapsible items', () => {
    render(<Faq />);
    expect(screen.getByText('Como faço um pedido?')).toBeInTheDocument();
    expect(screen.getByText('Para quais regiões vocês entregam?')).toBeInTheDocument();
  });

  it('shows the link of an answer and the FAQPage structured data', () => {
    const { container } = render(
      <Faq
        items={[
          {
            question: 'Posso trocar?',
            answer: 'Sim.',
            link: { href: '/trocas-e-devolucoes', label: 'Trocas e devoluções' },
          },
        ]}
      />,
    );

    expect(screen.getByRole('link', { name: 'Trocas e devoluções' })).toHaveAttribute('href', '/trocas-e-devolucoes');
    const jsonLd = container.querySelector('script[type="application/ld+json"]')?.innerHTML ?? '';
    expect(JSON.parse(jsonLd)).toMatchObject({
      '@type': 'FAQPage',
      mainEntity: [{ name: 'Posso trocar?', acceptedAnswer: { text: 'Sim.' } }],
    });
  });

  it('renders nothing without questions', () => {
    const { container } = render(<Faq items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
