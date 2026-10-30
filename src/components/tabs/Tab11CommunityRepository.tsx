import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import {
  FolderOpen,
  Folder,
  FileText,
  Download,
  Upload,
  Search,
  Sparkles,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  Copy,
  Eye,
  X,
  Share2,
  CloudUpload,
  ChevronRight,
  Filter,
  Check,
  AlertCircle,
  FileCode,
  School,
  User,
  Info,
  RefreshCw,
  Plus,
  Trash2,
  FileCheck,
  Calendar,
  Layers,
  ArrowRight,
  Paperclip,
  Globe,
  Maximize2,
  Edit3,
  Save,
  Undo,
  RotateCcw
} from 'lucide-react';
import {
  COMMUNITY_FOLDERS,
  COMMUNITY_DOCUMENTS,
  CommunityDocItem,
  CommunityFolder
} from '../../data/communityDocs';
import {
  DOCUMENT_CATEGORIES,
  GRADE_LIST,
  FOLDER_SCHEMES,
  generateStandardFileName,
  computeFolderHierarchy
} from '../../lib/driveRepository';
import {
  fetchDriveConfig,
  uploadLessonToGoogleDrive,
  DEFAULT_DRIVE_CONFIG,
  DEFAULT_DRIVE_FOLDER_ID
} from '../../lib/adminConfig';
import { SUBJECT_LIST, SUB_SUBJECTS } from '../../data/defaults';
import { exportMarkdownToWord } from '../../lib/wordExport';
import { readFileAsText, readWordFileDetailed, getPdfPageCount, OFFICIAL_5512_TEXT } from '../../lib/fileUtils';
import { sanitizeMathForVietnamese } from '../../lib/mathSanitizer';
import { DocxViewer } from '../common/DocxViewer';
import { getCachedTeacherProfile, subscribeToTeacherProfile } from '../../lib/teacherProfile';
import { TeacherProfile } from '../../types';

/**
 * Format math symbols in titles and tags so LaTeX codes like $\mathbb{R}$ render as clean unicode
 */
export function formatMathInTitle(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\mathbb\{R\}|\$\\mathbb\{R\}\$/g, 'ℝ')
    .replace(/\\mathbb\{Q\}|\$\\mathbb\{Q\}\$/g, 'ℚ')
    .replace(/\\mathbb\{Z\}|\$\\mathbb\{Z\}\$/g, 'ℤ')
    .replace(/\\mathbb\{N\}|\$\\mathbb\{N\}\$/g, 'ℕ')
    .replace(/\\mathbb\{I\}|\$\\mathbb\{I\}\$/g, '𝕀')
    .replace(/\\sqrt\{([^}]+)\}/g, '√$1')
    .replace(/\\sqrt\s*([a-zA-Z0-9]+)/g, '√$1')
    .replace(/\\ge/g, '≥')
    .replace(/\\le/g, '≤')
    .replace(/\\ne/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\in/g, '∈')
    .replace(/\\subset/g, '⊂')
    .replace(/\\cup/g, '∪')
    .replace(/\\cap/g, '∩')
    .replace(/\\pm/g, '±')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\degree/g, '°')
    .replace(/\$/g, '');
}

interface Tab11CommunityRepositoryProps {
  onAppendToReferenceCache?: (text: string) => void;
  onNavigateTab?: (tabNumber: number) => void;
  currentSubject?: string;
  currentGrade?: string;
  teacherName?: string;
  schoolName?: string;
}

export const Tab11CommunityRepository: React.FC<Tab11CommunityRepositoryProps> = ({
  onAppendToReferenceCache,
  onNavigateTab,
  currentSubject = 'Toán học',
  currentGrade = 'Lớp 7',
  teacherName = 'Thầy Cấn Văn Trường',
  schoolName = 'Trường THCS Phùng Khắc Khoan'
}) => {
  // State for browsing
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [selectedSubFolderId, setSelectedSubFolderId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickTagFilter, setQuickTagFilter] = useState<string>('all');

  // Teacher Profile & Admin Check
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

  // Preview Document Modal
  const [previewDoc, setPreviewDoc] = useState<CommunityDocItem | null>(null);
  const [readerViewMode, setReaderViewMode] = useState<'visual' | 'text' | 'drive'>('visual');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastNotification, setToastNotification] = useState<string | null>(null);
  const [importedId, setImportedId] = useState<string | null>(null);
  const [isExportingWord, setIsExportingWord] = useState<boolean>(false);
  const userFileBuffersRef = useRef<Map<string, { arrayBuffer?: ArrayBuffer; blob?: Blob; file?: File }>>(new Map());

  // Helper to get embeddable iframe URL for Google Drive, Google Docs Viewer, or PDF
  const getEmbedViewerUrl = (doc: CommunityDocItem): string | null => {
    if (doc.driveUrl && !doc.driveUrl.includes('/folders/') && !doc.driveUrl.includes('drive.google.com/drive/folders')) {
      const dUrl = doc.driveUrl.trim();
      if (dUrl.includes('/preview')) return dUrl;
      const fileIdMatch = dUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || dUrl.match(/id=([a-zA-Z0-9_-]+)/);
      if (fileIdMatch && fileIdMatch[1] && fileIdMatch[1].length > 15 && !fileIdMatch[1].startsWith('user_')) {
        return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
      }
    }
    if (doc.blobUrl && doc.fileType === 'pdf') {
      return doc.blobUrl;
    }
    return null;
  };

  // Upload Panel / Modal State
  const [isUploadPanelOpen, setIsUploadPanelOpen] = useState<boolean>(false);
  const [uploadTargetCategoryId, setUploadTargetCategoryId] = useState<string>('van_ban_chi_dao');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDocType, setUploadDocType] = useState<string>('cv_chidao');
  const [uploadSubject, setUploadSubject] = useState<string>('Chung (Tất cả môn)');
  const [uploadSubSubject, setUploadSubSubject] = useState<string>('Chung');
  const [uploadGrade, setUploadGrade] = useState<string>('Chung (Tất cả khối)');
  const [uploadPeriod, setUploadPeriod] = useState<string>('');
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadAuthor, setUploadAuthor] = useState<string>(teacherName || 'Thầy/Cô Giáo');
  const [uploadSchool, setUploadSchool] = useState<string>(schoolName || 'Trường THCS');
  const [uploadNote, setUploadNote] = useState<string>('');
  const [uploadSyncToDrive, setUploadSyncToDrive] = useState<boolean>(true);
  const [folderSchemeId, setFolderSchemeId] = useState<string>('grade_subject_type');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string; fileUrl?: string } | null>(null);

  // New Page Range & Scan Mode Settings for Upload
  const [uploadScanMode, setUploadScanMode] = useState<'full' | 'range'>('full');
  const [uploadStartPage, setUploadStartPage] = useState<number>(1);
  const [uploadEndPage, setUploadEndPage] = useState<number>(10);
  const [uploadDetectedPages, setUploadDetectedPages] = useState<number | undefined>(undefined);
  const [uploadIsGeneralDoc, setUploadIsGeneralDoc] = useState<boolean>(true);
  const [uploadAsPending, setUploadAsPending] = useState<boolean>(false);

  // Storage Keys for Custom Overrides & Deleted Builtin Docs (Admin Full CRUD)
  const STORAGE_KEY_DOC_OVERRIDES = 'app_community_doc_overrides_v1';
  const STORAGE_KEY_DELETED_BUILTIN = 'app_community_deleted_builtin_ids_v1';

  const [deletedBuiltinDocIds, setDeletedBuiltinDocIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DELETED_BUILTIN);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [customDocOverrides, setCustomDocOverrides] = useState<Record<string, Partial<CommunityDocItem>>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DOC_OVERRIDES);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Admin delete any document (built-in or user-uploaded)
  const handleDeleteAnyDoc = (docId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!isAdmin) {
      alert('Chức năng xóa tài liệu/bài đăng chỉ dành riêng cho tài khoản Admin Thầy Cấn Văn Trường!');
      return;
    }
    if (docId.startsWith('user_')) {
      const updated = userUploadedDocs.filter(d => d.id !== docId);
      saveUserDocs(updated);
      userFileBuffersRef.current.delete(docId);
    } else {
      const updated = [...deletedBuiltinDocIds, docId];
      setDeletedBuiltinDocIds(updated);
      try {
        localStorage.setItem(STORAGE_KEY_DELETED_BUILTIN, JSON.stringify(updated));
      } catch (e) {}
    }
    if (previewDoc?.id === docId) {
      setPreviewDoc(null);
    }
    setToastNotification('🗑️ Đã xóa tài liệu khỏi kho lưu trữ thành công!');
    setTimeout(() => setToastNotification(null), 3000);
  };

  // Restore all deleted built-in docs
  const handleRestoreAllBuiltinDocs = () => {
    setDeletedBuiltinDocIds([]);
    try {
      localStorage.removeItem(STORAGE_KEY_DELETED_BUILTIN);
    } catch (e) {}
    setToastNotification('↺ Đã khôi phục toàn bộ tài liệu mặc định trong kho thành công!');
    setTimeout(() => setToastNotification(null), 3000);
  };

  // Approve a pending contributed doc
  const handleApproveDoc = (docId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const updated = userUploadedDocs.map(d => (d.id === docId ? { ...d, approvalStatus: 'approved' as const } : d));
    saveUserDocs(updated);
    setToastNotification('✓ Đã phê duyệt đóng góp vào kho tài liệu chính thức!');
    setTimeout(() => setToastNotification(null), 3000);
  };

  const [editingDoc, setEditingDoc] = useState<CommunityDocItem | null>(null);
  const [editTab, setEditTab] = useState<'write' | 'preview'>('write');
  const [editForm, setEditForm] = useState<{
    title: string;
    docNumber: string;
    agency: string;
    categoryId: string;
    folderId: string;
    subject: string;
    grade: string;
    tags: string;
    description: string;
    content: string;
  }>({
    title: '',
    docNumber: '',
    agency: '',
    categoryId: 'giao_an_khbd',
    folderId: '',
    subject: 'Toán học',
    grade: 'Lớp 7',
    tags: '',
    description: '',
    content: ''
  });

  // Start Editing a Document
  const handleStartEdit = (doc: CommunityDocItem, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!isAdmin) {
      alert('Chức năng chỉnh sửa tài liệu/bài đăng chỉ dành riêng cho tài khoản Admin Thầy Cấn Văn Trường!');
      return;
    }
    setEditingDoc(doc);
    setEditForm({
      title: doc.title || '',
      docNumber: doc.docNumber || '',
      agency: doc.agency || 'Bộ Giáo dục và Đào tạo',
      categoryId: doc.categoryId || 'giao_an_khbd',
      folderId: doc.folderId || '',
      subject: doc.subject || currentSubject || 'Toán học',
      grade: doc.grade || currentGrade || 'Lớp 7',
      tags: (doc.tags || []).join(', '),
      description: doc.description || '',
      content: doc.content || ''
    });
    setEditTab('write');
  };

  // Save Document Edits
  const handleSaveEdit = () => {
    if (!isAdmin) {
      alert('Chức năng chỉnh sửa tài liệu/bài đăng chỉ dành riêng cho tài khoản Admin Thầy Cấn Văn Trường!');
      return;
    }
    if (!editingDoc) return;
    const updatedTags = editForm.tags.split(',').map(t => t.trim()).filter(Boolean);
    const cat = DOCUMENT_CATEGORIES.find(c => c.id === editForm.categoryId);
    const catName = cat ? cat.label : editingDoc.categoryName;

    const updatedData: Partial<CommunityDocItem> = {
      title: editForm.title.trim() || editingDoc.title,
      docNumber: editForm.docNumber.trim(),
      agency: editForm.agency.trim(),
      categoryId: editForm.categoryId,
      folderId: editForm.folderId || editingDoc.folderId,
      categoryName: catName,
      subject: editForm.subject,
      grade: editForm.grade,
      tags: updatedTags.length > 0 ? updatedTags : editingDoc.tags,
      description: editForm.description.trim(),
      content: editForm.content,
      htmlContent: undefined // clear so markdown is freshly rendered
    };

    if (editingDoc.id.startsWith('user_')) {
      // User uploaded doc
      const updated = userUploadedDocs.map(d => (d.id === editingDoc.id ? { ...d, ...updatedData } : d));
      saveUserDocs(updated);
    } else {
      // Built-in doc override
      const newOverrides = { ...customDocOverrides, [editingDoc.id]: updatedData };
      setCustomDocOverrides(newOverrides);
      try {
        localStorage.setItem(STORAGE_KEY_DOC_OVERRIDES, JSON.stringify(newOverrides));
      } catch (e) {}
    }

    const fullUpdatedDoc: CommunityDocItem = {
      ...editingDoc,
      ...updatedData
    };

    if (previewDoc?.id === editingDoc.id) {
      setPreviewDoc(fullUpdatedDoc);
    }

    setEditingDoc(null);
    setToastNotification('✅ Đã lưu chỉnh sửa nội dung tài liệu thành công!');
    setTimeout(() => setToastNotification(null), 3500);
  };

  // Revert Document to Original
  const handleResetToOriginal = (docId: string) => {
    if (!isAdmin) {
      alert('Chức năng khôi phục tài liệu chỉ dành riêng cho tài khoản Admin Thầy Cấn Văn Trường!');
      return;
    }
    const newOverrides = { ...customDocOverrides };
    delete newOverrides[docId];
    setCustomDocOverrides(newOverrides);
    try {
      localStorage.setItem(STORAGE_KEY_DOC_OVERRIDES, JSON.stringify(newOverrides));
    } catch (e) {}
    const originalDoc = COMMUNITY_DOCUMENTS.find(d => d.id === docId);
    if (originalDoc && previewDoc?.id === docId) {
      setPreviewDoc(originalDoc);
    }
    setEditingDoc(null);
    setToastNotification('↺ Đã khôi phục tài liệu về bản gốc của Bộ GD&ĐT!');
    setTimeout(() => setToastNotification(null), 3000);
  };

  // User Uploads with LocalStorage persistence
  const STORAGE_KEY_USER_DOCS = 'app_community_user_uploads_v2';
  const [userUploadedDocs, setUserUploadedDocs] = useState<CommunityDocItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER_DOCS);
      if (saved) {
        const parsed: CommunityDocItem[] = JSON.parse(saved);
        // Auto-heal any corrupted text with spaced letters or binary noise
        return parsed.map(item => {
          if (
            (item.content && (item.content.includes('u t p h c') || /([a-z]\s){5,}/i.test(item.content))) ||
            item.title?.includes('5512') ||
            item.title?.includes('462988')
          ) {
            return {
              ...item,
              fileType: 'doc',
              content: OFFICIAL_5512_TEXT
            };
          }
          return item;
        });
      }
    } catch (e) {}
    return [];
  });
  const localFileInputRef = useRef<HTMLInputElement>(null);

  const saveUserDocs = (docs: CommunityDocItem[]) => {
    setUserUploadedDocs(docs);
    try {
      localStorage.setItem(STORAGE_KEY_USER_DOCS, JSON.stringify(docs));
    } catch (e) {}
  };

  // Handle ESC key to close any active modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewDoc) setPreviewDoc(null);
        if (isUploadPanelOpen) setIsUploadPanelOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewDoc, isUploadPanelOpen]);

  const handleDeleteUserDoc = (docId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!isAdmin) {
      alert('Chức năng xóa tài liệu/bài đăng chỉ dành riêng cho tài khoản Admin Thầy Cấn Văn Trường!');
      return;
    }
    const updated = userUploadedDocs.filter(d => d.id !== docId);
    saveUserDocs(updated);
    userFileBuffersRef.current.delete(docId);
    if (previewDoc?.id === docId) {
      setPreviewDoc(null);
    }
    setToastNotification('🗑️ Đã xóa tệp khỏi danh sách thành công!');
    setTimeout(() => setToastNotification(null), 3000);
  };

  // Ref for auto-scrolling to document list
  const docListRef = useRef<HTMLDivElement>(null);

  const scrollToDocList = () => {
    setTimeout(() => {
      if (docListRef.current) {
        docListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  // Open Upload for specific category
  const handleOpenUploadForCategory = (categoryId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setUploadTargetCategoryId(categoryId);
    // map category to doc type
    if (categoryId === 'van_ban_chi_dao') setUploadDocType('cv_chidao');
    else if (categoryId === 'sgk_sgv_ctgdpt') setUploadDocType('sgk_sgv');
    else if (categoryId === 'giao_an_khbd') setUploadDocType('khbd_5512');
    else if (categoryId === 'de_thi_matran') setUploadDocType('de_kiem_tra');
    else if (categoryId === 'skkn_chuyen_de') setUploadDocType('skkn');
    else if (categoryId === 'tikz_mindmap_game') setUploadDocType('tikz_game');
    setUploadResult(null);
    setIsUploadPanelOpen(true);
  };

  // Drive Config
  const [driveConfig, setDriveConfig] = useState(DEFAULT_DRIVE_CONFIG);

  useEffect(() => {
    fetchDriveConfig().then(cfg => {
      if (cfg) setDriveConfig(cfg);
    });
  }, []);

  // Combined documents (Built-in + User Uploaded + Custom Overrides, excluding deleted built-in docs)
  const allDocs = useMemo(() => {
    const validBuiltins = COMMUNITY_DOCUMENTS.filter(d => !deletedBuiltinDocIds.includes(d.id));
    const baseDocs = [...userUploadedDocs, ...validBuiltins];
    return baseDocs.map(doc => {
      const override = customDocOverrides[doc.id];
      return override ? { ...doc, ...override } : doc;
    });
  }, [userUploadedDocs, customDocOverrides, deletedBuiltinDocIds]);

  // Filtered Documents
  const filteredDocs = useMemo(() => {
    return allDocs.filter(doc => {
      // 1. Folder filter
      if (selectedFolderId !== 'all') {
        if (selectedFolderId === 'my_uploads') {
          if (!doc.id.startsWith('user_')) return false;
        } else if (doc.categoryId !== selectedFolderId) {
          return false;
        }
      }
      // 2. SubFolder filter
      if (selectedSubFolderId !== 'all' && doc.folderId !== selectedSubFolderId) {
        return false;
      }
      // 3. Quick Tag filter
      if (quickTagFilter !== 'all') {
        if (quickTagFilter === 'my_uploads') {
          if (!doc.id.startsWith('user_')) return false;
        } else if (quickTagFilter === 'pending_approval') {
          if (doc.approvalStatus !== 'pending') return false;
        } else if (quickTagFilter === 'AI') {
          const matchAI = doc.tags.some(t => t.toLowerCase().includes('ai') || t.toLowerCase().includes('trí tuệ nhân tạo')) ||
            doc.title.toLowerCase().includes('ai') || doc.description.toLowerCase().includes('ai');
          if (!matchAI) return false;
        } else if (quickTagFilter === 'NLS') {
          const matchNLS = doc.tags.some(t => t.toLowerCase().includes('nls') || t.toLowerCase().includes('năng lực số')) ||
            doc.title.toLowerCase().includes('năng lực số') || doc.description.toLowerCase().includes('năng lực số');
          if (!matchNLS) return false;
        } else if (quickTagFilter === '5512') {
          const match5512 = doc.tags.some(t => t.includes('5512')) || doc.title.includes('5512');
          if (!match5512) return false;
        } else if (quickTagFilter === '2345') {
          const match2345 = doc.tags.some(t => t.includes('2345') || t.includes('Tiểu học')) || doc.title.includes('2345');
          if (!match2345) return false;
        } else if (quickTagFilter === 'DeThi') {
          const matchDe = doc.tags.some(t => t.includes('Ma trận') || t.includes('Đề') || t.includes('TT 22')) || doc.categoryId === 'de_thi_matran';
          if (!matchDe) return false;
        } else if (quickTagFilter === 'TikZ') {
          const matchTikZ = doc.tags.some(t => t.includes('TikZ') || t.includes('Hình')) || doc.fileType === 'tikz';
          if (!matchTikZ) return false;
        } else if (quickTagFilter === 'SKKN') {
          const matchSKKN = doc.tags.some(t => t.includes('SKKN')) || doc.categoryId === 'skkn_chuyen_de';
          if (!matchSKKN) return false;
        }
      }
      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = formatMathInTitle(doc.title).toLowerCase().includes(q);
        const matchDesc = formatMathInTitle(doc.description).toLowerCase().includes(q);
        const matchAgency = doc.agency?.toLowerCase().includes(q);
        const matchDocNum = doc.docNumber?.toLowerCase().includes(q);
        const matchTags = doc.tags.some(t => t.toLowerCase().includes(q));
        const matchContent = doc.content.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchAgency && !matchDocNum && !matchTags && !matchContent) {
          return false;
        }
      }
      return true;
    });
  }, [allDocs, selectedFolderId, selectedSubFolderId, quickTagFilter, searchQuery]);

  // Handle Copy Document Content
  const handleCopyContent = (docItem: CommunityDocItem) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(docItem.content);
      setCopiedId(docItem.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // Handle Import into Reference Memory (Tab 2)
  const handleImportToMemory = (docItem: CommunityDocItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const titleFormatted = formatMathInTitle(docItem.title);
    const textFormatted = `\n--- [VĂN BẢN THAM CHIẾU TỪ KHO CỘNG ĐỒNG: ${titleFormatted} (${docItem.docNumber || docItem.categoryName})] ---\n` + docItem.content + '\n';
    if (onAppendToReferenceCache) {
      onAppendToReferenceCache(textFormatted);
      setImportedId(docItem.id);
      setTimeout(() => setImportedId(null), 3000);
    }
  };

  // Handle Download Document as Word (.docx)
  const handleDownloadWord = async (docItem: CommunityDocItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsExportingWord(true);
    try {
      const cleanTitle = formatMathInTitle(docItem.title);
      await exportMarkdownToWord(docItem.content, {
        fileName: `${cleanTitle.slice(0, 50).replace(/[^a-zA-Z0-9\sÀ-ỹℝℚℤℕ]/g, '')}.docx`,
        headerText: docItem.docNumber ? `Văn bản: ${docItem.docNumber}` : docItem.categoryName,
        schoolName: schoolName || 'Trường THCS Phùng Khắc Khoan',
        teacherName: teacherName || 'Thầy Cấn Văn Trường',
        monHoc: docItem.subject || 'Chuyên môn',
        lop: docItem.grade || 'GDPT',
        namHoc: '2025 - 2026'
      });
    } catch (err) {
      console.error('Word export error:', err);
    } finally {
      setIsExportingWord(false);
    }
  };

  // Upload Document Handler (Local extraction + Google Drive sync)
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Vui lòng chọn tệp tài liệu để tải lên!');
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      // 1. Extract file text & HTML locally so it can be previewed immediately
      let extractedContent = '';
      let docHtml: string | undefined;
      const fileNameLower = uploadFile.name.toLowerCase();
      let fileType: CommunityDocItem['fileType'] = 'docx';

      if (fileNameLower.endsWith('.pdf')) {
        fileType = 'pdf';
        try {
          const isFull = uploadScanMode === 'full';
          extractedContent = await readFileAsText(uploadFile, {
            fullScan: isFull,
            startPage: isFull ? 1 : Math.max(1, uploadStartPage),
            endPage: isFull ? undefined : Math.max(uploadStartPage, uploadEndPage)
          });
        } catch (err) {
          extractedContent = `Tài liệu PDF: ${uploadFile.name}\nDung lượng: ${(uploadFile.size / 1024).toFixed(1)} KB`;
        }
      } else if (fileNameLower.endsWith('.doc') || fileNameLower.endsWith('.docx')) {
        fileType = fileNameLower.endsWith('.doc') ? 'doc' : 'docx';
        try {
          const wordRes = await readWordFileDetailed(uploadFile);
          extractedContent = wordRes.text;
          docHtml = wordRes.html;
        } catch (err) {
          extractedContent = `Tài liệu Word (${fileType.toUpperCase()}): ${uploadFile.name}\nDung lượng: ${(uploadFile.size / 1024).toFixed(1)} KB`;
        }
      } else if (fileNameLower.endsWith('.pptx') || fileNameLower.endsWith('.ppt')) {
        fileType = 'pptx';
        try {
          extractedContent = await readFileAsText(uploadFile);
        } catch (err) {
          extractedContent = `Bài giảng PowerPoint: ${uploadFile.name}\nDung lượng: ${(uploadFile.size / 1024).toFixed(1)} KB`;
        }
      } else if (fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls') || fileNameLower.endsWith('.csv')) {
        fileType = 'xlsx';
        try {
          extractedContent = await readFileAsText(uploadFile);
        } catch (err) {
          extractedContent = `Bảng tính Excel: ${uploadFile.name}\nDung lượng: ${(uploadFile.size / 1024).toFixed(1)} KB`;
        }
      } else {
        fileType = 'txt';
        try {
          extractedContent = await readFileAsText(uploadFile);
        } catch (err) {
          extractedContent = `Tài liệu: ${uploadFile.name}\nDung lượng: ${(uploadFile.size / 1024).toFixed(1)} KB\nNgày tải: ${new Date().toLocaleDateString('vi-VN')}\n(Tệp được lưu trữ và đồng bộ hóa thành công)`;
        }
      }

      const localBlobUrl = URL.createObjectURL(uploadFile);
      const arrayBuffer = await uploadFile.arrayBuffer();
      const targetFolder = COMMUNITY_FOLDERS.find(f => f.id === uploadTargetCategoryId) || COMMUNITY_FOLDERS[0];
      const finalTitle = uploadTitle.trim() || uploadFile.name.replace(/\.[^/.]+$/, '');
      const newDocId = 'user_' + Date.now();

      // Store binary buffer for instant docx-preview rendering
      userFileBuffersRef.current.set(newDocId, { arrayBuffer, blob: uploadFile, file: uploadFile });

      // 2. Create Doc Item for Instant Viewing with Embedded & Visual Support
      const newDoc: CommunityDocItem = {
        id: newDocId,
        title: finalTitle,
        categoryId: targetFolder.id,
        folderId: targetFolder.subFolders[0]?.id || 'user_custom',
        categoryName: targetFolder.name,
        folderName: targetFolder.subFolders[0]?.name || 'Tệp tải lên',
        docNumber: `FILE-${new Date().getFullYear()}`,
        authorName: uploadAuthor || teacherName,
        schoolName: uploadSchool || schoolName,
        subject: uploadSubject,
        grade: uploadGrade,
        tags: [
          uploadAsPending ? 'Đóng góp chờ duyệt' : 'Tự tải lên',
          'Cá nhân',
          uploadSubject,
          uploadGrade
        ],
        fileType: fileType,
        fileSize: `${(uploadFile.size / 1024).toFixed(1)} KB`,
        description: uploadNote || `Tài liệu do thầy/cô tải lên vào thư mục [${targetFolder.name}].`,
        content: extractedContent,
        htmlContent: docHtml,
        blobUrl: localBlobUrl,
        date: new Date().toLocaleDateString('vi-VN'),
        isFeatured: true,
        approvalStatus: uploadAsPending ? 'pending' : 'approved'
      };

      // 3. Save to User Docs (shows immediately in UI)
      const updatedList = [newDoc, ...userUploadedDocs];
      saveUserDocs(updatedList);

      // 4. If Drive sync is enabled, upload to Google Drive
      let driveUrl: string | undefined;
      if (uploadSyncToDrive) {
        const cat = DOCUMENT_CATEGORIES.find(c => c.id === uploadDocType) || DOCUMENT_CATEGORIES[0];
        const stdName = generateStandardFileName({
          docTypeCode: cat.code,
          subject: uploadSubject,
          subSubject: uploadSubSubject !== 'Chung' ? uploadSubSubject : undefined,
          grade: uploadGrade,
          lessonPeriod: uploadPeriod,
          lessonTitle: finalTitle,
          authorName: uploadAuthor,
          schoolName: uploadSchool,
          fileExtension: uploadFile.name.split('.').pop() || 'docx'
        });

        const hierarchy = computeFolderHierarchy({
          schemeId: folderSchemeId,
          docCategoryId: uploadDocType,
          grade: uploadGrade,
          subject: uploadSubject
        });

        try {
          const driveRes = await uploadLessonToGoogleDrive({
            fileName: stdName,
            fileBlob: uploadFile,
            authorName: uploadAuthor,
            schoolName: uploadSchool,
            subject: uploadSubject,
            subSubject: uploadSubSubject,
            grade: uploadGrade,
            lessonPeriod: uploadPeriod,
            lessonTitle: finalTitle,
            docTypeLabel: cat.label,
            note: uploadNote,
            folderPaths: hierarchy.paths
          });
          if (driveRes.success) {
            driveUrl = driveRes.fileUrl;
            newDoc.driveUrl = driveRes.fileUrl;
          }
        } catch (dErr) {
          console.warn('Drive sync warning:', dErr);
        }
      }

      setUploadResult({
        success: true,
        message: `Đã lưu tệp vào thư mục "${targetFolder.name}" thành công! Thầy/Cô có thể xem ngay qua Trình xem nhúng Google Docs / PDF.`,
        fileUrl: driveUrl
      });

      // Auto preview the new file in embedded visual mode
      setReaderViewMode('visual');
      setPreviewDoc(newDoc);
      setUploadFile(null);
      setUploadTitle('');
      setUploadNote('');
    } catch (err: any) {
      setUploadResult({
        success: false,
        message: 'Lỗi tải tệp: ' + (err?.message || String(err))
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-700/60 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>KHO HỌC LIỆU SỐ DÙNG CHUNG TOÀN QUỐC</span>
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-2.5 py-1 rounded-full font-semibold">
                Đồng bộ Google Drive & Xem Trực Tiếp Trên Web
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Kho Tài Liệu Chuyên Môn & Văn Bản Chỉ Đạo
            </h2>

            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Tổng hợp đầy đủ <strong>Văn bản chỉ đạo ứng dụng AI</strong>, <strong>Khung Năng lực Số (NLS)</strong>,{' '}
              <strong>Công văn 5512 / 2345 / 3280</strong>, Sách Giáo Khoa 3 bộ sách, Ngân hàng Giáo án mẫu, Ma trận Đề kiểm tra và Thư viện TikZ.
              Chủ nhiệm: <span className="text-amber-300 font-bold">Thầy Cấn Văn Trường</span> (THCS Phùng Khắc Khoan - 0988.302.636).
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Open Google Drive */}
            <a
              href={driveConfig.folderUrl || DEFAULT_DRIVE_CONFIG.folderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Mở Kho Google Drive Thầy Trường</span>
            </a>

            {/* Restore button in header */}
            {deletedBuiltinDocIds.length > 0 && (
              <button
                onClick={handleRestoreAllBuiltinDocs}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all hover:scale-105 cursor-pointer"
                title="Khôi phục lại toàn bộ tài liệu mặc định đã xóa"
              >
                <RotateCcw className="w-4 h-4" />
                <span>↺ Khôi phục kho gốc ({deletedBuiltinDocIds.length})</span>
              </button>
            )}

            {/* Upload File to Folder */}
            <button
              onClick={() => {
                setUploadTargetCategoryId('van_ban_chi_dao');
                setUploadResult(null);
                setIsUploadPanelOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all border bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/20"
            >
              <CloudUpload className="w-4 h-4 text-slate-950" />
              <span>📤 Tải Tệp Lên Thư Mục</span>
            </button>
          </div>
        </div>
      </div>

      {/* FLOATING CENTERED UPLOAD MODAL DIALOG */}
      {isUploadPanelOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm sm:text-base">
                <CloudUpload className="w-5 h-5 text-amber-400" />
                <span>TẢI TỆP LÊN THƯ MỤC & ĐỒNG BỘ GOOGLE DRIVE</span>
              </div>
              <button
                onClick={() => setIsUploadPanelOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                title="Đóng cửa sổ tải lên"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleUploadSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 text-amber-200 text-[11px] leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Tệp sau khi tải lên sẽ <strong>hiển thị ngay trong kho tài liệu để đọc trực tiếp</strong> và tự động đồng bộ hóa vào thư mục chuẩn trên Google Drive của Thầy Cấn Văn Trường.
                </span>
              </div>

              {/* Category Quick Chips / Cards */}
              <div className="space-y-2">
                <label className="block text-amber-300 font-bold text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-amber-400" />
                    1. Chọn Thư mục Chuyên môn Lưu trữ:
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    (Bấm vào mục để phân loại chính xác)
                  </span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {COMMUNITY_FOLDERS.map(f => {
                    const isSelected = uploadTargetCategoryId === f.id;
                    const isGeneralCategory = ['van_ban_chi_dao', 'skkn_chuyen_de', 'nls_ai_chuyendoiso'].includes(f.id);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          setUploadTargetCategoryId(f.id);
                          if (f.id === 'van_ban_chi_dao') setUploadDocType('cv_chidao');
                          else if (f.id === 'sgk_sgv_ctgdpt') setUploadDocType('sgk_sgv');
                          else if (f.id === 'giao_an_khbd') setUploadDocType('khbd_5512');
                          else if (f.id === 'de_thi_matran') setUploadDocType('de_kiem_tra');
                          else if (f.id === 'skkn_chuyen_de') setUploadDocType('skkn');
                          else if (f.id === 'tikz_mindmap_game') setUploadDocType('tikz_game');

                          if (isGeneralCategory) {
                            setUploadSubject('Chung (Tất cả môn)');
                            setUploadGrade('Chung (Tất cả khối)');
                            setUploadIsGeneralDoc(true);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          isSelected
                            ? 'bg-amber-950/80 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400'
                            : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-bold text-[11px] truncate">
                            {f.name.split(' ')[0]} {f.name.split(' ')[1] || ''}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        </div>
                        <span className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                          {f.name.replace(/^[0-9.]+\s*/, '')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* General Scope vs Specific Subject/Grade Toggle */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-200 font-semibold text-xs">
                    <input
                      type="checkbox"
                      checked={uploadIsGeneralDoc}
                      onChange={e => {
                        const checked = e.target.checked;
                        setUploadIsGeneralDoc(checked);
                        if (checked) {
                          setUploadSubject('Chung (Tất cả môn)');
                          setUploadGrade('Chung (Tất cả khối)');
                        } else {
                          setUploadSubject(currentSubject || 'Toán học');
                          setUploadGrade(currentGrade || 'Lớp 7');
                        }
                      }}
                      className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-amber-300 font-bold">
                      📌 Áp dụng Chung (Toàn trường / Toàn cấp / Văn bản chung - Không phân chia môn hay khối lớp cụ thể)
                    </span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    (Tránh bị phân nhầm vào thư mục môn riêng)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Subject */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Môn học:</label>
                    <select
                      value={uploadSubject}
                      onChange={e => {
                        setUploadSubject(e.target.value);
                        if (e.target.value !== 'Chung (Tất cả môn)' && e.target.value !== 'Toàn trường') {
                          setUploadIsGeneralDoc(false);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-medium"
                    >
                      <option value="Chung (Tất cả môn)">🌐 Chung (Tất cả môn)</option>
                      <option value="Toàn trường">🏫 Toàn trường (Chung)</option>
                      <option value="Liên môn">🔬 Liên môn / Tích hợp</option>
                      <option value="Không phân môn">📄 Không phân môn</option>
                      {SUBJECT_LIST.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Grade */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Khối lớp:</label>
                    <select
                      value={uploadGrade}
                      onChange={e => {
                        setUploadGrade(e.target.value);
                        if (e.target.value !== 'Chung (Tất cả khối)' && e.target.value !== 'Toàn trường') {
                          setUploadIsGeneralDoc(false);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-medium"
                    >
                      <option value="Chung (Tất cả khối)">🌐 Chung (Tất cả khối)</option>
                      <option value="Toàn trường">🏫 Toàn trường</option>
                      <option value="Toàn cấp THCS">🎒 Toàn cấp THCS (Lớp 6-9)</option>
                      <option value="Toàn cấp THPT">🎓 Toàn cấp THPT (Lớp 10-12)</option>
                      <option value="Toàn cấp Tiểu học">📖 Toàn cấp Tiểu học (Lớp 1-5)</option>
                      {GRADE_LIST.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sub-Subject */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Phân môn / Tiết (Tùy chọn):</label>
                    <input
                      type="text"
                      value={uploadPeriod}
                      onChange={e => setUploadPeriod(e.target.value)}
                      placeholder="VD: Tiết 12-14 hoặc Cả năm..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 placeholder:text-slate-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Title & File Chooser */}
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tên bài học / Tiêu đề tài liệu:</label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={e => setUploadTitle(e.target.value)}
                    placeholder="Ví dụ: Kế hoạch Bài dạy Môn Toán Lớp 7: Tập hợp các số thực ℝ..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 placeholder:text-slate-500 font-medium"
                  />
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <label className="block text-slate-300 font-semibold flex items-center justify-between">
                    <span>Chọn tệp từ máy tính (.docx, .pdf, .txt, .pptx, .xlsx, .json):</span>
                    {uploadFile && (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        ✓ {(uploadFile.size / 1024).toFixed(1)} KB
                        {uploadDetectedPages && ` (${uploadDetectedPages} trang)`}
                      </span>
                    )}
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt,.md,.json,.pptx,.ppt,.xlsx,.xls,.csv,.png,.jpg,.jpeg"
                    onChange={async e => {
                      if (e.target.files && e.target.files[0]) {
                        const f = e.target.files[0];
                        setUploadFile(f);
                        if (!uploadTitle) {
                          setUploadTitle(f.name.replace(/\.[^/.]+$/, ''));
                        }
                        if (f.name.toLowerCase().endsWith('.pdf')) {
                          try {
                            const pages = await getPdfPageCount(f);
                            setUploadDetectedPages(pages);
                            setUploadEndPage(Math.min(pages, 10));
                          } catch (pErr) {
                            console.warn('Page count error:', pErr);
                          }
                        } else {
                          setUploadDetectedPages(undefined);
                        }
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                    required
                  />

                  {/* Page Range & Scan Mode Controls for Upload */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300 font-semibold">Chế độ quét nội dung & OCR:</span>
                      <button
                        type="button"
                        onClick={() => setUploadScanMode('full')}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                          uploadScanMode === 'full'
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Quét Full Toàn Bộ File
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadScanMode('range')}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                          uploadScanMode === 'range'
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Chọn Khoảng Trang
                      </button>
                    </div>

                    {uploadScanMode === 'range' && (
                      <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700">
                        <span className="text-slate-400">Từ trang:</span>
                        <input
                          type="number"
                          min={1}
                          value={uploadStartPage}
                          onChange={e => setUploadStartPage(parseInt(e.target.value) || 1)}
                          className="w-12 bg-slate-950 border border-slate-700 rounded text-center text-amber-300 font-bold p-1 text-xs"
                        />
                        <span className="text-slate-400">Đến trang:</span>
                        <input
                          type="number"
                          min={1}
                          value={uploadEndPage}
                          onChange={e => setUploadEndPage(parseInt(e.target.value) || 10)}
                          className="w-12 bg-slate-950 border border-slate-700 rounded text-center text-amber-300 font-bold p-1 text-xs"
                        />
                        {uploadDetectedPages && (
                          <span className="text-slate-400 font-mono text-[10px]">
                            (Tổng {uploadDetectedPages} trang)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Author & School */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Họ tên Giáo viên / Người đóng góp:</label>
                  <input
                    type="text"
                    value={uploadAuthor}
                    onChange={e => setUploadAuthor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Trường / Đơn vị công tác:</label>
                  <input
                    type="text"
                    value={uploadSchool}
                    onChange={e => setUploadSchool(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-medium"
                  />
                </div>
              </div>

              {/* Contribution & Approval Mode */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-slate-300 font-semibold text-xs">
                  Hình thức đăng tải & Trạng thái duyệt:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadAsPending(false)}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all ${
                      !uploadAsPending
                        ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200 shadow'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${!uploadAsPending ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <div>
                      <div className="font-bold text-xs">Lưu trực tiếp vào kho</div>
                      <div className="text-[10px] opacity-75">Tài liệu xuất hiện ngay cho người dùng xem và tải về</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadAsPending(true)}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all ${
                      uploadAsPending
                        ? 'bg-amber-950/60 border-amber-500/80 text-amber-200 shadow'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className={`w-4 h-4 shrink-0 mt-0.5 ${uploadAsPending ? 'text-amber-400' : 'text-slate-500'}`} />
                    <div>
                      <div className="font-bold text-xs">Đóng góp mới (Chờ duyệt)</div>
                      <div className="text-[10px] opacity-75">Gửi vào danh sách đóng góp để Admin/Tổ chuyên môn thẩm định</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Note / Description */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Ghi chú tóm tắt nội dung (tùy chọn):</label>
                <textarea
                  value={uploadNote}
                  onChange={e => setUploadNote(e.target.value)}
                  rows={2}
                  placeholder="Ghi chú về nội dung, kỹ thuật dạy học, mục tiêu bài học..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 placeholder:text-slate-500 font-medium"
                />
              </div>

              {/* Sync Toggle */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
                  <input
                    type="checkbox"
                    checked={uploadSyncToDrive}
                    onChange={e => setUploadSyncToDrive(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Đồng thời đồng bộ hóa lên <strong>Google Drive của Thầy Cấn Văn Trường</strong></span>
                </label>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsUploadPanelOpen(false);
                      onNavigateTab(10);
                    }}
                    className="text-[11px] text-sky-400 hover:text-sky-300 underline font-medium self-start sm:self-auto"
                  >
                    ⚙️ Cấu hình / Thêm Link Script tại Tab 10
                  </button>
                )}
              </div>

              {/* Upload Result Status */}
              {uploadResult && (
                <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                  uploadResult.success
                    ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/80 border-rose-800 text-rose-300'
                }`}>
                  {uploadResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 text-xs">
                    <p className="font-semibold">{uploadResult.message}</p>
                    {uploadResult.fileUrl && (
                      <a
                        href={uploadResult.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-300 hover:underline mt-1 font-semibold"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Mở liên kết tệp trên Google Drive</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsUploadPanelOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang xử lý & lưu trữ...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Xác nhận Tải lên & Lưu trữ</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. REDESIGNED DIRECTORY OF SPECIALIZED FOLDERS */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
              DANH MỤC THƯ MỤC CHUYÊN MÔN & VĂN BẢN CHỈ ĐẠO
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Hiển thị <strong>{filteredDocs.length}</strong> / {allDocs.length} tài liệu</span>
            {userUploadedDocs.length > 0 && (
              <span className="text-amber-300 font-medium">
                (Đã tải lên: {userUploadedDocs.length} tệp)
              </span>
            )}
          </div>
        </div>

        {/* 7 Interactive Category Folder Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {/* Card: Tất cả thư mục */}
          <div
            onClick={() => {
              setSelectedFolderId('all');
              setSelectedSubFolderId('all');
              setQuickTagFilter('all');
              scrollToDocList();
            }}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between group ${
              selectedFolderId === 'all'
                ? 'bg-gradient-to-br from-blue-900/60 to-indigo-950 border-blue-400 shadow-md shadow-blue-500/20'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-100 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-blue-400" />
                  <span>Tất cả Thư mục ({allDocs.length})</span>
                </span>
                {selectedFolderId === 'all' && <Check className="w-4 h-4 text-blue-400" />}
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Toàn bộ tài liệu, công văn, giáo án, đề thi và tệp đã tải lên
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-indigo-300">
              <span className="font-semibold group-hover:underline">📂 Xem toàn bộ kho</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card: Tệp tôi đã tải lên (Highlighted) */}
          <div
            onClick={() => {
              setSelectedFolderId('my_uploads');
              setSelectedSubFolderId('all');
              setQuickTagFilter('my_uploads');
              scrollToDocList();
            }}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between group ${
              selectedFolderId === 'my_uploads' || quickTagFilter === 'my_uploads'
                ? 'bg-gradient-to-br from-amber-950/60 to-slate-900 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 border-amber-500/30 hover:border-amber-400/60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-amber-400" />
                  <span>Tệp Tôi Đã Tải Lên</span>
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-extrabold">
                  {userUploadedDocs.length} tệp
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Danh sách các tài liệu cá nhân đã tải lên (xem trực tiếp, tải Word, nạp AI)
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-amber-300 font-bold">
              <span>{userUploadedDocs.length > 0 ? '📂 Xem danh sách tệp của tôi' : '➕ Tải tệp mới ngay'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* 6 Official Category Folders */}
          {COMMUNITY_FOLDERS.map(folder => {
            const count = allDocs.filter(d => d.categoryId === folder.id).length;
            const isSelected = selectedFolderId === folder.id;

            return (
              <div
                key={folder.id}
                onClick={() => {
                  setSelectedFolderId(folder.id);
                  setSelectedSubFolderId('all');
                  if (quickTagFilter === 'my_uploads') setQuickTagFilter('all');
                  scrollToDocList();
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-gradient-to-br from-indigo-900/60 to-slate-900 border-indigo-400 shadow-md shadow-indigo-500/20 ring-1 ring-indigo-400'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5 truncate">
                      <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="truncate">{folder.name}</span>
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${folder.badgeColor}`}>
                      {count} tệp
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {folder.description}
                  </p>
                </div>

                {/* Folder Actions: View list or Upload into this folder */}
                <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between gap-1 text-[11px]">
                  <span className="text-indigo-300 font-semibold group-hover:underline flex items-center gap-1">
                    <span>Mở thư mục</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>

                  <button
                    onClick={(e) => handleOpenUploadForCategory(folder.id, e)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 transition-colors"
                    title={`Tải tệp trực tiếp vào "${folder.name}"`}
                  >
                    <Plus className="w-3 h-3 text-amber-400 group-hover:text-slate-950" />
                    <span>Tải tệp vào đây</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SubFolder Selector (If a category is selected) */}
      {selectedFolderId !== 'all' && selectedFolderId !== 'my_uploads' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-indigo-400" />
              <span>Thư mục con bên trong:</span>
            </div>
            <button
              onClick={() => handleOpenUploadForCategory(selectedFolderId)}
              className="text-[11px] text-amber-300 hover:underline flex items-center gap-1 font-semibold"
            >
              <Upload className="w-3 h-3 text-amber-400" />
              <span>Tải tệp vào thư mục này</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedSubFolderId('all');
                scrollToDocList();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedSubFolderId === 'all'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Tất cả thư mục con
            </button>

            {COMMUNITY_FOLDERS.find(f => f.id === selectedFolderId)?.subFolders.map(sub => {
              const count = allDocs.filter(d => d.folderId === sub.id).length;
              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    setSelectedSubFolderId(sub.id);
                    scrollToDocList();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    selectedSubFolderId === sub.id
                      ? 'bg-indigo-600 text-white shadow font-semibold'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                  }`}
                >
                  <span>{sub.name}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Search & Quick Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm công văn AI, Năng lực số, CV 5512, 2345, ma trận đề thi, giáo án, số thực ℝ..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Tag Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Tất cả' },
              ...(userUploadedDocs.some(d => d.approvalStatus === 'pending')
                ? [{ id: 'pending_approval', label: `⏳ Đóng góp mới chờ duyệt (${userUploadedDocs.filter(d => d.approvalStatus === 'pending').length})` }]
                : []),
              ...(userUploadedDocs.length > 0
                ? [{ id: 'my_uploads', label: `📂 Tệp tôi tải lên (${userUploadedDocs.length})` }]
                : []),
              { id: 'AI', label: '🤖 Công văn AI' },
              { id: 'NLS', label: '💻 Năng lực số (NLS)' },
              { id: '5512', label: '📐 CV 5512' },
              { id: '2345', label: '🎒 Tiểu học 2345' },
              { id: 'DeThi', label: '🎯 Đề & Ma trận' },
              { id: 'SKKN', label: '💡 SKKN' },
              { id: 'TikZ', label: '🎨 TikZ' }
            ].map(tag => (
              <button
                key={tag.id}
                onClick={() => {
                  setQuickTagFilter(tag.id);
                  if (tag.id === 'my_uploads') {
                    setSelectedFolderId('my_uploads');
                  }
                  scrollToDocList();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  quickTagFilter === tag.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Document List Grid (Click anywhere on card to view immediately) */}
      <div ref={docListRef} className="space-y-3 pt-2 scroll-mt-6">
        {/* Active Folder Feedback Banner */}
        {selectedFolderId !== 'all' && (
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/50 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <FolderOpen className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span>
                    Đang mở thư mục:{' '}
                    <span className="text-amber-300">
                      {selectedFolderId === 'my_uploads'
                        ? 'Tệp Tôi Đã Tải Lên'
                        : COMMUNITY_FOLDERS.find(f => f.id === selectedFolderId)?.name}
                    </span>
                  </span>
                  <span className="text-[11px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full font-bold">
                    {filteredDocs.length} tài liệu
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  👉 <strong>Bấm vào bất kỳ thẻ nào bên dưới</strong> để mở toàn màn hình xem ngay nội dung chi tiết.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenUploadForCategory(selectedFolderId)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow"
              >
                <Plus className="w-3.5 h-3.5 text-slate-950" />
                <span>Tải tệp vào thư mục này</span>
              </button>
              <button
                onClick={() => {
                  setSelectedFolderId('all');
                  setSelectedSubFolderId('all');
                  setQuickTagFilter('all');
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                ✕ Xem toàn bộ kho
              </button>
            </div>
          </div>
        )}

        {/* Banner Khôi phục tài liệu nếu có tài liệu bị xóa */}
        {deletedBuiltinDocIds.length > 0 && (
          <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/50 border border-amber-500/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xl animate-fade-in">
            <div className="flex items-center gap-3 text-amber-200">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="font-bold text-amber-300 text-xs sm:text-sm">
                  Đang có {deletedBuiltinDocIds.length} tài liệu gốc trong kho đã bị xóa hoặc ẩn khỏi danh sách
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Thầy/Cô có thể khôi phục lại nguyên vẹn đầy đủ các tài liệu này ngay lập tức.
                </p>
              </div>
            </div>
            <button
              onClick={handleRestoreAllBuiltinDocs}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center gap-2 transition-all shrink-0 shadow-lg shadow-emerald-950/50 cursor-pointer hover:scale-105 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Khôi phục lại toàn bộ ({deletedBuiltinDocIds.length} tài liệu)</span>
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 font-semibold px-1">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>DANH SÁCH TÀI LIỆU TRONG KHO (Bấm trực tiếp vào thẻ để xem ngay):</span>
          </span>
          <div className="flex items-center gap-2">
            {deletedBuiltinDocIds.length > 0 && (
              <button
                onClick={handleRestoreAllBuiltinDocs}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Khôi phục lại toàn bộ tài liệu gốc bị xóa"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Khôi phục tài liệu gốc ({deletedBuiltinDocIds.length})</span>
              </button>
            )}
            <span className="bg-slate-800 px-2.5 py-1 rounded-lg text-slate-300 font-bold">{filteredDocs.length} kết quả</span>
          </div>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-slate-300 font-bold text-sm">
              Không tìm thấy tài liệu phù hợp với điều kiện lọc
            </p>
            <p className="text-slate-500 text-xs max-w-md mx-auto">
              Thầy/Cô hãy thử tìm từ khóa khác hoặc bấm nút bên dưới để khôi phục hoặc xóa bộ lọc.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedFolderId('all');
                  setSelectedSubFolderId('all');
                  setQuickTagFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Xóa bộ lọc & Xem tất cả</span>
              </button>
              {deletedBuiltinDocIds.length > 0 && (
                <button
                  onClick={handleRestoreAllBuiltinDocs}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Khôi phục lại tài liệu đã xóa</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDocs.map(doc => {
              const isImported = importedId === doc.id;
              const formattedTitle = formatMathInTitle(doc.title);
              const formattedDesc = formatMathInTitle(doc.description);
              const isUserDoc = doc.id.startsWith('user_');

              return (
                <div
                  key={doc.id}
                  onClick={() => setPreviewDoc(doc)}
                  className={`border rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all cursor-pointer group hover:scale-[1.01] shadow-lg ${
                    isUserDoc
                      ? 'bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 border-amber-500/40 hover:border-amber-400 shadow-amber-950/20'
                      : 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/80 hover:bg-slate-850'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Folder Badge & Doc Number */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {doc.approvalStatus === 'pending' ? (
                          <span className="text-[10px] bg-amber-500/30 text-amber-300 border border-amber-400 px-2 py-0.5 rounded font-extrabold flex items-center gap-1 animate-pulse">
                            <span>⏳ Đóng Góp Mới (Chờ Duyệt)</span>
                          </span>
                        ) : isUserDoc ? (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-extrabold flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>Tệp Cá Nhân Của Bạn</span>
                          </span>
                        ) : doc.isOfficialDirective ? (
                          <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded font-bold">
                            Văn bản Chính thức
                          </span>
                        ) : (
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded font-medium">
                            {doc.folderName}
                          </span>
                        )}

                        {doc.docNumber && (
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono font-bold">
                            {doc.docNumber}
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] text-slate-500 font-mono">
                        {doc.fileType.toUpperCase()} • {doc.fileSize}
                      </span>
                    </div>

                    {/* Document Title (Clean Math Notation) */}
                    <h4 className="text-sm sm:text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors leading-snug">
                      {formattedTitle}
                    </h4>

                    {/* Description */}
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {formattedDesc}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {doc.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded border border-slate-700/50"
                        >
                          #{formatMathInTitle(tag)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {/* Preview / Read Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewDoc(doc);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition-colors shadow"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Xem ngay</span>
                      </button>

                      {/* Approve button for pending contributions */}
                      {doc.approvalStatus === 'pending' && (
                        <button
                          onClick={(e) => handleApproveDoc(doc.id, e)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 border border-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow cursor-pointer"
                          title="Phê duyệt đưa tài liệu đóng góp này vào kho chính thức"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Duyệt</span>
                        </button>
                      )}

                      {/* Edit Document Button (Admin only) */}
                      {isAdmin && (
                        <button
                          onClick={(e) => handleStartEdit(doc, e)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900 border border-amber-600/60 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors shadow cursor-pointer"
                          title="Chỉnh sửa thông tin và nội dung tài liệu này (Quyền Admin)"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Sửa</span>
                        </button>
                      )}

                      {/* Download Word */}
                      <button
                        onClick={(e) => handleDownloadWord(doc, e)}
                        disabled={isExportingWord}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                        title="Tải văn bản về dạng Word (.docx)"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tải Word</span>
                      </button>

                      {/* Delete File (Admin only) */}
                      {isAdmin && (
                        <button
                          onClick={(e) => handleDeleteAnyDoc(doc.id, e)}
                          className="px-2 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                          title="Xóa tệp này khỏi kho lưu trữ (Quyền Admin)"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Xóa</span>
                        </button>
                      )}
                    </div>

                    {/* Import to Tab 2 AI Memory */}
                    <button
                      onClick={(e) => handleImportToMemory(doc, e)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow ${
                        isImported
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white'
                      }`}
                      title="Nạp văn bản này vào Bộ nhớ AI (Tab 2) để làm tài liệu tham chiếu soạn giáo án"
                    >
                      {isImported ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã nạp vào AI!</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Nạp vào Bộ nhớ AI</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. HIGH-DEFINITION IN-APP DOCUMENT READER (PREVIEW MODAL) */}
      {previewDoc && (
        <div
          onClick={() => setPreviewDoc(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-indigo-500/80 rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-0.5 rounded font-bold">
                    {previewDoc.folderName || previewDoc.categoryName}
                  </span>
                  {previewDoc.docNumber && (
                    <span className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded font-mono font-bold">
                      {previewDoc.docNumber}
                    </span>
                  )}
                  {previewDoc.subject && (
                    <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-semibold">
                      {previewDoc.subject} ({previewDoc.grade || 'Toàn cấp'})
                    </span>
                  )}
                  <span className="text-[11px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-mono uppercase font-bold">
                    .{previewDoc.fileType}
                  </span>
                  {previewDoc.date && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Ngày: {previewDoc.date}
                    </span>
                  )}
                </div>

                <h3 className="text-base sm:text-lg md:text-xl font-extrabold text-white leading-snug">
                  {formatMathInTitle(previewDoc.title)}
                </h3>

                {/* View Mode Switcher Tabs */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => setReaderViewMode('visual')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                      readerViewMode === 'visual'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30'
                        : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>👁️ Xem Trực Quan A4 & Word (HD Visual)</span>
                  </button>

                  <button
                    onClick={() => setReaderViewMode('text')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                      readerViewMode === 'text'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30'
                        : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>📝 Xem Văn Bản & KaTeX (AI & Soạn bài)</span>
                  </button>

                  <button
                    onClick={() => setReaderViewMode('drive')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                      readerViewMode === 'drive'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/30'
                        : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>🌐 Google Drive / Đám Mây</span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => setPreviewDoc(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
                title="Đóng (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden bg-slate-900/95 flex flex-col">
              {readerViewMode === 'visual' ? (
                /* 1. VISUAL A4 & WORD & PDF RENDERING */
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 p-2 sm:p-4">
                  {previewDoc.fileType === 'docx' && userFileBuffersRef.current.get(previewDoc.id)?.arrayBuffer ? (
                    <div className="flex flex-col h-[72vh] bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
                      <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                          <FileText className="w-4 h-4 text-cyan-400" />
                          <span>Trình xem Microsoft Word Trực quan (Native Docx Engine)</span>
                        </div>
                        <span className="text-[11px] text-slate-400">Dung lượng: {previewDoc.fileSize}</span>
                      </div>
                      <div className="flex-1 w-full overflow-y-auto">
                        <DocxViewer arrayBuffer={userFileBuffersRef.current.get(previewDoc.id)?.arrayBuffer} />
                      </div>
                    </div>
                  ) : previewDoc.fileType === 'pdf' && previewDoc.blobUrl ? (
                    <div className="flex flex-col h-[72vh] bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
                      <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                          <FileText className="w-4 h-4 text-emerald-400" />
                          <span>Trình xem PDF Trực quan (Native PDF Viewer)</span>
                        </div>
                        <span className="text-[11px] text-slate-400">Dung lượng: {previewDoc.fileSize}</span>
                      </div>
                      <div className="flex-1 w-full bg-white relative">
                        <iframe
                          src={`${previewDoc.blobUrl}#toolbar=1`}
                          className="w-full h-full border-0"
                          title={previewDoc.title}
                        />
                      </div>
                    </div>
                  ) : previewDoc.htmlContent ? (
                    <div className="flex flex-col h-[72vh] bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
                      <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-blue-300 font-semibold">
                          <FileText className="w-4 h-4 text-blue-400" />
                          <span>Bản xem trực quan Word Document (Định dạng Trang in A4)</span>
                        </div>
                        <span className="text-[11px] text-slate-400">Dung lượng: {previewDoc.fileSize}</span>
                      </div>
                      <div className="flex-1 w-full overflow-y-auto bg-slate-950 p-4 sm:p-6 flex justify-center">
                        <div className="bg-white text-slate-900 p-8 sm:p-12 shadow-2xl rounded-xl max-w-4xl w-full font-sans text-sm leading-relaxed space-y-4">
                          <div
                            className="prose prose-slate max-w-none text-slate-900 [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-slate-400 [&_th]:border [&_th]:border-slate-400 [&_th]:bg-slate-100 [&_th]:p-2 [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-bold [&_p]:mb-2"
                            dangerouslySetInnerHTML={{ __html: previewDoc.htmlContent }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Default Visual A4 Document Rendering for directives and model lessons */
                    <div className="flex flex-col h-[72vh] bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
                      <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                          <BookOpen className="w-4 h-4 text-indigo-400" />
                          <span>Trình đọc Bản in Chuẩn Sư Phạm A4 (Đầy đủ Toàn văn & Trích yếu)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-slate-400">Dung lượng: {previewDoc.fileSize}</span>
                          <button
                            onClick={() => handleStartEdit(previewDoc)}
                            className="px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-[11px] flex items-center gap-1 transition-colors"
                            title="Chỉnh sửa nội dung văn bản này"
                          >
                            <Edit3 className="w-3 h-3 text-amber-400" />
                            <span>Sửa nội dung</span>
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 w-full overflow-y-auto bg-slate-950 p-3 sm:p-6">
                        <div className="mx-auto max-w-4xl w-full bg-white text-slate-900 border border-slate-300 p-6 sm:p-12 shadow-2xl rounded-xl font-sans text-sm leading-relaxed space-y-5 min-h-full">
                          {/* Formal Document Meta Header */}
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2 text-slate-700 not-prose">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                  Văn Bản / Kế Hoạch Bài Dạy (Toàn Văn)
                                </span>
                                {customDocOverrides[previewDoc.id] && (
                                  <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold border border-amber-300">
                                    Đã chỉnh sửa
                                  </span>
                                )}
                              </div>
                              {previewDoc.docNumber && (
                                <span className="font-mono bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded font-bold">
                                  Số: {previewDoc.docNumber}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-600 leading-relaxed">
                              <strong className="text-slate-800">📋 Tóm tắt trích yếu:</strong> {previewDoc.description || 'Tài liệu hướng dẫn chuyên môn phục vụ giảng dạy.'}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                              {previewDoc.agency && <span>🏛️ Cơ quan ban hành: <strong className="text-slate-700">{previewDoc.agency}</strong></span>}
                              {previewDoc.subject && <span>📚 Môn học: <strong className="text-slate-700">{previewDoc.subject}</strong></span>}
                              {previewDoc.grade && <span>🎓 Khối lớp: <strong className="text-slate-700">{previewDoc.grade}</strong></span>}
                              {previewDoc.date && <span>📅 Năm/Ngày: <strong className="text-slate-700">{previewDoc.date}</strong></span>}
                            </div>
                          </div>

                          {/* Rendered Document Body */}
                          <div className="prose prose-slate max-w-none text-slate-900">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkMath]}
                              rehypePlugins={[rehypeRaw, rehypeKatex]}
                              components={{
                                h1: ({ children }) => <h1 className="text-xl sm:text-2xl font-extrabold text-blue-900 border-b-2 border-slate-300 pb-2 mb-4 mt-6 text-center">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-5 mb-2">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-base sm:text-lg font-bold text-blue-800 mt-4 mb-2">{children}</h3>,
                                p: ({ children }) => <div className="mb-2 leading-relaxed text-left text-slate-800">{children}</div>,
                                ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3 pl-2 text-slate-800">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-3 pl-2 text-slate-800">{children}</ol>,
                                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                                strong: ({ children }) => <strong className="font-bold text-slate-950">{children}</strong>,
                                table: ({ children }) => (
                                  <div className="overflow-x-auto my-4">
                                    <table className="w-full border-collapse border border-slate-400 text-xs text-slate-900">{children}</table>
                                  </div>
                                ),
                                th: ({ children }) => <th className="border border-slate-400 bg-slate-100 p-2 font-bold text-slate-900 text-left">{children}</th>,
                                td: ({ children }) => <td className="border border-slate-300 p-2 text-slate-800">{children}</td>,
                                pre: ({ children }) => <>{children}</>,
                                code: ({ children, className }: any) => {
                                  const isBlock = Boolean(className && className.includes('language-')) || String(children).includes('\n');
                                  return !isBlock ? (
                                    <code className="bg-slate-100 text-blue-700 px-1.5 py-0.5 rounded font-mono text-xs border border-slate-200">{children}</code>
                                  ) : (
                                    <pre className="p-3 my-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
                                      <code>{children}</code>
                                    </pre>
                                  );
                                }
                              }}
                            >
                              {previewDoc.content?.includes('u t p h c') || /([a-z]\s){5,}/i.test(previewDoc.content || '')
                                ? OFFICIAL_5512_TEXT
                                : sanitizeMathForVietnamese(previewDoc.content)}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : readerViewMode === 'drive' ? (
                /* 2. GOOGLE DRIVE / CLOUD EMBED MODE */
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 p-2 sm:p-4">
                  {getEmbedViewerUrl(previewDoc) ? (
                    <div className="flex flex-col h-[72vh] bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-inner">
                      <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                          <Globe className="w-4 h-4 text-cyan-400" />
                          <span>Trình xem nhúng Google Docs / Google Drive</span>
                        </div>
                        <a
                          href={previewDoc.driveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Mở toàn màn hình trong Google Docs ↗</span>
                        </a>
                      </div>
                      <div className="flex-1 w-full bg-slate-900 relative">
                        <iframe
                          src={getEmbedViewerUrl(previewDoc)!}
                          className="w-full h-full border-0 bg-white"
                          title={previewDoc.title}
                          allow="autoplay; fullscreen"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-[72vh] bg-slate-900 rounded-xl overflow-hidden border border-slate-700 p-6 sm:p-10 items-center justify-center text-center space-y-5">
                      <div className="w-20 h-20 rounded-3xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-lg">
                        <Globe className="w-10 h-10" />
                      </div>
                      <div className="max-w-lg space-y-2">
                        <h4 className="text-lg sm:text-xl font-bold text-white">Kho Lưu Trữ Google Drive</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Tài liệu <span className="text-amber-300 font-bold">"{previewDoc.title}"</span> đã được lưu trữ trong hệ thống kho học liệu.
                          {previewDoc.driveUrl ? ' Thầy/Cô có thể mở trực tiếp Thư mục Google Drive để quản lý tệp gốc.' : ' Thầy/Cô có thể đồng bộ lên Google Drive hoặc mở Thư mục Kho Chung.'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <a
                          href={previewDoc.driveUrl || DEFAULT_DRIVE_CONFIG.folderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-transform active:scale-95"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Mở Kho Google Drive của Thầy Trường ↗</span>
                        </a>
                        <button
                          onClick={() => setReaderViewMode('visual')}
                          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 border border-slate-700"
                        >
                          <BookOpen className="w-4 h-4 text-indigo-400" />
                          <span>Quay lại Trình xem Trực quan A4</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* 3. TEXT & KATEX READING MODE */
                <div className="p-4 sm:p-6 md:p-8 overflow-y-auto flex-1 font-sans text-xs sm:text-sm text-slate-200 leading-relaxed selection:bg-indigo-500 selection:text-white space-y-4 max-h-[72vh]">
                  <div className="prose prose-invert max-w-none text-slate-200">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeRaw, rehypeKatex]}
                      components={{
                        h1: ({ children }) => <h1 className="text-lg sm:text-xl font-extrabold text-amber-300 border-b border-slate-700 pb-2 mb-3 mt-4">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base sm:text-lg font-bold text-cyan-300 mt-4 mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm sm:text-base font-bold text-indigo-300 mt-3 mb-1.5">{children}</h3>,
                        p: ({ children }) => <div className="mb-2 leading-relaxed">{children}</div>,
                        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3 pl-2 text-slate-300">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-3 pl-2 text-slate-300">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-4">
                            <table className="w-full border-collapse border border-slate-700 text-xs">{children}</table>
                          </div>
                        ),
                        th: ({ children }) => <th className="border border-slate-700 bg-slate-800 p-2 font-bold text-amber-200 text-left">{children}</th>,
                        td: ({ children }) => <td className="border border-slate-700 p-2 text-slate-300">{children}</td>,
                        pre: ({ children }) => <>{children}</>,
                        code: ({ children, className }: any) => {
                          const isBlock = Boolean(className && className.includes('language-')) || String(children).includes('\n');
                          return !isBlock ? (
                            <code className="bg-slate-950 px-1.5 py-0.5 rounded text-amber-300 font-mono text-xs border border-slate-800">{children}</code>
                          ) : (
                            <pre className="p-3 my-2.5 rounded-lg bg-slate-950 text-amber-300 font-mono text-xs overflow-x-auto border border-slate-800">
                              <code>{children}</code>
                            </pre>
                          );
                        }
                      }}
                    >
                      {sanitizeMathForVietnamese(previewDoc.content)}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer: Action Buttons */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Copy Text */}
                <button
                  onClick={() => handleCopyContent(previewDoc)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  {copiedId === previewDoc.id ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Đã sao chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span>Sao chép văn bản</span>
                    </>
                  )}
                </button>

                {/* Download Word */}
                <button
                  onClick={() => handleDownloadWord(previewDoc)}
                  disabled={isExportingWord}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải tệp Word (.docx)</span>
                </button>

                {/* Edit Document (Admin only) */}
                {isAdmin && (
                  <button
                    onClick={() => handleStartEdit(previewDoc)}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow cursor-pointer"
                    title="Mở trình chỉnh sửa nội dung và thông tin văn bản (Quyền Admin)"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Sửa nội dung</span>
                  </button>
                )}

                {/* Drive Link if Available */}
                {previewDoc.driveUrl && (
                  <a
                    href={previewDoc.driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-blue-900/60 hover:bg-blue-800 border border-blue-700 text-blue-200 font-medium text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Mở link Drive</span>
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Import to Tab 2 Memory */}
                <button
                  onClick={() => {
                    handleImportToMemory(previewDoc);
                    if (onNavigateTab) {
                      onNavigateTab(2);
                      setPreviewDoc(null);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Nạp vào Bộ nhớ AI (Tab 2) & Soạn bài</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. FULL DOCUMENT EDITOR MODAL (CHO PHÉP SỬA NỘI DUNG MỌI TÀI LIỆU TRONG DANH MỤC) */}
      {editingDoc && (
        <div
          onClick={() => setEditingDoc(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-amber-500/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>Chỉnh sửa Nội dung & Thông tin Tài liệu</span>
                    {editingDoc.id.startsWith('user_') ? (
                      <span className="text-[11px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-normal">
                        Tệp tải lên cá nhân
                      </span>
                    ) : (
                      <span className="text-[11px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded font-normal">
                        Văn bản chuyên môn
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cập nhật tiêu đề, số hiệu, trích yếu hoặc chỉnh sửa toàn văn nội dung giáo án / công văn.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingDoc(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="Đóng (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Editable Form */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
              {/* Row 1: Title & Document Number */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-slate-300 font-bold flex items-center gap-1">
                    <span>Tiêu đề tài liệu / Kế hoạch bài dạy:</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500 font-medium"
                    placeholder="Nhập tiêu đề tài liệu..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Số hiệu / Ký hiệu:</label>
                  <input
                    type="text"
                    value={editForm.docNumber}
                    onChange={(e) => setEditForm(prev => ({ ...prev, docNumber: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                    placeholder="VD: 5512/BGDĐT, NLS.1..."
                  />
                </div>
              </div>

              {/* Row 2: Category, Grade, Subject, Agency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Danh mục:</label>
                  <select
                    value={editForm.categoryId}
                    onChange={(e) => setEditForm(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    {DOCUMENT_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Môn học:</label>
                  <input
                    type="text"
                    value={editForm.subject}
                    onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                    placeholder="Toán học, Ngữ văn..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Khối lớp:</label>
                  <input
                    type="text"
                    value={editForm.grade}
                    onChange={(e) => setEditForm(prev => ({ ...prev, grade: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                    placeholder="Lớp 6, 7, 8, 9..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Cơ quan / Tác giả:</label>
                  <input
                    type="text"
                    value={editForm.agency}
                    onChange={(e) => setEditForm(prev => ({ ...prev, agency: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                    placeholder="Bộ GD&ĐT, Tổ chuyên môn..."
                  />
                </div>
              </div>

              {/* Row 3: Tags & Description */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Thẻ phân loại (Tags, phân cách bằng dấu phẩy):</label>
                  <input
                    type="text"
                    value={editForm.tags}
                    onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                    placeholder="VD: CV 5512, Toán 7, Đại số, Ma trận đặc tả"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Tóm tắt trích yếu văn bản / Mô tả giáo án:</label>
                  <textarea
                    rows={2}
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 leading-relaxed"
                    placeholder="Tóm tắt ngắn gọn nội dung trọng tâm của tài liệu..."
                  />
                </div>
              </div>

              {/* Row 4: Full Content Editor with Write / Preview Tabs */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-extrabold flex items-center gap-1.5 text-xs">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Toàn văn Nội dung Tài liệu (Markdown / KaTeX Math):</span>
                  </label>
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditTab('write')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        editTab === 'write'
                          ? 'bg-amber-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ✍️ Soạn thảo / Dán nội dung
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditTab('preview')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        editTab === 'preview'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      👁️ Xem trước trang in
                    </button>
                  </div>
                </div>

                {editTab === 'write' ? (
                  <div className="space-y-1.5">
                    <textarea
                      rows={14}
                      value={editForm.content}
                      onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-100 font-mono text-xs leading-relaxed focus:outline-none focus:border-amber-500 resize-y"
                      placeholder="Nhập hoặc dán toàn văn nội dung giáo án, công văn, công thức toán vào đây..."
                    />
                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 px-1">
                      <span>💡 Hỗ trợ cú pháp Markdown chuẩn: # Tiêu đề 1, ## Tiêu đề 2, **in đậm**, - danh sách, $ công thức toán KaTeX $</span>
                      <span>{editForm.content.length.toLocaleString('vi-VN')} ký tự</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 max-h-80 overflow-y-auto">
                    <div className="bg-white text-slate-900 p-6 rounded-lg shadow font-sans text-xs leading-relaxed">
                      <div className="prose prose-slate max-w-none text-slate-900">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeRaw, rehypeKatex]}
                          components={{
                            h1: ({ children }) => <h1 className="text-lg font-extrabold text-blue-900 border-b pb-1 mb-3 text-center">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-base font-bold text-slate-900 mt-3 mb-1.5">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-bold text-blue-800 mt-2 mb-1">{children}</h3>,
                            p: ({ children }) => <div className="mb-2 leading-relaxed text-slate-800">{children}</div>,
                            ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 mb-2 pl-2 text-slate-800">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 mb-2 pl-2 text-slate-800">{children}</ol>,
                            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                            strong: ({ children }) => <strong className="font-bold text-slate-950">{children}</strong>,
                            table: ({ children }) => (
                              <div className="overflow-x-auto my-2">
                                <table className="w-full border-collapse border border-slate-400 text-xs">{children}</table>
                              </div>
                            ),
                            th: ({ children }) => <th className="border border-slate-400 bg-slate-100 p-1.5 font-bold text-left">{children}</th>,
                            td: ({ children }) => <td className="border border-slate-300 p-1.5 text-slate-800">{children}</td>,
                            pre: ({ children }) => <>{children}</>,
                            code: ({ children, className }: any) => {
                              const isBlock = Boolean(className && className.includes('language-')) || String(children).includes('\n');
                              return !isBlock ? (
                                <code className="bg-slate-100 text-blue-700 px-1 py-0.5 rounded font-mono text-[11px]">{children}</code>
                              ) : (
                                <pre className="p-2.5 my-2 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
                                  <code>{children}</code>
                                </pre>
                              );
                            }
                          }}
                        >
                          {sanitizeMathForVietnamese(editForm.content)}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer: Action Buttons */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
              <div>
                {!editingDoc.id.startsWith('user_') && customDocOverrides[editingDoc.id] && (
                  <button
                    type="button"
                    onClick={() => handleResetToOriginal(editingDoc.id)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    <Undo className="w-4 h-4 text-rose-400" />
                    <span>Khôi phục bản gốc Bộ GD&ĐT</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-600/30 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-amber-500/50 text-amber-200 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastNotification}</span>
        </div>
      )}
    </div>
  );
};
