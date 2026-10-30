import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db, isFirestoreQuotaExceeded, checkAndHandleFirestoreError } from './firebase';
import { DEFAULT_PROFILES } from '../data/defaults';
import { COMMUNITY_DOCUMENTS } from '../data/communityDocs';
import { BUILTIN_SIMULATIONS } from './simulationService';
import { DEFAULT_ADMIN_PROFILE } from './adminConfig';

export interface SystemSnapshot {
  id: string;
  timestamp?: string;
  createdAt: string;
  note: string;
  name?: string;
  description?: string;
  authorName?: string;
  author?: string;
  data: {
    classProfiles?: any;
    forumMessages?: any;
    communityDocs?: any;
    simulations?: any;
    adminProfile?: any;
    systemSettings?: any;
  };
}

const STORAGE_KEY_SNAPSHOTS = 'app_system_snapshots_v1';

/**
 * Capture current application state into a snapshot
 */
export const createSystemSnapshot = async (
  note: string = 'Sao lưu an toàn hệ thống',
  description: string = 'Sao lưu toàn bộ dữ liệu ứng dụng',
  authorName: string = 'Admin Thầy Cấn Văn Trường'
): Promise<SystemSnapshot> => {
  const timestamp = new Date().toLocaleString('vi-VN');
  const id = 'snap_' + Date.now();

  let classProfiles = null;
  let forumMessages = null;
  let communityDocs = null;
  let simulations = null;
  let adminProfile = null;
  let systemSettings = null;

  try {
    const rawClass = localStorage.getItem('class_profiles_v48');
    if (rawClass) classProfiles = JSON.parse(rawClass);
  } catch (e) {}

  try {
    const rawForum = localStorage.getItem('forum_messages_cache_v1');
    if (rawForum) forumMessages = JSON.parse(rawForum);
  } catch (e) {}

  try {
    const rawDocs = localStorage.getItem('community_docs_cache_v1');
    if (rawDocs) communityDocs = JSON.parse(rawDocs);
  } catch (e) {}

  try {
    const rawSims = localStorage.getItem('simulations_cache_v1');
    if (rawSims) simulations = JSON.parse(rawSims);
  } catch (e) {}

  try {
    const rawAdmin = localStorage.getItem('app_admin_profile_v1');
    if (rawAdmin) adminProfile = JSON.parse(rawAdmin);
  } catch (e) {}

  try {
    const rawSettings = localStorage.getItem('app_system_settings_v1');
    if (rawSettings) systemSettings = JSON.parse(rawSettings);
  } catch (e) {}

  const newSnapshot: SystemSnapshot = {
    id,
    timestamp,
    createdAt: timestamp,
    note: note || `Bản sao lưu ${timestamp}`,
    name: note || `Bản sao lưu ${timestamp}`,
    description,
    authorName,
    author: authorName,
    data: {
      classProfiles,
      forumMessages,
      communityDocs,
      simulations,
      adminProfile,
      systemSettings
    }
  };

  // Save to LocalStorage
  try {
    const saved = getLocalSnapshots();
    const updated = [newSnapshot, ...saved.slice(0, 15)]; // Keep up to 15 recent snapshots
    localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error storing snapshot to local:', e);
  }

  // Save to Firestore for cross-device durability
  if (!isFirestoreQuotaExceeded()) {
    try {
      const snapRef = doc(db, 'system_snapshots', id);
      await setDoc(snapRef, newSnapshot);
    } catch (e) {
      checkAndHandleFirestoreError(e);
    }
  }

  return newSnapshot;
};

/**
 * Get all available snapshots (Local + Firestore)
 */
export const getLocalSnapshots = (): SystemSnapshot[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SNAPSHOTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
};

export const fetchAllSnapshots = async (): Promise<SystemSnapshot[]> => {
  const localList = getLocalSnapshots();
  if (!isFirestoreQuotaExceeded()) {
    try {
      const snapCol = collection(db, 'system_snapshots');
      const snapDocs = await getDocs(snapCol);
      const firestoreList: SystemSnapshot[] = [];
      snapDocs.forEach(d => {
        firestoreList.push(d.data() as SystemSnapshot);
      });

      if (firestoreList.length > 0) {
        // Merge unique by ID
        const map = new Map<string, SystemSnapshot>();
        firestoreList.forEach(s => map.set(s.id, s));
        localList.forEach(s => map.set(s.id, s));
        const merged = Array.from(map.values()).sort((a, b) => b.id.localeCompare(a.id));
        localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(merged));
        return merged;
      }
    } catch (e) {
      checkAndHandleFirestoreError(e);
    }
  }
  return localList;
};

/**
 * Restore system to a specific snapshot
 */
export const restoreSystemSnapshot = async (snapshot: SystemSnapshot): Promise<boolean> => {
  try {
    if (snapshot.data.classProfiles) {
      localStorage.setItem('class_profiles_v48', JSON.stringify(snapshot.data.classProfiles));
    }
    if (snapshot.data.forumMessages) {
      localStorage.setItem('forum_messages_cache_v1', JSON.stringify(snapshot.data.forumMessages));
    }
    if (snapshot.data.communityDocs) {
      localStorage.setItem('community_docs_cache_v1', JSON.stringify(snapshot.data.communityDocs));
    }
    if (snapshot.data.simulations) {
      localStorage.setItem('simulations_cache_v1', JSON.stringify(snapshot.data.simulations));
    }
    if (snapshot.data.adminProfile) {
      localStorage.setItem('app_admin_profile_v1', JSON.stringify(snapshot.data.adminProfile));
    }
    if (snapshot.data.systemSettings) {
      localStorage.setItem('app_system_settings_v1', JSON.stringify(snapshot.data.systemSettings));
    }
    return true;
  } catch (err) {
    console.error('Error restoring snapshot:', err);
    return false;
  }
};

/**
 * Reset all components to initial factory defaults
 */
export const resetToFactoryDefaults = async (): Promise<boolean> => {
  try {
    localStorage.setItem('class_profiles_v48', JSON.stringify(DEFAULT_PROFILES));
    localStorage.setItem('community_docs_cache_v1', JSON.stringify(COMMUNITY_DOCUMENTS));
    localStorage.setItem('simulations_cache_v1', JSON.stringify(BUILTIN_SIMULATIONS));
    localStorage.setItem('app_admin_profile_v1', JSON.stringify(DEFAULT_ADMIN_PROFILE));
    return true;
  } catch (err) {
    console.error('Error resetting factory defaults:', err);
    return false;
  }
};

/**
 * Delete a snapshot
 */
export const deleteSystemSnapshot = async (id: string): Promise<void> => {
  try {
    const list = getLocalSnapshots().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(list));
  } catch (e) {}

  try {
    const snapRef = doc(db, 'system_snapshots', id);
    await deleteDoc(snapRef);
  } catch (e) {}
};
