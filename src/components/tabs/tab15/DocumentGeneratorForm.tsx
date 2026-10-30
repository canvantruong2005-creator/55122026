import React, { useState } from 'react';
import {
  PenTool,
  Flag,
  GraduationCap,
  Landmark,
  Building2,
  Sliders,
  Wand2,
  RefreshCw,
  Sparkles,
  Layers,
  PlusCircle,
  Calendar,
  FileSignature,
  FileText
} from 'lucide-react';
import { CustomDocMeta, ReferenceSampleDoc } from './types';

interface Props {
  meta: CustomDocMeta;
  onChangeMeta: (meta: CustomDocMeta) => void;
  samples: ReferenceSampleDoc[];
  isGenerating: boolean;
  onGenerate: () => void;
}

const COMMON_DOC_TYPES_DANG = [
  'Quyết định',
  'Nghị quyết',
  'Chỉ thị',
  'Kế hoạch',
  'Báo cáo',
  'Kết luận',
  'Chương trình',
  'Tờ trình',
  'Công văn',
  'Biên bản',
  'Quy định',
  'Hướng dẫn',
  'Thông báo'
];

const COMMON_DOC_TYPES_GOV = [
  'Quyết định',
  'Kế hoạch',
  'Tờ trình',
  'Báo cáo',
  'Công văn',
  'Thông báo',
  'Chỉ thị',
  'Quy chế',
  'Hướng dẫn',
  'Biên bản',
  'Giấy mời',
  'Phương án',
  'Đề án'
];

export const DocumentGeneratorForm: React.FC<Props> = ({
  meta,
  onChangeMeta,
  samples,
  isGenerating,
  onGenerate
}) => {
  const [showCustomTypeInput, setShowCustomTypeInput] = useState<boolean>(meta.isCustomDocType);

  const activeSamples = samples.filter(s => s.isActive);

  const handleAuthorityChange = (authority: CustomDocMeta['authority']) => {
    if (authority === 'dang') {
      onChangeMeta({
        ...meta,
        authority,
        orgName: meta.orgName || 'Chi bộ ...',
        parentOrg: meta.parentOrg || 'Đảng ủy ...',
        signerTitle: 'Bí thư Chi bộ',
        signType: 'T/M CHI BỘ',
        docType: meta.docType || 'Quyết định'
      });
    } else if (authority === 'giao_duc') {
      onChangeMeta({
        ...meta,
        authority,
        orgName: meta.orgName || 'Trường ...',
        parentOrg: meta.parentOrg || 'Sở Giáo dục và Đào tạo ...',
        signerTitle: 'Hiệu trưởng',
        signType: 'HIỆU TRƯỞNG',
        docType: meta.docType || 'Kế hoạch'
      });
    } else if (authority === 'nha_nuoc') {
      onChangeMeta({
        ...meta,
        authority,
        orgName: meta.orgName || 'Ủy ban nhân dân ...',
        parentOrg: meta.parentOrg || 'Ủy ban nhân dân ...',
        signerTitle: 'Chủ tịch UBND',
        signType: 'TM. UỶ BAN NHÂN DÂN',
        docType: meta.docType || 'Công văn'
      });
    } else {
      onChangeMeta({
        ...meta,
        authority,
        signerTitle: 'Giám đốc / Trưởng đơn vị',
        signType: 'GIÁM ĐỐC'
      });
    }
  };

  const handleDocTypeSelect = (val: string) => {
    if (val === '__custom__') {
      setShowCustomTypeInput(true);
      onChangeMeta({ ...meta, isCustomDocType: true });
    } else {
      setShowCustomTypeInput(false);
      onChangeMeta({ ...meta, docType: val, isCustomDocType: false });
    }
  };

  const setTodayDate = () => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    const dateStr = `ngày ${d} tháng ${m} năm ${y}`;
    onChangeMeta({ ...meta, docDate: dateStr });
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-indigo-900/50 p-4 sm:p-5 space-y-4 shadow-xl">
      <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <PenTool className="w-4 h-4 text-indigo-400" />
          <span>Thông Số & Cấu Hình Soạn Thảo Văn Bản Chuẩn AI:</span>
        </h3>
        <span className="text-[11px] text-indigo-300 font-mono">
          Tuân thủ thể thức 100%
        </span>
      </div>

      {/* 1. Authority System Selector */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-300">
          1. Khối Thể chế & Cơ quan Ban Hành:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => handleAuthorityChange('dang')}
            className={`p-2.5 rounded-xl text-center border transition-all text-xs font-bold cursor-pointer ${
              meta.authority === 'dang'
                ? 'bg-rose-950 border-rose-500 text-rose-200 shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Flag className="w-4 h-4 mx-auto mb-1 text-rose-400" />
            <span>Cơ quan Đảng</span>
            <span className="text-[9px] block opacity-70">HD 05-HD/VPTW 2026</span>
          </button>

          <button
            type="button"
            onClick={() => handleAuthorityChange('giao_duc')}
            className={`p-2.5 rounded-xl text-center border transition-all text-xs font-bold cursor-pointer ${
              meta.authority === 'giao_duc'
                ? 'bg-indigo-950 border-indigo-500 text-indigo-200 shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4 mx-auto mb-1 text-indigo-400" />
            <span>Ngành GD&ĐT</span>
            <span className="text-[9px] block opacity-70">QĐ 3666 & NĐ 30</span>
          </button>

          <button
            type="button"
            onClick={() => handleAuthorityChange('nha_nuoc')}
            className={`p-2.5 rounded-xl text-center border transition-all text-xs font-bold cursor-pointer ${
              meta.authority === 'nha_nuoc'
                ? 'bg-blue-950 border-blue-500 text-blue-200 shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Landmark className="w-4 h-4 mx-auto mb-1 text-blue-400" />
            <span>Chính phủ / UBND</span>
            <span className="text-[9px] block opacity-70">NĐ 30/2020/NĐ-CP</span>
          </button>

          <button
            type="button"
            onClick={() => handleAuthorityChange('doanh_nghiep')}
            className={`p-2.5 rounded-xl text-center border transition-all text-xs font-bold cursor-pointer ${
              meta.authority === 'doanh_nghiep'
                ? 'bg-emerald-950 border-emerald-500 text-emerald-200 shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
            <span>Đơn Vị / Doanh Nghiệp</span>
            <span className="text-[9px] block opacity-70">Quy chế nội bộ</span>
          </button>
        </div>
      </div>

      {/* 2. Document Type (Selection + Custom Free Input) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300">
            2. Loại văn bản cần tạo (Tự do nhập hoặc chọn danh mục):
          </label>
          <button
            type="button"
            onClick={() => setShowCustomTypeInput(!showCustomTypeInput)}
            className="text-[11px] text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            <PlusCircle className="w-3 h-3" />
            <span>{showCustomTypeInput ? 'Chọn từ danh sách có sẵn' : 'Tự gõ loại văn bản mới'}</span>
          </button>
        </div>

        {showCustomTypeInput ? (
          <div className="space-y-1">
            <input
              type="text"
              value={meta.docType}
              onChange={e => onChangeMeta({ ...meta, docType: e.target.value, isCustomDocType: true })}
              placeholder="VD: Quy chế chi tiêu nội bộ, Bản cam kết thi đua, Phương án PCCC, Đề án việc làm, Quyết định kỷ luật..."
              className="w-full bg-slate-950 border border-indigo-600 rounded-xl p-2.5 text-xs text-indigo-200 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner"
            />
            <p className="text-[10px] text-slate-400 italic">
              * Thầy/Cô có thể tự nhập bất kỳ thể loại văn bản hành chính, quy chế, kế hoạch hoặc tờ trình nào.
            </p>
          </div>
        ) : (
          <select
            value={meta.docType}
            onChange={e => handleDocTypeSelect(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            {(meta.authority === 'dang' ? COMMON_DOC_TYPES_DANG : COMMON_DOC_TYPES_GOV).map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
            <option value="__custom__">✨ [Tự Nhập Thêm Loại Văn Bản Tùy Chỉnh...]</option>
          </select>
        )}
      </div>

      {/* 3. Organizations & Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="text-slate-400 block mb-1 font-semibold">Cơ quan cấp trên:</label>
          <input
            type="text"
            value={meta.parentOrg}
            onChange={e => onChangeMeta({ ...meta, parentOrg: e.target.value })}
            placeholder="VD: Đảng ủy cấp trên hoặc Sở GD&ĐT..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-slate-400 block mb-1 font-semibold">Cơ quan ban hành:</label>
          <input
            type="text"
            value={meta.orgName}
            onChange={e => onChangeMeta({ ...meta, orgName: e.target.value })}
            placeholder="VD: Chi bộ ... hoặc Trường THCS / THPT..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* 4. Number & Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="text-slate-400 block mb-1 font-semibold">
            Số và Ký hiệu văn bản:
          </label>
          <input
            type="text"
            value={meta.docNumber}
            onChange={e => onChangeMeta({ ...meta, docNumber: e.target.value })}
            placeholder={
              meta.authority === 'dang'
                ? 'VD: 15-QĐ/ĐU hoặc để trống AI tự sinh'
                : 'VD: 45/QĐ-THCS hoặc để trống AI tự sinh'
            }
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-slate-400 font-semibold">Địa danh & Thời gian:</label>
            <button
              type="button"
              onClick={setTodayDate}
              className="text-[10px] text-amber-400 hover:underline cursor-pointer flex items-center gap-0.5"
            >
              <Calendar className="w-2.5 h-2.5" />
              <span>Hôm nay</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <input
              type="text"
              value={meta.location}
              onChange={e => onChangeMeta({ ...meta, location: e.target.value })}
              placeholder="Địa danh (VD: Hà Nội)"
              className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              value={meta.docDate}
              onChange={e => onChangeMeta({ ...meta, docDate: e.target.value })}
              placeholder="ngày 03 tháng 02 năm 2026"
              className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
            />
          </div>
        </div>
      </div>

      {/* 5. Subject / Purpose */}
      <div className="space-y-1">
        <label className="block text-xs font-bold text-slate-300">
          3. Trích yếu nội dung / Tên chủ đề văn bản:
        </label>
        <input
          type="text"
          value={meta.subject}
          onChange={e => onChangeMeta({ ...meta, subject: e.target.value })}
          placeholder="VD: Về việc ban hành Kế hoạch tổ chức đợt sinh hoạt chính trị chuyên đề quý II/2026..."
          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-semibold focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {/* 6. Legal Bases */}
      <div className="space-y-1">
        <label className="block text-xs font-bold text-slate-300">
          4. Căn cứ pháp lý (Tùy chọn nhập hoặc để AI tự tra cứu luật liên quan):
        </label>
        <textarea
          value={meta.legalBases}
          onChange={e => onChangeMeta({ ...meta, legalBases: e.target.value })}
          rows={2}
          placeholder="VD: - Căn cứ Điều lệ Đảng; - Căn cứ Luật Giáo dục 2019; - Theo đề nghị của Tổ trưởng Chuyên môn..."
          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {/* 7. Signer & Authority */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <div>
          <label className="text-slate-400 block mb-1 font-semibold">Quyền hạn ký (Đề ký):</label>
          <input
            type="text"
            value={meta.signType}
            onChange={e => onChangeMeta({ ...meta, signType: e.target.value })}
            placeholder="VD: T/M CHI BỘ, HIỆU TRƯỞNG, TM. UBND..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-slate-400 block mb-1 font-semibold">Chức vụ người ký:</label>
          <input
            type="text"
            value={meta.signerTitle}
            onChange={e => onChangeMeta({ ...meta, signerTitle: e.target.value })}
            placeholder="VD: Bí thư Chi bộ / Hiệu trưởng..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-slate-400 block mb-1 font-semibold">Họ tên người ký:</label>
          <input
            type="text"
            value={meta.signerName}
            onChange={e => onChangeMeta({ ...meta, signerName: e.target.value })}
            placeholder="VD: Nguyễn Văn A (Không ghi GS, TS...)"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
          />
        </div>
      </div>

      {/* 8. Recipients (Nơi nhận) */}
      <div className="space-y-1">
        <label className="block text-xs font-bold text-slate-300">
          5. Nơi nhận (Danh sách cơ quan, bộ phận, cá nhân nhận văn bản):
        </label>
        <input
          type="text"
          value={meta.recipients}
          onChange={e => onChangeMeta({ ...meta, recipients: e.target.value })}
          placeholder="VD: Đảng ủy xã, Ban Giám hiệu, Các tổ chuyên môn, Lưu: VT..."
          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {/* 9. Main Content & Requirements */}
      <div className="space-y-1">
        <label className="block text-xs font-bold text-slate-300">
          6. Nội dung chi tiết & Các điều khoản cụ thể cần thể hiện:
        </label>
        <textarea
          value={meta.mainContent}
          onChange={e => onChangeMeta({ ...meta, mainContent: e.target.value })}
          rows={4}
          placeholder="Gõ các ý chính, yêu cầu nội dung, thời gian thực hiện, đối tượng phân công nhiệm vụ, các điều 1, 2, 3..."
          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none leading-relaxed"
        />
      </div>

      {/* Sample Reference Badge notification if active */}
      {activeSamples.length > 0 && (
        <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/50 flex items-center justify-between text-xs text-amber-300">
          <span className="flex items-center gap-1.5 font-semibold">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>AI sẽ đối chiếu & áp dụng cấu trúc từ {activeSamples.length} tài liệu mẫu đã quét!</span>
          </span>
          <span className="text-[11px] font-mono opacity-80">
            ({activeSamples.reduce((sum, s) => sum + s.extractedText.length, 0).toLocaleString('vi-VN')} ký tự)
          </span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating || !meta.subject.trim()}
        className="w-full py-3 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.01]"
      >
        {isGenerating ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
            <span>Đang Phân Tích & Soạn Thảo Toàn Văn Chuẩn Mực...</span>
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4 text-amber-300" />
            <span>✨ Soạn Thảo Toàn Văn Văn Bản Chuẩn 100% bằng AI</span>
          </>
        )}
      </button>
    </div>
  );
};
