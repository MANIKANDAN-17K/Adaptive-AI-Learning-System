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
 * Requirements: 2.1, 2.3, 2.4, 3.1, 3.2, 3.4, 3.5
 */
export default function SkillCreationFlow({ userId, onComplete, onCancel }: SkillCreationFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>('form');
  const [formData, setFormData] = useState<SkillFormData>({ skillName: '', goal: '', timeline: 30 });
  const [createdSkill, setCreatedSkill] = useState<Skill | null>(null);
  const [personalityProfile, setPersonalityProfile] = useState<PersonalityProfile | null>(null);
  const [needsCharacterAnalysis, setNeedsCharacterAnalysis] = useState(false);
  const [errors, setErrors] = useState<Partial<SkillFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [generatingStage, setGeneratingStage] = useState(0);

  const generatingStages = [
    { label: 'Analysing your goal…',         icon: '🎯' },
    { label: 'Structuring learning modules…', icon: '📚' },
    { label: 'Personalising your roadmap…',   icon: '🤖' },
    { label: 'Almost ready!',                 icon: '✨' },
  ];

  // Cycle through generating stages for visual feedback
  useEffect(() => {
    if (currentStep !== 'generating-roadmap') return;
    const interval = setInterval(() => {
      setGeneratingStage(s => (s + 1) % generatingStages.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [currentStep]);

  const validateForm = (): boolean => {
    const newErrors: Partial<SkillFormData> = {};
    if (!formData.skillName || formData.skillName.trim() === '') newErrors.skillName = 'Skill name cannot be empty';
    if (!formData.goal || formData.goal.trim() === '') newErrors.goal = 'Please describe your learning goal';
    if (!formData.timeline || formData.timeline <= 0 || isNaN(formData.timeline)) newErrors.timeline = 'Timeline must be a positive number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const response = await apiClient.characterAnalysis.getProfile(userId);
        if (response.profile) setPersonalityProfile(response.profile);
      } catch (err) {
        console.error('Failed to check personality profile:', err);
      }
    };
    checkProfile();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const response = await apiClient.skills.createSkill(formData.skillName, formData.goal, formData.timeline);
      setCreatedSkill(response.skill);
      if (response.needsCharacterAnalysis && !personalityProfile) {
        setNeedsCharacterAnalysis(true);
        setCurrentStep('character-analysis');
      } else {
        await generateRoadmap(response.skill, personalityProfile);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create skill');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCharacterAnalysisComplete = async (profile: PersonalityProfile) => {
    setPersonalityProfile(profile);
    if (createdSkill) await generateRoadmap(createdSkill, profile);
  };

  const handleCharacterAnalysisSkip = async () => {
    if (createdSkill && personalityProfile) await generateRoadmap(createdSkill, personalityProfile);
  };

  const generateRoadmap = async (skill: Skill, profile: PersonalityProfile | null) => {
    setCurrentStep('generating-roadmap');
    setError(null);
    try {
      const profileToUse = profile || { user_id: userId, tone_type: 'Professional', confidence_level: 'medium', motivation_index: 50 };
      await apiClient.roadmaps.generateRoadmap(skill.id, skill.skill_name, skill.goal, skill.timeline, profileToUse);
      onComplete(skill.id);
    } catch (err: any) {
      setError(err.message || 'Failed to generate roadmap');
      setCurrentStep('form');
    }
  };

  const handleChange = (field: keyof SkillFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const timelinePresets = [
    { label: '1 Week',   days: 7,   icon: '⚡' },
    { label: '1 Month',  days: 30,  icon: '📅' },
    { label: '3 Months', days: 90,  icon: '🗓️' },
    { label: '6 Months', days: 180, icon: '🏆' },
  ];

  const skillSuggestions = ['Python Programming', 'UI/UX Design', 'Public Speaking', 'Data Analysis', 'Guitar', 'Spanish Language'];

  // ── Character Analysis ──
  if (currentStep === 'character-analysis') {
    return (
      <CharacterAnalysis
        userId={userId}
        onComplete={handleCharacterAnalysisComplete}
        onSkip={personalityProfile ? handleCharacterAnalysisSkip : undefined}
      />
    );
  }

  // ── Generating Roadmap ──
  if (currentStep === 'generating-roadmap') {
    return (
      <div style={{ minHeight: '100vh', background: '#faf9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Nunito', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Syne:wght@700;800&display=swap');`}</style>
        <motion.div
          style={{ textAlign: 'center', background: 'white', borderRadius: 28, padding: '52px 48px', maxWidth: 400, width: '100%', border: '1.5px solid #ede9ff', boxShadow: '0 16px 56px rgba(108,77,255,0.14)' }}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Animated orb */}
          <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 32px' }}>
            <motion.div
              style={{ position: 'absolute', inset: -10, borderRadius: '50%', border: '2px solid rgba(108,77,255,0.15)' }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              style={{ position: 'absolute', inset: -20, borderRadius: '50%', border: '2px solid rgba(108,77,255,0.08)' }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            />
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, #6C4DFF, #5A3FE6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(108,77,255,0.38)' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" height="44px" viewBox="0 -960 960 960" width="44px" fill="white">
                  <path d="M200-120q-33 0-56.5-23.5T120-200v-400q0-100 70-170t170-70h240q100 0 170 70t70 170v400q0 33-23.5 56.5T760-120H200Zm0-80h560v-400q0-66-47-113t-113-47H360q-66 0-113 47t-47 113v400Zm103.5-303.5Q280-527 280-560t23.5-56.5Q327-640 360-640t56.5 23.5Q440-593 440-560t-23.5 56.5Q393-480 360-480t-56.5-23.5Zm240 0Q520-527 520-560t23.5-56.5Q567-640 600-640t56.5 23.5Q680-593 680-560t-23.5 56.5Q633-480 600-480t-56.5-23.5ZM280-200v-80q0-33 23.5-56.5T360-360h240q33 0 56.5 23.5T680-280v80h-80v-80h-80v80h-80v-80h-80v80h-80Zm-80 0h560-560Z"/>
                </svg>
              </motion.div>
            </div>
          </div>

          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: '#2d1f6e', marginBottom: 10 }}>
            Building Your Roadmap
          </h2>

          <AnimatePresence mode="wait">
            <motion.div
              key={generatingStage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              style={{ marginBottom: 28 }}
            >
              <span style={{ fontSize: 20, marginRight: 8 }}>{generatingStages[generatingStage].icon}</span>
              <span style={{ color: '#9585cc', fontSize: 14, fontWeight: 600 }}>{generatingStages[generatingStage].label}</span>
            </motion.div>
          </AnimatePresence>

          {/* Progress steps */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            {generatingStages.map((_, i) => (
              <motion.div key={i}
                style={{ height: 4, borderRadius: 99, background: i <= generatingStage ? '#6C4DFF' : '#ede9ff', transition: 'background 0.3s' }}
                animate={{ width: i === generatingStage ? 28 : 12 }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ marginTop: 20, padding: '12px 16px', borderRadius: 12, background: '#fff5f5', border: '1.5px solid #fecaca' }}
            >
              <p style={{ color: '#e05252', fontSize: 13 }}>{error}</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  // ── Form ──
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
        .nav-back-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .form-field-wrap { position: relative; }

        .form-input {
          width: 100%;
          padding: 14px 18px 14px 48px;
          border-radius: 14px;
          border: 1.5px solid #e5dfff;
          background: #faf9ff;
          font-size: 14px;
          color: #2d1f6e;
          outline: none;
          font-family: 'Nunito', sans-serif;
          font-weight: 600;
          transition: all 0.22s ease;
          resize: none;
        }
        .form-input::placeholder { color: #c4b8e8; font-weight: 500; }
        .form-input:focus {
          border-color: #6C4DFF;
          background: white;
          box-shadow: 0 0 0 4px rgba(108,77,255,0.1);
        }
        .form-input.error { border-color: #f87171; box-shadow: 0 0 0 3px rgba(248,113,113,0.12); }
        .form-input:disabled { opacity: 0.6; cursor: not-allowed; }

        .field-icon {
          position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
          color: #c4b8e8; pointer-events: none; transition: color 0.2s;
        }
        .field-icon.textarea-icon { top: 18px; transform: none; }
        .field-focused .field-icon { color: #6C4DFF; }

        .field-label {
          display: flex; align-items: center; gap: 7px;
          font-size: 13px; font-weight: 800;
          color: #2d1f6e; margin-bottom: 8px;
          letter-spacing: 0.02em;
        }
        .label-badge {
          padding: 2px 9px; border-radius: 50px;
          background: #ede9ff; color: #6C4DFF;
          font-size: 10px; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .timeline-preset {
          flex: 1; padding: 10px 8px;
          border-radius: 12px;
          border: 1.5px solid #e5dfff;
          background: white;
          font-family: 'Nunito', sans-serif;
          font-size: 12px; font-weight: 700;
          color: #9585cc; cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }
        .timeline-preset:hover { border-color: #6C4DFF; color: #6C4DFF; background: #faf9ff; }
        .timeline-preset.active {
          border-color: #6C4DFF;
          background: linear-gradient(135deg, #6C4DFF, #5A3FE6);
          color: white; box-shadow: 0 4px 14px rgba(108,77,255,0.3);
        }

        .suggestion-chip {
          padding: 6px 14px; border-radius: 50px;
          border: 1.5px solid #e5dfff;
          background: white;
          font-family: 'Nunito', sans-serif;
          font-size: 12px; font-weight: 700;
          color: #9585cc; cursor: pointer;
          transition: all 0.18s;
          white-space: nowrap;
        }
        .suggestion-chip:hover { border-color: #6C4DFF; color: #6C4DFF; background: #faf9ff; transform: translateY(-1px); }

        .submit-btn {
          width: 100%; padding: 15px;
          border-radius: 14px; border: none;
          background: linear-gradient(135deg, #6C4DFF 0%, #5A3FE6 100%);
          color: white; font-family: 'Nunito', sans-serif;
          font-size: 14px; font-weight: 800;
          letter-spacing: 0.06em; text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 6px 24px rgba(108,77,255,0.38);
          transition: all 0.25s ease;
        }
        .submit-btn:hover:not(:disabled) { box-shadow: 0 12px 36px rgba(108,77,255,0.48); transform: translateY(-2px); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .info-card {
          border-radius: 16px;
          border: 1.5px solid #e5dfff;
          background: linear-gradient(135deg, #faf9ff, white);
          padding: 20px 22px;
          display: flex; gap: 14px; align-items: flex-start;
        }

        @media (max-width: 700px) {
          .form-layout { flex-direction: column !important; }
          .side-panel { display: none !important; }
        }
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
        {onCancel && (
          <button className="nav-back-btn" onClick={onCancel} disabled={isSubmitting}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Dashboard
          </button>
        )}
      </header>

      {/* ── Hero Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #6C4DFF 0%, #7C3AED 50%, #5A3FE6 100%)',
        padding: '38px 28px 46px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: -60, right: -40 }} />
        <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', bottom: -40, left: '25%' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 860, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              {['Skill Details', 'Personality Check', 'Your Roadmap'].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: i === 0 ? 'white' : 'rgba(255,255,255,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800,
                    color: i === 0 ? '#6C4DFF' : 'rgba(255,255,255,0.7)',
                  }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? 'white' : 'rgba(255,255,255,0.5)' }}>{step}</span>
                  {i < 2 && <div style={{ width: 24, height: 1, background: 'rgba(255,255,255,0.25)' }} />}
                </div>
              ))}
            </div>

            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, color: 'white', margin: '0 0 8px', lineHeight: 1.2 }}>
              Create a New Skill
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: 500 }}>
              Tell us what you want to learn — AI will build your personalised roadmap.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, maxWidth: 900, margin: '0 auto', width: '100%', padding: '36px 24px 60px' }}>
        <div className="form-layout" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

          {/* ── Main Form Card ── */}
          <motion.div
            style={{ flex: 1, background: 'white', borderRadius: 24, border: '1.5px solid #ede9ff', boxShadow: '0 4px 28px rgba(108,77,255,0.08)', overflow: 'hidden' }}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Card header */}
            <div style={{ padding: '24px 28px 0', borderBottom: '1px solid #f3f0ff', paddingBottom: 20, marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 13, background: 'linear-gradient(135deg, #6C4DFF, #5A3FE6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(108,77,255,0.3)' }}>
                  <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                  </svg>
                </div>
                <div>
                  <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: '#2d1f6e', margin: 0 }}>Skill Details</h2>
                  <p style={{ color: '#b0a4e0', fontSize: 12, fontWeight: 500, margin: '2px 0 0' }}>Fill in the details below to get started</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '0 28px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Skill Name */}
              <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                <div className="field-label">
                  <span>Skill Name</span>
                  <span className="label-badge">Required</span>
                </div>
                <div className={`form-field-wrap${focusedField === 'skillName' ? ' field-focused' : ''}`}>
                  <span className="field-icon">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={formData.skillName}
                    onChange={e => handleChange('skillName', e.target.value)}
                    onFocus={() => setFocusedField('skillName')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="e.g., Python Programming, Guitar, Public Speaking"
                    disabled={isSubmitting}
                    className={`form-input${errors.skillName ? ' error' : ''}`}
                  />
                </div>

                {/* Suggestion chips */}
                {!formData.skillName && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 10 }}>
                    {skillSuggestions.map(s => (
                      <button key={s} type="button" className="suggestion-chip" onClick={() => handleChange('skillName', s)}>
                        {s}
                      </button>
                    ))}
                  </motion.div>
                )}

                <AnimatePresence>
                  {errors.skillName && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      style={{ marginTop: 7, fontSize: 12, color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 8v4m0 4h.01"/></svg>
                      {errors.skillName}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Goal */}
              <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 }}>
                <div className="field-label">
                  <span>Learning Goal</span>
                  <span className="label-badge">Required</span>
                </div>
                <div className={`form-field-wrap${focusedField === 'goal' ? ' field-focused' : ''}`}>
                  <span className="field-icon textarea-icon">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                  </span>
                  <textarea
                    value={formData.goal}
                    onChange={e => handleChange('goal', e.target.value)}
                    onFocus={() => setFocusedField('goal')}
                    onBlur={() => setFocusedField(null)}
                    rows={4}
                    placeholder="Describe what you want to achieve — e.g., 'I want to build web apps using Python and Django within 3 months.'"
                    disabled={isSubmitting}
                    className={`form-input${errors.goal ? ' error' : ''}`}
                    style={{ paddingTop: 14 }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <AnimatePresence>
                    {errors.goal ? (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ fontSize: 12, color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 8v4m0 4h.01"/></svg>
                        {errors.goal}
                      </motion.p>
                    ) : <span />}
                  </AnimatePresence>
                  <span style={{ fontSize: 11, color: '#c4b8e8', fontWeight: 600 }}>{formData.goal.length} chars</span>
                </div>
              </motion.div>

              {/* Timeline */}
              <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.29 }}>
                <div className="field-label">
                  <span>Timeline</span>
                  <span className="label-badge">Required</span>
                </div>

                {/* Preset buttons */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {timelinePresets.map(p => (
                    <button
                      key={p.days} type="button"
                      className={`timeline-preset${formData.timeline === p.days ? ' active' : ''}`}
                      onClick={() => handleChange('timeline', p.days)}
                    >
                      <div style={{ fontSize: 16, marginBottom: 2 }}>{p.icon}</div>
                      <div>{p.label}</div>
                      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 1 }}>{p.days}d</div>
                    </button>
                  ))}
                </div>

                {/* Custom input */}
                <div className={`form-field-wrap${focusedField === 'timeline' ? ' field-focused' : ''}`}>
                  <span className="field-icon">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 6v6l4 2"/>
                    </svg>
                  </span>
                  <input
                    type="number" min="1"
                    value={formData.timeline}
                    onChange={e => handleChange('timeline', parseInt(e.target.value) || 0)}
                    onFocus={() => setFocusedField('timeline')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Custom days"
                    disabled={isSubmitting}
                    className={`form-input${errors.timeline ? ' error' : ''}`}
                  />
                </div>
                <p style={{ marginTop: 6, fontSize: 12, color: '#c4b8e8', fontWeight: 500 }}>Or enter a custom number of days above.</p>
                <AnimatePresence>
                  {errors.timeline && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ marginTop: 6, fontSize: 12, color: '#ef4444', fontWeight: 600 }}>{errors.timeline}</motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* API Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ padding: '12px 16px', borderRadius: 12, background: '#fff5f5', border: '1.5px solid #fecaca', display: 'flex', alignItems: 'center', gap: 10 }}
                  >
                    <svg width="16" height="16" fill="none" stroke="#ef4444" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <p style={{ color: '#e05252', fontSize: 13, fontWeight: 600 }}>{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}>
                <button type="submit" disabled={isSubmitting} className="submit-btn">
                  {isSubmitting ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <svg style={{ animation: 'spin 0.9s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3"/>
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                      </svg>
                      Creating your skill…
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      Create My Skill
                      <svg width="16" height="16" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                      </svg>
                    </span>
                  )}
                </button>
              </motion.div>
            </form>
          </motion.div>

          {/* ── Side Panel ── */}
          <motion.div
            className="side-panel"
            style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {/* How it works */}
            <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #ede9ff', padding: '22px', boxShadow: '0 2px 16px rgba(108,77,255,0.06)' }}>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, color: '#2d1f6e', marginBottom: 16 }}>How it works</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { step: '01', title: 'Name your skill',   desc: 'Tell us what you want to learn.' },
                  { step: '02', title: 'Set your goal',     desc: 'Define your target outcome clearly.' },
                  { step: '03', title: 'Pick a timeline',   desc: 'How long do you want to learn?' },
                  { step: '04', title: 'AI builds roadmap', desc: 'Get a personalised learning plan.' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 9, background: '#ede9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#6C4DFF', flexShrink: 0 }}>
                      {item.step}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#2d1f6e', marginBottom: 2 }}>{item.title}</div>
                      <div style={{ fontSize: 11.5, color: '#b0a4e0', fontWeight: 500, lineHeight: 1.5 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div style={{ background: 'linear-gradient(135deg, #6C4DFF, #5A3FE6)', borderRadius: 20, padding: '22px', boxShadow: '0 6px 24px rgba(108,77,255,0.3)' }}>
              <div style={{ fontSize: 20, marginBottom: 10 }}>💡</div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, color: 'white', marginBottom: 8 }}>Pro Tip</h3>
              <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, lineHeight: 1.65, fontWeight: 500 }}>
                The more specific your learning goal, the better your AI-generated roadmap will be. Include your current level and what outcome you want.
              </p>
            </div>

            {/* Already have skills? */}
            {onCancel && (
              <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #ede9ff', padding: '18px 20px', textAlign: 'center', boxShadow: '0 2px 12px rgba(108,77,255,0.05)' }}>
                <p style={{ fontSize: 12, color: '#b0a4e0', fontWeight: 600, marginBottom: 10 }}>Already learning something?</p>
                <button onClick={onCancel} style={{ padding: '8px 20px', borderRadius: 50, border: '1.5px solid #ddd6fe', background: 'transparent', fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 800, color: '#6C4DFF', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = '#ede9ff'; }}
                  onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  Go to Library
                </button>
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  );
}