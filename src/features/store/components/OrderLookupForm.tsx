'use client';
import { useState } from 'react';
import { MailCheck } from 'lucide-react';
import { SiteButton } from '@/features/site/components/SiteButton';
import { STORE_INPUT, StoreField } from '@/features/store/components/StoreField';
import { requestOrderLinks } from '@/features/store/lib/store-api';
import { isValidEmail } from '@/features/store/lib/checkout-form';

const ERRORS = {
  too_many: 'Muitas tentativas. Tente de novo em uma hora.',
  error: 'Não foi possível enviar agora. Tente de novo em instantes.',
};

/**
 * "Meus pedidos": o comprador digita o e-mail e recebe os links dos pedidos
 * lá. A tela responde igual com ou sem pedido, pra ninguém descobrir se um
 * e-mail comprou aqui.
 */
export function OrderLookupForm() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(email)) {
      setFieldError('Informe um e-mail válido.');
      return;
    }
    setSending(true);
    const result = await requestOrderLinks(email);
    setSending(false);
    if (result.ok) setSent(true);
    else setError(ERRORS[result.reason]);
  }

  if (sent) {
    return (
      <div role="status" className="flex items-start gap-3 rounded-2xl border border-moss-line bg-moss/5 p-5">
        <MailCheck className="mt-0.5 size-6 shrink-0 text-moss" aria-hidden="true" />
        <p className="text-ink">Se houver pedidos nesse e-mail, mandamos os links. Confira também o spam.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Receber meus pedidos" className="space-y-4">
      <StoreField
        id="lookupEmail"
        label="E-mail usado na compra"
        hint="Mandamos o link de cada pedido e ingresso pra esse e-mail."
        error={fieldError}
      >
        <input
          id="lookupEmail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setFieldError(undefined);
          }}
          className={STORE_INPUT}
        />
      </StoreField>
      {error && (
        <p role="alert" className="text-sm font-medium text-berry">
          {error}
        </p>
      )}
      <SiteButton type="submit" loading={sending} loadingText="Enviando..." className="w-full sm:w-auto">
        Enviar meus pedidos
      </SiteButton>
    </form>
  );
}
