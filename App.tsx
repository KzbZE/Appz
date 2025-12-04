import React, { useState, useEffect } from 'react';
import { dataService } from './services/dataService';
import Navigation from './components/Navigation';
import DailyDashboard from './components/DailyDashboard';
import SessionWizard from './components/SessionWizard';
import FinanceModule from './components/FinanceModule';
import AICoach from './components/AICoach';
import PatientList from './components/PatientList';
import CalendarModule from './components/CalendarModule';
import ClientBooking from './components/ClientBooking';
import PublicAppointmentRequest from './components/PublicAppointmentRequest';
import SettingsModule from './components/SettingsModule';
import AdvancedStatistics from './components/AdvancedStatistics';
import ReminderModule from './components/ReminderModule';
import SessionHistory from './components/SessionHistory';
import WeeklyPlanner from './components/WeeklyPlanner';
import SessionTemplates from './components/SessionTemplates';
import MarketingAutomation from './components/MarketingAutomation';
import ProductsInventory from './components/ProductsInventory';
import SatisfactionSurvey from './components/SatisfactionSurvey';
import GoalsWidget from './components/GoalsWidget';
import LoyaltyPromoModule from './components/LoyaltyPromoModule';
import RGPDModule from './components/RGPDModule';
import MigrationWizard from './components/MigrationWizard';
import UrssafModule from './components/UrssafModule';
import { checkAvailability, calculateLogistics, suggestOptimalTimeSlots } from './services/logisticsService';
import { suggestOptimizedSlots, getAllAvailableSlots } from './services/optimizationService';
import { Patient, Appointment, ApptStatus, PatientType, Invoice, InvoiceStatus, Expense, AppSettings } from './types';
import { X, Save, Clock, MapPin, User, Globe, AlertTriangle, Search, Zap, Plus, ChevronLeft } from 'lucide-react';
import { initGoogleClient } from './services/googleApiService';
import { setupAutomaticBackup } from './services/backupService';

const App: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<AppSettings[]>([]);
  
  const DEFAULT_SETTINGS: AppSettings = {
      appName: 'TheraFlow',
      practitionerName: 'Praticien',
      cabinetAddress: '',
      kmRate: 0.5,
      defaultTariffs: { HUMAN_KINESIO: 0, EQUINE_KINESIO: 0, CANINE_KINESIO: 0, MASSAGE: 0 },
      social: { instagramHandle: '', facebookPage: '' },
      branding: { primaryColor: '#0f766e', logoUrl: '' }
  };

  const appSettings = settings?.[0] || DEFAULT_SETTINGS;

  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
  const [isNewApptModalOpen, setIsNewApptModalOpen] = useState(false);
  const [isClientBookingOpen, setIsClientBookingOpen] = useState(false);
  const [isQuickSessionModalOpen, setIsQuickSessionModalOpen] = useState(false);
  const [editingApptId, setEditingApptId] = useState<string | number | null>(null);
  
  const [isCreatingQuickPatient, setIsCreatingQuickPatient] = useState(false);
  const [quickPatientForm, setQuickPatientForm] = useState({
      name: '',
      type: 'HUMAN',
      ownerName: ''
  });

  const [newApptData, setNewApptData] = useState({
      patientId: '',
      isNewPatient: false,
      newPatientName: '',
      newPatientType: 'HUMAN',
      newPatientAddress: '',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      type: 'CABINET',
      notes: 'Consultation'
  });

  const [suggestedTimeSlots, setSuggestedTimeSlots] = useState<any[]>([]);
  const [quickSearchTerm, setQuickSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [patientsData, appointmentsData, invoicesData, expensesData, settingsData] = await Promise.all([
          dataService.getPatients(),
          dataService.getAppointments(),
          dataService.getInvoices(),
          dataService.getExpenses(),
          dataService.getSettings()
        ]);
        setPatients(patientsData);
        setAppointments(appointmentsData);
        setInvoices(invoicesData);
        setExpenses(expensesData);
        setSettings(settingsData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
    setupAutomaticBackup();
  }, []);

  useEffect(() => {
      if (appSettings) {
          initGoogleClient(appSettings)
              .then(async () => {
                  // ✅ Restaurer automatiquement le token Google si disponible
                  const { checkAuth } = await import('./services/googleApiService');
                  const isAuth = await checkAuth();
                  if (isAuth) {
                      console.log("✅ Google: Session restaurée automatiquement");
                  }
              })
              .catch(err => console.log("GAPI Init status:", err));
      }
  }, [appSettings]);

  useEffect(() => {
    if (appSettings?.branding?.primaryColor) {
        const hex = appSettings.branding.primaryColor;
        document.documentElement.style.setProperty('--primary-500', hex);
        document.documentElement.style.setProperty('--primary-600', hex);
        document.documentElement.style.setProperty('--primary-100', hex + '33');
    }
  }, [appSettings]);

  // Calculate suggested time slots for route optimization (GPS-based)
  useEffect(() => {
    if (!newApptData.date || !patients || !appointments || newApptData.type === 'CABINET') {
      setSuggestedTimeSlots([]);
      return;
    }

    let targetLat: number | undefined;
    let targetLng: number | undefined;

    // Get GPS coordinates from existing patient or new patient form
    if (!newApptData.isNewPatient && newApptData.patientId) {
      const patient = patients.find(p => String(p.id) === String(newApptData.patientId));
      targetLat = patient?.lat;
      targetLng = patient?.lng;
    }

    // If no GPS coordinates, try to use old logistics service as fallback
    if (!targetLat || !targetLng) {
      let targetAddress = '';
      if (!newApptData.isNewPatient && newApptData.patientId) {
        const patient = patients.find(p => String(p.id) === String(newApptData.patientId));
        targetAddress = patient?.address || '';
      } else if (newApptData.isNewPatient) {
        targetAddress = newApptData.newPatientAddress;
      }

      if (!targetAddress || targetAddress === 'Adresse à compléter') {
        setSuggestedTimeSlots([]);
        return;
      }

      // Fallback to old logistics service
      const targetDate = new Date(newApptData.date);
      const suggestions = suggestOptimalTimeSlots(
        targetDate,
        targetAddress,
        60,
        appointments,
        patients,
        appSettings.cabinetAddress || 'Cabinet'
      );
      setSuggestedTimeSlots(suggestions);
      return;
    }

    // Use new GPS-based optimization service
    const targetDate = new Date(newApptData.date);
    suggestOptimizedSlots(targetLat, targetLng, 60, targetDate)
      .then(suggestions => {
        setSuggestedTimeSlots(suggestions);
      })
      .catch(err => {
        console.error('Optimization error:', err);
        setSuggestedTimeSlots([]);
      });
  }, [newApptData.date, newApptData.patientId, newApptData.newPatientAddress, newApptData.isNewPatient, newApptData.type, patients, appointments, appSettings.cabinetAddress]);

  const handleStartSession = (appt: Appointment) => {
    setActiveAppointment(appt);
    setCurrentView('session');
  };

  const handleInstantSession = async (patient: Patient) => {
      if (!patient.id) return;
      const newAppt = await dataService.createAppointment({
          patientId: patient.id,
          startTime: new Date().toISOString(),
          durationMin: 60,
          status: ApptStatus.IN_PROGRESS,
          type: patient.type === PatientType.HUMAN ? 'CABINET' : 'STABLE',
          price: 0,
          notes: 'Séance Hors-Planning'
      });

      if (newAppt) {
        setActiveAppointment(newAppt);
        setCurrentView('session');
        setIsQuickSessionModalOpen(false);
        setIsCreatingQuickPatient(false);
        // Refresh appointments list
        const appointmentsData = await dataService.getAppointments();
        setAppointments(appointmentsData);
      }
  };

  const handleCreateAndStartQuickPatient = async () => {
      if (!quickPatientForm.name) return;

      const newPatient = await dataService.createPatient({
          name: quickPatientForm.name,
          type: quickPatientForm.type as PatientType,
          ownerName: quickPatientForm.ownerName,
          location: quickPatientForm.type === 'HUMAN' ? 'Cabinet' : 'Extérieur',
          address: 'Adresse à compléter',
      });

      if (newPatient) {
          // Refresh patients list
          const patientsData = await dataService.getPatients();
          setPatients(patientsData);
          handleInstantSession(newPatient);
      }
  };

  const handleCompleteSession = async () => {
    if (activeAppointment && activeAppointment.id) {
        await dataService.updateAppointment(activeAppointment.id, { status: ApptStatus.COMPLETED });
        // Refresh appointments list
        const appointmentsData = await dataService.getAppointments();
        setAppointments(appointmentsData);
    }
    setActiveAppointment(null);
    setCurrentView('finance');
  };

  const handleUpdateSettings = async (newSettings: AppSettings) => {
      if (newSettings.id) {
          await dataService.updateSettings(newSettings.id, newSettings);
          // Refresh settings list
          const settingsData = await dataService.getSettings();
          setSettings(settingsData);
      }
  };

  const handleOpenNewAppt = (apptToEdit?: Appointment) => {
      setSuggestedTimeSlots([]); // Clear previous suggestions
      if (apptToEdit && apptToEdit.id) {
          setEditingApptId(apptToEdit.id);
          const d = new Date(apptToEdit.startTime);
          setNewApptData({
              patientId: String(apptToEdit.patientId),
              isNewPatient: false,
              newPatientName: '',
              newPatientType: 'HUMAN',
              newPatientAddress: '',
              date: d.toISOString().split('T')[0],
              time: d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
              type: apptToEdit.type === 'BLOCK' ? 'CABINET' : apptToEdit.type as any,
              notes: apptToEdit.notes?.replace(/.* - /, '') || ''
          });
      } else {
          setEditingApptId(null);
          setNewApptData({
              patientId: '',
              isNewPatient: false,
              newPatientName: '',
              newPatientType: 'HUMAN',
              newPatientAddress: '',
              date: new Date().toISOString().split('T')[0],
              time: '09:00',
              type: 'CABINET',
              notes: ''
          });
      }
      setIsNewApptModalOpen(true);
  };

  const handleSaveAppointment = async () => {
      let patientId = newApptData.patientId;
      let patientName = "Patient";
      let targetAddress = appSettings?.cabinetAddress || "Cabinet";

      if (newApptData.isNewPatient) {
          const newPatientId = await dataService.createPatient({
              name: newApptData.newPatientName,
              type: newApptData.newPatientType as PatientType,
              location: newApptData.type === 'CABINET' ? 'Cabinet' : 'Extérieur',
              address: newApptData.newPatientAddress || 'Adresse à compléter'
          });
          patientId = String(newPatientId);
          patientName = newApptData.newPatientName;
          if (newApptData.type !== 'CABINET') targetAddress = newApptData.newPatientAddress;
          // Refresh patients list
          const patientsData = await dataService.getPatients();
          setPatients(patientsData);
      } else {
          const p = patients?.find(p => String(p.id) === String(patientId));
          if (p) {
              patientName = p.name;
              if (newApptData.type !== 'CABINET') targetAddress = p.address;
          }
      }

      const start = new Date(`${newApptData.date}T${newApptData.time}`);

      const check = checkAvailability(
          start,
          60,
          targetAddress,
          appointments || [],
          patients || []
      );

      if (!check.available && !confirm(`Attention Conflit Logistique:\n${check.reason}\n\nVoulez-vous forcer le rendez-vous ?`)) {
          return;
      }

      let logisticsData = {};
      if (newApptData.type !== 'CABINET') {
          const stats = calculateLogistics(appSettings?.cabinetAddress || "Cabinet", targetAddress);
          logisticsData = {
              distanceKm: stats.distanceKm,
              travelDurationMin: stats.durationMin,
              travelFee: stats.cost
          };
      }

      const apptData = {
          patientId,
          startTime: start.toISOString(),
          durationMin: 60,
          status: ApptStatus.SCHEDULED,
          // Explicit cast to satisfy the Union Type for TypeScript
          type: newApptData.type as 'CABINET' | 'DOMICILE' | 'STABLE' | 'BLOCK',
          notes: `${patientName} - ${newApptData.notes}`,
          price: 80,
          ...logisticsData
      };

      if (editingApptId) {
          await dataService.updateAppointment(editingApptId, apptData);
      } else {
          await dataService.createAppointment(apptData as Appointment);
      }

      // Refresh appointments list
      const appointmentsData = await dataService.getAppointments();
      setAppointments(appointmentsData);

      setSuggestedTimeSlots([]); // Clear suggestions on close
      setIsNewApptModalOpen(false);
  };

  const handleCloseApptModal = () => {
      setSuggestedTimeSlots([]);
      setIsNewApptModalOpen(false);
  };

  const renderNewApptModal = () => (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800">{editingApptId ? 'Modifier RDV' : 'Nouveau Rendez-vous'}</h3>
                  <button onClick={handleCloseApptModal}><X size={24} className="text-slate-400"/></button>
              </div>

              <div className="space-y-4">
                  <div className="flex p-1 bg-gray-100 rounded-lg mb-4">
                      <button 
                        onClick={() => setNewApptData({...newApptData, isNewPatient: false})}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${!newApptData.isNewPatient ? 'bg-white shadow text-primary-600' : 'text-slate-500'}`}
                      >
                          Patient Existant
                      </button>
                      <button 
                        onClick={() => setNewApptData({...newApptData, isNewPatient: true})}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${newApptData.isNewPatient ? 'bg-white shadow text-primary-600' : 'text-slate-500'}`}
                      >
                          Nouveau Patient
                      </button>
                  </div>

                  {newApptData.isNewPatient ? (
                      <div className="space-y-3 bg-primary-50 p-4 rounded-xl border border-primary-100">
                          <input 
                            type="text" placeholder="Nom complet"
                            className="w-full p-3 rounded-lg border border-primary-200"
                            value={newApptData.newPatientName}
                            onChange={e => setNewApptData({...newApptData, newPatientName: e.target.value})}
                          />
                          <select 
                             className="w-full p-3 rounded-lg border border-primary-200"
                             value={newApptData.newPatientType}
                             onChange={e => setNewApptData({...newApptData, newPatientType: e.target.value})}
                          >
                              <option value="HUMAN">Humain</option>
                              <option value="EQUINE">Cheval</option>
                              <option value="CANINE">Chien</option>
                          </select>
                          <input 
                            type="text" placeholder="Adresse complète"
                            className="w-full p-3 rounded-lg border border-primary-200"
                            value={newApptData.newPatientAddress}
                            onChange={e => setNewApptData({...newApptData, newPatientAddress: e.target.value})}
                          />
                      </div>
                  ) : (
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Patient</label>
                          <select 
                            className="w-full p-3 border border-gray-200 rounded-xl bg-white"
                            value={newApptData.patientId}
                            onChange={e => setNewApptData({...newApptData, patientId: e.target.value})}
                          >
                              <option value="">Sélectionner...</option>
                              {patients?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                      </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                          <input
                            type="date"
                            className="w-full p-3 border border-gray-200 rounded-xl"
                            value={newApptData.date}
                            onChange={e => setNewApptData({...newApptData, date: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Heure</label>
                          <input
                            type="time"
                            className="w-full p-3 border border-gray-200 rounded-xl"
                            value={newApptData.time}
                            onChange={e => setNewApptData({...newApptData, time: e.target.value})}
                          />
                      </div>
                  </div>

                  {suggestedTimeSlots.length > 0 && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 animate-fadeIn">
                      <div className="flex items-center mb-2">
                        <MapPin size={14} className="text-indigo-600 mr-1" />
                        <span className="text-xs font-bold text-indigo-700 uppercase">Suggestions Optimisées</span>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {suggestedTimeSlots.map((slot, idx) => {
                          const slotTime = new Date(slot.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                          const scoreColor = slot.score >= 80 ? 'bg-green-100 text-green-700 border-green-300' :
                                            slot.score >= 60 ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                            'bg-gray-100 text-gray-600 border-gray-300';

                          return (
                            <button
                              key={idx}
                              onClick={() => setNewApptData({...newApptData, time: slotTime})}
                              className={`w-full text-left p-2.5 rounded-lg border-2 transition-all hover:shadow-md ${scoreColor}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-sm">{slotTime}</span>
                                <span className="text-xs px-2 py-0.5 bg-white/50 rounded-full font-bold">
                                  Score {slot.score}
                                </span>
                              </div>
                              <p className="text-xs leading-relaxed">{slot.reason}</p>
                              {slot.savingsKm && slot.savingsKm > 0 && (
                                <div className="mt-1 flex items-center text-xs font-bold opacity-80">
                                  <Clock size={10} className="mr-1" />
                                  Économie: {slot.savingsKm.toFixed(1)}km • {slot.savingsTime}min
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Lieu / Type</label>
                      <div className="grid grid-cols-3 gap-2">
                          {['CABINET', 'STABLE', 'DOMICILE', 'BLOCK'].map(type => (
                              <button 
                                key={type}
                                onClick={() => setNewApptData({...newApptData, type: type as any})}
                                className={`py-2 text-xs font-bold rounded-lg border ${newApptData.type === type ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-gray-200 text-slate-600'}`}
                              >
                                  {type === 'STABLE' ? 'Écurie' : type === 'BLOCK' ? 'BLOQUÉ' : type}
                              </button>
                          ))}
                      </div>
                  </div>

                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Notes</label>
                      <textarea 
                        className="w-full p-3 border border-gray-200 rounded-xl"
                        rows={2}
                        value={newApptData.notes}
                        onChange={e => setNewApptData({...newApptData, notes: e.target.value})}
                      />
                  </div>

                  <button 
                    onClick={handleSaveAppointment}
                    className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl shadow-lg hover:bg-primary-700 mt-2"
                  >
                      {editingApptId ? 'Mettre à jour' : 'Créer Rendez-vous'}
                  </button>
              </div>
          </div>
      </div>
  );

  const renderQuickSessionModal = () => {
      const filteredForQuick = patients?.filter(p => p.name.toLowerCase().includes(quickSearchTerm.toLowerCase()));

      return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
                    <h3 className="font-bold flex items-center"><Zap size={18} className="mr-2 text-yellow-400"/> Séance Flash</h3>
                    <button onClick={() => { setIsQuickSessionModalOpen(false); setIsCreatingQuickPatient(false); }}><X size={20}/></button>
                </div>
                
                <div className="p-4">
                    <div className="flex space-x-2 mb-4">
                         <button 
                             onClick={() => setIsCreatingQuickPatient(false)}
                             className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-colors ${!isCreatingQuickPatient ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-gray-200 text-slate-400'}`}
                         >
                             <Search size={14} className="inline mr-1"/> Chercher
                         </button>
                         <button 
                             onClick={() => setIsCreatingQuickPatient(true)}
                             className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-colors ${isCreatingQuickPatient ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-gray-200 text-slate-400'}`}
                         >
                             <Plus size={14} className="inline mr-1"/> Nouveau
                         </button>
                    </div>

                    {isCreatingQuickPatient ? (
                        <div className="space-y-4 animate-fadeIn">
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom Patient</label>
                                 <input 
                                     type="text" 
                                     className="w-full p-3 border border-gray-200 rounded-xl"
                                     value={quickPatientForm.name}
                                     onChange={e => setQuickPatientForm({...quickPatientForm, name: e.target.value})}
                                 />
                             </div>
                             <div className="grid grid-cols-2 gap-3">
                                 <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                                    <select 
                                        className="w-full p-3 border border-gray-200 rounded-xl bg-white"
                                        value={quickPatientForm.type}
                                        onChange={e => setQuickPatientForm({...quickPatientForm, type: e.target.value})}
                                    >
                                        <option value="HUMAN">Humain</option>
                                        <option value="EQUINE">Cheval</option>
                                        <option value="CANINE">Chien</option>
                                    </select>
                                 </div>
                                 {quickPatientForm.type !== 'HUMAN' && (
                                     <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Propriétaire</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-3 border border-gray-200 rounded-xl"
                                            value={quickPatientForm.ownerName}
                                            onChange={e => setQuickPatientForm({...quickPatientForm, ownerName: e.target.value})}
                                        />
                                     </div>
                                 )}
                             </div>
                             <button 
                                 onClick={handleCreateAndStartQuickPatient}
                                 className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg mt-2"
                             >
                                 Créer et Démarrer
                             </button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Rechercher patient..." 
                                    className="w-full p-3 pl-10 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-primary-200"
                                    value={quickSearchTerm}
                                    onChange={e => setQuickSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="max-h-[300px] overflow-y-auto space-y-2">
                                {filteredForQuick?.map(p => (
                                    <button 
                                        key={p.id}
                                        onClick={() => handleInstantSession(p)}
                                        className="w-full flex items-center p-3 hover:bg-primary-50 rounded-xl transition-colors text-left group"
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs mr-3
                                            ${p.type === PatientType.HUMAN ? 'bg-teal-500' : 'bg-amber-500'}`}>
                                            {p.name.substring(0,2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 group-hover:text-primary-700">{p.name}</p>
                                            <p className="text-xs text-slate-500">{p.type} • {p.location}</p>
                                        </div>
                                        <ChevronLeft className="ml-auto text-gray-300 rotate-180 group-hover:text-primary-400" size={16} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      );
  };

  return (
    <div className="flex h-screen bg-white w-full overflow-hidden">
      <Navigation currentView={currentView} setView={setCurrentView} />
      
      <main className="flex-1 h-full w-full overflow-hidden md:pl-64 flex flex-col relative">
        <header className="md:hidden h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-10">
             <div className="font-bold text-lg text-slate-800">{appSettings?.appName || 'TheraFlow'}</div>
             <div className="flex items-center space-x-2">
                 <button onClick={() => setIsClientBookingOpen(true)} className="p-2 bg-slate-100 rounded-full text-slate-600"><Globe size={18}/></button>
                 <button onClick={() => setIsQuickSessionModalOpen(true)} className="p-2 bg-amber-100 rounded-full text-amber-600"><Zap size={18}/></button>
             </div>
        </header>

        <div className="hidden md:flex justify-between items-center p-6 pb-2 shrink-0">
            <h1 className="text-2xl font-bold text-slate-800 capitalize">
                {currentView === 'dashboard' ? 'Tableau de Bord' : 
                 currentView === 'calendar' ? 'Agenda' : 
                 currentView === 'patients' ? 'Base Patients' : currentView}
            </h1>
            <div className="flex items-center space-x-3">
                <button 
                    onClick={() => setIsClientBookingOpen(true)}
                    className="flex items-center px-4 py-2 bg-white border border-gray-200 text-slate-600 font-bold rounded-lg hover:bg-gray-50 shadow-sm"
                >
                    <Globe size={16} className="mr-2" /> Page Client
                </button>
                <button 
                    onClick={() => setIsQuickSessionModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 shadow-lg shadow-amber-200"
                >
                    <Zap size={16} className="mr-2" /> Séance Flash
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 pt-2 pb-20 md:pb-6">
          {currentView === 'dashboard' && (
            <DailyDashboard 
              appointments={appointments || []} 
              patients={patients || []}
              settings={appSettings}
              onStartSession={handleStartSession}
              onQuickSession={() => setIsQuickSessionModalOpen(true)}
            />
          )}
          
          {currentView === 'calendar' && (
            <CalendarModule 
               appointments={appointments || []}
               onAddAppointment={() => handleOpenNewAppt()}
               onEditAppointment={(appt) => handleOpenNewAppt(appt)}
            />
          )}
          
          {currentView === 'patients' && (
            <PatientList
              patients={patients || []}
              onSelectPatient={(p) => {
                 setNewApptData({...newApptData, patientId: String(p.id), isNewPatient: false});
                 setIsNewApptModalOpen(true);
              }}
              onAddPatient={() => {
                 setNewApptData({...newApptData, isNewPatient: true, patientId: ''});
                 setIsNewApptModalOpen(true);
              }}
              onInstantSession={handleInstantSession}
              onUpdatePatient={async (p) => {
                  if (p.id) {
                    await dataService.updatePatient(p.id, p);
                    // Refresh patients list
                    const patientsData = await dataService.getPatients();
                    setPatients(patientsData);
                  }
              }}
            />
          )}

          {currentView === 'finance' && (
            <FinanceModule
              invoices={invoices || []}
              expenses={expenses || []}
            />
          )}

          {currentView === 'urssaf' && <UrssafModule />}

          {currentView === 'session' && activeAppointment && (
            <SessionWizard 
              patient={patients?.find(p => String(p.id) === String(activeAppointment.patientId)) || {} as Patient}
              settings={appSettings}
              onComplete={handleCompleteSession}
            />
          )}

          {currentView === 'coach' && <AICoach />}

          {currentView === 'settings' && appSettings && (
             <SettingsModule settings={appSettings} onSave={handleUpdateSettings} />
          )}

          {currentView === 'stats' && <AdvancedStatistics />}

          {currentView === 'reminders' && <ReminderModule invoices={invoices || []} />}

          {currentView === 'records' && <SessionHistory />}

          {currentView === 'planner' && <WeeklyPlanner />}

          {currentView === 'templates' && <SessionTemplates />}

          {currentView === 'marketing' && <MarketingAutomation />}

          {currentView === 'satisfaction' && <SatisfactionSurvey />}

          {currentView === 'inventory' && <ProductsInventory />}

          {currentView === 'loyalty' && <LoyaltyPromoModule />}

          {currentView === 'rgpd' && <RGPDModule />}

          {currentView === 'goals' && <GoalsWidget />}

          {currentView === 'migration' && <MigrationWizard />}
        </div>

        {isNewApptModalOpen && renderNewApptModal()}
        {isQuickSessionModalOpen && renderQuickSessionModal()}
        {isClientBookingOpen && (
            <div className="fixed inset-0 z-50 bg-white">
                <button
                    onClick={() => setIsClientBookingOpen(false)}
                    className="fixed top-4 right-4 z-50 p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                >
                    <X size={24} className="text-slate-600" />
                </button>
                <PublicAppointmentRequest />
            </div>
        )}
      </main>
    </div>
  );
};

export default App;