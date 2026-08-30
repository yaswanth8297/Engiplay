import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'engiplay_secret_key_2026';

// Middleware to verify JWT token
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Failed to authenticate token' });
    }
    req.user = user;
    next();
  });
}

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, grade, language } = req.body;
    
    if (!name || !email || !password || !grade) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await createUser({
      name,
      email,
      password: hashedPassword,
      grade,
      language: language || 'en'
    });
    
    // Create JWT Token
    const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        grade: user.grade,
        language: user.language
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    
    // Check password (only if not a guest or direct check)
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    
    const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        grade: user.grade,
        language: user.language
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// GUEST MODE
router.post('/guest', (req, res) => {
  try {
    const guestId = 'guest_' + Math.random().toString(36).substr(2, 9);
    const guestUser = {
      id: guestId,
      name: 'Guest Explorer',
      email: `${guestId}@engiplay.local`,
      grade: '8',
      language: 'en',
      isGuest: true
    };
    
    const token = jwt.sign(guestUser, JWT_SECRET, { expiresIn: '1d' });
    
    res.json({
      token,
      user: guestUser
    });
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({ error: 'Failed to create guest session' });
  }
});

export default router;
