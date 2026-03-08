import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, MentorMode, RoadmapNode, Task } from '../types';
import { apiClient } from '../services';

interface LearningSessionProps {
  skillId: string;
  onBack?: () => void;
}

interface SessionState {
  sessionId: string;
  skillName: string;
  currentNode: RoadmapNode;
  masteryScore: number;
  confidenceLevel: string;
  mentorMode: MentorMode;
  messages: Message[];
  roadmapNodes: RoadmapNode[];
  stretchTask: Task | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Learning Session Interface Component
 * 
 * Provides the main learning interface during active sessions.
 * Displays skill name, mastery score, AI mentor responses, user input area,
 * mentor mode badge, and roadmap visualization.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 11.5, 14.3, 14.4, 14.5, 5.4
 */
export default function LearningSession({ skillId, onBack }: LearningSessionProps) {
  const [state, setState] = useState<SessionState>({
    sessionId: '',
    skillName: '',
    currentNode: {} as RoadmapNode,
    masteryScore: 0,
    confidenceLevel: 'medium',
    mentorMode: 'Professional',
    messages: [],
    roadmapNodes: [],
    stretchTask: null,
    isLoading: true,
    error: null
  });

  const [userInput, setUserInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interactionStartTime, setInteractionStartTime] = useState<number>(Date.now());
  const [attemptCount, setAttemptCount] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize session on mount
  useEffect(() => {
    initializeSession();
  }, [skillId]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.messages]);

  const initializeSession = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get skill details
      const skillResponse = await apiClient.skills.getSkill(skillId);
      const skill = skillResponse.skill;

      // Get roadmap
      const roadmapResponse = await apiClient.roadmaps.getRoadmap(skillId);
      const roadmap = roadmapResponse.roadmap;

      // Start session
      const sessionResponse = await apiClient.sessions.startSession(skillId);

      // Add recap as first mentor message if it exists
      const initialMessages: Message[] = [];
      if (sessionResponse.recap && sessionResponse.recap.trim()) {
        initialMessages.push({
          id: `recap-${Date.now()}`,
          sender: 'mentor',
          content: sessionResponse.recap,
          timestamp: new Date()
        });
      }

      setState(prev => ({
        ...prev,
        sessionId: sessionResponse.sessionId,
        skillName: skill.skill_name,
        currentNode: sessionResponse.currentNode,
        masteryScore: sessionResponse.masteryScore,
        confidenceLevel: sessionResponse.confidenceLevel,
        mentorMode: sessionResponse.mentorMode,
        roadmapNodes: roadmap.structure_json,
        messages: initialMessages,
        isLoading: false
      }));

      setInteractionStartTime(Date.now());
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || 'Failed to start session'
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userInput.trim() || isSubmitting) return;

    const input = userInput.trim();
    setUserInput('');
    setIsSubmitting(true);

    // Add user message to chat
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: input,
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    try {
      // Calculate performance metrics
      const responseTime = Date.now() - interactionStartTime;
      const speed = Math.max(0, Math.min(100, 100 - (responseTime / 1000) * 2)); // Faster = higher score
      const accuracy = 75; // Placeholder - would be calculated based on actual response quality

      // Send interaction to backend
      const response = await apiClient.sessions.interact(
        state.sessionId,
        input,
        accuracy,
        speed,
        attemptCount
      );

      // Add mentor response to chat
      const mentorMessage: Message = {
        id: `mentor-${Date.now()}`,
        sender: 'mentor',
        content: response.mentorResponse,
        timestamp: new Date()
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, mentorMessage],
        masteryScore: response.masteryScore,
        confidenceLevel: response.confidenceLevel,
        mentorMode: response.mentorMode,
        currentNode: response.nextNode || prev.currentNode,
        stretchTask: response.stretchTask || prev.stretchTask
      }));

      // Update roadmap nodes if next node was unlocked
      if (response.nextNode) {
        setState(prev => ({
          ...prev,
          roadmapNodes: prev.roadmapNodes.map(node =>
            node.node_id === response.nextNode?.node_id
              ? { ...node, status: 'current' as const }
              : node.node_id === prev.currentNode.node_id
              ? { ...node, status: 'completed' as const }
              : node
          )
        }));
      }

      // Reset interaction tracking
      setInteractionStartTime(Date.now());
      setAttemptCount(1);
    } catch (err: any) {
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        sender: 'mentor',
        content: `Sorry, I encountered an error: ${err.message}. Please try again.`,
        timestamp: new Date()
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage]
      }));

      setAttemptCount(prev => prev + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipStretchTask = () => {
    setState(prev => ({ ...prev, stretchTask: null }));
  };

  const handleMentorModeChange = async (mode: MentorMode) => {
    // Update local state immediately for responsive UI
    setState(prev => ({ ...prev, mentorMode: mode }));
    
    // Persist to backend
    try {
      await apiClient.sessions.updateMentorMode(state.sessionId, mode);
    } catch (err: any) {
      console.error('Error updating mentor mode:', err);
      // Optionally show a toast notification to the user
      // For now, we'll just log the error and keep the UI updated
    }
  };

  const getMentorModeColor = (mode: MentorMode): string => {
    switch (mode) {
      case 'Professional': return 'bg-blue-500';
      case 'Friendly': return 'bg-green-500';
      case 'Supportive': return 'bg-purple-500';
      case 'Challenger': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getNodeStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'current': return 'bg-[#6C4DFF]';
      case 'locked': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  };

  if (state.isLoading) {
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
          <p className="text-gray-500">Starting your learning session...</p>
        </motion.div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <motion.div
          className="text-center max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-gray-800 mb-2">Failed to Start Session</h2>
          <p className="text-gray-500 mb-6">{state.error}</p>
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header with skill name and mastery score */}
      <motion.div
        className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <motion.button
                onClick={onBack}
                className="text-gray-600 hover:text-[#6C4DFF] transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ← Back
              </motion.button>
            )}
            <div>
              <h1 className="text-2xl font-medium text-gray-800">{state.skillName}</h1>
              <p className="text-sm text-gray-500">{state.currentNode.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Mentor Mode Selector */}
            <div className="relative">
              <div className="text-xs text-gray-500 mb-1 text-center">Mentor Mode</div>
              <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                {(['Professional', 'Friendly', 'Supportive', 'Challenger'] as MentorMode[]).map((mode) => (
                  <motion.button
                    key={mode}
                    onClick={() => handleMentorModeChange(mode)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      state.mentorMode === mode
                        ? `${getMentorModeColor(mode)} text-white shadow-md`
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={`Switch to ${mode} mode`}
                  >
                    {mode}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Mastery Score */}
            <div className="text-right">
              <div className="text-sm text-gray-500">Mastery Score</div>
              <motion.div
                className="text-2xl font-bold text-[#6C4DFF]"
                key={state.masteryScore}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {Math.round(state.masteryScore)}%
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {/* Messages panel */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-4">
              <AnimatePresence>
                {state.messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ 
                      duration: 0.3,
                      ease: "easeOut"
                    }}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <motion.div
                      className={`max-w-[70%] rounded-2xl px-6 py-4 ${
                        message.sender === 'user'
                          ? 'bg-[#6C4DFF] text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                      whileHover={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-2 ${message.sender === 'user' ? 'text-purple-200' : 'text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Stretch Task Display */}
              <AnimatePresence>
                {state.stretchTask && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ 
                      duration: 0.4,
                      ease: "easeOut"
                    }}
                    className="border-2 border-[#6C4DFF] rounded-2xl p-6 bg-purple-50"
                  >
                    <motion.div 
                      className="flex items-start justify-between mb-3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="flex items-center gap-2">
                        <motion.span 
                          className="px-3 py-1 rounded-full bg-[#6C4DFF] text-white text-xs font-medium"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        >
                          Optional Challenge
                        </motion.span>
                        <span className="text-sm text-gray-600">Stretch Task</span>
                      </div>
                    </motion.div>
                    <motion.p 
                      className="text-gray-800 mb-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.15 }}
                    >
                      {state.stretchTask.description}
                    </motion.p>
                    <motion.div 
                      className="bg-white rounded-lg p-4 mb-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <p className="text-sm text-gray-600">
                        💡 This is an optional advanced challenge. You can attempt it to push your skills further, or skip it without affecting your progress.
                      </p>
                    </motion.div>
                    <motion.div 
                      className="flex gap-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.25 }}
                    >
                      <motion.button
                        onClick={handleSkipStretchTask}
                        className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Skip Challenge
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          // Focus on input area to encourage user to attempt the task
                          const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                          if (input) input.focus();
                        }}
                        className="flex-1 px-4 py-2 rounded-lg bg-[#6C4DFF] text-white font-medium hover:bg-[#5a3de6] transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Attempt Challenge
                      </motion.button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* User input area */}
          <motion.div 
            className="border-t border-gray-200 p-6 bg-white"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <motion.input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type your response..."
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 rounded-2xl border-2 border-gray-200 focus:border-[#6C4DFF] focus:outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-400"
                  whileFocus={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
                <motion.button
                  type="submit"
                  disabled={!userInput.trim() || isSubmitting}
                  className="px-8 py-4 rounded-2xl bg-[#6C4DFF] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={!isSubmitting && userInput.trim() ? { scale: 1.02, y: -2 } : {}}
                  whileTap={!isSubmitting && userInput.trim() ? { scale: 0.98 } : {}}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {isSubmitting ? 'Sending...' : 'Send'}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>

        {/* Roadmap visualization sidebar */}
        <motion.div
          className="w-80 border-l border-gray-200 p-6 overflow-y-auto bg-gray-50"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-medium text-gray-800 mb-4">Learning Path</h2>
          <div className="space-y-3">
            {state.roadmapNodes.map((node, index) => (
              <motion.div
                key={node.node_id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  delay: index * 0.05,
                  duration: 0.3,
                  ease: "easeOut"
                }}
                className={`p-4 rounded-xl border-2 ${
                  node.status === 'current'
                    ? 'border-[#6C4DFF] bg-white'
                    : node.status === 'completed'
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-white opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <motion.div 
                    className={`w-6 h-6 rounded-full ${getNodeStatusColor(node.status)} flex items-center justify-center flex-shrink-0 mt-0.5`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      delay: index * 0.05 + 0.1,
                      type: "spring",
                      stiffness: 200,
                      damping: 15
                    }}
                  >
                    {node.status === 'completed' && (
                      <motion.svg 
                        className="w-4 h-4 text-white" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: index * 0.05 + 0.2, duration: 0.3 }}
                      >
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </motion.svg>
                    )}
                    {node.status === 'current' && (
                      <motion.div 
                        className="w-2 h-2 rounded-full bg-white"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                    {node.status === 'locked' && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-800 truncate">{node.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{node.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
