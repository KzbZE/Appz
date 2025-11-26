/**
 * Service de gestion du thème (Dark Mode)
 */

class ThemeService {
  private readonly THEME_KEY = 'theraflow_theme';

  /**
   * Initialise le thème au chargement de l'application
   */
  initialize(): void {
    const savedTheme = this.getTheme();
    this.applyTheme(savedTheme);
  }

  /**
   * Récupère le thème actuel
   */
  getTheme(): 'light' | 'dark' {
    const saved = localStorage.getItem(this.THEME_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }

    // Détecter la préférence système
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  /**
   * Définit le thème
   */
  setTheme(theme: 'light' | 'dark'): void {
    localStorage.setItem(this.THEME_KEY, theme);
    this.applyTheme(theme);
  }

  /**
   * Bascule entre light et dark
   */
  toggleTheme(): 'light' | 'dark' {
    const current = this.getTheme();
    const newTheme = current === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
    return newTheme;
  }

  /**
   * Applique le thème au DOM
   */
  private applyTheme(theme: 'light' | 'dark'): void {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Mettre à jour la couleur de la barre de statut mobile
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#1f2937' : '#ffffff');
    }
  }

  /**
   * Écoute les changements de préférence système
   */
  watchSystemPreference(callback: (theme: 'light' | 'dark') => void): () => void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(this.THEME_KEY)) {
        // Si pas de préférence sauvegardée, suivre le système
        const theme = e.matches ? 'dark' : 'light';
        this.applyTheme(theme);
        callback(theme);
      }
    };

    mediaQuery.addEventListener('change', handler);

    // Retourne une fonction de cleanup
    return () => mediaQuery.removeEventListener('change', handler);
  }
}

export default new ThemeService();
