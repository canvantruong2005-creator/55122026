import React, { useState, useEffect } from 'react';
import { ShieldCheck, Key, Lock, CheckCircle2, AlertTriangle, Sparkles, Copy, X, PauseCircle, PlayCircle, Trash2, User, Clock, Monitor, RefreshCw, PhoneCall, Check, Laptop, ShieldAlert, School, Gift, Zap, Loader2, Settings, Calendar } from 'lucide-react';
import {
  IssuedLicense,
  SystemSettings,
  getDeviceId,
  getDeviceCode,
  generateLicenseKey,
  validateLicenseKey,
  activate2DayTrial,
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

interface LicenseGateProps {
  currentKey: string;
  onActivateKey: (key: string) => void;
  isOpenAsAdminModal?: boolean;
  onCloseAdminModal?: () => void;
}

export const LicenseGate: React.FC<LicenseGateProps> = ({
  currentKey,
  onActivateKey,
  isOpenAsAdminModal = false,
  onCloseAdminModal
}) => {
  const [inputKey, setInputKey] = useState(currentKey || '');
  const [deviceId, setDeviceId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copiedDevId, setCopiedDevId] = useState(false);
  const [isActivatingTrial, setIsActivatingTrial] = useState(false);

  // Teacher Identity Inputs
  const [teacherNameInput, setTeacherNameInput] = useState(() => {
    const cached = getCachedTeacherProfile();
    return cached.name && cached.name !== 'Giáo viên' && cached.name !== 'Thầy Cấn Văn Trường' ? cached.name : '';
  });
  const [teacherSchoolInput, setTeacherSchoolInput] = useState(() => {
    const cached = getCachedTeacherProfile();
    return cached.school && cached.school !== 'Trường THCS' && cached.school !== 'Trường THCS Phùng Khắc Khoan' ? cached.school : '';
  });

  // Admin Management Form State
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isTrialMode, setIsTrialMode] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const [ownerSchool, setOwnerSchool] = useState('');
  const [targetDevIdInput, setTargetDevIdInput] = useState('');
  const [genExpiryDate, setGenExpiryDate] = useState('2026-12-31');
  const [generatedKeyResult, setGeneratedKeyResult] = useState('');
  const [copyNotice, setCopyNotice] = useState(false);

  // Registered Licenses List
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

  useEffect(() => {
    const devId = getDeviceId();
    setDeviceId(devId);

    // Initial fetch from Firestore
    fetchServerLicenses().then(serverList => {
      if (serverList && serverList.length > 0) {
        setIssuedLicenses(serverList);
      }
    });

    fetchSystemSettings().then(settings => {
      if (settings) {
        setSysSettings(settings);
      }
    });

    // Realtime Firestore subscriber
    const unsubscribeLicenses = subscribeToLicenses((newList) => {
      if (newList && newList.length > 0) {
        setIssuedLicenses(newList);
      }
    });

    const unsubscribeSettings = subscribeToSystemSettings((newSettings) => {
      if (newSettings) {
        setSysSettings(newSettings);
      }
    });

    return () => {
      if (typeof unsubscribeLicenses === 'function') unsubscribeLicenses();
      if (typeof unsubscribeSettings === 'function') unsubscribeSettings();
    };
  }, []);

  // When input key matches an issued license, auto-fill teacher name & school
  const handleKeyChange = (newKey: string) => {
    setInputKey(newKey);
    const upper = newKey.trim().toUpperCase();
    if (upper === 'CANVANTRUONGVIP1990') {
      setTeacherNameInput('Thầy Cấn Văn Trường');
      setTeacherSchoolInput('Trường THCS Phùng Khắc Khoan');
      return;
    }

    const matched = issuedLicenses.find(l => l.key.toUpperCase() === upper);
    if (matched) {
      if (matched.ownerName && matched.ownerName !== 'Giáo viên Bản Quyền' && matched.ownerName !== 'Thầy Cấn Văn Trường (SUPERADMIN MASTER)') {
        setTeacherNameInput(matched.ownerName);
      }
      if (matched.school && matched.school !== 'Trường THCS Phùng Khắc Khoan, TP. Hà Nội') {
        setTeacherSchoolInput(matched.school);
      }
    }
  };

  // Validation function
  const handleActivate = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!inputKey.trim()) {
      setErrorMessage('Vui lòng nhập mã số bản quyền để kích hoạt!');
      return;
    }

    const upperKey = inputKey.trim().toUpperCase();
    const res = validateLicenseKey(upperKey, deviceId);
    if (!res.valid) {
      setErrorMessage(res.reason || 'Mã bản quyền không hợp lệ!');
      return;
    }
    
    // 1. Save license key to local storage immediately
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_LICENSE, upperKey);
    } catch (e) {}

    // 2. Synchronize Teacher Profile immediately
    const cachedProfile = getCachedTeacherProfile();
    let finalName = '';
    let finalSchool = '';

    if (res.isAdmin) {
      finalName = 'Thầy Cấn Văn Trường';
      finalSchool = 'Trường THCS Phùng Khắc Khoan';
    } else {
      if (teacherNameInput.trim()) {
        finalName = teacherNameInput.trim();
      } else if (res.licenseObj?.ownerName && res.licenseObj.ownerName !== 'Giáo viên Bản Quyền' && res.licenseObj.ownerName !== 'Thầy Cấn Văn Trường (SUPERADMIN MASTER)' && res.licenseObj.ownerName !== 'Giáo viên Dùng Thử Trải Nghiệm') {
        finalName = res.licenseObj.ownerName;
      } else {
        finalName = 'Thầy/Cô Giáo';
      }

      if (teacherSchoolInput.trim()) {
        finalSchool = teacherSchoolInput.trim();
      } else if (res.licenseObj?.school && res.licenseObj.school !== 'Trường THCS Phùng Khắc Khoan, TP. Hà Nội') {
        finalSchool = res.licenseObj.school;
      } else {
        finalSchool = 'Trường THCS';
      }
    }

    const updatedProfile = {
      ...cachedProfile,
      name: finalName,
      school: finalSchool,
      isAdmin: !!res.isAdmin,
      isVip: true,
      boundDeviceId: deviceId
    };

    try {
      localStorage.setItem('app_teacher_profile_v2', JSON.stringify(updatedProfile));
    } catch (e) {}

    // Non-blocking Firestore push in background
    saveTeacherProfile(updatedProfile).catch((err) => {
      console.warn('Background profile sync notice:', err);
    });

    setSuccessMessage(`✅ KÍCH HOẠT THÀNH CÔNG! Chào mừng ${finalName} (${finalSchool}).`);

    // 3. Immediately notify parent App to unlock UI
    onActivateKey(upperKey);
    if (isOpenAsAdminModal && onCloseAdminModal) {
      onCloseAdminModal();
    }

    if (res.isAdmin) {
      setShowAdminPanel(true);
    }
  };

  // Quick 2-Day Trial Activation for Teachers
  const handleActivateTrial2Days = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsActivatingTrial(true);

    try {
      const finalName = teacherNameInput.trim() || 'Thầy/Cô Giáo';
      const finalSchool = teacherSchoolInput.trim() || 'Trường THCS / THPT';

      const trialRes = await activate2DayTrial(finalName, finalSchool);

      if (!trialRes.success) {
        setErrorMessage(trialRes.message);
        setIsActivatingTrial(false);
        return;
      }

      if (trialRes.key) {
        setInputKey(trialRes.key);
        // Synchronize teacher profile
        const cachedProfile = getCachedTeacherProfile();
        await saveTeacherProfile({
          ...cachedProfile,
          name: finalName,
          school: finalSchool,
          isAdmin: false,
          isVip: true,
          boundDeviceId: deviceId
        });

        setSuccessMessage(`🎉 ${trialRes.message}`);

        setTimeout(() => {
          if (trialRes.key) {
            onActivateKey(trialRes.key);
          }
          if (isOpenAsAdminModal && onCloseAdminModal) {
            onCloseAdminModal();
          }
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(`Lỗi kích hoạt dùng thử: ${err?.message || 'Vui lòng thử lại!'}`);
    } finally {
      setIsActivatingTrial(false);
    }
  };

  const setQuickExpiryDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setGenExpiryDate(`${yyyy}-${mm}-${dd}`);
  };

  // Generate Key for Admin
  const handleAdminGenerateKey = async () => {
    if (!genExpiryDate) {
      alert('Vui lòng chọn ngày hết hạn bản quyền!');
      return;
    }
    const name = ownerName.trim() || (isTrialMode ? 'Giáo viên Dùng Thử Trải Nghiệm' : 'Giáo viên Bản Quyền');
    const school = ownerSchool.trim() || (isTrialMode ? 'Dùng thử Đa trường THCS / THPT' : 'Trường THCS');

    // Generate cryptographic key bound to target device or multi-device trial
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
      isTrial: isTrialMode
    };

    const nextList = [newLicense, ...issuedLicenses];
    setIssuedLicenses(nextList);
    await saveLicenseToFirestore(newLicense);
    setGeneratedKeyResult(newKey);
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

  const handleRevokeLicense = async (id: string) => {
    const target = issuedLicenses.find(l => l.id === id);
    if (!target) return;
    const updated: IssuedLicense = { ...target, status: 'revoked' as const };
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

  const handleDeleteLicense = async (id: string) => {
    setIssuedLicenses(prev => prev.filter(l => l.id !== id));
    await deleteLicenseFromFirestore(id);
  };

  const isCurrentKeyAdmin = (currentKey || '').toUpperCase() === 'CANVANTRUONGVIP1990';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-3xl w-full p-6 shadow-2xl shadow-cyan-950/60 space-y-6 text-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                HỆ THỐNG KIỂM SOÁT BẢN QUYỀN AI LESSON PLANNER PRO
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40">
                  Chuẩn 5512
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Bản quyền: <strong>Thầy Cấn Văn Trường</strong> - Trường THCS Phùng Khắc Khoan, TP. Hà Nội | Zalo: <span className="text-cyan-300 font-bold">0988.302.636</span>
              </p>
            </div>
          </div>

          {isOpenAsAdminModal && onCloseAdminModal && (
            <button
              onClick={onCloseAdminModal}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Lock Screen Notice */}
        {!isOpenAsAdminModal && (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Ứng dụng đang được khóa bảo vệ bản quyền:</strong> Mỗi mã kích hoạt được mã hóa và cố định với <strong>01 máy tính duy nhất</strong>. Thầy/cô vui lòng nhập mã bản quyền hợp lệ để tiếp tục sử dụng.
            </div>
          </div>
        )}

        {/* Device ID Banner */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-300">
            <Laptop className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <span className="text-slate-400">Mã Thiết Bị Máy Tính Của Thầy/Cô (Device ID):</span>
              <div className="mt-0.5">
                <strong className="text-cyan-300 font-mono text-sm bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-800/80 tracking-wider">
                  {deviceId || 'Đang nhận diện...'}
                </strong>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (deviceId) {
                navigator.clipboard.writeText(deviceId);
                setCopiedDevId(true);
                setTimeout(() => setCopiedDevId(false), 2000);
              }
            }}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-white bg-cyan-950 hover:bg-cyan-900 px-3 py-2 rounded-lg border border-cyan-700/80 transition-all shadow-sm shrink-0"
          >
            {copiedDevId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedDevId ? 'Đã sao chép Mã Máy!' : 'Sao chép Mã Thiết Bị'}</span>
          </button>
        </div>

        {/* Free Trial Direct Card for Teachers */}
        {!isOpenAsAdminModal && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-amber-500/10 via-amber-900/20 to-slate-950 border border-amber-500/40 p-4 sm:p-5 shadow-xl shadow-amber-950/30">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Left Details */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[11px] font-black uppercase tracking-wide shadow-sm">
                    <Gift className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Miễn Phí Dùng Thử</span>
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-1">
                    <span>Trải nghiệm trọn vẹn 100% tính năng trong</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-200 border border-amber-400/40 font-black">
                      {sysSettings.trialDays || 2} Ngày
                    </span>
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                  Dành riêng cho Quý Thầy/Cô muốn dùng thử ngay lập tức. Ấn nút để hệ thống tự động cấp quyền <strong>DÙNG THỬ {sysSettings.trialDays || 2} NGÀY</strong> (thời gian tính từ lúc kích hoạt; sau đó hệ thống sẽ yêu cầu mã bản quyền chính thức).
                </p>
              </div>

              {/* Right CTA Button */}
              <div className="flex sm:justify-end shrink-0">
                <button
                  type="button"
                  onClick={handleActivateTrial2Days}
                  disabled={isActivatingTrial}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] border border-amber-200/80 cursor-pointer disabled:opacity-50"
                >
                  {isActivatingTrial ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Đang cấp quyền dùng thử...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-slate-950 text-slate-950" />
                      <span>KÍCH HOẠT DÙNG THỬ {sysSettings.trialDays || 2} NGÀY</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Input Form */}
        <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <label className="block text-xs font-bold text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              1. NHẬP MÃ SỐ BẢN QUYỀN ĐỂ MỞ KHÓA:
            </span>
            <span className="text-[11px] text-amber-400 font-normal">Cố định 01 máy tính</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={inputKey}
              onChange={e => handleKeyChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleActivate();
                }
              }}
              placeholder="Dán mã bản quyền được cấp vào đây (VD: 311226-8C42A1-K8X9Y2-...)"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-cyan-300 font-mono text-xs focus:border-cyan-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleActivate}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer active:scale-95"
            >
              <Key className="w-4 h-4" />
              <span>KÍCH HOẠT BẢN QUYỀN</span>
            </button>
          </div>

          {/* Teacher Info Customization on Login */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-amber-300">
                <User className="w-3.5 h-3.5 text-amber-400" />
                2. THÔNG TIN ĐỊNH DANH GIÁO VIÊN & ĐƠN VỊ CÔNG TÁC:
              </span>
              <span className="text-[10px] text-cyan-400 font-semibold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                Quản lý bởi Admin
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-medium">Họ & Tên Giáo viên:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={teacherNameInput}
                    onChange={e => setTeacherNameInput(e.target.value)}
                    placeholder="VD: Cô Nguyễn Thị Mai, Thầy Trần Minh..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-xs text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-medium">Trường / Đơn vị công tác:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={teacherSchoolInput}
                    onChange={e => setTeacherSchoolInput(e.target.value)}
                    placeholder="VD: THCS Chu Văn An, THPT Lê Quý Đôn..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-xs text-amber-200 placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 italic">
              * Sau khi kích hoạt, thông tin Tên giáo viên và Trường học sẽ được <strong>khóa cố định theo máy</strong> để Admin quản lý bản quyền.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5 whitespace-pre-line leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>{successMessage}</div>
            </div>
          )}
        </div>

        {/* Contact Support Info */}
        <div className="bg-gradient-to-r from-cyan-950/40 via-blue-950/40 to-slate-950 p-4 rounded-xl border border-cyan-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4 text-cyan-400" />
              <span>Chưa có mã hoặc cần cấp quyền sử dụng?</span>
            </div>
            <div className="text-slate-400 text-[11px] mt-0.5">
              Thầy/cô vui lòng sao chép <strong>Mã Thiết Bị (Device ID)</strong> ở trên gửi cho <strong>Thầy Cấn Văn Trường</strong> qua Zalo: <strong className="text-cyan-300">0988.302.636</strong>.
            </div>
          </div>
          <a
            href="https://zalo.me/0988302636"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow transition-all shrink-0 flex items-center gap-1.5"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Nhắn Zalo Thầy Trường</span>
          </a>
        </div>

        {/* Admin Management Section (Visible for Admin) */}
        {(isCurrentKeyAdmin || showAdminPanel || isOpenAsAdminModal) && (
          <div className="border-t border-slate-800 pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Bảng Điều Khiển Cấp Mã Bản Quyền (Admin Thầy Cấn Văn Trường)</span>
              </h3>
              <button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="text-[11px] text-cyan-400 hover:underline font-semibold"
              >
                {showAdminPanel ? '▼ Thu gọn bảng' : '▶ Mở rộng bảng quản trị'}
              </button>
            </div>

            {(showAdminPanel || isOpenAsAdminModal) && (
              <div className="space-y-4 bg-slate-950 p-4 rounded-xl border border-amber-900/40 text-xs">
                {/* 1. Generate New Key Form */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      <span>1. Cấp Mã Bản Quyền (Admin Thầy Cấn Văn Trường):</span>
                    </div>
                    <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-mono">
                      SUPERADMIN
                    </span>
                  </div>

                  {/* Mode switcher */}
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
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        {isTrialMode ? 'Ghi chú đợt dùng thử:' : 'Họ tên Giáo viên:'}
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
                      <label className="text-[11px] text-slate-400 block mb-1">Trường THCS / Đơn vị:</label>
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
                        <label className="text-[11px] text-slate-400 block mb-1">
                          Mã Thiết Bị (Device ID) của Giáo viên:
                        </label>
                        <input
                          type="text"
                          value={targetDevIdInput}
                          onChange={e => setTargetDevIdInput(e.target.value)}
                          placeholder="VD: PKK-8C42A1 (hoặc để trống nếu tự khóa máy đầu tiên)"
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
                      <label className="text-[11px] text-slate-400 block mb-1">Ngày hết hạn bản quyền:</label>
                      <input
                        type="date"
                        value={genExpiryDate}
                        onChange={e => setGenExpiryDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
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

                  <button
                    onClick={handleAdminGenerateKey}
                    className={`w-full py-2.5 text-white font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 mt-2 ${
                      isTrialMode
                        ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500'
                        : 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isTrialMode ? '+ TẠO MÃ DÙNG THỬ ĐA THIẾT BỊ' : '+ TẠO MÃ BẢN QUYỀN CHÍNH THỨC'}</span>
                  </button>

                  {generatedKeyResult && (
                    <div className="p-3 rounded-lg bg-slate-900 border border-amber-700 space-y-2 mt-2">
                      <div className="text-[11px] text-amber-300 font-semibold">Mã bản quyền đã tạo thành công:</div>
                      <div className="flex items-center justify-between gap-2 bg-slate-950 p-2.5 rounded border border-amber-800">
                        <div className="font-mono text-amber-300 font-bold text-xs break-all">{generatedKeyResult}</div>
                        <button
                          onClick={handleCopyGeneratedKey}
                          className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1 shrink-0 shadow"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copyNotice ? 'Đã chép!' : 'Sao chép mã'}</span>
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-400 italic">
                        {generatedKeyResult.includes('-TRIAL-') ? (
                          <span className="text-purple-300 font-semibold">✨ Mã DÙNG THỬ đa thiết bị (Hạn dùng: {genExpiryDate}). Thầy Trường gửi mã này qua Zalo cho các thầy cô trải nghiệm trên mọi máy tính!</span>
                        ) : (
                          <span>Thầy Trường gửi mã này qua Zalo cho giáo viên để kích hoạt trên máy tính của họ.</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. List of Managed Licenses */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="font-bold text-slate-200 flex items-center justify-between">
                    <span>2. Danh sách Mã Bản Quyền Đã Cấp ({issuedLicenses.length}):</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {issuedLicenses.map(lic => {
                      const isLicTrial = lic.isTrial || lic.key.includes('-TRIAL-');
                      return (
                        <div
                          key={lic.id}
                          className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                            lic.status === 'paused'
                              ? 'bg-amber-950/30 border-amber-800/50 text-amber-300'
                              : lic.status === 'revoked'
                              ? 'bg-rose-950/30 border-rose-800/50 text-rose-300'
                              : 'bg-slate-900 border-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <strong className="text-white font-semibold">{lic.ownerName}</strong>
                              <span className="text-[11px] text-slate-400">({lic.school})</span>
                              {isLicTrial ? (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                                  DÙNG THỬ
                                </span>
                              ) : (
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                    lic.status === 'active'
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                      : lic.status === 'paused'
                                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                                  }`}
                                >
                                  {lic.status === 'active' ? 'Đang hoạt động' : lic.status === 'paused' ? 'Tạm dừng' : 'Đã thu hồi'}
                                </span>
                              )}
                            </div>

                            <div className="font-mono text-cyan-300 text-[11px] select-all break-all">
                              {lic.key}
                            </div>

                            <div className="text-[10px] text-slate-400 flex flex-wrap items-center gap-3">
                              <span>Hạn: <strong className="text-slate-200">{lic.expiryDate}</strong></span>
                              <span>
                                {isLicTrial ? (
                                  <strong className="text-purple-300">Phạm vi: Mọi máy tính (Đa thiết bị)</strong>
                                ) : (
                                  <>Khóa thiết bị: <strong className="text-cyan-300 font-mono">{lic.boundDeviceId || 'Chưa khóa (tự khóa máy đầu)'}</strong></>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 self-end sm:self-center">
                            {!isLicTrial && lic.boundDeviceId && (
                              <button
                                onClick={() => handleUnbindDevice(lic.id)}
                                title="Bỏ khóa máy để giáo viên đổi máy tính khác"
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] border border-slate-700"
                              >
                                Bỏ khóa máy
                              </button>
                            )}

                            <button
                              onClick={() => handleToggleLicenseStatus(lic.id)}
                              className={`p-1.5 rounded text-[11px] ${
                                lic.status === 'active'
                                  ? 'bg-amber-900/60 hover:bg-amber-800 text-amber-300'
                                  : 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300'
                              }`}
                              title={lic.status === 'active' ? 'Tạm dừng mã này' : 'Kích hoạt lại mã'}
                            >
                              {lic.status === 'active' ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                            </button>

                            {lic.key !== 'CANVANTRUONGVIP1990' && (
                              <button
                                onClick={() => handleDeleteLicense(lic.id)}
                                className="p-1.5 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-300 text-[11px]"
                                title="Xóa mã này"
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

                {/* 3. Dynamic Trial Duration Configuration */}
                <div className="space-y-2 pt-3 border-t border-slate-800">
                  <div className="font-bold text-amber-300 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 text-amber-400" />
                      <span>3. Cấu hình Thời gian Dùng Thử Trực Tiếp (Nút 1-Click):</span>
                    </div>
                    {saveSettingsNotice && (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700 animate-pulse">
                        ✓ Đã lưu cài đặt!
                      </span>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2.5">
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Thời hạn dùng thử cho nút <strong>"KÍCH HOẠT DÙNG THỬ"</strong> trên giao diện đăng nhập (tính thời gian thực từ lúc người dùng ấn nút, tự động lưu Firestore):
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
                        <strong className="text-amber-300 font-bold">{sysSettings.trialDays || 2} ngày</strong>
                        {isSavingSettings && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400 ml-1" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
