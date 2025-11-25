/**
 * Router Principal
 *
 * Gère le routing de l'application:
 * - Route normale: /
 * - Route admin cachée: /admin/backend/theraflow-control-panel-secure-2025
 * - Switch entre UI Legacy et UI Moderne
 */

import React, { useState, useEffect } from 'react';
import App from './App';
import AdminBackend from './components/AdminBackend';

const Router: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Route admin cachée
  if (currentPath === '/admin/backend/theraflow-control-panel-secure-2025') {
    return <AdminBackend />;
  }

  // Route normale
  return <App />;
};

export default Router;
