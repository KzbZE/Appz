import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import App from '../App';
import PatientDashboard from './PatientDashboard';
import AdminDashboard from './AdminDashboard';

/**
 * Role-based routing component
 * Renders different app layouts based on user role
 */
const RoleBasedApp: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl font-bold animate-pulse">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl font-bold">Erreur d'authentification</div>
      </div>
    );
  }

  // PATIENT Role: Render Patient Dashboard
  if (user.role === 'PATIENT') {
    return <PatientDashboard />;
  }

  // ADMIN Role: Render Admin Dashboard
  if (user.role === 'ADMIN') {
    return <AdminDashboard />;
  }

  // PRACTITIONER or ASSISTANT Role: Render main App (existing practitioner interface)
  // This maintains backward compatibility with existing users
  return <App />;
};

export default RoleBasedApp;
