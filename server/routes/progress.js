import express from 'express';
import { authenticateToken } from './auth.js';
import { saveProgress, getProgress, getAllProgressForClass, getAllUsersForClass } from '../db.js';

const router = express.Router();

// SAVE PROGRESS
router.post('/save', authenticateToken, async (req, res) => {
  try {
    const { gameId, level, score, attempts, timeTaken, hintsUsed, skillTags } = req.body;
    const userId = req.user.id;
    
    if (!gameId || level === undefined || score === undefined || attempts === undefined) {
      return res.status(400).json({ error: 'Missing progress fields' });
    }
    
    const progress = await saveProgress({
      userId,
      gameId,
      level: Number(level),
      score: Number(score),
      attempts: Number(attempts),
      timeTaken: Number(timeTaken || 0),
      hintsUsed: Number(hintsUsed || 0),
      skillTags: skillTags || []
    });
    
    res.json({ message: 'Progress saved successfully', progress });
  } catch (error) {
    console.error('Save progress error:', error);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// GET PROGRESS
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const progressList = await getProgress(userId);
    res.json(progressList);
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to retrieve progress' });
  }
});

// GET CLASSROOM DATA (For Teacher Dashboard)
router.get('/classroom', authenticateToken, async (req, res) => {
  try {
    const students = await getAllUsersForClass();
    const allProgress = await getAllProgressForClass();
    
    // Group progress by user
    const classroomStats = students.map(student => {
      const studentProgress = allProgress.filter(p => p.userId === student._id.toString() || p.userId === student._id);
      
      const gamesCompleted = {};
      studentProgress.forEach(p => {
        if (!gamesCompleted[p.gameId] || gamesCompleted[p.gameId] < p.level) {
          gamesCompleted[p.gameId] = p.level;
        }
      });
      
      return {
        id: student._id,
        name: student.name,
        grade: student.grade,
        progress: studentProgress,
        gamesCompleted
      };
    });
    
    // Weak-topic heatmap calculations
    // Group failure rates or low scores by game domain
    const domains = {
      'circuit-builder': 'Electrical',
      'bridge-builder': 'Civil/Structural',
      'gear-pulley': 'Mechanical',
      'logic-maze': 'Algorithms/CS',
      'energy-balancer': 'Power Systems',
      'fluid-flow': 'Fluid Dynamics'
    };
    
    const heatmap = Object.keys(domains).map(gameId => {
      const gameProg = allProgress.filter(p => p.gameId === gameId);
      const totalAttempts = gameProg.reduce((sum, p) => sum + p.attempts, 0);
      const totalLevels = gameProg.length;
      
      // Calculate stress/difficulty index: high attempts per level and hints used indicates a weak topic
      const averageAttempts = totalLevels > 0 ? (totalAttempts / totalLevels) : 1;
      const totalHints = gameProg.reduce((sum, p) => sum + p.hintsUsed, 0);
      const averageHints = totalLevels > 0 ? (totalHints / totalLevels) : 0;
      
      // Heat score between 0 and 100
      // 1 attempt is base, each extra attempt adds 20 points, each hint adds 15 points, capped at 100.
      const heatScore = Math.min(100, Math.round(((averageAttempts - 1) * 25) + (averageHints * 20)));
      
      return {
        gameId,
        domain: domains[gameId],
        averageAttempts: Number(averageAttempts.toFixed(1)),
        averageHints: Number(averageHints.toFixed(1)),
        heatScore: isNaN(heatScore) ? 0 : heatScore,
        totalLevelsCompleted: totalLevels
      };
    });
    
    res.json({
      students: classroomStats,
      heatmap
    });
  } catch (error) {
    console.error('Get classroom stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve classroom statistics' });
  }
});

export default router;
