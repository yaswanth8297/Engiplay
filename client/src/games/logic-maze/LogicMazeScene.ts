import * as Phaser from 'phaser';

interface MazeLevel {
  maze: number[][]; // 0 = empty path, 1 = wall, 2 = start, 3 = exit
  startX: number;
  startY: number;
  exitX: number;
  exitY: number;
}

export class LogicMazeScene extends Phaser.Scene {
  private activeLevel = 1;
  private activeConfig: any = {};
  
  // Mazes 6x6 grid
  private mazes: Record<number, MazeLevel> = {
    1: {
      maze: [
        [1, 1, 1, 1, 1, 1],
        [1, 3, 0, 0, 1, 1],
        [1, 1, 1, 0, 1, 1],
        [1, 1, 0, 0, 1, 1],
        [1, 2, 0, 1, 1, 1],
        [1, 1, 1, 1, 1, 1]
      ],
      startX: 1,
      startY: 4,
      exitX: 1,
      exitY: 1
    },
    2: {
      maze: [
        [1, 1, 1, 1, 1, 1],
        [1, 2, 0, 0, 0, 1],
        [1, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 1],
        [1, 3, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1]
      ],
      startX: 1,
      startY: 1,
      exitX: 1,
      exitY: 4
    },
    3: {
      maze: [
        [1, 1, 1, 1, 1, 1],
        [1, 2, 0, 1, 3, 1],
        [1, 1, 0, 1, 0, 1],
        [1, 1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1]
      ],
      startX: 1,
      startY: 1,
      exitX: 4,
      exitY: 1
    }
  };

  private currentMaze!: MazeLevel;
  private botGridX = 0;
  private botGridY = 0;
  private botDir: 'north' | 'east' | 'south' | 'west' = 'east';
  
  private botSprite!: Phaser.GameObjects.Container;
  private cellSize = 60;
  private offsetX = 170;
  private offsetY = 80;
  private isExecuting = false;
  
  private feedbackText!: Phaser.GameObjects.Text;
  
  constructor() {
    super('MainScene');
  }

  init(data: { level: number; config: any }) {
    this.activeLevel = data.level || 1;
    this.activeConfig = data.config || {};
    this.currentMaze = this.mazes[this.activeLevel] || this.mazes[1];
    
    this.botGridX = this.currentMaze.startX;
    this.botGridY = this.currentMaze.startY;
    this.botDir = 'east';
    this.isExecuting = false;
  }

  create() {
    // Newsprint Paper Background Card
    this.add.rectangle(350, 240, 680, 460, 0xF9F9F7).setStrokeStyle(2, 0x111111);

    this.feedbackText = this.add.text(350, 435, 'Write your sequence stack on the right panel and click EXECUTE', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#111111'
    }).setOrigin(0.5);

    // Render Grid Maze
    this.drawMaze();

    // Render Robot Bot
    this.spawnBot();

    // Register receiver event for block execution
    this.events.off('run-code');
    this.events.on('run-code', (commands: string[]) => {
      this.executeProgram(commands);
    });
  }

  private drawMaze() {
    const grid = this.currentMaze.maze;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const val = grid[r][c];
        const px = this.offsetX + c * this.cellSize + this.cellSize / 2;
        const py = this.offsetY + r * this.cellSize + this.cellSize / 2;

        if (val === 1) {
          // Wall
          this.add.rectangle(px, py, this.cellSize - 2, this.cellSize - 2, 0x334155)
            .setStrokeStyle(1, 0x475569);
        } else {
          // Path
          this.add.rectangle(px, py, this.cellSize - 2, this.cellSize - 2, 0x0F172A)
            .setStrokeStyle(1, 0x1E293B);
          
          if (val === 3) {
            // Gold Exit Chest Target
            const chest = this.add.circle(px, py, 14, 0xF59E0B)
              .setStrokeStyle(2, 0xFFFFFF);
            
            // Add pulse effect
            this.tweens.add({
              targets: chest,
              scale: 1.2,
              duration: 800,
              yoyo: true,
              repeat: -1
            });
          }
        }
      }
    }
  }

  private spawnBot() {
    const px = this.offsetX + this.botGridX * this.cellSize + this.cellSize / 2;
    const py = this.offsetY + this.botGridY * this.cellSize + this.cellSize / 2;

    this.botSprite = this.add.container(px, py).setDepth(10);

    // Procedural robot drawing
    const body = this.add.rectangle(0, 0, 28, 28, 0x10B981).setStrokeStyle(1.5, 0xFFFFFF);
    const eyes = this.add.circle(6, -6, 3, 0xFFFFFF);
    const antenna = this.add.line(0, -14, 0, -14, 0, -22, 0xFFFFFF, 1).setLineWidth(2);
    const tip = this.add.circle(0, -22, 3, 0xEF4444);

    this.botSprite.add([body, eyes, antenna, tip]);
    this.updateBotRotation();
  }

  private updateBotRotation() {
    // Face the container depending on bot direction
    const rot = {
      north: -90,
      east: 0,
      south: 90,
      west: 180
    };
    this.botSprite.setAngle(rot[this.botDir]);
  }

  private executeProgram(commands: string[]) {
    if (this.isExecuting) return;
    this.isExecuting = true;
    this.feedbackText.setText('Running code program...').setColor('#F59E0B');

    // Reset bot back to starting location
    this.botGridX = this.currentMaze.startX;
    this.botGridY = this.currentMaze.startY;
    this.botDir = 'east';
    
    const px = this.offsetX + this.botGridX * this.cellSize + this.cellSize / 2;
    const py = this.offsetY + this.botGridY * this.cellSize + this.cellSize / 2;
    this.botSprite.setPosition(px, py);
    this.updateBotRotation();

    // Translate blocks to list of simple steps (resolving loops & conditionals)
    const flatCommands = this.flattenProgram(commands);
    
    if (flatCommands.length === 0) {
      this.feedbackText.setText('Command queue is empty! Drag program blocks first.').setColor('#EF4444');
      this.isExecuting = false;
      return;
    }

    this.runStep(flatCommands, 0);
  }

  private flattenProgram(commands: string[]): string[] {
    const list: string[] = [];
    
    commands.forEach(cmd => {
      if (cmd.startsWith('loop-')) {
        // loop-3-forward
        const parts = cmd.split('-');
        const count = Number(parts[1]) || 2;
        const sub = parts.slice(2).join('-'); // forward or left or right
        
        for (let i = 0; i < count; i++) {
          list.push(sub);
        }
      } else {
        list.push(cmd);
      }
    });

    return list;
  }

  private runStep(commands: string[], index: number) {
    if (index >= commands.length) {
      // Finished all commands. Check if we are at exit
      this.time.delayedCall(400, () => {
        if (this.botGridX === this.currentMaze.exitX && this.botGridY === this.currentMaze.exitY) {
          this.feedbackText.setText('SUCCESS! Code-a-bot reached the exit chest.').setColor('#10B981');
          this.events.emit('level-success', { score: 100, timeTaken: 20 });
        } else {
          const failMsg = 'Program terminated: Bot stopped but didn\'t reach the exit.';
          this.feedbackText.setText(failMsg).setColor('#EF4444');
          this.events.emit('level-failure', { message: failMsg });
          this.isExecuting = false;
        }
      });
      return;
    }

    const cmd = commands[index];
    let nextX = this.botGridX;
    let nextY = this.botGridY;

    if (cmd === 'forward') {
      if (this.botDir === 'north') nextY -= 1;
      else if (this.botDir === 'east') nextX += 1;
      else if (this.botDir === 'south') nextY += 1;
      else if (this.botDir === 'west') nextX -= 1;

      // Check collision
      const maze = this.currentMaze.maze;
      if (nextY < 0 || nextY >= maze.length || nextX < 0 || nextX >= maze[0].length || maze[nextY][nextX] === 1) {
        // Collided!
        this.feedbackText.setText('CRASH! Robot hit a wall obstacle.').setColor('#EF4444');
        
        // Crash tween
        this.tweens.add({
          targets: this.botSprite,
          x: '+=6',
          yoyo: true,
          repeat: 5,
          duration: 40,
          onComplete: () => {
            this.events.emit('level-failure', { message: 'Robot collided with a wall block.' });
            this.isExecuting = false;
          }
        });
        return;
      }

      this.botGridX = nextX;
      this.botGridY = nextY;

      // Move bot animated
      const px = this.offsetX + this.botGridX * this.cellSize + this.cellSize / 2;
      const py = this.offsetY + this.botGridY * this.cellSize + this.cellSize / 2;

      this.tweens.add({
        targets: this.botSprite,
        x: px,
        y: py,
        duration: 400,
        onComplete: () => this.runStep(commands, index + 1)
      });
    } 
    else if (cmd === 'left') {
      const dirs: ('north' | 'west' | 'south' | 'east')[] = ['north', 'west', 'south', 'east'];
      const curIdx = dirs.indexOf(this.botDir);
      this.botDir = dirs[(curIdx + 1) % 4];
      this.updateBotRotation();
      
      this.time.delayedCall(300, () => this.runStep(commands, index + 1));
    } 
    else if (cmd === 'right') {
      const dirs: ('north' | 'east' | 'south' | 'west')[] = ['north', 'east', 'south', 'west'];
      const curIdx = dirs.indexOf(this.botDir);
      this.botDir = dirs[(curIdx + 1) % 4];
      this.updateBotRotation();

      this.time.delayedCall(300, () => this.runStep(commands, index + 1));
    }
  }
}
