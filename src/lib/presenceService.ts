import { db, isFirestoreQuotaExceeded, checkAndHandleFirestoreError } from './firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  limit
} from 'firebase/firestore';
import { OnlineTeacherPresence, TeacherProfile } from '../types';
import { getDeviceId } from './licenseUtils';
import { getCachedTeacherProfile } from './teacherProfile';

export const ONLINE_TIMEOUT_MS = 300 * 1000; // 5 minutes timeout for presence
const HEARTBEAT_INTERVAL_MS = 180 * 1000; // 3 minutes heartbeat to strictly conserve write quota
let lastPresenceWriteAt = 0;

/**
 * Send or update heartbeat presence for this device in Firestore
 */
export const sendPresenceHeartbeat = async (
  profile?: TeacherProfile,
  currentTabName: string = 'Tab 12: Diễn đàn Sư phạm'
): Promise<void> => {
  if (isFirestoreQuotaExceeded()) {
    return; // Circuit breaker: skip remote writes if quota exceeded
  }

  const now = Date.now();
  if (now - lastPresenceWriteAt < 90 * 1000) {
    // Throttle writes: at most once every 90 seconds
    return;
  }
  lastPresenceWriteAt = now;

  const deviceId = getDeviceId();
  const prof = profile || getCachedTeacherProfile();

  const presenceData: OnlineTeacherPresence = {
    deviceId,
    teacherName: prof.name || (prof.isAdmin ? 'Thầy Cấn Văn Trường' : 'Giáo viên'),
    school: prof.school || (prof.isAdmin ? 'Trường THCS Phùng Khắc Khoan' : 'Trường THCS'),
    province: prof.province || 'TP. Hà Nội',
    avatarUrl: prof.avatarUrl || '',
    isAdmin: !!prof.isAdmin,
    isVip: !!prof.isVip,
    currentTab: currentTabName,
    lastActiveAt: Date.now(),
    startedAt: Date.now(),
    status: 'online'
  };

  try {
    const docRef = doc(db, 'online_presences', deviceId);
    await setDoc(docRef, presenceData, { merge: true });
  } catch (err) {
    checkAndHandleFirestoreError(err);
  }
};

/**
 * Mark user as offline on page close or unmount
 */
export const markPresenceOffline = async (): Promise<void> => {
  if (isFirestoreQuotaExceeded()) return;
  const deviceId = getDeviceId();
  try {
    const docRef = doc(db, 'online_presences', deviceId);
    await setDoc(docRef, { status: 'offline', lastActiveAt: 0 }, { merge: true });
  } catch (err) {
    checkAndHandleFirestoreError(err);
  }
};

/**
 * Initialize ongoing heartbeat loop
 */
export const initPresenceHeartbeat = (
  profile?: TeacherProfile,
  getCurrentTabName?: () => string
): (() => void) => {
  const getTabName = getCurrentTabName || (() => 'Diễn đàn Sư phạm & Hỏi đáp');

  // Initial ping
  sendPresenceHeartbeat(profile, getTabName());

  // Recurring ping
  const intervalId = setInterval(() => {
    sendPresenceHeartbeat(profile, getTabName());
  }, HEARTBEAT_INTERVAL_MS);

  const handleBeforeUnload = () => {
    markPresenceOffline();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', handleBeforeUnload);
  }

  return () => {
    clearInterval(intervalId);
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  };
};

/**
 * Real-time subscription to truly active teachers online nationwide
 */
export const subscribeToOnlinePresences = (
  onUpdate: (presences: OnlineTeacherPresence[]) => void
): (() => void) => {
  const myDeviceId = getDeviceId();
  const myProfile = getCachedTeacherProfile();

  // Local fallback object for the current user
  const localSelf: OnlineTeacherPresence = {
    deviceId: myDeviceId,
    teacherName: myProfile.name || (myProfile.isAdmin ? 'Thầy Cấn Văn Trường' : 'Giáo viên'),
    school: myProfile.school || 'Trường THCS',
    province: myProfile.province || 'TP. Hà Nội',
    avatarUrl: myProfile.avatarUrl || '',
    isAdmin: !!myProfile.isAdmin,
    isVip: !!myProfile.isVip,
    currentTab: 'Tab 12: Diễn đàn Sư phạm',
    lastActiveAt: Date.now(),
    status: 'online'
  };

  // Immediate initial callback with self
  onUpdate([localSelf]);

  try {
    const colRef = collection(db, 'online_presences');
    const q = query(colRef, limit(150));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const now = Date.now();
        const activeList: OnlineTeacherPresence[] = [];
        let hasSelf = false;

        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as OnlineTeacherPresence;
          if (!data) return;

          // Check if active within timeout window and not explicitly offline
          const isRecentlyActive =
            data.status !== 'offline' &&
            typeof data.lastActiveAt === 'number' &&
            now - data.lastActiveAt < ONLINE_TIMEOUT_MS;

          if (isRecentlyActive) {
            activeList.push(data);
            if (data.deviceId === myDeviceId) {
              hasSelf = true;
            }
          }
        });

        // Always make sure current active user is in the list
        if (!hasSelf) {
          activeList.unshift(localSelf);
        }

        // Sort: Admin first, VIP second, then most recently active
        activeList.sort((a, b) => {
          if (a.isAdmin && !b.isAdmin) return -1;
          if (!a.isAdmin && b.isAdmin) return 1;
          if (a.isVip && !b.isVip) return -1;
          if (!a.isVip && b.isVip) return 1;
          return (b.lastActiveAt || 0) - (a.lastActiveAt || 0);
        });

        onUpdate(activeList);
      },
      (error) => {
        checkAndHandleFirestoreError(error);
        onUpdate([localSelf]);
      }
    );

    return unsubscribe;
  } catch (err) {
    checkAndHandleFirestoreError(err);
    onUpdate([localSelf]);
    return () => {};
  }
};
