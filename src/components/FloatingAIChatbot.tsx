import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Minimize2,
  Maximize2,
  HelpCircle,
  BookOpen,
  FileText,
  Key,
  Shield,
  Palette,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  Compass,
  GraduationCap,
  Layers,
  Lightbulb,
  Mic,
  Atom,
  Play,
  ExternalLink,
  Code,
  Paperclip,
  Image as ImageIcon,
  Calculator,
  Download,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { generateGeminiChat } from '../lib/geminiApi';
import { VoiceMicButton } from './VoiceMicButton';
import { TikZVisualizer } from './TikZVisualizer';
import { readFileAsText } from '../lib/fileUtils';
import { exportMarkdownToWord } from '../lib/wordExport';

interface FloatingAIChatbotProps {
  apiKeysInput?: string;
  isUnlocked?: boolean;
  onNavigateTab?: (tabIndex: number) => void;
  onOpenLicenseModal?: () => void;
  onOpenApiGuide?: () => void;
  onOpenTikzGuide?: () => void;
}

interface AttachedImageItem {
  id: string;
  name: string;
  dataUrl: string;
  size: number;
}

interface AttachedDocItem {
  id: string;
  name: string;
  content: string;
  size: number;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  attachedImages?: { name: string; dataUrl: string }[];
  attachedDocs?: { name: string; size: number }[];
  timestamp: string;
  category?: 'system_guide' | 'pedagogy' | 'general';
}

const SYSTEM_INSTRUCTION_GUIDE = `Bạn là Trợ lý AI Thông minh & Chuyên viên Hỗ trợ Sư phạm Cao cấp của Hệ thống **AI LESSON PLANNER PRO** (Phiên bản Chuẩn Bộ GD&ĐT 2018 - Tác giả: Thầy Cấn Văn Trường, Trường THCS Phùng Khắc Khoan, xã Tây Phương, TP. Hà Nội, Hotline/Zalo: 0988.302.636).

LƯU Ý ĐẶC BIỆT VỀ ĐƠN VỊ HÀNH CHÍNH & MÔ HÌNH CHÍNH QUYỀN 2 CẤP (TP HÀ NỘI):
- Tuyệt đối KHÔNG sử dụng cấp "huyện Thạch Thất" hoặc "Phòng GD&ĐT huyện Thạch Thất" vì TP Hà Nội đã vận hành mô hình chính quyền 2 cấp (Cấp Thành phố và Cấp Xã/Phường: Xã Tây Phương, TP. Hà Nội; đã bãi bỏ hoàn toàn cấp quận/huyện).
- Đơn vị trường học chuẩn: Trường THCS Phùng Khắc Khoan, xã Tây Phương, TP. Hà Nội.
- Cơ quan quản lý chuyên môn trực tiếp là Sở GD&ĐT Hà Nội; chính quyền sở tại là UBND Xã Tây Phương, TP. Hà Nội. Không đưa cấp Phòng GD&ĐT huyện vào văn bản.

Nhiệm vụ hàng đầu của bạn là:
1. ĐỌC HIỂU ĐA PHƯƠNG THỨC, NHẬN DIỆN CHỮ VIẾT TAY, CÔNG THỨC TOÁN & HÌNH ẢNH:
- Khi người dùng dán ảnh (Ctrl+V) hoặc đính kèm ảnh bài kiểm tra, bài làm học sinh, đề thi, bảng biểu:
  + Nhận diện chính xác 100% chữ viết tay, công thức toán học, sơ đồ hình vẽ.
  + Chuyển đổi công thức toán sang chuẩn LaTeX $...$ hoặc $$...$$ (như $a \\neq 0$, $\\sqrt{x^2+1}$, $\\frac{-b \\pm \\sqrt{\\Delta}}{2a}$).
  + Hướng dẫn giải chi tiết, rõ ràng từng bước.

2. HƯỚNG DẪN CHI TIẾT CÁCH SỬ DỤNG TẤT CẢ 15 TÍNH NĂNG / TAB CỦA WEB:
- Tab 1: Hồ sơ Lớp học & Cấu hình môn học.
- Tab 2: Tài liệu SGK & Tham chiếu (Quét khoảng trang, OCR đọc hiểu hình ảnh).
- Tab 3: Soạn Kế hoạch Bài dạy Chuẩn CV 5512 / 2345:
  + Bảng 2 cột nghiêm ngặt: Cột 1 là "Hoạt động của GV và HS" (chứa tên 4 hoạt động IN HOA và 4 bước sư phạm **Bước 1/2/3/4:** kèm lời dẫn); Cột 2 là "Dự kiến sản phẩm" (đánh số đề mục tương ứng 1-1 và lời giải chi tiết 100%).
  + Tuyệt đối không tạo bảng 3 cột; không tách "Bước 1" thành cột riêng.
  + Tự động khóa và chuẩn hóa bảng 2 cột cho tất cả các Tiết (Tiết 1, Tiết 2, Tiết 3,...), không bao giờ bị nhảy cột hay xô lệch.
  + Tự động lặp lại tiêu đề bảng ('Repeat Header Rows') ở đầu trang tiếp theo khi bảng kéo dài qua nhiều trang A4.
  + Bảng ký duyệt của Ban Giám hiệu và Tổ chuyên môn được tách riêng độc lập ở cuối bài.
  + Mục "IV. HƯỚNG DẪN VỀ NHÀ" và "V. TỔNG KẾT BÀI HỌC" tự động tách ra khỏi bảng, giữ định dạng văn bản chuẩn 14pt (không bị phóng to thành tiêu đề in hoa xanh).
  + Xuất file Word (.docx) viền nét đơn chuẩn, căn lề A4, không lỗi font.
- Tab 4: Ma trận Đặc tả, Đề kiểm tra & Cấu trúc mới THPT 2025, Tạo đề tương tự từ đề gốc.
- Tab 5: Tài liệu tự học, Audio Diễn cảm & Bóc băng Ghi âm / Giọng nói KHÔNG GIỚI HẠN THỜI LƯỢNG sang Word (.docx):
  + Hỗ trợ thu âm trực tiếp qua Micro hoặc tải file âm thanh dài (.mp3, .m4a, .wav, .aac, .ogg, .webm, .flac) từ 5 phút đến trọn vẹn tiết dạy 45-90 phút.
  + Tự động nhận diện chuẩn xác 100% công thức toán học/ký hiệu khoa học khi đọc (phân số, căn thức, luỹ thừa, góc, tam giác, $a \\neq 0$) sang cú pháp LaTeX chuẩn $...$ và $$...$$, không bị lỗi font khi xuất sang Word.
  + Tự động lọc từ lặp, từ đệm do nói vấp, ngắt câu và giữ nguyên văn phong sư phạm chuẩn mực.
  + 3 chế độ: Bóc băng nguyên văn, Tóm tắt & lập kế hoạch dạy học, Trích xuất hệ thống câu hỏi/bài tập từ lời giảng.
  + Xem trước A4 WYSIWYG và Xuất file Word (.docx) chuyên nghiệp.
- Tab 6: Chấm bài Thị giác AI Vision.
- Tab 7: AI Chatbot Sư phạm Chuyên sâu & Nhận diện chữ viết tay.
- Tab 8: Kế hoạch Giáo dục Nhà trường & Tổ chuyên môn (Phụ lục 1, 2, 3).
- Tab 9: Phòng vẽ Hình học & Sơ đồ Khoa học TikZ AI vector.
- Tab 10: Giới thiệu Hệ thống & Tác giả Thầy Cấn Văn Trường.
- Tab 11: Kho Tài liệu Số & Văn bản chỉ đạo AI / Năng lực số.
- Tab 12: Diễn đàn Sư phạm & Hộp thư Admin 1-1.
- Tab 13: Phòng Thí nghiệm Mô phỏng Khoa học HTML5 Canvas.
- Tab 14: Đối Chiếu & Tổng Hợp Tài Liệu Đa Nguồn.
- Tab 15: Thẩm Định Thể Thức Word & Đổi Tên Hàng Loạt AI (.BAT/ZIP).

3. CÔNG THỨC TOÁN HỌC, LATEX & THỂ THỨC SƯ PHẠM:
- Luôn dùng cú pháp LaTeX $...$ hoặc $$...$$. Kí hiệu không bằng: $a \\neq 0$.
- Ký hiệu tập hợp toán học: Luôn bảo toàn cặp dấu ngoặc nhọn (ví dụ: $L = \\{N; H; A; T; R; A; N; G\\}$, $A = \\{0; 1; 2; 3\\}$), tuyệt đối không để mất dấu mở ngoặc.
- CÁC ĐỀ MỤC LA MÃ & TIẾT DẠY:
  + Tiêu đề "I. MỤC TIÊU", "II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU", "III. TIẾN TRÌNH DẠY HỌC", "IV. HƯỚNG DẪN VỀ NHÀ" phải VIẾT HOA TOÀN BỘ VÀ IN ĐẬM.
  + Tiêu đề Tiết dạy (ví dụ: \`**TIẾT 2: LUYỆN TẬP**\`, \`**TIẾT 1: KHỞI ĐỘNG VÀ HÌNH THÀNH KIẾN THỨC MỚI**\`) phải VIẾT HOA TOÀN BỘ CHỦ ĐỀ VÀ IN ĐẬM.
- MỤC TIÊU RIÊNG CHO TỪNG TIẾT:
  + Dùng gạch đầu dòng và viết hoa chữ 'M' đầu tiên, in đậm: \`- **Mục tiêu riêng Tiết 1 (Lý thuyết):**\`, \`- **Mục tiêu riêng Tiết 2 (Luyện tập & Vận dụng):**\`.
  + Phân cấp nội dung con bên dưới mục tiêu riêng bằng dấu \`+ \` và viết hoa chữ cái đầu (ví dụ: \`  + Nhận biết được...\`).
- TIÊU ĐỀ 4 HOẠT ĐỘNG CHÍNH & CHỮ "LUYỆN TẬP":
  + 4 hoạt động chính trong Kế hoạch bài dạy bắt buộc VIẾT HOA TOÀN BỘ VÀ IN ĐẬM: \`**1. HOẠT ĐỘNG KHỞI ĐỘNG**\`, \`**2. HOẠT ĐỘNG HÌNH THÀNH KIẾN THỨC MỚI**\`, \`**3. HOẠT ĐỘNG LUYỆN TẬP**\`, \`**4. HOẠT ĐỘNG VẬN DỤNG**\`.
  + Sau dấu hai chấm (:), dấu chấm (.), gạch đầu dòng (- ), hoặc đầu đề mục (2. Luyện tập:, Luyện tập 3:), chữ cái đầu tiên hoặc chữ "Luyện tập" BẮT BUỘC VIẾT HOA. Khi nằm giữa câu thông thường thì viết thường theo ngữ cảnh.
- NĂNG LỰC SỐ & NĂNG LỰC AI:
  + Chỉ in đậm duy nhất dòng tiêu đề đề mục chính (ví dụ: \`- **Năng lực số (TT 02/2025/TT-BGDĐT):**\`, \`- **Năng lực AI (QĐ 2422/QĐ-BGDĐT):**\`).
  + TUYỆT ĐỐI KHÔNG IN ĐẬM các dòng nội dung con / mã tiêu chí bên dưới (ví dụ: \`+ 1.1TC1b: Tìm kiếm và xử lý dữ liệu...\`).
- Ô VUÔNG ĐIỀN KHUYẾT:
  + Dạng [ ? ] hoặc [   ], tránh lỗi kí tự hoặc Unicode hỏng.
- TRÁNH DÍNH CHỮ & CHÍNH TẢ TIẾNG VIỆT:
  + Viết cách từ chuẩn xác tiếng Việt, không dính chữ.
  + Chuẩn xác chính tả tiếng Việt: "tủ lạnh" (CẤM TUYỆT ĐỐI viết "tù lạnh"), "tủ sách" (không viết "tù sách"), "sắp xếp" (không viết "sắp sếp" hay "xắp xếp"), "nỗ lực" (không viết "lỗ lực"), "bổ sung" (không viết "bổ xung"), "chia sẻ" (không viết "chia xẻ"), "hướng dẫn" (không viết "hướng dẩn"), "thảo luận" (không viết "thảo luân"), "chắt lọc" (không viết "trắt lọc"), "trau dồi" (không viết "chau dồi"), "cọ xát" (không viết "cọ sát"), "sơ suất" (không viết "sơ xuất"), "xác suất" (không viết "xác xuất"), "xuất hiện" (không viết "suất hiện").
- Tên bài dạy, chủ đề, tiết dạy luôn được căn giữa (Center-aligned), in đậm chuẩn mực khi xuất Word.

4. HÌNH VẼ TIKZ & MÔ PHỎNG:
- TikZ: \`\`\`tikz \\begin{tikzpicture} ... \\end{tikzpicture} \`\`\`.
- Mô phỏng: \`\`\`simulation <!DOCTYPE html> ... \`\`\`.

5. NGUYÊN TẮC SƯ PHẠM KHI CÂU HỎI QUÁ VẮN TẮT HOẶC CHUNG CHUNG:
- Khi Thầy/Cô hỏi câu hỏi chung chung (ví dụ: "vẽ đồ thị hàm số bậc 2 một ẩn", "soạn giáo án", "lập đề kiểm tra", "tư vấn phương pháp",... mà chưa nêu rõ phương trình, bài học, hay khối lớp):
  + BƯỚC 1: Hãy giải đáp hoặc cung cấp ngay 1 VÍ DỤ MINH HỌA MẪU CHUẨN MỰC, ĐẦY ĐỦ & ĐẸP MẮT (các bước, mã TikZ vẽ đồ thị mẫu, hoặc bảng biểu hoàn chỉnh để dùng được ngay).
  + BƯỚC 2: Đồng thời HỎI LẠI LỊCH THIỆP & ĐỊNH HƯỚNG RÕ RÀNG: Gợi ý các thông số cụ thể để Thầy/Cô cung cấp thêm nếu muốn AI hoàn thiện chính xác 100% theo ý định (ví dụ: "Thầy/Cô có muốn em hỗ trợ vẽ hoặc giải với hàm số cụ thể nào khác (như $y = ax^2 + bx + c$), hoặc cho bài học/khối lớp nào không ạ?").

Phong cách trả lời: Thân thiện, tôn trọng, xưng hô "Thầy/Cô", ngôn phong sư phạm chuẩn mực.`;

const QUICK_SUGGESTIONS = [
  { label: '🖼️ Đọc ảnh chữ viết tay & Toán', prompt: 'Hãy hướng dẫn tôi cách chụp ảnh hoặc dán ảnh (Ctrl+V) chữ viết tay và công thức Toán để AI nhận diện và trích xuất.' },
  { label: '📁 Đổi tên hàng loạt thư mục .BAT', prompt: 'Hướng dẫn cách đổi tên hàng loạt thư mục và tệp tin bằng AI và script .BAT tự động ở Tab 15.' },
  { label: '📑 Thẩm định thể thức Word', prompt: 'Cách thẩm định và chuẩn hóa file Word theo Nghị định 30 hoặc tạo Mẫu định dạng riêng ở Tab 15.' },
  { label: '🎙️ Ghi âm & chuyển sang Word', prompt: 'Hướng dẫn cách ghi âm bài giảng không giới hạn và chuyển file âm thanh thành văn bản Word ở Tab 5.' },
  { label: '🎯 Cấu trúc đề THPT 2025', prompt: 'Cách thiết lập đề thi theo Cấu trúc mới THPT Quốc gia 2025 và Tạo đề tương tự từ đề gốc ở Tab 4.' },
  { label: '📐 Vẽ hình TikZ Toán/Lí', prompt: 'Hãy hướng dẫn tôi cách vẽ hình học và sơ đồ TikZ chuẩn xác ở Tab 9.' }
];

export const FloatingAIChatbot: React.FC<FloatingAIChatbotProps> = ({
  apiKeysInput,
  isUnlocked,
  onNavigateTab,
  onOpenLicenseModal,
  onOpenApiGuide,
  onOpenTikzGuide
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMsg, setInputMsg] = useState('');
  const [attachedImages, setAttachedImages] = useState<AttachedImageItem[]>([]);
  const [attachedDocs, setAttachedDocs] = useState<AttachedDocItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatusText, setLoadingStatusText] = useState('AI đang suy nghĩ, phân tích sư phạm và soạn câu trả lời...');
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedLatexId, setCopiedLatexId] = useState<string | null>(null);
  const [exportingWordId, setExportingWordId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'system_guide' | 'pedagogy'>('system_guide');
  const [previewSimHtml, setPreviewSimHtml] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<{ url: string; title: string } | null>(null);
  const [pasteToast, setPasteToast] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Xin chào Quý Thầy/Cô! 👋\n\nTôi là **AI Trợ Lý Hỗ Trợ Toàn Năng** của hệ thống **AI LESSON PLANNER PRO**.\n\nTôi có thể hỗ trợ Thầy/Cô:\n- 🖼️ **Nhận diện chữ viết tay & Đọc ảnh**: Chụp ảnh hoặc bấm **Ctrl + V** để dán ảnh trực tiếp vào đây. AI đọc hiểu chữ viết tay, công thức và hình vẽ!\n- 📐 **Sao chép công thức Toán LaTeX** & Xuất file Word (.docx) trực tiếp\n- 💡 **Hướng dẫn sử dụng chi tiết** 15 Tab tính năng (Soạn giáo án 5512, Đề thi THPT 2025, Thể thức Word, Đổi tên hàng loạt, TikZ, Mô phỏng...)\n- 🎓 **Giải đáp chuyên môn & Sư phạm** theo chuẩn GDPT 2018\n\nThầy/Cô hãy dán ảnh (Ctrl+V), đính kèm tệp hoặc nhập câu hỏi bên dưới nhé!`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      category: 'system_guide'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const baseVoiceMsgRef = useRef<string>('');

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  const showToast = (msg: string) => {
    setPasteToast(msg);
    setTimeout(() => {
      setPasteToast(null);
    }, 3000);
  };

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsReadingFile(true);
    const parsedKeys = apiKeysInput ? apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean) : [];

    let imageCount = 0;
    let docCount = 0;

    for (const file of fileArray) {
      const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|gif|svg)$/i.test(file.name);

      if (isImage) {
        try {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          setAttachedImages(prev => [
            ...prev,
            {
              id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              name: file.name || `Ảnh_dán_${new Date().toLocaleTimeString('vi-VN')}.png`,
              dataUrl,
              size: file.size
            }
          ]);
          imageCount++;
        } catch (err) {
          console.error('Lỗi đọc ảnh:', err);
        }
      } else {
        try {
          const content = await readFileAsText(file, { apiKeys: parsedKeys });
          setAttachedDocs(prev => [
            ...prev,
            {
              id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              name: file.name,
              content: content.slice(0, 25000),
              size: file.size
            }
          ]);
          docCount++;
        } catch (err) {
          console.error('Lỗi đọc tệp văn bản:', err);
        }
      }
    }

    setIsReadingFile(false);

    if (imageCount > 0 && docCount > 0) {
      showToast(`✨ Đã nạp ${imageCount} ảnh & ${docCount} tài liệu!`);
    } else if (imageCount > 0) {
      showToast(`📸 Đã nạp ${imageCount} ảnh. Bấm Gửi để AI đọc hiểu & OCR!`);
    } else if (docCount > 0) {
      showToast(`📄 Đã nạp ${docCount} tài liệu thành công!`);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items || items.length === 0) return;

    const filesToProcess: File[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const blob = item.getAsFile();
        if (blob) {
          const ext = item.type.split('/')[1] || 'png';
          const namedFile = new File([blob], `Ảnh_chụp_${new Date().toLocaleTimeString('vi-VN').replace(/:/g, '-')}.${ext}`, { type: item.type });
          filesToProcess.push(namedFile);
        }
      } else if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          filesToProcess.push(file);
        }
      }
    }

    if (filesToProcess.length > 0) {
      e.preventDefault();
      await processFiles(filesToProcess);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend !== undefined ? textToSend : inputMsg).trim();
    if (!query && attachedImages.length === 0 && attachedDocs.length === 0) return;
    if (isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query || (attachedImages.length > 0 ? 'Phân tích hình ảnh, đọc chữ viết tay và trích xuất công thức' : 'Phân tích tài liệu đính kèm'),
      attachedImages: attachedImages.map(img => ({ name: img.name, dataUrl: img.dataUrl })),
      attachedDocs: attachedDocs.map(d => ({ name: d.name, size: d.size })),
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      category: activeMode
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMsg('');
    setIsLoading(true);

    const currentImages = [...attachedImages];
    const currentDocs = [...attachedDocs];

    if (currentImages.length > 0) {
      setLoadingStatusText('📸 Trợ lý AI đang phân tích hình ảnh, đọc chữ viết tay & công thức...');
    } else if (currentDocs.length > 0) {
      setLoadingStatusText('📄 Trợ lý AI đang đọc hiểu tài liệu đính kèm & phân tích dữ liệu...');
    } else {
      setLoadingStatusText('✨ Trợ lý AI đang suy nghĩ, phân tích sư phạm và soạn câu trả lời...');
    }

    setAttachedImages([]);
    setAttachedDocs([]);

    try {
      let promptContext = query;

      if (currentImages.length > 0) {
        promptContext = `[YÊU CẦU: PHÂN TÍCH HÌNH ẢNH / CHỮ VIẾT TAY / CÔNG THỨC TOÁN HỌC]\n` +
          (promptContext ? `Yêu cầu từ người dùng: ${promptContext}\n\n` : `Hãy phân tích chi tiết hình ảnh đính kèm:\n`) +
          `1. Đọc CHÍNH XÁC chữ viết tay, đề bài và số liệu.\n` +
          `2. Chuyển đổi toàn bộ các công thức toán sang chuẩn LaTeX $...$ hoặc $$...$$ ($a \\neq 0$).\n` +
          `3. Cung cấp lời giải sư phạm chi tiết và chuẩn mực.`;
      }

      if (currentDocs.length > 0) {
        promptContext += '\n\n--- DỮ LIỆU TÀI LIỆU ĐÍNH KÈM ---\n' + currentDocs.map(f => `Tệp [${f.name}]:\n${f.content}`).join('\n\n');
      }

      const modePrompt = activeMode === 'system_guide'
        ? `[CHẾ ĐỘ: HƯỚNG DẪN SỬ DỤNG WEB AI LESSON PLANNER PRO]\n${promptContext}`
        : `[CHẾ ĐỘ: TƯ VẤN SƯ PHẠM & TOÁN HỌC ĐA PHƯƠNG THỨC]\n${promptContext}`;

      const history = messages
        .filter(m => m.id !== 'welcome' && !m.text.startsWith('⚠️'))
        .slice(-10)
        .map(m => ({
          role: m.sender === 'user' ? ('user' as const) : ('model' as const),
          parts: [{ text: m.text }]
        }));

      const response = await generateGeminiChat({
        message: modePrompt,
        systemInstruction: SYSTEM_INSTRUCTION_GUIDE,
        apiKeys: apiKeysInput,
        history,
        images: currentImages.map(img => img.dataUrl)
      });

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: response || 'Hệ thống đã nhận câu hỏi của Thầy/Cô. Vui lòng thử lại với câu hỏi cụ thể hơn nhé!',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        category: activeMode
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `⚠️ Đã xảy ra lỗi khi xử lý: ${err?.message || 'Vui lòng kiểm tra lại kết nối mạng hoặc API Key'}. Thầy/Cô có thể liên hệ Thầy Cấn Văn Trường (0988.302.636) để được trợ giúp ngay!`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        category: activeMode
      };
      setMessages(prev => [...prev, errorMessage]);
      if (err?.message?.includes('Hạn ngạch') || err?.message?.includes('429')) {
        onOpenApiGuide?.();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    showToast('📋 Đã sao chép nội dung!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyLatex = (msgId: string, text: string) => {
    const formulas: string[] = [];
    const mathRegex = /\$\$([\s\S]*?)\$\$|\$([^\$\n]+)\$/g;
    let match;
    while ((match = mathRegex.exec(text)) !== null) {
      const formula = (match[1] || match[2] || '').trim();
      if (formula && !formulas.includes(formula)) {
        formulas.push(formula);
      }
    }

    if (formulas.length > 0) {
      navigator.clipboard.writeText(formulas.join('\n\n'));
      setCopiedLatexId(msgId);
      showToast('📐 Đã chép công thức! Trong Word, bấm Alt + = rồi dán (Ctrl+V) nhé.');
      setTimeout(() => setCopiedLatexId(null), 3000);
    } else {
      handleCopyText(msgId, text);
    }
  };

  const handleExportWord = async (msgId: string, text: string) => {
    try {
      setExportingWordId(msgId);
      await exportMarkdownToWord(text, {
        fileName: `Tro_Ly_AI_Phan_Tich_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '_')}.docx`,
        headerText: `AI LESSON PLANNER PRO - TRỢ LÝ SƯ PHẠM TOÀN NĂNG`,
        footerText: `Tài liệu hướng dẫn & giải đáp chuyên môn`
      });
      showToast('📥 Đã xuất file Word (.docx) thành công!');
    } catch (err: any) {
      console.error(err);
      showToast('⚠️ Lỗi xuất Word: ' + (err?.message || String(err)));
    } finally {
      setExportingWordId(null);
    }
  };

  return (
    <>
      {/* Toast Notification Banner */}
      {pasteToast && (
        <div className="fixed top-20 right-5 z-50 bg-cyan-900/95 text-cyan-100 border border-cyan-400 px-3.5 py-2.5 rounded-xl shadow-2xl backdrop-blur flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{pasteToast}</span>
        </div>
      )}

      {/* FLOATING TRIGGER BUTTON */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 group select-none">
          <div className="bg-slate-900/90 text-cyan-300 text-[11px] font-bold px-3 py-1 rounded-full shadow-lg border border-cyan-500/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 flex items-center gap-1.5 pointer-events-none">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span>Trợ lý AI Hỗ trợ 15 Tab & Nhận diện Chữ viết tay (Ctrl+V)</span>
          </div>

          <button
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 text-white shadow-2xl hover:shadow-cyan-500/50 transform hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white/20 cursor-pointer"
            aria-label="Mở Trợ lý AI"
          >
            <Bot className="w-7 h-7 animate-bounce-subtle" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[9px] font-bold text-white items-center justify-center">
                AI
              </span>
            </span>
          </button>
        </div>
      )}

      {/* CHATBOT WINDOW */}
      {isOpen && (
        <div
          onPaste={handlePaste}
          onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDraggingOver(false); }}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDraggingOver(false);
            if (e.dataTransfer.files) await processFiles(e.dataTransfer.files);
          }}
          className={`fixed z-50 flex flex-col bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 ${
            isMinimized
              ? 'bottom-6 right-6 w-72 h-14'
              : isExpanded
              ? 'inset-4 sm:inset-10 w-auto h-auto'
              : 'bottom-6 right-6 w-[94vw] sm:w-[460px] h-[580px] max-h-[88vh]'
          }`}
        >
          {/* HEADER */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-md border border-cyan-400/40">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-wide">Trợ Lý AI Toàn Năng</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                    Multimodal
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Nhận diện chữ viết tay & Đọc ảnh (Ctrl+V)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title={isExpanded ? 'Thu nhỏ cửa sổ' : 'Phóng to toàn màn hình'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title={isMinimized ? 'Mở rộng' : 'Thu nhỏ thanh dock'}
              >
                <ChevronDown className={`w-4 h-4 transform transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Đóng cửa sổ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* MODE SELECTOR */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/60 border-b border-slate-800/80 text-[11px] shrink-0">
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setActiveMode('system_guide')}
                    className={`px-2 py-0.5 rounded-md font-medium flex items-center gap-1 transition-all cursor-pointer ${
                      activeMode === 'system_guide'
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Compass className="w-3 h-3" />
                    <span>Hướng dẫn 15 Tab</span>
                  </button>
                  <button
                    onClick={() => setActiveMode('pedagogy')}
                    className={`px-2 py-0.5 rounded-md font-medium flex items-center gap-1 transition-all cursor-pointer ${
                      activeMode === 'pedagogy'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <GraduationCap className="w-3 h-3" />
                    <span>Sư phạm & Toán học</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setMessages([
                      {
                        id: 'welcome_reset',
                        sender: 'ai',
                        text: `Đã làm mới cuộc hội thoại! Thầy/Cô có thể dán ảnh từ clipboard (Ctrl+V) hoặc nhập câu hỏi mới nhé.`,
                        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                        category: activeMode
                      }
                    ]);
                    setAttachedImages([]);
                    setAttachedDocs([]);
                  }}
                  className="text-slate-400 hover:text-cyan-300 text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                  title="Làm mới cuộc trò chuyện"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Xóa đoạn chat</span>
                </button>
              </div>

              {/* QUICK SUGGESTIONS CAROUSEL */}
              <div className="px-3 py-1.5 bg-slate-950/40 border-b border-slate-800/60 overflow-x-auto flex items-center gap-1.5 text-[10px] shrink-0 no-scrollbar">
                <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0">
                  <Lightbulb className="w-3 h-3 text-amber-400" /> Gợi ý:
                </span>
                {QUICK_SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.prompt)}
                    className="px-2 py-0.5 rounded-full bg-slate-800/80 hover:bg-cyan-950 text-cyan-300 hover:text-cyan-200 border border-slate-700/60 hover:border-cyan-500/50 shrink-0 cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* MESSAGES VIEW */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs bg-gradient-to-b from-slate-950/50 to-slate-900/50 select-text">
                {isDraggingOver && (
                  <div className="p-4 bg-cyan-950/80 border-2 border-dashed border-cyan-400 rounded-xl text-center text-cyan-200 font-bold text-xs flex flex-col items-center justify-center gap-1.5">
                    <ImageIcon className="w-6 h-6 animate-bounce text-cyan-300" />
                    <span>Thả ảnh chụp hoặc tệp văn bản vào đây</span>
                  </div>
                )}

                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5 shadow-sm border border-cyan-400/40">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-2xl p-3 shadow-md space-y-1.5 ${
                          isUser
                            ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-tr-none'
                            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                        }`}
                      >
                        {/* Attached Images preview in message */}
                        {msg.attachedImages && msg.attachedImages.length > 0 && (
                          <div className="mb-2 pb-1.5 border-b border-cyan-400/30">
                            <div className="text-[10px] text-cyan-200 font-semibold mb-1 flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              <span>Hình ảnh ({msg.attachedImages.length}):</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.attachedImages.map((img, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => setPreviewImageUrl({ url: img.dataUrl, title: img.name })}
                                  className="w-14 h-14 rounded-lg overflow-hidden border border-white/20 bg-slate-950 cursor-pointer shadow hover:border-cyan-300 transition-all"
                                  title="Bấm để xem ảnh phóng to"
                                >
                                  <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Attached Docs preview in message */}
                        {msg.attachedDocs && msg.attachedDocs.length > 0 && (
                          <div className="mb-1.5 pb-1 border-b border-cyan-400/30 flex flex-wrap gap-1">
                            {msg.attachedDocs.map((doc, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-slate-950/60 text-cyan-200 text-[10px] border border-cyan-400/40 flex items-center gap-1 font-mono"
                              >
                                <Paperclip className="w-2.5 h-2.5" />
                                <span>{doc.name}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {isUser ? (
                          <p className="whitespace-pre-wrap leading-relaxed text-xs">{msg.text}</p>
                        ) : (
                          <div className="prose prose-invert prose-xs max-w-none text-xs space-y-1.5 leading-relaxed overflow-x-auto select-text">
                            <ReactMarkdown
                              remarkPlugins={[remarkMath, remarkGfm]}
                              rehypePlugins={[rehypeKatex, rehypeRaw]}
                              components={{
                                pre: ({ children }) => <>{children}</>,
                                code: ({ node, className, children, ...props }: any) => {
                                  const match = /language-(\w+)/.exec(className || '');
                                  const lang = match ? match[1].toLowerCase() : '';
                                  const rawCode = String(children).replace(/\n$/, '');
                                  const isCodeBlock = Boolean(match || rawCode.includes('\n'));

                                  if (isCodeBlock && (lang === 'tikz' || (lang === 'latex' && rawCode.includes('\\begin{tikzpicture}')))) {
                                    return (
                                      <div className="my-2">
                                        <TikZVisualizer tikzCode={rawCode} apiKeysInput={apiKeysInput} />
                                      </div>
                                    );
                                  }

                                  if (isCodeBlock && (lang === 'simulation' || (lang === 'html' && rawCode.includes('<canvas') && rawCode.includes('<script>')))) {
                                    return (
                                      <div className="my-2.5 rounded-xl border border-emerald-500/40 bg-slate-950 p-2 overflow-hidden shadow-lg">
                                        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-[11px] text-emerald-300 font-bold">
                                          <span className="flex items-center gap-1">
                                            <Atom className="w-3.5 h-3.5 text-emerald-400" />
                                            Mô phỏng Khoa học Tương tác
                                          </span>
                                          <button
                                            onClick={() => setPreviewSimHtml(rawCode)}
                                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                          >
                                            <Play className="w-2.5 h-2.5" /> Chạy toàn màn hình
                                          </button>
                                        </div>
                                        <iframe
                                          srcDoc={rawCode}
                                          title="Simulation Preview"
                                          className="w-full h-64 rounded-lg border border-slate-800 bg-slate-950"
                                          sandbox="allow-scripts"
                                        />
                                      </div>
                                    );
                                  }

                                  if (isCodeBlock) {
                                    return (
                                      <pre className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono overflow-x-auto text-cyan-300 my-1.5">
                                        <code>{rawCode}</code>
                                      </pre>
                                    );
                                  }

                                  return (
                                    <code className="px-1 py-0.5 bg-slate-800 text-cyan-300 rounded font-mono text-[11px]">
                                      {children}
                                    </code>
                                  );
                                },
                                table: ({ children }) => (
                                  <div className="overflow-x-auto my-2 rounded-lg border border-slate-700">
                                    <table className="w-full border-collapse text-left text-[11px]">{children}</table>
                                  </div>
                                ),
                                th: ({ children }) => (
                                  <th className="border border-slate-700 bg-slate-800 px-2 py-1 font-bold text-cyan-300">{children}</th>
                                ),
                                td: ({ children }) => (
                                  <td className="border border-slate-800 px-2 py-1 text-slate-200">{children}</td>
                                ),
                                p: ({ children }) => <div className="mb-1.5 leading-relaxed">{children}</div>,
                                ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-1">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-1">{children}</ol>,
                                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                                strong: ({ children }) => <strong className="font-bold text-cyan-200">{children}</strong>
                              }}
                            >
                              {msg.text}
                            </ReactMarkdown>
                          </div>
                        )}

                        <div className={`flex items-center justify-between gap-2 text-[10px] pt-1.5 border-t flex-wrap ${
                          isUser ? 'border-cyan-400/30 text-cyan-100' : 'border-slate-800 text-slate-400'
                        }`}>
                          <span>{msg.timestamp}</span>

                          {!isUser && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Copy Math LaTeX */}
                              <button
                                onClick={() => handleCopyLatex(msg.id, msg.text)}
                                className="hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors px-1 py-0.5 rounded hover:bg-slate-800"
                                title="Sao chép công thức Toán LaTeX (Alt + = trong Word)"
                              >
                                <Calculator className="w-3 h-3 text-amber-400" />
                                <span>{copiedLatexId === msg.id ? 'Đã chép LaTeX' : 'Sao chép LaTeX'}</span>
                              </button>

                              {/* Export Word */}
                              <button
                                onClick={() => handleExportWord(msg.id, msg.text)}
                                disabled={exportingWordId === msg.id}
                                className="hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors px-1 py-0.5 rounded hover:bg-slate-800 disabled:opacity-50"
                                title="Tải file Word (.docx) chứa nội dung & công thức chuẩn"
                              >
                                <Download className="w-3 h-3 text-emerald-400" />
                                <span>{exportingWordId === msg.id ? 'Đang xuất...' : 'Xuất Word'}</span>
                              </button>

                              {/* Copy Plain Text */}
                              <button
                                onClick={() => handleCopyText(msg.id, msg.text)}
                                className="hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors px-1 py-0.5 rounded hover:bg-slate-800"
                                title="Sao chép toàn bộ nội dung"
                              >
                                {copiedId === msg.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400">Đã chép</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Sao chép</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {isUser && (
                        <div className="w-6 h-6 rounded-full bg-slate-800 text-cyan-300 border border-cyan-600/40 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex gap-2.5 justify-start items-center text-xs text-slate-400 animate-pulse bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 w-fit">
                    <div className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center shrink-0 text-[10px]">
                      <Bot className="w-3 h-3 animate-spin" />
                    </div>
                    <span>{loadingStatusText}</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* ATTACHMENT STRIP (Above Input) */}
              {(attachedImages.length > 0 || attachedDocs.length > 0 || isReadingFile) && (
                <div className="px-3 py-2 bg-slate-950/90 border-t border-cyan-600/40 shrink-0 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-cyan-300">
                    <span className="flex items-center gap-1">
                      <Paperclip className="w-3 h-3 text-cyan-400" />
                      Tệp & Ảnh ({attachedImages.length + attachedDocs.length}):
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Dán ảnh (Ctrl+V) hoặc bấm Gửi</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {attachedImages.map(img => (
                      <div
                        key={img.id}
                        className="bg-slate-900 border border-slate-700 hover:border-cyan-400 rounded-lg p-1 flex items-center gap-1.5 text-[10px]"
                      >
                        <div
                          onClick={() => setPreviewImageUrl({ url: img.dataUrl, title: img.name })}
                          className="w-7 h-7 rounded overflow-hidden bg-slate-950 shrink-0 cursor-pointer"
                        >
                          <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-slate-200 truncate max-w-[90px]">{img.name}</span>
                        <button
                          onClick={() => setAttachedImages(prev => prev.filter(i => i.id !== img.id))}
                          className="p-0.5 text-slate-400 hover:text-rose-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {attachedDocs.map(doc => (
                      <div
                        key={doc.id}
                        className="bg-slate-900 border border-slate-700 hover:border-cyan-400 rounded-lg p-1.5 flex items-center gap-1.5 text-[10px]"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="text-slate-200 truncate max-w-[100px]">{doc.name}</span>
                        <button
                          onClick={() => setAttachedDocs(prev => prev.filter(d => d.id !== doc.id))}
                          className="p-0.5 text-slate-400 hover:text-rose-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {isReadingFile && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-300 bg-slate-900 px-2 py-1 rounded border border-amber-500/40 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Đang nạp tệp...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* INPUT FORM */}
              <div className="p-2.5 bg-slate-900 border-t border-slate-800 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-end gap-1.5"
                >
                  {/* File Upload Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 border border-slate-800 transition-colors cursor-pointer shrink-0"
                    title="Đính kèm ảnh/chữ viết tay hoặc tệp PDF/Word/Excel (hoặc bấm Ctrl+V để dán trực tiếp)"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.md"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        processFiles(e.target.files);
                        e.target.value = '';
                      }
                    }}
                    className="hidden"
                  />

                  {/* Textarea Input */}
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={
                      activeMode === 'system_guide'
                        ? 'Hỏi cách dùng 15 Tab hoặc dán ảnh (Ctrl+V)...'
                        : 'Hỏi sư phạm, công thức toán hoặc dán ảnh (Ctrl+V)...'
                    }
                    disabled={isLoading}
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors resize-none max-h-24 leading-relaxed"
                  />

                  {/* Voice Mic Button */}
                  <VoiceMicButton
                    onListeningChange={(listening) => {
                      if (listening) {
                        baseVoiceMsgRef.current = inputMsg;
                      }
                    }}
                    onLiveText={(liveText, isFinal) => {
                      const prefix = baseVoiceMsgRef.current.trim();
                      const combined = prefix ? `${prefix} ${liveText}` : liveText;
                      setInputMsg(combined);
                      if (isFinal) {
                        baseVoiceMsgRef.current = combined;
                      }
                    }}
                    onTranscript={() => {}}
                    buttonTitle="Nói câu hỏi cho Trợ lý AI"
                    size="sm"
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={(!inputMsg.trim() && attachedImages.length === 0 && attachedDocs.length === 0) || isLoading}
                    className="p-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-cyan-500/30 transition-all shrink-0 cursor-pointer active:scale-95"
                    title="Gửi câu hỏi (Enter)"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* QUICK NAVIGATION SHORTCUTS */}
                <div className="mt-1.5 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>Phím tắt:</span>
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab(3)}
                        className="hover:text-cyan-300 underline cursor-pointer"
                      >
                        Tab 3 (5512)
                      </button>
                    )}
                    <span>•</span>
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab(4)}
                        className="hover:text-cyan-300 underline cursor-pointer"
                      >
                        Tab 4 (Đề thi)
                      </button>
                    )}
                    <span>•</span>
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab(9)}
                        className="hover:text-cyan-300 underline cursor-pointer"
                      >
                        Tab 9 (TikZ)
                      </button>
                    )}
                    <span>•</span>
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab(13)}
                        className="hover:text-emerald-300 underline cursor-pointer"
                      >
                        Tab 13 (Mô phỏng)
                      </button>
                    )}
                  </div>

                  {onOpenLicenseModal && (
                    <button
                      type="button"
                      onClick={onOpenLicenseModal}
                      className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Shield className="w-3 h-3" />
                      <span>Bản quyền VIP</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* FULL IMAGE PREVIEW MODAL */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                <ImageIcon className="w-4 h-4" />
                <span className="truncate">{previewImageUrl.title}</span>
              </div>
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 p-3 overflow-auto flex items-center justify-center bg-slate-950">
              <img
                src={previewImageUrl.url}
                alt={previewImageUrl.title}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow"
              />
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN SIMULATION MODAL */}
      {previewSimHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Atom className="w-5 h-5 animate-spin-slow" />
                <span>MÔ PHỎNG KHOA HỌC TƯƠNG TÁC HTML5</span>
              </div>
              <button
                onClick={() => setPreviewSimHtml(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 p-2 bg-slate-950">
              <iframe
                srcDoc={previewSimHtml}
                title="Simulation Modal"
                className="w-full h-full rounded-xl border border-slate-800 bg-slate-950"
                sandbox="allow-scripts"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
