/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: '#bd8c0f',
        'dark-blue': '#1a2b4b',
      },
    },
  },
  plugins: [],
};