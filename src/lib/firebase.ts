import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence verbose internal Firestore retry/backoff logs in browser console
try {
  setLogLevel('silent');
} catch {}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Connect to the specific Cloud Firestore database configured for this project with robust offline & long-polling support
const databaseId = firebaseConfig.firestoreDatabaseId || undefined;

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      localCache: typeof window !== 'undefined'
        ? persistentLocalCache({ tabManager: persistentMultipleTabManager() })
        : memoryLocalCache(),
      experimentalAutoDetectLongPolling: true,
      ignoreUndefinedProperties: true,
    },
    databaseId
  );
} catch {
  // If already initialized, retrieve existing instance
  firestoreInstance = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
}

export const db = firestoreInstance;

// ============================================================================
// FIRESTORE QUOTA & CIRCUIT BREAKER MANAGEMENT
// ============================================================================
const STORAGE_KEY_QUOTA_EXCEEDED = 'firestore_daily_quota_exceeded_until';
const QUOTA_BLOCK_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours block before trying remote write again

export const isFirestoreQuotaExceeded = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_QUOTA_EXCEEDED);
    if (saved) {
      const until = Number(saved);
      if (Date.now() < until) {
        return true;
      } else {
        localStorage.removeItem(STORAGE_KEY_QUOTA_EXCEEDED);
      }
    }
  } catch {}
  return false;
};

export const markFirestoreQuotaExceeded = (err?: any): void => {
  if (typeof window === 'undefined') return;
  try {
    const blockUntil = Date.now() + QUOTA_BLOCK_DURATION_MS;
    localStorage.setItem(STORAGE_KEY_QUOTA_EXCEEDED, String(blockUntil));
  } catch {}
};

export const checkAndHandleFirestoreError = (err: any): boolean => {
  if (!err) return false;
  const errMsg = err?.message || String(err);
  const errCode = err?.code || '';
  if (
    errCode === 'resource-exhausted' ||
    errMsg.includes('Quota limit exceeded') ||
    errMsg.includes('Quota exceeded') ||
    errMsg.includes('Free daily write units') ||
    errMsg.includes('resource-exhausted')
  ) {
    markFirestoreQuotaExceeded(err);
    return true;
  }
  return false;
};

export const getFirestoreUpgradeUrl = (): string => {
  const proj = firebaseConfig.projectId || 'gen-lang-client-0590798734';
  const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
  return `https://console.firebase.google.com/project/${proj}/firestore/databases/${dbId}/data?openUpgradeDialog=true`;
};

// Check on initial script evaluation
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_QUOTA_EXCEEDED);
    if (saved && Date.now() >= Number(saved)) {
      localStorage.removeItem(STORAGE_KEY_QUOTA_EXCEEDED);
    }
  } catch {}
}

export default app;


