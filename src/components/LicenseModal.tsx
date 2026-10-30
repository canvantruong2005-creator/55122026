import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Key,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Copy,
  X,
  PauseCircle,
  PlayCircle,
  Trash2,
  Laptop,
  Check,
  LogOut,
  Upload,
  User,
  Image as ImageIcon,
  Save,
  RefreshCw,
  Phone,
  Mail,
  School,
  Award,
  Globe,
  Radio,
  Plus,
  Zap,
  Activity,
  RotateCcw,
  Database,
  History,
  Download,
  HardDrive,
  Settings,
  Calendar,
  Loader2
} from 'lucide-react';
import {
  IssuedLicense,
  SystemSettings,
  getDeviceId,
  generateLicenseKey,
  validateLicenseKey,
  STORAGE_KEY_ISSUED_LICENSES,
  STORAGE_KEY_SAVED_LICENSE,
  fetchServerLicenses,
  saveLicenseToFirestore,
  deleteLicenseFromFirestore,
  subscribeToLicenses,
  fetchSystemSettings,
  saveSystemSettingsToFirestore,
  subscribeToSystemSettings
} from '../lib/licenseUtils';
import {
  getCachedTeacherProfile,
  saveTeacherProfile
} from '../lib/teacherProfile';
import {
  AdminProfile,
  SharedApiKey,
  DEFAULT_ADMIN_PROFILE,
  fetchAdminProfile,
  saveAdminProfileToFirestore,
  subscribeAdminProfile,
  fetchSharedApiKeys,
  saveSharedApiKeyToFirestore,
  bulkAddSharedApiKeys,
  deleteSharedApiKeyFromFirestore,
  subscribeSharedApiKeys,
  processAndCompressImage
} from '../lib/adminConfig';
import { testGeminiApiKey } from '../lib/geminiApi';
import {
  SystemSnapshot,
  createSystemSnapshot,
  fetchAllSnapshots,
  restoreSystemSnapshot,
  resetToFactoryDefaults
} from '../lib/backupRestoreService';

export { getDeviceId, type IssuedLicense } from '../lib/licenseUtils';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKey: string;
  onSaveKey: (key: string) => void;
  onLogout?: () => void;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({
  isOpen,
  onClose,
  currentKey,
  onSaveKey,
  onLogout
}) => {
  const [inputKey, setInputKey] = useState(currentKey || '');
  const [deviceId, setDeviceId] = useState('');
  const [activeAdminTab, setActiveAdminTab] = useState<'license' | 'generator' | 'shared_keys' | 'admin_profile' | 'backup_restore'>('license');

  const isAdminKey = (currentKey || '').toUpperCase() === 'CANVANTRUONGVIP1990';
  const currentKeyStatus = validateLicenseKey(currentKey, deviceId);
  const isRealAdmin = isAdminKey || !!currentKeyStatus.isAdmin;

  // Backup & Restore states
  const [snapshotsList, setSnapshotsList] = useState<SystemSnapshot[]>([]);
  const [snapshotNote, setSnapshotNote] = useState('');
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [isRestoringSnapshot, setIsRestoringSnapshot] = useState(false);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState('');
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(false);
  const jsonImportRef = useRef<HTMLInputElement>(null);

  // Generator states
  const [isTrialMode, setIsTrialMode] = useState(false);
  const [genAllowRemoveWatermark, setGenAllowRemoveWatermark] = useState(true);
  const [ownerName, setOwnerName] = useState('');
  const [ownerSchool, setOwnerSchool] = useState('');
  const [targetDevIdInput, setTargetDevIdInput] = useState('');
  const [genExpiryDate, setGenExpiryDate] = useState('2026-12-31');
  const [generatedKeyResult, setGeneratedKeyResult] = useState('');
  const [copyNotice, setCopyNotice] = useState(false);
  const [copiedDevId, setCopiedDevId] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Admin Profile states
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(DEFAULT_ADMIN_PROFILE);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shared API Keys states
  const [sharedKeysList, setSharedKeysList] = useState<SharedApiKey[]>([]);
  const [rawKeysInput, setRawKeysInput] = useState('');
  const [isAddingKeys, setIsAddingKeys] = useState(false);
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [keyActionMsg, setKeyActionMsg] = useState('');

  // Dynamic System Settings (e.g. trialDays)
  const [sysSettings, setSysSettings] = useState<SystemSettings>(() => {
    try {
      const cached = localStorage.getItem('lesson_planner_system_settings_v1');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return {
      appName: 'Trợ Lý Soạn Giáo Án AI Chuẩn Bộ GD&ĐT 2018',
      trialDays: 2,
      supportHotline: '0981.332.990 - Thầy Cấn Văn Trường',
      allowFreeTrial: true,
      marqueeText: 'Chào mừng Quý Thầy Cô đến với Hệ Thống Soạn Giáo Án AI Chuẩn Bộ GD&ĐT 2018'
    };
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSettingsNotice, setSaveSettingsNotice] = useState(false);

  // Registered Licenses List managed by Admin
  const [issuedLicenses, setIssuedLicenses] = useState<IssuedLicense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ISSUED_LICENSES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading licenses:', e);
    }
    return [
      {
        id: '1',
        key: 'CANVANTRUONGVIP1990',
        ownerName: 'Thầy Cấn Văn Trường (SUPERADMIN MASTER)',
        school: 'Trường THCS Phùng Khắc Khoan, TP. Hà Nội',
        issuedAt: '01/01/2026 08:00',
        expiryDate: '2099-12-31',
        status: 'active'
      }
    ];
  });

  useEffect(() => {
    setDeviceId(getDeviceId());

    // Fetch Licenses
    fetchServerLicenses().then(serverList => {
      if (serverList && serverList.length > 0) {
        setIssuedLicenses(serverList);
      }
    });

    const unsubLicenses = subscribeToLicenses((newList) => {
      if (newList && newList.length > 0) {
        setIssuedLicenses(newList);
      }
    });

    // Fetch Admin Profile
    fetchAdminProfile().then(p => {
      if (p) setAdminProfile(p);
    });

    const unsubProfile = subscribeAdminProfile((p) => {
      if (p) setAdminProfile(p);
    });

    // Fetch Shared API Keys
    fetchSharedApiKeys().then(keys => {
      if (keys) setSharedKeysList(keys);
    });

    const unsubKeys = subscribeSharedApiKeys((keys) => {
      if (keys) setSharedKeysList(keys);
    });

    // Fetch System Settings
    fetchSystemSettings().then(st => {
      if (st) setSysSettings(st);
    });

    const unsubSettings = subscribeToSystemSettings((st) => {
      if (st) setSysSettings(st);
    });

    return () => {
      if (typeof unsubLicenses === 'function') unsubLicenses();
      if (typeof unsubProfile === 'function') unsubProfile();
      if (typeof unsubKeys === 'function') unsubKeys();
      if (typeof unsubSettings === 'function') unsubSettings();
    };
  }, []);

  useEffect(() => {
    setInputKey(currentKey || '');
  }, [currentKey]);

  if (!isOpen) return null;

  const handleApplyKey = async () => {
    setMessage(null);
    const res = validateLicenseKey(inputKey, deviceId);
    if (!res.valid) {
      setMessage({ text: res.reason || 'Mã bản quyền không hợp lệ!', type: 'error' });
      return;
    }

    const upper = inputKey.trim().toUpperCase();
    onSaveKey(upper);
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_LICENSE, upper);
    } catch (e) {}

    // Update teacher profile
    const cachedProfile = getCachedTeacherProfile();
    let finalName = '';
    let finalSchool = '';

    if (res.isAdmin) {
      finalName = 'Thầy Cấn Văn Trường';
      finalSchool = 'Trường THCS Phùng Khắc Khoan';
    } else {
      if (res.licenseObj?.ownerName && res.licenseObj.ownerName !== 'Giáo viên Bản Quyền' && res.licenseObj.ownerName !== 'Thầy Cấn Văn Trường (SUPERADMIN MASTER)' && res.licenseObj.ownerName !== 'Giáo viên Dùng Thử Trải Nghiệm') {
        finalName = res.licenseObj.ownerName;
      } else if (cachedProfile.name && cachedProfile.name !== 'Thầy Cấn Văn Trường' && cachedProfile.name !== 'Giáo viên') {
        finalName = cachedProfile.name;
      } else {
        finalName = 'Thầy/Cô Giáo';
      }

      if (res.licenseObj?.school && res.licenseObj.school !== 'Trường THCS Phùng Khắc Khoan, TP. Hà Nội') {
        finalSchool = res.licenseObj.school;
      } else if (cachedProfile.school && cachedProfile.school !== 'Trường THCS Phùng Khắc Khoan' && cachedProfile.school !== 'Trường THCS') {
        finalSchool = cachedProfile.school;
      } else {
        finalSchool = 'Trường THCS';
      }
    }

    await saveTeacherProfile({
      ...cachedProfile,
      name: finalName,
      school: finalSchool,
      isAdmin: !!res.isAdmin,
      isVip: true,
      boundDeviceId: deviceId
    });

    setMessage({
      text: `✅ Cập nhật bản quyền thành công: ${res.expStr || 'Hợp lệ'}`,
      type: 'success'
    });

    setTimeout(() => {
      if (upper === 'CANVANTRUONGVIP1990') {
        setActiveAdminTab('generator');
      } else {
        onClose();
      }
    }, 1000);
  };

  const setQuickExpiryDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setGenExpiryDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleAdminGenerateKey = async () => {
    if (!genExpiryDate) {
      alert('Vui lòng chọn ngày hết hạn!');
      return;
    }
    const name = ownerName.trim() || (isTrialMode ? 'Giáo viên Dùng Thử Trải Nghiệm' : 'Giáo viên Bản Quyền');
    const school = ownerSchool.trim() || (isTrialMode ? 'Dùng thử Đa trường THCS / THPT' : 'Trường THCS');
    const targetDev = isTrialMode ? 'TRIAL' : (targetDevIdInput.trim() || 'ALL');

    const newKey = generateLicenseKey(genExpiryDate, targetDev, isTrialMode);

    const newLicense: IssuedLicense = {
      id: Date.now().toString(),
      key: newKey,
      ownerName: name,
      school: school,
      issuedAt: new Date().toLocaleString('vi-VN'),
      expiryDate: genExpiryDate,
      status: 'active',
      boundDeviceId: (!isTrialMode && targetDev !== 'ALL') ? (targetDev.startsWith('PKK-') ? targetDev : `PKK-${targetDev}`) : undefined,
      isTrial: isTrialMode,
      allowRemoveWatermark: genAllowRemoveWatermark
    };

    const nextList = [newLicense, ...issuedLicenses];
    setIssuedLicenses(nextList);
    await saveLicenseToFirestore(newLicense);
    setGeneratedKeyResult(newKey);
    setOwnerName('');
    setOwnerSchool('');
  };

  const handleCopyGeneratedKey = () => {
    if (!generatedKeyResult) return;
    navigator.clipboard.writeText(generatedKeyResult);
    setCopyNotice(true);
    setTimeout(() => setCopyNotice(false), 2000);
  };

  const handleToggleLicenseStatus = async (id: string) => {
    const target = issuedLicenses.find(l => l.id === id);
    if (!target) return;
    const nextStatus = target.status === 'active' ? 'paused' : 'active';
    const updated: IssuedLicense = { ...target, status: nextStatus as any };

    setIssuedLicenses(prev => prev.map(l => (l.id === id ? updated : l)));
    await saveLicenseToFirestore(updated);
  };

  const handleUnbindDevice = async (id: string) => {
    const target = issuedLicenses.find(l => l.id === id);
    if (!target) return;
    const updated: IssuedLicense = { ...target, boundDeviceId: undefined };
    setIssuedLicenses(prev => prev.map(l => (l.id === id ? updated : l)));
    await saveLicenseToFirestore(updated);
  };

  const handleToggleWatermarkPerm = async (id: string) => {
    const target = issuedLicenses.find(l => l.id === id);
    if (!target) return;
    const nextPerm = !target.allowRemoveWatermark;
    const updated: IssuedLicense = { ...target, allowRemoveWatermark: nextPerm };
    const nextList = issuedLicenses.map(l => (l.id === id ? updated : l));
    setIssuedLicenses(nextList);
    localStorage.setItem(STORAGE_KEY_ISSUED_LICENSES, JSON.stringify(nextList));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('licenses_updated'));
    }
    await saveLicenseToFirestore(updated);
  };

  const handleDeleteLicense = async (id: string) => {
    if (!isRealAdmin) {
      alert('Chức năng xóa bản quyền chỉ dành riêng cho tài khoản Admin Thầy Cấn Văn Trường!');
      return;
    }
    setIssuedLicenses(prev => prev.filter(l => l.id !== id));
    await deleteLicenseFromFirestore(id);
  };

  // Profile Upload & Save Handlers
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedDataUrl = await processAndCompressImage(file, 600, 0.85);
      setAdminProfile(prev => ({ ...prev, photoUrl: compressedDataUrl }));
    } catch (err) {
      alert('Không thể xử lý ảnh: ' + String(err));
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setProfileSuccessMsg('');
    try {
      await saveAdminProfileToFirestore(adminProfile);
      setProfileSuccessMsg('✅ Đã lưu hồ sơ và ảnh Admin thành công lên Cloud Firestore!');
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    } catch (err) {
      alert('Lỗi lưu thông tin: ' + String(err));
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Shared Keys Handlers
  const handleAddSharedKeys = async () => {
    if (!rawKeysInput.trim()) {
      alert('Vui lòng dán ít nhất 1 API Key Gemini!');
      return;
    }

    setIsAddingKeys(true);
    setKeyActionMsg('');
    try {
      const count = await bulkAddSharedApiKeys(rawKeysInput, 'Key Dùng Chung');
      setKeyActionMsg(`🎉 Đã thêm thành công ${count} API Key vào kho dùng chung toàn hệ thống!`);
      setRawKeysInput('');
      const updated = await fetchSharedApiKeys();
      setSharedKeysList(updated);
      setTimeout(() => setKeyActionMsg(''), 4000);
    } catch (err) {
      alert('Lỗi thêm API Keys: ' + String(err));
    } finally {
      setIsAddingKeys(false);
    }
  };

  const handleToggleKeyStatus = async (item: SharedApiKey) => {
    const newStatus = item.status === 'active' ? 'paused' : 'active';
    const updated: SharedApiKey = { ...item, status: newStatus, updatedAt: new Date().toLocaleString('vi-VN') };
    await saveSharedApiKeyToFirestore(updated);
    setSharedKeysList(prev => prev.map(k => k.id === item.id ? updated : k));
  };

  const handleDeleteSharedKey = async (id: string) => {
    if (!isRealAdmin) {
      alert('Chức năng xóa API Key chỉ dành riêng cho tài khoản Admin Thầy Cấn Văn Trường!');
      return;
    }
    try {
      await deleteSharedApiKeyFromFirestore(id);
      setSharedKeysList(prev => prev.filter(k => k.id !== id));
    } catch (e) {
      console.warn('Delete shared key error:', e);
    }
  };

  const handleTestSharedKey = async (item: SharedApiKey) => {
    setTestingKeyId(item.id);
    try {
      const result = await testGeminiApiKey(item.key);
      const updated: SharedApiKey = {
        ...item,
        lastTestedAt: new Date().toLocaleString('vi-VN'),
        testStatus: result.valid ? 'valid' : 'invalid'
      };
      await saveSharedApiKeyToFirestore(updated);
      setSharedKeysList(prev => prev.map(k => k.id === item.id ? updated : k));

      if (result.valid) {
        alert(`✅ Key [${item.label}] hoạt động TỐT với model [${result.model}]!`);
      } else {
        alert(`❌ Key [${item.label}] KHÔNG hoạt động: ${result.error}`);
      }
    } catch (e: any) {
      alert('Lỗi kiểm tra key: ' + (e?.message || e));
    } finally {
      setTestingKeyId(null);
    }
  };

  // Backup & Restore Handlers
  const handleLoadSnapshots = async () => {
    setIsLoadingSnapshots(true);
    try {
      const list = await fetchAllSnapshots();
      setSnapshotsList(list);
    } catch (err) {
      console.warn('Load snapshots error:', err);
    } finally {
      setIsLoadingSnapshots(false);
    }
  };

  const handleCreateSnapshot = async () => {
    setIsCreatingSnapshot(true);
    setRestoreSuccessMsg('');
    try {
      const snap = await createSystemSnapshot(snapshotNote.trim() || 'Bản sao lưu thủ công');
      setSnapshotsList(prev => [snap, ...prev]);
      setSnapshotNote('');
      setRestoreSuccessMsg(`✅ Đã tạo điểm khôi phục [${snap.note}] thành công!`);
      setTimeout(() => setRestoreSuccessMsg(''), 4000);
    } catch (err: any) {
      alert('Lỗi tạo bản sao lưu: ' + (err?.message || err));
    } finally {
      setIsCreatingSnapshot(false);
    }
  };

  const handleRestoreSnapshot = async (snap: SystemSnapshot) => {
    setIsRestoringSnapshot(true);
    setRestoreSuccessMsg('');
    try {
      const success = await restoreSystemSnapshot(snap);
      if (success) {
        setRestoreSuccessMsg(`🎉 ĐÃ KHÔI PHỤC HỆ THỐNG THÀNH CÔNG VỀ ĐIỂM [${snap.createdAt}]! Trang sẽ tự làm mới sau 2 giây...`);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err: any) {
      alert('Lỗi khôi phục hệ thống: ' + (err?.message || err));
    } finally {
      setIsRestoringSnapshot(false);
    }
  };

  const handleDownloadSnapshotFile = (snap: SystemSnapshot) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snap, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `ai_lesson_planner_backup_${snap.id}_${snap.createdAt.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  const handleImportSnapshotFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const jsonStr = ev.target?.result as string;
        const snap = JSON.parse(jsonStr) as SystemSnapshot;
        if (!snap.data) {
          alert('Tệp JSON không đúng định dạng bản sao lưu của hệ thống!');
          return;
        }
        await handleRestoreSnapshot(snap);
      } catch (err: any) {
        alert('Lỗi đọc tệp sao lưu: ' + (err?.message || err));
      }
    };
    reader.readAsText(file);
  };

  const handleResetFactory = async () => {
    resetToFactoryDefaults();
  };

  useEffect(() => {
    if (activeAdminTab === 'backup_restore') {
      handleLoadSnapshots();
    }
  }, [activeAdminTab]);

  const maskKey = (raw: string): string => {
    if (!raw) return '';
    if (raw.length <= 12) return raw;
    return `${raw.slice(0, 8)}...${raw.slice(-6)}`;
  };

  const activeSharedCount = sharedKeysList.filter(k => k.status === 'active').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl space-y-4 text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            {adminProfile.photoUrl ? (
              <img
                src={adminProfile.photoUrl}
                alt={adminProfile.fullName}
                className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shadow-md"
              />
            ) : (
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
            )}
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>{isAdminKey ? 'TRUNG TÂM QUẢN TRỊ ADMIN & BẢN QUYỀN' : 'THÔNG TIN BẢN QUYỀN HỆ THỐNG'}</span>
                {isAdminKey && (
                  <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                    SUPERADMIN
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Tác giả: <strong className="text-slate-200">{adminProfile.fullName}</strong> | Hotline/Zalo: <span className="text-cyan-300 font-bold">{adminProfile.zalo}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Navigation Tabs (Visible when SuperAdmin is active) */}
        {isAdminKey && (
          <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveAdminTab('license')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeAdminTab === 'license'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Bản Quyền Máy Này</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('generator')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeAdminTab === 'generator'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Cấp Mã Bản Quyền ({issuedLicenses.length})</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('shared_keys')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeAdminTab === 'shared_keys'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-emerald-300" />
              <span>API Keys Dùng Chung ({activeSharedCount}/{sharedKeysList.length})</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('admin_profile')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeAdminTab === 'admin_profile'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5 text-purple-300" />
              <span>Hồ Sơ & Ảnh Admin</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('backup_restore')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeAdminTab === 'backup_restore'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-300" />
              <span>Khôi Phục & Sao Lưu ({snapshotsList.length})</span>
            </button>
          </div>
        )}

        {/* TAB 1: LICENSE STATUS & ACTIVATION */}
        {(!isAdminKey || activeAdminTab === 'license') && (
          <div className="space-y-4">
            {/* Current status display */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Trạng thái bản quyền:</span>
                <span className={`font-bold px-2.5 py-0.5 rounded text-[11px] ${currentKeyStatus.valid ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'}`}>
                  {currentKeyStatus.valid ? (currentKeyStatus.expStr || 'HỢP LỆ') : 'CHƯA KÍCH HOẠT'}
                </span>
              </div>

              {currentKeyStatus.licenseObj?.ownerName && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Chủ sở hữu bản quyền:</span>
                  <strong className="text-amber-300 font-semibold">
                    {currentKeyStatus.licenseObj.ownerName} {currentKeyStatus.licenseObj.school ? `- ${currentKeyStatus.licenseObj.school}` : ''}
                  </strong>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">Mã Thiết Bị Máy Tính (Device ID):</span>
                <div className="flex items-center gap-2">
                  <strong className="font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 text-[11px]">
                    {deviceId}
                  </strong>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(deviceId);
                      setCopiedDevId(true);
                      setTimeout(() => setCopiedDevId(false), 2000);
                    }}
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    {copiedDevId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedDevId ? 'Đã sao chép' : 'Sao chép'}
                  </button>
                </div>
              </div>
            </div>

            {/* Change key form */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <label className="block font-bold text-slate-200">
                GIA HẠN / ĐỔI MÃ BẢN QUYỀN MỚI (HOẶC NHẬP MÃ ADMIN):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputKey}
                  onChange={e => setInputKey(e.target.value)}
                  placeholder="Nhập mã bản quyền hoặc mã Admin (CANVANTRUONGVIP1990)..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-cyan-300 font-mono text-xs focus:border-cyan-500 focus:outline-none"
                />
                <button
                  onClick={handleApplyKey}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow text-xs flex items-center gap-1 shrink-0"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Kích hoạt</span>
                </button>
              </div>

              {message && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                    message.type === 'success'
                      ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/80 border-rose-800 text-rose-300'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <div>{message.text}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ADMIN GENERATOR */}
        {isAdminKey && activeAdminTab === 'generator' && (
          <div className="space-y-4 text-xs">
            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-amber-900/40">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider text-xs">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>TẠO MÃ BẢN QUYỀN MỚI CHO GIÁO VIÊN</span>
                </h3>
              </div>

              {/* Type selector: Official single-device vs Multi-device Trial */}
              <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTrialMode(false)}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
                    !isTrialMode
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🔒 Mã Chính Thức (Khóa 1 Máy)
                </button>
                <button
                  type="button"
                  onClick={() => setIsTrialMode(true)}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
                    isTrialMode
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ✨ Mã DÙNG THỬ (Mọi Máy Chạy Được)
                </button>
              </div>

              {isTrialMode && (
                <div className="p-2.5 rounded-lg bg-purple-950/60 border border-purple-800/80 text-[11px] text-purple-200 leading-relaxed">
                  💡 <strong>Chế độ Dùng Thử:</strong> Mã sinh ra có thể kích hoạt trên <strong>bất kỳ máy tính / giáo viên nào</strong> mà không bị ràng buộc mã phần cứng, tự động hết hạn chính xác vào ngày bạn đặt bên dưới.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    {isTrialMode ? 'Ghi chú gói dùng thử:' : 'Tên Giáo viên:'}
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                    placeholder={isTrialMode ? 'VD: Đợt Dùng thử Hội đồng Sư phạm' : 'VD: Cô Nguyễn Thị Mai'}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Trường / Đơn vị:</label>
                  <input
                    type="text"
                    value={ownerSchool}
                    onChange={e => setOwnerSchool(e.target.value)}
                    placeholder="VD: THCS Phùng Khắc Khoan"
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {!isTrialMode ? (
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Mã Thiết Bị (Device ID) của Giáo viên:</label>
                    <input
                      type="text"
                      value={targetDevIdInput}
                      onChange={e => setTargetDevIdInput(e.target.value)}
                      placeholder="VD: PKK-8C42A1 (để trống nếu tự khóa máy đầu tiên)"
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-cyan-300 font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] text-purple-300 block mb-1 font-semibold">Phạm vi thiết bị:</label>
                    <div className="w-full bg-purple-950/40 border border-purple-800/80 rounded p-2 text-purple-300 font-medium text-[11px] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Không giới hạn máy (Mọi thiết bị)</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Ngày hết hạn:</label>
                  <input
                    type="date"
                    value={genExpiryDate}
                    onChange={e => setGenExpiryDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <div className="text-[11px] text-slate-400 mb-1">Chọn nhanh thời hạn:</div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQuickExpiryDays(3)}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px]"
                  >
                    +3 Ngày
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickExpiryDays(7)}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px]"
                  >
                    +7 Ngày (1 tuần)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickExpiryDays(14)}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px]"
                  >
                    +14 Ngày (2 tuần)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickExpiryDays(30)}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px]"
                  >
                    +30 Ngày (1 tháng)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenExpiryDate('2026-12-31')}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px]"
                  >
                    Hết năm 2026
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenExpiryDate('2027-05-31')}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px]"
                  >
                    Cuối năm học 2026-2027
                  </button>
                </div>
              </div>

              {/* Watermark Configuration for Generated Key */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>Quyền Ẩn Watermark trên mã này (Chỉ Admin cấp):</span>
                  </div>
                  <p className="text-[10.5px] text-slate-400">
                    {genAllowRemoveWatermark
                      ? '✓ Mã này được phép Ẩn hoàn toàn Watermark trên bản xem trước & khi xuất file.'
                      : '🔒 Mã này bắt buộc hiện dấu Watermark (Giáo viên không thể tự ẩn được).'
                    }
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setGenAllowRemoveWatermark(prev => !prev)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    genAllowRemoveWatermark
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900 shadow-sm'
                      : 'bg-rose-950 text-rose-300 border-rose-800 hover:bg-rose-900'
                  }`}
                >
                  {genAllowRemoveWatermark ? '💎 Cho phép Ẩn Watermark' : '🔒 Khóa Watermark'}
                </button>
              </div>

              <button
                onClick={handleAdminGenerateKey}
                className={`w-full py-2.5 text-white font-bold rounded-lg shadow transition-all flex items-center justify-center gap-1.5 ${
                  isTrialMode
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500'
                    : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500'
                }`}
              >
                <Key className="w-4 h-4" />
                <span>{isTrialMode ? '+ TẠO MÃ DÙNG THỬ ĐA THIẾT BỊ' : '+ TẠO MÃ BẢN QUYỀN CHÍNH THỨC'}</span>
              </button>

              {generatedKeyResult && (
                <div className="p-3 rounded-lg bg-slate-900 border border-amber-700/80 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-mono text-amber-300 font-bold text-xs break-all">{generatedKeyResult}</div>
                    <button
                      onClick={handleCopyGeneratedKey}
                      className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1 shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copyNotice ? 'Đã chép!' : 'Sao chép'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* List */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="font-semibold text-slate-300">Danh sách đã cấp ({issuedLicenses.length}):</div>
                <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                  {issuedLicenses.map(lic => {
                    const isLicTrial = lic.isTrial || lic.key.includes('-TRIAL-');
                    return (
                      <div key={lic.id} className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-white">{lic.ownerName}</span>
                            <span className="text-[10px] text-slate-400">({lic.school})</span>
                            {isLicTrial ? (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                                DÙNG THỬ
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                                CHÍNH THỨC
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-cyan-300 text-[11px]">{lic.key}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2">
                            <span>Hạn: <strong className="text-amber-400">{lic.expiryDate}</strong></span>
                            <span>|</span>
                            <span>{isLicTrial ? 'Thiết bị: Mọi máy' : `Khóa: ${lic.boundDeviceId || 'Chưa khóa'}`}</span>
                            <span>|</span>
                            <span className={lic.allowRemoveWatermark ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                              {lic.allowRemoveWatermark ? '💎 Không Watermark' : '🔒 Có Watermark'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleWatermarkPerm(lic.id)}
                            className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                              lic.allowRemoveWatermark
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                            }`}
                            title={lic.allowRemoveWatermark ? 'Đang mở quyền Xóa Watermark (Bấm để khóa lại)' : 'Bấm để CẤP QUYỀN Xóa Watermark thời gian thực cho mã này'}
                          >
                            {lic.allowRemoveWatermark ? '💎 Đã gỡ Watermark' : '🔒 Khóa Watermark'}
                          </button>
                          {!isLicTrial && lic.boundDeviceId && (
                            <button
                              onClick={() => handleUnbindDevice(lic.id)}
                              className="px-1.5 py-1 rounded bg-slate-800 text-cyan-300 text-[10px] hover:bg-slate-700"
                              title="Bỏ khóa máy"
                            >
                              Bỏ khóa
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleLicenseStatus(lic.id)}
                            className="p-1 rounded bg-slate-800 text-amber-300 hover:bg-slate-700"
                            title={lic.status === 'active' ? 'Tạm dừng' : 'Kích hoạt lại'}
                          >
                            {lic.status === 'active' ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                          </button>
                          {lic.key !== 'CANVANTRUONGVIP1990' && (
                            <button
                              onClick={() => handleDeleteLicense(lic.id)}
                              className="p-1 rounded bg-slate-800 text-rose-300 hover:bg-slate-700"
                              title="Xóa mã"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Trial Duration Configuration */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-900/50 space-y-3">
                <div className="font-bold text-amber-300 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Settings className="w-4 h-4 text-amber-400" />
                    <span>Cấu hình Thời gian Dùng Thử Trực Tiếp (Nút 1-Click trên màn hình Đăng nhập):</span>
                  </div>
                  {saveSettingsNotice && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700 animate-pulse">
                      ✓ Đã lưu cài đặt lên Cloud!
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Thiết lập số ngày dùng thử cho nút <strong>"KÍCH HOẠT DÙNG THỬ"</strong> trên giao diện đăng nhập (thời gian thực tính từ lúc người dùng ấn nút, tự động lưu Firestore và đồng bộ toàn hệ thống):
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  {[1, 2, 3, 5, 7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={async () => {
                        const updated = { ...sysSettings, trialDays: days };
                        setSysSettings(updated);
                        setIsSavingSettings(true);
                        await saveSystemSettingsToFirestore(updated);
                        setIsSavingSettings(false);
                        setSaveSettingsNotice(true);
                        setTimeout(() => setSaveSettingsNotice(false), 2500);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                        (sysSettings.trialDays || 2) === days
                          ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md shadow-amber-500/20'
                          : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {days} ngày
                    </button>
                  ))}
                  <div className="flex items-center gap-1 ml-auto text-xs text-slate-400">
                    <span>Hiện tại:</span>
                    <strong className="text-amber-300 font-bold text-sm">{sysSettings.trialDays || 2} ngày</strong>
                    {isSavingSettings && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400 ml-1" />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SHARED API KEYS POOL */}
        {isAdminKey && activeAdminTab === 'shared_keys' && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider text-xs">
                    <Key className="w-4 h-4 text-emerald-400" />
                    <span>KHO API KEY GEMINI DÙNG CHUNG TOÀN HỆ THỐNG</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Các API Key bạn thêm tại đây sẽ được lưu trên Cloud Firestore và <strong>tự động chia sẻ cho tất cả giáo viên</strong> sử dụng mà không cần nhập thủ công.
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold text-xs">
                    {activeSharedCount} Key Đang Hoạt Động
                  </span>
                </div>
              </div>

              {/* Add form */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-[11px] font-bold text-slate-300">
                  THÊM API KEY MỚI (DÁN 1 HOẶC NHIỀU KEY, MỖI DÒNG 1 KEY HOẶC CÁCH NHAU BẰNG DẤU PHẨY):
                </label>
                <textarea
                  value={rawKeysInput}
                  onChange={e => setRawKeysInput(e.target.value)}
                  placeholder="Dán các mã API Key Gemini (bắt đầu bằng AIzaSy... hoặc AQ.Ab8RN...)"
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 font-mono text-cyan-300 text-xs focus:border-emerald-500 focus:outline-none"
                />

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    Lấy key miễn phí tại: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-semibold">aistudio.google.com</a>
                  </span>

                  <button
                    onClick={handleAddSharedKeys}
                    disabled={isAddingKeys}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow text-xs flex items-center gap-1.5 shrink-0 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAddingKeys ? 'Đang thêm...' : '+ Thêm Vào Kho Dùng Chung'}</span>
                  </button>
                </div>

                {keyActionMsg && (
                  <div className="p-2.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{keyActionMsg}</span>
                  </div>
                )}
              </div>

              {/* Keys list */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">
                    Danh Sách API Keys Trong Kho ({sharedKeysList.length}):
                  </span>
                  <button
                    onClick={async () => {
                      const updated = await fetchSharedApiKeys();
                      setSharedKeysList(updated);
                    }}
                    className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Làm mới danh sách</span>
                  </button>
                </div>

                {sharedKeysList.length === 0 ? (
                  <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs">
                    Chưa có API Key nào trong kho đám mây. Hãy dán các API Key của bạn vào ô trên để chia sẻ cho Thầy Cô!
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {sharedKeysList.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">{item.label || `Key #${idx + 1}`}</span>
                            <span
                              className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                                item.status === 'active'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}
                            >
                              {item.status === 'active' ? 'ĐANG BẬT' : 'TẠM DỪNG'}
                            </span>

                            {item.testStatus === 'valid' && (
                              <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 text-[10px] border border-cyan-800 flex items-center gap-1">
                                <Zap className="w-2.5 h-2.5 text-cyan-400" />
                                <span>Live OK</span>
                              </span>
                            )}
                            {item.testStatus === 'invalid' && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 text-[10px] border border-rose-800 flex items-center gap-1">
                                <span>Lỗi/Die</span>
                              </span>
                            )}
                          </div>

                          <div className="font-mono text-cyan-300 text-[11px] truncate">
                            {maskKey(item.key)}
                          </div>

                          <div className="text-[10px] text-slate-400">
                            Thêm lúc: {item.createdAt} {item.lastTestedAt ? `| Test gần nhất: ${item.lastTestedAt}` : ''}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleTestSharedKey(item)}
                            disabled={testingKeyId === item.id}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-medium flex items-center gap-1"
                            title="Kiểm tra kết nối Gemini"
                          >
                            <Activity className={`w-3 h-3 ${testingKeyId === item.id ? 'animate-spin' : ''}`} />
                            <span>{testingKeyId === item.id ? 'Test...' : 'Test Key'}</span>
                          </button>

                          <button
                            onClick={() => handleToggleKeyStatus(item)}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300"
                            title={item.status === 'active' ? 'Tạm dừng key này' : 'Kích hoạt lại key này'}
                          >
                            {item.status === 'active' ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => handleDeleteSharedKey(item.id)}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-400"
                            title="Xóa vĩnh viễn"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ADMIN PROFILE & AVATAR UPLOAD */}
        {isAdminKey && activeAdminTab === 'admin_profile' && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-purple-900/40 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-purple-400 flex items-center gap-1.5 uppercase tracking-wider text-xs">
                    <User className="w-4 h-4 text-purple-400" />
                    <span>CẬP NHẬT HỒ SƠ & ẢNH ĐẠI DIỆN ADMIN (THẦY CẤN VĂN TRƯỜNG)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Thông tin và ảnh của bạn sẽ được lưu trên Cloud Firestore và đồng bộ hiển thị trang trọng trên Header Banner, Tab 10 và các tài liệu xuất bản.
                  </p>
                </div>
              </div>

              {/* Photo Upload Section */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group shrink-0">
                  {adminProfile.photoUrl ? (
                    <img
                      src={adminProfile.photoUrl}
                      alt="Admin Avatar"
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-purple-500 shadow-xl"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-purple-950/60 border-2 border-dashed border-purple-500/50 flex flex-col items-center justify-center text-purple-300">
                      <ImageIcon className="w-8 h-8 opacity-60" />
                      <span className="text-[10px] mt-1">Chưa có ảnh</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex-1 text-center sm:text-left">
                  <div className="font-bold text-slate-200">Ảnh Đại Diện Tác Giả / Admin:</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Hỗ trợ file ảnh JPG, PNG, WEBP. Ảnh được tự động nén nét đẹp và tối ưu hóa dung lượng lưu trữ đám mây.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{adminProfile.photoUrl ? 'Đổi ảnh đại diện' : 'Tải ảnh đại diện lên'}</span>
                    </button>

                    {adminProfile.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setAdminProfile(prev => ({ ...prev, photoUrl: '' }))}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-semibold"
                      >
                        Xóa ảnh
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Details Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] text-slate-300 font-bold block mb-1">
                    Họ và Tên Tác Giả / Admin:
                  </label>
                  <input
                    type="text"
                    value={adminProfile.fullName}
                    onChange={e => setAdminProfile(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:border-purple-500 focus:outline-none"
                    placeholder="VD: Thầy Cấn Văn Trường"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 font-bold block mb-1">
                    Chức danh / Chuyên môn:
                  </label>
                  <input
                    type="text"
                    value={adminProfile.title}
                    onChange={e => setAdminProfile(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:border-purple-500 focus:outline-none"
                    placeholder="VD: Giáo viên Toán - Tác giả Phần mềm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-300 font-bold block mb-1">
                    Đơn vị công tác / Địa chỉ:
                  </label>
                  <input
                    type="text"
                    value={adminProfile.school}
                    onChange={e => setAdminProfile(prev => ({ ...prev, school: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:border-purple-500 focus:outline-none"
                    placeholder="VD: Trường THCS Phùng Khắc Khoan, xã Tây Phương, TP. Hà Nội"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 font-bold block mb-1">
                    Số Điện Thoại / Zalo Hỗ Trợ:
                  </label>
                  <input
                    type="text"
                    value={adminProfile.zalo}
                    onChange={e => setAdminProfile(prev => ({ ...prev, zalo: e.target.value, phone: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-cyan-300 font-mono font-bold focus:border-purple-500 focus:outline-none"
                    placeholder="VD: 0988.302.636"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 font-bold block mb-1">
                    Email Liên Hệ:
                  </label>
                  <input
                    type="email"
                    value={adminProfile.email}
                    onChange={e => setAdminProfile(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:border-purple-500 focus:outline-none"
                    placeholder="VD: canvantruong2010@gmail.com"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-300 font-bold block mb-1">
                    Lời Giới Thiệu / Thông Điệp Gửi Thầy Cô:
                  </label>
                  <textarea
                    value={adminProfile.bio}
                    onChange={e => setAdminProfile(prev => ({ ...prev, bio: e.target.value }))}
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:border-purple-500 focus:outline-none"
                    placeholder="Lời giới thiệu..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-300 font-bold block mb-1">
                    Thành Tích / Danh Hiệu Sư Phạm:
                  </label>
                  <input
                    type="text"
                    value={adminProfile.achievements}
                    onChange={e => setAdminProfile(prev => ({ ...prev, achievements: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:border-purple-500 focus:outline-none"
                    placeholder="VD: Giáo viên Dạy Giỏi - Tiên phong Chuyển đổi số Giáo dục"
                  />
                </div>
              </div>

              {profileSuccessMsg && (
                <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg shadow text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingProfile ? 'Đang lưu lên Cloud...' : 'LƯU HỒ SƠ & ẢNH ADMIN LÊN CLOUD FIRESTORE'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: SYSTEM BACKUP & RESTORE POINTS */}
        {isAdminKey && activeAdminTab === 'backup_restore' && (
          <div className="space-y-4 text-xs">
            {/* Create Snapshot & Export / Import Bar */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-rose-900/40">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider text-xs">
                  <RotateCcw className="w-4 h-4 text-rose-400" />
                  <span>TẠO ĐIỂM KHÔI PHỤC & SAO LƯU TOÀN BỘ WEBSITE</span>
                </h3>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-semibold border border-rose-600/40">
                  Phòng ngừa lỗi khi Admin thêm/xóa/sửa
                </span>
              </div>

              <p className="text-slate-300 text-[11px] leading-relaxed">
                Hệ thống sao lưu toàn diện: Lưu giữ tức thì toàn bộ <strong>Hồ sơ lớp học, Bài viết diễn đàn, Tài liệu cộng đồng, Mô phỏng tương tác, Cấu hình giáo viên & Cài đặt hệ thống</strong>. Nếu việc thêm xóa nội dung khiến website bị lỗi, bạn có thể bấm 1 nút để khôi phục chính xác về thời điểm trước đó!
              </p>

              {/* Create Snapshot input */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-800/80">
                <input
                  type="text"
                  value={snapshotNote}
                  onChange={e => setSnapshotNote(e.target.value)}
                  placeholder="Nhập ghi chú điểm khôi phục (VD: Trước khi xóa bài viết diễn đàn, Cập nhật mẫu giáo án mới...)"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:border-rose-500 focus:outline-none text-xs"
                />
                <button
                  onClick={handleCreateSnapshot}
                  disabled={isCreatingSnapshot}
                  className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-lg shadow text-xs flex items-center justify-center gap-1.5 shrink-0 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{isCreatingSnapshot ? 'Đang tạo...' : 'TẠO BẢN SAO LƯU NGAY'}</span>
                </button>
              </div>

              {/* Import / Export JSON buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={jsonImportRef}
                    onChange={handleImportSnapshotFile}
                    accept=".json"
                    className="hidden"
                  />
                  <button
                    onClick={() => jsonImportRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-semibold text-[11px] flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Nhập file sao lưu (.JSON) từ máy tính</span>
                  </button>
                </div>

                <button
                  onClick={handleResetFactory}
                  className="px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 font-semibold text-[11px] flex items-center gap-1.5"
                  title="Xóa toàn bộ chỉnh sửa và đưa về mặc định ban đầu"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Khôi Phục Về Mặc Định Gốc (Factory Reset)</span>
                </button>
              </div>

              {restoreSuccessMsg && (
                <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{restoreSuccessMsg}</span>
                </div>
              )}
            </div>

            {/* Snapshots History List */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-rose-400" />
                  <span className="font-bold text-slate-200">
                    DANH SÁCH CÁC ĐIỂM KHÔI PHỤC ĐÃ LƯU ({snapshotsList.length})
                  </span>
                </div>
                <button
                  onClick={handleLoadSnapshots}
                  disabled={isLoadingSnapshots}
                  className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingSnapshots ? 'animate-spin' : ''}`} />
                  <span>Làm mới danh sách</span>
                </button>
              </div>

              {snapshotsList.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  <Database className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p>Chưa có điểm khôi phục nào được tạo. Hãy bấm <strong>Tạo bản sao lưu ngay</strong> ở trên để lưu lại trạng thái hệ thống!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {snapshotsList.map((snap) => (
                    <div
                      key={snap.id}
                      className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-rose-300 text-xs">{snap.note || 'Bản sao lưu'}</span>
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                            {snap.createdAt}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-0.5">
                          <span>👤 Tạo bởi: <strong className="text-slate-300">{snap.authorName || 'Admin'}</strong></span>
                          <span>📚 Lớp: {Object.keys(snap.data?.classProfiles || {}).length}</span>
                          <span>💬 Diễn đàn: {snap.data?.forumMessages?.length || 0} bài</span>
                          <span>🔬 Mô phỏng: {snap.data?.simulations?.length || 0}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => handleDownloadSnapshotFile(snap)}
                          className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold flex items-center gap-1"
                          title="Tải tệp sao lưu .JSON về máy"
                        >
                          <Download className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Tải về</span>
                        </button>

                        <button
                          onClick={() => handleRestoreSnapshot(snap)}
                          disabled={isRestoringSnapshot}
                          className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow"
                          title="Khôi phục website về chính xác trạng thái này"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{isRestoringSnapshot ? 'Đang khôi phục...' : 'Khôi Phục Điểm Này'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
