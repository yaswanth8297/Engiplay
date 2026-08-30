import express from 'express';
import { authenticateToken } from './auth.js';

const router = express.Router();

// MINIMAX ALGORITHMIC SOLVER FOR CODE-A-BOT / LOGIC MAZE
const MAZES = {
  1: {
    grid: [
      [1, 1, 1, 1, 1, 1],
      [1, 3, 0, 0, 1, 1],
      [1, 1, 1, 0, 1, 1],
      [1, 1, 0, 0, 1, 1],
      [1, 2, 0, 1, 1, 1],
      [1, 1, 1, 1, 1, 1]
    ],
    startX: 1, startY: 4, exitX: 1, exitY: 1
  },
  2: {
    grid: [
      [1, 1, 1, 1, 1, 1],
      [1, 2, 0, 0, 0, 1],
      [1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 1],
      [1, 3, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1]
    ],
    startX: 1, startY: 1, exitX: 1, exitY: 4
  },
  3: {
    grid: [
      [1, 1, 1, 1, 1, 1],
      [1, 2, 0, 1, 3, 1],
      [1, 1, 0, 1, 0, 1],
      [1, 1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1]
    ],
    startX: 1, startY: 1, exitX: 4, exitY: 1
  }
};

function minimax(rx, ry, rdir, px, py, depth, isMax, maze, tx, ty) {
  if (rx === tx && ry === ty) return 100 - depth;
  if (rx < 0 || rx >= 6 || ry < 0 || ry >= 6 || maze[ry][rx] === 1) return -100 + depth;
  if (rx === px && ry === py) return -100 + depth;
  if (depth === 0) {
    const distToTarget = Math.abs(rx - tx) + Math.abs(ry - ty);
    const distToPatrol = Math.abs(rx - px) + Math.abs(ry - py);
    return distToPatrol - distToTarget * 2;
  }

  if (isMax) {
    let maxEval = -Infinity;
    let nrx = rx, nry = ry;
    if (rdir === 'north') nry--;
    else if (rdir === 'east') nrx++;
    else if (rdir === 'south') nry++;
    else if (rdir === 'west') nrx--;
    
    const scoreF = minimax(nrx, nry, rdir, px, py, depth - 1, false, maze, tx, ty);
    maxEval = Math.max(maxEval, scoreF);

    const dirsL = ['north', 'west', 'south', 'east'];
    const nextDirL = dirsL[(dirsL.indexOf(rdir) + 1) % 4];
    const scoreL = minimax(rx, ry, nextDirL, px, py, depth - 1, false, maze, tx, ty);
    maxEval = Math.max(maxEval, scoreL);

    const dirsR = ['north', 'east', 'south', 'west'];
    const nextDirR = dirsR[(dirsR.indexOf(rdir) + 1) % 4];
    const scoreR = minimax(rx, ry, nextDirR, px, py, depth - 1, false, maze, tx, ty);
    maxEval = Math.max(maxEval, scoreR);

    return maxEval;
  } else {
    let minEval = Infinity;
    const moves = [
      { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
      { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
    ];

    moves.forEach(m => {
      const npx = px + m.dx;
      const npy = py + m.dy;
      if (npx >= 0 && npx < 6 && npy >= 0 && npy < 6 && maze[npy][npx] !== 1) {
        const ev = minimax(rx, ry, rdir, npx, npy, depth - 1, true, maze, tx, ty);
        minEval = Math.min(minEval, ev);
      }
    });

    if (minEval === Infinity) {
      return minimax(rx, ry, rdir, px, py, depth - 1, true, maze, tx, ty);
    }
    return minEval;
  }
}

function getMinimaxOptimalAction(level) {
  const mazeConfig = MAZES[level] || MAZES[1];
  const grid = mazeConfig.grid;
  const sx = mazeConfig.startX;
  const sy = mazeConfig.startY;
  const tx = mazeConfig.exitX;
  const ty = mazeConfig.exitY;
  const px = tx;
  const py = ty;

  let bestAction = 'forward';
  let bestScore = -Infinity;

  let fx = sx, fy = sy;
  fx++;
  let scoreF = minimax(fx, fy, 'east', px, py, 6, false, grid, tx, ty);
  if (scoreF > bestScore) { bestScore = scoreF; bestAction = 'forward'; }

  let scoreL = minimax(sx, sy, 'north', px, py, 6, false, grid, tx, ty);
  if (scoreL > bestScore) { bestScore = scoreL; bestAction = 'left'; }

  let scoreR = minimax(sx, sy, 'south', px, py, 6, false, grid, tx, ty);
  if (scoreR > bestScore) { bestScore = scoreR; bestAction = 'right'; }

  return bestAction;
}

// Fallback Socratic Hints for all 6 games and their levels
const LOCAL_HINTS = {
  'circuit-builder': {
    name: 'Circuit Builder',
    concept: 'Series & Parallel Electrical Circuits',
    levels: [
      {
        level: 1,
        hints: [
          'Remember, electric current needs a continuous, unbroken path from the positive (+) to the negative (-) terminal of the battery.',
          'Is your switch closed? A switch must be ON (closed) to let electricity flow.',
          'Look at the path: does the wire connect the battery, bulb, and switch in a single loop?'
        ]
      },
      {
        level: 2,
        hints: [
          'In a series circuit, the current has only ONE path to flow through. If you break it, all bulbs go out.',
          'Are both bulbs placed in the same single loop with the battery and switch?',
          'If you remove one bulb, does the path to the other bulb break? That is the hallmark of a series circuit!'
        ]
      },
      {
        level: 3,
        hints: [
          'In a parallel circuit, current splits into MULTIPLE branches. Each bulb has its own direct loop to the battery.',
          'Can you turn off one switch and keep the other bulb glowing? How do you give each bulb its own separate branch?',
          'Check if the battery outputs connect to two distinct loops that join back together at the negative terminal.'
        ]
      }
    ]
  },
  'bridge-builder': {
    name: 'Bridge Builder',
    concept: 'Civil & Structural Engineering Forces (Tension & Compression)',
    levels: [
      {
        level: 1,
        hints: [
          'Triangles are the strongest shape in structural engineering because they distribute weight evenly.',
          'Are there any unsupported long beams? Try adding joint supports to form triangles!',
          'Remember, wood is cheap but snaps easily under tension. Can you support the deck from underneath?'
        ]
      },
      {
        level: 2,
        hints: [
          'Steel is highly resistant to both tension and compression, but it is expensive. Use it where the stress is highest!',
          'When the truck reaches the center of the span, which beams are bending the most? Replace those with steel.',
          'Can you use cheaper wood for the outer anchor points and save the strong steel for the main span?'
        ]
      },
      {
        level: 3,
        hints: [
          'Cables are fantastic for holding heavy loads in tension, but they flop under compression. Use them to hang the bridge deck!',
          'Are your support towers rigid? If the tower tips, the cables lose their tension.',
          'Try connecting cables from the top of the tower down to the center of the road deck.'
        ]
      }
    ]
  },
  'gear-pulley': {
    name: 'Gear & Pulley Machine',
    concept: 'Mechanical Advantage & Gear Ratios',
    levels: [
      {
        level: 1,
        hints: [
          'If a small gear drives a larger gear, the larger gear turns slower but with MORE force (torque).',
          'To increase output speed, should the driving gear be larger or smaller than the driven gear?',
          'Count the teeth! A 30-tooth gear driving a 10-tooth gear will make the output turn three times faster.'
        ]
      },
      {
        level: 2,
        hints: [
          'Pulleys connected by a straight belt rotate in the same direction. What happens if the belt is crossed (a figure-8)?',
          'To reverse the rotation direction, can you cross the pulley belt or add an idler gear in between?',
          'An idler gear changes the direction of rotation without changing the final gear ratio!'
        ]
      },
      {
        level: 3,
        hints: [
          'Compound gear ratios multiply! If gear A drives B, and gear B shares an axle with gear C which drives D, how does that affect mechanical advantage?',
          'Try using a multi-stage gear train to get a massive reduction in speed for maximum lifting force.',
          'Check your target mechanical advantage. Do you need speed (speed ratio > 1) or power (force ratio > 1)?'
        ]
      }
    ]
  },
  'logic-maze': {
    name: 'Logic Maze (Code-a-bot)',
    concept: 'Sequencing, Loops, & Conditionals',
    levels: [
      {
        level: 1,
        hints: [
          'Walk through the maze step-by-step yourself. What does the bot need to do first?',
          'Did you turn the bot BEFORE moving, or did you move forward into a wall?',
          'Remember, the bot faces the direction it is moving. Turning right turns relative to the bot, not the screen!'
        ]
      },
      {
        level: 2,
        hints: [
          'If you find yourself repeating the same instructions (like: Move, Move, Move), can you pack them inside a Loop block?',
          'A loop block runs the commands inside it multiple times. Try using a Loop with a repeat counter of 3 or 4.',
          'Is there a pattern in the maze? For example: Forward, Right, Forward, Right. That pattern can be looped!'
        ]
      },
      {
        level: 3,
        hints: [
          'Use the "If path ahead" block to make decisions. It check if a wall is in front of the bot.',
          'If there is a wall in front, what should the bot do? Turn left or right? Place that inside the If/Else branch.',
          'Combining loops with an If-sensor allows the bot to navigate windey passages automatically!'
        ]
      }
    ]
  },
  'energy-balancer': {
    name: 'Energy Grid Balancer',
    concept: 'Grid Reliability, Power Priority, and Renewable Fluctuations',
    levels: [
      {
        level: 1,
        hints: [
          'Solar generation drops to zero during the night cycle. Do you have batteries charged to handle the night load?',
          'If demand exceeds supply, turn off non-essential nodes like the water pump first to keep the houses powered.',
          'Watch the battery state of charge (SoC). If it is draining fast, cut back on consumption.'
        ]
      },
      {
        level: 2,
        hints: [
          'The Hospital is a critical load and must NEVER lose power. Make sure its priority slider is at the absolute top.',
          'Wind power is unpredictable. When the wind speeds drop, do you have enough backup battery or solar storage?',
          'Try storing energy in the battery during peak solar hours so you can discharge it when wind is low and demand is high.'
        ]
      },
      {
        level: 3,
        hints: [
          'Optimization challenge: Can you run the water pump ONLY during peak solar hours when there is excess power?',
          'Dumping excess power is a waste. If batteries are full and production is high, turn on all optional loads.',
          'Balance is key! Total generation (Solar + Wind + Battery) must match or exceed total load. Check the demand curve.'
        ]
      }
    ]
  },
  'fluid-flow': {
    name: 'Fluid Flow Designer',
    concept: 'Fluid Dynamics, Pipe Friction, and Pressure Heads',
    levels: [
      {
        level: 1,
        hints: [
          'Water flows from high pressure (or height) to low pressure. Is your source tank elevated higher than the building?',
          'If gravity isn\'t enough, place a Pump in the pipeline to boost flow rate and head pressure.',
          'Are your pipe diameters large enough? Small pipes restrict the flow rate significantly.'
        ]
      },
      {
        level: 2,
        hints: [
          'A building needs a steady flow. If the flow is too fast, the tank overflows. Adjust the Valve to throttle the flow.',
          'If a pipe bursts, it means the pressure exceeded the safe limit. Turn down the pump speed or open bypass valves!',
          'Pumps add pressure. Valves add resistance. Use them together to maintain a steady flow rate.'
        ]
      },
      {
        level: 3,
        hints: [
          'Multiple buildings require split flows. Are you using junction tees? Make sure the pump is strong enough to push water to both targets.',
          'If one building gets all the water and the other gets none, close the valve on the first path slightly to force water down the second path.',
          'Watch the reservoir levels. If the source goes dry, the pumps will lose suction and buildings will run out of water.'
        ]
      }
    ]
  }
};

// API POST ROUTE
router.post('/', async (req, res) => {
  try {
    const { gameId, level, attempts, timeTaken, lastAttempt, currentContext } = req.body;
    
    if (!gameId || !level) {
      return res.status(400).json({ error: 'Missing gameId or level context' });
    }
    
    // Parse user prompt query from context if sent
    let queryText = "";
    const queryMatch = currentContext && currentContext.match(/Player prompt query: "(.*)"/);
    if (queryMatch) {
      queryText = queryMatch[1].toLowerCase().trim();
    }

    // Check if we have API Keys for Gemini, MiniMax, OpenAI, or Claude
    const geminiKey = process.env.GEMINI_API_KEY;
    const minimaxKey = process.env.MINIMAX_API_KEY;
    const minimaxModel = process.env.MINIMAX_MODEL || 'MiniMax-M3';
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (geminiKey) {
      try {
        console.log("Calling Google Gemini LLM API (Model: gemini-1.5-flash)...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `You are an encouraging, expert Socratic STEM tutor for school students (grades 6-12) playing a game called EngiPlay.
Your goal is to guide the student to the correct answer by asking clarifying questions or offering concepts (series/parallel logic, structural tension/compression, gear mechanical advantage, algorithmic loop sequencing, grid balancing priority, fluid pressure/head).
CRITICAL RULES:
1. NEVER give the direct answer or the solution!
2. Do NOT provide step-by-step instructions of the exact placements.
3. Speak in a friendly, encouraging, age-appropriate tone.
4. Keep the response short (2-3 sentences max).

Current context:
Game: ${gameId}
Level: ${level}
Attempts failed: ${attempts}
What went wrong in the last attempt: ${lastAttempt || 'Incorrect placement/balance'}
Concept context: ${currentContext || ''}

Please give me a Socratic hint.`
                  }
                ]
              }
            ],
            generationConfig: {
              maxOutputTokens: 150,
              temperature: 0.7
            }
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return res.json({ hint: text.trim() });
          }
        } else {
          console.warn('Gemini API call failed, falling back.');
        }
      } catch (err) {
        console.error('Error calling Gemini API:', err);
      }
    }
    
    if (minimaxKey) {
      try {
        console.log(`Calling MiniMax LLM API (Model: ${minimaxModel})...`);
        const response = await fetch('https://api.minimax.io/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${minimaxKey}`
          },
          body: JSON.stringify({
            model: minimaxModel,
            messages: [
              {
                role: 'system',
                content: `You are an encouraging, expert Socratic STEM tutor for school students (grades 6-12) playing a game called EngiPlay.
Your goal is to guide the student to the correct answer by asking clarifying questions or offering concepts (series/parallel logic, structural tension/compression, gear mechanical advantage, algorithmic loop sequencing, grid balancing priority, fluid pressure/head).
CRITICAL RULES:
1. NEVER give the direct answer or the solution!
2. Do NOT provide step-by-step instructions of the exact placements.
3. Speak in a friendly, encouraging, age-appropriate tone.
4. Keep the response short (2-3 sentences max).`
              },
              {
                role: 'user',
                content: `Game: ${gameId}. Level: ${level}. Attempts failed: ${attempts}. 
What went wrong in the last attempt: ${lastAttempt || 'Incorrect placement/balance'}.
Concept context: ${currentContext || ''}.
Please give me a Socratic hint.`
              }
            ],
            max_tokens: 150,
            temperature: 0.7
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          return res.json({ hint: data.choices[0].message.content });
        } else {
          console.warn('MiniMax LLM API call failed, falling back to other providers.');
        }
      } catch (err) {
        console.error('Error calling MiniMax LLM API:', err);
      }
    }
    
    if (openaiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are an encouraging, expert Socratic STEM tutor for school students (grades 6-12) playing a game called EngiPlay.
Your goal is to guide the student to the correct answer by asking clarifying questions or offering concepts (series/parallel logic, structural tension/compression, gear mechanical advantage, algorithmic loop sequencing, grid balancing priority, fluid pressure/head).
CRITICAL RULES:
1. NEVER give the direct answer or the solution!
2. Do NOT provide step-by-step instructions of the exact placements.
3. Speak in a friendly, encouraging, age-appropriate tone.
4. Keep the response short (2-3 sentences max).`
              },
              {
                role: 'user',
                content: `Game: ${gameId}. Level: ${level}. Attempts failed: ${attempts}. 
What went wrong in the last attempt: ${lastAttempt || 'Incorrect placement/balance'}.
Concept context: ${currentContext || ''}.
Please give me a Socratic hint.`
              }
            ],
            max_tokens: 150,
            temperature: 0.7
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          return res.json({ hint: data.choices[0].message.content });
        } else {
          console.warn('OpenAI API call failed, falling back to local Socratic rules.');
        }
      } catch (err) {
        console.error('Error calling OpenAI:', err);
      }
    }
    
    if (anthropicKey) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-haiku-20241022',
            messages: [
              {
                role: 'user',
                content: `You are an encouraging Socratic STEM tutor. 
Game: ${gameId}. Level: ${level}. Attempts: ${attempts}. 
Context: ${currentContext}. Last fail details: ${lastAttempt}.
Provide a Socratic hint (2-3 sentences max) that leads the student to the answer without telling it directly.`
              }
            ],
            max_tokens: 150,
            temperature: 0.7
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          return res.json({ hint: data.content[0].text });
        } else {
          console.warn('Claude API call failed, falling back to local Socratic rules.');
        }
      } catch (err) {
        console.error('Error calling Claude:', err);
      }
    }
    
    // HEURISTIC FALLBACK WITH INTELLIGENT KEYWORD MATCHING
    if (queryText) {
      if (gameId === 'circuit-builder') {
        if (queryText.includes('battery') || queryText.includes('power')) {
          return res.json({ hint: "[Socratic Guide] Current must flow out of the positive terminal (red cap) and return to the negative terminal. Have you checked if wires connect back to both ends?" });
        }
        if (queryText.includes('switch') || queryText.includes('gate') || queryText.includes('open')) {
          return res.json({ hint: "[Socratic Guide] A switch acts as a bridge. If the switch lever is pointing up (open), current cannot cross. Try clicking it to close the switch!" });
        }
        if (queryText.includes('bulb') || queryText.includes('light')) {
          return res.json({ hint: "[Socratic Guide] For a bulb to shine, it must be part of a complete loop. If you trace the wire from the battery, does it run directly through the bulb back to the battery?" });
        }
        if (queryText.includes('series')) {
          return res.json({ hint: "[Socratic Guide] In a series loop, all bulbs share a single wire loop. If you trace a path from the battery positive, does it go through both bulbs before reaching negative?" });
        }
        if (queryText.includes('parallel') || queryText.includes('split')) {
          return res.json({ hint: "[Socratic Guide] In parallel setups, each bulb has its own distinct circuit branch. Can you trace a separate circle of wires from the battery to each individual bulb?" });
        }
      }
      
      if (gameId === 'bridge-builder') {
        if (queryText.includes('wood') || queryText.includes('cheap')) {
          return res.json({ hint: "[Socratic Guide] Wood is light and cheap, but it snaps under high stress. Have you tried using steel for the central nodes where tension is highest?" });
        }
        if (queryText.includes('steel') || queryText.includes('heavy')) {
          return res.json({ hint: "[Socratic Guide] Steel is strong but expensive and heavy. If the bridge collapses under its own weight, try replacing steel beams with wood or cables where stress is low." });
        }
        if (queryText.includes('cable') || queryText.includes('hang')) {
          return res.json({ hint: "[Socratic Guide] Cables are perfect for holding loads in tension. Can you suspend the road deck from the towers using cables?" });
        }
        if (queryText.includes('triangle') || queryText.includes('shape') || queryText.includes('weak')) {
          return res.json({ hint: "[Socratic Guide] Triangles distribute forces evenly, unlike squares. Look at your beam connections: do they form rigid triangles to anchor points?" });
        }
      }

      if (gameId === 'gear-pulley') {
        if (queryText.includes('ratio') || queryText.includes('speed') || queryText.includes('teeth')) {
          return res.json({ hint: "[Socratic Guide] Ratios multiply! A large gear driving a small gear increases output speed. A small gear driving a large gear increases torque (force)." });
        }
        if (queryText.includes('direction') || queryText.includes('reverse') || queryText.includes('turn')) {
          return res.json({ hint: "[Socratic Guide] When two gears touch, they turn in opposite directions. Adding an intermediate gear (an idler) reverses the final direction. Pulley belts can be crossed to reverse directions too!" });
        }
      }

      if (gameId === 'logic-maze') {
        if (queryText.includes('loop') || queryText.includes('repeat')) {
          return res.json({ hint: "[Socratic Guide] Loops run the inside commands multiple times. Is there a repetitive path pattern, like moving forward 3 times or turning after every move?" });
        }
        if (queryText.includes('turn') || queryText.includes('left') || queryText.includes('right')) {
          return res.json({ hint: "[Socratic Guide] The robot turns relative to its own facing direction, not the screen coordinate. If the bot faces North, a right turn makes it face East." });
        }
      }

      if (gameId === 'energy-balancer') {
        if (queryText.includes('battery') || queryText.includes('charge') || queryText.includes('night')) {
          return res.json({ hint: "[Socratic Guide] Solar cells stop generating at night. Are your batteries storing enough energy during the day to feed houses during the night cycle?" });
        }
        if (queryText.includes('priority') || queryText.includes('hospital') || queryText.includes('pump')) {
          return res.json({ hint: "[Socratic Guide] When energy supply drops, the priority sliders control who gets power first. Make sure critical loads like the Hospital are prioritized above optional loads." });
        }
      }

      if (gameId === 'fluid-flow') {
        if (queryText.includes('pressure') || queryText.includes('pump') || queryText.includes('burst')) {
          return res.json({ hint: "[Socratic Guide] Pumps add water pressure, but excess pressure bursts pipes. Try regulating pump speed or adding valves to distribute pressure." });
        }
        if (queryText.includes('valve') || queryText.includes('restrict') || queryText.includes('stop')) {
          return res.json({ hint: "[Socratic Guide] Valves restrict flow rate. If one building is not getting enough water, try closing the valve leading to other buildings to redirect flow." });
        }
      }
    }

    if (gameId === 'logic-maze') {
      try {
        const optimalAction = getMinimaxOptimalAction(level);
        let minimaxHint = "The Socratic AI Bot solved this maze with Minimax. ";
        if (optimalAction === 'left') {
          minimaxHint += "Minimax pathfinding calculates that the exit lies to the left of the robot's starting location. How do you rotate the robot counter-clockwise before moving forward?";
        } else if (optimalAction === 'right') {
          minimaxHint += "Minimax pathfinding calculates that you must navigate around a bend to the right. What block turns the robot clockwise so it doesn't collide?";
        } else {
          minimaxHint += "Minimax pathfinding calculates that the path directly ahead is clear. Have you programmed the Move Forward command for this segment?";
        }
        return res.json({
          hint: `[Minimax Socratic Guide] ${minimaxHint}`
        });
      } catch (err) {
        console.error('Error running Minimax AI solver:', err);
      }
    }

    const gameHints = LOCAL_HINTS[gameId];
    if (!gameHints) {
      return res.json({
        hint: `Think about the engineering principles of ${gameId}. What variables could you adjust? Try inspecting your setup step by step!`
      });
    }
    
    const levelIndex = Math.min(level - 1, gameHints.levels.length - 1);
    const levelHintsObj = gameHints.levels[levelIndex >= 0 ? levelIndex : 0];
    
    // Rotate through hints dynamically using attempts and query length to avoid repetition
    const hintList = levelHintsObj.hints;
    const variationIndex = queryText ? queryText.length : 0;
    const hintIndex = (attempts - 1 + variationIndex) % hintList.length;
    const finalHint = hintList[hintIndex >= 0 ? hintIndex : 0];
    
    return res.json({
      hint: `[Socratic Guide] ${finalHint}`
    });
    
  } catch (error) {
    console.error('Hint bot endpoint error:', error);
    res.status(500).json({ error: 'Failed to generate Socratic hint' });
  }
});

export default router;
