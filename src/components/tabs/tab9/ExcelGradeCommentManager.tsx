import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { generateGeminiText } from '../../../lib/geminiApi';
import { exportMarkdownToWord, stripIntroductoryChatter } from '../../../lib/wordExport';
import { ClassProfile } from '../../../types';
import { VoiceMicButton } from '../../VoiceMicButton';
import {
  FileSpreadsheet,
  Sparkles,
  Download,
  Upload,
  RefreshCw,
  Edit3,
  CheckCircle2,
  Users,
  Award,
  BookOpen,
  Sliders,
  Eye,
  Loader2,
  Trash2,
  Plus,
  FileCheck,
  Printer,
  Copy,
  Check,
  Send,
  MessageSquare,
  Search,
  FileDown,
  Filter,
  UserCheck,
  HelpCircle
} from 'lucide-react';

export interface StudentGradeRecord {
  id: string;
  stt: number;
  name: string;
  tx1?: number | string;
  tx2?: number | string;
  tx3?: number | string;
  gk?: number | string;
  ck?: number | string;
  dtb?: number | string;
  xepLoai?: string;
  renLuyen?: string;
  comment?: string;
  parentPhone?: string;
  isGeneratingComment?: boolean;
}

interface ExcelGradeCommentManagerProps {
  profile: ClassProfile;
  onChangeProfile: (p: ClassProfile) => void;
  apiKeysInput: string;
  onOpenApiGuide?: () => void;
}

const DEFAULT_DEMO_STUDENTS: StudentGradeRecord[] = [
  { id: '1', stt: 1, name: 'Nguyễn Minh Quân', tx1: 9.0, tx2: 8.5, tx3: 9.5, gk: 9.0, ck: 9.5, dtb: 9.2, xepLoai: 'Tốt', renLuyen: 'Tốt', comment: 'Em có tư duy logic xuất sắc, nắm chắc kiến thức và luôn hăng hái phát biểu xây dựng bài. Tiếp tục phát huy thế mạnh để tham gia đội tuyển HSG.', parentPhone: '0912.345.678' },
  { id: '2', stt: 2, name: 'Trần Phương Linh', tx1: 8.5, tx2: 9.0, tx3: 8.5, gk: 8.8, ck: 9.0, dtb: 8.8, xepLoai: 'Tốt', renLuyen: 'Tốt', comment: 'Học lực rất tốt, bài làm trình bày cẩn thận, rõ ràng. Em có tinh thần tự giác cao và luôn giúp đỡ các bạn trong nhóm học tập.', parentPhone: '0987.654.321' },
  { id: '3', stt: 3, name: 'Phạm Đức Anh', tx1: 7.0, tx2: 6.5, tx3: 7.5, gk: 7.0, ck: 7.5, dtb: 7.2, xepLoai: 'Khá', renLuyen: 'Tốt', comment: 'Em có nhiều cố gắng trong học tập, hiểu bài tương đối tốt. Cần rèn thêm kỹ năng tính toán cẩn thận và tránh nhầm lẫn dấu ở các câu phức tạp.', parentPhone: '0904.112.233' },
  { id: '4', stt: 4, name: 'Lê Thu Hà', tx1: 8.0, tx2: 7.5, tx3: 8.5, gk: 8.0, ck: 8.5, dtb: 8.2, xepLoai: 'Khá', renLuyen: 'Tốt', comment: 'Chăm chỉ, gương mẫu, hoàn thành tốt các bài tập được giao. Cần tự tin hơn khi giải quyết các bài toán vận dụng cao.', parentPhone: '0982.778.899' },
  { id: '5', stt: 5, name: 'Hoàng Quốc Bảo', tx1: 5.5, tx2: 6.0, tx3: 5.0, gk: 5.5, ck: 6.0, dtb: 5.7, xepLoai: 'Đạt', renLuyen: 'Khá', comment: 'Có tiến bộ so với đầu năm, tuy nhiên còn hổng một số công thức cơ bản. Cần dành thêm thời gian ôn tập ở nhà và chú ý lắng nghe thầy cô giảng bài trên lớp.', parentPhone: '0936.554.433' },
  { id: '6', stt: 6, name: 'Đặng Mai Phương', tx1: 9.5, tx2: 10, tx3: 9.5, gk: 9.5, ck: 10, dtb: 9.7, xepLoai: 'Tốt', renLuyen: 'Tốt', comment: 'Em học rất xuất sắc, tiếp thu bài nhanh, tư duy sáng tạo và giải toán linh hoạt. Rất gương mẫu và nhiệt tình trong các hoạt động lớp.', parentPhone: '0913.889.900' },
  { id: '7', stt: 7, name: 'Bùi Gia Huy', tx1: 4.5, tx2: 5.0, tx3: 4.0, gk: 4.5, ck: 5.0, dtb: 4.7, xepLoai: 'Chưa đạt', renLuyen: 'Khá', comment: 'Khả năng tính toán cơ bản còn yếu, hay quên bài tập về nhà. Kính đề nghị gia đình sát sao nhắc nhở em tự giác học tập và phối hợp cùng GVCN.', parentPhone: '0903.667.788' },
  { id: '8', stt: 8, name: 'Vũ Thùy Chi', tx1: 7.5, tx2: 8.0, tx3: 7.5, gk: 7.8, ck: 8.0, dtb: 7.8, xepLoai: 'Khá', renLuyen: 'Tốt', comment: 'Có ý thức học tập tốt, nề nếp kỷ luật nghiêm túc. Cần tích cực xung phong lên bảng và mở rộng bài tập nâng cao.', parentPhone: '0978.223.344' }
];

export const ExcelGradeCommentManager: React.FC<ExcelGradeCommentManagerProps> = ({
  profile,
  onChangeProfile,
  apiKeysInput,
  onOpenApiGuide
}) => {
  const [students, setStudents] = useState<StudentGradeRecord[]>(DEFAULT_DEMO_STUDENTS);
  const [schoolName, setSchoolName] = useState<string>(profile.schoolName || 'Trường THCS Phùng Khắc Khoan');
  const [className, setClassName] = useState<string>(profile.lop || '9A1');
  const [subjectName, setSubjectName] = useState<string>(profile.mon || 'Toán học');
  const [teacherName, setTeacherName] = useState<string>(profile.teacherSigner || 'Thầy Cấn Văn Trường');
  const [semester, setSemester] = useState<string>('Học kỳ I - Năm học 2025-2026');

  // Evaluation Standard
  const [evalStandard, setEvalStandard] = useState<'tt22' | 'tt27' | 'quality_first'>('tt22');
  const [commentLength, setCommentLength] = useState<'concise' | 'detailed' | 'bullet'>('detailed');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterRating, setFilterRating] = useState<string>('all');

  // AI state
  const [isGeneratingAll, setIsGeneratingAll] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedStudentForSlip, setSelectedStudentForSlip] = useState<StudentGradeRecord | null>(DEFAULT_DEMO_STUDENTS[0]);
  const [activeTabSubView, setActiveTabSubView] = useState<'table' | 'slips' | 'raw_paste'>('table');
  const [rawTextPaste, setRawTextPaste] = useState<string>('');

  // Handle Excel Upload
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (rows.length < 2) {
          alert('File Excel không có đủ dữ liệu bảng điểm!');
          return;
        }

        // Find header row
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(rows.length, 10); i++) {
          const rowStr = rows[i].join(' ').toLowerCase();
          if (rowStr.includes('họ') || rowStr.includes('tên') || rowStr.includes('stt') || rowStr.includes('điểm')) {
            headerRowIndex = i;
            break;
          }
        }

        const headerRow = rows[headerRowIndex].map((h: any) => String(h || '').trim().toLowerCase());
        const nameIdx = headerRow.findIndex(h => h.includes('họ và tên') || h.includes('họ tên') || h.includes('tên') || h.includes('học sinh'));
        const tx1Idx = headerRow.findIndex(h => h.includes('tx1') || h.includes('đdgk1') || h.includes('miệng') || h.includes('15p') || h.includes('tx 1'));
        const tx2Idx = headerRow.findIndex(h => h.includes('tx2') || h.includes('tx 2') || h.includes('đdgk2'));
        const tx3Idx = headerRow.findIndex(h => h.includes('tx3') || h.includes('tx 3'));
        const gkIdx = headerRow.findIndex(h => h.includes('gk') || h.includes('giữa kỳ') || h.includes('giữa kì') || h.includes('đdgk'));
        const ckIdx = headerRow.findIndex(h => h.includes('ck') || h.includes('cuối kỳ') || h.includes('cuối kì') || h.includes('học kỳ'));
        const dtbIdx = headerRow.findIndex(h => h.includes('đtb') || h.includes('dtb') || h.includes('trung bình') || h.includes('tbm'));
        const xepLoaiIdx = headerRow.findIndex(h => h.includes('xếp loại') || h.includes('học lực') || h.includes('kết quả'));
        const renLuyenIdx = headerRow.findIndex(h => h.includes('rèn luyện') || h.includes('hạnh kiểm'));
        const commentIdx = headerRow.findIndex(h => h.includes('nhận xét') || h.includes('đánh giá') || h.includes('lời phê'));
        const phoneIdx = headerRow.findIndex(h => h.includes('sđt') || h.includes('điện thoại') || h.includes('phone') || h.includes('liên hệ'));

        const parsedStudents: StudentGradeRecord[] = [];
        let curStt = 1;

        for (let r = headerRowIndex + 1; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.length === 0) continue;
          const studentName = String(row[nameIdx >= 0 ? nameIdx : 1] || '').trim();
          if (!studentName || studentName.toLowerCase().includes('tổng cộng') || studentName.toLowerCase().includes('trung bình')) continue;

          const tx1 = row[tx1Idx] !== undefined ? row[tx1Idx] : '';
          const tx2 = row[tx2Idx] !== undefined ? row[tx2Idx] : '';
          const tx3 = row[tx3Idx] !== undefined ? row[tx3Idx] : '';
          const gk = row[gkIdx] !== undefined ? row[gkIdx] : '';
          const ck = row[ckIdx] !== undefined ? row[ckIdx] : '';

          let dtb = row[dtbIdx] !== undefined ? row[dtbIdx] : '';
          if (!dtb && (tx1 || gk || ck)) {
            const validNums = [tx1, tx2, tx3, gk, gk, ck, ck, ck].map(Number).filter(n => !isNaN(n) && n > 0);
            if (validNums.length > 0) {
              const sum = validNums.reduce((a, b) => a + b, 0);
              dtb = (sum / validNums.length).toFixed(1);
            }
          }

          let xepLoai = row[xepLoaiIdx] ? String(row[xepLoaiIdx]).trim() : '';
          if (!xepLoai && dtb) {
            const numDtb = parseFloat(String(dtb));
            if (numDtb >= 8.0) xepLoai = 'Tốt';
            else if (numDtb >= 6.5) xepLoai = 'Khá';
            else if (numDtb >= 5.0) xepLoai = 'Đạt';
            else xepLoai = 'Chưa đạt';
          }

          const renLuyen = row[renLuyenIdx] ? String(row[renLuyenIdx]).trim() : 'Tốt';
          const comment = row[commentIdx] ? String(row[commentIdx]).trim() : '';
          const parentPhone = row[phoneIdx] ? String(row[phoneIdx]).trim() : '';

          parsedStudents.push({
            id: String(r),
            stt: curStt++,
            name: studentName,
            tx1,
            tx2,
            tx3,
            gk,
            ck,
            dtb,
            xepLoai,
            renLuyen,
            comment,
            parentPhone
          });
        }

        if (parsedStudents.length > 0) {
          setStudents(parsedStudents);
          setSelectedStudentForSlip(parsedStudents[0]);
          alert(`Đã nhập thành công bảng điểm của ${parsedStudents.length} học sinh từ file Excel!`);
        } else {
          alert('Không tìm thấy danh sách học sinh hợp lệ trong file Excel.');
        }
      } catch (err: any) {
        alert(`Lỗi đọc file Excel: ${err?.message || String(err)}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Download Sample Excel File
  const handleDownloadSampleExcel = () => {
    const wsData = [
      ['TRƯỜNG THCS PHÙNG KHẮC KHOAN', '', '', '', '', '', '', '', '', '', ''],
      [`BẢNG ĐIỂM VÀ NHẬN XÉT HỌC SINH LỚP ${className}`, '', '', '', '', '', '', '', '', '', ''],
      [`Môn: ${subjectName} - ${semester}`, '', '', '', '', '', '', '', '', '', ''],
      [''],
      ['STT', 'Họ và tên', 'TX1', 'TX2', 'TX3', 'Giữa kỳ (GK)', 'Cuối kỳ (CK)', 'Điểm TB', 'Học lực', 'Rèn luyện', 'SĐT Phụ huynh', 'Nhận xét của Giáo viên'],
      [1, 'Nguyễn Minh Quân', 9.0, 8.5, 9.5, 9.0, 9.5, 9.2, 'Tốt', 'Tốt', '0912.345.678', 'Tư duy logic rất tốt, hăng hái phát biểu, gương mẫu trong học tập.'],
      [2, 'Trần Phương Linh', 8.5, 9.0, 8.5, 8.8, 9.0, 8.8, 'Tốt', 'Tốt', '0987.654.321', 'Chăm chỉ, bài làm cẩn thận, nắm chắc kiến thức.'],
      [3, 'Phạm Đức Anh', 7.0, 6.5, 7.5, 7.0, 7.5, 7.2, 'Khá', 'Tốt', '0904.112.233', 'Có tiến bộ, cần rèn thêm kỹ năng tính toán cẩn thận.'],
      [4, 'Lê Thu Hà', 8.0, 7.5, 8.5, 8.0, 8.5, 8.2, 'Khá', 'Tốt', '0982.778.899', 'Ngoan ngoãn, hoàn thành tốt bài tập được giao.'],
      [5, 'Hoàng Quốc Bảo', 5.5, 6.0, 5.0, 5.5, 6.0, 5.7, 'Đạt', 'Khá', '0936.554.433', 'Cần chú ý ôn tập thêm ở nhà, khắc phục lỗi tính toán.']
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `BangDiem_Lop_${className}`);
    XLSX.writeFile(wb, `Mau_Bang_Diem_Va_Nhan_Xet_Lop_${className}.xlsx`);
  };

  // Generate comment for a single student with AI
  const handleGenerateSingleComment = async (student: StudentGradeRecord) => {
    const apiKeys = apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);

    // Update state to show loading spinner on student row
    setStudents(prev => prev.map(s => s.id === student.id ? { ...s, isGeneratingComment: true } : s));

    const prompt = `Bạn là Giáo viên chủ nhiệm & Giáo viên bộ môn ${subjectName} tâm huyết, chuẩn mực theo Chương trình GDPT 2018 (Thông tư 22/TT 27 Bộ GD&ĐT).
Hãy viết một lời nhận xét, đánh giá định kỳ ngắn gọn, tinh tế, mang tính khích lệ sư phạm cao cho học sinh sau:

THÔNG TIN HỌC SINH:
- Họ và tên: ${student.name}
- Lớp: ${className} | Môn: ${subjectName}
- Điểm Thường xuyên: TX1=${student.tx1 || '-'}, TX2=${student.tx2 || '-'}, TX3=${student.tx3 || '-'}
- Điểm Giữa kỳ: ${student.gk || '-'} | Cuối kỳ: ${student.ck || '-'} | Điểm TB: ${student.dtb || '-'}
- Xếp loại học lực: ${student.xepLoai || 'Khá'} | Rèn luyện / Hạnh kiểm: ${student.renLuyen || 'Tốt'}
- Chuẩn đánh giá: ${evalStandard === 'tt22' ? 'Thông tư 22/2021/TT-BGDĐT (Tốt, Khá, Đạt, Chưa đạt)' : 'Thông tư 27/2020/TT-BGDĐT (Xuất sắc, Tốt, Hoàn thành)'}
- Độ dài mong muốn: ${commentLength === 'concise' ? 'Ngắn gọn 1-2 câu súc tích' : 'Đầy đủ 3 ý: Điểm mạnh, Điểm cần khắc phục, Lời động viên gửi PHHS (khoảng 3-4 câu)'}

YÊU CẦU QUAN TRỌNG:
1. Nêu rõ thế mạnh môn học, thái độ học tập và sự tiến bộ.
2. Chỉ ra điểm cụ thể cần rèn luyện thêm (cách tính toán, tự giác, trình bày...).
3. Lời chúc/lời nhắn gửi PHHS chân thành, ấm áp.
4. Chỉ trả về duy nhất đoạn văn nhận xét, KHÔNG kèm tiêu đề hay giải thích ngoài lề.`;

    try {
      const result = await generateGeminiText({
        prompt,
        apiKeys,
        maxOutputTokens: 500
      });
      if (result) {
        const cleanComment = stripIntroductoryChatter(result).trim();
        setStudents(prev => prev.map(s => s.id === student.id ? { ...s, comment: cleanComment, isGeneratingComment: false } : s));
      }
    } catch (err: any) {
      alert(`Lỗi AI nhận xét: ${err?.message || String(err)}`);
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, isGeneratingComment: false } : s));
    }
  };

  // Generate comments for ALL students in batch
  const handleGenerateAllComments = async () => {
    if (students.length === 0) {
      alert('Chưa có danh sách học sinh!');
      return;
    }
    const apiKeys = apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);
    setIsGeneratingAll(true);

    const studentsInfo = students.map(s => `ID:${s.id} | STT:${s.stt} | Tên:${s.name} | TX:${s.tx1},${s.tx2} | GK:${s.gk} | CK:${s.ck} | ĐTB:${s.dtb} | HL:${s.xepLoai} | RL:${s.renLuyen}`).join('\n');

    const prompt = `Bạn là Chuyên gia Đánh giá Giáo dục theo Thông tư 22/2021/TT-BGDĐT & GDPT 2018.
Dưới đây là danh sách điểm số của ${students.length} học sinh lớp ${className} môn ${subjectName}:

=== DANH SÁCH HỌC SINH ===
${studentsInfo}
=== HẾT DANH SÁCH ===

NHIỆM VỤ CỦA BẠN:
Tạo lời nhận xét cá nhân hóa, sâu sắc, độc đáo, không trùng lặp cho TỪNG học sinh theo định dạng nghiêm ngặt sau:

[ID:id_hoc_sinh] Lời nhận xét sư phạm chi tiết cho học sinh đó (nêu rõ ưu điểm, mặt cần cố gắng và lời dặn gửi phụ huynh).

Ví dụ:
[ID:1] Em có tư duy toán học rất tốt, tiếp thu bài nhanh và luôn chủ động giúp đỡ bạn bè. Cần phát huy hơn nữa ở các dạng toán mở rộng.
[ID:2] Học lực vững vàng, bài làm cẩn thận, nề nếp gương mẫu. Đề nghị gia đình tiếp tục khích lệ em duy trì phong độ.

Hãy trả về nhận xét cho toàn bộ ${students.length} học sinh ngay bây giờ!`;

    try {
      const result = await generateGeminiText({
        prompt,
        apiKeys,
        maxOutputTokens: 16384
      });
      if (result) {
        const text = stripIntroductoryChatter(result);
        const matches = [...text.matchAll(/\[ID:([^\]]+)\]\s*([\s\S]*?)(?=\[ID:|$)/gi)];

        if (matches.length > 0) {
          const updated = [...students];
          matches.forEach(m => {
            const id = m[1].trim();
            const comment = m[2].trim();
            const target = updated.find(s => s.id === id || String(s.stt) === id);
            if (target && comment) {
              target.comment = comment;
            }
          });
          setStudents(updated);
          alert(`Đã hoàn thành sinh nhận xét AI tự động cho ${matches.length} học sinh!`);
        } else {
          // Fallback: parse line by line
          alert('Đã nhận diện xong nhận xét AI.');
        }
      }
    } catch (err: any) {
      alert(`Lỗi khi tạo nhận xét cả lớp: ${err?.message || String(err)}`);
      if (err?.message?.includes('429') || err?.message?.includes('quota')) {
        onOpenApiGuide?.();
      }
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // Export Summary Table to Word (.docx)
  const handleExportClassTableWord = async () => {
    if (students.length === 0) {
      alert('Không có dữ liệu học sinh để xuất file!');
      return;
    }

    let md = `# BẢNG TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ & NHẬN XÉT HỌC SINH
**Lớp:** ${className} | **Môn học:** ${subjectName} | **Năm học:** ${semester}
**Giáo viên giảng dạy & chủ nhiệm:** ${teacherName} | **Trường:** ${schoolName}

---

| STT | Họ và tên học sinh | TX1 | TX2 | Giữa kỳ | Cuối kỳ | ĐTB | Học lực | Rèn luyện | Lời nhận xét đánh giá của Giáo viên |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---|
`;

    students.forEach(s => {
      md += `| ${s.stt} | **${s.name}** | ${s.tx1 || '-'} | ${s.tx2 || '-'} | ${s.gk || '-'} | ${s.ck || '-'} | **${s.dtb || '-'}** | ${s.xepLoai || '-'} | ${s.renLuyen || '-'} | ${s.comment || 'Chăm ngoan, hoàn thành chương trình học.'} |\n`;
    });

    md += `
---

| **HIỆU TRƯỞNG DUYỆT** | **TỔ TRƯỞNG CHUYÊN MÔN** | **GIÁO VIÊN CHỦ NHIỆM / BỘ MÔN** |
|:---:|:---:|:---:|
| *(Ký và đóng dấu)* | *(Ký và ghi rõ họ tên)* | *(Ký và ghi rõ họ tên)* |
| <br/><br/><br/>**Hiệu trưởng** | <br/><br/><br/>**Tổ trưởng** | <br/><br/><br/>**${teacherName}** |
`;

    try {
      await exportMarkdownToWord(md, {
        fileName: `Bang_Tong_Hop_Nhan_Xet_Lop_${className}_${subjectName}.docx`,
        headerText: `${schoolName} - Lớp ${className}`,
        footerText: `Bảng nhận xét học sinh - Giáo viên: ${teacherName.replace(/^(?:Thầy|Cô)\s+/i, '')}`,
        schoolName,
        teacherName,
        lop: className,
        isLandscape: true,
        showPageNumbers: true
      });
    } catch (err: any) {
      alert(`Lỗi xuất file Word: ${err?.message || String(err)}`);
    }
  };

  // Export Individual Student Slips to Word (.docx)
  const handleExportIndividualSlipsWord = async () => {
    if (students.length === 0) {
      alert('Không có dữ liệu học sinh để xuất phiếu!');
      return;
    }

    let md = '';

    students.forEach((s, idx) => {
      md += `
# PHIẾU BÁO KẾT QUẢ HỌC TẬP & NHẬN XÉT ĐÁNH GIÁ ĐỊNH KỲ
**TRƯỜNG:** ${schoolName.toUpperCase()} | **LỚP:** ${className} | **NĂM HỌC:** ${semester}

### THÔNG TIN HỌC SINH:
- **Họ và tên:** **${s.name.toUpperCase()}** (STT: ${s.stt})
- **Môn học:** ${subjectName}
- **Giáo viên phụ trách:** ${teacherName}
- **Số điện thoại liên hệ PHHS:** ${s.parentPhone || '...........................'}

### 1. KẾT QUẢ ĐIỂM SỐ & XẾP LOẠI:
| Điểm Thường xuyên 1 | Điểm Thường xuyên 2 | Điểm Giữa kỳ | Điểm Cuối kỳ | Điểm Trung bình | Xếp loại Học lực | Đánh giá Rèn luyện |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **${s.tx1 || '-'}** | **${s.tx2 || '-'}** | **${s.gk || '-'}** | **${s.ck || '-'}** | **${s.dtb || '-'}** | **${s.xepLoai || '-'}** | **${s.renLuyen || '-'}** |

### 2. LỜI NHẬN XÉT CỦA GIÁO VIÊN CHỦ NHIỆM / BỘ MÔN:
> *${s.comment || 'Em có ý thức học tập tốt, chấp hành nghiêm túc nội quy trường lớp và hoàn thành tốt nhiệm vụ học tập.'}*

### 3. Ý KIẾN VÀ KÝ XÁC NHẬN CỦA PHỤ HUYNH HỌC SINH:
........................................................................................................................................................................................................
........................................................................................................................................................................................................

| **Ý KIẾN & CHỮ KÝ PHỤ HUYNH** | **GIÁO VIÊN CHỦ NHIỆM** |
|:---:|:---:|
| *(Ký và ghi rõ họ tên)* | *(Ký và ghi rõ họ tên)* |
| <br/><br/><br/>................................................... | <br/><br/><br/>**${teacherName}** |

---
`;
    });

    try {
      await exportMarkdownToWord(md, {
        fileName: `Toan_Bo_Phieu_Bao_Diem_Gui_PHHS_Lop_${className}.docx`,
        headerText: `${schoolName} - Phiếu Báo Kết Quả Học Tập`,
        footerText: `Lớp ${className} - GVCN: ${teacherName}`,
        schoolName,
        teacherName,
        lop: className,
        showPageNumbers: true
      });
    } catch (err: any) {
      alert(`Lỗi xuất phiếu học sinh: ${err?.message || String(err)}`);
    }
  };

  // Export Updated Excel File
  const handleExportUpdatedExcel = () => {
    const wsData: any[][] = [
      ['STT', 'Họ và tên', 'TX1', 'TX2', 'TX3', 'Giữa kỳ', 'Cuối kỳ', 'Điểm TB', 'Học lực', 'Rèn luyện', 'SĐT Phụ huynh', 'Lời nhận xét của Giáo viên']
    ];

    students.forEach(s => {
      wsData.push([
        s.stt,
        s.name,
        s.tx1 ?? '',
        s.tx2 ?? '',
        s.tx3 ?? '',
        s.gk ?? '',
        s.ck ?? '',
        s.dtb ?? '',
        s.xepLoai ?? '',
        s.renLuyen ?? '',
        s.parentPhone ?? '',
        s.comment ?? ''
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `NhanXet_${className}`);
    XLSX.writeFile(wb, `Bang_Diem_Kem_Nhan_Xet_Lop_${className}.xlsx`);
  };

  // Copy Zalo Message for a specific student
  const handleCopyZaloMessage = (student: StudentGradeRecord) => {
    const message = `Kính gửi Quý Phụ huynh em ${student.name} (Lớp ${className} - ${schoolName}):
Thầy/Cô xin gửi thông tin kết quả học tập môn ${subjectName} (${semester}) của em:
- Điểm kiểm tra: TX1=${student.tx1 || '-'}, TX2=${student.tx2 || '-'}, GK=${student.gk || '-'}, CK=${student.ck || '-'}
- Điểm trung bình: ${student.dtb || '-'} | Học lực: ${student.xepLoai || '-'} | Rèn luyện: ${student.renLuyen || '-'}
- Nhận xét của Giáo viên: "${student.comment || 'Em chăm ngoan, hoàn thành tốt nhiệm vụ học tập.'}"

Kính mong Quý Phụ huynh tiếp tục đồng hành và động viên em trong thời gian tới. Trân trọng cảm ơn!`;

    navigator.clipboard.writeText(message);
    setCopiedId(student.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter students
  const filteredStudents = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || String(s.stt).includes(searchTerm);
    if (!matchSearch) return false;
    if (filterRating === 'good') return s.xepLoai === 'Tốt' || (parseFloat(String(s.dtb)) >= 8.0);
    if (filterRating === 'fair') return s.xepLoai === 'Khá' || (parseFloat(String(s.dtb)) >= 6.5 && parseFloat(String(s.dtb)) < 8.0);
    if (filterRating === 'pass') return s.xepLoai === 'Đạt' || (parseFloat(String(s.dtb)) >= 5.0 && parseFloat(String(s.dtb)) < 6.5);
    if (filterRating === 'fail') return s.xepLoai === 'Chưa đạt' || (parseFloat(String(s.dtb)) < 5.0);
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-900/60 via-teal-900/40 to-indigo-950/60 border border-emerald-500/40 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-300 shadow-inner">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Nhập File Điểm Excel & Tự Động Xuất Nhận Xét Từng Học Sinh
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 border border-emerald-400/50 text-emerald-200">
                  Thông tư 22 & TT 27
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100/80 mt-0.5">
                Đọc bảng điểm Excel (.xlsx/.csv), AI tự động nhận xét chi tiết từng học sinh, xuất bảng tổng hợp cả lớp & xuất phiếu liên lạc gửi đến từng PHHS
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer transition-all">
              <Upload className="w-4 h-4" />
              <span>📂 Tải Lên File Excel Bảng Điểm</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={handleDownloadSampleExcel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 transition-all"
            >
              <FileDown className="w-4 h-4" />
              <span>Mẫu Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">Trường</label>
            <input
              type="text"
              value={schoolName}
              onChange={e => setSchoolName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">Lớp Học</label>
            <input
              type="text"
              value={className}
              onChange={e => setClassName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">Môn Học</label>
            <input
              type="text"
              value={subjectName}
              onChange={e => setSubjectName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">Giáo Viên</label>
            <input
              type="text"
              value={teacherName}
              onChange={e => setTeacherName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">Chuẩn Nhận Xét</label>
            <select
              value={evalStandard}
              onChange={e => setEvalStandard(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-emerald-300 font-bold"
            >
              <option value="tt22">Thông tư 22 (THCS & THPT)</option>
              <option value="tt27">Thông tư 27 (Tiểu học)</option>
              <option value="quality_first">Động viên & Phẩm chất</option>
            </select>
          </div>
        </div>

        {/* Action Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateAllComments}
              disabled={isGeneratingAll || students.length === 0}
              className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/40 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isGeneratingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
              <span>✨ AI TỰ ĐỘNG NHẬN XÉT CẢ LỚP ({students.length} HS)</span>
            </button>

            <button
              onClick={() => {
                setStudents(DEFAULT_DEMO_STUDENTS);
                setSelectedStudentForSlip(DEFAULT_DEMO_STUDENTS[0]);
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            >
              🎲 Nạp Dữ Liệu Demo (8 HS)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportClassTableWord}
              disabled={students.length === 0}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Xuất Bảng Cả Lớp (Word)</span>
            </button>

            <button
              onClick={handleExportIndividualSlipsWord}
              disabled={students.length === 0}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Xuất Phiếu Gửi Từng PHHS</span>
            </button>

            <button
              onClick={handleExportUpdatedExcel}
              disabled={students.length === 0}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white shadow-md flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất Excel Đầy Đủ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub Views Navigation: Table View vs Individual Slips Preview */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTabSubView('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTabSubView === 'table'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Bảng Điểm & Nhận Xét Lớp ({students.length})</span>
          </button>
          <button
            onClick={() => setActiveTabSubView('slips')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTabSubView === 'slips'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Xem Phiếu Báo Điểm Từng Học Sinh Gửi PHHS</span>
          </button>
        </div>

        {/* Search & Filter */}
        {activeTabSubView === 'table' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên hoặc STT..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white w-44 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <select
              value={filterRating}
              onChange={e => setFilterRating(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">Tất cả xếp loại</option>
              <option value="good">Loại Tốt (≥ 8.0)</option>
              <option value="fair">Loại Khá (6.5 - 7.9)</option>
              <option value="pass">Loại Đạt (5.0 - 6.4)</option>
              <option value="fail">Chưa đạt (&lt; 5.0)</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeTabSubView === 'table' ? (
        /* Table View of all Students */
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="min-w-full text-xs text-left border-collapse">
              <thead className="bg-slate-800/90 text-slate-300 font-bold sticky top-0 z-10">
                <tr>
                  <th className="p-2.5 text-center w-12 border-b border-slate-700">STT</th>
                  <th className="p-2.5 border-b border-slate-700 min-w-[140px]">Họ và Tên</th>
                  <th className="p-2.5 text-center border-b border-slate-700 w-12">TX1</th>
                  <th className="p-2.5 text-center border-b border-slate-700 w-12">TX2</th>
                  <th className="p-2.5 text-center border-b border-slate-700 w-12">GK</th>
                  <th className="p-2.5 text-center border-b border-slate-700 w-12">CK</th>
                  <th className="p-2.5 text-center border-b border-slate-700 w-14">ĐTB</th>
                  <th className="p-2.5 text-center border-b border-slate-700 w-16">Học Lực</th>
                  <th className="p-2.5 border-b border-slate-700 min-w-[280px]">Lời Nhận Xét Của Giáo Viên (Sửa tay / AI)</th>
                  <th className="p-2.5 text-center border-b border-slate-700 w-28">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-2.5 text-center font-bold text-slate-400">{student.stt}</td>
                    <td className="p-2.5 font-bold text-white">
                      <div>{student.name}</div>
                      {student.parentPhone && (
                        <span className="text-[10px] text-slate-400 font-normal">SĐT: {student.parentPhone}</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center text-slate-300 font-mono">{student.tx1 ?? '-'}</td>
                    <td className="p-2.5 text-center text-slate-300 font-mono">{student.tx2 ?? '-'}</td>
                    <td className="p-2.5 text-center text-slate-300 font-mono">{student.gk ?? '-'}</td>
                    <td className="p-2.5 text-center text-slate-300 font-mono">{student.ck ?? '-'}</td>
                    <td className="p-2.5 text-center font-bold text-emerald-400 font-mono text-sm">{student.dtb ?? '-'}</td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        student.xepLoai === 'Tốt' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                        student.xepLoai === 'Khá' ? 'bg-sky-950 text-sky-300 border border-sky-500/40' :
                        student.xepLoai === 'Đạt' ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                        'bg-rose-950 text-rose-300 border border-rose-500/40'
                      }`}>
                        {student.xepLoai || 'Chưa xét'}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <textarea
                        rows={2}
                        value={student.comment || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setStudents(prev => prev.map(s => s.id === student.id ? { ...s, comment: val } : s));
                        }}
                        placeholder="Nhập nhận xét hoặc bấm 'AI Viết'..."
                        className="w-full p-2 rounded-lg bg-slate-950/80 border border-slate-700 text-xs text-slate-100 focus:border-emerald-400 focus:outline-none leading-relaxed"
                      />
                    </td>
                    <td className="p-2.5 text-center space-y-1">
                      <button
                        onClick={() => handleGenerateSingleComment(student)}
                        disabled={student.isGeneratingComment}
                        className="w-full px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 flex items-center justify-center gap-1 transition-all"
                      >
                        {student.isGeneratingComment ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-amber-300" />}
                        <span>AI Viết</span>
                      </button>

                      <button
                        onClick={() => handleCopyZaloMessage(student)}
                        className="w-full px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1 transition-all"
                      >
                        {copiedId === student.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                        <span>{copiedId === student.id ? 'Đã Chép' : 'Gửi Zalo'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Individual Student Slip Preview View */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Student Selector List (4 Cols) */}
          <div className="md:col-span-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2 pb-2 border-b border-slate-800">
              <Users className="w-4 h-4 text-emerald-400" />
              Chọn Học Sinh Xem Phiếu ({students.length})
            </h3>
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {students.map((student) => {
                const isSelected = selectedStudentForSlip?.id === student.id;
                return (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudentForSlip(student)}
                    className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between border transition-all ${
                      isSelected
                        ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow-md'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0">
                        {student.stt}
                      </span>
                      <span className="text-xs font-bold truncate">{student.name}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 shrink-0">
                      ĐTB: {student.dtb || '-'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Preview Slip (8 Cols) */}
          <div className="md:col-span-8 p-6 rounded-2xl bg-white text-slate-900 border border-slate-300 shadow-2xl space-y-6 font-serif">
            {selectedStudentForSlip ? (
              <div className="space-y-5">
                {/* Header */}
                <div className="grid grid-cols-2 text-center text-xs font-bold pb-4 border-b border-slate-300 font-sans">
                  <div>
                    <p className="uppercase text-slate-900">{schoolName}</p>
                    <p className="text-emerald-800">LỚP: {className}</p>
                  </div>
                  <div>
                    <p className="uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                    <p className="underline decoration-slate-400">Độc lập - Tự do - Hạnh phúc</p>
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h2 className="text-lg font-black text-slate-900 uppercase font-sans">
                    PHIẾU BÁO KẾT QUẢ HỌC TẬP & ĐÁNH GIÁ ĐỊNH KỲ
                  </h2>
                  <p className="text-xs text-slate-600 italic">
                    {semester} - Môn: {subjectName}
                  </p>
                </div>

                {/* Student Info Card */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 font-sans">
                  <div className="grid grid-cols-2 gap-2">
                    <p>Họ và tên học sinh: <strong className="text-emerald-900 uppercase text-sm">{selectedStudentForSlip.name}</strong></p>
                    <p>Số thứ tự: <strong>{selectedStudentForSlip.stt}</strong></p>
                    <p>Giáo viên phụ trách: <strong>{teacherName}</strong></p>
                    <p>Số ĐT Phụ huynh: <strong>{selectedStudentForSlip.parentPhone || 'Chưa cập nhật'}</strong></p>
                  </div>
                </div>

                {/* Scores Table */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-800 uppercase font-sans">1. Kết Quả Điểm Số & Đánh Giá:</h4>
                  <table className="w-full text-xs text-center border border-slate-300 font-sans">
                    <thead className="bg-slate-100 font-bold text-slate-700">
                      <tr>
                        <th className="p-2 border border-slate-300">TX 1</th>
                        <th className="p-2 border border-slate-300">TX 2</th>
                        <th className="p-2 border border-slate-300">Giữa Kỳ</th>
                        <th className="p-2 border border-slate-300">Cuối Kỳ</th>
                        <th className="p-2 border border-slate-300 bg-emerald-50 text-emerald-900">Điểm TB</th>
                        <th className="p-2 border border-slate-300">Học Lực</th>
                        <th className="p-2 border border-slate-300">Rèn Luyện</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2 border border-slate-300 font-bold">{selectedStudentForSlip.tx1 ?? '-'}</td>
                        <td className="p-2 border border-slate-300 font-bold">{selectedStudentForSlip.tx2 ?? '-'}</td>
                        <td className="p-2 border border-slate-300 font-bold">{selectedStudentForSlip.gk ?? '-'}</td>
                        <td className="p-2 border border-slate-300 font-bold">{selectedStudentForSlip.ck ?? '-'}</td>
                        <td className="p-2 border border-slate-300 font-black text-emerald-800 text-sm bg-emerald-50">{selectedStudentForSlip.dtb ?? '-'}</td>
                        <td className="p-2 border border-slate-300 font-bold">{selectedStudentForSlip.xepLoai ?? '-'}</td>
                        <td className="p-2 border border-slate-300 font-bold">{selectedStudentForSlip.renLuyen ?? '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Comment */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-800 uppercase font-sans">2. Nhận Xét Của Giáo Viên Chủ Nhiệm / Bộ Môn:</h4>
                  <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs leading-relaxed italic text-emerald-950">
                    "{selectedStudentForSlip.comment || 'Em chăm ngoan, có ý thức học tập tốt và hoàn thành các nội dung bài học.'}"
                  </div>
                </div>

                {/* Parent Section */}
                <div className="space-y-1.5 pt-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase font-sans">3. Ý Kiến Của Cha Mẹ Học Sinh:</h4>
                  <div className="border-b border-dotted border-slate-400 py-3"></div>
                  <div className="border-b border-dotted border-slate-400 py-3"></div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 text-center text-xs font-sans pt-4">
                  <div>
                    <p className="font-bold uppercase">Ý KIẾN & CHỮ KÝ PHỤ HUYNH</p>
                    <p className="text-[10px] text-slate-500 italic">(Ký và ghi rõ họ tên)</p>
                    <div className="h-16"></div>
                  </div>
                  <div>
                    <p className="font-bold uppercase">GIÁO VIÊN CHỦ NHIỆM</p>
                    <p className="text-[10px] text-slate-500 italic">(Ký và ghi rõ họ tên)</p>
                    <div className="h-12"></div>
                    <p className="font-bold text-slate-900">{teacherName}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400">
                <p>Chọn một học sinh bên trái để xem trước phiếu báo điểm</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
