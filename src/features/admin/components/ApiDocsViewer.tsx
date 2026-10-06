'use client';
import { useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import { ApiReferenceReact } from '@scalar/api-reference-react';

type GetToken = () => Promise<string | null>;

/**
 * The token Clerk hands out lives for 60 seconds, so a token captured when
 * the page loaded is dead long before anyone clicks "Send". This asks Clerk
 * for one right before every request instead — `getToken()` returns the
 * cached token while it's still valid and refreshes it when it isn't.
 */
export function withFreshToken(getToken: GetToken) {
  return async ({ request }: { request: Request }) => {
    const token = await getToken();
    if (token) request.headers.set('Authorization', `Bearer ${token}`);
  };
}

/**
 * Scalar renders the spec and its "Try it" client. The spec is passed in
 * already fetched (the endpoint is behind Clerk too, so Scalar can't load it
 * by URL on its own), and requests go straight to the API — CORS already
 * allows the admin's origin.
 */
export function ApiDocsViewer({ spec }: { spec: object }) {
  const { getToken } = useAuth();

  const configuration = useMemo(
    () => ({
      content: spec,
      servers: [{ url: process.env.NEXT_PUBLIC_API_URL ?? '' }],
      onBeforeRequest: withFreshToken(getToken),
      // Nothing here should leave the browser for Scalar's servers. An unset
      // `proxyUrl` can fall back to their hosted proxy (proxy.scalar.com),
      // which would carry the Clerk token; an empty string turns proxying off.
      // The developer toolbar can upload the whole spec to share it.
      proxyUrl: '',
      showDeveloperTools: 'never' as const,
      telemetry: false,
      documentDownloadType: 'none' as const,
      metaData: { title: 'Daverdinha API' },
    }),
    [spec, getToken],
  );

  return <ApiReferenceReact configuration={configuration} />;
}
