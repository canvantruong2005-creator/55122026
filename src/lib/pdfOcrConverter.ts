import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { generateGeminiText, resolveApiKeys, generateGeminiVision } from './geminiApi';
import mammoth from 'mammoth';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Configure pdfjs worker dynamically with local Vite asset and CDN fallbacks
try {
  if (typeof window !== 'undefined' && (pdfjsLib as any).GlobalWorkerOptions) {
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc =
      pdfWorkerUrl ||
      `https://unpkg.com/pdfjs-dist@${(pdfjsLib as any).version || '6.2.108'}/build/pdf.worker.min.mjs`;
  }
} catch (e) {
  console.warn('pdfjs worker init note:', e);
}

export interface OcrProgressCallback {
  (progress: { stage: string; current: number; total: number; message: string }): void;
}

export interface PdfConversionOptions {
  pageRangeMode: 'all' | 'custom';
  startPage?: number;
  endPage?: number;
  ocrMode?: 'auto' | 'force_ocr' | 'text_only';
}

/**
 * Checks if extracted text is rich and legible Vietnamese
 */
function isQualityExtractedText(text: string): boolean {
  if (!text || text.trim().length < 60) return false;
  // If more than 20% of chars are weird replacement characters (e.g. , \u0000, ÿ)
  const weirdChars = (text.match(/[\uFFFD\u0000-\u0008\u000E-\u001F]/g) || []).length;
  if (weirdChars > text.length * 0.05) return false;
  // Check if has common Vietnamese characters or words
  const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/i.test(text);
  return hasVietnamese || text.length > 150;
}

/**
 * Extracts text and renders pages to images for OCR from a PDF File with Page Range support
 */
export async function convertPdfToWordWithOcr(
  pdfFile: File,
  apiKeys?: string[] | string,
  options?: PdfConversionOptions,
  onProgress?: OcrProgressCallback
): Promise<{ markdown: string; totalPages: number; processedPages: number }> {
  const arrayBuffer = await pdfFile.arrayBuffer();

  if (onProgress) {
    onProgress({ stage: 'loading', current: 1, total: 10, message: 'Đang tải và phân tích tệp PDF...' });
  }

  let fullExtractedText = '';
  let numPages = 1;
  let startP = 1;
  let endP = 1;
  const pageImages: { pageNum: number; dataUrl: string }[] = [];

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer.slice(0),
      useSystemFonts: true,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${(pdfjsLib as any).version || '6.2.108'}/cmaps/`,
      cMapPacked: true
    });
    const pdfDoc = await loadingTask.promise;
    numPages = pdfDoc.numPages || 1;

    startP = options?.pageRangeMode === 'custom' && options.startPage ? Math.max(1, options.startPage) : 1;
    endP = options?.pageRangeMode === 'custom' && options.endPage ? Math.min(numPages, options.endPage) : numPages;

    if (startP > endP) startP = endP;

    const pagesToProcessCount = endP - startP + 1;

    for (let pageNum = startP; pageNum <= endP; pageNum++) {
      const stepIdx = pageNum - startP + 1;
      if (onProgress) {
        onProgress({
          stage: 'extracting',
          current: stepIdx,
          total: pagesToProcessCount,
          message: `Đang quét nội dung Trang ${pageNum}/${numPages} (Phạm vi ${startP} - ${endP})...`
        });
      }

      const page = await pdfDoc.getPage(pageNum);
      let pageText = '';
      try {
        const textContent = await page.getTextContent();
        pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .trim();
      } catch (tErr) {
        console.warn('getTextContent error on page ' + pageNum, tErr);
      }

      const forceOcr = options?.ocrMode === 'force_ocr';
      const textOnly = options?.ocrMode === 'text_only';

      // If page has substantial and legible text and not forcing OCR, keep native text
      if (isQualityExtractedText(pageText) && !forceOcr) {
        fullExtractedText += `\n\n## [Trang ${pageNum}]\n` + pageText;
      } else if (!textOnly) {
        // Scanned page, complex font encoding or low text - render to canvas for AI Vision OCR
        try {
          const viewport = page.getViewport({ scale: 1.8 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (context) {
            await page.render({ canvasContext: context, viewport, canvas } as any).promise;
            const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
            pageImages.push({ pageNum, dataUrl });
          }
        } catch (e) {
          console.warn('Error rendering canvas for page ' + pageNum, e);
          if (pageText) {
            fullExtractedText += `\n\n## [Trang ${pageNum}]\n` + pageText;
          }
        }
      } else if (pageText) {
        fullExtractedText += `\n\n## [Trang ${pageNum}]\n` + pageText;
      }
    }
  } catch (pdfErr) {
    console.warn('PDF.js parsing fallback to binary inspection:', pdfErr);
  }

  // Multi-tier API key resolution: Default Built-in Keys + Admin Shared Cloud Keys + User Personal Keys
  const resolvedKeys = resolveApiKeys(apiKeys);

  // If there are scanned/low-text pages, run Gemini Vision Multimodal OCR
  if (pageImages.length > 0) {
    for (let i = 0; i < pageImages.length; i++) {
      const item = pageImages[i];
      if (onProgress) {
        onProgress({
          stage: 'ocr',
          current: i + 1,
          total: pageImages.length,
          message: `Đang dùng AI OCR đọc hiểu chính xác trang ảnh ${item.pageNum} (Hệ thống Key xoay vòng tự động)...`
        });
      }

      const prompt = `Bạn là chuyên gia OCR văn bản giáo dục & tài liệu tiếng Việt cao cấp. Hãy đọc và trích xuất toàn diện 100% nội dung trang tài liệu [Trang ${item.pageNum}] này thành định dạng Markdown chuẩn xác:
- Trích xuất TOÀN BỘ tiêu đề, đoạn văn, số thứ tự điều khoản, câu hỏi, bài tập, bảng biểu (kẻ bảng Markdown |---|---|).
- Công thức toán/khoa học chuyển sang ký hiệu chuẩn LaTeX ($...$ hoặc $$...$$).
- Tuyệt đối không tóm tắt, không bỏ sót chữ nào.`;

      try {
        const ocrText = await generateGeminiVision({
          prompt,
          imageBase64: item.dataUrl,
          apiKeys: resolvedKeys
        });
        if (ocrText && !ocrText.startsWith('[Lỗi')) {
          fullExtractedText += `\n\n## [Trang ${item.pageNum} - Đã quét AI Multimodal OCR]\n` + ocrText;
        } else {
          // Retry with generateGeminiText
          const textRes = await generateGeminiText({
            prompt,
            apiKeys: resolvedKeys,
            images: [item.dataUrl]
          });
          if (textRes) {
            fullExtractedText += `\n\n## [Trang ${item.pageNum} - Đã quét AI Multimodal OCR]\n` + textRes;
          }
        }
      } catch (ocrErr: any) {
        console.warn('OCR error for page ' + item.pageNum, ocrErr);
        fullExtractedText += `\n\n## [Trang ${item.pageNum}]\n*(Trang ảnh - Hệ thống đã quét. Vui lòng kiểm tra lại kết nối mạng hoặc bổ sung API Key tại Tab 2)*`;
      }
    }
  }

  if (!fullExtractedText.trim()) {
    fullExtractedText = `# TÀI LIỆU TRÍCH XUẤT TỪ FILE: ${pdfFile.name}\n\n*Hệ thống đã hoàn tất quét tệp PDF (${startP} - ${endP}). Bạn có thể bổ sung hoặc chỉnh sửa nội dung bên dưới trước khi tải về.*`;
  }

  return {
    markdown: fullExtractedText,
    totalPages: numPages,
    processedPages: endP - startP + 1
  };
}

/**
 * Converts Word (.docx) file to HTML and Markdown with styling, table, and image preservation
 */
export async function convertWordToHtmlAndMarkdown(
  docxFile: File
): Promise<{ html: string; text: string; markdown: string }> {
  const arrayBuffer = await docxFile.arrayBuffer();
  
  const mammothOptions = {
    convertImage: (mammoth as any).images?.imgElement ? (mammoth as any).images.imgElement((image: any) => {
      return image.read('base64').then((imageBuffer: string) => {
        return {
          src: 'data:' + image.contentType + ';base64,' + imageBuffer
        };
      });
    }) : undefined
  };

  const result = await mammoth.convertToHtml({ arrayBuffer }, mammothOptions as any);
  let html = result.value || '';
  
  const rawTextResult = await mammoth.extractRawText({ arrayBuffer });
  const text = rawTextResult.value || '';

  // Inject beautiful word-like CSS styling for tables, images, headings and margins
  const styledHtml = `
    <div class="word-document-container" style="font-family: 'Times New Roman', Times, serif; font-size: 14pt; line-height: 1.5; color: #111827; max-width: 800px; margin: 0 auto; padding: 25px;">
      <style>
        .word-document-container h1 { font-size: 18pt; font-weight: bold; margin-top: 18px; margin-bottom: 10px; text-align: center; text-transform: uppercase; color: #000; }
        .word-document-container h2 { font-size: 16pt; font-weight: bold; margin-top: 14px; margin-bottom: 8px; color: #000; }
        .word-document-container h3 { font-size: 14pt; font-weight: bold; margin-top: 12px; margin-bottom: 6px; color: #000; }
        .word-document-container p { margin-bottom: 8px; text-align: justify; text-indent: 1.27cm; }
        .word-document-container table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 13pt; }
        .word-document-container table, .word-document-container th, .word-document-container td { border: 1px solid #000; padding: 6px 10px; }
        .word-document-container th { background-color: #f3f4f6; font-weight: bold; text-align: center; }
        .word-document-container img { max-width: 100%; height: auto; display: block; margin: 12px auto; border-radius: 4px; }
        .word-document-container ul, .word-document-container ol { margin: 8px 0 8px 30px; }
        .word-document-container li { margin-bottom: 4px; }
      </style>
      ${html}
    </div>
  `;

  // Basic HTML to Markdown converter
  let markdown = html
    .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i>(.*?)<\/i>/gi, '*$1*')
    .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<li>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<[^>]+>/g, '');

  return {
    html: styledHtml,
    text,
    markdown: markdown.trim() || text
  };
}

import { saveAs } from 'file-saver';

/**
 * Converts rendered HTML or element into high-quality PDF (.pdf) file
 * Uses an isolated sandbox iframe to completely isolate html2canvas from Tailwind v4's oklch styles
 */
export async function convertHtmlOrElementToPdf(
  containerOrHtml: HTMLElement | string,
  fileName: string = 'Tai_lieu.pdf',
  title?: string
): Promise<Blob> {
  const contentHtml = typeof containerOrHtml === 'string'
    ? containerOrHtml
    : containerOrHtml.innerHTML;

  // Create isolated iframe to completely isolate html2canvas from Tailwind v4 root oklch styles
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '820px';
  iframe.style.height = '1200px';
  iframe.style.border = 'none';
  iframe.style.opacity = '0.01';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('Không thể khởi tạo môi trường xuất PDF');
    }

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title || 'Tài liệu'}</title>
          <style>
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: "Times New Roman", Times, serif;
              font-size: 13pt;
              line-height: 1.5;
              color: #000000;
              background-color: #ffffff;
              padding: 24px 28px;
              width: 800px;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 12px 0;
            }
            th, td {
              border: 1px solid #333333;
              padding: 6px 8px;
              text-align: left;
              vertical-align: top;
              color: #000000;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            h1, h2, h3, h4, h5, h6 {
              color: #000000;
              margin: 12px 0 6px 0;
              font-weight: bold;
            }
            h1 { font-size: 18pt; text-align: center; }
            h2 { font-size: 15pt; }
            h3 { font-size: 14pt; }
            p {
              margin-bottom: 8px;
              text-align: justify;
              color: #000000;
            }
            ul, ol {
              margin-left: 24px;
              margin-bottom: 8px;
              color: #000000;
            }
            li {
              margin-bottom: 4px;
            }
            img {
              max-width: 100%;
              height: auto;
              display: block;
              margin: 8px auto;
            }
            blockquote {
              border-left: 3px solid #666666;
              padding-left: 12px;
              margin: 8px 0;
              color: #444444;
            }
          </style>
        </head>
        <body>
          <div id="pdf-export-root">${contentHtml}</div>
        </body>
      </html>
    `);
    iframeDoc.close();

    // Allow iframe DOM rendering to settle
    await new Promise((resolve) => setTimeout(resolve, 200));

    const targetEl = iframeDoc.getElementById('pdf-export-root') || iframeDoc.body;

    const canvas = await html2canvas(targetEl, {
      scale: 2.0,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 850
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = contentHeight;
    let position = margin;

    pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
    heightLeft -= (pageHeight - margin * 2);

    while (heightLeft > 0) {
      position = heightLeft - contentHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
      heightLeft -= (pageHeight - margin * 2);
    }

    // Direct jsPDF save attempt
    try {
      pdf.save(fileName);
    } catch (pdfSaveErr) {
      console.warn('pdf.save direct error:', pdfSaveErr);
    }

    const pdfBlob = pdf.output('blob');
    return pdfBlob;
  } finally {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }
}

/**
 * Triggers reliable browser download of a Blob file
 */
export function triggerFileDownload(blob: Blob, filename: string) {
  try {
    saveAs(blob, filename);
    return;
  } catch (e1) {}

  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (a.parentNode) a.parentNode.removeChild(a);
      URL.revokeObjectURL(url);
    }, 2500);
  } catch (e) {
    console.warn('Fallback direct download error:', e);
  }
}

/**
 * Direct Print-to-PDF helper that opens a clean printable window for pixel-perfect vector printing
 */
export function printHtmlDirectlyToPdf(htmlContent: string, title: string = 'Tài liệu') {
  try {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <meta charset="utf-8" />
            <style>
              @page {
                size: A4 portrait;
                margin: 20mm 15mm 20mm 20mm;
              }
              body {
                font-family: 'Times New Roman', Times, serif;
                font-size: 13pt;
                line-height: 1.5;
                color: #000;
                margin: 0;
                padding: 0;
              }
              h1 { font-size: 16pt; font-weight: bold; text-align: center; text-transform: uppercase; margin-bottom: 12px; }
              h2 { font-size: 14pt; font-weight: bold; margin-top: 14px; margin-bottom: 8px; }
              p { margin-bottom: 6px; text-align: justify; }
              table { width: 100%; border-collapse: collapse; margin: 12px 0; }
              table, th, td { border: 1px solid #000; padding: 6px 10px; }
              th { background-color: #f3f4f6; }
              img { max-width: 100%; height: auto; display: block; margin: 10px auto; }
              @media print {
                body { -webkit-print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            ${htmlContent}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      return;
    }
  } catch (e) {}

  // Fallback if popup window is blocked inside iframe sandbox: use hidden iframe
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              @page { size: A4; margin: 20mm 15mm; }
              body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; color: #000; padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              th, td { border: 1px solid #000; padding: 6px 8px; }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
        </html>
      `);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        }, 3000);
      }, 500);
    }
  } catch (err) {
    console.warn('Iframe print fallback error:', err);
  }
}
