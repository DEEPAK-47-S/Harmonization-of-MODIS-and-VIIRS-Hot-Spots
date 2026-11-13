/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fire: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        modis: {
          light: '#f59e0b',
          DEFAULT: '#d97706',
          dark: '#b45309'
        },
        viirs: {
          light: '#38bdf8',
          DEFAULT: '#0284c7',
          dark: '#0369a1'
        }
      }
    },
  },
  plugins: [],
}

