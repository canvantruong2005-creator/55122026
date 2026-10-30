import { repairVietnameseText } from './mathSanitizer';

/**
 * Utility for normalizing Vietnamese Educational & Mathematical Terminology
 * Ensures 100% accurate spelling, notation, and standard nomenclature.
 */

/**
 * Utility for ungluing and splitting concatenated pedagogical headers and section titles.
 * Fixes missing line breaks between lesson titles, Roman numeral headings, sub-goals,
 * equipment, teaching progress, periods, and pedagogical activities.
 */
export function ungluePedagogicalHeadings(text: string): string {
  if (!text) return '';
  let s = text;

  // 0. Auto-heal broken Bảng kê items / Chi tiết machine parts split into fake periods
  // e.g. "Chi\nTIẾT 1:** BẢN LỀ (2 CÁI, THÉP)" or "3.\nTIẾT 3: CHỐT (1 CÁI, THÉP)"
  s = s.replace(/(?:^|\n|<br\s*\/?>)[ \t]*(?:(?:\d+\.\s*)?Chi|3\.)[ \t]*(?=(?:\n|<br\s*\/?>)*[ \t]*\*{0,2}(?:TIẾT|Tiết)\s+\d+)/gi, '');
  s = s.replace(/(?:^|\n|<br\s*\/?>)[ \t]*\*{0,2}(?:TIẾT|Tiết)\s+(\d+)\*{0,2}[:* \t]+(BẢN\s*LỀ|VÒNG\s*ĐỆM|CHỐT|ỐC|VÍT|THÉP|NHÔM|ĐỒNG|[A-ZÀ-Ỹa-zà-ỹ0-9\s,()–-]+?(?:cái|chiếc|thép|nhôm|đồng|gang|nhựa)[^\n|<]*)/gi, (_m, num, desc) => {
    let cleanDesc = desc.replace(/[*#]/g, '').trim();
    cleanDesc = cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1).toLowerCase();
    return `<br/>- Chi tiết ${num}: ${cleanDesc}`;
  });

  // 1. Repair OCR / broken syllables of "mục tiêu", "môc", "mÔC", "mục"
  s = s.replace(/\b(?:m[ôu]|M[ÔUu])\s*['´’‘`]?\s*c\s*tiêu\b/gi, 'mục tiêu');
  s = s.replace(/\bM[ÔUuô]C\s*TIÊU\b/g, 'MỤC TIÊU');
  s = s.replace(/\bm[ôôu]c\b/gi, 'mục');
  s = s.replace(/\bM[ÔUuô]C\b/g, 'MỤC');
  s = s.replace(/\bmÔC\b/g, 'mục');
  s = s.replace(/\bMôc\b/g, 'Mục');

  // 2. Unglue Lesson Title (BÀI X...) followed by Section I. MỤC TIÊU or corrupted mÔC TIÊU
  // e.g. "BÀI 1: TẬP HỢP CÁC SỐ TỰ NHIÊN. I. MỤC TIÊU" or "BÀI 1: TẬP HỢP CÁC SỐ TỰ NHIÊN. mÔC TIÊU"
  s = s.replace(/((?:BÀI|Bài|CHỦ ĐỀ|Chủ đề)\s+\d+[:\s][^\n.]+?)(?:[.\s]+|\s*)(?:#{1,4}\s*|\*{0,2})I\.\s*(?:M[ỤÔUuô]C\s*TIÊU|Mục\s*tiêu|mục\s*tiêu|KIẾN\s*THỨC|Kiến\s*thức)/gi, '$1\n\n**I. MỤC TIÊU**\n');
  s = s.replace(/((?:BÀI|Bài|CHỦ ĐỀ|Chủ đề)\s+\d+[:\s][^\n.]+?)\.(?:\s*|\s*I\.\s*)(?:M[ỤÔUuô]C\s*TIÊU|mục\s*tiêu|mÔC\s*TIÊU|môc\s*tiêu)/gi, '$1\n\n**I. MỤC TIÊU**\n');

  // Unglue any general sentence followed by I. MỤC TIÊU
  s = s.replace(/([^\n|])(?:\.|\s+)(?:#{1,4}\s*|\*{0,2})I\.\s*(?:M[ỤÔUuô]C\s*TIÊU|Mục\s*tiêu|KIẾN\s*THỨC)/gi, '$1\n\n**I. MỤC TIÊU**\n');

  // 3. Unglue I. MỤC TIÊU followed directly by 1. Kiến thức / 1. KIẾN THỨC
  // e.g. "I. MỤC TIÊU1. Kiến thức:" or "**I. MỤC TIÊU**1. Kiến thức:" or "I. MỤC TIÊU 1. Kiến thức:"
  s = s.replace(/(?:\*{0,2}I\.\s*M[ỤÔUuô]C\s*TIÊU[^\n*|]*\*{0,2}[.:]?[ \t]*)(?:\*{0,2}(?:1\.\s*|1\s*[:.]\s*)(?:(?:Về\s*)?Kiến\s*thức|(?:VỀ\s*)?KIẾN\s*THỨC)[ \t]*[:.]?(?:\*\*)?)/gi, '**I. MỤC TIÊU**\n\n**1. Kiến thức:**\n');

  // Unglue standard sub-sections under I. MỤC TIÊU: 1. Kiến thức, 2. Năng lực, 3. Phẩm chất
  s = s.replace(/(^|\n|[^\n|])[ \t]*(?:\*\*)?(?:1\.\s*|1\s*[:.]\s*)(?:(?:Về\s*)?Kiến\s*thức|(?:VỀ\s*)?KIẾN\s*THỨC)[ \t]*[:.]?(?:\*\*)?[ \t]*/gi, (_m, lead) => {
    const prefix = lead && lead.trim() ? `${lead}\n\n` : (lead || '');
    return `${prefix}**1. Kiến thức:**\n`;
  });
  s = s.replace(/(^|\n|[^\n|])[ \t]*(?:\*\*)?(?:2\.\s*|2\s*[:.]\s*)(?:(?:Về\s*)?Năng\s*lực|(?:VỀ\s*)?NĂNG\s*LỰC)[ \t]*[:.]?(?:\*\*)?[ \t]*/gi, (_m, lead) => {
    const prefix = lead && lead.trim() ? `${lead}\n\n` : (lead || '');
    return `${prefix}**2. Năng lực:**\n`;
  });
  s = s.replace(/(^|\n|[^\n|])[ \t]*(?:\*\*)?(?:3\.\s*|3\s*[:.]\s*)(?:(?:Về\s*)?Phẩm\s*chất|(?:VỀ\s*)?PHẨM\s*CHẤT)[ \t]*[:.]?(?:\*\*)?[ \t]*/gi, (_m, lead) => {
    const prefix = lead && lead.trim() ? `${lead}\n\n` : (lead || '');
    return `${prefix}**3. Phẩm chất:**\n`;
  });

  // 4. Unglue Section II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU
  // e.g. "...đất nước. II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU1. GIÁO VIÊN:"
  s = s.replace(/([^\n|])\s*(?:#{1,4}\s*|\*{0,2})II\.\s*(?:THIẾT\s*BỊ[^\n*|<]*|Thiết\s*bị[^\n*|<]*)/gi, '$1\n\n**II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU**\n');
  
  // Unglue II. THIẾT BỊ... glued with 1. GIÁO VIÊN: / 1. Giáo viên:
  s = s.replace(/(?:\*{0,2}II\.\s*THIẾT\s*BỊ[^\n*|]*\*{0,2}[.:]?[ \t]*)(?:\*{0,2}(?:1\.\s*|1\s*[:.]\s*)(?:(?:Về\s*|Đối\s*với\s*)?(?:GIÁO\s*VIÊN|Giáo\s*viên|THẦY\s*CÔ|Thầy\s*cô))[ \t]*[:.]?(?:\*\*)?)/gi, '**II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU**\n\n**1. Giáo viên:**\n');

  // Unglue 1. Giáo viên: / 2. Học sinh:
  s = s.replace(/(^|\n|[^\n|])[ \t]*(?:\*\*)?(?:1\.\s*|1\s*[:.]\s*)(?:(?:Về\s*|Đối\s*với\s*)?(?:GIÁO\s*VIÊN|Giáo\s*viên|THẦY\s*CÔ|Thầy\s*cô))[ \t]*[:.]?(?:\*\*)?[ \t]*/gi, (_m, lead) => {
    const prefix = lead && lead.trim() ? `${lead}\n\n` : (lead || '');
    return `${prefix}**1. Giáo viên:**\n`;
  });
  s = s.replace(/(^|\n|[^\n|])[ \t]*(?:\*\*)?(?:2\.\s*|2\s*[:.]\s*)(?:(?:Về\s*|Đối\s*với\s*)?(?:HỌC\s*SINH|Học\s*sinh|HS))[ \t]*[:.]?(?:\*\*)?[ \t]*/gi, (_m, lead) => {
    const prefix = lead && lead.trim() ? `${lead}\n\n` : (lead || '');
    return `${prefix}**2. Học sinh:**\n`;
  });

  // 5. Unglue Section III. TIẾN TRÌNH DẠY HỌC
  // e.g. "...giấy nháp. III. TIẾN TRÌNH DẠY HỌCTIẾT 1: LÝ THUYẾT"
  s = s.replace(/([^\n|])\s*(?:#{1,4}\s*|\*{0,2})III\.\s*(?:TIẾN\s*TRÌNH\s*DẠY\s*HỌC|Tiến\s*trình)/gi, '$1\n\n**III. TIẾN TRÌNH DẠY HỌC**\n');

  // Unglue III. TIẾN TRÌNH DẠY HỌC glued with TIẾT X: ...
  s = s.replace(/(?:\*{0,2}III\.\s*TIẾN\s*TRÌNH\s*DẠY\s*HỌC\*{0,2}[.:]?[ \t]*)(?:\*{0,2}(?<!(?:chi|họa|thời|bài|tình)\s*)(?<![a-zA-ZÀ-ỹ])(?:TIẾT|Tiết)\s+(\d+)[ \t]*[-–:][ \t]*([^\n*|]+)\*{0,2})/gi, (_m, tietNum, tietTitle) => {
    if (/(?:bản\s*lề|vòng\s*đệm|chốt|ốc|vít|thép|nhôm|đồng|gang|nhựa|cái|chiếc|bộ\s*phận|vật\s*liệu|chi\s*tiết)/i.test(tietTitle)) {
      return _m;
    }
    return `**III. TIẾN TRÌNH DẠY HỌC**\n\n**TIẾT ${tietNum}: ${tietTitle.toUpperCase().trim()}**\n`;
  });

  // Extract TIẾT X: ... from inside table pipes so it is NEVER rendered as an inner table cell
  // SPECIAL GUARD: NEVER extract machine parts (chi tiết 1, 2, 3...) or items preceded by chi/họa/thời/bài/tình!
  s = s.replace(/(?:^|\n)[ \t]*\|[ \t]*(?:\*\*)?(?<!(?:chi|họa|thời|bài|tình)\s*)(?<![a-zA-ZÀ-ỹ])(?:TIẾT|Tiết)\s+(\d+)[ \t]*[-–:][ \t]*([^\n|]+?)(?:\*\*)?[ \t]*\|(?:[ \t]*\|)?/gi, (m, num, title) => {
    if (/(?:bản\s*lề|vòng\s*đệm|chốt|ốc|vít|thép|nhôm|đồng|gang|nhựa|cái|chiếc|bộ\s*phận|vật\s*liệu|chi\s*tiết)/i.test(title)) {
      return m;
    }
    return `\n\n**TIẾT ${num}: ${title.toUpperCase().trim()}**\n\n| **Hoạt động của GV và HS** | **Dự kiến sản phẩm** |\n| :--- | :--- |\n`;
  });

  // Unglue standalone TIẾT X: ... glued to any previous text (unless inside table)
  // CRITICAL: NEVER unglue inside table rows (lines containing '|'), and NEVER match machine parts or non-period words!
  const linesAfterTiet = s.split('\n');
  for (let li = 0; li < linesAfterTiet.length; li++) {
    const curLine = linesAfterTiet[li];
    if (curLine.includes('|')) continue;
    linesAfterTiet[li] = curLine.replace(/(?<=[.!?:])\s*(?<!chi\s+|họa\s+|thời\s+|bài\s+|tình\s+|nhiệt\s+|đặc\s+|từng\s+)(?<![a-zA-ZÀ-ỹ])(?:\*\*)?(?:TIẾT|Tiết)\s+(\d+)[ \t]*[-–:][ \t]*([^\n*|]+?)(?:\*\*)?(?=[.!?\n]|$)/gi, (m, num, title) => {
      if (/(?:bản\s*lề|vòng\s*đệm|chốt|ốc|vít|thép|nhôm|đồng|gang|nhựa|cái|chiếc|bộ\s*phận|vật\s*liệu|chi\s*tiết)/i.test(title)) {
        return m;
      }
      return `\n\n**TIẾT ${num}: ${title.toUpperCase().trim()}**\n`;
    });
  }
  s = linesAfterTiet.join('\n');

  // 6. Unglue Section IV & V, TỔNG KẾT KIẾN THỨC, HƯỚNG DẪN VỀ NHÀ (cả bài / từng tiết)
  // Ensure that TỔNG KẾT KIẾN THỨC and HƯỚNG DẪN VỀ NHÀ are ALWAYS cleanly separated by double newlines,
  // NEVER glued to a previous sentence or attached directly to a table's closing pipe '|'
  s = s.replace(/(^|\n|.)[ \t]*(?:\|[ \t]*)?(?:#{1,4}\s*|\*{0,2})(?:(?:IV|V)\.\s*)?TỔNG\s*KẾT\s*(?:KIẾN\s*THỨC|BÀI\s*HỌC)?(?:\s*\([^)]*\))?(?:\*\*)?[ \t]*(?:[:–-]\s*)?(?:\|[ \t]*)?/gi, (_m, lead) => {
    const prefix = !lead || lead === '\n' ? '\n\n' : (lead === '|' ? '|\n\n' : `${lead}\n\n`);
    return `${prefix}**TỔNG KẾT KIẾN THỨC**\n\n`;
  });
  s = s.replace(/(^|\n|.)[ \t]*(?:\|[ \t]*)?(?:#{1,4}\s*|\*{0,2})(?:(?:IV|V)\.\s*)?(?:HƯỚNG\s*DẪN\s*(?:HỌC\s*SINH\s*HỌC\s*Ở\s*NHÀ|VỀ\s*NHÀ|TỰ\s*HỌC)(?:\s*\([^)]*\))?|HƯỚNG\s*DẪN\s*VỀ\s*NHÀ(?:\s*\([^)]*\))?|DẶN\s*DÒ|Hướng\s*dẫn\s*về\s*nhà)(?:\*\*)?[ \t]*(?:[:–-]\s*)?(?:\|[ \t]*)?/gi, (_m, lead) => {
    const prefix = !lead || lead === '\n' ? '\n\n' : (lead === '|' ? '|\n\n' : `${lead}\n\n`);
    return `${prefix}**IV. HƯỚNG DẪN VỀ NHÀ**\n\n`;
  });
  s = s.replace(/(^|\n|.)[ \t]*(?:\|[ \t]*)?(?:#{1,4}\s*|\*{0,2})V\.\s*(?:TỔNG\s*KẾT|Tổng\s*kết)(?:\*\*)?[ \t]*(?:[:–-]\s*)?(?:\|[ \t]*)?/gi, (_m, lead) => {
    const prefix = !lead || lead === '\n' ? '\n\n' : (lead === '|' ? '|\n\n' : `${lead}\n\n`);
    return `${prefix}**V. TỔNG KẾT BÀI HỌC**\n\n`;
  });

  // Unglue and format verses under TỔNG KẾT KIẾN THỨC: split poem lines cleanly without HTML tags or blockquotes
  s = s.replace(/(\*\*TỔNG KẾT KIẾN THỨC\*\*\n\n)([\s\S]*?)(?=\n\n\*\*|\n\n#{1,4}|\||$)/gi, (_m, header, body) => {
    // 1. Strip any leading blockquote '>' markers, HTML <br> artifacts, and stray signs
    let cleanBody = body
      .replace(/^[ \t]*>[ \t]*/gm, '')
      .replace(/(?:<br\s*\/?>|<\/br>|<br>|<br)+/gi, '\n')
      .replace(/^[ \t]*[><\s]+$/gm, '');

    // 2. Split verses separated by slashes '/' (between Vietnamese words, not fractions like 1/2 or km/h)
    cleanBody = cleanBody.replace(/(?<=[a-zA-ZÀ-ỹ0-9,;!?])\s*\/\s*(?=[a-zA-ZÀ-ỹ0-9])/gi, '\n');

    const lines = cleanBody
      .split('\n')
      .map(v => v.replace(/^[-+*•\s]+/, '').trim())
      .filter(Boolean);
    if (lines.length > 0) {
      return header + lines.join('\n\n') + '\n\n';
    }
    return header;
  });

  // Unglue and format bullet items under IV. HƯỚNG DẪN VỀ NHÀ into proper markdown newlines
  s = s.replace(/(\*\*IV\. HƯỚNG DẪN VỀ NHÀ\*\*\n\n)([\s\S]*?)(?=\n\n\*\*|\n\n#{1,4}|\||$)/gi, (_m, header, body) => {
    // 1. Clean residual blockquotes and HTML breaks
    let clean = body
      .replace(/^[ \t]*>[ \t]*/gm, '')
      .replace(/(?:<br\s*\/?>|<\/br>|<br>|<br)+/gi, '\n')
      .replace(/^[ \t]*[><\s]+$/gm, '');

    // 2. Auto-repair fractured math expressions (e.g. "(n" + "\n+ 3)" or "\n+ 4 = 9")
    clean = clean.replace(/([^\n])\n\s*(\+\s*(?:\d|\(|[a-z]\b|[A-Za-z0-9^_{}]+\s*=))/g, '$1 $2');
    clean = clean.replace(/(\([^)\n]*)\n\s*(\+[^)\n]*\))/g, '$1 $2');

    // 3. Only split lines at ACTUAL bullet markers preceded by sentence ends (. : ! ?)
    clean = clean.replace(/([.;:!?])\s+([-*•]\s+)/g, '$1\n$2');
    clean = clean.replace(/([.;:!?])\s+(\+\s+[A-ZÀ-Ỹ])/g, '$1\n$2');

    // 4. In đậm các đề mục chuẩn trong Hướng dẫn về nhà
    clean = clean
      .replace(/(^|\n)\s*([-*•]\s*)?(?:[-*•]\s*)?(?:Ôn\s*tập\s*lý\s*thuyết|Ôn\s*tập)\s*:/gi, '$1- **Ôn tập lý thuyết:**')
      .replace(/(^|\n)\s*([-*•]\s*)?(?:[-*•]\s*)?(?:Hướng\s*dẫn\s*phương\s*pháp\s*giải\s*bài\s*tập\s*(?:SGK|SBT|SGK,\s*SBT|SGK\s*SBT)|Phương\s*pháp\s*giải\s*bài\s*tập)\s*:/gi, '$1- **Hướng dẫn phương pháp giải bài tập SGK, SBT:**')
      .replace(/(^|\n)\s*([-*•]\s*)?(?:[-*•]\s*)?(?:Bài\s*tập\s*nâng\s*cao)\s*:?/gi, '$1- **Bài tập nâng cao:**')
      .replace(/(^|\n)\s*([-*•]\s*)?(?:[-*•]\s*)?(?:Chuẩn\s*bị\s*bài\s*tiếp\s*theo|Chuẩn\s*bị\s*bài\s*mới|Chuẩn\s*bị\s*bài\s*sau|Chuẩn\s*bị)\s*:/gi, '$1- **Chuẩn bị bài sau:**')
      .replace(/(^|\n)\s*([-*•]\s*)?(?:[-*•]\s*)?(?:Nhiệm\s*vụ\s*AI|Ứng\s*dụng\s*AI)\s*:/gi, '$1- **Nhiệm vụ AI:**')
      .replace(/(^|\n)\s*(?:Bài\s*tập\s*khó\s*phát\s*triển\s*tư\s*duy|Bài\s*tập\s*phát\s*triển\s*tư\s*duy)\s*:/gi, '$1**Bài tập khó phát triển tư duy:**')
      .replace(/(^|\n|\s)(?:Gợi\s*ý\s*phương\s*pháp\s*giải|Gợi\s*ý\s*giải|Gợi\s*ý)\s*:/gi, '$1**Gợi ý phương pháp giải:**')
      .replace(/(^|\n|\s)(?:Bài\s*toán)\s*:/gi, '$1**Bài toán:**');

    const rawItems = clean.split('\n').map(l => l.trim()).filter(Boolean);
    const finalItems: string[] = [];
    for (const item of rawItems) {
      if (/^\+\s*(?:\d|\(|[a-z]\b|[A-Za-z0-9^_{}]+\s*=)/.test(item) && finalItems.length > 0) {
        finalItems[finalItems.length - 1] += ' ' + item;
      } else {
        finalItems.push(item);
      }
    }

    return header + finalItems.join('\n\n') + '\n\n';
  });

  // 7. Unglue Document Metadata & Prefixes (Đề tài, Môn, Khối lớp, Thời lượng, Nội dung nguồn, Yêu cầu)
  s = s.replace(/([^\n|])\s*(?:\*\*)?(?:Đề\s*tài|Chủ\s*đề|Tên\s*bài)\s*[:\.]/gi, '$1\n\n**Đề tài:** ');
  s = s.replace(/([^\n|])\s*(?:\*\*)?(?:Môn|Môn\s*học)\s*[:\.]/gi, '$1\n\n**Môn:** ');
  // Only match Khối lớp / Lớp when followed by a grade/class identifier (e.g. 6, 7A, 8, 9, 10, THCS...)
  // NEVER match when followed by student action verbs or when inside pedagogical steps!
  s = s.replace(/([^\n|])\s*(?:\*\*)?(?:Khối\s*lớp|Lớp)\s*[:\.]\s*(?=(?:\*\*)?(?:\d+|[0-9]+[A-Za-z]|Khối\s*\d+|Lớp\s*\d+|Tiểu\s*học|THCS|THPT)\b)/gi, '$1\n\n**Khối lớp:** ');
  s = s.replace(/([^\n|])\s*(?:\*\*)?(?:Thời\s*lượng(?:\s*dự\s*kiến)?)\s*[:\.]/gi, '$1\n\n**Thời lượng dự kiến:** ');
  s = s.replace(/([^\n|])\s*(?:\*\*)?(?:Nội\s*dung\s*nguồn|Nguồn\s*tài\s*liệu)\s*[:\.]/gi, '$1\n\n**Nội dung nguồn:** ');
  s = s.replace(/([^\n|])\s*(?:\*\*)?(?:Yêu\s*cầu\s*chuyên\s*biệt|Yêu\s*cầu\s*sư\s*phạm)\s*[:\.]/gi, '$1\n\n**Yêu cầu chuyên biệt:** ');
  s = s.replace(/([^\n|])\s*(?:\*\*)?(?:Đối\s*tượng(?:\s*áp\s*dụng)?)\s*[:\.]/gi, '$1\n\n**Đối tượng:** ');

  // 8. Unglue PHẦN 1, PHẦN 2, PHẦN 3, CHUYÊN ĐỀ, BÀI TẬP in materials and worksheets
  // E.g. "...tập hợp. PHẦN 3: CÁC CÔNG THỨC & QUY TẮC CỐT LÕI" or "phần 1: kiến thức trọng tâm"
  s = s.replace(/([^\n|])\s*(?:#{1,4}\s*|\*{0,2})(?:PHẦN|Phần)\s+(\d+)[:\s\.\-][ \t]*([^\n*|]+)/gi, (_m, lead, partNum, partTitle) => {
    return `${lead}\n\n**PHẦN ${partNum}: ${partTitle.toUpperCase().trim()}**\n\n`;
  });
  s = s.replace(/^([ \t]*(?:#{1,4}\s*|\*{0,2})(?:PHẦN|Phần)\s+(\d+)[:\s\.\-][ \t]*[^\n*|]+)[ \t]+(I\.\s*(?:M[ỤÔUuô]C\s*TIÊU|Mục\s*tiêu|KIẾN\s*THỨC|Kiến\s*thức))/gmi, '$1\n\n**$3**\n');
  s = s.replace(/^(?:#{1,4}\s*|\*{0,2})(?:PHẦN|Phần)\s+(\d+)[:\s\.\-][ \t]*([^\n*|]+)(?:\*\*)?/gim, (_m, partNum, partTitle) => {
    return `**PHẦN ${partNum}: ${partTitle.toUpperCase().trim()}**\n`;
  });

  // Remove standalone colon lines often generated between headers
  s = s.replace(/\n[ \t]*:[ \t]*\n/g, '\n');

  // 9. Unglue A & B major sections
  s = s.replace(/([^\n|])\s*(?:#{1,4}\s*|\*{0,2})A\.\s*M[ỤÔUuô]C\s*TIÊU\s*CHUNG/gi, '$1\n\n**A. MỤC TIÊU CHUNG CỦA TOÀN BÀI HỌC:**\n');
  s = s.replace(/([^\n|])\s*(?:#{1,4}\s*|\*{0,2})B\.\s*M[ỤÔUuô]C\s*TIÊU\s*(?:VÀ\s*YÊU\s*CẦU\s*CẦN\s*ĐẠT\s*)?RIÊNG/gi, '$1\n\n**B. MỤC TIÊU VÀ YÊU CẦU CẦN ĐẠT RIÊNG CHO TỪNG TIẾT HỌC:**\n');

  return s;
}

export function normalizeVietnameseTerminology(text: string): string {
  if (!text) return '';
  let s = repairVietnameseText(text);
  s = ungluePedagogicalHeadings(s);
  s = repairPedagogicalActors(s);

  // 1. Correct "phần số" -> "phân số" in all mathematical & educational contexts
  s = s.replace(/\bPHẦN\s+SỐ\b/g, 'PHÂN SỐ');
  s = s.replace(/\bPhần\s+số\b/g, 'Phân số');
  s = s.replace(/\bPhần\s+Số\b/g, 'Phân Số');
  
  const fractionPhrases = [
    [/khái niệm phần số/gi, 'khái niệm phân số'],
    [/mở rộng khái niệm phần số/gi, 'mở rộng khái niệm phân số'],
    [/phần số bằng nhau/gi, 'phân số bằng nhau'],
    [/rút gọn phần số/gi, 'rút gọn phân số'],
    [/phần số tối giản/gi, 'phân số tối giản'],
    [/phần số âm/gi, 'phân số âm'],
    [/phần số dương/gi, 'phân số dương'],
    [/hai phần số/gi, 'hai phân số'],
    [/các phần số/gi, 'các phân số'],
    [/mỗi phần số/gi, 'mỗi phân số'],
    [/tính chất cơ bản của phần số/gi, 'tính chất cơ bản của phân số'],
    [/quy đồng mẫu nhiều phần số/gi, 'quy đồng mẫu nhiều phân số'],
    [/quy đồng phần số/gi, 'quy đồng phân số'],
    [/cộng phần số/gi, 'cộng phân số'],
    [/trừ phần số/gi, 'trừ phân số'],
    [/nhân phần số/gi, 'nhân phân số'],
    [/chia phần số/gi, 'chia phân số'],
    [/đưa phần số về/gi, 'đưa phân số về'],
    [/tử số và mẫu số của phần số/gi, 'tử số và mẫu số của phân số'],
    [/tử và mẫu của phần số/gi, 'tử và mẫu của phân số'],
    [/phần số nghịch đảo/gi, 'phân số nghịch đảo'],
    [/phần số thập phân/gi, 'phân số thập phân'],
    [/giá trị của phần số/gi, 'giá trị của phân số'],
    [/dạng phần số/gi, 'dạng phân số'],
    [/viết dưới dạng phần số/gi, 'viết dưới dạng phân số'],
    [/tập hợp các phần số/gi, 'tập hợp các phân số']
  ];

  for (const [pattern, replacement] of fractionPhrases) {
    s = s.replace(pattern, replacement as string);
  }

  s = s.replace(/\bphần số\b(?!\s*(?:học|thứ|nào|lớn|nhỏ|ít|nhiều|trên|dưới|này|kia))/gi, 'phân số');

  // 1b. Fix specific spelling errors (e.g. "tù lạnh" -> "tủ lạnh", "tù đông" -> "tủ đông")
  s = s.replace(/(?<![a-zA-ZÀ-ỹ])tù\s+lạnh(?![a-zA-ZÀ-ỹ])/gi, (m: string) => m.charAt(0) === 'T' ? (m.charAt(1) === 'Ù' ? 'TỦ LẠNH' : 'Tủ lạnh') : 'tủ lạnh');
  s = s.replace(/(?<![a-zA-ZÀ-ỹ])tu\s+lạnh(?![a-zA-ZÀ-ỹ])/gi, (m: string) => m.charAt(0) === 'T' ? (m.charAt(1) === 'U' ? 'TỦ LẠNH' : 'Tủ lạnh') : 'tủ lạnh');
  s = s.replace(/(?<![a-zA-ZÀ-ỹ])tù\s+đông(?![a-zA-ZÀ-ỹ])/gi, (m: string) => m.charAt(0) === 'T' ? (m.charAt(1) === 'Ù' ? 'TỦ ĐÔNG' : 'Tủ đông') : 'tủ đông');

  // 2. Standardize Mathematical Abbreviations: ƯC, ƯCLN, BC, BCNN
  s = s.replace(/\bước chung lớn nhất\b/gi, 'Ước chung lớn nhất');
  s = s.replace(/\bbội chung nhỏ nhất\b/gi, 'Bội chung nhỏ nhất');
  s = s.replace(/\bước chung\b/gi, 'Ước chung');
  s = s.replace(/\bbội chung\b/gi, 'Bội chung');

  s = s.replace(/\bƯcln\b|\bucln\b|\bUCLN\b/g, 'ƯCLN');
  s = s.replace(/\bBcnn\b|\bbcnn\b/g, 'BCNN');
  s = s.replace(/\bƯc\b|\buc\b(?=\s*\()/g, 'ƯC');
  s = s.replace(/\bBc\b|\bbc\b(?=\s*\()/g, 'BC');

  // 2b. Clean markdown underscores around labels that cause stray underscore artifacts (e.g. "_Nội dung:_" -> "**Nội dung:**", "_Lời giải:_" -> "**Lời giải:**")
  s = s.replace(/_(Nội\s*dung|Lời\s*giải|Gợi\s*ý|Nhận\s*xét|Ví\s*dụ|Bài\s*tập|Chú\s*ý|Mục\s*tiêu|Sản\s*phẩm|Kết\s*luận|Đáp\s*án):?_/gi, (_m, label) => `**${label}:**`);
  s = s.replace(/_([A-Za-z0-9à-ỹÀ-Ỹ\s,–—\-]{2,40})_/g, '*$1*');

  // 3. PEDAGOGICAL 4 STEPS (Chuẩn "Bước 1/2/3/4" không in hoa toàn bộ, in đậm bắt buộc 100%, nội dung sau dấu hai chấm viết hoa chữ cái đầu)
  s = s.replace(/(^|\n|\||<br\s*\/?>|\s{2,})[ \t]*\*{0,2}[ \t]*(?:Bước\s*1|BƯỚC\s*1|B1\s*[:\.]\s*(?:Giao|Chuyển))\s*[:\.]?\s*(?:Giao\s*nhiệm\s*vụ(?:\s*học\s*tập)?|Chuyển\s*giao\s*nhiệm\s*vụ(?:\s*học\s*tập)?|Nhiệm\s*vụ)?(?:\s*[:\.]|\s*\*\*)*[ \t]*/gi, (_m, lead) => `${lead || ''}**Bước 1: Giao nhiệm vụ học tập:** `);
  s = s.replace(/(^|\n|\||<br\s*\/?>|\s{2,})[ \t]*\*{0,2}[ \t]*(?:Bước\s*2|BƯỚC\s*2|B2\s*[:\.]\s*Thực\s*hiện)\s*[:\.]?\s*(?:Thực\s*hiện(?:\s*nhiệm\s*vụ)?)(?:\s*[:\.]|\s*\*\*)*[ \t]*/gi, (_m, lead) => `${lead || ''}**Bước 2: Thực hiện nhiệm vụ:** `);
  s = s.replace(/(^|\n|\||<br\s*\/?>|\s{2,})[ \t]*\*{0,2}[ \t]*(?:Bước\s*3|BƯỚC\s*3|B3\s*[:\.]\s*(?:Báo\s*cáo|Thảo\s*luận))\s*[:\.]?\s*(?:Báo\s*cáo(?:,\s*thảo\s*luận)?|Thảo\s*luận)(?:\s*[:\.]|\s*\*\*)*[ \t]*/gi, (_m, lead) => `${lead || ''}**Bước 3: Báo cáo, thảo luận:** `);
  s = s.replace(/(^|\n|\||<br\s*\/?>|\s{2,})[ \t]*\*{0,2}[ \t]*(?:Bước\s*4|BƯỚC\s*4|B4\s*[:\.]\s*(?:Kết\s*luận|Nhận\s*định))\s*[:\.]?\s*(?:Kết\s*luận(?:,\s*nhận\s*định)?|Nhận\s*định|Đánh\s*giá)(?:\s*[:\.]|\s*\*\*)*[ \t]*/gi, (_m, lead) => `${lead || ''}**Bước 4: Kết luận, nhận định:** `);

  // Clean horizontal double bold markers (never across newlines)
  s = s.replace(/\*\*[ \t]*\*\*Bước/g, '**Bước');
  s = s.replace(/\*\*[ \t]*\*\*BƯỚC/g, '**Bước');
  s = s.replace(/:\*\*[ \t]*\*\*/g, ':**');
  s = s.replace(/\*\*[ \t]*\*\*([a-zA-ZÀ-ỹ0-9])/g, '**$1');

  // 3a. STANDARDIZE ROMAN NUMERAL MAIN HEADINGS (IN HOA TOÀN BỘ VÀ IN ĐẬM)
  // "I. MỤC TIÊU" phải IN HOA, ĐẬM 100% trong mọi tình huống (bất kể có hay không có dấu hai chấm, gạch ngang, ngoặc đơn)
  s = s.replace(/(^|\n|<br\s*\/?>|\|)[ \t]*(?:#{1,4}\s*|\*{0,2})I\.\s*M[ỤÔUuô]C\s*TIÊU(?:\s*VÀ\s*YÊU\s*CẦU\s*CẦN\s*ĐẠT)?(?:\s*\([^)]*\))?[ \t]*[:\.]?[ \t]*(?:\*\*)?[ \t]*(?=\n|<br|\||$)/gmi, (_m, lead) => `${lead}**I. MỤC TIÊU**`);
  s = s.replace(/(^|\n|<br\s*\/?>|\|)[ \t]*(?:#{1,4}\s*|\*{0,2})II\.\s*THIẾT\s*BỊ(?:\s*DẠY\s*HỌC\s*(?:VÀ|&)?\s*HỌC\s*LIỆU)?(?:\s*\([^)]*\))?[ \t]*[:\.]?[ \t]*(?:\*\*)?[ \t]*(?=\n|<br|\||$)/gmi, (_m, lead) => `${lead}**II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU**`);
  s = s.replace(/(^|\n|<br\s*\/?>|\|)[ \t]*(?:#{1,4}\s*|\*{0,2})III\.\s*TIẾN\s*TRÌNH\s*DẠY\s*HỌC(?:\s*\([^)]*\))?[ \t]*[:\.]?[ \t]*(?:\*\*)?[ \t]*(?=\n|<br|\||$)/gmi, (_m, lead) => `${lead}**III. TIẾN TRÌNH DẠY HỌC**`);
  s = s.replace(/(^|\n|<br\s*\/?>|\|)[ \t]*(?:#{1,4}\s*|\*{0,2})IV\.\s*HƯỚNG\s*DẪN\s*(?:HỌC\s*SINH\s*HỌC\s*Ở\s*NHÀ|VỀ\s*NHÀ|TỰ\s*HỌC)(?:\s*\([^)]*\))?[ \t]*[:\.]?[ \t]*(?:\*\*)?[ \t]*(?=\n|<br|\||$)/gmi, (_m, lead) => `${lead}**IV. HƯỚNG DẪN VỀ NHÀ**`);
  s = s.replace(/(^|\n|<br\s*\/?>|\|)[ \t]*(?:#{1,4}\s*|\*{0,2})V\.\s*TỔNG\s*KẾT(?:\s*KIẾN\s*THỨC|\s*BÀI\s*HỌC)?(?:\s*\([^)]*\))?[ \t]*[:\.]?[ \t]*(?:\*\*)?[ \t]*(?=\n|<br|\||$)/gmi, (_m, lead) => `${lead}**V. TỔNG KẾT BÀI HỌC**`);
  s = s.replace(/(^|\n|<br\s*\/?>|\|)[ \t]*(?:#{1,4}\s*|\*{0,2})A\.\s*M[ỤÔUuô]C\s*TIÊU\s*CHUNG[^\n*|<]*[:\.]?[ \t]*(?:\*\*)?[ \t]*(?=\n|<br|\||$)/gmi, (_m, lead) => `${lead}**A. MỤC TIÊU CHUNG CỦA TOÀN BÀI HỌC:**`);
  s = s.replace(/(^|\n|<br\s*\/?>|\|)[ \t]*(?:#{1,4}\s*|\*{0,2})B\.\s*M[ỤÔUuô]C\s*TIÊU\s*(?:VÀ\s*YÊU\s*CẦU\s*CẦN\s*ĐẠT\s*)?RIÊNG[^\n*|<]*[:\.]?[ \t]*(?:\*\*)?[ \t]*(?=\n|<br|\||$)/gmi, (_m, lead) => `${lead}**B. MỤC TIÊU VÀ YÊU CẦU CẦN ĐẠT RIÊNG CHO TỪNG TIẾT HỌC:**`);

  // 3b. TIẾT X HEADERS & BANNER TOPICS: In hoa toàn bộ nội dung chủ đề và in đậm
  // Sửa triệt để lỗi thừa dấu `**` (ví dụ `TIẾT 1**: LÝ THUYẾT`)
  s = s.replace(/(?<!(?:chi|họa|thời|bài|tình)\s*)(?<![a-zA-ZÀ-ỹ])(\bTIẾT\s+\d+)\*\*:\s*/gi, '$1: ');
  s = s.replace(/(^|\n)[ \t]*(?:#{0,4}\s*)?\*{0,2}(?<!(?:chi|họa|thời|bài|tình)\s*)(?<![a-zA-ZÀ-ỹ])(TIẾT\s+\d+(?:[ \t]*[-–:][ \t]*[^\n*|<]+)?)\*{0,2}[ \t]*(?=\n|$)/gi, (m, lead, tietBody) => {
    if (/(?:bản\s*lề|vòng\s*đệm|chốt|ốc|vít|thép|nhôm|đồng|gang|nhựa|cái|chiếc|bộ\s*phận|vật\s*liệu|chi\s*tiết)/i.test(tietBody)) {
      return m;
    }
    let cleanBody = tietBody.replace(/[*#]/g, '').trim();
    // In hoa toàn bộ cụm TIẾT X: CHỦ ĐỀ
    cleanBody = cleanBody.toUpperCase();
    return `${lead}**${cleanBody}**`;
  });
  s = s.replace(/\*\*[ \t]*\*\*/g, '');

  // 3c. MỤC TIÊU RIÊNG TIẾT 1, 2... GẠCH ĐẦU DÒNG '-', CHỮ 'M' ĐẦU TIÊN IN HOA, VÀ PHÂN CẤP NỘI DUNG CON
  s = s.replace(/^[ \t]*(?:[-+*•–—]\s*)?\*{0,2}(?:mục|Mục)\s+tiêu\s+(?:riêng\s+)?Tiết\s+(\d+)\s*(\([^)]+\))?\s*[:\.]?\*{0,2}/gmi, (_m, periodNum, bracketInfo) => {
    let bracketClean = '';
    if (bracketInfo) {
      let inside = bracketInfo.replace(/[()]/g, '').trim();
      inside = inside.replace(/\bluyện\s*tập\b/gi, 'Luyện tập')
                     .replace(/\bvận\s*dụng\b/gi, 'Vận dụng')
                     .replace(/\blý\s*thuyết\b/gi, 'Lý thuyết')
                     .replace(/\bkhởi\s*động\b/gi, 'Khởi động')
                     .replace(/\bhình\s*thành\s*kiến\s*thức\b/gi, 'Hình thành kiến thức')
                     .replace(/\bbài\s*tập\b/gi, 'Bài tập');
      if (inside.length > 0) {
        inside = inside.charAt(0).toUpperCase() + inside.slice(1);
      }
      bracketClean = ` (${inside})`;
    }
    return `- **Mục tiêu riêng Tiết ${periodNum}${bracketClean}:**`;
  });

  // 4. STANDARDIZE UPPERCASE FOR ALL 4 MAIN PEDAGOGICAL ACTIVITIES (IN HOA TOÀN BỘ CỤM TỪ "HOẠT ĐỘNG ..." VÀ IN ĐẬM)
  // Xử lý mọi biến thể chữ thường/hoa: "HOẠT ĐỘNG luyện tập", "Hoạt động 3: luyện tập", "3. Hoạt động luyện tập"...
  s = s.replace(/(?:(?:1|[A-Da-d])\.\s*|Hoạt\s*động\s*1[:.]\s*)?hoạt\s*động\s*(?:1\s*[:\.]\s*)?(?:khởi\s*động|mở\s*đầu)/gi, 'HOẠT ĐỘNG KHỞI ĐỘNG');
  s = s.replace(/(?:(?:2|[B-Db-d])\.\s*|Hoạt\s*động\s*2[:.]\s*)?hoạt\s*động\s*(?:2\s*[:\.]\s*)?hình\s*thành\s*kiến\s*thức(?:\s*mới)?/gi, 'HOẠT ĐỘNG HÌNH THÀNH KIẾN THỨC MỚI');
  s = s.replace(/(?:(?:3|[C-Dc-d])\.\s*|Hoạt\s*động\s*3[:.]\s*)?hoạt\s*động\s*(?:3\s*[:\.]\s*)?(?:luyện\s*tập(?:\s*trọng\s*tâm)?|thực\s*hành)/gi, 'HOẠT ĐỘNG LUYỆN TẬP');
  s = s.replace(/(?:(?:4|[D-Dd-d])\.\s*|Hoạt\s*động\s*4[:.]\s*)?hoạt\s*động\s*(?:4\s*[:\.]\s*)?vận\s*dụng(?:\s*nâng\s*cao)?/gi, 'HOẠT ĐỘNG VẬN DỤNG');
  s = s.replace(/(?:(?:5|[E-Ee-e])\.\s*|Hoạt\s*động\s*5[:.]\s*)?hoạt\s*động\s*(?:5\s*[:\.]\s*)?tìm\s*tòi(?:,\s*|\s+)mở\s*rộng/gi, 'HOẠT ĐỘNG TÌM TÒI, MỞ RỘNG');

  // Xử lý trường hợp "HOẠT ĐỘNG luyện tập" hoặc "HOẠT ĐỘNG vận dụng" đứng riêng lẻ
  s = s.replace(/HOẠT\s*ĐỘNG\s+luyện\s+tập/gi, 'HOẠT ĐỘNG LUYỆN TẬP');
  s = s.replace(/HOẠT\s*ĐỘNG\s+khởi\s+động/gi, 'HOẠT ĐỘNG KHỞI ĐỘNG');
  s = s.replace(/HOẠT\s*ĐỘNG\s+hình\s+thành\s+kiến\s+thức(?:\s+mới)?/gi, 'HOẠT ĐỘNG HÌNH THÀNH KIẾN THỨC MỚI');
  s = s.replace(/HOẠT\s*ĐỘNG\s+vận\s+dụng/gi, 'HOẠT ĐỘNG VẬN DỤNG');
  s = s.replace(/HOẠT\s*ĐỘNG\s+tìm\s+tòi(?:,\s*|\s+)mở\s+rộng/gi, 'HOẠT ĐỘNG TÌM TÒI, MỞ RỘNG');

  // Standardize numbered headings with timing (ensure chữ HOẠT ĐỘNG luôn viết HOA và IN ĐẬM)
  // 1. HOẠT ĐỘNG KHỞI ĐỘNG
  s = s.replace(/(^|\n|\||<br\s*\/?>|\s{2,})[ \t]*\*{0,2}[ \t]*(?:(?:1|[A-Da-d])\.\s*|1\s*[:\.]\s*|Hoạt\s*động\s*1[:\.]\s*)?HOẠT\s*ĐỘNG\s*KHỞI\s*ĐỘNG(?:\s*\(([^)]+)\))?[ \t]*\*{0,2}/gi, (_match, prefix, time) => {
    const timeStr = time ? ` (${time.trim()})` : '';
    const lead = prefix === '|' ? '| ' : (prefix || '');
    return `${lead}**1. HOẠT ĐỘNG KHỞI ĐỘNG${timeStr}**`;
  });
  // 2. HOẠT ĐỘNG HÌNH THÀNH KIẾN THỨC MỚI
  s = s.replace(/(^|\n|\||<br\s*\/?>|\s{2,})[ \t]*\*{0,2}[ \t]*(?:(?:2|[B-Db-d])\.\s*|2\s*[:\.]\s*|Hoạt\s*động\s*2[:\.]\s*)?HOẠT\s*ĐỘNG\s*HÌNH\s*THÀNH\s*KIẾN\s*THỨC(?:\s*MỚI)?(?:\s*\(([^)]+)\))?[ \t]*\*{0,2}/gi, (_match, prefix, time) => {
    const timeStr = time ? ` (${time.trim()})` : '';
    const lead = prefix === '|' ? '| ' : (prefix || '');
    return `${lead}**2. HOẠT ĐỘNG HÌNH THÀNH KIẾN THỨC MỚI${timeStr}**`;
  });
  // 3. HOẠT ĐỘNG LUYỆN TẬP
  s = s.replace(/(^|\n|\||<br\s*\/?>|\s{2,})[ \t]*\*{0,2}[ \t]*(?:(?:3|[C-Dc-d])\.\s*|3\s*[:\.]\s*|Hoạt\s*động\s*3[:\.]\s*)?HOẠT\s*ĐỘNG\s*LUYỆN\s*TẬP(?:\s*\(([^)]+)\))?[ \t]*\*{0,2}/gi, (_match, prefix, time) => {
    const timeStr = time ? ` (${time.trim()})` : '';
    const lead = prefix === '|' ? '| ' : (prefix || '');
    return `${lead}**3. HOẠT ĐỘNG LUYỆN TẬP${timeStr}**`;
  });
  // 4. HOẠT ĐỘNG VẬN DỤNG
  s = s.replace(/(^|\n|\||<br\s*\/?>|\s{2,})[ \t]*\*{0,2}[ \t]*(?:(?:4|[D-Dd-d])\.\s*|4\s*[:\.]\s*|Hoạt\s*động\s*4[:\.]\s*)?HOẠT\s*ĐỘNG\s*VẬN\s*DỤNG(?:\s*\(([^)]+)\))?[ \t]*\*{0,2}/gi, (_match, prefix, time) => {
    const timeStr = time ? ` (${time.trim()})` : '';
    const lead = prefix === '|' ? '| ' : (prefix || '');
    return `${lead}**4. HOẠT ĐỘNG VẬN DỤNG${timeStr}**`;
  });
  // 5. HOẠT ĐỘNG TÌM TÒI, MỞ RỘNG
  s = s.replace(/(^|\n|\||<br\s*\/?>|\s{2,})[ \t]*\*{0,2}[ \t]*(?:(?:5|[E-Ee-e])\.\s*|5\s*[:\.]\s*|Hoạt\s*động\s*5[:\.]\s*)?HOẠT\s*ĐỘNG\s*TÌM\s*TÒI(?:,\s*|\s+)MỞ\s*RỘNG(?:\s*\(([^)]+)\))?[ \t]*\*{0,2}/gi, (_match, prefix, time) => {
    const timeStr = time ? ` (${time.trim()})` : '';
    const lead = prefix === '|' ? '| ' : (prefix || '');
    return `${lead}**5. HOẠT ĐỘNG TÌM TÒI, MỞ RỘNG${timeStr}**`;
  });

  // 4b. CỘT 2 / ĐỀ MỤC SẢN PHẨM & TOÀN BỘ GIÁO ÁN: In đậm 100% các đề mục 1., 2., 3., 4... (ví dụ: **1. Khởi động:**, **1. Mở đầu...:**, **2. Hình thành kiến thức:**, **3. Luyện tập:**, **4. Vận dụng:**)
  // Section I headings
  s = s.replace(/(^|\n|\||<br\s*\/?>|\s{2,})[ \t]*\*{0,2}(1\.\s*(?:(?:Về\s*)?Kiến\s*thức|(?:VỀ\s*)?KIẾN\s*THỨC)[^:\n*|<]*?)(?:\s*[:\.]|\s*\*\*)*[ \t]*/gi, (_m, lead, title) => `${lead || ''}**${title.trim()}:** `);
  s = s.replace(/(^|\n|\||<br\s*\/?>|\s{2,})[ \t]*\*{0,2}(2\.\s*(?:(?:Về\s*)?Năng\s*lực|(?:VỀ\s*)?NĂNG\s*LỰC)[^:\n*|<]*?)(?:\s*[:\.]|\s*\*\*)*[ \t]*/gi, (_m, lead, title) => `${lead || ''}**${title.trim()}:** `);
  s = s.replace(/(^|\n|\||<br\s*\/?>|\s{2,})[ \t]*\*{0,2}(3\.\s*(?:(?:Về\s*)?Phẩm\s*chất|(?:VỀ\s*)?PHẨM\s*CHẤT)[^:\n*|<]*?)(?:\s*[:\.]|\s*\*\*)*[ \t]*/gi, (_m, lead, title) => `${lead || ''}**${title.trim()}:** `);

  // Section II headings
  s = s.replace(/(^|\n|\||<br\s*\/?>|\s{2,})[ \t]*\*{0,2}(1\.\s*(?:(?:Về\s*|Đối\s*với\s*)?(?:GIÁO\s*VIÊN|Giáo\s*viên|THẦY\s*CÔ|Thầy\s*cô))[^:\n*|<]*?)(?:\s*[:\.]|\s*\*\*)*[ \t]*/gi, (_m, lead, title) => `${lead || ''}**${title.trim()}:** `);
  s = s.replace(/(^|\n|\||<br\s*\/?>|\s{2,})[ \t]*\*{0,2}(2\.\s*(?:(?:Về\s*|Đối\s*với\s*)?(?:HỌC\s*SINH|Học\s*sinh|HS))[^:\n*|<]*?)(?:\s*[:\.]|\s*\*\*)*[ \t]*/gi, (_m, lead, title) => `${lead || ''}**${title.trim()}:** `);

  // Column 2 activity headings
  s = s.replace(/(^|\n|\||<br\s*\/?>|\s{2,})[ \t]*\*{0,2}(1\.\s*(?:Khởi\s*động|Mở\s*đầu)[^:\n*|<]*?)(?:\s*[:\.]|\s*\*\*)*[ \t]*/gi, (_m, lead, title) => `${lead || ''}**${title.trim()}:** `);
  s = s.replace(/(^|\n|\||<br\s*\/?>|\s{2,})[ \t]*\*{0,2}(2\.\s*(?:Hình\s*thành\s*kiến\s*thức(?:\s*mới)?|Kiến\s*thức(?:\s*mới)?|Khám\s*phá)[^:\n*|<]*?)(?:\s*[:\.]|\s*\*\*)*[ \t]*/gi, (_m, lead, title) => `${lead || ''}**${title.trim()}:** `);
  s = s.replace(/(^|\n|\||<br\s*\/?>|\s{2,})[ \t]*\*{0,2}(3\.\s*(?:Luyện\s*tập|Thực\s*hành)[^:\n*|<]*?)(?:\s*[:\.]|\s*\*\*)*[ \t]*/gi, (_m, lead, title) => `${lead || ''}**${title.trim()}:** `);
  s = s.replace(/(^|\n|\||<br\s*\/?>|\s{2,})[ \t]*\*{0,2}(4\.\s*(?:Vận\s*dụng(?:\s*nâng\s*cao)?)[^:\n*|<]*?)(?:\s*[:\.]|\s*\*\*)*[ \t]*/gi, (_m, lead, title) => `${lead || ''}**${title.trim()}:** `);
  s = s.replace(/(^|\n|\||<br\s*\/?>|\s{2,})[ \t]*\*{0,2}(5\.\s*(?:Tìm\s*tòi|Mở\s*rộng)[^:\n*|<]*?)(?:\s*[:\.]|\s*\*\*)*[ \t]*/gi, (_m, lead, title) => `${lead || ''}**${title.trim()}:** `);

  // In đậm các đề mục số thứ tự có dấu hai chấm: "1. Khái niệm đơn thức:", "2. Đơn thức thu gọn:", "1. Trắc nghiệm:", "2. Tự luận:"...
  s = s.replace(/(^|\n|\||<br\s*\/?>|\s{2,})[ \t]*\*{0,2}(\d+(?:\.\d+)*\.\s+[A-Za-zÀ-ỹ0-9\s,–—\-]{2,60}?)(?:\s*[:\.]|\s*\*\*)*:\s*(?:\*\*)?[ \t]*/g, (_m, lead, title) => {
    return `${lead || ''}**${title.trim()}:** `;
  });

  // In đậm các đề mục số thứ tự không có dấu hai chấm đứng riêng dòng hoặc đầu câu
  s = s.replace(/(^|\n|\||<br\s*\/?>)[ \t]*\*{0,2}(\d+(?:\.\d+)*\.\s+(?!(?:Cho|Hãy|Tính|Tìm|Giải|Chứng\s*minh|Trong\s*các|Học\s*sinh|Giáo\s*viên\s*yêu\s*cầu|Điền|Vẽ|So\s*sánh|Rút\s*gọn|Nếu|Biết\s*rằng)\b)[A-Za-zÀ-ỹ0-9\s,–—\-]{2,50}?)(?:\*\*)?[ \t]*(?=\n|\||<br|$)/g, (_m, lead, title) => {
    return `${lead || ''}**${title.trim()}:** `;
  });

  // In đậm các đề mục chữ cái con: a) Khái niệm:, b) Ví dụ:, a) Mục tiêu:, b) Nội dung:, c) Sản phẩm:, d) Tổ chức thực hiện:...
  s = s.replace(/(^|\n|\||<br\s*\/?>|\s{2,})[ \t]*\*{0,2}([a-d]\)\s+[A-Za-zÀ-ỹ0-9\s,–—\-]{2,50}?)(?:\s*[:\.]|\s*\*\*)*:\s*(?:\*\*)?[ \t]*/gi, (_m, lead, title) => {
    return `${lead || ''}**${title.trim()}:** `;
  });
  s = s.replace(/(^|\n|\||<br\s*\/?>)[ \t]*\*{0,2}([a-d]\)\s+(?:Khái\s*niệm|Định\s*nghĩa|Quy\s*tắc|Tính\s*chất|Ví\s*dụ|Luyện\s*tập|Vận\s*dụng|Chú\s*ý|Nhận\s*xét|Mục\s*tiêu|Nội\s*dung|Sản\s*phẩm|Tổ\s*chức\s*thực\s*hiện)[^:\n*|<]*?)(?:\*\*)?[ \t]*(?=\n|\||<br|$)/gi, (_m, lead, title) => {
    return `${lead || ''}**${title.trim()}:** `;
  });

  // In đậm 4 bước tổ chức thực hiện chuẩn 5512
  s = s.replace(/(^|\n|\||<br\s*\/?>|\s{2,})[ \t]*\*{0,2}(Bước\s*[1-4][:.]\s*[^:\n*|<]+?)(?:\s*[:\.]|\s*\*\*)*:\s*(?:\*\*)?[ \t]*/gi, (_m, lead, title) => {
    return `${lead || ''}**${title.trim()}:** `;
  });

  // In đậm các nhãn sư phạm: Hoạt động 1:, Nhiệm vụ 1:, Ví dụ 1:, Luyện tập 1:, Vận dụng 1:, Bài tập 1:, Bài 1:, Câu 1:, Dạng 1:...
  s = s.replace(/(^|\n|\||<br\s*\/?>|\s{2,})[ \t]*\*{0,2}((?:Hoạt\s*động|Nhiệm\s*vụ|Ví\s*dụ|Luyện\s*tập|Vận\s*dụng|Bài\s*tập|Bài|Thử\s*thách(?:\s*nhỏ)?|Tranh\s*luận|Khám\s*phá|Ghi\s*nhớ|Nhận\s*xét|Chú\s*ý|Định\s*nghĩa|Quy\s*tắc|Tính\s*chất|Công\s*thức|Lời\s*giải|Câu|Dạng)\s*(?:\d+(?:\.\d+)*[a-z]?)?)(?:\s*[:\.]|\s*\*\*)*:\s*(?:\*\*)?[ \t]*/gi, (_m, lead, label) => {
    return `${lead || ''}**${label.trim()}:** `;
  });

  // In đậm các nhãn bài tập nâng cao và hướng dẫn
  s = s.replace(/(^|\n|\||<br\s*\/?>|\s{2,})[ \t]*\*{0,2}((?:Bài\s*tập\s*khó\s*phát\s*triển\s*tư\s*duy|Bài\s*tập\s*nâng\s*cao|Gợi\s*ý\s*phương\s*pháp\s*giải|Phương\s*pháp\s*giải|Bài\s*toán|Nhiệm\s*vụ\s*AI|Chuẩn\s*bị\s*bài\s*(?:sau|mới)|Ôn\s*tập\s*lý\s*thuyết))(?:\s*[:\.]|\s*\*\*)*:\s*(?:\*\*)?[ \t]*/gi, (_m, lead, label) => {
    return `${lead || ''}**${label.trim()}:** `;
  });

  // Dọn dẹp dòng chỉ có dấu thăng '#' rác (như ### đứng một mình)
  s = s.replace(/^[ \t]*#{1,6}[ \t]*$/gm, '');

  // Dọn dẹp dòng rác chỉ có '>' hoặc '<br>'
  s = s.replace(/^[ \t]*[><\s]+$/gm, '');
  s = s.replace(/^(?:<br\s*\/?>|<\/br>|<br>|<br|\s)+$/gim, '');

  // Dọn dẹp triệt để các dấu hai chấm thừa, lặp lại (Ví dụ: : :, **Ví dụ:** : :, :::)
  s = s.replace(/\*\*([^*]+:)\*\*\s*:+/g, '**$1** ');
  s = s.replace(/(?::\s*){2,}/g, ': ');
  s = s.replace(/:\s*:+/g, ':');
  s = s.replace(/([a-zA-ZÀ-ỹ0-9]):\s*:\s*/g, '$1: ');

  // Chuẩn hóa chữ hoa thường cơ bản cho các từ mục tiêu
  s = s.replace(/\b(\d+\.)\s*luyện\s*tập\b/gi, '$1 Luyện tập');
  s = s.replace(/\b(\d+\.)\s*vận\s*dụng\b/gi, '$1 Vận dụng');
  s = s.replace(/\b(\d+\.)\s*khởi\s*động\b/gi, '$1 Khởi động');
  s = s.replace(/\b(\d+\.)\s*hình\s*thành\s*kiến\s*thức\b/gi, '$1 Hình thành kiến thức');
  s = s.replace(/\b(\d+\.)\s*kiến\s*thức\b/gi, '$1 Kiến thức');
  s = s.replace(/\b(\d+\.)\s*kết\s*luận\b/gi, '$1 Kết luận');
  s = s.replace(/\b(\d+\.)\s*bài\s*tập\b/gi, '$1 Bài tập');
  s = s.replace(/\b(\d+\.)\s*ví\s*dụ\b/gi, '$1 Ví dụ');

  // 4c. REPAIR CORRUPTED OR DEVIATED CV 5512 TABLES ACROSS ALL PERIODS
  if (/(?:hoạt\s*động\s*của\s*gv|tiến\s*trình\s*dạy\s*học|dự\s*kiến\s*sản\s*phẩm|kế\s*hoạch\s*bài\s*dạy)/i.test(s)) {
    s = repairAllLessonPlanTables(s);
  }

  // 4d. CLEAN ANY REPEATED OR NESTED BULLET MARKERS (- -, - +, - *, - **- etc.)
  s = s.replace(/^[ \t]*([-+*•–—])[ \t]+[-+*•–—][ \t]+/gm, '$1 ');
  s = s.replace(/^[ \t]*[-+*•–—][ \t]*\*\*[ \t]*[-+*•–—][ \t]*/gm, '- **');
  s = s.replace(/^[ \t]*[-+*•–—][ \t]+[-+*•–—][ \t]+\*\*/gm, '- **');

  // 5. NĂNG LỰC SỐ, NĂNG LỰC AI: IN ĐẬM DUY NHẤT DÒNG ĐỀ MỤC CHÍNH, KHÔNG IN ĐẬM CÁC DÒNG NỘI DUNG TIÊU CHÍ CON BÊN DƯỚI
  s = s.replace(/^[ \t]*(?:[-+*•–—]\s*){1,3}(?:\*\*)?(?:[-+*•–—]\s*)?Năng\s+lực\s+chung(?:\*\*)?[ \t]*:?[ \t]*(?:\*\*)?/gmi, '- **Năng lực chung:**');
  s = s.replace(/^[ \t]*(?:[-+*•–—]\s*){1,3}(?:\*\*)?(?:[-+*•–—]\s*)?Năng\s+lực\s+đặc\s+thù(?:\*\*)?[ \t]*:?[ \t]*(?:\*\*)?/gmi, '- **Năng lực đặc thù:**');
  s = s.replace(/^[ \t]*(?:[-+*•–—]\s*){1,3}(?:\*\*)?(?:[-+*•–—]\s*)?Năng\s+lực\s+số(?:\*\*)?[ \t]*(?:\(([^)]+)\))?[ \t]*(?:\*\*)?:?[ \t]*(?:\*\*)?/gmi, (_m, sub) => {
    const docRef = sub ? ` (${sub.trim()})` : ' (TT 02/2025/TT-BGDĐT)';
    return `- **Năng lực số${docRef}:**`;
  });
  s = s.replace(/^[ \t]*(?:[-+*•–—]\s*){1,3}(?:\*\*)?(?:[-+*•–—]\s*)?Năng\s+lực\s+AI(?:\*\*)?[ \t]*(?:\(([^)]+)\))?[ \t]*(?:\*\*)?:?[ \t]*(?:\*\*)?/gmi, (_m, sub) => {
    const docRef = sub ? ` (${sub.trim()})` : ' (QĐ 2422/QĐ-BGDĐT)';
    return `- **Năng lực AI${docRef}:**`;
  });

  // Unbold any bolded child criteria/indicators under Năng lực (e.g. "+ **1.1TC1b: ...**" -> "+ 1.1TC1b: ...")
  s = s.replace(/^[ \t]*([+*•–—]|\d+\.\d+TC\w*)[ \t]*\*\*([^*]+)\*\*/gm, '$1 $2');
  s = s.replace(/^[ \t]*\*\*([+*•–—]|\d+\.\d+TC\w*)[ \t]*([^*]+)\*\*/gm, '$1 $2');

  // 5b. FORMAT INLINE "+" SIGNS: In table rows, MUST use <br>+ to prevent row splitting and column shifting!
  const textLines = s.split('\n');
  s = textLines.map(line => {
    const isTableRow = line.trim().startsWith('|') && line.trim().endsWith('|');
    if (isTableRow) {
      return line
        .replace(/\s*,\s*\+\s*/g, ' <br>+ ')
        .replace(/\s*\+\s+(?=Tự chủ|Giao tiếp|Giải quyết|Năng lực tư duy|Năng lực mô hình|Năng lực giải quyết|Năng lực giao tiếp|Năng lực công cụ|\d\.\d+TC)/gi, ' <br>+ ');
    }
    return line
      .replace(/([^\n])\s*,\s*\+\s*/g, '$1\n+ ')
      .replace(/([^\n])\s*\+\s+(?=Tự chủ|Giao tiếp|Giải quyết|Năng lực tư duy|Năng lực mô hình|Năng lực giải quyết|Năng lực giao tiếp|Năng lực công cụ|\d\.\d+TC)/gi, '$1\n+ ');
  }).join('\n');

  // 6. HƯỚNG DẪN VỀ NHÀ: THAY 1,2,3... BẰNG GẠCH ĐẦU DÒNG VÀ KHÔNG IN ĐẬM
  const hwSectionRegex = /((\*{0,2}(?:HƯỚNG\s*DẪN\s*(?:HỌC\s*)?VỀ\s*NHÀ|DẶN\s*DÒ\s*VỀ\s*NHÀ|HƯỚNG\s*DẪN\s*HỌC\s*SINH\s*HỌC\s*Ở\s*NHÀ)[^\n]*\*{0,2})([\s\S]*?)(?=(?:\n\s*#{1,4}|\n\s*\||\n\s*\*{2}[A-Z]|\n\s*DUYỆT\s*CỦA|$)))/gi;
  s = s.replace(hwSectionRegex, (_full, _titleLine, title, hwBody) => {
    let cleanHwBody = hwBody;
    cleanHwBody = cleanHwBody.replace(/^[ \t]*(?:\*\*)?\d+[.)][ \t]*(?:\*\*)?/gm, '- ');
    cleanHwBody = cleanHwBody.replace(/^[ \t]*-[ \t]*\*\*([^*]+)\*\*/gm, '- $1');
    return `${title}${cleanHwBody}`;
  });

  // 7. Banned "máy chiếu" -> "máy tính, tivi kết nối internet"
  s = s.replace(/máy chiếu\s*(?:projector)?/gi, 'máy tính, tivi');
  s = s.replace(/Máy chiếu\s*(?:projector)?/gi, 'Máy tính, tivi');

  // 8. BỎ HOÀN TOÀN "(Ký và ghi rõ họ tên)", IN ĐẬM TIÊU ĐỀ BẢNG KÝ DUYỆT
  s = s.replace(/^[ \t]*\*?\(?\s*Ký\s*(?:và|,)\s*ghi\s*rõ\s*họ\s*tên\s*\)?\*?[ \t]*$/gmi, '');
  s = s.replace(/<br\s*\/?>\s*\*?\(?\s*Ký\s*(?:và|,)\s*ghi\s*rõ\s*họ\s*tên\s*\)?\*?\s*<br\s*\/?>/gi, '<br><br>');
  s = s.replace(/\*?\(?\s*Ký\s*(?:và|,)\s*ghi\s*rõ\s*họ\s*tên\s*\)?\*?/gi, '');
  s = s.replace(/\*?\(?\s*Ký\s*(?:và|,)\s*đóng\s*dấu\s*\)?\*?/gi, '');

  // Bold signature table headers
  s = s.replace(/\|[ \t]*(?:\*\*)?DUYỆT\s*CỦA\s*BAN\s*GIÁM\s*HIỆU(?:\*\*)?[ \t]*\|[ \t]*(?:\*\*)?DUYỆT\s*CỦA\s*TỔ\s*CHUYÊN\s*MÔN(?:\*\*)?[ \t]*\|/gi, '| **DUYỆT CỦA BAN GIÁM HIỆU** | **DUYỆT CỦA TỔ CHUYÊN MÔN** |');
  s = s.replace(/\|[ \t]*(?:\*\*)?DUYỆT\s*CỦA\s*BGH(?:\*\*)?[ \t]*\|[ \t]*(?:\*\*)?TỔ\s*TRƯỞNG\s*CHUYÊN\s*MÔN(?:\*\*)?[ \t]*\|/gi, '| **DUYỆT CỦA BAN GIÁM HIỆU** | **DUYỆT CỦA TỔ CHUYÊN MÔN** |');

  // 9. CONTEXT-AWARE CAPITALIZATION:
  // - Chữ sau dấu chấm đề mục "1. ", "2. ", "a. ", "b) ", sau gạch đầu dòng "- ", "+ ", sau "Hoạt động X: ", "Luyện tập X: " chữ cái đầu tiên luôn được VIẾT HOA
  s = s.replace(/(^|\n|<br\s*\/?>|\||\s{2,})([ \t]*\*{0,2}(?:\d+|[a-zA-Z]|[I|V|X]+)[.)][ \t]*\*{0,2})([a-zà-ỹ])/g, (_m, lead, prefix, char) => {
    return `${lead}${prefix}${char.toUpperCase()}`;
  });
  // Gạch đầu dòng: "- thực hiện..." -> "- Thực hiện...", "- học sinh..." -> "- Học sinh..."
  // Never capitalize single math variables (e.g. "- x = 2", "- a, b, c", "- y^2")
  s = s.replace(/(^|\n|<br\s*\/?>|\||\s{2,})([ \t]*[-+*•–—][ \t]+)([a-zà-ỹ]{2,})/g, (_m, lead, prefix, word) => {
    return `${lead}${prefix}${word.charAt(0).toUpperCase() + word.slice(1)}`;
  });
  s = s.replace(/(^|\n|<br\s*\/?>|\||\s{2,})([ \t]*\*{0,2}Hoạt\s*động\s*\d+\s*[:\.]\s*\*{0,2})([a-zà-ỹ])/gi, (_m, lead, prefix, char) => {
    return `${lead}${prefix}${char.toUpperCase()}`;
  });
  // Capitalize word immediately following a colon or bolded colon (e.g. ": luyện tập" -> ": Luyện tập", ": thực hiện" -> ": Thực hiện", ": giao nhiệm vụ" -> ": Giao nhiệm vụ")
  // Never capitalize single math variables (e.g. ": x = 2", ": y = 1/2")
  s = s.replace(/(:\s*\*{0,2}[ \t]*)([a-zà-ỹ]{2,})/g, (_m, prefix, word) => {
    return `${prefix}${word.charAt(0).toUpperCase() + word.slice(1)}`;
  });
  // Capitalize pedagogical word immediately following opening parenthesis (e.g. "(luyện tập" -> "(Luyện tập", "(vận dụng" -> "(Vận dụng", "(ghi chú" -> "(Ghi chú")
  // NEVER capitalize math variables or math expressions (e.g. (x \cdot x^2) must remain (x \cdot x^2), (y \cdot y^3) must remain (y \cdot y^3))
  s = s.replace(/(\(\s*)([a-zà-ỹ]{3,})/g, (_m, prefix, word) => {
    const lower = word.toLowerCase();
    if (/^(?:luyện|vận|ghi|hình|học|giáo|hoạt|chú|xem|tham|phiếu|thực|bài|ví|bước|theo|dành)/i.test(lower)) {
      return `${prefix}${word.charAt(0).toUpperCase() + word.slice(1)}`;
    }
    return `${prefix}${word}`;
  });
  // Khôi phục các bài tập bị phân tách lỗi như "**Bài 1:** 1 (SGK...)" -> "**Bài 1.1:** (SGK...)"
  s = s.replace(/\*\*(Bài|Ví dụ|Luyện tập|Vận dụng|Bài tập)\s*(\d+):\*\*\s*(\d+)\b/gi, '**$1 $2.$3:**');
  s = s.replace(/\b(Bài|Ví dụ|Luyện tập|Vận dụng|Bài tập)\s*(\d+)\s*:\s*(\d+)\b/gi, '$1 $2.$3:');

  // Standardize standalone numbered sub-activities & exercise titles (Luyện tập 1, Vận dụng 2, Ví dụ 3, Bài tập 4, Bài 1.1, Bài 1.2...)
  s = s.replace(/(^|\n|<br\s*\/?>|\||\s{2,}|[-+*•–—][ \t]+)\*{0,2}((?:luyện\s*tập|vận\s*dụng|ví\s*dụ|bài\s*tập|bài|khám\s*phá|trải\s*nghiệm|thực\s*hành)\s*(\d+(?:\.\d+)*))(?:\s*[:]|(?!\.\d)\s*\.|\s*\*\*)*([ \t]*:)?/gi, (_m, lead, _title, num) => {
    const term = _m.trim().toLowerCase();
    let termName = 'Luyện tập';
    if (term.includes('vận dụng')) termName = 'Vận dụng';
    else if (term.includes('ví dụ')) termName = 'Ví dụ';
    else if (term.includes('bài tập')) termName = 'Bài tập';
    else if (term.includes('khám phá')) termName = 'Khám phá';
    else if (term.includes('trải nghiệm')) termName = 'Trải nghiệm';
    else if (term.includes('thực hành')) termName = 'Thực hành';
    else if (term.includes('bài')) termName = 'Bài';
    return `${lead}**${termName} ${num}:** `;
  });

  // 9b. HIERARCHICAL INDENTATION & BULLET REPAIR FOR SUB-GOALS UNDER "MỤC TIÊU RIÊNG TIẾT X"
  const linesArr = s.split('\n');
  let inPeriodGoalsSection = false;
  for (let idx = 0; idx < linesArr.length; idx++) {
    const l = linesArr[idx];
    if (/^[ \t]*-[ \t]*\*\*Mục\s*tiêu\s*riêng\s*Tiết\s*\d+/i.test(l)) {
      inPeriodGoalsSection = true;
      continue;
    }
    if (inPeriodGoalsSection) {
      if (/^[ \t]*(?:\*{0,2}[I|V|X]+\.|\*{0,2}[A-Z]\.|\*{0,2}\d+\.|\#{1,4}|\|)/i.test(l) && !/^[ \t]*[-+*•–—]/i.test(l)) {
        inPeriodGoalsSection = false;
      } else if (/^[ \t]*[-*•–—]\s+(?!\*\*Mục\s*tiêu\s*riêng)/i.test(l)) {
        linesArr[idx] = l.replace(/^[ \t]*[-*•–—]\s+([a-zà-ỹ]?)/i, (_match, firstChar) => {
          return `  + ${(firstChar || '').toUpperCase()}`;
        });
      } else if (/^[ \t]*\+\s+/i.test(l)) {
        linesArr[idx] = l.replace(/^[ \t]*\+\s+([a-zà-ỹ]?)/i, (_match, firstChar) => {
          return `  + ${(firstChar || '').toUpperCase()}`;
        });
      }
    }
  }
  s = linesArr.join('\n');

  // 10. AUTO-REPAIR SET NOTATION MISSING OPENING BRACE `{` (e.g. `L = N; H; A; T; R; A; N; G}` -> `L = {N; H; A; T; R; A; N; G}`)
  s = s.replace(/(^|[\s\n|>$\(,])([A-Za-z0-9_'\*]+)\s*=\s*(?!\s*\{)([^{}\n=$;]+;[^{}\n=$]*)\}/g, (_m, lead, setName, elements) => {
    return `${lead}${setName} = {${elements.trim()}}`;
  });

  // 11. CLEAN ANY CONTINUATION ARTIFACTS (e.g. "Tiếp tục ở Tiết 2...", "(Còn tiếp...)")
  s = s.replace(/(?:\n\s*)*\**\s*\(?\s*Tiếp tục ở Tiết\s*\d+[^)\n]*\)?\**\s*$/gim, '');
  s = s.replace(/(?:\n\s*)*\**\s*\(?\s*Còn tiếp[^)\n]*\)?\**\s*$/gim, '');
  s = s.replace(/(?:\n\s*)*\**\s*\(?\s*Hết tiết\s*\d+[^)\n]*\)?\**\s*$/gim, '');

  // 12. FIX COMMON GLUED WORDS & SPELLING TYPOS
  const gluedWords = [
    [/\bphiếu\s+lưu\b/gi, 'phiêu lưu'],
    [/\bPhiếu\s+lưu\b/g, 'Phiêu lưu'],
    [/\bPHIẾU\s+LƯU\b/g, 'PHIÊU LƯU'],
    [/\bv[íiì]\s*d[ụu]c\b/gi, 'ví dụ'],
    [/\bki[ểe]m\s+ta\b/gi, 'kiểm tra'],
    [/\bs[ửu]\s*l[ýyí]\b/gi, 'xử lý'],
    [/\bchiahết\b/gi, 'chia hết'],
    [/\bliệtkê\b/gi, 'liệt kê'],
    [/\bkhôngthuộc\b/gi, 'không thuộc'],
    [/\bthayvào\b/gi, 'thay vào'],
    [/\bhànhtinh\b/gi, 'hành tinh'],
    [/\bhệmặttrời\b/gi, 'Hệ Mặt Trời'],
    [/\bHệmặttrời\b/gi, 'Hệ Mặt Trời'],
    [/\btậphợp\b/gi, 'tập hợp'],
    [/\bphầntử\b/gi, 'phần tử'],
    [/\bướcchung\b/gi, 'ước chung'],
    [/\bbộichung\b/gi, 'bội chung'],
    [/\bgiáotrình\b/gi, 'giáo trình'],
    [/\bsáchgiáokhoa\b/gi, 'sách giáo khoa'],
    [/\bkếhoạch\b/gi, 'kế hoạch'],
    [/\bhoạtđộng\b/gi, 'hoạt động'],
    [/\bhọcsinh\b/gi, 'học sinh'],
    [/\bgiáoviên\b/gi, 'giáo viên'],
    [/\bluyệntập\b/gi, 'luyện tập'],
    [/\bvậndụng\b/gi, 'vận dụng'],
    [/\bkhởiđộng\b/gi, 'khởi động'],
    [/\bmụctiêu\b/gi, 'mục tiêu'],
    [/\bkĩthuật\b/gi, 'kĩ thuật'],
    [/\bkỹthuật\b/gi, 'kỹ thuật'],
    [/\bphươngpháp\b/gi, 'phương pháp'],
    [/\bdạyhọc\b/gi, 'dạy học'],
    [/\bhọcliệu\b/gi, 'học liệu'],
    [/\btựhọc\b/gi, 'tự học'],
    [/\btàiliệu\b/gi, 'tài liệu'],
    [/\bphiếuhọctập\b/gi, 'phiếu học tập'],
    [/\bkhăntrảibàn\b/gi, 'khăn trải bàn'],
    [/\bmảnhghép\b/gi, 'mảnh ghép'],
    [/\bphòngtranh\b/gi, 'phòng tranh'],
    [/\bsơđồtưduy\b/gi, 'sơ đồ tư duy'],
    [/\btiêuchí\b/gi, 'tiêu chí'],
    [/\bđánhgiá\b/gi, 'đánh giá'],
    [/\bchúý\b/gi, 'chú ý'],
    [/\bhướngdẫn\b/gi, 'hướng dẫn'],
    [/\blờigiải\b/gi, 'lời giải'],
    [/\bcôngthức\b/gi, 'công thức'],
    [/\bkịchbản\b/gi, 'kịch bản'],
    [/\bthuyếttrình\b/gi, 'thuyết trình'],
    [/\bchuẩnbị\b/gi, 'chuẩn bị'],
    [/\bthảo\s*luận\b/gi, 'thảo luận'],
    [/\bbáo\s*cáo\b/gi, 'báo cáo'],
    [/\bnhận\s*định\b/gi, 'nhận định'],
    [/\bkết\s*luận\b/gi, 'kết luận'],
    [/\bkếtừng\b/gi, 'kể từng'],
    [/\bkểtừng\b/gi, 'kể từng'],
    [/\bkêtừng\b/gi, 'kê từng'],
    [/\bkếtquạtừng\b/gi, 'kết quả từng'],
    [/\bliệtkêtừng\b/gi, 'liệt kê từng'],
    [/\btừngphầntử\b/gi, 'từng phần tử'],
    [/\btừngbước\b/gi, 'từng bước'],
    [/\btừngnhóm\b/gi, 'từng nhóm'],
    [/\btừngcánhân\b/gi, 'từng cá nhân'],
    [/\btừngtiết\b/gi, 'từng tiết'],
    [/\btừngphần\b/gi, 'từng phần'],
    [/\btừnghọc\b/gi, 'từng học'],
    [/\btừngem\b/gi, 'từng em'],
    [/\btừngcâu\b/gi, 'từng câu'],
    [/\bkếtquả\b/gi, 'kết quả'],
    [/\bkếthợp\b/gi, 'kết hợp'],
    [/\bkếthừa\b/gi, 'kế thừa'],
    [/\bkếtiếp\b/gi, 'kế tiếp'],
    [/\bkếtthúc\b/gi, 'kết thúc'],
    [/\bkếhoạch\b/gi, 'kế hoạch'],
    [/\bkếtchặt\b/gi, 'kết chặt'],
    [/\bkếtnối\b/gi, 'kết nối'],
    [/\bmộtsốtừ\b/gi, 'một số từ'],
    [/\bmộtsố\b/gi, 'một số'],
    [/\bsốtựnhiên\b/gi, 'số tự nhiên'],
    [/\btựnhiên\b/gi, 'tự nhiên'],
    [/\btrongđờisống\b/gi, 'trong đời sống'],
    [/\bđờisống\b/gi, 'đời sống'],
    [/\bđốvui\b/gi, 'đố vui'],
    [/\bcâuđố\b/gi, 'câu đố'],
    [/\btạora\b/gi, 'tạo ra'],
    [/\bsauđó\b/gi, 'sau đó'],
    [/\bgiảicác\b/gi, 'giải các'],
    [/\bbàitậpđó\b/gi, 'bài tập đó'],
    [/\bbàitập\b/gi, 'bài tập'],
    [/\bnângcao\b/gi, 'nâng cao'],
    [/\bnhiệmvụ\b/gi, 'nhiệm vụ'],
    [/\byêucầu\b/gi, 'yêu cầu'],
    [/\bchuyểngiao\b/gi, 'chuyển giao'],
    [/\bthựchiện\b/gi, 'thực hiện'],
    [/\btrìnhbày\b/gi, 'trình bày'],
    [/\btổtrưởng\b/gi, 'tổ trưởng'],
    [/\bchuyênmôn\b/gi, 'chuyên môn'],
    [/\bbangiámhiệu\b/gi, 'ban giám hiệu'],
    [/\bngườilập\b/gi, 'người lập'],
    [/\bkếhoạchbàidạy\b/gi, 'kế hoạch bài dạy'],
    [/\bbàidạy\b/gi, 'bài dạy'],
    [/\bphẩmchất\b/gi, 'phẩm chất'],
    [/\bnănglực\b/gi, 'năng lực'],
    [/\byêucầucầnđạt\b/gi, 'yêu cầu cần đạt'],
    [/\btựchủ\b/gi, 'tự chủ'],
    [/\bgiaotiếp\b/gi, 'giao tiếp'],
    [/\bhợptác\b/gi, 'hợp tác'],
    [/\bgiảiquyết\b/gi, 'giải quyết'],
    [/\bsángtạo\b/gi, 'sáng tạo'],
    [/\btrungthực\b/gi, 'trung thực'],
    [/\bchămchỉ\b/gi, 'chăm chỉ'],
    [/\btráchnhiệm\b/gi, 'trách nhiệm'],
    [/\bnhânái\b/gi, 'nhân ái'],
    [/\byêunước\b/gi, 'yêu nước']
  ];
  for (const [pattern, replacement] of gluedWords) {
    s = s.replace(pattern, replacement as string);
  }

  // Clean formatting artifacts: stray backslashes, broken subscripts/underscores, trailing asterisks
  s = s
    .replace(/\\([,;:! ])/g, ' ')
    .replace(/\\+(?=[ \t.,;:!?)\\}\\]]|$)/g, '')
    .replace(/([a-zA-Z0-9$]+)[,;:]\s*_{([^{}]+)}/g, '$1, $2')
    .replace(/(^|[\s,;:(])_{([a-zA-Zà-ỹÀ-Ỹ\s]+)}/g, '$1$2')
    .replace(/_{([a-zA-Zà-ỹÀ-Ỹ\s]+)}/g, '$1')
    .replace(/([.,;:!?])_+/g, '$1')
    .replace(/_+([.,;:!?])/g, '$1')
    .replace(/(^|\s)_+([a-zA-Zà-ỹÀ-Ỹ0-9]+)_+(\s|$)/g, '$1$2$3')
    .replace(/(^|\s)_+([a-zA-Zà-ỹÀ-Ỹ]+)/g, '$1$2')
    .replace(/([a-zA-Zà-ỹÀ-Ỹ]+)_+(\s|$)/g, '$1$2')
    .replace(/([.,;:!?])\s*(?<!\*)\*(?!\*)/g, '$1 ')
    .replace(/(?<![ℕℤℚℝN*])\*(?!\*)([.,;:!?])/g, '$1')
    .replace(/(?<![ℕℤℚℝN*])\*(?!\*)[ \t]*$/gm, '')
    .replace(/(?<=[a-zA-Zà-ỹÀ-Ỹ]{2,})\*(?!\*)(?=\s)/g, '')
    .replace(/^[ \t]*\*(?!\*)[ \t]*([A-Za-zÀ-ỹ])/gm, '$1');

  return s;
}

/**
 * Checks if a text block contains teacher/student activity steps
 * (Bước 1, 2, 3, 4, GV, HS, Chuyển giao, Thực hiện, Báo cáo, Kết luận)
 */
export function isActivityStepContent(text: string): boolean {
  if (!text || !text.trim()) return false;
  return /(?:bước\s*[1-4]|b[1-4][:.]|giao\s*nhiệm\s*vụ|chuyển\s*giao\s*nhiệm\s*vụ|thực\s*hiện\s*nhiệm\s*vụ|báo\s*cáo\s*(?:,\s*)?thảo\s*luận|báo\s*cáo\s*thảo\s*luận|kết\s*luận\s*(?:,\s*)?nhận\s*định|kết\s*luận\s*nhận\s*định|gv\s*yêu\s*cầu|gv\s*chiếu|gv\s*giao|gv\s*chốt|gv\s*hướng\s*dẫn|gv\s*nhận\s*xét|gv\s*kết\s*luận|gv\s*nhấn\s*mạnh|gv:|hs:|giáo\s*viên|học\s*sinh|hoạt\s*động\s*\d+|[1-5]\.\s*hoạt\s*động|[a-d]\.\s*hoạt\s*động)/i.test(text);
}

/**
 * Checks if a text block represents expected product / student learning output / knowledge content
 * (e.g. "I. Nội dung...", "1. Khái niệm...", "Dự kiến sản phẩm...", "Lời giải...", "Đáp án...", "Khung tên...", "Bảng kê...")
 * AND does not contain teacher/student pedagogical steps.
 */
export function isProductContent(text: string): boolean {
  if (!text || !text.trim()) return false;
  const clean = text.trim();

  // If it contains pedagogical steps, it is NOT product-only
  if (/(?:bước\s*[1-4]|b[1-4][:.]|giao\s*nhiệm\s*vụ|chuyển\s*giao\s*nhiệm\s*vụ|thực\s*hiện\s*nhiệm\s*vụ|báo\s*cáo\s*(?:,\s*)?thảo\s*luận|kết\s*luận\s*(?:,\s*)?nhận\s*định|hoạt\s*động\s*(?:\d+|khởi|hình|luyện|vận)|gv\s*yêu\s*cầu|gv\s*chiếu|gv\s*giao|gv\s*chốt|gv\s*hướng\s*dẫn|hs\s*thực\s*hiện|hs\s*lắng\s*nghe)/i.test(clean)) {
    return false;
  }

  // Reject standalone summary or homework sections (TỔNG KẾT, HƯỚNG DẪN VỀ NHÀ)
  if (/^(?:\*\*)?(?:(?:IV|V)\.\s*)?(?:TỔNG\s*KẾT|HƯỚNG\s*DẪN\s*VỀ\s*NHÀ|DẶN\s*DÒ)/i.test(clean)) {
    return false;
  }

  // 1. Explicit Product keywords
  if (/^(?:\*\*)?(?:dự\s*kiến\s*sản\s*phẩm|sản\s*phẩm\s*dự\s*kiến|sản\s*phẩm\s*học\s*tập|sản\s*phẩm|nội\s*dung\s*ghi\s*vở|nội\s*dung\s*kiến\s*thức|kết\s*quả\s*thực\s*hiện|kiến\s*thức\s*cốt\s*lõi|kiến\s*thức\s*mới|kiến\s*thức\s*trọng\s*tâm|ghi\s*nhớ|ghi\s*bài|kết\s*luận\s*kiến\s*thức)/i.test(clean)) {
    return true;
  }

  // Activity 1-5 expected products: e.g. "4. Vận dụng:", "**4. Vận dụng:**", "3. Luyện tập:", "1. Khởi động:", "D. Vận dụng:"
  if (/^(?:\*\*)?(?:[1-5]\.\s*|[A-D]\.\s*)(?:Vận\s*dụng|Luyện\s*tập|Khởi\s*động|Khám\s*phá|Hình\s*thành\s*kiến\s*thức|Sản\s*phẩm|Lời\s*giải|Đáp\s*án|Giải\s*quyết\s*tình\s*huống)/i.test(clean)) {
    return true;
  }

  // 2. Technical, drawing, engineering, and STEM product sections (Công nghệ, Kĩ thuật, Khoa học tự nhiên...)
  if (/^(?:\*\*)?(?:[1-9]\.\s*|[I|V|X]+\.\s*)?(?:Khung\s*tên|Bảng\s*kê|Hình\s*biểu\s*diễn|Kích\s*thước|Yêu\s*cầu\s*k[ĩỹ]\s*thuật|Tổng\s*hợp|Đọc\s*bản\s*vẽ|Trình\s*tự\s*đọc|Bản\s*vẽ\s*(?:chi\s*tiết|lắp|nhà|k[ĩỹ]\s*thuật)|Bộ\s*bản\s*lề|Hình\s*chiếu|Hình\s*cắt|Mặt\s*cắt|Vật\s*liệu|Tỉ\s*lệ|Số\s*lượng)/i.test(clean)) {
    return true;
  }

  // 3. Technical item lists (e.g. "- Chi tiết 1: Bản lề", "Chi tiết 1:", "1. Tên gọi sản phẩm...")
  if (/^(?:[-*•]\s*)?(?:Chi\s*tiết\s*\d+|Tên\s*gọi|Tỉ\s*lệ|Vật\s*liệu|Người\s*vẽ|Kích\s*thước\s*chung|Yêu\s*cầu|Công\s*dụng)/i.test(clean)) {
    return true;
  }

  // 4. Roman numeral sections or knowledge subheadings
  if (/^(?:\*\*)?(?:[I|V|X]+|[1-9])\.\s*(?:Nội\s*dung|Khái\s*niệm|Định\s*nghĩa|Tính\s*chất|Quy\s*tắc|Công\s*thức|Thành\s*phần|Ý\s*nghĩa|Lời\s*giải|Đáp\s*án|Bài\s*tập|Ví\s*dụ|Quy\s*trình|Nguyên\s*lý|Nguyên\s*tắc|Cấu\s*tạo|Cấu\s*trúc|Đặc\s*điểm|Chức\s*năng|Phân\s*loại|Dấu\s*hiệu|Tác\s*dụng|Ứng\s*dụng|Chu\s*kì|Chu\s*kỳ|Phương\s*trình|Hiện\s*tượng|Dụng\s*cụ|Thí\s*nghiệm|Nhận\s*xét|Kết\s*luận)/i.test(clean)) {
    return true;
  }

  // 5. Roman numeral topic headings: e.g. "**I. Nội dung của bản vẽ chi tiết**"
  if (/^(?:\*\*)?[I|V|X]+\.\s+[A-ZÀ-Ỹ]/i.test(clean)) {
    return true;
  }

  return false;
}

/**
 * Splits a combined cell that accidentally contains both pedagogical steps and product content
 */
export function splitStepsAndProduct(text: string): { col1: string; col2: string } {
  if (!text || !text.trim()) return { col1: '', col2: '' };

  const productSplitRegex = /(?:<br\s*\/?>|\n)[ \t]*(?:\*\*)?(?:(?:[I|V|X]+|[1-9])\.\s*(?:Khung\s*tên|Bảng\s*kê|Hình\s*biểu\s*diễn|Kích\s*thước|Yêu\s*cầu\s*k[ĩỹ]\s*thuật|Tổng\s*hợp|Đọc\s*bản\s*vẽ|Nội\s*dung|Khái\s*niệm|Định\s*nghĩa|Tính\s*chất|Quy\s*tắc|Công\s*thức|Thành\s*phần|Ý\s*nghĩa|Lời\s*giải|Đáp\s*án|Vận\s*dụng|Luyện\s*tập|Khởi\s*động)|(?:\d+|[A-D])\.\s*(?:Vận\s*dụng|Luyện\s*tập|Khởi\s*động|Khám\s*phá)|Dự\s*kiến\s*sản\s*phẩm|Sản\s*phẩm\s*dự\s*kiến|Sản\s*phẩm\s*học\s*tập|Sản\s*phẩm|Nội\s*dung\s*ghi\s*vở)/i;
  const match = text.match(productSplitRegex);
  if (match && match.index !== undefined && match.index > 0) {
    const col1 = text.substring(0, match.index).trim();
    const col2 = text.substring(match.index).replace(/^(?:<br\s*\/?>|\n)+/i, '').trim();
    if (isActivityStepContent(col1)) {
      return { col1, col2 };
    }
  }

  return { col1: text, col2: '' };
}

/**
 * Repairs, normalizes, and guarantees standard 2-column CV 5512 tables for ALL periods (Tiết 1, Tiết 2, Tiết 3...)
 */
export function repairAllLessonPlanTables(content: string): string {
  if (!content) return '';
  let text = content;

  // Auto-heal broken Bảng kê items / Chi tiết machine parts split into fake periods
  text = text.replace(/(?:^|\n|<br\s*\/?>)[ \t]*(?:(?:\d+\.\s*)?Chi|3\.)[ \t]*(?=(?:\n|<br\s*\/?>)*[ \t]*\*{0,2}(?:TIẾT|Tiết)\s+\d+)/gi, '');
  text = text.replace(/(?:^|\n|<br\s*\/?>)[ \t]*\*{0,2}(?:TIẾT|Tiết)\s+(\d+)\*{0,2}[:* \t]+(BẢN\s*LỀ|VÒNG\s*ĐỆM|CHỐT|ỐC|VÍT|THÉP|NHÔM|ĐỒNG|[A-ZÀ-Ỹa-zà-ỹ0-9\s,()–-]+?(?:cái|chiếc|thép|nhôm|đồng|gang|nhựa)[^\n|<]*)/gi, (_m, num, desc) => {
    let cleanDesc = desc.replace(/[*#]/g, '').trim();
    cleanDesc = cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1).toLowerCase();
    return `<br/>- Chi tiết ${num}: ${cleanDesc}`;
  });

  // 0. EXTRACT "HƯỚNG DẪN VỀ NHÀ" & "TỔNG KẾT KIẾN THỨC" OUT OF TABLES / PIPES
  // (Prevents entire homework instructions from merging into table rows or becoming a giant uppercase heading)
  text = text.replace(
    /(?:<br\s*\/?>|\n|^)[ \t]*(?:\|[ \t]*)?(?:\*\*)?(?:(?:IV|V)\.\s*)?HƯỚNG\s*DẪN\s*(?:HỌC\s*SINH\s*HỌC\s*Ở\s*NHÀ|VỀ\s*NHÀ|TỰ\s*HỌC)(?:\s*\([^)]*\))?(?:\*\*)?[ \t]*(?:\||:|<br\s*\/?>)?([^\n|]*)(?:\||$)/gi,
    (_m, hwContent) => {
      let cleanContent = (hwContent || '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/\\vert\s*/g, '|')
        .trim();
      // Split glued bullets like "- Việc 1. - Việc 2."
      cleanContent = cleanContent.replace(/([^\n])\s+([-+*•]\s+)/g, '$1\n$2');
      const lines = cleanContent.split('\n').map((l: string) => l.trim()).filter(Boolean);
      const bulletLines = lines.map((l: string) => {
        if (/^[-+*•]/.test(l)) return l;
        return `- ${l}`;
      }).join('\n');
      return `\n\n**IV. HƯỚNG DẪN VỀ NHÀ**\n${bulletLines}\n\n`;
    }
  );

  text = text.replace(
    /(?:<br\s*\/?>|\n|^)[ \t]*(?:\|[ \t]*)?(?:\*\*)?(?:(?:IV|V)\.\s*)?TỔNG\s*KẾT\s*(?:KIẾN\s*THỨC|BÀI\s*HỌC)?(?:\s*\([^)]*\))?(?:\*\*)?[ \t]*(?:\||:|<br\s*\/?>)?([^\n|]*)(?:\||$)/gi,
    (_m, poemContent) => {
      let cleanContent = (poemContent || '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/\\vert\s*/g, '|')
        .trim();
      // Split verses if separated by semicolons or periods
      cleanContent = cleanContent.replace(/([,;.]|[a-zà-ỹ0-9]\))\s+(?=[A-ZÀ-Ỹ])/g, '$1\n');
      return `\n\n**TỔNG KẾT KIẾN THỨC**\n${cleanContent}\n\n`;
    }
  );

  // Extract any TIẾT X headers embedded inside table rows so they become centered standalone headings
  // GUARD: NEVER extract machine parts (chi tiết 1, 2, 3...) or items preceded by chi/họa/thời/bài/tình!
  text = text.replace(/(?:^|\n)[ \t]*\|[ \t]*(?:\*\*)?(?<!(?:chi|họa|thời|bài|tình)\s*)(?<![a-zA-ZÀ-ỹ])(?:TIẾT|Tiết)\s+(\d+)[ \t]*[-–:][ \t]*([^\n|]+?)(?:\*\*)?[ \t]*\|(?:[ \t]*\|)?/gi, (m, num, title) => {
    if (/(?:bản\s*lề|vòng\s*đệm|chốt|ốc|vít|thép|nhôm|đồng|gang|nhựa|cái|chiếc|bộ\s*phận|vật\s*liệu|chi\s*tiết)/i.test(title)) {
      return m;
    }
    return `\n\n**TIẾT ${num}: ${title.toUpperCase().trim()}**\n\n| **Hoạt động của GV và HS** | **Dự kiến sản phẩm** |\n| :--- | :--- |\n`;
  });

  // 0a. REMOVE / REPAIR 3-COLUMN ROWS IN 5512 ACTIVITY TABLES ONLY
  // Auto-inject **2. HOẠT ĐỘNG HÌNH THÀNH KIẾN THỨC MỚI** before Hoạt động 1 if missing after Hoạt động Khởi động
  text = text.replace(/(\|[^|\n]*1\.\s*HOẠT\s*ĐỘNG\s*KHỞI\s*ĐỘNG[^|\n]*\|[^|\n]*\|\s*\n\s*\|[ \t]*)(?:\*\*)?(?:Hoạt\s*động\s*1[:\s\(]|Hoạt\s*động\s*khám\s*phá)/gi, '$1**2. HOẠT ĐỘNG HÌNH THÀNH KIẾN THỨC MỚI**<br/>**Hoạt động 1: ');
  text = text.replace(/(\*\*(?:1\.\s*)?HOẠT\s*ĐỘNG\s*KHỞI\s*ĐỘNG[^*]*\*\*[\s\S]*?\|[\s\S]*?\n\s*\|[ \t]*)(?!\*\*2\.\s*HOẠT\s*ĐỘNG)(?:\*\*)?(?:Hoạt\s*động\s*1[:\s\(])/gi, '$1**2. HOẠT ĐỘNG HÌNH THÀNH KIẾN THỨC MỚI**<br/>**Hoạt động 1: ');

  // Wrap broken table rows missing leading or trailing pipes (e.g. "Bước 1: ... | Sản phẩm ...")
  text = text.replace(/^[ \t]*(?!\s*\|)((?:\*\*)?(?:Bước\s*\d|B\d[:\.]|Hoạt\s*động\s*\d|[1-5]\.\s*HOẠT\s*ĐỘNG|[A-D]\.\s*HOẠT\s*ĐỘNG)[^|\n]+?\|[^|\n]+?)(?<!\|\s*)$/gmi, '| $1 |');

  // If an activity header is on a line by itself outside pipes (e.g. **2. HOẠT ĐỘNG HÌNH THÀNH KIẾN THỨC MỚI...**), wrap it as a table row
  text = text.replace(/(?:^|\n)[ \t]*(\*\*(?:[1-5]\.\s*HOẠT\s*ĐỘNG|HOẠT\s*ĐỘNG\s*(?:KHỞI\s*ĐỘNG|HÌNH\s*THÀNH|LUYỆN\s*TẬP|VẬN\s*DỤNG)|[A-D]\.\s*HOẠT\s*ĐỘNG)[^*]*\*\*)[ \t]*(?:\n[ \t]*)+(?=\|[ \t]*(?:\*\*)?(?:Hoạt\s*động|Bước\s*1|[1-5]\.\s*))/gi, '\n| $1 | |\n');

  // (Ensures 5512 Lesson Plan tables are strictly 2 columns, while protecting Matrix / Specification / Phụ lục tables completely intact)
  const lines = text.split('\n');
  const repairedLines: string[] = [];
  let tableBlock: string[] = [];

  const processTableBlock = (tbl: string[]): string[] => {
    if (tbl.length === 0) return [];
    const blockText = tbl.join(' ').toLowerCase();

    // 5512 Lesson Plan Activity Table detection: contains pedagogical markers
    const has5512 = tbl.some(l => /(?:hoạt động của gv|hoạt động dạy học|dự kiến sản phẩm|sản phẩm dự kiến|bước\s*[1-4]|b[1-4][:.]|chuyển giao nhiệm vụ|thực hiện nhiệm vụ|báo cáo thảo luận|kết luận nhận định)/i.test(l));

    // Check if this table is a Signature / Approval table
    const isSig = !has5512 && /(?:duyệt của|xác nhận|người lập|tổ trưởng|ban giám hiệu|giáo viên soạn|hiệu trưởng|bùi sỹ nghĩa)/i.test(blockText);

    // Check if this table is an Appendix or School Schedule table
    const isPhuLuc = !has5512 && /(?:phụ lục|kế hoạch dạy học của tổ|phân phối chương trình|khung kế hoạch giáo dục|tiết theo ppct|thiết bị dạy học|địa điểm dạy học)/i.test(blockText);

    // Check if this table block is a Matrix, Exam Specification, Evaluation Rubric, or Assessment table
    const isMatrixOrSpec =
      !has5512 &&
      !isSig &&
      !isPhuLuc &&
      (/(?:khung\s*ma\s*trận|bản\s*đặc\s*tả|bảng\s*đặc\s*tả|ma\s*trận\s*đề\s*kiểm\s*tra)/i.test(blockText) ||
      tbl.some(l => {
        const parts = l.split('|').map(p => p.trim()).filter(Boolean);
        return parts.length >= 4 && parts.some(c => /(?:nhận biết|thông hiểu|vận dụng cao|tnkq|tự luận|điểm số|tỉ lệ %|số câu)/i.test(c));
      }));

    const is5512Activity = has5512;

    if (!is5512Activity) {
      // Return Matrix / Phụ lục / Signature tables untouched!
      return tbl;
    }

    const resultRows: string[] = [];
    for (let r = 0; r < tbl.length; r++) {
      const line = tbl[r];
      const isDivider = /^\|\s*[:\s|-]+\s*\|$/.test(line);
      const isHeaderRow = /Hoạt động của GV/i.test(line) && /Sản phẩm/i.test(line);

      if (isDivider) {
        resultRows.push('| :--- | :--- |');
        continue;
      }
      if (isHeaderRow) {
        resultRows.push('| **Hoạt động của GV và HS** | **Dự kiến sản phẩm** |');
        continue;
      }

      // Content row in 5512 activity table
      const rawParts = line.slice(1, -1).split('|').map(p => p.trim());
      while (rawParts.length > 2 && !rawParts[rawParts.length - 1]) {
        rawParts.pop();
      }

      // Check if this row is a 1-cell activity banner (e.g. "**1. HOẠT ĐỘNG KHỞI ĐỘNG**")
      const firstText = rawParts[0] || '';
      const isBanner = /^(?:\*\*)?(?:[1-5]\.\s*HOẠT\s*ĐỘNG|HOẠT\s*ĐỘNG\s*(?:[1-5]|KHỞI|HÌNH|LUYỆN|VẬN)|[A-D]\.\s*HOẠT\s*ĐỘNG|TIẾT\s+\d+|Chương|Phần|Chủ đề)/i.test(firstText) &&
        (!rawParts[1] || !rawParts[1].trim());
      if (isBanner) {
        resultRows.push(`| ${firstText} | |`);
        continue;
      }

      let col1 = '';
      let col2 = '';

      if (rawParts.length === 1) {
        const c0 = rawParts[0];
        if (isProductContent(c0)) {
          // Check if previous row in resultRows can absorb this as Col 2
          const prevIdx = resultRows.length - 1;
          let merged = false;
          if (prevIdx >= 0) {
            const prevLine = resultRows[prevIdx];
            if (prevLine.startsWith('|') && !prevLine.includes(':---') && !/Hoạt động của GV.*Sản phẩm/i.test(prevLine)) {
              const prevParts = prevLine.slice(1, -1).split('|').map(p => p.trim());
              if (prevParts.length === 2 && !prevParts[1] && isActivityStepContent(prevParts[0])) {
                resultRows[prevIdx] = `| ${prevParts[0]} | ${c0} |`;
                merged = true;
              }
            }
          }
          if (!merged) {
            col1 = '';
            col2 = c0;
            resultRows.push(`| ${col1} | ${col2} |`);
          }
          continue;
        } else {
          const split = splitStepsAndProduct(c0);
          col1 = split.col1;
          col2 = split.col2;
        }
      } else if (rawParts.length === 2) {
        const [c0, c1] = rawParts;
        const isC0Product = isProductContent(c0) || (!isActivityStepContent(c0) && c0.length > 0 && !c1);
        if (!c1 && isC0Product) {
          // Product alone in Col 1 -> check if previous row can absorb
          const prevIdx = resultRows.length - 1;
          let merged = false;
          if (prevIdx >= 0) {
            const prevLine = resultRows[prevIdx];
            if (prevLine.startsWith('|') && !prevLine.includes(':---') && !/Hoạt động của GV.*Sản phẩm/i.test(prevLine)) {
              const prevParts = prevLine.slice(1, -1).split('|').map(p => p.trim());
              if (prevParts.length === 2 && !prevParts[1] && isActivityStepContent(prevParts[0])) {
                resultRows[prevIdx] = `| ${prevParts[0]} | ${c0} |`;
                merged = true;
              }
            }
          }
          if (!merged) {
            col1 = '';
            col2 = c0;
            resultRows.push(`| ${col1} | ${col2} |`);
          }
          continue;
        } else if (c0 && c1 && isProductContent(c0) && isActivityStepContent(c1)) {
          // Swapped!
          col1 = c1;
          col2 = c0;
        } else if (c0 && !c1) {
          const split = splitStepsAndProduct(c0);
          col1 = split.col1;
          col2 = split.col2;
        } else {
          col1 = c0;
          col2 = c1;
        }
      } else if (rawParts.length === 3) {
        const [p0, p1, p2] = rawParts;
        const isP2PostSection = /^(?:\*\*)?(?:(?:IV|V)\.\s*)?(?:TỔNG\s*KẾT|HƯỚNG\s*DẪN|DẶN\s*DÒ)/i.test(p2);
        const isP1Product = isProductContent(p1) || /^(?:\*\*)?(?:[1-5]\.\s*|[A-D]\.\s*)?(?:Vận\s*dụng|Luyện\s*tập|Khởi\s*động|Khám\s*phá|Hình\s*thành|Sản\s*phẩm|Lời\s*giải|Đáp\s*án|Giải\s*quyết)/i.test(p1);

        if (isP2PostSection || isP1Product) {
          // p1 is the true Col 2 (Expected Product) and p0 is Col 1 (Activity Steps)
          col1 = p0;
          col2 = p1;
          if (isP2PostSection && p2.trim()) {
            // Emitted cleanly after the table row
            resultRows.push(`| ${col1} | ${col2} |`);
            const cleanP2 = p2.replace(/^\|+|\|+$/g, '').trim().replace(/<br\s*\/?>/gi, '\n');
            resultRows.push(`\n\n${cleanP2}\n\n`);
            continue;
          }
        } else if (!p2) {
          if (isProductContent(p1) || !isActivityStepContent(p1)) {
            col1 = p0;
            col2 = p1;
          } else {
            col1 = `${p0}<br/>${p1}`;
            col2 = '';
          }
        } else if (!p1) {
          col1 = p0;
          col2 = p2;
        } else {
          col1 = `${p0}<br/>${p1}`;
          col2 = p2;
        }
      } else {
        col1 = rawParts.slice(0, -1).filter(Boolean).join('<br/>');
        col2 = rawParts[rawParts.length - 1] || '';
      }

      resultRows.push(`| ${col1} | ${col2} |`);
    }
    return resultRows;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      tableBlock.push(line);
    } else if (trimmed.includes('|') && !trimmed.startsWith('#') && !trimmed.startsWith('---')) {
      tableBlock.push(`| ${trimmed.replace(/^\||\|$/g, '').trim()} |`);
    } else {
      // Check if this line is an unpiped continuation of the previous table cell!
      // Must NOT be a section header, structural break, homework, summary poem, or major activity!
      if (
        tableBlock.length > 0 &&
        trimmed &&
        !trimmed.startsWith('#') &&
        !trimmed.startsWith('---') &&
        !/^[ \t]*(?:\*{0,2})(?:TIẾT|I\.|II\.|III\.|IV\.|V\.|VI\.|TỔNG\s*KẾT|HƯỚNG\s*DẪN|DẶN\s*DÒ|DUYỆT|XÁC\s*NHẬN|PHỤ\s*LỤC|MA\s*TRẬN|BẢNG\s*ĐẶC\s*TẢ|[1-5]\.\s*HOẠT\s*ĐỘNG|[A-D]\.\s*HOẠT\s*ĐỘNG)/i.test(trimmed)
      ) {
        // Append to the last line of tableBlock before the closing pipe
        const lastIdx = tableBlock.length - 1;
        tableBlock[lastIdx] = tableBlock[lastIdx].replace(/\|([ \t]*)$/, `<br/>${trimmed} |$1`);
        continue;
      }

      if (tableBlock.length > 0) {
        repairedLines.push(...processTableBlock(tableBlock));
        tableBlock = [];
      }
      repairedLines.push(line);
    }
  }
  if (tableBlock.length > 0) {
    repairedLines.push(...processTableBlock(tableBlock));
    tableBlock = [];
  }

  text = repairedLines.join('\n');

  // Clean stray isolated pipes or trailing single pipes on non-table lines
  text = text.replace(/(?:^|\n)[ \t]*\|[ \t]*(?=\n|$)/g, '\n');

  // 0. Remove any corrupted/orphaned header prefixes in column 2 like "**2. H:**", "2. H:", "2. H", "**2. H**"
  text = text.replace(/(\|[^|\n]*\|[ \t]*)(?:\*\*)?2\.\s*H\s*[:\.]?(?:\*\*)?(?:<br\s*\/?>|\n|\s+)/gi, '$1');
  text = text.replace(/^(?:\*\*)?2\.\s*H\s*[:\.]?(?:\*\*)?(?:<br\s*\/?>|\n|\s+)/gmi, '');
  text = text.replace(/(?:<br\s*\/?>|\n)(?:\*\*)?2\.\s*H\s*[:\.]?(?:\*\*)?(?:<br\s*\/?>|\n|\s+)/gi, '<br/>');

  // 1. Clean LaTeX {text {N; H; A; T; R; A; N; G}} or \text{...} WITHOUT eating outer set curly braces `{`
  text = text.replace(/\\text\s*\{([^{}]+)\}/gi, ' $1 ');
  text = text.replace(/\{text\s*\{([^{}]+)\}\}/gi, ' $1 ');
  text = text.replace(/\\mathrm\s*\{([^{}]+)\}/gi, ' $1 ');
  text = text.replace(/\{mathrm\s*\{([^{}]+)\}\}/gi, ' $1 ');

  // 1b. Auto-repair set notation missing opening `{` inside tables
  text = text.replace(/(^|[\s\n|>$\(,])([A-Za-z0-9_'\*]+)\s*=\s*(?!\s*\{)([^{}\n=$;]+;[^{}\n=$]*)\}/g, (_m, lead, setName, elements) => {
    return `${lead}${setName} = {${elements.trim()}}`;
  });

  // 1c. Capitalization inside table cells: after numbered prefixes "2. ", "a) ", bullets "- ", "+ ", "Hoạt động 2: "
  text = text.replace(/(^|\n|<br\s*\/?>|\||\s{2,})([ \t]*\*{0,2}(?:\d+|[a-zA-Z]|[I|V|X]+)[.)][ \t]*\*{0,2})([a-zà-ỹ])/g, (_m, lead, prefix, char) => {
    return `${lead}${prefix}${char.toUpperCase()}`;
  });
  text = text.replace(/(^|\n|<br\s*\/?>|\||\s{2,})([ \t]*[-+*•–—][ \t]+)([a-zà-ỹ])/g, (_m, lead, prefix, char) => {
    return `${lead}${prefix}${char.toUpperCase()}`;
  });
  text = text.replace(/(^|\n|<br\s*\/?>|\||\s{2,})([ \t]*\*{0,2}Hoạt\s*động\s*\d+\s*[:\.]\s*\*{0,2})([a-zà-ỹ])/gi, (_m, lead, prefix, char) => {
    return `${lead}${prefix}${char.toUpperCase()}`;
  });
  // Capitalize after colon inside table cells (e.g. ": học sinh..." -> ": Học sinh...")
  text = text.replace(/(:\s*\*{0,2}[ \t]*)([a-zà-ỹ])/g, (_m, prefix, char) => {
    return `${prefix}${char.toUpperCase()}`;
  });

  // 2. Convert any deviated headers like "| Hoạt động | Nội dung chi tiết |" or "| Hoạt động | Nội dung |"
  const corruptedHeaderRegex = /\|[ \t]*(?:\*\*)?Hoạt\s*động(?:\*\*)?[ \t]*\|[ \t]*(?:\*\*)?Nội\s*dung(?:\s*chi\s*tiết)?(?:\*\*)?[ \t]*\|\s*\n\s*\|[ \t]*:?-+:?[ \t]*\|[ \t]*:?-+:?[ \t]*\|/gi;
  if (corruptedHeaderRegex.test(text)) {
    text = text.replace(corruptedHeaderRegex, '| **Hoạt động của GV và HS** | **Dự kiến sản phẩm** |\n| :--- | :--- |');
  }

  // 3. Standardize standard header variations to canonical bold format
  text = text.replace(
    /\|[ \t]*(?:\*\*)?Hoạt\s*động\s*của\s*GV\s*và\s*HS(?:\*\*)?[ \t]*\|[ \t]*(?:\*\*)?(?:Dự\s*kiến\s*sản\s*phẩm|Sản\s*phẩm\s*dự\s*kiến|Sản\s*phẩm|Dự\s*kiến\s*kết\s*quả)(?:\*\*)?[ \t]*\|/gi,
    '| **Hoạt động của GV và HS** | **Dự kiến sản phẩm** |'
  );

  // 4. STRIP REDUNDANT ACTIVITY BOILERPLATE METADATA INSIDE TABLE CELLS & ACROSS ACTIVITIES:
  text = text.replace(/(?:<br\s*\/?>|\n|^)[ \t]*(?:\*\*)?(?:[a-d1-4][.)]?[ \t]*)?(?:Mục\s*tiêu|Phương\s*pháp(?:\s*(?:&|và|\/)\s*K[ĩỹ]\s*thuật)?|K[ĩỹ]\s*thuật(?:\s*dạy\s*học)?|Nội\s*dung(?:\s*dạy\s*học)?|Sản\s*phẩm(?:\s*học\s*tập)?)(?:\*\*)?\s*:[^<\n|]*(?:<br\s*\/?>|\n|(?=\|)|$)/gi, '<br/>');
  text = text.replace(/(?:<br\s*\/?>|\n|^)[ \t]*(?:\*\*)?(?:[a-d1-4][.)]?[ \t]*)?(?:Tiến\s*trình\s*tổ\s*chức|Tổ\s*chức\s*thực\s*hiện|Tiến\s*trình\s*dạy\s*học|Tiến\s*trình\s*hoạt\s*động)(?:\*\*)?\s*:?[ \t]*(?:<br\s*\/?>|\n|(?=\|)|$)/gi, '<br/>');

  // Strip inline boilerplate sitting right before Bước 1
  text = text.replace(/(?:\*\*)?(?:[a-d1-4][.)]?[ \t]*)?(?:Mục\s*tiêu|Phương\s*pháp(?:\s*(?:&|và|\/)\s*K[ĩỹ]\s*thuật)?|K[ĩỹ]\s*thuật(?:\s*dạy\s*học)?|Nội\s*dung|Tiến\s*trình(?:\s*tổ\s*chức|\s*dạy\s*học)?|Tổ\s*chức\s*thực\s*hiện)(?:\*\*)?\s*:[^<\n|*]*(?=\*{0,2}Bước\s*1)/gi, '<br/>');

  // 5. STRIP STRAY LETTERS (a, a), b, b), c, c), d, d)) JUMPING ONTO / SITTING BELOW ACTIVITY HEADERS
  text = text.replace(/(\*\*(?:[1-5]\.\s*HOẠT\s*ĐỘNG|HOẠT\s*ĐỘNG\s*\d+|[A-D]\.\s*HOẠT\s*ĐỘNG)[^*]*\*\*)[ \t]*(?:<br\s*\/?>|\n)?[ \t]*(?:\*\*)?[a-d][.)]?(?:\*\*)?[ \t]*(?=<br|\n|\||Bước|\*\*|$)/gi, '$1<br/>');
  text = text.replace(/(\*\*(?:[1-5]\.\s*HOẠT\s*ĐỘNG|HOẠT\s*ĐỘNG\s*\d+|[A-D]\.\s*HOẠT\s*ĐỘNG)[^*]*\*\*)[ \t]+[a-d][.)]?[ \t]+/gi, '$1 ');
  text = text.replace(/(?:<br\s*\/?>|\n)[ \t]*(?:\*\*)?[a-d][.)]?(?:\*\*)?[ \t]*(?=<br|\n|\||$)/gi, '<br/>');

  // 6. MERGE BROKEN MULTI-ROW ACTIVITIES WHERE ROW 1 HAS ACTIVITY TITLE AND EMPTY COL 2, AND ROW 2 HAS STEPS / PRODUCT
  text = text.replace(
    /(\|[ \t]*(?:\*\*)?(?:Hoạt\s*động\s*\d+|[1-5]\.\s*HOẠT\s*ĐỘNG|[A-D]\.\s*HOẠT\s*ĐỘNG)[^|\n]*?\|)[ \t]*(?:<br\s*\/?>|\s*)\|[ \t]*\n\|([ \t]*[^|\n]+?\|[ \t]*[^|\n]+?\|)/gi,
    (_full, col1Part, row2Full) => {
      const row2Cells = row2Full.split('|').map((c: string) => c.trim()).filter(Boolean);
      if (row2Cells.length >= 2) {
        let col1Clean = col1Part.replace(/^\||\|$/g, '').trim();
        col1Clean = col1Clean.replace(/(?:<br\s*\/?>|\n)?\s*(?:\*\*)?[a-d][.)]?(?:\*\*)?\s*$/i, '').trim();
        let stepContent = row2Cells[0];
        stepContent = stepContent.replace(/^(?:(?:\*\*)?(?:[a-d1-4][.)]?[ \t]*)?(?:Mục\s*tiêu|Phương\s*pháp(?:\s*(?:&|và)?\s*K[ĩỹ]\s*thuật)?|Nội\s*dung|Tiến\s*trình\s*tổ\s*chức|Tổ\s*chức\s*thực\s*hiện)(?:\*\*)?\s*:[^<\n]*<br\s*\/?>)+/gi, '').trim();
        stepContent = stepContent.replace(/^(?:(?:\*\*)?(?:c|d)[.)]?[ \t]*)?(?:Tiến\s*trình\s*tổ\s*chức|Tổ\s*chức\s*thực\s*hiện)(?:\*\*)?\s*:?<br\s*\/?>/gi, '').trim();
        stepContent = stepContent.replace(/^(?:<br\s*\/?>|\n)?\s*(?:\*\*)?[a-d][.)]?(?:\*\*)?\s*<br\s*\/?>/gi, '').trim();
        const mergedCol1 = `${col1Clean}<br/>${stepContent}`;
        const col2 = row2Cells[1];
        return `| ${mergedCol1} | ${col2} |`;
      }
      return _full;
    }
  );

  // 7. CLEAN MULTIPLE CONSECUTIVE <br> AND TRAILING <br> BEFORE PIPES
  text = text.replace(/(\*\*(?:[1-5]\.\s*HOẠT\s*ĐỘNG|HOẠT\s*ĐỘNG\s*\d+|[A-D]\.\s*HOẠT\s*ĐỘNG)[^*]*\*\*)\s*(?:<br\s*\/?>\s*)+/gi, '$1<br/>');
  text = text.replace(/(?:<br\s*\/?>\s*){2,}/gi, '<br/>');
  text = text.replace(/<br\s*\/?>\s*\|\s*$/gm, ' |');

  // 8. REPAIR ORPHAN ACTIVITIES (e.g. Activity 4: Hoạt động vận dụng sitting outside tables)
  text = repairOrphanActivities(text);

  // 9. NORMALIZE PEDAGOGICAL BOLDING (Fix "in đậm tùm lum")
  text = normalizePedagogicalBolding(text);

  return text;
}

/**
 * Normalizes pedagogical bolding in lesson plans.
 * Prevents full multi-sentence instructional steps from being bolded all over ("in đậm tùm lum").
 * Only the label (e.g. "**Bước 1: Giao nhiệm vụ học tập:**", "**Ví dụ 1:**", "**Lời giải:**") remains bold.
 */
export function normalizePedagogicalBolding(content: string): string {
  if (!content) return '';
  let text = content;

  // 1. Unbold sentences inside 4 steps:
  // e.g. "**Bước 1: Giao nhiệm vụ học tập: GV yêu cầu HS làm bài 1...**"
  // -> "**Bước 1: Giao nhiệm vụ học tập:** GV yêu cầu HS làm bài 1..."
  text = text.replace(/\*\*(Bước\s*\d[:\.]\s*[^:\n*]+:)\s*([^*]+?)\*\*/gi, '**$1** $2');

  // 2. Unbold sentences inside labels:
  // e.g. "**Lời giải: Ta có x = 2...**" -> "**Lời giải:** Ta có x = 2..."
  // e.g. "**Ví dụ 1: Tính diện tích...**" -> "**Ví dụ 1:** Tính diện tích..."
  text = text.replace(/\*\*(Lời\s*giải|Ví\s*dụ\s*\d*|Chú\s*ý|Ghi\s*nhớ|Gợi\s*ý|Nhận\s*xét|Định\s*nghĩa|Quy\s*tắc|Tính\s*chất|Công\s*thức|Bài\s*tập\s*\d*|Nhiệm\s*vụ\s*\d*|Luyện\s*tập\s*\d*|Khám\s*phá\s*\d*|Vận\s*dụng\s*\d*|Tìm\s*tòi\s*\d*):?\s*([^*]+?)\*\*/gi, '**$1:** $2');

  // 3. Normalize single-paragraph accidental full bolding (longer than 80 chars containing sentences or bullet points)
  text = text.replace(/\*\*([^*]{80,})\*\*/g, (_m, inner) => {
    // If it starts with a label like "Bước 1:" or "4. Vận dụng:" or "Chú ý:"
    const labelMatch = inner.match(/^((?:Bước\s*\d[:\.]|[1-5]\.\s*[^:\n]+:|[A-D]\.\s*[^:\n]+:|Ví\s*dụ\s*\d*:|Lời\s*giải:|Ghi\s*nhớ:|Chú\s*ý:|Luyện\s*tập\s*\d*:)[^:\n]*:?)/i);
    if (labelMatch) {
      return `**${labelMatch[1]}** ${inner.slice(labelMatch[1].length).trim()}`;
    }
    // If it's multi-sentence explanation or mathematical text, unbold it!
    if (/[.;!?]\s+[-*•A-Za-zÀ-ỹ0-9]/i.test(inner) || inner.length > 120) {
      return inner;
    }
    return _m;
  });

  // 4. Normalize pedagogical actors (Khối lớp/Lớp -> **HS:**, GV -> **GV:**, HS -> **HS:**)
  text = repairPedagogicalActors(text);

  return text;
}

/**
 * Repairs pedagogical role labeling:
 * Standardizes "Khối lớp", "Lớp", "Cả lớp" (when acting as student roles in pedagogical interactions) to "**HS:**".
 * Standardizes teacher roles to "**GV:**".
 * Preserves true document metadata headers (e.g. "**Khối lớp:** 7", "Lớp: 7A", "Khối lớp: 8") and Section II equipment items.
 */
export function repairPedagogicalActors(content: string): string {
  if (!content) return '';
  let s = content;

  const studentVerbs = '(?:lắng\\s*nghe|quan\\s*sát|thực\\s*hiện|thảo\\s*luận|làm\\s*bài|trả\\s*lời|ghi\\s*chép|báo\\s*cáo|tiếp\\s*nhận|theo\\s*dõi|chú\\s*ý|hoàn\\s*thành|nghiên\\s*cứu|trình\\s*bày|nhận\\s*xét|trao\\s*đổi|hoạt\\s*động|phản\\s*biện|cử\\s*đại\\s*diện|chuẩn\\s*bị|đọc|vẽ|viết|tiến\\s*hành|phân\\s*công|làm\\s*việc|vận\\s*dụng|mở\\s*SGK|mở\\s*vở|chép\\s*bài|thực\\s*hành|giải|suy\\s*nghĩ|tham\\s*gia|đặt\\s*câu\\s*hỏi|chia\\s*sẻ|lên\\s*bảng|nộp|thao\\s*tác|tập\\s*trung|xung\\s*phong|tự\\s*giác|chia\\s*nhóm|ngồi\\s*theo)';

  // 1. Repair Khối lớp / Cả lớp / Lớp / Học sinh acting as student actor before student action verbs
  // e.g. "- Khối lớp: Thực hiện nhiệm vụ" -> "- **HS:** Thực hiện nhiệm vụ"
  // e.g. "**Khối lớp:** Lắng nghe và làm bài" -> "**HS:** Lắng nghe và làm bài"
  // e.g. "<br/>**Khối lớp:** Thảo luận nhóm" -> "<br/>**HS:** Thảo luận nhóm"
  const actorBeforeVerbRegex = new RegExp(
    '(^|\\n|<br\\s*\\/?>|[|;])([ \\t]*[-+*•–—][ \\t]+)?[ \\t]*(?:\\*\\*)?(?:Khối\\s*lớp|KHỐI\\s*LỚP|Cả\\s*lớp|CẢ\\s*LỚP|Lớp|LỚP)(?:\\s*[:\\.]\\s*\\*\\*|(?::\\*\\*|\\*\\*[:\\.]|[:\\.]))(?:\\*\\*)?[ \\t]*(?=' + studentVerbs + ')',
    'gi'
  );
  s = s.replace(actorBeforeVerbRegex, (_m, lead, bullet) => (lead || '') + (bullet || '') + '**HS:** ');

  // 2. In CV 5512 activity tables: replace any "Khối lớp:" / "Cả lớp:" inside table rows where it cannot be metadata
  // In table cells, there are only two roles: GV and HS. Khối lớp is never an actor in an activity table!
  s = s.replace(/(\|.*?\|)/gs, (tableRow) => {
    return tableRow.replace(/(<br\s*\/?>|\n|[|;])([ \t]*[-+*•–—][ \t]+)?[ \t]*(?:\*\*)?(?:Khối\s*lớp|KHỐI\s*LỚP|Cả\s*lớp|CẢ\s*LỚP)(?:\s*[:\.]\s*\*\*|(?::\*\*|\*\*[:\.]|[:\.]))(?:\*\*)?[ \t]*(?!\s*(?:\d+|[0-9]+[A-Za-z]|Khối\s*\d+|Lớp\s*\d+|Tiểu\s*học|THCS|THPT)\b)/gi, (_m, lead, bullet) => {
      return (lead || '') + (bullet || '') + '**HS:** ';
    });
  });

  // 3. Inside Bước 1, 2, 3, 4: replace any Khối lớp: acting as actor
  s = s.replace(/(Bước\s*[1-4][^|]+?)(?=(?:Bước\s*[1-4]|\n\s*\||$))/gis, (bstep) => {
    return bstep.replace(/(<br\s*\/?>|\n|[|;])([ \t]*[-+*•–—][ \t]+)?[ \t]*(?:\*\*)?(?:Khối\s*lớp|KHỐI\s*LỚP|Cả\s*lớp|CẢ\s*LỚP)(?:\s*[:\.]\s*\*\*|(?::\*\*|\*\*[:\.]|[:\.]))(?:\*\*)?[ \t]*(?!\s*(?:\d+|[0-9]+[A-Za-z]|Khối\s*\d+|Lớp\s*\d+|Tiểu\s*học|THCS|THPT)\b)/gi, (_m, lead, bullet) => {
      return (lead || '') + (bullet || '') + '**HS:** ';
    });
  });

  // 4. Standardize **GV:** and **HS:** in activity steps and list items
  s = s.replace(/(^|\n|<br\s*\/?>|[|;])([ \t]*[-+*•–—][ \t]+)?[ \t]*(?:\*\*)?GV(?:\s*[:\.]\s*\*\*|(?::\*\*|\*\*[:\.]|[:\.]))(?:\*\*)?[ \t]*/gi, (_m, lead, bullet) => (lead || '') + (bullet || '') + '**GV:** ');
  s = s.replace(/(^|\n|<br\s*\/?>|[|;])([ \t]*[-+*•–—][ \t]+)?[ \t]*(?:\*\*)?HS(?:\s*[:\.]\s*\*\*|(?::\*\*|\*\*[:\.]|[:\.]))(?:\*\*)?[ \t]*/gi, (_m, lead, bullet) => (lead || '') + (bullet || '') + '**HS:** ');

  return s;
}

/**
 * Automatically catches and converts any educational activity sitting outside table pipes
 * (most commonly "Hoạt động vận dụng" or "Hoạt động 4" written after the main table)
 * into a standard 2-column table row so it NEVER loses its columns.
 */
export function repairOrphanActivities(content: string): string {
  if (!content) return '';
  let text = content;

  // 1. Check for orphan activity steps (Bước 1, Bước 2, Bước 3, Bước 4, GV:, HS:) outside pipes after an activity banner or table header
  text = text.replace(
    /(\|[ \t]*(?:\*\*)?(?:[1-5]\.\s*HOẠT\s*ĐỘNG|HOẠT\s*ĐỘNG\s*(?:[1-5]|KHỞI\s*ĐỘNG|HÌNH\s*THÀNH|LUYỆN\s*TẬP|VẬN\s*DỤNG)|[A-D]\.\s*HOẠT\s*ĐỘNG)[^|\n]*?\|)[ \t]*(?:<br\s*\/?>|\s*)\|[ \t]*\n+([ \t]*(?!\s*\|)(?:\*{0,2}(?:Bước\s*[1-4]|B\d[:\.]|GV\s*yêu\s*cầu|GV\s*chiếu|GV\s*giao|GV:|HS:)[\s\S]*?))(?=(?:^|\n)[ \t]*(?:\||\#{1,4}\s+|\*{0,2}(?:TIẾT\s+\d+|[1-5]\.\s*HOẠT\s*ĐỘNG|[A-D]\.\s*HOẠT\s*ĐỘNG|IV\.\s*HƯỚNG\s*DẪN|HƯỚNG\s*DẪN\s*VỀ\s*NHÀ|TỔNG\s*KẾT|V\.\s*TỔNG\s*KẾT)|$))/gi,
    (_full, headerRow, orphanBody) => {
      const productSplitRegex = /(?:^|\n|<br\s*\/?>)[ \t]*(?:\*\*)?(?:Dự\s*kiến\s*sản\s*phẩm|Sản\s*phẩm\s*dự\s*kiến|Sản\s*phẩm\s*học\s*tập|Sản\s*phẩm|Nội\s*dung\s*ghi\s*vở|(?:\d+|[A-D])\.\s*Vận\s*dụng|(?:\d+|[A-D])\.\s*Luyện\s*tập)(?:\*\*)?\s*[:.]?[ \t]*/i;
      const productMatch = orphanBody.match(productSplitRegex);
      let rawCol1 = '';
      let rawCol2 = '';
      if (productMatch && productMatch.index !== undefined) {
        rawCol1 = orphanBody.slice(0, productMatch.index).trim();
        rawCol2 = orphanBody.slice(productMatch.index).trim();
      } else {
        rawCol1 = orphanBody.trim();
        rawCol2 = 'Học sinh thực hiện nhiệm vụ, hoàn thành bài tập và ghi chép vào vở.';
      }

      let col1Clean = rawCol1
        .replace(/(?:^|\n)[ \t]*(?:\*\*)?(?:[a-d1-4][.)]?[ \t]*)?(?:Mục\s*tiêu|Phương\s*pháp(?:\s*(?:&|và|\/)\s*K[ĩỹ]\s*thuật)?|K[ĩỹ]\s*thuật(?:\s*dạy\s*học)?|Nội\s*dung(?:\s*dạy\s*học)?|Sản\s*phẩm(?:\s*học\s*tập)?)(?:\*\*)?\s*:[^\n]*/gi, '')
        .replace(/(?:^|\n)[ \t]*(?:\*\*)?(?:[a-d1-4][.)]?[ \t]*)?(?:Tiến\s*trình\s*tổ\s*chức|Tổ\s*chức\s*thực\s*hiện|Tiến\s*trình\s*dạy\s*học|Tiến\s*trình\s*hoạt\s*động)(?:\*\*)?\s*:?[ \t]*/gi, '')
        .replace(/(?:^|\n)[ \t]*(?:\*\*)?[a-d][.)][ \t]*/gi, '\n')
        .replace(/\|/g, '\\vert ')
        .trim();

      const col1Lines = col1Clean.split('\n').map((l: string) => l.trim()).filter(Boolean);
      const formattedCol1 = col1Lines.join('<br/>');

      let col2Clean = rawCol2
        .replace(/^(?:(?:\*\*)?(?:Dự\s*kiến\s*sản\s*phẩm|Sản\s*phẩm\s*dự\s*kiến|Sản\s*phẩm|Nội\s*dung\s*ghi\s*vở)(?:\*\*)?\s*[:.]?\s*)+/gi, '')
        .replace(/\|/g, '\\vert ')
        .trim();
      const col2Lines = col2Clean.split('\n').map((l: string) => l.trim()).filter(Boolean);
      const formattedCol2 = col2Lines.join('<br/>');

      const cleanHeaderStr = headerRow.replace(/^\||\|$/g, '').trim();
      return `| ${cleanHeaderStr} | |\n| ${formattedCol1} | ${formattedCol2} |`;
    }
  );

  // Check if document has an orphan activity outside table pipes
  // (matches lines starting with [1-5]. HOẠT ĐỘNG or HOẠT ĐỘNG [1-5] or [A-D]. HOẠT ĐỘNG that do not begin with '|')
  const orphanActivityHeaderPattern = /(?:^|\n)[ \t]*(?!\s*\|)[ \t]*(\*{0,2}(?:[1-5]\.\s*HOẠT\s*ĐỘNG|HOẠT\s*ĐỘNG\s*(?:[1-5]|KHỞI\s*ĐỘNG|HÌNH\s*THÀNH(?:\s*KIẾN\s*THỨC(?:\s*MỚI)?)?|LUYỆN\s*TẬP|VẬN\s*DỤNG)|[A-D]\.\s*HOẠT\s*ĐỘNG)[^*|\n]*\*{0,2})/i;

  if (!orphanActivityHeaderPattern.test(text)) {
    return text;
  }

  // Regex to match each orphan activity block
  const orphanBlockRegex = /(?:^|\n)[ \t]*(?!\s*\|)[ \t]*(\*{0,2}(?:[1-5]\.\s*HOẠT\s*ĐỘNG|HOẠT\s*ĐỘNG\s*(?:[1-5]|KHỞI\s*ĐỘNG|HÌNH\s*THÀNH(?:\s*KIẾN\s*THỨC(?:\s*MỚI)?)?|LUYỆN\s*TẬP|VẬN\s*DỤNG)|[A-D]\.\s*HOẠT\s*ĐỘNG)[^*|\n]*\*{0,2})([\s\S]*?)(?=(?:^|\n)[ \t]*(?:\*{0,2}(?:[1-5]\.\s*HOẠT\s*ĐỘNG|[A-D]\.\s*HOẠT\s*ĐỘNG|TIẾT\s+\d+|IV\.\s*HƯỚNG\s*DẪN|HƯỚNG\s*DẪN\s*VỀ\s*NHÀ|TỔNG\s*KẾT|V\.\s*TỔNG\s*KẾT|I\.\s*MỤC\s*TIÊU|II\.\s*THIẾT\s*BỊ|III\.\s*TIẾN\s*TRÌNH|PHỤ\s*LỤC|ĐÁP\s*ÁN|BẢNG\s*ĐẶC\s*TẢ|MA\s*TRẬN)|\#{1,4}\s+|(?:\|[ \t]*\*{0,2}(?:Hoạt\s*động|[1-5]\.\s*HOẠT\s*ĐỘNG))|$))/gi;

  return text.replace(orphanBlockRegex, (fullMatch, rawHeader, rawBody, offset, fullText) => {
    let cleanHeader = (rawHeader || '')
      .replace(/^[\s*#|]+|[\s*#|]+$/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
      .trim();
    if (!cleanHeader) return fullMatch;
    cleanHeader = `**${cleanHeader}**`;

    // Separate Col 1 (Teacher & Student Activities) and Col 2 (Expected Product)
    const productSplitRegex = /(?:^|\n|<br\s*\/?>)[ \t]*(?:\*\*)?(?:Dự\s*kiến\s*sản\s*phẩm|Sản\s*phẩm\s*dự\s*kiến|Sản\s*phẩm\s*học\s*tập|Sản\s*phẩm|Nội\s*dung\s*ghi\s*vở|(?:\d+|[A-D])\.\s*Vận\s*dụng|(?:\d+|[A-D])\.\s*Luyện\s*tập)(?:\*\*)?\s*[:.]?[ \t]*/i;
    const productMatch = rawBody.match(productSplitRegex);

    let rawCol1 = '';
    let rawCol2 = '';

    if (productMatch && productMatch.index !== undefined) {
      rawCol1 = rawBody.slice(0, productMatch.index).trim();
      rawCol2 = rawBody.slice(productMatch.index).trim();
    } else {
      rawCol1 = rawBody.trim();
      // Derive a meaningful product title
      const shortTitle = cleanHeader.replace(/[*#()]/g, '').replace(/^[1-5]\.\s*HOẠT\s*ĐỘNG\s*/i, '').trim();
      rawCol2 = `**${shortTitle}:**<br/>Học sinh thực hiện nhiệm vụ, hoàn thành bài tập và ghi chép vào vở.`;
    }

    // Clean Column 1:
    // Strip redundant boilerplate metadata
    let col1Clean = rawCol1
      .replace(/(?:^|\n)[ \t]*(?:\*\*)?(?:[a-d1-4][.)]?[ \t]*)?(?:Mục\s*tiêu|Phương\s*pháp(?:\s*(?:&|và|\/)\s*K[ĩỹ]\s*thuật)?|K[ĩỹ]\s*thuật(?:\s*dạy\s*học)?|Nội\s*dung(?:\s*dạy\s*học)?|Sản\s*phẩm(?:\s*học\s*tập)?)(?:\*\*)?\s*:[^\n]*/gi, '')
      .replace(/(?:^|\n)[ \t]*(?:\*\*)?(?:[a-d1-4][.)]?[ \t]*)?(?:Tiến\s*trình\s*tổ\s*chức|Tổ\s*chức\s*thực\s*hiện|Tiến\s*trình\s*dạy\s*học|Tiến\s*trình\s*hoạt\s*động)(?:\*\*)?\s*:?[ \t]*/gi, '')
      .replace(/(?:^|\n)[ \t]*(?:\*\*)?[a-d][.)][ \t]*/gi, '\n')
      .replace(/\|/g, '\\vert ')
      .trim();

    // Convert newlines in Col 1 to <br/>
    const col1Lines = col1Clean.split('\n').map(l => l.trim()).filter(Boolean);
    const formattedCol1 = col1Lines.join('<br/>');
    const finalCol1 = `${cleanHeader}<br/>${formattedCol1}`;

    // Clean Column 2:
    let col2Clean = rawCol2
      .replace(/^(?:(?:\*\*)?(?:Dự\s*kiến\s*sản\s*phẩm|Sản\s*phẩm\s*dự\s*kiến|Sản\s*phẩm|Nội\s*dung\s*ghi\s*vở)(?:\*\*)?\s*[:.]?\s*)+/gi, '')
      .replace(/\|/g, '\\vert ')
      .trim();

    // Ensure Col 2 begins with a bold label if not already
    if (!col2Clean.startsWith('**') && !col2Clean.startsWith('#')) {
      const isVandug = /vận\s*dụng/i.test(cleanHeader);
      const isLuyentap = /luyện\s*tập/i.test(cleanHeader);
      const defaultLabel = isVandug ? '**4. Vận dụng:**<br/>' : isLuyentap ? '**3. Luyện tập:**<br/>' : '';
      col2Clean = defaultLabel + col2Clean;
    }

    const col2Lines = col2Clean.split('\n').map(l => l.trim()).filter(Boolean);
    const finalCol2 = col2Lines.join('<br/>');

    const tableRow = `| ${finalCol1} | ${finalCol2} |`;

    // Check if the text immediately preceding this block is already a table (ends with '|' or '| ')
    const textBefore = fullText.slice(0, offset).trim();
    const isPrecededByTable = textBefore.endsWith('|');

    if (isPrecededByTable) {
      return `\n${tableRow}\n`;
    } else {
      return `\n\n| **Hoạt động của GV và HS** | **Dự kiến sản phẩm** |\n| :--- | :--- |\n${tableRow}\n\n`;
    }
  });
}

export interface ActivityTimeAllocation {
  totalMinutes: number;
  khoiDong: number;
  hinhThanh: number;
  hinhThanhSub1: number;
  hinhThanhSub2: number;
  luyenTap: number;
  vanDung: number;
  timToi: number;
  summaryText: string;
}

/**
 * Extracts numeric period duration in minutes from profile.thoiluong string.
 * e.g. "35 phút (Tiểu học)" -> 35, "40 phút (Tiểu học)" -> 40, "45 phút (THCS / THPT)" -> 45, "90 phút" -> 90.
 */
export function parsePeriodDurationMinutes(thoiluong?: string): number {
  if (!thoiluong) return 45;
  const match = thoiluong.match(/(\d+)\s*phút/i);
  return match ? parseInt(match[1], 10) : 45;
}

/**
 * Calculates scientifically balanced time distribution across the 4 pedagogical activities
 * according to Ministry of Education guidelines (CV 5512 / CV 2345), guaranteeing that
 * sum(activities) === totalMinutes EXACTLY.
 */
export function calculateActivityTimeAllocation(totalMinutes: number, isLuyenTapLesson = false): ActivityTimeAllocation {
  const M = totalMinutes > 0 ? totalMinutes : 45;

  if (isLuyenTapLesson) {
    let khoiDong = 5;
    let luyenTap = 28;
    let vanDung = 8;
    let timToi = 4;

    if (M === 35) {
      khoiDong = 5;
      luyenTap = 20;
      vanDung = 7;
      timToi = 3;
    } else if (M === 40) {
      khoiDong = 5;
      luyenTap = 23;
      vanDung = 8;
      timToi = 4;
    } else if (M === 90) {
      khoiDong = 10;
      luyenTap = 55;
      vanDung = 18;
      timToi = 7;
    } else if (M === 45) {
      khoiDong = 5;
      luyenTap = 28;
      vanDung = 8;
      timToi = 4;
    } else {
      khoiDong = Math.max(4, Math.round(M * 0.11));
      timToi = Math.max(2, Math.round(M * 0.08));
      vanDung = Math.max(5, Math.round(M * 0.18));
      luyenTap = M - khoiDong - vanDung - timToi;
    }

    return {
      totalMinutes: M,
      khoiDong,
      hinhThanh: 0,
      hinhThanhSub1: 0,
      hinhThanhSub2: 0,
      luyenTap,
      vanDung,
      timToi,
      summaryText: `${khoiDong} + ${luyenTap} + ${vanDung} + ${timToi} = đúng ${M} phút`
    };
  }

  // Standard lesson (Bài học mới / Hình thành kiến thức)
  let khoiDong = 5;
  let hinhThanh = 25;
  let hinhThanhSub1 = 13;
  let hinhThanhSub2 = 12;
  let luyenTap = 10;
  let vanDung = 5;

  if (M === 35) {
    khoiDong = 5;
    hinhThanh = 18;
    hinhThanhSub1 = 9;
    hinhThanhSub2 = 9;
    luyenTap = 8;
    vanDung = 4;
  } else if (M === 40) {
    khoiDong = 5;
    hinhThanh = 21;
    hinhThanhSub1 = 11;
    hinhThanhSub2 = 10;
    luyenTap = 10;
    vanDung = 4;
  } else if (M === 90) {
    khoiDong = 8;
    hinhThanh = 50;
    hinhThanhSub1 = 25;
    hinhThanhSub2 = 25;
    luyenTap = 22;
    vanDung = 10;
  } else if (M === 45) {
    khoiDong = 5;
    hinhThanh = 25;
    hinhThanhSub1 = 13;
    hinhThanhSub2 = 12;
    luyenTap = 10;
    vanDung = 5;
  } else {
    khoiDong = Math.max(3, Math.round(M * 0.11));
    vanDung = Math.max(3, Math.round(M * 0.11));
    luyenTap = Math.max(5, Math.round(M * 0.24));
    hinhThanh = M - khoiDong - luyenTap - vanDung;
    hinhThanhSub1 = Math.ceil(hinhThanh / 2);
    hinhThanhSub2 = hinhThanh - hinhThanhSub1;
  }

  return {
    totalMinutes: M,
    khoiDong,
    hinhThanh,
    hinhThanhSub1,
    hinhThanhSub2,
    luyenTap,
    vanDung,
    timToi: 0,
    summaryText: `${khoiDong} + ${hinhThanh} (HĐ1: ${hinhThanhSub1}p, HĐ2: ${hinhThanhSub2}p) + ${luyenTap} + ${vanDung} = đúng ${M} phút`
  };
}

/**
 * Removes activity duration indicators (e.g., "(5 phút)", "(30 phút)", "(15 phút)", "(8 phút)", "(2 phút)")
 * from all activity titles and sub-activities across the entire lesson plan document.
 */
export function stripLessonPlanActivityDurations(text: string): string {
  if (!text) return '';
  let res = text;

  // 1. Remove duration in parentheses attached to HOẠT ĐỘNG / Hoạt động headers inside or outside bold markdown
  // Example: **1. HOẠT ĐỘNG KHỞI ĐỘNG (5 phút)** -> **1. HOẠT ĐỘNG KHỞI ĐỘNG**
  // Example: **Hoạt động 1: Tìm hiểu định nghĩa (15 phút)** -> **Hoạt động 1: Tìm hiểu định nghĩa**
  res = res.replace(/((?:HOẠT\s*ĐỘNG|Hoạt\s*động)[^(\n|]+?)\s*\(\s*(?:khoảng\s*)?\d+(?:[.,]\d+)?\s*(?:phút|p)\s*\)/gi, '$1');

  // Example with square brackets: [5 phút]
  res = res.replace(/((?:HOẠT\s*ĐỘNG|Hoạt\s*động)[^\[\n|]+?)\s*\[\s*(?:khoảng\s*)?\d+(?:[.,]\d+)?\s*(?:phút|p)\s*\]/gi, '$1');

  // Example where parentheses sit immediately after closing bold tags:
  // **1. HOẠT ĐỘNG KHỞI ĐỘNG** (5 phút) -> **1. HOẠT ĐỘNG KHỞI ĐỘNG**
  res = res.replace(/(\*\*[^*]+?(?:HOẠT\s*ĐỘNG|Hoạt\s*động)[^*]+?\*\*)\s*\(\s*(?:khoảng\s*)?\d+(?:[.,]\d+)?\s*(?:phút|p)\s*\)/gi, '$1');

  // Example with hyphen/dash: "HOẠT ĐỘNG KHỞI ĐỘNG - 5 phút"
  res = res.replace(/((?:HOẠT\s*ĐỘNG|Hoạt\s*động)[^\n|]+?)\s*[-–]\s*(?:khoảng\s*)?\d+(?:[.,]\d+)?\s*(?:phút|p)/gi, '$1');

  // Clean trailing spaces before closing asterisks: "**1. HOẠT ĐỘNG KHỞI ĐỘNG **" -> "**1. HOẠT ĐỘNG KHỞI ĐỘNG**"
  res = res.replace(/([A-ZÀ-Ỹa-zà-ỹ0-9_:\.\)])\s+\*\*/g, '$1**');

  return res;
}

/**
 * Rebalances and normalizes activity durations in any lesson plan (single or multi-period),
 * guaranteeing that each period's 4 activities sum up to targetMinutes configured in Tab 1.
 * If hideDurations is true, it completely strips all activity duration indicators.
 */
export function rebalanceLessonPlanActivityDurations(text: string, targetMinutes = 45, hideDurations = false): string {
  if (!text) return text;

  if (hideDurations) {
    return stripLessonPlanActivityDurations(text);
  }

  if (targetMinutes <= 0) return text;

  function balancePeriodText(periodText: string): string {
    const isLuyenTapLesson = /HOẠT ĐỘNG LUYỆN TẬP/i.test(periodText) && !/HÌNH THÀNH KIẾN THỨC/i.test(periodText);
    const alloc = calculateActivityTimeAllocation(targetMinutes, isLuyenTapLesson);

    let res = periodText;

    // 1. Khởi động / Mở đầu
    res = res.replace(/(HOẠT\s*ĐỘNG\s*(?:KHỞI\s*ĐỘNG|MỞ\s*ĐẦU))\s*\([^)]*?phút[^)]*?\)/gi, `$1 (${alloc.khoiDong} phút)`);

    if (!isLuyenTapLesson) {
      // 2. Hình thành kiến thức mới / Khám phá
      res = res.replace(/(HOẠT\s*ĐỘNG\s*(?:HÌNH\s*THÀNH\s*KIẾN\s*THỨC(?: MỚI)?|KHÁM\s*PHÁ))\s*\([^)]*?phút[^)]*?\)/gi, `$1 (${alloc.hinhThanh} phút)`);

      // Hoạt động 1 & Hoạt động 2
      res = res.replace(/(Hoạt\s*động\s*1\s*:[^(\n]+?)\s*\([^)]*?phút[^)]*?\)/gi, `$1 (${alloc.hinhThanhSub1} phút)`);
      res = res.replace(/(Hoạt\s*động\s*2\s*:[^(\n]+?)\s*\([^)]*?phút[^)]*?\)/gi, `$1 (${alloc.hinhThanhSub2} phút)`);

      // 3. Luyện tập
      res = res.replace(/(HOẠT\s*ĐỘNG\s*(?:LUYỆN\s*TẬP|THỰC\s*HÀNH))\s*\([^)]*?phút[^)]*?\)/gi, `$1 (${alloc.luyenTap} phút)`);

      // 4. Vận dụng
      res = res.replace(/(HOẠT\s*ĐỘNG\s*(?:VẬN\s*DỤNG|TRẢI\s*NGHIỆM))\s*\([^)]*?phút[^)]*?\)/gi, `$1 (${alloc.vanDung} phút)`);
    } else {
      // Tiết Luyện tập / Ôn tập:
      res = res.replace(/(HOẠT\s*ĐỘNG\s*(?:LUYỆN\s*TẬP|THỰC\s*HÀNH))\s*\([^)]*?phút[^)]*?\)/gi, `$1 (${alloc.luyenTap} phút)`);
      res = res.replace(/(HOẠT\s*ĐỘNG\s*(?:VẬN\s*DỤNG|TRẢI\s*NGHIỆM))\s*\([^)]*?phút[^)]*?\)/gi, `$1 (${alloc.vanDung} phút)`);
      res = res.replace(/(HOẠT\s*ĐỘNG\s*(?:TÌM\s*TÒI[,\s]*MỞ\s*RỘNG|MỞ\s*RỘNG))\s*\([^)]*?phút[^)]*?\)/gi, `$1 (${alloc.timToi} phút)`);
    }

    return res;
  }

  // Check if document has period delimiters (e.g. ## **TIẾT 1, ## **TIẾT 2, etc.)
  if (/(?:^|\n)##\s*\*\*(?:TIẾT|Tiết)\s+\d+/i.test(text)) {
    const parts = text.split(/(?=(?:^|\n)##\s*\*\*(?:TIẾT|Tiết)\s+\d+)/i);
    return parts.map(p => balancePeriodText(p)).join('');
  }

  return balancePeriodText(text);
}
