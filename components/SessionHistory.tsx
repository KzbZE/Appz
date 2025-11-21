
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Session, Patient, PatientType, TensionPoint } from '../types';
import { Search, FileText, Edit, X, Save, Printer, Filter, Trash2 } from 'lucide-react';

const SessionHistory: React.FC = () => {
  const sessions = useLiveQuery(() => db.sessions.toArray());
  const patients = useLiveQuery(() => db.patients.toArray());
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editTensions, setEditTensions] = useState<TensionPoint[]>([]);

  if (!sessions || !patients) return <div className="p-8 text-center text-slate-400">Chargement des dossiers...</div>;

  const getPatient = (id: string | number) => patients.find(p => String(p.id) === String(id));

  const filteredSessions = sessions.filter(s => {
      const p = getPatient(s.patientId);
      if (!p) return false;
      
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.date.includes(searchTerm);
      const matchesType = filterType === 'ALL' || s.type === filterType;
      
      return matchesSearch && matchesType;
  }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleOpenSession = (s: Session) => {
      setSelectedSession(s);
      setEditNotes(s.treatmentNotes || '');
      setEditTensions(s.tensions || []);
      setIsEditing(false);
  };

  const handleSaveSession = async () => {
      if (selectedSession && selectedSession.id) {
          await db.sessions.update(selectedSession.id, { 
              treatmentNotes: editNotes,
              tensions: editTensions
          });
          setSelectedSession({ 
              ...selectedSession, 
              treatmentNotes: editNotes,
              tensions: editTensions
          });
          setIsEditing(false);
      }
  };

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isEditing) return;
      
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      const newPoint: TensionPoint = { 
          x, 
          y, 
          id: Date.now().toString(), 
          level: 5, 
          notes: '' 
      };
      setEditTensions([...editTensions, newPoint]);
  };

  const handlePointClick = (e: React.MouseEvent, pointId: string) => {
      if (!isEditing) return;
      e.stopPropagation(); 
      setEditTensions(editTensions.filter(t => t.id !== pointId));
  };

  const handlePrintPDF = () => {
      window.print();
  };

  const renderSessionDetail = (session: Session, patient: Patient) => (
      <div className="fixed inset-0 bg-black/60 z-[60] flex justify-center items-center p-4" onClick={() => setSelectedSession(null)}>
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
              
              <div className="flex-1 overflow-y-auto p-8 print:p-0" id="printable-area">
                  <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
                      <div>
                          <h1 className="text-2xl font-bold text-slate-800">Compte-Rendu de Séance</h1>
                          <p className="text-slate-500 text-sm mt-1">Fiche Médicale #{session.id}</p>
                      </div>
                      <div className="text-right">
                          <p className="font-bold text-primary-600 text-lg">{patient.name}</p>
                          <p className="text-slate-500 text-sm">{new Date(session.date).toLocaleDateString()} à {new Date(session.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                          <span className="inline-block mt-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-slate-600">{session.type}</span>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div>
                          <h3 className="font-bold text-slate-800 mb-3 uppercase text-xs tracking-wider">Anamnèse & Observations</h3>
                          <div className="bg-gray-50 p-4 rounded-xl text-sm space-y-2">
                              {Object.entries(session.anamnesis).map(([key, val]) => (
                                  key !== 'generatedReport' && (
                                      <div key={key}>
                                          <span className="text-slate-500 font-medium capitalize">{key}: </span>
                                          <span className="text-slate-800">{val}</span>
                                      </div>
                                  )
                              ))}
                          </div>
                      </div>
                      
                      <div>
                          <div className="flex justify-between items-center mb-3">
                              <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Body Mapping</h3>
                              {isEditing && (
                                  <button onClick={() => setEditTensions([])} className="text-xs text-red-500 flex items-center hover:underline">
                                      <Trash2 size={10} className="mr-1"/> Effacer tout
                                  </button>
                              )}
                          </div>
                          
                          <div className={`aspect-square bg-white border border-gray-200 rounded-xl relative flex items-center justify-center p-4 select-none
                              ${isEditing ? 'cursor-crosshair ring-2 ring-primary-100' : ''}`}>
                                {isEditing && <div className="absolute top-2 left-2 bg-white/80 px-2 py-1 rounded text-[10px] text-slate-500 pointer-events-none">Cliquez pour ajouter/supprimer</div>}
                                <svg viewBox="0 0 100 100" className="h-full w-full" onClick={handleMapClick}>
                                    {patient.type === PatientType.EQUINE ? (
                                        <path d="M20,50 Q25,30 40,35 T60,35 T80,45 L80,80 L70,80 L70,55 L50,55 L50,80 L40,80 L40,55 L25,55 Z" 
                                            fill="#f1f5f9" stroke="#64748b" strokeWidth="1.5" />
                                    ) : (
                                        <g transform="translate(25, 10) scale(0.5)">
                                            <path d="M50,10 Q60,10 60,20 L65,45 L90,40 L95,50 L70,60 L70,100 L80,150 L60,150 L55,100 L45,100 L40,150 L20,150 L30,100 L30,60 L5,50 L10,40 L35,45 L40,20 Q40,10 50,10 Z"
                                                fill="#f1f5f9" stroke="#64748b" strokeWidth="3"/>
                                        </g>
                                    )}
                                    
                                    {(isEditing ? editTensions : session.tensions)?.map((t, i) => (
                                        <circle 
                                            key={t.id || i} 
                                            cx={t.x} 
                                            cy={t.y} 
                                            r={isEditing ? "4" : "3"} 
                                            fill="#ef4444" 
                                            opacity={isEditing ? "1" : "0.8"}
                                            className={isEditing ? "cursor-pointer hover:stroke-2 hover:stroke-white" : ""}
                                            onClick={(e) => handlePointClick(e, t.id)}
                                        />
                                    ))}
                                </svg>
                          </div>
                      </div>
                  </div>

                  <div className="mb-8">
                      <div className="flex justify-between items-center mb-3">
                          <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Notes de Traitement</h3>
                          {!isEditing && (
                              <button onClick={() => setIsEditing(true)} className="text-primary-600 hover:text-primary-700 text-xs font-bold flex items-center print:hidden">
                                  <Edit size={12} className="mr-1"/> Modifier Séance
                              </button>
                          )}
                      </div>
                      
                      {isEditing ? (
                          <div className="space-y-2">
                              <textarea 
                                className="w-full p-3 border border-primary-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                rows={5}
                                value={editNotes}
                                onChange={e => setEditNotes(e.target.value)}
                              />
                              <div className="flex justify-end space-x-2">
                                  <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-xs text-slate-500">Annuler</button>
                                  <button onClick={handleSaveSession} className="px-3 py-1 bg-primary-600 text-white rounded-lg text-xs font-bold flex items-center">
                                      <Save size={12} className="mr-1"/> Enregistrer
                                  </button>
                              </div>
                          </div>
                      ) : (
                          <div className="bg-white border border-gray-200 p-4 rounded-xl text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                              {session.treatmentNotes}
                          </div>
                      )}
                  </div>

                  {session.anamnesis.generatedReport && (
                       <div className="mb-6">
                           <h3 className="font-bold text-slate-800 mb-3 uppercase text-xs tracking-wider">Synthèse IA</h3>
                           <div className="bg-indigo-50 p-4 rounded-xl text-sm text-indigo-900 italic border border-indigo-100">
                               {session.anamnesis.generatedReport}
                           </div>
                       </div>
                  )}
              </div>

              <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-between items-center print:hidden">
                  <button onClick={() => setSelectedSession(null)} className="px-4 py-2 text-slate-600 hover:bg-gray-200 rounded-lg font-medium">Fermer</button>
                  <button onClick={handlePrintPDF} className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold flex items-center hover:bg-slate-700 shadow-lg">
                      <Printer size={18} className="mr-2" /> Imprimer / PDF
                  </button>
              </div>
          </div>
      </div>
  );

  return (
    <div className="h-full flex flex-col space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
             <h2 className="text-2xl font-bold text-slate-800">Dossiers & Historique</h2>
             <p className="text-slate-500 text-sm">Consultez et gérez l'historique médical des séances.</p>
         </div>
         
         <div className="flex space-x-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
             <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                 <input 
                    type="text" 
                    placeholder="Chercher..." 
                    className="pl-9 pr-4 py-1.5 text-sm bg-transparent border-none outline-none w-40 focus:w-60 transition-all"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                 />
             </div>
             <div className="h-8 w-px bg-gray-200 mx-2"></div>
             <select 
                className="text-sm bg-transparent border-none outline-none text-slate-600 font-medium cursor-pointer pr-2"
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
             >
                 <option value="ALL">Tous Types</option>
                 <option value="KINESIO">Kinésio</option>
                 <option value="MASSAGE">Massage</option>
             </select>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-gray-100 shadow-sm">
          <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-slate-500 font-medium border-b border-gray-100">
                  <tr>
                      <th className="p-4">Date</th>
                      <th className="p-4">Patient</th>
                      <th className="p-4">Type</th>
                      <th className="p-4 hidden md:table-cell">Notes (Aperçu)</th>
                      <th className="p-4 text-right">Actions</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                  {filteredSessions.map(session => {
                      const patient = getPatient(session.patientId);
                      if (!patient) return null;
                      
                      return (
                          <tr key={session.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => handleOpenSession(session)}>
                              <td className="p-4 whitespace-nowrap">
                                  <div className="font-bold text-slate-700">{new Date(session.date).toLocaleDateString()}</div>
                                  <div className="text-xs text-slate-400">{new Date(session.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                              </td>
                              <td className="p-4">
                                  <div className="flex items-center">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3
                                          ${patient.type === PatientType.HUMAN ? 'bg-teal-500' : patient.type === PatientType.EQUINE ? 'bg-amber-500' : 'bg-indigo-500'}`}>
                                          {patient.name.substring(0,2).toUpperCase()}
                                      </div>
                                      <div>
                                          <div className="font-bold text-slate-800">{patient.name}</div>
                                          <div className="text-xs text-slate-500">{patient.type === 'HUMAN' ? 'Cabinet' : patient.ownerName}</div>
                                      </div>
                                  </div>
                              </td>
                              <td className="p-4">
                                  <span className={`px-2 py-1 rounded-md text-xs font-bold
                                      ${session.type === 'KINESIO' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                                      {session.type}
                                  </span>
                              </td>
                              <td className="p-4 hidden md:table-cell text-slate-500 max-w-xs truncate">
                                  {session.treatmentNotes || 'Aucune note...'}
                              </td>
                              <td className="p-4 text-right">
                                  <button className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors">
                                      <FileText size={18} />
                                  </button>
                              </td>
                          </tr>
                      );
                  })}
              </tbody>
          </table>
      </div>

      {selectedSession && filteredSessions.find(s => s.id === selectedSession.id) && 
        renderSessionDetail(selectedSession, getPatient(selectedSession.patientId)!)
      }
    </div>
  );
};

export default SessionHistory;
