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
    },
  },
  plugins: [],
} satisfies Config;
