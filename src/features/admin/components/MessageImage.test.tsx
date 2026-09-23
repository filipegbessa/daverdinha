import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageImage } from './MessageImage';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');

function mockApi(url = 'https://r2.example/signed') {
  const apiFetch = jest.fn().mockResolvedValue({ url });
  (useApiClient as jest.Mock).mockReturnValue({ apiFetch });
  return apiFetch;
}

const props = { conversationId: 'c1', messageId: 'm1', caption: null };

describe('MessageImage', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete (navigator as { canShare?: unknown }).canShare;
    delete (navigator as { share?: unknown }).share;
  });

  it('fetches the signed url and points the img at R2, not at the API', async () => {
    // O `src` tem que ser a URL assinada: `<img>` não manda header de auth, e
    // a rota da API exige Authorization.
    const apiFetch = mockApi();

    render(<MessageImage {...props} />);

    const img = await screen.findByTestId('message-image');
    expect(img).toHaveAttribute('src', 'https://r2.example/signed');
    expect(apiFetch).toHaveBeenCalledWith(
      '/conversations/c1/messages/m1/media',
    );
  });

  it('shows the caption the customer wrote', async () => {
    mockApi();

    render(<MessageImage {...props} caption="segue o comprovante" />);

    expect(await screen.findByText('segue o comprovante')).toBeInTheDocument();
  });

  it('uses the caption as alt text, falling back when there is none', async () => {
    mockApi();

    const { rerender } = render(<MessageImage {...props} caption="o vaso" />);
    expect(await screen.findByTestId('message-image')).toHaveAttribute(
      'alt',
      'o vaso',
    );

    rerender(<MessageImage {...props} caption={null} />);
    expect(await screen.findByTestId('message-image')).toHaveAttribute(
      'alt',
      'Imagem enviada pelo cliente',
    );
  });

  // A URL assinada vale 5 minutos, e isso passa fácil com a aba aberta.
  it('refetches once when the signed url has expired', async () => {
    const apiFetch = jest
      .fn()
      .mockResolvedValueOnce({ url: 'https://r2.example/expired' })
      .mockResolvedValueOnce({ url: 'https://r2.example/fresh' });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MessageImage {...props} />);
    const img = await screen.findByTestId('message-image');

    img.dispatchEvent(new Event('error'));

    await waitFor(() =>
      expect(screen.getByTestId('message-image')).toHaveAttribute(
        'src',
        'https://r2.example/fresh',
      ),
    );
  });

  it('gives up after one retry instead of looping', async () => {
    const apiFetch = jest.fn().mockResolvedValue({ url: 'https://r2/broken' });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MessageImage {...props} />);
    (await screen.findByTestId('message-image')).dispatchEvent(
      new Event('error'),
    );

    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2));
    screen.getByTestId('message-image').dispatchEvent(new Event('error'));

    expect(await screen.findByTestId('image-failed')).toBeInTheDocument();
    // A terceira busca não acontece: insistir viraria laço.
    expect(apiFetch).toHaveBeenCalledTimes(2);
  });

  it('asks for the attachment disposition when downloading', async () => {
    const apiFetch = mockApi('https://r2.example/attachment');
    // O link é criado e clicado em vez de navegar a página — captura dele
    // para conferir o destino.
    let anchor: HTMLAnchorElement | undefined;
    const create = document.createElement.bind(document);
    jest
      .spyOn(document, 'createElement')
      .mockImplementation((tag: string, options?: ElementCreationOptions) => {
        const element = create(tag, options);
        if (tag === 'a') {
          anchor = element as HTMLAnchorElement;
          anchor.click = jest.fn();
        }
        return element;
      });

    render(<MessageImage {...props} />);
    await screen.findByTestId('message-image');
    await userEvent.click(screen.getByRole('button', { name: 'Baixar' }));

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith(
        '/conversations/c1/messages/m1/media?download=1',
      ),
    );
    await waitFor(() => expect(anchor?.click).toHaveBeenCalled());
    expect(anchor).toHaveAttribute('href', 'https://r2.example/attachment');
  });

  describe('compartilhar', () => {
    it('stays hidden where the device has no native share sheet', async () => {
      mockApi();

      render(<MessageImage {...props} />);
      await screen.findByTestId('message-image');

      expect(
        screen.queryByRole('button', { name: 'Compartilhar' }),
      ).not.toBeInTheDocument();
    });

    it('hands the file to the native sheet, which is what reaches Drive', async () => {
      mockApi();
      const share = jest.fn().mockResolvedValue(undefined);
      (navigator as { canShare?: unknown }).canShare = jest
        .fn()
        .mockReturnValue(true);
      (navigator as { share?: unknown }).share = share;
      global.fetch = jest
        .fn()
        .mockResolvedValue({ blob: async () => new Blob(['x'], { type: 'image/jpeg' }) }) as unknown as typeof fetch;

      render(<MessageImage {...props} />);
      await screen.findByTestId('message-image');
      await userEvent.click(
        screen.getByRole('button', { name: 'Compartilhar' }),
      );

      await waitFor(() => expect(share).toHaveBeenCalled());
      const [{ files }] = share.mock.calls[0] as [{ files: File[] }];
      expect(files[0]).toBeInstanceOf(File);
    });

    // Sem CORS no bucket o fetch cross-origin falha — e cancelar a folha
    // nativa cai no mesmo catch. Nenhum dos dois é erro para mostrar na tela.
    it('fails quietly, leaving the image and the download button alone', async () => {
      mockApi();
      (navigator as { canShare?: unknown }).canShare = jest
        .fn()
        .mockReturnValue(true);
      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error('CORS')) as unknown as typeof fetch;

      render(<MessageImage {...props} />);
      await screen.findByTestId('message-image');
      await userEvent.click(
        screen.getByRole('button', { name: 'Compartilhar' }),
      );

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'Compartilhar' }),
        ).not.toBeDisabled(),
      );
      expect(screen.getByTestId('message-image')).toBeInTheDocument();
      expect(screen.queryByTestId('image-failed')).not.toBeInTheDocument();
    });
  });
});
