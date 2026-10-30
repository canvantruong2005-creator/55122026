import React, { useState, useRef } from 'react';
import {
  Feather,
  Sparkles,
  X,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Download,
  BookOpen,
  FileText,
  Upload,
  RefreshCw,
  Play,
  Square,
  Music,
  Share2,
  Sliders,
  Award,
  Layers,
  HelpCircle,
  FolderPlus
} from 'lucide-react';
import { generateGeminiText } from '../../lib/geminiApi';
import { playVietnameseSpeech, stopSpeech } from '../../lib/ttsAudio';
import { exportMarkdownToWord } from '../../lib/wordExport';
import { EducationalMarkdownRenderer } from '../common/EducationalMarkdownRenderer';
import { repairVietnameseText, sanitizeMathForVietnamese } from '../../lib/mathSanitizer';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

export interface PoemComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentContent: string;
  monHoc?: string;
  lop?: string;
  apiKeysInput?: string;
  onInsertToContent: (poemMarkdown: string, insertPosition: 'start' | 'warmup' | 'practice' | 'summary' | 'end') => void;
}

export const PoemComposerModal: React.FC<PoemComposerModalProps> = ({
  isOpen,
  onClose,
  currentContent,
  monHoc = 'Toán học',
  lop = 'Lớp 6',
  apiKeysInput = '',
  onInsertToContent
}) => {
  // Source Selection
  const [sourceType, setSourceType] = useState<'current_lesson' | 'custom_text' | 'upload_file' | 'textbook_topic'>('current_lesson');
  const [customSourceText, setCustomSourceText] = useState<string>('');
  const [textbookTopic, setTextbookTopic] = useState<string>('');
  const [textbookPublisher, setTextbookPublisher] = useState<string>('Kết nối tri thức với cuộc sống');
  const [selectedSubject, setSelectedSubject] = useState<string>(monHoc || 'Toán học');
  const [selectedGrade, setSelectedGrade] = useState<string>(lop || 'Lớp 6');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isFileExtracting, setIsFileExtracting] = useState<boolean>(false);

  // Pedagogical parameters
  const [poemForm, setPoemForm] = useState<'luc_bat' | 'four_words' | 'five_words' | 'seven_words' | 've_dong_dao' | 'song_that_luc_bat' | 'free'>('luc_bat');
  const [pedagogicalGoal, setPedagogicalGoal] = useState<'warmup' | 'summary_rule' | 'roleplay_game' | 'emotion_practice'>('summary_rule');
  const [targetAudience, setTargetAudience] = useState<'primary' | 'secondary' | 'high_school'>('secondary');
  const [tone, setTone] = useState<'humorous' | 'gentle' | 'energetic' | 'folk'>('humorous');
  const [poemLength, setPoemLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [mustHaveKeywords, setMustHaveKeywords] = useState<string>('');
  const [extraTeacherNotes, setExtraTeacherNotes] = useState<string>('');

  // Generation & Result State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedPoem, setGeneratedPoem] = useState<string>('');
  const [poemTitle, setPoemTitle] = useState<string>('');
  const [pedagogicalAnalysis, setPedagogicalAnalysis] = useState<string>('');
  const [gameInstructions, setGameInstructions] = useState<string>('');
  const [fullOutputMarkdown, setFullOutputMarkdown] = useState<string>('');

  // Audio Playback State
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [insertSuccess, setInsertSuccess] = useState<boolean>(false);
  const [selectedInsertPos, setSelectedInsertPos] = useState<'warmup' | 'practice' | 'summary' | 'end'>('summary');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Handle File Upload & Extraction
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setUploadedFileName(file.name);
    setIsFileExtracting(true);

    try {
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const res = await mammoth.extractRawText({ arrayBuffer });
        setCustomSourceText(res.value || '');
      } else if (file.name.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
        }
        setCustomSourceText(fullText);
      } else {
        // Plain text / Markdown
        const text = await file.text();
        setCustomSourceText(text);
      }
    } catch (err: any) {
      alert('Lỗi đọc tệp: ' + (err.message || err));
    } finally {
      setIsFileExtracting(false);
    }
  };

  // Quick Preset Samples for Common Subjects
  const applyQuickSample = (type: 'math_fractions' | 'math_pythagoras' | 'science_ohm' | 'literature_kieu' | 'history_dienbien') => {
    if (type === 'math_fractions') {
      setSelectedSubject('Toán học');
      setSelectedGrade('Lớp 6');
      setSourceType('custom_text');
      setCustomSourceText(`Quy đồng mẫu nhiều phân số:
1. Tìm BCNN của các mẫu số để làm mẫu số chung (MSC).
2. Tìm thừa số phụ của mỗi mẫu (lấy MSC chia cho từng mẫu).
3. Nhân cả tử và mẫu của mỗi phân số với thừa số phụ tương ứng.
Phân số bằng nhau, tử số, mẫu số, ước chung (ƯC), ước chung lớn nhất (ƯCLN), bội chung (BC), bội chung nhỏ nhất (BCNN).`);
      setMustHaveKeywords('tử số, mẫu số, quy đồng, BCNN, nhân cả tử và mẫu');
      setPoemForm('luc_bat');
      setPedagogicalGoal('summary_rule');
      setTone('humorous');
    } else if (type === 'math_pythagoras') {
      setSelectedSubject('Toán học');
      setSelectedGrade('Lớp 8');
      setSourceType('custom_text');
      setCustomSourceText(`Định lý Pythagore trong tam giác vuông:
Trong một tam giác vuông, bình phương của cạnh huyền bằng tổng các bình phương của hai cạnh góc vuông.
Công thức: a^2 + b^2 = c^2 (với c là cạnh huyền, a và b là hai cạnh góc vuông).
Định lý đảo: Nếu một tam giác có bình phương của một cạnh bằng tổng bình phương của hai cạnh kia thì tam giác đó là tam giác vuông.`);
      setMustHaveKeywords('tam giác vuông, cạnh huyền, bình phương, tổng hai cạnh');
      setPoemForm('five_words');
      setPedagogicalGoal('summary_rule');
      setTone('energetic');
    } else if (type === 'science_ohm') {
      setSelectedSubject('Khoa học tự nhiên (Vật lí)');
      setSelectedGrade('Lớp 9');
      setSourceType('custom_text');
      setCustomSourceText(`Định luật Ôm (Ohm) cho đoạn mạch:
Cường độ dòng điện chạy qua dây dẫn tỉ lệ thuận với hiệu điện thế đặt vào hai đầu dây và tỉ lệ nghịch với điện trở của dây.
Công thức: I = U / R
Trong đó:
- I là cường độ dòng điện (Ampe, A)
- U là hiệu điện thế (Vôn, V)
- R là điện trở (Ôm, Ω)`);
      setMustHaveKeywords('I bằng U chia R, cường độ, hiệu điện thế, điện trở');
      setPoemForm('four_words');
      setPedagogicalGoal('roleplay_game');
      setTone('humorous');
    } else if (type === 'literature_kieu') {
      setSelectedSubject('Ngữ văn');
      setSelectedGrade('Lớp 9');
      setSourceType('custom_text');
      setCustomSourceText(`Truyện Kiều của Đại thi hào Nguyễn Du:
Đoạn trích Chị em Thúy Kiều:
Vẻ đẹp của Thúy Vân: Đoan trang, khuôn trăng đầy đặn, nét ngài nở nang, hoa cười ngọc thốt, mây thua nước tóc tuyết nhường màu da.
Vẻ đẹp của Thúy Kiều: Sắc sảo mặn mà, làn thu thủy nét xuân sơn, hoa ghen thua thắm liễu hờn kém xanh, tài sắc vẹn toàn, cung thương làu bậc ngũ âm.`);
      setMustHaveKeywords('Thúy Vân, Thúy Kiều, mây thua tuyết nhường, hoa ghen liễu hờn');
      setPoemForm('song_that_luc_bat');
      setPedagogicalGoal('emotion_practice');
      setTone('gentle');
    } else if (type === 'history_dienbien') {
      setSelectedSubject('Lịch sử');
      setSelectedGrade('Lớp 9');
      setSourceType('custom_text');
      setCustomSourceText(`Chiến thắng Điện Biên Phủ năm 1954:
56 ngày đêm khoét núi, ngủ hầm, mưa dầm, cơm vắt, máu trộn bùn non, gan không núng, chí không mòn.
Chiến thắng lừng lẫy năm châu, chấn động địa cầu, đập tan tập đoàn cứ điểm Điện Biên Phủ, buộc thực dân Pháp ký Hiệp định Giơ-ne-vơ.`);
      setMustHaveKeywords('Điện Biên Phủ, 56 ngày đêm, lừng lẫy năm châu, chấn động địa cầu');
      setPoemForm('seven_words');
      setPedagogicalGoal('warmup');
      setTone('energetic');
    }
  };

  // Generate Poem via Gemini
  const handleComposePoem = async () => {
    let sourceContent = '';
    if (sourceType === 'current_lesson') {
      if (!currentContent.trim()) {
        alert('Kế hoạch bài dạy ở Tab 3 đang trống! Vui lòng tạo bài soạn trước hoặc chọn tab "Nhập Tự Do / Khái Niệm".');
        return;
      }
      sourceContent = currentContent.slice(0, 4000);
    } else if (sourceType === 'custom_text' || sourceType === 'upload_file') {
      if (!customSourceText.trim()) {
        alert('Vui lòng nhập nội dung văn bản hoặc tải tệp tài liệu để làm nguồn sáng tác.');
        return;
      }
      sourceContent = customSourceText.slice(0, 4000);
    } else if (sourceType === 'textbook_topic') {
      if (!textbookTopic.trim()) {
        alert('Vui lòng nhập tên bài học / chủ đề SGK cần sáng tác thơ.');
        return;
      }
      sourceContent = `Môn học: ${selectedSubject} - ${selectedGrade}.
Bộ sách: ${textbookPublisher}.
Tên bài học/Chủ đề: ${textbookTopic}.`;
    }

    const apiKeys = apiKeysInput ? apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean) : [];
    setIsGenerating(true);
    stopAudio();

    const formDescriptions: Record<string, string> = {
      luc_bat: 'Thơ Lục Bát (câu 6 chữ và câu 8 chữ, gieo vần bằng trắc truyền thống mượt mà, gieo vần lưng và vần chân chuẩn xác, đọc êm tai như ca dao)',
      four_words: 'Thơ 4 Chữ (Tứ ngôn, nhịp 2/2 giòn giã, vui nhộn, rất hợp cho học sinh đọc đồng thanh, gõ phách vỗ tay)',
      five_words: 'Thơ 5 Chữ (Ngũ ngôn, súc tích, nhịp 3/2 hoặc 2/3, nhạc tính cao, giàu hình tượng)',
      seven_words: 'Thơ 7 Chữ (Thất ngôn, đĩnh đạc, trang trọng, khái quát sâu sắc bản chất khoa học)',
      ve_dong_dao: 'Vè Dân Gian / Đồng Dao Học Đường (tiết tấu vè "Nghe vẻ nghe ve / Nghe vè bài toán...", đối đáp hài hước, sôi nổi)',
      song_that_luc_bat: 'Song Thất Lục Bát (2 câu 7 chữ + 1 cặp 6/8, dạt dào cảm xúc, cổ điển)',
      free: 'Thơ Tự Do Sáng Tạo (nhịp điệu linh hoạt, phóng khoáng, giàu nhạc cảm)'
    };

    const goalDescriptions: Record<string, string> = {
      warmup: 'Khởi động đầu giờ (tạo sự tò mò, mở bài gây bất ngờ, khơi gợi hứng thú khám phá kiến thức mới)',
      summary_rule: 'Tóm tắt & Ghi nhớ quy tắc cốt lõi (khắc sâu công thức, định lý, mẹo tính nhanh, giúp học sinh thuộc làu ngay tại lớp)',
      roleplay_game: 'Trò chơi đọc thơ phân vai / Vè đố đáp (thi đua giữa các tổ/nhóm, học sinh hỏi - học sinh đáp)',
      emotion_practice: 'Giáo dục cảm xúc & Vận dụng thực tế (khơi dậy niềm đam mê học tập, liên hệ thực tiễn cuộc sống)'
    };

    const toneDescriptions: Record<string, string> = {
      humorous: 'Hài hước, dí dỏm, ngộ nghĩnh, gây cười thông minh',
      gentle: 'Dịu dàng, truyền cảm, ấm áp, sâu lắng',
      energetic: 'Hào hùng, khí thế, tràn đầy năng lượng và quyết tâm',
      folk: 'Mộc mạc, đậm chất ca dao dân ca, gần gũi'
    };

    const lengthDescriptions: Record<string, string> = {
      short: 'Ngắn gọn (4 - 8 câu thơ, cô đọng nhất)',
      medium: 'Vừa vặn (8 - 16 câu thơ, bao quát trọn vẹn bài học)',
      long: 'Đầy đủ (16 - 24 câu thơ, phân chia thành 3-4 khổ thơ rõ ràng)'
    };

    const systemInstruction = `Bạn là một Nhà Giáo Ưu Tú kiêm Nhà Thơ Sư Phạm hàng đầu Việt Nam. Bạn có tài năng xuất chúng trong việc chuyển hóa những công thức toán học, định lý khoa học, khái niệm tự nhiên và xã hội khô khan thành những bài thơ, bài vè tuyệt hay, gieo vần chuẩn xác (luật bằng trắc, vần chân, vần lưng), nhịp điệu rộn ràng, cực kỳ dễ nhớ và dễ thuộc ngay tại lớp học.

CÁC QUY TẮC BẮT BUỘC:
1. Thuật ngữ chuẩn xác 100% theo Chương trình GDPT 2018 (Ví dụ: "phân số", không viết sai chính tả; "ƯC" là ước chung, "ƯCLN" là ước chung lớn nhất, "BC" là bội chung, "BCNN" là bội chung nhỏ nhất; "tử số", "mẫu số", "quy đồng", "số đối", "nghịch đảo"...).
2. Gieo vần tuyệt đối chuẩn theo thể thơ được yêu cầu: Lục bát phải chuẩn vần chữ thứ 6 và thứ 8; thơ 4 chữ/5 chữ phải gieo vần chân hoặc vần lưng nhịp nhàng; không gượng ép gãy vần.
3. Luôn đính kèm phần "Phân tích Sư phạm & Lời bình" và "Hướng dẫn Tổ chức Trò chơi trên lớp".
4. Tuyệt đối KHÔNG để dấu sao lẻ "*" ở cuối câu thơ hoặc đầu câu thơ. Không dùng markdown in nghiêng "*" bao quanh từng câu thơ.`;

    const prompt = `DỮ LIỆU NGUỒN BÀI HỌC:
"""
${sourceContent}
"""

YÊU CẦU SÁNG TÁC THƠ SƯ PHẠM:
- Môn học: ${selectedSubject} - ${selectedGrade}
- Thể loại thơ: ${formDescriptions[poemForm]}
- Mục đích sư phạm: ${goalDescriptions[pedagogicalGoal]}
- Đối tượng học sinh: ${targetAudience === 'primary' ? 'Tiểu học (từ ngữ trong sáng, nhịp điệu sinh động)' : targetAudience === 'secondary' ? 'THCS (dí dỏm, logic, mẹo nhớ nhanh)' : 'THPT (đậm chất học thuật, khái quát sâu)'}
- Giọng điệu: ${toneDescriptions[tone]}
- Độ dài: ${lengthDescriptions[poemLength]}
${mustHaveKeywords ? `- Các từ khóa/công thức BẮT BUỘC phải xuất hiện trong vần thơ: ${mustHaveKeywords}` : ''}
${extraTeacherNotes ? `- Yêu cầu bổ sung của Thầy/Cô: ${extraTeacherNotes}` : ''}

HÃY XUẤT RA THEO CẤU TRÚC MARKDOWN SAU (KHÔNG DÙNG THẺ JSON):

# [TIÊU ĐỀ BÀI THƠ THẬT HAY & NGHỆ THUẬT]
*(Thể thơ: ... | Thích hợp cho hoạt động: ...)*

---

### 📜 NỘI DUNG BÀI THƠ
[Nội dung bài thơ được chia thành các khổ 4 câu rõ ràng, ngắt dòng chuẩn xác]

---

### 🧠 Ý NGHĨA SƯ PHẠM & KHẮC SÂU KIẾN THỨC
- **Kiến thức cốt lõi được cài cắm**: (Phân tích chi tiết từng công thức, quy tắc đã được thơ hóa như thế nào)
- **Mẹo nhớ nhanh cho học sinh**: (Cách giúp học sinh nhớ không bao giờ quên)

---

### 🎭 HƯỚNG DẪN TỔ CHỨC TRÒ CHƠI / HOẠT ĐỘNG TRÊN LỚP
- **Cách 1: Đọc đồng thanh & Gõ phách (Khởi động / Củng cố)**: (Gợi ý nhịp vỗ tay 2/2 hoặc 3/3)
- **Cách 2: Vè đố đáp phân vai giữa các Tổ / Đội**: (Tổ 1 đọc khổ 1, Tổ 2 đối đáp khổ 2...)
- **Cách 3: Trò chơi điền khuyết vần thơ**: (Xóa 1 vài từ khóa công thức để học sinh thi đua điền vào)`;

    try {
      const res = await generateGeminiText({
        prompt,
        apiKeys,
        systemInstruction
      });

      if (res) {
        // Sanitize Vietnamese text and LaTeX math expressions
        const cleaned = repairVietnameseText(sanitizeMathForVietnamese(res));
        setFullOutputMarkdown(cleaned);

        // Parse title and sections
        const lines = cleaned.split('\n');
        const titleLine = lines.find(l => l.startsWith('# '))?.replace('# ', '').trim() || 'Bài Thơ Sư Phạm Dễ Nhớ';
        setPoemTitle(titleLine);

        // Parse Poem Body
        const poemBodyMatch = cleaned.match(/###\s*(?:📜\s*)?NỘI DUNG BÀI THƠ\s*([\s\S]*?)(?=---|\n###|\n\*\*|$)/i);
        const poemBody = poemBodyMatch ? poemBodyMatch[1].trim() : cleaned;
        setGeneratedPoem(poemBody);

        // Parse Pedagogical Analysis
        const analysisMatch = cleaned.match(/###\s*(?:🧠\s*)?Ý NGHĨA SƯ PHẠM[^\n]*\s*([\s\S]*?)(?=---|\n###\s*(?:🎭\s*)?HƯỚNG DẪN|\n###|$)/i);
        setPedagogicalAnalysis(analysisMatch ? analysisMatch[1].trim() : '');

        // Parse Game Instructions
        const gameMatch = cleaned.match(/###\s*(?:🎭\s*)?HƯỚNG DẪN TỔ CHỨC TRÒ CHƠI[^\n]*\s*([\s\S]*?)$/i);
        setGameInstructions(gameMatch ? gameMatch[1].trim() : '');
      }
    } catch (err: any) {
      alert('Lỗi sáng tác thơ AI: ' + (err.message || err));
    } finally {
      setIsGenerating(false);
    }
  };

  // Text To Speech Audio
  const handlePlayAudio = async () => {
    if (isPlayingAudio) {
      stopAudio();
      return;
    }

    const poemContent = generatedPoem || fullOutputMarkdown;
    if (!poemContent) return;
    setIsPlayingAudio(true);

    try {
      // Prepare poem text with natural title and verse structure
      const titleClean = poemTitle.replace(/[#*_-]/g, '').trim();
      const textToRead = `${titleClean ? `Bài thơ: ${titleClean}.\n\n` : ''}${poemContent}`;
      await playVietnameseSpeech(textToRead, {
        voiceName: tone === 'gentle' ? 'cloud_vi_gentle' : tone === 'energetic' ? 'cloud_vi_teacher_male' : 'cloud_vi_standard',
        onEnd: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false)
      });
    } catch (e) {
      console.warn('TTS playback error:', e);
      setIsPlayingAudio(false);
    }
  };

  const stopAudio = () => {
    stopSpeech();
    setIsPlayingAudio(false);
  };

  const handleCopyPoem = () => {
    if (!fullOutputMarkdown && !generatedPoem) return;
    navigator.clipboard.writeText(fullOutputMarkdown || generatedPoem);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleExportPoemDocx = async () => {
    if (!fullOutputMarkdown) return;
    try {
      await exportMarkdownToWord(fullOutputMarkdown, {
        fileName: `BAI_THO_${selectedSubject.toUpperCase()}_${selectedGrade.toUpperCase()}`,
        headerText: `BÀI THƠ SƯ PHẠM - ${selectedSubject.toUpperCase()} ${selectedGrade.toUpperCase()}`,
        footerText: `Sáng tác phục vụ giảng dạy Chương trình GDPT 2018`,
        monHoc: selectedSubject,
        lop: selectedGrade
      });
    } catch (e: any) {
      alert('Lỗi xuất Word: ' + (e.message || e));
    }
  };

  const handleInsert = () => {
    if (!fullOutputMarkdown && !generatedPoem) return;
    onInsertToContent(fullOutputMarkdown, selectedInsertPos);
    setInsertSuccess(true);
    setTimeout(() => {
      setInsertSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-pink-500/40 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100 ring-1 ring-pink-500/20">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-pink-950/70 via-purple-950/60 to-slate-900 border-b border-pink-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-950/50 text-white">
              <Feather className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-pink-200 flex items-center gap-2">
                <span>Xưởng Sáng Tác Thơ & Vè Sư Phạm Dễ Thuộc (AI)</span>
                <span className="text-[10px] px-2 py-0.5 bg-pink-500/20 text-pink-300 font-bold rounded-full border border-pink-500/30">
                  Chuẩn GDPT 2018
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Thơ hóa công thức, định lý, quy tắc bài học thành vần điệu vui nhộn giúp học sinh thuộc làu ngay tại lớp
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopAudio();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-900/60 text-slate-400 hover:text-rose-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {/* Section 1: Data Source Selection */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black text-pink-300 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-pink-400" />
                <span>1. Chọn Nguồn Dữ Liệu Bài Học Để Sáng Tác Thơ</span>
              </span>

              {/* Subject & Grade quick badges */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  placeholder="Môn học (VD: Toán học)"
                  className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-pink-200 font-semibold w-28 sm:w-32 focus:border-pink-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={selectedGrade}
                  onChange={e => setSelectedGrade(e.target.value)}
                  placeholder="Lớp (VD: Lớp 6)"
                  className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-pink-200 font-semibold w-20 focus:border-pink-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Source Type Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSourceType('current_lesson')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                  sourceType === 'current_lesson'
                    ? 'bg-pink-950/60 border-pink-500 text-pink-200 font-bold shadow'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <FileText className="w-4 h-4 text-pink-400" />
                <span>Kế hoạch bài dạy Tab 3</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceType('custom_text')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                  sourceType === 'custom_text'
                    ? 'bg-pink-950/60 border-pink-500 text-pink-200 font-bold shadow'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Feather className="w-4 h-4 text-purple-400" />
                <span>Nhập Văn Bản / Lý Thuyết</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceType('upload_file')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                  sourceType === 'upload_file'
                    ? 'bg-pink-950/60 border-pink-500 text-pink-200 font-bold shadow'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Tải File (.docx / .pdf / .txt)</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceType('textbook_topic')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                  sourceType === 'textbook_topic'
                    ? 'bg-pink-950/60 border-pink-500 text-pink-200 font-bold shadow'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Theo Tên Bài Học SGK</span>
              </button>
            </div>

            {/* Quick Sample Presets */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-1">
              <span className="text-slate-500 font-medium">⚡ Mẫu gợi ý nhanh:</span>
              <button
                type="button"
                onClick={() => applyQuickSample('math_fractions')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-pink-300 border border-slate-700 cursor-pointer"
              >
                📐 Toán: Quy đồng phân số
              </button>
              <button
                type="button"
                onClick={() => applyQuickSample('math_pythagoras')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 cursor-pointer"
              >
                📐 Toán: Định lý Pythagore
              </button>
              <button
                type="button"
                onClick={() => applyQuickSample('science_ohm')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 cursor-pointer"
              >
                ⚡ KHTN: Định luật Ôm
              </button>
              <button
                type="button"
                onClick={() => applyQuickSample('literature_kieu')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 cursor-pointer"
              >
                📖 Văn: Chị em Thúy Kiều
              </button>
              <button
                type="button"
                onClick={() => applyQuickSample('history_dienbien')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 cursor-pointer"
              >
                🏛️ Sử: Điện Biên Phủ 1954
              </button>
            </div>

            {/* Source Content Input Panels */}
            {sourceType === 'current_lesson' && (
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between text-slate-400 font-medium">
                  <span>Trích xuất từ bài soạn hiện tại ({currentContent.length} ký tự):</span>
                  <span className="text-pink-400">Tự động chọn lọc nội dung trọng tâm</span>
                </div>
                <div className="max-h-24 overflow-y-auto p-2 bg-slate-950 rounded-lg text-slate-400 font-mono text-[11px] whitespace-pre-wrap border border-slate-800/80">
                  {currentContent ? currentContent.slice(0, 400) + '...' : '(Nội dung giáo án hiện tại chưa có dữ liệu)'}
                </div>
              </div>
            )}

            {sourceType === 'custom_text' && (
              <div className="space-y-1.5">
                <label className="block text-xs text-slate-300 font-semibold">
                  Nhập nội dung lý thuyết, công thức hoặc các quy tắc cần chuyển hóa thành thơ:
                </label>
                <textarea
                  value={customSourceText}
                  onChange={e => setCustomSourceText(e.target.value)}
                  placeholder="Dán nội dung bài học, định lý, công thức, bảng tuần hoàn, quy tắc ngữ pháp hoặc ghi chú tóm tắt vào đây..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:border-pink-500 focus:outline-none"
                />
              </div>
            )}

            {sourceType === 'upload_file' && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isFileExtracting}
                    className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isFileExtracting ? 'Đang trích xuất nội dung...' : 'Chọn Tệp Word / PDF / TXT Từ Máy'}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,.pdf,.txt,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {uploadedFileName && (
                    <span className="text-xs text-cyan-300 font-semibold flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{uploadedFileName}</span>
                    </span>
                  )}
                </div>
                {customSourceText && (
                  <textarea
                    value={customSourceText}
                    onChange={e => setCustomSourceText(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200"
                    placeholder="Nội dung tệp đã trích xuất..."
                  />
                )}
              </div>
            )}

            {sourceType === 'textbook_topic' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">Bộ sách giáo khoa:</label>
                  <select
                    value={textbookPublisher}
                    onChange={e => setTextbookPublisher(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:border-pink-500 focus:outline-none"
                  >
                    <option value="Kết nối tri thức với cuộc sống">Kết nối tri thức với cuộc sống</option>
                    <option value="Cánh Diều">Cánh Diều</option>
                    <option value="Chân trời sáng tạo">Chân trời sáng tạo</option>
                    <option value="Chương trình GDPT 2018 chung">Chương trình GDPT 2018 (Chung)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">Tên bài học / Chủ đề:</label>
                  <input
                    type="text"
                    value={textbookTopic}
                    onChange={e => setTextbookTopic(e.target.value)}
                    placeholder="Ví dụ: Bài 23 - Quy đồng mẫu nhiều phân số"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:border-pink-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Pedagogical & Rhythm Settings */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3.5">
            <span className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>2. Thể Loại Thơ, Nhịp Điệu & Mục Tiêu Sư Phạm</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {/* Thể thơ */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">📜 Thể loại thơ & Nhịp điệu:</label>
                <select
                  value={poemForm}
                  onChange={e => setPoemForm(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-pink-200 font-semibold focus:border-pink-500 focus:outline-none"
                >
                  <option value="luc_bat">📜 Thơ Lục Bát (6/8 - Mượt mà, ca dao, dễ thuộc)</option>
                  <option value="four_words">⚡ Thơ 4 Chữ (Tứ ngôn - Nhịp 2/2 giòn giã, gõ phách)</option>
                  <option value="five_words">🎵 Thơ 5 Chữ (Ngũ ngôn - Nhạc tính cao, súc tích)</option>
                  <option value="seven_words">🏛️ Thơ 7 Chữ (Thất ngôn - Đĩnh đạc, trang trọng)</option>
                  <option value="ve_dong_dao">🥁 Vè Dân Gian / Đồng Dao Học Đường (Vui nhộn)</option>
                  <option value="song_that_luc_bat">🌟 Song Thất Lục Bát (7/7/6/8 - Cổ điển, dạt dào)</option>
                  <option value="free">✨ Thơ Tự Do Sáng Tạo</option>
                </select>
              </div>

              {/* Mục đích sư phạm */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">🎯 Mục đích hoạt động sư phạm:</label>
                <select
                  value={pedagogicalGoal}
                  onChange={e => setPedagogicalGoal(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-purple-200 font-semibold focus:border-purple-500 focus:outline-none"
                >
                  <option value="summary_rule">🧠 Tóm tắt & Khắc sâu quy tắc / công thức cốt lõi</option>
                  <option value="warmup">🚀 Khởi động đầu giờ (Gợi mở, gây tò mò)</option>
                  <option value="roleplay_game">🎭 Trò chơi đọc thơ phân vai / Vè đố đáp</option>
                  <option value="emotion_practice">💖 Giáo dục cảm xúc & Vận dụng thực tiễn</option>
                </select>
              </div>

              {/* Giọng điệu */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">😄 Giọng điệu bài thơ:</label>
                <select
                  value={tone}
                  onChange={e => setTone(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-cyan-200 font-semibold focus:border-cyan-500 focus:outline-none"
                >
                  <option value="humorous">😄 Hài hước, dí dỏm, ngộ nghĩnh</option>
                  <option value="gentle">🌸 Dịu dàng, truyền cảm, sâu lắng</option>
                  <option value="energetic">🚀 Sôi nổi, hào hùng, khí thế</option>
                  <option value="folk">🌾 Mộc mạc, đậm chất ca dao dân gian</option>
                </select>
              </div>

              {/* Đối tượng */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">🎒 Đối tượng học sinh:</label>
                <select
                  value={targetAudience}
                  onChange={e => setTargetAudience(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:border-pink-500 focus:outline-none"
                >
                  <option value="primary">🧒 Tiểu học (Lớp 1 - 5: Trong sáng, nhịp nhàng)</option>
                  <option value="secondary">🎒 THCS (Lớp 6 - 9: Dí dỏm, tư duy logic)</option>
                  <option value="high_school">🎓 THPT (Lớp 10 - 12: Học thuật, sâu sắc)</option>
                </select>
              </div>

              {/* Độ dài */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">📏 Độ dài bài thơ:</label>
                <select
                  value={poemLength}
                  onChange={e => setPoemLength(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:border-pink-500 focus:outline-none"
                >
                  <option value="short">Khổ ngắn (4 - 8 câu: đọc nhanh 1 phút)</option>
                  <option value="medium">Khổ vừa (8 - 16 câu: trọn vẹn 1 bài học)</option>
                  <option value="long">Khổ dài (16 - 24 câu: toàn bộ chủ đề/chương)</option>
                </select>
              </div>

              {/* Từ khóa bắt buộc */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">🔑 Từ khóa / Công thức bắt buộc:</label>
                <input
                  type="text"
                  value={mustHaveKeywords}
                  onChange={e => setMustHaveKeywords(e.target.value)}
                  placeholder="VD: BCNN, ước chung, tử số, mẫu số..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-pink-300 focus:border-pink-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Extra Teacher Notes */}
            <div>
              <label className="block text-xs text-slate-300 font-semibold mb-1">
                ✍️ Ghi chú thêm của Thầy/Cô (Yêu cầu phong cách đặc biệt, gieo vần theo tên lớp, v.v.):
              </label>
              <input
                type="text"
                value={extraTeacherNotes}
                onChange={e => setExtraTeacherNotes(e.target.value)}
                placeholder="Ví dụ: Khổ cuối có câu đố vui; Thầy đọc 1 câu trò đọc 1 câu; Có nhắc đến lớp 6A..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-slate-200 placeholder:text-slate-600 focus:border-pink-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleComposePoem}
              disabled={isGenerating}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-extrabold text-sm flex items-center gap-2.5 shadow-xl shadow-pink-950/50 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-pink-200" />
                  <span>AI Đang Gieo Vần & Sáng Tác Bài Thơ...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>✨ BẮT ĐẦU SÁNG TÁC THƠ SƯ PHẠM AI</span>
                </>
              )}
            </button>
          </div>

          {/* Section 3: Generated Result Showcase */}
          {fullOutputMarkdown && (
            <div className="bg-slate-950 border border-pink-500/40 rounded-3xl p-5 space-y-4 shadow-2xl animate-fade-in">
              {/* Header & Tools bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-black text-pink-300">
                    {poemTitle || 'Tác Phẩm Thơ Sư Phạm Hoàn Chỉnh'}
                  </h4>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* TTS Voice Player */}
                  <button
                    type="button"
                    onClick={handlePlayAudio}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isPlayingAudio
                        ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                        : 'bg-gradient-to-r from-pink-700 to-purple-700 hover:from-pink-600 hover:to-purple-600 text-white'
                    }`}
                  >
                    {isPlayingAudio ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Dừng Đọc</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>🔊 Nghe AI Đọc Diễn Cảm</span>
                      </>
                    )}
                  </button>

                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={handleCopyPoem}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Đã sao chép!' : 'Sao chép thơ'}</span>
                  </button>

                  {/* Export Word (.docx) */}
                  <button
                    type="button"
                    onClick={handleExportPoemDocx}
                    className="px-3 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
                    title="Tải tệp Word bài thơ kèm lời bình và hướng dẫn trò chơi"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải File Word (.docx)</span>
                  </button>
                </div>
              </div>

              {/* Artistic Poem Card */}
              <div className="bg-gradient-to-b from-slate-900 via-pink-950/20 to-slate-900 border border-pink-500/30 rounded-2xl p-6 text-center space-y-4 shadow-inner">
                <div className="inline-block px-3 py-1 bg-pink-500/20 text-pink-300 font-serif italic text-xs rounded-full border border-pink-500/30">
                  🌸 {selectedSubject} • {selectedGrade} • {poemForm === 'luc_bat' ? 'Thể Thơ Lục Bát' : poemForm === 'four_words' ? 'Thể Thơ Bốn Chữ' : poemForm === 'five_words' ? 'Thể Thơ Năm Chữ' : 'Thơ Sư Phạm'}
                </div>

                <div className="text-base sm:text-lg text-pink-100 leading-relaxed sm:leading-loose text-center max-w-2xl mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', 'Lora', 'Times New Roman', serif" }}>
                  <EducationalMarkdownRenderer
                    content={generatedPoem || fullOutputMarkdown}
                    isLightMode={false}
                    className="text-center mx-auto prose-p:text-pink-100 prose-p:my-2 prose-p:text-base sm:prose-p:text-lg font-medium tracking-wide prose-strong:text-pink-300"
                  />
                </div>
              </div>

              {/* Pedagogical & Game Instruction Accordion */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {pedagogicalAnalysis && (
                  <div className="bg-slate-900/90 border border-purple-800/60 rounded-2xl p-4 space-y-2">
                    <span className="font-bold text-purple-300 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-purple-400" />
                      <span>🧠 Ý Nghĩa Sư Phạm & Khắc Sâu Kiến Thức</span>
                    </span>
                    <div className="text-slate-300 text-xs leading-relaxed">
                      <EducationalMarkdownRenderer
                        content={pedagogicalAnalysis}
                        isLightMode={false}
                        className="text-slate-300 prose-p:text-xs prose-li:text-xs prose-strong:text-purple-300"
                      />
                    </div>
                  </div>
                )}

                {gameInstructions && (
                  <div className="bg-slate-900/90 border border-indigo-800/60 rounded-2xl p-4 space-y-2">
                    <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                      <Music className="w-4 h-4 text-indigo-400" />
                      <span>🎭 Hướng Dẫn Tổ Chức Trò Chơi Trên Lớp</span>
                    </span>
                    <div className="text-slate-300 text-xs leading-relaxed">
                      <EducationalMarkdownRenderer
                        content={gameInstructions}
                        isLightMode={false}
                        className="text-slate-300 prose-p:text-xs prose-li:text-xs prose-strong:text-indigo-300"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Insertion into Tab 3 Lesson Plan */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-pink-500/30 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">Vị trí chèn vào bài soạn Tab 3:</span>
                  <select
                    value={selectedInsertPos}
                    onChange={e => setSelectedInsertPos(e.target.value as any)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-pink-300 font-semibold focus:border-pink-500 focus:outline-none"
                  >
                    <option value="warmup">🚀 Hoạt động 1: Mở đầu / Khởi động</option>
                    <option value="summary">🧠 Hoạt động Củng cố / Tóm tắt cuối bài</option>
                    <option value="practice">🎯 Hoạt động Luyện tập & Vận dụng</option>
                    <option value="end">📄 Cuối toàn bộ văn bản giáo án</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleInsert}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer transition-all active:scale-95"
                >
                  {insertSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-200" />
                      <span>Đã Chèn Thành Công!</span>
                    </>
                  ) : (
                    <>
                      <FolderPlus className="w-4 h-4" />
                      <span>📥 Chèn Bài Thơ Vào Giáo Án Tab 3</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>💡 Thơ sư phạm giúp học sinh ghi nhớ lâu hơn 300% so với đọc lý thuyết khô khan.</span>
          <button
            type="button"
            onClick={() => {
              stopAudio();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
          >
            Đóng Xưởng Thơ
          </button>
        </div>
      </div>
    </div>
  );
};
export default PoemComposerModal;
