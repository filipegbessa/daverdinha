'use client';
import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApiClient } from '@/features/admin/lib/api-client';
import { checkInByCode, normalizeTicketCode, type CheckInResult } from '@/features/admin/lib/check-in-by-code';
import { useQrScanner } from '@/features/admin/lib/use-qr-scanner';
import type { Attendee } from '@/features/admin/types/admin';

/** O mesmo QR na frente da câmera é lido várias vezes por segundo: confere uma vez. */
const SAME_CODE_PAUSE_MS = 3_000;

const TONE: Record<CheckInResult['tone'], string> = {
  ok: 'border-green-600 bg-green-50 text-green-900',
  warning: 'border-amber-500 bg-amber-50 text-amber-900',
  error: 'border-destructive bg-destructive/10 text-destructive',
};

const STATUS_TEXT = {
  off: null,
  starting: 'Abrindo a câmera...',
  scanning: 'Aponte a câmera pro QR do ingresso.',
  unavailable: 'Não deu pra usar a câmera (permissão negada ou navegador sem suporte). Digite o código abaixo.',
} as const;

/**
 * Check-in na entrada: lê o QR do ingresso pela câmera do celular, ou o
 * código digitado, e mostra o resultado grande, pra quem está na porta ver de
 * relance. Cada entrada confirmada avisa a lista pra se atualizar.
 */
export function TicketScanner({
  eventId,
  onCheckedIn,
  onClose,
}: {
  eventId: string;
  onCheckedIn: (attendee: Attendee) => void;
  onClose: () => void;
}) {
  const { apiFetch } = useApiClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [pending, setPending] = useState(false);
  const [manual, setManual] = useState('');
  const busy = useRef(false);
  const last = useRef<{ code: string; at: number } | null>(null);

  const check = useCallback(
    async (raw: string) => {
      const code = normalizeTicketCode(raw);
      const now = Date.now();
      if (busy.current) return;
      if (last.current && last.current.code === code && now - last.current.at < SAME_CODE_PAUSE_MS) return;
      last.current = { code, at: now };
      busy.current = true;
      setPending(true);
      const outcome = await checkInByCode(apiFetch, eventId, code);
      busy.current = false;
      setPending(false);
      setResult(outcome);
      if (outcome.tone === 'ok') onCheckedIn(outcome.attendee);
    },
    [apiFetch, eventId, onCheckedIn],
  );

  const status = useQrScanner(videoRef, check, cameraOn);

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    // Digitado de novo é intenção: não cai na pausa do mesmo código.
    last.current = null;
    await check(manual);
    setManual('');
  }

  return (
    <section aria-label="Leitor de ingressos" className="mt-4 space-y-4 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-medium">Ler QR do ingresso</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCameraOn((on) => !on)}>
            {cameraOn ? 'Desligar câmera' : 'Ligar câmera'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>

      {cameraOn && (
        <div className="space-y-2">
          <video
            ref={videoRef}
            muted
            playsInline
            aria-label="Câmera"
            className="aspect-square w-full max-w-sm rounded-lg bg-black object-cover"
          />
          {STATUS_TEXT[status] && <p className="text-sm text-muted-foreground">{STATUS_TEXT[status]}</p>}
        </div>
      )}

      {pending && (
        <p role="status" className="text-sm text-muted-foreground">
          Conferindo o ingresso...
        </p>
      )}
      {result && !pending && (
        <p
          role={result.tone === 'ok' ? 'status' : 'alert'}
          className={`rounded-lg border-2 p-4 text-center text-xl font-semibold ${TONE[result.tone]}`}
        >
          {result.message}
        </p>
      )}

      <form onSubmit={submitManual} className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label htmlFor="ticketCode" className="text-sm font-medium">
            Código do ingresso
          </label>
          <Input
            id="ticketCode"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="K7Q2M9XP"
            autoComplete="off"
            autoCapitalize="characters"
            className="w-48 font-mono uppercase"
          />
        </div>
        <Button type="submit" disabled={pending || !manual.trim()}>
          Confirmar entrada
        </Button>
      </form>
    </section>
  );
}
