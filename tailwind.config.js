/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0F2744', 600: '#1a3a5c', 700: '#13314f' },
        ink: { DEFAULT: '#111827', soft: '#6B7280', faint: '#9CA3AF' },
        // Semantic — health & status. Keep names meaningful so screens stay readable.
        ok: '#059669',
        warn: '#D97706',
        danger: '#DC2626',
        info: '#2563EB',
        siaga1: '#D97706',
        siaga2: '#EA580C',
        siaga3: '#DC2626',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
