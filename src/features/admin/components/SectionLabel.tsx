/** O título de uma zona ou seção do admin (bairros, áreas, blocos do pedido). */
export function SectionLabel({
  children,
  as: Tag = 'h3',
  className = '',
  id,
}: {
  children: React.ReactNode;
  as?: 'h2' | 'h3';
  className?: string;
  id?: string;
}) {
  return (
    <Tag id={id} className={`text-sm font-semibold tracking-wide text-berry uppercase ${className}`.trim()}>
      {children}
    </Tag>
  );
}
