import { act, renderHook, waitFor } from '@testing-library/react';
import { useVoiceRecorder } from './use-voice-recorder';

/** Só o bastante de MediaRecorder para o hook: start, stop e os dois eventos. */
class FakeMediaRecorder {
  static supported = new Set<string>();
  static isTypeSupported = (type: string) => FakeMediaRecorder.supported.has(type);
  static last: FakeMediaRecorder | null = null;

  state: 'inactive' | 'recording' = 'inactive';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;

  constructor(
    public stream: unknown,
    public options: { mimeType: string },
  ) {
    FakeMediaRecorder.last = this;
  }

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['voz'], { type: this.options.mimeType }) });
    this.onstop?.();
  }
}

describe('useVoiceRecorder', () => {
  const stopTrack = jest.fn();
  const getUserMedia = jest.fn();

  beforeEach(() => {
    FakeMediaRecorder.supported = new Set();
    stopTrack.mockReset();
    getUserMedia.mockReset().mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] });
    (globalThis as { MediaRecorder?: unknown }).MediaRecorder = FakeMediaRecorder;
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia },
      configurable: true,
    });
  });

  afterEach(() => {
    delete (globalThis as { MediaRecorder?: unknown }).MediaRecorder;
  });

  it('is unsupported where the browser only records formats WhatsApp refuses (webm)', async () => {
    FakeMediaRecorder.supported.add('audio/webm;codecs=opus');

    const { result } = renderHook(() => useVoiceRecorder(jest.fn()));

    await waitFor(() => expect(result.current.supported).toBe(false));
  });

  it('records ogg/opus when available and hands back a file typed without codecs', async () => {
    FakeMediaRecorder.supported.add('audio/ogg;codecs=opus');
    FakeMediaRecorder.supported.add('audio/mp4');
    const onRecorded = jest.fn();

    const { result } = renderHook(() => useVoiceRecorder(onRecorded));
    await waitFor(() => expect(result.current.supported).toBe(true));

    await act(() => result.current.start());
    expect(result.current.state).toBe('recording');
    expect(FakeMediaRecorder.last?.options.mimeType).toBe('audio/ogg;codecs=opus');

    act(() => result.current.stop());

    expect(result.current.state).toBe('idle');
    const file = onRecorded.mock.calls[0][0] as File;
    expect(file.type).toBe('audio/ogg');
    expect(file.name).toMatch(/\.ogg$/);
    // O microfone é solto — senão o indicador de gravação fica aceso.
    expect(stopTrack).toHaveBeenCalled();
  });

  it('falls back to mp4 (Safari) when ogg is not available', async () => {
    FakeMediaRecorder.supported.add('audio/mp4');
    const onRecorded = jest.fn();

    const { result } = renderHook(() => useVoiceRecorder(onRecorded));
    await waitFor(() => expect(result.current.supported).toBe(true));
    await act(() => result.current.start());
    act(() => result.current.stop());

    expect((onRecorded.mock.calls[0][0] as File).type).toBe('audio/mp4');
  });

  it('discards the recording on cancel', async () => {
    FakeMediaRecorder.supported.add('audio/ogg;codecs=opus');
    const onRecorded = jest.fn();

    const { result } = renderHook(() => useVoiceRecorder(onRecorded));
    await waitFor(() => expect(result.current.supported).toBe(true));
    await act(() => result.current.start());
    act(() => result.current.cancel());

    expect(onRecorded).not.toHaveBeenCalled();
    expect(stopTrack).toHaveBeenCalled();
  });

  it('reports a denied microphone instead of failing silently', async () => {
    FakeMediaRecorder.supported.add('audio/ogg;codecs=opus');
    getUserMedia.mockRejectedValue(new Error('NotAllowedError'));

    const { result } = renderHook(() => useVoiceRecorder(jest.fn()));
    await waitFor(() => expect(result.current.supported).toBe(true));
    await act(() => result.current.start());

    expect(result.current.error).toBe('Não foi possível acessar o microfone.');
    expect(result.current.state).toBe('idle');
  });
});
