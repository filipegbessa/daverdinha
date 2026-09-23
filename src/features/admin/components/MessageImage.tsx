'use client';
import { useCallback, useEffect, useState } from 'react';
import { useApiClient } from '@/features/admin/lib/api-client';

interface MessageImageProps {
  conversationId: string;
  messageId: string;
  /** Legenda que o cliente escreveu, quando escreveu. */
  caption: string | null;
}

/**
 * A imagem de uma mensagem, buscada sob demanda.
 *
 * A URL não vem no payload da thread de propósito: ela é assinada e vale cinco
 * minutos, enquanto a thread fica em cache no cliente. Então cada imagem pede
 * a sua quando aparece.
 *
 * E é por isso que o `src` aponta para o R2, não para a API: uma tag `<img>`
 * não manda header nenhum, e a API exige `Authorization`. Quem carrega o token
 * é o `apiFetch` — a URL que ele traz de volta é que dispensa autenticação.
 */
export function MessageImage({
  conversationId,
  messageId,
  caption,
}: MessageImageProps) {
  const { apiFetch } = useApiClient();
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [sharing, setSharing] = useState(false);

  const path = `/conversations/${conversationId}/messages/${messageId}/media`;

  const loadUrl = useCallback(
    async (options?: { download?: boolean }) => {
      const query = options?.download ? '?download=1' : '';
      const { url: signed } = await apiFetch<{ url: string }>(
        `${path}${query}`,
      );
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
   * Cinco minutos passam fácil com a aba aberta, e aí o `<img>` falha. Uma
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

  /**
   * A folha nativa do aparelho já traz Drive, WhatsApp, Fotos e o resto — é o
   * que entrega "salvar no celular" e "mandar pro Drive" sem OAuth nenhum.
   *
   * Exige buscar os bytes, que é uma requisição cross-origin contra o R2 e
   * portanto **depende de CORS no bucket**. Sem ele, só o botão de baixar
   * funciona — daí a falha ser silenciosa em vez de virar erro na tela.
   */
  const share = useCallback(async () => {
    setSharing(true);
    try {
      const signed = await loadUrl();
      const blob = await fetch(signed).then((response) => response.blob());
      const file = new File([blob], `foto-${messageId}.jpg`, {
        type: blob.type || 'image/jpeg',
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      }
    } catch {
      // Cancelar o compartilhamento também cai aqui, e cancelar não é erro.
    } finally {
      setSharing(false);
    }
  }, [loadUrl, messageId]);

  if (failed) {
    return (
      <p data-testid="image-failed" className="italic text-ink-soft">
        Não foi possível carregar a imagem.
      </p>
    );
  }

  return (
    <div>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer">
          <img
            src={url}
            alt={caption ?? 'Imagem enviada pelo cliente'}
            data-testid="message-image"
            loading="lazy"
            onError={handleError}
            className="max-h-80 rounded"
          />
        </a>
      ) : (
        <p className="text-xs text-ink-soft">Carregando imagem...</p>
      )}

      {caption && <p className="mt-1 whitespace-pre-line">{caption}</p>}

      <div className="mt-1 flex gap-3">
        <button
          type="button"
          onClick={() => void download()}
          className="text-xs text-ink-soft underline"
        >
          Baixar
        </button>
        {/* Escondido onde a folha nativa não existe — desktop e Firefox. */}
        {typeof navigator !== 'undefined' && !!navigator.canShare && (
          <button
            type="button"
            onClick={() => void share()}
            disabled={sharing}
            className="text-xs text-ink-soft underline"
          >
            Compartilhar
          </button>
        )}
      </div>
    </div>
  );
}
