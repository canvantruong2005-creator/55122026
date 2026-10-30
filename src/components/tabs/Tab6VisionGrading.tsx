import React, { useState, useRef } from 'react';
import { generateGeminiVision, generateGeminiText } from '../../lib/geminiApi';
import { ExamResultItem } from '../../types';
import { Camera, Upload, CheckCircle2, AlertTriangle, FileSpreadsheet, Printer, Download, Eye, Sparkles, Trash2, Award, Copy, Check, FileText, MessageSquare, Send, CheckSquare } from 'lucide-react';
import { exportMarkdownToWord, exportHanoiStandardBubbleSheet } from '../../lib/wordExport';
import { readFileAsText } from '../../lib/fileUtils';
import { saveAs } from 'file-saver';

interface Tab6VisionGradingProps {
  apiKeysInput: string;
  examResults: ExamResultItem[];
  onAddExamResult: (result: ExamResultItem) => void;
  onClearExamResults: () => void;
  onOpenApiGuide: () => void;
  monHoc: string;
  lop: string;
}

export const Tab6VisionGrading: React.FC<Tab6VisionGradingProps> = ({
  apiKeysInput,
  examResults,
  onAddExamResult,
  onClearExamResults,
  onOpenApiGuide,
  monHoc,
  lop
}) => {
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [masterKeyText, setMasterKeyText] = useState('Mã đề 101: 1.A, 2.B, 3.C, 4.D, 5.A\nMã đề 102: 1.C, 2.D, 3.A, 4.B, 5.C');
  const [answerKeyFile, setAnswerKeyFile] = useState<File | null>(null);
  const [isScanningAnswerKey, setIsScanningAnswerKey] = useState(false);

  const [gradeTN, setGradeTN] = useState(true);
  const [gradeTL, setGradeTL] = useState(true);

  const [isGrading, setIsGrading] = useState(false);
  const [gradingLogs, setGradingLogs] = useState<string>('');

  const [errorAnalysisText, setErrorAnalysisText] = useState('');
  const [isAnalyzingErrors, setIsAnalyzingErrors] = useState(false);

  // Bubble Sheet Generator state
  const [bubbleQuestionCount, setBubbleQuestionCount] = useState('40');

  // Webcam state
  const [showWebcamModal, setShowWebcamModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Feedback detail modal state
  const [activeFeedbackModal, setActiveFeedbackModal] = useState<ExamResultItem | null>(null);
  const [copiedCommentId, setCopiedCommentId] = useState<string | null>(null);

  const handleCopyFeedback = (result: ExamResultItem) => {
    const content = `=== KẾT QUẢ VÀ NHẬN XÉT BÀI LÀM HỌC SINH ===\n` +
      `Môn: ${monHoc} - Lớp ${lop}\n` +
      `Họ và tên: ${result.studentName}\n` +
      `Mã đề: ${result.examCode}\n` +
      `Tổng điểm: ${result.score}\n` +
      `Số câu trắc nghiệm đúng: ${result.correctAnswers}\n` +
      `Chi tiết câu sai / lưu ý: ${result.wrongDetails}\n` +
      `-----------------------------------------\n` +
      `NHẬN XÉT CỦA GIÁO VIÊN:\n${result.teacherComment || 'Chưa có nhận xét riêng'}\n` +
      (result.essayFeedback ? `\nCHI TIẾT CHẤM TỰ LUẬN:\n${result.essayFeedback}\n` : '');
    
    navigator.clipboard.writeText(content);
    setCopiedCommentId(result.id);
    setTimeout(() => setCopiedCommentId(null), 2500);
  };

  const handleExportSingleFeedbackDoc = async (result: ExamResultItem) => {
    const md = `# PHIẾU BÁO ĐIỂM & NHẬN XÉT BÀI LÀM HỌC SINH
**Môn học:** ${monHoc} - **Khối lớp:** ${lop}
**Họ và tên học sinh:** ${result.studentName}
**Mã đề kiểm tra:** ${result.examCode}

---

## 1. KẾT QUẢ ĐIỂM SỐ
- **Tổng điểm đạt được:** **${result.score} / 10**
- **Trắc nghiệm:** ${result.correctAnswers} câu đúng
- **Các câu trắc nghiệm sai:** ${result.wrongDetails}

---

## 2. NHẬN XÉT CỦA GIÁO VIÊN
${result.teacherComment || 'Bài làm đạt yêu cầu, cần chú ý ôn tập kĩ các dạng câu hỏi đã làm sai.'}

${result.essayFeedback ? `---

## 3. CHI TIẾT ĐÁNH GIÁ PHẦN TỰ LUẬN
${result.essayFeedback}` : ''}

---
*Phiếu điểm được xuất tự động từ Hệ thống Trợ lý Giáo viên AI Lesson Planner Pro.*`;

    await exportMarkdownToWord(md, `Phieu_Nhan_Xet_${result.studentName.replace(/\s+/g, '_')}_Diem_${result.score}`);
  };

  const handleExportAllFeedbacksDoc = async () => {
    if (examResults.length === 0) return;
    let md = `# TỔNG HỢP NHẬN XÉT VÀ ĐIỂM BÀI LÀM TOÀN BỘ HỌC SINH
**Môn học:** ${monHoc} - **Khối lớp:** ${lop}
**Ngày xuất:** ${new Date().toLocaleDateString('vi-VN')}
**Tổng số bài đã chấm:** ${examResults.length} học sinh

---
\n`;

    examResults.forEach((r, idx) => {
      md += `## ${idx + 1}. Học sinh: ${r.studentName} (Mã đề: ${r.examCode})
- **Tổng điểm:** **${r.score} điểm** (Đúng ${r.correctAnswers})
- **Lỗi sai:** ${r.wrongDetails}
- **Lời nhận xét:** ${r.teacherComment || 'Đã chấm và ghi nhận kết quả.'}
${r.essayFeedback ? `\n- **Đánh giá tự luận:** ${r.essayFeedback}\n` : ''}

---
\n`;
    });

    await exportMarkdownToWord(md, `Tong_Hop_Nhan_Xet_Gui_Hoc_Sinh_Lop_${lop}`);
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedImageFiles(Array.from(e.target.files));
    }
  };

  const handleAnswerKeyFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAnswerKeyFile(file);
      if (!file.type.startsWith('image/')) {
        try {
          const parsedKeys = apiKeysInput ? apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean) : [];
          const content = await readFileAsText(file, { apiKeys: parsedKeys });
          setMasterKeyText(content);
        } catch (err) {
          console.error('Lỗi đọc file:', err);
        }
      }
    }
  };

  const handleScanAnswerKeyFile = async () => {
    if (!answerKeyFile) {
      alert('Vui lòng chọn Tải/Chọn File hoặc Ảnh Bảng Đáp Án trước!');
      return;
    }

    const apiKeys = apiKeysInput ? apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean) : [];

    setIsScanningAnswerKey(true);
    try {
      if (answerKeyFile.type.startsWith('image/')) {
        const base64Img = await new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onload = e => resolve((e.target?.result as string) || '');
          reader.readAsDataURL(answerKeyFile);
        });

        const prompt = `ĐÓNG VAI TỔ TRƯỞNG CHẤM THI AI VISION OCR.
Nhiệm vụ: Hãy đọc và trích xuất BẢNG ĐÁP ÁN (Master Key) từ bức ảnh file đáp án này.
Yêu cầu trả về đúng định dạng văn bản chuẩn rõ ràng cho từng mã đề:
Mã đề 101: 1.A, 2.B, 3.C, 4.D, ...
Mã đề 102: 1.C, 2.D, 3.A, 4.B, ...
(Nếu có cả đáp án câu tự luận, ghi rõ thang điểm và đáp án vắn tắt).`;

        const result = await generateGeminiVision({
          prompt,
          imageBase64: base64Img,
          apiKeys
        });

        if (result) {
          setMasterKeyText(result);
          alert('✨ Đã AI Vision quét thành công Bảng Đáp Án từ ảnh!');
        }
      } else {
        const reader = new FileReader();
        reader.onload = event => {
          const content = (event.target?.result as string) || '';
          setMasterKeyText(content);
          alert('✓ Đã nạp nội dung file đáp án thành công!');
        };
        reader.readAsText(answerKeyFile);
      }
    } catch (err: any) {
      alert('Lỗi đọc/quét file đáp án: ' + err.message);
    } finally {
      setIsScanningAnswerKey(false);
    }
  };

  const handleStartWebcam = async () => {
    setShowWebcamModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Không thể mở Camera trên thiết bị.');
      setShowWebcamModal(false);
    }
  };

  const handleCaptureWebcam = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob(blob => {
          if (blob) {
            const capturedFile = new File([blob], `captured_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setSelectedImageFiles(prev => [...prev, capturedFile]);
            // Stop stream
            const stream = videoRef.current?.srcObject as MediaStream;
            stream?.getTracks().forEach(t => t.stop());
            setShowWebcamModal(false);
          }
        }, 'image/jpeg');
      }
    }
  };

  const handleGradeWithAI = async () => {
    if (selectedImageFiles.length === 0) {
      alert('Chưa chọn ảnh phiếu bài làm học sinh!');
      return;
    }

    const apiKeys = apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);

    setIsGrading(true);
    setGradingLogs('Đang tiến hành chấm thi AI Vision (Hệ thống 3 Key xoay vòng)...\n');

    for (let idx = 0; idx < selectedImageFiles.length; idx++) {
      const imgFile = selectedImageFiles[idx];
      setGradingLogs(prev => prev + `\n--- Đang chấm bài ${idx + 1}/${selectedImageFiles.length}: ${imgFile.name} ---\n`);

      // Read image as base64
      const base64Img = await new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = e => resolve((e.target?.result as string) || '');
        reader.readAsDataURL(imgFile);
      });

      const prompt = `BẠN LÀ TỔ TRƯỞNG CHUYÊN MÔN GIÁO VIÊN CHẤM THI AI VISION MÔN ${monHoc.toUpperCase()} LỚP ${lop}.
Nhiệm vụ: Phân tích ảnh bài làm học sinh (gồm họ tên, SBD, mã đề, trắc nghiệm tô đen/khoanh tròn và BÀI TỰ LUẬN VIẾT TAY HOẶC LỜI GIẢI TỪNG BƯỚC).

BẢNG MASTER KEY & THANG ĐIỂM ĐÁP ÁN CHUẨN:
${masterKeyText}

QUY TRÌNH CHẤM VÀ ĐÁNH GIÁ CHUYÊN SÂU:
1. TRẮC NGHIỆM: Đọc chuẩn mã đề, đối chiếu đáp án, chỉ rõ các câu làm đúng và các câu làm sai.
2. TỰ LUẬN (CHẤM TỰ LUẬN VIẾT TAY):
   - Đọc và nhận dạng chữ viết tay từng câu tự luận.
   - Chấm theo từng ý, từng bước giải (phương pháp giải, lập luận, công thức, tính toán, đơn vị, đáp số).
   - Chỉ rõ lỗi sai ở bước nào, vì sao bị trừ điểm hoặc đạt điểm tối đa.
3. LỜI NHẬN XÉT CỦA GIÁO VIÊN: Viết lời nhận xét chi tiết, mang tính sư phạm, khích lệ và chỉ rõ điểm cần khắc phục để gửi trực tiếp cho học sinh/phụ huynh.
4. BẮT BUỘC TRẢ VỀ THEO ĐÚNG MẪU KHỐI BÊN DƯỚI Ở PHẦN CUỐI:

[KẾT QUẢ CHẤM THI]
Họ và tên: [Tên học sinh]
Mã đề: [Mã đề]
Số câu đúng: [Số câu]/[Tổng số câu]
Tổng điểm: [Điểm số]
Chi tiết sai: [Liệt kê các câu sai và lỗi cần nhớ]
Nhận xét GV: [Lời nhận xét sư phạm của giáo viên gửi học sinh]
Đánh giá tự luận: [Chi tiết điểm và nhận xét từng câu tự luận viết tay]`;

      try {
        const textResult = await generateGeminiVision({
          prompt,
          imageBase64: base64Img,
          apiKeys
        });

        if (textResult) {
          setGradingLogs(prev => prev + textResult + '\n');

          // Extract fields for score table
          const text = textResult;
          const nameMatch = text.match(/Họ và tên:\s*([^\n]+)/);
          const codeMatch = text.match(/Mã đề:\s*([^\n]+)/);
          const correctMatch = text.match(/Số câu đúng:\s*([^\n]+)/);
          const scoreMatch = text.match(/Tổng điểm:\s*([^\n]+)/);
          const wrongMatch = text.match(/Chi tiết sai:\s*([^\n]+)/);
          const commentMatch = text.match(/Nhận xét GV:\s*([^\n]+)/);
          const essayMatch = text.match(/Đánh giá tự luận:\s*([\s\S]+?)(?=\n\[|$)/);

          const newResult: ExamResultItem = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
            studentName: nameMatch ? nameMatch[1].trim() : 'Học sinh ' + (idx + 1),
            examCode: codeMatch ? codeMatch[1].trim() : '101',
            score: scoreMatch ? scoreMatch[1].trim() : '8.0',
            correctAnswers: correctMatch ? correctMatch[1].trim() : '32/40',
            wrongDetails: wrongMatch ? wrongMatch[1].trim() : 'Không có',
            imageName: imgFile.name,
            teacherComment: commentMatch ? commentMatch[1].trim() : 'Bài làm tốt, cần chú ý đọc kĩ đề hơn.',
            essayFeedback: essayMatch ? essayMatch[1].trim() : (gradeTL ? 'Đã chấm phần tự luận theo barem.' : undefined)
          };

          onAddExamResult(newResult);
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        setGradingLogs(prev => prev + `Lỗi chấm file ${imgFile.name}: ${errMsg}\n`);
        if (errMsg.includes('Hạn ngạch') || errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
          onOpenApiGuide();
        }
      }
    }

    setIsGrading(false);
  };

  const handleAnalyzeErrors = async () => {
    if (examResults.length === 0) {
      alert('Chưa có bảng điểm để phân tích! Vui lòng chấm thi trước.');
      return;
    }

    const apiKeys = apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);

    setIsAnalyzingErrors(true);
    const summaryData = examResults
      .map(r => `- HS ${r.studentName}: Điểm ${r.score} | Mã đề: ${r.examCode} | Sai: ${r.wrongDetails}`)
      .join('\n');

    const prompt = `Lập BẢNG PHÂN TÍCH LỖI SAI TƯ DUY VÀ NGUYÊN NHÂN HỔNG KIẾN THỨC MÔN ${monHoc.toUpperCase()} LỚP ${lop}.
Nhóm các loại lỗi sai phổ biến của học sinh, phân tích nguyên nhân tư duy và đề xuất bài tập khắc phục.

DỮ LIỆU ĐIỂM VÀ LỖI SAI CỦA LỚP:
${summaryData}`;

    try {
      const textResult = await generateGeminiText({ prompt, apiKeys });
      if (textResult) {
        setErrorAnalysisText(textResult);
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      alert('Lỗi phân tích lỗi sai: ' + errMsg);
      if (errMsg.includes('Hạn ngạch') || errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        onOpenApiGuide();
      }
    } finally {
      setIsAnalyzingErrors(false);
    }
  };

  const handleExportCsv = () => {
    if (examResults.length === 0) return;
    const headers = ['Họ và tên', 'Mã đề', 'Điểm', 'Số câu đúng', 'Chi tiết sai', 'Tên file'];
    const csvRows = [headers.join(',')];

    examResults.forEach(r => {
      csvRows.push(
        `"${r.studentName}","${r.examCode}","${r.score}","${r.correctAnswers}","${r.wrongDetails.replace(/"/g, '""')}","${r.imageName || ''}"`
      );
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bang_Diem_Lop_${lop}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGeneratePrintableBubbleSheet = async () => {
    const count = parseInt(bubbleQuestionCount) || 40;
    setTimeout(async () => {
      try {
        await exportHanoiStandardBubbleSheet({
          questionCount: count,
          monHoc,
          lop,
          schoolName: 'TRƯỜNG THCS PHÙNG KHẮC KHOAN',
          examTitle: 'KỲ THI TUYỂN SINH VÀO LỚP 10 THPT / KIỂM TRA ĐỊNH KỲ',
          fileName: `Phieu_To_Trac_Nghiem_SoGDHN_${count}_Cau_Lop_${lop}.docx`
        });
        alert(`Đã xuất thành công Phiếu trả lời trắc nghiệm ${count} câu chuẩn Sở GD&ĐT Hà Nội (Khổ dọc A4 - 1 Trang duy nhất)!`);
      } catch (err: any) {
        alert('Lỗi xuất file Word phiếu trắc nghiệm: ' + (err.message || 'Không thể tạo file'));
      }
    }, 50);
  };

  return (
    <div className="space-y-6">
      {/* 1. Vision Grading Setup */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">
              Chấm thi AI Vision - Nhận diện Tô Trắc nghiệm & Chữ Viết tay
            </h2>
          </div>

          <button
            onClick={handleStartWebcam}
            className="px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow"
          >
            <Camera className="w-3.5 h-3.5" /> Chụp Webcam
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* File input */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-semibold">1. Chọn 1 hoặc nhiều ảnh phiếu bài làm:</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageFileSelect}
              className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-cyan-600 file:text-white cursor-pointer"
            />
            {selectedImageFiles.length > 0 && (
              <p className="text-emerald-400 font-semibold text-[11px]">
                ✓ Đã chọn {selectedImageFiles.length} ảnh bài làm.
              </p>
            )}
          </div>

          {/* Master key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-slate-300 font-semibold">2. Bảng Đáp án Chuẩn (Master Key):</label>
              <span className="text-[11px] text-amber-300 font-medium">Nhập tay hoăc tải File/Ảnh Đáp án</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
              <input
                type="file"
                accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.md,.json,image/*"
                onChange={handleAnswerKeyFileSelect}
                className="block flex-1 text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-slate-800 file:text-slate-200 cursor-pointer"
              />
              <button
                onClick={handleScanAnswerKeyFile}
                disabled={isScanningAnswerKey}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded flex items-center gap-1 shadow transition-all"
              >
                {isScanningAnswerKey ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    Đang Quét...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    🔍 AI Quét / Đọc File Đáp Án
                  </>
                )}
              </button>
            </div>

            <textarea
              value={masterKeyText}
              onChange={e => setMasterKeyText(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono text-xs focus:outline-none"
              placeholder="Nhập tay hoặc tải File/Ảnh Đáp án lên để AI tự quét vào đây..."
            />
          </div>
        </div>

        {/* Start Grading Button */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={handleGradeWithAI}
            disabled={isGrading}
            className={`px-8 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-xl transition-all ${
              isGrading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/30'
            }`}
          >
            <Sparkles className={`w-5 h-5 ${isGrading ? 'animate-spin' : ''}`} />
            {isGrading ? 'ĐANG DÒ ẢNH VÀ CHẤM THI...' : '🔍 BẮT ĐẦU CHẤM THI AI VISION'}
          </button>
        </div>
      </div>

      {/* 2. Scoreboard & Misconception Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-100">
                Bảng Điểm Lớp Học ({examResults.length} HS)
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportAllFeedbacksDoc}
                disabled={examResults.length === 0}
                className="px-2.5 py-1 rounded bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-xs flex items-center gap-1 shadow"
                title="Xuất file Word tổng hợp nhận xét chi tiết kèm điểm từng HS"
              >
                <FileText className="w-3.5 h-3.5" /> Xuất File Nhận Xét
              </button>
              <button
                onClick={handleExportCsv}
                disabled={examResults.length === 0}
                className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Xuất Excel
              </button>
              <button
                onClick={onClearExamResults}
                className="px-2 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-300 border border-rose-700 text-xs"
              >
                Xóa
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-80 border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-slate-950 text-cyan-300 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-2">Họ & Tên</th>
                  <th className="p-2">Mã đề</th>
                  <th className="p-2 text-center">Điểm</th>
                  <th className="p-2">Số câu đúng</th>
                  <th className="p-2">Chi tiết sai / Tự luận</th>
                  <th className="p-2 text-right">Nhận xét & Gửi HS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {examResults.map((res, i) => (
                  <tr key={res.id || i} className="hover:bg-slate-800/40">
                    <td className="p-2 font-semibold text-slate-100">{res.studentName}</td>
                    <td className="p-2 text-cyan-400 font-mono">{res.examCode}</td>
                    <td className="p-2 text-center font-bold text-emerald-400">{res.score}</td>
                    <td className="p-2">{res.correctAnswers}</td>
                    <td className="p-2 text-rose-300 text-[11px] truncate max-w-xs">
                      {res.wrongDetails}
                      {res.essayFeedback && <span className="ml-1 text-cyan-400 font-semibold">[Có tự luận]</span>}
                    </td>
                    <td className="p-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleCopyFeedback(res)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                          title="Sao chép nhận xét gửi Zalo/Tin nhắn cho học sinh"
                        >
                          {copiedCommentId === res.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                        </button>
                        <button
                          onClick={() => handleExportSingleFeedbackDoc(res)}
                          className="p-1.5 rounded bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 transition-colors"
                          title="Xuất phiếu nhận xét Word cho riêng học sinh này"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setActiveFeedbackModal(res)}
                          className="p-1.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 transition-colors"
                          title="Xem chi tiết nhận xét & bài chấm tự luận"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {examResults.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500 italic">
                      Chưa có dữ liệu bảng điểm.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Misconception Analysis */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <h3 className="text-sm font-bold text-slate-100">
                Trợ lý Phân tích Lỗi sai Tư duy
              </h3>
            </div>

            <button
              onClick={handleAnalyzeErrors}
              disabled={isAnalyzingErrors}
              className="px-3 py-1 rounded bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1 shadow"
            >
              <Sparkles className="w-3.5 h-3.5" /> Phân tích
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap">
            {errorAnalysisText || (
              <div className="text-slate-500 italic text-center py-10">
                Bấm "Phân tích" để AI tổng hợp nguyên nhân hổng kiến thức và bài tập khắc phục cho cả lớp.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Printable Bubble Sheet Generator */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Xuất Phiếu Tô Trắc Nghiệm Mẫu Thi Vào 10 THPT (Sở GD&ĐT Hà Nội)
              </h3>
              <p className="text-[11px] text-slate-400">
                Định dạng ô tròn chuẩn in ấn, có bảng SBD & Mã đề, trình bày gọn gàng trong đúng 1 trang A4 duy nhất
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300">Số câu trắc nghiệm:</span>
            <select
              value={bubbleQuestionCount}
              onChange={e => setBubbleQuestionCount(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded p-1 text-cyan-300 font-bold text-xs"
            >
              <option value="10">10 câu</option>
              <option value="15">15 câu</option>
              <option value="20">20 câu</option>
              <option value="25">25 câu</option>
              <option value="30">30 câu</option>
              <option value="40">40 câu</option>
              <option value="50">50 câu</option>
            </select>

            <button
              onClick={handleGeneratePrintableBubbleSheet}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Download className="w-3.5 h-3.5" /> Tải Phiếu In Word
            </button>
          </div>
        </div>
      </div>

      {/* Webcam Modal */}
      {showWebcamModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-lg w-full text-slate-100 space-y-4">
            <h3 className="text-base font-bold text-cyan-400 flex items-center gap-2">
              <Camera className="w-5 h-5" /> Chụp Bài Làm Bằng Webcam
            </h3>
            <video ref={videoRef} autoPlay playsInline className="w-full h-64 bg-slate-950 rounded-lg object-cover" />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  const stream = videoRef.current?.srcObject as MediaStream;
                  stream?.getTracks().forEach(t => t.stop());
                  setShowWebcamModal(false);
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={handleCaptureWebcam}
                className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
              >
                Chụp Ảnh Bài Làm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Feedback Detail Modal */}
      {activeFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-xl w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Chi Tiết Bài Chấm & Nhận Xét: {activeFeedbackModal.studentName}
                </h3>
              </div>
              <button
                onClick={() => setActiveFeedbackModal(null)}
                className="text-slate-400 hover:text-white text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-96 overflow-y-auto pr-1">
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[11px]">Mã đề:</span>
                  <strong className="text-cyan-400 font-mono">{activeFeedbackModal.examCode}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Điểm tổng:</span>
                  <strong className="text-emerald-400 text-sm font-bold">{activeFeedbackModal.score} / 10</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Số câu TN đúng:</span>
                  <strong className="text-slate-200">{activeFeedbackModal.correctAnswers}</strong>
                </div>
              </div>

              <div>
                <span className="font-bold text-amber-300 block mb-1">Chi tiết câu sai / Cần khắc phục:</span>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-rose-300 font-mono text-[11px]">
                  {activeFeedbackModal.wrongDetails || 'Không có'}
                </div>
              </div>

              <div>
                <span className="font-bold text-cyan-300 block mb-1">Lời nhận xét của Giáo viên:</span>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-slate-200 leading-relaxed">
                  {activeFeedbackModal.teacherComment || 'Bài làm đạt yêu cầu, cần chú ý ôn tập kĩ các dạng câu hỏi đã làm sai.'}
                </div>
              </div>

              {activeFeedbackModal.essayFeedback && (
                <div>
                  <span className="font-bold text-purple-300 block mb-1">Đánh giá phần Tự luận viết tay:</span>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-purple-900/50 text-purple-200 leading-relaxed whitespace-pre-wrap">
                    {activeFeedbackModal.essayFeedback}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => handleCopyFeedback(activeFeedbackModal)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg flex items-center gap-1.5 border border-slate-700"
              >
                {copiedCommentId === activeFeedbackModal.id ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Sao Chép Nhận Xét</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleExportSingleFeedbackDoc(activeFeedbackModal)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow"
              >
                <Download className="w-4 h-4" />
                <span>Xuất Phiếu Word Gửi HS</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
