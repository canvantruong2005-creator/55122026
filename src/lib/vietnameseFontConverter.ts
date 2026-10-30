/**
 * Vietnamese Legacy Font Converter & Auto-Repair Engine
 * Automatically detects and converts TCVN3 (ABC/.VnTime), VNI (VNI-Times)
 * and Windows-1252 distorted legacy Vietnamese encodings (e.g. giòo viờn -> giáo viên, bộ mụn -> bộ môn).
 */

// TCVN3 (ABC) Character Map (1-to-1 and special characters)
const TCVN3_CHAR_MAP: Record<string, string> = {
  // Lowercase & tone marks
  'µ': 'à', '¸': 'á', '¶': 'ả', '·': 'ã', '¹': 'ạ',
  '¨': 'ă', '»': 'ằ', '¾': 'ắ', '¼': 'ẳ', '½': 'ẵ', 'Æ': 'ặ',
  '©': 'â', 'Ç': 'ầ', 'Ê': 'ấ', 'È': 'ẩ', 'É': 'ẫ', 'Ë': 'ậ',
  'Ì': 'è', 'Ð': 'é', 'Î': 'ẻ', 'Ï': 'ẽ', 'Ñ': 'ẹ',
  'ª': 'ê', 'Ò': 'ề', 'Õ': 'ế', 'Ó': 'ể', 'Ô': 'ễ', 'Ö': 'ệ',
  '×': 'ì', 'Ý': 'í', 'Ø': 'ỉ', 'Ü': 'ĩ', 'Þ': 'ị',
  'ß': 'ò', 'ã': 'ó', 'á': 'ỏ', 'â': 'õ', 'ä': 'ọ',
  '«': 'ô', 'å': 'ồ', 'è': 'ố', 'æ': 'ổ', 'ç': 'ỗ', 'é': 'ộ',
  '¬': 'ơ', 'ê': 'ờ', 'í': 'ớ', 'ë': 'ở', 'ì': 'ỡ', 'î': 'ợ',
  'ï': 'ù', 'ó': 'ú', 'ñ': 'ủ', 'ò': 'ũ', 'ô': 'ụ',
  '\xAD': 'ư', 'õ': 'ừ', 'ø': 'ứ', 'ö': 'ử', '÷': 'ữ', 'ù': 'ự',
  'ú': 'ỳ', 'ý': 'ý', 'û': 'ỷ', 'ü': 'ỹ', 'þ': 'ỵ',
  '®': 'đ',

  // Uppercase TCVN3 special base letters
  '¡': 'Ă', '¢': 'Â', '£': 'Ê', '¤': 'Ô', '¥': 'Ơ', '¦': 'Ư', '§': 'Đ'
};

// VNI Character Map
const VNI_PAIRS_MAP: Record<string, string> = {
  'aù': 'á', 'aø': 'à', 'aû': 'ả', 'aõ': 'ã', 'aï': 'ạ',
  'aê': 'ă', 'aé': 'ắ', 'aè': 'ằ', 'aú': 'ẳ', 'aü': 'ẵ', 'aë': 'ặ',
  'aâ': 'â', 'aá': 'ấ', 'aà': 'ầ', 'aå': 'ẩ', 'aã': 'ẫ', 'aä': 'ậ',
  'eù': 'é', 'eø': 'è', 'eû': 'ẻ', 'eõ': 'ẽ', 'eï': 'ẹ',
  'eâ': 'ê', 'eá': 'ế', 'eà': 'ề', 'eå': 'ể', 'eã': 'ễ', 'eä': 'ệ',
  'í': 'í', 'ì': 'ì', 'ỉ': 'ỉ', 'ĩ': 'ĩ', 'ị': 'ị',
  'iù': 'í', 'iø': 'ì', 'iû': 'ỉ', 'iõ': 'ĩ', 'iï': 'ị',
  'où': 'ó', 'oø': 'ò', 'oû': 'ỏ', 'oõ': 'õ', 'oï': 'ọ',
  'oâ': 'ô', 'oá': 'ố', 'oà': 'ồ', 'oå': 'ổ', 'oã': 'ỗ', 'oä': 'ộ',
  'ôù': 'ớ', 'ôø': 'ờ', 'ôû': 'ở', 'ôõ': 'ỡ', 'ôï': 'ợ',
  'uù': 'ú', 'uø': 'ù', 'uû': 'ủ', 'uõ': 'ũ', 'uï': 'ụ',
  'öù': 'ứ', 'öø': 'ừ', 'öû': 'ử', 'öõ': 'ữ', 'öï': 'ự',
  'yù': 'ý', 'yø': 'ỳ', 'yû': 'ỷ', 'yõ': 'ỹ', 'î': 'ỵ',
  'ñ': 'đ', 'Ñ': 'Đ',
  // Uppercase VNI
  'AÙ': 'Á', 'AØ': 'À', 'AÛ': 'Ả', 'AÕ': 'Ã', 'AÏ': 'Ạ',
  'AÊ': 'Ă', 'AÉ': 'Ắ', 'AÈ': 'Ằ', 'AÚ': 'Ẳ', 'AÜ': 'Ẵ', 'AË': 'Ặ',
  'AÂ': 'Â', 'AÁ': 'Ấ', 'AÀ': 'Ầ', 'AÅ': 'Ẩ', 'AÃ': 'Ẫ', 'AÄ': 'Ậ',
  'EÙ': 'É', 'EØ': 'È', 'EÛ': 'Ẻ', 'EÕ': 'Ẽ', 'EÏ': 'Ẹ',
  'EÂ': 'Ê', 'EÁ': 'Ế', 'EÀ': 'Ề', 'EÅ': 'Ể', 'EÃ': 'Ễ', 'EÄ': 'Ệ',
  'OÙ': 'Ó', 'OØ': 'Ò', 'OÛ': 'Ỏ', 'OÕ': 'Õ', 'OÏ': 'Ọ',
  'OÂ': 'Ô', 'OÁ': 'Ố', 'OÀ': 'Ồ', 'OÅ': 'Ổ', 'OÃ': 'Ỗ', 'OÄ': 'Ộ',
  'ÔÙ': 'Ớ', 'ÔØ': 'Ờ', 'ÔÛ': 'Ở', 'ÔÕ': 'Ỡ', 'ÔÏ': 'Ợ',
  'UÙ': 'Ú', 'UØ': 'Ù', 'UÛ': 'Ủ', 'UÕ': 'Ũ', 'UÏ': 'Ụ',
  'ÖÙ': 'Ứ', 'ÖØ': 'Ừ', 'ÖÛ': 'Ử', 'ÖÕ': 'Ữ', 'ÖÏ': 'Ự'
};

// Common Distorted Word Replacements (Windows-1252 / Corrupted Legacy 8-bit text)
const DISTORTED_WORDS_MAP: [RegExp, string][] = [
  // Room / Facilities / Tech
  [/\bphũng\s+học\b/gi, 'phòng học'],
  [/\bphũng\s+chức\s+năng\b/gi, 'phòng chức năng'],
  [/\bphũng\s+bộ\s+mụn\b/gi, 'phòng bộ môn'],
  [/\bphũng\s+tin\s+học\b/gi, 'phòng tin học'],
  [/\bphũng\s+đa\s+năng\b/gi, 'phòng đa năng'],
  [/\bphũng\b/gi, 'phòng'],
  [/\bPhũng\b/g, 'Phòng'],
  [/\bmỏy\s+tớnh\b/gi, 'máy tính'],
  [/\bmỏy\s+chiếu\b/gi, 'máy chiếu'],
  [/\bmỏy\b/gi, 'máy'],
  [/\bMỏy\b/g, 'Máy'],
  [/\btương\s+tòc\b/gi, 'tương tác'],
  [/\btương\s+tác\b/gi, 'tương tác'],

  // Curriculum / Math Terms
  [/\bphõn\s+phối\b/gi, 'phân phối'],
  [/\bchương\s+trỡnh\b/gi, 'chương trình'],
  [/\bphõn\s+phối\s+chương\s+trỡnh\b/gi, 'phân phối chương trình'],
  [/\bphõn\s+biệt\b/gi, 'phân biệt'],
  [/\bphõn\b/gi, 'phân'],
  [/\bPhõn\b/g, 'Phân'],
  [/\btrỡnh\b/gi, 'trình'],
  [/\bTrỡnh\b/g, 'Trình'],
  [/\bhỡnh\s+học\b/gi, 'hình học'],
  [/\bhỡnh\s+vuụng\b/gi, 'hình vuông'],
  [/\bhỡnh\s+tam\s+giỏc\b/gi, 'hình tam giác'],
  [/\bhỡnh\s+chữ\s+nhật\b/gi, 'hình chữ nhật'],
  [/\bhỡnh\s+thoi\b/gi, 'hình thoi'],
  [/\bhỡnh\s+bỡnh\s+hành\b/gi, 'hình bình hành'],
  [/\bhỡnh\s+lục\s+giỏc\b/gi, 'hình lục giác'],
  [/\bhỡnh\s+thang\s+cõn\b/gi, 'hình thang cân'],
  [/\bhỡnh\s+thang\b/gi, 'hình thang'],
  [/\bhỡnh\s+khối\b/gi, 'hình khối'],
  [/\bhỡnh\b/gi, 'hình'],
  [/\bHỡnh\b/g, 'Hình'],
  [/\bthƯớc\b/g, 'thước'],
  [/\bThƯớc\b/g, 'Thước'],
  [/\bTHƯỚC\b/g, 'THƯỚC'],
  [/\bkích\s+thƯớc\b/gi, 'kích thước'],
  [/\bbƯớc\b/g, 'bước'],
  [/\bBƯớc\b/g, 'Bước'],
  [/\btrƯớc\b/g, 'trước'],
  [/\bTrƯớc\b/g, 'Trước'],
  [/\bđƯợc\b/g, 'được'],
  [/\bĐƯợc\b/g, 'Được'],
  [/\bngƯời\b/g, 'người'],
  [/\bNgƯời\b/g, 'Người'],
  [/\bnƯớc\b/g, 'nước'],
  [/\bNƯớc\b/g, 'Nước'],
  [/\bdƯới\b/g, 'dưới'],
  [/\bDƯới\b/g, 'Dưới'],
  [/\btam\s+giỏc\b/gi, 'tam giác'],
  [/\blục\s+giỏc\b/gi, 'lục giác'],
  [/\bgiỏc\b/gi, 'giác'],
  [/\bGiỏc\b/g, 'Giác'],
  [/\bvuụng\b/gi, 'vuông'],
  [/\bVuụng\b/g, 'Vuông'],
  [/\bbỡnh\s+hành\b/gi, 'bình hành'],
  [/\bbỡnh\b/gi, 'bình'],
  [/\bBỡnh\b/g, 'Bình'],
  [/\bthang\s+cõn\b/gi, 'thang cân'],
  [/\bcõn\b/gi, 'cân'],
  [/\bCõn\b/g, 'Cân'],

  // Sets / Algebra / Calculations
  [/\bmụ\s+tả\b/gi, 'mô tả'],
  [/\bMụ\s+tả\b/g, 'Mô tả'],
  [/\bmụ\s+hỡnh\b/gi, 'mô hình'],
  [/\btập\s+hợp\s+và\s+cỏc\s+phần\s+tử\b/gi, 'tập hợp và các phần tử'],
  [/\bcỏc\s+phần\s+tử\b/gi, 'các phần tử'],
  [/\bcỏc\s+số\b/gi, 'các số'],
  [/\bcỏc\s+em\b/gi, 'các em'],
  [/\bcỏc\b/gi, 'các'],
  [/\bCỏc\b/g, 'Các'],
  [/\bcòc\b/gi, 'các'],
  [/\bCòc\b/g, 'Các'],
  [/\bcỏch\s+hợp\s+lớ\b/gi, 'cách hợp lý'],
  [/\bcỏch\s+tính\b/gi, 'cách tính'],
  [/\bcỏch\s+viết\b/gi, 'cách viết'],
  [/\bcỏch\b/gi, 'cách'],
  [/\bCỏch\b/g, 'Cách'],
  [/\bcòch\b/gi, 'cách'],
  [/\bCòch\b/g, 'Cách'],
  [/\bliệt\s+kờ\b/gi, 'liệt kê'],
  [/\bLiệt\s+kờ\b/g, 'Liệt kê'],
  [/\bkờ\b/gi, 'kê'],
  [/\bnờu\s+tớnh\s+chất\b/gi, 'nêu tính chất'],
  [/\bnờu\s+được\b/gi, 'nêu được'],
  [/\bnờu\b/gi, 'nêu'],
  [/\bNờu\b/g, 'Nêu'],
  [/\btớnh\s+chất\b/gi, 'tính chất'],
  [/\btớnh\s+toỏn\b/gi, 'tính toán'],
  [/\btớnh\s+nhẩm\b/gi, 'tính nhẩm'],
  [/\btớnh\s+nhanh\b/gi, 'tính nhanh'],
  [/\btớnh\b/gi, 'tính'],
  [/\bTớnh\b/g, 'Tính'],
  [/\bsử\s+dông\b/gi, 'sử dụng'],
  [/\bSử\s+dông\b/g, 'Sử dụng'],
  [/\bvận\s+dông\b/gi, 'vận dụng'],
  [/\bVận\s+dông\b/g, 'Vận dụng'],
  [/\bdông\b/gi, 'dụng'],
  [/\bkớ\s+hiệu\b/gi, 'ký hiệu'],
  [/\bKớ\s+hiệu\b/g, 'Ký hiệu'],
  [/\bkớ\b/gi, 'ký'],
  [/\bKớ\b/g, 'Ký'],
  [/\bso\s+sỏnh\b/gi, 'so sánh'],
  [/\bSo\s+sỏnh\b/g, 'So sánh'],
  [/\bsỏnh\b/gi, 'sánh'],
  [/\bsắp\s+xếp\b/gi, 'sắp xếp'],
  [/\bsố\s+tự\s+nhiờn\b/gi, 'số tự nhiên'],
  [/\btự\s+nhiờn\b/gi, 'tự nhiên'],
  [/\bnhiờn\b/gi, 'nhiên'],
  [/\bNhiờn\b/g, 'Nhiên'],
  [/\brổn\s+luyện\b/gi, 'rèn luyện'],
  [/\bRổn\s+luyện\b/g, 'Rèn luyện'],
  [/\brổn\b/gi, 'rèn'],
  [/\bRổn\b/g, 'Rèn'],
  [/\bchớnh\s+xỏc\b/gi, 'chính xác'],
  [/\bChớnh\s+xỏc\b/g, 'Chính xác'],
  [/\bchớnh\b/gi, 'chính'],
  [/\bxỏc\b/gi, 'xác'],
  [/\bcắt\s+gúp\b/gi, 'cắt ghép'],
  [/\bgúp\b/gi, 'ghép'],
  [/\blắp\s+rúp\b/gi, 'lắp ráp'],
  [/\brúp\b/gi, 'ráp'],
  [/\bvật\s+liêu\b/gi, 'vật liệu'],
  [/\bvật\s+liệu\b/gi, 'vật liệu'],
  [/\bphộp\s+cộng\b/gi, 'phép cộng'],
  [/\bphộp\s+trừ\b/gi, 'phép trừ'],
  [/\bphộp\s+nhân\b/gi, 'phép nhân'],
  [/\bphộp\s+chia\b/gi, 'phép chia'],
  [/\bphộp\s+toỏn\b/gi, 'phép toán'],
  [/\bphộp\b/gi, 'phép'],
  [/\bPhộp\b/g, 'Phép'],
  [/\bbài\s+toỏn\b/gi, 'bài toán'],
  [/\btoỏn\b/gi, 'toán'],
  [/\bToỏn\b/g, 'Toán'],
  [/\bcông\s+cự\b/gi, 'công cụ'],
  [/\bcụng\s+cự\b/gi, 'công cụ'],
  [/\bcụng\s+cụ\b/gi, 'công cụ'],
  [/\bthụng\s+minh\b/gi, 'thông minh'],
  [/\bthụng\b/gi, 'thông'],
  [/\bThụng\b/g, 'Thông'],
  [/\bquan\s+sỏt\b/gi, 'quan sát'],
  [/\bQuan\s+sỏt\b/g, 'Quan sát'],
  [/\bnhận\s+xột\b/gi, 'nhận xét'],
  [/\bNhận\s+xột\b/g, 'Nhận xét'],
  [/\bxột\b/gi, 'xét'],
  [/\bđánh\s+giỏ\b/gi, 'đánh giá'],
  [/\bĐánh\s+giỏ\b/g, 'Đánh giá'],
  [/\bkiểm\s+tra\b/gi, 'kiểm tra'],
  [/\bthực\s+hành\b/gi, 'thực hành'],
  [/\btrải\s+nghiệm\b/gi, 'trải nghiệm'],

  // People & Pedagogy
  [/\bgiòo\s+viờn\b/gi, 'giáo viên'],
  [/\bGiòo\s+viờn\b/g, 'Giáo viên'],
  [/\bgiòo\s+dục\b/gi, 'giáo dục'],
  [/\bGiòo\s+dục\b/g, 'Giáo dục'],
  [/\bgiòo\s+viên\b/gi, 'giáo viên'],
  [/\bgiòo\s+án\b/gi, 'giáo án'],
  [/\bchuyờn\s+mụn\b/gi, 'chuyên môn'],
  [/\bChuyờn\s+mụn\b/g, 'Chuyên môn'],
  [/\bbộ\s+mụn\b/gi, 'bộ môn'],
  [/\bBộ\s+mụn\b/g, 'Bộ môn'],
  [/\bcụng\s+tòc\b/gi, 'công tác'],
  [/\btõm\s+huyết\b/gi, 'tâm huyết'],
  [/\bsay\s+mờ\b/gi, 'say mê'],
  [/\btròch\s+nhiệm\b/gi, 'trách nhiệm'],
  [/\bvỡ\s+lợi\s+ích\b/gi, 'vì lợi ích'],
  [/\blờn\s+hàng\s+đầu\b/gi, 'lên hàng đầu'],
  [/\btrở\s+lờn\b/gi, 'trở lên'],
  [/\bkhụng\s+chủ\s+quan\b/gi, 'không chủ quan'],
  [/\bkhụng\b/gi, 'không'],
  [/\brỳt\s+kinh\s+nghiệm\b/gi, 'rút kinh nghiệm'],
  [/\brỳt\b/gi, 'rút'],
  [/\bnõng\s+cao\b/gi, 'nâng cao'],
  [/\bkhảo\s+sót\b/gi, 'khảo sát'],
  [/\bphơng\s+phòp\b/gi, 'phương pháp'],
  [/\bphương\s+phòp\b/gi, 'phương pháp'],
  [/\bphòp\b/gi, 'pháp'],
  [/\btròch\b/gi, 'trách'],
  [/\bsòch\b/gi, 'sách'],
  [/\bbóo\s+cáo\b/gi, 'báo cáo'],
  [/\bbóo\s+kết\s+quả\b/gi, 'báo kết quả'],
  [/\bbóo\b/gi, 'báo'],
  [/\bụn\s+tập\b/gi, 'ôn tập'],
  [/\btổng\s+ụn\s+tập\b/gi, 'tổng ôn tập'],
  [/\bluyện\s+tập\b/gi, 'luyện tập'],
  [/\bbồi\s+dưỡng\b/gi, 'bồi dưỡng'],
  [/\bcú\s+năng\s+lực\b/gi, 'có năng lực'],
  [/\bcú\s+tinh\s+thần\b/gi, 'có tinh thần'],
  [/\bcú\s+kết\s+quả\b/gi, 'có kết quả'],
  [/\bhợp\s+lớ\b/gi, 'hợp lý'],
  [/\bđú\s+học\b/gi, 'đã học'],
  [/\bhữu\s+t[iìí]\b/gi, 'hữu tỉ'],
  [/\bhữu\s+ti\+/gi, 'hữu tỉ. +'],
  [/\btrung\s+bờnh\b/gi, 'trung bình'],
  [/\bkộm\b/gi, 'kém'],
  [/\byếu\s*,\s*kộm\b/gi, 'yếu, kém'],
  [/\bkế\s+hoòch\b/gi, 'kế hoạch'],
  [/\bquan\s+tõm\b/gi, 'quan tâm'],
  [/\btớch\s+hợp\b/gi, 'tích hợp'],
  [/\bmã\s+chỉ\s+bóo\b/gi, 'mã chỉ báo'],
  [/\bchỉ\s+bóo\b/gi, 'chỉ báo'],

  // Cleanup outdated indicator placeholders
  [/\(NLSC\d+\)/gi, ''],
  [/\bNLSC\d+\b/gi, ''],
  [/\(NLS\d+\)/gi, ''],
  [/\b\[r\]\s*õ[^\)]*/gi, ''],

  // Restorations for words distorted by legacy 1-byte conversions
  [/\bMỀN\s+HỌC\b/g, 'MÔN HỌC'],
  [/\bmền\s+học\b/gi, 'môn học'],
  [/\bCHUYẨN\s+MỀN\b/g, 'CHUYÊN MÔN'],
  [/\bchuyển\s+mền\b/gi, 'chuyên môn'],
  [/\bKốm\s+theo\b/gi, 'Kèm theo'],
  [/\bKỐM\s+THEO\b/g, 'KÈM THEO'],
  [/\bDANH\s+MÓC\b/g, 'DANH MỤC'],
  [/\bdanh\s+móc\b/gi, 'danh mục'],
  [/\bMÓ\s+CHỈ\s+BỎO\b/g, 'MÃ CHỈ BÁO'],
  [/\bMú\s+chỉ\s+bơo\b/gi, 'Mã chỉ báo'],
  [/\bmú\s+chỉ\s+bơo\b/gi, 'mã chỉ báo'],
  [/\bchỉ\s+bơo\b/gi, 'chỉ báo'],
  [/\bTỡm\s+kiếm\b/gi, 'Tìm kiếm'],
  [/\btỡm\s+kiếm\b/gi, 'tìm kiếm'],
  [/\btrỏch\s+xuất\b/gi, 'trích xuất'],
  [/\bTrỏch\s+xuất\b/gi, 'Trích xuất'],
  [/\bĐỏnh\s+giỏ\b/gi, 'Đánh giá'],
  [/\bđỏnh\s+giỏ\b/gi, 'đánh giá'],
  [/\bnhúm\s+trờn\b/gi, 'nhóm trên'],
  [/\bnhúm\b/gi, 'nhóm'],
  [/\bNhúm\b/g, 'Nhóm'],
  [/\btrờn\b/gi, 'trên'],
  [/\bTrờn\b/g, 'Trên'],
  [/\bcú\s+nhân\b/gi, 'cá nhân'],
  [/\bCú\s+nhân\b/g, 'Cá nhân'],
  [/\bỨng\s+dông\b/gi, 'Ứng dụng'],
  [/\bứng\s+dông\b/gi, 'ứng dụng'],
  [/\bỨng\s+dóng\b/gi, 'Ứng dụng'],
  [/\bứng\s+dóng\b/gi, 'ứng dụng'],
  [/\bmu\s+phỏng\b/gi, 'mô phỏng'],
  [/\bMu\s+phỏng\b/g, 'Mô phỏng'],
  [/\btrực\s+quan\s+húa\b/gi, 'trực quan hóa'],
  [/\bTrớ\s+tuệ\b/gi, 'Trí tuệ'],
  [/\btrớ\s+tuệ\b/gi, 'trí tuệ'],
  [/\bvai\s+trù\b/gi, 'vai trò'],
  [/\bvai\s+trũ\b/gi, 'vai trò'],
  [/\bcỳ\s+trách\s+nhiệm\b/gi, 'có trách nhiệm'],
  [/\bcỳ\b/gi, 'có'],
  [/\bCỳ\b/g, 'Có'],
  [/\btôn\s+thủ\b/gi, 'tuân thủ'],
  [/\bTôn\s+thủ\b/g, 'Tuân thủ'],
  [/\bphụ\s+hợp\b/gi, 'phù hợp'],
  [/\bphụ\s+hơp\b/gi, 'phù hợp'],
  [/\bphõn\s+tớch\b/gi, 'phân tích'],
  [/\bPhõn\s+tớch\b/g, 'Phân tích'],
  [/\bcõu\s+hỏi\b/gi, 'câu hỏi'],
  [/\bCõu\s+hỏi\b/g, 'Câu hỏi'],
  [/\bhọc\s+thuật\b/gi, 'học thuật'],
  [/\btrí\s+tuệ\s+nhân\s+tạo\b/gi, 'Trí tuệ Nhân tạo'],
  [/\bthụng\s+tin\b/gi, 'thông tin'],
  [/\bThụng\s+tin\b/g, 'Thông tin'],
  [/\bM[ÔOôo]C\s+TIÊU\b/g, 'MỤC TIÊU'],
  [/\bm[ôo]c\s+tiêu\b/gi, 'mục tiêu'],
  [/\bM[ÔOôo]C\s+ĐÍCH\b/g, 'MỤC ĐÍCH'],
  [/\bm[ôo]c\s+đích\b/gi, 'mục đích']
];

/**
 * Checks if a string is already standard precomposed UTF-8 Vietnamese.
 */
export function isAlreadyUnicode(str: string): boolean {
  if (!str) return true;
  // Specific distinct multi-byte Vietnamese codepoints that do not exist in CP1252/TCVN3
  const distinctUnicode = /[đĐơưăâêôấầẩẫậếềểễệốồổỗộớờởỡợứừửữựạảịỉọỏụủỵỷỹÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]/i;
  return distinctUnicode.test(str);
}

/**
 * Checks if a string contains genuine legacy TCVN3 characters (without standard Unicode)
 */
export function isTcvn3(str: string): boolean {
  if (!str) return false;
  if (isAlreadyUnicode(str)) return false;
  // Match distinct TCVN3 non-Latin markers (excluding standard math symbols like × or §)
  const tcvn3Pattern = /[µ¸¶·¹¨»¾¼½Æ©ÇÊÈÉËÌÐÎÏÑªÒÕÓÔÖØÜÞß«åç¬®¡¢£¤¥¦]/g;
  const matches = str.match(tcvn3Pattern) || [];
  return matches.length > 5;
}

/**
 * Converts TCVN3 (ABC / .VnTime) text to Unicode UTF-8
 */
export function convertTcvn3ToUnicode(text: string): string {
  if (!text) return '';
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    result += TCVN3_CHAR_MAP[ch] !== undefined ? TCVN3_CHAR_MAP[ch] : ch;
  }
  return result.normalize('NFC');
}

/**
 * Converts VNI-encoded text to Unicode UTF-8
 */
export function convertVniToUnicode(text: string): string {
  if (!text) return '';
  let result = text;
  for (const [vni, uni] of Object.entries(VNI_PAIRS_MAP)) {
    result = result.split(vni).join(uni);
  }
  return result.normalize('NFC');
}

/**
 * Repairs corrupted 1-byte font characters (e.g. giòo viờn, mụn, tõm, cú, kộm, rỳt)
 */
export function repairCorruptedVietnameseWords(text: string): string {
  if (!text) return '';
  let result = text;

  // Apply dictionary replacements
  for (const [pattern, replacement] of DISTORTED_WORDS_MAP) {
    result = result.replace(pattern, replacement);
  }

  return result;
}

/**
 * Ensures words containing "cực" (e.g. tích cực, cực kỳ, cực trị, vô cực, cực đại, cực tiểu)
 * are never corrupted to "cục", and repairs any incorrect "cục" instances while strictly preserving case.
 */
export function restoreVietnameseCucWords(text: string): string {
  if (!text) return '';

  return text
    // 1. Tích cực
    .replace(/(?<![a-zA-Zà-ỹÀ-Ỹ])tích\s+cục(?![a-zA-Zà-ỹÀ-Ỹ])/gi, (m) => {
      if (m === m.toUpperCase()) return 'TÍCH CỰC';
      if (/^T/.test(m)) return m.split(/\s+/)[1]?.[0] === 'C' ? 'Tích Cực' : 'Tích cực';
      return 'tích cực';
    })
    // 2. Vô cực
    .replace(/(?<![a-zA-Zà-ỹÀ-Ỹ])vô\s+cục(?![a-zA-Zà-ỹÀ-Ỹ])/gi, (m) => {
      if (m === m.toUpperCase()) return 'VÔ CỰC';
      if (/^V/.test(m)) return m.split(/\s+/)[1]?.[0] === 'C' ? 'Vô Cực' : 'Vô cực';
      return 'vô cực';
    })
    // 3. Tiêu cực
    .replace(/(?<![a-zA-Zà-ỹÀ-Ỹ])tiêu\s+cục(?![a-zA-Zà-ỹÀ-Ỹ])/gi, (m) => {
      if (m === m.toUpperCase()) return 'TIÊU CỰC';
      if (/^T/.test(m)) return 'Tiêu cực';
      return 'tiêu cực';
    })
    // 4. Điện cực
    .replace(/(?<![a-zA-Zà-ỹÀ-Ỹ])điện\s+cục(?![a-zA-Zà-ỹÀ-Ỹ])/gi, (m) => {
      if (m === m.toUpperCase()) return 'ĐIỆN CỰC';
      if (/^Đ/.test(m)) return 'Điện cực';
      return 'điện cực';
    })
    // 5. Cực trị
    .replace(/(?<![a-zA-Zà-ỹÀ-Ỹ])cục\s+trị(?![a-zA-Zà-ỹÀ-Ỹ])/gi, (m) => {
      if (m === m.toUpperCase()) return 'CỰC TRỊ';
      if (/^C/.test(m)) return m.split(/\s+/)[1]?.[0] === 'T' ? 'Cực Trị' : 'Cực trị';
      return 'cực trị';
    })
    // 6. Cực đại
    .replace(/(?<![a-zA-Zà-ỹÀ-Ỹ])cục\s+đại(?![a-zA-Zà-ỹÀ-Ỹ])/gi, (m) => {
      if (m === m.toUpperCase()) return 'CỰC ĐẠI';
      if (/^C/.test(m)) return m.split(/\s+/)[1]?.[0] === 'Đ' ? 'Cực Đại' : 'Cực đại';
      return 'cực đại';
    })
    // 7. Cực tiểu
    .replace(/(?<![a-zA-Zà-ỹÀ-Ỹ])cục\s+tiểu(?![a-zA-Zà-ỹÀ-Ỹ])/gi, (m) => {
      if (m === m.toUpperCase()) return 'CỰC TIỂU';
      if (/^C/.test(m)) return m.split(/\s+/)[1]?.[0] === 'T' ? 'Cực Tiểu' : 'Cực tiểu';
      return 'cực tiểu';
    })
    // 8. Cực kỳ / Cực kì
    .replace(/(?<![a-zA-Zà-ỹÀ-Ỹ])cục\s+(kỳ|kì)(?![a-zA-Zà-ỹÀ-Ỹ])/gi, (m, k) => {
      const targetK = k.toLowerCase() === 'kỳ' ? 'kỳ' : 'kì';
      if (m === m.toUpperCase()) return `CỰC ${targetK.toUpperCase()}`;
      if (/^C/.test(m)) return `Cực ${targetK}`;
      return `cực ${targetK}`;
    })
    // 9. Cực điểm
    .replace(/(?<![a-zA-Zà-ỹÀ-Ỹ])cục\s+điểm(?![a-zA-Zà-ỹÀ-Ỹ])/gi, (m) => {
      if (m === m.toUpperCase()) return 'CỰC ĐIỂM';
      if (/^C/.test(m)) return 'Cực điểm';
      return 'cực điểm';
    })
    // 10. Cực hạn
    .replace(/(?<![a-zA-Zà-ỹÀ-Ỹ])cục\s+hạn(?![a-zA-Zà-ỹÀ-Ỹ])/gi, (m) => {
      if (m === m.toUpperCase()) return 'CỰC HẠN';
      if (/^C/.test(m)) return 'Cực hạn';
      return 'cực hạn';
    })
    // 11. Cực từ / Cực Nam / Cực Bắc
    .replace(/(?<![a-zA-Zà-ỹÀ-Ỹ])cục\s+từ(?![a-zA-Zà-ỹÀ-Ỹ])/gi, (m) => {
      if (m === m.toUpperCase()) return 'CỰC TỪ';
      if (/^C/.test(m)) return 'Cực từ';
      return 'cực từ';
    })
    .replace(/(?<![a-zA-Zà-ỹÀ-Ỹ])cục\s+(Bắc|Nam)(?![a-zA-Zà-ỹÀ-Ỹ])/gi, (_m, pole) => {
      return `Cực ${pole.charAt(0).toUpperCase() + pole.slice(1).toLowerCase()}`;
    })
    // 12. Cực đoan
    .replace(/(?<![a-zA-Zà-ỹÀ-Ỹ])cục\s+đoan(?![a-zA-Zà-ỹÀ-Ỹ])/gi, (m) => {
      if (m === m.toUpperCase()) return 'CỰC ĐOAN';
      if (/^C/.test(m)) return 'Cực đoan';
      return 'cực đoan';
    })
    // 13. Lưỡng cực / Địa cực / Đa cực
    .replace(/(?<![a-zA-Zà-ỹÀ-Ỹ])(lưỡng|địa|đa)\s+cục(?![a-zA-Zà-ỹÀ-Ỹ])/gi, (m, p) => {
      const capP = p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
      if (m === m.toUpperCase()) return `${p.toUpperCase()} CỰC`;
      if (/^[A-ZÀ-Ỹ]/.test(m)) return `${capP} cực`;
      return `${p.toLowerCase()} cực`;
    })
    // 14. Hai cực (của nam châm / tế bào)
    .replace(/(?<![a-zA-Zà-ỹÀ-Ỹ])(hai|2)\s+cục\s+(nam\s+châm|tế\s+bào|pin)/gi, '$1 cực $2')
    // 15. Glued forms
    .replace(/(?<![a-zA-Zà-ỹÀ-Ỹ])tíchc[ựụ]c(?![a-zA-Zà-ỹÀ-Ỹ])/gi, 'tích cực')
    .replace(/(?<![a-zA-Zà-ỹÀ-Ỹ])Tíchc[ựụ]c(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'Tích cực')
    .replace(/(?<![a-zA-Zà-ỹÀ-Ỹ])TÍCHC[ỰỤ]C(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'TÍCH CỰC')
    .replace(/(?<![a-zA-Zà-ỹÀ-Ỹ])c[ựụ]ckỳ(?![a-zA-Zà-ỹÀ-Ỹ])/gi, 'cực kỳ')
    .replace(/(?<![a-zA-Zà-ỹÀ-Ỹ])C[ựụ]ckỳ(?![a-zA-Zà-ỹÀ-Ỹ])/g, 'Cực kỳ')
    .replace(/(?<![a-zA-Zà-ỹÀ-Ỹ])c[ựụ]ctrị(?![a-zA-Zà-ỹÀ-Ỹ])/gi, 'cực trị')
    .replace(/(?<![a-zA-Zà-ỹÀ-Ỹ])vôc[ựụ]c(?![a-zA-Zà-ỹÀ-Ỹ])/gi, 'vô cực')
    .replace(/(?<![a-zA-Zà-ỹÀ-Ỹ])c[ựụ]cđại(?![a-zA-Zà-ỹÀ-Ỹ])/gi, 'cực đại')
    .replace(/(?<![a-zA-Zà-ỹÀ-Ỹ])c[ựụ]ctiểu(?![a-zA-Zà-ỹÀ-Ỹ])/gi, 'cực tiểu');
}

/**
 * Auto-detects and converts legacy Vietnamese fonts (TCVN3 / VNI / Distorted) to clean standard Unicode
 */
export function autoNormalizeVietnameseFont(text: string): string {
  if (!text) return '';
  
  let result = text;

  // 1. Check for TCVN3 ONLY if not already clean Unicode
  if (isTcvn3(result)) {
    const converted = convertTcvn3ToUnicode(result);
    if (isAlreadyUnicode(converted)) {
      result = converted;
    }
  }

  // 2. Check for VNI ONLY if not already clean Unicode
  if (!isAlreadyUnicode(result) && /([aeiouy][ùøûõïéèáàóòúù])|ñ|Ñ/i.test(result)) {
    const vniConverted = convertVniToUnicode(result);
    if (vniConverted !== result) {
      result = vniConverted;
    }
  }

  // 3. Repair corrupted words from 1-byte font decodings
  result = repairCorruptedVietnameseWords(result);

  // 4. Guarantee accurate spelling for words with "cực" (preserving casing and fixing typos)
  result = restoreVietnameseCucWords(result);

  // 5. Fix uppercase diacritic Ư stuck inside lowercase or capitalized words (e.g. thƯớc -> thước, ThƯớc -> Thước, bƯớc -> bước)
  // While strictly preserving valid acronyms like ƯCLN, ƯC, BCNN, BC
  result = result.replace(/(?<=[a-zà-ỹ])Ư(?=[a-zà-ỹ])/g, 'ư');
  result = result.replace(/(?<=\b[A-ZÀ-Ỹ])Ư(?=[a-zà-ỹ]+)/g, 'ư');

  // Return normalized Unicode NFC
  return result.normalize('NFC');
}

