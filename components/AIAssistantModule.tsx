import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Mic, User, Bot, Sparkles, Trash2, Copy, Download, Volume2, RotateCcw, Settings } from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ConversationContext {
  patient?: string;
  appointment?: string;
  topic?: string;
}

const AIAssistantModule: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: "👋 Bonjour! Je suis votre assistant IA TheraFlow. Comment puis-je vous aider aujourd'hui?\n\nJe peux vous aider à:\n• Rédiger des comptes-rendus de séances\n• Analyser vos statistiques business\n• Créer des plans de traitement\n• Optimiser votre planning\n• Répondre à vos questions médicales",
      timestamp: new Date()
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState<ConversationContext>({});
  const [model, setModel] = useState<'gpt-4' | 'gpt-3.5' | 'claude' | 'gemini'>('gemini');
  const [temperature, setTemperature] = useState(0.7);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    "📝 Rédiger un compte-rendu de séance",
    "📊 Analyser mes statistiques du mois",
    "💡 Suggestions pour améliorer mon CA",
    "🎯 Créer un plan de traitement",
    "📅 Optimiser mon planning de demain",
    "🤔 Question médicale"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateAIResponse = async (userMessage: string): Promise<string> => {
    // Simulation - En production, appeler l'API Gemini/OpenAI
    await new Promise(resolve => setTimeout(resolve, 2000));

    const responses: { [key: string]: string } = {
      'compte-rendu': `📝 **Compte-rendu de séance suggéré:**

**Patient:** [Nom du patient]
**Date:** ${new Date().toLocaleDateString()}
**Type:** Kinésithérapie

**Anamnèse:**
- Douleur persistante au niveau lombaire depuis 3 semaines
- Intensité: 6/10 au repos, 8/10 en mouvement
- Aucun traumatisme récent identifié

**Examen clinique:**
- Limitation de la flexion antérieure (30°)
- Contracture paravertébrale bilatérale
- Test de Lasègue négatif

**Traitement effectué:**
- Massage décontracturant (15 min)
- Mobilisations articulaires douces
- Étirements actifs
- Conseils posturaux

**Plan de traitement:**
- 2 séances/semaine pendant 3 semaines
- Exercices à domicile (fiche remise au patient)
- Réévaluation dans 15 jours

**Prochaine séance:** Dans 3 jours`,

      'statistiques': `📊 **Analyse de vos statistiques:**

D'après les données disponibles:

**Performance du mois:**
- 🎯 Nombre de séances: 47 (+12% vs mois dernier)
- 💰 Chiffre d'affaires: 3,525€ (+8%)
- ⏰ Taux de remplissage: 78%
- ⭐ Satisfaction moyenne: 4.8/5

**Insights:**
✅ **Points forts:**
- Excellente fidélisation (+15% de patients réguliers)
- Taux d'annulation très bas (3%)

⚠️ **Points d'amélioration:**
- Créneaux de 14h-16h sous-utilisés (45%)
- Potentiel d'augmentation tarifaire identifié

**Recommandations:**
1. Proposer des créneaux "express" en après-midi
2. Mettre en place un système de parrainage
3. Augmenter le tarif de 5€ (alignement marché)`,

      'default': `Je comprends votre question. En tant qu'assistant IA spécialisé pour les praticiens, je peux vous aider de plusieurs façons:

**Pour une aide personnalisée:**
- Décrivez votre situation en détail
- Mentionnez le contexte (patient, type de séance, objectif...)
- Posez des questions spécifiques

**Exemples de requêtes:**
- "Crée un plan de traitement pour une tendinite d'épaule"
- "Rédige une facture pour une séance de 60 min à 65€"
- "Suggère des exercices pour renforcement lombaire"

Comment puis-je vous aider précisément?`
    };

    if (userMessage.toLowerCase().includes('compte-rendu') || userMessage.toLowerCase().includes('séance')) {
      return responses['compte-rendu'];
    } else if (userMessage.toLowerCase().includes('statistique') || userMessage.toLowerCase().includes('analyse')) {
      return responses['statistiques'];
    } else {
      return responses['default'];
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const aiResponse = await simulateAIResponse(inputMessage);

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInputMessage(prompt.replace(/^[^\s]+\s/, '')); // Enlever l'emoji
  };

  const handleClearChat = () => {
    if (confirm('Effacer toute la conversation?')) {
      setMessages([messages[0]]); // Garder le message de bienvenue
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    alert('✅ Message copié!');
  };

  const handleExportChat = () => {
    const chatContent = messages.map(m =>
      `[${m.timestamp.toLocaleString()}] ${m.role === 'user' ? 'Vous' : 'Assistant IA'}:\n${m.content}\n`
    ).join('\n---\n\n');

    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation_ia_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 shadow-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black">Assistant IA Conversationnel</h1>
              <p className="text-purple-100 text-sm">Propulsé par {model === 'gemini' ? 'Gemini Pro' : model.toUpperCase()}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
              title="Paramètres"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={handleExportChat}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
              title="Exporter"
            >
              <Download size={20} />
            </button>
            <button
              onClick={handleClearChat}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
              title="Effacer"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-6xl w-full mx-auto flex flex-col overflow-hidden">
        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-white border-b border-gray-200 p-4 shadow-lg animate-slide-down">
            <h3 className="font-bold text-gray-800 mb-3">⚙️ Paramètres IA</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Modèle IA</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value as any)}
                  className="w-full p-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="gemini">Gemini Pro (Recommandé)</option>
                  <option value="gpt-4">GPT-4 (Plus précis)</option>
                  <option value="gpt-3.5">GPT-3.5 (Plus rapide)</option>
                  <option value="claude">Claude 3 (Créatif)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Créativité: {temperature.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Suggested Prompts */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestedPrompt(prompt)}
                className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-700 rounded-full font-bold text-sm whitespace-nowrap transition-all transform hover:scale-105"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 animate-slide-up ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                  : 'bg-gradient-to-br from-purple-500 to-pink-500'
              }`}>
                {message.role === 'user' ? (
                  <User className="text-white" size={20} />
                ) : (
                  <Bot className="text-white" size={20} />
                )}
              </div>

              {/* Message Bubble */}
              <div className={`flex-1 max-w-3xl ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div
                  className={`inline-block p-4 rounded-2xl shadow-lg ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>

                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  {message.role === 'assistant' && (
                    <>
                      <button
                        onClick={() => handleCopyMessage(message.content)}
                        className="hover:text-gray-700"
                        title="Copier"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        className="hover:text-gray-700"
                        title="Lire à voix haute"
                      >
                        <Volume2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 animate-slide-up">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="text-white" size={20} />
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-200">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 p-4 shadow-xl">
          <div className="flex gap-3">
            <button
              className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
              title="Commande vocale"
            >
              <Mic size={20} className="text-gray-600" />
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Posez votre question à l'IA..."
              className="flex-1 p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />

            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Send size={20} />
            </button>
          </div>

          <div className="mt-2 text-xs text-gray-500 text-center">
            💡 Conseil: Soyez précis dans vos questions pour des réponses optimales
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantModule;
