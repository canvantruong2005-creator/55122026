import React, { useState, useEffect } from 'react';
import { ClassProfile, LessonItem } from '../../types';
import { SUBJECT_LIST, SUB_SUBJECTS, TEXTBOOK_LIST, TEXTBOOK_TAP } from '../../data/defaults';
import {
  Save,
  Trash2,
  Plus,
  Minus,
  BookOpen,
  Layers,
  CheckSquare,
  Settings2,
  Sparkles,
  X,
  User,
  Phone,
  Mail,
  School,
  Award,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Key,
  ArrowRight
} from 'lucide-react';
import {
  AdminProfile,
  DEFAULT_ADMIN_PROFILE,
  fetchAdminProfile,
  subscribeAdminProfile
} from '../../lib/adminConfig';
import { DigitalCompetencyAndAISelectorModal } from '../modals/DigitalCompetencyAndAISelectorModal';

interface Tab1ClassProfileProps {
  profile: ClassProfile;
  onChangeProfile: (profile: ClassProfile) => void;
  savedProfiles: Record<string, ClassProfile>;
  onSaveProfile: () => void;
  onDeleteProfile: () => void;
  lessonText: string;
  onChangeLessonText: (text: string) => void;
  selectedPP: string;
  onChangePP: (pp: string) => void;
  selectedKT: string;
  onChangeKT: (kt: string) => void;
  ppList: string[];
  ktList: string[];
  onAddPP: (pp: string) => void;
  onDelPP: (pp: string) => void;
  onAddKT: (kt: string) => void;
  onDelKT: (kt: string) => void;
  specificGoals: string;
  onChangeSpecificGoals: (text: string) => void;
  // Multi-period split goals toggle requested by user!
  isSplitMultiPeriodGoals: boolean;
  onToggleSplitMultiPeriodGoals: (val: boolean) => void;
  onNavigateTab?: (tabNumber: number) => void;
  onOpenLicenseModal?: () => void;
  onOpenApiGuide?: () => void;
}

export const Tab1ClassProfile: React.FC<Tab1ClassProfileProps> = ({
  profile,
  onChangeProfile,
  savedProfiles,
  onSaveProfile,
  onDeleteProfile,
  lessonText,
  onChangeLessonText,
  selectedPP,
  onChangePP,
  selectedKT,
  onChangeKT,
  ppList,
  ktList,
  onAddPP,
  onDelPP,
  onAddKT,
  onDelKT,
  specificGoals,
  onChangeSpecificGoals,
  isSplitMultiPeriodGoals,
  onToggleSplitMultiPeriodGoals,
  onNavigateTab,
  onOpenLicenseModal,
  onOpenApiGuide
}) => {
  const [isNlsModalOpen, setIsNlsModalOpen] = useState(false);
  const [newPPInput, setNewPPInput] = useState('');
  const [newKTInput, setNewKTInput] = useState('');
  const [copiedZalo, setCopiedZalo] = useState(false);
  const [authorProfile, setAuthorProfile] = useState<AdminProfile>(DEFAULT_ADMIN_PROFILE);

  useEffect(() => {
    fetchAdminProfile().then(p => {
      if (p) setAuthorProfile(p);
    });
    const unsub = subscribeAdminProfile(p => {
      if (p) setAuthorProfile(p);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const handleCopyZalo = () => {
    const phone = authorProfile.zalo || '0988302636';
    navigator.clipboard.writeText(phone.replace(/\D/g, ''));
    setCopiedZalo(true);
    setTimeout(() => setCopiedZalo(false), 2500);
  };

  const availableSubSubjects = SUB_SUBJECTS[profile.mon] || SUB_SUBJECTS["Mặc định"];

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMon = e.target.value;
    const newSub = SUB_SUBJECTS[newMon] ? SUB_SUBJECTS[newMon][0] : "Chung";
    onChangeProfile({
      ...profile,
      mon: newMon,
      phan_mon: newSub
    });
  };

  const handleSelectClass = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLop = e.target.value;
    if (savedProfiles[selectedLop]) {
      onChangeProfile(savedProfiles[selectedLop]);
    } else {
      onChangeProfile({ ...profile, lop: selectedLop });
    }
  };

  const handleAddPP = () => {
    if (newPPInput.trim()) {
      onAddPP(newPPInput.trim());
      setNewPPInput('');
    }
  };

  const handleAddKT = () => {
    if (newKTInput.trim()) {
      onAddKT(newKTInput.trim());
      setNewKTInput('');
    }
  };

  return (
    <div className="space-y-6">
      {/* 🌟 AUTHOR SHOWCASE & SYSTEM HUB BANNER (DỄ THẤY TRÊN TRANG CHỦ) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-purple-500/40 rounded-2xl p-5 shadow-xl text-slate-100 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-5">
          {/* Author Avatar & Main Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="relative shrink-0 group">
              {authorProfile.photoUrl ? (
                <img
                  src={authorProfile.photoUrl}
                  alt={authorProfile.fullName}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-amber-400 shadow-lg shadow-purple-950/60 cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => onNavigateTab && onNavigateTab(10)}
                  title="Nhấn để xem thông tin tác giả và quản trị hệ thống"
                />
              ) : (
                <div
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-purple-800 to-indigo-700 border-2 border-amber-400 flex flex-col items-center justify-center text-white shadow-lg cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => onNavigateTab && onNavigateTab(10)}
                >
                  <User className="w-8 h-8 text-amber-300 mb-1" />
                  <span className="font-extrabold text-[10px] tracking-wider">THẦY TRƯỜNG</span>
                </div>
              )}
              <span className="absolute -bottom-2 -right-1 bg-amber-500 text-slate-950 text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow uppercase border border-slate-900">
                Tác Giả
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>{authorProfile.fullName || 'Thầy Cấn Văn Trường'}</span>
                  <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                    TÁC GIẢ HỆ THỐNG
                  </span>
                </h3>
              </div>

              <p className="text-xs text-amber-300 font-semibold">
                {authorProfile.title || 'Giáo viên - Tác giả Hệ thống AI Lesson Planner Pro'}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <School className="w-3.5 h-3.5 text-cyan-400" />
                  {authorProfile.school || 'THCS Phùng Khắc Khoan, Hà Nội'}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  Hotline / Zalo: <strong className="text-amber-300 font-mono">{authorProfile.zalo || '0988.302.636'}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  <code>{authorProfile.email || 'canvantruong2010@gmail.com'}</code>
                </span>
              </div>

              {/* API Priority & Status Indicator */}
              <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px]">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-semibold flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sẵn sàng sử dụng (Ưu tiên: Key có sẵn &rarr; Key Admin &rarr; Key Cá nhân)</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 font-medium">
                  Chuẩn CV 2345 (Tiểu học) & CV 5512 (THCS-THPT)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-row md:flex-col items-center justify-center gap-2 shrink-0 w-full md:w-auto">
            <button
              onClick={handleCopyZalo}
              className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow flex items-center justify-center gap-1.5 transition-all"
              title="Sao chép số điện thoại Zalo"
            >
              {copiedZalo ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedZalo ? 'Đã chép Zalo!' : 'Sao chép Zalo Thầy Trường'}</span>
            </button>

            <a
              href={`https://zalo.me/${(authorProfile.zalo || '0988302636').replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow flex items-center justify-center gap-1.5 transition-all text-center"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Mở Chat Zalo</span>
            </a>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab(10)}
                className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-700/60 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Award className="w-3.5 h-3.5 text-purple-300" />
                <span>Xem Cẩm Nang & Bản Quyền</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 1. Class Profile Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">
              1. Hồ sơ Lớp học & Cấu hình Hành chính
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSaveProfile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow"
            >
              <Save className="w-3.5 h-3.5" />
              Lưu Hồ sơ Lớp
            </button>
            <button
              onClick={onDeleteProfile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-800 hover:bg-rose-700 text-white font-semibold text-xs transition-all shadow"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa Lớp
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Subject */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Môn học (GDPT 2018):</label>
            <select
              value={profile.mon}
              onChange={handleSubjectChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-medium focus:border-cyan-500 focus:outline-none"
            >
              {SUBJECT_LIST.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* Sub Subject */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Phân môn / Mạch kiến thức:</label>
            <select
              value={profile.phan_mon}
              onChange={e => onChangeProfile({ ...profile, phan_mon: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-medium focus:border-cyan-500 focus:outline-none"
            >
              {availableSubSubjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* Class selection (Clean dropdown & custom input, avoiding vertical gaps) */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
              <span>Lớp học & Khối cấp:</span>
              <span className="text-[10px] text-cyan-400 font-normal">Tiểu học: 1-5 | THCS: 6-9 | THPT: 10-12</span>
            </label>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={profile.lop}
                  onChange={e => onChangeProfile({ ...profile, lop: e.target.value })}
                  placeholder="Gõ tên lớp (VD: 7A1, 1A, 10A1...)"
                  className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-medium focus:border-cyan-500 focus:outline-none text-xs"
                  title="Nhập tên lớp cụ thể của bạn"
                />
                <select
                  value={profile.lop}
                  onChange={e => {
                    const val = e.target.value;
                    if (!val) return;
                    if (savedProfiles[val]) {
                      onChangeProfile(savedProfiles[val]);
                      return;
                    }
                    if (val === '1A1') {
                      onChangeProfile({
                        ...profile,
                        lop: '1A1',
                        mon: profile.mon?.includes('Tiểu học') ? profile.mon : 'Tiếng Việt (Tiểu học)',
                        thoiluong: '35 phút (Tiểu học)',
                        loaiga: 'Kế hoạch bài dạy chuẩn CV 2345 (Tiểu học)'
                      });
                    } else if (val === '2A') {
                      onChangeProfile({
                        ...profile,
                        lop: '2A',
                        mon: profile.mon?.includes('Tiểu học') ? profile.mon : 'Toán (Tiểu học)',
                        thoiluong: '35 phút (Tiểu học)',
                        loaiga: 'Kế hoạch bài dạy chuẩn CV 2345 (Tiểu học)'
                      });
                    } else if (val === '3A1') {
                      onChangeProfile({
                        ...profile,
                        lop: '3A1',
                        mon: profile.mon?.includes('Tiểu học') ? profile.mon : 'Tự nhiên và Xã hội (Tiểu học)',
                        thoiluong: '35 phút (Tiểu học)',
                        loaiga: 'Kế hoạch bài dạy chuẩn CV 2345 (Tiểu học)'
                      });
                    } else if (val === '4A1') {
                      onChangeProfile({
                        ...profile,
                        lop: '4A1',
                        mon: profile.mon?.includes('Tiểu học') ? profile.mon : 'Khoa học (Tiểu học)',
                        thoiluong: '35 phút (Tiểu học)',
                        loaiga: 'Kế hoạch bài dạy chuẩn CV 2345 (Tiểu học)'
                      });
                    } else if (val === '5A1') {
                      onChangeProfile({
                        ...profile,
                        lop: '5A1',
                        mon: profile.mon?.includes('Tiểu học') ? profile.mon : 'Toán (Tiểu học)',
                        thoiluong: '35 phút (Tiểu học)',
                        loaiga: 'Kế hoạch bài dạy chuẩn CV 2345 (Tiểu học)'
                      });
                    } else if (['6A', '7A1', '8A2', '9A'].includes(val)) {
                      onChangeProfile({
                        ...profile,
                        lop: val,
                        thoiluong: '45 phút (THCS / THPT)',
                        loaiga: 'Giáo án Bài học chuẩn 5512 (THCS / THPT)'
                      });
                    } else if (['10A1', '11A', '12A'].includes(val)) {
                      onChangeProfile({
                        ...profile,
                        lop: val,
                        thoiluong: '45 phút (THCS / THPT)',
                        loaiga: 'Giáo án Bài học chuẩn 5512 (THCS / THPT)'
                      });
                    } else {
                      onChangeProfile({ ...profile, lop: val });
                    }
                  }}
                  className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-medium focus:border-cyan-500 focus:outline-none text-xs"
                >
                  <option value="">-- Chọn nhanh lớp mẫu / Đã lưu --</option>
                  <optgroup label="🌱 Khối Tiểu Học (CV 2345)">
                    <option value="1A1">Lớp 1 (1A1 - Tiếng Việt 1)</option>
                    <option value="2A">Lớp 2 (2A - Toán 2)</option>
                    <option value="3A1">Lớp 3 (3A1 - Tự nhiên & Xã hội 3)</option>
                    <option value="4A1">Lớp 4 (4A1 - Khoa học 4)</option>
                    <option value="5A1">Lớp 5 (5A1 - Toán 5)</option>
                  </optgroup>
                  <optgroup label="📚 Khối THCS (CV 5512)">
                    <option value="6A">Lớp 6 (6A - THCS)</option>
                    <option value="7A1">Lớp 7 (7A1 - THCS)</option>
                    <option value="8A2">Lớp 8 (8A2 - THCS)</option>
                    <option value="9A">Lớp 9 (9A - THCS)</option>
                  </optgroup>
                  <optgroup label="🎓 Khối THPT (CV 5512)">
                    <option value="10A1">Lớp 10 (10A1 - THPT)</option>
                    <option value="11A">Lớp 11 (11A - THPT)</option>
                    <option value="12A">Lớp 12 (12A - THPT)</option>
                  </optgroup>
                  {Object.keys(savedProfiles).length > 0 && (
                    <optgroup label="💾 Hồ sơ lớp đã lưu">
                      {Object.keys(savedProfiles).map(l => (
                        <option key={l} value={l}>{l} - {savedProfiles[l]?.mon || ''}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Sĩ số */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Sĩ số học sinh:</label>
            <input
              type="text"
              value={profile.siso}
              onChange={e => onChangeProfile({ ...profile, siso: e.target.value })}
              placeholder="Ví dụ: 45"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-medium focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Student capability */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Năng lực Học sinh:</label>
            <select
              value={profile.nangluc}
              onChange={e => onChangeProfile({ ...profile, nangluc: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-medium focus:border-cyan-500 focus:outline-none"
            >
              <option value="Đại trà, nhiều trình độ">Đại trà, nhiều trình độ</option>
              <option value="Khá, Giỏi">Khá, Giỏi</option>
              <option value="Yếu, cần hỗ trợ tích cực">Yếu, cần hỗ trợ tích cực</option>
            </select>
          </div>

          {/* Time per period */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Thời lượng 1 tiết:</label>
            <select
              value={profile.thoiluong}
              onChange={e => onChangeProfile({ ...profile, thoiluong: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-medium focus:border-cyan-500 focus:outline-none mb-2"
            >
              <option value="35 phút (Tiểu học)">35 phút (Tiểu học)</option>
              <option value="40 phút (Tiểu học)">40 phút (Tiểu học)</option>
              <option value="45 phút (THCS / THPT)">45 phút (THCS / THPT)</option>
              <option value="50 phút (THPT / Trường Quốc tế)">50 phút (THPT / Trường Quốc tế)</option>
              <option value="90 phút (2 tiết liền)">90 phút (2 tiết liền)</option>
            </select>

            {/* Toggle Hide Activity Durations */}
            <label className="flex items-start gap-2.5 cursor-pointer bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={Boolean(profile.hideActivityTime)}
                onChange={e => onChangeProfile({ ...profile, hideActivityTime: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 border-slate-700 bg-slate-900 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-200">Ẩn bỏ thời gian các hoạt động khi tạo</span>
                <p className="text-slate-400 text-[11px] leading-relaxed mt-0.5">
                  Không ghi số phút (ví dụ không ghi "(5 phút)", "(30 phút)", "(15 phút)") sau tên các hoạt động trong giáo án
                </p>
              </div>
            </label>
          </div>

          {/* Lesson Plan Type */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Loại Mẫu Giáo án:</label>
            <select
              value={profile.loaiga}
              onChange={e => onChangeProfile({ ...profile, loaiga: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-medium focus:border-cyan-500 focus:outline-none"
            >
              <option value="Giáo án Bài học chuẩn 5512 (THCS / THPT)">Giáo án Bài học chuẩn 5512 (THCS / THPT)</option>
              <option value="Kế hoạch bài dạy chuẩn CV 2345 (Tiểu học)">Kế hoạch bài dạy chuẩn CV 2345 (Tiểu học)</option>
              <option value="Giáo án Tích hợp Liên môn (Môn chủ đạo + Môn tích hợp)">Giáo án Tích hợp Liên môn (Môn chủ đạo + Môn tích hợp)</option>
              <option value="Giáo án Chuyên đề / STEM / STEAM">Giáo án Chuyên đề / STEM / STEAM</option>
              <option value="Giáo án Hoạt động Trải nghiệm / Hướng nghiệp">Giáo án Hoạt động Trải nghiệm / Hướng nghiệp</option>
            </select>
          </div>

          {/* Integrated Subjects Input (shown when Interdisciplinary option selected) */}
          {(profile.loaiga?.includes('Tích hợp') || profile.loaiga?.includes('Liên môn')) && (
            <div className="col-span-1 md:col-span-2 bg-cyan-950/40 p-2.5 rounded-lg border border-cyan-800/60">
              <label className="block text-cyan-300 font-semibold mb-1 text-xs flex items-center justify-between">
                <span>Môn học / Lĩnh vực tích hợp liên môn:</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded uppercase font-bold">Liên Môn VIP</span>
              </label>
              <input
                type="text"
                value={profile.monTichHop || 'Vật lí, Hóa học, Sinh học, Lịch sử, Địa lí, Công nghệ, Tin học, GDCD'}
                onChange={e => onChangeProfile({ ...profile, monTichHop: e.target.value })}
                placeholder="Ví dụ: Vật lí, Hóa học, Sinh học, Lịch sử, Địa lí, GDCD, Công nghệ..."
                className="w-full bg-slate-950 border border-cyan-700/80 rounded p-2 text-slate-100 font-medium focus:border-cyan-400 focus:outline-none text-xs"
              />
              <p className="text-[11px] text-cyan-400/80 mt-1">
                AI sẽ tự động lồng ghép địa chỉ tích hợp, kiến thức liên môn & bài tập tình huống thực tiễn với các môn học trên.
              </p>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Ngày soạn:</label>
            <input
              type="date"
              value={profile.ngaysoan || ''}
              onChange={e => onChangeProfile({ ...profile, ngaysoan: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-medium focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* ADMINISTRATIVE & INSTITUTIONAL CONFIGURATION FOR ANY UNIT/SCHOOL */}
          <div className="col-span-1 md:col-span-4 bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-950 p-4 rounded-xl border border-blue-800/60 space-y-3 shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-800/40 pb-2">
              <span className="text-blue-300 font-bold text-xs flex items-center gap-2">
                <School className="w-4 h-4 text-blue-400" />
                <span>🏛️ Cấu hình Họ tên Giáo viên, Trường học & Năm học (Soạn cho mọi Đơn vị / Trường khác)</span>
              </span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-semibold border border-blue-600/40">
                Tự do tùy chỉnh đơn vị công tác
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Teacher Name */}
              <div>
                <label className="block text-blue-200 font-semibold mb-1">Họ & Tên Giáo viên soạn:</label>
                <input
                  type="text"
                  value={profile.teacherSigner || ''}
                  onChange={e => onChangeProfile({ ...profile, teacherSigner: e.target.value })}
                  placeholder="Ví dụ: Thầy Cấn Văn Trường, Cô Nguyễn Thị Mai..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-medium focus:border-blue-400 focus:outline-none"
                />
              </div>

              {/* School / Unit Name */}
              <div>
                <label className="block text-blue-200 font-semibold mb-1">Trường / Đơn vị công tác:</label>
                <input
                  type="text"
                  value={profile.schoolName || ''}
                  onChange={e => onChangeProfile({ ...profile, schoolName: e.target.value })}
                  placeholder="Ví dụ: Trường THCS Phùng Khắc Khoan, THCS Tây Phương, THPT Chu Văn An..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-medium focus:border-blue-400 focus:outline-none"
                />
              </div>

              {/* Academic Year */}
              <div>
                <label className="block text-blue-200 font-semibold mb-1">Năm học:</label>
                <input
                  type="text"
                  value={profile.schoolYear || '2025 - 2026'}
                  onChange={e => onChangeProfile({ ...profile, schoolYear: e.target.value })}
                  placeholder="Ví dụ: 2025 - 2026, 2026 - 2027..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-medium focus:border-blue-400 focus:outline-none"
                />
              </div>

              {/* Department / To Chuyen Mon */}
              <div>
                <label className="block text-blue-200 font-semibold mb-1">Tổ chuyên môn:</label>
                <input
                  type="text"
                  value={profile.toChuyenMon || ''}
                  onChange={e => onChangeProfile({ ...profile, toChuyenMon: e.target.value })}
                  placeholder="Ví dụ: Tổ Toán - Tin, Tổ Tự nhiên, Tổ Tiểu học..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-medium focus:border-blue-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Textbook Series */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Bộ sách SGK:</label>
            <select
              value={profile.boSach || 'Kết nối tri thức với cuộc sống'}
              onChange={e => onChangeProfile({ ...profile, boSach: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-medium focus:border-cyan-500 focus:outline-none"
            >
              {TEXTBOOK_LIST.map(tb => (
                <option key={tb} value={tb}>{tb}</option>
              ))}
            </select>
          </div>

          {/* Textbook Volume */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Tập mấy (SGK):</label>
            <select
              value={profile.sgkTap || 'Tập 1'}
              onChange={e => onChangeProfile({ ...profile, sgkTap: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-medium focus:border-cyan-500 focus:outline-none"
            >
              {TEXTBOOK_TAP.map(tap => (
                <option key={tap} value={tap}>{tap}</option>
              ))}
            </select>
          </div>

          {/* BGH Signer Selection */}
          <div className="col-span-1 md:col-span-2 bg-indigo-950/30 p-2.5 rounded-lg border border-indigo-800/60 space-y-1.5">
            <label className="block text-indigo-300 font-bold text-xs flex items-center justify-between">
              <span>Người Duyệt BGH (Phần duyệt cuối giáo án & Kế hoạch):</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded uppercase font-semibold">Cấu hình Ký duyệt</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={profile.bghSigner || 'Bùi Sỹ Nghĩa'}
                onChange={e => onChangeProfile({ ...profile, bghSigner: e.target.value })}
                className="bg-slate-950 border border-slate-700 rounded p-2 text-slate-100 text-xs font-medium focus:border-indigo-500 focus:outline-none"
              >
                <option value="Bùi Sỹ Nghĩa">Bùi Sỹ Nghĩa (Phó Hiệu trưởng)</option>
                <option value="Đỗ Thị Hải Yến">Đỗ Thị Hải Yến (Phó Hiệu trưởng)</option>
                <option value="Tự điền tên...">Tự nhập tên khác...</option>
              </select>
              <input
                type="text"
                value={profile.bghSigner || ''}
                onChange={e => onChangeProfile({ ...profile, bghSigner: e.target.value })}
                placeholder="Nhập tên người duyệt BGH..."
                className="bg-slate-950 border border-slate-700 rounded p-2 text-slate-100 text-xs font-medium focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Department Signer Input */}
          <div className="col-span-1 md:col-span-2 bg-indigo-950/30 p-2.5 rounded-lg border border-indigo-800/60 space-y-1.5">
            <label className="block text-indigo-300 font-bold text-xs">
              Người Duyệt Tổ Chuyên Môn (Tổ trưởng / Tổ phó CM):
            </label>
            <input
              type="text"
              value={profile.deptSigner || ''}
              onChange={e => onChangeProfile({ ...profile, deptSigner: e.target.value })}
              placeholder="Nhập tên Tổ trưởng / Tổ phó chuyên môn..."
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-100 text-xs font-medium focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Period Counts Configuration & Math Stream Mode */}
          <div className="col-span-1 md:col-span-4 bg-slate-950/80 p-3.5 rounded-lg border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <span className="text-cyan-300 font-bold text-xs flex items-center gap-2">
                <span>⏱️ Cấu hình Số tiết Môn học & Cách tính Thứ tự tiết</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded uppercase font-semibold">Tự động tính HK I, HK II</span>
              </span>

              {/* Math Parallel Stream Selector */}
              {profile.mon.toLowerCase().includes('toán') && (
                <div className="flex items-center gap-2 bg-slate-900 px-2.5 py-1 rounded border border-cyan-800/60 text-xs">
                  <span className="text-slate-300 font-medium text-[11px]">Cơ chế môn Toán:</span>
                  <select
                    value={profile.mathStreamMode || 'parallel'}
                    onChange={e => {
                      const mode = e.target.value as 'parallel' | 'continuous';
                      onChangeProfile({ ...profile, mathStreamMode: mode });
                    }}
                    className="bg-slate-950 border border-slate-700 text-cyan-300 text-xs rounded px-2 py-0.5 font-bold focus:outline-none"
                  >
                    <option value="parallel">Đếm tiết riêng Đại số & Hình học (Song song từ HK1 ➔ HK2)</option>
                    <option value="continuous">Đếm tiết liên tục nối tiếp toàn môn (1 đến 140)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Parallel Stream Sub-periods for Math */}
            {profile.mon.toLowerCase().includes('toán') && profile.mathStreamMode !== 'continuous' && (
              <div className="bg-slate-900/90 p-2.5 rounded border border-cyan-900/50 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-slate-200">
                <div>
                  <label className="block text-sky-300 text-[11px] font-semibold mb-1">Đại số HK I (tiết):</label>
                  <input
                    type="number"
                    value={profile.daiSoK1Periods !== undefined ? profile.daiSoK1Periods : 42}
                    onChange={e => {
                      const daiK1 = parseInt(e.target.value) || 0;
                      const hinhK1 = profile.hinhHocK1Periods !== undefined ? profile.hinhHocK1Periods : 30;
                      const daiK2 = profile.daiSoK2Periods !== undefined ? profile.daiSoK2Periods : 38;
                      const hinhK2 = profile.hinhHocK2Periods !== undefined ? profile.hinhHocK2Periods : 30;
                      const k1P = daiK1 + hinhK1;
                      const k2P = daiK2 + hinhK2;
                      onChangeProfile({
                        ...profile,
                        daiSoK1Periods: daiK1,
                        k1Periods: k1P,
                        totalYearPeriods: k1P + k2P
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-sky-300 font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block text-sky-300 text-[11px] font-semibold mb-1">Đại số HK II (tiết):</label>
                  <input
                    type="number"
                    value={profile.daiSoK2Periods !== undefined ? profile.daiSoK2Periods : 38}
                    onChange={e => {
                      const daiK2 = parseInt(e.target.value) || 0;
                      const daiK1 = profile.daiSoK1Periods !== undefined ? profile.daiSoK1Periods : 42;
                      const hinhK1 = profile.hinhHocK1Periods !== undefined ? profile.hinhHocK1Periods : 30;
                      const hinhK2 = profile.hinhHocK2Periods !== undefined ? profile.hinhHocK2Periods : 30;
                      const k1P = daiK1 + hinhK1;
                      const k2P = daiK2 + hinhK2;
                      onChangeProfile({
                        ...profile,
                        daiSoK2Periods: daiK2,
                        k2Periods: k2P,
                        totalYearPeriods: k1P + k2P
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-sky-300 font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block text-emerald-300 text-[11px] font-semibold mb-1">Hình học HK I (tiết):</label>
                  <input
                    type="number"
                    value={profile.hinhHocK1Periods !== undefined ? profile.hinhHocK1Periods : 30}
                    onChange={e => {
                      const hinhK1 = parseInt(e.target.value) || 0;
                      const daiK1 = profile.daiSoK1Periods !== undefined ? profile.daiSoK1Periods : 42;
                      const daiK2 = profile.daiSoK2Periods !== undefined ? profile.daiSoK2Periods : 38;
                      const hinhK2 = profile.hinhHocK2Periods !== undefined ? profile.hinhHocK2Periods : 30;
                      const k1P = daiK1 + hinhK1;
                      const k2P = daiK2 + hinhK2;
                      onChangeProfile({
                        ...profile,
                        hinhHocK1Periods: hinhK1,
                        k1Periods: k1P,
                        totalYearPeriods: k1P + k2P
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-emerald-300 font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block text-emerald-300 text-[11px] font-semibold mb-1">Hình học HK II (tiết):</label>
                  <input
                    type="number"
                    value={profile.hinhHocK2Periods !== undefined ? profile.hinhHocK2Periods : 30}
                    onChange={e => {
                      const hinhK2 = parseInt(e.target.value) || 0;
                      const daiK1 = profile.daiSoK1Periods !== undefined ? profile.daiSoK1Periods : 42;
                      const hinhK1 = profile.hinhHocK1Periods !== undefined ? profile.hinhHocK1Periods : 30;
                      const daiK2 = profile.daiSoK2Periods !== undefined ? profile.daiSoK2Periods : 38;
                      const k1P = daiK1 + hinhK1;
                      const k2P = daiK2 + hinhK2;
                      onChangeProfile({
                        ...profile,
                        hinhHocK2Periods: hinhK2,
                        k2Periods: k2P,
                        totalYearPeriods: k1P + k2P
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-emerald-300 font-bold text-center"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 text-[11px] font-semibold mb-1">Số tiết Học Kỳ I (Tổng):</label>
                <input
                  type="number"
                  value={profile.k1Periods !== undefined ? profile.k1Periods : 72}
                  onChange={e => {
                    const val = parseInt(e.target.value) || 0;
                    const k2 = profile.k2Periods !== undefined ? profile.k2Periods : 68;
                    onChangeProfile({ ...profile, k1Periods: val, totalYearPeriods: val + k2 });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-cyan-300 font-bold text-xs text-center"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-[11px] font-semibold mb-1">Số tiết Học Kỳ II (Tổng):</label>
                <input
                  type="number"
                  value={profile.k2Periods !== undefined ? profile.k2Periods : 68}
                  onChange={e => {
                    const val = parseInt(e.target.value) || 0;
                    const k1 = profile.k1Periods !== undefined ? profile.k1Periods : 72;
                    onChangeProfile({ ...profile, k2Periods: val, totalYearPeriods: k1 + val });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-cyan-300 font-bold text-xs text-center"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-[11px] font-semibold mb-1">Tổng số tiết Cả Năm:</label>
                <input
                  type="number"
                  value={profile.totalYearPeriods !== undefined ? profile.totalYearPeriods : 140}
                  onChange={e => onChangeProfile({ ...profile, totalYearPeriods: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-emerald-400 font-bold text-xs text-center"
                />
              </div>
            </div>
          </div>

          {/* School Facilities & Situation for 5512 Appendix */}
          <div className="col-span-1 md:col-span-4 bg-indigo-950/20 p-3 rounded-lg border border-indigo-900/60 space-y-2.5">
            <div className="flex items-center justify-between border-b border-indigo-900/50 pb-1.5">
              <span className="text-indigo-300 font-bold text-xs flex items-center gap-1.5">
                <span>🏫 Đặc điểm Tình hình & Cơ sở vật chất Nhà trường</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-medium">Tự động nạp vào Phụ lục 1, 2, 3</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-indigo-200 text-[11px] font-medium mb-1">Số giáo viên tổ/bộ môn:</label>
                <input
                  type="text"
                  value={profile.soGiaoVien || ''}
                  onChange={e => onChangeProfile({ ...profile, soGiaoVien: e.target.value })}
                  placeholder="VD: 05 giáo viên"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-100 text-xs font-medium focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-indigo-200 text-[11px] font-medium mb-1">Trình độ đào tạo:</label>
                <input
                  type="text"
                  value={profile.trinhDoDaoTao || ''}
                  onChange={e => onChangeProfile({ ...profile, trinhDoDaoTao: e.target.value })}
                  placeholder="VD: 100% Cử nhân, Thạc sĩ"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-100 text-xs font-medium focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-indigo-200 text-[11px] font-medium mb-1">Thiết bị dạy học:</label>
                <input
                  type="text"
                  value={profile.thietBiDayHoc || ''}
                  onChange={e => onChangeProfile({ ...profile, thietBiDayHoc: e.target.value })}
                  placeholder="VD: Máy tính, tivi trình chiếu..."
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-100 text-xs font-medium focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-indigo-200 text-[11px] font-medium mb-1">Phòng học bộ môn & Chức năng:</label>
                <input
                  type="text"
                  value={profile.phongHocBoMon || ''}
                  onChange={e => onChangeProfile({ ...profile, phongHocBoMon: e.target.value })}
                  placeholder="VD: 01 phòng Máy tính, Đa năng"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-100 text-xs font-medium focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-4 bg-emerald-950/40 border border-emerald-800/60 rounded-lg p-2.5 flex items-center justify-between text-xs text-emerald-300 font-medium">
            <span className="flex items-center gap-1.5">
              <span>💾</span>
              <span><strong>Đã bật chế độ Tự động lưu thiết đặt:</strong> Tên người ký duyệt, đếm tiết Đại/Hình, tình hình cơ sở vật chất, số tiết HK I/II... sẽ tự động lưu vĩnh viễn!</span>
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold uppercase">Lưu vĩnh viễn</span>
          </div>
        </div>
      </div>

      {/* 2. Batch Lesson Input & Multi-Period Split Option */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-slate-100">
              2. Danh sách Bài học & Cấu trúc Tiết học
            </h2>
          </div>

          <span className="text-[11px] text-slate-400">
            Định dạng: <code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded">Tên bài | Số tiết | Tiết PPCT | Phân chia nội dung</code>
          </span>
        </div>

        {/* SPECIAL NEW FEATURE HIGHLIGHT: Multi-period Goal Split Option */}
        <div className="bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-700/60 rounded-xl p-3.5 flex items-start gap-3">
          <input
            type="checkbox"
            id="multiPeriodToggle"
            checked={isSplitMultiPeriodGoals}
            onChange={e => onToggleSplitMultiPeriodGoals(e.target.checked)}
            className="mt-1 w-4 h-4 text-indigo-500 rounded border-slate-700 focus:ring-indigo-500 bg-slate-900 cursor-pointer"
          />
          <label htmlFor="multiPeriodToggle" className="cursor-pointer text-xs space-y-1">
            <div className="font-bold text-indigo-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400 animate-bounce" />
              Bổ sung Mục tiêu chung cả bài VÀ Mục tiêu riêng từng tiết (Cho bài từ 2 tiết trở lên)
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Khi bật tùy chọn này, đối với các bài học có thời lượng 2 tiết trở lên, AI sẽ xây dựng hệ thống mục tiêu kép:
              <br />
              • <strong>Phần A - MỤC TIÊU CHUNG TỔNG THỂ TOÀN BÀI HỌC</strong> (Năng lực đặc thù, Năng lực Số/AI & Phẩm chất cho cả bài).
              <br />
              • <strong>Phần B - MỤC TIÊU VÀ YÊU CẦU CẦN ĐẠT RIÊNG CHO TỪNG TIẾT HỌC</strong> (Tiết 1, Tiết 2... với kiến thức trọng tâm riêng).
            </p>
          </label>
        </div>

        <div>
          <textarea
            value={lessonText}
            onChange={e => onChangeLessonText(e.target.value)}
            rows={4}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-cyan-300 font-mono text-xs leading-relaxed focus:border-cyan-500 focus:outline-none"
            placeholder="Ví dụ:&#10;Bài 1: Tập hợp các số tự nhiên | 2 | 1, 2 | Tiết 1: Định nghĩa & Phần tử. Tiết 2: Các phép toán&#10;Bài 2: Tính chất chia hết | 1 | 3 | Dạy toàn bộ nội dung trong 1 tiết"
          />
        </div>
      </div>

      {/* 3. Teaching Methods & Specific Requirements */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Settings2 className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-slate-100">
            3. Phương pháp, Kĩ thuật Dạy học & Yêu cầu Đặc thù
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* PP Dạy học */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold">Phương pháp Dạy học chính:</label>
              <span className="text-[11px] text-slate-400">({ppList.length} phương pháp)</span>
            </div>

            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950 border border-slate-800 rounded-lg max-h-36 overflow-y-auto">
              {ppList.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onChangePP(p)}
                  className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                    selectedPP === p
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/30 font-semibold'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600 hover:text-slate-100'
                  }`}
                  title={`Nhấp để chọn "${p}"`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newPPInput}
                onChange={e => setNewPPInput(e.target.value)}
                placeholder="Thêm PP mới..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none"
              />
              <button
                onClick={handleAddPP}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm
              </button>
            </div>
          </div>

          {/* Kĩ thuật DH */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold">Kĩ thuật Dạy học tích cực:</label>
              <span className="text-[11px] text-slate-400">({ktList.length} kĩ thuật)</span>
            </div>

            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950 border border-slate-800 rounded-lg max-h-36 overflow-y-auto">
              {ktList.map(k => (
                <button
                  key={k}
                  type="button"
                  onClick={() => onChangeKT(k)}
                  className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                    selectedKT === k
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/30 font-semibold'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600 hover:text-slate-100'
                  }`}
                  title={`Nhấp để chọn "${k}"`}
                >
                  {k}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newKTInput}
                onChange={e => setNewKTInput(e.target.value)}
                placeholder="Thêm Kĩ thuật mới..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none"
              />
              <button
                onClick={handleAddKT}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm
              </button>
            </div>
          </div>
        </div>

        {/* Specific goals / Custom requests */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-slate-300 font-semibold text-xs flex items-center gap-1.5">
              <span>Yêu cầu Sư phạm & Mục tiêu riêng (Tùy chỉnh):</span>
            </label>
            <button
              type="button"
              onClick={() => setIsNlsModalOpen(true)}
              className="px-3 py-1 bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold rounded-lg text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>✨ Chọn Nhanh Chỉ Báo Năng Lực Số & Khung GD AI (TT 02/2025 & QĐ 2422)</span>
            </button>
          </div>
          <textarea
            value={specificGoals}
            onChange={e => onChangeSpecificGoals(e.target.value)}
            rows={3}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 text-xs leading-relaxed focus:border-cyan-500 focus:outline-none"
            placeholder="Nhập ghi chú yêu cầu riêng, ví dụ: Nếu có hình vẽ Toán học/KHTN, BẮT BUỘC cung cấp mã TikZ vẽ hình độc lập trong môi trường \begin{tikzpicture}..."
          />
        </div>
      </div>

      {/* Modal for Digital Competency & AI Education Framework Selection */}
      <DigitalCompetencyAndAISelectorModal
        isOpen={isNlsModalOpen}
        onClose={() => setIsNlsModalOpen(false)}
        onApply={(textToInsert) => {
          onChangeSpecificGoals((specificGoals ? specificGoals + '\n\n' : '') + textToInsert);
        }}
        subjectName={profile.mon}
        gradeName={profile.lop}
      />
    </div>
  );
};
