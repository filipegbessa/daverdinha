'use client';

import Link from 'next/link';
import { clearAnalyticsCookies, useConsent, writeConsent } from '@/lib/consent';

/**
 * O aviso de cookies, no rodapé da tela, até a pessoa escolher. Só existe
 * quando o site tem medição (o layout só monta com o GA configurado), e
 * nunca no admin nem no login, que não são medidos. "Recusar" tem o mesmo
 * peso visual de "Aceitar", como a ANPD orienta.
 */
export function CookieBanner({ hidden = false }: { hidden?: boolean }) {
  const consent = useConsent();
  if (hidden || consent !== null) return null;

  return (
    <section
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-moss-line bg-paper px-4 py-4 shadow-card md:px-6"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink">
          Usamos cookies do Google Analytics pra entender, de forma agregada, como o site é usado. Você escolhe se
          aceita.{' '}
          <Link href="/politica-de-privacidade" className="underline underline-offset-4 hover:text-moss">
            Política de privacidade
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => {
              writeConsent('denied');
              clearAnalyticsCookies();
            }}
            className="cursor-pointer rounded-full border border-moss px-4 py-2 text-sm font-medium text-moss hover:bg-moss/10"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={() => writeConsent('granted')}
            className="cursor-pointer rounded-full border border-moss bg-moss px-4 py-2 text-sm font-medium text-paper hover:bg-moss/90"
          >
            Aceitar
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * "Preferências de cookies" no rodapé: apaga a escolha, e o aviso volta. Se
 * a pessoa tinha aceitado, o GA já carregado só sai da página com um
 * recarregamento, então ele acontece aqui.
 */
export function CookiePreferencesButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        clearAnalyticsCookies();
        writeConsent(null);
        if (window.gtag) window.location.reload();
      }}
      className={className}
    >
      Preferências de cookies
    </button>
  );
}
