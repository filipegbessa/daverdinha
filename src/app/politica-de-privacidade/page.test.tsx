import { render, screen } from '@testing-library/react';
import PoliticaDePrivacidadePage from './page';

describe('PoliticaDePrivacidadePage', () => {
  it('explains both data sources: site analytics and WhatsApp conversations', () => {
    render(<PoliticaDePrivacidadePage />);
    expect(screen.getByText(/Google Analytics/)).toBeInTheDocument();
    expect(screen.getByText(/Conversas pelo WhatsApp:/)).toBeInTheDocument();
  });

  it('states LGPD rights and shows real contact info', () => {
    render(<PoliticaDePrivacidadePage />);
    expect(screen.getByText(/Lei Geral de Proteção de Dados/)).toBeInTheDocument();
    expect(screen.getByText(/R\. Capiberibe, 32/)).toBeInTheDocument();
  });
});
