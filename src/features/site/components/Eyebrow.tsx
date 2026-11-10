import { cn } from '@/lib/utils';

/** O rótulo pequeno em caixa alta acima de um título. `className` ajusta tamanho e cor. */
export function Eyebrow({
  children,
  className,
  as: Tag = 'p',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'div';
}) {
  return <Tag className={cn('text-xs font-semibold tracking-[0.2em] text-berry uppercase', className)}>{children}</Tag>;
}
