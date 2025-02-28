/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'peach': '#FED1BD',
        'candy-pink': '#fb8f9c',
        'nba-orange': '#fc5203',
        spectral: {
          observer: {
            main: '#222222',
            accent: '#007BFF'
          },
          catalyst: {
            main: '#FF4500',
            accent: '#FFD700'
          },
          synthesizer: {
            main: '#8A2BE2',
            accent: '#E5C100'
          },
          archivist: {
            main: '#6B4226',
            accent: '#F5E6CC'
          },
          visionary: {
            main: '#4B0082',
            accent: '#00FFFF'
          },
          technician: {
            main: '#4682B4',
            accent: '#C0C0C0'
          },
          interfacer: {
            main: '#20B2AA',
            accent: '#D3D3D3'
          },
          explorer: {
            main: '#228B22',
            accent: '#D2B48C'
          },
          philosopher: {
            main: '#1E3A5F',
            accent: '#000000'
          }
        }
      },
      fontFamily: {
        karla: ['var(--font-karla)'],
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(-45%, -45%) rotate(0deg)' },
          '50%': { transform: 'translate(-45%, -45%) rotate(15deg)' },
          '100%': { transform: 'translate(-45%, -45%) rotate(-15deg)' },
        },
        'blob-bottom': {
          '0%': { transform: 'translate(45%, 45%) rotate(0deg)' },
          '50%': { transform: 'translate(45%, 45%) rotate(-25deg)' },
          '100%': { transform: 'translate(45%, 45%) rotate(25deg)' },
        },
        'blob-top-right': {
          '0%': { transform: 'translate(45%, -35%) rotate(-25deg)' },
          '50%': { transform: 'translate(45%, -35%) rotate(0deg)' },
          '100%': { transform: 'translate(45%, -35%) rotate(25deg)' },
        },
        'blob-middle': {
          '0%': { transform: 'translate(-45%, -50%) rotate(-5deg)' },
          '50%': { transform: 'translate(-45%, -50%) rotate(5deg)' },
          '100%': { transform: 'translate(-45%, -50%) rotate(-5deg)' },
        },
        'blob-right': {
          '0%': { transform: 'translate(45%, -50%) rotate(5deg)' },
          '50%': { transform: 'translate(45%, -50%) rotate(-5deg)' },
          '100%': { transform: 'translate(45%, -50%) rotate(5deg)' },
        },
      },
      animation: {
        'blob': 'blob 6.72s ease-in-out infinite alternate',
        'blob-delayed': 'blob-bottom 6.72s ease-in-out infinite alternate-reverse',
        'blob-top-right': 'blob-top-right 8.4s ease-in-out infinite alternate',
        'blob-middle': 'blob-middle 8.08s ease-in-out infinite alternate',
        'blob-right': 'blob-right 8.96s ease-in-out infinite alternate-reverse',
      },
    },
  },
  plugins: [],
};

export default config;
