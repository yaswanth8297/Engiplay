import * as React from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PhaserGameContainer } from './PhaserGameContainer';
import { getAdjustedConfig, recordAttempt } from '../../shared/adaptiveEngine';
import { saveProgressApi } from '../../utils/api';
import { TutorBot } from '../../tutorbot/TutorBot';
import { Newspaper, BrainCircuit } from 'lucide-react';
import { TerminalButton } from '../../shared/TerminalComponents';
import { CodeLogicGame } from '../logic-maze/CodeLogicGame';
import { ReWorldWebGame } from '../reworld/ReWorldWebGame';

// Import Phaser scenes
import { CircuitBuilderScene } from '../circuit-builder/CircuitBuilderScene';
import { BridgeBuilderScene } from '../bridge-builder/BridgeBuilderScene';
import { EnergyBalancerScene } from '../energy-balancer/EnergyBalancerScene';

interface GamePortalProps {
  gameId: string;
  onBack: () => void;
}

const SCENE_CLASSES: Record<string, any> = {
  'circuit-builder': CircuitBuilderScene,
  'bridge-builder': BridgeBuilderScene,
  'energy-balancer': EnergyBalancerScene
};

const DOMAIN_SKILL_TAGS: Record<string, string[]> = {
  'logic-maze': ['logic', 'problem_solving'],
  'circuit-builder': ['logic', 'problem_solving'],
  'bridge-builder': ['spatial_reasoning', 'creativity', 'optimization'],
  'energy-balancer': ['optimization', 'persistence'],
  'reworld': ['spatial_reasoning', 'optimization', 'creativity']
};

const GAME_TITLES: Record<string, string> = {
  'logic-maze': 'Algorithm & Code Lab',
  'circuit-builder': 'Circuit Builder Lab',
  'bridge-builder': 'Truss Bridge Builder',
  'energy-balancer': 'System Power Balancer',
  'reworld': 'ReWorld 3D Physics Lab'
};

const GAME_DOCS: { [key: string]: { title: string; concept: string; components: { name: string; desc: string }[]; steps: string[] } } = {
  'logic-maze': {
    title: 'Algorithm & Code Lab (Computer Science)',
    concept: 'Algorithmic programming uses conditional logic (if / else if / else), iteration loops (while), and code debugging to construct robust software systems.',
    components: [
      { name: '🌐 Language Selector', desc: 'Switch dynamically between Java, Python, and C++.' },
      { name: '🧩 Conditional Tokens', desc: 'Place if, else if / elif, and else logic keywords.' },
      { name: '🔄 Loop Controls', desc: 'Configure while loop conditions and iteration counters.' },
      { name: '🔍 Code Debugger', desc: 'Select and replace buggy lines of code to fix runtime errors.' }
    ],
    steps: [
      'Select your preferred programming language (Java, Python, or C++).',
      'Read the problem description and code boilerplate in the editor window.',
      'Select or drag conditional and loop tokens into the designated slots.',
      'In Level 3, click buggy code lines and select the correct syntax replacement.',
      'Click RUN CODE & VERIFY TEST CASES ▶️ to run compilation tests.'
    ]
  },
  'circuit-builder': {
    title: 'Circuit Builder Lab (Electrical Engineering)',
    concept: 'Electric current requires an unbroken closed loop from the battery positive terminal (+) through components and back to the negative terminal (-).',
    components: [
      { name: '🔋 Battery', desc: 'Power source. (+) is on the right cap, (-) is on the left edge.' },
      { name: '💡 Bulb', desc: 'Lights up when current flows through its lead wires.' },
      { name: '🔌 Switch', desc: 'Click to toggle between CLOSED/ON (Green) and OPEN/OFF (Red).' },
      { name: '━ Wire (Line)', desc: 'Click grid/wire to rotate between 0° (Horizontal) and 90° (Vertical).' }
    ],
    steps: [
      'Select a component or wire from the left toolbox.',
      'Click breadboard socket cells to place wires and components.',
      'Click placed wires or switches to rotate orientations or toggle ON/OFF.',
      'Click TEST ⚡ to verify current flow and light up the target bulbs.'
    ]
  },
  'bridge-builder': {
    title: 'Truss Bridge Builder (Civil Engineering)',
    concept: 'Truss bridges distribute compressive and tensile forces across triangular member networks connecting road deck nodes to solid canyon anchors.',
    components: [
      { name: '🪵 Wood Beam', desc: 'Cost-effective, good for low-load support.' },
      { name: '🔩 Steel Beam', desc: 'Heavy-duty steel, withstands intense compression and tension.' },
      { name: '🪢 Cable', desc: 'Flexible high-tension cable, supports suspension decks.' }
    ],
    steps: [
      'Select a structural material (Wood, Steel, or Cable) from the left toolbox.',
      'Click two adjacent joint nodes to draw a beam member between them.',
      'Form triangular truss structures below or above the road deck.',
      'Click TEST TRAIN ▶️ to drive the heavy freight train across! Observe green/yellow/red beam stress.'
    ]
  },
  'energy-balancer': {
    title: 'System Power Balancer (Power Systems)',
    concept: 'Electrical grids must continuously match real-time generation (Solar + Wind) with load demand (Hospital, Houses, Water Pump) to prevent blackouts.',
    components: [
      { name: '☀️ Solar & 💨 Wind Plants', desc: 'Variable renewable generation sources.' },
      { name: '🏥 Hospital (Critical)', desc: 'Priority load — must never lose power.' },
      { name: '🚰 Water Pump (Flexible)', desc: 'Sheddable load — turn OFF during generation dips.' }
    ],
    steps: [
      'Observe real-time generation curves and city load demand.',
      'Click load switches to shed non-essential loads when generation drops.',
      'Keep critical loads (Hospital) continuously powered without blacking out the grid.'
    ]
  }
};

export const GamePortal = ({ gameId, onBack }: GamePortalProps) => {
  const { t } = useTranslation();
  const [level, setLevel] = useState(1);
  const [attempts, setAttempts] = useState(1);
  const [hintsUsedCount, setHintsUsedCount] = useState(0);

  // Game adjustments
  const [adjustedConfig, setAdjustedConfig] = useState<any>({});

  // Modals / Overlays
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  const [showHowToPlayModal, setShowHowToPlayModal] = useState(false);
  const [failureMsg, setFailureMsg] = useState('');
  const [lastScore, setLastScore] = useState(0);

  // Socratic Tutor states
  const [tutorOpen, setTutorOpen] = useState(false);
  const [tutorAutoTrigger, setTutorAutoTrigger] = useState(false);

  useEffect(() => {
    loadLevelConfig();
  }, [gameId, level, attempts]);

  const loadLevelConfig = () => {
    const config = getAdjustedConfig(gameId, level);
    setAdjustedConfig(config);
    setShowSuccess(false);
    setShowFailure(false);
  };

  const handleGameSuccess = async (score: number, timeTaken: number) => {
    setLastScore(score);
    setShowSuccess(true);

    const tags = DOMAIN_SKILL_TAGS[gameId] || [];
    await saveProgressApi({
      gameId,
      level,
      score,
      attempts,
      timeTaken,
      hintsUsed: hintsUsedCount,
      skillTags: tags
    });
  };

  const handleGameFailure = (errorMessage: string) => {
    setFailureMsg(errorMessage);
    setShowFailure(true);

    recordAttempt(gameId, level, false, 0, 0, hintsUsedCount);

    if (attempts >= 3) {
      setTutorAutoTrigger(true);
      setTutorOpen(true);
    }
  };

  const handleRetry = () => {
    setAttempts(prev => prev + 1);
    setShowFailure(false);
  };

  const handleNextLevel = () => {
    if (level < 3) {
      setLevel(prev => prev + 1);
      setAttempts(1);
      setHintsUsedCount(0);
      setTutorAutoTrigger(false);
    } else {
      onBack();
    }
  };

  const gameTitle = GAME_TITLES[gameId] || gameId;

  return (
    <div className={`min-h-screen bg-[#F9F9F7] text-[#111111] font-body flex flex-col relative select-none dot-pattern transition-all duration-300 ${tutorOpen ? 'sm:pr-[420px]' : ''}`}>

      {/* Header portal bar */}
      <header className="border-b-2 border-[#111111] bg-[#F9F9F7] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <TerminalButton onClick={onBack} variant="muted">
          ← LEAVE LAB DESK
        </TerminalButton>

        {/* Title */}
        <div className="flex items-center gap-3">
          <Newspaper className="text-[#CC0000]" size={20} />
          <h2 className="font-serif font-black text-xl uppercase tracking-tight text-[#111111]">
            {gameTitle}
          </h2>
          <span className="px-2.5 py-0.5 border border-[#111111] bg-[#111111] text-[#F9F9F7] text-xs font-sans font-bold uppercase tracking-widest">
            {t('game.level', { level })}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <TerminalButton
            onClick={() => setShowHowToPlayModal(true)}
            variant="muted"
          >
            📖 HOW TO PLAY
          </TerminalButton>

          <TerminalButton
            onClick={() => {
              setTutorOpen(true);
              setHintsUsedCount(prev => prev + 1);
            }}
            variant="secondary"
          >
            ASK TUTOR DESK
          </TerminalButton>
        </div>
      </header>

      {/* Main Game Screen */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">

        {/* Newsprint Level Mission Dispatch Header */}
        <div className="w-full max-w-[720px] mb-2 p-3 bg-[#F9F9F7] border-2 border-[#111111] hard-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-sans font-black bg-[#CC0000] text-white px-2 py-0.5 uppercase tracking-wider">
                MISSION OBJECTIVE
              </span>
              <h3 className="font-serif font-black text-base uppercase text-[#111111] tracking-tight">
                {gameTitle} • LEVEL {level}
              </h3>
            </div>
            <p className="font-serif italic text-xs text-[#404040] mt-1">
              {adjustedConfig.explanation || 'Design and test your engineering solution.'}
            </p>
          </div>
          {adjustedConfig.budget && (
            <span className="shrink-0 text-xs font-mono font-bold bg-[#E5E5E0] text-[#111111] px-2.5 py-1 border border-[#111111]">
              BUDGET: ${adjustedConfig.budget}
            </span>
          )}
        </div>

        {/* Render ReWorld Web Game OR CSE Code Logic Game OR Phaser Engine */}
        {gameId === 'reworld' ? (
          <ReWorldWebGame
            level={level}
            onSuccess={handleGameSuccess}
            onFailure={handleGameFailure}
          />
        ) : gameId === 'logic-maze' ? (
          <CodeLogicGame
            level={level}
            onSuccess={handleGameSuccess}
            onFailure={handleGameFailure}
          />
        ) : (
          <div className="border-2 border-[#111111] bg-[#F9F9F7] p-2 hard-shadow">
            <PhaserGameContainer
              gameId={gameId}
              level={level}
              config={adjustedConfig}
              onSuccess={handleGameSuccess}
              onFailure={handleGameFailure}
              sceneClass={SCENE_CLASSES[gameId]}
            />
          </div>
        )}

        {attempts >= 2 && !showFailure && !showSuccess && (
          <div className="mt-2 p-3 border border-[#111111] bg-[#E5E5E0] text-xs font-sans text-[#111111] max-w-lg text-center flex items-center justify-center gap-2 w-full">
            <BrainCircuit size={16} className="text-[#CC0000] shrink-0 animate-pulse" />
            <span>STUCK ON THIS LEVEL? CLICK 'ASK TUTOR DESK' IN THE TOP BAR FOR CLUES.</span>
          </div>
        )}
      </main>

      {/* Socratic Tutor Drawer */}
      <TutorBot
        gameId={gameId}
        level={level}
        attempts={attempts}
        lastAttemptDetails={failureMsg}
        currentConcept={adjustedConfig.explanation}
        isOpen={tutorOpen}
        onClose={() => {
          setTutorOpen(false);
          setTutorAutoTrigger(false);
        }}
        autoPromptHint={tutorAutoTrigger}
      />

      {/* SUCCESS MODAL OVERLAY */}
      {showSuccess && (
        <div className="fixed inset-0 bg-[#111111]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#F9F9F7] border-4 border-[#111111] p-6 md:p-8 text-center hard-shadow animate-in fade-in duration-150">
            <div className="inline-block px-3 py-1 border border-[#111111] bg-[#111111] text-[#F9F9F7] text-xs font-sans font-extrabold uppercase tracking-widest mb-3">
              EXTRA EDITION • MISSION SOLVED
            </div>

            <h3 className="font-serif text-3xl font-black text-[#111111] uppercase tracking-tight mb-2">{t('game.success')}</h3>
            <p className="text-sm font-body text-[#525252]">System diagnostics passed cleanly.</p>

            <div className="my-5 p-4 border border-[#111111] bg-[#E5E5E0] grid grid-cols-2 gap-4 text-left">
              <div>
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#737373] block">QUALITY RATING</span>
                <span className="text-xl font-mono font-black text-[#111111] mt-0.5 block">{lastScore} / 100</span>
              </div>
              <div>
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#737373] block">ATTEMPTS</span>
                <span className="text-xl font-mono font-black text-[#111111] mt-0.5 block">#{attempts}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <TerminalButton onClick={onBack} variant="muted" className="flex-1 text-xs">
                LEAVE LAB
              </TerminalButton>
              <TerminalButton onClick={handleNextLevel} variant="primary" className="flex-1 text-xs">
                NEXT MISSION →
              </TerminalButton>
            </div>
          </div>
        </div>
      )}

      {/* FAILURE MODAL OVERLAY */}
      {showFailure && (
        <div className="fixed inset-0 bg-[#111111]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#F9F9F7] border-4 border-[#CC0000] p-6 md:p-8 text-center hard-shadow animate-in fade-in duration-150">
            <div className="inline-block px-3 py-1 border border-[#CC0000] bg-[#CC0000] text-white text-xs font-sans font-extrabold uppercase tracking-widest mb-3">
              EXTRA EDITION • COMPILER ABORT
            </div>

            <h3 className="font-serif text-3xl font-black text-[#CC0000] uppercase tracking-tight mb-1">{t('game.failure_title')}</h3>
            <p className="text-xs font-sans font-bold text-[#111111] uppercase tracking-wider mb-4">Parameters Outside Tolerance Limits</p>

            <div className="my-4 p-4 border border-[#CC0000] bg-[#CC0000]/5 text-left text-xs font-mono text-[#CC0000]">
              <p className="font-bold uppercase mb-1">FAILURE CAUSE:</p>
              <p className="italic">"{failureMsg || 'Logic check failed.'}"</p>
            </div>

            <div className="flex gap-3">
              <TerminalButton
                onClick={() => {
                  setTutorOpen(true);
                  setTutorAutoTrigger(true);
                }}
                variant="secondary"
                className="px-3 text-xs"
              >
                ASK TUTOR
              </TerminalButton>
              <TerminalButton onClick={handleRetry} variant="primary" className="flex-1 text-xs">
                RETRY DESIGN
              </TerminalButton>
            </div>
          </div>
        </div>
      )}

      {/* HOW TO PLAY MODAL OVERLAY */}
      {showHowToPlayModal && (
        <div className="fixed inset-0 bg-[#111111]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#F9F9F7] border-4 border-[#111111] p-6 md:p-8 text-left hard-shadow max-h-[85vh] overflow-y-auto animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b-2 border-[#111111] pb-3 mb-4">
              <div>
                <span className="text-[10px] font-sans font-black bg-[#111111] text-[#F9F9F7] px-2 py-0.5 uppercase tracking-widest">
                  ENGIPLAY GAZETTE • OPERATIONAL MANUAL
                </span>
                <h3 className="font-serif text-2xl font-black text-[#111111] uppercase tracking-tight mt-1">
                  {GAME_DOCS[gameId]?.title || gameId}
                </h3>
              </div>
              <button
                onClick={() => setShowHowToPlayModal(false)}
                className="text-xs font-mono font-bold px-3 py-1 border-2 border-[#111111] bg-[#E5E5E0] hover:bg-[#111111] hover:text-[#F9F9F7]"
              >
                CLOSE [X]
              </button>
            </div>

            <div className="mb-5 p-4 border border-[#111111] bg-[#E5E5E0]">
              <h4 className="font-serif font-bold text-sm text-[#111111] uppercase tracking-wider mb-1">
                CORE ENGINEERING CONCEPT
              </h4>
              <p className="font-serif italic text-xs text-[#111111] leading-relaxed">
                "{GAME_DOCS[gameId]?.concept}"
              </p>
            </div>

            <div className="mb-5">
              <h4 className="font-sans font-bold text-xs text-[#737373] uppercase tracking-widest mb-2">
                LAB COMPONENTS & TOOLS
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {GAME_DOCS[gameId]?.components?.map((c, i) => (
                  <div key={i} className="p-2.5 border border-[#111111] bg-white">
                    <span className="font-mono font-bold text-xs text-[#111111] block mb-0.5">{c.name}</span>
                    <span className="font-sans text-[11px] text-[#525252] block leading-snug">{c.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-sans font-bold text-xs text-[#737373] uppercase tracking-widest mb-2">
                HOW TO PLAY (STEP-BY-STEP)
              </h4>
              <ol className="space-y-2 list-decimal list-inside font-sans text-xs text-[#111111]">
                {GAME_DOCS[gameId]?.steps?.map((s, i) => (
                  <li key={i} className="p-2 border-b border-[#E5E5E0]">
                    <span className="font-medium">{s}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="pt-2 flex justify-end">
              <TerminalButton onClick={() => setShowHowToPlayModal(false)} variant="primary" className="px-6 text-xs">
                GOT IT • START LAB
              </TerminalButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
