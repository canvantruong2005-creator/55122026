import React, { useState, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import {
  FileText,
  Download,
  Printer,
  Copy,
  Check,
  Eye,
  Edit3,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  BookOpen,
  Users,
  Layers,
  CheckCircle2,
  AlertCircle,
  Columns,
  Smartphone,
  Monitor,
  Share2,
  FileCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { sanitizeMathForVietnamese } from '../lib/mathSanitizer';
import { autoNormalizeVietnameseFont } from '../lib/vietnameseFontConverter';

interface AppendixDocumentPreviewProps {
  pl1Content: string;
  pl2Content: string;
  pl3Content: string;
  selectedAppendix: 'PL1' | 'PL2' | 'PL3';
  onSelectAppendix: (app: 'PL1' | 'PL2' | 'PL3') => void;
  onChangeContent: (app: 'PL1' | 'PL2' | 'PL3', val: string) => void;
  planStandard: 'CV5512' | 'CV2345';
  schoolName: string;
  departmentName: string;
  teacherName: string;
  bghSigner: string;
  departmentSigner: string;
  academicYear: string;
  monHoc: string;
  lop: string;
  isGenerating?: boolean;
  onGenerateCurrent?: () => void;
  onOpenCompetencyModal?: () => void;
  onExportWordSingle?: (app: 'PL1' | 'PL2' | 'PL3') => void;
  onExportWordAll?: () => void;
}

/**
 * Normalizes Markdown tables and removes noisy characters for clean A4 printing
 */
function prepareAppendixMarkdown(raw: string): string {
  if (!raw) return '';
  // 1. Auto-normalize any legacy or distorted Vietnamese font encoding (TCVN3 / VNI / Windows-1252)
  const normalizedFont = autoNormalizeVietnameseFont(raw);
  let text = sanitizeMathForVietnamese(normalizedFont);

  // Remove repeated long divider lines
  text = text.replace(/^[ \t]*[-*_=]{3,}[ \t]*$/gm, '');
  text = text.replace(/(?:<br\s*\/?>\s*)+[-*_=]{2,}(?:\s*<br\s*\/?>)+/gi, '<br/><br/>');

  // Fix unclosed double asterisks
  text = text.replace(/\*\*\s*\*\*/g, '');

  // Normalize table rows
  const rawLines = text.split('\n');
  const normalized: string[] = [];
  let inTable = false;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) {
      if (inTable) {
        let continues = false;
        for (let j = i + 1; j < rawLines.length; j++) {
          const next = rawLines[j].trim();
          if (!next) continue;
          if (next.includes('|') && !next.startsWith('#')) continues = true;
          break;
        }
        if (!continues) inTable = false;
      }
      normalized.push('');
      continue;
    }

    if (line.includes('|') && !line.startsWith('#')) {
      const isDivider = /^[:\s|-]+$/.test(line.replace(/^\||\|$/g, ''));
      if (isDivider) {
        inTable = true;
        normalized.push(line);
        continue;
      }

      const rawCols = line.split('|').map(c => c.trim());
      if (line.startsWith('|')) rawCols.shift();
      if (line.endsWith('|')) rawCols.pop();

      const formattedLine = '| ' + rawCols.join(' | ') + ' |';

      if (!inTable) {
        inTable = true;
        normalized.push(formattedLine);
        const nextLine = (rawLines[i + 1] || '').trim();
        const nextIsDivider = nextLine.includes('|') && /^[:\s|-]+$/.test(nextLine.replace(/^\||\|$/g, ''));
        if (!nextIsDivider) {
          const autoDivider = '| ' + rawCols.map(() => ':---').join(' | ') + ' |';
          normalized.push(autoDivider);
        }
      } else {
        normalized.push(formattedLine);
      }
    } else {
      inTable = false;
      normalized.push(rawLines[i]);
    }
  }

  return normalized.join('\n');
}

export const AppendixDocumentPreview: React.FC<AppendixDocumentPreviewProps> = ({
  pl1Content,
  pl2Content,
  pl3Content,
  selectedAppendix,
  onSelectAppendix,
  onChangeContent,
  planStandard,
  schoolName,
  departmentName,
  teacherName,
  bghSigner,
  departmentSigner,
  academicYear,
  monHoc,
  lop,
  isGenerating = false,
  onGenerateCurrent,
  onOpenCompetencyModal,
  onExportWordSingle,
  onExportWordAll
}) => {
  // View Modes: 'a4_preview' (Formatted Print Layout), 'editor' (Markdown Source), 'all_combined' (Combined 3 Appendices), 'side_by_side' (Desktop multi-pane)
  const [viewMode, setViewMode] = useState<'a4_preview' | 'editor' | 'all_combined' | 'side_by_side'>('a4_preview');
  const [isLandscape, setIsLandscape] = useState(true);
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<'paper' | 'dark' | 'clean'>('paper');

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Content for current selected appendix
  const currentContent =
    selectedAppendix === 'PL1' ? pl1Content : selectedAppendix === 'PL2' ? pl2Content : pl3Content;

  const setCurrentContent = (val: string) => {
    onChangeContent(selectedAppendix, val);
  };

  // Appendix Names depending on Standard
  const appendixLabels = useMemo(() => {
    if (planStandard === 'CV2345') {
      return {
        PL1: {
          short: 'Phụ lục 1',
          name: 'KHGD Nhà Trường (Tiểu học)',
          desc: 'Khung thời gian 35 tuần, cơ cấu tiết Khối 1-5, HĐ tập thể',
          icon: BookOpen,
          color: 'emerald'
        },
        PL2: {
          short: 'Phụ lục 2',
          name: 'KHDH Môn học / HĐGD Khối lớp',
          desc: 'Phân phối 35 tuần: Mạch kiến thức, Năng lực số, AI, STEM',
          icon: Users,
          color: 'teal'
        },
        PL3: {
          short: 'Phụ lục 3',
          name: 'Kế hoạch bài dạy (Giáo án 4 bước)',
          desc: 'Mở đầu - Hình thành - Luyện tập - Vận dụng (TT 27)',
          icon: FileText,
          color: 'cyan'
        }
      };
    }
    return {
      PL1: {
        short: 'Phụ lục 1',
        name: 'KHDH Môn học của Tổ Chuyên Môn',
        desc: 'Đặc điểm tình hình, phân phối 35 tuần, chuyên đề & kiểm tra',
        icon: BookOpen,
        color: 'cyan'
      },
      PL2: {
        short: 'Phụ lục 2',
        name: 'Kế hoạch Hoạt động GD của Tổ',
        desc: 'Chủ đề ngoại khóa, CLB AI, STEM, trải nghiệm sáng tạo',
        icon: Users,
        color: 'blue'
      },
      PL3: {
        short: 'Phụ lục 3',
        name: 'Kế hoạch Giáo dục của Giáo Viên',
        desc: 'Phân phối cá nhân, thiết bị, địa điểm dạy học & nhiệm vụ khác',
        icon: FileText,
        color: 'indigo'
      }
    };
  }, [planStandard]);

  // Status statistics
  const stats = useMemo(() => {
    const p1Len = pl1Content.trim().length;
    const p2Len = pl2Content.trim().length;
    const p3Len = pl3Content.trim().length;
    const totalLen = p1Len + p2Len + p3Len;
    const countCreated = (p1Len > 0 ? 1 : 0) + (p2Len > 0 ? 1 : 0) + (p3Len > 0 ? 1 : 0);

    return {
      PL1: { hasContent: p1Len > 0, length: p1Len, lines: pl1Content ? pl1Content.split('\n').length : 0 },
      PL2: { hasContent: p2Len > 0, length: p2Len, lines: pl2Content ? pl2Content.split('\n').length : 0 },
      PL3: { hasContent: p3Len > 0, length: p3Len, lines: pl3Content ? pl3Content.split('\n').length : 0 },
      totalLen,
      countCreated
    };
  }, [pl1Content, pl2Content, pl3Content]);

  const handleCopy = (textToCopy: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Combined content of all 3 appendices
  const combinedAllContent = useMemo(() => {
    const parts: string[] = [];
    if (pl1Content.trim()) {
      parts.push(pl1Content.trim());
    }
    if (pl2Content.trim()) {
      parts.push(pl2Content.trim());
    }
    if (pl3Content.trim()) {
      parts.push(pl3Content.trim());
    }
    return parts.join('\n\n<div class="page-break"></div>\n\n---\n\n');
  }, [pl1Content, pl2Content, pl3Content]);

  // Active markdown to render
  const activeMarkdown = useMemo(() => {
    if (viewMode === 'all_combined') {
      return prepareAppendixMarkdown(combinedAllContent);
    }
    return prepareAppendixMarkdown(currentContent);
  }, [viewMode, combinedAllContent, currentContent]);

  return (
    <div className={`space-y-4 ${isFullScreen ? 'fixed inset-0 z-50 bg-slate-950 p-3 sm:p-6 overflow-y-auto' : ''}`}>
      {/* Top Appendix Status Cards Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-100">
                  Xem Trước Trực Quan Các Phụ Lục Kế Hoạch Giáo Dục
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                  {planStandard === 'CV2345' ? 'Tiểu Học (CV 2345)' : 'THCS / THPT (CV 5512)'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Đã tạo <strong className="text-emerald-400">{stats.countCreated}/3</strong> Phụ lục • Phù hợp chuẩn in ấn A4, hiển thị đa thiết bị
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {stats.countCreated > 0 && onExportWordAll && (
              <button
                onClick={onExportWordAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-900/30 transition-all min-h-[40px]"
                title="Tải toàn bộ 3 phụ lục vào 1 file Word duy nhất"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Xuất Trọn Bộ 3 Phụ Lục (.docx)</span>
                <span className="sm:hidden">Xuất Cả Bộ Word</span>
              </button>
            )}

            {isFullScreen && (
              <button
                onClick={() => setIsFullScreen(false)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all min-h-[40px]"
              >
                <Minimize2 className="w-4 h-4" />
                <span>Thu nhỏ</span>
              </button>
            )}
          </div>
        </div>

        {/* Responsive Grid of 3 Appendix Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
          {(['PL1', 'PL2', 'PL3'] as const).map(appKey => {
            const info = appendixLabels[appKey];
            const stat = stats[appKey];
            const isSelected = selectedAppendix === appKey;
            const Icon = info.icon;

            return (
              <div
                key={appKey}
                onClick={() => onSelectAppendix(appKey)}
                className={`relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-left ${
                  isSelected
                    ? 'bg-gradient-to-br from-cyan-950/80 via-slate-900 to-slate-950 border-cyan-500 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`p-1.5 rounded-lg ${
                          isSelected
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-slate-800/80 text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-200">{info.short}</span>
                    </div>

                    {stat.hasContent ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Đã tạo ({stat.lines} dòng)</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800/80 text-slate-400 border border-slate-700/60">
                        <AlertCircle className="w-3 h-3 text-slate-500" />
                        <span>Chưa tạo</span>
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-semibold text-slate-100 line-clamp-1">{info.name}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{info.desc}</p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2.5 mt-2 border-t border-slate-800/80 text-[11px]">
                  <span className={`font-mono ${stat.hasContent ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {stat.hasContent ? `${stat.length.toLocaleString('vi-VN')} ký tự` : 'Trống'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onSelectAppendix(appKey);
                        setViewMode('a4_preview');
                      }}
                      className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                        isSelected
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      👁️ Xem
                    </button>
                    {stat.hasContent && onExportWordSingle && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onExportWordSingle(appKey);
                        }}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 transition-all"
                        title="Tải file Word cho phụ lục này"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-5 shadow-lg space-y-4">
        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          {/* Left: View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('a4_preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'a4_preview'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem In A4</span>
            </button>

            <button
              onClick={() => setViewMode('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'editor'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Chỉnh Sửa</span>
            </button>

            <button
              onClick={() => setViewMode('all_combined')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'all_combined'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Gộp Cả 3 Phụ Lục</span>
              <span className="sm:hidden">Gộp Cả 3</span>
            </button>

            <button
              onClick={() => setViewMode('side_by_side')}
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'side_by_side'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Đối Chiếu 3 Cột</span>
            </button>
          </div>

          {/* Right: Layout / Zoom / Export Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Landscape vs Portrait Toggle */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setIsLandscape(true)}
                className={`px-2.5 py-1 rounded font-semibold transition-all ${
                  isLandscape
                    ? 'bg-slate-800 text-cyan-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Khổ ngang rất tối ưu cho bảng phân phối 35 tuần nhiều cột"
              >
                <span>Khổ Ngang</span>
              </button>
              <button
                onClick={() => setIsLandscape(false)}
                className={`px-2.5 py-1 rounded font-semibold transition-all ${
                  !isLandscape
                    ? 'bg-slate-800 text-cyan-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Khổ dọc chuẩn văn bản hành chính"
              >
                <span>Khổ Dọc</span>
              </button>
            </div>

            {/* Paper Theme Switcher */}
            <div className="hidden sm:flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setPreviewTheme('paper')}
                className={`px-2 py-1 rounded font-semibold ${
                  previewTheme === 'paper' ? 'bg-slate-800 text-amber-200' : 'text-slate-400'
                }`}
                title="Nền giấy trắng A4 chuẩn in"
              >
                📄 Giấy In
              </button>
              <button
                onClick={() => setPreviewTheme('dark')}
                className={`px-2 py-1 rounded font-semibold ${
                  previewTheme === 'dark' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400'
                }`}
                title="Giao diện tối dịu mắt"
              >
                🌙 Tối
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 text-xs p-0.5">
              <button
                onClick={() => setZoomPercent(prev => Math.max(prev - 10, 60))}
                className="p-1.5 text-slate-400 hover:text-slate-200"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 font-mono text-[11px] text-slate-300 min-w-[40px] text-center">
                {zoomPercent}%
              </span>
              <button
                onClick={() => setZoomPercent(prev => Math.min(prev + 10, 140))}
                className="p-1.5 text-slate-400 hover:text-slate-200"
                title="Phóng to"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Actions: Copy / Print / Export / FullScreen */}
            {onOpenCompetencyModal && (
              <button
                onClick={onOpenCompetencyModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold shadow-md shadow-purple-900/30 transition-all min-h-[36px] animate-pulse-subtle"
                title="Giữ nguyên 100% nội dung & định dạng bảng hiện có, chỉ tích hợp thêm Năng lực số / AI / STEM vào phụ lục này"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span className="hidden sm:inline">✨ Tích Hợp Năng Lực (Giữ Nguyên Bản)</span>
                <span className="sm:hidden">Tích Hợp NL</span>
              </button>
            )}

            <button
              onClick={() => {
                const fixed = autoNormalizeVietnameseFont(currentContent);
                onChangeContent(selectedAppendix, fixed);
                alert('✅ Đã chuẩn hóa và sửa toàn bộ lỗi font chữ tiếng Việt (TCVN3 / VNI / Windows-1252) thành công!');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 text-xs font-semibold border border-amber-700/60 transition-all min-h-[36px]"
              title="Tự động sửa lỗi font tiếng Việt (VNI / .VnTime / TCVN3 / Chữ bị lỗi dấu)"
            >
              <FileCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">🔤 Sửa Lỗi Font</span>
              <span className="sm:hidden">Font</span>
            </button>

            <button
              onClick={() => handleCopy(viewMode === 'all_combined' ? combinedAllContent : currentContent)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all min-h-[36px]"
              title="Sao chép nội dung"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Đã chép' : 'Sao chép'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all min-h-[36px]"
              title="In hoặc Lưu thành PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">In / PDF</span>
            </button>

            {onExportWordSingle && (
              <button
                onClick={() => onExportWordSingle(selectedAppendix)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition-all min-h-[36px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xuất Word ({selectedAppendix})</span>
                <span className="sm:hidden">Word</span>
              </button>
            )}

            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
              title={isFullScreen ? 'Thoát toàn màn hình' : 'Xem toàn màn hình'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Swipe / Landscape Hint */}
        <div className="sm:hidden flex items-center justify-between bg-cyan-950/40 px-3 py-1.5 rounded-lg border border-cyan-800/40 text-[11px] text-cyan-300">
          <span>💡 Gợi ý: Vuốt ngang trên bảng để xem đầy đủ các cột dữ liệu</span>
          <span className="font-mono font-bold text-xs">{zoomPercent}%</span>
        </div>

        {/* Body Render based on View Mode */}
        {viewMode === 'editor' ? (
          /* Editor Mode */
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Đang chỉnh sửa trực tiếp Markdown của <strong>{appendixLabels[selectedAppendix].name}</strong>:</span>
              <span className="font-mono">{currentContent.length.toLocaleString('vi-VN')} ký tự</span>
            </div>
            <textarea
              value={currentContent}
              onChange={e => setCurrentContent(e.target.value)}
              rows={22}
              placeholder={`Chưa có nội dung cho ${appendixLabels[selectedAppendix].name}. Vui lòng tạo hoặc nạp mẫu...`}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 font-mono text-xs leading-relaxed focus:border-cyan-500 focus:outline-none resize-y"
            />
          </div>
        ) : viewMode === 'side_by_side' ? (
          /* Side-by-side Multi Column View (Desktop) */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['PL1', 'PL2', 'PL3'] as const).map(appKey => {
              const text = appKey === 'PL1' ? pl1Content : appKey === 'PL2' ? pl2Content : pl3Content;
              const info = appendixLabels[appKey];
              return (
                <div key={appKey} className="bg-slate-950 rounded-xl border border-slate-800 flex flex-col h-[700px]">
                  <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 rounded-t-xl">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-200">{info.short}:</span>
                      <span className="text-[11px] text-cyan-400 truncate max-w-[140px]">{info.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        onSelectAppendix(appKey);
                        setViewMode('a4_preview');
                      }}
                      className="px-2 py-0.5 rounded text-[10px] bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-700/50"
                    >
                      Xem đơn
                    </button>
                  </div>
                  <div className="p-4 overflow-y-auto flex-1 font-serif text-xs text-slate-300 leading-relaxed bg-white text-slate-900 rounded-b-xl">
                    {text.trim() ? (
                      <div className="markdown-body text-slate-900">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeRaw, rehypeKatex]}
                        >
                          {prepareAppendixMarkdown(text)}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-center text-slate-400 py-20 italic">
                        Chưa có nội dung cho {info.short}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* A4 Formatted Print Preview Mode (Single or Combined) */
          <div className="overflow-x-auto p-2 sm:p-6 bg-slate-950/80 rounded-xl border border-slate-800 flex justify-center">
            {activeMarkdown.trim() ? (
              <div
                ref={printAreaRef}
                style={{
                  transform: `scale(${zoomPercent / 100})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease-out'
                }}
                className={`w-full transition-all ${
                  isLandscape
                    ? 'max-w-[1200px] min-h-[780px]'
                    : 'max-w-[850px] min-h-[1100px]'
                } ${
                  previewTheme === 'paper'
                    ? 'bg-white text-slate-900 shadow-2xl rounded-sm p-6 sm:p-12 font-serif-doc appendix-a4-page'
                    : previewTheme === 'dark'
                    ? 'bg-slate-900 text-slate-100 shadow-2xl rounded-xl p-6 sm:p-12 font-sans border border-slate-700'
                    : 'bg-slate-50 text-slate-800 shadow-xl rounded-lg p-6 sm:p-10 font-serif-doc appendix-a4-page border border-slate-200'
                }`}
              >
                {/* Header Banner on Document */}
                <div className="border-b border-slate-300 pb-3 mb-6 flex flex-wrap items-center justify-between text-xs text-slate-600 print:text-black">
                  <div className="font-bold uppercase tracking-wider">
                    {schoolName} • {departmentName}
                  </div>
                  <div>
                    Năm học: {academicYear} | Môn: {monHoc} (Lớp {lop})
                  </div>
                </div>

                {/* Markdown Render Content */}
                <div
                  className={`markdown-body text-[13px] sm:text-[14px] leading-relaxed space-y-4 ${
                    previewTheme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                  }`}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                    components={{
                      h1: ({ node, ...props }) => (
                        <h1
                          className="text-base sm:text-lg font-black text-center uppercase tracking-wide my-4 text-cyan-900 print:text-black border-b pb-2"
                          {...props}
                        />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2
                          className="text-sm sm:text-base font-bold uppercase tracking-wide mt-5 mb-2 text-slate-900 print:text-black border-b border-slate-200 pb-1"
                          {...props}
                        />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3
                          className="text-xs sm:text-sm font-bold mt-4 mb-1 text-slate-800 print:text-black"
                          {...props}
                        />
                      ),
                      table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-4 -mx-2 sm:mx-0">
                          <table
                            className="w-full border-collapse border border-slate-400 text-xs sm:text-[13px] text-left"
                            {...props}
                          />
                        </div>
                      ),
                      thead: ({ node, ...props }) => (
                        <thead className="bg-slate-100 print:bg-slate-200 font-bold border-b border-slate-400" {...props} />
                      ),
                      th: ({ node, ...props }) => (
                        <th
                          className="border border-slate-400 p-2 font-bold text-center align-middle bg-slate-100/90 print:bg-slate-200"
                          {...props}
                        />
                      ),
                      td: ({ node, ...props }) => (
                        <td className="border border-slate-400 p-2 align-top text-justify leading-snug" {...props} />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul className="list-disc pl-5 space-y-1 my-2" {...props} />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol className="list-decimal pl-5 space-y-1 my-2" {...props} />
                      ),
                      p: ({ node, ...props }) => (
                        <div className="my-2 leading-relaxed text-justify" {...props} />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong className="font-bold text-slate-950 print:text-black" {...props} />
                      )
                    }}
                  >
                    {activeMarkdown}
                  </ReactMarkdown>
                </div>

                {/* Watermark and Page Footer */}
                <div className="border-t border-slate-300 pt-4 mt-8 flex flex-wrap items-center justify-between text-[11px] text-slate-500 print:text-black">
                  <div>
                    {planStandard === 'CV2345'
                      ? 'Kế hoạch Giáo dục Tiểu học theo Công văn 2345/BGDĐT-GDTH'
                      : 'Kế hoạch Giáo dục THCS/THPT theo Công văn 5512/BGDĐT-GDTrH'}
                  </div>
                  <div className="font-semibold italic">
                    Bản quyền: Thầy Cấn Văn Trường - 0988.302.636
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <FileText className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-slate-200">
                  Chưa có nội dung cho {appendixLabels[selectedAppendix].name}
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Bấm nút <strong>"Tạo Kế Hoạch {selectedAppendix}"</strong> hoặc chọn nạp các bộ phân phối chương trình mẫu sẵn có phía trên để xem trước tài liệu hoàn chỉnh.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {onOpenCompetencyModal && (
                    <button
                      onClick={onOpenCompetencyModal}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span>✨ Tích Hợp Năng Lực & AI (Giữ 100% Nguyên Bản)</span>
                    </button>
                  )}
                  {onGenerateCurrent && (
                    <button
                      onClick={onGenerateCurrent}
                      disabled={isGenerating}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isGenerating ? 'Đang AI thiết kế...' : `Tạo Mới Với AI (${appendixLabels[selectedAppendix].short})`}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
