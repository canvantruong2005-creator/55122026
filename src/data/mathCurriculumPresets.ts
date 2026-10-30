// Full 35-week, 140-period Math Curriculum Presets (2 Algebra + 2 Geometry parallel per week)
// Đủ 70 tiết Đại số / Số học (Tiết 1-70) và 70 tiết Hình học & Đo lường (Tiết 1-70)
// Học kỳ 1: 18 tuần (72 tiết = 36 Đại + 36 Hình)
// Học kỳ 2: 17 tuần (68 tiết = 34 Đại + 34 Hình)
// Kiểm tra: Tuần 8 (Giữa kì 1), Tuần 16 (Cuối kì 1), Tuần 26 (Giữa kì 2), Tuần 31 (Cuối kì 2)

export interface MathWeekSchedule {
  week: number;
  semester: 1 | 2;
  algebraTitle: string;
  algebraPeriods: string; // e.g. "Tiết 1, 2"
  geometryTitle: string;
  geometryPeriods: string; // e.g. "Tiết 1, 2"
  notes?: string;
}

export const MATH_7_KNTT_35WEEKS_140PERIODS: MathWeekSchedule[] = [
  // === HỌC KỲ I (18 TUẦN = 72 TIẾT: 36 ĐẠI + 36 HÌNH) ===
  {
    week: 1,
    semester: 1,
    algebraTitle: 'Bài 1: Tập hợp các số hữu tỉ',
    algebraPeriods: 'Tiết 1, 2',
    geometryTitle: 'Bài 8: Góc ở vị trí đặc biệt. Tia phân giác của một góc',
    geometryPeriods: 'Tiết 1, 2',
    notes: 'Dạy song song 2 Đại + 2 Hình'
  },
  {
    week: 2,
    semester: 1,
    algebraTitle: 'Bài 1: Tập hợp các số hữu tỉ (tiếp theo) & Luyện tập',
    algebraPeriods: 'Tiết 3, 4',
    geometryTitle: 'Bài 8: Góc ở vị trí đặc biệt. Tia phân giác của một góc (tiếp theo) & Luyện tập',
    geometryPeriods: 'Tiết 3, 4',
    notes: 'Đầy đủ tên bài không cắt ngắn'
  },
  {
    week: 3,
    semester: 1,
    algebraTitle: 'Bài 2: Cộng, trừ, nhân, chia số hữu tỉ',
    algebraPeriods: 'Tiết 5, 6',
    geometryTitle: 'Bài 9: Hai đường thẳng song song và dấu hiệu nhận biết',
    geometryPeriods: 'Tiết 5, 6'
  },
  {
    week: 4,
    semester: 1,
    algebraTitle: 'Bài 2: Cộng, trừ, nhân, chia số hữu tỉ (tiếp theo) & Luyện tập chung',
    algebraPeriods: 'Tiết 7, 8',
    geometryTitle: 'Bài 9: Hai đường thẳng song song và dấu hiệu nhận biết (tiếp theo) & Luyện tập',
    geometryPeriods: 'Tiết 7, 8'
  },
  {
    week: 5,
    semester: 1,
    algebraTitle: 'Bài 3: Lũy thừa với số mũ tự nhiên của một số hữu tỉ',
    algebraPeriods: 'Tiết 9, 10',
    geometryTitle: 'Bài 10: Tiên đề Euclid. Tính chất của hai đường thẳng song song',
    geometryPeriods: 'Tiết 9, 10'
  },
  {
    week: 6,
    semester: 1,
    algebraTitle: 'Bài 3: Lũy thừa với số mũ tự nhiên của một số hữu tỉ (tiếp theo) & Luyện tập',
    algebraPeriods: 'Tiết 11, 12',
    geometryTitle: 'Bài 10: Tiên đề Euclid. Tính chất của hai đường thẳng song song (tiếp theo) & Luyện tập',
    geometryPeriods: 'Tiết 11, 12'
  },
  {
    week: 7,
    semester: 1,
    algebraTitle: 'Bài 4: Thứ tự thực hiện các phép tính. Quy tắc chuyển vế',
    algebraPeriods: 'Tiết 13, 14',
    geometryTitle: 'Bài 11: Định lí và chứng minh định lí',
    geometryPeriods: 'Tiết 13, 14'
  },
  {
    week: 8,
    semester: 1,
    algebraTitle: 'ÔN TẬP KIỂM TRA ĐÁNH GIÁ GIỮA HỌC KỲ I (ĐẠI SỐ) & KIỂM TRA ĐỊNH KỲ GIỮA KỲ I',
    algebraPeriods: 'Tiết 15, 16',
    geometryTitle: 'ÔN TẬP KIỂM TRA ĐÁNH GIÁ GIỮA HỌC KỲ I (HÌNH HỌC) & TRẢ BÀI KIỂM TRA',
    geometryPeriods: 'Tiết 15, 16',
    notes: 'Quy định kiểm tra giữa kì 1 tuần 8 (Đầy đủ tiết ôn tập trước kiểm tra)'
  },
  {
    week: 9,
    semester: 1,
    algebraTitle: 'Bài 5: Làm quen với số thập phân vô hạn tuần hoàn',
    algebraPeriods: 'Tiết 17, 18',
    geometryTitle: 'Luyện tập chung Chương III: Góc và đường thẳng song song',
    geometryPeriods: 'Tiết 17, 18'
  },
  {
    week: 10,
    semester: 1,
    algebraTitle: 'Bài 6: Số vô tỉ. Căn bậc hai số học',
    algebraPeriods: 'Tiết 19, 20',
    geometryTitle: 'Bài tập cuối Chương III: Góc và đường thẳng song song',
    geometryPeriods: 'Tiết 19, 20'
  },
  {
    week: 11,
    semester: 1,
    algebraTitle: 'Bài 7: Tập hợp các số thực',
    algebraPeriods: 'Tiết 21, 22',
    geometryTitle: 'Bài 12: Tổng các góc trong một tam giác',
    geometryPeriods: 'Tiết 21, 22'
  },
  {
    week: 12,
    semester: 1,
    algebraTitle: 'Bài 7: Tập hợp các số thực (tiếp theo) & Luyện tập chung',
    algebraPeriods: 'Tiết 23, 24',
    geometryTitle: 'Bài 12: Tổng các góc trong một tam giác (tiếp theo) & Luyện tập',
    geometryPeriods: 'Tiết 23, 24'
  },
  {
    week: 13,
    semester: 1,
    algebraTitle: 'Luyện tập chung Chương II: Số thực',
    algebraPeriods: 'Tiết 25, 26',
    geometryTitle: 'Bài 13: Hai tam giác bằng nhau. Trường hợp bằng nhau thứ nhất của tam giác: cạnh - cạnh - cạnh',
    geometryPeriods: 'Tiết 25, 26'
  },
  {
    week: 14,
    semester: 1,
    algebraTitle: 'Bài tập cuối Chương II: Số thực',
    algebraPeriods: 'Tiết 27, 28',
    geometryTitle: 'Bài 13: Trường hợp bằng nhau thứ nhất của tam giác: cạnh - cạnh - cạnh (tiếp theo)',
    geometryPeriods: 'Tiết 27, 28'
  },
  {
    week: 15,
    semester: 1,
    algebraTitle: 'Hoạt động thực hành trải nghiệm: Vẽ hình đơn giản với phần mềm GeoGebra',
    algebraPeriods: 'Tiết 29, 30',
    geometryTitle: 'Bài 14: Trường hợp bằng nhau thứ hai và thứ ba của tam giác: cạnh - góc - cạnh, góc - cạnh - góc',
    geometryPeriods: 'Tiết 29, 30'
  },
  {
    week: 16,
    semester: 1,
    algebraTitle: 'ÔN TẬP ĐÁNH GIÁ CUỐI HỌC KỲ I (ĐẠI SỐ) & KIỂM TRA ĐỊNH KỲ CUỐI HỌC KỲ I',
    algebraPeriods: 'Tiết 31, 32',
    geometryTitle: 'ÔN TẬP ĐÁNH GIÁ CUỐI HỌC KỲ I (HÌNH HỌC) & KIỂM TRA ĐỊNH KỲ CUỐI HỌC KỲ I',
    geometryPeriods: 'Tiết 31, 32',
    notes: 'Quy định kiểm tra học kì 1 tuần 16 (Đầy đủ tiết ôn tập trước kiểm tra)'
  },
  {
    week: 17,
    semester: 1,
    algebraTitle: 'Bài 15: Các trường hợp bằng nhau của tam giác vuông (Phần Đại/Hình phối hợp)',
    algebraPeriods: 'Tiết 33, 34',
    geometryTitle: 'Bài 14: Luyện tập các trường hợp bằng nhau của tam giác',
    geometryPeriods: 'Tiết 33, 34'
  },
  {
    week: 18,
    semester: 1,
    algebraTitle: 'Tổng kết và trả bài kiểm tra ĐGĐK Cuối Học kỳ I (Đại số)',
    algebraPeriods: 'Tiết 35, 36',
    geometryTitle: 'Tổng kết và trả bài kiểm tra ĐGĐK Cuối Học kỳ I (Hình học) & Ôn tập Học kỳ I',
    geometryPeriods: 'Tiết 35, 36',
    notes: 'Hoàn thành 72 tiết Học kỳ I (36 Đại + 36 Hình)'
  },

  // === HỌC KỲ II (17 TUẦN = 68 TIẾT: 34 ĐẠI + 34 HÌNH) ===
  {
    week: 19,
    semester: 2,
    algebraTitle: 'Bài 20: Tỉ lệ thức',
    algebraPeriods: 'Tiết 37, 38',
    geometryTitle: 'Bài 15: Các trường hợp bằng nhau của tam giác vuông',
    geometryPeriods: 'Tiết 37, 38'
  },
  {
    week: 20,
    semester: 2,
    algebraTitle: 'Bài 21: Tính chất của dãy tỉ số bằng nhau',
    algebraPeriods: 'Tiết 39, 40',
    geometryTitle: 'Bài 16: Tam giác cân. Đường trung trực của đoạn thẳng',
    geometryPeriods: 'Tiết 39, 40'
  },
  {
    week: 21,
    semester: 2,
    algebraTitle: 'Bài 21: Tính chất của dãy tỉ số bằng nhau (tiếp theo) & Luyện tập chung',
    algebraPeriods: 'Tiết 41, 42',
    geometryTitle: 'Bài 16: Tam giác cân. Đường trung trực của đoạn thẳng (tiếp theo) & Luyện tập',
    geometryPeriods: 'Tiết 41, 42'
  },
  {
    week: 22,
    semester: 2,
    algebraTitle: 'Bài 22: Đại lượng tỉ lệ thuận',
    algebraPeriods: 'Tiết 43, 44',
    geometryTitle: 'Luyện tập chung Chương IV: Tam giác bằng nhau',
    geometryPeriods: 'Tiết 43, 44'
  },
  {
    week: 23,
    semester: 2,
    algebraTitle: 'Bài 23: Đại lượng tỉ lệ nghịch',
    algebraPeriods: 'Tiết 45, 46',
    geometryTitle: 'Bài tập cuối Chương IV: Tam giác bằng nhau',
    geometryPeriods: 'Tiết 45, 46'
  },
  {
    week: 24,
    semester: 2,
    algebraTitle: 'Luyện tập chung Chương VI: Tỉ lệ thức và đại lượng tỉ lệ',
    algebraPeriods: 'Tiết 47, 48',
    geometryTitle: 'Bài 31: Quan hệ giữa góc và cạnh đối diện trong một tam giác',
    geometryPeriods: 'Tiết 47, 48'
  },
  {
    week: 25,
    semester: 2,
    algebraTitle: 'Bài tập cuối Chương VI: Tỉ lệ thức và đại lượng tỉ lệ',
    algebraPeriods: 'Tiết 49, 50',
    geometryTitle: 'Bài 32: Quan hệ giữa đường vuông góc và đường xiên',
    geometryPeriods: 'Tiết 49, 50'
  },
  {
    week: 26,
    semester: 2,
    algebraTitle: 'ÔN TẬP KIỂM TRA ĐÁNH GIÁ GIỮA HỌC KỲ II (ĐẠI SỐ) & KIỂM TRA ĐỊNH KỲ GIỮA KỲ II',
    algebraPeriods: 'Tiết 51, 52',
    geometryTitle: 'ÔN TẬP KIỂM TRA ĐÁNH GIÁ GIỮA HỌC KỲ II (HÌNH HỌC) & TRẢ BÀI KIỂM TRA',
    geometryPeriods: 'Tiết 51, 52',
    notes: 'Quy định kiểm tra giữa kì 2 tuần 26 (Đầy đủ tiết ôn tập trước kiểm tra)'
  },
  {
    week: 27,
    semester: 2,
    algebraTitle: 'Bài 24: Biểu thức đại số',
    algebraPeriods: 'Tiết 53, 54',
    geometryTitle: 'Bài 33: Quan hệ giữa ba cạnh của một tam giác. Bất đẳng thức tam giác',
    geometryPeriods: 'Tiết 53, 54'
  },
  {
    week: 28,
    semester: 2,
    algebraTitle: 'Bài 25: Đa thức một biến',
    algebraPeriods: 'Tiết 55, 56',
    geometryTitle: 'Bài 34: Sự đồng quy của ba đường trung tuyến, ba đường phân giác trong một tam giác',
    geometryPeriods: 'Tiết 55, 56'
  },
  {
    week: 29,
    semester: 2,
    algebraTitle: 'Bài 26: Phép cộng và phép trừ đa thức một biến',
    algebraPeriods: 'Tiết 57, 58',
    geometryTitle: 'Bài 35: Sự đồng quy của ba đường trung trực, ba đường cao trong một tam giác',
    geometryPeriods: 'Tiết 57, 58'
  },
  {
    week: 30,
    semester: 2,
    algebraTitle: 'Bài 27: Phép nhân đa thức một biến & Bài 28: Phép chia đa thức một biến',
    algebraPeriods: 'Tiết 59, 60',
    geometryTitle: 'Luyện tập chung Chương IX: Quan hệ giữa các yếu tố trong một tam giác',
    geometryPeriods: 'Tiết 59, 60'
  },
  {
    week: 31,
    semester: 2,
    algebraTitle: 'ÔN TẬP ĐÁNH GIÁ CUỐI HỌC KỲ II (ĐẠI SỐ) & KIỂM TRA ĐỊNH KỲ CUỐI HỌC KỲ II',
    algebraPeriods: 'Tiết 61, 62',
    geometryTitle: 'ÔN TẬP ĐÁNH GIÁ CUỐI HỌC KỲ II (HÌNH HỌC) & KIỂM TRA ĐỊNH KỲ CUỐI HỌC KỲ II',
    geometryPeriods: 'Tiết 61, 62',
    notes: 'Quy định kiểm tra cuối kì 2 tuần 31 (Đầy đủ tiết ôn tập trước kiểm tra)'
  },
  {
    week: 32,
    semester: 2,
    algebraTitle: 'Bài tập cuối Chương VII: Biểu thức đại số và đa thức một biến',
    algebraPeriods: 'Tiết 63, 64',
    geometryTitle: 'Bài tập cuối Chương IX: Quan hệ giữa các yếu tố trong một tam giác',
    geometryPeriods: 'Tiết 63, 64'
  },
  {
    week: 33,
    semester: 2,
    algebraTitle: 'Bài 29: Làm quen với biến cố & Bài 30: Làm quen với xác suất của biến cố',
    algebraPeriods: 'Tiết 65, 66',
    geometryTitle: 'Bài 36: Hình hộp chữ nhật và hình lập phương',
    geometryPeriods: 'Tiết 65, 66'
  },
  {
    week: 34,
    semester: 2,
    algebraTitle: 'Luyện tập chung Chương VIII: Làm quen với biến cố và xác suất của biến cố',
    algebraPeriods: 'Tiết 67, 68',
    geometryTitle: 'Bài 37: Hình lăng trụ đứng tam giác và hình lăng trụ đứng tứ giác',
    geometryPeriods: 'Tiết 67, 68'
  },
  {
    week: 35,
    semester: 2,
    algebraTitle: 'ÔN TẬP TỔNG KẾT CUỐI NĂM TOÀN BỘ PHẦN ĐẠI SỐ & SỐ HỌC (TIẾT 69, 70)',
    algebraPeriods: 'Tiết 69, 70',
    geometryTitle: 'ÔN TẬP TỔNG KẾT CUỐI NĂM TOÀN BỘ PHẦN HÌNH HỌC & ĐO LƯỜNG (TIẾT 69, 70)',
    geometryPeriods: 'Tiết 69, 70',
    notes: 'ĐỦ 100% 35 TUẦN, ĐỦ 70 TIẾT ĐẠI VÀ 70 TIẾT HÌNH (TỔNG CẢ NĂM 140 TIẾT)'
  }
];

export function generateMath35WeeksMarkdownTable(
  mathSchedules: MathWeekSchedule[] = MATH_7_KNTT_35WEEKS_140PERIODS
): string {
  let md = `
### BẢNG PHÂN PHỐI CHƯƠNG TRÌNH MÔN TOÁN DẠY SONG SONG (1 TUẦN 2 ĐẠI + 2 HÌNH - ĐỦ 35 TUẦN, 140 TIẾT)
* **Quy mô:** Cả năm 35 tuần | Học kỳ I: 18 tuần (72 tiết = 36 Đại + 36 Hình) | Học kỳ II: 17 tuần (68 tiết = 34 Đại + 34 Hình)
* **Quy tắc phân môn:** 1 tuần học 4 tiết = 2 tiết Đại số/Số học + 2 tiết Hình học & Đo lường dạy song song. Đại số đếm tiết từ 1 đến 70, Hình học đếm tiết từ 1 đến 70.
* **Lịch kiểm tra & ôn tập:** Tuần 8 (Giữa kì I), Tuần 16 (Cuối kì I), Tuần 26 (Giữa kì II), Tuần 31 (Cuối kì II).

#### HỌC KỲ I (18 TUẦN = 72 TIẾT: 36 TIẾT ĐẠI SỐ + 36 TIẾT HÌNH HỌC)
| Tuần | Phân môn Đại số / Số học (2 tiết/tuần) | Tiết PPCT Đại | Phân môn Hình học & Đo lường (2 tiết/tuần) | Tiết PPCT Hình | Yêu cầu cần đạt & Ghi chú |
|:---:|:---|:---:|:---|:---:|:---|
`;

  mathSchedules
    .filter(s => s.semester === 1)
    .forEach(s => {
      md += `| **Tuần ${s.week}** | ${s.algebraTitle} | **${s.algebraPeriods}** | ${s.geometryTitle} | **${s.geometryPeriods}** | ${s.notes || 'Tích hợp Năng lực số, AI, KNS'} |\n`;
    });

  md += `
#### HỌC KỲ II (17 TUẦN = 68 TIẾT: 34 TIẾT ĐẠI SỐ + 34 TIẾT HÌNH HỌC)
| Tuần | Phân môn Đại số / Số học (2 tiết/tuần) | Tiết PPCT Đại | Phân môn Hình học & Đo lường (2 tiết/tuần) | Tiết PPCT Hình | Yêu cầu cần đạt & Ghi chú |
|:---:|:---|:---:|:---|:---:|:---|
`;

  mathSchedules
    .filter(s => s.semester === 2)
    .forEach(s => {
      md += `| **Tuần ${s.week}** | ${s.algebraTitle} | **${s.algebraPeriods}** | ${s.geometryTitle} | **${s.geometryPeriods}** | ${s.notes || 'Tích hợp Năng lực số, STEM, QPAN'} |\n`;
    });

  return md;
}

/**
 * Mẫu chuẩn Phụ lục 1 Công văn 5512/BGDĐT-GDTrH
 * Kế hoạch dạy học môn học của Tổ Chuyên môn
 */
export function generateCV5512Appendix1Doc(params: {
  schoolName: string;
  departmentName: string;
  subjectName: string;
  gradeName: string;
  academicYear: string;
  teacherName: string;
  bghSigner: string;
  departmentSigner: string;
  scheduleTableMd?: string;
}): string {
  const tableMd = params.scheduleTableMd || generateMath35WeeksMarkdownTable();
  return `${params.schoolName.toUpperCase()}          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
TỔ: ${params.departmentName.toUpperCase()}                         Độc lập - Tự do - Hạnh phúc

# PHỤ LỤC 1: KẾ HOẠCH DẠY HỌC MÔN HỌC CỦA TỔ CHUYÊN MÔN
**(Kèm theo Công văn số 5512/BGDĐT-GDTrH ngày 18 tháng 12 năm 2020 của Bộ GDĐT)**
**MÔN: ${params.subjectName.toUpperCase()} - KHỐI LỚP: ${params.gradeName} - NĂM HỌC: ${params.academicYear}**

- Khối lớp: ${params.gradeName} | Số học sinh: 45 HS/lớp
- Số tiết Học kỳ I: 72 tiết (18 tuần = 36 tiết Đại số + 36 tiết Hình học)
- Số tiết Học kỳ II: 68 tiết (17 tuần = 34 tiết Đại số + 34 tiết Hình học)
- Tổng số tiết Cả năm: 140 tiết (35 tuần = 70 tiết Đại số + 70 tiết Hình học)

---

## I. ĐẶC ĐIỂM TÌNH HÌNH
### 1. Số lớp, số học sinh:
- Khối ${params.gradeName}: 04 lớp ; Số học sinh: 160 học sinh.

### 2. Tình hình đội ngũ giáo viên:
- Số giáo viên trong tổ: 05 giáo viên (Trình độ: 100% Đạt chuẩn và Trên chuẩn Đại học Sư phạm).

### 3. Thiết bị dạy học:
| STT | Thiết bị dạy học | Số lượng | Các bài dạy/chủ đề sử dụng | Ghi chú |
|:---:|:---|:---:|:---|:---:|
| 1 | Máy tính giáo viên, Tivi thông minh trình chiếu | 04 bộ | Toàn bộ các bài học ứng dụng CNTT & Chuyển đổi số | Dùng chung |
| 2 | Bộ đồ dùng dạy học Toán: Thước thẳng, Compa, Thước đo góc, Êke | Đủ theo lớp | Các bài vẽ hình, đo đạc góc, tam giác, đường thẳng | Chuẩn thiết bị |
| 3 | Mô hình hình học trực quan (Hình hộp, hình lăng trụ) | 02 bộ | Chương Hình khối trong thực tiễn | Chuẩn thiết bị |
| 4 | Phần mềm Toán học GeoGebra, Máy tính cầm tay Casio | Đủ cho GV & HS | Các tiết thực hành trải nghiệm, thống kê, vẽ đồ thị | Bản quyền/Miễn phí |

### 4. Phòng học bộ môn/Phòng chức năng:
- Phòng học bộ môn Toán: 01 phòng; Phòng Tin học (40 máy tính nối mạng Internet): 01 phòng.

---

## II. KẾ HOẠCH DẠY HỌC
### 1. Phân phối chương trình chi tiết (35 tuần - 140 tiết - 2 Đại + 2 Hình song song)
${tableMd}

### 2. Kiểm tra, đánh giá định kỳ
| Bài kiểm tra, đánh giá | Thời gian | Thời điểm (tuần) | Yêu cầu cần đạt | Hình thức |
|:---|:---:|:---:|:---|:---|
| **Kiểm tra Giữa kì I** | 60 phút | Tuần 8 | Đánh giá kiến thức Đại số & Hình học từ tuần 1 đến tuần 8 | Trắc nghiệm (30%) + Tự luận (70%) |
| **Kiểm tra Cuối kì I** | 90 phút | Tuần 16 | Đánh giá tổng hợp toàn bộ kiến thức Học kỳ I | Trắc nghiệm (30%) + Tự luận (70%) |
| **Kiểm tra Giữa kì II** | 60 phút | Tuần 26 | Đánh giá kiến thức Đại số & Hình học từ tuần 19 đến tuần 26 | Trắc nghiệm (30%) + Tự luận (70%) |
| **Kiểm tra Cuối kì II** | 90 phút | Tuần 31 | Đánh giá tổng hợp kiến thức Học kỳ II và Cả năm học | Trắc nghiệm (30%) + Tự luận (70%) |

---

## III. CÁC NỘI DUNG TÍCH HỢP BẮT BUỘC THEO ĐỊNH HƯỚNG
| STT | Nội dung tích hợp / Giáo dục chuyên đề | Địa chỉ bài học / Gợi ý thực hiện trong kế hoạch |
|:---:|:---|:---|
| 1 | **Năng lực Số (Thông tư 02/2025/TT-BGDĐT)** | Khai thác phần mềm GeoGebra vẽ hình động, xử lý bảng biểu thống kê số liệu trên máy tính. |
| 2 | **Trí tuệ Nhân tạo AI (QĐ 3439/QĐ-BGDĐT & CV 8334)** | Hướng dẫn học sinh tra cứu kiến thức, kiểm tra lời giải toán với Trợ lý AI có đạo đức và trách nhiệm. |
| 3 | **Giáo dục STEM / STEAM & Dạy học Liên môn** | Chủ đề chế tạo giác kế đo góc thực địa, tính diện tích phòng học, dự toán chi phí sơn nhà. |
| 4 | **Giáo dục Quốc phòng & An ninh (QPAN)** | Vận dụng hệ trục tọa độ, bản đồ tỉ lệ xác định chủ quyền biên giới, hải đảo Hoàng Sa - Trường Sa. |
| 5 | **Bảo vệ Môi trường & Ứng phó Biến đổi khí hậu** | Lồng ghép bài toán biểu đồ về lượng rác thải nhựa, chỉ số chất lượng không khí AQI và tiết kiệm điện. |

---

Tây Phương, ngày     tháng     năm 2026
| **HIỆU TRƯỞNG DUYỆT** | **TỔ TRƯỞNG CHUYÊN MÔN** | **NGƯỜI LẬP KẾ HOẠCH** |
|:---:|:---:|:---:|
| *(Ký, đóng dấu)* | *(Ký, ghi rõ họ tên)* | *(Ký, ghi rõ họ tên)* |
| <br/><br/>**${params.bghSigner}** | <br/><br/>**${params.departmentSigner}** | <br/><br/>**${params.teacherName}** |
`;
}

/**
 * Mẫu chuẩn Phụ lục 2 Công văn 5512/BGDĐT-GDTrH
 * Kế hoạch tổ chức các hoạt động giáo dục của Tổ Chuyên môn
 */
export function generateCV5512Appendix2Doc(params: {
  schoolName: string;
  departmentName: string;
  subjectName: string;
  academicYear: string;
  bghSigner: string;
  departmentSigner: string;
}): string {
  return `${params.schoolName.toUpperCase()}          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
TỔ: ${params.departmentName.toUpperCase()}                         Độc lập - Tự do - Hạnh phúc

# PHỤ LỤC 2: KHUNG KẾ HOẠCH TỔ CHỨC CÁC HOẠT ĐỘNG GIÁO DỤC CỦA TỔ CHUYÊN MÔN
**(Kèm theo Công văn số 5512/BGDĐT-GDTrH ngày 18 tháng 12 năm 2020 của Bộ GDĐT)**
**MÔN: ${params.subjectName.toUpperCase()} - NĂM HỌC: ${params.academicYear}**

---

## 1. Khối lớp: Khối 6, 7, 8, 9 (Tổng số: 16 lớp - 620 học sinh)

| Khối lớp | Số lớp | Số học sinh | Giáo viên phụ trách chính |
|:---:|:---:|:---:|:---|
| **Khối 6** | 04 lớp | 160 HS | Thầy/Cô Tổ Toán - Tin |
| **Khối 7** | 04 lớp | 155 HS | Thầy/Cô Tổ Toán - Tin |
| **Khối 8** | 04 lớp | 150 HS | Thầy/Cô Tổ Toán - Tin |
| **Khối 9** | 04 lớp | 145 HS | Thầy/Cô Tổ Toán - Tin |

---

## 2. Danh mục các Hoạt động Giáo dục, Chuyên đề, STEM & Câu lạc bộ

| STT | Chủ đề hoạt động | Yêu cầu cần đạt | Số tiết | Thời điểm | Địa điểm | Chủ trì | Phối hợp | Điều kiện thực hiện (Cơ sở vật chất, thiết bị) |
|:---:|:---|:---|:---:|:---:|:---|:---|:---|:---|
| **1** | **Câu lạc bộ Em Yêu AI & Khoa Học Số** | Khám phá ứng dụng của Trí tuệ nhân tạo (QĐ 3439/QĐ-BGDĐT), khai thác công cụ AI giải toán có trách nhiệm, rèn kỹ năng số. | 8 tiết | Suốt HK I & HK II | Phòng Tin học | GV Toán - Tin | Đoàn TN, Đội TP | 40 máy vi tính nối mạng, máy chiếu, tài liệu số |
| **2** | **Ngày hội STEM & Sáng tạo Không gian Toán học** | Thiết kế mô hình lăng trụ, đo chiều cao cây xanh ngoài sân trường bằng giác kế tự chế, tính toán tối ưu chi phí. | 4 tiết | Tuần 20 (Tháng 1) | Sân trường / Nhà đa năng | Tổ Toán - Tin | BGH, Ban PHHS | Dụng cụ đo góc, bìa carton, compa, thước dây |
| **3** | **Chuyên đề Ngoại khóa: An toàn số & Bảo vệ dữ liệu cá nhân** | Hiểu biết các quy định Luật An ninh mạng, phòng tránh lừa đảo trực tuyến, sử dụng mạng xã hội văn minh. | 2 tiết | Tuần 12 (Tháng 11) | Hội trường | GVCN & GV Tin | Công an địa phương | Âm thanh, máy chiếu, video clip tuyên truyền |
| **4** | **Hội thi Sáng tạo Video Toán học & Cuộc sống** | Tự tạo video ngắn 3 phút giải thích hiện tượng thực tế bằng công thức Toán, lồng ghép tư duy phân tích số liệu. | 4 tiết | Tuần 28 (Tháng 3) | Lớp học & Phòng Lab | GV Toán | GV Mĩ thuật | Điện thoại thông minh, ứng dụng CapCut/Canva |

---

Tây Phương, ngày     tháng     năm 2026
| **HIỆU TRƯỞNG DUYỆT** | **TỔ TRƯỞNG CHUYÊN MÔN** |
|:---:|:---:|
| *(Ký, đóng dấu)* | *(Ký, ghi rõ họ tên)* |
| <br/><br/>**${params.bghSigner}** | <br/><br/>**${params.departmentSigner}** |
`;
}

/**
 * Mẫu chuẩn Phụ lục 3 Công văn 5512/BGDĐT-GDTrH
 * Kế hoạch giáo dục của Giáo viên
 */
export function generateCV5512Appendix3Doc(params: {
  schoolName: string;
  departmentName: string;
  subjectName: string;
  gradeName: string;
  academicYear: string;
  teacherName: string;
  bghSigner: string;
  departmentSigner: string;
  scheduleTableMd?: string;
}): string {
  return `${params.schoolName.toUpperCase()}          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
TỔ: ${params.departmentName.toUpperCase()}                         Độc lập - Tự do - Hạnh phúc

# PHỤ LỤC 3: KẾ HOẠCH GIÁO DỤC CỦA GIÁO VIÊN
**(Kèm theo Công văn số 5512/BGDĐT-GDTrH ngày 18 tháng 12 năm 2020 của Bộ GDĐT)**
**MÔN: ${params.subjectName.toUpperCase()} - KHỐI LỚP: ${params.gradeName} - NĂM HỌC: ${params.academicYear}**

- **Họ và tên giáo viên**: **${params.teacherName}**
- **Nhiệm vụ được phân công**: Giảng dạy môn ${params.subjectName} Lớp ${params.gradeName}, Phụ trách Câu lạc bộ AI & Bồi dưỡng HSG.

---

## I. KẾ HOẠCH DẠY HỌC (PHÂN PHỐI CHƯƠNG TRÌNH CÁ NHÂN GIÁO VIÊN - 35 TUẦN, 140 TIẾT)

### 1. Phân phối chương trình chi tiết (Dạy song song 2 Đại + 2 Hình)
| STT | Bài dạy (Chủ đề / Bài học) | Số tiết | Tiết thứ | Thời điểm (Tuần) | Thiết bị dạy học | Địa điểm dạy học | Nội dung tích hợp (Năng lực số, AI, STEM, QPAN) |
|:---:|:---|:---:|:---:|:---:|:---|:---|:---|
| 1 | **Bài 1: Tập hợp các số hữu tỉ** | 2 | Tiết 1, 2 (Đại) | Tuần 1 | Máy tính, Tivi, Phiếu bài tập | Phòng học lớp | Năng lực số (TT 02/2025), Biểu diễn số trên trục số |
| 2 | **Bài 8: Góc ở vị trí đặc biệt. Tia phân giác của một góc** | 2 | Tiết 1, 2 (Hình) | Tuần 1 | Thước đo góc, Compa, GeoGebra | Phòng học lớp | Trực quan hóa hình học bằng phần mềm |
| 3 | **Bài 1: Tập hợp các số hữu tỉ (tiếp theo) & Luyện tập** | 2 | Tiết 3, 4 (Đại) | Tuần 2 | Tivi, Bài giảng điện tử | Phòng học lớp | Luyện tập so sánh số hữu tỉ |
| 4 | **Bài 8: Góc ở vị trí đặc biệt (tiếp theo) & Luyện tập** | 2 | Tiết 3, 4 (Hình) | Tuần 2 | Bộ thước đo góc, thước thẳng | Phòng học lớp | Rèn kỹ năng vẽ góc và tia phân giác |
| 5 | **Bài 2: Cộng, trừ, nhân, chia số hữu tỉ** | 2 | Tiết 5, 6 (Đại) | Tuần 3 | Máy tính cầm tay, Phiếu học tập | Phòng học lớp | Quy tắc chuyển vế, bỏ ngoặc |
| 6 | **Bài 9: Hai đường thẳng song song và dấu hiệu nhận biết** | 2 | Tiết 5, 6 (Hình) | Tuần 3 | Thước kẻ, Êke, Hình vẽ minh họa | Phòng học lớp | Ứng dụng trong kiến trúc, xây dựng |
| 7 | **Bài 2: Cộng, trừ, nhân, chia số hữu tỉ (tiếp) & Luyện tập** | 2 | Tiết 7, 8 (Đại) | Tuần 4 | Tivi, Trò chơi học tập | Phòng học lớp | Tính toán giá trị biểu thức hợp lí |
| 8 | **Bài 9: Hai đường thẳng song song (tiếp) & Luyện tập** | 2 | Tiết 7, 8 (Hình) | Tuần 4 | Mô hình thực tế | Phòng học lớp | Dấu hiệu nhận biết hai đường thẳng song song |
| ... | *(Liệt kê đầy đủ 100% tất cả các bài dạy từ Tuần 1 đến Tuần 35 theo đúng PPCT môn học)* | | | | | | |
| 69 | **ÔN TẬP TỔNG KẾT CUỐI NĂM TOÀN BỘ PHẦN ĐẠI SỐ & SỐ HỌC** | 2 | Tiết 69, 70 (Đại) | Tuần 35 | Đề cương tổng hợp, Tivi | Phòng học lớp | Hệ thống hóa kiến thức toàn cấp |
| 70 | **ÔN TẬP TỔNG KẾT CUỐI NĂM TOÀN BỘ PHẦN HÌNH HỌC & ĐO LƯỜNG** | 2 | Tiết 69, 70 (Hình) | Tuần 35 | Bảng sơ đồ tư duy hình học | Phòng học lớp | Hệ thống hóa kiến thức toàn cấp |

---

## II. NHIỆM VỤ KHÁC (BỒI DƯỠNG HỌC SINH GIỎI, PHỤ ĐẠO HỌC SINH YẾU, CÂU LẠC BỘ)

| STT | Nhiệm vụ | Thời gian | Đối tượng học sinh | Mục tiêu / Yêu cầu cần đạt | Biện pháp thực hiện |
|:---:|:---|:---:|:---|:---|:---|
| 1 | **Bồi dưỡng Đội tuyển Học sinh giỏi Toán** | Chiều Thứ 3 & Thứ 5 hàng tuần | 15 học sinh chọn lọc Khối 7 | Đạt giải cấp Huyện, Thành phố | Soạn chuyên đề nâng cao, luyện đề thi thử có chấm chữa chi tiết |
| 2 | **Phụ đạo & Kèm cặp Học sinh cần hỗ trợ** | Chiều Thứ 6 hàng tuần (15h30 - 16h45) | 10 học sinh yếu môn Toán | Nắm chắc chuẩn kiến thức kỹ năng cơ bản, đạt điểm trung bình trở lên | Chia nhỏ bài toán, giao phiếu bài tập vừa sức, khích lệ tiến bộ |
| 3 | **Chủ nhiệm & Hướng dẫn CLB Em Yêu AI** | Sáng Thứ 7 (Tuần 2 và Tuần 4 hàng tháng) | Học sinh toàn trường đăng ký | Phát triển tư duy số, sáng tạo sản phẩm ứng dụng | Hướng dẫn trải nghiệm AI an toàn, thiết kế trò chơi toán học |

---

Tây Phương, ngày     tháng     năm 2026
| **DUYỆT CỦA BGH** | **TỔ TRƯỞNG CHUYÊN MÔN** | **GIÁO VIÊN LẬP KẾ HOẠCH** |
|:---:|:---:|:---:|
| *(Ký, đóng dấu)* | *(Ký, ghi rõ họ tên)* | *(Ký, ghi rõ họ tên)* |
| <br/><br/>**${params.bghSigner}** | <br/><br/>**${params.departmentSigner}** | <br/><br/>**${params.teacherName}** |
`;
}

