import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
 * Displays all user skills in a rich education-platform card grid.
 * Violet & white theme. Allows users to select a skill to resume learning.
 *
 * Requirements: 6.1, 6.2, 6.3
 */
export default function Library({ userId, onSkillSelect, onBack }: LibraryProps) {
  const [skills, setSkills] = useState<SkillCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'mastered'>('all');

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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString();
  };

  const getMasteryInfo = (level: number): { label: string; bg: string; text: string; dot: string } => {
    if (level >= 80) return { label: 'Expert',       bg: '#f0fdf4', text: '#16a34a', dot: '#22c55e' };
    if (level >= 60) return { label: 'Advanced',     bg: '#eff6ff', text: '#2563eb', dot: '#3b82f6' };
    if (level >= 40) return { label: 'Intermediate', bg: '#fffbeb', text: '#d97706', dot: '#f59e0b' };
    if (level >= 20) return { label: 'Beginner',     bg: '#fff7ed', text: '#ea580c', dot: '#f97316' };
    return               { label: 'Starting',       bg: '#faf9ff', text: '#7c6bc4', dot: '#a78bfa' };
  };

  // Category icon cycling
  const categoryIcons = [
    // Code
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>,
    // Brain
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>,
    // Chart
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
    // Globe
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
    // Star
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    // Zap
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
  ];

  const cardGradients = [
    { from: '#6C4DFF', to: '#8B5CF6' },
    { from: '#7C3AED', to: '#6C4DFF' },
    { from: '#5A3FE6', to: '#7C3AED' },
    { from: '#4F46E5', to: '#6C4DFF' },
    { from: '#8B5CF6', to: '#5A3FE6' },
    { from: '#6D28D9', to: '#8B5CF6' },
  ];

  const filteredSkills = skills.filter(s => {
    if (filter === 'mastered') return s.masteryLevel >= 80;
    if (filter === 'in-progress') return s.masteryLevel < 80;
    return true;
  });

  // ── Loading ──
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#faf9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Syne:wght@700;800&display=swap');`}</style>
        <motion.div style={{ textAlign: 'center' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div
            style={{ width: 52, height: 52, border: '4px solid #ede9ff', borderTopColor: '#6C4DFF', borderRadius: '50%', margin: '0 auto 18px' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
          />
          <p style={{ color: '#9585cc', fontSize: 14, fontWeight: 600 }}>Loading your skills…</p>
        </motion.div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#faf9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Nunito', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Syne:wght@700;800&display=swap');`}</style>
        <motion.div
          style={{ textAlign: 'center', maxWidth: 420, background: 'white', borderRadius: 24, padding: 48, border: '1.5px solid #ede9ff', boxShadow: '0 8px 32px rgba(108,77,255,0.1)' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ width: 56, height: 56, borderRadius: 18, background: '#fff5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="26" height="26" fill="none" stroke="#ef4444" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: '#2d1f6e', marginBottom: 8 }}>Failed to Load Skills</h2>
          <p style={{ color: '#9585cc', fontSize: 13, marginBottom: 28 }}>{error}</p>
          {onBack && (
            <motion.button onClick={onBack} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{ padding: '12px 28px', borderRadius: 50, border: 'none', background: 'linear-gradient(135deg, #6C4DFF, #5A3FE6)', color: 'white', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", boxShadow: '0 6px 20px rgba(108,77,255,0.35)' }}>
              Go Back
            </motion.button>
          )}
        </motion.div>
      </div>
    );
  }

  // ── Empty ──
  if (skills.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#faf9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Nunito', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Syne:wght@700;800&display=swap');`}</style>
        <motion.div
          style={{ textAlign: 'center', maxWidth: 440, background: 'white', borderRadius: 28, padding: 56, border: '1.5px solid #ede9ff', boxShadow: '0 12px 40px rgba(108,77,255,0.1)' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ width: 88, height: 88, borderRadius: 28, background: 'linear-gradient(135deg, #ede9ff, #ddd6fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
            <svg width="40" height="40" fill="none" stroke="#6C4DFF" viewBox="0 0 24 24" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
          </div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: '#2d1f6e', marginBottom: 10 }}>Your Library is Empty</h2>
          <p style={{ color: '#9585cc', fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>You haven't created any skills yet. Start your learning journey by creating your first skill.</p>
          {onBack && (
            <motion.button onClick={onBack} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{ padding: '13px 32px', borderRadius: 50, border: 'none', background: 'linear-gradient(135deg, #6C4DFF, #5A3FE6)', color: 'white', fontWeight: 800, fontSize: 13, cursor: 'pointer', letterSpacing: '0.05em', fontFamily: "'Nunito', sans-serif", boxShadow: '0 6px 24px rgba(108,77,255,0.38)' }}>
              Create Your First Skill
            </motion.button>
          )}
        </motion.div>
      </div>
    );
  }

  // ── Main Library ──
  return (
    <div style={{ minHeight: '100vh', background: '#faf9ff', display: 'flex', flexDirection: 'column', fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; }

        .nav-back-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 50px;
          border: none; background: transparent;
          font-family: 'Nunito', sans-serif;
          font-size: 13px; font-weight: 700;
          color: #7c6bc4; cursor: pointer;
          transition: all 0.2s;
        }
        .nav-back-btn:hover { background: #ede9ff; color: #6C4DFF; }

        .filter-pill {
          padding: 7px 18px; border-radius: 50px;
          border: 1.5px solid #ede9ff;
          background: white;
          font-family: 'Nunito', sans-serif;
          font-size: 12.5px; font-weight: 700;
          color: #9585cc; cursor: pointer;
          transition: all 0.2s;
        }
        .filter-pill:hover { border-color: #6C4DFF; color: #6C4DFF; }
        .filter-pill.active {
          background: linear-gradient(135deg, #6C4DFF, #5A3FE6);
          border-color: transparent; color: white;
          box-shadow: 0 4px 14px rgba(108,77,255,0.3);
        }

        .skill-card {
          background: white;
          border-radius: 22px;
          overflow: hidden;
          border: 1.5px solid #ede9ff;
          box-shadow: 0 2px 16px rgba(108,77,255,0.06);
          cursor: pointer;
          transition: all 0.28s ease;
          text-align: left;
          width: 100%;
          font-family: 'Nunito', sans-serif;
          padding: 0;
          display: flex; flex-direction: column;
        }
        .skill-card:hover {
          box-shadow: 0 16px 48px rgba(108,77,255,0.18);
          transform: translateY(-5px);
          border-color: rgba(108,77,255,0.3);
        }

        .progress-bar-bg {
          width: 100%; height: 6px;
          background: #f0ecff; border-radius: 99px; overflow: hidden;
        }

        .stat-chip {
          display: flex; align-items: center; gap: 5px;
          padding: 5px 11px; border-radius: 50px;
          background: #faf9ff;
          font-size: 11.5px; font-weight: 700; color: #9585cc;
        }

        .continue-btn {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          width: 100%; padding: 12px;
          border: none; border-radius: 12px;
          background: linear-gradient(135deg, #6C4DFF, #5A3FE6);
          color: white; font-family: 'Nunito', sans-serif;
          font-size: 12.5px; font-weight: 800; letter-spacing: 0.06em;
          text-transform: uppercase; cursor: pointer;
          transition: all 0.22s ease;
          box-shadow: 0 4px 16px rgba(108,77,255,0.28);
        }
        .continue-btn:hover { box-shadow: 0 8px 28px rgba(108,77,255,0.42); transform: translateY(-1px); }

        .stats-row {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
          margin: 14px 0;
        }
        .stat-box {
          background: #faf9ff; border-radius: 12px; padding: 10px 14px;
          border: 1px solid #ede9ff;
        }

        /* Responsive grid */
        .skills-grid {
          display: grid;
          gap: 22px;
          grid-template-columns: repeat(3, 1fr);
        }
        @media (max-width: 960px) { .skills-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .skills-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* ── Navbar ── */}
      <header style={{
        background: 'white', borderBottom: '1px solid #ede9ff',
        padding: '0 28px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 20,
        boxShadow: '0 1px 16px rgba(108,77,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #6C4DFF, #5A3FE6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(108,77,255,0.35)',
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="white">
              <path d="M200-120q-33 0-56.5-23.5T120-200v-400q0-100 70-170t170-70h240q100 0 170 70t70 170v400q0 33-23.5 56.5T760-120H200Zm0-80h560v-400q0-66-47-113t-113-47H360q-66 0-113 47t-47 113v400Zm103.5-303.5Q280-527 280-560t23.5-56.5Q327-640 360-640t56.5 23.5Q440-593 440-560t-23.5 56.5Q393-480 360-480t-56.5-23.5Zm240 0Q520-527 520-560t23.5-56.5Q567-640 600-640t56.5 23.5Q680-593 680-560t-23.5 56.5Q633-480 600-480t-56.5-23.5ZM280-200v-80q0-33 23.5-56.5T360-360h240q33 0 56.5 23.5T680-280v80h-80v-80h-80v80h-80v-80h-80v80h-80Zm-80 0h560-560Z"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: '#2d1f6e' }}>
            AI Skill Mentor
          </span>
        </div>
        {onBack && (
          <button className="nav-back-btn" onClick={onBack}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Dashboard
          </button>
        )}
      </header>

      {/* ── Hero banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #6C4DFF 0%, #7C3AED 50%, #5A3FE6 100%)',
        padding: '40px 28px 48px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Dot grid */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        {/* Blobs */}
        <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: -70, right: -40 }} />
        <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', bottom: -50, left: '30%' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8 }}>
              Learning Library
            </p>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, color: 'white', margin: '0 0 8px', lineHeight: 1.2 }}>
              Your Skills Library
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: 500 }}>
              {skills.length} {skills.length === 1 ? 'skill' : 'skills'} · Keep learning, keep growing
            </p>
          </motion.div>

          {/* Summary stats */}
          <motion.div
            style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          >
            {[
              { label: 'Total Skills', value: skills.length, icon: '📚' },
              { label: 'Mastered',     value: skills.filter(s => s.masteryLevel >= 80).length, icon: '🏆' },
              { label: 'In Progress',  value: skills.filter(s => s.masteryLevel < 80).length,  icon: '⚡' },
              { label: 'Avg Progress', value: `${Math.round(skills.reduce((a, s) => a + s.progressPercentage, 0) / skills.length)}%`, icon: '📈' },
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 14, padding: '10px 18px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 18 }}>{stat.icon}</span>
                <div>
                  <div style={{ color: 'white', fontWeight: 800, fontSize: 16, lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, marginTop: 2 }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Filter tabs + grid ── */}
      <div style={{ flex: 1, maxWidth: 1100, margin: '0 auto', width: '100%', padding: '32px 24px 48px' }}>

        {/* Filter pills */}
        <motion.div
          style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        >
          {(['all', 'in-progress', 'mastered'] as const).map(f => (
            <button
              key={f}
              className={`filter-pill${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? `All Skills (${skills.length})` : f === 'in-progress' ? `In Progress (${skills.filter(s => s.masteryLevel < 80).length})` : `Mastered (${skills.filter(s => s.masteryLevel >= 80).length})`}
            </button>
          ))}
        </motion.div>

        {/* Cards grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            className="skills-grid"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {filteredSkills.map((skill, index) => {
              const mastery = getMasteryInfo(skill.masteryLevel);
              const grad = cardGradients[index % cardGradients.length];
              const icon = categoryIcons[index % categoryIcons.length];
              const completedLessons = Math.round((skill.progressPercentage / 100) * 12);

              return (
                <motion.button
                  key={skill.id}
                  className="skill-card"
                  onClick={() => onSkillSelect(skill.id)}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.07, duration: 0.4, ease: 'easeOut' }}
                  whileTap={{ scale: 0.985 }}
                >
                  {/* Card top banner */}
                  <div style={{
                    background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`,
                    padding: '22px 22px 18px',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    {/* Subtle pattern */}
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.08, backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                    <div style={{ position: 'absolute', width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', bottom: -30, right: -20 }} />

                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      {/* Icon circle */}
                      <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: 'rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', border: '1px solid rgba(255,255,255,0.25)',
                      }}>
                        {icon}
                      </div>

                      {/* Mastery badge */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: 'rgba(255,255,255,0.18)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        padding: '4px 11px', borderRadius: 50,
                      }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: mastery.dot }} />
                        <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>{mastery.label}</span>
                      </div>
                    </div>

                    {/* Skill name */}
                    <h3 style={{
                      fontFamily: "'Syne', sans-serif",
                      color: 'white', fontSize: 18, fontWeight: 800,
                      margin: '16px 0 4px', lineHeight: 1.25,
                      position: 'relative', zIndex: 1,
                      textAlign: 'left',
                    }}>
                      {skill.skill_name}
                    </h3>

                    {/* Progress bar inside banner */}
                    <div style={{ marginTop: 14, position: 'relative', zIndex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600 }}>Progress</span>
                        <span style={{ color: 'white', fontSize: 11, fontWeight: 800 }}>{Math.round(skill.progressPercentage)}%</span>
                      </div>
                      <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.2)', borderRadius: 99, overflow: 'hidden' }}>
                        <motion.div
                          style={{ height: '100%', background: 'white', borderRadius: 99 }}
                          initial={{ width: 0 }}
                          animate={{ width: `${skill.progressPercentage}%` }}
                          transition={{ duration: 0.9, delay: index * 0.07 + 0.3, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '18px 22px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Goal */}
                    <p style={{
                      color: '#9585cc', fontSize: 13, lineHeight: 1.65,
                      fontWeight: 500, marginBottom: 14,
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      textAlign: 'left',
                    }}>
                      {skill.goal}
                    </p>

                    {/* Stats row */}
                    <div className="stats-row">
                      <div className="stat-box">
                        <div style={{ fontSize: 11, color: '#b0a4e0', fontWeight: 600, marginBottom: 3 }}>Lessons Done</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#2d1f6e' }}>{completedLessons} / 12</div>
                      </div>
                      <div className="stat-box">
                        <div style={{ fontSize: 11, color: '#b0a4e0', fontWeight: 600, marginBottom: 3 }}>Mastery Score</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#2d1f6e' }}>{skill.masteryLevel}%</div>
                      </div>
                    </div>

                    {/* Last active */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                      <svg width="13" height="13" fill="none" stroke="#b0a4e0" viewBox="0 0 24 24" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 6v6l4 2"/>
                      </svg>
                      <span style={{ color: '#b0a4e0', fontSize: 12, fontWeight: 600 }}>
                        Last active: {formatDate(skill.lastSessionDate)}
                      </span>
                    </div>

                    {/* CTA */}
                    <div style={{ marginTop: 'auto' }}>
                      <button className="continue-btn">
                        Continue Learning
                        <svg width="13" height="13" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {filteredSkills.length === 0 && (
          <motion.div
            style={{ textAlign: 'center', padding: '64px 24px', color: '#b0a4e0' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p style={{ fontWeight: 700, fontSize: 15 }}>No skills match this filter.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}