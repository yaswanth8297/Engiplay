import * as React from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getSocraticHint } from '../utils/api';
import { X, HelpCircle, Sparkles } from 'lucide-react';
import { TerminalButton } from '../shared/TerminalComponents';

interface TutorBotProps {
  gameId: string;
  level: number;
  attempts: number;
  lastAttemptDetails?: string;
  currentConcept?: string;
  isOpen: boolean;
  onClose: () => void;
  autoPromptHint?: boolean;
}

interface Message {
  sender: 'user' | 'tutor';
  text: string;
  timestamp: Date;
}

// TypewriterText component to animate character-by-character reveal
const TypewriterText: React.FC<{ text: string; delay?: number }> = ({ text, delay = 15 }) => {
  const [currentText, setCurrentText] = useState('');
  
  useEffect(() => {
    let index = 0;
    setCurrentText('');
    const timer = setInterval(() => {
      if (index < text.length) {
        setCurrentText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, delay);
    
    return () => clearInterval(timer);
  }, [text, delay]);
  
  return <span>{currentText}</span>;
};

export const TutorBot: React.FC<TutorBotProps> = ({
  gameId,
  level,
  attempts,
  lastAttemptDetails = 'Incorrect configuration',
  currentConcept = 'Engineering analysis',
  isOpen,
  onClose,
  autoPromptHint = false
}) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputVal, setInputVal] = useState('');

  // Reset chat context on level change
  useEffect(() => {
    setMessages([
      {
        sender: 'tutor',
        text: "WELCOME TO THE SOCRATIC TUTOR DESK.\nI am NOVA-9000, your STEM editorial correspondent. What engineering concept or diagnostic query shall we examine?",
        timestamp: new Date()
      }
    ]);
  }, [gameId, level]);

  // Handle auto-triggered hints
  useEffect(() => {
    if (autoPromptHint && isOpen && messages.length <= 1) {
      triggerHint('I need guidance on my current design setup.');
    }
  }, [autoPromptHint, isOpen]);

  const triggerHint = async (userPromptText: string) => {
    if (loading) return;
    
    const userMsg: Message = {
      sender: 'user',
      text: userPromptText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    
    try {
      const hint = await getSocraticHint({
        gameId,
        level,
        attempts,
        timeTaken: 0,
        lastAttempt: lastAttemptDetails,
        currentContext: currentConcept + `. Player prompt query: "${userPromptText}"`
      });
      
      setMessages(prev => [
        ...prev,
        {
          sender: 'tutor',
          text: hint,
          timestamp: new Date()
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'tutor',
          text: 'NOTICE: Dispatch link lost. Re-verify component connections and consult the gameplay guide.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    const text = inputVal;
    setInputVal('');
    triggerHint(text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-[#F9F9F7] border-l-2 border-[#111111] shadow-2xl z-50 flex flex-col font-body select-none">
      
      {/* Header */}
      <div className="p-4 border-b-2 border-[#111111] flex items-center justify-between bg-[#F9F9F7]">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-sans font-extrabold uppercase tracking-widest text-[#CC0000]">
            <Sparkles size={13} /> SOCRATIC CORRESPONDENT
          </div>
          <h3 className="font-serif font-black text-lg text-[#111111] uppercase tracking-tight">EDITORIAL TUTOR DESK</h3>
          <span className="text-[10px] font-mono text-[#737373] font-bold tracking-widest uppercase">LAB {gameId.toUpperCase()} • LEVEL {level}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 border border-[#111111] hover:bg-[#CC0000] hover:text-white transition"
        >
          <X size={16} />
        </button>
      </div>

      {/* Info Rules Banner */}
      <div className="border-b border-[#111111] p-3 text-xs font-sans bg-[#E5E5E0] text-[#111111] flex gap-2">
        <span className="font-bold text-[#CC0000] shrink-0">• NOTICE •</span>
        <span>NOVA will not give direct answers; only Socratic questions and physics clues to guide your solution.</span>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text selection:bg-[#111111] selection:text-[#F9F9F7]">
        {messages.map((msg, i) => {
          const isLatestTutor = msg.sender === 'tutor' && i === messages.length - 1;
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#737373] select-none">
                <span>{msg.sender === 'user' ? 'STUDENT' : 'SOCRATIC CORRESPONDENT'}</span>
                <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className={`p-3 border text-xs leading-relaxed ${
                msg.sender === 'user' 
                  ? 'border-[#111111] bg-[#111111] text-[#F9F9F7] font-mono' 
                  : 'border-[#111111] bg-[#F9F9F7] text-[#111111] font-body'
              }`}>
                <span className="font-sans font-bold uppercase tracking-wider text-[10px] block mb-1 opacity-75 select-none">
                  {msg.sender === 'user' ? 'You Asked:' : 'NOVA Dispatch:'}
                </span>
                <span className="whitespace-pre-wrap">
                  {isLatestTutor ? (
                    <TypewriterText text={msg.text} />
                  ) : (
                    msg.text
                  )}
                </span>
              </div>
            </div>
          );
        })}
        
        {loading && (
          <div className="p-3 border border-[#111111] bg-[#E5E5E0] text-xs font-mono font-bold text-[#111111] animate-pulse">
            NOVA &gt; COMPILING SOCRATIC HINT...
          </div>
        )}
      </div>

      {/* Presets/Buttons for Quick Action */}
      <div className="p-3 border-t border-[#111111] bg-[#E5E5E0] flex flex-wrap gap-2 select-none">
        <TerminalButton
          onClick={() => triggerHint("Explain failed diagnostics: why did my design crash?")}
          disabled={loading}
          variant="secondary"
          className="text-[10px] py-1.5 px-2"
        >
          INSPECT FAIL
        </TerminalButton>
        <TerminalButton
          onClick={() => triggerHint(`Explain physics concepts for Level ${level}.`)}
          disabled={loading}
          variant="secondary"
          className="text-[10px] py-1.5 px-2"
        >
          SHOW CONCEPT
        </TerminalButton>
        <TerminalButton
          onClick={() => triggerHint("Provide a Socratic guiding clue.")}
          disabled={loading}
          variant="primary"
          className="text-[10px] py-1.5 px-2"
        >
          GET CLUE
        </TerminalButton>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t-2 border-[#111111] bg-[#F9F9F7] flex items-center gap-2 select-none">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Type your question for NOVA..."
          disabled={loading}
          className="flex-1 bg-[#F9F9F7] border-b-2 border-[#111111] px-2 py-1.5 text-xs text-[#111111] focus:outline-none focus:bg-[#F0F0F0] font-sans"
        />
        <TerminalButton type="submit" disabled={loading} variant="primary" className="py-1.5 px-3 text-[10px]">
          SEND
        </TerminalButton>
      </form>
    </div>
  );
};

