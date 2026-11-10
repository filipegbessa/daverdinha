const VARIANT_CLASS = {
  /** O rótulo de uma zona ou bloco (bairros, áreas, blocos do pedido). */
  label: 'text-sm font-semibold tracking-wide text-muted-foreground uppercase',
  /** O título de uma seção da página ("Retirada no ateliê", "Bairros atendidos"). */
  title: 'text-lg font-semibold',
};

/** O título de uma seção ou zona do admin. */
export function SectionLabel({
  children,
  variant = 'label',
  as: Tag = variant === 'title' ? 'h2' : 'h3',
  className = '',
  id,
}: {
  children: React.ReactNode;
  variant?: keyof typeof VARIANT_CLASS;
  as?: 'h2' | 'h3';
  className?: string;
  id?: string;
}) {
  return (
    <Tag id={id} className={`${VARIANT_CLASS[variant]} ${className}`.trim()}>
      {children}
    </Tag>
  );
}
