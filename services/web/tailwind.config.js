/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,js,svelte,ts}',
    './node_modules/preline/dist/*.js'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lato', 'Helvetica', 'sans-serif']
      },
      colors: {
        primary: {
          DEFAULT: '#7254F3',
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7254F3',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95'
        }
      }
    }
  },
  plugins: []
};
