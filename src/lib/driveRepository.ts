/**
 * DRIVE REPOSITORY MODULE - KHO TÀI NGUYÊN GOOGLE DRIVE DÙNG CHUNG
 * CHỦ NHIỆM: THẦY CẤN VĂN TRƯỜNG - THCS PHÙNG KHẮC KHOAN (0988.302.636)
 */

export interface DocCategoryInfo {
  id: string;
  code: string;
  label: string;
  folderName: string;
  description: string;
  badgeColor: string;
}

export const DOCUMENT_CATEGORIES: DocCategoryInfo[] = [
  {
    id: 'khbd_5512',
    code: 'KHBD_5512',
    label: '1. Kế hoạch bài dạy / Giáo án (CV 5512)',
    folderName: '01_Giao_An_KHBD_5512',
    description: 'Giáo án chuẩn tiến trình 4 hoạt động CV 5512 (THCS & THPT)',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
  },
  {
    id: 'khbd_2345',
    code: 'KHBD_2345',
    label: '2. Kế hoạch bài dạy Tiểu học (CV 2345)',
    folderName: '02_Giao_An_Tieu_Hoc_2345',
    description: 'Giáo án chuẩn CV 2345 cho khối Tiểu học (Lớp 1 đến Lớp 5)',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
  },
  {
    id: 'de_kiem_tra',
    code: 'DeKiemTra_MaTran',
    label: '3. Ma trận & Đề kiểm tra định kỳ (Giữa kỳ / Cuối kỳ)',
    folderName: '03_De_Kiem_Tra_Va_Ma_Tran',
    description: 'Ma trận đặc tả, bản đặc tả và đề kiểm tra định kỳ kèm hướng dẫn chấm',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40'
  },
  {
    id: 'de_trac_nghiem',
    code: 'DeTracNghiem',
    label: '4. Đề thi trắc nghiệm (Kèm đáp án & Lời giải chi tiết)',
    folderName: '04_Ngan_Hang_De_Trac_Nghiem',
    description: 'Đề trắc nghiệm 4 lựa chọn, đúng sai, trả lời ngắn chuẩn Bộ GD&ĐT',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40'
  },
  {
    id: 'phieu_bai_tap',
    code: 'PhieuBaiTap',
    label: '5. Phiếu bài tập phân hóa (3 mức độ)',
    folderName: '05_Phieu_Bai_Tap_Phan_Hoa',
    description: 'Phiếu bài tập Biết - Hiểu - Vận dụng và rèn luyện kỹ năng',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40'
  },
  {
    id: 'kien_thuc_mindmap',
    code: 'KienThuc_Mindmap',
    label: '6. Tóm tắt kiến thức trọng tâm & Sơ đồ tư duy',
    folderName: '06_Tom_Tat_Kien_Thuc_Mindmap',
    description: 'Hệ thống hóa kiến thức bài học, bảng tóm tắt, sơ đồ tổng kết',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40'
  },
  {
    id: 'khgd_phu_luc',
    code: 'KHGD_ToChuyenMon',
    label: '7. Kế hoạch giáo dục tổ chuyên môn (Phụ lục 1, 2, 3)',
    folderName: '07_KHGD_Nha_Truong_Phu_Luc_123',
    description: 'Phụ lục 1, Phụ lục 2, Phụ lục 3 khung phân phối chương trình',
    badgeColor: 'bg-teal-500/20 text-teal-400 border-teal-500/40'
  },
  {
    id: 'bai_giang_game',
    code: 'BaiGiang_KBD',
    label: '8. Kịch bản bài giảng điện tử & Trò chơi khởi động',
    folderName: '08_Bai_Giang_Dien_Tu_Tro_Choi',
    description: 'Kịch bản trình chiếu PowerPoint, trò chơi tương tác, khởi động hứng thú',
    badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
  },
  {
    id: 'bdhsg_phu_dao',
    code: 'BDHSG_PhuDao',
    label: '9. Tài liệu bồi dưỡng HSG & Phụ đạo học sinh',
    folderName: '09_Boi_Duong_HSG_Phu_Dao',
    description: 'Chuyên đề nâng cao ôn thi HSG và chuyên đề củng cố học sinh cần trợ giúp',
    badgeColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
  },
  {
    id: 'skkn_chuyen_de',
    code: 'SKKN_ChuyenDe',
    label: '10. Sáng kiến kinh nghiệm & Chuyên đề dạy học',
    folderName: '10_SKKN_Va_Chuyen_De_Chuyen_Mon',
    description: 'Báo cáo giải pháp sáng kiến kinh nghiệm, sinh hoạt chuyên môn theo NCBH',
    badgeColor: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/40'
  },
  {
    id: 'tai_lieu_khac',
    code: 'TaiLieuKhac',
    label: '11. Tài liệu chuyên môn & Giáo cụ khác',
    folderName: '11_Tai_Lieu_Chuyen_Mon_Khac',
    description: 'Các tài liệu, biểu mẫu, phiếu đánh giá, quy chế kiểm tra khác',
    badgeColor: 'bg-slate-500/20 text-slate-400 border-slate-500/40'
  }
];

export const GRADE_LIST = [
  'Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5',
  'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9',
  'Lớp 10', 'Lớp 11', 'Lớp 12'
];

export interface FolderSchemeOption {
  id: string;
  label: string;
  description: string;
}

export const FOLDER_SCHEMES: FolderSchemeOption[] = [
  {
    id: 'grade_subject_type',
    label: 'Khối Lớp ➔ Môn Học ➔ Loại Tài Liệu (Khuyến nghị)',
    description: 'Tạo cây thư mục: [Lớp 7] / [Môn Toán] / [01_Giao_An_KHBD]'
  },
  {
    id: 'school_grade_subject',
    label: 'Cấp Học ➔ Khối Lớp ➔ Môn Học',
    description: 'Tạo cây thư mục: [02_THCS_Lop_6_den_9] / [Lop_7] / [Mon_Toan]'
  },
  {
    id: 'type_grade',
    label: 'Loại Tài Liệu ➔ Khối Lớp',
    description: 'Tạo cây thư mục: [01_Giao_An_KHBD] / [Lop_7]'
  },
  {
    id: 'root_pending',
    label: 'Thư mục tiếp nhận đóng góp chung',
    description: 'Lưu trực tiếp vào: [00_Dong_Gop_Moi_Cho_Duyet]'
  }
];

/**
 * Remove Vietnamese accents and special characters for clean filenames & folder names
 */
export function removeVietnameseAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9_-]/g, ' ')
    .trim()
    .replace(/\s+/g, '_');
}

/**
 * Clean string to PascalCase / CamelSafe words without spaces or special symbols
 */
export function sanitizeToAlphanumeric(str: string): string {
  if (!str) return '';
  const noAccents = str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');

  // Split by non-alphanumeric, filter empty, capitalize each word
  return noAccents
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

/**
 * Determine school level from grade string
 */
export function getSchoolLevel(grade: string): { code: string; folder: string; label: string } {
  const gNum = parseInt(grade.replace(/\D/g, ''), 10);
  if (!isNaN(gNum)) {
    if (gNum >= 1 && gNum <= 5) {
      return { code: 'TieuHoc', folder: '01. CẤP TIỂU HỌC (Lớp 1 - 5)', label: 'Tiểu học (Lớp 1 - 5)' };
    }
    if (gNum >= 6 && gNum <= 9) {
      return { code: 'THCS', folder: '02. CẤP THCS (Lớp 6 - 9)', label: 'THCS (Lớp 6 - 9)' };
    }
    if (gNum >= 10 && gNum <= 12) {
      return { code: 'THPT', folder: '03. CẤP THPT (Lớp 10 - 12)', label: 'THPT (Lớp 10 - 12)' };
    }
  }
  return { code: 'Chung', folder: '04. TÀI LIỆU CHUNG CÁC CẤP', label: 'Phổ thông' };
}

/**
 * Generate standardized file name for community upload
 * Format: [DOC_CODE]_[Mon]_[Lop]_[Tiet]_[TenBai]_[NguoiSoan]_[DonVi].[ext]
 */
export function generateStandardFileName(params: {
  docTypeCode: string;
  subject: string;
  subSubject?: string;
  grade: string;
  lessonPeriod?: string;
  lessonTitle: string;
  authorName: string;
  schoolName: string;
  fileExtension: string;
}): string {
  const code = params.docTypeCode || 'TaiLieu';
  const mon = sanitizeToAlphanumeric(params.subject || 'MonHoc');
  const phanMon = params.subSubject && params.subSubject !== 'Chung' ? sanitizeToAlphanumeric(params.subSubject) : '';
  const lop = sanitizeToAlphanumeric(params.grade || 'Lop7');
  const tiet = params.lessonPeriod ? sanitizeToAlphanumeric(params.lessonPeriod) : '';
  const bai = sanitizeToAlphanumeric(params.lessonTitle || 'BaiHoc');
  const tacGia = sanitizeToAlphanumeric(params.authorName || 'GiaoVien');
  const donVi = sanitizeToAlphanumeric(params.schoolName || 'TruongHoc');

  const parts: string[] = [code];
  if (mon) parts.push(phanMon ? `${mon}_${phanMon}` : mon);
  if (lop) parts.push(lop);
  if (tiet) parts.push(tiet.startsWith('Tiet') ? tiet : `Tiet${tiet}`);
  if (bai) parts.push(bai);
  if (tacGia) parts.push(tacGia);
  if (donVi) parts.push(donVi);

  let ext = params.fileExtension.toLowerCase();
  if (!ext.startsWith('.')) ext = `.${ext}`;

  return `${parts.join('_')}${ext}`;
}

/**
 * Compute the target folder hierarchy array on Google Drive based on user selection
 */
export function computeFolderHierarchy(params: {
  schemeId: string;
  docCategoryId: string;
  grade: string;
  subject: string;
}): { paths: string[]; breadcrumbs: string } {
  const category = DOCUMENT_CATEGORIES.find(c => c.id === params.docCategoryId) || DOCUMENT_CATEGORIES[0];
  const level = getSchoolLevel(params.grade);
  const gradeNum = params.grade.replace(/\D/g, '') || '6';
  const gradeFolder = `Lớp ${gradeNum}`;
  const subjectFolder = `Môn ${params.subject || 'Toán học'}`;
  const catFolder = category.label;

  let paths: string[] = [];

  switch (params.schemeId) {
    case 'grade_subject_type':
      // [02. CẤP THCS (Lớp 6 - 9)] -> [Lớp 7] -> [Môn Toán học] -> [1. Kế hoạch bài dạy / Giáo án (CV 5512)]
      paths = [level.folder, gradeFolder, subjectFolder, catFolder];
      break;

    case 'school_grade_subject':
      // [02. CẤP THCS (Lớp 6 - 9)] -> [Lớp 7] -> [Môn Toán học]
      paths = [level.folder, gradeFolder, subjectFolder];
      break;

    case 'type_grade':
      // [1. Kế hoạch bài dạy / Giáo án (CV 5512)] -> [02. CẤP THCS (Lớp 6 - 9)] -> [Lớp 7]
      paths = [catFolder, level.folder, gradeFolder];
      break;

    case 'root_pending':
    default:
      paths = ['00. ĐÓNG GÓP MỚI CHỜ DUYỆT'];
      break;
  }

  const breadcrumbs = `📁 Kho Drive Thầy Trường > ${paths.map(p => `📁 ${p}`).join(' > ')}`;
  return { paths, breadcrumbs };
}
