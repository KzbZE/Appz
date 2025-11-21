import React, { useState, useRef, useEffect } from 'react';
import { generateBusinessAdvice } from '../services/geminiService';
import { Send, Bot, Sparkles, User } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AICoach: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Bonjour ! Je suis votre Business Coach IA. Analysons ensemble la rentabilité de vos tournées ou la rétention de vos patients équins aujourd'hui. Que puis-je faire pour vous ?" }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const context = `
      Date: Octobre 2023.
      CA Mois en cours: 3200€ (Objectif 5000€).
      Répartition: 60% Equin (Déplacement), 40% Humain (Cabinet).
      Dernier problème identifié: Frais kilométriques élevés sur la zone Nord.
    `;

    const response = await generateBusinessAdvice(userMsg, context);
    
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setLoading(false);
  };

  const suggestions = [
    "Comment optimiser ma tournée de demain ?",
    "Rédige un email de relance pour les impayés.",
    "Analyse ma rentabilité Équin vs Humain."
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-full bg-gray-50">
      <div className="bg-white border-b p-4 shadow-sm flex items-center space-x-3">
         <div className="bg-indigo-100 p-2 rounded-lg">
            <Sparkles className="text-indigo-600" size={20} />
         </div>
         <div>
             <h2 className="font-bold text-slate-800">IA Business Coach</h2>
             <p className="text-xs text-slate-500">Optimisation & Stratégie</p>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             <div className={`flex max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center mx-2 
                    ${m.role === 'user' ? 'bg-slate-200' : 'bg-indigo-600 text-white'}`}>
                    {m.role === 'user' ? <User size={14} /> : <Bot size={16} />}
                </div>
                <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm
                    ${m.role === 'user' 
                      ? 'bg-slate-800 text-white rounded-tr-none' 
                      : 'bg-white text-slate-700 border border-gray-100 rounded-tl-none'}`}>
                    {m.text}
                </div>
             </div>
          </div>
        ))}
        {loading && (
           <div className="flex items-center space-x-2 ml-12">
             <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
             <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
             <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && (
         <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
            {suggestions.map(s => (
                <button key={s} onClick={() => { setInput(s); }} className="whitespace-nowrap px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-100 hover:bg-indigo-100">
                    {s}
                </button>
            ))}
         </div>
      )}

      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
            <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Posez une question à votre coach..."
                className="flex-1 bg-transparent outline-none text-sm text-slate-800 placeholder-slate-400"
            />
            <button 
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className={`p-2 rounded-full transition-colors ${input.trim() ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}
            >
                <Send size={16} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default AICoach;