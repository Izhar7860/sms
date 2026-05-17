/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Keep Tailwind palette predictable across dark/light.
        primary: '#2563eb',
      },
    },
  },
  plugins: [],
}

