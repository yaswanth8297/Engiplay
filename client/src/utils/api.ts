import localforage from 'localforage';

const API_BASE = 'http://localhost:5000/api';

// Configure LocalForage for offline progress queues
const progressOfflineStore = localforage.createInstance({
  name: 'engiplay',
  storeName: 'offlineProgressQueue'
});

export interface ProgressPayload {
  gameId: string;
  level: number;
  score: number;
  attempts: number;
  timeTaken: number;
  hintsUsed: number;
  skillTags: string[];
}

// Check network status
export function isOnline(): boolean {
  return navigator.onLine;
}

// Token operations
export function setToken(token: string) {
  localStorage.setItem('engiplay_jwt', token);
}

export function getToken(): string | null {
  return localStorage.getItem('engiplay_jwt');
}

export function clearToken() {
  localStorage.removeItem('engiplay_jwt');
}

export function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return token ? {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  } : {
    'Content-Type': 'application/json'
  };
}

// AUTH API CALLS
export async function registerUser(payload: any) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Registration failed');
  }
  return await response.json();
}

export async function loginUser(payload: any) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Login failed');
  }
  return await response.json();
}

export async function guestLogin() {
  try {
    const response = await fetch(`${API_BASE}/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      throw new Error('Guest login failed');
    }
    return await response.json();
  } catch (err) {
    console.warn('Backend server offline. Creating local Guest session...', err);
    return {
      token: 'guest_local_token_' + Date.now(),
      user: {
        id: 'guest_student_' + Math.floor(Math.random() * 10000),
        name: 'Guest Explorer',
        email: 'guest@engiplay.local',
        grade: '9',
        language: 'en',
        isGuest: true
      }
    };
  }
}

// PROGRESS API CALLS
export async function fetchProgress(): Promise<any[]> {
  try {
    if (!isOnline()) {
      // Return cached local progress if offline
      const localProgress: any[] = [];
      await progressOfflineStore.iterate((value: any) => {
        localProgress.push(value);
      });
      return localProgress;
    }
    
    const response = await fetch(`${API_BASE}/progress`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch progress');
    }
    return await response.json();
  } catch (err) {
    console.warn('Backend server connection refused or offline. Returning local cached progress:', err);
    const localProgress: any[] = [];
    await progressOfflineStore.iterate((value: any) => {
      localProgress.push(value);
    });
    return localProgress;
  }
}

// SAVE PROGRESS (WITH OFFLINE SYNC FALLBACK)
export async function saveProgressApi(payload: ProgressPayload): Promise<any> {
  const recordId = `${payload.gameId}_L${payload.level}`;
  
  if (!isOnline()) {
    console.log('Offline: Queueing progress in IndexedDB...', payload);
    await progressOfflineStore.setItem(recordId, {
      ...payload,
      isQueued: true,
      timestamp: Date.now()
    });
    return { status: 'offline', message: 'Cached locally. Will sync when online.' };
  }
  
  try {
    const response = await fetch(`${API_BASE}/progress/save`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error('Server returned error status');
    }
    
    return await response.json();
  } catch (error) {
    console.warn('Sync failed. Queueing progress locally...', error);
    await progressOfflineStore.setItem(recordId, {
      ...payload,
      isQueued: true,
      timestamp: Date.now()
    });
    return { status: 'offline_fallback', message: 'Saved offline due to error.' };
  }
}

// GET CLASSROOM DATA (Teachers)
export async function fetchClassroomStats(): Promise<any> {
  const response = await fetch(`${API_BASE}/progress/classroom`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    throw new Error('Failed to retrieve classroom stats');
  }
  return await response.json();
}

// GET AI SOCRATIC HINT
export async function getSocraticHint(payload: {
  gameId: string;
  level: number;
  attempts: number;
  timeTaken: number;
  lastAttempt: string;
  currentContext: string;
}): Promise<string> {
  try {
    const response = await fetch(`${API_BASE}/hint`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error('Hint bot error');
    }
    const data = await response.json();
    return data.hint;
  } catch (error) {
    console.error('Hint bot request failed:', error);
    return 'Look at the system layout closely. Try testing your layout to observe which components behave unexpectedly. Can you isolate the issue?';
  }
}

// SYNC OFFLINE PROGRESS QUEUE TO BACKEND
export async function syncOfflineProgress() {
  if (!isOnline()) return;
  
  const keys = await progressOfflineStore.keys();
  if (keys.length === 0) return;
  
  console.log(`Syncing ${keys.length} queued progress records to database...`);
  
  for (const key of keys) {
    const payload = await progressOfflineStore.getItem<ProgressPayload & { isQueued: boolean }>(key);
    if (payload && payload.isQueued) {
      try {
        const response = await fetch(`${API_BASE}/progress/save`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            gameId: payload.gameId,
            level: payload.level,
            score: payload.score,
            attempts: payload.attempts,
            timeTaken: payload.timeTaken,
            hintsUsed: payload.hintsUsed,
            skillTags: payload.skillTags
          })
        });
        
        if (response.ok) {
          // Success! Remove from offline queue
          await progressOfflineStore.removeItem(key);
        }
      } catch (err) {
        console.error(`Failed to sync queued record ${key}. Retrying later.`, err);
        break; // Stop syncing if connection is lost again
      }
    }
  }
}

// Register browser online event
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Network online. Triggering synchronization...');
    syncOfflineProgress().catch(console.error);
  });
}
