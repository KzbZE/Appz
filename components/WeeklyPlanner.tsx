import React, { useState, useMemo, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { Appointment, Patient, ApptStatus, PatientType } from '../types';
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, MapPin, User, X, Edit, Trash2, Sun, Cloud, CloudRain, Save } from 'lucide-react';
import { checkAuth, createCalendarEvent } from '../services/googleApiService';

const WeeklyPlanner: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [appointmentsData, patientsData] = await Promise.all([
        dataService.getAppointments(),
        dataService.getPatients()
      ]);
      setAppointments(appointmentsData);
      setPatients(patientsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Start on Monday
    return new Date(now.setDate(diff));
  });

  const [selectedSlot, setSelectedSlot] = useState<{ day: number; hour: number } | null>(null);

  // ✅ NOUVEAU : Modal création RDV
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newApptData, setNewApptData] = useState({
    patientId: '',
    type: 'CABINET' as 'CABINET' | 'DOMICILE' | 'STABLE',
    notes: '',
    durationMin: 60
  });

  // Generate week days (Monday to Sunday)
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      return date;
    });
  }, [currentWeekStart]);

  // Hours (8am to 8pm)
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);

  // Filter appointments for current week
  const weekAppointments = useMemo(() => {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return appointments.filter(appt => {
      const apptDate = new Date(appt.startTime);
      return apptDate >= currentWeekStart && apptDate < weekEnd;
    });
  }, [appointments, currentWeekStart]);

  // Navigate weeks
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    setCurrentWeekStart(new Date(now.setDate(diff)));
  };

  // Get appointments for specific day and hour
  const getAppointmentsForSlot = (dayIndex: number, hour: number) => {
    const slotDate = new Date(weekDays[dayIndex]);
    slotDate.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(slotDate);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    return weekAppointments.filter(appt => {
      const apptStart = new Date(appt.startTime);
      const apptEnd = new Date(apptStart.getTime() + appt.durationMin * 60000);

      return (
        (apptStart >= slotDate && apptStart < slotEnd) ||
        (apptEnd > slotDate && apptEnd <= slotEnd) ||
        (apptStart <= slotDate && apptEnd >= slotEnd)
      );
    });
  };

  // Get patient name
  const getPatientName = (patientId: string | number) => {
    const patient = patients.find(p => String(p.id) === String(patientId));
    return patient?.name || 'Patient inconnu';
  };

  const getPatientType = (patientId: string | number) => {
    const patient = patients.find(p => String(p.id) === String(patientId));
    return patient?.type;
  };

  // Simple weather (mock - could integrate real API)
  const getWeatherIcon = (dayIndex: number) => {
    const random = (dayIndex + new Date().getDate()) % 3;
    if (random === 0) return <Sun size={16} className="text-yellow-500" />;
    if (random === 1) return <Cloud size={16} className="text-gray-400" />;
    return <CloudRain size={16} className="text-blue-400" />;
  };

  const handleSlotClick = (dayIndex: number, hour: number) => {
    setSelectedSlot({ day: dayIndex, hour });
    setShowCreateModal(true); // ✅ Ouvrir le modal de création
  };

  // ✅ NOUVEAU : Créer un rendez-vous
  const handleCreateAppointment = async () => {
    if (!selectedSlot || !newApptData.patientId) {
      alert('Veuillez sélectionner un patient');
      return;
    }

    const slotDate = new Date(weekDays[selectedSlot.day]);
    slotDate.setHours(selectedSlot.hour, 0, 0, 0);

    // Créer le RDV dans la base de données
    const newAppointment = await dataService.createAppointment({
      patientId: newApptData.patientId,
      startTime: slotDate.toISOString(),
      durationMin: newApptData.durationMin,
      status: ApptStatus.SCHEDULED,
      type: newApptData.type,
      notes: newApptData.notes,
      price: 0
    });

    // ✅ Exporter automatiquement vers Google Calendar si connecté
    try {
      const isAuthed = await checkAuth();
      if (isAuthed && newAppointment && newAppointment.id) {
        const patient = patients.find(p => String(p.id) === String(newApptData.patientId));
        const patientName = patient?.name || 'Patient';

        const endDate = new Date(slotDate);
        endDate.setMinutes(endDate.getMinutes() + newApptData.durationMin);

        const googleEvent = await createCalendarEvent({
          summary: `${patientName} - ${newApptData.type}`,
          description: newApptData.notes || '',
          start: slotDate.toISOString(),
          end: endDate.toISOString(),
          location: patient?.address || ''
        });

        // Sauvegarder l'ID Google pour la synchro bidirectionnelle
        if (googleEvent && googleEvent.id) {
          await dataService.updateAppointment(newAppointment.id, { googleEventId: googleEvent.id });
        }
      }
    } catch (error) {
      console.log("Export Google Calendar échoué (normal si non connecté):", error);
      // Ne pas bloquer la création du RDV si l'export Google échoue
    }

    // Refresh appointments list
    await loadData();

    // Reset et fermer
    setShowCreateModal(false);
    setNewApptData({
      patientId: '',
      type: 'CABINET',
      notes: '',
      durationMin: 60
    });
    setSelectedSlot(null);
  };

  const handleDeleteAppointment = async (apptId: string | number) => {
    if (confirm('Supprimer ce rendez-vous ?')) {
      await dataService.deleteAppointment(apptId);
      // Refresh appointments list
      await loadData();
    }
  };

  const getStatusColor = (status: ApptStatus) => {
    switch (status) {
      case ApptStatus.SCHEDULED: return 'bg-blue-100 border-blue-400 text-blue-800';
      case ApptStatus.COMPLETED: return 'bg-green-100 border-green-400 text-green-800';
      case ApptStatus.IN_PROGRESS: return 'bg-yellow-100 border-yellow-400 text-yellow-800';
      case ApptStatus.CANCELLED: return 'bg-red-100 border-red-400 text-red-800';
      default: return 'bg-gray-100 border-gray-400 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === 'CABINET') return '🏥';
    if (type === 'STABLE') return '🐴';
    if (type === 'DOMICILE') return '🏠';
    return '📍';
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const weekNumber = Math.ceil((currentWeekStart.getDate() + currentWeekStart.getDay()) / 7);

  return (
    <div className="h-full flex flex-col space-y-4 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Planning Hebdomadaire
          </h2>
          <p className="text-slate-500 text-sm mt-1">Semaine {weekNumber} • {currentWeekStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousWeek}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={20} className="text-slate-600" />
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold text-sm hover:shadow-lg transition-all"
          >
            Aujourd'hui
          </button>
          <button
            onClick={goToNextWeek}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ChevronRight size={20} className="text-slate-600" />
          </button>
        </div>
      </div>

      {/* Week View */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto h-full">
          <div className="min-w-[1200px]">
            {/* Days Header */}
            <div className="grid grid-cols-8 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="p-4 border-r border-gray-200 font-bold text-slate-600 text-sm">
                Horaire
              </div>
              {weekDays.map((day, idx) => {
                const isCurrentDay = isToday(day);
                return (
                  <div
                    key={idx}
                    className={`p-4 border-r border-gray-200 ${isCurrentDay ? 'bg-indigo-50' : ''}`}
                  >
                    <div className="text-center">
                      <div className={`text-xs uppercase font-medium ${isCurrentDay ? 'text-indigo-600' : 'text-slate-500'}`}>
                        {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                      </div>
                      <div className={`text-2xl font-bold mt-1 ${isCurrentDay ? 'text-indigo-600' : 'text-slate-800'}`}>
                        {day.getDate()}
                      </div>
                      <div className="flex justify-center mt-1">
                        {getWeatherIcon(idx)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time Grid */}
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b border-gray-100">
                {/* Hour Label */}
                <div className="p-4 border-r border-gray-200 text-sm font-medium text-slate-600">
                  {hour}:00
                </div>

                {/* Day Cells */}
                {weekDays.map((day, dayIdx) => {
                  const slotAppointments = getAppointmentsForSlot(dayIdx, hour);
                  const isCurrentHour = isToday(day) && new Date().getHours() === hour;

                  return (
                    <div
                      key={dayIdx}
                      onClick={() => handleSlotClick(dayIdx, hour)}
                      className={`p-2 border-r border-gray-200 min-h-[80px] cursor-pointer transition-all hover:bg-indigo-50/30 ${isCurrentHour ? 'bg-yellow-50 ring-2 ring-yellow-400' : ''
                        }`}
                    >
                      {slotAppointments.length === 0 ? (
                        <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Plus size={20} className="text-slate-300" />
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {slotAppointments.map((appt) => {
                            const patientType = getPatientType(appt.patientId);
                            const typeColor =
                              patientType === PatientType.HUMAN ? 'border-l-teal-500' :
                                patientType === PatientType.EQUINE ? 'border-l-amber-500' :
                                  'border-l-indigo-500';

                            return (
                              <div
                                key={appt.id}
                                className={`p-2 rounded-lg border-l-4 ${typeColor} ${getStatusColor(appt.status)} text-xs cursor-pointer hover:shadow-md transition-all group`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Open appointment detail modal (to implement)
                                }}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold truncate flex-1">
                                    {getPatientName(appt.patientId)}
                                  </span>
                                  <span className="text-[10px]">
                                    {getTypeIcon(appt.type)}
                                  </span>
                                </div>
                                <div className="flex items-center text-[10px] opacity-75">
                                  <Clock size={10} className="mr-1" />
                                  {new Date(appt.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  {' '}• {appt.durationMin}min
                                </div>
                                {appt.notes && (
                                  <div className="text-[10px] opacity-60 truncate mt-1">
                                    {appt.notes}
                                  </div>
                                )}
                                <div className="hidden group-hover:flex items-center gap-1 mt-2">
                                  <button
                                    className="p-1 bg-white rounded hover:bg-blue-100 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Edit appointment
                                    }}
                                  >
                                    <Edit size={12} />
                                  </button>
                                  <button
                                    className="p-1 bg-white rounded hover:bg-red-100 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (appt.id) handleDeleteAppointment(appt.id);
                                    }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-xl text-white">
          <div className="text-sm opacity-90">RDV cette semaine</div>
          <div className="text-3xl font-bold">{weekAppointments.length}</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-teal-600 p-4 rounded-xl text-white">
          <div className="text-sm opacity-90">Complétés</div>
          <div className="text-3xl font-bold">
            {weekAppointments.filter(a => a.status === ApptStatus.COMPLETED).length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-xl text-white">
          <div className="text-sm opacity-90">Cabinet</div>
          <div className="text-3xl font-bold">
            {weekAppointments.filter(a => a.type === 'CABINET').length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 rounded-xl text-white">
          <div className="text-sm opacity-90">Déplacements</div>
          <div className="text-3xl font-bold">
            {weekAppointments.filter(a => a.type !== 'CABINET').length}
          </div>
        </div>
      </div>

      {/* ✅ NOUVEAU : Modal création RDV */}
      {showCreateModal && selectedSlot && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Nouveau Rendez-vous</h3>
              <button onClick={() => {
                setShowCreateModal(false);
                setSelectedSlot(null);
              }}>
                <X size={24} className="text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4">
              <div className="flex items-center text-indigo-700 text-sm font-medium">
                <Calendar size={16} className="mr-2" />
                {weekDays[selectedSlot.day].toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
              <div className="flex items-center text-indigo-600 text-xs mt-1">
                <Clock size={14} className="mr-2" />
                {selectedSlot.hour}:00
              </div>
            </div>

            <div className="space-y-4">
              {/* Patient */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Patient *</label>
                <select
                  value={newApptData.patientId}
                  onChange={(e) => setNewApptData({ ...newApptData, patientId: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                >
                  <option value="">Sélectionner un patient...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.type !== PatientType.HUMAN ? `(${p.ownerName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Type de consultation *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'CABINET', label: 'Cabinet', icon: '🏥' },
                    { value: 'STABLE', label: 'Écurie', icon: '🐴' },
                    { value: 'DOMICILE', label: 'Domicile', icon: '🏠' }
                  ].map(({ value, label, icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setNewApptData({ ...newApptData, type: value as any })}
                      className={`py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                        newApptData.type === value
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                          : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                      }`}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Durée */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Durée (minutes)</label>
                <select
                  value={newApptData.durationMin}
                  onChange={(e) => setNewApptData({ ...newApptData, durationMin: parseInt(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                >
                  <option value={30}>30 min</option>
                  <option value={60}>1 heure</option>
                  <option value={90}>1h30</option>
                  <option value={120}>2 heures</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Notes</label>
                <textarea
                  value={newApptData.notes}
                  onChange={(e) => setNewApptData({ ...newApptData, notes: e.target.value })}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none resize-none"
                  placeholder="Raison de consultation, remarques..."
                />
              </div>

              {/* Boutons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedSlot(null);
                  }}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateAppointment}
                  disabled={!newApptData.patientId}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-sm font-bold flex items-center shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={16} className="mr-2" />
                  Créer le rendez-vous
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyPlanner;
