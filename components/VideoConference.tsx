import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Monitor,
  MessageSquare,
  Settings,
  Users,
  Clock,
  PlayCircle,
  StopCircle,
  AlertCircle,
  CheckCircle,
  Calendar
} from 'lucide-react';
import {
  createJitsiSession,
  createWherebySession,
  startRecording,
  stopRecording,
  shareScreen,
  getSessionReport
} from '../services/videoConferenceService';
import { Appointment, Patient } from '../types';

const VideoConference: React.FC = () => {
  const patients = useLiveQuery(() => db.patients.toArray()) || [];
  const appointments = useLiveQuery(() => db.appointments.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.toArray())?.[0];

  const [activeSession, setActiveSession] = useState<any>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [platform, setPlatform] = useState<'jitsi' | 'whereby'>('jitsi');

  useEffect(() => {
    // Charger l'historique des sessions de visio
    const loadHistory = async () => {
      // Simulé - en production, charger depuis la DB
      setSessionHistory([]);
    };
    loadHistory();
  }, []);

  const handleStartSession = async () => {
    if (!selectedPatient) {
      alert('Veuillez sélectionner un patient');
      return;
    }

    const patient = patients.find(p => p.id === selectedPatient);
    if (!patient) return;

    try {
      let session;
      if (platform === 'jitsi') {
        session = await createJitsiSession(
          `session-${Date.now()}`,
          settings?.practitionerName || 'Praticien',
          patient.name
        );
      } else {
        session = await createWherebySession(
          `session-${Date.now()}`,
          settings?.practitionerName || 'Praticien',
          patient.name
        );
      }

      setActiveSession(session);
      setIsInCall(true);

      // Créer un rendez-vous automatiquement
      await db.appointments.add({
        patientId: selectedPatient,
        startTime: new Date().toISOString(),
        durationMin: 30,
        status: 'IN_PROGRESS',
        type: 'TELECONSULTATION',
        price: 0,
        notes: 'Téléconsultation'
      });
    } catch (error) {
      console.error('Erreur démarrage session:', error);
      alert('Erreur lors du démarrage de la session');
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;

    try {
      if (isRecording) {
        await stopRecording(activeSession.sessionId);
      }

      // Générer rapport de session
      const report = await getSessionReport(activeSession.sessionId);

      setIsInCall(false);
      setActiveSession(null);
      setIsRecording(false);
      setIsMuted(false);
      setIsVideoOff(false);
      setChatMessages([]);

      alert(`Session terminée\nDurée: ${report.duration} minutes\nParticipants: ${report.participants.length}`);
    } catch (error) {
      console.error('Erreur fin session:', error);
    }
  };

  const handleToggleRecording = async () => {
    if (!activeSession) return;

    try {
      if (isRecording) {
        await stopRecording(activeSession.sessionId);
      } else {
        const consentGiven = window.confirm(
          'Enregistrer cette session?\n\nLe patient doit avoir donné son consentement préalable (RGPD).'
        );
        if (consentGiven) {
          await startRecording(activeSession.sessionId);
        } else {
          return;
        }
      }
      setIsRecording(!isRecording);
    } catch (error) {
      console.error('Erreur enregistrement:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleShareScreen = async () => {
    if (!activeSession) return;

    try {
      await shareScreen(activeSession.sessionId);
      alert('Partage d\'écran démarré\n\nVous pouvez maintenant montrer des exercices ou des documents au patient.');
    } catch (error) {
      console.error('Erreur partage écran:', error);
      alert('Erreur lors du partage d\'écran');
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      sender: 'Praticien',
      text: newMessage,
      timestamp: new Date().toISOString()
    };

    setChatMessages([...chatMessages, message]);
    setNewMessage('');
  };

  const upcomingVideoAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.startTime);
    const now = new Date();
    return (
      apt.type === 'TELECONSULTATION' &&
      apt.status === 'SCHEDULED' &&
      aptDate > now
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-lg">
              <Video className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900">Téléconsultation</h1>
              <p className="text-slate-600">Visioconférence sécurisée avec vos patients</p>
            </div>
          </div>
        </div>

        {!isInCall ? (
          <>
            {/* Configuration */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Démarrer une session</h2>

              {/* Choix plateforme */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Plateforme</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setPlatform('jitsi')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      platform === 'jitsi'
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Video size={24} className={platform === 'jitsi' ? 'text-purple-600' : 'text-slate-400'} />
                      <div className="text-left">
                        <p className="font-bold text-slate-900">Jitsi Meet</p>
                        <p className="text-xs text-slate-600">Open source, gratuit</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setPlatform('whereby')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      platform === 'whereby'
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Video size={24} className={platform === 'whereby' ? 'text-purple-600' : 'text-slate-400'} />
                      <div className="text-left">
                        <p className="font-bold text-slate-900">Whereby</p>
                        <p className="text-xs text-slate-600">API premium</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Sélection patient */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Patient</label>
                <select
                  value={selectedPatient || ''}
                  onChange={(e) => setSelectedPatient(Number(e.target.value))}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-purple-600 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                >
                  <option value="">Sélectionnez un patient</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bouton démarrer */}
              <button
                onClick={handleStartSession}
                disabled={!selectedPatient}
                className="w-full p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <div className="flex items-center justify-center gap-3">
                  <Video size={24} />
                  <span>Démarrer la session</span>
                </div>
              </button>
            </div>

            {/* Rendez-vous à venir */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar size={24} className="text-slate-600" />
                <h2 className="text-xl font-bold text-slate-900">Téléconsultations programmées</h2>
              </div>

              {upcomingVideoAppointments.length === 0 ? (
                <p className="text-slate-600 text-center py-8">Aucune téléconsultation programmée</p>
              ) : (
                <div className="space-y-3">
                  {upcomingVideoAppointments.map(apt => {
                    const patient = patients.find(p => p.id === apt.patientId);
                    const aptDate = new Date(apt.startTime);
                    return (
                      <div key={apt.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                          <p className="font-bold text-slate-900">{patient?.name}</p>
                          <p className="text-sm text-slate-600">
                            {aptDate.toLocaleDateString('fr-FR')} à {aptDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedPatient(apt.patientId);
                            handleStartSession();
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                        >
                          Rejoindre
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Info configuration */}
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={24} />
                <div className="text-sm text-slate-700">
                  <p className="font-bold mb-2">Configuration requise</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li><strong>Jitsi Meet</strong>: Gratuit, open source, aucune configuration requise</li>
                    <li><strong>Whereby</strong>: Nécessite une API key (paramètres → Intégrations)</li>
                    <li>Enregistrements: Consentement patient obligatoire (RGPD)</li>
                    <li>Qualité: Connexion stable 5+ Mbps recommandée</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Écran en appel */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              {/* Zone vidéo */}
              <div className="relative bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl aspect-video mb-6 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  {isVideoOff ? (
                    <div className="text-center text-white">
                      <VideoOff size={64} className="mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-semibold">Caméra désactivée</p>
                    </div>
                  ) : (
                    <div className="text-center text-white">
                      <Video size={64} className="mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-semibold">Session en cours</p>
                      <p className="text-sm opacity-70">Intégration Jitsi/Whereby ici</p>
                    </div>
                  )}
                </div>

                {/* Overlay infos */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <div className="px-4 py-2 bg-black/50 rounded-lg backdrop-blur-sm">
                    <p className="text-white font-semibold">
                      {patients.find(p => p.id === selectedPatient)?.name}
                    </p>
                  </div>

                  {isRecording && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-600 rounded-lg">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                      <span className="text-white font-bold">REC</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contrôles */}
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-4 rounded-full ${
                    isMuted ? 'bg-red-500' : 'bg-slate-700'
                  } text-white hover:opacity-80 transition-all`}
                >
                  {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>

                <button
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  className={`p-4 rounded-full ${
                    isVideoOff ? 'bg-red-500' : 'bg-slate-700'
                  } text-white hover:opacity-80 transition-all`}
                >
                  {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                </button>

                <button
                  onClick={handleShareScreen}
                  className="p-4 rounded-full bg-blue-600 text-white hover:opacity-80 transition-all"
                >
                  <Monitor size={24} />
                </button>

                <button
                  onClick={handleToggleRecording}
                  className={`p-4 rounded-full ${
                    isRecording ? 'bg-red-600' : 'bg-slate-700'
                  } text-white hover:opacity-80 transition-all`}
                >
                  {isRecording ? <StopCircle size={24} /> : <PlayCircle size={24} />}
                </button>

                <button
                  onClick={handleEndSession}
                  className="p-4 rounded-full bg-red-600 text-white hover:opacity-80 transition-all"
                >
                  <PhoneOff size={24} />
                </button>
              </div>
            </div>

            {/* Chat */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare size={24} className="text-slate-600" />
                <h3 className="text-lg font-bold text-slate-900">Chat</h3>
              </div>

              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {chatMessages.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">Aucun message</p>
                ) : (
                  chatMessages.map(msg => (
                    <div key={msg.id} className="p-3 bg-slate-50 rounded-lg">
                      <p className="font-semibold text-slate-900 text-sm">{msg.sender}</p>
                      <p className="text-slate-700">{msg.text}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString('fr-FR')}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Votre message..."
                  className="flex-1 p-3 border-2 border-slate-200 rounded-xl focus:border-purple-600 focus:ring-2 focus:ring-purple-200 outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Envoyer
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VideoConference;
