import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Scissors,
  Copy,
  Download,
  Check,
  Sparkles,
  Sliders,
  RefreshCw,
  X,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  FileCheck,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';

interface SimulationImageExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImageDataUrl?: string;
  onSendToLessonPlan?: (imageDataUrl: string) => void;
}

export const SimulationImageExtractorModal: React.FC<SimulationImageExtractorModalProps> = ({
  isOpen,
  onClose,
  initialImageDataUrl = '',
  onSendToLessonPlan
}) => {
  const [sourceImage, setSourceImage] = useState<string>(initialImageDataUrl);
  const [processedImage, setProcessedImage] = useState<string>('');
  const [bgColorType, setBgColorType] = useState<'white' | 'black' | 'custom'>('white');
  const [customColor, setCustomColor] = useState<string>('#FFFFFF');
  const [tolerance, setTolerance] = useState<number>(35);
  const [smoothness, setSmoothness] = useState<number>(10);
  const [protectFineDetails, setProtectFineDetails] = useState<boolean>(true); // Keep colored points and lines intact
  const [boostContrast, setBoostContrast] = useState<boolean>(false);
  const [outputMode, setOutputMode] = useState<'transparent' | 'clean_white'>('transparent');
  const [isCopied, setIsCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string>('');

  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (initialImageDataUrl) {
      setSourceImage(initialImageDataUrl);
    }
  }, [initialImageDataUrl]);

  // Process Background Removal whenever settings change
  useEffect(() => {
    if (!sourceImage) {
      setProcessedImage('');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Determine target background RGB
      let targetR = 255;
      let targetG = 255;
      let targetB = 255;

      if (bgColorType === 'black') {
        targetR = 0;
        targetG = 0;
        targetB = 0;
      } else if (bgColorType === 'custom') {
        const hex = customColor.replace('#', '');
        if (hex.length === 6) {
          targetR = parseInt(hex.substring(0, 2), 16);
          targetG = parseInt(hex.substring(2, 4), 16);
          targetB = parseInt(hex.substring(4, 6), 16);
        }
      }

      const tol = (tolerance / 100) * 441.67; // Max euclidean color distance is sqrt(255^2*3) = 441.67
      const smooth = (smoothness / 100) * 50;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Euclidean distance in RGB color space
        const dist = Math.sqrt(
          (r - targetR) * (r - targetR) +
          (g - targetG) * (g - targetG) +
          (b - targetB) * (b - targetB)
        );

        // Check if pixel is a distinct foreground detail (colored point, line, label)
        const maxChromaDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
        const isColoredFeature = maxChromaDiff > 28; // Colored lines (yellow, blue, red, green)

        if (dist <= tol && !(protectFineDetails && isColoredFeature)) {
          if (outputMode === 'clean_white') {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
            data[i + 3] = 255;
          } else {
            if (smooth > 0 && dist > tol - smooth) {
              // Soft edge feathering
              const alphaFactor = (dist - (tol - smooth)) / smooth;
              data[i + 3] = Math.round(data[i + 3] * alphaFactor);
            } else {
              data[i + 3] = 0; // Fully transparent
            }
          }
        } else {
          // Boost contrast and visibility of lines if requested
          if (boostContrast && data[i + 3] > 50) {
            if (outputMode === 'clean_white' && dist > tol) {
              // Darken lines for crisp Word print
              data[i] = Math.max(0, Math.round(r * 0.8));
              data[i + 1] = Math.max(0, Math.round(g * 0.8));
              data[i + 2] = Math.max(0, Math.round(b * 0.8));
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      const resultDataUrl = canvas.toDataURL('image/png');
      setProcessedImage(resultDataUrl);
    };
    img.src = sourceImage;
  }, [sourceImage, bgColorType, customColor, tolerance, smoothness, protectFineDetails, boostContrast, outputMode]);

  // Handle Paste from Clipboard (Ctrl + V)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setSourceImage(event.target.result as string);
            }
          };
          reader.readAsDataURL(blob);
          break;
        }
      }
    }
  };

  // Handle Upload Image File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSourceImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Direct Copy to Clipboard as Image Blob
  const handleCopyImageToClipboard = async () => {
    const targetUrl = processedImage || sourceImage;
    if (!targetUrl) return;

    try {
      setIsProcessing(true);
      const res = await fetch(targetUrl);
      const blob = await res.blob();

      // Write PNG blob directly to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ]);

      setIsCopied(true);
      setCopyStatus('✅ Đã sao chép ảnh trong suốt vào bộ nhớ tạm! Thầy/cô có thể bấm Ctrl+V để dán trực tiếp vào Word hoặc Giáo án.');
      setTimeout(() => {
        setIsCopied(false);
        setCopyStatus('');
      }, 4000);
    } catch (err) {
      console.warn('Lỗi copy ảnh clipboard:', err);
      // Fallback copy base64 text
      navigator.clipboard.writeText(targetUrl);
      setCopyStatus('Đã sao chép mã ảnh!');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download Transparent PNG
  const handleDownloadPng = () => {
    const targetUrl = processedImage || sourceImage;
    if (!targetUrl) return;

    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = `Mo_Phong_Tach_Nen_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Send to Lesson Plan workflow
  const handleSendToLessonPlan = () => {
    const targetUrl = processedImage || sourceImage;
    if (!targetUrl) return;

    if (onSendToLessonPlan) {
      onSendToLessonPlan(targetUrl);
      setCopyStatus('🎉 Đã nạp ảnh vào bộ nhớ tư liệu Soạn Giáo án & Kế hoạch dạy học!');
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onPaste={handlePaste}
      tabIndex={0}
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 outline-none"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Chụp Ảnh Mô Phỏng, Tách Nền Trong Suốt & Dán Vào Giáo Án</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                  PNG Trong Suốt
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Xóa phông nền trắng/đen từ mô phỏng, sao chép trực tiếp vào bộ nhớ tạm (Ctrl+V) để dán sang Word hoặc Giáo án
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Controls: Input Upload & Paste Guide */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          <div className="sm:col-span-8 bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <label className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold cursor-pointer flex items-center gap-1.5 shadow transition-all">
                <Upload className="w-3.5 h-3.5" />
                <span>Tải ảnh khác lên</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <span className="text-slate-400 text-[11px]">
                Hoặc bấm <kbd className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded border border-slate-700 font-mono">Ctrl + V</kbd> để dán ảnh bất kỳ từ bộ nhớ tạm!
              </span>
            </div>

            {sourceImage && (
              <button
                type="button"
                onClick={() => {
                  setSourceImage('');
                  setProcessedImage('');
                }}
                className="text-[11px] text-rose-400 hover:underline"
              >
                Xóa ảnh hiện tại
              </button>
            )}
          </div>

          <div className="sm:col-span-4 bg-indigo-950/40 p-3 rounded-xl border border-indigo-800/60 flex items-center justify-between gap-2">
            <span className="text-[11px] text-indigo-300 font-medium">
              💡 Thay thế hoàn toàn TikZ: Hình vẽ mô phỏng sắc nét, trực quan và chuẩn thực tế 100%!
            </span>
          </div>
        </div>

        {/* Main Processing Canvas Grid: Side-by-Side Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Original Image */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold border-b border-slate-800 pb-1.5">
              <span>1. Ảnh gốc ban đầu:</span>
              <span className="text-[10px] text-slate-500 font-mono">Mô phỏng / Chụp màn hình</span>
            </div>

            <div className="w-full h-64 sm:h-72 bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden border border-slate-800 relative">
              {sourceImage ? (
                <img
                  src={sourceImage}
                  alt="Ảnh gốc"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center p-4 space-y-2 text-slate-500 text-xs">
                  <ImageIcon className="w-8 h-8 mx-auto text-slate-600" />
                  <p>Chưa có ảnh mô phỏng nào.</p>
                  <p className="text-[11px] text-slate-600">Dán ảnh (Ctrl+V) hoặc chọn ảnh từ máy tính</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Transparent Processed Result */}
          <div className="bg-slate-950 border border-cyan-800/60 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-cyan-300 font-semibold border-b border-slate-800 pb-1.5">
              <span>2. Kết quả tách nền (Trong suốt / Transparent):</span>
              <span className="text-[10px] bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-800">
                Sẵn sàng dán vào Word
              </span>
            </div>

            <div
              className="w-full h-64 sm:h-72 rounded-lg flex items-center justify-center overflow-hidden border border-slate-800 relative"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, #1e293b 25%, transparent 25%),
                  linear-gradient(-45deg, #1e293b 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #1e293b 75%),
                  linear-gradient(-45deg, transparent 75%, #1e293b 75%)
                `,
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                backgroundColor: '#0f172a'
              }}
            >
              {processedImage ? (
                <img
                  src={processedImage}
                  alt="Kết quả tách nền"
                  className="max-w-full max-h-full object-contain drop-shadow-md"
                />
              ) : (
                <div className="text-center p-4 space-y-1 text-slate-500 text-xs">
                  <Sparkles className="w-6 h-6 mx-auto text-cyan-600 animate-pulse" />
                  <p>Đang chờ xử lý tách nền...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Background Removal Parameter Tuning Toolbar */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Cài đặt Thuật toán Tách nền Trong suốt:</span>
            </span>
            <span className="text-[11px] text-slate-400">Tự động xử lý pixel theo thời gian thực</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Background Color Mode */}
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-semibold">Màu nền cần xóa:</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBgColorType('white')}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                    bgColorType === 'white'
                      ? 'bg-white text-slate-950 border-cyan-400 font-bold shadow'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-white border border-slate-400 inline-block" />
                  <span>Nền Trắng</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBgColorType('black')}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                    bgColorType === 'black'
                      ? 'bg-slate-800 text-cyan-300 border-cyan-400 font-bold shadow'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-black border border-slate-600 inline-block" />
                  <span>Nền Đen</span>
                </button>

                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    value={customColor}
                    onChange={e => {
                      setCustomColor(e.target.value);
                      setBgColorType('custom');
                    }}
                    className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    title="Chọn màu khác để tách"
                  />
                </div>
              </div>
            </div>

            {/* Tolerance Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-semibold">Ngưỡng lọc màu (Tolerance):</label>
                <span className="text-cyan-300 font-mono font-bold">{tolerance}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={90}
                value={tolerance}
                onChange={e => setTolerance(parseInt(e.target.value) || 35)}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Chính xác (5%)</span>
                <span>Lọc mạnh (90%)</span>
              </div>
            </div>

            {/* Feathering / Smoothness Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-semibold">Độ mềm viền (Smoothness):</label>
                <span className="text-cyan-300 font-mono font-bold">{smoothness}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                value={smoothness}
                onChange={e => setSmoothness(parseInt(e.target.value) || 10)}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Viền sắc nét</span>
                <span>Viền mờ mịn</span>
              </div>
            </div>
          </div>

          {/* New Advanced Feature Protections */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4">
              {/* Protect Fine Details */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={protectFineDetails}
                  onChange={(e) => setProtectFineDetails(e.target.checked)}
                  className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                />
                <span className="text-slate-200 font-semibold">
                  🛡️ Bảo vệ chi tiết nhỏ & điểm, đường nét mảnh (Chống bay màu/mất nét)
                </span>
              </label>

              {/* Boost Contrast */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={boostContrast}
                  onChange={(e) => setBoostContrast(e.target.checked)}
                  className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                />
                <span className="text-slate-200 font-semibold">
                  ✨ Tăng độ tương phản & nét viền cho Word
                </span>
              </label>
            </div>

            {/* Output Mode Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400">Chế độ xuất:</span>
              <button
                type="button"
                onClick={() => setOutputMode('transparent')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  outputMode === 'transparent' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                PNG Trong Suốt
              </button>
              <button
                type="button"
                onClick={() => setOutputMode('clean_white')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  outputMode === 'clean_white' ? 'bg-white text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Nền Trắng Sạch In Ấn
              </button>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {copyStatus && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-700 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{copyStatus}</span>
          </div>
        )}

        {/* Action Buttons Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Đóng
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={!processedImage && !sourceImage}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Tải Ảnh PNG Trong Suốt</span>
            </button>

            {onSendToLessonPlan && (
              <button
                type="button"
                onClick={handleSendToLessonPlan}
                disabled={!processedImage && !sourceImage}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-900/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                <FileCheck className="w-4 h-4 text-amber-300" />
                <span>📥 Dán Vào Giáo Án & Kế Hoạch</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyImageToClipboard}
              disabled={!processedImage && !sourceImage}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-cyan-900/40 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isCopied ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4 text-slate-950" />}
              <span>{isCopied ? 'ĐÃ COPY ẢNH VÀO CLIPBOARD!' : '📋 SAO CHÉP ẢNH (CTRL+V SANG WORD)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
