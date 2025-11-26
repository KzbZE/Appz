import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Download, Trash2, FileAudio, MessageSquare, Upload, Sparkles } from 'lucide-react';

interface VoiceNote {
  id: number;
  date: string;
  duration: number;
  audioBlob: Blob;
  audioUrl: string;
  transcription?: string;
  patientId?: number;
  patientName?: string;
}

const VoiceNotesModule: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [playingNoteId, setPlayingNoteId] = useState<number | null>(null);
  const [transcribing, setTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRefs = useRef<{ [key: number]: HTMLAudioElement }>({});

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        const newNote: VoiceNote = {
          id: Date.now(),
          date: new Date().toISOString(),
          duration: recordingTime,
          audioBlob,
          audioUrl
        };

        setVoiceNotes([newNote, ...voiceNotes]);
        setRecordingTime(0);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Erreur micro:', error);
      alert('❌ Impossible d\'accéder au microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    setIsPaused(!isPaused);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const playAudio = (noteId: number, audioUrl: string) => {
    if (playingNoteId === noteId) {
      audioRefs.current[noteId]?.pause();
      setPlayingNoteId(null);
    } else {
      // Arrêter tous les autres audios
      Object.values(audioRefs.current).forEach(audio => audio.pause());

      const audio = new Audio(audioUrl);
      audioRefs.current[noteId] = audio;

      audio.onended = () => setPlayingNoteId(null);
      audio.play();
      setPlayingNoteId(noteId);
    }
  };

  const downloadAudio = (note: VoiceNote) => {
    const a = document.createElement('a');
    a.href = note.audioUrl;
    a.download = `note_vocale_${new Date(note.date).toISOString().split('T')[0]}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const deleteNote = (noteId: number) => {
    if (confirm('Supprimer cette note vocale?')) {
      const note = voiceNotes.find(n => n.id === noteId);
      if (note) {
        URL.revokeObjectURL(note.audioUrl);
        audioRefs.current[noteId]?.pause();
        delete audioRefs.current[noteId];
      }
      setVoiceNotes(voiceNotes.filter(n => n.id !== noteId));
    }
  };

  const transcribeAudio = async (noteId: number) => {
    setTranscribing(true);

    // Simulation de transcription (nécessiterait Web Speech API ou service externe)
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockTranscription = `[Transcription simulée]

Bonjour, ceci est une note vocale enregistrée le ${new Date().toLocaleDateString()}.

Pour une vraie transcription, utilisez:
- Web Speech API (navigateur)
- Google Cloud Speech-to-Text
- AssemblyAI
- Whisper API (OpenAI)

Patient: Douleur au niveau de l'épaule droite.
Traitement: Massage profond et étirements.
Suivi: Revoir dans 1 semaine.`;

    setVoiceNotes(voiceNotes.map(note =>
      note.id === noteId
        ? { ...note, transcription: mockTranscription }
        : note
    ));

    setTranscribing(false);
    alert('✅ Transcription terminée!');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black mb-2">🎤 Notes Vocales</h1>
            <p className="text-purple-100">Enregistrement et transcription automatique</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black">{voiceNotes.length}</div>
            <div className="text-sm text-purple-100">Notes enregistrées</div>
          </div>
        </div>
      </div>

      {/* Recording Control */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          {!isRecording ? (
            <div className="space-y-6">
              <div className="inline-block p-8 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full">
                <Mic className="text-purple-600" size={64} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Prêt à enregistrer</h3>
                <p className="text-gray-600">Cliquez sur le bouton pour commencer</p>
              </div>
              <button
                onClick={startRecording}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <Mic className="inline mr-2" size={24} />
                Démarrer l'enregistrement
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="inline-block p-8 bg-red-100 rounded-full animate-pulse">
                <Mic className="text-red-600" size={64} />
              </div>
              <div>
                <div className="text-5xl font-black text-gray-800 mb-2">
                  {formatTime(recordingTime)}
                </div>
                <p className="text-gray-600 font-bold">
                  {isPaused ? '⏸ Enregistrement en pause' : '🔴 Enregistrement en cours...'}
                </p>
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={togglePause}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all"
                >
                  {isPaused ? (
                    <>
                      <Play className="inline mr-2" size={20} />
                      Reprendre
                    </>
                  ) : (
                    <>
                      <Pause className="inline mr-2" size={20} />
                      Pause
                    </>
                  )}
                </button>
                <button
                  onClick={stopRecording}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-all"
                >
                  <Square className="inline mr-2" size={20} />
                  Arrêter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Voice Notes List */}
      {voiceNotes.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            <FileAudio className="inline mr-2" size={20} />
            Mes notes vocales
          </h3>

          <div className="space-y-4">
            {voiceNotes.map((note) => (
              <div key={note.id} className="border-2 border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      {new Date(note.date).toLocaleString()}
                    </p>
                    <p className="text-lg font-bold text-gray-800">
                      Durée: {formatTime(note.duration)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => playAudio(note.id, note.audioUrl)}
                      className={`p-3 rounded-lg transition-all ${
                        playingNoteId === note.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                      }`}
                    >
                      {playingNoteId === note.id ? <Pause size={20} /> : <Play size={20} />}
                    </button>

                    <button
                      onClick={() => transcribeAudio(note.id)}
                      disabled={transcribing}
                      className="p-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                      title="Transcrire"
                    >
                      <Sparkles size={20} />
                    </button>

                    <button
                      onClick={() => downloadAudio(note)}
                      className="p-3 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                      title="Télécharger"
                    >
                      <Download size={20} />
                    </button>

                    <button
                      onClick={() => deleteNote(note.id)}
                      className="p-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                {note.transcription && (
                  <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="text-blue-600" size={16} />
                      <span className="text-sm font-bold text-blue-900">Transcription:</span>
                    </div>
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">{note.transcription}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
        <h3 className="font-bold text-yellow-900 mb-2">💡 Transcription automatique</h3>
        <p className="text-sm text-yellow-700 mb-3">
          Pour activer la transcription vocale réelle, intégrez une API de Speech-to-Text:
        </p>
        <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
          <li><strong>Web Speech API</strong> - Gratuit, intégré au navigateur (Chrome/Edge)</li>
          <li><strong>Google Cloud Speech-to-Text</strong> - 60 min gratuites/mois</li>
          <li><strong>AssemblyAI</strong> - API simple, haute précision</li>
          <li><strong>Whisper API (OpenAI)</strong> - Meilleure qualité, multilingue</li>
        </ul>
      </div>

      {transcribing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-md text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Transcription en cours...
            </h3>
            <p className="text-gray-600">
              Conversion de l'audio en texte via IA
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceNotesModule;
