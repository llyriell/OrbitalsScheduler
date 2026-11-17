/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0b1626',
          900: '#0f1c30',
          800: '#16263e',
          700: '#1f3350',
          600: '#2c4566',
        },
        ivory: {
          DEFAULT: '#f2ead9',
          bright: '#fffdf6',
          dim: '#b9b3a2',
          faint: '#7d7a6e',
        },
        gold: {
          300: '#e8d29a',
          400: '#d8ba6e',
          500: '#c8a84b',
          600: '#a4863a',
        },
      },
      fontFamily: {
        serif: ['ui-serif', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
