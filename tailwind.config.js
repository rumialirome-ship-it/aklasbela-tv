
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
      colors: {
        'brand': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        'neon': {
          cyan: '#06b6d4',
          violet: '#8b5cf6',
          rose: '#f43f5e',
          emerald: '#10b981',
        },
        'obsidian': {
          900: '#070710',
          950: '#020204',
        }
      },
      animation: {
        'grid-scroll': 'grid-scroll 20s linear infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        'grid-scroll': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(40px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4', filter: 'blur(8px)' },
          '50%': { opacity: '0.8', filter: 'blur(12px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
