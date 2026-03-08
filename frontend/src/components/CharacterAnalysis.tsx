import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PersonalityProfile } from '../types';
import { apiClient } from '../services';

interface CharacterAnalysisProps {
  userId: string;
  onComplete: (profile: PersonalityProfile) => void;
  onSkip?: () => void;
}

interface AnalysisQuestion {
  id: string;
  question: string;
  userResponse: string;
}

/**
 * Character Analysis Component
 * 
 * Conducts interactive character analysis to determine user's learning style.
 * Provides skip option if personality profile already exists.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export default function CharacterAnalysis({ userId, onComplete, onSkip }: CharacterAnalysisProps) {
  const [existingProfile, setExistingProfile] = useState<PersonalityProfile | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<AnalysisQuestion[]>([
    { id: '1', question: 'How do you prefer to learn new concepts?', userResponse: '' },
    { id: '2', question: 'When facing a challenging problem, what is your typical approach?', userResponse: '' },
    { id: '3', question: 'How do you feel about receiving feedback on your work?', userResponse: '' },
    { id: '4', question: 'What motivates you most when learning something new?', userResponse: '' },
    { id: '5', question: 'Describe your ideal learning environment.', userResponse: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        const response = await apiClient.characterAnalysis.getProfile(userId);
        setExistingProfile(response.profile);
      } catch (err) {
        console.error('Failed to check existing profile:', err);
      } finally {
        setIsCheckingProfile(false);
      }
    };
    checkExistingProfile();
  }, [userId]);


  const handleResponseChange = (value: string) => {
    setQuestions(prev => prev.map((q, idx) => 
      idx === currentQuestionIndex ? { ...q, userResponse: value } : q
    ));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    if (existingProfile && onSkip) {
      onSkip();
    }
  };

  const handleSubmit = async () => {
    const allAnswered = questions.every(q => q.userResponse.trim() !== '');
    if (!allAnswered) {
      setError('Please answer all questions before submitting');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const responses = questions.map(q => ({
        question: q.question,
        response: q.userResponse
      }));

      const result = await apiClient.characterAnalysis.conductAnalysis(userId, responses);
      onComplete(result.profile);
    } catch (err: any) {
      setError(err.message || 'Failed to complete character analysis');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingProfile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#6C4DFF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Checking your profile...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const canProceed = currentQuestion.userResponse.trim() !== '';

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <h1 className="text-4xl font-light text-gray-800 mb-2">
            Character Analysis
          </h1>
          <p className="text-gray-500">
            Help us understand your learning style for a personalized experience
          </p>
        </motion.div>

        <AnimatePresence>
          {existingProfile && onSkip && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-6 p-4 rounded-xl bg-[#6C4DFF]/10 border border-[#6C4DFF]/20"
            >
              <p className="text-sm text-gray-700 mb-3">
                You already have a learning profile. You can skip this analysis and use your existing profile.
              </p>
              <motion.button
                onClick={handleSkip}
                className="text-sm text-[#6C4DFF] font-medium hover:underline"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                Skip and use existing profile →
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          className="mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#6C4DFF]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <motion.label 
              className="block text-lg font-medium text-gray-800 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {currentQuestion.question}
            </motion.label>
            <motion.textarea
              value={currentQuestion.userResponse}
              onChange={(e) => handleResponseChange(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#6C4DFF] focus:outline-none transition-colors resize-none"
              placeholder="Share your thoughts..."
              disabled={isSubmitting}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              whileFocus={{ scale: 1.01 }}
            />
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200"
            >
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          className="flex gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0 || isSubmitting}
            className="px-6 py-3 rounded-xl bg-white text-gray-700 font-medium border-2 border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={currentQuestionIndex > 0 && !isSubmitting ? { scale: 1.01, x: -2 } : {}}
            whileTap={currentQuestionIndex > 0 && !isSubmitting ? { scale: 0.99 } : {}}
          >
            Previous
          </motion.button>

          <div className="flex-1" />

          {!isLastQuestion ? (
            <motion.button
              onClick={handleNext}
              disabled={!canProceed || isSubmitting}
              className="px-6 py-3 rounded-xl bg-[#6C4DFF] text-white font-medium shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={canProceed && !isSubmitting ? { scale: 1.01, y: -1 } : {}}
              whileTap={canProceed && !isSubmitting ? { scale: 0.99 } : {}}
            >
              Next
            </motion.button>
          ) : (
            <motion.button
              onClick={handleSubmit}
              disabled={!canProceed || isSubmitting}
              className="px-6 py-3 rounded-xl bg-[#6C4DFF] text-white font-medium shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={canProceed && !isSubmitting ? { scale: 1.01, y: -1 } : {}}
              whileTap={canProceed && !isSubmitting ? { scale: 0.99 } : {}}
            >
              {isSubmitting ? 'Analyzing...' : 'Complete Analysis'}
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
