/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        // Modern color palette
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
        // Additional modern colors
        'app-surface': 'var(--color-surface)',
        'app-surface-dark': 'var(--color-surface-dark)',
        'app-primary': 'var(--color-primary)',
        'app-secondary': 'var(--color-secondary)',
        'app-gradient-start': 'var(--color-gradient-start)',
        'app-gradient-end': 'var(--color-gradient-end)',
      },
      spacing: {
        '18': '4.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 40px -10px rgba(0, 0, 0, 0.1)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
}
