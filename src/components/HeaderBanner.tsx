import React, { useState, useEffect } from 'react';
import { ShieldCheck, Play, Pause, Key, BookOpen, AlertCircle, Sparkles, UserCheck, MessageSquare, User, School, LogOut, Sun, Moon, Monitor, Mic, Scan, Volume2 } from 'lucide-react';
import {
  AdminProfile,
  DEFAULT_ADMIN_PROFILE,
  fetchAdminProfile,
  subscribeAdminProfile
} from '../lib/adminConfig';
import { getCachedTeacherProfile, subscribeToTeacherProfile } from '../lib/teacherProfile';
import { TeacherProfile } from '../types';
import { getDeviceId } from '../lib/licenseUtils';

interface HeaderBannerProps {
  statusMessage: string;
  statusType: 'idle' | 'loading' | 'success' | 'warning' | 'error';
  isPaused: boolean;
  onTogglePause: () => void;
  apiKeysCount: number;
  onOpenApiGuide: () => void;
  onOpenTikzGuide?: () => void;
  onOpenLicenseModal?: () => void;
  onOpenCommunityRepo?: () => void;
  onOpenTeacherForum?: () => void;
  onOpenVoiceDocConverter?: () => void;
  onOpenAudioTts?: () => void;
  onLogout?: () => void;
  licenseExpStr?: string;
  currentTheme?: 'default' | 'dark' | 'light';
  onChangeTheme?: (theme: 'default' | 'dark' | 'light') => void;
}

export const HeaderBanner: React.FC<HeaderBannerProps> = ({
  statusMessage,
  statusType,
  isPaused,
  onTogglePause,
  apiKeysCount,
  onOpenApiGuide,
  onOpenTikzGuide,
  onOpenLicenseModal,
  onOpenCommunityRepo,
  onOpenTeacherForum,
  onOpenVoiceDocConverter,
  onOpenAudioTts,
  onLogout,
  licenseExpStr,
  currentTheme = 'default',
  onChangeTheme
}) => {
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(DEFAULT_ADMIN_PROFILE);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile>(getCachedTeacherProfile());
  const [deviceId, setDeviceId] = useState<string>('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAuthorPhotoModal, setShowAuthorPhotoModal] = useState(false);

  useEffect(() => {
    setDeviceId(getDeviceId());

    fetchAdminProfile().then(p => {
      if (p) setAdminProfile(p);
    });
    const unsubAdmin = subscribeAdminProfile(p => {
      if (p) setAdminProfile(p);
    });

    const unsubTeacher = subscribeToTeacherProfile(tp => {
      if (tp) setTeacherProfile(tp);
    });

    return () => {
      if (typeof unsubAdmin === 'function') unsubAdmin();
      if (typeof unsubTeacher === 'function') unsubTeacher();
    };
  }, []);

  const handleExecuteLogout = () => {
    setShowLogoutConfirm(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className={`border-b transition-colors ${
      currentTheme === 'light'
        ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
        : currentTheme === 'dark'
        ? 'bg-black border-slate-800 text-slate-100'
        : 'bg-slate-900 border-slate-800 text-slate-100'
    } p-3 sm:p-4 sticky top-0 z-30 shadow-md`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Branding & School/Author Info */}
        <div className="flex items-center gap-3.5">
          <div className="relative group shrink-0">
            {adminProfile.photoUrl ? (
              <img
                src={adminProfile.photoUrl}
                alt={adminProfile.fullName}
                className="w-13 h-13 sm:w-15 sm:h-15 rounded-full object-cover ring-3 ring-amber-400 ring-offset-2 ring-offset-slate-900 shrink-0 cursor-pointer shadow-xl hover:scale-105 hover:ring-amber-300 transition-all"
                onClick={() => setShowAuthorPhotoModal(true)}
                title={`Bấm để xem ảnh rõ nét của Tác giả: ${adminProfile.fullName || 'Thầy Cấn Văn Trường'}`}
              />
            ) : (
              <div
                className="w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 ring-3 ring-amber-400 ring-offset-2 ring-offset-slate-900 flex items-center justify-center text-white font-black text-sm sm:text-base shrink-0 cursor-pointer shadow-xl"
                onClick={() => setShowAuthorPhotoModal(true)}
                title={`Bấm để xem ảnh rõ nét của Tác giả: ${adminProfile.fullName || 'Thầy Cấn Văn Trường'}`}
              >
                CVT
              </div>
            )}
            <span
              className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-1 rounded-full ring-2 ring-slate-900 shadow cursor-pointer hover:scale-110 transition-transform"
              onClick={() => setShowAuthorPhotoModal(true)}
              title="Đã xác thực bản quyền VIP - Bấm để xem ảnh tác giả"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                <h1 className="text-base sm:text-lg md:text-xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                  AI LESSON PLANNER PRO
                </h1>
              </div>

              {/* Redesigned VIP Badge: Balanced, Elegant & Luxury */}
              <div
                onClick={onOpenLicenseModal}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/25 via-yellow-500/25 to-amber-500/25 border border-amber-400/80 text-amber-300 font-extrabold text-[11px] uppercase tracking-wider shadow-md hover:bg-amber-500/40 hover:border-amber-300 cursor-pointer transition-all active:scale-95"
                title="Bản quyền VIP Thầy Cấn Văn Trường - Nhấp để xem và quản lý bản quyền"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>⭐ BẢN QUYỀN VIP</span>
              </div>
            </div>
            <p className={`text-xs ${currentTheme === 'light' ? 'text-slate-600' : 'text-slate-300'} flex flex-wrap items-center gap-x-2`}>
              <span>Chủ nhiệm: <strong className="text-amber-400 font-bold hover:underline cursor-pointer" onClick={() => setShowAuthorPhotoModal(true)}>{adminProfile.fullName || 'Thầy Cấn Văn Trường'}</strong></span>
              <span>•</span>
              <span>{adminProfile.school || 'THCS Phùng Khắc Khoan, xã Tây Phương, Hà Nội'}</span>
              <span>•</span>
              <span>Zalo: <span className="font-bold text-cyan-400">{adminProfile.zalo || '0988.302.636'}</span></span>
            </p>
          </div>
        </div>

        {/* Center/Right: Personalized Teacher Badge, Theme Switcher & Action Controls */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-1.5 sm:gap-2">
          {/* Theme Selector Controls */}
          {onChangeTheme && (
            <div className={`flex items-center rounded-lg p-0.5 border ${
              currentTheme === 'light'
                ? 'bg-slate-100 border-slate-300'
                : 'bg-slate-950 border-slate-700'
            }`} title="Chọn chế độ giao diện">
              <button
                onClick={() => onChangeTheme('default')}
                className={`p-1.5 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
                  currentTheme === 'default'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Giao diện Chuẩn (Xanh Đậm Sư Phạm)"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Chuẩn</span>
              </button>
              <button
                onClick={() => onChangeTheme('dark')}
                className={`p-1.5 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
                  currentTheme === 'dark'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Giao diện Tối (Đêm Siêu Nét)"
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Tối</span>
              </button>
              <button
                onClick={() => onChangeTheme('light')}
                className={`p-1.5 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
                  currentTheme === 'light'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Giao diện Sáng (Hiện đại, Dễ đọc)"
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Sáng</span>
              </button>
            </div>
          )}

          {/* Personalized User Unit Badge */}
          {teacherProfile && (
            <button
              onClick={onOpenTeacherForum}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-all shadow-sm ${
                currentTheme === 'light'
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-300'
                  : 'bg-slate-900 hover:bg-slate-800 border-indigo-500/40'
              }`}
              title="Click để mở Diễn đàn & chỉnh sửa Hồ sơ cá nhân hóa"
            >
              {teacherProfile.avatarUrl ? (
                <img
                  src={teacherProfile.avatarUrl}
                  alt={teacherProfile.name}
                  className="w-6 h-6 rounded-full object-cover border border-amber-400 shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                  {teacherProfile.name ? teacherProfile.name.charAt(0) : 'GV'}
                </div>
              )}
              <div className="text-left leading-tight hidden sm:block">
                <div className="flex items-center gap-1">
                  <span className={`font-bold text-[11px] block whitespace-nowrap ${currentTheme === 'light' ? 'text-slate-800' : 'text-slate-100'}`}>
                    {teacherProfile.isAdmin ? 'Thầy Cấn Văn Trường' : (teacherProfile.name || 'Thầy/Cô Giáo')}
                  </span>
                  {teacherProfile.isAdmin ? (
                    <span className="bg-rose-500/20 text-rose-500 text-[9px] font-extrabold px-1.5 py-0.2 rounded border border-rose-500/40">
                      ADMIN
                    </span>
                  ) : (
                    <span className="bg-amber-500/20 text-amber-500 text-[9px] font-bold px-1.5 py-0.2 rounded border border-amber-500/40">
                      GIÁO VIÊN VIP
                    </span>
                  )}
                </div>
                <span className="text-amber-500 text-[10px] block whitespace-nowrap">
                  {teacherProfile.school || 'Đơn vị công tác'}
                </span>
              </div>
            </button>
          )}

          {onOpenTeacherForum && (
            <button
              onClick={onOpenTeacherForum}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-900/80 to-indigo-900/80 hover:from-purple-800 hover:to-indigo-800 text-purple-200 border border-purple-600/60 text-xs font-bold transition-all shadow-sm"
              title="Mở Diễn đàn Giáo viên & Nhắn tin riêng cho Admin"
            >
              <MessageSquare className="w-3.5 h-3.5 text-purple-300" />
              <span className="hidden sm:inline">Diễn Đàn GV</span>
            </button>
          )}

          {onOpenCommunityRepo && (
            <button
              onClick={onOpenCommunityRepo}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-900/80 to-indigo-900/80 hover:from-blue-800 hover:to-indigo-800 text-blue-200 border border-blue-600/60 text-xs font-bold transition-all shadow-sm"
              title="Mở Kho Tài Liệu & Văn Bản Chỉ Đạo"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Kho Tài Liệu</span>
            </button>
          )}

          {onOpenVoiceDocConverter && (
            <button
              onClick={onOpenVoiceDocConverter}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-600 via-cyan-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-900/30 active:scale-95"
              title="Mở Công cụ Chuyển đổi PDF sang Word (OCR AI) & Word sang PDF"
            >
              <Scan className="w-3.5 h-3.5 text-white" />
              <span>Chuyển Đổi OCR PDF</span>
            </button>
          )}

          {onOpenAudioTts && (
            <button
              onClick={onOpenAudioTts}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/30 active:scale-95"
              title="Đọc Văn bản, Word, PDF thành Giọng nói Audio AI (Nhiều giọng, tốc độ, không giới hạn dung lượng)"
            >
              <Volume2 className="w-3.5 h-3.5 text-white" />
              <span>Đọc Văn Bản / Audio</span>
            </button>
          )}

          {onOpenLicenseModal && (
            <button
              onClick={onOpenLicenseModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 text-xs font-semibold transition-all shadow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Bản quyền:</span> <span className="font-mono font-bold text-emerald-200">{licenseExpStr || 'VIP Vĩnh Viễn'}</span>
            </button>
          )}

          <button
            onClick={onOpenApiGuide}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              currentTheme === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">API Keys:</span> <span className="text-cyan-400 font-bold">{apiKeysCount}</span>
          </button>

          <button
            onClick={onTogglePause}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              isPaused
                ? 'bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border-amber-500/50'
                : 'bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border-blue-500/50'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isPaused ? 'Tiếp tục' : 'Tạm dừng AI'}</span>
          </button>

          {onLogout && (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Đăng xuất tài khoản và khóa ứng dụng"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Đăng xuất</span>
            </button>
          )}
        </div>
      </div>

      {/* Direct In-App Logout Modal (Clean & works reliably in iframes) */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-500/60 rounded-2xl p-6 max-w-md w-full shadow-2xl text-slate-100 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Xác nhận Đăng Xuất</h3>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn đăng xuất tài khoản và khóa phiên làm việc hiện tại trên thiết bị này không?
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleExecuteLogout}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Đồng ý Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className={`max-w-7xl mx-auto mt-2 pt-2 border-t flex items-center justify-between text-xs ${
        currentTheme === 'light' ? 'border-slate-200 text-slate-600' : 'border-slate-800/80 text-slate-400'
      }`}>
        <div className="flex items-center gap-2">
          {statusType === 'loading' && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />}
          {statusType === 'warning' && <AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
          <span
            className={`font-medium ${
              statusType === 'loading'
                ? 'text-cyan-400'
                : statusType === 'success'
                ? 'text-emerald-500'
                : statusType === 'warning'
                ? 'text-amber-500'
                : statusType === 'error'
                ? 'text-rose-500'
                : currentTheme === 'light' ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            {statusMessage}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-slate-500 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Mã máy Hardware Lock:</span>
          <span className="font-mono text-cyan-400 font-semibold">{deviceId || 'PKK-DEVICE-ID'}</span>
        </div>
      </div>

      {/* Author Photo Zoom Lightbox Modal */}
      {showAuthorPhotoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowAuthorPhotoModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAuthorPhotoModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              ✕
            </button>

            <div className="flex flex-col items-center">
              <div className="relative mb-3">
                {adminProfile.photoUrl ? (
                  <img
                    src={adminProfile.photoUrl}
                    alt={adminProfile.fullName}
                    className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl object-cover ring-4 ring-amber-400 shadow-2xl"
                  />
                ) : (
                  <div className="w-48 h-48 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 ring-4 ring-amber-400 flex items-center justify-center text-white text-4xl font-black">
                    CVT
                  </div>
                )}
                <span className="absolute -bottom-2.5 -right-2.5 bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 rounded-full shadow-lg border-2 border-slate-900">
                  ⭐ VIP TÁC GIẢ
                </span>
              </div>

              <h3 className="text-xl font-black text-white mt-2">
                {adminProfile.fullName || 'Thầy Cấn Văn Trường'}
              </h3>
              <p className="text-amber-400 font-semibold text-xs sm:text-sm mt-0.5">
                Chủ nhiệm & Tác giả Hệ thống AI Lesson Planner Pro
              </p>
              <p className="text-slate-300 text-xs mt-1">
                {adminProfile.school || 'Trường THCS Phùng Khắc Khoan - Tây Phương, Hà Nội'}
              </p>

              <div className="mt-4 pt-4 border-t border-slate-800 w-full grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Zalo / Điện thoại:</span>
                  <strong className="text-cyan-300 font-bold text-sm">{adminProfile.zalo || '0988.302.636'}</strong>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Chuyên môn:</span>
                  <strong className="text-emerald-300 font-bold text-sm">Toán & KHTN</strong>
                </div>
              </div>

              <div className="mt-4 flex gap-2 w-full">
                <button
                  onClick={() => {
                    setShowAuthorPhotoModal(false);
                    if (onOpenLicenseModal) onOpenLicenseModal();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg transition-all"
                >
                  Xem Bản Quyền & Kích Hoạt
                </button>
                <button
                  onClick={() => setShowAuthorPhotoModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
