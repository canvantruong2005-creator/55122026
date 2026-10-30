import React, { useState, useRef } from 'react';
import { generateGeminiText } from '../../lib/geminiApi';
import { convertTikzToSvg, generateOverleafTemplate } from '../../lib/tikzRenderer';
import { VoiceMicButton } from '../VoiceMicButton';
import {
  Code,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Download,
  Wand2,
  Eye,
  ExternalLink,
  BookOpen,
  HelpCircle,
  Layers,
  Image as ImageIcon,
  Calculator,
  Atom,
  Zap,
  Flame,
  Binary
} from 'lucide-react';
import { saveAs } from 'file-saver';

interface Tab9TikzStudioProps {
  apiKeysInput?: string;
  monHoc?: string;
  lop?: string;
  onOpenApiGuide?: () => void;
}

const PRESET_TIKZ_SAMPLES = [
  {
    name: '1. Hình Chóp S.ABC (Đáy Tam Giác - 3D Chuẩn)',
    code: `\\begin{tikzpicture}[scale=0.9, >=stealth, line join=round, line cap=round]
  \\coordinate (S) at (1.5,4.2);
  \\coordinate (A) at (0,0);
  \\coordinate (B) at (-2,-1.5);
  \\coordinate (C) at (3.5,-1.5);
  \\draw[dashed, thick] (A) -- (C);
  \\draw[thick] (S) -- (A) (S) -- (B) (S) -- (C);
  \\draw[thick] (B) -- (A) (B) -- (C);
  \\fill (S) circle (1.8pt) node[above] {$S$};
  \\fill (A) circle (1.8pt) node[above right] {$A$};
  \\fill (B) circle (1.8pt) node[below left] {$B$};
  \\fill (C) circle (1.8pt) node[below right] {$C$};
\\end{tikzpicture}`
  },
  {
    name: '2. Lăng Trụ Đứng ABC.A\'B\'C\' (Hình Học Không Gian)',
    code: `\\begin{tikzpicture}[scale=0.85, >=stealth, line join=round, line cap=round]
  \\coordinate (A) at (0,0);
  \\coordinate (B) at (-2,-1.2);
  \\coordinate (C) at (3,-1.2);
  \\coordinate (A1) at (0,3.5);
  \\coordinate (B1) at (-2,2.3);
  \\coordinate (C1) at (3,2.3);
  \\draw[dashed, thick] (A) -- (C) (A) -- (A1);
  \\draw[thick] (B) -- (A) (B) -- (C);
  \\draw[thick] (A1) -- (B1) -- (C1) -- cycle;
  \\draw[thick] (B) -- (B1) (C) -- (C1);
  \\fill (A) circle (1.6pt) node[above right] {$A$};
  \\fill (B) circle (1.6pt) node[below left] {$B$};
  \\fill (C) circle (1.6pt) node[below right] {$C$};
  \\fill (A1) circle (1.6pt) node[above] {$A'$};
  \\fill (B1) circle (1.6pt) node[above left] {$B'$};
  \\fill (C1) circle (1.6pt) node[above right] {$C'$};
\\end{tikzpicture}`
  },
  {
    name: '3. Tam Giác ABC Vuông Tại A (Đường Cao AH, Ký Hiệu Vuông Góc)',
    code: `\\begin{tikzpicture}[scale=0.9, >=stealth]
  \\coordinate (A) at (0,3);
  \\coordinate (B) at (-3,0);
  \\coordinate (C) at (4,0);
  \\coordinate (H) at (0,0);
  \\draw[thick] (A) -- (B) -- (C) -- cycle;
  \\draw[dashed, thick, red] (A) -- (H);
  \\draw[red, thick] (0.35,0) -- (0.35,0.35) -- (0,0.35);
  \\fill (A) circle (1.8pt) node[above] {$A$};
  \\fill (B) circle (1.8pt) node[below left] {$B$};
  \\fill (C) circle (1.8pt) node[below right] {$C$};
  \\fill[red] (H) circle (1.8pt) node[below] {$H$};
\\end{tikzpicture}`
  },
  {
    name: '4. Đồ Thị Parabol y = x² - 4x + 3 (Trục Tọa Độ Ox, Oy)',
    code: `\\begin{tikzpicture}[scale=0.85, >=stealth]
  \\draw[->, thick] (-1.5,0) -- (5.5,0) node[right] {$x$};
  \\draw[->, thick] (0,-1.5) -- (0,5) node[above] {$y$};
  \\fill (0,0) circle (1.2pt) node[below left] {$O$};
  \\draw[red, line width=1.4pt, domain=-0.5:4.5, samples=100] plot (\\x, {\\x*\\x - 4*\\x + 3});
  \\draw[dashed] (2,0) -- (2,-1) -- (0,-1);
  \\fill (2,-1) circle (1.8pt) node[below] {$I(2;-1)$};
  \\fill (1,0) circle (1.5pt) node[above left] {$1$};
  \\fill (3,0) circle (1.5pt) node[above right] {$3$};
  \\fill (0,3) circle (1.5pt) node[left] {$3$};
\\end{tikzpicture}`
  },
  {
    name: '5. Đồ Thị Hàm Bậc Ba y = x³ - 3x² + 2',
    code: `\\begin{tikzpicture}[scale=0.8, >=stealth]
  \\draw[->, thick] (-2,0) -- (4,0) node[right] {$x$};
  \\draw[->, thick] (0,-3) -- (0,4) node[above] {$y$};
  \\fill (0,0) circle (1.2pt) node[below left] {$O$};
  \\draw[blue, line width=1.4pt, domain=-1.2:3.2, samples=120] plot (\\x, {\\x^3 - 3*\\x^2 + 2});
  \\fill (0,2) circle (1.6pt) node[left] {$2$};
  \\fill (2,-2) circle (1.6pt) node[below right] {$(2;-2)$};
  \\draw[dashed] (2,0) -- (2,-2) -- (0,-2);
\\end{tikzpicture}`
  },
  {
    name: '6. Đường Tròn Ngoại Tiếp & Tiếp Tuyến',
    code: `\\begin{tikzpicture}[scale=0.85, >=stealth]
  \\draw[thick, blue] (0,0) circle (2.5cm);
  \\coordinate (O) at (0,0);
  \\coordinate (A) at (0,2.5);
  \\coordinate (B) at (-2.16,-1.25);
  \\coordinate (C) at (2.16,-1.25);
  \\draw[thick] (A) -- (B) -- (C) -- cycle;
  \\draw[dashed] (O) -- (A) (O) -- (B) (O) -- (C);
  \\fill (O) circle (1.8pt) node[below] {$O$};
  \\fill (A) circle (1.8pt) node[above] {$A$};
  \\fill (B) circle (1.8pt) node[below left] {$B$};
  \\fill (C) circle (1.8pt) node[below right] {$C$};
\\end{tikzpicture}`
  },
  {
    name: '7. Khối Nón Tròn Xoay & Thiết Diện Qua Trục',
    code: `\\begin{tikzpicture}[scale=0.85, >=stealth]
  \\coordinate (S) at (0,3.8);
  \\coordinate (O) at (0,0);
  \\coordinate (A) at (-2.2,0);
  \\coordinate (B) at (2.2,0);
  \\draw[thick] (A) arc (180:360:2.2cm and 0.7cm);
  \\draw[dashed, thick] (A) arc (180:0:2.2cm and 0.7cm);
  \\draw[thick] (S) -- (A) (S) -- (B);
  \\draw[dashed, thick] (S) -- (O) (A) -- (B);
  \\fill (S) circle (1.6pt) node[above] {$S$};
  \\fill (O) circle (1.6pt) node[below] {$O$};
  \\fill (A) circle (1.6pt) node[left] {$A$};
  \\fill (B) circle (1.6pt) node[right] {$B$};
\\end{tikzpicture}`
  },
  {
    name: '8. Sơ Đồ Mạch Điện (Nguồn + Khóa K + Điện Trở + Đèn)',
    code: `\\begin{tikzpicture}[scale=0.9, >=stealth]
  \\draw[thick] (0,0) to[battery1, l=$E{,}r$] (0,3) -- (2,3) to[nos, l=$K$] (4,3) -- (6,3) -- (6,1.5) to[R, l=$R$] (6,0) -- (3,0) to[lamp, l=$Đ$] (0,0);
\\end{tikzpicture}`
  },
  {
    name: '9. Cấu Trúc Phân Tử Benzen (Hóa Học)',
    code: `\\begin{tikzpicture}[scale=1]
  \\draw[thick] (0:1.5) -- (60:1.5) -- (120:1.5) -- (180:1.5) -- (240:1.5) -- (300:1.5) -- cycle;
  \\draw[thick] (0:1.1) arc (0:360:1.1);
  \\node at (0,0) {\\Large $\\mathrm{C_6H_6}$};
\\end{tikzpicture}`
  }
];

export const Tab9TikzStudio: React.FC<Tab9TikzStudioProps> = ({
  apiKeysInput = '',
  monHoc = 'Toán',
  lop = '10',
  onOpenApiGuide
}) => {
  // Main feature mode
  const [studioMode, setStudioMode] = useState<'tikz' | 'latex_formula'>('tikz');

  // TikZ State
  const [tikzCode, setTikzCode] = useState<string>(PRESET_TIKZ_SAMPLES[0].code);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [repairPrompt, setRepairPrompt] = useState('');
  const [isRepairing, setIsRepairing] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'overleaf'>('preview');
  const [copyImageStatus, setCopyImageStatus] = useState<string | null>(null);
  const [copyCodeStatus, setCopyCodeStatus] = useState<string | null>(null);

  // LaTeX Formula Generator State
  const [formulaPrompt, setFormulaPrompt] = useState('');
  const [formulaSubject, setFormulaSubject] = useState<'Toán' | 'Vật lí' | 'Hóa học' | 'Sinh học'>('Toán');
  const [isGeneratingFormula, setIsGeneratingFormula] = useState(false);
  const [generatedLatexResult, setGeneratedLatexResult] = useState<{
    latexCode: string;
    inlineCode: string;
    description: string;
    mathtypeNote: string;
  } | null>(null);
  const [copyLatexStatus, setCopyLatexStatus] = useState<string | null>(null);

  const svgMarkup = convertTikzToSvg(tikzCode);
  const overleafTemplate = generateOverleafTemplate(tikzCode, 'Hinh_Ve_TikZ_Chuan');

  // Helper to convert SVG markup to PNG Blob for clipboard/download
  const getSvgAsPngBlob = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const svgContainer = document.getElementById('tikz-render-container');
      const svgEl = svgContainer?.querySelector('svg');
      let svgStr = '';
      if (svgEl) {
        svgStr = new XMLSerializer().serializeToString(svgEl);
      } else {
        svgStr = svgMarkup;
      }

      const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const blobURL = window.URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 2.5; // High resolution crisp output
        canvas.width = (img.width || 600) * scale;
        canvas.height = (img.height || 400) * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff'; // White background for Word
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas blob generation failed'));
          }, 'image/png');
        } else {
          reject(new Error('Canvas 2D context failed'));
        }
        window.URL.revokeObjectURL(blobURL);
      };
      img.onerror = (e) => {
        window.URL.revokeObjectURL(blobURL);
        reject(e);
      };
      img.src = blobURL;
    });
  };

  // Copy PNG image to clipboard
  const handleCopyPngImage = async () => {
    try {
      setCopyImageStatus('Đang xử lý ảnh PNG...');
      const pngBlob = await getSvgAsPngBlob();
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
        setCopyImageStatus('Đã Copy PNG! Bấm Ctrl+V dán vào Word');
      } else {
        const blobUrl = URL.createObjectURL(pngBlob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `hinh_tikz_${Date.now()}.png`;
        link.click();
        setCopyImageStatus('Đã tải ảnh PNG về máy!');
      }
    } catch (err) {
      console.error('Error copying PNG:', err);
      try {
        await navigator.clipboard.writeText(svgMarkup);
        setCopyImageStatus('Đã copy SVG véc-tơ!');
      } catch (e) {
        setCopyImageStatus('Không thể copy ảnh!');
      }
    } finally {
      setTimeout(() => setCopyImageStatus(null), 3000);
    }
  };

  // Download PNG image file
  const handleDownloadPngImage = async () => {
    try {
      const pngBlob = await getSvgAsPngBlob();
      saveAs(pngBlob, `hinh_tikz_${Date.now()}.png`);
    } catch (err) {
      alert('Không thể xuất file PNG. Bạn có thể sử dụng nút Tải File .tex!');
    }
  };

  // Download LaTeX .tex
  const handleDownloadTex = () => {
    const blob = new Blob([overleafTemplate], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `hinh_tikz_${Date.now()}.tex`);
  };

  // Copy TikZ code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(tikzCode);
    setCopyCodeStatus('Đã copy mã TikZ!');
    setTimeout(() => setCopyCodeStatus(null), 2500);
  };

  // Generate new TikZ from user prompt
  const handleGenerateTikz = async () => {
    if (!prompt.trim()) {
      alert('Vui lòng nhập mô tả hình cần vẽ!');
      return;
    }

    const apiKeys = apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);

    setIsGenerating(true);
    try {
      const systemPrompt = `BẠN LÀ CHUYÊN GIA ĐỒ HỌA TOÁN HỌC & MÃ TIKZ LATEX CAO CẤP TỐI ƯU CHO SGK VÀ ĐỀ THI TOÁN HỌC VIỆT NAM.
Nhiệm vụ: Phân tích ngữ cảnh toán học chính xác 100% (Hình phẳng 2D, Hình không gian 3D, Đồ thị hàm số, Lượng giác, Véc-tơ, Hình học giải tích Oxy/Oxyz, Mạch điện, Hóa học) và xuất duy nhất đoạn mã TikZ LaTeX hợp lệ.

KIẾN TRÚC THƯ VIỆN TIKZ & LATEX MỚI NHẤT HỖ TRỢ:
- \\usetikzlibrary{calc, angles, quotes, intersections, 3d, perspective, shapes.geometric, patterns, patterns.meta, arrows.meta, decorations.markings, decorations.pathreplacing, positioning, babel, math}
- pgfplots cho đồ thị hàm số và mặt cong không gian.
- circuitikz cho mạch điện vật lí, chemfig cho công thức hóa học.

QUY TẮC BẮT BUỘC ĐẢM BẢO CHÍNH XÁC NGỮ CẢNH TOÁN HỌC:
1. HÌNH KHÔNG GIAN 3D (Chóp, Lăng trụ, Hộp chữ nhật, Khối nón, Khối trụ, Mặt cầu):
   - Mọi cạnh khuất/nằm bên trong: BẮT BUỘC dùng [dashed, thick].
   - Các cạnh nhìn thấy bên ngoài: Dùng [thick].
   - Tọa độ đỉnh cân đối phối cảnh tự nhiên, góc nghiêng đáy chuẩn (~ -20° đến -30°).
   - Đánh dấu góc vuông tại chân đường cao hoặc tiếp điểm rõ ràng.
2. HÌNH PHẲNG 2D (Tam giác, Tứ giác, Đường tròn, Tiếp tuyến, Dây cung):
   - Tọa độ chuẩn xác hình học.
   - Đánh dấu điểm đỉnh: \\fill (A) circle (1.8pt) node[above/below/left/right] {$A$};
3. ĐỒ THỊ HÀM SỐ (Bậc 1, Bậc 2 Parabol, Bậc 3, Bậc 4, Phân thức, Lượng giác):
   - Luôn có hệ trục tọa độ vuông góc $Ox, Oy$ với mũi tên ->, gốc tọa độ $O$.
   - Vẽ đường cong mượt: \\draw[..., domain=a:b, samples=100] plot (\\x, {...});
   - Đánh dấu các điểm đặc biệt (Đỉnh I, Điểm uốn, Cực trị) kèm đường gióng nét đứt [dashed] về trục Ox, Oy.
4. ĐỊNH DẠNG XUẤT RA:
   - CHỈ TRẢ VỀ DUY NHẤT MÃ BẮT ĐẦU BẰNG \\begin{tikzpicture} VÀ KẾT THÚC BẰNG \\end{tikzpicture}.
   - TUYỆT ĐỐI KHÔNG BỎ VÀO KHỐI MARKDOWN CODEBLOCK (không có \`\`\`tikz hay \`\`\`latex).
   - Không có lời chào hay giải thích nào khác.`;

      const userMsg = `Hãy phân tích ngữ cảnh toán học và vẽ hình TikZ LaTeX chuẩn xác cho đề bài môn ${monHoc} Lớp ${lop}: "${prompt}"`;

      const response = await generateGeminiText({
        prompt: userMsg,
        apiKeys,
        systemInstruction: systemPrompt
      });

      if (response) {
        let clean = response.trim();
        clean = clean.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
        if (!clean.startsWith('\\begin{tikzpicture}')) {
          const match = clean.match(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/);
          if (match) clean = match[0];
        }

        if (clean.startsWith('\\begin{tikzpicture}')) {
          setTikzCode(clean);
          setActiveTab('preview');
        } else {
          alert('AI chưa tạo đúng định dạng TikZ. Vui lòng bấm thử lại!');
        }
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      alert('Lỗi khi AI vẽ TikZ: ' + errMsg);
      if (errMsg.includes('Hạn ngạch') || errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        if (onOpenApiGuide) onOpenApiGuide();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // AI Refine / Repair TikZ
  const handleRefineTikz = async () => {
    if (!repairPrompt.trim()) {
      alert('Vui lòng nhập yêu cầu sửa đổi hình!');
      return;
    }

    const apiKeys = apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);

    setIsRepairing(true);
    try {
      const systemPrompt = `BẠN LÀ CHUYÊN GIA ĐỒ HỌA TOÁN HỌC VÀ MÃ TIKZ LATEX CAO CẤP.
Nhiệm vụ: Hãy chỉnh sửa mã TikZ hiện tại theo đúng câu lệnh yêu cầu của giáo viên, đồng thời bảo toàn tính chính xác toán học, phối cảnh 3D và các thư viện TikZ.

MÃ TIKZ HIỆN TẠI:
${tikzCode}

CÂU LỆNH YÊU CẦU SỬA ĐỔI CỦA GIÁO VIÊN:
${repairPrompt}

QUY TẮC CỨNG:
1. CHỈ TRẢ VỀ DUY NHẤT MÃ TIKZ BẮT ĐẦU BẰNG \\begin{tikzpicture} VÀ KẾT THÚC BẰNG \\end{tikzpicture}.
2. TUYỆT ĐỐI KHÔNG DÙNG MARKDOWN CODEBLOCK (không dùng \`\`\`tikz hay \`\`\`latex). KHÔNG VIẾT DÒNG GIẢI THÍCH NÀO KHÁC.`;

      const response = await generateGeminiText({
        prompt: `Sửa mã TikZ theo yêu cầu: "${repairPrompt}"`,
        apiKeys,
        systemInstruction: systemPrompt
      });

      if (response) {
        let clean = response.trim();
        clean = clean.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
        if (!clean.startsWith('\\begin{tikzpicture}')) {
          const match = clean.match(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/);
          if (match) clean = match[0];
        }

        if (clean.startsWith('\\begin{tikzpicture}')) {
          setTikzCode(clean);
          setRepairPrompt('');
          setActiveTab('preview');
        } else {
          alert('Không thể cập nhật mã TikZ. Vui lòng thử lại!');
        }
      }
    } catch (err: any) {
      alert('Lỗi khi AI sửa hình: ' + (err?.message || String(err)));
    } finally {
      setIsRepairing(false);
    }
  };

  // AI Text-to-LaTeX Formula Generator
  const handleGenerateFormula = async () => {
    if (!formulaPrompt.trim()) {
      alert('Vui lòng nhập mô tả hoặc câu lệnh công thức (bằng tiếng Việt hoặc ký hiệu)!');
      return;
    }

    const apiKeys = apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);
    setIsGeneratingFormula(true);

    try {
      const systemPrompt = `BẠN LÀ CHUYÊN GIA BIÊN SOẠN CÔNG THỨC LATEX VÀ MATHTYPE CHO GIÁO VIÊN VIỆT NAM.
Nhiệm vụ: Chuyển đổi yêu cầu / mô tả bằng lời văn tiếng Việt của giáo viên thành MÃ LATEX CÔNG THỨC CHUẨN XÁC 100%, tương thích hoàn hảo với Microsoft Word (phím tắt Alt + =), MathType, Overleaf và các đề thi chuẩn Bộ GD&ĐT.

YÊU CẦU TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON:
{
  "latexCode": "Mã LaTeX khối đầy đủ dạng $$...$$ hoặc môi trường align/cases/matrix/ce",
  "inlineCode": "Mã LaTeX nội dòng ngắn gọn dạng $...$",
  "description": "Giải thích ngắn gọn ý nghĩa các ký hiệu trong công thức",
  "mathtypeNote": "Mẹo phím tắt dán vào Word hoặc MathType"
}`;

      const userMsg = `Hãy sinh mã công thức LaTeX chuẩn cho môn ${formulaSubject}: "${formulaPrompt}"`;

      const response = await generateGeminiText({
        prompt: userMsg,
        apiKeys,
        systemInstruction: systemPrompt
      });

      if (response) {
        let clean = response.trim();
        if (clean.startsWith('```json')) {
          clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (clean.startsWith('```')) {
          clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        try {
          const parsed = JSON.parse(clean);
          setGeneratedLatexResult({
            latexCode: parsed.latexCode || '$$...$$',
            inlineCode: parsed.inlineCode || '$...$',
            description: parsed.description || 'Công thức chuẩn LaTeX',
            mathtypeNote: parsed.mathtypeNote || 'Bôi đen trong Word và bấm Alt + ='
          });
        } catch {
          setGeneratedLatexResult({
            latexCode: response,
            inlineCode: `$${response.replace(/\$\$/g, '').trim()}$`,
            description: 'Công thức LaTeX đã được sinh',
            mathtypeNote: 'Dán trực tiếp vào Word (Alt + =)'
          });
        }
      }
    } catch (err: any) {
      alert('Lỗi sinh công thức: ' + (err?.message || String(err)));
    } finally {
      setIsGeneratingFormula(false);
    }
  };

  const handleCopyLatex = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyLatexStatus(label);
    setTimeout(() => setCopyLatexStatus(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 border border-purple-500/30 rounded-2xl p-5 shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30">
                <Code className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold tracking-wide">
                TIKZ & LATEX STUDIO: ĐỒ HỌA TOÁN HỌC & SOẠN THẢO CÔNG THỨC AI
              </h2>
            </div>
            <p className="text-xs text-purple-200">
              Vẽ hình học 2D/3D bằng TikZ chuẩn xác & Sinh mã công thức LaTeX / MathType tự động bằng ngôn ngữ tự nhiên
            </p>
          </div>

          {/* Studio Mode Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-purple-500/30">
            <button
              onClick={() => setStudioMode('tikz')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                studioMode === 'tikz'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Vẽ Hình TikZ (2D/3D)</span>
            </button>
            <button
              onClick={() => setStudioMode('latex_formula')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                studioMode === 'latex_formula'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Ra Lệnh AI Sinh Công Thức LaTeX</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODE 2: LATEX FORMULA GENERATOR */}
      {studioMode === 'latex_formula' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Panel: Input */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Ra Lệnh Bằng Tiếng Việt Để Sinh Công Thức</span>
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Chọn Phân Môn:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Toán', 'Vật lí', 'Hóa học', 'Sinh học'] as const).map(sub => (
                    <button
                      key={sub}
                      onClick={() => setFormulaSubject(sub)}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        formulaSubject === sub
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Nhập Lời Nói / Mô Tả Công Thức Cần Sinh:
                  </label>
                  <VoiceMicButton
                    onTranscript={(delta) => {
                      setFormulaPrompt(prev => {
                        const clean = delta.trim();
                        if (!clean) return prev;
                        return prev ? `${prev} ${clean}` : clean;
                      });
                    }}
                    buttonTitle="Nói yêu cầu công thức LaTeX"
                    size="sm"
                  />
                </div>
                <textarea
                  value={formulaPrompt}
                  onChange={e => setFormulaPrompt(e.target.value)}
                  rows={4}
                  placeholder={
                    formulaSubject === 'Toán'
                      ? 'VD: Tích phân từ 0 đến pi/2 của sin mũ 3 x nhân cos x dx, hoặc hệ phương trình 2 ẩn có căn thức...'
                      : formulaSubject === 'Hóa học'
                      ? 'VD: Phản ứng nhiệt nhôm tạo Fe và Al2O3 kèm điều kiện nhiệt độ cao, hoặc phương trình ion Fe2+ tác dụng HNO3...'
                      : 'VD: Định luật Ohm cho toàn mạch I = E / (R + r), hoặc công thức thấu kính hội tụ...'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-indigo-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Sample Prompts */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400">Gợi ý mẫu nhanh:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Định lý Pythagoras & Hệ thức lượng tam giác vuông',
                    'Công thức nghiệm phương trình bậc hai ax² + bx + c = 0',
                    'Tích phân từng phần: ∫u dv = uv - ∫v du',
                    'Cân bằng phản ứng: KMnO4 + HCl → KCl + MnCl2 + Cl2 + H2O',
                    'Định luật vạn vật hấp dẫn: F = G * (m1*m2)/r²'
                  ].map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setFormulaPrompt(s)}
                      className="text-[10px] bg-slate-950 hover:bg-slate-800 text-indigo-300 border border-slate-800 rounded px-2 py-1 transition-all text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateFormula}
                disabled={isGeneratingFormula}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-lg shadow-lg text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isGeneratingFormula ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    AI Đang Xử Lý & Sinh Mã LaTeX...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    Tạo Mã LaTeX & MathType
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel: Output */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <Code className="w-4 h-4 text-cyan-400" />
                <span>Kết Quả Công Thức LaTeX & Hướng Dẫn Dán Word</span>
              </h3>
              {generatedLatexResult && (
                <button
                  onClick={() => handleCopyLatex(generatedLatexResult.latexCode, 'all')}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copyLatexStatus === 'all' ? 'Đã sao chép!' : 'Sao chép tất cả'}</span>
                </button>
              )}
            </div>

            {generatedLatexResult ? (
              <div className="space-y-4">
                {/* Block LaTeX */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300">1. Mã LaTeX Độc Lập (Block Mode):</span>
                    <button
                      onClick={() => handleCopyLatex(generatedLatexResult.latexCode, 'block')}
                      className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copyLatexStatus === 'block' ? 'Đã copy!' : 'Copy mã Block'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-200 overflow-x-auto">
                    {generatedLatexResult.latexCode}
                  </pre>
                </div>

                {/* Inline LaTeX */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300">2. Mã LaTeX Nội Dòng (Inline $...$):</span>
                    <button
                      onClick={() => handleCopyLatex(generatedLatexResult.inlineCode, 'inline')}
                      className="text-[11px] text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copyLatexStatus === 'inline' ? 'Đã copy!' : 'Copy mã Inline'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-purple-200 overflow-x-auto">
                    {generatedLatexResult.inlineCode}
                  </pre>
                </div>

                {/* Description & Guide */}
                <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 space-y-1 text-xs text-slate-300">
                  <p><strong className="text-slate-100">Ý nghĩa:</strong> {generatedLatexResult.description}</p>
                  <p><strong className="text-emerald-400">💡 Hướng dẫn Word / MathType:</strong> {generatedLatexResult.mathtypeNote}</p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs italic bg-slate-950/50 rounded-xl border border-slate-800/60">
                Hãy nhập yêu cầu công thức ở khung bên trái và bấm <strong>"Tạo Mã LaTeX & MathType"</strong>. Kết quả công thức sẽ xuất hiện tại đây ngay lập tức.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 1: TIKZ DRAWING STUDIO */}
      {studioMode === 'tikz' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Col (4 cols): Controls & Prompt */}
          <div className="lg:col-span-4 space-y-4">
            {/* Presets Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  Mẫu Hình Chuẩn (Click Để Nạp):
                </span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {PRESET_TIKZ_SAMPLES.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setTikzCode(sample.code);
                      setActiveTab('preview');
                    }}
                    className="w-full text-left p-2 rounded-lg bg-slate-950 hover:bg-purple-950/60 border border-slate-800 hover:border-purple-500/50 text-slate-300 text-xs transition-all flex items-center justify-between group"
                  >
                    <span className="font-medium group-hover:text-purple-200 truncate">{sample.name}</span>
                    <Wand2 className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>

            {/* AI Generator Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  AI Vẽ Hình Theo Đề Bài:
                </span>
                <div className="flex items-center gap-1.5">
                  <VoiceMicButton
                    onTranscript={(delta) => {
                      setPrompt(prev => {
                        const clean = delta.trim();
                        if (!clean) return prev;
                        return prev ? `${prev} ${clean}` : clean;
                      });
                    }}
                    buttonTitle="Nói đề bài hình học cần vẽ"
                    size="sm"
                  />
                  <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-500/40 px-1.5 py-0.5 rounded font-mono">
                    TikZ 3D & 2D
                  </span>
                </div>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Nhập đề bài hoặc mô tả hình cần vẽ... VD: Cho hình chóp S.ABCD đáy hình vuông cạnh a, SA vuông góc đáy..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed"
              />

              <button
                onClick={handleGenerateTikz}
                disabled={isGenerating}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg shadow-lg text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    AI Đang Phân Tích & Vẽ Hình TikZ...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    Vẽ Hình TikZ Bằng AI
                  </>
                )}
              </button>
            </div>

            {/* AI Refine / Repair Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
                  Chỉnh Sửa Nhanh Hình Hiện Tại:
                </span>
              </div>

              <input
                type="text"
                value={repairPrompt}
                onChange={(e) => setRepairPrompt(e.target.value)}
                placeholder="VD: Đổi đỉnh S sang màu đỏ, nối thêm đoạn SO nét đứt..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />

              <button
                onClick={handleRefineTikz}
                disabled={isRepairing}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white font-bold rounded-lg border border-slate-700 text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isRepairing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Đang Sửa Mã TikZ...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Gửi AI Sửa Hình Này
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Col (8 cols): Interactive Preview & Code Editor */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
            {/* View Switcher & Action Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'preview'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> Xem Hình Trực Quan
                </button>
                <button
                  onClick={() => setActiveTab('code')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'code'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" /> Mã TikZ Gốc
                </button>
                <button
                  onClick={() => setActiveTab('overleaf')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'overleaf'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Overleaf LaTeX
                </button>
              </div>

              {/* Quick Copy / Download Image Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyPngImage}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow"
                  title="Copy ảnh PNG sang bộ nhớ tạm để dán (Ctrl+V) thủ công vào Word"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copyImageStatus || '📋 Copy Ảnh PNG (Ctrl+V dán Word)'}
                </button>

                <button
                  onClick={handleDownloadPngImage}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 shadow"
                  title="Tải file ảnh PNG về máy tính"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  Tải PNG
                </button>
              </div>
            </div>

            {/* Render Views */}
            {activeTab === 'preview' && (
              <div className="space-y-4">
                <div
                  id="tikz-render-container"
                  className="w-full min-h-[320px] bg-white rounded-xl border border-slate-700 p-4 flex items-center justify-center shadow-inner overflow-auto"
                  dangerouslySetInnerHTML={{ __html: svgMarkup }}
                />

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="italic">
                    🔒 Note: Hình ảnh được tạo độc lập. Thầy/cô bấm nút <strong className="text-emerald-400">"📋 Copy Ảnh PNG"</strong> rồi bấm <strong className="text-white">Ctrl + V</strong> dán trực tiếp vào file Word khi cần!
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                    Vector SVG Render
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'code' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300">Mã TikZ LaTeX (Có thể sửa tay trực tiếp):</span>
                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    {copyCodeStatus || 'Copy Mã TikZ'}
                  </button>
                </div>

                <textarea
                  value={tikzCode}
                  onChange={(e) => setTikzCode(e.target.value)}
                  rows={12}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-purple-300 focus:outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>
            )}

            {activeTab === 'overleaf' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300">Khung Mã LaTeX Hoàn Chỉnh Cho Overleaf:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadTex}
                      className="px-3 py-1 rounded bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold flex items-center gap-1 shadow"
                    >
                      <Download className="w-3.5 h-3.5" /> Tải File .tex
                    </button>
                    <a
                      href="https://www.overleaf.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold flex items-center gap-1 shadow"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Mở Overleaf
                    </a>
                  </div>
                </div>

                <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto max-h-[350px]">
                  {overleafTemplate}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
