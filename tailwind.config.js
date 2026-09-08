/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: '#667eea',
        sidebar: '#1a2332',
        'sidebar-dark': '#0d1b2a',
      },
    },
  },
  plugins: [],
}
