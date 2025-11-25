/**
 * Design System Professionnel - TheraFlow Pro
 *
 * Inspiré de: Notion, Linear, Stripe Dashboard, Vercel
 *
 * Principes:
 * - Minimaliste et élégant
 * - Hiérarchie visuelle claire
 * - Espace blanc généreux
 * - Typographie professionnelle
 * - Couleurs subtiles et cohérentes
 * - Micro-interactions fluides
 */

export const designSystem = {
  // Palette de couleurs professionnelle
  colors: {
    // Primaire - Bleu professionnel (accent principal)
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9', // Couleur principale
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },

    // Neutre - Gris professionnel (textes, fonds)
    neutral: {
      0: '#ffffff',
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a',
    },

    // Success - Vert subtil
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
    },

    // Warning - Orange subtil
    warning: {
      50: '#fff7ed',
      500: '#f97316',
      600: '#ea580c',
    },

    // Error - Rouge subtil
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626',
    },

    // Info - Bleu clair
    info: {
      50: '#eff6ff',
      500: '#3b82f6',
      600: '#2563eb',
    },
  },

  // Typographie professionnelle
  typography: {
    fontFamily: {
      sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
    },

    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
    },

    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },

    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Espacements cohérents (système 4px)
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },

  // Rayons de bordure (moins arrondis = plus pro)
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    '2xl': '1rem',   // 16px
    full: '9999px',
  },

  // Ombres subtiles
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    none: 'none',
  },

  // Transitions fluides
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: '300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Z-index hiérarchie
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
};

// Classes Tailwind réutilisables (composants)
export const components = {
  // Boutons professionnels
  button: {
    base: 'inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',

    primary: 'bg-neutral-900 text-white hover:bg-neutral-800 focus:ring-neutral-900',
    secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus:ring-neutral-500',
    outline: 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50 focus:ring-neutral-500',
    ghost: 'text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-500',
    danger: 'bg-error-500 text-white hover:bg-error-600 focus:ring-error-500',

    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-lg',
  },

  // Cartes élégantes
  card: {
    base: 'bg-white border border-neutral-200 rounded-xl transition-all',
    hover: 'hover:shadow-md hover:border-neutral-300',
    interactive: 'cursor-pointer active:scale-[0.98]',
  },

  // Inputs minimalistes
  input: {
    base: 'w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all',
    error: 'border-error-500 focus:ring-error-500',
  },

  // Badges subtils
  badge: {
    base: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
    success: 'bg-success-50 text-success-700 border border-success-200',
    warning: 'bg-warning-50 text-warning-700 border border-warning-200',
    error: 'bg-error-50 text-error-700 border border-error-200',
    info: 'bg-info-50 text-info-700 border border-info-200',
    neutral: 'bg-neutral-100 text-neutral-700 border border-neutral-200',
  },
};

// Icônes système (Lucide React)
export const iconSizes = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
};

// Animations micro-interactions
export const animations = {
  fadeIn: 'animate-[fadeIn_200ms_ease-out]',
  fadeOut: 'animate-[fadeOut_200ms_ease-in]',
  slideUp: 'animate-[slideUp_300ms_ease-out]',
  slideDown: 'animate-[slideDown_300ms_ease-out]',
  scaleIn: 'animate-[scaleIn_200ms_ease-out]',
  scaleOut: 'animate-[scaleOut_200ms_ease-in]',
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
};

// Layout professionnel
export const layout = {
  // Sidebar desktop
  sidebar: {
    width: '240px',
    widthCollapsed: '64px',
  },

  // Header mobile
  headerHeight: '64px',

  // Navigation bottom mobile
  navBottomHeight: '64px',

  // Conteneur principal
  container: {
    maxWidth: '1280px',
    padding: '24px',
  },

  // Grille responsive
  grid: {
    cols1: 'grid-cols-1',
    cols2: 'grid-cols-1 md:grid-cols-2',
    cols3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    cols4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    gap: 'gap-6',
  },
};

// Breakpoints responsive
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Exemples d'utilisation
export const examples = {
  // Bouton primaire
  primaryButton: `
    <button className="${components.button.base} ${components.button.primary} ${components.button.md}">
      Enregistrer
    </button>
  `,

  // Carte interactive
  interactiveCard: `
    <div className="${components.card.base} ${components.card.hover} ${components.card.interactive} p-6">
      <h3 className="text-lg font-semibold text-neutral-900">Titre</h3>
      <p className="text-sm text-neutral-600 mt-2">Description</p>
    </div>
  `,

  // Input avec label
  inputWithLabel: `
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Email
      </label>
      <input
        type="email"
        className="${components.input.base}"
        placeholder="nom@exemple.fr"
      />
    </div>
  `,

  // Badge de statut
  statusBadge: `
    <span className="${components.badge.base} ${components.badge.success}">
      Actif
    </span>
  `,
};

export default designSystem;
