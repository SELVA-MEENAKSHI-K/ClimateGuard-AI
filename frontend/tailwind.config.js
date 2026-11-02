/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        tamil: ['"Noto Sans Tamil"', 'sans-serif'],
        sans: ['Inter', '"Noto Sans Tamil"', 'system-ui', 'sans-serif'],
      },
      colors: {
        agri: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        earth: {
          50: '#fdf8f4',
          100: '#f9eee3',
          200: '#f1dac5',
          300: '#e5be9e',
          400: '#d59b72',
          500: '#b87547',
          600: '#9d5a35',
          700: '#7e442c',
          800: '#673827',
          900: '#542f22',
        }
      }
    },
  },
  plugins: [],
}
