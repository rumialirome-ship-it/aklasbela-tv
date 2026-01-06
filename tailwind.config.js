
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['"Space Grotesk"', 'sans-serif'],
        'display': ['"Space Grotesk"', 'sans-serif'],
      },
      colors: {
        'brand': {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        'accent': {
          indigo: '#6366f1',
          cyan: '#06b6d4',
          rose: '#f43f5e',
          emerald: '#10b981',
          amber: '#f59e0b',
        }
      },
      animation: {
        'mesh-flow': 'mesh-flow 15s ease-in-out infinite',
        'shimmer-light': 'shimmer-light 2.5s linear infinite',
        'pulse-soft': 'pulse-soft 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
        'float': 'float 5s ease-in-out infinite',
      },
      keyframes: {
        'mesh-flow': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'shimmer-light': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.03)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        }
      }
    },
  },
  plugins: [],
}
