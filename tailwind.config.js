/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', 'system-ui', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      colors: {
        // shadcn/ui semantic tokens, mapped onto the Senda "Nativa" palette
        border: 'var(--k-sep)',
        input: 'var(--k-sep)',
        ring: 'var(--k-accent)',
        background: 'var(--k-bg)',
        foreground: 'var(--k-text)',
        primary: {
          DEFAULT: 'var(--k-accent)',
          foreground: 'var(--k-accent-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--k-fill)',
          foreground: 'var(--k-text)',
        },
        muted: {
          DEFAULT: 'var(--k-fill)',
          foreground: 'var(--k-text2)',
        },
        accent: {
          DEFAULT: 'var(--k-accent-soft)',
          foreground: 'var(--k-accent-ink)',
        },
        destructive: {
          DEFAULT: 'var(--k-danger)',
          foreground: '#ffffff',
        },
        card: {
          DEFAULT: 'var(--k-surface)',
          foreground: 'var(--k-text)',
        },
        // raw design tokens, for one-off spots the semantic names don't fit
        'k-bg': 'var(--k-bg)',
        'k-surface': 'var(--k-surface)',
        'k-sep': 'var(--k-sep)',
        'k-text': 'var(--k-text)',
        'k-text2': 'var(--k-text2)',
        'k-text3': 'var(--k-text3)',
        'k-fill': 'var(--k-fill)',
        'k-accent': 'var(--k-accent)',
        'k-accent-ink': 'var(--k-accent-ink)',
        'k-accent-soft': 'var(--k-accent-soft)',
        'k-nav': 'var(--k-nav)',
        'k-danger': 'var(--k-danger)',
      },
      borderRadius: {
        lg: 'var(--k-radius)',
        md: 'calc(var(--k-radius) - 4px)',
        sm: 'calc(var(--k-radius) - 8px)',
      },
      keyframes: {
        'sheet-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        'sheet-down': { from: { transform: 'translateY(0)' }, to: { transform: 'translateY(100%)' } },
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'fade-out': { from: { opacity: 1 }, to: { opacity: 0 } },
        'toast-in': { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
      },
      animation: {
        'sheet-up': 'sheet-up .32s cubic-bezier(.32,.72,0,1)',
        'sheet-down': 'sheet-down .22s ease-in',
        'fade-in': 'fade-in .2s ease',
        'fade-out': 'fade-out .18s ease',
        'toast-in': 'toast-in .2s ease',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
