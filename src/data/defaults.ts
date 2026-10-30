import { ClassProfile } from '../types';

export const SUBJECT_LIST = [
  "Tiếng Việt (Tiểu học)",
  "Toán (Tiểu học)",
  "Tự nhiên và Xã hội (Tiểu học)",
  "Khoa học (Tiểu học)",
  "Lịch sử và Địa lí (Tiểu học)",
  "Đạo đức (Tiểu học)",
  "Tin học và Công nghệ (Tiểu học)",
  "Giáo dục thể chất (Tiểu học)",
  "Âm nhạc (Tiểu học)",
  "Mĩ thuật (Tiểu học)",
  "Hoạt động Trải nghiệm (Tiểu học)",
  "Tiếng Anh (Tiểu học)",
  "Khoa học Tự nhiên",
  "Toán học",
  "Ngữ văn",
  "Ngoại ngữ (Tiếng Anh)",
  "Vật lí (THPT)",
  "Hóa học (THPT)",
  "Sinh học (THPT)",
  "Lịch sử và Địa lí",
  "Lịch sử (THPT)",
  "Địa lí (THPT)",
  "Giáo dục công dân",
  "Giáo dục Kinh tế và Pháp luật (THPT)",
  "Tin học",
  "Công nghệ",
  "Nghệ thuật (Âm nhạc, Mĩ thuật)",
  "Giáo dục thể chất",
  "Hoạt động Trải nghiệm (Tiểu học / THCS / THPT)",
  "GD địa phương"
];

export const SUB_SUBJECTS: Record<string, string[]> = {
  "Tiếng Việt (Tiểu học)": ["Chung", "Đọc (Tập đọc)", "Viết (Chính tả, Tập làm văn)", "Nói và nghe", "Luyện từ và câu"],
  "Toán (Tiểu học)": ["Chung", "Số và phép tính", "Hình học và Đo lường", "Một số yếu tố Thống kê và Xác suất", "Hoạt động thực hành và trải nghiệm"],
  "Tự nhiên và Xã hội (Tiểu học)": ["Chung", "Gia đình", "Trường học", "Cộng đồng địa phương", "Thực vật và Động vật", "Con người và Sức khỏe", "Trái Đất và Bầu trời"],
  "Khoa học (Tiểu học)": ["Chung", "Chất", "Năng lượng", "Thực vật và Động vật", "Nấm, vi khuẩn, virus", "Con người và Sức khỏe", "Sinh vật và Môi trường"],
  "Lịch sử và Địa lí (Tiểu học)": ["Chung", "Địa phương em", "Các vùng miền Việt Nam", "Lịch sử dựng nước và giữ nước"],
  "Đạo đức (Tiểu học)": ["Chung", "Chuẩn mực hành vi", "Kỹ năng sống & Ứng xử"],
  "Tin học và Công nghệ (Tiểu học)": ["Chung", "Tin học", "Công nghệ và Đời sống", "Thủ công kĩ thuật"],
  "Giáo dục thể chất (Tiểu học)": ["Chung", "Đội hình đội ngũ", "Bài tập thể dục", "Tư thế và kỹ năng vận động cơ bản", "Thể thao tự chọn"],
  "Âm nhạc (Tiểu học)": ["Chung", "Hát", "Nghe nhạc", "Đọc nhạc", "Nhạc cụ", "Thường thức âm nhạc"],
  "Mĩ thuật (Tiểu học)": ["Chung", "Mĩ thuật tạo hình", "Mĩ thuật ứng dụng", "Trưng bày và cảm thụ"],
  "Hoạt động Trải nghiệm (Tiểu học)": ["Chung", "Sinh hoạt dưới cờ", "Hoạt động giáo dục theo chủ đề", "Sinh hoạt lớp"],
  "Tiếng Anh (Tiểu học)": ["Chung", "Nghe", "Nói", "Đọc", "Viết"],
  "Khoa học Tự nhiên": ["Chung", "Vật lí", "Hóa học", "Sinh học"],
  "Lịch sử và Địa lí": ["Chung", "Lịch sử", "Địa lí"],
  "Toán học": ["Chung", "Đại số / Số học", "Hình học", "Thống kê & Xác suất"],
  "Nghệ thuật (Âm nhạc, Mĩ thuật)": ["Chung", "Âm nhạc", "Mĩ thuật"],
  "Hoạt động Trải nghiệm (Tiểu học / THCS / THPT)": ["Chung", "Sinh hoạt dưới cờ", "Hoạt động giáo dục theo chủ đề", "Sinh hoạt lớp"],
  "Mặc định": ["Chung"]
};

export const DEFAULT_PP = [
  "Dạy học nhóm / Hợp tác",
  "Dạy học Tích cực",
  "Dạy học giải quyết vấn đề (PBL)",
  "Dạy học theo Dự án (PBL)",
  "Bàn tay nặn bột",
  "Dạy học theo Trạm",
  "Dạy học khám phá (Inquiry-based)",
  "Lớp học Đảo ngược (Flipped Classroom)",
  "Hành trình Thám hiểm/Cốt truyện",
  "Dạy học Tích hợp theo Mô đun định hướng năng lực",
  "WebQuest",
  "Dạy học theo góc"
];

export const DEFAULT_KT = [
  "1. Kỹ thuật Các mảnh ghép (Jigsaw)",
  "2. Kỹ thuật Khăn trải bàn",
  "3. Kỹ thuật Động não (Brainstorming)",
  "4. Kỹ thuật Bể cá",
  "5. Kỹ thuật Tia chớp",
  "6. Kỹ thuật XYZ (Kỹ thuật 635)",
  "7. Kỹ thuật Sơ đồ tư duy",
  "8. Kỹ thuật Chia sẻ nhóm đôi (Think, Pair, Share)",
  "9. Kỹ thuật Kipling (5W1H)",
  "10. Kỹ thuật Trình bày một phút",
  "11. Kỹ thuật Phân tích phim Video",
  "12. Kỹ thuật Đóng vai",
  "13. Kỹ thuật Trò chơi",
  "14. Kỹ thuật Dự án",
  "15. Kỹ thuật Giao nhiệm vụ",
  "16. Kỹ thuật Đặt câu hỏi",
  "17. Kỹ thuật Giải quyết vấn đề",
  "18. Kỹ thuật Phòng tranh",
  "19. Kỹ thuật Công đoạn",
  "20. Kỹ thuật Hỏi Chuyên gia",
  "21. Kỹ thuật KWL (KWLH)",
  "22. Kỹ thuật Ổ bi",
  "23. Kỹ thuật Tranh luận ủng hộ – Phản đối",
  "24. Kỹ thuật Thông tin phản hồi trong dạy học",
  "25. Kỹ thuật 3 lần 3",
  "26. Kỹ thuật Chia nhóm đa dạng",
  "27. Kỹ thuật Chúng em biết 3",
  "28. Kỹ thuật Viết tích cực",
  "29. Kỹ thuật Đọc tích cực / Đọc hợp tác",
  "30. Kỹ thuật Hỏi và trả lời (Vấn đáp vòng tròn)",
  "31. Kỹ thuật Nói cách khác",
  "32. Kỹ thuật Tóm tắt nội dung tài liệu theo nhóm"
];

export const TEXTBOOK_LIST = [
  "Kết nối tri thức với cuộc sống"
];

export const TEXTBOOK_TAP = [
  "Tập 1",
  "Tập 2",
  "Cả năm (1 tập)"
];

export const DEFAULT_PROFILES: Record<string, ClassProfile> = {
  "1A1": {
    lop: "1A1",
    mon: "Tiếng Việt (Tiểu học)",
    phan_mon: "Đọc (Tập đọc)",
    siso: "35",
    nangluc: "Tiếp thu nhanh, ham học hỏi",
    thoiluong: "35 phút (Tiểu học)",
    loaiga: "Kế hoạch bài dạy chuẩn CV 2345 (Tiểu học)",
    ngaysoan: new Date().toISOString().split("T")[0],
    boSach: "Kết nối tri thức với cuộc sống",
    sgkTap: "Tập 1",
    monTichHop: "Toán, Tự nhiên và Xã hội, Âm nhạc, Mĩ thuật",
    bghSigner: "Nguyễn Thị Mai",
    deptSigner: "Tổ trưởng Khối 1",
    teacherSigner: "Cô Giáo Tiểu học",
    k1Periods: 108,
    k2Periods: 102,
    totalYearPeriods: 210,
    soGiaoVien: '05 giáo viên',
    trinhDoDaoTao: '100% Cử nhân Giáo dục Tiểu học',
    thietBiDayHoc: 'Tivi thông minh, Tranh chữ cái, Bộ thẻ từ, Thước chỉ, Phiếu bài tập màu',
    phongHocBoMon: 'Phòng học chuẩn có máy tính và tivi tương tác'
  },
  "2A": {
    lop: "2A",
    mon: "Toán (Tiểu học)",
    phan_mon: "Số và phép tính",
    siso: "36",
    nangluc: "Đại trà, tích cực hoạt động nhóm",
    thoiluong: "35 phút (Tiểu học)",
    loaiga: "Kế hoạch bài dạy chuẩn CV 2345 (Tiểu học)",
    ngaysoan: new Date().toISOString().split("T")[0],
    boSach: "Kết nối tri thức với cuộc sống",
    sgkTap: "Tập 1",
    monTichHop: "Tiếng Việt, Hoạt động trải nghiệm, Mĩ thuật",
    bghSigner: "Nguyễn Thị Mai",
    deptSigner: "Tổ trưởng Khối 2",
    teacherSigner: "Cô Giáo Tiểu học",
    k1Periods: 90,
    k2Periods: 85,
    totalYearPeriods: 175,
    soGiaoVien: '04 giáo viên',
    trinhDoDaoTao: '100% Cử nhân Sư phạm Tiểu học',
    thietBiDayHoc: 'Bộ đồ dùng học Toán lớp 2, Que tính, Mô hình đồng hồ, Tivi tương tác',
    phongHocBoMon: 'Phòng học chuẩn kết nối mạng Internet'
  },
  "3A1": {
    lop: "3A1",
    mon: "Tự nhiên và Xã hội (Tiểu học)",
    phan_mon: "Thực vật và Động vật",
    siso: "38",
    nangluc: "Hứng thú khám phá thực tế",
    thoiluong: "35 phút (Tiểu học)",
    loaiga: "Kế hoạch bài dạy chuẩn CV 2345 (Tiểu học)",
    ngaysoan: new Date().toISOString().split("T")[0],
    boSach: "Kết nối tri thức với cuộc sống",
    sgkTap: "Tập 1",
    monTichHop: "Tiếng Việt, Đạo đức, Mĩ thuật, Kỹ năng sống",
    bghSigner: "Nguyễn Thị Mai",
    deptSigner: "Tổ trưởng Khối 3",
    teacherSigner: "Cô Giáo Tiểu học",
    k1Periods: 36,
    k2Periods: 34,
    totalYearPeriods: 70,
    soGiaoVien: '04 giáo viên',
    trinhDoDaoTao: '100% Chuẩn Cử nhân Đại học',
    thietBiDayHoc: 'Tivi thông minh, Tranh ảnh cây cối động vật, Mẫu vật tự nhiên ép khô',
    phongHocBoMon: 'Phòng học bộ môn / Không gian trải nghiệm ngoài trời'
  },
  "4A1": {
    lop: "4A1",
    mon: "Khoa học (Tiểu học)",
    phan_mon: "Chung",
    siso: "38",
    nangluc: "Đại trà, tích cực hoạt động",
    thoiluong: "35 phút (Tiểu học)",
    loaiga: "Kế hoạch bài dạy chuẩn CV 2345 (Tiểu học)",
    ngaysoan: new Date().toISOString().split("T")[0],
    boSach: "Kết nối tri thức với cuộc sống",
    sgkTap: "Tập 1",
    monTichHop: "Tiếng Việt, Mĩ thuật, Tự nhiên & Xã hội",
    bghSigner: "Nguyễn Thị Mai",
    deptSigner: "Tổ trưởng Khối 4",
    teacherSigner: "Cô Giáo Tiểu học",
    k1Periods: 36,
    k2Periods: 34,
    totalYearPeriods: 70,
    mathStreamMode: 'parallel',
    daiSoK1Periods: 20,
    daiSoK2Periods: 20,
    hinhHocK1Periods: 16,
    hinhHocK2Periods: 14,
    soGiaoVien: '04 giáo viên',
    trinhDoDaoTao: '100% Đạt chuẩn Cử nhân GD Tiểu học',
    thietBiDayHoc: 'Tivi thông minh, Tranh ảnh trực quan, Mẫu vật thực tế, Phiếu bài tập màu',
    phongHocBoMon: 'Phòng học chuẩn có máy tính và tivi tương tác'
  },
  "5A1": {
    lop: "5A1",
    mon: "Toán (Tiểu học)",
    phan_mon: "Số và phép tính",
    siso: "37",
    nangluc: "Khá, Giỏi, chuẩn bị chuyển cấp",
    thoiluong: "35 phút (Tiểu học)",
    loaiga: "Kế hoạch bài dạy chuẩn CV 2345 (Tiểu học)",
    ngaysoan: new Date().toISOString().split("T")[0],
    boSach: "Kết nối tri thức với cuộc sống",
    sgkTap: "Tập 1",
    monTichHop: "Khoa học, Lịch sử và Địa lí, Tin học",
    bghSigner: "Nguyễn Thị Mai",
    deptSigner: "Tổ trưởng Khối 5",
    teacherSigner: "Cô Giáo Tiểu học",
    k1Periods: 90,
    k2Periods: 85,
    totalYearPeriods: 175,
    soGiaoVien: '04 giáo viên',
    trinhDoDaoTao: '100% Đạt chuẩn và trên chuẩn',
    thietBiDayHoc: 'Tivi tương tác, Bộ thiết bị hình học đo lường lớp 5, Phiếu bài tập tự luyện',
    phongHocBoMon: 'Phòng học đa năng kết nối Internet'
  },
  "7A1": {
    lop: "7A1",
    mon: "Toán học",
    phan_mon: "Đại số / Số học",
    siso: "45",
    nangluc: "Đại trà, nhiều trình độ",
    thoiluong: "45 phút (THCS / THPT)",
    loaiga: "Giáo án Bài học chuẩn 5512 (THCS / THPT)",
    ngaysoan: new Date().toISOString().split("T")[0],
    boSach: "Kết nối tri thức với cuộc sống",
    sgkTap: "Tập 1",
    monTichHop: "Vật lí, Tin học, Thực tiễn",
    bghSigner: "Bùi Sỹ Nghĩa",
    deptSigner: "Tổ trưởng chuyên môn",
    teacherSigner: "",
    k1Periods: 72,
    k2Periods: 68,
    totalYearPeriods: 140,
    mathStreamMode: 'parallel',
    daiSoK1Periods: 42,
    daiSoK2Periods: 38,
    hinhHocK1Periods: 30,
    hinhHocK2Periods: 30,
    soGiaoVien: '05 giáo viên',
    trinhDoDaoTao: '100% Đạt chuẩn & Trên chuẩn (Cử nhân ĐH, Thạc sĩ)',
    thietBiDayHoc: 'Máy tính, Tivi trình chiếu, Bộ đồ dùng dạy học Toán/KHTN, Phần mềm GeoGebra',
    phongHocBoMon: '01 phòng Máy tính kết nối Internet (40 máy), 01 phòng học đa năng'
  },
  "8A2": {
    lop: "8A2",
    mon: "Khoa học Tự nhiên",
    phan_mon: "Vật lí",
    siso: "42",
    nangluc: "Khá, Giỏi",
    thoiluong: "45 phút (THCS / THPT)",
    loaiga: "Giáo án Bài học chuẩn 5512 (THCS / THPT)",
    ngaysoan: new Date().toISOString().split("T")[0],
    boSach: "Kết nối tri thức với cuộc sống",
    sgkTap: "Tập 1",
    monTichHop: "Toán học, Hóa học, Sinh học, Tin học",
    bghSigner: "Đỗ Thị Hải Yến",
    deptSigner: "Tổ trưởng chuyên môn",
    teacherSigner: "",
    k1Periods: 72,
    k2Periods: 68,
    totalYearPeriods: 140
  }
};

export const TIKZ_MATH_EXAMPLES = [
  {
    title: "Tam giác vuông ABC có đường cao AH",
    subject: "Toán học - Hình học",
    code: `\\begin{tikzpicture}[scale=1.2]
  \\coordinate (A) at (0,3);
  \\coordinate (B) at (-2,0);
  \\coordinate (C) at (4,0);
  \\coordinate (H) at (0,0);
  \\draw[thick, fill=blue!5] (A) -- (B) -- (C) -- cycle;
  \\draw[dashed, red, thick] (A) -- (H);
  \\draw (0,0.3) -- (0.3,0.3) -- (0.3,0);
  \\node[above] at (A) {$A$};
  \\node[left] at (B) {$B$};
  \\node[right] at (C) {$C$};
  \\node[below] at (H) {$H$};
\\end{tikzpicture}`
  },
  {
    title: "Đồ thị hàm số bậc hai y = x² - 2x - 1",
    subject: "Toán học - Đại số",
    code: `\\begin{tikzpicture}[scale=0.8]
  \\draw[->] (-2,0) -- (4,0) node[right] {$x$};
  \\draw[->] (0,-3) -- (0,4) node[above] {$y$};
  \\node[below left] at (0,0) {$O$};
  \\draw[domain=-1.2:3.2, smooth, variable=\\x, red, thick] plot ({\\x}, {\\x*\\x - 2*\\x - 1});
  \\draw[dashed] (1,0) -- (1,-2) -- (0,-2);
  \\fill (1,-2) circle (2pt) node[below right] {$I(1,-2)$};
\\end{tikzpicture}`
  },
  {
    title: "Mạch điện nối tiếp có điện trở & bóng đèn",
    subject: "KHTN - Vật lí",
    code: `\\begin{tikzpicture}[scale=1]
  \\draw[thick] (0,0) -- (0,2) -- (2,2);
  \\draw[thick] (2,1.7) rectangle (4,2.3) node[midway] {$R$};
  \\draw[thick] (4,2) -- (6,2) -- (6,0);
  \\draw[thick] (6,0) circle (0.4) node {$K$};
  \\draw[thick] (6,0) -- (3,0);
  \\draw[thick] (3,-0.3) -- (3,0.3) node[above] {$+$};
  \\draw[thick] (2.7,-0.15) -- (2.7,0.15) node[above] {$-$};
  \\draw[thick] (2.7,0) -- (0,0);
\\end{tikzpicture}`
  }
];
