import React, { useState, useRef, useEffect } from 'react';
import { generateGeminiChat } from '../../lib/geminiApi';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Bot,
  User,
  Sparkles,
  Trash2,
  Download,
  Copy,
  Check,
  Maximize2,
  X,
  RefreshCw,
  Atom,
  Play,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  FileQuestion,
  Calculator,
  Eye,
  Info,
  CheckCircle2,
  FileCode
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { TikZVisualizer } from '../TikZVisualizer';
import { VoiceMicButton } from '../VoiceMicButton';
import { readFileAsText } from '../../lib/fileUtils';
import { exportMarkdownToWord } from '../../lib/wordExport';

interface Tab7AIChatbotProps {
  apiKeysInput: string;
  monHoc: string;
  lop: string;
  onOpenApiGuide: () => void;
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
  sender: 'user' | 'ai';
  text: string;
  attachedImages?: { name: string; dataUrl: string }[];
  attachedDocs?: { name: string; size: number }[];
  timestamp: string;
}

export const Tab7AIChatbot: React.FC<Tab7AIChatbotProps> = ({
  apiKeysInput,
  monHoc,
  lop,
  onOpenApiGuide
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `🤖 **Trợ lý AI Sư phạm, Nhận diện Chữ Viết Tay, Công Thức Toán & Đa Phương Thức xin chào quý Thầy/Cô!**\n\nEm hỗ trợ giải đáp, tư vấn sư phạm và xử lý hình ảnh cho **TẤT CẢ CÁC BẬC HỌC (Tiểu học - THCS - THPT) và TẤT CẢ CÁC MÔN HỌC**:\n\n- 🖼️ **Nhận diện chữ viết tay & Hình ảnh bài tập**: Chụp ảnh hoặc chụp màn hình rồi bấm **Ctrl + V** để dán ảnh trực tiếp vào đây. AI sẽ đọc hiểu toàn bộ chữ viết tay, công thức toán, sơ đồ hình vẽ và giải chi tiết.\n- 📐 **Công thức Toán học chuẩn LaTeX**: Nhận diện và chuyển công thức sang $...$ hoặc $$...$$. Thầy/Cô có thể bấm **"Sao chép LaTeX"** để dán vào Word (bấm \`Alt + =\` rồi Ctrl+V) hoặc bấm **"Xuất Word (.docx)"** để tải trực tiếp file Word có công thức toán chuẩn.\n- 📎 **Đính kèm tài liệu đa định dạng**: Hỗ trợ tải tệp Word (.docx), PDF, Excel (.xlsx), PowerPoint (.pptx), TXT hoặc ảnh chụp bài giảng.\n- 🎨 **Tiện ích chuyên sâu**: Vẽ đồ thị / hình học TikZ vector trực quan ($a \\neq 0$), mô phỏng thí nghiệm tương tác HTML5 Canvas, giáo án chuẩn CV 5512 / 2345.\n\n*Thầy/Cô có thể dán ảnh từ clipboard (Ctrl+V), chọn tệp đính kèm hoặc nhập câu hỏi bên dưới!*`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [attachedImages, setAttachedImages] = useState<AttachedImageItem[]>([]);
  const [attachedDocs, setAttachedDocs] = useState<AttachedDocItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatusText, setLoadingStatusText] = useState('✨ Trợ lý AI đang suy nghĩ, phân tích sư phạm và soạn câu trả lời...');
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedLatexId, setCopiedLatexId] = useState<string | null>(null);
  const [exportingWordId, setExportingWordId] = useState<string | null>(null);
  const [previewSimHtml, setPreviewSimHtml] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<{ url: string; title: string } | null>(null);
  const [pasteToast, setPasteToast] = useState<string | null>(null);

  const baseVoiceMsgRef = useRef<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const showToast = (msg: string) => {
    setPasteToast(msg);
    setTimeout(() => {
      setPasteToast(null);
    }, 3000);
  };

  const quickPrompts = [
    `🖼️ Đọc hiểu ảnh chữ viết tay & trích xuất công thức Toán học sang LaTeX`,
    `📋 Soạn Kế hoạch bài dạy chuẩn CV 5512 (Bảng 2 cột nghiêm ngặt, không nhảy cột)`,
    `📁 Hướng dẫn đổi tên hàng loạt thư mục/file bằng AI & Script .BAT (Tab 15)`,
    `📑 Thẩm định thể thức Word theo Nghị định 30 & tạo Mẫu riêng (Tab 15)`,
    `💡 Hướng dẫn tính năng mới: Bóc băng Audio không giới hạn ra Word & Đề THPT 2025`,
    `Gợi ý 3 Trò chơi Khởi động sinh động cho bài học môn ${monHoc}`,
    `Tư vấn phương pháp dạy học phân hóa & Hoạt động trải nghiệm / STEM`,
    `Vẽ đồ thị hàm số / hình vẽ TikZ véc-tơ chuẩn đẹp cho môn ${monHoc}`
  ];

  // Process incoming raw files (from FileInput, Drag-and-Drop, or Clipboard)
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
        // Documents: PDF, Word, Excel, TXT, MD, etc.
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
      showToast(`✨ Đã nạp thành công ${imageCount} hình ảnh và ${docCount} tài liệu!`);
    } else if (imageCount > 0) {
      showToast(`📸 Đã nạp ${imageCount} hình ảnh. Thầy/Cô có thể bấm Gửi để AI phân tích OCR & công thức!`);
    } else if (docCount > 0) {
      showToast(`📄 Đã nạp ${docCount} tài liệu văn bản thành công!`);
    }
  };

  // Clipboard Paste Handler (Ctrl + V)
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
          const namedFile = new File([blob], `Ảnh_chụp_màn_hình_${new Date().toLocaleTimeString('vi-VN').replace(/:/g, '-')}.${ext}`, { type: item.type });
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const preprocessChatMarkdown = (text: string): string => {
    if (!text) return '';
    let cleaned = text;

    // Use function replacers to avoid JS string replacement $$ escape bug
    cleaned = cleaned.replace(/(?<!\$)\b([a-zA-Z0-9_\(\)]+)\s*\\ne(?:q)?\s*([a-zA-Z0-9_\(\)]+)\b(?!\$)/g, (_m, g1, g2) => ` $${g1} \\neq ${g2}$ `);
    cleaned = cleaned.replace(/(?<!\$)\\ne(?:q)?\b(?!\$)/g, ' $\\neq$ ');
    cleaned = cleaned.replace(/(?<!\$)\b([a-zA-Z0-9_\(\)]+)\s*(?:\/=|!=)\s*([a-zA-Z0-9_\(\)]+)\b(?!\$)/g, (_m, g1, g2) => ` $${g1} \\neq ${g2}$ `);
    cleaned = cleaned.replace(/(?<!\$)≠(?!\$)/g, ' $\\neq$ ');
    cleaned = cleaned.replace(/(?<!\$)≤(?!\$)/g, ' $\\le$ ');
    cleaned = cleaned.replace(/(?<!\$)≥(?!\$)/g, ' $\\ge$ ');
    cleaned = cleaned.replace(/(?<!\$)±(?!\$)/g, ' $\\pm$ ');

    // Normalize markdown tables
    cleaned = cleaned.replace(/(\|\s*[^|\n]+\s*\|)\s+(\|(?:\s*:?-+:?\s*\|)+)/g, '$1\n$2');
    cleaned = cleaned.replace(/(\|(?:\s*:?-+:?\s*\|)+)\s+(\|\s*[^|\n]+\s*\|)/g, '$1\n$2');
    cleaned = cleaned.replace(/(\|\s*[^|\n]+\s*\|)\s+(\|\s*[^|\n]+\s*\|)/g, (match, p1, p2) => {
      if (match.includes('|---|') || match.includes('| --- |')) return match;
      return `${p1}\n${p2}`;
    });

    return cleaned;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const rawText = (textToSend !== undefined ? textToSend : inputMessage).trim();
    if (!rawText && attachedImages.length === 0 && attachedDocs.length === 0) return;

    const apiKeys = apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: rawText || (attachedImages.length > 0 ? 'Phân tích hình ảnh, đọc chữ viết tay và trích xuất công thức toán học' : 'Phân tích tài liệu đính kèm'),
      attachedImages: attachedImages.map(img => ({ name: img.name, dataUrl: img.dataUrl })),
      attachedDocs: attachedDocs.map(d => ({ name: d.name, size: d.size })),
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
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

    // Clear attachments after queuing
    setAttachedImages([]);
    setAttachedDocs([]);

    let promptContext = rawText;

    if (currentImages.length > 0) {
      promptContext = `[YÊU CẦU: PHÂN TÍCH HÌNH ẢNH / CHỮ VIẾT TAY / CÔNG THỨC TOÁN HỌC & ĐỒ THỊ]\n` +
        (promptContext ? `Yêu cầu từ người dùng: ${promptContext}\n\n` : `Hãy đọc hiểu và phân tích chi tiết toàn diện hình ảnh đính kèm:\n`) +
        `1. Nhận diện CHÍNH XÁC 100% chữ viết tay, văn bản tiếng Việt, số liệu và đề bài.\n` +
        `2. Chuyển đổi toàn bộ các công thức toán học, lý, hóa sang cú pháp chuẩn LaTeX $...$ hoặc $$...$$ (ví dụ: $x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$, $a \\neq 0$, $\\sqrt{x^2+1}$).\n` +
        `3. Nếu là hình học hoặc đồ thị: Mô tả rõ các đỉnh, góc, quan hệ vuông góc/song song và cung cấp lời giải hoặc vẽ lại bằng mã TikZ nếu cần.\n` +
        `4. Trình bày lời giải sư phạm chi tiết, dễ hiểu, từng bước rõ ràng.`;
    }

    if (currentDocs.length > 0) {
      promptContext += '\n\n--- DỮ LIỆU TÀI LIỆU ĐÍNH KÈM ---\n' + currentDocs.map(f => `Tệp [${f.name}]:\n${f.content}`).join('\n\n');
    }

    const systemInstruction = `Bạn là Trợ lý AI Chuyên gia Sư phạm, Thị giác Máy tính & Trí tuệ Toàn năng (Hệ thống AI LESSON PLANNER PRO - Tác giả Thầy Cấn Văn Trường, Trường THCS Phùng Khắc Khoan, xã Tây Phương, TP. Hà Nội, Hotline/Zalo: 0988.302.636).

LƯU Ý ĐẶC BIỆT VỀ ĐƠN VỊ HÀNH CHÍNH & MÔ HÌNH CHÍNH QUYỀN 2 CẤP (TP HÀ NỘI):
- Tuyệt đối KHÔNG sử dụng cấp "huyện Thạch Thất" hoặc "Phòng GD&ĐT huyện Thạch Thất" vì TP Hà Nội đã chuyển sang mô hình chính quyền 2 cấp (Cấp Thành phố và Cấp Xã/Phường: Xã Tây Phương, TP. Hà Nội; đã bãi bỏ cấp quận/huyện).
- Đơn vị trường học: Trường THCS Phùng Khắc Khoan, xã Tây Phương, TP. Hà Nội.
- Cơ quan chỉ đạo chuyên môn trực tiếp là Sở GD&ĐT Hà Nội; cơ quan quản lý nhà nước sở tại là UBND Xã Tây Phương, TP. Hà Nội. Không đưa cấp Phòng GD&ĐT huyện vào bất kỳ mẫu giáo án, kế hoạch, quyết định hay văn bản nào.

BẠN CÓ CÁC NHIỆM VỤ CỐT LÕI:
1. ĐỌC HIỂU ĐA PHƯƠNG THỨC (MULTIMODAL AI) & NHẬN DIỆN CHỮ VIẾT TAY, CÔNG THỨC TOÁN:
- Khi người dùng gửi ảnh chụp bài kiểm tra, bài làm học sinh, chữ viết tay, sách giáo khoa hoặc đề thi:
  + Đọc chuẩn xác từng câu chữ, dấu chấm, dấu phẩy, chữ viết xấu hoặc bị mờ.
  + Đưa toàn bộ công thức toán học về chuẩn LaTeX $...$ hoặc $$...$$. Tuyệt đối không dùng ký hiệu Unicode gây lỗi font mà dùng LaTeX chuẩn (như $a \\neq 0$, $\\dfrac{a}{b}$, $\\sqrt{x}$, $\\pm$, $\\le$, $\\ge$).
  + Hướng dẫn giải chi tiết, chuẩn mực sư phạm.

2. HƯỚNG DẪN CHI TIẾT SỬ DỤNG TẤT CẢ 15 TAB CỦA WEB:
- Tab 1: Hồ sơ Lớp học & Cấu hình môn học.
- Tab 2: Nạp SGK & Tài liệu (Quét chọn trang PDF, Word, Ảnh OCR, xoay vòng 4 tầng API Key).
- Tab 3: Soạn Kế hoạch Bài dạy Chuẩn CV 5512 / 2345:
  + Bảng 2 cột nghiêm ngặt: Cột 1 là "Hoạt động của GV và HS" (chứa tên 4 hoạt động IN HOA và 4 bước sư phạm **Bước 1/2/3/4:** kèm lời dẫn); Cột 2 là "Dự kiến sản phẩm" (đánh số đề mục tương ứng 1-1 và lời giải chi tiết 100%).
  + Tuyệt đối không tạo bảng 3 cột; không tách "Bước 1" thành cột riêng.
  + Tự động khóa và chuẩn hóa bảng 2 cột cho tất cả các Tiết (Tiết 1, Tiết 2, Tiết 3,...), không bao giờ bị nhảy cột hay xô lệch.
  + Tự động lặp lại tiêu đề bảng ('Repeat Header Rows') ở đầu trang tiếp theo khi bảng kéo dài qua nhiều trang A4.
  + Bảng ký duyệt của Ban Giám hiệu và Tổ chuyên môn được tách riêng độc lập ở cuối bài.
  + Mục "IV. HƯỚNG DẪN VỀ NHÀ" và "V. TỔNG KẾT BÀI HỌC" tự động tách ra khỏi bảng, giữ định dạng văn bản chuẩn 14pt (không bị phóng to thành tiêu đề in hoa xanh).
  + Xuất file Word (.docx) viền nét đơn chuẩn, căn lề A4, không lỗi font.
- Tab 4: Thiết kế Ma trận, Bảng đặc tả, Đề thi & Tạo đề tương tự (Cấu trúc mới THPT 2025).
- Tab 5: Tài liệu tự học, Audio Diễn cảm & Bóc băng Ghi âm / Giọng nói KHÔNG GIỚI HẠN THỜI LƯỢNG sang Word (.docx):
  + Thu âm Micro hoặc tải file ghi âm (.mp3, .m4a, .wav...) từ ngắn đến dài (cả tiết dạy 45-90 phút).
  + Nhận diện chuẩn xác 100% công thức toán học và ký hiệu khoa học khi đọc (phân số, căn thức, mũ, góc, tam giác, $a \\neq 0$) sang LaTeX $...$ và $$...$$.
  + Tự động lọc từ thừa, sửa lỗi nói vấp, ngắt câu và giữ nguyên văn phong sư phạm.
  + 3 chế độ: Bóc băng nguyên văn, Tóm tắt & lập kế hoạch bài dạy, Trích xuất câu hỏi/bài tập.
  + Xem trước A4 WYSIWYG và Xuất file Word (.docx) chuẩn thể thức.
- Tab 6: Chấm bài Thị giác AI Vision.
- Tab 7: AI Chatbot Sư phạm Chuyên sâu & Phân tích Đa phương thức.
- Tab 8: Kế hoạch Giáo dục Nhà trường & Tổ chuyên môn (Phụ lục 1, 2, 3 chuẩn 5512).
- Tab 9: Phòng vẽ Hình học & Sơ đồ Khoa học TikZ AI vector.
- Tab 10: Giới thiệu Hệ thống, Cẩm nang sử dụng & Quản trị Tác giả Thầy Cấn Văn Trường.
- Tab 11: Kho Tài liệu Số & Văn bản chỉ đạo AI / Năng lực số (NLS).
- Tab 12: Diễn đàn Sư phạm & Hộp thư Tin nhắn riêng 1-1 với Admin Thầy Cấn Văn Trường.
- Tab 13: Phòng Thí nghiệm Mô phỏng Khoa học HTML5 Canvas.
- Tab 14: Đối Chiếu & Tổng Hợp Tài Liệu Đa Nguồn.
- Tab 15: Thẩm Định Thể Thức Word & Đổi Tên Hàng Loạt Bằng AI (.BAT/ZIP).

3. QUY TẮC ĐỊNH DẠNG & THỂ THỨC SƯ PHẠM:
- Trình bày Markdown rõ ràng, bảng biểu Markdown chuẩn bắt đầu và kết thúc bằng |.
- Tên bài dạy, chủ đề, tiết dạy luôn được căn giữa (Center-aligned), in đậm, kích thước nổi bật.
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
- Ô VUÔNG ĐIỀN KHUYẾT & KÍ HIỆU:
  + Ô vuông điền khuyết trong bài tập viết rõ ràng dạng [ ? ] hoặc [   ], không viết thành kí tự lỗi hoặc Unicode hỏng.
- TRÁNH DÍNH CHỮ & CHÍNH TẢ TIẾNG VIỆT:
  + Viết cách từ chuẩn xác tiếng Việt, không dính chữ như "chia hết", "liệt kê tập", "không thuộc", "thay vào", "hành tinh", "Hệ Mặt Trời", "ước chung lớn nhất", v.v.
  + Tuyệt đối chuẩn xác chính tả tiếng Việt: "tủ lạnh" (CẤM TUYỆT ĐỐI viết "tù lạnh"), "tủ sách" (không viết "tù sách"), "sắp xếp" (không viết "sắp sếp" hay "xắp xếp"), "nỗ lực" (không viết "lỗ lực"), "bổ sung" (không viết "bổ xung"), "chia sẻ" (không viết "chia xẻ"), "hướng dẫn" (không viết "hướng dẩn"), "thảo luận" (không viết "thảo luân"), "chắt lọc" (không viết "trắt lọc"), "trau dồi" (không viết "chau dồi"), "cọ xát" (không viết "cọ sát"), "sơ suất" (không viết "sơ xuất"), "xác suất" (không viết "xác xuất"), "xuất hiện" (không viết "suất hiện").
- Ký hiệu tập hợp toán học: Luôn bảo toàn cặp dấu ngoặc nhọn (ví dụ: $L = \\{N; H; A; T; R; A; N; G\\}$, $A = \\{0; 1; 2; 3\\}$), tuyệt đối không để mất dấu mở ngoặc.
- Đồ thị, sơ đồ vẽ bằng mã TikZ: \`\`\`tikz \\begin{tikzpicture} ... \\end{tikzpicture} \`\`\`.
- Mô phỏng HTML5 tương tác: \`\`\`simulation <!DOCTYPE html> ... \`\`\`.
- Công thức toán học phức tạp bọc trong $...$, số thường và chữ Tiếng Việt KHÔNG bọc $.
- Xưng hô lịch thiệp: "Thầy/Cô" hoặc "Quý Thầy/Cô", ngôn phong sư phạm chuẩn mực, nhiệt tình.

4. NGUYÊN TẮC SƯ PHẠM KHI CÂU HỎI QUÁ VẮN TẮT HOẶC CHUNG CHUNG:
- Khi Thầy/Cô đặt câu hỏi quá ngắn gọn hoặc chung chung (ví dụ: "vẽ đồ thị hàm số bậc 2 một ẩn", "soạn bài", "lập đề kiểm tra", "tư vấn phương pháp",... mà chưa nêu rõ hàm số cụ thể, lớp nào, bài nào):
  + BƯỚC 1: Hãy giải đáp hoặc cung cấp ngay 1 VÍ DỤ MINH HỌA MẪU CHUẨN MỰC, TRỰC QUAN (đầy đủ các bước, mã TikZ, bảng biểu hoàn chỉnh để dùng được ngay).
  + BƯỚC 2: Đồng thời HỎI LẠI LỊCH THIỆP & GỢI Ý ĐỊNH HƯỚNG CỤ THỂ để Thầy/Cô cung cấp thêm dữ liệu chi tiết nếu muốn tinh chỉnh đúng ý 100% (ví dụ: "Thầy/Cô có muốn em hỗ trợ vẽ hoặc giải với hàm số cụ thể nào khác (như $y = ax^2 + bx + c$), hoặc cho bài học/khối lớp nào trong SGK KNTT/CTST/Cánh Diều không ạ?").`;

    try {
      // Build multi-turn conversation memory history
      const history = messages
        .filter(m => m.id !== 'welcome' && !m.text.startsWith('⚠️ Lỗi Chatbot:'))
        .slice(-12)
        .map(m => ({
          role: m.sender === 'user' ? ('user' as const) : ('model' as const),
          parts: [{ text: m.text }]
        }));

      const textResult = await generateGeminiChat({
        message: promptContext,
        apiKeys,
        systemInstruction,
        history,
        images: currentImages.map(img => img.dataUrl)
      });

      if (textResult) {
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: preprocessChatMarkdown(textResult),
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: '⚠️ Lỗi Chatbot: ' + errMsg,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
      if (errMsg.includes('Hạn ngạch') || errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        onOpenApiGuide();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Copy all LaTeX formulas specifically for Word Alt + = pasting
  const handleCopyMathFormulas = (msgId: string, text: string) => {
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
      const formulasText = formulas.join('\n\n');
      navigator.clipboard.writeText(formulasText);
      setCopiedLatexId(msgId);
      showToast('📐 Đã sao chép các công thức Toán! Trong Word, bấm Alt + = rồi dán (Ctrl+V) để chuyển thành công thức chuẩn.');
      setTimeout(() => setCopiedLatexId(null), 3000);
    } else {
      navigator.clipboard.writeText(text);
      setCopiedId(msgId);
      showToast('📋 Đã sao chép toàn bộ nội dung!');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Export specific AI message as a formatted Microsoft Word document (.docx)
  const handleExportWord = async (msgId: string, text: string) => {
    try {
      setExportingWordId(msgId);
      const safeTitle = `Cau_Tra_Loi_AI_${monHoc}_Lop_${lop}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '_')}`;
      await exportMarkdownToWord(text, {
        fileName: `${safeTitle}.docx`,
        headerText: `AI LESSON PLANNER PRO - MÔN ${monHoc.toUpperCase()} - LỚP ${lop}`,
        footerText: `Tài liệu giải đáp sư phạm & Toán học`,
        monHoc,
        lop
      });
      showToast('📥 Đã xuất file Word (.docx) thành công! Các công thức toán được bảo toàn chuẩn xác.');
    } catch (err: any) {
      console.error('Word export error:', err);
      showToast('⚠️ Không thể xuất file Word: ' + (err?.message || String(err)));
    } finally {
      setExportingWordId(null);
    }
  };

  const removeAttachedImage = (id: string) => {
    setAttachedImages(prev => prev.filter(img => img.id !== id));
  };

  const removeAttachedDoc = (id: string) => {
    setAttachedDocs(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div
      className="space-y-4 max-w-5xl mx-auto select-text"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Toast Notification Banner */}
      {pasteToast && (
        <div className="fixed top-20 right-5 z-50 bg-cyan-900/95 text-cyan-100 border border-cyan-400 px-4 py-3 rounded-xl shadow-2xl backdrop-blur flex items-center gap-2.5 animate-bounce-subtle text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{pasteToast}</span>
        </div>
      )}

      {/* Top Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-lg flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md border border-cyan-400/40">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Trợ lý AI Sư phạm, Nhận diện Chữ viết tay & OCR Đa phương thức</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-medium">
                Môn {monHoc} - Lớp {lop}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Hỗ trợ dán ảnh màn hình/chữ viết tay (<strong>Ctrl + V</strong>), tải tệp đính kèm và xuất Word</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setMessages([
                {
                  id: 'welcome_refreshed',
                  sender: 'ai',
                  text: `Đã làm mới phiên trò chuyện! Thầy/Cô có thể dán ảnh từ clipboard (Ctrl+V) hoặc nhập câu hỏi mới nhé.`,
                  timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                }
              ]);
              setAttachedImages([]);
              setAttachedDocs([]);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Xóa lịch sử trò chuyện"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Xóa hội thoại</span>
          </button>
        </div>
      </div>

      {/* Quick Prompts Carousel */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(qp)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 hover:border-cyan-500 font-medium transition-all text-left flex items-center gap-1.5 cursor-pointer shadow-sm text-[11px]"
          >
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            <span>{qp}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div
        className={`relative bg-slate-900/90 border rounded-2xl p-4 shadow-lg h-[58vh] overflow-y-auto space-y-4 transition-all ${
          isDraggingOver ? 'border-cyan-400 bg-cyan-950/20' : 'border-slate-800'
        }`}
      >
        {isDraggingOver && (
          <div className="absolute inset-0 z-30 bg-cyan-950/80 backdrop-blur-sm border-2 border-dashed border-cyan-400 rounded-2xl flex flex-col items-center justify-center text-cyan-200 pointer-events-none">
            <ImageIcon className="w-12 h-12 text-cyan-300 animate-bounce mb-2" />
            <span className="text-sm font-bold">Thả ảnh hoặc tệp tin vào đây để nạp vào Chatbot</span>
            <span className="text-xs text-cyan-300/80 mt-1">Hỗ trợ nhận diện chữ viết tay, công thức Toán, đề thi và tài liệu</span>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white border border-cyan-400/40'
                  : 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white border border-indigo-400/40'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-3xl rounded-2xl p-4 text-xs leading-relaxed shadow-md ${
                msg.sender === 'user'
                  ? 'bg-cyan-950/80 text-cyan-100 border border-cyan-700/80 rounded-tr-none'
                  : 'bg-slate-950 text-slate-100 border border-slate-800 rounded-tl-none'
              }`}
            >
              {/* Attached Images in Message */}
              {msg.attachedImages && msg.attachedImages.length > 0 && (
                <div className="mb-3 pb-2 border-b border-cyan-800/50">
                  <div className="text-[11px] text-cyan-300 font-semibold mb-1.5 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Hình ảnh đính kèm ({msg.attachedImages.length}):</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {msg.attachedImages.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setPreviewImageUrl({ url: img.dataUrl, title: img.name })}
                        className="group relative w-20 h-20 rounded-lg overflow-hidden border border-cyan-700/60 bg-slate-900 cursor-pointer shadow hover:border-cyan-400 transition-all"
                        title="Bấm để xem ảnh phóng to"
                      >
                        <img
                          src={img.dataUrl}
                          alt={img.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attached Docs in Message */}
              {msg.attachedDocs && msg.attachedDocs.length > 0 && (
                <div className="mb-2 pb-2 border-b border-cyan-800/50 flex flex-wrap gap-1.5">
                  {msg.attachedDocs.map((doc, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-900/90 text-cyan-300 text-[11px] border border-cyan-700/50 flex items-center gap-1 font-medium"
                    >
                      <Paperclip className="w-3 h-3" />
                      <span>{doc.name} ({(doc.size / 1024).toFixed(0)} KB)</span>
                    </span>
                  ))}
                </div>
              )}

              {msg.sender === 'user' ? (
                <div className="whitespace-pre-wrap font-sans text-xs">{msg.text}</div>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkMath, remarkGfm]}
                  rehypePlugins={[rehypeKatex, rehypeRaw]}
                  components={{
                    h1: ({ node, ...props }) => (
                      <h1 className="text-sm font-bold text-cyan-300 mt-3 mb-1.5 pb-1 border-b border-slate-800" {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2 className="text-xs font-bold text-amber-300 mt-2.5 mb-1" {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3 className="text-xs font-semibold text-indigo-300 mt-2 mb-0.5" {...props} />
                    ),
                    p: ({ node, ...props }) => (
                      <div className="my-1.5 leading-relaxed" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul className="list-disc pl-4 my-1.5 space-y-0.5 text-slate-300" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol className="list-decimal pl-4 my-1.5 space-y-0.5 text-slate-300" {...props} />
                    ),
                    table: ({ node, ...props }) => (
                      <div className="overflow-x-auto my-3">
                        <table className="w-full border-collapse border border-slate-700 text-xs text-left bg-slate-900/80 rounded-lg overflow-hidden shadow-sm" {...props} />
                      </div>
                    ),
                    th: ({ node, ...props }) => (
                      <th className="border border-slate-700 bg-slate-800/90 px-3 py-1.5 font-bold text-cyan-300 text-left" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                      <td className="border border-slate-800 px-3 py-1.5 text-slate-200" {...props} />
                    ),
                    pre: ({ children }) => <>{children}</>,
                    code: ({ node, className, children, ...props }: any) => {
                      const match = /language-(\w+)/.exec(className || '');
                      const lang = match ? match[1].toLowerCase() : '';
                      const codeText = String(children).replace(/\n$/, '');
                      const isCodeBlock = Boolean(match || codeText.includes('\n'));

                      if (isCodeBlock && (lang === 'tikz' || (lang === 'latex' && codeText.includes('\\begin{tikzpicture}')))) {
                        return (
                          <div className="my-3">
                            <TikZVisualizer tikzCode={codeText} apiKeysInput={apiKeysInput} />
                          </div>
                        );
                      }

                      if (isCodeBlock && (lang === 'simulation' || (lang === 'html' && codeText.includes('<canvas') && codeText.includes('<script>')))) {
                        return (
                          <div className="my-3 rounded-xl border border-emerald-500/40 bg-slate-950 p-2.5 overflow-hidden shadow-lg">
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs text-emerald-300 font-bold">
                              <span className="flex items-center gap-1.5">
                                <Atom className="w-4 h-4 text-emerald-400" />
                                Mô phỏng Khoa học Tương tác HTML5 Canvas
                              </span>
                              <button
                                onClick={() => setPreviewSimHtml(codeText)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Play className="w-3 h-3" /> Chạy toàn màn hình
                              </button>
                            </div>
                            <iframe
                              srcDoc={codeText}
                              title="Simulation Preview"
                              className="w-full h-72 rounded-lg border border-slate-800 bg-slate-950"
                              sandbox="allow-scripts"
                            />
                          </div>
                        );
                      }

                      if (isCodeBlock) {
                        return (
                          <pre className="bg-slate-900 border border-slate-800 p-3 rounded-lg overflow-x-auto text-[11px] font-mono text-cyan-200 my-2" {...props}>
                            <code>{codeText}</code>
                          </pre>
                        );
                      }

                      return (
                        <code className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded text-[11px] font-mono border border-slate-700" {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              )}

              {/* Message Action Toolbar */}
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                <span>{msg.timestamp}</span>

                {msg.sender === 'ai' && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Copy LaTeX Math Formulas */}
                    <button
                      onClick={() => handleCopyMathFormulas(msg.id, msg.text)}
                      className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 border border-slate-800 hover:border-cyan-700/60 flex items-center gap-1 transition-colors cursor-pointer font-medium"
                      title="Trích xuất và sao chép các công thức toán học LaTeX để dán vào Word (Alt + =)"
                    >
                      <Calculator className="w-3 h-3 text-amber-400" />
                      <span>{copiedLatexId === msg.id ? 'Đã sao chép LaTeX' : 'Sao chép LaTeX'}</span>
                    </button>

                    {/* Export to Word .docx */}
                    <button
                      onClick={() => handleExportWord(msg.id, msg.text)}
                      disabled={exportingWordId === msg.id}
                      className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-emerald-300 hover:text-emerald-200 border border-slate-800 hover:border-emerald-700/60 flex items-center gap-1 transition-colors cursor-pointer font-medium disabled:opacity-50"
                      title="Xuất trực tiếp nội dung và công thức này ra file Word .docx"
                    >
                      <Download className="w-3 h-3 text-emerald-400" />
                      <span>{exportingWordId === msg.id ? 'Đang xuất...' : 'Xuất Word (.docx)'}</span>
                    </button>

                    {/* Copy Plain Text */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(msg.text);
                        setCopiedId(msg.id);
                        showToast('📋 Đã sao chép nội dung vào Clipboard!');
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Sao chép toàn bộ văn bản"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">Đã chép</span>
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
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-cyan-400 italic font-medium bg-slate-950/80 p-3 rounded-xl border border-cyan-800/50 w-fit shadow">
            <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
            <span>{loadingStatusText}</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Attachment Preview Strip (Above Input) */}
      {(attachedImages.length > 0 || attachedDocs.length > 0 || isReadingFile) && (
        <div className="bg-slate-900/95 border border-cyan-600/40 rounded-xl p-3 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-cyan-300">
            <span className="flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
              Tệp & Ảnh đã đính kèm ({attachedImages.length + attachedDocs.length}):
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              Có thể dán thêm ảnh (<strong>Ctrl + V</strong>) hoặc bấm <strong>Gửi</strong>
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {/* Image Previews */}
            {attachedImages.map(img => (
              <div
                key={img.id}
                className="relative group bg-slate-950 border border-slate-700 hover:border-cyan-400 rounded-lg p-1.5 flex items-center gap-2 text-xs transition-all shadow"
              >
                <div
                  onClick={() => setPreviewImageUrl({ url: img.dataUrl, title: img.name })}
                  className="w-10 h-10 rounded overflow-hidden bg-slate-900 shrink-0 cursor-pointer border border-slate-800"
                  title="Xem ảnh"
                >
                  <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 max-w-[140px]">
                  <div className="font-medium text-slate-200 truncate text-[11px]">{img.name}</div>
                  <div className="text-[10px] text-cyan-400 font-mono">{(img.size / 1024).toFixed(0)} KB • Ảnh</div>
                </div>
                <button
                  onClick={() => removeAttachedImage(img.id)}
                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                  title="Xóa ảnh này"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Doc Previews */}
            {attachedDocs.map(doc => (
              <div
                key={doc.id}
                className="relative bg-slate-950 border border-slate-700 hover:border-cyan-400 rounded-lg p-2 flex items-center gap-2 text-xs transition-all shadow"
              >
                <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
                <div className="min-w-0 max-w-[150px]">
                  <div className="font-medium text-slate-200 truncate text-[11px]">{doc.name}</div>
                  <div className="text-[10px] text-indigo-300">{(doc.size / 1024).toFixed(0)} KB • Tài liệu</div>
                </div>
                <button
                  onClick={() => removeAttachedDoc(doc.id)}
                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                  title="Xóa tệp này"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {isReadingFile && (
              <div className="flex items-center gap-2 text-xs text-amber-300 bg-slate-950 px-3 py-2 rounded-lg border border-amber-500/40 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang trích xuất dữ liệu tệp...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Box Area with onPaste */}
      <div
        className="bg-slate-900 border border-slate-800 focus-within:border-cyan-500 rounded-2xl p-3 shadow-xl transition-colors"
        onPaste={handlePaste}
      >
        <div className="flex items-end gap-2">
          {/* File & Image Upload Trigger */}
          <div className="flex items-center gap-1 shrink-0 pb-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 border border-slate-700/80 cursor-pointer transition-all shadow-sm flex items-center gap-1"
              title="Đính kèm Hình ảnh chữ viết tay / Tệp PDF, Word, Excel (Hoặc bấm Ctrl+V để dán trực tiếp)"
            >
              <Paperclip className="w-4 h-4" />
              <span className="text-[11px] font-semibold hidden sm:inline">Đính kèm</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.md,.pptx"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  processFiles(e.target.files);
                  e.target.value = '';
                }
              }}
              className="hidden"
            />
          </div>

          {/* Text Area Input */}
          <textarea
            ref={textareaRef}
            rows={2}
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Nhập câu hỏi, bài tập hoặc bấm Ctrl + V để dán ảnh chữ viết tay/công thức Toán (Shift+Enter để xuống dòng)..."
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none resize-none leading-relaxed"
          />

          {/* Voice Microphone Input */}
          <div className="shrink-0 pb-1">
            <VoiceMicButton
              onListeningChange={(listening) => {
                if (listening) {
                  baseVoiceMsgRef.current = inputMessage;
                }
              }}
              onLiveText={(liveText, isFinal) => {
                const prefix = baseVoiceMsgRef.current.trim();
                const combined = prefix ? `${prefix} ${liveText}` : liveText;
                setInputMessage(combined);
                if (isFinal) {
                  baseVoiceMsgRef.current = combined;
                }
              }}
              onTranscript={() => {}}
              buttonTitle="Nói câu hỏi cho Trợ lý AI (Nói đến đâu hiện chữ ngay đến đó)"
              size="md"
            />
          </div>

          {/* Send Button */}
          <div className="shrink-0 pb-1">
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || (!inputMessage.trim() && attachedImages.length === 0 && attachedDocs.length === 0)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-600/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              title="Gửi tin nhắn (Enter)"
            >
              <Send className="w-4 h-4" />
              <span>Gửi</span>
            </button>
          </div>
        </div>

        {/* Input Helper Info */}
        <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Mẹo: Chụp ảnh bằng Snipping Tool (Windows + Shift + S) rồi bấm <strong>Ctrl + V</strong> để dán ảnh vào đây!
            </span>
          </div>
          <span className="hidden sm:inline text-slate-500">Phím tắt: Enter để gửi, Shift+Enter xuống dòng</span>
        </div>
      </div>

      {/* Full Image Preview Modal */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                <ImageIcon className="w-4 h-4" />
                <span className="truncate">{previewImageUrl.title}</span>
              </div>
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-slate-950">
              <img
                src={previewImageUrl.url}
                alt={previewImageUrl.title}
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow"
              />
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Simulation Modal */}
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
    </div>
  );
};
