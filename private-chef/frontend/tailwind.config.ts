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
          50:  '#F0F5E5',
          100: '#E0EBC8',
          200: '#C8DBA8',
          300: '#B5D199',
          400: '#9CC084',
          DEFAULT: '#7AA468',
          500: '#7AA468',
          600: '#6B8E5A',
          700: '#4A6B3A',
        },
        cream: {
          50:  '#F8FBF2',
          100: '#F3F7EB',
          200: '#ECF1E0',
          300: '#DCE5C8',
          400: '#C2D0A8',
        },
        ink: {
          900: '#1A1A18',
          800: '#2C2C28',
          700: '#3D3D38',
          600: '#5C5C56',
          500: '#7A7A72',
          400: '#A5A39B',
        },
        honey: {
          100: '#FDF1D9',
          300: '#F4CE85',
          DEFAULT: '#F0B564',
          500: '#F0B564',
          700: '#B47A22',
        },
        blush: {
          100: '#FCEAE0',
          DEFAULT: '#F4D5C7',
          300: '#F4D5C7',
          500: '#E8B59E',
          700: '#B47565',
        },
        sky: {
          100: '#ECF3F5',
          DEFAULT: '#D5E5E8',
          300: '#D5E5E8',
          500: '#9BBEC4',
          700: '#4A7080',
        },
        butter: {
          100: '#FBF6E3',
          DEFAULT: '#F2E5BD',
          300: '#F2E5BD',
          500: '#D9C285',
          700: '#9A7C2E',
        },
        /* legacy alias for backcompat */
        mustard: { 100: '#FDF1D9', 300: '#F4CE85', 500: '#F0B564', 700: '#B47A22' },
        amber: { 100: '#FBF6E3', 500: '#F0B564' },
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
        card: 'var(--elev-2)',
        elevated: 'var(--elev-3)',
        sheet: 'var(--elev-4)',
        button: 'inset 0 -2px 0 rgba(74,107,58,0.20), 0 1px 2px rgba(26,26,24,0.10)',
        'button-inverse': 'inset 0 -2px 0 rgba(0,0,0,0.25), 0 1px 2px rgba(31,24,21,0.18)',
        glass: 'var(--elev-2)',
        'glass-lg': 'var(--elev-3)',
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
