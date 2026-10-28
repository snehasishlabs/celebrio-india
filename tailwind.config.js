/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm Ivory Palette (Backgrounds and light surfaces)
        ivory: {
          50: '#FDFBF7',
          100: '#FAF6F0', // Base app canvas
          200: '#F5EFE6', // Card surface
          300: '#EBE3D7', // Border & divider line
          400: '#DFD5C5',
          500: '#C9BCAB',
        },
        // Deep Forest Green (Primary Brand & Navigation)
        forest: {
          50: '#F1F7F4',
          100: '#E0EDE6',
          200: '#C1DBCF',
          300: '#94BFAC',
          400: '#5F9B80',
          500: '#2E6E52',
          600: '#21543E',
          700: '#1B4332', // Primary brand deep forest
          800: '#143326', // Darker forest header/nav
          900: '#0E241B', // Deepest forest green
          950: '#07150F',
        },
        // Muted Terracotta (Selected Accents, alerts, highlights)
        terracotta: {
          50: '#FDF7F5',
          100: '#FAEBE6',
          200: '#F4D4CA',
          300: '#EAB7A7',
          400: '#DC8E78',
          500: '#C86D51', // Signature muted terracotta
          600: '#B4573B',
          700: '#96442B',
          800: '#7A3824',
          900: '#643121',
        },
        // Restrained Gold (Subtle highlights, milestones, tier badges)
        gold: {
          50: '#FCF9F1',
          100: '#F8F1DC',
          200: '#EFE1B8',
          300: '#E3CC8D',
          400: '#D5B463',
          500: '#C5A059', // Refined muted antique gold
          600: '#A98342',
          700: '#876532',
          800: '#6E502B',
          900: '#5C4226',
        },
        // Dark, Readable Charcoal Text
        charcoal: {
          50: '#F6F6F6',
          100: '#E7E8E7',
          200: '#CFD1CF',
          300: '#B0B4B0',
          400: '#7B807B',
          500: '#5A605A',
          600: '#404540',
          700: '#2E322E',
          800: '#202320', // High-contrast text
          900: '#151715', // Pure dark readable text
        },
        // Semantic states
        status: {
          success: '#1B4332',
          warning: '#C5A059',
          danger: '#C86D51',
          info: '#2D5A43',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', '"Noto Serif Devanagari"', '"Noto Serif Bengali"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', '"Noto Sans Devanagari"', '"Noto Sans Bengali"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(21, 23, 21, 0.04)',
        'card': '0 2px 6px -1px rgba(21, 23, 21, 0.06), 0 1px 4px -1px rgba(21, 23, 21, 0.03)',
        'elevated': '0 8px 24px -4px rgba(21, 23, 21, 0.08), 0 4px 12px -2px rgba(21, 23, 21, 0.04)',
        'modal': '0 20px 40px -8px rgba(14, 36, 27, 0.22)',
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1.125rem',
      }
    },
  },
  plugins: [],
}
