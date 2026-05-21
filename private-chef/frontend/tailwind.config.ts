import type { Config } from 'tailwindcss'
import tailwindAnimate from 'tailwindcss-animate'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      spacing: {
        safe: 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
      },
      colors: {
        brand: {
          50: '#FFF1EB',
          100: '#FFDFCD',
          200: '#FFC2A4',
          300: '#FB9670',
          400: '#F37A4F',
          DEFAULT: '#EE6E47',
          600: '#D6552F',
          700: '#B23E1F',
        },
        cream: {
          50: '#FAF6EE',
          100: '#FAF6EE',
          200: '#F4EDDF',
          300: '#E8DFD3',
          400: '#C9BCA8',
        },
        ink: {
          900: '#1F1815',
          800: '#2D2420',
          700: '#3D332C',
          600: '#5C4F46',
          500: '#7B6E63',
          400: '#9C8E81',
        },
        sage: { 100: '#E8EDD8', 200: '#D9E2BB', 300: '#BCC993', 500: '#6B7B3C', 700: '#4A5A28' },
        mustard: { 100: '#FCEFD0', 300: '#F1C66E', 500: '#D97706', 700: '#A35908' },
        rust: { 100: '#F8D5C7', 300: '#E8997C', 500: '#B23E1F', 700: '#7E2A12' },
        amber: { 100: '#FCEFD0', 500: '#D97706' },
        rose: { 100: '#FCE4E4', 500: '#B91C1C' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'Hiragino Sans GB', 'Heiti SC', 'sans-serif'],
        serif: ['"Noto Serif SC"', '"Songti SC"', 'SimSun', 'serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        card: 'var(--radius-card)',
        modal: 'var(--radius-modal)',
        '4xl': '32px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(31, 24, 21, 0.04)',
        elevated: '0 8px 24px rgba(31, 24, 21, 0.08)',
        sheet: '0 -8px 32px rgba(31, 24, 21, 0.12)',
        button: '0 2px 0 rgba(178, 62, 31, 0.2)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindAnimate],
} satisfies Config
