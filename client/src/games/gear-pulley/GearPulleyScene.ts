import * as Phaser from 'phaser';

interface Gear {
  id: string;
  pegX: number;
  pegY: number;
  radius: number;
  teeth: number;
  angle: number;
  speed: number;
  spriteContainer?: Phaser.GameObjects.Container;
}

interface Belt {
  id: string;
  pegA: string;
  pegB: string;
  isCrossed: boolean;
  lineGraphics?: Phaser.GameObjects.Graphics;
}

export class GearPulleyScene extends Phaser.Scene {
  private pegs: { x: number; y: number; id: string }[] = [];
  private gears: Map<string, Gear> = new Map();
  private belts: Belt[] = [];
  
  private activeLevel = 1;
  private activeConfig: any = {};
  
  private selectedGearSize: number | null = null; // 10, 20, 30 radius
  private beltStartPegId: string | null = null;
  private selectedTool: 'gear' | 'belt-straight' | 'belt-crossed' | 'remove' = 'gear';
  
  private motorPegId = 'P_2_2';
  private outputPegId = 'P_6_2';
  
  private gridSpacing = 70;
  private offsetX = 180;
  private toolboxButtons: { [key: string]: Phaser.GameObjects.Container } = {};
  private offsetY = 120;
  
  private isTesting = false;
  private targetAdvantage = 2.0;
  private feedbackText!: Phaser.GameObjects.Text;
  
  constructor() {
    super('MainScene');
  }

  init(data: { level: number; config: any }) {
    this.activeLevel = data.level || 1;
    this.activeConfig = data.config || {};
    this.targetAdvantage = this.activeConfig.targetAdvantage || 2.0;
    
    this.gears.clear();
    this.belts = [];
    this.pegs = [];
    this.isTesting = false;
    this.selectedGearSize = 20; // Default gear
    this.beltStartPegId = null;
  }

  create() {
    // Newsprint Paper Background Card
    this.add.rectangle(350, 240, 680, 460, 0xF9F9F7).setStrokeStyle(2, 0x111111);

    // Target Speed display in Newsprint Mono
    const dirTxt = this.targetAdvantage > 0 ? 'Clockwise ↻' : 'Counter-Clockwise ↺';
    this.add.text(20, 20, `Target: ${Math.abs(this.targetAdvantage)}x • ${dirTxt}`, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#111111'
    });

    this.feedbackText = this.add.text(350, 375, 'Place gears or link belts to connect the motor (blue) to output (pink)', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#111111'
    }).setOrigin(0.5);

    // Draw Board Pegs
    this.drawPegBoard();

    // Create selection Toolbox
    this.createToolbox();

    // Setup action triggers
    this.createActionButtons();

    // Seed Motor and Output shafts
    this.setupMotorAndOutput();
  }

  private drawPegBoard() {
    // 6 columns x 4 rows
    for (let x = 0; x < 6; x++) {
      for (let y = 0; y < 4; y++) {
        const posX = this.offsetX + x * this.gridSpacing;
        const posY = this.offsetY + y * this.gridSpacing;
        const id = `P_${x}_${y}`;
        this.pegs.push({ x: posX, y: posY, id });

        // Is it motor or output peg?
        let color = 0x475569;
        let radius = 6;
        if (id === this.motorPegId) {
          color = 0x3B82F6; // Blue motor
          radius = 9;
        } else if (id === this.outputPegId) {
          color = 0xEC4899; // Pink output
          radius = 9;
        }

        const pegCircle = this.add.circle(posX, posY, radius, color)
          .setInteractive()
          .setDepth(5);
          
        pegCircle.on('pointerdown', () => this.handlePegClick(id));
      }
    }
  }

  private setupMotorAndOutput() {
    // Seed initial driving motor gear (Small 10 radius)
    this.placeGearAtPeg(this.motorPegId, 20);
    // Seed final output shaft peg (receives speed check)
    this.placeGearAtPeg(this.outputPegId, 20);
  }

  private handlePegClick(pegId: string) {
    if (this.isTesting) return;

    const peg = this.pegs.find(p => p.id === pegId)!;

    if (this.selectedTool === 'remove') {
      this.removeGearAtPeg(pegId);
      this.removeBeltsConnectedToPeg(pegId);
      return;
    }

    if (this.selectedTool === 'gear') {
      if (this.selectedGearSize) {
        // Clear previous gear if any
        this.removeGearAtPeg(pegId);
        this.placeGearAtPeg(pegId, this.selectedGearSize);
      }
      return;
    }

    if (this.selectedTool === 'belt-straight' || this.selectedTool === 'belt-crossed') {
      if (!this.gears.has(pegId)) {
        this.feedbackText.setText('Select a peg that has a gear to start a belt connection.').setColor('#F59E0B');
        return;
      }

      if (!this.beltStartPegId) {
        this.beltStartPegId = pegId;
        this.feedbackText.setText('Now select the target gear peg to link the belt.').setColor('#3B82F6');
      } else {
        if (this.beltStartPegId !== pegId) {
          this.linkBelt(this.beltStartPegId, pegId, this.selectedTool === 'belt-crossed');
        }
        this.beltStartPegId = null;
        this.feedbackText.setText('Belt link established!').setColor('#10B981');
      }
    }
  }

  private placeGearAtPeg(pegId: string, radius: number) {
    const peg = this.pegs.find(p => p.id === pegId)!;
    const teeth = radius === 10 ? 10 : radius === 20 ? 20 : 30;

    // Create gear visual container
    const container = this.add.container(peg.x, peg.y).setDepth(4);
    
    // Draw gear teeth procedurally
    const graphics = this.add.graphics();
    const gearColor = pegId === this.motorPegId ? 0x3B82F6 : pegId === this.outputPegId ? 0xEC4899 : 0x10B981;
    
    graphics.lineStyle(1.5, 0xFFFFFF);
    graphics.fillStyle(gearColor, 0.8);
    
    // Draw circles and gear shapes
    graphics.fillCircle(0, 0, radius * 1.5);
    graphics.strokeCircle(0, 0, radius * 1.5);
    
    // Draw inner shaft connection
    graphics.fillStyle(0x000000, 1);
    graphics.fillCircle(0, 0, 4);

    // Draw radial notches to show rotation clearly
    graphics.lineStyle(2, 0xFFFFFF);
    for (let a = 0; a < 360; a += 45) {
      const rad = Phaser.Math.DegToRad(a);
      graphics.lineBetween(0, 0, Math.cos(rad) * radius * 1.5, Math.sin(rad) * radius * 1.5);
    }
    
    container.add(graphics);

    this.gears.set(pegId, {
      id: pegId,
      pegX: peg.x,
      pegY: peg.y,
      radius: radius * 1.5,
      teeth,
      angle: 0,
      speed: 0,
      spriteContainer: container
    });
    
    this.calculateGearSpeeds();
  }

  private removeGearAtPeg(pegId: string) {
    // Keep motor and output shaft from being deleted
    if (pegId === this.motorPegId || pegId === this.outputPegId) return;

    const gear = this.gears.get(pegId);
    if (gear) {
      if (gear.spriteContainer) gear.spriteContainer.destroy();
      this.gears.delete(pegId);
    }
    this.calculateGearSpeeds();
  }

  private removeBeltsConnectedToPeg(pegId: string) {
    this.belts = this.belts.filter(b => {
      const isConnected = b.pegA === pegId || b.pegB === pegId;
      if (isConnected && b.lineGraphics) {
        b.lineGraphics.destroy();
      }
      return !isConnected;
    });
    this.calculateGearSpeeds();
  }

  private linkBelt(pegA: string, pegB: string, isCrossed: boolean) {
    const id = `B_${pegA}_${pegB}`;
    
    // Check if belt already exists
    const exists = this.belts.find(b => (b.pegA === pegA && b.pegB === pegB) || (b.pegA === pegB && b.pegB === pegA));
    if (exists) return;

    const gA = this.gears.get(pegA)!;
    const gB = this.gears.get(pegB)!;
    
    // Draw belt visual
    const graphics = this.add.graphics().setDepth(2);
    graphics.lineStyle(3, 0xF59E0B, 0.8);

    if (isCrossed) {
      // Draw crossed line (figure 8)
      graphics.lineBetween(gA.pegX, gA.pegY, gB.pegX, gB.pegY);
      // Offset lines slightly to represent crossed belt loop
      graphics.lineBetween(gA.pegX, gA.pegY - 6, gB.pegX, gB.pegY + 6);
      graphics.lineBetween(gA.pegX, gA.pegY + 6, gB.pegX, gB.pegY - 6);
    } else {
      // Draw straight belts top and bottom
      graphics.lineBetween(gA.pegX, gA.pegY - gA.radius, gB.pegX, gB.pegY - gB.radius);
      graphics.lineBetween(gA.pegX, gA.pegY + gA.radius, gB.pegX, gB.pegY + gB.radius);
    }

    this.belts.push({
      id,
      pegA,
      pegB,
      isCrossed,
      lineGraphics: graphics
    });

    this.calculateGearSpeeds();
  }

  private calculateGearSpeeds() {
    // Reset all speeds to 0
    this.gears.forEach(g => g.speed = 0);

    const motor = this.gears.get(this.motorPegId);
    if (!motor) return;

    // Driving motor speed is always constant (e.g. 2.0 units clockwise)
    motor.speed = 2.0;

    const visited = new Set<string>();
    const queue: string[] = [this.motorPegId];
    visited.add(this.motorPegId);

    // BFS to propagate rotation speeds
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const curGear = this.gears.get(currentId)!;

      // 1. Traverse mesh gears (adjacent pegs physically touching)
      this.gears.forEach((otherGear, otherId) => {
        if (visited.has(otherId)) return;

        const distance = Phaser.Math.Distance.Between(curGear.pegX, curGear.pegY, otherGear.pegX, otherGear.pegY);
        const sumRadii = curGear.radius + otherGear.radius;

        // Snaps adjacent: allow 5 pixel tolerance
        if (Math.abs(distance - sumRadii) < 8) {
          // Mesh transmission: Speed reverses, ratio = curTeeth / otherTeeth
          otherGear.speed = -curGear.speed * (curGear.teeth / otherGear.teeth);
          visited.add(otherId);
          queue.push(otherId);
        }
      });

      // 2. Traverse belt connections
      this.belts.forEach(b => {
        let otherId: string | null = null;
        if (b.pegA === currentId) otherId = b.pegB;
        else if (b.pegB === currentId) otherId = b.pegA;

        if (otherId && !visited.has(otherId)) {
          const otherGear = this.gears.get(otherId)!;
          const ratio = curGear.teeth / otherGear.teeth;
          
          if (b.isCrossed) {
            // Crossed belt reverses direction
            otherGear.speed = -curGear.speed * ratio;
          } else {
            // Straight belt keeps direction
            otherGear.speed = curGear.speed * ratio;
          }
          
          visited.add(otherId);
          queue.push(otherId);
        }
      });
    }
  }

  private createToolbox() {
    this.toolboxButtons = {};
    
    // 3 sizes of gears
    const gearsTools = [
      { radius: 10, label: '⚙️ Small (10T)' },
      { radius: 20, label: '⚙️ Medium (20T)' },
      { radius: 30, label: '⚙️ Large (30T)' }
    ];

    let startY = 45;

    gearsTools.forEach((g) => {
      const container = this.add.container(85, startY);
      const bg = this.add.rectangle(0, 0, 130, 36, 0xF9F9F7)
        .setStrokeStyle(1.5, 0x111111)
        .setInteractive();
      const txt = this.add.text(-50, -8, g.label, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#111111'
      });
      container.add([bg, txt]);

      bg.on('pointerdown', () => {
        this.selectedTool = 'gear';
        this.selectedGearSize = g.radius;
        this.resetToolHighlights();
        bg.setStrokeStyle(2, 0x111111).setFillStyle(0x111111);
        txt.setColor('#F9F9F7');
      });

      this.toolboxButtons[`gear_${g.radius}`] = container;
      startY += 44;
    });

    // Pulleys/Belts tools
    const beltTools = [
      { id: 'belt-straight', label: '🔗 Straight Belt' },
      { id: 'belt-crossed', label: '❌ Crossed Belt' },
      { id: 'remove', label: '🗑️ Remove Item' }
    ];

    beltTools.forEach((t) => {
      const container = this.add.container(85, startY);
      const bg = this.add.rectangle(0, 0, 130, 36, 0xF9F9F7)
        .setStrokeStyle(1.5, 0x111111)
        .setInteractive();
      const txt = this.add.text(-50, -8, t.label, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#111111'
      });
      container.add([bg, txt]);

      bg.on('pointerdown', () => {
        this.selectedTool = t.id as any;
        this.selectedGearSize = null;
        this.beltStartPegId = null;
        this.resetToolHighlights();
        bg.setStrokeStyle(2, 0x111111).setFillStyle(0x111111);
        txt.setColor('#F9F9F7');
      });

      this.toolboxButtons[t.id] = container;
      startY += 44;
    });

    // Default select Medium Gear
    const defaultContainer = this.toolboxButtons['gear_20'];
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
      // Remove last placed gear (not motor/output) or last belt
      if (this.belts.length > 0) {
        const b = this.belts.pop()!;
        if (b.lineGraphics) b.lineGraphics.destroy();
        this.calculateGearSpeeds();
        this.feedbackText.setText('Undid last belt link.').setColor('#111111');
      } else {
        const gearKeys = Array.from(this.gears.keys()).filter(k => k !== this.motorPegId && k !== this.outputPegId);
        if (gearKeys.length > 0) {
          const lastKey = gearKeys[gearKeys.length - 1];
          this.removeGearAtPeg(lastKey);
          this.feedbackText.setText('Undid last placed gear.').setColor('#111111');
        } else {
          this.feedbackText.setText('Nothing to undo!').setColor('#737373');
        }
      }
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
    const testTxt = this.add.text(500, 422, 'TEST ▶️', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    testBg.on('pointerdown', () => this.runSimulationCheck());
    testBg.on('pointerover', () => {
      testBg.setFillStyle(0x111111);
      testTxt.setColor('#FFFFFF');
    });
    testBg.on('pointerout', () => {
      testBg.setFillStyle(0xCC0000);
      testTxt.setColor('#FFFFFF');
    });
  }

  private runSimulationCheck() {
    if (this.isTesting) return;
    this.isTesting = true;

    // Recalculate just in case
    this.calculateGearSpeeds();

    const outputGear = this.gears.get(this.outputPegId)!;
    const motorGear = this.gears.get(this.motorPegId)!;

    if (outputGear.speed === 0) {
      this.feedbackText.setText('Output shaft is not rotating. Connect the gear train!').setColor('#EF4444');
      this.time.delayedCall(1500, () => {
        this.isTesting = false;
        this.events.emit('level-failure', { message: 'Output gear is disconnected from motor.' });
      });
      return;
    }

    // Ratio = output speed / motor speed
    const calculatedAdvantage = outputGear.speed / motorGear.speed;
    const tolerance = this.activeConfig.tolerance || 0.08;
    const target = this.targetAdvantage;

    // Verify correct direction and ratio match
    const directionMatches = (target > 0 && calculatedAdvantage > 0) || (target < 0 && calculatedAdvantage < 0);
    const ratioMatches = Math.abs(Math.abs(calculatedAdvantage) - Math.abs(target)) < tolerance;

    if (directionMatches && ratioMatches) {
      this.feedbackText.setText(`SUCCESS! Mechanical Advantage met: ${calculatedAdvantage.toFixed(1)}x`).setColor('#10B981');
      
      this.time.delayedCall(1500, () => {
        this.events.emit('level-success', { score: 100, timeTaken: 25 });
      });
    } else {
      let failMsg = `Incorrect Gear Transmission ratio! Output is ${calculatedAdvantage.toFixed(2)}x.`;
      if (!directionMatches) {
        failMsg = `Wrong rotation direction! Currently spinning ${calculatedAdvantage > 0 ? 'Clockwise' : 'Counter-Clockwise'}.`;
      }
      this.feedbackText.setText(failMsg).setColor('#EF4444');
      
      this.time.delayedCall(2000, () => {
        this.isTesting = false;
        this.events.emit('level-failure', { message: failMsg });
      });
    }
  }

  update(time: number, delta: number) {
    // Rotate the gears on the board
    this.gears.forEach(g => {
      if (g.speed !== 0) {
        // Speed changes angular rotation
        // Multiply by delta to ensure speed consistency across framerates
        g.angle += g.speed * (delta / 16.66) * 0.8;
        if (g.spriteContainer) {
          g.spriteContainer.setAngle(g.angle);
        }
      }
    });
  }
}
