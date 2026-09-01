import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#eff2ea',
        ink: '#182a1e',
        'ink-soft': '#3c4c40',
        moss: '#185928',
        'moss-line': '#c7d0c1',
        berry: '#7a3247',
        sand: '#e4dfce',
        'sand-line': '#cfc6a8',
      },
      fontFamily: {
        serif: ['var(--font-lora)', 'ui-serif', 'Georgia', 'serif'],
        sans: ['var(--font-raleway)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 16px -6px rgba(24, 41, 30, 0.10)',
        soft: '0 12px 32px -10px rgba(24, 89, 40, 0.22)',
      },
    },
  },
  plugins: [],
} satisfies Config;
