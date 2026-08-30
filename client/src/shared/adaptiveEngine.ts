// Adaptive Difficulty Engine for EngiPlay

export interface AttemptRecord {
  score: number;
  timeTaken: number;
  hintsUsed: number;
  success: boolean;
}

export interface LevelHistory {
  attempts: number;
  records: AttemptRecord[];
}

export interface GameHistory {
  [level: number]: LevelHistory;
}

export interface GlobalHistory {
  [gameId: string]: GameHistory;
}

// Default settings for all games & levels
const DEFAULT_GAME_LEVEL_CONFIGS: Record<string, Record<number, any>> = {
  'logic-maze': {
    1: { explanation: 'Conditional Flow: Place if, else if / elif, and else tokens in correct locations to control traffic speed enforcement.' },
    2: { explanation: 'Iterative Loops: Configure a while loop condition and iteration counter to calculate sequential sums.' },
    3: { explanation: 'Hard Code Debugging: Identify and fix 3 critical runtime and logic bugs in array processing code.' }
  },
  'circuit-builder': {
    1: { budget: 300, bulbResistance: 10, wireResistance: 0, requiredBulbs: 1, allowedSwitches: 1, explanation: 'Simple Circuit: Connect battery and light bulb.' },
    2: { budget: 500, bulbResistance: 10, wireResistance: 0, requiredBulbs: 2, allowedSwitches: 1, explanation: 'Series Circuit: Flow current through two bulbs in a single path.' },
    3: { budget: 700, bulbResistance: 10, wireResistance: 0, requiredBulbs: 2, allowedSwitches: 2, explanation: 'Parallel Circuit: Give each bulb its own branch controlled by a switch.' }
  },
  'bridge-builder': {
    1: { budget: 600, explanation: 'Local Express: Draw wood/steel trusses to carry the train across. Minimal moves target: ≤ 8 beams.' },
    2: { budget: 900, explanation: 'Heavy Freight: Span a medium canyon gap with heavy train freight. Minimal moves target: ≤ 12 beams.' },
    3: { budget: 1300, explanation: 'Super Heavy Cargo: Wide canyon gap! Build strong triangular trusses under load stress. Minimal moves target: ≤ 16 beams.' }
  },
  'energy-balancer': {
    1: { batteryCapacity: 100, solarPeak: 50, windBase: 25, houseDemand: 40, criticalDemand: 20, duration: 60, explanation: 'Simple Power Grid: Sustain houses and battery during day & night cycles.' },
    2: { batteryCapacity: 150, solarPeak: 40, windBase: 15, houseDemand: 60, criticalDemand: 50, duration: 90, explanation: 'Fluctuating Winds: Balance high-priority Hospital load as winds die down.' },
    3: { batteryCapacity: 200, solarPeak: 30, windBase: 10, houseDemand: 80, criticalDemand: 70, duration: 120, explanation: 'Summer Peak: Manage solar variations and distribute power dynamically. Prioritize critical hospital nodes.' }
  }
};

// Retrieve historical data from local storage
export function getGlobalHistory(): GlobalHistory {
  try {
    const data = localStorage.getItem('engiplay_adaptive_history');
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

// Save historical data to local storage
export function saveGlobalHistory(history: GlobalHistory) {
  try {
    localStorage.setItem('engiplay_adaptive_history', JSON.stringify(history));
  } catch (err) {
    console.error('Error saving adaptive history:', err);
  }
}

// Record an attempt and update difficulty triggers
export function recordAttempt(
  gameId: string,
  level: number,
  success: boolean,
  score: number,
  timeTaken: number,
  hintsUsed: number
): { status: 'stay' | 'simplified' | 'advanced'; message: string } {
  const history = getGlobalHistory();
  if (!history[gameId]) history[gameId] = {};
  if (!history[gameId][level]) {
    history[gameId][level] = { attempts: 0, records: [] };
  }

  const levHist = history[gameId][level];
  levHist.attempts += 1;
  levHist.records.push({ score, timeTaken, hintsUsed, success });
  
  saveGlobalHistory(history);

  // Check adaptive rules
  // 1. Simplify trigger: 3 or more total attempts, and the last 3 attempts are fails
  const recentFails = levHist.records.slice(-3);
  if (recentFails.length >= 3 && recentFails.every(r => !r.success)) {
    return {
      status: 'simplified',
      message: 'Adaptive system: Simplifying difficulty settings to support learning.'
    };
  }

  // 2. Advance trigger: Completed twice in a row, with high speed (e.g. timeTaken under 70% of default or just fast) and no hints
  const recentSuccesses = levHist.records.slice(-2);
  if (
    recentSuccesses.length >= 2 &&
    recentSuccesses.every(r => r.success && r.hintsUsed === 0)
  ) {
    return {
      status: 'advanced',
      message: 'Adaptive system: Increasing difficulty parameters to challenge you!'
    };
  }

  return { status: 'stay', message: '' };
}

// Get the customized parameter profile for a game/level
export function getAdjustedConfig(gameId: string, level: number) {
  const baseConfig = DEFAULT_GAME_LEVEL_CONFIGS[gameId]?.[level] || { explanation: 'Solve the challenge!' };
  const history = getGlobalHistory();
  const levHist = history[gameId]?.[level];

  if (!levHist) {
    return { ...baseConfig, difficultyModifier: 'normal' };
  }

  const recentAttempts = levHist.records;
  
  // Simplify rules: 3 fails in a row
  const recentFails = recentAttempts.slice(-3);
  const isSimplified = recentFails.length >= 3 && recentFails.every(r => !r.success);

  // Advance rules: 2 clean speed run successes
  const recentSuccesses = recentAttempts.slice(-2);
  const isAdvanced = recentSuccesses.length >= 2 && recentSuccesses.every(r => r.success && r.hintsUsed === 0);

  const adjusted = { ...baseConfig };

  if (isSimplified) {
    adjusted.difficultyModifier = 'simplified';
    // Apply game-specific relief
    if (gameId === 'circuit-builder') {
      adjusted.budget = baseConfig.budget * 1.5; // More cash
    } else if (gameId === 'bridge-builder') {
      adjusted.budget = baseConfig.budget * 1.4; // More budget
      adjusted.loadWeight = baseConfig.loadWeight * 0.7; // Lower stress weight
    } else if (gameId === 'gear-pulley') {
      adjusted.tolerance = baseConfig.tolerance * 2; // Looser precision
    } else if (gameId === 'logic-maze') {
      adjusted.stepLimit = baseConfig.stepLimit + 10; // Extra steps
    } else if (gameId === 'energy-balancer') {
      adjusted.batteryCapacity = baseConfig.batteryCapacity * 1.5; // Bigger storage buffer
      adjusted.houseDemand = baseConfig.houseDemand * 0.8; // Lower load consumption
    } else if (gameId === 'fluid-flow') {
      adjusted.maxPressure = baseConfig.maxPressure * 1.5; // Stronger pipe endurance
      adjusted.targetFlow = baseConfig.targetFlow * 0.8; // Easiers target delivery
    }
  } else if (isAdvanced) {
    adjusted.difficultyModifier = 'advanced';
    // Apply game-specific penalties
    if (gameId === 'circuit-builder') {
      adjusted.budget = baseConfig.budget * 0.8; // Less cash
    } else if (gameId === 'bridge-builder') {
      adjusted.budget = baseConfig.budget * 0.8; // Tight cash constraint
      adjusted.loadWeight = baseConfig.loadWeight * 1.25; // Heavier stress load
    } else if (gameId === 'gear-pulley') {
      adjusted.tolerance = baseConfig.tolerance * 0.5; // Highly precise targets
    } else if (gameId === 'logic-maze') {
      adjusted.blocksAllowed = Math.max(3, baseConfig.blocksAllowed - 2); // Code optimization constraint
    } else if (gameId === 'energy-balancer') {
      adjusted.batteryCapacity = baseConfig.batteryCapacity * 0.8; // Tiny storage buffer
      adjusted.solarPeak = baseConfig.solarPeak * 0.8; // Cloudy sky!
    } else if (gameId === 'fluid-flow') {
      adjusted.maxPressure = baseConfig.maxPressure * 0.8; // Pipes burst easily
      adjusted.targetFlow = baseConfig.targetFlow * 1.2; // Extra delivery target
    }
  } else {
    adjusted.difficultyModifier = 'normal';
  }

  return adjusted;
}
