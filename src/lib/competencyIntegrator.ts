/**
 * Utility for safely integrating and updating Competencies & Orientations
 * (Digital Competency TT 02/2025, AI QD 2422 / QD 3439, STEM, QPAN, Environment, Life Skills)
 * into an existing Appendix document or uploaded user file (.docx / .txt / .md / .pdf)
 * WITHOUT modifying any of its original schedule, lessons, periods, dates, table structure, or formatting.
 */

export interface CompetencyInjectionOptions {
  selectedCompetenciesText?: string;
  integrateNLS?: boolean;
  integrateAI?: boolean;
  integrateSTEM?: boolean;
  integrateQPAN?: boolean;
  integrateEnv?: boolean;
  integrateLifeSkills?: boolean;
  integrateHanoiGov?: boolean;
  gradeLevel?: string;
}

// Standard indicator codes mapped to grade levels and subject domains
export interface IndicatorItem {
  code: string;
  name: string;
  domain: string;
  keywords?: string[];
  nlsDetail?: string[];
  aiDetail?: string[];
}

const THEMATIC_INDICATOR_LIBRARY: IndicatorItem[] = [
  // 1. Hardware, Devices, Peripheral, Input/Output
  {
    code: '[NLS: 5.1.TC1a]',
    name: 'Nhận biết thiết bị vào - ra cơ bản, kết nối đúng cổng và an toàn',
    domain: 'Thiết bị & Phần cứng',
    keywords: ['thiết bị', 'vào ra', 'phần cứng', 'máy tính', 'bàn phím', 'chuột', 'màn hình', 'cổng', 'kết nối'],
    nlsDetail: [
      '- NLS: Nhận biết được các thiết bị vào - ra cơ bản và chức năng của chúng (nhập liệu hay xuất dữ liệu), từ đó biết cách kết nối đúng thiết bị vào cổng tương ứng. (5.1.TC1a)',
      '- Biết cách xử lý các tình huống đơn giản như tắt máy an toàn, ngắt kết nối thiết bị ngoại vi (USB, thẻ nhớ) đúng cách để tránh mất dữ liệu. (5.1.TC1b)',
      '- Hiểu và tuân thủ các quy tắc an toàn điện, giữ gìn vệ sinh thiết bị để bảo vệ phần cứng máy tính. (4.1.TC1a)'
    ],
    aiDetail: [
      '- NL AI: Nhận biết được vai trò của các thiết bị vào (như camera, micro) trong việc thu thập dữ liệu âm thanh, hình ảnh làm đầu vào cho quá trình huấn luyện AI (học giám sát). (NLc)'
    ]
  },
  // 2. Software, OS, Application
  {
    code: '[NLS: 5.2.TC1b]',
    name: 'Lựa chọn và sử dụng phần mềm ứng dụng, hệ điều hành phù hợp',
    domain: 'Phần mềm & Hệ điều hành',
    keywords: ['phần mềm', 'hệ điều hành', 'ứng dụng', 'windows', 'scratch', 'word', 'bản quyền'],
    nlsDetail: [
      '- NLS: Lựa chọn phần mềm ứng dụng phù hợp với mục đích sử dụng như dùng Word để soạn thảo, dùng Scratch để lập trình và tương thích với hệ điều hành của máy tính. (5.2.TC1b)',
      '- Nhận biết được vai trò của Hệ điều hành là nền tảng bắt buộc để máy tính hoạt động và chạy các phần mềm khác. (5.4.TC1a)',
      '- Biết cách phân biệt và sử dụng phần mềm có bản quyền hoặc mã nguồn mở để đảm bảo an toàn và tuân thủ pháp luật khi lựa chọn phần mềm. (4.1.TC1a)'
    ],
    aiDetail: [
      '- NL AI: Nêu được hậu quả của việc không xác thực thông tin, kết quả do các phần mềm ứng dụng tích hợp AI (như phần mềm dịch thuật, chatbot) tạo ra trước khi sử dụng trong thực tế. (NLa, A1)'
    ]
  },
  // 3. File & Data Management
  {
    code: '[NLS: 1.3.TC1a]',
    name: 'Tổ chức dữ liệu học tập có cấu trúc, quản lý tệp và thư mục',
    domain: 'Quản lý dữ liệu',
    keywords: ['quản lý dữ liệu', 'tệp', 'thư mục', 'lưu trữ', 'sao lưu', 'virus', 'dữ liệu trong máy'],
    nlsDetail: [
      '- NLS: Thao tác thành thạo với tệp và thư mục: tạo, sao chép, di chuyển, đổi tên, xoá tệp và thư mục; tổ chức cây thư mục bài học khoa học. (1.3.TC1a)',
      '- Biết được tệp chương trình cũng là dữ liệu, có thể được lưu trữ trong máy tính. (1.3.TC1b)',
      '- Nêu được ví dụ về biện pháp bảo vệ dữ liệu như sao lưu dự phòng, phòng chống mã độc và virus. (4.1.TC1a)'
    ],
    aiDetail: [
      '- NL AI: Hiểu được tầm quan trọng của việc thu thập và phân loại dữ liệu có cấu trúc làm tập dữ liệu sạch cho các mô hình AI. (NLc)'
    ]
  },
  // 4. Social Network & Communication
  {
    code: '[NLS: 2.1.TC1b]',
    name: 'Giao tiếp, chia sẻ thông tin an toàn và có trách nhiệm trên mạng xã hội',
    domain: 'Mạng xã hội & Giao tiếp',
    keywords: ['mạng xã hội', 'kênh trao đổi', 'giao tiếp', 'facebook', 'email', 'internet', 'dấu ấn số'],
    nlsDetail: [
      '- NLS: Lựa chọn được phương tiện giao tiếp phù hợp như mạng xã hội, email hay diễn đàn học tập trực tuyến cho từng mục đích trao đổi thông tin cụ thể. (2.1.TC1b)',
      '- Biết cách chia sẻ thông tin, hình ảnh, video học tập trên mạng xã hội một cách an toàn, lành mạnh và có trách nhiệm. (2.2.TC1a)',
      '- Biết tạo và quản lý hồ sơ cá nhân trên môi trường số, hiểu rằng những thông tin đăng tải sẽ tạo nên "dấu ấn số" lâu dài. (2.6.TC1b)',
      '- Biết cách cài đặt các quyền riêng tư cơ bản cho tài khoản cá nhân, không chia sẻ công khai các thông tin nhạy cảm. (4.2.TC1a)',
      '- Nhận biết và chủ động phòng tránh các nguy cơ bị bắt nạt, lừa đảo hoặc tiếp xúc với thông tin xấu độc trên không gian mạng. (4.3.TC1b)'
    ],
    aiDetail: [
      '- NL AI: Nêu được hậu quả của việc không xác thực các thông tin do AI tạo ra (như hình ảnh Deepfake, tin tức giả do AI viết) trước khi chia sẻ chúng trên mạng xã hội. (NLa - Xác thực kết quả)',
      '- Thể hiện thái độ và cam kết sử dụng các công cụ AI trên mạng xã hội một cách có trách nhiệm, không dùng AI để bôi nhọ, lừa đảo người khác. (NLb - Trách nhiệm khi sử dụng AI)'
    ]
  },
  // 5. Online Ethics, Culture & Well-being
  {
    code: '[NLS: 2.5.TC1a]',
    name: 'Ứng xử văn minh, bảo vệ quyền riêng tư và phòng tránh nghiện Internet',
    domain: 'Đạo đức & Văn hóa số',
    keywords: ['ứng xử trên mạng', 'văn hóa', 'đạo đức', 'bảo vệ thông tin', 'nghiện internet', 'bản quyền'],
    nlsDetail: [
      '- NLS: Biết và tuân thủ các quy tắc giao tiếp văn minh, lịch sự khi trao đổi ý kiến với bạn bè trên không gian mạng. (2.5.TC1a)',
      '- Biết bảo vệ thông tin cá nhân của bản thân và tôn trọng quyền riêng tư của người khác khi chia sẻ hình ảnh, bài viết trên mạng xã hội. (4.2.TC1a)',
      '- Nhận biết các dấu hiệu, tác hại của việc nghiện Internet để tự điều chỉnh thời gian sử dụng thiết bị số một cách hợp lý. (4.3.TC1a)'
    ],
    aiDetail: [
      '- NL AI: Nêu được hậu quả của việc không xác thực các thông tin, hình ảnh do AI tạo ra trong thực tế và biết cách kiểm chứng nguồn tin. (NLa.A1)',
      '- Thể hiện thái độ và cam kết sử dụng công cụ AI có trách nhiệm thông qua sản phẩm truyền thông của nhóm. (NLb.B3)'
    ]
  },
  // 6. Spreadsheet Basics & Data Formatting
  {
    code: '[NLS: 1.3.TC1a]',
    name: 'Tổ chức bảng số liệu khảo sát, định dạng bảng tính rõ ràng',
    domain: 'Phần mềm bảng tính',
    keywords: ['bảng tính', 'làm quen với phần mềm bảng tính', 'excel', 'ô tính', 'cột', 'hàng', 'định dạng bảng tính'],
    nlsDetail: [
      '- NLS: Tổ chức dữ liệu khảo sát dự án học tập dưới dạng bảng biểu có cấu trúc rõ ràng trên phần mềm Excel để dễ dàng lưu trữ, tìm kiếm và cập nhật thông tin. (1.3.TC1a)',
      '- Nhận biết và giải thích được lý do nên sử dụng phần mềm bảng tính để quản lý, tính toán số liệu khảo sát thay vì dùng phần mềm soạn thảo văn bản. (5.2.TC1a)',
      '- Lựa chọn và sử dụng thành thạo các công cụ định dạng phông chữ, màu nền, căn lề trong nhóm lệnh Font và Alignment của Excel để trình bày bảng dữ liệu khảo sát rõ ràng, dễ hiểu. (5.2.TC1b)'
    ],
    aiDetail: [
      '- NL AI: Nêu được hậu quả khi không xác thực kết quả do AI gợi ý hoặc xử lý trong thực tế đối với việc quản lý dữ liệu dự án. (NLa)'
    ]
  },
  // 7. Spreadsheet Calculations & Formulas
  {
    code: '[NLS: 5.2.TC1a]',
    name: 'Tính toán tự động bằng công thức và hàm, hoàn thiện bảng tính',
    domain: 'Tính toán bảng tính',
    keywords: ['tính toán tự động', 'công thức', 'hàm', 'sum', 'average', 'max', 'min', 'công cụ hỗ trợ tính toán', 'hoàn thiện bảng tính', 'trình bày bảng tính'],
    nlsDetail: [
      '- NLS: Nhận biết kiểu dữ liệu trên bảng tính, sử dụng công thức và địa chỉ ô để điều khiển tính toán tự động trên dữ liệu số. (5.2.TC1a)',
      '- Thực hiện được các phép toán thông dụng và hàm cơ bản (SUM, AVERAGE, MAX, MIN, COUNT) để xử lý số liệu. (5.2.TC1b)',
      '- Thực hiện các thao tác định dạng, căn chỉnh và in ấn để tạo ra bảng tính hoàn chỉnh, có tính thẩm mỹ và dễ đọc, phục vụ báo cáo hoặc lưu trữ. (3.1.TC1a)'
    ],
    aiDetail: [
      '- NL AI: Khai thác AI gợi ý công thức tính toán và phát hiện lỗi cú pháp trong bảng dữ liệu lớn. (NLa, A1)'
    ]
  },
  // 8. Presentations (PowerPoint / Slides)
  {
    code: '[NLS: 3.1.TC1a]',
    name: 'Thiết kế bài trình chiếu đa phương tiện, bố cục Layout chuyên nghiệp',
    domain: 'Trình chiếu & Báo cáo',
    keywords: ['bài trình chiếu', 'tạo bài trình chiếu', 'powerpoint', 'slide', 'định dạng đối tượng trên trang chiếu', 'thực hành tổng hợp'],
    nlsDetail: [
      '- NLS: Sử dụng phần mềm trình chiếu PowerPoint để tạo bài trình chiếu báo cáo dự án học tập chứa văn bản và hình ảnh trực quan. (3.1.TC1a)',
      '- Tổ chức thông tin trong bài trình chiếu theo cấu trúc phân cấp gồm tiêu đề trang, nội dung chính và nội dung chi tiết để bài trình bày mạch lạc, dễ hiểu. (3.2.TC1a)',
      '- Lựa chọn các mẫu bố trí Layout có sẵn trong PowerPoint để trình bày nội dung các trang chiếu một cách chuyên nghiệp và thẩm mỹ. (5.2.TC1b)'
    ],
    aiDetail: [
      '- NL AI: NLa.A1.7: Nhận biết và giải thích được tầm quan trọng của việc xác thực thông tin do các công cụ AI cung cấp trước khi đưa vào bài trình chiếu.',
      '- NLb.B3.7: Thể hiện thái độ và cam kết sử dụng AI có trách nhiệm thông qua việc trích dẫn nguồn rõ ràng khi sử dụng nội dung hoặc hình ảnh do AI tạo ra trong sản phẩm trình chiếu.'
    ]
  },
  // 9. Search & Sort Algorithms
  {
    code: '[NLS: 3.4.TC1a]',
    name: 'Mô phỏng thuật toán tìm kiếm tuần tự, tìm kiếm nhị phân và sắp xếp',
    domain: 'Tư duy thuật toán',
    keywords: ['thuật toán', 'tìm kiếm tuần tự', 'tìm kiếm nhị phân', 'thuật toán sắp xếp', 'sắp xếp', 'mô phỏng thuật toán'],
    nlsDetail: [
      '- NLS: Hiểu và mô tả được thuật toán tìm kiếm tuần tự / nhị phân bằng cách xét từng phần tử hoặc chia đôi khoảng tìm kiếm trên danh sách dữ liệu đã sắp xếp. (3.4.TC1a)',
      '- Nhận ra ưu điểm vượt trội của thuật toán tối ưu khi dữ liệu danh sách khách hàng đã được sắp xếp để lựa chọn giải pháp giải quyết bài toán thực tế. (5.2.TC1a)'
    ],
    aiDetail: [
      '- NL AI: Nêu được hậu quả khi không xác thực kết quả do AI cung cấp trong thực tế tìm kiếm thông tin; rèn luyện tư duy lấy con người làm trung tâm, xác thực kết quả. (NLa.A1.TC)'
    ]
  },
  // 10. Mathematics & Science General Integration
  {
    code: '[NLS: 1.1TC1a]',
    name: 'Khai thác phần mềm hình học động, đồ thị và trực quan hóa dữ liệu toán học',
    domain: 'Toán & Khoa học',
    keywords: ['toán', 'hình học', 'số học', 'phân số', 'đại số', 'thống kê', 'xác suất', 'khtn', 'vật lý', 'hóa học', 'sinh học'],
    nlsDetail: [
      '- NLS: Ứng dụng phần mềm vẽ hình động (GeoGebra/Desmos) hoặc máy tính cầm tay để kiểm chứng kết quả và trực quan hóa bài toán. (5.2.TC1a)',
      '- Tìm kiếm, trích xuất và chọn lọc tư liệu khoa học số đáng tin cậy phục vụ bài học. (1.1.TC1a)'
    ],
    aiDetail: [
      '- NL AI: Sử dụng AI hỗ trợ phân tích các bước giải bài toán và so sánh các phương pháp giải tối ưu. (AI: 2.B1)'
    ]
  },
  // 11. Language, Literature & Social Sciences
  {
    code: '[NLS: 3.1TC1a]',
    name: 'Soạn thảo văn bản số, thiết kế sơ đồ tư duy phân tích tác phẩm/sự kiện',
    domain: 'Khoa học Xã hội & Ngôn ngữ',
    keywords: ['văn', 'ngữ văn', 'lịch sử', 'địa lí', 'tiếng anh', 'ngoại ngữ', 'gdcd', 'âm nhạc', 'mĩ thuật'],
    nlsDetail: [
      '- NLS: Sử dụng phần mềm sơ đồ tư duy (XMind/Mindmeister) và xử lý văn bản số để hệ thống hóa kiến thức bài học. (3.1.TC1a)',
      '- Giao tiếp, chia sẻ sản phẩm học tập hợp tác trên không gian số văn minh. (2.2.TC1a)'
    ],
    aiDetail: [
      '- NL AI: Nhận thức về bản quyền tác phẩm số, liêm chính học thuật và xác thực thông tin do AI tạo ra. (AI: 4.D1)'
    ]
  }
];

/**
 * Extracts distinct, readable competency items from selected items text or defaults.
 */
function buildCompetencyList(options: CompetencyInjectionOptions): {
  domains: string[];
  indicators: { code: string; name: string; domain: string }[];
} {
  const {
    selectedCompetenciesText = '',
    integrateNLS = true,
    integrateAI = true,
    integrateSTEM = true,
    integrateQPAN = false,
    integrateEnv = true,
    integrateLifeSkills = true,
    gradeLevel = 'Lớp 7'
  } = options;

  const domains: string[] = [];
  if (integrateNLS) domains.push('Năng lực Số (Thông tư 02/2025/TT-BGDĐT)');
  if (integrateAI) domains.push('Khung Giáo dục Trí tuệ Nhân tạo AI (Quyết định 2422 & QĐ 3439/QĐ-BGDĐT)');
  if (integrateSTEM) domains.push('Giáo dục STEM / STEAM & Dạy học Liên môn');
  if (integrateQPAN) domains.push('Giáo dục Quốc phòng & An ninh (QPAN)');
  if (integrateEnv) domains.push('Bảo vệ Môi trường & Ứng phó Biến đổi Khí hậu');
  if (integrateLifeSkills) domains.push('Kỹ năng sống & Công dân số');

  const defaultPool = THEMATIC_INDICATOR_LIBRARY.map(item => ({
    code: item.code,
    name: item.name,
    domain: item.domain
  }));

  // Parse custom selected items if present
  let indicators: { code: string; name: string; domain: string }[] = [];

  if (selectedCompetenciesText && selectedCompetenciesText.trim()) {
    const rawLines = selectedCompetenciesText
      .split('\n')
      .map(l => l.trim().replace(/^[-*•\d\.]+\s*/, '').replace(/^\+\s*/, ''))
      .filter(l => l.length > 3);

    rawLines.forEach(line => {
      // Clean corrupted junk strings like "[r] õ..."
      const cleanLine = line.replace(/\[r\]\s*õ[^\n]*/gi, '').trim();
      if (!cleanLine || cleanLine.length < 3) return;

      // Only match if line contains an explicit standardized code
      // E.g. [NLS: 1.1TC1a], 1.1TC1a:, [AI: 1.A1], 1.A1, [STEM], [QPAN], 2.1TC1b
      const match = cleanLine.match(/^(\[[A-Za-z0-9\.\-_: ]+\]|\b\d+\.\d+[A-Za-z0-9]*\b|\b[A-Z]{2,6}\d*\b|\b\d+\.[A-Z]\d*(?:\.\d+)?\b)(?::|\s*-|\s*–)?\s*(.*)$/);
      if (match) {
        let code = match[1].trim();
        // Ignore single letter accidental tokens like [r] or R
        if (code.replace(/[\[\]]/g, '').trim().length <= 1) return;
        if (!code.startsWith('[')) {
          if (/\b(?:TC|CB|NC)\d*[a-z]?\b/i.test(code) || /^\d+\.\d+/.test(code)) {
            code = `[NLS: ${code}]`;
          } else if (/^[A-Z]+\d+/i.test(code) || /^\d+\.[A-Z]/i.test(code)) {
            code = `[AI: ${code}]`;
          } else {
            code = `[${code}]`;
          }
        }
        const name = match[2] || cleanLine;
        indicators.push({ code, name, domain: 'Chỉ báo đã chọn' });
      }
    });
  }

  // If no valid indicators found, merge with standard indicators pool
  if (indicators.length === 0) {
    indicators = defaultPool.filter(item => {
      if (!integrateNLS && item.code.includes('NLS')) return false;
      if (!integrateAI && item.code.includes('AI')) return false;
      if (!integrateSTEM && item.code.includes('STEM')) return false;
      if (!integrateQPAN && item.code.includes('QPAN')) return false;
      if (!integrateEnv && item.code.includes('Môi trường')) return false;
      return true;
    });
  }

  // Final sanity fallback: ensure indicators is never empty
  if (indicators.length === 0) {
    indicators = defaultPool;
  }

  return { domains, indicators };
}

/**
 * Parses and merges competencies into an existing Appendix Markdown table, text sections, and Section III.
 * Guarantees that:
 * 1. Document title, headers, department, school, signers, and metadata are 100% PRESERVED.
 * 2. Every row, week, lesson name, period count, period numbering of the original table is 100% PRESERVED.
 * 3. Explicit Indicator Codes (e.g. [NLS: 1.1TC1a], [AI: 1.A1], [STEM]) are injected into the integration column.
 * 4. Section III (Danh mục mã chỉ báo năng lực tích hợp) is fully rendered with standard indicator tables.
 */
export function injectCompetenciesIntoAppendix(
  originalDocMarkdown: string,
  options: CompetencyInjectionOptions = {}
): string {
  if (!originalDocMarkdown || !originalDocMarkdown.trim()) {
    return originalDocMarkdown;
  }

  // Clean any legacy corrupted text fragments
  let updatedDoc = originalDocMarkdown
    .replace(/\[r\]\s*õ\s*mã\s*các\s*chỉ\s*báo\s*năng\s*lực\s*số/gi, '')
    .replace(/\[r\]\s*õ\s*mã\s*các\s*chỉ\s*báo/gi, '')
    .replace(/\[r\]\s*õ/gi, '');

  const { domains, indicators } = buildCompetencyList(options);

  // 1. Build Section III (Danh mục các mã chỉ báo Năng lực Số, AI & Nội dung tích hợp)
  let section3TableRows = '';
  let stt = 1;

  indicators.forEach(ind => {
    section3TableRows += `| ${stt++} | **${ind.code}** | ${ind.name} | Tích hợp vào bài học tương ứng, ứng dụng công cụ số/AI phù hợp |\n`;
  });

  domains.forEach(d => {
    if (!indicators.some(i => i.name.includes(d))) {
      section3TableRows += `| ${stt++} | **[Định hướng]** | ${d} | Vận dụng linh hoạt theo phân phối chương trình cả năm |\n`;
    }
  });

  const section3Regex = /(##\s*(?:III|3|IV|4)\.\s*(?:DANH MỤC MÃ CHỈ BÁO|DANH MỤC NỘI DUNG TÍCH HỢP|CÁC NỘI DUNG TÍCH HỢP|NỘI DUNG TÍCH HỢP|ĐỊNH HƯỚNG TÍCH HỢP|DANH MỤC NĂNG LỰC SỐ)[^\n]*)([\s\S]*?)(?=(?:\n\s*##|\n\s*---|Tây Phương|Hà Nội|Ngày|\n\s*\|\s*\*\*HIỆU TRƯỞNG|\n\s*\|\s*\*\*XÁC NHẬN|\n\s*\|\s*\*\*DUYỆT|$))/i;

  const standardSection3Content = `## III. DANH MỤC MÃ CHỈ BÁO NĂNG LỰC SỐ (TT 02/2025), AI (QĐ 2422/3439) & NỘI DUNG TÍCH HỢP\n\n| STT | Mã chỉ báo / Lĩnh vực | Nội dung chỉ báo chuẩn (TT 02/2025/TT-BGDĐT & Khung AI) | Gợi ý hình thức tích hợp vào bài dạy |\n|:---:|:---|:---|:---|\n${section3TableRows}\n`;

  if (section3Regex.test(updatedDoc)) {
    updatedDoc = updatedDoc.replace(section3Regex, standardSection3Content);
  } else {
    // If no Section III exists yet, insert before Signatures or before End of File
    const sigMatch = updatedDoc.search(/(?:Tây Phương|Hà Nội|Ngày\s+\d+|\|\s*\*\*HIỆU TRƯỞNG|\|\s*\*\*XÁC NHẬN|\|\s*\*\*DUYỆT)/i);
    const section3Block = `\n\n${standardSection3Content}\n`;

    if (sigMatch !== -1) {
      updatedDoc = updatedDoc.slice(0, sigMatch) + section3Block + '\n' + updatedDoc.slice(sigMatch);
    } else {
      updatedDoc += section3Block;
    }
  }

  // 2. Safely enrich Tables with explicit Indicator Codes without breaking existing columns/rows
  const lines = updatedDoc.split('\n');
  const enrichedLines: string[] = [];
  let inTable = false;
  let tableHeaderCols: string[] = [];
  let lessonColIdx = -1;
  let sttColIdx = -1;
  let yccdIdx = -1;
  let ghiChuIdx = -1;
  let nlsColIdx = -1;
  let aiColIdx = -1;
  let validLessonRowIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|') && !trimmed.startsWith('#')) {
      const cols = trimmed.split('|').map(c => c.trim());
      if (cols.length > 2) {
        // Drop first and last empty elements from split
        cols.shift();
        cols.pop();

        const isDivider = /^[:\s|-]+$/.test(cols.join(''));

        if (!inTable) {
          // This is the Table Header line
          inTable = true;
          tableHeaderCols = cols;
          validLessonRowIndex = 0;

          // Identify columns accurately
          sttColIdx = cols.findIndex(c => /^\s*stt\s*$/i.test(c));
          lessonColIdx = cols.findIndex(c => /bài học|tên bài|nội dung dạy học|chủ đề/i.test(c));
          yccdIdx = cols.findIndex(c => /yêu cầu cần đạt|yccđ/i.test(c));
          ghiChuIdx = cols.findIndex(c => /ghi chú|điều chỉnh|bổ sung/i.test(c));
          nlsColIdx = cols.findIndex(c => /năng lực số|mã nls|chỉ báo nls/i.test(c));
          aiColIdx = cols.findIndex(c => /năng lực ai|trí tuệ nhân tạo|mã ai/i.test(c));

          enrichedLines.push(line);
          continue;
        }

        if (isDivider) {
          enrichedLines.push(line);
          continue;
        }

        // Clean any accidental remnants and outdated placeholders
        let cleanedCols = cols.map(c => 
          c
            .replace(/\[r\]\s*õ[^\)]*/gi, '')
            .replace(/\(NLSC\d+\)/gi, '')
            .replace(/\bNLSC\d+\b/gi, '')
            .replace(/\(NLS\d+\)/gi, '')
            .trim()
        );

        // Determine if this row is an actual lesson row (and NOT a chapter header, exam row, or empty row)
        const sttVal = sttColIdx >= 0 && sttColIdx < cleanedCols.length ? cleanedCols[sttColIdx] : '';
        const lessonVal = lessonColIdx >= 0 && lessonColIdx < cleanedCols.length ? cleanedCols[lessonColIdx] : '';
        const isChapterHeader = /^(?:chương|phần|chủ đề|học kỳ|học kì|bài học stem|hoạt động trải nghiệm)/i.test(lessonVal) ||
                                /^(?:chương|phần|học kỳ|học kì)/i.test(sttVal);
        const isExamRow = /^(?:kiểm tra|ôn tập|đánh giá định kỳ)/i.test(lessonVal);
        const isEmptyRow = cleanedCols.every(c => !c || c === '-' || c === 'None');

        const isActualLesson = !isChapterHeader && !isExamRow && !isEmptyRow && (
          /^(?:\d+|[A-ZIVX]+)$/.test(sttVal) ||
          /^(?:bài|tiết|chủ đề)/i.test(lessonVal) ||
          (lessonVal.length > 3 && lessonVal !== '-')
        );

        if (isActualLesson) {
          validLessonRowIndex++;

          // Match the best thematic indicator item from the library based on lesson name
          const lowerLesson = lessonVal.toLowerCase();
          let matchedItem = THEMATIC_INDICATOR_LIBRARY.find(item => 
            item.keywords && item.keywords.some(kw => lowerLesson.includes(kw))
          );
          if (!matchedItem) {
            matchedItem = THEMATIC_INDICATOR_LIBRARY[(validLessonRowIndex - 1) % THEMATIC_INDICATOR_LIBRARY.length];
          }

          const nlsTexts = matchedItem.nlsDetail || [`- NLS: ${matchedItem.name} (${matchedItem.code})`];
          const aiTexts = matchedItem.aiDetail || [`- NL AI: Vận dụng AI hỗ trợ học tập và xác thực thông tin. (AI: 1.A1)`];

          // CASE 1: Table has separate "Năng lực số" and "Năng lực AI" columns (PL1 variant)
          if (nlsColIdx >= 0 && nlsColIdx < cleanedCols.length && aiColIdx >= 0 && aiColIdx < cleanedCols.length) {
            let nlsCell = cleanedCols[nlsColIdx];
            let aiCell = cleanedCols[aiColIdx];

            if (!nlsCell || nlsCell === '-' || nlsCell === '...' || !nlsCell.includes('TC1')) {
              cleanedCols[nlsColIdx] = nlsTexts.map(t => t.replace(/^-\s*NLS:\s*/i, '- ')).join('<br>');
            }
            if (!aiCell || aiCell === '-' || aiCell === '...' || (!aiCell.includes('AI') && !aiCell.includes('NL'))) {
              cleanedCols[aiColIdx] = aiTexts.map(t => t.replace(/^-\s*NL\s*AI:\s*/i, '- ')).join('<br>');
            }
          }
          // CASE 2: Table is PL3 with "Ghi chú" column (Bảng 7-8 cột)
          else if (ghiChuIdx >= 0 && ghiChuIdx < cleanedCols.length) {
            let ghiChuCell = cleanedCols[ghiChuIdx];
            const alreadyHasNLS = ghiChuCell.includes('NLS') || ghiChuCell.includes('TC1') || ghiChuCell.includes('[NLS:');

            if (!alreadyHasNLS) {
              const fullDetails = [...nlsTexts, ...aiTexts].join('<br>');
              if (!ghiChuCell || ghiChuCell === '-' || ghiChuCell === '...' || ghiChuCell === 'None') {
                cleanedCols[ghiChuIdx] = fullDetails;
              } else {
                cleanedCols[ghiChuIdx] = `${ghiChuCell}<br>${fullDetails}`;
              }
            }
          }
          // CASE 3: Table is PL1 with single "Yêu cầu cần đạt" column
          else if (yccdIdx >= 0 && yccdIdx < cleanedCols.length) {
            let yccdCell = cleanedCols[yccdIdx];
            const alreadyHasNLS = yccdCell.includes('[NLS:') || yccdCell.includes('TC1') || yccdCell.includes('Năng lực số');

            if (!alreadyHasNLS) {
              const fullDetails = [...nlsTexts, ...aiTexts].join('<br>');
              if (!yccdCell || yccdCell === '-' || yccdCell === '...') {
                cleanedCols[yccdIdx] = fullDetails;
              } else {
                cleanedCols[yccdIdx] = `${yccdCell}<br>${fullDetails}`;
              }
            }
          }
        }

        enrichedLines.push('| ' + cleanedCols.map(c => c || '-').join(' | ') + ' |');
        continue;
      }
    } else {
      inTable = false;
      enrichedLines.push(line);
    }
  }

  // 3. For Lesson Plans (KHBD - Phụ lục 3 CV 5512 or CV 2345):
  let result = enrichedLines.join('\n');

  if (result.includes('YÊU CẦU CẦN ĐẠT') || result.includes('Yêu cầu cần đạt')) {
    if (!result.includes('Thông tư 02/2025/TT-BGDĐT') && !result.includes('TT 02/2025')) {
      const topCodes = indicators.slice(0, 3).map(i => `- **${i.code}:** ${i.name}`).join('\n');
      result = result.replace(
        /(###?\s*(?:2|b)\.\s*(?:Năng lực chung|Năng lực)[^\n]*)/i,
        `$1\n- **Năng lực Số (Thông tư 02/2025/TT-BGDĐT) & AI (QĐ 2422/3439):**\n${topCodes}`
      );
    }
  }

  return result;
}

