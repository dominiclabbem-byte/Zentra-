/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0D1F3C',
          light: '#1a3260',
          dark: '#081629',
          950: '#060e1e',
        },
        cyan: {
          accent: '#2ECAD5',
          light: '#5DD9E2',
          dark: '#1BA8B2',
          glow: '#2ECAD5',
        },
        gold: {
          DEFAULT: '#F5A623',
          light: '#FBBF24',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-premium': 'linear-gradient(135deg, #0D1F3C 0%, #1a3260 50%, #0D1F3C 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'gradient-accent': 'linear-gradient(135deg, #2ECAD5 0%, #1BA8B2 100%)',
      },
      boxShadow: {
        'premium': '0 4px 24px -4px rgba(13, 31, 60, 0.12)',
        'premium-lg': '0 8px 40px -8px rgba(13, 31, 60, 0.16)',
        'premium-xl': '0 20px 60px -12px rgba(13, 31, 60, 0.2)',
        'glow': '0 0 20px rgba(46, 202, 213, 0.3)',
        'glow-sm': '0 0 10px rgba(46, 202, 213, 0.2)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255,255,255,0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(46, 202, 213, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(46, 202, 213, 0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
}
