/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Editorial Earth Science Palette
        ivory: {
          50: '#FAF8F3',
          100: '#F4F1E9', // Primary Background
          200: '#EBE8DF', // Warm Stone Surface
          300: '#E1DED5', // Soft Neutral Border
          400: '#CEC9BD',
          500: '#B5AFA1',
        },
        charcoal: {
          DEFAULT: '#252923', // Primary Text
          dark: '#181B17',
          muted: '#777970', // Secondary Text
          subtle: '#9A9C93',
        },
        fire: {
          DEFAULT: '#E65C35', // Fire Orange
          hover: '#D44F29',
          light: '#FCECE7',
          subtle: '#F7D6CB',
        },
        modis: {
          DEFAULT: '#C27B26', // Muted Amber
          light: '#FBF2E5',
          border: '#E8B374',
        },
        viirs: {
          DEFAULT: '#318C9B', // Muted Teal
          light: '#E6F4F6',
          border: '#7CC2CD',
        },
        nature: {
          green: '#54785E', // Natural Green
          ochre: '#B98B37', // Soft Ochre
          red: '#BD493C',   // Controlled Red
        }
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        display: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(37, 41, 35, 0.05), 0 1px 2px -1px rgba(37, 41, 35, 0.03)',
        'float': '0 10px 25px -5px rgba(37, 41, 35, 0.08), 0 8px 10px -6px rgba(37, 41, 35, 0.04)',
      }
    },
  },
  plugins: [],
}

