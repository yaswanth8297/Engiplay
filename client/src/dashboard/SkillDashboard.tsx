import * as React from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchClassroomStats } from '../utils/api';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { ArrowLeft, BookOpen, GraduationCap, RefreshCw, Award, Newspaper } from 'lucide-react';
import { TerminalButton, TerminalCard, StatBar, StatusTag } from '../shared/TerminalComponents';

interface SkillDashboardProps {
  progress?: any[];
  inlineMode?: boolean;
  onBack?: () => void;
}

export const SkillDashboard: React.FC<SkillDashboardProps> = ({
  progress = [],
  inlineMode = false,
  onBack
}) => {
  const { t } = useTranslation();
  const [classroomData, setClassroomData] = useState<any>(null);
  const [loading, setLoading] = useState(!inlineMode);
  const [error, setError] = useState('');

  // 1. Calculate Skill Profile Values dynamically for Student Radar
  const calculateStudentSkills = () => {
    const skills = {
      logic: 20,
      spatial_reasoning: 20,
      creativity: 20,
      optimization: 20,
      persistence: 20,
      problem_solving: 20
    };

    if (!progress || progress.length === 0) {
      return Object.entries(skills).map(([key, val]) => ({
        subject: t(`skill.${key}`),
        A: val,
        fullMark: 100
      }));
    }

    progress.forEach(p => {
      skills.problem_solving += 12;
      
      if (p.gameId === 'circuit-builder') {
        skills.logic += 15;
      }
      if (p.gameId === 'bridge-builder') {
        skills.spatial_reasoning += 15;
        skills.creativity += 10;
        if (p.score > 80) skills.optimization += 10;
      }
      if (p.gameId === 'logic-maze') {
        skills.logic += 20;
      }
      if (p.gameId === 'energy-balancer') {
        skills.optimization += 20;
      }

      if (p.attempts > 1) {
        skills.persistence += Math.min(25, p.attempts * 5);
      }
    });

    return Object.entries(skills).map(([key, val]) => ({
      subject: t(`skill.${key}`),
      A: Math.min(100, val),
      fullMark: 100
    }));
  };

  const radarData = calculateStudentSkills();

  // Load teacher stats
  const loadClassroomStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchClassroomStats();
      setClassroomData(data);
    } catch (err: any) {
      setError('CLASSROOM DIAGNOSTIC QUERY REFUSED. DATABASE CONNECTION OFFLINE.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!inlineMode) {
      loadClassroomStats();
    }
  }, [inlineMode]);

  // STUDENT RADAR MODE (INTEGRATED IN STUDENT SIDEBAR)
  if (inlineMode) {
    return (
      <div className="w-full flex flex-col gap-3 font-sans">
        <div className="h-[180px] w-full bg-[#F9F9F7] select-none">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#111111" strokeOpacity={0.2} />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#111111', fontSize: 9, fontFamily: 'Inter, sans-serif', fontWeight: 'bold' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#737373', fontSize: 7, fontFamily: 'Inter, sans-serif' }} />
              <Radar
                name="Skills"
                dataKey="A"
                stroke="#111111"
                fill="#111111"
                fillOpacity={0.2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="border-t border-[#111111] pt-3 space-y-1.5">
          {radarData.map((d: any) => (
            <StatBar 
              key={d.subject} 
              label={d.subject} 
              percentage={d.A} 
              maxChars={12} 
            />
          ))}
        </div>
      </div>
    );
  }

  // TEACHER DASHBOARD MODE
  return (
    <div className="min-h-screen bg-[#F9F9F7] text-[#111111] font-body p-6 flex flex-col select-none dot-pattern">
      
      {/* Header */}
      <header className="max-w-6xl w-full mx-auto mb-4 flex items-center justify-between gap-4">
        <TerminalButton onClick={onBack} variant="muted">
          ← BACK TO FRONT PAGE
        </TerminalButton>

        <div className="text-center">
          <h1 className="font-serif text-2xl font-black tracking-tight uppercase text-[#111111]">ACADEMIC CLASSROOM GAZETTE</h1>
          <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#CC0000]">ADMINISTRATIVE AUDIT & DIAGNOSTICS</span>
        </div>

        <TerminalButton onClick={loadClassroomStats} disabled={loading} variant="primary">
          REFRESH DISPATCH
        </TerminalButton>
      </header>

      {/* Main Divider rule */}
      <div className="newspaper-double-border max-w-6xl w-full mx-auto py-1 text-center font-sans text-xs font-extrabold uppercase tracking-widest text-[#111111] mb-6">
        CLASSROOM PERFORMANCE METRICS & STUDENT PROGRESS REPORT
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col justify-center items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#111111] border-t-[#CC0000] animate-spin" />
          <p className="text-xs font-sans font-bold tracking-widest uppercase text-[#525252]">FETCHING CLASSROOM RECORDS...</p>
        </div>
      ) : error ? (
        <div className="flex-1 max-w-xl mx-auto flex flex-col justify-center items-center text-center gap-4">
          <p className="text-[#CC0000] text-xs font-sans font-bold border border-[#CC0000] p-4 bg-[#CC0000]/5">{error}</p>
          <TerminalButton onClick={loadClassroomStats} variant="primary">
            RETRY INITIATE QUERY
          </TerminalButton>
        </div>
      ) : (
        <main className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Heatmap (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Topic Heatmap Container */}
            <TerminalCard title="CONCEPT FRICTION INDEX" borderColor="secondary">
              <p className="text-xs text-[#525252] mb-4">
                Identifies STEM domains with high attempt iterations and hint requests. High friction scores indicate potential learning bottlenecks.
              </p>

              {/* Heatmap visual bar chart */}
              <div className="h-[220px] w-full bg-[#F9F9F7] border border-[#111111] p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={classroomData.heatmap}
                    margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E0" />
                    <XAxis dataKey="domain" stroke="#111111" tick={{ fontSize: 9, fontFamily: 'Inter, sans-serif', fontWeight: 'bold' }} />
                    <YAxis stroke="#111111" tick={{ fontSize: 9, fontFamily: 'Inter, sans-serif' }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#F9F9F7', borderColor: '#111111', color: '#111111', fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 'bold' }}
                      labelStyle={{ color: '#CC0000', fontWeight: 'bold' }}
                    />
                    <Bar
                      dataKey="heatScore"
                      name="Friction Index"
                      fill="#111111"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Heatmap Grid Analysis */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                {classroomData.heatmap.map((item: any, i: number) => {
                  let status: 'ok' | 'warn' | 'err' = 'ok';
                  if (item.heatScore > 40) status = 'warn';
                  if (item.heatScore > 75) status = 'err';

                  return (
                    <div key={i} className="p-3 border border-[#111111] bg-[#F9F9F7]">
                      <span className="text-[10px] font-sans text-[#737373] font-bold block truncate">{item.domain.toUpperCase()}</span>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-xl font-mono font-black text-[#111111]">{item.heatScore}%</span>
                        <StatusTag status={status} className="text-[8px]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </TerminalCard>

            {/* Students Table */}
            <TerminalCard title="STUDENT ROSTER & STATUS DISPATCH" borderColor="primary">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-sans">
                  <thead>
                    <tr className="border-b-2 border-[#111111] text-[#111111] font-bold">
                      <th className="py-2.5 px-3 uppercase tracking-wider">Student Name</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider">Level</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider">Solves</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider">Module Diagnostics</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classroomData.students.map((student: any, i: number) => {
                      const completedCount = student.progress.filter((p: any) => p.score > 0).length;
                      return (
                        <tr key={i} className="border-b border-[#111111]/20 hover:bg-[#E5E5E0]/50 transition">
                          <td className="py-3 px-3 font-serif font-bold text-[#111111]">{student.name}</td>
                          <td className="py-3 px-3 text-[#737373] font-mono">Grade {student.grade}</td>
                          <td className="py-3 px-3 font-mono font-black text-[#111111]">{completedCount}/18</td>
                          <td className="py-3 px-3 flex gap-1.5 flex-wrap items-center">
                            {['circuit-builder', 'bridge-builder', 'gear-pulley', 'logic-maze', 'energy-balancer', 'fluid-flow'].map((gId) => {
                              const score = student.gamesCompleted[gId] || 0;
                              return (
                                <span
                                  key={gId}
                                  title={`${gId}: Level ${score}`}
                                  className={`px-1.5 py-0.5 border text-[9px] font-mono font-bold ${
                                    score > 0 
                                      ? 'border-[#111111] text-[#F9F9F7] bg-[#111111]' 
                                      : 'border-[#111111]/30 text-[#737373] bg-transparent'
                                  }`}
                                >
                                  {gId.split('-')[0].substring(0, 4).toUpperCase()}:L{score}
                                </span>
                              );
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TerminalCard>
          </div>

          {/* Right Column: Classroom Aggregates */}
          <div className="space-y-6">
            <TerminalCard title="CLASSROOM AGGREGATES" borderColor="secondary">
              <div className="space-y-4">
                <div className="p-3 border border-[#111111] bg-[#F9F9F7]">
                  <span className="text-[10px] font-sans text-[#737373] font-bold uppercase block">TOTAL ACTIVE CANDIDATES</span>
                  <span className="text-2xl font-mono font-black text-[#111111] mt-1 block">
                    {classroomData.students.length}
                  </span>
                </div>

                <div className="p-3 border border-[#111111] bg-[#F9F9F7]">
                  <span className="text-[10px] font-sans text-[#737373] font-bold uppercase block">AVG SOLVED MODULES</span>
                  <span className="text-2xl font-mono font-black text-[#111111] mt-1 block">
                    {(classroomData.students.reduce((sum: number, s: any) => {
                      const completed = s.progress.filter((p: any) => p.score > 0).length;
                      return sum + completed;
                    }, 0) / Math.max(1, classroomData.students.length)).toFixed(1)} / 18.0
                  </span>
                </div>

                <div className="p-3 border border-[#111111] bg-[#F9F9F7]">
                  <span className="text-[10px] font-sans text-[#737373] font-bold uppercase block">AVG SOCRATIC HELP CALLS</span>
                  <span className="text-2xl font-mono font-black text-[#CC0000] mt-1 block">
                    {(classroomData.students.reduce((sum: number, s: any) => {
                      const hints = s.progress.reduce((hSum: number, p: any) => hSum + p.hintsUsed, 0);
                      return sum + hints;
                    }, 0) / Math.max(1, classroomData.students.length)).toFixed(1)}
                  </span>
                </div>
              </div>
            </TerminalCard>

            <TerminalCard title="CURRICULAR ADVICE" borderColor="muted">
              <div className="mx-auto p-2 border border-[#111111] w-fit text-[#111111] bg-[#E5E5E0] mb-2">
                <BookOpen size={18} />
              </div>
              <h4 className="font-serif font-bold text-xs text-center uppercase text-[#111111] mb-2">DIAGNOSTIC GUIDANCE</h4>
              <p className="text-xs text-[#525252] leading-relaxed">
                Utilize the Concept Friction Index to pinpoint difficult concepts. High friction domains benefit from offline whiteboarding exercises (e.g. series vs parallel voltage drops or truss bridge vectors).
              </p>
            </TerminalCard>
          </div>
        </main>
      )}
    </div>
  );
};

