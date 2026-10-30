import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Check,
  Copy,
  Sparkles,
  Layers,
  BookOpen,
  Cpu,
  CheckCircle2,
  Filter,
  ArrowRight,
  Plus,
  CheckSquare,
  Square,
  Zap,
  RotateCcw
} from 'lucide-react';
import { DIGITAL_COMPETENCY_DOMAINS } from '../../data/digitalCompetencyData';
import { AI_EDUCATION_STRANDS, AI_FRAMEWORK_REQUIREMENTS } from '../../data/aiEducationFrameworkData';

interface DigitalCompetencyAndAISelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAndInsert?: (text: string) => void;
  onApply?: (text: string) => void;
  onIntegrateDirectly?: (selectedText: string) => void;
  directIntegrateLabel?: string;
  defaultGrade?: string;
  gradeName?: string;
  subjectName?: string;
}

export const DigitalCompetencyAndAISelectorModal: React.FC<DigitalCompetencyAndAISelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectAndInsert,
  onApply,
  onIntegrateDirectly,
  directIntegrateLabel = 'Tích hợp vào Phụ lục chuẩn (Giữ nguyên bản)',
  defaultGrade,
  gradeName,
  subjectName
}) => {
  const effectiveGrade = gradeName || defaultGrade || 'Lớp 7';
  const callbackFn = onApply || onSelectAndInsert;
  const [activeTab, setActiveTab] = useState<'nls' | 'ai_framework'>('nls');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Derive initial grade group from defaultGrade
  const defaultGradeGroup = useMemo(() => {
    if (/lớp\s*[123]\b/i.test(effectiveGrade)) return 'L1-L2-L3';
    if (/lớp\s*[45]\b/i.test(effectiveGrade)) return 'L4-L5';
    if (/lớp\s*[67]\b/i.test(effectiveGrade)) return 'L6-L7';
    if (/lớp\s*[89]\b/i.test(effectiveGrade)) return 'L8-L9';
    if (/lớp\s*(10|11|12)\b/i.test(effectiveGrade)) return 'L10-L11-L12';
    return 'all';
  }, [effectiveGrade]);

  // Flatten NLS list
  const nlsList = useMemo(() => {
    const list: {
      id: string;
      domainCode: string;
      domainName: string;
      subCode: string;
      subName: string;
      gradeGroup: string;
      gradeLevelName: string;
      applicableGrades: string[];
      indicatorText: string;
    }[] = [];

    for (const domain of DIGITAL_COMPETENCY_DOMAINS) {
      for (const sub of domain.subCompetencies) {
        for (const lvl of sub.levels) {
          const lvlShortCode = lvl.gradeLevelName.match(/\(([A-Z0-9]+)\)/)?.[1] || (
            lvl.gradeGroup === 'L1-L2-L3' ? 'CB1' :
            lvl.gradeGroup === 'L4-L5' ? 'CB2' :
            lvl.gradeGroup === 'L6-L7' ? 'TC1' :
            lvl.gradeGroup === 'L8-L9' ? 'TC2' : 'NC1'
          );
          lvl.indicators.forEach((ind, idx) => {
            const letter = ind.match(/^([a-z])\s*[-–\.]/i)?.[1] || String.fromCharCode(97 + idx);
            const cleanText = ind.replace(/^[a-z]\s*[-–\.]\s*/i, '').trim();
            const formattedCode = `${sub.code}${lvlShortCode}${letter}`;
            const fullIndicatorText = `${formattedCode}: ${cleanText}`;

            list.push({
              id: `nls-${sub.code}-${lvl.gradeGroup}-${idx}`,
              domainCode: domain.code,
              domainName: domain.name,
              subCode: sub.code,
              subName: sub.name,
              gradeGroup: lvl.gradeGroup,
              gradeLevelName: lvl.gradeLevelName,
              applicableGrades: lvl.applicableGrades,
              indicatorText: fullIndicatorText
            });
          });
        }
      }
    }

    return list;
  }, []);

  // Filtered NLS
  const filteredNls = useMemo(() => {
    return nlsList.filter(item => {
      const matchSearch =
        !searchQuery.trim() ||
        item.indicatorText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.domainName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subCode.includes(searchQuery);

      const matchGrade =
        selectedGradeFilter === 'all' ||
        item.gradeGroup === selectedGradeFilter ||
        item.applicableGrades.some(g => g.toLowerCase().includes(selectedGradeFilter.toLowerCase()));

      const matchDomain =
        selectedDomainFilter === 'all' ||
        item.domainCode === selectedDomainFilter;

      return matchSearch && matchGrade && matchDomain;
    });
  }, [nlsList, searchQuery, selectedGradeFilter, selectedDomainFilter]);

  // Filtered AI Framework
  const filteredAiRequirements = useMemo(() => {
    return AI_FRAMEWORK_REQUIREMENTS.filter(item => {
      const matchSearch =
        !searchQuery.trim() ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.requirementText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.topicName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subContent.toLowerCase().includes(searchQuery.toLowerCase());

      const matchGrade =
        selectedGradeFilter === 'all' ||
        item.grade.toString() === selectedGradeFilter.replace('Lớp ', '').replace('L', '');

      const matchStrand =
        selectedDomainFilter === 'all' ||
        item.strandCode === selectedDomainFilter;

      return matchSearch && matchGrade && matchStrand;
    });
  }, [searchQuery, selectedGradeFilter, selectedDomainFilter]);

  // Current visible item strings
  const currentVisibleTexts = useMemo(() => {
    if (activeTab === 'nls') {
      return filteredNls.map(i => i.indicatorText);
    } else {
      return filteredAiRequirements.map(i => `[${i.code}] ${i.requirementText}`);
    }
  }, [activeTab, filteredNls, filteredAiRequirements]);

  // Check if all visible items are selected
  const isAllVisibleSelected = useMemo(() => {
    if (currentVisibleTexts.length === 0) return false;
    return currentVisibleTexts.every(txt => selectedItems.has(txt));
  }, [currentVisibleTexts, selectedItems]);

  const toggleItem = (text: string) => {
    const next = new Set(selectedItems);
    if (next.has(text)) {
      next.delete(text);
    } else {
      next.add(text);
    }
    setSelectedItems(next);
  };

  // Toggle select all visible items
  const handleToggleSelectAllVisible = () => {
    const next = new Set(selectedItems);
    if (isAllVisibleSelected) {
      currentVisibleTexts.forEach(txt => next.delete(txt));
    } else {
      currentVisibleTexts.forEach(txt => next.add(txt));
    }
    setSelectedItems(next);
  };

  // Select ALL 267 NLS items
  const handleSelectAllNls = () => {
    const next = new Set(selectedItems);
    nlsList.forEach(i => next.add(i.indicatorText));
    setSelectedItems(next);
    setCopiedNotification(`Đã chọn toàn bộ ${nlsList.length} chỉ báo năng lực số! AI sẽ tự động phân loại theo ${effectiveGrade} khi tạo tài liệu.`);
    setTimeout(() => setCopiedNotification(null), 4000);
  };

  // Smart Auto-Integrate All for Target Grade
  const handleAutoIntegrateAllSmart = () => {
    let nlsSampleCodes = '';
    let aiSampleCodes = '';

    if (/lớp\s*[123]\b/i.test(effectiveGrade)) {
      nlsSampleCodes = `  - 1.1CB1a: Tìm kiếm dữ liệu, thông tin đơn giản trong môi trường số dưới sự hướng dẫn của GV.
  - 1.3CB1b: Nhận biết cách lưu trữ và mở lại tệp bài học trên thiết bị số.
  - 2.1CB1a: Tương tác với phần mềm học tập, trò chơi học tập tương tác (Quizizz/Kahoot).
  - 5.2CB1a: Sử dụng các công cụ học tập số cơ bản phù hợp với lứa tuổi Tiểu học.`;
      aiSampleCodes = `  - 1.A1.1: Nhận biết con người có cảm xúc, AI thì không; phân biệt sản phẩm do con người tạo ra và AI hỗ trợ.
  - 2.A2.1: Nhận biết AI là công cụ hỗ trợ học tập, cần có sự đồng hành của thầy cô và cha mẹ.`;
    } else if (/lớp\s*[45]\b/i.test(effectiveGrade)) {
      nlsSampleCodes = `  - 1.1CB2b: Thực hiện các tìm kiếm dữ liệu, thông tin đơn giản có định hướng trên Internet.
  - 1.3CB2a: Sắp xếp tài liệu học tập vào các thư mục có trật tự.
  - 2.1CB2a: Sử dụng công cụ tương tác số để nộp bài và trao đổi với thầy cô, bạn bè.
  - 5.2CB2b: Lựa chọn phần mềm học tập số phù hợp để hoàn thành bài tập.`;
      aiSampleCodes = `  - 4.A1.1: Nêu được ví dụ về ứng dụng AI xung quanh và nhận biết vai trò hỗ trợ của AI.
  - 5.C1.1: Sử dụng công cụ AI đơn giản (tìm kiếm giọng nói, nhận diện hình ảnh) phục vụ học tập.`;
    } else if (/lớp\s*(10|11|12)\b/i.test(effectiveGrade)) {
      nlsSampleCodes = `  - 1.1NC1a: Đánh giá độ tin cậy và tính chính xác của dữ liệu, thông tin số từ nhiều nguồn.
  - 1.3NC1b: Quản trị và tổ chức cơ sở dữ liệu học tập cá nhân/nhóm trên nền tảng đám mây.
  - 2.1NC1a: Tương tác và cộng tác số thời gian thực qua các nền tảng học tập trực tuyến.
  - 5.2NC1b: Lựa chọn và ứng dụng linh hoạt các phần mềm chuyên dụng (GeoGebra, phần mềm mô phỏng) để giải quyết bài toán phức hợp.`;
      aiSampleCodes = `  - 10.A1.1: Phân tích vai trò của AI trong chuyển đổi số và phát triển kinh tế - xã hội.
  - 10.C2.1: Sử dụng thành thạo các mô hình ngôn ngữ lớn (Gemini, ChatGPT) để hỗ trợ nghiên cứu, giải bài tập và phản biện kiến thức.
  - 10.B1.1: Đánh giá các vấn đề đạo đức, bản quyền và tính liêm chính học thuật khi sử dụng AI.`;
    } else {
      // THCS (Lớp 6, 7, 8, 9)
      nlsSampleCodes = `  - 1.1TC1b: Thực hiện các tìm kiếm để tìm dữ liệu, thông tin và nội dung trong môi trường số (ví dụ: tìm kiếm ví dụ về bài học trong đời sống trên Internet).
  - 1.3TC1b: Sắp xếp dữ liệu, thông tin và nội dung một cách trật tự trong môi trường có cấu trúc (ví dụ: ghi chú bài học bằng phần mềm OneNote hoặc Google Docs).
  - 2.1TC1a: Thực hiện các tương tác với các công nghệ số (ví dụ: sử dụng bảng tương tác trực tuyến Mentimeter/Jamboard/Miro để trình bày bài tập nhóm).
  - 2.2TC1a: Lựa chọn công nghệ số phù hợp để xác định rõ ràng nơi trao đổi dữ liệu, thông tin và nội dung số (ví dụ: chia sẻ kết quả thảo luận nhóm qua Google Classroom/Zalo).
  - 5.2TC1b: Chọn được công cụ số thông thường và được xác định rõ ràng phù hợp với nhu cầu đó (ví dụ: dùng công cụ tìm kiếm hoặc ứng dụng học tập số hỗ trợ bài học).`;
      aiSampleCodes = `  - 6.1TC1a: Giải thích được nguyên tắc hoạt động cơ bản của AI (ví dụ: GV giải thích sơ lược cách AI phân loại hoặc gợi ý dữ liệu liên quan đến bài học).
  - 6.2TC1a: Sử dụng được các công cụ AI trong công việc và học tập hàng ngày (ví dụ: HS sử dụng chatbot (ChatGPT, Gemini) để hỏi về định nghĩa, yêu cầu đưa ra thêm ví dụ thực tế liên quan đến bài học).
  - 6.2TC1b: Thực hành được các kỹ năng sử dụng AI thông qua các bài tập và dự án nhỏ (ví dụ: HS yêu cầu AI tạo ra bài tập tương tự hoặc gợi ý ý tưởng thực hiện).
  - 6.2TC1c: Nhắc nhở HS xem xét các khía cạnh đạo đức và tính chính xác khi sử dụng AI trong học tập.`;
    }

    const smartDirective = `- NĂNG LỰC SỐ (Căn cứ TT 02/2025/TT-BGDĐT - Khối ${effectiveGrade}):
${nlsSampleCodes}

- NĂNG LỰC AI (Căn cứ QĐ 2422/QĐ-BGDĐT / Khung năng lực AI - Khối ${effectiveGrade}):
${aiSampleCodes}

- YÊU CẦU TÍCH HỢP VÀO GIÁO ÁN:
  + Đưa toàn bộ các mã chỉ báo Năng lực số và Năng lực AI ở trên vào Mục I.2 (Năng lực) trong Kế hoạch bài dạy.
  + Gắn trực tiếp mã chỉ báo tương ứng vào từng bước của các hoạt động trong Mục III (Tiến trình dạy học) với thẻ định dạng: (Năng lực số [Mã chỉ báo]: [Hành động cụ thể]) và (Năng lực AI [Mã chỉ báo]: [Hành động cụ thể]).`;

    if (callbackFn) {
      callbackFn(smartDirective);
    }
    onClose();
  };

  const handleCopySelected = () => {
    if (selectedItems.size === 0) return;
    const textToCopy = Array.from(selectedItems).join('\n- ');
    navigator.clipboard.writeText(`- ${textToCopy}`);
    setCopiedNotification(`Đã sao chép ${selectedItems.size} chỉ báo vào bộ nhớ tạm!`);
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  const handleInsertSelected = () => {
    if (selectedItems.size === 0) return;
    const nlsSelected: string[] = [];
    const aiSelected: string[] = [];

    Array.from(selectedItems).forEach(txt => {
      if (txt.startsWith('[') || /^\d+\.[A-Z]\d+/i.test(txt) || /^6\./.test(txt)) {
        aiSelected.push(txt);
      } else {
        nlsSelected.push(txt);
      }
    });

    let resultText = '';
    if (nlsSelected.length > 0) {
      resultText += `- **Năng lực số (TT 02/2025/TT-BGDĐT):**\n  + ` + nlsSelected.join('\n  + ');
    }
    if (aiSelected.length > 0) {
      if (resultText) resultText += '\n\n';
      resultText += `- **Năng lực AI (QĐ 2422/QĐ-BGDĐT):**\n  + ` + aiSelected.join('\n  + ');
    }

    if (callbackFn) {
      callbackFn(resultText || Array.from(selectedItems).join('\n- '));
    }
    onClose();
  };

  const handleIntegrateDirectly = () => {
    let resultText = '';
    if (selectedItems.size > 0) {
      const nlsSelected: string[] = [];
      const aiSelected: string[] = [];

      Array.from(selectedItems).forEach(txt => {
        if (txt.startsWith('[') || /^\d+\.[A-Z]\d+/i.test(txt) || /^6\./.test(txt)) {
          aiSelected.push(txt);
        } else {
          nlsSelected.push(txt);
        }
      });

      if (nlsSelected.length > 0) {
        resultText += `- **Năng lực số (TT 02/2025/TT-BGDĐT):**\n  + ` + nlsSelected.join('\n  + ');
      }
      if (aiSelected.length > 0) {
        if (resultText) resultText += '\n\n';
        resultText += `- **Năng lực AI (QĐ 2422/QĐ-BGDĐT):**\n  + ` + aiSelected.join('\n  + ');
      }
    }

    if (onIntegrateDirectly) {
      onIntegrateDirectly(resultText || Array.from(selectedItems).join('\n- '));
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[92vh] max-h-[880px] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-pink-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Khung Chỉ Báo Năng Lực Số & Khung Giáo Dục AI Chuẩn Bộ GD&ĐT</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  TT 02/2025 & QĐ 2422/QĐ-BGDĐT
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Chọn nhanh các chỉ số hành vi năng lực số và yêu cầu cần đạt AI để chèn trực tiếp vào Kế hoạch bài dạy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-4 pt-3 bg-slate-950 flex items-center gap-2 border-b border-slate-800">
          <button
            onClick={() => {
              setActiveTab('nls');
              setSelectedDomainFilter('all');
            }}
            className={`pb-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'nls'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-950/30 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>1. Bảng Mã Chỉ Báo Năng Lực Số (Phụ Lục 1 - TT 02/2025)</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
              {nlsList.length} chỉ báo
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ai_framework');
              setSelectedDomainFilter('all');
            }}
            className={`pb-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'ai_framework'
                ? 'border-pink-500 text-pink-400 bg-pink-950/30 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>2. Khung Nội Dung Giáo Dục Trí Tuệ Nhân Tạo (QĐ 2422/QĐ-BGDĐT)</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-pink-950/60 text-pink-300 border border-pink-700/40">
              Lớp 1 - 12
            </span>
          </button>
        </div>

        {/* Smart 1-Click Auto-Integration Banner */}
        <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/70 p-3 px-4 border-b border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5 sm:mt-0">
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-xs">Tùy chọn Nhanh: Tự động Tích hợp Toàn bộ theo {effectiveGrade}</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-semibold">Khuyến nghị</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                AI sẽ tự nhận diện khối lớp {effectiveGrade} và nội dung bài để chọn lọc & gán đúng chuẩn các chỉ số hành vi NLS & AI phù hợp nhất.
              </p>
            </div>
          </div>
          <button
            onClick={handleAutoIntegrateAllSmart}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-900/50 flex items-center justify-center gap-1.5 transition-all shrink-0 hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>🌟 Tích Hợp Toàn Bộ Thông Minh (1 Chạm)</span>
          </button>
        </div>

        {/* Filters Toolbar */}
        <div className="p-3 bg-slate-900/90 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm theo từ khóa (dữ liệu, an toàn, prompt, đạo đức...)"
              className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Grade Filter */}
          <div>
            <select
              value={selectedGradeFilter}
              onChange={e => setSelectedGradeFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="all">-- Tất cả Khối / Cấp học --</option>
              {activeTab === 'nls' ? (
                <>
                  <option value="L1-L2-L3">Tiểu học: Lớp 1 - 2 - 3 (Cơ bản 1 - CB1)</option>
                  <option value="L4-L5">Tiểu học: Lớp 4 - 5 (Cơ bản 2 - CB2)</option>
                  <option value="L6-L7">THCS: Lớp 6 - 7 (Trung cấp 1 - TC1)</option>
                  <option value="L8-L9">THCS: Lớp 8 - 9 (Trung cấp 2 - TC2)</option>
                  <option value="L10-L11-L12">THPT: Lớp 10 - 11 - 12 (Nâng cao 1 - NC1)</option>
                </>
              ) : (
                <>
                  <option value="1">Lớp 1</option>
                  <option value="2">Lớp 2</option>
                  <option value="3">Lớp 3</option>
                  <option value="4">Lớp 4</option>
                  <option value="5">Lớp 5</option>
                  <option value="6">Lớp 6</option>
                  <option value="7">Lớp 7</option>
                  <option value="8">Lớp 8</option>
                  <option value="9">Lớp 9</option>
                  <option value="10">Lớp 10</option>
                  <option value="11">Lớp 11</option>
                  <option value="12">Lớp 12</option>
                </>
              )}
            </select>
          </div>

          {/* Domain / Strand Filter */}
          <div>
            <select
              value={selectedDomainFilter}
              onChange={e => setSelectedDomainFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="all">-- Tất cả Mạch / Miền năng lực --</option>
              {activeTab === 'nls' ? (
                DIGITAL_COMPETENCY_DOMAINS.map(d => (
                  <option key={d.code} value={d.code}>
                    {d.name}
                  </option>
                ))
              ) : (
                AI_EDUCATION_STRANDS.map(s => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Quick Batch Selection Bar */}
        <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSelectAllVisible}
              className={`px-3 py-1.5 rounded-lg border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                isAllVisibleSelected
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-900/50'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              {isAllVisibleSelected ? (
                <CheckSquare className="w-3.5 h-3.5 text-amber-300" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>
                {isAllVisibleSelected
                  ? `Đã chọn tất cả ${currentVisibleTexts.length} mục đang lọc (Bấm để hủy)`
                  : `✓ Chọn tất cả (${currentVisibleTexts.length} mục đang hiển thị)`}
              </span>
            </button>

            {activeTab === 'nls' && (
              <button
                onClick={handleSelectAllNls}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 font-medium text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                title="Chọn toàn bộ 267 chỉ báo trong khung năng lực số TT 02/2025"
              >
                <Layers className="w-3 h-3 text-indigo-400" />
                <span>Chọn toàn bộ 267 chỉ báo</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">
              Đang chọn: <strong className="text-cyan-400 font-mono">{selectedItems.size}</strong> mục
            </span>
            {selectedItems.size > 0 && (
              <button
                onClick={() => setSelectedItems(new Set())}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Bỏ chọn</span>
              </button>
            )}
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {copiedNotification && (
            <div className="p-2.5 bg-emerald-950/80 border border-emerald-600 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{copiedNotification}</span>
            </div>
          )}

          {activeTab === 'nls' ? (
            filteredNls.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Không tìm thấy chỉ báo phù hợp với bộ lọc.
              </div>
            ) : (
              filteredNls.map(item => {
                const isChecked = selectedItems.has(item.indicatorText);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.indicatorText)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isChecked
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-950/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Handled by div click
                        className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="font-bold text-indigo-300 font-mono px-2 py-0.5 bg-indigo-950/80 rounded border border-indigo-800/60">
                          {item.subCode}
                        </span>
                        <span className="font-semibold text-slate-300">{item.subName}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-medium">
                          {item.gradeGroup} ({item.gradeLevelName})
                        </span>
                      </div>
                      <p className="text-xs text-slate-100 leading-relaxed font-normal">
                        {item.indicatorText}
                      </p>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            filteredAiRequirements.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Không tìm thấy yêu cầu cần đạt AI phù hợp với bộ lọc.
              </div>
            ) : (
              filteredAiRequirements.map(item => {
                const formatted = `[${item.code}] ${item.requirementText}`;
                const isChecked = selectedItems.has(formatted);
                return (
                  <div
                    key={item.code}
                    onClick={() => toggleItem(formatted)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isChecked
                        ? 'bg-pink-950/40 border-pink-500 shadow-md shadow-pink-950/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Handled by div click
                        className="w-4 h-4 rounded text-pink-600 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="font-bold text-pink-300 font-mono px-2 py-0.5 bg-pink-950/80 rounded border border-pink-800/60">
                          Mã: {item.code}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-purple-900/60 text-purple-200">
                          Lớp {item.grade}
                        </span>
                        <span className="font-semibold text-slate-300">
                          Mạch {item.strandCode}: {item.topicName}
                        </span>
                        {item.isExtended && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-900/60 text-amber-200 border border-amber-700/50">
                            Nội dung Mở rộng (MR)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 italic">
                        Nội dung: {item.subContent}
                      </div>
                      <p className="text-xs text-slate-100 leading-relaxed font-normal">
                        {item.requirementText}
                      </p>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>

        {/* Bottom Actions Toolbar */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">
              Đã chọn: <strong className="text-white font-mono">{selectedItems.size}</strong> mục
            </span>
            {selectedItems.size > 0 && (
              <button
                onClick={() => setSelectedItems(new Set())}
                className="text-slate-500 hover:text-slate-300 text-[11px] underline ml-2"
              >
                Bỏ chọn tất cả
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopySelected}
              disabled={selectedItems.size === 0}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-semibold rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Sao chép ({selectedItems.size})</span>
            </button>

            {onIntegrateDirectly && (
              <button
                onClick={handleIntegrateDirectly}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 flex items-center gap-1.5 transition-all"
                title="Tích hợp các năng lực đã chọn vào phụ lục hiện tại mà KHÔNG làm thay đổi nội dung, bảng biểu và định dạng"
              >
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>{directIntegrateLabel}</span>
              </button>
            )}

            {callbackFn && (
              <button
                onClick={handleInsertSelected}
                disabled={selectedItems.size === 0}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:opacity-40 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Chèn vào Giáo án / Kế hoạch ({selectedItems.size})</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
