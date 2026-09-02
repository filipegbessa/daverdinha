import '@testing-library/jest-dom';

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
}
