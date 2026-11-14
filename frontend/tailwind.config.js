/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern Clean Gen-Z Light Palette
        ivory: {
          50: '#FFFFFF',
          100: '#F8FAFC', // Slate 50 clean light background
          200: '#F1F5F9', // Slate 100 soft surface
          300: '#E2E8F0', // Slate 200 crisp border
          400: '#CBD5E1', // Slate 300
          500: '#94A3B8', // Slate 400
        },
        charcoal: {
          DEFAULT: '#0F172A', // Slate 900 high-contrast primary text
          dark: '#020617',
          muted: '#64748B', // Slate 500 secondary text
          subtle: '#94A3B8',
        },
        fire: {
          DEFAULT: '#FF5722', // Vibrant Electric Fire Orange
          hover: '#EA580C',
          light: '#FFF1ED',
          subtle: '#FED7AA',
        },
        modis: {
          DEFAULT: '#F59E0B', // Amber 500
          light: '#FEF3C7',
          border: '#FDE68A',
        },
        viirs: {
          DEFAULT: '#0EA5E9', // Sky 500 Electric Cyan
          light: '#E0F2FE',
          border: '#BAE6FD',
        },
        nature: {
          green: '#10B981', // Emerald 500
          ochre: '#D97706', // Amber 600
          red: '#EF4444',   // Red 500
        }
      },
      fontFamily: {
        serif: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        display: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02)',
        'float': '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
      }
    },
  },
  plugins: [],
}

