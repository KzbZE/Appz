import React, { useState, useEffect } from 'react';
import { Map, MapPin, Navigation, TrendingUp, Users, DollarSign, Filter, Zap } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

const InteractiveMapModule: React.FC = () => {
  const patients = useLiveQuery(() => db.patients.toArray()) || [];
  const appointments = useLiveQuery(() => db.appointments.toArray()) || [];

  const [mapView, setMapView] = useState<'all' | 'human' | 'equine' | 'canine'>('all');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);

  const patientsWithCoords = patients.filter(p => p.lat && p.lng);

  const getPatientColor = (type: string) => {
    switch(type) {
      case 'HUMAN': return '#10b981'; // green
      case 'EQUINE': return '#f59e0b'; // amber
      case 'CANINE': return '#3b82f6'; // blue
      default: return '#6b7280'; // gray
    }
  };

  const filteredPatients = mapView === 'all'
    ? patientsWithCoords
    : patientsWithCoords.filter(p => p.type === mapView.toUpperCase());

  const getPatientAppointmentCount = (patientId: number) => {
    return appointments.filter(a => a.patientId === patientId).length;
  };

  const stats = {
    totalPatients: filteredPatients.length,
    avgDistance: patientsWithCoords.length > 0
      ? (patientsWithCoords.reduce((sum, p) => sum + (p.distanceFromCabinet || 0), 0) / patientsWithCoords.length).toFixed(1)
      : '0',
    totalRevenue: 0, // TODO: Calculate from invoices
    hotZones: 3 // TODO: Calculate clusters
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black mb-2">🗺️ Cartographie Interactive</h1>
            <p className="text-teal-100">Analyse géographique de votre patientèle</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black">{stats.totalPatients}</div>
            <div className="text-sm text-teal-100">Patients géolocalisés</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Patients</p>
            <Users className="text-teal-600" size={20} />
          </div>
          <p className="text-3xl font-black text-gray-800">{stats.totalPatients}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Distance moy.</p>
            <Navigation className="text-blue-600" size={20} />
          </div>
          <p className="text-3xl font-black text-gray-800">{stats.avgDistance}<span className="text-lg">km</span></p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Zones chaudes</p>
            <TrendingUp className="text-orange-600" size={20} />
          </div>
          <p className="text-3xl font-black text-gray-800">{stats.hotZones}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">CA potentiel</p>
            <DollarSign className="text-green-600" size={20} />
          </div>
          <p className="text-3xl font-black text-gray-800">{stats.totalRevenue}€</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">
            <Filter className="inline mr-2" size={20} />
            Filtres
          </h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showHeatmap}
              onChange={(e) => setShowHeatmap(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700 font-medium">Heatmap</span>
          </label>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setMapView('all')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              mapView === 'all'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tous ({patientsWithCoords.length})
          </button>
          <button
            onClick={() => setMapView('human')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              mapView === 'human'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            👤 Humains ({patientsWithCoords.filter(p => p.type === 'HUMAN').length})
          </button>
          <button
            onClick={() => setMapView('equine')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              mapView === 'equine'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🐴 Chevaux ({patientsWithCoords.filter(p => p.type === 'EQUINE').length})
          </button>
          <button
            onClick={() => setMapView('canine')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              mapView === 'canine'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🐕 Chiens ({patientsWithCoords.filter(p => p.type === 'CANINE').length})
          </button>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          <Map className="inline mr-2" size={20} />
          Vue Cartographique
        </h3>

        <div className="relative bg-gradient-to-br from-blue-100 to-green-100 rounded-xl h-96 flex items-center justify-center overflow-hidden">
          {/* Map Grid Background */}
          <div className="absolute inset-0 opacity-20">
            <svg className="w-full h-full">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Patient Markers (Simulated) */}
          {filteredPatients.map((patient, idx) => (
            <div
              key={patient.id}
              onClick={() => setSelectedPatient(patient.id as number)}
              className="absolute cursor-pointer transform hover:scale-125 transition-all"
              style={{
                left: `${10 + (idx % 10) * 9}%`,
                top: `${10 + Math.floor(idx / 10) * 15}%`,
              }}
            >
              <div
                className="w-6 h-6 rounded-full shadow-lg animate-pulse"
                style={{ backgroundColor: getPatientColor(patient.type) }}
                title={patient.name}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-white px-2 py-1 rounded text-xs opacity-0 hover:opacity-100 transition-opacity">
                  {patient.name}
                </div>
              </div>
            </div>
          ))}

          {/* Center Marker (Cabinet) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="w-12 h-12 bg-red-600 rounded-full shadow-2xl flex items-center justify-center animate-bounce">
                <MapPin className="text-white" size={24} />
              </div>
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-bold">
                Cabinet
              </div>
            </div>
          </div>

          {/* Info Overlay */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-xl p-4 max-w-xs">
            <h4 className="font-bold text-gray-800 mb-2">
              <Zap className="inline mr-2 text-yellow-500" size={16} />
              Carte Interactive (Démo)
            </h4>
            <p className="text-xs text-gray-600">
              Cette vue montre la répartition géographique de vos patients. Pour une vraie carte interactive, intégrez Google Maps ou Mapbox.
            </p>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <h4 className="font-bold text-blue-900 mb-2">🗺️ Intégration Google Maps / Mapbox</h4>
          <p className="text-sm text-blue-700 mb-3">
            Pour activer une vraie carte interactive:
          </p>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Installez: <code className="bg-blue-100 px-1 rounded">npm install @react-google-maps/api</code></li>
            <li>Ou: <code className="bg-blue-100 px-1 rounded">npm install react-map-gl</code> (Mapbox)</li>
            <li>Configurez votre clé API dans les paramètres</li>
            <li>Les coordonnées GPS de vos patients seront affichées automatiquement</li>
          </ol>
        </div>
      </div>

      {/* Patient List */}
      {filteredPatients.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            <Users className="inline mr-2" size={20} />
            Patients géolocalisés
          </h3>

          <div className="space-y-2">
            {filteredPatients.slice(0, 10).map((patient) => (
              <div
                key={patient.id}
                onClick={() => setSelectedPatient(patient.id as number)}
                className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all ${
                  selectedPatient === patient.id
                    ? 'bg-teal-50 border-2 border-teal-500'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getPatientColor(patient.type) }}
                  />
                  <div>
                    <p className="font-bold text-gray-800">{patient.name}</p>
                    <p className="text-sm text-gray-500">{patient.address}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {patient.distanceFromCabinet ? `${patient.distanceFromCabinet} km` : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {getPatientAppointmentCount(patient.id as number)} RDV
                  </p>
                </div>
              </div>
            ))}

            {filteredPatients.length > 10 && (
              <p className="text-center text-sm text-gray-500 pt-4">
                Et {filteredPatients.length - 10} autres patients...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveMapModule;
