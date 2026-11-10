import { cloneElement, isValidElement } from 'react';

export type FieldControl = React.ReactElement<{ 'aria-describedby'?: string; 'aria-invalid'?: boolean }>;

/**
 * A parte de acessibilidade de um campo com rótulo, dica e erro, comum ao
 * `FormField` do admin e ao `StoreField` da loja (cada um com o seu visual).
 * Liga dica e erro ao controle com `aria-describedby` e marca `aria-invalid`
 * quando há erro, pra leitor de tela ler a mensagem junto com o campo.
 */
export function describeField(
  id: string,
  { hint, error, control }: { hint?: React.ReactNode; error?: React.ReactNode; control: FieldControl },
): { hintId?: string; errorId?: string; control: React.ReactNode } {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return {
    hintId,
    errorId,
    control:
      describedBy && isValidElement(control)
        ? cloneElement(control, { 'aria-describedby': describedBy, ...(error ? { 'aria-invalid': true } : {}) })
        : control,
  };
}
