import React from 'react';
import { AlertTriangle, XCircle, Clock, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { SlotValidationResult } from '../services/slotValidationService';

interface SlotValidationDisplayProps {
  validation: SlotValidationResult;
  compact?: boolean; // Mode compact pour affichage dans liste
}

const SlotValidationDisplay: React.FC<SlotValidationDisplayProps> = ({ validation, compact = false }) => {
  const { isAvailable, conflicts, warnings, score } = validation;

  // Couleur basée sur le score
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const scoreColor = getScoreColor(score);

  // Mode compact : affichage minimal
  if (compact) {
    if (!isAvailable) {
      return (
        <div className="flex items-center space-x-1 text-xs">
          <XCircle size={14} className="text-red-500" />
          <span className="text-red-600 font-medium">Bloqué</span>
        </div>
      );
    }

    if (warnings.length > 0) {
      return (
        <div className="flex items-center space-x-1 text-xs">
          <AlertTriangle size={14} className="text-yellow-500" />
          <span className="text-yellow-600">{warnings.length} avertissement{warnings.length > 1 ? 's' : ''}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-1 text-xs">
        <span className={`px-2 py-0.5 rounded-full font-medium ${scoreColor}`}>
          Score: {score}
        </span>
      </div>
    );
  }

  // Mode complet : affichage détaillé
  return (
    <div className="space-y-3">
      {/* Score global */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">Score d'optimisation</span>
        <div className={`px-3 py-1 rounded-lg border font-bold ${scoreColor}`}>
          {score} / 100
        </div>
      </div>

      {/* Conflits bloquants */}
      {conflicts.filter(c => c.severity === 'BLOCKING').length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-red-700 font-medium">
            <XCircle size={18} />
            <span>Conflits bloquants</span>
          </div>
          <div className="space-y-2">
            {conflicts
              .filter(c => c.severity === 'BLOCKING')
              .map((conflict, idx) => (
                <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    {conflict.type === 'SLOT_TAKEN' && <Calendar size={16} className="text-red-600 mt-0.5 flex-shrink-0" />}
                    {conflict.type === 'TRAVEL_TIME_BEFORE' && <MapPin size={16} className="text-red-600 mt-0.5 flex-shrink-0" />}
                    {conflict.type === 'TRAVEL_TIME_AFTER' && <MapPin size={16} className="text-red-600 mt-0.5 flex-shrink-0" />}

                    <div className="flex-1">
                      <p className="text-sm text-red-800 font-medium">{conflict.message}</p>

                      {conflict.details && (
                        <div className="mt-1 text-xs text-red-700 space-y-0.5">
                          {conflict.details.patientName && (
                            <div>Patient: <span className="font-medium">{conflict.details.patientName}</span></div>
                          )}
                          {conflict.details.time && (
                            <div>Heure: {new Date(conflict.details.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                          )}
                          {conflict.details.distance !== undefined && (
                            <div>Distance: <span className="font-medium">{conflict.details.distance} km</span></div>
                          )}
                          {conflict.details.travelTimeNeeded !== undefined && (
                            <div className="flex items-center space-x-1">
                              <Clock size={12} />
                              <span>Temps de trajet nécessaire: <span className="font-medium">{conflict.details.travelTimeNeeded} min</span></span>
                            </div>
                          )}
                          {conflict.details.travelTimeAvailable !== undefined && (
                            <div className="flex items-center space-x-1">
                              <Clock size={12} />
                              <span>Temps disponible: <span className="font-medium">{conflict.details.travelTimeAvailable} min</span></span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Avertissements */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-yellow-700 font-medium">
            <AlertTriangle size={18} />
            <span>Avertissements</span>
          </div>
          <div className="space-y-2">
            {warnings.map((warning, idx) => (
              <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  {warning.type === 'TIGHT_SCHEDULE' && <Clock size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />}
                  {warning.type === 'LONG_TRAVEL' && <MapPin size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />}
                  {warning.type === 'EARLY_MORNING' && <AlertCircle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />}
                  {warning.type === 'END_OF_DAY' && <AlertCircle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />}

                  <p className="text-sm text-yellow-800">{warning.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statut OK */}
      {isAvailable && conflicts.length === 0 && warnings.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-green-700">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
            <span className="font-medium">Créneau optimal, aucun conflit détecté</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotValidationDisplay;
