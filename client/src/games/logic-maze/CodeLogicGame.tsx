import React, { useState } from 'react';
import { TerminalButton } from '../../shared/TerminalComponents';
import { Play, CheckCircle2, AlertCircle, RefreshCw, Code2, Terminal, ChevronRight, ShieldCheck } from 'lucide-react';

interface CodeLogicGameProps {
  level: number;
  onSuccess: (score: number, timeTaken: number) => void;
  onFailure: (msg: string) => void;
}

type Language = 'java' | 'python' | 'cpp';

export const CodeLogicGame: React.FC<CodeLogicGameProps> = ({ level, onSuccess, onFailure }) => {
  const [language, setLanguage] = useState<Language>('java');
  const [selectedSlots, setSelectedSlots] = useState<{ [key: string]: string }>({});
  const [debugFixes, setDebugFixes] = useState<{ [lineId: number]: string }>({});
  const [activeDebugLine, setActiveDebugLine] = useState<number | null>(null);
  
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    `[COMPILER INITIALIZED] Target language: JAVA`,
    `[SYSTEM READY] Select conditional tokens to complete the boilerplate.`
  ]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [testResults, setTestResults] = useState<{ passed: boolean; message: string } | null>(null);

  // Switch language
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setSelectedSlots({});
    setDebugFixes({});
    setTestResults(null);
    setTerminalLogs([
      `[COMPILER INITIALIZED] Target language: ${lang.toUpperCase()}`,
      `[SYSTEM READY] Fill in the conditional logic blocks.`
    ]);
  };

  // Level 1: Conditional Tokens
  const level1Tokens = {
    java: ['if', 'else if', 'else', 'switch', 'case'],
    python: ['if', 'elif', 'else', 'while', 'for'],
    cpp: ['if', 'else if', 'else', 'switch', 'default']
  };

  // Level 2: Loop Tokens
  const level2Tokens = {
    java: ['while', 'i++', 'for', 'break', 'i = i + 2'],
    python: ['while', 'i += 1', 'for', 'break', 'pass'],
    cpp: ['while', 'i++', 'for', 'break', 'i += 1']
  };

  // Level 3: Debug options for buggy lines
  const level3DebugOptions: { [key: number]: { original: string; options: string[] } } = {
    3: {
      original: language === 'python' ? 'max_val = 0' : 'int maxVal = 0;',
      options: [
        language === 'python' ? 'max_val = numbers[0]' : 'int maxVal = numbers[0];',
        language === 'python' ? 'max_val = -1' : 'int maxVal = -1;',
        language === 'python' ? 'max_val = 9999' : 'int maxVal = 9999;'
      ]
    },
    5: {
      original: language === 'python' 
        ? 'for i in range(0, len(numbers) + 1):' 
        : 'for (int i = 0; i <= numbers.length; i++) {',
      options: [
        language === 'python' ? 'for i in range(0, len(numbers)):' : 'for (int i = 0; i < numbers.length; i++) {',
        language === 'python' ? 'for i in range(1, len(numbers)):' : 'for (int i = 1; i <= numbers.length; i++) {',
        language === 'python' ? 'for i in range(0, len(numbers) - 1):' : 'for (int i = 0; i < numbers.length - 1; i++) {'
      ]
    },
    7: {
      original: language === 'python'
        ? 'if numbers[i] < max_val:'
        : 'if (numbers[i] < maxVal) {',
      options: [
        language === 'python' ? 'if numbers[i] > max_val:' : 'if (numbers[i] > maxVal) {',
        language === 'python' ? 'if numbers[i] == max_val:' : 'if (numbers[i] == maxVal) {',
        language === 'python' ? 'if numbers[i] <= max_val:' : 'if (numbers[i] <= maxVal) {'
      ]
    }
  };

  const handleSelectToken = (slotId: string, token: string) => {
    setSelectedSlots(prev => ({ ...prev, [slotId]: token }));
  };

  const handleSelectDebugFix = (lineId: number, fix: string) => {
    setDebugFixes(prev => ({ ...prev, [lineId]: fix }));
    setActiveDebugLine(null);
  };

  const runCodeVerification = () => {
    setIsCompiling(true);
    setTerminalLogs(prev => [...prev, `[COMPILING] Verifying logic syntax & running test harness...`]);

    setTimeout(() => {
      let isSuccess = false;
      let errorMsg = '';

      if (level === 1) {
        const slot1 = selectedSlots['s1'];
        const slot2 = selectedSlots['s2'];
        const slot3 = selectedSlots['s3'];

        const validElif = language === 'python' ? 'elif' : 'else if';

        if (slot1 === 'if' && slot2 === validElif && slot3 === 'else') {
          isSuccess = true;
        } else {
          errorMsg = `Syntax Error / Logic Mismatch: Expected 'if', '${validElif}', and 'else' in order. Received '${slot1 || '?'}' -> '${slot2 || '?'}' -> '${slot3 || '?'}'`;
        }
      } else if (level === 2) {
        const slot1 = selectedSlots['s1'];
        const slot2 = selectedSlots['s2'];
        const validInc = language === 'python' ? 'i += 1' : 'i++';

        if (slot1 === 'while' && (slot2 === validInc || slot2 === 'i = i + 1' || slot2 === 'i += 1')) {
          isSuccess = true;
        } else {
          errorMsg = `Loop Execution Error: 'while' loop required for condition, and increment statement needed to prevent infinite loop!`;
        }
      } else if (level === 3) {
        const fix3 = debugFixes[3];
        const fix5 = debugFixes[5];
        const fix7 = debugFixes[7];

        const targetFix3 = language === 'python' ? 'max_val = numbers[0]' : 'int maxVal = numbers[0];';
        const targetFix5 = language === 'python' ? 'for i in range(0, len(numbers)):' : 'for (int i = 0; i < numbers.length; i++) {';
        const targetFix7 = language === 'python' ? 'if numbers[i] > max_val:' : 'if (numbers[i] > maxVal) {';

        if (fix3 === targetFix3 && fix5 === targetFix5 && fix7 === targetFix7) {
          isSuccess = true;
        } else {
          errorMsg = `Runtime Exception / Incorrect Logic: Out-of-bounds index or comparison operator failed on test array [12, 45, 89, 23].`;
        }
      }

      setIsCompiling(false);

      if (isSuccess) {
        setTerminalLogs(prev => [
          ...prev,
          `[COMPILATION SUCCESSFUL] 0 Errors, 0 Warnings.`,
          `[TEST HARNESS] Running 3 unit test suites...`,
          `✓ Test Case #1: PASSED`,
          `✓ Test Case #2: PASSED`,
          `✓ Test Case #3: PASSED`,
          `[STATUS 200] All test cases passed successfully!`
        ]);
        setTestResults({ passed: true, message: 'All test cases passed cleanly!' });
        setTimeout(() => onSuccess(100, 25), 1000);
      } else {
        setTerminalLogs(prev => [
          ...prev,
          `[COMPILER ERROR] Compilation aborted.`,
          `❌ ${errorMsg}`
        ]);
        setTestResults({ passed: false, message: errorMsg });
        onFailure(errorMsg);
      }
    }, 900);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 font-mono select-none">
      
      {/* Top Header: Language Selector & Level Mission */}
      <div className="bg-[#F9F9F7] border-2 border-[#111111] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 hard-shadow">
        <div>
          <div className="flex items-center gap-2 text-xs font-sans font-bold text-[#CC0000] uppercase tracking-widest">
            <Code2 size={16} />
            <span>ALGORITHM & CODE LAB • LEVEL {level}</span>
          </div>
          <h3 className="font-serif text-lg font-black text-[#111111] uppercase tracking-tight mt-0.5">
            {level === 1 && 'Level 1: Conditional Control Flow (if / else)'}
            {level === 2 && 'Level 2: Iterative Logic (while loop)'}
            {level === 3 && 'Level 3: Hard Code Debugging (Bug Fixing)'}
          </h3>
        </div>

        {/* Language selector tabs */}
        <div className="flex items-center gap-1.5 border-2 border-[#111111] p-1 bg-[#E5E5E0]">
          <span className="text-[10px] font-sans font-extrabold uppercase px-2 text-[#737373]">SELECT LANG:</span>
          {(['java', 'python', 'cpp'] as Language[]).map(lang => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={`px-3 py-1 text-xs font-mono font-bold uppercase transition border ${
                language === lang
                  ? 'border-[#111111] bg-[#111111] text-[#F9F9F7]'
                  : 'border-transparent bg-transparent text-[#111111] hover:bg-[#F9F9F7]'
              }`}
            >
              {lang === 'cpp' ? 'C++' : lang}
            </button>
          ))}
        </div>
      </div>

      {/* Main Code Editor Container */}
      <div className="bg-[#111111] text-[#F9F9F7] border-4 border-[#111111] hard-shadow overflow-hidden">
        
        {/* Editor Titlebar */}
        <div className="bg-[#1E1E1E] px-4 py-2 border-b border-[#333333] flex items-center justify-between text-xs text-[#888888] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#CC0000] inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#EAB308] inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#22C55E] inline-block" />
            <span className="ml-2 font-bold text-[#CCCCCC]">
              {level === 1 ? `SpeedEnforcer.${language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : 'java'}` : ''}
              {level === 2 ? `SumProcessor.${language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : 'java'}` : ''}
              {level === 3 ? `MaxFinder.${language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : 'java'}` : ''}
            </span>
          </div>
          <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#22C55E]">
            ● SYNTAX ENGINE ONLINE
          </span>
        </div>

        {/* Code Content */}
        <div className="p-6 text-sm leading-relaxed overflow-x-auto min-h-[220px]">
          
          {/* LEVEL 1 CODE BLOCK */}
          {level === 1 && (
            <div className="space-y-2">
              {language === 'java' && (
                <>
                  <div className="text-[#888888]">1  public class SpeedEnforcer {'{'}</div>
                  <div className="text-[#888888]">2      public static String checkSpeed(int speed) {'{'}</div>
                  <div className="pl-6 flex items-center gap-2">
                    <span className="text-[#888888]">3</span>
                    <button
                      onClick={() => handleSelectToken('s1', selectedSlots['s1'] ? '' : level1Tokens.java[0])}
                      className="px-2.5 py-0.5 border-2 border-dashed border-[#CC0000] bg-[#222222] text-[#FACC15] font-bold hover:border-[#FACC15]"
                    >
                      {selectedSlots['s1'] || '[ SLOT 1 ]'}
                    </button>
                    <span className="text-[#60A5FA]">(speed &gt; 80) {'{'}</span>
                  </div>
                  <div className="pl-12 text-[#22C55E]">4          return "HEAVY FINE";</div>
                  <div className="pl-6 text-[#888888]">5      {'}'}</div>
                  <div className="pl-6 flex items-center gap-2">
                    <span className="text-[#888888]">6</span>
                    <button
                      onClick={() => handleSelectToken('s2', selectedSlots['s2'] ? '' : level1Tokens.java[1])}
                      className="px-2.5 py-0.5 border-2 border-dashed border-[#CC0000] bg-[#222222] text-[#FACC15] font-bold hover:border-[#FACC15]"
                    >
                      {selectedSlots['s2'] || '[ SLOT 2 ]'}
                    </button>
                    <span className="text-[#60A5FA]">(speed &gt; 60) {'{'}</span>
                  </div>
                  <div className="pl-12 text-[#22C55E]">7          return "WARNING";</div>
                  <div className="pl-6 text-[#888888]">8      {'}'}</div>
                  <div className="pl-6 flex items-center gap-2">
                    <span className="text-[#888888]">9</span>
                    <button
                      onClick={() => handleSelectToken('s3', selectedSlots['s3'] ? '' : level1Tokens.java[2])}
                      className="px-2.5 py-0.5 border-2 border-dashed border-[#CC0000] bg-[#222222] text-[#FACC15] font-bold hover:border-[#FACC15]"
                    >
                      {selectedSlots['s3'] || '[ SLOT 3 ]'}
                    </button>
                    <span className="text-[#60A5FA]">'{'{'}'</span>
                  </div>
                  <div className="pl-12 text-[#22C55E]">10         return "SAFE SPEED";</div>
                  <div className="pl-6 text-[#888888]">11     {'}'}</div>
                  <div className="text-[#888888]">12     {'}'}</div>
                  <div className="text-[#888888]">13 {'}'}</div>
                </>
              )}

              {language === 'python' && (
                <>
                  <div className="text-[#888888]">1  def check_speed(speed):</div>
                  <div className="pl-6 flex items-center gap-2">
                    <span className="text-[#888888]">2</span>
                    <button
                      onClick={() => handleSelectToken('s1', selectedSlots['s1'] ? '' : level1Tokens.python[0])}
                      className="px-2.5 py-0.5 border-2 border-dashed border-[#CC0000] bg-[#222222] text-[#FACC15] font-bold hover:border-[#FACC15]"
                    >
                      {selectedSlots['s1'] || '[ SLOT 1 ]'}
                    </button>
                    <span className="text-[#60A5FA]">speed &gt; 80:</span>
                  </div>
                  <div className="pl-12 text-[#22C55E]">3      return "HEAVY FINE"</div>
                  <div className="pl-6 flex items-center gap-2">
                    <span className="text-[#888888]">4</span>
                    <button
                      onClick={() => handleSelectToken('s2', selectedSlots['s2'] ? '' : level1Tokens.python[1])}
                      className="px-2.5 py-0.5 border-2 border-dashed border-[#CC0000] bg-[#222222] text-[#FACC15] font-bold hover:border-[#FACC15]"
                    >
                      {selectedSlots['s2'] || '[ SLOT 2 ]'}
                    </button>
                    <span className="text-[#60A5FA]">speed &gt; 60:</span>
                  </div>
                  <div className="pl-12 text-[#22C55E]">5      return "WARNING"</div>
                  <div className="pl-6 flex items-center gap-2">
                    <span className="text-[#888888]">6</span>
                    <button
                      onClick={() => handleSelectToken('s3', selectedSlots['s3'] ? '' : level1Tokens.python[2])}
                      className="px-2.5 py-0.5 border-2 border-dashed border-[#CC0000] bg-[#222222] text-[#FACC15] font-bold hover:border-[#FACC15]"
                    >
                      {selectedSlots['s3'] || '[ SLOT 3 ]'}
                    </button>
                    <span className="text-[#60A5FA]">:</span>
                  </div>
                  <div className="pl-12 text-[#22C55E]">7      return "SAFE SPEED"</div>
                </>
              )}

              {language === 'cpp' && (
                <>
                  <div className="text-[#888888]">1  #include &lt;string&gt;</div>
                  <div className="text-[#888888]">2  std::string checkSpeed(int speed) {'{'}</div>
                  <div className="pl-6 flex items-center gap-2">
                    <span className="text-[#888888]">3</span>
                    <button
                      onClick={() => handleSelectToken('s1', selectedSlots['s1'] ? '' : level1Tokens.cpp[0])}
                      className="px-2.5 py-0.5 border-2 border-dashed border-[#CC0000] bg-[#222222] text-[#FACC15] font-bold hover:border-[#FACC15]"
                    >
                      {selectedSlots['s1'] || '[ SLOT 1 ]'}
                    </button>
                    <span className="text-[#60A5FA]">(speed &gt; 80) {'{'}</span>
                  </div>
                  <div className="pl-12 text-[#22C55E]">4          return "HEAVY FINE";</div>
                  <div className="pl-6 text-[#888888]">5      {'}'}</div>
                  <div className="pl-6 flex items-center gap-2">
                    <span className="text-[#888888]">6</span>
                    <button
                      onClick={() => handleSelectToken('s2', selectedSlots['s2'] ? '' : level1Tokens.cpp[1])}
                      className="px-2.5 py-0.5 border-2 border-dashed border-[#CC0000] bg-[#222222] text-[#FACC15] font-bold hover:border-[#FACC15]"
                    >
                      {selectedSlots['s2'] || '[ SLOT 2 ]'}
                    </button>
                    <span className="text-[#60A5FA]">(speed &gt; 60) {'{'}</span>
                  </div>
                  <div className="pl-12 text-[#22C55E]">7          return "WARNING";</div>
                  <div className="pl-6 text-[#888888]">8      {'}'}</div>
                  <div className="pl-6 flex items-center gap-2">
                    <span className="text-[#888888]">9</span>
                    <button
                      onClick={() => handleSelectToken('s3', selectedSlots['s3'] ? '' : level1Tokens.cpp[2])}
                      className="px-2.5 py-0.5 border-2 border-dashed border-[#CC0000] bg-[#222222] text-[#FACC15] font-bold hover:border-[#FACC15]"
                    >
                      {selectedSlots['s3'] || '[ SLOT 3 ]'}
                    </button>
                    <span className="text-[#60A5FA]">'{'{'}'</span>
                  </div>
                  <div className="pl-12 text-[#22C55E]">10         return "SAFE SPEED";</div>
                  <div className="pl-6 text-[#888888]">11     {'}'}</div>
                  <div className="text-[#888888]">12 {'}'}</div>
                </>
              )}
            </div>
          )}

          {/* LEVEL 2 CODE BLOCK */}
          {level === 2 && (
            <div className="space-y-2">
              <div className="text-[#888888]">1  // Calculate sum of integers up to limit</div>
              <div className="text-[#888888]">2  int computeSum(int limit) {'{'}</div>
              <div className="pl-6 text-[#F9F9F7]">3      int total = 0; int i = 1;</div>
              <div className="pl-6 flex items-center gap-2">
                <span className="text-[#888888]">4</span>
                <button
                  onClick={() => handleSelectToken('s1', selectedSlots['s1'] ? '' : 'while')}
                  className="px-2.5 py-0.5 border-2 border-dashed border-[#CC0000] bg-[#222222] text-[#FACC15] font-bold hover:border-[#FACC15]"
                >
                  {selectedSlots['s1'] || '[ SLOT 1 ]'}
                </button>
                <span className="text-[#60A5FA]">(i &lt;= limit) {'{'}</span>
              </div>
              <div className="pl-12 text-[#22C55E]">5          total += i;</div>
              <div className="pl-12 flex items-center gap-2">
                <span className="text-[#888888]">6</span>
                <button
                  onClick={() => handleSelectToken('s2', selectedSlots['s2'] ? '' : (language === 'python' ? 'i += 1' : 'i++'))}
                  className="px-2.5 py-0.5 border-2 border-dashed border-[#CC0000] bg-[#222222] text-[#FACC15] font-bold hover:border-[#FACC15]"
                >
                  {selectedSlots['s2'] || '[ SLOT 2 ]'}
                </button>
                <span className="text-[#888888]">{language === 'python' ? '' : ';'}</span>
              </div>
              <div className="pl-6 text-[#888888]">7      {'}'}</div>
              <div className="pl-6 text-[#22C55E]">8      return total;</div>
              <div className="text-[#888888]">9  {'}'}</div>
            </div>
          )}

          {/* LEVEL 3 BUG DEBUGGER BLOCK */}
          {level === 3 && (
            <div className="space-y-2">
              <div className="text-[#888888]">1  // Find maximum value in array</div>
              <div className="text-[#888888]">2  int findMax(int[] numbers) {'{'}</div>
              
              {/* Line 3 bug */}
              <div
                onClick={() => setActiveDebugLine(3)}
                className={`pl-6 cursor-pointer p-1 rounded transition border ${
                  activeDebugLine === 3 ? 'border-[#FACC15] bg-[#333333]' : debugFixes[3] ? 'border-[#22C55E] bg-[#22C55E]/10' : 'border-dashed border-[#CC0000] bg-[#CC0000]/10 hover:bg-[#CC0000]/20'
                }`}
              >
                <span className="text-[#888888] mr-2">3 [BUG]</span>
                <span className={debugFixes[3] ? 'text-[#22C55E] font-bold' : 'text-[#F87171]'}>
                  {debugFixes[3] || (language === 'python' ? 'max_val = 0' : 'int maxVal = 0;')}
                </span>
              </div>

              <div className="text-[#888888] pl-6">4</div>

              {/* Line 5 bug */}
              <div
                onClick={() => setActiveDebugLine(5)}
                className={`pl-6 cursor-pointer p-1 rounded transition border ${
                  activeDebugLine === 5 ? 'border-[#FACC15] bg-[#333333]' : debugFixes[5] ? 'border-[#22C55E] bg-[#22C55E]/10' : 'border-dashed border-[#CC0000] bg-[#CC0000]/10 hover:bg-[#CC0000]/20'
                }`}
              >
                <span className="text-[#888888] mr-2">5 [BUG]</span>
                <span className={debugFixes[5] ? 'text-[#22C55E] font-bold' : 'text-[#F87171]'}>
                  {debugFixes[5] || (language === 'python' ? 'for i in range(0, len(numbers) + 1):' : 'for (int i = 0; i <= numbers.length; i++) {')}
                </span>
              </div>

              {/* Line 7 bug */}
              <div
                onClick={() => setActiveDebugLine(7)}
                className={`pl-12 cursor-pointer p-1 rounded transition border ${
                  activeDebugLine === 7 ? 'border-[#FACC15] bg-[#333333]' : debugFixes[7] ? 'border-[#22C55E] bg-[#22C55E]/10' : 'border-dashed border-[#CC0000] bg-[#CC0000]/10 hover:bg-[#CC0000]/20'
                }`}
              >
                <span className="text-[#888888] mr-2">7 [BUG]</span>
                <span className={debugFixes[7] ? 'text-[#22C55E] font-bold' : 'text-[#F87171]'}>
                  {debugFixes[7] || (language === 'python' ? 'if numbers[i] < max_val:' : 'if (numbers[i] < maxVal) {')}
                </span>
              </div>

              <div className="pl-16 text-[#F9F9F7]">8          maxVal = numbers[i];</div>
              <div className="pl-12 text-[#888888]">9      {'}'}</div>
              <div className="pl-6 text-[#888888]">10     {'}'}</div>
              <div className="pl-6 text-[#22C55E]">11     return maxVal;</div>
              <div className="text-[#888888]">12 {'}'}</div>
            </div>
          )}
        </div>

        {/* Debug Line Replacements Popup */}
        {level === 3 && activeDebugLine && level3DebugOptions[activeDebugLine] && (
          <div className="bg-[#1E1E1E] p-4 border-t border-[#CC0000] space-y-2">
            <span className="text-xs text-[#FACC15] font-bold block uppercase tracking-wider">
              SELECT CORRECT FIX FOR LINE #{activeDebugLine}:
            </span>
            <div className="grid grid-cols-1 gap-2">
              {level3DebugOptions[activeDebugLine].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectDebugFix(activeDebugLine, opt)}
                  className="text-left px-3 py-2 border border-[#444444] bg-[#2A2A2A] text-[#22C55E] text-xs font-mono font-bold hover:border-[#22C55E] hover:bg-[#333333] transition"
                >
                  ✓ REPLACE WITH: <span className="text-[#F9F9F7]">{opt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Available Drag/Select Tokens Toolbox (Levels 1 & 2) */}
        {level < 3 && (
          <div className="bg-[#1A1A1A] p-4 border-t border-[#333333] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-sans font-bold uppercase text-[#737373]">CLICK TO PLACE TOKEN:</span>
              {(level === 1 ? level1Tokens[language] : level2Tokens[language]).map(token => (
                <button
                  key={token}
                  onClick={() => {
                    const emptySlot = !selectedSlots['s1'] ? 's1' : !selectedSlots['s2'] ? 's2' : !selectedSlots['s3'] ? 's3' : 's1';
                    handleSelectToken(emptySlot, token);
                  }}
                  className="px-3 py-1.5 border border-[#444444] bg-[#262626] text-[#FACC15] font-mono font-bold text-xs hover:border-[#FACC15] hover:bg-[#333333] transition"
                >
                  + {token}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setSelectedSlots({})}
              className="text-xs text-[#888888] hover:text-[#CC0000] underline font-sans font-bold uppercase"
            >
              CLEAR SLOTS
            </button>
          </div>
        )}
      </div>

      {/* Terminal Console Output */}
      <div className="bg-[#111111] border-2 border-[#111111] p-4 hard-shadow">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#333333] text-xs font-sans font-bold text-[#888888] uppercase">
          <span className="flex items-center gap-1.5 text-[#F9F9F7]">
            <Terminal size={14} className="text-[#CC0000]" /> TERMINAL COMPILER CONSOLE
          </span>
          {isCompiling && <span className="text-[#EAB308] animate-pulse">COMPILING...</span>}
        </div>

        <div className="h-28 overflow-y-auto space-y-1 font-mono text-xs text-[#888888]">
          {terminalLogs.map((log, i) => (
            <div key={i} className={log.includes('PASSED') || log.includes('SUCCESS') ? 'text-[#22C55E]' : log.includes('ERROR') || log.includes('❌') ? 'text-[#CC0000]' : ''}>
              {log}
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-[#333333] flex items-center justify-between">
          <span className="text-xs font-sans text-[#737373]">
            {level === 3 ? 'Fix all 3 buggy lines to verify compilation.' : 'Fill all blank slots with correct logic keywords.'}
          </span>

          <TerminalButton
            onClick={runCodeVerification}
            variant="primary"
            className="py-2 px-6 text-xs font-bold"
          >
            RUN CODE & VERIFY TEST CASES ▶️
          </TerminalButton>
        </div>
      </div>
    </div>
  );
};
