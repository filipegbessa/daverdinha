import { cloneElement, isValidElement } from 'react';

export const STORE_INPUT =
  'w-full rounded-lg border border-moss-line bg-paper px-4 py-2.5 text-ink placeholder:text-ink-soft/60 focus:border-moss focus:outline-none aria-invalid:border-berry';

/**
 * Rótulo + campo + dica e erro do formulário da loja. Dica e erro ficam
 * ligados ao campo (`aria-describedby`), e o erro marca `aria-invalid`, pra
 * leitor de tela ler a mensagem junto com o campo.
 */
export function StoreField({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactElement<{ 'aria-describedby'?: string; 'aria-invalid'?: boolean }>;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  const control =
    describedBy && isValidElement(children)
      ? cloneElement(children, { 'aria-describedby': describedBy, ...(error ? { 'aria-invalid': true } : {}) })
      : children;

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink">
        {label}
      </label>
      {control}
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-ink-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-sm font-medium text-berry">
          {error}
        </p>
      )}
    </div>
  );
}
