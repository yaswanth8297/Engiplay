import * as Phaser from 'phaser';

interface PipelineComponent {
  type: 'pipe-h' | 'pipe-v' | 'pump' | 'valve';
  x: number;
  y: number;
  valveSetting: number; // 0 (closed) to 1 (fully open)
  pumpSpeed: number; // speed boost
}

export class FluidFlowScene extends Phaser.Scene {
  private grid: (PipelineComponent | null)[][] = [];
  private cols = 6;
  private rows = 4;
  private cellSize = 75;
  private offsetX = 160;
  private offsetY = 90;
  
  private activeLevel = 1;
  private activeConfig: any = {};
  
  private selectedTool: PipelineComponent['type'] | null = null;
  private isTesting = false;
  
  private targetFlow = 10;
  private maxPressure = 30;
  private reservoirX = 0;
  private reservoirY = 1;
  private buildingX = 5;
  private buildingY = 2;
  
  private feedbackText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;
  
  private gridSprites: Phaser.GameObjects.Container[][] = [];
  private toolboxButtons: { [key: string]: Phaser.GameObjects.Container } = {};
  private waterParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  
  constructor() {
    super('MainScene');
  }

  init(data: { level: number; config: any }) {
    this.activeLevel = data.level || 1;
    this.activeConfig = data.config || {};
    
    this.targetFlow = this.activeConfig.targetFlow || 10;
    this.maxPressure = this.activeConfig.maxPressure || 30;
    
    // Initialize empty grid
    this.grid = [];
    for (let x = 0; x < this.cols; x++) {
      this.grid[x] = [];
      for (let y = 0; y < this.rows; y++) {
        this.grid[x][y] = null;
      }
    }
    
    this.isTesting = false;
    this.selectedTool = 'pipe-h';
  }

  create() {
    // Newsprint Paper Background Card
    this.add.rectangle(350, 240, 680, 460, 0xF9F9F7).setStrokeStyle(2, 0x111111);

    // Stats display in Newsprint Mono
    this.statsText = this.add.text(20, 20, `Target: ${this.targetFlow} L/s • Max Pressure: ${this.maxPressure} psi`, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#111111'
    });

    this.feedbackText = this.add.text(350, 375, 'Draw pipes to build the network. Use valves to throttle flow.', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#111111'
    }).setOrigin(0.5);

    // Render interactive breadboard-style grid
    this.drawGrid();

    // Side panels for Reservoir Source & Building Consumer
    this.drawSourceAndConsumer();

    // Create selection Toolbox
    this.createToolbox();

    // Action triggers
    this.createActionButtons();

    // Set up particles
    const graphics = this.add.graphics();
    graphics.fillStyle(0x3B82F6, 1);
    graphics.fillCircle(3, 3, 3);
    graphics.generateTexture('waterDrop', 6, 6);
    graphics.destroy();

    this.waterParticles = this.add.particles(0, 0, 'waterDrop', {
      speed: 0,
      lifespan: 1200,
      scale: { start: 1.0, end: 0.2 },
      blendMode: 'ADD',
      emitting: false
    });
  }

  private drawGrid() {
    this.gridSprites = [];
    for (let x = 0; x < this.cols; x++) {
      this.gridSprites[x] = [];
      for (let y = 0; y < this.rows; y++) {
        const posX = this.offsetX + x * this.cellSize + this.cellSize/2;
        const posY = this.offsetY + y * this.cellSize + this.cellSize/2;

        const container = this.add.container(posX, posY);
        const rect = this.add.rectangle(0, 0, this.cellSize - 6, this.cellSize - 6, 0x0F172A)
          .setStrokeStyle(1, 0x334155)
          .setInteractive();

        container.add(rect);
        this.gridSprites[x][y] = container;

        const currentX = x;
        const currentY = y;
        
        rect.on('pointerdown', () => this.handleSocketClick(currentX, currentY));
        rect.on('pointerover', () => rect.setStrokeStyle(2, 0x3B82F6));
        rect.on('pointerout', () => rect.setStrokeStyle(1, 0x334155));
      }
    }
  }

  private drawSourceAndConsumer() {
    // Reservoir (Left side at x = 0, y = 1)
    const resX = this.offsetX + this.reservoirX * this.cellSize + this.cellSize/2;
    const resY = this.offsetY + this.reservoirY * this.cellSize + this.cellSize/2;
    this.add.rectangle(resX, resY, this.cellSize - 6, this.cellSize - 6, 0x1D4ED8)
      .setStrokeStyle(2, 0xFFFFFF);
    this.add.text(resX - 25, resY - 8, '🌊 SUPPLY', { fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold' });
    
    // Auto populate source element
    this.grid[this.reservoirX][this.reservoirY] = {
      type: 'pipe-h',
      x: this.reservoirX,
      y: this.reservoirY,
      valveSetting: 1.0,
      pumpSpeed: 10
    };

    // Building target (Right side at x = 5, y = 2)
    const bldX = this.offsetX + this.buildingX * this.cellSize + this.cellSize/2;
    const bldY = this.offsetY + this.buildingY * this.cellSize + this.cellSize/2;
    this.add.rectangle(bldX, bldY, this.cellSize - 6, this.cellSize - 6, 0x1E293B)
      .setStrokeStyle(2, 0xEF4444);
    this.add.text(bldX - 28, bldY - 8, '🏢 BUILDING', { fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold', color: '#EF4444' });

    // Auto populate target element
    this.grid[this.buildingX][this.buildingY] = {
      type: 'pipe-h',
      x: this.buildingX,
      y: this.buildingY,
      valveSetting: 1.0,
      pumpSpeed: 0
    };
  }

  private handleSocketClick(x: number, y: number) {
    if (this.isTesting) return;

    // Keep source and targets from overrides
    if ((x === this.reservoirX && y === this.reservoirY) || (x === this.buildingX && y === this.buildingY)) return;

    const existing = this.grid[x][y];
    if (!this.selectedTool) {
      if (existing) {
        // Toggle valve closed/open settings or pump speeds on click
        if (existing.type === 'valve') {
          existing.valveSetting = existing.valveSetting === 1.0 ? 0.3 : existing.valveSetting === 0.3 ? 0.0 : 1.0;
          this.drawComponentSprite(x, y, existing);
        } else if (existing.type === 'pump') {
          existing.pumpSpeed = existing.pumpSpeed === 15 ? 5 : existing.pumpSpeed + 5;
          this.drawComponentSprite(x, y, existing);
        } else {
          // Remove
          this.grid[x][y] = null;
          this.clearSocketSprite(x, y);
        }
      }
      return;
    }

    // Place component
    const newComp: PipelineComponent = {
      type: this.selectedTool,
      x,
      y,
      valveSetting: this.selectedTool === 'valve' ? 1.0 : 1.0,
      pumpSpeed: this.selectedTool === 'pump' ? 10 : 0
    };

    this.grid[x][y] = newComp;
    this.drawComponentSprite(x, y, newComp);
  }

  private clearSocketSprite(x: number, y: number) {
    const container = this.gridSprites[x][y];
    while (container.list.length > 1) {
      container.list[1].destroy();
    }
  }

  private drawComponentSprite(x: number, y: number, comp: PipelineComponent) {
    const container = this.gridSprites[x][y];
    this.clearSocketSprite(x, y);

    const graphics = this.add.graphics();
    graphics.lineStyle(6, 0x64748B); // Slate pipe outlines

    if (comp.type === 'pipe-h') {
      graphics.lineBetween(-38, 0, 38, 0);
      container.add(graphics);
    } 
    else if (comp.type === 'pipe-v') {
      graphics.lineBetween(0, -38, 0, 38);
      container.add(graphics);
    } 
    else if (comp.type === 'pump') {
      // Pump cylinder
      graphics.fillStyle(0x06B6D4, 1);
      graphics.fillRoundedRect(-18, -12, 36, 24, 4);
      graphics.strokeRoundedRect(-18, -12, 36, 24, 4);
      
      // Speed visual level indicator
      const txt = this.add.text(-12, -6, `P:${comp.pumpSpeed}`, { fontFamily: 'monospace', fontSize: '9px', fontStyle: 'bold' });
      container.add([graphics, txt]);
    } 
    else if (comp.type === 'valve') {
      // Valve gate
      graphics.fillStyle(0xEF4444, 1);
      graphics.fillRect(-12, -12, 24, 24);
      graphics.strokeRect(-12, -12, 24, 24);
      
      const vText = comp.valveSetting === 1.0 ? 'OPEN' : comp.valveSetting === 0.3 ? 'MID' : 'CLS';
      const txt = this.add.text(-10, -5, vText, { fontFamily: 'sans-serif', fontSize: '8px', fontStyle: 'bold' });
      container.add([graphics, txt]);
    }
  }

  private createToolbox() {
    const tools: { type: PipelineComponent['type'] | null; label: string; desc: string }[] = [
      { type: 'pipe-h', label: '━ PIPE-H', desc: 'Horiz pipe segment' },
      { type: 'pipe-v', label: '┃ PIPE-V', desc: 'Vert pipe segment' },
      { type: 'pump', label: '⛽ PUMP', desc: 'Pushes water (+Flow)' },
      { type: 'valve', label: '🎛️ VALVE', desc: 'Throttles flow rate' },
      { type: null, label: '🗑️ EDIT / CLEAR', desc: 'Click parameter/clear' }
    ];

    let startY = 45;
    tools.forEach((tool) => {
      const container = this.add.container(85, startY);
      const bg = this.add.rectangle(0, 0, 130, 44, 0xF9F9F7)
        .setStrokeStyle(1.5, 0x111111)
        .setInteractive();
      const txt = this.add.text(-55, -12, tool.label, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#111111'
      });
      const desc = this.add.text(-55, 4, tool.desc, {
        fontFamily: 'Lora, serif',
        fontSize: '9px',
        color: '#737373'
      });

      container.add([bg, txt, desc]);
      this.toolboxButtons[tool.type || 'edit'] = container;

      bg.on('pointerdown', () => {
        this.resetToolHighlights();
        this.selectedTool = tool.type;
        bg.setStrokeStyle(2, 0x111111).setFillStyle(0x111111);
        txt.setColor('#F9F9F7');
      });

      startY += 54;
    });

    // Default select pipe-h
    const defaultContainer = this.toolboxButtons['pipe-h'];
    if (defaultContainer) {
      const defaultBg = defaultContainer.list[0] as Phaser.GameObjects.Rectangle;
      const defaultTxt = defaultContainer.list[1] as Phaser.GameObjects.Text;
      defaultBg.setStrokeStyle(2, 0x111111).setFillStyle(0x111111);
      defaultTxt.setColor('#F9F9F7');
    }
  }

  private resetToolHighlights() {
    Object.values(this.toolboxButtons).forEach(container => {
      const bg = container.list[0] as Phaser.GameObjects.Rectangle;
      const txt = container.list[1] as Phaser.GameObjects.Text;
      if (bg) bg.setStrokeStyle(1.5, 0x111111).setFillStyle(0xF9F9F7);
      if (txt) txt.setColor('#111111');
    });
  }

  private createActionButtons() {
    // CLEAR ALL
    const clearBg = this.add.rectangle(200, 422, 120, 36, 0xF9F9F7).setStrokeStyle(2, 0x111111).setInteractive();
    const clearTxt = this.add.text(200, 422, 'CLEAR ALL 🗑️', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#111111'
    }).setOrigin(0.5);

    clearBg.on('pointerdown', () => {
      this.scene.restart({ level: this.activeLevel, config: this.activeConfig });
    });
    clearBg.on('pointerover', () => {
      clearBg.setFillStyle(0x111111);
      clearTxt.setColor('#F9F9F7');
    });
    clearBg.on('pointerout', () => {
      clearBg.setFillStyle(0xF9F9F7);
      clearTxt.setColor('#111111');
    });

    // UNDO
    const undoBg = this.add.rectangle(350, 422, 110, 36, 0xF9F9F7).setStrokeStyle(2, 0x111111).setInteractive();
    const undoTxt = this.add.text(350, 422, 'UNDO ↩️', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#111111'
    }).setOrigin(0.5);

    undoBg.on('pointerdown', () => {
      // Find last non-source/consumer item on grid and clear it
      let undone = false;
      for (let x = this.cols - 1; x >= 0; x--) {
        for (let y = this.rows - 1; y >= 0; y--) {
          if ((x === this.reservoirX && y === this.reservoirY) || (x === this.buildingX && y === this.buildingY)) continue;
          if (this.grid[x][y]) {
            this.grid[x][y] = null;
            this.clearSocketSprite(x, y);
            undone = true;
            break;
          }
        }
        if (undone) break;
      }
      this.feedbackText.setText(undone ? 'Undid last pipe element.' : 'Nothing to undo!').setColor('#111111');
    });
    undoBg.on('pointerover', () => {
      undoBg.setFillStyle(0x111111);
      undoTxt.setColor('#F9F9F7');
    });
    undoBg.on('pointerout', () => {
      undoBg.setFillStyle(0xF9F9F7);
      undoTxt.setColor('#111111');
    });

    // TEST (Solid Editorial Red button)
    const testBg = this.add.rectangle(500, 422, 120, 36, 0xCC0000).setStrokeStyle(2, 0x111111).setInteractive();
    const testTxt = this.add.text(500, 422, 'TEST 💧', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    testBg.on('pointerdown', () => this.simulateFlow());
    testBg.on('pointerover', () => {
      testBg.setFillStyle(0x111111);
      testTxt.setColor('#FFFFFF');
    });
    testBg.on('pointerout', () => {
      testBg.setFillStyle(0xCC0000);
      testTxt.setColor('#FFFFFF');
    });
  }

  private simulateFlow() {
    if (this.isTesting) return;
    this.isTesting = true;
    this.waterParticles.stop();

    // 1. Calculate connectivity path from Reservoir (0,1) to Building (5,2)
    // BFS traversal through placed adjacent pipes/components
    const path: { x: number; y: number }[] = [];
    const visited = new Set<string>();
    const queue: { x: number; y: number; pathSoFar: { x: number; y: number }[] }[] = [];

    queue.push({ x: this.reservoirX, y: this.reservoirY, pathSoFar: [{ x: this.reservoirX, y: this.reservoirY }] });
    visited.add(`${this.reservoirX},${this.reservoirY}`);

    let targetReachable = false;
    let finalPath: { x: number; y: number }[] = [];

    while (queue.length > 0) {
      const { x, y, pathSoFar } = queue.shift()!;
      const comp = this.grid[x][y];

      if (x === this.buildingX && y === this.buildingY) {
        targetReachable = true;
        finalPath = pathSoFar;
        break;
      }

      if (!comp) continue;

      // Check directions we can step based on current component type
      const directions: { dx: number; dy: number }[] = [];
      if (comp.type === 'pipe-h' || comp.type === 'pump' || comp.type === 'valve') {
        directions.push({ dx: 1, dy: 0 }, { dx: -1, dy: 0 });
      }
      if (comp.type === 'pipe-v') {
        directions.push({ dx: 0, dy: 1 }, { dx: 0, dy: -1 });
      }

      for (const dir of directions) {
        const nx = x + dir.dx;
        const ny = y + dir.dy;
        const key = `${nx},${ny}`;

        if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows && !visited.has(key)) {
          const nextComp = this.grid[nx][ny];
          if (nextComp) {
            visited.add(key);
            queue.push({ x: nx, y: ny, pathSoFar: [...pathSoFar, { x: nx, y: ny }] });
          }
        }
      }
    }

    if (!targetReachable) {
      this.feedbackText.setText('Pipeline incomplete: reservoir water is not reaching the building.').setColor('#EF4444');
      this.time.delayedCall(1800, () => {
        this.isTesting = false;
        this.events.emit('level-failure', { message: 'Pipeline network disconnected.' });
      });
      return;
    }

    // 2. Perform pressure & flow calculations along finalPath
    // Base flow driven by reservoir connection is 5 L/s.
    // Each pump along the path adds +5 L/s.
    // Each valve settings throttles flow: flow = flow * valveSetting.
    let flowRate = 6;
    let pressure = 12;

    finalPath.forEach(pt => {
      const comp = this.grid[pt.x][pt.y];
      if (comp) {
        if (comp.type === 'pump') {
          flowRate += comp.pumpSpeed;
          pressure += comp.pumpSpeed * 1.5;
        }
        if (comp.type === 'valve') {
          flowRate = flowRate * comp.valveSetting;
          // Restricting flow increases head pressure before the valve!
          if (comp.valveSetting < 1.0) {
            pressure += 8 * (1.0 - comp.valveSetting);
          }
        }
      }
    });

    // Check parameters against constraints
    const roundedFlow = Math.round(flowRate);
    const roundedPressure = Math.round(pressure);

    // Play water particle animation
    this.animateWaterParticles(finalPath);

    this.time.delayedCall(1000, () => {
      // 1. Burst condition: pressure exceeded threshold
      if (roundedPressure > this.maxPressure) {
        const burstMsg = `PIPE BURST! Pressure reached ${roundedPressure} psi, exceeding safety limit of ${this.maxPressure} psi. Add bypass paths or open valves!`;
        this.feedbackText.setText(burstMsg).setColor('#EF4444');
        this.waterParticles.stop();
        this.events.emit('level-failure', { message: burstMsg });
        this.isTesting = false;
        return;
      }

      // 2. Starve condition: insufficient flow
      if (roundedFlow < this.targetFlow) {
        const starveMsg = `Supply deficit: Delivered flow is ${roundedFlow} L/s, but building requires ${this.targetFlow} L/s. Install a booster pump!`;
        this.feedbackText.setText(starveMsg).setColor('#F59E0B');
        this.events.emit('level-failure', { message: starveMsg });
        this.isTesting = false;
        return;
      }

      // 3. Overflow condition: excess flow overflows building tank
      if (roundedFlow > this.targetFlow * 1.4) {
        const overflowMsg = `Flooding! Delivered flow is ${roundedFlow} L/s, which overflows the target tank. Throttle the line using a valve!`;
        this.feedbackText.setText(overflowMsg).setColor('#EF4444');
        this.events.emit('level-failure', { message: overflowMsg });
        this.isTesting = false;
        return;
      }

      // Safe success!
      this.feedbackText.setText(`SUCCESS! Stabilized network flow. Flow: ${roundedFlow} L/s, Pressure: ${roundedPressure} psi`).setColor('#10B981');
      this.time.delayedCall(1200, () => {
        this.events.emit('level-success', { score: 100, timeTaken: 25 });
      });
    });
  }

  private animateWaterParticles(points: { x: number; y: number }[]) {
    const pixelPoints = points.map(pt => {
      const px = this.offsetX + pt.x * this.cellSize + this.cellSize/2;
      const py = this.offsetY + pt.y * this.cellSize + this.cellSize/2;
      return new Phaser.Math.Vector2(px, py);
    });

    const curve = new Phaser.Curves.Spline(pixelPoints);
    const path = new Phaser.Curves.Path(pixelPoints[0].x, pixelPoints[0].y);
    path.add(curve);
    
    const follower = this.add.follower(path, pixelPoints[0].x, pixelPoints[0].y, '');
    follower.setVisible(false);
    follower.startFollow({
      duration: 1500,
      repeat: -1
    });

    this.waterParticles.startFollow(follower);
    this.waterParticles.start();
  }
}
