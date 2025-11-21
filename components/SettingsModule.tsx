import React, { useState } from 'react';
import { AppSettings } from '../types';
import { Save, MapPin, DollarSign, Share2, Instagram, Facebook, Palette, Image, User, Type, Upload, Settings as SettingsIcon, Briefcase, Cloud } from 'lucide-react';
import { signInToGoogle } from '../services/googleApiService';

interface SettingsModuleProps {
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

const SettingsModule: React.FC<SettingsModuleProps> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [isConnecting, setIsConnecting] = useState(false);

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

      </div>
    </div>
  );
};

export default SettingsModule;