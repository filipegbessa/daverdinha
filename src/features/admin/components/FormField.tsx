'use client';
import { cloneElement, isValidElement } from 'react';
import { Switch } from '@/components/ui/switch';

/**
 * Label + control + optional hint, the block every admin form repeats. The
 * hint is wired to the control with `aria-describedby`, so a screen reader
 * reads it with the field instead of as loose text.
 */
export function FormField({
  id,
  label,
  hint,
  children,
}: {
  /** The control's `id`; the label points at it. */
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactElement<{ 'aria-describedby'?: string }>;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const control =
    hintId && isValidElement(children) ? cloneElement(children, { 'aria-describedby': hintId }) : children;

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
