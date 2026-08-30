import React, { useState } from 'react';
import { Newspaper, Cpu, Pickaxe, FolderLock, Zap, Check, Play, BrainCircuit, Gamepad2 } from 'lucide-react';
import { TerminalButton } from '../shared/TerminalComponents';
import { ReWorldModal } from './ReWorldModal';

interface LandingPageProps {
  onEnterApp: () => void;
  onSelectGame: (gameId: string) => void;
  onGuestPlay?: () => void;
}

export const LandingPage = ({ onEnterApp, onSelectGame, onGuestPlay }: LandingPageProps) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [reworldOpen, setReworldOpen] = useState(false);
  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const labs = [
    {
      id: 'reworld',
      title: 'ReWorld 3D Physics Lab',
      domain: '3D ENGINEERING & MICROGRID',
      icon: <Gamepad2 size={24} className="text-[#CC0000]" />,
      desc: 'Rebuild destroyed village infrastructure, construct 3D canyon truss bridges, and manage solar microgrids with live Nova AI Socratic mentoring.'
    },
    {
      id: 'logic-maze',
      title: 'Algorithm & Code Lab',
      domain: 'COMPUTER SCIENCE',
      icon: <FolderLock size={24} className="text-[#111111]" />,
      desc: 'Master conditional logic (if/else), iteration loops (while), and code debugging across Java, Python, and C++.'
    },
    {
      id: 'circuit-builder',
      title: 'Circuit Builder Lab',
      domain: 'ELECTRICAL ENGINEERING',
      icon: <Cpu size={24} className="text-[#111111]" />,
      desc: 'Assemble closed loops, switches, and load branches to power electric circuits without causing short-circuit trips.'
    },
    {
      id: 'bridge-builder',
      title: 'Truss Bridge Builder',
      domain: 'CIVIL & STRUCTURAL',
      icon: <Pickaxe size={24} className="text-[#111111]" />,
      desc: 'Design triangular truss networks across canyon nodes. Test bridge stress against heavy train loads with live snap physics.'
    },
    {
      id: 'energy-balancer',
      title: 'System Power Balancer',
      domain: 'POWER & ENERGY',
      icon: <Zap size={24} className="text-[#111111]" />,
      desc: 'Balance fluctuating solar and wind generation with city power demand, shedding non-critical loads to prevent blackouts.'
    }
  ];

  const pricingPlans = [
    {
      title: 'STUDENT EDITION',
      badge: 'FREE FOREVER',
      price: '$0',
      period: 'per student / no credit card',
      description: 'Complete hands-on engineering lab access for self-directed learners.',
      features: [
        'Access to all 5 Simulation Labs including ReWorld 3D',
        'Offline Local Progress Caching',
        'Standard Socratic AI Guidance',
        '3 Challenge Levels per Module',
        'Instant Visual Physics Feedback'
      ],
      buttonText: 'PLAY FREE AS GUEST →',
      primary: false,
      onClick: onGuestPlay || onEnterApp
    },
    {
      title: 'EDUCATOR & CLASSROOM',
      badge: 'MOST POPULAR',
      price: '$19',
      period: 'per month / billed annually ($199/yr)',
      description: 'Empower entire classrooms with real-time diagnostic telemetry & skill spectrums.',
      features: [
        'Everything in Student Edition',
        'Teacher Classroom Monitor & Leaderboards',
        'Student Engineering Skill Spectrum Radar',
        'Unlimited AI Socratic Queries',
        'Export Diagnostic Learning Reports',
        'NGSS Alignment Curriculum Mapping'
      ],
      buttonText: 'START EDUCATOR TRIAL →',
      primary: true,
      onClick: onEnterApp
    },
    {
      title: 'DISTRICT ENTERPRISE',
      badge: 'CUSTOM INTEGRATION',
      price: '$499',
      period: 'per school district / year',
      description: 'Comprehensive STEM ecosystem integration for school districts & academies.',
      features: [
        'Everything in Educator Edition',
        'Single Sign-On (SSO / Google / Clever)',
        'Canvas & Schoology LMS Integration',
        'Custom Simulator Level Authoring',
        'Dedicated STEM Pedagogical Advisor',
        '99.9% Uptime SLA & Priority Support'
      ],
      buttonText: 'CONTACT DISTRICT SALES →',
      primary: false,
      onClick: onEnterApp
    }
  ];

  const faqs = [
    {
      q: 'Can students play EngiPlay without an internet connection?',
      a: 'Yes! EngiPlay features full offline local caching using IndexedDB and LocalForage. All simulation labs run 100% in the browser client without requiring an active backend connection.'
    },
    {
      q: 'How does the Socratic AI Tutor assist students without spoiling answers?',
      a: 'Our Socratic Tutor analyzes the active component layout (e.g. open switches, broken truss members, or syntax errors) and formulates guided pedagogical questions. It encourages spatial analysis rather than revealing direct solutions.'
    },
    {
      q: 'Is EngiPlay aligned with official educational standards?',
      a: 'Absolutely. EngiPlay is engineered to meet Next Generation Science Standards (NGSS) for Grades 6–12 across Physical Science (MS-PS2, HS-PS3), Engineering Design (MS-ETS1, HS-ETS1), and Computer Science (CSTA).'
    },
    {
      q: 'What hardware or browser requirements are needed?',
      a: 'EngiPlay runs smoothly on standard modern browsers (Chrome, Edge, Firefox, Safari) and Chromebooks. No heavy GPU or software installations are required.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-[#111111] font-body flex flex-col select-none dot-pattern">
      
      {/* Broadsheet Masthead Header */}
      <header className="border-b-4 border-[#111111] bg-[#F9F9F7]">
        <div className="border-b border-[#111111] px-6 py-2 flex flex-wrap items-center justify-between text-[11px] font-sans font-bold uppercase tracking-wider text-[#525252]">
          <div className="flex items-center gap-4">
            <span className="text-[#111111] font-black">THE ENGIPLAY GAZETTE</span>
            <span>•</span>
            <span>{todayDate}</span>
            <span>•</span>
            <span>VOL. CXXIV NO. 48</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectGame('reworld')}
              className="text-[10px] font-sans font-black px-2.5 py-1 border border-[#111111] bg-[#CC0000] text-white hover:bg-[#111111] transition flex items-center gap-1"
            >
              <Gamepad2 size={12} /> PLAY RE:WORLD 3D NOW ▶️
            </button>
            {onGuestPlay && (
              <button
                onClick={onGuestPlay}
                className="text-[10px] font-sans font-black px-2.5 py-1 border-2 border-[#111111] bg-[#111111] text-white hover:bg-[#CC0000] transition flex items-center gap-1"
              >
                <Play size={10} fill="currentColor" /> PLAY AS GUEST
              </button>
            )}
            <button
              onClick={onEnterApp}
              className="text-[10px] font-sans font-bold px-2.5 py-1 border border-[#111111] bg-[#111111] text-[#F9F9F7] hover:bg-[#CC0000] transition"
            >
              STUDENT LOGIN →
            </button>
          </div>
        </div>

        <div className="px-6 py-8 text-center border-b-2 border-[#111111]">
          <h1 className="font-serif text-6xl sm:text-8xl lg:text-9xl font-black uppercase text-[#111111] tracking-tighter leading-none">
            THE ENGIPLAY GAZETTE
          </h1>
          <div className="newspaper-double-border max-w-4xl mx-auto py-1 my-4 text-xs sm:text-sm font-sans font-extrabold uppercase tracking-widest text-[#111111]">
            "ALL THE SCIENCE, PHYSICS & ENGINEERING THAT'S FIT TO SIMULATE"
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl w-full mx-auto p-6 md:p-10 border-b-2 border-[#111111]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-6">
            <span className="text-xs font-sans font-black bg-[#CC0000] text-white px-3 py-1 uppercase tracking-widest">
              LEAD DISPATCH
            </span>
            <h2 className="font-serif text-4xl sm:text-6xl font-black text-[#111111] uppercase tracking-tight leading-tight">
              INTERACTIVE ENGINEERING LABS FOR THE NEXT GENERATION OF INNOVATORS
            </h2>
            <p className="drop-cap font-serif text-lg text-[#404040] leading-relaxed">
              EngiPlay brings real-world physical and logical engineering principles directly to your browser. Dive into five core hands-on laboratory simulators covering 3D structural engineering, electrical circuits, truss physics, algorithm programming, and energy grid management.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <TerminalButton onClick={() => onSelectGame('reworld')} variant="primary" className="py-3 px-6 text-sm font-black bg-[#CC0000]">
                LAUNCH RE:WORLD 3D GAME ▶️ <Gamepad2 size={16} className="inline ml-1.5" />
              </TerminalButton>
              {onGuestPlay && (
                <TerminalButton onClick={onGuestPlay} variant="secondary" className="py-3 px-6 text-sm font-bold">
                  PLAY AS GUEST NOW <Play size={16} className="inline ml-1.5" />
                </TerminalButton>
              )}
              <TerminalButton onClick={onEnterApp} variant="muted" className="py-3 px-6 text-sm font-bold">
                ENTER STUDENT PORTAL →
              </TerminalButton>
            </div>
          </div>

          <div className="lg:col-span-4 border-2 border-[#111111] bg-[#E5E5E0] p-6 hard-shadow space-y-4">
            <div className="flex items-center gap-2 text-[#CC0000] font-sans font-black text-xs uppercase tracking-widest border-b border-[#111111] pb-2">
              <BrainCircuit size={18} />
              <span>SOCRATIC CORRESPONDENT</span>
            </div>
            <h3 className="font-serif text-xl font-bold uppercase text-[#111111]">
              AI-POWERED SCAFFOLDING AT EVERY STEP
            </h3>
            <p className="font-serif text-xs text-[#404040] leading-relaxed">
              Never get stuck. Our built-in Socratic AI Tutor analyzes your exact component layout and provides guided clues without giving away direct answers.
            </p>
            <div className="p-3 bg-[#F9F9F7] border border-[#111111] text-[11px] font-mono text-[#111111]">
              <span className="text-[#CC0000] font-bold">TUTOR DESK:</span> "Consider how current flows when the switch contact is open versus closed..."
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: 4 SIMULATOR MODULES SHOWCASE */}
      <section id="labs" className="max-w-7xl w-full mx-auto p-6 md:p-10 border-b-2 border-[#111111] space-y-8">
        <div className="border-b-2 border-[#111111] pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-sans font-extrabold uppercase tracking-widest text-[#CC0000]">CURATED SIMULATION LABS</span>
            <h2 className="font-serif text-4xl font-black uppercase text-[#111111] tracking-tight">CORE LABORATORY DISPATCHES</h2>
          </div>
          <span className="text-xs font-sans font-bold uppercase text-[#737373]">
            GRADES 6–12 • NGSS ALIGNED
          </span>
        </div>

        {/* 2x2 Grid for 4 Games */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {labs.map((lab) => (
            <div
              key={lab.id}
              className="border-2 border-[#111111] bg-[#F9F9F7] p-6 flex flex-col justify-between hard-shadow-hover transition cursor-pointer"
              onClick={() => onSelectGame(lab.id)}
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-sans font-bold uppercase tracking-wider text-[#CC0000] pb-2 mb-3 border-b border-[#111111]">
                  <span>{lab.domain}</span>
                  <span className="text-[#111111]">3 MISSIONS</span>
                </div>
                
                {/* Title clean text */}
                <h3 className="font-serif text-2xl font-black text-[#111111] mb-2 flex items-center gap-2">
                  {lab.icon}
                  <span>{lab.title}</span>
                </h3>
                
                {/* Description with drop cap (Giant RED initial alphabet M, A, D, B) */}
                <p className="drop-cap font-serif text-sm text-[#404040] leading-relaxed mb-4 min-h-[60px]">
                  {lab.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-[#111111]">
                <TerminalButton
                  onClick={() => onSelectGame(lab.id)}
                  variant="primary"
                  className="w-full py-2.5 text-xs font-bold"
                >
                  LAUNCH {lab.title.toUpperCase()} →
                </TerminalButton>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING PLANS */}
      <section className="max-w-7xl w-full mx-auto p-6 md:p-10 border-b-2 border-[#111111] space-y-8">
        <div className="border-b-2 border-[#111111] pb-3 text-center">
          <span className="text-[10px] font-sans font-extrabold uppercase tracking-widest text-[#CC0000]">CIRCULATION EDITIONS</span>
          <h2 className="font-serif text-4xl font-black uppercase text-[#111111] tracking-tight">SUBSCRIPTION PRICING PLANS</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`border-2 border-[#111111] p-6 flex flex-col justify-between hard-shadow ${
                plan.primary ? 'bg-[#F9F9F7] ring-4 ring-[#CC0000]' : 'bg-[#E5E5E0]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#111111]">
                  <span className="text-[10px] font-sans font-black uppercase tracking-widest text-[#111111]">{plan.title}</span>
                  <span className={`text-[9px] font-sans font-black px-2 py-0.5 border uppercase ${
                    plan.primary ? 'border-[#CC0000] bg-[#CC0000] text-white' : 'border-[#111111] bg-[#111111] text-white'
                  }`}>
                    {plan.badge}
                  </span>
                </div>

                <div className="mb-4">
                  <span className="font-serif text-5xl font-black text-[#111111]">{plan.price}</span>
                  <span className="text-xs font-sans text-[#737373] block mt-1">{plan.period}</span>
                </div>

                <p className="text-xs font-serif text-[#404040] mb-6">{plan.description}</p>

                <ul className="space-y-2.5 mb-6 text-xs font-sans">
                  {plan.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2">
                      <Check size={14} className="text-[#CC0000] shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <TerminalButton
                onClick={plan.onClick}
                variant={plan.primary ? 'primary' : 'secondary'}
                className="w-full py-3 text-xs font-bold"
              >
                {plan.buttonText}
              </TerminalButton>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#111111] text-[#F9F9F7] p-8 text-center text-xs font-sans">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-serif font-black tracking-wider uppercase text-sm">THE ENGIPLAY GAZETTE</span>
          <span>© 2026 ENGIPLAY STEM PLATFORM • ALL RIGHTS RESERVED</span>
        </div>
      </footer>

      {/* ReWorld Modal */}
      <ReWorldModal isOpen={reworldOpen} onClose={() => setReworldOpen(false)} />
    </div>
  );
};
