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
          DEFAULT: '#0D1F3C',
          light: '#1a3260',
          dark: '#081629',
        },
        'cyan-accent': '#2ECAD5',
      },
    },
  },
  plugins: [],
}

