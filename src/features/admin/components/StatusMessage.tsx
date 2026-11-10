/**
 * Os dois estados de toda tela do admin enquanto fala com a API. Cores só
 * dos tokens neutros do shadcn (`destructive`, `muted-foreground`): o admin
 * não usa a paleta do site.
 */

export function LoadingState({ label = 'Carregando...' }: { label?: string }) {
  return (
    <p role="status" className="mt-6 text-muted-foreground">
      {label}
    </p>
  );
}

export function ErrorAlert({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      role="alert"
      className={`mt-4 rounded border border-destructive bg-destructive/10 p-3 text-destructive ${className}`}
    >
      {children}
    </p>
  );
}

/** The inline, unboxed variant for errors shown next to the control that caused them. */
export function ErrorText({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <p id={id} role="alert" className={`mt-2 text-destructive ${className}`}>
      {children}
    </p>
  );
}
