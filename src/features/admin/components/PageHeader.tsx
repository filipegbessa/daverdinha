/**
 * Título da página à esquerda, ações (botões) à direita; quebra no celular.
 * Toda página do admin renderiza o seu, inclusive enquanto carrega ou quando
 * deu erro. `description` é a linha embaixo do título (data do pedido,
 * telefone da conversa).
 */
export function PageHeader({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && <div className="mt-1 text-sm text-muted-foreground">{description}</div>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/**
 * A linha de busca e filtros embaixo do cabeçalho. Toda lista do admin põe a
 * busca e os filtros aqui, nunca dentro do `PageHeader`.
 */
export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div role="search" className="mt-4 flex flex-wrap items-center gap-2">
      {children}
    </div>
  );
}
