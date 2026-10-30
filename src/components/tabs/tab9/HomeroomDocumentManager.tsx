import React, { useState } from 'react';
import { generateGeminiText } from '../../../lib/geminiApi';
import { exportMarkdownToWord, stripIntroductoryChatter } from '../../../lib/wordExport';
import { readFileAsText, getPdfPageCount } from '../../../lib/fileUtils';
import { ClassProfile } from '../../../types';
import { VoiceMicButton } from '../../VoiceMicButton';
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
  Users,
  User,
  School,
  Award,
  Calendar,
  Briefcase,
  Sliders,
  Eye,
  Loader2,
  Trash2,
  Plus,
  Settings2,
  FileCheck,
  Printer,
  ChevronRight,
  ClipboardList,
  Phone,
  HeartHandshake,
  FileUp,
  Sparkle
} from 'lucide-react';

interface HomeroomDocumentManagerProps {
  profile: ClassProfile;
  onChangeProfile: (p: ClassProfile) => void;
  apiKeysInput: string;
  onOpenApiGuide?: () => void;
}

interface CadreStudent {
  id: string;
  role: string;
  name: string;
  phone?: string;
  notes?: string;
}

interface ParentCommitteeMember {
  id: string;
  role: string;
  name: string;
  studentName: string;
  phone: string;
}

interface HomeroomTemplateOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  badge: string;
  description: string;
  promptObjective: string;
}

const HOMEROOM_TEMPLATES: HomeroomTemplateOption[] = [
  {
    id: 'hr_so_chu_nhiem',
    title: 'Sổ Chủ Nhiệm Lớp Toàn Diện',
    subtitle: 'Năm học & Kế hoạch 10 tháng, theo dõi toàn diện',
    icon: '📘',
    badge: 'Hồ sơ bắt buộc',
    description: 'Sổ quản lý công tác chủ nhiệm gồm sơ đồ lớp, danh sách ban cán sự, chỉ tiêu thi đua, kế hoạch tháng từ tháng 8 đến tháng 5.',
    promptObjective: 'Sổ chủ nhiệm lớp toàn diện gồm đặc điểm tình hình lớp, danh sách ban cán sự, ban đại diện CMHS, chỉ tiêu chất lượng, biện pháp giáo dục nề nếp và lịch trình công tác 10 tháng chi tiết.'
  },
  {
    id: 'hr_ke_hoach_nam',
    title: 'Kế Hoạch Công Tác Chủ Nhiệm Cả Năm',
    subtitle: 'Theo định hướng GDPT 2018 & Xây dựng Lớp học Hạnh phúc',
    icon: '🎯',
    badge: 'Chuẩn GDPT 2018',
    description: 'Bản kế hoạch chi tiết mục tiêu, giải pháp giáo dục đạo đức, nề nếp, văn hóa ứng xử, hoạt động ngoại khóa và xây dựng tập thể lớp vững mạnh.',
    promptObjective: 'Kế hoạch công tác chủ nhiệm cả năm học với các chuyên đề thi đua, chỉ tiêu học tập, rèn luyện hạnh kiểm và giải pháp giáo dục học sinh.'
  },
  {
    id: 'hr_bien_ban_hop_phhs_dau_nam',
    title: 'Biên Bản Họp Phụ Huynh Đầu Năm',
    subtitle: 'Họp phụ huynh đầu năm học & Bầu Ban đại diện CMHS',
    icon: '👨‍👩‍👧‍👦',
    badge: 'Nghị định 30',
    description: 'Biên bản cuộc họp PHHS đầu năm: Báo cáo phương hướng, thông qua nội quy, dự thảo kế hoạch phối hợp và bầu Ban đại diện CMHS lớp.',
    promptObjective: 'Biên bản cuộc họp cha mẹ học sinh đầu năm học đầy đủ thành phần, nội dung triển khai, các ý kiến thảo luận, biểu quyết chỉ tiêu và bầu ban đại diện CMHS.'
  },
  {
    id: 'hr_bien_ban_hop_phhs_hoc_ky',
    title: 'Biên Bản Họp Phụ Huynh Sơ Kết HK1 / Tổng Kết Năm',
    subtitle: 'Báo cáo kết quả học tập, rèn luyện & Khen thưởng',
    icon: '🏆',
    badge: 'Sơ kết - Tổng kết',
    description: 'Biên bản họp PHHS sơ kết HK1 hoặc tổng kết năm học: Báo cáo số liệu điểm số, xếp loại rèn luyện, tuyên dương HS tiêu biểu và phương hướng tiếp theo.',
    promptObjective: 'Biên bản họp cha mẹ học sinh sơ kết học kỳ/tổng kết năm học gồm bảng thống kê chất lượng học tập, rèn luyện nề nếp, tuyên dương khen thưởng và cam kết phối hợp.'
  },
  {
    id: 'hr_bien_ban_sinh_hoat_lop',
    title: 'Biên Bản Sinh Hoạt Lớp Hàng Tuần',
    subtitle: 'Đánh giá thi đua tuần, nhận xét tổ & Kế hoạch tuần tới',
    icon: '📝',
    badge: 'Sinh hoạt tuần',
    description: 'Biên bản sinh hoạt lớp cuối tuần: Lớp trưởng, các tổ trưởng báo cáo điểm thi đua, GVCN nhận xét, tuyên dương, xử lý vi phạm và phát động tuần mới.',
    promptObjective: 'Biên bản tiết sinh hoạt lớp cuối tuần chuẩn mực gồm báo cáo của Ban cán sự lớp, 4 tổ trưởng, nhận xét của GVCN và kế hoạch tuần học tiếp theo.'
  },
  {
    id: 'hr_phieu_lien_lac_phhs',
    title: 'Phiếu Liên Lạc / Báo Cáo Học Tập & Nề Nếp Gửi PHHS',
    subtitle: 'Mẫu thông báo kết quả định kỳ gửi từng Phụ huynh',
    icon: '✉️',
    badge: 'Gửi PHHS',
    description: 'Mẫu phiếu thông tin học tập, chuyên cần, ý thức kỷ luật, nhận xét chi tiết của GVCN và phần phản hồi, ký nhận của gia đình.',
    promptObjective: 'Phiếu báo kết quả học tập và rèn luyện gửi cha mẹ học sinh với đầy đủ các mục điểm số, thái độ học tập, lời nhận xét chân thành của GVCN và phần đóng góp ý kiến của phụ huynh.'
  },
  {
    id: 'hr_ho_so_hs_ca_biet',
    title: 'Hồ Sơ & Kế Hoạch Giúp Đỡ Học Sinh Cần Quan Tâm Đặc Biệt',
    subtitle: 'Học sinh chưa ngoan, học sinh có hoàn cảnh khó khăn / cá biệt',
    icon: '🤝',
    badge: 'Tư vấn học đường',
    description: 'Kế hoạch theo dõi, phối hợp gia đình, biện pháp kèm cặp, uốn nắn hành vi và nhật ký tiến bộ của học sinh cần hỗ trợ đặc biệt.',
    promptObjective: 'Kế hoạch và hồ sơ theo dõi, giáo dục học sinh chưa ngoan / học sinh cá biệt / học sinh có hoàn cảnh khó khăn với các biện pháp sư phạm tích cực, lịch tiếp xúc phụ huynh và nhật ký theo dõi tiến bộ.'
  },
  {
    id: 'hr_so_yeu_ly_lich_lop',
    title: 'Sơ Yếu Lý Lịch & Danh Sách Trích Ngang Học Sinh',
    subtitle: 'Bảng tổng hợp thông tin cá nhân, PHHS & Hoàn cảnh gia đình',
    icon: '📑',
    badge: 'Quản lý học sinh',
    description: 'Bảng danh sách trích ngang học sinh lớp: Ngày sinh, giới tính, địa chỉ, họ tên cha/mẹ, số điện thoại liên lạc, hoàn cảnh đặc biệt, năng khiếu.',
    promptObjective: 'Bảng sơ yếu lý lịch và danh sách trích ngang học sinh lớp với đầy đủ các cột thông tin liên hệ cha mẹ, địa chỉ, diện chính sách và ghi chú năng khiếu.'
  },
  {
    id: 'hr_ke_hoach_hoat_dong_trai_nghiem',
    title: 'Kế Hoạch Hoạt Động Trải Nghiệm & Ngoại Khóa Lớp',
    subtitle: 'Chủ đề sinh hoạt ngoại khóa, ngày hội, thiện nguyện',
    icon: '🌟',
    badge: 'Hoạt động TNST',
    description: 'Kế hoạch tổ chức chuyên đề Hoạt động trải nghiệm hướng nghiệp cho lớp: Mục tiêu, phân công nhiệm vụ, kịch bản chương trình và dự trù kinh phí.',
    promptObjective: 'Kế hoạch tổ chức hoạt động trải nghiệm - hướng nghiệp và sinh hoạt tập thể cho lớp theo chủ đề tháng với kịch bản chi tiết và phân công học sinh.'
  },
  {
    id: 'hr_custom_upload',
    title: '📂 Tạo Theo File Mẫu Đơn Vị Tải Lên (Word/PDF/Excel)',
    subtitle: 'AI đọc file mẫu của trường và điền tự động dữ liệu lớp',
    icon: '📤',
    badge: 'Mẫu riêng đơn vị',
    description: 'Tải lên tệp mẫu Word (.docx), PDF hoặc Excel của nhà trường để AI tự động phân tích cấu trúc bảng biểu và sinh văn bản chuẩn 100% mẫu.',
    promptObjective: 'Tạo văn bản hồ sơ chủ nhiệm bám sát 100% cấu trúc, đề mục, bảng biểu và văn phong của tệp mẫu đơn vị đã tải lên.'
  }
];

export const HomeroomDocumentManager: React.FC<HomeroomDocumentManagerProps> = ({
  profile,
  onChangeProfile,
  apiKeysInput,
  onOpenApiGuide
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('hr_so_chu_nhiem');
  const [activeViewMode, setActiveViewMode] = useState<'preview' | 'rich' | 'edit'>('preview');

  // School & Class Basic Settings
  const [schoolName, setSchoolName] = useState<string>(profile.schoolName || 'Trường THCS Phùng Khắc Khoan');
  const [className, setClassName] = useState<string>(profile.lop || '9A1');
  const [teacherName, setTeacherName] = useState<string>(profile.teacherSigner || 'Thầy Cấn Văn Trường');
  const [teacherPhone, setTeacherPhone] = useState<string>('0988.302.636');
  const [schoolYear, setSchoolYear] = useState<string>('2025 - 2026');
  const [totalStudents, setTotalStudents] = useState<number>(38);
  const [maleStudents, setMaleStudents] = useState<number>(20);
  const [femaleStudents, setFemaleStudents] = useState<number>(18);
  const [policyStudents, setPolicyStudents] = useState<string>('02 học sinh con thương binh, 01 học sinh hộ nghèo');

  // Targets & Goals
  const [targetGoodPercent, setTargetGoodPercent] = useState<string>('45%');
  const [targetFairPercent, setTargetFairPercent] = useState<string>('48%');
  const [targetPassPercent, setTargetPassPercent] = useState<string>('7%');
  const [targetConductGood, setTargetConductGood] = useState<string>('95%');
  const [targetClassTitle, setTargetClassTitle] = useState<string>('Tập thể Lớp Tiên tiến Xuất sắc');

  // Class Cadres (Ban Cán Sự Lớp)
  const [cadres, setCadres] = useState<CadreStudent[]>([
    { id: '1', role: 'Lớp trưởng', name: 'Nguyễn Minh Quân', phone: '0912.345.678', notes: 'Bao quát chung, điều hành nề nếp' },
    { id: '2', role: 'Lớp phó Học tập', name: 'Trần Phương Linh', phone: '0987.654.321', notes: 'Theo dõi bài tập, truy bài đầu giờ' },
    { id: '3', role: 'Lớp phó Lao động - Kỷ luật', name: 'Phạm Đức Anh', phone: '', notes: 'Vệ sinh phòng học, kiểm tra trang phục' },
    { id: '4', role: 'Lớp phó Văn thể mỹ', name: 'Lê Thu Hà', phone: '', notes: 'Văn nghệ, phong trào Đoàn Đội' },
    { id: '5', role: 'Tổ trưởng Tổ 1', name: 'Hoàng Quốc Bảo', phone: '', notes: 'Theo dõi 9 thành viên Tổ 1' },
    { id: '6', role: 'Tổ trưởng Tổ 2', name: 'Đặng Mai Phương', phone: '', notes: 'Theo dõi 10 thành viên Tổ 2' },
    { id: '7', role: 'Tổ trưởng Tổ 3', name: 'Bùi Gia Huy', phone: '', notes: 'Theo dõi 9 thành viên Tổ 3' },
    { id: '8', role: 'Tổ trưởng Tổ 4', name: 'Vũ Thùy Chi', phone: '', notes: 'Theo dõi 10 thành viên Tổ 4' }
  ]);

  // Parents Committee (Ban Đại Diện CMHS)
  const [parentCommittee, setParentCommittee] = useState<ParentCommitteeMember[]>([
    { id: '1', role: 'Trưởng ban Đại diện', name: 'Ông Nguyễn Văn Thành', studentName: 'PH em Nguyễn Minh Quân', phone: '0903.112.233' },
    { id: '2', role: 'Phó ban Đại diện', name: 'Bà Trần Thị Bích Thủy', studentName: 'PH em Trần Phương Linh', phone: '0913.445.566' },
    { id: '3', role: 'Ủy viên Ban Đại diện', name: 'Ông Lê Văn Dũng', studentName: 'PH em Lê Thu Hà', phone: '0982.778.899' }
  ]);

  // Specific Notes & Special Requirements
  const [homeroomFocusNotes, setHomeroomFocusNotes] = useState<string>(
    '- Xây dựng mô hình "Đôi bạn cùng tiến" và "Nhóm học tập tương trợ".\n- Đẩy mạnh ứng dụng CNTT và nhóm Zalo lớp thông tin đa chiều với PHHS.\n- Chú trọng giáo dục kỹ năng sống, phòng chống bạo lực học đường và an toàn không gian mạng.'
  );

  // Uploaded template file
  const [uploadedTemplateFile, setUploadedTemplateFile] = useState<File | null>(null);
  const [uploadedTemplateText, setUploadedTemplateText] = useState<string>('');
  const [isReadingUploadedFile, setIsReadingUploadedFile] = useState<boolean>(false);

  // AI Output Content
  const [generatedDocContent, setGeneratedDocContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [aiRefinePrompt, setAiRefinePrompt] = useState<string>('');
  const [isRefining, setIsRefining] = useState<boolean>(false);

  // Handle uploaded template file
  const handleUploadTemplate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedTemplateFile(file);
    setIsReadingUploadedFile(true);
    try {
      const text = await readFileAsText(file, { fullScan: true, apiKeys: apiKeysInput });
      setUploadedTemplateText(text);
      setSelectedTemplateId('hr_custom_upload');
    } catch (err: any) {
      alert(`Lỗi đọc file mẫu: ${err?.message || String(err)}`);
    } finally {
      setIsReadingUploadedFile(false);
    }
  };

  // Cadre handlers
  const handleAddCadre = () => {
    setCadres(prev => [
      ...prev,
      { id: Date.now().toString(), role: 'Cán sự bổ sung', name: '', notes: '' }
    ]);
  };

  const handleUpdateCadre = (id: string, field: keyof CadreStudent, val: string) => {
    setCadres(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));
  };

  const handleDeleteCadre = (id: string) => {
    setCadres(prev => prev.filter(c => c.id !== id));
  };

  // Parent committee handlers
  const handleAddParent = () => {
    setParentCommittee(prev => [
      ...prev,
      { id: Date.now().toString(), role: 'Ủy viên', name: '', studentName: '', phone: '' }
    ]);
  };

  const handleUpdateParent = (id: string, field: keyof ParentCommitteeMember, val: string) => {
    setParentCommittee(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  const handleDeleteParent = (id: string) => {
    setParentCommittee(prev => prev.filter(p => p.id !== id));
  };

  // Generate Document with AI
  const handleGenerateDocument = async () => {
    const apiKeys = apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);
    const selectedTemplate = HOMEROOM_TEMPLATES.find(t => t.id === selectedTemplateId) || HOMEROOM_TEMPLATES[0];

    setIsGenerating(true);

    const cadresSummary = cadres.map(c => `- **${c.role}**: ${c.name || '...'} ${c.phone ? `(SĐT: ${c.phone})` : ''} - *${c.notes || ''}*`).join('\n');
    const parentsSummary = parentCommittee.map(p => `- **${p.role}**: ${p.name || '...'} (${p.studentName || ''}) - SĐT: ${p.phone || '...'}`).join('\n');

    let templateContext = '';
    if (selectedTemplateId === 'hr_custom_upload' && uploadedTemplateText) {
      templateContext = `
=== NỘI DUNG TỆP MẪU DO ĐƠN VỊ TẢI LÊN (BẮT BUỘC BÁM SÁT 100% CẤU TRÚC, BIỂU MẪU VÀ ĐỀ MỤC): ===
${uploadedTemplateText.slice(0, 50000)}
=== HẾT NỘI DUNG TỆP MẪU ===`;
    }

    const prompt = `Bạn là Chuyên gia Quản lý Giáo dục và Giáo viên Chủ nhiệm xuất sắc cấp Quốc gia theo Chương trình GDPT 2018.
Nhiệm vụ của bạn là soạn thảo một bộ hồ sơ / văn bản chủ nhiệm hoàn chỉnh, chi tiết, chuyên nghiệp, thể thức văn bản hành chính chuẩn Nghị định 30/2020/NĐ-CP của Chính phủ.

LOẠI VĂN BẢN CẦN SOẠN: "${selectedTemplate.title.toUpperCase()}"
MỤC TIÊU CỐT LÕI: ${selectedTemplate.promptObjective}

=== THÔNG TIN ĐƠN VỊ VÀ LỚP CHỦ NHIỆM: ===
- Đơn vị: ${schoolName.toUpperCase()}
- Lớp chủ nhiệm: ${className}
- Giáo viên chủ nhiệm: ${teacherName} (SĐT/Zalo: ${teacherPhone})
- Năm học: ${schoolYear}
- Sĩ số lớp: ${totalStudents} học sinh (Nam: ${maleStudents}, Nữ: ${femaleStudents})
- Đối tượng chính sách / đặc thù: ${policyStudents}
- Danh hiệu phấn đấu: ${targetClassTitle}
- Chỉ tiêu học tập: Học lực Tốt/Giỏi: ${targetGoodPercent} | Khá: ${targetFairPercent} | Đạt: ${targetPassPercent}
- Chỉ tiêu rèn luyện / Hạnh kiểm: Tốt: ${targetConductGood} | Không có học sinh Chưa đạt
- Đặc điểm trọng tâm & giải pháp giáo dục:
${homeroomFocusNotes}

=== DANH SÁCH BAN CÁN SỰ LỚP: ===
${cadresSummary}

=== DANH SÁCH BAN ĐẠI DIỆN CHA MẸ HỌC SINH: ===
${parentsSummary}

${templateContext}

=== YÊU CẦU ĐỊNH DẠNG & THỂ THỨC BẮT BUỘC (NGHỊ ĐỊNH 30/2020/NĐ-CP): ===
1. MỞ ĐẦU VĂN BẢN:
   - Quốc hiệu tiêu ngữ và Tên trường được đặt trong Bảng 2 cột không viền:
     | **TRƯỜNG THCS ${schoolName.replace(/Trường\s+THCS\s*/i, '').toUpperCase()}**<br/>**LỚP: ${className}** | **CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM**<br/>**Độc lập - Tự do - Hạnh phúc** |
   - Tiêu đề chính viết IN HOA IN ĐẬM, căn giữa: # ${selectedTemplate.title.toUpperCase()}
   - Năm học: *Năm học ${schoolYear}*

2. NỘI DUNG VĂN BẢN:
   - Trình bày đầy đủ, chi tiết, KHÔNG viết tắt, KHÔNG tóm tắt sơ sài bằng "...", KHÔNG bỏ lửng.
   - Kẻ bảng biểu Markdown Markdown chuẩn (| ... | ... |) cho các bảng danh sách Ban cán sự, Ban đại diện CMHS, Bảng chỉ tiêu số liệu, và Bảng kế hoạch chi tiết từng tháng (từ tháng 8 đến tháng 5).
   - Ngôn phong sư phạm mực thước, mang tính giáo dục, xây dựng môi trường học đường hạnh phúc, thân thiện, kỷ cương.

3. KẾT THÚC VĂN BẢN - KHUNG CHỮ KÝ DUYỆT 3 BÊN:
   - Đặt ở cuối văn bản bằng bảng Markdown không viền:
   | **BAN ĐẠI DIỆN CMHS** | **HIỆU TRƯỞNG DUYỆT** | **GIÁO VIÊN CHỦ NHIỆM** |
   |:---:|:---:|:---:|
   | *(Ký và ghi rõ họ tên)* | *(Ký, đóng dấu)* | *(Ký và ghi rõ họ tên)* |
   | <br/><br/><br/>**${parentCommittee[0]?.name || 'Trưởng ban CMHS'}** | <br/><br/><br/>**Hiệu trưởng** | <br/><br/><br/>**${teacherName}** |

Hãy bắt đầu soạn thảo ngay với đầy đủ nội dung chi tiết nhất!`;

    try {
      const result = await generateGeminiText({
        prompt,
        apiKeys,
        maxOutputTokens: 16384
      });
      if (result) {
        setGeneratedDocContent(stripIntroductoryChatter(result));
      } else {
        alert('Không nhận được phản hồi từ AI. Vui lòng kiểm tra API Key.');
      }
    } catch (err: any) {
      alert(`Lỗi AI: ${err?.message || String(err)}`);
      if (err?.message?.includes('429') || err?.message?.includes('quota')) {
        onOpenApiGuide?.();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // AI Refinement handler
  const handleAIRefine = async (command: string) => {
    if (!generatedDocContent.trim()) {
      alert('Chưa có nội dung văn bản để chỉnh sửa! Vui lòng bấm "Soạn Hồ Sơ Bằng AI" trước.');
      return;
    }
    const apiKeys = apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);
    setIsRefining(true);

    const prompt = `Bạn là Trợ lý AI Chỉnh Sửa Hồ Sơ Giáo Viên Chủ Nhiệm.
Dưới đây là văn bản hồ sơ chủ nhiệm hiện tại:

=== VĂN BẢN HIỆN TẠI ===
${generatedDocContent}
=== HẾT VĂN BẢN HIỆN TẠI ===

YÊU CẦU CHỈNH SỬA TỪ GIÁO VIÊN:
"${command}"

HƯỚNG DẪN THỰC HIỆN:
1. Áp dụng chính xác yêu cầu chỉnh sửa trên vào văn bản.
2. Giữ nguyên định dạng Markdown chuẩn, các bảng biểu, Quốc hiệu tiêu ngữ và Khung chữ ký duyệt cuối văn bản.
3. Xuất ra toàn bộ văn bản hoàn chỉnh sau khi đã sửa, không thêm lời chào hay giải thích ngoài lề.`;

    try {
      const result = await generateGeminiText({
        prompt,
        apiKeys,
        maxOutputTokens: 16384
      });
      if (result) {
        setGeneratedDocContent(stripIntroductoryChatter(result));
        setAiRefinePrompt('');
      }
    } catch (err: any) {
      alert(`Lỗi AI chỉnh sửa: ${err?.message || String(err)}`);
    } finally {
      setIsRefining(false);
    }
  };

  // Export Word
  const handleExportWord = async () => {
    if (!generatedDocContent.trim()) {
      alert('Chưa có nội dung để xuất file Word!');
      return;
    }
    const template = HOMEROOM_TEMPLATES.find(t => t.id === selectedTemplateId);
    const fileName = `${template?.title || 'Ho_So_Chu_Nhiem'}_Lop_${className}_${schoolYear.replace(/\s+/g, '')}.docx`;

    try {
      await exportMarkdownToWord(generatedDocContent, {
        fileName,
        headerText: `${schoolName} - Lớp ${className}`,
        footerText: `GVCN: ${teacherName} - Năm học ${schoolYear}`,
        schoolName,
        teacherName,
        lop: className,
        namHoc: schoolYear,
        showPageNumbers: true
      });
    } catch (err: any) {
      alert(`Lỗi xuất file Word: ${err?.message || String(err)}`);
    }
  };

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(generatedDocContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-teal-900/60 via-emerald-900/40 to-cyan-950/60 border border-teal-500/40 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-teal-500/20 border border-teal-400/40 rounded-xl text-teal-300 shadow-inner">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Hồ Sơ Giáo Viên Chủ Nhiệm & Mẫu Sổ Sách Chuẩn
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/20 border border-teal-400/50 text-teal-200">
                  Nghị định 30 & GDPT 2018
                </span>
              </div>
              <p className="text-xs sm:text-sm text-teal-100/80 mt-0.5">
                Tạo nhanh Sổ chủ nhiệm, Kế hoạch năm, Biên bản họp PHHS, Phiếu liên lạc, Biên bản sinh hoạt lớp, Hồ sơ HS cá biệt & Tải file mẫu trường lên
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-teal-200 border border-teal-500/40 cursor-pointer transition-all shadow-sm">
              <Upload className="w-4 h-4 text-teal-400" />
              <span>{uploadedTemplateFile ? `Mẫu: ${uploadedTemplateFile.name.slice(0, 15)}...` : '📂 Nạp File Mẫu Riêng (Word/PDF)'}</span>
              <input
                type="file"
                accept=".docx,.doc,.pdf,.xlsx,.txt"
                onChange={handleUploadTemplate}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Main Grid: Settings & Templates Column (Left) vs Output Column (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Templates & Class Settings (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Section 1: Template Selection Grid */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                1. Chọn Loại Hồ Sơ Chủ Nhiệm Cần Tạo
              </h3>
              <span className="text-[11px] text-teal-400 font-medium">10 Biểu Mẫu</span>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
              {HOMEROOM_TEMPLATES.map((tmpl) => {
                const isSelected = selectedTemplateId === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedTemplateId(tmpl.id)}
                    className={`flex items-start gap-3 p-2.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-teal-950/80 border-teal-400 shadow-md shadow-teal-900/30'
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-xl p-1.5 rounded-lg bg-slate-900/80 shrink-0 border border-slate-700">
                      {tmpl.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-teal-300' : 'text-slate-200'}`}>
                          {tmpl.title}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-teal-400 font-semibold shrink-0">
                          {tmpl.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {tmpl.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {uploadedTemplateText && (
              <div className="p-2.5 rounded-xl bg-teal-950/60 border border-teal-500/40 text-[11px] text-teal-200 flex items-center justify-between">
                <span className="truncate">✅ Đã nạp mẫu: <strong>{uploadedTemplateFile?.name}</strong></span>
                <button
                  onClick={() => {
                    setUploadedTemplateFile(null);
                    setUploadedTemplateText('');
                    setSelectedTemplateId('hr_so_chu_nhiem');
                  }}
                  className="text-rose-400 hover:text-rose-300 text-xs font-bold"
                >
                  Xóa
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Class & Teacher Info Form */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2 pb-2 border-b border-slate-800">
              <School className="w-4 h-4 text-cyan-400" />
              2. Thông Tin Lớp Chủ Nhiệm & Chỉ Tiêu
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Tên Trường</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={e => setSchoolName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Lớp Chủ Nhiệm</label>
                <input
                  type="text"
                  value={className}
                  onChange={e => setClassName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Họ Tên GVCN</label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={e => setTeacherName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Số ĐT / Zalo GVCN</label>
                <input
                  type="text"
                  value={teacherPhone}
                  onChange={e => setTeacherPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Năm Học</label>
                <input
                  type="text"
                  value={schoolYear}
                  onChange={e => setSchoolYear(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Sĩ Số (Tổng / Nam / Nữ)</label>
                <div className="grid grid-cols-3 gap-1">
                  <input
                    type="number"
                    value={totalStudents}
                    onChange={e => setTotalStudents(parseInt(e.target.value) || 0)}
                    placeholder="Tổng"
                    className="px-1.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs text-white text-center"
                  />
                  <input
                    type="number"
                    value={maleStudents}
                    onChange={e => setMaleStudents(parseInt(e.target.value) || 0)}
                    placeholder="Nam"
                    className="px-1.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs text-white text-center"
                  />
                  <input
                    type="number"
                    value={femaleStudents}
                    onChange={e => setFemaleStudents(parseInt(e.target.value) || 0)}
                    placeholder="Nữ"
                    className="px-1.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs text-white text-center"
                  />
                </div>
              </div>
            </div>

            {/* Targets Row */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
              <label className="text-[11px] font-bold text-teal-300 flex items-center justify-between">
                <span>🎯 Chỉ Tiêu Phấn Đấu Của Lớp:</span>
                <span className="text-[10px] text-slate-400">Học lực & Hạnh kiểm</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block">Tốt/Giỏi</span>
                  <input
                    type="text"
                    value={targetGoodPercent}
                    onChange={e => setTargetGoodPercent(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-emerald-400 font-bold text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Khá</span>
                  <input
                    type="text"
                    value={targetFairPercent}
                    onChange={e => setTargetFairPercent(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-sky-400 font-bold text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Đạt</span>
                  <input
                    type="text"
                    value={targetPassPercent}
                    onChange={e => setTargetPassPercent(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-amber-400 font-bold text-center"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">HK Tốt</span>
                  <input
                    type="text"
                    value={targetConductGood}
                    onChange={e => setTargetConductGood(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-teal-400 font-bold text-center"
                  />
                </div>
              </div>
            </div>

            {/* Special Policy Students */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Học Sinh Diện Chính Sách / Hoàn Cảnh Khó Khăn
              </label>
              <input
                type="text"
                value={policyStudents}
                onChange={e => setPolicyStudents(e.target.value)}
                placeholder="VD: 02 HS con thương binh, 01 HS hộ nghèo, 01 HS mồ côi..."
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:border-teal-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 3: Class Cadres & Parents Committee Accordion */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                3. Ban Cán Sự Lớp & Ban Đại Diện CMHS
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddCadre}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-500/40 hover:bg-teal-900"
                >
                  + Cán Sự
                </button>
                <button
                  onClick={handleAddParent}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900"
                >
                  + PHHS
                </button>
              </div>
            </div>

            {/* Cadres mini list */}
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                ⭐ Ban Cán Sự Lớp ({cadres.length} em)
              </span>
              {cadres.map((cadre) => (
                <div key={cadre.id} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
                  <input
                    type="text"
                    value={cadre.role}
                    onChange={e => handleUpdateCadre(cadre.id, 'role', e.target.value)}
                    className="w-28 px-1.5 py-0.5 rounded bg-slate-900 text-[11px] text-teal-300 font-bold border border-slate-700"
                  />
                  <input
                    type="text"
                    value={cadre.name}
                    onChange={e => handleUpdateCadre(cadre.id, 'name', e.target.value)}
                    placeholder="Họ và tên..."
                    className="flex-1 px-1.5 py-0.5 rounded bg-slate-900 text-[11px] text-white border border-slate-700"
                  />
                  <button
                    onClick={() => handleDeleteCadre(cadre.id)}
                    className="text-rose-400 hover:text-rose-300 p-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Focus notes */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Ghi Chú Trọng Tâm & Giải Pháp Giáo Dục Riêng Của Lớp
              </label>
              <textarea
                rows={2}
                value={homeroomFocusNotes}
                onChange={e => setHomeroomFocusNotes(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:border-teal-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Action: Generate Button */}
          <button
            onClick={handleGenerateDocument}
            disabled={isGenerating}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm text-white shadow-xl transition-all flex items-center justify-center gap-2.5 ${
              isGenerating
                ? 'bg-slate-700 cursor-not-allowed text-slate-300'
                : 'bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 shadow-teal-900/50 hover:scale-[1.01]'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>AI Đang Soạn Thảo Hồ Sơ Chủ Nhiệm...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>SOẠN HỒ SƠ CHỦ NHIỆM BẰNG AI</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Preview & Output Document (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Top Bar: View Mode Switch & Export Buttons */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setActiveViewMode('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeViewMode === 'preview'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Bản In A4</span>
              </button>
              <button
                onClick={() => setActiveViewMode('rich')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeViewMode === 'rich'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Thẻ Trực Quan</span>
              </button>
              <button
                onClick={() => setActiveViewMode('edit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeViewMode === 'edit'
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Chỉnh Sửa</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!generatedDocContent}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Đã Chép' : 'Sao Chép'}</span>
              </button>

              <button
                onClick={handleExportWord}
                disabled={!generatedDocContent}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-900/30 flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-white" />
                <span>Xuất File Word (.docx)</span>
              </button>
            </div>
          </div>

          {/* AI Refine Quick Bar */}
          {generatedDocContent && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-900 via-teal-950/50 to-slate-900 border border-teal-500/30 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-teal-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Trợ Lý AI Tinh Chỉnh Hồ Sơ 1-Chạm
                </span>
                <span className="text-[10px] text-slate-400">Nhập lệnh hoặc dùng Mic</span>
              </div>

              {/* Quick Prompt Badges */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Bổ sung chi tiết kế hoạch 10 tháng',
                  'Kẻ bảng theo dõi nề nếp theo tuần',
                  'Bổ sung giải pháp giúp đỡ 2 HS cá biệt',
                  'Thêm tiêu chí thi đua Lớp học Hạnh phúc',
                  'Chi tiết hóa biên bản họp PHHS đầu năm'
                ].map((quick, qIdx) => (
                  <button
                    key={qIdx}
                    onClick={() => handleAIRefine(quick)}
                    disabled={isRefining}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 hover:bg-teal-950 text-teal-200 border border-slate-700/80 hover:border-teal-400 transition-all"
                  >
                    ✨ {quick}
                  </button>
                ))}
              </div>

              {/* Custom Command Box */}
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={aiRefinePrompt}
                  onChange={e => setAiRefinePrompt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && aiRefinePrompt.trim() && handleAIRefine(aiRefinePrompt)}
                  placeholder="Yêu cầu AI sửa đổi (VD: 'Thêm mục dự toán quỹ hội CMHS', 'Bổ sung kế hoạch hoạt động 20/11')..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-xs text-white focus:border-teal-400 focus:outline-none"
                />
                <VoiceMicButton
                  onTranscript={t => setAiRefinePrompt(prev => prev ? `${prev} ${t}` : t)}
                  disabled={isRefining}
                />
                <button
                  onClick={() => aiRefinePrompt.trim() && handleAIRefine(aiRefinePrompt)}
                  disabled={isRefining || !aiRefinePrompt.trim()}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shrink-0 disabled:opacity-50"
                >
                  {isRefining ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gửi Lệnh'}
                </button>
              </div>
            </div>
          )}

          {/* Main Document Content Container */}
          <div className="p-4 sm:p-6 rounded-2xl bg-white text-slate-900 border border-slate-300 shadow-2xl min-h-[550px] max-h-[750px] overflow-y-auto">
            {generatedDocContent ? (
              activeViewMode === 'edit' ? (
                <textarea
                  rows={25}
                  value={generatedDocContent}
                  onChange={e => setGeneratedDocContent(e.target.value)}
                  className="w-full p-4 font-mono text-xs leading-relaxed bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              ) : activeViewMode === 'rich' ? (
                <div className="space-y-4 text-slate-800 font-sans">
                  {generatedDocContent.split('\n\n').map((para, pIdx) => {
                    if (para.startsWith('# ')) {
                      return (
                        <h1 key={pIdx} className="text-xl sm:text-2xl font-black text-teal-900 text-center uppercase border-b-2 border-teal-700 pb-2">
                          {para.replace('# ', '')}
                        </h1>
                      );
                    }
                    if (para.startsWith('## ')) {
                      return (
                        <h2 key={pIdx} className="text-lg font-bold text-slate-900 mt-4 border-l-4 border-teal-600 pl-2">
                          {para.replace('## ', '')}
                        </h2>
                      );
                    }
                    if (para.startsWith('|')) {
                      return (
                        <div key={pIdx} className="overflow-x-auto my-3">
                          <table className="min-w-full text-xs border border-slate-300">
                            <tbody>
                              {para.split('\n').map((row, rIdx) => {
                                if (row.includes('---')) return null;
                                const cols = row.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
                                return (
                                  <tr key={rIdx} className={rIdx === 0 ? 'bg-teal-50 font-bold' : 'border-t border-slate-200'}>
                                    {cols.map((col, cIdx) => (
                                      <td key={cIdx} className="p-2 border border-slate-300">
                                        {col.trim()}
                                      </td>
                                    ))}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    }
                    return (
                      <p key={pIdx} className="text-xs sm:text-sm leading-relaxed text-slate-800">
                        {para}
                      </p>
                    );
                  })}
                </div>
              ) : (
                /* Print A4 Layout Mode */
                <div className="space-y-4 text-slate-900 font-serif leading-relaxed text-xs sm:text-sm print:m-0">
                  <div className="grid grid-cols-2 text-center text-xs font-bold pb-4 border-b border-slate-300">
                    <div>
                      <p className="uppercase">{schoolName}</p>
                      <p className="text-teal-800">LỚP: {className}</p>
                      <p className="text-[10px] text-slate-500 font-normal">Năm học: {schoolYear}</p>
                    </div>
                    <div>
                      <p className="uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                      <p className="underline decoration-slate-400">Độc lập - Tự do - Hạnh phúc</p>
                      <p className="text-[10px] text-slate-500 italic mt-1">Hà Nội, ngày ... tháng ... năm 202...</p>
                    </div>
                  </div>

                  <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed">
                    {generatedDocContent}
                  </div>
                </div>
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center text-slate-400 space-y-3">
                <div className="p-4 rounded-full bg-slate-100 border border-slate-200 text-teal-600">
                  <FileText className="w-10 h-10" />
                </div>
                <h4 className="text-sm font-bold text-slate-600">Chưa Có Nội Dung Hồ Sơ Chủ Nhiệm</h4>
                <p className="text-xs max-w-md text-slate-500">
                  Hãy chọn loại biểu mẫu ở cột bên trái, điều chỉnh thông tin lớp và bấm <strong>"SOẠN HỒ SƠ CHỦ NHIỆM BẰNG AI"</strong>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
