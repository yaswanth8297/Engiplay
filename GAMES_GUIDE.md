# EngiPlay - STEM Simulators Gameplay Guide

Welcome to the **EngiPlay** mission control! This document serves as your engineering reference guide for playing and mastering the six interactive simulation labs. Each game is designed around real physical and logical principles.

---

## 1. Circuit Builder (Electrical Engineering)
### Core Concept
Electric current requires a **closed loop** (an unbroken path) from the positive terminal (+) of the battery, through the circuit components, and back to the negative terminal (-).

### Components
*   **Battery (🔋)**: Power source. The positive terminal (+) is the red cap on the right; the negative terminal (-) is the flat edge on the left.
*   **Bulb (💡)**: Lights up when current passes through. Current must enter one side and exit the other.
*   **Switch (🔌)**: Toggles current flow. Clicking the switch toggles it between **ON (Closed - green line)** and **OFF (Open - red angled line)**.
*   **Wires (━ / ┃ / ┓ / ┗)**: Guide current horizontally, vertically, or around corners.

### Level Missions
1.  **Level 1 (Simple Circuit)**: Place a battery, a bulb, and a switch. Connect them with wires to form a single closed loop. Toggle the switch ON and click **[ TEST ]** to light the bulb.
2.  **Level 2 (Series Circuit)**: Connect two bulbs in a single path (series). If the switch is open or a wire breaks, **both** bulbs go out.
3.  **Level 3 (Parallel Circuit)**: Give each bulb its own separate branch. Each branch should have its own switch. This allows you to turn one bulb off while keeping the other bulb glowing.

### How to Control
*   **Place**: Select a component in the left toolbox, then click any grid square on the breadboard to place it.
*   **Remove**: Click a placed component again (with no tool selected) to delete it.
*   **Toggle**: Click a placed Switch to toggle it ON/OFF.
*   **Test**: Click **[ TEST ]** at the bottom-right to run the simulator and inspect current flow.

---

## 2. Bridge Builder (Civil Engineering)
### Core Concept
Bridges stand by distributing load weights using forces of **compression** (pushing together) and **tension** (pulling apart). **Triangles (Trusses)** are the strongest shapes because they distribute forces evenly to anchor points.

### Materials
*   **Wood**: Cheap ($10) and light, but handles low stress. Easily snaps under high tension.
*   **Steel**: Strong ($50) but heavy and expensive. Essential for high-stress center spans.
*   **Cable**: Strong under tension ($20) but has no structure under compression. Use to suspend bridge decks.

### Level Missions
1.  **Level 1 (Simple Gap)**: Span a short gap. Build a simple truss bridge by drawing wooden beams to form triangles connecting the road deck to the canyon edge anchors.
2.  **Level 2 (Deep Canyon)**: A wider gap with a heavier truck load. Use steel beams for the center span where stress is highest, and cheaper wood for outer anchors. Keep under the budget limit!
3.  **Level 3 (Suspension Bridge)**: A very wide gap. Build high vertical towers, and anchor cables from the tops of the towers down to the road deck to suspend it.

### How to Control
*   **Draw Beams**: Select a material in the toolbox. Click a node (circle) and drag to another node to draw a member.
*   **Remove Beams**: Click on any beam to delete it.
*   **Test**: Click **[ TEST ]** to trigger Matter.js physics. A heavy truck will drive across. If your joints bend too far or exceed material limits, the bridge will collapse.

---

## 3. Gear & Pulley Machine (Mechanical Engineering)
### Core Concept
Gears and pulleys transmit rotational motion and speed.
*   **Gear Ratio**: The ratio of teeth determines speed and torque (force). A large gear driving a small gear makes the output turn **faster** (speed ratio > 1). A small gear driving a large gear makes it turn **slower with more force** (torque).
*   **Rotation Direction**: Touching gears rotate in opposite directions. Adding an intermediate gear (an idler) reverses the direction.

### Components
*   **Motor Peg (Blue)**: The driving force (input). Rotates at a fixed speed.
*   **Output Peg (Pink)**: The target axle. Must rotate in the specified direction at or above the target speed/force ratio.
*   **Gears (Small/Medium/Large)**: Mesh together to transmit force.
*   **Pulley Belts**: Connect pulleys on separate shafts. Belts rotate shafts in the same direction. Cross the belt in a "figure-8" to reverse rotation.

### Level Missions
1.  **Level 1 (Speed Up)**: Connect the motor to the output shaft. The output shaft must turn faster than the motor. (Use a large gear on the driver side, meshing into a smaller gear).
2.  **Level 2 (Direction Reverse)**: Connect the shafts so they rotate in opposite directions. Mesh gears directly or cross the pulley belt.
3.  **Level 3 (Compound Reduction)**: Combine gears on compound axles to lift a heavy load (requires high torque/force ratio).

### How to Control
*   **Place**: Select a gear size or belt, and click on the metal pegs to lock them in place.
*   **Connect Belt**: Select the belt tool, click peg A, then click peg B.
*   **Test**: Click **[ TEST ]** to start the motor. Watch the gear rotations and verify if the output peg meets the target.

---

## 4. Logic Maze - Code-a-bot (Computer Science)
### Core Concept
Computer programs solve problems by sequencing instructions step-by-step using **commands**, **loops**, and **conditionals**.

### Robot Commands
*   **MOVE (🚀)**: Commands the bot to move forward 1 grid block in the direction it is currently facing.
*   **LEFT (↩️)**: Rotates the bot 90 degrees counter-clockwise.
*   **RIGHT (↪️)**: Rotates the bot 90 degrees clockwise.
*   **LOOP (🔁)**: Repeats the enclosed command a set number of times (e.g. Loop 3 [Move] moves forward 3 grid spaces).

### Level Missions
1.  **Level 1 (Simple Path)**: Sequence basic MOVE, LEFT, and RIGHT commands to walk the bot from the start cell (2) to the exit cell (3).
2.  **Level 2 (Loops)**: Use Loop blocks to simplify long paths and avoid repeating code blocks.
3.  **Level 3 (Obstacle Maze)**: Navigate windey maze corridors efficiently using structured command sequencing.

### How to Control
*   **Sequence Code**: Click command buttons in the React Command Panel sidebar to push instructions onto the program queue.
*   **Set Loops**: Enter a loop count number, then click a Loop command button.
*   **Run**: Click **[ RUN CODE ]** in the sidebar to compile and watch the bot execute your commands.

---

## 5. Energy Grid Balancer (Power Grid Engineering)
### Core Concept
Reliable power grids must constantly balance electricity **generation** against consumption **demand** in real-time.
*   **Renewable Fluctuation**: Solar generation peaks during day but drops to zero at night. Wind power varies randomly.
*   **Grid Reliability**: Batteries store excess green energy during peak production, and discharge it to feed demand when supply drops.
*   **Load Shedding**: If demand exceeds total supply, you must cut power to optional loads to protect critical infrastructure.

### Grid Nodes
*   **Solar Grid (☀️)**: Generates power only during daylight.
*   **Wind Grid (🌀)**: Generates variable power based on wind speeds.
*   **Battery Storage (🔋)**: Charges when generation > load. Discharges when load > generation.
*   **Hospital (🏥)**: Critical load. Must NEVER lose power.
*   **Residential Homes (🏠)**: High-priority load.
*   **Water Pump (⛲)**: Optional load. Can be turned off during power shortages.

### Level Missions
1.  **Level 1 (Day/Night Loop)**: Survive a full day-night cycle. Switch off the water pump at night to save battery charge.
2.  **Level 2 (Priority Allocation)**: Set the priority sliders. Ensure the Hospital has the highest priority slider setting so it never gets shut off, even if wind speeds drop.
3.  **Level 3 (Grid Optimization)**: Run the grid efficiently. Keep all buildings powered while maintaining battery health above 20%.

### How to Control
*   **Sliders**: Slide priority controllers on the screen to declare which nodes get power first.
*   **Switches**: Click the ON/OFF switches next to load nodes to manually shed optional loads.
*   **Test**: Click **[ START ⚡ ]** to run the real-time grid simulation. Watch the load/generation graphs.

---

## 6. Fluid Flow Designer (Mechanical/Hydraulic Engineering)
### Core Concept
Fluids flow from high pressure to low pressure. 
*   **Friction Loss**: As water flows through pipes, friction slows it down and lowers pressure. Smaller pipes have more resistance.
*   **Pump Head**: Pumps increase water pressure to push fluid over long distances or up heights.
*   **Safe Operating Limits**: Excess pressure will burst pipes! You must balance pressure and flow rate.

### Pipeline Components
*   **Reservoir Source**: Water storage tank.
*   **Pumps (⚡)**: Add pressure to increase flow velocity.
*   **Valves (🔒)**: Restrict flow rate to protect downstream components or redirect water.
*   **Buildings (🏢)**: Consumer target. Requires a specific water flow rate (L/s) to function.

### Level Missions
1.  **Level 1 (Simple Pipe)**: Route water from the reservoir to a nearby building. Add a pump to boost gravity flow and meet the building's target.
2.  **Level 2 (Pressure Regulation)**: Water is flowing too fast and piping bursts. Add a valve in the line, and click it to restrict/throttle flow, keeping the line pressure in the safe zone.
3.  **Level 3 (Branched Network)**: Distribute water from one source to two buildings. Split the flow, and balance valves so both buildings get their target flow.

### How to Control
*   **Place Pipes**: Select a pipe type in the toolbox and place it on the grid to create lines.
*   **Pump/Valve Control**: Click on placed Pumps to increase speed, or click Valves to restrict flow.
*   **Test**: Click **[ TEST 💧 ]** to open the main reservoir gate and simulate water flow. Observe the pressure gauges.
