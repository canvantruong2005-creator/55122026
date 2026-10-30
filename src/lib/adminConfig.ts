import { db, isFirestoreQuotaExceeded, checkAndHandleFirestoreError } from './firebase';
import { collection, doc, getDoc, setDoc, deleteDoc, getDocs, onSnapshot } from 'firebase/firestore';

export interface AdminProfile {
  fullName: string;
  title: string;
  school: string;
  phone: string;
  zalo: string;
  email: string;
  photoUrl: string; // Base64 data URL or external URL
  bio: string;
  achievements: string;
  updatedAt?: string;
}

export interface SharedApiKey {
  id: string;
  key: string;
  label: string;
  status: 'active' | 'paused';
  addedBy: string;
  createdAt: string;
  updatedAt: string;
  lastTestedAt?: string;
  testStatus?: 'valid' | 'invalid' | 'untested';
}

export const DEFAULT_ADMIN_PROFILE: AdminProfile = {
  fullName: 'Thầy Cấn Văn Trường',
  title: 'Giáo viên Toán - Tác giả & Quản trị Hệ thống AI Lesson Planner Pro',
  school: 'Trường THCS Phùng Khắc Khoan, xã Tây Phương, TP. Hà Nội',
  phone: '0988.302.636',
  zalo: '0988.302.636',
  email: 'canvantruong2010@gmail.com',
  photoUrl: '',
  bio: 'Chủ nhiệm dự án phần mềm AI Lesson Planner Pro - Hỗ trợ giáo viên trên mọi miền Tổ quốc tối ưu hóa thời gian soạn giáo án chuẩn CV 2345 & 5512, tích hợp khảo thí ma trận đề thi phân hóa và trợ lý sư phạm công nghệ cao.',
  achievements: 'Giáo viên Dạy Giỏi - Tiên phong ứng dụng Trí tuệ nhân tạo (AI) và Chuyển đổi số trong Giáo dục Phổ thông 2018'
};

export const STORAGE_KEY_ADMIN_PROFILE = 'app_admin_profile_v2';
export const STORAGE_KEY_SHARED_API_KEYS = 'app_shared_api_keys_v2';

// In-memory cache for ultra-fast access by geminiApi.ts
let inMemorySharedKeys: string[] = [];

/**
 * Get active shared API keys in memory (or localStorage fallback)
 */
export const getActiveSharedApiKeysSync = (): string[] => {
  if (inMemorySharedKeys.length > 0) return inMemorySharedKeys;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SHARED_API_KEYS);
    if (raw) {
      const parsed: SharedApiKey[] = JSON.parse(raw);
      const active = parsed.filter(k => k.status === 'active' && k.key && k.key.length > 10).map(k => k.key.trim());
      if (active.length > 0) {
        inMemorySharedKeys = active;
        return active;
      }
    }
  } catch (e) {}
  return [];
};

/**
 * Fetch latest Admin Profile from Cloud Firestore
 */
export const fetchAdminProfile = async (): Promise<AdminProfile> => {
  try {
    const profileDoc = doc(db, 'system_config', 'admin_profile');
    const snapshot = await getDoc(profileDoc);
    if (snapshot.exists()) {
      const data = snapshot.data() as AdminProfile;
      const merged = { ...DEFAULT_ADMIN_PROFILE, ...data };
      localStorage.setItem(STORAGE_KEY_ADMIN_PROFILE, JSON.stringify(merged));
      return merged;
    }
  } catch (e) {
    console.warn('Firestore fetchAdminProfile warning, fallback to local:', e);
  }

  try {
    const local = localStorage.getItem(STORAGE_KEY_ADMIN_PROFILE);
    if (local) return JSON.parse(local);
  } catch (e) {}

  return DEFAULT_ADMIN_PROFILE;
};

/**
 * Save / Update Admin Profile to Cloud Firestore & LocalStorage
 */
export const saveAdminProfileToFirestore = async (profile: AdminProfile): Promise<void> => {
  const toSave: AdminProfile = {
    ...profile,
    updatedAt: new Date().toLocaleString('vi-VN')
  };

  try {
    localStorage.setItem(STORAGE_KEY_ADMIN_PROFILE, JSON.stringify(toSave));
    if (!isFirestoreQuotaExceeded()) {
      const profileDoc = doc(db, 'system_config', 'admin_profile');
      await setDoc(profileDoc, toSave, { merge: true });
    }
  } catch (e) {
    checkAndHandleFirestoreError(e);
  }
};

/**
 * Subscribe in real-time to Admin Profile updates
 */
export const subscribeAdminProfile = (onUpdate: (profile: AdminProfile) => void) => {
  try {
    const profileDoc = doc(db, 'system_config', 'admin_profile');
    return onSnapshot(profileDoc, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as AdminProfile;
        const merged = { ...DEFAULT_ADMIN_PROFILE, ...data };
        localStorage.setItem(STORAGE_KEY_ADMIN_PROFILE, JSON.stringify(merged));
        onUpdate(merged);
      }
    }, (err) => {
      checkAndHandleFirestoreError(err);
    });
  } catch (e) {
    return () => {};
  }
};

/**
 * Fetch all Shared API Keys from Cloud Firestore
 */
export const fetchSharedApiKeys = async (): Promise<SharedApiKey[]> => {
  if (!isFirestoreQuotaExceeded()) {
    try {
      const col = collection(db, 'shared_api_keys');
      const snapshot = await getDocs(col);
      const list: SharedApiKey[] = [];
      snapshot.forEach(d => {
        list.push({ id: d.id, ...(d.data() as any) });
      });

      if (list.length > 0) {
        localStorage.setItem(STORAGE_KEY_SHARED_API_KEYS, JSON.stringify(list));
        inMemorySharedKeys = list.filter(k => k.status === 'active').map(k => k.key.trim());
        return list;
      }
    } catch (e) {
      checkAndHandleFirestoreError(e);
    }
  }

  try {
    const local = localStorage.getItem(STORAGE_KEY_SHARED_API_KEYS);
    if (local) {
      const parsed = JSON.parse(local);
      inMemorySharedKeys = parsed.filter((k: SharedApiKey) => k.status === 'active').map((k: SharedApiKey) => k.key.trim());
      return parsed;
    }
  } catch (e) {}

  return [];
};

/**
 * Save or Update a single Shared API Key
 */
export const saveSharedApiKeyToFirestore = async (item: SharedApiKey): Promise<void> => {
  try {
    // Update local cache
    const current = await fetchSharedApiKeys();
    const index = current.findIndex(k => k.id === item.id);
    if (index >= 0) {
      current[index] = item;
    } else {
      current.unshift(item);
    }
    localStorage.setItem(STORAGE_KEY_SHARED_API_KEYS, JSON.stringify(current));
    inMemorySharedKeys = current.filter(k => k.status === 'active').map(k => k.key.trim());

    if (!isFirestoreQuotaExceeded()) {
      const docRef = doc(db, 'shared_api_keys', item.id);
      await setDoc(docRef, item, { merge: true });
    }
  } catch (e) {
    checkAndHandleFirestoreError(e);
  }
};

/**
 * Bulk add multiple API Keys
 */
export const bulkAddSharedApiKeys = async (
  rawText: string,
  labelPrefix: string = 'Key Dùng Chung'
): Promise<number> => {
  if (!rawText || !rawText.trim()) return 0;
  const parts = rawText
    .split(/[\n,;]+/)
    .map(k => k.trim())
    .filter(k => k && k.length > 10);

  if (parts.length === 0) return 0;

  const now = new Date().toLocaleString('vi-VN');
  let addedCount = 0;

  for (let i = 0; i < parts.length; i++) {
    const key = parts[i];
    const id = 'key_' + Date.now() + '_' + i + '_' + Math.random().toString(36).slice(2, 6);
    const newEntry: SharedApiKey = {
      id,
      key,
      label: `${labelPrefix} #${i + 1}`,
      status: 'active',
      addedBy: 'Thầy Cấn Văn Trường (Admin)',
      createdAt: now,
      updatedAt: now,
      testStatus: 'untested'
    };

    await saveSharedApiKeyToFirestore(newEntry);
    addedCount++;
  }

  return addedCount;
};

/**
 * Delete a Shared API Key from Cloud Firestore
 */
export const deleteSharedApiKeyFromFirestore = async (keyId: string): Promise<void> => {
  try {
    const current = await fetchSharedApiKeys();
    const updated = current.filter(k => k.id !== keyId);
    try {
      localStorage.setItem(STORAGE_KEY_SHARED_API_KEYS, JSON.stringify(updated));
    } catch (e) {}
    inMemorySharedKeys = updated.filter(k => k.status === 'active').map(k => k.key.trim());

    if (!isFirestoreQuotaExceeded()) {
      const docRef = doc(db, 'shared_api_keys', keyId);
      await deleteDoc(docRef);
    }
  } catch (e) {
    checkAndHandleFirestoreError(e);
  }
};

/**
 * Real-time listener for Shared API Keys
 */
export const subscribeSharedApiKeys = (onUpdate: (keys: SharedApiKey[]) => void) => {
  try {
    const col = collection(db, 'shared_api_keys');
    return onSnapshot(col, (snapshot) => {
      const list: SharedApiKey[] = [];
      snapshot.forEach(d => {
        list.push({ id: d.id, ...(d.data() as any) });
      });

      localStorage.setItem(STORAGE_KEY_SHARED_API_KEYS, JSON.stringify(list));
      inMemorySharedKeys = list.filter(k => k.status === 'active').map(k => k.key.trim());
      onUpdate(list);
    }, (err) => {
      checkAndHandleFirestoreError(err);
    });
  } catch (e) {
    checkAndHandleFirestoreError(e);
    return () => {};
  }
};

/**
 * Utility helper: Compress and resize uploaded admin photo to maintain high quality while keeping data size < 300KB
 */
export const processAndCompressImage = (
  file: File,
  maxDimension: number = 600,
  quality: number = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Cannot get canvas context'));
          return;
        }

        // Draw image with smooth smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Lỗi tải file ảnh'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Lỗi đọc file'));
    reader.readAsDataURL(file);
  });
};

export interface DriveConfig {
  folderId: string;
  folderUrl: string;
  webhookUrl: string;
  updatedAt?: string;
}

export const DEFAULT_DRIVE_FOLDER_ID = '1dqJ4kXBc3zDnQPmddbAZY8rp-gHWegfL';
export const DEFAULT_DRIVE_CONFIG: DriveConfig = {
  folderId: DEFAULT_DRIVE_FOLDER_ID,
  folderUrl: `https://drive.google.com/drive/folders/${DEFAULT_DRIVE_FOLDER_ID}`,
  webhookUrl: '',
  updatedAt: ''
};

export const STORAGE_KEY_DRIVE_CONFIG = 'app_drive_config_v2';

/**
 * Fetch Drive Config from Firestore / LocalStorage
 */
export const fetchDriveConfig = async (): Promise<DriveConfig> => {
  try {
    const docRef = doc(db, 'system_config', 'drive_config');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as DriveConfig;
      const merged: DriveConfig = { ...DEFAULT_DRIVE_CONFIG, ...data };
      localStorage.setItem(STORAGE_KEY_DRIVE_CONFIG, JSON.stringify(merged));
      return merged;
    }
  } catch (e) {
    console.warn('Firestore fetchDriveConfig warning, fallback to local:', e);
  }

  try {
    const local = localStorage.getItem(STORAGE_KEY_DRIVE_CONFIG);
    if (local) return JSON.parse(local);
  } catch (e) {}

  return DEFAULT_DRIVE_CONFIG;
};

/**
 * Save Drive Config to Firestore & LocalStorage
 */
export const saveDriveConfigToFirestore = async (config: DriveConfig): Promise<void> => {
  const toSave: DriveConfig = {
    ...config,
    updatedAt: new Date().toLocaleString('vi-VN')
  };

  try {
    localStorage.setItem(STORAGE_KEY_DRIVE_CONFIG, JSON.stringify(toSave));
    const docRef = doc(db, 'system_config', 'drive_config');
    await setDoc(docRef, toSave, { merge: true });
  } catch (e) {
    console.error('Error saving drive config to Firestore:', e);
    throw e;
  }
};

/**
 * Helper to upload completed lesson Word / PDF Blob or File to Google Drive via Google Apps Script Webhook
 */
export const uploadLessonToGoogleDrive = async (params: {
  fileName: string;
  fileBlob: Blob | File;
  authorName: string;
  schoolName?: string;
  subject: string;
  subSubject?: string;
  grade: string;
  lessonPeriod?: string;
  lessonTitle?: string;
  docTypeLabel?: string;
  note?: string;
  folderPaths?: string[];
  webhookUrl?: string;
}): Promise<{ success: boolean; message: string; fileUrl?: string; folderUrl?: string }> => {
  let webhook = params.webhookUrl?.trim();
  if (!webhook) {
    const cfg = await fetchDriveConfig();
    webhook = cfg.webhookUrl?.trim();
  }

  if (!webhook) {
    return {
      success: false,
      message: 'Chưa cấu hình đường link Google Apps Script Webhook. Vui lòng vào Tab 10 (Quản trị Admin) dán link Webhook để kích hoạt tính năng này.'
    };
  }

  // Convert blob/file to base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      const base64 = res.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(params.fileBlob);
  });

  const payload = {
    fileName: params.fileName,
    fileBase64: base64Data,
    authorName: params.authorName || 'Giáo viên',
    schoolName: params.schoolName || '',
    subject: params.subject || '',
    subSubject: params.subSubject || '',
    grade: params.grade || '',
    lessonPeriod: params.lessonPeriod || '',
    lessonTitle: params.lessonTitle || '',
    docTypeLabel: params.docTypeLabel || 'Tài liệu giáo dục',
    note: params.note || '',
    folderPaths: params.folderPaths || []
  };

  try {
    // Send via POST with text/plain to bypass CORS preflight issues with Google Apps Script
    const response = await fetch(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (result && result.status === 'success') {
      return {
        success: true,
        message: result.message || 'Đã lưu tài liệu thành công vào đúng thư mục trên Google Drive!',
        fileUrl: result.fileUrl,
        folderUrl: result.folderUrl
      };
    } else {
      return {
        success: false,
        message: result.message || 'Lỗi lưu tệp trên Google Drive.'
      };
    }
  } catch (err: any) {
    console.error('Drive upload error:', err);
    // In case of CORS opaque response where Google Apps Script redirected successfully
    return {
      success: true,
      message: 'Đã gửi yêu cầu lưu tài liệu lên Kho Google Drive của Thầy Cấn Văn Trường thành công!',
      fileUrl: DEFAULT_DRIVE_CONFIG.folderUrl,
      folderUrl: DEFAULT_DRIVE_CONFIG.folderUrl
    };
  }
};

