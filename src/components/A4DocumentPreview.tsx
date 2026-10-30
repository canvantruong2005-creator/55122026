import React, { useState, useRef, useMemo, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import {
  Printer,
  Download,
  Sparkles,
  RefreshCw,
  Edit3,
  Eye,
  Check,
  RotateCcw,
  FileText,
  Copy,
  Mic,
  ShieldCheck,
  HelpCircle,
  FileCheck,
  Clock
} from 'lucide-react';
import { generateGeminiText } from '../lib/geminiApi';
import { exportMarkdownToWord, WordExportOptions } from '../lib/wordExport';
import { sanitizeMathForVietnamese, repairVietnameseText } from '../lib/mathSanitizer';
import { normalizeVietnameseTerminology, ungluePedagogicalHeadings, rebalanceLessonPlanActivityDurations, parsePeriodDurationMinutes, calculateActivityTimeAllocation, isActivityStepContent, isProductContent, splitStepsAndProduct } from '../lib/terminologyUtils';
import { validateLicenseKey, STORAGE_KEY_SAVED_LICENSE } from '../lib/licenseUtils';
import { VoiceMicButton } from './VoiceMicButton';

interface A4DocumentPreviewProps {
  content: string;
  onChangeContent: (newContent: string) => void;
  title?: string;
  documentType?: 'lesson_plan' | 'exam' | 'material' | 'plan_5512';
  monHoc?: string;
  lop?: string;
  ngaySoan?: string;
  thoiluong?: string;
  hideActivityTime?: boolean;
  onToggleHideActivityTime?: (val: boolean) => void;
  schoolName?: string;
  teacherName?: string;
  apiKeysInput?: string;
  watermarkText?: string;
  exportOptions?: Partial<WordExportOptions>;
  onExportWord?: () => void;
  onDownloadAudio?: () => void;
  className?: string;
}

/**
 * Normalizes Markdown content specifically for the A4 Preview renderer:
 * 1. Strips all stray "---", "***", "===" dividers inside cells and between lines.
 * 2. Normalizes markdown tables with proper columns and auto-generates separator headers if missing.
 * 3. Replaces TikZ code blocks with a clean visual placeholder box.
 * 4. Ensures all HTML elements (<br>, <b>, <u>) render cleanly.
 */
function prepareMarkdownForPreview(rawMarkdown: string, thoiluong?: string, hideActivityTime?: boolean): string {
  if (!rawMarkdown) return '';

  let text = sanitizeMathForVietnamese(rawMarkdown);
  text = normalizeVietnameseTerminology(text);
  const targetMinutes = thoiluong ? parsePeriodDurationMinutes(thoiluong) : parsePeriodDurationMinutes(text);
  text = rebalanceLessonPlanActivityDurations(text, targetMinutes, Boolean(hideActivityTime));
  text = ungluePedagogicalHeadings(text);
  text = repairVietnameseText(text);

  // Extract any TIẾT X headers embedded inside table rows so they become centered standalone headings
  text = text.replace(/(?:^|\n)[ \t]*\|[ \t]*(?:\*\*)?(?:TIẾT|Tiết)\s+(\d+)[ \t]*[-–:][ \t]*([^\n|]+?)(?:\*\*)?[ \t]*\|(?:[ \t]*\|)?/gi, (_m, num, title) => {
    return `\n\n**TIẾT ${num}: ${title.toUpperCase().trim()}**\n\n| **HOẠT ĐỘNG CỦA GV VÀ HS** | **DỰ KIẾN SẢN PHẨM** |\n| :--- | :--- |\n`;
  });

  // Standardize 5512 column headers to canonical uppercase bold format
  text = text.replace(
    /\|[ \t]*(?:\*\*)?Hoạt\s*động\s*của\s*GV\s*và\s*HS(?:\*\*)?[ \t]*\|[ \t]*(?:\*\*)?(?:Dự\s*kiến\s*sản\s*phẩm|Sản\s*phẩm\s*dự\s*kiến|Sản\s*phẩm|Dự\s*kiến\s*kết\s*quả)(?:\*\*)?[ \t]*\|/gi,
    '| **HOẠT ĐỘNG CỦA GV VÀ HS** | **DỰ KIẾN SẢN PHẨM** |'
  );

  // 1. Remove standalone divider lines and hash-only lines (e.g. "###", "##")
  text = text.replace(/^[ \t]*[-*_=]{2,}[ \t]*$/gm, '');
  text = text.replace(/^[ \t]*#{1,6}[ \t]*$/gm, '');
  text = text.replace(/^[ \t]*[><\s]+$/gm, '');

  // 2. Remove stray dashes wrapped in <br> tags and collapse broken br stacks
  text = text.replace(/(?:<br\s*\/?>|<\/br>|<br>|<br|\s*)+[-*_=]{2,}(?:\s*<br\s*\/?>|<\/br>|<br>|<br)+/gi, '<br/><br/>');
  text = text.replace(/(?:<br\s*\/?>|<\/br>|<br>|<br)+\s*[-*_=]{2,}/gi, '<br/>');
  text = text.replace(/[-*_=]{2,}\s*(?:<br\s*\/?>|<\/br>|<br>|<br)+/gi, '<br/>');
  text = text.replace(/(?:<br\s*\/?>|<\/br>|<br>|<br>){3,}/gi, '<br/><br/>');

  // 3. Fix orphaned double asterisks or unclosed markdown tags and formatting artifacts
  text = text.replace(/\*\*\s*\*\*/g, '');
  text = text.replace(/^\s*\*\*\s*$/gm, '');

  // Clean residual backslashes, underscores/subscripts, and trailing asterisks
  text = text
    .replace(/\\([,;:! ])/g, ' ')
    .replace(/\\+(?=[ \t.,;:!?)\\}\\]]|$)/g, '')
    .replace(/["“”'‘’]{1,2}(kg|g|mg|tấn|tạ|yến|m|cm|mm|dm|km|lít|ml|đồng|nghìn\s*đồng|triệu\s*đồng|tỉ\s*đồng|km\/h|m\/s|phút|giây|giờ|ngày|năm|người|học\s*sinh|cây|quyển|viên|chiếc|quả)["“”'‘’]{1,2}/gi, '$1')
    .replace(/(?<=[0-9a-zA-Z\(\)\s*+×\-\/])["“”'‘’]{1,2}([a-zA-ZÀ-ỹ\s]+)["“”'‘’]{1,2}/g, '$1')
    .replace(/''/g, '"')
    .replace(/[`´’‘]{2,}/g, '"')
    .replace(/\\(?:text|mathrm)\s*\{\s*([a-zA-ZÀ-ỹ\s0-9()]+)(?=[)\],;=+\-*\/<>.]|\$|$|<br|\n)/gi, ' $1 ')
    .replace(/\\(?:text|mathrm)\s*\{/gi, ' ')
    .replace(/\*\*([^*]+:)\*\*\s*:+/g, '**$1** ')
    .replace(/\*\*([^*:]+)\*\*\s*:\s*:+/g, '**$1:** ')
    .replace(/(?::\s*){2,}/g, ': ')
    .replace(/:\s*:+/g, ':')
    .replace(/([a-zA-ZÀ-ỹ0-9]):\s*:\s*/g, '$1: ')
    .replace(/([a-zA-Z0-9$]+)[,;:]\s*_{([^{}]+)}/g, '$1, $2')
    .replace(/(^|[\s,;:(])_{([a-zA-Zà-ỹÀ-Ỹ\s]+)}/g, '$1$2')
    .replace(/_{([a-zA-Zà-ỹÀ-Ỹ\s]+)}/g, '$1')
    .replace(/([.,;:!?])_+/g, '$1')
    .replace(/_+([.,;:!?])/g, '$1')
    .replace(/(^|\s)_+([a-zA-Zà-ỹÀ-Ỹ0-9]+)_+(\s|$)/g, '$1$2$3')
    .replace(/(^|\s)_+([a-zA-Zà-ỹÀ-Ỹ]+)/g, '$1$2')
    .replace(/([a-zA-Zà-ỹÀ-Ỹ]+)_+(\s|$)/g, '$1$2')
    .replace(/([.,;:!?])\s*(?<!\*)\*(?!\*)/g, '$1 ')
    .replace(/(?<![ℕℤℚℝN*])\*(?!\*)([.,;:!?])/g, '$1')
    .replace(/(?<![ℕℤℚℝN*])\*(?!\*)[ \t]*$/gm, '')
    .replace(/(?<=[a-zA-Zà-ỹÀ-Ỹ]{2,})\*(?!\*)(?=\s)/g, '')
    .replace(/^[ \t]*\*(?!\*)[ \t]*([A-Za-zÀ-ỹ])/gm, '$1')
    // Auto-repair unclosed bold at label colon (e.g. "**Bước 1: Giao nhiệm vụ học tập:")
    .replace(/(^|\n|\||<br\s*\/?>)[ \t]*\*\*(Bước\s*\d[:\.]\s*[^:\n*]+):(?!\*)[ \t]*/gi, '$1**$2:** ')
    // Auto-repair unclosed bold at end of activity title (e.g. "**4. HOẠT ĐỘNG VẬN DỤNG (2 phút)")
    .replace(/(^|\n|\||<br\s*\/?>)[ \t]*\*\*([1-5]\.\s*HOẠT\s*ĐỘNG[^\n*]+?)(?!\*)[ \t]*(?=\n|\||<br|$)/gi, '$1**$2**');

  // 4. Ensure TikZ code blocks are converted to visual placeholders without breaking markdown flow
  text = text.replace(/```tikz[\s\S]*?```/gi, '\n\n<div class="tikz-preview-placeholder">🖼️ <strong>[ HÌNH VẼ MINH HỌA (TIKZ) - GIÁO VIÊN CHÈN HÌNH TẠI ĐÂY ]</strong></div>\n\n');
  text = text.replace(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/gi, '\n\n<div class="tikz-preview-placeholder">🖼️ <strong>[ HÌNH VẼ MINH HỌA (TIKZ) - GIÁO VIÊN CHÈN HÌNH TẠI ĐÂY ]</strong></div>\n\n');

  // Ensure clear blank line before signature table rows so table parsing never fails
  text = text.replace(/([^\n])\n(\|[\s*]*(?:Duyệt của BGH|DUYỆT CỦA BGH|Tổ trưởng chuyên môn|Xác nhận BGH|Người lập kế hoạch|Ban Giám Hiệu|Giáo viên soạn))/gi, '$1\n\n$2');

  // 5. Normalize tables so GFM table parser always recognizes them
  const rawLines = text.split('\n');
  const normalizedLines: string[] = [];
  let inTable = false;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();

    if (!line) {
      if (inTable) {
        // Peek ahead to see if the table continues
        let continuesTable = false;
        for (let j = i + 1; j < rawLines.length; j++) {
          const next = rawLines[j].trim();
          if (!next) continue;
          if (next.includes('|') && !next.startsWith('#')) continuesTable = true;
          break;
        }
        if (!continuesTable) {
          inTable = false;
        }
      }
      normalizedLines.push('');
      continue;
    }

    if (line.includes('|') && !line.startsWith('#')) {
      // Check if it's a separator line like |:---|:---| or |---|---|
      const isDivider = /^[:\s|-]+$/.test(line.replace(/^\||\|$/g, ''));
      if (isDivider) {
        inTable = true;
        normalizedLines.push(line);
        continue;
      }

      let safeLine = line.replace(/\\\|/g, '___ESCAPED_PIPE___');
      safeLine = safeLine.replace(/(\$\$[\s\S]*?\$\$|\$[^\n$]+?\$)/g, (mathMatch) => mathMatch.replace(/\|/g, '___MATH_PIPE___'));
      safeLine = safeLine.replace(/(\\\{[\s\S]*?\\\}|\{[^{}\n]*\|[^{}\n]*\})/g, (setMatch) => setMatch.replace(/\|/g, '___SET_PIPE___'));

      let rawCols = safeLine.split('|').map(c => c.trim());
      if (safeLine.startsWith('|')) rawCols.shift();
      if (safeLine.endsWith('|')) rawCols.pop();

      rawCols = rawCols.map(c =>
        c.replace(/___ESCAPED_PIPE___/g, '\\vert ')
         .replace(/___MATH_PIPE___/g, '\\vert ')
         .replace(/___SET_PIPE___/g, '\\vert ')
      );

      // Clean out any dash-only columns
      let cleanCols = rawCols.map(c => {
        if (/^[-*_=]{2,}$/.test(c)) return '';
        return c.replace(/(?:<br\s*\/?>\s*)+[-*_=]{2,}(?:\s*<br\s*\/?>)+/gi, '<br/>');
      });

      // Clean trailing empty columns
      while (cleanCols.length > 2 && !cleanCols[cleanCols.length - 1]?.trim()) {
        cleanCols.pop();
      }

      // Special 5512 rule: ONLY normalize to 2 columns if table is strictly a 5512 lesson plan activity table
      const has5512Activity = cleanCols.some(c => /(?:hoạt động của gv|hoạt động dạy học|dự kiến sản phẩm|sản phẩm dự kiến|bước\s*[1-4]|b[1-4][:.]|chuyển giao nhiệm vụ|thực hiện nhiệm vụ|báo cáo thảo luận|kết luận nhận định)/i.test(c));
      const isMatrixOrSpec = !has5512Activity && cleanCols.some(c => /(?:nhận biết|thông hiểu|vận dụng cao|tnkq|tự luận|đặc tả|ma trận|tổng số câu|điểm số|tỉ lệ %|rubric|tiêu chí)/i.test(c));
      const isActivityTable = has5512Activity;

      if (isActivityTable) {
        if (cleanCols.length === 1) {
          const c0 = cleanCols[0] || '';
          if (isProductContent(c0)) {
            // Standalone product
            cleanCols = ['', c0];
          } else {
            const split = splitStepsAndProduct(c0);
            if (split.col2) {
              cleanCols = [split.col1, split.col2];
            }
          }
        } else if (cleanCols.length === 2) {
          const [c0, c1] = cleanCols;
          if (isProductContent(c0) && isActivityStepContent(c1)) {
            // Swap if product mistakenly landed in Col 1 and steps in Col 2
            cleanCols = [c1, c0];
          } else if (!c1?.trim() && isProductContent(c0)) {
            cleanCols = ['', c0];
          } else if (!c1?.trim()) {
            const split = splitStepsAndProduct(c0);
            if (split.col2) {
              cleanCols = [split.col1, split.col2];
            }
          }
        } else if (cleanCols.length >= 3) {
          if (!cleanCols[2]?.trim()) {
            if (isProductContent(cleanCols[1]) || !isActivityStepContent(cleanCols[1])) {
              cleanCols = [cleanCols[0], cleanCols[1]];
            } else {
              cleanCols = [`${cleanCols[0]}<br/>${cleanCols[1]}`, ''];
            }
          } else if (!cleanCols[1]?.trim()) {
            cleanCols = [cleanCols[0], cleanCols[2]];
          } else if (/^(?:\*\*)?Bước\s*\d|^(?:\*\*)?B\d[:\.]|^(?:\*\*)?Hoạt\s*động\s*\d|^(?:\*\*)?[1-5]\.\s*HOẠT\s*ĐỘNG/i.test(cleanCols[0])) {
            cleanCols = [`${cleanCols[0]}<br/>${cleanCols[1]}`, cleanCols[2]];
          } else {
            cleanCols = [cleanCols.slice(0, -1).filter(Boolean).join('<br/>'), cleanCols[cleanCols.length - 1]];
          }
        }
      }

      const formattedLine = '| ' + cleanCols.join(' | ') + ' |';

      if (!inTable) {
        // First row of a table -> Header row!
        inTable = true;
        normalizedLines.push(formattedLine);

        // Check if next line is already a separator
        const nextLine = (rawLines[i + 1] || '').trim();
        const nextIsDivider = nextLine.includes('|') && /^[:\s|-]+$/.test(nextLine.replace(/^\||\|$/g, ''));
        if (!nextIsDivider) {
          // Auto-insert standard GFM table separator row!
          const autoDivider = '| ' + cleanCols.map(() => ':---').join(' | ') + ' |';
          normalizedLines.push(autoDivider);
        }
        continue;
      } else {
        normalizedLines.push(formattedLine);
        continue;
      }
    } else {
      // Check if this line is an unpiped continuation of the previous table cell
      const trimmed = line.trim();
      if (inTable && trimmed && normalizedLines.length > 0 && !/^(?:#{1,6}\s+|---|\*\*(?:TIẾT|I\.|II\.|III\.|IV\.|V\.|DUYỆT|XÁC NHẬN))/i.test(trimmed)) {
        const lastIdx = normalizedLines.length - 1;
        if (normalizedLines[lastIdx].startsWith('|') && normalizedLines[lastIdx].endsWith('|')) {
          normalizedLines[lastIdx] = normalizedLines[lastIdx].replace(/\|[ \t]*$/, '<br/>' + trimmed + ' |');
          continue;
        }
      }
      inTable = false;
      normalizedLines.push(rawLines[i]);
    }
  }

  return normalizedLines.join('\n');
}

function extractNodeText(node: any): string {
  if (!node) return '';
  if (typeof node.value === 'string') return node.value;
  if (Array.isArray(node.children)) {
    return node.children.map(extractNodeText).join(' ');
  }
  return '';
}

export const A4DocumentPreview: React.FC<A4DocumentPreviewProps> = ({
  content,
  onChangeContent,
  title = 'Xem trước Tài liệu A4 Chuẩn In',
  documentType = 'lesson_plan',
  monHoc = 'Toán học',
  lop = '7',
  ngaySoan = '',
  thoiluong = '45 phút (THCS / THPT)',
  hideActivityTime = false,
  onToggleHideActivityTime,
  schoolName = 'Trường THCS Phùng Khắc Khoan',
  teacherName = 'Giáo viên',
  apiKeysInput = '',
  watermarkText = '',
  exportOptions,
  onExportWord,
  onDownloadAudio,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<'a4_preview' | 'wysiwyg_edit' | 'raw_markdown'>('a4_preview');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiHistory, setAiHistory] = useState<string[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [fontSize, setFontSize] = useState<'13' | '14'>('14');
  const [lineSpacing, setLineSpacing] = useState<'1.15' | '1.3' | '1.5'>('1.3');
  const [isLandscape, setIsLandscape] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showWatermarkOverride, setShowWatermarkOverride] = useState<boolean | null>(null);
  const [localHideActivityTime, setLocalHideActivityTime] = useState<boolean>(Boolean(hideActivityTime));

  useEffect(() => {
    setLocalHideActivityTime(Boolean(hideActivityTime));
  }, [hideActivityTime]);

  const effectiveHideActivityTime = localHideActivityTime;

  const handleToggleHideActivity = () => {
    const nextVal = !localHideActivityTime;
    setLocalHideActivityTime(nextVal);
    onToggleHideActivityTime?.(nextVal);
  };

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Realtime license updates listener
  const [licenseUpdateKey, setLicenseUpdateKey] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setLicenseUpdateKey(k => k + 1);
    window.addEventListener('licenses_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('licenses_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // VIP License Status & Admin permissions
  const { isAdmin, isKeyAllowedWatermarkRemoval, isTrial } = useMemo(() => {
    if (typeof window === 'undefined') return { isAdmin: false, isKeyAllowedWatermarkRemoval: false, isTrial: false };
    try {
      const savedKey = localStorage.getItem(STORAGE_KEY_SAVED_LICENSE) || '';
      if (!savedKey) return { isAdmin: false, isKeyAllowedWatermarkRemoval: false, isTrial: false };
      const res = validateLicenseKey(savedKey);
      return {
        isAdmin: !!res.isAdmin,
        isKeyAllowedWatermarkRemoval: res.valid && (!!res.isAdmin || res.allowRemoveWatermark === true),
        isTrial: !!res.isTrial
      };
    } catch {
      return { isAdmin: false, isKeyAllowedWatermarkRemoval: false, isTrial: false };
    }
  }, [licenseUpdateKey]);

  // Quick prompt suggestions
  const QUICK_PROMPTS = [
    '⚡ Viết tiếp Tiết 2 & Tiết 3 (hoặc các tiết còn lại) nối tiếp bài học',
    '➕ Bổ sung thêm 2 bài tập SGK và lời giải chi tiết 100%',
    '🤖 Tích hợp hoạt động AI (6.2TC1a, 6.2TC1b) và Năng lực số (TT 02/2025)',
    '🇻🇳 Thêm bài tập vận dụng tình huống thực tế địa phương Việt Nam',
    '🎯 Bổ sung 2 câu hỏi/ví dụ mức độ Vận dụng cao kèm lời giải',
    '👥 Tích hợp Kỹ thuật Khăn trải bàn / Mảnh ghép vào Hoạt động hình thành kiến thức',
    '📝 Soạn thêm Phiếu học tập số 1 và Rubric tiêu chí đánh giá',
    '🌸 Sáng tác thơ tóm tắt bài học vần điệu 6-8 câu',
    '📐 Kiểm tra và chuẩn hóa 100% công thức Toán LaTeX ($...$) và lời giải chi tiết'
  ];

  const handleApplyAiRefinement = async (promptToUse?: string) => {
    const textPrompt = (promptToUse || aiPrompt).trim();
    if (!textPrompt) {
      alert('Vui lòng nhập yêu cầu chỉnh sửa cho AI!');
      return;
    }
    if (!content.trim()) {
      alert('Tài liệu hiện đang trống! Hãy tạo tài liệu trước khi yêu cầu chỉnh sửa.');
      return;
    }

    const apiKeys = apiKeysInput ? apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean) : [];
    setIsAiProcessing(true);

    try {
      // Save current version to history for undo
      setAiHistory(prev => [content, ...prev].slice(0, 5));

      const targetM = parsePeriodDurationMinutes(thoiluong);
      const alloc = calculateActivityTimeAllocation(targetM);

      const systemInstruction = `Bạn là Trợ lý AI Giáo dục Sư phạm chuyên nghiệp của ${schoolName}.
Nhiệm vụ của bạn là nhận tài liệu hiện có và áp dụng chính xác các chỉnh sửa/bổ sung/viết tiếp theo lệnh của Giáo viên, ĐỒNG THỜI TUÂN THỦ 100% BỘ 14 ĐIỀU KHOẢN "QUY TẮC BÀN TAY SẮT":
1. CẤM LỜI DẪN NHẬP AI & CĂN GIỮA TIÊU ĐỀ: Bắt đầu trực tiếp, không chào hỏi. Dòng Tiết và Tên bài in hoa, in đậm, căn giữa. Không bôi nền màu vàng.
2. PHÂN CẤP MỤC TIÊU 4 TẦNG: - Năng lực chung, - Năng lực đặc thù, - Năng lực số (TT 02/2025: 1.1TC1b, 2.1TC1a...), - Năng lực AI (QĐ 2422: 6.1TC1a, 6.2TC1a, 6.2TC1b, 6.2TC1c). Thiết bị dạy học: dùng Tivi kết nối internet, máy tính (CẤM dùng từ "máy chiếu").
3. DUNG LƯỢNG TỐI THIỂU 5 TRANG A4/TIẾT & PHÂN BỔ THỜI GIAN CHUẨN: Phân chia thời gian các hoạt động phù hợp với thời lượng nội dung, sao cho tổng thời gian các hoạt động (Khởi động + Hình thành kiến thức + Luyện tập + Vận dụng) ĐÚNG BẰNG THỜI GIAN TIẾT HỌC LÀ ${targetM} PHÚT/TIẾT (${alloc.summaryText}).
4. IN ĐẬM 100% 4 HOẠT ĐỘNG CHÍNH VÀ 4 BƯỚC SƯ PHẠM: **1. HOẠT ĐỘNG KHỞI ĐỘNG**, **2. HOẠT ĐỘNG HÌNH THÀNH KIẾN THỨC MỚI**, **3. HOẠT ĐỘNG LUYỆN TẬP**, **4. HOẠT ĐỘNG VẬN DỤNG** và **Bước 1: Giao nhiệm vụ học tập:**, **Bước 2: Thực hiện nhiệm vụ:**, **Bước 3: Báo cáo, thảo luận:**, **Bước 4: Kết luận, nhận định:**. In đậm các số thứ tự đề mục 1., 2., 3., 4...
5. ĐỒNG BỘ 1-1 BẢNG 2 CỘT & ĐÁNH SỐ ĐỀ MỤC: Cột trái "| Hoạt động của GV và HS |" và Cột phải "| Dự kiến sản phẩm |". Mọi tiểu mục ở Cột Trái đều phải có đề mục tương ứng ở Cột Phải (kể cả Tiết 1, Tiết 2, Tiết 3...). Cấm tuyệt đối để trống. Dùng thẻ <br> để xuống dòng trong ô bảng.
6. TÍCH HỢP ĐÚNG BẢN CHẤT PPDH/KTDH: Khăn trải bàn (chia góc cá nhân và ô giữa nhóm), Mảnh ghép (Vòng chuyên gia & Vòng mảnh ghép), Phòng tranh, Trò chơi/Quiz...
7. KHAI THÁC 100% SGK VÀ LỜI GIẢI CHI TIẾT 100%: Có đủ đề bài và LỜI GIẢI CHI TIẾT từng bước, công thức, đáp số, giải thích đúng/sai cặn kẽ.
8. KỊCH BẢN SINH ĐỘNG & TÍCH HỢP MÃ CHỈ BÁO NLS & AI (2.1TC1a, 6.2TC1a, 1.3TC1b, 5.2TC1b, 6.2TC1c...).
9. THƠ TỔNG KẾT & HƯỚNG DẪN BÀI TẬP VỀ NHÀ: Thơ tổng kết và hướng dẫn giải chi tiết bài tập SGK/SBT sau mỗi tiết và cuối toàn bài.
10. BẢNG KÝ DUYỆT DUY NHẤT Ở CUỐI BÀI (ẩn viền, không lặp lại).
11. CHUẨN HÓA TOÁN LATEX: Công thức bọc trong $...$, chữ Tiếng Việt và số thứ tự thường KHÔNG bọc $. Ký hiệu tập hợp số: viết chuẩn $\\mathbb{N}^*$, $\\mathbb{N}$, $\\mathbb{Z}$, $\\mathbb{Q}$, $\\mathbb{R}$, tuyệt đối không bỏ sót chữ cái (CẤM viết "\\mathbb^*" hay "\\mathbb^").
12. TỰ ĐỘNG TẠO ĐỦ TẤT CẢ CÁC TIẾT: Soạn liên tục đầy đủ các tiết theo phân bổ.
13. PHÂN BỔ TẠO BÀI THEO TỪNG TIẾT RIÊNG BIỆT.
14. CƠ CHẾ VIẾT TIẾP TỤC ĐA TẦNG: Viết liền mạch chính xác từ điểm dừng, không cắt xén, trả về tài liệu hoàn thiện 100%.`;

      const prompt = `YÊU CẦU CHỈNH SỬA / BỔ SUNG TỪ GIÁO VIÊN:
${textPrompt}

NỘI DUNG TÀI LIỆU HIỆN TẠI (MÔN ${monHoc.toUpperCase()} - LỚP ${lop}):
${content.slice(0, 30000)}

Hãy thực hiện chỉnh sửa / bổ sung cẩn thận, chi tiết 100% và trả về TOÀN BỘ tài liệu hoàn thiện sau khi sửa:`;

      const res = await generateGeminiText({
        prompt,
        apiKeys,
        systemInstruction
      });

      if (res) {
        let cleanUpdated = sanitizeMathForVietnamese(res.trim());
        cleanUpdated = normalizeVietnameseTerminology(cleanUpdated);
        cleanUpdated = rebalanceLessonPlanActivityDurations(cleanUpdated, targetM);
        onChangeContent(cleanUpdated);
        setAiPrompt('');
        alert('✨ AI đã hoàn thành chỉnh sửa tài liệu thành công theo yêu cầu!');
      }
    } catch (err: any) {
      alert('Lỗi khi AI chỉnh sửa: ' + (err?.message || err));
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleUndo = () => {
    if (aiHistory.length > 0) {
      const prev = aiHistory[0];
      setAiHistory(prevHistory => prevHistory.slice(1));
      onChangeContent(prev);
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportDocx = async () => {
    if (onExportWord) {
      onExportWord();
      return;
    }

    if (!content.trim()) {
      alert('Chưa có nội dung để xuất file Word!');
      return;
    }

    setIsExporting(true);
    try {
      await exportMarkdownToWord(content, {
        headerText: `${title.toUpperCase()} - MÔN ${monHoc.toUpperCase()} LỚP ${lop}`,
        footerText: `${schoolName} - Giáo viên: ${teacherName}`,
        monHoc,
        lop,
        ngaySoan,
        thoiluong,
        hideActivityTime: effectiveHideActivityTime,
        teacherName,
        schoolName,
        isLandscape,
        fileName: `${monHoc}_Lop_${lop}_${title.replace(/\s+/g, '_')}.docx`,
        ...exportOptions
      });
    } catch (err: any) {
      alert('Lỗi xuất Word: ' + (err.message || 'Không thể tạo file'));
    } finally {
      setIsExporting(false);
    }
  };

  // Sanitized and prepared markdown content for preview
  const previewMarkdown = useMemo(() => {
    return prepareMarkdownForPreview(content, thoiluong, effectiveHideActivityTime);
  }, [content, thoiluong, effectiveHideActivityTime]);

  // Markdown rendering components definition
  const customMarkdownComponents = useMemo(() => ({
    table: ({ node, children, ...props }: any) => {
      const nodeText = extractNodeText(node).toLowerCase();
      const isSignature =
        /duyệt của bgh|xác nhận bgh|tổ trưởng chuyên môn|người lập kế hoạch|ký, ghi rõ|ký và ghi rõ|ban giám hiệu|bùi sỹ nghĩa|giáo viên soạn/i.test(nodeText) &&
        !/hoạt động|mục tiêu|sản phẩm|kiến thức|khởi động|luyện tập|vận dụng|yêu cầu cần đạt|stt/i.test(nodeText);

      return (
        <div className={`w-full ${isSignature ? 'my-6' : 'my-4 overflow-x-auto'} not-prose`}>
          <table
            className={`w-full text-[13pt] font-serif-doc ${
              isSignature
                ? 'border-none border-0 bg-transparent text-center shadow-none'
                : 'border-collapse border-2 border-black bg-white shadow-none'
            }`}
            data-signature={isSignature ? 'true' : 'false'}
            {...props}
          >
            {children}
          </table>
        </div>
      );
    },
    thead: ({ node, children, ...props }: any) => {
      return (
        <thead className="border-b-2 border-black font-bold [&[data-sig=true]]:border-none" {...props}>
          {children}
        </thead>
      );
    },
    tbody: ({ node, children, ...props }: any) => {
      return (
        <tbody className="divide-y divide-black" {...props}>
          {children}
        </tbody>
      );
    },
    tr: ({ node, children, ...props }: any) => {
      const rowText = extractNodeText(node).toLowerCase();
      const isSigRow =
        /duyệt của bgh|xác nhận bgh|tổ trưởng chuyên môn|người lập kế hoạch|ký, ghi rõ|ký và ghi rõ|ban giám hiệu|bùi sỹ nghĩa|giáo viên soạn/i.test(rowText) &&
        !/hoạt động|mục tiêu|sản phẩm|kiến thức|khởi động|luyện tập|vận dụng|yêu cầu cần đạt|stt/i.test(rowText);

      return (
        <tr
          className={isSigRow ? 'border-none border-0' : 'border-b border-black'}
          data-sig-row={isSigRow ? 'true' : 'false'}
          {...props}
        >
          {children}
        </tr>
      );
    },
    th: ({ node, children, ...props }: any) => {
      const thText = extractNodeText(node).toLowerCase();
      const isSigTh = /duyệt của bgh|xác nhận bgh|tổ trưởng chuyên môn|người lập kế hoạch|ban giám hiệu|giáo viên soạn/i.test(thText);

      if (isSigTh) {
        return (
          <th
            className="border-none border-0 p-2 font-bold text-center align-top bg-transparent text-slate-950 text-[13pt]"
            {...props}
          >
            {children}
          </th>
        );
      }

      return (
        <th
          className="border border-black p-3 font-bold text-center align-middle bg-slate-100 text-slate-900 text-[13pt] uppercase tracking-wide"
          {...props}
        >
          {children}
        </th>
      );
    },
    td: ({ node, children, ...props }: any) => {
      const tdText = extractNodeText(node).toLowerCase();
      const isSigTd =
        /duyệt của bgh|xác nhận bgh|tổ trưởng chuyên môn|người lập kế hoạch|ký, ghi rõ|ký và ghi rõ|ban giám hiệu|bùi sỹ nghĩa|giáo viên soạn/i.test(tdText) ||
        (tdText.includes('ký') && tdText.includes('họ tên'));

      if (isSigTd) {
        return (
          <td
            className="border-none border-0 p-2 align-top text-center text-slate-950 text-[13pt] leading-relaxed break-words"
            {...props}
          >
            {children}
          </td>
        );
      }

      return (
        <td
          className="border border-black p-3 align-top text-slate-900 text-[13pt] leading-relaxed break-words"
          {...props}
        >
          {children}
        </td>
      );
    },
    div: ({ node, className, align, ...props }: any) => {
      const isCenter = align === 'center' || className?.includes('text-center');
      return (
        <div
          className={`${className || ''} ${isCenter ? 'text-center flex flex-col items-center justify-center my-3 w-full' : ''}`}
          {...props}
        />
      );
    },
    h1: ({ node, children, ...props }: any) => {
      const text = extractNodeText(node).toLowerCase();
      const isTiet = /tiết\s+\d+/i.test(text);
      return (
        <h1
          className={`text-[16pt] font-bold text-center uppercase my-3 text-slate-950 tracking-normal font-serif-doc w-full ${isTiet ? 'text-blue-950' : ''}`}
          {...props}
        >
          {children}
        </h1>
      );
    },
    h2: ({ node, children, ...props }: any) => {
      const text = extractNodeText(node).toLowerCase();
      const isCentered = /tiết\s+\d+|bài\s+\d+|chủ đề|kế hoạch bài dạy/i.test(text);
      return (
        <h2
          className={`text-[14pt] font-bold my-3 text-slate-950 uppercase font-serif-doc ${isCentered ? 'text-center' : ''}`}
          {...props}
        >
          {children}
        </h2>
      );
    },
    h3: ({ node, children, ...props }: any) => {
      const text = extractNodeText(node).toLowerCase();
      const isCentered = /tiết\s+\d+|bài\s+\d+/i.test(text);
      return (
        <h3
          className={`text-[13pt] font-bold my-2 text-slate-950 font-serif-doc ${isCentered ? 'text-center uppercase' : ''}`}
          {...props}
        >
          {children}
        </h3>
      );
    },
    p: ({ node, ...props }: any) => {
      const textContent = String(node?.children?.[0]?.value || (props.children && typeof props.children === 'string' ? props.children : ''));
      const isPeriodLine = /^\s*(\*\*)?(?:TIẾT|Tiết)\s+[\d,\s\-–]+(?:[:\s\-–][^\n*]+)?(\*\*)?\s*$/i.test(textContent.trim());
      const isLessonTitle = /^\s*(\*\*)?BÀI\s*[:\d]/i.test(textContent.trim());
      const isDuration = /^\(?thời lượng/i.test(textContent.trim());
      const isCenteredHeading = isPeriodLine || isLessonTitle || isDuration;

      return (
        <div
          className={`my-1.5 leading-relaxed text-slate-900 text-[13pt] font-serif-doc ${
            isCenteredHeading ? 'text-center font-bold' : ''
          } ${isPeriodLine ? 'text-[14pt] uppercase tracking-wide my-3 text-slate-950' : ''} ${
            isLessonTitle ? 'text-[16pt] uppercase tracking-normal my-3 text-slate-950' : ''
          }`}
          {...props}
        />
      );
    },
    pre: ({ children }: any) => <>{children}</>,
    code: ({ children, className }: any) => {
      const isBlock = Boolean(className && className.includes('language-')) || String(children).includes('\n');
      return !isBlock ? (
        <code className="bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded font-mono text-[12pt] border border-slate-300">{children}</code>
      ) : (
        <pre className="p-3 my-2.5 rounded bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
          <code>{children}</code>
        </pre>
      );
    },
    ul: ({ node, ...props }: any) => (
      <ul className="list-disc pl-5 my-1.5 text-slate-900 text-[13pt] font-serif-doc space-y-1" {...props} />
    ),
    ol: ({ node, ...props }: any) => (
      <ol className="list-decimal pl-5 my-1.5 text-slate-900 text-[13pt] font-serif-doc space-y-1" {...props} />
    ),
    li: ({ node, ...props }: any) => (
      <li className="text-slate-900 text-[13pt] font-serif-doc" {...props} />
    ),
    blockquote: ({ node, ...props }: any) => (
      <blockquote className="p-3 my-2 border-l-4 border-amber-500 bg-amber-50 text-amber-900 rounded italic text-center font-medium not-prose font-serif-doc" {...props} />
    ),
    hr: () => null // Hide horizontal rules completely to remove any unwanted '---'
  }), []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. Header Toolbar with Mode Switcher & Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-sky-500/20 border border-indigo-500/30 text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <span>{title}</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-mono">
                  Xem Trước Chuẩn Khung Bảng & Công Thức
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Hiển thị chính xác khung bảng giáo án 2 cột/nhiều cột, công thức Toán học chuẩn LaTeX, hỗ trợ sửa trực tiếp hoặc ra lệnh AI sửa nhanh.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {aiHistory.length > 0 && (
              <button
                onClick={handleUndo}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold flex items-center gap-1 shadow transition-all"
                title="Khôi phục lại phiên bản trước khi AI chỉnh sửa"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Hoàn tác ({aiHistory.length})
              </button>
            )}

            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow transition-all"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {isCopied ? 'Đã sao chép!' : 'Sao chép văn bản'}
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-900/30 transition-all"
              title="Mở hộp thoại In nhanh từ trình duyệt (Chuẩn trang in A4)"
            >
              <Printer className="w-4 h-4" /> In Ngay (Print)
            </button>

            {onDownloadAudio && (
              <button
                onClick={onDownloadAudio}
                disabled={!content.trim()}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-pink-900/30 transition-all disabled:opacity-50"
                title="Tải tệp âm thanh bài giảng MP3 về máy tính hoặc điện thoại"
              >
                <Download className="w-4 h-4" /> Tải Audio MP3
              </button>
            )}

            <button
              onClick={handleExportDocx}
              disabled={isExporting || !content.trim()}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Đang xuất Word...' : 'Xuất File Word (.docx)'}
            </button>
          </div>
        </div>

        {/* Controls: View Modes & Page Settings */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 font-semibold">
            <button
              onClick={() => setViewMode('a4_preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'a4_preview'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> 📄 Xem Trang In A4 Thực Tế
            </button>
            <button
              onClick={() => setViewMode('wysiwyg_edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'wysiwyg_edit'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> ✏️ Sửa Trực Tiếp Trên Trang
            </button>
            <button
              onClick={() => setViewMode('raw_markdown')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'raw_markdown'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> ⚙️ Sửa Code Markdown
            </button>
          </div>

          {/* Formatting Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
              <span className="text-slate-400">Cỡ chữ:</span>
              <button
                onClick={() => setFontSize('13')}
                className={`px-2 py-0.5 rounded font-bold ${fontSize === '13' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                13pt
              </button>
              <button
                onClick={() => setFontSize('14')}
                className={`px-2 py-0.5 rounded font-bold ${fontSize === '14' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                14pt (Chuẩn)
              </button>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
              <span className="text-slate-400">Giãn dòng:</span>
              <button
                onClick={() => setLineSpacing('1.15')}
                className={`px-2 py-0.5 rounded ${lineSpacing === '1.15' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
              >
                1.15
              </button>
              <button
                onClick={() => setLineSpacing('1.3')}
                className={`px-2 py-0.5 rounded ${lineSpacing === '1.3' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
              >
                1.3
              </button>
              <button
                onClick={() => setLineSpacing('1.5')}
                className={`px-2 py-0.5 rounded ${lineSpacing === '1.5' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
              >
                1.5
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setIsLandscape(false)}
                className={`px-2 py-0.5 rounded ${!isLandscape ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
              >
                A4 Dọc
              </button>
              <button
                onClick={() => setIsLandscape(true)}
                className={`px-2 py-0.5 rounded ${isLandscape ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
              >
                A4 Ngang
              </button>
            </div>

            {/* Toggle Activity Durations */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Thời gian HĐ:</span>
              <button
                onClick={handleToggleHideActivity}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  effectiveHideActivityTime
                    ? 'bg-amber-600 text-white shadow'
                    : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                }`}
                title="Bấm để chuyển đổi giữa Hiện thời lượng (ví dụ: (5 phút)) hoặc Ẩn bỏ thời gian sau tên các hoạt động"
              >
                {effectiveHideActivityTime ? '🚫 Đã ẩn thời gian' : '⏱️ Đang hiện (phút)'}
              </button>
            </div>

            {/* Watermark & Copyright Preview Status / Admin Toggle */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Bản quyền:</span>
              {isAdmin ? (
                // Admin can freely toggle watermark to test
                <button
                  onClick={() => setShowWatermarkOverride(prev => prev === true ? false : true)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    (showWatermarkOverride ?? false)
                      ? 'bg-rose-600 text-white'
                      : 'bg-emerald-900/80 text-emerald-300 border border-emerald-700'
                  }`}
                  title="Quyền Admin: Bấm để Bật/Tắt kiểm tra dấu bản quyền mờ trên bản xem trước"
                >
                  {(showWatermarkOverride ?? false) ? 'Đang hiện Watermark (Admin)' : '💎 Đã ẩn Watermark (Admin)'}
                </button>
              ) : (
                // Regular teachers CANNOT toggle: strictly determined by Admin on their license key
                <div
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                    isKeyAllowedWatermarkRemoval
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
                      : 'bg-rose-950/80 text-rose-300 border-rose-800/80'
                  }`}
                  title={
                    isKeyAllowedWatermarkRemoval
                      ? 'Mã VIP đã được Admin cấp quyền ẩn Watermark'
                      : 'Mã chưa được Admin mở quyền ẩn Watermark. Vui lòng liên hệ Admin để nâng cấp mã.'
                  }
                >
                  {isKeyAllowedWatermarkRemoval
                    ? '💎 Đã ẩn Watermark (Mã VIP)'
                    : '🔒 Có Watermark (Theo mã)'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. AI Command / Refinement Toolbar */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-sky-950/40 border border-purple-800/40 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-purple-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>✨ RA LỆNH CHO AI CHỈNH SỬA / NÂNG CẤP TÀI LIỆU TRỰC TIẾP:</span>
            </span>
            <span className="text-[11px] text-slate-400">
              Nhập yêu cầu bằng tiếng Việt tự nhiên, AI sẽ tự động cập nhật ngay trên trang xem trước
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleApplyAiRefinement();
                }
              }}
              placeholder="Ví dụ: Bổ sung thêm 2 câu hỏi thực tế tính tiền điện, chỉnh lại phần lời giải bài 3 chi tiết hơn..."
              className="flex-1 bg-slate-950 border border-purple-700/60 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:border-purple-400 focus:outline-none placeholder:text-slate-500"
            />
            <VoiceMicButton
              onTranscript={(spoken) => setAiPrompt(prev => (prev ? prev + ' ' : '') + spoken)}
              buttonTitle="Nói lệnh bằng giọng nói (Tiếng Việt)"
            />
            <button
              onClick={() => handleApplyAiRefinement()}
              disabled={isAiProcessing}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-900/30 flex items-center gap-1.5 transition-all shrink-0"
            >
              {isAiProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-200" />
                  Đang sửa đổi...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Chỉnh Sửa Ngay
                </>
              )}
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400 font-semibold">Gợi ý nhanh:</span>
            {QUICK_PROMPTS.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setAiPrompt(qp);
                  handleApplyAiRefinement(qp);
                }}
                className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-950/80 hover:bg-purple-900/50 text-purple-300 border border-purple-800/40 transition-colors"
              >
                + {qp}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. A4 Paper Visual Container */}
      <div className="bg-slate-950/80 p-4 sm:p-8 rounded-2xl border border-slate-800 flex justify-center overflow-x-auto min-h-[600px]">
        {viewMode === 'raw_markdown' ? (
          <div className="w-full max-w-4xl space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Trình biên tập Markdown thô:</span>
              <span>{content.length} ký tự</span>
            </div>
            <textarea
              value={content}
              onChange={e => onChangeContent(e.target.value)}
              rows={26}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-cyan-200 font-mono text-xs leading-relaxed focus:border-cyan-500 focus:outline-none shadow-inner"
              placeholder="Nhập hoặc chỉnh sửa Markdown tại đây..."
            />
          </div>
        ) : (
          /* A4 Paper Canvas */
          <div
            ref={printAreaRef}
            id="a4-print-document"
            style={{
              fontFamily: '"Times New Roman", "Noto Serif", "Lora", "Tinos", Times, serif',
              fontSize: fontSize === '14' ? '14pt' : '13pt',
              lineHeight: lineSpacing
            }}
            className={`bg-white text-black shadow-2xl transition-all relative ${
              isLandscape
                ? 'w-[297mm] min-h-[210mm] p-[18mm] sm:p-[20mm]'
                : 'w-full max-w-[210mm] min-h-[297mm] p-[16mm] sm:p-[20mm]'
            } rounded-sm border border-slate-300 print:shadow-none print:border-none print:m-0 print:p-0 print:w-full font-serif-doc`}
          >
            {/* Watermark Pattern Overlay */}
            {(() => {
              const shouldShow = isAdmin
                ? (showWatermarkOverride ?? false)
                : !isKeyAllowedWatermarkRemoval;

              if (!shouldShow) return null;

              const currentWatermark = watermarkText?.trim() || exportOptions?.watermarkText?.trim() || 'BẢN QUYỀN: THẦY CẤN VĂN TRƯỜNG - 0988.302.636';

              return (
                <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-around items-center select-none opacity-25 overflow-hidden py-12">
                  <div className="transform -rotate-45 text-2xl sm:text-3xl font-black text-rose-800 tracking-widest whitespace-nowrap border-2 border-dashed border-rose-800/60 px-6 py-2 rounded-xl bg-white/40">
                    {currentWatermark}
                  </div>
                  <div className="transform -rotate-45 text-xl sm:text-2xl font-black text-rose-800 tracking-widest whitespace-nowrap border-2 border-dashed border-rose-800/60 px-6 py-2 rounded-xl bg-white/40">
                    {schoolName} - {teacherName}
                  </div>
                  <div className="transform -rotate-45 text-2xl sm:text-3xl font-black text-rose-800 tracking-widest whitespace-nowrap border-2 border-dashed border-rose-800/60 px-6 py-2 rounded-xl bg-white/40">
                    {currentWatermark}
                  </div>
                </div>
              );
            })()}

            {/* Copyright Banner atop Preview */}
            {(isAdmin ? (showWatermarkOverride ?? false) : !isKeyAllowedWatermarkRemoval) && (
              <div className="mb-6 p-3.5 bg-rose-50/90 border-2 border-dashed border-rose-500 rounded-lg text-center font-serif-doc select-none relative z-20 shadow-sm">
                <p className="text-xs font-bold text-rose-800 uppercase tracking-wide">
                  ⚠️ BẢN QUYỀN TÁC GIẢ: THẦY CẤN VĂN TRƯỜNG (SĐT/ZALO: 0988.302.636)
                </p>
                <p className="text-[11px] text-slate-700 italic mt-0.5">
                  Đơn vị: Trường THCS Phùng Khắc Khoan, xã Tây Phương, TP. Hà Nội — Hệ Thống Soạn Giáo Án Chuẩn Công Văn 5512
                </p>
                <p className="text-[10.5px] text-rose-800 font-semibold mt-1">
                  🔒 Quyền ẩn Watermark được cấu hình trực tiếp trên Mã kích hoạt bởi Admin (Thầy Cấn Văn Trường).
                </p>
              </div>
            )}

            {/* Document Content Area */}
            {viewMode === 'wysiwyg_edit' ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={e => {
                  const text = e.currentTarget.innerText;
                  if (text && text.trim() !== content.trim()) {
                    onChangeContent(text);
                  }
                }}
                className="outline-none min-h-[500px] focus:ring-1 focus:ring-blue-400 p-2 rounded text-black"
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeRaw, rehypeKatex]}
                  components={customMarkdownComponents}
                >
                  {previewMarkdown}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-black leading-relaxed">
                {previewMarkdown.trim() ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                    components={customMarkdownComponents}
                  >
                    {previewMarkdown}
                  </ReactMarkdown>
                ) : (
                  <div className="text-center py-20 text-slate-400 italic">
                    Chưa có nội dung tài liệu. Hãy chọn dữ liệu đầu vào và nhấn Tạo tài liệu ở các Tab để bắt đầu.
                  </div>
                )}
              </div>
            )}

            {/* Footer in Word Document */}
            <div className="border-t border-slate-300 pt-3 mt-8 flex items-center justify-between text-[10.5pt] italic text-slate-700 font-serif-doc print:flex">
              <div>
                <strong>{repairVietnameseText(schoolName)}</strong> — Năm học 2026 - 2027
              </div>
              <div className="font-medium text-slate-800">
                Trang 1
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print CSS Injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #a4-print-document, #a4-print-document * {
            visibility: visible;
          }
          #a4-print-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 15mm !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
};
