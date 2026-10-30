import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CloudUpload,
  FolderOpen,
  ExternalLink,
  CheckCircle2,
  FileText,
  Upload,
  AlertTriangle,
  Sparkles,
  Info,
  Check,
  Copy,
  Layers,
  BookOpen,
  User,
  School,
  FileCheck,
  RefreshCw,
  X
} from 'lucide-react';
import {
  DOCUMENT_CATEGORIES,
  GRADE_LIST,
  FOLDER_SCHEMES,
  generateStandardFileName,
  computeFolderHierarchy,
  getSchoolLevel,
  DocCategoryInfo
} from '../lib/driveRepository';
import { SUBJECT_LIST, SUB_SUBJECTS } from '../data/defaults';
import {
  fetchDriveConfig,
  uploadLessonToGoogleDrive,
  DEFAULT_DRIVE_CONFIG,
  DEFAULT_DRIVE_FOLDER_ID
} from '../lib/adminConfig';

interface CommunityDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSubject?: string;
  initialGrade?: string;
  initialTeacherName?: string;
  initialSchoolName?: string;
  initialLessonTitle?: string;
}

export const CommunityDriveModal: React.FC<CommunityDriveModalProps> = ({
  isOpen,
  onClose,
  initialSubject = 'Toán học',
  initialGrade = 'Lớp 7',
  initialTeacherName = '',
  initialSchoolName = '',
  initialLessonTitle = ''
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [docCategoryId, setDocCategoryId] = useState<string>('khbd_5512');
  const [subject, setSubject] = useState<string>(initialSubject || 'Toán học');
  const [subSubject, setSubSubject] = useState<string>('Chung');
  const [grade, setGrade] = useState<string>(initialGrade || 'Lớp 7');
  const [lessonPeriod, setLessonPeriod] = useState<string>('');
  const [lessonTitle, setLessonTitle] = useState<string>(initialLessonTitle || '');
  const [authorName, setAuthorName] = useState<string>(initialTeacherName || 'Thầy/Cô Giáo');
  const [schoolName, setSchoolName] = useState<string>(initialSchoolName || 'Trường THCS');
  const [note, setNote] = useState<string>('');
  const [folderSchemeId, setFolderSchemeId] = useState<string>('grade_subject_type');
  const [customFileName, setCustomFileName] = useState<string>('');
  const [isCustomNameEdited, setIsCustomNameEdited] = useState<boolean>(false);
  const [isConfirmedQuality, setIsConfirmedQuality] = useState<boolean>(true);

  // Status state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    fileUrl?: string;
    folderUrl?: string;
  } | null>(null);

  const [driveConfig, setDriveConfig] = useState(DEFAULT_DRIVE_CONFIG);
  const [copiedName, setCopiedName] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDriveConfig().then(cfg => {
      if (cfg) setDriveConfig(cfg);
    });
  }, []);

  // Update sub-subject list when subject changes
  const availableSubSubjects = useMemo(() => {
    return SUB_SUBJECTS[subject] || ['Chung'];
  }, [subject]);

  useEffect(() => {
    if (!availableSubSubjects.includes(subSubject)) {
      setSubSubject(availableSubSubjects[0] || 'Chung');
    }
  }, [subject, availableSubSubjects, subSubject]);

  const selectedCategory: DocCategoryInfo = useMemo(() => {
    return DOCUMENT_CATEGORIES.find(c => c.id === docCategoryId) || DOCUMENT_CATEGORIES[0];
  }, [docCategoryId]);

  // Compute standard file extension
  const fileExt = useMemo(() => {
    if (!file) return '.docx';
    const parts = file.name.split('.');
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : '.docx';
  }, [file]);

  // Compute auto standard file name
  const autoStandardName = useMemo(() => {
    return generateStandardFileName({
      docTypeCode: selectedCategory.code,
      subject,
      subSubject: subSubject !== 'Chung' ? subSubject : undefined,
      grade,
      lessonPeriod,
      lessonTitle: lessonTitle || (file ? file.name.replace(/\.[^/.]+$/, '') : 'TaiLieu'),
      authorName,
      schoolName,
      fileExtension: fileExt
    });
  }, [selectedCategory, subject, subSubject, grade, lessonPeriod, lessonTitle, authorName, schoolName, fileExt, file]);

  const activeFileName = isCustomNameEdited && customFileName.trim() ? customFileName.trim() : autoStandardName;

  // Compute target folder hierarchy
  const folderHierarchy = useMemo(() => {
    return computeFolderHierarchy({
      schemeId: folderSchemeId,
      docCategoryId,
      grade,
      subject
    });
  }, [folderSchemeId, docCategoryId, grade, subject]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!lessonTitle) {
        setLessonTitle(selected.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      }
      setIsCustomNameEdited(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      setFile(dropped);
      if (!lessonTitle) {
        setLessonTitle(dropped.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      }
      setIsCustomNameEdited(false);
    }
  };

  const handleCopyFileName = () => {
    navigator.clipboard.writeText(activeFileName);
    setCopiedName(true);
    setTimeout(() => setCopiedName(false), 2000);
  };

  const handleResetForm = () => {
    setFile(null);
    setUploadResult(null);
    setIsUploading(false);
    setIsCustomNameEdited(false);
    setCustomFileName('');
  };

  const handleUploadToDrive = async () => {
    if (!file) {
      alert('Vui lòng chọn hoặc kéo thả file Word (.docx, .doc) hoặc PDF đã hoàn chỉnh từ máy tính!');
      return;
    }

    if (!authorName.trim()) {
      alert('Vui lòng nhập Họ tên giáo viên soạn bài!');
      return;
    }

    if (!lessonTitle.trim()) {
      alert('Vui lòng nhập Tên bài học / Tiêu đề tài liệu!');
      return;
    }

    if (!isConfirmedQuality) {
      alert('Vui lòng tích xác nhận tài liệu đã được rà soát chuẩn định dạng trước khi tải lên.');
      return;
    }

    setIsUploading(true);
    try {
      const res = await uploadLessonToGoogleDrive({
        fileName: activeFileName,
        fileBlob: file,
        authorName: authorName.trim(),
        schoolName: schoolName.trim(),
        subject,
        subSubject: subSubject !== 'Chung' ? subSubject : undefined,
        grade,
        lessonPeriod: lessonPeriod.trim(),
        lessonTitle: lessonTitle.trim(),
        docTypeLabel: selectedCategory.label,
        note: note.trim(),
        folderPaths: folderHierarchy.paths,
        webhookUrl: driveConfig.webhookUrl
      });

      setUploadResult(res);
    } catch (err: any) {
      alert('Lỗi tải lên Google Drive: ' + (err?.message || err));
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-sky-600/50 rounded-2xl max-w-3xl w-full text-slate-100 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/20">
              <CloudUpload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>ĐÓNG GÓP TÀI LIỆU HOÀN CHỈNH LÊN KHO GOOGLE DRIVE</span>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[11px] border border-sky-500/30">
                  Dùng chung GDPT 2018
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Chủ nhiệm kho tài nguyên: <strong className="text-amber-400">Thầy Cấn Văn Trường</strong> — THCS Phùng Khắc Khoan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {uploadResult ? (
            /* Upload Result View */
            <div className="py-8 px-4 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-emerald-300">
                  Tải Lên Kho Drive Thành Công!
                </h3>
                <p className="text-xs text-slate-300 max-w-lg mx-auto">
                  {uploadResult.message}
                </p>
              </div>

              {/* Uploaded File Info Card */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-left max-w-xl mx-auto space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Tệp đã lưu:</span>
                  <span className="font-mono text-cyan-300 font-bold truncate max-w-xs">{activeFileName}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Thư mục lưu trữ:</span>
                  <span className="text-slate-200 font-medium">{folderHierarchy.breadcrumbs}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Người đóng góp:</span>
                  <span className="text-amber-300 font-semibold">{authorName} ({schoolName})</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                <a
                  href={uploadResult.folderUrl || uploadResult.fileUrl || driveConfig.folderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20"
                >
                  <FolderOpen className="w-4 h-4" />
                  Mở Thư Mục Trên Google Drive
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={handleResetForm}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  Đóng Góp Thêm Tài Liệu Khác
                </button>

                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Đóng Cửa Sổ
                </button>
              </div>
            </div>
          ) : (
            /* Upload Form */
            <>
              {/* Important Quality Note */}
              <div className="p-3.5 bg-sky-950/40 border border-sky-800/40 rounded-xl text-sky-200 text-xs flex items-start gap-2.5 leading-relaxed">
                <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-sky-300">Quy tắc chuẩn hóa kho tài nguyên:</strong> Quý Thầy/Cô vui lòng tải tài liệu <strong>đã được rà soát, chỉnh sửa hoàn chỉnh (Word .docx, .doc, PDF)</strong> từ máy tính. Hệ thống sẽ tự động đổi tên theo cú pháp chuẩn và xếp vào đúng thư mục tương ứng trên Google Drive để đồng nghiệp toàn quốc dễ dàng tìm kiếm.
                </div>
              </div>

              {/* 1. FILE UPLOAD DROPZONE */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
                  <span>1. Chọn file tài liệu hoàn chỉnh từ máy tính (.docx, .doc, .pdf, .pptx): <span className="text-rose-400">*</span></span>
                  {file && (
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã chọn file ({Math.round(file.size / 1024)} KB)
                    </span>
                  )}
                </label>

                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    file
                      ? 'border-emerald-500/60 bg-emerald-950/20'
                      : 'border-slate-700 hover:border-sky-500 bg-slate-950/50 hover:bg-slate-950'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,.doc,.pdf,.pptx"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-emerald-300 truncate max-w-md">{file.name}</p>
                        <p className="text-[11px] text-slate-400">
                          Kích thước: {(file.size / 1024).toFixed(1)} KB — Bấm để chọn file khác
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">
                          Nhấn vào đây để chọn file Word (.docx, .doc) hoặc PDF từ máy tính
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Hoặc kéo và thả tệp trực tiếp vào khung này
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. DOCUMENT CLASSIFICATION */}
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" /> 2. Thông Tin Phân Loại Tài Liệu
                </h3>

                {/* Document Type Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Loại tài liệu: <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={docCategoryId}
                    onChange={e => setDocCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 font-medium focus:border-sky-500 focus:outline-none cursor-pointer"
                  >
                    {DOCUMENT_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1 italic">
                    ℹ️ {selectedCategory.description}
                  </p>
                </div>

                {/* Grade, Subject, Sub-Subject Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Khối Lớp: <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={grade}
                      onChange={e => setGrade(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 font-medium focus:border-sky-500 focus:outline-none cursor-pointer"
                    >
                      {GRADE_LIST.map(g => (
                        <option key={g} value={g}>
                          {g} ({getSchoolLevel(g).label})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Môn học: <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 font-medium focus:border-sky-500 focus:outline-none cursor-pointer"
                    >
                      {SUBJECT_LIST.map(s => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Phân môn (nếu có):
                    </label>
                    <select
                      value={subSubject}
                      onChange={e => setSubSubject(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 font-medium focus:border-sky-500 focus:outline-none cursor-pointer"
                    >
                      {availableSubSubjects.map(sub => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Lesson Title & Periods */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tên bài học / Tiêu đề tài liệu: <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={lessonTitle}
                      onChange={e => {
                        setLessonTitle(e.target.value);
                        setIsCustomNameEdited(false);
                      }}
                      placeholder="VD: Bài 15. Góc ở vị trí đặc biệt (hoặc Đề thi giữa kỳ 1)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 font-medium focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tiết PPCT / Số tiết:
                    </label>
                    <input
                      type="text"
                      value={lessonPeriod}
                      onChange={e => {
                        setLessonPeriod(e.target.value);
                        setIsCustomNameEdited(false);
                      }}
                      placeholder="VD: Tiết 28-29 hoặc 2 tiết"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 font-medium focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Teacher Name & School */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Họ và tên Giáo viên soạn: <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={e => {
                        setAuthorName(e.target.value);
                        setIsCustomNameEdited(false);
                      }}
                      placeholder="VD: Cô Nguyễn Thị Mai"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 font-medium focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Trường / Đơn vị công tác / Tỉnh thành:
                    </label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={e => {
                        setSchoolName(e.target.value);
                        setIsCustomNameEdited(false);
                      }}
                      placeholder="VD: THCS Phùng Khắc Khoan - Hà Nội"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 font-medium focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ghi chú / Tóm tắt nội dung tài liệu (tùy chọn):
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="VD: Kèm ma trận đặc tả, hướng dẫn chấm chi tiết và thang điểm..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 font-medium focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 3. STANDARDIZED FILE NAME PREVIEW */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-sky-400" />
                    Tên file chuẩn hóa tự động lưu trên Google Drive:
                  </span>
                  <div className="flex items-center gap-2">
                    {isCustomNameEdited && (
                      <button
                        onClick={() => {
                          setIsCustomNameEdited(false);
                          setCustomFileName('');
                        }}
                        className="text-[11px] text-amber-400 hover:underline"
                      >
                        Khôi phục tên chuẩn
                      </button>
                    )}
                    <button
                      onClick={handleCopyFileName}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800"
                    >
                      {copiedName ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedName ? 'Đã chép' : 'Sao chép'}
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={activeFileName}
                  onChange={e => {
                    setCustomFileName(e.target.value);
                    setIsCustomNameEdited(true);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-mono text-xs text-cyan-300 font-semibold focus:border-sky-500 focus:outline-none"
                />
              </div>

              {/* 4. FOLDER DESTINATION HIERARCHY */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    Cấu trúc cây thư mục lưu trữ trên Google Drive:
                  </span>
                  <select
                    value={folderSchemeId}
                    onChange={e => setFolderSchemeId(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
                  >
                    {FOLDER_SCHEMES.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-nowrap">
                  {folderHierarchy.breadcrumbs}
                </div>
              </div>

              {/* Quality Checkbox Confirmation */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  id="confirm-quality"
                  type="checkbox"
                  checked={isConfirmedQuality}
                  onChange={e => setIsConfirmedQuality(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-sky-600 focus:ring-sky-500 focus:ring-offset-slate-900 cursor-pointer"
                />
                <label htmlFor="confirm-quality" className="text-xs text-slate-300 cursor-pointer select-none leading-relaxed">
                  Tôi xác nhận tài liệu này <strong>đã được chỉnh sửa, định dạng hoàn chỉnh (Word/PDF)</strong> và đồng ý chia sẻ vào Kho Google Drive dùng chung của Thầy Cấn Văn Trường.
                </label>
              </div>
            </>
          )}
        </div>

        {/* Footer Bar */}
        {!uploadResult && (
          <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <a
              href={driveConfig.folderUrl || `https://drive.google.com/drive/folders/${DEFAULT_DRIVE_FOLDER_ID}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1.5 font-semibold"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Xem Thư mục Drive Kho Chung</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
              >
                Hủy bỏ
              </button>

              <button
                onClick={handleUploadToDrive}
                disabled={isUploading || !file}
                className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all ${
                  isUploading || !file
                    ? 'bg-slate-700 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 shadow-sky-500/20'
                }`}
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-sky-200" />
                    Đang tải lên đúng thư mục Drive...
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-4 h-4 text-sky-200" />
                    🚀 TẢI LÊN KHO DRIVE CỘNG ĐỒNG
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
