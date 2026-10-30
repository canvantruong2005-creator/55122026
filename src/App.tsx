import React, { useState, useEffect, useRef } from 'react';
import { generateGeminiText, generateGeminiVision } from './lib/geminiApi';
import { readFileAsText, MULTIMODAL_OCR_AND_DIAGRAM_PROMPT } from './lib/fileUtils';
import { ClassProfile, ExamResultItem } from './types';
import { DEFAULT_PROFILES, DEFAULT_PP, DEFAULT_KT } from './data/defaults';
import { HeaderBanner } from './components/HeaderBanner';
import { ApiGuideModal } from './components/ApiGuideModal';
import { LicenseModal } from './components/LicenseModal';
import { LicenseGate } from './components/LicenseGate';
import { checkIsKeyValid, validateLicenseKey, STORAGE_KEY_SAVED_LICENSE, fetchServerLicenses, subscribeToLicenses } from './lib/licenseUtils';
import { initPresenceHeartbeat } from './lib/presenceService';

import { Tab1ClassProfile } from './components/tabs/Tab1ClassProfile';
import { Tab2ReferenceSGK } from './components/tabs/Tab2ReferenceSGK';
import { Tab3EditorExport } from './components/tabs/Tab3EditorExport';
import { Tab4ExamGenerator } from './components/tabs/Tab4ExamGenerator';
import { Tab5MaterialsAudio } from './components/tabs/Tab5MaterialsAudio';
import { Tab6VisionGrading } from './components/tabs/Tab6VisionGrading';
import { Tab7AIChatbot } from './components/tabs/Tab7AIChatbot';
import { Tab8EducationPlan5512 } from './components/tabs/Tab8EducationPlan5512';
import { Tab9PersonalDepartmentPlan } from './components/tabs/Tab9PersonalDepartmentPlan';
import { Tab10Introduction } from './components/tabs/Tab10Introduction';
import { Tab11CommunityRepository } from './components/tabs/Tab11CommunityRepository';
import { Tab12TeacherForum } from './components/tabs/Tab12TeacherForum';
import { Tab13InteractiveSimulations } from './components/tabs/Tab13InteractiveSimulations';
import { Tab14DocComparisonSynthesis } from './components/tabs/Tab14DocComparisonSynthesis';
import { Tab15DocumentFormatChecker } from './components/tabs/Tab15DocumentFormatChecker';
import { FloatingAIChatbot } from './components/FloatingAIChatbot';
import { VoiceAndDocConverterModal } from './components/VoiceAndDocConverterModal';
import { stripIntroductoryChatter, formatVietnameseDate } from './lib/wordExport';
import { sanitizeMathForVietnamese } from './lib/mathSanitizer';
import { normalizeVietnameseTerminology, parsePeriodDurationMinutes, calculateActivityTimeAllocation, rebalanceLessonPlanActivityDurations } from './lib/terminologyUtils';
import { buildPedagogicalMethodInstruction } from './lib/pedagogicalFrameworks';

import { Settings, BookOpen, Layers, FileEdit, Target, Volume2, Camera, MessageSquare, Sparkles, Code, HelpCircle, FolderOpen, Users, MessageCircle, Atom, SplitSquareVertical, FileCheck, Briefcase } from 'lucide-react';


// Helper functions for parsing period structure from user input
function parsePeriodPPCTList(periodStr: string, numDuration: number): string[] {
  const parts = periodStr.split(/[,;\-]/).map(s => s.trim()).filter(Boolean);
  if (parts.length >= numDuration) {
    return parts.slice(0, numDuration);
  }
  const startNum = parseInt(parts[0]) || 1;
  const list: string[] = [];
  for (let i = 0; i < numDuration; i++) {
    list.push(String(startNum + i));
  }
  return list;
}

function parsePeriodTopics(boundary: string, numDuration: number): string[] {
  if (!boundary || boundary.trim().toLowerCase() === 'tùy ý') {
    const res: string[] = [];
    for (let i = 1; i <= numDuration; i++) {
      res.push(`Nội dung Tiết ${i}`);
    }
    return res;
  }

  // Look for explicit "Tiết 1:", "Tiết 2:", etc.
  const tietMatches = boundary.split(/(?=tiết\s*\d+\s*[:\-\.])/i).map(s => s.trim()).filter(Boolean);
  if (tietMatches.length >= numDuration) {
    return tietMatches.slice(0, numDuration).map(s => {
      return s.replace(/^tiết\s*\d+\s*[:\-\.]\s*/i, '').replace(/[.;]+$/, '').trim() || s;
    });
  }

  // Try split by '.', ';', '|', '\n'
  let splitParts = boundary.split(/[.;|\n]/).map(s => s.trim()).filter(Boolean);
  if (splitParts.length < numDuration) {
    const commaParts = boundary.split(',').map(s => s.trim()).filter(Boolean);
    if (commaParts.length >= numDuration) {
      splitParts = commaParts;
    }
  }

  const res: string[] = [];
  for (let i = 0; i < numDuration; i++) {
    if (splitParts[i]) {
      const clean = splitParts[i].replace(/^tiết\s*\d+\s*[:\-\.]\s*/i, '').replace(/[.;]+$/, '').trim();
      res.push(clean || `Nội dung Tiết ${i + 1}`);
    } else {
      res.push(`Luyện tập & Củng cố Tiết ${i + 1}`);
    }
  }
  return res;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<number>(1);

  // Status & Control
  const [statusMessage, setStatusMessage] = useState('Hệ thống AI Lesson Planner Pro đã sẵn sàng!');
  const [statusType, setStatusType] = useState<'idle' | 'loading' | 'success' | 'warning' | 'error'>('idle');
  const [isPaused, setIsPaused] = useState(false);

  // Modals
  const [isApiGuideOpen, setIsApiGuideOpen] = useState(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [isVoiceDocModalOpen, setIsVoiceDocModalOpen] = useState(false);
  const [voiceDocInitialTab, setVoiceDocInitialTab] = useState<'pdf_to_word' | 'word_to_pdf' | 'doc_to_speech'>('pdf_to_word');

  // License key & authorization gate
  const [licenseKey, setLicenseKey] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_SAVED_LICENSE) || '';
  });

  const [isLicenseUnlocked, setIsLicenseUnlocked] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SAVED_LICENSE) || '';
    return checkIsKeyValid(saved);
  });

  useEffect(() => {
    if (licenseKey) {
      try {
        localStorage.setItem(STORAGE_KEY_SAVED_LICENSE, licenseKey);
      } catch (e) {}
    }
    const isValid = checkIsKeyValid(licenseKey);
    setIsLicenseUnlocked(isValid);
    if (isValid && statusMessage === 'Đã đăng xuất tài khoản an toàn.') {
      setStatusMessage('Hệ thống AI Lesson Planner Pro đã sẵn sàng!');
      setStatusType('idle');
    }

    // Realtime Cloud synchronization
    const unsubscribe = subscribeToLicenses(() => {
      const valid = checkIsKeyValid(licenseKey);
      setIsLicenseUnlocked(valid);
      if (valid && statusMessage === 'Đã đăng xuất tài khoản an toàn.') {
        setStatusMessage('Hệ thống AI Lesson Planner Pro đã sẵn sàng!');
        setStatusType('idle');
      }
    });

    // Also perform initial fetch
    fetchServerLicenses().then(() => {
      const valid = checkIsKeyValid(licenseKey);
      setIsLicenseUnlocked(valid);
      if (valid && statusMessage === 'Đã đăng xuất tài khoản an toàn.') {
        setStatusMessage('Hệ thống AI Lesson Planner Pro đã sẵn sàng!');
        setStatusType('idle');
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [licenseKey]);

  // Track activeTab in ref for stable non-retriggering presence reporting
  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Global Realtime Presence Heartbeat across nationwide teachers (mounted once)
  useEffect(() => {
    const unsubPresenceHeartbeat = initPresenceHeartbeat(undefined, () => `Tab ${activeTabRef.current}`);
    return () => {
      unsubPresenceHeartbeat();
    };
  }, []);

  // App Theme state ('default' | 'dark' | 'light')
  const [theme, setTheme] = useState<'default' | 'dark' | 'light'>(() => {
    try {
      return (localStorage.getItem('app_theme') as any) || 'default';
    } catch (e) {
      return 'default';
    }
  });

  const handleThemeChange = (newTheme: 'default' | 'dark' | 'light') => {
    setTheme(newTheme);
    try {
      localStorage.setItem('app_theme', newTheme);
    } catch (e) {}
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_SAVED_LICENSE);
    } catch (e) {}
    setLicenseKey('');
    setIsLicenseUnlocked(false);
    setIsLicenseModalOpen(false);
    setStatusMessage('Đã đăng xuất tài khoản an toàn.');
    setStatusType('warning');
  };

  // Saved Profiles
  const [savedProfiles, setSavedProfiles] = useState<Record<string, ClassProfile>>(() => {
    const local = localStorage.getItem('class_profiles_v48');
    return local ? JSON.parse(local) : DEFAULT_PROFILES;
  });

  // Current Profile with persistence
  const [profile, setProfile] = useState<ClassProfile>(() => {
    try {
      const saved = localStorage.getItem('current_profile_v48');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return savedProfiles['7A1'] || DEFAULT_PROFILES['7A1'] || {
      lop: '7A1',
      mon: 'Toán học',
      phan_mon: 'Đại số',
      siso: '45',
      nangluc: 'Đại trà, nhiều trình độ',
      thoiluong: '45 phút (THCS / THPT)',
      loaiga: 'Giáo án Bài học chuẩn 5512',
      ngaysoan: new Date().toISOString().split('T')[0],
      boSach: 'Kết nối tri thức với cuộc sống',
      sgkTap: 'Tập 1',
      monTichHop: 'Vật lí, Tin học, Thực tiễn',
      bghSigner: 'Bùi Sỹ Nghĩa',
      deptSigner: 'Tổ trưởng chuyên môn',
      teacherSigner: 'Giáo viên bộ môn',
      k1Periods: 72,
      k2Periods: 68,
      totalYearPeriods: 140
    };
  });

  // Auto-save current profile to localStorage for future sessions
  useEffect(() => {
    if (profile) {
      localStorage.setItem('current_profile_v48', JSON.stringify(profile));
    }
  }, [profile]);

  // Lessons text
  const [lessonText, setLessonText] = useState(
    'Bài 1: Tập hợp các số tự nhiên | 2 | 1, 2 | Tiết 1: Định nghĩa & Phần tử. Tiết 2: Luyện tập phép toán'
  );

  // Multi-period goal split toggle (default: false = single general goal for whole multi-period lesson)
  const [isSplitMultiPeriodGoals, setIsSplitMultiPeriodGoals] = useState(false);

  // PP & KT
  const [ppList, setPpList] = useState<string[]>(DEFAULT_PP);
  const [ktList, setKtList] = useState<string[]>(DEFAULT_KT);
  const [selectedPP, setSelectedPP] = useState<string>(DEFAULT_PP[0]);
  const [selectedKT, setSelectedKT] = useState<string>(DEFAULT_KT[0]);

  // Specific goals
  const [specificGoals, setSpecificGoals] = useState(
    'Nếu bài học thuộc môn Toán hoặc Khoa học Tự nhiên có hình vẽ, BẮT BUỘC cung cấp mã TikZ vẽ hình độc lập trong thẻ \\begin{tikzpicture} ... \\end{tikzpicture}.'
  );

  // SGK & References
  const [sgkFile, setSgkFile] = useState<File | null>(null);
  const [sgkImageDataUrl, setSgkImageDataUrl] = useState<string>('');
  const [pageStart, setPageStart] = useState<number>(1);
  const [pageEnd, setPageEnd] = useState<number>(10);
  const [referenceCacheText, setReferenceCacheText] = useState<string>(() => {
    try {
      return localStorage.getItem('sgk_reference_cache_text_v48') || '';
    } catch (e) {
      return '';
    }
  });

  // Auto-save referenceCacheText to localStorage for seamless tab switching and persistence
  useEffect(() => {
    try {
      if (referenceCacheText) {
        localStorage.setItem('sgk_reference_cache_text_v48', referenceCacheText);
      }
    } catch (e) {}
  }, [referenceCacheText]);


  const handleSgkFileChange = (file: File | null) => {
    setSgkFile(file);
    if (!file) {
      setSgkImageDataUrl('');
      return;
    }

    if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(file.name)) {
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result as string;
        if (result) {
          setSgkImageDataUrl(result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setSgkImageDataUrl('');
    }
  };

  // API Keys
  const [apiKeysInput, setApiKeysInput] = useState<string>(() => {
    return localStorage.getItem('gemini_api_keys_v48') || '';
  });

  // Content & Export
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [headerText, setHeaderText] = useState('Kế hoạch bài dạy.......');
  const [footerText, setFooterText] = useState('Trường THCS Phùng Khắc Khoan');
  const [watermarkText, setWatermarkText] = useState('BẢN QUYỀN: THẦY CẤN VĂN TRƯỜNG - THCS PHÙNG KHẮC KHOAN - 0988.302.636');
  const [showPageNumbers, setShowPageNumbers] = useState(true);

  // Exam Grading Results
  const [examResults, setExamResults] = useState<ExamResultItem[]>(() => {
    const local = localStorage.getItem('exam_results_v48');
    return local ? JSON.parse(local) : [];
  });

  const [isGenerating, setIsGenerating] = useState(false);

  // Save state on changes
  useEffect(() => {
    localStorage.setItem('class_profiles_v48', JSON.stringify(savedProfiles));
  }, [savedProfiles]);

  useEffect(() => {
    localStorage.setItem('gemini_api_keys_v48', apiKeysInput);
  }, [apiKeysInput]);

  useEffect(() => {
    localStorage.setItem('exam_results_v48', JSON.stringify(examResults));
  }, [examResults]);

  // Profile save/delete
  const handleSaveProfile = () => {
    if (!profile.lop.trim()) {
      alert('Chưa nhập tên Lớp!');
      return;
    }
    setSavedProfiles(prev => ({
      ...prev,
      [profile.lop]: profile
    }));
    alert(`Đã lưu hồ sơ Lớp ${profile.lop}!`);
  };

  const handleDeleteProfile = () => {
    if (!profile.lop.trim()) return;
    setSavedProfiles(prev => {
      const copy = { ...prev };
      delete copy[profile.lop];
      return copy;
    });
  };

  // PP & KT handlers
  const handleAddPP = (pp: string) => {
    if (!ppList.includes(pp)) {
      setPpList([...ppList, pp]);
      setSelectedPP(pp);
    }
  };

  const handleDelPP = (pp: string) => {
    const updated = ppList.filter(p => p !== pp);
    setPpList(updated);
    if (updated.length > 0) setSelectedPP(updated[0]);
  };

  const handleAddKT = (kt: string) => {
    if (!ktList.includes(kt)) {
      setKtList([...ktList, kt]);
      setSelectedKT(kt);
    }
  };

  const handleDelKT = (kt: string) => {
    const updated = ktList.filter(k => k !== kt);
    setKtList(updated);
    if (updated.length > 0) setSelectedKT(updated[0]);
  };

  // Extract reference memory cache
  const handleExtractReferences = async () => {
    setStatusMessage('Đang nạp bộ nhớ đệm tham chiếu...');
    setStatusType('loading');

    const apiKeys = apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);

    let extractedText = '';

    // 1. Extract main SGK file with page range selection if provided
    if (sgkFile) {
      try {
        setStatusMessage(`Đang trích xuất file SGK ${sgkFile.name} (trang ${pageStart} đến ${pageEnd})...`);
        const maxPages = pageEnd >= pageStart ? pageEnd - pageStart + 1 : 10;
        const sgkText = await readFileAsText(sgkFile, {
          startPage: pageStart,
          maxPages
        });
        if (sgkText) {
          extractedText += '\n' + sgkText + '\n';
        }
      } catch (err) {
        console.warn('Lỗi đọc file SGK:', err);
      }
    }

    // 2. OCR cropped SGK image if provided
    if (sgkImageDataUrl && apiKeys.length > 0) {
      try {
        setStatusMessage('Đang dùng Gemini Vision đọc hiểu văn bản & phân tích chi tiết hình vẽ SGK...');
        const ocrText = await generateGeminiVision({
          prompt: MULTIMODAL_OCR_AND_DIAGRAM_PROMPT,
          imageBase64: sgkImageDataUrl,
          apiKeys
        });
        if (ocrText) {
          extractedText += `\n--- [NỘI DUNG AI ĐỌC HIỂU HÌNH VẼ & VĂN BẢN TỪ ẢNH SGK: ${sgkFile?.name || 'Trang SGK'}] ---\n` + ocrText + '\n';
        }
      } catch (err) {
        console.warn('Lỗi OCR ảnh SGK:', err);
      }
    }

    if (extractedText) {
      setReferenceCacheText(prev => prev + '\n' + extractedText);
      setStatusMessage('Đã trích xuất nội dung SGK và nạp vào bộ nhớ đệm thành công!');
      setStatusType('success');
    } else {
      setTimeout(() => {
        setStatusMessage('Đã nạp bộ nhớ đệm tham chiếu thành công!');
        setStatusType('success');
      }, 600);
    }
  };

  // AI Generation Engine for Lesson Plans
  const handleStartAIGeneration = async () => {
    const apiKeys = apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);

    if (!lessonText.trim()) {
      alert('Vui lòng nhập Danh sách Bài học ở Tab 1!');
      setActiveTab(1);
      return;
    }

    setIsGenerating(true);
    setStatusMessage('Đang kết nối AI (Hệ thống 3 Key xoay vòng) và phân tích bài học...');
    setStatusType('loading');

    const targetPeriodMinutes = parsePeriodDurationMinutes(profile.thoiluong);
    const timeAlloc = calculateActivityTimeAllocation(targetPeriodMinutes);

    // Parse lesson items
    const rawLines = lessonText.split('\n').map(l => l.trim()).filter(Boolean);
    let compiledMarkdown = '';

    for (let idx = 0; idx < rawLines.length; idx++) {
      const line = rawLines[idx];
      const parts = line.split('|').map(p => p.trim());
      const lessonName = parts[0] || 'Bài 1';
      const cleanTitle = lessonName.trim();
      const duration = parts[1] || '1';
      const period = parts[2] || '1';
      const boundary = parts[3] || 'Tùy ý';

      const numDuration = parseInt(duration) || 1;
      const periodPPCTList = parsePeriodPPCTList(period, numDuration);
      const periodTopicList = parsePeriodTopics(boundary, numDuration);
      const periodPPCTDisplay = periodPPCTList.length > 1 ? periodPPCTList.join(', ') : (periodPPCTList[0] || period);

      const periodBreakdownSummary = periodTopicList.map((topic, i) =>
        `  * TIẾT ${i + 1} (Tiết PPCT ${periodPPCTList[i]}): ${topic}`
      ).join('\n');

      // Construct specific instructions depending on lesson type (loaiga)
      let lessonTypeInstruction = '';
      if (profile.loaiga?.includes('Tích hợp') || profile.loaiga?.includes('Liên môn')) {
        const integratedSubs = profile.monTichHop?.trim() || 'Vật lí, Hóa học, Sinh học, Lịch sử, Địa lí, Công nghệ, Tin học, GDCD';
        lessonTypeInstruction = `
QUY TẮC BẮT BUỘC DÀNH CHO GIÁO ÁN TÍCH HỢP LIÊN MÔN:
1. Môn học chủ đạo: ${profile.mon} (${profile.phan_mon}).
2. Môn học / Lĩnh vực tích hợp liên môn kết nối: ${integratedSubs}.
3. Yêu cầu trong I. MỤC TIÊU:
   - Thể hiện rõ Yêu cầu cần đạt về Kiến thức & Năng lực TÍCH HỢP LIÊN MÔN giữa ${profile.mon} và các môn (${integratedSubs}).
   - Nêu rõ cách giải quyết bài toán / vấn đề thực tiễn đòi hỏi vận dụng tổng hợp kiến thức liên môn.
4. Yêu cầu trong III. TIẾN TRÌNH DẠY HỌC:
   - Tại từng Hoạt động (Khởi động, Hình thành kiến thức mới, Luyện tập, Vận dụng), BẮT BUỘC ghi rõ ĐỊA CHỈ VÀ NỘI DUNG TÍCH HỢP LIÊN MÔN (Ví dụ: '[Tích hợp Liên môn: Vận dụng kiến thức từ các môn ${integratedSubs} để làm rõ...]').
   - Đưa vào các câu hỏi mở, bài tập tình huống thực tiễn và câu hỏi liên môn thực tế giúp học sinh phát triển năng lực giải quyết vấn đề phức hợp.
`;
      } else if (profile.loaiga?.includes('STEM')) {
        lessonTypeInstruction = `
QUY TẮC BẮT BUỘC DÀNH CHO GIÁO ÁN CHUYÊN ĐỀ / STEM / STEAM:
- Xây dựng theo quy trình Thiết kế Kỹ thuật (EDP) hoặc Quy trình 5 bước STEM.
- Chỉ rõ Sản phẩm STEM học sinh chế tạo/thiết kế và Bảng Tiêu chí đánh giá sản phẩm STEM.
`;
      } else if (profile.loaiga?.includes('Trải nghiệm')) {
        lessonTypeInstruction = `
QUY TẮC BẮT BUỘC DÀNH CHO GIÁO ÁN HOẠT ĐỘNG TRẢI NGHIỆM / HƯỚNG NGHIỆP:
- Tập trung vào các hoạt động trải nghiệm thực tế, rèn luyện kỹ năng sống, làm việc nhóm, lập kế hoạch và tự đánh giá.
`;
      }

      // Construct Multi-Period split goals instruction if option enabled and duration >= 2
      let goalStructureInstruction = '';
      if (isSplitMultiPeriodGoals && numDuration >= 2) {
        goalStructureInstruction = `
QUY TẮC CẤU TRÚC MỤC TIÊU BÀI HỌC ${numDuration} TIẾT (CHUẨN CÔNG VĂN 5512 - QUY ĐỊNH BẮT BUỘC):
Vì bài học có thời lượng ${numDuration} tiết (Tiết PPCT: ${periodPPCTDisplay}), BẮT BUỘC tuân thủ tuyệt đối cấu trúc mục tiêu sau:

**I. MỤC TIÊU**
**A. MỤC TIÊU CHUNG CỦA TOÀN BÀI HỌC (${numDuration} TIẾT):**
**1. Kiến thức:** Nêu rõ các khái niệm, quy tắc, công thức, định lý cốt lõi cần nắm vững trong cả ${numDuration} tiết.
**2. Năng lực:**
- **Năng lực chung:**
  + Tự chủ và tự học: Chủ động đọc SGK, tự giác thực hiện các nhiệm vụ học tập cá nhân và nhóm.
  + Giao tiếp và hợp tác: Tương tác tích cực, thảo luận, phản biện, lắng nghe và chia sẻ kết quả học tập.
  + Giải quyết vấn đề và sáng tạo: Vận dụng linh hoạt kiến thức đã học để giải quyết các tình huống thực tiễn.
- **Năng lực đặc thù:**
  + Năng lực tư duy và lập luận toán học: Phân tích, so sánh và suy luận logic để tìm ra tính chất toán học.
  + Năng lực mô hình hóa toán học: Chuyển đổi tình huống thực tế thành bài toán toán học.
  + Năng lực giải quyết vấn đề toán học: Sử dụng công cụ và phương pháp phù hợp để giải bài toán.
  + Năng lực giao tiếp toán học: Trình bày và giải thích lập luận mạch lạc, rõ ràng.
  + Năng lực sử dụng công cụ, phương tiện học toán: Sử dụng máy tính bỏ túi, thước kẻ, phần mềm hình học.
- **Năng lực số (TT 02/2025/TT-BGDĐT):**
  + 1.1TC1b: Thực hiện các tìm kiếm để tìm dữ liệu, thông tin và nội dung trong môi trường số (ví dụ: tìm kiếm ví dụ về bài học trên Internet).
  + 1.3TC1b: Sắp xếp dữ liệu, thông tin và nội dung một cách trật tự trong môi trường có cấu trúc (ví dụ: ghi chú bài học bằng phần mềm OneNote/Docs).
  + 2.1TC1a: Thực hiện các tương tác với các công nghệ số (ví dụ: sử dụng bảng tương tác trực tuyến Mentimeter/Jamboard/Quizizz).
  + 2.2TC1a: Lựa chọn công nghệ số phù hợp để trao đổi dữ liệu, thông tin và nội dung số (ví dụ: chia sẻ kết quả qua Google Classroom/Zalo).
  + 5.2TC1b: Chọn được công cụ số thông thường phù hợp với nhu cầu (ví dụ: dùng công cụ tìm kiếm hoặc phần mềm GeoGebra/máy tính bỏ túi).
- **Năng lực AI (QĐ 2422/QĐ-BGDĐT):**
  + 6.1TC1a: Giải thích được nguyên tắc hoạt động cơ bản của AI (ví dụ: GV giải thích sơ lược cách AI phân loại dữ liệu bài học).
  + 6.2TC1a: Sử dụng được các công cụ AI trong công việc và học tập hàng ngày (ví dụ: HS sử dụng chatbot ChatGPT/Gemini để hỏi về định nghĩa, ví dụ).
  + 6.2TC1b: Thực hành được các kỹ năng sử dụng AI thông qua các bài tập và dự án nhỏ (ví dụ: HS yêu cầu AI gợi ý bài tập tương tự hoặc ý tưởng dự án).
  + 6.2TC1c: Nhắc nhở HS xem xét các khía cạnh đạo đức và tính chính xác khi sử dụng AI trong học tập.
**3. Phẩm chất:**
  - Chăm chỉ: Tích cực tìm tòi, hoàn thành đầy đủ các bài tập và nhiệm vụ được giao.
  - Trung thực: Khách quan trong thảo luận, báo cáo đúng kết quả thực tế.
  - Trách nhiệm: Có ý thức hợp tác trong nhóm, hoàn thành đúng tiến độ công việc.

**B. MỤC TIÊU VÀ YÊU CẦU CẦN ĐẠT RIÊNG CHO TỪNG TIẾT HỌC:**
${periodTopicList.map((topic, i) => `**- TIẾT ${i + 1} (Tiết PPCT ${periodPPCTList[i]}: ${topic}):**
  + Mục tiêu kiến thức riêng: Nắm vững trọng tâm "${topic}".
  + Sản phẩm học sinh cần đạt riêng của Tiết ${i + 1}.`).join('\n')}
`;
      } else {
        goalStructureInstruction = `
QUY TẮC CẤU TRÚC MỤC TIÊU BÀI HỌC (CHUẨN CÔNG VĂN 5512 - QUY ĐỊNH BẮT BUỘC):
**I. MỤC TIÊU**
**1. Kiến thức:**
  - Nêu rõ các khái niệm, quy tắc, định lý, công thức cốt lõi học sinh cần hiểu và vận dụng thành thạo.
**2. Năng lực:**
- **Năng lực chung:**
  + Tự chủ và tự học: Tự giác tìm hiểu bài học qua SGK và tài liệu, chủ động hoàn thành các nhiệm vụ được phân công.
  + Giao tiếp và hợp tác: Tích cực trao đổi, thảo luận nhóm, trình bày ý kiến rõ ràng và tôn trọng quan điểm của bạn.
  + Giải quyết vấn đề và sáng tạo: Biết phân tích đề bài, đề xuất cách giải quyết và linh hoạt lựa chọn phương án tối ưu.
- **Năng lực đặc thù:**
  + Năng lực tư duy và lập luận toán học: Phân tích, suy luận và chứng minh bài toán logic.
  + Năng lực mô hình hóa toán học: Thiết lập mô hình toán học giải quyết bài toán thực tế.
  + Năng lực giải quyết vấn đề toán học: Đề xuất các cách giải khác nhau và kiểm tra nghiệm.
  + Năng lực giao tiếp toán học: Trình bày bài giải rõ ràng, dùng đúng ngôn ngữ toán học.
  + Năng lực sử dụng công cụ, phương tiện học toán: Sử dụng thước, compa, máy tính bỏ túi.
- **Năng lực số (TT 02/2025/TT-BGDĐT):**
  + 1.1TC1b: Thực hiện các tìm kiếm để tìm dữ liệu, thông tin và nội dung trong môi trường số (ví dụ: tìm kiếm ví dụ về bài học trên Internet).
  + 1.3TC1b: Sắp xếp dữ liệu, thông tin và nội dung một cách trật tự trong môi trường có cấu trúc (ví dụ: ghi chú bài học bằng phần mềm OneNote/Docs).
  + 2.1TC1a: Thực hiện các tương tác với các công nghệ số (ví dụ: sử dụng bảng tương tác trực tuyến Mentimeter/Jamboard/Quizizz).
  + 2.2TC1a: Lựa chọn công nghệ số phù hợp để trao đổi dữ liệu, thông tin và nội dung số (ví dụ: chia sẻ kết quả qua Google Classroom/Zalo).
  + 5.2TC1b: Chọn được công cụ số thông thường phù hợp với nhu cầu (ví dụ: dùng công cụ tìm kiếm hoặc phần mềm mô phỏng/máy tính bỏ túi).
- **Năng lực AI (QĐ 2422/QĐ-BGDĐT):**
  + 6.1TC1a: Giải thích được nguyên tắc hoạt động cơ bản của AI (ví dụ: GV giải thích sơ lược cách AI xử lý dữ liệu bài học).
  + 6.2TC1a: Sử dụng được các công cụ AI trong công việc và học tập hàng ngày (ví dụ: HS sử dụng chatbot ChatGPT/Gemini để hỏi về định nghĩa, ví dụ).
  + 6.2TC1b: Thực hành được các kỹ năng sử dụng AI thông qua các bài tập và dự án nhỏ (ví dụ: HS yêu cầu AI gợi ý bài tập tương tự hoặc ý tưởng dự án).
  + 6.2TC1c: Nhắc nhở HS xem xét các khía cạnh đạo đức và tính chính xác khi sử dụng AI trong học tập.
**3. Phẩm chất:**
  - Chăm chỉ: Tích cực tìm tòi, hoàn thành đầy đủ các bài tập và nhiệm vụ được giao.
  - Trung thực: Khách quan trong thảo luận, báo cáo đúng kết quả thực tế.
  - Trách nhiệm: Có ý thức hợp tác trong nhóm, hoàn thành đúng tiến độ công việc.
`;
      }

      const pedagogicalInstruction = buildPedagogicalMethodInstruction(
        selectedPP,
        selectedKT,
        profile.appendixCustomPrompt || specificGoals
      );

      const prompt = `Bạn là Chuyên gia Giáo dục Phổ thông và Giảng viên Sư phạm xuất sắc tại Việt Nam. Hãy soạn KẾ HOẠCH BÀI DẠY (GIÁO ÁN) ĐẦY ĐỦ, HOÀN CHỈNH, CỰC KỲ CHI TIẾT 100% THEO CHUẨN CÔNG VĂN 5512/BGDĐT, TÍCH HỢP NĂNG LỰC SỐ (TT 02/2025/TT-BGDĐT) VÀ NĂNG LỰC AI (QĐ 2422/QĐ-BGDĐT).

═════════════════════════════════════════════════════════════════════════════════
BỘ 14 ĐIỀU KHOẢN "QUY TẮC BÀN TAY SẮT" BẮT BUỘC TUÂN THỦ 100% KHI SOẠN GIÁO ÁN:
═════════════════════════════════════════════════════════════════════════════════

📌 ĐIỀU 1: THỂ THỨC ĐẦU TRANG, TIẾT THEO PPCT TRƯỚC TÊN BÀI HỌC, CĂN GIỮA TIÊU ĐỀ & CẤM LỜI DẪN NHẬP AI:
1. Cấm tuyệt đối lời dẫn nhập của AI: Không viết bất kỳ câu chào hỏi hay lời dẫn phụ (như "Dưới đây là giáo án...", "Với vai trò là chuyên gia sư phạm...").
2. Bỏ hoàn toàn việc bôi màu nền vàng / highlight vàng, giữ nền trang chuẩn thể thức in ấn.
3. Bắt đầu TRỰC TIẾP bằng thông tin Tiết theo PPCT và tiêu đề bài học chuẩn như sau:

Ngày soạn: ${formatVietnameseDate(profile.ngaysoan)}

<div align="center">

**TIẾT ${periodPPCTDisplay}**
# **${cleanTitle.toUpperCase().startsWith('BÀI') ? cleanTitle.toUpperCase() : `BÀI: ${cleanTitle.toUpperCase()}`}**

</div>

Bắt đầu trực tiếp ngay sau tiêu đề vào I. MỤC TIÊU.

📌 ĐIỀU 2: PHÂN CẤP ĐỀ MỤC MỤC TIÊU 4 TẦNG (LÀM RÕ, CHI TIẾT NĂNG LỰC CHUNG & NĂNG LỰC ĐẶC THÙ, MỖI DẤU + LÀ 1 DÒNG RIÊNG BIỆT, IN ĐẬM NĂNG LỰC SỐ & NĂNG LỰC AI):
1. **I. MỤC TIÊU** phân cấp chuẩn xác:
   - **1. Kiến thức:** Liệt kê chi tiết 100% các yêu cầu cần đạt, định nghĩa, định lý, công thức trọng tâm của bài học.
   - **2. Năng lực:** Bắt buộc chia đủ 4 tầng phân cấp rõ rệt, MỖI DẤU "+" LÀ 1 DÒNG RIÊNG BIỆT KHÔNG VIẾT LIỀN:
     - **Năng lực chung:**
       + Tự chủ và tự học: Tự giác nghiên cứu SGK, tài liệu bài học; chủ động lập kế hoạch và hoàn thành các nhiệm vụ học tập cá nhân cũng như nhiệm vụ được phân công trong nhóm.
       + Giao tiếp và hợp tác: Tích cực tương tác với bạn học và giáo viên; biết lắng nghe, tôn trọng ý kiến khác biệt, diễn đạt ý kiến mạch lạc và phối hợp hiệu quả trong hoạt động nhóm.
       + Giải quyết vấn đề và sáng tạo: Phát hiện vấn đề từ các tình huống học tập và thực tiễn; đề xuất các giải pháp khả thi, linh hoạt phân tích và lựa chọn hướng giải quyết tối ưu.
     - **Năng lực đặc thù:**
       + Năng lực tư duy và lập luận toán học: Thực hiện các thao tác so sánh, phân tích, tổng hợp, trừu tượng hóa, khái quát hóa; suy luận logic và giải thích tính đúng đắn của các kết luận toán học.
       + Năng lực mô hình hóa toán học: Chuyển đổi các tình huống thực tế thành mô hình toán học (biểu thức, công thức, sơ đồ); giải quyết bài toán trên mô hình và đối chiếu kết quả thực tiễn.
       + Năng lực giải quyết vấn đề toán học: Xác định được phương pháp và công cụ toán học thích hợp để tìm lời giải; kiểm tra, đánh giá và hoàn thiện các bước thực hiện.
       + Năng lực giao tiếp toán học: Trình bày bài giải rõ ràng, sử dụng chính xác các ký hiệu, thuật ngữ và ngôn ngữ toán học kết hợp ngôn ngữ thông thường.
       + Năng lực sử dụng công cụ, phương tiện học toán: Sử dụng thành thạo thước kẻ, êke, compa, máy tính cầm tay và các phần mềm hình học trực quan (GeoGebra...) để khám phá và hỗ trợ học tập.
     - **Năng lực số (TT 02/2025/TT-BGDĐT):** (BẮT BUỘC IN ĐẬM TOÀN BỘ ĐỀ MỤC)
       + 1.1TC1b: Tìm kiếm dữ liệu, thông tin bài học trên môi trường Internet.
       + 1.3TC1b: Hệ thống hóa kiến thức bài học vào tài liệu số cá nhân.
       + 2.1TC1a: Tương tác qua phần mềm tương tác (Mentimeter, Quizizz).
       + 2.2TC1a: Chia sẻ bài tập và dữ liệu học tập qua Google Classroom/Zalo.
       + 5.2TC1b: Sử dụng máy tính cầm tay hoặc phần mềm hình học để kiểm tra kết quả.
     - **Năng lực AI (QĐ 2422/QĐ-BGDĐT):** (BẮT BUỘC IN ĐẬM TOÀN BỘ ĐỀ MỤC)
       + 6.1TC1a: Nhận biết nguyên tắc hoạt động cơ bản của mô hình AI.
       + 6.2TC1a: Sử dụng chatbot AI (ChatGPT/Gemini) để tra cứu ví dụ và câu hỏi gợi mở.
       + 6.2TC1b: Thực hành kỹ năng prompt với AI để giải bài tập tương tự.
       + 6.2TC1c: Nhắc nhở HS về tính đạo đức, bản quyền và xác minh độ chính xác của AI.
   - **3. Phẩm chất:** Chăm chỉ, Trung thực, Trách nhiệm, Yêu nước (lồng ghép tình huống thực tế địa lý, văn hóa, danh lam thắng cảnh Việt Nam).
2. **II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU:**
   - **Giáo viên:** Giáo án, SGK, SGV; Tivi kết nối internet, máy tính (CẤM TUYỆT ĐỐI dùng từ "máy chiếu / projector"); Phiếu học tập, bảng nhóm; Công cụ tương tác (Kahoot/Quizizz); Prompt câu lệnh gợi ý cho chatbot AI.
   - **Học sinh:** SGK, vở ghi, đồ dùng học tập; Điện thoại thông minh/máy tính bảng quét mã QR, truy cập chatbot AI.

${profile.hideActivityTime ? `📌 ĐIỀU 3: DUNG LƯỢNG CHUYÊN SÂU (TỐI THIỂU 5 TRANG A4/TIẾT) & ẨN BỎ THỜI GIAN CÁC HOẠT ĐỘNG:
1. Dung lượng chuyên sâu: Mỗi tiết học phải có kịch bản sư phạm sâu sắc, lời thoại dẫn dắt chi tiết, bài tập giải 100% từng bước, đảm bảo độ dài khi in đạt tối thiểu 5 trang A4/tiết (Bài 2 tiết đạt ~10-13 trang A4).
2. YÊU CẦU ĐẶC BIỆT: ẨN BỎ THỜI GIAN CÁC HOẠT ĐỘNG. TUYỆT ĐỐI KHÔNG GHI SỐ PHÚT (KHÔNG ghi '(5 phút)', '(15 phút)', '(30 phút)'...) sau tên các hoạt động. Tiêu đề các hoạt động chỉ ghi tên thuần túy:
   * **1. HOẠT ĐỘNG KHỞI ĐỘNG**
   * **2. HOẠT ĐỘNG HÌNH THÀNH KIẾN THỨC MỚI** (chia nhỏ: **Hoạt động 1: [Tên mục 1]**, **Hoạt động 2: [Tên mục 2]**)
   * **3. HOẠT ĐỘNG LUYỆN TẬP**
   * **4. HOẠT ĐỘNG VẬN DỤNG** (kèm Dặn dò & Hướng dẫn học ở nhà).` : `📌 ĐIỀU 3: DUNG LƯỢNG CHUYÊN SÂU (TỐI THIỂU 5 TRANG A4/TIẾT) & PHÂN BỔ THỜI GIAN TIẾT HỌC LÀ ${targetPeriodMinutes} PHÚT:
1. Dung lượng chuyên sâu: Mỗi tiết học phải có kịch bản sư phạm sâu sắc, lời thoại dẫn dắt chi tiết, bài tập giải 100% từng bước, đảm bảo độ dài khi in đạt tối thiểu 5 trang A4/tiết (Bài 2 tiết đạt ~10-13 trang A4).
2. Phân bổ thời gian các hoạt động phù hợp với thời lượng nội dung sao cho tổng thời gian các hoạt động (Khởi động + Hình thành kiến thức + Luyện tập + Vận dụng) ĐÚNG BẰNG THỜI GIAN CỦA TIẾT HỌC THEO CẤU HÌNH ĐÃ CHỌN Ở TAB 1 LÀ ${targetPeriodMinutes} PHÚT (${profile.thoiluong || `${targetPeriodMinutes} phút`}):
   * **1. HOẠT ĐỘNG KHỞI ĐỘNG (${timeAlloc.khoiDong} phút)**
   * **2. HOẠT ĐỘNG HÌNH THÀNH KIẾN THỨC MỚI (${timeAlloc.hinhThanh} phút)** (chia nhỏ thời gian cho từng mục: **Hoạt động 1: [Tên mục 1] (${timeAlloc.hinhThanhSub1} phút)**, **Hoạt động 2: [Tên mục 2] (${timeAlloc.hinhThanhSub2} phút)**).
   * **3. HOẠT ĐỘNG LUYỆN TẬP (${timeAlloc.luyenTap} phút)**
   * **4. HOẠT ĐỘNG VẬN DỤNG (${timeAlloc.vanDung} phút)** (kèm Dặn dò & Hướng dẫn học ở nhà).
   *(Tổng: ${timeAlloc.summaryText})*`}

📌 ĐIỀU 4: CHUẨN HÓA 4 HOẠT ĐỘNG CHÍNH (IN HOA TOÀN BỘ CHỮ HOẠT ĐỘNG VÀ TÊN HOẠT ĐỘNG, IN ĐẬM) & 4 BƯỚC SƯ PHẠM (VIẾT THƯỜNG "Bước 1/2/3/4", IN ĐẬM TIÊU ĐỀ BƯỚC, NỘI DUNG BƯỚC KHÔNG IN HOA):
1. Tiêu đề 4 hoạt động chính bắt buộc IN HOA TOÀN BỘ, IN ĐẬM:
   * **1. HOẠT ĐỘNG KHỞI ĐỘNG**
   * **2. HOẠT ĐỘNG HÌNH THÀNH KIẾN THỨC MỚI**
   * **3. HOẠT ĐỘNG LUYỆN TẬP**
   * **4. HOẠT ĐỘNG VẬN DỤNG**
2. CẤM TUYỆT ĐỐI CHÈN CÁC MỤC RƯỜM RÀ NHƯ "Mục tiêu:", "a) Mục tiêu:", "b) Phương pháp & Kĩ thuật:", "c) Tiến trình tổ chức:", "c) Tổ chức thực hiện:", "Nội dung:" HAY CÁC CHỮ CÁI ĐẦU MỤC "a", "a)", "b)", "c)" VÀO TRONG BẢNG TIẾN TRÌNH HOẠT ĐỘNG (Vì Mục tiêu và Phương pháp chung đã được nêu đầy đủ, chuẩn xác ở Phần I và Phần II).
3. DƯỚI MỖI TIÊU ĐỀ HOẠT ĐỘNG Ở CỘT 1 (Ví dụ: **1. HOẠT ĐỘNG KHỞI ĐỘNG (5 phút)** hoặc **Hoạt động 1: [Tên mục 1] (15 phút)**), BẮT ĐẦU TRỰC TIẾP NGAY VÀO:
   **Bước 1: Giao nhiệm vụ học tập:** [Nội dung giao nhiệm vụ viết thường không in hoa]
   **Bước 2: Thực hiện nhiệm vụ:** [Nội dung thực hiện viết thường không in hoa]
   **Bước 3: Báo cáo, thảo luận:** [Nội dung báo cáo thảo luận viết thường không in hoa]
   **Bước 4: Kết luận, nhận định:** [Nội dung kết luận nhận định viết thường không in hoa]
4. CẤM TUYỆT ĐỐI để chữ "a" hay "a)" nhảy lên dòng tiêu đề hoạt động hoặc ngắt hoạt động thành nhiều hàng có ô trống.
5. In đậm toàn bộ các đề mục 1., 2., 3., 4.... ở cả hai cột.

📌 ĐIỀU 5: ĐỒNG BỘ 1-1 TUYỆT ĐỐI & ĐÁNH SỐ ĐỀ MỤC CỘT DỰ KIẾN SẢN PHẨM Ở TẤT CẢ CÁC TIẾT:
- Bảng tiến trình gồm 2 cột: | Hoạt động của GV và HS | Dự kiến sản phẩm |
- Ở BẤT KỲ TIẾT HỌC NÀO (kể cả Tiết 1, Tiết 2, Tiết 3...):
  + Trong TIẾT 1 (Hình thành kiến thức):
    * Cột Trái: **Hoạt động 1: [Tên mục 1]** ➡️ Cột Phải: **1. [Tên mục 1]:** (Khái niệm, quy tắc, giải chi tiết Hoạt động khám phá, Ví dụ 1, Luyện tập 1).
    * Cột Trái: **Hoạt động 2: [Tên mục 2]** ➡️ Cột Phải: **2. [Tên mục 2]:** (Nội dung lý thuyết, công thức, giải chi tiết Ví dụ 2, Luyện tập 2).
    * Cột Trái: **3. HOẠT ĐỘNG LUYỆN TẬP** ➡️ Cột Phải: **3. Luyện tập:**
    * Cột Trái: **4. HOẠT ĐỘNG VẬN DỤNG** ➡️ Cột Phải: **4. Vận dụng:**
    *(Lưu ý: Trong Hoạt động Khởi động, Cột Phải ghi trực tiếp câu trả lời dự kiến, KHÔNG đánh số "1.")*
  + Trong TIẾT 2 (Luyện tập & Vận dụng hoặc tiếp tục bài học):
    * Cột Trái: **2. HOẠT ĐỘNG LUYỆN TẬP (30 phút)** ➡️ Cột Phải: **1. Luyện tập: [Tên chủ đề bài tập]** (Giải chi tiết 100% tất cả bài tập SGK).
    * Cột Trái: **3. HOẠT ĐỘNG VẬN DỤNG (8 phút)** ➡️ Cột Phải: **2. Vận dụng: [Tên tình huống thực tế]** (Phân tích tình huống và lời giải bài toán thực tiễn).
    * Cột Trái: **4. HOẠT ĐỘNG TÌM TÒI, MỞ RỘNG (2 phút)** ➡️ Cột Phải: **3. Tìm tòi, mở rộng:** (Mục "Em có biết?", lịch sử toán học).
  + CẤM TUYỆT ĐỐI: Không được để trống, không được ghi "- Nội dung....." hoặc "...tương tự".

📌 ĐIỀU 6: TÍCH HỢP ĐÚNG BẢN CHẤT & NGUYÊN TẮC VẬN HÀNH CỦA PHƯƠNG PHÁP & KĨ THUẬT DẠY HỌC ĐÃ CHỌN:
Kịch bản sư phạm ở Cột Trái bắt buộc biến đổi linh hoạt theo đúng quy trình của từng Phương pháp / Kĩ thuật:
${pedagogicalInstruction}

📌 ĐIỀU 7: KHAI THÁC 100% BÀI TẬP SGK VÀ LỜI GIẢI CHI TIẾT 100%:
1. Bắt buộc đưa toàn bộ câu hỏi Khám phá, Ví dụ mẫu (Ví dụ 1, Ví dụ 2...), Bài tập Luyện tập, Bài tập Vận dụng từ SGK vào giáo án.
2. Dùng Phương pháp & Kĩ thuật dạy học đã chọn để giải quyết triệt để nội dung SGK trước khi mở rộng bài tập ngoài.
3. Cột Dự kiến sản phẩm: Phải có đầy đủ Đề bài và LỜI GIẢI CHI TIẾT 100% (từng bước biến đổi, công thức toán $...$, đáp số chính xác, phân tích lý do đúng/sai cặn kẽ, không viết tắt, không ghi ...tương tự).

📌 ĐIỀU 8: KỊCH BẢN SƯ PHẠM SINH ĐỘNG & TÍCH HỢP MÃ CHỈ BÁO NLS & AI:
1. Kịch bản sư phạm có lời dẫn dắt chi tiết của GV, câu hỏi gợi mở, phân chia nhóm rõ ràng (cặp đôi, nhóm 4, nhóm 6), giao nhiệm vụ cụ thể, hướng dẫn báo cáo lên tivi/bảng phụ, và nhận xét phản biện của HS.
2. Lồng ghép trực tiếp mã chỉ báo vào từng bước của kịch bản:
   * (Năng lực số 2.1TC1a: GV sử dụng công cụ tương tác Mentimeter/Quizizz...)
   * (Năng lực AI 6.2TC1a: GV hướng dẫn HS sử dụng chatbot AI để tra cứu ví dụ...)
   * (Năng lực số 1.3TC1b: HS hệ thống hóa kiến thức vào vở ghi hoặc tài liệu số cá nhân...)
   * (Năng lực số 5.2TC1b: HS sử dụng GeoGebra hoặc máy tính cầm tay để kiểm tra kết quả...)
   * (Năng lực AI 6.2TC1c: GV nhắc nhở HS về tính bảo mật thông tin và tính chính xác khi tham khảo kết quả từ AI...)

📌 ĐIỀU 9: HỆ THỐNG THƠ TỔNG KẾT & HƯỚNG DẪN BÀI TẬP VỀ NHÀ (DÙNG GẠCH ĐẦU DÒNG "-", KHÔNG ĐÁNH SỐ 1,2,3... VÀ KHÔNG IN ĐẬM):
1. Sau mỗi tiết học:
   **TỔNG KẾT KIẾN THỨC (TIẾT [X])**
   "[Tên bài thơ tổng kết tiết]" (Bài thơ 6-8 câu vần điệu súc tích tóm tắt kiến thức của tiết).
   **HƯỚNG DẪN VỀ NHÀ (TIẾT [X])**
   - Ôn tập lý thuyết: Học thuộc các khái niệm, quy tắc, định lý đã học trong tiết.
   - Hướng dẫn phương pháp giải cụ thể cho các bài tập SGK/SBT của tiết.
   - Bài tập nâng cao/bài tập khó phát triển tư duy: Chọn 1-2 bài tập khó/mở rộng thực tế kèm gợi ý hướng dẫn phương pháp giải chi tiết từng bước để học sinh khá giỏi tự học ở nhà.
   - Chuẩn bị cho tiết sau.
   - Nhiệm vụ AI trải nghiệm (6.2TC1a).
2. Cuối toàn bộ bài học (sau khi hoàn thành tất cả các tiết):
   **TỔNG KẾT KIẾN THỨC (CẢ BÀI)**
   "[Tên bài thơ tổng kết toàn bài]" (Bài thơ tổng kết toàn bài 8-12 câu đúc kết trọn vẹn toàn bộ bài học).
   **HƯỚNG DẪN VỀ NHÀ (CẢ BÀI)**
   - Vẽ sơ đồ tư duy tổng kết toàn bộ kiến thức bài học vào vở.
   - Hướng dẫn giải chi tiết 100% tất cả bài tập cuối bài trong SGK & SBT (Bài 1.1, Bài 1.2, Bài 1.3... kèm phân tích phương pháp giải và lời giải hướng dẫn từng bước).
   - Tuyển chọn bài tập khó/nâng cao phát triển tư duy mở rộng kèm phân tích và gợi ý hướng dẫn phương pháp giải chi tiết giúp học sinh khá giỏi tự học, chinh phục bài khó.
   - Bài tập vận dụng thực tế địa phương.
   - Chuẩn bị bài mới trong SGK.
   - Nhiệm vụ AI nâng cao (6.2TC1b).

📌 ĐIỀU 10: BẢNG KÝ DUYỆT DUY NHẤT Ở CUỐI BÀI (IN ĐẬM, ẨN VIỀN, BỎ (KÝ VÀ GHI RÕ HỌ TÊN)):
Bảng ký duyệt chỉ xuất hiện DUY NHẤT 1 LẦN ở cuối cùng của toàn bộ giáo án, in đậm tiêu đề và tên người ký, tuyệt đối không có dòng (Ký và ghi rõ họ tên):
| **DUYỆT CỦA BAN GIÁM HIỆU** | **DUYỆT CỦA TỔ CHUYÊN MÔN** |
| :---: | :---: |
| <br><br><br><br>**${profile.bghSigner?.trim() || 'Ban Giám Hiệu'}** | <br><br><br><br>**${profile.deptSigner?.trim() || 'Tổ trưởng chuyên môn'}** |

📌 ĐIỀU 11: QUY TẮC CỐT LÕI VỀ CÔNG THỨC, KÝ HIỆU TOÁN HỌC & ĐỊNH DẠNG XUẤT BẢN:
1. BẮT BUỘC BỌC MỌI BIỂU THỨC TOÁN HỌC, BIẾN SỐ, ĐƠN THỨC, ĐA THỨC, SỐ THẬP PHÂN, GÓC, HÌNH TRONG $...$ HOẶC $$...$$:
   - Đơn thức, biến số và lũy thừa: Viết chuẩn $x$, $y$, $z$, $17z^4$, $-6x^3y$, $-\\frac{1}{4}y^2z^3$, $0,35xy^2z^4$. CẤM TUYỆT ĐỐI viết dạng text thường hay làm mất lũy thừa biến z.
   - Phân số, phân thức chuẩn SGK: BẮT BUỘC có dấu gạch chéo ngược $\\frac{a}{b}$ hoặc $\\dfrac{a}{b}$, ví dụ: $\\frac{1}{8}$, $\\frac{1}{2}$, $\\frac{3}{4}$, $\\frac{\\sqrt{X}}{\\sqrt{X} + 1} + 2\\frac{X - 1}{\\sqrt{X} - 1}$, $\\frac{\\widehat{C} + \\widehat{D}}{2}$. CẤM TUYỆT ĐỐI dùng các ký hiệu phân số thu nhỏ kiểu "½, ⅓, ⅔, ¼, ¾, ⅕, ⅙, ⅛, ⅜, ⅝, ⅞" và CẤM TUYỆT ĐỐI dùng dấu gạch xiên "1/8" hay "a/b" khi viết toán! CẤM TUYỆT ĐỐI bỏ dấu gạch chéo ngược thành "frac{a}{b}"!
   - Ký hiệu góc chuẩn SGK: BẮT BUỘC dùng dấu mũ rộng trên đỉnh góc $\\widehat{A}$, $\\widehat{B}$, $\\widehat{C}$, $\\widehat{D}$, $\\widehat{ABC}$, $\\widehat{xOy}$, $\\widehat{AEB}$, $\\triangle ABC$. CẤM TUYỆT ĐỐI dùng ký hiệu góc "\\angle A", "\\angle ABC", CẤM TUYỆT ĐỐI bỏ gạch chéo ngược thành "widehat {A}"!
   - Ký hiệu hình học & quan hệ: Viết chuẩn tam giác $\\triangle ABC$, vuông góc $\\perp$ ($AB \\perp CD$), song song $\\parallel$ ($d_1 \\parallel d_2$), đồng dạng $\\sim$ ($\\triangle ABC \\sim \\triangle A'B'C'$), bằng nhau $\\cong$, véc-tơ $\\vec{u}$, $\\overrightarrow{AB}$.
   - Căn thức & phân thức đại số: Viết chuẩn căn bậc hai $\\sqrt{X}$, $\\sqrt{x^2 + 1}$, căn bậc n $\\sqrt[3]{8}$, $\\sqrt[n]{A}$; phân số $\\frac{-b \\pm \\sqrt{\\Delta}}{2a}$, $\\frac{A}{B}$.
   - Số đo độ: BẮT BUỘC viết dạng $180^\\circ$, $360^\\circ$, $90^\\circ$, $125^\\circ$. CẤM TUYỆT ĐỐI viết thành "^°" hay "180^°"!
   - Số thập phân trong toán Việt Nam: Viết $0,5$ hoặc $0{,}5$, $2,5$ hoặc $2{,}5$, $16,5$.
   - Ký hiệu tập hợp và quan hệ: $x \\in A$, $y \\notin A$, $A = \\{1; 2; 3\\}$, $\\mathbb{N}$, $\\mathbb{N}^*$, $\\mathbb{Z}$, $\\mathbb{Q}$, $\\mathbb{R}$. BẮT BUỘC viết đầy đủ chữ cái trong \\mathbb (CẤM TUYỆT ĐỐI bỏ sót chữ cái thành "\\mathbb^*" hay "\\mathbb^", phải luôn viết chuẩn $\\mathbb{N}^*$).
   - CẤM TUYỆT ĐỐI dùng ";\\ " hay ",\\ " hay dấu gạch chéo ngược "\\" trước dấu cách hoặc chấm phẩy. Chỉ dùng dấu chấm phẩy cách bình thường "; " hoặc ", ".
   - CẤM TUYỆT ĐỐI để dấu sao lẻ "*" ở cuối câu, sau dấu hai chấm (như "giải:*", "pháp:*"), hoặc ở cuối các dòng thơ.
   - CẤM TUYỆT ĐỐI dùng dấu gạch dưới "_" hoặc ký hiệu subscript "_{ta}" trong văn bản lời dẫn tiếng Việt (như "s,_{ta} có:"). Phải viết lời dẫn tiếng Việt tự nhiên: "biểu thức S, ta có:" hoặc "biểu thức (1), ta có:".
2. Trong bản xem trước A4: dùng thẻ <br> để xuống dòng trong các ô bảng 2 cột.
3. Khi xuất file Word (.docx): Bộ xuất file tự động chuyển đổi toàn bộ thẻ <br> thành ngắt dòng chuẩn của Word (TextRun break), tuyệt đối không để sót ký tự <br> thô trong tài liệu xuất ra.

📌 ĐIỀU 12: TỰ ĐỘNG TẠO ĐỦ TẤT CẢ CÁC TIẾT THEO CÀI ĐẶT TAB 1:
Hệ thống tự động sinh trọn vẹn đủ ${numDuration} tiết theo đúng cấu hình (${periodBreakdownSummary}). Tuyệt đối KHÔNG bỏ sót tiết nào, KHÔNG viết lửng "Tiếp tục ở Tiết 2...".

📌 ĐIỀU 13: PHÂN BỔ TẠO BÀI THEO TỪNG TIẾT RIÊNG BIỆT (PER-PERIOD GENERATION):
- Mỗi tiết được tạo trọn vẹn đầy đủ 4 hoạt động chuyên sâu (tối thiểu 5 trang A4/tiết).
- Toàn bộ bài học ${numDuration} tiết được hoàn thiện đầy đủ 100%.

📌 ĐIỀU 14: QUY TẮC CHÍNH TẢ TIẾNG VIỆT & CHUẨN XÁC TỪ VỰNG SƯ PHẠM (TUYỆT ĐỐI TUÂN THỦ 100%):
- Tuyệt đối bảo đảm chuẩn xác chính tả và dấu thanh tiếng Việt. Chú ý nghiêm ngặt các từ vựng thiết bị và sư phạm thường gặp:
  * "tủ lạnh" (CẤM TUYỆT ĐỐI viết sai thành "tù lạnh"), "tủ sách" (không viết "tù sách"), "tủ thuốc" (không viết "tù thuốc").
  * "sắp xếp" (không viết "sắp sếp" hay "xắp xếp"), "nỗ lực" (không viết "lỗ lực"), "bổ sung" (không viết "bổ xung").
  * "chia sẻ" (không viết "chia xẻ"), "hướng dẫn" (không viết "hướng dẩn"), "thảo luận" (không viết "thảo luân").
  * "chắt lọc" (không viết "trắt lọc"), "trau dồi" (không viết "chau dồi"), "cọ xát" (không viết "cọ sát").
  * "sơ suất" (không viết "sơ xuất"), "xác suất" (không viết "xác xuất"), "năng suất" (không viết "năng xuất"), "xuất hiện" (không viết "suất hiện").
  * "tóm tắt" (không viết "tóm tắc"), "trắc nghiệm" (không viết "chắc nghiệm"), "bản đồ tư duy" (không viết "tư du").
- Giữ gìn sự trong sáng của tiếng Việt sư phạm, đúng chuẩn mực ngôn ngữ giáo dục.

═════════════════════════════════════════════════════════════════════════════════

${lessonTypeInstruction}

${goalStructureInstruction}

**II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU**
**1. Giáo viên:**
- Giáo án, sách giáo khoa, sách giáo viên.
- Máy tính, tivi kết nối internet (TUYỆT ĐỐI KHÔNG DÙNG máy chiếu projector).
- Phiếu học tập, bảng nhóm, bút lông.
- Một số hình ảnh minh họa về bài học.
- Công cụ trình chiếu (PowerPoint/Google Slides) với nội dung bài học, ví dụ, bài tập.
- Một số câu hỏi gợi mở cho chatbot AI.
- Hệ thống câu hỏi trắc nghiệm tương tác (Kahoot, Quizizz).
**2. Học sinh:**
- Sách giáo khoa (${profile.boSach || 'Kết nối tri thức'} ${profile.sgkTap || 'Tập 1'}), vở ghi, đồ dùng học tập.
- Điện thoại thông minh (nếu có, có cài đặt ứng dụng quét mã QR, truy cập chatbot AI) hoặc máy tính bảng/laptop (theo nhóm).

QUY TẮC BẢNG 2 CỘT CHO MỖI TIẾT:
| **Hoạt động của GV và HS** | **Dự kiến sản phẩm** |
| :--- | :--- |

- MỖI HOẠT ĐỘNG PHẢI LÀ MỘT HÀNG BẢNG DUY NHẤT:
  * CỘT 1 (Hoạt động của GV và HS): Toàn bộ tiêu đề hoạt động và trọn vẹn đủ 4 bước sư phạm (**Bước 1: Giao nhiệm vụ học tập:**, **Bước 2: Thực hiện nhiệm vụ:**, **Bước 3: Báo cáo, thảo luận:**, **Bước 4: Kết luận, nhận định:**). TUYỆT ĐỐI KHÔNG ghi Mục tiêu, Phương pháp/Kĩ thuật, Tiến trình tổ chức hay các chữ cái đầu mục a), b), c), a vào trong bảng.
  * CỘT 2 (Dự kiến sản phẩm): Toàn bộ tiêu đề mục kiến thức tương ứng (**1. [Tên mục 1]:**, **2. [Tên mục 2]:**, **3. Luyện tập:**, **4. Vận dụng:**) cùng định nghĩa, quy tắc, công thức, ví dụ mẫu và bài giải chi tiết.
  * CẤM TUYỆT ĐỐI ngắt một hoạt động thành nhiều hàng có ô trống.
Dùng thẻ <br> để xuống dòng bên trong cùng một ô bảng.
TUYỆT ĐỐI KHÔNG chèn mã TikZ hay code block \`\`\`tikz vào nội dung bài soạn. Nếu có hình vẽ, ghi chú dạng:
'[ HÌNH VẼ MINH HỌA: Mô tả hình vẽ - GIÁO VIÊN CHÈN HÌNH TẠI ĐÂY ]'

=== BỘ NHỚ THAM CHIẾU DỮ LIỆU TÀI LIỆU SGK, SÁCH THAM KHẢO VÀ ĐỀ CƯƠNG ĐÃ NẠP ===
${referenceCacheText.slice(0, 100000)}
=== HẾT BỘ NHỚ THAM CHIẾU ===`;

      try {
        const images = sgkImageDataUrl ? [sgkImageDataUrl] : undefined;

        const cleanTitleUpper = cleanTitle.toUpperCase().startsWith('BÀI')
          ? cleanTitle.toUpperCase()
          : `BÀI: ${cleanTitle.toUpperCase()}`;
        const ngaySoanFormatted = formatVietnameseDate(profile.ngaysoan);

        if (numDuration <= 1) {
          // SINGLE PERIOD GENERATION
          const singlePeriodPrompt = `${prompt}

**III. TIẾN TRÌNH DẠY HỌC**
## **TIẾT ${periodPPCTList[0] || '1'}: ${periodTopicList[0] ? periodTopicList[0].toUpperCase() : cleanTitle.toUpperCase()}**

${profile.hideActivityTime ? `Kẻ Bảng 2 cột duy nhất cho Tiết 1, gồm đủ 4 Hoạt động (TUYỆT ĐỐI KHÔNG ghi số phút sau tên hoạt động):
1. **1. HOẠT ĐỘNG KHỞI ĐỘNG**
2. **2. HOẠT ĐỘNG HÌNH THÀNH KIẾN THỨC MỚI**
3. **3. HOẠT ĐỘNG LUYỆN TẬP**
4. **4. HOẠT ĐỘNG VẬN DỤNG**` : `Kẻ Bảng 2 cột duy nhất cho Tiết 1, gồm đủ 4 Hoạt động chuẩn ${targetPeriodMinutes} phút (${timeAlloc.summaryText}):
1. **1. HOẠT ĐỘNG KHỞI ĐỘNG (${timeAlloc.khoiDong} phút)**
2. **2. HOẠT ĐỘNG HÌNH THÀNH KIẾN THỨC MỚI (${timeAlloc.hinhThanh} phút)**
3. **3. HOẠT ĐỘNG LUYỆN TẬP (${timeAlloc.luyenTap} phút)**
4. **4. HOẠT ĐỘNG VẬN DỤNG (${timeAlloc.vanDung} phút)**`}

Kèm phần:
**TỔNG KẾT KIẾN THỨC (CẢ BÀI)** (Bài thơ 8-12 câu).
**HƯỚNG DẪN VỀ NHÀ (CẢ BÀI)** (Dùng gạch đầu dòng -, không in đậm).`;

          const textResult = await generateGeminiText({
            prompt: singlePeriodPrompt,
            apiKeys,
            images,
            maxOutputTokens: 16384
          });

          if (textResult) {
            let cleanResult = stripIntroductoryChatter(textResult)
              .replace(/máy chiếu/gi, 'máy tính, tivi')
              .replace(/Máy chiếu/gi, 'Máy tính, tivi')
              .replace(/^[-_=\s]{4,}$/gm, '')
              .replace(/(\n\s*---\s*){2,}/g, '\n\n')
              .replace(/^\s*\* \s*\*\*/gm, '- **')
              .replace(/^\s*\* ([A-ZĐàáảãạăằắẳẵặâầnấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ])/gm, '- $1');

            cleanResult = normalizeVietnameseTerminology(cleanResult);
            cleanResult = rebalanceLessonPlanActivityDurations(cleanResult, targetPeriodMinutes, Boolean(profile.hideActivityTime));

            // Strip redundant AI preambles before I. MỤC TIÊU to guarantee standard centered header
            const muctieuMatch = cleanResult.match(/(?:^|\n)(#{1,4}\s*|\*{0,2})(?:I\.|1\.)\s*MỤC TIÊU/i);
            let bodyOnly = cleanResult;
            if (muctieuMatch && muctieuMatch.index !== undefined) {
              bodyOnly = cleanResult.slice(muctieuMatch.index).trim();
            }

            const standardHeader = `Ngày soạn: ${ngaySoanFormatted}\n\n<div align="center">\n\n**TIẾT ${periodPPCTDisplay}**\n# **${cleanTitleUpper}**\n\n</div>\n\n`;
            compiledMarkdown += `\n\n${standardHeader}${bodyOnly}\n\n`;
          }
        } else {
          // MULTI-PERIOD SEQUENTIAL GENERATION (GUARANTEES 100% COMPLETE PERIODS, NO MISSING PERIODS)
          let accumulatedLessonMarkdown = '';

          for (let p = 0; p < numDuration; p++) {
            const currentPeriodNumber = p + 1;
            const currentPPCT = periodPPCTList[p] || currentPeriodNumber;
            const currentTopic = periodTopicList[p] || `Nội dung Tiết ${currentPeriodNumber}`;

            setStatusMessage(`Đang soạn Tiết ${currentPeriodNumber}/${numDuration} (Tiết PPCT ${currentPPCT}): ${currentTopic}...`);

            if (p === 0) {
              // PERIOD 1: Header + Goals (I) + Devices (II) + Progress (III - Period 1) + Summary Tiết 1 + HW Tiết 1
              const p1Prompt = `${prompt}

HÃY SOẠN PHẦN ĐẦU VÀ TIẾN TRÌNH TIẾT 1 (${currentTopic.toUpperCase()}):
1. Thể thức đầu trang: Ngày soạn: ${ngaySoanFormatted}, **TIẾT ${periodPPCTDisplay}**, # **${cleanTitleUpper}**.
2. **I. MỤC TIÊU** (Đầy đủ Mục tiêu chung toàn bài ${numDuration} tiết và Mục tiêu riêng từng tiết, chia đủ 4 tầng phân cấp rõ rệt, in đậm Năng lực số & Năng lực AI).
3. **II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU**.
4. **III. TIẾN TRÌNH DẠY HỌC**:
   ## **TIẾT ${currentPPCT}: ${currentTopic.toUpperCase()}**
   BẮT BUỘC KẺ BẢNG 2 CỘT CHUẨN CÔNG VĂN 5512 VỚI TIÊU ĐỀ:
   | **Hoạt động của GV và HS** | **Dự kiến sản phẩm** |
   | :--- | :--- |

   (TUYỆT ĐỐI CẤM TẠO BẢNG 3 CỘT. CẤM TUYỆT ĐỐI TÁCH 'Bước 1' THÀNH 1 CỘT RIÊNG. BẢNG BẮT BUỘC CHỈ CÓ ĐÚNG 2 CỘT: CỘT 1 CHỨA CẢ TIÊU ĐỀ BƯỚC VÀ LỜI DẪN, CỘT 2 CHỨA ĐẦY ĐỦ KIẾN THỨC VÀ LỜI GIẢI CHI TIẾT 100%. CẤM ĐƯA HƯỚNG DẪN VỀ NHÀ VÀO TRONG BẢNG HOẶC DÙNG DẤU GẠCH ĐỨNG |).

   CHI TIẾT 2 CỘT CỦA BẢNG TIẾT 1:
   - CỘT 1 (Hoạt động của GV và HS): Chứa ĐẦY ĐỦ 4 HOẠT ĐỘNG CHÍNH CHUẨN ${targetPeriodMinutes} PHÚT (${timeAlloc.summaryText}) (IN HOA TOÀN BỘ, IN ĐẬM) và dưới mỗi hoạt động có đủ 4 bước sư phạm (**Bước 1: Giao nhiệm vụ học tập:**, **Bước 2: Thực hiện nhiệm vụ:**, **Bước 3: Báo cáo, thảo luận:**, **Bước 4: Kết luận, nhận định:**):
     * **1. HOẠT ĐỘNG KHỞI ĐỘNG (${timeAlloc.khoiDong} phút)** (bắt đầu trực tiếp ngay với **Bước 1: Giao nhiệm vụ học tập:**, **Bước 2: Thực hiện nhiệm vụ:**, **Bước 3: Báo cáo, thảo luận:**, **Bước 4: Kết luận, nhận định:**).
     * **2. HOẠT ĐỘNG HÌNH THÀNH KIẾN THỨC MỚI (${timeAlloc.hinhThanh} phút)** (BẮT BUỘC PHẢI CÓ TIÊU ĐỀ NÀY! Tập trung vào "${currentTopic}", chia các mục: **Hoạt động 1: [Tên mục 1] (${timeAlloc.hinhThanhSub1} phút)**, **Hoạt động 2: [Tên mục 2] (${timeAlloc.hinhThanhSub2} phút)**... Mỗi hoạt động đều có đủ 4 bước: Bước 1, Bước 2, Bước 3, Bước 4).
     * **3. HOẠT ĐỘNG LUYỆN TẬP (${timeAlloc.luyenTap} phút)** (kèm đủ 4 bước: Bước 1, Bước 2, Bước 3, Bước 4).
     * **4. HOẠT ĐỘNG VẬN DỤNG (${timeAlloc.vanDung} phút)** (kèm đủ 4 bước: Bước 1, Bước 2, Bước 3, Bước 4).

   - CỘT 2 (Dự kiến sản phẩm): BẮT BUỘC ĐÁNH SỐ ĐỀ MỤC TƯƠNG ỨNG 1-1 ĐẦY ĐỦ VỚI CỘT 1:
     * Tương ứng Hoạt động 1 ➡️ **1. [Tên mục 1]:** (Khái niệm, công thức, giải chi tiết Hoạt động khám phá, Luyện tập 1).
     * Tương ứng Hoạt động 2 ➡️ **2. [Tên mục 2]:** (Lý thuyết, quy tắc, giải chi tiết Ví dụ 2, Luyện tập 2).
     * Tương ứng Hoạt động Luyện tập ➡️ **3. Luyện tập:** (Giải chi tiết 100% tất cả bài tập SGK liên quan).
     * Tương ứng Hoạt động Vận dụng ➡️ **4. Vận dụng:** (Bài toán thực tế có lời giải chi tiết 100%).

   - **TỔNG KẾT KIẾN THỨC (TIẾT 1)** (Bài thơ 6-8 câu).
   - **HƯỚNG DẪN VỀ NHÀ (TIẾT 1)** (Dùng gạch đầu dòng -, không in đậm: Ôn tập lý thuyết; Hướng dẫn phương pháp giải bài tập SGK/SBT; Bài tập nâng cao/bài tập khó phát triển tư duy kèm gợi ý hướng dẫn phương pháp giải chi tiết; Chuẩn bị tiết sau; Nhiệm vụ AI).

*LƯU Ý QUAN TRỌNG*: Hoàn thiện trọn vẹn chi tiết 100% cho Tiết 1. CẤM TUYỆT ĐỐI viết câu lửng như "Tiếp tục ở Tiết 2..." hay "(Còn tiếp...)".`;

              const p1Result = await generateGeminiText({
                prompt: p1Prompt,
                apiKeys,
                images,
                maxOutputTokens: 16384
              });

              if (p1Result) {
                let cleanP1 = stripIntroductoryChatter(p1Result)
                  .replace(/máy chiếu/gi, 'máy tính, tivi')
                  .replace(/Máy chiếu/gi, 'Máy tính, tivi')
                  .replace(/^[-_=\s]{4,}$/gm, '')
                  .replace(/(\n\s*---\s*){2,}/g, '\n\n');
                cleanP1 = normalizeVietnameseTerminology(cleanP1);
                cleanP1 = rebalanceLessonPlanActivityDurations(cleanP1, targetPeriodMinutes, Boolean(profile.hideActivityTime));

                // Strip any AI preamble before I. MỤC TIÊU to guarantee standard centered header
                const muctieuMatch = cleanP1.match(/(?:^|\n)(#{1,4}\s*|\*{0,2})(?:I\.|1\.)\s*MỤC TIÊU/i);
                let bodyOnly = cleanP1;
                if (muctieuMatch && muctieuMatch.index !== undefined) {
                  bodyOnly = cleanP1.slice(muctieuMatch.index).trim();
                }

                const standardHeader = `Ngày soạn: ${ngaySoanFormatted}\n\n<div align="center">\n\n**TIẾT ${periodPPCTDisplay}**\n# **${cleanTitleUpper}**\n\n</div>\n\n`;
                accumulatedLessonMarkdown += standardHeader + bodyOnly;
              }
            } else {
              // PERIOD 2..N: Progress (III - Period p+1) + Summary + HW (+ Whole Lesson Summary & HW if final period)
              const isFinalPeriod = p === numDuration - 1;
              const pNPrompt = `Bạn là Chuyên gia Giáo dục Phổ thông tại Việt Nam. Hãy soạn TIẾP TỤC TIẾT ${currentPeriodNumber} (Tiết PPCT ${currentPPCT}: ${currentTopic.toUpperCase()}) cho bài học: "${cleanTitleUpper}".
Tuân thủ nghiêm ngặt Bộ 14 Quy tắc Bàn tay sắt Công văn 5512.

CẤU TRÚC TIẾT ${currentPeriodNumber} BẮT BUỘC PHẢI GIỐNG HOÀN TOÀN CẤU TRÚC TIẾT 1 (BẢNG 2 CỘT CHUẨN, ĐỦ 4 HOẠT ĐỘNG CHUẨN ${targetPeriodMinutes} PHÚT (${timeAlloc.summaryText}), TUYỆT ĐỐI KHÔNG ĐƯỢC THAY ĐỔI CẤU TRÚC HAY TIÊU ĐỀ CỘT):
1. KHÔNG lặp lại Ngày soạn, Tiêu đề bài học hay I. Mục tiêu / II. Thiết bị.
2. BẮT ĐẦU NGAY TỪ TIÊU ĐỀ TIẾT:
   ## **TIẾT ${currentPPCT}: ${currentTopic.toUpperCase()}**

   BẮT BUỘC DÙNG ĐÚNG BẢNG 2 CỘT VỚI TIÊU ĐỀ CHÍNH XÁC:
   | **Hoạt động của GV và HS** | **Dự kiến sản phẩm** |
   | :--- | :--- |

   (TUYỆT ĐỐI CẤM TẠO BẢNG 3 CỘT. CẤM TUYỆT ĐỐI TÁCH 'Bước 1' THÀNH 1 CỘT RIÊNG. BẢNG BẮT BUỘC PHẢI CÓ ĐÚNG 2 CỘT: CỘT 1 CHỨA CẢ TIÊU ĐỀ BƯỚC 1/2/3/4 VÀ LỜI DẪN, CỘT 2 CHỨA ĐẦY ĐỦ KIẾN THỨC VÀ LỜI GIẢI CHI TIẾT 100%).
   (TUYỆT ĐỐI CẤM TẠO BẢNG CÓ CỘT "Hoạt động" VÀ "Nội dung chi tiết". CẤM TUYỆT ĐỐI ĐƯA 4 BƯỚC SANG CỘT 2. CẤM ĐƯA HƯỚNG DẪN VỀ NHÀ VÀO TRONG BẢNG HOẶC DÙNG DẤU GẠCH ĐỨNG |).

   CHI TIẾT 2 CỘT CỦA BẢNG TIẾT ${currentPeriodNumber}:
   - CỘT 1 (Hoạt động của GV và HS): TUYỆT ĐỐI KHÔNG ghi Mục tiêu, Phương pháp & Kĩ thuật, Tiến trình tổ chức hay các chữ cái a), b), c), a. Dưới mỗi tiêu đề hoạt động, bắt đầu TRỰC TIẾP NGAY vào 4 bước:
     * **1. HOẠT ĐỘNG KHỞI ĐỘNG (${timeAlloc.khoiDong} phút)** (bắt đầu trực tiếp ngay với **Bước 1: Giao nhiệm vụ học tập:**, **Bước 2: Thực hiện nhiệm vụ:**, **Bước 3: Báo cáo, thảo luận:**, **Bước 4: Kết luận, nhận định:**).
     * **2. HOẠT ĐỘNG HÌNH THÀNH KIẾN THỨC MỚI (${timeAlloc.hinhThanh} phút)** (Tập trung toàn bộ vào "${currentTopic}", chia **Hoạt động 1: [Tên mục 1] (${timeAlloc.hinhThanhSub1} phút)**, **Hoạt động 2: [Tên mục 2] (${timeAlloc.hinhThanhSub2} phút)**... Mỗi hoạt động đều có đủ 4 bước: Bước 1, Bước 2, Bước 3, Bước 4).
     * **3. HOẠT ĐỘNG LUYỆN TẬP (${timeAlloc.luyenTap} phút)** (kèm đủ 4 bước: Bước 1, Bước 2, Bước 3, Bước 4).
     * **4. HOẠT ĐỘNG VẬN DỤNG (${timeAlloc.vanDung} phút)** (kèm đủ 4 bước: Bước 1, Bước 2, Bước 3, Bước 4).

   - CỘT 2 (Dự kiến sản phẩm): BẮT BUỘC ĐÁNH SỐ ĐỀ MỤC TƯƠNG ỨNG 1-1 ĐẦY ĐỦ VỚI CỘT 1:
     * Tương ứng Hoạt động 1 ➡️ **1. [Tên mục 1]:** (Khái niệm, công thức, giải chi tiết Hoạt động khám phá, Luyện tập 1).
     * Tương ứng Hoạt động 2 ➡️ **2. [Tên mục 2]:** (Lý thuyết, quy tắc, giải chi tiết Ví dụ 2, Luyện tập 2 - CẤM TUYỆT ĐỐI BỎ SỐ "2.").
     * Tương ứng Hoạt động Luyện tập ➡️ **3. Luyện tập:** (Giải chi tiết 100% tất cả bài tập SGK liên quan).
     * Tương ứng Hoạt động Vận dụng ➡️ **4. Vận dụng:** (Bài toán thực tế có lời giải chi tiết 100%).

   - **TỔNG KẾT KIẾN THỨC (TIẾT ${currentPeriodNumber})** (Bài thơ 6-8 câu đúc kết kiến thức Tiết ${currentPeriodNumber}).
   - **HƯỚNG DẪN VỀ NHÀ (TIẾT ${currentPeriodNumber})** (Dùng gạch đầu dòng -, không in đậm: Ôn tập lý thuyết; Hướng dẫn phương pháp giải bài tập SGK/SBT; Bài tập nâng cao/bài tập khó phát triển tư duy kèm gợi ý hướng dẫn phương pháp giải chi tiết; Chuẩn bị tiết sau; Nhiệm vụ AI).

${isFinalPeriod ? `
3. VÌ ĐÂY LÀ TIẾT CUỐI CÙNG CỦA BÀI HỌC (${numDuration} TIẾT), HÃY BỔ SUNG THÊM Ở CUỐI:
   **TỔNG KẾT KIẾN THỨC (CẢ BÀI)**
   "[Tên bài thơ tổng kết toàn bài]" (Bài thơ tổng kết toàn bài 8-12 câu đúc kết trọn vẹn toàn bộ bài học).

   **HƯỚNG DẪN VỀ NHÀ (CẢ BÀI)**
   - Vẽ sơ đồ tư duy tổng kết toàn bộ kiến thức bài học vào vở.
   - Hướng dẫn giải chi tiết 100% tất cả bài tập cuối bài trong SGK & SBT (kèm phân tích phương pháp giải và lời giải hướng dẫn từng bước).
   - Bài tập vận dụng thực tế địa phương.
   - Chuẩn bị bài mới trong SGK.
   - Nhiệm vụ AI nâng cao (6.2TC1b).
` : ''}

=== BỘ NHỚ THAM CHIẾU DỮ LIỆU TÀI LIỆU SGK ===
${referenceCacheText.slice(0, 50000)}
=== HẾT BỘ NHỚ THAM CHIẾU ===`;

              const pNResult = await generateGeminiText({
                prompt: pNPrompt,
                apiKeys,
                images,
                maxOutputTokens: 16384
              });

              if (pNResult) {
                let cleanPN = stripIntroductoryChatter(pNResult)
                  .replace(/máy chiếu/gi, 'máy tính, tivi')
                  .replace(/Máy chiếu/gi, 'Máy tính, tivi')
                  .replace(/^[-_=\s]{4,}$/gm, '')
                  .replace(/(\n\s*---\s*){2,}/g, '\n\n');
                cleanPN = normalizeVietnameseTerminology(cleanPN);
                cleanPN = rebalanceLessonPlanActivityDurations(cleanPN, targetPeriodMinutes, Boolean(profile.hideActivityTime));
                accumulatedLessonMarkdown += `\n\n${cleanPN}\n\n`;
              }
            }
          }

          compiledMarkdown += `\n\n${accumulatedLessonMarkdown}\n\n`;
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        alert(`Lỗi kết nối AI bài ${lessonName}: ` + errMsg);
        if (errMsg.includes('Hạn ngạch') || errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
          setIsApiGuideOpen(true);
        }
      }
    }

    // Clean up signature duplicates and ensure single pristine signature block at the end
    let finalMarkdown = compiledMarkdown.trim();

    // Deduplicate any repeated signature tables or raw signature texts
    const bghSigner = profile.bghSigner?.trim() || 'Ban Giám Hiệu';
    const deptSigner = profile.deptSigner?.trim() || 'Tổ trưởng chuyên môn';
    const singleApprovalBlock = `\n\n| **DUYỆT CỦA BAN GIÁM HIỆU** | **DUYỆT CỦA TỔ CHUYÊN MÔN** |\n| :---: | :---: |\n| <br><br><br><br>**${bghSigner}** | <br><br><br><br>**${deptSigner}** |`;

    // Remove any text or table signature blocks from finalMarkdown
    finalMarkdown = finalMarkdown
      .replace(/\|[ \t]*(?:DUYỆT CỦA BAN GIÁM HIỆU|DUYỆT CỦA BGH|Duyệt của BGH|XÁC NHẬN BGH)[ \t]*\|[\s\S]*?(?=\n\s*(?:\|[ \t]*(?:DUYỆT CỦA|XÁC NHẬN)|\n\s*\n|$))/gi, '')
      .replace(/(?:DUYỆT CỦA BAN GIÁM HIỆU|DUYỆT CỦA BGH)[\s\S]*?(?:DUYỆT CỦA TỔ CHUYÊN MÔN|TỔ TRƯỞNG CHUYÊN MÔN)[\s\S]*?(?=\n\s*\n|$)/gi, '')
      .trim();

    // Append exactly ONE pristine signature table at the very end
    finalMarkdown += singleApprovalBlock;

    // Convert any ISO dates in Ngày soạn to DD/MM/YYYY
    finalMarkdown = finalMarkdown.replace(/Ngày soạn:\s*(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/gi, (_, y, m, d) => {
      return `Ngày soạn: ${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    });

    // Clean up any redundant "Kế hoạch bài dạy" at the very beginning
    finalMarkdown = finalMarkdown
      .replace(/^Kế hoạch bài dạy[^\n]*\n+/i, '')
      .trim();

    // Sanitize and repair math formulas for flawless KaTeX and Word export
    finalMarkdown = sanitizeMathForVietnamese(finalMarkdown);
    finalMarkdown = rebalanceLessonPlanActivityDurations(finalMarkdown, targetPeriodMinutes, Boolean(profile.hideActivityTime));

    setGeneratedContent(finalMarkdown);
    setIsGenerating(false);
    setStatusMessage('Đã soạn xong toàn bộ giáo án CV 5512!');
    setStatusType('success');
    setActiveTab(3); // Switch to Editor view tab
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors selection:bg-cyan-500 selection:text-slate-950 ${
      theme === 'light'
        ? 'bg-slate-100 text-slate-900'
        : theme === 'dark'
        ? 'bg-[#030712] text-slate-100'
        : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Top Banner Header */}
      <HeaderBanner
        statusMessage={statusMessage}
        statusType={statusType}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused(!isPaused)}
        apiKeysCount={apiKeysInput.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean).length}
        onOpenApiGuide={() => setIsApiGuideOpen(true)}
        onOpenLicenseModal={() => setIsLicenseModalOpen(true)}
        onOpenCommunityRepo={() => setActiveTab(11)}
        onOpenTeacherForum={() => setActiveTab(12)}
        onOpenVoiceDocConverter={() => {
          setVoiceDocInitialTab('pdf_to_word');
          setIsVoiceDocModalOpen(true);
        }}
        onOpenAudioTts={() => {
          setVoiceDocInitialTab('doc_to_speech');
          setIsVoiceDocModalOpen(true);
        }}
        onLogout={handleLogout}
        licenseExpStr={validateLicenseKey(licenseKey).expStr || 'Chưa kích hoạt'}
        currentTheme={theme}
        onChangeTheme={handleThemeChange}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 space-y-5">
        {/* Tab Navigation Menu Bar: 3-Row Full Overview Grid for all 15 Tabs (No horizontal scroll needed!) */}
        <div className={`border rounded-2xl p-2.5 sm:p-3 shadow-xl sticky top-2 z-40 backdrop-blur-md transition-all ${
          theme === 'light'
            ? 'bg-white/95 border-slate-300 shadow-slate-200'
            : 'bg-slate-900/95 border-slate-800/90 shadow-2xl'
        }`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 sm:gap-2">
            {/* Tab 1: Lớp & PP Dạy */}
            <button
              onClick={() => setActiveTab(1)}
              className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all border text-left w-full ${
                activeTab === 1
                  ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-600/30 border-sky-400 scale-[1.02]'
                  : 'bg-sky-950/60 text-sky-200 hover:bg-sky-900/80 border-sky-500/50 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-sky-300 shrink-0" />
              <span className="truncate">1. Lớp & PP Dạy</span>
            </button>

            {/* Tab 2: Quét SGK & AI */}
            <button
              onClick={() => setActiveTab(2)}
              className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all border text-left w-full ${
                activeTab === 2
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-600/30 border-teal-400 scale-[1.02]'
                  : 'bg-teal-950/60 text-teal-200 hover:bg-teal-900/80 border-teal-500/50 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-300 shrink-0" />
              <span className="truncate">2. Quét SGK & AI</span>
            </button>

            {/* Tab 3: Trình Duyệt GA */}
            <button
              onClick={() => setActiveTab(3)}
              className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all border text-left w-full ${
                activeTab === 3
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-600/30 border-blue-400 scale-[1.02]'
                  : 'bg-blue-950/60 text-blue-200 hover:bg-blue-900/80 border-blue-500/50 hover:text-white'
              }`}
            >
              <FileEdit className="w-3.5 h-3.5 text-blue-300 shrink-0" />
              <span className="truncate">3. Trình Duyệt GA</span>
            </button>

            {/* Tab 4: Trộn Đề & Ma trận */}
            <button
              onClick={() => setActiveTab(4)}
              className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all border text-left w-full ${
                activeTab === 4
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-600/30 border-violet-400 scale-[1.02]'
                  : 'bg-violet-950/60 text-violet-200 hover:bg-violet-900/80 border-violet-500/50 hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-violet-300 shrink-0" />
              <span className="truncate">4. Trộn Đề & Ma Trận</span>
            </button>

            {/* Tab 5: Audio & Tự Học */}
            <button
              onClick={() => setActiveTab(5)}
              className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all border text-left w-full ${
                activeTab === 5
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/30 border-pink-400 scale-[1.02]'
                  : 'bg-pink-950/60 text-pink-200 hover:bg-pink-900/80 border-pink-500/50 hover:text-white'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 text-pink-300 shrink-0" />
              <span className="truncate">5. Audio & Tự Học</span>
            </button>

            {/* Tab 6: Chấm Thi Vision */}
            <button
              onClick={() => setActiveTab(6)}
              className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all border text-left w-full ${
                activeTab === 6
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/30 border-amber-400 scale-[1.02]'
                  : 'bg-amber-950/60 text-amber-200 hover:bg-amber-900/80 border-amber-500/50 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="truncate">6. Chấm Thi Vision</span>
            </button>

            {/* Tab 7: Trợ lý AI */}
            <button
              onClick={() => setActiveTab(7)}
              className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all border text-left w-full ${
                activeTab === 7
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30 border-cyan-400 scale-[1.02]'
                  : 'bg-cyan-950/60 text-cyan-200 hover:bg-cyan-900/80 border-cyan-500/50 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              <span className="truncate">7. Trợ Lý AI</span>
            </button>

            {/* Tab 8: KHGD Phụ lục 1,2,3 */}
            <button
              onClick={() => setActiveTab(8)}
              className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all border text-left w-full ${
                activeTab === 8
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30 border-indigo-400 scale-[1.02]'
                  : 'bg-indigo-950/60 text-indigo-200 hover:bg-indigo-900/80 border-indigo-500/50 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
              <span className="truncate">8. KHGD Phụ Lục 1,2,3</span>
            </button>

            {/* Tab 9: Kế Hoạch Cá Nhân & Tổ Chuyên Môn */}
            <button
              onClick={() => setActiveTab(9)}
              className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all border text-left w-full ${
                activeTab === 9
                  ? 'bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 text-white shadow-md shadow-fuchsia-600/30 border-fuchsia-400 scale-[1.02]'
                  : 'bg-fuchsia-950/60 text-fuchsia-200 hover:bg-fuchsia-900/80 border-fuchsia-500/50 hover:text-white'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-fuchsia-300 shrink-0" />
              <span className="truncate">9. KH Cá Nhân & Tổ</span>
            </button>

            {/* Tab 10: Giới Thiệu & HDSD */}
            <button
              onClick={() => setActiveTab(10)}
              className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all border text-left w-full ${
                activeTab === 10
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/30 border-amber-400 scale-[1.02]'
                  : 'bg-amber-950/60 text-amber-200 hover:bg-amber-900/80 border-amber-500/50 hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="truncate">10. Giới Thiệu & HDSD</span>
            </button>

            {/* Tab 11: Kho Tài Liệu */}
            <button
              onClick={() => setActiveTab(11)}
              className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all border text-left w-full ${
                activeTab === 11
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-600/30 border-indigo-400 scale-[1.02]'
                  : 'bg-blue-950/60 text-blue-200 hover:bg-blue-900/80 border-blue-500/50 hover:text-white'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5 text-blue-300 shrink-0" />
              <span className="truncate">11. Kho Tài Liệu</span>
            </button>

            {/* Tab 12: Diễn Đàn & Nhắn Admin */}
            <button
              onClick={() => setActiveTab(12)}
              className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all border text-left w-full ${
                activeTab === 12
                  ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white shadow-md shadow-purple-600/30 border-purple-400 scale-[1.02]'
                  : 'bg-purple-950/60 text-purple-200 hover:bg-purple-900/80 border-purple-500/50 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="truncate">12. Diễn Đàn & Admin</span>
            </button>

            {/* Tab 13: Mô Phỏng AI */}
            <button
              onClick={() => setActiveTab(13)}
              className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all border text-left w-full ${
                activeTab === 13
                  ? 'bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600 text-white shadow-md shadow-cyan-600/30 border-cyan-400 scale-[1.02]'
                  : 'bg-cyan-950/60 text-cyan-200 hover:bg-cyan-900/80 border-cyan-500/50 hover:text-white'
              }`}
            >
              <Atom className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              <span className="truncate">13. Mô Phỏng Ảo AI</span>
            </button>

            {/* Tab 14: So Sánh & Tổng Hợp */}
            <button
              onClick={() => setActiveTab(14)}
              className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all border text-left w-full ${
                activeTab === 14
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-md shadow-emerald-600/30 border-emerald-400 scale-[1.02]'
                  : 'bg-emerald-950/60 text-emerald-200 hover:bg-emerald-900/80 border-emerald-500/50 hover:text-white'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span className="truncate">14. So Sánh & Tổng Hợp</span>
            </button>

            {/* Tab 15: Thẩm Định Thể Thức NĐ 30 & QĐ 3666 */}
            <button
              onClick={() => setActiveTab(15)}
              className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all border text-left w-full ${
                activeTab === 15
                  ? 'bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 text-white shadow-md shadow-rose-600/30 border-rose-400 scale-[1.02]'
                  : 'bg-rose-950/60 text-rose-200 hover:bg-rose-900/80 border-rose-500/50 hover:text-white'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-rose-300 shrink-0" />
              <span className="truncate">15. Thẩm Định Thể Thức</span>
            </button>
          </div>
        </div>

        {/* Tab Content Panels - Persistent Parallel Execution */}
        <div className="mt-4">
          <div className={activeTab === 1 ? 'block' : 'hidden'}>
            <Tab1ClassProfile
              profile={profile}
              onChangeProfile={setProfile}
              savedProfiles={savedProfiles}
              onSaveProfile={handleSaveProfile}
              onDeleteProfile={handleDeleteProfile}
              lessonText={lessonText}
              onChangeLessonText={setLessonText}
              selectedPP={selectedPP}
              onChangePP={setSelectedPP}
              selectedKT={selectedKT}
              onChangeKT={setSelectedKT}
              ppList={ppList}
              ktList={ktList}
              onAddPP={handleAddPP}
              onDelPP={handleDelPP}
              onAddKT={handleAddKT}
              onDelKT={handleDelKT}
              specificGoals={specificGoals}
              onChangeSpecificGoals={setSpecificGoals}
              isSplitMultiPeriodGoals={isSplitMultiPeriodGoals}
              onToggleSplitMultiPeriodGoals={setIsSplitMultiPeriodGoals}
              onNavigateTab={setActiveTab}
              onOpenLicenseModal={() => setIsLicenseModalOpen(true)}
              onOpenApiGuide={() => setIsApiGuideOpen(true)}
            />
          </div>

          <div className={activeTab === 2 ? 'block' : 'hidden'}>
            <Tab2ReferenceSGK
              sgkFile={sgkFile}
              sgkImageDataUrl={sgkImageDataUrl}
              onSgkFileChange={handleSgkFileChange}
              onSgkImageDataUrlChange={setSgkImageDataUrl}
              pageStart={pageStart}
              onPageStartChange={setPageStart}
              pageEnd={pageEnd}
              onPageEndChange={setPageEnd}
              referenceCacheText={referenceCacheText}
              onReferenceCacheChange={setReferenceCacheText}
              apiKeysInput={apiKeysInput}
              onApiKeysInputChange={setApiKeysInput}
              onExtractReferences={handleExtractReferences}
              onStartAIGeneration={handleStartAIGeneration}
              isGenerating={isGenerating}
              onOpenApiGuide={() => setIsApiGuideOpen(true)}
              onNavigateTab={setActiveTab}
              thoiluong={profile.thoiluong}
              hideActivityTime={profile.hideActivityTime}
              onToggleHideActivityTime={val => setProfile(prev => ({ ...prev, hideActivityTime: val }))}
            />
          </div>

          <div className={activeTab === 3 ? 'block' : 'hidden'}>
            <Tab3EditorExport
              content={generatedContent}
              onChangeContent={setGeneratedContent}
              headerText={headerText}
              onChangeHeaderText={setHeaderText}
              footerText={footerText}
              onChangeFooterText={setFooterText}
              watermarkText={watermarkText}
              onChangeWatermarkText={setWatermarkText}
              showPageNumbers={showPageNumbers}
              onTogglePageNumbers={setShowPageNumbers}
              monHoc={profile.mon}
              lop={profile.lop}
              ngaySoan={profile.ngaysoan || ''}
              thoiluong={profile.thoiluong}
              hideActivityTime={profile.hideActivityTime}
              onToggleHideActivityTime={val => setProfile(prev => ({ ...prev, hideActivityTime: val }))}
              onOpenTikzStudio={() => setActiveTab(9)}
              apiKeysInput={apiKeysInput}
            />
          </div>

          <div className={activeTab === 4 ? 'block' : 'hidden'}>
            <Tab4ExamGenerator
              lessonContent={generatedContent}
              lessonText={lessonText}
              referenceCacheText={referenceCacheText}
              apiKeysInput={apiKeysInput}
              monHoc={profile.mon}
              lop={profile.lop}
              onOpenApiGuide={() => setIsApiGuideOpen(true)}
            />
          </div>

          <div className={activeTab === 5 ? 'block' : 'hidden'}>
            <Tab5MaterialsAudio
              lessonContent={generatedContent}
              lessonText={lessonText}
              referenceCacheText={referenceCacheText}
              apiKeysInput={apiKeysInput}
              monHoc={profile.mon}
              lop={profile.lop}
              ppList={ppList}
              ktList={ktList}
              initialPP={selectedPP}
              initialKT={selectedKT}
              onOpenApiGuide={() => setIsApiGuideOpen(true)}
              onOpenVoiceDocConverter={() => setIsVoiceDocModalOpen(true)}
              onInsertToLessonContent={(text) => {
                setGeneratedContent(prev => (prev ? prev + '\n\n' : '') + text);
                setActiveTab(3);
                setStatusMessage('Đã chèn nội dung bóc băng vào giáo án Tab 3!');
                setStatusType('success');
              }}
            />
          </div>

          <div className={activeTab === 6 ? 'block' : 'hidden'}>
            <Tab6VisionGrading
              apiKeysInput={apiKeysInput}
              examResults={examResults}
              onAddExamResult={res => setExamResults(prev => [...prev, res])}
              onClearExamResults={() => setExamResults([])}
              onOpenApiGuide={() => setIsApiGuideOpen(true)}
              monHoc={profile.mon}
              lop={profile.lop}
            />
          </div>

          <div className={activeTab === 7 ? 'block' : 'hidden'}>
            <Tab7AIChatbot
              apiKeysInput={apiKeysInput}
              monHoc={profile.mon}
              lop={profile.lop}
              onOpenApiGuide={() => setIsApiGuideOpen(true)}
            />
          </div>

          <div className={activeTab === 8 ? 'block' : 'hidden'}>
            <Tab8EducationPlan5512
              profile={profile}
              onChangeProfile={setProfile}
              apiKeysInput={apiKeysInput}
              referenceCacheText={referenceCacheText}
              onOpenApiGuide={() => setIsApiGuideOpen(true)}
              specificGoals={specificGoals}
            />
          </div>

          <div className={activeTab === 9 ? 'block' : 'hidden'}>
            <Tab9PersonalDepartmentPlan
              profile={profile}
              onChangeProfile={setProfile}
              apiKeysInput={apiKeysInput}
              onOpenApiGuide={() => setIsApiGuideOpen(true)}
            />
          </div>

          <div className={activeTab === 10 ? 'block' : 'hidden'}>
            <Tab10Introduction
              onNavigateTab={tabNum => setActiveTab(tabNum)}
              onOpenLicenseModal={() => setIsLicenseModalOpen(true)}
              onOpenApiGuide={() => setIsApiGuideOpen(true)}
            />
          </div>

          <div className={activeTab === 11 ? 'block' : 'hidden'}>
            <Tab11CommunityRepository
              onAppendToReferenceCache={(text) => {
                setReferenceCacheText(prev => prev ? `${prev}\n\n${text}` : text);
                setStatusMessage('Đã nạp văn bản tham chiếu từ Kho Tài Liệu vào Bộ nhớ AI thành công!');
                setStatusType('success');
              }}
              onNavigateTab={setActiveTab}
              currentSubject={profile.mon}
              currentGrade={profile.lop}
              teacherName={profile.teacherSigner || 'Giáo viên'}
              schoolName={profile.schoolName || 'Trường THCS Phùng Khắc Khoan'}
            />
          </div>

          <div className={activeTab === 12 ? 'block' : 'hidden'}>
            <Tab12TeacherForum
              onOpenLicenseModal={() => setIsLicenseModalOpen(true)}
              onNavigateTab={setActiveTab}
            />
          </div>

          <div className={activeTab === 13 ? 'block' : 'hidden'}>
            <Tab13InteractiveSimulations
              apiKeysInput={apiKeysInput}
              onOpenApiGuide={() => setIsApiGuideOpen(true)}
              onOpenLicenseModal={() => setIsLicenseModalOpen(true)}
              onSendImageToLessonPlan={(dataUrl) => {
                setSgkImageDataUrl(dataUrl);
                setReferenceCacheText(prev => prev ? `${prev}\n\n[Hình ảnh mô phỏng trực quan đã được nạp vào giáo án]` : '[Hình ảnh mô phỏng trực quan]');
                setStatusMessage('Đã nạp ảnh mô phỏng trong suốt vào Tư liệu Giáo án!');
                setStatusType('success');
              }}
            />
          </div>

          <div className={activeTab === 14 ? 'block' : 'hidden'}>
            <Tab14DocComparisonSynthesis
              apiKeysInput={apiKeysInput}
              monHoc={profile.mon}
              lop={profile.lop}
              onOpenApiGuide={() => setIsApiGuideOpen(true)}
            />
          </div>

          <div className={activeTab === 15 ? 'block' : 'hidden'}>
            <Tab15DocumentFormatChecker
              apiKeysInput={apiKeysInput}
            />
          </div>

        </div>
      </main>

      {/* Guide & API Key Input Modal */}
      <ApiGuideModal
        isOpen={isApiGuideOpen}
        onClose={() => setIsApiGuideOpen(false)}
        currentKeys={apiKeysInput}
        onSaveKeys={(newKeys) => {
          setApiKeysInput(newKeys);
          localStorage.setItem('gemini_api_keys_v48', newKeys);
        }}
        onNavigateToTab={(tab) => {
          setActiveTab(tab);
          setIsApiGuideOpen(false);
        }}
      />

      {/* Floating AI Support Chatbot (Available immediately upon login) */}
      {isLicenseUnlocked && (
        <FloatingAIChatbot
          apiKeysInput={apiKeysInput}
          isUnlocked={isLicenseUnlocked}
          onNavigateTab={setActiveTab}
          onOpenLicenseModal={() => setIsLicenseModalOpen(true)}
          onOpenApiGuide={() => setIsApiGuideOpen(true)}
        />
      )}

      {/* License Gate (Full screen lock if not authenticated) */}
      {!isLicenseUnlocked && (
        <LicenseGate
          currentKey={licenseKey}
          onActivateKey={key => {
            setLicenseKey(key);
            setIsLicenseUnlocked(true);
          }}
        />
      )}

      {/* License & Admin Management Modal */}
      {isLicenseModalOpen && (
        <LicenseModal
          isOpen={isLicenseModalOpen}
          onClose={() => setIsLicenseModalOpen(false)}
          currentKey={licenseKey}
          onSaveKey={key => {
            setLicenseKey(key);
            setIsLicenseUnlocked(true);
          }}
          onLogout={handleLogout}
        />
      )}

      {/* Voice Dictation & PDF OCR to Word Converter Modal */}
      {isVoiceDocModalOpen && (
        <VoiceAndDocConverterModal
          isOpen={isVoiceDocModalOpen}
          onClose={() => setIsVoiceDocModalOpen(false)}
          apiKeysInput={apiKeysInput}
          initialTab={voiceDocInitialTab}
          onInsertToDoc={(text) => {
            setGeneratedContent(prev => (prev ? prev + '\n\n' : '') + text);
            setActiveTab(3);
            setStatusMessage('Đã chèn văn bản giọng nói vào giáo án!');
            setStatusType('success');
          }}
        />
      )}
    </div>
  );
}
