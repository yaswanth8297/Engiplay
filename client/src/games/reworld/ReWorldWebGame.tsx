import React, { useState, useEffect, useRef } from 'react';
import { Gamepad2, Play, RefreshCw, Zap, Boxes, ShieldAlert, Sparkles, CheckCircle2, AlertTriangle, Lightbulb, Sun, Cpu, Train, Wind, Building2 } from 'lucide-react';
import { TerminalButton } from '../../shared/TerminalComponents';

interface ReWorldWebGameProps {
  level: number;
  onSuccess: (score: number, timeTaken: number) => void;
  onFailure: (errorMessage: string) => void;
}

export const ReWorldWebGame: React.FC<ReWorldWebGameProps> = ({ level, onSuccess, onFailure }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Gameplay State
  const [selectedTool, setSelectedTool] = useState<'steel' | 'wood' | 'solar' | 'switch'>('steel');
  const [trussMembers, setTrussMembers] = useState<{ id: string; from: number; to: number; type: 'steel' | 'wood'; stress: number }[]>([]);
  const [placedSolars, setPlacedSolars] = useState<{ id: number; gridX: number; gridY: number }[]>([
    { id: 1, gridX: 0, gridY: 0 }
  ]);
  const [hospitalPowered, setHospitalPowered] = useState(false);
  const [townHallPowered, setTownHallPowered] = useState(false);
  const [gridSwitchOpen, setGridSwitchOpen] = useState(false);

  // Simulation & Physics State
  const [isSimulating, setIsSimulating] = useState(false);
  const [trainProgress, setTrainProgress] = useState(0); // 0 to 1
  const [simStatusMsg, setSimStatusMsg] = useState<string>('');
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Selected node for beam placing
  const [activeNode, setActiveNode] = useState<number | null>(null);

  // Nova AI Mentor State
  const [novaHint, setNovaHint] = useState<string | null>(null);
  const [loadingNova, setLoadingNova] = useState(false);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setTimeElapsed(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // 3D Nodes across Canyon Gap
  const canyonNodes = [
    { id: 0, wx: -180, wy: 0, wz: 0, label: 'Left Cliff' },
    { id: 1, wx: -90, wy: 0, wz: 0, label: 'Mid Deck 1' },
    { id: 2, wx: 0, wy: 0, wz: 0, label: 'Mid Deck 2' },
    { id: 3, wx: 90, wy: 0, wz: 0, label: 'Mid Deck 3' },
    { id: 4, wx: 180, wy: 0, wz: 0, label: 'Right Cliff' },
    { id: 5, wx: -135, wy: -60, wz: 0, label: 'Lower Support L' },
    { id: 6, wx: 0, wy: -75, wz: 0, label: 'Center Tower Anchor' },
    { id: 7, wx: 135, wy: -60, wz: 0, label: 'Lower Support R' }
  ];

  // Isometric 3D Projection Engine
  const isoProject = (wx: number, wy: number, wz: number, originX: number, originY: number) => {
    // 3D Isometric rotation angle (30 deg)
    const angle = Math.PI / 6;
    const sx = originX + (wx - wz) * Math.cos(angle);
    const sy = originY + (wx + wz) * Math.sin(angle) - wy;
    return { sx, sy };
  };

  // Main Render Loop (60 FPS)
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const originX = canvas.width / 2;
      const originY = 220;

      // 1. SKYBOX & SUNLIGHT GRADIENT
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, '#E8E8E0');
      skyGrad.addColorStop(0.6, '#F9F9F7');
      skyGrad.addColorStop(1, '#E2E2DC');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Sun & Rays
      ctx.fillStyle = '#CC0000';
      ctx.globalAlpha = 0.08;
      ctx.beginPath();
      ctx.arc(600, 70, 90, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // 2. BACKDROP MOUNTAIN RANGES (3D Layers)
      ctx.fillStyle = '#D6D6D0';
      ctx.beginPath();
      ctx.moveTo(0, 160);
      ctx.lineTo(120, 90);
      ctx.lineTo(240, 150);
      ctx.lineTo(380, 80);
      ctx.lineTo(520, 140);
      ctx.lineTo(700, 70);
      ctx.lineTo(800, 160);
      ctx.lineTo(800, 350);
      ctx.lineTo(0, 350);
      ctx.fill();

      // 3. CANYON RIVER BED & WATER FLOW (3D Reflection)
      const riverTopL = isoProject(-220, -110, -150, originX, originY);
      const riverTopR = isoProject(220, -110, -150, originX, originY);
      const riverBotR = isoProject(220, -110, 150, originX, originY);
      const riverBotL = isoProject(-220, -110, 150, originX, originY);

      ctx.fillStyle = '#B4C5D6';
      ctx.beginPath();
      ctx.moveTo(riverTopL.sx, riverTopL.sy);
      ctx.lineTo(riverTopR.sx, riverTopR.sy);
      ctx.lineTo(riverBotR.sx, riverBotR.sy);
      ctx.lineTo(riverBotL.sx, riverBotL.sy);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#9BB0C4';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Animated Water Waves
      const t = Date.now() * 0.002;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      for (let i = -180; i < 180; i += 60) {
        const waveP = isoProject(i + Math.sin(t + i) * 10, -110, Math.cos(t + i) * 20, originX, originY);
        ctx.beginPath();
        ctx.arc(waveP.sx, waveP.sy, 8, 0, Math.PI);
        ctx.stroke();
      }

      // 4. LEFT CLIFF (3D BLOCK)
      draw3DBlock(ctx, originX, originY, -260, 0, -120, 100, -120, 240, '#8C8C84', '#6E6E67', '#52524D');
      // RIGHT CLIFF (3D BLOCK)
      draw3DBlock(ctx, originX, originY, 160, 0, -120, 100, -120, 240, '#8C8C84', '#6E6E67', '#52524D');

      // 5. VILLAGE BUILDINGS ON LEFT CLIFF
      // Town Hall
      const townPos = isoProject(-210, 0, -40, originX, originY);
      drawBuilding(ctx, townPos.sx, townPos.sy, 'TOWN HALL', townHallPowered);

      // Hospital
      const hospPos = isoProject(-210, 0, 40, originX, originY);
      drawBuilding(ctx, hospPos.sx, hospPos.sy, 'HOSPITAL 🏥', hospitalPowered);

      // 6. POWER STATION PLATFORM ON RIGHT CLIFF
      const powerPos = isoProject(210, 0, 0, originX, originY);
      drawPowerPlatform(ctx, powerPos.sx, powerPos.sy, placedSolars.length);

      // 7. ROAD / TRAIN TRACK ACROSS CANYON
      const trackStart = isoProject(-260, 2, 0, originX, originY);
      const trackEnd = isoProject(260, 2, 0, originX, originY);

      ctx.beginPath();
      ctx.moveTo(trackStart.sx, trackStart.sy);
      ctx.lineTo(trackEnd.sx, trackEnd.sy);
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Track Sleepers
      for (let i = -240; i <= 240; i += 20) {
        const p1 = isoProject(i, 2, -8, originX, originY);
        const p2 = isoProject(i, 2, 8, originX, originY);
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.strokeStyle = '#404040';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 8. DRAW TRUSS MEMBERS WITH REAL-TIME STRESS HEATMAP
      trussMembers.forEach(m => {
        const n1 = canyonNodes.find(n => n.id === m.from);
        const n2 = canyonNodes.find(n => n.id === m.to);
        if (n1 && n2) {
          const p1 = isoProject(n1.wx, n1.wy, n1.wz, originX, originY);
          const p2 = isoProject(n2.wx, n2.wy, n2.wz, originX, originY);

          ctx.beginPath();
          ctx.moveTo(p1.sx, p1.sy);
          ctx.lineTo(p2.sx, p2.sy);

          // Stress color interpolation (Green = safe, Yellow = heavy, Red = snapping limit)
          if (m.stress > 0.8) {
            ctx.strokeStyle = '#CC0000';
            ctx.lineWidth = m.type === 'steel' ? 6 : 4;
          } else if (m.stress > 0.4) {
            ctx.strokeStyle = '#FF9900';
            ctx.lineWidth = m.type === 'steel' ? 5 : 3;
          } else {
            ctx.strokeStyle = m.type === 'steel' ? '#111111' : '#8B4513';
            ctx.lineWidth = m.type === 'steel' ? 4 : 3;
          }
          ctx.stroke();
        }
      });

      // 9. DRAW FREIGHT TRAIN ANIMATION (When Simulating)
      if (isSimulating) {
        const trainWx = -240 + trainProgress * 480;
        const trainP = isoProject(trainWx, 12, 0, originX, originY);

        // Train Locomotive
        ctx.fillStyle = '#CC0000';
        ctx.fillRect(trainP.sx - 15, trainP.sy - 15, 30, 18);
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 2;
        ctx.strokeRect(trainP.sx - 15, trainP.sy - 15, 30, 18);

        // Locomotive Chimney & Smoke
        ctx.fillStyle = '#111111';
        ctx.fillRect(trainP.sx + 8, trainP.sy - 22, 5, 8);
        
        // Smoke Particles
        ctx.fillStyle = 'rgba(180, 180, 180, 0.6)';
        ctx.beginPath();
        ctx.arc(trainP.sx + 10 - Math.sin(t * 5) * 4, trainP.sy - 28, 6, 0, Math.PI * 2);
        ctx.arc(trainP.sx + 5, trainP.sy - 34, 9, 0, Math.PI * 2);
        ctx.fill();

        // Cargo Car 1
        const car1P = isoProject(trainWx - 40, 12, 0, originX, originY);
        ctx.fillStyle = '#111111';
        ctx.fillRect(car1P.sx - 15, car1P.sy - 12, 28, 15);

        // Cargo Car 2
        const car2P = isoProject(trainWx - 75, 12, 0, originX, originY);
        ctx.fillStyle = '#525252';
        ctx.fillRect(car2P.sx - 15, car2P.sy - 12, 28, 15);
      }

      // 10. DRAW CANYON NODES
      canyonNodes.forEach(node => {
        const p = isoProject(node.wx, node.wy, node.wz, originX, originY);
        const isActive = activeNode === node.id;

        ctx.beginPath();
        ctx.arc(p.sx, p.sy, isActive ? 9 : 7, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? '#CC0000' : '#F9F9F7';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#111111';
        ctx.stroke();

        if (isActive) {
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, 14, 0, Math.PI * 2);
          ctx.strokeStyle = '#CC0000';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      // 11. POWER FLOW SPARK PARTICLES (If power active)
      if (hospitalPowered || townHallPowered) {
        ctx.fillStyle = '#00FF66';
        const pSpark = isoProject(-210 + (Math.sin(t * 4) + 1) * 210, 5, 0, originX, originY);
        ctx.beginPath();
        ctx.arc(pSpark.sx, pSpark.sy, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [trussMembers, placedSolars, hospitalPowered, townHallPowered, isSimulating, trainProgress, activeNode]);

  // Helper 3D Block Drawer
  const draw3DBlock = (
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    wx: number,
    wy: number,
    wz: number,
    dw: number,
    dh: number,
    dd: number,
    topColor: string,
    leftColor: string,
    rightColor: string
  ) => {
    // Top Face
    const p1 = isoProject(wx, wy, wz, ox, oy);
    const p2 = isoProject(wx + dw, wy, wz, ox, oy);
    const p3 = isoProject(wx + dw, wy, wz + dd, ox, oy);
    const p4 = isoProject(wx, wy, wz + dd, ox, oy);

    ctx.fillStyle = topColor;
    ctx.beginPath();
    ctx.moveTo(p1.sx, p1.sy);
    ctx.lineTo(p2.sx, p2.sy);
    ctx.lineTo(p3.sx, p3.sy);
    ctx.lineTo(p4.sx, p4.sy);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Front Left Face
    const p1b = isoProject(wx, wy + dh, wz + dd, ox, oy);
    const p4b = isoProject(wx, wy + dh, wz, ox, oy);

    ctx.fillStyle = leftColor;
    ctx.beginPath();
    ctx.moveTo(p1.sx, p1.sy);
    ctx.lineTo(p4.sx, p4.sy);
    ctx.lineTo(p1b.sx, p1b.sy);
    ctx.lineTo(p4b.sx, p4b.sy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Front Right Face
    const p3b = isoProject(wx + dw, wy + dh, wz + dd, ox, oy);

    ctx.fillStyle = rightColor;
    ctx.beginPath();
    ctx.moveTo(p4.sx, p4.sy);
    ctx.lineTo(p3.sx, p3.sy);
    ctx.lineTo(p3b.sx, p3b.sy);
    ctx.lineTo(p1b.sx, p1b.sy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  const drawBuilding = (ctx: CanvasRenderingContext2D, x: number, y: number, label: string, powered: boolean) => {
    ctx.fillStyle = powered ? '#E5E5E0' : '#404040';
    ctx.fillRect(x - 20, y - 40, 40, 40);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 20, y - 40, 40, 40);

    // Roof
    ctx.fillStyle = powered ? '#CC0000' : '#111111';
    ctx.beginPath();
    ctx.moveTo(x - 24, y - 40);
    ctx.lineTo(x, y - 55);
    ctx.lineTo(x + 24, y - 40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Windows Glowing
    ctx.fillStyle = powered ? '#00FF66' : '#FF9900';
    ctx.fillRect(x - 12, y - 30, 8, 8);
    ctx.fillRect(x + 4, y - 30, 8, 8);

    // Label
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(label, x - 25, y + 12);
  };

  const drawPowerPlatform = (ctx: CanvasRenderingContext2D, x: number, y: number, solarCount: number) => {
    ctx.fillStyle = '#E5E5E0';
    ctx.fillRect(x - 25, y - 20, 50, 30);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 25, y - 20, 50, 30);

    // Solar Panels
    for (let i = 0; i < Math.min(solarCount, 4); i++) {
      const px = x - 18 + (i % 2) * 20;
      const py = y - 15 + Math.floor(i / 2) * 12;
      ctx.fillStyle = '#0066FF';
      ctx.fillRect(px, py, 16, 9);
      ctx.strokeStyle = '#F9F9F7';
      ctx.lineWidth = 1;
      ctx.strokeRect(px, py, 16, 9);
    }

    ctx.fillStyle = '#111111';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('SOLAR SITE', x - 25, y + 22);
  };

  // Canvas Click Handler
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const originX = canvas.width / 2;
    const originY = 220;

    // Check node click
    const clickedNode = canyonNodes.find(node => {
      const p = isoProject(node.wx, node.wy, node.wz, originX, originY);
      return Math.hypot(p.sx - clickX, p.sy - clickY) < 18;
    });

    if (selectedTool === 'steel' || selectedTool === 'wood') {
      if (clickedNode) {
        if (activeNode === null) {
          setActiveNode(clickedNode.id);
        } else {
          if (activeNode !== clickedNode.id) {
            const memberId = `${Math.min(activeNode, clickedNode.id)}-${Math.max(activeNode, clickedNode.id)}`;
            if (!trussMembers.some(m => m.id === memberId)) {
              setTrussMembers(prev => [
                ...prev,
                {
                  id: memberId,
                  from: Math.min(activeNode, clickedNode.id),
                  to: Math.max(activeNode, clickedNode.id),
                  type: selectedTool,
                  stress: 0.1
                }
              ]);
            }
          }
          setActiveNode(null);
        }
      }
    } else if (selectedTool === 'solar') {
      if (placedSolars.length < 4) {
        setPlacedSolars(prev => [...prev, { id: prev.length + 1, gridX: prev.length, gridY: 0 }]);
      }
    } else if (selectedTool === 'switch') {
      setGridSwitchOpen(prev => !prev);
      setHospitalPowered(true);
      setTownHallPowered(true);
    }
  };

  // Run Freight Train & Physics Stress Test
  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTrainProgress(0);
    setSimStatusMsg('DEPARTING HEAVY FREIGHT TRAIN... SIMULATING LOAD STRESS...');
    setNovaHint(null);

    // Calculate Member Stress
    const updatedMembers = trussMembers.map(m => {
      const isCenter = m.from === 2 || m.to === 2 || m.from === 6 || m.to === 6;
      return {
        ...m,
        stress: isCenter ? (m.type === 'steel' ? 0.35 : 0.85) : 0.2
      };
    });
    setTrussMembers(updatedMembers);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.04;
      setTrainProgress(progress);

      if (progress >= 1.0) {
        clearInterval(interval);
        setIsSimulating(false);

        // Verification Logic
        const hasCenterSupport = trussMembers.some(m => m.from === 2 || m.to === 2 || m.from === 6 || m.to === 6);
        const hasEnoughBeams = trussMembers.length >= 4;

        if (level === 1) {
          // Level 1: Power grid check
          setHospitalPowered(true);
          setTownHallPowered(true);
          setSimStatusMsg('✅ LEVEL 1 CLEARED! TOWN & HOSPITAL POWERED CLEANLY!');
          setTimeout(() => onSuccess(100, timeElapsed), 1200);
        } else if (hasCenterSupport && hasEnoughBeams) {
          setSimStatusMsg('✅ MISSION ACCOMPLISHED! TRUSS BRIDGE PASSED FREIGHT LOAD TEST!');
          setTimeout(() => onSuccess(95, timeElapsed), 1200);
        } else {
          setSimStatusMsg('⚠️ BRIDGE COLLAPSED UNDER HEAVY TRAIN LOAD!');
          onFailure('Center span buckled under freight train load due to missing triangular truss members.');

          // Query Nova AI Mentor for hint
          fetchNovaHint();
        }
      }
    }, 80);
  };

  const fetchNovaHint = async () => {
    setLoadingNova(true);
    try {
      const res = await fetch('http://localhost:8000/api/nova/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mission: 'Bridge Mission',
          failure_reason: 'center_span_snap',
          user_attempt: { beamCount: trussMembers.length },
          history: []
        })
      });
      if (res.ok) {
        const data = await res.json();
        setNovaHint(data.hint);
      } else {
        throw new Error('Fallback rule');
      }
    } catch {
      setNovaHint('The center canyon span buckled first! Which geometric shape carries compressive weight without bending — a square or a triangle?');
    } finally {
      setLoadingNova(false);
    }
  };

  return (
    <div className="w-full max-w-5xl bg-[#F9F9F7] border-4 border-[#111111] p-4 md:p-6 hard-shadow select-none space-y-4">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between border-b-2 border-[#111111] pb-3 gap-2">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-sans font-black bg-[#CC0000] text-white px-2.5 py-1 uppercase tracking-widest">
            3D ISOMETRIC ENGINE
          </span>
          <h3 className="font-serif text-xl font-black uppercase text-[#111111] tracking-tight">
            RE:WORLD 3D • LEVEL {level}: CANYON TRUSS & MICROGRID
          </h3>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono font-bold">
          <span>TIME: {timeElapsed}s</span>
          <span>TRUSSES: {trussMembers.length}</span>
          <span>SOLARS: {placedSolars.length}</span>
        </div>
      </div>

      {/* Main Canvas & Toolbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* Left Toolbox */}
        <div className="lg:col-span-3 border-2 border-[#111111] bg-[#E5E5E0] p-4 space-y-3">
          <span className="text-[10px] font-sans font-black uppercase tracking-widest text-[#111111] block border-b border-[#111111] pb-1">
            ENGINEERING TOOLBOX
          </span>

          <button
            onClick={() => { setSelectedTool('steel'); setActiveNode(null); }}
            className={`w-full text-left p-2.5 border-2 text-xs font-mono font-bold flex items-center gap-2 ${
              selectedTool === 'steel' ? 'border-[#CC0000] bg-[#111111] text-white' : 'border-[#111111] bg-[#F9F9F7] text-[#111111]'
            }`}
          >
            <Boxes size={16} /> 🔩 STEEL TRUSS BEAM
          </button>

          <button
            onClick={() => { setSelectedTool('wood'); setActiveNode(null); }}
            className={`w-full text-left p-2.5 border-2 text-xs font-mono font-bold flex items-center gap-2 ${
              selectedTool === 'wood' ? 'border-[#CC0000] bg-[#111111] text-white' : 'border-[#111111] bg-[#F9F9F7] text-[#111111]'
            }`}
          >
            <Boxes size={16} /> 🪵 WOOD BEAM
          </button>

          <button
            onClick={() => { setSelectedTool('solar'); setActiveNode(null); }}
            className={`w-full text-left p-2.5 border-2 text-xs font-mono font-bold flex items-center gap-2 ${
              selectedTool === 'solar' ? 'border-[#CC0000] bg-[#111111] text-white' : 'border-[#111111] bg-[#F9F9F7] text-[#111111]'
            }`}
          >
            <Sun size={16} /> ☀️ SOLAR ARRAY MODULE
          </button>

          <button
            onClick={() => { setSelectedTool('switch'); setActiveNode(null); }}
            className={`w-full text-left p-2.5 border-2 text-xs font-mono font-bold flex items-center gap-2 ${
              selectedTool === 'switch' ? 'border-[#CC0000] bg-[#111111] text-white' : 'border-[#111111] bg-[#F9F9F7] text-[#111111]'
            }`}
          >
            <Zap size={16} /> 🔌 POWER GRID SWITCH
          </button>

          <div className="p-3 border border-[#111111] bg-[#F9F9F7] text-[11px] font-mono text-[#525252] leading-snug">
            {selectedTool === 'steel' || selectedTool === 'wood' ? (
              <span>Click two canyon nodes in sequence to construct a structural truss member!</span>
            ) : selectedTool === 'solar' ? (
              <span>Click the right cliff site to deploy additional solar array modules!</span>
            ) : (
              <span>Click to toggle town power grid main priority switch ON / OFF.</span>
            )}
          </div>

          <button
            onClick={() => {
              setTrussMembers([]);
              setPlacedSolars([{ id: 1, gridX: 0, gridY: 0 }]);
              setActiveNode(null);
            }}
            className="w-full text-xs font-mono font-bold py-2 border border-[#111111] bg-[#E5E5E0] hover:bg-[#CC0000] hover:text-white transition"
          >
            RESET CANYON DESIGN 🔄
          </button>
        </div>

        {/* 3D Isometric WebGL Canvas */}
        <div className="lg:col-span-9 border-2 border-[#111111] bg-white relative hard-shadow">
          <canvas
            ref={canvasRef}
            width={720}
            height={380}
            onClick={handleCanvasClick}
            className="w-full h-[380px] cursor-pointer block"
          />

          {isSimulating && (
            <div className="absolute top-4 left-4 bg-[#111111] text-white p-3 border border-[#F9F9F7] text-xs font-mono font-bold flex items-center gap-2 shadow-lg animate-pulse">
              <Train size={18} className="text-[#CC0000]" />
              <span>{simStatusMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Physics Run Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t-2 border-[#111111]">
        <div className="flex items-center gap-4 text-xs font-sans">
          <span className="flex items-center gap-1"><Building2 size={14} className="text-[#CC0000]" /> TOWN: {townHallPowered ? 'POWERED ⚡' : 'DARK ❌'}</span>
          <span className="flex items-center gap-1"><Cpu size={14} className="text-[#CC0000]" /> HOSPITAL: {hospitalPowered ? 'ONLINE ⚡' : 'STANDBY ❌'}</span>
        </div>

        <TerminalButton
          onClick={handleRunSimulation}
          disabled={isSimulating}
          variant="primary"
          className="py-3 px-8 text-xs font-black bg-[#CC0000] text-white"
        >
          RUN FREIGHT TRAIN STRESS TEST ▶️
        </TerminalButton>
      </div>

      {/* Nova AI Mentor Hint Panel */}
      {novaHint && (
        <div className="p-4 border-2 border-[#CC0000] bg-[#CC0000]/5 text-xs font-mono space-y-1.5 animate-in fade-in">
          <div className="flex items-center gap-2 text-[#CC0000] font-bold">
            <Sparkles size={16} />
            <span>NOVA AI MENTOR (SOCRATIC CORRESPONDENT):</span>
          </div>
          <p className="font-serif italic text-sm text-[#111111]">"{novaHint}"</p>
        </div>
      )}
    </div>
  );
};
