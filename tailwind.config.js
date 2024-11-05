// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}'], // Ajusta esta ruta según tu estructura
  theme: {
    extend: {
      colors: {
        primary: '#1E1E2F',
        secondary: '#2D2D44',
        accent: '#4F46E5',
        background: '#F5F5F5',
        textPrimary: '#111827',
        textSecondary: '#6B7280',
        border: '#E5E7EB',
        danger: '#EF4444',
        success: '#10B981',
      },
    },
  },
  plugins: [],
};
