/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream:     '#F0EDE5',
        'cream-dark': '#E5E0D5',
        teal: {
          DEFAULT: '#004643',
          50:  '#E6F0EF',
          100: '#B3D0CE',
          200: '#80B0AD',
          300: '#4D908C',
          400: '#1A706B',
          500: '#004643',
          600: '#003D3A',
          700: '#003330',
          800: '#002A27',
          900: '#00201E',
        },
      },
      fontFamily: {
        playfair: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'teal-sm': '0 2px 8px rgba(0, 70, 67, 0.12)',
        'teal-md': '0 4px 16px rgba(0, 70, 67, 0.18)',
        'teal-lg': '0 8px 32px rgba(0, 70, 67, 0.24)',
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};