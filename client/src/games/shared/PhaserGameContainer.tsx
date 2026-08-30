import * as React from 'react';
import { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';

interface PhaserGameContainerProps {
  gameId: string;
  level: number;
  config: any;
  onSuccess: (score: number, timeTaken: number) => void;
  onFailure: (errorMessage: string) => void;
  sceneClass: any; // The Phaser.Scene class reference
}

export const PhaserGameContainer: React.FC<PhaserGameContainerProps> = ({
  gameId,
  level,
  config,
  onSuccess,
  onFailure,
  sceneClass
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Standard Phaser Config
    const phaserConfig: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 700,
      height: 480,
      parent: containerRef.current,
      backgroundColor: '#0F172A', // Deep background inside the canvas
      physics: {
        default: gameId === 'bridge-builder' ? 'matter' : 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        },
        matter: {
          gravity: { x: 0, y: 1.2 },
          debug: false
        }
      },
      scene: [sceneClass]
    };

    // Instantiate game
    const game = new Phaser.Game(phaserConfig);
    gameRef.current = game;

    // Wait until the scene is loaded to pass parameters
    const onSceneCreated = () => {
      const activeScene = game.scene.getScene('MainScene');
      if (activeScene) {
        // Wire up custom communication callbacks
        activeScene.events.off('level-success');
        activeScene.events.off('level-failure');
        
        activeScene.events.on('level-success', (data: { score: number; timeTaken: number }) => {
          onSuccess(data.score, data.timeTaken);
        });
        
        activeScene.events.on('level-failure', (data: { message: string }) => {
          onFailure(data.message);
        });

        // Launch level in scene
        activeScene.scene.restart({ level, config });
      }
    };

    // Listen to scene creation
    game.events.once('ready', () => {
      // Small timeout to guarantee scene boot
      setTimeout(onSceneCreated, 150);
    });

    // Cleanup
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [gameId, level, config, sceneClass]);

  return (
    <div className="w-full flex items-center justify-center p-2 rounded-2xl bg-dark-bg border border-dark-border shadow-inner">
      <div 
        ref={containerRef} 
        id={`phaser-game-${gameId}`} 
        className="rounded-xl overflow-hidden border border-slate-700/80 shadow-2xl"
        style={{ width: '700px', height: '480px' }}
      />
    </div>
  );
};
export default PhaserGameContainer;
