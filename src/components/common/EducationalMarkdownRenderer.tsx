import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { sanitizeMathForVietnamese, repairVietnameseText } from '../../lib/mathSanitizer';
import { ungluePedagogicalHeadings } from '../../lib/terminologyUtils';

interface EducationalMarkdownRendererProps {
  content: string;
  className?: string;
  isLightMode?: boolean;
}

/**
 * Universal High-Definition Educational Markdown & KaTeX Formula Renderer
 * Ensures proper Vietnamese typography (Unicode NFC, repaired tone marks)
 * and beautiful mathematical expressions ($...$, $$...$$, fractions, square roots, geometry symbols).
 */
export const EducationalMarkdownRenderer: React.FC<EducationalMarkdownRendererProps> = ({
  content,
  className = '',
  isLightMode = true
}) => {
  const processedContent = useMemo(() => {
    if (!content) return '';
    // 1. Repair broken accents & unglue syllables
    let sanitized = repairVietnameseText(content);
    // 2. Unglue sections (IV. HƯỚNG DẪN VỀ NHÀ, TỔNG KẾT KIẾN THỨC)
    sanitized = ungluePedagogicalHeadings(sanitized);
    // 3. Separate Vietnamese words from $ math blocks & clean radicals
    sanitized = sanitizeMathForVietnamese(sanitized);
    // 4. Normalize to Unicode NFC
    sanitized = sanitized.normalize('NFC');
    return sanitized;
  }, [content]);

  return (
    <div
      className={`prose max-w-none transition-colors leading-relaxed ${
        isLightMode
          ? 'text-slate-900 prose-headings:text-slate-900 prose-strong:text-slate-950 prose-p:text-slate-800'
          : 'text-slate-100 prose-headings:text-white prose-strong:text-violet-300 prose-p:text-slate-200'
      } ${className}`}
      style={{ fontFamily: "'Plus Jakarta Sans', 'Lora', 'Noto Serif', -apple-system, sans-serif" }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{
          h1: ({ node, ...props }) => (
            <h1
              className="text-xl sm:text-2xl font-black tracking-tight border-b-2 border-violet-500/50 pb-2.5 mt-5 mb-4 text-violet-950 dark:text-violet-300 flex items-center gap-2"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="text-lg sm:text-xl font-bold tracking-tight border-l-4 border-violet-600 pl-3 mt-5 mb-3 text-violet-900 dark:text-violet-200"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="text-base sm:text-lg font-bold tracking-tight mt-4 mb-2 text-indigo-900 dark:text-indigo-300"
              {...props}
            />
          ),
          p: ({ node, ...props }) => (
            <div className="my-2.5 text-xs sm:text-sm leading-relaxed" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside space-y-1.5 my-2.5 pl-2 text-xs sm:text-sm" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside space-y-1.5 my-2.5 pl-2 text-xs sm:text-sm font-medium" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="text-xs sm:text-sm leading-relaxed" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm">
              <table className="w-full text-xs text-left border-collapse" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold border-b border-slate-300 dark:border-slate-700" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 font-bold" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-3.5 py-2 border border-slate-300 dark:border-slate-700" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="p-3 my-3 rounded-xl border-l-4 border-amber-500 bg-amber-500/10 text-amber-950 dark:text-amber-200 text-xs sm:text-sm italic"
              {...props}
            />
          ),
          pre: ({ children }) => <>{children}</>,
          code: ({ node, className, children, ...props }: any) => {
            const isBlock = Boolean(className && className.includes('language-')) || String(children).includes('\n');
            return !isBlock ? (
              <code
                className="px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 font-mono text-[11px] sm:text-xs font-semibold"
                {...props}
              >
                {children}
              </code>
            ) : (
              <pre className="p-3 my-2.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800">
                <code {...props}>{children}</code>
              </pre>
            );
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};
