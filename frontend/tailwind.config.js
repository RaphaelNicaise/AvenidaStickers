/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0ecf9',   // Color más claro (tu #f0ecf9)
          100: '#e5dcf5',
          200: '#d4c5f1',
          300: '#c0a8ec',
          400: '#a685e6',
          500: '#2907f0',   // Color principal (tu #2907f0)
          600: '#2e14c1',   // Color medio (tu #2e14c1)
          700: '#321ca7',   // Color más oscuro (tu #321ca7)
          800: '#281576',
          900: '#1d0f5a',
        },
        accent: {
          light: '#f0ecf9',
          DEFAULT: '#2907f0',
          dark: '#321ca7',
        }
      },
      fontFamily: {
        'sans': ['SUSE', 'ui-sans-serif', 'system-ui'],
        'modern': ['SUSE', 'ui-sans-serif', 'system-ui'],
        'artistic': ['SUSE', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(41, 7, 240, 0.1), 0 4px 6px -2px rgba(41, 7, 240, 0.05)',
        'card': '0 4px 20px -2px rgba(41, 7, 240, 0.15)',
      }
    }
  },
  plugins: [],
}