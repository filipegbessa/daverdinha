'use client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * O botão-filtro do admin, que liga e desliga ("Não lidas", "Atende"…). O
 * estado vai no `aria-pressed`, e o visual sai dele: não existe outra forma de
 * marcar um filtro ligado.
 */
export function ToggleButton({
  pressed,
  onPressedChange,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'onClick' | 'variant' | 'aria-pressed'> & {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        'aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:font-semibold aria-pressed:text-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
