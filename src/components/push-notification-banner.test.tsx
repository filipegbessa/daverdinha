import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PushNotificationBanner } from './push-notification-banner';
import { usePushSubscription } from '@/features/admin/lib/use-push-subscription';

jest.mock('@/features/admin/lib/use-push-subscription');

describe('PushNotificationBanner', () => {
  const originalNotification = window.Notification;

  afterEach(() => {
    Object.defineProperty(window, 'Notification', { value: originalNotification, configurable: true });
    delete (window.navigator as { serviceWorker?: unknown }).serviceWorker;
  });

  it('shows the opt-in button when permission has not been asked yet', () => {
    Object.defineProperty(window, 'Notification', { value: { permission: 'default' }, configurable: true });
    (usePushSubscription as jest.Mock).mockReturnValue({ subscribe: jest.fn(), subscribing: false, error: null });

    render(<PushNotificationBanner />);

    expect(screen.getByRole('button', { name: 'Ativar notificações' })).toBeInTheDocument();
  });

  it('renders nothing when permission was already granted', () => {
    Object.defineProperty(window, 'Notification', { value: { permission: 'granted' }, configurable: true });
    (usePushSubscription as jest.Mock).mockReturnValue({ subscribe: jest.fn(), subscribing: false, error: null });

    const { container } = render(<PushNotificationBanner />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when permission was already denied', () => {
    Object.defineProperty(window, 'Notification', { value: { permission: 'denied' }, configurable: true });
    (usePushSubscription as jest.Mock).mockReturnValue({ subscribe: jest.fn(), subscribing: false, error: null });

    const { container } = render(<PushNotificationBanner />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the browser has no Notification API at all', () => {
    delete (window as { Notification?: unknown }).Notification;
    (usePushSubscription as jest.Mock).mockReturnValue({ subscribe: jest.fn(), subscribing: false, error: null });

    const { container } = render(<PushNotificationBanner />);

    expect(container).toBeEmptyDOMElement();
  });

  it('calls subscribe() when the button is clicked, and shows the error on failure', async () => {
    Object.defineProperty(window, 'Notification', { value: { permission: 'default' }, configurable: true });
    const subscribe = jest.fn().mockResolvedValue(undefined);
    (usePushSubscription as jest.Mock).mockReturnValue({
      subscribe,
      subscribing: false,
      error: 'Permissão de notificação negada.',
    });

    render(<PushNotificationBanner />);
    await userEvent.click(screen.getByRole('button', { name: 'Ativar notificações' }));

    expect(subscribe).toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Permissão de notificação negada.');
  });

  it('closes the banner when the close button is clicked', async () => {
    Object.defineProperty(window, 'Notification', { value: { permission: 'default' }, configurable: true });
    (usePushSubscription as jest.Mock).mockReturnValue({ subscribe: jest.fn(), subscribing: false, error: null });

    const { container } = render(<PushNotificationBanner />);
    await userEvent.click(screen.getByRole('button', { name: 'Fechar aviso de notificações' }));

    expect(container).toBeEmptyDOMElement();
  });

  it('stays visible and keeps showing the error once permission is no longer "default"', () => {
    Object.defineProperty(window, 'Notification', { value: { permission: 'denied' }, configurable: true });
    (usePushSubscription as jest.Mock).mockReturnValue({
      subscribe: jest.fn(),
      subscribing: false,
      error: 'Não foi possível ativar as notificações.',
    });

    render(<PushNotificationBanner />);

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível ativar as notificações.');
  });

  it('silently retries subscribe() on mount when permission is granted but no browser subscription exists', async () => {
    Object.defineProperty(window, 'Notification', { value: { permission: 'granted' }, configurable: true });
    const getSubscription = jest.fn().mockResolvedValue(null);
    Object.defineProperty(window.navigator, 'serviceWorker', {
      value: { ready: Promise.resolve({ pushManager: { getSubscription } }) },
      configurable: true,
    });
    const subscribe = jest.fn().mockResolvedValue(undefined);
    (usePushSubscription as jest.Mock).mockReturnValue({ subscribe, subscribing: false, error: null });

    render(<PushNotificationBanner />);

    await waitFor(() => expect(getSubscription).toHaveBeenCalled());
    await waitFor(() => expect(subscribe).toHaveBeenCalled());
  });

  it('does not retry subscribe() on mount when a browser subscription already exists', async () => {
    Object.defineProperty(window, 'Notification', { value: { permission: 'granted' }, configurable: true });
    const existingSubscription = { endpoint: 'https://push.example/1' };
    const getSubscription = jest.fn().mockResolvedValue(existingSubscription);
    Object.defineProperty(window.navigator, 'serviceWorker', {
      value: { ready: Promise.resolve({ pushManager: { getSubscription } }) },
      configurable: true,
    });
    const subscribe = jest.fn().mockResolvedValue(undefined);
    (usePushSubscription as jest.Mock).mockReturnValue({ subscribe, subscribing: false, error: null });

    render(<PushNotificationBanner />);

    await waitFor(() => expect(getSubscription).toHaveBeenCalled());
    expect(subscribe).not.toHaveBeenCalled();
  });
});
