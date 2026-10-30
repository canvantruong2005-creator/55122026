import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  Copy, 
  Download, 
  Check, 
  Trash2, 
  Eye, 
  AlertCircle, 
  BookOpen, 
  Layers, 
  FileCheck, 
  SplitSquareVertical, 
  ListOrdered, 
  RefreshCw, 
  CheckCircle2, 
  FileCode,
  Search,
  Sliders,
  Filter
} from 'lucide-react';
import { readFileAsText, getPdfPageCount } from '../../lib/fileUtils';
import { generateGeminiContent } from '../../lib/geminiApi';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { TikZVisualizer } from '../TikZVisualizer';
import { exportMarkdownToWord } from '../../lib/wordExport';

interface Tab14DocComparisonSynthesisProps {
  apiKeysInput: string;
  monHoc: string;
  lop: string;
  onOpenApiGuide: () => void;
}

interface UploadedDoc {
  id: string;
  name: string;
  size: string;
  content: string;
  rawFile?: File;
  totalPages?: number;
  type: string;
  uploadedAt: string;
  charCount: number;
  scanMode: 'full' | 'page_range' | 'excerpt';
  startPage: number;
  endPage: number;
  isRescanning?: boolean;
}

export const Tab14DocComparisonSynthesis: React.FC<Tab14DocComparisonSynthesisProps> = ({
  apiKeysInput,
  monHoc,
  lop,
  onOpenApiGuide
}) => {
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [readingStatus, setReadingStatus] = useState('');
  const [selectedDocPreview, setSelectedDocPreview] = useState<UploadedDoc | null>(null);

  // Analysis Modes
  const [analysisMode, setAnalysisMode] = useState<'compare' | 'synthesize' | 'evaluate' | 'extract'>('compare');
  const [focusAspect, setFocusAspect] = useState<'all' | 'content' | 'methodology' | 'activities' | 'assessments'>('all');
  const [targetCurriculum, setTargetCurriculum] = useState('GDPT 2018 (Chuẩn Công văn 5512 & 2345)');
  const [customPromptNote, setCustomPromptNote] = useState('');
  
  // Output & Loading
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Pre-upload Scan Configuration
  const [preUploadScanMode, setPreUploadScanMode] = useState<'full' | 'page_range' | 'ocr_diagram'>('full');
  const [preUploadStartPage, setPreUploadStartPage] = useState<number>(1);
  const [preUploadEndPage, setPreUploadEndPage] = useState<number>(20);

  // Handle multi-file upload with PDF page count detection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    setIsReadingFiles(true);
    const parsedKeys = apiKeysInput ? apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean) : [];

    const newDocs: UploadedDoc[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setReadingStatus(`Đang đọc & quét tài liệu (${i + 1}/${files.length}): ${file.name}...`);
      try {
        let totalPages = 1;
        if (file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')) {
          totalPages = await getPdfPageCount(file);
        }

        let text = '';
        let appliedScanMode: 'full' | 'page_range' | 'excerpt' = 'full';
        let appliedStart = 1;
        let appliedEnd = totalPages > 0 ? totalPages : 1;

        if (preUploadScanMode === 'full') {
          appliedScanMode = 'full';
          text = await readFileAsText(file, { fullScan: true, apiKeys: parsedKeys });
        } else if (preUploadScanMode === 'page_range') {
          appliedScanMode = 'page_range';
          appliedStart = Math.max(1, preUploadStartPage);
          appliedEnd = Math.min(totalPages, Math.max(appliedStart, preUploadEndPage));
          text = await readFileAsText(file, {
            startPage: appliedStart,
            endPage: appliedEnd,
            apiKeys: parsedKeys
          });
        } else {
          // ocr_diagram deep mode
          appliedScanMode = 'full';
          text = await readFileAsText(file, { fullScan: true, apiKeys: parsedKeys });
        }

        const sizeStr = file.size > 1024 * 1024 
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
          : `${Math.round(file.size / 1024)} KB`;

        newDocs.push({
          id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: sizeStr,
          content: text.trim(),
          rawFile: file,
          totalPages: totalPages > 0 ? totalPages : 1,
          startPage: appliedStart,
          endPage: appliedEnd,
          scanMode: appliedScanMode,
          type: file.type || 'text/plain',
          uploadedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          charCount: text.length
        });
      } catch (err: any) {
        console.error(`Error reading ${file.name}:`, err);
      }
    }

    setDocuments(prev => [...prev, ...newDocs]);
    setIsReadingFiles(false);
    setReadingStatus('');
    // reset input
    e.target.value = '';
  };

  // Re-scan specific document based on its page range
  const handleRescanDoc = async (docId: string) => {
    const targetDoc = documents.find(d => d.id === docId);
    if (!targetDoc || !targetDoc.rawFile) {
      alert('Không tìm thấy tệp gốc để quét lại. Vui lòng tải lại tệp!');
      return;
    }

    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, isRescanning: true } : d));
    const parsedKeys = apiKeysInput ? apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean) : [];

    try {
      let extractedText = '';
      if (targetDoc.scanMode === 'full') {
        extractedText = await readFileAsText(targetDoc.rawFile, { fullScan: true, apiKeys: parsedKeys });
      } else if (targetDoc.scanMode === 'page_range') {
        extractedText = await readFileAsText(targetDoc.rawFile, { 
          startPage: targetDoc.startPage, 
          endPage: targetDoc.endPage, 
          apiKeys: parsedKeys 
        });
      } else {
        // Excerpt
        extractedText = await readFileAsText(targetDoc.rawFile, { fullScan: true, apiKeys: parsedKeys });
        extractedText = extractedText.slice(0, 3000);
      }

      setDocuments(prev => prev.map(d => d.id === docId ? {
        ...d,
        content: extractedText.trim(),
        charCount: extractedText.trim().length,
        isRescanning: false
      } : d));
    } catch (err: any) {
      alert(`Lỗi khi quét lại tệp ${targetDoc.name}: ${err?.message || 'Không thể trích xuất'}`);
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, isRescanning: false } : d));
    }
  };

  const handleRemoveDoc = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    if (selectedDocPreview?.id === id) {
      setSelectedDocPreview(null);
    }
  };

  const handleClearAllDocs = () => {
    setDocuments([]);
    setSelectedDocPreview(null);
    setAiResult('');
  };

  const handleExecuteAI = async () => {
    if (documents.length === 0) {
      alert('Vui lòng tải lên ít nhất 01 tài liệu (hoặc từ 2 tài liệu trở lên để so sánh đối chiếu)!');
      return;
    }

    if (analysisMode === 'compare' && documents.length < 2) {
      alert('Chế độ "So sánh đối chiếu" cần ít nhất 02 tài liệu khác nhau. Bạn có thể chuyển sang chế độ "Tổng hợp", "Đánh giá phù hợp" hoặc "Trích xuất cốt lõi"!');
      return;
    }

    setIsProcessingAI(true);
    setAiResult('');

    try {
      // Build combined context with clear separators and selective scan range to save API keys
      const docsContext = documents.map((doc, idx) => {
        let contentToScan = doc.content;
        let modeLabel = 'Toàn bộ nội dung';

        if (doc.scanMode === 'page_range') {
          modeLabel = `Trích quét từ trang ${doc.startPage} đến trang ${doc.endPage} (Tổng: ${doc.totalPages || '?'} trang)`;
          contentToScan = doc.content;
        } else if (doc.scanMode === 'excerpt') {
          modeLabel = 'Quét trích đoạn ngắn 3.000 ký tự đầu';
          contentToScan = doc.content.slice(0, 3000);
        } else {
          contentToScan = doc.content.length > 150000 ? doc.content.slice(0, 150000) : doc.content;
        }

        return `========================================\n[TÀI LIỆU SỐ ${idx + 1}]: "${doc.name}" (Dung lượng: ${doc.size}, Độ dài: ${contentToScan.length} ký tự, Chế độ quét: ${modeLabel})\nNỘI DUNG:\n${contentToScan}\n========================================`;
      }).join('\n\n');

      let instructionPrompt = '';

      if (analysisMode === 'compare') {
        instructionPrompt = `Bạn là Chuyên gia Giáo dục & Thẩm định Sách Giáo khoa / Tài liệu dạy học hàng đầu Việt Nam.
Hãy thực hiện BẢN SO SÁNH ĐỐI CHIẾU TOÀN DIỆN, ĐA CHIỀU giữa các tài liệu trên cho Môn học: ${monHoc || 'Tổng hợp'}, Khối lớp: ${lop || 'Phổ thông'}.
Tiêu chí định hướng: ${targetCurriculum}, Trọng tâm khảo sát: ${focusAspect}.
Ghi chú bổ sung của Giáo viên: ${customPromptNote || 'Không có'}.

YÊU CẦU CẤU TRÚC KẾT QUẢ ĐẦU RA BẮT BUỘC:
# 📊 BẢN SO SÁNH ĐỐI CHIẾU & ĐÁNH GIÁ ĐA TÀI LIỆU DẠY HỌC
## 1. TỔNG QUAN CÁC TÀI LIỆU ĐƯA VÀO ĐỐI CHIẾU
- Trình bày thông tin nguồn gốc, đặc thù, cấu trúc chung của từng tài liệu.

## 2. MA TRẬN SO SÁNH CHI TIẾT (DẠNG BẢNG TOÀN DIỆN)
Lập bảng Markdown chi tiết với các cột:
| Tiêu chí So sánh | ${documents.map((d, i) => `Tài liệu ${i + 1} (${d.name.slice(0, 20)})`).join(' | ')} | Nhận xét & Đánh giá sư phạm |
So sánh rõ:
- Mục tiêu kiến thức & Yêu cầu cần đạt (YCCĐ).
- Mạch kiến thức & Tiến trình logic bài học.
- Hệ thống ví dụ, hình ảnh minh họa & kênh hình.
- Các dạng bài tập, câu hỏi luyện tập & vận dụng thực tiễn.
- Phương pháp tổ chức dạy học & Hoạt động học của học sinh.

## 3. CÁC ĐIỂM GIỐNG NHAU (GIAO THOA CỐT LÕI)
- Liệt kê chi tiết những kiến thức, khái niệm, công thức hoặc quy trình chung mà tất cả các tài liệu đều thống nhất.

## 4. CÁC ĐIỂM KHÁC BIỆT NỔI BẬT & ĐIỂM MỚI ĐỘT PHÁ
- Phân tích sâu những điểm riêng biệt, cách tiếp cận mới, ưu điểm và hạn chế của từng tài liệu.

## 5. ĐÁNH GIÁ MỨC ĐỘ PHÙ HỢP VỚI CHUẨN GDPT 2018 & ĐỐI TƯỢNG HỌC SINH
- Đánh giá tính sư phạm, độ khó, tính phân hóa và mức độ hấp dẫn.

## 6. KHUYẾN NGHỊ & ĐỀ XUẤT TÍCH HỢP CHO GIÁO VIÊN
- Hướng dẫn giáo viên cách kết hợp tinh hoa của các tài liệu để soạn một Kế hoạch bài dạy (Giáo án 5512 / 2345) tối ưu nhất.`;
      } else if (analysisMode === 'synthesize') {
        instructionPrompt = `Bạn là Chuyên gia Phát triển Chương trình và Biên soạn Tài liệu dạy học chuẩn Bộ GD&ĐT.
Hãy TỔNG HỢP & HỢP NHẤT TOÀN BỘ CÁC NGUỒN TÀI LIỆU TRÊN thành MỘT TÀI LIỆU CHUYÊN ĐỀ DẠY HỌC THỐNG NHẤT, HOÀN CHỈNH, CHUẨN MỰC 5512.
Môn học: ${monHoc || 'Chung'}, Lớp: ${lop || 'Phổ thông'}.
Ghi chú bổ sung: ${customPromptNote || 'Không có'}.

YÊU CẦU NỘI DUNG TỔNG HỢP:
# 📑 TÀI LIỆU TỔNG HỢP CHUYÊN ĐỀ DẠY HỌC TOÀN DIỆN
## I. MỤC TIÊU CẦN ĐẠT (Kiến thức, Năng lực đặc thù, Năng lực chung, Phẩm chất theo GDPT 2018)
## II. KIẾN THỨC TRỌNG TÂM ĐÃ ĐƯỢC CHẮT LỌC & TỔNG HỢP (Hệ thống logic, liền mạch, không lặp từ, định dạng công thức LaTeX chuẩn $...$)
## III. HỆ THỐNG CÂU HỎI & VÍ DỤ MINH HỌA ĐA DẠNG (Có lời giải chi tiết, phân hóa 4 mức độ: Biết - Hiểu - Vận dụng - Vận dụng cao)
## IV. CÁC HOẠT ĐỘNG THỰC HÀNH / TRẢI NGHIỆM / STEM TỔNG HỢP TỪ CÁC TÀI LIỆU
## V. TÀI LIỆU TỰ HỌC & HƯỚNG DẪN HỌC SINH TỔNG ÔN`;
      } else if (analysisMode === 'evaluate') {
        instructionPrompt = `Bạn là Hội đồng Thẩm định Chất lượng Sư phạm GDPT 2018.
Hãy ĐÁNH GIÁ MỨC ĐỘ PHÙ HỢP NỘI DUNG, TÍNH CHUẨN XÁC KHOA HỌC & ĐÁP ỨNG YÊU CẦU CẦN ĐẠT của các tài liệu được cung cấp.
Môn: ${monHoc || 'Chung'}, Lớp: ${lop || 'Phổ thông'}.

YÊU CẦU ĐẦU RA:
# 🎯 BẢN ĐÁNH GIÁ CHẤT LƯỢNG SƯ PHẠM & TÍNH PHÙ HỢP NỘI DUNG
## 1. ĐÁNH GIÁ TÍNH CHÍNH XÁC KHOA HỌC & TÍNH SƯ PHẠM (Chấm điểm thang 10 kèm nhận xét chi tiết)
## 2. ĐÁNH GIÁ MỨC ĐỘ BÁM SÁT CHƯƠNG TRÌNH GDPT 2018 & CHUẨN ĐẦU RA
## 3. PHÂN TÍCH TÍNH PHÂN HÓA & ĐỘ PHÙ HỢP VỚI TỪNG NHÓM ĐỐI TƯỢNG HỌC SINH
## 4. PHÁT HIỆN LỖI SAI / ĐIỂM BẤT CẬP / NỘI DUNG CẦN ĐIỀU CHỈNH
## 5. BẢNG KIỂM RUBRIC ĐÁNH GIÁ TỔNG THỂ TÀI LIỆU`;
      } else {
        instructionPrompt = `Bạn là Trợ lý AI Tinh hoa Sư phạm.
Hãy TRÍCH XUẤT TOÀN BỘ KIẾN THỨC CỐT LÕI, ĐỊNH NGHĨA, ĐỊNH LÝ, CÔNG THỨC VÀ SƠ ĐỒ TÓM LƯỢC DỄ HỌC NHẤT từ các tài liệu trên.
Trình bày rõ ràng, dễ nhớ, có sơ đồ khối ASCII/Markdown, công thức chuẩn LaTeX $...$.`;
      }

      const fullPrompt = `${instructionPrompt}\n\nDỮ LIỆU CÁC TÀI LIỆU ĐẦU VÀO:\n${docsContext}`;
      const result = await generateGeminiContent({
        prompt: fullPrompt,
        apiKeys: apiKeysInput
      });

      setAiResult(result);
    } catch (err: any) {
      alert(`Đã xảy ra lỗi khi xử lý AI: ${err?.message || 'Vui lòng kiểm tra lại API Keys hoặc dung lượng file!'}`);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleCopyResult = () => {
    if (!aiResult) return;
    navigator.clipboard.writeText(aiResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadDocx = async () => {
    if (!aiResult) return;
    const fileName = `SoSanh_TongHop_TaiLieu_${(monHoc || 'ChuyenDe').replace(/\s+/g, '_')}_${Date.now()}.docx`;
    await exportMarkdownToWord(aiResult, {
      fileName,
      schoolName: 'HỆ THỐNG AI LESSON PLANNER PRO',
      teacherName: 'BẢN SO SÁNH & TỔNG HỢP TÀI LIỆU',
      watermarkText: ''
    });
  };

  const filteredDocs = documents.filter(d => 
    d.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
    d.content.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 p-5 rounded-2xl border border-cyan-500/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                <SplitSquareVertical className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                SO SÁNH & TỔNG HỢP ĐA TÀI LIỆU DẠY HỌC
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold uppercase tracking-wider">
                  AI ĐA NĂNG
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Tải lên nhiều tài liệu cùng lúc (PDF, Word DOCX/DOC, PowerPoint PPTX, Excel, Ảnh bài giảng OCR, TXT). AI tự động đọc hiểu ngữ cảnh sâu, quét đối chiếu đa nguồn (Cánh Diều, Kết Nối Tri Thức, Chân Trời Sáng Tạo...), lập ma trận so sánh giống/khác, đánh giá độ phù hợp và tổng hợp thành chuyên đề chuẩn mực.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenApiGuide}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded-xl border border-cyan-500/30 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cấu hình AI API</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload & Controls on Left, Analysis Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Upload & Doc Management (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Pre-upload Scan Settings Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Thiết Lập Quét Trước Khi Tải Lên
                </h3>
              </div>
              <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Chuẩn xác 100%
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPreUploadScanMode('full')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                    preUploadScanMode === 'full'
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Quét Cả File
                </button>
                <button
                  type="button"
                  onClick={() => setPreUploadScanMode('page_range')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                    preUploadScanMode === 'page_range'
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Chọn Số Trang
                </button>
                <button
                  type="button"
                  onClick={() => setPreUploadScanMode('ocr_diagram')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                    preUploadScanMode === 'ocr_diagram'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Tự động OCR và dùng AI Vision đọc hiểu hình vẽ, sơ đồ, bảng biểu thành dữ liệu"
                >
                  OCR / AI Vision
                </button>
              </div>

              {preUploadScanMode === 'page_range' && (
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 animate-in fade-in-50 duration-150">
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span className="font-semibold text-cyan-300">Thiết lập khoảng trang quét:</span>
                    <span className="text-slate-500">Áp dụng cho PDF nạp vào</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Từ trang:</label>
                      <input
                        type="number"
                        min={1}
                        value={preUploadStartPage}
                        onChange={(e) => setPreUploadStartPage(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Đến trang:</label>
                      <input
                        type="number"
                        min={preUploadStartPage}
                        value={preUploadEndPage}
                        onChange={(e) => setPreUploadEndPage(Math.max(preUploadStartPage, parseInt(e.target.value) || 1))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {preUploadScanMode === 'ocr_diagram' && (
                <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-200 leading-relaxed">
                  💡 <strong>Tự Động Nhận Diện Đa Phương Thức:</strong> Nếu file quét scan không có text hoặc chứa sơ đồ/hình học, AI Multimodal Vision sẽ phân tích và chuyển hóa toàn bộ hình vẽ thành ngôn từ sư phạm chi tiết!
                </div>
              )}
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="bg-slate-900/90 border-2 border-dashed border-cyan-500/50 hover:border-cyan-400 rounded-2xl p-5 text-center transition-all bg-gradient-to-b from-slate-900 to-slate-950 shadow-md group relative">
            <input
              type="file"
              id="multi-doc-upload"
              multiple
              accept=".pdf,.docx,.doc,.pptx,.xlsx,.xls,.txt,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="multi-doc-upload"
              className="cursor-pointer flex flex-col items-center justify-center gap-3 w-full h-full"
            >
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block group-hover:text-cyan-300 transition-colors">
                  Ấn để chọn hoặc Kéo thả nhiều file tài liệu vào đây
                </span>
                <span className="text-xs text-slate-400 block mt-1">
                  Hỗ trợ: PDF, Word (.docx, .doc), PowerPoint, Excel, Ảnh (.png, .jpg) & TXT
                </span>
              </div>
              <span className="px-3.5 py-1.5 rounded-full bg-cyan-950 text-cyan-300 text-xs font-semibold border border-cyan-700/60 shadow-sm mt-1">
                + Tải Lên Nhiều File Cùng Lúc
              </span>
            </label>

            {isReadingFiles && (
              <div className="mt-3 p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/60 text-xs text-cyan-200 flex items-center justify-center gap-2 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{readingStatus}</span>
              </div>
            )}
          </div>

          {/* Document List Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Tài Liệu Đã Nạp ({documents.length})
                </h3>
              </div>

              {documents.length > 0 && (
                <button
                  onClick={handleClearAllDocs}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Xóa tất cả</span>
                </button>
              )}
            </div>

            {documents.length > 3 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Lọc tài liệu theo tên..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            )}

            {documents.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs italic bg-slate-950/50 rounded-xl border border-slate-800/60">
                Chưa có tài liệu nào được nạp. Thầy/Cô hãy kéo thả các file SGK, bài giảng, đề cương hoặc hình ảnh vào khung bên trên.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredDocs.map((doc, idx) => (
                  <div
                    key={doc.id}
                    className={`p-3 rounded-xl border transition-all space-y-2 text-xs ${
                      selectedDocPreview?.id === doc.id
                        ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-200'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-100 truncate text-[11px]" title={doc.name}>
                            {doc.name}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2">
                            <span>{doc.size}</span>
                            <span>•</span>
                            <span>{doc.charCount.toLocaleString()} ký tự</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setSelectedDocPreview(doc)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white transition-colors"
                          title="Xem nội dung văn bản trích xuất"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveDoc(doc.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition-colors"
                          title="Xóa tài liệu này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Scan Mode & Page Range Selector for Granular Reading */}
                    <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2 text-[11px]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-slate-400 font-medium">Chế độ đọc quét:</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, scanMode: 'full' } : d));
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                              doc.scanMode === 'full'
                                ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            Toàn bộ file
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, scanMode: 'page_range' } : d));
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                              doc.scanMode === 'page_range'
                                ? 'bg-amber-600 text-white border-amber-400 shadow-sm'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            Chọn khoảng trang
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, scanMode: 'excerpt' } : d));
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                              doc.scanMode === 'excerpt'
                                ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            Đoạn ngắn
                          </button>
                        </div>
                      </div>

                      {doc.scanMode === 'page_range' && (
                        <div className="bg-slate-900/90 border border-amber-500/40 rounded-lg p-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-[11px] text-amber-200">
                            <span>Từ trang:</span>
                            <input
                              type="number"
                              min={1}
                              max={doc.totalPages || 999}
                              value={doc.startPage || 1}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, startPage: Math.max(1, val) } : d));
                              }}
                              className="w-12 bg-slate-950 border border-amber-500/60 text-amber-300 rounded px-1.5 py-0.5 text-center font-bold text-xs focus:outline-none"
                            />
                            <span>Đến trang:</span>
                            <input
                              type="number"
                              min={1}
                              max={doc.totalPages || 999}
                              value={doc.endPage || doc.totalPages || 1}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, endPage: Math.max(1, val) } : d));
                              }}
                              className="w-12 bg-slate-950 border border-amber-500/60 text-amber-300 rounded px-1.5 py-0.5 text-center font-bold text-xs focus:outline-none"
                            />
                            {doc.totalPages && doc.totalPages > 1 && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                / tổng {doc.totalPages} trang
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={doc.isRescanning}
                            onClick={() => handleRescanDoc(doc.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] shadow transition-all disabled:opacity-50"
                            title="Quét lại nội dung theo đúng khoảng trang đã chọn"
                          >
                            <RefreshCw className={`w-3 h-3 ${doc.isRescanning ? 'animate-spin' : ''}`} />
                            <span>{doc.isRescanning ? 'Đang quét...' : 'Quét lại trang'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Analysis Options Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-md">
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Tùy Chọn Chế Độ Phân Tích & Tổng Hợp
            </h3>

            {/* Mode selection buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAnalysisMode('compare')}
                className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex flex-col gap-1 ${
                  analysisMode === 'compare'
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-950/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <SplitSquareVertical className="w-4 h-4 text-cyan-400" />
                  <span>1. So Sánh Đối Chiếu</span>
                </div>
                <span className="text-[10px] font-normal text-slate-400">
                  Lập ma trận giống, khác, điểm mới giữa các bộ tài liệu
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAnalysisMode('synthesize')}
                className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex flex-col gap-1 ${
                  analysisMode === 'synthesize'
                    ? 'bg-indigo-950 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-950/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>2. Tổng Hợp Chuyên Đề</span>
                </div>
                <span className="text-[10px] font-normal text-slate-400">
                  Hợp nhất đa nguồn thành 1 tài liệu hoàn chỉnh chuẩn 5512
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAnalysisMode('evaluate')}
                className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex flex-col gap-1 ${
                  analysisMode === 'evaluate'
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>3. Đánh Giá Chuẩn GDPT</span>
                </div>
                <span className="text-[10px] font-normal text-slate-400">
                  Thẩm định mức độ phù hợp, YCCĐ và đối tượng học sinh
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAnalysisMode('extract')}
                className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex flex-col gap-1 ${
                  analysisMode === 'extract'
                    ? 'bg-amber-950 border-amber-500 text-amber-300 shadow-md shadow-amber-950/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>4. Trích Xuất Cốt Lõi</span>
                </div>
                <span className="text-[10px] font-normal text-slate-400">
                  Rút gọn công thức, định nghĩa, sơ đồ tư duy tóm lược
                </span>
              </button>
            </div>

            {/* Focus Aspect */}
            <div>
              <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                Trọng tâm khảo sát & đối chiếu:
              </label>
              <select
                value={focusAspect}
                onChange={e => setFocusAspect(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="all">Toàn diện (Mục tiêu, Kiến thức, Hoạt động, Đánh giá, Bài tập)</option>
                <option value="content">Nội dung kiến thức & Độ chính xác khoa học</option>
                <option value="methodology">Phương pháp tổ chức dạy học & Tiến trình sư phạm</option>
                <option value="activities">Hệ thống bài tập, câu hỏi & Hoạt động thực hành</option>
                <option value="assessments">Công cụ đánh giá năng lực & Bảng kiểm Rubric</option>
              </select>
            </div>

            {/* Custom Notes */}
            <div>
              <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                Yêu cầu bổ sung cho AI (tùy chọn):
              </label>
              <input
                type="text"
                value={customPromptNote}
                onChange={e => setCustomPromptNote(e.target.value)}
                placeholder="VD: Tập trung so sánh bộ Cánh Diều và Kết Nối Tri Thức; xuất bảng đối chiếu..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Action Submit Button */}
            <button
              type="button"
              onClick={handleExecuteAI}
              disabled={isProcessingAI || documents.length === 0}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {isProcessingAI ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI Đang Đọc & Phân Tích Đa Tài Liệu...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {analysisMode === 'compare'
                      ? '⚡ Tiến Hành So Sánh Đối Chiếu Đa Tài Liệu'
                      : analysisMode === 'synthesize'
                      ? '⚡ Tiến Hành Hợp Nhất & Tổng Hợp Chuyên Đề'
                      : analysisMode === 'evaluate'
                      ? '⚡ Thẩm Định & Đánh Giá Tính Phù Hợp'
                      : '⚡ Trích Xuất Kiến Thức Cốt Lõi'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Results & Live Document Viewer (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Document Preview Drawer (if selected) */}
          {selectedDocPreview && (
            <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-4 space-y-3 shadow-lg animate-in fade-in-50 duration-150">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-cyan-200 block truncate">
                      Văn bản trích xuất đầy đủ: {selectedDocPreview.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {selectedDocPreview.charCount.toLocaleString()} ký tự • {selectedDocPreview.scanMode === 'full' ? `Toàn bộ ${selectedDocPreview.totalPages || 1} trang` : `Trang ${selectedDocPreview.startPage} đến ${selectedDocPreview.endPage}`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedDocPreview.content);
                      alert('Đã sao chép toàn bộ nội dung văn bản trích xuất!');
                    }}
                    className="text-xs text-cyan-300 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDocPreview(null)}
                    className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700"
                  >
                    Đóng xem
                  </button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] text-slate-200 font-mono whitespace-pre-wrap leading-relaxed select-text">
                {selectedDocPreview.content}
              </div>
            </div>
          )}

          {/* AI Result Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl min-h-[500px] flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      KẾT QUẢ PHÂN TÍCH TỔNG HỢP / ĐỐI CHIẾU
                      {aiResult && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Hoàn tất
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Hiển thị định dạng Markdown chuẩn, bảng biểu ma trận và công thức toán học KaTeX.
                    </p>
                  </div>
                </div>

                {/* Export Action Controls */}
                {aiResult && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleCopyResult}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                      title="Sao chép toàn bộ kết quả"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Đã chép!' : 'Sao chép'}</span>
                    </button>

                    <button
                      onClick={handleDownloadDocx}
                      className="px-3 py-1.5 rounded-lg bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/80 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                      title="Tải về file Word .doc chuẩn định dạng"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Xuất Word (.doc)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Output Content Area */}
              <div className="mt-4">
                {isProcessingAI ? (
                  <div className="py-20 text-center space-y-4">
                    <div className="inline-block p-4 rounded-full bg-cyan-500/10 border border-cyan-500/30 animate-pulse">
                      <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">AI đang phân tích & đối chiếu đa tài liệu</h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Hệ thống đang quét nội dung, đối chiếu cấu trúc SGK, lập ma trận so sánh và xây dựng báo cáo sư phạm...
                      </p>
                    </div>
                  </div>
                ) : !aiResult ? (
                  <div className="py-24 text-center space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                      <Layers className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-300">Chưa có kết quả phân tích</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Thầy/Cô hãy tải lên các file tài liệu ở cột bên trái và bấm nút <strong>"Tiến Hành So Sánh / Tổng Hợp"</strong>.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none text-slate-200 text-xs leading-relaxed overflow-x-auto space-y-3">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath, remarkGfm]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        pre({ children }: any) {
                          return <>{children}</>;
                        },
                        code({ node, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          const codeString = String(children).replace(/\n$/, '');
                          const isBlock = Boolean(match || codeString.includes('\n'));
                          if (isBlock && match && (match[1] === 'tikz' || match[1] === 'latex')) {
                            return <TikZVisualizer tikzCode={codeString} apiKeysInput={apiKeysInput} />;
                          }
                          if (isBlock) {
                            return (
                              <pre className="p-3 my-2.5 rounded-lg bg-slate-950 text-cyan-200 font-mono text-xs overflow-x-auto border border-slate-800">
                                <code>{children}</code>
                              </pre>
                            );
                          }
                          return (
                            <code className={className || "bg-slate-800 text-cyan-300 px-1 py-0.5 rounded font-mono text-xs"} {...props}>
                              {children}
                            </code>
                          );
                        },
                        p({ children }: any) {
                          return <div className="my-2 leading-relaxed text-slate-200">{children}</div>;
                        },
                        table({ children }: any) {
                          return (
                            <div className="overflow-x-auto my-3">
                              <table className="w-full border-collapse border border-slate-700 text-xs text-left bg-slate-950/60 rounded-lg overflow-hidden">
                                {children}
                              </table>
                            </div>
                          );
                        },
                        th({ children }: any) {
                          return (
                            <th className="border border-slate-700 bg-slate-800/90 px-3 py-2 font-bold text-cyan-300 text-left">
                              {children}
                            </th>
                          );
                        },
                        td({ children }: any) {
                          return (
                            <td className="border border-slate-800 px-3 py-2 text-slate-200">
                              {children}
                            </td>
                          );
                        },
                        h1({ children }: any) {
                          return <h1 className="text-base font-black text-cyan-300 border-b border-slate-800 pb-1.5 mt-4 mb-2">{children}</h1>;
                        },
                        h2({ children }: any) {
                          return <h2 className="text-sm font-bold text-amber-300 mt-3 mb-1.5">{children}</h2>;
                        },
                        h3({ children }: any) {
                          return <h3 className="text-xs font-bold text-indigo-300 mt-2 mb-1">{children}</h3>;
                        },
                        ul({ children }: any) {
                          return <ul className="list-disc pl-5 space-y-1 my-2 text-slate-300">{children}</ul>;
                        },
                        ol({ children }: any) {
                          return <ol className="list-decimal pl-5 space-y-1 my-2 text-slate-300">{children}</ol>;
                        }
                      }}
                    >
                      {aiResult}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Footer Notice */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                Hỗ trợ xuất khẩu sang Word & in ấn giáo án chuyên đề
              </span>
              <span>AI Sư phạm Phổ thông 2018</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
