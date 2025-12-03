import React from 'react';
import { Gift, AlertTriangle } from 'lucide-react';

/**
 * TODO: Module Fidélité & Promotions à migrer vers Supabase
 * Nécessite des méthodes dans dataService:
 * - getLoyaltyCardsActive()
 * - updateLoyaltyCardPoints()
 * - createReferral()
 * - createPromotion()
 */
const LoyaltyPromoModule: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
            <Gift size={24} className="text-purple-600" />
            Fidélité & Promotions
          </h3>
          <p className="text-sm text-slate-500">Cartes de fidélité, parrainages et promotions</p>
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
            <li>Gestion des cartes de fidélité</li>
            <li>Système de parrainage</li>
            <li>Codes promotionnels</li>
            <li>Récompenses automatiques</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyPromoModule;
