import React, { useState, useEffect } from 'react';
import { X, Key, ExternalLink, ShieldAlert, Sparkles, Check, ArrowRight, AlertTriangle } from 'lucide-react';

interface ApiGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKeys?: string;
  onSaveKeys?: (newKeys: string) => void;
  onNavigateToTab?: (tab: number) => void;
  isOverloaded?: boolean;
}

export const ApiGuideModal: React.FC<ApiGuideModalProps> = ({
  isOpen,
  onClose,
  currentKeys = '',
  onSaveKeys,
  onNavigateToTab,
  isOverloaded = false
}) => {
  const [keysInput, setKeysInput] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('gemini_api_keys_v48') || currentKeys || '';
      setKeysInput(saved);
      setSavedSuccess(false);
    }
  }, [isOpen, currentKeys]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = keysInput.trim();
    localStorage.setItem('gemini_api_keys_v48', trimmed);
    if (onSaveKeys) {
      onSaveKeys(trimmed);
    }
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const keyCount = keysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-xl w-full p-6 text-slate-100 relative my-8 animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              Nhập API Key Cá Nhân & Hướng Dẫn Lấy Key
            </h2>
            <p className="text-xs text-slate-400">
              Chủ động nhập API Key riêng để soạn bài tốc độ cao, không bị giới hạn lưu lượng
            </p>
          </div>
        </div>

        {/* Overload Alert Notification */}
        <div className="mb-4 p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs leading-relaxed flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-amber-300 mb-0.5">
              Thông báo hệ thống (Hạn ngạch & Quá tải lượt dùng)
            </div>
            Khi các API Key mặc định của hệ thống quá tải hoặc chưa có Key Admin chia sẻ, Thầy/Cô hãy dán <strong>1 hoặc nhiều API Key Gemini miễn phí cá nhân</strong> vào ô bên dưới để tiếp tục soạn giáo án/đề thi ngay lập tức mà không phải chờ đợi!
          </div>
        </div>

        {/* Direct Key Input Section */}
        <div className="space-y-2 mb-4 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Dán API Key Gemini của Thầy/Cô vào đây:
            </label>
            {keyCount > 0 && (
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-700 px-2 py-0.5 rounded-full">
                Đã nhận {keyCount} key
              </span>
            )}
          </div>
          <textarea
            value={keysInput}
            onChange={e => setKeysInput(e.target.value)}
            placeholder="Dán các mã API Key (bắt đầu bằng AIzaSy... hoặc AQ.Ab8RN..., cách nhau bằng dấu phẩy hoặc xuống dòng)..."
            rows={3}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 font-mono text-cyan-300 text-xs focus:border-cyan-400 focus:outline-none placeholder:text-slate-600 transition-all resize-y"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="text-[11px] text-slate-400">
              * Key được lưu an toàn trong trình duyệt của Thầy/Cô.
            </div>
            <button
              onClick={handleSave}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 shadow-md ${
                savedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Đã lưu Key thành công!
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Lưu Key & Tiếp tục dùng
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4-Step Guide to get free API Key */}
        <div className="space-y-2 text-xs text-slate-300">
          <div className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
            <span>Cách lấy API Key Google Gemini (Miễn phí 100% - chỉ mất 10 giây):</span>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 space-y-2 border border-slate-700/80 text-[11.5px]">
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
              <span>Bấm nút xanh bên dưới để vào <strong>Google AI Studio</strong> (aistudio.google.com).</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
              <span>Đăng nhập bằng tài khoản Gmail của Thầy/Cô.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
              <span>Bấm nút <strong>"Create API Key"</strong> (hoặc "Get API key").</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">4</span>
              <span>Sao chép mã Key và dán vào ô bên trên hoặc ở <strong>Tab 2 (Quét SGK & AI)</strong>.</span>
            </div>
          </div>

          <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-lg p-2.5 text-cyan-200 flex items-start gap-2 text-[11px]">
            <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>Mẹo: Thầy/Cô có thể tạo 2-3 API Keys trên các Gmail khác nhau dán vào cùng lúc để AI xoay vòng mượt mà không bao giờ bị nghẽn!</span>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          {onNavigateToTab && (
            <button
              onClick={() => {
                onNavigateToTab(2);
                onClose();
              }}
              className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold flex items-center gap-1 hover:underline"
            >
              <span>Đi đến Tab 2 để quản lý Key</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-cyan-900/30 hover:scale-105"
          >
            <ExternalLink className="w-4 h-4" />
            Mở Google AI Studio để tạo Key Miễn Phí
          </a>
        </div>
      </div>
    </div>
  );
};

