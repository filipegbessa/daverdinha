import { render } from '@testing-library/react';
import { ServiceWorkerRegistration } from './service-worker-registration';

describe('ServiceWorkerRegistration', () => {
  it('registers /sw.js when the browser supports service workers', () => {
    const register = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'serviceWorker', {
      value: { register },
      configurable: true,
    });

    render(<ServiceWorkerRegistration />);

    expect(register).toHaveBeenCalledWith('/sw.js');
  });

  it('does nothing when the browser has no serviceWorker support', () => {
    delete (window.navigator as { serviceWorker?: unknown }).serviceWorker;

    expect(() => render(<ServiceWorkerRegistration />)).not.toThrow();
  });
});
