'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Formatos que o navegador pode gravar **e** a Cloud API do WhatsApp aceita,
 * na ordem de preferência. OGG/opus é o mesmo formato da mensagem de voz do
 * próprio app (Firefox grava nele); MP4/AAC é o que Safari e Chrome recentes
 * oferecem. `audio/webm`, o padrão do Chrome, não serve: a Meta recusa.
 */
const RECORDING_FORMATS = [
  { mimeType: 'audio/ogg;codecs=opus', fileType: 'audio/ogg', extension: 'ogg' },
  { mimeType: 'audio/mp4;codecs=mp4a.40.2', fileType: 'audio/mp4', extension: 'm4a' },
  { mimeType: 'audio/mp4', fileType: 'audio/mp4', extension: 'm4a' },
];

function pickRecordingFormat() {
  if (typeof MediaRecorder === 'undefined') return null;
  return RECORDING_FORMATS.find((format) => MediaRecorder.isTypeSupported(format.mimeType)) ?? null;
}

export type VoiceRecorderState = 'idle' | 'recording';

/**
 * Grava pelo microfone e entrega um `File` pronto para o `reply-audio`.
 *
 * `supported` é calculado no cliente depois de montar: o `MediaRecorder` não
 * existe no servidor, e checá-lo durante o render quebraria a hidratação.
 */
export function useVoiceRecorder(onRecorded: (file: File) => void) {
  const [supported, setSupported] = useState(false);
  const [state, setState] = useState<VoiceRecorderState>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const discardRef = useRef(false);
  const onRecordedRef = useRef(onRecorded);
  useEffect(() => {
    onRecordedRef.current = onRecorded;
  });

  useEffect(() => {
    setSupported(!!pickRecordingFormat() && !!navigator.mediaDevices?.getUserMedia);
  }, []);

  /** Solta o microfone — sem isto o indicador de gravação do navegador fica aceso. */
  const releaseStream = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      discardRef.current = true;
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      releaseStream();
    };
  }, [releaseStream]);

  const start = useCallback(async () => {
    const format = pickRecordingFormat();
    if (!format) return;
    setError(null);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('Não foi possível acessar o microfone.');
      return;
    }

    const recorder = new MediaRecorder(stream, { mimeType: format.mimeType });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = () => {
      releaseStream();
      setState('idle');
      if (discardRef.current || chunks.length === 0) return;
      // O tipo do arquivo vai sem o `codecs=`: é a forma que o backend confere.
      const file = new File(chunks, `audio-${Date.now()}.${format.extension}`, {
        type: format.fileType,
      });
      onRecordedRef.current(file);
    };

    streamRef.current = stream;
    recorderRef.current = recorder;
    discardRef.current = false;
    setElapsedSeconds(0);
    timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    recorder.start();
    setState('recording');
  }, [releaseStream]);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
  }, []);

  /** Para sem entregar nada. */
  const cancel = useCallback(() => {
    discardRef.current = true;
    recorderRef.current?.stop();
  }, []);

  return { supported, state, elapsedSeconds, error, start, stop, cancel };
}
