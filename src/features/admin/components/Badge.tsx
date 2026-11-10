import { cva, type VariantProps } from 'class-variance-authority';
import { readableTextColor } from '@/features/admin/lib/readable-text-color';
import { cn } from '@/lib/utils';

export const badgeVariants = cva('inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap', {
  variants: {
    variant: {
      secondary: 'bg-secondary text-secondary-foreground',
    },
    size: {
      sm: 'px-2 py-0.5 text-xs',
      default: 'px-3 py-1 text-sm',
    },
  },
  defaultVariants: { variant: 'secondary', size: 'default' },
});

/** Fundo na cor escolhida pela cliente e texto que dá pra ler em cima dela. */
export function badgeColorStyle(color: string): React.CSSProperties {
  return { backgroundColor: color, color: readableTextColor(color) };
}

/**
 * A etiqueta do admin: "Destaque", o status do pedido, o nome de um marcador.
 * Com `color`, o fundo é essa cor (marcadores); sem, é o neutro do tema.
 */
export function Badge({
  variant,
  size,
  color,
  className,
  style,
  ...props
}: Omit<React.ComponentProps<'span'>, 'color'> & VariantProps<typeof badgeVariants> & { color?: string }) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      style={color ? { ...badgeColorStyle(color), ...style } : style}
      {...props}
    />
  );
}

/** A bolinha de cor de um marcador, onde não cabe o nome inteiro. */
export function ColorDot({ color, title }: { color: string; title?: string }) {
  return (
    <span
      title={title}
      aria-hidden={title ? undefined : true}
      className="size-2.5 flex-none rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}
