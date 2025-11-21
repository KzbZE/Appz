import { GoogleGenAI } from "@google/genai";

const API_KEY = (() => {
  try {
    return (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
  } catch (e) {
    return '';
  }
})();

let aiClient: GoogleGenAI | null = null;

const getClient = () => {
  if (!aiClient && API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: API_KEY });
  }
  return aiClient;
};

export const generateBusinessAdvice = async (
  query: string, 
  context: string
): Promise<string> => {
  if (!API_KEY) return "Veuillez configurer votre clé API Gemini.";

  try {
    const client = getClient();
    if (!client) return "Client Gemini non initialisé.";
    
    const model = "gemini-2.5-flash";
    
    const systemInstruction = `
      Tu es un "IA Business Coach" expert pour un thérapeute hybride (Ostéo/Kiné pour Humains et Chevaux/Chiens).
      Ton but est d'aider le praticien à optimiser sa rentabilité, gérer ses tournées, et améliorer la rétention client.
      
      Règles d'or :
      1. Analyse la rentabilité des déplacements (Frais kilométriques vs Temps).
      2. Suggère des actions concrètes pour la rétention (Rappel vaccins, visite contrôle).
      3. Sois concis, professionnel et encourageant.
      4. Réponds toujours en Français.
    `;

    const response = await client.models.generateContent({
      model,
      contents: `Contexte Financier et Opérationnel: ${context}\n\nQuestion de l'utilisateur: ${query}`,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "Je n'ai pas pu générer de conseil pour le moment.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Une erreur est survenue lors de la consultation de votre coach IA.";
  }
};

export const generateSessionReport = async (
  sessionData: any,
  patientType: string
): Promise<string> => {
  if (!API_KEY) return "Synthèse indisponible (Clé API manquante).";

  try {
    const client = getClient();
    if (!client) return "Client Gemini non initialisé.";

    const model = "gemini-2.5-flash";

    const systemInstruction = `
      Tu es un assistant médical vétérinaire et humain. 
      Rédige un compte-rendu de séance professionnel, empathique et structuré à destination du client/propriétaire.
      
      Structure attendue :
      1. Bilan Rapide (État général).
      2. Zones Traitées (Résumé des tensions).
      3. Conseils & Exercices (Clairs et applicables).
      
      Ton : Expert mais accessible.
    `;

    const prompt = `
      Patient Type: ${patientType}
      Anamnèse: ${JSON.stringify(sessionData.anamnesis)}
      Tensions relevées: ${JSON.stringify(sessionData.tensions)}
      Techniques utilisées: ${JSON.stringify(sessionData.treatmentNotes)}
      Exercices conseillés: ${JSON.stringify(sessionData.exercises)}
    `;

    const response = await client.models.generateContent({
      model,
      contents: prompt,
      config: { systemInstruction }
    });

    return response.text || "Génération du rapport échouée.";
  } catch (error) {
    console.error("Gemini Report Error:", error);
    return "Erreur lors de la génération du rapport.";
  }
}