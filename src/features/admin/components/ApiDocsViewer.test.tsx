import { render } from '@testing-library/react';
import { useAuth } from '@clerk/nextjs';
import { ApiReferenceReact } from '@scalar/api-reference-react';
import { ApiDocsViewer, withFreshToken } from './ApiDocsViewer';

jest.mock('@clerk/nextjs', () => ({ useAuth: jest.fn() }));
jest.mock('@scalar/api-reference-react', () => ({ ApiReferenceReact: jest.fn(() => null) }));

/** Just enough of a fetch `Request` for the hook: jsdom doesn't ship one. */
const fakeRequest = () => ({ headers: { set: jest.fn() } }) as unknown as Request & { headers: { set: jest.Mock } };

describe('withFreshToken', () => {
  it('asks Clerk for a token on every request and sends it as a bearer header', async () => {
    const getToken = jest.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');
    const hook = withFreshToken(getToken);
    const a = fakeRequest();
    const b = fakeRequest();

    await hook({ request: a });
    await hook({ request: b });

    expect(a.headers.set).toHaveBeenCalledWith('Authorization', 'Bearer first');
    expect(b.headers.set).toHaveBeenCalledWith('Authorization', 'Bearer second');
  });

  it('leaves the request alone when there is no session', async () => {
    const request = fakeRequest();

    await withFreshToken(jest.fn().mockResolvedValue(null))({ request });

    expect(request.headers.set).not.toHaveBeenCalled();
  });
});

describe('ApiDocsViewer', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ getToken: jest.fn() });
    (ApiReferenceReact as jest.Mock).mockClear();
  });

  it('hands Scalar the fetched spec and points "Try it" at the API', () => {
    const spec = { openapi: '3.0.0' };

    render(<ApiDocsViewer spec={spec} />);

    const { configuration } = (ApiReferenceReact as jest.Mock).mock.calls[0][0];
    expect(configuration.content).toBe(spec);
    expect(configuration.servers).toEqual([{ url: process.env.NEXT_PUBLIC_API_URL ?? '' }]);
  });

  // The Clerk token rides on every "Try it" request; none of it should go
  // through, or be uploaded to, Scalar's own servers.
  it('turns off the hosted proxy, the sharing toolbar and telemetry', () => {
    render(<ApiDocsViewer spec={{}} />);

    const { configuration } = (ApiReferenceReact as jest.Mock).mock.calls[0][0];
    expect(configuration.proxyUrl).toBe('');
    expect(configuration.showDeveloperTools).toBe('never');
    expect(configuration.telemetry).toBe(false);
  });
});
