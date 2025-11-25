import React, { useState, useRef } from 'react';
import { Camera, Upload, X, ArrowLeftRight, Download, Trash2, ZoomIn } from 'lucide-react';
import { db } from '../db';

/**
 * Composant de gestion des photos avant/après patient
 * Permet upload, visualisation côte-à-côte, comparaison slider
 */

interface PatientPhoto {
  id?: number;
  patientId: number | string;
  type: 'BEFORE' | 'AFTER';
  imageData: string; // Base64 data URL
  date: string;
  notes?: string;
  sessionId?: number;
}

interface PatientPhotosProps {
  patientId: number | string;
  patientName: string;
  onClose: () => void;
}

const PatientPhotos: React.FC<PatientPhotosProps> = ({ patientId, patientName, onClose }) => {
  const [photos, setPhotos] = useState<PatientPhoto[]>([]);
  const [selectedBefore, setSelectedBefore] = useState<PatientPhoto | null>(null);
  const [selectedAfter, setSelectedAfter] = useState<PatientPhoto | null>(null);
  const [viewMode, setViewMode] = useState<'upload' | 'compare' | 'gallery'>('upload');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [uploadNotes, setUploadNotes] = useState('');
  const [zoomedPhoto, setZoomedPhoto] = useState<PatientPhoto | null>(null);

  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  // Simuler chargement des photos depuis DB (TODO: implémenter db.patientPhotos)
  React.useEffect(() => {
    // const loadPhotos = async () => {
    //   const loadedPhotos = await db.patientPhotos.where('patientId').equals(patientId).toArray();
    //   setPhotos(loadedPhotos);
    // };
    // loadPhotos();
  }, [patientId]);

  const handleFileUpload = async (file: File, type: 'BEFORE' | 'AFTER') => {
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      alert('❌ Veuillez sélectionner un fichier image');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('❌ L\'image est trop grande (max 5MB)');
      return;
    }

    // Convertir en Base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageData = reader.result as string;

      const newPhoto: PatientPhoto = {
        id: photos.length + 1,
        patientId,
        type,
        imageData,
        date: new Date().toISOString(),
        notes: uploadNotes
      };

      setPhotos([...photos, newPhoto]);
      setUploadNotes('');

      // TODO: Sauvegarder en DB
      // await db.patientPhotos.add(newPhoto);

      alert(`✅ Photo "${type === 'BEFORE' ? 'Avant' : 'Après'}" ajoutée avec succès`);

      // Auto-sélectionner pour comparaison
      if (type === 'BEFORE') {
        setSelectedBefore(newPhoto);
      } else {
        setSelectedAfter(newPhoto);
      }
    };

    reader.readAsDataURL(file);
  };

  const beforePhotos = photos.filter(p => p.type === 'BEFORE');
  const afterPhotos = photos.filter(p => p.type === 'AFTER');

  const handleDeletePhoto = (photoId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) return;

    setPhotos(photos.filter(p => p.id !== photoId));
    // TODO: Supprimer de DB
    // await db.patientPhotos.delete(photoId);

    alert('✅ Photo supprimée');
  };

  const downloadComparison = () => {
    if (!selectedBefore || !selectedAfter) return;

    // Créer un canvas pour combiner les deux images
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const img1 = new Image();
    const img2 = new Image();

    img1.onload = () => {
      img2.onload = () => {
        canvas.width = img1.width + img2.width + 40; // 40px pour la marge
        canvas.height = Math.max(img1.height, img2.height) + 100; // 100px pour le texte

        // Fond blanc
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Texte "AVANT"
        ctx.fillStyle = '#1F2937';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('AVANT', img1.width / 2, 40);

        // Image AVANT
        ctx.drawImage(img1, 0, 60);

        // Texte "APRÈS"
        ctx.fillText('APRÈS', img1.width + 20 + img2.width / 2, 40);

        // Image APRÈS
        ctx.drawImage(img2, img1.width + 20, 60);

        // Télécharger
        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${patientName}_avant_apres_${new Date().toISOString().split('T')[0]}.png`;
          link.click();
          URL.revokeObjectURL(url);
        });
      };
      img2.src = selectedAfter.imageData;
    };
    img1.src = selectedBefore.imageData;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col my-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <Camera className="mr-3" size={28} />
              Photos Avant / Après
            </h2>
            <p className="text-pink-100 mt-1">{patientName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50 px-6 flex space-x-4">
          <button
            onClick={() => setViewMode('upload')}
            className={`px-4 py-3 font-semibold transition-all ${
              viewMode === 'upload'
                ? 'text-pink-600 border-b-2 border-pink-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📤 Uploader
          </button>
          <button
            onClick={() => setViewMode('compare')}
            className={`px-4 py-3 font-semibold transition-all ${
              viewMode === 'compare'
                ? 'text-pink-600 border-b-2 border-pink-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🔍 Comparer
          </button>
          <button
            onClick={() => setViewMode('gallery')}
            className={`px-4 py-3 font-semibold transition-all ${
              viewMode === 'gallery'
                ? 'text-pink-600 border-b-2 border-pink-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🖼️ Galerie
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Upload View */}
          {viewMode === 'upload' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upload AVANT */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
                    📸 Photo AVANT
                  </h3>
                  <input
                    ref={beforeInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'BEFORE')}
                    className="hidden"
                  />
                  <button
                    onClick={() => beforeInputRef.current?.click()}
                    className="w-full py-16 border-4 border-dashed border-blue-300 rounded-xl hover:border-blue-500 hover:bg-blue-100 transition-all flex flex-col items-center justify-center text-blue-600"
                  >
                    <Upload size={48} className="mb-3" />
                    <span className="font-bold text-lg">Cliquez pour uploader</span>
                    <span className="text-sm mt-1">ou glissez-déposez</span>
                  </button>
                  <p className="text-xs text-gray-600 mt-2 text-center">Max 5MB • JPG, PNG, WEBP</p>
                </div>

                {/* Upload APRÈS */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center">
                    ✨ Photo APRÈS
                  </h3>
                  <input
                    ref={afterInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'AFTER')}
                    className="hidden"
                  />
                  <button
                    onClick={() => afterInputRef.current?.click()}
                    className="w-full py-16 border-4 border-dashed border-green-300 rounded-xl hover:border-green-500 hover:bg-green-100 transition-all flex flex-col items-center justify-center text-green-600"
                  >
                    <Upload size={48} className="mb-3" />
                    <span className="font-bold text-lg">Cliquez pour uploader</span>
                    <span className="text-sm mt-1">ou glissez-déposez</span>
                  </button>
                  <p className="text-xs text-gray-600 mt-2 text-center">Max 5MB • JPG, PNG, WEBP</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="Ex: Zone dorsale lombaire, après 3 séances..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none resize-none"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Compare View */}
          {viewMode === 'compare' && (
            <div className="space-y-6">
              {/* Sélection des photos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sélectionner photo AVANT
                  </label>
                  <select
                    value={selectedBefore?.id || ''}
                    onChange={(e) => setSelectedBefore(beforePhotos.find(p => p.id === Number(e.target.value)) || null)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-pink-500 outline-none"
                  >
                    <option value="">-- Choisir --</option>
                    {beforePhotos.map(photo => (
                      <option key={photo.id} value={photo.id}>
                        {new Date(photo.date).toLocaleDateString('fr-FR')} {photo.notes && `- ${photo.notes}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sélectionner photo APRÈS
                  </label>
                  <select
                    value={selectedAfter?.id || ''}
                    onChange={(e) => setSelectedAfter(afterPhotos.find(p => p.id === Number(e.target.value)) || null)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-pink-500 outline-none"
                  >
                    <option value="">-- Choisir --</option>
                    {afterPhotos.map(photo => (
                      <option key={photo.id} value={photo.id}>
                        {new Date(photo.date).toLocaleDateString('fr-FR')} {photo.notes && `- ${photo.notes}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedBefore && selectedAfter ? (
                <>
                  {/* Slider de comparaison */}
                  <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center">
                        <ArrowLeftRight className="mr-2 text-pink-600" size={24} />
                        Comparaison Interactive
                      </h3>
                      <button
                        onClick={downloadComparison}
                        className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition-colors"
                      >
                        <Download size={18} className="mr-2" />
                        Télécharger
                      </button>
                    </div>

                    <div className="relative overflow-hidden rounded-xl" style={{ height: '500px' }}>
                      {/* Image APRÈS (background) */}
                      <img
                        src={selectedAfter.imageData}
                        alt="Après"
                        className="absolute inset-0 w-full h-full object-contain"
                      />

                      {/* Image AVANT (overlay avec clip) */}
                      <div
                        className="absolute inset-0"
                        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                      >
                        <img
                          src={selectedBefore.imageData}
                          alt="Avant"
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Ligne de séparation */}
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl cursor-ew-resize"
                        style={{ left: `${sliderPosition}%` }}
                        onMouseDown={(e) => {
                          const handleMove = (e: MouseEvent) => {
                            const rect = e.currentTarget?.parentElement?.getBoundingClientRect();
                            if (!rect) return;
                            const x = e.clientX - rect.left;
                            const percent = (x / rect.width) * 100;
                            setSliderPosition(Math.max(0, Math.min(100, percent)));
                          };

                          const handleUp = () => {
                            document.removeEventListener('mousemove', handleMove as any);
                            document.removeEventListener('mouseup', handleUp);
                          };

                          document.addEventListener('mousemove', handleMove as any);
                          document.addEventListener('mouseup', handleUp);
                        }}
                      >
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
                          <ArrowLeftRight size={20} className="text-pink-600" />
                        </div>
                      </div>

                      {/* Labels */}
                      <div className="absolute top-4 left-4 px-3 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm">
                        AVANT
                      </div>
                      <div className="absolute top-4 right-4 px-3 py-2 bg-green-600 text-white rounded-lg font-bold text-sm">
                        APRÈS
                      </div>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderPosition}
                      onChange={(e) => setSliderPosition(Number(e.target.value))}
                      className="w-full mt-4"
                    />
                  </div>

                  {/* Side by side */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border-2 border-blue-200 rounded-xl p-4">
                      <div className="bg-blue-100 text-blue-900 font-bold px-3 py-1 rounded-lg inline-block mb-3">
                        📸 AVANT
                      </div>
                      <img
                        src={selectedBefore.imageData}
                        alt="Avant"
                        className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setZoomedPhoto(selectedBefore)}
                      />
                      <p className="text-sm text-gray-600 mt-2">
                        {new Date(selectedBefore.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>

                    <div className="bg-white border-2 border-green-200 rounded-xl p-4">
                      <div className="bg-green-100 text-green-900 font-bold px-3 py-1 rounded-lg inline-block mb-3">
                        ✨ APRÈS
                      </div>
                      <img
                        src={selectedAfter.imageData}
                        alt="Après"
                        className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setZoomedPhoto(selectedAfter)}
                      />
                      <p className="text-sm text-gray-600 mt-2">
                        {new Date(selectedAfter.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-20 text-gray-500">
                  <Camera size={64} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">Sélectionnez une photo AVANT et APRÈS pour commencer la comparaison</p>
                </div>
              )}
            </div>
          )}

          {/* Gallery View */}
          {viewMode === 'gallery' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {photos.length === 0 ? (
                  <div className="col-span-3 text-center py-20">
                    <Camera size={64} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 text-lg">Aucune photo uploadée</p>
                  </div>
                ) : (
                  photos.map(photo => (
                    <div key={photo.id} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
                      <div className={`${photo.type === 'BEFORE' ? 'bg-blue-100 text-blue-900' : 'bg-green-100 text-green-900'} font-bold px-3 py-1 rounded-lg inline-block mb-3 text-sm`}>
                        {photo.type === 'BEFORE' ? '📸 AVANT' : '✨ APRÈS'}
                      </div>
                      <img
                        src={photo.imageData}
                        alt={photo.type}
                        className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity mb-3"
                        onClick={() => setZoomedPhoto(photo)}
                      />
                      <p className="text-sm text-gray-600 mb-2">
                        {new Date(photo.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      {photo.notes && (
                        <p className="text-sm text-gray-700 mb-3">{photo.notes}</p>
                      )}
                      <button
                        onClick={() => handleDeletePhoto(photo.id!)}
                        className="flex items-center text-red-600 hover:text-red-700 font-semibold text-sm"
                      >
                        <Trash2 size={16} className="mr-1" />
                        Supprimer
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Zoom */}
      {zoomedPhoto && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setZoomedPhoto(null)}
        >
          <div className="relative max-w-6xl max-h-[90vh]">
            <button
              onClick={() => setZoomedPhoto(null)}
              className="absolute -top-12 right-0 p-2 bg-white rounded-lg text-gray-900 hover:bg-gray-100"
            >
              <X size={24} />
            </button>
            <img
              src={zoomedPhoto.imageData}
              alt="Zoom"
              className="max-w-full max-h-[90vh] rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientPhotos;
