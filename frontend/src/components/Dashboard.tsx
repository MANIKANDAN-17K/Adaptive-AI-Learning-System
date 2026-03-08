import { motion } from 'framer-motion';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
  user: User;
  onCreateSkill: () => void;
  onOpenLibrary: () => void;
}

/**
 * Dashboard Component
 * 
 * Main dashboard view with violet glowing power button as the primary visual element.
 * Provides navigation to "Create New Skill" and "Library" views.
 * 
 * Requirements: 7.1, 7.2, 7.5, 7.6
 */
export default function Dashboard({ user, onCreateSkill, onOpenLibrary }: DashboardProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      {/* Logout button in top right */}
      <motion.button
        onClick={handleLogout}
        className="absolute top-8 right-8 px-4 py-2 text-gray-600 hover:text-[#6C4DFF] transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Logout
      </motion.button>

      {/* Welcome Section */}
      <motion.div 
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.h1 
          className="text-4xl font-light text-gray-800 mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Welcome back, {user.name}
        </motion.h1>
        <motion.p 
          className="text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Your adaptive learning journey continues
        </motion.p>
      </motion.div>

      {/* Violet Glowing Power Button */}
      <motion.div
        className="relative mb-16"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Outer glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-[#6C4DFF] blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Middle glow layer */}
        <motion.div
          className="absolute inset-0 rounded-full bg-[#6C4DFF] blur-2xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />

        {/* Power button */}
        <motion.button
          className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[#6C4DFF] to-[#5A3DD9] shadow-2xl flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {/* Power icon */}
          <svg
            className="w-16 h-16 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </motion.button>
      </motion.div>

      {/* Navigation Options */}
      <motion.div 
        className="flex gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        {/* Create New Skill Button */}
        <motion.button
          onClick={onCreateSkill}
          className="px-8 py-4 rounded-2xl bg-[#6C4DFF] text-white font-medium shadow-lg hover:shadow-xl transition-shadow"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          Create New Skill
        </motion.button>

        {/* Library Button */}
        <motion.button
          onClick={onOpenLibrary}
          className="px-8 py-4 rounded-2xl bg-white text-[#6C4DFF] font-medium border-2 border-[#6C4DFF] shadow-lg hover:shadow-xl transition-shadow"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          Library
        </motion.button>
      </motion.div>

      {/* Subtle footer */}
      <motion.div 
        className="mt-16 text-center text-gray-400 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <p>Adaptive AI Skill Mentor</p>
      </motion.div>
    </div>
  );
}
