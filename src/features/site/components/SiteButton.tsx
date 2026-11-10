import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const siteButtonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-transparent font-semibold whitespace-nowrap transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        /** O CTA principal: verde da marca, com sombra. */
        primary:
          'bg-moss text-paper shadow-card hover:bg-moss/90 hover:shadow-soft disabled:bg-sand-line disabled:text-ink-soft disabled:shadow-none',
        /** A alternativa ao lado do principal: só o contorno. */
        secondary: 'border-moss-line text-ink hover:bg-moss/10 disabled:opacity-50',
      },
      size: {
        default: 'px-6 py-3.5',
        sm: 'px-4 py-2 text-sm',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

type SiteButtonVariants = VariantProps<typeof siteButtonVariants>;

/**
 * As classes do botão do site, pra quando o elemento não é o `SiteButton`:
 * `ContactLink` (WhatsApp/Instagram, que conta conversão) ou um `<a>` que tem
 * de recarregar a página inteira.
 */
export function siteButtonClass({ variant, size, className }: SiteButtonVariants & { className?: string } = {}) {
  return cn(siteButtonVariants({ variant, size }), className);
}

type ButtonProps = SiteButtonVariants &
  React.ComponentProps<'button'> & {
    href?: undefined;
    /** Ação em andamento: trava o botão, marca `aria-busy` e mostra o spinner. */
    loading?: boolean;
    /** O texto durante o `loading` ("Verificando..."). */
    loadingText?: React.ReactNode;
  };

type LinkProps = SiteButtonVariants & React.ComponentProps<typeof Link> & { href: string };

/**
 * O botão do site e da loja. Com `href` vira um link (`next/link`); sem, é um
 * `<button>`. Toda chamada pra ação do site passa por aqui ou pelo
 * `siteButtonClass`, pra nenhum CTA ganhar o seu próprio padding ou sombra.
 */
export function SiteButton(props: ButtonProps | LinkProps) {
  if (typeof props.href === 'string') {
    const { variant, size, className, ...rest } = props as LinkProps;
    return <Link className={siteButtonClass({ variant, size, className })} {...rest} />;
  }

  const {
    variant,
    size,
    className,
    loading = false,
    loadingText,
    disabled,
    children,
    type = 'button',
    ...rest
  } = props as ButtonProps;
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={siteButtonClass({ variant, size, className })}
      {...rest}
    >
      {loading && <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
