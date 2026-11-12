'use client';

import { useState } from 'react';
import { SiteButton } from '@/features/site/components/SiteButton';
import { checkCep, maskCep, onlyDigits, type CepCheckResult } from '@/features/site/lib/cep-check';
import { getWhatsAppUrl } from '@/features/site/lib/whatsapp';
import { ContactLink } from '@/features/site/components/ContactLink';
import { deliveryScheduleMessage } from '@/features/site/lib/whatsapp-messages';
import { useStoreEnabled } from '@/features/store/components/StoreEnabled';
import { formatPrice } from '@/lib/format';

/**
 * "Entregamos no seu bairro?". Com a loja ligada, a resposta é a mesma do
 * checkout: entrega com o valor do frete da área, ou "ainda não entregamos"
 * (bairro fora da lista ou sem área de entrega), sem mandar pro WhatsApp.
 * Com a loja desligada, a compra é pelo WhatsApp, então o bairro atendido
 * leva pra combinar a entrega lá.
 */
export function CepChecker() {
  const [cep, setCep] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<CepCheckResult | null>(null);
  const storeEnabled = useStoreEnabled();

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setChecking(true);
    setResult(await checkCep(cep));
    setChecking(false);
  }

  const notDelivered =
    result?.status === 'not_covered' || (storeEnabled && result?.status === 'covered' && result.fee === null);

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
        <SiteButton
          type="submit"
          size="sm"
          loading={checking}
          loadingText="Verificando..."
          disabled={onlyDigits(cep).length !== 8}
        >
          Verificar
        </SiteButton>
      </form>

      <div aria-live="polite" className="mt-3 min-h-12 text-sm">
        {result?.status === 'covered' && !notDelivered && (
          <p className="text-moss">
            <strong>Entregamos em {result.bairro}!</strong>{' '}
            {storeEnabled && result.fee !== null ? (
              <>
                Frete: <span className="font-semibold tabular-nums">{formatPrice(result.fee)}</span>.
              </>
            ) : (
              <ContactLink
                href={getWhatsAppUrl(deliveryScheduleMessage(result.bairro))}
                channel="whatsapp"
                location="cep_checker"
                className="font-semibold underline underline-offset-4"
              >
                Combinar pelo WhatsApp
              </ContactLink>
            )}
          </p>
        )}
        {notDelivered && result && 'bairro' in result && (
          <p className="text-ink-soft">
            Ainda não entregamos em <strong className="text-ink">{result.bairro}</strong>.
          </p>
        )}
        {result?.status === 'unresolved' && (
          <p className="text-berry">Não encontramos esse CEP. Confere os números ou procura seu bairro na lista.</p>
        )}
      </div>
    </div>
  );
}
