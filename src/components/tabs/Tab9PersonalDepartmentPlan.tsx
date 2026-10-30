import React, { useState } from 'react';
import { generateGeminiText } from '../../lib/geminiApi';
import { exportMarkdownToWord, stripIntroductoryChatter } from '../../lib/wordExport';
import { readFileAsText, getPdfPageCount } from '../../lib/fileUtils';
import { ClassProfile } from '../../types';
import { VoiceMicButton } from '../VoiceMicButton';
import { HomeroomDocumentManager } from './tab9/HomeroomDocumentManager';
import { ExcelGradeCommentManager } from './tab9/ExcelGradeCommentManager';
import { PersonalizedHomeworkManager } from './tab9/PersonalizedHomeworkManager';
import {
  FileText,
  Sparkles,
  Download,
  Copy,
  Check,
  Upload,
  RefreshCw,
  Edit3,
  CheckCircle2,
  Layers,
  Users,
  User,
  School,
  Award,
  BookOpen,
  Calendar,
  Briefcase,
  HelpCircle,
  FileUp,
  Sliders,
  Scissors,
  Eye,
  Loader2,
  Trash2,
  Plus,
  ListPlus,
  Settings2,
  FolderOpen,
  FileCheck,
  Printer,
  ChevronRight,
  ClipboardList,
  Sparkle,
  FileSpreadsheet,
  Target
} from 'lucide-react';

interface Tab9PersonalDepartmentPlanProps {
  profile: ClassProfile;
  onChangeProfile: (p: ClassProfile) => void;
  apiKeysInput: string;
  onOpenApiGuide?: () => void;
}

interface CustomTargetItem {
  id: string;
  name: string;
  value: string;
  unit: string;
}

interface TeachingClassItem {
  id: string;
  className: string;
  studentCount: number;
  goodPercent: string;
  fairPercent: string;
  passPercent: string;
  notes: string;
}

// Preset Administrative Document Templates
interface DocumentTemplateOption {
  id: string;
  category: 'plan' | 'record' | 'minutes' | 'evaluation' | 'custom';
  title: string;
  subtitle: string;
  icon: string;
  badge: string;
  description: string;
  defaultPromptGoal: string;
}

const DOCUMENT_TEMPLATES: DocumentTemplateOption[] = [
  {
    id: 'plan_personal',
    category: 'plan',
    title: 'Kế Hoạch Giáo Dục Cá Nhân Giáo Viên',
    subtitle: 'Kế hoạch năm học & Lịch trình 10 tháng chi tiết',
    icon: '👤',
    badge: 'Chuẩn GDPT 2018',
    description: 'Bản kế hoạch giảng dạy, bồi dưỡng, chủ nhiệm và chỉ tiêu thi đua cá nhân theo chuẩn biên chế năm học.',
    defaultPromptGoal: 'Kế hoạch giáo dục cá nhân giáo viên toàn diện cả năm học'
  },
  {
    id: 'plan_department',
    category: 'plan',
    title: 'Kế Hoạch Hoạt Động Tổ Chuyên Môn',
    subtitle: 'Theo CV 5512/BGDĐT - Phụ lục 1 & Phụ lục 2',
    icon: '👥',
    badge: 'CV 5512 Bộ GD&ĐT',
    description: 'Kế hoạch dạy học các môn học của tổ, phân công nhiệm vụ, chỉ tiêu chất lượng và lịch sinh hoạt chuyên môn.',
    defaultPromptGoal: 'Kế hoạch hoạt động tổ chuyên môn theo khung Công văn 5512'
  },
  {
    id: 'plan_homeroom',
    category: 'plan',
    title: 'Kế Hoạch & Sổ Theo Dõi Công Tác Chủ Nhiệm',
    subtitle: 'Chủ nhiệm lớp, nề nếp thi đua, giáo dục học sinh',
    icon: '🏫',
    badge: 'Công tác Chủ nhiệm',
    description: 'Kế hoạch chủ nhiệm lớp, đặc điểm tình hình học sinh, chỉ tiêu hạnh kiểm/rèn luyện, học tập và hoạt động phong trào.',
    defaultPromptGoal: 'Kế hoạch và sổ theo dõi công tác chủ nhiệm lớp chi tiết'
  },
  {
    id: 'minutes_department_meeting',
    category: 'minutes',
    title: 'Biên Bản Sinh Hoạt Tổ Chuyên Môn',
    subtitle: 'Sinh hoạt chuyên môn theo Nghiên cứu bài học & Chuyên đề',
    icon: '📝',
    badge: 'Nghiên cứu bài học',
    description: 'Biên bản họp tổ chuyên môn định kỳ: Xây dựng kế hoạch bài dạy, phân tích tiến trình học sinh, rút kinh nghiệm sư phạm.',
    defaultPromptGoal: 'Biên bản sinh hoạt tổ chuyên môn theo quy trình nghiên cứu bài học'
  },
  {
    id: 'minutes_parent_meeting',
    category: 'minutes',
    title: 'Biên Bản Họp Phụ Huynh Học Sinh',
    subtitle: 'Đầu năm, Giữa kỳ I/II và Tổng kết năm học',
    icon: '👨‍👩‍👧‍👦',
    badge: 'Họp Phụ Huynh',
    description: 'Biên bản chi tiết cuộc họp phụ huynh: Báo cáo kết quả, phương hướng phối hợp giáo dục, bầu ban đại diện cha mẹ học sinh.',
    defaultPromptGoal: 'Biên bản họp cha mẹ học sinh đầy đủ, trang trọng'
  },
  {
    id: 'plan_gifted_students',
    category: 'plan',
    title: 'Kế Hoạch Bồi Dưỡng Học Sinh Giỏi',
    subtitle: 'Ôn luyện học sinh giỏi cấp Trường, Huyện/Quận, Tỉnh/TP',
    icon: '🏆',
    badge: 'Mũi nhọn HSG',
    description: 'Kế hoạch phát hiện, tuyển chọn, xây dựng chuyên đề nâng cao, ngân hàng đề thi và phân công lịch bồi dưỡng HSG.',
    defaultPromptGoal: 'Kế hoạch bồi dưỡng học sinh giỏi môn học chuyên sâu'
  },
  {
    id: 'plan_remedial_students',
    category: 'plan',
    title: 'Kế Hoạch Phụ Đạo Học Sinh Cần Rèn Luyện Thêm',
    subtitle: 'Hỗ trợ học sinh chưa đạt, nâng cao tỷ lệ lên lớp',
    icon: '🌱',
    badge: 'Phụ đạo học sinh',
    description: 'Khảo sát phân loại học sinh, xác định kiến thức hổng, giải pháp kèm cặp cá nhân hóa và theo dõi sự tiến bộ.',
    defaultPromptGoal: 'Kế hoạch phụ đạo học sinh còn hạn chế về kết quả học tập'
  },
  {
    id: 'evaluation_lesson_rubric',
    category: 'evaluation',
    title: 'Phiếu Đánh Giá Tiết Dạy & Biên Bản Dự Giờ',
    subtitle: 'Chuẩn nghề nghiệp giáo viên theo CV 5555/BGDĐT',
    icon: '📋',
    badge: 'CV 5555 Bộ GD&ĐT',
    description: 'Phiếu đánh giá tiết dạy theo 3 tiêu chí: Kế hoạch & tài liệu dạy học; Tổ chức hoạt động; Hoạt động của học sinh.',
    defaultPromptGoal: 'Phiếu đánh giá tiết dạy và biên bản dự giờ giáo viên theo CV 5555'
  },
  {
    id: 'plan_self_training',
    category: 'plan',
    title: 'Kế Hoạch Tự Bồi Dưỡng Thường Xuyên & Nhật Ký',
    subtitle: 'Bồi dưỡng Module CT GDPT 2018 & Năng lực số AI',
    icon: '📚',
    badge: 'Bồi dưỡng TX',
    description: 'Kế hoạch học tập nâng cao trình độ chuyên môn, tự học công nghệ thông tin, ngoại ngữ và chứng chỉ chức danh nghề nghiệp.',
    defaultPromptGoal: 'Kế hoạch tự bồi dưỡng thường xuyên của giáo viên'
  },
  {
    id: 'plan_stem_experiential',
    category: 'plan',
    title: 'Kế Hoạch Chuyên Đề, Ngày Hội STEM & Trải Nghiệm',
    subtitle: 'Hoạt động trải nghiệm, tích hợp liên môn, ngày hội STEM',
    icon: '🔬',
    badge: 'Giáo dục STEM',
    description: 'Kế hoạch tổ chức chuyên đề cấp trường/tổ, ngày hội khoa học STEM, dự án học tập gắn liền với thực tiễn.',
    defaultPromptGoal: 'Kế hoạch tổ chức chuyên đề và hoạt động giáo dục STEM'
  },
  {
    id: 'record_student_assessment',
    category: 'record',
    title: 'Báo Cáo Chất Lượng & Sổ Theo Dõi Đánh Giá',
    subtitle: 'Theo Thông tư 22/2021/TT-BGDĐT & TT 27/2020',
    icon: '📊',
    badge: 'Thông tư 22 / 27',
    description: 'Tổng hợp đánh giá thường xuyên, đánh giá định kỳ, phân tích phổ điểm và biểu đồ chất lượng các lớp giảng dạy.',
    defaultPromptGoal: 'Báo cáo chất lượng giáo dục và theo dõi đánh giá học sinh'
  },
  {
    id: 'minutes_inspection_equipment',
    category: 'minutes',
    title: 'Biên Bản Kiểm Tra Hồ Sơ & Sổ Thiết Bị Dạy Học',
    subtitle: 'Kiểm tra nội bộ, rà soát sổ sách chuyên môn, thiết bị',
    icon: '🔍',
    badge: 'Kiểm tra nội bộ',
    description: 'Biên bản kiểm tra hồ sơ giáo án, sổ điểm, sổ dự giờ, kế hoạch sử dụng thiết bị thí nghiệm và phòng bộ môn.',
    defaultPromptGoal: 'Biên bản kiểm tra hồ sơ chuyên môn và quản lý thiết bị dạy học'
  },
  {
    id: 'plan_digital_transformation',
    category: 'plan',
    title: 'Kế Hoạch Ứng Dụng AI & Chuyển Đổi Số Giáo Dục',
    subtitle: 'Khung năng lực số TT 02/2025 & Hướng dẫn QĐ 2422',
    icon: '🤖',
    badge: 'AI & Năng Lực Số',
    description: 'Xây dựng kế hoạch số hóa bài giảng, khai thác học liệu số, ứng dụng AI sư phạm an toàn và đổi mới kiểm tra đánh giá trực tuyến.',
    defaultPromptGoal: 'Kế hoạch chuyển đổi số và ứng dụng Trí tuệ nhân tạo (AI) trong dạy học'
  },
  {
    id: 'custom_uploaded_template',
    category: 'custom',
    title: '📂 Tạo Theo Tệp File Mẫu Đơn Vị Tải Lên (Word/PDF)',
    subtitle: 'Tự động bám sát 100% bố cục, bảng biểu từ file mẫu riêng của trường/tổ',
    icon: '📁',
    badge: 'Mẫu Tùy Chọn Của Đơn Vị',
    description: 'Tải lên bất kỳ file Word (.docx), PDF hoặc Text mẫu nào của nhà trường, AI sẽ đọc hiểu cấu trúc và tự động điền đầy đủ nội dung.',
    defaultPromptGoal: 'Tạo văn bản theo đúng cấu trúc file mẫu của nhà trường tải lên'
  }
];

export const Tab9PersonalDepartmentPlan: React.FC<Tab9PersonalDepartmentPlanProps> = ({
  profile,
  onChangeProfile,
  apiKeysInput,
  onOpenApiGuide
}) => {
  // Top Level Module Switcher within Tab 9
  const [activeSubModule, setActiveSubModule] = useState<
    'plan_dept' | 'homeroom_docs' | 'excel_comments' | 'personalized_homework'
  >('plan_dept');

  // Main Category / Mode
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('plan_personal');
  const [templateFilter, setTemplateFilter] = useState<'all' | 'plan' | 'record' | 'minutes' | 'evaluation' | 'custom'>('all');

  // Teacher Info Form
  const [teacherName, setTeacherName] = useState(profile.teacherSigner || 'Giáo viên');
  const [schoolName, setSchoolName] = useState(profile.schoolName || 'Trường THCS Phùng Khắc Khoan');
  const [departmentName, setDepartmentName] = useState(profile.toChuyenMon || 'Tổ Toán - Tin');
  const [position, setPosition] = useState('Giáo viên - Tổ trưởng Chuyên môn');
  const [subject, setSubject] = useState(profile.mon || 'Toán học');
  const [grades, setGrades] = useState(profile.lop || 'Lớp 6, Lớp 7, Lớp 8');
  const [teachingPeriodsPerWeek, setTeachingPeriodsPerWeek] = useState('19 tiết/tuần');
  const [homeroomClass, setHomeroomClass] = useState('Lớp 7A1');
  const [academicYear, setAcademicYear] = useState('2026 - 2027');
  const [emulationGoal, setEmulationGoal] = useState('Chiến sĩ thi đua cơ sở, Giáo viên dạy giỏi cấp Tỉnh/Huyện');
  const [skknTopic, setSkknTopic] = useState('Ứng dụng Trí tuệ nhân tạo (AI) và Chuyển đổi số trong đổi mới Phương pháp dạy học Toán học');

  // Standard Target Percentages
  const [targetGood, setTargetGood] = useState('45%');
  const [targetFair, setTargetFair] = useState('45%');
  const [targetPass, setTargetPass] = useState('10%');
  const [targetHsg, setTargetHsg] = useState('02 học sinh đạt giải cấp Huyện/Tỉnh');

  // Teaching Classes with Student counts
  const [teachingClasses, setTeachingClasses] = useState<TeachingClassItem[]>([
    { id: '1', className: '7A1', studentCount: 42, goodPercent: '50%', fairPercent: '40%', passPercent: '10%', notes: 'Lớp chọn / Chủ nhiệm' },
    { id: '2', className: '7A2', studentCount: 40, goodPercent: '40%', fairPercent: '50%', passPercent: '10%', notes: 'Bộ môn Toán' }
  ]);

  // Dynamic Custom Targets
  const [customTargets, setCustomTargets] = useState<CustomTargetItem[]>([
    { id: '1', name: 'Tỷ lệ HS lên lớp thẳng', value: '100', unit: '%' },
    { id: '2', name: 'Giờ dạy Tốt / Hội giảng', value: '100', unit: '% giờ Tốt' },
    { id: '3', name: 'Bài giảng số / Học liệu số', value: '04', unit: 'bài/năm' },
    { id: '4', name: 'Dự giờ đồng nghiệp', value: '18', unit: 'tiết/năm' }
  ]);

  // Section 2 Preview & AI Quick Edit State
  const [isSection2PreviewOpen, setIsSection2PreviewOpen] = useState(false);
  const [section2AiPrompt, setSection2AiPrompt] = useState('');
  const [isSection2AiAdjusting, setIsSection2AiAdjusting] = useState(false);

  // Reference Documents (Guidelines & Uploaded Templates)
  const [refFilesText, setRefFilesText] = useState<string>('');
  const [uploadedFilesList, setUploadedFilesList] = useState<{ name: string; size: string; snippet: string }[]>([]);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [customNotes, setCustomNotes] = useState('');

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlanMarkdown, setGeneratedPlanMarkdown] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Preview Mode: 'print' (A4 Administrative standard) | 'rich' (Markdown cards) | 'edit' (Raw markdown)
  const [previewDisplayMode, setPreviewDisplayMode] = useState<'print' | 'rich' | 'edit'>('print');

  // AI Refinement State
  const [refinePrompt, setRefinePrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // Quick refinement prompt suggestions
  const QUICK_REFINE_PROMPTS = [
    '➕ Bổ sung lịch trình công tác chi tiết 10 tháng từ Tháng 9 đến Tháng 5',
    '📈 Tăng chỉ tiêu HS Giỏi lên 50% và Khá 45% cho toàn bộ các lớp',
    '💡 Thêm giải pháp chuyển đổi số và ứng dụng AI sư phạm (QĐ 2422)',
    '🔬 Bổ sung 2 chuyên đề STEM và sinh hoạt chuyên môn theo Nghiên cứu bài học',
    '📊 Kẻ bảng số liệu cho toàn bộ danh mục chỉ tiêu phấn đấu',
    '🏛️ Bổ sung khung ký duyệt của Hiệu trưởng & Tổ trưởng chuyên môn',
    '🎯 Chi tiết hóa kế hoạch bồi dưỡng Học sinh giỏi cấp Tỉnh/Huyện'
  ];

  // Add a new Class
  const handleAddClass = () => {
    const newId = Date.now().toString();
    setTeachingClasses(prev => [
      ...prev,
      {
        id: newId,
        className: `Lớp ${prev.length + 6}A${prev.length + 1}`,
        studentCount: 38,
        goodPercent: '45%',
        fairPercent: '45%',
        passPercent: '10%',
        notes: 'Bộ môn'
      }
    ]);
  };

  const handleRemoveClass = (id: string) => {
    setTeachingClasses(prev => prev.filter(c => c.id !== id));
  };

  const handleUpdateClass = (id: string, field: keyof TeachingClassItem, value: any) => {
    setTeachingClasses(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  // Add a new Custom Target
  const handleAddCustomTarget = () => {
    const newId = Date.now().toString();
    setCustomTargets(prev => [
      ...prev,
      { id: newId, name: 'Chỉ tiêu mới', value: '100', unit: '%' }
    ]);
  };

  const handleRemoveCustomTarget = (id: string) => {
    setCustomTargets(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateCustomTarget = (id: string, field: keyof CustomTargetItem, value: string) => {
    setCustomTargets(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  // Total students calculated
  const totalStudents = teachingClasses.reduce((sum, c) => sum + (Number(c.studentCount) || 0), 0);

  // Active Template object
  const activeTemplate = DOCUMENT_TEMPLATES.find(t => t.id === selectedTemplateId) || DOCUMENT_TEMPLATES[0];

  // AI Quick Adjust Section 2
  const handleAiAdjustSection2 = async () => {
    if (!section2AiPrompt.trim()) return;
    const apiKeys = apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);

    setIsSection2AiAdjusting(true);
    const prompt = `Bạn là chuyên gia quản trị giáo dục. Dưới đây là dữ liệu Thông tin cá nhân và Chỉ tiêu phấn đấu của giáo viên:
- Giáo viên: ${teacherName} - Trường: ${schoolName} - Môn: ${subject}
- Khối lớp: ${grades} - Số lớp dạy: ${teachingClasses.map(c => `${c.className} (${c.studentCount} HS)`).join(', ')}
- Chỉ tiêu chung: Giỏi ${targetGood}, Khá ${targetFair}, Đạt ${targetPass}, HSG: ${targetHsg}
- Các chỉ tiêu tự thêm: ${customTargets.map(t => `${t.name}: ${t.value} ${t.unit}`).join(', ')}

Yêu cầu điều chỉnh từ giáo viên: "${section2AiPrompt}"

Hãy phân tích và trả về định dạng JSON duy nhất (không bọc markdown giải thích ngoài) với cấu trúc:
{
  "targetGood": "...",
  "targetFair": "...",
  "targetPass": "...",
  "targetHsg": "...",
  "emulationGoal": "...",
  "skknTopic": "...",
  "teachingClasses": [
    { "className": "...", "studentCount": 40, "goodPercent": "45%", "fairPercent": "45%", "passPercent": "10%", "notes": "..." }
  ],
  "customTargets": [
    { "name": "...", "value": "...", "unit": "..." }
  ]
}`;

    try {
      const res = await generateGeminiText({
        prompt,
        apiKeys,
        maxOutputTokens: 8192
      });

      if (res) {
        const jsonMatch = res.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.targetGood) setTargetGood(parsed.targetGood);
          if (parsed.targetFair) setTargetFair(parsed.targetFair);
          if (parsed.targetPass) setTargetPass(parsed.targetPass);
          if (parsed.targetHsg) setTargetHsg(parsed.targetHsg);
          if (parsed.emulationGoal) setEmulationGoal(parsed.emulationGoal);
          if (parsed.skknTopic) setSkknTopic(parsed.skknTopic);
          if (Array.isArray(parsed.teachingClasses) && parsed.teachingClasses.length > 0) {
            setTeachingClasses(parsed.teachingClasses.map((c: any, i: number) => ({
              id: String(i + 1),
              className: c.className || `Lớp ${i + 1}`,
              studentCount: Number(c.studentCount) || 35,
              goodPercent: c.goodPercent || '40%',
              fairPercent: c.fairPercent || '50%',
              passPercent: c.passPercent || '10%',
              notes: c.notes || ''
            })));
          }
          if (Array.isArray(parsed.customTargets) && parsed.customTargets.length > 0) {
            setCustomTargets(parsed.customTargets.map((t: any, i: number) => ({
              id: String(i + 1),
              name: t.name || 'Chỉ tiêu',
              value: t.value || '100',
              unit: t.unit || '%'
            })));
          }
          setSection2AiPrompt('');
          alert('✓ AI đã cập nhật và đồng bộ chỉ tiêu thành công!');
        }
      }
    } catch (err) {
      console.error('Lỗi điều chỉnh chỉ tiêu bằng AI:', err);
      alert('Không thể hoàn tất điều chỉnh AI. Vui lòng kiểm tra API key.');
    } finally {
      setIsSection2AiAdjusting(false);
    }
  };

  // Handle Uploading Guidance / Template Files
  const handleUploadGuidanceFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsReadingFiles(true);
    let combinedText = '';
    const newFileList = [...uploadedFilesList];

    for (const f of files) {
      try {
        let text = '';
        if (f.name.toLowerCase().endsWith('.pdf')) {
          const totalPages = await getPdfPageCount(f);
          const maxPages = Math.min(totalPages || 20, 20);
          text = await readFileAsText(f, { startPage: 1, endPage: maxPages, maxPages, apiKeys: apiKeysInput });
        } else {
          text = await readFileAsText(f, { apiKeys: apiKeysInput });
        }

        if (text && text.trim()) {
          combinedText += `\n\n--- [CĂN CỨ VĂN BẢN / FILE MẪU: ${f.name}] ---\n${text.slice(0, 25000)}`;
          newFileList.push({
            name: f.name,
            size: `${(f.size / 1024).toFixed(1)} KB`,
            snippet: text.slice(0, 150) + '...'
          });
        }
      } catch (err) {
        console.error('Lỗi đọc file hướng dẫn:', err);
      }
    }

    setUploadedFilesList(newFileList);
    setRefFilesText(prev => prev + combinedText);
    setIsReadingFiles(false);
  };

  const handleClearDocs = () => {
    setUploadedFilesList([]);
    setRefFilesText('');
  };

  // Generate Plan or Document with AI
  const handleGeneratePlan = async () => {
    const apiKeys = apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);

    setIsGenerating(true);

    const docTitle = activeTemplate.title.toUpperCase();

    const classesInfoText = teachingClasses
      .map((c, i) => `+ Lớp ${c.className}: ${c.studentCount} học sinh | Chỉ tiêu: Giỏi ${c.goodPercent}, Khá ${c.fairPercent}, Đạt ${c.passPercent} | Ghi chú: ${c.notes}`)
      .join('\n');

    const customTargetsText = customTargets
      .map(t => `+ ${t.name}: ${t.value} ${t.unit}`)
      .join('\n');

    const prompt = `ĐÓNG VAI CHUYÊN GIA QUẢN TRỊ GIÁO DỤC, TỔ TRƯỞNG CHUYÊN MÔN VÀ CÁN BỘ QUẢN LÝ NHÀ TRƯỜNG CAO CẤP.
Hãy lập bản văn bản hành chính sư phạm: "${docTitle} NĂM HỌC ${academicYear}" cực kỳ hoàn chỉnh, chi tiết, bài bản, chuyên sâu theo đúng chuẩn thể thức văn bản hành chính Việt Nam (Nghị định 30/2020/NĐ-CP & Quy định của Bộ GD&ĐT).

THÔNG TIN ĐẦU VÀO CƠ BẢN:
- Loại văn bản / hồ sơ: ${activeTemplate.title} (${activeTemplate.badge})
- Mục tiêu tạo lập: ${activeTemplate.defaultPromptGoal}
- Họ và tên Giáo viên / Cán bộ: ${teacherName}
- Trường: ${schoolName} - Tổ chuyên môn: ${departmentName}
- Chức vụ / Nhiệm vụ: ${position}
- Môn dạy: ${subject} - Khối lớp: ${grades}
- Số tiết giảng dạy: ${teachingPeriodsPerWeek} - Lớp chủ nhiệm: ${homeroomClass || 'Không chủ nhiệm'}
- Tổng số học sinh trực tiếp giảng dạy / quản lý: ${totalStudents} học sinh trên ${teachingClasses.length} lớp.
- Danh sách lớp và số lượng học sinh chi tiết:
${classesInfoText || 'Chưa có chi tiết từng lớp'}
- Danh hiệu thi đua đăng ký: ${emulationGoal}
- Đề tài Sáng kiến kinh nghiệm / Nghiên cứu: ${skknTopic}
- Chỉ tiêu chất lượng giáo dục chung: Tốt/Giỏi: ${targetGood}, Khá: ${targetFair}, Đạt: ${targetPass}. Mũi nhọn HSG: ${targetHsg}
- Các chỉ tiêu phấn đấu cụ thể tự đặt ra:
${customTargetsText || 'Không có chỉ tiêu riêng'}
- Ghi chú / Yêu cầu đặc thù bổ sung: ${customNotes || 'Thực hiện chuyển đổi số, tích hợp năng lực số (TT 02/2025) và ứng dụng Trí tuệ nhân tạo (QĐ 2422) an toàn, hiệu quả.'}

CÁC VĂN BẢN HƯỚNG DẪN / FILE MẪU CỦA ĐƠN VỊ ĐÃ TẢI LÊN LÀM CĂN CỨ:
${refFilesText ? refFilesText.slice(0, 45000) : 'Căn cứ nhiệm vụ năm học của Bộ GD&ĐT, Sở GD&ĐT (mô hình chính quyền 2 cấp) và Kế hoạch giáo dục nhà trường.'}

QUY TẮC CẤU TRÚC VĂN BẢN BẮT BUỘC (ĐẦY ĐỦ CÁC PHẦN, ĐẠT TỪ 4-6 TRANG A4, ĐẦY ĐỦ BẢNG BIỂU, TUYỆT ĐỐI KHÔNG TÓM TẮT QUA LOA):

1. PHẦN ĐẦU VĂN BẢN (CHUẨN NGHỊ ĐỊNH 30/2020/NĐ-CP & MÔ HÌNH CHÍNH QUYỀN 2 CẤP):
TÊN ĐƠN VỊ CẤP TRÊN: SỞ GD&ĐT (hoặc UBND XÃ TÂY PHƯƠNG theo mô hình chính quyền 2 cấp)
TÊN TRƯỜNG: ${schoolName.toUpperCase()}
---
CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc

# ${docTitle}
## NĂM HỌC ${academicYear}

I. CĂN CỨ XÂY DỰNG:
- Nêu rõ các văn bản quy phạm pháp luật, chỉ thị, công văn hướng dẫn nhiệm vụ năm học của Bộ GD&ĐT, Sở GD&ĐT (theo mô hình chính quyền 2 cấp đã bãi bỏ cấp quận/huyện và Phòng GD&ĐT) và Nghị quyết Hội nghị viên chức nhà trường.
- Căn cứ thực tiễn của ${schoolName} và ${departmentName}.

II. ĐẶC ĐIỂM TÌNH HÌNH & BỐI CẢNH:
1. Thuận lợi: Về phía nhà trường, tổ chuyên môn, bản thân giáo viên, học sinh và phụ huynh.
2. Khó khăn: Cơ sở vật chất, đặc thù học sinh, áp lực đổi mới chương trình GDPT 2018.

III. CÁC MỤC TIÊU VÀ CHỈ TIÊU PHẤN ĐẤU CỤ THỂ:
1. Phẩm chất chính trị, đạo đức lối sống và tư tưởng:
2. Công tác chuyên môn, giảng dạy (Bao gồm Bảng phân công giảng dạy, sĩ số học sinh từng lớp và chỉ tiêu chất lượng):
| STT | Lớp | Sĩ số HS | Giỏi / Tốt (%) | Khá (%) | Đạt (%) | Ghi chú |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- |
(Đưa toàn bộ danh sách các lớp ${teachingClasses.map(c => `${c.className}: ${c.studentCount} HS`).join(', ')} vào bảng trên đầy đủ)
3. Các chỉ tiêu công tác chuyên môn khác (Kẻ bảng chi tiết):
| STT | Tên Chỉ Tiêu Phấn Đấu | Mức Chỉ Tiêu Đăng Ký | Đơn Vị Tính | Biện Pháp Thực Hiện |
| :---: | :--- | :---: | :---: | :--- |
(Trình bày rõ các chỉ tiêu: ${customTargets.map(t => `${t.name}: ${t.value} ${t.unit}`).join('; ')})
4. Công tác bồi dưỡng học sinh giỏi & NCKH: ${targetHsg}
5. Công tác chủ nhiệm lớp / Quản lý học sinh:
6. Tự học, tự bồi dưỡng thường xuyên, Năng lực số & AI (TT 02/2025 & QĐ 2422/QĐ-BGDĐT):
7. Sáng kiến kinh nghiệm / Đổi mới sáng tạo: "${skknTopic}".
8. Đăng ký danh hiệu thi đua: "${emulationGoal}".

IV. NHIỆM VỤ, GIẢI PHÁP VÀ BIỆN PHÁP THỰC HIỆN CỤ THỂ:
1. Đổi mới phương pháp dạy học và kiểm tra đánh giá theo định hướng phát triển phẩm chất, năng lực.
2. Ứng dụng công nghệ thông tin, chuyển đổi số, khai thác học liệu số / thí nghiệm ảo / mô phỏng tương tác.
3. Bồi dưỡng học sinh giỏi, phụ đạo học sinh còn hạn chế.
4. Sinh hoạt chuyên môn theo nghiên cứu bài học, dạy học STEM và chuyên đề tổ khối.
5. Phối hợp giữa Nhà trường - Gia đình - Xã hội.

V. LỊCH TRÌNH CÔNG TÁC VÀ KẾ HOẠCH HOẠT ĐỘNG THEO TỪNG THÁNG TRONG NĂM HỌC:
(BẮT BUỘC TRÌNH BÀY BẢNG KẾ HOẠCH CHI TIẾT TỪ THÁNG 8/9 NĂM TRƯỚC ĐẾN THÁNG 5/6 NĂM SAU ĐỦ 10 THÁNG):
| Tháng | Nội dung công việc trọng tâm | Biện pháp thực hiện | Kết quả / Sản phẩm dự kiến | Người phối hợp / Giám sát |
| :--- | :--- | :--- | :--- | :--- |
(Liệt kê đầy đủ từng tháng từ Tháng 8, Tháng 9, Tháng 10, Tháng 11, Tháng 12, Tháng 1, Tháng 2, Tháng 3, Tháng 4, Tháng 5, Tháng 6 với các công việc cực kỳ chi tiết, thực tế, đúng tiến độ biên chế năm học).

VI. ĐỀ XUẤT, KIẾN NGHỊ:
1. Đối với Ban Giám hiệu nhà trường:
2. Đối với Tổ chuyên môn:

PHẦN KÝ DUYỆT (KẺ BẢNG 3 CỘT CUỐI KẾ HOẠCH):
| DUYỆT CỦA BAN GIÁM HIỆU | DUYỆT CỦA TỔ CHUYÊN MÔN | NGƯỜI LẬP KẾ HOẠCH |
| :---: | :---: | :---: |
| *(Ký và ghi rõ họ tên)* | *(Ký và ghi rõ họ tên)* | *(Ký và ghi rõ họ tên)* |
| | | **${teacherName}** |

QUY TẮC TRÌNH BÀY:
- 100% Tiếng Việt sư phạm chuẩn mực, văn phong hành chính chỉn chu.
- Không viết tắt cẩu thả. Các mục phân cấp sạch sẽ (I., II., 1., 2., a), b)).
- Xuất khẩu chuẩn định dạng Markdown để xuất sang file Word hoàn hảo.`;

    try {
      const result = await generateGeminiText({
        prompt,
        apiKeys,
        maxOutputTokens: 65536
      });

      if (result) {
        const clean = stripIntroductoryChatter(result);
        setGeneratedPlanMarkdown(clean);
      }
    } catch (err) {
      console.error('Lỗi sinh kế hoạch:', err);
      alert('Đã xảy ra lỗi khi tạo kế hoạch bằng AI. Vui lòng kiểm tra lại mã API Key.');
    } finally {
      setIsGenerating(false);
    }
  };

  // AI Refinement of Plan
  const handleRefinePlan = async (customPromptText?: string) => {
    const promptToUse = customPromptText || refinePrompt;
    if (!promptToUse.trim() || !generatedPlanMarkdown) return;
    const apiKeys = apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);

    setIsRefining(true);
    const prompt = `Bạn là chuyên gia quản trị giáo dục. Dưới đây là văn bản kế hoạch / hồ sơ sổ sách đang soạn thảo:

=== VĂN BẢN HIỆN TẠI ===
${generatedPlanMarkdown}
=== HẾT VĂN BẢN HIỆN TẠI ===

YÊU CẦU ĐIỀU CHỈNH / BỔ SUNG / HOÀN THIỆN CỦA GIÁO VIÊN:
"${promptToUse}"

HÃY CẬP NHẬT, CHỈNH SỬA VÀ HOÀN THIỆN LẠI TOÀN BỘ BẢN KẾ HOẠCH TRÊN THEO ĐÚNG YÊU CẦU ĐIỀU CHỈNH. GIỮ NGUYÊN THỂ THỨC VĂN BẢN, BẢNG BIỂU VÀ ĐỘ CHI TIẾT TỐI ĐA. TRẢ VỀ TOÀN BỘ VĂN BẢN KẾ HOẠCH HOÀN CHỈNH.`;

    try {
      const result = await generateGeminiText({
        prompt,
        apiKeys,
        maxOutputTokens: 65536
      });

      if (result) {
        setGeneratedPlanMarkdown(stripIntroductoryChatter(result));
        if (!customPromptText) setRefinePrompt('');
      }
    } catch (err) {
      console.error('Lỗi điều chỉnh kế hoạch:', err);
      alert('Không thể thực hiện chỉnh sửa AI. Vui lòng kiểm tra kết nối API.');
    } finally {
      setIsRefining(false);
    }
  };

  const handleExportWord = () => {
    if (!generatedPlanMarkdown) return;
    const fileName = `${activeTemplate.id}_${teacherName.replace(/\s+/g, '_')}_${academicYear.replace(/\s+/g, '')}.docx`;
    exportMarkdownToWord(generatedPlanMarkdown, fileName);
  };

  const handleCopy = () => {
    if (!generatedPlanMarkdown) return;
    navigator.clipboard.writeText(generatedPlanMarkdown);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Filtered Templates
  const filteredTemplates = DOCUMENT_TEMPLATES.filter(t => {
    if (templateFilter === 'all') return true;
    return t.category === templateFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Level Sub-Module Navigation */}
      <div className="bg-slate-900/95 border border-indigo-700/60 p-2 sm:p-2.5 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* Sub-Module 1 */}
          <button
            type="button"
            onClick={() => setActiveSubModule('plan_dept')}
            className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border text-center ${
              activeSubModule === 'plan_dept'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-900/40 border-indigo-400 scale-[1.02]'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-700/80'
            }`}
          >
            <Briefcase className="w-4 h-4 text-indigo-300 shrink-0" />
            <span className="truncate">1. Kế Hoạch Cá Nhân & Tổ</span>
          </button>

          {/* Sub-Module 2 */}
          <button
            type="button"
            onClick={() => setActiveSubModule('homeroom_docs')}
            className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border text-center ${
              activeSubModule === 'homeroom_docs'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-900/40 border-amber-400 scale-[1.02]'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-700/80'
            }`}
          >
            <FolderOpen className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="truncate">2. Hồ Sơ Giáo Viên Chủ Nhiệm</span>
          </button>

          {/* Sub-Module 3 */}
          <button
            type="button"
            onClick={() => setActiveSubModule('excel_comments')}
            className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border text-center ${
              activeSubModule === 'excel_comments'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/40 border-emerald-400 scale-[1.02]'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-700/80'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300 shrink-0" />
            <span className="truncate">3. Nhập Excel & Xuất Nhận Xét HS</span>
          </button>

          {/* Sub-Module 4 */}
          <button
            type="button"
            onClick={() => setActiveSubModule('personalized_homework')}
            className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border text-center ${
              activeSubModule === 'personalized_homework'
                ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-900/40 border-violet-400 scale-[1.02]'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-700/80'
            }`}
          >
            <Target className="w-4 h-4 text-cyan-300 shrink-0" />
            <span className="truncate">4. Bài Tập Cá Nhân Hóa & AI Chấm</span>
          </button>
        </div>
      </div>

      {/* Render Sub-Module 2: Homeroom Documents */}
      {activeSubModule === 'homeroom_docs' && (
        <HomeroomDocumentManager
          profile={profile}
          onChangeProfile={onChangeProfile}
          apiKeysInput={apiKeysInput}
          onOpenApiGuide={onOpenApiGuide}
        />
      )}

      {/* Render Sub-Module 3: Excel Grade & Comments */}
      {activeSubModule === 'excel_comments' && (
        <ExcelGradeCommentManager
          profile={profile}
          onChangeProfile={onChangeProfile}
          apiKeysInput={apiKeysInput}
          onOpenApiGuide={onOpenApiGuide}
        />
      )}

      {/* Render Sub-Module 4: Personalized Homework & AI Grading */}
      {activeSubModule === 'personalized_homework' && (
        <PersonalizedHomeworkManager
          profile={profile}
          onChangeProfile={onChangeProfile}
          apiKeysInput={apiKeysInput}
          onOpenApiGuide={onOpenApiGuide}
        />
      )}

      {/* Render Sub-Module 1: Plan & Department Plan */}
      {activeSubModule === 'plan_dept' && (
        <div className="space-y-6">
          {/* 1. Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-700/60 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                <span>QUẢN LÝ KẾ HOẠCH & HỒ SƠ SỔ SÁCH SƯ PHẠM</span>
              </span>
              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Chuẩn Thể Thức NĐ 30/2020/NĐ-CP & CV 5512
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> AI Tạo Theo File Mẫu & Tự Động Điền
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Xây Dựng Kế Hoạch & Tạo Mẫu Hồ Sơ, Sổ Sách, Biên Bản Bằng AI
            </h2>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Tạo tự động tất cả các loại <strong>Kế hoạch cá nhân, Kế hoạch tổ chuyên môn, Sổ chủ nhiệm, Biên bản sinh hoạt chuyên môn, Bồi dưỡng HSG, Phụ đạo, Đánh giá tiết dạy</strong> hoặc <strong>nạp file mẫu Word/PDF riêng của đơn vị</strong> để AI tự động phân tích và điền chuẩn xác. Hỗ trợ xem trước bản in A4, AI tinh chỉnh thông minh và xuất Word chuẩn in ấn.
            </p>
          </div>

          {/* Action Button */}
          <div className="shrink-0 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className={`px-5 py-3 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center gap-2 shadow-xl transition-all ${
                isGenerating
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-indigo-900/40 hover:scale-105 active:scale-98 cursor-pointer'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : 'text-amber-300'}`} />
              <span>{isGenerating ? 'ĐANG PHÂN TÍCH VĂN BẢN VÀ SOẠN THẢO...' : '✨ TẠO VĂN BẢN VỚI AI'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Choose Document Template Category */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <label className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>1. Chọn Mẫu Hồ Sơ, Sổ Sách, Kế Hoạch Hoặc Tải File Mẫu Riêng:</span>
          </label>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setTemplateFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                templateFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Tất cả ({DOCUMENT_TEMPLATES.length})
            </button>
            <button
              type="button"
              onClick={() => setTemplateFilter('plan')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                templateFilter === 'plan'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Kế hoạch
            </button>
            <button
              type="button"
              onClick={() => setTemplateFilter('minutes')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                templateFilter === 'minutes'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Biên bản
            </button>
            <button
              type="button"
              onClick={() => setTemplateFilter('evaluation')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                templateFilter === 'evaluation'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Đánh giá & Dự giờ
            </button>
            <button
              type="button"
              onClick={() => setTemplateFilter('custom')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                templateFilter === 'custom'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              📂 Mẫu file riêng
            </button>
          </div>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredTemplates.map((tpl) => {
            const isSelected = selectedTemplateId === tpl.id;
            return (
              <div
                key={tpl.id}
                onClick={() => setSelectedTemplateId(tpl.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  isSelected
                    ? 'bg-indigo-950/70 border-indigo-500 shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xl">{tpl.icon}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        isSelected
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tpl.badge}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 line-clamp-2">
                    {tpl.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {tpl.subtitle}
                  </p>
                </div>

                <div className="text-[10px] text-indigo-300/80 font-medium flex items-center gap-1 border-t border-slate-800/80 pt-2">
                  <span>{isSelected ? '✓ Đang chọn mẫu này' : 'Bấm để chọn mẫu'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Main Config Grid: Form + Document Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Teacher Info & Teaching Targets (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>2. Thông Tin Đơn Vị, Cá Nhân & Chỉ Tiêu Phấn Đấu:</span>
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSection2PreviewOpen(!isSection2PreviewOpen)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isSection2PreviewOpen ? 'Đóng Xem Trước' : '👁️ Xem Trước Bảng Chỉ Tiêu'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Họ và tên Giáo viên / Tổ trưởng:</label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={e => setTeacherName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Trường học:</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={e => setSchoolName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tổ chuyên môn:</label>
                <input
                  type="text"
                  value={departmentName}
                  onChange={e => setDepartmentName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Chức vụ / Nhiệm vụ kiêm nhiệm:</label>
                <input
                  type="text"
                  value={position}
                  onChange={e => setPosition(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Môn học & Khối lớp giảng dạy:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Môn học"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs"
                  />
                  <input
                    type="text"
                    value={grades}
                    onChange={e => setGrades(e.target.value)}
                    placeholder="Khối lớp"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Số tiết dạy & Lớp chủ nhiệm:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    value={teachingPeriodsPerWeek}
                    onChange={e => setTeachingPeriodsPerWeek(e.target.value)}
                    placeholder="Số tiết"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs"
                  />
                  <input
                    type="text"
                    value={homeroomClass}
                    onChange={e => setHomeroomClass(e.target.value)}
                    placeholder="Lớp chủ nhiệm"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Năm học:</label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={e => setAcademicYear(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Danh hiệu thi đua đăng ký:</label>
                <input
                  type="text"
                  value={emulationGoal}
                  onChange={e => setEmulationGoal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold text-xs mb-1">Đề tài Sáng kiến kinh nghiệm (SKKN) / Nghiên cứu đổi mới:</label>
              <input
                type="text"
                value={skknTopic}
                onChange={e => setSkknTopic(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs focus:outline-none focus:border-indigo-400"
              />
            </div>

            {/* Teaching Classes List Management */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-200 font-bold text-xs flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Danh sách lớp phân công & Sĩ số học sinh ({teachingClasses.length} lớp - Tổng: <strong className="text-cyan-300">{totalStudents} HS</strong>):</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddClass}
                  className="px-2 py-1 rounded bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 text-[11px] font-bold flex items-center gap-1 border border-indigo-600/40"
                >
                  <Plus className="w-3 h-3" /> Thêm Lớp Dạy
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {teachingClasses.map((item, idx) => (
                  <div key={item.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl grid grid-cols-12 gap-2 items-center text-xs">
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={item.className}
                        onChange={e => handleUpdateClass(item.id, 'className', e.target.value)}
                        placeholder="Tên lớp"
                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-100 text-xs font-semibold"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={item.studentCount}
                        onChange={e => handleUpdateClass(item.id, 'studentCount', Number(e.target.value))}
                        placeholder="Sĩ số"
                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-cyan-300 font-bold text-xs"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={item.goodPercent}
                        onChange={e => handleUpdateClass(item.id, 'goodPercent', e.target.value)}
                        placeholder="Giỏi %"
                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-emerald-300 text-xs"
                        title="Tỷ lệ Giỏi"
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={item.notes}
                        onChange={e => handleUpdateClass(item.id, 'notes', e.target.value)}
                        placeholder="Ghi chú (chủ nhiệm / chọn...)"
                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-300 text-xs"
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {teachingClasses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveClass(item.id)}
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Targets List */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-200 font-bold text-xs flex items-center gap-1.5">
                  <ListPlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Các chỉ tiêu phấn đấu đặc thù khác ({customTargets.length} chỉ tiêu):</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddCustomTarget}
                  className="px-2 py-1 rounded bg-amber-950/60 hover:bg-amber-900 text-amber-200 text-[11px] font-bold flex items-center gap-1 border border-amber-600/40"
                >
                  <Plus className="w-3 h-3" /> Thêm Chỉ Tiêu
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {customTargets.map((target) => (
                  <div key={target.id} className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex items-center gap-1.5 text-xs">
                    <input
                      type="text"
                      value={target.name}
                      onChange={e => handleUpdateCustomTarget(target.id, 'name', e.target.value)}
                      placeholder="Tên chỉ tiêu"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded p-1 text-slate-200 text-[11px]"
                    />
                    <input
                      type="text"
                      value={target.value}
                      onChange={e => handleUpdateCustomTarget(target.id, 'value', e.target.value)}
                      placeholder="Số lượng"
                      className="w-14 bg-slate-900 border border-slate-700 rounded p-1 text-amber-300 font-bold text-[11px] text-center"
                    />
                    <input
                      type="text"
                      value={target.unit}
                      onChange={e => handleUpdateCustomTarget(target.id, 'unit', e.target.value)}
                      placeholder="Đơn vị"
                      className="w-16 bg-slate-900 border border-slate-700 rounded p-1 text-slate-400 text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomTarget(target.id)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Live Preview Section 2 */}
            {isSection2PreviewOpen && (
              <div className="bg-slate-950 border border-indigo-800/80 rounded-xl p-4 space-y-3 mt-3 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-bold text-xs text-indigo-300 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <span>Xem Trước Bảng Tổng Hợp Chỉ Tiêu & Trợ Lý AI Chỉnh Sửa</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Tổng: {totalStudents} học sinh</span>
                </div>

                {/* AI Assistant for section 2 */}
                <div className="p-2.5 bg-indigo-950/40 border border-indigo-800/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="text-indigo-200 font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>AI Tự Động Điều Chỉnh Chỉ Tiêu Nhanh:</span>
                    </label>
                    <VoiceMicButton
                      onTranscript={t => setSection2AiPrompt(prev => prev ? `${prev} ${t}` : t)}
                      buttonTitle="Nói lệnh điều chỉnh"
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={section2AiPrompt}
                      onChange={e => setSection2AiPrompt(e.target.value)}
                      placeholder="Ví dụ: Tăng chỉ tiêu giỏi lên 50%, thêm lớp 7A3 41 HS, thêm chỉ tiêu 2 bài giảng số..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-100 text-xs"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAiAdjustSection2();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAiAdjustSection2}
                      disabled={isSection2AiAdjusting || !section2AiPrompt.trim()}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold disabled:opacity-50 flex items-center gap-1"
                    >
                      {isSection2AiAdjusting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-amber-300" />}
                      <span>Chạy AI</span>
                    </button>
                  </div>
                </div>

                {/* Live Preview Tables */}
                <div className="space-y-3 text-xs">
                  <div>
                    <h5 className="font-bold text-slate-200 mb-1">Bảng Phân Công Giảng Dạy & Chỉ Tiêu Từng Lớp:</h5>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-slate-700 text-[11px] text-center">
                        <thead className="bg-slate-900 text-slate-200">
                          <tr>
                            <th className="border border-slate-700 p-1.5">Lớp</th>
                            <th className="border border-slate-700 p-1.5">Sĩ Số</th>
                            <th className="border border-slate-700 p-1.5 text-emerald-400">Giỏi / Tốt</th>
                            <th className="border border-slate-700 p-1.5 text-cyan-400">Khá</th>
                            <th className="border border-slate-700 p-1.5 text-amber-400">Đạt</th>
                            <th className="border border-slate-700 p-1.5">Ghi Chú</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teachingClasses.map(c => (
                            <tr key={c.id} className="hover:bg-slate-900/50">
                              <td className="border border-slate-700 p-1.5 font-bold">{c.className}</td>
                              <td className="border border-slate-700 p-1.5 font-bold text-cyan-300">{c.studentCount}</td>
                              <td className="border border-slate-700 p-1.5 text-emerald-300">{c.goodPercent}</td>
                              <td className="border border-slate-700 p-1.5 text-cyan-300">{c.fairPercent}</td>
                              <td className="border border-slate-700 p-1.5 text-amber-300">{c.passPercent}</td>
                              <td className="border border-slate-700 p-1.5 text-slate-400 text-left px-2">{c.notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-200 mb-1">Các Chỉ Tiêu Phấn Đấu Khác:</h5>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      {customTargets.map(t => (
                        <div key={t.id} className="p-2 bg-slate-900 rounded border border-slate-800 flex justify-between">
                          <span>{t.name}:</span>
                          <strong className="text-amber-300">{t.value} {t.unit}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Upload Guidance Documents & Custom Notes (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <FileUp className="w-4 h-4 text-purple-400" />
                <span>3. Nạp Văn Bản Căn Cứ / Công Văn / File Mẫu Riêng:</span>
              </h3>
              {uploadedFilesList.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearDocs}
                  className="text-[11px] text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Xóa tất cả
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              Tải lên các file công văn hướng dẫn của <strong>Bộ, Sở, Phòng, Trường, Tổ</strong> hoặc <strong>tệp file mẫu riêng của đơn vị (.docx, .pdf, scan)</strong> để AI trích xuất nội dung và tích hợp chuẩn xác:
            </p>

            <div className="bg-slate-950 border-2 border-dashed border-purple-800/60 hover:border-purple-500 rounded-xl p-4 text-center space-y-2 transition-all">
              <label className="cursor-pointer block space-y-1">
                <FileUp className="w-6 h-6 text-purple-400 mx-auto" />
                <span className="text-xs font-bold text-purple-300 block">
                  Bấm vào đây để chọn tệp công văn hoặc file mẫu
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Hỗ trợ: Word (.docx, .doc), PDF, TXT, PNG, JPG (Tự động đọc hiểu và phân tích cấu trúc)
                </span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
                  onChange={handleUploadGuidanceFiles}
                  className="hidden"
                />
              </label>
            </div>

            {isReadingFiles && (
              <div className="flex items-center justify-center gap-2 p-2 bg-slate-950 rounded-lg text-xs text-purple-300">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang đọc và phân tích văn bản / file mẫu...</span>
              </div>
            )}

            {/* List of Loaded Guidance Documents */}
            {uploadedFilesList.length > 0 && (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {uploadedFilesList.map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs flex items-center justify-between gap-2"
                  >
                    <div className="overflow-hidden">
                      <p className="font-semibold text-purple-300 truncate" title={doc.name}>
                        📄 {doc.name}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">{doc.snippet}</p>
                    </div>
                    <span className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded font-mono shrink-0">
                      {doc.size}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Custom Special Requirements */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-semibold text-xs flex items-center gap-1">
                  <span>Yêu cầu & Ghi chú bổ sung riêng:</span>
                </label>
                <VoiceMicButton
                  onTranscript={t => setCustomNotes(prev => (prev ? `${prev} ${t}` : t))}
                  buttonTitle="Nói yêu cầu riêng"
                  size="sm"
                />
              </div>
              <textarea
                value={customNotes}
                onChange={e => setCustomNotes(e.target.value)}
                rows={3}
                placeholder="Ví dụ: Bổ sung kế hoạch thi HSG tháng 11, tổ chức 2 chuyên đề STEM, tập trung đổi mới PPDH theo mô hình bài học số..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-400 leading-relaxed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Output Plan / Document Preview, Edit, Refine & Word Export */}
      {generatedPlanMarkdown && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in duration-300">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Văn Bản Đã Được AI Tạo Lập Thành Công ({activeTemplate.title})
                </h3>
                <p className="text-xs text-slate-400">
                  Thầy/Cô có thể xem trước bản in A4, trực tiếp chỉnh sửa, yêu cầu AI tinh chỉnh thông minh hoặc xuất file Word ngay
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Display Mode Switcher */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setPreviewDisplayMode('print')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    previewDisplayMode === 'print'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>📄 Bản in A4 chuẩn</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewDisplayMode('rich')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    previewDisplayMode === 'rich'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>👁️ Trực quan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewDisplayMode('edit')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    previewDisplayMode === 'edit'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>✏️ Chỉnh sửa</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Đã sao chép!' : 'Sao chép'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportWord}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-900/30 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-300" />
                <span>📄 Xuất File Word (.docx) Chuẩn</span>
              </button>
            </div>
          </div>

          {/* AI Interactive Refinement Box */}
          <div className="bg-gradient-to-r from-indigo-950/50 via-slate-950 to-purple-950/50 border border-indigo-800/60 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <label className="font-bold text-indigo-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Trợ Lý AI Tinh Chỉnh & Chỉnh Sửa Văn Bản Thông Minh:</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Ra lệnh bằng văn bản hoặc giọng nói:</span>
                <VoiceMicButton
                  onTranscript={t => setRefinePrompt(prev => prev ? `${prev} ${t}` : t)}
                  buttonTitle="Nói yêu cầu chỉnh sửa"
                  size="sm"
                />
              </div>
            </div>

            {/* Quick 1-Click Refine Prompt Chips */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REFINE_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleRefinePlan(qp)}
                  disabled={isRefining}
                  className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-indigo-900/60 border border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white text-[11px] transition-all cursor-pointer disabled:opacity-50"
                >
                  {qp}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={refinePrompt}
                onChange={e => setRefinePrompt(e.target.value)}
                placeholder="Nhập yêu cầu sửa đổi... Ví dụ: Thêm chi tiết các mốc kiểm tra định kỳ học kỳ 1; Viết chi tiết kế hoạch bồi dưỡng 02 học sinh giỏi..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs focus:outline-none focus:border-indigo-400"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleRefinePlan();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => handleRefinePlan()}
                disabled={isRefining || !refinePrompt.trim()}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-900/40"
              >
                {isRefining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                <span>{isRefining ? 'Đang chỉnh sửa...' : 'Thực hiện'}</span>
              </button>
            </div>
          </div>

          {/* Content Viewer / Editor based on display mode */}
          {previewDisplayMode === 'edit' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>✏️ Chế độ chỉnh sửa Markdown trực tiếp</span>
                <span>{generatedPlanMarkdown.length} ký tự</span>
              </div>
              <textarea
                value={generatedPlanMarkdown}
                onChange={e => setGeneratedPlanMarkdown(e.target.value)}
                rows={24}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-200 font-mono text-xs leading-relaxed focus:outline-none focus:border-indigo-400"
              />
            </div>
          ) : previewDisplayMode === 'print' ? (
            /* A4 Administrative Print Preview View */
            <div className="bg-slate-950 p-4 sm:p-6 rounded-xl border border-slate-800 flex justify-center overflow-x-auto">
              <div className="w-full max-w-4xl bg-white text-black p-8 sm:p-12 shadow-2xl rounded-sm font-serif leading-relaxed text-sm space-y-6">
                {/* Header: National Motto + School Name */}
                <div className="grid grid-cols-12 gap-4 border-b pb-4 text-xs font-semibold">
                  <div className="col-span-5 text-center">
                    <p className="uppercase font-bold">SỞ GD&ĐT (UBND XÃ)</p>
                    <p className="uppercase font-bold text-indigo-900">{schoolName}</p>
                    <p className="font-bold text-slate-800">{departmentName.toUpperCase()}</p>
                    <p className="text-[11px] text-slate-600 mt-1">Số: ...../KH-CM</p>
                  </div>
                  <div className="col-span-7 text-center">
                    <p className="uppercase font-bold tracking-wider">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                    <p className="font-bold">Độc lập - Tự do - Hạnh phúc</p>
                    <div className="w-24 h-0.5 bg-black mx-auto my-1.5" />
                    <p className="italic text-[11px] text-slate-700 mt-1">
                      ..., ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                    </p>
                  </div>
                </div>

                {/* Document Body */}
                <div className="space-y-4 font-sans text-xs sm:text-sm text-slate-900 leading-relaxed whitespace-pre-wrap">
                  {generatedPlanMarkdown}
                </div>

                {/* Signatures */}
                <div className="border-t pt-6 text-xs">
                  <div className="grid grid-cols-3 gap-4 text-center font-semibold">
                    <div>
                      <p className="uppercase font-bold">HIỆU TRƯỞNG PHÊ DUYỆT</p>
                      <p className="italic text-[11px] text-slate-500">*(Ký và đóng dấu)*</p>
                      <div className="h-16" />
                    </div>
                    <div>
                      <p className="uppercase font-bold">TỔ TRƯỞNG CHUYÊN MÔN</p>
                      <p className="italic text-[11px] text-slate-500">*(Ký và ghi rõ họ tên)*</p>
                      <div className="h-16" />
                    </div>
                    <div>
                      <p className="uppercase font-bold">NGƯỜI LẬP KẾ HOẠCH</p>
                      <p className="italic text-[11px] text-slate-500">*(Ký và ghi rõ họ tên)*</p>
                      <div className="h-16 flex items-end justify-center">
                        <p className="font-bold text-slate-900">{teacherName}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Rich Formatted Markdown View */
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 max-h-[650px] overflow-y-auto text-slate-200 text-xs sm:text-sm leading-relaxed space-y-4 whitespace-pre-wrap font-sans">
              {generatedPlanMarkdown}
            </div>
          )}
        </div>
      )}
        </div>
      )}
    </div>
  );
};
