import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, Monitor, Type, Minimize2, Maximize2, Circle, Eye, EyeOff, Zap, RotateCcw } from 'lucide-react';

/**
 * Panneau de configuration du thème et accessibilité
 */

const ThemeSettings: React.FC = () => {
  const {
    theme,
    setMode,
    setFontSize,
    setBorderRadius,
    toggleAnimations,
    toggleHighContrast,
    resetTheme
  } = useTheme();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Apparence & Accessibilité</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Personnalisez l'interface selon vos préférences</p>
        </div>
        <button
          onClick={resetTheme}
          className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <RotateCcw size={18} className="mr-2" />
          Réinitialiser
        </button>
      </div>

      {/* Mode de thème */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Sun className="mr-2 text-yellow-500" size={20} />
          Mode d'affichage
        </h3>

        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setMode('light')}
            className={`flex flex-col items-center p-4 border-2 rounded-xl transition-all ${
              theme.mode === 'light'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
            }`}
          >
            <Sun className={theme.mode === 'light' ? 'text-purple-600' : 'text-gray-600 dark:text-gray-400'} size={32} />
            <span className={`mt-2 font-semibold ${theme.mode === 'light' ? 'text-purple-600' : 'text-gray-700 dark:text-gray-300'}`}>
              Clair
            </span>
          </button>

          <button
            onClick={() => setMode('dark')}
            className={`flex flex-col items-center p-4 border-2 rounded-xl transition-all ${
              theme.mode === 'dark'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
            }`}
          >
            <Moon className={theme.mode === 'dark' ? 'text-purple-600' : 'text-gray-600 dark:text-gray-400'} size={32} />
            <span className={`mt-2 font-semibold ${theme.mode === 'dark' ? 'text-purple-600' : 'text-gray-700 dark:text-gray-300'}`}>
              Sombre
            </span>
          </button>

          <button
            onClick={() => setMode('auto')}
            className={`flex flex-col items-center p-4 border-2 rounded-xl transition-all ${
              theme.mode === 'auto'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
            }`}
          >
            <Monitor className={theme.mode === 'auto' ? 'text-purple-600' : 'text-gray-600 dark:text-gray-400'} size={32} />
            <span className={`mt-2 font-semibold ${theme.mode === 'auto' ? 'text-purple-600' : 'text-gray-700 dark:text-gray-300'}`}>
              Auto
            </span>
            {theme.mode === 'auto' && (
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {theme.actualTheme === 'dark' ? '🌙 Nuit' : '☀️ Jour'}
              </span>
            )}
          </button>
        </div>

        {theme.mode === 'auto' && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            💡 <strong>Mode automatique :</strong> Thème sombre de 20h à 7h, clair le reste du temps
          </p>
        )}
      </div>

      {/* Taille de police */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Type className="mr-2 text-indigo-500" size={20} />
          Taille de police
        </h3>

        <div className="grid grid-cols-3 gap-4">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <button
              key={size}
              onClick={() => setFontSize(size)}
              className={`flex flex-col items-center p-4 border-2 rounded-xl transition-all ${
                theme.fontSize === size
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
              }`}
            >
              <Type
                size={size === 'small' ? 24 : size === 'medium' ? 28 : 32}
                className={theme.fontSize === size ? 'text-indigo-600' : 'text-gray-600 dark:text-gray-400'}
              />
              <span className={`mt-2 font-semibold capitalize ${theme.fontSize === size ? 'text-indigo-600' : 'text-gray-700 dark:text-gray-300'}`}>
                {size === 'small' ? 'Petite' : size === 'medium' ? 'Moyenne' : 'Grande'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {size === 'small' ? '14px' : size === 'medium' ? '16px' : '18px'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Coins arrondis */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Circle className="mr-2 text-pink-500" size={20} />
          Coins arrondis
        </h3>

        <div className="grid grid-cols-4 gap-4">
          {(['none', 'small', 'medium', 'large'] as const).map((radius) => (
            <button
              key={radius}
              onClick={() => setBorderRadius(radius)}
              className={`flex flex-col items-center p-4 border-2 transition-all ${
                theme.borderRadius === radius
                  ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-pink-300'
              }`}
              style={{
                borderRadius:
                  radius === 'none' ? '0' :
                  radius === 'small' ? '0.375rem' :
                  radius === 'medium' ? '0.75rem' : '1rem'
              }}
            >
              <div
                className={`w-12 h-12 ${theme.borderRadius === radius ? 'bg-pink-600' : 'bg-gray-400 dark:bg-gray-600'}`}
                style={{
                  borderRadius:
                    radius === 'none' ? '0' :
                    radius === 'small' ? '0.375rem' :
                    radius === 'medium' ? '0.75rem' : '1rem'
                }}
              />
              <span className={`mt-2 font-semibold capitalize text-sm ${theme.borderRadius === radius ? 'text-pink-600' : 'text-gray-700 dark:text-gray-300'}`}>
                {radius === 'none' ? 'Aucun' : radius === 'small' ? 'Petits' : radius === 'medium' ? 'Moyens' : 'Grands'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Options d'accessibilité */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Eye className="mr-2 text-teal-500" size={20} />
          Accessibilité
        </h3>

        <div className="space-y-4">
          {/* Contraste élevé */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <Eye className="mr-2 text-teal-600" size={18} />
                Contraste élevé
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Augmente le contraste des couleurs pour une meilleure lisibilité
              </p>
            </div>
            <button
              onClick={toggleHighContrast}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                theme.highContrast ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  theme.highContrast ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Animations */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <Zap className="mr-2 text-yellow-600" size={18} />
                Animations
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Active les transitions et animations de l'interface
              </p>
              {theme.reducedMotion && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  ⚠️ Désactivé par votre système (mouvement réduit)
                </p>
              )}
            </div>
            <button
              onClick={toggleAnimations}
              disabled={theme.reducedMotion}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                theme.animations && !theme.reducedMotion ? 'bg-yellow-600' : 'bg-gray-300 dark:bg-gray-600'
              } ${theme.reducedMotion ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  theme.animations && !theme.reducedMotion ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Aperçu */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Aperçu</h3>

        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl">
            <h4 className="font-bold text-lg">Gradient Primaire</h4>
            <p className="text-sm opacity-90 mt-1">Utilisé pour les en-têtes et actions principales</p>
          </div>

          <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-xl">
            <h4 className="font-bold text-gray-900 dark:text-white">Surface</h4>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Cartes et conteneurs de l'interface</p>
          </div>

          <div className="flex gap-2">
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Succès
            </button>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Erreur
            </button>
            <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
              Attention
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Info
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;
