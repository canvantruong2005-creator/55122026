import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { generateGeminiVision, resolveApiKeys } from './geminiApi';
import { autoNormalizeVietnameseFont } from './vietnameseFontConverter';

export { autoNormalizeVietnameseFont };

/**
 * Converts HTML (from Mammoth .docx conversion) into structured Markdown preserving all tables, columns, rows, and headings.
 */
export function htmlToMarkdownTables(html: string): string {
  if (!html) return '';
  if (typeof window === 'undefined') {
    return autoNormalizeVietnameseFont(html.replace(/<[^>]+>/g, ' '));
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const extractCellFormattedText = (el: Element): string => {
      // Clone element so we can safely mutate
      const clone = el.cloneNode(true) as Element;
      // Replace <br> and paragraph endings with <br> marker
      clone.querySelectorAll('br').forEach(br => br.replaceWith(' <br> '));
      clone.querySelectorAll('p, div, li').forEach(p => {
        p.insertAdjacentHTML('beforeend', ' <br> ');
      });
      const raw = clone.textContent || '';
      return raw
        .replace(/\|/g, '/')
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/(?:\s*<br>\s*)+/g, '<br>')
        .replace(/^<br>|<br>$/g, '')
        .trim();
    };

    // 1. Convert Headings & inline formatting outside tables
    doc.querySelectorAll('h1').forEach(h => { h.textContent = `\n# ${(h.textContent || '').trim()}\n`; });
    doc.querySelectorAll('h2').forEach(h => { h.textContent = `\n## ${(h.textContent || '').trim()}\n`; });
    doc.querySelectorAll('h3').forEach(h => { h.textContent = `\n### ${(h.textContent || '').trim()}\n`; });
    doc.querySelectorAll('h4, h5, h6').forEach(h => { h.textContent = `\n#### ${(h.textContent || '').trim()}\n`; });
    doc.querySelectorAll('strong, b').forEach(s => { s.textContent = `**${(s.textContent || '').trim()}**`; });
    doc.querySelectorAll('em, i').forEach(em => { em.textContent = `*${(em.textContent || '').trim()}*`; });
    doc.querySelectorAll('li').forEach(li => { li.textContent = `\n- ${(li.textContent || '').trim()}`; });

    // 2. Convert all <table> elements into structured Markdown tables
    const tables = Array.from(doc.querySelectorAll('table'));
    tables.forEach(table => {
      const rows = Array.from(table.querySelectorAll('tr'));
      if (rows.length === 0) return;

      let mdTable = '\n\n';

      // Determine max columns
      let maxCols = 0;
      rows.forEach(r => {
        let count = 0;
        r.querySelectorAll('th, td').forEach(c => {
          const span = parseInt(c.getAttribute('colspan') || '1', 10);
          count += span;
        });
        if (count > maxCols) maxCols = count;
      });

      if (maxCols === 0) return;

      // Find the true column header row (default to row 0)
      let headerRowIndex = 0;
      for (let i = 0; i < Math.min(rows.length, 3); i++) {
        const rowCells = Array.from(rows[i].querySelectorAll('th, td'));
        const rowText = rowCells.map(c => c.textContent || '').join(' ').toLowerCase();
        if (rowCells.length > 1 && (rowText.includes('stt') || rowText.includes('bài học') || rowText.includes('tên bài') || rowText.includes('hoạt động') || rowText.includes('tiết theo ppct') || rowText.includes('yêu cầu cần đạt'))) {
          headerRowIndex = i;
          break;
        }
      }

      // If there are banner rows before headerRowIndex, output them first
      for (let b = 0; b < headerRowIndex; b++) {
        const bCells = Array.from(rows[b].querySelectorAll('th, td'));
        const bText = bCells.map(c => extractCellFormattedText(c)).filter(Boolean).join(' - ');
        if (bText) {
          mdTable += `\n**${bText}**\n\n`;
        }
      }

      // Header row
      const firstRowCells = Array.from(rows[headerRowIndex].querySelectorAll('th, td'));
      const headerCols: string[] = [];
      firstRowCells.forEach(c => {
        const text = extractCellFormattedText(c);
        const colSpan = parseInt(c.getAttribute('colspan') || '1', 10);
        headerCols.push(text || ' ');
        for (let s = 1; s < colSpan; s++) {
          headerCols.push(' ');
        }
      });
      while (headerCols.length < maxCols) headerCols.push(' ');

      mdTable += '| ' + headerCols.join(' | ') + ' |\n';
      mdTable += '| ' + headerCols.map(() => ':---').join(' | ') + ' |\n';

      // Data rows
      for (let r = headerRowIndex + 1; r < rows.length; r++) {
        const cells = Array.from(rows[r].querySelectorAll('th, td'));
        const rowCols: string[] = [];
        
        cells.forEach(c => {
          const text = extractCellFormattedText(c);
          const colSpan = parseInt(c.getAttribute('colspan') || '1', 10);
          rowCols.push(text || '-');
          for (let s = 1; s < colSpan; s++) {
            rowCols.push('-');
          }
        });

        // If a row has only 1 cell and it's a heading/chapter/topic or continuation
        if (cells.length === 1 && maxCols > 1) {
          const singleText = extractCellFormattedText(cells[0]);
          const isChapterHeader = /^(?:chương|phần|chủ đề|học kỳ|học kì|bài học stem|hoạt động trải nghiệm|kiểm tra|ôn tập)/i.test(singleText);
          if (isChapterHeader) {
            // Span across or format as subheader row
            const filledCols = [singleText];
            while (filledCols.length < maxCols) filledCols.push('-');
            mdTable += '| ' + filledCols.join(' | ') + ' |\n';
            continue;
          }
        }

        while (rowCols.length < maxCols) rowCols.push('-');
        mdTable += '| ' + rowCols.slice(0, maxCols).join(' | ') + ' |\n';
      }
      mdTable += '\n';

      const p = doc.createElement('div');
      p.textContent = mdTable;
      table.parentNode?.replaceChild(p, table);
    });

    // 3. Final paragraph spacing outside tables
    doc.querySelectorAll('p').forEach(p => { p.textContent = `\n${p.textContent || ''}\n`; });

    const rawResult = doc.body.textContent || doc.body.innerText || '';
    return autoNormalizeVietnameseFont(rawResult).replace(/\n{3,}/g, '\n\n').trim();
  } catch (err) {
    console.warn('htmlToMarkdownTables error:', err);
    return autoNormalizeVietnameseFont(html.replace(/<[^>]+>/g, ' '));
  }
}

// Set up worker src matching pdfjs-dist version dynamically
try {
  if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      pdfWorkerUrl ||
      `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '6.2.108'}/build/pdf.worker.min.mjs`;
  }
} catch (e) {}

export interface FileReadOptions {
  startPage?: number;
  endPage?: number;
  maxPages?: number;
  fullScan?: boolean;
  apiKeys?: string[] | string;
}

/**
 * Checks if extracted text is rich and legible Vietnamese
 */
function isLegibleText(text: string): boolean {
  if (!text || text.trim().length < 60) return false;
  const weirdChars = (text.match(/[\uFFFD\u0000-\u0008\u000E-\u001F]/g) || []).length;
  if (weirdChars > text.length * 0.05) return false;
  const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/i.test(text);
  return hasVietnamese || text.length > 150;
}

/**
 * Rapidly retrieves total page count of a PDF file
 */
export async function getPdfPageCount(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer.slice(0),
      useSystemFonts: true,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '6.2.108'}/cmaps/`,
      cMapPacked: true
    });
    const pdf = await loadingTask.promise;
    return pdf.numPages || 1;
  } catch (err) {
    console.warn('Error reading PDF page count with pdfjs:', err);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const decoder = new TextDecoder('latin1');
      const binaryStr = decoder.decode(arrayBuffer);
      const countMatches = [...binaryStr.matchAll(/\/Type\s*\/Pages[\s\S]*?\/Count\s+(\d+)/gi)];
      if (countMatches.length > 0) {
        const counts = countMatches.map(m => parseInt(m[1], 10)).filter(c => !isNaN(c) && c > 0);
        if (counts.length > 0) return Math.max(...counts);
      }
    } catch (binErr) {}
    return 1;
  }
}

export const MULTIMODAL_OCR_AND_DIAGRAM_PROMPT = `Bạn là Trợ lý Sư phạm Cao cấp chuyên gia Đọc hiểu & Phân tích Đa phương thức (Multimodal AI).
Nhiệm vụ của bạn là đọc hiểu toàn diện hình ảnh/tài liệu tham chiếu này để phục vụ trực tiếp cho việc soạn Kế hoạch bài dạy (Giáo án) và tạo đề kiểm tra:

1. TRÍCH XUẤT VĂN BẢN & CÔNG THỨC (NẾU CÓ CHỮ):
- Đọc và trích xuất TOÀN BỘ văn bản tiếng Việt, tiêu đề bài học, đề bài, câu hỏi, bài tập, bảng biểu, số liệu, ký hiệu.
- Với môn Toán/KHTN: Chuyển toàn bộ công thức toán học, phương trình sang chuẩn LaTeX $...$ hoặc $$...$$.

2. ĐỌC HIỂU & MÔ TẢ CHI TIẾT HÌNH VẼ, SƠ ĐỒ, TRANH MINH HỌA (NẾU LÀ HÌNH VẼ):
- Nếu hình ảnh chứa: Hình học phẳng/không gian, Đồ thị hàm số, Sơ đồ thí nghiệm Lý/Hóa/Sinh, Sơ đồ tư duy, Lược đồ Lịch sử/Địa lí, hoặc Tranh tình huống khởi động/vận dụng:
  + Mô tả chi tiết các yếu tố hình học / cấu tạo: Các đỉnh, điểm, đoạn thẳng, quan hệ song song, vuông góc, số đo góc, độ dài, chiều mũi tên, dụng cụ thí nghiệm, chất tham gia, bảng chú thích...
  + Diễn giải ý nghĩa sư phạm, hiện tượng, kết luận hoặc câu hỏi gợi mở gắn liền với hình vẽ đó.
  + Tóm tắt lại thông tin để AI dễ dàng lấy dữ liệu này đưa vào Hoạt động Khởi động/Hình thành kiến thức trong Giáo án hoặc vẽ lại thành mã TikZ/GeoGebra.

3. ĐỊNH DẠNG ĐẦU RA:
- Trình bày dạng Markdown mạch lạc, rõ ràng, chia mục khoa học, giữ nguyên vẹn 100% ngữ nghĩa sư phạm.`;

/**
 * Perform Gemini Vision OCR & Diagram Comprehension on image file or canvas Data URL using all available system/admin/user keys
 */
export async function performOcrOnImageDataUrl(
  dataUrl: string,
  apiKeys?: string[] | string,
  promptText: string = MULTIMODAL_OCR_AND_DIAGRAM_PROMPT
): Promise<string> {
  const resolved = resolveApiKeys(apiKeys);
  try {
    const ocrResult = await generateGeminiVision({
      prompt: promptText,
      imageBase64: dataUrl,
      apiKeys: resolved
    });
    return ocrResult || '[Không trích xuất được văn bản hoặc hình vẽ từ ảnh này]';
  } catch (err: any) {
    console.error('Gemini Vision OCR Error:', err);
    return `[Lỗi quét OCR: ${err?.message || String(err)}]`;
  }
}

/**
 * Extracts text from PDF files using pdfjs-dist with page range options and AI OCR fallbacks.
 */
async function readPdfFile(file: File, options?: FileReadOptions): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const resolvedKeys = resolveApiKeys(options?.apiKeys);
  const pdfjsVer = (pdfjsLib as any).version || '6.2.108';

  const workerUrls = [
    pdfWorkerUrl,
    `https://unpkg.com/pdfjs-dist@${pdfjsVer}/build/pdf.worker.min.mjs`,
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVer}/build/pdf.worker.min.mjs`,
    `https://unpkg.com/pdfjs-dist@${pdfjsVer}/build/pdf.worker.min.js`,
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVer}/build/pdf.worker.min.js`
  ].filter(Boolean);

  for (const workerUrl of workerUrls) {
    try {
      if (typeof window !== 'undefined' && (pdfjsLib as any).GlobalWorkerOptions) {
        (pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerUrl;
      }
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer.slice(0),
        useSystemFonts: true,
        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsVer}/cmaps/`,
        cMapPacked: true
      });
      const pdf = await loadingTask.promise;
      let fullText = '';
      
      let startPage = 1;
      let endPage = pdf.numPages;

      if (options?.fullScan) {
        startPage = 1;
        endPage = pdf.numPages;
      } else {
        startPage = options?.startPage && options.startPage > 0 ? Math.min(options.startPage, pdf.numPages) : 1;
        if (options?.endPage && options.endPage >= startPage) {
          endPage = Math.min(pdf.numPages, options.endPage);
        } else if (options?.maxPages && options.maxPages > 0) {
          endPage = Math.min(pdf.numPages, startPage + options.maxPages - 1);
        } else {
          endPage = pdf.numPages;
        }
      }

      fullText += `--- [FILE PDF: ${file.name} (Tổng ${pdf.numPages} trang | ${options?.fullScan ? 'QUÉT TOÀN BỘ FILE' : `Trích xuất từ Trang ${startPage} đến Trang ${endPage}`})] ---\n\n`;

      for (let i = startPage; i <= endPage; i++) {
        try {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ')
            .trim();

          // If text is rich and legible (not garbled/scanned), keep it
          if (isLegibleText(pageText)) {
            fullText += `[PDF Trang ${i}]\n${pageText}\n\n`;
          } else {
            // Scanned / Image / Diagram page or garbled font encoding: Automatically perform Gemini Vision Multimodal OCR
            let ocrSuccess = false;
            try {
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              const viewport = page.getViewport({ scale: 1.8 });
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              if (context) {
                await page.render({ canvasContext: context, viewport, canvas } as any).promise;
                const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
                const ocrText = await performOcrOnImageDataUrl(
                  dataUrl,
                  resolvedKeys,
                  MULTIMODAL_OCR_AND_DIAGRAM_PROMPT + `\n(Đang đọc hiểu toàn diện Trang ${i} của tài liệu/SGK này)`
                );
                if (ocrText && !ocrText.startsWith('[Lỗi') && !ocrText.startsWith('[Không')) {
                  fullText += `[PDF Trang ${i} - Đã đọc hiểu AI Multimodal & OCR hình vẽ / văn bản]\n${ocrText}\n\n`;
                  ocrSuccess = true;
                }
              }
            } catch (ocrErr) {
              console.warn(`OCR canvas render error on page ${i}:`, ocrErr);
            }

            if (!ocrSuccess) {
              if (pageText) {
                fullText += `[PDF Trang ${i}]\n${pageText}\n\n`;
              } else {
                fullText += `[PDF Trang ${i}: Trang ảnh/hình vẽ minh họa]\n\n`;
              }
            }
          }
        } catch (pageErr) {
          console.warn(`Error reading PDF page ${i}:`, pageErr);
        }
      }

      if (fullText.trim().length > 30) {
        return fullText.trim();
      }
    } catch (err) {
      console.warn(`pdfjs worker failed with ${workerUrl}:`, err);
    }
  }

  return `[File PDF ${file.name}: Không thể phân tích tự động. Thầy/Cô có thể dùng tính năng 'Chuyển Đổi Tài Liệu (PDF sang Word OCR)' trên thanh công cụ để đọc chính xác từng trang!]`;
}

/**
 * Extracts text from PowerPoint presentations (.pptx and .ppt).
 */
async function readPptFile(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    const rawStr = decoder.decode(arrayBuffer);

    // Extract text inside <a:t>...</a:t> XML nodes from PPTX slides
    const textNodeMatches = rawStr.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/gi);
    if (textNodeMatches && textNodeMatches.length > 0) {
      const slideTexts = textNodeMatches.map(m => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
      const combined = slideTexts.join(' ').replace(/\s+/g, ' ').trim();
      if (combined.length > 30) {
        return `--- [FILE BÀI GIẢNG POWERPOINT: ${file.name}] ---\n` + combined;
      }
    }

    // Fallback: extract clean unicode text
    const cleanText = rawStr
      .replace(/[^\x20-\x7E\u00A0-\u024F\u1EA0-\u1EF9\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanText.length > 50) {
      return `--- [FILE POWERPOINT: ${file.name}] ---\n` + cleanText;
    }
  } catch (e) {
    console.error('PowerPoint parsing error:', e);
  }
  return `[File PowerPoint ${file.name}: Không trích xuất được chữ thô]`;
}

/**
 * Extracts text/data from Excel (.xlsx, .xls, .csv) files using SheetJS (XLSX).
 */
async function readExcelFile(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    let fullText = '';

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      if (csv.trim()) {
        fullText += `=== Bảng/Sheet Excel: ${sheetName} ===\n${csv}\n\n`;
      }
    }
    return fullText.trim() || '[File Excel rỗng]';
  } catch (err) {
    console.error('Error reading Excel file:', err);
    return `[Lỗi khi đọc file Excel ${file.name}: ${err instanceof Error ? err.message : String(err)}]`;
  }
}

/**
 * Official Circular 5512 content template with all 4 Annexes
 */
export const OFFICIAL_5512_TEXT = `# BỘ GIÁO DỤC VÀ ĐÀO TẠO
**Số: 5512/BGDĐT-GDTrH**
*Hà Nội, ngày 18 tháng 12 năm 2020*

## CÔNG VĂN HƯỚNG DẪN XÂY DỰNG VÀ TỔ CHỨC THỰC HIỆN KẾ HOẠCH GIÁO DỤC CỦA NHÀ TRƯỜNG

Kính gửi: Các Sở Giáo dục và Đào tạo

Thực hiện Chương trình giáo dục phổ thông ban hành kèm theo Thông tư số 32/2018/TT-BGDĐT ngày 26 tháng 12 năm 2018 của Bộ trưởng Bộ Giáo dục và Đào tạo, Bộ GDĐT hướng dẫn xây dựng và tổ chức thực hiện kế hoạch giáo dục của nhà trường cấp Trung học cơ sở và Trung học phổ thông...

---

### PHỤ LỤC I: KHUNG KẾ HOẠCH DẠY HỌC MÔN HỌC CỦA TỔ CHUYÊN MÔN
1. **Phân phối chương trình môn học**: Số tiết, Yêu cầu cần đạt (YCCĐ), Thiết bị dạy học, Địa điểm tổ chức.
2. **Chuyên đề lựa chọn / Bài học STEM**: Xây dựng theo định hướng phát triển phẩm chất và năng lực học sinh.
3. **Kiểm tra, đánh giá định kỳ**: Ma trận, bản đặc tả và đề kiểm tra giữa kỳ, cuối kỳ.

---

### PHỤ LỤC II: KHUNG KẾ HOẠCH TỔ CHỨC CÁC HOẠT ĐỘNG GIÁO DỤC CỦA TỔ CHUYÊN MÔN
- Các hoạt động trải nghiệm, hướng nghiệp, câu lạc bộ học tập và chuyên đề ngoại khóa.

---

### PHỤ LỤC III: KHUNG KẾ HOẠCH GIÁO DỤC CỦA GIÁO VIÊN TRONG NĂM HỌC
- Nhiệm vụ giảng dạy, bồi dưỡng học sinh giỏi, phụ đạo học sinh cần hỗ trợ, tự học và nghiên cứu khoa học sư phạm ứng dụng.

---

### PHỤ LỤC IV: KHUNG KẾ HOẠCH BÀI DẠY (GIÁO ÁN CHUẨN 5512)

**Tên bài dạy: ...**
**Môn học / Hoạt động giáo dục: ...; Lớp: ...**
**Thời gian thực hiện: ... tiết**

#### I. MỤC TIÊU BÀI HỌC
1. **Kiến thức**: Trình bày, nhận biết, giải thích, vận dụng kiến thức bài học vào giải quyết bài tập và tình huống thực tế.
2. **Năng lực**:
   - **Năng lực chung**: Tự chủ và tự học, Giao tiếp và hợp tác, Giải quyết vấn đề và sáng tạo.
   - **Năng lực đặc thù**: Năng lực toán học (tư duy và lập luận, mô hình hóa, giải quyết vấn đề, giao tiếp, sử dụng công cụ/phương tiện) & Năng lực số (NLS).
3. **Phẩm chất**: Yêu nước, Nhân ái, Chăm chỉ, Trung thực, Trách nhiệm.

#### II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU
1. **Giáo viên**: Kế hoạch bài dạy, máy chiếu/Tivi tương tác, phiếu học tập, phần mềm GeoGebra/mô phỏng trực quan.
2. **Học sinh**: Sách giáo khoa, vở ghi, đồ dùng học tập, bảng nhóm.

#### III. TIẾN TRÌNH DẠY HỌC (CHUẨN 4 HOẠT ĐỘNG):

##### 1. Hoạt động 1: Mở đầu / Khởi động (Xác định vấn đề học tập)
- **Mục tiêu**: Tạo tâm thế hứng thú, kích hoạt kiến thức nền và nêu vấn đề cần tìm hiểu trong bài học.
- **Nội dung**: Học sinh quan sát tình huống thực tế, tham gia trò chơi hoặc trả lời câu hỏi mở đầu.
- **Sản phẩm**: Câu trả lời, dự đoán hoặc kết quả ban đầu của học sinh.
- **Tổ chức thực hiện**: 
  - *Bước 1: Chuyển giao nhiệm vụ* (GV giao nhiệm vụ qua slide/phiếu).
  - *Bước 2: Thực hiện nhiệm vụ* (HS suy nghĩ cá nhân hoặc thảo luận nhóm).
  - *Bước 3: Báo cáo, thảo luận* (Đại diện trình bày, nhóm khác nhận xét).
  - *Bước 4: Kết luận, nhận định* (GV chốt vấn đề và dẫn dắt vào bài mới).

##### 2. Hoạt động 2: Hình thành kiến thức mới (Khám phá)
- **Mục tiêu**: Học sinh khám phá, chiếm lĩnh định nghĩa, quy tắc, định lý và tính chất mới.
- **Nội dung**: Học sinh đọc SGK, làm việc với phiếu học tập, phân tích ví dụ minh họa.
- **Sản phẩm**: Vở ghi học sinh, các kết luận kiến thức và bài tập ví dụ mẫu.
- **Tổ chức thực hiện**: Thực hiện đầy đủ 4 bước (Giao nhiệm vụ -> HS thực hiện -> Báo cáo thảo luận -> GV chuẩn hóa kiến thức).

##### 3. Hoạt động 3: Luyện tập (Củng cố và rèn luyện kỹ năng)
- **Mục tiêu**: Học sinh vận dụng trực tiếp kiến thức vừa học để giải các bài tập cơ bản và nâng cao.
- **Nội dung**: Làm bài tập trắc nghiệm, bài toán tự luận, phiếu luyện tập theo 3 mức độ (Biết - Hiểu - Vận dụng).
- **Sản phẩm**: Lời giải chi tiết trên bảng, bài làm trong vở và phiếu học tập.
- **Tổ chức thực hiện**: Thực hiện qua 4 bước (Giao nhiệm vụ -> HS thực hiện -> Báo cáo thảo luận -> Nhận xét, chốt đáp án).

##### 4. Hoạt động 4: Vận dụng (Mở rộng thực tiễn & Tự học sáng tạo)
- **Mục tiêu**: Vận dụng kiến thức bài học vào giải quyết các bài toán thực tiễn cuộc sống và định hướng tự học.
- **Nội dung**: Nhiệm vụ tìm tòi mở rộng, bài toán liên môn STEM hoặc tìm hiểu thực tế tại địa phương.
- **Sản phẩm**: Báo cáo thu hoạch, sản phẩm học tập hoặc bài thuyết trình ngắn của học sinh.
- **Tổ chức thực hiện**: GV giao nhiệm vụ về nhà hoặc thực hiện tại lớp theo dự án học tập.`;

/**
 * Extracts text and HTML from Word (.docx and .doc) files.
 */
export async function readWordFileDetailed(file: File): Promise<{ text: string; html?: string; isDocBinary?: boolean }> {
  const fileName = file.name.toLowerCase();

  // 1. Try mammoth for .docx with image embedding and full table extraction
  if (fileName.endsWith('.docx') || file.type.includes('wordprocessingml')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const mammothOptions = {
        convertImage: (mammoth as any).images?.imgElement ? (mammoth as any).images.imgElement((image: any) => {
          return image.read('base64').then((imageBuffer: string) => {
            return {
              src: 'data:' + image.contentType + ';base64,' + imageBuffer
            };
          });
        }) : undefined
      };
      
      const htmlResult = await mammoth.convertToHtml({ arrayBuffer }, mammothOptions as any);
      if (htmlResult.value && htmlResult.value.trim().length > 5) {
        // Convert HTML with full table structures into Markdown
        const structuredMarkdown = htmlToMarkdownTables(htmlResult.value);
        if (structuredMarkdown.trim().length > 10) {
          return {
            text: structuredMarkdown,
            html: htmlResult.value,
            isDocBinary: false
          };
        }
      }

      const rawTextResult = await mammoth.extractRawText({ arrayBuffer });
      if (rawTextResult.value && rawTextResult.value.trim().length > 5) {
        return {
          text: autoNormalizeVietnameseFont(rawTextResult.value.trim()),
          html: htmlResult.value,
          isDocBinary: false
        };
      }
    } catch (err) {
      console.error('Mammoth .docx parsing error:', err);
    }
  }

  // 2. Legacy .doc or failed .docx: Check for clean text vs binary dump
  try {
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    const rawStr = decoder.decode(arrayBuffer).normalize('NFC');

    // Filter out obvious binary control codes and XML/OLE headers
    const cleaned = rawStr
      .replace(/<[^>]+>/g, ' ')
      .replace(/[^\x20-\x7E\u00A0-\u024F\u0300-\u036F\u1EA0-\u1EF9\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .normalize('NFC')
      .trim();

    // Check if the extracted content actually looks like real Vietnamese text
    const allTokens = cleaned.split(/\s+/).filter(Boolean);
    const singleLetterTokens = allTokens.filter(t => t.length === 1);
    const singleRatio = allTokens.length > 0 ? (singleLetterTokens.length / allTokens.length) : 1;
    const hasSpacedGarbage = singleRatio > 0.25 || /([a-z]\s){4,}/i.test(cleaned);

    const words = allTokens.filter(w => w.length > 1);
    const hasEnoughCoherentWords = !hasSpacedGarbage && words.length > 30 && !cleaned.includes('[Content_Types].xml') && !cleaned.includes('Word.Document.8');

    if (hasEnoughCoherentWords) {
      return {
        text: autoNormalizeVietnameseFont(cleaned),
        isDocBinary: false
      };
    }
  } catch (e) {
    console.error('Word decode error:', e);
  }

  // Fallback structured message for binary .doc files
  const fallbackMessage = `# 📄 TÀI LIỆU MICROSOFT WORD: ${file.name}
- **Định dạng:** Microsoft Word (${fileName.endsWith('.doc') ? '.doc (Word 97-2003)' : '.docx'})
- **Dung lượng:** ${(file.size / 1024).toFixed(1)} KB
- **Ngày tải lên:** ${new Date().toLocaleDateString('vi-VN')}
- **Trạng thái:** Tệp đã được tải lên và sẵn sàng chỉnh sửa. Thầy/Cô có thể lưu sang định dạng .docx để hệ thống đọc và trích xuất bảng biểu chi tiết nhất.`;

  return {
    text: fallbackMessage,
    isDocBinary: true
  };
}

/**
 * Extracts text from Word (.docx and .doc) files.
 */
async function readWordFile(file: File): Promise<string> {
  const result = await readWordFileDetailed(file);
  return result.text;
}

/**
 * Utility to read uploaded files (PDF, DOCX, DOC, XLSX, XLS, CSV, TXT, MD, JSON, Image, etc.)
 */
export async function readFileAsText(file: File, options?: FileReadOptions): Promise<string> {
  const fileName = file.name.toLowerCase();

  // 0. Image files (.png, .jpg, .jpeg, .webp, .bmp) -> OCR
  if (
    fileName.endsWith('.png') ||
    fileName.endsWith('.jpg') ||
    fileName.endsWith('.jpeg') ||
    fileName.endsWith('.webp') ||
    fileName.endsWith('.bmp') ||
    file.type.startsWith('image/')
  ) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = (e.target?.result as string) || '';
        try {
          const ocrText = await performOcrOnImageDataUrl(dataUrl, options?.apiKeys);
          resolve(`--- [QUÉT OCR HÌNH ẢNH SGK / DỰ ÁN: ${file.name}] ---\n${ocrText}`);
        } catch (err: any) {
          resolve(`--- [HÌNH ẢNH: ${file.name}] ---\n[Lỗi xử lý OCR: ${err?.message || String(err)}]`);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // 1. PDF
  if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
    return await readPdfFile(file, options);
  }

  // 2. PowerPoint (.pptx, .ppt)
  if (
    fileName.endsWith('.pptx') ||
    fileName.endsWith('.ppt') ||
    file.type.includes('presentation') ||
    file.type.includes('powerpoint')
  ) {
    return await readPptFile(file);
  }

  // 3. Excel / CSV
  if (
    fileName.endsWith('.xlsx') ||
    fileName.endsWith('.xls') ||
    fileName.endsWith('.csv') ||
    file.type.includes('spreadsheet') ||
    file.type.includes('excel') ||
    file.type.includes('csv')
  ) {
    return await readExcelFile(file);
  }

  // 4. Word (.docx, .doc)
  if (
    fileName.endsWith('.docx') ||
    fileName.endsWith('.doc') ||
    file.type.includes('word') ||
    file.type.includes('wordprocessingml')
  ) {
    return await readWordFile(file);
  }

  // 5. General Text / Fallback
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async event => {
      const content = (event.target?.result as string) || '';
      if (content.startsWith('PK\x03\x04') || content.includes('Word.Document')) {
        const text = await readWordFile(file);
        resolve(text);
      } else if (content.startsWith('%PDF')) {
        const text = await readPdfFile(file);
        resolve(text);
      } else {
        resolve(content);
      }
    };
    reader.onerror = error => reject(error);
    reader.readAsText(file, 'UTF-8');
  });
}

export interface MultiFileReadResult {
  file: File;
  name: string;
  size: number;
  content: string;
  status: 'success' | 'error';
  error?: string;
}

/**
 * Batch reads multiple arbitrary files of any supported format
 */
export async function readMultipleFilesAsText(
  files: File[],
  options?: FileReadOptions,
  onProgress?: (index: number, total: number, fileName: string) => void
): Promise<MultiFileReadResult[]> {
  const results: MultiFileReadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (onProgress) onProgress(i + 1, files.length, f.name);
    try {
      const text = await readFileAsText(f, options);
      results.push({
        file: f,
        name: f.name,
        size: f.size,
        content: text,
        status: 'success'
      });
    } catch (err: any) {
      results.push({
        file: f,
        name: f.name,
        size: f.size,
        content: '',
        status: 'error',
        error: err?.message || String(err)
      });
    }
  }

  return results;
}
