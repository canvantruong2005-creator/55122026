import React, { useState, useEffect } from 'react';
import {
  Key,
  Upload,
  FileText,
  Cpu,
  Sparkles,
  Scissors,
  Eye,
  EyeOff,
  Trash2,
  Database,
  HelpCircle,
  Loader2,
  Image as ImageIcon,
  Files,
  FileUp,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Lock
} from 'lucide-react';
import {
  readFileAsText,
  performOcrOnImageDataUrl,
  readMultipleFilesAsText,
  MultiFileReadResult,
  getPdfPageCount
} from '../../lib/fileUtils';
import { getCachedTeacherProfile, subscribeToTeacherProfile } from '../../lib/teacherProfile';
import { TeacherProfile } from '../../types';

interface Tab2ReferenceSGKProps {
  sgkFile: File | null;
  sgkImageDataUrl?: string;
  onSgkFileChange: (file: File | null) => void;
  onSgkImageDataUrlChange?: (dataUrl: string) => void;
  pageStart: number;
  onPageStartChange: (page: number) => void;
  pageEnd: number;
  onPageEndChange: (page: number) => void;
  referenceCacheText: string;
  onReferenceCacheChange: (text: string) => void;
  apiKeysInput: string;
  onApiKeysInputChange: (text: string) => void;
  onExtractReferences: () => void;
  onStartAIGeneration: () => void;
  isGenerating: boolean;
  onOpenApiGuide: () => void;
  onNavigateTab?: (tab: number) => void;
  thoiluong?: string;
  hideActivityTime?: boolean;
  onToggleHideActivityTime?: (val: boolean) => void;
}

export const Tab2ReferenceSGK: React.FC<Tab2ReferenceSGKProps> = ({
  sgkFile,
  sgkImageDataUrl,
  onSgkFileChange,
  onSgkImageDataUrlChange,
  pageStart,
  onPageStartChange,
  pageEnd,
  onPageEndChange,
  referenceCacheText,
  onReferenceCacheChange,
  apiKeysInput,
  onApiKeysInputChange,
  onExtractReferences,
  onStartAIGeneration,
  isGenerating,
  onOpenApiGuide,
  onNavigateTab,
  thoiluong = '45 phút (THCS / THPT)',
  hideActivityTime = false,
  onToggleHideActivityTime
}) => {
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [showTextPreview, setShowTextPreview] = useState(false);
  const [isReadingSgk, setIsReadingSgk] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [imageAnalysisStatus, setImageAnalysisStatus] = useState('');
  const [readSgkStatus, setReadSgkStatus] = useState('');
  const [scanMode, setScanMode] = useState<'range' | 'full'>('range');
  const [detectedTotalPages, setDetectedTotalPages] = useState<number | null>(null);

  // Multi-file Arbitrary References State
  const [pendingMultiFiles, setPendingMultiFiles] = useState<File[]>([]);
  const [multiFileList, setMultiFileList] = useState<MultiFileReadResult[]>([]);
  const [isReadingMultiFiles, setIsReadingMultiFiles] = useState(false);
  const [multiFileProgress, setMultiFileProgress] = useState<string>('');
  const [multiFileScanMode, setMultiFileScanMode] = useState<'full' | 'range'>('full');
  const [multiFileStartPage, setMultiFileStartPage] = useState<number>(1);
  const [multiFileEndPage, setMultiFileEndPage] = useState<number>(10);

  // Profile & Admin Check
  const [profile, setProfile] = useState<TeacherProfile>(getCachedTeacherProfile());
  useEffect(() => {
    const unsub = subscribeToTeacherProfile((newProf) => {
      setProfile(newProf);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);
  const isAdmin = Boolean(profile.isAdmin);

  const apiKeys = apiKeysInput ? apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean) : [];

  const handleAnalyzeDiagramAndImage = async (imgUrl: string) => {
    if (!imgUrl) return;
    setIsAnalyzingImage(true);
    setImageAnalysisStatus('Đang dùng AI Vision đọc hiểu văn bản và phân tích chi tiết hình vẽ / sơ đồ...');
    try {
      const ocrResult = await performOcrOnImageDataUrl(imgUrl, apiKeys);
      if (ocrResult && !ocrResult.startsWith('[Lỗi')) {
        const formattedBlock = `\n--- [KẾT QUẢ AI ĐỌC HIỂU HÌNH VẼ & VĂN BẢN TRANG SÁCH / TƯ LIỆU] ---\n${ocrResult}\n`;
        onReferenceCacheChange(referenceCacheText + formattedBlock);
        setImageAnalysisStatus('✅ Đã đọc hiểu và trích xuất dữ liệu hình vẽ vào bộ nhớ AI thành công!');
        setShowTextPreview(true);
      } else {
        setImageAnalysisStatus(ocrResult || '⚠️ Không đọc hiểu được hình vẽ.');
      }
    } catch (err: any) {
      setImageAnalysisStatus(`⚠️ Lỗi: ${err?.message || String(err)}`);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  // Perform Extract & OCR on SGK with precise range or full
  const processSgkExtraction = async (f: File, mode: 'range' | 'full' = scanMode) => {
    setIsReadingSgk(true);
    setReadSgkStatus(`Đang trích xuất dữ liệu & OCR từ file SGK [${f.name}] (${mode === 'full' ? 'Toàn bộ file' : `Trang ${pageStart} - ${pageEnd}`})...`);
    try {
      if (f.name.toLowerCase().endsWith('.pdf')) {
        const pages = await getPdfPageCount(f);
        setDetectedTotalPages(pages);
      }

      const isFull = mode === 'full';
      const text = await readFileAsText(f, {
        startPage: isFull ? 1 : Math.max(1, pageStart),
        endPage: isFull ? undefined : Math.max(pageStart, pageEnd),
        fullScan: isFull,
        apiKeys
      });

      if (text) {
        // Clean previous SGK entry if rescanning same file to avoid duplicate bloat
        const fileHeaderPrefix = `--- [FILE DỮ LIỆU SGK CHÍNH: ${f.name}`;
        let updatedCache = referenceCacheText;
        if (updatedCache.includes(fileHeaderPrefix)) {
          // Remove previous block of this file
          const parts = updatedCache.split(fileHeaderPrefix);
          const before = parts[0];
          const afterParts = parts.slice(1).join(fileHeaderPrefix);
          const endOfBlock = afterParts.indexOf('\n--- [');
          if (endOfBlock !== -1) {
            updatedCache = before.trim() + '\n' + afterParts.slice(endOfBlock).trim();
          } else {
            updatedCache = before.trim();
          }
        }

        const formattedEntry = `\n--- [FILE DỮ LIỆU SGK CHÍNH: ${f.name} (${isFull ? 'Toàn bộ file' : `Từ trang ${pageStart} đến trang ${pageEnd}`})] ---\n` + text + '\n';
        onReferenceCacheChange(updatedCache + formattedEntry);
        setReadSgkStatus(`✅ ĐÃ TRÍCH XUẤT CHÍNH XÁC (${isFull ? 'TOÀN BỘ FILE' : `TỪ TRANG ${pageStart} ĐẾN TRANG ${pageEnd}`}, ${text.length.toLocaleString('vi-VN')} KÝ TỰ)! Dữ liệu đã lưu vào bộ nhớ AI.`);
        setShowTextPreview(true);
      } else {
        setReadSgkStatus(`⚠️ Không trích xuất được chữ từ [${f.name}]. Dữ liệu có thể ở dạng ảnh quét.`);
      }
    } catch (err) {
      setReadSgkStatus(`⚠️ Lỗi khi đọc file SGK: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsReadingSgk(false);
    }
  };

  const handleSgkFileSelect = async (f: File | null) => {
    onSgkFileChange(f);
    if (f) {
      if (f.name.toLowerCase().endsWith('.pdf')) {
        const pages = await getPdfPageCount(f);
        setDetectedTotalPages(pages);
        if (pages > 0 && pageEnd === 10) {
          onPageEndChange(Math.min(pages, 10));
        }
      }
      setReadSgkStatus(`⏳ Đã tải tệp [${f.name}]. Vui lòng chọn khoảng trang rồi bấm "🔍 Bấm quét, đọc, phân tích SGK" bên dưới.`);
    } else {
      setReadSgkStatus('');
      setDetectedTotalPages(null);
    }
  };

  const handleStartScanSgk = () => {
    if (sgkFile) {
      processSgkExtraction(sgkFile, scanMode);
    }
  };

  const handleSgkImageCropUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = evt => {
        const url = evt.target?.result as string;
        if (url && onSgkImageDataUrlChange) {
          onSgkImageDataUrlChange(url);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasteImage = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = evt => {
            const url = evt.target?.result as string;
            if (url && onSgkImageDataUrlChange) {
              onSgkImageDataUrlChange(url);
            }
          };
          reader.readAsDataURL(blob);
        }
        break;
      }
    }
  };

interface ReferenceSlotUploadProps {
  id: string;
  slotNumber: string;
  title: string;
  badgeLabel: string;
  apiKeys: string[];
  referenceCacheText: string;
  onReferenceCacheChange: (newText: string) => void;
}

const ReferenceSlotUpload: React.FC<ReferenceSlotUploadProps> = ({
  id,
  slotNumber,
  title,
  badgeLabel,
  apiKeys,
  referenceCacheText,
  onReferenceCacheChange
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [scanMode, setScanMode] = useState<'full' | 'range'>('full');
  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number | undefined>(undefined);
  const [isReading, setIsReading] = useState<boolean>(false);
  const [readStatus, setReadStatus] = useState<string>('');
  const [extractedSnippet, setExtractedSnippet] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(false);

  const processExtraction = async (f: File, mode: 'full' | 'range' = scanMode, sp = startPage, ep = endPage) => {
    setIsReading(true);
    const isFull = mode === 'full';
    setReadStatus(`Đang đọc & OCR [${f.name}] (${isFull ? 'Toàn bộ file' : `Trang ${sp} - ${ep}`})...`);

    try {
      if (f.name.toLowerCase().endsWith('.pdf')) {
        const pages = await getPdfPageCount(f);
        setTotalPages(pages);
      }

      const text = await readFileAsText(f, {
        fullScan: isFull,
        startPage: isFull ? 1 : Math.max(1, sp),
        endPage: isFull ? undefined : Math.max(sp, ep),
        apiKeys
      });

      if (text) {
        setExtractedSnippet(text);
        // Replace previous extraction for this slot in referenceCacheText if already present
        const headerPrefix = `--- [TÀI LIỆU THAM CHIẾU (${slotNumber}. ${badgeLabel}):`;
        let updatedCache = referenceCacheText;
        if (updatedCache.includes(headerPrefix)) {
          const regex = new RegExp(`--- \\[TÀI LIỆU THAM CHIẾU \\(${slotNumber}\\. ${badgeLabel}\\):[\\s\\S]*?(?=--- \\[|$)`, 'g');
          updatedCache = updatedCache.replace(regex, '').trim();
        }

        const newBlock = `\n--- [TÀI LIỆU THAM CHIẾU (${slotNumber}. ${badgeLabel}): ${f.name} (${isFull ? 'QUÉT TOÀN BỘ FILE' : `Trích xuất từ Trang ${sp} đến ${ep}`})] ---\n` + text.slice(0, 60000) + '\n';
        onReferenceCacheChange(updatedCache + newBlock);
        setReadStatus(`✅ Đã nạp thành công ${isFull ? 'toàn bộ file' : `trang ${sp}-${ep}`} (${text.length.toLocaleString('vi-VN')} ký tự)!`);
      } else {
        setReadStatus('⚠️ Không trích xuất được văn bản từ tệp này.');
      }
    } catch (err: any) {
      console.error(`Lỗi đọc file slot ${slotNumber}:`, err);
      setReadStatus(`⚠️ Lỗi: ${err?.message || 'Không thể đọc tệp'}`);
    } finally {
      setIsReading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) {
      if (f.name.toLowerCase().endsWith('.pdf')) {
        const pages = await getPdfPageCount(f);
        setTotalPages(pages);
        if (pages > 0 && endPage === 10) {
          setEndPage(Math.min(pages, 10));
        }
      }
      setReadStatus(`⏳ Đã tải tệp [${f.name}]. Vui lòng chọn khoảng trang rồi bấm "🔍 Bấm quét, đọc, phân tích" bên dưới.`);
    } else {
      setReadStatus('');
      setTotalPages(undefined);
      setExtractedSnippet('');
    }
  };

  const handleStartScan = () => {
    if (file) {
      processExtraction(file, scanMode, startPage, endPage);
    }
  };

  return (
    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5 transition-all hover:border-slate-700">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <label className="block text-slate-200 font-bold text-xs">
          {slotNumber}. {title}:
        </label>
        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono font-semibold">
          {badgeLabel}
        </span>
      </div>

      <div className="space-y-2">
        <input
          id={`ref-input-${id}`}
          type="file"
          accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.csv,.txt,.md,.json,.xml,.png,.jpg,.jpeg,.webp"
          onChange={handleFileChange}
          className="block w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
        />

        {/* Page Range Options & Scan Button Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-[11px]">
          <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded border border-slate-800">
            <span className="text-slate-400">Trang:</span>
            <button
              type="button"
              onClick={() => setScanMode('full')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                scanMode === 'full'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Full
            </button>
            <button
              type="button"
              onClick={() => setScanMode('range')}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                scanMode === 'range'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Khoảng trang
            </button>

            {scanMode === 'range' && (
              <div className="flex items-center gap-1 pl-1 border-l border-slate-700">
                <input
                  type="number"
                  min={1}
                  value={startPage}
                  onChange={e => setStartPage(parseInt(e.target.value) || 1)}
                  className="w-9 bg-slate-950 border border-slate-700 rounded text-center text-cyan-300 font-bold p-0.5 text-[10px]"
                  title="Từ trang"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="number"
                  min={1}
                  value={endPage}
                  onChange={e => setEndPage(parseInt(e.target.value) || 10)}
                  className="w-9 bg-slate-950 border border-slate-700 rounded text-center text-cyan-300 font-bold p-0.5 text-[10px]"
                  title="Đến trang"
                />
                {totalPages && (
                  <span className="text-[9px] text-slate-400 font-mono">
                    (/{totalPages})
                  </span>
                )}
              </div>
            )}
          </div>

          {file && (
            <button
              type="button"
              onClick={handleStartScan}
              disabled={isReading}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm ${
                extractedSnippet
                  ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                  : 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white border border-indigo-400'
              } disabled:opacity-50`}
              title="Quét và đọc nội dung tệp"
            >
              {isReading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-white" />
                  <span>Đang quét...</span>
                </>
              ) : (
                <>
                  {extractedSnippet ? <RefreshCw className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                  <span>{extractedSnippet ? 'Quét lại' : '🔍 Bấm quét & đọc'}</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Read Status Notification */}
        {readStatus && (
          <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 truncate">
              {isReading ? (
                <Loader2 className="w-3 h-3 animate-spin text-cyan-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              )}
              <span className="truncate">{readStatus}</span>
            </div>
            {extractedSnippet && (
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-[10px] text-cyan-400 hover:underline shrink-0 font-medium"
              >
                {showPreview ? 'Ẩn' : 'Xem'}
              </button>
            )}
          </div>
        )}

        {showPreview && extractedSnippet && (
          <div className="p-2 bg-slate-900 border border-slate-800 rounded max-h-32 overflow-y-auto font-mono text-[10px] text-slate-300 leading-relaxed whitespace-pre-wrap">
            {extractedSnippet}
          </div>
        )}
      </div>
    </div>
  );
};

  // Handle Multi-file Arbitrary Upload
  const handleMultiFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    setPendingMultiFiles(files);
    setMultiFileProgress(`⏳ Đã nhận diện ${files.length} tệp. Vui lòng chọn khoảng trang cần đọc rồi bấm "🔍 Bấm quét, đọc, phân tích tất cả tệp" bên dưới.`);
  };

  const handleStartScanMultiFiles = async () => {
    if (pendingMultiFiles.length === 0 && multiFileList.length === 0) return;
    const filesToScan = pendingMultiFiles.length > 0 ? pendingMultiFiles : [];
    if (filesToScan.length === 0) {
      setMultiFileProgress('⚠️ Vui lòng chọn tệp tài liệu trước khi bấm quét.');
      return;
    }

    setIsReadingMultiFiles(true);
    setMultiFileProgress(`Đang trích xuất & OCR ${filesToScan.length} tệp...`);

    const isFull = multiFileScanMode === 'full';
    try {
      const results = await readMultipleFilesAsText(
        filesToScan,
        {
          fullScan: isFull,
          startPage: isFull ? 1 : Math.max(1, multiFileStartPage),
          endPage: isFull ? undefined : Math.max(multiFileStartPage, multiFileEndPage),
          apiKeys
        },
        (idx, total, name) => {
          setMultiFileProgress(`Đang đọc & OCR (${idx}/${total}): ${name}...`);
        }
      );

      setMultiFileList(prev => [...prev, ...results]);
      setPendingMultiFiles([]);

      let appendedText = '';
      results.forEach(res => {
        if (res.status === 'success' && res.content.trim()) {
          appendedText += `\n--- [TÀI LIỆU THAM CHIẾU: ${res.name} (${isFull ? 'Toàn bộ file' : `Trang ${multiFileStartPage} - ${multiFileEndPage}`})] ---\n${res.content}\n`;
        }
      });

      if (appendedText) {
        onReferenceCacheChange(referenceCacheText + appendedText);
      }
      setMultiFileProgress(`✅ Đã nạp thành công ${results.filter(r => r.status === 'success').length}/${filesToScan.length} tệp vào bộ nhớ AI!`);
    } catch (err: any) {
      setMultiFileProgress(`⚠️ Lỗi khi đọc tệp: ${err?.message || String(err)}`);
    } finally {
      setIsReadingMultiFiles(false);
    }
  };

  const handleRemoveMultiFile = (index: number) => {
    setMultiFileList(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Quick Link to Community Document Repository */}
      {onNavigateTab && (
        <div className="bg-gradient-to-r from-blue-950/60 via-indigo-950/80 to-purple-950/60 border border-indigo-500/50 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-100 flex items-center gap-2">
                <span>Kho Văn Bản Chỉ Đạo AI, Khung Năng Lực Số & Giáo Án Mẫu</span>
                <span className="bg-amber-400 text-slate-950 text-[10px] px-1.5 py-0.2 rounded font-extrabold uppercase">Mới</span>
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Cần trích xuất văn bản chỉ đạo AI, Khung NLS, CV 5512/2345 để AI đối chiếu? Xem và nạp với 1 click tại Kho Tài Liệu.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab(11)}
            className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 shadow transition-transform hover:scale-105"
          >
            <span>Mở Tab 11: Kho Tài Liệu</span>
          </button>
        </div>
      )}

      {/* 1. File Upload & Page Range Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100">
                1. Nguồn Dữ liệu File SGK & Tài liệu Tham chiếu
              </h2>
              <p className="text-[11px] text-slate-400">
                Tự động nhận diện văn bản, OCR hình vẽ, sơ đồ & công thức toán học/KHTN
              </p>
            </div>
          </div>

          {/* Page Range vs Full Scan Controller */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setScanMode('range')}
                className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                  scanMode === 'range'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                📑 Khoảng trang (Từ A - B)
              </button>
              <button
                type="button"
                onClick={() => setScanMode('full')}
                className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                  scanMode === 'full'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🌐 Quét Full File
              </button>
            </div>

            {scanMode === 'range' && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                <Scissors className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-300">Từ</span>
                <input
                  type="number"
                  min={1}
                  value={pageStart}
                  onChange={e => onPageStartChange(parseInt(e.target.value) || 1)}
                  className="w-12 bg-slate-900 border border-slate-700 rounded text-center text-cyan-300 font-bold p-0.5"
                  title="Trang bắt đầu trích xuất"
                />
                <span className="text-slate-300">đến</span>
                <input
                  type="number"
                  min={1}
                  value={pageEnd}
                  onChange={e => onPageEndChange(parseInt(e.target.value) || 10)}
                  className="w-12 bg-slate-900 border border-slate-700 rounded text-center text-cyan-300 font-bold p-0.5"
                  title="Trang kết thúc trích xuất"
                />
                {detectedTotalPages && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    (/ {detectedTotalPages} trang)
                  </span>
                )}
              </div>
            )}

            {sgkFile && (
              <button
                type="button"
                onClick={handleStartScanSgk}
                disabled={isReadingSgk}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold border border-cyan-400 text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                title="Bấm quét, đọc và phân tích file SGK"
              >
                {isReadingSgk ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Đang quét...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>🔍 Bấm quét, đọc, phân tích SGK</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Main SGK Upload */}
          <div className="md:col-span-2 bg-cyan-950/30 border border-cyan-800/60 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-cyan-200 font-bold text-sm">
                1. File SGK chính (PDF / Ảnh trang sách / Docx / TXT) (*):
              </label>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-slate-400">Chế độ đang chọn:</span>
                <span className="bg-cyan-900/60 text-cyan-300 px-2 py-0.5 rounded border border-cyan-700 font-semibold">
                  {scanMode === 'full' ? '🌐 Toàn bộ file' : `📑 Trang ${pageStart} ➔ ${pageEnd}`}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.docx,.txt"
                onChange={e => {
                  const f = e.target.files?.[0] || null;
                  handleSgkFileSelect(f);
                }}
                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"
              />
              {sgkFile && (
                <span className="text-emerald-400 font-semibold shrink-0 text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  {sgkFile.name} {detectedTotalPages ? `(${detectedTotalPages} trang)` : ''}
                </span>
              )}
            </div>

            {/* Read Status Notification Badge */}
            {readSgkStatus && (
              <div className="mt-2.5 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs font-semibold flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isReadingSgk ? (
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-300 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <span>{readSgkStatus}</span>
                </div>
                {referenceCacheText.length > 50 && (
                  <button
                    type="button"
                    onClick={() => setShowTextPreview(!showTextPreview)}
                    className="text-[11px] bg-emerald-900 hover:bg-emerald-800 text-emerald-100 px-2.5 py-1 rounded border border-emerald-700 shrink-0"
                  >
                    {showTextPreview ? 'Ẩn văn bản' : '🔍 Xem văn bản đã trích xuất'}
                  </button>
                )}
              </div>
            )}

            {showTextPreview && referenceCacheText && (
              <div className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded-lg max-h-56 overflow-y-auto font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                <p className="text-cyan-400 font-bold mb-1">Nội dung văn bản trích xuất từ file SGK:</p>
                {referenceCacheText}
              </div>
            )}

            {/* Direct Image Crop / Screenshot Upload & Paste zone */}
            <div
              onPaste={handlePasteImage}
              className="mt-3 bg-slate-950 border-2 border-dashed border-cyan-700/60 hover:border-cyan-400/80 rounded-xl p-3.5 transition-all text-center space-y-2 cursor-pointer"
            >
              <div className="flex items-center justify-center gap-2 text-cyan-300 font-bold text-xs">
                <span>✂️ Cắt & Tải Ảnh Sơ Đồ / Hình Vẽ / Bài Tập SGK Trực Tiếp</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono">Dán Ctrl+V được</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Chọn file ảnh chụp trang sách, ảnh cắt sơ đồ/mô hình hoặc bấm <kbd className="bg-slate-800 text-cyan-300 px-1 py-0.5 rounded border border-slate-700">Ctrl + V</kbd> để dán ảnh trực tiếp từ bộ nhớ tạm!
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleSgkImageCropUpload}
                className="block w-full text-xs text-slate-400 file:mx-auto file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-800 file:text-cyan-100 hover:file:bg-cyan-700 cursor-pointer"
              />
            </div>

            {/* SGK Image Preview Badge */}
            {sgkImageDataUrl && (
              <div className="mt-3 bg-slate-900 border border-cyan-700/50 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={sgkImageDataUrl}
                      alt="Trang sách SGK"
                      className="w-20 h-24 object-cover rounded-lg border border-slate-700 shadow-md shrink-0"
                    />
                    <div className="space-y-1 text-xs">
                      <p className="text-cyan-300 font-bold flex items-center gap-1">
                        <span>📸</span> Đã nhận diện ảnh tư liệu / hình vẽ SGK
                      </p>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        Hệ thống sẽ dùng <span className="text-cyan-400 font-semibold">AI Multimodal Vision</span> để đọc toàn bộ chữ, công thức và <span className="text-emerald-400 font-semibold">phân tích chi tiết hình vẽ, sơ đồ</span> làm dữ liệu soạn giáo án!
                      </p>
                    </div>
                  </div>
                  {onSgkImageDataUrlChange && (
                    <button
                      onClick={() => onSgkImageDataUrlChange('')}
                      className="text-xs bg-rose-950/80 hover:bg-rose-900 text-rose-300 px-2.5 py-1 rounded border border-rose-800 shrink-0"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>

                {/* Instant Vision Diagram Analysis Button */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleAnalyzeDiagramAndImage(sgkImageDataUrl)}
                    disabled={isAnalyzingImage}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
                  >
                    {isAnalyzingImage ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang phân tích hình vẽ & đọc OCR...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>🔍 AI Đọc hiểu & Phân tích Chi tiết Hình vẽ này</span>
                      </>
                    )}
                  </button>
                  {imageAnalysisStatus && (
                    <span className="text-[11px] text-cyan-300 font-medium">
                      {imageAnalysisStatus}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Reference 2: KHDH */}
          <ReferenceSlotUpload
            id="khdh"
            slotNumber="2"
            title="Kế hoạch dạy học / Đặc thù môn"
            badgeLabel="KHDH"
            apiKeys={apiKeys}
            referenceCacheText={referenceCacheText}
            onReferenceCacheChange={onReferenceCacheChange}
          />

          {/* Reference 3: YCCD */}
          <ReferenceSlotUpload
            id="yccd"
            slotNumber="3"
            title="Khung Yêu cầu cần đạt"
            badgeLabel="YCCĐ 2018"
            apiKeys={apiKeys}
            referenceCacheText={referenceCacheText}
            onReferenceCacheChange={onReferenceCacheChange}
          />

          {/* Reference 4: Sample GA */}
          <ReferenceSlotUpload
            id="mau_ga"
            slotNumber="4"
            title="Giáo án mẫu chuẩn CV 5512/2345"
            badgeLabel="Giáo án mẫu"
            apiKeys={apiKeys}
            referenceCacheText={referenceCacheText}
            onReferenceCacheChange={onReferenceCacheChange}
          />

          {/* Reference 5: Digital Competency */}
          <ReferenceSlotUpload
            id="nls"
            slotNumber="5"
            title="Khung Năng lực Số (NLS)"
            badgeLabel="Khung NLS"
            apiKeys={apiKeys}
            referenceCacheText={referenceCacheText}
            onReferenceCacheChange={onReferenceCacheChange}
          />

          {/* Reference 6: AI Competency */}
          <ReferenceSlotUpload
            id="nlai"
            slotNumber="6"
            title="Khung Năng lực Trí tuệ Nhân tạo (AI)"
            badgeLabel="Năng lực AI"
            apiKeys={apiKeys}
            referenceCacheText={referenceCacheText}
            onReferenceCacheChange={onReferenceCacheChange}
          />

          {/* Reference 7: STEM */}
          <ReferenceSlotUpload
            id="stem"
            slotNumber="7"
            title="Chuyên đề Liên môn / Giáo dục STEM"
            badgeLabel="STEM / Liên môn"
            apiKeys={apiKeys}
            referenceCacheText={referenceCacheText}
            onReferenceCacheChange={onReferenceCacheChange}
          />

          {/* Reference 8: Multi-File Arbitrary References (NEW!) */}
          <div className="md:col-span-2 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-950 p-4 rounded-xl border border-indigo-700/60 space-y-3 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-800/40 pb-2">
              <div className="flex items-center gap-2">
                <Files className="w-4 h-4 text-indigo-400" />
                <label className="block text-indigo-200 font-bold text-xs sm:text-sm">
                  8. Tham chiếu Tài liệu Bất kỳ (Tải lên cùng lúc nhiều tệp với mọi định dạng):
                </label>
              </div>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-semibold border border-indigo-500/40">
                PDF, DOCX, DOC, PPTX, XLSX, PNG, JPG, TXT, CSV, MD...
              </span>
            </div>

            <p className="text-[11px] text-slate-300">
              Thầy/cô có thể chọn hoặc kéo thả <strong>nhiều tệp tài liệu tham khảo cùng lúc</strong>. Hệ thống tự động trích xuất nội dung, hỗ trợ OCR đa phương thức và đọc hiểu hình ảnh/sơ đồ để nạp vào bộ nhớ AI.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-lg border border-indigo-900/60">
              <div className="flex flex-wrap items-center gap-3">
                <label className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-all shadow">
                  <FileUp className="w-4 h-4" />
                  <span>+ Chọn nhiều tệp tài liệu</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.csv,.txt,.md,.json,.xml,.png,.jpg,.jpeg,.webp"
                    onChange={handleMultiFileSelect}
                    className="hidden"
                  />
                </label>

                {/* Range vs Full for Multi-file */}
                <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
                  <span className="text-slate-400">Tùy chọn trang:</span>
                  <button
                    type="button"
                    onClick={() => setMultiFileScanMode('full')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                      multiFileScanMode === 'full'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Quét Full
                  </button>
                  <button
                    type="button"
                    onClick={() => setMultiFileScanMode('range')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                      multiFileScanMode === 'range'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Khoảng trang
                  </button>

                  {multiFileScanMode === 'range' && (
                    <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
                      <span className="text-slate-400">Từ</span>
                      <input
                        type="number"
                        min={1}
                        value={multiFileStartPage}
                        onChange={e => setMultiFileStartPage(parseInt(e.target.value) || 1)}
                        className="w-10 bg-slate-900 border border-slate-700 rounded text-center text-cyan-300 font-bold p-0.5 text-[11px]"
                      />
                      <span className="text-slate-400">-</span>
                      <input
                        type="number"
                        min={1}
                        value={multiFileEndPage}
                        onChange={e => setMultiFileEndPage(parseInt(e.target.value) || 10)}
                        className="w-10 bg-slate-900 border border-slate-700 rounded text-center text-cyan-300 font-bold p-0.5 text-[11px]"
                      />
                    </div>
                  )}
                </div>

                {/* Scan Action Button */}
                {pendingMultiFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={handleStartScanMultiFiles}
                    disabled={isReadingMultiFiles}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isReadingMultiFiles ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang quét ({pendingMultiFiles.length} tệp)...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>🔍 Bấm quét, đọc, phân tích ({pendingMultiFiles.length} tệp đã chọn)</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {isReadingMultiFiles && (
                <div className="flex items-center gap-2 text-xs text-indigo-300 font-medium animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>{multiFileProgress}</span>
                </div>
              )}

              {!isReadingMultiFiles && multiFileProgress && (
                <span className="text-xs text-emerald-400 font-medium">{multiFileProgress}</span>
              )}
            </div>

            {/* Uploaded File Badges List */}
            {multiFileList.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                  <span>Danh sách tệp tham chiếu đã nạp ({multiFileList.length} tệp):</span>
                  <button
                    onClick={() => setMultiFileList([])}
                    className="text-rose-400 hover:underline flex items-center gap-1 text-[10px]"
                  >
                    <Trash2 className="w-3 h-3" />
                    Xóa tất cả
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {multiFileList.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-slate-900 border border-slate-700/80 rounded-lg p-2 text-xs text-slate-200"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        {item.status === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <div className="truncate">
                          <p className="truncate font-medium text-[11px]">{item.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {(item.size / 1024).toFixed(1)} KB • {item.status === 'success' ? 'Đã nạp' : 'Lỗi đọc'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMultiFile(idx)}
                        className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                        title="Xóa tệp này"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Reference Cache & AI Prompt Context Memory */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-slate-100">
              2. Bộ nhớ Đệm Tham chiếu (Reference Memory Cache)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExtractReferences}
              className="px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white font-semibold text-xs transition-all flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              Nạp dữ liệu
            </button>
            <button
              onClick={() => onReferenceCacheChange('')}
              className="px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-300 border border-rose-700 font-semibold text-xs transition-all flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa đệm
            </button>
          </div>
        </div>

        <textarea
          value={referenceCacheText}
          onChange={e => onReferenceCacheChange(e.target.value)}
          rows={5}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-300 font-mono text-xs leading-relaxed focus:border-cyan-500 focus:outline-none"
          placeholder="Bộ nhớ đệm tự động tổng hợp nội dung từ các file tham chiếu..."
        />
      </div>

      {/* 3. API Keys Config & Execution Engine */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">
              3. Cấu hình Chuỗi Mã API Key & Bật Engine AI
            </h2>
          </div>

          <button
            onClick={onOpenApiGuide}
            className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Hướng dẫn lấy API miễn phí
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs text-slate-300 font-semibold">
              (Tùy chọn) Danh sách mã API Key cá nhân của Thầy/Cô:
            </label>
            {apiKeysInput.trim() && (
              <span className="text-[11px] text-cyan-400 font-semibold">
                Đã nạp {apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean).length} Key cá nhân
              </span>
            )}
          </div>

          {/* Overload Guidance Banner */}
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300">Mẹo khi hệ thống báo quá tải (429 / Quota):</span>{' '}
              Khi các Key mặc định quá tải hoặc chưa có Key Admin, Thầy/Cô chỉ cần nhập <strong>1-2 API Key Gemini miễn phí cá nhân</strong> vào đây. Hệ thống sẽ ưu tiên dùng Key của Thầy/Cô để tạo giáo án siêu tốc và không giới hạn!
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type={showApiKeys ? 'text' : 'password'}
              value={apiKeysInput}
              onChange={e => onApiKeysInputChange(e.target.value)}
              placeholder="Nhập hoặc dán API Key cá nhân (Dán nhiều key cách nhau bằng dấu phẩy hoặc xuống dòng)..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 text-xs font-mono focus:border-cyan-500 focus:outline-none"
            />
            <button
              onClick={() => setShowApiKeys(!showApiKeys)}
              className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title={showApiKeys ? 'Ẩn mã API Key' : 'Hiện mã API Key'}
            >
              {showApiKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            {apiKeysInput.trim() && (
              <button
                type="button"
                onClick={() => {
                  onApiKeysInputChange('');
                }}
                className="px-3 py-2.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title="Xóa toàn bộ các API Key cá nhân đã dán"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Xóa tất cả</span>
              </button>
            )}
          </div>

          {/* Individual Key Cards for Easy Deletion */}
          {(() => {
            const keyList = apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);
            if (keyList.length === 0) return null;

            const handleRemoveSingleKey = (indexToRemove: number) => {
              const updated = keyList.filter((_, idx) => idx !== indexToRemove);
              onApiKeysInputChange(updated.join(', '));
            };

            return (
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                  <span>Chi tiết từng Key cá nhân:</span>
                  <span className="text-[10px] text-cyan-400 font-medium">
                    Tự động xoay vòng khi 1 key bị giới hạn
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {keyList.map((k, idx) => {
                    const masked = showApiKeys
                      ? k
                      : k.length > 10
                      ? `${k.slice(0, 6)}••••••••${k.slice(-4)}`
                      : '••••••••••••';
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-cyan-300"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800/80 text-cyan-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <span className="truncate text-[11px]" title={k}>
                            {masked}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSingleKey(idx)}
                          className="text-slate-400 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                          title="Xóa mã API Key này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <p className="text-[11px] text-slate-400 italic">
            💡 Giáo viên có thể tự thêm 1 hoặc nhiều API Key cá nhân để tăng dung lượng và hạn ngạch riêng. Key cá nhân được lưu trữ riêng biệt trên thiết bị của Thầy/Cô. Thầy/Cô có thể bấm xóa key bất kỳ lúc nào khi không sử dụng nữa.
          </p>
        </div>

        {/* 14 Hard Rules Badge Card */}
        <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
              🛡️ KÍCH HOẠT 100%: BỘ 14 ĐIỀU KHOẢN "QUY TẮC BÀN TAY SẮT"
            </span>
            <span className="text-[10px] text-slate-400 font-mono bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full text-emerald-300">
              CV 5512 • TT 02/2025 • QĐ 2422
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 text-[10px] text-slate-300">
            <div className="bg-slate-900/90 border border-slate-800 px-2 py-1 rounded">✅ Đ1. Cấm lời dẫn AI & Căn giữa</div>
            <div className="bg-slate-900/90 border border-slate-800 px-2 py-1 rounded">✅ Đ2. Mục tiêu 4 tầng & TV/Máy tính</div>
            <div className="bg-slate-900/90 border border-slate-800 px-2 py-1 rounded">✅ Đ3. &gt;=5 trang A4/tiết (45p)</div>
            <div className="bg-slate-900/90 border border-slate-800 px-2 py-1 rounded">✅ Đ4. In đậm 4 HĐ & 4 Bước SP</div>
            <div className="bg-slate-900/90 border border-slate-800 px-2 py-1 rounded">✅ Đ5. Đồng bộ 1-1 bảng 2 cột</div>
            <div className="bg-slate-900/90 border border-slate-800 px-2 py-1 rounded">✅ Đ6. Đúng bản chất PPDH/KTDH</div>
            <div className="bg-slate-900/90 border border-slate-800 px-2 py-1 rounded">✅ Đ7. Giải chi tiết 100% SGK</div>
            <div className="bg-slate-900/90 border border-slate-800 px-2 py-1 rounded">✅ Đ8. Mã NLS & AI (6.2TC1a...)</div>
            <div className="bg-slate-900/90 border border-slate-800 px-2 py-1 rounded">✅ Đ9. Thơ tổng kết & Dặn dò</div>
            <div className="bg-slate-900/90 border border-slate-800 px-2 py-1 rounded">✅ Đ10. Bảng ký duyệt duy nhất</div>
            <div className="bg-slate-900/90 border border-slate-800 px-2 py-1 rounded">✅ Đ11. Chuẩn LaTeX & Sạch Word</div>
            <div className="bg-slate-900/90 border border-slate-800 px-2 py-1 rounded">✅ Đ12-14. Tạo đủ tiết & Tự nối tiếp</div>
          </div>
        </div>

        {/* Quick Options before Generation */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Thời lượng tiết học:</span>
            <span className="font-bold text-cyan-300">{thoiluong}</span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer hover:text-cyan-300 transition-colors">
            <input
              type="checkbox"
              checked={Boolean(hideActivityTime)}
              onChange={e => onToggleHideActivityTime?.(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 border-slate-700 bg-slate-950 cursor-pointer"
            />
            <span className="font-semibold text-slate-200">
              Ẩn bỏ thời gian các hoạt động (không ghi số phút)
            </span>
          </label>
        </div>

        {/* Start Generation Button */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={onStartAIGeneration}
            disabled={isGenerating}
            className={`w-full max-w-md py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-xl transition-all ${
              isGenerating
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 shadow-cyan-900/30 active:scale-98'
            }`}
          >
            <Sparkles className={`w-5 h-5 ${isGenerating ? 'animate-spin' : 'animate-pulse text-amber-300'}`} />
            {isGenerating ? 'ĐANG PHÂN TÍCH VÀ SOẠN GIÁO ÁN...' : '✨ BẮT ĐẦU SOẠN GIÁO ÁN CV 5512 VỚI AI'}
          </button>
        </div>
      </div>
    </div>
  );
};
