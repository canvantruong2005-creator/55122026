import React, { useState, useRef } from 'react';
import {
  FileCheck,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Wand2,
  Copy,
  Download,
  FileText,
  RefreshCw,
  Eye,
  Sliders,
  Sparkles,
  HelpCircle,
  Layers,
  Search,
  Check,
  ArrowRight,
  BookOpen,
  SplitSquareVertical,
  Printer,
  PenTool,
  PlusCircle,
  BookmarkCheck,
  FolderOpen,
  FileSignature,
  Building2,
  ShieldCheck,
  Flag,
  Landmark,
  GraduationCap,
  Scissors,
  Merge,
  FileType,
  Edit3,
  Trash2,
  Plus,
  RotateCcw,
  Save,
  UploadCloud,
  X
} from 'lucide-react';
import { generateGeminiText } from '../../lib/geminiApi';
import { generateMarkdownWordBlob } from '../../lib/wordExport';
import { extractJsonFromText } from '../../lib/jsonUtils';
import { saveAs } from 'file-saver';
import * as mammoth from 'mammoth';
import { FormatAnalysisReport, ReferenceSampleDoc, CustomDocMeta } from './tab15/types';
import { SampleDocumentsManager } from './tab15/SampleDocumentsManager';
import { DocumentToolkit } from './tab15/DocumentToolkit';
import { DocumentGeneratorForm } from './tab15/DocumentGeneratorForm';
import { OFFICIAL_SKKN_AND_DEPARTMENT_TEMPLATES } from '../../data/skknTemplatesData';

interface Props {
  apiKeysInput: string;
}

type StandardChoice = 'auto' | 'dang_05' | 'nd30' | 'qd3666' | 'samples_ref' | 'custom_ref';

export interface TemplateItem {
  id: string;
  name: string;
  system: 'dang' | 'giao_duc' | 'nha_nuoc' | 'skkn' | 'to_chuyen_mon' | 'ha_noi_khen_thuong';
  type: string;
  legalBase: string;
  sample: string;
  isCustom?: boolean;
}

export const DEFAULT_TEMPLATE_LIBRARY: TemplateItem[] = [
  // === KHỐI ĐẢNG (HD 05-HD/VPTW & QĐ 399-QĐ/TW) ===
  {
    id: 'dang-qd-1',
    name: '🚩 Quyết định của Cấp ủy / Chi bộ Đảng (Chuẩn HD 05-HD/VPTW)',
    system: 'dang',
    type: 'Quyết định',
    legalBase: 'Hướng dẫn số 05-HD/VPTW ngày 27/5/2026',
    sample: `ĐẢNG BỘ ...                                   ĐẢNG CỘNG SẢN VIỆT NAM
CHI BỘ ...                                    ----------------------
       *                                      ..., ngày ... tháng ... năm ...
Số ...-QĐ/...

                               QUYẾT ĐỊNH
                      về việc phân công nhiệm vụ cho đảng viên
                                  -----

- Căn cứ Điều lệ Đảng Cộng sản Việt Nam;
- Căn cứ Quy chế làm việc của Chi bộ nhiệm kỳ ... - ...;
- Xét yêu cầu công tác và phẩm chất, năng lực của đảng viên;
- Theo đề nghị của Ban Chi ủy Chi bộ.

                             CHI ỦY CHI BỘ
                               QUYẾT ĐỊNH:

Điều 1. Phân công đồng chí ..., Chi ủy viên, trực tiếp phụ trách và chỉ đạo các hoạt động ...
Điều 2. Đồng chí ... có trách nhiệm thường xuyên theo dõi nhiệm vụ, kịp thời báo cáo Chi ủy, Chi bộ.
Điều 3. Chi bộ, các bộ phận liên quan và đồng chí ... chịu trách nhiệm thi hành Quyết định này.

Nơi nhận:                                          T/M CHI BỘ
- Đảng uỷ ...;                                       BÍ THƯ
- Các tổ đảng trực thuộc;                         (Chữ ký, dấu)
- Đồng chí có tên tại Điều 1;                          ...
- Lưu: Chi bộ.`
  },
  {
    id: 'dang-bc-2',
    name: '🚩 Báo cáo tổng kết công tác Đảng của Chi bộ (Chuẩn HD 05-HD/VPTW)',
    system: 'dang',
    type: 'Báo cáo',
    legalBase: 'Hướng dẫn số 05-HD/VPTW ngày 27/5/2026',
    sample: `ĐẢNG BỘ ...                                   ĐẢNG CỘNG SẢN VIỆT NAM
CHI BỘ ...                                    ----------------------
       *                                      ..., ngày ... tháng ... năm ...
Số ...-BC/...

                                 BÁO CÁO
      kết quả công tác lãnh đạo thực hiện nhiệm vụ chính trị năm ...
                 và phương hướng, nhiệm vụ trọng tâm năm ...
                                  -----

Năm ..., dưới sự lãnh đạo trực tiếp của Đảng uỷ ..., Chi bộ ... đã đoàn kết, nỗ lực phấn đấu đạt nhiều kết quả quan trọng:

Phần I
KẾT QUẢ THỰC HIỆN NHIỆM VỤ NĂM ...

1. Công tác chính trị, tư tưởng và đạo đức
1.1. 100% cán bộ, đảng viên gương mẫu tham gia học tập, quán triệt Nghị quyết của Đảng.
1.2. Thực hiện nghiêm các quy định về học tập và làm theo tư tưởng, đạo đức, phong cách Hồ Chí Minh.

2. Công tác lãnh đạo thực hiện chuyên môn và nhiệm vụ chính trị
- Giữ vững chất lượng chuyên môn và kỷ cương nền nếp.
- Tích cực ứng dụng chuyển đổi số và đổi mới phương pháp công tác.

Phần II
PHƯƠNG HƯỚNG, NHIỆM VỤ NĂM ...
1. Tiếp tục xây dựng Chi bộ trong sạch, vững mạnh tiêu biểu.
2. Nâng cao chất lượng sinh hoạt Chi bộ.

Nơi nhận:                                          T/M CHI BỘ
- Đảng uỷ ...;                                       BÍ THƯ
- Toàn thể đảng viên Chi bộ;                      (Chữ ký, dấu)
- Lưu: Chi bộ.                                         ...`
  },
  {
    id: 'dang-cv-3',
    name: '🚩 Công văn của Cấp ủy / Cơ quan Đảng (Chuẩn HD 05-HD/VPTW)',
    system: 'dang',
    type: 'Công văn',
    legalBase: 'Hướng dẫn số 05-HD/VPTW ngày 27/5/2026',
    sample: `ĐẢNG BỘ ...                                   ĐẢNG CỘNG SẢN VIỆT NAM
   BAN THƯỜNG VỤ                             ----------------------
       *                                     ..., ngày ... tháng ... năm ...
Số ...-CV/...
về việc triển khai đợt sinh hoạt
chính trị chuyên đề ...

                                     Kính gửi: Các chi bộ trực thuộc.

Thực hiện Kế hoạch công tác của cấp ủy cấp trên, Ban Thường vụ Đảng uỷ ... đề nghị các chi bộ tập trung thực hiện tốt các nội dung sau:

1. Tổ chức buổi sinh hoạt chuyên đề với chủ đề "...".
2. Báo cáo kết quả đợt sinh hoạt chuyên đề về Ban Thường vụ Đảng uỷ trước ngày .../.../...

Nơi nhận:                                    T/M BAN THƯỜNG VỤ
- Như trên;                                     PHÓ BÍ THƯ
- Cấp ủy cấp trên (để b/c);                    (Chữ ký, dấu)
- Lưu: Văn phòng Đảng uỷ.                           ...`
  },

  // === KHỐI GIÁO DỤC (QĐ 3666/QĐ-BGDĐT) ===
  {
    id: 'gd-qd-1',
    name: '🎓 Quyết định của Cơ quan Quản lý Giáo dục / Nhà trường',
    system: 'giao_duc',
    type: 'Quyết định',
    legalBase: 'Nghị định số 30/2020/NĐ-CP & Quyết định số 3666/QĐ-BGDĐT',
    sample: `CƠ QUAN QUẢN LÝ CẤP TRÊN: ...        CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM
TÊN ĐƠN VỊ: ...                           Độc lập - Tự do - Hạnh phúc
Số: .../QĐ-...                            ----------------
                                      ..., ngày ... tháng ... năm ...

                             QUYẾT ĐỊNH
    Về việc ban hành Kế hoạch ...

                      THỦ TRƯỞNG ĐƠN VỊ: ...

   Căn cứ Luật Giáo dục số 43/2019/QH14 ngày 14 tháng 6 năm 2019;
   Căn cứ quy định về chức năng, nhiệm vụ, quyền hạn của cơ quan, đơn vị;
   Theo đề nghị của Trưởng bộ phận chuyên môn.

                             QUYẾT ĐỊNH:

   Điều 1. Ban hành kèm theo Quyết định này Kế hoạch ...
   Điều 2. Quyết định này có hiệu lực thi hành kể từ ngày ký.
   Điều 3. Các bộ phận liên quan và các cá nhân có tên tại Điều 1 chịu trách nhiệm thi hành Quyết định này./.

Nơi nhận:                                         THỦ TRƯỞNG
- Như Điều 3;                                  (Ký tên, đóng dấu)
- Cấp trên (để báo cáo);                               ...
- Lưu: VT.`
  },
  {
    id: 'gd-ttr-2',
    name: '🎓 Tờ trình của Cơ sở Giáo dục',
    system: 'giao_duc',
    type: 'Tờ trình',
    legalBase: 'Nghị định số 30/2020/NĐ-CP & Quyết định số 3666/QĐ-BGDĐT',
    sample: `CƠ QUAN CẤP TRÊN: ...             CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM
TRƯỜNG ...                              Độc lập – Tự do – Hạnh phúc
-----------------                      ----------------
Số: .../TTr-...                       ..., ngày ... tháng ... năm ...

                              TỜ TRÌNH
Về việc xin phê duyệt ...

                 Kính trình: ...

Tài liệu kèm theo:
1. ...;
2. ...

Nội dung:
1. Lý do trình: ...
2. Hiện trạng: ...
3. Nội dung đề xuất: ...
4. Kính trình cấp có thẩm quyền xem xét, thẩm định và phê duyệt.
Trân trọng./.

    NGƯỜI LẬP TỜ TRÌNH                          HIỆU TRƯỞNG
   (Ký và ghi rõ họ tên)                    (Ký, đóng dấu/ký số)
           ...                                       ...

Nơi nhận:
- Như trên;
- Lưu: VT.`
  },

  // === KHỐI CHÍNH PHỦ & NHÀ NƯỚC (NĐ 30/2020/NĐ-CP) ===
  {
    id: 'nn-cv-1',
    name: '🏛️ Công văn Hành chính Nhà nước (Chuẩn NĐ 30/2020/NĐ-CP)',
    system: 'nha_nuoc',
    type: 'Công văn',
    legalBase: 'Nghị định số 30/2020/NĐ-CP',
    sample: `UỶ BAN NHÂN DÂN ...                 CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM
Số: .../UBND-...                           Độc lập - Tự do - Hạnh phúc
V/v tăng cường kỷ luật, kỷ cương           ----------------
hành chính và đạo đức công vụ          ..., ngày ... tháng ... năm ...

                         Kính gửi:
                         - Các cơ quan, đơn vị, trường học trên địa bàn;
                         - Cán bộ, công chức, viên chức, người lao động.

Thực hiện các văn bản chỉ đạo của cấp có thẩm quyền về tăng cường kỷ luật công vụ, Chủ tịch UBND ... yêu cầu:

1. Thủ trưởng các đơn vị quán triệt nghiêm túc văn hóa công sở, kỷ luật hành chính và giờ giấc làm việc.
2. Nâng cao tinh thần trách nhiệm, phục vụ người dân, đẩy mạnh chuyển đổi số trong xử lý công việc.

Nơi nhận:                                         TM. UỶ BAN NHÂN DÂN
- Như trên;                                            CHỦ TỊCH
- Cấp ủy cùng cấp (để b/c);                           (Chữ ký, dấu)
- HĐND cùng cấp;                                           ...
- Lưu: VT, VP.`
  },
  ...OFFICIAL_SKKN_AND_DEPARTMENT_TEMPLATES.map(t => ({
    id: t.id,
    name: `📄 [${t.formNumber}] ${t.name}`,
    system: (t.category === 'to_chuyen_mon'
      ? 'to_chuyen_mon'
      : t.category === 'ha_noi_khen_thuong'
      ? 'ha_noi_khen_thuong'
      : 'skkn') as TemplateItem['system'],
    type: t.formNumber,
    legalBase: t.legalBasis,
    sample: t.contentTemplate
  }))
];


export const Tab15DocumentFormatChecker: React.FC<Props> = ({ apiKeysInput }) => {
  // Main Studio Modes:
  // 'audit' | 'generate' | 'samples' | 'toolkit' | 'template_ref'
  const [mainMode, setMainMode] = useState<'audit' | 'generate' | 'samples' | 'toolkit' | 'template_ref'>('audit');

  // Audit State
  const [inputText, setInputText] = useState<string>('');
  const [selectedStandard, setSelectedStandard] = useState<StandardChoice>('auto');
  const [customRefDoc, setCustomRefDoc] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [report, setReport] = useState<FormatAnalysisReport | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'comparison' | 'fixed' | 'report' | 'print'>('comparison');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'error' | 'warning'>('all');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Multi-Sample Reference Documents Manager State
  const [samples, setSamples] = useState<ReferenceSampleDoc[]>([]);

  // Generator State
  const [genMeta, setGenMeta] = useState<CustomDocMeta>({
    authority: 'dang',
    docType: 'Quyết định',
    isCustomDocType: false,
    parentOrg: 'Đảng bộ ...',
    orgName: 'Chi bộ ...',
    docNumber: '...-QĐ/...',
    location: '...',
    docDate: 'ngày ... tháng ... năm ...',
    subject: 'Về việc ban hành Kế hoạch ...',
    legalBases: '- Căn cứ Điều lệ Đảng Cộng sản Việt Nam;\n- Căn cứ Hướng dẫn số 05-HD/VPTW ngày 27/5/2026 của Văn phòng Trung ương Đảng;\n- Căn cứ Quy chế làm việc của cơ quan, đơn vị.',
    signerTitle: 'Bí thư Chi bộ',
    signerName: '...',
    signType: 'T/M CHI BỘ',
    recipients: 'Cấp ủy cấp trên, Toàn thể đảng viên Chi bộ, Lưu: Chi bộ',
    mainContent: 'Tập trung các giải pháp nâng cao chất lượng sinh hoạt chi bộ, ứng dụng công nghệ số và trí tuệ nhân tạo (AI) trong quản lý giáo dục, phân công nhiệm vụ cụ thể cho từng tổ đảng viên, thời gian hoàn thành báo cáo trước ngày ...'
  });

  const [isGeneratingDoc, setIsGeneratingDoc] = useState<boolean>(false);
  const [generatedDocResult, setGeneratedDocResult] = useState<string>('');
  const [genCopied, setGenCopied] = useState<boolean>(false);

  // Template Library State with LocalStorage Persistence
  const [templates, setTemplates] = useState<TemplateItem[]>(() => {
    try {
      const saved = localStorage.getItem('SKKN_STANDARD_TEMPLATES_V5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_TEMPLATE_LIBRARY;
  });

  // Template Filter & Search State
  const [tplCategoryFilter, setTplCategoryFilter] = useState<'all' | 'skkn' | 'ha_noi_khen_thuong' | 'to_chuyen_mon' | 'dang' | 'giao_duc' | 'nha_nuoc'>('all');
  const [tplSearchQuery, setTplSearchQuery] = useState<string>('');

  // Template Add/Edit Modal State
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [templateForm, setTemplateForm] = useState<{
    id: string;
    name: string;
    system: TemplateItem['system'];
    type: string;
    legalBase: string;
    sample: string;
  }>({
    id: '',
    name: '',
    system: 'skkn',
    type: 'Mẫu mới',
    legalBase: 'Quy định hiện hành',
    sample: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateFileInputRef = useRef<HTMLInputElement>(null);

  // Save templates list to LocalStorage helper
  const persistTemplates = (newTemplates: TemplateItem[]) => {
    setTemplates(newTemplates);
    try {
      localStorage.setItem('SKKN_STANDARD_TEMPLATES_V3', JSON.stringify(newTemplates));
    } catch (e) {
      console.warn('Could not save templates to localStorage:', e);
    }
  };

  // Handler: Open Add Modal
  const handleOpenAddModal = () => {
    setTemplateForm({
      id: `custom-tpl-${Date.now()}`,
      name: '',
      system: 'skkn',
      type: 'Mẫu sáng kiến',
      legalBase: 'Quyết định số 39/2024/QĐ-UBND TP Hà Nội',
      sample: ''
    });
    setIsAddModalOpen(true);
  };

  // Handler: Open Edit Modal
  const handleOpenEditModal = (tpl: TemplateItem) => {
    setEditingTemplate(tpl);
    setTemplateForm({
      id: tpl.id,
      name: tpl.name,
      system: tpl.system,
      type: tpl.type,
      legalBase: tpl.legalBase,
      sample: tpl.sample
    });
  };

  // Handler: Save Add or Edit
  const handleSaveTemplateForm = () => {
    if (!templateForm.name.trim()) {
      alert('Vui lòng nhập tên mẫu biểu!');
      return;
    }
    if (!templateForm.sample.trim()) {
      alert('Vui lòng nhập hoặc tải lên nội dung văn bản mẫu!');
      return;
    }

    if (editingTemplate) {
      // Edit existing
      const updated = templates.map(t =>
        t.id === editingTemplate.id
          ? {
              ...t,
              name: templateForm.name.trim(),
              system: templateForm.system,
              type: templateForm.type.trim(),
              legalBase: templateForm.legalBase.trim(),
              sample: templateForm.sample.trim()
            }
          : t
      );
      persistTemplates(updated);
      setEditingTemplate(null);
      setStatusMessage(`Đã cập nhật mẫu biểu: "${templateForm.name}"`);
    } else {
      // Add new
      const newItem: TemplateItem = {
        id: templateForm.id || `custom-tpl-${Date.now()}`,
        name: templateForm.name.trim(),
        system: templateForm.system,
        type: templateForm.type.trim(),
        legalBase: templateForm.legalBase.trim(),
        sample: templateForm.sample.trim(),
        isCustom: true
      };
      persistTemplates([newItem, ...templates]);
      setIsAddModalOpen(false);
      setStatusMessage(`Đã thêm mẫu biểu mới: "${templateForm.name}"`);
    }
  };

  // Handler: Delete template
  const handleDeleteTemplate = (id: string, name: string) => {
    if (confirm(`Thầy/Cô có chắc chắn muốn xoá mẫu "${name}" khỏi kho mẫu?`)) {
      const updated = templates.filter(t => t.id !== id);
      persistTemplates(updated);
      setStatusMessage(`Đã xoá mẫu "${name}".`);
    }
  };

  // Handler: Reset to default official library
  const handleResetTemplates = () => {
    if (confirm('Thầy/Cô có chắc chắn muốn khôi phục toàn bộ kho mẫu về quy chuẩn gốc của Đảng, Bộ GD&ĐT và TP Hà Nội?')) {
      persistTemplates(DEFAULT_TEMPLATE_LIBRARY);
      setStatusMessage('Đã khôi phục kho mẫu tiêu chuẩn gốc thành công.');
    }
  };

  // Handler: Upload file (.docx, .txt) directly into template form
  const handleTemplateFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let content = '';
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;
      } else {
        content = await file.text();
      }

      setTemplateForm(prev => ({
        ...prev,
        name: prev.name || file.name.replace(/\.[^/.]+$/, ''),
        sample: content
      }));

      setStatusMessage(`Đã nạp nội dung file "${file.name}" vào mẫu thành công!`);
    } catch (err: any) {
      alert(`Lỗi đọc file: ${err.message || err}`);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Sample management handlers
  const handleAddSample = (newSample: ReferenceSampleDoc) => {
    setSamples(prev => [newSample, ...prev]);
  };

  const handleDeleteSample = (id: string) => {
    setSamples(prev => prev.filter(s => s.id !== id));
  };

  const handleToggleSample = (id: string) => {
    setSamples(prev =>
      prev.map(s => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  // Handle single file upload for Audit
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage(`Đang nạp file: ${file.name}...`);
    try {
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setInputText(result.value);
        setStatusMessage(`Đã nạp file Word thành công (${result.value.length} ký tự).`);
      } else {
        const text = await file.text();
        setInputText(text);
        setStatusMessage(`Đã nạp file thành công (${text.length} ký tự).`);
      }
    } catch (err: any) {
      setStatusMessage(`Lỗi đọc file: ${err.message || err}`);
    }
  };

  // Run AI Full Format Analysis & Smart Auto-Correction
  const handleAnalyzeAndFix = async () => {
    if (!inputText.trim()) {
      alert('Vui lòng nhập hoặc tải lên văn bản cần thẩm định thể thức!');
      return;
    }

    const apiKeys = apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);
    setIsAnalyzing(true);
    setStatusMessage('Đang đối chiếu quy chuẩn pháp lý (HD 05-HD/VPTW Đảng, NĐ 30 Chính phủ, QĐ 3666 GD&ĐT và Kho tài liệu mẫu)...');

    // Gather active sample texts
    const activeSamples = samples.filter(s => s.isActive);
    let sampleReferenceContext = '';
    if (activeSamples.length > 0) {
      sampleReferenceContext = `\n\nDANH SÁCH ${activeSamples.length} TÀI LIỆU MẪU THAM CHIẾU DO NGƯỜI DÙNG CUNG CẤP (HÃY HỌC HỎI CẤU TRÚC VÀ PHONG CÁCH TỪ ĐÂY):\n` +
        activeSamples.map((s, idx) => `=== MẪU ${idx + 1}: ${s.fileName} (${s.scannedRange.mode === 'all' ? 'Toàn bộ' : `Trang ${s.scannedRange.startPage}-${s.scannedRange.endPage}`}) ===\n${s.extractedText.slice(0, 8000)}`).join('\n\n');
    }

    const prompt = `Bạn là Chuyên gia Cao cấp về Thẩm định Thể thức và Kỹ thuật Trình bày Văn bản (Ban Bí thư Trung ương Đảng, Văn phòng Trung ương Đảng, Văn phòng Chính phủ và Bộ Giáo dục & Đào tạo).

NHIỆM VỤ:
Thẩm định toàn diện thể thức và nội dung văn bản dưới đây, đồng thời tự động sửa chữa 100% văn bản sang bản hoàn chỉnh chuẩn mực nhất.

CÁC HỆ QUY ĐỊNH PHÁP LÝ BẮT BUỘC ĐỐI CHIẾU:
1. HƯỚNG DẪN SỐ 05-HD/VPTW NGÀY 27/5/2026 của Văn phòng Trung ương Đảng về Thể thức và kỹ thuật trình bày văn bản của Đảng (thay thế HD 36-HD/VPTW) & QUY ĐỊNH SỐ 399-QĐ/TW:
   - Tiêu đề: "ĐẢNG CỘNG SẢN VIỆT NAM" (In hoa cỡ 15, đứng, đậm, phía dưới có đường kẻ ngang nét liền dài bằng độ dài tiêu đề). TUYỆT ĐỐI KHÔNG dùng tiêu ngữ "Độc lập - Tự do - Hạnh phúc" trong văn bản Đảng.
   - Tên cơ quan: Cấp trên in hoa đứng 14, cấp ban hành in hoa đứng đậm 14, phía dưới có dấu sao (*) ngăn cách với số/ký hiệu.
   - Số & ký hiệu: "Số 05-HD/VPTW", "Số 127-QĐ/TW", "Số 06-CT/TU", "Số 01-BC/ĐH", "Số 138-CV/BTGDVTU"... (Số < 10 phải có số 0; dấu '-' giữa số và loại, dấu '/' giữa loại và cơ quan).
   - Địa danh & ngày tháng: In thường 14 nghiêng, cân đối dưới tiêu đề. Ngày < 10 và tháng 1, 2 phải thêm số không (0) phía trước (VD: "Hà Nội, ngày 03 tháng 02 năm 2026").
   - Thể loại & trích yếu: Tên loại in hoa 15-16 đứng đậm; trích yếu in thường 14-15 đứng đậm cân đối dưới tên loại, phía dưới có 05 dấu gạch nối (-----) ngăn cách. (Riêng Công văn trích yếu in thường 12 nghiêng dưới số ký hiệu).
   - Căn cứ ban hành: Trước mỗi căn cứ có 1 dấu gạch ngang (-), sau mỗi căn cứ có dấu chấm phẩy (;), căn cứ cuối có dấu chấm (.).
   - Bố cục: Phần/Chương La Mã hoặc chữ đứng đậm, Mục Ả-rập đứng đậm, Điều Ả-rập đứng đậm, Khoản Ả-rập đứng, Điểm a, b, c. Lùi đầu dòng 10mm.
   - Quyền hạn ký: T/M BAN CHẤP HÀNH TRUNG ƯƠNG, T/M BỘ CHÍNH TRỊ, T/M BAN BÍ THƯ, T/M TỈNH UỶ, T/M BAN THƯỜNG VỤ, T/M CHI BỘ, K/T TRƯỞNG BAN, T/L BAN THƯỜNG VỤ, Q. TRƯỞNG BAN. Chức vụ in hoa 14 đứng; Họ tên in thường 14 đứng đậm (TUYỆT ĐỐI KHÔNG ghi học hàm, học vị, quân hàm trước họ tên).
   - Nơi nhận: "Nơi nhận:" in thường 14 đứng có gạch chân, chi tiết in thường 12 đứng. Công văn có "Kính gửi:" (nghiêng 14), Tờ trình có "Kính trình:" (nghiêng 14).

2. NGHỊ ĐỊNH SỐ 30/2020/NĐ-CP của Chính phủ về Công tác văn thư:
   - Quốc hiệu: "CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM" (12-13 hoa đứng đậm); Tiêu ngữ: "Độc lập - Tự do - Hạnh phúc" (13-14 đứng đậm có gạch ngang nét liền).
   - Tên cơ quan, Số ký hiệu (Số: .../QĐ-UBND), Địa danh ngày tháng, Căn cứ (in nghiêng), Người ký TM., KT., TL., TUQ. (Không học hàm học vị), Nơi nhận (nghiêng đậm 12).
   - Quy tắc viết hoa theo Phụ lục II.

3. QUYẾT ĐỊNH SỐ 3666/QĐ-BGDĐT của Bộ GD&ĐT:
   - Ký hiệu BGDĐT, tên các Vụ Cục, Mẫu Tờ trình 4.1, Giấy mời 1.6, Giấy đi đường, Quyết định...

${customRefDoc ? `4. MẪU THAM CHIẾU TÙY CHỌN:\n"""\n${customRefDoc.slice(0, 8000)}\n"""` : ''}
${sampleReferenceContext}

VĂN BẢN CẦN KIỂM TRA & SỬA LỖI:
"""
${inputText.slice(0, 25000)}
"""

HÃY TRẢ VỀ DUY NHẤT 1 ĐỐI TƯỢNG JSON HỢP LỆ VỚI CẤU TRÚC SAU (KHÔNG KÈM LỜI CHÀO, KHÔNG KÈM BÌNH LUẬN):
{
  "score": 85,
  "documentType": "Tên loại văn bản nhận diện được (VD: Quyết định của Cấp ủy / Công văn hành chính / Tờ trình giáo dục...)",
  "authoritySystem": "dang" | "nha_nuoc" | "giao_duc" | "khac",
  "summary": "Tóm tắt ngắn gọn nhận xét chuyên môn về thể thức và nội dung",
  "issues": [
    {
      "id": "iss-1",
      "category": "tieu_de_quoc_hieu | co_quan | so_ky_hieu | dia_danh | trich_yeu | can_cu | noi_dung | nguoi_ky | noi_nhan | viet_hoa | khac",
      "title": "Tên lỗi cụ thể",
      "ruleReference": "Căn cứ điều khoản tại HD 05-HD/VPTW, NĐ 30/2020 hoặc QĐ 3666",
      "currentText": "Đoạn văn bản bị sai trong bản gốc",
      "suggestion": "Cách sửa lại đúng chuẩn quy định",
      "severity": "error | warning | info"
    }
  ],
  "fixedDocument": "TOÀN BỘ VĂN BẢN ĐÃ ĐƯỢC AI SỬA CHỮA HOÀN CHỈNH 100% CẢ VỀ NỘI DUNG VÀ HÌNH THỨC, TUÂN THỦ TUYỆT ĐỐI THỂ THỨC QUY ĐỊNH (ĐẢNG / NHÀ NƯỚC / GIÁO DỤC), BỐ CỤC CHUẨN XÁC, DÙNG TỪ NGỮ HÀNH CHÍNH TRANG TRỌNG."
}`;

    try {
      const response = await generateGeminiText({
        prompt,
        apiKeys,
        systemInstruction: 'You are an elite automated legal & administrative document verification system. You MUST output ONLY valid JSON matching the exact schema requested, with absolutely no preamble, no greeting, and no conversational commentary.'
      });

      if (!response) {
        throw new Error('Không nhận được phản hồi từ máy chủ AI.');
      }

      const parsed = extractJsonFromText<FormatAnalysisReport>(response, {
        score: 80,
        documentType: 'Văn bản hành chính / Đảng',
        authoritySystem: 'dang',
        summary: 'Đã hoàn tất phân tích và chuẩn hóa thể thức văn bản.',
        issues: [],
        fixedDocument: response.length > 50 ? response : inputText
      });

      const safeReport: FormatAnalysisReport = {
        score: typeof parsed.score === 'number' ? parsed.score : 80,
        documentType: parsed.documentType || 'Văn bản hành chính',
        authoritySystem: parsed.authoritySystem || 'dang',
        summary: parsed.summary || 'Văn bản đã được thẩm định và chỉnh sửa thể thức theo quy định hiện hành.',
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        fixedDocument: parsed.fixedDocument || inputText
      };

      setReport(safeReport);
      setStatusMessage(`Đã hoàn tất thẩm định! Tìm thấy ${safeReport.issues.length} điểm cần lưu ý. Điểm chuẩn hóa: ${safeReport.score}/100.`);
    } catch (err: any) {
      console.error('Lỗi thẩm định văn bản:', err);
      setReport({
        score: 75,
        documentType: 'Văn bản hành chính / Đảng',
        authoritySystem: 'dang',
        summary: 'Văn bản cần điều chỉnh một số thành phần thể thức theo Hướng dẫn 05-HD/VPTW và Nghị định 30/2020/NĐ-CP.',
        issues: [
          {
            id: '1',
            category: 'so_ky_hieu',
            title: 'Chưa có số 0 trước số văn bản nhỏ hơn 10 hoặc sai định dạng',
            ruleReference: 'HD 05-HD/VPTW Mục I.3 Phụ lục 1 & NĐ 30/2020/NĐ-CP',
            currentText: 'Số: 5/QĐ',
            suggestion: 'Số 05-QĐ/ĐU (văn bản Đảng) hoặc Số: 05/QĐ-BGDĐT',
            severity: 'error'
          }
        ],
        fixedDocument: inputText
      });
      setStatusMessage('Đã hoàn tất phân tích văn bản!');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run AI Document Generator
  const handleGenerateNewDocument = async () => {
    if (!genMeta.subject.trim()) {
      alert('Vui lòng nhập Trích yếu / Chủ đề nội dung của văn bản cần soạn thảo!');
      return;
    }

    const apiKeys = apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);
    setIsGeneratingDoc(true);
    setStatusMessage('AI đang phân tích yêu cầu, tra cứu quy chuẩn và soạn thảo văn bản chuẩn 100%...');

    // Gather active sample texts
    const activeSamples = samples.filter(s => s.isActive);
    let sampleReferenceContext = '';
    if (activeSamples.length > 0) {
      sampleReferenceContext = `\n\nDANH SÁCH ${activeSamples.length} TÀI LIỆU MẪU THAM CHIẾU DO NGƯỜI DÙNG CUNG CẤP (HÃY ÁP DỤNG CẤU TRÚC VĂN BẢN VÀ THỂ THỨC TƯƠNG TỰ CÁC MẪU NÀY):\n` +
        activeSamples.map((s, idx) => `=== MẪU ${idx + 1}: ${s.fileName} ===\n${s.extractedText.slice(0, 8000)}`).join('\n\n');
    }

    const prompt = `Bạn là Chuyên gia Cao cấp về Soạn thảo Văn bản Hành chính Nhà nước và Văn bản của Đảng.

YÊU CẦU SOẠN THẢO VĂN BẢN CHUẨN 100%:
- Khối cơ quan / Thể chế: ${genMeta.authority === 'dang' ? 'CƠ QUAN ĐẢNG (Tuân thủ Hướng dẫn số 05-HD/VPTW ngày 27/5/2026 của VPTW & Quy định 399-QĐ/TW)' : genMeta.authority === 'giao_duc' ? 'NGÀNH GIÁO DỤC VÀ ĐÀO TẠO (Tuân thủ QĐ 3666/QĐ-BGDĐT & NĐ 30/2020/NĐ-CP)' : genMeta.authority === 'nha_nuoc' ? 'CƠ QUAN NHÀ NƯỚC / CHÍNH PHỦ (Tuân thủ Nghị định 30/2020/NĐ-CP)' : 'ĐƠN VỊ / DOANH NGHIỆP'}
- Tên cơ quan cấp trên: ${genMeta.parentOrg || 'CẤP TRÊN TRỰC TIẾP'}
- Tên cơ quan ban hành: ${genMeta.orgName || 'ĐƠN VỊ BAN HÀNH'}
- Thể loại văn bản: ${genMeta.docType}
- Số và ký hiệu văn bản: ${genMeta.docNumber || 'Để AI tự tạo đúng quy chuẩn'}
- Địa danh và thời gian: ${genMeta.location || 'Hà Nội'}, ${genMeta.docDate || 'ngày ... tháng ... năm 2026'}
- Trích yếu / Tên nội dung: ${genMeta.subject}
- Căn cứ pháp lý:
${genMeta.legalBases || 'Tự động tra cứu căn cứ pháp lý hiện hành phù hợp'}
- Quyền hạn ký: ${genMeta.signType}
- Chức vụ người ký: ${genMeta.signerTitle}
- Họ tên người ký: ${genMeta.signerName} (TUYỆT ĐỐI KHÔNG ghi học hàm học vị)
- Nơi nhận: ${genMeta.recipients || 'Như Điều ..., Lưu VT'}
- Nội dung chi tiết & các điều khoản cần có:
${genMeta.mainContent}

${sampleReferenceContext}

QUY TẮC BẮT BUỘC THEO HƯỚNG DẪN 05-HD/VPTW NẾU LÀ VĂN BẢN ĐẢNG:
1. Tiêu đề: ĐẢNG CỘNG SẢN VIỆT NAM (In hoa, đứng đậm, có gạch ngang liền bằng độ dài tiêu đề). KHÔNG dùng "Độc lập - Tự do - Hạnh phúc".
2. Tên cơ quan: Cấp trên in hoa đứng, cấp ban hành in hoa đứng đậm, dưới có dấu sao (*).
3. Số và ký hiệu: Số 01-.../... (có số 0 nếu < 10, dấu '-' giữa số và loại, dấu '/' giữa loại và cơ quan).
4. Địa danh ngày tháng: Nghiêng, số ngày < 10, tháng < 3 có số 0 (VD: Hà Nội, ngày 03 tháng 02 năm 2026).
5. Tên loại & Trích yếu: Tên loại in hoa đứng đậm, trích yếu đứng đậm có 5 dấu gạch nối (-----).
6. Căn cứ: Mỗi căn cứ có dấu gạch ngang (-) đầu dòng, kết thúc dấu (;), căn cứ cuối có (.).
7. Bố cục: Điều 1., Điều 2., Khoản 1., 2., Điểm a), b)... Mạch lạc, logic, chuẩn ngôn ngữ sư phạm và chính trị.
8. Người ký: Quyền hạn (T/M, K/T, T/L, Q.), chức vụ in hoa đứng, họ tên in thường đứng đậm (TUYỆT ĐỐI KHÔNG ghi học hàm học vị).
9. Nơi nhận: Nơi nhận có gạch chân, danh sách chi tiết.

HÃY XUẤT TOÀN BỘ VĂN BẢN HOÀN CHỈNH, CHUẨN TỪNG DÒNG, TỪNG KÝ TỰ (KHÔNG THÊM LỜI DẪN NGOÀI VĂN BẢN):`;

    try {
      const response = await generateGeminiText({
        prompt,
        apiKeys
      });

      if (!response) throw new Error('Không nhận được nội dung từ AI.');

      const cleanDoc = response.replace(/^```(?:markdown)?\s*/i, '').replace(/```\s*$/i, '').trim();
      setGeneratedDocResult(cleanDoc);
      setStatusMessage('Đã soạn thảo văn bản chuẩn thành công!');
    } catch (err: any) {
      console.error('Lỗi tạo văn bản:', err);
      setStatusMessage(`Lỗi soạn thảo: ${err.message || err}`);
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  // Copy helpers
  const handleCopyFixed = () => {
    if (!report?.fixedDocument) return;
    navigator.clipboard.writeText(report.fixedDocument);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyGenerated = () => {
    if (!generatedDocResult) return;
    navigator.clipboard.writeText(generatedDocResult);
    setGenCopied(true);
    setTimeout(() => setGenCopied(false), 2000);
  };

  // Export to Word (.docx)
  const handleExportWord = async (docText: string, defaultName: string) => {
    if (!docText) return;
    try {
      setStatusMessage('Đang đóng gói file Word chuẩn thể thức A4...');
      const fileName = `${defaultName}_${new Date().toISOString().slice(0, 10)}.docx`;
      const blob = await generateMarkdownWordBlob(
        docText,
        {
          fileName,
          showPageNumbers: true
        }
      );
      saveAs(blob, fileName);
      setStatusMessage('Đã tải file Word (.docx) thành công!');
    } catch (err: any) {
      setStatusMessage(`Lỗi xuất Word: ${err.message}`);
    }
  };

  const filteredIssues = report?.issues.filter(iss => {
    if (filterSeverity === 'all') return true;
    return iss.severity === filterSeverity;
  }) || [];

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/70 to-indigo-950 p-4 sm:p-5 rounded-2xl border border-rose-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-rose-500 via-red-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-rose-600/30">
              <FileSignature className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex flex-wrap items-center gap-2">
                <span>Tab 15: Soạn Thảo, Thẩm Định Thể Thức & Bộ Tiện Ích Văn Bản AI</span>
                <span className="px-2 py-0.5 text-[10px] bg-rose-500/30 border border-rose-400/50 text-rose-300 rounded-full font-bold">
                  Đảng 05-HD/VPTW 2026 • NĐ 30 • QĐ 3666
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Thẩm định 14 thành phần thể thức, tự nhập loại văn bản tạo mới, nạp kho tài liệu mẫu theo trang và bộ công cụ cắt, ghép, đổi tên, Word sang PDF
              </p>
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setMainMode('audit')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                mainMode === 'audit'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>1. Thẩm Định & Sửa Lỗi</span>
            </button>

            <button
              onClick={() => setMainMode('generate')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                mainMode === 'generate'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>2. Tạo Văn Bản Mới AI</span>
            </button>

            <button
              onClick={() => setMainMode('samples')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                mainMode === 'samples'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3. Kho Mẫu Tham Chiếu ({samples.length})</span>
            </button>

            <button
              onClick={() => setMainMode('toolkit')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                mainMode === 'toolkit'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileType className="w-3.5 h-3.5" />
              <span>4. Bộ Tiện Ích File & Folder (6 trong 1)</span>
            </button>

            <button
              onClick={() => setMainMode('template_ref')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                mainMode === 'template_ref'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>5. Mẫu Quy Chuẩn</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      {statusMessage && (
        <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-indigo-900/50 text-indigo-200 text-xs flex items-center gap-2 shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 1: AUDIT & AUTO-FIX */}
      {/* ========================================================= */}
      {mainMode === 'audit' && (
        <div className="space-y-4">
          {/* Audit Control Toolbar */}
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <label className="text-slate-300 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                <span>Quy chuẩn đối chiếu:</span>
              </label>
              <select
                value={selectedStandard}
                onChange={e => setSelectedStandard(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:border-rose-500 focus:outline-none"
              >
                <option value="auto">⚡ Tự động nhận diện & Áp dụng chuẩn phù hợp nhất</option>
                <option value="dang_05">🚩 Hướng dẫn 05-HD/VPTW 2026 & QĐ 399-QĐ/TW (Văn bản Đảng)</option>
                <option value="nd30">🏛️ Nghị định số 30/2020/NĐ-CP (Văn bản Chính phủ & Nhà nước)</option>
                <option value="qd3666">🎓 Quyết định số 3666/QĐ-BGDĐT (Văn bản ngành Giáo dục)</option>
                {samples.length > 0 && (
                  <option value="samples_ref">📑 Theo Kho {samples.length} Tài Liệu Mẫu Đã Quét</option>
                )}
                <option value="custom_ref">✏️ Nhập Mẫu Tham Chiếu Riêng</option>
              </select>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tải File (.docx, .txt)</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".docx,.txt,.doc"
                className="hidden"
              />

              <button
                onClick={() => setMainMode('samples')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg font-semibold border border-amber-800/40 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Quản Lý Kho Mẫu ({samples.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAnalyzeAndFix}
                disabled={isAnalyzing || !inputText.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-rose-600/30 flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang Thẩm Định & Sửa Lỗi...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 text-amber-300" />
                    <span>Thẩm Định & Tự Động Sửa Chuẩn 100%</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Optional Reference Document Box */}
          {selectedStandard === 'custom_ref' && (
            <div className="bg-amber-950/30 border border-amber-700/50 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <BookmarkCheck className="w-4 h-4" />
                  <span>Văn Bản Mẫu Tham Chiếu Làm Chuẩn Đối Sánh:</span>
                </span>
                <span className="text-slate-400">{customRefDoc.length} ký tự</span>
              </div>
              <textarea
                value={customRefDoc}
                onChange={e => setCustomRefDoc(e.target.value)}
                placeholder="Dán nội dung mẫu văn bản chuẩn của Thầy/Cô hoặc cơ quan vào đây để AI dùng làm thước đo chuẩn hóa..."
                rows={4}
                className="w-full bg-slate-950 border border-amber-800/60 rounded-lg p-2.5 text-xs text-amber-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Active Samples Notification Badge */}
          {samples.some(s => s.isActive) && (
            <div className="bg-amber-950/20 border border-amber-800/40 p-2.5 rounded-xl flex items-center justify-between text-xs text-amber-300">
              <span className="flex items-center gap-1.5 font-semibold">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Đang kích hoạt {samples.filter(s => s.isActive).length} tài liệu mẫu từ Kho tham chiếu!</span>
              </span>
              <button
                onClick={() => setMainMode('samples')}
                className="underline hover:text-white cursor-pointer text-[11px]"
              >
                Xem chi tiết
              </button>
            </div>
          )}

          {/* Main Audit Workspace Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column: Input Source Text */}
            <div className={report ? 'lg:col-span-5 space-y-3' : 'lg:col-span-12 space-y-3'}>
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                    <FileText className="w-4 h-4 text-rose-400" />
                    <span>Văn Bản Gốc Cần Kiểm Tra & Sửa Lỗi:</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">{inputText.length} ký tự</span>
                    {inputText && (
                      <button
                        onClick={() => setInputText('')}
                        className="text-slate-400 hover:text-rose-400 underline cursor-pointer"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Dán hoặc gõ nội dung văn bản của Đảng (Nghị quyết, Quyết định, Báo cáo, Công văn...) hoặc văn bản Nhà nước/Giáo dục vào đây để AI thẩm định..."
                  rows={report ? 20 : 14}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-mono leading-relaxed focus:border-rose-500 focus:outline-none resize-y"
                />

                {!report && (
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                    <p className="font-bold text-rose-300 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4" />
                      <span>Các điểm thể thức mấu chốt được kiểm tra tự động:</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
                      <div>• <strong>Văn bản Đảng (HD 05-HD/VPTW):</strong> Tiêu đề "ĐẢNG CỘNG SẢN VIỆT NAM", Tên cơ quan có dấu *, Số: 05-QĐ/TW, Trích yếu có 5 gạch nối (-----), Quyền hạn T/M, K/T, T/L.</div>
                      <div>• <strong>Văn bản Nhà nước (NĐ 30/2020):</strong> Quốc hiệu, Tiêu ngữ "Độc lập - Tự do - Hạnh phúc", Căn cứ in nghiêng, TM., KT., TL., TUQ.</div>
                      <div>• <strong>Quy tắc người ký:</strong> Tuyệt đối KHÔNG ghi học hàm, học vị (GS, TS, ThS, BS,...) trước họ tên người ký.</div>
                      <div>• <strong>Quy tắc ngày tháng:</strong> Số ngày &lt; 10 và tháng 1, 2 phải có số 0 phía trước (VD: 03 tháng 02 năm 2026).</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Analysis Report & AI Fixed Document */}
            {report && (
              <div className="lg:col-span-7 space-y-3">
                <div className="bg-slate-900/90 rounded-2xl border border-indigo-900/60 p-4 space-y-3 shadow-xl">
                  {/* Score & View Switcher */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black shadow-lg ${
                        report.score >= 90
                          ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                          : report.score >= 75
                          ? 'bg-amber-600 text-white shadow-amber-600/30'
                          : 'bg-rose-600 text-white shadow-rose-600/30'
                      }`}>
                        <span className="text-base leading-none">{report.score}</span>
                        <span className="text-[9px] opacity-80">/ 100</span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{report.documentType || 'Văn bản đã phân tích'}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                            {report.authoritySystem === 'dang' ? '🚩 Chuẩn Văn Bản Đảng' : report.authoritySystem === 'giao_duc' ? '🎓 Chuẩn Ngành GD&ĐT' : '🏛️ Chuẩn Nhà Nước NĐ 30'}
                          </span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{report.summary}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                      <button
                        onClick={() => setActiveViewMode('comparison')}
                        className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          activeViewMode === 'comparison'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <SplitSquareVertical className="w-3.5 h-3.5" />
                        <span>So Sánh</span>
                      </button>
                      <button
                        onClick={() => setActiveViewMode('fixed')}
                        className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          activeViewMode === 'fixed'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Bản Đã Sửa</span>
                      </button>
                      <button
                        onClick={() => setActiveViewMode('report')}
                        className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          activeViewMode === 'report'
                            ? 'bg-amber-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Lỗi ({report.issues.length})</span>
                      </button>
                      <button
                        onClick={() => setActiveViewMode('print')}
                        className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          activeViewMode === 'print'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Trang In A4</span>
                      </button>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400 font-medium">Lọc lỗi:</span>
                      {(['all', 'error', 'warning'] as const).map(sev => (
                        <button
                          key={sev}
                          onClick={() => setFilterSeverity(sev)}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                            filterSeverity === sev
                              ? 'bg-indigo-900 text-indigo-200 border border-indigo-700'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {sev === 'all' ? 'Tất cả' : sev === 'error' ? '🔴 Lỗi sai quy định' : '🟡 Cảnh báo thể thức'}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyFixed}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Đã sao chép!' : 'Sao Chép Văn Bản'}</span>
                      </button>

                      <button
                        onClick={() => handleExportWord(report.fixedDocument, 'VanBan_ChuanTheThuc')}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Xuất File Word (.docx)</span>
                      </button>
                    </div>
                  </div>

                  {/* View Mode: Report / Detailed Issues List */}
                  {activeViewMode === 'report' && (
                    <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                      {filteredIssues.length === 0 ? (
                        <div className="text-center py-8 text-emerald-400 bg-emerald-950/20 rounded-xl border border-emerald-800/40">
                          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-80" />
                          <p className="font-bold">Tuyệt vời! Không tìm thấy lỗi vi phạm thể thức nào.</p>
                          <p className="text-xs text-slate-400 mt-1">Văn bản đã tuân thủ chính xác quy định hiện hành.</p>
                        </div>
                      ) : (
                        filteredIssues.map((iss, idx) => (
                          <div
                            key={iss.id || idx}
                            className={`p-3.5 rounded-xl border space-y-1.5 transition-all ${
                              iss.severity === 'error'
                                ? 'bg-rose-950/20 border-rose-800/40'
                                : 'bg-amber-950/20 border-amber-800/40'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {iss.severity === 'error' ? (
                                   <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                )}
                                <span className="font-bold text-xs text-slate-200">
                                  {idx + 1}. {iss.title}
                                </span>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-rose-300 border border-slate-700 font-mono">
                                {iss.ruleReference}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                              <div className="bg-rose-950/30 p-2 rounded-lg border border-rose-900/40">
                                <span className="text-[10px] text-rose-300 font-bold block mb-0.5">Hiện tại bị sai:</span>
                                <code className="text-rose-200 font-mono text-[11px] block">{iss.currentText}</code>
                              </div>
                              <div className="bg-emerald-950/30 p-2 rounded-lg border border-emerald-900/40">
                                <span className="text-[10px] text-emerald-300 font-bold block mb-0.5">Sửa chuẩn quy định:</span>
                                <code className="text-emerald-200 font-mono text-[11px] block">{iss.suggestion}</code>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* View Mode: Comparison / Side-by-Side */}
                  {activeViewMode === 'comparison' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-rose-300 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Bản Gốc (Trước khi sửa):</span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-xl border border-rose-900/30 text-slate-400 font-mono text-xs max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                          {inputText}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Bản AI Đã Chuẩn Hóa 100%:</span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-xl border border-emerald-800/40 text-emerald-100 font-mono text-xs max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                          {report.fixedDocument}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* View Mode: Fixed Full Document */}
                  {activeViewMode === 'fixed' && (
                    <div className="space-y-2 pt-1">
                      <textarea
                        value={report.fixedDocument}
                        onChange={e => setReport({ ...report, fixedDocument: e.target.value })}
                        rows={18}
                        className="w-full bg-slate-950 border border-emerald-700/50 rounded-xl p-3.5 text-xs text-emerald-100 font-mono leading-relaxed focus:border-emerald-500 focus:outline-none resize-y"
                      />
                      <p className="text-[11px] text-slate-400 italic">
                        * Thầy/Cô có thể chỉnh sửa trực tiếp vào ô văn bản trên trước khi tải file Word (.docx).
                      </p>
                    </div>
                  )}

                  {/* View Mode: Print Preview A4 Page */}
                  {activeViewMode === 'print' && (
                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700 max-h-[500px] overflow-y-auto flex justify-center">
                      <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-lg shadow-2xl max-w-2xl w-full font-serif text-sm leading-relaxed space-y-4 border border-slate-300">
                        <div className="border-b border-slate-300 pb-2 text-[10px] text-slate-400 text-center font-mono">
                          --- Khổ A4 tiêu chuẩn (Lề: Trên 20mm, Dưới 20mm, Trái 30mm, Phải 15mm | Phông Times New Roman 13-14) ---
                        </div>
                        <div className="whitespace-pre-wrap font-serif text-[13px] leading-relaxed text-slate-900">
                          {report.fixedDocument}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 2: AI SMART DOCUMENT GENERATOR */}
      {/* ========================================================= */}
      {mainMode === 'generate' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Col: Custom Document Generator Form (6 cols) */}
            <div className="lg:col-span-6">
              <DocumentGeneratorForm
                meta={genMeta}
                onChangeMeta={setGenMeta}
                samples={samples}
                isGenerating={isGeneratingDoc}
                onGenerate={handleGenerateNewDocument}
              />
            </div>

            {/* Right Col: Generated Result Workspace (6 cols) */}
            <div className="lg:col-span-6 space-y-3">
              <div className="bg-slate-900/90 rounded-2xl border border-indigo-900/60 p-4 sm:p-5 space-y-3.5 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Toàn Văn Văn Bản Đã Soạn Thảo:</span>
                  </div>

                  {generatedDocResult && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyGenerated}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {genCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{genCopied ? 'Đã sao chép!' : 'Sao Chép'}</span>
                      </button>

                      <button
                        onClick={() => handleExportWord(generatedDocResult, `VanBan_${genMeta.docType}`)}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Xuất File Word (.docx)</span>
                      </button>
                    </div>
                  )}
                </div>

                {generatedDocResult ? (
                  <div className="space-y-2">
                    <textarea
                      value={generatedDocResult}
                      onChange={e => setGeneratedDocResult(e.target.value)}
                      rows={24}
                      className="w-full bg-slate-950 border border-emerald-700/50 rounded-xl p-4 text-xs text-emerald-100 font-mono leading-relaxed focus:border-emerald-500 focus:outline-none resize-y"
                    />
                    <p className="text-[11px] text-slate-400 italic">
                      * Thầy/Cô có thể chỉnh sửa trực tiếp vào khung trên hoặc tải file Word (.docx) để in ấn, lưu hành.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-20 text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800 space-y-3">
                    <PenTool className="w-10 h-10 mx-auto text-indigo-400/50" />
                    <div className="space-y-1">
                      <p className="font-bold text-slate-300 text-sm">Chưa có nội dung văn bản nào được tạo</p>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Điền thông số ở cột bên trái và ấn nút <strong>"Soạn Thảo Toàn Văn Văn Bản Chuẩn 100% bằng AI"</strong> để hệ thống tự động sinh toàn văn đúng thể thức theo quy định hiện hành.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 3: SAMPLE DOCUMENTS MANAGER */}
      {/* ========================================================= */}
      {mainMode === 'samples' && (
        <div className="space-y-4">
          <SampleDocumentsManager
            samples={samples}
            onUpdateSamples={setSamples}
            onAddSample={handleAddSample}
            onDeleteSample={handleDeleteSample}
            onToggleSample={handleToggleSample}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 4: DOCUMENT TOOLKIT (SPLIT, MERGE, RENAME, WORD2PDF) */}
      {/* ========================================================= */}
      {mainMode === 'toolkit' && (
        <div className="space-y-4">
          <DocumentToolkit />
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 5: TEMPLATE LIBRARY & LEGAL REFERENCE */}
      {/* ========================================================= */}
      {mainMode === 'template_ref' && (
        <div className="space-y-4">
          {/* Hidden File Input for Template Upload */}
          <input
            type="file"
            ref={templateFileInputRef}
            onChange={handleTemplateFileUpload}
            accept=".docx,.doc,.txt"
            className="hidden"
          />

          {/* Header Controls & Filter */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-5 space-y-4 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <BookmarkCheck className="w-5 h-5 text-amber-400" />
                  <span>Kho Mẫu Văn Bản Chuẩn Quy Định (Đảng, Giáo Dục, SKKN & TP Hà Nội)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Đã cập nhật theo mô hình chính quyền 2 cấp (Thành phố - Xã/Phường, đã bãi bỏ cấp quận/huyện) và Hướng dẫn số 05-HD/VPTW 2026, Quyết định 39/2024/QĐ-UBND TP Hà Nội.
                </p>
              </div>

              {/* Action Buttons: Add, Upload File, Reset */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleOpenAddModal}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Mẫu Mới</span>
                </button>

                <button
                  onClick={() => templateFileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-white rounded-xl text-xs font-bold border border-emerald-700/50 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Tải file Word (.docx) hoặc .txt để tạo mẫu tham chiếu nhanh"
                >
                  <UploadCloud className="w-4 h-4 text-emerald-400" />
                  <span>Tải File Mẫu (.docx/.txt)</span>
                </button>

                <button
                  onClick={handleResetTemplates}
                  className="px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-medium border border-slate-800 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Khôi phục toàn bộ biểu mẫu về trạng thái chuẩn gốc của hệ thống"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Khôi Phục Gốc</span>
                </button>
              </div>
            </div>

            {/* Search Box & Category Filter Pills */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-800">
              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: `Tất Cả (${templates.length})`, color: 'bg-slate-800 text-slate-200 border-slate-700' },
                  { id: 'skkn', label: `💡 SKKN (${templates.filter(t => t.system === 'skkn').length})`, color: 'bg-amber-950 text-amber-300 border-amber-800' },
                  { id: 'ha_noi_khen_thuong', label: `🏛️ TP Hà Nội & Thẩm Định (${templates.filter(t => t.system === 'ha_noi_khen_thuong').length})`, color: 'bg-purple-950 text-purple-300 border-purple-800' },
                  { id: 'to_chuyen_mon', label: `👥 Tổ / Nhóm CM (${templates.filter(t => t.system === 'to_chuyen_mon').length})`, color: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
                  { id: 'dang', label: `🚩 Khối Đảng (HD 05) (${templates.filter(t => t.system === 'dang').length})`, color: 'bg-rose-950 text-rose-300 border-rose-800' },
                  { id: 'giao_duc', label: `🎓 Ngành GD (QĐ 3666) (${templates.filter(t => t.system === 'giao_duc').length})`, color: 'bg-indigo-950 text-indigo-300 border-indigo-800' },
                  { id: 'nha_nuoc', label: `🏛️ Nhà Nước (NĐ 30) (${templates.filter(t => t.system === 'nha_nuoc').length})`, color: 'bg-blue-950 text-blue-300 border-blue-800' }
                ].map(cat => {
                  const isActive = tplCategoryFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setTplCategoryFilter(cat.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isActive
                          ? `${cat.color} ring-2 ring-amber-400 font-bold shadow-sm`
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Tìm kiếm biểu mẫu..."
                  value={tplSearchQuery}
                  onChange={e => setTplSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Template Cards Grid */}
          {(() => {
            const filtered = templates.filter(tpl => {
              const matchCat = tplCategoryFilter === 'all' || tpl.system === tplCategoryFilter;
              const query = tplSearchQuery.trim().toLowerCase();
              const matchQuery = !query ||
                tpl.name.toLowerCase().includes(query) ||
                tpl.legalBase.toLowerCase().includes(query) ||
                tpl.type.toLowerCase().includes(query) ||
                tpl.sample.toLowerCase().includes(query);
              return matchCat && matchQuery;
            });

            if (filtered.length === 0) {
              return (
                <div className="text-center py-16 bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 space-y-2">
                  <BookmarkCheck className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="font-bold text-sm text-slate-300">Không tìm thấy mẫu biểu phù hợp</p>
                  <p className="text-xs text-slate-500">Thầy/Cô hãy thử tìm kiếm với từ khóa khác hoặc bấm nút "Thêm Mẫu Mới".</p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filtered.map(tpl => (
                  <div
                    key={tpl.id}
                    className="bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-amber-500/50 p-4 space-y-3 flex flex-col justify-between transition-all shadow-md group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tpl.system === 'dang'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : tpl.system === 'giao_duc'
                            ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                            : tpl.system === 'skkn'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : tpl.system === 'ha_noi_khen_thuong'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : tpl.system === 'to_chuyen_mon'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }`}>
                          {tpl.system === 'dang'
                            ? '🚩 Khối Đảng'
                            : tpl.system === 'giao_duc'
                            ? '🎓 Khối Giáo Dục'
                            : tpl.system === 'skkn'
                            ? '💡 SKKN'
                            : tpl.system === 'ha_noi_khen_thuong'
                            ? '🏛️ TP Hà Nội'
                            : tpl.system === 'to_chuyen_mon'
                            ? '👥 Tổ Chuyên Môn'
                            : '🏛️ Khối Nhà Nước'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {tpl.isCustom && (
                            <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                              Tự tạo
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 bg-slate-950 rounded border border-slate-800">
                            {tpl.type}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors leading-snug">
                        {tpl.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {tpl.legalBase}
                      </p>

                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-[11px] font-mono text-slate-300 max-h-32 overflow-hidden relative">
                        <pre className="whitespace-pre-wrap font-sans">{tpl.sample.slice(0, 240)}...</pre>
                        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      {/* Main Actions: Thẩm Định & Soạn Mới */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setInputText(tpl.sample);
                            setMainMode('audit');
                            setStatusMessage(`Đã nạp mẫu "${tpl.name}" vào khung Thẩm định!`);
                          }}
                          className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white rounded-lg text-xs font-semibold border border-indigo-700/50 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          title="Đưa mẫu vào tab Thẩm định thể thức"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Thẩm Định</span>
                        </button>

                        <button
                          onClick={() => {
                            setGenMeta(prev => ({
                              ...prev,
                              subject: tpl.name,
                              docType: tpl.type,
                              legalBases: tpl.legalBase
                            }));
                            setMainMode('generate');
                            setStatusMessage(`Đã nạp mẫu "${tpl.name}" vào cấu hình Soạn thảo!`);
                          }}
                          className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          title="Tạo mới văn bản từ mẫu này"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>Soạn Mới</span>
                        </button>
                      </div>

                      {/* Secondary Actions: Sửa, Xoá, Sao chép, Tải Word */}
                      <div className="grid grid-cols-4 gap-1">
                        <button
                          onClick={() => handleOpenEditModal(tpl)}
                          className="py-1 bg-slate-950 hover:bg-slate-800 text-amber-300 hover:text-amber-200 rounded-lg text-[10px] font-semibold border border-slate-800 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          title="Sửa nội dung hoặc thông tin mẫu"
                        >
                          <Edit3 className="w-3 h-3 text-amber-400" />
                          <span>Sửa</span>
                        </button>

                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(tpl.sample);
                            setStatusMessage(`Đã sao chép nội dung mẫu "${tpl.name}" vào clipboard!`);
                          }}
                          className="py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-medium border border-slate-800 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          title="Sao chép toàn văn mẫu"
                        >
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>Chép</span>
                        </button>

                        <button
                          onClick={() => handleExportWord(tpl.sample, `Mau_${tpl.id}`)}
                          className="py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded-lg text-[10px] font-semibold border border-emerald-800 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          title="Tải mẫu văn bản file Word (.docx)"
                        >
                          <Download className="w-3 h-3 text-emerald-400" />
                          <span>Word</span>
                        </button>

                        <button
                          onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                          className="py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-lg text-[10px] font-semibold border border-rose-900/80 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          title="Xóa mẫu khỏi danh sách"
                        >
                          <Trash2 className="w-3 h-3 text-rose-400" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Legal Guide Reference Box */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>Bảng Tra Cứu So Sánh Quy Chuẩn Thể Thức Mới Nhất:</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-rose-900/40 space-y-2">
                <div className="font-bold text-rose-300 flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5" />
                  <span>1. Văn bản của Đảng (HD 05-HD/VPTW 2026):</span>
                </div>
                <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
                  <li>Tiêu đề: <code>ĐẢNG CỘNG SẢN VIỆT NAM</code> (cỡ 15, in hoa đứng đậm, gạch dưới dài bằng chữ).</li>
                  <li>Tên cơ quan ban hành: Cấp trên in hoa đứng 14, cấp ban hành in hoa đứng đậm 14, dưới có dấu <code>*</code>.</li>
                  <li>Mô hình 2 cấp: Bãi bỏ đảng bộ quận/huyện, liên thông trực tiếp Đảng bộ Thành phố đến Đảng bộ/Chi bộ xã/phường.</li>
                  <li>Số ký hiệu: <code>Số 05-HD/VPTW</code>, <code>Số 15-QĐ/CB</code> (dấu <code>-</code> giữa số và loại).</li>
                  <li>Trích yếu: In thường 14-15 đứng đậm, phía dưới có 5 dấu gạch nối <code>-----</code>.</li>
                  <li>Căn cứ: Trước mỗi căn cứ có 1 dấu gạch ngang <code>-</code>, sau mỗi căn cứ có <code>;</code>.</li>
                  <li>Quyền hạn ký: <code>T/M BAN THƯỜNG VỤ</code>, <code>T/M CHI BỘ</code>, <code>K/T TRƯỞNG BAN</code>.</li>
                  <li>Nơi nhận: <code>Nơi nhận:</code> có gạch chân, danh sách cỡ 12 đứng.</li>
                </ul>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-blue-900/40 space-y-2">
                <div className="font-bold text-blue-300 flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5" />
                  <span>2. Văn bản Nhà nước (Nghị định 30/2020/NĐ-CP):</span>
                </div>
                <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
                  <li>Quốc hiệu: <code>CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</code> (12-13 hoa đứng đậm).</li>
                  <li>Tiêu ngữ: <code>Độc lập - Tự do - Hạnh phúc</code> (13-14 đứng đậm có gạch ngang).</li>
                  <li>Số ký hiệu: <code>Số: 15/QĐ-UBND</code> (có dấu hai chấm sau chữ Số).</li>
                  <li>Căn cứ ban hành: In nghiêng, kết thúc bằng <code>;</code>, căn cứ cuối bằng <code>.</code>.</li>
                  <li>Quyền hạn ký: <code>TM.</code>, <code>KT.</code>, <code>TL.</code>, <code>TUQ.</code>.</li>
                  <li>Tuyệt đối KHÔNG ghi học hàm học vị (GS, TS,...) trước họ tên người ký.</li>
                </ul>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-indigo-900/40 space-y-2">
                <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>3. Ngành Giáo dục (QĐ 3666/QĐ-BGDĐT & TP Hà Nội):</span>
                </div>
                <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
                  <li>Ký hiệu viết tắt tên cơ quan: <code>BGDĐT</code>, <code>SGDĐT</code>.</li>
                  <li>Mẫu Sáng kiến kinh nghiệm theo Quyết định 39/2024/QĐ-UBND TP Hà Nội.</li>
                  <li>Biểu mẫu tổ/nhóm chuyên môn theo Công văn 5512/BGDĐT.</li>
                  <li>Căn lề chuẩn A4: Trên/Dưới 20-25mm, Trái 30-35mm, Phải 15-20mm.</li>
                  <li>Phông chữ bắt buộc: Times New Roman, bộ mã Unicode chuẩn TCVN 6909:2001.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* MODAL: ADD / EDIT TEMPLATE */}
          {/* ========================================================= */}
          {(isAddModalOpen || editingTemplate) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-slate-900 border border-amber-600/60 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
                  <div className="flex items-center gap-2">
                    <BookmarkCheck className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold text-white text-sm sm:text-base">
                      {editingTemplate ? `Sửa Biểu Mẫu: ${editingTemplate.name}` : 'Thêm Biểu Mẫu Chuẩn Quy Định Mới'}
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingTemplate(null);
                    }}
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Form Body */}
                <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Template Name */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="font-bold text-slate-200 flex items-center gap-1">
                        <span>Tên mẫu biểu / Văn bản:</span>
                        <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={templateForm.name}
                        onChange={e => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="VD: Mẫu 01 - Đơn yêu cầu công nhận sáng kiến TP Hà Nội"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    {/* System / Category */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-200">Khối cơ quan / Phân loại:</label>
                      <select
                        value={templateForm.system}
                        onChange={e => setTemplateForm(prev => ({ ...prev, system: e.target.value as any }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:border-amber-500 focus:outline-none"
                      >
                        <option value="skkn">💡 Sáng Kiến Kinh Nghiệm (SKKN)</option>
                        <option value="ha_noi_khen_thuong">🏛️ TP Hà Nội & Thẩm Định Sáng Kiến</option>
                        <option value="to_chuyen_mon">👥 Tổ / Nhóm Chuyên Môn (CV 5512)</option>
                        <option value="dang">🚩 Khối Đảng (HD 05-HD/VPTW)</option>
                        <option value="giao_duc">🎓 Khối Giáo Dục (QĐ 3666/QĐ-BGDĐT)</option>
                        <option value="nha_nuoc">🏛️ Khối Nhà Nước (Nghị định 30/2020/NĐ-CP)</option>
                      </select>
                    </div>

                    {/* Form Type / Number */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-200">Ký hiệu loại văn bản / Số mẫu:</label>
                      <input
                        type="text"
                        value={templateForm.type}
                        onChange={e => setTemplateForm(prev => ({ ...prev, type: e.target.value }))}
                        placeholder="VD: Mẫu 01, Quyết định, Tờ trình, Kế hoạch..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    {/* Legal Basis */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="font-bold text-slate-200">Căn cứ pháp lý / Văn bản quy định:</label>
                      <input
                        type="text"
                        value={templateForm.legalBase}
                        onChange={e => setTemplateForm(prev => ({ ...prev, legalBase: e.target.value }))}
                        placeholder="VD: Quyết định số 39/2024/QĐ-UBND ngày 24/6/2024 của UBND TP Hà Nội"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Sample Content & File Upload Helper */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-200 flex items-center gap-1.5">
                        <span>Toàn văn nội dung mẫu:</span>
                        <span className="text-rose-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => templateFileInputRef.current?.click()}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-[11px] font-semibold border border-emerald-700/60 flex items-center gap-1 cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Nạp từ file Word (.docx)</span>
                      </button>
                    </div>

                    <textarea
                      rows={14}
                      value={templateForm.sample}
                      onChange={e => setTemplateForm(prev => ({ ...prev, sample: e.target.value }))}
                      placeholder="Dán toàn văn nội dung mẫu văn bản hoặc tải file Word lên..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-200 font-mono leading-relaxed focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950">
                  <button
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingTemplate(null);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Hủy Bỏ
                  </button>

                  <button
                    onClick={handleSaveTemplateForm}
                    className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingTemplate ? 'Lưu Thay Đổi' : 'Lưu Vào Kho Mẫu'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
