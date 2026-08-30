import * as Phaser from 'phaser';

export class EnergyBalancerScene extends Phaser.Scene {
  private activeLevel = 1;
  private activeConfig: any = {};
  
  // Game state
  private batteryCapacity = 100;
  private batteryCharge = 50;
  private solarPeak = 50;
  private windBase = 20;
  private houseDemand = 40;
  private criticalDemand = 20; // Hospital
  private duration = 60; // 60 seconds cycle
  
  private timeElapsed = 0;
  private isTesting = false;
  
  // Player control toggles
  private powerHospital = true;
  private powerHouses = true;
  private powerWaterPump = false; // Deferred load
  
  // Visual elements
  private batteryBar!: Phaser.GameObjects.Rectangle;
  private batteryText!: Phaser.GameObjects.Text;
  private solarText!: Phaser.GameObjects.Text;
  private windText!: Phaser.GameObjects.Text;
  private demandText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;
  
  private hospitalSwitch!: Phaser.GameObjects.Rectangle;
  private housesSwitch!: Phaser.GameObjects.Rectangle;
  private pumpSwitch!: Phaser.GameObjects.Rectangle;
  
  private chartPoints: { solar: number; demand: number; battery: number }[] = [];
  private chartGraphics!: Phaser.GameObjects.Graphics;

  constructor() {
    super('MainScene');
  }

  init(data: { level: number; config: any }) {
    this.activeLevel = data.level || 1;
    this.activeConfig = data.config || {};
    
    this.batteryCapacity = this.activeConfig.batteryCapacity || 100;
    this.batteryCharge = this.batteryCapacity * 0.6; // Start at 60%
    this.solarPeak = this.activeConfig.solarPeak || 50;
    this.windBase = this.activeConfig.windBase || 20;
    this.houseDemand = this.activeConfig.houseDemand || 40;
    this.criticalDemand = this.activeConfig.criticalDemand || 20;
    this.duration = this.activeConfig.duration || 60;
    
    this.timeElapsed = 0;
    this.isTesting = false;
    this.powerHospital = true;
    this.powerHouses = true;
    this.powerWaterPump = false;
    this.chartPoints = [];
  }

  create() {
    // Newsprint Paper Background Card
    this.add.rectangle(350, 240, 680, 460, 0xF9F9F7).setStrokeStyle(2, 0x111111);

    this.feedbackText = this.add.text(350, 375, 'Manage load switches. Turn off non-essential loads when generation dips.', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#111111'
    }).setOrigin(0.5);

    // Render static grid network
    this.drawPowerNetwork();

    // Render dynamic monitors
    this.setupHUD();

    // Action triggers
    this.createActionButtons();

    this.chartGraphics = this.add.graphics().setDepth(1);
  }

  private drawPowerNetwork() {
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0x475569);
    
    // Draw generator nodes (Left Side)
    // Solar Panel
    this.add.rectangle(230, 120, 70, 46, 0x0F172A).setStrokeStyle(2, 0xF59E0B);
    this.add.text(205, 112, '☀️ SOLAR', { fontFamily: 'monospace', fontSize: '10px', color: '#F59E0B', fontStyle: 'bold' });
    this.solarText = this.add.text(205, 126, '0 kW', { fontFamily: 'monospace', fontSize: '9px', color: '#94A3B8' });
    
    // Wind Turbine
    this.add.rectangle(230, 200, 70, 46, 0x0F172A).setStrokeStyle(2, 0x06B6D4);
    this.add.text(205, 192, '🌀 WIND', { fontFamily: 'monospace', fontSize: '10px', color: '#06B6D4', fontStyle: 'bold' });
    this.windText = this.add.text(205, 206, '0 kW', { fontFamily: 'monospace', fontSize: '9px', color: '#94A3B8' });

    // Battery Bank
    this.add.rectangle(230, 280, 70, 46, 0x0F172A).setStrokeStyle(2, 0x10B981);
    this.add.text(205, 272, '🔋 BATTERY', { fontFamily: 'monospace', fontSize: '10px', color: '#10B981', fontStyle: 'bold' });
    this.batteryText = this.add.text(205, 286, '50%', { fontFamily: 'monospace', fontSize: '9px', color: '#94A3B8' });

    // Draw main grid trunk lines
    graphics.lineBetween(265, 120, 310, 120);
    graphics.lineBetween(265, 200, 310, 200);
    graphics.lineBetween(265, 280, 310, 280);
    graphics.lineBetween(310, 120, 310, 280); // vertical collector
    
    // Grid bus line to consumer side
    graphics.lineBetween(310, 200, 380, 200);

    // Draw consumer nodes (Right Side)
    // Hospital
    this.add.rectangle(520, 120, 90, 46, 0x0F172A).setStrokeStyle(2, 0xEF4444);
    this.add.text(485, 110, '🏥 HOSPITAL', { fontFamily: 'monospace', fontSize: '10px', color: '#EF4444', fontStyle: 'bold' });
    this.add.text(485, 124, `LOAD: ${this.criticalDemand}kW`, { fontFamily: 'monospace', fontSize: '9px', color: '#94A3B8' });
    this.hospitalSwitch = this.add.rectangle(440, 120, 20, 20, 0x10B981).setStrokeStyle(1.5, 0xFFFFFF).setInteractive();
    
    // Houses
    this.add.rectangle(520, 200, 90, 46, 0x0F172A).setStrokeStyle(2, 0x3B82F6);
    this.add.text(485, 190, '🏠 HOUSES', { fontFamily: 'monospace', fontSize: '10px', color: '#3B82F6', fontStyle: 'bold' });
    this.add.text(485, 204, 'LOAD: Var', { fontFamily: 'monospace', fontSize: '9px', color: '#94A3B8' });
    this.housesSwitch = this.add.rectangle(440, 200, 20, 20, 0x10B981).setStrokeStyle(1.5, 0xFFFFFF).setInteractive();

    // Water Pump
    this.add.rectangle(520, 280, 90, 46, 0x0F172A).setStrokeStyle(2, 0x84CC16);
    this.add.text(485, 270, '⛲ PUMP', { fontFamily: 'monospace', fontSize: '10px', color: '#84CC16', fontStyle: 'bold' });
    this.add.text(485, 284, 'LOAD: 30kW', { fontFamily: 'monospace', fontSize: '9px', color: '#94A3B8' });
    this.pumpSwitch = this.add.rectangle(440, 280, 20, 20, 0xEF4444).setStrokeStyle(1.5, 0xFFFFFF).setInteractive();

    // Consumer feeders
    graphics.lineBetween(380, 200, 410, 200);
    graphics.lineBetween(410, 120, 410, 280);
    graphics.lineBetween(410, 120, 430, 120);
    graphics.lineBetween(410, 200, 430, 200);
    graphics.lineBetween(410, 280, 430, 280);

    graphics.lineBetween(450, 120, 475, 120);
    graphics.lineBetween(450, 200, 475, 200);
    graphics.lineBetween(450, 280, 475, 280);

    this.add.existing(graphics);

    // Interactive switches (turn nodes ON/OFF)
    this.hospitalSwitch.on('pointerdown', () => {
      this.powerHospital = !this.powerHospital;
      this.hospitalSwitch.setFillStyle(this.powerHospital ? 0x10B981 : 0xEF4444);
    });

    this.housesSwitch.on('pointerdown', () => {
      this.powerHouses = !this.powerHouses;
      this.housesSwitch.setFillStyle(this.powerHouses ? 0x10B981 : 0xEF4444);
    });

    this.pumpSwitch.on('pointerdown', () => {
      this.powerWaterPump = !this.powerWaterPump;
      this.pumpSwitch.setFillStyle(this.powerWaterPump ? 0x10B981 : 0xEF4444);
    });
  }

  private setupHUD() {
    // HUD Dashboard overlay for metrics
    // Battery Status Bar at bottom
    this.add.text(180, 345, 'BATTERY SoC:', { fontFamily: 'monospace', fontSize: '11px', color: '#94A3B8' });
    this.add.rectangle(380, 350, 260, 16, 0x0F172A).setStrokeStyle(1, 0x475569);
    this.batteryBar = this.add.rectangle(251, 350, 0, 14, 0x10B981); // updates width

    // Time cycle indicator
    this.timeText = this.add.text(480, 50, 'Cycle: 0 / 24h', {
      fontFamily: 'monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#FFFFFF'
    });

    // Realtime load vs gen text
    this.demandText = this.add.text(180, 380, 'Total Generation: 0 kW | Grid Demand: 0 kW', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#3B82F6'
    });
  }

  private createActionButtons() {
    // START SIMULATION
    const startBg = this.add.rectangle(510, 430, 100, 36, 0x0a0a0a).setStrokeStyle(1, 0x33ff00).setInteractive();
    const startTxt = this.add.text(510, 430, '[ START ⚡ ]', {
      fontFamily: 'monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#33ff00'
    }).setOrigin(0.5);

    startBg.on('pointerdown', () => {
      if (this.isTesting) return;
      this.isTesting = true;
      this.feedbackText.setText('Simulation running. Watch the solar drops and battery levels!').setColor('#ffb000');
    });
    startBg.on('pointerover', () => {
      startBg.setFillStyle(0x33ff00);
      startTxt.setColor('#000000');
    });
    startBg.on('pointerout', () => {
      startBg.setFillStyle(0x0a0a0a);
      startTxt.setColor('#33ff00');
    });

    // RESTART
    const clearBg = this.add.rectangle(190, 430, 80, 36, 0x0a0a0a).setStrokeStyle(1, 0xffb000).setInteractive();
    const clearTxt = this.add.text(190, 430, '[ RESET 🔄 ]', {
      fontFamily: 'monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ffb000'
    }).setOrigin(0.5);

    clearBg.on('pointerdown', () => {
      this.scene.restart({ level: this.activeLevel, config: this.activeConfig });
    });
    clearBg.on('pointerover', () => {
      clearBg.setFillStyle(0xffb000);
      clearTxt.setColor('#000000');
    });
    clearBg.on('pointerout', () => {
      clearBg.setFillStyle(0x0a0a0a);
      clearTxt.setColor('#ffb000');
    });
  }

  update(time: number, delta: number) {
    if (!this.isTesting) return;

    // Advance time (60 seconds simulation corresponds to 24h day-night cycle)
    this.timeElapsed += delta / 1000;
    
    // Cap at duration
    const currentHour = Math.min(24, (this.timeElapsed / this.duration) * 24);
    this.timeText.setText(`Cycle: ${currentHour.toFixed(1)}h / 24h`);

    // A. Solar Curve: Peaks at 12h (midday), zero during 0-6h and 18-24h
    let solarGen = 0;
    if (currentHour >= 6 && currentHour <= 18) {
      // sine curve peak
      const rad = ((currentHour - 6) / 12) * Math.PI;
      solarGen = Math.round(Math.sin(rad) * this.solarPeak);
    }
    this.solarText.setText(`${solarGen} kW`);

    // B. Wind Generation: Random walk fluctuation
    const windGen = Math.round(this.windBase + Math.sin(time / 2000) * 10);
    this.windText.setText(`${windGen} kW`);

    // C. Demand Curve: Residential peaks in evening (17-22h)
    let currentHouseLoad = this.houseDemand;
    if (currentHour >= 17 && currentHour <= 22) {
      currentHouseLoad = Math.round(this.houseDemand * 1.5);
    } else if (currentHour >= 0 && currentHour <= 5) {
      currentHouseLoad = Math.round(this.houseDemand * 0.5);
    }

    // Sum active consumers
    let totalDemand = 0;
    if (this.powerHospital) totalDemand += this.criticalDemand;
    if (this.powerHouses) totalDemand += currentHouseLoad;
    if (this.powerWaterPump) totalDemand += 30; // Pump load is fixed 30 kW

    const totalGreenGen = solarGen + windGen;
    const balance = totalGreenGen - totalDemand;

    // D. Battery balancing logic
    if (balance >= 0) {
      // Charge battery
      this.batteryCharge = Math.min(this.batteryCapacity, this.batteryCharge + (balance * (delta / 1000) * 0.1));
    } else {
      // Discharge battery to supply deficit
      this.batteryCharge = Math.max(0, this.batteryCharge + (balance * (delta / 1000) * 0.1));
    }

    const pct = Math.round((this.batteryCharge / this.batteryCapacity) * 100);
    this.batteryText.setText(`${pct}%`);
    
    // Update battery bar
    this.batteryBar.width = (this.batteryCharge / this.batteryCapacity) * 258;
    this.batteryBar.x = 251 + this.batteryBar.width / 2;
    
    if (pct < 25) {
      this.batteryBar.setFillStyle(0xEF4444); // low charge red
    } else {
      this.batteryBar.setFillStyle(0x10B981); // good charge green
    }

    // E. Grid safety conditions
    // 1. Hospital loses power! If Hospital switch is open, or total supply cannot cover active load and battery is dead
    const batteryIsDead = this.batteryCharge <= 0.01;
    const isDeficit = balance < 0;
    
    if (!this.powerHospital) {
      this.handleFailure('Grid failure: Hospital critical switch was turned OFF! Lives are at stake.');
      return;
    }

    if (batteryIsDead && isDeficit) {
      // Grid blackouts!
      // If we could have saved power by turning off the water pump, then it's a structural fail
      if (this.powerWaterPump) {
        this.handleFailure('Grid blackout: Hospital power collapsed! You should have shed non-essential loads (Water Pump).');
      } else {
        this.handleFailure('Grid blackout: Total power depleted. Increase battery storage or solar peaks next time!');
      }
      return;
    }

    this.demandText.setText(`Total Gen: ${totalGreenGen} kW | Grid Load: ${totalDemand} kW`);

    // Success condition: survived the entire cycle
    if (this.timeElapsed >= this.duration) {
      this.handleSuccess();
    }
  }

  private handleFailure(msg: string) {
    this.isTesting = false;
    this.feedbackText.setText(`Failure: ${msg}`).setColor('#EF4444');
    this.events.emit('level-failure', { message: msg });
  }

  private handleSuccess() {
    this.isTesting = false;
    
    // Score is higher if battery has remaining charge
    const pct = Math.round((this.batteryCharge / this.batteryCapacity) * 100);
    const score = 70 + Math.round(pct * 0.3);

    this.feedbackText.setText(`SUCCESS! Grid balanced successfully. Score: ${score}`).setColor('#10B981');
    
    this.time.delayedCall(1500, () => {
      this.events.emit('level-success', { score, timeTaken: this.duration });
    });
  }
}
