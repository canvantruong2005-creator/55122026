import React, { useState, useRef, useEffect } from 'react';
import { generateGeminiText, generateGeminiVision, resolveApiKeys } from '../../../lib/geminiApi';
import { exportMarkdownToWord, stripIntroductoryChatter } from '../../../lib/wordExport';
import { ClassProfile } from '../../../types';
import { VoiceMicButton } from '../../VoiceMicButton';
import { EducationalMarkdownRenderer } from '../../common/EducationalMarkdownRenderer';
import { readFileAsText, performOcrOnImageDataUrl } from '../../../lib/fileUtils';
import {
  Target,
  Sparkles,
  Download,
  Copy,
  Check,
  Upload,
  RefreshCw,
  Edit3,
  CheckCircle2,
  Users,
  User,
  School,
  Award,
  BookOpen,
  Sliders,
  Eye,
  Loader2,
  Trash2,
  Plus,
  FileCheck,
  Printer,
  ChevronRight,
  ClipboardList,
  AlertCircle,
  HelpCircle,
  Sparkle,
  Layers,
  FileText,
  Image as ImageIcon,
  Wand2,
  Paperclip,
  CheckSquare,
  Maximize2
} from 'lucide-react';

interface PersonalizedHomeworkManagerProps {
  profile: ClassProfile;
  onChangeProfile: (p: ClassProfile) => void;
  apiKeysInput: string;
  onOpenApiGuide?: () => void;
}

export type StudentTier = 'tier_excellent' | 'tier_fair' | 'tier_average' | 'tier_support';

interface TierConfig {
  id: StudentTier;
  title: string;
  badge: string;
  badgeColor: string;
  icon: string;
  description: string;
  targetObjective: string;
}

const STUDENT_TIERS: TierConfig[] = [
  {
    id: 'tier_excellent',
    title: 'Nhóm Xuất Sắc & Học Sinh Giỏi',
    badge: 'Nâng cao & Sáng tạo',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
    icon: '🌟',
    description: 'Dành cho học sinh có tư duy nhạy bén, nắm vững kiến thức cơ bản. Đề bài tập trung vào vận dụng cao, tư duy logic liên môn và bài toán thực tế.',
    targetObjective: 'Phát triển tư duy phân tích, giải quyết vấn đề sáng tạo, các bài toán mở rộng và kỹ năng giải quyết bài thi chọn HSG.'
  },
  {
    id: 'tier_fair',
    title: 'Nhóm Khá & Tiến Bộ',
    badge: 'Vận dụng & Đào sâu',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
    icon: '📘',
    description: 'Dành cho học sinh tiếp thu tốt nhưng đôi khi còn thiếu cẩn thận hoặc chưa tự tin với bài toán phức tạp. Rèn luyện phương pháp giải tối ưu.',
    targetObjective: 'Củng cố kiến thức trọng tâm, rèn luyện kỹ năng tính toán chuẩn xác, phản xạ giải bài toán ở mức độ Thông hiểu và Vận dụng.'
  },
  {
    id: 'tier_average',
    title: 'Nhóm Trung Bình',
    badge: 'Cơ bản & Chuẩn hóa',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    icon: '📗',
    description: 'Dành cho học sinh nắm ở mức cơ bản, cần rèn luyện thêm bài tập mẫu để ghi nhớ công thức, quy tắc và định lý cốt lõi.',
    targetObjective: 'Nắm chắc kiến thức cốt lõi SGK, thuộc công thức, làm thành thạo các dạng bài toán Nhận biết và Thông hiểu cơ bản.'
  },
  {
    id: 'tier_support',
    title: 'Nhóm Cần Hỗ Trợ & Bù Hổng Kiến Thức',
    badge: 'Kèm cặp từng bước (Step-by-step)',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    icon: '📙',
    description: 'Dành cho học sinh hổng kiến thức, tính toán chậm, sợ học. Đề bài chia nhỏ từng bước có gợi ý mồi, ví dụ mẫu tương tự.',
    targetObjective: 'Bù lấp lỗ hổng kiến thức nền tảng, tạo sự tự tin, hướng dẫn giải từng bước nhỏ và khuyến khích tiến bộ từng ngày.'
  }
];

export const PersonalizedHomeworkManager: React.FC<PersonalizedHomeworkManagerProps> = ({
  profile,
  onChangeProfile,
  apiKeysInput,
  onOpenApiGuide
}) => {
  // Main state
  const [selectedTier, setSelectedTier] = useState<StudentTier>('tier_fair');
  const [studentName, setStudentName] = useState<string>('Nguyễn Minh Quân');
  const [className, setClassName] = useState<string>(profile.lop || '9A1');
  const [subjectName, setSubjectName] = useState<string>(profile.mon || 'Toán học');
  const [topicName, setTopicName] = useState<string>('Phương trình bậc hai một ẩn & Định lý Vi-ét');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [includeMultipleChoice, setIncludeMultipleChoice] = useState<boolean>(true);
  const [includeEssay, setIncludeEssay] = useState<boolean>(true);
  const [includeAnswerKey, setIncludeAnswerKey] = useState<boolean>(true);
  const [specialTeacherNote, setSpecialTeacherNote] = useState<string>('Học sinh hay quên điều kiện Delta ≥ 0 khi áp dụng hệ thức Vi-ét.');

  // AI Generated Homework
  const [generatedHomework, setGeneratedHomework] = useState<string>('');
  const [isGeneratingHomework, setIsGeneratingHomework] = useState<boolean>(false);
  const [isEditingManually, setIsEditingManually] = useState<boolean>(false);

  // AI Refine Homework Modal/State
  const [isRefineModalOpen, setIsRefineModalOpen] = useState<boolean>(false);
  const [aiRefineInstruction, setAiRefineInstruction] = useState<string>('');
  const [isRefining, setIsRefining] = useState<boolean>(false);

  // Grading & Checking Submission state
  const [studentSubmissionText, setStudentSubmissionText] = useState<string>('');
  const [gradingResultText, setGradingResultText] = useState<string>('');
  const [isGrading, setIsGrading] = useState<boolean>(false);
  const [activeTabSubView, setActiveTabSubView] = useState<'create' | 'interactive_do' | 'grading_result'>('create');
  const [copied, setCopied] = useState<boolean>(false);

  // File / Image Upload & OCR for Student Answer
  const [isOcrProcessing, setIsOcrProcessing] = useState<boolean>(false);
  const [ocrStatusText, setOcrStatusText] = useState<string>('');
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Handle Global/Container Paste Event (Ctrl + V to paste image of student work)
  const handlePasteEvent = async (e: React.ClipboardEvent | ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          e.preventDefault();
          await processStudentImageFile(blob);
          break;
        }
      }
    }
  };

  // Process image file through Gemini Vision OCR
  const processStudentImageFile = async (file: File) => {
    const apiKeys = apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);
    setIsOcrProcessing(true);
    setOcrStatusText(`Đang đọc ảnh bài làm của học sinh (${file.name || 'Ảnh dán'})...`);

    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string;
        setUploadedImagePreview(dataUrl);

        try {
          const prompt = `Bạn là Trợ lý Giáo viên Chấm bài chuyên nghiệp.
Hãy đọc hiểu TOÀN BỘ bài làm viết tay hoặc đánh máy của học sinh trong ảnh này:
1. Trích xuất chính xác từng câu: Câu 1, Câu 2, Câu 3...
2. Chuyển đổi chính xác các công thức toán, phép tính, bước biến đổi, kết luận sang dạng chữ hoặc LaTeX $...$.
3. Giữ nguyên đúng nguyên văn những gì học sinh đã viết (kể cả lỗi sai nếu có) để giáo viên chấm điểm.`;

          const ocrResult = await performOcrOnImageDataUrl(dataUrl, apiKeys, prompt);
          if (ocrResult && !ocrResult.startsWith('[Lỗi')) {
            setStudentSubmissionText(prev => {
              const header = `--- [BÀI LÀM TRÍCH XUẤT TỪ ẢNH CHỤP: ${file.name || 'Ảnh Dán Clipboard'}] ---\n`;
              return prev ? `${prev}\n\n${header}${ocrResult}` : `${header}${ocrResult}`;
            });
            setOcrStatusText('✅ Đã nhận diện xong toàn bộ bài làm của học sinh!');
          } else {
            setOcrStatusText('⚠️ Không nhận diện được chữ rõ ràng từ ảnh này. Vui lòng kiểm tra lại độ nét ảnh.');
          }
        } catch (err: any) {
          setOcrStatusText(`❌ Lỗi nhận diện ảnh: ${err?.message || String(err)}`);
        } finally {
          setIsOcrProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (e: any) {
      setIsOcrProcessing(false);
      setOcrStatusText(`Lỗi mở tệp: ${e?.message || String(e)}`);
    }
  };

  // Process Document File (Word, PDF, txt, etc.)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const apiKeys = apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);

    setIsOcrProcessing(true);
    setOcrStatusText(`Đang đọc tệp ${file.name}...`);

    try {
      if (file.type.startsWith('image/')) {
        await processStudentImageFile(file);
      } else {
        const text = await readFileAsText(file, { apiKeys });
        if (text) {
          setStudentSubmissionText(prev => {
            const header = `--- [NỘI DUNG TỪ TỆP: ${file.name}] ---\n`;
            return prev ? `${prev}\n\n${header}${text}` : `${header}${text}`;
          });
          setOcrStatusText(`✅ Đã đọc thành công tệp ${file.name}!`);
        }
      }
    } catch (err: any) {
      setOcrStatusText(`❌ Lỗi đọc tệp: ${err?.message || String(err)}`);
    } finally {
      setIsOcrProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  // AI Refine Homework (Sửa / Tinh chỉnh bằng AI)
  const handleAIRefineHomework = async () => {
    if (!aiRefineInstruction.trim() || !generatedHomework.trim()) return;
    const apiKeys = apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);
    setIsRefining(true);

    const prompt = `Bạn là Chuyên gia Giáo dục & Soạn bài tập cá nhân hóa.
Dưới đây là Phiếu Bài Tập hiện tại:
=== NỘI DUNG PHIẾU BÀI TẬP HIỆN TẠI ===
${generatedHomework}
=== HẾT NỘI DUNG HIỆN TẠI ===

YÊU CẦU CHỈNH SỬA / NÂNG CẤP TỪ GIÁO VIÊN:
"${aiRefineInstruction}"

HÃY CẬP NHẬT VÀ VIẾT LẠI TOÀN BỘ PHIẾU BÀI TẬP HOÀN CHỈNH:
- Thực hiện chính xác yêu cầu của giáo viên (sửa câu hỏi, đổi số liệu, tăng/giảm độ khó, thêm câu thực tế, chỉnh lời dặn...).
- Giữ nguyên cấu trúc trang trọng, chuẩn Markdown sư phạm, công thức toán trình bày LaTeX $...$ đẹp mắt.
- Xuất ra toàn bộ phiếu bài tập mới hoàn chỉnh (không viết lời giải thích ngoài lề).`;

    try {
      const result = await generateGeminiText({
        prompt,
        apiKeys,
        maxOutputTokens: 16384
      });
      if (result) {
        setGeneratedHomework(stripIntroductoryChatter(result));
        setIsRefineModalOpen(false);
        setAiRefineInstruction('');
      }
    } catch (err: any) {
      alert(`Lỗi AI tinh chỉnh bài tập: ${err?.message || String(err)}`);
    } finally {
      setIsRefining(false);
    }
  };

  // Generate Personalized Homework
  const handleGenerateHomework = async () => {
    const apiKeys = apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);
    const tierConfig = STUDENT_TIERS.find(t => t.id === selectedTier) || STUDENT_TIERS[1];

    setIsGeneratingHomework(true);

    const prompt = `Bạn là Chuyên gia Giáo dục & Thiết kế Bài tập Cá nhân hóa môn ${subjectName} theo Chương trình GDPT 2018.
Nhiệm vụ: Hãy tạo một Phiếu Bài Tập Cá Nhân Hóa hoàn chỉnh, chuẩn mực sư phạm, vừa sức và kích thích sự tiến bộ cho học sinh theo thông tin chi tiết dưới đây:

=== THÔNG TIN HỌC SINH & NHÓM NĂNG LỰC: ===
- Học sinh: ${studentName || 'Học sinh'} | Lớp: ${className}
- Môn học: ${subjectName}
- Chủ đề / Bài học: "${topicName}"
- Nhóm đối tượng: ${tierConfig.title.toUpperCase()} (${tierConfig.badge})
- Mục tiêu cần đạt: ${tierConfig.targetObjective}
- Ghi chú đặc biệt từ Giáo viên: ${specialTeacherNote}
- Cấu trúc đề: ${questionCount} câu (${includeMultipleChoice ? 'Có trắc nghiệm' : 'Không trắc nghiệm'}, ${includeEssay ? 'Có tự luận' : 'Không tự luận'})

=== YÊU CẦU ĐỊNH DẠNG BÀI TẬP BẮT BUỘC: ===
1. TIÊU ĐỀ PHIẾU BÀI TẬP:
   - Quốc hiệu tiêu ngữ và Tên trường, Lớp, Tên Học sinh trong khung trang trọng.
   - Tiêu đề: # PHIẾU BÀI TẬP CÁ NHÂN HÓA: ${topicName.toUpperCase()}
   - Lời dặn dò và động viên của Giáo viên gửi riêng cho em ${studentName}.

2. NỘI DUNG CÁC CÂU HỎI:
   - Các câu hỏi được thiết kế chuẩn mực, phù hợp đúng với năng lực nhóm "${tierConfig.title}".
   ${selectedTier === 'tier_support' ? '- KÈM GỢI Ý TỪNG BƯỚC (Bước 1, Bước 2) và ví dụ mẫu dẫn dắt để em tự tin làm bài.' : ''}
   ${selectedTier === 'tier_excellent' ? '- TĂNG CƯỜNG CÂU HỎI VẬN DỤNG CAO, tư duy mở rộng và bài toán thực tiễn.' : ''}
   - Công thức toán/khoa học trình bày chuẩn Markdown hoặc LaTeX đẹp mắt ($...$).

3. HƯỚNG DẪN CHẤM & LỜI GIẢI CHI TIẾT (ĐỂ PHÍA DƯỚI BẢNG PHÂN CÁCH ---):
   - Đáp án trắc nghiệm rõ ràng (A, B, C, D kèm giải thích ngắn).
   - Lời giải chi tiết từng bước cho các câu tự luận kèm biểu điểm thành phần (thang điểm 10).

Hãy tạo ngay phiếu bài tập đầy đủ và chi tiết nhất!`;

    try {
      const result = await generateGeminiText({
        prompt,
        apiKeys,
        maxOutputTokens: 16384
      });
      if (result) {
        setGeneratedHomework(stripIntroductoryChatter(result));
        setActiveTabSubView('interactive_do');
      } else {
        alert('Không nhận được phản hồi từ AI.');
      }
    } catch (err: any) {
      alert(`Lỗi AI tạo bài tập: ${err?.message || String(err)}`);
      if (err?.message?.includes('429') || err?.message?.includes('quota')) {
        onOpenApiGuide?.();
      }
    } finally {
      setIsGeneratingHomework(false);
    }
  };

  // AI Grade & Check Student Submission
  const handleAIGradingSubmission = async () => {
    if (!studentSubmissionText.trim()) {
      alert('Vui lòng nhập hoặc dán bài làm của học sinh vào khung trước khi chấm điểm!');
      return;
    }
    const apiKeys = apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);
    setIsGrading(true);

    const prompt = `Bạn là Chuyên gia Chấm thi & Giáo viên phụ trách môn ${subjectName} tâm huyết, tinh tế.
Nhiệm vụ của bạn là: KIỂM TRA, CHẤM ĐIỂM VÀ PHÂN TÍCH CHI TIẾT LỖI SAI CHO BÀI LÀM CỦA HỌC SINH.

=== ĐỀ BÀI VÀ ĐÁP ÁN CHUẨN ===
${generatedHomework || `Chủ đề: ${topicName} - Môn ${subjectName}`}
=== HẾT ĐỀ BÀI ===

=== BÀI LÀM CỦA HỌC SINH (${studentName} - Lớp ${className}) ===
${studentSubmissionText}
=== HẾT BÀI LÀM CỦA HỌC SINH ===

YÊU CẦU CHẤM ĐIỂM & ĐÁNH GIÁ CHI TIẾT (THỂ THỨC SƯ PHẠM VIỆT NAM):
1. **TỔNG KẾT ĐIỂM SỐ (THANG ĐIỂM 10)**:
   - Điểm số chính xác: X / 10 điểm (kèm nhận xét chung 1-2 câu).

2. **PHÂN TÍCH CHI TIẾT TỪNG CÂU**:
   - Câu đúng: Ghi nhận điểm, khen ngợi bước làm thông minh (nếu có).
   - Câu sai / Thiếu sót:
     + ❌ **Chỉ rõ bước sai**: Em sai ở bước nào (Ví dụ: Sai dấu khi chuyển vế, Quên xét điều kiện mẫu số khác 0, Tính nhầm phép nhân...).
     + 💡 **Nguyên nhân cốt lõi**: Phân tích xem em hiểu nhầm khái niệm hay chỉ do sơ suất bất cẩn.
     + ✅ **Lời giải mẫu chuẩn xác**: Trình bày lại lời giải đúng từng bước ngắn gọn, rõ ràng.

3. **LỜI NHẬN XÉT SƯ PHẠM & ĐỘNG VIÊN TIẾN BỘ**:
   - Khen ngợi sự cố gắng và những điểm làm tốt.
   - Nhắc nhở cụ thể điều cần ghi nhớ vào sổ tay học tập.
   - Đề xuất 1-2 bài tập tương tự ngắn để em luyện tập lại ngay.

Hãy trình bày nhận xét chấm bài bằng Markdown đẹp mắt, có bảng điểm và icon sinh động!`;

    try {
      const result = await generateGeminiText({
        prompt,
        apiKeys,
        maxOutputTokens: 16384
      });
      if (result) {
        setGradingResultText(stripIntroductoryChatter(result));
        setActiveTabSubView('grading_result');
      }
    } catch (err: any) {
      alert(`Lỗi AI chấm điểm: ${err?.message || String(err)}`);
    } finally {
      setIsGrading(false);
    }
  };

  // Export Homework or Grading to Word
  const handleExportWord = async (content: string, fileName: string) => {
    if (!content.trim()) return;
    try {
      await exportMarkdownToWord(content, {
        fileName,
        headerText: `${profile.schoolName || 'Trường THCS Phùng Khắc Khoan'} - Lớp ${className}`,
        footerText: `Phiếu bài tập cá nhân hóa - Học sinh: ${studentName}`,
        schoolName: profile.schoolName || 'Trường THCS Phùng Khắc Khoan',
        teacherName: profile.teacherSigner || 'Thầy Cấn Văn Trường',
        lop: className,
        showPageNumbers: true
      });
    } catch (err: any) {
      alert(`Lỗi xuất file Word: ${err?.message || String(err)}`);
    }
  };

  // Copy
  const handleCopyText = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-violet-900/60 via-purple-900/40 to-indigo-950/60 border border-violet-500/40 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-violet-500/20 border border-violet-400/40 rounded-xl text-violet-300 shadow-inner">
              <Target className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Tạo Bài Tập Cá Nhân Hóa & AI Chấm Điểm, Sửa Bài Tức Thì
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-500/20 border border-violet-400/50 text-violet-200">
                  Dạy Học Phân Hóa Năng Lực
                </span>
              </div>
              <p className="text-xs sm:text-sm text-violet-100/80 mt-0.5">
                Tạo bài tập vừa sức theo 4 nhóm năng lực (Giỏi, Khá, Trung bình, Cần hỗ trợ) & Tích hợp AI kiểm tra, chấm điểm, chỉ ra nguyên nhân sai lầm khi học sinh làm bài
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTabSubView('create')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTabSubView === 'create'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>1. Tạo Bài Tập</span>
            </button>

            <button
              onClick={() => setActiveTabSubView('interactive_do')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTabSubView === 'interactive_do'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Edit3 className="w-4 h-4 text-sky-300" />
              <span>2. Học Sinh Làm Bài</span>
            </button>

            <button
              onClick={() => setActiveTabSubView('grading_result')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTabSubView === 'grading_result'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Award className="w-4 h-4 text-emerald-300" />
              <span>3. Kết Quả Chấm AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container based on Sub-View */}
      {activeTabSubView === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Settings (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Step 1: Select Student Tier */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2 pb-2 border-b border-slate-800">
                <Users className="w-4 h-4 text-violet-400" />
                1. Chọn Nhóm Năng Lực Học Sinh
              </h3>

              <div className="grid grid-cols-1 gap-2.5">
                {STUDENT_TIERS.map((tier) => {
                  const isSelected = selectedTier === tier.id;
                  return (
                    <button
                      key={tier.id}
                      onClick={() => setSelectedTier(tier.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl text-left border transition-all ${
                        isSelected
                          ? 'bg-violet-950/80 border-violet-400 shadow-md shadow-violet-900/30'
                          : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-2xl p-2 rounded-lg bg-slate-900 shrink-0 border border-slate-700">
                        {tier.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs font-bold ${isSelected ? 'text-violet-300' : 'text-white'}`}>
                            {tier.title}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${tier.badgeColor}`}>
                            {tier.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                          {tier.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Student & Subject Configuration */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2 pb-2 border-b border-slate-800">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                2. Thông Tin Bài Học & Yêu Cầu Đề Bài
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Họ Tên Học Sinh</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={e => setStudentName(e.target.value)}
                    placeholder="VD: Nguyễn Minh Quân"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:border-violet-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Lớp</label>
                  <input
                    type="text"
                    value={className}
                    onChange={e => setClassName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:border-violet-400 focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Môn Học & Chủ Đề / Bài Học</label>
                  <input
                    type="text"
                    value={topicName}
                    onChange={e => setTopicName(e.target.value)}
                    placeholder="VD: Phương trình bậc hai & Hệ thức Vi-ét..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:border-violet-400 focus:outline-none font-bold text-violet-300"
                  />
                </div>
              </div>

              {/* Number of questions & Question Formats */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">Số lượng câu hỏi:</span>
                  <div className="flex items-center gap-2">
                    {[3, 5, 8, 10].map(cnt => (
                      <button
                        key={cnt}
                        onClick={() => setQuestionCount(cnt)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          questionCount === cnt
                            ? 'bg-violet-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {cnt} câu
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700 text-xs text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeMultipleChoice}
                      onChange={e => setIncludeMultipleChoice(e.target.checked)}
                      className="rounded text-violet-600"
                    />
                    <span>Câu trắc nghiệm (A,B,C,D)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeEssay}
                      onChange={e => setIncludeEssay(e.target.checked)}
                      className="rounded text-violet-600"
                    />
                    <span>Câu tự luận / Thực hành</span>
                  </label>
                </div>
              </div>

              {/* Special Note */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Điểm Yếu Cần Khắc Phục / Lời Dặn Của Giáo Viên
                </label>
                <textarea
                  rows={2}
                  value={specialTeacherNote}
                  onChange={e => setSpecialTeacherNote(e.target.value)}
                  placeholder="Ghi chú điểm kiến thức học sinh hay sai..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:border-violet-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Action Generate Button */}
            <button
              onClick={handleGenerateHomework}
              disabled={isGeneratingHomework}
              className="w-full py-3.5 px-4 rounded-2xl font-black text-sm text-white shadow-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-violet-900/50 flex items-center justify-center gap-2.5 transition-all disabled:opacity-50"
            >
              {isGeneratingHomework ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>AI Đang Soạn Phiếu Bài Tập Cá Nhân Hóa...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>TẠO BÀI TẬP CÁ NHÂN HÓA BẰNG AI</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Generated Homework Preview (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black uppercase text-violet-300 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                Xem Trước Phiếu Bài Tập
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {/* AI Refine Button */}
                <button
                  onClick={() => setIsRefineModalOpen(true)}
                  disabled={!generatedHomework || isGeneratingHomework}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
                  title="Yêu cầu AI sửa câu hỏi, đổi số liệu, tăng/giảm độ khó"
                >
                  <Wand2 className="w-3.5 h-3.5 text-amber-200" />
                  <span>✨ Sửa Bằng AI</span>
                </button>

                {/* Direct Edit Toggle */}
                <button
                  onClick={() => setIsEditingManually(!isEditingManually)}
                  disabled={!generatedHomework}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                    isEditingManually
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingManually ? 'Xong Sửa' : 'Sửa Trực Tiếp'}</span>
                </button>

                <button
                  onClick={() => handleCopyText(generatedHomework)}
                  disabled={!generatedHomework}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copied ? 'Đã Chép' : 'Sao Chép'}</span>
                </button>

                <button
                  onClick={() => handleExportWord(generatedHomework, `Phieu_Bai_Tap_${studentName}_${topicName}.docx`)}
                  disabled={!generatedHomework}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-md flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất File Word</span>
                </button>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white text-slate-900 border border-slate-300 shadow-2xl min-h-[550px] max-h-[750px] overflow-y-auto font-sans">
              {generatedHomework ? (
                isEditingManually ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b">
                      <span>✏️ Chế độ chỉnh sửa văn bản trực tiếp (hỗ trợ Markdown & LaTeX $...$)</span>
                      <button
                        onClick={() => setIsEditingManually(false)}
                        className="text-violet-600 font-bold hover:underline"
                      >
                        Quay lại chế độ xem chuẩn
                      </button>
                    </div>
                    <textarea
                      rows={22}
                      value={generatedHomework}
                      onChange={(e) => setGeneratedHomework(e.target.value)}
                      className="w-full p-4 rounded-xl border border-slate-300 font-mono text-xs sm:text-sm leading-relaxed focus:outline-none focus:border-violet-500"
                    />
                  </div>
                ) : (
                  <EducationalMarkdownRenderer content={generatedHomework} isLightMode={true} />
                )
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center text-slate-400 space-y-3">
                  <div className="p-4 rounded-full bg-slate-100 border border-slate-200 text-violet-600">
                    <Target className="w-10 h-10" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-600">Chưa Có Phiếu Bài Tập</h4>
                  <p className="text-xs max-w-md text-slate-500">
                    Hãy chọn nhóm năng lực, chủ đề bài học và bấm <strong>"TẠO BÀI TẬP CÁ NHÂN HÓA BẰNG AI"</strong>.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Refinement Modal */}
      {isRefineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-amber-400" />
                <span>AI Sửa / Tinh Chỉnh Phiếu Bài Tập Cá Nhân Hóa</span>
              </h3>
              <button
                onClick={() => setIsRefineModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                ✕ Đóng
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Nhập yêu cầu chỉnh sửa cụ thể của Thầy/Cô (VD: <em>"Đổi số liệu câu 2 thành x² - 7x + 10 = 0"</em>, <em>"Thêm 1 câu bài toán thực tế gắn với cuộc sống"</em>, <em>"Thêm phần hướng dẫn giải chi tiết cho câu 3"</em>, <em>"Hạ bớt độ khó câu 4 cho em tự tin"</em>):
            </p>

            <textarea
              rows={4}
              value={aiRefineInstruction}
              onChange={(e) => setAiRefineInstruction(e.target.value)}
              placeholder="VD: Thay đổi số liệu câu 1 và thêm gợi ý bước phân tích nhân tử cho em..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:border-amber-400 focus:outline-none leading-relaxed"
            />

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsRefineModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleAIRefineHomework}
                disabled={isRefining || !aiRefineInstruction.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-amber-900/40 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isRefining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI Đang Tinh Chỉnh...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>CẬP NHẬT PHIẾU BÀI TẬP</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-View 2: Interactive Doing Test or Inputting Submission */}
      {activeTabSubView === 'interactive_do' && (
        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          onPaste={handlePasteEvent}
        >
          {/* Left: Homework Reference (5 Cols) */}
          <div className="lg:col-span-5 p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-violet-400" />
                Đề Bài Của Học Sinh: {studentName}
              </h3>
              <span className="text-[11px] text-violet-300 font-bold">Lớp {className}</span>
            </div>

            <div className="p-4 rounded-xl bg-white text-slate-900 border border-slate-300 max-h-[550px] overflow-y-auto shadow-inner font-sans">
              {generatedHomework ? (
                <EducationalMarkdownRenderer content={generatedHomework} isLightMode={true} />
              ) : (
                <p className="text-xs text-slate-400 italic">Chưa có đề bài. Vui lòng quay lại bước 1 để tạo đề bài trước.</p>
              )}
            </div>
          </div>

          {/* Right: Student Answer Input & AI Check (7 Cols) */}
          <div className="lg:col-span-7 p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4">
            <div className="flex flex-wrap items-center justify-between pb-2 border-b border-slate-800 gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                Nhập / Dán / Tải Bài Làm Học Sinh Để AI Tự Đọc & Chấm
              </h3>
              <div className="flex items-center gap-2">
                <VoiceMicButton
                  onTranscript={t => setStudentSubmissionText(prev => prev ? `${prev}\n${t}` : t)}
                  disabled={isGrading || isOcrProcessing}
                />
              </div>
            </div>

            {/* Hidden Input Files */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".docx,.doc,.pdf,.xlsx,.xls,.csv,.txt"
              className="hidden"
            />
            <input
              type="file"
              ref={imageInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Multi-source Ingestion Bar: Upload File, Upload Image, Paste from Clipboard */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isOcrProcessing}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 flex items-center gap-1.5 transition-all"
                >
                  <Paperclip className="w-3.5 h-3.5 text-sky-400" />
                  <span>Tải Tệp (Word / PDF / Txt)</span>
                </button>

                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isOcrProcessing}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 flex items-center gap-1.5 transition-all"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tải Ảnh Chụp Vở / Bài Làm</span>
                </button>

                <div className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-950/60 border border-purple-800/60 text-purple-300 flex items-center gap-1.5">
                  <Sparkle className="w-3.5 h-3.5 text-amber-300" />
                  <span>Hỗ trợ Dán Ảnh trực tiếp: <strong>Ctrl + V</strong></span>
                </div>
              </div>

              {/* Status Message / Processing Indicator */}
              {isOcrProcessing && (
                <div className="flex items-center gap-2 text-xs text-amber-300 animate-pulse bg-amber-950/30 p-2 rounded-lg border border-amber-800/40">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>{ocrStatusText}</span>
                </div>
              )}
              {!isOcrProcessing && ocrStatusText && (
                <div className="text-xs text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span>{ocrStatusText}</span>
                  <button onClick={() => setOcrStatusText('')} className="text-slate-500 hover:text-white text-[10px]">✕</button>
                </div>
              )}

              {/* Uploaded Image Thumbnail Preview */}
              {uploadedImagePreview && (
                <div className="relative inline-block mt-2 p-1.5 bg-slate-900 border border-slate-700 rounded-xl">
                  <img
                    src={uploadedImagePreview}
                    alt="Bài làm học sinh"
                    className="max-h-28 rounded-lg object-contain"
                  />
                  <button
                    onClick={() => setUploadedImagePreview('')}
                    className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center shadow"
                    title="Xóa ảnh"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <textarea
              rows={12}
              value={studentSubmissionText}
              onChange={e => setStudentSubmissionText(e.target.value)}
              placeholder="VD bài làm của học sinh (gõ trực tiếp, tải tệp hoặc bấm Ctrl+V dán ảnh bài làm viết tay):&#10;Câu 1: Chọn A&#10;Câu 2: Chọn C&#10;Câu 3: Lời giải: Ta có Delta = b^2 - 4ac = (-5)^2 - 4*1*6 = 25 - 24 = 1 > 0...&#10;Phương trình có 2 nghiệm x1 = 3, x2 = 2..."
              className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 font-mono focus:border-emerald-400 focus:outline-none leading-relaxed"
            />

            {/* Action: Grade Button */}
            <button
              onClick={handleAIGradingSubmission}
              disabled={isGrading || !studentSubmissionText.trim()}
              className="w-full py-3.5 px-4 rounded-2xl font-black text-sm text-white shadow-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-emerald-900/50 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isGrading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>AI Đang Phân Tích Lỗi Sai & Chấm Điểm Chi Tiết...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>🤖 AI CHẤM ĐIỂM, PHÂN TÍCH LỖI SAI & NHẬN XÉT SƯ PHẠM</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Sub-View 3: AI Detailed Grading Result */}
      {activeTabSubView === 'grading_result' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Kết Quả Chấm Điểm & Phân Tích Lỗi Của Học Sinh: {studentName}</h3>
                <span className="text-xs text-slate-400">Lớp {className} - Môn {subjectName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyText(gradingResultText)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Đã Chép' : 'Sao Chép'}</span>
              </button>

              <button
                onClick={() => handleExportWord(gradingResultText, `Phieu_Cham_Diem_${studentName}.docx`)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất Phiếu Chấm Điểm (Word)</span>
              </button>

              <button
                onClick={() => setActiveTabSubView('interactive_do')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              >
                Sửa Bài Làm
              </button>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white text-slate-900 border border-slate-300 shadow-2xl min-h-[500px] font-sans">
            {gradingResultText ? (
              <EducationalMarkdownRenderer content={gradingResultText} isLightMode={true} />
            ) : (
              <div className="text-center py-20 text-slate-400">
                <p>Chưa có kết quả chấm điểm. Vui lòng nhập bài làm của học sinh ở bước 2 và bấm "AI Chấm Điểm".</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
