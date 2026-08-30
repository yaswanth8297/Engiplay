import * as React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { fetchProgress, isOnline } from '../utils/api';
import { useTranslation } from 'react-i18next';
import {
  Cpu,
  Boxes,
  Zap,
  FolderLock,
  LogOut,
  Award,
  Calendar,
  Gamepad2
} from 'lucide-react';
import { TerminalButton, StatusTag, StatBar } from '../shared/TerminalComponents';
import { ReWorldModal } from './ReWorldModal';

interface DashboardProps {
  onSelectGame: (gameId: string) => void;
  onViewTeacher: () => void;
  onViewLanding: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectGame, onViewTeacher, onViewLanding }) => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(isOnline());
  const [reworldOpen, setReworldOpen] = useState(false);

  useEffect(() => {
    const updateOnline = () => setOnlineStatus(isOnline());
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);

    fetchProgress()
      .then(setProgress)
      .finally(() => setLoading(false));

    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);

  const getLevelsCompleted = (gameId: string) => {
    return progress.filter(p => p.gameId === gameId && p.score > 0).length;
  };

  const gamesList = [
    {
      id: 'reworld',
      title: 'ReWorld 3D Physics Lab',
      domain: '3D ENGINEERING & MICROGRID',
      icon: <Gamepad2 className="text-[#CC0000]" size={20} strokeWidth={1.5} />,
      grades: '6–12',
      description: 'Rebuild destroyed village infrastructure, construct 3D canyon truss bridges, and manage solar microgrids with live Nova AI Socratic mentoring.'
    },
    {
      id: 'logic-maze',
      title: 'Algorithm & Code Lab',
      domain: 'COMPUTER SCIENCE',
      icon: <FolderLock className="text-[#111111]" size={20} strokeWidth={1.5} />,
      grades: '6–12',
      description: 'Master conditional logic (if/else), iteration loops (while), and code debugging across Java, Python, and C++.'
    },
    {
      id: 'circuit-builder',
      title: 'Circuit Builder Lab',
      domain: 'ELECTRICAL ENGINEERING',
      icon: <Cpu className="text-[#111111]" size={20} strokeWidth={1.5} />,
      grades: '6–10',
      description: 'Assemble breadboard circuits with batteries, rotatable wires, and switches. Light up target bulbs while avoiding short-circuits.'
    },
    {
      id: 'bridge-builder',
      title: 'Truss Bridge Builder',
      domain: 'CIVIL & STRUCTURAL',
      icon: <Boxes className="text-[#111111]" size={20} strokeWidth={1.5} />,
      grades: '6–12',
      description: 'Design structural truss networks across canyon nodes using wood, steel, and cable members under heavy train load stress.'
    },
    {
      id: 'energy-balancer',
      title: 'System Power Balancer',
      domain: 'POWER & ENERGY',
      icon: <Zap className="text-[#111111]" size={20} strokeWidth={1.5} />,
      grades: '9–12',
      description: 'Balance fluctuating renewable generation with battery reserves. Manage load priority switches to prevent blackout emergencies.'
    }
  ];

  const totalLevelsCompleted = progress.filter(p => p.score > 0).length;
  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-[#111111] font-body flex flex-col select-none dot-pattern">

      {/* Top Header / Masthead */}
      <header className="border-b-4 border-[#111111] bg-[#F9F9F7]">

        {/* Edition Sub-bar */}
        <div className="border-b border-[#111111] px-6 py-2 flex flex-wrap items-center justify-between text-[11px] font-sans font-bold uppercase tracking-wider text-[#525252]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[#111111]">
              <Calendar size={13} /> {todayDate}
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">VOL. CXXIV NO. 48</span>
            <span>•</span>
            <span className="text-[#CC0000] font-black">STEM EDITION</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>NETWORK STATUS:</span>
              {onlineStatus ? (
                <StatusTag status="ok" />
              ) : (
                <StatusTag status="warn" />
              )}
            </div>

            <TerminalButton
              onClick={() => i18n.changeLanguage(i18n.language.startsWith('es') ? 'en' : 'es')}
              variant="muted"
              className="py-1 px-2 text-[10px]"
            >
              {i18n.language.startsWith('es') ? 'ENGLISH' : 'ESPAÑOL'}
            </TerminalButton>
          </div>
        </div>

        {/* Newspaper Title Masthead */}
        <div className="px-6 py-6 text-center">
          <h1
            onClick={onViewLanding}
            title="Return to Front Page Landing"
            className="font-serif text-5xl sm:text-7xl lg:text-8xl font-black uppercase text-[#111111] hover:text-[#CC0000] transition cursor-pointer tracking-tighter leading-none"
          >
            THE ENGIPLAY GAZETTE
          </h1>
          <div className="newspaper-double-border max-w-4xl mx-auto py-1 my-3 text-xs sm:text-sm font-sans font-extrabold uppercase tracking-widest text-[#111111]">
            "ALL THE SCIENCE & ENGINEERING THAT'S FIT TO SIMULATE"
          </div>
        </div>

        {/* User & Quick Navigation Bar */}
        <div className="border-t border-[#111111] px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4 bg-[#F9F9F7]">
          <div className="flex items-center gap-4 text-xs font-sans font-bold uppercase">
            <span className="text-[#CC0000]">● SUBSCRIBER:</span>
            <span className="text-[#111111] font-black text-sm">{user?.name}</span>
            <span className="px-2 py-0.5 border border-[#111111] bg-[#E5E5E0] text-[10px]">GRADE {user?.grade}</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <TerminalButton onClick={() => onSelectGame('reworld')} variant="primary" className="text-xs py-2 bg-[#CC0000] text-white">
              🎮 PLAY RE:WORLD 3D NOW ▶️
            </TerminalButton>
            <TerminalButton onClick={onViewLanding} variant="muted" className="text-xs py-2">
              📰 FRONT PAGE (HOME)
            </TerminalButton>
            <TerminalButton onClick={onViewTeacher} variant="secondary" className="text-xs py-2">
              CLASSROOM MONITOR
            </TerminalButton>
            <button
              onClick={logout}
              title={t('auth.logout')}
              className="p-2 border border-[#111111] text-[#111111] hover:bg-[#CC0000] hover:text-white hover:border-[#CC0000] transition"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">

        {/* ReWorld Unity 3D Banner */}
        <div className="border-2 border-[#111111] bg-[#E5E5E0] p-6 hard-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-sans font-black bg-[#CC0000] text-white px-2.5 py-0.5 uppercase tracking-widest">
                UNITY 3D & NOVA AI ENGINE
              </span>
              <span className="text-xs font-mono font-bold text-[#111111]">re_world_game / nova_backend</span>
            </div>
            <h3 className="font-serif text-2xl font-black uppercase text-[#111111] tracking-tight">
              RE:WORLD 3D PHYSICS SIMULATOR & SOCRATIC MENTOR
            </h3>
            <p className="font-serif text-xs text-[#404040] leading-relaxed">
              Experience full 3D interactive structural engineering, procedural bridge stresses, and FastAPI Nova AI Socratic mentor integration built in Unity C# and Python.
            </p>
          </div>
          <TerminalButton onClick={() => setReworldOpen(true)} variant="primary" className="py-3 px-6 text-xs font-black shrink-0">
            LAUNCH RE:WORLD GUIDE & TESTER →
          </TerminalButton>
        </div>

        {/* Section Header */}
        <div className="border-b-2 border-[#111111] pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-sans font-extrabold uppercase tracking-widest text-[#CC0000]">FEATURED LAB SIMULATORS</span>
            <h2 className="font-serif text-4xl font-black uppercase text-[#111111] tracking-tight">FRONT PAGE DISPATCHES</h2>
          </div>
          <div className="border-2 border-[#111111] bg-[#F9F9F7] px-4 py-1.5 text-xs font-sans font-extrabold uppercase tracking-widest flex items-center gap-2">
            <Award size={16} className="text-[#CC0000]" />
            <span>{totalLevelsCompleted} / 12 SYSTEMS OPERATIONAL</span>
          </div>
        </div>

        {/* 2x2 Games Grid for 4 Games */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {gamesList.map((game) => {
            const completed = getLevelsCompleted(game.id);
            const percentage = (completed / 3) * 100;
            return (
              <div
                key={game.id}
                className="border-2 border-[#111111] bg-[#F9F9F7] p-6 flex flex-col justify-between hard-shadow-hover"
              >
                <div>
                  {/* Header info line */}
                  <div className="flex items-center justify-between text-[10px] font-sans font-bold uppercase tracking-wider text-[#737373] pb-2 mb-3 border-b border-[#111111]">
                    <span className="text-[#CC0000]">{game.domain}</span>
                    <span className="border border-[#111111] px-1.5 py-0.5 bg-[#E5E5E0] text-[#111111]">
                      GRADES: {game.grades}
                    </span>
                  </div>

                  {/* Title without artificial red split */}
                  <h3 className="font-serif text-2xl font-extrabold text-[#111111] mb-2 flex items-center gap-2">
                    {game.icon}
                    <span>{game.title}</span>
                  </h3>

                  {/* Description with drop-cap (Giant RED initial letter M, A, D, B) */}
                  <p className="drop-cap text-sm text-[#404040] leading-relaxed mb-4 min-h-[60px]">
                    {game.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#111111] space-y-3">
                  <StatBar
                    label="LAB PROGRESS"
                    percentage={percentage}
                    maxChars={12}
                    variant="primary"
                  />
                  <TerminalButton
                    onClick={() => onSelectGame(game.id)}
                    variant={completed > 0 ? 'secondary' : 'primary'}
                    className="w-full py-2.5 text-xs font-bold"
                  >
                    {t('game.play')} • ENTER LAB
                  </TerminalButton>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ReWorld Modal */}
      <ReWorldModal isOpen={reworldOpen} onClose={() => setReworldOpen(false)} />
    </div>
  );
};

