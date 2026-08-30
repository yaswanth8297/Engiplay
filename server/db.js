import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const JSON_DB_PATH = path.join(DATA_DIR, 'db.json');

// MongoDB Models
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  grade: { type: String, required: true },
  language: { type: String, default: 'en' },
  createdAt: { type: Date, default: Date.now }
});

const GameProgressSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  gameId: { type: String, required: true },
  level: { type: Number, required: true },
  score: { type: Number, required: true },
  attempts: { type: Number, required: true },
  timeTaken: { type: Number, default: 0 },
  hintsUsed: { type: Number, default: 0 },
  skillTags: [{ type: String }],
  updatedAt: { type: Date, default: Date.now }
});

let UserModel;
let GameProgressModel;
let isMongo = false;
let localDbCache = { users: [], gameProgress: [] };

// Helper to load Local JSON DB
function loadLocalDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(JSON_DB_PATH)) {
      fs.writeFileSync(JSON_DB_PATH, JSON.stringify(localDbCache, null, 2));
    } else {
      const data = fs.readFileSync(JSON_DB_PATH, 'utf8');
      localDbCache = JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading JSON DB fallback:', err);
  }
}

// Helper to save Local JSON DB
function saveLocalDb() {
  try {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(localDbCache, null, 2));
  } catch (err) {
    console.error('Error saving JSON DB fallback:', err);
  }
}

export async function initDb() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/engiplay';
  console.log(`Connecting to database... Target: ${mongoUri}`);
  
  try {
    // 2-second timeout for MongoDB connection check
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log('MongoDB successfully connected.');
    isMongo = true;
    UserModel = mongoose.model('User', UserSchema);
    GameProgressModel = mongoose.model('GameProgress', GameProgressSchema);
  } catch (error) {
    console.warn('MongoDB connection failed. Falling back to local JSON database.');
    isMongo = false;
    loadLocalDb();
  }
}

// Unified Database API
export async function createUser(userData) {
  if (isMongo) {
    const user = new UserModel(userData);
    return await user.save();
  } else {
    const existing = localDbCache.users.find(u => u.email === userData.email);
    if (existing) {
      throw new Error('User already exists');
    }
    const newId = '_' + Math.random().toString(36).substr(2, 9);
    const newUser = { _id: newId, ...userData, createdAt: new Date() };
    localDbCache.users.push(newUser);
    saveLocalDb();
    return newUser;
  }
}

export async function findUserByEmail(email) {
  if (isMongo) {
    return await UserModel.findOne({ email });
  } else {
    return localDbCache.users.find(u => u.email === email) || null;
  }
}

export async function findUserById(id) {
  if (isMongo) {
    return await UserModel.findById(id);
  } else {
    return localDbCache.users.find(u => u._id === id) || null;
  }
}

export async function saveProgress(progressData) {
  const { userId, gameId, level, score, attempts, timeTaken, hintsUsed, skillTags } = progressData;
  if (isMongo) {
    const query = { userId, gameId, level };
    const update = {
      score,
      attempts,
      timeTaken,
      hintsUsed,
      skillTags,
      updatedAt: Date.now()
    };
    return await GameProgressModel.findOneAndUpdate(query, update, { upsert: true, new: true });
  } else {
    let item = localDbCache.gameProgress.find(
      p => p.userId === userId && p.gameId === gameId && p.level === level
    );
    if (item) {
      item.score = score;
      item.attempts = attempts;
      item.timeTaken = timeTaken;
      item.hintsUsed = hintsUsed;
      item.skillTags = skillTags;
      item.updatedAt = new Date();
    } else {
      const newId = '_' + Math.random().toString(36).substr(2, 9);
      item = {
        _id: newId,
        userId,
        gameId,
        level,
        score,
        attempts,
        timeTaken,
        hintsUsed,
        skillTags,
        updatedAt: new Date()
      };
      localDbCache.gameProgress.push(item);
    }
    saveLocalDb();
    return item;
  }
}

export async function getProgress(userId) {
  if (isMongo) {
    return await GameProgressModel.find({ userId });
  } else {
    return localDbCache.gameProgress.filter(p => p.userId === userId);
  }
}

export async function getAllProgressForClass() {
  if (isMongo) {
    return await GameProgressModel.find({});
  } else {
    return localDbCache.gameProgress;
  }
}

export async function getAllUsersForClass() {
  if (isMongo) {
    return await UserModel.find({}, 'name grade email');
  } else {
    return localDbCache.users.map(u => ({ _id: u._id, name: u.name, grade: u.grade, email: u.email }));
  }
}

export function isUsingLocalDb() {
  return !isMongo;
}
