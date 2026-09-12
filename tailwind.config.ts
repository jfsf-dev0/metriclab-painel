import type { Config } from 'tailwindcss';

const config: Config = {
  presets: [require('metriclab-ui/tailwind')],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/metriclab-ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F7F5',
        surface: '#FFFFFF',
        hairline: '#E2E2DC',
        'hairline-soft': '#EFEFED',
        ink: '#111111',
        'ink-soft': '#374151',
        muted: '#9CA3AF',
        accent: '#F5A623',
        erro: '#DC2626',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
