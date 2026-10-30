import React, { useState, useRef, useEffect } from 'react';
import { generateGeminiText, transcribeAudioWithGemini } from '../../lib/geminiApi';
import { 
  Download, 
  Sparkles, 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  RotateCcw, 
  RotateCw, 
  Headphones, 
  Sliders, 
  Layers, 
  Upload, 
  Check,
  RefreshCw,
  BookOpen,
  Mic,
  MicOff,
  FileAudio,
  FileText,
  Scan,
  Copy,
  ArrowRight,
  Trash2,
  Target,
  Workflow,
  Wand2,
  Edit3,
  Save,
  CheckCircle2
} from 'lucide-react';
import { exportMarkdownToWord } from '../../lib/wordExport';
import { normalizeVietnameseTerminology, ungluePedagogicalHeadings } from '../../lib/terminologyUtils';
import { sanitizeMathForVietnamese, repairVietnameseText } from '../../lib/mathSanitizer';
import { DEFAULT_PP, DEFAULT_KT } from '../../data/defaults';
import { PEDAGOGICAL_METHODS_DICTIONARY } from '../../lib/pedagogicalFrameworks';
import { 
  playVietnameseSpeech, 
  pauseSpeech, 
  resumeSpeech, 
  stopSpeech, 
  seekSpeech, 
  skipSpeech, 
  downloadVietnameseAudio, 
  EXPRESSIVE_VIETNAMESE_VOICES,
  TTS_SPEED_PRESETS 
} from '../../lib/ttsAudio';
import { readFileAsText } from '../../lib/fileUtils';
import { A4DocumentPreview } from '../A4DocumentPreview';
import { Tab5DocumentToSpeech } from './Tab5DocumentToSpeech';

interface Tab5MaterialsAudioProps {
  lessonContent: string;
  lessonText?: string;
  referenceCacheText?: string;
  apiKeysInput: string;
  monHoc: string;
  lop: string;
  ppList?: string[];
  ktList?: string[];
  initialPP?: string;
  initialKT?: string;
  onOpenApiGuide: () => void;
  onOpenVoiceDocConverter?: () => void;
  onInsertToLessonContent?: (text: string) => void;
}

export const Tab5MaterialsAudio: React.FC<Tab5MaterialsAudioProps> = ({
  lessonContent,
  lessonText = '',
  referenceCacheText = '',
  apiKeysInput,
  monHoc,
  lop,
  ppList = DEFAULT_PP,
  ktList = DEFAULT_KT,
  initialPP,
  initialKT,
  onOpenApiGuide,
  onOpenVoiceDocConverter,
  onInsertToLessonContent
}) => {
  // Sub-tab state
  const [activeSubTab, setActiveSubTab] = useState<'tts_material' | 'doc_to_speech' | 'audio_to_word'>('tts_material');

  const hasTab3Content = Boolean(lessonContent && lessonContent.trim().length > 10);
  const hasSgkContent = Boolean(referenceCacheText && referenceCacheText.trim().length > 10);

  const [sourceMode, setSourceMode] = useState<'tab3' | 'direct' | 'tab1' | 'sgk' | 'file'>(
    hasTab3Content ? 'tab3' : (hasSgkContent ? 'sgk' : (lessonText.trim() ? 'tab1' : 'direct'))
  );
  const [directTopic, setDirectTopic] = useState('');
  const [customFileText, setCustomFileText] = useState('');
  const [customFileName, setCustomFileName] = useState('');

  const [materialType, setMaterialType] = useState('Tài liệu tích hợp Phương pháp & Kỹ thuật dạy học tích cực');
  const [customRequirements, setCustomRequirements] = useState('');

  // Pedagogical Method & Technique Selection
  const [selectedPP, setSelectedPP] = useState<string>(initialPP || DEFAULT_PP[0] || 'Dạy học nhóm / Hợp tác');
  const [selectedKT, setSelectedKT] = useState<string>(initialKT || DEFAULT_KT[1] || '2. Kỹ thuật Khăn trải bàn');
  const [customPP, setCustomPP] = useState('');
  const [customKT, setCustomKT] = useState('');

  const [generatedMaterialText, setGeneratedMaterialText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);

  // AI Script Refinement & Direct Editing State
  const [isAiRefining, setIsAiRefining] = useState(false);
  const [aiRefinePrompt, setAiRefinePrompt] = useState('');
  const [isDirectEditing, setIsDirectEditing] = useState(false);
  const [directEditText, setDirectEditText] = useState('');

  // Audio Playback / TTS State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [isLoadingAudioStream, setIsLoadingAudioStream] = useState(false);
  const [isDownloadingAudio, setIsDownloadingAudio] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState(EXPRESSIVE_VIETNAMESE_VOICES[0].id);
  const [speechRate, setSpeechRate] = useState(1.0);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const isScrubbingRef = useRef(false);
  const [currentChunkInfo, setCurrentChunkInfo] = useState<{ current: number; total: number; text: string } | null>(null);

  // Audio to Word / Transcription state
  const [audioInputMode, setAudioInputMode] = useState<'file' | 'mic'>('file');
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null);
  const [uploadedAudioBase64, setUploadedAudioBase64] = useState<string | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);

  // Microphone recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // Transcription options
  const [transcriptionTask, setTranscriptionTask] = useState<'verbatim' | 'lesson_summary' | 'qa_extract'>('verbatim');
  const [transcriptionCustomNote, setTranscriptionCustomNote] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState('');
  const [transcriptionCopied, setTranscriptionCopied] = useState(false);

  const effectiveSgkText = referenceCacheText || '';

  useEffect(() => {
    return () => {
      stopSpeech();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

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

  // Audio Recording Handlers
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setUploadedAudioUrl(audioUrl);
        setUploadedAudioFile(null);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedAudioBase64(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Không thể mở micro:', err);
      alert('Không thể truy cập Microphone. Thầy/Cô vui lòng cấp quyền Micro trên trình duyệt để thu âm bài giảng.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedAudioFile(file);
      const url = URL.createObjectURL(file);
      setUploadedAudioUrl(url);

      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedAudioBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Run Audio Transcription
  const handleRunTranscription = async () => {
    if (!uploadedAudioBase64) {
      alert('Thầy/Cô vui lòng tải lên tệp âm thanh hoặc thực hiện ghi âm bài giảng trước.');
      return;
    }

    setIsTranscribing(true);
    setNotification({
      message: 'Đang lắng nghe và bóc băng âm thanh với Gemini AI, chuẩn hóa công thức toán...',
      type: 'info'
    });

    try {
      const result = await transcribeAudioWithGemini({
        audioBase64: uploadedAudioBase64,
        apiKeys: apiKeysInput,
        taskMode: transcriptionTask,
        customInstructions: transcriptionCustomNote,
        subject: monHoc,
        grade: lop
      });

      const normalized = normalizeVietnameseTerminology(result || '');
      setTranscriptionResult(normalized);
      setNotification({
        message: 'Đã bóc băng và chuyển đổi âm thanh sang văn bản thành công!',
        type: 'success'
      });
    } catch (err: any) {
      console.error('Lỗi bóc băng âm thanh:', err);
      setNotification({
        message: 'Lỗi bóc băng âm thanh: ' + (err.message || 'Không thể xử lý tệp âm thanh'),
        type: 'error'
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleExportTranscriptionWord = async () => {
    if (!transcriptionResult.trim()) return;
    try {
      await exportMarkdownToWord(transcriptionResult, {
        headerText: `BẢN BÓC BĂNG BÀI GIẢNG MÔN ${monHoc.toUpperCase()}`,
        footerText: `Trường THCS Phùng Khắc Khoan - Xã Tây Phương, TP. Hà Nội`,
        monHoc,
        lop,
        fileName: `Boc_Bang_Ghi_Am_${monHoc}_Lop_${lop}.docx`
      });
      alert('Đã xuất file Word bản bóc băng thành công!');
    } catch (err: any) {
      alert('Lỗi xuất file Word: ' + (err.message || 'Không thể tạo file'));
    }
  };

  const handleCopyTranscription = () => {
    if (!transcriptionResult) return;
    navigator.clipboard.writeText(transcriptionResult);
    setTranscriptionCopied(true);
    setTimeout(() => setTranscriptionCopied(false), 2000);
  };

  // 1. Generate Material
  const handleGenerateMaterial = async () => {
    setNotification(null);
    let sourceText = '';
    let topicName = '';

    if (sourceMode === 'tab3') {
      sourceText = lessonContent;
      topicName = 'Giáo án Tab 3';
    } else if (sourceMode === 'tab1') {
      sourceText = lessonText;
      topicName = 'Bài học Tab 1';
    } else if (sourceMode === 'sgk') {
      sourceText = effectiveSgkText;
      topicName = 'File Sách Giáo Khoa (SGK) / Tài liệu tham khảo Tab 2';
    } else if (sourceMode === 'direct') {
      sourceText = directTopic;
      topicName = directTopic || `Chương trình ${monHoc} Lớp ${lop}`;
    } else if (sourceMode === 'file') {
      sourceText = customFileText;
      topicName = customFileName || 'File tài liệu riêng';
    }

    if (!sourceText.trim()) {
      if (directTopic.trim()) {
        sourceText = directTopic;
        topicName = directTopic;
      } else if (effectiveSgkText.trim()) {
        sourceText = effectiveSgkText;
        topicName = 'File Sách Giáo Khoa (SGK)';
      } else if (lessonText.trim()) {
        sourceText = lessonText;
        topicName = 'Bài học Tab 1';
      } else {
        setNotification({
          message: 'Vui lòng cung cấp nội dung bài học (từ Tab 3, Tab 1, File SGK ở Tab 2, hoặc nhập trực tiếp đề tài) để AI biên soạn!',
          type: 'error'
        });
        return;
      }
    }

    setIsGenerating(true);
    setNotification({
      message: 'Đang dùng AI biên soạn tài liệu tự học trực quan & kịch bản Audio diễn cảm...',
      type: 'info'
    });

    try {
      const effectivePP = selectedPP === 'custom' ? (customPP.trim() || 'Dạy học nhóm / Hợp tác') : selectedPP;
      const effectiveKT = selectedKT === 'custom' ? (customKT.trim() || 'Kỹ thuật Khăn trải bàn') : selectedKT;

      let methodGuide = '';
      for (const [key, value] of Object.entries(PEDAGOGICAL_METHODS_DICTIONARY)) {
        if (effectivePP.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(effectivePP.toLowerCase())) {
          methodGuide += `\n- NGUYÊN TẮC PHƯƠNG PHÁP ${key.toUpperCase()}: ${value.corePrinciples}\n  + B1 Giao nhiệm vụ: ${value.step1GiaoNhiemVu}\n  + B2 Thực hiện: ${value.step2ThucHien}\n  + B3 Báo cáo thảo luận: ${value.step3BaoCaoThaoLuan}\n  + B4 Kết luận nhận định: ${value.step4KetLuanNhanDinh}`;
        }
        if (effectiveKT.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(effectiveKT.toLowerCase())) {
          methodGuide += `\n- NGUYÊN TẮC KỸ THUẬT ${key.toUpperCase()}: ${value.corePrinciples}\n  + B1 Giao nhiệm vụ: ${value.step1GiaoNhiemVu}\n  + B2 Thực hiện: ${value.step2ThucHien}\n  + B3 Báo cáo thảo luận: ${value.step3BaoCaoThaoLuan}\n  + B4 Kết luận nhận định: ${value.step4KetLuanNhanDinh}`;
        }
      }

      let structureGuide = '';
      if (materialType.includes('Phương pháp') || materialType.includes('Kỹ thuật dạy học') || materialType.includes('Tích hợp')) {
        structureGuide = `
1. TÀI LIỆU TÍCH HỢP PHƯƠNG PHÁP "${effectivePP.toUpperCase()}" & KỸ THUẬT "${effectiveKT.toUpperCase()}":
   - TIÊU ĐỀ: TÀI LIỆU TÍCH HỢP PHƯƠNG PHÁP ${effectivePP.toUpperCase()} VÀ KỸ THUẬT ${effectiveKT.toUpperCase()}
   - PHẦN 1: MỤC TIÊU & NĂNG LỰC CẦN ĐẠT CỦA HOẠT ĐỘNG (Năng lực đặc thù môn học, năng lực tự chủ & tự học, năng lực giao tiếp & hợp tác).
   - PHẦN 2: QUY TRÌNH TỔ CHỨC HOẠT ĐỘNG THEO 4 BƯỚC SƯ PHẠM CHUẨN:
     * **Bước 1: Giao nhiệm vụ học tập:** (Chia nhóm cụ thể, thời gian thực hiện, phân công rõ vai trò Trưởng nhóm, Thư ký, Báo cáo viên, Thành viên).
     * **Bước 2: Thực hiện nhiệm vụ:** (Giai đoạn cá nhân 1-2 phút suy nghĩ độc lập, tiếp nối giai đoạn phối hợp nhóm đúng bản chất của "${effectiveKT}").
     * **Bước 3: Báo cáo, thảo luận:** (Báo cáo kết quả trên bảng phụ/tivi/poster, phản biện và chất vấn chéo giữa các nhóm).
     * **Bước 4: Kết luận, nhận định:** (Giáo viên chuẩn hóa kiến thức khoa học, chốt nội dung cốt lõi và đánh giá quá trình).
   - PHẦN 3: PHIẾU HỌC TẬP / PHIẾU GIAO NHIỆM VỤ THIẾT KẾ CHUYÊN BIỆT THEO KỸ THUẬT "${effectiveKT}":
${
  effectiveKT.toLowerCase().includes('khăn trải bàn')
    ? `     * BẢNG KHĂN TRẢI BÀN với 4 GÓC (Góc 1: Ý kiến cá nhân HS1, Góc 2: Ý kiến cá nhân HS2, Góc 3: Ý kiến cá nhân HS3, Góc 4: Ý kiến cá nhân HS4) và Ô TRUNG TÂM (Ý kiến thống nhất của cả nhóm sau thảo luận).`
    : effectiveKT.toLowerCase().includes('mảnh ghép') || effectiveKT.toLowerCase().includes('jigsaw')
    ? `     * VÒNG 1 (Nhóm Chuyên gia): Phân chia rõ 3-4 chuyên đề/nhiệm vụ độc lập cho từng nhóm chuyên gia cùng tìm hiểu sâu.
     * VÒNG 2 (Nhóm Mảnh ghép): Mỗi thành viên chuyên gia trở về nhóm mảnh ghép mới để chia sẻ, ghép nối thành bức tranh toàn cảnh bài học.`
    : effectiveKT.toLowerCase().includes('trạm')
    ? `     * 4 TRẠM HỌC TẬP (Trạm 1: Khám phá, Trạm 2: Trải nghiệm thực hành, Trạm 3: Luyện tập, Trạm 4: Vận dụng sáng tạo) kèm Phiếu hành trình luân chuyển trạm của học sinh.`
    : effectiveKT.toLowerCase().includes('phòng tranh')
    ? `     * Nhiệm vụ làm Poster/Sản phẩm trưng bày của từng nhóm và Phiếu đánh giá xem tranh (Gallery Walk) khi các nhóm đi tham quan triển lãm.`
    : effectiveKT.toLowerCase().includes('kwl')
    ? `     * BẢNG K-W-L (K - Điều đã biết, W - Điều muốn biết, L - Điều đã học được qua bài học).`
    : effectiveKT.toLowerCase().includes('sơ đồ tư duy')
    ? `     * Khung Sơ đồ tư duy với Nhánh trung tâm và các Nhánh cấp 1, cấp 2 chi tiết tóm tắt kiến thức.`
    : effectiveKT.toLowerCase().includes('chia sẻ nhóm đôi') || effectiveKT.toLowerCase().includes('think')
    ? `     * Quy trình Think (Nghĩ độc lập 1 phút) -> Pair (Thảo luận cặp đôi 2 phút) -> Share (Chia sẻ trước lớp).`
    : `     * Mẫu phiếu học tập cá nhân và phiếu phân công nhiệm vụ nhóm tối ưu cho kỹ thuật ${effectiveKT}.`
}
   - PHẦN 4: BẢNG TIÊU CHÍ ĐÁNH GIÁ (RUBRIC) SẢN PHẨM & NĂNG LỰC HỢP TÁC (Bảng 3-4 tiêu chí rõ ràng: Tính chính xác của kiến thức, Tinh thần hợp tác nhóm, Kỹ năng trình bày, Tính thẩm mỹ/sáng tạo kèm thang điểm 1-10).
   - PHẦN 5: HỆ THỐNG CÂU HỎI GỢI MỞ, HƯỚNG DẪN TỰ SỬA SAI & CHỐT KIẾN THỨC CỐT LÕI CỦA GIÁO VIÊN.
`;
      } else if (materialType.includes('câu chuyện') || materialType.includes('lịch sử')) {
        structureGuide = `
1. CÂU CHUYỆN TOÁN HỌC & BỐI CẢNH LỊCH SỬ HẤP DẪN:
   - TIÊU ĐỀ: Đặt tên câu chuyện giàu tính gợi mở, cuốn hút học sinh.
   - PHẦN 1: BỐI CẢNH LỊCH SỬ & NGUỒN GỐC PHÁT MINH (Kể về hoàn cảnh ra đời của khái niệm/định lý, nhà toán học gắn liền như Pythagore, Thales, Gauss, Descartes...).
   - PHẦN 2: TÌNH HUỐNG THỰC TIỄN & NGHỊCH LÝ ĐỜI THƯỜNG (Câu chuyện giải quyết vấn đề thực tế bằng toán học).
   - PHẦN 3: BÀI HỌC VÀ THÔNG ĐIỆP TOÁN HỌC TRUYỀN CẢM HỨNG (Ý nghĩa tri thức và tinh thần khám phá).
   - PHẦN 4: CÂU HỎI THẢO LUẬN & LIÊN HỆ THỰC TẾ (3-4 câu hỏi kích thích tư duy).
`;
      } else if (materialType.includes('chuẩn bị bài trước') || materialType.includes('Lớp học đảo ngược')) {
        structureGuide = `
1. PHIẾU HƯỚNG DẪN HỌC SINH CHUẨN BỊ BÀI TRƯỚC Ở NHÀ:
   - TIÊU ĐỀ: PHIẾU HỌC TẬP CHUẨN BỊ TRƯỚC BÀI HỌC (LỚP HỌC ĐẢO NGƯỢC)
   - PHẦN 1: NHIỆM VỤ ĐỌC HIỂU SÁCH GIÁO KHOA (Chỉ dẫn cụ thể trang, mục cần đọc và gạch chân).
   - PHẦN 2: BẢNG K-W-L TỰ KHÁM PHÁ (K: Điều em đã biết; W: Điều em muốn tìm hiểu; L: Câu hỏi thắc mắc chuẩn bị hỏi thầy cô trên lớp).
   - PHẦN 3: NHIỆM VỤ TRẢI NGHIỆM & CHUẨN BỊ ĐỒ DÙNG (Cắt dán, đo đạc thực tế, chuẩn bị dụng cụ học tập).
   - PHẦN 4: 3 CÂU HỎI TỰ KIỂM TRA MỨC ĐỘ SẴN SÀNG (Kèm mã phản hồi hoặc gợi ý tự chấm).
`;
      } else if (materialType.includes('Ôn tập & Củng cố') || materialType.includes('chuyên đề')) {
        structureGuide = `
1. TÀI LIỆU ÔN TẬP & CỦNG CỐ KIẾN THỨC THEO CHUYÊN ĐỀ:
   - TIÊU ĐỀ: TÀI LIỆU HỆ THỐNG HÓA VÀ ÔN TẬP CỦNG CỐ KIẾN THỨC
   - PHẦN 1: BẢN ĐỒ KIẾN THỨC CỐT LÕI (Bảng tóm tắt định nghĩa, tính chất, hệ thống công thức).
   - PHẦN 2: BẢNG SO SÁNH & ĐỐI CHIẾU CÁC KHÁI NIỆM DỄ NHẦM LẪN.
   - PHẦN 3: TỔNG HỢP CÁC DẠNG BÀI TẬP ĐIỂN HÌNH VÀ PHƯƠNG PHÁP GIẢI.
   - PHẦN 4: BẢNG TỔNG HỢP CÁC BẪY SAI LẦM HỌC SINH THƯỜNG GẶP VÀ CÁCH PHÒNG TRÁNH.
   - PHẦN 5: BÀI TẬP RÈN LUYỆN TỔNG HỢP CÓ HƯỚNG DẪN GIẢI CHI TIẾT.
`;
      } else if (materialType.includes('Luyện thi') || materialType.includes('Bộ đề')) {
        structureGuide = `
1. TÀI LIỆU LUYỆN THI & BỘ ĐỀ ÔN TẬP PHÂN HÓA CHUYÊN SÂU:
   - TIÊU ĐỀ: BỘ ĐỀ ÔN THI & PHÂN HÓA NĂNG LỰC CHUYÊN SÂU
   - PHẦN 1: MA TRẬN VÀ BẢNG ĐẶC TẢ ĐỀ THI (4 mức độ: Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao).
   - PHẦN 2: BỘ CÂU HỎI TRẮC NGHIỆM ĐIỂN HÌNH (Có 4 đáp án A, B, C, D).
   - PHẦN 3: BỘ BÀI TẬP TỰ LUẬN PHÂN HÓA (Kèm câu hỏi vận dụng thực tế nâng cao).
   - PHẦN 4: ĐÁP ÁN, THANG ĐIỂM VÀ LỜI GIẢI CHI TIẾT TỪNG BƯỚC.
`;
      } else {
        structureGuide = `
1. KHUNG BỐ CỤC CHUẨN MỰC:
   - TIÊU ĐỀ BÀI HỌC VÀ KHÁI QUÁT TRỌNG TÂM
   - PHẦN 1: SƠ ĐỒ TƯ DUY TÓM TẮT (Dùng Markdown bảng biểu, nhánh chữ rõ ràng)
   - PHẦN 2: CÁC CÔNG THỨC & QUY TẮC CỐT LÕI (Bọc tuyệt đối trong $...$ hoặc $$...$$)
   - PHẦN 3: VÍ DỤ MẪU VÀ BÍ QUYẾT GIẢI NHANH (Phân tích mẹo tránh bẫy)
   - PHẦN 4: BÀI THƠ / VÈ GHI NHỚ KIẾN THỨC (4-8 câu vần điệu bắt tai)
   - PHẦN 5: PHIẾU BÀI TẬP TỰ LUYỆN 3 CẤP ĐỘ (Nhận biết, Thông hiểu, Vận dụng)
   - PHẦN 6: KỊCH BẢN LỜI GIẢNG AUDIO DIỄN CẢM (Dành cho việc đọc thuyết trình bài giảng).
`;
      }

      const prompt = `
Bạn là Chuyên gia Phương pháp Sư phạm Môn ${monHoc} Lớp ${lop} kiêm Biên tập viên Học liệu Đa phương tiện & Audio Sư phạm xuất sắc.
Nhiệm vụ: Biên soạn một bộ tài liệu học tập, phiếu tự học hoặc kịch bản sư phạm chất lượng cao cho:
Đề tài / Nội dung nguồn: "${topicName}"
Thể loại yêu cầu: "${materialType}"
Phương pháp dạy học chủ đạo: "${effectivePP}"
Kỹ thuật dạy học tích cực: "${effectiveKT}"
Môn: ${monHoc} - Khối lớp: ${lop}
Yêu cầu chuyên biệt từ giáo viên: ${customRequirements || 'Tối ưu cho học sinh tự học tại nhà, trực quan, cô đọng, dễ hiểu, sinh động.'}

${methodGuide}

Dữ liệu bài học tham chiếu:
${sourceText.slice(0, 15000)}

QUY CHUẨN XÂY DỰNG NỘI DUNG BẮT BUỘC:
${structureGuide}

QUY TẮC BẮT BUỘC VỀ TOÁN HỌC & ĐỊNH DẠNG VĂN BẢN:
1. TOÀN BỘ CÔNG THỨC, KÝ HIỆU TOÁN HỌC, QUAN HỆ TẬP HỢP, SỐ HỌC BẮT BUỘC PHẢI BỌC TRONG DẤU $...$ HOẶC $$...$$:
   - Ký hiệu tập hợp & phần tử: $x \\in A$, $y \\notin A$, $2 \\in A$, $5 \\notin A$, $0 \\notin \\mathbb{N}^*$, $1 \\in \\mathbb{N}^*$, $A = \\{1; 2; 3\\}$, $P = \\{0; 1; 2; 3; 4; 5\\}$, $\\mathbb{N}$, $\\mathbb{N}^*$, $\\mathbb{Z}$, $\\mathbb{Q}$, $\\mathbb{R}$, $\\mathbb{I}$, $\\emptyset$.
   - Quan hệ & phép toán: $A \\subset B$, $A \\cap B$, $A \\cup B$, $a \\le b$, $a \\ge b$, $a \\neq b$, $a \\approx b$, $a \\pm b$, $a \\times b$, $\\frac{a}{b} = \\frac{c}{d}$, $\\sqrt{x^2+1}$.
   - TUYỆT ĐỐI KHÔNG viết trần trụi dạng text thường như x\\in A, 2\\in A, 0\\notin\\mathbb{N}*.
   - Đơn thức, đa thức và lũy thừa biến số: $x$, $y$, $z$, $17z^4$, $-6x^3y$, $-\\frac{1}{4}y^2z^3$, $0,35xy^2z^4$. CẤM làm mất số mũ của z hoặc biến số thành ký hiệu khác.
   - Phân số, phân thức chuẩn SGK: BẮT BUỘC dùng gạch chéo ngược $\\frac{a}{b}$ hoặc $\\dfrac{a}{b}$, ví dụ: $\\frac{1}{8}$, $\\frac{1}{2}$, $\\frac{3}{4}$, $\\frac{\\sqrt{X}}{\\sqrt{X} + 1} + 2\\frac{X - 1}{\\sqrt{X} - 1}$, $\\frac{\\widehat{C} + \\widehat{D}}{2}$. CẤM TUYỆT ĐỐI dùng các ký hiệu phân số thu nhỏ kiểu "½, ⅓, ⅔, ¼, ¾, ⅕, ⅙, ⅛, ⅜, ⅝, ⅞" và CẤM TUYỆT ĐỐI dùng dấu gạch xiên "1/8" hay "a/b" khi viết toán! CẤM TUYỆT ĐỐI bỏ gạch chéo ngược thành "frac{a}{b}"!
   - Ký hiệu góc chuẩn SGK: BẮT BUỘC dùng dấu mũ rộng trên đỉnh góc $\\widehat{A}$, $\\widehat{B}$, $\\widehat{C}$, $\\widehat{D}$, $\\widehat{ABC}$, $\\widehat{xOy}$, $\\widehat{AEB}$, $\\triangle ABC$. CẤM TUYỆT ĐỐI dùng ký hiệu góc "\\angle A", "\\angle ABC", CẤM TUYỆT ĐỐI viết thành "widehat {A}"!
   - Ký hiệu hình học & quan hệ: Viết chuẩn tam giác $\\triangle ABC$, vuông góc $\\perp$ ($AB \\perp CD$), song song $\\parallel$ ($d_1 \\parallel d_2$), đồng dạng $\\sim$ ($\\triangle ABC \\sim \\triangle A'B'C'$), bằng nhau $\\cong$, véc-tơ $\\vec{u}$, $\\overrightarrow{AB}$.
   - Căn thức & phân thức đại số: Viết chuẩn căn bậc hai $\\sqrt{X}$, $\\sqrt{x^2 + 1}$, căn bậc n $\\sqrt[3]{8}$, $\\sqrt[n]{A}$; phân số $\\frac{-b \\pm \\sqrt{\\Delta}}{2a}$, $\\frac{A}{B}$.
   - Số đo độ: Viết $180^\\circ$, $360^\\circ$, $90^\\circ$, $125^\\circ$. CẤM TUYỆT ĐỐI viết thành "^°" hay "180^°"!
   - Số thập phân tiếng Việt: Viết $0,5$ hoặc $0{,}5$, $2,5$ hoặc $2{,}5$, $16,5$.
2. TUYỆT ĐỐI KHÔNG TẠO RA BẤT KỲ MÃ PROMPT TẠO ẢNH NÀO:
   - KHÔNG xuất các khối (Visual AI Prompt), Visual Prompt, Prompt minh họa, hay mô tả tạo ảnh DALL-E/Midjourney.
   - Tập trung 100% vào nội dung sư phạm, bảng biểu markdown và lời văn trau chuốt.
3. ĐỒNG BỘ IN HOA TIÊU ĐỀ ĐỀ MỤC & KHÔNG DÍNH CHỮ:
   - Đề mục chính viết IN HOA VÀ IN ĐẬM: **PHẦN 1: ...**, **PHẦN 2: ...**, **I. MỤC TIÊU**, **1. Kiến thức:**.
   - Giữa các từ và dấu hai chấm phải có khoảng cách chuẩn (e.g. ": Thực hiện nhiệm vụ").
   - Bắt đầu trực tiếp vào nội dung tài liệu, KHÔNG chào hỏi xã giao.
`;

      const response = await generateGeminiText({
        prompt,
        apiKeys: apiKeysInput
      });

      const sanitized = sanitizeMathForVietnamese(response || '');
      const normalized = ungluePedagogicalHeadings(normalizeVietnameseTerminology(repairVietnameseText(sanitized)));
      setGeneratedMaterialText(normalized);
      setNotification({
        message: 'Đã biên soạn tài liệu học tập tích hợp phương pháp & kỹ thuật thành công!',
        type: 'success'
      });
    } catch (err: any) {
      console.error('Lỗi tạo tài liệu:', err);
      setNotification({
        message: 'Lỗi khi tạo tài liệu: ' + (err.message || 'Vui lòng kiểm tra lại API Key ở Tab 2.'),
        type: 'error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Play Audio Speech
  const handlePlayAudio = () => {
    if (!generatedMaterialText.trim()) {
      setNotification({
        message: 'Chưa có nội dung tài liệu để phát âm thanh. Vui lòng bấm "Tạo Học Liệu" trước.',
        type: 'error'
      });
      return;
    }

    if (isAudioPaused) {
      resumeSpeech();
      setIsAudioPaused(false);
      setIsPlayingAudio(true);
      return;
    }

    setIsLoadingAudioStream(true);
    playVietnameseSpeech(
      generatedMaterialText,
      {
        voiceName: selectedVoiceId,
        rate: speechRate,
        onPlayStateChange: (playing) => {
          setIsLoadingAudioStream(false);
          setIsPlayingAudio(playing);
          if (!playing) setIsAudioPaused(false);
        },
        onEnd: () => {
          setIsPlayingAudio(false);
          setIsAudioPaused(false);
          setCurrentTime(0);
          setCurrentChunkInfo(null);
        },
        onError: (err) => {
          setIsLoadingAudioStream(false);
          setIsPlayingAudio(false);
          setIsAudioPaused(false);
          setNotification({
            message: 'Không thể phát Audio: ' + err,
            type: 'error'
          });
        },
        onProgress: (current, total, text) => {
          setCurrentChunkInfo({ current, total, text });
        },
        onTimeUpdate: (cur, dur) => {
          if (!isScrubbingRef.current) {
            setCurrentTime(cur);
            setDuration(dur);
          }
        }
      }
    );
  };

  const handlePauseAudio = () => {
    pauseSpeech();
    setIsAudioPaused(true);
    setIsPlayingAudio(false);
  };

  const handleStopAudio = () => {
    stopSpeech();
    setIsPlayingAudio(false);
    setIsAudioPaused(false);
    setCurrentTime(0);
    setCurrentChunkInfo(null);
  };

  const handleRewind10 = () => {
    skipSpeech(-10);
  };

  const handleForward10 = () => {
    skipSpeech(10);
  };

  const handleTimeSeek = (newTime: number) => {
    setCurrentTime(newTime);
    seekSpeech(newTime);
  };

  const handleDownloadAudio = async () => {
    if (!generatedMaterialText.trim()) return;
    setIsDownloadingAudio(true);
    try {
      await downloadVietnameseAudio(
        generatedMaterialText,
        `Audio_BaiGiang_${monHoc}_Lop_${lop}.mp3`,
        {
          voiceId: selectedVoiceId,
          speed: speechRate
        }
      );
      setNotification({
        message: 'Đã tải tệp âm thanh bài giảng (.mp3) thành công!',
        type: 'success'
      });
    } catch (err: any) {
      setNotification({
        message: 'Lỗi tải audio: ' + (err.message || 'Không thể tạo file mp3'),
        type: 'error'
      });
    } finally {
      setIsDownloadingAudio(false);
    }
  };

  // 3. AI Refine Audio Script & Document Content
  const handleAiRefineScript = async (customPromptOverride?: string) => {
    const promptToUse = (customPromptOverride || aiRefinePrompt).trim();
    if (!promptToUse) {
      setNotification({
        message: 'Vui lòng nhập hoặc chọn yêu cầu AI cần sửa đổi trong kịch bản.',
        type: 'error'
      });
      return;
    }
    if (!generatedMaterialText.trim()) {
      setNotification({
        message: 'Chưa có nội dung tài liệu để chỉnh sửa. Vui lòng bấm tạo tài liệu trước.',
        type: 'error'
      });
      return;
    }

    handleStopAudio();
    setIsAiRefining(true);
    setNotification({
      message: 'Đang yêu cầu AI chỉnh sửa kịch bản theo yêu cầu của Thầy/Cô...',
      type: 'info'
    });

    try {
      const editPrompt = `Bạn là Chuyên gia Biên tập Sư phạm và Chỉnh sửa Kịch bản Bài giảng Âm thanh cho Thầy Cô giáo.
Dưới đây là nội dung tài liệu / kịch bản bài giảng hiện tại:
---
${generatedMaterialText}
---

YÊU CẦU CHỈNH SỬA CỦA GIÁO VIÊN:
"${promptToUse}"

HƯỚNG DẪN THỰC HIỆN:
1. Hãy tìm chính xác phần, đoạn văn, hoặc nội dung mà giáo viên yêu cầu sửa để chỉnh sửa và trau chuốt theo đúng ý (ví dụ: chuẩn hóa cách đọc ký hiệu toán học $N^*$, $x \\in \\mathbb{N}^*$, phân số, tỉ số; rút gọn đoạn văn; làm lời giảng truyền cảm hơn; thêm ví dụ...).
2. Giữ nguyên 100% bố cục tổng thể, các phần khác không được yêu cầu sửa và toàn bộ định dạng Markdown A4 chuẩn.
3. Toàn bộ công thức toán học và ký hiệu phải được bọc trong $...$ hoặc $$...$$.
4. Xuất ra toàn bộ văn bản hoàn thiện sau khi đã chỉnh sửa (KHÔNG thêm lời dẫn hay giải thích mở đầu/kết thúc).`;

      const response = await generateGeminiText({
        prompt: editPrompt,
        apiKeys: apiKeysInput
      });

      const sanitized = sanitizeMathForVietnamese(response || '');
      const normalized = ungluePedagogicalHeadings(normalizeVietnameseTerminology(repairVietnameseText(sanitized)));
      setGeneratedMaterialText(normalized);
      setDirectEditText(normalized);
      setAiRefinePrompt('');
      setNotification({
        message: 'Đã sửa đổi tài liệu & kịch bản thành công! Thầy/Cô có thể bấm "Phát Audio" hoặc "Tạo Lại Audio" để nghe ngay theo nội dung mới.',
        type: 'success'
      });
    } catch (err: any) {
      console.error('Lỗi AI sửa kịch bản:', err);
      setNotification({
        message: 'Lỗi khi AI sửa kịch bản: ' + (err.message || 'Vui lòng kiểm tra lại API Key ở Tab 2.'),
        type: 'error'
      });
    } finally {
      setIsAiRefining(false);
    }
  };

  // 4. Regenerate & Play updated Audio
  const handleRegenerateAudio = () => {
    handleStopAudio();
    setTimeout(() => {
      handlePlayAudio();
      setNotification({
        message: 'Đang nạp và phát Audio từ kịch bản tài liệu đã sửa mới nhất!',
        type: 'success'
      });
    }, 150);
  };

  const handleToggleDirectEdit = () => {
    if (!isDirectEditing) {
      setDirectEditText(generatedMaterialText);
      setIsDirectEditing(true);
    } else {
      setIsDirectEditing(false);
    }
  };

  const handleSaveDirectEdit = () => {
    handleStopAudio();
    setGeneratedMaterialText(directEditText);
    setIsDirectEditing(false);
    setNotification({
      message: 'Đã lưu nội dung chỉnh sửa thủ công! Bạn có thể tạo lại file âm thanh ngay.',
      type: 'success'
    });
  };

  const handleExportWordMaterial = async () => {
    if (!generatedMaterialText.trim()) return;

    const effectivePP = (selectedPP === 'custom' ? customPP.trim() : selectedPP) || 'Phương pháp dạy học tích cực';
    const effectiveKT = (selectedKT === 'custom' ? customKT.trim() : selectedKT) || 'Kỹ thuật dạy học tích cực';

    let dynamicHeaderText = '';
    if (materialType.includes('Phương pháp') || materialType.includes('Kỹ thuật') || materialType.includes('Tích hợp')) {
      dynamicHeaderText = `TÀI LIỆU TÍCH HỢP ${effectivePP.toUpperCase()} & ${effectiveKT.toUpperCase()} - MÔN ${monHoc.toUpperCase()}`;
    } else {
      dynamicHeaderText = `${materialType.toUpperCase()} - MÔN ${monHoc.toUpperCase()}`;
    }

    let cleanForWord = generatedMaterialText
      .replace(/\*\*(?:Mô tả hình ảnh|Visual AI Prompt|Hình ảnh minh họa|Visual Prompt|Prompt Minh Họa|Prompt)\s*(?:\([^)]*\))?\s*:\*\*[\s\S]*?(?=\*\*(?:Lời dẫn|Lời thoại|Dialogue|Narrator|💡|Kiến thức|Bí kíp|Nhân vật|Phân cảnh|Phần cảnh)|###|##|$)/gi, '')
      .replace(/(?:^|\n)\s*(?:\*\*)?(?:Mô tả hình ảnh|Visual AI Prompt|Visual Prompt|Prompt Minh Họa|Prompt)\s*(?:\([^)]*\))?\s*(?:\*\*)?:?\s*[^\n]+(?:\n(?!\s*(?:Lời dẫn|Lời thoại|Dialogue|Narrator|💡|Kiến thức|Bí kíp|Nhân vật|Phân cảnh|Phần cảnh|###|##|\*\*))[^\n]+)*/gi, '')
      .replace(/\(Visual AI Prompt\)/gi, '')
      .replace(/\(Tấm truyện tranh giáo dục[^\)]*\)/gi, '')
      .replace(/\(Educational comic panel[^\)]*\)/gi, '')
      .replace(/\(Ảnh minh họa[^\)]*\)/gi, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    cleanForWord = sanitizeMathForVietnamese(cleanForWord);
    cleanForWord = normalizeVietnameseTerminology(cleanForWord);
    cleanForWord = ungluePedagogicalHeadings(cleanForWord);
    cleanForWord = repairVietnameseText(cleanForWord);

    setTimeout(async () => {
      try {
        await exportMarkdownToWord(cleanForWord, {
          headerText: dynamicHeaderText,
          footerText: `Trường THCS Phùng Khắc Khoan - Xã Tây Phương, TP. Hà Nội`,
          monHoc,
          lop,
          fileName: `Tai_Lieu_${(effectivePP + '_' + effectiveKT).slice(0, 30).replace(/[^a-zA-Z0-9à-ỹÀ-Ỹ_]+/g, '_')}_Lop_${lop}.docx`
        });
        alert('Đã xuất file Word tài liệu sạch đẹp thành công!');
      } catch (err: any) {
        alert('Lỗi xuất file Word: ' + (err.message || 'Không thể tạo file'));
      }
    }, 50);
  };

  const formatPlaybackTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Sub-tab Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                5. Học Liệu Tự Học, Audio Diễn Cảm & Chuyển Đổi Âm Thanh Ra Word
              </h2>
              <p className="text-xs text-slate-400">
                Biên soạn tài liệu tự học, phát audio bài giảng tiếng Việt (TTS) và bóc băng file ghi âm / giọng nói ra Word (.docx).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenVoiceDocConverter && (
              <button
                type="button"
                onClick={onOpenVoiceDocConverter}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow transition-all border border-purple-400/30"
                title="Mở bộ chuyển đổi OCR PDF, hình ảnh và tài liệu sang Word"
              >
                <Scan className="w-3.5 h-3.5" />
                <span>Chuyển Đổi OCR PDF Sang Word</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveSubTab('tts_material')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'tts_material'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>1. Biên Soạn Học Liệu & Kịch Bản Audio (TTS)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('doc_to_speech')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'doc_to_speech'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Volume2 className="w-4 h-4 text-indigo-300" />
            <span>2. Chuyển Text, Word, PDF Ra Giọng Đọc (Không Giới Hạn)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('audio_to_word')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'audio_to_word'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Mic className="w-4 h-4 text-cyan-300" />
            <span>3. Bóc Băng Ghi Âm / Giọng Nói Sang Word (.docx)</span>
          </button>
        </div>

        {/* Notification Box */}
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
            <div className="flex-1">{notification.message}</div>
          </div>
        )}
      </div>

      {/* SUB-TAB 1: TTS & Học Liệu Tự Học */}
      {activeSubTab === 'tts_material' && (
        <>
          {/* Controls Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Input Selection */}
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-pink-400" />
                  1. Nguồn Dữ Liệu Biên Soạn
                </span>
                <span className="text-[11px] text-slate-400">Môn {monHoc} - Lớp {lop}</span>
              </div>

              {/* Source Mode Switcher */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSourceMode('tab3')}
                  className={`px-2 py-1.5 rounded text-[11px] font-bold transition-all truncate ${
                    sourceMode === 'tab3'
                      ? 'bg-pink-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Sử dụng nội dung giáo án hoàn chỉnh từ Tab 3"
                >
                  Giáo Án Tab 3 {hasTab3Content && '✓'}
                </button>

                <button
                  type="button"
                  onClick={() => setSourceMode('sgk')}
                  className={`px-2 py-1.5 rounded text-[11px] font-bold transition-all truncate ${
                    sourceMode === 'sgk'
                      ? 'bg-pink-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Sử dụng sách giáo khoa hoặc file đính kèm từ Tab 2"
                >
                  File SGK Tab 2 {hasSgkContent && '✓'}
                </button>

                <button
                  type="button"
                  onClick={() => setSourceMode('tab1')}
                  className={`px-2 py-1.5 rounded text-[11px] font-bold transition-all truncate ${
                    sourceMode === 'tab1'
                      ? 'bg-pink-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Sử dụng tên bài học / chủ đề từ Tab 1"
                >
                  Bài Học Tab 1
                </button>

                <button
                  type="button"
                  onClick={() => setSourceMode('direct')}
                  className={`px-2 py-1.5 rounded text-[11px] font-bold transition-all truncate ${
                    sourceMode === 'direct'
                      ? 'bg-pink-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Nhập trực tiếp tên chủ đề cần biên soạn"
                >
                  Nhập Chủ Đề
                </button>

                <button
                  type="button"
                  onClick={() => setSourceMode('file')}
                  className={`px-2 py-1.5 rounded text-[11px] font-bold transition-all truncate ${
                    sourceMode === 'file'
                      ? 'bg-pink-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Tải tệp tài liệu riêng (Word, PDF, TXT)"
                >
                  Tải File Riêng
                </button>
              </div>

              {/* Dynamic Input depending on Mode */}
              {sourceMode === 'tab3' && (
                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-bold text-pink-400">Nguồn: Giáo án từ Tab 3</span>
                    <span className="text-[11px] text-slate-400">
                      {lessonContent.length > 0 ? `${lessonContent.length} ký tự` : 'Chưa có nội dung'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-3">
                    {lessonContent ? lessonContent.slice(0, 300) + '...' : 'Vui lòng tạo giáo án ở Tab 3 trước hoặc chọn nguồn khác.'}
                  </p>
                </div>
              )}

              {sourceMode === 'sgk' && (
                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-bold text-pink-400">Nguồn: Sách Giáo Khoa / Tài Liệu Tab 2</span>
                    <span className="text-[11px] text-slate-400">
                      {effectiveSgkText.length > 0 ? `${effectiveSgkText.length} ký tự` : 'Chưa nạp SGK'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-3">
                    {effectiveSgkText ? effectiveSgkText.slice(0, 300) + '...' : 'Chưa có nội dung SGK từ Tab 2. Thầy/Cô có thể tải file hoặc nhập chủ đề.'}
                  </p>
                </div>
              )}

              {sourceMode === 'tab1' && (
                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="text-xs font-bold text-pink-400">Nguồn: Tên bài học đã chọn ở Tab 1</div>
                  <p className="text-xs text-slate-200 font-semibold">{lessonText || 'Chưa chọn bài ở Tab 1'}</p>
                </div>
              )}

              {sourceMode === 'direct' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Nhập Tên Bài Học / Chủ Đề Muốn Soạn:</label>
                  <input
                    type="text"
                    value={directTopic}
                    onChange={e => setDirectTopic(e.target.value)}
                    placeholder="Ví dụ: Định lý Pythagore và ứng dụng tính khoảng cách thực tế..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-pink-500"
                  />
                </div>
              )}

              {sourceMode === 'file' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-950 border border-dashed border-slate-700 hover:border-pink-500 cursor-pointer text-xs text-slate-300 transition-all">
                      <Upload className="w-4 h-4 text-pink-400" />
                      <span>{customFileName ? customFileName : 'Chọn file tài liệu (.docx, .pdf, .txt)...'}</span>
                      <input
                        type="file"
                        accept=".docx,.pdf,.txt,.md"
                        onChange={e => handleFileUpload(e, setCustomFileText, setCustomFileName)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {customFileText && (
                    <div className="text-[11px] text-emerald-400 bg-emerald-950/30 p-2 rounded border border-emerald-900/50">
                      ✓ Đã tải nội dung ({customFileText.length} ký tự).
                    </div>
                  )}
                </div>
              )}

              {/* Material Type Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Thể Loại Tài Liệu Cần Biên Soạn:</label>
                <select
                  value={materialType}
                  onChange={e => setMaterialType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-pink-500"
                >
                  <option value="Tài liệu tích hợp Phương pháp & Kỹ thuật dạy học tích cực">
                    🎯 Tài Liệu Tích Hợp Phương Pháp & Kỹ Thuật Dạy Học Tích Cực
                  </option>
                  <option value="Phiếu hướng dẫn học sinh chuẩn bị bài trước ở nhà theo phương pháp & kĩ thuật dạy học">
                    📋 Phiếu Chuẩn Bị Bài Trước Ở Nhà (Lớp Học Đảo Ngược / Flipped Learning)
                  </option>
                  <option value="Tài liệu dạng câu chuyện & Bối cảnh lịch sử toán học hấp dẫn">
                    📖 Tài Liệu Dạng Câu Chuyện & Bối Cảnh Lịch Sử Hấp Dẫn
                  </option>
                  <option value="Tài liệu Ôn tập & Củng cố kiến thức theo chuyên đề">
                    🔄 Tài Liệu Ôn Tập & Củng Cố Kiến Thức Theo Chuyên Đề
                  </option>
                  <option value="Tài liệu Luyện thi & Bộ đề ôn tập phân hóa chuyên sâu 4 mức độ">
                    🏆 Tài Liệu Luyện Thi & Bộ Đề Ôn Tập Phân Hóa Chuyên Sâu
                  </option>
                  <option value="Tài liệu tự học trực quan dạng Infographic & Sơ đồ tư duy bảng biểu">
                    📊 Infographic & Sơ Đồ Tư Duy Bảng Biểu Trực Quan
                  </option>
                  <option value="Phiếu tóm tắt kiến thức cốt lõi & Bí kíp giải nhanh">
                    ⚡ Phiếu Tóm Tắt Kiến Thức Cốt Lõi & Mẹo Giải Nhanh
                  </option>
                  <option value="Hệ thống bài thơ và vè ghi nhớ công thức toán học">
                    🎶 Bài Thơ & Vè Vần Điệu Ghi Nhớ Công Thức
                  </option>
                  <option value="Kịch bản lời giảng Audio truyền cảm hứng cho giáo viên và học sinh">
                    🎙️ Kịch Bản Lời Giảng Audio Diễn Cảm & Thuyết Trình
                  </option>
                  <option value="Phiếu học tập tự đánh giá 3 cấp độ kèm hướng dẫn tự sửa sai">
                    📝 Phiếu Tự Học 3 Cấp Độ Kèm Hướng Dẫn Tự Sửa Sai
                  </option>
                </select>
              </div>

              {/* Pedagogical Methods & Techniques Selection */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-pink-950/20 border border-pink-500/30 space-y-3 shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-pink-300 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-pink-400" />
                    Tích Hợp Phương Pháp & Kỹ Thuật Dạy Học Tích Cực
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-medium">
                    Chuẩn Sư Phạm 4 Bước
                  </span>
                </div>

                {/* 1. Phương pháp dạy học */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                      <Workflow className="w-3 h-3 text-pink-400" />
                      1. Phương pháp dạy học chủ đạo:
                    </label>
                  </div>
                  <select
                    value={selectedPP}
                    onChange={e => setSelectedPP(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-pink-500"
                  >
                    {ppList.map((pp, idx) => (
                      <option key={idx} value={pp}>{pp}</option>
                    ))}
                    <option value="custom">✍️ Tùy chỉnh phương pháp khác...</option>
                  </select>

                  {selectedPP === 'custom' && (
                    <input
                      type="text"
                      value={customPP}
                      onChange={e => setCustomPP(e.target.value)}
                      placeholder="Nhập phương pháp dạy học tùy biến..."
                      className="w-full bg-slate-950 border border-pink-500/50 rounded-lg px-2.5 py-1.5 text-xs text-pink-200 focus:outline-none"
                    />
                  )}

                  {/* Quick PP badges */}
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {['Dạy học nhóm / Hợp tác', 'Dạy học theo Trạm', 'Bàn tay nặn bột', 'Dạy học giải quyết vấn đề (PBL)'].map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedPP(p)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                          selectedPP === p
                            ? 'bg-pink-600/30 border-pink-400 text-pink-200 font-bold'
                            : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Kỹ thuật dạy học */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                      <Target className="w-3 h-3 text-pink-400" />
                      2. Kỹ thuật dạy học tích cực áp dụng:
                    </label>
                  </div>
                  <select
                    value={selectedKT}
                    onChange={e => setSelectedKT(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-pink-500"
                  >
                    {ktList.map((kt, idx) => (
                      <option key={idx} value={kt}>{kt}</option>
                    ))}
                    <option value="custom">✍️ Tùy chỉnh kỹ thuật khác...</option>
                  </select>

                  {selectedKT === 'custom' && (
                    <input
                      type="text"
                      value={customKT}
                      onChange={e => setCustomKT(e.target.value)}
                      placeholder="Nhập kỹ thuật dạy học tích cực tùy biến..."
                      className="w-full bg-slate-950 border border-pink-500/50 rounded-lg px-2.5 py-1.5 text-xs text-pink-200 focus:outline-none"
                    />
                  )}

                  {/* Quick KT badges */}
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {[
                      { label: 'Khăn trải bàn', val: '2. Kỹ thuật Khăn trải bàn' },
                      { label: 'Mảnh ghép (Jigsaw)', val: '3. Kỹ thuật Mảnh ghép (Jigsaw)' },
                      { label: 'Phòng tranh', val: '7. Kỹ thuật Phòng tranh (Gallery Walk)' },
                      { label: 'Sơ đồ tư duy', val: '4. Kỹ thuật Sơ đồ tư duy (Mindmap)' },
                      { label: 'Bảng KWL', val: '1. Kỹ thuật KWL / KWHL' },
                      { label: 'Chia sẻ nhóm đôi', val: '10. Kỹ thuật Chia sẻ nhóm đôi (Think-Pair-Share)' }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedKT(item.val)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                          selectedKT === item.val
                            ? 'bg-rose-600/30 border-rose-400 text-rose-200 font-bold'
                            : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-pink-950/30 border border-pink-800/40 text-[11px] text-pink-200/90 leading-relaxed">
                  💡 <strong>Cấu trúc học liệu:</strong> Sẽ tạo phiếu giao nhiệm vụ phân hóa chi tiết theo <strong>{selectedKT.replace(/^\d+\.\s*/, '')}</strong>, quy trình 4 bước theo <strong>{selectedPP}</strong> và kèm bảng tiêu chí Rubric đánh giá năng lực học sinh.
                </div>
              </div>

              {/* Custom Requirements */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Yêu Cầu Tùy Biến Thêm (Nếu Có):</label>
                <textarea
                  value={customRequirements}
                  onChange={e => setCustomRequirements(e.target.value)}
                  rows={2}
                  placeholder="Ví dụ: Tăng cường ví dụ hình học thực tế, giải thích mẹo bấm máy tính Casio..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-pink-500 resize-none"
                />
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleGenerateMaterial}
                disabled={isGenerating}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 hover:from-pink-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang Biên Soạn Tài Liệu & Kịch Bản...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Biên Soạn Tài Liệu & Kịch Bản Ngay</span>
                  </>
                )}
              </button>
            </div>

            {/* Right: Audio Player & Voice Studio */}
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Headphones className="w-4 h-4 text-pink-400" />
                    2. Studio Giọng Đọc AI & Audio Bài Giảng
                  </span>
                  <span className="text-[11px] text-pink-400 font-bold">Giọng Đọc Tiếng Việt Ba Miền</span>
                </div>

                {/* Voice Selection */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">Chọn Giọng Đọc Sư Phạm:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {EXPRESSIVE_VIETNAMESE_VOICES.map(voice => (
                        <button
                          key={voice.id}
                          type="button"
                          onClick={() => setSelectedVoiceId(voice.id)}
                          className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                            selectedVoiceId === voice.id
                              ? 'bg-pink-950/60 border-pink-500 text-pink-200 shadow-md'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="font-bold flex items-center justify-between">
                            <span>{voice.name}</span>
                            {selectedVoiceId === voice.id && <Check className="w-3.5 h-3.5 text-pink-400" />}
                          </div>
                          <div className="text-[10px] text-slate-400">{voice.region} • {voice.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Speech Rate */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span className="flex items-center gap-1">
                        <Sliders className="w-3.5 h-3.5 text-pink-400" />
                        Tốc Độ Đọc:
                      </span>
                      <span className="font-mono text-pink-400 font-bold text-xs bg-pink-950/80 px-2 py-0.5 rounded border border-pink-800">
                        {speechRate}x ({TTS_SPEED_PRESETS.find(s => s.value === speechRate)?.label || `${speechRate}x`})
                      </span>
                    </div>
                    <div className="grid grid-cols-5 sm:grid-cols-9 gap-1">
                      {TTS_SPEED_PRESETS.map(preset => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setSpeechRate(preset.value)}
                          className={`py-1 rounded text-[11px] font-bold transition-all border text-center ${
                            speechRate === preset.value
                              ? 'bg-pink-600 text-white border-pink-500 shadow-sm'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                          }`}
                          title={preset.description}
                        >
                          {preset.value}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Player Controls & Download Audio */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 mt-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleRewind10}
                    disabled={!isPlayingAudio && !isAudioPaused}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40"
                    title="Tua lại 10 giây"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={isPlayingAudio ? handlePauseAudio : handlePlayAudio}
                    disabled={isLoadingAudioStream || !generatedMaterialText}
                    className="flex-1 min-w-[140px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoadingAudioStream ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang Nối Audio...</span>
                      </>
                    ) : isPlayingAudio ? (
                      <>
                        <Pause className="w-4 h-4 fill-white" />
                        <span>Tạm Dừng</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>{isAudioPaused ? 'Tiếp Tục' : 'Phát Audio Bài Giảng'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleStopAudio}
                    disabled={!isPlayingAudio && !isAudioPaused}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-400 border border-slate-800 disabled:opacity-40"
                    title="Dừng phát"
                  >
                    <Square className="w-4 h-4 fill-rose-400" />
                  </button>

                  <button
                    type="button"
                    onClick={handleForward10}
                    disabled={!isPlayingAudio && !isAudioPaused}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40"
                    title="Tua tới 10 giây"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>

                  {/* Audio Download Button */}
                  <button
                    type="button"
                    onClick={handleDownloadAudio}
                    disabled={isDownloadingAudio || !generatedMaterialText}
                    className="py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
                    title="Tải tệp âm thanh bài giảng MP3 về máy tính hoặc điện thoại"
                  >
                    {isDownloadingAudio ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang Tạo MP3...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Tải Audio MP3</span>
                      </>
                    )}
                  </button>

                  {/* Re-generate Audio Button */}
                  <button
                    type="button"
                    onClick={handleRegenerateAudio}
                    disabled={isLoadingAudioStream || !generatedMaterialText}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-pink-300 hover:text-pink-200 font-bold text-xs border border-pink-500/40 flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
                    title="Tạo lại file âm thanh và phát từ đầu theo nội dung tài liệu mới nhất"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Tạo Lại Audio</span>
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-900">
                  <span className="text-[11px] font-mono text-slate-400 w-10 text-right">
                    {formatPlaybackTime(currentTime)}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={e => handleTimeSeek(Number(e.target.value))}
                    onMouseDown={() => { isScrubbingRef.current = true; setIsScrubbing(true); }}
                    onMouseUp={() => { isScrubbingRef.current = false; setIsScrubbing(false); }}
                    className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                  <span className="text-[11px] font-mono text-slate-400 w-10">
                    {formatPlaybackTime(duration)}
                  </span>
                </div>

                {currentChunkInfo && (
                  <div className="text-[11px] text-pink-300 bg-pink-950/40 p-2 rounded-lg border border-pink-900/40 flex items-center gap-2">
                    <span className="font-bold text-pink-400 shrink-0">
                      Đoạn ({currentChunkInfo.current}/{currentChunkInfo.total}):
                    </span>
                    <span className="truncate italic">"{currentChunkInfo.text}"</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Script Refinement & Direct Document Editor Panel */}
          {generatedMaterialText && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-pink-950/30 border border-pink-500/30 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-pink-600/20 text-pink-400 border border-pink-500/30">
                    <Wand2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span>Chỉnh Sửa Tài Liệu & Tạo Lại Kịch Bản Âm Thanh</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-medium">
                        AI Trợ lý Sư phạm
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Yêu cầu AI sửa bất kỳ đoạn nào, chỉnh cách đọc ký hiệu toán ($N^*$, phân số...), hoặc tự sửa trực tiếp rồi tạo lại Audio.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleDirectEdit}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                      isDirectEditing
                        ? 'bg-amber-600/30 text-amber-200 border-amber-500/50 shadow-md'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isDirectEditing ? 'Đóng Sửa Trực Tiếp' : 'Sửa Trực Tiếp (Text)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRegenerateAudio}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white shadow-md shadow-pink-600/30 transition-all flex items-center gap-1.5"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Tạo Lại Audio Đã Sửa</span>
                  </button>
                </div>
              </div>

              {/* Direct Textarea Editor if toggled */}
              {isDirectEditing ? (
                <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-amber-500/30">
                  <div className="flex items-center justify-between text-xs text-amber-300">
                    <span className="font-bold flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      Biên tập trực tiếp nội dung kịch bản & tài liệu:
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {directEditText.length.toLocaleString('vi-VN')} ký tự
                    </span>
                  </div>

                  <textarea
                    value={directEditText}
                    onChange={e => setDirectEditText(e.target.value)}
                    rows={12}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500 leading-relaxed"
                  />

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsDirectEditing(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveDirectEdit}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu Nội Dung & Cập Nhật Audio</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* AI Prompt Refinement Input & Preset Chips */
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={aiRefinePrompt}
                        onChange={e => setAiRefinePrompt(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAiRefineScript();
                          }
                        }}
                        placeholder="Nhập yêu cầu AI sửa đoạn nào, nội dung gì trong kịch bản âm thanh hoặc tài liệu..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-pink-500 pr-10 shadow-inner"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAiRefineScript()}
                      disabled={isAiRefining || !aiRefinePrompt.trim()}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs shadow-md shadow-pink-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-40 shrink-0"
                    >
                      {isAiRefining ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang Sửa Đổi...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI Sửa Kịch Bản</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Suggestion Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-400 mr-1">Gợi ý sửa nhanh:</span>
                    {[
                      { label: '🎯 Sửa cách đọc ký hiệu N* & quan hệ tập hợp', prompt: 'Chỉnh sửa toàn bộ chỗ đọc tập hợp N* thành "N sao", quan hệ thuộc / không thuộc đọc chuẩn xác tự nhiên không bị lặp.' },
                      { label: '✂️ Rút gọn lời giảng ngắn gọn, cô đọng', prompt: 'Hãy rút gọn kịch bản lời giảng ở các hoạt động để ngắn gọn, súc tích, dễ nhớ hơn nhưng giữ nguyên các ý chính.' },
                      { label: '🎙️ Trau chuốt văn phong truyền cảm, lôi cuốn', prompt: 'Hãy trau chuốt lại lời dẫn và lời giảng cho tự nhiên, gần gũi, giàu cảm xúc và thu hút học sinh hơn.' },
                      { label: '➕ Bổ sung ví dụ thực tế & câu hỏi tương tác', prompt: 'Hãy bổ sung thêm 1 ví dụ liên hệ đời sống thực tế và 1 câu hỏi kích thích tư duy ở phần luyện tập.' }
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAiRefinePrompt(chip.prompt);
                          handleAiRefineScript(chip.prompt);
                        }}
                        disabled={isAiRefining}
                        className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-950/80 hover:bg-pink-950/50 hover:border-pink-500/50 text-slate-300 hover:text-pink-200 border border-slate-800 transition-all text-left disabled:opacity-40"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Output Panel: WYSIWYG A4 Document Preview with LaTeX & Editing */}
          {(() => {
            const effectivePP = (selectedPP === 'custom' ? customPP.trim() : selectedPP) || 'Phương pháp dạy học tích cực';
            const effectiveKT = (selectedKT === 'custom' ? customKT.trim() : selectedKT) || 'Kỹ thuật dạy học tích cực';
            const dynamicHeader = (materialType.includes('Phương pháp') || materialType.includes('Kỹ thuật') || materialType.includes('Tích hợp'))
              ? `TÀI LIỆU TÍCH HỢP ${effectivePP.toUpperCase()} & ${effectiveKT.toUpperCase()} - MÔN ${monHoc.toUpperCase()}`
              : `${materialType.toUpperCase()} - MÔN ${monHoc.toUpperCase()}`;
            return (
              <A4DocumentPreview
                content={generatedMaterialText}
                onChangeContent={setGeneratedMaterialText}
                title={`${materialType} - Môn ${monHoc} Lớp ${lop}`}
                documentType="material"
                monHoc={monHoc}
                lop={lop}
                apiKeysInput={apiKeysInput}
                onExportWord={handleExportWordMaterial}
                onDownloadAudio={handleDownloadAudio}
                exportOptions={{
                  headerText: dynamicHeader,
                  footerText: `Trường THCS Phùng Khắc Khoan - Xã Tây Phương, TP. Hà Nội`,
                  monHoc,
                  lop,
                  fileName: `Tai_Lieu_${(effectivePP + '_' + effectiveKT).slice(0, 30).replace(/[^a-zA-Z0-9à-ỹÀ-Ỹ_]+/g, '_')}_Lop_${lop}.docx`,
                  showPageNumbers: true
                }}
              />
            );
          })()}
        </>
      )}

      {/* SUB-TAB 2: Chuyển Đổi Text, Word, PDF Ra Giọng Đọc (Đa Giọng, Đa Tốc Độ, Không Giới Hạn) */}
      {activeSubTab === 'doc_to_speech' && (
        <Tab5DocumentToSpeech
          apiKeysInput={apiKeysInput}
          tab3Content={lessonContent}
          referenceCacheText={referenceCacheText}
          monHoc={monHoc}
          lop={lop}
        />
      )}

      {/* SUB-TAB 3: Chuyển Đổi Âm Thanh / Giọng Nói Sang Word (.docx) */}
      {activeSubTab === 'audio_to_word' && (
        <div className="space-y-6">
          {/* Controls Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Input Selection (Upload or Record) */}
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <FileAudio className="w-4 h-4 text-cyan-400" />
                  1. Nạp File Âm Thanh Hoặc Thu Âm Lời Giảng
                </span>
                <span className="text-[11px] text-cyan-300 font-mono">Audio-to-Word AI</span>
              </div>

              {/* Mode switch: Upload file vs Record Mic */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setAudioInputMode('file')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded text-xs font-bold transition-all ${
                    audioInputMode === 'file'
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Tải File Ghi Âm Lên</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAudioInputMode('mic')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded text-xs font-bold transition-all ${
                    audioInputMode === 'mic'
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Thu Âm Micro Trực Tiếp</span>
                </button>
              </div>

              {/* Audio File Upload */}
              {audioInputMode === 'file' && (
                <div className="space-y-3">
                  <label className="flex flex-col items-center justify-center p-6 rounded-xl bg-slate-950 border-2 border-dashed border-slate-700 hover:border-cyan-500 cursor-pointer transition-all group">
                    <FileAudio className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform mb-2" />
                    <span className="text-xs font-bold text-slate-200">
                      {uploadedAudioFile ? uploadedAudioFile.name : 'Bấm hoặc kéo thả file âm thanh bài giảng vào đây'}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1">
                      Hỗ trợ MP3, WAV, M4A, OGG, WebM, AAC, FLAC
                    </span>
                    <input
                      type="file"
                      accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm,.aac,.flac,.m4r"
                      onChange={handleAudioFileChange}
                      className="hidden"
                    />
                  </label>

                  {uploadedAudioFile && (
                    <div className="flex items-center justify-between text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-2 truncate">
                        <FileAudio className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="text-slate-200 truncate">{uploadedAudioFile.name}</span>
                        <span className="text-slate-500 font-mono text-[10px]">
                          ({(uploadedAudioFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedAudioFile(null);
                          setUploadedAudioBase64(null);
                          setUploadedAudioUrl(null);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Xóa file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Live Microphone Recording */}
              {audioInputMode === 'mic' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className={`p-4 rounded-full border transition-all ${
                      isRecording 
                        ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse scale-110' 
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}>
                      {isRecording ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
                    </div>

                    <div className="font-mono text-lg font-bold text-slate-100">
                      {formatPlaybackTime(recordingSeconds)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {isRecording ? 'Đang lắng nghe lời giảng của Thầy/Cô...' : 'Sẵn sàng thu âm bài giảng'}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={handleStartRecording}
                        className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition-all flex items-center gap-2"
                      >
                        <Mic className="w-4 h-4" />
                        <span>Bắt Đầu Ghi Âm</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStopRecording}
                        className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/50 font-bold text-xs shadow transition-all flex items-center gap-2"
                      >
                        <Square className="w-4 h-4 fill-rose-400" />
                        <span>Dừng Ghi Âm & Lưu Đoạn</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Audio Preview Player */}
              {uploadedAudioUrl && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    Nghe Thử Đoạn Âm Thanh:
                  </label>
                  <audio
                    src={uploadedAudioUrl}
                    controls
                    className="w-full h-9 rounded-lg bg-slate-950"
                  />
                </div>
              )}
            </div>

            {/* Right: Transcription Settings & Processing */}
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    2. Chế Độ Bóc Băng & Định Dạng Word
                  </span>
                  <span className="text-[11px] text-slate-400">Chuẩn LaTeX $...$</span>
                </div>

                {/* Task Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Chọn Kiểu Chuyển Đổi:</label>
                  <div className="space-y-2">
                    <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      transcriptionTask === 'verbatim'
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-100'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="transcriptionTask"
                        checked={transcriptionTask === 'verbatim'}
                        onChange={() => setTranscriptionTask('verbatim')}
                        className="mt-0.5 accent-cyan-500"
                      />
                      <div>
                        <div className="font-bold text-slate-100">Bóc Băng Nguyên Văn & Chuẩn Hóa Công Thức Toán</div>
                        <div className="text-[11px] text-slate-400">
                          Chuyển toàn bộ lời giảng thành văn bản, tự động chuyển công thức nói sang LaTeX ($a^2$, $\sqrt&#123;x&#125;$, $\frac&#123;a&#125;&#123;b&#125;$).
                        </div>
                      </div>
                    </label>

                    <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      transcriptionTask === 'lesson_summary'
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-100'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="transcriptionTask"
                        checked={transcriptionTask === 'lesson_summary'}
                        onChange={() => setTranscriptionTask('lesson_summary')}
                        className="mt-0.5 accent-cyan-500"
                      />
                      <div>
                        <div className="font-bold text-slate-100">Tóm Tắt Bài Học & Lập Kế Hoạch Bài Dạy Từ Lời Giảng</div>
                        <div className="text-[11px] text-slate-400">
                          AI phân tích bài giảng thu âm và trích xuất thành tóm tắt kiến thức, ví dụ mẫu và kế hoạch dạy học súc tích.
                        </div>
                      </div>
                    </label>

                    <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      transcriptionTask === 'qa_extract'
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-100'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="transcriptionTask"
                        checked={transcriptionTask === 'qa_extract'}
                        onChange={() => setTranscriptionTask('qa_extract')}
                        className="mt-0.5 accent-cyan-500"
                      />
                      <div>
                        <div className="font-bold text-slate-100">Trích Xuất Câu Hỏi & Bài Tập Từ Lời Giảng</div>
                        <div className="text-[11px] text-slate-400">
                          Tổng hợp toàn bộ các câu hỏi gợi mở, ví dụ và bài tập mà Thầy/Cô đã nêu trong audio kèm lời giải chi tiết.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Additional Note */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-slate-300">Yêu Cầu Tinh Chỉnh Bổ Sung (Nếu Có):</label>
                  <input
                    type="text"
                    value={transcriptionCustomNote}
                    onChange={e => setTranscriptionCustomNote(e.target.value)}
                    placeholder="Ví dụ: Tách thành các đề mục lớn nhỏ rõ ràng, làm nổi bật định lý..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleRunTranscription}
                disabled={isTranscribing || !uploadedAudioBase64}
                className="w-full mt-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isTranscribing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang Bóc Băng & Chuyển Đổi Với Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Bắt Đầu Bóc Băng & Chuyển Đổi Sang Word</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Result Panel */}
          {transcriptionResult && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm font-bold text-slate-100">
                    Kết Quả Bóc Băng Âm Thanh & Soạn Thảo Chuẩn Word
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyTranscription}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
                  >
                    {transcriptionCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{transcriptionCopied ? 'Đã Sao Chép' : 'Sao Chép'}</span>
                  </button>

                  {onInsertToLessonContent && (
                    <button
                      type="button"
                      onClick={() => onInsertToLessonContent(transcriptionResult)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Chèn Sang Giáo Án Tab 3</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleExportTranscriptionWord}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Xuất File Word (.docx)</span>
                  </button>
                </div>
              </div>

              {/* Preview with A4 Document Preview */}
              <A4DocumentPreview
                content={transcriptionResult}
                onChangeContent={setTranscriptionResult}
                title={`Bản Bóc Băng Lời Giảng - Môn ${monHoc} Lớp ${lop}`}
                documentType="material"
                monHoc={monHoc}
                lop={lop}
                apiKeysInput={apiKeysInput}
                onExportWord={handleExportTranscriptionWord}
                exportOptions={{
                  monHoc,
                  lop,
                  fileName: `Boc_Bang_Ghi_Am_${monHoc}_Lop_${lop}.docx`,
                  showPageNumbers: true
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
