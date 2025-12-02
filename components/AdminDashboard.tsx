import React, { useState, useEffect } from 'react';
import { Users, Calendar, CreditCard, Shield, TrendingUp, Settings, Database } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminStats {
  totalUsers: number;
  totalPractitioners: number;
  totalPatients: number;
  totalAppointments: number;
  totalInvoices: number;
  totalRevenue: number;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'appointments' | 'stats'>('stats');
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalPractitioners: 0,
    totalPatients: 0,
    totalAppointments: 0,
    totalInvoices: 0,
    totalRevenue: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);

      // Load all profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Load all appointments
      const { data: allAppointments } = await supabase
        .from('appointments')
        .select('*')
        .order('start_time', { ascending: false });

      // Load all invoices
      const { data: allInvoices } = await supabase
        .from('invoices')
        .select('amount_ttc');

      setUsers(profiles || []);
      setAppointments(allAppointments || []);

      // Calculate stats
      const practitioners = profiles?.filter(p => p.role === 'PRACTITIONER') || [];
      const patients = profiles?.filter(p => p.role === 'PATIENT') || [];
      const totalRevenue = allInvoices?.reduce((sum, inv) => sum + (inv.amount_ttc || 0), 0) || 0;

      setStats({
        totalUsers: profiles?.length || 0,
        totalPractitioners: practitioners.length,
        totalPatients: patients.length,
        totalAppointments: allAppointments?.length || 0,
        totalInvoices: allInvoices?.length || 0,
        totalRevenue,
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const config: Record<string, { label: string; color: string }> = {
      ADMIN: { label: 'Admin', color: 'bg-red-100 text-red-800' },
      PRACTITIONER: { label: 'Praticien', color: 'bg-blue-100 text-blue-800' },
      PATIENT: { label: 'Patient', color: 'bg-green-100 text-green-800' },
      ASSISTANT: { label: 'Assistant', color: 'bg-purple-100 text-purple-800' },
    };

    const { label, color } = config[role] || { label: role, color: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${color}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-red-200">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-red-600" size={32} />
            <h1 className="text-3xl font-black text-slate-800">
              Administration
            </h1>
          </div>
          <p className="text-slate-600">Gestion complète de la plateforme</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-2 border border-slate-200">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'stats'
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <TrendingUp size={18} />
              Statistiques
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users size={18} />
              Utilisateurs
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'appointments'
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Calendar size={18} />
              Rendez-vous
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 border border-slate-200 text-center">
            <div className="text-slate-500">Chargement...</div>
          </div>
        ) : (
          <>
            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <Users className="text-blue-600" size={32} />
                    <span className="text-sm font-bold text-slate-500">UTILISATEURS</span>
                  </div>
                  <p className="text-4xl font-black text-slate-800 mb-2">{stats.totalUsers}</p>
                  <p className="text-sm text-slate-600">
                    {stats.totalPractitioners} praticiens • {stats.totalPatients} patients
                  </p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-200">
                  <div className="flex items-center justify-between mb-4">
                    <Calendar className="text-indigo-600" size={32} />
                    <span className="text-sm font-bold text-slate-500">RENDEZ-VOUS</span>
                  </div>
                  <p className="text-4xl font-black text-slate-800 mb-2">{stats.totalAppointments}</p>
                  <p className="text-sm text-slate-600">Total des rendez-vous</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <CreditCard className="text-green-600" size={32} />
                    <span className="text-sm font-bold text-slate-500">REVENUS</span>
                  </div>
                  <p className="text-4xl font-black text-slate-800 mb-2">{stats.totalRevenue.toFixed(2)}€</p>
                  <p className="text-sm text-slate-600">{stats.totalInvoices} factures</p>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <h2 className="text-2xl font-black text-slate-800 mb-6">Tous les Utilisateurs</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-bold text-slate-700">Email</th>
                        <th className="text-left py-3 px-4 font-bold text-slate-700">Nom</th>
                        <th className="text-left py-3 px-4 font-bold text-slate-700">Rôle</th>
                        <th className="text-left py-3 px-4 font-bold text-slate-700">Créé le</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-sm text-slate-800">{user.email}</td>
                          <td className="py-3 px-4 text-sm text-slate-800">{user.name || '-'}</td>
                          <td className="py-3 px-4">{getRoleBadge(user.role)}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {new Date(user.created_at).toLocaleDateString('fr-FR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                <h2 className="text-2xl font-black text-slate-800 mb-6">Tous les Rendez-vous</h2>
                <div className="space-y-3">
                  {appointments.slice(0, 50).map((appointment) => (
                    <div key={appointment.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-800">
                            {new Date(appointment.start_time).toLocaleString('fr-FR')}
                          </p>
                          <p className="text-sm text-slate-600">
                            {appointment.type} - {appointment.duration_min} min
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          appointment.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                          appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
