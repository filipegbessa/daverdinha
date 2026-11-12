'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/**
 * O QR do ingresso, desenhado no navegador a partir do código (nada pessoal
 * vai no QR). Enquanto gera, um quadrado do mesmo tamanho segura o layout.
 */
export function TicketQr({ code, size = 160 }: { code: string; size?: number }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(code, { type: 'svg', margin: 1, width: size, errorCorrectionLevel: 'M' })
      .then((markup) => {
        if (!cancelled) setSvg(markup);
      })
      .catch(() => {
        if (!cancelled) setSvg(null);
      });
    return () => {
      cancelled = true;
    };
  }, [code, size]);

  return (
    <div
      role="img"
      aria-label={`QR code do ingresso ${code}`}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-lg bg-white p-1 [&>svg]:size-full"
      // O SVG vem da biblioteca a partir do código do ingresso, sem texto do usuário.
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}
