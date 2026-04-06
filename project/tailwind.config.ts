import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:       '#0d0d0d',
        surface:  '#141414',
        surface2: '#1a1a1a',
        border:   'hsl(var(--border))',
        accent:   '#ff6d3b',
        accent2:  '#ff9a6c',
        muted:    'hsl(var(--muted))',
        muted2:   '#999999',
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
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        hero: {
          heading: 'hsl(var(--hero-heading))',
          sub: 'hsl(var(--hero-sub))',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'float':  'float 5s ease-in-out infinite',
        'blink':  'blink 1.8s ease infinite',
        'scroll': 'scrollLeft 30s linear infinite',
        'fadeUp': 'fadeUp 0.5s ease forwards',
        'marquee': 'marquee 20s linear infinite',
      },
      keyframes: {
        float:      { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        blink:      { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.2' } },
        scrollLeft: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        fadeUp:     { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
