/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070d1e',
          900: '#0b1329',
          850: '#101a38',
          800: '#172554',
          700: '#1e3a8a',
          600: '#2563eb',
        },
        civic: {
          teal: '#0d9488',
          'teal-light': '#14b8a6',
          'teal-dark': '#0f766e',
          'teal-bg': '#f0fdfa',
          navy: '#0f172a',
          surface: '#f8fafc',
          border: '#e2e8f0',
        },
        risk: {
          green: '#16a34a',
          'green-bg': '#f0fdf4',
          'green-border': '#86efac',
          yellow: '#ca8a04',
          'yellow-bg': '#fefce8',
          'yellow-border': '#fde047',
          orange: '#ea580c',
          'orange-bg': '#fff7ed',
          'orange-border': '#fdba74',
          red: '#dc2626',
          'red-bg': '#fef2f2',
          'red-border': '#fca5a5',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
