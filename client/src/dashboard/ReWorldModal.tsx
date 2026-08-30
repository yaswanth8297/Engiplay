import React, { useState } from 'react';
import { Gamepad2, Box, Cpu, Terminal, CheckCircle2, ExternalLink, Play, Sparkles, RefreshCw } from 'lucide-react';
import { TerminalButton } from '../shared/TerminalComponents';

interface ReWorldModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReWorldModal: React.FC<ReWorldModalProps> = ({ isOpen, onClose }) => {
  const [testingBackend, setTestingBackend] = useState(false);
  const [backendResponse, setBackendResponse] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'guide' | 'nova_ai'>('overview');

  if (!isOpen) return null;

  const handleTestNovaAi = async () => {
    setTestingBackend(true);
    setBackendResponse(null);
    try {
      const res = await fetch('http://localhost:8000/api/nova/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mission: 'Bridge Mission',
          failure_reason: 'center_span_snap',
          user_attempt: { trussCount: 4, steelBeams: 2, totalCost: 1400 },
          history: []
        })
      });
      if (res.ok) {
        const data = await res.json();
        setBackendResponse({ status: 'success', data });
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err: any) {
      // Provide fallback response demo if backend server isn't running on port 8000 right now
      setBackendResponse({
        status: 'fallback',
        data: {
          hint: "I noticed the center section gave way first! Which shape in your bridge is carrying the weight, and is it a rectangle or a triangle?",
          socratic_focus: "Truss Geometry & Weight Distribution (Local Heuristic Active)",
          recommended_action: "Try adding diagonal beams to create rigid triangular trusses."
        },
        note: "Nova Backend not running on localhost:8000 yet. Start it with `python re_world_game/run_nova_backend.py`!"
      });
    } finally {
      setTestingBackend(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#111111]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#F9F9F7] border-4 border-[#111111] p-6 md:p-8 hard-shadow max-h-[90vh] overflow-y-auto flex flex-col justify-between select-none animate-in fade-in duration-200">
        
        {/* Header */}
        <div>
          <div className="flex items-center justify-between border-b-2 border-[#111111] pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-[#CC0000] text-white p-2 border border-[#111111]">
                <Gamepad2 size={24} />
              </div>
              <div>
                <span className="text-[10px] font-sans font-black bg-[#111111] text-white px-2 py-0.5 uppercase tracking-widest">
                  UNITY 3D & NOVA AI ECOSYSTEM
                </span>
                <h2 className="font-serif text-3xl font-black uppercase text-[#111111] tracking-tight mt-0.5">
                  RE:WORLD 3D ENGINEERING SIMULATOR
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-xs font-mono font-bold px-3 py-1.5 border-2 border-[#111111] bg-[#E5E5E0] hover:bg-[#CC0000] hover:text-white transition"
            >
              CLOSE [X]
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[#111111] mb-6 gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-sans text-xs font-extrabold uppercase tracking-wider border-t-2 border-x-2 ${
                activeTab === 'overview'
                  ? 'border-[#111111] bg-[#F9F9F7] text-[#CC0000]'
                  : 'border-transparent text-[#737373] hover:text-[#111111]'
              }`}
            >
              🌐 OVERVIEW & LOCATION
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-4 py-2 font-sans text-xs font-extrabold uppercase tracking-wider border-t-2 border-x-2 ${
                activeTab === 'guide'
                  ? 'border-[#111111] bg-[#F9F9F7] text-[#CC0000]'
                  : 'border-transparent text-[#737373] hover:text-[#111111]'
              }`}
            >
              🛠️ UNITY & BACKEND SETUP GUIDE
            </button>
            <button
              onClick={() => setActiveTab('nova_ai')}
              className={`px-4 py-2 font-sans text-xs font-extrabold uppercase tracking-wider border-t-2 border-x-2 ${
                activeTab === 'nova_ai'
                  ? 'border-[#111111] bg-[#F9F9F7] text-[#CC0000]'
                  : 'border-transparent text-[#737373] hover:text-[#111111]'
              }`}
            >
              🧠 NOVA AI TUTOR TESTER
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="p-4 border-2 border-[#111111] bg-[#E5E5E0] space-y-2">
                <h3 className="font-serif font-black text-lg text-[#111111] uppercase tracking-tight flex items-center gap-2">
                  <Box size={20} className="text-[#CC0000]" /> WHERE IS RE:WORLD LOCATED IN THE PROJECT?
                </h3>
                <p className="font-serif text-sm text-[#404040] leading-relaxed">
                  The ReWorld game is built as a <strong>Unity 3D Physics Project</strong> and a <strong>FastAPI Nova AI Socratic Mentor backend</strong> inside your workspace at:
                </p>
                <div className="p-3 bg-[#111111] text-[#F9F9F7] font-mono text-xs overflow-x-auto space-y-1">
                  <div>📁 Unity Project: <span className="text-[#00FF66]">c:\Users\shibajyoti maity\Downloads\EngiPlays\re_world_game\unity_project</span></div>
                  <div>📁 Nova AI Backend: <span className="text-[#00FF66]">c:\Users\shibajyoti maity\Downloads\EngiPlays\re_world_game\nova_backend\main.py</span></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-[#111111] bg-white space-y-2">
                  <span className="text-[10px] font-sans font-black bg-[#CC0000] text-white px-2 py-0.5 uppercase">ANSWER TO YOUR QUESTION</span>
                  <h4 className="font-serif font-bold text-base text-[#111111]">DO I NEED TO DOWNLOAD UNITY LOCALLY?</h4>
                  <p className="text-xs font-serif text-[#525252] leading-relaxed">
                    <strong>YES (for 3D Unity Editor playing):</strong> If you want to open, edit, and play the native 3D Unity scene file directly in 3D physics graphics, you need <strong>Unity Hub (Unity 2022.3 LTS)</strong>.
                  </p>
                  <p className="text-xs font-serif text-[#525252] leading-relaxed">
                    <strong>NO (for Web / WebGL playing):</strong> Once built to WebGL (or using our built-in HTML5 Phasers), it runs directly inside any web browser without downloading Unity!
                  </p>
                </div>

                <div className="p-4 border border-[#111111] bg-white space-y-2">
                  <span className="text-[10px] font-sans font-black bg-[#111111] text-white px-2 py-0.5 uppercase">SYSTEM ARCHITECTURE</span>
                  <h4 className="font-serif font-bold text-base text-[#111111]">KEY RE:WORLD FEATURES</h4>
                  <ul className="text-xs font-sans space-y-1.5 text-[#404040]">
                    <li className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#CC0000]" /> Procedural 3D Terrain & Bridge Stress Visualizer</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#CC0000]" /> Electrical Grid Load & Circuit Sim in Unity C#</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#CC0000]" /> Live Nova AI Mentor connection via FastAPI HTTP</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#CC0000]" /> Real-time Socratic hint generation for failed attempts</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SETUP GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs font-sans">
              <div className="p-4 border border-[#111111] bg-white space-y-3">
                <h4 className="font-serif font-bold text-sm text-[#111111] uppercase tracking-wider flex items-center gap-2">
                  <ExternalLink size={16} className="text-[#CC0000]" /> STEP 1: OPEN RE:WORLD IN UNITY EDITOR
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-[#404040] font-medium">
                  <li>In <strong>Unity Hub</strong>, click <strong>Add / Open</strong> and select folder: <code className="bg-[#E5E5E0] px-1 py-0.5 text-[#111111]">re_world_game/unity_project</code>.</li>
                  <li>In Unity's <strong>Project Window</strong> at the bottom, navigate to <code className="bg-[#E5E5E0] px-1 py-0.5 text-[#111111]">Assets/Scripts/World/ProceduralWorldGenerator.cs</code>.</li>
                  <li>In Unity's <strong>Hierarchy Window</strong> (top-left), Right-Click → <strong>Create Empty</strong> object (name it <code className="bg-[#E5E5E0] px-1 py-0.5 text-[#111111]">WorldGenerator</code>).</li>
                  <li>Drag & Drop <code className="bg-[#E5E5E0] px-1 py-0.5 text-[#111111]">ProceduralWorldGenerator.cs</code> onto <code className="bg-[#E5E5E0] px-1 py-0.5 text-[#111111]">WorldGenerator</code>.</li>
                  <li>Click the <strong>Play ▶️</strong> button! The C# script programmatically generates the 3D canyon, village hub, riverbed, and solar platforms live!</li>
                  <li>Save the scene via <code className="bg-[#E5E5E0] px-1 py-0.5 text-[#111111]">Ctrl + S</code> as <code className="bg-[#E5E5E0] px-1 py-0.5 text-[#111111]">Assets/Scenes/MainWorld.unity</code>.</li>
                </ol>
              </div>

              <div className="p-4 border border-[#111111] bg-white space-y-3">
                <h4 className="font-serif font-bold text-sm text-[#111111] uppercase tracking-wider flex items-center gap-2">
                  <Terminal size={16} className="text-[#CC0000]" /> STEP 2: START THE NOVA AI FASTAPI BACKEND
                </h4>
                <p className="text-[#525252]">Run the following command in terminal to launch the Socratic AI Mentor backend:</p>
                <div className="p-3 bg-[#111111] text-[#00FF66] font-mono text-xs select-all">
                  python re_world_game/run_nova_backend.py
                </div>
                <p className="text-[11px] text-[#737373]">
                  The Nova AI API will listen at <code className="text-[#111111] font-bold">http://localhost:8000/api/nova/hint</code> and serve Socratic guidance to Unity C# scripts.
                </p>
              </div>

              <div className="p-4 border border-[#111111] bg-white space-y-3">
                <h4 className="font-serif font-bold text-sm text-[#111111] uppercase tracking-wider flex items-center gap-2">
                  <Cpu size={16} className="text-[#CC0000]" /> STEP 3: BUILD TO WEBGL FOR IN-BROWSER PLAY
                </h4>
                <p className="text-[#525252]">
                  In Unity, go to <strong>File → Build Settings → WebGL → Switch Platform → Build</strong>. Output to <code className="bg-[#E5E5E0] px-1 py-0.5 text-[#111111]">client/public/reworld_webgl</code> to load directly inside this web app.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: NOVA AI TUTOR TESTER */}
          {activeTab === 'nova_ai' && (
            <div className="space-y-4">
              <div className="p-4 border border-[#111111] bg-[#E5E5E0] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-[#CC0000]" size={18} />
                    <h4 className="font-serif font-bold text-sm uppercase text-[#111111]">NOVA AI Socratic Mentor Interactive API Test</h4>
                  </div>
                  <TerminalButton onClick={handleTestNovaAi} variant="primary" className="py-1.5 px-4 text-xs font-bold">
                    {testingBackend ? <RefreshCw className="animate-spin inline mr-1" size={14} /> : <Play className="inline mr-1" size={14} />}
                    TEST NOVA API HINT
                  </TerminalButton>
                </div>
                <p className="text-xs font-serif text-[#404040]">
                  Click the button above to simulate a failed Bridge Mission attempt sent to Nova AI mentor service.
                </p>
              </div>

              {backendResponse && (
                <div className="p-4 border-2 border-[#111111] bg-white space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-[#111111] pb-2">
                    <span className="text-[10px] font-sans font-black uppercase text-[#CC0000]">
                      NOVA RESPONSE • STATUS: {backendResponse.status.toUpperCase()}
                    </span>
                    {backendResponse.note && (
                      <span className="text-[10px] font-mono text-[#737373]">{backendResponse.note}</span>
                    )}
                  </div>

                  <div className="p-3 bg-[#F9F9F7] border border-[#111111] space-y-2 text-xs font-mono">
                    <div>
                      <span className="font-bold text-[#CC0000]">SOCRATIC HINT:</span>
                      <p className="font-serif italic text-sm text-[#111111] mt-0.5">"{backendResponse.data.hint}"</p>
                    </div>
                    <div className="pt-2 border-t border-[#E5E5E0] grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div><span className="font-bold">FOCUS:</span> {backendResponse.data.socratic_focus}</div>
                      <div><span className="font-bold">ACTION:</span> {backendResponse.data.recommended_action}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-6 border-t-2 border-[#111111] flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
          <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#737373]">
            RE:WORLD 3D STEM ENGINE • FASTAPI + UNITY C#
          </span>
          <TerminalButton onClick={onClose} variant="primary" className="py-2 px-6 text-xs font-bold w-full sm:w-auto">
            GOT IT • CLOSE GUIDE
          </TerminalButton>
        </div>

      </div>
    </div>
  );
};
