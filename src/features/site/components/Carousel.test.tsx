import { render, screen, within } from '@testing-library/react';
import { Carousel } from './Carousel';

describe('Carousel', () => {
  it('renders every item in a labelled region', () => {
    render(
      <Carousel label="Produtos">
        <p key="a">A</p>
        <p key="b">B</p>
      </Carousel>,
    );

    const region = screen.getByRole('region', { name: 'Produtos' });
    expect(within(region).getAllByRole('listitem')).toHaveLength(2);
  });

  // Sem itens sobrando (jsdom não mede largura, então nunca sobra), é uma
  // fileira comum: as setas só existem quando há o que rolar.
  it('shows no arrows while everything fits', () => {
    render(
      <Carousel label="Produtos">
        <p key="a">A</p>
      </Carousel>,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows arrows once the items overflow the width', () => {
    const scrollWidth = jest.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(1200);
    const clientWidth = jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(600);

    render(
      <Carousel label="Produtos">
        <p key="a">A</p>
        <p key="b">B</p>
      </Carousel>,
    );

    expect(screen.getByRole('button', { name: 'Próximos' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Anteriores' })).toBeDisabled();

    scrollWidth.mockRestore();
    clientWidth.mockRestore();
  });
});
