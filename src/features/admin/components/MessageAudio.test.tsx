import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MessageAudio } from './MessageAudio';
import { useApiClient } from '@/features/admin/lib/api-client';

jest.mock('@/features/admin/lib/api-client');

const props = { conversationId: 'c1', messageId: 'm1' };

describe('MessageAudio', () => {
  it('plays from the signed R2 url, not from the API', async () => {
    const apiFetch = jest.fn().mockResolvedValue({ url: 'https://r2.example/voice' });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MessageAudio {...props} />);

    const audio = await screen.findByTestId('message-audio');
    expect(audio).toHaveAttribute('src', 'https://r2.example/voice');
    expect(audio).toHaveAttribute('controls');
    expect(apiFetch).toHaveBeenCalledWith('/conversations/c1/messages/m1/media');
  });

  it('asks for a fresh url once when the signed one expired', async () => {
    const apiFetch = jest
      .fn()
      .mockResolvedValueOnce({ url: 'https://r2.example/old' })
      .mockResolvedValueOnce({ url: 'https://r2.example/new' });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MessageAudio {...props} />);
    fireEvent.error(await screen.findByTestId('message-audio'));

    await waitFor(() =>
      expect(screen.getByTestId('message-audio')).toHaveAttribute('src', 'https://r2.example/new'),
    );
  });

  it('says so when the audio cannot be loaded', async () => {
    const apiFetch = jest.fn().mockRejectedValue(new Error('404'));
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(<MessageAudio {...props} />);

    expect(await screen.findByTestId('audio-failed')).toBeInTheDocument();
  });

  it('pauses the other message\'s audio when this one starts playing', async () => {
    const apiFetch = jest.fn().mockResolvedValue({ url: 'https://r2.example/voice' });
    (useApiClient as jest.Mock).mockReturnValue({ apiFetch });

    render(
      <>
        <MessageAudio conversationId="c1" messageId="m1" />
        <MessageAudio conversationId="c1" messageId="m2" />
      </>,
    );

    const [first, second] = await screen.findAllByTestId('message-audio');
    const firstPause = jest.spyOn(first as HTMLAudioElement, 'pause');

    fireEvent.play(first);
    fireEvent.play(second);

    expect(firstPause).toHaveBeenCalled();
  });
});
