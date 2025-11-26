/**
 * Service de gestion des raccourcis clavier Power User
 */

type ShortcutAction = () => void;

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: ShortcutAction;
  category: 'navigation' | 'actions' | 'search' | 'admin';
}

class KeyboardShortcutsService {
  private shortcuts: Map<string, Shortcut> = new Map();
  private enabled: boolean = true;

  constructor() {
    this.initializeDefaultShortcuts();
    this.startListening();
  }

  /**
   * Initialise les raccourcis par défaut
   */
  private initializeDefaultShortcuts() {
    // Navigation
    this.register({
      key: 'd',
      ctrl: true,
      description: 'Aller au Dashboard',
      action: () => this.triggerNavigation('dashboard'),
      category: 'navigation'
    });

    this.register({
      key: 'p',
      ctrl: true,
      description: 'Aller aux Patients',
      action: () => this.triggerNavigation('patients'),
      category: 'navigation'
    });

    this.register({
      key: 'c',
      ctrl: true,
      description: 'Aller au Calendrier',
      action: () => this.triggerNavigation('calendar'),
      category: 'navigation'
    });

    this.register({
      key: 'f',
      ctrl: true,
      description: 'Aller aux Finances',
      action: () => this.triggerNavigation('finance'),
      category: 'navigation'
    });

    // Actions
    this.register({
      key: 'n',
      ctrl: true,
      shift: true,
      description: 'Nouveau Patient',
      action: () => this.triggerAction('newPatient'),
      category: 'actions'
    });

    this.register({
      key: 'r',
      ctrl: true,
      shift: true,
      description: 'Nouveau Rendez-vous',
      action: () => this.triggerAction('newAppointment'),
      category: 'actions'
    });

    this.register({
      key: 'i',
      ctrl: true,
      shift: true,
      description: 'Nouvelle Facture',
      action: () => this.triggerAction('newInvoice'),
      category: 'actions'
    });

    // Search
    this.register({
      key: 'k',
      ctrl: true,
      description: 'Recherche Rapide',
      action: () => this.triggerAction('quickSearch'),
      category: 'search'
    });

    this.register({
      key: '/',
      description: 'Focus sur recherche',
      action: () => this.triggerAction('focusSearch'),
      category: 'search'
    });

    // Admin
    this.register({
      key: 'a',
      ctrl: true,
      shift: true,
      description: 'Panneau Admin',
      action: () => this.triggerAction('openAdmin'),
      category: 'admin'
    });

    // UI
    this.register({
      key: 't',
      ctrl: true,
      shift: true,
      description: 'Basculer Thème',
      action: () => this.triggerAction('toggleTheme'),
      category: 'navigation'
    });

    this.register({
      key: 'h',
      ctrl: true,
      shift: true,
      description: 'Afficher Aide',
      action: () => this.triggerAction('showHelp'),
      category: 'navigation'
    });
  }

  /**
   * Enregistre un nouveau raccourci
   */
  register(shortcut: Shortcut) {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  /**
   * Supprime un raccourci
   */
  unregister(key: string, ctrl?: boolean, shift?: boolean, alt?: boolean) {
    const shortcutKey = this.getShortcutKey({ key, ctrl, shift, alt } as Shortcut);
    this.shortcuts.delete(shortcutKey);
  }

  /**
   * Génère la clé unique pour un raccourci
   */
  private getShortcutKey(shortcut: Partial<Shortcut>): string {
    const parts = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.alt) parts.push('Alt');
    parts.push(shortcut.key?.toUpperCase());
    return parts.join('+');
  }

  /**
   * Démarre l'écoute des événements clavier
   */
  private startListening() {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (!this.enabled) return;

      // Ignorer si dans un input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Sauf pour certains raccourcis spécifiques
        if (!(e.key === 'Escape' || (e.ctrlKey && e.key === 'k'))) {
          return;
        }
      }

      const shortcutKey = this.getShortcutKey({
        key: e.key,
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        alt: e.altKey
      });

      const shortcut = this.shortcuts.get(shortcutKey);
      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    });
  }

  /**
   * Active/Désactive les raccourcis
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Récupère tous les raccourcis
   */
  getAllShortcuts(): Shortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Récupère les raccourcis par catégorie
   */
  getShortcutsByCategory(category: Shortcut['category']): Shortcut[] {
    return this.getAllShortcuts().filter(s => s.category === category);
  }

  /**
   * Trigger navigation
   */
  private triggerNavigation(view: string) {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { view } }));
  }

  /**
   * Trigger action
   */
  private triggerAction(action: string) {
    window.dispatchEvent(new CustomEvent('shortcutAction', { detail: { action } }));
  }

  /**
   * Formate un raccourci pour affichage
   */
  formatShortcut(shortcut: Shortcut): string {
    const parts = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.alt) parts.push('Alt');
    parts.push(shortcut.key.toUpperCase());
    return parts.join(' + ');
  }
}

export default new KeyboardShortcutsService();
