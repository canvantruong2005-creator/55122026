import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  Upload,
  RefreshCw,
  Copy,
  Check,
  X,
  FileCheck,
  Zap,
  Scan,
  Edit3,
  Eye,
  Trash2,
  Volume2
} from 'lucide-react';
import { Tab5DocumentToSpeech } from './tabs/Tab5DocumentToSpeech';
import {
  convertPdfToWordWithOcr,
  convertWordToHtmlAndMarkdown,
  convertHtmlOrElementToPdf,
  triggerFileDownload,
  printHtmlDirectlyToPdf
} from '../lib/pdfOcrConverter';
import { saveAs } from 'file-saver';
import { exportMarkdownToWord } from '../lib/wordExport';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface VoiceAndDocConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeysInput: string;
  initialTab?: 'pdf_to_word' | 'word_to_pdf' | 'doc_to_speech';
  onInsertToDoc?: (text: string) => void;
}

export const VoiceAndDocConverterModal: React.FC<VoiceAndDocConverterModalProps> = ({
  isOpen,
  onClose,
  apiKeysInput,
  initialTab = 'pdf_to_word',
  onInsertToDoc
}) => {
  const [activeTab, setActiveTab] = useState<'pdf_to_word' | 'word_to_pdf' | 'doc_to_speech'>(initialTab);

  // PDF to Word State
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [pageRangeMode, setPageRangeMode] = useState<'all' | 'custom'>('all');
  const [startPageInput, setStartPageInput] = useState<number>(1);
  const [endPageInput, setEndPageInput] = useState<number>(5);
  const [isConvertingPdf, setIsConvertingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<{ message: string; current: number; total: number } | null>(null);
  const [convertedMarkdown, setConvertedMarkdown] = useState<string>('');
  const [isEditingPreview, setIsEditingPreview] = useState(false);
  const [previewTab, setPreviewTab] = useState<'preview' | 'edit'>('preview');

  // Word to PDF State
  const [selectedWordFile, setSelectedWordFile] = useState<File | null>(null);
  const [wordHtmlContent, setWordHtmlContent] = useState<string>('');
  const [wordMarkdownContent, setWordMarkdownContent] = useState<string>('');
  const [isConvertingWord, setIsConvertingWord] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [wordPreviewTab, setWordPreviewTab] = useState<'preview' | 'edit'>('preview');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const wordFileInputRef = useRef<HTMLInputElement>(null);
  const pdfRenderPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialTab === 'pdf_to_word' || initialTab === 'word_to_pdf' || initialTab === 'doc_to_speech') {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  if (!isOpen) return null;

  const apiKeys = apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);

  // PDF to Word Handlers with Page Range & OCR
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPdfFile(file);
      setConvertedMarkdown('');
    }
  };

  const handleConvertPdfToWord = async () => {
    if (!selectedPdfFile) return;

    setIsConvertingPdf(true);
    setPdfProgress({ message: 'Bắt đầu khởi tạo bộ đọc PDF...', current: 0, total: 10 });

    try {
      const result = await convertPdfToWordWithOcr(
        selectedPdfFile,
        apiKeys,
        {
          pageRangeMode,
          startPage: Number(startPageInput) || 1,
          endPage: Number(endPageInput) || 10
        },
        (p) => setPdfProgress({ message: p.message, current: p.current, total: p.total })
      );

      setConvertedMarkdown(result.markdown);
      setPreviewTab('preview');
    } catch (err: any) {
      alert('Lỗi chuyển đổi PDF sang Word: ' + (err?.message || err));
    } finally {
      setIsConvertingPdf(false);
      setPdfProgress(null);
    }
  };

  const handleDownloadDocx = async () => {
    if (convertedMarkdown && selectedPdfFile) {
      const fileName = selectedPdfFile.name.replace(/\.[^/.]+$/, '') + '_OCR_ChuyenDoi.docx';
      await exportMarkdownToWord(convertedMarkdown, {
        fileName,
        schoolName: 'BỘ GIÁO DỤC VÀ ĐÀO TẠO',
        teacherName: 'TÀI LIỆU CHUYỂN ĐỔI OCR',
        watermarkText: ''
      });
    }
  };

  // Word to PDF Handlers
  const handleWordUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedWordFile(file);
    setIsConvertingWord(true);
    try {
      const { html, markdown } = await convertWordToHtmlAndMarkdown(file);
      setWordHtmlContent(html);
      setWordMarkdownContent(markdown);
      setWordPreviewTab('preview');
    } catch (err: any) {
      alert('Lỗi đọc tệp Word (.docx): ' + (err?.message || err));
    } finally {
      setIsConvertingWord(false);
    }
  };

  const handleExportWordToPdf = async () => {
    if (!pdfRenderPreviewRef.current) {
      alert('Không tìm thấy nội dung xem trước!');
      return;
    }

    setIsExportingPdf(true);
    try {
      const fileName = (selectedWordFile ? selectedWordFile.name.replace(/\.[^/.]+$/, '') : 'Tai_lieu') + '.pdf';
      const pdfBlob = await convertHtmlOrElementToPdf(pdfRenderPreviewRef.current, fileName);
      
      // Dual-trigger download for maximum browser & iframe compatibility
      triggerFileDownload(pdfBlob, fileName);
      try {
        saveAs(pdfBlob, fileName);
      } catch (sErr) {}
    } catch (e: any) {
      console.error('PDF export error:', e);
      try {
        printHtmlDirectlyToPdf(wordHtmlContent, selectedWordFile?.name.replace(/\.[^/.]+$/, '') || 'Tài liệu');
      } catch (pErr) {
        alert('Lỗi xuất PDF: ' + (e?.message || e));
      }
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-indigo-700/70 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 border-b border-indigo-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-cyan-300">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                TRUNG TÂM CHUYỂN ĐỔI TÀI LIỆU SƯ PHẠM TOÀN DIỆN
              </h2>
              <p className="text-xs text-indigo-300">
                PDF sang Word (AI OCR Công thức & Bảng biểu) • Word sang PDF (Xem trước & Xuất chuẩn thể thức)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pdf_to_word')}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'pdf_to_word'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scan className="w-4 h-4" />
            <span>PDF Sang Word (Đọc & OCR AI Từng Trang)</span>
          </button>
          <button
            onClick={() => setActiveTab('word_to_pdf')}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'word_to_pdf'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Word Sang PDF (Xem Trước, Sửa & Xuất PDF)</span>
          </button>
          <button
            onClick={() => setActiveTab('doc_to_speech')}
            className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'doc_to_speech'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span>Văn Bản, Word, PDF Sang Giọng Đọc Audio (TTS)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: PDF TO WORD OCR WITH PAGE RANGE & EDITABLE PREVIEW */}
          {activeTab === 'pdf_to_word' && (
            <div className="space-y-5">
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                    <Scan className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Chuyển đổi PDF sang Word (.docx) với AI OCR Thông Minh</h3>
                    <p className="text-xs text-slate-400">
                      Đọc trọn vẹn văn bản số, bảng biểu và AI Vision OCR trang quét ảnh. Hỗ trợ hệ thống Key mặc định + Key Admin + Key cá nhân.
                    </p>
                  </div>
                </div>

                {/* Upload Input */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-900/60 hover:bg-slate-900 rounded-xl p-6 text-center cursor-pointer transition-all space-y-2"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-xl bg-indigo-950/80 border border-indigo-700/60 mx-auto flex items-center justify-center text-indigo-300">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="font-semibold text-slate-200 text-sm">
                    {selectedPdfFile ? selectedPdfFile.name : 'Nhấp để chọn hoặc kéo thả tệp PDF vào đây'}
                  </div>
                  <p className="text-xs text-slate-400">
                    {selectedPdfFile
                      ? `Dung lượng: ${(selectedPdfFile.size / 1024 / 1024).toFixed(2)} MB`
                      : 'Hỗ trợ cả PDF dạng văn bản số và PDF dạng ảnh chụp/quét (OCR AI)'}
                  </p>
                </div>

                {/* Page Range Settings */}
                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-3">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-indigo-400" />
                    <span>Phạm vi trang cần chuyển đổi:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      pageRangeMode === 'all'
                        ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}>
                      <input
                        type="radio"
                        name="page_range"
                        checked={pageRangeMode === 'all'}
                        onChange={() => setPageRangeMode('all')}
                        className="text-indigo-600 focus:ring-0"
                      />
                      <div>
                        <div className="font-bold">Toàn bộ tệp PDF</div>
                        <div className="text-[11px] text-slate-400">Chuyển đổi toàn bộ tất cả các trang</div>
                      </div>
                    </label>

                    <label className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      pageRangeMode === 'custom'
                        ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}>
                      <input
                        type="radio"
                        name="page_range"
                        checked={pageRangeMode === 'custom'}
                        onChange={() => setPageRangeMode('custom')}
                        className="text-indigo-600 focus:ring-0"
                      />
                      <div className="flex-1">
                        <div className="font-bold">Tùy chọn khoảng trang cụ thể</div>
                        <div className="text-[11px] text-slate-400">Trích xuất từ trang X đến trang Y</div>
                      </div>
                    </label>
                  </div>

                  {pageRangeMode === 'custom' && (
                    <div className="flex items-center gap-3 pt-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Từ trang:</span>
                        <input
                          type="number"
                          min={1}
                          value={startPageInput}
                          onChange={(e) => setStartPageInput(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-center text-white font-bold"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Đến trang:</span>
                        <input
                          type="number"
                          min={startPageInput}
                          value={endPageInput}
                          onChange={(e) => setEndPageInput(Math.max(startPageInput, parseInt(e.target.value) || startPageInput))}
                          className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-center text-white font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {isConvertingPdf && pdfProgress && (
                  <div className="bg-indigo-950/60 border border-indigo-800 p-4 rounded-xl space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        <span>{pdfProgress.message}</span>
                      </div>
                      <span>
                        {pdfProgress.total > 0
                          ? `${Math.round((pdfProgress.current / pdfProgress.total) * 100)}% (${pdfProgress.current}/${pdfProgress.total})`
                          : ''}
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-2 transition-all duration-300"
                        style={{
                          width: `${pdfProgress.total > 0 ? (pdfProgress.current / pdfProgress.total) * 100 : 30}%`
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Execute Button */}
                <button
                  onClick={handleConvertPdfToWord}
                  disabled={!selectedPdfFile || isConvertingPdf}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/40 disabled:opacity-50 transition-all"
                >
                  {isConvertingPdf ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang Đọc & OCR Tài Liệu PDF...</span>
                    </>
                  ) : (
                    <>
                      <Scan className="w-4 h-4" />
                      <span>Bắt Đầu Chuyển Đổi PDF Sang Word</span>
                    </>
                  )}
                </button>
              </div>

              {/* Converted Markdown & Preview / Edit Panel */}
              {convertedMarkdown && (
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">Kết quả chuyển đổi & Trình xem trước:</span>
                    </div>

                    <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[11px]">
                      <button
                        onClick={() => setPreviewTab('preview')}
                        className={`px-3 py-1 rounded font-semibold transition-all flex items-center gap-1 ${
                          previewTab === 'preview'
                            ? 'bg-indigo-600 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Eye className="w-3 h-3" /> Xem trước
                      </button>
                      <button
                        onClick={() => setPreviewTab('edit')}
                        className={`px-3 py-1 rounded font-semibold transition-all flex items-center gap-1 ${
                          previewTab === 'edit'
                            ? 'bg-cyan-600 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Edit3 className="w-3 h-3" /> Chỉnh sửa
                      </button>
                    </div>
                  </div>

                  {previewTab === 'preview' ? (
                    <div className="min-h-[220px] max-h-[400px] overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-200 text-xs leading-relaxed">
                      <div className="prose prose-invert max-w-none text-xs leading-relaxed">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {convertedMarkdown}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <textarea
                      value={convertedMarkdown}
                      onChange={(e) => setConvertedMarkdown(e.target.value)}
                      rows={12}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 text-xs leading-relaxed focus:border-indigo-500 focus:outline-none"
                    />
                  )}

                  {/* Actions for Converted Word */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      onClick={handleDownloadDocx}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg"
                    >
                      <Download className="w-4 h-4" />
                      Tải về tệp Word (.docx) Chuẩn Định Dạng
                    </button>

                    {onInsertToDoc && (
                      <button
                        onClick={() => {
                          onInsertToDoc(convertedMarkdown);
                          onClose();
                        }}
                        className="px-4 py-2.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-700 text-xs font-bold flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Chèn nội dung này vào Giáo án
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WORD TO PDF WITH WYSIWYG PREVIEW & EDITING */}
          {activeTab === 'word_to_pdf' && (
            <div className="space-y-5">
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Chuyển đổi Word (.docx) sang PDF Chất Lượng Cao</h3>
                    <p className="text-xs text-slate-400">
                      Tải lên tệp Word để xem trước trang A4, chỉnh sửa trực tiếp và xuất tệp PDF sắc nét, đúng chuẩn thể thức văn bản.
                    </p>
                  </div>
                </div>

                {/* Upload Input */}
                <div
                  onClick={() => wordFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-purple-500 bg-slate-900/60 hover:bg-slate-900 rounded-xl p-6 text-center cursor-pointer transition-all space-y-2"
                >
                  <input
                    ref={wordFileInputRef}
                    type="file"
                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleWordUpload}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-700/60 mx-auto flex items-center justify-center text-purple-300">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="font-semibold text-slate-200 text-sm">
                    {selectedWordFile ? selectedWordFile.name : 'Nhấp để chọn hoặc kéo thả tệp Word (.docx) vào đây'}
                  </div>
                  <p className="text-xs text-slate-400">
                    {selectedWordFile
                      ? `Dung lượng: ${(selectedWordFile.size / 1024).toFixed(1)} KB`
                      : 'Hỗ trợ định dạng Microsoft Word .docx'}
                  </p>
                </div>

                {isConvertingWord && (
                  <div className="flex items-center justify-center gap-2 text-xs text-purple-300 py-3">
                    <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                    <span>Đang phân tích và hiển thị tài liệu Word...</span>
                  </div>
                )}
              </div>

              {/* Word Preview & PDF Export Panel */}
              {wordHtmlContent && (
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-white">Xem trước và chỉnh sửa văn bản:</span>
                    </div>

                    <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[11px]">
                      <button
                        onClick={() => setWordPreviewTab('preview')}
                        className={`px-3 py-1 rounded font-semibold transition-all flex items-center gap-1 ${
                          wordPreviewTab === 'preview'
                            ? 'bg-purple-600 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Eye className="w-3 h-3" /> Bản in trang A4
                      </button>
                      <button
                        onClick={() => setWordPreviewTab('edit')}
                        className={`px-3 py-1 rounded font-semibold transition-all flex items-center gap-1 ${
                          wordPreviewTab === 'edit'
                            ? 'bg-indigo-600 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Edit3 className="w-3 h-3" /> Sửa Markdown
                      </button>
                    </div>
                  </div>

                  {wordPreviewTab === 'preview' ? (
                    <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 overflow-y-auto max-h-[500px]">
                      <div
                        ref={pdfRenderPreviewRef}
                        className="bg-white text-black p-8 rounded-lg shadow-xl mx-auto max-w-[800px] text-xs leading-relaxed font-sans"
                        dangerouslySetInnerHTML={{ __html: wordHtmlContent }}
                      />
                    </div>
                  ) : (
                    <textarea
                      value={wordMarkdownContent}
                      onChange={(e) => {
                        setWordMarkdownContent(e.target.value);
                      }}
                      rows={14}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 text-xs leading-relaxed focus:border-purple-500 focus:outline-none"
                    />
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      onClick={handleExportWordToPdf}
                      disabled={isExportingPdf}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
                    >
                      {isExportingPdf ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Đang Xuất PDF...
                        </>
                      ) : (
                        <>
                          <Printer className="w-4 h-4" />
                          Xuất & Tải Về Tệp PDF (.pdf)
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => printHtmlDirectlyToPdf(wordHtmlContent, selectedWordFile?.name.replace(/\.[^/.]+$/, '') || 'Tai_lieu')}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      In Trực Tiếp / Hộp Thoại In Trình Duyệt
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TEXT, WORD, PDF TO SPEECH AUDIO (TTS) */}
          {activeTab === 'doc_to_speech' && (
            <div className="space-y-4">
              <Tab5DocumentToSpeech apiKeysInput={apiKeysInput} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
