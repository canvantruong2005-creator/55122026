import { db, isFirestoreQuotaExceeded, checkAndHandleFirestoreError } from './firebase';
import { collection, doc, getDoc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { DEFAULT_PROFILES, DEFAULT_PP, DEFAULT_KT } from '../data/defaults';
import { STORAGE_KEY_ISSUED_LICENSES, IssuedLicense } from './licenseUtils';
import { STORAGE_KEY_ADMIN_PROFILE, DEFAULT_ADMIN_PROFILE } from './adminConfig';

export interface SystemSnapshot {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
  note?: string;
  data: {
    classProfiles?: Record<string, any>;
    ppList?: string[];
    ktList?: string[];
    adminProfile?: any;
    systemSettings?: any;
    issuedLicenses?: IssuedLicense[];
    timestamp: number;
  };
}

export const STORAGE_KEY_SNAPSHOTS = 'app_system_snapshots_v1';

/**
 * Creates a complete snapshot of the website state
 */
export const createSystemSnapshot = async (
  name: string,
  note: string = '',
  createdBy: string = 'Thầy Cấn Văn Trường'
): Promise<SystemSnapshot> => {
  const timestamp = Date.now();
  const id = `snap_${timestamp}`;

  // Gather current system states from LocalStorage & Memory
  let classProfiles = DEFAULT_PROFILES;
  try {
    const raw = localStorage.getItem('class_profiles_v48');
    if (raw) classProfiles = JSON.parse(raw);
  } catch (e) {}

  let ppList = DEFAULT_PP;
  let ktList = DEFAULT_KT;

  let adminProfile = DEFAULT_ADMIN_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADMIN_PROFILE);
    if (raw) adminProfile = JSON.parse(raw);
  } catch (e) {}

  let issuedLicenses: IssuedLicense[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ISSUED_LICENSES);
    if (raw) issuedLicenses = JSON.parse(raw);
  } catch (e) {}

  let systemSettings = { trialDays: 2, allowTrial: true };
  try {
    const raw = localStorage.getItem('app_system_settings_v1');
    if (raw) systemSettings = JSON.parse(raw);
  } catch (e) {}

  const snapshot: SystemSnapshot = {
    id,
    name: name.trim() || `Điểm khôi phục ${new Date().toLocaleDateString('vi-VN')}`,
    createdAt: new Date().toLocaleString('vi-VN'),
    createdBy,
    note: note.trim(),
    data: {
      classProfiles,
      ppList,
      ktList,
      adminProfile,
      systemSettings,
      issuedLicenses,
      timestamp
    }
  };

  // Save to LocalStorage
  try {
    const existing = await fetchSystemSnapshots();
    const updated = [snapshot, ...existing.filter(s => s.id !== id)];
    localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(updated));
  } catch (e) {}

  // Save to Firestore
  if (!isFirestoreQuotaExceeded()) {
    try {
      const snapDoc = doc(db, 'system_snapshots', id);
      await setDoc(snapDoc, snapshot);
    } catch (e) {
      checkAndHandleFirestoreError(e);
    }
  }

  return snapshot;
};

/**
 * Fetches all system snapshots
 */
export const fetchSystemSnapshots = async (): Promise<SystemSnapshot[]> => {
  if (!isFirestoreQuotaExceeded()) {
    try {
      const snapCol = collection(db, 'system_snapshots');
      const snapshot = await getDocs(snapCol);
      const list: SystemSnapshot[] = [];
      snapshot.forEach(d => {
        list.push(d.data() as SystemSnapshot);
      });

      if (list.length > 0) {
        list.sort((a, b) => (b.data?.timestamp || 0) - (a.data?.timestamp || 0));
        localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(list));
        return list;
      }
    } catch (e) {
      checkAndHandleFirestoreError(e);
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_SNAPSHOTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return [];
};

/**
 * Restores the entire system to a chosen snapshot
 */
export const restoreSystemSnapshot = async (snapshot: SystemSnapshot): Promise<boolean> => {
  try {
    if (!snapshot || !snapshot.data) return false;

    // Restore class profiles
    if (snapshot.data.classProfiles) {
      localStorage.setItem('class_profiles_v48', JSON.stringify(snapshot.data.classProfiles));
    }

    // Restore Admin profile
    if (snapshot.data.adminProfile) {
      localStorage.setItem(STORAGE_KEY_ADMIN_PROFILE, JSON.stringify(snapshot.data.adminProfile));
      try {
        const docRef = doc(db, 'system_config', 'admin_profile');
        await setDoc(docRef, snapshot.data.adminProfile);
      } catch (e) {}
    }

    // Restore Licenses
    if (snapshot.data.issuedLicenses && snapshot.data.issuedLicenses.length > 0) {
      localStorage.setItem(STORAGE_KEY_ISSUED_LICENSES, JSON.stringify(snapshot.data.issuedLicenses));
      for (const lic of snapshot.data.issuedLicenses) {
        try {
          const docRef = doc(db, 'licenses', lic.id);
          await setDoc(docRef, lic);
        } catch (e) {}
      }
    }

    // Restore System Settings
    if (snapshot.data.systemSettings) {
      localStorage.setItem('app_system_settings_v1', JSON.stringify(snapshot.data.systemSettings));
      try {
        const docRef = doc(db, 'system_config', 'settings');
        await setDoc(docRef, snapshot.data.systemSettings);
      } catch (e) {}
    }

    return true;
  } catch (e) {
    console.error('Error restoring snapshot:', e);
    return false;
  }
};

/**
 * Deletes a snapshot
 */
export const deleteSystemSnapshot = async (snapshotId: string): Promise<void> => {
  try {
    const snapDoc = doc(db, 'system_snapshots', snapshotId);
    await deleteDoc(snapDoc);
  } catch (e) {}

  try {
    const existing = await fetchSystemSnapshots();
    const updated = existing.filter(s => s.id !== snapshotId);
    localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(updated));
  } catch (e) {}
};

/**
 * Factory reset system to clean pristine defaults
 */
export const factoryResetSystem = (): void => {
  localStorage.setItem('class_profiles_v48', JSON.stringify(DEFAULT_PROFILES));
  localStorage.setItem(STORAGE_KEY_ADMIN_PROFILE, JSON.stringify(DEFAULT_ADMIN_PROFILE));
  localStorage.removeItem('sgk_reference_cache_text_v48');
  localStorage.removeItem('exam_results_v48');
  localStorage.setItem('app_system_settings_v1', JSON.stringify({ trialDays: 2, allowTrial: true }));
};
