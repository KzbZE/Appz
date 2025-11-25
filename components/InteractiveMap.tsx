import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { MapPin, Navigation, TrendingUp, Users, AlertCircle, Layers, Route, Clock } from 'lucide-react';
import {
  analyzeGeographicDistribution,
  optimizeTourRoute,
  detectTrafficAnomalies,
  getZoneStatistics
} from '../services/interactiveMapService';
import { Patient, PatientType } from '../types';

const InteractiveMap: React.FC = () => {
  const patients = useLiveQuery(() => db.patients.toArray()) || [];
  const appointments = useLiveQuery(() => db.appointments.toArray()) || [];

  const [selectedZone, setSelectedZone] = useState<'A' | 'B' | 'C' | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<any>(null);
  const [geoAnalysis, setGeoAnalysis] = useState<any>(null);
  const [trafficAlerts, setTrafficAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!patients || !appointments) {
      return;
    }

    // Analyse géographique
    const loadAnalysis = async () => {
      try {
        const analysis = await analyzeGeographicDistribution(patients, appointments);
        if (analysis && Array.isArray(analysis)) {
          const formattedAnalysis = {
            zones: analysis.map((stat: any) => ({
              zone: stat.zone,
              patients: stat.patientCount || 0,
              monthlyVisits: stat.appointmentCount || 0,
              avgRevenue: Math.round(stat.revenue || 0)
            }))
          };
          setGeoAnalysis(formattedAnalysis);
        }
      } catch (error) {
        console.error('Erreur analyse géographique:', error);
        setGeoAnalysis({ zones: [] });
      }
    };

    loadAnalysis();

    // Détection anomalies trafic
    try {
      const alerts = detectTrafficAnomalies([]);
      setTrafficAlerts(alerts || []);
    } catch (error) {
      console.error('Erreur détection trafic:', error);
      setTrafficAlerts([]);
    }
  }, [patients, appointments]);

  const handleOptimizeRoute = async () => {
    try {
      const today = new Date();
      const todayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.startTime);
        return aptDate.toDateString() === today.toDateString();
      });

      if (todayAppointments.length === 0) {
        alert('Aucun rendez-vous aujourd\'hui pour optimiser');
        return;
      }

      const route = await optimizeTourRoute(
        todayAppointments,
        patients,
        { lat: 48.8566, lng: 2.3522 } // Cabinet par défaut (à remplacer)
      );

      if (route) {
        setOptimizedRoute(route);
        setShowRoute(true);
      }
    } catch (error) {
      console.error('Erreur optimisation tournée:', error);
      alert('Erreur lors de l\'optimisation de la tournée');
    }
  };

  const getPatientsByZone = (zone: 'A' | 'B' | 'C') => {
    if (!geoAnalysis) return [];
    const zoneData = geoAnalysis.zones.find((z: any) => z.zone === zone);
    return zoneData ? zoneData.patients : 0;
  };

  const getTypeColor = (type: PatientType) => {
    switch (type) {
      case PatientType.HUMAN: return 'bg-blue-500';
      case PatientType.EQUINE: return 'bg-amber-500';
      case PatientType.CANINE: return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: PatientType) => {
    switch (type) {
      case PatientType.HUMAN: return '👤';
      case PatientType.EQUINE: return '🐴';
      case PatientType.CANINE: return '🐕';
      default: return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-lg">
              <MapPin className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900">Carte Interactive</h1>
              <p className="text-slate-600">Visualisation géographique et optimisation de tournées</p>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={handleOptimizeRoute}
            className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Route size={24} />
            <span className="font-bold">Optimiser Tournée du Jour</span>
          </button>

          <button
            onClick={() => setShowRoute(!showRoute)}
            className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Navigation size={24} />
            <span className="font-bold">{showRoute ? 'Masquer' : 'Afficher'} Itinéraire</span>
          </button>

          <button
            className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Layers size={24} />
            <span className="font-bold">Clustering Zones</span>
          </button>
        </div>

        {/* Statistiques par zone */}
        {geoAnalysis && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {['A', 'B', 'C'].map((zone) => {
              const zoneData = geoAnalysis.zones.find((z: any) => z.zone === zone);
              return (
                <div
                  key={zone}
                  onClick={() => setSelectedZone(zone as 'A' | 'B' | 'C')}
                  className={`p-6 rounded-2xl shadow-lg cursor-pointer transition-all hover:scale-105 ${
                    selectedZone === zone
                      ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white'
                      : 'bg-white text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-black">Zone {zone}</h3>
                    <div className={`p-2 rounded-lg ${selectedZone === zone ? 'bg-white/20' : 'bg-blue-100'}`}>
                      <MapPin size={24} className={selectedZone === zone ? 'text-white' : 'text-blue-600'} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${selectedZone === zone ? 'text-white/80' : 'text-slate-600'}`}>Patients</span>
                      <span className="text-xl font-bold">{zoneData?.patients || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${selectedZone === zone ? 'text-white/80' : 'text-slate-600'}`}>Visites/mois</span>
                      <span className="text-xl font-bold">{zoneData?.monthlyVisits || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${selectedZone === zone ? 'text-white/80' : 'text-slate-600'}`}>CA moyen</span>
                      <span className="text-xl font-bold">{zoneData?.avgRevenue || 0}€</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Carte simulée avec marqueurs */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Répartition Patients</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-slate-600">Humain</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-sm text-slate-600">Équin</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-600">Canin</span>
              </div>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-slate-100 to-blue-50 rounded-xl p-8 min-h-[400px]">
            {/* Simulation de carte - En production, utiliser Leaflet ou Google Maps */}
            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <MapPin size={64} className="mx-auto mb-4 opacity-20" />
                <p className="text-lg font-semibold">Carte Interactive</p>
                <p className="text-sm">Intégration Leaflet/Google Maps à configurer</p>
                <p className="text-xs mt-2">API Key requise dans les paramètres</p>
              </div>
            </div>

            {/* Marqueurs simulés */}
            <div className="relative grid grid-cols-6 gap-4 h-full">
              {patients.slice(0, 24).map((patient, idx) => (
                <div
                  key={patient.id}
                  className={`${getTypeColor(patient.type)} w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-lg cursor-pointer hover:scale-125 transition-transform`}
                  title={patient.name}
                  style={{
                    gridColumn: (idx % 6) + 1,
                    gridRow: Math.floor(idx / 6) + 1
                  }}
                >
                  <span className="text-xs">{getTypeIcon(patient.type)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-slate-700">
                <p className="font-semibold mb-1">Configuration requise</p>
                <p>Pour activer la carte interactive réelle, configurez une API Key Google Maps ou Leaflet dans les Paramètres → Intégrations</p>
              </div>
            </div>
          </div>
        </div>

        {/* Itinéraire optimisé */}
        {showRoute && optimizedRoute && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Route className="text-emerald-600" size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Itinéraire Optimisé</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Clock size={20} className="text-emerald-600" />
                  <span className="font-semibold text-slate-700">Durée totale</span>
                </div>
                <span className="text-xl font-bold text-emerald-600">
                  {Math.round(optimizedRoute.totalDuration / 60)}h {optimizedRoute.totalDuration % 60}min
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Navigation size={20} className="text-blue-600" />
                  <span className="font-semibold text-slate-700">Distance totale</span>
                </div>
                <span className="text-xl font-bold text-blue-600">
                  {optimizedRoute.totalDistance.toFixed(1)} km
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <TrendingUp size={20} className="text-purple-600" />
                  <span className="font-semibold text-slate-700">Gain d'optimisation</span>
                </div>
                <span className="text-xl font-bold text-purple-600">
                  {optimizedRoute.savings.timeSaved}min / {optimizedRoute.savings.kmSaved.toFixed(1)}km
                </span>
              </div>
            </div>

            {/* Liste des étapes */}
            <div className="mt-6">
              <h3 className="font-bold text-slate-900 mb-3">Ordre des visites</h3>
              <div className="space-y-2">
                {optimizedRoute.route.map((stop: any, idx: number) => {
                  const patient = patients.find(p => p.id === stop.patientId);
                  return (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-full flex items-center justify-center font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{patient?.name}</p>
                        <p className="text-sm text-slate-600">{stop.estimatedTime}</p>
                      </div>
                      <div className="text-sm text-slate-500">
                        {stop.distance.toFixed(1)} km
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Alertes trafic */}
        {trafficAlerts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Alertes Trafic</h2>
            </div>

            <div className="space-y-3">
              {trafficAlerts.map((alert, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{alert.location}</p>
                    <p className="text-sm text-slate-600">{alert.message}</p>
                    <p className="text-xs text-slate-500 mt-1">Impact: +{alert.delayMinutes} min</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveMap;
