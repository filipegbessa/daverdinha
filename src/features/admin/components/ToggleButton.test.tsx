import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToggleButton } from './ToggleButton';

describe('ToggleButton', () => {
  it('exposes its state through aria-pressed and flips it on click', async () => {
    const onPressedChange = jest.fn();
    const { rerender } = render(
      <ToggleButton pressed={false} onPressedChange={onPressedChange}>
        Não lidas
      </ToggleButton>,
    );
    const button = screen.getByRole('button', { name: 'Não lidas' });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(button);
    expect(onPressedChange).toHaveBeenCalledWith(true);

    rerender(
      <ToggleButton pressed onPressedChange={onPressedChange}>
        Não lidas
      </ToggleButton>,
    );
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });
});
