/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#e94560',
        secondary: '#0f3460',
      },
      fontFamily: {
        bengali: ['Hind Siliguri', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
