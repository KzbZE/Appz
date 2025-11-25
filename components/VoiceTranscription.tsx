import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Play, Pause, Download, Trash2, FileText, Wand2 } from 'lucide-react';
import { generateSessionReport } from '../services/geminiService';

/**
 * Composant de transcription vocale en temps réel
 * Utilise Web Speech API pour la dictée
 * Génération automatique de rapport avec IA
 */

interface VoiceTranscriptionProps {
  onTranscriptUpdate: (text: string) => void;
  initialText?: string;
}

const VoiceTranscription: React.FC<VoiceTranscriptionProps> = ({ onTranscriptUpdate, initialText = '' }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(initialText);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [language, setLanguage] = useState('fr-FR');
  const [generatingReport, setGeneratingReport] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Vérifier si Web Speech API est disponible
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('🎤 Voice recognition started');
    };

    recognition.onresult = (event: any) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalText += transcriptPiece + ' ';
        } else {
          interimText += transcriptPiece;
        }
      }

      if (finalText) {
        const newTranscript = transcript + finalText;
        setTranscript(newTranscript);
        onTranscriptUpdate(newTranscript);
        setInterimTranscript('');
      } else {
        setInterimTranscript(interimText);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);

      if (event.error === 'no-speech') {
        console.log('No speech detected');
      } else if (event.error === 'audio-capture') {
        alert('❌ Impossible d\'accéder au microphone. Vérifiez les permissions.');
      } else if (event.error === 'not-allowed') {
        alert('❌ Permission d\'accès au microphone refusée.');
      }

      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('🛑 Voice recognition ended');
      if (isListening) {
        // Redémarrer automatiquement si on est encore en mode écoute
        recognition.start();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, isListening]);

  const toggleListening = () => {
    if (!isSupported) {
      alert('❌ La reconnaissance vocale n\'est pas supportée par votre navigateur.\n\nUtilisez Chrome, Edge ou Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setInterimTranscript('');
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleClear = () => {
    if (!confirm('Êtes-vous sûr de vouloir effacer la transcription ?')) return;

    setTranscript('');
    setInterimTranscript('');
    onTranscriptUpdate('');
  };

  const handleDownload = () => {
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transcription_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateReport = async () => {
    if (!transcript.trim()) {
      alert('❌ Aucune transcription disponible pour générer un rapport');
      return;
    }

    setGeneratingReport(true);

    try {
      // Utiliser le service Gemini existant pour générer un rapport structuré
      const report = await generateSessionReport(
        { mainComplaint: transcript },
        transcript,
        []
      );

      onTranscriptUpdate(report);
      setTranscript(report);
      alert('✅ Rapport généré avec succès par IA');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('❌ Erreur lors de la génération du rapport');
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-purple-900 flex items-center">
          <Mic className="mr-2" size={24} />
          Dictée Vocale IA
        </h3>

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={isListening}
          className="px-3 py-2 border-2 border-purple-300 rounded-lg text-sm font-semibold text-purple-900 focus:border-purple-500 outline-none disabled:opacity-50"
        >
          <option value="fr-FR">🇫🇷 Français</option>
          <option value="en-US">🇺🇸 English</option>
          <option value="es-ES">🇪🇸 Español</option>
          <option value="de-DE">🇩🇪 Deutsch</option>
          <option value="it-IT">🇮🇹 Italiano</option>
        </select>
      </div>

      {!isSupported ? (
        <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 text-red-900">
          <p className="font-semibold mb-2">❌ Reconnaissance vocale non supportée</p>
          <p className="text-sm">Veuillez utiliser Chrome, Edge ou Safari pour cette fonctionnalité.</p>
        </div>
      ) : (
        <>
          {/* Contrôles */}
          <div className="flex items-center space-x-3 mb-6">
            <button
              onClick={toggleListening}
              className={`flex-1 flex items-center justify-center px-6 py-4 rounded-xl font-bold text-white shadow-lg transition-all ${
                isListening
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 animate-pulse'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff size={24} className="mr-2" />
                  Arrêter l'écoute
                </>
              ) : (
                <>
                  <Mic size={24} className="mr-2" />
                  Commencer la dictée
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              disabled={!transcript}
              className="p-4 bg-white border-2 border-purple-300 rounded-xl text-purple-700 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Télécharger"
            >
              <Download size={20} />
            </button>

            <button
              onClick={handleClear}
              disabled={!transcript}
              className="p-4 bg-white border-2 border-purple-300 rounded-xl text-purple-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Effacer"
            >
              <Trash2 size={20} />
            </button>

            <button
              onClick={handleGenerateReport}
              disabled={!transcript || generatingReport}
              className="p-4 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl hover:from-indigo-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              title="Générer rapport IA"
            >
              {generatingReport ? (
                <div className="animate-spin">
                  <Wand2 size={20} />
                </div>
              ) : (
                <Wand2 size={20} />
              )}
            </button>
          </div>

          {/* Indicateur d'écoute */}
          {isListening && (
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-3 rounded-lg mb-4 flex items-center animate-pulse">
              <div className="w-3 h-3 bg-white rounded-full mr-3 animate-ping"></div>
              <span className="font-bold">🎤 Écoute en cours... Parlez maintenant</span>
            </div>
          )}

          {/* Zone de transcription */}
          <div className="bg-white border-2 border-purple-300 rounded-xl p-4 min-h-[300px] max-h-[500px] overflow-y-auto">
            {transcript || interimTranscript ? (
              <div className="text-gray-900 leading-relaxed">
                <p className="whitespace-pre-wrap">
                  {transcript}
                  {interimTranscript && (
                    <span className="text-purple-500 italic">{interimTranscript}</span>
                  )}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                <Mic size={64} className="mb-4" />
                <p className="text-lg font-semibold">Aucune transcription</p>
                <p className="text-sm mt-2">Cliquez sur "Commencer la dictée" pour parler</p>
              </div>
            )}
          </div>

          {/* Statistiques */}
          {transcript && (
            <div className="mt-4 flex items-center justify-between text-sm text-purple-700">
              <div className="flex items-center space-x-4">
                <span>
                  <strong>{transcript.split(' ').filter(w => w.length > 0).length}</strong> mots
                </span>
                <span>
                  <strong>{transcript.length}</strong> caractères
                </span>
              </div>
              <button
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg font-semibold hover:from-indigo-600 hover:to-blue-600 disabled:opacity-50 transition-all"
              >
                {generatingReport ? (
                  <>
                    <div className="animate-spin mr-2">
                      <Wand2 size={16} />
                    </div>
                    Génération...
                  </>
                ) : (
                  <>
                    <Wand2 size={16} className="mr-2" />
                    Générer rapport IA
                  </>
                )}
              </button>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-4 bg-purple-100 border border-purple-200 rounded-lg p-3">
            <p className="text-sm text-purple-900">
              <strong>💡 Astuce :</strong> Parlez naturellement pendant votre séance. La transcription se fait en temps réel. Cliquez sur "Générer rapport IA" pour transformer vos notes en compte-rendu structuré.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default VoiceTranscription;
