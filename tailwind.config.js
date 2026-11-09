/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aviation: {
          bg: '#F5F7FA',
          sidebar: '#FFFFFF',
          card: '#FFFFFF',
          navy: '#17365D',
          navyDark: '#0F233D',
          accent: '#2878D0',
          accentHover: '#1E63B0',
          lightBlue: '#EAF3FC',
          lightBlueHover: '#DCEBFA',
          success: '#16A36A',
          successBg: '#E8F7F0',
          warning: '#E99A25',
          warningBg: '#FEF6E9',
          danger: '#DC4545',
          dangerBg: '#FCEBEB',
          text: '#202B3C',
          textSecondary: '#718096',
          textMuted: '#94A3B8',
          border: '#E4EAF1',
          borderDark: '#CBD5E1',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Courier New', 'monospace']
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)',
        'card': '0 2px 4px -1px rgba(0, 0, 0, 0.04), 0 4px 6px -1px rgba(0, 0, 0, 0.02)',
        'elevated': '0 10px 15px -3px rgba(15, 23, 42, 0.06), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
      }
    },
  },
  plugins: [],
}

