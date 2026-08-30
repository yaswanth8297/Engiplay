import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, isUsingLocalDb } from './db.js';

// Routes
import authRoutes from './routes/auth.js';
import progressRoutes from './routes/progress.js';
import hintRoutes from './routes/hint.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/hint', hintRoutes);

// Database Health Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    database: isUsingLocalDb() ? 'JSON Local DB Fallback' : 'MongoDB Connected',
    time: new Date()
  });
});

// Serve frontend in production mode
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

app.get('*', (req, res, next) => {
  // If request is API, pass through
  if (req.url.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

// Start Server after Database Initialization
async function startServer() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`EngiPlay Backend running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Socratic AI: Fallback Enabled (if OpenAI key missing)`);
    console.log(`====================================================`);
  });
}

startServer();
