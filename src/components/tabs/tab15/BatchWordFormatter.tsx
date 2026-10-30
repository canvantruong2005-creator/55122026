import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Sliders,
  Archive,
  Sparkles,
  BookOpen,
  Scale,
  GraduationCap,
  Settings2,
  Check,
  Plus,
  BookmarkPlus,
  Layers,
  Edit3,
  Copy,
  FolderPlus,
  FileCode2
} from 'lucide-react';
import * as mammoth from 'mammoth';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  convertMillimetersToTwip,
  HeadingLevel
} from 'docx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { BatchWordFormatItem, WordFormatConfig, CustomWordPreset } from './types';

// Default Built-in Presets
const DEFAULT_PRESETS: Record<string, CustomWordPreset> = {
  nd30: {
    id: 'nd30',
    name: 'Chuẩn Nghị định 30/2020/NĐ-CP',
    description: 'Quy chuẩn thể thức văn bản hành chính Nhà nước (Times New Roman 14pt, Lề 20-20-30-15mm, Thụt lề 1.27cm, Dãn dòng 1.3).',
    isBuiltIn: true,
    config: {
      preset: 'nd30',
      fontFamily: 'Times New Roman',
      bodyFontSize: 14,
      headingFontSize: 14,
      lineSpacing: 1.3,
      spaceAfter: 4,
      spaceBefore: 0,
      firstLineIndent: 12.7,
      alignment: 'justify',
      margins: { top: 20, bottom: 20, left: 30, right: 15 },
      cleanExtraSpaces: true,
      fixVietnamesePunctuation: true,
      autoCapitalizeHeadings: true,
      standardizeQuotes: true
    }
  },
  dang_05: {
    id: 'dang_05',
    name: 'Chuẩn Hướng dẫn 05-HD/VPTW',
    description: 'Quy định thể thức văn bản cơ quan Đảng (Times New Roman 14pt, Lề trái 30mm, Dãn dòng 1.3, thụt đoạn chuẩn 1.27cm).',
    isBuiltIn: true,
    config: {
      preset: 'dang_05',
      fontFamily: 'Times New Roman',
      bodyFontSize: 14,
      headingFontSize: 14,
      lineSpacing: 1.3,
      spaceAfter: 4,
      spaceBefore: 0,
      firstLineIndent: 12.7,
      alignment: 'justify',
      margins: { top: 20, bottom: 20, left: 30, right: 15 },
      cleanExtraSpaces: true,
      fixVietnamesePunctuation: true,
      autoCapitalizeHeadings: true,
      standardizeQuotes: true
    }
  },
  education: {
    id: 'education',
    name: 'Chuẩn Giáo Dục & Bài Dạy (5512/3666)',
    description: 'Tối ưu giáo án, kế hoạch bài dạy và tài liệu trường học (Times New Roman 13pt, Lề trái 25mm, Dãn dòng 1.25).',
    isBuiltIn: true,
    config: {
      preset: 'education',
      fontFamily: 'Times New Roman',
      bodyFontSize: 13,
      headingFontSize: 14,
      lineSpacing: 1.25,
      spaceAfter: 3,
      spaceBefore: 0,
      firstLineIndent: 10,
      alignment: 'justify',
      margins: { top: 20, bottom: 20, left: 25, right: 15 },
      cleanExtraSpaces: true,
      fixVietnamesePunctuation: true,
      autoCapitalizeHeadings: true,
      standardizeQuotes: true
    }
  },
  skkn: {
    id: 'skkn',
    name: 'Chuẩn Sáng Kiến Kinh Nghiệm & Đề Tài KH',
    description: 'Dành cho báo cáo SKKN, đề tài khoa học (Times New Roman 14pt, Lề trái 35mm để đóng gáy lò xo, Dãn dòng 1.5).',
    isBuiltIn: true,
    config: {
      preset: 'skkn',
      fontFamily: 'Times New Roman',
      bodyFontSize: 14,
      headingFontSize: 15,
      lineSpacing: 1.5,
      spaceAfter: 6,
      spaceBefore: 2,
      firstLineIndent: 12.7,
      alignment: 'justify',
      margins: { top: 25, bottom: 20, left: 35, right: 20 },
      cleanExtraSpaces: true,
      fixVietnamesePunctuation: true,
      autoCapitalizeHeadings: true,
      standardizeQuotes: true
    }
  },
  compact: {
    id: 'compact',
    name: 'Chuẩn Báo Cáo & Biên Bản Gọn Gàng',
    description: 'Tiết kiệm giấy in cho biên bản họp, thông báo ngắn (Times New Roman 12pt, Dãn dòng 1.15, Lề 15mm đều).',
    isBuiltIn: true,
    config: {
      preset: 'compact',
      fontFamily: 'Times New Roman',
      bodyFontSize: 12,
      headingFontSize: 13,
      lineSpacing: 1.15,
      spaceAfter: 2,
      spaceBefore: 0,
      firstLineIndent: 8,
      alignment: 'justify',
      margins: { top: 15, bottom: 15, left: 20, right: 15 },
      cleanExtraSpaces: true,
      fixVietnamesePunctuation: true,
      autoCapitalizeHeadings: true,
      standardizeQuotes: true
    }
  }
};

const STORAGE_KEY = 'custom_word_presets_v2';

export const BatchWordFormatter: React.FC = () => {
  const [items, setItems] = useState<BatchWordFormatItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importPresetRef = useRef<HTMLInputElement>(null);

  // Presets List (Builtin + User custom)
  const [presets, setPresets] = useState<Record<string, CustomWordPreset>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_PRESETS, ...parsed };
      }
    } catch (e) {
      console.warn('Error reading saved presets:', e);
    }
    return DEFAULT_PRESETS;
  });

  const [activePresetId, setActivePresetId] = useState<string>('nd30');
  const [config, setConfig] = useState<WordFormatConfig>(DEFAULT_PRESETS.nd30.config);

  // New Preset Modal / Inline Form State
  const [isCreatingPreset, setIsCreatingPreset] = useState<boolean>(false);
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [newPresetDesc, setNewPresetDesc] = useState<string>('');

  // Sync to local storage whenever custom presets change
  const saveCustomPresets = (updated: Record<string, CustomWordPreset>) => {
    setPresets(updated);
    try {
      const customOnly: Record<string, CustomWordPreset> = {};
      Object.entries(updated).forEach(([k, v]) => {
        if (!v.isBuiltIn) customOnly[k] = v;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customOnly));
    } catch (e) {
      console.warn('Error saving custom presets:', e);
    }
  };

  const handleSelectPreset = (presetId: string) => {
    setActivePresetId(presetId);
    const target = presets[presetId];
    if (target) {
      setConfig({ ...target.config, preset: presetId });
    }
  };

  const handleCreateNewPreset = () => {
    if (!newPresetName.trim()) {
      alert('Vui lòng nhập tên cho mẫu định dạng mới!');
      return;
    }
    const id = `custom_${Date.now()}`;
    const newPreset: CustomWordPreset = {
      id,
      name: newPresetName.trim(),
      description: newPresetDesc.trim() || 'Mẫu định dạng tùy chỉnh do người dùng tạo.',
      isBuiltIn: false,
      config: {
        ...config,
        preset: id
      }
    };
    const updated = { ...presets, [id]: newPreset };
    saveCustomPresets(updated);
    setActivePresetId(id);
    setIsCreatingPreset(false);
    setNewPresetName('');
    setNewPresetDesc('');
    setStatusMsg(`Đã lưu thành công mẫu định dạng mới: "${newPreset.name}"!`);
  };

  const handleDeleteCustomPreset = (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (presets[presetId]?.isBuiltIn) {
      alert('Không thể xóa mẫu mặc định của hệ thống!');
      return;
    }
    if (!confirm(`Bạn có chắc muốn xóa mẫu định dạng "${presets[presetId]?.name}"?`)) return;
    const updated = { ...presets };
    delete updated[presetId];
    saveCustomPresets(updated);
    if (activePresetId === presetId) {
      handleSelectPreset('nd30');
    }
    setStatusMsg('Đã xóa mẫu định dạng tùy chỉnh!');
  };

  // Export Presets to JSON
  const handleExportPresets = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(presets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Mau_Dinh_Dang_Word_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import Presets from JSON
  const handleImportPresets = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        const updated = { ...presets, ...imported };
        saveCustomPresets(updated);
        setStatusMsg(`Đã nạp thành công các mẫu định dạng từ file JSON!`);
      } catch (err: any) {
        alert('File JSON không hợp lệ: ' + err.message);
      }
    };
    reader.readAsText(file);
    if (importPresetRef.current) importPresetRef.current.value = '';
  };

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(
      f => f.name.endsWith('.docx') || f.name.endsWith('.doc')
    );
    if (files.length === 0) return;

    const newItems: BatchWordFormatItem[] = files.map(file => ({
      id: `wfmt-${Date.now()}-${Math.random()}`,
      file,
      originalName: file.name,
      newName: file.name.replace(/\.docx?$/i, '_ChuanHoa.docx'),
      status: 'pending'
    }));

    setItems(prev => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setStatusMsg(`Đã nạp ${newItems.length} file Word. Hãy chọn mẫu quy chuẩn và bấm "Bắt Đầu Định Dạng".`);
  };

  // Helper clean vietnamese text & punctuation
  const cleanVietnameseText = (rawText: string): { cleaned: string; fixCount: number } => {
    let text = rawText;
    let fixCount = 0;

    if (config.cleanExtraSpaces) {
      const beforeSpaces = text;
      // Replace multiple spaces with single space
      text = text.replace(/[ \t]+/g, ' ');
      // Clean space before punctuation (. , ; : ! ?)
      text = text.replace(/\s+([.,;:!?])/g, '$1');
      // Ensure space after punctuation if followed by letter
      text = text.replace(/([.,;:!?])(?=[a-zA-ZÀ-ỹ0-9])/g, '$1 ');
      if (text !== beforeSpaces) fixCount += 1;
    }

    if (config.standardizeQuotes) {
      // Standardize quotes: "..." -> “...”
      text = text.replace(/"([^"]*)"/g, '“$1”');
    }

    return { cleaned: text.trim(), fixCount };
  };

  // Process a single Docx File
  const formatSingleDocx = async (item: BatchWordFormatItem): Promise<{ blob: Blob; stats: { paragraphsCount: number; wordsCount: number; fixesApplied: number } }> => {
    const arrayBuffer = await item.file.arrayBuffer();
    const res = await mammoth.extractRawText({ arrayBuffer });
    const rawContent = res.value || '';

    const lines = rawContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    let totalFixes = 0;
    let totalWords = 0;

    const docParagraphs: Paragraph[] = [];

    for (const rawLine of lines) {
      const { cleaned, fixCount } = cleanVietnameseText(rawLine);
      totalFixes += fixCount;
      const words = cleaned.split(/\s+/).filter(Boolean);
      totalWords += words.length;

      // Detect if heading/title
      const isMajorHeading = /^(Điều\s+\d+|Chương\s+[IVXLCDM]+|Phần\s+[IVXLCDM]+|QUYẾT ĐỊNH|KẾ HOẠCH|TỜ TRÌNH|BÁO CÁO|QUY CHẾ|KẾ HOẠCH BÀI DẠY|GIÁO ÁN)/i.test(cleaned);
      const isSubHeading = /^(\d+\.|\w\)|-\s+|I\.|II\.|III\.|IV\.|V\.|VI\.|VII\.|VIII\.|IX\.|X\.)/i.test(cleaned);
      const isHeaderBlock = /^(CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM|ĐỘC LẬP - TỰ DO - HẠNH PHÚC|ĐẢNG CỘNG SẢN VIỆT NAM)/i.test(cleaned);

      let alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = config.alignment === 'justify' ? AlignmentType.JUSTIFIED : AlignmentType.LEFT;
      let isBold = false;
      let isItalic = false;
      let indentMm = config.firstLineIndent;
      let fontSizeHalfPt = config.bodyFontSize * 2; // docx uses half-points (28 for 14pt)

      if (isHeaderBlock) {
        alignment = AlignmentType.CENTER;
        isBold = true;
        indentMm = 0;
      } else if (isMajorHeading) {
        alignment = AlignmentType.LEFT;
        isBold = true;
        indentMm = 0;
        fontSizeHalfPt = config.headingFontSize * 2;
      } else if (isSubHeading) {
        alignment = AlignmentType.JUSTIFIED;
        isBold = true;
        indentMm = config.firstLineIndent / 2;
      }

      // Check for italic cases (e.g. date: "..., ngày ... tháng ... năm ...")
      if (/ngày\s+\d+\s+tháng\s+\d+\s+năm\s+\d+/i.test(cleaned) || /^V\/v\s+/i.test(cleaned)) {
        isItalic = true;
        if (/ngày\s+\d+\s+tháng/i.test(cleaned)) {
          alignment = AlignmentType.RIGHT;
          indentMm = 0;
        }
      }

      const p = new Paragraph({
        alignment: alignment,
        heading: isMajorHeading ? HeadingLevel.HEADING_2 : undefined,
        spacing: {
          line: Math.round(config.lineSpacing * 240), // 240 = 1.0 line in docx
          before: config.spaceBefore * 20, // 20 twips per pt
          after: config.spaceAfter * 20
        },
        indent: indentMm > 0 ? { firstLine: convertMillimetersToTwip(indentMm) } : undefined,
        children: [
          new TextRun({
            text: cleaned,
            font: config.fontFamily,
            size: fontSizeHalfPt,
            bold: isBold,
            italics: isItalic
          })
        ]
      });

      docParagraphs.push(p);
    }

    // Build standard Docx
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertMillimetersToTwip(config.margins.top),
                bottom: convertMillimetersToTwip(config.margins.bottom),
                left: convertMillimetersToTwip(config.margins.left),
                right: convertMillimetersToTwip(config.margins.right)
              }
            }
          },
          children: docParagraphs.length > 0 ? docParagraphs : [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Tài liệu chuẩn hóa rỗng.',
                  font: config.fontFamily,
                  size: config.bodyFontSize * 2
                })
              ]
            })
          ]
        }
      ]
    });

    const blob = await Packer.toBlob(doc);
    return {
      blob,
      stats: {
        paragraphsCount: lines.length,
        wordsCount: totalWords,
        fixesApplied: totalFixes
      }
    };
  };

  // Format all files
  const handleFormatAll = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);
    setStatusMsg(`Đang tiến hành chuẩn hóa định dạng cho ${items.length} file Word...`);

    const updated = [...items];
    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      item.status = 'formatting';
      setItems([...updated]);

      try {
        const { blob, stats } = await formatSingleDocx(item);
        item.formattedBlob = blob;
        item.stats = stats;
        item.status = 'success';
      } catch (err: any) {
        console.error(err);
        item.status = 'error';
        item.errorMessage = err.message || 'Lỗi khi xử lý cấu trúc Word';
      }
      setItems([...updated]);
    }

    setIsProcessing(false);
    setStatusMsg(`Đã chuẩn hóa định dạng thành công cho ${updated.filter(it => it.status === 'success').length}/${items.length} file theo mẫu "${presets[activePresetId]?.name || 'Tùy chỉnh'}"!`);
  };

  // Download single formatted file
  const handleDownloadSingle = (item: BatchWordFormatItem) => {
    if (!item.formattedBlob) return;
    saveAs(item.formattedBlob, item.newName || `ChuanHoa_${item.originalName}`);
  };

  // Download all as ZIP
  const handleDownloadAllZip = async () => {
    const successItems = items.filter(it => it.status === 'success' && it.formattedBlob);
    if (successItems.length === 0) {
      alert('Chưa có file nào được định dạng thành công để tải về!');
      return;
    }

    setStatusMsg('Đang đóng gói file ZIP chứa tất cả các tệp Word đã chuẩn hóa...');
    try {
      const zip = new JSZip();
      for (const item of successItems) {
        zip.file(item.newName || `ChuanHoa_${item.originalName}`, item.formattedBlob!);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `Danh_Sach_Word_Da_Chuan_Hoa_Dinh_Dang_${new Date().toISOString().slice(0, 10)}.zip`);
      setStatusMsg('Đã tải thành công file nén ZIP chứa tất cả các file Word chuẩn hóa!');
    } catch (err: any) {
      console.error(err);
      setStatusMsg(`Lỗi tạo ZIP: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Configuration Header Box */}
      <div className="bg-slate-950 p-4 rounded-xl border border-teal-900/40 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-100">
              Chọn Hoặc Tự Bổ Sung Mẫu Định Dạng File Word (.docx):
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsCreatingPreset(true)}
              className="px-3 py-1.5 bg-teal-950 hover:bg-teal-900 text-teal-300 rounded-lg text-xs font-bold border border-teal-700/60 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tạo Mẫu Định Dạng Mới</span>
            </button>

            <button
              onClick={handleExportPresets}
              title="Xuất toàn bộ danh sách mẫu ra file JSON"
              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 text-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => importPresetRef.current?.click()}
              title="Nạp thêm mẫu từ file JSON"
              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 text-xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
            <input
              type="file"
              ref={importPresetRef}
              onChange={handleImportPresets}
              accept=".json"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ Nạp Danh Sách File Word</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFilesSelect}
              multiple
              accept=".docx,.doc"
              className="hidden"
            />
          </div>
        </div>

        {/* Modal / Form to Add New Preset */}
        {isCreatingPreset && (
          <div className="p-3.5 bg-slate-900 rounded-xl border border-teal-600/50 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
                <BookmarkPlus className="w-4 h-4 text-teal-400" />
                <span>Bổ Sung Mẫu Định Dạng Mới Vào Thư Viện:</span>
              </div>
              <button
                onClick={() => setIsCreatingPreset(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕ Đóng
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                  Tên Mẫu Định Dạng (VD: Mẫu chuẩn đơn vị, Mẫu Tổ Toán - KHTN):
                </label>
                <input
                  type="text"
                  value={newPresetName}
                  onChange={e => setNewPresetName(e.target.value)}
                  placeholder="Nhập tên mẫu..."
                  className="w-full bg-slate-950 border border-teal-700/60 rounded-lg p-2 text-slate-200 text-xs focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                  Mô Tả Ngắn (Quy định áp dụng, font chữ, lề...):
                </label>
                <input
                  type="text"
                  value={newPresetDesc}
                  onChange={e => setNewPresetDesc(e.target.value)}
                  placeholder="Mô tả thông số hoặc ghi chú quy định..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs focus:border-teal-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400 italic">
                * Mẫu mới sẽ tự động kế thừa và lưu lại các thông số bạn thiết lập ở phần "Tùy Chỉnh Nâng Cao" bên dưới.
              </span>
              <button
                onClick={handleCreateNewPreset}
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Lưu Mẫu Này Vào Thư Viện</span>
              </button>
            </div>
          </div>
        )}

        {/* Preset Selector Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
          {Object.entries(presets).map(([id, p]) => {
            const isSelected = activePresetId === id;
            return (
              <div
                key={id}
                onClick={() => handleSelectPreset(id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative group ${
                  isSelected
                    ? 'bg-teal-950/80 border-teal-500 shadow-md ring-1 ring-teal-500/50'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5 mb-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-300">
                    {id === 'nd30' && <Scale className="w-3.5 h-3.5 text-teal-400" />}
                    {id === 'dang_05' && <BookOpen className="w-3.5 h-3.5 text-rose-400" />}
                    {id === 'education' && <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />}
                    {id === 'skkn' && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                    {id === 'compact' && <Layers className="w-3.5 h-3.5 text-cyan-400" />}
                    {!p.isBuiltIn && <BookmarkPlus className="w-3.5 h-3.5 text-emerald-400" />}
                    <span className="truncate" title={p.name}>{p.name}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {isSelected && <Check className="w-3.5 h-3.5 text-teal-400" />}
                    {!p.isBuiltIn && (
                      <button
                        onClick={(e) => handleDeleteCustomPreset(id, e)}
                        title="Xóa mẫu tùy chỉnh này"
                        className="p-0.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                  {p.description}
                </p>

                <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                  <span>Font: {p.config.fontFamily} {p.config.bodyFontSize}pt</span>
                  <span>•</span>
                  <span>Dòng: {p.config.lineSpacing}</span>
                  <span>•</span>
                  <span>Lề Trái: {p.config.margins.left}mm</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Toggle Advanced settings */}
        <div className="pt-1">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1.5 cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'Ẩn bảng tùy chỉnh chi tiết' : 'Mở rộng tùy chỉnh chi tiết thông số (Font, Cỡ chữ, Lề trang, Dãn dòng, Dấu câu...)'}</span>
            </button>

            {showAdvanced && (
              <button
                onClick={() => {
                  setNewPresetName(`Mẫu tùy chỉnh ${new Date().toLocaleTimeString('vi-VN')}`);
                  setIsCreatingPreset(true);
                }}
                className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                <BookmarkPlus className="w-3 h-3" />
                <span>Lưu thông số hiện tại thành Mẫu Mới</span>
              </button>
            )}
          </div>

          {showAdvanced && (
            <div className="mt-3 p-3.5 bg-slate-900 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Font chữ:</label>
                <select
                  value={config.fontFamily}
                  onChange={e => setConfig({ ...config, fontFamily: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs"
                >
                  <option value="Times New Roman">Times New Roman (Chuẩn NĐ30)</option>
                  <option value="Arial">Arial (Không chân)</option>
                  <option value="Calibri">Calibri</option>
                  <option value="Segoe UI">Segoe UI</option>
                  <option value="Georgia">Georgia</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Cỡ chữ nội dung (pt):</label>
                <select
                  value={config.bodyFontSize}
                  onChange={e => setConfig({ ...config, bodyFontSize: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs"
                >
                  <option value={11}>11 pt</option>
                  <option value={12}>12 pt</option>
                  <option value={13}>13 pt (Khuyên dùng trường học)</option>
                  <option value={14}>14 pt (Chuẩn NĐ 30/2020)</option>
                  <option value={15}>15 pt</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Khoảng cách dòng (Line):</label>
                <select
                  value={config.lineSpacing}
                  onChange={e => setConfig({ ...config, lineSpacing: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs"
                >
                  <option value={1.0}>1.0 line (Đơn)</option>
                  <option value={1.15}>1.15 lines (Gọn gàng)</option>
                  <option value={1.25}>1.25 lines (Giáo án)</option>
                  <option value={1.3}>1.3 lines (Chuẩn NĐ30)</option>
                  <option value={1.5}>1.5 lines (Đề tài SKKN)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Thụt đầu dòng (mm):</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.firstLineIndent}
                  onChange={e => setConfig({ ...config, firstLineIndent: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Lề Trên Top (mm):</label>
                <input
                  type="number"
                  value={config.margins.top}
                  onChange={e => setConfig({ ...config, margins: { ...config.margins, top: Number(e.target.value) } })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Lề Dưới Bottom (mm):</label>
                <input
                  type="number"
                  value={config.margins.bottom}
                  onChange={e => setConfig({ ...config, margins: { ...config.margins, bottom: Number(e.target.value) } })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Lề Trái Left (mm):</label>
                <input
                  type="number"
                  value={config.margins.left}
                  onChange={e => setConfig({ ...config, margins: { ...config.margins, left: Number(e.target.value) } })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Lề Phải Right (mm):</label>
                <input
                  type="number"
                  value={config.margins.right}
                  onChange={e => setConfig({ ...config, margins: { ...config.margins, right: Number(e.target.value) } })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs"
                />
              </div>

              <div className="col-span-2 sm:col-span-4 flex flex-wrap gap-4 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.cleanExtraSpaces}
                    onChange={e => setConfig({ ...config, cleanExtraSpaces: e.target.checked })}
                    className="accent-teal-500 rounded"
                  />
                  <span>Tự động xóa dấu cách thừa & sửa lỗi khoảng trắng trước dấu câu (.,:;!?)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.standardizeQuotes}
                    onChange={e => setConfig({ ...config, standardizeQuotes: e.target.checked })}
                    className="accent-teal-500 rounded"
                  />
                  <span>Chuẩn hóa dấu ngoặc kép thành dấu trích dẫn cong (“...”)</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control Actions & Summary */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="font-bold text-white">Tổng số tệp: {items.length} file</span>
            {items.some(i => i.status === 'success') && (
              <span className="px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-700 text-[10px] font-bold">
                Đã chuẩn hóa: {items.filter(i => i.status === 'success').length}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={() => setItems([])}
                className="px-3 py-1.5 bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-300 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              >
                Xóa tất cả
              </button>
            )}

            <button
              onClick={handleFormatAll}
              disabled={items.length === 0 || isProcessing}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                items.length > 0 && !isProcessing
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang Định Dạng...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Bắt Đầu Định Dạng ({items.length} File)</span>
                </>
              )}
            </button>

            {items.some(it => it.status === 'success') && (
              <button
                onClick={handleDownloadAllZip}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-700/60 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Tải Tất Cả (.ZIP)</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div className="px-3 py-1.5 bg-teal-950/40 border border-teal-800/40 rounded-lg text-teal-300 text-xs flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-teal-400 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Items List */}
        {items.length > 0 ? (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-[200px]">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <div className="overflow-hidden">
                    <div className="font-bold text-white truncate">{item.originalName}</div>
                    <div className="text-[11px] text-teal-400/80 truncate">Lưu thành: {item.newName}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.stats && (
                    <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                      <span>{item.stats.paragraphsCount} đoạn</span>
                      <span>•</span>
                      <span>{item.stats.wordsCount} từ</span>
                      <span>•</span>
                      <span className="text-teal-300 font-semibold">{item.stats.fixesApplied} lỗi đã sửa</span>
                    </div>
                  )}

                  {item.status === 'pending' && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      Sẵn sàng
                    </span>
                  )}
                  {item.status === 'formatting' && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-teal-950 text-teal-300 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Đang xử lý...
                    </span>
                  )}
                  {item.status === 'success' && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Đã chuẩn hóa
                    </span>
                  )}
                  {item.status === 'error' && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-rose-950 text-rose-300">
                      {item.errorMessage}
                    </span>
                  )}

                  {item.status === 'success' && item.formattedBlob && (
                    <button
                      onClick={() => handleDownloadSingle(item)}
                      className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Tải Docx</span>
                    </button>
                  )}

                  <button
                    onClick={() => setItems(prev => prev.filter(it => it.id !== item.id))}
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
            <FileText className="w-8 h-8 mx-auto mb-2 text-teal-400/50" />
            <p className="text-xs text-slate-400 font-medium">
              Bấm "+ Nạp Danh Sách File Word" để chọn hàng loạt tệp .docx cần chuẩn hóa phông chữ, cỡ chữ, căn lề và dấu câu tiếng Việt cùng lúc.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
