import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import EnvErrorFallback from './components/EnvErrorFallback';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';

// Vérifier les variables d'environnement requises
const checkRequiredEnvVars = () => {
  const missingVars: string[] = [];

  if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co') {
    missingVars.push('VITE_SUPABASE_URL');
  }

  if (!import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY === 'your_anon_key_here') {
    missingVars.push('VITE_SUPABASE_ANON_KEY');
  }

  return missingVars;
};

// Composant wrapper qui gère l'authentification
const AppWrapper: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl font-bold animate-pulse">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthModal />;
  }

  return <App />;
};

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  const missingVars = checkRequiredEnvVars();

  if (missingVars.length > 0) {
    // Afficher l'écran d'erreur au lieu d'un écran blanc
    console.error('❌ Variables d\'environnement manquantes:', missingVars);
    root.render(
      <React.StrictMode>
        <EnvErrorFallback missingVars={missingVars} />
      </React.StrictMode>
    );
  } else {
    // Tout est OK, charger l'application avec authentification
    console.log('✅ Variables d\'environnement configurées');
    root.render(
      <React.StrictMode>
        <AuthProvider>
          <AppWrapper />
        </AuthProvider>
      </React.StrictMode>
    );
  }
} else {
  console.error("Failed to find the root element");
}
