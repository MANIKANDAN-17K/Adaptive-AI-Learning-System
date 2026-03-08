import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MentorMode, RoadmapNode, Task } from "../types";
import { apiClient } from "../services";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type LearningPhase =
  | "loading"
  | "intro"
  | "concept"
  | "question_loading"
  | "question"
  | "evaluating"
  | "feedback"
  | "node_complete"
  | "session_complete"
  | "error";

type Difficulty = "simplified" | "standard" | "advanced";

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
  const pos = [
    "correct",
    "right",
    "excellent",
    "great job",
    "well done",
    "exactly",
    "perfect",
    "spot on",
    "good answer",
    "absolutely",
    "that's right",
    "yes,",
    "yes!",
    "accurate",
    "impressive",
    "nicely done",
  ];
  const neg = [
    "incorrect",
    "wrong",
    "not quite",
    "unfortunately",
    "actually",
    "that's not",
    "not exactly",
    "close but",
    "let me clarify",
    "not right",
  ];
  return (
    pos.filter((s) => lower.includes(s)).length >
    neg.filter((s) => lower.includes(s)).length
  );
}

function getMasteryColor(score: number) {
  if (score >= 80) return "#10B981";
  if (score >= 60) return "#6C4DFF";
  if (score >= 40) return "#F59E0B";
  return "#EF4444";
}

function findAdjacentNodes(nodes: RoadmapNode[], currentId: string) {
  const unlockedNodes = nodes.filter((n) => !n.locked);
  const currentIndex = unlockedNodes.findIndex((n) => n.id === currentId);

  return {
    prev: currentIndex > 0 ? unlockedNodes[currentIndex - 1] : null,
    next:
      currentIndex < unlockedNodes.length - 1
        ? unlockedNodes[currentIndex + 1]
        : null,
  };
}

function getDifficultyInfo(d: Difficulty) {
  if (d === "simplified")
    return {
      label: "Beginner",
      color: "#10B981",
      bg: "#f0fdf4",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#10B981">
          <path d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zm1-10.06l2.83 2.83 1.41-1.41L14.41 10.5 17.24 7.66l-1.41-1.41L12 9.94 8.17 6.11 6.76 7.52l2.83 2.83-2.83 2.83 1.41 1.41L12 11.94z" />
        </svg>
      ),
    };
  if (d === "advanced")
    return {
      label: "Advanced",
      color: "#EF4444",
      bg: "#fff5f5",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#EF4444">
          <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />
        </svg>
      ),
    };
  return {
    label: "Standard",
    color: "#6C4DFF",
    bg: "#ede9ff",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#6C4DFF">
        <path d="M7 2v11h3v9l7-12h-4l4-8z" />
      </svg>
    ),
  };
}

// ─────────────────────────────────────────────
// CircleProgress
// ─────────────────────────────────────────────
function CircleProgress({
  value,
  size = 80,
}: {
  value: number;
  size?: number;
}) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = getMasteryColor(value);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block" }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#ede9ff"
        strokeWidth={9}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={9}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: "easeOut" }}
        style={{ transformOrigin: "center", transform: "rotate(-90deg)" }}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={size * 0.2}
        fontWeight="800"
        fill={color}
        fontFamily="'Nunito', sans-serif"
      >
        {Math.round(value)}%
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function LearningSession({
  skillId,
  onBack,
}: LearningSessionProps) {
  const [session, setSession] = useState<LearningSessionState | null>(null);
  const [phase, setPhase] = useState<LearningPhase>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [stats, setStats] = useState<SessionStats>({
    correct: 0,
    incorrect: 0,
    streak: 0,
    totalAttempts: 0,
  });
  const [difficulty, setDifficulty] = useState<Difficulty>("standard");
  const [interactionStart, setInteractionStart] = useState(Date.now());
  const [attemptCount, setAttemptCount] = useState(1);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showTopicNav, setShowTopicNav] = useState(false);

  useEffect(() => {
    initializeSession();
  }, [skillId]);

  const jumpToTopic = useCallback(
    (nodeId: string) => {
      if (!session) return;
      const targetNode = session.roadmapNodes.find((n) => n.node_id === nodeId);
      if (!targetNode || targetNode.status === "locked") return;
      setSession((prev) =>
        prev ? { ...prev, currentNode: targetNode } : prev,
      );
      setShowTopicNav(false);
      setPhase("concept");
    },
    [session],
  );

  const initializeSession = async () => {
    setPhase("loading");
    try {
      const [skillRes, roadmapRes, sessionRes] = await Promise.all([
        apiClient.skills.getSkill(skillId),
        apiClient.roadmaps.getRoadmap(skillId),
        apiClient.sessions.startSession(skillId),
      ]);
      setSession({
        sessionId: sessionRes.sessionId,
        skillName: skillRes.skill.skill_name,
        currentNode: sessionRes.currentNode,
        masteryScore: sessionRes.masteryScore ?? 0,
        confidenceLevel: sessionRes.confidenceLevel,
        mentorMode: sessionRes.mentorMode,
        roadmapNodes: roadmapRes.roadmap.structure_json,
        recap: sessionRes.recap || "",
        stretchTask: null,
      });
      const m = sessionRes.masteryScore ?? 0;
      setDifficulty(m > 75 ? "advanced" : m > 40 ? "standard" : "simplified");
      setPhase("intro");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to start session");
      setPhase("error");
    }
  };

  const generateQuestion = useCallback(async () => {
    if (!session) return;
    setPhase("question_loading");
    setAttemptCount(1);
    setInteractionStart(Date.now());
    try {
      const dHint =
        difficulty === "simplified"
          ? "beginner-level"
          : difficulty === "advanced"
            ? "advanced, nuanced"
            : "standard";
      const prompt = `I studied: "${session.currentNode.title}" - ${session.currentNode.description}. Ask ONE concise ${dHint} quiz question. Return ONLY the question, no preamble.`;
      const res = await apiClient.sessions.interact(
        session.sessionId,
        prompt,
        100,
        100,
        1,
      );
      setCurrentQuestion(
        res.mentorResponse ||
          `What is the key concept behind ${session.currentNode.title}?`,
      );
      setUserAnswer("");
      setPhase("question");
    } catch {
      setCurrentQuestion(
        `Explain the key concept behind: ${session.currentNode.title}`,
      );
      setPhase("question");
    }
  }, [session, difficulty]);

  const submitAnswer = async () => {
    if (!session || !userAnswer.trim()) return;
    setPhase("evaluating");
    const masteryBefore = session.masteryScore;
    const speed = Math.max(
      20,
      Math.min(100, 100 - ((Date.now() - interactionStart) / 1000) * 2),
    );
    try {
      const prompt = `Question: ${currentQuestion}\nStudent's answer: "${userAnswer}"\nEvaluate. Start with "CORRECT:" or "INCORRECT:" then 2-3 sentence explanation.`;
      const res = await apiClient.sessions.interact(
        session.sessionId,
        prompt,
        75,
        speed,
        attemptCount,
      );
      const responseText = res.mentorResponse || "";
      const masteryAfter = res.masteryScore ?? masteryBefore;
      const isPositive =
        masteryAfter - masteryBefore > 1
          ? true
          : parseResponseSentiment(responseText);
      setFeedback({
        response: responseText,
        isPositive,
        masteryBefore,
        masteryAfter,
        hint: isPositive
          ? undefined
          : `Review: ${session.currentNode.description}`,
      });
      setStats((prev) => ({
        correct: prev.correct + (isPositive ? 1 : 0),
        incorrect: prev.incorrect + (isPositive ? 0 : 1),
        streak: isPositive ? prev.streak + 1 : 0,
        totalAttempts: prev.totalAttempts + 1,
      }));
      setSession((prev) => {
        if (!prev) return prev;
        const updatedNodes = res.nextNode
          ? prev.roadmapNodes.map((n) =>
              n.node_id === res.nextNode?.node_id
                ? { ...n, status: "current" as const }
                : n.node_id === prev.currentNode.node_id
                  ? { ...n, status: "completed" as const }
                  : n,
            )
          : prev.roadmapNodes;
        return {
          ...prev,
          masteryScore: masteryAfter,
          confidenceLevel: res.confidenceLevel ?? prev.confidenceLevel,
          roadmapNodes: updatedNodes,
          currentNode: res.nextNode || prev.currentNode,
          stretchTask: res.stretchTask || prev.stretchTask,
        };
      });
      if (isPositive)
        setDifficulty(
          masteryAfter > 75
            ? "advanced"
            : masteryAfter > 40
              ? "standard"
              : "standard",
        );
      else if (masteryAfter < 40) setDifficulty("simplified");
      setPhase("feedback");
      setQuestionIndex((prev) => prev + 1);
    } catch {
      setFeedback({
        response: "An error occurred. Please try again.",
        isPositive: false,
        masteryBefore,
        masteryAfter: masteryBefore,
      });
      setPhase("feedback");
    }
  };

  const handleContinueAfterFeedback = () => {
    if (!session || !feedback) return;
    const nodeComplete =
      session.masteryScore >= (session.currentNode.mastery_threshold ?? 75);
    const isLast =
      session.roadmapNodes.filter(
        (n) =>
          n.status !== "completed" && n.node_id !== session.currentNode.node_id,
      ).length === 0;
    if (feedback.isPositive && nodeComplete) {
      setPhase(isLast ? "session_complete" : "node_complete");
    } else {
      setAttemptCount(1);
      setPhase("concept");
    }
  };

  const handleMentorModeChange = async (mode: MentorMode) => {
    if (!session) return;
    setSession((prev) => (prev ? { ...prev, mentorMode: mode } : prev));
    try {
      await apiClient.sessions.updateMentorMode(session.sessionId, mode);
    } catch {
      /* ignore */
    }
  };

  // ─────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────
  if (phase === "loading")
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#faf9ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Nunito', sans-serif",
        }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap');`}</style>
        <motion.div
          style={{
            textAlign: "center",
            background: "white",
            borderRadius: 24,
            padding: "48px 56px",
            border: "1.5px solid #ede9ff",
            boxShadow: "0 8px 40px rgba(108,77,255,0.1)",
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            style={{
              width: 52,
              height: 52,
              border: "4px solid #ede9ff",
              borderTopColor: "#6C4DFF",
              borderRadius: "50%",
              margin: "0 auto 20px",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          />
          <p
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 16,
              color: "#2d1f6e",
              marginBottom: 6,
            }}
          >
            Preparing Your Session
          </p>
          <p style={{ color: "#b0a4e0", fontSize: 13, fontWeight: 500 }}>
            Setting up your personalised learning environment…
          </p>
        </motion.div>
      </div>
    );

  if (phase === "error")
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#faf9ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "'Nunito', sans-serif",
        }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap');`}</style>
        <motion.div
          style={{
            textAlign: "center",
            maxWidth: 400,
            background: "white",
            borderRadius: 24,
            padding: 48,
            border: "1.5px solid #ede9ff",
            boxShadow: "0 8px 40px rgba(108,77,255,0.1)",
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              background: "#fff5f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <svg
              width="26"
              height="26"
              fill="none"
              stroke="#ef4444"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 20,
              fontWeight: 800,
              color: "#2d1f6e",
              marginBottom: 8,
            }}
          >
            Session Failed
          </h2>
          <p style={{ color: "#9585cc", fontSize: 13, marginBottom: 28 }}>
            {errorMsg}
          </p>
          {onBack && (
            <motion.button
              onClick={onBack}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: "12px 28px",
                borderRadius: 50,
                border: "none",
                background: "linear-gradient(135deg, #6C4DFF, #5A3FE6)",
                color: "white",
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "'Nunito', sans-serif",
                boxShadow: "0 6px 20px rgba(108,77,255,0.35)",
              }}
            >
              Go Back
            </motion.button>
          )}
        </motion.div>
      </div>
    );

  if (!session) return null;

  const completedNodes = session.roadmapNodes.filter(
    (n) => n.status === "completed",
  ).length;
  const totalNodes = session.roadmapNodes.length;
  const overallProgress =
    totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0;
  const accuracy =
    stats.totalAttempts > 0
      ? Math.round((stats.correct / stats.totalAttempts) * 100)
      : 0;
  const diffInfo = getDifficultyInfo(difficulty);

  // ─────────────────────────────────────────────
  // MAIN LAYOUT
  // ─────────────────────────────────────────────
  return (
    <div
      style={{
        height: "100vh",
        background: "#faf9ff",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'Nunito', sans-serif",
      }}
    >
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
      <header
        style={{
          height: 60,
          background: "white",
          borderBottom: "1px solid #ede9ff",
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          boxShadow: "0 1px 16px rgba(108,77,255,0.06)",
          zIndex: 20,
        }}
      >
        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {onBack && (
            <button className="nav-btn" onClick={onBack}>
              <svg
                width="13"
                height="13"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
          )}
          <div style={{ width: 1, height: 22, background: "#ede9ff" }} />
          {/* Logo */}
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              background: "linear-gradient(135deg, #6C4DFF, #5A3FE6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 3px 10px rgba(108,77,255,0.3)",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="17px"
              viewBox="0 -960 960 960"
              width="17px"
              fill="white"
            >
              <path d="M200-120q-33 0-56.5-23.5T120-200v-400q0-100 70-170t170-70h240q100 0 170 70t70 170v400q0 33-23.5 56.5T760-120H200Zm0-80h560v-400q0-66-47-113t-113-47H360q-66 0-113 47t-47 113v400Zm103.5-303.5Q280-527 280-560t23.5-56.5Q327-640 360-640t56.5 23.5Q440-593 440-560t-23.5 56.5Q393-480 360-480t-56.5-23.5Zm240 0Q520-527 520-560t23.5-56.5Q567-640 600-640t56.5 23.5Q680-593 680-560t-23.5 56.5Q633-480 600-480t-56.5-23.5ZM280-200v-80q0-33 23.5-56.5T360-360h240q33 0 56.5 23.5T680-280v80h-80v-80h-80v80h-80v-80h-80v80h-80Zm-80 0h560-560Z" />
            </svg>
          </div>
          <div>
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: 14,
                color: "#2d1f6e",
              }}
            >
              {session.skillName}
            </span>
            <span
              style={{
                color: "#b0a4e0",
                fontSize: 12,
                marginLeft: 8,
                fontWeight: 500,
              }}
            >
              / {session.currentNode.title}
            </span>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Difficulty badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 11px",
              borderRadius: 50,
              background: diffInfo.bg,
              border: `1.5px solid ${diffInfo.color}30`,
            }}
          >
            <span style={{ fontSize: 12 }}>{diffInfo.icon}</span>
            <span
              style={{ fontSize: 11.5, fontWeight: 800, color: diffInfo.color }}
            >
              {diffInfo.label}
            </span>
          </div>

          {/* Mentor mode selector */}
          <div
            style={{
              display: "flex",
              gap: 4,
              background: "#faf9ff",
              borderRadius: 50,
              padding: "3px",
              border: "1.5px solid #ede9ff",
            }}
          >
            {(
              [
                "Professional",
                "Friendly",
                "Supportive",
                "Challenger",
              ] as MentorMode[]
            ).map((mode) => (
              <button
                key={mode}
                className={`mode-pill ${session.mentorMode === mode ? "active" : "inactive"}`}
                onClick={() => handleMentorModeChange(mode)}
              >
                {mode.slice(0, 4)}
              </button>
            ))}
          </div>

          {/* Streak */}
          <AnimatePresence>
            {stats.streak >= 2 && (
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                style={{
                  padding: "4px 11px",
                  borderRadius: 50,
                  background: "#fff7ed",
                  border: "1.5px solid #fed7aa",
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: "#c2410c",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="#c2410c"
                  style={{
                    marginRight: 4,
                    display: "inline-block",
                    verticalAlign: "middle",
                  }}
                >
                  <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />
                </svg>
                {stats.streak} streak
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mastery pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 13px",
              borderRadius: 50,
              background: "#ede9ff",
              border: "1.5px solid rgba(108,77,255,0.2)",
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: getMasteryColor(session.masteryScore),
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 800, color: "#2d1f6e" }}>
              Mastery{" "}
              <motion.span
                key={session.masteryScore}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                style={{ color: "#6C4DFF" }}
              >
                {Math.round(session.masteryScore)}%
              </motion.span>
            </span>
          </div>

          {/* Toggle right panel */}
          <button
            className="nav-btn"
            onClick={() => setRightPanelOpen((p) => !p)}
            style={{ padding: "7px", borderRadius: 10 }}
          >
            <svg
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M15 3v18" />
            </svg>
          </button>
        </div>
      </header>

      {/* ══════════ 3-PANEL BODY ══════════ */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ── LEFT SIDEBAR ── */}
        <aside
          style={{
            width: 252,
            background: "white",
            borderRight: "1px solid #ede9ff",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {/* Progress header */}
          <div
            style={{
              padding: "16px 16px 14px",
              borderBottom: "1px solid #ede9ff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#2d1f6e",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Course Modules
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#b0a4e0" }}>
                {completedNodes}/{totalNodes}
              </span>
            </div>
            {/* Overall bar */}
            <div
              style={{
                height: 6,
                background: "#ede9ff",
                borderRadius: 99,
                overflow: "hidden",
              }}
            >
              <motion.div
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg, #6C4DFF, #8B5CF6)",
                  borderRadius: 99,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <div
              style={{
                marginTop: 5,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{ fontSize: 10.5, color: "#b0a4e0", fontWeight: 600 }}
              >
                {Math.round(overallProgress)}% complete
              </span>
              <span
                style={{ fontSize: 10.5, color: "#b0a4e0", fontWeight: 600 }}
              >
                {totalNodes - completedNodes} left
              </span>
            </div>
          </div>

          {/* Modules list */}
          <nav style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
            {session.roadmapNodes.map((node, idx) => {
              const isCurrent = node.node_id === session.currentNode.node_id;
              const isCompleted = node.status === "completed";
              const isLocked = node.status === "locked";
              return (
                <motion.div
                  key={node.node_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`sidebar-node ${isCurrent ? "current" : isCompleted ? "completed" : isLocked ? "locked" : "pending"}`}
                >
                  {/* Status dot */}
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 1,
                      background: isCompleted
                        ? "#10B981"
                        : isCurrent
                          ? "#6C4DFF"
                          : "#ede9ff",
                      boxShadow: isCurrent
                        ? "0 3px 10px rgba(108,77,255,0.3)"
                        : "none",
                    }}
                  >
                    {isCompleted ? (
                      <svg
                        width="12"
                        height="12"
                        fill="white"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : isCurrent ? (
                      <motion.div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "white",
                        }}
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                      />
                    ) : isLocked ? (
                      <svg
                        width="10"
                        height="10"
                        fill="#b0a4e0"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: "#b0a4e0",
                        }}
                      >
                        {idx + 1}
                      </span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 12.5,
                        fontWeight: 800,
                        color: isCurrent
                          ? "#6C4DFF"
                          : isCompleted
                            ? "#059669"
                            : "#2d1f6e",
                        marginBottom: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {node.title}
                    </p>
                    <p
                      style={{
                        fontSize: 10.5,
                        color: "#b0a4e0",
                        fontWeight: 500,
                        lineHeight: 1.45,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {node.description.length > 55
                        ? node.description.substring(0, 55) + "…"
                        : node.description}
                    </p>
                    {isCurrent && (
                      <div style={{ marginTop: 8 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              color: "#b0a4e0",
                              fontWeight: 600,
                            }}
                          >
                            Mastery
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              color: getMasteryColor(session.masteryScore),
                            }}
                          >
                            {Math.round(session.masteryScore)}% /{" "}
                            {node.mastery_threshold}%
                          </span>
                        </div>
                        <div
                          style={{
                            height: 4,
                            background: "#ede9ff",
                            borderRadius: 99,
                            overflow: "hidden",
                          }}
                        >
                          <motion.div
                            style={{
                              height: "100%",
                              background: getMasteryColor(session.masteryScore),
                              borderRadius: 99,
                            }}
                            animate={{
                              width: `${Math.min(100, (session.masteryScore / (node.mastery_threshold ?? 75)) * 100)}%`,
                            }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          />
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
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "28px 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ width: "100%", maxWidth: 660 }}>
            <AnimatePresence mode="wait">
              {/* ── INTRO ── */}
              {phase === "intro" && (
                <motion.div
                  key="intro"
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.35 }}
                  style={{ display: "flex", flexDirection: "column", gap: 18 }}
                >
                  {/* Welcome card */}
                  <div className="content-card">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        marginBottom: 20,
                      }}
                    >
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 16,
                          background:
                            "linear-gradient(135deg, #6C4DFF, #5A3FE6)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 6px 20px rgba(108,77,255,0.3)",
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="26px"
                          viewBox="0 -960 960 960"
                          width="26px"
                          fill="white"
                        >
                          <path d="M200-120q-33 0-56.5-23.5T120-200v-400q0-100 70-170t170-70h240q100 0 170 70t70 170v400q0 33-23.5 56.5T760-120H200Zm0-80h560v-400q0-66-47-113t-113-47H360q-66 0-113 47t-47 113v400Zm103.5-303.5Q280-527 280-560t23.5-56.5Q327-640 360-640t56.5 23.5Q440-593 440-560t-23.5 56.5Q393-480 360-480t-56.5-23.5Zm240 0Q520-527 520-560t23.5-56.5Q567-640 600-640t56.5 23.5Q680-593 680-560t-23.5 56.5Q633-480 600-480t-56.5-23.5ZM280-200v-80q0-33 23.5-56.5T360-360h240q33 0 56.5 23.5T680-280v80h-80v-80h-80v80h-80v-80h-80v80h-80Zm-80 0h560-560Z" />
                        </svg>
                      </div>
                      <div>
                        <h1
                          style={{
                            fontFamily: "'Syne', sans-serif",
                            fontSize: 22,
                            fontWeight: 800,
                            color: "#2d1f6e",
                            margin: 0,
                          }}
                        >
                          {session.skillName}
                        </h1>
                        <p
                          style={{
                            color: "#b0a4e0",
                            fontSize: 13,
                            fontWeight: 500,
                            marginTop: 2,
                          }}
                        >
                          Adaptive Learning Session
                        </p>
                      </div>
                    </div>

                    {session.recap && (
                      <div
                        style={{
                          background: "#faf9ff",
                          borderRadius: 14,
                          padding: "14px 16px",
                          border: "1.5px solid #ede9ff",
                          marginBottom: 20,
                        }}
                      >
                        <p
                          style={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            color: "#6C4DFF",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            marginBottom: 6,
                          }}
                        >
                          Session Recap
                        </p>
                        <p
                          style={{
                            fontSize: 13.5,
                            color: "#2d1f6e",
                            lineHeight: 1.65,
                            fontWeight: 500,
                          }}
                        >
                          {session.recap}
                        </p>
                      </div>
                    )}

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 12,
                      }}
                    >
                      {[
                        {
                          label: "Current Mastery",
                          value: `${Math.round(session.masteryScore)}%`,
                          color: "#6C4DFF",
                          icon: (
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="#6C4DFF"
                            >
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </svg>
                          ),
                        },
                        {
                          label: "Modules",
                          value: `${completedNodes}/${totalNodes}`,
                          color: "#10B981",
                          icon: (
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="#10B981"
                            >
                              <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" />
                            </svg>
                          ),
                        },
                        {
                          label: "Mentor Mode",
                          value: session.mentorMode,
                          color: "#F59E0B",
                          icon: (
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="#F59E0B"
                            >
                              <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zM7.5 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S9.83 13 9 13s-1.5-.67-1.5-1.5zM16 17H8v-2h8v2zm-1-4c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13z" />
                            </svg>
                          ),
                        },
                      ].map((s) => (
                        <div key={s.label} className="stat-box">
                          <div style={{ fontSize: 20, marginBottom: 6 }}>
                            {s.icon}
                          </div>
                          <p
                            style={{
                              fontSize: 10.5,
                              color: "#b0a4e0",
                              fontWeight: 600,
                              marginBottom: 4,
                            }}
                          >
                            {s.label}
                          </p>
                          <p
                            style={{
                              fontSize: 15,
                              fontWeight: 800,
                              color: s.color,
                            }}
                          >
                            {s.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Up next */}
                  <div
                    className="content-card"
                    style={{ borderLeft: "4px solid #6C4DFF" }}
                  >
                    <p className="section-label">Up Next</p>
                    <h2
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 18,
                        fontWeight: 800,
                        color: "#2d1f6e",
                        marginBottom: 8,
                      }}
                    >
                      {session.currentNode.title}
                    </h2>
                    <p
                      style={{
                        color: "#7c6bc4",
                        fontSize: 13.5,
                        lineHeight: 1.7,
                        fontWeight: 500,
                      }}
                    >
                      {session.currentNode.description}
                    </p>
                  </div>

                  <motion.button
                    className="primary-action-btn"
                    onClick={() => setPhase("concept")}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Begin Module →
                  </motion.button>
                </motion.div>
              )}

              {/* ── CONCEPT ── */}
              {phase === "concept" && (
                <motion.div
                  key="concept"
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.35 }}
                  style={{ display: "flex", flexDirection: "column", gap: 18 }}
                >
                  {/* Module badge */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div
                      style={{
                        padding: "5px 13px",
                        borderRadius: 50,
                        background: "#ede9ff",
                        fontSize: 12,
                        fontWeight: 800,
                        color: "#6C4DFF",
                      }}
                    >
                      Module {session.currentNode.order}
                    </div>
                    <span style={{ color: "#c4b8e8", fontSize: 12 }}>•</span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "#b0a4e0",
                        fontWeight: 600,
                      }}
                    >
                      {session.currentNode.title}
                    </span>
                  </div>

                  {/* Concept card */}
                  <div className="content-card">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 18,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 12,
                            background: "#ede9ff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="#6C4DFF"
                          >
                            <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z" />
                          </svg>
                        </div>
                        <span
                          style={{
                            fontFamily: "'Syne', sans-serif",
                            fontSize: 15,
                            fontWeight: 800,
                            color: "#2d1f6e",
                          }}
                        >
                          Core Concept
                        </span>
                      </div>

                      {/* Topic Navigation Arrows */}
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <motion.button
                          onClick={() => {
                            const { prev } = findAdjacentNodes(
                              session.roadmapNodes,
                              session.currentNode.id,
                            );
                            if (prev) jumpToTopic(prev.id);
                          }}
                          disabled={
                            !findAdjacentNodes(
                              session.roadmapNodes,
                              session.currentNode.id,
                            ).prev
                          }
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            background: findAdjacentNodes(
                              session.roadmapNodes,
                              session.currentNode.id,
                            ).prev
                              ? "#6C4DFF"
                              : "#e5e7eb",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: findAdjacentNodes(
                              session.roadmapNodes,
                              session.currentNode.id,
                            ).prev
                              ? "pointer"
                              : "not-allowed",
                            transition: "all 0.2s",
                            opacity: findAdjacentNodes(
                              session.roadmapNodes,
                              session.currentNode.id,
                            ).prev
                              ? 1
                              : 0.4,
                          }}
                          whileHover={
                            findAdjacentNodes(
                              session.roadmapNodes,
                              session.currentNode.id,
                            ).prev
                              ? { scale: 1.08 }
                              : {}
                          }
                          whileTap={
                            findAdjacentNodes(
                              session.roadmapNodes,
                              session.currentNode.id,
                            ).prev
                              ? { scale: 0.95 }
                              : {}
                          }
                        >
                          <span style={{ fontSize: 16, color: "white" }}>
                            ←
                          </span>
                        </motion.button>

                        <span
                          style={{
                            fontSize: 11,
                            color: "#b0a4e0",
                            fontWeight: 600,
                            minWidth: 60,
                            textAlign: "center",
                          }}
                        >
                          Topic{" "}
                          {session.roadmapNodes
                            .filter((n) => !n.locked)
                            .findIndex((n) => n.id === session.currentNode.id) +
                            1}{" "}
                          /{" "}
                          {session.roadmapNodes.filter((n) => !n.locked).length}
                        </span>

                        <motion.button
                          onClick={() => {
                            const { next } = findAdjacentNodes(
                              session.roadmapNodes,
                              session.currentNode.id,
                            );
                            if (next) jumpToTopic(next.id);
                          }}
                          disabled={
                            !findAdjacentNodes(
                              session.roadmapNodes,
                              session.currentNode.id,
                            ).next
                          }
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            background: findAdjacentNodes(
                              session.roadmapNodes,
                              session.currentNode.id,
                            ).next
                              ? "#6C4DFF"
                              : "#e5e7eb",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: findAdjacentNodes(
                              session.roadmapNodes,
                              session.currentNode.id,
                            ).next
                              ? "pointer"
                              : "not-allowed",
                            transition: "all 0.2s",
                            opacity: findAdjacentNodes(
                              session.roadmapNodes,
                              session.currentNode.id,
                            ).next
                              ? 1
                              : 0.4,
                          }}
                          whileHover={
                            findAdjacentNodes(
                              session.roadmapNodes,
                              session.currentNode.id,
                            ).next
                              ? { scale: 1.08 }
                              : {}
                          }
                          whileTap={
                            findAdjacentNodes(
                              session.roadmapNodes,
                              session.currentNode.id,
                            ).next
                              ? { scale: 0.95 }
                              : {}
                          }
                        >
                          <span style={{ fontSize: 16, color: "white" }}>
                            →
                          </span>
                        </motion.button>
                      </div>
                    </div>
                    <h2
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 22,
                        fontWeight: 800,
                        color: "#2d1f6e",
                        marginBottom: 14,
                      }}
                    >
                      {session.currentNode.title}
                    </h2>
                    <p
                      style={{
                        fontSize: 14.5,
                        color: "#4a3d7a",
                        lineHeight: 1.75,
                        fontWeight: 500,
                      }}
                    >
                      {session.currentNode.description}
                    </p>

                    {/* Mastery progress toward threshold */}
                    <div
                      style={{
                        marginTop: 22,
                        padding: "14px 16px",
                        background: "#faf9ff",
                        borderRadius: 14,
                        border: "1.5px solid #ede9ff",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            color: "#b0a4e0",
                            fontWeight: 600,
                          }}
                        >
                          Progress to unlock next module
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            color: getMasteryColor(session.masteryScore),
                          }}
                        >
                          {Math.round(session.masteryScore)} /{" "}
                          {session.currentNode.mastery_threshold}%
                        </span>
                      </div>
                      <div
                        style={{
                          height: 8,
                          background: "#ede9ff",
                          borderRadius: 99,
                          overflow: "hidden",
                        }}
                      >
                        <motion.div
                          style={{
                            height: "100%",
                            background: `linear-gradient(90deg, ${getMasteryColor(session.masteryScore)}, ${getMasteryColor(session.masteryScore)}aa)`,
                            borderRadius: 99,
                          }}
                          animate={{
                            width: `${Math.min(100, (session.masteryScore / (session.currentNode.mastery_threshold ?? 75)) * 100)}%`,
                          }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Focus points */}
                  <div className="content-card">
                    <p className="section-label">Key Focus Points</p>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      {session.currentNode.description
                        .split(/[.!?]+/)
                        .map((s) => s.trim())
                        .filter((s) => s.length > 20)
                        .slice(0, 3)
                        .map((point, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 12,
                            }}
                          >
                            <div
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 9,
                                background:
                                  "linear-gradient(135deg, #6C4DFF, #8B5CF6)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                marginTop: 1,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 800,
                                  color: "white",
                                }}
                              >
                                {i + 1}
                              </span>
                            </div>
                            <p
                              style={{
                                fontSize: 13.5,
                                color: "#4a3d7a",
                                lineHeight: 1.65,
                                fontWeight: 500,
                              }}
                            >
                              {point}.
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>

                  <motion.button
                    className="primary-action-btn"
                    onClick={generateQuestion}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Test My Knowledge →
                  </motion.button>
                </motion.div>
              )}

              {/* ── QUESTION LOADING ── */}
              {phase === "question_loading" && (
                <motion.div
                  key="q-loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingTop: 100,
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      background: "#ede9ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <motion.div
                      style={{
                        width: 28,
                        height: 28,
                        border: "3px solid transparent",
                        borderTopColor: "#6C4DFF",
                        borderRadius: "50%",
                      }}
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  </div>
                  <p
                    style={{ color: "#9585cc", fontSize: 14, fontWeight: 600 }}
                  >
                    Generating your question…
                  </p>
                </motion.div>
              )}

              {/* ── QUESTION ── */}
              {phase === "question" && (
                <motion.div
                  key="question"
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.35 }}
                  style={{ display: "flex", flexDirection: "column", gap: 18 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div
                        style={{
                          padding: "5px 13px",
                          borderRadius: 50,
                          background: "#fff7ed",
                          border: "1.5px solid #fed7aa",
                          fontSize: 12,
                          fontWeight: 800,
                          color: "#c2410c",
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="#6C4DFF"
                          style={{
                            marginRight: 6,
                            display: "inline-block",
                            verticalAlign: "middle",
                          }}
                        >
                          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                        </svg>
                        Assessment
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#b0a4e0",
                          fontWeight: 600,
                        }}
                      >
                        Question #{questionIndex + 1}
                      </span>
                    </div>
                    <button
                      className="nav-btn"
                      onClick={() => setShowTopicNav(!showTopicNav)}
                      style={{ padding: "5px 12px", fontSize: 11.5 }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="#6C4DFF"
                        style={{
                          marginRight: 6,
                          display: "inline-block",
                          verticalAlign: "middle",
                        }}
                      >
                        <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" />
                      </svg>
                      Change Topic
                    </button>
                  </div>

                  {/* Topic Navigator */}
                  <AnimatePresence>
                    {showTopicNav && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="content-card"
                        style={{ overflow: "hidden" }}
                      >
                        <p
                          className="section-label"
                          style={{ marginBottom: 12 }}
                        >
                          Jump to Topic
                        </p>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(200px, 1fr))",
                            gap: 10,
                          }}
                        >
                          {session.roadmapNodes.map((node) => {
                            const isCurrent =
                              node.node_id === session.currentNode.node_id;
                            const isCompleted = node.status === "completed";
                            const isLocked = node.status === "locked";
                            return (
                              <motion.button
                                key={node.node_id}
                                onClick={() => jumpToTopic(node.node_id)}
                                disabled={isLocked}
                                className="nav-btn"
                                whileHover={!isLocked ? { scale: 1.02 } : {}}
                                whileTap={!isLocked ? { scale: 0.98 } : {}}
                                style={{
                                  padding: "10px 12px",
                                  textAlign: "left",
                                  flexDirection: "column",
                                  alignItems: "flex-start",
                                  background: isCurrent
                                    ? "#ede9ff"
                                    : isCompleted
                                      ? "#f0fdf4"
                                      : isLocked
                                        ? "#faf9ff"
                                        : "white",
                                  border: `1.5px solid ${isCurrent ? "#6C4DFF" : isCompleted ? "#86efac" : "#ede9ff"}`,
                                  borderRadius: 12,
                                  cursor: isLocked ? "not-allowed" : "pointer",
                                  opacity: isLocked ? 0.5 : 1,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    marginBottom: 4,
                                  }}
                                >
                                  {isCompleted ? (
                                    <svg
                                      width="12"
                                      height="12"
                                      viewBox="0 0 24 24"
                                      fill="#10B981"
                                    >
                                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                  ) : isCurrent ? (
                                    <svg
                                      width="12"
                                      height="12"
                                      viewBox="0 0 24 24"
                                      fill="#6C4DFF"
                                    >
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                  ) : isLocked ? (
                                    <svg
                                      width="12"
                                      height="12"
                                      viewBox="0 0 24 24"
                                      fill="#9ca3af"
                                    >
                                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                                    </svg>
                                  ) : (
                                    <span
                                      style={{
                                        fontSize: 10,
                                        fontWeight: 800,
                                        color: "#b0a4e0",
                                      }}
                                    >
                                      {node.order}
                                    </span>
                                  )}
                                  <span
                                    style={{
                                      fontSize: 11.5,
                                      fontWeight: 800,
                                      color: isCurrent
                                        ? "#6C4DFF"
                                        : isCompleted
                                          ? "#059669"
                                          : "#2d1f6e",
                                    }}
                                  >
                                    {node.title}
                                  </span>
                                </div>
                                <span
                                  style={{
                                    fontSize: 10,
                                    color: "#b0a4e0",
                                    fontWeight: 500,
                                    lineHeight: 1.3,
                                  }}
                                >
                                  {node.description.substring(0, 45)}
                                  {node.description.length > 45 ? "..." : ""}
                                </span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Question Card - Enhanced with clearer structure */}
                  <div
                    className="content-card"
                    style={{
                      background: "linear-gradient(135deg, #faf9ff, #f8f6ff)",
                      border: "2px solid #ddd6fe",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 20,
                        paddingBottom: 16,
                        borderBottom: "2px dashed #ede9ff",
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 14,
                          background:
                            "linear-gradient(135deg, #6C4DFF, #8B5CF6)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 20,
                          boxShadow: "0 4px 14px rgba(108,77,255,0.3)",
                        }}
                      >
                        ❓
                      </div>
                      <div>
                        <span
                          style={{
                            fontFamily: "'Syne', sans-serif",
                            fontSize: 16,
                            fontWeight: 800,
                            color: "#2d1f6e",
                            display: "block",
                          }}
                        >
                          Practice Question
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: "#b0a4e0",
                            fontWeight: 600,
                          }}
                        >
                          Read carefully and answer below
                        </span>
                      </div>
                    </div>

                    {/* The Question - Highlighted */}
                    <div
                      style={{
                        background: "white",
                        borderRadius: 14,
                        padding: "20px 24px",
                        marginBottom: 24,
                        border: "1.5px solid #ede9ff",
                        boxShadow: "0 2px 12px rgba(108,77,255,0.08)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 8,
                            background: "#fff7ed",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span style={{ fontSize: 12, fontWeight: 800 }}>
                            Q
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: "#b0a4e0",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                          }}
                        >
                          Question
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#2d1f6e",
                          lineHeight: 1.7,
                        }}
                      >
                        {currentQuestion}
                      </p>
                    </div>

                    {/* Answer Section */}
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 8,
                            background: "#ede9ff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 800,
                              color: "#6C4DFF",
                            }}
                          >
                            A
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: "#b0a4e0",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                          }}
                        >
                          Your Answer
                        </p>
                      </div>
                      <textarea
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Type your answer here… Take your time to think it through."
                        rows={6}
                        className="answer-textarea"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.metaKey) submitAnswer();
                        }}
                        style={{ fontSize: 15 }}
                      />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: 8,
                        }}
                      >
                        <p
                          style={{
                            fontSize: 11,
                            color: "#c4b8e8",
                            fontWeight: 500,
                          }}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="#b0a4e0"
                            style={{
                              marginRight: 6,
                              display: "inline-block",
                              verticalAlign: "middle",
                            }}
                          >
                            <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z" />
                          </svg>
                          Press ⌘ + Enter to submit quickly
                        </p>
                        <span
                          style={{
                            fontSize: 11,
                            color: "#b0a4e0",
                            fontWeight: 600,
                          }}
                        >
                          {userAnswer.length} characters
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 12 }}>
                    <motion.button
                      className="secondary-action-btn"
                      onClick={() => setPhase("concept")}
                      whileTap={{ scale: 0.97 }}
                    >
                      Review Concept
                    </motion.button>
                    <motion.button
                      className="primary-action-btn"
                      onClick={submitAnswer}
                      disabled={!userAnswer.trim()}
                      whileHover={userAnswer.trim() ? { scale: 1.02 } : {}}
                      whileTap={userAnswer.trim() ? { scale: 0.97 } : {}}
                    >
                      Submit Answer →
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ── EVALUATING ── */}
              {phase === "evaluating" && (
                <motion.div
                  key="evaluating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingTop: 80,
                    gap: 18,
                  }}
                >
                  <motion.div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: "#ede9ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    <motion.div
                      style={{
                        position: "absolute",
                        inset: 0,
                        border: "3px solid transparent",
                        borderTopColor: "#6C4DFF",
                        borderRadius: "50%",
                      }}
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="#6C4DFF"
                    >
                      <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zM7.5 11.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S9.83 13 9 13s-1.5-.67-1.5-1.5zM16 17H8v-2h8v2zm-1-4c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13z" />
                    </svg>
                  </motion.div>
                  <div style={{ textAlign: "center" }}>
                    <p
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 16,
                        fontWeight: 800,
                        color: "#2d1f6e",
                        marginBottom: 6,
                      }}
                    >
                      Evaluating Your Answer
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#9585cc",
                        fontWeight: 500,
                        fontStyle: "italic",
                        maxWidth: 300,
                      }}
                    >
                      "
                      {userAnswer.length > 90
                        ? userAnswer.substring(0, 90) + "…"
                        : userAnswer}
                      "
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ── FEEDBACK ── */}
              {phase === "feedback" && feedback && (
                <motion.div
                  key="feedback"
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.35 }}
                  style={{ display: "flex", flexDirection: "column", gap: 18 }}
                >
                  {/* Result banner */}
                  <motion.div
                    initial={{ scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.08, type: "spring", stiffness: 200 }}
                    className={
                      feedback.isPositive
                        ? "feedback-correct"
                        : "feedback-incorrect"
                    }
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 14 }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 16,
                          background: feedback.isPositive
                            ? "#10B981"
                            : "#EF4444",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: `0 4px 16px ${feedback.isPositive ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                        }}
                      >
                        {feedback.isPositive ? (
                          <svg
                            width="22"
                            height="22"
                            fill="white"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg
                            width="22"
                            height="22"
                            fill="white"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontFamily: "'Syne', sans-serif",
                            fontSize: 18,
                            fontWeight: 800,
                            color: feedback.isPositive ? "#065f46" : "#991b1b",
                            marginBottom: 3,
                          }}
                        >
                          {feedback.isPositive ? (
                            <span>
                              Correct! Well done{" "}
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="#10B981"
                                style={{
                                  display: "inline-block",
                                  verticalAlign: "middle",
                                  marginLeft: 4,
                                }}
                              >
                                <path d="M7 8h10v2H7zm0 4h10v2H7zm5-9L2 7v10l10 4 10-4V7l-10-4zm8 9.5l-8 3.2-8-3.2V8.5l8-3.2 8 3.2v4z" />
                              </svg>
                            </span>
                          ) : (
                            "Not Quite — Keep Going!"
                          )}
                        </p>
                        <p
                          style={{
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: feedback.isPositive ? "#059669" : "#dc2626",
                          }}
                        >
                          {feedback.isPositive
                            ? `+${Math.round(feedback.masteryAfter - feedback.masteryBefore)} mastery points earned`
                            : "Review the explanation below and try again"}
                        </p>
                      </div>
                      {feedback.isPositive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.25, type: "spring" }}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 50,
                            background: "#10B981",
                            color: "white",
                            fontWeight: 800,
                            fontSize: 14,
                          }}
                        >
                          {Math.round(feedback.masteryAfter)}%
                        </motion.div>
                      )}
                    </div>
                  </motion.div>

                  {/* Mentor feedback */}
                  <div className="content-card">
                    <p className="section-label">Mentor Feedback</p>
                    <p
                      style={{
                        fontSize: 14,
                        color: "#2d1f6e",
                        lineHeight: 1.75,
                        fontWeight: 500,
                      }}
                    >
                      {feedback.response}
                    </p>
                    {feedback.hint && !feedback.isPositive && (
                      <div
                        style={{
                          marginTop: 16,
                          padding: "14px 16px",
                          background: "#ede9ff",
                          borderRadius: 12,
                          border: "1.5px solid rgba(108,77,255,0.2)",
                        }}
                      >
                        <p
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: "#6C4DFF",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            marginBottom: 5,
                          }}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="#6C4DFF"
                            style={{
                              marginRight: 6,
                              display: "inline-block",
                              verticalAlign: "middle",
                            }}
                          >
                            <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z" />
                          </svg>
                          Review Hint
                        </p>
                        <p
                          style={{
                            fontSize: 13,
                            color: "#4a3d7a",
                            lineHeight: 1.65,
                            fontWeight: 500,
                          }}
                        >
                          {feedback.hint}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Your answer */}
                  <div
                    style={{
                      background: "#faf9ff",
                      borderRadius: 16,
                      padding: "16px 18px",
                      border: "1.5px solid #ede9ff",
                    }}
                  >
                    <p className="section-label">Your Answer</p>
                    <p
                      style={{
                        fontSize: 13.5,
                        color: "#7c6bc4",
                        lineHeight: 1.65,
                        fontStyle: "italic",
                        fontWeight: 500,
                      }}
                    >
                      "{userAnswer}"
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 12 }}>
                    {!feedback.isPositive && (
                      <motion.button
                        className="secondary-action-btn"
                        onClick={() => {
                          setAttemptCount((p) => p + 1);
                          setPhase("question");
                        }}
                        whileTap={{ scale: 0.97 }}
                      >
                        Try Again
                      </motion.button>
                    )}
                    <motion.button
                      className="primary-action-btn"
                      onClick={handleContinueAfterFeedback}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {feedback.isPositive &&
                      session.masteryScore >=
                        (session.currentNode.mastery_threshold ?? 75)
                        ? "Next Module →"
                        : "Continue Learning →"}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ── NODE COMPLETE ── */}
              {phase === "node_complete" && (
                <motion.div
                  key="node-complete"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    paddingTop: 48,
                    gap: 24,
                  }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: 0.15,
                      type: "spring",
                      stiffness: 200,
                      damping: 12,
                    }}
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #6C4DFF, #8B5CF6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 16px 48px rgba(108,77,255,0.35)",
                    }}
                  >
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="white"
                    >
                      <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
                    </svg>
                  </motion.div>
                  <div>
                    <h2
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 26,
                        fontWeight: 800,
                        color: "#2d1f6e",
                        marginBottom: 8,
                      }}
                    >
                      Module Complete!
                    </h2>
                    <p
                      style={{
                        color: "#9585cc",
                        fontSize: 14,
                        fontWeight: 500,
                      }}
                    >
                      You've mastered{" "}
                      <span style={{ color: "#6C4DFF", fontWeight: 800 }}>
                        {session.currentNode.title}
                      </span>
                    </p>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 12,
                      width: "100%",
                      maxWidth: 320,
                    }}
                  >
                    {[
                      {
                        label: "Mastery",
                        value: `${Math.round(session.masteryScore)}%`,
                        color: "#6C4DFF",
                      },
                      {
                        label: "Correct",
                        value: stats.correct,
                        color: "#10B981",
                      },
                      {
                        label: "Streak",
                        value: stats.streak,
                        color: "#F59E0B",
                      },
                    ].map((s) => (
                      <div key={s.label} className="stat-box">
                        <p
                          style={{
                            fontSize: 10.5,
                            color: "#b0a4e0",
                            fontWeight: 600,
                            marginBottom: 4,
                          }}
                        >
                          {s.label}
                        </p>
                        <p
                          style={{
                            fontSize: 22,
                            fontWeight: 800,
                            color: s.color,
                          }}
                        >
                          {s.value}
                        </p>
                      </div>
                    ))}
                  </div>
                  <motion.button
                    className="primary-action-btn"
                    onClick={() => setPhase("concept")}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ maxWidth: 320 }}
                  >
                    Continue to Next Module →
                  </motion.button>
                </motion.div>
              )}

              {/* ── SESSION COMPLETE ── */}
              {phase === "session_complete" && (
                <motion.div
                  key="session-complete"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    paddingTop: 36,
                    gap: 24,
                  }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: 0.15,
                      type: "spring",
                      stiffness: 200,
                      damping: 12,
                    }}
                  >
                    <CircleProgress value={session.masteryScore} size={128} />
                  </motion.div>
                  <div>
                    <h2
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 28,
                        fontWeight: 800,
                        color: "#2d1f6e",
                        marginBottom: 8,
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="#6C4DFF"
                        style={{
                          marginRight: 8,
                          display: "inline-block",
                          verticalAlign: "middle",
                        }}
                      >
                        <path d="M7 8h10v2H7zm0 4h10v2H7zm5-9L2 7v10l10 4 10-4V7l-10-4zm8 9.5l-8 3.2-8-3.2V8.5l8-3.2 8 3.2v4z" />
                      </svg>
                      Skill Complete!
                    </h2>
                    <p
                      style={{
                        color: "#9585cc",
                        fontSize: 14,
                        fontWeight: 500,
                      }}
                    >
                      You've finished all modules for{" "}
                      <span style={{ color: "#6C4DFF", fontWeight: 800 }}>
                        {session.skillName}
                      </span>
                    </p>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: 12,
                      width: "100%",
                    }}
                  >
                    {[
                      {
                        label: "Final Mastery",
                        value: `${Math.round(session.masteryScore)}%`,
                        color: "#6C4DFF",
                        icon: (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="#6C4DFF"
                          >
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                          </svg>
                        ),
                      },
                      {
                        label: "Correct",
                        value: stats.correct,
                        color: "#10B981",
                        icon: (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="#10B981"
                          >
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                        ),
                      },
                      {
                        label: "Total Qs",
                        value: stats.totalAttempts,
                        color: "#F59E0B",
                        icon: (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="#F59E0B"
                          >
                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                          </svg>
                        ),
                      },
                      {
                        label: "Accuracy",
                        value: `${accuracy}%`,
                        color: "#EF4444",
                        icon: (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="#EF4444"
                          >
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                          </svg>
                        ),
                      },
                    ].map((s) => (
                      <div key={s.label} className="stat-box">
                        <div style={{ fontSize: 20, marginBottom: 6 }}>
                          {s.icon}
                        </div>
                        <p
                          style={{
                            fontSize: 10.5,
                            color: "#b0a4e0",
                            fontWeight: 600,
                            marginBottom: 4,
                          }}
                        >
                          {s.label}
                        </p>
                        <p
                          style={{
                            fontSize: 20,
                            fontWeight: 800,
                            color: s.color,
                          }}
                        >
                          {s.value}
                        </p>
                      </div>
                    ))}
                  </div>
                  {onBack && (
                    <motion.button
                      className="primary-action-btn"
                      onClick={onBack}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{ maxWidth: 320 }}
                    >
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
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 228, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              style={{
                background: "white",
                borderLeft: "1px solid #ede9ff",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: 228,
                  height: "100%",
                  overflowY: "auto",
                  padding: "20px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                {/* Mastery circle */}
                <div style={{ textAlign: "center", paddingTop: 4 }}>
                  <CircleProgress value={session.masteryScore} size={90} />
                  <p
                    style={{
                      fontSize: 11,
                      color: "#b0a4e0",
                      fontWeight: 700,
                      marginTop: 6,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    Mastery Score
                  </p>
                </div>

                {/* Session stats */}
                <div
                  style={{
                    background: "#faf9ff",
                    borderRadius: 16,
                    padding: "14px",
                    border: "1.5px solid #ede9ff",
                  }}
                >
                  <p className="section-label">This Session</p>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {[
                      {
                        label: "Correct",
                        value: stats.correct,
                        color: "#10B981",
                        icon: (
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="#10B981"
                          >
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                        ),
                      },
                      {
                        label: "Incorrect",
                        value: stats.incorrect,
                        color: "#EF4444",
                        icon: (
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="#EF4444"
                          >
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                          </svg>
                        ),
                      },
                      {
                        label: "Attempts",
                        value: stats.totalAttempts,
                        color: "#6C4DFF",
                        icon: (
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="#6C4DFF"
                          >
                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                          </svg>
                        ),
                      },
                      {
                        label: "Accuracy",
                        value: `${accuracy}%`,
                        color: "#F59E0B",
                        icon: (
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="#F59E0B"
                          >
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                          </svg>
                        ),
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px 10px",
                          background: "white",
                          borderRadius: 10,
                          border: "1px solid #ede9ff",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            color: "#7c6bc4",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {s.icon}
                          {s.label}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: s.color,
                          }}
                        >
                          {s.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Adaptive difficulty */}
                <div
                  style={{
                    background: "#faf9ff",
                    borderRadius: 16,
                    padding: "14px",
                    border: "1.5px solid #ede9ff",
                  }}
                >
                  <p className="section-label">Adaptive Level</p>
                  <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
                    {(
                      ["simplified", "standard", "advanced"] as Difficulty[]
                    ).map((d) => {
                      const di = getDifficultyInfo(d);
                      return (
                        <div
                          key={d}
                          style={{
                            flex: 1,
                            height: 6,
                            borderRadius: 99,
                            background: d === difficulty ? di.color : "#ede9ff",
                            transition: "all 0.3s",
                          }}
                        />
                      );
                    })}
                  </div>
                  <p
                    style={{
                      fontSize: 12.5,
                      fontWeight: 800,
                      color: diffInfo.color,
                    }}
                  >
                    {diffInfo.icon} {diffInfo.label}
                  </p>
                  <p
                    style={{
                      fontSize: 10.5,
                      color: "#c4b8e8",
                      fontWeight: 500,
                      marginTop: 2,
                    }}
                  >
                    Auto-adapts to your performance
                  </p>
                </div>

                {/* Confidence */}
                <div
                  style={{
                    background: "#faf9ff",
                    borderRadius: 16,
                    padding: "14px",
                    border: "1.5px solid #ede9ff",
                  }}
                >
                  <p className="section-label">Confidence</p>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: "#2d1f6e",
                      textTransform: "capitalize",
                    }}
                  >
                    {session.confidenceLevel}
                  </p>
                </div>

                {/* Stretch task */}
                {session.stretchTask && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: "linear-gradient(135deg, #6C4DFF, #5A3FE6)",
                      borderRadius: 16,
                      padding: "16px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: "rgba(255,255,255,0.7)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        marginBottom: 6,
                      }}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="rgba(255,255,255,0.7)"
                        style={{
                          display: "inline-block",
                          verticalAlign: "middle",
                          marginRight: 6,
                        }}
                      >
                        <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
                      </svg>
                      Stretch Challenge
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.8)",
                        lineHeight: 1.6,
                        fontWeight: 500,
                        marginBottom: 12,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {session.stretchTask.description}
                    </p>
                    <button
                      onClick={() => {
                        setCurrentQuestion(session.stretchTask!.description);
                        setUserAnswer("");
                        setPhase("question");
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: 10,
                        border: "1.5px solid rgba(255,255,255,0.35)",
                        background: "rgba(255,255,255,0.12)",
                        color: "white",
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: "pointer",
                        fontFamily: "'Nunito', sans-serif",
                        transition: "all 0.2s",
                      }}
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
