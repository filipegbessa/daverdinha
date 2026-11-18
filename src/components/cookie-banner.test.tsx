import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CookieBanner, CookiePreferencesButton } from './cookie-banner';
import { CONSENT_STORAGE_KEY, writeConsent } from '@/lib/consent';

describe('CookiePreferencesButton', () => {
  afterEach(() => act(() => writeConsent(null)));

  it('clears the choice so the notice comes back', async () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'denied');
    render(
      <>
        <CookieBanner />
        <CookiePreferencesButton />
      </>,
    );
    expect(screen.queryByRole('region', { name: 'Aviso de cookies' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Preferências de cookies' }));

    expect(screen.getByRole('region', { name: 'Aviso de cookies' })).toBeInTheDocument();
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
  });
});
