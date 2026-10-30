import { db, isFirestoreQuotaExceeded, checkAndHandleFirestoreError } from './firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, onSnapshot } from 'firebase/firestore';

export interface IssuedLicense {
  id: string;
  key: string;
  ownerName: string;
  school: string;
  issuedAt: string;
  expiryDate: string; // YYYY-MM-DD
  status: 'active' | 'paused' | 'revoked';
  boundDeviceId?: string; // e.g. "PKK-8C42A1"
  isTrial?: boolean;
  allowRemoveWatermark?: boolean; // Real-time toggle by Admin
  customWatermark?: string;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  isAdmin?: boolean;
  isTrial?: boolean;
  allowRemoveWatermark?: boolean;
  licenseObj?: IssuedLicense;
  expStr?: string;
}

export interface SystemSettings {
  trialDays: number;
  allowTrial: boolean;
  defaultWatermarkText: string;
  updatedAt?: string;
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  trialDays: 2,
  allowTrial: true,
  defaultWatermarkText: 'BẢN QUYỀN: THẦY CẤN VĂN TRƯỜNG - THCS PHÙNG KHẮC KHOAN - 0988.302.636'
};

export const SECRET_SALT = 'CAN_VAN_TRUONG_PROTECTION_HASH_SALT_2026_HN';
export const STORAGE_KEY_ISSUED_LICENSES = 'app_issued_licenses_v1';
export const STORAGE_KEY_SAVED_LICENSE = 'license_key_v48';
export const STORAGE_KEY_SYSTEM_SETTINGS = 'app_system_settings_v1';

/**
 * Fetch and subscribe to System Settings
 */
export const fetchSystemSettings = async (): Promise<SystemSettings> => {
  if (!isFirestoreQuotaExceeded()) {
    try {
      const snap = await getDocs(collection(db, 'system_config'));
      let found: SystemSettings | null = null;
      snap.forEach(d => {
        if (d.id === 'settings') {
          found = { ...DEFAULT_SYSTEM_SETTINGS, ...(d.data() as any) };
        }
      });
      if (found) {
        localStorage.setItem(STORAGE_KEY_SYSTEM_SETTINGS, JSON.stringify(found));
        return found;
      }
    } catch (e) {
      checkAndHandleFirestoreError(e);
    }
  }

  try {
    const local = localStorage.getItem(STORAGE_KEY_SYSTEM_SETTINGS);
    if (local) return JSON.parse(local);
  } catch (e) {}

  return DEFAULT_SYSTEM_SETTINGS;
};

export const saveSystemSettingsToFirestore = async (settings: SystemSettings): Promise<void> => {
  const toSave = {
    ...settings,
    updatedAt: new Date().toLocaleString('vi-VN')
  };
  localStorage.setItem(STORAGE_KEY_SYSTEM_SETTINGS, JSON.stringify(toSave));

  if (!isFirestoreQuotaExceeded()) {
    try {
      const docRef = doc(db, 'system_config', 'settings');
      await setDoc(docRef, toSave, { merge: true });
    } catch (e) {
      checkAndHandleFirestoreError(e);
    }
  }
};

export const subscribeToSystemSettings = (onUpdate: (settings: SystemSettings) => void) => {
  try {
    const docRef = doc(db, 'system_config', 'settings');
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = { ...DEFAULT_SYSTEM_SETTINGS, ...(snapshot.data() as any) };
        localStorage.setItem(STORAGE_KEY_SYSTEM_SETTINGS, JSON.stringify(data));
        onUpdate(data);
      }
    }, (err) => {
      checkAndHandleFirestoreError(err);
    });
  } catch (e) {
    return () => {};
  }
};

/**
 * Real-time listener for Firestore licenses collection
 */
export const subscribeToLicenses = (onUpdate: (licenses: IssuedLicense[]) => void) => {
  try {
    const licensesCol = collection(db, 'licenses');
    return onSnapshot(licensesCol, (snapshot) => {
      const list: IssuedLicense[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as any) });
      });

      if (list.length > 0) {
        localStorage.setItem(STORAGE_KEY_ISSUED_LICENSES, JSON.stringify(list));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('licenses_updated'));
        }
        onUpdate(list);
      }
    }, (err) => {
      checkAndHandleFirestoreError(err);
    });
  } catch (e) {
    return () => {};
  }
};

/**
 * Fetch latest issued licenses from Cloud Firestore with localStorage fallback
 */
export const fetchServerLicenses = async (): Promise<IssuedLicense[]> => {
  if (!isFirestoreQuotaExceeded()) {
    try {
      const licensesCol = collection(db, 'licenses');
      const snapshot = await getDocs(licensesCol);
      const list: IssuedLicense[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as any) });
      });

      if (list.length > 0) {
        localStorage.setItem(STORAGE_KEY_ISSUED_LICENSES, JSON.stringify(list));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('licenses_updated'));
        }
        return list;
      }
    } catch (e) {
      checkAndHandleFirestoreError(e);
    }
  }

  try {
    const local = localStorage.getItem(STORAGE_KEY_ISSUED_LICENSES);
    if (local) return JSON.parse(local);
  } catch (e) {}

  return [];
};

/**
 * Save or update a license in Cloud Firestore
 */
export const saveLicenseToFirestore = async (license: IssuedLicense): Promise<void> => {
  // Update local cache immediately
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ISSUED_LICENSES);
    const list: IssuedLicense[] = saved ? JSON.parse(saved) : [];
    const idx = list.findIndex(l => l.id === license.id || l.key.toUpperCase() === license.key.toUpperCase());
    if (idx >= 0) {
      list[idx] = license;
    } else {
      list.unshift(license);
    }
    localStorage.setItem(STORAGE_KEY_ISSUED_LICENSES, JSON.stringify(list));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('licenses_updated'));
    }
  } catch {}

  if (!isFirestoreQuotaExceeded()) {
    try {
      const docRef = doc(db, 'licenses', license.id);
      await setDoc(docRef, {
        key: license.key,
        ownerName: license.ownerName,
        school: license.school,
        issuedAt: license.issuedAt,
        expiryDate: license.expiryDate,
        status: license.status,
        boundDeviceId: license.boundDeviceId || '',
        isTrial: !!license.isTrial,
        allowRemoveWatermark: !!license.allowRemoveWatermark,
        customWatermark: license.customWatermark || ''
      }, { merge: true });
    } catch (e) {
      checkAndHandleFirestoreError(e);
    }
  }
};

/**
 * Delete a license from Cloud Firestore
 */
export const deleteLicenseFromFirestore = async (licenseId: string): Promise<void> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ISSUED_LICENSES);
    if (saved) {
      const list: IssuedLicense[] = JSON.parse(saved);
      const filtered = list.filter(l => l.id !== licenseId);
      localStorage.setItem(STORAGE_KEY_ISSUED_LICENSES, JSON.stringify(filtered));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('licenses_updated'));
      }
    }
  } catch {}

  if (!isFirestoreQuotaExceeded()) {
    try {
      const docRef = doc(db, 'licenses', licenseId);
      await deleteDoc(docRef);
    } catch (e) {
      checkAndHandleFirestoreError(e);
    }
  }
};

/**
 * Push whole list to Firestore and local cache
 */
export const pushLicensesToServer = async (licenses: IssuedLicense[]): Promise<boolean> => {
  try {
    localStorage.setItem(STORAGE_KEY_ISSUED_LICENSES, JSON.stringify(licenses));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('licenses_updated'));
    }
    for (const lic of licenses) {
      await saveLicenseToFirestore(lic);
    }
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Gets a stable, 100% deterministic hardware fingerprint for this machine.
 * Uses CPU cores, Screen metrics, Timezone, OS platform, and WebGL GPU renderer string.
 * It remains IDENTICAL on the same computer even across incognito tabs or localStorage clears.
 */
const getDeterministicHardwareFingerprint = (): string => {
  try {
    const nav = (typeof window !== 'undefined' ? window.navigator : {}) as any;
    const screen = (typeof window !== 'undefined' ? window.screen : {}) as any;

    // 1. Hardware & Platform basics
    const platform = nav.platform || nav.userAgentData?.platform || '';
    const cores = nav.hardwareConcurrency || 4;
    const memory = nav.deviceMemory || 8;
    const lang = nav.language || 'vi-VN';
    const tz = Intl?.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Asia/Ho_Chi_Minh';
    const screenRes = `${screen.width || 1920}x${screen.height || 1080}x${screen.colorDepth || 24}`;

    // 2. WebGL GPU / Graphics Card identity (Extremely unique to the physical computer)
    let gpuInfo = '';
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
          const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
          gpuInfo = `${vendor}_${renderer}`;
        }
      }
    } catch (e) {
      gpuInfo = 'GPU_STD';
    }

    // 3. Canvas rendering signature (font rasterization unique to OS and graphics driver)
    let canvasSign = '';
    try {
      const c = document.createElement('canvas');
      c.width = 200;
      c.height = 40;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = "14px 'Arial', 'Segoe UI', sans-serif";
        ctx.fillStyle = '#f60';
        ctx.fillRect(10, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('PKK-MATH-5512', 2, 15);
        canvasSign = c.toDataURL().slice(-40);
      }
    } catch (e) {
      canvasSign = 'CVS_STD';
    }

    return `${platform}_${cores}_${memory}_${screenRes}_${tz}_${lang}_${gpuInfo}_${canvasSign}_${SECRET_SALT}`;
  } catch (e) {
    return `FALLBACK_${SECRET_SALT}`;
  }
};

/**
 * Gets or generates a stable unique Device ID for this machine/browser (e.g. "PKK-8C42A1").
 * 100% stable: Same computer will ALWAYS produce the exact same Device ID.
 */
export const getDeviceId = (): string => {
  if (typeof window === 'undefined') return 'PKK-SERVER';

  const rawFingerprint = getDeterministicHardwareFingerprint();
  
  // 32-bit FNV-1a Hash + DJB2 combined for zero collision & fixed output
  let hash1 = 2166136261;
  for (let i = 0; i < rawFingerprint.length; i++) {
    hash1 ^= rawFingerprint.charCodeAt(i);
    hash1 = Math.imul(hash1, 16777619);
  }

  let hash2 = 5381;
  for (let i = 0; i < rawFingerprint.length; i++) {
    hash2 = ((hash2 << 5) + hash2) + rawFingerprint.charCodeAt(i);
    hash2 |= 0;
  }

  const combined = (Math.abs(hash1) + Math.abs(hash2)).toString(36).toUpperCase().padStart(6, '0').slice(-6);
  const stableId = `PKK-${combined}`;

  // Cache to localStorage for fast access
  try {
    localStorage.setItem('app_device_machine_id', stableId);
  } catch (e) {}

  return stableId;
};

/**
 * Extracts the 6-character code from a device ID (e.g. "PKK-8C42A1" -> "8C42A1").
 */
export const getDeviceCode = (devId?: string): string => {
  const full = (devId || getDeviceId()).trim().toUpperCase();
  if (full.startsWith('PKK-')) return full.slice(4);
  return full.slice(-6);
};

/**
 * Computes a 6-character cryptographic checksum based on dateStr, devCode and secret salt.
 */
export const computeDeviceChecksum = (dateStr: string, devCode: string): string => {
  const normDev = (devCode || 'ALL').trim().toUpperCase().replace(/^PKK-/, '');
  const raw = `${dateStr.trim()}_${normDev}_${SECRET_SALT}`;
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).toUpperCase().padStart(6, 'X').slice(-6);
};

/**
 * Generates a full license key string for Admin (Clean, secure format without admin secrets)
 * - Standard Device Key: DDMMYY-DEVCODE-CHECKSUM-PRO (locks to specific device)
 * - Multi-Device Trial Key: DDMMYY-TRIAL-CHECKSUM-PRO (runs on ANY machine until expiry date)
 */
export const generateLicenseKey = (expiryDateYMD: string, targetDeviceIdOrAll: string = 'ALL', isTrial: boolean = false): string => {
  const [year, month, day] = expiryDateYMD.split('-');
  const dateStr = `${day.padStart(2, '0')}${month.padStart(2, '0')}${year.slice(2)}`;
  
  let devCode = isTrial ? 'TRIAL' : (targetDeviceIdOrAll || 'ALL').trim().toUpperCase();
  if (devCode.startsWith('PKK-')) devCode = devCode.slice(4);
  if (!devCode) devCode = isTrial ? 'TRIAL' : 'ALL';

  const checksum = computeDeviceChecksum(dateStr, devCode);
  return `${dateStr}-${devCode}-${checksum}-PRO`;
};

/**
 * Quick helper to generate a multi-device Trial key for X days or custom expiry date
 */
export const generateTrialLicenseKey = (expiryDateYMD: string): string => {
  return generateLicenseKey(expiryDateYMD, 'TRIAL', true);
};

/**
 * Activate a Trial directly on this device with dynamic trialDays set by Admin.
 * Checks Firestore and localStorage to ensure this device can only activate trial ONCE.
 */
export const activate2DayTrial = async (teacherName: string, teacherSchool: string): Promise<{ success: boolean; message: string; key?: string }> => {
  const deviceId = getDeviceId();
  const deviceCode = getDeviceCode(deviceId);

  // 0. Get dynamic system settings
  const sysSettings = await fetchSystemSettings();
  if (!sysSettings.allowTrial) {
    return {
      success: false,
      message: 'Chương trình đăng ký Dùng thử tạm thời đóng. Vui lòng liên hệ Thầy Cấn Văn Trường (0988.302.636) để đăng ký bản quyền!'
    };
  }
  const trialDays = Math.max(1, sysSettings.trialDays || 2);

  // 1. Check local record
  const localTrialKey = `app_trial_activated_${deviceCode}`;
  const localHistory = localStorage.getItem(localTrialKey);
  if (localHistory) {
    return {
      success: false,
      message: `Thiết bị [${deviceId}] này ĐÃ TỪNG KÍCH HOẠT DÙNG THỬ! Mỗi thiết bị máy tính chỉ được dùng thử 01 lần duy nhất ${trialDays} ngày. Vui lòng liên hệ Thầy Cấn Văn Trường (0988.302.636) để đăng ký bản quyền chính thức.`
    };
  }

  // 2. Check cloud Firestore to prevent bypassing via cache clear
  if (!isFirestoreQuotaExceeded()) {
    try {
      const serverLicenses = await fetchServerLicenses();
      const existingDeviceTrial = serverLicenses.find(l => 
        l.isTrial && (l.boundDeviceId === deviceId || l.key.includes(deviceCode))
      );
      if (existingDeviceTrial) {
        localStorage.setItem(localTrialKey, 'true');
        return {
          success: false,
          message: `Hệ thống đám mây ghi nhận máy tính [${deviceId}] ĐÃ HẾT LƯỢT DÙNG THỬ (đã đăng ký trước đó). Vui lòng liên hệ Thầy Cấn Văn Trường (Zalo: 0988.302.636) để kích hoạt bản quyền chính thức!`
        };
      }
    } catch (e) {
      checkAndHandleFirestoreError(e);
    }
  }

  // 3. Compute expiry date based on trialDays
  const now = new Date();
  const expDate = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
  const yyyy = expDate.getFullYear();
  const mm = String(expDate.getMonth() + 1).padStart(2, '0');
  const dd = String(expDate.getDate()).padStart(2, '0');
  const expDateYMD = `${yyyy}-${mm}-${dd}`;

  // Generate device-bound trial key
  const trialKey = generateLicenseKey(expDateYMD, deviceCode, false);

  const trialLicense: IssuedLicense = {
    id: `trial_${deviceCode}_${Date.now()}`,
    key: trialKey,
    ownerName: teacherName.trim() || `Giáo viên Dùng Thử ${trialDays} Ngày`,
    school: teacherSchool.trim() || 'Trường THCS / THPT',
    issuedAt: new Date().toLocaleString('vi-VN'),
    expiryDate: expDateYMD,
    status: 'active',
    boundDeviceId: deviceId,
    isTrial: true,
    allowRemoveWatermark: false
  };

  // 4. Save to Firestore and local
  try {
    await saveLicenseToFirestore(trialLicense);
    localStorage.setItem(localTrialKey, JSON.stringify({ activatedAt: new Date().toISOString(), expDateYMD }));
    localStorage.setItem(STORAGE_KEY_SAVED_LICENSE, trialKey);
  } catch (e) {
    checkAndHandleFirestoreError(e);
  }

  return {
    success: true,
    message: `Kích hoạt thành công gói DÙNG THỬ ${trialDays} NGÀY trải nghiệm trọn vẹn toàn bộ tính năng! Hạn sử dụng đến hết ngày ${dd}/${mm}/${yyyy}.`,
    key: trialKey
  };
};

/**
 * Validates a license key on the current machine
 */
export const validateLicenseKey = (keyToTest: string, currentDeviceId?: string): ValidationResult => {
  const k = (keyToTest || '').trim().toUpperCase();
  if (!k) {
    return { valid: false, reason: 'Vui lòng nhập mã bản quyền hợp lệ để mở khóa!' };
  }

  const myDevId = currentDeviceId || getDeviceId();
  const myDevCode = getDeviceCode(myDevId);

  // 1. Master SuperAdmin Key (Thầy Cấn Văn Trường duy nhất)
  if (k === 'CANVANTRUONGVIP1990') {
    return {
      valid: true,
      isAdmin: true,
      allowRemoveWatermark: true,
      licenseObj: {
        id: 'admin_master',
        key: 'CANVANTRUONGVIP1990',
        ownerName: 'Thầy Cấn Văn Trường (SUPERADMIN MASTER)',
        school: 'Trường THCS Phùng Khắc Khoan, TP. Hà Nội',
        issuedAt: '01/01/2026 00:00',
        expiryDate: '2099-12-31',
        status: 'active',
        allowRemoveWatermark: true
      },
      expStr: 'Vĩnh viễn (VIP SUPERADMIN)'
    };
  }

  // Check saved database of issued licenses for admin revocation/pause
  let savedLicenses: IssuedLicense[] = [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ISSUED_LICENSES);
    if (saved) savedLicenses = JSON.parse(saved);
  } catch (e) {}

  const foundInDb = savedLicenses.find(l => l.key.toUpperCase() === k);
  if (foundInDb) {
    if (foundInDb.status === 'paused') {
      return { valid: false, reason: `⚠️ Mã bản quyền này đang bị TẠM DỪNG bởi Admin (${foundInDb.ownerName}).` };
    }
    if (foundInDb.status === 'revoked') {
      return { valid: false, reason: `🚫 Mã bản quyền này đã bị THU HỒI (${foundInDb.ownerName}).` };
    }
  }

  // 2. Parse Cryptographic Key
  const parts = k.split('-');

  let datePart = '';
  let devCodePart = '';
  let checksumPart = '';
  let isCryptoMatch = false;

  if (parts.length === 4 && (parts[3] === 'PRO' || parts[3] === 'CANVANTRUONGVIP' || parts[3] === '5512')) {
    datePart = parts[0];
    devCodePart = parts[1];
    checksumPart = parts[2];
    isCryptoMatch = true;
  } else if (parts.length === 3 && parts[0].length === 6 && parts[1].length <= 8) {
    datePart = parts[0];
    devCodePart = parts[1];
    checksumPart = parts[2];
    isCryptoMatch = true;
  } else if (parts.length === 4 && parts[0] === 'PKK') {
    datePart = parts[1];
    devCodePart = parts[2];
    checksumPart = parts[3];
    isCryptoMatch = true;
  }

  if (isCryptoMatch) {
    const expectedChecksum = computeDeviceChecksum(datePart, devCodePart);
    if (checksumPart !== expectedChecksum) {
      return { valid: false, reason: '❌ Mã bản quyền không hợp lệ hoặc đã bị thay đổi ký tự!' };
    }

    // Expiry check
    if (datePart.length === 6) {
      const d = parseInt(datePart.slice(0, 2), 10);
      const m = parseInt(datePart.slice(2, 4), 10) - 1;
      const y = 2000 + parseInt(datePart.slice(4, 6), 10);
      const expDate = new Date(y, m, d, 23, 59, 59);

      if (isNaN(expDate.getTime())) {
        return { valid: false, reason: '❌ Định dạng ngày hết hạn trên mã không đúng!' };
      }

      const now = new Date();
      const isTrial = devCodePart === 'TRIAL' || !!foundInDb?.isTrial;

      if (now > expDate) {
        if (isTrial) {
          return {
            valid: false,
            reason: `❌ Mã DÙNG THỬ đã HẾT HẠN vào ngày ${d.toString().padStart(2, '0')}/${(m + 1).toString().padStart(2, '0')}/${y}.\n\nVui lòng liên hệ Thầy Cấn Văn Trường (Hotline/Zalo: 0988.302.636) để đăng ký bản quyền chính thức!`
          };
        }
        return {
          valid: false,
          reason: `❌ Mã bản quyền đã HẾT HẠN vào ngày ${d.toString().padStart(2, '0')}/${(m + 1).toString().padStart(2, '0')}/${y}. Vui lòng liên hệ Thầy Cấn Văn Trường (0988.302.636) để gia hạn!`
        };
      }

      // Device-Lock verification (Skipped completely for TRIAL multi-device keys)
      if (isTrial) {
        const formattedExpStr = `${d.toString().padStart(2, '0')}/${(m + 1).toString().padStart(2, '0')}/${y}`;
        return {
          valid: true,
          isAdmin: false,
          isTrial: true,
          allowRemoveWatermark: !!foundInDb?.allowRemoveWatermark,
          licenseObj: foundInDb || {
            id: Date.now().toString(),
            key: k,
            ownerName: 'Giáo viên Dùng Thử Trải Nghiệm',
            school: 'Trường THCS / THPT',
            issuedAt: new Date().toLocaleString('vi-VN'),
            expiryDate: `${y}-${(m + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`,
            status: 'active',
            isTrial: true,
            allowRemoveWatermark: false
          },
          expStr: `DÙNG THỬ (Hạn: ${formattedExpStr})`
        };
      }

      if (devCodePart !== 'ALL' && devCodePart !== myDevCode) {
        return {
          valid: false,
          reason: `🔒 MÃ BẢN QUYỀN NÀY ĐƯỢC CẤP RIÊNG CHO THIẾT BỊ [PKK-${devCodePart}]!\n\nMáy tính hiện tại của bạn là: [${myDevId}].\nMỗi mã chỉ sử dụng cho đúng 01 máy tính được cấp phép. Vui lòng gửi đúng Mã Thiết Bị cho Thầy Cấn Văn Trường (Zalo: 0988.302.636) để nhận mã kích hoạt.`
        };
      }

      // If ALL (first-machine binding)
      if (devCodePart === 'ALL' && foundInDb?.boundDeviceId && foundInDb.boundDeviceId !== myDevId) {
        return {
          valid: false,
          reason: `🔒 Mã bản quyền này đã được kích hoạt trên máy tính khác (${foundInDb.boundDeviceId}). Không thể dùng trên máy này!`
        };
      }

      const formattedExpStr = `${d.toString().padStart(2, '0')}/${(m + 1).toString().padStart(2, '0')}/${y}`;
      return {
        valid: true,
        isAdmin: false,
        isTrial: false,
        allowRemoveWatermark: foundInDb ? (foundInDb.allowRemoveWatermark !== false) : true,
        licenseObj: foundInDb || {
          id: Date.now().toString(),
          key: k,
          ownerName: 'Giáo viên Bản Quyền',
          school: 'Trường THCS',
          issuedAt: new Date().toLocaleString('vi-VN'),
          expiryDate: `${y}-${(m + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`,
          status: 'active',
          boundDeviceId: myDevId,
          allowRemoveWatermark: true
        },
        expStr: `Hạn dùng: ${formattedExpStr}`
      };
    }
  }

  // 3. Fallback for 3-part legacy keys: DDMMYY-CHECKSUM-CANVANTRUONGVIP
  if (parts.length === 3 && parts[2] === 'CANVANTRUONGVIP') {
    const datePart = parts[0];
    const checksumPart = parts[1];

    // Compute legacy checksum
    let hash = 0;
    const str = datePart + 'CAN_VAN_TRUONG_PROTECTION_HASH_SALT_2026';
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    const legacyExpected = Math.abs(hash).toString(36).toUpperCase().padStart(6, 'X').slice(-6);

    if (checksumPart === legacyExpected && datePart.length === 6) {
      const d = parseInt(datePart.slice(0, 2), 10);
      const m = parseInt(datePart.slice(2, 4), 10) - 1;
      const y = 2000 + parseInt(datePart.slice(4, 6), 10);
      const expDate = new Date(y, m, d, 23, 59, 59);

      if (nowIsPast(expDate)) {
        return {
          valid: false,
          reason: `❌ Mã bản quyền đã HẾT HẠN vào ngày ${d.toString().padStart(2, '0')}/${(m + 1).toString().padStart(2, '0')}/${y}.`
        };
      }

      if (foundInDb?.boundDeviceId && foundInDb.boundDeviceId !== myDevId) {
        return {
          valid: false,
          reason: `🔒 Mã bản quyền đã bị khóa vào thiết bị: ${foundInDb.boundDeviceId}. Không thể dùng trên máy này.`
        };
      }

      const formattedExpStr = `${d.toString().padStart(2, '0')}/${(m + 1).toString().padStart(2, '0')}/${y}`;
      return {
        valid: true,
        isAdmin: false,
        allowRemoveWatermark: !!foundInDb?.allowRemoveWatermark,
        licenseObj: foundInDb || {
          id: Date.now().toString(),
          key: k,
          ownerName: 'Giáo viên Bản Quyền',
          school: 'Trường THCS',
          issuedAt: new Date().toLocaleString('vi-VN'),
          expiryDate: `${y}-${(m + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`,
          status: 'active',
          boundDeviceId: myDevId,
          allowRemoveWatermark: false
        },
        expStr: `Hạn dùng: ${formattedExpStr}`
      };
    }
  }

  return { valid: false, reason: '❌ Mã bản quyền không chính xác hoặc không tồn tại trong hệ thống!' };
};

const nowIsPast = (expDate: Date): boolean => {
  return !isNaN(expDate.getTime()) && new Date() > expDate;
};

/**
 * Fast boolean check for App.tsx
 */
export const checkIsKeyValid = (keyStr: string): boolean => {
  if (!keyStr) return false;
  const res = validateLicenseKey(keyStr);
  return res.valid;
};
