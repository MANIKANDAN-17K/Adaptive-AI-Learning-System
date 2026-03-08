/**
 * Login Component
 *
 * Provides user login interface with toggling Sign In / Sign Up
 * Requirements: 1.2, 1.4
 */

import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { APIError } from '../services/apiClient';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Sign In state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sign Up state
  const [suName, setSuName] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPassword, setSuPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isSignIn = mode === 'signin';

  const VIOLET = '#6C4DFF';
  const VIOLET_DARK = '#5A3FE6';
  const VIOLET_DEEP = '#4730C4';
  const VIOLET_LIGHT = '#EDE9FF';
  const VIOLET_MID = '#9B8AFF';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(135deg, #f3f0ff 0%, #ede9ff 50%, #e8e2ff 100%)`,
      fontFamily: "'Nunito', sans-serif",
      padding: 16,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Playfair+Display:wght@700&display=swap');

        * { box-sizing: border-box; }

        .auth-input {
          width: 100%;
          padding: 13px 16px 13px 42px;
          border-radius: 10px;
          border: 1.5px solid #ddd6fe;
          background: #f8f5ff;
          font-size: 13.5px;
          color: #3b1fa8;
          outline: none;
          font-family: 'Nunito', sans-serif;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .auth-input::placeholder { color: #a598d8; }
        .auth-input:focus {
          border-color: #6C4DFF;
          background: white;
          box-shadow: 0 0 0 3px rgba(108,77,255,0.12);
        }
        .auth-input:disabled { opacity: 0.6; cursor: not-allowed; }

        .social-icon-btn {
          width: 40px; height: 40px;
          border-radius: 50%;
          border: 1.5px solid #ddd6fe;
          background: white;
          display: flex; align-items: center; justify-content: center;
          color: #7c6bc4;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .social-icon-btn:hover {
          border-color: #6C4DFF;
          color: #6C4DFF;
          box-shadow: 0 3px 12px rgba(108,77,255,0.2);
          transform: translateY(-2px);
        }

        .primary-btn {
          width: 100%;
          padding: 13px;
          border-radius: 50px;
          border: none;
          background: linear-gradient(135deg, #6C4DFF 0%, #5A3FE6 100%);
          color: white;
          font-weight: 800;
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          font-family: 'Nunito', sans-serif;
          box-shadow: 0 6px 20px rgba(108,77,255,0.38);
          transition: all 0.25s ease;
        }
        .primary-btn:hover:not(:disabled) {
          box-shadow: 0 10px 28px rgba(108,77,255,0.48);
          transform: translateY(-1px);
        }
        .primary-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .outline-btn {
          padding: 11px 36px;
          border-radius: 50px;
          border: 2px solid white;
          background: transparent;
          color: white;
          font-weight: 800;
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          font-family: 'Nunito', sans-serif;
          transition: all 0.25s ease;
        }
        .outline-btn:hover {
          background: white;
          color: #6C4DFF;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: #ddd6fe;
        }

        .corner-accent-1 {
          position: absolute;
          top: -18px; right: -18px;
          width: 72px; height: 72px;
          border-radius: 14px;
          background: linear-gradient(135deg, #a78bfa, #7c3aed);
          transform: rotate(22deg);
          z-index: 0;
          opacity: 0.85;
        }
        .corner-accent-2 {
          position: absolute;
          bottom: -14px; left: -14px;
          width: 56px; height: 56px;
          border-radius: 12px;
          background: #c4b5fd;
          transform: rotate(-16deg);
          z-index: 0;
          opacity: 0.8;
        }

        .forgot-link {
          font-size: 12px;
          color: #a598d8;
          text-decoration: none;
          transition: color 0.2s;
        }
        .forgot-link:hover { color: #6C4DFF; }

        .toggle-link {
          color: #6C4DFF;
          font-weight: 700;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 12px;
          font-family: 'Nunito', sans-serif;
          padding: 0;
        }
      `}</style>

      <div style={{ position: 'relative' }}>
        {/* Corner decorations */}
        <div className="corner-accent-1" />
        <div className="corner-accent-2" />

        {/* Main card */}
        <motion.div
          style={{
            display: 'flex',
            width: 840,
            maxWidth: '100%',
            borderRadius: 24,
            overflow: 'hidden',
            position: 'relative',
            zIndex: 1,
            background: 'white',
            boxShadow: '0 24px 70px rgba(108,77,255,0.18), 0 4px 24px rgba(108,77,255,0.1)',
          }}
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
        >

          {/* ── Violet branding panel ── */}
          <motion.div
            layout
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            style={{
              width: '42%',
              flexShrink: 0,
              background: `linear-gradient(145deg, ${VIOLET} 0%, ${VIOLET_DARK} 55%, ${VIOLET_DEEP} 100%)`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 36px',
              position: 'relative',
              overflow: 'hidden',
              order: isSignIn ? 0 : 1,
            }}
          >
            {/* Dot grid texture */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.07,
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }} />

            {/* Glow blobs */}
            <div style={{
              position: 'absolute', width: 200, height: 200, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(167,139,250,0.3) 0%, transparent 70%)',
              top: -60, right: -60, pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', width: 160, height: 160, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 70%)',
              bottom: -40, left: -40, pointerEvents: 'none',
            }} />

            {/* Decorative diamonds */}
            {[
              { top: 58, right: 38, w: 18, op: 1 },
              { top: 86, right: 58, w: 10, op: 0.4 },
              { bottom: 110, left: 28, w: 18, op: 0.55 },
              { top: '44%', left: 16, w: 12, op: 0.35 },
            ].map((s, i) => (
              <div key={i} style={{
                width: s.w, height: s.w,
                background: 'rgba(255,255,255,0.28)',
                transform: 'rotate(45deg)',
                borderRadius: 3,
                position: 'absolute',
                top: s.top, right: s.right, bottom: s.bottom, left: s.left,
                opacity: s.op,
              }} />
            ))}

            {/* Triangle */}
            <div style={{
              width: 0, height: 0, position: 'absolute',
              bottom: 76, right: 48,
              borderLeft: '13px solid transparent',
              borderRight: '13px solid transparent',
              borderBottom: '22px solid rgba(255,255,255,0.14)',
            }} />

            {/* Logo */}
            <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: 'rgba(255,255,255,0.18)',
                border: '1.5px solid rgba(255,255,255,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span style={{ color: 'white', fontWeight: 800, fontSize: 14, letterSpacing: 0.3 }}>Viora</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={mode + '_panel'}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.32 }}
                style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}
              >
                <h2 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 30, fontWeight: 700,
                  color: 'white', marginBottom: 14, lineHeight: 1.28,
                  whiteSpace: 'pre-line',
                }}>
                  {isSignIn ? 'Welcome\nBack!' : 'Hello,\nFriend!'}
                </h2>
                <p style={{
                  color: 'rgba(255,255,255,0.72)', fontSize: 13.5,
                  lineHeight: 1.75, marginBottom: 36, maxWidth: 200,
                }}>
                  {isSignIn
                    ? 'To keep connected with us please login with your personal info'
                    : 'Enter your personal details and start your journey with us'}
                </p>
                <button className="outline-btn" onClick={() => setMode(isSignIn ? 'signup' : 'signin')}>
                  {isSignIn ? 'Sign Up' : 'Sign In'}
                </button>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* ── Form panel ── */}
          <motion.div
            layout
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 48px',
              background: 'white',
              order: isSignIn ? 1 : 0,
            }}
          >
            <AnimatePresence mode="wait">
              {isSignIn ? (
                <motion.div
                  key="signin_form"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.36 }}
                  style={{ width: '100%', maxWidth: 320 }}
                >
                  <h2 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 26, fontWeight: 700, color: VIOLET,
                    textAlign: 'center', marginBottom: 22,
                  }}>Sign In</h2>

                  {/* Socials */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 18 }}>
                    {[
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>,
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21.35 11.1H12v2.8h5.35C16.8 16 14.7 17.4 12 17.4c-3.04 0-5.5-2.46-5.5-5.5s2.46-5.5 5.5-5.5c1.39 0 2.65.52 3.6 1.37l2.1-2.1A9.18 9.18 0 0012 3 9.18 9.18 0 002.82 12 9.18 9.18 0 0012 21.18c5.08 0 9.18-3.7 9.18-9.18 0-.7-.07-1.38-.2-2z"/></svg>,
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>,
                    ].map((icon, i) => <a key={i} href="#" className="social-icon-btn">{icon}</a>)}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div className="divider-line" />
                    <span style={{ color: '#b0a4e0', fontSize: 11, whiteSpace: 'nowrap' }}>or use your email account</span>
                    <div className="divider-line" />
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        marginBottom: 14, padding: '10px 14px', borderRadius: 10,
                        background: '#fff5f5', border: '1.5px solid #fecaca',
                        color: '#e05252', fontSize: 12,
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#b0a4e0' }}>
                        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                        </svg>
                      </span>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        required placeholder="Email" disabled={isLoading} className="auth-input" />
                    </div>

                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#b0a4e0' }}>
                        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                      </span>
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                        required placeholder="Password" disabled={isLoading} className="auth-input" />
                    </div>

                    <div style={{ textAlign: 'right', marginTop: -6 }}>
                      <a href="#" className="forgot-link">Forgot password?</a>
                    </div>

                    <motion.button
                      type="submit" disabled={isLoading} className="primary-btn"
                      whileHover={{ scale: isLoading ? 1 : 1.02 }}
                      whileTap={{ scale: isLoading ? 1 : 0.97 }}
                      style={{ marginTop: 2 }}
                    >
                      {isLoading ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3"/>
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                          </svg>
                          Signing in…
                        </span>
                      ) : 'Sign In'}
                    </motion.button>
                  </form>

                  <p style={{ marginTop: 22, textAlign: 'center', fontSize: 12, color: '#b0a4e0' }}>
                    No account?{' '}
                    <button className="toggle-link" onClick={() => setMode('signup')}>Sign Up</button>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="signup_form"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.36 }}
                  style={{ width: '100%', maxWidth: 320 }}
                >
                  <h2 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 26, fontWeight: 700, color: VIOLET,
                    textAlign: 'center', marginBottom: 22,
                  }}>Create Account</h2>

                  {/* Socials */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 18 }}>
                    {[
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>,
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21.35 11.1H12v2.8h5.35C16.8 16 14.7 17.4 12 17.4c-3.04 0-5.5-2.46-5.5-5.5s2.46-5.5 5.5-5.5c1.39 0 2.65.52 3.6 1.37l2.1-2.1A9.18 9.18 0 0012 3 9.18 9.18 0 002.82 12 9.18 9.18 0 0012 21.18c5.08 0 9.18-3.7 9.18-9.18 0-.7-.07-1.38-.2-2z"/></svg>,
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>,
                    ].map((icon, i) => <a key={i} href="#" className="social-icon-btn">{icon}</a>)}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div className="divider-line" />
                    <span style={{ color: '#b0a4e0', fontSize: 11, whiteSpace: 'nowrap' }}>or use your email for registration</span>
                    <div className="divider-line" />
                  </div>

                  <form onSubmit={e => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#b0a4e0' }}>
                        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/>
                        </svg>
                      </span>
                      <input type="text" value={suName} onChange={e => setSuName(e.target.value)}
                        required placeholder="Name" className="auth-input" />
                    </div>

                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#b0a4e0' }}>
                        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                        </svg>
                      </span>
                      <input type="email" value={suEmail} onChange={e => setSuEmail(e.target.value)}
                        required placeholder="Email" className="auth-input" />
                    </div>

                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#b0a4e0' }}>
                        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                      </span>
                      <input type="password" value={suPassword} onChange={e => setSuPassword(e.target.value)}
                        required placeholder="Password" className="auth-input" />
                    </div>

                    <motion.button
                      type="submit" className="primary-btn"
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      style={{ marginTop: 2 }}
                    >
                      Sign Up
                    </motion.button>
                  </form>

                  <p style={{ marginTop: 22, textAlign: 'center', fontSize: 12, color: '#b0a4e0' }}>
                    Already have an account?{' '}
                    <button className="toggle-link" onClick={() => setMode('signin')}>Sign In</button>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}