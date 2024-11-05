/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        naranja: {
          DEFAULT: '#f97316',
          oscuro: '#ea580c',
          claro: '#fdba74',
        },
        gris: {
          DEFAULT: '#6b7280',
          oscuro: '#4b5563',
          claro: '#d1d5db',
        },
        azul: {
          DEFAULT: '#3b82f6',
          oscuro: '#1e40af',
          claro: '#93c5fd',
        },
        rojo: {
          DEFAULT: '#ef4444',
          oscuro: '#dc2626',
          claro: '#fca5a5',
        },
      },
    },
  },
  plugins: [],
};
