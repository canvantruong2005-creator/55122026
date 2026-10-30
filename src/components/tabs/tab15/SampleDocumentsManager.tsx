import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  Eye,
  CheckCircle2,
  Copy,
  Check,
  X,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Sliders,
  RefreshCw,
  FolderOpen,
  Download
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';
import { exportMarkdownToWord } from '../../../lib/wordExport';
import { ReferenceSampleDoc } from './types';

interface Props {
  samples: ReferenceSampleDoc[];
  onUpdateSamples: (samples: ReferenceSampleDoc[]) => void;
  onAddSample: (sample: ReferenceSampleDoc) => void;
  onDeleteSample: (id: string) => void;
  onToggleSample: (id: string) => void;
}

export const SampleDocumentsManager: React.FC<Props> = ({
  samples,
  onUpdateSamples,
  onAddSample,
  onDeleteSample,
  onToggleSample
}) => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStatus, setScanStatus] = useState<string>('');
  const [viewingSample, setViewingSample] = useState<ReferenceSampleDoc | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Scan range configuration modal / settings
  const [pageRangeMode, setPageRangeMode] = useState<'all' | 'custom'>('all');
  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(10);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download reference sample as Word (.docx)
  const handleDownloadDocx = async (sample: ReferenceSampleDoc) => {
    try {
      setDownloadingId(sample.id);
      const safeName = sample.fileName.replace(/\.[^/.]+$/, '');
      await exportMarkdownToWord(sample.extractedText, {
        fileName: `ThamChieu_${safeName}`,
        headerText: `TÀI LIỆU THAM CHIẾU: ${sample.fileName.toUpperCase()}`,
        footerText: 'Kho Mẫu Tham Chiếu AI - Chuẩn Thể Thức'
      });
    } catch (err: any) {
      console.error('Lỗi tải file docx:', err);
      // Fallback to text file download
      handleDownloadTxt(sample);
    } finally {
      setDownloadingId(null);
    }
  };

  // Download reference sample as Text (.txt)
  const handleDownloadTxt = (sample: ReferenceSampleDoc) => {
    const blob = new Blob([sample.extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = sample.fileName.replace(/\.[^/.]+$/, '');
    a.href = url;
    a.download = `ThamChieu_${safeName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  // Scan a single uploaded file
  const processUploadedFile = async (
    file: File,
    rangeMode: 'all' | 'custom',
    fromP: number,
    toP: number
  ): Promise<ReferenceSampleDoc> => {
    let extractedText = '';
    let totalPages = 1;
    const fileType = file.name.endsWith('.pdf') ? 'pdf' : file.name.endsWith('.docx') ? 'docx' : 'txt';

    if (fileType === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer.slice(0),
        useSystemFonts: true,
        cMapUrl: `https://unpkg.com/pdfjs-dist@${(pdfjsLib as any).version || '6.2.108'}/cmaps/`,
        cMapPacked: true
      });
      const pdfDoc = await loadingTask.promise;
      totalPages = pdfDoc.numPages || 1;

      const pStart = rangeMode === 'custom' ? Math.max(1, Math.min(fromP, totalPages)) : 1;
      const pEnd = rangeMode === 'custom' ? Math.max(pStart, Math.min(toP, totalPages)) : totalPages;

      const pageTexts: string[] = [];
      for (let p = pStart; p <= pEnd; p++) {
        setScanStatus(`Đang trích xuất ${file.name} - Trang ${p}/${totalPages}...`);
        const page = await pdfDoc.getPage(p);
        const textContent = await page.getTextContent();
        const pText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ')
          .trim();
        pageTexts.push(`--- [Trang ${p}] ---\n${pText}`);
      }
      extractedText = pageTexts.join('\n\n');
    } else if (fileType === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      extractedText = result.value || '';
      // Estimate pages roughly (about 450 words or 2500 chars per page)
      totalPages = Math.max(1, Math.ceil(extractedText.length / 2500));
      if (rangeMode === 'custom' && totalPages > 1) {
        const lines = extractedText.split('\n');
        const linesPerPage = Math.max(20, Math.ceil(lines.length / totalPages));
        const startLine = (Math.max(1, fromP) - 1) * linesPerPage;
        const endLine = Math.min(lines.length, toP * linesPerPage);
        extractedText = lines.slice(startLine, endLine).join('\n');
      }
    } else {
      extractedText = await file.text();
      totalPages = Math.max(1, Math.ceil(extractedText.length / 2500));
    }

    return {
      id: `sample-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fileName: file.name,
      fileType,
      fileSize: file.size,
      totalPages,
      scannedRange: {
        mode: rangeMode,
        startPage: rangeMode === 'custom' ? fromP : 1,
        endPage: rangeMode === 'custom' ? Math.min(toP, totalPages) : totalPages
      },
      extractedText: extractedText.trim(),
      createdAt: Date.now(),
      isActive: true
    };
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsScanning(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setScanStatus(`Đang quét file ${i + 1}/${files.length}: ${file.name}...`);
        const newSample = await processUploadedFile(file, pageRangeMode, startPage, endPage);
        onAddSample(newSample);
      }
      setScanStatus(`Đã quét thành công ${files.length} tài liệu mẫu!`);
    } catch (err: any) {
      console.error('Lỗi quét tài liệu mẫu:', err);
      setScanStatus(`Lỗi khi quét file: ${err.message || err}`);
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalActiveChars = samples
    .filter(s => s.isActive)
    .reduce((sum, s) => sum + s.extractedText.length, 0);

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-amber-800/40 p-4 sm:p-5 space-y-4 shadow-xl">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Kho Tài Liệu Mẫu Tham Chiếu AI ({samples.length} tài liệu)</span>
              {totalActiveChars > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700/60 font-semibold font-mono">
                  {totalActiveChars.toLocaleString('vi-VN')} ký tự tham chiếu
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Nạp nhiều tài liệu mẫu (Word/PDF/TXT), tùy chọn quét toàn bộ hoặc từ trang X đến Y làm thước đo cho AI
            </p>
          </div>
        </div>

        {/* Upload Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/30 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Đang Quét File...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 text-amber-100" />
                <span>+ Thêm Tài Liệu Mẫu (.docx, .pdf, .txt)</span>
              </>
            )}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFilesSelected}
            multiple
            accept=".docx,.pdf,.txt,.doc"
            className="hidden"
          />
        </div>
      </div>

      {/* Page Range Setting & Options */}
      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Phạm vi quét khi tải file mới:</span>
          </span>

          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
            <input
              type="radio"
              name="sampleRangeMode"
              checked={pageRangeMode === 'all'}
              onChange={() => setPageRangeMode('all')}
              className="accent-amber-500"
            />
            <span>Quét toàn bộ tệp</span>
          </label>

          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
            <input
              type="radio"
              name="sampleRangeMode"
              checked={pageRangeMode === 'custom'}
              onChange={() => setPageRangeMode('custom')}
              className="accent-amber-500"
            />
            <span>Quét từ trang:</span>
          </label>

          {pageRangeMode === 'custom' && (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                value={startPage}
                onChange={e => setStartPage(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 bg-slate-900 border border-slate-700 text-amber-300 font-bold px-2 py-1 rounded text-center focus:border-amber-500 focus:outline-none"
              />
              <span className="text-slate-400">đến trang</span>
              <input
                type="number"
                min={1}
                value={endPage}
                onChange={e => setEndPage(Math.max(startPage, parseInt(e.target.value) || startPage))}
                className="w-14 bg-slate-900 border border-slate-700 text-amber-300 font-bold px-2 py-1 rounded text-center focus:border-amber-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {scanStatus && (
          <span className="text-[11px] text-amber-300 italic animate-pulse">
            {scanStatus}
          </span>
        )}
      </div>

      {/* Samples List */}
      {samples.length === 0 ? (
        <div className="text-center py-10 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 space-y-2">
          <FolderOpen className="w-9 h-9 mx-auto text-slate-600" />
          <p className="text-xs text-slate-400 font-medium">Chưa có tài liệu mẫu nào được tải lên.</p>
          <p className="text-[11px] text-slate-500">
            Tải lên các văn bản mẫu (.docx, .pdf, .txt) của cơ quan hoặc trường học để AI đối chiếu và học hỏi chuẩn mực.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {samples.map((sample, idx) => (
            <div
              key={sample.id}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-2.5 ${
                sample.isActive
                  ? 'bg-slate-950/90 border-amber-700/60 shadow-md'
                  : 'bg-slate-950/40 border-slate-800 opacity-60'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                      sample.fileType === 'pdf'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : sample.fileType === 'docx'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {sample.fileType}
                    </span>
                    <h4 className="text-xs font-bold text-slate-200 truncate" title={sample.fileName}>
                      {sample.fileName}
                    </h4>
                  </div>

                  <button
                    onClick={() => onDeleteSample(sample.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors shrink-0 cursor-pointer"
                    title="Xóa tài liệu này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span>
                    {sample.scannedRange.mode === 'all'
                      ? `Toàn bộ (${sample.totalPages || 1} trang)`
                      : `Trang ${sample.scannedRange.startPage} - ${sample.scannedRange.endPage}/${sample.totalPages || 1}`}
                  </span>
                  <span>•</span>
                  <span className="text-amber-300 font-mono">
                    {sample.extractedText.length.toLocaleString('vi-VN')} ký tự
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 font-mono bg-slate-900/60 p-1.5 rounded border border-slate-800/80">
                  {sample.extractedText.slice(0, 150)}...
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sample.isActive}
                    onChange={() => onToggleSample(sample.id)}
                    className="accent-amber-500 rounded"
                  />
                  <span className="text-[11px] font-semibold">
                    {sample.isActive ? 'Đang dùng' : 'Tạm tắt'}
                  </span>
                </label>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleDownloadDocx(sample)}
                    disabled={downloadingId === sample.id}
                    className="px-2 py-1 bg-blue-900/80 hover:bg-blue-800 text-blue-200 hover:text-white rounded-lg text-[11px] font-bold border border-blue-700/80 flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                    title="Tải văn bản tham chiếu này thành file Word (.docx)"
                  >
                    <Download className={`w-3 h-3 ${downloadingId === sample.id ? 'animate-bounce' : ''}`} />
                    <span>Word</span>
                  </button>

                  <button
                    onClick={() => setViewingSample(sample)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white rounded-lg text-[11px] font-bold border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                    title="Xem chi tiết nội dung đã trích xuất"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Xem</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: View Extracted Scan Result */}
      {viewingSample && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-white truncate">
                    Kết Quả Quét: {viewingSample.fileName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Phạm vi:{' '}
                    {viewingSample.scannedRange.mode === 'all'
                      ? `Toàn bộ ${viewingSample.totalPages || 1} trang`
                      : `Trang ${viewingSample.scannedRange.startPage} đến ${viewingSample.scannedRange.endPage}`}{' '}
                    • Tổng cộng {viewingSample.extractedText.length.toLocaleString('vi-VN')} ký tự
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadDocx(viewingSample)}
                  disabled={downloadingId === viewingSample.id}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-blue-900/30"
                  title="Tải văn bản này về máy dưới dạng Word (.docx)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải Word (.docx)</span>
                </button>

                <button
                  onClick={() => handleDownloadTxt(viewingSample)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Tải văn bản dưới dạng file văn bản (.txt)"
                >
                  <span>Tải .txt</span>
                </button>

                <button
                  onClick={() => handleCopyText(viewingSample.extractedText)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                </button>

                <button
                  onClick={() => setViewingSample(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Full Extracted Text */}
            <div className="p-4 flex-1 overflow-y-auto bg-slate-950/60 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap selection:bg-amber-900 selection:text-white">
              {viewingSample.extractedText || 'Không có văn bản trích xuất nào.'}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Được lưu trữ an toàn trong bộ nhớ làm việc.</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadDocx(viewingSample)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải File Word (.docx)</span>
                </button>
                <button
                  onClick={() => setViewingSample(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition-all cursor-pointer"
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
