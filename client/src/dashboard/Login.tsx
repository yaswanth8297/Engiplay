import * as React from 'react';
import { useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useTranslation } from 'react-i18next';
import { BookOpen, AlertTriangle, Newspaper } from 'lucide-react';
import { TerminalButton, TerminalInput } from '../shared/TerminalComponents';

export const Login: React.FC = () => {
  const { login, register, loginAsGuest } = useAuth();
  const { t, i18n } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [grade, setGrade] = useState('8');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await register(name, email, password, grade);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'AUTHENTICATION FAILURE. ACCESS DENIED.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestPlay = async () => {
    setError('');
    setLoading(true);
    try {
      await loginAsGuest();
    } catch (err: any) {
      setError('GUEST AUTH FAILURE. HOST REFUSED CONNECTION.');
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    const current = i18n.language;
    i18n.changeLanguage(current.startsWith('es') ? 'en' : 'es');
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-[#111111] font-body flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden select-none dot-pattern">
      
      {/* Language Switcher */}
      <div className="absolute top-6 right-6 z-20">
        <TerminalButton onClick={toggleLanguage} variant="muted">
          {i18n.language.startsWith('es') ? 'LANG: EN' : 'LANG: ES'}
        </TerminalButton>
      </div>

      {/* Main Container styled as Newspaper Masthead & Card */}
      <div className="w-full max-w-lg bg-[#F9F9F7] border-2 border-[#111111] p-6 md:p-8 relative z-10 hard-shadow">
        
        {/* Newspaper Masthead */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 text-[10px] font-sans font-bold uppercase tracking-widest text-[#737373] mb-1">
            <Newspaper size={14} className="text-[#CC0000]" />
            VOL. I • NEW YORK EDITION • DISPATCH DESK
          </div>
          
          <h1 className="font-serif text-3xl sm:text-4xl font-black uppercase text-[#111111] tracking-tight leading-none mb-2">
            THE ENGIPLAY GAZETTE
          </h1>
          
          <div className="newspaper-double-border py-1 text-xs font-sans font-extrabold uppercase tracking-widest text-[#111111] my-3">
            ALL THE SCIENCE & ENGINEERING THAT'S FIT TO SIMULATE
          </div>
          
          <p className="font-serif italic text-sm text-[#525252]">
            {isSignUp ? 'Candidate Registration & Credentials Desk' : 'Subscriber Authentication & Entry Portal'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-[#CC0000] bg-[#CC0000]/5 text-[#CC0000] text-xs font-sans font-bold flex items-start gap-2 select-text">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>DISPATCH NOTICE: {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <TerminalInput
              label="Candidate Full Name"
              prefix="CANDIDATE:"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marie Curie"
            />
          )}

          <TerminalInput
            label="Email Address / Academic ID"
            prefix="EMAIL:"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.com"
          />

          <TerminalInput
            label="Access Passcode"
            prefix="PASSCODE:"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {isSignUp && (
            <TerminalInput
              label="Academic Level / Grade"
              prefix="GRADE:"
              isSelect={true}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            >
              {Array.from({ length: 7 }, (_, i) => i + 6).map((g) => (
                <option key={g} value={g.toString()} className="bg-[#F9F9F7] text-[#111111]">
                  Grade {g}
                </option>
              ))}
            </TerminalInput>
          )}

          <div className="pt-3">
            <TerminalButton
              type="submit"
              disabled={loading}
              variant="primary"
              className="w-full py-3.5 text-sm font-bold tracking-widest shadow-none"
            >
              {loading ? 'COMPILING DISPATCH...' : isSignUp ? 'SUBMIT REGISTRATION' : 'AUTHENTICATE & ENTER'}
            </TerminalButton>
          </div>
        </form>

        <div className="relative my-6 text-center select-none">
          <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-[#111111]"></span>
          <span className="relative z-10 px-4 bg-[#F9F9F7] text-[10px] font-sans font-bold tracking-widest text-[#737373]">
            OR PRESS DISPATCH
          </span>
        </div>

        {/* Guest Demo Action */}
        <TerminalButton
          onClick={handleGuestPlay}
          disabled={loading}
          variant="secondary"
          className="w-full py-3.5 text-sm font-bold tracking-widest"
        >
          {t('auth.guest')}
        </TerminalButton>

        {/* Tab Toggle */}
        <div className="text-center mt-6">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs font-sans font-bold text-[#111111] hover:text-[#CC0000] underline underline-offset-4 decoration-2 tracking-wider uppercase transition-colors"
          >
            {isSignUp ? '• ALREADY REGISTERED? LOG IN •' : '• NEED NEW ACADEMIC DISPATCH? CREATE ACCOUNT •'}
          </button>
        </div>
      </div>

      {/* Footer / Editorial info panel */}
      <div className="mt-8 text-center text-xs font-sans text-[#737373] flex items-center gap-2 max-w-lg px-4 select-none">
        <BookOpen size={14} className="shrink-0 text-[#111111]" />
        <span className="leading-relaxed">
          CURRICULUM LABS DETECTED: [Circuitry, Bridge Trusses, Mechanical Ratios, Loop Logic, Energy Grids, Fluid Dynamics]
        </span>
      </div>
    </div>
  );
};

