import React, { useState } from 'react';
import { convertTikzToSvg, generateOverleafTemplate } from '../lib/tikzRenderer';
import { generateGeminiText } from '../lib/geminiApi';
import { Copy, Check, ExternalLink, Code2, Eye, Sparkles, RefreshCw, Wand2, Download } from 'lucide-react';
import { saveAs } from 'file-saver';

interface TikZVisualizerProps {
  tikzCode: string;
  title?: string;
  onUpdateTikzCode?: (newTikzCode: string) => void;
  apiKeysInput?: string;
}

export const TikZVisualizer: React.FC<TikZVisualizerProps> = ({
  tikzCode,
  title = 'Hình vẽ TikZ',
  onUpdateTikzCode,
  apiKeysInput = ''
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedOverleaf, setCopiedOverleaf] = useState(false);
  const [activeTab, setActiveTab] = useState<'svg' | 'code' | 'overleaf' | 'repair'>('svg');
  const [repairPrompt, setRepairPrompt] = useState('');
  const [isRepairing, setIsRepairing] = useState(false);

  const cleanCode = tikzCode.trim();
  const svgMarkup = convertTikzToSvg(cleanCode);
  const overleafTemplate = generateOverleafTemplate(cleanCode, title);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(cleanCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyOverleaf = () => {
    navigator.clipboard.writeText(overleafTemplate);
    setCopiedOverleaf(true);
    setTimeout(() => setCopiedOverleaf(false), 2000);
  };

  const handleDownloadTex = () => {
    const blob = new Blob([overleafTemplate], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${title.toLowerCase().replace(/\s+/g, '_')}_tikz.tex`);
  };

  const handleRepairTikz = async () => {
    if (!repairPrompt.trim()) {
      alert('Vui lòng nhập mô tả chi tiết yêu cầu sửa/vẽ lại hình!');
      return;
    }

    const apiKeys = apiKeysInput ? apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean) : [];

    setIsRepairing(true);
    try {
      const prompt = `ĐÓNG VAI CHUYÊN GIA LATEX TIKZ VÀ ĐỒ HỌA HÌNH HỌC TỰ NHIÊN.
Nhiệm vụ: Hãy sửa đổi hoặc vẽ mới hoàn toàn mã TikZ dựa trên mã cũ và mô tả yêu cầu của giáo viên.

MÃ TIKZ CŨ:
${cleanCode}

YÊU CẦU SỬA ĐỔI / VẼ LẠI CỦA GIÁO VIÊN:
${repairPrompt}

QUY TẮC BẮT BUỘC TUÂN THỦ 100%:
1. CHỈ TRẢ VỀ DUY NHẤT KHỐI MÃ TIKZ BẮT ĐẦU BẰNG \\begin{tikzpicture} VÀ KẾT THÚC BẰNG \\end{tikzpicture}.
2. TUYỆT ĐỐI KHÔNG BỎ VÀO KHỐI MARKDOWN CODEBLOCK (không dùng \`\`\`tikz hay \`\`\`latex).
3. Đảm bảo mã TikZ hợp lệ, kết thúc các câu lệnh bằng dấu chấm phẩy (;).
4. Vẽ hình rõ ràng, nhãn góc và các nét đứt/nét liền cân đối.`;

      const result = await generateGeminiText({ prompt, apiKeys });
      if (result) {
        let newCode = result.trim();
        newCode = newCode.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
        if (!newCode.startsWith('\\begin{tikzpicture}')) {
          const match = newCode.match(/\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/);
          if (match) newCode = match[0];
        }

        if (newCode.startsWith('\\begin{tikzpicture}')) {
          if (onUpdateTikzCode) {
            onUpdateTikzCode(newCode);
          }
          setActiveTab('svg');
          alert('✨ Đã sửa và cập nhật hình TikZ mới thành công!');
        } else {
          alert('Mã TikZ mới sinh ra chưa đúng định dạng. Vui lòng nhấn Tạo Lại lần nữa!');
        }
      }
    } catch (err: any) {
      alert('Lỗi AI sửa hình: ' + err.message);
    } finally {
      setIsRepairing(false);
    }
  };

  const [copiedSvgImage, setCopiedSvgImage] = useState(false);

  const handleCopySvgToClipboard = async () => {
    try {
      const blob = new Blob([svgMarkup], { type: 'image/svg+xml' });
      await navigator.clipboard.write([new ClipboardItem({ 'image/svg+xml': blob })]);
      setCopiedSvgImage(true);
      setTimeout(() => setCopiedSvgImage(false), 2000);
      alert('📋 Đã copy ảnh SVG vector vào Bộ nhớ tạm!');
    } catch (e) {
      // Fallback: copy SVG code string
      navigator.clipboard.writeText(svgMarkup);
      setCopiedSvgImage(true);
      setTimeout(() => setCopiedSvgImage(false), 2000);
      alert('📋 Đã copy mã hình SVG vào bộ nhớ tạm để dán vào file!');
    }
  };

  return (
    <div className="my-4 border border-purple-800/40 bg-purple-950/20 rounded-xl overflow-hidden shadow-md">
      {/* Visualizer Header */}
      <div className="bg-purple-900/40 px-4 py-2.5 border-b border-purple-800/40 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-purple-200 font-semibold text-xs">
          <Code2 className="w-4 h-4 text-purple-400" />
          <span>{title}</span>
          <span className="text-[10px] bg-purple-800/60 text-purple-300 px-2 py-0.5 rounded-full border border-purple-700/50">
            TikZ Vector Graph
          </span>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setActiveTab('svg')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              activeTab === 'svg'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-purple-300 hover:bg-purple-900/60'
            }`}
          >
            <Eye className="w-3 h-3 inline mr-1" />
            Hình Trực Quan
          </button>

          <button
            onClick={() => setActiveTab('repair')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
              activeTab === 'repair'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-300 hover:bg-amber-900/60'
            }`}
          >
            <Wand2 className="w-3 h-3" />
            ✨ Sửa / Vẽ Lại
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              activeTab === 'code'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-purple-300 hover:bg-purple-900/60'
            }`}
          >
            Mã TikZ
          </button>

          <button
            onClick={() => setActiveTab('overleaf')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              activeTab === 'overleaf'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-purple-300 hover:bg-purple-900/60'
            }`}
          >
            Overleaf Template
          </button>
        </div>
      </div>

      {/* Content View */}
      <div className="p-4 bg-slate-950/80 text-slate-100">
        {activeTab === 'svg' && (
          <div className="flex flex-col items-center justify-center p-2 space-y-3">
            <div
              className="w-full max-w-lg shadow-lg rounded-lg overflow-hidden border border-slate-800 bg-white/95 p-2"
              dangerouslySetInnerHTML={{ __html: svgMarkup }}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySvgToClipboard}
                className="px-3 py-1.5 rounded bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 border border-indigo-700/60 text-xs font-semibold flex items-center gap-1.5 shadow transition-all"
              >
                <Copy className="w-3.5 h-3.5 text-indigo-300" />
                {copiedSvgImage ? 'Đã Copy Ảnh Vector!' : '📋 Copy Ảnh Vector Để Chèn Thủ Công'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 italic text-center">
              Hình minh họa véc-tơ rendered tự động. Nếu hình chưa chuẩn, bấm nút <strong className="text-amber-300">"✨ Sửa / Vẽ Lại"</strong> ở góc trên để AI tự sửa theo mô tả của thầy/cô!
            </p>
          </div>
        )}

        {activeTab === 'repair' && (
          <div className="space-y-3 bg-slate-900 p-3.5 rounded-lg border border-amber-800/50">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Ra lệnh cho AI Sửa / Vẽ Lại Hình TikZ Này:</span>
            </div>

            <textarea
              value={repairPrompt}
              onChange={e => setRepairPrompt(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
              placeholder="Ví dụ: 'Sửa lại tam giác ABC vuông tại A, kẻ đường cao AH', 'Đổi màu hình sang xanh lá và thêm góc vuông', 'Vẽ lại hình cầu bán kính R có tâm O'..."
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 italic">
                AI sẽ tạo mã TikZ mới & thay thế trực tiếp vào giáo án.
              </span>
              <button
                onClick={handleRepairTikz}
                disabled={isRepairing}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all"
              >
                {isRepairing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Đang AI Vẽ Lại Hình...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    🚀 AI SỬA MÃ TIKZ NGAY
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'code' && (
          <div className="relative space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-purple-300 font-semibold">Mã TikZ véc-tơ gốc:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-700 text-xs px-2.5 py-1 rounded shadow-sm transition-all"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'Đã chép!' : 'Copy Mã TikZ'}
                </button>
                <button
                  onClick={handleDownloadTex}
                  className="flex items-center gap-1 bg-cyan-800 hover:bg-cyan-700 text-cyan-100 text-xs px-2.5 py-1 rounded font-semibold shadow-sm transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải File .tex
                </button>
              </div>
            </div>
            <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-purple-300 overflow-x-auto leading-relaxed">
              {cleanCode}
            </pre>
          </div>
        )}

        {activeTab === 'overleaf' && (
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-purple-300 font-semibold">
                Khung Mã Latex Đầy Đủ Cho Overleaf:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyOverleaf}
                  className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs px-2.5 py-1 rounded font-semibold shadow-sm transition-all"
                >
                  {copiedOverleaf ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedOverleaf ? 'Đã chép!' : 'Copy Toàn Bộ Code Overleaf'}
                </button>
                <button
                  onClick={handleDownloadTex}
                  className="flex items-center gap-1 bg-cyan-700 hover:bg-cyan-600 text-white text-xs px-2.5 py-1 rounded font-semibold shadow-sm transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải File .tex
                </button>
                <a
                  href="https://www.overleaf.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 bg-indigo-700 hover:bg-indigo-600 text-white text-xs px-2.5 py-1 rounded font-semibold shadow-sm transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Mở Overleaf
                </a>
              </div>
            </div>
            <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto leading-relaxed">
              {overleafTemplate}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
