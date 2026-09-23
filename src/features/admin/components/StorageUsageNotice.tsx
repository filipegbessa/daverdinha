import { ErrorAlert } from './StatusMessage';

/**
 * Espelha o teto do backend (`MEDIA_STORAGE_CAP_BYTES` em
 * `bot-engine.service.ts`) — 2 GB de folga dos 10 GB grátis do R2. A API
 * continua sendo quem decide o bloqueio; isto é só para o operador não
 * descobrir que as fotos pararam de chegar quando um cliente reclamar.
 */
const CAP_BYTES = 8 * 1024 * 1024 * 1024;
/** A partir daqui, um aviso — bem antes do teto, que é o ponto sem volta. */
const WARNING_RATIO = 0.8;

function formatGb(bytes: number): string {
  return (bytes / (1024 * 1024 * 1024)).toFixed(1);
}

/**
 * "Degradar em silêncio é o pior desfecho possível" — a mesma frase que
 * justifica o aviso de "bot desativado por falta de item de menu" vale
 * aqui: sem isto, o operador só percebe o teto de armazenamento quando as
 * fotos já pararam de chegar e um cliente reclamar.
 *
 * Dois estágios, não um: acima do teto é o mesmo vermelho do aviso de bot
 * desativado (mesma classe de problema — um recurso parou), porque acima
 * de 80% é só um aviso neutro, tempo de agir sem já estar quebrado.
 */
export function StorageUsageNotice({
  mediaBytesUsed,
}: {
  mediaBytesUsed: number;
}) {
  // Defensivo: um fixture de teste ou uma resposta antiga sem o campo não
  // pode virar "NaN GB de 8.0 GB" na tela.
  if (!Number.isFinite(mediaBytesUsed)) return null;

  const ratio = mediaBytesUsed / CAP_BYTES;
  if (ratio < WARNING_RATIO) return null;

  const usedGb = formatGb(mediaBytesUsed);
  const capGb = formatGb(CAP_BYTES);

  if (ratio >= 1) {
    return (
      <ErrorAlert>
        Armazenamento de imagens cheio ({usedGb} GB de {capGb} GB). Novas
        fotos não estão sendo salvas até a faxina liberar espaço.
      </ErrorAlert>
    );
  }

  return (
    <p
      role="status"
      className="mt-4 rounded border border-sand-line bg-sand p-3 text-ink-soft"
    >
      Armazenamento de imagens: {usedGb} GB de {capGb} GB usados.
    </p>
  );
}
