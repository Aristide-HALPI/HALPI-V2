/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Activer le mode sombre basé sur la classe
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FBF7E9',
          100: '#F7EFD3',
          200: '#EFDFAA',
          300: '#E7CF80',
          400: '#DEBF57',
          500: '#D1A225', // jaune/doré des boutons
          600: '#A78120',
          700: '#7D611A',
          800: '#544013',
          900: '#2A200A',
        },
        gold: '#D1A225',    // couleur dorée exacte de l'ancien site
        dark: '#1E1E1E',    // fond sidebar
        light: '#F9FAFB',   // fonds de cartes/pages
        text: '#1F2A3A',    // texte principal
        accent: {
          50: '#E9F5FF',
          100: '#D3EBFF',
          200: '#A8D7FF',
          300: '#7CC2FF',
          400: '#51AEFF',
          500: '#2D8CFF',  // couleur secondaire
          600: '#0070FF',
          700: '#0058CC',
          800: '#004099',
          900: '#002866',
        },
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        error: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 10px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 10px 25px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
