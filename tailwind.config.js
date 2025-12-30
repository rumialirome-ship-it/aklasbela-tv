
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
        'rose-quartz': {
          50: '#fdf8f8',
          100: '#fbeff1',
          200: '#f7dee2',
          300: '#efc1c9',
          400: '#e49aa7',
          500: '#d47588',
          600: '#c0566d',
          700: '#a14256',
          800: '#863a4a',
          900: '#723442',
          950: '#401921',
        },
        'evening-red': {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          950: '#450a0a',
        }
      },
      animation: {
        'portal-pulse': 'portal-pulse 4s ease-in-out infinite',
        'swing-down': 'swing-down 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'blink-fast': 'blink 0.3s linear infinite',
      },
      keyframes: {
        'portal-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
        'swing-down': {
          '0%': { transform: 'translateY(-100px) scale(0)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        }
      }
    },
  },
  plugins: [],
}
