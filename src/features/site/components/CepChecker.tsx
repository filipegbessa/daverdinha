'use client';

import { useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { checkCep, maskCep, onlyDigits, type CepCheckResult } from '@/features/site/lib/cep-check';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';
import { ContactLink } from '@/features/site/components/ContactLink';
import { deliveryQuestionMessage, deliveryScheduleMessage } from '@/features/site/lib/whatsapp-messages';

export function CepChecker() {
  const [cep, setCep] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<CepCheckResult | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setChecking(true);
    setResult(await checkCep(cep));
    setChecking(false);
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="flex flex-wrap gap-2">
        <label htmlFor="cep" className="sr-only">
          CEP
        </label>
        <input
          id="cep"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="00000-000"
          value={cep}
          onChange={(e) => {
            setCep(maskCep(e.target.value));
            setResult(null);
          }}
          className="min-w-0 flex-1 rounded-full border border-moss-line bg-paper px-5 py-2.5 text-ink tabular-nums placeholder:text-ink-soft/60 focus:border-moss focus:outline-none"
        />
        <button
          type="submit"
          disabled={checking || onlyDigits(cep).length !== 8}
          className={cn(
            buttonVariants({ variant: 'default', size: 'lg' }),
            'cursor-pointer rounded-full bg-moss hover:bg-moss/90 disabled:cursor-not-allowed',
          )}
        >
          {checking ? 'Verificando…' : 'Verificar'}
        </button>
      </form>

      <div aria-live="polite" className="mt-3 min-h-12 text-sm">
        {result?.status === 'covered' && (
          <p className="text-moss">
            <strong>Entregamos em {result.bairro}!</strong>{' '}
            <ContactLink
              href={getWhatsAppUrl(deliveryScheduleMessage(result.bairro))}
              channel="whatsapp"
              location="cep_checker"
              className="font-semibold underline underline-offset-4"
            >
              Combinar pelo WhatsApp
            </ContactLink>
          </p>
        )}
        {result?.status === 'not_covered' && (
          <p className="text-ink-soft">
            Ainda não entregamos em <strong className="text-ink">{result.bairro}</strong>. Chama a gente que a
            gente vê o que dá pra fazer.{' '}
            <ContactLink
              href={getWhatsAppUrl(deliveryQuestionMessage(result.bairro))}
              channel="whatsapp"
              location="cep_checker"
              className="font-semibold text-moss underline underline-offset-4"
            >
              Falar no WhatsApp
            </ContactLink>
          </p>
        )}
        {result?.status === 'unresolved' && (
          <p className="text-berry">Não encontramos esse CEP. Confere os números ou procura seu bairro na lista.</p>
        )}
      </div>
    </div>
  );
}
