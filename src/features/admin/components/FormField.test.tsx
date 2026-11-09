import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/input';
import { FormField, SwitchField } from './FormField';

describe('FormField', () => {
  it('labels the control and ties the hint to it', () => {
    render(
      <FormField id="order" label="Ordem" hint="Menor aparece primeiro.">
        <Input id="order" />
      </FormField>,
    );

    expect(screen.getByLabelText('Ordem')).toHaveAccessibleDescription('Menor aparece primeiro.');
  });

  it('shows an error under the control, marks it invalid and reads it with the hint', () => {
    render(
      <FormField id="stock" label="Estoque" hint="0 = esgotado." error="Informe a quantidade.">
        <Input id="stock" />
      </FormField>,
    );

    const input = screen.getByLabelText('Estoque');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('0 = esgotado. Informe a quantidade.');
    expect(screen.getByRole('alert')).toHaveTextContent('Informe a quantidade.');
  });
});

describe('SwitchField', () => {
  it('is a switch named by its visible label', async () => {
    const onCheckedChange = jest.fn();
    render(<SwitchField label="Mostrar na home" checked={false} onCheckedChange={onCheckedChange} />);

    await userEvent.click(screen.getByRole('switch', { name: 'Mostrar na home' }));

    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
  });
});
