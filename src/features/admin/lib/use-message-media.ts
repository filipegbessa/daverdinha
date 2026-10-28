'use client';
import { useCallback, useEffect, useState } from 'react';
import { useApiClient } from '@/features/admin/lib/api-client';

/**
 * A URL assinada da mídia de uma mensagem, buscada sob demanda.
 *
 * A URL não vem no payload da thread de propósito: ela é assinada e vale cinco
 * minutos, enquanto a thread fica em cache no cliente. Então cada mídia pede
 * a sua quando aparece.
 *
 * E é por isso que o `src` aponta para o R2, não para a API: `<img>` e
 * `<audio>` não mandam header nenhum, e a API exige `Authorization`. Quem
 * carrega o token é o `apiFetch` — a URL que ele traz de volta é que dispensa
 * autenticação.
 */
export function useMessageMedia(conversationId: string, messageId: string) {
  const { apiFetch } = useApiClient();
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const path = `/conversations/${conversationId}/messages/${messageId}/media`;

  const loadUrl = useCallback(
    async (options?: { download?: boolean }) => {
      const query = options?.download ? '?download=1' : '';
      const { url: signed } = await apiFetch<{ url: string }>(`${path}${query}`);
      return signed;
    },
    [apiFetch, path],
  );

  useEffect(() => {
    let cancelled = false;
    loadUrl()
      .then((signed) => !cancelled && setUrl(signed))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [loadUrl]);

  /**
   * Cinco minutos passam fácil com a aba aberta, e aí o elemento falha. Uma
   * tentativa só: se a segunda URL também falhar, o problema não é expiração
   * e insistir viraria laço.
   */
  const [retried, setRetried] = useState(false);
  const handleError = useCallback(() => {
    if (retried) {
      setFailed(true);
      return;
    }
    setRetried(true);
    loadUrl()
      .then(setUrl)
      .catch(() => setFailed(true));
  }, [loadUrl, retried]);

  /**
   * Um link clicado, e não `location.assign`: a URL vem assinada com
   * `Content-Disposition: attachment`, então o navegador baixa em vez de
   * navegar — e o admin não sai do lugar. O atributo `download` não entra
   * porque é ignorado em URL de outra origem; quem manda é o cabeçalho.
   */
  const download = useCallback(async () => {
    try {
      const signed = await loadUrl({ download: true });
      const link = document.createElement('a');
      link.href = signed;
      link.rel = 'noreferrer';
      link.click();
    } catch {
      setFailed(true);
    }
  }, [loadUrl]);

  return { url, failed, loadUrl, handleError, download };
}
