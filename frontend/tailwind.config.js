export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui'] },
      boxShadow: {
        glow: '0 0 32px rgba(56, 189, 248, 0.38)',
        card: '0 18px 50px rgba(0, 0, 0, 0.35)',
      },
      colors: { night: '#060913' },
      borderRadius: { '3xl': '1.5rem', '4xl': '2rem' },
      keyframes: {
        fadeIn: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: { fadeIn: 'fadeIn 0.45s ease-out both' },
    },
  },
  plugins: [],
};
