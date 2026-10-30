import React, { useState } from 'react';
import { generateGeminiText } from '../../lib/geminiApi';
import { 
  Target, 
  FileText, 
  Download, 
  Sparkles, 
  Shuffle, 
  Layers, 
  Printer, 
  BookOpen, 
  RefreshCw, 
  CheckCircle2, 
  Sliders, 
  Upload, 
  Copy, 
  HelpCircle,
  Edit3,
  ListOrdered
} from 'lucide-react';
import { exportMarkdownToWord, exportHanoiStandardBubbleSheet, stripIntroductoryChatter } from '../../lib/wordExport';
import { normalizeVietnameseTerminology } from '../../lib/terminologyUtils';
import { readFileAsText } from '../../lib/fileUtils';
import { A4DocumentPreview } from '../A4DocumentPreview';

interface Tab4ExamGeneratorProps {
  lessonContent: string;
  lessonText?: string;
  referenceCacheText?: string;
  apiKeysInput: string;
  monHoc: string;
  lop: string;
  onOpenApiGuide: () => void;
}

export const Tab4ExamGenerator: React.FC<Tab4ExamGeneratorProps> = ({
  lessonContent,
  lessonText = '',
  referenceCacheText = '',
  apiKeysInput,
  monHoc,
  lop,
  onOpenApiGuide
}) => {
  const hasTab3Content = Boolean(lessonContent && lessonContent.trim().length > 10);
  const hasSgkContent = Boolean(referenceCacheText && referenceCacheText.trim().length > 10);

  // Tab mode: Standard Matrix Generator vs Similar Exam Generator
  const [activeTabMode, setActiveTabMode] = useState<'standard_matrix' | 'similar_exam'>('standard_matrix');

  // Common Source mode
  const [sourceMode, setSourceMode] = useState<'tab3' | 'direct' | 'tab1' | 'sgk' | 'file'>(
    hasTab3Content ? 'tab3' : (hasSgkContent ? 'sgk' : (lessonText.trim() ? 'tab1' : 'direct'))
  );
  const [directTopic, setDirectTopic] = useState('');
  const [customFileText, setCustomFileText] = useState('');
  const [customFileName, setCustomFileName] = useState('');

  // Similar Exam state
  const [originalExamText, setOriginalExamText] = useState('');
  const [originalExamFileName, setOriginalExamFileName] = useState('');
  const [similarExamCount, setSimilarExamCount] = useState<'1' | '2' | '4' | '8'>('2');
  const [similarVariationType, setSimilarVariationType] = useState<'change_numbers' | 'change_context' | 'shuffle_and_vary'>('change_numbers');

  // Matrix Configuration Mode
  const [matrixMode, setMatrixMode] = useState<'auto' | 'file'>('auto');
  const [matrixFileText, setMatrixFileText] = useState('');
  const [matrixFileName, setMatrixFileName] = useState('');

  // Exam Specifications
  const [examType, setExamType] = useState('Kiểm tra Giữa kì');
  const [isCustomExamType, setIsCustomExamType] = useState(false);
  const [customExamType, setCustomExamType] = useState('');
  const [presetStructure, setPresetStructure] = useState<'thpt_national_2025' | '70_30' | '60_40' | '50_50' | '40_60' | '30_70' | '20_80' | '100_mcq' | '100_essay' | 'custom'>('thpt_national_2025');

  // Percentage & Score settings
  const [mcqPercentage, setMcqPercentage] = useState(100);
  const [essayPercentage, setEssayPercentage] = useState(0);

  // Cognitive Level Percentages (Sum = 100)
  const [levelNhanBiet, setLevelNhanBiet] = useState(40);
  const [levelThongHieu, setLevelThongHieu] = useState(30);
  const [levelVanDung, setLevelVanDung] = useState(20);
  const [levelVanDungCao, setLevelVanDungCao] = useState(10);

  // Detailed Question Parts & Score per Question
  // Part I: MCQ 4 choices
  const [part1Count, setPart1Count] = useState(12);
  const [part1ScoreEach, setPart1ScoreEach] = useState(0.25);

  // Part II: True/False (THPT National Exam standard format)
  const [part2Count, setPart2Count] = useState(4);
  const [part2ScoreEach, setPart2ScoreEach] = useState(1.0); // 1.0 per question (0.1, 0.25, 0.5, 1.0)

  // Part III: Short Answer (THPT National Exam standard format)
  const [part3Count, setPart3Count] = useState(6);
  const [part3ScoreEach, setPart3ScoreEach] = useState(0.5);

  // Part IV: Essay (Tự luận)
  const [part4Count, setPart4Count] = useState(0);
  const [part4ScoreEach, setPart4ScoreEach] = useState(1.5);

  // Shuffler
  const [isShuffle, setIsShuffle] = useState(true);
  const [shuffleCodesCount, setShuffleCodesCount] = useState('4');

  // Custom Requirements
  const [customRequirements, setCustomRequirements] = useState('');

  // Results & UI state
  const [generatedExamText, setGeneratedExamText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLandscapeMode, setIsLandscapeMode] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);

  // Apply preset structures
  const handleApplyPreset = (preset: 'thpt_national_2025' | '70_30' | '60_40' | '50_50' | '40_60' | '30_70' | '20_80' | '100_mcq' | '100_essay' | 'custom') => {
    setPresetStructure(preset);
    if (preset === 'thpt_national_2025') {
      // Mẫu cấu trúc Đề thi tốt nghiệp THPT mới từ năm 2025 của Bộ GD&ĐT (100% Trắc nghiệm 3 phần: 3.0đ + 4.0đ + 3.0đ = 10.0đ)
      setMcqPercentage(100);
      setEssayPercentage(0);
      setPart1Count(12);
      setPart1ScoreEach(0.25); // 3.0đ
      setPart2Count(4);
      setPart2ScoreEach(1.0);  // 4.0đ (mỗi câu 4 ý a,b,c,d)
      setPart3Count(6);
      setPart3ScoreEach(0.5);  // 3.0đ
      setPart4Count(0);
      setPart4ScoreEach(0);
      setLevelNhanBiet(40);
      setLevelThongHieu(30);
      setLevelVanDung(20);
      setLevelVanDungCao(10);
    } else if (preset === '70_30') {
      setMcqPercentage(70);
      setEssayPercentage(30);
      setPart1Count(28);
      setPart1ScoreEach(0.25); // 7.0đ
      setPart2Count(0);
      setPart3Count(0);
      setPart4Count(3);
      setPart4ScoreEach(1.0);  // 3.0đ
      setLevelNhanBiet(40);
      setLevelThongHieu(30);
      setLevelVanDung(20);
      setLevelVanDungCao(10);
    } else if (preset === '60_40') {
      setMcqPercentage(60);
      setEssayPercentage(40);
      setPart1Count(24);
      setPart1ScoreEach(0.25); // 6.0đ
      setPart2Count(0);
      setPart3Count(0);
      setPart4Count(4);
      setPart4ScoreEach(1.0);  // 4.0đ
      setLevelNhanBiet(40);
      setLevelThongHieu(30);
      setLevelVanDung(20);
      setLevelVanDungCao(10);
    } else if (preset === '50_50') {
      setMcqPercentage(50);
      setEssayPercentage(50);
      setPart1Count(20);
      setPart1ScoreEach(0.25); // 5.0đ
      setPart2Count(0);
      setPart3Count(0);
      setPart4Count(3);
      setPart4ScoreEach(1.66); // ~5.0đ
      setLevelNhanBiet(40);
      setLevelThongHieu(30);
      setLevelVanDung(20);
      setLevelVanDungCao(10);
    } else if (preset === '40_60') {
      setMcqPercentage(40);
      setEssayPercentage(60);
      setPart1Count(16);
      setPart1ScoreEach(0.25); // 4.0đ
      setPart2Count(0);
      setPart3Count(0);
      setPart4Count(3);
      setPart4ScoreEach(2.0);  // 6.0đ
      setLevelNhanBiet(35);
      setLevelThongHieu(35);
      setLevelVanDung(20);
      setLevelVanDungCao(10);
    } else if (preset === '30_70') {
      setMcqPercentage(30);
      setEssayPercentage(70);
      setPart1Count(12);
      setPart1ScoreEach(0.25); // 3.0đ
      setPart2Count(0);
      setPart3Count(0);
      setPart4Count(4);
      setPart4ScoreEach(1.75); // 7.0đ
      setLevelNhanBiet(30);
      setLevelThongHieu(40);
      setLevelVanDung(20);
      setLevelVanDungCao(10);
    } else if (preset === '20_80') {
      setMcqPercentage(20);
      setEssayPercentage(80);
      setPart1Count(8);
      setPart1ScoreEach(0.25); // 2.0đ
      setPart2Count(0);
      setPart3Count(0);
      setPart4Count(4);
      setPart4ScoreEach(2.0);  // 8.0đ
      setLevelNhanBiet(30);
      setLevelThongHieu(30);
      setLevelVanDung(25);
      setLevelVanDungCao(15);
    } else if (preset === '100_mcq') {
      setMcqPercentage(100);
      setEssayPercentage(0);
      setPart1Count(40);
      setPart1ScoreEach(0.25); // 10.0đ
      setPart2Count(0);
      setPart3Count(0);
      setPart4Count(0);
      setLevelNhanBiet(40);
      setLevelThongHieu(30);
      setLevelVanDung(20);
      setLevelVanDungCao(10);
    } else if (preset === '100_essay') {
      setMcqPercentage(0);
      setEssayPercentage(100);
      setPart1Count(0);
      setPart2Count(0);
      setPart3Count(0);
      setPart4Count(5);
      setPart4ScoreEach(2.0);  // 10.0đ
      setLevelNhanBiet(30);
      setLevelThongHieu(30);
      setLevelVanDung(30);
      setLevelVanDungCao(10);
    }
  };

  // Handle custom ratio slider change (TN % vs TL %)
  const handleCustomRatioChange = (newMcqPercent: number) => {
    const mcq = Math.max(0, Math.min(100, newMcqPercent));
    const essay = 100 - mcq;
    setMcqPercentage(mcq);
    setEssayPercentage(essay);
    setPresetStructure('custom');

    const mcqPoints = (mcq / 10);
    const essayPoints = (essay / 10);

    if (mcq === 0) {
      setPart1Count(0);
      setPart2Count(0);
      setPart3Count(0);
      setPart4Count(5);
      setPart4ScoreEach(2.0);
    } else if (essay === 0) {
      setPart1Count(Math.round(mcqPoints / 0.25));
      setPart1ScoreEach(0.25);
      setPart2Count(0);
      setPart3Count(0);
      setPart4Count(0);
      setPart4ScoreEach(0);
    } else {
      const qCount = Math.round(mcqPoints / 0.25);
      setPart1Count(qCount);
      setPart1ScoreEach(0.25);
      setPart2Count(0);
      setPart3Count(0);
      
      const essayQCount = essayPoints <= 3 ? 3 : (essayPoints <= 6 ? 4 : 5);
      setPart4Count(essayQCount);
      setPart4ScoreEach(Number((essayPoints / essayQCount).toFixed(2)));
    }
  };

  // Calculate total points
  const totalPoints = Number((
    (part1Count * part1ScoreEach) + 
    (part2Count * part2ScoreEach) + 
    (part3Count * part3ScoreEach) + 
    (part4Count * part4ScoreEach)
  ).toFixed(2));

  // Auto-balance total points to exactly 10.0
  const handleAutoBalanceTo10Points = () => {
    if (presetStructure === 'thpt_national_2025' || (part2Count > 0 && part3Count > 0)) {
      setPart1Count(12);
      setPart1ScoreEach(0.25); // 3.0đ
      setPart2Count(4);
      setPart2ScoreEach(1.0);  // 4.0đ
      setPart3Count(6);
      setPart3ScoreEach(0.5);  // 3.0đ
      setPart4Count(0);
      setPart4ScoreEach(0);
    } else if (part4Count > 0 && part1Count > 0) {
      // Mixed MCQ + Essay: 7.0 + 3.0 = 10.0
      setPart1Count(28);
      setPart1ScoreEach(0.25); // 7.0đ
      setPart4Count(3);
      setPart4ScoreEach(1.0);  // 3.0đ
      setPart2Count(0);
      setPart3Count(0);
    } else if (part1Count > 0) {
      setPart1Count(40);
      setPart1ScoreEach(0.25); // 10.0đ
      setPart2Count(0);
      setPart3Count(0);
      setPart4Count(0);
    } else {
      setPart4Count(5);
      setPart4ScoreEach(2.0);  // 10.0đ
      setPart1Count(0);
      setPart2Count(0);
      setPart3Count(0);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setTexter: (t: string) => void,
    setNamer: (n: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setNamer(file.name);
      try {
        const parsedKeys = apiKeysInput ? apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean) : [];
        const text = await readFileAsText(file, { apiKeys: parsedKeys });
        setTexter(text);
      } catch (err) {
        console.error('Lỗi đọc file:', err);
      }
    }
  };

  // 1. Generate Standard Exam from Matrix
  const handleGenerateStandardExam = async () => {
    setNotification(null);

    let sourceText = '';
    let topicName = '';

    if (sourceMode === 'tab3') {
      sourceText = lessonContent;
      topicName = 'Giáo án Tab 3';
    } else if (sourceMode === 'tab1') {
      sourceText = lessonText;
      topicName = 'Danh sách bài học Tab 1';
    } else if (sourceMode === 'sgk') {
      sourceText = referenceCacheText;
      topicName = 'File Sách Giáo Khoa (SGK) / Tài liệu tham khảo Tab 2';
    } else if (sourceMode === 'direct') {
      sourceText = directTopic;
      topicName = directTopic || `Chương trình ${monHoc} Lớp ${lop}`;
    } else if (sourceMode === 'file') {
      sourceText = customFileText;
      topicName = customFileName || 'File đề cương riêng';
    }

    if (!sourceText.trim()) {
      if (directTopic.trim()) {
        sourceText = directTopic;
        topicName = directTopic;
      } else if (referenceCacheText.trim()) {
        sourceText = referenceCacheText;
        topicName = 'File Sách Giáo Khoa (SGK)';
        setSourceMode('sgk');
      } else if (lessonText.trim()) {
        sourceText = lessonText;
        topicName = 'Bài học Tab 1';
        setSourceMode('tab1');
      } else if (lessonContent.trim()) {
        sourceText = lessonContent;
        topicName = 'Giáo án Tab 3';
        setSourceMode('tab3');
      } else {
        const defaultTopic = `Nội dung và yêu cầu cần đạt đề ${examType} môn ${monHoc} Lớp ${lop} theo Chương trình GDPT 2018`;
        sourceText = defaultTopic;
        topicName = defaultTopic;
        setDirectTopic(defaultTopic);
        setSourceMode('direct');
      }
    }

    const apiKeys = apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);

    setIsGenerating(true);
    setGeneratedExamText('');
    setNotification({
      message: `Đang kết nối AI để thiết lập Ma trận, Bảng đặc tả & Bộ Đề thi ${examType} môn ${monHoc} Lớp ${lop}...`,
      type: 'info'
    });

    const matrixPromptInstruction = matrixMode === 'file' && matrixFileText
      ? `BẮT BUỘC thiết kế đề tuân thủ ĐÚNG THEO KHUNG MA TRẬN MẪU BÊN TRONG FILE NÀY:\n${matrixFileText.slice(0, 3000)}`
      : 'AI TỰ ĐỘNG THIẾT KẾ MỘT BẢNG MA TRẬN ĐỀ KIỂM TRA ĐỊNH DẠNG BẢNG CHUẨN ĐỒNG BỘ.';

    const customReqInstruction = customRequirements.trim()
      ? `\n\n🎯 YÊU CẦU ĐẶC BIỆT CỦA GIÁO VIÊN VỀ NỘI DUNG VÀ HÌNH THỨC SẢN PHẨM (BẮT BUỘC TUÂN THỦ 100%):
${customRequirements.trim()}`
      : '';

    const formatDetails = `
CẤU TRÚC CHI TIẾT CÁC PHẦN TRONG ĐỀ THI:
- TỔNG ĐIỂM BÀI THI: ${totalPoints} điểm.
- TỈ LỆ ĐỀ THI: ${mcqPercentage}% Trắc nghiệm (${(mcqPercentage / 10).toFixed(1)}đ) - ${essayPercentage}% Tự luận (${(essayPercentage / 10).toFixed(1)}đ).
- TỈ LỆ NHẬN THỨC THEO MA TRẬN: Nhận biết ${levelNhanBiet}% | Thông hiểu ${levelThongHieu}% | Vận dụng ${levelVanDung}% | Vận dụng cao ${levelVanDungCao}%.
${part1Count > 0 ? `- PHẦN I: CÂU HỎI TRẮC NGHIỆM NHIỀU LỰA CHỌN: Gồm chính xác ${part1Count} câu (từ Câu 1 đến Câu ${part1Count}), mỗi câu ${part1ScoreEach} điểm (Tổng ${(part1Count * part1ScoreEach).toFixed(2)} điểm). Thí sinh chọn 1 trong 4 phương án A, B, C, D.` : ''}
${part2Count > 0 ? `- PHẦN II: CÂU HỎI TRẮC NGHIỆM ĐÚNG/SAI (THEO CẤU TRÚC ĐỀ THI TỐT NGHIỆP THPT MỚI TỪ NĂM 2025): Gồm chính xác ${part2Count} câu (từ Câu 1 đến Câu ${part2Count}), mỗi câu ${part2ScoreEach} điểm (Tổng ${(part2Count * part2ScoreEach).toFixed(2)} điểm). Mỗi câu có đầy đủ 4 ý a), b), c), d). Thí sinh chọn Đúng (Đ) hoặc Sai (S) cho từng ý. Thang điểm chuẩn: Đúng 1 ý được 0.1đ; đúng 2 ý được 0.25đ; đúng 3 ý được 0.5đ; đúng cả 4 ý được 1.0đ.` : ''}
${part3Count > 0 ? `- PHẦN III: CÂU HỎI TRẮC NGHIỆM TRẢ LỜI NGẮN (THEO CẤU TRÚC ĐỀ THI TỐT NGHIỆP THPT MỚI TỪ NĂM 2025): Gồm chính xác ${part3Count} câu (từ Câu 1 đến Câu ${part3Count}), mỗi câu ${part3ScoreEach} điểm (Tổng ${(part3Count * part3ScoreEach).toFixed(2)} điểm). Thí sinh điền kết quả/đáp số ngắn gọn vào ô trống.` : ''}
${part4Count > 0 ? `- PHẦN IV: CÂU HỎI TỰ LUẬN: Gồm chính xác ${part4Count} câu (từ Câu 1 đến Câu ${part4Count}), mỗi câu ${part4ScoreEach} điểm (Tổng ${(part4Count * part4ScoreEach).toFixed(2)} điểm), có đề bài hoàn chỉnh, hướng dẫn giải và thang điểm chi tiết từng bước.` : ''}
`;

    const effectiveExamType = isCustomExamType ? (customExamType.trim() || 'Đề kiểm tra') : examType;

    const prompt = `Lập Ma trận, Bảng đặc tả và Đề kiểm tra ${effectiveExamType} môn ${monHoc.toUpperCase()} LỚP ${lop}.
Chủ đề trọng tâm: ${topicName}

${formatDetails}

Căn cứ ma trận: ${matrixPromptInstruction}

QUY TẮC BÀN TAY SẮT - BẮT BUỘC SOẠN ĐỦ 100% CÂU HỎI - TUYỆT ĐỐI KHÔNG CẮT XÉN HOẶC TÓM TẮT:
1. TUYỆT ĐỐI KHÔNG ĐƯỢC TÓM TẮT, KHÔNG BỎ QUA, KHÔNG VIẾT "(Tiếp tục ... câu tương tự)", KHÔNG DÙNG DẤU CHẤM LỬNG "..." ĐỂ BỎ BỚT CÂU HỎI!
2. BẮT BUỘC VIẾT ĐẦY ĐỦ 100% CÁC CÂU HỎI:
   - Phần I có ${part1Count} câu: BẮT BUỘC viết đầy đủ từ Câu 1, Câu 2, ..., đến Câu ${part1Count}. Mỗi câu phải có đủ 4 lựa chọn A, B, C, D trên 4 dòng riêng biệt.
   - Phần II có ${part2Count} câu: BẮT BUỘC viết đủ tất cả các ý a), b), c), d) cho từng câu.
   - Phần III có ${part3Count} câu: BẮT BUỘC viết đủ đề bài cho từng câu.
   - Phần IV có ${part4Count} câu: BẮT BUỘC viết đầy đủ đề bài, câu hỏi con và thang điểm từng câu.
3. BẢNG MASTER KEY TỔNG HỢP: BẮT BUỘC liệt kê đủ 100% đáp án của TẤT CẢ các câu từ Câu 1 đến câu cuối cùng cho từng mã đề. TUYỆT ĐỐI KHÔNG DÙNG DẤU CHẤM LỬNG "..." TRONG BẢNG ĐÁP ÁN!
4. HƯỚNG DẪN GIẢI CHI TIẾT: BẮT BUỘC trình bày lời giải chi tiết từng bước, có đáp số và biểu điểm cụ thể cho 100% TẤT CẢ các câu hỏi trong đề, TUYỆT ĐỐI KHÔNG VIẾT MẪU VÀI CÂU!

QUY TẮC CẤU TRÚC ĐẦU RA (TUYỆT ĐỐI KHÔNG LỜI DẪN NHẬP):
1. BẮT ĐẦU NGAY BẰNG TIÊU ĐỀ: "# MA TRẬN, BẢNG ĐẶC TẢ VÀ ĐỀ KIỂM TRA MÔN ${monHoc.toUpperCase()} LỚP ${lop} - ${effectiveExamType.toUpperCase()}".
2. BẢNG 1: KHUNG MA TRẬN ĐỀ KIỂM TRA (Dạng bảng Markdown 4 mức độ: Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao).
3. BẢNG 2: BẢNG ĐẶC TẢ ĐỀ KIỂM TRA (Liệt kê nội dung kiến thức, đơn vị kiến thức, mức độ đánh giá, số câu hỏi).
4. ĐỀ KIỂM TRA CHÍNH THỨC: Trình bày rõ ràng theo từng Phần I, Phần II, Phần III, Phần IV (nếu có) đúng chuẩn thể thức văn bản đề thi của Bộ GD&ĐT.
${isShuffle ? `5. BỘ ĐỀ HOÁN VỊ TOÀN DIỆN (${shuffleCodesCount} MÃ ĐỀ):
   - BẮT BUỘC HOÁN VỊ CẢ PHẦN TRẮC NGHIỆM VÀ PHẦN TỰ LUẬN (hoán vị thứ tự câu, hoán vị các phương án A, B, C, D trong trắc nghiệm, và hoán vị thứ tự các bài tập hoặc thay đổi số liệu tương đương trong phần tự luận).
   - BẮT BUỘC XUẤT ĐẦY ĐỦ 100% NỘI DUNG ĐỀ CỦA TẤT CẢ ${shuffleCodesCount} MÃ ĐỀ (Ví dụ: Mã đề 101, Mã đề 102, Mã đề 103, Mã đề 104...). KHÔNG ĐƯỢC TÓM TẮT HAY CẮT BỚT BẤT KỲ MÃ ĐỀ NÀO!
   - BẢNG MASTER KEY TỔNG HỢP: Đáp án chuẩn của 100% các câu hỏi cho TẤT CẢ các mã đề (${shuffleCodesCount} mã đề) theo dạng bảng so sánh đối chiếu rõ ràng.
   - HƯỚNG DẪN GIẢI CHI TIẾT: Lời giải chi tiết từng bước và biểu điểm cho 100% từng câu hỏi (cả trắc nghiệm và tự luận) của tất cả các mã đề.` : `5. BẢNG ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM CHI TIẾT TỪNG BƯỚC CHO 100% CÂU HỎI.`}${customReqInstruction}

QUY TẮC CHÍNH TẢ & THUẬT NGỮ TOÁN HỌC - KHOA HỌC (BẮT BUỘC TUÂN THỦ 100%):
1. Thuật ngữ "phân số": Tuyệt đối KHÔNG viết nhầm thành "phần số". Luôn viết chính xác: "phân số", "phân số bằng nhau", "rút gọn phân số", "phân số tối giản", "tính chất cơ bản của phân số".
2. Ký hiệu Ước và Bội chuẩn xác 100%:
   - ƯC: Ước chung (viết hoa: ƯC hoặc ƯC(a, b)).
   - ƯCLN: Ước chung lớn nhất (viết hoa: ƯCLN hoặc ƯCLN(a, b)).
   - BC: Bội chung (viết hoa: BC hoặc BC(a, b)).
   - BCNN: Bội chung nhỏ nhất (viết hoa: BCNN hoặc BCNN(a, b)).
   - Ư(a): Tập hợp các ước của a; B(a): Tập hợp các bội của a.
3. Ký hiệu tập hợp số: \\mathbb{N}, \\mathbb{N}^*, \\mathbb{Z}, \\mathbb{Q}, \\mathbb{I}, \\mathbb{R}. Ký hiệu thuộc (\\in), không thuộc (\\notin), tập con (\\subset), giao (\\cap), hợp (\\cup).
4. Đọc hiểu và sử dụng chuẩn xác tất cả các ký hiệu của Toán học và các môn học khác theo chuẩn Chương trình GDPT 2018.

QUY TẮC TOÁN HỌC & LATEX MATHTYPE:
- Công thức toán/khoa học phức tạp (phân số, căn thức, phương trình, số mũ) bọc trong $...$.
- BẮT BUỘC viết đúng cú pháp LaTeX có dấu gạch chéo ngược: \\frac{a}{b}, \\sqrt{x}, \\in, \\notin, \\ne, \\cdot, \\pm, \\le, \\ge, \\Delta... TUYỆT ĐỐI KHÔNG BỎ MẤT DẤU GẠCH CHÉO NGƯỢC THÀNH frac{a}{b}!
- Số thường (1, 2, 5...), chữ cái đơn (A, B, C) và chữ Tiếng Việt KHÔNG bọc $.
- Nếu có hình vẽ, sử dụng môi trường TikZ: \\begin{tikzpicture} ... \\end{tikzpicture} hoặc mô tả dạng [ HÌNH VẼ MINH HỌA: ... ].

NỘI DUNG ĐỀ CƯƠNG / TÀI LIỆU NỀN TẢNG:
${sourceText.slice(0, 20000)}`;

    try {
      const textResult = await generateGeminiText({
        prompt,
        apiKeys,
        maxOutputTokens: 65536
      });
      if (textResult) {
        const cleaned = normalizeVietnameseTerminology(stripIntroductoryChatter(textResult));
        setGeneratedExamText(cleaned);
        setNotification({
          message: `Đã tạo thành công Ma trận, Bảng đặc tả & Đề thi ${effectiveExamType} môn ${monHoc} Lớp ${lop}!`,
          type: 'success'
        });
      } else {
        setNotification({
          message: 'Lỗi tạo đề thi: Không nhận được phản hồi từ AI',
          type: 'error'
        });
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      setNotification({
        message: `Lỗi AI: ${errMsg}`,
        type: 'error'
      });
      if (errMsg.includes('Hạn ngạch') || errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        onOpenApiGuide();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Generate Similar Exam from Original Uploaded Exam
  const handleGenerateSimilarExam = async () => {
    setNotification(null);

    if (!originalExamText.trim()) {
      alert('Vui lòng nhập hoặc tải file Đề thi gốc cần tạo đề tương tự!');
      return;
    }

    const apiKeys = apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);

    setIsGenerating(true);
    setGeneratedExamText('');
    setNotification({
      message: `Đang phân tích cấu trúc đề gốc & sinh ${similarExamCount} bộ đề tương tự kèm đáp án chi tiết...`,
      type: 'info'
    });

    const variationGuide = similarVariationType === 'change_numbers'
      ? 'GIỮ NGUYÊN 100% CẤU TRÚC DẠNG TOÁN/CÂU HỎI VÀ MỨC ĐỘ TƯ DUY, CHỈ THAY ĐỔI CÁC THÔNG SỐ SỐ LIỆU, ĐẠI LƯỢNG VÀ TÍNH TOÁN LẠI ĐÁP SỐ CHÍNH XÁC.'
      : similarVariationType === 'change_context'
      ? 'GIỮ NGUYÊN DẠNG BÀI VÀ MỨC ĐỘ NHẬN THỨC, THAY ĐỔI NGỮ CẢNH TÌNH HUỐNG THỰC TẾ, ĐỐI TƯỢNG VÀ PHƯƠNG ÁN GÂY NHIỄU.'
      : 'KẾT HỢP HOÁN VỊ VỊ TRÍ CÂU HỎI, THAY ĐỔI SỐ LIỆU VÀ CÁC PHƯƠNG ÁN LỰA CHỌN ĐỂ TẠO CÁC MÃ ĐỀ TƯƠNG ĐƯƠNG.';

    const prompt = `Bạn là Chuyên gia Khảo thí và Đánh giá Giáo dục hàng đầu.
Nhiệm vụ: Phân tích ĐỀ THI GỐC được cung cấp dưới đây và TẠO RA BỘ ĐỀ THI MỚI TƯƠNG TỰ (ĐỀ TƯƠNG ĐƯƠNG VỀ CẤU TRÚC VÀ ĐỘ KHÓ).

MÔN HỌC: ${monHoc.toUpperCase()} | LỚP: ${lop}
SỐ LƯỢNG MÃ ĐỀ TƯƠNG TỰ CẦN TẠO: ${similarExamCount} Mã đề.
YÊU CẦU BIẾN THỂ: ${variationGuide}

QUY TẮC TẠO ĐỀ TƯƠNG TỰ:
1. KHÔNG THAY ĐỔI CẤU TRÚC ĐỀ: Nếu đề gốc có bao nhiêu câu trắc nghiệm nhiều lựa chọn, đúng/sai, trả lời ngắn hay tự luận thì đề mới phải có đúng số lượng câu và dạng bài tương ứng.
2. TƯƠNG ĐỒNG VỀ ĐỘ KHÓ: Mỗi câu hỏi trong đề mới phải tương đương hoàn toàn về mức độ nhận thức (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao) với câu hỏi tương ứng trong đề gốc.
3. TÍNH CHÍNH XÁC KHOA HỌC & THUẬT NGỮ: Tuyệt đối dùng thuật ngữ chính xác ("phân số", "ước chung ƯC", "ước chung lớn nhất ƯCLN", "bội chung BC", "bội chung nhỏ nhất BCNN"). Mọi số liệu thay đổi phải đảm bảo kết quả tính toán đẹp, hợp lí, không sinh ra nghiệm vô lí.
4. XUẤT ĐẦY ĐỦ:
   - BẢNG MA TRẬN & BẢNG SO SÁNH ĐỐI CHIẾU (Câu hỏi đề gốc vs Câu hỏi đề tương tự).
   - NỘI DUNG CHI TIẾT CỦA TỪNG MÃ ĐỀ MỚI (${similarExamCount} mã đề).
   - BẢNG MASTER KEY ĐÁP ÁN TỔNG HỢP CHO TẤT CẢ CÁC MÃ ĐỀ.
   - HƯỚNG DẪN GIẢI CHI TIẾT TỪNG BƯỚC CHO TẤT CẢ CÁC CÂU HỎI.

QUY TẮC MATHTYPE & LATEX:
- Công thức toán/khoa học bọc trong $...$.
- Chữ Tiếng Việt và số thường KHÔNG bọc $.

NỘI DUNG ĐỀ THI GỐC:
${originalExamText.slice(0, 20000)}`;

    try {
      const textResult = await generateGeminiText({
        prompt,
        apiKeys,
        maxOutputTokens: 65536
      });
      if (textResult) {
        const cleaned = normalizeVietnameseTerminology(stripIntroductoryChatter(textResult));
        setGeneratedExamText(cleaned);
        setNotification({
          message: `Đã tạo thành công ${similarExamCount} bộ đề tương tự kèm ma trận và đáp án chi tiết!`,
          type: 'success'
        });
      } else {
        setNotification({
          message: 'Lỗi tạo đề tương tự: Không nhận được phản hồi từ AI',
          type: 'error'
        });
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      setNotification({
        message: `Lỗi AI: ${errMsg}`,
        type: 'error'
      });
      if (errMsg.includes('Hạn ngạch') || errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        onOpenApiGuide();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportWord = async () => {
    if (!generatedExamText.trim()) {
      alert('Chưa có nội dung đề thi để xuất!');
      return;
    }
    setTimeout(async () => {
      try {
        await exportMarkdownToWord(generatedExamText, {
          headerText: `ĐỀ KIỂM TRA ${examType.toUpperCase()} MÔN ${monHoc.toUpperCase()}`,
          footerText: `Trường: ... - Phòng/Sở GD&ĐT: ...`,
          monHoc,
          lop,
          isLandscape: isLandscapeMode,
          fileName: `Bo_De_Thi_${examType.replace(/\s+/g, '_')}_${monHoc}_Lop_${lop}.docx`
        });
        alert(`Đã xuất file Word đề thi thành công (${isLandscapeMode ? 'Khổ ngang A4' : 'Khổ dọc A4'})!`);
      } catch (err: any) {
        alert('Lỗi xuất file Word đề thi: ' + (err.message || 'Không thể tạo file'));
      }
    }, 50);
  };

  const handleDownloadHanoiBubbleSheet = async () => {
    try {
      await exportHanoiStandardBubbleSheet({
        questionCount: 40,
        monHoc,
        lop,
        schoolName: 'TRƯỜNG: ...',
        examTitle: 'KỲ THI TUYỂN SINH VÀO LỚP 10 THPT / KIỂM TRA ĐỊNH KỲ',
        fileName: `Phieu_To_Trac_Nghiem_SoGDHN_40_Cau_Lop_${lop}.docx`
      });
      alert('Đã xuất thành công Phiếu tô trắc nghiệm chuẩn Sở GD&ĐT Hà Nội (Khổ dọc A4 - 1 Trang duy nhất)!');
    } catch (err: any) {
      alert('Lỗi xuất phiếu trắc nghiệm: ' + (err.message || 'Không thể tạo file'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                4. Khảo Thí, Thiết Kế Ma Trận, Trộn Hoán Vị Đề & Tạo Đề Tương Tự
              </h2>
              <p className="text-xs text-slate-400">
                Cập nhật đầy đủ dạng bài Trắc nghiệm THPT Quốc gia mới (Nhiều lựa chọn, Đúng/Sai, Trả lời ngắn) & Tạo đề tương tự từ đề gốc.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadHanoiBubbleSheet}
              className="px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow transition-all"
              title="Tải Phiếu trả lời trắc nghiệm chuẩn Sở GD&ĐT Hà Nội (Ô tròn, SBD, Mã đề - 1 trang A4)"
            >
              <Printer className="w-3.5 h-3.5" /> Phiếu Tô Vào 10 (Sở HN)
            </button>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setIsLandscapeMode(true)}
                className={`px-2.5 py-1 rounded font-bold text-[11px] transition-all ${
                  isLandscapeMode
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Khổ ngang A4 - Rất phù hợp cho Bảng Ma trận & Bảng Đặc tả"
              >
                Khổ ngang A4
              </button>
              <button
                type="button"
                onClick={() => setIsLandscapeMode(false)}
                className={`px-2.5 py-1 rounded font-bold text-[11px] transition-all ${
                  !isLandscapeMode
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Khổ dọc A4"
              >
                Khổ dọc A4
              </button>
            </div>

            <button
              onClick={handleExportWord}
              disabled={!generatedExamText}
              className={`px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                generatedExamText
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Download className="w-3.5 h-3.5" /> Xuất File Word ({isLandscapeMode ? 'Khổ ngang' : 'Khổ dọc'})
            </button>
          </div>
        </div>

        {/* Tab Mode Selector */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTabMode('standard_matrix')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              activeTabMode === 'standard_matrix'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>1. Thiết Kế Đề Theo Ma Trận, Đặc Tả & Tỉ Lệ Điểm Số Chi Tiết</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTabMode('similar_exam')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              activeTabMode === 'similar_exam'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>2. 🔄 Đăng Đề Bài Gốc ➔ Tạo Đề & Đáp Án Tương Tự (Sửa Tay & AI)</span>
          </button>
        </div>

        {/* Notification / Status Message Box */}
        {notification && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
              notification.type === 'success'
                ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-200'
                : notification.type === 'error'
                ? 'bg-rose-950/50 border-rose-700/60 text-rose-200'
                : 'bg-cyan-950/50 border-cyan-700/60 text-cyan-200'
            }`}
          >
            <span className="font-bold text-sm mt-0.5">
              {notification.type === 'success' ? '✓' : notification.type === 'error' ? '⚠️' : 'ℹ️'}
            </span>
            <div className="flex-1 leading-relaxed">
              {notification.message}
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-200 text-xs px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* MODE 1: Standard Matrix Generator */}
        {activeTabMode === 'standard_matrix' && (
          <div className="space-y-4">
            {/* Quick Structure Presets & Ratio Selector */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <label className="block text-amber-300 font-bold text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Chọn Nhanh Khung Cấu Trúc & Tỉ Lệ Trắc Nghiệm / Tự Luận:</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  Đang chọn: <span className="text-cyan-300 font-bold">{mcqPercentage}% Trắc nghiệm ({(mcqPercentage/10).toFixed(1)}đ) - {essayPercentage}% Tự luận ({(essayPercentage/10).toFixed(1)}đ)</span>
                </span>
              </div>

              {/* Preset Buttons Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {[
                  { id: 'thpt_national_2025', label: '⭐ Đề THPT QG 2025 (3 Phần)', color: 'border-amber-500 text-amber-300 bg-amber-950/40' },
                  { id: '70_30', label: '70% TN (7.0đ) - 30% TL (3.0đ)', color: 'border-cyan-500 text-cyan-300 bg-cyan-950/40' },
                  { id: '60_40', label: '60% TN (6.0đ) - 40% TL (4.0đ)', color: 'border-teal-500 text-teal-300 bg-teal-950/40' },
                  { id: '50_50', label: '50% TN (5.0đ) - 50% TL (5.0đ)', color: 'border-indigo-500 text-indigo-300 bg-indigo-950/40' },
                  { id: '40_60', label: '40% TN (4.0đ) - 60% TL (6.0đ)', color: 'border-blue-500 text-blue-300 bg-blue-950/40' },
                  { id: '30_70', label: '30% TN (3.0đ) - 70% TL (7.0đ)', color: 'border-sky-500 text-sky-300 bg-sky-950/40' },
                  { id: '20_80', label: '20% TN (2.0đ) - 80% TL (8.0đ)', color: 'border-violet-500 text-violet-300 bg-violet-950/40' },
                  { id: '100_mcq', label: '100% Trắc nghiệm (40 câu)', color: 'border-emerald-500 text-emerald-300 bg-emerald-950/40' },
                  { id: '100_essay', label: '100% Tự luận (Đề HSG/TL)', color: 'border-purple-500 text-purple-300 bg-purple-950/40' },
                  { id: 'custom', label: '🎛️ Tùy Chỉnh Tự Do', color: 'border-rose-500 text-rose-300 bg-rose-950/40' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleApplyPreset(item.id as any)}
                    className={`p-2 rounded-lg text-[11px] font-bold text-left border transition-all cursor-pointer ${
                      presetStructure === item.id
                        ? `${item.color} ring-2 ring-cyan-400 shadow-md`
                        : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Custom interactive percentage slider */}
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex flex-wrap items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Thanh Trượt Tự Chọn Tỉ Lệ Trắc Nghiệm / Tự Luận:</span>
                  </span>
                  <div className="flex items-center gap-2 font-mono font-bold text-xs">
                    <span className="text-cyan-400">Trắc nghiệm: {mcqPercentage}% ({(mcqPercentage/10).toFixed(1)}đ)</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-amber-400">Tự luận: {essayPercentage}% ({(essayPercentage/10).toFixed(1)}đ)</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-cyan-400 whitespace-nowrap">0% TN (100% TL)</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={mcqPercentage}
                    onChange={e => handleCustomRatioChange(Number(e.target.value))}
                    className="flex-1 accent-cyan-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                  />
                  <span className="text-[11px] font-bold text-amber-400 whitespace-nowrap">100% TN (0% TL)</span>
                </div>
              </div>
            </div>

            {/* Detailed Question Formats & Points Configuration */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <label className="text-cyan-300 font-bold flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-cyan-400" />
                  <span>Cài Đặt Số Câu Hỏi, Thang Điểm Từng Phần & Tỉ Lệ Nhận Thức:</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Tổng điểm bài thi:</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold font-mono text-xs ${totalPoints === 10 ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700' : 'bg-rose-900/80 text-rose-300 border border-rose-700 animate-pulse'}`}>
                    {totalPoints} / 10.0 Điểm {totalPoints === 10 ? '✓ Đạt chuẩn' : '⚠️ Lệch 10đ'}
                  </span>
                  {totalPoints !== 10 && (
                    <button
                      type="button"
                      onClick={handleAutoBalanceTo10Points}
                      className="px-2.5 py-0.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] shadow transition-all flex items-center gap-1"
                      title="Tự động cân đối số câu và điểm từng phần để tổng điểm đúng bằng 10.0 điểm"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>⚡ Cân đối về 10.0đ</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 4 Question Parts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Part I */}
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                  <div className="font-bold text-cyan-400 flex items-center justify-between">
                    <span>Phần I: Trắc nghiệm 4 Lựa Chọn</span>
                    <span className="text-[10px] text-slate-400">{(part1Count * part1ScoreEach).toFixed(2)}đ</span>
                  </div>
                  <p className="text-[10px] text-slate-400">4 phương án A, B, C, D chọn 1 đáp án đúng</p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Số câu hỏi:</label>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={part1Count}
                        onChange={e => setPart1Count(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-center font-bold text-cyan-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Điểm/câu:</label>
                      <input
                        type="number"
                        step={0.05}
                        min={0}
                        max={5}
                        value={part1ScoreEach}
                        onChange={e => setPart1ScoreEach(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-center font-bold text-cyan-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Part II */}
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                  <div className="font-bold text-emerald-400 flex items-center justify-between">
                    <span>Phần II: Trắc nghiệm Đúng / Sai</span>
                    <span className="text-[10px] text-slate-400">{(part2Count * part2ScoreEach).toFixed(2)}đ</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Mỗi câu gồm 4 ý a), b), c), d) chọn Đ/S</p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Số câu hỏi:</label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={part2Count}
                        onChange={e => setPart2Count(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-center font-bold text-emerald-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Điểm/câu:</label>
                      <input
                        type="number"
                        step={0.1}
                        min={0}
                        max={5}
                        value={part2ScoreEach}
                        onChange={e => setPart2ScoreEach(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-center font-bold text-emerald-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Part III */}
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                  <div className="font-bold text-amber-400 flex items-center justify-between">
                    <span>Phần III: Trả lời ngắn</span>
                    <span className="text-[10px] text-slate-400">{(part3Count * part3ScoreEach).toFixed(2)}đ</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Học sinh điền kết quả / đáp số ngắn gọn</p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Số câu hỏi:</label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={part3Count}
                        onChange={e => setPart3Count(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-center font-bold text-amber-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Điểm/câu:</label>
                      <input
                        type="number"
                        step={0.1}
                        min={0}
                        max={5}
                        value={part3ScoreEach}
                        onChange={e => setPart3ScoreEach(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-center font-bold text-amber-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Part IV */}
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                  <div className="font-bold text-purple-400 flex items-center justify-between">
                    <span>Phần IV: Câu hỏi Tự Luận</span>
                    <span className="text-[10px] text-slate-400">{(part4Count * part4ScoreEach).toFixed(2)}đ</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Trình bày bài giải tự luận phân hóa</p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Số câu hỏi:</label>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={part4Count}
                        onChange={e => setPart4Count(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-center font-bold text-purple-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Điểm/câu:</label>
                      <input
                        type="number"
                        step={0.25}
                        min={0}
                        max={10}
                        value={part4ScoreEach}
                        onChange={e => setPart4ScoreEach(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-center font-bold text-purple-300"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Cognitive Levels */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-300">Tỉ lệ 4 mức độ nhận thức ma trận:</span>
                  <span className={`text-[11px] font-bold ${levelNhanBiet + levelThongHieu + levelVanDung + levelVanDungCao === 100 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    Tổng: {levelNhanBiet + levelThongHieu + levelVanDung + levelVanDungCao}% (Chuẩn 100%)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-slate-900 p-2 rounded border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">1. Nhận biết:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={levelNhanBiet}
                        onChange={e => setLevelNhanBiet(parseInt(e.target.value) || 0)}
                        className="w-12 bg-slate-950 border border-slate-700 rounded p-1 text-center font-bold text-cyan-300"
                      />
                      <span className="text-slate-400">%</span>
                    </div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">2. Thông hiểu:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={levelThongHieu}
                        onChange={e => setLevelThongHieu(parseInt(e.target.value) || 0)}
                        className="w-12 bg-slate-950 border border-slate-700 rounded p-1 text-center font-bold text-emerald-300"
                      />
                      <span className="text-slate-400">%</span>
                    </div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">3. Vận dụng:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={levelVanDung}
                        onChange={e => setLevelVanDung(parseInt(e.target.value) || 0)}
                        className="w-12 bg-slate-950 border border-slate-700 rounded p-1 text-center font-bold text-amber-300"
                      />
                      <span className="text-slate-400">%</span>
                    </div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">4. Vận dụng cao:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={levelVanDungCao}
                        onChange={e => setLevelVanDungCao(parseInt(e.target.value) || 0)}
                        className="w-12 bg-slate-950 border border-slate-700 rounded p-1 text-center font-bold text-purple-300"
                      />
                      <span className="text-slate-400">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Source & Shuffler 3 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* 1. Source Data */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-cyan-300 font-bold">1. Nguồn Dữ liệu Ôn tập / Giới hạn Đề:</label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="source"
                      checked={sourceMode === 'direct'}
                      onChange={() => setSourceMode('direct')}
                      className="text-cyan-500 bg-slate-900"
                    />
                    <span className="font-semibold text-cyan-400">Nhập trực tiếp Chủ đề / Giới hạn ôn thi</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="source"
                      checked={sourceMode === 'sgk'}
                      onChange={() => setSourceMode('sgk')}
                      className="text-cyan-500 bg-slate-900"
                    />
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                      <span>File Sách Giáo Khoa (SGK)</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${hasSgkContent ? 'bg-emerald-900/60 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                        {hasSgkContent ? `${referenceCacheText.length} ký tự` : 'Chưa nạp'}
                      </span>
                    </span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="source"
                      checked={sourceMode === 'tab3'}
                      onChange={() => setSourceMode('tab3')}
                      className="text-cyan-500 bg-slate-900"
                    />
                    <span>
                      Lấy từ Giáo án Tab 3{' '}
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${hasTab3Content ? 'bg-emerald-900/60 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                        {hasTab3Content ? `${lessonContent.length} ký tự` : 'Trống'}
                      </span>
                    </span>
                  </label>

                  {lessonText.trim() && (
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="source"
                        checked={sourceMode === 'tab1'}
                        onChange={() => setSourceMode('tab1')}
                        className="text-cyan-500 bg-slate-900"
                      />
                      <span>Lấy từ Danh sách bài học Tab 1</span>
                    </label>
                  )}

                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="source"
                      checked={sourceMode === 'file'}
                      onChange={() => setSourceMode('file')}
                      className="text-cyan-500 bg-slate-900"
                    />
                    <span className="font-semibold text-purple-400">Nạp tài liệu bất kỳ (PDF, Word, Excel, TXT...):</span>
                  </label>

                  {sourceMode === 'direct' && (
                    <div className="pt-1 space-y-1 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <input
                        type="text"
                        value={directTopic}
                        onChange={e => setDirectTopic(e.target.value)}
                        placeholder={`Ví dụ: Giới hạn kiểm tra giữa kì môn ${monHoc} Lớp ${lop}...`}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {sourceMode === 'file' && (
                    <div className="pt-1 space-y-1.5 bg-purple-950/20 p-2.5 rounded-lg border border-purple-800/40">
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.md,.json,.xml"
                        onChange={e => handleFileUpload(e, setCustomFileText, setCustomFileName)}
                        className="block w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-purple-800 file:text-white hover:file:bg-purple-700"
                      />
                      {customFileName ? (
                        <div className="flex items-center justify-between text-[11px] text-emerald-300 bg-emerald-950/40 p-1.5 rounded border border-emerald-800/40">
                          <span>✓ Đã nạp: <strong>{customFileName}</strong> ({customFileText.length} ký tự)</span>
                          <button
                            type="button"
                            onClick={() => { setCustomFileText(''); setCustomFileName(''); }}
                            className="text-slate-400 hover:text-rose-300 font-bold"
                          >
                            Xóa
                          </button>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">
                          Hỗ trợ tệp Đề cương, Bài giảng, Đề tham khảo dạng PDF, Word, TXT...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Matrix Selection */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-indigo-300 font-bold">2. Khung Ma Trận & Bảng Đặc Tả:</label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="matrix"
                      checked={matrixMode === 'auto'}
                      onChange={() => setMatrixMode('auto')}
                      className="text-indigo-500 bg-slate-900"
                    />
                    <span>AI Tự lập Ma trận Cân đối chuẩn GDPT 2018</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="matrix"
                      checked={matrixMode === 'file'}
                      onChange={() => setMatrixMode('file')}
                      className="text-indigo-500 bg-slate-900"
                    />
                    <span className="font-semibold text-indigo-400">Nạp File Ma trận / Khung mẫu có sẵn:</span>
                  </label>

                  {matrixMode === 'file' && (
                    <div className="pt-1 space-y-1.5 bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-800/40">
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.md,.json,.xml"
                        onChange={e => handleFileUpload(e, setMatrixFileText, setMatrixFileName)}
                        className="block w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-indigo-800 file:text-white hover:file:bg-indigo-700"
                      />
                      {matrixFileName ? (
                        <div className="flex items-center justify-between text-[11px] text-emerald-300 bg-emerald-950/40 p-1.5 rounded border border-emerald-800/40">
                          <span>✓ Đã nạp: <strong>{matrixFileName}</strong> ({matrixFileText.length} ký tự)</span>
                          <button
                            type="button"
                            onClick={() => { setMatrixFileText(''); setMatrixFileName(''); }}
                            className="text-slate-400 hover:text-rose-300 font-bold"
                          >
                            Xóa
                          </button>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">
                          Hỗ trợ tệp Khung ma trận phân phối tỉ lệ dạng Word, Excel, PDF...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Exam Type & Shuffler */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-amber-300 font-bold">3. Loại Kỳ Thi & Hoán Vị Mã Đề:</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomExamType(!isCustomExamType);
                      if (!isCustomExamType && !customExamType) {
                        setCustomExamType(examType);
                      }
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-semibold cursor-pointer"
                  >
                    {isCustomExamType ? '◀ Chọn từ danh mục mẫu' : '✏️ Tự gõ loại kì thi'}
                  </button>
                </div>

                {!isCustomExamType ? (
                  <div>
                    <label className="block text-slate-400 mb-0.5">Chọn loại kì thi chuẩn:</label>
                    <select
                      value={examType}
                      onChange={e => {
                        if (e.target.value === '__custom__') {
                          setIsCustomExamType(true);
                          if (!customExamType) setCustomExamType('');
                        } else {
                          setExamType(e.target.value);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="Kiểm tra thường xuyên (15 phút)">Kiểm tra thường xuyên (15 phút)</option>
                      <option value="Kiểm tra Giữa kì">Kiểm tra Giữa kì</option>
                      <option value="Kiểm tra Cuối kì">Kiểm tra Cuối kì</option>
                      <option value="Đề khảo sát chất lượng / Thi thử Vào 10">Đề khảo sát chất lượng / Thi thử Vào 10</option>
                      <option value="Đề thi thử Tốt nghiệp THPT Quốc gia 2025">Đề thi thử Tốt nghiệp THPT Quốc gia 2025</option>
                      <option value="Đề thi chọn Học sinh giỏi">Đề thi chọn Học sinh giỏi</option>
                      <option value="__custom__">✏️ Tự nhập loại kì thi khác...</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1.5 bg-amber-950/20 p-2 rounded-lg border border-amber-800/40">
                    <label className="block text-amber-300 text-[11px] font-semibold">
                      Nhập tên / loại kì thi theo nhu cầu của Thầy/Cô:
                    </label>
                    <input
                      type="text"
                      value={customExamType}
                      onChange={e => setCustomExamType(e.target.value)}
                      placeholder="Ví dụ: Khảo sát đầu năm, Thi nghề phổ thông, Đánh giá năng lực..."
                      className="w-full bg-slate-900 border border-amber-600/60 rounded p-1.5 text-slate-100 text-xs focus:border-amber-400 focus:outline-none placeholder:text-slate-500"
                    />
                    <div className="flex flex-wrap gap-1 pt-1">
                      <span className="text-[10px] text-slate-400">Gợi ý nhanh:</span>
                      {[
                        'Khảo sát đầu năm',
                        'Thi thử vào 10 đợt 1',
                        'Thi thử vào 10 đợt 2',
                        'Đánh giá năng lực ĐHQG',
                        'Kiểm tra định kì 1 tiết',
                        'Thi nghề phổ thông',
                        'Thi chọn Đội tuyển HSG'
                      ].map(sug => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setCustomExamType(sug)}
                          className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] text-slate-300 rounded cursor-pointer"
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isShuffle}
                      onChange={e => setIsShuffle(e.target.checked)}
                      className="w-3.5 h-3.5 text-amber-500 rounded bg-slate-900"
                    />
                    <span className="font-semibold text-amber-400">Trộn nhiều mã đề</span>
                  </label>

                  {isShuffle && (
                    <select
                      value={shuffleCodesCount}
                      onChange={e => setShuffleCodesCount(e.target.value as any)}
                      className="bg-slate-900 border border-slate-700 rounded p-1 text-cyan-300 font-bold"
                    >
                      <option value="2">2 Mã đề</option>
                      <option value="4">4 Mã đề</option>
                      <option value="8">8 Mã đề</option>
                      <option value="16">16 Mã đề</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Custom Requirements Box */}
            <div className="bg-slate-950 p-4 rounded-xl border border-cyan-900/40 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-cyan-300 font-bold">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Yêu cầu bổ sung về Nội dung & Hình thức sản phẩm tạo ra (Tùy chọn nâng cao):</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  Nhập bất kỳ yêu cầu cụ thể nào về dạng bài, thang điểm, ngữ cảnh thực tế...
                </span>
              </div>

              <textarea
                value={customRequirements}
                onChange={e => setCustomRequirements(e.target.value)}
                rows={2}
                placeholder="Ví dụ: Bổ sung 2 bài toán thực tế liên hệ đời sống; Thiết kế bảng ma trận và bảng đặc tả chi tiết từng câu; Thang điểm chi tiết 0.25đ từng bước; Bảng đáp án có phần giải thích ngắn gọn; Phân hóa rõ câu 9-10 điểm..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none placeholder:text-slate-500 leading-relaxed font-sans"
              />

              {/* Quick chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 font-medium">Gợi ý nhanh:</span>
                {[
                  'Bổ sung 2 bài toán thực tế liên hệ đời sống',
                  'Thang điểm chi tiết 0.25 điểm từng bước giải',
                  'Bảng đặc tả chi tiết mức độ nhận thức từng câu',
                  'Phân hóa câu vận dụng cao (9-10 điểm)',
                  'Bảng Master Key có kèm giải thích vắn tắt lý do chọn đáp án',
                  'Định dạng bảng ma trận chuẩn 4 mức độ GDPT 2018'
                ].map((tag, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (!customRequirements.includes(tag)) {
                        setCustomRequirements(prev => prev ? `${prev}; ${tag}` : tag);
                      }
                    }}
                    className="px-2 py-0.5 rounded-full bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-[10px] transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
                {customRequirements && (
                  <button
                    type="button"
                    onClick={() => setCustomRequirements('')}
                    className="px-2 py-0.5 rounded-full bg-rose-950/40 text-rose-300 border border-rose-800 text-[10px] ml-auto hover:bg-rose-900/60"
                  >
                    Xóa yêu cầu
                  </button>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                onClick={handleGenerateStandardExam}
                disabled={isGenerating}
                className={`px-8 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-xl transition-all ${
                  isGenerating
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-500 hover:to-red-500 shadow-orange-900/30'
                }`}
              >
                <Sparkles className={`w-5 h-5 ${isGenerating ? 'animate-spin' : 'animate-bounce'}`} />
                {isGenerating ? 'ĐANG LẬP MA TRẬN, ĐẶC TẢ & TRỘN MÃ ĐỀ...' : '🧠 LẬP BỘ ĐỀ, MA TRẬN & BẢNG MASTER KEY'}
              </button>
            </div>
          </div>
        )}

        {/* MODE 2: Similar Exam Generator from Original Exam */}
        {activeTabMode === 'similar_exam' && (
          <div className="space-y-4">
            <div className="bg-purple-950/20 p-4 rounded-xl border border-purple-800/40 space-y-3">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                <RefreshCw className="w-4 h-4 text-purple-400" />
                <span>Nạp Đề Thi Gốc Để Tự Động Sinh Đề Tương Tự (Đổi Số Liệu / Ngữ Cảnh):</span>
              </div>
              <p className="text-xs text-slate-400">
                Thầy/Cô chỉ cần dán văn bản đề bài hoặc tải lên tệp Word/PDF/Ảnh đề thi gốc. AI sẽ phân tích từng câu hỏi, giữ nguyên ma trận kiến thức và độ khó, sinh ra đề thi tương tự kèm ma trận, bảng đáp án Master Key và lời giải chi tiết.
              </p>

              {/* Upload or Paste original exam */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Nội dung đề thi gốc:</label>
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1 bg-purple-800 hover:bg-purple-700 text-white rounded text-xs font-bold cursor-pointer flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Tải file đề gốc (Word / PDF / TXT)</span>
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.md,.json,.xml"
                        onChange={e => handleFileUpload(e, setOriginalExamText, setOriginalExamFileName)}
                        className="hidden"
                      />
                    </label>
                    {originalExamFileName && (
                      <span className="text-[11px] text-emerald-400 font-mono">
                        ✓ {originalExamFileName}
                      </span>
                    )}
                  </div>
                </div>

                <textarea
                  value={originalExamText}
                  onChange={e => setOriginalExamText(e.target.value)}
                  rows={6}
                  placeholder="Dán toàn bộ nội dung đề kiểm tra hoặc đề thi mẫu vào đây (hoặc bấm nút Tải file ở trên)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-100 text-xs font-mono focus:border-purple-500 focus:outline-none placeholder:text-slate-500 leading-relaxed"
                />
              </div>

              {/* Variation Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                  <label className="block text-purple-300 font-bold">Số lượng mã đề tương tự cần tạo:</label>
                  <select
                    value={similarExamCount}
                    onChange={e => setSimilarExamCount(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 font-bold text-cyan-300"
                  >
                    <option value="1">1 Bộ đề tương tự mới</option>
                    <option value="2">2 Bộ đề tương tự khác nhau (Mã đề 101, 102)</option>
                    <option value="4">4 Bộ đề tương tự khác nhau (Mã đề 101, 102, 103, 104)</option>
                    <option value="8">8 Bộ đề tương tự khác nhau</option>
                  </select>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                  <label className="block text-purple-300 font-bold">Quy tắc biến thể tương đương:</label>
                  <select
                    value={similarVariationType}
                    onChange={e => setSimilarVariationType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100"
                  >
                    <option value="change_numbers">Đổi số liệu, tham số & tính toán lại đáp số chính xác</option>
                    <option value="change_context">Đổi tình huống thực tế & phương án gây nhiễu</option>
                    <option value="shuffle_and_vary">Kết hợp đổi số liệu + hoán vị câu hỏi & đáp án</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  onClick={handleGenerateSimilarExam}
                  disabled={isGenerating || !originalExamText.trim()}
                  className={`px-8 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-xl transition-all ${
                    isGenerating || !originalExamText.trim()
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-purple-900/30'
                  }`}
                >
                  <RefreshCw className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                  {isGenerating ? 'ĐANG TẠO BỘ ĐỀ TƯƠNG TỰ TỪ ĐỀ GỐC...' : '✨ TẠO ĐỀ & ĐÁP ÁN TƯƠNG TỰ TỪ ĐỀ GỐC'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Output Panel: WYSIWYG A4 Document Preview with Math LaTeX rendering & AI Modification */}
      <A4DocumentPreview
        content={generatedExamText}
        onChangeContent={setGeneratedExamText}
        title={`Đề thi & Ma trận ${examType} - Môn ${monHoc} Lớp ${lop}`}
        documentType="exam"
        monHoc={monHoc}
        lop={lop}
        apiKeysInput={apiKeysInput}
        onExportWord={handleExportWord}
        exportOptions={{
          monHoc,
          lop,
          fileName: `De_Kiem_Tra_${examType.replace(/\s+/g, '_')}_${monHoc.toUpperCase()}_Lop_${lop}.docx`,
          isLandscape: isLandscapeMode,
          showPageNumbers: true
        }}
      />
    </div>
  );
};
