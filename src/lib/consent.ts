'use client';
import { useEffect, useState } from 'react';

/**
 * Consentimento de cookies de medição (LGPD). O Google Analytics só carrega
 * depois de "Aceitar"; sem escolha, ou com "Recusar", nenhum script de
 * medição roda e os eventos (`window.gtag?.(...)`) simplesmente não saem.
 * A escolha fica no navegador; o link "Preferências de cookies" do rodapé
 * apaga a escolha e o aviso volta.
 */
export type Consent = 'granted' | 'denied';

export const CONSENT_STORAGE_KEY = 'daverdinha:consent:v1';
/** Avisa os componentes da mesma aba (o `storage` só chega nas outras). */
const CONSENT_EVENT = 'daverdinha:consent';

/** A escolha da aba, pra quando o navegador não deixa guardar (aba anônima, bloqueio). */
let memory: Consent | null = null;

export function readConsent(): Consent | null {
  try {
    const value = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (value === 'granted' || value === 'denied') return value;
    return value === null ? memory : null;
  } catch {
    return memory;
  }
}

export function writeConsent(value: Consent | null): void {
  memory = value;
  try {
    if (value) localStorage.setItem(CONSENT_STORAGE_KEY, value);
    else localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // Sem armazenamento: vale só nesta aba (`memory`).
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

/**
 * Apaga os cookies do Google Analytics (`_ga`, `_ga_<id>`) do domínio e do
 * domínio-pai (o GA grava em `.daverdinha.com.br`).
 */
export function clearAnalyticsCookies(): void {
  const host = window.location.hostname;
  const domains = ['', host, `.${host.replace(/^www\./, '')}`];
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0]?.trim();
    if (!name?.startsWith('_ga')) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`;
    }
  }
}

/**
 * A escolha atual. `undefined` até montar (o servidor não sabe a escolha,
 * e nada de medição ou aviso deve aparecer antes de ler o navegador).
 */
export function useConsent(): Consent | null | undefined {
  const [consent, setConsent] = useState<Consent | null | undefined>(undefined);

  useEffect(() => {
    const sync = () => setConsent(readConsent());
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CONSENT_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return consent;
}
