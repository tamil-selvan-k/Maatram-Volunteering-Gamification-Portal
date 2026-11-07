/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        gold:    { DEFAULT: '#F5B800', light: '#FFD140', dark: '#D4A000' },
        surface: { DEFAULT: '#1A1A1F', elevated: '#22222A', overlay: '#2D2D35' },
        border:  { DEFAULT: '#2A2A30', strong: '#3A3A42' },
        bg:      { DEFAULT: '#0D0D0F', secondary: '#111115' },
        muted:   '#9CA3AF',
      },
    },
  },
  plugins: [],
}
