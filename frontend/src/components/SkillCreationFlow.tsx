import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skill, PersonalityProfile } from '../types';
import { apiClient } from '../services';
import CharacterAnalysis from './CharacterAnalysis';

interface SkillCreationFlowProps {
  userId: string;
  onComplete: (skillId: string) => void;
  onCancel?: () => void;
}

interface SkillFormData {
  skillName: string;
  goal: string;
  timeline: number;
}

type FlowStep = 'form' | 'character-analysis' | 'generating-roadmap';

/**
 * Skill Creation Flow Component
 * 
 * Handles the complete skill creation process:
 * 1. Skill information form
 * 2. Character analysis check and optional skip
 * 3. Roadmap generation
 * 
 * Requirements: 2.1, 2.3, 2.4, 3.1, 3.2, 3.4, 3.5
 */
export default function SkillCreationFlow({ userId, onComplete, onCancel }: SkillCreationFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>('form');
  const [formData, setFormData] = useState<SkillFormData>({
    skillName: '',
    goal: '',
    timeline: 30
  });
  
  const [createdSkill, setCreatedSkill] = useState<Skill | null>(null);
  const [personalityProfile, setPersonalityProfile] = useState<PersonalityProfile | null>(null);
  const [needsCharacterAnalysis, setNeedsCharacterAnalysis] = useState(false);
  const [errors, setErrors] = useState<Partial<SkillFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Validate form inputs
   * Requirements: 3.2
   */
  const validateForm = (): boolean => {
    const newErrors: Partial<SkillFormData> = {};

    // Validate skill name - must be non-empty and not just whitespace
    if (!formData.skillName || formData.skillName.trim() === '') {
      newErrors.skillName = 'Skill name cannot be empty';
    }

    // Validate goal - should have some content
    if (!formData.goal || formData.goal.trim() === '') {
      newErrors.goal = 'Please describe your learning goal';
    }

    // Validate timeline - must be positive
    if (!formData.timeline || formData.timeline <= 0 || isNaN(formData.timeline)) {
      newErrors.timeline = 'Timeline must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Check for existing personality profile on mount
   * Requirements: 2.3
   */
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const response = await apiClient.characterAnalysis.getProfile(userId);
        if (response.profile) {
          setPersonalityProfile(response.profile);
        }
      } catch (err) {
        console.error('Failed to check personality profile:', err);
      }
    };
    checkProfile();
  }, [userId]);

  /**
   * Handle form submission
   * Requirements: 3.1, 3.2, 3.3
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the skill
      const response = await apiClient.skills.createSkill(
        formData.skillName,
        formData.goal,
        formData.timeline
      );

      setCreatedSkill(response.skill);

      // Check if character analysis is needed
      // Requirements: 2.1
      if (response.needsCharacterAnalysis && !personalityProfile) {
        setNeedsCharacterAnalysis(true);
        setCurrentStep('character-analysis');
      } else {
        // Use existing profile or proceed without analysis
        await generateRoadmap(response.skill, personalityProfile);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create skill');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle character analysis completion
   * Requirements: 2.2, 2.5
   */
  const handleCharacterAnalysisComplete = async (profile: PersonalityProfile) => {
    setPersonalityProfile(profile);
    if (createdSkill) {
      await generateRoadmap(createdSkill, profile);
    }
  };

  /**
   * Handle character analysis skip
   * Requirements: 2.4
   */
  const handleCharacterAnalysisSkip = async () => {
    if (createdSkill && personalityProfile) {
      await generateRoadmap(createdSkill, personalityProfile);
    }
  };

  /**
   * Generate roadmap for the skill
   * Requirements: 3.4, 3.5
   */
  const generateRoadmap = async (skill: Skill, profile: PersonalityProfile | null) => {
    setCurrentStep('generating-roadmap');
    setError(null);

    try {
      // If no profile exists, use a default one
      const profileToUse = profile || {
        user_id: userId,
        tone_type: 'Professional',
        confidence_level: 'medium',
        motivation_index: 50
      };

      await apiClient.roadmaps.generateRoadmap(
        skill.id,
        skill.skill_name,
        skill.goal,
        skill.timeline,
        profileToUse
      );

      // Complete the flow
      onComplete(skill.id);
    } catch (err: any) {
      setError(err.message || 'Failed to generate roadmap');
      setCurrentStep('form');
    }
  };

  /**
   * Handle input changes
   */
  const handleChange = (field: keyof SkillFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Render character analysis step
  if (currentStep === 'character-analysis') {
    return (
      <CharacterAnalysis
        userId={userId}
        onComplete={handleCharacterAnalysisComplete}
        onSkip={personalityProfile ? handleCharacterAnalysisSkip : undefined}
      />
    );
  }

  // Render roadmap generation step
  if (currentStep === 'generating-roadmap') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-24 h-24 border-4 border-[#6C4DFF] border-t-transparent rounded-full mx-auto mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <h2 className="text-2xl font-light text-gray-800 mb-2">
            Creating Your Learning Roadmap
          </h2>
          <p className="text-gray-500">
            AI is personalizing your learning journey...
          </p>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 max-w-md mx-auto"
            >
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  // Render form step
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <h1 className="text-4xl font-light text-gray-800 mb-2">
            Create New Skill
          </h1>
          <p className="text-gray-500">
            Define your learning goal and let AI create a personalized roadmap
          </p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Skill Name Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <label 
              htmlFor="skillName" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Skill Name
            </label>
            <motion.input
              id="skillName"
              type="text"
              value={formData.skillName}
              onChange={(e) => handleChange('skillName', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border-2 ${
                errors.skillName 
                  ? 'border-red-400 focus:border-red-500' 
                  : 'border-gray-200 focus:border-[#6C4DFF]'
              } focus:outline-none transition-colors`}
              placeholder="e.g., Python Programming, Guitar, Public Speaking"
              disabled={isSubmitting}
              whileFocus={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
            <AnimatePresence>
              {errors.skillName && (
                <motion.p 
                  className="mt-1 text-sm text-red-500"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                >
                  {errors.skillName}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Goal Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <label 
              htmlFor="goal" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Learning Goal
            </label>
            <motion.textarea
              id="goal"
              value={formData.goal}
              onChange={(e) => handleChange('goal', e.target.value)}
              rows={4}
              className={`w-full px-4 py-3 rounded-xl border-2 ${
                errors.goal 
                  ? 'border-red-400 focus:border-red-500' 
                  : 'border-gray-200 focus:border-[#6C4DFF]'
              } focus:outline-none transition-colors resize-none`}
              placeholder="Describe what you want to achieve with this skill..."
              disabled={isSubmitting}
              whileFocus={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
            <AnimatePresence>
              {errors.goal && (
                <motion.p 
                  className="mt-1 text-sm text-red-500"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                >
                  {errors.goal}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Timeline Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <label 
              htmlFor="timeline" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Timeline (days)
            </label>
            <motion.input
              id="timeline"
              type="number"
              min="1"
              value={formData.timeline}
              onChange={(e) => handleChange('timeline', parseInt(e.target.value) || 0)}
              className={`w-full px-4 py-3 rounded-xl border-2 ${
                errors.timeline 
                  ? 'border-red-400 focus:border-red-500' 
                  : 'border-gray-200 focus:border-[#6C4DFF]'
              } focus:outline-none transition-colors`}
              placeholder="30"
              disabled={isSubmitting}
              whileFocus={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
            <AnimatePresence>
              {errors.timeline && (
                <motion.p 
                  className="mt-1 text-sm text-red-500"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                >
                  {errors.timeline}
                </motion.p>
              )}
            </AnimatePresence>
            <p className="mt-1 text-sm text-gray-500">
              How many days do you plan to work on this skill?
            </p>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-xl bg-red-50 border border-red-200"
              >
                <p className="text-sm text-red-600">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <motion.div 
            className="flex gap-4 pt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            {onCancel && (
              <motion.button
                type="button"
                onClick={onCancel}
                className="flex-1 px-6 py-3 rounded-xl bg-white text-gray-700 font-medium border-2 border-gray-200 hover:border-gray-300 transition-colors"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                disabled={isSubmitting}
              >
                Cancel
              </motion.button>
            )}
            
            <motion.button
              type="submit"
              className="flex-1 px-6 py-3 rounded-xl bg-[#6C4DFF] text-white font-medium shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={!isSubmitting ? { scale: 1.01, y: -1 } : {}}
              whileTap={!isSubmitting ? { scale: 0.99 } : {}}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Skill'}
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
