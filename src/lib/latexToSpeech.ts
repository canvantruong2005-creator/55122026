/**
 * Chuyển đổi công thức Toán học LaTeX, ký hiệu khoa học, kịch bản truyện tranh, bảng biểu và văn bản sư phạm
 * sang Tiếng Việt chuẩn giọng đọc tự nhiên cho Text-to-Speech (TTS).
 * 
 * ĐẶC BIỆT:
 * 1. TUYỆT ĐỐI KHÔNG đọc mã prompt hình ảnh (Visual AI Prompt), mô tả kỹ thuật, thẻ HTML (<br>, <p>, <b>...).
 * 2. Gạch đầu dòng (-) được làm sạch tự nhiên, KHÔNG BAO GIỜ đọc thành "dấu bé bi a", "dấu trừ", hay "gạch nối".
 * 3. Dấu so sánh toán học (<, >) đọc chuẩn xác là "nhỏ hơn", "lớn hơn", KHÔNG đọc là "dấu bé", "dấu lớn".
 * 4. Đọc chuẩn xác các công thức toán: Tỉ số, tỉ lệ thức (a:b = c:d, a/b = c/d), phân số, căn thức, điều kiện b != 0, tập hợp số, hình học, lượng giác, tích phân...
 * 5. Chuẩn hóa đơn vị đo lường (cm2, km/h, kg, °C, W, V...), chữ cái Hy Lạp (alpha, beta, delta...), công thức hóa học (H2O, CO2...).
 * 6. Không phát âm ký tự rác: "sao sao", "thăng thăng", "hai chấm hai chấm", "dfrac", "frac"...
 */

export function convertLatexToSpokenVietnamese(text: string): string {
  if (!text) return '';
  let s = text;

  // =========================================================================
  // 0. LOẠI BỎ TRIỆT ĐỂ TOÀN BỘ THẺ HTML, MÃ PROMPT TẠO ẢNH & METADATA KỸ THUẬT
  // =========================================================================

  // 0.1. Chuyển đổi toàn bộ thẻ ngắt dòng / phân đoạn HTML thành dấu xuống dòng (\n)
  // (Khắc phục triệt để lỗi <br>, <br/> bị đọc thành "dấu bé bi a" / "dấu bé bê rờ")
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/?(?:p|div|section|article|li|tr|hr)\s*[^>]*>/gi, '\n');
  s = s.replace(/<\/?(?:td|th)\s*[^>]*>/gi, ' ');
  s = s.replace(/<[^>]+>/g, ' '); // Xóa sạch mọi thẻ HTML còn lại: <b>, </b>, <i>, <span>...

  // 0.2. Chuyển đổi toàn bộ HTML entities
  s = s.replace(/&nbsp;|&emsp;|&ensp;/gi, ' ');
  s = s.replace(/&lt;/gi, ' nhỏ hơn ');
  s = s.replace(/&gt;/gi, ' lớn hơn ');
  s = s.replace(/&le;/gi, ' nhỏ hơn hoặc bằng ');
  s = s.replace(/&ge;/gi, ' lớn hơn hoặc bằng ');
  s = s.replace(/&ne;/gi, ' khác ');
  s = s.replace(/&plusmn;/gi, ' cộng trừ ');
  s = s.replace(/&times;/gi, ' nhân ');
  s = s.replace(/&divide;/gi, ' chia ');
  s = s.replace(/&amp;/gi, ' và ');
  s = s.replace(/&quot;|&apos;|&#39;/gi, ' ');
  s = s.replace(/&deg;/gi, ' độ ');
  s = s.replace(/&pi;/gi, ' pi ');
  s = s.replace(/&alpha;/gi, ' an-pha ');
  s = s.replace(/&beta;/gi, ' bê-ta ');
  s = s.replace(/&gamma;/gi, ' ga-ma ');
  s = s.replace(/&delta;/gi, ' đen-ta ');

  // 0.3. Xóa các khối code markdown ```...```
  s = s.replace(/```[\s\S]*?```/g, ' ');

  // 0.4. Xóa tikzpicture và hình vẽ raw
  s = s.replace(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g, ' hình vẽ minh họa ');
  s = s.replace(/\[\s*HÌNH[_\s]?(?:VẼ|ẢNH)\s+MINH\s+HỌA.*?\]/gi, ' hình vẽ minh họa ');
  s = s.replace(/\[.*?GIÁO\s+VIÊN\s+CHÈN.*?\]/gi, ' ');
  s = s.replace(/\[.*?CHÈN.*?\]/gi, ' ');

  // 0.5. Xóa các dòng/đoạn Mô tả hình ảnh (Visual AI Prompt), Visual Prompt, Prompt kỹ thuật:
  s = s.replace(/\*\*(?:Mô tả hình ảnh|Visual AI Prompt|Hình ảnh minh họa|Visual Prompt|Prompt Minh Họa|Prompt)\s*(?:\([^)]*\))?\s*:\*\*[\s\S]*?(?=\*\*(?:Lời dẫn|Lời thoại|💡|Kiến thức|Bí kíp|Nhân vật|Phân cảnh|Bước|Hoạt động)|###|##|$)/gi, ' ');
  s = s.replace(/(?:Mô tả hình ảnh|Visual AI Prompt|Visual Prompt|Prompt):\s*[^\n]+(?:\n[^\n]+)?(?=\n\s*(?:Lời dẫn|Lời thoại|💡|Kiến thức|Phân cảnh|Bước|Hoạt động|\*\*|$))/gi, ' ');
  s = s.replace(/\(Visual AI Prompt\)/gi, ' ');
  s = s.replace(/\(Tấm truyện tranh giáo dục[^\)]*\)/gi, ' ');
  s = s.replace(/\(Educational comic panel[^\)]*\)/gi, ' ');
  s = s.replace(/\(Ảnh minh họa[^\)]*\)/gi, ' ');

  // =========================================================================
  // 1. CHUẨN HÓA CẤU TRÚC SƯ PHẠM, KỊCH BẢN, THƠ, PHÂN CẢNH, TIẾN TRÌNH 4 BƯỚC
  // =========================================================================

  // 1.0. SỬA LỖI CHÍNH TẢ, GÕ SAI DẤU, LỖI PHỔ BIẾN TRONG VĂN BẢN SƯ PHẠM & TOÁN HỌC
  const typoCorrections: [RegExp, string][] = [
    [/\bphiếu\s+lưu\b/gi, 'phiêu lưu'],
    [/\bphiê\s*['´’‘`]?\s*u\s+lưu\b/gi, 'phiêu lưu'],
    [/\bv[íiì]\s*d[ụu]c\b/gi, 'ví dụ'],
    [/\bki[ểe]m\s+ta\b/gi, 'kiểm tra'],
    [/\bs[ửu]\s*l[ýyí]\b/gi, 'xử lý'],
    [/\bm[Ôô]c\s+tiêu\b/gi, 'mục tiêu'],
    [/\bm[ụôu]c\s+tiêu\s*:\s*/gi, 'mục tiêu: '],
    [/\bkế\s+hoach\b/gi, 'kế hoạch'],
    [/\bkế\s+hoặch\b/gi, 'kế hoạch'],
    [/\bnhi[êe]m\s+vụ\b/gi, 'nhiệm vụ'],
    [/\bnhiệm\s+vu\b/gi, 'nhiệm vụ'],
    [/\bth[ựu]c\s+hi[êe]n\b/gi, 'thực hiện'],
    [/\bthực\s+hiên\b/gi, 'thực hiện'],
    [/\bho[ạa]t\s+đ[ôo]ng\b/gi, 'hoạt động'],
    [/\bhoạt\s+đông\b/gi, 'hoạt động'],
    [/\bkhởi\s+đ[ôo]ng\b/gi, 'khởi động'],
    [/\bluy[ệe]n\s+t[ậa]p\b/gi, 'luyện tập'],
    [/\bv[ậa]n\s+d[ụu]ng\b/gi, 'vận dụng'],
    [/\bk[ếe]t\s+lu[ậa]n\b/gi, 'kết luận'],
    [/\bth[ảa]o\s+lu[ậa]n\b/gi, 'thảo luận'],
    [/\bhướng\s+d[ảa]n\b/gi, 'hướng dẫn'],
    [/\bphát\s+tri[ểe]n\b/gi, 'phát triển'],
    [/\bngiệm\b/gi, 'nghiệm'],
    [/\bngiệm\s+của\b/gi, 'nghiệm của'],
    [/\bphương\s+tr[iì]nh\b/gi, 'phương trình'],
    [/\bbất\s+phương\s+tr[iì]nh\b/gi, 'bất phương trình'],
    [/\bđẳng\s+th[ứu]c\b/gi, 'đẳng thức'],
    [/\bbình\s+phuơng\b/gi, 'bình phương'],
    [/\bcăn\s+thức\s+b[ặa]c\s+hai\b/gi, 'căn thức bậc hai'],
    [/\bphần\s+số\b(?=\s+(?:tối\s+giản|bằng|có|và|dương|âm|đại\s+số|thập\s+phân))/gi, 'phân số'],
    [/\btập\s+hơp\b/gi, 'tập hợp'],
    [/\bphần\s+tử\s+thuôc\b/gi, 'phần tử thuộc'],
    [/\bhọc\s+sin\b/gi, 'học sinh'],
    [/\bgiáo\s+viên\s*:\s*/gi, 'giáo viên: '],
    [/\bhọc\s+sinh\s*:\s*/gi, 'học sinh: ']
  ];

  for (const [pattern, replacement] of typoCorrections) {
    s = s.replace(pattern, replacement);
  }

  // 1.1. PHÂN BIỆT VÀ CHUYỂN ĐỔI CHUẨN XÁC SỐ LA MÃ VÀ CHỮ CÁI
  // A. Đề mục lớn đầu dòng: I. II. III. IV. V. VI. VII. VIII. IX. X. XI. XII.
  s = s.replace(/(?:^|\n)\s*(?:#{1,4}\s*|\*{0,2})XII\.\s*([^\n*]+)(?:\*\*)?/gim, '\n Mười hai La Mã: $1. \n');
  s = s.replace(/(?:^|\n)\s*(?:#{1,4}\s*|\*{0,2})XI\.\s*([^\n*]+)(?:\*\*)?/gim, '\n Mười một La Mã: $1. \n');
  s = s.replace(/(?:^|\n)\s*(?:#{1,4}\s*|\*{0,2})X\.\s*([^\n*]+)(?:\*\*)?/gim, '\n Mười La Mã: $1. \n');
  s = s.replace(/(?:^|\n)\s*(?:#{1,4}\s*|\*{0,2})IX\.\s*([^\n*]+)(?:\*\*)?/gim, '\n Chín La Mã: $1. \n');
  s = s.replace(/(?:^|\n)\s*(?:#{1,4}\s*|\*{0,2})VIII\.\s*([^\n*]+)(?:\*\*)?/gim, '\n Tám La Mã: $1. \n');
  s = s.replace(/(?:^|\n)\s*(?:#{1,4}\s*|\*{0,2})VII\.\s*([^\n*]+)(?:\*\*)?/gim, '\n Bảy La Mã: $1. \n');
  s = s.replace(/(?:^|\n)\s*(?:#{1,4}\s*|\*{0,2})VI\.\s*([^\n*]+)(?:\*\*)?/gim, '\n Sáu La Mã: $1. \n');
  s = s.replace(/(?:^|\n)\s*(?:#{1,4}\s*|\*{0,2})V\.\s*([^\n*]+)(?:\*\*)?/gim, '\n Năm La Mã: $1. \n');
  s = s.replace(/(?:^|\n)\s*(?:#{1,4}\s*|\*{0,2})IV\.\s*([^\n*]+)(?:\*\*)?/gim, '\n Bốn La Mã: $1. \n');
  s = s.replace(/(?:^|\n)\s*(?:#{1,4}\s*|\*{0,2})III\.\s*([^\n*]+)(?:\*\*)?/gim, '\n Ba La Mã: $1. \n');
  s = s.replace(/(?:^|\n)\s*(?:#{1,4}\s*|\*{0,2})II\.\s*([^\n*]+)(?:\*\*)?/gim, '\n Hai La Mã: $1. \n');
  s = s.replace(/(?:^|\n)\s*(?:#{1,4}\s*|\*{0,2})I\.\s*([^\n*]+)(?:\*\*)?/gim, '\n Một La Mã: $1. \n');

  // B. Danh từ đi kèm số La Mã (Phần I, Mục II, Chương III, Tiết IV, Bảng V, Thế kỷ XXI...)
  s = s.replace(/\b(?:Phần|phần|PHẦN)\s+XII\b/g, 'Phần mười hai La Mã');
  s = s.replace(/\b(?:Phần|phần|PHẦN)\s+XI\b/g, 'Phần mười một La Mã');
  s = s.replace(/\b(?:Phần|phần|PHẦN)\s+X\b/g, 'Phần mười La Mã');
  s = s.replace(/\b(?:Phần|phần|PHẦN)\s+IX\b/g, 'Phần chín La Mã');
  s = s.replace(/\b(?:Phần|phần|PHẦN)\s+VIII\b/g, 'Phần tám La Mã');
  s = s.replace(/\b(?:Phần|phần|PHẦN)\s+VII\b/g, 'Phần bảy La Mã');
  s = s.replace(/\b(?:Phần|phần|PHẦN)\s+VI\b/g, 'Phần sáu La Mã');
  s = s.replace(/\b(?:Phần|phần|PHẦN)\s+V\b/g, 'Phần năm La Mã');
  s = s.replace(/\b(?:Phần|phần|PHẦN)\s+IV\b/g, 'Phần bốn La Mã');
  s = s.replace(/\b(?:Phần|phần|PHẦN)\s+III\b/g, 'Phần ba La Mã');
  s = s.replace(/\b(?:Phần|phần|PHẦN)\s+II\b/g, 'Phần hai La Mã');
  s = s.replace(/\b(?:Phần|phần|PHẦN)\s+I\b/g, 'Phần một La Mã');

  s = s.replace(/\b(?:Mục|mục|MỤC)\s+X\b/g, 'Mục mười La Mã');
  s = s.replace(/\b(?:Mục|mục|MỤC)\s+IX\b/g, 'Mục chín La Mã');
  s = s.replace(/\b(?:Mục|mục|MỤC)\s+VIII\b/g, 'Mục tám La Mã');
  s = s.replace(/\b(?:Mục|mục|MỤC)\s+VII\b/g, 'Mục bảy La Mã');
  s = s.replace(/\b(?:Mục|mục|MỤC)\s+VI\b/g, 'Mục sáu La Mã');
  s = s.replace(/\b(?:Mục|mục|MỤC)\s+V\b/g, 'Mục năm La Mã');
  s = s.replace(/\b(?:Mục|mục|MỤC)\s+IV\b/g, 'Mục bốn La Mã');
  s = s.replace(/\b(?:Mục|mục|MỤC)\s+III\b/g, 'Mục ba La Mã');
  s = s.replace(/\b(?:Mục|mục|MỤC)\s+II\b/g, 'Mục hai La Mã');
  s = s.replace(/\b(?:Mục|mục|MỤC)\s+I\b/g, 'Mục một La Mã');

  s = s.replace(/\b(?:Chương|chương|CHƯƠNG)\s+X\b/g, 'Chương mười La Mã');
  s = s.replace(/\b(?:Chương|chương|CHƯƠNG)\s+IX\b/g, 'Chương chín La Mã');
  s = s.replace(/\b(?:Chương|chương|CHƯƠNG)\s+VIII\b/g, 'Chương tám La Mã');
  s = s.replace(/\b(?:Chương|chương|CHƯƠNG)\s+VII\b/g, 'Chương bảy La Mã');
  s = s.replace(/\b(?:Chương|chương|CHƯƠNG)\s+VI\b/g, 'Chương sáu La Mã');
  s = s.replace(/\b(?:Chương|chương|CHƯƠNG)\s+V\b/g, 'Chương năm La Mã');
  s = s.replace(/\b(?:Chương|chương|CHƯƠNG)\s+IV\b/g, 'Chương bốn La Mã');
  s = s.replace(/\b(?:Chương|chương|CHƯƠNG)\s+III\b/g, 'Chương ba La Mã');
  s = s.replace(/\b(?:Chương|chương|CHƯƠNG)\s+II\b/g, 'Chương hai La Mã');
  s = s.replace(/\b(?:Chương|chương|CHƯƠNG)\s+I\b/g, 'Chương một La Mã');

  s = s.replace(/\b(?:Bảng|bảng|BẢNG)\s+IV\b/g, 'Bảng bốn La Mã');
  s = s.replace(/\b(?:Bảng|bảng|BẢNG)\s+III\b/g, 'Bảng ba La Mã');
  s = s.replace(/\b(?:Bảng|bảng|BẢNG)\s+II\b/g, 'Bảng hai La Mã');
  s = s.replace(/\b(?:Bảng|bảng|BẢNG)\s+I\b/g, 'Bảng một La Mã');

  s = s.replace(/\b(?:Tiết|tiết|TIẾT)\s+IV\b/g, 'Tiết bốn La Mã');
  s = s.replace(/\b(?:Tiết|tiết|TIẾT)\s+III\b/g, 'Tiết ba La Mã');
  s = s.replace(/\b(?:Tiết|tiết|TIẾT)\s+II\b/g, 'Tiết hai La Mã');
  s = s.replace(/\b(?:Tiết|tiết|TIẾT)\s+I\b/g, 'Tiết một La Mã');

  // C. Thế kỷ La Mã
  s = s.replace(/\b(?:thế\s+k[ỷỉ]|Thế\s+k[ỷỉ])\s+XXI\b/gi, 'thế kỷ hai mươi mốt');
  s = s.replace(/\b(?:thế\s+k[ỷỉ]|Thế\s+k[ỷỉ])\s+XX\b/gi, 'thế kỷ hai mươi');
  s = s.replace(/\b(?:thế\s+k[ỷỉ]|Thế\s+k[ỷỉ])\s+XIX\b/gi, 'thế kỷ mười chín');
  s = s.replace(/\b(?:thế\s+k[ỷỉ]|Thế\s+k[ỷỉ])\s+XVIII\b/gi, 'thế kỷ mười tám');
  s = s.replace(/\b(?:thế\s+k[ỷỉ]|Thế\s+k[ỷỉ])\s+XVII\b/gi, 'thế kỷ mười bảy');
  s = s.replace(/\b(?:thế\s+k[ỷỉ]|Thế\s+k[ỷỉ])\s+XVI\b/gi, 'thế kỷ mười sáu');
  s = s.replace(/\b(?:thế\s+k[ỷỉ]|Thế\s+k[ỷỉ])\s+XV\b/gi, 'thế kỷ mười lăm');
  s = s.replace(/\b(?:thế\s+k[ỷỉ]|Thế\s+k[ỷỉ])\s+X\b/gi, 'thế kỷ mười');
  s = s.replace(/\b(?:thế\s+k[ỷỉ]|Thế\s+k[ỷỉ])\s+IX\b/gi, 'thế kỷ chín');
  s = s.replace(/\b(?:thế\s+k[ỷỉ]|Thế\s+k[ỷỉ])\s+I\b/gi, 'thế kỷ một');

  // D. Số La Mã trong ngoặc đơn: (I), (II), (III), (IV), (V)...
  s = s.replace(/\(\s*I\s*\)/g, '(Một La Mã)');
  s = s.replace(/\(\s*II\s*\)/g, '(Hai La Mã)');
  s = s.replace(/\(\s*III\s*\)/g, '(Ba La Mã)');
  s = s.replace(/\(\s*IV\s*\)/g, '(Bốn La Mã)');
  s = s.replace(/\(\s*V\s*\)/g, '(Năm La Mã)');
  s = s.replace(/\(\s*VI\s*\)/g, '(Sáu La Mã)');
  s = s.replace(/\(\s*VII\s*\)/g, '(Bảy La Mã)');
  s = s.replace(/\(\s*VIII\s*\)/g, '(Tám La Mã)');
  s = s.replace(/\(\s*IX\s*\)/g, '(Chín La Mã)');
  s = s.replace(/\(\s*X\s*\)/g, '(Mười La Mã)');

  // Tiêu đề & Cấu trúc Thơ Sư phạm
  s = s.replace(/###\s*(?:📜\s*)?(?:NỘI DUNG BÀI THƠ|BÀI THƠ|LỤC BÁT|BỐN CHỮ|NĂM CHỮ)\s*/gi, '\n Bài thơ: \n');
  s = s.replace(/###\s*(?:🧠\s*)?(?:Ý NGHĨA SƯ PHẠM[^\n]*)/gi, '\n Ý nghĩa sư phạm và khắc sâu kiến thức: \n');
  s = s.replace(/###\s*(?:🎭\s*)?(?:HƯỚNG DẪN TỔ CHỨC[^\n]*)/gi, '\n Hướng dẫn tổ chức hoạt động: \n');

  // Tiêu đề Phân cảnh kịch bản truyện tranh
  s = s.replace(/###\s*(?:🖼️|PHÂN CẢNH|KHUNG HÌNH|PANEL|TRANG|TRUYỆN|CẢNH)\s*(\d+)?:?\s*([^\n]+)/gi, '\n Phân cảnh $1: $2. \n');

  // Lời dẫn chuyện & Lời thoại nhân vật
  s = s.replace(/\*\*(?:Lời dẫn truyện|Narrator|Lời dẫn|Dẫn chuyện)\s*(?:\([^)]*\))?\s*:\*\*/gi, '\n Lời người dẫn: ');
  s = s.replace(/(?:^|\n)\s*(?:Lời dẫn truyện|Narrator|Lời dẫn|Dẫn chuyện)\s*(?:\([^)]*\))?\s*:\s*/gi, '\n Lời người dẫn: ');
  s = s.replace(/\*\*(?:Lời thoại nhân vật|Dialogue|Lời thoại|Nhân vật nói)\s*(?:\([^)]*\))?\s*:\*\*/gi, '\n');
  s = s.replace(/(?:^|\n)\s*(?:Lời thoại nhân vật|Dialogue|Lời thoại|Nhân vật nói)\s*(?:\([^)]*\))?\s*:\s*/gi, '\n');
  s = s.replace(/(?:^|\n)\s*([A-ZÀ-Ỹa-zà-ỹ0-9_ ]+):\*\*\s*/g, '\n $1 nói: ');

  // Kiến thức cốt lõi & Ghi nhớ
  s = s.replace(/\*\*(?:💡\s*)?(?:Kiến thức cốt lõi|Kiến thức trọng tâm|Bí kíp ghi nhớ|Ghi nhớ|Tổng kết)\s*:\*\*/gi, '\n Kiến thức cốt lõi: ');
  s = s.replace(/##\s*(?:🌟\s*)?BẢNG TỔNG KẾT BÀI HỌC VÀ THÔNG ĐIỆP GHI NHỚ/gi, '\n Tổng kết bài học và thông điệp ghi nhớ: \n');

  // 4 Hoạt động chuẩn CV 5512
  s = s.replace(/\*\*(?:1\.\s*)?HOẠT\s*ĐỘNG\s*KHỞI\s*ĐỘNG[^*]*\*\*/gi, '\n Hoạt động 1: Khởi động. \n');
  s = s.replace(/\*\*(?:2\.\s*)?HOẠT\s*ĐỘNG\s*HÌNH\s*THÀNH\s*KIẾN\s*THỨC\s*MỚI[^*]*\*\*/gi, '\n Hoạt động 2: Hình thành kiến thức mới. \n');
  s = s.replace(/\*\*(?:3\.\s*)?HOẠT\s*ĐỘNG\s*LUYỆN\s*TẬP[^*]*\*\*/gi, '\n Hoạt động 3: Luyện tập. \n');
  s = s.replace(/\*\*(?:4\.\s*)?HOẠT\s*ĐỘNG\s*VẬN\s*DỤNG[^*]*\*\*/gi, '\n Hoạt động 4: Vận dụng. \n');

  // 4 Bước sư phạm chuẩn
  s = s.replace(/\*\*Bước\s*1\s*:\s*Giao\s*nhiệm\s*vụ\s*học\s*tập\s*:\*\*/gi, '\n Bước 1: Giao nhiệm vụ học tập. ');
  s = s.replace(/\*\*Bước\s*2\s*:\s*Thực\s*hiện\s*nhiệm\s*vụ\s*:\*\*/gi, '\n Bước 2: Thực hiện nhiệm vụ. ');
  s = s.replace(/\*\*Bước\s*3\s*:\s*Báo\s*cáo[,\s]+thảo\s*luận\s*:\*\*/gi, '\n Bước 3: Báo cáo thảo luận. ');
  s = s.replace(/\*\*Bước\s*4\s*:\s*Kết\s*luận[,\s]+nhận\s*định\s*:\*\*/gi, '\n Bước 4: Kết luận nhận định. ');
  s = s.replace(/(?:^|\n)\s*(?:Bước|BƯỚC)\s*(\d+)[:.]\s*/gi, '\n Bước $1: ');
  s = s.replace(/(?:^|\n)\s*(?:Hoạt động|HOẠT ĐỘNG)\s*([A-D\d]+)[:.]\s*/gi, '\n Hoạt động $1: ');

  // Câu hỏi trắc nghiệm & danh sách ý A., B., C., D. hoặc a), b), c), d)
  s = s.replace(/(?:^|\n)\s*([A-D])\.\s+/g, '\n Lựa chọn $1: ');
  s = s.replace(/(?:^|\n|\s)\(([a-d])\)\s+/g, ' Ý $1: ');
  s = s.replace(/(?:^|\n|\s)([a-d])\)\s+/g, ' Ý $1: ');

  // =========================================================================
  // 2. LÀM SẠCH DẤU GẠCH ĐẦU DÒNG (-), DÃY SỐ, KHOẢNG THỜI GIAN / TIẾT HỌC
  // =========================================================================

  // Xóa các dòng kẻ bảng và phân cách Markdown
  s = s.replace(/^[ \t]*(?:[-=*_~]){2,}[ \t]*$/gm, ' ');
  s = s.replace(/\|[ \t]*:?[-]+:?[ \t]*/g, ' ');

  // Khoảng số, tiết học, trang sách (Ví dụ: "Tiết 1-2" -> "Tiết 1 đến 2", "Trang 15-20" -> "Trang 15 đến 20")
  s = s.replace(/(\b(?:Tiết|tiết|Trang|trang|Bài|bài|Tuần|tuần|từ|Từ|khoảng)\s+\d+)\s*[-–—]\s*(\d+\b)/gi, '$1 đến $2');
  s = s.replace(/(\b\d+)\s*[-–—]\s*(\d+\b)(?!\s*[\/=])/g, '$1 đến $2');

  // Gạch nối giữa 2 vế văn bản (Ví dụ: "Toán học - Chân trời sáng tạo" -> "Toán học, Chân trời sáng tạo")
  s = s.replace(/([a-zA-ZÀ-Ỹa-zà-ỹ0-9\)])\s+[-–—]\s+([a-zA-ZÀ-Ỹa-zà-ỹ])/g, '$1, $2');

  // Xóa sạch dấu gạch đầu dòng, dấu hoa thị, bullet points ở đầu mỗi dòng
  s = s.replace(/^[ \t]*[-*+•–—][ \t]+/gm, ' ');
  s = s.replace(/(?:\n|\r\n)[ \t]*[-*+•–—][ \t]+/g, '\n ');
  s = s.replace(/\s+[-–—]+\s+/g, ', ');

  // =========================================================================
  // 3. CHUẨN HÓA TỪ VIẾT TẮT SƯ PHẠM, GIÁO DỤC & ĐƠN VỊ ĐO LƯỜNG
  // =========================================================================
  const abbreviations: [RegExp, string][] = [
    [/\bGV\b/g, 'Giáo viên'],
    [/\bHS\b/g, 'Học sinh'],
    [/\bTHCS\b/g, 'Trung học cơ sở'],
    [/\bTHPT\b/g, 'Trung học phổ thông'],
    [/\bGD&ĐT\b|\bGD và ĐT\b/gi, 'Giáo dục và Đào tạo'],
    [/\bBGDĐT\b|\bBGD&ĐT\b/gi, 'Bộ Giáo dục và Đào tạo'],
    [/\bPPCT\b/gi, 'Phân phối chương trình'],
    [/\bKHTN\b/gi, 'Khoa học tự nhiên'],
    [/\bKHBD\b/gi, 'Kế hoạch bài dạy'],
    [/\bSGK\b/gi, 'Sách giáo khoa'],
    [/\bSBT\b/gi, 'Sách bài tập'],
    [/\bSTEM\b/gi, 'Stem'],
    [/\bADN\b/g, 'A-Đê-En'],
    [/\bARN\b/g, 'A-E-Rờ-En'],
    [/\bATP\b/g, 'A-Tê-Pê'],
    [/\bCSDL\b/g, 'Cơ sở dữ liệu'],
    [/\bCNTT\b/g, 'Công nghệ thông tin'],
    [/\bAI\b/g, 'Trí tuệ nhân tạo A-I'],
    [/\bTT\s*(\d+)\b/gi, 'Thông tư $1'],
    [/\bQĐ\s*(\d+)\b/gi, 'Quyết định $1'],
    [/\bHĐ\s*(\d+)\b/gi, 'Hoạt động $1'],
    [/\bVD\s*(\d+)\b/gi, 'Ví dụ $1'],
    [/\bVD\b/g, 'Ví dụ'],
    [/\bLT\s*(\d+)\b/gi, 'Luyện tập $1'],
    [/\bBT\s*(\d+)\b/gi, 'Bài tập $1'],
    [/\bVDC\b/g, 'Vận dụng cao'],
    [/\bNB\b/g, 'Nhận biết'],
    [/\bTH\b/g, 'Thông hiểu'],
    [/\bĐ\/S\b|\bĐ-S\b/gi, 'Đúng sai'],
    [/\bTN\b/g, 'Trắc nghiệm'],
    [/\bTL\b/g, 'Tự luận']
  ];

  for (const [pattern, replacement] of abbreviations) {
    s = s.replace(pattern, replacement);
  }

  // Đơn vị đo lường khoa học & đời sống
  s = s.replace(/(\d+)\s*(?:cm\^2|cm²)/gi, '$1 xăng-ti-mét vuông');
  s = s.replace(/(\d+)\s*(?:dm\^2|dm²)/gi, '$1 đê-xi-mét vuông');
  s = s.replace(/(\d+)\s*(?:m\^2|m²)/gi, '$1 mét vuông');
  s = s.replace(/(\d+)\s*(?:mm\^2|mm²)/gi, '$1 mi-li-mét vuông');
  s = s.replace(/(\d+)\s*(?:km\^2|km²)/gi, '$1 ki-lô-mét vuông');
  s = s.replace(/(\d+)\s*(?:ha|héc-ta)\b/gi, '$1 héc-ta');
  s = s.replace(/(\d+)\s*(?:cm\^3|cm³)/gi, '$1 xăng-ti-mét khối');
  s = s.replace(/(\d+)\s*(?:dm\^3|dm³)/gi, '$1 đê-xi-mét khối');
  s = s.replace(/(\d+)\s*(?:m\^3|m³)/gi, '$1 mét khối');
  s = s.replace(/(\d+)\s*(?:mm\^3|mm³)/gi, '$1 mi-li-mét khối');
  s = s.replace(/(\d+)\s*km\/h\b/gi, '$1 ki-lô-mét trên giờ');
  s = s.replace(/(\d+)\s*m\/s\^2\b/gi, '$1 mét trên giây bình phương');
  s = s.replace(/(\d+)\s*m\/s\b/gi, '$1 mét trên giây');
  s = s.replace(/(\d+)\s*kg\b/gi, '$1 ki-lô-gam');
  s = s.replace(/(\d+)\s*mg\b/gi, '$1 mi-li-gam');
  s = s.replace(/(\d+)\s*g\b/gi, '$1 gam');
  s = s.replace(/(\d+)\s*ml\b/gi, '$1 mi-li-lít');
  s = s.replace(/(\d+)\s*l\b/gi, '$1 lít');
  s = s.replace(/(\d+)\s*cm\b/gi, '$1 xăng-ti-mét');
  s = s.replace(/(\d+)\s*mm\b/gi, '$1 mi-li-mét');
  s = s.replace(/(\d+)\s*dm\b/gi, '$1 đê-xi-mét');
  s = s.replace(/(\d+)\s*km\b/gi, '$1 ki-lô-mét');
  s = s.replace(/(\d+)\s*m\b/gi, '$1 mét');
  s = s.replace(/(\d+)\s*kWh\b/gi, '$1 ki-lô-oát giờ');
  s = s.replace(/(\d+)\s*kW\b/gi, '$1 ki-lô-oát');
  s = s.replace(/(\d+)\s*MW\b/gi, '$1 mê-ga-oát');
  s = s.replace(/(\d+)\s*W\b/gi, '$1 oát');
  s = s.replace(/(\d+)\s*kV\b/gi, '$1 ki-lô-vôn');
  s = s.replace(/(\d+)\s*mV\b/gi, '$1 mi-li-vôn');
  s = s.replace(/(\d+)\s*V\b/gi, '$1 vôn');
  s = s.replace(/(\d+)\s*mA\b/gi, '$1 mi-li-am-pe');
  s = s.replace(/(\d+)\s*A\b/gi, '$1 am-pe');
  s = s.replace(/(\d+)\s*(?:\\?Omega|\\?ohm|Ω)\b/gi, '$1 ôm');
  s = s.replace(/(\d+)\s*Hz\b/gi, '$1 héc');
  s = s.replace(/(\d+)\s*kHz\b/gi, '$1 ki-lô-héc');
  s = s.replace(/(\d+)\s*MHz\b/gi, '$1 mê-ga-héc');
  s = s.replace(/(\d+)\s*GHz\b/gi, '$1 gi-ga-héc');
  s = s.replace(/(\d+)\s*(?:\^\s*\{?\\circ\}?\s*C|°C)\b/gi, '$1 độ C');
  s = s.replace(/(\d+)\s*(?:\^\s*\{?\\circ\}?\s*F|°F)\b/gi, '$1 độ F');
  s = s.replace(/(\d+)\s*%/g, '$1 phần trăm');
  s = s.replace(/(\d+)\s*‰/g, '$1 phần nghìn');

  // =========================================================================
  // 4. CHỮ CÁI HY LẠP & CÔNG THỨC HÓA HỌC PHỔ BIẾN
  // =========================================================================
  s = s.replace(/\\alpha\b|α/g, ' an-pha ');
  s = s.replace(/\\beta\b|β/g, ' bê-ta ');
  s = s.replace(/\\gamma\b|γ/g, ' ga-ma ');
  s = s.replace(/\\delta\b|δ/g, ' đen-ta ');
  s = s.replace(/\\epsilon\b|ε/g, ' ép-si-lon ');
  s = s.replace(/\\eta\b|η/g, ' ê-ta ');
  s = s.replace(/\\theta\b|θ/g, ' thê-ta ');
  s = s.replace(/\\lambda\b|λ/g, ' lam-đa ');
  s = s.replace(/\\mu\b|μ/g, ' muy ');
  s = s.replace(/\\pi\b|π/g, ' pi ');
  s = s.replace(/\\rho\b|ρ/g, ' rô ');
  s = s.replace(/\\sigma\b|σ/g, ' xích-ma ');
  s = s.replace(/\\tau\b|τ/g, ' tô ');
  s = s.replace(/\\phi\b|\\varphi\b|φ/g, ' phi ');
  s = s.replace(/\\omega\b|ω/g, ' ô-mê-ga ');
  s = s.replace(/\\Omega\b|Ω/g, ' ôm ');

  // Công thức Hóa học cơ bản
  s = s.replace(/\bH_?2O\b/g, ' H 2 O ');
  s = s.replace(/\bCO_?2\b/g, ' C O 2 ');
  s = s.replace(/\bO_?2\b/g, ' O 2 ');
  s = s.replace(/\bH_?2\b/g, ' H 2 ');
  s = s.replace(/\bN_?2\b/g, ' N 2 ');
  s = s.replace(/\bNaCl\b/g, ' Na Cl ');
  s = s.replace(/\bH_?2SO_?4\b/g, ' H 2 S O 4 ');
  s = s.replace(/\bHCl\b/g, ' H Cl ');
  s = s.replace(/\bCaCO_?3\b/g, ' Ca C O 3 ');
  s = s.replace(/\bNaOH\b/g, ' Na O H ');
  s = s.replace(/\bFe_?2O_?3\b/g, ' Fe 2 O 3 ');

  // =========================================================================
  // 5. TOÁN HỌC: TẬP HỢP SỐ, QUAN HỆ TẬP HỢP, LOGIC, ƯỚC & BỘI
  // =========================================================================

  // 5.0. Xử lý bối cảnh tiền ngữ: Nếu đã có từ "tập hợp", "tập số", "trong tập" phía trước thì không lặp lại "tập hợp"
  // A. Ký hiệu N* (Tập hợp các số tự nhiên khác 0) khi có tiền ngữ hoặc quan hệ:
  // Preceded by "tập hợp", "tập các số", "trong tập":
  s = s.replace(/(?:tập\s+hợp(?:\s+các\s+số\s+tự\s+nhiên)?|trong\s+tập\s+hợp|thuộc\s+tập\s+hợp|tập\s+số|tập)\s*(?:\\?mathbb\s*\{\s*N\s*\}\s*(?:\^\s*(?:\*|\\ast|\{?\*\}?|\{?\\ast\}?)|_\s*0|\*)|\bN\s*sao\b|ℕ\*|\bN\*\b)/gi, ' tập hợp N sao ');
  
  // Quan hệ phần tử và N*:
  s = s.replace(/([0-9a-zA-Z_'\*]+)\s*(?:\\notin|∉)\s*(?:\\?mathbb\s*\{\s*N\s*\}\s*(?:\^\s*(?:\*|\\ast|\{?\*\}?|\{?\\ast\}?)|_\s*0|\*)|\bN\s*sao\b|ℕ\*|\bN\*\b)/g, ' $1 không thuộc N sao ');
  s = s.replace(/([0-9a-zA-Z_'\*]+)\s*(?:\\in|∈)\s*(?:\\?mathbb\s*\{\s*N\s*\}\s*(?:\^\s*(?:\*|\\ast|\{?\*\}?|\{?\\ast\}?)|_\s*0|\*)|\bN\s*sao\b|ℕ\*|\bN\*\b)/g, ' $1 thuộc N sao ');

  // B. Ký hiệu N (Số tự nhiên):
  s = s.replace(/(?:tập\s+hợp(?:\s+số\s+tự\s+nhiên)?|trong\s+tập\s+hợp|thuộc\s+tập\s+hợp|tập\s+số|tập)\s*(?:\\?mathbb\s*\{\s*N\s*\}|ℕ|\bmathbb\s*N\b)/gi, ' tập hợp số tự nhiên N ');
  s = s.replace(/([0-9a-zA-Z_'\*]+)\s*(?:\\notin|∉)\s*(?:\\?mathbb\s*\{\s*N\s*\}|ℕ|\bmathbb\s*N\b)/g, ' $1 không thuộc tập hợp số tự nhiên N ');
  s = s.replace(/([0-9a-zA-Z_'\*]+)\s*(?:\\in|∈)\s*(?:\\?mathbb\s*\{\s*N\s*\}|ℕ|\bmathbb\s*N\b)/g, ' $1 thuộc tập hợp số tự nhiên N ');

  // C. Ký hiệu Z (Số nguyên):
  s = s.replace(/(?:tập\s+hợp(?:\s+số\s+nguyên)?|trong\s+tập\s+hợp|thuộc\s+tập\s+hợp|tập\s+số|tập)\s*(?:\\?mathbb\s*\{\s*Z\s*\}|ℤ|\bmathbb\s*Z\b)/gi, ' tập hợp số nguyên Z ');
  s = s.replace(/([0-9a-zA-Z_'\*]+)\s*(?:\\notin|∉)\s*(?:\\?mathbb\s*\{\s*Z\s*\}|ℤ|\bmathbb\s*Z\b)/g, ' $1 không thuộc tập hợp số nguyên Z ');
  s = s.replace(/([0-9a-zA-Z_'\*]+)\s*(?:\\in|∈)\s*(?:\\?mathbb\s*\{\s*Z\s*\}|ℤ|\bmathbb\s*Z\b)/g, ' $1 thuộc tập hợp số nguyên Z ');

  // D. Ký hiệu Q (Số hữu tỉ):
  s = s.replace(/(?:tập\s+hợp(?:\s+số\s+hữu\s+tỉ)?|trong\s+tập\s+hợp|thuộc\s+tập\s+hợp|tập\s+số|tập)\s*(?:\\?mathbb\s*\{\s*Q\s*\}|ℚ|\bmathbb\s*Q\b)/gi, ' tập hợp số hữu tỉ Q ');
  s = s.replace(/([0-9a-zA-Z_'\*]+)\s*(?:\\notin|∉)\s*(?:\\?mathbb\s*\{\s*Q\s*\}|ℚ|\bmathbb\s*Q\b)/g, ' $1 không thuộc tập hợp số hữu tỉ Q ');
  s = s.replace(/([0-9a-zA-Z_'\*]+)\s*(?:\\in|∈)\s*(?:\\?mathbb\s*\{\s*Q\s*\}|ℚ|\bmathbb\s*Q\b)/g, ' $1 thuộc tập hợp số hữu tỉ Q ');

  // E. Ký hiệu R (Số thực):
  s = s.replace(/(?:tập\s+hợp(?:\s+số\s+thực)?|trong\s+tập\s+hợp|thuộc\s+tập\s+hợp|tập\s+số|tập)\s*(?:\\?mathbb\s*\{\s*R\s*\}|ℝ|\bmathbb\s*R\b)/gi, ' tập hợp số thực R ');
  s = s.replace(/([0-9a-zA-Z_'\*]+)\s*(?:\\notin|∉)\s*(?:\\?mathbb\s*\{\s*R\s*\}|ℝ|\bmathbb\s*R\b)/g, ' $1 không thuộc tập hợp số thực R ');
  s = s.replace(/([0-9a-zA-Z_'\*]+)\s*(?:\\in|∈)\s*(?:\\?mathbb\s*\{\s*R\s*\}|ℝ|\bmathbb\s*R\b)/g, ' $1 thuộc tập hợp số thực R ');

  // Gán tập hợp: A = {1; 2; 3} hoặc P = \{0; 1; 2; 3; 4; 5\}
  s = s.replace(/\b([A-Z])\s*=\s*(?:\\\{|\{)\s*([^{}\n]+)\s*(?:\\\}|\})/g, (_, setName, elements) => {
    const cleanElements = elements.replace(/;/g, ',').replace(/\s+/g, ' ').trim();
    return ` tập hợp ${setName} bằng tập hợp gồm các phần tử ${cleanElements} `;
  });

  // Phần tử thuộc tập hợp: x \in A, 2 \in A, 5 \notin A
  s = s.replace(/(?:phần\s+tử\s+)?([0-9a-zA-Z_'\*]+)\s*(?:\\notin|∉)\s*([A-Z])\b/g, ' $1 không thuộc tập hợp $2 ');
  s = s.replace(/(?:phần\s+tử\s+)?([0-9a-zA-Z_'\*]+)\s*(?:\\in|∈)\s*([A-Z])\b/g, ' $1 thuộc tập hợp $2 ');

  // Ký hiệu tập hợp số độc lập (ℕ, ℕ*, ℤ, ℚ, ℝ, 𝕀, ℂ)
  s = s
    .replace(/\\?mathbb\s*\{\s*N\s*\}\s*(?:\^\s*(?:\*|\\ast|\{?\*\}?|\{?\\ast\}?)|_\s*0|\*)|\bN\s*sao\b|ℕ\*|\bN\*\b/gi, ' tập hợp N sao ')
    .replace(/\\?mathbb\s*\{\s*R\s*\}\s*(?:\^\s*(?:\*|\\ast|\{?\*\}?|\{?\\ast\}?)|_\s*0|\*)|\bR\s*sao\b|ℝ\*|\bR\*\b/gi, ' tập hợp R sao ')
    .replace(/\\?mathbb\s*\{\s*Z\s*\}\s*(?:\^\s*(?:\*|\\ast|\{?\*\}?|\{?\\ast\}?)|_\s*0|\*)|\bZ\s*sao\b|ℤ\*|\bZ\*\b/gi, ' tập hợp Z sao ')
    .replace(/\\?mathbb\s*\{\s*Q\s*\}\s*(?:\^\s*(?:\*|\\ast|\{?\*\}?|\{?\\ast\}?)|_\s*0|\*)|\bQ\s*sao\b|ℚ\*|\bQ\*\b/gi, ' tập hợp Q sao ')
    .replace(/\\?mathbb\s*\{\s*N\s*\}|ℕ|\bmathbb\s*N\b/gi, ' tập hợp số tự nhiên N ')
    .replace(/\\?mathbb\s*\{\s*Z\s*\}|ℤ|\bmathbb\s*Z\b/gi, ' tập hợp số nguyên Z ')
    .replace(/\\?mathbb\s*\{\s*Q\s*\}|ℚ|\bmathbb\s*Q\b/gi, ' tập hợp số hữu tỉ Q ')
    .replace(/\\?mathbb\s*\{\s*I\s*\}|𝕀|\bmathbb\s*I\b/gi, ' tập hợp số vô tỉ I ')
    .replace(/\\?mathbb\s*\{\s*R\s*\}|ℝ|\bmathbb\s*R\b/gi, ' tập hợp số thực R ')
    .replace(/\\?mathbb\s*\{\s*C\s*\}|ℂ|\bmathbb\s*C\b/gi, ' tập hợp số phức C ');

  // Ký hiệu quan hệ tập hợp và logic
  s = s
    .replace(/\\?in\b|∈/g, ' thuộc ')
    .replace(/\\?notin\b|∉/g, ' không thuộc ')
    .replace(/\\?subset\b|⊂/g, ' là tập con của ')
    .replace(/\\?subseteq\b|⊆/g, ' là tập con hoặc bằng ')
    .replace(/\\?supset\b|⊃/g, ' chứa tập ')
    .replace(/\\?supseteq\b|⊇/g, ' chứa tập hoặc bằng ')
    .replace(/\\?cap\b|∩/g, ' giao ')
    .replace(/\\?cup\b|∪/g, ' hợp ')
    .replace(/\\?setminus\b/g, ' hiệu ')
    .replace(/\\?varnothing\b|\\?emptyset\b|∅/g, ' tập hợp rỗng ')
    .replace(/\\?forall\b|∀/g, ' với mọi ')
    .replace(/\\?exists\b|∃/g, ' tồn tại ')
    .replace(/\\?nexists\b|∄/g, ' không tồn tại ')
    .replace(/\\?Rightarrow\b|\\?implies\b|⇒|⟹/g, ' suy ra ')
    .replace(/\\?Leftarrow\b|⇐|⟸/g, ' kéo theo từ ')
    .replace(/\\?Leftrightarrow\b|\\?iff\b|⇔|⟺/g, ' tương đương với ')
    .replace(/\\?leftrightarrow\b|↔/g, ' tương đương ');

  // Ước và Bội chuẩn xác 100%:
  s = s.replace(/\bƯCLN\s*\(\s*([^,)]+)\s*,\s*([^)]+)\s*\)/g, ' ước chung lớn nhất của $1 và $2 ');
  s = s.replace(/\bBCNN\s*\(\s*([^,)]+)\s*,\s*([^)]+)\s*\)/g, ' bội chung nhỏ nhất của $1 và $2 ');
  s = s.replace(/\bƯC\s*\(\s*([^,)]+)\s*,\s*([^)]+)\s*\)/g, ' tập hợp các ước chung của $1 và $2 ');
  s = s.replace(/\bBC\s*\(\s*([^,)]+)\s*,\s*([^)]+)\s*\)/g, ' tập hợp các bội chung của $1 và $2 ');
  s = s.replace(/\bƯ\s*\(\s*([^)]+)\s*\)/g, ' tập hợp các ước của $1 ');
  s = s.replace(/\bB\s*\(\s*([^)]+)\s*\)/g, ' tập hợp các bội của $1 ');
  s = s.replace(/\bƯCLN\b/g, ' ước chung lớn nhất ');
  s = s.replace(/\bBCNN\b/g, ' bội chung nhỏ nhất ');
  s = s.replace(/\bƯC\b/g, ' ước chung ');
  s = s.replace(/\bBC\b/g, ' bội chung ');

  // Biểu thức tập hợp và phần tử trong ngoặc nhọn: {a, b, c}, {1; 2; 3}
  s = s.replace(/\{([^{}]+)\}/g, ' gồm các phần tử $1 ');

  // =========================================================================
  // 6. SO SÁNH TOÁN HỌC (<, >, <=, >=, !=) - KHÔNG ĐƯỢC ĐỌC LÀ "DẤU BÉ", "DẤU LỚN"
  // =========================================================================
  s = s.replace(/\\?leq\b|\\?le\b|<=|≤/g, ' nhỏ hơn hoặc bằng ');
  s = s.replace(/\\?geq\b|\\?ge\b|>=|≥/g, ' lớn hơn hoặc bằng ');
  s = s.replace(/\\?neq\b|\\?ne\b|!=|≠/g, ' khác ');
  s = s.replace(/\\?approx\b|≈/g, ' xấp xỉ ');
  s = s.replace(/\\?equiv\b|≡/g, ' đồng nhất với ');
  s = s.replace(/\\?pm\b|±/g, ' cộng trừ ');
  s = s.replace(/\\?mp\b|∓/g, ' trừ cộng ');
  s = s.replace(/\\?cdot\b|\\?times\b|⋅|×/g, ' nhân ');
  s = s.replace(/\\?div\b|÷/g, ' chia ');
  s = s.replace(/\\?mid\b/g, ' sao cho ');
  s = s.replace(/\+\\?infty\b/g, ' dương vô cực ');
  s = s.replace(/-\\?infty\b/g, ' âm vô cực ');
  s = s.replace(/\\?infty\b|∞/g, ' vô cực ');

  // Dấu so sánh < và > trong toán học
  s = s.replace(/([a-zA-Z0-9\)])\s*<\s*([a-zA-Z0-9\-(])/g, '$1 nhỏ hơn $2');
  s = s.replace(/([a-zA-Z0-9\)])\s*>\s*([a-zA-Z0-9\-(])/g, '$1 lớn hơn $2');
  s = s.replace(/<\s*([a-zA-Z0-9])/g, ' nhỏ hơn $1');
  s = s.replace(/>\s*([a-zA-Z0-9])/g, ' lớn hơn $1');

  // Điều kiện khác không: ($b \neq 0$) hoặc ($b \ne 0$) hoặc ($b \neq 0, d \neq 0$)
  s = s.replace(/\(\s*\$?([a-zA-Z])\s*khác\s*0\s*,?\s*([a-zA-Z])?\s*(?:khác\s*0)?\$?\s*\)/g, (_, v1, v2) => {
    if (v2) return ` (với ${v1} và ${v2} khác không) `;
    return ` (với ${v1} khác không) `;
  });
  s = s.replace(/\$?([a-zA-Z0-9]+)\s*khác\s*0\$?/g, ' $1 khác không ');

  // =========================================================================
  // 7. TOÁN HỌC: PHÂN SỐ, TỈ SỐ, TỈ LỆ THỨC & DÃY TỈ SỐ
  // =========================================================================

  // Tỉ lệ thức dạng hai vế: \frac{a}{b} = \frac{c}{d}
  s = s.replace(/\\(?:d|t)?frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}\s*=\s*\\(?:d|t)?frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, ' phân số $1 phần $2 bằng phân số $3 phần $4 ');

  // Phân số LaTeX \frac{a}{b}, \dfrac{a}{b} kể cả phân số âm và biểu thức
  const fixFractionBody = (num: string, den: string): string => {
    let cleanNum = num.trim().replace(/^\{|\}$/g, '');
    let cleanDen = den.trim().replace(/^\{|\}$/g, '');
    
    cleanNum = cleanNum.replace(/^-\s*(\d+)/, 'âm $1');
    cleanNum = cleanNum.replace(/^-\s*([a-zA-Z])/, 'âm $1');
    cleanDen = cleanDen.replace(/^-\s*(\d+)/, 'âm $1');
    cleanDen = cleanDen.replace(/^-\s*([a-zA-Z])/, 'âm $1');
    cleanNum = cleanNum.replace(/^\?$/, 'số cần tìm');
    cleanDen = cleanDen.replace(/^\?$/, 'số cần tìm');

    // Nếu tử số hoặc mẫu số là biểu thức nhiều số hạng
    const isNumComplex = /[+\-*\/]/.test(cleanNum);
    const isDenComplex = /[+\-*\/]/.test(cleanDen);
    if (isNumComplex || isDenComplex) {
      return ` phân số ${cleanNum} trên ${cleanDen} `;
    }
    return ` phân số ${cleanNum} phần ${cleanDen} `;
  };

  // Phân số có dấu âm phía trước: -\frac{1}{2}, -\dfrac{a}{b}
  s = s.replace(/-\s*\\(?:d|t)?frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, (_, n, d) => ' âm ' + fixFractionBody(n, d));
  s = s.replace(/-\s*\b(?:d|t)?frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, (_, n, d) => ' âm ' + fixFractionBody(n, d));

  for (let i = 0; i < 4; i++) {
    s = s.replace(/\\(?:d|t)?frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, (_, n, d) => fixFractionBody(n, d));
  }
  for (let i = 0; i < 4; i++) {
    s = s.replace(/\b(?:d|t)?frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, (_, n, d) => fixFractionBody(n, d));
  }

  // Các phân số âm thường gặp: -1/2, -1/3, -3/4...
  s = s.replace(/(?:^|\s)-1\/2\b/g, ' âm một phần hai ');
  s = s.replace(/(?:^|\s)-1\/3\b/g, ' âm một phần ba ');
  s = s.replace(/(?:^|\s)-2\/3\b/g, ' âm hai phần ba ');
  s = s.replace(/(?:^|\s)-1\/4\b/g, ' âm một phần tư ');
  s = s.replace(/(?:^|\s)-3\/4\b/g, ' âm ba phần tư ');
  s = s.replace(/(?:^|\s)-1\/5\b/g, ' âm một phần năm ');
  s = s.replace(/(?:^|\s)-2\/5\b/g, ' âm hai phần năm ');
  s = s.replace(/(?:^|\s)-3\/5\b/g, ' âm ba phần năm ');
  s = s.replace(/(?:^|\s)-4\/5\b/g, ' âm bốn phần năm ');
  s = s.replace(/(?:^|\s)-(\d+)\/(\d+)/g, ' âm $1 phần $2 ');

  // Các phân số dương cơ bản thường gặp trong văn bản và lời thoại
  s = s.replace(/\b1\/2\b/g, ' một phần hai ');
  s = s.replace(/\b1\/3\b/g, ' một phần ba ');
  s = s.replace(/\b2\/3\b/g, ' hai phần ba ');
  s = s.replace(/\b1\/4\b/g, ' một phần tư ');
  s = s.replace(/\b3\/4\b/g, ' ba phần tư ');
  s = s.replace(/\b1\/5\b/g, ' một phần năm ');
  s = s.replace(/\b2\/5\b/g, ' hai phần năm ');
  s = s.replace(/\b3\/5\b/g, ' ba phần năm ');
  s = s.replace(/\b4\/5\b/g, ' bốn phần năm ');
  s = s.replace(/(\d+)\/(\d+)/g, ' $1 phần $2 ');

  // Tỉ số dạng a:b = c:d hoặc $a:b = c:d$
  s = s.replace(/(?:tỉ\s+số|tỉ\s+lệ)\s+([a-zA-Z0-9]+)\s*:\s*([a-zA-Z0-9]+)/gi, ' tỉ số $1 trên $2 ');
  s = s.replace(/([a-zA-Z0-9]+)\s*:\s*([a-zA-Z0-9]+)\s*=\s*([a-zA-Z0-9]+)\s*:\s*([a-zA-Z0-9]+)/g, ' tỉ số $1 trên $2 bằng tỉ số $3 trên $4 ');
  s = s.replace(/\$([a-zA-Z0-9]+)\s*:\s*([a-zA-Z0-9]+)\$/g, ' tỉ số $1 chia cho $2 ');

  // Phép chia số học rõ ràng (Ví dụ: "12 : 3", "100 : 25")
  s = s.replace(/(?:phép\s+chia|chia|tính|bằng)\s+(\d+)\s*:\s*(\d+)/gi, ' $1 chia cho $2 ');
  s = s.replace(/(?<=[=+\-*/(]\s*)(\d+)\s*:\s*(\d+)/g, ' $1 chia cho $2 ');
  s = s.replace(/(\d+)\s*:\s*(\d+)(?=\s*[=+\-*/)])/g, ' $1 chia cho $2 ');

  // =========================================================================
  // 8. LŨY THỪA, CĂN THỨC, HỆ PHƯƠNG TRÌNH, HÌNH HỌC & ĐẠI SỐ
  // =========================================================================

  // Hệ phương trình \begin{cases} ... \end{cases}
  s = s.replace(/\\begin\{cases\}([\s\S]*?)\\end\{cases\}/g, (_, body) => {
    const lines = body.split(/\\\\/).map((l: string) => l.trim()).filter(Boolean);
    return ' hệ phương trình gồm: ' + lines.join('; đồng thời ') + ' ';
  });

  // Tích chéo: a \cdot d = b \cdot c hoặc a.d = b.c
  s = s.replace(/([a-zA-Z0-9]+)\s*\\cdot\s*([a-zA-Z0-9]+)\s*=\s*([a-zA-Z0-9]+)\s*\\cdot\s*([a-zA-Z0-9]+)/g, ' $1 nhân $2 bằng $3 nhân $4 ');
  s = s.replace(/([a-zA-Z])\s*\.\s*([a-zA-Z])\s*=\s*([a-zA-Z])\s*\.\s*([a-zA-Z])/g, ' $1 nhân $2 bằng $3 nhân $4 ');

  // Hình học: Góc, Tam giác, Vectơ, Đoạn thẳng
  s = s.replace(/\\(?:triangle|Delta)\s*([A-Z]{3})/g, ' tam giác $1 ');
  s = s.replace(/\\(?:widehat|angle|widecheck)\{?([A-Z]{1,3})\}?/g, ' góc $1 ');
  s = s.replace(/\\widehat\{([^}]+)\}/g, ' góc $1 ');
  s = s.replace(/\\hat\{([a-zA-Z])\}/g, ' góc $1 ');
  s = s.replace(/\\overrightarrow\{([^}]+)\}|\\vec\{([^}]+)\}/g, ' vectơ $1$2 ');
  s = s.replace(/\\overline\{([^}]+)\}/g, ' đoạn thẳng $1 ');
  s = s.replace(/\\perp\b/g, ' vuông góc với ');
  s = s.replace(/\\parallel\b/g, ' song song với ');
  s = s.replace(/\\cong\b/g, ' bằng nhau với ');
  s = s.replace(/\\sim\b/g, ' đồng dạng với ');

  // Độ góc (°): 60^\circ, 90^{\circ}, 45\degree
  s = s.replace(/(\d+)\s*\^\s*\{?\\circ\}?/g, ' $1 độ ');
  s = s.replace(/(\d+)\s*\\degree/g, ' $1 độ ');
  s = s.replace(/\\circ\b/g, ' độ ');

  // Căn thức (Roots): \sqrt[3]{8}, \sqrt{x+1}
  s = s.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, ' căn bậc $1 của $2 ');
  for (let i = 0; i < 3; i++) {
    s = s.replace(/\\sqrt\{([^}]+)\}/g, ' căn bậc hai của $1 ');
  }

  // Lượng giác, Logarit, Giới hạn, Tích phân
  s = s.replace(/\\sin\b/g, ' sin ');
  s = s.replace(/\\cos\b/g, ' cốt ');
  s = s.replace(/\\tan\b/g, ' tan ');
  s = s.replace(/\\cot\b/g, ' cô-tan ');
  s = s.replace(/\\log_\{([^}]+)\}\(?([^)]+)\)?/g, ' lô-ga-rít cơ số $1 của $2 ');
  s = s.replace(/\\log_([0-9a-zA-Z]+)\(?([^)]+)\)?/g, ' lô-ga-rít cơ số $1 của $2 ');
  s = s.replace(/\\log\b/g, ' lô-ga-rít ');
  s = s.replace(/\\ln\b/g, ' lô-ga-rít tự nhiên ');
  s = s.replace(/\\lim_\{([^}]+)\s*\\to\s*([^}]+)\}/g, ' giới hạn khi $1 tiến tới $2 của ');
  s = s.replace(/\\lim_\{([^}]+)\}/g, ' giới hạn khi $1 của ');
  s = s.replace(/\\int_\{([^}]+)\}\^\{([^}]+)\}/g, ' tích phân từ $1 đến $2 ');
  s = s.replace(/\\int/g, ' nguyên hàm ');
  s = s.replace(/\\sum_\{([^}]+)\}\^\{([^}]+)\}/g, ' tổng xích ma từ $1 đến $2 ');
  s = s.replace(/\\sum/g, ' tổng xích ma ');

  // Lũy thừa
  s = s.replace(/\^\{\s*2\s*\}|\^2\b/g, ' bình phương ');
  s = s.replace(/\^\{\s*3\s*\}|\^3\b/g, ' lập phương ');
  s = s.replace(/\^\{\s*(-?\d+)\s*\}/g, ' mũ $1 ');
  s = s.replace(/\^\{\s*([^}]+)\s*\}/g, ' mũ $1 ');
  s = s.replace(/\^([0-9a-zA-Z]+)/g, ' mũ $1 ');

  // Chỉ số dưới (Subscripts: x_1, x_2, y_0, A_1)
  s = s.replace(/([a-zA-Z])_\{?([0-9]+)\}?/g, ' $1 $2 ');
  s = s.replace(/([a-zA-Z])_\{?([a-zA-Z])\}?/g, ' $1 $2 ');

  // Số âm trong biểu thức toán
  s = s.replace(/(?:[=({\[,]\s*)-(\d+)/g, ' âm $1 ');
  s = s.replace(/^-\s*(\d+)/g, 'âm $1 ');
  s = s.replace(/(?:\n|\r\n)-\s*(\d+)/g, '\n âm $1 ');

  // Phép trừ toán học (Ví dụ: "a - b = c", "5 - 3 = 2")
  s = s.replace(/([a-zA-Z0-9\)])\s*-\s*([a-zA-Z0-9\(])/g, '$1 trừ $2');

  // Phép cộng toán học
  s = s.replace(/([a-zA-Z0-9\)])\s*\+\s*([a-zA-Z0-9\(])/g, '$1 cộng $2');

  // Đẳng thức cơ bản: a = b
  s = s.replace(/([a-zA-Z0-9\(\)]+)\s*=\s*([a-zA-Z0-9\(\)\s\+\-\*\/]+)/g, (match, left, right) => {
    if (match.includes('bằng') || match.includes('nhân') || match.includes('chia') || match.includes('trừ') || match.includes('cộng')) return match;
    return `${left} bằng ${right}`;
  });

  // Dấu ba chấm hoặc ô trống
  s = s.replace(/\\boxed\{([^}]+)\}/g, ' ô trống $1 ');
  s = s.replace(/\\dots\b|\\cdots\b|\\ldots\b|\.\.\./g, ' ba chấm ');

  // Định dạng text bên trong LaTeX
  s = s.replace(/\\(?:text|mathrm|mathbf|mathit|textbf|textit|operatorname)\{([^}]+)\}/g, ' $1 ');
  s = s.replace(/\\displaystyle/g, ' ');

  // Gỡ bỏ các ngoặc LaTeX đặc biệt
  s = s.replace(/\\left\(|\\right\)/g, ' ');
  s = s.replace(/\\left\[|\\right\]/g, ' ');
  s = s.replace(/\\left\\\{|\\right\\\}|\\\{|\\\}/g, ' ');
  s = s.replace(/\\left\||\\right\|/g, ' ');
  s = s.replace(/\\quad|\\qquad|\\,|\\;|\\!/g, ' ');

  // Gỡ bỏ ký hiệu bao bọc TeX
  s = s.replace(/\$\$([\s\S]*?)\$\$/g, ' $1 ');
  s = s.replace(/\$([^\$]+)\$/g, ' $1 ');
  s = s.replace(/\\[a-zA-Z]+/g, ' ');

  // =========================================================================
  // 9. DỌN DẸP CUỐI CÙNG: LOẠI BỎ MARKDOWN FORMATTING, EMOJI & CHUẨN HÓA DẤU CÂU
  // =========================================================================

  // Xóa emoji
  s = s.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, ' ');

  // Xóa các ký tự markdown thừa (*, _, #, `, |, ~, <, >)
  s = s.replace(/[*_#`|~<>]/g, ' ');

  // Chuẩn hóa dấu câu kép hoặc sai lệch
  s = s.replace(/\.{2,}/g, '... ');
  s = s.replace(/,{2,}/g, ', ');

  // Chuẩn hóa ngắt nghỉ câu tự nhiên: thêm dấu chấm nếu dòng kết thúc chưa có dấu câu
  s = s.replace(/([a-zA-ZÀ-Ỹa-zà-ỹ0-9\)])\s*\n+/g, '$1. \n');
  s = s.replace(/\s*([,.:;?!])\s*/g, '$1 ');

  // =========================================================================
  // 10. KHỬ LẶP TỪ & LẶP CỤM TỪ SƯ PHẠM (DEDUPLICATION ENGINE)
  // =========================================================================
  // Xử lý triệt để các trường hợp lặp "tập hợp tập hợp", "tập hợp N sao N sao", "thuộc thuộc", "phần tử phần tử"...
  for (let i = 0; i < 3; i++) {
    s = s.replace(/\b(?:tập\s+hợp|tập)\s+(?:các\s+số\s+tự\s+nhiên\s+khác\s+không\s+)?tập\s+hợp\b/gi, 'tập hợp');
    s = s.replace(/\btập\s+hợp\s+tập\s+hợp\b/gi, 'tập hợp');
    s = s.replace(/\btập\s+hợp\s+tập\b/gi, 'tập hợp');
    s = s.replace(/\btrong\s+tập\s+hợp\s+tập\s+hợp\b/gi, 'trong tập hợp');
    s = s.replace(/\btập\s+hợp\s+số\s+tự\s+nhiên\s+tập\s+hợp\b/gi, 'tập hợp số tự nhiên');
    s = s.replace(/\btập\s+hợp\s+các\s+số\s+tự\s+nhiên\s+tập\s+hợp\b/gi, 'tập hợp các số tự nhiên');
    s = s.replace(/\bphần\s+tử\s+phần\s+tử\b/gi, 'phần tử');
    s = s.replace(/\bthuộc\s+thuộc\b/gi, 'thuộc');
    s = s.replace(/\bkhông\s+thuộc\s+không\s+thuộc\b/gi, 'không thuộc');
    s = s.replace(/\bgồm\s+các\s+phần\s+tử\s+gồm\s+các\s+phần\s+tử\b/gi, 'gồm các phần tử');
    s = s.replace(/\bgồm\s+gồm\b/gi, 'gồm');
    s = s.replace(/\bsố\s+tự\s+nhiên\s+số\s+tự\s+nhiên\b/gi, 'số tự nhiên');
    s = s.replace(/\bN\s*sao\s+N\s*sao\b/gi, 'N sao');
    s = s.replace(/\bZ\s*sao\s+Z\s*sao\b/gi, 'Z sao');
    s = s.replace(/\bQ\s*sao\s+Q\s*sao\b/gi, 'Q sao');
    s = s.replace(/\bR\s*sao\s+R\s*sao\b/gi, 'R sao');
    s = s.replace(/\bước\s+chung\s+ước\s+chung\b/gi, 'ước chung');
    s = s.replace(/\bbội\s+chung\s+bội\s+chung\b/gi, 'bội chung');
    s = s.replace(/\bước\s+chung\s+lớn\s+nhất\s+ước\s+chung\s+lớn\s+nhất\b/gi, 'ước chung lớn nhất');
    s = s.replace(/\bbội\s+chung\s+nhỏ\s+nhất\s+bội\s+chung\s+nhỏ\s+nhất\b/gi, 'bội chung nhỏ nhất');
    s = s.replace(/\btam\s+giác\s+tam\s+giác\b/gi, 'tam giác');
    s = s.replace(/\bgóc\s+góc\b/gi, 'góc');
    s = s.replace(/\bvectơ\s+vectơ\b/gi, 'vectơ');
    s = s.replace(/\bcăn\s+bậc\s+hai\s+căn\s+bậc\s+hai\b/gi, 'căn bậc hai');
    s = s.replace(/\bbình\s+phương\s+bình\s+phương\b/gi, 'bình phương');
    s = s.replace(/\blập\s+phương\s+lập\s+phương\b/gi, 'lập phương');
    s = s.replace(/\blà\s+tập\s+con\s+của\s+tập\s+con\s+của\b/gi, 'là tập con của');
    
    // Khử lặp từ đơn phổ biến do ghép thế: "là là", "trong trong", "của của", "và và", "có có", "ở ở", "với với", "được được"
    s = s.replace(/\b(là|trong|của|và|có|ở|với|được|các|một|những)\s+\1\b/gi, '$1');
  }

  // Chuẩn hóa dấu cách và ngắt câu
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}
