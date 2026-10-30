/**
 * Math & TeX Sanitizer for Vietnamese Educational Documents
 * Ensures 100% compatibility with Microsoft Word, MathType Toggle TeX, and A4 Preview.
 * 
 * Fixes broken/decomposed Vietnamese text (e.g., "Kiê' n", "phâ` n", "Vê`", "đô' i", "bă` ng", "dâ' u"),
 * unglues words accidentally concatenated by OCR, repairs orphan markdown tags (**),
 * and strictly separates Vietnamese text from LaTeX math delimiters ($...$).
 */

import { restoreVietnameseCucWords } from './vietnameseFontConverter';

export const VIETNAMESE_ACCENT_REGEX = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]/;

/**
 * Maps vowel + tone mark symbols to precomposed Vietnamese Unicode characters.
 */
const TONE_MAP: Record<string, string> = {
  "a'": "á", "a`": "à", "a?": "ả", "a~": "ã", "a.": "ạ",
  "â'": "ấ", "â`": "ầ", "â?": "ẩ", "â~": "ẫ", "â.": "ậ",
  "ă'": "ắ", "ă`": "ằ", "ă?": "ẳ", "ă~": "ẵ", "ă.": "ặ",
  "e'": "é", "e`": "è", "e?": "ẻ", "e~": "ẽ", "e.": "ẹ",
  "ê'": "ế", "ê`": "ề", "ê?": "ể", "ê~": "ễ", "ê.": "ệ",
  "i'": "í", "i`": "ì", "i?": "ỉ", "i~": "ĩ", "i.": "ị",
  "o'": "ó", "o`": "ò", "o?": "ỏ", "o~": "õ", "o.": "ọ",
  "ô'": "ố", "ô`": "ồ", "ô?": "ổ", "ô~": "ỗ", "ô.": "ộ",
  "ơ'": "ớ", "ơ`": "ờ", "ơ?": "ở", "ơ~": "ỡ", "ơ.": "ợ",
  "u'": "ú", "u`": "ù", "u?": "ủ", "u~": "ũ", "u.": "ụ",
  "ư'": "ứ", "ư`": "ừ", "ư?": "ử", "ư~": "ữ", "ư.": "ự",
  "y'": "ý", "y`": "ỳ", "y?": "ỷ", "y~": "ỹ", "y.": "ỵ"
};

function preserveCase(original: string, targetUpper: string, targetTitle: string, targetLower: string): string {
  const clean = original.replace(/[\s'`´’‘]+/g, '');
  if (clean === clean.toUpperCase()) return targetUpper;
  if (clean.charAt(0) === clean.charAt(0).toUpperCase()) return targetTitle;
  return targetLower;
}

/**
 * Repairs broken/decomposed Vietnamese accents and OCR artifacts.
 * E.g. "Vê` Kiê' n thức" -> "Về Kiến thức", "phâ` n tử" -> "phần tử", "đô' i tượng" -> "đối tượng",
 * "đố`i" -> "đối", "gầ`n" -> "gần", "Phầ`n" -> "Phần", "nằ`m" -> "nằm", "Số`" -> "Số"
 * Also unglues words stuck together without breaking math or punctuation.
 */
export function repairVietnameseText(raw: string): string {
  if (!raw) return '';

  let text = (raw || '').normalize('NFC');

  // 0a. Clean non-printable control characters, UTF-8 replacement characters (\uFFFD), and legacy font artifacts
  // Preserves legitimate tabs (\t) and newlines (\n)
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFFFD]/g, '');

  // 0b. Distinguish between intentional fill-in-the-blank boxes vs corrupted bullet/encoding symbols:
  // - Convert Wingdings bullets / legacy bullet glyphs (\uF0A7, \uF0B7) into standard list hyphens "- "
  // - If a square box (□, ▯, ▭, \square) is placed at the start of a paragraph/table line as a bullet, convert to "- "
  // - PRESERVE fill-in square boxes in math, exercises, and questionnaires (e.g. "[ ? ]", "[   ]", "15 □ A", "5 [ ? ] N")
  text = text.replace(/^[ \t]*[\uF0A7\uF0B7][ \t]*/gm, '- ');
  text = text.replace(/^[ \t]*[□▯▭■][ \t]+(?=[A-ZÀ-Ỹ0-9\*\#])/gm, '- ');
  text = text.replace(/[\uF0FC]/g, '✓');
  text = text.replace(/[\uF0E0]/g, '✉');
  text = text.replace(/[\uE000-\uF8FF]/g, ''); // Strip unrecognized Private Use Area glyphs

  // Standardize fill-in boxes in exercises: "[ ?]", "[? ]", "[?]", "\boxed{?}", "\boxed{...}" -> "[ ? ]"
  text = text.replace(/\[\s*\?\s*\]/g, '[ ? ]');
  text = text.replace(/\[\s*\.{3,}\s*\]/g, '[ ... ]');

  // 0. Remove stray backticks / combining acute / grave marks ONLY when sandwiched directly inside a single word (NO whitespace around accent)
  // e.g. "đố`i" -> "đối", "gầ`n" -> "gần", "cầ`n" -> "cần", "Phầ`n" -> "Phần", "nằ`m" -> "nằm", "hồ`i" -> "hồi", "dấ`u" -> "dấu", "vầ`n" -> "vần", "Số`" -> "Số"
  // CRITICAL: NEVER match across whitespace `\s*`, otherwise "Liệt kê 'tên'" or "kê `tên`" loses its space and becomes "kêtên"!
  text = text.replace(/([a-zA-ZÀ-ỹ])[`'´’‘]([a-zA-ZÀ-ỹ])/g, (_m, c1, c2) => {
    return `${c1}${c2}`;
  });
  text = text.replace(/([áàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵÁÀẢÃẠẮẰẲẴẶẤẦẨẪẬÉÈẺẼẸẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌỐỒỔỖỘỚỜỞỠỢÚÙỦŨỤỨỪỬỮỰÝỲỶỸỴ])[`'´’‘]+/g, '$1');

  // Convert math in backticks into $...$ (e.g. `(3+\sqrt{3}) xy` -> $(3+\sqrt{3})xy$, `2\sqrt{x}y` -> $2\sqrt{x}y$, `\frac{1}{y} x^2` -> $\dfrac{1}{y}x^2$, ` - x` -> $-x$)
  text = text.replace(/`([^`\n]+)`/g, (_m, inner) => {
    const trimmed = inner.trim();
    if (/[\\^_{}=+\-*/<>≤≥≠≈∈∉⊂∩∪∅√]|(?:frac|dfrac|sqrt)/.test(trimmed) || /^[+-]?\s*[0-9]*[a-zA-Z](?:\^[0-9]+)?$/.test(trimmed)) {
      return `$${trimmed}$`;
    }
    return trimmed;
  });

  // Remove quotes around physical measurement units (e.g. "kg", ''kg'', 'kg', "đồng", "nghìn đồng")
  text = text.replace(/["“”'‘’]{1,2}(kg|g|mg|tấn|tạ|yến|m|cm|mm|dm|km|lít|ml|đồng|nghìn\s*đồng|triệu\s*đồng|tỉ\s*đồng|km\/h|m\/s|phút|giây|giờ|ngày|năm|người|học\s*sinh|cây|quyển|viên|chiếc|quả)["“”'‘’]{1,2}/gi, '$1');
  text = text.replace(/(?<=[0-9a-zA-Z\(\)\s*+×\-\/])["“”'‘’]{1,2}([a-zA-ZÀ-ỹ\s]+)["“”'‘’]{1,2}/g, '$1');

  // Remove stray double single quotes '' and remaining stray backticks
  text = text.replace(/''/g, '"');
  text = text.replace(/[`´’‘]{2,}/g, '"');
  text = text.replace(/`+/g, '');
  text = text.replace(/(^|[\s(])["']\s*([a-zA-Z0-9$]+)\s*["'](?=[\s),;:.!?]|$)/g, '$1$2');

  // Deduplicate redundant colons: e.g. "**Ví dụ:** : :", "Ví dụ: : :", ":::"
  text = text.replace(/\*\*([^*]+:)\*\*\s*:+/g, '**$1** ');
  text = text.replace(/\*\*([^*:]+)\*\*\s*:\s*:+/g, '**$1:** ');
  text = text.replace(/(?::\s*){2,}/g, ': ');
  text = text.replace(/:\s*:+/g, ':');
  text = text.replace(/([a-zA-ZÀ-ỹ0-9]):\s*:\s*/g, '$1: ');
  text = text.replace(/\b(Ví dụ|Bài tập|Luyện tập|Vận dụng|Lời giải|Chú ý|Ghi nhớ|Khám phá)\s*:\s*:+/gi, '**$1:** ');
  text = text.replace(/\n[ \t]*:[ \t]*\n/g, '\n');

  // Restore sub-exercise numbers like "**Bài 1:** 1 (SGK...)" -> "**Bài 1.1:** (SGK...)"
  text = text.replace(/\*\*(Bài|Ví dụ|Luyện tập|Vận dụng|Bài tập)\s*(\d+):\*\*\s*(\d+)\b/gi, '**$1 $2.$3:**');
  text = text.replace(/\b(Bài|Ví dụ|Luyện tập|Vận dụng|Bài tập)\s*(\d+)\s*:\s*(\d+)\b/gi, '$1 $2.$3:');

  // 1. Explicit targeted syllable fixes for common OCR / TeX disassembled syllables & typos
  const syllableFixes: [RegExp, string | ((...args: any[]) => string)][] = [
    // Tủ lạnh (sửa triệt để lỗi chính tả "tù lạnh", "tù lanh")
    [/(?<![a-zA-ZÀ-ỹ])tù\s+lạnh(?![a-zA-ZÀ-ỹ])/gi, (m: string) => preserveCase(m, 'TỦ LẠNH', 'Tủ lạnh', 'tủ lạnh')],
    // Các loại tủ khác bị gõ nhầm thành "tù" (tủ sách, tủ thuốc, tủ đồ, tủ quần áo, tủ kính, tủ đựng, tủ chè, tủ bếp, tủ tài liệu)
    [/(?<![a-zA-ZÀ-ỹ])tù\s+(sách|thuốc|tài\s+liệu|đồ|quần\s+áo|kính|đựng|chè|bếp)(?![a-zA-ZÀ-ỹ])/gi, (m: string, item: string) => {
      const tu = preserveCase(m.split(/\s+/)[0], 'TỦ', 'Tủ', 'tủ');
      return `${tu} ${item}`;
    }],
    // Sắp xếp (sửa lỗi "sắp sếp", "xắp xếp", "xắp sếp")
    [/(?<![a-zA-ZÀ-ỹ])(?:sắp\s+sếp|xắp\s+xếp|xắp\s+sếp)(?![a-zA-ZÀ-ỹ])/gi, (m: string) => preserveCase(m, 'SẮP XẾP', 'Sắp xếp', 'sắp xếp')],
    // Nỗ lực (sửa lỗi "lỗ lực")
    [/(?<![a-zA-ZÀ-ỹ])lỗ\s+lực(?![a-zA-ZÀ-ỹ])/gi, (m: string) => preserveCase(m, 'NỖ LỰC', 'Nỗ lực', 'nỗ lực')],
    // Bổ sung (sửa lỗi "bổ xung")
    [/(?<![a-zA-ZÀ-ỹ])bổ\s+xung(?![a-zA-ZÀ-ỹ])/gi, (m: string) => preserveCase(m, 'BỔ SUNG', 'Bổ sung', 'bổ sung')],
    // Chia sẻ (sửa lỗi "chia xẻ")
    [/(?<![a-zA-ZÀ-ỹ])chia\s+xẻ(?![a-zA-ZÀ-ỹ])/gi, (m: string) => preserveCase(m, 'CHIA SẺ', 'Chia sẻ', 'chia sẻ')],
    // Hướng dẫn (sửa lỗi "hướng dẩn", "hướng dãn")
    [/(?<![a-zA-ZÀ-ỹ])hướng\s+d[ẩã]n(?![a-zA-ZÀ-ỹ])/gi, (m: string) => preserveCase(m, 'HƯỚNG DẪN', 'Hướng dẫn', 'hướng dẫn')],
    // Thảo luận (sửa lỗi "thảo luân", "thảo lận")
    [/(?<![a-zA-ZÀ-ỹ])thảo\s+(?:luân|lận)(?![a-zA-ZÀ-ỹ])/gi, (m: string) => preserveCase(m, 'THẢO LUẬN', 'Thảo luận', 'thảo luận')],
    // Sơ suất (sửa lỗi "sơ xuất")
    [/(?<![a-zA-ZÀ-ỹ])sơ\s+xuất(?![a-zA-ZÀ-ỹ])/gi, (m: string) => preserveCase(m, 'SƠ SUẤT', 'Sơ suất', 'sơ suất')],
    // Xác suất (sửa lỗi "xác xuất")
    [/(?<![a-zA-ZÀ-ỹ])xác\s+xuất(?![a-zA-ZÀ-ỹ])/gi, (m: string) => preserveCase(m, 'XÁC SUẤT', 'Xác suất', 'xác suất')],
    // Năng suất (sửa lỗi "năng xuất")
    [/(?<![a-zA-ZÀ-ỹ])năng\s+xuất(?![a-zA-ZÀ-ỹ])/gi, (m: string) => preserveCase(m, 'NĂNG SUẤT', 'Năng suất', 'năng suất')],
    // Xuất hiện (sửa lỗi "suất hiện")
    [/(?<![a-zA-ZÀ-ỹ])suất\s+hiện(?![a-zA-ZÀ-ỹ])/gi, (m: string) => preserveCase(m, 'XUẤT HIỆN', 'Xuất hiện', 'xuất hiện')],
    // Trau dồi (sửa lỗi "chau dồi")
    [/(?<![a-zA-ZÀ-ỹ])chau\s+dồi(?![a-zA-ZÀ-ỹ])/gi, (m: string) => preserveCase(m, 'TRAU DỒI', 'Trau dồi', 'trau dồi')],
    // Chắt lọc (sửa lỗi "trắt lọc")
    [/(?<![a-zA-ZÀ-ỹ])trắt\s+lọc(?![a-zA-ZÀ-ỹ])/gi, (m: string) => preserveCase(m, 'CHẮT LỌC', 'Chắt lọc', 'chắt lọc')],
    // Cọ xát (sửa lỗi "cọ sát")
    [/(?<![a-zA-ZÀ-ỹ])cọ\s+sát(?![a-zA-ZÀ-ỹ])/gi, (m: string) => preserveCase(m, 'CỌ XÁT', 'Cọ xát', 'cọ xát')],
    // Tóm tắt (sửa lỗi "tóm tắc")
    [/(?<![a-zA-ZÀ-ỹ])tóm\s+tắc(?![a-zA-ZÀ-ỹ])/gi, (m: string) => preserveCase(m, 'TÓM TẮT', 'Tóm tắt', 'tóm tắt')],
    // Xán lạn (sửa lỗi "sáng lạng", "xáng lạn")
    [/(?<![a-zA-ZÀ-ỹ])(?:sáng|xáng)\s+lạng(?![a-zA-ZÀ-ỹ])/gi, (m: string) => preserveCase(m, 'XÁN LẠN', 'Xán lạn', 'xán lạn')],
    // Trắc nghiệm (sửa lỗi "chắc nghiệm")
    [/(?<![a-zA-ZÀ-ỹ])chắc\s+nghiệm(?![a-zA-ZÀ-ỹ])/gi, (m: string) => preserveCase(m, 'TRẮC NGHIỆM', 'Trắc nghiệm', 'trắc nghiệm')],
    // Bản đồ tư duy (sửa lỗi "bản đồ tư du")
    [/(?<![a-zA-ZÀ-ỹ])bản\s+đồ\s+tư\s+du(?![a-zA-ZÀ-ỹ])/gi, (m: string) => preserveCase(m, 'BẢN ĐỒ TƯ DUY', 'Bản đồ tư duy', 'bản đồ tư duy')],
    // Thước / Kích thước / Thước kẻ (sửa triệt để lỗi "thƯớc", "ThƯớc", "kích thƯớc")
    [/(?<![a-zA-ZÀ-ỹ])thƯớc(?![a-zA-ZÀ-ỹ])/g, 'thước'],
    [/(?<![a-zA-ZÀ-ỹ])ThƯớc(?![a-zA-ZÀ-ỹ])/g, 'Thước'],
    [/(?<![a-zA-ZÀ-ỹ])THƯỚC(?![a-zA-ZÀ-ỹ])/g, 'THƯỚC'],
    [/(?<![a-zA-ZÀ-ỹ])kích\s+thƯớc(?![a-zA-ZÀ-ỹ])/gi, (m: string) => preserveCase(m, 'KÍCH THƯỚC', 'Kích thước', 'kích thước')],
    [/(?<![a-zA-ZÀ-ỹ])thƯớc\s+kẻ(?![a-zA-ZÀ-ỹ])/gi, (m: string) => preserveCase(m, 'THƯỚC KẺ', 'Thước kẻ', 'thước kẻ')],
    [/(?<![a-zA-ZÀ-ỹ])bƯớc(?![a-zA-ZÀ-ỹ])/g, 'bước'],
    [/(?<![a-zA-ZÀ-ỹ])BƯớc(?![a-zA-ZÀ-ỹ])/g, 'Bước'],
    [/(?<![a-zA-ZÀ-ỹ])trƯớc(?![a-zA-ZÀ-ỹ])/g, 'trước'],
    [/(?<![a-zA-ZÀ-ỹ])TrƯớc(?![a-zA-ZÀ-ỹ])/g, 'Trước'],
    [/(?<![a-zA-ZÀ-ỹ])đƯợc(?![a-zA-ZÀ-ỹ])/g, 'được'],
    [/(?<![a-zA-ZÀ-ỹ])ĐƯợc(?![a-zA-ZÀ-ỹ])/g, 'Được'],
    [/(?<![a-zA-ZÀ-ỹ])ngƯời(?![a-zA-ZÀ-ỹ])/g, 'người'],
    [/(?<![a-zA-ZÀ-ỹ])NgƯời(?![a-zA-ZÀ-ỹ])/g, 'Người'],
    [/(?<![a-zA-ZÀ-ỹ])nƯớc(?![a-zA-ZÀ-ỹ])/g, 'nước'],
    [/(?<![a-zA-ZÀ-ỹ])NƯớc(?![a-zA-ZÀ-ỹ])/g, 'Nước'],
    [/(?<![a-zA-ZÀ-ỹ])dƯới(?![a-zA-ZÀ-ỹ])/g, 'dưới'],
    [/(?<![a-zA-ZÀ-ỹ])DƯới(?![a-zA-ZÀ-ỹ])/g, 'Dưới'],
    // Tủ lạnh / Tủ đông (sửa triệt để lỗi chính tả "tù lạnh", "tu lạnh", "tù đông")
    [/(?<![a-zA-ZÀ-ỹ])t[ùu]\s+lạnh(?![a-zA-ZÀ-ỹ])/gi, (m: string) => preserveCase(m, 'TỦ LẠNH', 'Tủ lạnh', 'tủ lạnh')],
    [/(?<![a-zA-ZÀ-ỹ])t[ùu]\s+đông(?![a-zA-ZÀ-ỹ])/gi, (m: string) => preserveCase(m, 'TỦ ĐÔNG', 'Tủ đông', 'tủ đông')],
    // Trực quan (sửa lỗi "trực quang")
    [/(?<![a-zA-ZÀ-ỹ])trực\s+quang(?![a-zA-ZÀ-ỹ])/gi, (m: string) => preserveCase(m, 'TRỰC QUAN', 'Trực quan', 'trực quan')],
    // Phiêu lưu (sửa triệt để lỗi "phiếu lưu", "phiêu lưu toán học", "cuộc phiêu lưu")
    [/(?<![a-zA-ZÀ-ỹ])phiếu\s+lưu(?![a-zA-ZÀ-ỹ])/gi, (m: string) => preserveCase(m, 'PHIÊU LƯU', 'Phiêu lưu', 'phiêu lưu')],
    [/(?<![a-zA-ZÀ-ỹ])phiê\s*['´’‘`]?\s*u\s+lưu(?![a-zA-ZÀ-ỹ])/gi, (m: string) => preserveCase(m, 'PHIÊU LƯU', 'Phiêu lưu', 'phiêu lưu')],
    // Ví dụ (sửa lỗi "ví dục", "vi' du.", "Ví.dụ")
    [/\bv[íiì]\s*d[ụu]c\b/gi, (m: string) => preserveCase(m, 'VÍ DỤ', 'Ví dụ', 'ví dụ')],
    // Kiểm tra (sửa lỗi "kiểm ta", "kiễm tra")
    [/\bki[ểe]m\s+ta\b/gi, (m: string) => preserveCase(m, 'KIỂM TRA', 'Kiểm tra', 'kiểm tra')],
    // Xử lý (sửa lỗi "sử lý")
    [/\bs[ửu]\s*l[ýyí]\b/gi, (m: string) => preserveCase(m, 'XỬ LÝ', 'Xử lý', 'xử lý')],
    // Phùng Khắc Khoan
    [/Phùng\s+Khă\s*['´’‘`]?\s*c\s+Khoan/gi, 'Phùng Khắc Khoan'],
    [/\bKhă\s*['´’‘`]?\s*c\b/gi, (m: string) => preserveCase(m, 'KHẮC', 'Khắc', 'khắc')],
    // Phiếu
    [/\bPhiê\s*['´’‘`]?\s*u\b/gi, (m: string) => preserveCase(m, 'PHIẾU', 'Phiếu', 'phiếu')],
    [/\bPHIÊ\s*['´’‘`]?\s*U\b/g, 'PHIẾU'],
    [/\bPHIẾ\s*U\b/g, 'PHIẾU'],
    // Xuất
    [/\bxuâ\s*['´’‘`]?\s*t\b/gi, (m: string) => preserveCase(m, 'XUẤT', 'Xuất', 'xuất')],
    [/\bXUÂ\s*['´’‘`]?\s*T\b/g, 'XUẤT'],
    // Bắt đầu
    [/\bbă(?:\s*['´’‘`]\s*|\s+)t\s*đâ(?:\s*[`'´’‘]\s*|\s+)u\b/gi, (m: string) => preserveCase(m, 'BẮT ĐẦU', 'Bắt đầu', 'bắt đầu')],
    [/\bbă(?:\s*['´’‘`]\s*|\s+)t\b/gi, (m: string) => preserveCase(m, 'BẮT', 'Bắt', 'bắt')],
    // Kiến / kiến
    [/\bKiê(?:\s*['´’‘`]\s*|\s+)n\b/gi, (m: string) => preserveCase(m, 'KIẾN', 'Kiến', 'kiến')],
    [/\bKIÊ(?:\s*['´’‘`]\s*|\s+)N\b/g, 'KIẾN'],
    // Biết / biết
    [/\bBiê(?:\s*['´’‘`]\s*|\s+)t\b/gi, (m: string) => preserveCase(m, 'BIẾT', 'Biết', 'biết')],
    [/\bBIÊ(?:\s*['´’‘`]\s*|\s+)T\b/g, 'BIẾT'],
    // Phần / phần (strictly require tone mark or whitespace so legitimate word "Phân" like "phân số", "phân thức" is NEVER corrupted!)
    [/\bPhâ(?:\s*[`'´’‘]\s*|\s+)n\b/gi, (m: string) => preserveCase(m, 'PHẦN', 'Phần', 'phần')],
    [/\bPHÂ(?:\s*[`'´’‘]\s*|\s+)N\b/g, 'PHẦN'],
    // Về / về
    [/\bVê\s*[`'´’‘]\b/gi, (m: string) => preserveCase(m, 'VỀ', 'Về', 'về')],
    // Đối / đối
    [/\bĐô(?:\s*['´’‘`]\s*|\s+)i\b/gi, (m: string) => preserveCase(m, 'ĐỐI', 'Đối', 'đối')],
    [/\bĐÔ(?:\s*['´’‘`]\s*|\s+)I\b/g, 'ĐỐI'],
    // Bằng / bằng (require tone mark or whitespace so "băng" is preserved)
    [/\bBă(?:\s*[`'´’‘]\s*|\s+)ng\b/gi, (m: string) => preserveCase(m, 'BẰNG', 'Bằng', 'bằng')],
    // Dấu / dấu (require tone mark or whitespace so "dâu" is preserved)
    [/\bDâ(?:\s*['´’‘`]\s*|\s+)u\b/gi, (m: string) => preserveCase(m, 'DẤU', 'Dấu', 'dấu')],
    // Chất / chất
    [/\bChâ(?:\s*['´’‘`]\s*|\s+)t\b/gi, (m: string) => preserveCase(m, 'CHẤT', 'Chất', 'chất')],
    [/\bCHÂ(?:\s*['´’‘`]\s*|\s+)T\b/g, 'CHẤT'],
    // Kết / kết
    [/\bKê(?:\s*['´’‘`]\s*|\s+)t\b/gi, (m: string) => preserveCase(m, 'KẾT', 'Kết', 'kết')],
    // Tiếp / tiếp
    [/\bTiê(?:\s*['´’‘`]\s*|\s+)p\b/gi, (m: string) => preserveCase(m, 'TIẾP', 'Tiếp', 'tiếp')],
    // Chiếu / chiếu
    [/\bChiê(?:\s*['´’‘`]\s*|\s+)u\b/gi, (m: string) => preserveCase(m, 'CHIẾU', 'Chiếu', 'chiếu')],
    // Kiếm / kiếm
    [/\bKiê(?:\s*['´’‘`]\s*|\s+)m\b/gi, (m: string) => preserveCase(m, 'KIẾM', 'Kiếm', 'kiếm')],
    // Số / số / sống
    [/\bSố\s*['´’‘`]?\b/g, 'Số'],
    [/\bsố\s*['´’‘`]?\b/g, 'số'],
    [/\bSô\s*['´’‘`]\b/g, 'Số'],
    [/\bsô\s*['´’‘`]\b/g, 'số'],
    [/\bđời\s+số\s*['´’‘`]?\s*ng\b/gi, 'đời sống'],
    [/\bđời\s+sô\s*['´’‘`]?\s*ng\b/gi, 'đời sống'],
    // Đến / đến
    [/\bĐê(?:\s*['´’‘`]\s*|\s+)n\b/gi, (m: string) => preserveCase(m, 'ĐẾN', 'Đến', 'đến')],
    // Thực / thực
    [/\bThư(?:\s*[`'´’‘]\s*|\s+)c\b/gi, (m: string) => preserveCase(m, 'THỰC', 'Thực', 'thực')],
    // Mức / mức
    [/\bMư(?:\s*['´’‘`]\s*|\s+)c\b/gi, (m: string) => preserveCase(m, 'MỨC', 'Mức', 'mức')],
    // Mục / mục / mục tiêu / mÔC
    [/\bM[ụôu]\s*['´’‘`]?\s*c\b/gi, (m: string) => preserveCase(m, 'MỤC', 'Mục', 'mục')],
    [/\b(?:m[ôu]|M[ÔUu])\s*['´’‘`]?\s*c\s*tiêu\b/gi, (m: string) => preserveCase(m, 'MỤC TIÊU', 'Mục tiêu', 'mục tiêu')],
    [/\bM[ÔUuô]C\s*TIÊU\b/g, 'MỤC TIÊU'],
    [/\bMÔC\b/g, 'MỤC'],
    [/\bmÔC\b/g, 'mục'],
    [/\bmôc\b/g, 'mục'],
    // Lực / lực
    [/\bLư(?:\s*[`'´’‘]\s*|\s+)c\b/gi, (m: string) => preserveCase(m, 'LỰC', 'Lực', 'lực')],
    // Nhiệm / nhiệm
    [/\bNhiê(?:\s*['´’‘`]\s*|\s+)m\b/gi, (m: string) => preserveCase(m, 'NHIỆM', 'Nhiệm', 'nhiệm')],
    // Hiện / hiện
    [/\bHiê(?:\s*['´’‘`]\s*|\s+)n\b/gi, (m: string) => preserveCase(m, 'HIỆN', 'Hiện', 'hiện')],
    // Hoạt động - strictly preserve case
    [/\bHoạ\s*t\s*độ\s*ng\b/gi, (m: string) => preserveCase(m, 'HOẠT ĐỘNG', 'Hoạt động', 'hoạt động')],
    [/\bHOẠ\s*T\s*ĐỘ\s*NG\b/g, 'HOẠT ĐỘNG']
  ];

  for (const [regex, replacement] of syllableFixes) {
    // @ts-ignore
    text = text.replace(regex, replacement);
  }

  // 2. Generic repair for vowel + split tone mark when followed by word boundary or space
  text = text.replace(/([aăâeêioôơuưyAĂÂEÊIOÔƠUƯY])\s*([`'´’‘])(?=[a-zA-ZÀ-ỹ\s.,;:!?)]|$)/g, (_match, vowel, tone) => {
    const key = (vowel + (tone === '`' ? '`' : "'")).toLowerCase();
    const mapped = TONE_MAP[key];
    if (mapped) {
      return vowel === vowel.toUpperCase() ? mapped.toUpperCase() : mapped;
    }
    return vowel;
  });

  // Fix uppercase diacritic Ư stuck inside lowercase or capitalized words (e.g. thƯớc -> thước, ThƯớc -> Thước, bƯớc -> bước)
  // While strictly preserving valid acronyms like ƯCLN, ƯC, BCNN, BC
  text = text.replace(/(?<=[a-zà-ỹ])Ư(?=[a-zà-ỹ])/g, 'ư');
  text = text.replace(/(?<=\b[A-ZÀ-Ỹ])Ư(?=[a-zà-ỹ]+)/g, 'ư');

  // Final NFC normalization
  text = text.normalize('NFC');

  // 3. UNGLUE WORDS: Fix common sticking/glued words produced by OCR, LLM, or past regex while STRICTLY PRESERVING CASING
  const ungluePairs: [RegExp, string | ((...args: any[]) => string)][] = [
    // Syllables glued with "kê", "kể", "kết", "kế", "từng", "tên", "tổ", "trưởng"
    [/\bkêtên\b/gi, (m: string) => preserveCase(m, 'KÊ TÊN', 'Kê tên', 'kê tên')],
    [/\bkếtừng\b/gi, (m: string) => preserveCase(m, 'KỂ TỪNG', 'Kể từng', 'kể từng')],
    [/\bkểtừng\b/gi, (m: string) => preserveCase(m, 'KỂ TỪNG', 'Kể từng', 'kể từng')],
    [/\bkêtừng\b/gi, (m: string) => preserveCase(m, 'KÊ TỪNG', 'Kê từng', 'kê từng')],
    [/\bkếtquạtừng\b/gi, (m: string) => preserveCase(m, 'KẾT QUẢ TỪNG', 'Kết quả từng', 'kết quả từng')],
    [/\bliệtkêtừng\b/gi, (m: string) => preserveCase(m, 'LIỆT KÊ TỪNG', 'Liệt kê từng', 'liệt kê từng')],
    [/\btừngphầntử\b/gi, (m: string) => preserveCase(m, 'TỪNG PHẦN TỬ', 'Từng phần tử', 'từng phần tử')],
    [/\btừngphần\b/gi, (m: string) => preserveCase(m, 'TỪNG PHẦN', 'Từng phần', 'từng phần')],
    [/\btừngtiết\b/gi, (m: string) => preserveCase(m, 'TỪNG TIẾT', 'Từng tiết', 'từng tiết')],
    [/\btừngbước\b/gi, (m: string) => preserveCase(m, 'TỪNG BƯỚC', 'Từng bước', 'từng bước')],
    [/\btừngnhóm\b/gi, (m: string) => preserveCase(m, 'TỪNG NHÓM', 'Từng nhóm', 'từng nhóm')],
    [/\btừngcánhân\b/gi, (m: string) => preserveCase(m, 'TỪNG CÁ NHÂN', 'Từng cá nhân', 'từng cá nhân')],
    [/\btừnghọc\b/gi, (m: string) => preserveCase(m, 'TỪNG HỌC', 'Từng học', 'từng học')],
    [/\btừngem\b/gi, (m: string) => preserveCase(m, 'TỪNG EM', 'Từng em', 'từng em')],
    [/\btừngcâu\b/gi, (m: string) => preserveCase(m, 'TỪNG CÂU', 'Từng câu', 'từng câu')],
    [/\bkếtquả\b/gi, (m: string) => preserveCase(m, 'KẾT QUẢ', 'Kết quả', 'kết quả')],
    [/\bkếtluận\b/gi, (m: string) => preserveCase(m, 'KẾT LUẬN', 'Kết luận', 'kết luận')],
    [/\bkếthợp\b/gi, (m: string) => preserveCase(m, 'KẾT HỢP', 'Kết hợp', 'kết hợp')],
    [/\bkếthừa\b/gi, (m: string) => preserveCase(m, 'KẾ THỪA', 'Kế thừa', 'kế thừa')],
    [/\bkếtiếp\b/gi, (m: string) => preserveCase(m, 'KẾ TIẾP', 'Kế tiếp', 'kế tiếp')],
    [/\bkếtthúc\b/gi, (m: string) => preserveCase(m, 'KẾT THÚC', 'Kết thúc', 'kết thúc')],
    [/\bkếhoạch\b/gi, (m: string) => preserveCase(m, 'KẾ HOẠCH', 'Kế hoạch', 'kế hoạch')],
    [/\bkếtchặt\b/gi, (m: string) => preserveCase(m, 'KẾT CHẶT', 'Kết chặt', 'kết chặt')],
    [/\bkếtnối\b/gi, (m: string) => preserveCase(m, 'KẾT NỐI', 'Kết nối', 'kết nối')],
    [/\bliệtkê\b/gi, (m: string) => preserveCase(m, 'LIỆT KÊ', 'Liệt kê', 'liệt kê')],
    [/\bliệtkêtập\b/gi, (m: string) => preserveCase(m, 'LIỆT KÊ TẬP', 'Liệt kê tập', 'liệt kê tập')],
    [/\bkêtập\b/gi, (m: string) => preserveCase(m, 'KÊ TẬP', 'Kê tập', 'kê tập')],
    [/\bkêcác\b/gi, (m: string) => preserveCase(m, 'KÊ CÁC', 'Kê các', 'kê các')],
    [/\bkêhoặc\b/gi, (m: string) => preserveCase(m, 'KÊ HOẶC', 'Kê hoặc', 'kê hoặc')],
    [/\bhoặctính\b/gi, (m: string) => preserveCase(m, 'HOẶC TÍNH', 'Hoặc tính', 'hoặc tính')],
    [/\btínhchất\b/gi, (m: string) => preserveCase(m, 'TÍNH CHẤT', 'Tính chất', 'tính chất')],
    [/\bđặctrưng\b/gi, (m: string) => preserveCase(m, 'ĐẶC TRƯNG', 'Đặc trưng', 'đặc trưng')],
    [/\btổtrưởng\b/gi, (m: string) => preserveCase(m, 'TỔ TRƯỞNG', 'Tổ trưởng', 'tổ trưởng')],
    [/\bcáctổ\b/gi, (m: string) => preserveCase(m, 'CÁC TỔ', 'Các tổ', 'các tổ')],
    [/\bcủatổ\b/gi, (m: string) => preserveCase(m, 'CỦA TỔ', 'Của tổ', 'của tổ')],
    [/\brõhọtên\b/gi, (m: string) => preserveCase(m, 'RÕ HỌ TÊN', 'Rõ họ tên', 'rõ họ tên')],
    [/\bhọtên\b/gi, (m: string) => preserveCase(m, 'HỌ TÊN', 'Họ tên', 'họ tên')],

    // Mathematics & division / set relation glued syllables
    [/\bchiahếtcho\b/gi, (m: string) => preserveCase(m, 'CHIA HẾT CHO', 'Chia hết cho', 'chia hết cho')],
    [/\bchiahết\b/gi, (m: string) => preserveCase(m, 'CHIA HẾT', 'Chia hết', 'chia hết')],
    [/\bsốchiahết\b/gi, (m: string) => preserveCase(m, 'SỐ CHIA HẾT', 'Số chia hết', 'số chia hết')],
    [/\bkhôngthuộctập\b/gi, (m: string) => preserveCase(m, 'KHÔNG THUỘC TẬP', 'Không thuộc tập', 'không thuộc tập')],
    [/\bkhôngthuộc\b/gi, (m: string) => preserveCase(m, 'KHÔNG THUỘC', 'Không thuộc', 'không thuộc')],
    [/\bthuộctập\b/gi, (m: string) => preserveCase(m, 'THUỘC TẬP', 'Thuộc tập', 'thuộc tập')],
    [/\bthuộcvà\b/gi, (m: string) => preserveCase(m, 'THUỘC VÀ', 'Thuộc và', 'thuộc và')],
    [/\bcùngthuộc\b/gi, (m: string) => preserveCase(m, 'CÙNG THUỘC', 'Cùng thuộc', 'cùng thuộc')],
    [/\bướcchunglớnnhất\b/gi, (m: string) => preserveCase(m, 'ƯỚC CHUNG LỚN NHẤT', 'Ước chung lớn nhất', 'ước chung lớn nhất')],
    [/\bbộichungnhỏnhất\b/gi, (m: string) => preserveCase(m, 'BỘI CHUNG NHỎ NHẤT', 'Bội chung nhỏ nhất', 'bội chung nhỏ nhất')],
    [/\bướcchung\b/gi, (m: string) => preserveCase(m, 'ƯỚC CHUNG', 'Ước chung', 'ước chung')],
    [/\bbộichung\b/gi, (m: string) => preserveCase(m, 'BỘI CHUNG', 'Bội chung', 'bội chung')],
    [/\bthayvào\b/gi, (m: string) => preserveCase(m, 'THAY VÀO', 'Thay vào', 'thay vào')],
    [/\bthaythế\b/gi, (m: string) => preserveCase(m, 'THAY THẾ', 'Thay thế', 'thay thế')],
    [/\bbằngcách\b/gi, (m: string) => preserveCase(m, 'BẰNG CÁCH', 'Bằng cách', 'bằng cách')],
    [/\blờigiải\b/gi, (m: string) => preserveCase(m, 'LỜI GIẢI', 'Lời giải', 'lời giải')],
    [/\bhướngdẫngiải\b/gi, (m: string) => preserveCase(m, 'HƯỚNG DẪN GIẢI', 'Hướng dẫn giải', 'hướng dẫn giải')],
    [/\bkíhiệu\b/gi, (m: string) => preserveCase(m, 'KÍ HIỆU', 'Kí hiệu', 'kí hiệu')],
    [/\bkýhiệu\b/gi, (m: string) => preserveCase(m, 'KÝ HIỆU', 'Ký hiệu', 'ký hiệu')],
    [/\bmỗiphần\b/gi, (m: string) => preserveCase(m, 'MỖI PHẦN', 'Mỗi phần', 'mỗi phần')],
    [/\bhànhtinh\b/gi, (m: string) => preserveCase(m, 'HÀNH TINH', 'Hành tinh', 'hành tinh')],
    [/\bhệmặttrời\b/gi, (m: string) => preserveCase(m, 'HỆ MẶT TRỜI', 'Hệ Mặt Trời', 'hệ Mặt Trời')],
    [/\bmặttrời\b/gi, (m: string) => preserveCase(m, 'MẶT TRỜI', 'Mặt Trời', 'mặt trời')],
    [/\bđồngthời\b/gi, (m: string) => preserveCase(m, 'ĐỒNG THỜI', 'Đồng thời', 'đồng thời')],
    [/\bthỏamãn\b/gi, (m: string) => preserveCase(m, 'THỎA MÃN', 'Thỏa mãn', 'thỏa mãn')],
    [/\bthoảmãn\b/gi, (m: string) => preserveCase(m, 'THỎA MÃN', 'Thỏa mãn', 'thỏa mãn')],

    // Common pedagogical / math glued syllables
    [/\bSỐCỐT\b/g, 'SỐ CỐT'],
    [/\bvànền\b/gi, (m: string) => preserveCase(m, 'VÀ NỀN', 'Và nền', 'và nền')],
    [/\bvàchọn\b/gi, (m: string) => preserveCase(m, 'VÀ CHỌN', 'Và chọn', 'và chọn')],
    [/\bvày\b/g, 'và y'],
    [/\bvácác\b/gi, (m: string) => preserveCase(m, 'VÀ CÁC', 'Và các', 'và các')],
    [/\bvànêu\b/gi, (m: string) => preserveCase(m, 'VÀ NÊU', 'Và nêu', 'và nêu')],
    [/\bphầntửcủatập\b/gi, (m: string) => preserveCase(m, 'PHẦN TỬ CỦA TẬP', 'Phần tử của tập', 'phần tử của tập')],
    [/\btửcủatập\b/gi, (m: string) => preserveCase(m, 'TỬ CỦA TẬP', 'Tử của tập', 'tử của tập')],
    [/\bphầntử\b/gi, (m: string) => preserveCase(m, 'PHẦN TỬ', 'Phần tử', 'phần tử')],
    [/\btửcủa\b/gi, (m: string) => preserveCase(m, 'TỬ CỦA', 'Tử của', 'tử của')],
    [/\bcủatập\b/gi, (m: string) => preserveCase(m, 'CỦA TẬP', 'Của tập', 'của tập')],
    [/\btậphợp\b/gi, (m: string) => preserveCase(m, 'TẬP HỢP', 'Tập hợp', 'tập hợp')],
    [/\bhaicách\b/gi, (m: string) => preserveCase(m, 'HAI CÁCH', 'Hai cách', 'hai cách')],
    [/\bmôtảmột\b/gi, (m: string) => preserveCase(m, 'MÔ TẢ MỘT', 'Mô tả một', 'mô tả một')],
    [/\bmôtả\b/gi, (m: string) => preserveCase(m, 'MÔ TẢ', 'Mô tả', 'mô tả')],
    [/\bnêudấu\b/gi, (m: string) => preserveCase(m, 'NÊU DẤU', 'Nêu dấu', 'nêu dấu')],
    [/\bvànêudấu\b/gi, (m: string) => preserveCase(m, 'VÀ NÊU DẤU', 'Và nêu dấu', 'và nêu dấu')],
    [/\bsốtự\b/gi, (m: string) => preserveCase(m, 'SỐ TỰ', 'Số tự', 'số tự')],
    [/\btựnhiên\b/gi, (m: string) => preserveCase(m, 'TỰ NHIÊN', 'Tự nhiên', 'tự nhiên')],
    [/\bsốtựnhiên\b/gi, (m: string) => preserveCase(m, 'SỐ TỰ NHIÊN', 'Số tự nhiên', 'số tự nhiên')],
    [/\bđốitượng\b/gi, (m: string) => preserveCase(m, 'ĐỐI TƯỢNG', 'Đối tượng', 'đối tượng')],
    [/\bquacác\b/gi, (m: string) => preserveCase(m, 'QUA CÁC', 'Qua các', 'qua các')],
    [/\bvềtập\b/gi, (m: string) => preserveCase(m, 'VỀ TẬP', 'Về tập', 'về tập')],
    [/\bcụtìm\b/gi, (m: string) => preserveCase(m, 'CỤ TÌM', 'Cụ tìm', 'cụ tìm')],
    [/\btìmkiếm\b/gi, (m: string) => preserveCase(m, 'TÌM KIẾM', 'Tìm kiếm', 'tìm kiếm')],
    [/\btrìnhchiếu\b/gi, (m: string) => preserveCase(m, 'TRÌNH CHIẾU', 'Trình chiếu', 'trình chiếu')],
    [/\btivithông\b/gi, (m: string) => preserveCase(m, 'TIVI THÔNG', 'Tivi thông', 'tivi thông')],
    [/\bthôngminh\b/gi, (m: string) => preserveCase(m, 'THÔNG MINH', 'Thông minh', 'thông minh')],
    [/\bminhhọa\b/gi, (m: string) => preserveCase(m, 'MINH HỌA', 'Minh họa', 'minh họa')],
    [/\bminhhọatập\b/gi, (m: string) => preserveCase(m, 'MINH HỌA TẬP', 'Minh họa tập', 'minh họa tập')],
    [/\bhọatập\b/gi, (m: string) => preserveCase(m, 'HỌA TẬP', 'Họa tập', 'họa tập')],
    [/\bvídụ\b/gi, (m: string) => preserveCase(m, 'VÍ DỤ', 'Ví dụ', 'ví dụ')],
    [/\bvídụvềtập\b/gi, (m: string) => preserveCase(m, 'VÍ DỤ VỀ TẬP', 'Ví dụ về tập', 'ví dụ về tập')],
    [/\bđờisống\b/gi, (m: string) => preserveCase(m, 'ĐỜI SỐNG', 'Đời sống', 'đời sống')],
    [/\bmáytính\b/gi, (m: string) => preserveCase(m, 'MÁY TÍNH', 'Máy tính', 'máy tính')],
    [/\bphiếuhọc\b/gi, (m: string) => preserveCase(m, 'PHIẾU HỌC', 'Phiếu học', 'phiếu học')],
    [/\bphiếuhọctập\b/gi, (m: string) => preserveCase(m, 'PHIẾU HỌC TẬP', 'Phiếu học tập', 'phiếu học tập')],
    [/\bhọctập\b/gi, (m: string) => preserveCase(m, 'HỌC TẬP', 'Học tập', 'học tập')],
    [/\btrithức\b/gi, (m: string) => preserveCase(m, 'TRI THỨC', 'Tri thức', 'tri thức')],
    [/\bcâuhỏi\b/gi, (m: string) => preserveCase(m, 'CÂU HỎI', 'Câu hỏi', 'câu hỏi')],
    [/\bbàimới\b/gi, (m: string) => preserveCase(m, 'BÀI MỚI', 'Bài mới', 'bài mới')],
    [/\bbàihọc\b/gi, (m: string) => preserveCase(m, 'BÀI HỌC', 'Bài học', 'bài học')],
    [/\bbàitập\b/gi, (m: string) => preserveCase(m, 'BÀI TẬP', 'Bài tập', 'bài tập')],
    [/\bbàithơ\b/gi, (m: string) => preserveCase(m, 'BÀI THƠ', 'Bài thơ', 'bài thơ')],
    [/\bghichép\b/gi, (m: string) => preserveCase(m, 'GHI CHÉP', 'Ghi chép', 'ghi chép')],
    [/\bghinhớ\b/gi, (m: string) => preserveCase(m, 'GHI NHỚ', 'Ghi nhớ', 'ghi nhớ')],
    [/\bcuốichương\b/gi, (m: string) => preserveCase(m, 'CUỐI CHƯƠNG', 'Cuối chương', 'cuối chương')],
    [/\bđọcbài\b/gi, (m: string) => preserveCase(m, 'ĐỌC BÀI', 'Đọc bài', 'đọc bài')],
    [/\btròchơi\b/gi, (m: string) => preserveCase(m, 'TRÒ CHƠI', 'Trò chơi', 'trò chơi')],
    [/\bchữcái\b/gi, (m: string) => preserveCase(m, 'CHỮ CÁI', 'Chữ cái', 'chữ cái')],
    [/\blạicách\b/gi, (m: string) => preserveCase(m, 'LẠI CÁCH', 'Lại cách', 'lại cách')],
    [/\btổchức\b/gi, (m: string) => preserveCase(m, 'TỔ CHỨC', 'Tổ chức', 'tổ chức')],
    [/\bmỗinhóm\b/gi, (m: string) => preserveCase(m, 'MỖI NHÓM', 'Mỗi nhóm', 'mỗi nhóm')],
    [/\blýcác\b/gi, (m: string) => preserveCase(m, 'LÝ CÁC', 'Lý các', 'lý các')],
    [/\bkýtự\b/gi, (m: string) => preserveCase(m, 'KÝ TỰ', 'Ký tự', 'ký tự')],
    [/\bthủcông\b/gi, (m: string) => preserveCase(m, 'THỦ CÔNG', 'Thủ công', 'thủ công')],
    [/\btạiđây\b/gi, (m: string) => preserveCase(m, 'TẠI ĐÂY', 'Tại đây', 'tại đây')],
    [/\bđượcbài\b/gi, (m: string) => preserveCase(m, 'ĐƯỢC BÀI', 'Được bài', 'được bài')],
    [/\byêucầu\b/gi, (m: string) => preserveCase(m, 'YÊU CẦU', 'Yêu cầu', 'yêu cầu')],
    [/\bcánhân\b/gi, (m: string) => preserveCase(m, 'CÁ NHÂN', 'Cá nhân', 'cá nhân')],
    [/\btheoyêucầu\b/gi, (m: string) => preserveCase(m, 'THEO YÊU CẦU', 'Theo yêu cầu', 'theo yêu cầu')],
    [/\bvềcách\b/gi, (m: string) => preserveCase(m, 'VỀ CÁCH', 'Về cách', 'về cách')],
    [/\bnêucâuhỏi\b/gi, (m: string) => preserveCase(m, 'NÊU CÂU HỎI', 'Nêu câu hỏi', 'nêu câu hỏi')],
    [/\bvềtừ\b/gi, (m: string) => preserveCase(m, 'VỀ TỪ', 'Về từ', 'về từ')],
    [/\blạichữ\b/gi, (m: string) => preserveCase(m, 'LẠI CHỮ', 'Lại chữ', 'lại chữ')],
    [/\btửchỉ\b/gi, (m: string) => preserveCase(m, 'TỬ CHỈ', 'Tử chỉ', 'tử chỉ')],
    [/\bquytắc\b/gi, (m: string) => preserveCase(m, 'QUY TẮC', 'Quy tắc', 'quy tắc')],
    [/\bcáchnhóm\b/gi, (m: string) => preserveCase(m, 'CÁC NHÓM', 'Các nhóm', 'các nhóm')],
    [/\bnàygọi\b/gi, (m: string) => preserveCase(m, 'NÀY GỌI', 'Này gọi', 'này gọi')],
    [/\blàtập\b/gi, (m: string) => preserveCase(m, 'LÀ TẬP', 'Là tập', 'là tập')],
    [/\bnêutính\b/gi, (m: string) => preserveCase(m, 'NÊU TÍNH', 'Nêu tính', 'nêu tính')],
    [/\bhọcsinh\b/gi, (m: string) => preserveCase(m, 'HỌC SINH', 'Học sinh', 'học sinh')],
    [/\bgiáoviên\b/gi, (m: string) => preserveCase(m, 'GIÁO VIÊN', 'Giáo viên', 'giáo viên')],
    [/\bnhiệmvụ\b/gi, (m: string) => preserveCase(m, 'NHIỆM VỤ', 'Nhiệm vụ', 'nhiệm vụ')],
    [/\bhoạtđộng\b/gi, (m: string) => preserveCase(m, 'HOẠT ĐỘNG', 'Hoạt động', 'hoạt động')],
    [/\bkhởiđộng\b/gi, (m: string) => preserveCase(m, 'KHỞI ĐỘNG', 'Khởi động', 'khởi động')],
    [/\bhìnhthành\b/gi, (m: string) => preserveCase(m, 'HÌNH THÀNH', 'Hình thành', 'hình thành')],
    [/\bkiếnthức\b/gi, (m: string) => preserveCase(m, 'KIẾN THỨC', 'Kiến thức', 'kiến thức')],
    [/\bluyệntập\b/gi, (m: string) => preserveCase(m, 'LUYỆN TẬP', 'Luyện tập', 'luyện tập')],
    [/\bvậndụng\b/gi, (m: string) => preserveCase(m, 'VẬN DỤNG', 'Vận dụng', 'vận dụng')],
    [/\btìmhiểu\b/gi, (m: string) => preserveCase(m, 'TÌM HIỂU', 'Tìm hiểu', 'tìm hiểu')],
    [/\bthảoluận\b/gi, (m: string) => preserveCase(m, 'THẢO LUẬN', 'Thảo luận', 'thảo luận')],
    [/\bcặpđôi\b/gi, (m: string) => preserveCase(m, 'CẶP ĐÔI', 'Cặp đôi', 'cặp đôi')],
    [/\btrìnhbày\b/gi, (m: string) => preserveCase(m, 'TRÌNH BÀY', 'Trình bày', 'trình bày')],
    [/\bkếtluận\b/gi, (m: string) => preserveCase(m, 'KẾT LUẬN', 'Kết luận', 'kết luận')],
    [/\bnhậnđịnh\b/gi, (m: string) => preserveCase(m, 'NHẬN ĐỊNH', 'Nhận định', 'nhận định')],
    [/\bkiểmtra\b/gi, (m: string) => preserveCase(m, 'KIỂM TRA', 'Kiểm tra', 'kiểm tra')],
    [/\bsảnphẩm\b/gi, (m: string) => preserveCase(m, 'SẢN PHẨM', 'Sản phẩm', 'sản phẩm')],
    [/\bdựkiến\b/gi, (m: string) => preserveCase(m, 'DỰ KIẾN', 'Dự kiến', 'dự kiến')],
    [/\bchothấy\b/gi, (m: string) => preserveCase(m, 'CHO THẤY', 'Cho thấy', 'cho thấy')],
    [/\bgọilà\b/gi, (m: string) => preserveCase(m, 'GỌI LÀ', 'Gọi là', 'gọi là')],
    [/\bchỉra\b/gi, (m: string) => preserveCase(m, 'CHỈ RA', 'Chỉ ra', 'chỉ ra')],
    [/\bbước1\b/gi, (m: string) => preserveCase(m, 'BƯỚC 1', 'Bước 1', 'bước 1')],
    [/\bbước2\b/gi, (m: string) => preserveCase(m, 'BƯỚC 2', 'Bước 2', 'bước 2')],
    [/\bbước3\b/gi, (m: string) => preserveCase(m, 'BƯỚC 3', 'Bước 3', 'bước 3')],
    [/\bbước4\b/gi, (m: string) => preserveCase(m, 'BƯỚC 4', 'Bước 4', 'bước 4')],
    [/\bhướngdẫn\b/gi, (m: string) => preserveCase(m, 'HƯỚNG DẪN', 'Hướng dẫn', 'hướng dẫn')],
    [/\bđánhgiá\b/gi, (m: string) => preserveCase(m, 'ĐÁNH GIÁ', 'Đánh giá', 'đánh giá')],
    [/\bquanvát\b/gi, (m: string) => preserveCase(m, 'QUAN SÁT', 'Quan sát', 'quan sát')],
    [/\bquansát\b/gi, (m: string) => preserveCase(m, 'QUAN SÁT', 'Quan sát', 'quan sát')],
    [/\bmộtsốtừ\b/gi, (m: string) => preserveCase(m, 'MỘT SỐ TỪ', 'Một số từ', 'một số từ')],
    [/\bmộtsố\b/gi, (m: string) => preserveCase(m, 'MỘT SỐ', 'Một số', 'một số')],
    [/\bsốtựnhiên\b/gi, (m: string) => preserveCase(m, 'SỐ TỰ NHIÊN', 'Số tự nhiên', 'số tự nhiên')],
    [/\btựnhiên\b/gi, (m: string) => preserveCase(m, 'TỰ NHIÊN', 'Tự nhiên', 'tự nhiên')],
    [/\btrongđờisống\b/gi, (m: string) => preserveCase(m, 'TRONG ĐỜI SỐNG', 'Trong đời sống', 'trong đời sống')],
    [/\bđờisống\b/gi, (m: string) => preserveCase(m, 'ĐỜI SỐNG', 'Đời sống', 'đời sống')],
    [/\bđốvui\b/gi, (m: string) => preserveCase(m, 'ĐỐ VUI', 'Đố vui', 'đố vui')],
    [/\bcâuđố\b/gi, (m: string) => preserveCase(m, 'CÂU ĐỐ', 'Câu đố', 'câu đố')],
    [/\btạora\b/gi, (m: string) => preserveCase(m, 'TẠO RA', 'Tạo ra', 'tạo ra')],
    [/\bsauđó\b/gi, (m: string) => preserveCase(m, 'SAU ĐÓ', 'Sau đó', 'sau đó')],
    [/\bgiảicác\b/gi, (m: string) => preserveCase(m, 'GIẢI CÁC', 'Giải các', 'giải các')],
    [/\bbàitậpđó\b/gi, (m: string) => preserveCase(m, 'BÀI TẬP ĐÓ', 'Bài tập đó', 'bài tập đó')],
    [/\bbàitập\b/gi, (m: string) => preserveCase(m, 'BÀI TẬP', 'Bài tập', 'bài tập')],
    [/\bnângcao\b/gi, (m: string) => preserveCase(m, 'NÂNG CAO', 'Nâng cao', 'nâng cao')],
    [/\bnhiệmvụ\b/gi, (m: string) => preserveCase(m, 'NHIỆM VỤ', 'Nhiệm vụ', 'nhiệm vụ')],
    [/\byêucầu\b/gi, (m: string) => preserveCase(m, 'YÊU CẦU', 'Yêu cầu', 'yêu cầu')],
    [/\bchuyểngiao\b/gi, (m: string) => preserveCase(m, 'CHUYỂN GIAO', 'Chuyển giao', 'chuyển giao')],
    [/\bthựchiện\b/gi, (m: string) => preserveCase(m, 'THỰC HIỆN', 'Thực hiện', 'thực hiện')],
    [/\btrìnhbày\b/gi, (m: string) => preserveCase(m, 'TRÌNH BÀY', 'Trình bày', 'trình bày')],
    [/\bchuyênmôn\b/gi, (m: string) => preserveCase(m, 'CHUYÊN MÔN', 'Chuyên môn', 'chuyên môn')],
    [/\bbangiámhiệu\b/gi, (m: string) => preserveCase(m, 'BAN GIÁM HIỆU', 'Ban giám hiệu', 'ban giám hiệu')],
    [/\bngườilập\b/gi, (m: string) => preserveCase(m, 'NGƯỜI LẬP', 'Người lập', 'người lập')],
    [/\bkếhoạchbàidạy\b/gi, (m: string) => preserveCase(m, 'KẾ HOẠCH BÀI DẠY', 'Kế hoạch bài dạy', 'kế hoạch bài dạy')],
    [/\bbàidạy\b/gi, (m: string) => preserveCase(m, 'BÀI DẠY', 'Bài dạy', 'bài dạy')],
    [/\bphẩmchất\b/gi, (m: string) => preserveCase(m, 'PHẨM CHẤT', 'Phẩm chất', 'phẩm chất')],
    [/\bnănglực\b/gi, (m: string) => preserveCase(m, 'NĂNG LỰC', 'Năng lực', 'năng lực')],
    [/\byêucầucầnđạt\b/gi, (m: string) => preserveCase(m, 'YÊU CẦU CẦN ĐẠT', 'Yêu cầu cần đạt', 'yêu cầu cần đạt')],
    [/\btựchủ\b/gi, (m: string) => preserveCase(m, 'TỰ CHỦ', 'Tự chủ', 'tự chủ')],
    [/\bgiaotiếp\b/gi, (m: string) => preserveCase(m, 'GIAO TIẾP', 'Giao tiếp', 'giao tiếp')],
    [/\bhợptác\b/gi, (m: string) => preserveCase(m, 'HỢP TÁC', 'Hợp tác', 'hợp tác')],
    [/\bgiảiquyết\b/gi, (m: string) => preserveCase(m, 'GIẢI QUYẾT', 'Giải quyết', 'giải quyết')],
    [/\bsángtạo\b/gi, (m: string) => preserveCase(m, 'SÁNG TẠO', 'Sáng tạo', 'sáng tạo')],
    [/\btrungthực\b/gi, (m: string) => preserveCase(m, 'TRUNG THỰC', 'Trung thực', 'trung thực')],
    [/\bchămchỉ\b/gi, (m: string) => preserveCase(m, 'CHĂM CHỈ', 'Chăm chỉ', 'chăm chỉ')],
    [/\btráchnhiệm\b/gi, (m: string) => preserveCase(m, 'TRÁCH NHIỆM', 'Trách nhiệm', 'trách nhiệm')],
    [/\bnhânái\b/gi, (m: string) => preserveCase(m, 'NHÂN ÁI', 'Nhân ái', 'nhân ái')],
    [/\byêunước\b/gi, (m: string) => preserveCase(m, 'YÊU NƯỚC', 'Yêu nước', 'yêu nước')],

    // Section headers - Strictly preserve case
    [/\bvềkiến\b/gi, (m: string) => preserveCase(m, 'VỀ KIẾN', 'Về Kiến', 'về kiến')],
    [/\bvềnăng\b/gi, (m: string) => preserveCase(m, 'VỀ NĂNG', 'Về Năng', 'về năng')],
    [/\bvềphẩm\b/gi, (m: string) => preserveCase(m, 'VỀ PHẨM', 'Về Phẩm', 'về phẩm')],
    [/\bthiếtbị\b/gi, (m: string) => preserveCase(m, 'THIẾT BỊ', 'Thiết bị', 'thiết bị')],
    [/\bdạyhọc\b/gi, (m: string) => preserveCase(m, 'DẠY HỌC', 'Dạy học', 'dạy học')],
    [/\bvàhọc\b/gi, (m: string) => preserveCase(m, 'VÀ HỌC', 'Và học', 'và học')],
    [/\bhọcliệu\b/gi, (m: string) => preserveCase(m, 'HỌC LIỆU', 'Học liệu', 'học liệu')],
    [/\btiếntrình\b/gi, (m: string) => preserveCase(m, 'TIẾN TRÌNH', 'Tiến trình', 'tiến trình')]
  ];

  for (const [regex, replacement] of ungluePairs) {
    // @ts-ignore
    text = text.replace(regex, replacement);
  }

  // 4. Ensure space after punctuation (periods, commas, semicolons, colons) when glued to Vietnamese letters
  // E.g. "Toán,KHTN" -> "Toán, KHTN", "trọng.Ví dụ:" -> "trọng. Ví dụ:" (preserve numbers like 3.14)
  text = text.replace(/([a-zA-ZÀ-ỹ0-9\)])\.([A-ZÀ-Ỹ])/g, '$1. $2');
  text = text.replace(/([a-zA-ZÀ-ỹ0-9\)])\:([A-ZÀ-Ỹa-zà-ỹ0-9])/g, '$1: $2');
  text = text.replace(/([a-zA-ZÀ-ỹ0-9\)])\;([A-ZÀ-Ỹa-zà-ỹ0-9])/g, '$1; $2');
  text = text.replace(/([a-zA-ZÀ-ỹ])([,;:!?])([a-zA-ZÀ-ỹ])/g, '$1$2 $3');

  // 5. Ensure space between a word and an opening quote/bracket if glued (e.g. "tên[A]" -> "tên [A]")
  // STRICTLY PREVENT inserting space between LaTeX commands and their braces (e.g. \begin{cases}, \mathbb{N}, \frac{1}{2}, \text{...}, \sqrt{2})
  text = text.replace(/(?<!\\[a-zA-Z]*|[a-zA-ZÀ-ỹ]*\^|[a-zA-ZÀ-ỹ]*_)([a-zA-ZÀ-ỹ])([(\[])/g, '$1 $2');
  text = text.replace(/(?<!\\[a-zA-Z]*)([)\]])([a-zA-ZÀ-ỹ])/g, '$1 $2');

  // 6. Repair orphan markdown asterisks (**) across lines and table cells
  const lines = text.split('\n');
  const cleanedLines = lines.map(line => {
    const parts = line.split(/(\|)/g);
    return parts.map(cell => {
      if (cell === '|') return cell;
      const count = (cell.match(/\*\*/g) || []).length;
      if (count % 2 === 0) return cell;

      // Single unclosed ** in cell or line
      const m = cell.match(/^([ \t]*[-*•]?\s*)\*\*([^*]+)$/);
      if (m) {
        const prefix = m[1];
        const content = m[2];
        const stepMatch = content.match(/^(Bước\s*\d[:\.]\s*[^:\n*]+:)(.*)$/i);
        if (stepMatch) {
          return `${prefix}**${stepMatch[1]}**${stepMatch[2]}`;
        }
        const colonMatch = content.match(/^([^:\n*]+:)(.*)$/);
        if (colonMatch) {
          return `${prefix}**${colonMatch[1]}**${colonMatch[2]}`;
        }
        return cell.trimEnd() + '**';
      }

      if (cell.endsWith('**')) {
        return cell;
      }
      return cell.replace(/(?<!\*)\*\*(?!\*)/g, '');
    }).join('');
  });

  const joinedText = cleanedLines.join('\n');

  // 7. Clean formatting artifacts: stray backslashes, broken subscripts/underscores, trailing asterisks
  const cleanedArtifacts = joinedText
    // 7.1. Clean extra backslashes before spaces or punctuation (e.g. ";\ " -> "; ", ",\ " -> ", ", "\ " -> " ", trailing "\")
    .replace(/\\([,;:! ])/g, ' ')
    .replace(/\\+(?=[ \t.,;:!?)\\}\\]]|$)/g, '')
    // 7.2. Clean broken subscripts and stray underscores (e.g. "s,_{ta} có:" -> "s, ta có:", "_{ta}" -> "ta")
    .replace(/([a-zA-Z0-9$]+)[,;:]\s*_{([^{}]+)}/g, '$1, $2')
    .replace(/(^|[\s,;:(])_{([a-zA-Zà-ỹÀ-Ỹ\s]+)}/g, '$1$2')
    .replace(/_{([a-zA-Zà-ỹÀ-Ỹ\s]+)}/g, '$1')
    .replace(/([.,;:!?])_+/g, '$1')
    .replace(/_+([.,;:!?])/g, '$1')
    .replace(/(^|\s)_+([a-zA-Zà-ỹÀ-Ỹ0-9]+)_+(\s|$)/g, '$1$2$3')
    .replace(/(^|\s)_+([a-zA-Zà-ỹÀ-Ỹ]+)/g, '$1$2')
    .replace(/([a-zA-Zà-ỹÀ-Ỹ]+)_+(\s|$)/g, '$1$2')
    // 7.3. Clean extra single asterisks at punctuation boundaries and end of lines (strictly preserve ℕ*, ℤ*, ℚ*, ℝ*, N* and markdown bold **)
    .replace(/([.,;:!?])\s*(?<!\*)\*(?!\*)/g, '$1 ')
    .replace(/(?<![ℕℤℚℝN*])\*(?!\*)([.,;:!?])/g, '$1')
    .replace(/(?<![ℕℤℚℝN*])\*(?!\*)[ \t]*$/gm, '')
    .replace(/(?<=[a-zA-Zà-ỹÀ-Ỹ]{2,})\*(?!\*)(?=\s)/g, '')
    .replace(/^[ \t]*\*(?!\*)[ \t]*([A-Za-zÀ-ỹ])/gm, '$1')
    // Auto-repair unclosed bold at label colon (e.g. "**Bước 1: Giao nhiệm vụ học tập:")
    .replace(/(^|\n|\||<br\s*\/?>)[ \t]*\*\*(Bước\s*\d[:\.]\s*[^:\n*]+):(?!\*)[ \t]*/gi, '$1**$2:** ')
    // Auto-repair unclosed bold at end of activity title (e.g. "**4. HOẠT ĐỘNG VẬN DỤNG (2 phút)")
    .replace(/(^|\n|\||<br\s*\/?>)[ \t]*\*\*([1-5]\.\s*HOẠT\s*ĐỘNG[^\n*]+?)(?!\*)[ \t]*(?=\n|\||<br|$)/gi, '$1**$2**');

  return restoreVietnameseCucWords(cleanedArtifacts);
}

/**
 * Unpacks multi-line aligned LaTeX math environments (\begin{aligned}...\end{aligned}, \begin{align*}...\end{align*}, \begin{split}...\end{split}, \begin{gather}...\end{gather})
 * into clean, standalone textbook-grade equation steps ($...$).
 * 
 * In Word (.docx) export, raw LaTeX environment tags (\begin{aligned}, \end{aligned}) and alignment markers (\\, &)
 * cannot be parsed directly by Word Equation OMML and leak out as ugly literal text runs.
 * This function cleanly extracts each row/step, strips alignment '&' and '\\', wraps each step in $...$,
 * and joins them using <br/> (for markdown table cells) or \n (for normal paragraphs).
 */
export function unpackLatexAlignedEnvironments(content: string): string {
  if (!content) return content;
  if (
    !/\\begin\s*\{\s*(?:aligned|align\*?|split|gather\*?)/i.test(content) &&
    !/\\end\s*\{\s*(?:aligned|align\*?|split|gather\*?)/i.test(content) &&
    !/\\\\\s*&/.test(content)
  ) {
    return content;
  }

  // 1. Match paired \begin{aligned}...\end{aligned} blocks (with or without $ or $$ wrappers)
  let res = content.replace(
    /(?:\$\$|\$)?\s*\\begin\s*\{\s*(aligned|align\*?|split|gather\*?)\s*\}\s*([\s\S]*?)\s*\\end\s*\{\s*(?:aligned|align\*?|split|gather\*?)\s*\}\s*(?:\$\$|\$)?/gi,
    (match, _env, body, offset, fullString) => {
      // Check if this match is inside a table line (row separated by |)
      const lineStart = fullString.lastIndexOf('\n', offset);
      const lineEnd = fullString.indexOf('\n', offset + match.length);
      const currentLine = fullString.slice(lineStart === -1 ? 0 : lineStart, lineEnd === -1 ? fullString.length : lineEnd);
      const isInTable = currentLine.includes('|');
      const sep = isInTable ? '<br/>' : '\n';

      const rawRows = body.split(/\\\\(?:\[[^\]]*\])?/g);
      const cleanRows = rawRows.map((r: string) => {
        let clean = r
          .replace(/[\r\n]+/g, ' ')
          .replace(/<br\s*\/?>/gi, ' ')
          .replace(/&/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        if (!clean) return '';
        clean = clean.replace(/^\$+|\$+$/g, '').trim();
        if (!clean) return '';
        return `$${clean}$`;
      }).filter(Boolean);

      if (cleanRows.length === 0) return '';

      // If preceded by non-space, non-newline, non-br text (e.g. "a) Thu gọn:"), prepend separator
      const beforeText = fullString.slice(0, offset).trimEnd();
      const needsPrefix = beforeText.length > 0 &&
                          !beforeText.endsWith('\n') &&
                          !beforeText.endsWith('<br>') &&
                          !beforeText.endsWith('<br/>') &&
                          !beforeText.endsWith('<br />') &&
                          !beforeText.endsWith('|');

      const prefix = needsPrefix ? sep : '';
      return prefix + cleanRows.join(sep);
    }
  );

  // 2. Clean up any leftover orphaned \begin or \end tags and stray \\ & or raw &
  res = res
    .replace(/\\begin\s*\{\s*(?:aligned|align\*?|split|gather\*?)\s*\}/gi, '')
    .replace(/\\end\s*\{\s*(?:aligned|align\*?|split|gather\*?)\s*\}/gi, '')
    .replace(/\\\\\s*&/g, ' ')
    .replace(/(?:^|[\s,;])&(?=\s*[\w\d=+\-*\(])/g, ' ');

  return res;
}

/**
 * Sanitizes markdown content so that Vietnamese words are never trapped inside MathType $...$ blocks.
 * Also cleans isolated markdown dividers (---, ***), formats special sets (N*, Z, Q, R), and repairs TeX syntax.
 */
export function sanitizeMathForVietnamese(content: string): string {
  if (!content) return '';

  let text = repairVietnameseText(content);

  // Pre-unpack multiline aligned LaTeX math blocks into individual step formulas
  text = unpackLatexAlignedEnvironments(text);

  // 0. Remove stray standalone lines of only $$ or $ or empty math blocks
  text = text.replace(/^[ \t]*\${1,3}[ \t]*$/gm, '');
  text = text.replace(/\$\$\s*\$\$/g, '');
  text = text.replace(/\$\s*\$/g, '');

  // 1. Remove standalone horizontal rules / separator lines like "---", "***", "___", "===", "----"
  text = text.replace(/^[ \t]*[-*_=]{2,}[ \t]*$/gm, '');
  text = text.replace(/(?:\r?\n[ \t]*[-*_=]{2,}[ \t]*\r?\n)+/g, '\n\n');

  // 2. Remove table row dividers with hyphens/equals that might linger inside table cells
  text = text.replace(/(?:<br\s*\/?>\s*)+[-*_=]{2,}(?:\s*<br\s*\/?>)+/gi, '<br/><br/>');
  text = text.replace(/<br\s*\/?>\s*[-*_=]{2,}/gi, '<br/>');
  text = text.replace(/[-*_=]{2,}\s*<br\s*\/?>/gi, '<br/>');

  // Clean broken stray math delimiters attached to colons, bullets, and table cell boundaries (e.g. "công thức:$", "đơn thức:$", "+$ Hệ số")
  text = text.replace(/:\s*\$(?=\s*(?:$|<br\s*\/?>|\r?\n))/gi, ':');
  text = text.replace(/(^|[\s\n|>])\$\s*:(?=\s)/g, '$1:');
  text = text.replace(/(^|[\n>|]|<br\s*\/?>)\s*([+\-*•–—])\s*\$(?=\s*[a-zA-ZÀ-ỹ])/gi, '$1$2 ');

  // 3. Remove inline TikZ code blocks and replace with safe placeholder note
  text = text.replace(/```tikz[\s\S]*?```/gi, '\n\n> 🖼️ **[ HÌNH VẼ MINH HỌA (TIKZ) - GIÁO VIÊN CHÈN HÌNH TẠI ĐÂY ]**\n\n');
  text = text.replace(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/gi, '\n\n> 🖼️ **[ HÌNH VẼ MINH HỌA (TIKZ) - GIÁO VIÊN CHÈN HÌNH TẠI ĐÂY ]**\n\n');

  // 4. Clean \mathbf tags and TeX style wrappers containing math relations (e.g. \mathbf{x \in A} -> $x \in A$, \mathbf{y \notin A} -> $y \notin A$)
  // Strictly EXCLUDE \text{} so valid text annotations in LaTeX formulas remain intact
  text = text.replace(/\\(?:mathbf|mathrm|mathit|textbf|textsf)\s*\{\s*([^{}\n]+)\s*\}/gi, (_m, inner) => {
    const trimmed = inner.trim();
    if (/\\(?:in|notin|ni|subset|supset|subseteq|supseteq|cap|cup|leq|geq|neq|approx|equiv|pm|mp|cdot|times|div|propto|[=≤≥≠≈∈∉⊂⊃⊆⊇∩∪])/.test(trimmed)) {
      return `$${trimmed}$`;
    }
    // If it's a short sequence of set elements like "N; H; A; T; R; A; N; G"
    if (/^[A-Za-z0-9\s;,]+$/.test(trimmed) && trimmed.includes(';')) {
      return trimmed;
    }
    return ` ${trimmed} `;
  });

  // Unpack nested malformed tags like {text {N; H; A; ...}}, {mathrm{...}}, {textbf{...}}
  text = text
    .replace(/\{text\s*\{([^{}]+)\}\}/gi, ' $1 ')
    .replace(/\{mathrm\s*\{([^{}]+)\}\}/gi, ' $1 ')
    .replace(/\{textbf\s*\{([^{}]+)\}\}/gi, ' $1 ')
    .replace(/\{textit\s*\{([^{}]+)\}\}/gi, ' $1 ')
    .replace(/\{textsf\s*\{([^{}]+)\}\}/gi, ' $1 ');

  // Standardize quotes inside \text{...} and \mathrm{...}
  text = text.replace(/\\(?:text|mathrm)\s*\{\s*["“”'‘’]?([^{}\n"“”'‘’]*)["“”'‘’]?\s*\}/gi, (_m, inner) => '\\text{' + inner.trim() + '}');

  // Auto-repair truncated or unclosed \text{ or \mathrm{
  text = text.replace(/\\(?:text|mathrm)\s*\{\s*([a-zA-ZÀ-ỹ\s0-9()]+)(?=[)\],;=+\-*\/<>.]|\$|$|<br|\n)/gi, ' $1 ');
  text = text.replace(/\\(?:text|mathrm)\s*\{/gi, ' ');

  // Clean quotes inside math mode $...$ (e.g. "kg" -> kg, "đồng" -> đồng, ''kg'' -> kg)
  text = text.replace(/\$([^\$\n]+?)\$/g, (_m, inner) => {
    let cleaned = inner
      .replace(/["“”'‘’]{1,2}([a-zA-ZÀ-ỹ\s]+)["“”'‘’]{1,2}/g, '$1')
      .replace(/["“”'‘’]/g, '');
    return '$' + cleaned + '$';
  });

  // 4a. AUTO-REPAIR SET NOTATION MISSING OPENING BRACE `{` (e.g. `L = N; H; A; T; R; A; N; G}` -> `L = {N; H; A; T; R; A; N; G}`)
  text = text.replace(/(^|[\s\n|>$\(,])([A-Za-z0-9_'\*]+)\s*=\s*(?!\s*\{)([^{}\n=$;]+;[^{}\n=$]*)\}/g, (_m, lead, setName, elements) => {
    return `${lead}${setName} = {${elements.trim()}}`;
  });

  // 4b. Normalize all \mathbb, unicode ℕ/ℕ*, and naked mathbb notations
  // CRITICAL: MUST BE CASE-SENSITIVE for single letters (N, Z, Q, R, I, C) so variables like z^4, n^2, r^2 are NEVER corrupted into ℤ*, ℕ*, ℝ*!
  // And clean up any broken/truncated \mathbb^ or \mathbb^* artifacts (e.g. \mathbb^*, \mathbb^, \mathbb{^*}, naked \mathbb)
  text = text
    .replace(/\\?mathbb(?:\s*\{\s*\}\s*(?:\^\s*(?:\*|\\ast|\{?\*\}?|\{?\\ast\}?)|\^)|\s*\{\s*\^\s*\*?\s*\}|\s*\^\s*(?:\*|\\ast|\{?\*\}?|\{?\\ast\}?)|\s*\^|\s*\\\^)/gi, '\\mathbb{N}^*')
    .replace(/\\?mathbb\s*\{\s*\}/gi, '\\mathbb{N}')
    .replace(/\\?mathbb\s*\{\s*N\s*\}\s*(?:\^\s*(?:\*|\\ast|\{?\*\}?|\{?\\ast\}?)|_\s*0|\*)|\$?\bℕ\s*\*\$?|\$?\bℕ\s*\^\s*\*|\$?\bN\s*\^\s*\*/g, '\\mathbb{N}^*')
    .replace(/\\?mathbb\s*\{\s*R\s*\}\s*(?:\^\s*(?:\*|\\ast|\{?\*\}?|\{?\\ast\}?)|_\s*0|\*)|\$?\bℝ\s*\*\$?|\$?\bℝ\s*\^\s*\*|\$?\bR\s*\^\s*\*/g, '\\mathbb{R}^*')
    .replace(/\\?mathbb\s*\{\s*Z\s*\}\s*(?:\^\s*(?:\*|\\ast|\{?\*\}?|\{?\\ast\}?)|_\s*0|\*)|\$?\bℤ\s*\*\$?|\$?\bℤ\s*\^\s*\*|\$?\bZ\s*\^\s*\*/g, '\\mathbb{Z}^*')
    .replace(/\\?mathbb\s*\{\s*Q\s*\}\s*(?:\^\s*(?:\*|\\ast|\{?\*\}?|\{?\\ast\}?)|_\s*0|\*)|\$?\bℚ\s*\*\$?|\$?\bℚ\s*\^\s*\*|\$?\bQ\s*\^\s*\*/g, '\\mathbb{Q}^*')
    .replace(/\\?mathbb\s*\{\s*N\s*\}|\$?\bℕ(?!\*)\$?|\bmathbb\s*N\b/g, '\\mathbb{N}')
    .replace(/\\?mathbb\s*\{\s*Z\s*\}|\$?\bℤ(?!\*)\$?|\bmathbb\s*Z\b/g, '\\mathbb{Z}')
    .replace(/\\?mathbb\s*\{\s*Q\s*\}|\$?\bℚ(?!\*)\$?|\bmathbb\s*Q\b/g, '\\mathbb{Q}')
    .replace(/\\?mathbb\s*\{\s*I\s*\}|\$?\b𝕀\$?|\bmathbb\s*I\b/g, '\\mathbb{I}')
    .replace(/\\?mathbb\s*\{\s*R\s*\}|\$?\bℝ(?!\*)\$?|\bmathbb\s*R\b/g, '\\mathbb{R}')
    .replace(/\\?mathbb\s*\{\s*C\s*\}|\$?\bℂ\$?|\bmathbb\s*C\b/g, '\\mathbb{C}')
    .replace(/\bmathbb\s*N\s*\*/g, '\\mathbb{N}^*')
    .replace(/\bmathbb\s*Z\s*\*/g, '\\mathbb{Z}^*')
    .replace(/\bmathbb\s*Q\s*\*/g, '\\mathbb{Q}^*')
    .replace(/\bmathbb\s*R\s*\*/g, '\\mathbb{R}^*')
    .replace(/\\mathbb(?![a-zA-Z{])/g, '\\mathbb{N}');

  // Convert LaTeX decimal notation {,} into standard Vietnamese comma ,
  text = text.replace(/([0-9])\{,\}([0-9])/g, '$1,$2').replace(/\{,\}/g, ',');

  // Normalize spacing in LaTeX commands: \mathbb {N} -> \mathbb{N}, \in\mathbb -> \in \mathbb, \notin\mathbb -> \notin \mathbb
  text = text
    .replace(/\\mathbb\s+\{/g, '\\mathbb{')
    .replace(/\\(in|notin|subset|supset|subseteq|supseteq|cap|cup|leq|geq|neq|approx|equiv|pm|times|div|cdot)\\([a-zA-Z]+)/g, '\\$1 \\$2')
    .replace(/([a-zA-Z0-9_'\*]+)\\([a-zA-Z]+)/g, '$1 \\$2')
    .replace(/\\(in|notin|subset|supset|subseteq|supseteq|cap|cup|leq|geq|neq|approx|equiv|pm|times|div|cdot)([a-zA-Z0-9_'\*]+)/g, '\\$1 $2');

  // Normalize degree symbols for KaTeX: ^° -> ^\circ (KaTeX breaks on ^°)
  text = text
    .replace(/\^°/g, '^\\circ')
    .replace(/\^\{\s*°\s*\}/g, '^\\circ')
    .replace(/\^o\b/g, '^\\circ');

  // Normalize angle symbols: Vietnamese SGK strictly uses \widehat{...} (hat over vertices, e.g. \widehat{ABC}), NEVER \angle or \hat
  text = text
    .replace(/\\angle\s*\{([^{}]+)\}/g, '\\widehat{$1}')
    .replace(/\\angle\s+([A-Za-z0-9]+)\b/g, '\\widehat{$1}')
    .replace(/\\hat\s*\{([^{}]+)\}/g, '\\widehat{$1}')
    .replace(/\\widecheck\s*\{([^{}]+)\}/g, '\\widehat{$1}');

  // Normalize vulgar fractions (½, ⅓, ⅔, ¼, ¾, ⅕, ⅙, ⅛, ⅜, ⅝, ⅞) to standard LaTeX fractions (\dfrac{1}{8}, \dfrac{1}{2}, etc.)
  const vulgarFractionMap: Record<string, string> = {
    '½': '1/2', '⅓': '1/3', '⅔': '2/3', '¼': '1/4', '¾': '3/4',
    '⅕': '1/5', '⅖': '2/5', '⅗': '3/5', '⅘': '4/5', '⅙': '1/6',
    '⅚': '5/6', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8'
  };
  text = text.replace(/([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/g, (_m, char) => {
    const frac = vulgarFractionMap[char];
    if (!frac) return char;
    const [num, den] = frac.split('/');
    return `$\\dfrac{${num}}{${den}}$`;
  });

  // Convert explicit fraction mentions with slashes (e.g. "phân số 1/8", "tỉ số 1/2", "phân số -3/4") to standard LaTeX fractions
  text = text.replace(/(?<!\$)\b(phân\s+số|tỉ\s+số|tỉ\s+lệ)\s+(-?\d+)\/(\d+)\b(?!\$)/gi, (_m, prefix, num, den) => {
    return `${prefix} $\\dfrac{${num}}{${den}}$`;
  });

  // 5. Process $...$ and $$...$$ blocks to extract Vietnamese words outside math mode
  // Guard: inline $...$ must NEVER match across <br> tags or newlines
  text = text.replace(/(\$\$[\s\S]*?\$\$|\$(?:(?!<br\s*\/?>|\r?\n)[^\$])+?\$)/gi, (mathMatch) => {
    const isDouble = mathMatch.startsWith('$$');
    const inner = mathMatch.slice(isDouble ? 2 : 1, isDouble ? -2 : -1).trim();

    // If inner (excluding safe \text{...} / \mathrm{...} blocks) contains NO Vietnamese diacritics and no stop words, it is clean pure math!
    const withoutTextBlocks = inner.replace(/\\(?:text|mathrm)\s*\{[^{}]*\}/g, '');
    if (!VIETNAMESE_ACCENT_REGEX.test(withoutTextBlocks) && !/\b(la|cac|so|tap|hop|tu|nhien|khac|thuoc|khong|phai|vay|khi|voi|moi|thoa|man|suy|ra)\b/i.test(withoutTextBlocks)) {
      return mathMatch;
    }

    // Split inner content into tokens: Vietnamese phrases vs math expressions
    return splitMixedMathVietnamese(inner);
  });

  // 6. Standardize common Vietnamese math sets and symbols outside math mode
  text = text
    .replace(/\bN\*\b/g, '$\\mathbb{N}^*$')
    .replace(/\bN\b(?=\s+(?:là|thuộc|không|tập))/g, '$\\mathbb{N}$')
    .replace(/\bZ\b(?=\s+(?:là|thuộc|không|tập))/g, '$\\mathbb{Z}$')
    .replace(/\bQ\b(?=\s+(?:là|thuộc|không|tập))/g, '$\\mathbb{Q}$')
    .replace(/\bR\b(?=\s+(?:là|thuộc|không|tập))/g, '$\\mathbb{R}$')
    .replace(/\\in\s*N\*/g, '\\in \\mathbb{N}^*')
    .replace(/\\notin\s*N\*/g, '\\notin \\mathbb{N}^*')
    .replace(/\\in\s*N\b/g, '\\in \\mathbb{N}')
    .replace(/\\notin\s*N\b/g, '\\notin \\mathbb{N}')
    .replace(/\\in\s*Z\b/g, '\\in \\mathbb{Z}')
    .replace(/\\notin\s*Z\b/g, '\\notin \\mathbb{Z}')
    .replace(/\\in\s*Q\b/g, '\\in \\mathbb{Q}')
    .replace(/\\notin\s*Q\b/g, '\\notin \\mathbb{Q}')
    .replace(/\\in\s*R\b/g, '\\in \\mathbb{R}')
    .replace(/\\notin\s*R\b/g, '\\notin \\mathbb{R}');

  // 6b. Auto-wrap naked element-in-set and relation expressions outside $...$ (e.g. 2\notin A, 5\in A, 7\notin A, 0\in A, 4\in M, 7\notin M, x\in A, y\notin A)
  // SAFE FUNCTION CALLBACKS: avoid $$ replacement string ambiguities
  // Strictly EXCLUDE '=' from REL_MATH_OPS so equations like "y = 12xy" are NOT chopped in half!
  const REL_MATH_OPS = '(?:\\\\(?:in|notin|ni|subset|supset|subseteq|supseteq|cap|cup|setminus|leq|geq|le\\b|ge\\b|neq|ne\\b|approx|equiv|sim|propto|parallel|perp)|[≤≥≠≈∈∉⊂⊃⊆⊇∩∪])';
  const REL_ATOM = '(?:[0-9]+(?:\\.[0-9]+)?|[a-zA-Z_]\'?|\\\\mathbb\\{[A-Za-z]\\}\\^?\\*?|\\\\emptyset|\\\\varnothing)';

  text = text.replace(
    new RegExp(`(?<!\\$)\\b(${REL_ATOM})\\s*(${REL_MATH_OPS})\\s*(${REL_ATOM})(?!\\$)`, 'g'),
    (_m, left, op, right) => {
      if (VIETNAMESE_ACCENT_REGEX.test(left) || VIETNAMESE_ACCENT_REGEX.test(right)) return _m;
      return `$${left.trim()} ${op.trim()} ${right.trim()}$`;
    }
  );

  // 7. AUTO-WRAP COMPLETE RELATIONS & SET EXPRESSIONS OUTSIDE $...$ IN $...$
  // E.g.: "x \in A" -> "$x \in A$", "y \notin A" -> "$y \notin A$", "2 \in A" -> "$2 \in A$", "5 \notin A" -> "$5 \notin A$"
  const mathRelationOp = '(?:\\\\(?:in|notin|subset|supset|subseteq|supseteq|cap|cup|setminus|leq|geq|neq|approx|equiv)|[≤≥≠≈∈∉⊂∩∪])';
  const mathTerm = '(?:[a-zA-Z0-9_+\\-*\\/\\^\\{\\}\'\\\\]+|\\\\mathbb\\{[A-Za-z]\\}\\^?\\*?|\\\\\{[^{}\\n]+\\\\\\}|\\{[^{}\\n]+\\})';

  // Chained relation pattern: term OP term (e.g. 0 \notin \mathbb{N}^*, x \in A, A = {1; 2; 3})
  text = text.replace(
    new RegExp(`(^|[\\s\\n|>\\(;,])(${mathTerm})\\s*(${mathRelationOp})\\s*(${mathTerm})(?![\\$a-zA-Z0-9_])`, 'g'),
    (full, lead, left, op, right) => {
      // Avoid if already inside math
      if (left.startsWith('$') || right.endsWith('$')) return full;
      // If either left or right contains Vietnamese text, leave it
      if (VIETNAMESE_ACCENT_REGEX.test(left) || VIETNAMESE_ACCENT_REGEX.test(right)) return full;
      return `${lead}$${left.trim()} ${op.trim()} ${right.trim()}$`;
    }
  );

  // Auto-wrap empty set relations: e.g. A = \varnothing, S = \emptyset, A \neq \varnothing, X = ∅
  text = text.replace(
    /(^|[\s\n|>$\(;:,])([A-Za-z0-9_'\*]+)\s*(=|≠|\\neq|\\ne)\s*(\\(?:varnothing|emptyset)|∅)(?![\$a-zA-Z0-9_])/g,
    (full, lead, setName, eq, emptySet) => {
      if (setName.startsWith('$') || emptySet.endsWith('$')) return full;
      const op = eq === '≠' ? '\\ne' : eq;
      return `${lead}$${setName} ${op} ${emptySet}$`;
    }
  );

  // Auto-wrap set assignments with curly braces: e.g. C = { H; O; C; T; O; A; N } or A = {2; 3; 5; 7} or P = {0; 1; 2; 3; 4; 5}
  text = text.replace(
    /(^|[\s\n|>$\(;:,])([A-Za-z0-9_'\*]+)\s*=\s*(?:\\\{|\{)\s*([^{}\n$]+?)\s*(?:\\\}|\})(?![\$a-zA-Z0-9_])/g,
    (full, lead, setName, setVal) => {
      if (setName.startsWith('$') || setVal.endsWith('$')) return full;
      // If elements contain full Vietnamese sentences (not short letter elements like "A; B; C"), skip
      if (VIETNAMESE_ACCENT_REGEX.test(setVal) && !/\b(?:[A-Za-zÀ-ỹ0-9_'\*]\s*;\s*)+[A-Za-zÀ-ỹ0-9_'\*]/.test(setVal)) return full;
      const cleanElements = setVal.replace(/\\/g, '').trim();
      return `${lead}$${setName} = \\{${cleanElements}\\}$`;
    }
  );

  // Ensure set assignments inside $...$ always use escaped \{ and \} for KaTeX
  text = text.replace(/\$([A-Za-z0-9_'\*]+)\s*=\s*(?<!\\)\{\s*([^{}\n\$]+?)\s*(?<!\\)\}\$/g, (_m, name, val) => {
    return `$${name} = \\{${val.trim()}\\}$`;
  });

  // Auto-wrap single-letter set / variable references in common pedagogical contexts:
  // e.g. "tập hợp A" -> "tập hợp $A$", "tập hợp M" -> "tập hợp $M$", "tập hợp H" -> "tập hợp $H$", "phần tử x" -> "phần tử $x$"
  text = text.replace(/(?<!\$)\b(tập hợp|Tập hợp|tập|Tập)\s+([A-Z])\b(?!\$)/g, (_m, prefix, setLetter) => {
    return `${prefix} $${setLetter}$`;
  });
  text = text.replace(/(?<!\$)\b(phần tử|Phần tử)\s+([a-zA-Z0-9])\b(?!\$)/g, (_m, prefix, elem) => {
    return `${prefix} $${elem}$`;
  });

  // Auto-wrap standalone \mathbb sets outside $...$ in $...$
  text = text.replace(/(?<!\$)(?:\\mathbb\{[A-Za-z]\}\^?\*?)(?!\$)/g, (m) => `$${m}$`);

  // Auto-wrap leftover naked math operators outside $...$ (NEVER wrap \cdot or \times alone)
  text = text.replace(/(?<!\$)\\(?:in|notin|subset|supset|subseteq|supseteq|cap|cup|emptyset|varnothing)\b(?!\$)/g, (m) => `$${m}$`);
  text = text.replace(/(?<!\$)\\(?:leq|geq|neq|approx|equiv|pm|mp|div|propto)\b(?!\$)/g, (m) => `$${m}$`);
  // Individual normalizers for radicals, fractions, and geometry symbols outside $...$
  text = text.replace(/(?<!\$)\\sqrt(?:\s*\[([^\]]+)\])?\s*\{([^{}]+)\}(?!\$)/g, (_m, deg, inner) =>
    deg ? `$\\sqrt[${deg}]{${inner}}$` : `$\\sqrt{${inner}}$`
  );
  text = text.replace(/(?<!\$)\\sqrt\s+([0-9a-zA-Z]+)(?!\$)/g, (_m, inner) => `$\\sqrt{${inner}}$`);
  text = text.replace(/(?<!\$)[√]\s*\{([^{}]+)\}(?!\$)/g, (_m, inner) => `$\\sqrt{${inner}}$`);
  text = text.replace(/(?<!\$)[√]\s*\(([^()]+)\)(?!\$)/g, (_m, inner) => `$\\sqrt{${inner}}$`);
  text = text.replace(/(?<!\$)[√]\s*([0-9a-zA-Z]+)(?!\$)/g, (_m, inner) => `$\\sqrt{${inner}}$`);
  text = text.replace(/(?<!\$)\\widehat\s*\{([^{}]+)\}(?!\$)/g, (_m, inner) => `$\\widehat{${inner}}$`);
  text = text.replace(/(?<!\$)\\widehat\s+([A-Za-z0-9]+)\b(?!\$)/g, (_m, inner) => `$\\widehat{${inner}}$`);
  text = text.replace(/(?<![\\\$])\bwidehat\s*\{([^{}]+)\}(?!\$)/g, (_m, inner) => `$\\widehat{${inner}}$`);
  text = text.replace(/(?<![\\\$])\bwidehat\s+([A-Za-z0-9]+)\b(?!\$)/g, (_m, inner) => `$\\widehat{${inner}}$`);
  text = text.replace(/(?<!\$)\\angle\s*\{?([A-Za-z0-9]+)\}?(?!\$)/g, (_m, inner) => `$\\widehat{${inner}}$`);
  text = text.replace(/(?<!\$)\\triangle\s*\{?([A-Za-z0-9]+)\}?(?!\$)/g, (_m, inner) => `$\\triangle ${inner}$`);
  text = text.replace(/(?<!\$)\\triangle\s+([A-Za-z0-9]+)\b(?!\$)/g, (_m, inner) => `$\\triangle ${inner}$`);

  // Auto-wrap Vietnamese pedagogical angle references: "góc ABC" -> "góc $\widehat{ABC}$", "góc xOy" -> "góc $\widehat{xOy}$", "góc A" -> "góc $\widehat{A}$"
  text = text.replace(/(?<!\$)\b(góc|Góc)\s+([A-Z]{3}|[x-z][A-Z][x-z]|[A-Z])\b(?!\$)/g, (_m, prefix, angleName) => {
    return `${prefix} $\\widehat{${angleName}}$`;
  });
  // Auto-wrap "tam giác ABC" -> "tam giác $ABC$"
  text = text.replace(/(?<!\$)\b(tam giác|Tam giác)\s+([A-Z]{3}|[A-Z]'[A-Z]'[A-Z]')\b(?!\$)/g, (_m, prefix, triName) => {
    return `${prefix} $${triName}$`;
  });
  text = text.replace(/(?<![\\\$])\b(?:d|t|c)?frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/gi, '\\dfrac{$1}{$2}');
  text = text.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/gi, '\\dfrac{$1}{$2}');

  // Auto-wrap naked degree expressions: e.g. 180^\circ or 360^\circ outside math mode
  text = text.replace(/(?<!\$)\b(\d+)\s*\^\\?circ\b(?!\$)/g, '$$$1^\\circ$$');
  text = text.replace(/(?<!\$)\b(\d+)\s*\^\{\\?circ\}(?!\$)/g, '$$$1^\\circ$$');

  // 8. Clean up fragmented math delimiters like $x$ $\in$ $A$ -> $x \in A$, $12$ $\cdot$ $x$ -> $12 \cdot x$
  text = text.replace(/\$([^\$\n]+)\$\s*\$([\\a-zA-Z]+|[=+\-*\/·×÷≤≥≠≈∈∉⊂∩∪])\$\s*\$([^\$\n]+)\$/g, (_m, a, op, b) => `$${a} ${op} ${b}$`);
  text = text.replace(/\$([^\$\n]+)\$\s*\$([=+\-*\/·×÷≤≥≠≈∈∉⊂∩∪])\$/g, (_m, a, op) => `$${a} ${op}$`);
  text = text.replace(/\$([=+\-*\/·×÷≤≥≠≈∈∉⊂∩∪])\$\s*\$([^\$\n]+)\$/g, (_m, op, b) => `$${op} ${b}$`);
  text = text.replace(/\$([a-zA-Z0-9_'\*]+)\$\s*\$([\\a-zA-Z]+)\$\s*\$([a-zA-Z0-9_'\*]+|\\mathbb\{[A-Za-z]\}\^?\*?)\$/g, (_m, a, b, c) => `$${a} ${b} ${c}$`);
  text = text.replace(/\$([a-zA-Z0-9_'\*]+)\$\s*\$([=≤≥≠≈∈∉⊂∩∪])\$\s*\$([a-zA-Z0-9_'\*]+|\\mathbb\{[A-Za-z]\}\^?\*?)\$/g, (_m, a, b, c) => `$${a} ${b} ${c}$`);

  // 9. Auto-wrap naked math expressions, monomials, polynomial terms, fractional coefficients, radicals, products
  text = autoWrapVietnameseMathTokens(text);

  // 10. Clean up redundant double math tags like $$$...$$$ or empty math tags like $$ or $ $
  text = text.replace(/\${3,}/g, '$$');
  text = text.replace(/\$\s*\$/g, ' ');

  // 11. Normalize multiplication dot to standard baseline dot "." in Vietnamese secondary school math notation
  text = text.replace(/(\$\$[\s\S]*?\$\$|\$(?:(?!<br\s*\/?>|\r?\n)[^\$])+?\$)/gi, (mathMatch) => {
    return mathMatch
      .replace(/\\cdot\b/g, ' . ')
      .replace(/·/g, ' . ')
      .replace(/([a-zA-Z\)\}\]])\s*\.\s*([a-zA-Z\(\{\[\-])/g, '$1 . $2')
      .replace(/[ \t]{2,}/g, ' ');
  });

  return text;
}

/**
 * Detects whether a string token or slash expression is a date, official circular/decision number,
 * technology slash path, physical unit, or non-mathematical text.
 * Strictly prevents dates (e.g. 16/08/2026), official circulars (TT 02/2025/TT-BGDĐT, 5512/BGDĐT-GDTrH),
 * and tools (GoogleClassroom/Zalo) from being corrupted into fractions.
 */
export function isDateOrOfficialContext(token: string, fullLine: string = ''): boolean {
  const t = token.trim();
  if (!t) return false;

  // 1. Full date DD/MM/YYYY or D/M/YYYY (e.g. 16/08/2026, 1/2/2026, 05/09/2025)
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(t) || /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/.test(t)) {
    return true;
  }

  // 2. Short date DD/MM or D/M in date context (e.g. "Ngày soạn: 16/08", "Ngày dạy: 02/09", "Tuần 1: 05/09")
  if (/^\d{1,2}\/\d{1,2}$/.test(t)) {
    if (/(?:ngày|tháng|năm\s*học|soạn\s*ngày|dạy\s*ngày)\s*[:.]?\s*\b\d{1,2}\/\d{1,2}\b/i.test(fullLine)) {
      return true;
    }
  }

  // 3. School year / Academic year e.g. 2025/2026, 2026/2027 or range 2025 - 2026, 2026 – 2027
  if (/^\d{4}\/\d{4}$/.test(t) || /\b20\d{2}\/20\d{2}\b/.test(t)) {
    return true;
  }
  if (/^(?:19|20)\d{2}\s*[-–—]\s*(?:19|20)\d{2}$/.test(t) || /\b(?:19|20)\d{2}\s*[-–—]\s*(?:19|20)\d{2}\b/.test(t)) {
    return true;
  }

  // 4. Official circulars, decisions, dispatches, decrees, plans (Số công văn, thông tư, quyết định, nghị định):
  // e.g. TT 02/2025/TT-BGDĐT, 02/2025/TT-BGDĐT, QĐ 2422/QĐ-BGDĐT, CV 5512/BGDĐT-GDTrH, 15/KH-THCS, 123/2024/NĐ-CP, 78/NQ-CP
  if (/(?:TT|QĐ|CV|NQ|NĐ|TB|KH|HD|QD|CT|TTr|BGDĐT|SGDĐT|GDĐT|THCS|THPT|GDTrH|GDTH|VBHN|PCGD|UBND)\b/.test(t)) {
    return true;
  }
  if (/\b\d{1,4}\/(?:\d{4}\/)?[A-ZĐÀ-Ỹ0-9]+-[A-Za-zĐđÀ-ỹ0-9\-]+\b/.test(t)) {
    return true;
  }
  if (/(?:thông\s*tư|quyết\s*định|công\s*văn|nghị\s*định|kế\s*hoạch)\s*[:.]?\s*\b\d+[\/\d]*/i.test(fullLine)) {
    return true;
  }

  // 4b. Page numbers, Period counts, Lesson counts, Question counts:
  // e.g. "Trang 12/35", "trang 3/10", "Tiết 15/45", "tiết 2/3", "Bài 1/5", "Câu 2/10"
  if (/^(?:trang|tiết|bài|câu|phần|mục|phiếu|tuần|tháng|ngày|năm)\s+\d+\/\d+$/i.test(t)) {
    return true;
  }
  if (/^\d+\/\d+$/.test(t) && /(?:trang|tiết)\s+\d+\/\d+/i.test(fullLine)) {
    return true;
  }

  // 5. Technology, application names, pedagogical slash options:
  // e.g. GoogleClassroom/Zalo, Classroom/Zalo, Online/Offline, GV/HS, Dạy/học, Thầy/cô, A/B/C/D, Windows/Mac, Android/iOS
  if (/[a-zA-ZÀ-ỹ]{2,}\/[a-zA-ZÀ-ỹ]{2,}/i.test(t)) {
    return true;
  }

  // 6. Physical measurement units:
  // e.g. km/h, m/s, kg/m3, g/cm3, cal/g, J/kg, N/m
  if (/^(?:km\/h|m\/s|kg\/m3|g\/cm3|cal\/g|J\/kg|N\/m)$/i.test(t)) {
    return true;
  }

  return false;
}

const COMMON_NON_MATH_WORDS = new Set([
  'thay', 'qua', 'cho', 'co', 'ta', 'do', 'hoc', 'lop', 'giao', 'vien', 'bai', 'tap',
  'tinh', 'giai', 'dang', 'nhom', 'rut', 'gon', 'con', 'lai', 'la', 'vi', 'chua',
  'giua', 'hai', 'mot', 'ba', 'bon', 'nam', 'bien', 'bac', 'he', 'so', 'phan', 'va',
  'hoac', 'trong', 'tu', 'nhien', 'khac', 'thuoc', 'chu', 'y', 'hay', 'neu', 'khi',
  'tam', 'can', 'trang', 'tiet', 'cau', 'muc', 'hinh', 'diem', 'doan', 'thang',
  'goc', 'canh', 'dien', 'tich', 'chu', 'vi', 'duong', 'tron', 'day', 'chieu',
  'cao', 'rong', 'dai', 'khoang', 'cach', 'toc', 'thoi', 'gian', 'quang',
  'don', 'thuc', 'da', 'nghiem', 'phuong', 'trinh', 'tong', 'hieu', 'thuong',
  'du', 'chia', 'het', 'uoc', 'boi', 'ucln', 'bcnn', 'snt', 'hop', 'nguyen',
  'to', 'chinh', 'thap', 'ti', 'le', 'tram', 'buoc', 'thuc', 'hien', 'bao',
  'cao', 'nhan', 'dinh', 'nhiem', 'vu', 'tay', 'may', 'compa', 'eke', 'thuoc', 'ke',
  'chat', 'bot', 'ai', 'chatgpt', 'gemini', 'internet', 'geogebra',
  'google', 'classroom', 'googleclassroom', 'zalo', 'quizizz', 'mentimeter', 'word',
  'excel', 'powerpoint', 'canva', 'padlet', 'teams', 'zoom', 'azota', 'shub', 'lms'
]);

/**
 * Helper to clean a mathematical expression and wrap it in $...$
 */
function cleanMathExpression(raw: string, fullLine: string = ''): string {
  let s = raw.trim();
  // Strip existing dollar signs, backticks, and quotes
  s = s.replace(/[\$`'"]/g, '').trim();
  s = s.replace(/["“”'‘’]/g, '');

  let leadingPrefix = '';
  let trailingPunct = '';

  // Clean redundant colons
  s = s.replace(/:\s*:+/g, ':');

  // Clean unclosed or truncated \text{...} or extract \text{...}
  s = s.replace(/\\(?:text|mathrm)\s*\{\s*([^{}\n]*)$/gi, ' $1');
  s = s.replace(/\\(?:text|mathrm)\s*\{\s*"?([^{}\n"]*)"?\s*\}/gi, ' $1 ');

  // Clean extra backslashes before spaces/punctuation (e.g. ";\ " -> "; ", ",\ " -> ", ")
  s = s.replace(/\\([,;:! ])/g, ' ')
       .replace(/\\+(?=[ \t.,;:!?)\\}\\]]|$)/g, '')
       .replace(/([a-zA-Z0-9$]+)[,;:]\s*_{([^{}]+)}/g, '$1, $2')
       .replace(/_{([a-zA-Zà-ỹÀ-Ỹ\s]+)}/g, '$1');

  // Strip trailing punctuation e.g. ".", ";", ":", ","
  const mPunct = s.match(/([.,;:]+)$/);
  if (mPunct) {
    trailingPunct = mPunct[1];
    s = s.substring(0, s.length - trailingPunct.length).trim();
  }

  // Check for unbalanced open parenthesis at start or close at end
  let openCount = 0;
  let closeCount = 0;
  for (const ch of s) {
    if (ch === '(') openCount++;
    else if (ch === ')') closeCount++;
  }
  if (closeCount > openCount && s.endsWith(')')) {
    s = s.slice(0, -1).trim();
    trailingPunct = ')' + trailingPunct;
  } else if (openCount > closeCount && s.endsWith('(')) {
    s = s.slice(0, -1).trim();
    trailingPunct = '(' + trailingPunct;
  } else if (openCount > closeCount && s.startsWith('(')) {
    s = s.slice(1).trim();
    leadingPrefix = '(' + leadingPrefix;
  }

  // Normalize roots with braces, parentheses, numbers or symbols
  s = s.replace(/\\?sqrt\s*\(([^()]+)\)/gi, '\\sqrt{$1}')
       .replace(/\\?sqrt\s+([0-9a-zA-Z]+)/gi, '\\sqrt{$1}')
       .replace(/√\s*\(([^()]+)\)/g, '\\sqrt{$1}')
       .replace(/√\s*\{([^{}]+)\}/g, '\\sqrt{$1}')
       .replace(/√\s*([0-9a-zA-Z]+)/g, '\\sqrt{$1}');

  // Normalize vulgar fractions
  s = s.replace(/½/g, '\\dfrac{1}{2}')
       .replace(/⅓/g, '\\dfrac{1}{3}')
       .replace(/⅔/g, '\\dfrac{2}{3}')
       .replace(/¼/g, '\\dfrac{1}{4}')
       .replace(/¾/g, '\\dfrac{3}{4}')
       .replace(/⅕/g, '\\dfrac{1}{5}')
       .replace(/⅖/g, '\\dfrac{2}{5}')
       .replace(/⅗/g, '\\dfrac{3}{5}')
       .replace(/⅘/g, '\\dfrac{4}{5}');

  // Normalize frac without backslash: "frac {1}{2}" -> "\dfrac{1}{2}"
  s = s.replace(/(?<![\\a-zA-Z])(?:d|t|c)?frac\s*\{([^{}\n]+)\}\s*\{([^{}\n]+)\}/gi, '\\dfrac{$1}{$2}');
  s = s.replace(/\\frac\s*\{([^{}\n]+)\}\s*\{([^{}\n]+)\}/gi, '\\dfrac{$1}{$2}');

  // Normalize slashes in fractions: e.g. "- 2/3 x^a y^2" -> "-\dfrac{2}{3} x^a y^2", "-1/4" -> "-\dfrac{1}{4}", "1/2" -> "\dfrac{1}{2}", "-1/5y^25" -> "-\dfrac{1}{5}y^{25}"
  // STRICTLY PREVENT matching dates (e.g. 16/08/2026), circular numbers (TT 02/2025/TT-BGDĐT), or words
  s = s.replace(/(?<![$\d\/\-])([+-]?\s*\d+)\s*\/\s*(\d+)(?!\d)(?!\/\d|\/[A-Za-zÀ-ỹ])(?:\s*([xyzabctuvmn](?:[0-9_]*|\^[0-9a-zA-Z]+|\^\{[^{}]+\})*))?/g, (fullMatch, numPart, den, vars) => {
    if (isDateOrOfficialContext(fullMatch, fullLine)) {
      return fullMatch;
    }
    const cleanNum = numPart.replace(/\s+/g, '');
    const isNeg = cleanNum.startsWith('-');
    const absNum = isNeg ? cleanNum.substring(1) : (cleanNum.startsWith('+') ? cleanNum.substring(1) : cleanNum);
    const prefix = isNeg ? '-\\dfrac' : '\\dfrac';
    return `${prefix}{${absNum}}{${den}}${vars ? ' ' + vars : ''}`;
  });

  // Slash variable fractions: 1/y -> \dfrac{1}{y}, 3/x -> \dfrac{3}{x}
  s = s.replace(/(?<![$\d\/\-])(\d+)\s*\/\s*([xyzabctuvmn])\b/gi, '\\dfrac{$1}{$2}');

  // Normalize multiplication dot to standard baseline dot "." in Vietnamese secondary school math
  s = s.replace(/\*/g, ' . ');
  s = s.replace(/·/g, ' . ');
  s = s.replace(/\\cdot\b/g, ' . ');
  s = s.replace(/([a-zA-Z0-9\)\}\]])\s*\.\s*([a-zA-Z0-9\(\{\[\-])/g, '$1 . $2');
  s = s.replace(/\s{2,}/g, ' ').trim();

  // If token is detected as date, school year, or official circular, DO NOT wrap in math delimiters!
  if (isDateOrOfficialContext(s, fullLine)) {
    return leadingPrefix + s + trailingPunct;
  }

  if (!s) return leadingPrefix + trailingPunct;
  return leadingPrefix + `$${s}$` + trailingPunct;
}

const VIET_PEDAGOGICAL_WORDS = "khong|phai|la|vi|co|chua|giua|hai|mot|ba|bon|nam|sau|bay|tam|chin|muoi|bien|bac|he|so|phan|nhom|con|lai|va|hoac|trong|do|tap|hop|tu|nhien|khac|thuoc|hay|neu|giac|trang|tiet|bai|cau|sau|thay|vua|theo|nhu|tren|duoi|thu|gon|tinh|gia|tri|cua|bieu|thuc|don|da|dong|dang|nghia|du|luyen|van|dung|huong|dan|ve|nha|yeu|muc|tieu|san|pham|buoc|giao|nhiem|vu|hoc|bao|thao|luan|ket|nhan|dinh|de|cho|biet|rang|nguyen|duong|am|chu\\s+y|y\\s+nhu|sgk|hd|lop|phut|giay|thoi\\s+gian";

const VIET_WORD_SPLIT_PATTERN = new RegExp(
  `([;:]|\\([^)]*[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ][^)]*\\)|[a-zA-ZÀ-ỹ]*[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ][a-zA-ZÀ-ỹ]*|\\b(?:${VIET_PEDAGOGICAL_WORDS})\\b)`,
  'gi'
);

function isVietnameseWordOrPhrase(s: string): boolean {
  return VIETNAMESE_ACCENT_REGEX.test(s) || new RegExp(`^\\b(?:${VIET_PEDAGOGICAL_WORDS})\\b$`, 'i').test(s.trim());
}

function sanitizeVietnameseMathLine(line: string): string {
  if (!line) return line;

  let l = line
    .replace(/\*\*([^*]+:)\*\*\s*:+/g, '**$1** ')
    .replace(/(?::\s*){2,}/g, ': ')
    .replace(/:\s*:+/g, ':')
    .replace(/`([^`\n]+)`/g, (_m, inner) => {
      const trimmed = inner.trim();
      if (/[\\^_{}=+\-*/<>≤≥≠≈∈∉⊂∩∪∅√]|(?:frac|dfrac|sqrt)/.test(trimmed) || /^[+-]?\s*[0-9]*[a-zA-Z](?:\^[0-9]+)?$/.test(trimmed)) {
        return `$${trimmed}$`;
      }
      return trimmed;
    })
    .replace(/`+/g, '')
    .replace(/''/g, '"')
    .replace(/\\?sqrt\s*\(([^()]+)\)/gi, '\\sqrt{$1}')
    .replace(/√\s*\(([^()]+)\)/g, '\\sqrt{$1}')
    .replace(/\\([,;:! ])/g, ' ')
    .replace(/\\+(?=[ \t.,;:!?)\\}\\]]|$)/g, '')
    .replace(/([a-zA-Z0-9$]+)[,;:]\s*_{([^{}]+)}/g, '$1, $2')
    .replace(/(^|[\s,;:(])_{([a-zA-Zà-ỹÀ-Ỹ\s]+)}/g, '$1$2')
    .replace(/_{([a-zA-Zà-ỹÀ-Ỹ\s]+)}/g, '$1')
    .replace(/([.,;:!?])\s*(?<!\*)\*(?!\*)/g, '$1 ')
    .replace(/(?<![ℕℤℚℝN*])\*(?!\*)([.,;:!?])/g, '$1')
    .replace(/(?<![ℕℤℚℝN*])\*(?!\*)[ \t]*$/gm, '');

  const segments = l.split(VIET_WORD_SPLIT_PATTERN);

  let result = '';
  let pendingMath = '';
  let prevToken = '';

  const flushMath = () => {
    if (!pendingMath.trim()) {
      result += pendingMath;
      pendingMath = '';
      return;
    }
    const trimmed = pendingMath.trim();

    // Check for leading bullet: "+ ", "- ", "* ", "• "
    const bulletMatch = trimmed.match(/^([+*•–—]|-(?=\s))\s*/);
    let bulletPrefix = '';
    let mathToClean = trimmed;
    if (bulletMatch) {
      bulletPrefix = bulletMatch[0];
      mathToClean = trimmed.substring(bulletPrefix.length).trim();
    }

    if (!mathToClean) {
      result += pendingMath;
      pendingMath = '';
      return;
    }

    // Guard: Section, question, activity labels e.g. "Câu a", "Bài 1", "Ví dụ 2", "HĐ1", "Tiết 2"
    if (/^(?:HĐ\d+|Bài\s*\d+|Tiết\s*\d+|Câu\s*[a-z0-9]+|Ví\s*dụ\s*\d+)\.?$/i.test(mathToClean)) {
      result += pendingMath;
      pendingMath = '';
      return;
    }

    // Guard: item letters like "a:", "b:", "1:", "2:" right after "Câu", "Bài", "Ví dụ"
    if (/^[a-d0-9]:?$/i.test(mathToClean) && /^(?:Câu|Bài|Ví\s*dụ|Mục|Phần)$/i.test(prevToken.trim())) {
      result += pendingMath;
      pendingMath = '';
      return;
    }

    // Guard: numbers after pedagogical labels or measurement units e.g. "Nhiệm vụ 2", "trang 6", "HĐ 2", "Lớp 8"
    if (/^\d+$/.test(mathToClean) && /^(?:vụ|Nhiệm\s*vụ|trang|HĐ|Tiết|Bài|Ví\s*dụ|Bước|Nhóm|Lớp|thời\s*gian|phút|giây|cột|hàng)$/i.test(prevToken.trim())) {
      result += pendingMath;
      pendingMath = '';
      return;
    }

    // Guard: parenthesized non-math references like "(SGK trang 6)"
    if (/^\([^)]*(?:SGK|trang|bài|hình|sách)[^)]*\)$/i.test(mathToClean)) {
      result += pendingMath;
      pendingMath = '';
      return;
    }

    // Check if mathToClean contains genuine mathematical indicators:
    const hasMath =
      /[=^\\·]/.test(mathToClean) ||
      /\d+,\d+/.test(mathToClean) ||
      /\d+\s*[+\-*\/·=]\s*\d+/.test(mathToClean) ||
      /[xyzabctuvmn]\s*[0-9^+\-*=.]/.test(mathToClean) ||
      /[+\-*=.]\s*[xyzabctuvmn]/.test(mathToClean) ||
      /^[+-]\s*[0-9]+/.test(mathToClean) ||
      /^[A-Z]\s*=/.test(mathToClean) ||
      /^[a-zA-Z]\^[0-9a-zA-Z]/.test(mathToClean) ||
      /^[xyzabctuvmn]$/.test(mathToClean) ||
      /^[xyzabctuvmn](\s*,\s*[xyzabctuvmn])+$/.test(mathToClean) ||
      /\$|\sqrt|frac|dfrac/.test(mathToClean);

    if (hasMath) {
      const lead = pendingMath.match(/^\s*/)?.[0] || '';
      const trail = pendingMath.match(/\s*$/)?.[0] || '';
      result += lead + bulletPrefix + cleanMathExpression(mathToClean, line) + trail;
    } else {
      result += pendingMath;
    }
    pendingMath = '';
  };

  for (const seg of segments) {
    if (!seg) continue;

    if (seg === ';' || seg === ':') {
      flushMath();
      result += seg;
      prevToken = seg;
    } else if (seg.startsWith('(') && seg.endsWith(')') && VIETNAMESE_ACCENT_REGEX.test(seg)) {
      flushMath();
      const inner = seg.slice(1, -1);
      result += '(' + sanitizeVietnameseMathLine(inner) + ')';
      prevToken = seg;
    } else if (isVietnameseWordOrPhrase(seg)) {
      flushMath();
      result += seg;
      prevToken = seg;
    } else {
      pendingMath += seg;
    }
  }
  flushMath();

  return result;
}

/**
 * Intelligently scans text and auto-wraps naked mathematical expressions into standard LaTeX $...$:
 * - Monomials with exponents: 3x^2, -5x, 17z^4, -5x^2y, 2x^3y^2, -9x^3y^2z, c^{12} x^8 y^4
 * - Fractional coefficients: 1/2x -> $\dfrac{1}{2}x$, -1/4y^2z^3 -> $-\dfrac{1}{4}y^2z^3$, -1/5y^25 -> $-\dfrac{1}{5}y^{25}$
 * - Products with \cdot: 12\cdot x \cdot y = 12xy, 4,5 \cdot x \cdot y = 4,5xy, A = 2\cdot (-3)\cdot (x \cdot x^2) \cdot y = -6x^3y
 * - Radicals: (1 + \sqrt{2}) x^2y -> $(1 + \sqrt{2})x^2y$, 5x\sqrt{y} -> $5x\sqrt{y}$
 * - Algebraic expressions: x^2 - 2x, x^3 - 1/2x, -2x + 7y, x + 2y - z
 * - Standardizes all fractions to \dfrac with horizontal division bar (never vulgar fractions or text slashes).
 * - STRICTLY avoids wrapping dates, circular/decision numbers, and Vietnamese words.
 */
export function autoWrapVietnameseMathTokens(text: string): string {
  if (!text) return text;

  // Pre-unpack multiline aligned LaTeX math blocks into individual step formulas
  text = unpackLatexAlignedEnvironments(text);

  // Clean formatting artifacts before wrapping
  text = text
    .replace(/\\([,;:! ])/g, ' ')
    .replace(/\\+(?=[ \t.,;:!?)\\}\\]]|$)/g, '')
    .replace(/([a-zA-Z0-9$]+)[,;:]\s*_{([^{}]+)}/g, '$1, $2')
    .replace(/(^|[\s,;:(])_{([a-zA-Zà-ỹÀ-Ỹ\s]+)}/g, '$1$2')
    .replace(/_{([a-zA-Zà-ỹÀ-Ỹ\s]+)}/g, '$1')
    .replace(/([.,;:!?])\s*(?<!\*)\*(?!\*)/g, '$1 ')
    .replace(/(?<![ℕℤℚℝN*])\*(?!\*)([.,;:!?])/g, '$1')
    .replace(/(?<![ℕℤℚℝN*])\*(?!\*)[ \t]*$/gm, '');

  // Split by BOTH newline, <br> tags, AND markdown table pipes "|" so table cell lines and columns are treated as distinct independent scopes!
  const segments = text.split(/(<br\s*\/?>|\r?\n|\|)/gi);
  const processed = segments.map(line => {
    if (/<br\s*\/?>|\r?\n|\|/i.test(line)) return line;
    return sanitizeVietnameseMathLine(line);
  }).join('');

  // Fix any spacing between adjacent math and parenthesis, e.g. ")$(" -> ") $("
  return processed.replace(/\)\$\(/g, ')$ (');
}

/**
 * Splits a mixed string of Math + Vietnamese words into proper separated parts.
 */
function splitMixedMathVietnamese(raw: string): string {
  // 1. Protect \text{...} and \mathrm{...} blocks from being fragmented by spaces or diacritics
  const textPlaceholders: string[] = [];
  let protectedRaw = raw.replace(/\\(?:text|mathrm)\s*\{[^{}]*\}/g, (match) => {
    textPlaceholders.push(match);
    return `___LATEX_TEXT_PH_${textPlaceholders.length - 1}___`;
  });

  // Tokenize by spaces and Vietnamese phrases (DO NOT split by punctuation [,;:] so decimals like 4,5, coordinates like (2; 3) and sets {1; 2; 3} are NOT broken!)
  const segments = protectedRaw.split(/(\s+|\b(?:là|tập hợp|các|số|tự nhiên|khác|thuộc|không phải|vậy|khi|với mọi|thỏa mãn|suy ra|phân tích|đáp án|câu|chú ý|trong đó|được gọi là|gọi là)\b)/i);
  
  const result: string[] = [];
  let currentMath: string[] = [];

  const restorePlaceholders = (str: string) => {
    return str.replace(/___LATEX_TEXT_PH_(\d+)___/g, (_, idx) => textPlaceholders[Number(idx)] || '');
  };

  const flushMath = () => {
    if (currentMath.length > 0) {
      let mathStr = currentMath.join('').trim();
      if (mathStr) {
        // If it's just a single letter/digit or pure natural number without operators or letters, don't wrap in $
        if (/^[a-zA-Z0-9]$/.test(mathStr) || /^[0-9]+$/.test(mathStr)) {
          result.push(restorePlaceholders(mathStr));
        } else if (
          /[\^_{}\\=+\-*/<>≤≥≠≈∈∉⊂∩∪∅]/.test(mathStr) ||
          /[0-9]+,[0-9]+/.test(mathStr) ||
          /^[0-9]+[a-zA-Z]+/.test(mathStr) ||
          /___LATEX_TEXT_PH_/.test(mathStr) ||
          /\\(frac|dfrac|sqrt|neq|ne|le|ge|leq|geq|cdot|times|div|pm|mp|approx|sim|equiv|subset|supset|subseteq|supseteq|cup|cap|emptyset|infty|int|sum|prod|lim|vec|widehat|angle|triangle|parallel|perp|mathbb|mathbf|mathcal|text|mathrm|alpha|beta|gamma|delta|Delta|pi|theta|omega|Omega)/.test(mathStr)
        ) {
          result.push(`$${restorePlaceholders(mathStr)}$`);
        } else {
          result.push(restorePlaceholders(mathStr));
        }
      }
      currentMath = [];
    }
  };

  for (const seg of segments) {
    if (!seg) continue;

    if (VIETNAMESE_ACCENT_REGEX.test(seg) || /\b(là|tập hợp|các|số|tự nhiên|khác|thuộc|không phải|vậy|khi|với mọi|thỏa mãn|suy ra|phân tích|đáp án|câu|chú ý)\b/i.test(seg)) {
      flushMath();
      result.push(restorePlaceholders(seg));
    } else if (/\s+/.test(seg)) {
      if (currentMath.length > 0) {
        currentMath.push(seg);
      } else {
        result.push(seg);
      }
    } else {
      currentMath.push(seg);
    }
  }

  flushMath();

  return result.join('');
}
