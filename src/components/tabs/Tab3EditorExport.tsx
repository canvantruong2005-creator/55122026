import React, { useState, useEffect, useMemo } from 'react';
import { exportMarkdownToWord } from '../../lib/wordExport';
import { generateGeminiText } from '../../lib/geminiApi';
import { fetchDriveConfig, DEFAULT_DRIVE_CONFIG } from '../../lib/adminConfig';
import { TikZVisualizer } from '../TikZVisualizer';
import { ImageBgRemover } from '../ImageBgRemover';
import { extractTikzBlocks } from '../../lib/tikzRenderer';
import { CommunityDriveModal } from '../CommunityDriveModal';
import { A4DocumentPreview } from '../A4DocumentPreview';
import { PoemComposerModal } from '../modals/PoemComposerModal';
import { getCachedTeacherProfile } from '../../lib/teacherProfile';
import { validateLicenseKey, STORAGE_KEY_SAVED_LICENSE } from '../../lib/licenseUtils';
import { FileText, Download, Lock, Key, Printer, Eye, Edit3, Code, Sparkles, BookOpen, Wand2, RefreshCw, Feather, CloudUpload, FolderOpen, ExternalLink, Upload } from 'lucide-react';

interface Tab3EditorExportProps {
  content: string;
  onChangeContent: (text: string) => void;
  headerText: string;
  onChangeHeaderText: (text: string) => void;
  footerText: string;
  onChangeFooterText: (text: string) => void;
  watermarkText: string;
  onChangeWatermarkText: (text: string) => void;
  showPageNumbers: boolean;
  onTogglePageNumbers: (val: boolean) => void;
  monHoc: string;
  lop: string;
  ngaySoan: string;
  thoiluong?: string;
  hideActivityTime?: boolean;
  onToggleHideActivityTime?: (val: boolean) => void;
  onOpenTikzGuide?: () => void;
  onOpenTikzStudio?: () => void;
  apiKeysInput?: string;
}

export const Tab3EditorExport: React.FC<Tab3EditorExportProps> = ({
  content,
  onChangeContent,
  headerText,
  onChangeHeaderText,
  footerText,
  onChangeFooterText,
  watermarkText,
  onChangeWatermarkText,
  showPageNumbers,
  onTogglePageNumbers,
  monHoc,
  lop,
  ngaySoan,
  thoiluong = '45 phút (THCS / THPT)',
  hideActivityTime = false,
  onToggleHideActivityTime,
  onOpenTikzGuide,
  onOpenTikzStudio,
  apiKeysInput = ''
}) => {
  const [activeView, setActiveView] = useState<'preview' | 'editor'>('preview');
  const [isVipUnlocked, setIsVipUnlocked] = useState(false);
  const [vipPassword, setVipPassword] = useState('');
  const [showVipModal, setShowVipModal] = useState(false);
  const [showImageRemover, setShowImageRemover] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLandscapeMode, setIsLandscapeMode] = useState(false);
  const [isPoemGenerating, setIsPoemGenerating] = useState(false);

  // License status check for watermark removal with realtime listener
  const [licenseUpdateTick, setLicenseUpdateTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setLicenseUpdateTick(t => t + 1);
    window.addEventListener('licenses_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('licenses_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const isKeyAllowedWatermarkRemoval = useMemo(() => {
    try {
      const savedKey = localStorage.getItem(STORAGE_KEY_SAVED_LICENSE) || '';
      if (!savedKey) return false;
      const res = validateLicenseKey(savedKey);
      return res.valid && (!!res.isAdmin || res.allowRemoveWatermark === true);
    } catch {
      return false;
    }
  }, [licenseUpdateTick]);

  // Google Drive Modal
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveFolderUrl, setDriveFolderUrl] = useState(DEFAULT_DRIVE_CONFIG.folderUrl);
  const [showPoemModal, setShowPoemModal] = useState(false);

  useEffect(() => {
    fetchDriveConfig().then(cfg => {
      if (cfg?.folderUrl) setDriveFolderUrl(cfg.folderUrl);
    });
  }, []);

  const handleInsertPoemToContent = (poemMarkdown: string, insertPosition: 'start' | 'warmup' | 'practice' | 'summary' | 'end') => {
    if (!poemMarkdown.trim()) return;

    let updated = content;
    const poemBlock = `\n\n---\n${poemMarkdown}\n\n`;

    if (insertPosition === 'start') {
      updated = poemBlock + content;
    } else if (insertPosition === 'warmup') {
      const warmupRegex = /(###?\s*(?:1|I|A|HOẠT ĐỘNG 1|Hoạt động 1|HOẠT ĐỘNG KHỞI ĐỘNG|Khởi động|Mở đầu)[^\n]*\n)/i;
      if (warmupRegex.test(content)) {
        updated = content.replace(warmupRegex, `$1${poemBlock}`);
      } else {
        updated = content + poemBlock;
      }
    } else if (insertPosition === 'practice') {
      const practiceRegex = /(###?\s*(?:3|III|C|HOẠT ĐỘNG 3|Hoạt động 3|HOẠT ĐỘNG LUYỆN TẬP|Luyện tập)[^\n]*\n)/i;
      if (practiceRegex.test(content)) {
        updated = content.replace(practiceRegex, `$1${poemBlock}`);
      } else {
        updated = content + poemBlock;
      }
    } else if (insertPosition === 'summary') {
      const summaryRegex = /(###?\s*(?:4|IV|D|HOẠT ĐỘNG 4|Hoạt động 4|HOẠT ĐỘNG VẬN DỤNG|Vận dụng|Củng cố|Ghi nhớ|Tổng kết|Dặn dò)[^\n]*\n)/i;
      if (summaryRegex.test(content)) {
        updated = content.replace(summaryRegex, `$1${poemBlock}`);
      } else {
        updated = content + poemBlock;
      }
    } else {
      updated = content + poemBlock;
    }

    onChangeContent(updated);
  };

  // Extract TikZ blocks from markdown content for visualizer rendering
  const tikzBlocks = extractTikzBlocks(content);

  const handleUpdateTikzBlock = (oldTikzCode: string, newTikzCode: string) => {
    if (content.includes(oldTikzCode)) {
      const updated = content.replace(oldTikzCode, newTikzCode);
      onChangeContent(updated);
    }
  };

  const handleUnlockVip = () => {
    if (vipPassword.trim().toUpperCase() === 'CANVANTRUONGVIP') {
      setIsVipUnlocked(true);
      setShowVipModal(false);
      alert('Đã gỡ khóa thành công! Thầy/cô có thể tự do chỉnh sửa Bản quyền Watermark.');
    } else {
      alert('Mã VIP không chính xác!');
    }
  };

  const buildExportFileName = (): string => {
    const monStr = (monHoc || 'MON_HOC').toUpperCase().trim();

    // Parse Tuần from content
    const tuanMatch = content.match(/Tuần\s*:?\s*(\d+)/i) || content.match(/Tuần\s+(\d+)/i);
    const tuanVal = tuanMatch ? tuanMatch[1] : '...';

    // Parse Tiết from content
    const tietMatch =
      content.match(/Tiết\s+(?:thứ|PPCT)?\s*:?\s*([\d\s,–-]+)/i) ||
      content.match(/Tiết\s*:?\s*([\d\s,–-]+)/i);
    const tietVal = tietMatch ? tietMatch[1].trim() : '......';

    // Parse Bài from content
    let baiVal = '';
    const baiMatch = content.match(/(?:BÀI|Bài)\s*(\d*[\s:-]*[^\n\r#|]+)/i);
    if (baiMatch && baiMatch[1]) {
      baiVal = baiMatch[1].trim();
    }

    if (!baiVal || baiVal.length < 2) {
      const firstHead = content.split('\n').find(l => l.trim().startsWith('#') || l.trim().startsWith('BÀI'));
      if (firstHead) {
        baiVal = firstHead.replace(/^[#\s*]+/, '').trim();
      }
    }

    if (!baiVal) baiVal = '......';

    const cleanMon = monStr.replace(/[\\/:*?"<>|]/g, '');
    const cleanTuan = tuanVal.replace(/[\\/:*?"<>|]/g, '');
    const cleanTiet = tietVal.replace(/[\\/:*?"<>|]/g, '');
    const cleanBai = baiVal.replace(/^[\s#*]+|[\s#*]+$/g, '').replace(/[\\/:*?"<>|]/g, '').slice(0, 70);

    return `${cleanMon}- Tuần ${cleanTuan} - Tiết ${cleanTiet}- Bài ${cleanBai}.docx`;
  };

  const handleExportWord = async () => {
    if (!content.trim()) {
      alert('Nội dung giáo án đang trống!');
      return;
    }
    setIsExporting(true);
    const exportFileName = buildExportFileName();

    try {
      const currentProfile = getCachedTeacherProfile();
      const isVip = isVipUnlocked || isKeyAllowedWatermarkRemoval;

      // Parse Tiết from content if available
      const tietMatch =
        content.match(/(?:^|\n)\s*(?:\*\*)?(?:TIẾT|Tiết)\s+(?:thứ|PPCT)?\s*:?\s*([\d\s,–-]+)/i) ||
        content.match(/Tiết\s*:?\s*([\d\s,–-]+)/i);
      const tietVal = tietMatch ? tietMatch[1].trim() : '';

      await exportMarkdownToWord(content, {
        headerText: headerText || 'Kế hoạch bài dạy.......',
        footerText: footerText || currentProfile.school || 'Trường THCS Phùng Khắc Khoan',
        teacherName: currentProfile.name ? currentProfile.name.replace(/^(?:Thầy|Cô)\s+/i, '') : 'Cấn Văn Trường',
        schoolName: currentProfile.school || 'Trường THCS Phùng Khắc Khoan',
        namHoc: 'Năm học: 2026 - 2027',
        isVip,
        watermarkText: isVip ? (isVipUnlocked ? watermarkText : '') : 'BẢN QUYỀN: THẦY CẤN VĂN TRƯỜNG - THCS PHÙNG KHẮC KHOAN - 0988.302.636',
        monHoc,
        lop,
        ngaySoan,
        thoiluong,
        hideActivityTime,
        tiet: tietVal,
        tietPPCT: tietVal,
        showPageNumbers,
        fileName: exportFileName,
        isLandscape: isLandscapeMode || /PHỤ LỤC|KHGD|KẾ HOẠCH GIÁO DỤC/i.test(content)
      });
    } catch (err: any) {
      console.error('Lỗi xuất file Word:', err);
      alert('Lỗi xuất file Word: ' + (err.message || 'Không thể tạo file'));
    } finally {
      setIsExporting(false);
    }
  };

  const extractLessonTitle = (rawContent: string): string => {
    if (!rawContent) return '';
    const match = rawContent.match(/^#+\s*(?:BÀI|CHỦ ĐỀ|BÀI HỌC|TIẾT)?\s*(.+)$/m);
    if (match && match[1]) {
      return match[1].replace(/[*_#]/g, '').trim();
    }
    return '';
  };

  return (
    <div className="space-y-6">
      {/* 1. Header, Footer & Export Customization Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">
              Tùy chỉnh Đầu trang, Chân trang & Xuất File Word / PDF
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowPoemModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-950/90 to-purple-950/90 hover:from-pink-900 hover:to-purple-900 text-pink-200 border border-pink-500/50 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-pink-950/40 cursor-pointer active:scale-95"
              title="Mở Xưởng Sáng Tác Thơ & Vè Sư Phạm Dễ Nhớ (Tự do chọn nguồn từ bài soạn, file docx/pdf, công thức, thể thơ, đọc diễn cảm TTS)"
            >
              <Feather className="w-3.5 h-3.5 text-pink-400" />
              <span>🌸 Xưởng Sáng Tác Thơ & Vè Sư Phạm</span>
            </button>

            <button
              onClick={() => setShowImageRemover(!showImageRemover)}
              className="px-3 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/50 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
              📸 Tải & Tách Nền Ảnh SGK
            </button>

            <button
              onClick={handleExportWord}
              disabled={isExporting}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Đang xuất Word...' : '💾 XUẤT FILE WORD (.DOCX)'}
            </button>

            <button
              onClick={() => setShowDriveModal(true)}
              className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all"
              title="Tải tệp Word (.docx) hoặc PDF đã hoàn chỉnh từ máy tính lên Kho Google Drive dùng chung"
            >
              <Upload className="w-4 h-4 text-sky-200" />
              📤 TẢI TÀI LIỆU HOÀN CHỈNH LÊN DRIVE (WORD / PDF)
            </button>

            <a
              href={driveFolderUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all shadow"
              title="Mở thư mục Google Drive chứa kho giáo án dùng chung"
            >
              <FolderOpen className="w-4 h-4 text-amber-400" />
              📁 Mở Kho Drive
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Header */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Đầu trang (Header):</label>
            <input
              type="text"
              value={headerText}
              onChange={e => onChangeHeaderText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Footer */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Chân trang (Footer):</label>
            <input
              type="text"
              value={footerText}
              onChange={e => onChangeFooterText(e.target.value)}
              placeholder="Ví dụ: Trường THCS Phùng Khắc Khoan - Tổ KHTN"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Watermark */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-semibold">Bản quyền (Watermark):</label>
              {!isVipUnlocked && (
                <button
                  onClick={() => setShowVipModal(true)}
                  className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Lock className="w-3 h-3" /> Mở khóa VIP
                </button>
              )}
            </div>
            <input
              type="text"
              value={watermarkText}
              onChange={e => onChangeWatermarkText(e.target.value)}
              disabled={!isVipUnlocked}
              className={`w-full bg-slate-950 border rounded-lg p-2 text-slate-100 focus:outline-none ${
                isVipUnlocked ? 'border-cyan-500' : 'border-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showPageNumbers}
              onChange={e => onTogglePageNumbers(e.target.checked)}
              className="w-4 h-4 text-cyan-500 rounded bg-slate-950 border-slate-700"
            />
            <span>Tự động đánh số trang dưới Chân trang</span>
          </label>

          <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-medium">Khổ giấy xuất Word:</span>
            <button
              type="button"
              onClick={() => setIsLandscapeMode(false)}
              className={`px-2.5 py-1 rounded font-semibold text-xs transition-colors ${
                !isLandscapeMode ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              📄 A4 Đứng (Giáo án)
            </button>
            <button
              type="button"
              onClick={() => setIsLandscapeMode(true)}
              className={`px-2.5 py-1 rounded font-semibold text-xs transition-colors ${
                isLandscapeMode ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              📑 A4 Ngang (Phụ lục 1,2,3)
            </button>
          </div>
        </div>
      </div>

      {/* Image Upload & Background Removal Utility */}
      {showImageRemover && (
        <div className="relative">
          <button
            onClick={() => setShowImageRemover(false)}
            className="absolute top-3 right-3 text-slate-400 hover:text-white text-xs bg-slate-800 px-2 py-1 rounded"
          >
            Đóng X
          </button>
          <ImageBgRemover
            onInsertImageToContent={(tag) => {
              onChangeContent(content + '\n\n' + tag + '\n');
              alert('Đã chèn thẻ ảnh vào cuối giáo án! Thầy/cô có thể di chuyển vị trí thẻ ảnh theo ý muốn.');
            }}
          />
        </div>
      )}

      {/* Dynamic Rendered TikZ Visualizers Panel */}
      {tikzBlocks.length > 0 && (
        <div className="bg-purple-950/30 border border-purple-800/60 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-800/40 pb-2">
            <div className="flex items-center gap-2 text-purple-200 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Phát hiện {tikzBlocks.length} Hình vẽ TikZ Véc-tơ trong Giáo án:</span>
            </div>
            <span className="text-[11px] text-amber-300 font-medium">
              💡 Nếu hình vẽ chưa đẹp hoặc bị lỗi, bấm nút <strong>"✨ Sửa / Vẽ Lại"</strong> ở từng hình bên dưới để AI tự sửa theo yêu cầu!
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tikzBlocks.map((block, idx) => (
              <TikZVisualizer
                key={idx}
                tikzCode={block.code}
                title={`Hình TikZ #${idx + 1}`}
                apiKeysInput={apiKeysInput}
                onUpdateTikzCode={newCode => handleUpdateTikzBlock(block.code, newCode)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 2. Professional A4 Print / Word Preview with KaTeX & AI Refinement Bar */}
      <A4DocumentPreview
        content={content}
        onChangeContent={onChangeContent}
        title="Giáo án Kế hoạch bài dạy Công văn 5512"
        documentType="lesson_plan"
        monHoc={monHoc}
        lop={lop}
        ngaySoan={ngaySoan}
        thoiluong={thoiluong}
        hideActivityTime={hideActivityTime}
        onToggleHideActivityTime={onToggleHideActivityTime}
        apiKeysInput={apiKeysInput}
        onExportWord={handleExportWord}
        exportOptions={{
          headerText,
          footerText,
          watermarkText,
          monHoc,
          lop,
          ngaySoan,
          thoiluong,
          hideActivityTime,
          showPageNumbers,
          isLandscape: isLandscapeMode,
          fileName: buildExportFileName()
        }}
      />

      {/* Google Drive Community Upload Modal */}
      <CommunityDriveModal
        isOpen={showDriveModal}
        onClose={() => setShowDriveModal(false)}
        initialSubject={monHoc || 'Toán học'}
        initialGrade={lop ? (lop.startsWith('Lớp') ? lop : `Lớp ${lop}`) : 'Lớp 7'}
        initialLessonTitle={extractLessonTitle(content)}
      />

      {/* VIP Password Modal */}
      {showVipModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full text-slate-100 space-y-4">
            <h3 className="text-base font-bold text-cyan-400 flex items-center gap-2">
              <Key className="w-5 h-5" /> Mở khóa Quyền Chỉnh sửa Watermark VIP
            </h3>
            <p className="text-xs text-slate-300">
              Nhập mã kích hoạt VIP để gỡ khóa chỉnh sửa Watermark bản quyền:
            </p>
            <input
              type="password"
              value={vipPassword}
              onChange={e => setVipPassword(e.target.value)}
              placeholder="Nhập mã VIP..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowVipModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={handleUnlockVip}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
              >
                Mở khóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Educational Poem Composer Modal */}
      {showPoemModal && (
        <PoemComposerModal
          isOpen={showPoemModal}
          onClose={() => setShowPoemModal(false)}
          currentContent={content}
          monHoc={monHoc}
          lop={lop}
          apiKeysInput={apiKeysInput}
          onInsertToContent={handleInsertPoemToContent}
        />
      )}
    </div>
  );
};
