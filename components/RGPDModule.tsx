import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';

/**
 * TODO: Module RGPD à migrer vers Supabase
 * Nécessite des méthodes de suppression en cascade dans dataService:
 * - deletePatientWithAllData()
 * - exportPatientData()
 * - anonymizeOldPatients()
 */
const RGPDModule: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
            <Shield size={24} className="text-blue-600" />
            Conformité RGPD
          </h3>
          <p className="text-sm text-slate-500">Gestion des données personnelles et droits des patients</p>
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
            <li>Export complet des données patient (Droit d'accès RGPD)</li>
            <li>Suppression définitive des données (Droit à l'oubli)</li>
            <li>Anonymisation automatique des patients inactifs</li>
            <li>Registre des opérations de traitement</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RGPDModule;
