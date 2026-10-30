/**
 * COMMUNITY REPOSITORY DATA & OFFICIAL EDUCATIONAL DIRECTIVES
 * KHO TÀI LIỆU CỘNG ĐỒNG, VĂN BẢN CHỈ ĐẠO, CÔNG VĂN AI, NĂNG LỰC SỐ & GIÁO ÁN MẪU
 * CHỦ NHIỆM: THẦY CẤN VĂN TRƯỜNG - THCS PHÙNG KHẮC KHOAN (0988.302.636)
 */

export interface CommunityDocItem {
  id: string;
  title: string;
  categoryId: string;
  folderId: string;
  categoryName: string;
  folderName: string;
  subFolderName?: string;
  docNumber?: string;
  agency?: string;
  authorName?: string;
  schoolName?: string;
  date?: string;
  subject?: string;
  grade?: string;
  tags: string[];
  fileType: 'pdf' | 'docx' | 'doc' | 'txt' | 'tikz' | 'pptx' | 'xlsx';
  fileSize: string;
  description: string;
  content: string;
  htmlContent?: string;
  blobUrl?: string;
  fileDataUrl?: string;
  driveUrl?: string;
  isOfficialDirective?: boolean;
  isFeatured?: boolean;
  approvalStatus?: 'approved' | 'pending' | 'rejected';
}

export interface CommunityFolder {
  id: string;
  name: string;
  icon: string;
  badgeColor: string;
  description: string;
  subFolders: {
    id: string;
    name: string;
    description: string;
    docCount?: number;
  }[];
}

export const COMMUNITY_FOLDERS: CommunityFolder[] = [
  {
    id: 'van_ban_chi_dao',
    name: '1. Văn bản Chỉ đạo & Công văn Chuyên môn (Bộ GD&ĐT)',
    icon: 'Scroll',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    description: 'Tổng hợp Công văn ứng dụng AI, Khung Năng lực Số, CV 5512, CV 2345, Thông tư 22/27',
    subFolders: [
      { id: 'cv_ai_giaoduc', name: '🤖 Công văn & Chỉ đạo Ứng dụng AI trong Giáo dục', description: 'Hướng dẫn sử dụng GenAI an toàn, tích hợp AI vào soạn bài & giảng dạy' },
      { id: 'khung_nang_luc_so', name: '💻 Khung Năng lực Số (NLS) cho GV & HS', description: '5 miền năng lực số, tiêu chí đánh giá & chỉ số hành vi tích hợp vào giáo án' },
      { id: 'cv_5512_trunghoc', name: '📐 Công văn 5512/BGDĐT-GDTrH (THCS & THPT)', description: 'Khung kế hoạch bài dạy 4 hoạt động, Phụ lục 1, 2, 3, 4' },
      { id: 'cv_2345_tieuhoc', name: '🎒 Công văn 2345/BGDĐT-GDTH (Tiểu học)', description: 'Kế hoạch bài dạy chuẩn Tiểu học từ Lớp 1 đến Lớp 5' },
      { id: 'thongtu_danhgia_kt', name: '🎯 Thông tư 22, 27 & CV 3280 về Đánh giá Học sinh', description: 'Quy định đánh giá định kỳ, ma trận, đặc tả đề kiểm tra' },
      { id: 'shcm_ncbh', name: '👥 Sinh hoạt Chuyên môn theo Nghiên cứu Bài học', description: 'Quy trình 4 bước SHCM theo NCBH, đổi mới phương pháp dạy học' }
    ]
  },
  {
    id: 'sgk_sgv_ctgdpt',
    name: '2. Sách Giáo Khoa, SGV & Phân phối Chương trình 2018',
    icon: 'BookOpen',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    description: 'Kho học liệu SGK 3 bộ sách, sách giáo viên, khung chương trình và STEM',
    subFolders: [
      { id: 'sgk_ketnoi', name: '📙 Bộ sách Kết nối Tri thức với Cuộc sống', description: 'Tài liệu SGK & SGV đầy đủ các khối lớp và phân môn' },
      { id: 'sgk_canhdieu', name: '📘 Bộ sách Cánh Diều', description: 'Tài liệu SGK & SGV đầy đủ các khối lớp và phân môn' },
      { id: 'sgk_chantroi', name: '📗 Bộ sách Chân trời Sáng tạo', description: 'Tài liệu SGK & SGV đầy đủ các khối lớp và phân môn' },
      { id: 'stem_lienmon', name: '🔬 Chuyên đề STEM & Tích hợp Liên môn', description: 'Kế hoạch bài dạy STEM, dự án học tập trải nghiệm thực tế' }
    ]
  },
  {
    id: 'giao_an_khbd',
    name: '3. Ngân hàng Kế hoạch Bài dạy (Giáo án Chuẩn 5512 & 2345)',
    icon: 'FileText',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    description: 'Giáo án mẫu đầy đủ tiến trình 4 hoạt động, tích hợp NLS, AI, Kỹ thuật dạy học tích cực',
    subFolders: [
      { id: 'ga_toan', name: '📐 Môn Toán (Lớp 1 - 12)', description: 'Đại số, Hình học, Xác suất Thống kê, Toán thực tế' },
      { id: 'ga_khtn', name: '🧪 Môn KHTN / Vật lý / Hóa học / Sinh học', description: 'Giáo án bài học, thí nghiệm và bài tập định lượng' },
      { id: 'ga_nguvan', name: '📖 Môn Ngữ văn & Tiếng Việt', description: 'Đọc hiểu, Viết, Nói & Nghe, Tiếng Việt thực hành' },
      { id: 'ga_tinhoc', name: '💻 Môn Tin học & Công nghệ', description: 'Lập trình, Ứng dụng tin học, Năng lực số' },
      { id: 'ga_lichsu_diali', name: '🌍 Môn Lịch sử & Địa lí / GDCD', description: 'Giáo án tích hợp liên môn và phát triển năng lực' }
    ]
  },
  {
    id: 'de_thi_matran',
    name: '4. Ngân hàng Đề thi, Ma trận & Bản đặc tả Định kỳ',
    icon: 'Target',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    description: 'Ma trận đặc tả đề kiểm tra Giữa kỳ, Cuối kỳ, ngân hàng trắc nghiệm và đề HSG',
    subFolders: [
      { id: 'de_giuaky_1', name: '📝 Đề & Ma trận Giữa học kỳ 1', description: 'Khung 4 mức độ: Biết - Hiểu - Vận dụng - VDC' },
      { id: 'de_cuoiky_1', name: '📝 Đề & Ma trận Cuối học kỳ 1', description: 'Khung 4 mức độ: Biết - Hiểu - Vận dụng - VDC' },
      { id: 'de_giuaky_2', name: '📝 Đề & Ma trận Giữa học kỳ 2', description: 'Khung 4 mức độ: Biết - Hiểu - Vận dụng - VDC' },
      { id: 'de_cuoiky_2', name: '📝 Đề & Ma trận Cuối học kỳ 2', description: 'Khung 4 mức độ: Biết - Hiểu - Vận dụng - VDC' },
      { id: 'de_hsg_tuyensinh', name: '🏆 Đề thi HSG & Luyện thi vào Lớp 10', description: 'Đề nâng cao phân hóa dành cho học sinh giỏi' }
    ]
  },
  {
    id: 'skkn_chuyen_de',
    name: '5. Sáng kiến Kinh nghiệm (SKKN) & Báo cáo Chuyên môn',
    icon: 'Sparkles',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    description: 'Báo cáo giải pháp đạt giải cao về ứng dụng AI, chuyển đổi số và đổi mới phương pháp',
    subFolders: [
      { id: 'skkn_ai_cds', name: '🤖 SKKN Ứng dụng AI & Chuyển đổi số trong Dạy học', description: 'Giải pháp nâng cao chất lượng dạy học bằng trí tuệ nhân tạo' },
      { id: 'skkn_pp_tichcuc', name: '💡 SKKN Đổi mới Phương pháp & Kỹ thuật Dạy học', description: 'Mô hình trạm, mảnh ghép, khăn trải bàn, lớp học đảo ngược' },
      { id: 'skkn_boiduong_hsg', name: '🌟 SKKN Bồi dưỡng Học sinh Giỏi & Phụ đạo', description: 'Phương pháp phân hóa học sinh và nâng cao điểm số' }
    ]
  },
  {
    id: 'tikz_mindmap_media',
    name: '6. Thư viện Mã TikZ Chuẩn, Sơ đồ Tư duy & Kịch bản Game',
    icon: 'Code',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    description: 'Thư viện code TikZ chuẩn vẽ hình toán học, mindmap tóm tắt và game tương tác',
    subFolders: [
      { id: 'tikz_hinhhoc', name: '📐 Thư viện Code TikZ Hình học & Đồ thị', description: 'Hình không gian 3D, hình phẳng, đồ thị hàm số, trục số' },
      { id: 'mindmap_tomtat', name: '🧠 Sơ đồ Tư duy Tóm tắt Kiến thức', description: 'Hệ thống hóa bài học theo chương trình mới' },
      { id: 'kichban_game', name: '🎮 Kịch bản Trò chơi Khởi động & PowerPoint', description: 'Rung chuông vàng, Vòng quay may mắn, Hộp quà bí mật' }
    ]
  }
];

export const COMMUNITY_DOCUMENTS: CommunityDocItem[] = [
  // ==========================================
  // 1. DIRECTIVES & OFFICIAL GUIDELINES
  // ==========================================
  {
    id: 'doc_ai_huongdan_dayhoc',
    title: 'Khung Hướng dẫn Ứng dụng Trí tuệ Nhân tạo Tạo sinh (GenAI) trong Dạy học & Quản lý Giáo dục',
    categoryId: 'van_ban_chi_dao',
    folderId: 'cv_ai_giaoduc',
    categoryName: '1. Văn bản Chỉ đạo & Công văn Chuyên môn (Bộ GD&ĐT)',
    folderName: '🤖 Công văn & Chỉ đạo Ứng dụng AI trong Giáo dục',
    docNumber: 'CV-AI/BGDĐT-CNTT',
    agency: 'Bộ Giáo dục và Đào tạo / Cục CNTT',
    date: '2025-2026',
    subject: 'Chung tất cả các môn',
    grade: 'Tiểu học - THCS - THPT',
    tags: ['AI', 'Trí tuệ nhân tạo', 'GenAI', 'Chỉ đạo', 'Khung sư phạm', 'Đạo đức AI'],
    fileType: 'docx',
    fileSize: '45.8 KB',
    isOfficialDirective: true,
    isFeatured: true,
    description: 'Bộ khung nguyên tắc chỉ đạo về việc sử dụng công nghệ AI (Gemini, ChatGPT...) trong thiết kế bài giảng, soạn giáo án 5512, ra đề kiểm tra và hướng dẫn học sinh ứng dụng AI có trách nhiệm.',
    content: `# BỘ GIÁO DỤC VÀ ĐÀO TẠO
## KHUNG HƯỚNG DẪN ỨNG DỤNG TRÍ TUỆ NHÂN TẠO TẠO SINH (GENAI) TRONG HOẠT ĐỘNG DẠY HỌC VÀ QUẢN LÝ GIÁO DỤC

### I. NGUYÊN TẮC CỐT LÕI KHI ỨNG DỤNG AI TRONG GIÁO DỤC
1. **Con người giữ vai trò trung tâm (Human-in-the-loop)**: AI là trợ thủ hỗ trợ, giáo viên luôn là người quyết định cuối cùng về tính sư phạm, khoa học và đạo đức của bài dạy.
2. **Bảo mật và An toàn thông tin**: Tuyệt đối không đưa dữ liệu cá nhân nhạy cảm của học sinh, thông tin định danh nội bộ lên các hệ thống AI công cộng chưa được kiểm duyệt.
3. **Phát triển tư duy phản biện & Đạo đức học thuật**: Học sinh được hướng dẫn sử dụng AI như công cụ mở rộng tư duy, cấm sao chép nguyên văn sản phẩm của AI nộp làm bài tập cá nhân.
4. **Công bằng và Bình đẳng số**: Đảm bảo tất cả học sinh đều được tiếp cận cơ hội học tập có hỗ trợ công nghệ mà không bị rào cản về điều kiện thiết bị.

### II. CÁC LĨNH VỰC ỨNG DỤNG CHỦ LỰC DÀNH CHO GIÁO VIÊN
- **Soạn Kế hoạch bài dạy (Giáo án CV 5512 / CV 2345)**: Sử dụng AI để gợi ý tình huống khởi động sáng tạo, thiết kế chuỗi câu hỏi phân hóa 4 mức độ, xây dựng phiếu học tập tích cực.
- **Xây dựng Ngân hàng Đề kiểm tra & Ma trận Đặc tả**: Hỗ trợ khởi tạo câu hỏi trắc nghiệm khách quan, xây dựng đáp án và thang chấm chi tiết.
- **Tạo học liệu đa phương tiện & Âm thanh**: Chuyển văn bản bài học thành audio podcast tự học, sinh hình ảnh minh họa và mã vẽ hình TikZ chuẩn mực.
- **Cá nhân hóa lộ trình học tập**: Phân tích lỗi sai thường gặp của học sinh để đưa ra gợi ý củng cố kiến thức theo từng đối tượng học sinh (nâng cao HSG / phụ đạo học sinh yếu).

### III. TRÁCH NHIỆM CỦA GIÁO VIÊN VÀ TỔ CHUYÊN MÔN
- Kiểm duyệt tính chính xác của mọi thông tin do AI tạo ra trước khi đưa vào lớp học.
- Đổi mới phương pháp đánh giá: Tăng cường đánh giá quá trình, phỏng vấn trực tiếp, thuyết trình dự án để đo lường năng lực thực chất của người học.`
  },
  {
    id: 'doc_khung_nang_luc_so',
    title: 'Khung Năng lực Số (NLS) cho Học sinh Phổ thông & Hướng dẫn Tích hợp vào Kế hoạch Bài dạy',
    categoryId: 'van_ban_chi_dao',
    folderId: 'khung_nang_luc_so',
    categoryName: '1. Văn bản Chỉ đạo & Công văn Chuyên môn (Bộ GD&ĐT)',
    folderName: '💻 Khung Năng lực Số (NLS) cho GV & HS',
    docNumber: 'HD-NLS/BGDĐT',
    agency: 'Bộ GD&ĐT - Đề án Chuyển đổi số',
    date: '2025-2026',
    subject: 'Chung tất cả các môn',
    grade: 'Lớp 1 - 12',
    tags: ['Năng lực số', 'NLS', 'GDPT 2018', 'Chỉ số hành vi', 'CV 5512', 'CV 2345'],
    fileType: 'docx',
    fileSize: '52.1 KB',
    isOfficialDirective: true,
    isFeatured: true,
    description: 'Chi tiết 5 miền năng lực số, tiêu chí đánh giá và bảng chỉ số hành vi (Mã NLS.1 đến NLS.5) để giáo viên tích hợp trực tiếp vào mục tiêu Mục I.2 (Năng lực) của Giáo án.',
    content: `# KHUNG NĂNG LỰC SỐ (NLS) DÀNH CHO HỌC SINH PHỔ THÔNG
*(Ban hành kèm theo Hướng dẫn thực hiện Chương trình GDPT 2018)*

### I. 5 MIỀN NĂNG LỰC SỐ CỐT LÕI (DIGCOMP ADAPTATION)
1. **Miền 1: Khai thác Thông tin và Dữ liệu Số (Mã: NLS.1)**
   - NLS.1.1: Tìm kiếm thông tin từ khóa học tập trên internet và nền tảng học liệu số.
   - NLS.1.2: Đánh giá và chọn lọc tính tin cậy, khách quan của nguồn tư liệu số.
2. **Miền 2: Giao tiếp và Hợp tác trong Môi trường Số (Mã: NLS.2)**
   - NLS.2.1: Tương tác, thảo luận nhóm qua các công cụ kỹ thuật số (Padlet, Google Docs, Teams/Zoom).
   - NLS.2.2: Chia sẻ dữ liệu và tài nguyên số phục vụ giải quyết nhiệm vụ học tập.
3. **Miền 3: Sáng tạo Nội dung Số (Mã: NLS.3)**
   - NLS.3.1: Thiết kế sản phẩm học tập số (Báo cáo Canva, Video ngắn, Slide PowerPoint, Sơ đồ tư duy số).
   - NLS.3.2: Ứng dụng công cụ lập trình cơ bản hoặc sử dụng AI để minh họa ý tưởng khoa học.
4. **Miền 4: An toàn và Bảo vệ Bản thân trong Môi trường Số (Mã: NLS.4)**
   - NLS.4.1: Bảo vệ thiết bị, tài khoản và mật khẩu cá nhân an toàn.
   - NLS.4.2: Nhận biết nguy cơ mã độc, tin giả, lừa đảo trực tuyến.
5. **Miền 5: Giải quyết Vấn đề bằng Công nghệ Số (Mã: NLS.5)**
   - NLS.5.1: Vận dụng các phần mềm chuyên môn (GeoGebra, PhET mô phỏng, bảng tính) để giải quyết bài toán.
   - NLS.5.2: Tự đánh giá và khắc phục lỗi kỹ thuật cơ bản khi sử dụng thiết bị số.`
  },
  {
    id: 'doc_cv_5512_chuan',
    title: 'Công văn 5512/BGDĐT-GDTrH về Xây dựng và Tổ chức Thực hiện Kế hoạch Giáo dục (Phụ lục 1, 2, 3, 4)',
    categoryId: 'van_ban_chi_dao',
    folderId: 'cv_5512_trunghoc',
    categoryName: '1. Văn bản Chỉ đạo & Công văn Chuyên môn (Bộ GD&ĐT)',
    folderName: '📐 Công văn 5512/BGDĐT-GDTrH (THCS & THPT)',
    docNumber: '5512/BGDĐT-GDTrH',
    agency: 'Bộ Giáo dục và Đào tạo',
    date: '18/12/2020',
    subject: 'Toàn bộ các môn THCS & THPT',
    grade: 'Lớp 6 - 12',
    tags: ['CV 5512', 'Kế hoạch bài dạy', 'Phụ lục 1', 'Phụ lục 2', 'Phụ lục 3', 'Phụ lục 4', '4 hoạt động'],
    fileType: 'docx',
    fileSize: '68.4 KB',
    isOfficialDirective: true,
    isFeatured: true,
    description: 'Văn bản gốc chính thức của Bộ GD&ĐT quy định chuẩn mực khung Kế hoạch dạy học của tổ chuyên môn và Kế hoạch bài dạy (Giáo án) theo tiến trình 4 hoạt động học.',
    content: `# BỘ GIÁO DỤC VÀ ĐÀO TẠO
**Số: 5512/BGDĐT-GDTrH**
*Hà Nội, ngày 18 tháng 12 năm 2020*

## CÔNG VĂN HƯỚNG DẪN XÂY DỰNG VÀ TỔ CHỨC THỰC HIỆN KẾ HOẠCH GIÁO DỤC CỦA NHÀ TRƯỜNG

### CẤU TRÚC KẾ HOẠCH BÀI DẠY (GIÁO ÁN) - PHỤ LỤC 4

#### I. MỤC TIÊU (Kiến thức - Năng lực - Phẩm chất)
#### II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU
#### III. TIẾN TRÌNH DẠY HỌC (4 HOẠT ĐỘNG):
1. **Hoạt động 1: Mở đầu (Khởi động / Xác định vấn đề học tập)**
2. **Hoạt động 2: Hình thành kiến thức mới (Khám phá)**
3. **Hoạt động 3: Luyện tập (Củng cố kĩ năng)**
4. **Hoạt động 4: Vận dụng (Mở rộng thực tiễn & Tự học)**

Mỗi hoạt động tổ chức theo 4 bước chuẩn:
- Bước 1: Chuyển giao nhiệm vụ học tập
- Bước 2: Thực hiện nhiệm vụ học tập
- Bước 3: Báo cáo kết quả và thảo luận
- Bước 4: Đánh giá kết quả, thực hiện nhiệm vụ học tập & Kết luận`
  },
  {
    id: 'doc_cv_2345_tieuhoc',
    title: 'Công văn 2345/BGDĐT-GDTH về Hướng dẫn Xây dựng Kế hoạch Giáo dục Nhà trường Cấp Tiểu học',
    categoryId: 'van_ban_chi_dao',
    folderId: 'cv_2345_tieuhoc',
    categoryName: '1. Văn bản Chỉ đạo & Công văn Chuyên môn (Bộ GD&ĐT)',
    folderName: '🎒 Công văn 2345/BGDĐT-GDTH (Tiểu học)',
    docNumber: '2345/BGDĐT-GDTH',
    agency: 'Bộ GD&ĐT - Vụ Giáo dục Tiểu học',
    date: '2021',
    subject: 'Tiểu học (Toán, Tiếng Việt, TNXH, Đạo đức...)',
    grade: 'Lớp 1 - 5',
    tags: ['CV 2345', 'Tiểu học', 'Giáo án tiểu học', 'Kế hoạch bài dạy'],
    fileType: 'docx',
    fileSize: '55.2 KB',
    isOfficialDirective: true,
    isFeatured: false,
    description: 'Quy định chuẩn khung kế hoạch bài dạy dành riêng cho giáo viên Tiểu học, thiết kế hoạt động học tập linh hoạt, sinh động và vừa sức học sinh.',
    content: `# BỘ GIÁO DỤC VÀ ĐÀO TẠO
**CÔNG VĂN 2345/BGDĐT-GDTH: HƯỚNG DẪN XÂY DỰNG KẾ HOẠCH BÀI DẠY CẤP TIỂU HỌC**

### I. MỤC TIÊU BÀI DẠY TIỂU HỌC
- Yêu cầu cần đạt về Phẩm chất chủ yếu & Năng lực chung.
- Yêu cầu cần đạt về Năng lực đặc thù của môn học.

### II. ĐỒ DÙNG DẠY HỌC
- Đồ dùng của Giáo viên (Bộ đồ dùng dạy học, hình ảnh, video trực quan).
- Đồ dùng của Học sinh (Bộ đồ dùng thực hành, vở bài tập).

### III. CÁC HOẠT ĐỘNG DẠY HỌC CHỦ YẾU
1. **Khởi động**: Tạo không khí học tập vui tươi qua bài hát, trò chơi kết nối kiến thức cũ.
2. **Khám phá**: Hình thành kiến thức qua quan sát trực quan, thao tác với que tính/hình khối/chữ viết.
3. **Thực hành - Luyện tập**: Bài tập từ dễ đến nâng cao, rèn luyện kỹ năng.
4. **Vận dụng - Trải nghiệm**: Liên hệ đời sống gia đình, trường lớp.`
  },
  {
    id: 'doc_thongtu_22_danhgia',
    title: 'Thông tư 22/2021/TT-BGDĐT & CV 3280 về Đánh giá Học sinh và Xây dựng Ma trận Đề kiểm tra',
    categoryId: 'van_ban_chi_dao',
    folderId: 'thongtu_danhgia_kt',
    categoryName: '1. Văn bản Chỉ đạo & Công văn Chuyên môn (Bộ GD&ĐT)',
    folderName: '🎯 Thông tư 22, 27 & CV 3280 về Đánh giá Học sinh',
    docNumber: '22/2021/TT-BGDĐT & 3280/BGDĐT',
    agency: 'Bộ Giáo dục và Đào tạo',
    date: '2021-2024',
    subject: 'Tất cả các môn',
    grade: 'Lớp 6 - 12',
    tags: ['Thông tư 22', 'CV 3280', 'Ma trận đề thi', 'Bản đặc tả', 'Đánh giá định kỳ'],
    fileType: 'docx',
    fileSize: '62.7 KB',
    isOfficialDirective: true,
    isFeatured: false,
    description: 'Quy chế đánh giá thường xuyên, đánh giá định kỳ và cấu trúc ma trận, bản đặc tả đề kiểm tra theo 4 mức độ: Biết (40%), Hiểu (30%), Vận dụng (20%), Vận dụng cao (10%).',
    content: `# THÔNG TƯ 22/2021/TT-BGDĐT & HƯỚNG DẪN RA ĐỀ THEO CÔNG VĂN 3280

### I. CÁC HÌNH THỨC ĐÁNH GIÁ HỌC SINH
1. **Đánh giá thường xuyên (ĐGTX)**:
   - Thực hiện qua hỏi đáp, quan sát, viết ngắn, thực hành thí nghiệm, sản phẩm học tập.
2. **Đánh giá định kỳ (ĐGĐK)**:
   - Bài kiểm tra Giữa học kỳ (1 bài/học kỳ) và Cuối học kỳ (1 bài/học kỳ).
   - Kiểm tra trên giấy hoặc trên máy tính theo ma trận và bản đặc tả chuẩn.

### II. TỶ LỆ CÁC MỨC ĐỘ TRONG MA TRẬN ĐỀ THI ĐỊNH KỲ
- **Nhận biết**: 40% (4.0 điểm)
- **Thông hiểu**: 30% (3.0 điểm)
- **Vận dụng**: 20% (2.0 điểm)
- **Vận dụng cao**: 10% (1.0 điểm)`
  },
  {
    id: 'doc_shcm_ncbh_quytrinh',
    title: 'Quy trình 4 Bước Sinh hoạt Chuyên môn theo Nghiên cứu Bài học (SHCM - NCBH)',
    categoryId: 'van_ban_chi_dao',
    folderId: 'shcm_ncbh',
    categoryName: '1. Văn bản Chỉ đạo & Công văn Chuyên môn (Bộ GD&ĐT)',
    folderName: '👥 Sinh hoạt Chuyên môn theo Nghiên cứu Bài học',
    docNumber: 'HD-SHCM/BGDĐT',
    agency: 'Bộ Giáo dục và Đào tạo',
    date: '2024-2026',
    subject: 'Tất cả các môn',
    grade: 'Tiểu học - THCS - THPT',
    tags: ['SHCM', 'NCBH', 'Nghiên cứu bài học', 'Dự giờ', 'Đổi mới phương pháp'],
    fileType: 'docx',
    fileSize: '41.2 KB',
    isOfficialDirective: true,
    isFeatured: false,
    description: 'Quy trình 4 bước chuẩn mực tổ chức sinh hoạt chuyên môn theo nghiên cứu bài học, tập trung quan sát hoạt động học của học sinh thay vì đánh giá người dạy.',
    content: `# QUY TRÌNH 4 BƯỚC SINH HOẠT CHUYÊN MÔN THEO NGHIÊN CỨU BÀI HỌC (NCBH)

### BƯỚC 1: XÂY DỰNG KẾ HOẠCH VÀ THIẾT KẾ BÀI DẠY MINH HỌA
- Tổ chuyên môn cùng thảo luận xác định bài học, mục tiêu, thiết bị và phương án dạy học.
- Phân công một giáo viên đại diện hoàn thiện giáo án.

### BƯỚC 2: TIẾN HÀNH BÀI DẠY MINH HỌA VÀ DỰ GIỜ
- Giáo viên dạy bài học minh họa cho học sinh trong lớp học thật.
- Các giáo viên dự giờ đứng ở vị trí thuận lợi để quan sát nét mặt, hành vi, thái độ và sự hợp tác của học sinh.

### BƯỚC 3: PHÂN TÍCH BÀI HỌC (THẢO LUẬN CHUYÊN MÔN)
- Giáo viên dạy chia sẻ cảm nhận, những điều đạt và chưa đạt.
- Giáo viên dự giờ chia sẻ minh chứng cụ thể về việc học sinh học như thế nào, khó khăn ở bước nào.
- Tuyệt đối không xếp loại giờ dạy, không chỉ trích cá nhân.

### BƯỚC 4: VẬN DỤNG VÀO THỰC TIỄN GIẢNG DẠY
- Mỗi giáo viên rút ra bài học kinh nghiệm để áp dụng linh hoạt vào các tiết dạy hàng ngày của mình.`
  },

  // ==========================================
  // 2. TEXTBOOKS & CURRICULUM (SGK 3 BỘ SÁCH & STEM)
  // ==========================================
  {
    id: 'sgk_kntt_toan_7_chuong_trinh',
    title: 'Khung Phân phối Chương trình & Mục lục Chi tiết Môn Toán Lớp 7 - Bộ sách Kết nối Tri thức với Cuộc sống',
    categoryId: 'sgk_sgv_ctgdpt',
    folderId: 'sgk_ketnoi',
    categoryName: '2. Sách Giáo Khoa, SGV & Phân phối Chương trình 2018',
    folderName: '📙 Bộ sách Kết nối Tri thức với Cuộc sống',
    authorName: 'NXB Giáo dục Việt Nam',
    subject: 'Toán học',
    grade: 'Lớp 7',
    tags: ['SGK', 'Kết nối tri thức', 'Toán 7', 'PPCT', 'Mục lục SGK'],
    fileType: 'docx',
    fileSize: '58.2 KB',
    isOfficialDirective: false,
    isFeatured: true,
    description: 'Chi tiết phân phối chương trình 140 tiết (Đại số, Hình học, Xác suất thống kê) và danh mục bài dạy theo sách giáo khoa Kết nối Tri thức.',
    content: `# CHƯƠNG TRÌNH MÔN TOÁN 7 - BỘ SÁCH KẾT NỐI TRI THỨC VỚI CUỘC SỐNG
Thời lượng: 140 tiết / năm học (Học kỳ 1: 72 tiết; Học kỳ 2: 68 tiết)

### HỌC KỲ I (TẬP 1)
- **Chương I: Số hữu tỉ** (14 tiết)
  - Bài 1: Tập hợp các số hữu tỉ
  - Bài 2: Cộng, trừ, nhân, chia số hữu tỉ
  - Bài 3: Lũy thừa với số mũ tự nhiên của một số hữu tỉ
  - Bài 4: Thứ tự thực hiện các phép tính. Quy tắc chuyển vế
- **Chương II: Số thực** (10 tiết)
  - Bài 5: Làm quen với số thập phân vô hạn tuần hoàn
  - Bài 6: Số vô tỉ. Căn bậc hai số học
  - Bài 7: Tập hợp các số thực ℝ (Số thực)
- **Chương III: Góc và hai đường thẳng song song** (14 tiết)
  - Bài 8: Góc ở vị trí đặc biệt. Tia phân giác của một góc
  - Bài 9: Hai đường thẳng song song và dấu hiệu nhận biết
  - Bài 10: Tiên đề Euclid. Tính chất của hai đường thẳng song song
- **Chương IV: Tam giác bằng nhau** (18 tiết)
  - Bài 12: Tổng các góc trong một tam giác
  - Bài 13: Hai tam giác bằng nhau. Trường hợp bằng nhau thứ nhất (c.c.c)
  - Bài 14: Trường hợp bằng nhau thứ hai (c.g.c) và thứ ba (g.c.g)
  - Bài 15: Các trường hợp bằng nhau của tam giác vuông
  - Bài 16: Tam giác cân. Đường trung trực của đoạn thẳng
- **Chương V: Thu thập và biểu diễn dữ liệu** (10 tiết)`
  },
  {
    id: 'sgk_canhdieu_khtn_7',
    title: 'Phân phối Chương trình & Chuẩn YCCĐ Môn Khoa học Tự nhiên Lớp 7 - Bộ sách Cánh Diều',
    categoryId: 'sgk_sgv_ctgdpt',
    folderId: 'sgk_canhdieu',
    categoryName: '2. Sách Giáo Khoa, SGV & Phân phối Chương trình 2018',
    folderName: '📘 Bộ sách Cánh Diều',
    authorName: 'NXB Đại học Sư phạm',
    subject: 'KHTN',
    grade: 'Lớp 7',
    tags: ['SGK', 'Cánh Diều', 'KHTN 7', 'Yêu cầu cần đạt', 'Vật lý', 'Hóa học', 'Sinh học'],
    fileType: 'docx',
    fileSize: '54.6 KB',
    isOfficialDirective: false,
    isFeatured: false,
    description: 'Khung phân phối chương trình 140 tiết KHTN 7 Cánh Diều bao gồm 3 mạch nội dung: Chất và sự biến đổi của chất, Năng lượng và sự biến đổi, Vật sống.',
    content: `# CHƯƠNG TRÌNH KHOA HỌC TỰ NHIÊN 7 - BỘ SÁCH CÁNH DIỀU
Thời lượng: 140 tiết (4 tiết/tuần)

### CÁC CHỦ ĐỀ CHÍNH:
1. **Chủ đề 1: Nguyên tử - Nguyên tố hóa học - Sơ lược bảng tuần hoàn**
2. **Chủ đề 2: Phân tử - Đơn chất - Hợp chất - Liên kết hóa học**
3. **Chủ đề 3: Tốc độ chuyển động**
4. **Chủ đề 4: Âm thanh (Sóng âm, độ cao, độ to, phản xạ âm)**
5. **Chủ đề 5: Ánh sáng (Sự truyền ánh sáng, định luật phản xạ ánh sáng)**
6. **Chủ đề 6: Từ trường (Nam châm, từ trường Trái Đất)**
7. **Chủ đề 7: Trao đổi chất và chuyển hóa năng lượng ở sinh vật** (Quang hợp, hô hấp, trao đổi nước và dinh dưỡng)`
  },
  {
    id: 'sgk_chantroi_nguvan_7',
    title: 'Cấu trúc Bài học & Ngữ liệu Môn Ngữ văn Lớp 7 - Bộ sách Chân trời Sáng tạo',
    categoryId: 'sgk_sgv_ctgdpt',
    folderId: 'sgk_chantroi',
    categoryName: '2. Sách Giáo Khoa, SGV & Phân phối Chương trình 2018',
    folderName: '📗 Bộ sách Chân trời Sáng tạo',
    authorName: 'NXB Giáo dục Việt Nam',
    subject: 'Ngữ văn',
    grade: 'Lớp 7',
    tags: ['SGK', 'Chân trời sáng tạo', 'Ngữ văn 7', 'Đọc hiểu', 'Viết', 'Nói và nghe'],
    fileType: 'docx',
    fileSize: '49.1 KB',
    isOfficialDirective: false,
    isFeatured: false,
    description: 'Cấu trúc 10 bài học theo chủ đề của Ngữ văn 7 Chân trời Sáng tạo tích hợp 4 kỹ năng Đọc - Viết - Nói và Nghe cùng Thực hành Tiếng Việt.',
    content: `# CHƯƠNG TRÌNH NGỮ VĂN 7 - BỘ SÁCH CHÂN TRỜI SÁNG TẠO

### HỌC KỲ I:
- **Bài 1: Tiếng nói của vạn vật (Thơ bốn chữ, năm chữ)**
- **Bài 2: Bài học cuộc sống (Truyện ngụ ngôn)**
- **Bài 3: Những góc nhìn văn chương (Nghị luận văn học)**
- **Bài 4: Quà tặng của thiên nhiên (Tản văn, tùy bút)**
- **Bài 5: Từng bước hoàn thiện bản thân (Văn bản thông tin)**

### HỌC KỲ II:
- **Bài 6: Hành trình tri thức (Nghị luận xã hội)**
- **Bài 7: Trí tuệ dân gian (Tục ngữ)**
- **Bài 8: Nét đẹp văn hóa Việt (Văn bản thông tin)**
- **Bài 9: Trong thế giới viễn tưởng (Truyện khoa học viễn tưởng)**
- **Bài 10: Lắng nghe trái tim mình (Thơ)`
  },
  {
    id: 'stem_che_tao_thuoc_do_goc',
    title: 'Kế hoạch Bài dạy STEM: Thiết kế và Chế tạo Giác kế Góc nghiêng Đo chiều cao Vật thể Thực tế',
    categoryId: 'sgk_sgv_ctgdpt',
    folderId: 'stem_lienmon',
    categoryName: '2. Sách Giáo Khoa, SGV & Phân phối Chương trình 2018',
    folderName: '🔬 Chuyên đề STEM & Tích hợp Liên môn',
    authorName: 'Thầy Cấn Văn Trường',
    schoolName: 'Trường THCS Phùng Khắc Khoan',
    subject: 'Toán học & Công nghệ STEM',
    grade: 'Lớp 7 - 9',
    tags: ['STEM', 'Giác kế', 'Toán thực tế', 'Đo chiều cao', 'Tích hợp liên môn'],
    fileType: 'docx',
    fileSize: '64.5 KB',
    isOfficialDirective: false,
    isFeatured: true,
    description: 'Dự án học tập STEM 2 tiết: Vận dụng kiến thức tam giác vuông và tỉ số lượng giác/góc để chế tạo thước đo góc nghiêng (giác kế) đo chiều cao cột cờ sân trường.',
    content: `# KẾ HOẠCH BÀI DẠY STEM: CHẾ TẠO GIÁC KẾ ĐO CHIỀU CAO
Môn học chủ đạo: Toán học | Môn học tích hợp: Công nghệ, Vật lí, Mĩ thuật
Thời lượng: 02 tiết

### I. MỤC TIÊU BÀI DẠY STEM
1. **Kiến thức**: Vận dụng quan hệ góc và cạnh trong tam giác vuông để xác định chiều cao vật thể không tới được chân.
2. **Kỹ năng STEM**:
   - Khoa học (S): Hiểu nguyên lý tia sáng truyền thẳng và góc nghiêng của đường ngắm.
   - Công nghệ (T): Sử dụng thước đo độ, ống ngắm và dây dọi để thiết kế dụng cụ đo.
   - Kỹ thuật (E): Thiết kế bản vẽ phác thảo và gia công mô hình giác kế cầm tay từ bìa carton/mica.
   - Toán học (M): Đo góc, tính khoảng cách và áp dụng công thức $h = d \\cdot \\tan(\\alpha) + h_0$.
3. **Phẩm chất & Năng lực**: Rèn luyện năng lực hợp tác nhóm, tư duy sáng tạo kỹ thuật và tác phong khoa học thực nghiệm.

### II. TIẾN TRÌNH 5 BƯỚC HOẠT ĐỘNG STEM
- **Hoạt động 1**: Xác định vấn đề đo chiều cao cột cờ trường mà không cần trèo lên đỉnh.
- **Hoạt động 2**: Nghiên cứu kiến thức nền (Góc ngắm, tỉ số lượng giác, cấu tạo thước đo góc).
- **Hoạt động 3**: Đề xuất bản vẽ thiết kế giác kế và thảo luận tiêu chí đánh giá.
- **Hoạt động 4**: Chế tạo mô hình và thử nghiệm đo góc ngắm trong sân trường.
- **Hoạt động 5**: Báo cáo sản phẩm, tính toán kết quả chiều cao và đánh giá độ chính xác.`
  },

  // ==========================================
  // 3. LESSON PLANS (GA 5512 EXAMPLES ACROSS SUBJECTS)
  // ==========================================
  {
    id: 'ga_toan_7_tap_hop_so_thuc',
    title: 'Kế hoạch Bài dạy Môn Toán Lớp 7: Tập hợp các số thực ℝ & Căn bậc hai số học (Chuẩn CV 5512)',
    categoryId: 'giao_an_khbd',
    folderId: 'ga_toan',
    categoryName: '3. Ngân hàng Kế hoạch Bài dạy (Giáo án Chuẩn 5512 & 2345)',
    folderName: '📐 Môn Toán (Lớp 1 - 12)',
    subject: 'Toán học',
    grade: 'Lớp 7',
    tags: ['Toán 7', 'Số thực ℝ', 'Căn bậc hai', 'CV 5512', 'Có TikZ', 'Tích hợp NLS'],
    fileType: 'docx',
    fileSize: '42.3 KB',
    isOfficialDirective: false,
    isFeatured: true,
    description: 'Giáo án mẫu hoàn chỉnh 2 tiết soạn theo chuẩn CV 5512 với đầy đủ 4 hoạt động, câu hỏi phân hóa, hình vẽ TikZ số học và tích hợp Năng lực số.',
    content: `Ngày soạn: 15/08/2026

**BÀI 5: TẬP HỢP CÁC SỐ THỰC VÀ TRỤC SỐ THỰC**
Môn học: Toán học | Lớp: 7A1
Thời lượng: 02 tiết (Tiết 1: Số vô tỉ & Căn bậc hai; Tiết 2: Tập hợp số thực ℝ và Trục số)

### I. MỤC TIÊU
1. **Kiến thức**: Nhận biết số vô tỉ, căn bậc hai số học √a (với a ≥ 0), hiểu tập hợp số thực ℝ = ℚ ∪ 𝕀.
2. **Năng lực**: Tư duy lập luận toán học, Năng lực số (NLS.1.2) dùng máy tính cầm tay tính căn bậc hai.
3. **Phẩm chất**: Chăm chỉ rèn luyện, trung thực trong kiểm tra.

### II. TIẾN TRÌNH DẠY HỌC (4 HOẠT ĐỘNG CHUẨN 5512)`
  },
  {
    id: 'ga_khtn_7_quang_hop',
    title: 'Kế hoạch Bài dạy Môn KHTN Lớp 7: Quá trình Quang hợp ở Thực vật & Vai trò (Chuẩn CV 5512)',
    categoryId: 'giao_an_khbd',
    folderId: 'ga_khtn',
    categoryName: '3. Ngân hàng Kế hoạch Bài dạy (Giáo án Chuẩn 5512 & 2345)',
    folderName: '🧪 Môn KHTN / Vật lý / Hóa học / Sinh học',
    subject: 'KHTN',
    grade: 'Lớp 7',
    tags: ['KHTN 7', 'Sinh học', 'Quang hợp', 'CV 5512', 'Thí nghiệm'],
    fileType: 'docx',
    fileSize: '39.8 KB',
    isOfficialDirective: false,
    isFeatured: false,
    description: 'Giáo án KHTN 7 bài Quang hợp tích hợp thí nghiệm ảo, phương trình hóa học tổng quát và liên hệ trồng cây xanh bảo vệ môi trường.',
    content: `# BÀI 21: QUANG HỢP Ở THỰC VẬT
Môn học: Khoa học tự nhiên 7 | Thời lượng: 02 tiết

### I. MỤC TIÊU
1. **Kiến thức**: Nêu được khái niệm quang hợp: Nước + Carbon dioxide + Ánh sáng -> Glucose + Oxygen.
2. **Năng lực**: Quan sát tranh ảnh thí nghiệm chứng minh sự tạo thành tinh bột và giải phóng khí oxygen.
3. **Phẩm chất**: Có ý thức chăm sóc, bảo vệ cây xanh và môi trường sống.`
  },
  {
    id: 'ga_nguvan_7_tho_bon_chu',
    title: 'Kế hoạch Bài dạy Môn Ngữ văn Lớp 7: Đặc điểm Thơ bốn chữ và Thơ năm chữ (Chuẩn CV 5512)',
    categoryId: 'giao_an_khbd',
    folderId: 'ga_nguvan',
    categoryName: '3. Ngân hàng Kế hoạch Bài dạy (Giáo án Chuẩn 5512 & 2345)',
    folderName: '📖 Môn Ngữ văn & Tiếng Việt',
    subject: 'Ngữ văn',
    grade: 'Lớp 7',
    tags: ['Ngữ văn 7', 'Thơ 4 chữ', 'Thơ 5 chữ', 'Vần nhịp', 'CV 5512'],
    fileType: 'docx',
    fileSize: '44.7 KB',
    isOfficialDirective: false,
    isFeatured: false,
    description: 'Kế hoạch bài dạy Ngữ văn 7 hướng dẫn học sinh nhận biết đặc điểm thể loại thơ 4 chữ, 5 chữ (vần chân, vần lưng, nhịp thơ) và bộc lộ cảm xúc thẩm mỹ.',
    content: `# BÀI HỌC: ĐẶC ĐIỂM THƠ BỐN CHỮ VÀ THƠ NĂM CHỮ
Môn học: Ngữ văn 7 | Thời lượng: 02 tiết

### I. MỤC TIÊU
1. **Kiến thức**: Nhận biết số tiếng trong mỗi dòng thơ, cách gieo vần (vần liền, vần cách, vần chân, vần lưng), cách ngắt nhịp (2/2, 3/2, 2/3).
2. **Năng lực**: Đọc diễn cảm bài thơ, nhận diện hình ảnh thơ độc đáo, viết đoạn văn cảm nhận.
3. **Phẩm chất**: Bồi dưỡng tình yêu thiên nhiên, quê hương đất nước.`
  },
  {
    id: 'ga_tinhoc_7_bang_tinh',
    title: 'Kế hoạch Bài dạy Môn Tin học Lớp 7: Định dạng Bảng tính và Sử dụng Công thức Hàm cơ bản',
    categoryId: 'giao_an_khbd',
    folderId: 'ga_tinhoc',
    categoryName: '3. Ngân hàng Kế hoạch Bài dạy (Giáo án Chuẩn 5512 & 2345)',
    folderName: '💻 Môn Tin học & Công nghệ',
    subject: 'Tin học',
    grade: 'Lớp 7',
    tags: ['Tin học 7', 'Excel', 'Bảng tính', 'Hàm SUM AVERAGE', 'Năng lực số'],
    fileType: 'docx',
    fileSize: '41.5 KB',
    isOfficialDirective: false,
    isFeatured: false,
    description: 'Giáo án thực hành phòng máy môn Tin học 7: Sử dụng các hàm SUM, AVERAGE, MAX, MIN và định dạng bảng điểm học sinh.',
    content: `# BÀI THỰC HÀNH: ĐỊNH DẠNG BẢNG TÍNH VÀ CÔNG THỨC
Môn học: Tin học 7 | Thời lượng: 02 tiết phòng máy

### I. MỤC TIÊU
1. **Kiến thức**: Biết sử dụng các hàm tính toán cơ bản: =SUM(), =AVERAGE(), =MAX(), =MIN().
2. **Năng lực**: Kỹ năng thao tác chuột, định dạng đường viền (Border), căn lề và tô màu ô tính.
3. **Phẩm chất**: Rèn tính cẩn thận, chính xác khi nhập liệu số liệu.`
  },
  {
    id: 'ga_lichsu_diali_7_dai_viet',
    title: 'Kế hoạch Bài dạy Môn Lịch sử & Địa lí Lớp 7: Nước Đại Việt thời Lý (1009 - 1225)',
    categoryId: 'giao_an_khbd',
    folderId: 'ga_lichsu_diali',
    categoryName: '3. Ngân hàng Kế hoạch Bài dạy (Giáo án Chuẩn 5512 & 2345)',
    folderName: '🌍 Môn Lịch sử & Địa lí / GDCD',
    subject: 'Lịch sử & Địa lí',
    grade: 'Lớp 7',
    tags: ['Lịch sử 7', 'Thời Lý', 'Chiếu dời đô', 'Thăng Long', 'CV 5512'],
    fileType: 'docx',
    fileSize: '46.8 KB',
    isOfficialDirective: false,
    isFeatured: false,
    description: 'Kế hoạch bài dạy Lịch sử 7: Sự thành lập nhà Lý, Chiếu dời đô của Lý Công Uẩn về Thăng Long năm 1010 và tổ chức bộ máy nhà nước quân chủ.',
    content: `# BÀI 14: NƯỚC ĐẠI VIỆT THỜI LÝ (1009 - 1225)
Phân môn: Lịch sử 7 | Thời lượng: 02 tiết

### I. MỤC TIÊU
1. **Kiến thức**: Trình bày được bối cảnh thành lập nhà Lý năm 1009 và sự kiện Lý Thái Tổ dời đô từ Hoa Lư về Đại La (Thăng Long) năm 1010.
2. **Năng lực**: Khai thác tư liệu lịch sử từ Chiếu dời đô, quan sát lược đồ kinh thành Thăng Long.
3. **Phẩm chất**: Tự hào về truyền thống nghìn năm văn hiến của Thủ đô Hà Nội.`
  },

  // ==========================================
  // 4. EXAMS & MATRIX SPECIFICATIONS
  // ==========================================
  {
    id: 'matran_de_toan_7_giuaky1',
    title: 'Ma trận & Bản đặc tả Đề kiểm tra Giữa Học kỳ 1 Môn Toán Lớp 7 (Chuẩn 4 Mức độ CV 3280)',
    categoryId: 'de_thi_matran',
    folderId: 'de_giuaky_1',
    categoryName: '4. Ngân hàng Đề thi, Ma trận & Bản đặc tả Định kỳ',
    folderName: '📝 Đề & Ma trận Giữa học kỳ 1',
    subject: 'Toán học',
    grade: 'Lớp 7',
    tags: ['Ma trận đề', 'Giữa HK1', 'Toán 7', 'Số hữu tỉ', 'Góc song song', 'CV 3280'],
    fileType: 'docx',
    fileSize: '51.2 KB',
    isOfficialDirective: false,
    isFeatured: true,
    description: 'Ma trận và bản đặc tả đề kiểm tra Giữa HK1 Toán 7: 70% Trắc nghiệm (28 câu) + 30% Tự luận (3 câu), phân hóa chuẩn Biết - Hiểu - Vận dụng - VDC.',
    content: `# MA TRẬN & BẢN ĐẶC TẢ ĐỀ KIỂM TRA GIỮA HỌC KỲ I
MÔN: TOÁN 7 - THỜI GIAN LÀM BÀI: 60 PHÚT

### I. KHUNG MA TRẬN TỔNG QUÁT
- Hình thức: 70% Trắc nghiệm khách quan (28 câu = 7.0 điểm) + 30% Tự luận (3 câu = 3.0 điểm).
- Tỉ lệ mức độ: Nhận biết (40%), Thông hiểu (30%), Vận dụng (20%), Vận dụng cao (10%).

| Chủ đề kiến thức | Nhận biết (TNKQ) | Thông hiểu (TNKQ + TL) | Vận dụng (TL) | Vận dụng cao (TL) | Tổng điểm |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Số hữu tỉ & Phép tính** | 10 câu (2.5đ) | 6 câu (1.5đ) + 1 câu TL (1.0đ) | 1 câu TL (0.5đ) | 1 câu TL (0.5đ) | 6.0 điểm |
| **2. Góc & Hai đường thẳng song song** | 8 câu (2.0đ) | 4 câu (1.0đ) | 1 câu TL (1.0đ) | 0 | 4.0 điểm |
| **Tổng cộng** | **18 câu (4.5đ)** | **10 câu (2.5đ) + 1 TL (1.0đ)** | **2 câu TL (1.5đ)** | **1 câu TL (0.5đ)** | **10.0 điểm** |`
  },
  {
    id: 'matran_de_toan_7_hocky1',
    title: 'Ma trận & Bản đặc tả Đề kiểm tra Cuối Học kỳ 1 Môn Toán Lớp 7 (Chuẩn 4 Mức độ CV 3280)',
    categoryId: 'de_thi_matran',
    folderId: 'de_cuoiky_1',
    categoryName: '4. Ngân hàng Đề thi, Ma trận & Bản đặc tả Định kỳ',
    folderName: '📝 Đề & Ma trận Cuối học kỳ 1',
    subject: 'Toán học',
    grade: 'Lớp 7',
    tags: ['Ma trận đề', 'Bản đặc tả', 'Toán 7', 'Cuối HK1', 'Đề kiểm tra', '4 mức độ'],
    fileType: 'docx',
    fileSize: '48.9 KB',
    isOfficialDirective: false,
    isFeatured: true,
    description: 'Bản ma trận đặc tả chi tiết 12 câu trắc nghiệm (3.0đ) + 5 câu tự luận (7.0đ) kèm đáp án, thang điểm chi tiết từng 0.25đ.',
    content: `# MA TRẬN VÀ BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐÁNH GIÁ CUỐI HỌC KỲ I
MÔN: TOÁN 7 - THỜI GIAN LÀM BÀI: 90 PHÚT

### I. KHUNG MA TRẬN ĐỀ THI
| TT | Chủ đề / Nội dung kiến thức | Nhận biết (TNKQ) | Thông hiểu (TL/TN) | Vận dụng (TL) | Vận dụng cao (TL) | Tổng % điểm |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Số hữu tỉ & Số thực** | 4 câu (1.0đ) | 2 câu (1.5đ) | 1 câu (1.0đ) | 1 câu (0.5đ) | 40% (4.0đ) |
| 2 | **Các hình khối trong thực tiễn** | 2 câu (0.5đ) | 1 câu (1.0đ) | 1 câu (0.5đ) | 0 | 20% (2.0đ) |
| 3 | **Góc và hai đường thẳng song song** | 4 câu (1.0đ) | 2 câu (1.5đ) | 1 câu (1.0đ) | 0 | 35% (3.5đ) |
| 4 | **Thu thập & Biểu diễn dữ liệu** | 2 câu (0.5đ) | 0 | 0 | 0 | 5% (0.5đ) |
| **Tổng** | | **12 câu (3.0đ)** | **5 câu (4.0đ)** | **3 câu (2.5đ)** | **1 câu (0.5đ)** | **100% (10đ)** |`
  },
  {
    id: 'matran_de_toan_7_giuaky2',
    title: 'Ma trận & Đề kiểm tra Giữa Học kỳ 2 Môn Toán Lớp 7: Tỉ lệ thức, Dãy tỉ số bằng nhau & Tam giác',
    categoryId: 'de_thi_matran',
    folderId: 'de_giuaky_2',
    categoryName: '4. Ngân hàng Đề thi, Ma trận & Bản đặc tả Định kỳ',
    folderName: '📝 Đề & Ma trận Giữa học kỳ 2',
    subject: 'Toán học',
    grade: 'Lớp 7',
    tags: ['Giữa HK2', 'Toán 7', 'Tỉ lệ thức', 'Tam giác bằng nhau', 'Ma trận đề'],
    fileType: 'docx',
    fileSize: '53.1 KB',
    isOfficialDirective: false,
    isFeatured: false,
    description: 'Đề kiểm tra Giữa HK2 Toán 7 chuẩn cấu trúc gồm Đại số (Tỉ lệ thức, đại lượng tỉ lệ thuận, nghịch) và Hình học (Các trường hợp bằng nhau của tam giác).',
    content: `# MA TRẬN & ĐỀ KIỂM TRA GIỮA HỌC KỲ II - TOÁN 7
Thời gian: 60 phút

### NỘI DUNG ĐÁNH GIÁ:
1. **Đại số**: Tỉ lệ thức, tính chất dãy tỉ số bằng nhau, giải bài toán chia tỉ lệ thực tế.
2. **Hình học**: Tổng ba góc tam giác, các trường hợp bằng nhau c.c.c, c.g.c, g.c.g, tam giác cân.`
  },
  {
    id: 'matran_de_toan_7_cuoiky2',
    title: 'Ma trận & Bản đặc tả Đề kiểm tra Cuối Học kỳ 2 Môn Toán Lớp 7: Biểu thức Đại số & Xác suất',
    categoryId: 'de_thi_matran',
    folderId: 'de_cuoiky_2',
    categoryName: '4. Ngân hàng Đề thi, Ma trận & Bản đặc tả Định kỳ',
    folderName: '📝 Đề & Ma trận Cuối học kỳ 2',
    subject: 'Toán học',
    grade: 'Lớp 7',
    tags: ['Cuối HK2', 'Toán 7', 'Đa thức', 'Xác suất biến cố', 'Hình khối'],
    fileType: 'docx',
    fileSize: '56.4 KB',
    isOfficialDirective: false,
    isFeatured: false,
    description: 'Đề kiểm tra Cuối năm Toán 7 tổng hợp kiến thức cả năm học, đặc biệt phần Đa thức một biến và Xác suất biến cố thực nghiệm.',
    content: `# MA TRẬN & ĐẶC TẢ ĐỀ KIỂM TRA CUỐI HỌC KỲ II - MÔN TOÁN 7
Thời gian: 90 phút

### CẤU TRÚC ĐỀ THI:
- Phần trắc nghiệm: 16 câu (4.0 điểm)
- Phần tự luận: 5 câu (6.0 điểm)
  - Bài 1 (1.5đ): Cộng, trừ, nhân, chia đa thức một biến.
  - Bài 2 (1.0đ): Tìm nghiệm của đa thức.
  - Bài 3 (1.0đ): Xác suất biến cố trong trò chơi xúc xắc / rút thẻ.
  - Bài 4 (2.0đ): Hình học tam giác và các đường đồng quy trong tam giác.
  - Bài 5 (0.5đ): Bài toán cực trị / giá trị lớn nhất, nhỏ nhất phân hóa học sinh giỏi.`
  },
  {
    id: 'de_thi_tuyensinh_10_hanoi_toan',
    title: 'Bộ Đề thi Luyện thi Tuyển sinh vào Lớp 10 THPT Môn Toán - Chuẩn Cấu trúc Sở GD&ĐT Hà Nội',
    categoryId: 'de_thi_matran',
    folderId: 'de_hsg_tuyensinh',
    categoryName: '4. Ngân hàng Đề thi, Ma trận & Bản đặc tả Định kỳ',
    folderName: '🏆 Đề thi HSG & Luyện thi vào Lớp 10',
    authorName: 'Thầy Cấn Văn Trường',
    schoolName: 'Trường THCS Phùng Khắc Khoan',
    subject: 'Toán học',
    grade: 'Lớp 9 ôn thi vào 10',
    tags: ['Thi vào 10', 'Hà Nội', 'Toán 9', 'Cấn Văn Trường', 'Đề thi chuẩn Sở', 'Có đáp án'],
    fileType: 'docx',
    fileSize: '78.9 KB',
    isOfficialDirective: false,
    isFeatured: true,
    description: 'Đề thi thử vào 10 chuẩn 5 bài tự luận Sở GD&ĐT Hà Nội (Rút gọn biểu thức, Giải toán lập PT, Hệ phương trình, Hình học tròn 3 ý, Bất đẳng thức cực trị).',
    content: `# KỲ THI TUYỂN SINH VÀO LỚP 10 THPT
MÔN THI: TOÁN HỌC - THỜI GIAN LÀM BÀI: 120 PHÚT
*(Đề thi chuẩn cấu trúc Sở Giáo dục và Đào tạo Hà Nội)*

### ĐỀ BÀI:
**Bài I (2.0 điểm):** Cho hai biểu thức $A = \\frac{\\sqrt{x}+4}{\\sqrt{x}-1}$ và $B = \\frac{3\\sqrt{x}+1}{x-1} - \\frac{2}{\\sqrt{x}-1}$ với $x \\ge 0, x \\ne 1$.
1) Tính giá trị của $A$ khi $x = 9$.
2) Rút gọn biểu thức $B$.
3) Tìm các giá trị của $x$ để biểu thức $P = \\frac{A}{B}$ nhận giá trị nguyên.

**Bài II (2.5 điểm):**
1) Giải bài toán bằng cách lập phương trình hoặc hệ phương trình (Toán chuyển động / năng suất).
2) Một chiếc nón lá có đường kính đáy $40\\text{ cm}$ và độ dài đường sinh $30\\text{ cm}$. Tính diện tích lá cần dùng để phủ kín mặt ngoài của nón.

**Bài III (1.5 điểm):**
1) Giải hệ phương trình: $\\begin{cases} \\frac{2}{x-1} + \\frac{1}{y+2} = 5 \\\\ \\frac{5}{x-1} - \\frac{3}{y+2} = 7 \\end{cases}$
2) Cho parabol $(P): y = x^2$ và đường thẳng $(d): y = 2mx - 2m + 1$. Tìm $m$ để $(d)$ cắt $(P)$ tại hai điểm phân biệt có hoành độ thỏa mãn $x_1^2 + x_2^2 = 10$.

**Bài IV (3.5 điểm):** Cho đường tròn $(O; R)$ và điểm $M$ nằm ngoài đường tròn. Kẻ hai tiếp tuyến $MA, MB$ và cát tuyến $MCD$...

**Bài V (0.5 điểm):** Cho các số thực dương $a, b, c$ thỏa mãn $a + b + c = 3$. Tìm giá trị nhỏ nhất của biểu thức:
$$Q = \\frac{a^3}{b+2c} + \\frac{b^3}{c+2a} + \\frac{c^3}{a+2b}$$`
  },

  // ==========================================
  // 5. INITIATIVES (SKKN)
  // ==========================================
  {
    id: 'skkn_ungdung_ai_toan',
    title: 'Sáng kiến Kinh nghiệm: Ứng dụng Trí tuệ Nhân tạo (Gemini AI & TikZ) trong Đổi mới Soạn giảng và Phân hóa Dạy học Môn Toán THCS',
    categoryId: 'skkn_chuyen_de',
    folderId: 'skkn_ai_cds',
    categoryName: '5. Sáng kiến Kinh nghiệm (SKKN) & Báo cáo Chuyên môn',
    folderName: '🤖 SKKN Ứng dụng AI & Chuyển đổi số trong Dạy học',
    authorName: 'Thầy Cấn Văn Trường',
    schoolName: 'Trường THCS Phùng Khắc Khoan',
    date: '2025 - 2026',
    subject: 'Toán học & Tin học',
    grade: 'THCS (Lớp 6 - 9)',
    tags: ['SKKN', 'AI trong dạy học', 'TikZ', 'Cấn Văn Trường', 'Đổi mới phương pháp', 'Đạt giải cao'],
    fileType: 'docx',
    fileSize: '76.5 KB',
    isOfficialDirective: false,
    isFeatured: true,
    description: 'Báo cáo sáng kiến kinh nghiệm cấp Thành phố về giải pháp xây dựng hệ sinh thái trợ lý AI sư phạm, hỗ trợ giáo viên tự động hóa thiết kế giáo án 5512, xuất đề thi phân hóa và vẽ hình toán học chuẩn LaTeX.',
    content: `# BÁO CÁO SÁNG KIẾN KINH NGHIỆM
**ĐỀ TÀI: ỨNG DỤNG HỆ THỐNG TRÍ TUỆ NHÂN TẠO (AI) VÀ ĐỒ HỌA TIKZ NHẰM NÂNG CAO HIỆU QUẢ SOẠN GIẢNG VÀ PHÂN HÓA HỌC SINH MÔN TOÁN THCS**

**Tác giả:** Thầy Cấn Văn Trường
**Đơn vị:** Trường THCS Phùng Khắc Khoan, xã Tây Phương, TP. Hà Nội
**Điện thoại/Zalo:** 0988.302.636

### I. TÍNH CẤP THIẾT CỦA ĐỀ TÀI
1. Giáo viên mất quá nhiều thời gian cho việc soạn thảo văn bản, thiết kế phiếu bài tập và vẽ hình học thủ công.
2. Nhu cầu phân hóa học sinh theo 4 mức độ của Chương trình GDPT 2018 đòi hỏi ngân hàng câu hỏi đa dạng và cập nhật liên tục.
3. Sự bùng nổ của Trí tuệ nhân tạo (Generative AI) mở ra cơ hội đột phá để nâng cao năng suất sư phạm của người thầy.

### II. CÁC BIỆN PHÁP THỰC HIỆN
1. **Biện pháp 1: Chuẩn hóa quy trình Prompting sư phạm theo tiến trình 4 hoạt động CV 5512.**
2. **Biện pháp 2: Ứng dụng công nghệ OCR Vision để trích xuất đề thi từ ảnh quét và chuyển đổi công thức Toán học sang LaTeX.**
3. **Biện pháp 3: Tích hợp thư viện đồ họa TikZ tạo hình vẽ sắc nét 100% chuẩn vector, không bị vỡ hạt khi phóng to hoặc in ấn.**
4. **Biện pháp 4: Xây dựng hệ thống học liệu âm thanh Text-to-Speech (TTS) hỗ trợ học sinh tự học tại nhà.**

### III. HIỆU QUẢ MANG LẠI
- Giảm 70% thời gian chuẩn bị giáo án cho giáo viên.
- 100% tài liệu xuất ra đạt chuẩn quy cách văn bản Bộ GD&ĐT.
- Học sinh hứng thú học tập hơn qua các hình ảnh trực quan và trò chơi học tập sinh động.`
  },
  {
    id: 'skkn_phuong_phap_tram_manh_ghep',
    title: 'Sáng kiến Kinh nghiệm: Vận dụng Kỹ thuật Mảnh ghép & Dạy học theo Trạm trong Môn Toán 7 nhằm Phát huy Tính Tích cực',
    categoryId: 'skkn_chuyen_de',
    folderId: 'skkn_pp_tichcuc',
    categoryName: '5. Sáng kiến Kinh nghiệm (SKKN) & Báo cáo Chuyên môn',
    folderName: '💡 SKKN Đổi mới Phương pháp & Kỹ thuật Dạy học',
    authorName: 'Thầy Cấn Văn Trường',
    schoolName: 'Trường THCS Phùng Khắc Khoan',
    subject: 'Toán học',
    grade: 'Lớp 7',
    tags: ['SKKN', 'Kỹ thuật mảnh ghép', 'Dạy học theo trạm', 'Phương pháp tích cực'],
    fileType: 'docx',
    fileSize: '65.2 KB',
    isOfficialDirective: false,
    isFeatured: false,
    description: 'Quy trình tổ chức các trạm học tập độc lập và kỹ thuật mảnh ghép (Vòng chuyên sâu - Vòng mảnh ghép) giúp học sinh làm chủ kiến thức Hình học và Đại số.',
    content: `# SÁNG KIẾN KINH NGHIỆM: VẬN DỤNG DẠY HỌC THEO TRẠM VÀ KỸ THUẬT MẢNH GHÉP TRONG MÔN TOÁN 7

### I. NGUYÊN LÝ DẠY HỌC THEO TRẠM:
- Lớp học được chia thành 4 trạm: Trạm Khám phá, Trạm Luyện tập, Trạm Ứng dụng thực tế, Trạm Thử thách nâng cao.
- Học sinh di chuyển luân phiên giữa các trạm theo kim đồng hồ, tự giải quyết phiếu học tập và tự chấm điểm chéo.`
  },
  {
    id: 'skkn_boiduong_hsg_toan_9',
    title: 'Sáng kiến Kinh nghiệm: Phương pháp Bồi dưỡng Học sinh Giỏi Toán 9 Chuyên đề Bất đẳng thức & Cực trị Đại số',
    categoryId: 'skkn_chuyen_de',
    folderId: 'skkn_boiduong_hsg',
    categoryName: '5. Sáng kiến Kinh nghiệm (SKKN) & Báo cáo Chuyên môn',
    folderName: '🌟 SKKN Bồi dưỡng Học sinh Giỏi & Phụ đạo',
    authorName: 'Thầy Cấn Văn Trường',
    schoolName: 'Trường THCS Phùng Khắc Khoan',
    subject: 'Toán học',
    grade: 'Lớp 9',
    tags: ['SKKN', 'Bồi dưỡng HSG', 'Bất đẳng thức Cauchy', 'Schwarz', 'Toán 9'],
    fileType: 'docx',
    fileSize: '71.8 KB',
    isOfficialDirective: false,
    isFeatured: false,
    description: 'Hệ thống hóa các kỹ thuật chứng minh Bất đẳng thức nâng cao: Kỹ thuật chọn điểm rơi Cauchy, Bất đẳng thức Cauchy-Schwarz (Bunhiacopxki dạng phân thức), đổi biến và dồn biến.',
    content: `# CHUYÊN ĐỀ BỒI DƯỠNG HỌC SINH GIỎI: BẤT ĐẲNG THỨC VÀ CỰC TRỊ ĐẠI SỐ
Tác giả: Thầy Cấn Văn Trường

### CÁC KỸ THUẬT CỐT LÕI:
1. **Kỹ thuật chọn điểm rơi trong BĐT AM-GM (Cauchy)**
2. **Kỹ thuật thêm bớt hạng tử và đánh giá từ mẫu lên tử**
3. **Bất đẳng thức Cauchy-Schwarz dạng cộng mẫu số (BĐT Engel)**:
   $$\\frac{x_1^2}{a_1} + \\frac{x_2^2}{a_2} + \\dots + \\frac{x_n^2}{a_n} \\ge \\frac{(x_1 + x_2 + \\dots + x_n)^2}{a_1 + a_2 + \\dots + a_n}$$`
  },

  // ==========================================
  // 6. TIKZ & GRAPHICS & MEDIA
  // ==========================================
  {
    id: 'tikz_mau_hinh_chop_tam_giac',
    title: 'Thư viện Mã TikZ Chuẩn: Hình chóp Tam giác đều & Hình chóp Tứ giác đều (Không gian 3D)',
    categoryId: 'tikz_mindmap_media',
    folderId: 'tikz_hinhhoc',
    categoryName: '6. Thư viện Mã TikZ Chuẩn, Sơ đồ Tư duy & Kịch bản Game',
    folderName: '📐 Thư viện Code TikZ Hình học & Đồ thị',
    subject: 'Toán học (Hình học)',
    grade: 'Lớp 8 - 12',
    tags: ['TikZ', 'Hình không gian', 'Hình chóp', 'Vector SVG', 'Toán 8', 'Toán 11'],
    fileType: 'tikz',
    fileSize: '12.4 KB',
    isOfficialDirective: false,
    isFeatured: false,
    description: 'Code TikZ vẽ hình chóp tam giác đều $S.ABC$ có đường cao $SO$, các nét đứt nét liền chuẩn xác theo quy tắc vẽ hình không gian.',
    content: `\\begin{tikzpicture}[scale=1.2, line join=round, line cap=round, >=stealth]
  % Định nghĩa tọa độ các đỉnh đáy tam giác ABC
  \\coordinate (A) at (0,0);
  \\coordinate (B) at (1.5,-1.2);
  \\coordinate (C) at (4.5,0);
  
  % Tọa độ trọng tâm O của tam giác ABC
  \\coordinate (M) at ($(B)!0.5!(C)$);
  \\coordinate (O) at ($(A)!2/3!(M)$);
  
  % Đỉnh chóp S trên phương thẳng đứng từ O
  \\coordinate (S) at ($(O)+(0,3.8)$);
  
  % Vẽ các đoạn thẳng nét đứt bên trong
  \\draw[dashed, thick] (A) -- (C);
  \\draw[dashed, thick] (S) -- (O);
  \\draw[dashed] (A) -- (M);
  
  % Vẽ các đoạn thẳng nét liền bên ngoài
  \\draw[thick] (S) -- (A);
  \\draw[thick] (S) -- (B);
  \\draw[thick] (S) -- (C);
  \\draw[thick] (A) -- (B) -- (C);
  
  % Đánh dấu góc vuông tại chân đường cao O
  \\draw[dashed] ($(O)+(0,0.25)$) -- ($(O)+(0.25,0.25)$) -- ($(O)+(0.25,0)$);
  
  % Ghi nhãn các điểm
  \\node[above] at (S) {$S$};
  \\node[left] at (A) {$A$};
  \\node[below] at (B) {$B$};
  \\node[right] at (C) {$C$};
  \\node[below right] at (O) {$O$};
  \\node[below right] at (M) {$M$};
  
  % Đánh dấu chấm tròn các đỉnh
  \\fill (S) circle (1.5pt);
  \\fill (A) circle (1.5pt);
  \\fill (B) circle (1.5pt);
  \\fill (C) circle (1.5pt);
  \\fill (O) circle (1.5pt);
\\end{tikzpicture}`
  },
  {
    id: 'mindmap_he_thong_hoa_hinh_hoc_7',
    title: 'Sơ đồ Tư duy (Mindmap): Hệ thống hóa Kiến thức Tam giác bằng nhau & Các đường đồng quy',
    categoryId: 'tikz_mindmap_media',
    folderId: 'mindmap_tomtat',
    categoryName: '6. Thư viện Mã TikZ Chuẩn, Sơ đồ Tư duy & Kịch bản Game',
    folderName: '🧠 Sơ đồ Tư duy Tóm tắt Kiến thức',
    subject: 'Toán học',
    grade: 'Lớp 7',
    tags: ['Mindmap', 'Sơ đồ tư duy', 'Hình học 7', 'Tam giác', 'Đường đồng quy'],
    fileType: 'docx',
    fileSize: '35.4 KB',
    isOfficialDirective: false,
    isFeatured: false,
    description: 'Sơ đồ tư duy cấu trúc dạng cây tóm tắt toàn bộ 3 trường hợp bằng nhau của tam giác thường, 4 trường hợp tam giác vuông và 4 đường đồng quy (trọng tâm, trực tâm, tâm đường tròn ngoại tiếp, nội tiếp).',
    content: `# SƠ ĐỒ TƯ DUY TÓM TẮT HÌNH HỌC 7

### 1. CÁC TRƯỜNG HỢP BẰNG NHAU CỦA TAM GIÁC:
- **Tam giác thường**: c-c-c (cạnh-cạnh-cạnh), c-g-c (cạnh-góc-cạnh), g-c-g (góc-cạnh-góc).
- **Tam giác vuông**: 2 cạnh góc vuông, cạnh góc vuông - góc nhọn kề, cạnh huyền - góc nhọn, cạnh huyền - cạnh góc vuông.

### 2. BỐN ĐƯỜNG ĐỒNG QUY TRONG TAM GIÁC:
- **3 Đường Trung tuyến**: Cắt nhau tại Trọng tâm $G$ ($AG = \\frac{2}{3} AM$).
- **3 Đường Phân giác**: Cắt nhau tại điểm $I$ cách đều 3 cạnh (Tâm đường tròn nội tiếp).
- **3 Đường Trung trực**: Cắt nhau tại điểm $O$ cách đều 3 đỉnh (Tâm đường tròn ngoại tiếp).
- **3 Đường Cao**: Cắt nhau tại Trực tâm $H$.`
  },
  {
    id: 'game_rung_chuong_vang_toan',
    title: 'Kịch bản Trò chơi Học tập Khởi động: "Rung Chuông Vàng Toán Học" (PowerPoint & Tương tác)',
    categoryId: 'tikz_mindmap_media',
    folderId: 'kichban_game',
    categoryName: '6. Thư viện Mã TikZ Chuẩn, Sơ đồ Tư duy & Kịch bản Game',
    folderName: '🎮 Kịch bản Trò chơi Khởi động & PowerPoint',
    subject: 'Toán học',
    grade: 'Lớp 6 - 9',
    tags: ['Game học tập', 'Rung chuông vàng', 'Khởi động', 'PowerPoint', 'Trắc nghiệm nhanh'],
    fileType: 'pptx',
    fileSize: '88.5 KB',
    isOfficialDirective: false,
    isFeatured: false,
    description: 'Bộ câu hỏi và kịch bản 15 câu trắc nghiệm khởi động nhanh có đếm ngược thời gian 15 giây, âm thanh hiệu ứng hào hứng dành cho tiết ôn tập chương.',
    content: `# KỊCH BẢN GAME: RUNG CHUÔNG VÀNG TOÁN HỌC
Thời lượng: 7 - 10 phút khởi động

### QUY TẮC TRÒ CHƠI:
- Mỗi học sinh chuẩn bị bảng con hoặc giơ thẻ màu A, B, C, D.
- Mỗi câu hỏi có 15 giây suy nghĩ. Trả lời đúng được ở lại sàn đấu, trả lời sai bị loại tạm thời.
- Có 1 quyền cứu trợ từ Thầy/Cô chủ nhiệm!`
  }
];
