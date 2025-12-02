import React, { useState } from 'react';
import { AppSettings } from '../types';
import { Save, MapPin, DollarSign, Share2, Instagram, Facebook, Palette, Image, User, Type, Upload, Settings as SettingsIcon, Briefcase, Cloud, Database, Download, UploadCloud, AlertTriangle, CheckCircle } from 'lucide-react';
import { signInToGoogle } from '../services/googleApiService';
import { downloadBackup, importBackup, getLastBackupDate, restoreFromAutoBackup } from '../services/backupService';

interface SettingsModuleProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

const SettingsModule: React.FC<SettingsModuleProps> = ({ settings, onSave }) => {
  // Ensure defaultTariffs exists with fallback values
  const normalizedSettings = {
    ...settings,
    defaultTariffs: settings.defaultTariffs || {
      HUMAN_KINESIO: 0,
      EQUINE_KINESIO: 0,
      CANINE_KINESIO: 0,
      MASSAGE: 0
    }
  };

  const [localSettings, setLocalSettings] = useState<AppSettings>(normalizedSettings);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(getLastBackupDate());

  const handleSave = () => {
    onSave(localSettings);
    alert("Paramètres sauvegardés avec succès !");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setLocalSettings({
                  ...localSettings,
                  branding: { ...localSettings.branding, logoUrl: reader.result as string }
              });
          };
          reader.readAsDataURL(file);
      }
  };

  const handleGoogleConnect = async () => {
      setIsConnecting(true);
      try {
          await signInToGoogle(localSettings);
          alert("Connexion Google réussie !");
      } catch (error) {
          alert("Erreur de connexion Google. Vérifiez vos clés API/Client ID.");
          console.error(error);
      }
      setIsConnecting(false);
  };

  const handleDownloadBackup = async () => {
      try {
          await downloadBackup();
          setLastBackupDate(getLastBackupDate());
          alert("✅ Backup téléchargé avec succès !");
      } catch (error) {
          alert("❌ Erreur lors du téléchargement du backup");
          console.error(error);
      }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const result = await importBackup(file);

      if (result.success) {
          alert("✅ Backup importé avec succès ! La page va se recharger.");
          window.location.reload();
      } else {
          alert(`❌ Erreur lors de l'importation: ${result.error}`);
      }

      // Reset input
      e.target.value = '';
  };

  const handleRestoreAutoBackup = async () => {
      const confirmed = confirm(
          "⚠️ Voulez-vous restaurer la sauvegarde automatique ?\n\n" +
          "Cette opération va remplacer toutes vos données actuelles."
      );

      if (!confirmed) return;

      const result = await restoreFromAutoBackup();

      if (result.success) {
          alert("✅ Sauvegarde automatique restaurée ! La page va se recharger.");
          window.location.reload();
      } else {
          alert(`❌ ${result.error}`);
      }
  };

  return (
    <div className="h-full flex flex-col bg-white md:rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
        <div>
            <h2 className="text-xl font-bold">Paramètres Cabinet</h2>
            <p className="text-slate-400 text-sm">Configuration générale</p>
        </div>
        <button 
            onClick={handleSave}
            className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg font-bold transition-colors"
        >
            <Save size={18} className="mr-2" /> Enregistrer
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* SECTION: PARAMÈTRES GÉNÉRAUX */}
        <section className="animate-fadeIn">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg mr-3"><Briefcase size={20}/></div>
                Paramètres Généraux
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Nom de l'Application</label>
                    <div className="relative">
                        <Type className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            className="w-full p-3 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                            value={localSettings.appName || ''}
                            onChange={(e) => setLocalSettings({...localSettings, appName: e.target.value})}
                            placeholder="Ex: EquiMotion"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Nom du Praticien</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            className="w-full p-3 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                            value={localSettings.practitionerName || ''}
                            onChange={(e) => setLocalSettings({...localSettings, practitionerName: e.target.value})}
                            placeholder="Ex: Martin Durand"
                        />
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-600 mb-1">Adresse du Cabinet (Siège Social)</label>
                    <div className="relative">
                         <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            className="w-full p-3 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                            value={localSettings.cabinetAddress}
                            onChange={(e) => setLocalSettings({...localSettings, cabinetAddress: e.target.value})}
                            placeholder="Ex: 10 Rue de la Paix, 75000 Paris"
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Cette adresse sert de point de départ pour le calcul automatique des itinéraires et frais kilométriques.</p>
                </div>
            </div>
        </section>

        <hr className="border-gray-100" />

        {/* SECTION: GOOGLE INTEGRATION */}
        <section className="animate-fadeIn">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mr-3"><Cloud size={20}/></div>
                Intégrations Google (Drive & Agenda)
            </h3>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Client ID (OAuth2)</label>
                        <input 
                            type="text" 
                            className="w-full p-3 border border-gray-200 rounded-xl"
                            value={localSettings.google?.clientId || ''}
                            onChange={(e) => setLocalSettings({
                                ...localSettings, 
                                google: { ...localSettings.google || { apiKey: '', clientId: '' }, clientId: e.target.value }
                            })}
                            placeholder="xxx.apps.googleusercontent.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">API Key</label>
                        <input 
                            type="text" 
                            className="w-full p-3 border border-gray-200 rounded-xl"
                            value={localSettings.google?.apiKey || ''}
                            onChange={(e) => setLocalSettings({
                                ...localSettings, 
                                google: { ...localSettings.google || { apiKey: '', clientId: '' }, apiKey: e.target.value }
                            })}
                            placeholder="AIzaSy..."
                        />
                    </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                    <p className="text-xs text-slate-500">Nécessaire pour la synchro Agenda et l'export Drive.</p>
                    <button 
                        onClick={handleGoogleConnect}
                        disabled={!localSettings.google?.clientId}
                        className={`px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors
                            ${localSettings.google?.accessToken ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {localSettings.google?.accessToken ? 'Compte Connecté' : 'Se connecter à Google'}
                    </button>
                </div>
            </div>
        </section>

        <hr className="border-gray-100" />

        {/* SECTION: IDENTITÉ VISUELLE */}
        <section className="animate-fadeIn">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <div className="p-2 bg-pink-50 text-pink-600 rounded-lg mr-3"><Palette size={20}/></div>
                Identité Visuelle
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Couleur Thème</label>
                    <div className="flex items-center space-x-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
                        <input 
                            type="color" 
                            className="h-10 w-10 rounded-lg border-0 cursor-pointer"
                            value={localSettings.branding?.primaryColor || '#14b8a6'}
                            onChange={(e) => setLocalSettings({...localSettings, branding: {...localSettings.branding, primaryColor: e.target.value}})}
                        />
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">Couleur Principale</span>
                            <span className="text-xs text-slate-500 font-mono">{localSettings.branding?.primaryColor}</span>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Logo (Importer Image)</label>
                    <div className="flex items-center space-x-4">
                        <div className="relative flex-1">
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden" 
                                id="logo-upload"
                            />
                            <label htmlFor="logo-upload" className="flex items-center justify-center w-full p-3 border border-dashed border-primary-300 bg-primary-50 text-primary-700 rounded-xl cursor-pointer hover:bg-primary-100 transition-colors">
                                <Upload size={18} className="mr-2" /> Choisir une image
                            </label>
                        </div>
                        {localSettings.branding?.logoUrl ? (
                            <div className="w-14 h-14 border border-gray-200 rounded-lg p-1 bg-white flex items-center justify-center">
                                <img src={localSettings.branding.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                            </div>
                        ) : (
                            <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                <Image size={24} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>

        <hr className="border-gray-100" />

        {/* SECTION: LOGISTIQUE */}
        <section className="animate-fadeIn">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mr-3"><MapPin size={20}/></div>
                Frais de Déplacement
            </h3>
            <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Indemnité Kilométrique (€/km)</label>
                <div className="relative">
                    <input 
                        type="number" step="0.01"
                        className="w-full p-3 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                        value={localSettings.kmRate}
                        onChange={(e) => setLocalSettings({...localSettings, kmRate: parseFloat(e.target.value)})}
                    />
                    <DollarSign className="absolute left-3 top-3 text-slate-400" size={18} />
                </div>
                <p className="text-xs text-slate-400 mt-1">Appliqué automatiquement aux RDV de type 'Extérieur'.</p>
            </div>
        </section>

        <hr className="border-gray-100" />

        {/* SECTION: TARIFS */}
        <section className="animate-fadeIn">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <div className="p-2 bg-green-50 text-green-600 rounded-lg mr-3"><DollarSign size={20}/></div>
                Grille Tarifaire par Défaut
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kinésio Humaine</label>
                    <div className="relative">
                        <input 
                            type="number"
                            className="w-full p-3 pl-8 border border-gray-200 rounded-xl font-bold text-slate-700"
                            value={localSettings.defaultTariffs.HUMAN_KINESIO}
                            onChange={(e) => setLocalSettings({...localSettings, defaultTariffs: {...localSettings.defaultTariffs, HUMAN_KINESIO: parseFloat(e.target.value)}})}
                        />
                        <span className="absolute left-3 top-3 text-gray-400">€</span>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kinésio Équine</label>
                    <div className="relative">
                        <input 
                            type="number"
                            className="w-full p-3 pl-8 border border-gray-200 rounded-xl font-bold text-slate-700"
                            value={localSettings.defaultTariffs.EQUINE_KINESIO}
                            onChange={(e) => setLocalSettings({...localSettings, defaultTariffs: {...localSettings.defaultTariffs, EQUINE_KINESIO: parseFloat(e.target.value)}})}
                        />
                        <span className="absolute left-3 top-3 text-gray-400">€</span>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kinésio Canine</label>
                    <div className="relative">
                        <input 
                            type="number"
                            className="w-full p-3 pl-8 border border-gray-200 rounded-xl font-bold text-slate-700"
                            value={localSettings.defaultTariffs.CANINE_KINESIO}
                            onChange={(e) => setLocalSettings({...localSettings, defaultTariffs: {...localSettings.defaultTariffs, CANINE_KINESIO: parseFloat(e.target.value)}})}
                        />
                        <span className="absolute left-3 top-3 text-gray-400">€</span>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Massage (Humain)</label>
                    <div className="relative">
                        <input 
                            type="number"
                            className="w-full p-3 pl-8 border border-gray-200 rounded-xl font-bold text-slate-700"
                            value={localSettings.defaultTariffs.MASSAGE}
                            onChange={(e) => setLocalSettings({...localSettings, defaultTariffs: {...localSettings.defaultTariffs, MASSAGE: parseFloat(e.target.value)}})}
                        />
                        <span className="absolute left-3 top-3 text-gray-400">€</span>
                    </div>
                </div>
            </div>
        </section>

        <hr className="border-gray-100" />

        {/* SECTION: SOCIAL */}
        <section className="animate-fadeIn">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg mr-3"><Share2 size={20}/></div>
                Réseaux Sociaux & Marketing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Compte Instagram (@)</label>
                    <div className="relative">
                        <Instagram className="absolute left-3 top-3 text-pink-500" size={18} />
                        <input 
                            type="text" placeholder="@theraflow_officiel"
                            className="w-full p-3 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                            value={localSettings.social.instagramHandle}
                            onChange={(e) => setLocalSettings({...localSettings, social: {...localSettings.social, instagramHandle: e.target.value}})}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Page Facebook</label>
                    <div className="relative">
                        <Facebook className="absolute left-3 top-3 text-blue-600" size={18} />
                        <input 
                            type="text" placeholder="TheraFlow Cabinet"
                            className="w-full p-3 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                            value={localSettings.social.facebookPage}
                            onChange={(e) => setLocalSettings({...localSettings, social: {...localSettings.social, facebookPage: e.target.value}})}
                        />
                    </div>
                </div>
            </div>
        </section>

        <hr className="border-gray-100" />

        {/* SECTION: SAUVEGARDE & RESTAURATION */}
        <section className="animate-fadeIn">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mr-3"><Database size={20}/></div>
                Sauvegarde & Restauration
            </h3>

            {/* Auto Backup Status */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                    <CheckCircle size={24} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-blue-900 mb-1">✓ Sauvegarde Automatique Activée</h4>
                        <p className="text-sm text-blue-700 mb-2">
                            Vos données sont automatiquement sauvegardées quotidiennement dans votre navigateur.
                        </p>
                        {lastBackupDate && (
                            <p className="text-xs text-blue-600 font-semibold">
                                Dernière sauvegarde : {new Date(lastBackupDate).toLocaleDateString('fr-FR')}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Manual Backup Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Export Backup */}
                <div className="bg-white border-2 border-slate-200 rounded-xl p-5 hover:border-blue-400 transition-all hover:shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Download size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800">Télécharger Backup</h4>
                            <p className="text-xs text-slate-500">Export manuel complet</p>
                        </div>
                    </div>
                    <button
                        onClick={handleDownloadBackup}
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-lg font-bold shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                    >
                        <Download size={18} />
                        Télécharger Backup (.json)
                    </button>
                    <p className="text-xs text-slate-500 mt-2">
                        Télécharge toutes vos données au format JSON. Conservez ce fichier en lieu sûr.
                    </p>
                </div>

                {/* Import Backup */}
                <div className="bg-white border-2 border-slate-200 rounded-xl p-5 hover:border-orange-400 transition-all hover:shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <UploadCloud size={20} className="text-orange-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800">Restaurer Backup</h4>
                            <p className="text-xs text-slate-500">Importer un fichier de sauvegarde</p>
                        </div>
                    </div>
                    <label className="w-full block">
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImportBackup}
                            className="hidden"
                        />
                        <div className="cursor-pointer w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-lg font-bold shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2">
                            <UploadCloud size={18} />
                            Importer Backup (.json)
                        </div>
                    </label>
                    <p className="text-xs text-slate-500 mt-2">
                        ⚠️ Attention : Remplacera toutes vos données actuelles par celles du backup.
                    </p>
                </div>

                {/* Restore Auto Backup */}
                <div className="bg-white border-2 border-slate-200 rounded-xl p-5 hover:border-green-400 transition-all hover:shadow-lg md:col-span-2">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Database size={20} className="text-green-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800">Restaurer Sauvegarde Automatique</h4>
                            <p className="text-xs text-slate-500">Revenir à la dernière sauvegarde automatique quotidienne</p>
                        </div>
                    </div>
                    <button
                        onClick={handleRestoreAutoBackup}
                        disabled={!lastBackupDate}
                        className={`w-full md:w-auto px-6 py-3 rounded-lg font-bold shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                            lastBackupDate
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white hover:scale-105'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        <Database size={18} />
                        Restaurer Backup Auto
                    </button>
                    {!lastBackupDate && (
                        <p className="text-xs text-orange-600 font-semibold mt-2">
                            Aucune sauvegarde automatique disponible pour le moment.
                        </p>
                    )}
                </div>
            </div>

            {/* Warning Box */}
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mt-6">
                <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-red-800 mb-1">⚠️ Important</h4>
                        <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                            <li>Les sauvegardes automatiques sont stockées dans votre navigateur (localStorage)</li>
                            <li>Téléchargez régulièrement des backups manuels pour sécuriser vos données</li>
                            <li>La restauration d'un backup remplace TOUTES vos données actuelles</li>
                            <li>Conservez vos fichiers de backup en lieu sûr (cloud, disque externe...)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

      </div>
    </div>
  );
};

export default SettingsModule;