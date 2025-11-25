import React from 'react';
import { createRoot } from 'react-dom/client';
import Router from './Router';
import EnvErrorFallback from './components/EnvErrorFallback';
import './styles/animations.css';

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
    // Tout est OK, charger l'application
    console.log('✅ Variables d\'environnement configurées');
    root.render(
      <React.StrictMode>
        <Router />
      </React.StrictMode>
    );
  }
} else {
  console.error("Failed to find the root element");
}
