import React, { useState, useMemo } from 'react';
import { Goal } from '../types';
import { useInvoices, usePatients, useAppointments } from '../hooks/useSupabaseData';
import { Target, TrendingUp, Users, Euro, Plus, X, Check, AlertCircle } from 'lucide-react';

const GoalsWidget: React.FC = () => {
  // TODO: Create useGoals hook when goals table is added to Supabase
  const goals: Goal[] = [];
  const { data: allInvoices } = useInvoices();
  const { data: patients } = usePatients();
  const { data: allAppointments } = useAppointments();

  const invoices = allInvoices || [];
  const appointments = useMemo(() =>
    (allAppointments || []).filter(a => a.status === 'COMPLETED'),
    [allAppointments]
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    type: 'REVENUE',
    period: 'MONTHLY',
    targetValue: 0,
    unit: 'EUR',
    isActive: true
  });

  const calculateCurrentValue = (goal: Goal): number => {
    const now = new Date();
    const start = new Date(goal.startDate);
    const end = new Date(goal.endDate);

    const isInPeriod = now >= start && now <= end;
    if (!isInPeriod) return goal.currentValue || 0;

    switch (goal.type) {
      case 'REVENUE':
        return invoices
          .filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= start && invDate <= end && inv.status === 'PAID';
          })
          .reduce((sum, inv) => sum + inv.amountPaid, 0);

      case 'SESSIONS':
        return appointments.filter(apt => {
          const aptDate = new Date(apt.startTime);
          return aptDate >= start && aptDate <= end;
        }).length;

      case 'NEW_PATIENTS':
        return patients.filter(p => {
          const patientDate = p.lastVisit ? new Date(p.lastVisit) : start;
          return patientDate >= start && patientDate <= end;
        }).length;

      default:
        return goal.currentValue || 0;
    }
  };

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'REVENUE': return <Euro size={20} />;
      case 'SESSIONS': return <TrendingUp size={20} />;
      case 'NEW_PATIENTS': return <Users size={20} />;
      default: return <Target size={20} />;
    }
  };

  const getGoalColor = (progress: number) => {
    if (progress >= 100) return { bg: 'from-emerald-500 to-green-600', text: 'text-emerald-600', border: 'border-emerald-200' };
    if (progress >= 75) return { bg: 'from-blue-500 to-cyan-600', text: 'text-blue-600', border: 'border-blue-200' };
    if (progress >= 50) return { bg: 'from-yellow-500 to-orange-500', text: 'text-yellow-600', border: 'border-yellow-200' };
    return { bg: 'from-red-500 to-pink-600', text: 'text-red-600', border: 'border-red-200' };
  };

  const handleAddGoal = async () => {
    if (!newGoal.name || !newGoal.targetValue) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const start = new Date();
    let end = new Date();

    switch (newGoal.period) {
      case 'MONTHLY':
        end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        break;
      case 'QUARTERLY':
        end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
        break;
      case 'YEARLY':
        end = new Date(start.getFullYear(), 11, 31);
        break;
    }

    await db.goals.add({
      ...newGoal,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      currentValue: 0,
      isActive: true
    } as Goal);

    setNewGoal({ type: 'REVENUE', period: 'MONTHLY', targetValue: 0, unit: 'EUR', isActive: true });
    setShowAddModal(false);
  };

  const toggleGoalStatus = async (id: number, currentStatus: boolean) => {
    await db.goals.update(id, { isActive: !currentStatus });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Target size={20} className="text-teal-600" />
          Objectifs & KPIs
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white text-xs rounded-lg font-bold shadow transition-all duration-300 hover:scale-105 flex items-center gap-1"
        >
          <Plus size={14} /> Objectif
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-200">
          <Target size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">Aucun objectif défini. Créez votre premier objectif pour suivre vos performances !</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(goal => {
            const currentValue = calculateCurrentValue(goal);
            const progress = Math.min((currentValue / goal.targetValue) * 100, 100);
            const colors = getGoalColor(progress);
            const daysLeft = Math.ceil((new Date(goal.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

            return (
              <div key={goal.id} className={`bg-white rounded-xl border-2 ${colors.border} p-4 hover:shadow-lg transition-all`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 bg-gradient-to-br ${colors.bg} rounded-lg text-white`}>
                      {getGoalIcon(goal.type)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{goal.name}</div>
                      <div className="text-xs text-slate-500">{goal.period === 'MONTHLY' ? 'Mensuel' : goal.period === 'QUARTERLY' ? 'Trimestriel' : 'Annuel'}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => goal.id && toggleGoalStatus(goal.id as number, goal.isActive)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {goal.isActive ? <Check size={18} className="text-emerald-600" /> : <X size={18} />}
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-black text-slate-800">
                      {goal.unit === 'EUR' ? `${currentValue.toFixed(0)}€` : currentValue}
                    </span>
                    <span className="text-sm text-slate-500">
                      / {goal.unit === 'EUR' ? `${goal.targetValue}€` : goal.targetValue}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full bg-gradient-to-r ${colors.bg} transition-all duration-500`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className={`font-bold ${colors.text}`}>
                      {progress.toFixed(0)}%
                    </span>
                    {daysLeft > 0 ? (
                      <span className="text-slate-500">
                        {daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-red-600 font-semibold flex items-center gap-1">
                        <AlertCircle size={12} /> Expiré
                      </span>
                    )}
                  </div>

                  {progress >= 100 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                      <Check size={14} /> Objectif atteint ! 🎉
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="font-black text-lg">Nouvel Objectif</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Type d'objectif</label>
                <select
                  value={newGoal.type}
                  onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value as any, unit: e.target.value === 'REVENUE' ? 'EUR' : 'COUNT' })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-semibold"
                >
                  <option value="REVENUE">Chiffre d'Affaires (€)</option>
                  <option value="SESSIONS">Nombre de Séances</option>
                  <option value="NEW_PATIENTS">Nouveaux Patients</option>
                  <option value="CUSTOM">Personnalisé</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nom de l'objectif *</label>
                <input
                  type="text"
                  value={newGoal.name || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Ex: CA Janvier 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Période</label>
                <select
                  value={newGoal.period}
                  onChange={(e) => setNewGoal({ ...newGoal, period: e.target.value as any })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-semibold"
                >
                  <option value="MONTHLY">Mensuel</option>
                  <option value="QUARTERLY">Trimestriel</option>
                  <option value="YEARLY">Annuel</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Objectif cible *</label>
                <input
                  type="number"
                  value={newGoal.targetValue || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, targetValue: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-bold text-lg"
                  placeholder="Ex: 5000"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddGoal}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-lg font-bold shadow-lg transition-all duration-300 hover:scale-105"
                >
                  Créer l'Objectif
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition-all"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsWidget;
