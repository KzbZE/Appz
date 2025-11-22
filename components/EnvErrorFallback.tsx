import React from 'react';
import { AlertTriangle, Settings, ExternalLink } from 'lucide-react';

interface EnvErrorFallbackProps {
  missingVars: string[];
}

const EnvErrorFallback: React.FC<EnvErrorFallbackProps> = ({ missingVars }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-600 p-8 text-white text-center">
          <AlertTriangle size={64} className="mx-auto mb-4" />
          <h1 className="text-3xl font-black mb-2">Configuration Requise</h1>
          <p className="text-lg opacity-90">Variables d'environnement manquantes</p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Missing Variables */}
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <h2 className="font-bold text-red-800 mb-3 flex items-center gap-2">
              <Settings size={20} />
              Variables Manquantes
            </h2>
            <ul className="space-y-2">
              {missingVars.map((varName) => (
                <li key={varName} className="flex items-center gap-2 text-red-700 font-mono text-sm">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  {varName}
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions Netlify */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <h2 className="font-bold text-blue-800 mb-4 text-lg">
              📝 Configuration Netlify
            </h2>
            <div className="space-y-4 text-sm text-blue-900">
              <div>
                <p className="font-bold mb-2">1. Accéder aux Variables d'Environnement</p>
                <code className="block bg-blue-100 p-3 rounded text-xs">
                  Netlify Dashboard → Site settings → Environment variables
                </code>
              </div>

              <div>
                <p className="font-bold mb-2">2. Ajouter les Variables</p>
                <div className="bg-blue-100 p-3 rounded space-y-2">
                  {missingVars.includes('VITE_SUPABASE_URL') && (
                    <div>
                      <p className="font-mono text-xs text-blue-700">Key: <span className="font-bold">VITE_SUPABASE_URL</span></p>
                      <p className="font-mono text-xs text-blue-600">Value: https://xxxxx.supabase.co</p>
                    </div>
                  )}
                  {missingVars.includes('VITE_SUPABASE_ANON_KEY') && (
                    <div>
                      <p className="font-mono text-xs text-blue-700">Key: <span className="font-bold">VITE_SUPABASE_ANON_KEY</span></p>
                      <p className="font-mono text-xs text-blue-600">Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="font-bold mb-2">3. Obtenir les Credentials Supabase</p>
                <code className="block bg-blue-100 p-3 rounded text-xs">
                  Supabase Dashboard → Settings → API → Project URL & anon key
                </code>
              </div>

              <div>
                <p className="font-bold mb-2">4. Redéployer</p>
                <code className="block bg-blue-100 p-3 rounded text-xs">
                  Deploys → Trigger deploy → Clear cache and deploy site
                </code>
              </div>
            </div>
          </div>

          {/* Local Development */}
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
            <h2 className="font-bold text-green-800 mb-4 text-lg">
              💻 Développement Local
            </h2>
            <div className="space-y-3 text-sm text-green-900">
              <p>Si vous voyez ce message en local:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Créer un fichier <code className="bg-green-100 px-2 py-1 rounded">.env</code> à la racine</li>
                <li>
                  Ajouter les variables:
                  <code className="block bg-green-100 p-3 rounded mt-2 text-xs">
                    VITE_SUPABASE_URL=https://xxxxx.supabase.co<br />
                    VITE_SUPABASE_ANON_KEY=eyJhbGci...
                  </code>
                </li>
                <li>Redémarrer le serveur de développement</li>
              </ol>
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-3">
            <a
              href="https://app.supabase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-3 px-4 rounded-lg font-bold hover:scale-105 transition-transform"
            >
              <ExternalLink size={18} />
              Ouvrir Supabase
            </a>
            <a
              href="https://app.netlify.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-lg font-bold hover:scale-105 transition-transform"
            >
              <ExternalLink size={18} />
              Ouvrir Netlify
            </a>
          </div>

          {/* Documentation */}
          <div className="text-center text-sm text-slate-500">
            <p>Consultez <strong>NETLIFY_DEBUG.md</strong> pour plus de détails</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvErrorFallback;
