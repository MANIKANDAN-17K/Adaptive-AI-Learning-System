import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MentorMode, RoadmapNode, Task } from '../types';
import { apiClient } from '../services';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type LearningPhase =
  | 'loading' | 'intro' | 'concept'
  | 'question_loading' | 'question'
  | 'evaluating' | 'feedback'
  | 'node_complete' | 'session_complete' | 'error';

type Difficulty = 'simplified' | 'standard' | 'advanced';

interface FeedbackState {
  response: string;
  isPositive: boolean;
  masteryBefore: number;
  masteryAfter: number;
  hint?: string;
}

interface SessionStats {
  correct: number;
  incorrect: number;
  streak: number;
  totalAttempts: number;
}

interface LearningSessionState {
  sessionId: string;
  skillName: string;
  currentNode: RoadmapNode;
  masteryScore: number;
  confidenceLevel: string;
  mentorMode: MentorMode;
  roadmapNodes: RoadmapNode[];
  recap: string;
  stretchTask: Task | null;
}

interface LearningSessionProps {
  skillId: string;
  onBack?: () => void;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function parseResponseSentiment(text: string): boolean {
  const lower = text.toLowerCase();
  const pos = ['correct','right','excellent','great job','well done','exactly','perfect','spot on','good answer','absolutely',"that's right",'yes,','yes!','accurate','impressive','nicely done'];
  const neg = ['incorrect','wrong','not quite','unfortunately','actually',"that's not",'not exactly','close but','let me clarify','not right'];
  return pos.filter(s => lower.includes(s)).length > neg.filter(s => lower.includes(s)).length;
}

function getMasteryColor(score: number) {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#6C4DFF';
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
}

function getDifficultyInfo(d: Difficulty) {
  if (d === 'simplified') return { label: 'Beginner', color: '#10B981', bg: '#f0fdf4', icon: '🌱' };
  if (d === 'advanced')   return { label: 'Advanced', color: '#EF4444', bg: '#fff5f5', icon: '🔥' };
  return                         { label: 'Standard', color: '#6C4DFF', bg: '#ede9ff', icon: '⚡' };
}

// ─────────────────────────────────────────────
// CircleProgress
// ─────────────────────────────────────────────
function CircleProgress({ value, size = 80 }: { value: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = getMasteryColor(value);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#ede9ff" strokeWidth={9} />
      <motion.circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={9} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: 'easeOut' }}
        style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fontSize={size * 0.2} fontWeight="800" fill={color}
        fontFamily="'Nunito', sans-serif">
        {Math.round(value)}%
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function LearningSession({ skillId, onBack }: LearningSessionProps) {
  const [session, setSession] = useState<LearningSessionState | null>(null);
  const [phase, setPhase] = useState<LearningPhase>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [stats, setStats] = useState<SessionStats>({ correct: 0, incorrect: 0, streak: 0, totalAttempts: 0 });
  const [difficulty, setDifficulty] = useState<Difficulty>('standard');
  const [interactionStart, setInteractionStart] = useState(Date.now());
  const [attemptCount, setAttemptCount] = useState(1);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [questionIndex, setQuestionIndex] = useState(0);

  useEffect(() => { initializeSession(); }, [skillId]);

  const initializeSession = async () => {
    setPhase('loading');
    try {
      const [skillRes, roadmapRes, sessionRes] = await Promise.all([
        apiClient.skills.getSkill(skillId),
        apiClient.roadmaps.getRoadmap(skillId),
        apiClient.sessions.startSession(skillId)
      ]);
      setSession({
        sessionId: sessionRes.sessionId,
        skillName: skillRes.skill.skill_name,
        currentNode: sessionRes.currentNode,
        masteryScore: sessionRes.masteryScore ?? 0,
        confidenceLevel: sessionRes.confidenceLevel,
        mentorMode: sessionRes.mentorMode,
        roadmapNodes: roadmapRes.roadmap.structure_json,
        recap: sessionRes.recap || '',
        stretchTask: null,
      });
      const m = sessionRes.masteryScore ?? 0;
      setDifficulty(m > 75 ? 'advanced' : m > 40 ? 'standard' : 'simplified');
      setPhase('intro');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to start session');
      setPhase('error');
    }
  };

  const generateQuestion = useCallback(async () => {
    if (!session) return;
    setPhase('question_loading');
    setAttemptCount(1);
    setInteractionStart(Date.now());
    try {
      const dHint = difficulty === 'simplified' ? 'beginner-level' : difficulty === 'advanced' ? 'advanced, nuanced' : 'standard';
      const prompt = `I studied: "${session.currentNode.title}" - ${session.currentNode.description}. Ask ONE concise ${dHint} quiz question. Return ONLY the question, no preamble.`;
      const res = await apiClient.sessions.interact(session.sessionId, prompt, 100, 100, 1);
      setCurrentQuestion(res.mentorResponse || `What is the key concept behind ${session.currentNode.title}?`);
      setUserAnswer('');
      setPhase('question');
    } catch {
      setCurrentQuestion(`Explain the key concept behind: ${session.currentNode.title}`);
      setPhase('question');
    }
  }, [session, difficulty]);

  const submitAnswer = async () => {
    if (!session || !userAnswer.trim()) return;
    setPhase('evaluating');
    const masteryBefore = session.masteryScore;
    const speed = Math.max(20, Math.min(100, 100 - ((Date.now() - interactionStart) / 1000) * 2));
    try {
      const prompt = `Question: ${currentQuestion}\nStudent's answer: "${userAnswer}"\nEvaluate. Start with "CORRECT:" or "INCORRECT:" then 2-3 sentence explanation.`;
      const res = await apiClient.sessions.interact(session.sessionId, prompt, 75, speed, attemptCount);
      const responseText = res.mentorResponse || '';
      const masteryAfter = res.masteryScore ?? masteryBefore;
      const isPositive = (masteryAfter - masteryBefore) > 1 ? true : parseResponseSentiment(responseText);
      setFeedback({ response: responseText, isPositive, masteryBefore, masteryAfter, hint: isPositive ? undefined : `Review: ${session.currentNode.description}` });
      setStats(prev => ({ correct: prev.correct + (isPositive ? 1 : 0), incorrect: prev.incorrect + (isPositive ? 0 : 1), streak: isPositive ? prev.streak + 1 : 0, totalAttempts: prev.totalAttempts + 1 }));
      setSession(prev => {
        if (!prev) return prev;
        const updatedNodes = res.nextNode
          ? prev.roadmapNodes.map(n => n.node_id === res.nextNode?.node_id ? { ...n, status: 'current' as const } : n.node_id === prev.currentNode.node_id ? { ...n, status: 'completed' as const } : n)
          : prev.roadmapNodes;
        return { ...prev, masteryScore: masteryAfter, confidenceLevel: res.confidenceLevel ?? prev.confidenceLevel, roadmapNodes: updatedNodes, currentNode: res.nextNode || prev.currentNode, stretchTask: res.stretchTask || prev.stretchTask };
      });
      if (isPositive) setDifficulty(masteryAfter > 75 ? 'advanced' : masteryAfter > 40 ? 'standard' : 'standard');
      else if (masteryAfter < 40) setDifficulty('simplified');
      setPhase('feedback');
      setQuestionIndex(prev => prev + 1);
    } catch {
      setFeedback({ response: 'An error occurred. Please try again.', isPositive: false, masteryBefore, masteryAfter: masteryBefore });
      setPhase('feedback');
    }
  };

  const handleContinueAfterFeedback = () => {
    if (!session || !feedback) return;
    const nodeComplete = session.masteryScore >= (session.currentNode.mastery_threshold ?? 75);
    const isLast = session.roadmapNodes.filter(n => n.status !== 'completed' && n.node_id !== session.currentNode.node_id).length === 0;
    if (feedback.isPositive && nodeComplete) { setPhase(isLast ? 'session_complete' : 'node_complete'); }
    else { setAttemptCount(1); setPhase('concept'); }
  };

  const handleMentorModeChange = async (mode: MentorMode) => {
    if (!session) return;
    setSession(prev => prev ? { ...prev, mentorMode: mode } : prev);
    try { await apiClient.sessions.updateMentorMode(session.sessionId, mode); } catch { /* ignore */ }
  };

  // ─────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────
  if (phase === 'loading') return (
    <div style={{ minHeight: '100vh', background: '#faf9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap');`}</style>
      <motion.div style={{ textAlign: 'center', background: 'white', borderRadius: 24, padding: '48px 56px', border: '1.5px solid #ede9ff', boxShadow: '0 8px 40px rgba(108,77,255,0.1)' }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <motion.div style={{ width: 52, height: 52, border: '4px solid #ede9ff', borderTopColor: '#6C4DFF', borderRadius: '50%', margin: '0 auto 20px' }} animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
        <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: '#2d1f6e', marginBottom: 6 }}>Preparing Your Session</p>
        <p style={{ color: '#b0a4e0', fontSize: 13, fontWeight: 500 }}>Setting up your personalised learning environment…</p>
      </motion.div>
    </div>
  );

  if (phase === 'error') return (
    <div style={{ minHeight: '100vh', background: '#faf9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Nunito', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap');`}</style>
      <motion.div style={{ textAlign: 'center', maxWidth: 400, background: 'white', borderRadius: 24, padding: 48, border: '1.5px solid #ede9ff', boxShadow: '0 8px 40px rgba(108,77,255,0.1)' }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: '#fff5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="26" height="26" fill="none" stroke="#ef4444" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: '#2d1f6e', marginBottom: 8 }}>Session Failed</h2>
        <p style={{ color: '#9585cc', fontSize: 13, marginBottom: 28 }}>{errorMsg}</p>
        {onBack && <motion.button onClick={onBack} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ padding: '12px 28px', borderRadius: 50, border: 'none', background: 'linear-gradient(135deg, #6C4DFF, #5A3FE6)', color: 'white', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", boxShadow: '0 6px 20px rgba(108,77,255,0.35)' }}>Go Back</motion.button>}
      </motion.div>
    </div>
  );

  if (!session) return null;

  const completedNodes = session.roadmapNodes.filter(n => n.status === 'completed').length;
  const totalNodes = session.roadmapNodes.length;
  const overallProgress = totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0;
  const accuracy = stats.totalAttempts > 0 ? Math.round((stats.correct / stats.totalAttempts) * 100) : 0;
  const diffInfo = getDifficultyInfo(difficulty);

  // ─────────────────────────────────────────────
  // MAIN LAYOUT
  // ─────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', background: '#faf9ff', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ddd6fe; border-radius: 99px; }

        .nav-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 50px;
          border: none; background: transparent;
          font-family: 'Nunito', sans-serif;
          font-size: 12.5px; font-weight: 700;
          color: #7c6bc4; cursor: pointer;
          transition: all 0.2s;
        }
        .nav-btn:hover { background: #ede9ff; color: #6C4DFF; }

        .mode-pill {
          padding: 5px 11px; border-radius: 50px;
          font-family: 'Nunito', sans-serif;
          font-size: 11px; font-weight: 800;
          cursor: pointer; transition: all 0.18s;
          border: 1.5px solid transparent;
        }
        .mode-pill.active { background: #6C4DFF; color: white; box-shadow: 0 3px 10px rgba(108,77,255,0.3); }
        .mode-pill.inactive { color: #9585cc; border-color: #ede9ff; background: white; }
        .mode-pill.inactive:hover { border-color: #6C4DFF; color: #6C4DFF; }

        .sidebar-node {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 12px; border-radius: 14px; margin-bottom: 4px;
          cursor: default; transition: background 0.15s;
          border: 1.5px solid transparent;
        }
        .sidebar-node.current { background: #ede9ff; border-color: rgba(108,77,255,0.25); }
        .sidebar-node.completed { background: #f0fdf4; }
        .sidebar-node.locked { opacity: 0.45; }
        .sidebar-node.pending:hover { background: #faf9ff; }

        .answer-textarea {
          width: 100%; padding: 14px 16px;
          border-radius: 14px; border: 1.5px solid #ddd6fe;
          background: #faf9ff; font-size: 14px;
          color: #2d1f6e; outline: none; resize: none;
          font-family: 'Nunito', sans-serif; font-weight: 500;
          line-height: 1.65; transition: all 0.2s;
        }
        .answer-textarea::placeholder { color: #c4b8e8; }
        .answer-textarea:focus { border-color: #6C4DFF; background: white; box-shadow: 0 0 0 4px rgba(108,77,255,0.09); }

        .primary-action-btn {
          width: 100%; padding: 14px; border-radius: 14px; border: none;
          background: linear-gradient(135deg, #6C4DFF, #5A3FE6);
          color: white; font-family: 'Nunito', sans-serif;
          font-size: 13.5px; font-weight: 800; cursor: pointer;
          box-shadow: 0 6px 20px rgba(108,77,255,0.32);
          transition: all 0.22s ease;
        }
        .primary-action-btn:hover:not(:disabled) { box-shadow: 0 10px 30px rgba(108,77,255,0.45); transform: translateY(-1px); }
        .primary-action-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

        .secondary-action-btn {
          width: 100%; padding: 13px; border-radius: 14px;
          border: 1.5px solid #ddd6fe; background: white;
          color: #7c6bc4; font-family: 'Nunito', sans-serif;
          font-size: 13px; font-weight: 700; cursor: pointer;
          transition: all 0.2s;
        }
        .secondary-action-btn:hover { border-color: #6C4DFF; color: #6C4DFF; background: #faf9ff; }

        .stat-box {
          background: #faf9ff; border: 1.5px solid #ede9ff;
          border-radius: 12px; padding: 12px 14px; text-align: center;
        }

        .section-label {
          font-size: 10.5px; font-weight: 800; letter-spacing: 0.12em;
          text-transform: uppercase; color: #b0a4e0; margin-bottom: 10px;
        }

        .content-card {
          background: white; border-radius: 20px;
          border: 1.5px solid #ede9ff;
          box-shadow: 0 2px 16px rgba(108,77,255,0.06);
          padding: 24px;
        }

        .feedback-correct { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1.5px solid #86efac; border-radius: 16px; padding: 18px; }
        .feedback-incorrect { background: linear-gradient(135deg, #fff5f5, #fee2e2); border: 1.5px solid #fca5a5; border-radius: 16px; padding: 18px; }
      `}</style>

      {/* ══════════ NAVBAR ══════════ */}
      <header style={{ height: 60, background: 'white', borderBottom: '1px solid #ede9ff', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, boxShadow: '0 1px 16px rgba(108,77,255,0.06)', zIndex: 20 }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onBack && (
            <button className="nav-btn" onClick={onBack}>
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
              Back
            </button>
          )}
          <div style={{ width: 1, height: 22, background: '#ede9ff' }} />
          {/* Logo */}
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg, #6C4DFF, #5A3FE6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(108,77,255,0.3)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" height="17px" viewBox="0 -960 960 960" width="17px" fill="white">
              <path d="M200-120q-33 0-56.5-23.5T120-200v-400q0-100 70-170t170-70h240q100 0 170 70t70 170v400q0 33-23.5 56.5T760-120H200Zm0-80h560v-400q0-66-47-113t-113-47H360q-66 0-113 47t-47 113v400Zm103.5-303.5Q280-527 280-560t23.5-56.5Q327-640 360-640t56.5 23.5Q440-593 440-560t-23.5 56.5Q393-480 360-480t-56.5-23.5Zm240 0Q520-527 520-560t23.5-56.5Q567-640 600-640t56.5 23.5Q680-593 680-560t-23.5 56.5Q633-480 600-480t-56.5-23.5ZM280-200v-80q0-33 23.5-56.5T360-360h240q33 0 56.5 23.5T680-280v80h-80v-80h-80v80h-80v-80h-80v80h-80Zm-80 0h560-560Z"/>
            </svg>
          </div>
          <div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: '#2d1f6e' }}>{session.skillName}</span>
            <span style={{ color: '#b0a4e0', fontSize: 12, marginLeft: 8, fontWeight: 500 }}>/ {session.currentNode.title}</span>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Difficulty badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 50, background: diffInfo.bg, border: `1.5px solid ${diffInfo.color}30` }}>
            <span style={{ fontSize: 12 }}>{diffInfo.icon}</span>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: diffInfo.color }}>{diffInfo.label}</span>
          </div>

          {/* Mentor mode selector */}
          <div style={{ display: 'flex', gap: 4, background: '#faf9ff', borderRadius: 50, padding: '3px', border: '1.5px solid #ede9ff' }}>
            {(['Professional', 'Friendly', 'Supportive', 'Challenger'] as MentorMode[]).map(mode => (
              <button key={mode} className={`mode-pill ${session.mentorMode === mode ? 'active' : 'inactive'}`} onClick={() => handleMentorModeChange(mode)}>
                {mode.slice(0, 4)}
              </button>
            ))}
          </div>

          {/* Streak */}
          <AnimatePresence>
            {stats.streak >= 2 && (
              <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}
                style={{ padding: '4px 11px', borderRadius: 50, background: '#fff7ed', border: '1.5px solid #fed7aa', fontSize: 11.5, fontWeight: 800, color: '#c2410c' }}>
                🔥 {stats.streak} streak
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mastery pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 13px', borderRadius: 50, background: '#ede9ff', border: '1.5px solid rgba(108,77,255,0.2)' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: getMasteryColor(session.masteryScore) }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: '#2d1f6e' }}>
              Mastery <motion.span key={session.masteryScore} initial={{ scale: 1.3 }} animate={{ scale: 1 }} style={{ color: '#6C4DFF' }}>{Math.round(session.masteryScore)}%</motion.span>
            </span>
          </div>

          {/* Toggle right panel */}
          <button className="nav-btn" onClick={() => setRightPanelOpen(p => !p)} style={{ padding: '7px', borderRadius: 10 }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/>
            </svg>
          </button>
        </div>
      </header>

      {/* ══════════ 3-PANEL BODY ══════════ */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── LEFT SIDEBAR ── */}
        <aside style={{ width: 252, background: 'white', borderRight: '1px solid #ede9ff', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
          {/* Progress header */}
          <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid #ede9ff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#2d1f6e', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Course Modules</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#b0a4e0' }}>{completedNodes}/{totalNodes}</span>
            </div>
            {/* Overall bar */}
            <div style={{ height: 6, background: '#ede9ff', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div style={{ height: '100%', background: 'linear-gradient(90deg, #6C4DFF, #8B5CF6)', borderRadius: 99 }}
                initial={{ width: 0 }} animate={{ width: `${overallProgress}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
            </div>
            <div style={{ marginTop: 5, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10.5, color: '#b0a4e0', fontWeight: 600 }}>{Math.round(overallProgress)}% complete</span>
              <span style={{ fontSize: 10.5, color: '#b0a4e0', fontWeight: 600 }}>{totalNodes - completedNodes} left</span>
            </div>
          </div>

          {/* Modules list */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
            {session.roadmapNodes.map((node, idx) => {
              const isCurrent = node.node_id === session.currentNode.node_id;
              const isCompleted = node.status === 'completed';
              const isLocked = node.status === 'locked';
              return (
                <motion.div key={node.node_id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`sidebar-node ${isCurrent ? 'current' : isCompleted ? 'completed' : isLocked ? 'locked' : 'pending'}`}
                >
                  {/* Status dot */}
                  <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1, background: isCompleted ? '#10B981' : isCurrent ? '#6C4DFF' : '#ede9ff', boxShadow: isCurrent ? '0 3px 10px rgba(108,77,255,0.3)' : 'none' }}>
                    {isCompleted ? (
                      <svg width="12" height="12" fill="white" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    ) : isCurrent ? (
                      <motion.div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
                    ) : isLocked ? (
                      <svg width="10" height="10" fill="#b0a4e0" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#b0a4e0' }}>{idx + 1}</span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 800, color: isCurrent ? '#6C4DFF' : isCompleted ? '#059669' : '#2d1f6e', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {node.title}
                    </p>
                    <p style={{ fontSize: 10.5, color: '#b0a4e0', fontWeight: 500, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {node.description.length > 55 ? node.description.substring(0, 55) + '…' : node.description}
                    </p>
                    {isCurrent && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 10, color: '#b0a4e0', fontWeight: 600 }}>Mastery</span>
                          <span style={{ fontSize: 10, fontWeight: 800, color: getMasteryColor(session.masteryScore) }}>{Math.round(session.masteryScore)}% / {node.mastery_threshold}%</span>
                        </div>
                        <div style={{ height: 4, background: '#ede9ff', borderRadius: 99, overflow: 'hidden' }}>
                          <motion.div style={{ height: '100%', background: getMasteryColor(session.masteryScore), borderRadius: 99 }}
                            animate={{ width: `${Math.min(100, (session.masteryScore / (node.mastery_threshold ?? 75)) * 100)}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }} />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </nav>
        </aside>

        {/* ══════════ CENTER PANEL ══════════ */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', maxWidth: 660 }}>
            <AnimatePresence mode="wait">

              {/* ── INTRO ── */}
              {phase === 'intro' && (
                <motion.div key="intro" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {/* Welcome card */}
                  <div className="content-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #6C4DFF, #5A3FE6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(108,77,255,0.3)' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" height="26px" viewBox="0 -960 960 960" width="26px" fill="white">
                          <path d="M200-120q-33 0-56.5-23.5T120-200v-400q0-100 70-170t170-70h240q100 0 170 70t70 170v400q0 33-23.5 56.5T760-120H200Zm0-80h560v-400q0-66-47-113t-113-47H360q-66 0-113 47t-47 113v400Zm103.5-303.5Q280-527 280-560t23.5-56.5Q327-640 360-640t56.5 23.5Q440-593 440-560t-23.5 56.5Q393-480 360-480t-56.5-23.5Zm240 0Q520-527 520-560t23.5-56.5Q567-640 600-640t56.5 23.5Q680-593 680-560t-23.5 56.5Q633-480 600-480t-56.5-23.5ZM280-200v-80q0-33 23.5-56.5T360-360h240q33 0 56.5 23.5T680-280v80h-80v-80h-80v80h-80v-80h-80v80h-80Zm-80 0h560-560Z"/>
                        </svg>
                      </div>
                      <div>
                        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: '#2d1f6e', margin: 0 }}>{session.skillName}</h1>
                        <p style={{ color: '#b0a4e0', fontSize: 13, fontWeight: 500, marginTop: 2 }}>Adaptive Learning Session</p>
                      </div>
                    </div>

                    {session.recap && (
                      <div style={{ background: '#faf9ff', borderRadius: 14, padding: '14px 16px', border: '1.5px solid #ede9ff', marginBottom: 20 }}>
                        <p style={{ fontSize: 10.5, fontWeight: 800, color: '#6C4DFF', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Session Recap</p>
                        <p style={{ fontSize: 13.5, color: '#2d1f6e', lineHeight: 1.65, fontWeight: 500 }}>{session.recap}</p>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                      {[
                        { label: 'Current Mastery', value: `${Math.round(session.masteryScore)}%`, color: '#6C4DFF', icon: '🎯' },
                        { label: 'Modules',          value: `${completedNodes}/${totalNodes}`,    color: '#10B981', icon: '📚' },
                        { label: 'Mentor Mode',      value: session.mentorMode,                  color: '#F59E0B', icon: '🤖' },
                      ].map(s => (
                        <div key={s.label} className="stat-box">
                          <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
                          <p style={{ fontSize: 10.5, color: '#b0a4e0', fontWeight: 600, marginBottom: 4 }}>{s.label}</p>
                          <p style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Up next */}
                  <div className="content-card" style={{ borderLeft: '4px solid #6C4DFF' }}>
                    <p className="section-label">Up Next</p>
                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: '#2d1f6e', marginBottom: 8 }}>{session.currentNode.title}</h2>
                    <p style={{ color: '#7c6bc4', fontSize: 13.5, lineHeight: 1.7, fontWeight: 500 }}>{session.currentNode.description}</p>
                  </div>

                  <motion.button className="primary-action-btn" onClick={() => setPhase('concept')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    Begin Module →
                  </motion.button>
                </motion.div>
              )}

              {/* ── CONCEPT ── */}
              {phase === 'concept' && (
                <motion.div key="concept" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {/* Module badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ padding: '5px 13px', borderRadius: 50, background: '#ede9ff', fontSize: 12, fontWeight: 800, color: '#6C4DFF' }}>
                      Module {session.currentNode.order}
                    </div>
                    <span style={{ color: '#c4b8e8', fontSize: 12 }}>•</span>
                    <span style={{ fontSize: 12, color: '#b0a4e0', fontWeight: 600 }}>{session.currentNode.title}</span>
                  </div>

                  {/* Concept card */}
                  <div className="content-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 12, background: '#ede9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 18 }}>💡</span>
                      </div>
                      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 800, color: '#2d1f6e' }}>Core Concept</span>
                    </div>
                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: '#2d1f6e', marginBottom: 14 }}>{session.currentNode.title}</h2>
                    <p style={{ fontSize: 14.5, color: '#4a3d7a', lineHeight: 1.75, fontWeight: 500 }}>{session.currentNode.description}</p>

                    {/* Mastery progress toward threshold */}
                    <div style={{ marginTop: 22, padding: '14px 16px', background: '#faf9ff', borderRadius: 14, border: '1.5px solid #ede9ff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: '#b0a4e0', fontWeight: 600 }}>Progress to unlock next module</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: getMasteryColor(session.masteryScore) }}>
                          {Math.round(session.masteryScore)} / {session.currentNode.mastery_threshold}%
                        </span>
                      </div>
                      <div style={{ height: 8, background: '#ede9ff', borderRadius: 99, overflow: 'hidden' }}>
                        <motion.div style={{ height: '100%', background: `linear-gradient(90deg, ${getMasteryColor(session.masteryScore)}, ${getMasteryColor(session.masteryScore)}aa)`, borderRadius: 99 }}
                          animate={{ width: `${Math.min(100, (session.masteryScore / (session.currentNode.mastery_threshold ?? 75)) * 100)}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }} />
                      </div>
                    </div>
                  </div>

                  {/* Focus points */}
                  <div className="content-card">
                    <p className="section-label">Key Focus Points</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {session.currentNode.description.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20).slice(0, 3).map((point, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 9, background: 'linear-gradient(135deg, #6C4DFF, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>{i + 1}</span>
                          </div>
                          <p style={{ fontSize: 13.5, color: '#4a3d7a', lineHeight: 1.65, fontWeight: 500 }}>{point}.</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <motion.button className="primary-action-btn" onClick={generateQuestion} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    Test My Knowledge →
                  </motion.button>
                </motion.div>
              )}

              {/* ── QUESTION LOADING ── */}
              {phase === 'question_loading' && (
                <motion.div key="q-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#ede9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.div style={{ width: 28, height: 28, border: '3px solid transparent', borderTopColor: '#6C4DFF', borderRadius: '50%' }} animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                  </div>
                  <p style={{ color: '#9585cc', fontSize: 14, fontWeight: 600 }}>Generating your question…</p>
                </motion.div>
              )}

              {/* ── QUESTION ── */}
              {phase === 'question' && (
                <motion.div key="question" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ padding: '5px 13px', borderRadius: 50, background: '#fff7ed', border: '1.5px solid #fed7aa', fontSize: 12, fontWeight: 800, color: '#c2410c' }}>
                        📝 Assessment
                      </div>
                      <span style={{ fontSize: 12, color: '#b0a4e0', fontWeight: 600 }}>Question #{questionIndex + 1}</span>
                    </div>
                    <div style={{ padding: '4px 11px', borderRadius: 50, background: diffInfo.bg, fontSize: 11.5, fontWeight: 800, color: diffInfo.color }}>
                      {diffInfo.icon} {diffInfo.label}
                    </div>
                  </div>

                  <div className="content-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid #f3f0ff' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 12, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>❓</div>
                      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, color: '#2d1f6e' }}>Practice Question</span>
                    </div>
                    <p style={{ fontSize: 17, fontWeight: 700, color: '#2d1f6e', lineHeight: 1.6, marginBottom: 24 }}>{currentQuestion}</p>

                    <div>
                      <p style={{ fontSize: 11, fontWeight: 800, color: '#b0a4e0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Your Answer</p>
                      <textarea
                        value={userAnswer}
                        onChange={e => setUserAnswer(e.target.value)}
                        placeholder="Type your answer here… Take your time."
                        rows={5}
                        className="answer-textarea"
                        onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) submitAnswer(); }}
                      />
                      <p style={{ fontSize: 11, color: '#c4b8e8', fontWeight: 500, marginTop: 6 }}>Press ⌘ + Enter to submit quickly</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <motion.button className="secondary-action-btn" onClick={() => setPhase('concept')} whileTap={{ scale: 0.97 }}>
                      Review Concept
                    </motion.button>
                    <motion.button className="primary-action-btn" onClick={submitAnswer} disabled={!userAnswer.trim()} whileHover={userAnswer.trim() ? { scale: 1.02 } : {}} whileTap={userAnswer.trim() ? { scale: 0.97 } : {}}>
                      Submit Answer →
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ── EVALUATING ── */}
              {phase === 'evaluating' && (
                <motion.div key="evaluating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 18 }}>
                  <motion.div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ede9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <motion.div style={{ position: 'absolute', inset: 0, border: '3px solid transparent', borderTopColor: '#6C4DFF', borderRadius: '50%' }} animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                    <span style={{ fontSize: 24 }}>🤖</span>
                  </motion.div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: '#2d1f6e', marginBottom: 6 }}>Evaluating Your Answer</p>
                    <p style={{ fontSize: 13, color: '#9585cc', fontWeight: 500, fontStyle: 'italic', maxWidth: 300 }}>
                      "{userAnswer.length > 90 ? userAnswer.substring(0, 90) + '…' : userAnswer}"
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ── FEEDBACK ── */}
              {phase === 'feedback' && feedback && (
                <motion.div key="feedback" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {/* Result banner */}
                  <motion.div
                    initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.08, type: 'spring', stiffness: 200 }}
                    className={feedback.isPositive ? 'feedback-correct' : 'feedback-incorrect'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 16, background: feedback.isPositive ? '#10B981' : '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px ${feedback.isPositive ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                        {feedback.isPositive
                          ? <svg width="22" height="22" fill="white" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                          : <svg width="22" height="22" fill="white" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                        }
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: feedback.isPositive ? '#065f46' : '#991b1b', marginBottom: 3 }}>
                          {feedback.isPositive ? 'Correct! Well done 🎉' : 'Not Quite — Keep Going!'}
                        </p>
                        <p style={{ fontSize: 12.5, fontWeight: 600, color: feedback.isPositive ? '#059669' : '#dc2626' }}>
                          {feedback.isPositive
                            ? `+${Math.round(feedback.masteryAfter - feedback.masteryBefore)} mastery points earned`
                            : 'Review the explanation below and try again'}
                        </p>
                      </div>
                      {feedback.isPositive && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.25, type: 'spring' }}
                          style={{ padding: '6px 14px', borderRadius: 50, background: '#10B981', color: 'white', fontWeight: 800, fontSize: 14 }}>
                          {Math.round(feedback.masteryAfter)}%
                        </motion.div>
                      )}
                    </div>
                  </motion.div>

                  {/* Mentor feedback */}
                  <div className="content-card">
                    <p className="section-label">Mentor Feedback</p>
                    <p style={{ fontSize: 14, color: '#2d1f6e', lineHeight: 1.75, fontWeight: 500 }}>{feedback.response}</p>
                    {feedback.hint && !feedback.isPositive && (
                      <div style={{ marginTop: 16, padding: '14px 16px', background: '#ede9ff', borderRadius: 12, border: '1.5px solid rgba(108,77,255,0.2)' }}>
                        <p style={{ fontSize: 11, fontWeight: 800, color: '#6C4DFF', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>💡 Review Hint</p>
                        <p style={{ fontSize: 13, color: '#4a3d7a', lineHeight: 1.65, fontWeight: 500 }}>{feedback.hint}</p>
                      </div>
                    )}
                  </div>

                  {/* Your answer */}
                  <div style={{ background: '#faf9ff', borderRadius: 16, padding: '16px 18px', border: '1.5px solid #ede9ff' }}>
                    <p className="section-label">Your Answer</p>
                    <p style={{ fontSize: 13.5, color: '#7c6bc4', lineHeight: 1.65, fontStyle: 'italic', fontWeight: 500 }}>"{userAnswer}"</p>
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    {!feedback.isPositive && (
                      <motion.button className="secondary-action-btn" onClick={() => { setAttemptCount(p => p + 1); setPhase('question'); }} whileTap={{ scale: 0.97 }}>
                        Try Again
                      </motion.button>
                    )}
                    <motion.button className="primary-action-btn" onClick={handleContinueAfterFeedback} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                      {feedback.isPositive && session.masteryScore >= (session.currentNode.mastery_threshold ?? 75) ? 'Next Module →' : 'Continue Learning →'}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ── NODE COMPLETE ── */}
              {phase === 'node_complete' && (
                <motion.div key="node-complete" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 48, gap: 24 }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 12 }}
                    style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg, #6C4DFF, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 48px rgba(108,77,255,0.35)' }}>
                    <span style={{ fontSize: 40 }}>🏆</span>
                  </motion.div>
                  <div>
                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: '#2d1f6e', marginBottom: 8 }}>Module Complete!</h2>
                    <p style={{ color: '#9585cc', fontSize: 14, fontWeight: 500 }}>
                      You've mastered <span style={{ color: '#6C4DFF', fontWeight: 800 }}>{session.currentNode.title}</span>
                    </p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%', maxWidth: 320 }}>
                    {[
                      { label: 'Mastery', value: `${Math.round(session.masteryScore)}%`, color: '#6C4DFF' },
                      { label: 'Correct', value: stats.correct, color: '#10B981' },
                      { label: 'Streak',  value: stats.streak,  color: '#F59E0B' },
                    ].map(s => (
                      <div key={s.label} className="stat-box">
                        <p style={{ fontSize: 10.5, color: '#b0a4e0', fontWeight: 600, marginBottom: 4 }}>{s.label}</p>
                        <p style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <motion.button className="primary-action-btn" onClick={() => setPhase('concept')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ maxWidth: 320 }}>
                    Continue to Next Module →
                  </motion.button>
                </motion.div>
              )}

              {/* ── SESSION COMPLETE ── */}
              {phase === 'session_complete' && (
                <motion.div key="session-complete" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 36, gap: 24 }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 12 }}>
                    <CircleProgress value={session.masteryScore} size={128} />
                  </motion.div>
                  <div>
                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: '#2d1f6e', marginBottom: 8 }}>🎉 Skill Complete!</h2>
                    <p style={{ color: '#9585cc', fontSize: 14, fontWeight: 500 }}>
                      You've finished all modules for <span style={{ color: '#6C4DFF', fontWeight: 800 }}>{session.skillName}</span>
                    </p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, width: '100%' }}>
                    {[
                      { label: 'Final Mastery', value: `${Math.round(session.masteryScore)}%`, color: '#6C4DFF', icon: '🎯' },
                      { label: 'Correct',       value: stats.correct,                          color: '#10B981', icon: '✅' },
                      { label: 'Total Qs',      value: stats.totalAttempts,                    color: '#F59E0B', icon: '📝' },
                      { label: 'Accuracy',      value: `${accuracy}%`,                         color: '#EF4444', icon: '📊' },
                    ].map(s => (
                      <div key={s.label} className="stat-box">
                        <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
                        <p style={{ fontSize: 10.5, color: '#b0a4e0', fontWeight: 600, marginBottom: 4 }}>{s.label}</p>
                        <p style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  {onBack && (
                    <motion.button className="primary-action-btn" onClick={onBack} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ maxWidth: 320 }}>
                      Back to Library
                    </motion.button>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </main>

        {/* ══════════ RIGHT PANEL ══════════ */}
        <AnimatePresence>
          {rightPanelOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }} animate={{ width: 228, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              style={{ background: 'white', borderLeft: '1px solid #ede9ff', flexShrink: 0, overflow: 'hidden' }}
            >
              <div style={{ width: 228, height: '100%', overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Mastery circle */}
                <div style={{ textAlign: 'center', paddingTop: 4 }}>
                  <CircleProgress value={session.masteryScore} size={90} />
                  <p style={{ fontSize: 11, color: '#b0a4e0', fontWeight: 700, marginTop: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Mastery Score</p>
                </div>

                {/* Session stats */}
                <div style={{ background: '#faf9ff', borderRadius: 16, padding: '14px', border: '1.5px solid #ede9ff' }}>
                  <p className="section-label">This Session</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: 'Correct',   value: stats.correct,       color: '#10B981', icon: '✅' },
                      { label: 'Incorrect', value: stats.incorrect,     color: '#EF4444', icon: '❌' },
                      { label: 'Attempts',  value: stats.totalAttempts, color: '#6C4DFF', icon: '📝' },
                      { label: 'Accuracy',  value: `${accuracy}%`,      color: '#F59E0B', icon: '🎯' },
                    ].map(s => (
                      <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'white', borderRadius: 10, border: '1px solid #ede9ff' }}>
                        <span style={{ fontSize: 12, color: '#7c6bc4', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 13 }}>{s.icon}</span>{s.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Adaptive difficulty */}
                <div style={{ background: '#faf9ff', borderRadius: 16, padding: '14px', border: '1.5px solid #ede9ff' }}>
                  <p className="section-label">Adaptive Level</p>
                  <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
                    {(['simplified', 'standard', 'advanced'] as Difficulty[]).map(d => {
                      const di = getDifficultyInfo(d);
                      return (
                        <div key={d} style={{ flex: 1, height: 6, borderRadius: 99, background: d === difficulty ? di.color : '#ede9ff', transition: 'all 0.3s' }} />
                      );
                    })}
                  </div>
                  <p style={{ fontSize: 12.5, fontWeight: 800, color: diffInfo.color }}>{diffInfo.icon} {diffInfo.label}</p>
                  <p style={{ fontSize: 10.5, color: '#c4b8e8', fontWeight: 500, marginTop: 2 }}>Auto-adapts to your performance</p>
                </div>

                {/* Confidence */}
                <div style={{ background: '#faf9ff', borderRadius: 16, padding: '14px', border: '1.5px solid #ede9ff' }}>
                  <p className="section-label">Confidence</p>
                  <p style={{ fontSize: 14, fontWeight: 800, color: '#2d1f6e', textTransform: 'capitalize' }}>{session.confidenceLevel}</p>
                </div>

                {/* Stretch task */}
                {session.stretchTask && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: 'linear-gradient(135deg, #6C4DFF, #5A3FE6)', borderRadius: 16, padding: '16px' }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>🏆 Stretch Challenge</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, fontWeight: 500, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {session.stretchTask.description}
                    </p>
                    <button
                      onClick={() => { setCurrentQuestion(session.stretchTask!.description); setUserAnswer(''); setPhase('question'); }}
                      style={{ width: '100%', padding: '8px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.12)', color: 'white', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", transition: 'all 0.2s' }}
                    >
                      Attempt Challenge →
                    </button>
                  </motion.div>
                )}

              </div>
            </motion.aside>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}