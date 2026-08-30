import * as Phaser from 'phaser';

export interface Component {
  type: 'battery' | 'bulb' | 'switch' | 'wire-straight' | 'wire-corner';
  x: number;
  y: number;
  orientation?: number; // 0, 90, 180, 270 degrees
  state?: boolean; // switch open/closed, bulb lit/unlit
}

export class CircuitBuilderScene extends Phaser.Scene {
  private grid: (Component | null)[][] = [];
  private history: { x: number; y: number; prevComp: Component | null; newComp: Component | null }[] = [];
  private cols = 5;
  private rows = 4;
  private cellSize = 80;
  private offsetX = 180;
  private offsetY = 60;
  
  private selectedType: Component['type'] | null = null;
  private activeLevel = 1;
  private activeConfig: any = {};
  
  private feedbackText!: Phaser.GameObjects.Text;
  private toolboxButtons: { [key: string]: Phaser.GameObjects.Container } = {};
  private gridSprites: Phaser.GameObjects.Container[][] = [];
  private flowParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  
  constructor() {
    super('MainScene');
  }

  init(data: { level: number; config: any }) {
    this.activeLevel = data.level || 1;
    this.activeConfig = data.config || {};
    
    // Initialize empty grid
    this.grid = [];
    this.history = [];
    for (let x = 0; x < this.cols; x++) {
      this.grid[x] = [];
      for (let y = 0; y < this.rows; y++) {
        this.grid[x][y] = null;
      }
    }
  }

  create() {
    // Newsprint Off-White Card background
    this.add.rectangle(350, 240, 680, 460, 0xF9F9F7).setStrokeStyle(2, 0x111111);

    // Feedback status banner above bottom buttons
    this.feedbackText = this.add.text(350, 375, 'Place components & click placed wires/switches to rotate or toggle!', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#111111'
    }).setOrigin(0.5);

    // Draw Sockets Grid
    this.drawGrid();

    // Create Tool Box Panel on the Left
    this.createToolbox();

    // Action buttons: Undo, Clear & Test
    this.createActionButtons();
    
    // Create Flow Particle System
    const graphics = this.add.graphics();
    graphics.fillStyle(0xCC0000, 1); // Editorial Red current particles
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture('glowDot', 8, 8);
    graphics.destroy();

    this.flowParticles = this.add.particles(0, 0, 'glowDot', {
      speed: 0,
      lifespan: 1000,
      scale: { start: 1.2, end: 0.2 },
      blendMode: 'NORMAL',
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
        
        // Draw newsprint paper socket
        const socketContainer = this.add.container(posX, posY);
        
        const baseRect = this.add.rectangle(0, 0, this.cellSize - 6, this.cellSize - 6, 0xE5E5E0)
          .setStrokeStyle(1.5, 0x111111)
          .setInteractive();
        
        // Dot socket center node
        const dot = this.add.circle(0, 0, 3, 0x111111);

        socketContainer.add([baseRect, dot]);
        this.gridSprites[x][y] = socketContainer;

        // Register grid clicks & hover
        const currentX = x;
        const currentY = y;
        baseRect.on('pointerdown', () => this.handleSocketClick(currentX, currentY));
        baseRect.on('pointerover', () => baseRect.setStrokeStyle(2.5, 0xCC0000));
        baseRect.on('pointerout', () => baseRect.setStrokeStyle(1.5, 0x111111));
      }
    }
  }

  private createToolbox() {
    const tools: { type: Component['type']; label: string; desc: string }[] = [
      { type: 'battery', label: '🔋 BATTERY', desc: 'Power source' },
      { type: 'bulb', label: '💡 BULB', desc: 'Lights up' },
      { type: 'switch', label: '🔌 SWITCH', desc: 'Toggle On/Off' },
      { type: 'wire-straight', label: '━ WIRE-LINE', desc: 'Rotate 0° / 90°' },
      { type: 'wire-corner', label: '┓ CORNER', desc: 'Rotate 4 corners' }
    ];

    let startY = 45;
    
    tools.forEach((tool) => {
      const container = this.add.container(85, startY);
      
      const btnBg = this.add.rectangle(0, 0, 130, 44, 0xF9F9F7)
        .setStrokeStyle(1.5, 0x111111)
        .setInteractive();
        
      const btnTxt = this.add.text(-55, -12, tool.label, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#111111'
      });

      const btnDesc = this.add.text(-55, 4, tool.desc, {
        fontFamily: 'Lora, serif',
        fontSize: '9px',
        color: '#737373'
      });

      container.add([btnBg, btnTxt, btnDesc]);
      this.toolboxButtons[tool.type] = container;

      btnBg.on('pointerdown', () => {
        this.selectTool(tool.type);
      });

      btnBg.on('pointerover', () => {
        if (this.selectedType !== tool.type) btnBg.setStrokeStyle(2.5, 0xCC0000);
      });
      
      btnBg.on('pointerout', () => {
        if (this.selectedType !== tool.type) btnBg.setStrokeStyle(1.5, 0x111111);
      });

      startY += 54;
    });

    // Default select wire-straight
    this.selectTool('wire-straight');
  }

  private selectTool(type: Component['type']) {
    if (this.selectedType) {
      const prevBg = this.toolboxButtons[this.selectedType]?.list[0] as Phaser.GameObjects.Rectangle;
      const prevTxt = this.toolboxButtons[this.selectedType]?.list[1] as Phaser.GameObjects.Text;
      if (prevBg) prevBg.setStrokeStyle(1.5, 0x111111).setFillStyle(0xF9F9F7);
      if (prevTxt) prevTxt.setColor('#111111');
    }

    if (this.selectedType === type) {
      this.selectedType = null;
    } else {
      this.selectedType = type;
      const activeBg = this.toolboxButtons[type]?.list[0] as Phaser.GameObjects.Rectangle;
      const activeTxt = this.toolboxButtons[type]?.list[1] as Phaser.GameObjects.Text;
      if (activeBg) activeBg.setStrokeStyle(2, 0x111111).setFillStyle(0x111111);
      if (activeTxt) activeTxt.setColor('#F9F9F7');
    }
  }

  private handleSocketClick(x: number, y: number) {
    const existing = this.grid[x][y];

    // Priority 1: If clicking an existing switch, ALWAYS toggle its ON/OFF state!
    if (existing && existing.type === 'switch') {
      const prev = { ...existing };
      existing.state = !existing.state;
      this.history.push({ x, y, prevComp: prev, newComp: { ...existing } });
      this.drawComponentSprite(x, y, existing);
      this.testCircuit();
      return;
    }

    if (!this.selectedType) {
      if (existing) {
        if (existing.type === 'wire-straight') {
          // Rotate straight wire 90°
          const prev = { ...existing };
          existing.orientation = (existing.orientation === 90) ? 0 : 90;
          this.history.push({ x, y, prevComp: prev, newComp: { ...existing } });
          this.drawComponentSprite(x, y, existing);
          this.testCircuit();
        } else if (existing.type === 'wire-corner') {
          // Rotate corner 90° through 4 orientations (0°, 90°, 180°, 270°)
          const prev = { ...existing };
          existing.orientation = ((existing.orientation || 0) + 90) % 360;
          this.history.push({ x, y, prevComp: prev, newComp: { ...existing } });
          this.drawComponentSprite(x, y, existing);
          this.testCircuit();
        } else {
          // Remove component
          this.history.push({ x, y, prevComp: existing, newComp: null });
          this.grid[x][y] = null;
          this.clearSocketSprite(x, y);
        }
      }
      return;
    }

    // Placing a component with a selected tool
    if (existing && existing.type === this.selectedType) {
      // If clicking same wire type, rotate it!
      const prev = { ...existing };
      if (existing.type === 'wire-straight') {
        existing.orientation = (existing.orientation === 90) ? 0 : 90;
      } else if (existing.type === 'wire-corner') {
        existing.orientation = ((existing.orientation || 0) + 90) % 360;
      }
      this.history.push({ x, y, prevComp: prev, newComp: { ...existing } });
      this.drawComponentSprite(x, y, existing);
      this.testCircuit();
      return;
    }

    // Replace or place new component
    const prev = existing ? { ...existing } : null;
    const newComp: Component = {
      type: this.selectedType,
      x,
      y,
      orientation: 0,
      state: this.selectedType === 'switch' ? false : this.selectedType === 'bulb' ? false : undefined
    };

    this.grid[x][y] = newComp;
    this.history.push({ x, y, prevComp: prev, newComp: { ...newComp } });
    this.drawComponentSprite(x, y, newComp);
  }

  private clearSocketSprite(x: number, y: number) {
    const container = this.gridSprites[x][y];
    while (container.list.length > 2) {
      container.list[2].destroy();
    }
  }

  private drawComponentSprite(x: number, y: number, comp: Component) {
    const container = this.gridSprites[x][y];
    this.clearSocketSprite(x, y);

    const graphics = this.add.graphics();
    graphics.lineStyle(4, 0xE2E8F0);

    if (comp.type === 'battery') {
      graphics.fillStyle(0x3B82F6, 1);
      graphics.fillRect(-22, -12, 44, 24);
      graphics.fillStyle(0xEF4444, 1);
      graphics.fillRect(22, -6, 5, 12);
      
      const textMinus = this.add.text(-18, -7, '-', { fontSize: '12px', fontStyle: 'bold', color: '#FFF' });
      const textPlus = this.add.text(8, -7, '+', { fontSize: '12px', fontStyle: 'bold', color: '#FFF' });
      container.add([graphics, textMinus, textPlus]);
    } 
    else if (comp.type === 'bulb') {
      const color = comp.state ? 0xF59E0B : 0x475569;
      graphics.fillStyle(color, 1);
      graphics.fillCircle(0, 0, 16);
      graphics.strokeCircle(0, 0, 16);
      
      graphics.lineBetween(-35, 0, -16, 0);
      graphics.lineBetween(16, 0, 35, 0);
      container.add(graphics);
    } 
    else if (comp.type === 'switch') {
      graphics.fillStyle(0x64748B, 1);
      graphics.fillCircle(-16, 0, 4);
      graphics.fillCircle(16, 0, 4);
      
      if (comp.state) { // CLOSED (ON)
        graphics.lineStyle(4, 0x10B981);
        graphics.lineBetween(-16, 0, 16, 0);
        const statusTxt = this.add.text(-22, -24, 'ON (CLOSED)', { fontSize: '8px', fontStyle: 'bold', color: '#10B981' });
        container.add([graphics, statusTxt]);
      } else { // OPEN (OFF)
        graphics.lineStyle(4, 0xEF4444);
        graphics.lineBetween(-16, 0, 8, -14);
        const statusTxt = this.add.text(-20, -24, 'OFF (OPEN)', { fontSize: '8px', fontStyle: 'bold', color: '#EF4444' });
        container.add([graphics, statusTxt]);
      }
    } 

    else if (comp.type === 'wire-straight') {
      const orient = comp.orientation || 0;
      if (orient === 90) {
        // Vertical
        graphics.lineBetween(0, -40, 0, 40);
      } else {
        // Horizontal (0)
        graphics.lineBetween(-40, 0, 40, 0);
      }
      container.add(graphics);
    } 
    else if (comp.type === 'wire-corner') {
      const orient = comp.orientation || 0;
      // 0° (tr): Top-Right ┓
      // 90° (rb): Right-Bottom ┛
      // 180° (bl): Bottom-Left ┗
      // 270° (lt): Left-Top ┏
      if (orient === 0) {
        graphics.lineBetween(0, -40, 0, 0);
        graphics.lineBetween(0, 0, 40, 0);
      } else if (orient === 90) {
        graphics.lineBetween(40, 0, 0, 0);
        graphics.lineBetween(0, 0, 0, 40);
      } else if (orient === 180) {
        graphics.lineBetween(0, 40, 0, 0);
        graphics.lineBetween(0, 0, -40, 0);
      } else if (orient === 270) {
        graphics.lineBetween(-40, 0, 0, 0);
        graphics.lineBetween(0, 0, 0, -40);
      }
      container.add(graphics);
    }
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
      for (let x = 0; x < this.cols; x++) {
        for (let y = 0; y < this.rows; y++) {
          this.grid[x][y] = null;
          this.clearSocketSprite(x, y);
        }
      }
      this.history = [];
      this.feedbackText.setText('Grid cleared. Start placing components!').setColor('#111111');
      this.flowParticles.stop();
    });
    clearBg.on('pointerover', () => {
      clearBg.setFillStyle(0x111111);
      clearTxt.setColor('#F9F9F7');
    });
    clearBg.on('pointerout', () => {
      clearBg.setFillStyle(0xF9F9F7);
      clearTxt.setColor('#111111');
    });

    // UNDO 1 STEP
    const undoBg = this.add.rectangle(350, 422, 110, 36, 0xF9F9F7).setStrokeStyle(2, 0x111111).setInteractive();
    const undoTxt = this.add.text(350, 422, 'UNDO ↩️', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#111111'
    }).setOrigin(0.5);

    undoBg.on('pointerdown', () => this.undoLastStep());
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
    const testTxt = this.add.text(500, 422, 'TEST ⚡', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    testBg.on('pointerdown', () => this.testCircuit(true));
    testBg.on('pointerover', () => {
      testBg.setFillStyle(0x111111);
      testTxt.setColor('#FFFFFF');
    });
    testBg.on('pointerout', () => {
      testBg.setFillStyle(0xCC0000);
      testTxt.setColor('#FFFFFF');
    });
  }

  private undoLastStep() {
    if (this.history.length === 0) {
      this.feedbackText.setText('Nothing to undo!').setColor('#64748B');
      return;
    }

    const last = this.history.pop()!;
    this.grid[last.x][last.y] = last.prevComp ? { ...last.prevComp } : null;
    
    if (last.prevComp) {
      this.drawComponentSprite(last.x, last.y, last.prevComp);
    } else {
      this.clearSocketSprite(last.x, last.y);
    }
    
    this.feedbackText.setText('Undid last component change.').setColor('#3B82F6');
    this.testCircuit();
  }

  private testCircuit(isFinalClick = false) {
    this.flowParticles.stop();
    
    // Find Battery
    let battery: Component | null = null;
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        const item = this.grid[x][y];
        if (item && item.type === 'battery') {
          battery = item;
          break;
        }
      }
    }

    if (!battery) {
      if (isFinalClick) {
        this.feedbackText.setText('Missing battery: Connect a power source!').setColor('#F59E0B');
        this.events.emit('level-failure', { message: 'The circuit lacks a power source (Battery).' });
      }
      return;
    }

    const visited = new Set<string>();
    const path: {x: number, y: number}[] = [];
    let completeLoop = false;
    const litBulbs: Component[] = [];

    // Graph traversal DFS
    const dfs = (x: number, y: number, fromDir: 'left' | 'right' | 'top' | 'bottom'): boolean => {
      if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return false;
      
      const comp = this.grid[x][y];
      if (!comp) return false;

      const key = `${x},${y}`;
      if (visited.has(key)) {
        // If we reach battery negative (-) terminal from left, loop is closed!
        if (comp.type === 'battery' && fromDir === 'left') {
          return true;
        }
        return false;
      }
      
      let allowed = false;
      let exitDirs: ('left' | 'right' | 'top' | 'bottom')[] = [];

      if (comp.type === 'battery') {
        if (fromDir === 'right') { // positive terminal
          allowed = true;
          exitDirs = ['right'];
        } else if (fromDir === 'left') { // negative terminal
          completeLoop = true;
          return true;
        }
      } 
      else if (comp.type === 'bulb' || comp.type === 'switch') {
        if (fromDir === 'left' || fromDir === 'right') {
          allowed = true;
          exitDirs = [fromDir === 'left' ? 'right' : 'left'];
          
          if (comp.type === 'switch' && !comp.state) {
            allowed = false; // Switch open blocks current
          }
        }
      } 
      else if (comp.type === 'wire-straight') {
        const orient = comp.orientation || 0;
        if (orient === 0 && (fromDir === 'left' || fromDir === 'right')) {
          allowed = true;
          exitDirs = [fromDir === 'left' ? 'right' : 'left'];
        } else if (orient === 90 && (fromDir === 'top' || fromDir === 'bottom')) {
          allowed = true;
          exitDirs = [fromDir === 'top' ? 'bottom' : 'top'];
        }
      } 
      else if (comp.type === 'wire-corner') {
        const orient = comp.orientation || 0;
        // 0° (tr): Top-Right
        if (orient === 0) {
          if (fromDir === 'top') { allowed = true; exitDirs = ['right']; }
          else if (fromDir === 'right') { allowed = true; exitDirs = ['top']; }
        }
        // 90° (rb): Right-Bottom
        else if (orient === 90) {
          if (fromDir === 'right') { allowed = true; exitDirs = ['bottom']; }
          else if (fromDir === 'bottom') { allowed = true; exitDirs = ['right']; }
        }
        // 180° (bl): Bottom-Left
        else if (orient === 180) {
          if (fromDir === 'bottom') { allowed = true; exitDirs = ['left']; }
          else if (fromDir === 'left') { allowed = true; exitDirs = ['bottom']; }
        }
        // 270° (lt): Left-Top
        else if (orient === 270) {
          if (fromDir === 'left') { allowed = true; exitDirs = ['top']; }
          else if (fromDir === 'top') { allowed = true; exitDirs = ['left']; }
        }
      }

      if (!allowed) return false;

      visited.add(key);
      path.push({ x, y });

      if (comp.type === 'bulb') {
        litBulbs.push(comp);
      }

      for (const dir of exitDirs) {
        let nx = x;
        let ny = y;
        let nextFrom: 'left' | 'right' | 'top' | 'bottom' = 'left';

        if (dir === 'right') { nx = x + 1; nextFrom = 'left'; }
        else if (dir === 'left') { nx = x - 1; nextFrom = 'right'; }
        else if (dir === 'bottom') { ny = y + 1; nextFrom = 'top'; }
        else if (dir === 'top') { ny = y - 1; nextFrom = 'bottom'; }

        if (dfs(nx, ny, nextFrom)) {
          return true;
        }
      }

      path.pop();
      return false;
    };

    // Begin graph search from battery positive (right edge)
    const success = dfs(battery.x + 1, battery.y, 'left');

    // Reset bulb states
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        const item = this.grid[x][y];
        if (item && item.type === 'bulb') {
          item.state = false;
          this.drawComponentSprite(x, y, item);
        }
      }
    }

    if (success && completeLoop && litBulbs.length > 0) {
      litBulbs.forEach(b => {
        b.state = true;
        this.drawComponentSprite(b.x, b.y, b);
      });

      this.animateFlow(path);

      const reqBulbs = this.activeConfig.requiredBulbs || 1;
      if (litBulbs.length >= reqBulbs) {
        this.feedbackText.setText('SUCCESS! Target bulbs are shining bright!').setColor('#10B981');
        
        if (isFinalClick) {
          this.time.delayedCall(1200, () => {
            this.events.emit('level-success', { score: 100, timeTaken: 30 });
          });
        }
      } else {
        if (isFinalClick) {
          const msg = `Circuit closed, but lit ${litBulbs.length} bulbs. Level requires ${reqBulbs}.`;
          this.feedbackText.setText(msg).setColor('#F59E0B');
          this.events.emit('level-failure', { message: msg });
        }
      }
    } else {
      if (isFinalClick) {
        let msg = 'Circuit is incomplete: check wire connections and switches.';
        
        let openSwitchExists = false;
        for (let x = 0; x < this.cols; x++) {
          for (let y = 0; y < this.rows; y++) {
            const item = this.grid[x][y];
            if (item && item.type === 'switch' && !item.state) {
              openSwitchExists = true;
            }
          }
        }
        
        if (openSwitchExists) {
          msg = 'Circuit is incomplete: a Switch is currently Open!';
        }
        
        this.feedbackText.setText(msg).setColor('#EF4444');
        this.events.emit('level-failure', { message: msg });
      }
    }
  }

  private animateFlow(points: {x: number, y: number}[]) {
    if (points.length < 2) return;
    
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
      duration: 2000,
      repeat: -1
    });

    this.flowParticles.startFollow(follower);
    this.flowParticles.start();
  }
}

