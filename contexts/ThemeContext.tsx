import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * Système de thèmes et mode sombre
 * Supporte: light, dark, auto (selon heure)
 */

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

interface ThemeConfig {
  mode: ThemeMode;
  actualTheme: 'light' | 'dark'; // Theme réellement appliqué
  colors: ThemeColors;
  fontSize: 'small' | 'medium' | 'large';
  fontFamily: string;
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  animations: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
}

interface ThemeContextType {
  theme: ThemeConfig;
  setMode: (mode: ThemeMode) => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  setFontFamily: (family: string) => void;
  setBorderRadius: (radius: 'none' | 'small' | 'medium' | 'large') => void;
  toggleAnimations: () => void;
  toggleHighContrast: () => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Thèmes par défaut
const lightTheme: ThemeColors = {
  primary: '#8B5CF6',
  secondary: '#EC4899',
  accent: '#10B981',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6'
};

const darkTheme: ThemeColors = {
  primary: '#A78BFA',
  secondary: '#F472B6',
  accent: '#34D399',
  background: '#111827',
  surface: '#1F2937',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  border: '#374151',
  error: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  info: '#60A5FA'
};

const highContrastLight: ThemeColors = {
  primary: '#5B21B6',
  secondary: '#BE185D',
  accent: '#047857',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  text: '#000000',
  textSecondary: '#374151',
  border: '#000000',
  error: '#991B1B',
  success: '#065F46',
  warning: '#92400E',
  info: '#1E3A8A'
};

const highContrastDark: ThemeColors = {
  primary: '#DDD6FE',
  secondary: '#FBCFE8',
  accent: '#6EE7B7',
  background: '#000000',
  surface: '#000000',
  text: '#FFFFFF',
  textSecondary: '#D1D5DB',
  border: '#FFFFFF',
  error: '#FECACA',
  success: '#A7F3D0',
  warning: '#FDE68A',
  info: '#BFDBFE'
};

const defaultTheme: ThemeConfig = {
  mode: 'light',
  actualTheme: 'light',
  colors: lightTheme,
  fontSize: 'medium',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  borderRadius: 'medium',
  animations: true,
  reducedMotion: false,
  highContrast: false
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    // Charger depuis localStorage
    const saved = localStorage.getItem('theraflow_theme');
    if (saved) {
      try {
        return { ...defaultTheme, ...JSON.parse(saved) };
      } catch {
        return defaultTheme;
      }
    }

    // Détecter préférence système
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return {
      ...defaultTheme,
      mode: 'auto',
      actualTheme: prefersDark ? 'dark' : 'light',
      colors: prefersDark ? darkTheme : lightTheme,
      reducedMotion: prefersReducedMotion,
      animations: !prefersReducedMotion
    };
  });

  // Déterminer le thème actuel selon le mode
  const determineActualTheme = (mode: ThemeMode): 'light' | 'dark' => {
    if (mode === 'auto') {
      const hour = new Date().getHours();
      // Mode nuit de 20h à 7h
      return (hour >= 20 || hour < 7) ? 'dark' : 'light';
    }
    return mode;
  };

  // Appliquer le thème au DOM
  useEffect(() => {
    const actualTheme = determineActualTheme(theme.mode);
    const colors = theme.highContrast
      ? (actualTheme === 'dark' ? highContrastDark : highContrastLight)
      : (actualTheme === 'dark' ? darkTheme : lightTheme);

    // Mettre à jour les CSS variables
    const root = document.documentElement;
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-surface', colors.surface);
    root.style.setProperty('--color-text', colors.text);
    root.style.setProperty('--color-text-secondary', colors.textSecondary);
    root.style.setProperty('--color-border', colors.border);
    root.style.setProperty('--color-error', colors.error);
    root.style.setProperty('--color-success', colors.success);
    root.style.setProperty('--color-warning', colors.warning);
    root.style.setProperty('--color-info', colors.info);

    // Font size
    const fontSizes = { small: '14px', medium: '16px', large: '18px' };
    root.style.setProperty('--font-size-base', fontSizes[theme.fontSize]);

    // Font family
    root.style.setProperty('--font-family', theme.fontFamily);

    // Border radius
    const radii = { none: '0', small: '0.375rem', medium: '0.75rem', large: '1rem' };
    root.style.setProperty('--border-radius', radii[theme.borderRadius]);

    // Animations
    if (!theme.animations || theme.reducedMotion) {
      root.style.setProperty('--transition-duration', '0ms');
    } else {
      root.style.setProperty('--transition-duration', '200ms');
    }

    // Classe dark sur body
    if (actualTheme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }

    // Mettre à jour le theme state
    if (theme.actualTheme !== actualTheme || JSON.stringify(theme.colors) !== JSON.stringify(colors)) {
      setTheme(prev => ({
        ...prev,
        actualTheme,
        colors
      }));
    }

    // Sauvegarder dans localStorage
    localStorage.setItem('theraflow_theme', JSON.stringify(theme));
  }, [theme]);

  // Vérifier le mode auto toutes les minutes
  useEffect(() => {
    if (theme.mode !== 'auto') return;

    const interval = setInterval(() => {
      const newActualTheme = determineActualTheme('auto');
      if (newActualTheme !== theme.actualTheme) {
        const colors = theme.highContrast
          ? (newActualTheme === 'dark' ? highContrastDark : highContrastLight)
          : (newActualTheme === 'dark' ? darkTheme : lightTheme);

        setTheme(prev => ({
          ...prev,
          actualTheme: newActualTheme,
          colors
        }));
      }
    }, 60000); // Chaque minute

    return () => clearInterval(interval);
  }, [theme.mode, theme.actualTheme, theme.highContrast]);

  // Détecter changement préférence système
  useEffect(() => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleDarkModeChange = (e: MediaQueryListEvent) => {
      if (theme.mode === 'auto') {
        const newActualTheme = e.matches ? 'dark' : 'light';
        const colors = theme.highContrast
          ? (newActualTheme === 'dark' ? highContrastDark : highContrastLight)
          : (newActualTheme === 'dark' ? darkTheme : lightTheme);

        setTheme(prev => ({
          ...prev,
          actualTheme: newActualTheme,
          colors
        }));
      }
    };

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setTheme(prev => ({
        ...prev,
        reducedMotion: e.matches,
        animations: !e.matches
      }));
    };

    darkModeQuery.addEventListener('change', handleDarkModeChange);
    motionQuery.addEventListener('change', handleMotionChange);

    return () => {
      darkModeQuery.removeEventListener('change', handleDarkModeChange);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, [theme.mode, theme.highContrast]);

  const setMode = (mode: ThemeMode) => {
    const actualTheme = determineActualTheme(mode);
    const colors = theme.highContrast
      ? (actualTheme === 'dark' ? highContrastDark : highContrastLight)
      : (actualTheme === 'dark' ? darkTheme : lightTheme);

    setTheme(prev => ({
      ...prev,
      mode,
      actualTheme,
      colors
    }));
  };

  const setFontSize = (fontSize: 'small' | 'medium' | 'large') => {
    setTheme(prev => ({ ...prev, fontSize }));
  };

  const setFontFamily = (fontFamily: string) => {
    setTheme(prev => ({ ...prev, fontFamily }));
  };

  const setBorderRadius = (borderRadius: 'none' | 'small' | 'medium' | 'large') => {
    setTheme(prev => ({ ...prev, borderRadius }));
  };

  const toggleAnimations = () => {
    setTheme(prev => ({ ...prev, animations: !prev.animations }));
  };

  const toggleHighContrast = () => {
    const newHighContrast = !theme.highContrast;
    const colors = newHighContrast
      ? (theme.actualTheme === 'dark' ? highContrastDark : highContrastLight)
      : (theme.actualTheme === 'dark' ? darkTheme : lightTheme);

    setTheme(prev => ({
      ...prev,
      highContrast: newHighContrast,
      colors
    }));
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
    localStorage.removeItem('theraflow_theme');
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setMode,
        setFontSize,
        setFontFamily,
        setBorderRadius,
        toggleAnimations,
        toggleHighContrast,
        resetTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export default ThemeContext;
