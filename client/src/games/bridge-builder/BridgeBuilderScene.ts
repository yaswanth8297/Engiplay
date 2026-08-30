import * as Phaser from 'phaser';

interface Joint {
  id: string;
  x: number;
  y: number;
  isAnchor: boolean;
  isDeck: boolean;
  vx?: number;
  vy?: number;
  currX?: number;
  currY?: number;
}

interface Member {
  id: string;
  jointA: string;
  jointB: string;
  material: 'wood' | 'steel' | 'cable';
  restLength: number;
  stress: number; // 0 to 1+
  isBroken: boolean;
}

export class BridgeBuilderScene extends Phaser.Scene {
  private joints: Map<string, Joint> = new Map();
  private members: Member[] = [];
  
  private activeLevel = 1;
  private activeConfig: any = {};
  
  private selectedMaterial: 'wood' | 'steel' | 'cable' = 'wood';
  private selectedJointId: string | null = null;
  private isTesting = false;
  private isCollapsed = false;
  
  private budget = 1000;
  private currentCost = 0;
  private minConnectionsTarget = 8;
  
  private feedbackText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;
  
  private trainX = 0;
  private trainSpeed = 1.8;
  private trainGraphics!: Phaser.GameObjects.Graphics;
  private bridgeGraphics!: Phaser.GameObjects.Graphics;

  private gridSpacing = 60;
  private deckY = 260;
  private leftWallX = 140;
  private rightWallX = 540;

  constructor() {
    super('MainScene');
  }

  init(data: { level: number; config: any }) {
    this.activeLevel = data.level || 1;
    this.activeConfig = data.config || {};
    this.budget = this.activeConfig.budget || (this.activeLevel === 1 ? 600 : this.activeLevel === 2 ? 900 : 1300);
    this.minConnectionsTarget = this.activeLevel === 1 ? 8 : this.activeLevel === 2 ? 12 : 16;
    
    // Adjust gap width based on level
    if (this.activeLevel === 1) {
      this.leftWallX = 160;
      this.rightWallX = 520;
    } else if (this.activeLevel === 2) {
      this.leftWallX = 140;
      this.rightWallX = 540;
    } else {
      this.leftWallX = 120;
      this.rightWallX = 560;
    }

    this.joints.clear();
    this.members = [];
    this.isTesting = false;
    this.isCollapsed = false;
    this.currentCost = 0;
    this.selectedJointId = null;
    this.trainX = this.leftWallX - 100;
  }

  create() {
    // 1. Draw Environmental Background (Sky, Water, City Background, Abutments)
    this.drawEnvironment();

    // 2. Setup Canyon Anchors and Deck Nodes
    this.setupCanyon();

    // 3. Setup Graphics object for bridge & train
    this.bridgeGraphics = this.add.graphics().setDepth(5);
    this.trainGraphics = this.add.graphics().setDepth(15);

    // 4. UI Stats & Feedback
    this.statsText = this.add.text(20, 16, '', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#111111'
    }).setDepth(30);

    this.feedbackText = this.add.text(350, 385, 'Connect red joint dots to form triangular trusses, then click TEST TRAIN ▶️', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#111111'
    }).setOrigin(0.5).setDepth(30);

    // 5. Toolbox & Action Buttons
    this.createToolbox();
    this.createActionButtons();

    // 6. Draw Joint Nodes & Grid Snapping
    this.drawSnappingPoints();
    this.updateStatsDisplay();
    this.redrawBridge();
  }

  private drawEnvironment() {
    const g = this.add.graphics().setDepth(0);

    // Sky gradient box
    g.fillStyle(0xBAE6FD, 1); // Light blue sky
    g.fillRect(0, 0, 700, 340);

    // City Skyline Silhouette
    g.fillStyle(0x94A3B8, 0.4);
    // Skyscraper 1
    g.fillRect(40, 140, 60, 140);
    g.fillRect(120, 100, 80, 180);
    g.fillRect(230, 160, 50, 120);
    g.fillRect(320, 90, 90, 190);
    g.fillRect(440, 130, 70, 150);
    g.fillRect(540, 110, 80, 170);

    // River Water at bottom
    g.fillStyle(0x0284C7, 0.85);
    g.fillRect(0, 320, 700, 140);

    // Water Surface Waves
    g.fillStyle(0x38BDF8, 0.6);
    g.fillRect(0, 320, 700, 6);
    g.fillRect(0, 335, 700, 4);

    // Left Concrete Pier / Abutment
    g.fillStyle(0xE2E8F0, 1);
    g.fillRect(0, this.deckY, this.leftWallX, 180);
    g.fillStyle(0x64748B, 1);
    g.fillRect(this.leftWallX - 12, this.deckY, 12, 180);
    g.fillStyle(0x111111, 1);
    g.fillRect(0, this.deckY, this.leftWallX, 4); // Deck top edge

    // Right Concrete Pier / Abutment
    g.fillStyle(0xE2E8F0, 1);
    g.fillRect(this.rightWallX, this.deckY, 700 - this.rightWallX, 180);
    g.fillStyle(0x64748B, 1);
    g.fillRect(this.rightWallX, this.deckY, 12, 180);
    g.fillStyle(0x111111, 1);
    g.fillRect(this.rightWallX, this.deckY, 700 - this.rightWallX, 4); // Deck top edge

    // Level Header
    this.add.text(350, 20, `BRIDGE SIMULATOR • LEVEL ${this.activeLevel}`, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '13px',
      fontStyle: '900',
      color: '#111111'
    }).setOrigin(0.5).setDepth(30);
  }

  private setupCanyon() {
    // Anchor joints on left and right walls
    this.addJoint('A1', this.leftWallX, this.deckY, true, true);
    this.addJoint('A2', this.leftWallX - 60, this.deckY + 60, true, false);
    this.addJoint('B1', this.rightWallX, this.deckY, true, true);
    this.addJoint('B2', this.rightWallX + 60, this.deckY + 60, true, false);

    // Bridge deck joints spanning across canyon gap
    const gapNodesCount = Math.round((this.rightWallX - this.leftWallX) / this.gridSpacing) - 1;
    let prevJointId = 'A1';

    for (let i = 1; i <= gapNodesCount; i++) {
      const x = this.leftWallX + i * this.gridSpacing;
      const id = `D${i}`;
      this.addJoint(id, x, this.deckY, false, true);
      
      // Auto-connect road deck members
      this.addMember(prevJointId, id, 'steel');
      prevJointId = id;
    }
    
    // Connect final deck node to right wall anchor
    this.addMember(prevJointId, 'B1', 'steel');
    this.updateCost();
  }

  private addJoint(id: string, x: number, y: number, isAnchor: boolean, isDeck: boolean) {
    this.joints.set(id, {
      id,
      x,
      y,
      isAnchor,
      isDeck,
      vx: 0,
      vy: 0,
      currX: x,
      currY: y
    });
  }

  private addMember(jointA: string, jointB: string, material: 'wood' | 'steel' | 'cable') {
    const exists = this.members.find(m => 
      (m.jointA === jointA && m.jointB === jointB) || 
      (m.jointA === jointB && m.jointA === jointB)
    );
    if (exists) return;

    const jA = this.joints.get(jointA)!;
    const jB = this.joints.get(jointB)!;
    const restLength = Phaser.Math.Distance.Between(jA.x, jA.y, jB.x, jB.y);

    const id = `M_${jointA}_${jointB}`;
    this.members.push({
      id,
      jointA,
      jointB,
      material,
      restLength,
      stress: 0,
      isBroken: false
    });
  }

  private drawSnappingPoints() {
    const minX = this.leftWallX;
    const maxX = this.rightWallX;
    const minY = this.deckY - 60;
    const maxY = this.deckY + 120;

    for (let x = minX; x <= maxX; x += this.gridSpacing) {
      for (let y = minY; y <= maxY; y += this.gridSpacing) {
        const match = Array.from(this.joints.values()).find(j => Math.abs(j.x - x) < 5 && Math.abs(j.y - y) < 5);
        
        let jointId = '';
        if (match) {
          jointId = match.id;
        } else {
          jointId = `J_${x}_${y}`;
          this.addJoint(jointId, x, y, false, false);
        }

        // Draw Interactive Node (Red Circles as shown in user screenshots!)
        const isAnchor = match?.isAnchor || false;
        const circ = this.add.circle(x, y, isAnchor ? 7 : 6, 0xDC2626) // Red node circle!
          .setStrokeStyle(1.5, 0xFFFFFF)
          .setInteractive()
          .setDepth(20);

        circ.on('pointerdown', () => this.handleJointClick(jointId, circ));
        circ.on('pointerover', () => {
          if (!this.isTesting) circ.setScale(1.5).setStrokeStyle(2, 0xFACC15);
        });
        circ.on('pointerout', () => {
          if (!this.isTesting) circ.setScale(1).setStrokeStyle(1.5, 0xFFFFFF);
        });
      }
    }
  }

  private handleJointClick(id: string, circle: Phaser.GameObjects.Arc) {
    if (this.isTesting) return;

    if (!this.selectedJointId) {
      this.selectedJointId = id;
      circle.setStrokeStyle(3, 0x22C55E); // Green highlight selected node
    } else {
      if (this.selectedJointId !== id) {
        const costConfig = { wood: 15, steel: 35, cable: 25 };
        const jA = this.joints.get(this.selectedJointId)!;
        const jB = this.joints.get(id)!;
        const len = Phaser.Math.Distance.Between(jA.x, jA.y, jB.x, jB.y);
        const addedCost = Math.round((len / 10) * costConfig[this.selectedMaterial]);

        if (this.currentCost + addedCost > this.budget) {
          this.feedbackText.setText('Budget limit reached! Optimise your truss design.').setColor('#DC2626');
        } else {
          this.addMember(this.selectedJointId, id, this.selectedMaterial);
          this.updateCost();
          this.feedbackText.setText('Beam added! Connect more nodes to form rigid triangles.').setColor('#15803D');
        }
      }
      this.selectedJointId = null;
      this.redrawBridge();
    }
  }

  private updateCost() {
    const costConfig = { wood: 15, steel: 35, cable: 25 };
    let total = 0;

    this.members.forEach(m => {
      const a = this.joints.get(m.jointA)!;
      const b = this.joints.get(m.jointB)!;
      const len = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
      total += Math.round((len / 10) * costConfig[m.material]);
    });

    this.currentCost = total;
    this.updateStatsDisplay();
  }

  private updateStatsDisplay() {
    const userBeamsCount = this.members.length;
    this.statsText.setText(`BUDGET: $${this.currentCost} / $${this.budget}   •   BEAMS USED: ${userBeamsCount} (TARGET: ≤ ${this.minConnectionsTarget})`);
  }

  private redrawBridge() {
    this.bridgeGraphics.clear();

    // 1. Draw Members/Beams
    this.members.forEach(m => {
      if (m.isBroken) return;

      const jA = this.joints.get(m.jointA)!;
      const jB = this.joints.get(m.jointB)!;
      const ax = jA.currX ?? jA.x;
      const ay = jA.currY ?? jA.y;
      const bx = jB.currX ?? jB.x;
      const by = jB.currY ?? jB.y;

      let color = 0x22C55E; // Green (Safe)
      let thickness = 4;

      if (this.isTesting) {
        if (m.stress > 0.85) {
          color = 0xDC2626; // Red (High stress / dangerous)
        } else if (m.stress > 0.5) {
          color = 0xEAB308; // Yellow (Medium stress)
        } else {
          color = 0x22C55E; // Green (Safe)
        }
      } else {
        if (m.material === 'wood') color = 0xEAB308;
        if (m.material === 'steel') color = 0x22C55E;
        if (m.material === 'cable') color = 0x0284C7;
      }

      if (m.material === 'cable') thickness = 2;

      this.bridgeGraphics.lineStyle(thickness, color, 1);
      this.bridgeGraphics.lineBetween(ax, ay, bx, by);
    });

    // 2. Draw Red Joint Dots on top (Matching Screenshots!)
    this.joints.forEach(j => {
      const x = j.currX ?? j.x;
      const y = j.currY ?? j.y;
      if (j.isAnchor || Array.from(this.members).some(m => (!m.isBroken && (m.jointA === j.id || m.jointB === j.id)))) {
        this.bridgeGraphics.fillStyle(0xDC2626, 1); // Bright red dot
        this.bridgeGraphics.fillCircle(x, y, 6);
        this.bridgeGraphics.lineStyle(1.5, 0xFFFFFF, 1);
        this.bridgeGraphics.strokeCircle(x, y, 6);
      }
    });
  }

  private createToolbox() {
    const materials: { type: Member['material']; label: string; desc: string }[] = [
      { type: 'wood', label: '🪵 WOOD BEAM', desc: '$15/m • Medium' },
      { type: 'steel', label: '🔩 STEEL TRUSS', desc: '$35/m • Strong' },
      { type: 'cable', label: '🪢 CABLE', desc: '$25/m • Tension' }
    ];

    let startX = 20;
    let startY = 415;

    materials.forEach((mat, idx) => {
      const container = this.add.container(startX + idx * 115, startY).setDepth(30);

      const bg = this.add.rectangle(0, 0, 105, 32, 0xF9F9F7)
        .setStrokeStyle(2, 0x111111)
        .setInteractive();

      const text = this.add.text(-46, -10, mat.label, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#111111'
      });

      const desc = this.add.text(-46, 2, mat.desc, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '7px',
        color: '#525252'
      });

      container.add([bg, text, desc]);

      bg.on('pointerdown', () => {
        this.selectedMaterial = mat.type;
        this.feedbackText.setText(`Selected ${mat.label}. Click two nodes to place a beam.`).setColor('#111111');
      });

      bg.on('pointerover', () => bg.setFillStyle(0xFEF08A));
      bg.on('pointerout', () => bg.setFillStyle(0xF9F9F7));
    });
  }

  private createActionButtons() {
    // CLEAR BUTTON
    const clearBtn = this.add.rectangle(430, 415, 80, 32, 0xF9F9F7)
      .setStrokeStyle(2, 0x111111)
      .setInteractive()
      .setDepth(30);
    
    const clearTxt = this.add.text(430, 415, 'CLEAR 🗑️', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#111111'
    }).setOrigin(0.5).setDepth(30);

    clearBtn.on('pointerdown', () => {
      this.scene.restart({ level: this.activeLevel, config: this.activeConfig });
    });
    clearBtn.on('pointerover', () => clearBtn.setFillStyle(0xE5E5E0));
    clearBtn.on('pointerout', () => clearBtn.setFillStyle(0xF9F9F7));

    // UNDO BUTTON
    const undoBtn = this.add.rectangle(520, 415, 75, 32, 0xF9F9F7)
      .setStrokeStyle(2, 0x111111)
      .setInteractive()
      .setDepth(30);

    const undoTxt = this.add.text(520, 415, 'UNDO ↩️', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#111111'
    }).setOrigin(0.5).setDepth(30);

    undoBtn.on('pointerdown', () => this.undoLastMember());
    undoBtn.on('pointerover', () => undoBtn.setFillStyle(0xE5E5E0));
    undoBtn.on('pointerout', () => undoBtn.setFillStyle(0xF9F9F7));

    // TEST TRAIN DRIVE BUTTON (Editorial Red)
    const testBtn = this.add.rectangle(625, 415, 110, 32, 0xDC2626)
      .setStrokeStyle(2, 0x111111)
      .setInteractive()
      .setDepth(30);

    const testTxt = this.add.text(625, 415, 'TEST TRAIN ▶️', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '10px',
      fontStyle: '900',
      color: '#FFFFFF'
    }).setOrigin(0.5).setDepth(30);

    testBtn.on('pointerdown', () => this.startTrainTest());
    testBtn.on('pointerover', () => testBtn.setFillStyle(0x991B1B));
    testBtn.on('pointerout', () => testBtn.setFillStyle(0xDC2626));
  }

  private undoLastMember() {
    if (this.members.length <= 3) {
      this.feedbackText.setText('Only base deck members remaining.').setColor('#525252');
      return;
    }
    this.members.pop();
    this.updateCost();
    this.redrawBridge();
  }

  private startTrainTest() {
    if (this.isTesting) return;
    this.isTesting = true;
    this.isCollapsed = false;
    this.trainX = this.leftWallX - 80;

    // Reset joint positions
    this.joints.forEach(j => {
      j.currX = j.x;
      j.currY = j.y;
      j.vx = 0;
      j.vy = 0;
    });

    this.feedbackText.setText('Heavy Freight Train entering bridge... Checking structural load!').setColor('#EAB308');
  }

  update(time: number, delta: number) {
    if (!this.isTesting) return;

    if (!this.isCollapsed) {
      // Advance train across bridge
      this.trainX += this.trainSpeed;

      // Calculate weight load on deck nodes based on train X position
      this.joints.forEach(j => {
        if (!j.isAnchor) {
          const distToTrain = Math.abs(j.x - this.trainX);
          if (distToTrain < 70) {
            const loadForce = (1 - distToTrain / 70) * (this.activeLevel * 3.5);
            j.vy = (j.vy || 0) + loadForce * 0.15;
          }
        }
      });

      // Calculate member stress & deformation
      let totalOverload = false;
      this.members.forEach(m => {
        if (m.isBroken) return;
        const jA = this.joints.get(m.jointA)!;
        const jB = this.joints.get(m.jointB)!;
        const ax = jA.currX ?? jA.x;
        const ay = jA.currY ?? jA.y;
        const bx = jB.currX ?? jB.x;
        const by = jB.currY ?? jB.y;

        const currentLen = Phaser.Math.Distance.Between(ax, ay, bx, by);
        const stretch = Math.abs(currentLen - m.restLength) / m.restLength;
        m.stress = stretch * 8; // Stress factor

        const maxLimit = m.material === 'steel' ? 0.35 : m.material === 'wood' ? 0.22 : 0.28;
        if (m.stress > maxLimit) {
          m.isBroken = true;
          totalOverload = true;
        }
      });

      // Simple structural spring relaxation for deck deflection
      this.joints.forEach(j => {
        if (!j.isAnchor) {
          // Spring pull towards original position
          const dy = j.y - (j.currY ?? j.y);
          j.vy = ((j.vy || 0) + dy * 0.1) * 0.85; // Damping
          j.currY = (j.currY ?? j.y) + (j.vy || 0);
        }
      });

      if (totalOverload) {
        this.triggerCollapse();
      }

      // Check success condition: train crossed right bank safely
      if (this.trainX > this.rightWallX + 60) {
        this.handleSuccess();
      }
    } else {
      // Collapse animation physics (joints and train plunge into water!)
      this.joints.forEach(j => {
        if (!j.isAnchor) {
          j.vy = (j.vy || 0) + 0.5; // Gravity pull down into river
          j.currY = (j.currY ?? j.y) + j.vy;
        }
      });
      // Train falls down
      if (this.trainX > this.leftWallX) {
        this.deckY += 0.2;
      }
    }

    this.drawTrain();
    this.redrawBridge();
  }

  private triggerCollapse() {
    this.isCollapsed = true;
    this.feedbackText.setText('💥 BRIDGE COLLAPSED! Structural members snapped under heavy train weight!').setColor('#DC2626');

    // Camera shake & splash effect
    this.cameras.main.shake(400, 0.01);
    
    this.time.delayedCall(1800, () => {
      this.isTesting = false;
      this.events.emit('level-failure', { message: 'Bridge collapsed! Trusses failed to support the heavy train load.' });
    });
  }

  private handleSuccess() {
    this.isTesting = false;
    const movesCount = this.members.length;
    const isMinimalMoves = movesCount <= this.minConnectionsTarget;
    const score = isMinimalMoves ? 100 : Math.max(70, 100 - (movesCount - this.minConnectionsTarget) * 5);

    this.feedbackText.setText(`🎉 SUCCESS! Train crossed safely! Moves: ${movesCount} beams used. Score: ${score}/100`).setColor('#15803D');

    this.time.delayedCall(1200, () => {
      this.events.emit('level-success', { score, timeTaken: 30 });
    });
  }

  private drawTrain() {
    this.trainGraphics.clear();
    const trainY = this.deckY - 18;

    if (this.isCollapsed) {
      // Draw falling train plunging into water
      const fallY = Math.min(360, trainY + (this.trainX - this.leftWallX) * 0.6);
      
      // Train Engine (Red Locomotive)
      this.trainGraphics.fillStyle(0xDC2626, 1);
      this.trainGraphics.fillRect(this.trainX - 35, fallY - 14, 40, 18);
      // Train Cab
      this.trainGraphics.fillStyle(0x1E293B, 1);
      this.trainGraphics.fillRect(this.trainX - 30, fallY - 22, 16, 10);
      // Wheels
      this.trainGraphics.fillStyle(0x111111, 1);
      this.trainGraphics.fillCircle(this.trainX - 25, fallY + 4, 5);
      this.trainGraphics.fillCircle(this.trainX - 5, fallY + 4, 5);
      return;
    }

    if (!this.isTesting && this.trainX < this.leftWallX - 50) return;

    // Draw Train Locomotive & Freight Cars rolling across bridge
    const x = this.trainX;

    // Car 2 (Freight Boxcar)
    this.trainGraphics.fillStyle(0x0284C7, 1);
    this.trainGraphics.fillRect(x - 115, trainY - 16, 45, 20);
    this.trainGraphics.fillStyle(0x111111, 1);
    this.trainGraphics.fillCircle(x - 105, trainY + 4, 4);
    this.trainGraphics.fillCircle(x - 80, trainY + 4, 4);

    // Car 1 (Freight Boxcar)
    this.trainGraphics.fillStyle(0xEAB308, 1);
    this.trainGraphics.fillRect(x - 65, trainY - 16, 45, 20);
    this.trainGraphics.fillStyle(0x111111, 1);
    this.trainGraphics.fillCircle(x - 55, trainY + 4, 4);
    this.trainGraphics.fillCircle(x - 30, trainY + 4, 4);

    // Engine (Red Locomotive)
    this.trainGraphics.fillStyle(0xDC2626, 1);
    this.trainGraphics.fillRect(x - 15, trainY - 18, 45, 22);
    // Smokestack & Cab
    this.trainGraphics.fillStyle(0x1E293B, 1);
    this.trainGraphics.fillRect(x + 15, trainY - 26, 12, 10);
    this.trainGraphics.fillRect(x - 10, trainY - 26, 16, 10);
    // Wheels
    this.trainGraphics.fillStyle(0x111111, 1);
    this.trainGraphics.fillCircle(x - 5, trainY + 4, 5);
    this.trainGraphics.fillCircle(x + 15, trainY + 4, 5);
    this.trainGraphics.fillCircle(x + 25, trainY + 4, 5);
  }
}
