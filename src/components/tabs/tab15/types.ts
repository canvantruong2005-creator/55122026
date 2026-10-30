export interface FormatIssue {
  id: string;
  category: 'tieu_de_quoc_hieu' | 'co_quan' | 'so_ky_hieu' | 'dia_danh' | 'trich_yeu' | 'can_cu' | 'noi_dung' | 'nguoi_ky' | 'noi_nhan' | 'viet_hoa' | 'khac';
  title: string;
  ruleReference: string;
  currentText: string;
  suggestion: string;
  severity: 'error' | 'warning' | 'info';
}

export interface FormatAnalysisReport {
  score: number;
  documentType: string;
  authoritySystem: 'dang' | 'nha_nuoc' | 'giao_duc' | 'khac';
  summary: string;
  issues: FormatIssue[];
  fixedDocument: string;
}

export interface ReferenceSampleDoc {
  id: string;
  fileName: string;
  fileType: 'docx' | 'pdf' | 'txt';
  fileSize: number;
  totalPages?: number;
  scannedRange: {
    mode: 'all' | 'custom';
    startPage: number;
    endPage: number;
  };
  extractedText: string;
  createdAt: number;
  isActive: boolean; // whether to include in AI prompts
}

export interface CustomDocMeta {
  authority: 'dang' | 'giao_duc' | 'nha_nuoc' | 'doanh_nghiep' | 'tuy_chinh';
  docType: string; // e.g. Quyết định, Tờ trình, Quy chế, Bản cam kết...
  isCustomDocType: boolean;
  parentOrg: string; // Cơ quan cấp trên
  orgName: string; // Cơ quan ban hành
  docNumber: string; // Số và ký hiệu (VD: 15-QĐ/ĐU hoặc 45/QĐ-THCS)
  location: string; // Địa danh (VD: Hà Nội, Đan Phượng...)
  docDate: string; // Ngày tháng năm
  subject: string; // Trích yếu nội dung
  legalBases: string; // Căn cứ pháp lý
  mainContent: string; // Yêu cầu nội dung chi tiết & các điều khoản
  signerTitle: string; // Chức vụ người ký
  signerName: string; // Họ tên người ký (không học hàm học vị)
  signType: string; // Quyền hạn ký (T/M, KT, TL, TUQ, CHỦ TỊCH, HIỆU TRƯỞNG...)
  recipients: string; // Nơi nhận
}

export interface BatchRenameItem {
  id: string;
  file: File;
  originalName: string;
  extractedMeta?: {
    docNumber?: string;
    docType?: string;
    subject?: string;
    date?: string;
    org?: string;
  };
  newName: string;
  status: 'pending' | 'analyzing' | 'ready' | 'error';
  errorMessage?: string;
}

export interface BatchWordFormatItem {
  id: string;
  file: File;
  originalName: string;
  newName?: string;
  status: 'pending' | 'formatting' | 'success' | 'error';
  errorMessage?: string;
  stats?: {
    paragraphsCount: number;
    wordsCount: number;
    fixesApplied: number;
  };
  formattedBlob?: Blob;
  previewSample?: string;
}

export interface CustomWordPreset {
  id: string;
  name: string;
  description: string;
  isBuiltIn?: boolean;
  config: WordFormatConfig;
}

export interface WordFormatConfig {
  preset: string; // 'nd30' | 'dang_05' | 'education' | 'custom' | string
  fontFamily: string; // 'Times New Roman' | 'Arial'
  bodyFontSize: number; // 13 | 14 | 12
  headingFontSize: number; // 14 | 15 | 16
  lineSpacing: number; // 1.2 | 1.3 | 1.5
  spaceAfter: number; // pt (3-6)
  spaceBefore: number; // pt (0-2)
  firstLineIndent: number; // mm (10-12.7)
  alignment: 'justify' | 'left';
  margins: {
    top: number; // mm (20)
    bottom: number; // mm (20)
    left: number; // mm (30)
    right: number; // mm (15)
  };
  cleanExtraSpaces: boolean;
  fixVietnamesePunctuation: boolean;
  autoCapitalizeHeadings: boolean;
  standardizeQuotes: boolean;
}

export interface FolderRenameItem {
  id: string;
  oldName: string;
  newName: string;
  itemType?: 'folder' | 'file';
  file?: File;
  status: 'pending' | 'ready' | 'renamed' | 'error';
  handle?: any; // FileSystemDirectoryHandle if using File System Access API
  errorMessage?: string;
  aiExplanation?: string;
}

export interface FolderRenameRule {
  mode: 'prefix_suffix' | 'replace' | 'numbering' | 'slug' | 'custom_template' | 'remove_special' | 'ai_prompt';
  prefix: string;
  suffix: string;
  findText: string;
  replaceText: string;
  startNumber: number;
  numberDigits: number; // 2 -> 01, 02; 3 -> 001, 002
  numberSeparator: string; // '_', '-', ' '
  template: string; // e.g. "{num}_{name}_{date}"
  caseTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize' | 'remove_accents';
  aiPrompt?: string;
}

export interface BatchPdfConvertItem {
  id: string;
  file: File;
  originalName: string;
  status: 'pending' | 'converting' | 'success' | 'error';
  pdfBlob?: Blob;
  pdfUrl?: string;
  errorMessage?: string;
  pageCount?: number;
}


