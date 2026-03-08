import { motion } from "framer-motion";
import { User } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface DashboardProps {
  user: User;
  onCreateSkill: () => void;
  onOpenLibrary: () => void;
}

/**
 * Dashboard Component
 *
 * Clean, minimalist dashboard with violet/white theme.
 * Central robot logo orb with floating action cards.
 *
 * Requirements: 7.1, 7.2, 7.5, 7.6
 */
export default function Dashboard({
  user,
  onCreateSkill,
  onOpenLibrary,
}: DashboardProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#faf9ff",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap');

        * { box-sizing: border-box; }

        .nav-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 8px 16px; border-radius: 50px;
          border: none; background: transparent;
          font-family: 'Nunito', sans-serif;
          font-size: 13px; font-weight: 700;
          color: #7c6bc4; cursor: pointer;
          transition: all 0.2s ease;
        }
        .nav-btn:hover {
          background: #ede9ff;
          color: #6C4DFF;
        }

        .action-card {
          background: white;
          border: 1.5px solid #ede9ff;
          border-radius: 20px;
          padding: 28px 26px;
          cursor: pointer;
          transition: all 0.25s ease;
          text-align: left;
          width: 100%;
          font-family: 'Nunito', sans-serif;
          box-shadow: 0 2px 12px rgba(108,77,255,0.06);
        }
        .action-card:hover {
          border-color: #6C4DFF;
          box-shadow: 0 8px 32px rgba(108,77,255,0.14);
          transform: translateY(-3px);
        }
        .action-card.primary {
          background: linear-gradient(135deg, #6C4DFF 0%, #5A3FE6 100%);
          border-color: transparent;
          box-shadow: 0 8px 28px rgba(108,77,255,0.32);
        }
        .action-card.primary:hover {
          box-shadow: 0 14px 40px rgba(108,77,255,0.42);
          border-color: transparent;
        }

        .icon-wrap {
          width: 44px; height: 44px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
        }

        .card-title {
          font-family: 'Syne', sans-serif;
          font-size: 17px; font-weight: 700;
          margin-bottom: 6px; line-height: 1.2;
        }
        .card-desc {
          font-size: 13px; line-height: 1.65;
          font-weight: 500;
        }
        .card-cta {
          margin-top: 18px;
          font-size: 12px; font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          display: flex; align-items: center; gap: 5px;
        }

        .pulse-ring {
          position: absolute;
          border-radius: 50%;
          border: 2px solid rgba(108,77,255,0.25);
          animation: pulseRing 2.8s ease-out infinite;
        }
        .pulse-ring:nth-child(2) { animation-delay: 0.9s; }
        .pulse-ring:nth-child(3) { animation-delay: 1.8s; }

        @keyframes pulseRing {
          0%   { width: 140px; height: 140px; opacity: 0.7; transform: translate(-50%,-50%) scale(1); }
          100% { width: 260px; height: 260px; opacity: 0; transform: translate(-50%,-50%) scale(1); }
        }

        .center-btn {
          position: relative; z-index: 2;
          width: 120px; height: 120px; border-radius: 50%;
          background: linear-gradient(145deg, #7c5fff, #5A3FE6);
          border: none; cursor: default;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 12px 40px rgba(108,77,255,0.45), 0 0 0 6px rgba(108,77,255,0.12);
        }

        .divider {
          width: 1px;
          background: #ede9ff;
          height: 24px;
          margin: 0 4px;
        }

        /* Responsive grid */
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          width: 100%;
          max-width: 860px;
          margin: 0 auto;
        }
        @media (max-width: 720px) {
          .cards-grid {
            grid-template-columns: 1fr;
            max-width: 400px;
          }
        }
        @media (min-width: 721px) and (max-width: 960px) {
          .cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .greeting-area {
          text-align: center;
          margin-bottom: 52px;
        }

        .center-orb-wrap {
          position: relative;
          width: 120px; height: 120px;
          margin: 0 auto 56px;
          display: flex; align-items: center; justify-content: center;
        }
      `}</style>

      {/* ── Navbar ── */}
      <header
        style={{
          background: "white",
          borderBottom: "1px solid #ede9ff",
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 20,
          boxShadow: "0 1px 16px rgba(108,77,255,0.06)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #6C4DFF, #5A3FE6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(108,77,255,0.35)",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="20px"
              viewBox="0 -960 960 960"
              width="20px"
              fill="white"
            >
              <path d="M200-120q-33 0-56.5-23.5T120-200v-400q0-100 70-170t170-70h240q100 0 170 70t70 170v400q0 33-23.5 56.5T760-120H200Zm0-80h560v-400q0-66-47-113t-113-47H360q-66 0-113 47t-47 113v400Zm103.5-303.5Q280-527 280-560t23.5-56.5Q327-640 360-640t56.5 23.5Q440-593 440-560t-23.5 56.5Q393-480 360-480t-56.5-23.5Zm240 0Q520-527 520-560t23.5-56.5Q567-640 600-640t56.5 23.5Q680-593 680-560t-23.5 56.5Q633-480 600-480t-56.5-23.5ZM280-200v-80q0-33 23.5-56.5T360-360h240q33 0 56.5 23.5T680-280v80h-80v-80h-80v80h-80v-80h-80v80h-80Zm-80 0h560-560Z" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 16,
              color: "#2d1f6e",
              letterSpacing: "-0.2px",
            }}
          >
            AI Skill Mentor
          </span>
        </div>

        {/* Nav right */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Profile */}
          <button className="nav-btn" style={{ gap: 8 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6C4DFF, #8B5CF6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 12,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <span style={{ display: "none" }} className="sm-show">
              {user.name}
            </span>
          </button>

          <div className="divider" />

          <button className="nav-btn" onClick={handleLogout}>
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "56px 24px 48px",
        }}
      >
        {/* Greeting */}
        <motion.div
          className="greeting-area"
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#a598d8",
              marginBottom: 8,
            }}
          >
            Your Dashboard
          </p>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "clamp(22px, 4vw, 34px)",
              fontWeight: 800,
              color: "#2d1f6e",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Welcome back, {user.name}
          </h1>
          <p
            style={{
              marginTop: 10,
              color: "#9585cc",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Your adaptive learning journey continues.
          </p>
        </motion.div>

        {/* Center orb with pulse rings */}
        <motion.div
          className="center-orb-wrap"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Pulse rings — absolutely positioned, centered via left/top 50% */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="pulse-ring"
              style={{ position: "absolute", left: "50%", top: "50%" }}
            />
          ))}

          {/* Center button */}
          <motion.div
            className="center-btn"
            whileHover={{ scale: 1.07 }}
            transition={{ type: "spring", stiffness: 380, damping: 18 }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="56px"
              viewBox="0 -960 960 960"
              width="56px"
              fill="white"
            >
              <path d="M200-120q-33 0-56.5-23.5T120-200v-400q0-100 70-170t170-70h240q100 0 170 70t70 170v400q0 33-23.5 56.5T760-120H200Zm0-80h560v-400q0-66-47-113t-113-47H360q-66 0-113 47t-47 113v400Zm103.5-303.5Q280-527 280-560t23.5-56.5Q327-640 360-640t56.5 23.5Q440-593 440-560t-23.5 56.5Q393-480 360-480t-56.5-23.5Zm240 0Q520-527 520-560t23.5-56.5Q567-640 600-640t56.5 23.5Q680-593 680-560t-23.5 56.5Q633-480 600-480t-56.5-23.5ZM280-200v-80q0-33 23.5-56.5T360-360h240q33 0 56.5 23.5T680-280v80h-80v-80h-80v80h-80v-80h-80v80h-80Zm-80 0h560-560Z" />
            </svg>
          </motion.div>
        </motion.div>

        {/* Action cards */}
        <motion.div
          className="cards-grid"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          {/* Create Skill — primary */}
          <motion.button
            onClick={onCreateSkill}
            className="action-card primary"
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <div
              className="icon-wrap"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <svg
                width="22"
                height="22"
                fill="none"
                stroke="white"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <div className="card-title" style={{ color: "white" }}>
              Create Skill
            </div>
            <div
              className="card-desc"
              style={{ color: "rgba(255,255,255,0.72)" }}
            >
              Define a new skill and let AI build a personalised learning
              roadmap for you.
            </div>
            <div
              className="card-cta"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              Get started
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
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </div>
          </motion.button>

          {/* Library */}
          <motion.button
            onClick={onOpenLibrary}
            className="action-card"
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <div className="icon-wrap" style={{ background: "#ede9ff" }}>
              <svg
                width="22"
                height="22"
                fill="none"
                stroke="#6C4DFF"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div className="card-title" style={{ color: "#2d1f6e" }}>
              Your Library
            </div>
            <div className="card-desc" style={{ color: "#9585cc" }}>
              Browse all your saved skills and continue tracking your mastery
              progress.
            </div>
            <div className="card-cta" style={{ color: "#6C4DFF" }}>
              Browse skills
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
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </div>
          </motion.button>

          {/* Profile */}
          <motion.button
            className="action-card"
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
          >
            <div className="icon-wrap" style={{ background: "#ede9ff" }}>
              <svg
                width="22"
                height="22"
                fill="none"
                stroke="#6C4DFF"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div className="card-title" style={{ color: "#2d1f6e" }}>
              Profile
            </div>
            <div className="card-desc" style={{ color: "#9585cc" }}>
              View and update your personal info, preferences and learning
              settings.
            </div>
            <div className="card-cta" style={{ color: "#6C4DFF" }}>
              View profile
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
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </div>
          </motion.button>
        </motion.div>

        {/* Footer tagline */}
        <motion.p
          style={{
            marginTop: 52,
            color: "#c4b8e8",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.05em",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Adaptive AI Skill Mentor — Learn smarter, not harder.
        </motion.p>
      </main>
    </div>
  );
}
