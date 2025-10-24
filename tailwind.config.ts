import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Professional Light Theme
        bg: '#FFFFFF',           // White background
        panel: '#F8FAFC',        // Light gray panels
        subtle: '#F1F5F9',        // Subtle gray for hover states
        border: '#E2E8F0',       // Light gray borders
        text: {
          base: '#1E3A8A',       // Dark blue primary text
          muted: '#64748B',       // Medium gray secondary text
          dim: '#94A3B8',         // Light gray dim text
        },
        primary: {
          DEFAULT: '#1E3A8A',     // Dark blue primary
          fg: '#FFFFFF',          // White text on primary
        },
        success: '#10B981',       // Green for success
        warning: '#F59E0B',       // Orange for warnings
        danger: '#EF4444',        // Red for errors
        hover: '#DBEAFE',         // Light blue hover
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '10px',
      },
      spacing: {
        '1.5': '0.375rem',
      },
      transitionProperty: {
        'all': 'all',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
      },
    },
  },
  plugins: [],
} satisfies Config;


