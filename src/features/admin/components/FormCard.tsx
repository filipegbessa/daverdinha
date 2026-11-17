/**
 * Um card de formulário com título, pras páginas de detalhe do admin (o
 * produto, por enquanto): cada assunto num card, na ordem em que a pessoa
 * pensa no cadastro.
 */
export function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  const id = `card-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <section aria-labelledby={id} className="space-y-4 rounded-xl border border-border p-4">
      <h2 id={id} className="text-sm font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}
