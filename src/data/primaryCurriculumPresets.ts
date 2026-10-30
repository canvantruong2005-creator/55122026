// Preset phân phối chương trình chuẩn 35 tuần cho các môn Cấp Tiểu học (Theo Công văn 2345/BGDĐT-GDTH)
// Đầy đủ mạch nội dung, số tiết, điều chỉnh bổ sung, tích hợp Năng lực số (TT 02/2025), AI (QĐ 3439), STEM, Kỹ năng sống

export interface PrimaryWeekSchedule {
  week: number;
  month?: string;
  topicGroup: string; // Mạch nội dung / Chủ đề
  lessonTitle: string; // Tên bài học
  periods: number; // Số tiết trong tuần
  periodRange: string; // Tiết PPCT
  adjustments: string; // Nội dung điều chỉnh, bổ sung, tích hợp
  notes?: string;
}

// 1. Tiếng Việt Lớp 1 - 210 tiết (Học kỳ I: 18 tuần = 108 tiết; Học kỳ II: 17 tuần = 102 tiết; 6 tiết/tuần)
export const PRIMARY_VIETNAMESE_1_35WEEKS: PrimaryWeekSchedule[] = [
  {
    week: 1,
    topicGroup: 'Làm quen & Âm chữ cái',
    lessonTitle: 'Bài 1: A a - Bài 2: B b, C c',
    periods: 6,
    periodRange: 'Tiết 1 - 6',
    adjustments: 'Tích hợp Năng lực số: Nhận diện nét chữ và chữ cái trên màn hình tương tác / Tivi',
    notes: 'Rèn tư thế ngồi viết và cách cầm bút'
  },
  {
    week: 2,
    topicGroup: 'Âm chữ cái & Dấu thanh',
    lessonTitle: 'Bài 3: D d, Đ đ - Bài 4: E e, Ê ê - Dấu thanh (Huyền, Sắc)',
    periods: 6,
    periodRange: 'Tiết 7 - 12',
    adjustments: 'Trực quan hóa âm thanh và hình ảnh chuyển động mẫu phát âm',
    notes: 'Ghép tiếng đơn'
  },
  {
    week: 3,
    topicGroup: 'Âm chữ cái & Ghép vần',
    lessonTitle: 'Bài 5: G g, H h - Bài 6: I i, K k - Ôn tập âm chữ cái',
    periods: 6,
    periodRange: 'Tiết 13 - 18',
    adjustments: 'Tích hợp Trò chơi học tập số (Ghép chữ tương tác)',
    notes: 'Rèn phát âm chuẩn'
  },
  {
    week: 4,
    topicGroup: 'Vần có âm cuối',
    lessonTitle: 'Bài 7: L l, M m - Bài 8: N n, O o, Ô ô, Ơ ơ',
    periods: 6,
    periodRange: 'Tiết 19 - 24',
    adjustments: 'Tích hợp Kỹ năng sống: Giao tiếp lễ phép, lắng nghe bạn đọc',
    notes: 'Tập đọc từ ngữ ứng dụng'
  },
  {
    week: 5,
    topicGroup: 'Vần có âm cuối',
    lessonTitle: 'Bài 9: P p, Q q, R r - Bài 10: S s, T t',
    periods: 6,
    periodRange: 'Tiết 25 - 30',
    adjustments: 'Tích hợp AI trợ lý giọng đọc mẫu phát âm tiếng Việt chuẩn',
    notes: 'Tập viết chữ cỡ nhỡ'
  },
  {
    week: 6,
    topicGroup: 'Vần đôi & Ôn tập',
    lessonTitle: 'Bài 11: U u, Ư ư, V v, X x, Y y - Ôn tập và Đọc bài ứng dụng',
    periods: 6,
    periodRange: 'Tiết 31 - 36',
    adjustments: 'Thực hành đọc trơn câu ngắn',
    notes: 'Rèn đọc thành tiếng'
  },
  {
    week: 7,
    topicGroup: 'Vần đôi (ia, ua, ưa)',
    lessonTitle: 'Bài 12: ia, ua, ưa - Luyện đọc câu và đoạn văn ngắn',
    periods: 6,
    periodRange: 'Tiết 37 - 42',
    adjustments: 'Tích hợp Kể chuyện đạo đức: Tình cảm gia đình',
    notes: 'Phân biệt ia, ua, ưa'
  },
  {
    week: 8,
    topicGroup: 'Vần kết thúc bằng m, n, p, t',
    lessonTitle: 'Bài 13: am, ap, an, at - Ôn tập giữa Học kì I',
    periods: 6,
    periodRange: 'Tiết 43 - 48',
    adjustments: 'Đánh giá thường xuyên theo Thông tư 27/2020/TT-BGDĐT (Khen ngợi, động viên)',
    notes: 'Ôn tập âm và vần đã học'
  },
  {
    week: 9,
    topicGroup: 'Kiểm tra ĐGĐK Giữa kì I & Vần mới',
    lessonTitle: 'Đánh giá định kỳ giữa kì I (Đọc, Viết) & Bài 14: em, ep, en, et',
    periods: 6,
    periodRange: 'Tiết 49 - 54',
    adjustments: 'Kiểm tra đánh giá nhẹ nhàng, không gây áp lực cho học sinh lớp 1',
    notes: 'Khảo sát tiến độ đọc trơn'
  },
  {
    week: 10,
    topicGroup: 'Vần kết thúc bằng ng, nh, c, ch',
    lessonTitle: 'Bài 15: ang, ac, anh, ach - Luyện viết chính tả',
    periods: 6,
    periodRange: 'Tiết 55 - 60',
    adjustments: 'Tích hợp Giáo dục bảo vệ môi trường qua tranh ảnh thiên nhiên',
    notes: 'Phân biệt c / k / q'
  },
  {
    week: 11,
    topicGroup: 'Vần kết thúc bằng i, y',
    lessonTitle: 'Bài 16: ai, ay, ây, oi, ơi - Luyện đọc bài đọc ứng dụng',
    periods: 6,
    periodRange: 'Tiết 61 - 66',
    adjustments: 'Tích hợp Năng lực số: Xem video bài hát thiếu nhi có phụ đề chữ',
    notes: 'Tập đọc hiểu nghĩa từ'
  },
  {
    week: 12,
    topicGroup: 'Vần có âm đệm u, o',
    lessonTitle: 'Bài 17: oa, oe, uê, uy - Luyện tập nói và nghe',
    periods: 6,
    periodRange: 'Tiết 67 - 72',
    adjustments: 'Tổ chức hoạt động đóng vai nhân vật trong truyện cổ tích',
    notes: 'Rèn diễn đạt tròn câu'
  },
  {
    week: 13,
    topicGroup: 'Vần khó và vần ghép',
    lessonTitle: 'Bài 18: oai, oay, uan, uat - Tập chép chính tả đoạn ngắn',
    periods: 6,
    periodRange: 'Tiết 73 - 78',
    adjustments: 'Tích hợp Giáo dục an toàn giao thông qua biển báo tranh vẽ',
    notes: 'Viết đúng chính tả'
  },
  {
    week: 14,
    topicGroup: 'Vần mở rộng',
    lessonTitle: 'Bài 19: uông, uôc, ương, ươc - Luyện đọc bài thơ ngắn',
    periods: 6,
    periodRange: 'Tiết 79 - 84',
    adjustments: 'Rèn giọng đọc diễn cảm, ngắt nghỉ đúng nhịp thơ',
    notes: 'Học thuộc lòng khổ thơ'
  },
  {
    week: 15,
    topicGroup: 'Chủ đề: Mái ấm gia đình',
    lessonTitle: 'Bài đọc: Bữa cơm gia đình - Luyện từ và câu: Từ chỉ người, hoạt động',
    periods: 6,
    periodRange: 'Tiết 85 - 90',
    adjustments: 'Giáo dục lòng hiếu thảo, kính yêu ông bà cha mẹ',
    notes: 'Kể chuyện theo tranh'
  },
  {
    week: 16,
    topicGroup: 'Chủ đề: Trường học thân yêu',
    lessonTitle: 'Bài đọc: Ngôi trường mới của em - Luyện viết đoạn văn 2-3 câu',
    periods: 6,
    periodRange: 'Tiết 91 - 96',
    adjustments: 'Tích hợp Năng lực số: Tạo bộ sưu tập tranh ảnh trường lớp',
    notes: 'Tập viết câu hoàn chỉnh'
  },
  {
    week: 17,
    topicGroup: 'Ôn tập cuối Học kì I',
    lessonTitle: 'Ôn tập toàn diện Hệ thống Âm, Vần và Kỹ năng Đọc hiểu - Viết chính tả',
    periods: 6,
    periodRange: 'Tiết 97 - 102',
    adjustments: 'Hệ thống hóa bảng chữ cái và các vần đã học trong HK1',
    notes: 'Luyện đề đọc hiểu minh họa'
  },
  {
    week: 18,
    topicGroup: 'Đánh giá định kỳ Cuối Học kì I',
    lessonTitle: 'Kiểm tra ĐGĐK Cuối Học kì I (Đọc thành tiếng, Đọc hiểu, Viết chính tả)',
    periods: 6,
    periodRange: 'Tiết 103 - 108',
    adjustments: 'Thực hiện nghiêm túc theo Thông tư 27/2020/TT-BGDĐT; Đánh giá vì sự tiến bộ',
    notes: 'Sơ kết Học kỳ I'
  },
  // === HỌC KỲ II (17 TUẦN = 102 TIẾT) ===
  {
    week: 19,
    topicGroup: 'Chủ đề: Em là học sinh',
    lessonTitle: 'Bài 20: Đi học đúng giờ - Luyện từ và câu: Dấu chấm, dấu phẩy',
    periods: 6,
    periodRange: 'Tiết 109 - 114',
    adjustments: 'Rèn nền nếp tự giác, kỹ năng tự chuẩn bị sách vở đồ dùng',
    notes: 'Bắt đầu Học kỳ II'
  },
  {
    week: 20,
    topicGroup: 'Chủ đề: Bạn bè thân thiết',
    lessonTitle: 'Bài 21: Bạn của em - Tập đọc và Kể chuyện đôi bạn tốt',
    periods: 6,
    periodRange: 'Tiết 115 - 120',
    adjustments: 'Giáo dục tình bạn trong sáng, đoàn kết, giúp đỡ nhau cùng tiến bộ',
    notes: 'Hoạt động thảo luận nhóm'
  },
  {
    week: 21,
    topicGroup: 'Chủ đề: Thiên nhiên tươi đẹp',
    lessonTitle: 'Bài 22: Mùa xuân đến rồi - Luyện viết hoa chữ cái',
    periods: 6,
    periodRange: 'Tiết 121 - 126',
    adjustments: 'Tích hợp Giáo dục bảo vệ cây xanh, không ngắt hoa bẻ cành',
    notes: 'Quan sát thiên nhiên'
  },
  {
    week: 22,
    topicGroup: 'Chủ đề: Thế giới loài vật',
    lessonTitle: 'Bài 23: Chú gà trống thông minh - Luyện nghe nói đóng vai',
    periods: 6,
    periodRange: 'Tiết 127 - 132',
    adjustments: 'Tích hợp Trực quan AI: Xem mô phỏng tiếng kêu và tập tính loài vật',
    notes: 'Mở rộng vốn từ chỉ con vật'
  },
  {
    week: 23,
    topicGroup: 'Chủ đề: Đất nước và Con người',
    lessonTitle: 'Bài 24: Cờ đỏ sao vàng - Luyện đọc văn bản thông tin ngắn',
    periods: 6,
    periodRange: 'Tiết 133 - 138',
    adjustments: 'Giáo dục tình yêu quê hương, đất nước, tự hào dân tộc Việt Nam',
    notes: 'Nhận biết Quốc kỳ Việt Nam'
  },
  {
    week: 24,
    topicGroup: 'Chủ đề: Biển đảo quê hương',
    lessonTitle: 'Bài 25: Chuyến đi biển của bé - Luyện viết đoạn văn miêu tả',
    periods: 6,
    periodRange: 'Tiết 139 - 144',
    adjustments: 'Tích hợp Giáo dục chủ quyền Biển đảo Việt Nam (Hoàng Sa, Trường Sa)',
    notes: 'Bồi dưỡng tình yêu biển đảo'
  },
  {
    week: 25,
    topicGroup: 'Chủ đề: Khoa học quanh em',
    lessonTitle: 'Bài 26: Chiếc máy tính thông minh - Tìm hiểu công nghệ',
    periods: 6,
    periodRange: 'Tiết 145 - 150',
    adjustments: 'Tích hợp Năng lực số (TT 02/2025) & Làm quen AI (QĐ 3439) an toàn',
    notes: 'Nhận biết các thiết bị số'
  },
  {
    week: 26,
    topicGroup: 'Ôn tập giữa Học kì II',
    lessonTitle: 'Ôn tập giữa Học kỳ II (Hệ thống kỹ năng Đọc trơn, Đọc hiểu, Viết câu)',
    periods: 6,
    periodRange: 'Tiết 151 - 156',
    adjustments: 'Luyện tập rèn chữ giữ vở, sửa lỗi chính tả phụ âm đầu l/n, ch/tr',
    notes: 'Rèn tốc độ đọc đạt chuẩn'
  },
  {
    week: 27,
    topicGroup: 'Kiểm tra ĐGĐK Giữa kì II',
    lessonTitle: 'Khảo sát đánh giá định kỳ giữa kì II môn Tiếng Việt',
    periods: 6,
    periodRange: 'Tiết 157 - 162',
    adjustments: 'Đánh giá năng lực đọc trơn tối thiểu 30-40 tiếng/phút',
    notes: 'Theo dõi học sinh cần hỗ trợ'
  },
  {
    week: 28,
    topicGroup: 'Chủ đề: Nghề nghiệp tương lai',
    lessonTitle: 'Bài 27: Ước mơ của em - Luyện nói và nghe về các nghề nghiệp',
    periods: 6,
    periodRange: 'Tiết 163 - 168',
    adjustments: 'Giáo dục sự tôn trọng đối với mọi ngành nghề lao động chân chính',
    notes: 'Rèn kỹ năng trình bày tự tin'
  },
  {
    week: 29,
    topicGroup: 'Chủ đề: Bác Hồ kính yêu',
    lessonTitle: 'Bài 28: Ảnh Bác Hồ trong lớp em - Luyện đọc bài thơ',
    periods: 6,
    periodRange: 'Tiết 169 - 174',
    adjustments: 'Giáo dục 5 điều Bác Hồ dạy thiếu niên nhi đồng',
    notes: 'Học thuộc lòng bài thơ'
  },
  {
    week: 30,
    topicGroup: 'Chủ đề: An toàn là bạn',
    lessonTitle: 'Bài 29: Kỹ năng phòng tránh đuối nước và tai nạn thương tích',
    periods: 6,
    periodRange: 'Tiết 175 - 180',
    adjustments: 'Tích hợp Kỹ năng sống: Kỹ năng tự bảo vệ bản thân, kỹ năng bơi an toàn',
    notes: 'Xử lý tình huống thực tế'
  },
  {
    week: 31,
    topicGroup: 'Chủ đề: Mùa hè rực rỡ',
    lessonTitle: 'Bài 30: Chào mùa hè - Luyện đọc mở rộng sách báo thiếu nhi',
    periods: 6,
    periodRange: 'Tiết 181 - 186',
    adjustments: 'Khuyến khích văn hóa đọc sách truyện, đọc mở rộng tại thư viện trường',
    notes: 'Giới thiệu cuốn sách em yêu'
  },
  {
    week: 32,
    topicGroup: 'Luyện tập tổng hợp kỹ năng Đọc',
    lessonTitle: 'Luyện đọc các đoạn văn bản dài (tốc độ 40-50 tiếng/phút), trả lời câu hỏi',
    periods: 6,
    periodRange: 'Tiết 187 - 192',
    adjustments: 'Rèn kỹ năng đọc thầm, tìm chi tiết trả lời câu hỏi trắc nghiệm',
    notes: 'Phát triển năng lực ngôn ngữ'
  },
  {
    week: 33,
    topicGroup: 'Luyện tập tổng hợp kỹ năng Viết',
    lessonTitle: 'Luyện viết chính tả nghe - viết đoạn văn ngắn, bài tập chính tả chính xác',
    periods: 6,
    periodRange: 'Tiết 193 - 198',
    adjustments: 'Sửa các lỗi chính tả phổ biến theo phương ngữ',
    notes: 'Viết hoa đầu câu và tên riêng'
  },
  {
    week: 34,
    topicGroup: 'Ôn tập cuối năm toàn diện',
    lessonTitle: 'Hệ thống hóa toàn bộ kiến thức Tiếng Việt Lớp 1 chuẩn bị lên Lớp 2',
    periods: 6,
    periodRange: 'Tiết 199 - 204',
    adjustments: 'Đánh giá học sinh đạt chuẩn Yêu cầu cần đạt chương trình 2018',
    notes: 'Chuẩn bị kiểm tra cuối năm'
  },
  {
    week: 35,
    topicGroup: 'Kiểm tra ĐGĐK Cuối năm học',
    lessonTitle: 'Đánh giá định kỳ cuối năm (Đọc thành tiếng, Đọc hiểu, Viết chính tả) & Tổng kết',
    periods: 6,
    periodRange: 'Tiết 205 - 210',
    adjustments: 'Đánh giá nghiêm túc, khách quan theo Thông tư 27; Báo cáo BGH và PHHS',
    notes: 'Nghiệm thu chất lượng Lớp 1'
  }
];

// 2. Toán Tiểu học (Lớp 2 - 175 tiết: 5 tiết/tuần, HK1: 90 tiết, HK2: 85 tiết)
export const PRIMARY_MATH_2_35WEEKS: PrimaryWeekSchedule[] = [
  {
    week: 1,
    topicGroup: 'Ôn tập và Bổ sung',
    lessonTitle: 'Bài 1: Ôn tập các số đến 100 - Bài 2: Tia số. Số liền trước, số liền sau',
    periods: 5,
    periodRange: 'Tiết 1 - 5',
    adjustments: 'Tích hợp Năng lực số: Nhận diện tia số trực quan trên phần mềm học toán',
    notes: 'Củng cố cấu tạo số'
  },
  {
    week: 2,
    topicGroup: 'Số và phép tính (Phép cộng có nhớ)',
    lessonTitle: 'Bài 3: Các thành phần của phép cộng, phép trừ - Bài 4: Hơn, kém nhau bao nhiêu',
    periods: 5,
    periodRange: 'Tiết 6 - 10',
    adjustments: 'Tích hợp STEM: Mô hình toán học cân bằng số lượng',
    notes: 'Giải bài toán có lời văn'
  },
  {
    week: 3,
    topicGroup: 'Hình học và Đo lường',
    lessonTitle: 'Bài 5: Điểm, đoạn thẳng, đường cong, ba điểm thẳng hàng - Bài 6: Đề-xi-mét (dm)',
    periods: 5,
    periodRange: 'Tiết 11 - 15',
    adjustments: 'Thực hành đo đạc đồ dùng học tập thực tế trong lớp',
    notes: 'Đổi đơn vị cm và dm'
  },
  {
    week: 4,
    topicGroup: 'Phép cộng có nhớ trong phạm vi 20',
    lessonTitle: 'Bài 7: Phép cộng có nhớ trong phạm vi 20 (9 cộng với một số, 8 cộng với một số)',
    periods: 5,
    periodRange: 'Tiết 16 - 20',
    adjustments: 'Sử dụng que tính và bảng số trực quan',
    notes: 'Tách số để cộng tròn chục'
  },
  {
    week: 5,
    topicGroup: 'Phép cộng có nhớ trong phạm vi 20 (tiếp theo)',
    lessonTitle: 'Bài 8: 7, 6 cộng với một số - Bảng cộng (có nhớ) trong phạm vi 20',
    periods: 5,
    periodRange: 'Tiết 21 - 25',
    adjustments: 'Tích hợp Trò chơi số học tính nhẩm nhanh',
    notes: 'Thuộc bảng cộng'
  },
  {
    week: 6,
    topicGroup: 'Phép trừ có nhớ trong phạm vi 20',
    lessonTitle: 'Bài 9: Phép trừ có nhớ trong phạm vi 20 (11 trừ đi một số, 12 trừ đi một số)',
    periods: 5,
    periodRange: 'Tiết 26 - 30',
    adjustments: 'Tích hợp Kỹ năng giải quyết vấn đề toán học',
    notes: 'Trừ để được 10 rồi trừ tiếp'
  },
  {
    week: 7,
    topicGroup: 'Phép trừ có nhớ trong phạm vi 20 (tiếp theo)',
    lessonTitle: 'Bài 10: 13, 14, 15, 16, 17, 18 trừ đi một số - Bảng trừ trong phạm vi 20',
    periods: 5,
    periodRange: 'Tiết 31 - 35',
    adjustments: 'Luyện tập chung: Tính giá trị biểu thức đơn giản',
    notes: 'Thuộc bảng trừ'
  },
  {
    week: 8,
    topicGroup: 'Hình học và Đo lường: Khối trụ, Khối cầu',
    lessonTitle: 'Bài 11: Khối trụ, khối cầu - Bài 12: Lít (l) - Ôn tập Giữa Học kì I',
    periods: 5,
    periodRange: 'Tiết 36 - 40',
    adjustments: 'Tích hợp Trải nghiệm thực hành: Đo dung tích nước thực tế',
    notes: 'Chuẩn bị kiểm tra giữa kì'
  },
  {
    week: 9,
    topicGroup: 'Đánh giá định kỳ Giữa kì I & Thực hành',
    lessonTitle: 'Kiểm tra ĐGĐK Giữa Học kì I & Hoạt động thực hành trải nghiệm',
    periods: 5,
    periodRange: 'Tiết 41 - 45',
    adjustments: 'Đánh giá theo Thông tư 27: Nhận xét năng lực tính toán và đo lường',
    notes: 'Khảo sát kiến thức tuần 1-8'
  },
  {
    week: 10,
    topicGroup: 'Phép cộng có nhớ trong phạm vi 100',
    lessonTitle: 'Bài 13: Phép cộng có nhớ dạng 26 + 4, 36 + 24, 26 + 5, 36 + 27',
    periods: 5,
    periodRange: 'Tiết 46 - 50',
    adjustments: 'Tích hợp Năng lực số: Sử dụng bảng tương tác minh họa đặt tính rồi tính',
    notes: 'Rèn kỹ năng đặt tính thẳng hàng'
  },
  {
    week: 11,
    topicGroup: 'Phép trừ có nhớ trong phạm vi 100',
    lessonTitle: 'Bài 14: Phép trừ có nhớ dạng 30 - 4, 50 - 24, 32 - 5, 52 - 28',
    periods: 5,
    periodRange: 'Tiết 51 - 55',
    adjustments: 'Rèn tính cẩn thận, nhớ 1 sang hàng chục',
    notes: 'Luyện giải toán tình huống'
  },
  {
    week: 12,
    topicGroup: 'Hình phẳng và Đo độ dài',
    lessonTitle: 'Bài 15: Đường gấp khúc. Độ dài đường gấp khúc - Bài 16: Ki-lô-gam (kg)',
    periods: 5,
    periodRange: 'Tiết 56 - 60',
    adjustments: 'Tích hợp STEM: Thực hành cân đồ vật bằng cân đĩa / cân đồng hồ',
    notes: 'Tính tổng độ dài đoạn thẳng'
  },
  {
    week: 13,
    topicGroup: 'Thời gian và Đo lường',
    lessonTitle: 'Bài 17: Ngày - giờ, Giờ - phút - Xem đồng hồ (chính xác đến 5 phút)',
    periods: 5,
    periodRange: 'Tiết 61 - 65',
    adjustments: 'Tích hợp Kỹ năng sống: Quản lý thời gian biểu biểu học tập và sinh hoạt cá nhân',
    notes: 'Sử dụng mô hình đồng hồ'
  },
  {
    week: 14,
    topicGroup: 'Thu thập, phân loại, kiểm đếm số liệu',
    lessonTitle: 'Bài 18: Thu thập, phân loại, kiểm đếm - Biểu đồ tranh',
    periods: 5,
    periodRange: 'Tiết 66 - 70',
    adjustments: 'Tích hợp Năng lực số: Tạo biểu đồ tranh đơn giản trên máy tính',
    notes: 'Đọc và nhận xét biểu đồ'
  },
  {
    week: 15,
    topicGroup: 'Một số yếu tố xác suất',
    lessonTitle: 'Bài 19: Chắc chắn, có thể, không thể - Trò chơi xác suất đơn giản',
    periods: 5,
    periodRange: 'Tiết 71 - 75',
    adjustments: 'Tổ chức trò chơi bốc bóng màu, gieo xúc xắc',
    notes: 'Hình thành tư duy logic'
  },
  {
    week: 16,
    topicGroup: 'Luyện tập chung và Củng cố HK1',
    lessonTitle: 'Bài 20: Luyện tập chung phép cộng, phép trừ và hình học trong HK1',
    periods: 5,
    periodRange: 'Tiết 76 - 80',
    adjustments: 'Hệ thống hóa sơ đồ tư duy toán học lớp 2 HK1',
    notes: 'Giải toán có lời văn 1 bước'
  },
  {
    week: 17,
    topicGroup: 'Ôn tập cuối Học kì I',
    lessonTitle: 'Ôn tập toàn diện Số học, Đo lường, Hình học & Thống kê HK1',
    periods: 5,
    periodRange: 'Tiết 81 - 85',
    adjustments: 'Rèn kỹ năng làm bài kiểm tra trắc nghiệm kết hợp tự luận',
    notes: 'Luyện đề ôn tập'
  },
  {
    week: 18,
    topicGroup: 'Kiểm tra ĐGĐK Cuối Học kì I',
    lessonTitle: 'Kiểm tra Đánh giá định kỳ Cuối Học kì I & Đánh giá kết quả',
    periods: 5,
    periodRange: 'Tiết 86 - 90',
    adjustments: 'Đánh giá theo Thông tư 27; Báo cáo chất lượng giáo dục học kỳ I',
    notes: 'Sơ kết Học kỳ I'
  },
  // === HỌC KỲ II (17 TUẦN = 85 TIẾT) ===
  {
    week: 19,
    topicGroup: 'Phép nhân (Làm quen phép nhân)',
    lessonTitle: 'Bài 21: Phép nhân - Thừa số, tích - Bảng nhân 2',
    periods: 5,
    periodRange: 'Tiết 91 - 95',
    adjustments: 'Hình thành khái niệm phép nhân là tổng các số hạng bằng nhau',
    notes: 'Bắt đầu Học kỳ II'
  },
  {
    week: 20,
    topicGroup: 'Bảng nhân 5',
    lessonTitle: 'Bài 22: Bảng nhân 5 - Luyện tập phép nhân trong thực tiễn',
    periods: 5,
    periodRange: 'Tiết 96 - 100',
    adjustments: 'Tích hợp Trò chơi AI đố vui phép nhân nhẩm nhanh',
    notes: 'Thuộc bảng nhân 2 và 5'
  },
  {
    week: 21,
    topicGroup: 'Phép chia (Làm quen phép chia)',
    lessonTitle: 'Bài 23: Phép chia - Số bị chia, số chia, thương - Bảng chia 2',
    periods: 5,
    periodRange: 'Tiết 101 - 105',
    adjustments: 'Thực hành chia đều đồ vật vào các nhóm',
    notes: 'Mối quan hệ giữa nhân và chia'
  },
  {
    week: 22,
    topicGroup: 'Bảng chia 5',
    lessonTitle: 'Bài 24: Bảng chia 5 - Luyện tập giải toán liên quan đến chia đều và chia theo nhóm',
    periods: 5,
    periodRange: 'Tiết 106 - 110',
    adjustments: 'Vận dụng tính tiền mua đồ dùng học tập đơn giản',
    notes: 'Thuộc bảng chia 2 và 5'
  },
  {
    week: 23,
    topicGroup: 'Các số trong phạm vi 1000',
    lessonTitle: 'Bài 25: Đơn vị, chục, trăm, nghìn - Các số tròn trăm, tròn chục',
    periods: 5,
    periodRange: 'Tiết 111 - 115',
    adjustments: 'Tích hợp Năng lực số: Mô hình hóa các khối lập phương trên máy tính',
    notes: 'Cấu tạo số có 3 chữ số'
  },
  {
    week: 24,
    topicGroup: 'Các số có ba chữ số',
    lessonTitle: 'Bài 26: Các số có ba chữ số - So sánh các số có ba chữ số',
    periods: 5,
    periodRange: 'Tiết 116 - 120',
    adjustments: 'Rèn kỹ năng so sánh từ hàng trăm đến hàng chục, hàng đơn vị',
    notes: 'Thứ tự các số đến 1000'
  },
  {
    week: 25,
    topicGroup: 'Đo độ dài: Mét (m), Ki-lô-mét (km), Mi-li-mét (mm)',
    lessonTitle: 'Bài 27: Mét (m), Ki-lô-mét (km), Mi-li-mét (mm) - Thực hành đo',
    periods: 5,
    periodRange: 'Tiết 121 - 125',
    adjustments: 'Tích hợp Giáo dục địa phương: Tìm hiểu khoảng cách địa lý các địa danh',
    notes: 'Đổi đơn vị đo độ dài'
  },
  {
    week: 26,
    topicGroup: 'Khối tứ diện, Khối trụ & Ôn tập giữa kì II',
    lessonTitle: 'Bài 28: Hình tứ giác, hình tam giác - Ôn tập Giữa Học kỳ II',
    periods: 5,
    periodRange: 'Tiết 126 - 130',
    adjustments: 'Củng cố kiến thức phép nhân, chia và các số đến 1000',
    notes: 'Chuẩn bị kiểm tra giữa kì 2'
  },
  {
    week: 27,
    topicGroup: 'Đánh giá định kỳ Giữa kì II',
    lessonTitle: 'Kiểm tra ĐGĐK Giữa Học kì II & Thực hành giải quyết vấn đề toán học',
    periods: 5,
    periodRange: 'Tiết 131 - 135',
    adjustments: 'Khảo sát năng lực toán học giữa HK2 theo Thông tư 27',
    notes: 'Đánh giá tiến độ học sinh'
  },
  {
    week: 28,
    topicGroup: 'Phép cộng không nhớ trong phạm vi 1000',
    lessonTitle: 'Bài 29: Phép cộng (không nhớ) trong phạm vi 1000',
    periods: 5,
    periodRange: 'Tiết 136 - 140',
    adjustments: 'Đặt tính thẳng hàng, cộng từ phải sang trái',
    notes: 'Giải toán nhiều hơn, ít hơn'
  },
  {
    week: 29,
    topicGroup: 'Phép trừ không nhớ trong phạm vi 1000',
    lessonTitle: 'Bài 30: Phép trừ (không nhớ) trong phạm vi 1000',
    periods: 5,
    periodRange: 'Tiết 141 - 145',
    adjustments: 'Rèn kỹ năng trừ từ hàng đơn vị đến hàng chục, hàng trăm',
    notes: 'Kiểm tra kết quả bằng phép cộng'
  },
  {
    week: 30,
    topicGroup: 'Phép cộng có nhớ trong phạm vi 1000',
    lessonTitle: 'Bài 31: Phép cộng (có nhớ 1 lần) trong phạm vi 1000',
    periods: 5,
    periodRange: 'Tiết 146 - 150',
    adjustments: 'Tích hợp Năng lực số: Giải toán có sự hỗ trợ của bảng tính',
    notes: 'Nhớ 1 sang hàng kế tiếp'
  },
  {
    week: 31,
    topicGroup: 'Phép trừ có nhớ trong phạm vi 1000',
    lessonTitle: 'Bài 32: Phép trừ (có nhớ 1 lần) trong phạm vi 1000',
    periods: 5,
    periodRange: 'Tiết 151 - 155',
    adjustments: 'Luyện tập giải toán liên quan đến thực tiễn mua sắm, tiết kiệm',
    notes: 'Rèn tính kiên trì, chính xác'
  },
  {
    week: 32,
    topicGroup: 'Tiền Việt Nam',
    lessonTitle: 'Bài 33: Tiền Việt Nam (Các tờ tiền mệnh giá đến 1000 đồng, 2000 đồng, 5000 đồng)',
    periods: 5,
    periodRange: 'Tiết 156 - 160',
    adjustments: 'Tích hợp Giáo dục tài chính thông minh: Tiết kiệm, lập kế hoạch chi tiêu nhỏ',
    notes: 'Thực hành đi chợ mua sắm'
  },
  {
    week: 33,
    topicGroup: 'Ôn tập Phép tính và Đại lượng cuối năm',
    lessonTitle: 'Bài 34: Ôn tập các phép tính trong phạm vi 1000 - Ôn tập đo lường',
    periods: 5,
    periodRange: 'Tiết 161 - 165',
    adjustments: 'Hệ thống hóa toàn bộ công thức và bảng nhân chia lớp 2',
    notes: 'Rèn tốc độ tính nhẩm'
  },
  {
    week: 34,
    topicGroup: 'Ôn tập Hình học, Thống kê và Xác suất cuối năm',
    lessonTitle: 'Bài 35: Ôn tập Hình học, Biểu đồ tranh và các khả năng xảy ra',
    periods: 5,
    periodRange: 'Tiết 166 - 170',
    adjustments: 'Tổ chức Ngày hội Toán học vui và Sáng tạo STEM',
    notes: 'Tổng duyệt kiến thức cả năm'
  },
  {
    week: 35,
    topicGroup: 'Kiểm tra ĐGĐK Cuối năm học',
    lessonTitle: 'Đánh giá định kỳ cuối năm môn Toán Lớp 2 & Tổng kết năm học',
    periods: 5,
    periodRange: 'Tiết 171 - 175',
    adjustments: 'Đánh giá toàn diện năng lực tư duy, tính toán và giải quyết vấn đề toán học',
    notes: 'Hoàn thành chương trình Lớp 2'
  }
];

// Helper to format Primary Schedules to Markdown table following CV 2345 (Phụ lục 2)
export function generatePrimary35WeeksMarkdownTable(
  curriculumList: PrimaryWeekSchedule[],
  subjectName: string,
  gradeName: string
): string {
  let output = `### BẢNG PHÂN PHỐI CHƯƠNG TRÌNH CHI TIẾT THEO TUẦN (MÔN ${subjectName.toUpperCase()} - KHỐI ${gradeName})\n\n`;

  // Học kỳ I
  const hk1 = curriculumList.filter(item => item.week <= 18);
  output += `#### HỌC KỲ I (18 tuần: Tuần 1 đến Tuần 18)\n`;
  output += `| Tuần, tháng | Chương trình và SGK (Chủ đề / Mạch nội dung) | Tên bài học | Tiết học / Thời lượng | Tiết PPCT | Nội dung điều chỉnh, bổ sung (Năng lực số, AI, STEM, Kỹ năng sống...) | Ghi chú |\n`;
  output += `|:---:|:---|:---|:---:|:---:|:---|:---|\n`;
  hk1.forEach(item => {
    output += `| Tuần ${item.week} | ${item.topicGroup} | ${item.lessonTitle} | ${item.periods} tiết | ${item.periodRange} | ${item.adjustments} | ${item.notes || ''} |\n`;
  });

  // Học kỳ II
  const hk2 = curriculumList.filter(item => item.week > 18);
  output += `\n#### HỌC KỲ II (17 tuần: Tuần 19 đến Tuần 35)\n`;
  output += `| Tuần, tháng | Chương trình và SGK (Chủ đề / Mạch nội dung) | Tên bài học | Tiết học / Thời lượng | Tiết PPCT | Nội dung điều chỉnh, bổ sung (Năng lực số, AI, STEM, Kỹ năng sống...) | Ghi chú |\n`;
  output += `|:---:|:---|:---|:---:|:---:|:---|:---|\n`;
  hk2.forEach(item => {
    output += `| Tuần ${item.week} | ${item.topicGroup} | ${item.lessonTitle} | ${item.periods} tiết | ${item.periodRange} | ${item.adjustments} | ${item.notes || ''} |\n`;
  });

  return output;
}

// 1. Phụ lục 1 CV 2345: Kế hoạch giáo dục của Nhà trường cấp Tiểu học
export function generatePrimaryAppendix1Doc(params: {
  schoolName: string;
  academicYear: string;
  bghSigner: string;
}): string {
  return `${params.schoolName.toUpperCase()}          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Số:     /KH-TH                            Độc lập - Tự do - Hạnh phúc

# PHỤ LỤC 1: KẾ HOẠCH GIÁO DỤC CỦA NHÀ TRƯỜNG
**(Kèm theo Công văn số 2345/BGDĐT-GDTH ngày 07 tháng 6 năm 2021 của Bộ GDĐT)**
**NĂM HỌC: ${params.academicYear}**

## I. CĂN CỨ XÂY DỰNG KẾ HOẠCH
1. Luật Giáo dục số 43/2019/QH14;
2. Nghị quyết số 88/2014/QH13 và Nghị quyết số 51/2017/QH14 của Quốc hội;
3. Thông tư số 32/2018/TT-BGDĐT ban hành Chương trình Giáo dục phổ thông 2018;
4. Thông tư số 28/2020/TT-BGDĐT ban hành Điều lệ trường Tiểu học;
5. Thông tư số 27/2020/TT-BGDĐT quy định đánh giá học sinh tiểu học;
6. Công văn số 2345/BGDĐT-GDTH về việc hướng dẫn xây dựng kế hoạch giáo dục của nhà trường cấp tiểu học;
7. Thông tư 02/2025/TT-BGDĐT về khung Năng lực số và Quyết định 3439/QĐ-BGDĐT về ứng dụng Trí tuệ nhân tạo (AI) trong giáo dục;
8. Kế hoạch thời gian năm học ${params.academicYear} của UBND thành phố Hà Nội và hướng dẫn nhiệm vụ năm học của Sở GD&ĐT Hà Nội.

## II. ĐIỀU KIỆN THỰC HIỆN CHƯƠNG TRÌNH NĂM HỌC
### 1. Đặc điểm tình hình kinh tế, văn hóa, xã hội địa phương
- Địa bàn dân cư ổn định, truyền thống hiếu học, phụ huynh học sinh quan tâm và đồng hành cùng nhà trường trong các hoạt động giáo dục toàn diện.

### 2. Đặc điểm tình hình nhà trường
- **2.1. Học sinh**: Tổng số lớp: 25 lớp (Khối 1: 5 lớp; Khối 2: 5 lớp; Khối 3: 5 lớp; Khối 4: 5 lớp; Khối 5: 5 lớp). Tổng số học sinh: 875 học sinh (bình quân 35 học sinh/lớp). 100% học sinh học 2 buổi/ngày.
- **2.2. Đội ngũ**: Tổng số cán bộ quản lý, giáo viên, nhân viên: 42 người (CBQL: 03; GVCN và GV bộ môn: 35; Nhân viên: 04). Trình độ đào tạo: 100% đạt chuẩn Cử nhân Giáo dục Tiểu học trở lên.
- **2.3. Cơ sở vật chất, thiết bị dạy học**: Đủ 25 phòng học văn hóa kiên cố, 100% phòng học trang bị máy tính, tivi thông minh kết nối Internet. Có đầy đủ phòng chức năng: Tin học, Ngoại ngữ, Âm nhạc, Mĩ thuật, Giáo dục thể chất, Thư viện chuẩn xuất sắc.

## III. MỤC TIÊU GIÁO DỤC NĂM HỌC
### 1. Mục tiêu chung
- Thực hiện hiệu quả Chương trình GDPT 2018 cấp Tiểu học; phát triển toàn diện phẩm chất và năng lực học sinh (Yêu nước, Nhân ái, Chăm chỉ, Trung thực, Trách nhiệm; Tự chủ và tự học, Giao tiếp và hợp tác, Giải quyết vấn đề và sáng tạo).
- Đẩy mạnh chuyển đổi số, tích hợp Năng lực số (TT 02/2025), ứng dụng AI có trách nhiệm (QĐ 3439), giáo dục STEM và kỹ năng sống an toàn trong kỷ nguyên số.

### 2. Chỉ tiêu cụ thể
- 100% học sinh hoàn thành chương trình lớp học; 100% học sinh lớp 5 hoàn thành chương trình tiểu học.
- Tỷ lệ khen thưởng học sinh Xuất sắc và Tiêu biểu đạt từ 65% trở lên.

## IV. TỔ CHỨC CÁC MÔN HỌC VÀ HOẠT ĐỘNG GIÁO DỤC TRONG NĂM HỌC
### 1. Phân phối thời lượng các môn học và hoạt động giáo dục (35 tuần thực học)
| Khối lớp | Tiếng Việt | Toán | Ngoại ngữ 1 | Đạo đức | TN&XH / Khoa học | LS & ĐL | Tin học & CN | GDTC | Nghệ thuật (ÂN, MT) | HĐTN | Tự chọn / Tăng cường | Tổng tiết/tuần |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Lớp 1** | 7 (245t) | 3 (105t) | 2 (70t) | 1 (35t) | 2 (70t) | - | - | 2 (70t) | 2 (70t) | 3 (105t) | 8 tiết | 30 tiết/tuần |
| **Lớp 2** | 6 (210t) | 5 (175t) | 2 (70t) | 1 (35t) | 2 (70t) | - | - | 2 (70t) | 2 (70t) | 3 (105t) | 7 tiết | 30 tiết/tuần |
| **Lớp 3** | 6 (210t) | 5 (175t) | 4 (140t) | 1 (35t) | 2 (70t) | - | 2 (70t) | 2 (70t) | 2 (70t) | 3 (105t) | 3 tiết | 30 tiết/tuần |
| **Lớp 4** | 7 (245t) | 5 (175t) | 4 (140t) | 1 (35t) | 2 (70t) | 2 (70t) | 2 (70t) | 2 (70t) | 2 (70t) | 3 (105t) | 0 tiết | 30 tiết/tuần |
| **Lớp 5** | 7 (245t) | 5 (175t) | 4 (140t) | 1 (35t) | 2 (70t) | 2 (70t) | 2 (70t) | 2 (70t) | 2 (70t) | 3 (105t) | 0 tiết | 30 tiết/tuần |

### 2. Các hoạt động giáo dục tập thể và ngoại khóa
- Chuyên đề "Vui Tết Trung thu", "Ngày hội STEM Tiểu học", "Lễ hội Đọc sách & Văn hóa số", "Em yêu Lịch sử Thăng Long - Hà Nội", "Tập huấn Kỹ năng phòng tránh đuối nước & an toàn giao thông".

### 3. Khung thời gian thực hiện chương trình năm học
- **Học kỳ I**: 18 tuần thực học (Bắt đầu từ tuần 1 đến hết tuần 18). Đánh giá giữa HK1: Tuần 9; Đánh giá cuối HK1: Tuần 18.
- **Học kỳ II**: 17 tuần thực học (Bắt đầu từ tuần 19 đến hết tuần 35). Đánh giá giữa HK2: Tuần 27; Đánh giá cuối năm: Tuần 35.

## V. GIẢI PHÁP THỰC HIỆN
1. Đổi mới phương pháp dạy học lấy học sinh làm trung tâm, kết hợp học tập tích cực qua trò chơi, dự án STEM nhỏ.
2. Thực hiện nghiêm túc Thông tư 27/2020/TT-BGDĐT: Đánh giá bằng nhận xét, khích lệ động viên, không tạo áp lực.
3. Đẩy mạnh chuyển đổi số: Quản lý học bạ điện tử, giáo án điện tử, khai thác kho học liệu số tương tác.

## VI. TỔ CHỨC THỰC HIỆN
- **Hiệu trưởng**: Chịu trách nhiệm chung, phê duyệt kế hoạch, chỉ đạo triển khai và báo cáo Sở GD&ĐT / Cấp có thẩm quyền theo quy định.
- **Phó Hiệu trưởng**: Trực tiếp phụ trách công tác chuyên môn, kiểm tra tiến độ dạy học và hồ sơ sổ sách.
- **Tổ trưởng Chuyên môn**: Xây dựng kế hoạch dạy học khối lớp (Phụ lục 2), sinh hoạt chuyên môn theo nghiên cứu bài học.
- **Giáo viên**: Soạn Kế hoạch bài dạy (Phụ lục 3) đầy đủ, đổi mới phương pháp và ứng dụng CNTT/AI thiết thực.

Tây Phương, ngày     tháng     năm 2026
| **SỞ GD&ĐT PHÊ DUYỆT** | **HIỆU TRƯỞNG NHÀ TRƯỜNG** |
|:---:|:---:|
| *(Ký, đóng dấu)* | *(Ký, đóng dấu, ghi rõ họ tên)* |
| <br/><br/> | <br/>**${params.bghSigner}** |
`;
}

// 2. Phụ lục 2 CV 2345: Kế hoạch dạy học môn học / HĐGD Khối lớp
export function generatePrimaryAppendix2Doc(params: {
  schoolName: string;
  gradeName: string;
  subjectName: string;
  departmentName: string;
  academicYear: string;
  bghSigner: string;
  departmentSigner: string;
  scheduleTableMd: string;
}): string {
  return `${params.schoolName.toUpperCase()}          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
TỔ CHUYÊN MÔN KHỐI ${params.gradeName}              Độc lập - Tự do - Hạnh phúc

# PHỤ LỤC 2: KẾ HOẠCH DẠY HỌC CÁC MÔN HỌC, HOẠT ĐỘNG GIÁO DỤC KHỐI LỚP ${params.gradeName}
**(Kèm theo Công văn số 2345/BGDĐT-GDTH ngày 07 tháng 6 năm 2021 của Bộ GDĐT)**
**MÔN: ${params.subjectName.toUpperCase()} - NĂM HỌC: ${params.academicYear}**

## I. CĂN CỨ XÂY DỰNG KẾ HOẠCH
- Căn cứ Kế hoạch giáo dục nhà trường năm học ${params.academicYear} của ${params.schoolName};
- Căn cứ Chương trình GDPT 2018 ban hành kèm theo Thông tư số 32/2018/TT-BGDĐT đối với môn ${params.subjectName};
- Căn cứ hướng dẫn Thông tư 27/2020/TT-BGDĐT, Thông tư 02/2025/TT-BGDĐT (Năng lực số) và Quyết định 3439/QĐ-BGDĐT (AI);
- Căn cứ tình hình thực tế đội ngũ giáo viên và học sinh Khối lớp ${params.gradeName}.

## II. ĐIỀU KIỆN THỰC HIỆN CÁC MÔN HỌC, HOẠT ĐỘNG GIÁO DỤC
1. **Đội ngũ giáo viên**: Tổ chuyên môn Khối ${params.gradeName} gồm các giáo viên đạt chuẩn trình độ ĐHSP Tiểu học, có tinh thần trách nhiệm, tích cực đổi mới phương pháp dạy học.
2. **Học sinh**: Học sinh ngoan ngoãn, thích khám phá, tỷ lệ chuyên cần cao; được trang bị đầy đủ SGK, vở bài tập và đồ dùng học tập.
3. **Thiết bị và học liệu**: Tivi thông minh, máy tính kết nối mạng, kho bài giảng tương tác, bộ đồ dùng học tập môn học theo quy định của Bộ GD&ĐT.

## III. KẾ HOẠCH DẠY HỌC MÔN ${params.subjectName.toUpperCase()} (35 TUẦN THỰC HỌC)
${params.scheduleTableMd}

## IV. TỔ CHỨC THỰC HIỆN
1. **Tổ trưởng Chuyên môn**: Thống nhất kế hoạch dạy học trong toàn khối, phân công giáo viên giảng dạy, tổ chức sinh hoạt chuyên môn định kỳ 2 tuần/lần.
2. **Giáo viên trong Khối**: Căn cứ kế hoạch này để xây dựng Kế hoạch bài dạy (Phụ lục 3), linh hoạt điều chỉnh tiến độ và nội dung phù hợp với đối tượng học sinh của lớp mình phụ trách.
3. **Kiểm tra, đánh giá**: Thực hiện đánh giá thường xuyên và định kỳ nghiêm túc theo Thông tư 27/2020/TT-BGDĐT.

Tây Phương, ngày     tháng     năm 2026
| **HIỆU TRƯỞNG DUYỆT** | **TỔ TRƯỞNG CHUYÊN MÔN** |
|:---:|:---:|
| *(Ký, đóng dấu)* | *(Ký, ghi rõ họ tên)* |
| <br/><br/>**${params.bghSigner}** | <br/><br/>**${params.departmentSigner}** |
`;
}

// 3. Phụ lục 3 CV 2345: Kế hoạch bài dạy chuẩn Tiểu học
export function generatePrimaryAppendix3Doc(params: {
  schoolName: string;
  lessonTitle: string;
  subjectName: string;
  gradeName: string;
  periodsCount: number;
  teacherName: string;
  bghSigner: string;
}): string {
  return `${params.schoolName.toUpperCase()}
KHỐI LỚP: ${params.gradeName} | GIÁO VIÊN: ${params.teacherName}

# PHỤ LỤC 3: KẾ HOẠCH BÀI DẠY (GIÁO ÁN TIỂU HỌC CHUẨN CÔNG VĂN 2345)
**(Kèm theo Công văn số 2345/BGDĐT-GDTH ngày 07 tháng 6 năm 2021 của Bộ GDĐT)**

- **Môn học / Hoạt động giáo dục**: ${params.subjectName.toUpperCase()} ; **Lớp**: ${params.gradeName}
- **Tên bài học**: **${params.lessonTitle}**
- **Thời lượng thực hiện**: ${params.periodsCount} tiết (Mỗi tiết 35 phút)
- **Thời gian thực hiện**: Ngày ... tháng ... năm 2026

---

## I. YÊU CẦU CẦN ĐẠT (YCCĐ)
### 1. Năng lực đặc thù (Kiến thức & Kỹ năng môn học)
- Học sinh nhận biết, tiếp thu và thực hành được các kiến thức trọng tâm của bài học: hình thành khái niệm, rèn kỹ năng thao tác chuẩn xác.
- Vận dụng kiến thức bài học để giải quyết các vấn đề, tình huống thực tế gắn liền với đời sống học đường và gia đình.

### 2. Năng lực chung
- **Tự chủ và tự học**: Tự giác chuẩn bị đồ dùng học tập, chủ động hoàn thành các nhiệm vụ học tập cá nhân.
- **Giao tiếp và hợp tác**: Tự tin trao đổi, chia sẻ ý kiến với bạn bè trong nhóm; lắng nghe và tôn trọng ý kiến của người khác.
- **Giải quyết vấn đề và sáng tạo**: Biết phát hiện tình huống mới, đưa ra các cách giải quyết linh hoạt, sáng tạo.

### 3. Phẩm chất chủ yếu
- **Chăm chỉ**: Tích cực tham gia các hoạt động học tập, không ngại khó khi gặp bài tập cần suy nghĩ.
- **Trung thực**: Thật thà trong đánh giá bản thân và nhận xét bạn bè.
- **Trách nhiệm**: Giữ gìn đồ dùng học tập, có ý thức giúp đỡ bạn trong nhóm cùng tiến bộ.

### 4. Tích hợp liên môn & Chuyên đề giáo dục
- **Tích hợp Năng lực số (TT 02/2025/TT-BGDĐT) & AI (QĐ 3439/QĐ-BGDĐT)**: Học sinh quan sát hình ảnh tương tác trên màn hình Tivi/máy tính, làm quen với nguồn học liệu số an toàn.
- **Tích hợp Kỹ năng sống & Bảo vệ môi trường**: Giáo dục ý thức tự bảo vệ bản thân, giữ gìn vệ sinh lớp học và yêu quý thiên nhiên.

---

## II. ĐỒ DÙNG DẠY HỌC
1. **Đối với giáo viên**:
   - Tivi thông minh, máy vi tính, bài giảng điện tử tương tác (Canva / PowerPoint).
   - Bộ đồ dùng dạy học trực quan môn ${params.subjectName}, phiếu bài tập nhóm màu in sẵn, phiếu đánh giá cá nhân.
   - Thước chỉ, bảng phụ, các hộp quà/ngôi sao khen thưởng học tập.

2. **Đối với học sinh**:
   - Sách giáo khoa ${params.subjectName} Lớp ${params.gradeName}, Vở bài tập, Vở ghi.
   - Bộ đồ dùng học tập cá nhân: bút chì, thước kẻ, bảng con, phấn, khăn lau bảng.

---

## III. CÁC HOẠT ĐỘNG DẠY HỌC CHỦ YẾU (TIẾN TRÌNH BÀI DẠY)

### HOẠT ĐỘNG 1: MỞ ĐẦU - KHỞI ĐỘNG, KẾT NỐI (3 - 5 phút)
- **Mục tiêu**: Tạo không khí vui tươi, hào hứng trước khi vào bài học; kích hoạt vốn hiểu biết đã có của học sinh để kết nối vào bài mới.
- **Phương pháp, hình thức tổ chức**: Trò chơi học tập vui nhộn (Ví dụ: "Hộp quà bí mật" / Hát múa vận động theo video trên Tivi).
- **Tiến trình tổ chức**:
  1. *Chuyển giao nhiệm vụ*: GV phổ biến luật chơi và chiếu hình ảnh câu hỏi khởi động trên màn hình Tivi.
  2. *Thực hiện nhiệm vụ*: Cả lớp hào hứng tham gia trả lời câu hỏi và nhận tràng pháo tay khích lệ.
  3. *Báo cáo, thảo luận*: Đại diện 1-2 học sinh chia sẻ cảm xúc và suy nghĩ về trò chơi.
  4. *Kết luận, nhận xét*: GV nhận xét, tuyên dương tinh thần học tập và khéo léo dẫn dắt giới thiệu bài học mới: **${params.lessonTitle}**.

---

### HOẠT ĐỘNG 2: HÌNH THÀNH KIẾN THỨC MỚI - KHÁM PHÁ, TRẢI NGHIỆM (12 - 15 phút)
- **Mục tiêu**: Giúp học sinh tự mình khám phá, quan sát, phân tích để rút ra kiến thức mới theo Yêu cầu cần đạt.
- **Phương pháp, hình thức tổ chức**: Dạy học trực quan, thảo luận nhóm đôi / nhóm 4, vấn đáp gợi mở.
- **Tiến trình tổ chức**:
  1. *Chuyển giao nhiệm vụ*: GV cho học sinh quan sát tranh minh họa trong SGK và trên màn hình Tivi; giao phiếu nhiệm vụ cho các nhóm.
  2. *Thực hiện nhiệm vụ*: Học sinh làm việc theo nhóm: quan sát, trao đổi, dùng đồ dùng trực quan thực hành thao tác. GV đi quanh quan sát, gợi ý và hỗ trợ các nhóm gặp khó khăn.
  3. *Báo cáo, thảo luận*: Đại diện 2 nhóm lên bảng trình bày kết quả khám phá; các nhóm khác chú ý lắng nghe, nhận xét và bổ sung.
  4. *Kết luận, nhận xét*: GV chuẩn hóa kiến thức, khen ngợi các nhóm làm việc tích cực, chốt nội dung trọng tâm bài học lên bảng.

---

### HOẠT ĐỘNG 3: LUYỆN TẬP, THỰC HÀNH (10 - 12 phút)
- **Mục tiêu**: Củng cố kiến thức vừa học, rèn luyện kỹ năng giải quyết bài tập và tình huống qua các bài tập trong SGK/VBT.
- **Phương pháp, hình thức tổ chức**: Thực hành cá nhân kết hợp chia sẻ cặp đôi, trò chơi tiếp sức.
- **Tiến trình tổ chức**:
  1. *Chuyển giao nhiệm vụ*: GV nêu yêu cầu Bài tập 1, Bài tập 2 trong SGK; hướng dẫn học sinh làm vào vở hoặc bảng con.
  2. *Thực hiện nhiệm vụ*: Học sinh tập trung làm bài cá nhân; sau đó đổi vở kiểm tra chéo cho bạn cùng bàn.
  3. *Báo cáo, thảo luận*: GV gọi một số học sinh lên bảng làm hoặc chiếu bài làm của học sinh qua máy chiếu vật thể/chụp ảnh tivi để cả lớp cùng nhận xét.
  4. *Kết luận, nhận xét (Đánh giá thường xuyên theo TT 27)*: GV nhận xét chi tiết, chỉ ra lỗi sai phổ biến và cách khắc phục; biểu dương các học sinh làm bài nhanh và chính xác.

---

### HOẠT ĐỘNG 4: VẬN DỤNG, TRẢI NGHIỆM (3 - 5 phút)
- **Mục tiêu**: Vận dụng kiến thức, kỹ năng đã học vào tình huống thực tiễn hàng ngày; mở rộng hiểu biết và phát triển năng lực sáng tạo.
- **Phương pháp, hình thức tổ chức**: Đặt câu hỏi tình huống thực tế, liên hệ bản thân và gia đình.
- **Tiến trình tổ chức**:
  1. *Chuyển giao nhiệm vụ*: GV nêu tình huống thực tế (gắn với gia đình, bạn bè, bảo vệ môi trường, an toàn số).
  2. *Thực hiện nhiệm vụ*: Học sinh suy nghĩ và giơ tay phát biểu cách xử lý của bản thân.
  3. *Báo cáo, thảo luận*: Các bạn khác nhận xét, bổ sung các phương án hay.
  4. *Kết luận, củng cố dặn dò*: GV tổng kết lại bài học, dặn dò học sinh về nhà chia sẻ bài học với bố mẹ và chuẩn bị bài cho tiết học sau.

---

## IV. ĐIỀU CHỈNH SAU BÀI DẠY (NẾU CÓ)
- *Nội dung kiến thức*: Học sinh tiếp thu bài tốt, đạt yêu cầu cần đạt đề ra.
- *Phương pháp và thời gian*: Thời gian phân bổ hợp lý; các hoạt động nhóm diễn ra sôi nổi.
- *Lưu ý cho tiết học sau*: Tiếp tục tăng cường các trò chơi tương tác số để học sinh rèn luyện phản xạ nhanh.

Tây Phương, ngày     tháng     năm 2026
| **DUYỆT CỦA BGH / TỔ TRƯỞNG** | **GIÁO VIÊN SOẠN BÀI** |
|:---:|:---:|
| *(Ký, ghi rõ họ tên)* | *(Ký, ghi rõ họ tên)* |
| <br/><br/>**${params.bghSigner}** | <br/><br/>**${params.teacherName}** |
`;
}

