'use client';
import { cloneElement, isValidElement } from 'react';
import { Switch } from '@/components/ui/switch';
import { ErrorText } from '@/features/admin/components/StatusMessage';

/**
 * Label + control + optional hint and error, the block every admin form
 * repeats. Hint and error are wired to the control with `aria-describedby`
 * (and the error with `aria-invalid`), so a screen reader reads them with the
 * field instead of as loose text.
 */
export function FormField({
  id,
  label,
  hint,
  error,
  children,
}: {
  /** The control's `id`; the label points at it. */
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  /** A validation message for this field, shown under it. */
  error?: React.ReactNode;
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
      <label htmlFor={id} className="mb-1 block font-medium">
        {label}
      </label>
      {control}
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-ink-soft">
          {hint}
        </p>
      )}
      {error && (
        <ErrorText id={errorId} className="mt-1 text-sm">
          {error}
        </ErrorText>
      )}
    </div>
  );
}

/** An on/off setting with its visible label, named the same for assistive tech. */
export function SwitchField({
  label,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} aria-label={label} />
      <span aria-hidden="true">{label}</span>
    </div>
  );
}
