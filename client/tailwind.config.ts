import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#FFFAF0',
        cream: { DEFAULT: '#FBF1DD', deep: '#F5E3BF' },
        veda: {
          brown: '#5A2D0F', // primary buttons / headings
          bark: '#3E1F0B',
          text: '#4B4036',
          muted: '#7C6A58',
        },
        gold: { DEFAULT: '#C58B2B', soft: '#E3C285', pale: '#F1DFB4' },
        saffron: '#C26A1B',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', '"Times New Roman"', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
        deva: ['"Noto Serif Devanagari"', '"Nirmala UI"', 'Mangal', 'serif'],
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(90, 45, 15, 0.25)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'rise-in': 'rise-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
} satisfies Config;
