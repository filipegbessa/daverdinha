import { render, screen } from '@testing-library/react';
import { STORE_INPUT, StoreField } from './StoreField';

describe('StoreField', () => {
  it('ties hint and error to the control and announces the error', () => {
    render(
      <StoreField id="cep" label="CEP" hint="Só números." error="CEP inválido.">
        <input id="cep" className={STORE_INPUT} />
      </StoreField>,
    );

    const input = screen.getByLabelText('CEP');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Só números. CEP inválido.');
    expect(screen.getByRole('alert')).toHaveTextContent('CEP inválido.');
  });
});
