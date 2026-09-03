import '@testing-library/jest-dom';

// Monkey-patch toBeDisabled to also recognize aria-disabled
const originalMatchers = expect.getMatchers ? expect.getMatchers() : {};
expect.extend({
  toBeDisabled(received: HTMLElement) {
    const isDisabled =
      received.hasAttribute('disabled') ||
      received.getAttribute('aria-disabled') === 'true';

    return {
      pass: isDisabled,
      message: () =>
        `Expected element to be disabled but it was not`,
    };
  },
});

// jsdom doesn't implement matchMedia — default to "motion allowed" everywhere,
// individual tests override this to simulate prefers-reduced-motion.
// Guarded because some tests (e.g. middleware) run under the Node test
// environment, where `window` doesn't exist.
if (typeof window !== 'undefined') {
  window.matchMedia =
    window.matchMedia ||
    function matchMedia(query: string): MediaQueryList {
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      } as MediaQueryList;
    };

  // Polyfill PointerEvent for jsdom (needed by Switch component)
  if (typeof PointerEvent === 'undefined') {
    (global as any).PointerEvent = class PointerEvent extends MouseEvent {
      pointerId = 0;
      width = 1;
      height = 1;
      pressure = 0.5;
      tangentialPressure = 0;
      tiltX = 0;
      tiltY = 0;
      twist = 0;
      pointerType = 'mouse';
      isPrimary = false;

      public constructor(type: string, eventInitDict?: PointerEventInit) {
        super(type, eventInitDict);
        const dict = eventInitDict as any;
        this.pointerId = dict?.pointerId ?? 0;
        this.width = dict?.width ?? 1;
        this.height = dict?.height ?? 1;
        this.pressure = dict?.pressure ?? 0.5;
        this.tangentialPressure = dict?.tangentialPressure ?? 0;
        this.tiltX = dict?.tiltX ?? 0;
        this.tiltY = dict?.tiltY ?? 0;
        this.twist = dict?.twist ?? 0;
        this.pointerType = dict?.pointerType ?? 'mouse';
        this.isPrimary = dict?.isPrimary ?? false;
      }
    };
  }
}
