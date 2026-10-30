import React, { useState, useRef } from 'react';
import {
  Scissors,
  Merge,
  FileEdit,
  FileType,
  Upload,
  Download,
  Trash2,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileDown,
  Archive,
  Layers,
  Sparkles,
  Sliders,
  FileCode2,
  FolderArchive,
  Info,
  FileCheck2,
  FolderTree
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { generateMarkdownWordBlob } from '../../../lib/wordExport';
import { BatchRenameItem, BatchPdfConvertItem } from './types';
import { BatchWordFormatter } from './BatchWordFormatter';
import { BatchFolderRenamer } from './BatchFolderRenamer';

export const DocumentToolkit: React.FC = () => {
  // Active Tool: 'split' | 'merge' | 'rename' | 'word2pdf' | 'batch_format' | 'folder_rename'
  const [activeTool, setActiveTool] = useState<'split' | 'merge' | 'rename' | 'word2pdf' | 'batch_format' | 'folder_rename'>('split');
  const [statusMsg, setStatusMsg] = useState<string>('');


  // ==========================================
  // 1. SPLIT / CUT FILE STATE
  // ==========================================
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [splitFileType, setSplitFileType] = useState<'pdf' | 'docx'>('pdf');
  const [splitTotalPages, setSplitTotalPages] = useState<number>(1);
  const [splitStartPage, setSplitStartPage] = useState<number>(1);
  const [splitEndPage, setSplitEndPage] = useState<number>(1);
  const [isSplitting, setIsSplitting] = useState<boolean>(false);
  const splitInputRef = useRef<HTMLInputElement>(null);

  const handleSplitFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSplitFile(file);

    const isPdf = file.name.endsWith('.pdf');
    setSplitFileType(isPdf ? 'pdf' : 'docx');
    setStatusMsg(`Đang phân tích số trang của ${file.name}...`);

    try {
      if (isPdf) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const count = pdfDoc.getPageCount();
        setSplitTotalPages(count);
        setSplitStartPage(1);
        setSplitEndPage(Math.min(count, 5));
        setStatusMsg(`Tệp PDF có ${count} trang. Chọn khoảng trang cần cắt.`);
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const res = await mammoth.extractRawText({ arrayBuffer });
        const text = res.value || '';
        const estimated = Math.max(1, Math.ceil(text.length / 2500));
        setSplitTotalPages(estimated);
        setSplitStartPage(1);
        setSplitEndPage(Math.min(estimated, 2));
        setStatusMsg(`Tệp Word ước tính ~${estimated} trang. Chọn khoảng cần cắt.`);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMsg(`Lỗi đọc file: ${err.message}`);
    }
  };

  const handleExecuteSplit = async () => {
    if (!splitFile) return;
    setIsSplitting(true);
    setStatusMsg(`Đang cắt trang ${splitStartPage} đến ${splitEndPage}...`);

    try {
      if (splitFileType === 'pdf') {
        const arrayBuffer = await splitFile.arrayBuffer();
        const srcPdf = await PDFDocument.load(arrayBuffer);
        const total = srcPdf.getPageCount();

        const fromIdx = Math.max(0, splitStartPage - 1);
        const toIdx = Math.min(total - 1, splitEndPage - 1);

        if (fromIdx > toIdx) {
          throw new Error('Trang bắt đầu không được lớn hơn trang kết thúc!');
        }

        const newPdf = await PDFDocument.create();
        const pageIndices: number[] = [];
        for (let i = fromIdx; i <= toIdx; i++) {
          pageIndices.push(i);
        }

        const copiedPages = await newPdf.copyPages(srcPdf, pageIndices);
        copiedPages.forEach(p => newPdf.addPage(p));

        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const baseName = splitFile.name.replace(/\.[^/.]+$/, '');
        const outName = `${baseName}_Trang_${splitStartPage}-${splitEndPage}.pdf`;
        saveAs(blob, outName);
        setStatusMsg(`Đã cắt và tải file PDF thành công (${outName})!`);
      } else {
        // DOCX Split
        const arrayBuffer = await splitFile.arrayBuffer();
        const res = await mammoth.extractRawText({ arrayBuffer });
        const text = res.value || '';
        const paragraphs = text.split('\n\n').filter(Boolean);

        const totalP = Math.max(1, splitTotalPages);
        const parsPerPage = Math.max(2, Math.ceil(paragraphs.length / totalP));
        const startPar = (splitStartPage - 1) * parsPerPage;
        const endPar = Math.min(paragraphs.length, splitEndPage * parsPerPage);

        const extractedText = paragraphs.slice(startPar, endPar).join('\n\n');
        const baseName = splitFile.name.replace(/\.[^/.]+$/, '');
        const outName = `${baseName}_Trang_${splitStartPage}-${splitEndPage}.docx`;

        const blob = await generateMarkdownWordBlob(extractedText, {
          fileName: outName,
          showPageNumbers: true
        });
        saveAs(blob, outName);
        setStatusMsg(`Đã cắt và tải file Word thành công (${outName})!`);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMsg(`Lỗi khi cắt tệp: ${err.message}`);
    } finally {
      setIsSplitting(false);
    }
  };

  // ==========================================
  // 2. MERGE FILES STATE
  // ==========================================
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  const [mergeMode, setMergeMode] = useState<'pdf' | 'docx'>('pdf');
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const mergeInputRef = useRef<HTMLInputElement>(null);

  const handleMergeFilesAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Detect mode from first file
    const isFirstPdf = files[0].name.endsWith('.pdf');
    setMergeMode(isFirstPdf ? 'pdf' : 'docx');

    setMergeFiles(prev => [...prev, ...files]);
    if (mergeInputRef.current) mergeInputRef.current.value = '';
  };

  const moveMergeFile = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= mergeFiles.length) return;
    const newArr = [...mergeFiles];
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    setMergeFiles(newArr);
  };

  const removeMergeFile = (index: number) => {
    setMergeFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleExecuteMerge = async () => {
    if (mergeFiles.length < 2) {
      alert('Vui lòng thêm ít nhất 2 tệp để tiến hành ghép nối!');
      return;
    }

    setIsMerging(true);
    setStatusMsg(`Đang tiến hành ghép ${mergeFiles.length} tệp...`);

    try {
      if (mergeMode === 'pdf') {
        const mergedPdf = await PDFDocument.create();
        for (let i = 0; i < mergeFiles.length; i++) {
          const file = mergeFiles[i];
          setStatusMsg(`Đang nạp file ${i + 1}/${mergeFiles.length}: ${file.name}...`);
          const arrayBuffer = await file.arrayBuffer();
          const srcPdf = await PDFDocument.load(arrayBuffer);
          const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
          copiedPages.forEach(p => mergedPdf.addPage(p));
        }

        const pdfBytes = await mergedPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const outName = `Ghep_Noi_Ho_So_${new Date().toISOString().slice(0, 10)}.pdf`;
        saveAs(blob, outName);
        setStatusMsg(`Đã ghép thành công ${mergeFiles.length} file PDF thành ${outName}!`);
      } else {
        // DOCX Merge
        const mergedTextParts: string[] = [];
        for (let i = 0; i < mergeFiles.length; i++) {
          const file = mergeFiles[i];
          setStatusMsg(`Đang đọc nội dung file ${i + 1}/${mergeFiles.length}: ${file.name}...`);
          const arrayBuffer = await file.arrayBuffer();
          const res = await mammoth.extractRawText({ arrayBuffer });
          const text = res.value || '';
          mergedTextParts.push(`\n\n# PHẦN ${i + 1}: ${file.name.replace(/\.[^/.]+$/, '')}\n\n${text}`);
        }

        const outName = `Ghep_Noi_Ho_So_Word_${new Date().toISOString().slice(0, 10)}.docx`;
        const blob = await generateMarkdownWordBlob(mergedTextParts.join('\n\n---\n\n'), {
          fileName: outName,
          showPageNumbers: true
        });
        saveAs(blob, outName);
        setStatusMsg(`Đã ghép thành công ${mergeFiles.length} file Word thành ${outName}!`);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMsg(`Lỗi khi ghép tệp: ${err.message}`);
    } finally {
      setIsMerging(false);
    }
  };

  // ==========================================
  // 3. BATCH RENAME WORD FILES STATE
  // ==========================================
  const [renameItems, setRenameItems] = useState<BatchRenameItem[]>([]);
  const [namingPattern, setNamingPattern] = useState<string>('so_loai_trichyeu_ngay');
  const [customPrefix, setCustomPrefix] = useState<string>('');
  const [customSuffix, setCustomSuffix] = useState<string>('');
  const [isAnalyzingRename, setIsAnalyzingRename] = useState<boolean>(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Helper to sanitize Vietnamese filename
  const sanitizeFileName = (name: string): string => {
    return name
      .replace(/[/\\?%*:|"<>]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .trim();
  };

  const handleRenameFilesAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.name.endsWith('.docx') || f.name.endsWith('.doc'));
    if (files.length === 0) return;

    setIsAnalyzingRename(true);
    setStatusMsg(`Đang phân tích cấu trúc thể thức của ${files.length} file Word...`);

    const newItems: BatchRenameItem[] = [];

    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value || '';
        const previewHeader = text.slice(0, 1200);

        // Regex patterns to extract metadata
        let docNumber = '';
        let docType = 'VanBan';
        let subject = '';
        let date = new Date().toISOString().slice(0, 10);
        let org = '';

        // Extract doc number (Số: 15/QĐ-UBND or Số 05-QĐ/TW or Số: 28/TTr)
        const numMatch = previewHeader.match(/Số\s*[:\s]*([0-9A-ZĐđ\-\/\_]+)/i);
        if (numMatch) docNumber = numMatch[1].trim();

        // Extract doc type
        const typeMatch = previewHeader.match(/(QUYẾT ĐỊNH|KẾ HOẠCH|TỜ TRÌNH|BÁO CÁO|CÔNG VĂN|THÔNG BÁO|NGHỊ QUYẾT|CHỈ THỊ|HƯỚNG DẪN|BIÊN BẢN|QUY ĐỊNH|GIẤY MỜI)/i);
        if (typeMatch) {
          const raw = typeMatch[1].toUpperCase();
          if (raw.includes('QUYẾT ĐỊNH')) docType = 'QuyetDinh';
          else if (raw.includes('KẾ HOẠCH')) docType = 'KeHoach';
          else if (raw.includes('TỜ TRÌNH')) docType = 'ToTrinh';
          else if (raw.includes('BÁO CÁO')) docType = 'BaoCao';
          else if (raw.includes('CÔNG VĂN')) docType = 'CongVan';
          else if (raw.includes('THÔNG BÁO')) docType = 'ThongBao';
          else if (raw.includes('NGHỊ QUYẾT')) docType = 'NghiQuyet';
          else if (raw.includes('BIÊN BẢN')) docType = 'BienBan';
          else docType = raw.replace(/\s+/g, '');
        }

        // Extract subject (V/v or Về việc...)
        const subjMatch = previewHeader.match(/(?:V\/v|Về việc|về việc)\s*([^\n\r]+)/i);
        if (subjMatch) {
          subject = subjMatch[1].trim().slice(0, 50);
        } else {
          // fallback to original name without ext
          subject = file.name.replace(/\.[^/.]+$/, '').slice(0, 40);
        }

        // Extract date (ngày ... tháng ... năm ...)
        const dateMatch = previewHeader.match(/ngày\s*([0-9]{1,2})\s*tháng\s*([0-9]{1,2})\s*năm\s*([0-9]{4})/i);
        if (dateMatch) {
          const d = dateMatch[1].padStart(2, '0');
          const m = dateMatch[2].padStart(2, '0');
          const y = dateMatch[3];
          date = `${d}-${m}-${y}`;
        }

        const generatedName = buildNewFileName(
          namingPattern,
          file.name,
          { docNumber, docType, subject, date, org },
          customPrefix,
          customSuffix
        );

        newItems.push({
          id: `rename-${Date.now()}-${Math.random()}`,
          file,
          originalName: file.name,
          extractedMeta: { docNumber, docType, subject, date, org },
          newName: generatedName,
          status: 'ready'
        });
      } catch (err: any) {
        newItems.push({
          id: `rename-${Date.now()}-${Math.random()}`,
          file,
          originalName: file.name,
          newName: file.name,
          status: 'error',
          errorMessage: err.message
        });
      }
    }

    setRenameItems(prev => [...prev, ...newItems]);
    setIsAnalyzingRename(false);
    setStatusMsg(`Đã phân tích xong ${newItems.length} file Word!`);
    if (renameInputRef.current) renameInputRef.current.value = '';
  };

  const buildNewFileName = (
    pattern: string,
    origName: string,
    meta: { docNumber?: string; docType?: string; subject?: string; date?: string; org?: string },
    prefix = '',
    suffix = ''
  ): string => {
    let base = '';
    const safeNum = meta.docNumber ? sanitizeFileName(meta.docNumber) : '';
    const safeType = meta.docType || 'VanBan';
    const safeSubj = meta.subject ? sanitizeFileName(meta.subject) : 'NoiDung';
    const safeDate = meta.date || new Date().toISOString().slice(0, 10);
    const origBase = origName.replace(/\.[^/.]+$/, '');

    if (pattern === 'so_loai_trichyeu_ngay') {
      base = [safeNum, safeType, safeSubj, safeDate].filter(Boolean).join('_');
    } else if (pattern === 'loai_trichyeu_nam') {
      const year = safeDate.split('-').pop() || '2026';
      base = `${safeType}_${safeSubj}_${year}`;
    } else if (pattern === 'prefix_orig_suffix') {
      base = [prefix, origBase, suffix].filter(Boolean).join('_');
    } else {
      base = [safeType, safeSubj].filter(Boolean).join('_');
    }

    if (prefix && pattern !== 'prefix_orig_suffix') base = `${prefix}_${base}`;
    if (suffix && pattern !== 'prefix_orig_suffix') base = `${base}_${suffix}`;

    return `${sanitizeFileName(base)}.docx`;
  };

  const applyPatternToAll = (pattern: string) => {
    setNamingPattern(pattern);
    setRenameItems(prev =>
      prev.map(item => ({
        ...item,
        newName: item.extractedMeta
          ? buildNewFileName(pattern, item.originalName, item.extractedMeta, customPrefix, customSuffix)
          : item.newName
      }))
    );
  };

  const handleDownloadAllRenamedZip = async () => {
    if (renameItems.length === 0) return;
    setStatusMsg('Đang đóng gói file ZIP các tệp đã đổi tên...');
    try {
      const zip = new JSZip();
      for (const item of renameItems) {
        zip.file(item.newName, item.file);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `Danh_Sach_File_Word_Da_Doi_Ten_${new Date().toISOString().slice(0, 10)}.zip`);
      setStatusMsg('Đã tải thành công file nén ZIP chứa tất cả các file đã đổi tên!');
    } catch (err: any) {
      console.error(err);
      setStatusMsg(`Lỗi tạo file ZIP: ${err.message}`);
    }
  };

  // ==========================================
  // 4. BATCH WORD TO PDF STATE
  // ==========================================
  const [pdfItems, setPdfItems] = useState<BatchPdfConvertItem[]>([]);
  const [isConvertingBatch, setIsConvertingBatch] = useState<boolean>(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handlePdfFilesAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.name.endsWith('.docx') || f.name.endsWith('.doc'));
    if (files.length === 0) return;

    const newItems: BatchPdfConvertItem[] = files.map(file => ({
      id: `w2p-${Date.now()}-${Math.random()}`,
      file,
      originalName: file.name,
      status: 'pending'
    }));

    setPdfItems(prev => [...prev, ...newItems]);
    if (pdfInputRef.current) pdfInputRef.current.value = '';
  };

  const convertSingleDocxToPdf = async (item: BatchPdfConvertItem): Promise<Blob> => {
    const arrayBuffer = await item.file.arrayBuffer();
    const res = await mammoth.extractRawText({ arrayBuffer });
    const text = res.value || '';

    // Create jsPDF Document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxLineWidth = pageWidth - margin * 2;

    doc.setFont('times', 'normal');
    doc.setFontSize(12);

    const lines = doc.splitTextToSize(text, maxLineWidth);
    let cursorY = margin;
    const lineHeight = 6.5;

    for (let i = 0; i < lines.length; i++) {
      if (cursorY + lineHeight > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      }
      doc.text(lines[i], margin, cursorY);
      cursorY += lineHeight;
    }

    return doc.output('blob');
  };

  const handleExecuteBatchPdf = async () => {
    if (pdfItems.length === 0) return;
    setIsConvertingBatch(true);
    setStatusMsg(`Bắt đầu chuyển đổi ${pdfItems.length} file Word sang PDF...`);

    const updated = [...pdfItems];
    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      if (item.status === 'success') continue;

      item.status = 'converting';
      setPdfItems([...updated]);
      setStatusMsg(`Đang chuyển đổi (${i + 1}/${updated.length}): ${item.originalName}...`);

      try {
        const blob = await convertSingleDocxToPdf(item);
        item.pdfBlob = blob;
        item.status = 'success';
      } catch (err: any) {
        console.error(err);
        item.status = 'error';
        item.errorMessage = err.message;
      }
      setPdfItems([...updated]);
    }

    setIsConvertingBatch(false);
    setStatusMsg(`Hoàn tất chuyển đổi ${pdfItems.length} file Word sang PDF!`);
  };

  const handleDownloadPdfZip = async () => {
    const successItems = pdfItems.filter(p => p.status === 'success' && p.pdfBlob);
    if (successItems.length === 0) {
      alert('Chưa có file PDF nào được chuyển đổi thành công!');
      return;
    }

    setStatusMsg('Đang đóng gói file ZIP các file PDF...');
    try {
      const zip = new JSZip();
      for (const item of successItems) {
        const pdfName = item.originalName.replace(/\.[^/.]+$/, '') + '.pdf';
        zip.file(pdfName, item.pdfBlob!);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `Danh_Sach_PDF_Chuyen_Doi_${new Date().toISOString().slice(0, 10)}.zip`);
      setStatusMsg('Đã tải thành công file ZIP chứa tất cả các file PDF!');
    } catch (err: any) {
      console.error(err);
      setStatusMsg(`Lỗi đóng gói ZIP: ${err.message}`);
    }
  };

  return (
    <div className="bg-slate-900/95 rounded-2xl border border-indigo-900/60 p-4 sm:p-5 space-y-4 shadow-xl">
        {/* Header & Sub-tool Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 via-teal-500 to-cyan-500 text-white shadow-md">
              <FileType className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Bộ Tiện Ích Xử Lý & Chuyển Đổi File Word / PDF / Folder Chuyên Nghiệp</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700 font-semibold">
                  6 trong 1
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Cắt ghép file, đổi tên file/thư mục hàng loạt, định dạng chuẩn hóa văn bản Word đồng loạt và chuyển Word sang PDF chuẩn in ấn
              </p>
            </div>
          </div>

          {/* Tool selector buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTool('split')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTool === 'split'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>1. Cắt File</span>
            </button>

            <button
              onClick={() => setActiveTool('merge')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTool === 'merge'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Merge className="w-3.5 h-3.5" />
              <span>2. Ghép File</span>
            </button>

            <button
              onClick={() => setActiveTool('rename')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTool === 'rename'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>3. Đổi Tên File</span>
            </button>

            <button
              onClick={() => setActiveTool('word2pdf')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTool === 'word2pdf'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>4. Word Sang PDF</span>
            </button>

            <button
              onClick={() => setActiveTool('batch_format')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTool === 'batch_format'
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>5. Định Dạng Nhiều File Word</span>
            </button>

            <button
              onClick={() => setActiveTool('folder_rename')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTool === 'folder_rename'
                  ? 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>6. Đổi Tên Hàng Loạt Folder</span>
            </button>
          </div>
        </div>

      {/* Status Bar */}
      {statusMsg && (
        <div className="px-3.5 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-indigo-300 text-xs flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. SPLIT FILE TOOL */}
      {/* ========================================================= */}
      {activeTool === 'split' && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-rose-900/40 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-rose-400" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-100">
                  Cắt File Word (.docx) hoặc PDF (.pdf) từ trang nào đến trang nào:
                </h4>
              </div>

              <button
                onClick={() => splitInputRef.current?.click()}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-lg text-xs font-bold border border-rose-700/50 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{splitFile ? 'Chọn Tệp Khác' : 'Tải Lên Tệp (.pdf, .docx)'}</span>
              </button>
              <input
                type="file"
                ref={splitInputRef}
                onChange={handleSplitFileChange}
                accept=".pdf,.docx,.doc"
                className="hidden"
              />
            </div>

            {splitFile ? (
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      splitFileType === 'pdf' ? 'bg-rose-950 text-rose-300' : 'bg-blue-950 text-blue-300'
                    }`}>
                      {splitFileType}
                    </span>
                    <span className="font-bold text-white">{splitFile.name}</span>
                    <span className="text-slate-400">({(splitFile.size / 1024).toFixed(1)} KB)</span>
                  </div>

                  <span className="text-emerald-400 font-semibold">
                    Tổng số trang: {splitTotalPages} trang
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800 text-xs">
                  <span className="font-semibold text-slate-300">Khoảng trang cần cắt:</span>
                  <div className="flex items-center gap-2">
                    <span>Từ trang:</span>
                    <input
                      type="number"
                      min={1}
                      max={splitTotalPages}
                      value={splitStartPage}
                      onChange={e => setSplitStartPage(Math.max(1, Math.min(splitTotalPages, parseInt(e.target.value) || 1)))}
                      className="w-16 bg-slate-950 border border-slate-700 text-rose-300 font-bold px-2 py-1 rounded text-center focus:border-rose-500 focus:outline-none"
                    />
                    <span>đến trang:</span>
                    <input
                      type="number"
                      min={splitStartPage}
                      max={splitTotalPages}
                      value={splitEndPage}
                      onChange={e => setSplitEndPage(Math.max(splitStartPage, Math.min(splitTotalPages, parseInt(e.target.value) || splitStartPage)))}
                      className="w-16 bg-slate-950 border border-slate-700 text-rose-300 font-bold px-2 py-1 rounded text-center focus:border-rose-500 focus:outline-none"
                    />
                    <span className="text-slate-400">
                      (Sẽ xuất ra {splitEndPage - splitStartPage + 1} trang)
                    </span>
                  </div>

                  <button
                    onClick={handleExecuteSplit}
                    disabled={isSplitting}
                    className="ml-auto px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-md shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    {isSplitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span>Cắt & Tải Về Ngay</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
                <Scissors className="w-8 h-8 mx-auto mb-2 text-rose-400/50" />
                <p className="text-xs text-slate-400 font-medium">Bấm nút "Tải Lên Tệp" để chọn file PDF hoặc Word cần cắt trang.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MERGE FILES TOOL */}
      {/* ========================================================= */}
      {activeTool === 'merge' && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-indigo-900/40 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Merge className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-100">
                  Ghép Nhiều File Word Hoặc Nhiều File PDF Thành 1 File Duy Nhất:
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => mergeInputRef.current?.click()}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-bold border border-indigo-700/50 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>+ Thêm File Cần Ghép</span>
                </button>
                <input
                  type="file"
                  ref={mergeInputRef}
                  onChange={handleMergeFilesAdd}
                  multiple
                  accept=".pdf,.docx,.doc"
                  className="hidden"
                />

                {mergeFiles.length >= 2 && (
                  <button
                    onClick={handleExecuteMerge}
                    disabled={isMerging}
                    className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-lg text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    {isMerging ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>Ghép Tất Cả ({mergeFiles.length} Tệp)</span>
                  </button>
                )}
              </div>
            </div>

            {mergeFiles.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>Danh sách file theo thứ tự ghép (Dùng nút mũi tên để đổi vị trí):</span>
                  <button
                    onClick={() => setMergeFiles([])}
                    className="text-rose-400 hover:underline cursor-pointer"
                  >
                    Xóa tất cả
                  </button>
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {mergeFiles.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-white truncate">{file.name}</span>
                        <span className="text-slate-500 text-[11px]">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => moveMergeFile(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Chuyển lên trên"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveMergeFile(idx, 'down')}
                          disabled={idx === mergeFiles.length - 1}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Chuyển xuống dưới"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeMergeFile(idx)}
                          className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                          title="Xóa tệp này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
                <Merge className="w-8 h-8 mx-auto mb-2 text-indigo-400/50" />
                <p className="text-xs text-slate-400 font-medium">Bấm nút "+ Thêm File Cần Ghép" để nạp từ 2 file Word hoặc PDF trở lên.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. BATCH RENAME WORD FILES */}
      {/* ========================================================= */}
      {activeTool === 'rename' && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-amber-900/40 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileEdit className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-100">
                  Đổi Tên Hàng Loạt Nhiều File Word Tự Động Theo Chuẩn Thể Thức:
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => renameInputRef.current?.click()}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-bold border border-amber-700/50 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>+ Nạp Danh Sách File Word</span>
                </button>
                <input
                  type="file"
                  ref={renameInputRef}
                  onChange={handleRenameFilesAdd}
                  multiple
                  accept=".docx,.doc"
                  className="hidden"
                />

                {renameItems.length > 0 && (
                  <button
                    onClick={handleDownloadAllRenamedZip}
                    className="px-4 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-lg text-xs shadow-md shadow-amber-600/30 flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <FolderArchive className="w-3.5 h-3.5" />
                    <span>Tải Toàn Bộ File Đã Đổi Tên (.ZIP)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Naming Rules Selector */}
            {renameItems.length > 0 && (
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-300">Mẫu đặt tên chuẩn:</span>
                  <select
                    value={namingPattern}
                    onChange={e => applyPatternToAll(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-amber-300 font-semibold rounded-lg px-2.5 py-1 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="so_loai_trichyeu_ngay">[SốKýHiệu]_[LoạiVB]_[TríchYếu]_[Ngày]</option>
                    <option value="loai_trichyeu_nam">[LoạiVB]_[TríchYếu]_[Năm]</option>
                    <option value="prefix_orig_suffix">[TiềnTố]_[TênGốc]_[HậuTố]</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customPrefix}
                    onChange={e => {
                      setCustomPrefix(e.target.value);
                      applyPatternToAll(namingPattern);
                    }}
                    placeholder="Tiền tố (VD: 2026_THCS)"
                    className="w-28 bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2 py-1 rounded focus:border-amber-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={customSuffix}
                    onChange={e => {
                      setCustomSuffix(e.target.value);
                      applyPatternToAll(namingPattern);
                    }}
                    placeholder="Hậu tố (VD: DaKyDuyet)"
                    className="w-28 bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2 py-1 rounded focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Rename Table */}
            {renameItems.length > 0 ? (
              <div className="space-y-2">
                <div className="max-h-72 overflow-y-auto space-y-1.5">
                  {renameItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-[200px] flex-1">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                          {idx + 1}
                        </span>
                        <div className="overflow-hidden">
                          <p className="font-mono text-slate-400 text-[11px] truncate" title={item.originalName}>
                            {item.originalName}
                          </p>
                          {item.extractedMeta?.subject && (
                            <p className="text-[10px] text-slate-500 truncate">
                              Trích yếu: {item.extractedMeta.subject}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-1 min-w-[260px]">
                        <span className="text-amber-400 font-bold text-xs">➔</span>
                        <input
                          type="text"
                          value={item.newName}
                          onChange={e => {
                            const val = e.target.value;
                            setRenameItems(prev =>
                              prev.map(it => (it.id === item.id ? { ...it, newName: val } : it))
                            );
                          }}
                          className="flex-1 bg-slate-950 border border-amber-700/60 rounded px-2 py-1 text-amber-200 font-semibold focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => saveAs(item.file, item.newName)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded cursor-pointer"
                          title="Tải riêng file này"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setRenameItems(prev => prev.filter(it => it.id !== item.id))}
                          className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                          title="Xóa khỏi danh sách"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
                <FileEdit className="w-8 h-8 mx-auto mb-2 text-amber-400/50" />
                <p className="text-xs text-slate-400 font-medium">Bấm nút "+ Nạp Danh Sách File Word" để chọn nhiều file Word cùng lúc.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. BATCH WORD TO PDF */}
      {/* ========================================================= */}
      {activeTool === 'word2pdf' && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900/40 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileDown className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-100">
                  Chuyển Đổi Hàng Loạt Nhiều File Word Sang PDF Cùng Lúc (Khổ A4 Chuẩn In):
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => pdfInputRef.current?.click()}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-xs font-bold border border-emerald-700/50 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>+ Nạp File Word (.docx)</span>
                </button>
                <input
                  type="file"
                  ref={pdfInputRef}
                  onChange={handlePdfFilesAdd}
                  multiple
                  accept=".docx,.doc"
                  className="hidden"
                />

                {pdfItems.length > 0 && (
                  <button
                    onClick={handleExecuteBatchPdf}
                    disabled={isConvertingBatch}
                    className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    {isConvertingBatch ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileType className="w-3.5 h-3.5" />}
                    <span>Chuyển Sang PDF ({pdfItems.length} Tệp)</span>
                  </button>
                )}

                {pdfItems.some(p => p.status === 'success') && (
                  <button
                    onClick={handleDownloadPdfZip}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-700/60 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Tải Tất Cả PDF (.ZIP)</span>
                  </button>
                )}
              </div>
            </div>

            {/* PDF Conversion Items List */}
            {pdfItems.length > 0 ? (
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {pdfItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-white truncate">{item.originalName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status === 'pending' && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          Chờ chuyển đổi
                        </span>
                      )}
                      {item.status === 'converting' && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Đang chuyển...
                        </span>
                      )}
                      {item.status === 'success' && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Đã chuyển thành PDF
                        </span>
                      )}
                      {item.status === 'error' && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-rose-950 text-rose-300">
                          Lỗi: {item.errorMessage}
                        </span>
                      )}

                      {item.status === 'success' && item.pdfBlob && (
                        <button
                          onClick={() => {
                            const pdfName = item.originalName.replace(/\.[^/.]+$/, '') + '.pdf';
                            saveAs(item.pdfBlob!, pdfName);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Tải PDF</span>
                        </button>
                      )}

                      <button
                        onClick={() => setPdfItems(prev => prev.filter(it => it.id !== item.id))}
                        className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
                <FileDown className="w-8 h-8 mx-auto mb-2 text-emerald-400/50" />
                <p className="text-xs text-slate-400 font-medium">Bấm nút "+ Nạp File Word" để chọn các file Word cần chuyển đổi sang PDF đồng loạt.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. BATCH WORD FORMATTER TOOL */}
      {/* ========================================================= */}
      {activeTool === 'batch_format' && <BatchWordFormatter />}

      {/* ========================================================= */}
      {/* 6. BATCH FOLDER RENAMER & SCRIPT GENERATOR */}
      {/* ========================================================= */}
      {activeTool === 'folder_rename' && <BatchFolderRenamer />}
    </div>
  );
};
