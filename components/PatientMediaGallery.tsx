import React, { useState } from 'react';
import { Upload, Image as ImageIcon, X, Download, Eye, Trash2, Calendar, User, Tag } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import patientMediaService, { PatientMedia } from '../services/patientMediaService';

const PatientMediaGallery: React.FC = () => {
  const patients = useLiveQuery(() => db.patients.toArray()) || [];
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<PatientMedia | null>(null);
  const [uploadForm, setUploadForm] = useState({
    category: 'before' as 'before' | 'after' | 'progress',
    bodyPart: '',
    viewAngle: 'front' as 'front' | 'back' | 'side' | 'top',
    notes: '',
    consent: false
  });
  const [uploading, setUploading] = useState(false);
  const [mediaLibrary, setMediaLibrary] = useState<PatientMedia[]>([]);
  const [filterCategory, setFilterCategory] = useState<'all' | 'before' | 'after' | 'progress'>('all');

  // Simulate loading media for selected patient
  React.useEffect(() => {
    if (selectedPatient) {
      // TODO: Load from IndexedDB when table is ready
      const mockMedia: PatientMedia[] = [];
      setMediaLibrary(mockMedia);
    }
  }, [selectedPatient]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedPatient) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      const media = await patientMediaService.uploadPhoto(file, selectedPatient, uploadForm.category, {
        bodyPart: uploadForm.bodyPart,
        viewAngle: uploadForm.viewAngle,
        notes: uploadForm.notes,
        consent: uploadForm.consent
      });

      // TODO: Save to IndexedDB
      setMediaLibrary([...mediaLibrary, media]);
      setUploadModalOpen(false);
      setUploadForm({
        category: 'before',
        bodyPart: '',
        viewAngle: 'front',
        notes: '',
        consent: false
      });
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Erreur lors de l\'upload de la photo');
    } finally {
      setUploading(false);
    }
  };

  const filteredMedia = filterCategory === 'all'
    ? mediaLibrary
    : mediaLibrary.filter(m => m.category === filterCategory);

  const selectedPatientData = patients.find(p => p.id === selectedPatient);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black mb-2">📸 Galerie Média Patients</h1>
            <p className="text-purple-100">Gestion des photos avant/après et documents visuels</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black">{mediaLibrary.length}</div>
            <div className="text-sm text-purple-100">Photos stockées</div>
          </div>
        </div>
      </div>

      {/* Patient Selection */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <label className="block text-sm font-bold text-gray-700 mb-2">
          <User className="inline mr-2" size={16} />
          Sélectionner un patient
        </label>
        <select
          value={selectedPatient || ''}
          onChange={(e) => setSelectedPatient(Number(e.target.value))}
          className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">-- Choisir un patient --</option>
          {patients.map(patient => (
            <option key={patient.id} value={patient.id}>
              {patient.name} {patient.phone ? `- ${patient.phone}` : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedPatient && (
        <>
          {/* Action Bar */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  filterCategory === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Toutes ({mediaLibrary.length})
              </button>
              <button
                onClick={() => setFilterCategory('before')}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  filterCategory === 'before'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Avant ({mediaLibrary.filter(m => m.category === 'before').length})
              </button>
              <button
                onClick={() => setFilterCategory('after')}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  filterCategory === 'after'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Après ({mediaLibrary.filter(m => m.category === 'after').length})
              </button>
              <button
                onClick={() => setFilterCategory('progress')}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${
                  filterCategory === 'progress'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Progrès ({mediaLibrary.filter(m => m.category === 'progress').length})
              </button>
            </div>

            <button
              onClick={() => setUploadModalOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <Upload className="inline mr-2" size={20} />
              Ajouter une photo
            </button>
          </div>

          {/* Gallery Grid */}
          {filteredMedia.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-12 text-center">
              <ImageIcon className="mx-auto mb-4 text-gray-400" size={64} />
              <h3 className="text-xl font-bold text-gray-600 mb-2">Aucune photo</h3>
              <p className="text-gray-500">
                {filterCategory === 'all'
                  ? 'Commencez par ajouter une photo pour ce patient'
                  : `Aucune photo dans la catégorie "${filterCategory}"`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMedia.map((media, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer"
                  onClick={() => {
                    setSelectedMedia(media);
                    setViewModalOpen(true);
                  }}
                >
                  <div className="relative h-48 bg-gray-100">
                    <img
                      src={media.thumbnailUrl || media.url}
                      alt={media.filename}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold text-white ${
                      media.category === 'before' ? 'bg-blue-600' :
                      media.category === 'after' ? 'bg-green-600' : 'bg-orange-600'
                    }`}>
                      {media.category === 'before' ? 'Avant' :
                       media.category === 'after' ? 'Après' : 'Progrès'}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Calendar size={14} className="mr-1" />
                      {new Date(media.uploadedAt).toLocaleDateString()}
                    </div>
                    {media.bodyPart && (
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Tag size={14} className="mr-1" />
                        {media.bodyPart}
                      </div>
                    )}
                    {media.notes && (
                      <p className="text-sm text-gray-700 line-clamp-2">{media.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setUploadModalOpen(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-800">
                📤 Ajouter une photo - {selectedPatientData?.name}
              </h2>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Catégorie *</label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({...uploadForm, category: e.target.value as any})}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                >
                  <option value="before">Avant traitement</option>
                  <option value="after">Après traitement</option>
                  <option value="progress">Progression</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Partie du corps</label>
                <input
                  type="text"
                  value={uploadForm.bodyPart}
                  onChange={(e) => setUploadForm({...uploadForm, bodyPart: e.target.value})}
                  placeholder="Ex: Dos, Genou, Épaule..."
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Angle de vue</label>
                <select
                  value={uploadForm.viewAngle}
                  onChange={(e) => setUploadForm({...uploadForm, viewAngle: e.target.value as any})}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                >
                  <option value="front">Face</option>
                  <option value="back">Dos</option>
                  <option value="side">Côté</option>
                  <option value="top">Dessus</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm({...uploadForm, notes: e.target.value})}
                  placeholder="Observations, état du patient..."
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 h-24"
                />
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uploadForm.consent}
                    onChange={(e) => setUploadForm({...uploadForm, consent: e.target.checked})}
                    className="mt-1 mr-3"
                  />
                  <span className="text-sm text-gray-700">
                    <strong>Consentement patient (RGPD) *</strong><br />
                    Le patient consent à l'utilisation de ces photos à des fins thérapeutiques et de suivi.
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Fichier photo *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={!uploadForm.consent || uploading}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {uploading && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                  <p className="text-sm font-bold text-purple-700">
                    Compression et upload en cours...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModalOpen && selectedMedia && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setViewModalOpen(false)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-800">
                {selectedMedia.category === 'before' ? '📷 Photo Avant' :
                 selectedMedia.category === 'after' ? '✅ Photo Après' : '📊 Photo Progrès'}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = selectedMedia.url;
                    link.download = selectedMedia.filename;
                    link.click();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Télécharger"
                >
                  <Download size={24} />
                </button>
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="mb-6">
              <img
                src={selectedMedia.url}
                alt={selectedMedia.filename}
                className="w-full rounded-xl shadow-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-6">
              <div>
                <div className="text-sm text-gray-500 mb-1">Date</div>
                <div className="font-bold">{new Date(selectedMedia.uploadedAt).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Uploadé par</div>
                <div className="font-bold">{selectedMedia.uploadedBy}</div>
              </div>
              {selectedMedia.bodyPart && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Partie du corps</div>
                  <div className="font-bold">{selectedMedia.bodyPart}</div>
                </div>
              )}
              {selectedMedia.viewAngle && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Angle de vue</div>
                  <div className="font-bold capitalize">{selectedMedia.viewAngle}</div>
                </div>
              )}
              <div className="col-span-2">
                <div className="text-sm text-gray-500 mb-1">Taille</div>
                <div className="font-bold">{(selectedMedia.size / 1024).toFixed(0)} Ko</div>
              </div>
              {selectedMedia.notes && (
                <div className="col-span-2">
                  <div className="text-sm text-gray-500 mb-1">Notes</div>
                  <div className="text-gray-700">{selectedMedia.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientMediaGallery;
