/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F9F9F7',
        ink: '#111111',
        editorial: '#CC0000',
        newsprint: {
          bg: '#F9F9F7',
          fg: '#111111',
          muted: '#E5E5E0',
          accent: '#CC0000',
          border: '#111111'
        },
        dark: {
          bg: '#F9F9F7',
          card: '#F9F9F7',
          border: '#111111',
          text: '#111111'
        },
        brand: {
          primary: '#111111',
          secondary: '#737373',
          accent: '#CC0000',
          warning: '#CC0000'
        },
        cli: {
          bg: '#F9F9F7',
          primary: '#111111',
          secondary: '#525252',
          muted: '#A3A3A3',
          border: '#111111',
          error: '#CC0000'
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Lora"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Courier New', 'monospace']
      }
    },
  },
  plugins: [],
}

