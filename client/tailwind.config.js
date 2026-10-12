/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── User Palette: #84A282, #B8CFB3, #FEFAF3, #F6E2E9 ──────────────
        sage:    '#84A282',   // Primary Botanical Sage
        laurel:  '#B8CFB3',   // Soft Laurel Green
        ivory:   '#FEFAF3',   // Warm Ivory (main bg)
        blush:   '#F6E2E9',   // Pastel Rose Blush

        // ── Background / Surface ─────────────────────────────────────────
        bg:       '#FEFAF3',  // Main background = Ivory
        surface:  '#FFFFFF',  // Card white
        raised:   '#F5F0E8',  // Raised surfaces
        elevated: '#EDE8DE',  // Elevated panels

        // ── Accent / Primary aliases ─────────────────────────────────────
        primary:        '#84A282',   // Primary sage
        'primary-soft': '#B8CFB3',   // Laurel
        'primary-dark': '#5E7A5C',   // Forest sage
        accent:         '#84A282',   // Primary sage
        'accent-soft':  '#B8CFB3',   // Laurel
        'accent-blush': '#F6E2E9',   // Blush

        // ── Text ─────────────────────────────────────────────────────────
        'text-main':      '#2D3A2C',
        'text-secondary': '#4A5E49',
        'text-muted':     '#7A8E79',

        // ── Semantic ─────────────────────────────────────────────────────
        success: '#84A282',
        warning: '#C4956A',
        danger:  '#C0645A',

        // ── Borders ──────────────────────────────────────────────────────
        border:          'rgba(132, 162, 130, 0.25)',
        'border-strong': 'rgba(132, 162, 130, 0.45)',
        'border-blush':  'rgba(246, 226, 233, 0.70)',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        mono:    ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      borderRadius: {
        card:  '16px',
        lg:    '16px',
        input: '12px',
        btn:   '12px',
      },
      boxShadow: {
        'glow':        '0 0 28px rgba(132, 162, 130, 0.30), 0 4px 16px rgba(132, 162, 130, 0.15)',
        'glow-sm':     '0 0 14px rgba(132, 162, 130, 0.22), 0 2px 8px rgba(132, 162, 130, 0.12)',
        'glow-xs':     '0 0 8px rgba(184, 207, 179, 0.20)',
        'glow-blush':  '0 0 22px rgba(246, 226, 233, 0.50), 0 4px 12px rgba(246, 226, 233, 0.25)',
        'glow-accent': '0 0 24px rgba(132, 162, 130, 0.35)',
        'card':        '0 2px 16px rgba(132, 162, 130, 0.10), 0 1px 4px rgba(0,0,0,0.04)',
        'card-hover':  '0 8px 32px rgba(132, 162, 130, 0.20), 0 0 20px rgba(132, 162, 130, 0.15)',
        'blush-card':  '0 2px 16px rgba(246, 226, 233, 0.35), 0 1px 4px rgba(246, 226, 233, 0.20)',
      },
      spacing: { 18: '4.5rem', 22: '5.5rem' },
      keyframes: {
        shimmer: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 12px rgba(132, 162, 130, 0.40))' },
          '50%':      { opacity: '0.7', filter: 'drop-shadow(0 0 4px rgba(132, 162, 130, 0.15))' },
        },
      },
      animation: {
        shimmer:      'shimmer 1.6s infinite',
        'fade-in':    'fade-in 0.3s ease-out',
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
      },
      backgroundImage: {
        'botanical-gradient': 'linear-gradient(135deg, #FEFAF3 0%, #F5F0E8 50%, #FEFAF3 100%)',
        'sage-gradient':      'linear-gradient(135deg, #84A282 0%, #B8CFB3 100%)',
        'blush-gradient':     'linear-gradient(135deg, #F6E2E9 0%, #FEFAF3 100%)',
        'hero-gradient':      'linear-gradient(145deg, #84A282 0%, #B8CFB3 50%, #FEFAF3 100%)',
      },
    },
  },
  plugins: [],
}
