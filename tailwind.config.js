
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
        'mono': ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        'obsidian': {
          DEFAULT: '#020617',
          950: '#01040f',
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
        },
        'accent': {
          indigo: '#6366f1',
          violet: '#8b5cf6',
          cyan: '#06b6d4',
          rose: '#f43f5e',
          emerald: '#10b981',
          amber: '#f59e0b',
        }
      },
      animation: {
        'mesh-flow': 'mesh-flow 20s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'pulse-glow': 'pulse-glow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
        'glow-pulse': 'glow-pulse 2s infinite',
      },
      keyframes: {
        'mesh-flow': {
          '0%, 100%': { backgroundPosition: '0% 50%', transform: 'scale(1)' },
          '50%': { backgroundPosition: '100% 50%', transform: 'scale(1.05)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.05)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(99, 102, 241, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}
