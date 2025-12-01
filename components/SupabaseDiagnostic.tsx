import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

/**
 * Composant de diagnostic Supabase
 * À utiliser temporairement pour vérifier la configuration
 */
const SupabaseDiagnostic: React.FC = () => {
  const [tests, setTests] = useState({
    envVarsLoaded: false,
    urlValid: false,
    connectionOk: false,
    authOk: false,
  });
  const [details, setDetails] = useState<any>({});
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const results: any = {};

    // Test 1: Variables d'environnement
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    results.url = url;
    results.keyPreview = key ? `${key.substring(0, 20)}...` : 'NON DÉFINIE';
    results.envVarsLoaded = !!(url && key &&
      url !== 'https://your-project.supabase.co' &&
      key !== 'your_anon_key_here');

    // Test 2: URL valide
    results.urlValid = url?.includes('supabase.co') && url.startsWith('https://');

    // Test 3: Connexion à la base
    try {
      const { data, error } = await supabase.from('settings').select('id').limit(1);
      results.connectionOk = !error;
      results.connectionError = error?.message;
    } catch (err: any) {
      results.connectionOk = false;
      results.connectionError = err.message;
    }

    // Test 4: Auth disponible
    try {
      const { data, error } = await supabase.auth.getSession();
      results.authOk = !error;
      results.authError = error?.message;
    } catch (err: any) {
      results.authOk = false;
      results.authError = err.message;
    }

    // Test 5: Essai de connexion avec credentials invalides
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@test.com',
        password: 'invalid'
      });

      if (error) {
        results.authTestStatus = error.status;
        results.authTestMessage = error.message;

        if (error.status === 400) {
          results.authWarning = 'Erreur 400: Vérifiez que l\'authentification par email est activée dans Supabase';
        } else if (error.status === 401 || error.message.includes('Invalid login')) {
          results.authTestOk = true; // C'est normal, les credentials sont invalides
        }
      }
    } catch (err: any) {
      results.authTestError = err.message;
    }

    setDetails(results);
    setTests({
      envVarsLoaded: results.envVarsLoaded,
      urlValid: results.urlValid,
      connectionOk: results.connectionOk,
      authOk: results.authOk,
    });
    setIsRunning(false);
  };

  const TestResult: React.FC<{ passed: boolean; label: string }> = ({ passed, label }) => (
    <div className="flex items-center gap-2 py-2">
      {passed ? (
        <CheckCircle className="text-green-500" size={20} />
      ) : (
        <XCircle className="text-red-500" size={20} />
      )}
      <span className={passed ? 'text-green-700' : 'text-red-700'}>{label}</span>
    </div>
  );

  return (
    <div className="fixed top-4 right-4 bg-white rounded-xl shadow-2xl p-6 max-w-lg z-50 border-2 border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="text-blue-500" size={24} />
        <h3 className="text-lg font-bold text-slate-800">Diagnostic Supabase</h3>
      </div>

      {isRunning ? (
        <p className="text-slate-600">Tests en cours...</p>
      ) : (
        <div className="space-y-2">
          <TestResult
            passed={tests.envVarsLoaded}
            label="Variables d'environnement chargées"
          />
          <TestResult
            passed={tests.urlValid}
            label="URL Supabase valide"
          />
          <TestResult
            passed={tests.connectionOk}
            label="Connexion à la base de données"
          />
          <TestResult
            passed={tests.authOk}
            label="Service d'authentification disponible"
          />

          <div className="mt-4 p-4 bg-slate-50 rounded-lg text-xs font-mono">
            <div className="mb-2">
              <strong>URL:</strong> {details.url || 'Non définie'}
            </div>
            <div className="mb-2">
              <strong>Anon Key:</strong> {details.keyPreview}
            </div>

            {details.connectionError && (
              <div className="mt-2 p-2 bg-red-50 text-red-700 rounded">
                <strong>Erreur connexion DB:</strong> {details.connectionError}
              </div>
            )}

            {details.authTestStatus && (
              <div className={`mt-2 p-2 rounded ${
                details.authTestStatus === 400 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
              }`}>
                <strong>Test Auth:</strong> Status {details.authTestStatus}
                <div className="text-xs mt-1">{details.authTestMessage}</div>
                {details.authWarning && (
                  <div className="mt-2 font-bold">⚠️ {details.authWarning}</div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={runDiagnostics}
            className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Relancer les tests
          </button>
        </div>
      )}
    </div>
  );
};

export default SupabaseDiagnostic;
