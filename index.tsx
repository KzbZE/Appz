import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);

  // ✅ Charger l'application directement sans vérification des env vars
  console.log('✅ Démarrage de l\'application...');
  console.log('Variables d\'environnement:', {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    hasGeminiKey: !!import.meta.env.VITE_GEMINI_API_KEY
  });

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("❌ Failed to find the root element");
}
