import React, { useState } from 'react';
import { Appointment } from '../types';
import { ChevronLeft, ChevronRight, MapPin, Plus, Ban, RefreshCw } from 'lucide-react';
import { checkAuth, importCalendarEventsToLocal } from '../services/googleApiService';

interface CalendarModuleProps {
  appointments: Appointment[];
  onAddAppointment: () => void;
  onEditAppointment: (appt: Appointment) => void;
}

const CalendarModule: React.FC<CalendarModuleProps> = ({ appointments, onAddAppointment, onEditAppointment }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'DAY' | 'WEEK'>('DAY');
  const [isSyncing, setIsSyncing] = useState(false);

  const hours = Array.from({ length: 13 }, (_, i) => i + 8);

  const nextPeriod = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (view === 'DAY' ? 1 : 7));
    setCurrentDate(newDate);
  };

  const prevPeriod = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - (view === 'DAY' ? 1 : 7));
    setCurrentDate(newDate);
  };

  const handleSyncCalendar = async () => {
      setIsSyncing(true);
      try {
          const authed = await checkAuth();
          if (!authed) {
              alert("Connectez votre compte Google dans les paramètres pour synchroniser.");
              setIsSyncing(false);
              return;
          }

          // Import réel des événements Google Calendar vers Supabase
          const imported = await importCalendarEventsToLocal();
          alert(`✅ Synchronisation réussie !\n${imported.length} événements importés depuis Google Calendar.`);

          // Recharger la page pour afficher les nouveaux RDV
          window.location.reload();
      } catch (error) {
          console.error("Sync error:", error);
          alert("❌ Erreur de synchronisation. Vérifiez votre connexion Google dans Paramètres.");
      } finally {
          setIsSyncing(false);
      }
  };

  const getAppointmentsForDay = (date: Date) => {
      return appointments.filter(a => {
          const apptDate = new Date(a.startTime);
          return apptDate.getDate() === date.getDate() &&
                 apptDate.getMonth() === date.getMonth() &&
                 apptDate.getFullYear() === date.getFullYear();
      });
  };

  const renderDayColumn = (date: Date) => {
      const dailyAppts = getAppointmentsForDay(date);

      return (
          <div className="relative flex-1 h-full border-l border-gray-100 min-w-[150px] group">
              {hours.map(h => (
                  <div key={h} className="absolute w-full border-b border-gray-50 text-[10px] text-gray-300 p-1"
                       style={{ top: `${(h - 8) * 60}px`, height: '60px' }}>
                  </div>
              ))}

              {dailyAppts.map(appt => {
                  const start = new Date(appt.startTime);
                  const top = (start.getHours() - 8) * 60 + start.getMinutes();
                  const height = appt.durationMin;
                  const isBlocked = appt.type === 'BLOCK';

                  return (
                      <div key={appt.id}
                           onClick={() => onEditAppointment(appt)}
                           className={`absolute left-1 right-1 rounded-lg p-2 text-xs shadow-sm cursor-pointer hover:brightness-95 transition-all border-l-4 z-10 overflow-hidden
                           ${isBlocked ? 'bg-gray-200 border-gray-500 text-gray-500 opacity-70 hatch-pattern' :
                             appt.type === 'STABLE' ? 'bg-amber-50 border-amber-500 text-amber-900' : 'bg-teal-50 border-teal-500 text-teal-900'}`}
                           style={{ top: `${top}px`, height: `${height}px` }}
                      >
                          {isBlocked ? (
                              <div className="flex items-center justify-center h-full"><Ban size={16} className="mr-1"/> Indisponible</div>
                          ) : (
                              <>
                                <div className="font-bold flex justify-between">
                                    <span>{start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    {appt.type === 'STABLE' && <span className="text-[10px] bg-white/50 px-1 rounded">Ext.</span>}
                                </div>
                                <div className="font-medium truncate mt-1">{appt.notes}</div>
                              </>
                          )}
                      </div>
                  );
              })}

              {dailyAppts.map((appt, i) => {
                  if (i === 0) return null;
                  if (appt.type === 'BLOCK') return null;

                  const sorted = dailyAppts.sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
                  const prev = sorted[i-1];
                  if (prev.type === 'BLOCK') return null;

                  const prevEnd = new Date(prev.startTime).getTime() + prev.durationMin * 60000;
                  const currentStart = new Date(appt.startTime).getTime();
                  const gapMin = (currentStart - prevEnd) / 60000;

                  if (gapMin > 10 && gapMin < 180) {
                      const top = (new Date(prevEnd).getHours() - 8) * 60 + new Date(prevEnd).getMinutes();
                      return (
                          <div key={`travel-${i}`}
                               className="absolute left-4 right-4 bg-indigo-50/50 border border-indigo-100 rounded flex items-center justify-center pointer-events-none"
                               style={{ top: `${top}px`, height: `${gapMin}px` }}
                          >
                              <span className="text-[9px] text-indigo-400 font-medium flex items-center">
                                  <MapPin size={8} className="mr-1" /> Trajet {Math.floor(gapMin)} min
                              </span>
                          </div>
                      )
                  }
                  return null;
              })}
          </div>
      );
  };

  return (
    <div className="h-full flex flex-col bg-white">
       <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
            <div className="flex items-center">
                <div className="mr-4">
                    <h2 className="text-xl font-bold text-slate-800 capitalize">{view === 'DAY' ? currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' }) : 'Semaine'}</h2>
                </div>
                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button onClick={prevPeriod} className="p-1 hover:bg-white rounded shadow-sm"><ChevronLeft size={16}/></button>
                    <button onClick={nextPeriod} className="p-1 hover:bg-white rounded shadow-sm"><ChevronRight size={16}/></button>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <button
                    onClick={handleSyncCalendar}
                    className={`p-2 text-white rounded-full shadow-sm ${isSyncing ? 'bg-slate-400 animate-spin' : 'bg-blue-500 hover:bg-blue-600'}`}
                    title="Synchroniser Google Agenda"
                >
                    <RefreshCw size={16} />
                </button>
                <button
                    onClick={() => setView(view === 'DAY' ? 'WEEK' : 'DAY')}
                    className="hidden md:block px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600"
                >
                    {view === 'DAY' ? 'Semaine' : 'Jour'}
                </button>
                <button onClick={onAddAppointment} className="p-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110">
                    <Plus size={20} />
                </button>
            </div>
       </div>

       <div className="flex-1 overflow-y-auto relative">
          <div className="flex min-h-[800px]">
              <div className="w-12 shrink-0 border-r border-gray-100 bg-gray-50 text-xs text-slate-400 text-center pt-2 select-none">
                 {hours.map(h => (
                     <div key={h} className="h-[60px] relative">
                         <span className="absolute -top-2 left-0 right-0">{h}:00</span>
                     </div>
                 ))}
              </div>
              <div className="flex-1 flex relative">
                  {view === 'DAY' ? (
                      renderDayColumn(currentDate)
                  ) : (
                      [0,1,2,3,4].map(offset => {
                          const d = new Date(currentDate);
                          d.setDate(d.getDate() - d.getDay() + 1 + offset);
                          return (
                            <div key={offset} className="flex-1 border-r border-gray-100 min-w-[100px]">
                                <div className="text-center py-2 border-b border-gray-100 bg-gray-50 text-xs font-bold text-slate-600">
                                    {d.toLocaleDateString('fr-FR', {weekday: 'short', day: 'numeric'})}
                                </div>
                                {renderDayColumn(d)}
                            </div>
                          )
                      })
                  )}
              </div>
          </div>
       </div>
    </div>
  );
};

export default CalendarModule;
