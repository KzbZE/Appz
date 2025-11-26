import React, { useState, useRef } from 'react';
import { Camera, Upload, FileText, Scan, Download, Copy, Trash2, CheckCircle } from 'lucide-react';

const OCRScannerModule: React.FC = () => {
  const [scannedText, setScannedText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanHistory, setScanHistory] = useState<Array<{
    id: number;
    date: string;
    text: string;
    imageUrl: string;
    type: 'ordonnance' | 'prescription' | 'facture' | 'other';
  }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      // Convertir en Base64 pour affichage
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string;
        setSelectedImage(imageUrl);

        // Simulation OCR (Tesseract.js serait idéal ici)
        // Pour l'instant, on simule avec un message
        await new Promise(resolve => setTimeout(resolve, 2000));

        const mockText = `[OCR Simulation]

Document détecté: ${file.name}
Type: ${file.type}

Cette fonctionnalité utiliserait Tesseract.js pour une vraie reconnaissance de texte.

Pour activer l'OCR réel, installez:
npm install tesseract.js

Texte exemple simulé:
- Ordonnance du Dr. Martin
- Date: ${new Date().toLocaleDateString()}
- Prescription: Paracétamol 1g x3/jour
- Durée: 7 jours`;

        setScannedText(mockText);

        // Ajouter à l'historique
        const newScan = {
          id: Date.now(),
          date: new Date().toISOString(),
          text: mockText,
          imageUrl,
          type: 'other' as const
        };

        setScanHistory([newScan, ...scanHistory]);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erreur OCR:', error);
      alert('❌ Erreur lors du scan');
    } finally {
      setIsProcessing(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Erreur caméra:', error);
      alert('❌ Impossible d\'accéder à la caméra');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);

        const imageUrl = canvasRef.current.toDataURL('image/jpeg');
        setSelectedImage(imageUrl);
        stopCamera();

        // Simuler OCR
        setIsProcessing(true);
        setTimeout(() => {
          setScannedText('[Photo capturée - OCR en cours de traitement...]');
          setIsProcessing(false);
        }, 2000);
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(scannedText);
    alert('✅ Texte copié dans le presse-papier');
  };

  const downloadAsText = () => {
    const blob = new Blob([scannedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black mb-2">📄 Scanner OCR</h1>
            <p className="text-indigo-100">Reconnaissance de texte sur documents (ordonnances, factures...)</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black">{scanHistory.length}</div>
            <div className="text-sm text-indigo-100">Documents scannés</div>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Camera Capture */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            <Camera className="inline mr-2" size={20} />
            Capturer avec caméra
          </h3>

          {!isCameraActive ? (
            <button
              onClick={startCamera}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
            >
              <Camera className="inline mr-2" size={20} />
              Démarrer la caméra
            </button>
          ) : (
            <div className="space-y-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg bg-black"
              />
              <div className="flex gap-2">
                <button
                  onClick={capturePhoto}
                  className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-green-700"
                >
                  <Scan className="inline mr-2" size={18} />
                  Capturer
                </button>
                <button
                  onClick={stopCamera}
                  className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-gray-700"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            <Upload className="inline mr-2" size={20} />
            Importer un fichier
          </h3>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all"
          >
            <FileText className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600 font-bold mb-2">
              Cliquez pour sélectionner un fichier
            </p>
            <p className="text-sm text-gray-500">
              Formats acceptés: JPG, PNG, PDF
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-indigo-700 font-bold">
            🔍 Analyse du document en cours...
          </p>
        </div>
      )}

      {/* Preview & Results */}
      {selectedImage && scannedText && !isProcessing && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Preview */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Image originale</h3>
            <img
              src={selectedImage}
              alt="Document scanné"
              className="w-full rounded-lg shadow-lg"
            />
          </div>

          {/* Extracted Text */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Texte extrait</h3>
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                  title="Copier"
                >
                  <Copy size={18} />
                </button>
                <button
                  onClick={downloadAsText}
                  className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                  title="Télécharger"
                >
                  <Download size={18} />
                </button>
              </div>
            </div>

            <textarea
              value={scannedText}
              onChange={(e) => setScannedText(e.target.value)}
              className="w-full h-96 p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
            />

            <div className="mt-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-700">
                💡 <strong>Astuce:</strong> Vous pouvez éditer le texte détecté avant de le sauvegarder.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            <FileText className="inline mr-2" size={20} />
            Historique des scans
          </h3>

          <div className="space-y-4">
            {scanHistory.map((scan) => (
              <div key={scan.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <img
                  src={scan.imageUrl}
                  alt="Thumbnail"
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">{new Date(scan.date).toLocaleString()}</p>
                  <p className="text-gray-700 font-mono text-sm mt-1 line-clamp-2">
                    {scan.text.substring(0, 100)}...
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedImage(scan.imageUrl);
                      setScannedText(scan.text);
                    }}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <CheckCircle size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setScanHistory(scanHistory.filter(s => s.id !== scan.id));
                    }}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Installation Info */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-900 mb-2">📦 Pour activer l'OCR réel</h3>
        <p className="text-sm text-blue-700 mb-3">
          Cette démo utilise une simulation. Pour une vraie reconnaissance de texte, installez Tesseract.js:
        </p>
        <pre className="bg-black/80 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
          npm install tesseract.js
        </pre>
        <p className="text-xs text-blue-600 mt-2">
          Tesseract.js permet de reconnaître plus de 100 langues avec une précision de 85-95%.
        </p>
      </div>
    </div>
  );
};

export default OCRScannerModule;
