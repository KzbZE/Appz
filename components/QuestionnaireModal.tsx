import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import QuestionnaireService, { QuestionnaireTemplate, QuestionnaireQuestion } from '../services/questionnaireService';

interface QuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: number;
  patientId: number;
  patientName: string;
  appointmentId?: number;
  onComplete?: () => void;
}

const QuestionnaireModal: React.FC<QuestionnaireModalProps> = ({
  isOpen,
  onClose,
  templateId,
  patientId,
  patientName,
  appointmentId,
  onComplete
}) => {
  const [template, setTemplate] = useState<QuestionnaireTemplate | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTemplate();
    }
  }, [isOpen, templateId]);

  const loadTemplate = async () => {
    const templates = await QuestionnaireService.getActiveTemplates();
    const found = templates.find(t => t.id === templateId);
    setTemplate(found || null);
    setResponses({});
    setCurrentQuestionIndex(0);
    setErrors({});
    setIsCompleted(false);
  };

  if (!isOpen || !template) return null;

  const questions = template.questions;
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const validateQuestion = (question: QuestionnaireQuestion, value: any): string | null => {
    if (question.required && (value === undefined || value === null || value === '')) {
      return 'Cette question est obligatoire';
    }

    if (question.type === 'NUMBER' || question.type === 'SCALE') {
      const num = Number(value);
      if (isNaN(num)) return 'Valeur numérique invalide';
      if (question.min !== undefined && num < question.min) return `Minimum: ${question.min}`;
      if (question.max !== undefined && num > question.max) return `Maximum: ${question.max}`;
    }

    return null;
  };

  const handleNext = () => {
    const error = validateQuestion(currentQuestion, responses[currentQuestion.id]);
    if (error) {
      setErrors({ ...errors, [currentQuestion.id]: error });
      return;
    }

    setErrors({ ...errors, [currentQuestion.id]: '' });

    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await QuestionnaireService.saveResponse({
        templateId: template.id!,
        templateName: template.name,
        patientId,
        patientName,
        appointmentId,
        responses,
        completedAt: new Date().toISOString()
      });

      setIsCompleted(true);

      // Fermer après 2 secondes
      setTimeout(() => {
        onClose();
        onComplete?.();
      }, 2000);
    } catch (error) {
      console.error('Erreur soumission questionnaire:', error);
      alert('Erreur lors de la soumission');
    }
    setIsSubmitting(false);
  };

  const renderQuestionInput = (question: QuestionnaireQuestion) => {
    const value = responses[question.id];
    const error = errors[question.id];

    switch (question.type) {
      case 'TEXT':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => setResponses({ ...responses, [question.id]: e.target.value })}
            placeholder={question.placeholder}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
          />
        );

      case 'TEXTAREA':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => setResponses({ ...responses, [question.id]: e.target.value })}
            placeholder={question.placeholder}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none"
          />
        );

      case 'NUMBER':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => setResponses({ ...responses, [question.id]: e.target.value })}
            min={question.min}
            max={question.max}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
          />
        );

      case 'SCALE':
        return (
          <div className="space-y-4">
            <input
              type="range"
              value={value || question.min || 0}
              onChange={(e) => setResponses({ ...responses, [question.id]: Number(e.target.value) })}
              min={question.min || 0}
              max={question.max || 10}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
            <div className="flex justify-between text-sm text-slate-600">
              <span>{question.min || 0}</span>
              <span className="text-2xl font-bold text-teal-600">{value !== undefined ? value : question.min || 0}</span>
              <span>{question.max || 10}</span>
            </div>
          </div>
        );

      case 'CHOICE':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setResponses({ ...responses, [question.id]: option })}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                  value === option
                    ? 'border-teal-500 bg-teal-50 text-teal-700 font-semibold'
                    : 'border-gray-200 bg-white text-slate-700 hover:border-teal-300'
                }`}
              >
                {value === option && <CheckCircle size={18} className="inline mr-2 text-teal-600" />}
                {option}
              </button>
            ))}
          </div>
        );

      case 'MULTICHOICE':
        const selectedOptions = value || [];
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => {
              const isSelected = selectedOptions.includes(option);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    const updated = isSelected
                      ? selectedOptions.filter((o: string) => o !== option)
                      : [...selectedOptions, option];
                    setResponses({ ...responses, [question.id]: updated });
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50 text-teal-700 font-semibold'
                      : 'border-gray-200 bg-white text-slate-700 hover:border-teal-300'
                  }`}
                >
                  {isSelected && <CheckCircle size={18} className="inline mr-2 text-teal-600" />}
                  {option}
                </button>
              );
            })}
          </div>
        );

      case 'BOOLEAN':
        return (
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setResponses({ ...responses, [question.id]: true })}
              className={`flex-1 px-6 py-4 rounded-xl border-2 font-semibold transition-all ${
                value === true
                  ? 'border-teal-500 bg-teal-50 text-teal-700'
                  : 'border-gray-200 bg-white text-slate-700 hover:border-teal-300'
              }`}
            >
              ✓ Oui
            </button>
            <button
              type="button"
              onClick={() => setResponses({ ...responses, [question.id]: false })}
              className={`flex-1 px-6 py-4 rounded-xl border-2 font-semibold transition-all ${
                value === false
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 bg-white text-slate-700 hover:border-red-300'
              }`}
            >
              ✗ Non
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">{template.name}</h2>
              <p className="text-teal-100 text-sm mt-1">{template.description}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="bg-white/20 rounded-full h-2 overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-teal-100 mt-2">
            Question {currentQuestionIndex + 1} sur {questions.length}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          {isCompleted ? (
            <div className="text-center py-12">
              <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Questionnaire complété !</h3>
              <p className="text-slate-600">
                Merci d'avoir pris le temps de répondre. Vos réponses ont été enregistrées.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Question */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    {currentQuestionIndex + 1}
                  </span>
                  <span className="flex-1">
                    {currentQuestion.question}
                    {currentQuestion.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </span>
                </h3>

                {/* Input */}
                {renderQuestionInput(currentQuestion)}

                {/* Error message */}
                {errors[currentQuestion.id] && (
                  <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-xl mt-3">
                    <AlertCircle size={18} />
                    <span className="text-sm">{errors[currentQuestion.id]}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isCompleted && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex justify-between">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-3 border border-gray-300 text-slate-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Précédent
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  'Envoi...'
                ) : isLastQuestion ? (
                  'Terminer ✓'
                ) : (
                  'Suivant →'
                )}
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-4 text-center">
              Les champs marqués d'un <span className="text-red-500">*</span> sont obligatoires
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionnaireModal;
