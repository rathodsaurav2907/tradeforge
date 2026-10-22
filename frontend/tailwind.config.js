/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0B0E14',
          800: '#151922',
          700: '#1F2430',
          600: '#2A3142',
        },
        trade: {
          green: '#00C076',
          greenHover: '#00A868',
          red: '#FF4D4F',
          redHover: '#E03E40',
          cyan: '#00F0FF',
          blue: '#2F80ED',
        }
      }
    },
  },
  plugins: [],
}
