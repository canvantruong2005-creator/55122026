import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Code } from 'lucide-react';

interface TikZGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TikZGuideModal: React.FC<TikZGuideModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const templateCode = `\\documentclass[tikz, border=10pt]{standalone}
\\usepackage{amsmath, amsfonts, amssymb}
\\usepackage{tikz}
\\usetikzlibrary{calc, shapes, arrows, angles, quotes}

\\begin{document}

% --- DÁN MÃ TIKZ TỪ GIÁO ÁN VÀO ĐÂY ---
\\begin{tikzpicture}
  \\draw[thick, fill=blue!10] (0,0) -- (4,0) -- (2,3) -- cycle;
\\end{tikzpicture}

\\end{document}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(templateCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full p-6 text-slate-100 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Code className="w-6 h-6 text-indigo-400" />
          <h2 className="text-lg font-bold text-slate-100">
            Hướng dẫn Biên dịch & Xuất Mã TikZ Sang Overleaf
          </h2>
        </div>

        <div className="space-y-4 text-sm text-slate-300">
          <div className="bg-amber-950/40 border border-amber-800/60 rounded-lg p-3 text-amber-200 text-xs">
            <strong>⚠️ Lỗi thường gặp:</strong> <code className="bg-amber-900/60 px-1 py-0.5 rounded text-amber-300">Environment tikzpicture undefined</code>
            <br />
            <em>Nguyên nhân:</em> Mở file Latex trắng trên Overleaf nhưng chưa khai báo thư viện <code className="text-amber-300">\usepackage&#123;tikz&#125;</code>.
          </div>

          <div className="bg-slate-800/80 rounded-lg p-4 space-y-2 border border-slate-700">
            <h3 className="font-bold text-indigo-300 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">1</span>
              Quy trình xuất ảnh nét căng 100%:
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 pl-2 text-slate-300 text-xs">
              <li>Nhấn nút <strong>📋 Copy Khung Code Chuẩn</strong> bên dưới.</li>
              <li>Mở trang web <strong>Overleaf.com</strong> và tạo 1 Project mới (Blank Project).</li>
              <li>Dán khung code vào file <code className="text-cyan-300">main.tex</code>.</li>
              <li>Dán mã TikZ màu tím được tạo từ Giáo án vào giữa thẻ <code className="text-cyan-300">\begin&#123;document&#125;</code> và <code className="text-cyan-300">\end&#123;document&#125;</code>.</li>
              <li>Bấm nút <strong>Recompile</strong> (Màu xanh). Hình vẽ véc-tơ sắc nét sẽ hiện ra!</li>
            </ol>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-xs text-slate-400">Khung Code Latex Overleaf Mẫu:</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Đã sao chép!' : 'Copy Khung Code'}
              </button>
            </div>
            <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto">
              {templateCode}
            </pre>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-md"
          >
            <Copy className="w-4 h-4" />
            📋 Copy Khung Code Chuẩn
          </button>
          <a
            href="https://www.overleaf.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-md"
          >
            <ExternalLink className="w-4 h-4" />
            🌐 Mở Overleaf.com
          </a>
        </div>
      </div>
    </div>
  );
};
