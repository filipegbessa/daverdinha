'use client';
import { useMessageMedia } from '@/features/admin/lib/use-message-media';

interface MessageAudioProps {
  conversationId: string;
  messageId: string;
}

/**
 * O áudio de uma mensagem — mensagem de voz ou arquivo — tocado direto do R2.
 * Mesma URL assinada da imagem (ver `useMessageMedia`), inclusive a nova
 * tentativa quando ela expira com a aba aberta.
 */
export function MessageAudio({ conversationId, messageId }: MessageAudioProps) {
  const { url, failed, handleError, download } = useMessageMedia(conversationId, messageId);

  if (failed) {
    return (
      <p data-testid="audio-failed" className="italic text-ink-soft">
        Não foi possível carregar o áudio.
      </p>
    );
  }

  return (
    <div>
      {url ? (
        <audio
          src={url}
          controls
          preload="metadata"
          data-testid="message-audio"
          onError={handleError}
          className="max-w-full"
        >
          <a href={url} target="_blank" rel="noreferrer">
            Abrir áudio
          </a>
        </audio>
      ) : (
        <p className="text-xs text-ink-soft">Carregando áudio...</p>
      )}

      <div className="mt-1 flex gap-3">
        <button type="button" onClick={() => void download()} className="text-xs text-ink-soft underline">
          Baixar
        </button>
      </div>
    </div>
  );
}
