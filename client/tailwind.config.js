/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9fc',
          100: '#e0f3fa',
          200: '#b8e6f5',
          300: '#7ed4ee',
          400: '#3cbce4',
          500: '#19b6e6', // Primary Accent #19b6e6
          600: '#0c96c4',
          700: '#0d789f',
          800: '#106180',
          900: '#12516b',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        'card': '0 2px 8px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 15px -3px rgba(25, 182, 230, 0.25)',
      }
    },
  },
  plugins: [],
}
