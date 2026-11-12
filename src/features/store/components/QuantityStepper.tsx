'use client';
import { Minus, Plus } from 'lucide-react';

/** − 1 + com rótulo acessível; os limites desabilitam os botões. */
export function QuantityStepper({
  value,
  max,
  onChange,
  label = 'Quantidade',
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  label?: string;
}) {
  const button =
    'flex size-10 cursor-pointer items-center justify-center rounded-full text-ink transition hover:bg-moss/10 disabled:cursor-not-allowed disabled:opacity-40';
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex items-center rounded-full border border-sand-line bg-paper"
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label="Diminuir"
        className={button}
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <output aria-live="polite" aria-label={label} className="w-8 text-center font-semibold text-ink tabular-nums">
        {value}
      </output>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Aumentar"
        className={button}
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
