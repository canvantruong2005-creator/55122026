import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  Play,
  RotateCcw,
  Maximize2,
  Minimize2,
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  Layers,
  Code,
  Eye,
  ShieldCheck,
  Lock,
  Download,
  Share2,
  CheckCircle2,
  Atom,
  Flame,
  Activity,
  Cpu,
  BookOpen,
  HelpCircle,
  FolderPlus,
  Camera,
  Scissors,
  Copy,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Palette,
  Sliders,
  Settings,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { InteractiveSimulation, TeacherProfile } from '../../types';
import {
  subscribeToSimulations,
  addSimulation,
  updateSimulation,
  deleteSimulation,
  generateSimulationWithAI,
  BUILTIN_SIMULATIONS
} from '../../lib/simulationService';
import { getCachedTeacherProfile, subscribeToTeacherProfile } from '../../lib/teacherProfile';
import { getDeviceId } from '../../lib/licenseUtils';
import { VoiceMicButton } from '../VoiceMicButton';
import { SimulationImageExtractorModal } from '../modals/SimulationImageExtractorModal';
import { InteractiveGeometryCanvas } from './tab13/InteractiveGeometryCanvas';
import { StepByStepGeometryGuide } from './tab13/StepByStepGeometryGuide';

interface Tab13InteractiveSimulationsProps {
  apiKeysInput: string;
  onOpenApiGuide: () => void;
  onOpenLicenseModal?: () => void;
  onSendImageToLessonPlan?: (dataUrl: string) => void;
}

export const Tab13InteractiveSimulations: React.FC<Tab13InteractiveSimulationsProps> = ({
  apiKeysInput,
  onOpenApiGuide,
  onOpenLicenseModal,
  onSendImageToLessonPlan
}) => {
  // State
  const [profile, setProfile] = useState<TeacherProfile>(getCachedTeacherProfile());
  const [myDeviceId, setMyDeviceId] = useState<string>('');
  const [simulations, setSimulations] = useState<InteractiveSimulation[]>(BUILTIN_SIMULATIONS);
  const [selectedSim, setSelectedSim] = useState<InteractiveSimulation>(BUILTIN_SIMULATIONS[0]);

  // Zoom and Scaling State
  const [zoomLevel, setZoomLevel] = useState<number>(100); // 50% to 200%

  // Geometry & Styling Override State
  const [isStyleCustomizerOpen, setIsStyleCustomizerOpen] = useState<boolean>(false);
  const [pointColor, setPointColor] = useState<string>('#ef4444'); // Red points
  const [lineColor, setLineColor] = useState<string>('#3b82f6'); // Blue lines
  const [segmentColor, setSegmentColor] = useState<string>('#10b981'); // Emerald segments
  const [pointSize, setPointSize] = useState<number>(5);
  const [lineWidth, setLineWidth] = useState<number>(2);
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const [backgroundColor, setBackgroundColor] = useState<string>('default');

  // Image Extractor / Background Removal Modal State
  const [isExtractorOpen, setIsExtractorOpen] = useState<boolean>(false);
  const [extractorInitialImage, setExtractorInitialImage] = useState<string>('');

  // Sub-view Tab Switcher: Geometry Studio vs Step-by-Step Guide vs Interactive Sim Lab
  const [subView, setSubView] = useState<'geometry_canvas' | 'geometry_guide' | 'simulations'>('geometry_canvas');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const iframeContainerRef = useRef<HTMLDivElement>(null);

  // AI Generator Modal State
  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiSubject, setAiSubject] = useState<string>('Vật lí');
  const [aiGrade, setAiGrade] = useState<string>('Lớp 8');
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [generatedDraft, setGeneratedDraft] = useState<{
    title: string;
    topic: string;
    description: string;
    tags: string[];
    htmlCode: string;
  } | null>(null);

  // Edit / Manual Modal State
  const [editingSim, setEditingSim] = useState<InteractiveSimulation | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editSubject, setEditSubject] = useState<string>('Toán học');
  const [editGrade, setEditGrade] = useState<string>('Lớp 7');
  const [editTopic, setEditTopic] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');
  const [editHtml, setEditHtml] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Allow teachers to manage simulations
  const canManageSimulations = true;

  useEffect(() => {
    setMyDeviceId(getDeviceId());

    const unsubProfile = subscribeToTeacherProfile((newProf) => {
      setProfile(newProf);
    });

    const unsubSims = subscribeToSimulations((newSimList) => {
      setSimulations(newSimList);
      if (newSimList.length > 0 && !selectedSim) {
        setSelectedSim(newSimList[0]);
      }
    });

    return () => {
      unsubProfile?.();
      unsubSims?.();
    };
  }, []);

  // Filtered Simulations
  const filteredSimulations = useMemo(() => {
    return simulations.filter((sim) => {
      if (selectedSubject !== 'all' && sim.subject !== selectedSubject) return false;
      if (selectedGrade !== 'all' && sim.grade !== selectedGrade) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (sim.title || '').toLowerCase().includes(q);
        const matchTopic = (sim.topic || '').toLowerCase().includes(q);
        const matchDesc = (sim.description || '').toLowerCase().includes(q);
        const matchTags = (sim.tags || []).some((t) => t.toLowerCase().includes(q));
        return matchTitle || matchTopic || matchDesc || matchTags;
      }
      return true;
    });
  }, [simulations, selectedSubject, selectedGrade, searchQuery]);

  // Compute Modified HTML with Geometry Color Injection & Styling
  const computedHtmlCode = useMemo(() => {
    if (!selectedSim || !selectedSim.htmlCode) return '';
    let code = selectedSim.htmlCode;

    // Inject CSS styling overrides and JS geometry hooks if user adjusted styling
    const customStyleBlock = `
<style id="sim-custom-theme-overrides">
  :root {
    --point-color: ${pointColor} !important;
    --line-color: ${lineColor} !important;
    --segment-color: ${segmentColor} !important;
    --text-color: ${textColor} !important;
  }
  ${backgroundColor === 'white' ? 'body, html, canvas { background: #ffffff !important; color: #111827 !important; }' : ''}
  ${backgroundColor === 'transparent' ? 'body, html, canvas { background: transparent !important; }' : ''}
  ${backgroundColor === 'dark' ? 'body, html { background: #0f172a !important; color: #f8fafc !important; }' : ''}
  
  /* SVG geometry classes standard override */
  .point, circle[data-type="point"], circle.geometry-point { fill: ${pointColor} !important; r: ${pointSize}px !important; }
  .line, line, path.geometry-line { stroke: ${lineColor} !important; stroke-width: ${lineWidth}px !important; }
  .segment, line.segment { stroke: ${segmentColor} !important; stroke-width: ${lineWidth}px !important; }
  .label, text { fill: ${textColor} !important; font-family: sans-serif !important; }
</style>
<script>
  window.addEventListener('DOMContentLoaded', function() {
    window.__CUSTOM_SIM_COLORS = {
      pointColor: '${pointColor}',
      lineColor: '${lineColor}',
      segmentColor: '${segmentColor}',
      pointSize: ${pointSize},
      lineWidth: ${lineWidth},
      textColor: '${textColor}'
    };
    // If simulation has hook for color update
    if (typeof window.onUpdateCustomColors === 'function') {
      window.onUpdateCustomColors(window.__CUSTOM_SIM_COLORS);
    }
  });
</script>
`;

    if (code.includes('</head>')) {
      return code.replace('</head>', `${customStyleBlock}</head>`);
    } else if (code.includes('<body>')) {
      return code.replace('<body>', `<head>${customStyleBlock}</head><body>`);
    }
    return customStyleBlock + code;
  }, [selectedSim, pointColor, lineColor, segmentColor, pointSize, lineWidth, textColor, backgroundColor]);

  // Handle Generate with AI
  const handleGenerateSimulation = async () => {
    if (!aiPrompt.trim()) {
      alert('Vui lòng nhập mô tả hiện tượng hoặc chủ đề bài học cần mô phỏng!');
      return;
    }

    const keys = apiKeysInput ? apiKeysInput.split(/[\n,;]+/).map((k) => k.trim()).filter(Boolean) : [];

    setIsGeneratingAI(true);
    try {
      const result = await generateSimulationWithAI(aiPrompt.trim(), aiSubject, aiGrade, keys);
      setGeneratedDraft(result);
    } catch (err: any) {
      alert('Lỗi tạo mô phỏng AI: ' + (err?.message || String(err)));
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Save AI Draft as new simulation
  const handleSaveDraftToLibrary = async () => {
    if (!generatedDraft) return;
    setIsSaving(true);
    try {
      const newId = await addSimulation({
        title: generatedDraft.title,
        subject: aiSubject,
        grade: aiGrade,
        topic: generatedDraft.topic,
        description: generatedDraft.description,
        htmlCode: generatedDraft.htmlCode,
        tags: generatedDraft.tags,
        authorName: profile.name || 'Admin',
        authorSchool: profile.school || 'THCS',
        authorDeviceId: myDeviceId,
        isFeatured: false
      });

      const newSimItem: InteractiveSimulation = {
        id: newId,
        title: generatedDraft.title,
        subject: aiSubject,
        grade: aiGrade,
        topic: generatedDraft.topic,
        description: generatedDraft.description,
        htmlCode: generatedDraft.htmlCode,
        tags: generatedDraft.tags,
        authorName: profile.name,
        authorSchool: profile.school,
        authorDeviceId: myDeviceId,
        createdAt: new Date().toISOString().split('T')[0]
      };

      setSelectedSim(newSimItem);
      setIsGeneratorOpen(false);
      setGeneratedDraft(null);
      setAiPrompt('');
      alert('✓ Đã tạo và lưu mô phỏng tương tác thành công vào cơ sở dữ liệu Firebase!');
    } catch (err: any) {
      alert('Lỗi lưu mô phỏng: ' + (err?.message || String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (sim: InteractiveSimulation) => {
    setEditingSim(sim);
    setEditTitle(sim.title);
    setEditSubject(sim.subject);
    setEditGrade(sim.grade);
    setEditTopic(sim.topic);
    setEditDesc(sim.description);
    setEditHtml(sim.htmlCode);
    setIsEditModalOpen(true);
  };

  // Open Create Manual Modal
  const handleOpenCreateManual = () => {
    setEditingSim(null);
    setEditTitle('');
    setEditSubject('Toán học');
    setEditGrade('Lớp 7');
    setEditTopic('');
    setEditDesc('');
    setEditHtml(BUILTIN_SIMULATIONS[0].htmlCode);
    setIsEditModalOpen(true);
  };

  // Save Edit / Manual
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editHtml.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề và mã nguồn HTML mô phỏng!');
      return;
    }

    setIsSaving(true);
    try {
      if (editingSim) {
        await updateSimulation(editingSim.id, {
          title: editTitle.trim(),
          subject: editSubject,
          grade: editGrade,
          topic: editTopic.trim(),
          description: editDesc.trim(),
          htmlCode: editHtml,
          updatedAt: new Date().toISOString()
        });

        const updated = {
          ...editingSim,
          title: editTitle.trim(),
          subject: editSubject,
          grade: editGrade,
          topic: editTopic.trim(),
          description: editDesc.trim(),
          htmlCode: editHtml,
          updatedAt: new Date().toISOString()
        };
        setSelectedSim(updated);
        alert('✓ Đã cập nhật mô phỏng thành công!');
      } else {
        const newId = await addSimulation({
          title: editTitle.trim(),
          subject: editSubject,
          grade: editGrade,
          topic: editTopic.trim(),
          description: editDesc.trim(),
          htmlCode: editHtml,
          tags: [editSubject, editGrade],
          authorName: profile.name || 'Admin',
          authorSchool: profile.school || 'THCS',
          authorDeviceId: myDeviceId,
          isFeatured: false
        });

        const newSimItem: InteractiveSimulation = {
          id: newId,
          title: editTitle.trim(),
          subject: editSubject,
          grade: editGrade,
          topic: editTopic.trim(),
          description: editDesc.trim(),
          htmlCode: editHtml,
          tags: [editSubject, editGrade],
          authorName: profile.name,
          authorSchool: profile.school,
          authorDeviceId: myDeviceId,
          createdAt: new Date().toISOString().split('T')[0]
        };
        setSelectedSim(newSimItem);
        alert('✓ Đã thêm mô phỏng mới vào cơ sở dữ liệu!');
      }
      setIsEditModalOpen(false);
    } catch (err: any) {
      alert('Lỗi khi lưu: ' + (err?.message || String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Sim
  const handleDeleteSim = async (sim: InteractiveSimulation) => {
    if (BUILTIN_SIMULATIONS.some((b) => b.id === sim.id)) {
      alert('Không thể xóa mô phỏng mặc định của hệ thống!');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mô phỏng "${sim.title}"?`)) return;

    try {
      await deleteSimulation(sim.id);
      if (selectedSim.id === sim.id) {
        setSelectedSim(BUILTIN_SIMULATIONS[0]);
      }
      alert('✓ Đã xóa mô phỏng!');
    } catch (err: any) {
      alert('Lỗi xóa mô phỏng: ' + (err?.message || String(err)));
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!iframeContainerRef.current) return;
    if (!document.fullscreenElement) {
      iframeContainerRef.current.requestFullscreen?.().catch((err) => {
        console.warn('Fullscreen error:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Capture snapshot from simulation or open image extractor
  const handleCaptureSimulation = () => {
    try {
      if (iframeContainerRef.current) {
        const iframe = iframeContainerRef.current.querySelector('iframe');
        if (iframe && iframe.contentWindow) {
          const doc = iframe.contentWindow.document;
          const canvas = doc.querySelector('canvas');
          if (canvas) {
            const dataUrl = canvas.toDataURL('image/png');
            setExtractorInitialImage(dataUrl);
            setIsExtractorOpen(true);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Cannot direct extract canvas due to sandbox:', e);
    }
    setExtractorInitialImage('');
    setIsExtractorOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-700/60 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5">
                <Atom className="w-3.5 h-3.5 text-cyan-400" />
                <span>PHÒNG THÍ NGHIỆM ẢO & MÔ PHỎNG TRỰC QUAN AI</span>
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                <Scissors className="w-3.5 h-3.5" /> Chụp & Tách Nền Trong Suốt Cho Giáo Án
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Tự Động Đồng Bộ Đám Mây
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Mô Phỏng Trực Quan, Chụp Ảnh Tách Nền & Tùy Biến Hình Học
            </h2>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Tạo lập các mô hình tương tác Vật lí, Hóa học, Sinh học, Toán học, KHTN và Công nghệ trực quan.
              Cho phép giáo viên <strong>phóng to thu nhỏ, tùy chỉnh màu điểm/đường/đoạn thẳng, chụp ảnh mô phỏng, xóa phông nền trong suốt</strong> và dán trực tiếp vào giáo án, bài giảng.
            </p>
          </div>

          {/* Quick Action Button for Admin / Authorized */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setExtractorInitialImage('');
                setIsExtractorOpen(true);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="Tách nền trong suốt từ ảnh chụp mô phỏng / hình học bất kỳ"
            >
              <Scissors className="w-4 h-4 text-emerald-200" />
              <span>✂️ Tách Nền Ảnh (Ctrl+V)</span>
            </button>

            {canManageSimulations ? (
              <>
                <button
                  onClick={() => setIsGeneratorOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-all hover:scale-105"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>🤖 Tạo Mô Phỏng Bằng AI</span>
                </button>

                <button
                  onClick={handleOpenCreateManual}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700"
                >
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span>Thêm Code Thủ Công</span>
                </button>
              </>
            ) : (
              <div className="bg-slate-950/80 p-3 rounded-xl border border-amber-500/40 text-xs text-amber-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Quyền tạo/sửa mô phỏng dành riêng cho <strong>Admin hoặc tài khoản VIP</strong>.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Sub-navigation Selector Bar */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg">
        <button
          type="button"
          onClick={() => setSubView('geometry_canvas')}
          className={`flex-1 min-w-[200px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            subView === 'geometry_canvas'
              ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-900/40 border border-indigo-400/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span>📐</span>
          <span>STUDIO VẼ HÌNH HỌC TƯƠNG TÁC (LỚP 1 - 12)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubView('geometry_guide')}
          className={`flex-1 min-w-[200px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            subView === 'geometry_guide'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/40 border border-emerald-400/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span>📖</span>
          <span>HƯỚNG DẪN TỪNG BƯỚC CHO HỌC SINH (YẾU VẼ HÌNH)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubView('simulations')}
          className={`flex-1 min-w-[200px] py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            subView === 'simulations'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/40 border border-purple-400/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span>🔬</span>
          <span>PHÒNG THÍ NGHIỆM MÔ PHỎNG AI (30+ BÀI HỌC)</span>
        </button>
      </div>

      {/* Subview 1: Geometry Canvas */}
      {subView === 'geometry_canvas' && (
        <InteractiveGeometryCanvas
          onSendImageToLessonPlan={onSendImageToLessonPlan}
          onOpenExtractor={(img) => {
            setExtractorInitialImage(img);
            setIsExtractorOpen(true);
          }}
        />
      )}

      {/* Subview 2: Step-by-Step Geometry Guide */}
      {subView === 'geometry_guide' && (
        <StepByStepGeometryGuide
          onSendImageToLessonPlan={onSendImageToLessonPlan}
          onOpenExtractor={(img) => {
            setExtractorInitialImage(img);
            setIsExtractorOpen(true);
          }}
        />
      )}

      {/* Subview 3: Main Simulation Workbench */}
      {subView === 'simulations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Active Interactive Sandbox (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            {/* Header: Title + Meta + Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-500/40">
                    {selectedSim.subject} - {selectedSim.grade}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {selectedSim.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{selectedSim.topic}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Zoom In / Zoom Out Controls */}
                <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setZoomLevel(prev => Math.max(50, prev - 15))}
                    className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-all"
                    title="Thu nhỏ mô phỏng (Zoom Out)"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 font-mono text-[11px] font-bold text-cyan-300 select-none">
                    {zoomLevel}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(prev => Math.min(200, prev + 15))}
                    className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-all"
                    title="Phóng to mô phỏng (Zoom In)"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  {zoomLevel !== 100 && (
                    <button
                      type="button"
                      onClick={() => setZoomLevel(100)}
                      className="text-[10px] text-slate-400 hover:text-amber-300 px-1 border-l border-slate-700"
                      title="Đặt lại tỉ lệ 100%"
                    >
                      100%
                    </button>
                  )}
                </div>

                {/* Color & Geometry Style Customizer Toggle */}
                <button
                  type="button"
                  onClick={() => setIsStyleCustomizerOpen(!isStyleCustomizerOpen)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    isStyleCustomizerOpen
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-900/40'
                      : 'bg-slate-950 text-purple-300 border-purple-500/40 hover:bg-purple-950/50'
                  }`}
                  title="Cài đặt màu điểm, đường thẳng, đoạn thẳng và nét vẽ hình học"
                >
                  <Palette className="w-3.5 h-3.5 text-amber-300" />
                  <span>🎨 Đổi Màu Hình</span>
                </button>

                {/* Snapshot & Background Remover Button */}
                <button
                  type="button"
                  onClick={handleCaptureSimulation}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
                  title="Chụp ảnh mô phỏng hiện tại và tách phông nền trong suốt để dán sang Word"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-300" />
                  <span>📸 Chụp & Tách Nền</span>
                </button>

                {canManageSimulations && (
                  <button
                    onClick={() => handleOpenEdit(selectedSim)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-700"
                    title="Chỉnh sửa mã HTML của mô phỏng này"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-400" /> Sửa
                  </button>
                )}

                {profile.isAdmin && (
                  <button
                    onClick={() => handleDeleteSim(selectedSim)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 text-xs border border-slate-700 cursor-pointer"
                    title="Xóa mô phỏng này (Quyền Admin)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={toggleFullscreen}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 shadow"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Toàn màn hình
                </button>
              </div>
            </div>

            {/* Geometry / Color Setting Panel (Collapsible) */}
            {isStyleCustomizerOpen && (
              <div className="bg-slate-950 p-3.5 rounded-xl border border-purple-800/60 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                    <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                    <span>Cài Đặt Màu Sắc Điểm, Đoạn Thẳng, Đường Thẳng & Nền Mô Phỏng</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPointColor('#ef4444');
                      setLineColor('#3b82f6');
                      setSegmentColor('#10b981');
                      setTextColor('#ffffff');
                      setPointSize(5);
                      setLineWidth(2);
                      setBackgroundColor('default');
                    }}
                    className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Mặc định
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {/* Point Color */}
                  <div className="space-y-1 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-300 block font-medium">Màu Điểm (Points):</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={pointColor}
                        onChange={e => setPointColor(e.target.value)}
                        className="w-7 h-7 rounded border border-slate-700 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={pointColor}
                        onChange={e => setPointColor(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-[11px] font-mono text-slate-200"
                      />
                    </div>
                  </div>

                  {/* Line Color */}
                  <div className="space-y-1 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-300 block font-medium">Màu Đường Thẳng:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={lineColor}
                        onChange={e => setLineColor(e.target.value)}
                        className="w-7 h-7 rounded border border-slate-700 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={lineColor}
                        onChange={e => setLineColor(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-[11px] font-mono text-slate-200"
                      />
                    </div>
                  </div>

                  {/* Segment Color */}
                  <div className="space-y-1 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-300 block font-medium">Màu Đoạn Thẳng / Cạnh:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={segmentColor}
                        onChange={e => setSegmentColor(e.target.value)}
                        className="w-7 h-7 rounded border border-slate-700 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={segmentColor}
                        onChange={e => setSegmentColor(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-[11px] font-mono text-slate-200"
                      />
                    </div>
                  </div>

                  {/* Text Color */}
                  <div className="space-y-1 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-300 block font-medium">Màu Chữ & Ký Hiệu:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={textColor}
                        onChange={e => setTextColor(e.target.value)}
                        className="w-7 h-7 rounded border border-slate-700 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={textColor}
                        onChange={e => setTextColor(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-[11px] font-mono text-slate-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  {/* Point Size */}
                  <div className="flex items-center justify-between bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-300">Kích thước điểm:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="2"
                        max="12"
                        value={pointSize}
                        onChange={e => setPointSize(Number(e.target.value))}
                        className="w-24 accent-purple-500 cursor-pointer"
                      />
                      <span className="font-mono text-cyan-300 font-bold text-[11px] w-6">{pointSize}px</span>
                    </div>
                  </div>

                  {/* Line Thickness */}
                  <div className="flex items-center justify-between bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-300">Độ dày nét vẽ:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="8"
                        value={lineWidth}
                        onChange={e => setLineWidth(Number(e.target.value))}
                        className="w-24 accent-purple-500 cursor-pointer"
                      />
                      <span className="font-mono text-cyan-300 font-bold text-[11px] w-6">{lineWidth}px</span>
                    </div>
                  </div>

                  {/* Background Mode */}
                  <div className="flex items-center justify-between bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-300">Phông nền:</span>
                    <select
                      value={backgroundColor}
                      onChange={e => setBackgroundColor(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded p-1 text-slate-200 text-[11px]"
                    >
                      <option value="default">Mặc định mô phỏng</option>
                      <option value="dark">Nền tối sư phạm</option>
                      <option value="white">Nền trắng giấy in</option>
                      <option value="transparent">Nền trong suốt</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Simulation IFrame Container with Zoom support */}
            <div
              ref={iframeContainerRef}
              className="relative w-full aspect-[16/10] sm:aspect-[16/9] min-h-[440px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center"
            >
              <div
                style={{
                  width: `${zoomLevel}%`,
                  height: `${zoomLevel}%`,
                  transition: 'width 0.15s ease-out, height 0.15s ease-out',
                  transformOrigin: 'center center'
                }}
                className="w-full h-full flex items-center justify-center"
              >
                <iframe
                  key={selectedSim.id + (selectedSim.updatedAt || '') + pointColor + lineColor + segmentColor + backgroundColor + pointSize + lineWidth}
                  srcDoc={computedHtmlCode}
                  title={selectedSim.title}
                  sandbox="allow-scripts allow-same-origin allow-modals"
                  className="w-full h-full border-0 rounded-lg"
                />
              </div>
            </div>

            {/* Description & Pedagogical Guide */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span className="font-bold text-cyan-300 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> Hướng dẫn sư phạm & Ý nghĩa hiện tượng:
                </span>
                <span>Tác giả: <strong className="text-white">{selectedSim.authorName || 'Admin Thầy Cấn Văn Trường'}</strong></span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {selectedSim.description}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Simulation Library & Search (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Kho Mô Phỏng ({filteredSimulations.length})</span>
              </h4>
              <span className="text-[10px] text-slate-400">Firebase Realtime</span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm môn học, chủ đề, định luật..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="all">Tất cả môn</option>
                <option value="Toán học">Toán học</option>
                <option value="Vật lí">Vật lí</option>
                <option value="Hóa học">Hóa học</option>
                <option value="Sinh học">Sinh học</option>
                <option value="KHTN">KHTN</option>
                <option value="Tin học">Tin học</option>
                <option value="Công nghệ">Công nghệ</option>
              </select>

              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="all">Tất cả khối lớp</option>
                <option value="Lớp 6">Lớp 6</option>
                <option value="Lớp 7">Lớp 7</option>
                <option value="Lớp 8">Lớp 8</option>
                <option value="Lớp 9">Lớp 9</option>
                <option value="Lớp 10">Lớp 10</option>
                <option value="Lớp 11">Lớp 11</option>
                <option value="Lớp 12">Lớp 12</option>
              </select>
            </div>

            {/* List of Simulation Cards */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredSimulations.map((sim) => {
                const isSelected = selectedSim.id === sim.id;
                return (
                  <div
                    key={sim.id}
                    onClick={() => setSelectedSim(sim)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-950/50 border-cyan-500 shadow-md shadow-cyan-900/20'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                          {sim.subject} • {sim.grade}
                        </span>
                        <h5 className="font-bold text-xs text-white mt-1 line-clamp-1">{sim.title}</h5>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{sim.topic}</p>
                      </div>
                      {sim.isFeatured && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-semibold shrink-0">
                          ⭐ Nổi bật
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* 3. AI Generator Modal */}
      {isGeneratorOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Trợ Lý AI Sáng Tạo Mô Phỏng Tương Tác</h3>
                  <p className="text-xs text-slate-400">Tự động sinh mã HTML5/Canvas/JavaScript theo yêu cầu bài học</p>
                </div>
              </div>
              <button
                onClick={() => setIsGeneratorOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Môn học:</label>
                  <select
                    value={aiSubject}
                    onChange={(e) => setAiSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Toán học">Toán học (Hình học, Hàm số, Véc tơ...)</option>
                    <option value="Vật lí">Vật lí (Cơ, Nhiệt, Điện, Quang, Hạt nhân)</option>
                    <option value="Hóa học">Hóa học (Phản ứng, Cấu tạo nguyên tử, Dung dịch)</option>
                    <option value="Sinh học">Sinh học (Tế bào, Di truyền, Sinh thái)</option>
                    <option value="KHTN">KHTN (Khoa học tự nhiên THCS)</option>
                    <option value="Tin học">Tin học & Thuật toán</option>
                    <option value="Công nghệ">Công nghệ & Kỹ thuật</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Khối lớp:</label>
                  <select
                    value={aiGrade}
                    onChange={(e) => setAiGrade(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Lớp 6">Lớp 6</option>
                    <option value="Lớp 7">Lớp 7</option>
                    <option value="Lớp 8">Lớp 8</option>
                    <option value="Lớp 9">Lớp 9</option>
                    <option value="Lớp 10">Lớp 10</option>
                    <option value="Lớp 11">Lớp 11</option>
                    <option value="Lớp 12">Lớp 12</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">
                    Mô tả hiện tượng / bài học / hình học cần mô phỏng:
                  </label>
                  <VoiceMicButton
                    onTranscript={(t) => setAiPrompt((prev) => (prev ? `${prev} ${t}` : t))}
                    buttonTitle="Nói yêu cầu mô phỏng"
                    size="sm"
                  />
                </div>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={4}
                  placeholder="Ví dụ: Tạo mô phỏng hình học về Định lí Thalès trong tam giác với thanh trượt thay đổi tỉ lệ đoạn thẳng, hiển thị rõ độ dài các cạnh và màu sắc điểm/đường phân biệt..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-cyan-400 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGeneratorOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleGenerateSimulation}
                  disabled={isGeneratingAI}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isGeneratingAI ? 'animate-spin' : 'text-amber-300'}`} />
                  <span>{isGeneratingAI ? 'AI Đang Lập Trình Mô Phỏng...' : 'Tạo Mô Phỏng Ngay'}</span>
                </button>
              </div>

              {/* Generated Draft Preview */}
              {generatedDraft && (
                <div className="mt-4 p-4 bg-slate-950 border border-cyan-800/60 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-cyan-300 text-sm">
                      ✨ Đã Sinh Thành Công: {generatedDraft.title}
                    </span>
                    <button
                      onClick={handleSaveDraftToLibrary}
                      disabled={isSaving}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Đang lưu...' : 'Lưu Vào Kho'}</span>
                    </button>
                  </div>

                  <p className="text-slate-300 text-xs">{generatedDraft.description}</p>

                  <div className="h-64 border border-slate-800 rounded-lg overflow-hidden bg-black">
                    <iframe
                      srcDoc={generatedDraft.htmlCode}
                      title="AI Preview"
                      sandbox="allow-scripts allow-same-origin allow-modals"
                      className="w-full h-full border-0"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Edit / Manual Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingSim ? 'Chỉnh Sửa Mã Mô Phỏng' : 'Thêm Mô Phỏng Thủ Công Mới'}
                  </h3>
                  <p className="text-xs text-slate-400">Chỉnh sửa tiêu đề, mô tả và mã nguồn HTML5/Canvas/JS</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Tiêu đề mô phỏng:</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-medium focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Môn học:</label>
                  <select
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Toán học">Toán học</option>
                    <option value="Vật lí">Vật lí</option>
                    <option value="Hóa học">Hóa học</option>
                    <option value="Sinh học">Sinh học</option>
                    <option value="KHTN">KHTN</option>
                    <option value="Tin học">Tin học</option>
                    <option value="Công nghệ">Công nghệ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Khối lớp:</label>
                  <select
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Lớp 6">Lớp 6</option>
                    <option value="Lớp 7">Lớp 7</option>
                    <option value="Lớp 8">Lớp 8</option>
                    <option value="Lớp 9">Lớp 9</option>
                    <option value="Lớp 10">Lớp 10</option>
                    <option value="Lớp 11">Lớp 11</option>
                    <option value="Lớp 12">Lớp 12</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Chủ đề bài học:</label>
                  <input
                    type="text"
                    value={editTopic}
                    onChange={(e) => setEditTopic(e.target.value)}
                    placeholder="Ví dụ: Định luật bảo toàn cơ năng..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mô tả sư phạm:</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mã nguồn HTML5 + CSS + JavaScript (Tự do tùy biến Canvas/SVG):
                </label>
                <textarea
                  value={editHtml}
                  onChange={(e) => setEditHtml(e.target.value)}
                  rows={10}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-mono text-[11px] focus:outline-none focus:border-cyan-400 leading-normal"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Simulation Image Extractor & Transparent Background Remover Modal */}
      <SimulationImageExtractorModal
        isOpen={isExtractorOpen}
        onClose={() => setIsExtractorOpen(false)}
        initialImageDataUrl={extractorInitialImage}
        onSendToLessonPlan={onSendImageToLessonPlan}
      />
    </div>
  );
};
