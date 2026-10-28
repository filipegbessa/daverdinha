'use client';
import { useCallback, useState } from 'react';
import { useMessageMedia } from '@/features/admin/lib/use-message-media';

interface MessageImageProps {
  conversationId: string;
  messageId: string;
  /** Legenda que o cliente escreveu, quando escreveu. */
  caption: string | null;
}

/**
 * A imagem de uma mensagem, buscada sob demanda — ver `useMessageMedia` para
 * o porquê da URL assinada e da nova tentativa quando ela expira.
 */
export function MessageImage({
  conversationId,
  messageId,
  caption,
}: MessageImageProps) {
  const { url, failed, loadUrl, handleError, download } = useMessageMedia(
    conversationId,
    messageId,
  );
  const [sharing, setSharing] = useState(false);

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
