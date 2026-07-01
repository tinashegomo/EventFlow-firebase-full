/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        'app-bg-primary': 'var(--color-bg-primary)',
        'app-bg-secondary': 'var(--color-bg-secondary)',
        'app-bg-tertiary': 'var(--color-bg-tertiary)',
        'app-border': 'var(--color-border)',
        'app-text-primary': 'var(--color-text-primary)',
        'app-text-secondary': 'var(--color-text-secondary)',
        'app-text-muted': 'var(--color-text-muted)',
        'app-accent': 'var(--color-accent)',
        'app-accent-light': 'var(--color-accent-light)',
        'app-accent-dark': 'var(--color-accent-dark)',
        'app-success': 'var(--color-success)',
        'app-warning': 'var(--color-warning)',
        'app-danger': 'var(--color-danger)',
        'app-info': 'var(--color-info)',
      },
    },
  },
  plugins: [],
}
