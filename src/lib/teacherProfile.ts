import { db, isFirestoreQuotaExceeded, checkAndHandleFirestoreError } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { TeacherProfile } from '../types';
import { getDeviceId, validateLicenseKey, STORAGE_KEY_SAVED_LICENSE } from './licenseUtils';

export const STORAGE_KEY_TEACHER_PROFILE = 'app_teacher_profile_v2';

export const DEFAULT_TEACHER_PROFILE: TeacherProfile = {
  name: 'Giáo viên',
  school: 'Trường THCS',
  province: 'TP. Hà Nội',
  department: 'Tổ Chuyên Môn',
  subject: 'Toán học',
  grade: 'Lớp 7',
  phone: '',
  email: '',
  avatarUrl: '',
  boundDeviceId: '',
  isVip: false,
  isAdmin: false
};

/**
 * Get current cached teacher profile from localStorage & validated license key
 */
export const getCachedTeacherProfile = (): TeacherProfile => {
  const myDeviceId = getDeviceId();
  let baseProfile: TeacherProfile = { ...DEFAULT_TEACHER_PROFILE, boundDeviceId: myDeviceId };

  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEACHER_PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      baseProfile = { ...baseProfile, ...parsed, boundDeviceId: myDeviceId };
    }
  } catch (e) {}

  // Check saved license key status to accurately determine Admin vs Teacher and Unit info
  try {
    const savedLicense = localStorage.getItem(STORAGE_KEY_SAVED_LICENSE);
    if (savedLicense) {
      const val = validateLicenseKey(savedLicense, myDeviceId);
      if (val.valid) {
        baseProfile.isVip = true;
        baseProfile.isAdmin = !!val.isAdmin;

        if (val.isAdmin) {
          // If Master Admin Key (Thầy Cấn Văn Trường)
          baseProfile.name = 'Thầy Cấn Văn Trường';
          baseProfile.school = 'Trường THCS Phùng Khắc Khoan';
          baseProfile.province = 'TP. Hà Nội';
          baseProfile.phone = '0988.302.636';
          baseProfile.email = 'canvantruong2010@gmail.com';
        } else {
          // Regular teacher: ALWAYS set isAdmin = false
          baseProfile.isAdmin = false;

          const isPollutedWithAdmin =
            baseProfile.name === 'Thầy Cấn Văn Trường' ||
            baseProfile.name === 'Thầy Cấn Văn Trường (SUPERADMIN MASTER)';

          if (val.licenseObj) {
            const hasCustomOwner =
              val.licenseObj.ownerName &&
              val.licenseObj.ownerName !== 'Thầy Cấn Văn Trường (SUPERADMIN MASTER)' &&
              val.licenseObj.ownerName !== 'Giáo viên Bản Quyền' &&
              val.licenseObj.ownerName !== 'Giáo viên Dùng Thử Trải Nghiệm';

            if (hasCustomOwner) {
              if (!baseProfile.name || isPollutedWithAdmin || baseProfile.name === 'Giáo viên') {
                baseProfile.name = val.licenseObj.ownerName;
              }
            } else if (isPollutedWithAdmin) {
              baseProfile.name = 'Thầy/Cô Giáo';
            }

            if (val.licenseObj.school && val.licenseObj.school !== 'Trường THCS Phùng Khắc Khoan, TP. Hà Nội') {
              if (!baseProfile.school || baseProfile.school === 'Trường THCS Phùng Khắc Khoan' || baseProfile.school === 'Trường THCS') {
                baseProfile.school = val.licenseObj.school;
              }
            } else if (baseProfile.school === 'Trường THCS Phùng Khắc Khoan') {
              baseProfile.school = 'Trường THCS';
            }
          } else if (isPollutedWithAdmin) {
            baseProfile.name = 'Thầy/Cô Giáo';
            if (baseProfile.school === 'Trường THCS Phùng Khắc Khoan') {
              baseProfile.school = 'Trường THCS';
            }
          }
        }
      } else {
        baseProfile.isVip = false;
        baseProfile.isAdmin = false;
      }
    } else {
      baseProfile.isVip = false;
      baseProfile.isAdmin = false;
    }
  } catch (e) {}

  return baseProfile;
};

/**
 * Save Teacher Profile to LocalStorage & Cloud Firestore
 */
export const saveTeacherProfile = async (profile: TeacherProfile): Promise<void> => {
  const myDeviceId = getDeviceId();
  const toSave: TeacherProfile = {
    ...profile,
    name: profile.name || 'Giáo viên',
    school: profile.school || 'Trường THCS',
    province: profile.province || 'TP. Hà Nội',
    department: profile.department || 'Tổ Chuyên Môn',
    subject: profile.subject || 'Toán học',
    grade: profile.grade || 'Lớp 7',
    phone: profile.phone || '',
    email: profile.email || '',
    avatarUrl: profile.avatarUrl || '',
    boundDeviceId: myDeviceId,
    updatedAt: new Date().toLocaleString('vi-VN')
  };

  try {
    localStorage.setItem(STORAGE_KEY_TEACHER_PROFILE, JSON.stringify(toSave));
  } catch (e) {}

  if (!isFirestoreQuotaExceeded()) {
    try {
      const docRef = doc(db, 'teacher_profiles', myDeviceId);
      // Sanitize to prevent undefined fields in Firestore
      const cleanToSave = Object.fromEntries(
        Object.entries(toSave).filter(([_, v]) => v !== undefined)
      );
      await setDoc(docRef, cleanToSave, { merge: true });
    } catch (e) {
      checkAndHandleFirestoreError(e);
    }
  }
};

/**
 * Realtime listener for Teacher Profile
 */
export const subscribeToTeacherProfile = (onUpdate: (profile: TeacherProfile) => void) => {
  const myDeviceId = getDeviceId();
  const cached = getCachedTeacherProfile();
  onUpdate(cached);

  try {
    const docRef = doc(db, 'teacher_profiles', myDeviceId);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as TeacherProfile;
          const merged = { ...cached, ...data };
          localStorage.setItem(STORAGE_KEY_TEACHER_PROFILE, JSON.stringify(merged));
          onUpdate(merged);
        }
      },
      (err) => {
        checkAndHandleFirestoreError(err);
      }
    );
  } catch (e) {
    return () => {};
  }
};

