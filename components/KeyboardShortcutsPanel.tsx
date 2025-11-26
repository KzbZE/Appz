import React, { useState, useEffect } from 'react';
import { Keyboard, X, Search } from 'lucide-react';
import keyboardShortcutsService from '../services/keyboardShortcutsService';

interface KeyboardShortcutsPanelProps {
  onClose: () => void;
}

const KeyboardShortcutsPanel: React.FC<KeyboardShortcutsPanelProps> = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [shortcuts, setShortcuts] = useState(keyboardShortcutsService.getAllShortcuts());

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const filteredShortcuts = shortcuts.filter(s =>
    s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = {
    navigation: { title: 'Navigation', icon: '🧭', color: 'blue' },
    actions: { title: 'Actions', icon: '⚡', color: 'purple' },
    search: { title: 'Recherche', icon: '🔍', color: 'green' },
    admin: { title: 'Administration', icon: '🔐', color: 'red' }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <Keyboard size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black">Raccourcis Clavier</h2>
                <p className="text-indigo-100 text-sm">Mode Power User activé</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-all"
            >
              <X size={24} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un raccourci..."
              className="w-full pl-12 pr-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white placeholder-indigo-200 focus:bg-white/30 focus:border-white transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {Object.entries(categories).map(([categoryKey, category]) => {
            const categoryShortcuts = filteredShortcuts.filter(s => s.category === categoryKey);
            if (categoryShortcuts.length === 0) return null;

            return (
              <div key={categoryKey} className="mb-8">
                <h3 className={`text-lg font-bold text-${category.color}-600 mb-4 flex items-center gap-2`}>
                  <span>{category.icon}</span>
                  {category.title}
                </h3>

                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-4 bg-${category.color}-50 hover:bg-${category.color}-100 rounded-xl transition-all`}
                    >
                      <span className="text-gray-700 font-medium">{shortcut.description}</span>
                      <div className="flex gap-1">
                        {shortcut.ctrl && (
                          <kbd className="px-3 py-1 bg-white rounded-lg shadow text-sm font-bold text-gray-700 border-2 border-gray-200">
                            Ctrl
                          </kbd>
                        )}
                        {shortcut.shift && (
                          <kbd className="px-3 py-1 bg-white rounded-lg shadow text-sm font-bold text-gray-700 border-2 border-gray-200">
                            Shift
                          </kbd>
                        )}
                        {shortcut.alt && (
                          <kbd className="px-3 py-1 bg-white rounded-lg shadow text-sm font-bold text-gray-700 border-2 border-gray-200">
                            Alt
                          </kbd>
                        )}
                        <kbd className="px-3 py-1 bg-white rounded-lg shadow text-sm font-bold text-gray-700 border-2 border-gray-200">
                          {shortcut.key.toUpperCase()}
                        </kbd>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredShortcuts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Aucun raccourci trouvé</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 text-center">
          <p className="text-sm text-gray-600">
            💡 <strong>Astuce:</strong> Appuyez sur <kbd className="px-2 py-1 bg-white rounded shadow text-xs font-bold">ESC</kbd> pour fermer
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsPanel;
