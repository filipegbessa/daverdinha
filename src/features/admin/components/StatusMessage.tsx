/**
 * The two states every admin screen ends up in while talking to the API.
 * Extracted because each page had grown its own copy, and the copies had
 * already drifted — half of them rendered errors in `text-berry`, the other
 * half in a raw `text-red-600` that isn't in the palette at all.
 */

export function LoadingState({ label = 'Carregando...' }: { label?: string }) {
  return (
    <p role="status" className="mt-6 text-ink-soft">
      {label}
    </p>
  );
}

export function ErrorAlert({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p role="alert" className={`mt-4 rounded border border-berry bg-berry/10 p-3 text-berry ${className}`}>
      {children}
    </p>
  );
}

/** The inline, unboxed variant for errors shown next to the control that caused them. */
export function ErrorText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p role="alert" className={`mt-2 text-berry ${className}`}>
      {children}
    </p>
  );
}
