import React, { useState } from 'react';
import { Star, Send, ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { db } from '../db';
import { SurveyResponse } from '../types';

interface SatisfactionSurveyFormProps {
  sessionId?: number;
  patientId: number;
  patientName: string;
  onClose: () => void;
  onSubmit?: () => void;
}

const SatisfactionSurveyForm: React.FC<SatisfactionSurveyFormProps> = ({
  sessionId,
  patientId,
  patientName,
  onClose,
  onSubmit
}) => {
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Questions prédéfinies
  const questions = [
    { id: 'service_quality', question: 'Comment évaluez-vous la qualité du service ?', type: 'TEXT' },
    { id: 'professionalism', question: 'Le praticien était-il professionnel et à l\'écoute ?', type: 'TEXT' },
    { id: 'improvements', question: 'Que pourrait-on améliorer ?', type: 'TEXT' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!npsScore && rating === 0) {
      alert('Veuillez donner au moins une note (NPS ou étoiles)');
      return;
    }

    setIsSubmitting(true);

    try {
      const response: SurveyResponse = {
        sessionId,
        patientId,
        patientName,
        date: new Date().toISOString(),
        npsScore: npsScore || undefined,
        rating: rating || undefined,
        answers,
        feedback,
        wouldRecommend: wouldRecommend || false
      };

      await db.surveyResponses.add(response);

      alert('✅ Merci pour votre retour ! Votre avis est précieux pour nous.');
      onSubmit?.();
      onClose();
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert('❌ Erreur lors de l\'envoi. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col my-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Enquête de satisfaction</h2>
              <p className="text-purple-100 text-sm">
                Aidez-nous à améliorer nos services en partageant votre expérience
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* NPS Score */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <label className="block text-lg font-bold text-blue-900 mb-3">
              Sur une échelle de 0 à 10, recommanderiez-vous nos services ?
            </label>
            <p className="text-sm text-blue-700 mb-4">
              0 = Pas du tout • 10 = Absolument
            </p>
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setNpsScore(score)}
                  className={`flex-1 min-w-[50px] py-3 rounded-lg font-bold text-lg transition-all ${
                    npsScore === score
                      ? score <= 6
                        ? 'bg-red-500 text-white scale-110 shadow-lg'
                        : score <= 8
                        ? 'bg-yellow-500 text-white scale-110 shadow-lg'
                        : 'bg-green-500 text-white scale-110 shadow-lg'
                      : 'bg-white border-2 border-blue-200 text-blue-900 hover:border-blue-400'
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>

          {/* Star Rating */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border border-amber-200">
            <label className="block text-lg font-bold text-amber-900 mb-3">
              Évaluez globalement votre expérience
            </label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="transform hover:scale-110 transition-transform"
                >
                  <Star
                    size={48}
                    className={`${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center mt-3 text-amber-900 font-medium">
                {rating === 1 && 'Très insatisfait'}
                {rating === 2 && 'Insatisfait'}
                {rating === 3 && 'Neutre'}
                {rating === 4 && 'Satisfait'}
                {rating === 5 && 'Très satisfait'}
              </p>
            )}
          </div>

          {/* Would Recommend */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <label className="block text-lg font-bold text-green-900 mb-4">
              Recommanderiez-vous ce praticien à un proche ?
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setWouldRecommend(true)}
                className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                  wouldRecommend === true
                    ? 'bg-green-500 text-white scale-105 shadow-lg'
                    : 'bg-white border-2 border-green-200 text-green-900 hover:border-green-400'
                }`}
              >
                <ThumbsUp size={24} />
                Oui
              </button>
              <button
                type="button"
                onClick={() => setWouldRecommend(false)}
                className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                  wouldRecommend === false
                    ? 'bg-red-500 text-white scale-105 shadow-lg'
                    : 'bg-white border-2 border-green-200 text-green-900 hover:border-green-400'
                }`}
              >
                <ThumbsDown size={24} />
                Non
              </button>
            </div>
          </div>

          {/* Questions */}
          {questions.map((q) => (
            <div key={q.id} className="bg-white border-2 border-gray-200 rounded-xl p-5">
              <label className="block text-base font-bold text-slate-800 mb-3">
                {q.question}
              </label>
              <textarea
                value={answers[q.id] || ''}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                placeholder="Votre réponse (optionnelle)..."
              />
            </div>
          ))}

          {/* General Feedback */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
            <label className="block text-lg font-bold text-purple-900 mb-3">
              Commentaires additionnels
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
              placeholder="Partagez vos impressions, suggestions ou remarques..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t flex-shrink-0">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (!npsScore && rating === 0)}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                'Envoi en cours...'
              ) : (
                <>
                  <Send size={20} />
                  Envoyer mon avis
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SatisfactionSurveyForm;
