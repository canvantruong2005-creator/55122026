import React, { useEffect, useRef, useState } from 'react';
import * as docx from 'docx-preview';
import { RefreshCw, FileText, AlertTriangle } from 'lucide-react';

interface DocxViewerProps {
  arrayBuffer?: ArrayBuffer;
  blob?: Blob;
  className?: string;
}

export const DocxViewer: React.FC<DocxViewerProps> = ({ arrayBuffer, blob, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const renderDoc = async () => {
      if (!containerRef.current) return;
      if (!arrayBuffer && !blob) {
        setError('Không có dữ liệu tệp Word để hiển thị.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      containerRef.current.innerHTML = '';

      try {
        let buffer = arrayBuffer;
        if (!buffer && blob) {
          buffer = await blob.arrayBuffer();
        }

        if (buffer && isMounted && containerRef.current) {
          await docx.renderAsync(buffer, containerRef.current, undefined, {
            className: 'docx-preview-doc',
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            ignoreLastRenderedPageBreak: false,
            experimental: true,
            trimXmlDeclaration: true,
            useBase64URL: true,
            renderHeaders: true,
            renderFooters: true,
            renderFootnotes: true,
            renderEndnotes: true
          });
        }
      } catch (err: any) {
        console.error('Lỗi khi render docx-preview:', err);
        if (isMounted) {
          setError(err?.message || 'Không thể render trực tiếp định dạng Word này.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    renderDoc();

    return () => {
      isMounted = false;
    };
  }, [arrayBuffer, blob]);

  return (
    <div className={`relative w-full h-full flex flex-col items-center overflow-y-auto bg-slate-950 p-3 sm:p-6 ${className || ''}`}>
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-300">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
          <p className="text-xs font-semibold">Đang xử lý và kết xuất trang Word trực quan...</p>
        </div>
      )}

      {error && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 max-w-md my-8 text-center text-amber-200 text-xs space-y-2">
          <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto" />
          <p className="font-bold">Chưa thể hiển thị qua Trình xem Word nâng cao</p>
          <p className="text-slate-300 text-[11px]">{error}</p>
        </div>
      )}

      <div
        ref={containerRef}
        className={`w-full flex flex-col items-center [&_.docx-wrapper]:bg-transparent [&_.docx-wrapper]:p-0 [&_.docx-preview-doc]:shadow-2xl [&_.docx-preview-doc]:rounded-lg [&_.docx-preview-doc]:my-3 [&_.docx-preview-doc]:bg-white [&_.docx-preview-doc]:text-slate-900 ${loading ? 'hidden' : ''}`}
      />
    </div>
  );
};
