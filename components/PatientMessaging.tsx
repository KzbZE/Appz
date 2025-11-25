import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Image, FileText, Smile, Clock } from 'lucide-react';
import MessagingService, { Message } from '../services/messagingService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PatientMessagingProps {
  patientId: number;
  patientName: string;
}

const PatientMessaging: React.FC<PatientMessagingProps> = ({ patientId, patientName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationId = `patient_${patientId}`;

  // Charger les messages
  useEffect(() => {
    loadMessages();
    // Rafraîchir toutes les 10 secondes
    const interval = setInterval(loadMessages, 10000);
    return () => clearInterval(interval);
  }, [patientId]);

  // Auto-scroll vers le bas
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const msgs = await MessagingService.getMessages(conversationId);
      setMessages(msgs);

      // Marquer les messages du praticien comme lus
      msgs.forEach(msg => {
        if (!msg.read && msg.senderType === 'PRACTITIONER' && msg.id) {
          MessagingService.markAsRead(msg.id);
        }
      });
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    }
    setIsLoading(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await MessagingService.sendMessage(
        patientId,
        patientId,
        'PATIENT',
        patientName,
        newMessage.trim()
      );

      setNewMessage('');
      await loadMessages();
    } catch (error) {
      console.error('Erreur envoi message:', error);
      alert('Erreur lors de l\'envoi du message');
    }
    setIsSending(false);
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) {
      return format(date, 'HH:mm', { locale: fr });
    } else if (diffHours < 48) {
      return 'Hier ' + format(date, 'HH:mm', { locale: fr });
    } else {
      return format(date, 'dd/MM/yyyy HH:mm', { locale: fr });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-250px)] bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-4">
        <h3 className="font-bold text-lg">Messagerie Sécurisée</h3>
        <p className="text-sm opacity-90">Communication avec votre praticien</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-400">
              <Clock size={48} className="mx-auto mb-2 animate-spin" />
              <p>Chargement des messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-400 max-w-sm">
              <Smile size={48} className="mx-auto mb-2" />
              <p className="font-semibold mb-1">Aucun message</p>
              <p className="text-sm">
                Commencez la conversation avec votre praticien !
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isPatient = msg.senderType === 'PATIENT';
            const showDate = index === 0 ||
              new Date(msg.timestamp).toDateString() !== new Date(messages[index - 1].timestamp).toDateString();

            return (
              <React.Fragment key={msg.id || index}>
                {showDate && (
                  <div className="flex justify-center my-4">
                    <div className="bg-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full">
                      {format(new Date(msg.timestamp), 'dd MMMM yyyy', { locale: fr })}
                    </div>
                  </div>
                )}

                <div className={`flex ${isPatient ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${isPatient ? 'order-2' : 'order-1'}`}>
                    {/* Nom de l'expéditeur */}
                    {!isPatient && (
                      <p className="text-xs text-slate-500 mb-1 ml-2">{msg.senderName}</p>
                    )}

                    {/* Bulle de message */}
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-sm ${
                        isPatient
                          ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-tr-none'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                      {/* Pièces jointes */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.attachments.map((att, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center space-x-2 p-2 rounded-lg ${
                                isPatient ? 'bg-white/20' : 'bg-slate-50'
                              }`}
                            >
                              {att.type === 'IMAGE' ? (
                                <Image size={16} />
                              ) : (
                                <FileText size={16} />
                              )}
                              <span className="text-xs truncate">{att.filename}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Heure */}
                      <p
                        className={`text-xs mt-1 ${
                          isPatient ? 'text-white/70' : 'text-slate-400'
                        }`}
                      >
                        {formatMessageTime(msg.timestamp)}
                        {msg.read && isPatient && (
                          <span className="ml-2">✓✓</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200">
        <div className="flex items-end space-x-2">
          {/* Boutons pièces jointes (à implémenter) */}
          <button
            type="button"
            className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
            title="Ajouter une pièce jointe (prochainement)"
            disabled
          >
            <Paperclip size={20} />
          </button>

          {/* Input de texte */}
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Écrivez votre message..."
              className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              rows={1}
              style={{
                minHeight: '44px',
                maxHeight: '120px'
              }}
            />
          </div>

          {/* Bouton Envoyer */}
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="p-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isSending ? (
              <Clock size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-2">
          💬 Messages chiffrés de bout en bout • Appuyez sur Entrée pour envoyer
        </p>
      </form>
    </div>
  );
};

export default PatientMessaging;
