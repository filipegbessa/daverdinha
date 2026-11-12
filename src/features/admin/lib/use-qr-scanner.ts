'use client';
import { useEffect, useRef, useState } from 'react';

export type ScannerStatus = 'off' | 'starting' | 'scanning' | 'unavailable';

/** O que o leitor nativo do navegador oferece (Chrome no Android, por exemplo). */
type NativeDetector = { detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]> };
type NativeDetectorClass = {
  new (options: { formats: string[] }): NativeDetector;
  getSupportedFormats?: () => Promise<string[]>;
};

const SCAN_EVERY_MS = 250;

/**
 * Liga a câmera traseira no `<video>` e chama `onCode` a cada QR lido.
 * Usa o `BarcodeDetector` do navegador quando existe; senão (iPhone), carrega
 * a biblioteca de leitura só neste momento, pra não pesar o resto do admin.
 * Isolado aqui porque câmera não roda nos testes: o componente é testado com
 * este hook trocado por um falso.
 */
export function useQrScanner(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  onCode: (code: string) => void,
  active: boolean,
): ScannerStatus {
  const [status, setStatus] = useState<ScannerStatus>('off');
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;

  useEffect(() => {
    const video = videoRef.current;
    if (!active || !video) {
      setStatus('off');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unavailable');
      return;
    }

    let stopped = false;
    let stream: MediaStream | null = null;
    let timer: number | undefined;
    let stopZxing: (() => void) | undefined;
    setStatus('starting');

    async function start(target: HTMLVideoElement) {
      const Native = (window as unknown as { BarcodeDetector?: NativeDetectorClass }).BarcodeDetector;
      const nativeQr = Native && (await Native.getSupportedFormats?.())?.includes('qr_code');
      if (Native && nativeQr) {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (stopped) return;
        target.srcObject = stream;
        await target.play();
        const detector = new Native({ formats: ['qr_code'] });
        setStatus('scanning');
        timer = window.setInterval(async () => {
          if (target.readyState < 2) return;
          const found = await detector.detect(target).catch(() => []);
          if (found[0]?.rawValue) onCodeRef.current(found[0].rawValue);
        }, SCAN_EVERY_MS);
        return;
      }
      const { BrowserQRCodeReader } = await import('@zxing/browser');
      if (stopped) return;
      const reader = new BrowserQRCodeReader();
      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: 'environment' }, audio: false },
        target,
        (result) => {
          if (result) onCodeRef.current(result.getText());
        },
      );
      stopZxing = () => controls.stop();
      if (stopped) stopZxing();
      else setStatus('scanning');
    }

    start(video).catch(() => {
      if (!stopped) setStatus('unavailable');
    });

    return () => {
      stopped = true;
      if (timer) window.clearInterval(timer);
      stream?.getTracks().forEach((track) => track.stop());
      stopZxing?.();
    };
  }, [active, videoRef]);

  return status;
}
