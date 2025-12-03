import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { Download, FileSpreadsheet, Calendar, Euro, TrendingUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Session, Patient } from '../types';

const UrssafModule: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sessionsData, patientsData] = await Promise.all([
          dataService.getSessions(),
          dataService.getPatients()
        ]);
        setSessions(sessionsData);
        setPatients(patientsData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  // Filtrer les séances par mois/année
  const getSessionsForPeriod = (month: number, year: number) => {
    return sessions.filter(s => {
      const sessionDate = new Date(s.date);
      return sessionDate.getMonth() === month && sessionDate.getFullYear() === year;
    });
  };

  // Statistiques du mois
  const monthSessions = getSessionsForPeriod(selectedMonth, selectedYear);
  const monthRevenue = monthSessions.reduce((sum, s) => sum + (s.price || 0), 0);

  // Statistiques de l'année
  const yearSessions = sessions.filter(s => new Date(s.date).getFullYear() === selectedYear);
  const yearRevenue = yearSessions.reduce((sum, s) => sum + (s.price || 0), 0);

  // Export Excel pour le mois sélectionné
  const exportMonthToExcel = () => {
    const monthData = monthSessions.map(session => {
      const patient = patients.find(p => p.id === session.patientId);
      return {
        'Date': new Date(session.date).toLocaleDateString('fr-FR'),
        'Patient': patient?.name || 'Inconnu',
        'Type': session.type,
        'Durée (min)': session.durationMin || 60,
        'Montant HT (€)': session.price || 0,
        'Notes': session.notes || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(monthData);

    // Ajouter ligne de total
    const totalRow = {
      'Date': 'TOTAL',
      'Patient': '',
      'Type': '',
      'Durée (min)': monthData.reduce((sum, s) => sum + (s['Durée (min)'] || 0), 0),
      'Montant HT (€)': monthRevenue,
      'Notes': `${monthSessions.length} séances`
    };
    XLSX.utils.sheet_add_json(ws, [totalRow], { skipHeader: true, origin: -1 });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Séances ${selectedMonth + 1}/${selectedYear}`);

    const fileName = `URSSAF_${selectedYear}_${String(selectedMonth + 1).padStart(2, '0')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Export Excel pour toute l'année
  const exportYearToExcel = () => {
    const yearData = yearSessions.map(session => {
      const patient = patients.find(p => p.id === session.patientId);
      return {
        'Date': new Date(session.date).toLocaleDateString('fr-FR'),
        'Mois': new Date(session.date).toLocaleDateString('fr-FR', { month: 'long' }),
        'Patient': patient?.name || 'Inconnu',
        'Type': session.type,
        'Durée (min)': session.durationMin || 60,
        'Montant HT (€)': session.price || 0,
        'Notes': session.notes || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(yearData);

    // Ajouter ligne de total
    const totalRow = {
      'Date': 'TOTAL ANNÉE',
      'Mois': '',
      'Patient': '',
      'Type': '',
      'Durée (min)': yearData.reduce((sum, s) => sum + (s['Durée (min)'] || 0), 0),
      'Montant HT (€)': yearRevenue,
      'Notes': `${yearSessions.length} séances`
    };
    XLSX.utils.sheet_add_json(ws, [totalRow], { skipHeader: true, origin: -1 });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Année ${selectedYear}`);

    const fileName = `URSSAF_${selectedYear}_ANNUEL.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-50 p-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          Déclaration URSSAF
        </h1>
        <p className="text-slate-600">Export Excel de vos séances pour votre déclaration auto-entrepreneur</p>
      </div>

      {/* Sélecteur de période */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
          <Calendar size={24} className="mr-2 text-blue-600" />
          Sélectionner la période
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">Mois</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
            >
              {months.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">Année</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistiques du mois */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">
          📊 {months[selectedMonth]} {selectedYear}
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
            <div className="text-sm text-blue-700 font-semibold mb-1">Nombre de séances</div>
            <div className="text-3xl font-black text-blue-900">{monthSessions.length}</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
            <div className="text-sm text-green-700 font-semibold mb-1 flex items-center">
              <Euro size={14} className="mr-1" />
              Chiffre d'affaires HT
            </div>
            <div className="text-3xl font-black text-green-900">{monthRevenue.toFixed(2)} €</div>
          </div>
        </div>

        <button
          onClick={exportMonthToExcel}
          disabled={monthSessions.length === 0}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold flex items-center justify-center shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={20} className="mr-2" />
          Télécharger Excel - {months[selectedMonth]} {selectedYear}
        </button>
      </div>

      {/* Statistiques annuelles */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <TrendingUp size={20} className="mr-2 text-indigo-600" />
          Récapitulatif annuel {selectedYear}
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border-2 border-indigo-200">
            <div className="text-sm text-indigo-700 font-semibold mb-1">Total séances</div>
            <div className="text-3xl font-black text-indigo-900">{yearSessions.length}</div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border-2 border-emerald-200">
            <div className="text-sm text-emerald-700 font-semibold mb-1 flex items-center">
              <Euro size={14} className="mr-1" />
              CA annuel HT
            </div>
            <div className="text-3xl font-black text-emerald-900">{yearRevenue.toFixed(2)} €</div>
          </div>
        </div>

        <button
          onClick={exportYearToExcel}
          disabled={yearSessions.length === 0}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold flex items-center justify-center shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileSpreadsheet size={20} className="mr-2" />
          Télécharger Excel - Année complète {selectedYear}
        </button>
      </div>

      {/* Info URSSAF */}
      <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <h3 className="font-bold text-blue-900 mb-2">ℹ️ Informations URSSAF</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Les montants sont en <strong>Hors Taxes (HT)</strong></li>
          <li>• Activité libérale : <strong>22,2%</strong> de cotisations sociales</li>
          <li>• Déclaration mensuelle ou trimestrielle selon votre choix</li>
          <li>• Conservez ces exports comme justificatifs</li>
        </ul>
      </div>
    </div>
  );
};

export default UrssafModule;
