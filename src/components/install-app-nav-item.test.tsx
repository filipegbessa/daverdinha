import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstallAppNavItem } from './install-app-nav-item';

function setUserAgent(userAgent: string) {
  Object.defineProperty(window.navigator, 'userAgent', { value: userAgent, configurable: true });
}

function setStandalone(matches: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

function dispatchBeforeInstallPrompt() {
  const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
    prompt: () => void;
    userChoice: Promise<{ outcome: string }>;
  };
  event.prompt = jest.fn();
  event.userChoice = Promise.resolve({ outcome: 'accepted' });
  window.dispatchEvent(event);
  return event;
}

const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/128.0 Mobile Safari/537.36';
const IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15';

function renderInList() {
  return render(
    <ul>
      <InstallAppNavItem />
    </ul>,
  );
}

describe('InstallAppNavItem', () => {
  afterEach(() => {
    delete (window.navigator as { standalone?: boolean }).standalone;
  });

  it('renders nothing when the app is already installed (standalone mode)', () => {
    setStandalone(true);
    setUserAgent(ANDROID_UA);

    const { container } = renderInList();

    expect(container.querySelector('li')).toBeNull();
  });

  it('renders nothing when there is no install prompt available and the device is not iOS', () => {
    setStandalone(false);
    setUserAgent(ANDROID_UA);

    const { container } = renderInList();

    expect(container.querySelector('li')).toBeNull();
  });

  it('shows an "Instalar app" item once beforeinstallprompt fires, and triggers the native prompt on click', async () => {
    setStandalone(false);
    setUserAgent(ANDROID_UA);

    renderInList();
    const event = dispatchBeforeInstallPrompt();

    const button = await screen.findByRole('button', { name: 'Instalar app' });
    await userEvent.click(button);

    expect(event.prompt).toHaveBeenCalled();
  });

  it('toggles manual instructions on iOS instead of prompting, since there is no native API', async () => {
    setStandalone(false);
    setUserAgent(IOS_UA);

    renderInList();

    const button = await screen.findByRole('button', { name: 'Instalar app' });
    expect(screen.queryByText(/Adicionar à Tela de Início/)).not.toBeInTheDocument();

    await userEvent.click(button);
    expect(screen.getByText(/Adicionar à Tela de Início/)).toBeInTheDocument();
  });

  it('hides the item once the appinstalled event fires', async () => {
    setStandalone(false);
    setUserAgent(ANDROID_UA);

    const { container } = renderInList();
    dispatchBeforeInstallPrompt();
    await screen.findByRole('button', { name: 'Instalar app' });

    window.dispatchEvent(new Event('appinstalled'));

    await waitFor(() => expect(container.querySelector('li')).toBeNull());
  });
});
