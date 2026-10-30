import React, { useState } from 'react';
import { ClassProfile } from '../../types';
import { generateGeminiText } from '../../lib/geminiApi';
import { exportMarkdownToWord, stripIntroductoryChatter } from '../../lib/wordExport';
import { readFileAsText } from '../../lib/fileUtils';
import { TEXTBOOK_LIST } from '../../data/defaults';
import {
  MATH_7_KNTT_35WEEKS_140PERIODS,
  generateMath35WeeksMarkdownTable,
  generateCV5512Appendix1Doc,
  generateCV5512Appendix2Doc,
  generateCV5512Appendix3Doc
} from '../../data/mathCurriculumPresets';
import {
  PRIMARY_VIETNAMESE_1_35WEEKS,
  PRIMARY_MATH_2_35WEEKS,
  generatePrimary35WeeksMarkdownTable,
  generatePrimaryAppendix1Doc,
  generatePrimaryAppendix2Doc,
  generatePrimaryAppendix3Doc
} from '../../data/primaryCurriculumPresets';
import {
  Layers,
  Sparkles,
  Download,
  Copy,
  Check,
  FileText,
  Settings,
  BookOpen,
  ShieldCheck,
  Cpu,
  Globe,
  Compass,
  Users,
  Upload,
  Paperclip,
  X,
  FileUp,
  Zap,
  Calculator,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Printer,
  Eye,
  FileCheck,
  Sliders
} from 'lucide-react';
import { AppendixDocumentPreview } from '../AppendixDocumentPreview';
import { DigitalCompetencyAndAISelectorModal } from '../modals/DigitalCompetencyAndAISelectorModal';
import { injectCompetenciesIntoAppendix } from '../../lib/competencyIntegrator';
import { autoNormalizeVietnameseFont } from '../../lib/vietnameseFontConverter';

interface Tab8EducationPlan5512Props {
  profile: ClassProfile;
  onChangeProfile: (profile: ClassProfile) => void;
  apiKeysInput: string;
  referenceCacheText: string;
  onOpenApiGuide: () => void;
  specificGoals?: string;
}

export const Tab8EducationPlan5512: React.FC<Tab8EducationPlan5512Props> = ({
  profile,
  onChangeProfile,
  apiKeysInput,
  referenceCacheText,
  onOpenApiGuide,
  specificGoals = ''
}) => {
  // Modal state for selecting Digital Competency & AI Education Framework
  const [isNlsModalOpen, setIsNlsModalOpen] = useState(false);
  // Standard Selector: CV 2345 (Tiểu học) vs CV 5512 (THCS / THPT)
  const isPrimaryByDefault = Boolean(
    (profile.mon && profile.mon.includes('Tiểu học')) ||
    (profile.lop && ['1', '2', '3', '4', '5'].includes(profile.lop.charAt(0))) ||
    (profile.thoiluong && profile.thoiluong.includes('Tiểu học')) ||
    (profile.loaiga && profile.loaiga.includes('2345'))
  );
  const [planStandard, setPlanStandard] = useState<'CV5512' | 'CV2345'>(isPrimaryByDefault ? 'CV2345' : 'CV5512');
  const [selectedAppendix, setSelectedAppendix] = useState<'PL1' | 'PL2' | 'PL3'>('PL1');

  // Integration Checkboxes
  const [integrateNLS, setIntegrateNLS] = useState(true);
  const [integrateAI, setIntegrateAI] = useState(true);
  const [integrateSTEM, setIntegrateSTEM] = useState(true);
  const [integrateQPAN, setIntegrateQPAN] = useState(false);
  const [integrateEnv, setIntegrateEnv] = useState(true);
  const [integrateLifeSkills, setIntegrateLifeSkills] = useState(true);
  const [integrateHanoiGov, setIntegrateHanoiGov] = useState(true);

  // Administrative Fields & Signatures
  const [schoolName, setSchoolName] = useState(
    isPrimaryByDefault ? 'Trường Tiểu học Tây Phương' : 'Trường THCS Phùng Khắc Khoan'
  );
  const [departmentName, setSetDepartmentName] = useState(
    isPrimaryByDefault ? 'Tổ Chuyên môn Khối ' + (profile.lop ? profile.lop.charAt(0) : '4') : 'Tổ Toán - Tin'
  );
  const [teacherName, setTeacherName] = useState(profile.teacherSigner || (isPrimaryByDefault ? 'Cô Giáo Tiểu học' : 'Giáo viên bộ môn'));
  const [bghSigner, setBghSigner] = useState(profile.bghSigner || (isPrimaryByDefault ? 'Nguyễn Thị Mai' : 'Bùi Sỹ Nghĩa'));
  const [departmentSigner, setDepartmentSigner] = useState(profile.deptSigner || (isPrimaryByDefault ? 'Tổ trưởng Khối ' + (profile.lop ? profile.lop.charAt(0) : '4') : ''));
  const [academicYear, setTeacherAcademicYear] = useState('2026 - 2027');
  const [semester, setSemester] = useState('Học kỳ I & II');
  const [isManualDept, setIsManualDept] = useState(false);

  // Math Specific Parallel Stream Presets
  const isMathSubject = (profile.mon || '').toUpperCase().includes('TOÁN');
  const [isMathParallelMode, setIsMathParallelMode] = useState<boolean>(true);

  // Auto detect standard if profile changes
  React.useEffect(() => {
    const isPri = (
      (profile.mon && profile.mon.includes('Tiểu học')) ||
      (profile.lop && ['1', '2', '3', '4', '5'].includes(profile.lop.charAt(0))) ||
      (profile.thoiluong && profile.thoiluong.includes('Tiểu học')) ||
      (profile.loaiga && profile.loaiga.includes('2345'))
    );
    if (isPri) {
      setPlanStandard('CV2345');
      if (schoolName.includes('THCS')) setSchoolName('Trường Tiểu học Tây Phương');
    }
  }, [profile.mon, profile.lop, profile.thoiluong, profile.loaiga]);

  // Sync signers if profile updates
  React.useEffect(() => {
    if (profile.bghSigner) setBghSigner(profile.bghSigner);
    if (profile.deptSigner !== undefined) setDepartmentSigner(profile.deptSigner);
  }, [profile.bghSigner, profile.deptSigner]);

  // Auto-sync department name based on subject unless user manually chose department
  React.useEffect(() => {
    if (profile.mon && !isManualDept) {
      const monUpper = profile.mon.toUpperCase();
      if (monUpper.includes('TIẾNG VIỆT') || monUpper.includes('TIỂU HỌC') || monUpper.includes('TỰ NHIÊN VÀ XÃ HỘI') || monUpper.includes('ĐẠO ĐỨC')) {
        setSetDepartmentName('Tổ Chuyên môn Tiểu học');
      } else if (monUpper.includes('TOÁN')) {
        setSetDepartmentName('Tổ Toán - Tin');
      } else if (
        monUpper.includes('KHOA HỌC TỰ NHIÊN') ||
        monUpper.includes('KHTN') ||
        monUpper.includes('VẬT LÝ') ||
        monUpper.includes('HÓA HỌC') ||
        monUpper.includes('SINH HỌC')
      ) {
        setSetDepartmentName('Tổ Khoa học Tự nhiên');
      } else if (
        monUpper.includes('SỬ') ||
        monUpper.includes('ĐỊA') ||
        monUpper.includes('XÃ HỘI') ||
        monUpper.includes('KHXH') ||
        monUpper.includes('GDCD')
      ) {
        setSetDepartmentName('Tổ Khoa học Xã hội');
      } else if (monUpper.includes('TIN')) {
        setSetDepartmentName('Tổ Tin học');
      } else if (monUpper.includes('VĂN') || monUpper.includes('NGỮ VĂN')) {
        setSetDepartmentName('Tổ Ngữ văn');
      } else if (monUpper.includes('TIẾNG ANH') || monUpper.includes('NGOẠI NGỮ')) {
        setSetDepartmentName('Tổ Ngoại ngữ');
      }
    }
  }, [profile.mon, isManualDept]);

  // Scheduling & Topic Ratio Fields
  const [weekMidterm1, setWeekMidterm1] = useState('Tuần 8');
  const [weekFinal1, setWeekFinal1] = useState('Tuần 16');
  const [weekMidterm2, setWeekMidterm2] = useState('Tuần 26');
  const [weekFinal2, setWeekFinal2] = useState('Tuần 31');

  const [periodsSemester1, setPeriodsSemester1] = useState('72');
  const [periodsSemester2, setPeriodsSemester2] = useState('68');
  const [periodsTotalYear, setPeriodsTotalYear] = useState('140');

  const [ratioAlgebra, setRatioAlgebra] = useState('50% (70 tiết)');
  const [ratioGeometry, setRatioGeometry] = useState('50% (70 tiết)');
  const [ratioStats, setRatioStats] = useState('Tích hợp trong Đại số');
  const [ratioExperiential, setRatioExperiential] = useState('Đủ 35 tuần');

  // Existing Rough Draft / File Upload State for Appendix
  const [draftAppendixText, setDraftAppendixText] = useState<string>('');
  const [draftFileName, setDraftFileName] = useState<string>('');
  const [showDraftInput, setShowDraftInput] = useState<boolean>(false);
  const [showReferencePreview, setShowReferencePreview] = useState<boolean>(false);

  // Generated Content state per appendix
  const [pl1Content, setPl1Content] = useState<string>('');
  const [pl2Content, setPl2Content] = useState<string>('');
  const [pl3Content, setPl3Content] = useState<string>('');

  // Accordion Sections Visibility for Responsive Mobile / Desktop Layout
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDraftFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDraftFileName(file.name);
      try {
        const parsedKeys = apiKeysInput ? apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean) : [];
        const rawContent = await readFileAsText(file, { fullScan: true, apiKeys: parsedKeys });
        const content = autoNormalizeVietnameseFont(rawContent);
        setDraftAppendixText(content);
        setShowDraftInput(true);
        if (content && content.trim()) {
          setCurrentContent(content);
        }
        alert(`✅ Đã đọc thành công và nạp nguyên bản 100% nội dung file "${file.name}" vào ${selectedAppendix}! Toàn bộ bảng phân phối, số tiết và bài học được giữ nguyên.`);
      } catch (err) {
        alert('Lỗi khi đọc file: ' + err);
      }
    }
  };

  // Quick apply Math 140 periods preset
  const handleApplyMathPreset = () => {
    setWeekMidterm1('Tuần 8');
    setWeekFinal1('Tuần 16');
    setWeekMidterm2('Tuần 26');
    setWeekFinal2('Tuần 31');
    setPeriodsSemester1('72');
    setPeriodsSemester2('68');
    setPeriodsTotalYear('140');
    setRatioAlgebra('70 tiết (50%)');
    setRatioGeometry('70 tiết (50%)');
    setIsMathParallelMode(true);
    onChangeProfile({
      ...profile,
      mon: 'Toán',
      k1Periods: 72,
      k2Periods: 68,
      totalYearPeriods: 140,
      mathStreamMode: 'parallel',
      daiSoK1Periods: 36,
      daiSoK2Periods: 34,
      hinhHocK1Periods: 36,
      hinhHocK2Periods: 34
    });
    alert('✅ Đã áp dụng mẫu phân phối chuẩn Môn Toán: 140 tiết (35 tuần, HK1 72 tiết, HK2 68 tiết, 1 tuần 2 Đại + 2 Hình dạy song song, kiểm tra tuần 8, 16, 26, 31)!');
  };

  // Instant Load Full 35-week Table directly into Editor
  const handleInstantLoadMathTable = () => {
    const tableMd = generateMath35WeeksMarkdownTable();
    const fullDoc = `TRƯỜNG THCS PHÙNG KHẮC KHOAN          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
TỔ: TỔ TOÁN - TIN                         Độc lập - Tự do - Hạnh phúc

# PHỤ LỤC 1: KẾ HOẠCH DẠY HỌC MÔN HỌC (MÔN TOÁN LỚP ${profile.lop || '7'})
**(Năm học ${academicYear})**

Môn: TOÁN HỌC | Khối lớp: ${profile.lop || '7'} | Bộ sách: ${profile.boSach || 'Kết nối tri thức với cuộc sống'}
Tổ chuyên môn: ${departmentName}
- Số tiết Học kỳ I: 72 tiết (18 tuần = 36 tiết Đại số + 36 tiết Hình học)
- Số tiết Học kỳ II: 68 tiết (17 tuần = 34 tiết Đại số + 34 tiết Hình học)
- Tổng số tiết Cả năm: 140 tiết (35 tuần = 70 tiết Đại số + 70 tiết Hình học)

## I. ĐẶC ĐIỂM TÌNH HÌNH
1. Số lớp, số học sinh: Khối lớp: ${profile.lop || '7'} ; Số học sinh: ${profile.siso || '45'} HS/lớp.
2. Tình hình đội ngũ: Số giáo viên: ${profile.soGiaoVien || '05 giáo viên'} ; Trình độ đào tạo: 100% Đạt chuẩn và trên chuẩn.
3. Thiết bị dạy học: Máy tính, Tivi trình chiếu, Bộ dụng cụ thước kẻ - compa - êke, Phòng máy vi tính kết nối Internet tốc độ cao, Phần mềm GeoGebra.
4. Phòng học bộ môn/phòng chức năng: Phòng học bộ môn Toán, Phòng Tin học.

## II. KẾ HOẠCH DẠY HỌC (PHÂN PHỐI CHƯƠNG TRÌNH 35 TUẦN - 140 TIẾT)
${tableMd}

### 2. Kiểm tra, đánh giá định kỳ
| Bài kiểm tra, đánh giá | Thời gian | Thời điểm (tuần) | Yêu cầu cần đạt | Hình thức |
|---|---|---|---|---|
| Giữa học kỳ I | 60 phút | Tuần 8 | Đánh giá kiến thức Đại số & Hình học từ tuần 1 đến tuần 8 | Trắc nghiệm (30%) + Tự luận (70%) |
| Cuối học kỳ I | 90 phút | Tuần 16 | Đánh giá tổng hợp toàn bộ kiến thức Học kỳ I | Trắc nghiệm (30%) + Tự luận (70%) |
| Giữa học kỳ II | 60 phút | Tuần 26 | Đánh giá kiến thức Đại số & Hình học từ tuần 19 đến tuần 26 | Trắc nghiệm (30%) + Tự luận (70%) |
| Cuối học kỳ II | 90 phút | Tuần 31 | Đánh giá tổng hợp toàn bộ kiến thức Học kỳ II & Cả năm | Trắc nghiệm (30%) + Tự luận (70%) |

## III. DANH MỤC NỘI DUNG TÍCH HỢP/GIÁO DỤC THEO ĐỊNH HƯỚNG
| STT | Nội dung tích hợp/giáo dục | Gợi ý thể hiện trong kế hoạch |
|---|---|---|
| 1 | Năng lực Số (Thông tư 02/2025/TT-BGDĐT) | Khai thác phần mềm GeoGebra vẽ hình, xử lý bảng biểu thống kê trên máy tính |
| 2 | Trí tuệ Nhân tạo AI (Quyết định 3439/QĐ-BGDĐT & CV 8334) | Hướng dẫn học sinh sử dụng trợ lý AI giải toán, phân tích đề bài có trách nhiệm |
| 3 | Giáo dục STEM & Liên môn | Chế tạo dụng cụ đo góc, ứng dụng tỉ số trong thực tiễn, tính toán chi phí sinh hoạt |
| 4 | Giáo dục Quốc phòng & An ninh (QPAN) | Vận dụng bài toán tọa độ, bản đồ, định vị hải đảo chủ quyền Việt Nam |
| 5 | Bảo vệ môi trường & Tiết kiệm năng lượng | Khai thác các bài toán về số liệu rác thải, đa dạng sinh học và biến đổi khí hậu |

Tây Phương, ngày     tháng     năm 2026
| **XÁC NHẬN BGH (DUYỆT)** | **DUYỆT CỦA TỔ CM** | **NGƯỜI LẬP KẾ HOẠCH** |
|:---:|:---:|:---:|
| *(Ký, đóng dấu)* | *(Ký, ghi rõ họ tên)* | *(Ký, ghi rõ họ tên)* |
| <br/>**${bghSigner}** | <br/>**${departmentSigner}** | <br/>**${teacherName}** |
`;
    setCurrentContent(fullDoc);
    alert('✅ Đã nạp thành công Bảng phân phối chương trình chuẩn Môn Toán 35 tuần, 140 tiết (2 Đại + 2 Hình song song) vào trình xem!');
  };

  // Instant Load Primary Grade 1 Vietnamese (210 periods)
  const handleInstantLoadPrimaryVietnamese1 = () => {
    const tableMd = generatePrimary35WeeksMarkdownTable(PRIMARY_VIETNAMESE_1_35WEEKS, 'Tiếng Việt', '1');
    const doc = generatePrimaryAppendix2Doc({
      schoolName: schoolName || 'Trường Tiểu học Tây Phương',
      gradeName: '1',
      subjectName: 'Tiếng Việt (Tiểu học)',
      departmentName: departmentName || 'Tổ Chuyên môn Khối 1',
      academicYear,
      bghSigner: bghSigner || 'Nguyễn Thị Mai',
      departmentSigner: departmentSigner || 'Tổ trưởng Khối 1',
      scheduleTableMd: tableMd
    });
    setSelectedAppendix('PL2');
    setPl2Content(doc);
    alert('✅ Đã nạp thành công Bảng phân phối chương trình Tiếng Việt Lớp 1 (210 tiết - 35 tuần, chuẩn CV 2345 & TT 27) vào Phụ lục 2!');
  };

  // Instant Load Primary Grade 2 Math (175 periods)
  const handleInstantLoadPrimaryMath2 = () => {
    const tableMd = generatePrimary35WeeksMarkdownTable(PRIMARY_MATH_2_35WEEKS, 'Toán', '2');
    const doc = generatePrimaryAppendix2Doc({
      schoolName: schoolName || 'Trường Tiểu học Tây Phương',
      gradeName: '2',
      subjectName: 'Toán (Tiểu học)',
      departmentName: departmentName || 'Tổ Chuyên môn Khối 2',
      academicYear,
      bghSigner: bghSigner || 'Nguyễn Thị Mai',
      departmentSigner: departmentSigner || 'Tổ trưởng Khối 2',
      scheduleTableMd: tableMd
    });
    setSelectedAppendix('PL2');
    setPl2Content(doc);
    alert('✅ Đã nạp thành công Bảng phân phối chương trình Toán Lớp 2 (175 tiết - 35 tuần, chuẩn CV 2345) vào Phụ lục 2!');
  };

  // Instant Load Secondary / High School CV 5512 Appendix 1
  const handleInstantLoadCV5512Appendix1 = () => {
    const doc = generateCV5512Appendix1Doc({
      schoolName: schoolName || 'Trường THCS Phùng Khắc Khoan',
      departmentName: departmentName || 'Tổ Toán - Tin',
      subjectName: profile.mon || 'Toán học',
      gradeName: profile.lop || '7',
      academicYear,
      teacherName: teacherName || 'Nguyễn Văn A',
      bghSigner: bghSigner || 'Hiệu Trưởng',
      departmentSigner: departmentSigner || 'Tổ Trưởng Chuyên Môn'
    });
    setSelectedAppendix('PL1');
    setPl1Content(doc);
    alert('✅ Đã nạp thành công Mẫu Phụ lục 1 CV 5512 (Kế hoạch dạy học môn học của Tổ Chuyên môn - 35 tuần, 140 tiết) vào Phụ lục 1!');
  };

  // Instant Load Secondary / High School CV 5512 Appendix 2
  const handleInstantLoadCV5512Appendix2 = () => {
    const doc = generateCV5512Appendix2Doc({
      schoolName: schoolName || 'Trường THCS Phùng Khắc Khoan',
      departmentName: departmentName || 'Tổ Toán - Tin',
      subjectName: profile.mon || 'Toán học',
      academicYear,
      bghSigner: bghSigner || 'Hiệu Trưởng',
      departmentSigner: departmentSigner || 'Tổ Trưởng Chuyên Môn'
    });
    setSelectedAppendix('PL2');
    setPl2Content(doc);
    alert('✅ Đã nạp thành công Mẫu Phụ lục 2 CV 5512 (Kế hoạch tổ chức các hoạt động giáo dục của Tổ Chuyên môn) vào Phụ lục 2!');
  };

  // Instant Load Secondary / High School CV 5512 Appendix 3
  const handleInstantLoadCV5512Appendix3 = () => {
    const doc = generateCV5512Appendix3Doc({
      schoolName: schoolName || 'Trường THCS Phùng Khắc Khoan',
      departmentName: departmentName || 'Tổ Toán - Tin',
      subjectName: profile.mon || 'Toán học',
      gradeName: profile.lop || '7',
      academicYear,
      teacherName: teacherName || 'Nguyễn Văn A',
      bghSigner: bghSigner || 'Hiệu Trưởng',
      departmentSigner: departmentSigner || 'Tổ Trưởng Chuyên Môn'
    });
    setSelectedAppendix('PL3');
    setPl3Content(doc);
    alert('✅ Đã nạp thành công Mẫu Phụ lục 3 CV 5512 (Kế hoạch giáo dục của Giáo viên) vào Phụ lục 3!');
  };

  // Instant Load Standard CV 2345 Phụ lục 1 (Nhà trường)
  const handleInstantLoadPrimaryAppendix1 = () => {
    const doc = generatePrimaryAppendix1Doc({
      schoolName: schoolName || 'Trường Tiểu học Tây Phương',
      academicYear,
      bghSigner: bghSigner || 'Nguyễn Thị Mai'
    });
    setSelectedAppendix('PL1');
    setPl1Content(doc);
    alert('✅ Đã nạp thành công Mẫu Phụ lục 1 CV 2345 (Kế hoạch giáo dục Nhà trường cấp Tiểu học) vào trình xem!');
  };

  // Instant Load Standard CV 2345 Phụ lục 3 (Giáo án Tiểu học)
  const handleInstantLoadPrimaryAppendix3 = () => {
    const doc = generatePrimaryAppendix3Doc({
      schoolName: schoolName || 'Trường Tiểu học Tây Phương',
      lessonTitle: profile.tenbaiday || (profile.mon?.includes('Toán') ? 'Bài: Phép cộng (có nhớ) trong phạm vi 100' : 'Bài: Đọc - Mái ấm gia đình'),
      subjectName: profile.mon || 'Tiếng Việt (Tiểu học)',
      gradeName: profile.lop || '1',
      periodsCount: 2,
      teacherName: teacherName || 'Cô Giáo Tiểu học',
      bghSigner: bghSigner || 'Nguyễn Thị Mai'
    });
    setSelectedAppendix('PL3');
    setPl3Content(doc);
    alert('✅ Đã nạp thành công Mẫu Phụ lục 3 CV 2345 (Kế hoạch bài dạy 4 bước chuẩn Tiểu học & Thông tư 27) vào Phụ lục 3!');
  };

  // Get current active content
  const currentContent =
    selectedAppendix === 'PL1' ? pl1Content : selectedAppendix === 'PL2' ? pl2Content : pl3Content;
  const setCurrentContent = (val: string) => {
    if (selectedAppendix === 'PL1') setPl1Content(val);
    else if (selectedAppendix === 'PL2') setPl2Content(val);
    else setPl3Content(val);
  };

  // Direct In-Place Competency Integration without changing original document layout or content
  const handleDirectIntegrateCompetencies = (customCompetenciesText: string) => {
    const rawTarget = currentContent?.trim() ? currentContent : draftAppendixText?.trim() ? draftAppendixText : '';
    if (!rawTarget) {
      alert('Vui lòng chọn một phụ lục mẫu chuẩn, tải file phụ lục lên hoặc nhập nội dung trước khi tích hợp năng lực!');
      return;
    }

    const targetSource = autoNormalizeVietnameseFont(rawTarget);

    const updated = injectCompetenciesIntoAppendix(targetSource, {
      selectedCompetenciesText: customCompetenciesText || '',
      integrateNLS,
      integrateAI,
      integrateSTEM,
      integrateQPAN,
      integrateEnv,
      integrateLifeSkills,
      gradeLevel: profile.lop
    });

    const finalContent = autoNormalizeVietnameseFont(updated);
    setCurrentContent(finalContent);
    alert(`✅ [LỰA CHỌN 1] Đã tích hợp thành công các Mã Chỉ Báo Năng Lực Số (TT 02/2025: [NLS: 1.1TC...]), AI (QĐ 2422/3439: [AI: 1.A1...]), STEM & QPAN vào ${selectedAppendix}! Toàn bộ cấu trúc bảng, bài học, số tiết và phân phối chương trình gốc được giữ nguyên 100%.`);
  };

  // Directly integrate competencies into uploaded draft file and load into current editor (Option 1)
  const handleDirectIntegrateDraftFile = () => {
    if (!draftAppendixText || !draftAppendixText.trim()) {
      alert('Vui lòng tải lên file phụ lục (.docx, .txt, .pdf) hoặc dán nội dung thô trước khi tích hợp!');
      return;
    }
    const cleanDraft = autoNormalizeVietnameseFont(draftAppendixText);
    const updated = injectCompetenciesIntoAppendix(cleanDraft, {
      selectedCompetenciesText: '',
      integrateNLS,
      integrateAI,
      integrateSTEM,
      integrateQPAN,
      integrateEnv,
      integrateLifeSkills,
      gradeLevel: profile.lop
    });
    const finalContent = autoNormalizeVietnameseFont(updated);
    setCurrentContent(finalContent);
    setDraftAppendixText(finalContent);
    alert(`✅ [LỰA CHỌN 1] Đã tích hợp thành công Mã Chỉ Báo Năng Lực Số (TT 02/2025: [NLS: 1.1TC...]) và AI (QĐ 2422/3439: [AI: 1.A1...]) trực tiếp vào file tải lên và hiển thị trên ${selectedAppendix}! Toàn bộ bài học, số tiết, tuần và bảng phân phối gốc được bảo tồn 100%.`);
  };

  const handleGeneratePlan = async () => {
    const apiKeys = apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);

    setIsGenerating(true);

    const integrationsList: string[] = [];
    if (integrateNLS) integrationsList.push('Năng lực số (Theo Thông tư 02/2025/TT-BGDĐT)');
    if (integrateAI) integrationsList.push('Trí tuệ nhân tạo AI (Theo Quyết định 3439/QĐ-BGDĐT & CV 8334/BGDĐT-GDPT)');
    if (integrateSTEM) integrationsList.push('Dạy học Liên môn / STEM / STEAM');
    if (integrateQPAN) integrationsList.push('Giáo dục Quốc phòng và An ninh (QPAN)');
    if (integrateEnv) integrationsList.push('Bảo vệ môi trường & Chủ quyền Biển đảo');
    if (integrateLifeSkills) integrationsList.push('Kĩ năng sống & Văn hóa số');
    if (integrateHanoiGov) integrationsList.push('Quy định & Văn bản chỉ đạo Sở GD&ĐT Hà Nội (CV 1177/SGDĐT-GDTrH, 1507/SGDĐT-TCCB, 1627/SGDĐT-GDTrH)');

    let appendixTitle = '';
    let appendixStructureInstructions = '';

    const k1P = periodsSemester1 || (planStandard === 'CV2345' ? '105' : '72');
    const k2P = periodsSemester2 || (planStandard === 'CV2345' ? '105' : '68');
    const totP = periodsTotalYear || (planStandard === 'CV2345' ? '210' : '140');

    if (planStandard === 'CV2345') {
      // PRIMARY SCHOOL CV 2345/BGDĐT-GDTH
      if (selectedAppendix === 'PL1') {
        appendixTitle = 'PHỤ LỤC 1: KẾ HOẠCH GIÁO DỤC CỦA NHÀ TRƯỜNG (CẤP TIỂU HỌC - THEO CV 2345/BGDĐT-GDTH)';
        appendixStructureInstructions = `
BẮT BUỘC TRÌNH BÀY ĐÚNG MẪU PHỤ LỤC 1 THEO CÔNG VĂN 2345/BGDĐT-GDTH:

TRƯỜNG: ${schoolName.toUpperCase()}                   CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                                      Độc lập - Tự do - Hạnh phúc

# PHỤ LỤC 1: KẾ HOẠCH GIÁO DỤC CỦA NHÀ TRƯỜNG NĂM HỌC ${academicYear}
**(Kèm theo Quyết định số:   /QĐ-HT ngày ... tháng ... năm ... của Hiệu trưởng)**

## I. CĂN CỨ XÂY DỰNG KẾ HOẠCH
- Căn cứ Chương trình Giáo dục phổ thông 2018 cấp Tiểu học ban hành kèm theo Thông tư số 32/2018/TT-BGDĐT.
- Căn cứ Công văn số 2345/BGDĐT-GDTH ngày 07/6/2021 của Bộ GD&ĐT về việc hướng dẫn xây dựng kế hoạch giáo dục của nhà trường cấp tiểu học.
- Căn cứ Thông tư 27/2020/TT-BGDĐT về Đánh giá học sinh tiểu học.
- Căn cứ Thông tư 02/2025/TT-BGDĐT về Khung năng lực số; Quyết định 3439/QĐ-BGDĐT & CV 8334/BGDĐT-GDPT về Trí tuệ Nhân tạo (AI).

## II. ĐIỀU KIỆN THỰC HIỆN CHƯƠNG TRÌNH NĂM HỌC
1. Đặc điểm học sinh và quy mô trường lớp (Khối 1 đến Khối 5)
2. Đội ngũ cán bộ quản lý, giáo viên, nhân viên
3. Cơ sở vật chất, thiết bị dạy học và học liệu số, phòng máy tính

## III. KẾ HOẠCH THỜI GIAN VÀ CƠ CẤU THỜI LƯỢNG CÁC MÔN HỌC (35 TUẦN THỰC HỌC)
| STT | Môn học / Hoạt động giáo dục | Khối 1 | Khối 2 | Khối 3 | Khối 4 | Khối 5 | Ghi chú |
|---|---|---|---|---|---|---|---|
| 1 | Tiếng Việt | 420 tiết (12t/t) | 350 tiết (10t/t) | 280 tiết (8t/t) | 245 tiết (7t/t) | 245 tiết (7t/t) | Tích hợp Đọc số |
| 2 | Toán | 105 tiết (3t/t) | 175 tiết (5t/t) | 175 tiết (5t/t) | 175 tiết (5t/t) | 175 tiết (5t/t) | AI & STEM |
| 3 | Ngoại ngữ 1 (Tiếng Anh) | Tự chọn (70t) | Tự chọn (70t) | 140 tiết (4t/t) | 140 tiết (4t/t) | 140 tiết (4t/t) | |
| 4 | Tự nhiên và Xã hội / Khoa học | 70 tiết (2t/t) | 70 tiết (2t/t) | 70 tiết (2t/t) | 70 tiết (2t/t) | 70 tiết (2t/t) | STEM & Môi trường |
| 5 | Lịch sử và Địa lí | - | - | - | 70 tiết (2t/t) | 70 tiết (2t/t) | Di sản văn hóa |
| 6 | Tin học và Công nghệ | - | - | 70 tiết (2t/t) | 70 tiết (2t/t) | 70 tiết (2t/t) | Năng lực số TT 02/2025 |
| 7 | Đạo đức | 35 tiết (1t/t) | 35 tiết (1t/t) | 35 tiết (1t/t) | 35 tiết (1t/t) | 35 tiết (1t/t) | Kỹ năng sống |
| 8 | Âm nhạc / Mĩ thuật | 70 tiết (2t/t) | 70 tiết (2t/t) | 70 tiết (2t/t) | 70 tiết (2t/t) | 70 tiết (2t/t) | Sáng tạo số |
| 9 | Giáo dục thể chất | 70 tiết (2t/t) | 70 tiết (2t/t) | 70 tiết (2t/t) | 70 tiết (2t/t) | 70 tiết (2t/t) | Rèn luyện thể lực |
| 10 | Hoạt động trải nghiệm | 105 tiết (3t/t) | 105 tiết (3t/t) | 105 tiết (3t/t) | 105 tiết (3t/t) | 105 tiết (3t/t) | Sinh hoạt dưới cờ/lớp |

## IV. TỔ CHỨC CÁC HOẠT ĐỘNG GIÁO DỤC TẬP THỂ, STEM VÀ NĂNG LỰC SỐ
| STT | Hoạt động / Chủ đề | Khối lớp | Thời điểm | Chủ trì | Phối hợp |
|---|---|---|---|---|---|
| 1 | Ngày hội Đọc sách và Không gian Tri thức số | 1, 2, 3, 4, 5 | Tháng 11 | Thư viện, TPT Đội | Tổ Chuyên môn |
| 2 | Ngày hội STEM & Sáng tạo Nhí với AI | Khối 3, 4, 5 | Tháng 1 | Tổ Tin học - Công nghệ | GVCN |
| 3 | Giáo dục Kỹ năng sống & An toàn không gian mạng | 1, 2, 3, 4, 5 | Suốt năm học | GVCN, Tổng phụ trách | Công an xã |

Ngày     tháng     năm 2026
**HIỆU TRƯỞNG PHÊ DUYỆT**
*(Ký, đóng dấu)*
**${bghSigner}**
`;
      } else if (selectedAppendix === 'PL2') {
        appendixTitle = 'PHỤ LỤC 2: KẾ HOẠCH DẠY HỌC CÁC MÔN HỌC, HOẠT ĐỘNG GIÁO DỤC KHỐI LỚP (CẤP TIỂU HỌC - CV 2345/BGDĐT-GDTH)';
        appendixStructureInstructions = `
BẮT BUỘC TRÌNH BÀY ĐÚNG MẪU PHỤ LỤC 2 THEO CÔNG VĂN 2345/BGDĐT-GDTH CỦA BỘ GD&ĐT:

TRƯỜNG: ${schoolName.toUpperCase()}                   CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
TỔ CHUYÊN MÔN: ${departmentName.toUpperCase()}         Độc lập - Tự do - Hạnh phúc

# PHỤ LỤC 2: KẾ HOẠCH DẠY HỌC MÔN HỌC/HOẠT ĐỘNG GIÁO DỤC
**MÔN: ${profile.mon.toUpperCase()} - KHỐI LỚP ${profile.lop} - BỘ SÁCH: ${profile.boSach || 'Kết nối tri thức với cuộc sống'}**
**(Năm học: ${academicYear})**

## I. CĂN CỨ XÂY DỰNG KẾ HOẠCH
- Chương trình môn học cấp Tiểu học (Thông tư 32/2018/TT-BGDĐT);
- Hướng dẫn thực hiện nhiệm vụ năm học cấp Tiểu học;
- Tích hợp Thông tư 02/2025/TT-BGDĐT (Năng lực số), Quyết định 3439/QĐ-BGDĐT (AI), STEM và Kỹ năng sống.

## II. KẾ HOẠCH DẠY HỌC 35 TUẦN MÔN ${profile.mon.toUpperCase()} (TỔNG SỐ: ${totP} TIẾT)
(Bắt buộc trình bày bảng đầy đủ 35 tuần theo đúng các cột chuẩn của Phụ lục 2 - CV 2345):

| Tuần (1) | Chương trình và sách giáo khoa (Chủ đề / Mạch kiến thức / Tên bài học) (2) | Số tiết (3) | Yêu cầu cần đạt (4) | Nội dung tích hợp (Năng lực số, AI, STEM, Kỹ năng sống, Môi trường) (5) | Thiết bị, học liệu số & ĐDDH (6) | Điều chỉnh / Ghi chú (7) |
|:---:|:---|:---:|:---|:---|:---|:---|
| Tuần 1 | ... | ... | ... | Năng lực số (TT 02/2025), Kỹ năng sống | Tranh ảnh, Tivi, Bộ chữ/toán | ... |
| ... | (Lập đầy đủ chi tiết từ Tuần 1 đến Tuần 35) | | | | | |

## III. ĐÁNH GIÁ ĐỊNH KỲ (THEO THÔNG TƯ 27/2020/TT-BGDĐT)
| Đợt đánh giá | Thời điểm (tuần) | Nội dung / Ma trận đánh giá | Hình thức |
|---|---|---|---|
| Giữa Học kỳ I | Tuần 9 | Đánh giá kiến thức & kĩ năng từ Tuần 1 - 9 | Bài kiểm tra viết / Thực hành + Quan sát |
| Cuối Học kỳ I | Tuần 18 | Đánh giá tổng hợp toàn bộ Học kỳ I | Bài kiểm tra định kỳ chuẩn ma trận 3 mức độ |
| Giữa Học kỳ II | Tuần 27 | Đánh giá kiến thức & kĩ năng từ Tuần 19 - 27 | Bài kiểm tra viết / Thực hành + Quan sát |
| Cuối Học kỳ II | Tuần 35 | Đánh giá tổng hợp cả năm học | Bài kiểm tra định kỳ cả năm |

Tây Phương, ngày     tháng     năm 2026
| **HIỆU TRƯỞNG DUYỆT** | **TỔ TRƯỞNG CHUYÊN MÔN** | **NGƯỜI LẬP KẾ HOẠCH** |
|:---:|:---:|:---:|
| *(Ký, đóng dấu)* | *(Ký, ghi rõ họ tên)* | *(Ký, ghi rõ họ tên)* |
| <br/>**${bghSigner}** | <br/>**${departmentSigner}** | <br/>**${teacherName}** |
`;
      } else {
        appendixTitle = 'PHỤ LỤC 3: KẾ HOẠCH BÀI DẠY (GIÁO ÁN TIỂU HỌC CHUẨN 4 HOẠT ĐỘNG CV 2345/BGDĐT-GDTH)';
        appendixStructureInstructions = `
BẮT BUỘC TRÌNH BÀY ĐÚNG CẤU TRÚC KẾ HOẠCH BÀI DẠY THEO CÔNG VĂN 2345/BGDĐT-GDTH (CẤP TIỂU HỌC):

TRƯỜNG TIỂU HỌC: ${schoolName.toUpperCase()}
KHỐI LỚP: ${profile.lop} - MÔN: ${profile.mon.toUpperCase()}
GIÁO VIÊN: ${teacherName}

# KẾ HOẠCH BÀI DẠY
**TÊN BÀI DẠY: ${profile.tenbaiday || 'BÀI DẠY MINH HỌA'}**
**Môn học/Hoạt động giáo dục: ${profile.mon}; Lớp: ${profile.lop}**
**Thời gian thực hiện: ... tiết (Ngày dạy: .../ .../ 2026)**

## I. YÊU CẦU CẦN ĐẠT (Theo chuẩn CT GDPT 2018 & TT 27/2020)
### 1. Năng lực đặc thù:
- Nêu rõ các yêu cầu cần đạt về kiến thức, kỹ năng môn học mà học sinh cần chiếm lĩnh và thực hiện được.
### 2. Năng lực chung:
- Tự chủ và tự học, Giao tiếp và hợp tác, Giải quyết vấn đề và sáng tạo.
- Tích hợp Năng lực số (Thông tư 02/2025/TT-BGDĐT): HS nhận biết, thao tác dữ liệu số cơ bản, tương tác an toàn.
- Tích hợp Trí tuệ Nhân tạo AI (Quyết định 3439/QĐ-BGDĐT): Làm quen với nhận diện giọng nói, hình ảnh AI một cách phù hợp lứa tuổi tiểu học.
### 3. Phẩm chất:
- Yêu nước, Nhân ái, Chăm chỉ, Trung thực, Trách nhiệm.

## II. ĐỒ DÙNG DẠY HỌC
1. Giáo viên: Kế hoạch bài dạy, Tivi/Máy chiếu, Bài giảng điện tử đa phương tiện, Phiếu bài tập, Bộ thiết bị dạy học.
2. Học sinh: SGK, Vở bài tập, Đồ dùng học tập cá nhân.

## III. CÁC HOẠT ĐỘNG DẠY HỌC CHỦ YẾU (CHUẨN 4 BƯỚC CV 2345)
*(Mỗi hoạt động phải chỉ rõ: Mục tiêu, Nội dung, Sản phẩm, Tổ chức thực hiện của GV & Hoạt động của HS, Đánh giá thường xuyên theo Thông tư 27)*

### 1. HOẠT ĐỘNG 1: MỞ ĐẦU (Khởi động, kết nối - 5 phút)
- **Mục tiêu:** Tạo hứng thú, tâm thế thoải mái cho học sinh, khơi gợi kiến thức nền.
- **Cách thức tiến hành:** Trò chơi, bài hát, câu đố hoặc video clip ngắn.

### 2. HOẠT ĐỘNG 2: HÌNH THÀNH KIẾN THỨC MỚI (Khám phá - 15 phút)
- **Mục tiêu:** Giúp học sinh chiếm lĩnh tri thức mới thông qua quan sát, trải nghiệm, thảo luận.
- **Cách thức tiến hành:** Làm việc cá nhân -> Thảo luận nhóm đôi/nhóm 4 -> Báo cáo, chia sẻ trước lớp -> Giáo viên chốt kiến thức.

### 3. HOẠT ĐỘNG 3: LUYỆN TẬP, THỰC HÀNH (10-12 phút)
- **Mục tiêu:** Vận dụng trực tiếp kiến thức vừa học để giải quyết các bài tập, tình huống cụ thể trong SGK.
- **Cách thức tiến hành:** Thực hiện trên phiếu học tập/bảng con, chia sẻ nhận xét tương hỗ giữa học sinh.

### 4. HOẠT ĐỘNG 4: VẬN DỤNG, TRẢI NGHIỆM (3-5 phút)
- **Mục tiêu:** Mở rộng liên hệ thực tiễn đời sống gia đình, trường học, ứng dụng Năng lực số & Kỹ năng sống.
- **Cách thức tiến hành:** Tình huống thực tế, dặn dò chuẩn bị bài sau.

## IV. ĐIỀU CHỈNH SAU BÀI DẠY (Dành cho giáo viên ghi chú sau tiết học)
- Những điểm thành công / Học sinh cần hỗ trợ thêm / Kinh nghiệm rút ra.
`;
      }
    } else {
      // SECONDARY & HIGH SCHOOL CV 5512/BGDĐT-GDTrH
      if (selectedAppendix === 'PL1') {
        appendixTitle = 'PHỤ LỤC 1: KẾ HOẠCH DẠY HỌC MÔN HỌC CỦA TỔ CHUYÊN MÔN (CV 5512)';
        appendixStructureInstructions = `
BẮT BUỘC TRÌNH BÀY ĐÚNG CẤU TRÚC PHỤ LỤC 1 THEO MẪU SỞ GD&ĐT HÀ NỘI & CÔNG VĂN 5512:

TRƯỜNG THCS PHÙNG KHẮC KHOAN          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
TỔ: ${departmentName.toUpperCase()}                   Độc lập - Tự do - Hạnh phúc

# PHỤ LỤC 1: KẾ HOẠCH DẠY HỌC MÔN HỌC/HOẠT ĐỘNG GIÁO DỤC
**(Năm học ${academicYear})**

Môn/Hoạt động giáo dục: ${profile.mon.toUpperCase()} | Khối lớp: ${profile.lop}
Tổ/nhóm chuyên môn: ${departmentName}
- Số tiết Học kỳ I: ${k1P} tiết (18 tuần)
- Số tiết Học kỳ II: ${k2P} tiết (17 tuần)
- Tổng số tiết Cả năm: ${totP} tiết (35 tuần)

## I. ĐẶC ĐIỂM TÌNH HÌNH
1. Số lớp, số học sinh: Khối lớp: ${profile.lop} ; Số học sinh: ${profile.siso} HS/lớp.
2. Tình hình đội ngũ: Số giáo viên: ${profile.soGiaoVien || '05 giáo viên'} ; Trình độ đào tạo: ${profile.trinhDoDaoTao || '100% Đạt chuẩn và trên chuẩn'}.
3. Thiết bị dạy học:
| STT | Thiết bị dạy học | Số lượng | Bài/chủ đề sử dụng | Ghi chú |
|---|---|---|---|---|
| 1 | ${profile.thietBiDayHoc || 'Máy tính, Tivi trình chiếu, Màn hình tương tác'} | 01 bộ / phòng | Các bài học ứng dụng CNTT, Năng lực số, AI | Dùng chung |
| 2 | Bộ đồ dùng thí nghiệm / Thước kẻ - Compa - Êke / Mô hình | Đủ theo từng bài | Các bài học thực hành, khám phá kiến thức | Chuẩn SGK |

4. Phòng học bộ môn/phòng chức năng: ${profile.phongHocBoMon || 'Phòng học bộ môn, Phòng Máy tính kết nối Internet tốc độ cao'}.

## II. KẾ HOẠCH DẠY HỌC
### 1. Phân phối chương trình chi tiết (35 tuần - ${totP} tiết)
${
  isMathSubject || isMathParallelMode
    ? `QUY TẮC CỨNG BẮT BUỘC ĐỐI VỚI MÔN TOÁN THCS (PHÂN PHỐI DẠY SONG SONG 2 ĐẠI + 2 HÌNH TRONG 1 TUẦN, ĐỦ 35 TUẦN, ĐỦ 140 TIẾT):
- CƠ CHẾ DẠY SONG SONG 2 ĐẠI + 2 HÌNH TRONG 1 TUẦN (Tổng 4 tiết/tuần):
  + Tuần 1: Đại số tiết 1, 2; Hình học tiết 1, 2.
  + Tuần 2: Đại số tiết 3, 4; Hình học tiết 3, 4.
  + Đại số đếm tiết liên tục từ tiết 1 đến tiết 70 (Học kỳ I: Tiết 1 - 36; Học kỳ II: Tiết 37 - 70).
  + Hình học & Đo lường đếm tiết liên tục từ tiết 1 đến tiết 70 (Học kỳ I: Tiết 1 - 36; Học kỳ II: Tiết 37 - 70).
- QUY MÔ SỐ TIẾT:
  + Học kỳ I: 18 tuần = 72 tiết (36 tiết Đại số + 36 tiết Hình học).
  + Học kỳ II: 17 tuần = 68 tiết (34 tiết Đại số + 34 tiết Hình học).
  + Cả năm: 35 tuần = 140 tiết (70 tiết Đại số + 70 tiết Hình học).
- LỊCH KIỂM TRA ĐỊNH KỲ:
  + Tuần 8: Ôn tập giữa kì I & Kiểm tra ĐGĐK Giữa kì I.
  + Tuần 16: Ôn tập cuối kì I & Kiểm tra ĐGĐK Cuối kì I.
  + Tuần 26: Ôn tập giữa kì II & Kiểm tra ĐGĐK Giữa kì II.
  + Tuần 31: Ôn tập cuối kì II & Kiểm tra ĐGĐK Cuối kì II.

#### HỌC KỲ I (18 tuần = 72 tiết: 36 Đại + 36 Hình)
| Tuần | Phân môn Đại số / Số học (2 tiết/tuần) | Tiết PPCT Đại | Phân môn Hình học & Đo lường (2 tiết/tuần) | Tiết PPCT Hình | Yêu cầu cần đạt & Nội dung tích hợp |
|:---:|:---|:---:|:---|:---:|:---|
| Tuần 1 | Bài 1: Tập hợp các số hữu tỉ | Tiết 1, 2 | Bài 8: Góc ở vị trí đặc biệt. Tia phân giác của một góc | Tiết 1, 2 | Năng lực số & AI |
| ... | (Lập đầy đủ chi tiết từ Tuần 1 đến Tuần 18) | | | | |

#### HỌC KỲ II (17 tuần = 68 tiết: 34 Đại + 34 Hình)
| Tuần | Phân môn Đại số / Số học (2 tiết/tuần) | Tiết PPCT Đại | Phân môn Hình học & Đo lường (2 tiết/tuần) | Tiết PPCT Hình | Yêu cầu cần đạt & Nội dung tích hợp |
|:---:|:---|:---:|:---|:---:|:---|
| Tuần 19 | Bài ... | Tiết 37, 38 | Bài ... | Tiết 37, 38 | Bảo vệ Môi trường & QPAN |
| ... | (Lập đầy đủ chi tiết từ Tuần 19 đến Tuần 35) | | | | |
`
    : `
#### HỌC KỲ I (${k1P} tiết - 18 tuần)
| STT | Bài học/Chủ đề | Số tiết | Yêu cầu cần đạt | NỘI DUNG TÍCH HỢP/GIÁO DỤC |
|---|---|---|---|---|
| 1 | Bài 1: ... | 2 | ... | Tên nội dung tích hợp: Năng lực số & AI\nNội dung/biểu hiện: Khai thác dữ liệu số an toàn |
| ... | (Liệt kê đủ các bài HK1) | | | |

#### HỌC KỲ II (${k2P} tiết - 17 tuần)
| STT | Bài học/Chủ đề | Số tiết | Yêu cầu cần đạt | NỘI DUNG TÍCH HỢP/GIÁO DỤC |
|---|---|---|---|---|
| 1 | Bài ... | 2 | ... | Tên nội dung tích hợp: Bảo vệ Môi trường & QPAN\nNội dung/biểu hiện: Vận dụng kiến thức thực tế |
| ... | (Liệt kê đủ các bài HK2) | | | |
`
}

### 2. Kiểm tra, đánh giá định kỳ
| Bài kiểm tra, đánh giá | Thời gian | Thời điểm (tuần) | Yêu cầu cần đạt | Hình thức |
|---|---|---|---|---|
| Giữa học kỳ I | 60 phút | ${weekMidterm1} | Căn cứ ma trận/đặc tả đề kiểm tra theo chương trình tuần 1-8 | Trắc nghiệm + Tự luận |
| Cuối học kỳ I | 90 phút | ${weekFinal1} | Căn cứ ma trận/đặc tả đề kiểm tra đánh giá toàn bộ HK I | Trắc nghiệm + Tự luận |
| Giữa học kỳ II | 60 phút | ${weekMidterm2} | Căn cứ ma trận/đặc tả đề kiểm tra theo chương trình tuần 19-26 | Trắc nghiệm + Tự luận |
| Cuối học kỳ II | 90 phút | ${weekFinal2} | Căn cứ ma trận/đặc tả đề kiểm tra đánh giá tổng hợp cả năm học | Trắc nghiệm + Tự luận |

## III. DANH MỤC NỘI DUNG TÍCH HỢP/GIÁO DỤC THEO ĐỊNH HƯỚNG
| STT | Nội dung tích hợp/giáo dục | Gợi ý thể hiện trong kế hoạch |
|---|---|---|
| 1 | Văn hóa học đường gắn với đổi mới căn bản, toàn diện giáo dục | Tích hợp thiết thực trong môn học, góp phần xây dựng môi trường lành mạnh |
| 2 | Giáo dục quyền con người | Thực hiện theo khung nội dung GD quyền con người phù hợp lứa tuổi |
| 3 | Tư tưởng, đạo đức, phong cách Hồ Chí Minh | Tích hợp thiết thực qua các bài học và hoạt động giáo dục |
| 4 | Phòng, chống tham nhũng, lãng phí và giáo dục đạo đức liêm chính | Lồng ghép phù hợp với bài học, tình huống thực tế |
| 5 | Giáo dục STEM, nghiên cứu khoa học, đổi mới sáng tạo | Tích hợp qua bài học, chủ đề, hoạt động thực hành, dự án |
| 6 | Bình đẳng giới; chăm sóc mắt và phòng, chống mù, lòa | Lựa chọn nội dung phù hợp với đặc điểm môn học |
| 7 | Bảo tồn văn hóa dân tộc; chủ quyền biên giới, biển đảo; QPAN | Tích hợp phù hợp với nội dung môn học và hoạt động |
| 8 | Sử dụng năng lượng tiết kiệm; bảo vệ môi trường; đa dạng sinh học | Khai thác số liệu, tình huống, vấn đề thực tiễn |
| 9 | Ứng phó biến đổi khí hậu, giảm nhẹ thiên tai | Tích hợp qua tình huống, dữ liệu và hoạt động học tập |
| 10 | Giáo dục qua di sản | Khai thác di sản phù hợp nội dung địa phương |
| 11 | Tăng cường năng lực số, kỹ năng chuyển đổi số & AI | Tích hợp khi HS khai thác, xử lý, tạo lập dữ liệu hoặc dùng công cụ số/AI |
| 12 | Kiến thức pháp luật về an toàn giao thông đường bộ | Lồng ghép hướng dẫn phù hợp, xác định rõ bài học thực hiện |

Tây Phương, ngày     tháng     năm 2026
| **XÁC NHẬN BGH (DUYỆT)** | **DUYỆT CỦA TỔ CM** | **NGƯỜI LẬP KẾ HOẠCH** |
|:---:|:---:|:---:|
| *(Ký, đóng dấu)* | *(Ký, ghi rõ họ tên)* | *(Ký, ghi rõ họ tên)* |
| <br/>**${bghSigner}** | <br/>**${departmentSigner}** | <br/>**${teacherName}** |
`;
      } else if (selectedAppendix === 'PL2') {
        appendixTitle = 'PHỤ LỤC 2: KHUNG KẾ HOẠCH TỔ CHỨC CÁC HOẠT ĐỘNG GIÁO DỤC CỦA TỔ CHUYÊN MÔN (CV 5512)';
        appendixStructureInstructions = `
BẮT BUỘC TRÌNH BÀY ĐÚNG CẤU TRÚC PHỤ LỤC 2 THEO MẪU SỞ GD&ĐT HÀ NỘI & CÔNG VĂN 5512:

TRƯỜNG THCS PHÙNG KHẮC KHOAN          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
TỔ: ${departmentName.toUpperCase()}                   Độc lập - Tự do - Hạnh phúc

# KẾ HOẠCH TỔ CHỨC CÁC HOẠT ĐỘNG GIÁO DỤC CỦA TỔ CHUYÊN MÔN
**MÔN: ${profile.mon.toUpperCase()} | NĂM HỌC: ${academicYear}**

## 1. Quy mô học sinh
| Khối 6 (Số lớp / Số HS) | Khối 7 (Số lớp / Số HS) | Khối 8 (Số lớp / Số HS) | Khối 9 (Số lớp / Số HS) |
|---|---|---|---|
| 04 lớp / 160 HS | 04 lớp / 155 HS | 04 lớp / 150 HS | 04 lớp / 145 HS |

## 2. Các hoạt động giáo dục
BẢNG CÁC CHỦ ĐỀ CÂU LẠC BỘ, TRẢI NGHIỆM, NGOẠI KHÓA, DỰ ÁN HỌC TẬP (MÔN ${profile.mon.toUpperCase()}):
| STT | Chủ đề | Yêu cầu cần đạt | Số tiết | Thời điểm | Địa điểm | Chủ trì | Phối hợp | Điều kiện thực hiện |
|---|---|---|---|---|---|---|---|---|
| 1 | Câu lạc bộ Em yêu AI & Khoa học số | Thành thạo công cụ AI học tập an toàn, trung thực, có đạo đức số | 8 | HK1 & HK2 | Phòng Máy tính | Giáo viên Tin / KHTN | Đoàn Đội | Máy tính, Internet |
| 2 | Ngày hội STEM & Sáng tạo Số | Thiết kế sản phẩm STEM tích hợp bảo vệ môi trường & biển đảo | 4 | Tuần 20 | Sân trường / Đa năng | Tổ Chuyên môn | BGH, PHHS | Học liệu STEM |
| 3 | Chuyên đề Giáo dục QPAN & Chuyển đổi số an toàn | Hiểu biết an ninh mạng, kỹ năng tự vệ trên không gian số | 2 | Tuần 12 | Hội trường | GV QPAN / CN | Công an địa phương | Tivi, Video |

Tây Phương, ngày     tháng     năm 2026
| **DUYỆT CỦA BGH** | **TỔ TRƯỜNG CHUYÊN MÔN** |
|:---:|:---:|
| *(Ký, đóng dấu)* | *(Ký, ghi rõ họ tên)* |
| <br/>**${bghSigner}** | <br/>**${departmentSigner}** |
`;
      } else {
        appendixTitle = 'PHỤ LỤC 3: KẾ HOẠCH GIÁO DỤC CỦA GIÁO VIÊN (CV 5512)';
        appendixStructureInstructions = `
BẮT BUỘC TRÌNH BÀY ĐÚNG CẤU TRÚC PHỤ LỤC 3 THEO MẪU TRƯỜNG THCS PHÙNG KHẮC KHOAN:

UBND XÃ TÂY PHƯƠNG                     CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
TRƯỜNG THCS PHÙNG KHẮC KHOAN              Độc lập – Tự do – Hạnh phúc
Số:   /KH-THCSPKK

# KẾ HOẠCH DẠY HỌC MÔN: ${profile.mon.toUpperCase()}
**(NĂM HỌC ${academicYear})**

Căn cứ Thông tư số 32/2018/TT-BGDĐT; Thông tư số 22/2021/TT-BGDĐT; Công văn 5512/BGDĐT-GDTrH;
Trường THCS Phùng Khắc Khoan xây dựng Kế hoạch dạy học môn ${profile.mon} cụ thể như sau:

## I. MỤC ĐÍCH, YÊU CẦU
- Thực hiện kế hoạch dạy học môn học theo đúng khung thời gian 35 tuần thực học (HK I: 18 tuần, HK II: 17 tuần, Tổng cả năm 140 tiết).
- Tích hợp Năng lực số (TT 02/2025/TT-BGDĐT), AI (QĐ 3439/QĐ-BGDĐT), STEM & QPAN.

## II. NỘI DUNG
### 1. MÔN HỌC: ${profile.mon.toUpperCase()} - KHỐI ${profile.lop}
Kế hoạch dạy học (Phân phối chương trình): Cả năm 35 tuần | Học kì I: 18 tuần (72 tiết) | Học kì II: 17 tuần (68 tiết)

BẢNG PHÂN PHỐI CHƯƠNG TRÌNH CÁ NHÂN GIÁO VIÊN (${teacherName}):
| STT | Bài dạy (1) | Số tiết (2) | Tiết thứ (3) | Thời điểm (4) | Thiết bị dạy học (5) | Địa điểm dạy học (6) | Ghi chú (7) |
|---|---|---|---|---|---|---|---|
| 1 | Bài 1: Tập hợp các số hữu tỉ | 2 | 1, 2 | Tuần 1 | Máy tính, Tivi, Phiếu học tập | Phòng học lớp | Năng lực số, AI |
| 2 | Bài 8: Góc ở vị trí đặc biệt. Tia phân giác của một góc | 2 | 1, 2 | Tuần 1 | Thước kẻ, Compa, Máy tính | Phòng học lớp | Dạy song song Hình |
| ... | (Liệt kê chi tiết đủ các bài trong 35 tuần) | | | | | | |

## III. TỔ CHỨC THỰC HIỆN
1. Ban giám hiệu nhà trường: Kiểm tra, đôn đốc phê duyệt kế hoạch.
2. Giáo viên (${teacherName}): Thực hiện nghiêm túc kế hoạch đã phê duyệt.

Tây Phương, ngày     tháng     năm 2026
| **DUYỆT CỦA BGH** | **TỔ TRƯỜNG CHUYÊN MÔN** | **NGƯỜI LẬP KẾ HOẠCH** |
|:---:|:---:|:---:|
| *(Ký, đóng dấu)* | *(Ký, ghi rõ họ tên)* | *(Ký, ghi rõ họ tên)* |
| <br/>**${bghSigner}** | <br/>**${departmentSigner}** | <br/>**${teacherName}** |
`;
      }
    }

    const draftPromptSection = draftAppendixText.trim()
      ? `
=== DỮ LIỆU NGUỒN PHỤ LỤC GỐC / ĐANG LÀM CỦA GIÁO VIÊN CẦN GIỮ NGUYÊN BẢN VÀ TÍCH HỢP ===
${draftAppendixText.slice(0, 30000)}

QUY TẮC CỐT LÕI ĐỐI VỚI NGUỒN PHỤ LỤC GỐC ĐÃ ĐƯỢC ĐƯA LÊN:
1. BẢO TỒN NGUYÊN VẸN 100% TOÀN BỘ NỘI DUNG GỐC: Tên bài dạy, phân phối chương trình, số tiết, tiết PPCT, số tuần, tên trường, tên tổ, tên giáo viên và định dạng bảng.
2. TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ Ý THAY ĐỔI, TÓM TẮT, ĐỔI TÊN BÀI HỌC HOẶC BỎ BỚT BẤT KỲ DÒNG/CỘT NÀO CỦA FILE GỐC.
3. CHỈ TÍCH HỢP THÊM: Điền các nội dung, địa chỉ tích hợp Năng lực số (TT 02/2025/TT-BGDĐT), AI (QĐ 3439/QĐ-BGDĐT), STEM, QPAN, Môi trường, Kỹ năng sống vào cột Yêu cầu cần đạt / Thiết bị dạy học và bổ sung Mục III (Danh mục nội dung tích hợp).
=== KẾT THÚC DỮ LIỆU NGUỒN PHỤ LỤC GỐC ===
`
      : '';

    const prompt = `ĐÓNG VAI CHUYÊN GIA SƯ PHẠM VÀ TỔ TRƯỜNG CHUYÊN MÔN CAO CẤP SỞ GD&ĐT HÀ NỘI.
Hãy xây dựng Kế hoạch Giáo dục chuẩn khung Công văn 5512/BGDĐT-GDTrH hoặc 2345/BGDĐT-GDTH: ${appendixTitle}.

LƯU Ý CỰC KỲ QUAN TRỌNG VỀ MÔN HỌC (QUY TẮC CỨNG):
- MÔN HỌC YÊU CẦU LẬP KẾ HOẠCH NÀY LÀ MÔN: ${profile.mon.toUpperCase()} (KHOẢNG LỚP ${profile.lop}).
- BẮT BUỘC toàn bộ danh mục bài học, phân phối chương trình, yêu cầu cần đạt, tổ chuyên môn (${departmentName}) phải thuộc ĐÚNG MÔN ${profile.mon.toUpperCase()} (Bộ sách ${profile.boSach || 'Kết nối tri thức với cuộc sống'}).
- TUYỆT ĐỐI KHÔNG ĐƯỢC ĐỔI SANG MÔN KHÁC nếu môn được thiết lập là môn ${profile.mon.toUpperCase()}.
- NẾU CÓ DỮ LIỆU FILE NGUỒN ĐÃ ĐƯA LÊN: BẮT BUỘC GIỮ NGUYÊN 100% NỘI DUNG, BÀI HỌC, SỐ TIẾT VÀ ĐỊNH DẠNG CỦA FILE ĐÓ, CHỈ ĐIỀN THÊM CÁC CHỈ BÁO NĂNG LỰC SỐ, AI VÀ STEM VÀO CỘT TƯƠNG ỨNG VÀ MỤC III.

THÔNG TIN ĐƠN VỊ & MÔN HỌC:
- Trường: ${schoolName}
- Tổ chuyên môn: ${departmentName}
- Giáo viên: ${teacherName}
- Môn học: ${profile.mon} (${profile.phan_mon}) | Lớp: ${profile.lop} | Bộ sách: ${profile.boSach || 'Kết nối tri thức với cuộc sống'}
- Thời lượng: ${profile.thoiluong} | Năm học: ${academicYear} | ${semester}

CÁC NỘI DUNG TÍCH HỢP BẮT BUỘC ĐƯỢC LỒNG GHÉP VÀO BẢNG KHGD & YÊU CẦU CẦN ĐẠT:
${integrationsList.map(item => `- ${item}`).join('\n')}
${specificGoals ? `
CHỈ BÁO NĂNG LỰC SỐ, KHUNG GD AI & YÊU CẦU SƯ PHẠM ĐẶC THÙ (TỪ TAB 1):
${specificGoals}
` : ''}

${profile.appendixCustomPrompt ? `
YÊU CẦU BỔ SUNG RIÊNG TỪ GIÁO VIÊN/NHÀ TRƯỜNG CHO PHỤ LỤC NÀY:
${profile.appendixCustomPrompt}
` : ''}

${draftPromptSection}

${appendixStructureInstructions}

THAM CHIẾU DỮ LIỆU TỪ HỆ THỐNG / SGK / TÀI LIỆU UP LÊN:
${referenceCacheText.slice(0, 30000)}

QUY TẮC BẮT BUỘC:
0. CẤU TRÚC ĐẦU RA (TUYỆT ĐỐI KHÔNG LỜI DẪN NHẬP):
   TUYỆT ĐỐI KHÔNG VIẾT LỜI MỞ ĐẦU, LỜI CHÀO HỎI, LỜI DẪN HOẶC TỰ GIỚI THIỆU VAI TRÒ. BẮT ĐẦU NGAY BẰNG DÒNG TIÊU ĐỀ CHÍNH BẰNG DẤU #.
1. XUẤT ĐẦY ĐỦ 100% CẢ 35 TUẦN HỌC, ĐỦ TỪNG TIẾT VÀ ĐẦY ĐỦ NỘI DUNG:
   - BẮT BUỘC lập bảng chi tiết từ Tuần 1 đến Tuần 35 (Học kỳ I: Tuần 1 đến Tuần 18; Học kỳ II: Tuần 19 đến Tuần 35).
   - TUYỆT ĐỐI KHÔNG được tóm tắt, KHÔNG được nhảy cóc (như ghi "Tuần 3 ... Tuần 17"), KHÔNG ghi "...tương tự". Mọi tuần đều phải có đầy đủ tên bài học, số tiết, tiết PPCT, yêu cầu cần đạt và địa chỉ tích hợp Năng lực số / AI / STEM / QPAN / Môi trường.
2. Đảm bảo ngôn ngữ Tiếng Việt sư phạm chuẩn mực, chuyên nghiệp.
3. Trình bày bằng Markdown sạch đẹp với BẢNG (Table) chuẩn khung 5512 hoặc 2345.
4. BẮT BUỘC ghi rõ địa chỉ tích hợp Năng lực số (TT 02/2025/TT-BGDĐT), AI (QĐ 2422/QĐ-BGDĐT), QPAN, Biển đảo, Môi trường, KNS vào cột Yêu cầu cần đạt / Thiết bị dạy học.
5. KHÔNG dùng dấu sao (*) lặp lại thừa thãi, TUYỆT ĐỐI KHÔNG xuất dãy dấu gạch ngang (----) lặp lại liên tục.
`;

    try {
      const result = await generateGeminiText({
        prompt,
        apiKeys,
        maxOutputTokens: 65536
      });
      if (result) {
        let clean = stripIntroductoryChatter(result)
          .replace(/máy chiếu/gi, 'máy tính, tivi')
          .replace(/Máy chiếu/gi, 'Máy tính, tivi')
          .replace(/^[-\s]{10,}$/gm, '---');
        setCurrentContent(clean);
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      alert(`Lỗi khi tạo Kế hoạch Giáo dục: ${errMsg}`);
      if (errMsg.includes('Hạn ngạch') || errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        onOpenApiGuide();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!currentContent) return;
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [isLandscapeMode, setIsLandscapeMode] = useState(true);

  const handleExportWordSingle = (appKey: 'PL1' | 'PL2' | 'PL3') => {
    const text = appKey === 'PL1' ? pl1Content : appKey === 'PL2' ? pl2Content : pl3Content;
    if (!text || !text.trim()) {
      alert(`Chưa có nội dung cho Phụ lục ${appKey}!`);
      return;
    }
    const stdPrefix = planStandard === 'CV2345' ? 'KHGD_2345' : 'KHGD_5512';
    const fileName = `${stdPrefix}_${appKey}_${profile.mon.replace(/\s+/g, '_')}_Lop${profile.lop}.docx`;
    exportMarkdownToWord(text, {
      fileName,
      headerText: `${schoolName} - ${departmentName}`,
      footerText: `KHGD Phụ lục ${appKey} - ${planStandard === 'CV2345' ? 'CV 2345/BGDĐT-GDTH' : 'CV 5512/BGDĐT-GDTrH'}`,
      watermarkText: 'BẢN QUYỀN: THẦY CẤN VĂN TRƯỜNG - 0988.302.636',
      showPageNumbers: true,
      monHoc: profile.mon,
      lop: profile.lop,
      isLandscape: isLandscapeMode
    });
  };

  const handleExportWordAll = () => {
    const parts: string[] = [];
    if (pl1Content.trim()) parts.push(pl1Content.trim());
    if (pl2Content.trim()) parts.push(pl2Content.trim());
    if (pl3Content.trim()) parts.push(pl3Content.trim());

    if (parts.length === 0) {
      alert('Chưa có phụ lục nào được tạo để xuất trọn bộ!');
      return;
    }

    const combined = parts.join('\n\n<div class="page-break"></div>\n\n---\n\n');
    const stdPrefix = planStandard === 'CV2345' ? 'TRON_BO_KHGD_2345' : 'TRON_BO_KHGD_5512';
    const fileName = `${stdPrefix}_${profile.mon.replace(/\s+/g, '_')}_Lop${profile.lop}_${academicYear.replace(/\s+/g, '')}.docx`;

    exportMarkdownToWord(combined, {
      fileName,
      headerText: `${schoolName} - ${departmentName}`,
      footerText: `TRỌN BỘ KHGD (PL1, PL2, PL3) - ${planStandard === 'CV2345' ? 'CV 2345/BGDĐT-GDTH' : 'CV 5512/BGDĐT-GDTrH'}`,
      watermarkText: 'BẢN QUYỀN: THẦY CẤN VĂN TRƯỜNG - 0988.302.636',
      showPageNumbers: true,
      monHoc: profile.mon,
      lop: profile.lop,
      isLandscape: isLandscapeMode
    });
  };

  const handleContentChange = (appKey: 'PL1' | 'PL2' | 'PL3', val: string) => {
    if (appKey === 'PL1') setPl1Content(val);
    else if (appKey === 'PL2') setPl2Content(val);
    else setPl3Content(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                8. Lập Kế hoạch Giáo dục & Phụ lục (CV 2345 Tiểu học & CV 5512 THCS/THPT)
              </h2>
              <p className="text-xs text-slate-400">
                Tự động tích hợp Năng lực số (TT 02/2025), AI (QĐ 3439 & CV 8334), STEM, QPAN, Biển đảo, Môi trường & KNS theo quy định chuẩn Bộ GD&ĐT
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 animate-spin-slow" />
              {isGenerating ? 'Đang AI Thiết kế...' : `Tạo Kế Hoạch ${selectedAppendix} (${planStandard})`}
            </button>
          </div>
        </div>

        {/* Standard Selector Switcher: CV 2345 (Tiểu học) vs CV 5512 (THCS / THPT) */}
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            <span>Chọn Khung Quy Chuẩn Văn Bản Cần Soạn:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPlanStandard('CV2345');
                if (!isManualDept) {
                  setSchoolName('Trường Tiểu học Tây Phương');
                  setSetDepartmentName('Tổ Chuyên môn Khối ' + (profile.lop ? profile.lop.charAt(0) : '1'));
                  setTeacherName('Cô Giáo Tiểu học');
                  setBghSigner('Nguyễn Thị Mai');
                  setDepartmentSigner('Tổ trưởng Khối 1');
                }
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                planStandard === 'CV2345'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🌱 Cấp Tiểu học (Công văn 2345/BGDĐT-GDTH)</span>
            </button>

            <button
              onClick={() => {
                setPlanStandard('CV5512');
                if (!isManualDept) {
                  setSchoolName('Trường THCS Phùng Khắc Khoan');
                  setSetDepartmentName('Tổ Toán - Tin');
                  setTeacherName('Thầy Cấn Văn Trường');
                  setBghSigner('Bùi Sỹ Nghĩa');
                  setDepartmentSigner('Tổ trưởng Chuyên môn');
                }
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                planStandard === 'CV5512'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 ring-1 ring-cyan-400'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🏛️ Cấp THCS & THPT (Công văn 5512/BGDĐT-GDTrH)</span>
            </button>
          </div>
        </div>

        {/* Appendix Switcher adapted to standard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => setSelectedAppendix('PL1')}
            className={`p-3 rounded-lg border text-left transition-all ${
              selectedAppendix === 'PL1'
                ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 ring-1 ring-cyan-500/30'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Phụ lục I</span>
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs font-semibold text-slate-200">
              {planStandard === 'CV2345' ? 'KHGD của Nhà trường (Cấp Tiểu học)' : 'KHGD Môn học của Tổ Chuyên Môn'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {planStandard === 'CV2345'
                ? 'Khung thời gian 35 tuần, cơ cấu tiết Khối 1-5, hoạt động tập thể'
                : 'Phân phối chương trình, Chuyên đề & Đánh giá định kỳ'}
            </div>
          </button>

          <button
            onClick={() => setSelectedAppendix('PL2')}
            className={`p-3 rounded-lg border text-left transition-all ${
              selectedAppendix === 'PL2'
                ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 ring-1 ring-cyan-500/30'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Phụ lục II</span>
              <Users className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs font-semibold text-slate-200">
              {planStandard === 'CV2345' ? 'KHDH Môn học / HĐGD Khối lớp' : 'KH Hoạt động Giáo dục Tổ Chuyên Môn'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {planStandard === 'CV2345'
                ? 'Bảng 35 tuần: Mạch kiến thức, Số tiết, Năng lực số, AI, STEM'
                : 'Chủ đề trải nghiệm, cắm trại, ngoại khóa, CLB AI'}
            </div>
          </button>

          <button
            onClick={() => setSelectedAppendix('PL3')}
            className={`p-3 rounded-lg border text-left transition-all ${
              selectedAppendix === 'PL3'
                ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 ring-1 ring-cyan-500/30'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Phụ lục III</span>
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs font-semibold text-slate-200">
              {planStandard === 'CV2345' ? 'Kế hoạch bài dạy (Giáo án Tiểu học)' : 'Kế hoạch Giáo dục của Giáo viên'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {planStandard === 'CV2345'
                ? 'Mẫu chuẩn 4 hoạt động (Mở đầu - Hình thành - Luyện tập - Vận dụng)'
                : 'Phân phối chương trình cá nhân & Nhiệm vụ khác'}
            </div>
          </button>
        </div>

        {/* Primary School Presets (CV 2345) */}
        {planStandard === 'CV2345' && (
          <div className="bg-gradient-to-r from-emerald-950/90 via-teal-950/80 to-slate-950 p-4 rounded-xl border border-emerald-500/40 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-300">
                    ⚡ Bộ Mẫu Chuẩn Cấp Tiểu Học (Theo CV 2345/BGDĐT-GDTH & Thông tư 27/2020):
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Nạp ngay khung phân phối chương trình 35 tuần Tiếng Việt 1 (210 tiết), Toán 2 (175 tiết), Kế hoạch Nhà trường (PL1), hoặc Giáo án 4 bước (PL3).
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleInstantLoadPrimaryVietnamese1}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-all"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Nạp Tiếng Việt 1 (210 tiết - PL2)</span>
                </button>

                <button
                  onClick={handleInstantLoadPrimaryMath2}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-all"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Nạp Toán 2 (175 tiết - PL2)</span>
                </button>

                <button
                  onClick={handleInstantLoadPrimaryAppendix1}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Nạp Mẫu PL1 Nhà trường</span>
                </button>

                <button
                  onClick={handleInstantLoadPrimaryAppendix3}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Nạp Mẫu PL3 Giáo án 4 bước</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Secondary / High School Math Parallel Stream Preset Banner (CV 5512) */}
        {planStandard === 'CV5512' && (
          <div className="bg-gradient-to-r from-cyan-950/90 via-blue-950/80 to-slate-950 p-4 rounded-xl border border-cyan-500/40 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-cyan-300">
                    ⚡ Bộ Lựa Chọn Mẫu Chuẩn Môn Toán THCS (1 Tuần 2 Đại + 2 Hình Song Song - 140 Tiết - 35 Tuần):
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Quy định cứng: 1 tuần 4 tiết (2 Đại + 2 Hình song song, đếm tiết riêng 1-70). HK1: 72 tiết (18 tuần), HK2: 68 tiết (17 tuần). Kiểm tra tuần 8, 16, 26, 31 (Đủ tiết ôn tập).
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleApplyMathPreset}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-all"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Áp Dụng Cấu Hình Toán 140 Tiết</span>
                </button>

                <button
                  onClick={handleInstantLoadMathTable}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Nạp Bảng 35 Tuần Mẫu</span>
                </button>

                <button
                  onClick={handleInstantLoadCV5512Appendix1}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Mẫu Chuẩn PL1 (Tổ CM)</span>
                </button>

                <button
                  onClick={handleInstantLoadCV5512Appendix2}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Mẫu Chuẩn PL2 (HĐGD/CLB)</span>
                </button>

                <button
                  onClick={handleInstantLoadCV5512Appendix3}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-all"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Mẫu Chuẩn PL3 (Kế Hoạch GV)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reference Data from Tab 2 SGK / System Knowledge */}
        <div className="bg-slate-950/90 p-3.5 rounded-lg border border-cyan-800/40 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Dữ Liệu Tham Chiếu Từ Tab 2 (Sách Giáo Khoa / Phân Phối Chuẩn):</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                referenceCacheText && referenceCacheText.trim()
                  ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {referenceCacheText && referenceCacheText.trim()
                  ? `✓ Đã sẵn sàng (${referenceCacheText.length} ký tự)`
                  : 'Chưa có dữ liệu từ Tab 2 (Có thể nhập hoặc AI tự sinh)'}
              </span>
            </div>

            {referenceCacheText && referenceCacheText.trim() && (
              <button
                onClick={() => setShowReferencePreview(!showReferencePreview)}
                className="px-3 py-1.5 rounded-lg bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-200 font-semibold text-xs border border-cyan-700/60 transition-all flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{showReferencePreview ? 'Ẩn Dữ Liệu Tham Chiếu' : '👁️ Xem Dữ Liệu Tham Chiếu Tab 2'}</span>
              </button>
            )}
          </div>

          {showReferencePreview && referenceCacheText && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Nội dung bộ nhớ tham chiếu (Tổng cộng {referenceCacheText.length.toLocaleString('vi-VN')} ký tự - AI đọc toàn bộ 100%):</span>
              </div>
              <div className="text-[11px] text-slate-300 bg-slate-900 p-3 rounded border border-slate-800 max-h-60 overflow-y-auto font-mono whitespace-pre-wrap leading-relaxed">
                {referenceCacheText}
              </div>
              <p className="text-[11px] text-emerald-400 italic">
                * Toàn bộ {referenceCacheText.length.toLocaleString('vi-VN')} ký tự dữ liệu này được đưa 100% vào Prompt để AI lên kế hoạch dạy học bám sát mục lục, tên bài và yêu cầu cần đạt từ SGK.
              </p>
            </div>
          )}
        </div>

        {/* Upload Existing Draft Section */}
        <div className="bg-slate-950/90 p-3.5 rounded-lg border border-amber-800/40 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <FileUp className="w-4 h-4 text-amber-400" />
              <span>Nguồn Phụ Lục Thô / File Đang Làm (Tải .docx, .txt, .pdf lên để Giữ Nguyên Bản & Tích Hợp Năng Lực):</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-900/40 hover:bg-amber-800/60 text-amber-200 font-semibold text-xs border border-amber-700/60 cursor-pointer transition-all">
                <Upload className="w-3.5 h-3.5" />
                <span>Tải File Phụ Lục (.txt, .docx, .pdf)</span>
                <input type="file" onChange={handleDraftFileUpload} className="hidden" />
              </label>

              <button
                onClick={() => setShowDraftInput(!showDraftInput)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700"
              >
                {showDraftInput ? 'Ẩn Ô Nhập' : 'Mở Ô Nhập / Dán Khung Thô'}
              </button>
            </div>
          </div>

          {(showDraftInput || draftAppendixText) && (
            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              {draftFileName && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-900 p-2.5 rounded border border-slate-800 text-emerald-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-emerald-400" />
                    <span>Đã nạp file: <strong>{draftFileName}</strong> ({draftAppendixText.length.toLocaleString('vi-VN')} ký tự)</span>
                  </div>

                  <button
                    onClick={() => {
                      setDraftAppendixText('');
                      setDraftFileName('');
                    }}
                    className="p-1 text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1 text-[11px]"
                    title="Xóa file đã nạp"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Hủy file</span>
                  </button>
                </div>
              )}

              <textarea
                value={draftAppendixText}
                onChange={e => setDraftAppendixText(e.target.value)}
                rows={3}
                placeholder="Dán hoặc tải lên bản thô phụ lục đang làm của thầy/cô tại đây để chọn 1 trong 2 lựa chọn xử lý bên dưới."
                className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-slate-100 font-mono text-xs focus:border-amber-500 focus:outline-none"
              />

              {/* 2 LỰA CHỌN XỬ LÝ PHỤ LỤC */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* LỰA CHỌN 1 */}
                <div className="bg-gradient-to-br from-slate-900/95 to-emerald-950/30 p-3 rounded-lg border border-emerald-600/50 flex flex-col justify-between space-y-2.5 shadow-sm">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>LỰA CHỌN 1: GIỮ NGUYÊN BẢN 100% FILE ĐƯA LÊN</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-bold text-[10px] border border-emerald-700/50">
                        Chỉ tích hợp Mã chỉ báo
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      Giữ nguyên 100% phân phối chương trình, tên bài học, số tiết, tuần và bảng biểu gốc. <strong>Chỉ lồng ghép các mã chỉ báo chuẩn</strong> Năng lực số (<code className="text-emerald-300 font-mono">[NLS: 1.1TC1a]</code>), AI (<code className="text-cyan-300 font-mono">[AI: 1.A1]</code>), STEM, QPAN vào cột tích hợp và bổ sung Mục III.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
                    <button
                      onClick={() => {
                        if (draftAppendixText?.trim()) {
                          const fixedContent = autoNormalizeVietnameseFont(draftAppendixText);
                          setCurrentContent(fixedContent);
                          setDraftAppendixText(fixedContent);
                          alert(`✅ Đã nạp thành công nội dung file "${draftFileName || 'tải lên'}" vào ${selectedAppendix}! Đã tự động chuẩn hóa toàn bộ font tiếng Việt và giữ nguyên 100% bản gốc.`);
                        } else {
                          alert('Vui lòng tải file hoặc dán nội dung thô trước!');
                        }
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded font-semibold text-xs flex items-center gap-1 shadow transition-all"
                      title="Nạp nguyên bản 100% file gốc vào khung soạn thảo và xem trước A4"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <span>Nạp Giữ Nguyên Bản</span>
                    </button>

                    <button
                      onClick={handleDirectIntegrateDraftFile}
                      className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded font-bold text-xs flex items-center gap-1.5 shadow transition-all"
                      title="Tích hợp các mã chỉ báo Năng lực số [NLS] và AI [AI] vào file này mà vẫn bảo tồn 100% tên bài, số tiết và cấu trúc bảng"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                      <span>Tích Hợp Mã Chỉ Báo (Giữ 100% File)</span>
                    </button>

                    <button
                      onClick={() => {
                        if (!draftAppendixText?.trim()) {
                          alert('Vui lòng tải hoặc dán nội dung trước!');
                          return;
                        }
                        const fixed = autoNormalizeVietnameseFont(draftAppendixText);
                        setDraftAppendixText(fixed);
                        alert('✅ Đã sửa và chuẩn hóa toàn bộ lỗi font tiếng Việt trong văn bản thô thành công!');
                      }}
                      className="px-2.5 py-1.5 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-700/60 rounded font-semibold text-xs flex items-center gap-1 shadow transition-all"
                      title="Tự động sửa lỗi font tiếng Việt (VNI / .VnTime / TCVN3 / Chữ bị lỗi dấu: giòo viờn -> giáo viên, bộ mụn -> bộ môn)"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>🔤 Sửa Lỗi Font</span>
                    </button>

                    <button
                      onClick={() => setIsNlsModalOpen(true)}
                      className="px-2 py-1.5 bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-700/60 rounded font-semibold text-xs flex items-center gap-1"
                      title="Mở bảng tra cứu và chọn các mã chỉ báo Năng lực Số TT 02/2025 & AI QĐ 2422 cụ thể"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Chọn Mã Chỉ Báo</span>
                    </button>
                  </div>
                </div>

                {/* LỰA CHỌN 2 */}
                <div className="bg-gradient-to-br from-slate-900/95 to-blue-950/30 p-3 rounded-lg border border-blue-600/50 flex flex-col justify-between space-y-2.5 shadow-sm">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs">
                        <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>LỰA CHỌN 2: CHUYỂN ĐỔI THEO MẪU 5512/2345</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 font-bold text-[10px] border border-blue-700/50">
                        AI Chuẩn hóa toàn diện
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      Sử dụng AI phân tích danh mục bài học từ file đưa lên và <strong>tái cấu trúc thành bản Kế hoạch Giáo dục hoàn chỉnh 35 tuần</strong> đúng thể thức Công văn 5512 (THCS/THPT) hoặc 2345 (Tiểu học) của Sở GD&ĐT Hà Nội với đầy đủ các mục I, II, III, IV, V.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
                    <button
                      onClick={handleGeneratePlan}
                      disabled={isGenerating}
                      className="w-full px-3 py-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all"
                      title="AI chuyển đổi và biên soạn kế hoạch giáo dục theo mẫu chuẩn 5512/2345 bám sát danh mục bài học của file tải lên"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                      <span>{isGenerating ? 'Đang AI Biên Soạn...' : '⚡ AI Chuẩn Hóa Toàn Diện Theo Mẫu 5512'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Administrative Inputs & Department / Subject / Class Selection (Collapsible Accordion) */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden text-xs transition-all">
          <div
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="flex items-center justify-between p-3.5 bg-slate-900/90 hover:bg-slate-900 cursor-pointer select-none transition-all"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-xs sm:text-sm">
                  1. Cấu Hình Đơn Vị, Tổ Chuyên Môn, Môn Học & Ký Duyệt
                </h3>
                <p className="text-[11px] text-slate-400">
                  {schoolName} • {departmentName} • Môn: {profile.mon} (Lớp {profile.lop}) • {teacherName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline px-2 py-0.5 rounded text-[10px] bg-slate-800 text-cyan-300 font-semibold border border-slate-700">
                {isConfigOpen ? 'Thu gọn' : 'Chỉnh sửa'}
              </span>
              {isConfigOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </div>

          {isConfigOpen && (
            <div className="p-4 space-y-3.5 border-t border-slate-800 bg-slate-950/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Tổ Chuyên Môn */}
                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold flex items-center justify-between">
                    <span>1. Chọn Tổ Chuyên Môn:</span>
                    <span className="text-[10px] text-cyan-400">Chọn hoặc Nhập</span>
                  </label>
                  <select
                    value={departmentName}
                    onChange={e => {
                      setSetDepartmentName(e.target.value);
                      setIsManualDept(true);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-100 font-medium focus:border-cyan-500 focus:outline-none mb-1 cursor-pointer"
                  >
                    <option value="Tổ Khoa học Tự nhiên">Tổ Khoa học Tự nhiên</option>
                    <option value="Tổ Khoa học Xã hội">Tổ Khoa học Xã hội</option>
                    <option value="Tổ Toán - Tin">Tổ Toán - Tin</option>
                    <option value="Tổ Ngữ văn">Tổ Ngữ văn</option>
                    <option value="Tổ Lịch sử & Địa lý">Tổ Lịch sử & Địa lý</option>
                    <option value="Tổ Ngoại ngữ">Tổ Ngoại ngữ</option>
                    <option value="Tổ Nghệ thuật - Thể dục">Tổ Nghệ thuật - Thể dục</option>
                    <option value="Tổ Công nghệ - Nghệ thuật">Tổ Công nghệ - Nghệ thuật</option>
                    <option value={departmentName}>Tự nhập: {departmentName}</option>
                  </select>
                  <input
                    type="text"
                    value={departmentName}
                    onChange={e => {
                      setSetDepartmentName(e.target.value);
                      setIsManualDept(true);
                    }}
                    placeholder="Nhập tên tổ chuyên môn..."
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-cyan-300 font-semibold focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {/* 2. Môn Học */}
                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold flex items-center justify-between">
                    <span>2. Chọn Môn Học:</span>
                    <span className="text-[10px] text-cyan-400">Đồng bộ toàn hệ thống</span>
                  </label>
                  <select
                    value={profile.mon}
                    onChange={e => {
                      onChangeProfile({ ...profile, mon: e.target.value });
                      setIsManualDept(false);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-100 font-medium focus:border-cyan-500 focus:outline-none mb-1 cursor-pointer"
                  >
                    <optgroup label="Môn chung & Tiểu học">
                      <option value="Toán">Toán</option>
                      <option value="Tiếng Việt">Tiếng Việt</option>
                      <option value="Tự nhiên và Xã hội">Tự nhiên và Xã hội (Lớp 1, 2, 3)</option>
                      <option value="Khoa học">Khoa học (Lớp 4, 5)</option>
                      <option value="Lịch sử và Địa lý">Lịch sử và Địa lý</option>
                      <option value="Đạo đức">Đạo đức</option>
                      <option value="Tin học và Công nghệ">Tin học và Công nghệ (Tiểu học)</option>
                      <option value="Hoạt động trải nghiệm">Hoạt động trải nghiệm</option>
                    </optgroup>
                    <optgroup label="THCS & THPT">
                      <option value="Khoa học tự nhiên">Khoa học tự nhiên (Lớp 6-9)</option>
                      <option value="Ngữ văn">Ngữ văn</option>
                      <option value="Tiếng Anh">Tiếng Anh</option>
                      <option value="Tin học">Tin học</option>
                      <option value="Công nghệ">Công nghệ</option>
                      <option value="Giáo dục công dân">Giáo dục công dân</option>
                      <option value="Hoạt động trải nghiệm, hướng nghiệp">Hoạt động trải nghiệm, hướng nghiệp</option>
                      <option value="Âm nhạc">Âm nhạc</option>
                      <option value="Mỹ thuật">Mỹ thuật</option>
                      <option value="Giáo dục thể chất">Giáo dục thể chất</option>
                      <option value="Vật lý">Vật lý</option>
                      <option value="Hóa học">Hóa học</option>
                      <option value="Sinh học">Sinh học</option>
                      <option value="Lịch sử">Lịch sử</option>
                      <option value="Địa lý">Địa lý</option>
                      <option value="Giáo dục Quốc phòng và An ninh">Giáo dục Quốc phòng và An ninh</option>
                    </optgroup>
                    <option value={profile.mon}>Tự nhập: {profile.mon}</option>
                  </select>
                  <input
                    type="text"
                    value={profile.mon}
                    onChange={e => onChangeProfile({ ...profile, mon: e.target.value })}
                    placeholder="Nhập tên môn học..."
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-cyan-300 font-semibold focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {/* 3. Khối Lớp */}
                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold flex items-center justify-between">
                    <span>3. Chọn Khối Lớp:</span>
                    <span className="text-[10px] text-cyan-400">Lớp 1 - 12</span>
                  </label>
                  <select
                    value={profile.lop}
                    onChange={e => onChangeProfile({ ...profile, lop: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-100 font-medium focus:border-cyan-500 focus:outline-none mb-1 cursor-pointer"
                  >
                    <optgroup label="Cấp Tiểu học (CV 2345/BGDĐT)">
                      <option value="1">Lớp 1</option>
                      <option value="2">Lớp 2</option>
                      <option value="3">Lớp 3</option>
                      <option value="4">Lớp 4</option>
                      <option value="5">Lớp 5</option>
                    </optgroup>
                    <optgroup label="Cấp THCS (CV 5512/BGDĐT)">
                      <option value="6">Lớp 6</option>
                      <option value="7">Lớp 7</option>
                      <option value="8">Lớp 8</option>
                      <option value="9">Lớp 9</option>
                    </optgroup>
                    <optgroup label="Cấp THPT (CV 5512/BGDĐT)">
                      <option value="10">Lớp 10</option>
                      <option value="11">Lớp 11</option>
                      <option value="12">Lớp 12</option>
                    </optgroup>
                    <option value={profile.lop}>Tự nhập: {profile.lop}</option>
                  </select>
                  <input
                    type="text"
                    value={profile.lop}
                    onChange={e => onChangeProfile({ ...profile, lop: e.target.value })}
                    placeholder="Nhập khối lớp..."
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-cyan-300 font-semibold focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {/* 4. Bộ Sách Giáo Khoa */}
                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold flex items-center justify-between">
                    <span>4. Bộ Sách Giáo Khoa:</span>
                    <span className="text-[10px] text-cyan-400">Bộ SGK</span>
                  </label>
                  <select
                    value={profile.boSach || 'Kết nối tri thức với cuộc sống'}
                    onChange={e => onChangeProfile({ ...profile, boSach: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-100 font-medium focus:border-cyan-500 focus:outline-none mb-1 cursor-pointer"
                  >
                    <option value="Kết nối tri thức với cuộc sống">Kết nối tri thức với cuộc sống (NXB GDVN)</option>
                    <option value="Cánh Diều">Cánh Diều (NXB ĐH Sư phạm)</option>
                    <option value="Chân trời sáng tạo">Chân trời sáng tạo (NXB GDVN)</option>
                    <option value="Cùng học để phát triển năng lực">Cùng học để phát triển năng lực</option>
                    <option value="Vì sự bình đẳng và dân chủ trong giáo dục">Vì sự bình đẳng và dân chủ trong giáo dục</option>
                    <option value={profile.boSach}>Tự nhập: {profile.boSach}</option>
                  </select>
                  <input
                    type="text"
                    value={profile.boSach || ''}
                    onChange={e => onChangeProfile({ ...profile, boSach: e.target.value })}
                    placeholder="Nhập tên bộ sách..."
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-cyan-300 font-semibold focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-800/80">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Tên Trường Học:</label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={e => setSchoolName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Giáo Viên Soạn:</label>
                  <input
                    type="text"
                    value={teacherName}
                    onChange={e => setTeacherName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-amber-300 mb-1 font-semibold">BGH Duyệt (Ký tên):</label>
                  <input
                    type="text"
                    value={bghSigner}
                    onChange={e => setBghSigner(e.target.value)}
                    placeholder="VD: Hiệu trưởng Bùi Sỹ Nghĩa"
                    className="w-full bg-slate-900 border border-amber-800/60 rounded p-1.5 text-amber-200 font-medium focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-cyan-300 mb-1 font-semibold">Tổ Trưởng CM Duyệt:</label>
                  <input
                    type="text"
                    value={departmentSigner}
                    onChange={e => setDepartmentSigner(e.target.value)}
                    placeholder="VD: Tổ trưởng Nguyễn Thị Mai"
                    className="w-full bg-slate-900 border border-cyan-800/60 rounded p-1.5 text-cyan-200 font-medium focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Năm Học / Học Kỳ:</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={academicYear}
                      onChange={e => setTeacherAcademicYear(e.target.value)}
                      className="w-1/2 bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-100 focus:border-cyan-500 focus:outline-none"
                      placeholder="2026 - 2027"
                    />
                    <input
                      type="text"
                      value={semester}
                      onChange={e => setSemester(e.target.value)}
                      className="w-1/2 bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-100 focus:border-cyan-500 focus:outline-none"
                      placeholder="Học kỳ I & II"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scheduling & Topic Distribution Parameters Panel (Collapsible Accordion) */}
        <div className="bg-slate-950 rounded-xl border border-cyan-900/60 overflow-hidden text-xs transition-all">
          <div
            onClick={() => setIsScheduleOpen(!isScheduleOpen)}
            className="flex items-center justify-between p-3.5 bg-slate-900/90 hover:bg-slate-900 cursor-pointer select-none transition-all"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-xs sm:text-sm">
                  2. Lịch Kiểm Tra Định Kỳ & Tỷ Lệ Mạch Kiến Thức (CV 5512 / CV 2345)
                </h3>
                <p className="text-[11px] text-slate-400">
                  GK1: {weekMidterm1} • CK1: {weekFinal1} • GK2: {weekMidterm2} • CK2: {weekFinal2} • Tổng {periodsTotalYear} tiết
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline px-2 py-0.5 rounded text-[10px] bg-slate-800 text-emerald-300 font-semibold border border-slate-700">
                {isScheduleOpen ? 'Thu gọn' : 'Tùy chỉnh'}
              </span>
              {isScheduleOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </div>

          {isScheduleOpen && (
            <div className="p-4 space-y-3 border-t border-slate-800 bg-slate-950/60">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Giữa Kỳ I (Tuần):</label>
                  <input
                    type="text"
                    value={weekMidterm1}
                    onChange={e => setWeekMidterm1(e.target.value)}
                    placeholder="Tuần 8"
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-cyan-300 font-semibold focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Cuối Kỳ I (Tuần):</label>
                  <input
                    type="text"
                    value={weekFinal1}
                    onChange={e => setWeekFinal1(e.target.value)}
                    placeholder="Tuần 16"
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-cyan-300 font-semibold focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Giữa Kỳ II (Tuần):</label>
                  <input
                    type="text"
                    value={weekMidterm2}
                    onChange={e => setWeekMidterm2(e.target.value)}
                    placeholder="Tuần 26"
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-cyan-300 font-semibold focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Cuối Kỳ II (Tuần):</label>
                  <input
                    type="text"
                    value={weekFinal2}
                    onChange={e => setWeekFinal2(e.target.value)}
                    placeholder="Tuần 31"
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-cyan-300 font-semibold focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-900">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Tổng Tiết Học Kỳ I:</label>
                  <input
                    type="text"
                    value={periodsSemester1}
                    onChange={e => setPeriodsSemester1(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-amber-300 font-mono font-bold focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Tổng Tiết Học Kỳ II:</label>
                  <input
                    type="text"
                    value={periodsSemester2}
                    onChange={e => setPeriodsSemester2(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-amber-300 font-mono font-bold focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Tổng Tiết Cả Năm (35 Tuần):</label>
                  <input
                    type="text"
                    value={periodsTotalYear}
                    onChange={e => setPeriodsTotalYear(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-emerald-400 font-mono font-bold focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-slate-900">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">% Đại Số / Số Học:</label>
                  <input
                    type="text"
                    value={ratioAlgebra}
                    onChange={e => setRatioAlgebra(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-100 font-semibold focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">% Hình Học & Đo Lường:</label>
                  <input
                    type="text"
                    value={ratioGeometry}
                    onChange={e => setRatioGeometry(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-100 font-semibold focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">% Thống Kê & Xác Suất:</label>
                  <input
                    type="text"
                    value={ratioStats}
                    onChange={e => setRatioStats(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-100 font-semibold focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">% Trải Nghiệm / Ôn Tập:</label>
                  <input
                    type="text"
                    value={ratioExperiential}
                    onChange={e => setRatioExperiential(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-100 font-semibold focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Integration Modules Selectors (Collapsible Accordion) */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden text-xs transition-all">
          <div
            onClick={() => setIsIntegrationsOpen(!isIntegrationsOpen)}
            className="flex items-center justify-between p-3.5 bg-slate-900/90 hover:bg-slate-900 cursor-pointer select-none transition-all"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-xs sm:text-sm">
                  3. Tích Hợp Chuyên Đề Bắt Buộc (Năng Lực Số, AI, STEM, QPAN, Biển Đảo)
                </h3>
                <p className="text-[11px] text-slate-400">
                  {integrateNLS ? '✓ Năng lực số (TT 02/2025)' : ''} {integrateAI ? '• ✓ AI (QĐ 3439)' : ''} {integrateSTEM ? '• ✓ STEM' : ''} {integrateQPAN ? '• ✓ QPAN' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline px-2 py-0.5 rounded text-[10px] bg-slate-800 text-indigo-300 font-semibold border border-slate-700">
                {isIntegrationsOpen ? 'Thu gọn' : 'Chọn chuyên đề'}
              </span>
              {isIntegrationsOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </div>

          {isIntegrationsOpen && (
            <div className="p-4 space-y-3 border-t border-slate-800 bg-slate-950/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                <label className="flex items-center gap-2 text-slate-200 cursor-pointer bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-all">
                  <input
                    type="checkbox"
                    checked={integrateNLS}
                    onChange={e => setIntegrateNLS(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span className="font-medium">Năng lực Số (Thông tư 02/2025)</span>
                </label>

                <label className="flex items-center gap-2 text-slate-200 cursor-pointer bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-all">
                  <input
                    type="checkbox"
                    checked={integrateAI}
                    onChange={e => setIntegrateAI(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span className="font-medium">Trí tuệ Nhân tạo AI (QĐ 3439 & CV 8334)</span>
                </label>

                <label className="flex items-center gap-2 text-slate-200 cursor-pointer bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-all">
                  <input
                    type="checkbox"
                    checked={integrateSTEM}
                    onChange={e => setIntegrateSTEM(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span className="font-medium">Dạy học Liên môn / STEM / STEAM</span>
                </label>

                <label className="flex items-center gap-2 text-slate-200 cursor-pointer bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-all">
                  <input
                    type="checkbox"
                    checked={integrateQPAN}
                    onChange={e => setIntegrateQPAN(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span className="font-medium">Giáo dục Quốc phòng & An ninh (QPAN)</span>
                </label>

                <label className="flex items-center gap-2 text-slate-200 cursor-pointer bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-all">
                  <input
                    type="checkbox"
                    checked={integrateEnv}
                    onChange={e => setIntegrateEnv(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span className="font-medium">Bảo vệ Môi trường & Biển đảo</span>
                </label>

                <label className="flex items-center gap-2 text-slate-200 cursor-pointer bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-all">
                  <input
                    type="checkbox"
                    checked={integrateLifeSkills}
                    onChange={e => setIntegrateLifeSkills(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span className="font-medium">Kĩ năng sống & Công dân Số</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Custom Requirements for Appendix Input */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-purple-900/60 space-y-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-purple-300 font-bold text-xs flex items-center gap-1.5">
              <span>📝 Yêu Cầu Bổ Sung Riêng Cho Phụ Lục:</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsNlsModalOpen(true)}
                className="px-3 py-1 bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold rounded-lg text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>✨ Chọn Nhanh Chỉ Báo Năng Lực Số & Khung Giáo Dục AI (TT 02/2025 & QĐ 2422)</span>
              </button>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-semibold">Tùy chọn</span>
            </div>
          </div>
          <textarea
            value={profile.appendixCustomPrompt || ''}
            onChange={e => onChangeProfile({ ...profile, appendixCustomPrompt: e.target.value })}
            rows={2}
            placeholder="Nhập các yêu cầu riêng cho Phụ lục (VD: Bổ sung chỉ tiêu học sinh giỏi, phương án dạy phụ đạo học sinh yếu, phân bổ tiết thực hành tại phòng Lab, chỉ đạo chuyên đề riêng của môn...)"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-medium focus:border-purple-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Modal for Digital Competency & AI Education Framework Selection */}
      <DigitalCompetencyAndAISelectorModal
        isOpen={isNlsModalOpen}
        onClose={() => setIsNlsModalOpen(false)}
        onApply={(textToInsert) => {
          onChangeProfile({
            ...profile,
            appendixCustomPrompt: (profile.appendixCustomPrompt ? profile.appendixCustomPrompt + '\n\n' : '') + textToInsert
          });
        }}
        onIntegrateDirectly={handleDirectIntegrateCompetencies}
        directIntegrateLabel={`Tích Hợp Vào ${selectedAppendix} (Giữ Nguyên Bản)`}
        subjectName={profile.mon}
        gradeName={profile.lop}
      />

      {/* Appendix Rich Document Preview & Editor */}
      <AppendixDocumentPreview
        pl1Content={pl1Content}
        pl2Content={pl2Content}
        pl3Content={pl3Content}
        selectedAppendix={selectedAppendix}
        onSelectAppendix={setSelectedAppendix}
        onChangeContent={handleContentChange}
        planStandard={planStandard}
        schoolName={schoolName}
        departmentName={departmentName}
        teacherName={teacherName}
        bghSigner={bghSigner}
        departmentSigner={departmentSigner}
        academicYear={academicYear}
        monHoc={profile.mon}
        lop={profile.lop}
        isGenerating={isGenerating}
        onGenerateCurrent={handleGeneratePlan}
        onOpenCompetencyModal={() => setIsNlsModalOpen(true)}
        onExportWordSingle={handleExportWordSingle}
        onExportWordAll={handleExportWordAll}
      />
    </div>
  );
};
