import React from 'react';
import { FileText, AlertTriangle } from 'lucide-react';

/**
 * TODO: Module Templates de Séances à migrer vers Supabase
 * Migration simple car les templates sont hardcodés dans le state
 * Nécessite juste de remplacer l'état local par dataService
 */
const SessionTemplates: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
            <FileText size={24} className="text-indigo-600" />
            Templates de Séances
          </h3>
          <p className="text-sm text-slate-500">Modèles prédéfinis pour gagner du temps</p>
        </div>
      </div>

      <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-8 text-center">
        <AlertTriangle size={48} className="text-orange-600 mx-auto mb-4" />
        <h4 className="font-bold text-orange-800 text-lg mb-2">Module en cours de migration</h4>
        <p className="text-orange-700 mb-4">
          Ce module est en cours de migration vers Supabase. Il sera disponible prochainement.
        </p>
        <div className="text-sm text-orange-600 bg-white rounded p-4 text-left">
          <p className="font-bold mb-2">Fonctionnalités à venir :</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Templates de kinésiologie humaine</li>
            <li>Templates de kinésiologie équine</li>
            <li>Templates de kinésiologie canine</li>
            <li>Création et personnalisation de templates</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SessionTemplates;
