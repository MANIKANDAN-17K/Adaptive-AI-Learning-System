import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Skill } from '../types';
import { apiClient } from '../services';

interface LibraryProps {
  userId: string;
  onSkillSelect: (skillId: string) => void;
  onBack?: () => void;
}

interface SkillCardData extends Skill {
  progressPercentage: number;
  masteryLevel: number;
  lastSessionDate: string;
}

/**
 * Library View Component
 * 
 * Displays all user skills in a grid layout with progress metrics.
 * Allows users to select a skill to resume learning.
 * 
 * Requirements: 6.1, 6.2, 6.3
 */
export default function Library({ userId, onSkillSelect, onBack }: LibraryProps) {
  const [skills, setSkills] = useState<SkillCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSkills = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.skills.getUserSkills(userId);
        setSkills(response.skills);
      } catch (err: any) {
        setError(err.message || 'Failed to load skills');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSkills();
  }, [userId]);

  const handleSkillClick = (skillId: string) => {
    onSkillSelect(skillId);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getMasteryInfo = (level: number): { label: string; color: string } => {
    if (level >= 80) return { label: 'Expert', color: 'text-green-600' };
    if (level >= 60) return { label: 'Advanced', color: 'text-blue-600' };
    if (level >= 40) return { label: 'Intermediate', color: 'text-yellow-600' };
    if (level >= 20) return { label: 'Beginner', color: 'text-orange-600' };
    return { label: 'Starting', color: 'text-gray-600' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-[#6C4DFF] border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-gray-500">Loading your skills...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <motion.div
          className="text-center max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-gray-800 mb-2">
            Failed to Load Skills
          </h2>
          <p className="text-gray-500 mb-6">{error}</p>
          {onBack && (
            <motion.button
              onClick={onBack}
              className="px-6 py-3 rounded-xl bg-[#6C4DFF] text-white font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Go Back
            </motion.button>
          )}
        </motion.div>
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <motion.div
          className="text-center max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-24 h-24 rounded-full bg-[#6C4DFF] bg-opacity-10 flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-[#6C4DFF]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-light text-gray-800 mb-2">
            No Skills Yet
          </h2>
          <p className="text-gray-500 mb-6">
            Start your learning journey by creating your first skill
          </p>
          {onBack && (
            <motion.button
              onClick={onBack}
              className="px-6 py-3 rounded-xl bg-[#6C4DFF] text-white font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Create Your First Skill
            </motion.button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-light text-gray-800">
              Your Skills Library
            </h1>
            {onBack && (
              <motion.button
                onClick={onBack}
                className="px-4 py-2 rounded-xl text-gray-600 hover:text-[#6C4DFF] transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ← Back to Dashboard
              </motion.button>
            )}
          </div>
          <p className="text-gray-500">
            {skills.length} {skills.length === 1 ? 'skill' : 'skills'} in progress
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {skills.map((skill, index) => {
            const masteryInfo = getMasteryInfo(skill.masteryLevel);
            
            return (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: index * 0.08,
                  duration: 0.4,
                  ease: "easeOut"
                }}
              >
                <motion.button
                  onClick={() => handleSkillClick(skill.id)}
                  className="w-full text-left p-6 rounded-2xl bg-white border-2 border-gray-200 hover:border-[#6C4DFF] transition-colors shadow-sm hover:shadow-lg"
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <motion.h3 
                    className="text-xl font-medium text-gray-800 mb-2 truncate"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.08 + 0.1 }}
                  >
                    {skill.skill_name}
                  </motion.h3>

                  <motion.p 
                    className="text-sm text-gray-500 mb-4 line-clamp-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.08 + 0.15 }}
                  >
                    {skill.goal}
                  </motion.p>

                  <motion.div 
                    className="mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.08 + 0.2 }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">Progress</span>
                      <span className="text-xs font-medium text-[#6C4DFF]">
                        {Math.round(skill.progressPercentage)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#6C4DFF] to-[#5A3DD9]"
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.progressPercentage}%` }}
                        transition={{ 
                          duration: 0.8, 
                          delay: index * 0.08 + 0.3,
                          ease: "easeOut"
                        }}
                      />
                    </div>
                  </motion.div>

                  <motion.div 
                    className="flex items-center justify-between mb-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.08 + 0.25 }}
                  >
                    <span className="text-xs text-gray-600">Mastery Level</span>
                    <span className={`text-sm font-medium ${masteryInfo.color}`}>
                      {masteryInfo.label}
                    </span>
                  </motion.div>

                  <motion.div 
                    className="flex items-center text-xs text-gray-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.08 + 0.3 }}
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Last practiced {formatDate(skill.lastSessionDate)}
                  </motion.div>
                </motion.button>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
