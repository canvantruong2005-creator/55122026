import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  FileText,
  Upload,
  Play,
  Pause,
  Square,
  Download,
  RotateCcw,
  Sparkles,
  RefreshCw,
  FastForward,
  Rewind,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileCode,
  Edit3,
  Save,
  Wand2,
  Trash2,
  BookOpen,
  Headphones,
  Check
} from 'lucide-react';
import {
  EXPRESSIVE_VIETNAMESE_VOICES,
  TTS_SPEED_PRESETS,
  playVietnameseSpeech,
  stopSpeech,
  pauseSpeech,
  resumeSpeech,
  seekSpeech,
  skipSpeech,
  downloadVietnameseAudio,
  cleanTextForTTS,
  splitIntoSentences
} from '../../lib/ttsAudio';
import { readFileAsText } from '../../lib/fileUtils';
import { exportMarkdownToWord } from '../../lib/wordExport';
import { generateGeminiText } from '../../lib/geminiApi';
import { sanitizeMathForVietnamese, repairVietnameseText } from '../../lib/mathSanitizer';
import { normalizeVietnameseTerminology, ungluePedagogicalHeadings } from '../../lib/terminologyUtils';

interface Tab5DocumentToSpeechProps {
  apiKeysInput: string;
  tab3Content?: string;
  referenceCacheText?: string;
  monHoc?: string;
  lop?: string;
}

export const Tab5DocumentToSpeech: React.FC<Tab5DocumentToSpeechProps> = ({
  apiKeysInput,
  tab3Content = '',
  referenceCacheText = '',
  monHoc = 'Toán',
  lop = '6'
}) => {
  // Main Text Document
  const [docText, setDocText] = useState<string>('');
  const [docTitle, setDocTitle] = useState<string>('Van_Ban_Audio');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Audio Voice & Speed Configuration
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(EXPRESSIVE_VIETNAMESE_VOICES[0].id);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeChunkIndex, setActiveChunkIndex] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [currentChunkText, setCurrentChunkText] = useState('');

  // AI Script Refinement & Direct Editing
  const [isDirectEditing, setIsDirectEditing] = useState(false);
  const [directEditText, setDirectEditText] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // Notification Banner
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop speech when component unmounts
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  // Compute text statistics
  const cleanSpoken = cleanTextForTTS(docText);
  const charCount = docText.length;
  const wordCount = docText.trim() ? docText.trim().split(/\s+/).length : 0;
  // Avg speaking rate is ~140-160 words per minute at 1.0x
  const estimatedMinutes = wordCount > 0 ? Math.ceil(wordCount / (150 * playbackSpeed)) : 0;
  const sentencesList = splitIntoSentences(docText);

  // File Upload Handler (Word, PDF, PPTX, XLSX, TXT, Images)
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsProcessingFile(true);
    stopSpeech();
    setNotification({
      message: `Đang trích xuất nội dung từ tệp "${file.name}"...`,
      type: 'info'
    });

    try {
      const extracted = await readFileAsText(file, { apiKeys: apiKeysInput });
      if (!extracted || extracted.trim().length === 0) {
        throw new Error('Tệp không chứa văn bản hoặc không thể trích xuất.');
      }

      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9à-ỹÀ-Ỹ_ -]/g, '_');
      setDocTitle(cleanTitle);
      setDocText(extracted);
      setDirectEditText(extracted);
      setNotification({
        message: `Đã đọc thành công tệp "${file.name}" (${extracted.length.toLocaleString('vi-VN')} ký tự, ~${wordCount} từ). Thầy/Cô có thể chọn giọng đọc và bấm "Phát Giọng Đọc" ngay!`,
        type: 'success'
      });
    } catch (err: any) {
      console.error('File extraction error:', err);
      setNotification({
        message: `Lỗi đọc tệp: ${err.message || 'Không thể mở tệp này.'}`,
        type: 'error'
      });
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Play Audio
  const handlePlayAudio = async () => {
    if (!docText.trim()) {
      setNotification({
        message: 'Vui lòng nhập văn bản hoặc tải lên tệp Word/PDF để chuyển thành giọng đọc.',
        type: 'error'
      });
      return;
    }

    if (isPaused) {
      resumeSpeech();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    stopSpeech();
    setIsLoadingAudio(true);
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentTime(0);

    const voiceObj = EXPRESSIVE_VIETNAMESE_VOICES.find(v => v.id === selectedVoiceId);
    const effectiveRate = playbackSpeed * (voiceObj?.rateMultiplier || 1.0);

    try {
      await playVietnameseSpeech(docText, {
        voiceName: selectedVoiceId,
        rate: effectiveRate,
        pitch: pitch * (voiceObj?.pitch || 1.0),
        onPlayStateChange: (playing) => {
          setIsPlaying(playing);
          setIsLoadingAudio(false);
        },
        onTimeUpdate: (cur, dur) => {
          setCurrentTime(cur);
          if (dur > 0 && isFinite(dur)) {
            setDuration(dur);
          }
        },
        onProgress: (cur, total, chunk) => {
          setActiveChunkIndex(cur);
          setTotalChunks(total);
          setCurrentChunkText(chunk);
        },
        onEnd: () => {
          setIsPlaying(false);
          setIsPaused(false);
          setCurrentTime(0);
          setNotification({
            message: 'Đã hoàn tất phát âm thanh toàn bộ văn bản!',
            type: 'success'
          });
        },
        onError: (err) => {
          console.error('TTS playback error:', err);
          setIsPlaying(false);
          setIsLoadingAudio(false);
          setNotification({
            message: 'Có lỗi xảy ra khi phát âm thanh. Vui lòng thử lại hoặc tải tệp MP3 về máy.',
            type: 'error'
          });
        }
      });
    } catch (err: any) {
      console.error('Play error:', err);
      setIsLoadingAudio(false);
      setIsPlaying(false);
    }
  };

  const handlePauseAudio = () => {
    pauseSpeech();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const handleStopAudio = () => {
    stopSpeech();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentTime(0);
    setCurrentChunkText('');
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    seekSpeech(val);
  };

  // Download Full MP3
  const handleDownloadMp3 = async () => {
    if (!docText.trim()) {
      setNotification({
        message: 'Chưa có nội dung văn bản để tạo tệp âm thanh.',
        type: 'error'
      });
      return;
    }

    setIsDownloading(true);
    setNotification({
      message: 'Đang kết xuất tệp âm thanh MP3 chất lượng cao (không giới hạn độ dài)...',
      type: 'info'
    });

    try {
      const voiceObj = EXPRESSIVE_VIETNAMESE_VOICES.find(v => v.id === selectedVoiceId);
      const effectiveRate = playbackSpeed * (voiceObj?.rateMultiplier || 1.0);
      const safeFileName = `${docTitle || 'Van_Ban_Audio'}_GiongDoc_TiengViet.mp3`;

      await downloadVietnameseAudio(docText, safeFileName, {
        voiceId: selectedVoiceId,
        speed: effectiveRate
      });

      setNotification({
        message: `Đã tạo và tải xuống tệp âm thanh MP3 "${safeFileName}" thành công!`,
        type: 'success'
      });
    } catch (err: any) {
      console.error('Download MP3 error:', err);
      setNotification({
        message: 'Lỗi khi tải tệp MP3: ' + (err.message || 'Vui lòng thử lại.'),
        type: 'error'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // AI Refine Document Text
  const handleAiRefine = async (customPromptOverride?: string) => {
    const p = (customPromptOverride || aiPrompt).trim();
    if (!p) {
      setNotification({
        message: 'Vui lòng nhập yêu cầu chỉnh sửa văn bản cho AI.',
        type: 'error'
      });
      return;
    }
    if (!docText.trim()) {
      setNotification({
        message: 'Vui lòng nhập hoặc tải tệp văn bản trước khi yêu cầu AI chỉnh sửa.',
        type: 'error'
      });
      return;
    }

    handleStopAudio();
    setIsAiProcessing(true);
    setNotification({
      message: 'AI đang tiến hành biên tập và xử lý văn bản theo yêu cầu...',
      type: 'info'
    });

    try {
      const prompt = `Bạn là Chuyên gia Biên tập Ngôn ngữ Sư phạm và Chuyển Đổi Văn Bản Sang Giọng Đọc (Text-to-Speech).
Dưới đây là văn bản gốc:
---
${docText}
---

YÊU CẦU BIÊN TẬP CỦA GIÁO VIÊN:
"${p}"

HƯỚNG DẪN BIÊN TẬP:
1. Xử lý chuẩn xác đoạn văn và nội dung được yêu cầu (loại bỏ chú thích, footnote, số trang thừa, viết lại câu từ cho trôi chảy, đọc chuẩn ký hiệu toán học $...$ như $N^*$, phân số...).
2. Giữ nguyên toàn bộ cấu trúc và nội dung quan trọng của tài liệu.
3. Xuất ra 100% văn bản hoàn thiện sau khi biên tập (KHÔNG kèm lời dẫn mở đầu hay kết thúc).`;

      const res = await generateGeminiText({
        prompt,
        apiKeys: apiKeysInput
      });

      const sanitized = sanitizeMathForVietnamese(res || '');
      const normalized = ungluePedagogicalHeadings(normalizeVietnameseTerminology(repairVietnameseText(sanitized)));
      setDocText(normalized);
      setDirectEditText(normalized);
      setAiPrompt('');
      setNotification({
        message: 'Đã hoàn tất chỉnh sửa văn bản bằng AI! Thầy/Cô có thể bấm "Phát Giọng Đọc" để nghe ngay.',
        type: 'success'
      });
    } catch (err: any) {
      console.error('AI Refine error:', err);
      setNotification({
        message: 'Lỗi AI biên tập: ' + (err.message || 'Kiểm tra API Key.'),
        type: 'error'
      });
    } finally {
      setIsAiProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Export to Word
  const handleExportWord = async () => {
    if (!docText.trim()) return;
    try {
      await exportMarkdownToWord(docText, {
        headerText: `TÀI LIỆU VĂN BẢN & GIỌNG ĐỌC - MÔN ${monHoc.toUpperCase()}`,
        footerText: `Trường THCS Phùng Khắc Khoan - Xã Tây Phương, TP. Hà Nội`,
        monHoc,
        lop,
        fileName: `${docTitle || 'Tai_Lieu_Van_Ban'}.docx`
      });
      setNotification({
        message: 'Đã xuất file Word (.docx) thành công!',
        type: 'success'
      });
    } catch (e: any) {
      setNotification({
        message: 'Lỗi xuất file Word: ' + (e.message || String(e)),
        type: 'error'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all shadow-md ${
            notification.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-600/70 text-emerald-100'
              : notification.type === 'error'
              ? 'bg-rose-950/70 border-rose-600/70 text-rose-100'
              : 'bg-cyan-950/70 border-cyan-600/70 text-cyan-100'
          }`}
        >
          <span className="font-bold text-sm mt-0.5">
            {notification.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : notification.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <Sparkles className="w-4 h-4 text-cyan-400" />}
          </span>
          <div className="flex-1 font-medium">{notification.message}</div>
        </div>
      )}

      {/* Top Banner Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Chuyển Đổi Text, Văn Bản Word, PDF Ra Giọng Đọc</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                  Không Giới Hạn Dung Lượng
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Tải tệp Word (.docx, .doc), PDF, PPTX, TXT hoặc dán văn bản bất kỳ để chuyển thành giọng đọc tiếng Việt truyền cảm, hỗ trợ đa giọng điệu và đa tốc độ.
              </p>
            </div>
          </div>

          {/* Quick Import from Other Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {tab3Content && tab3Content.trim().length > 20 && (
              <button
                type="button"
                onClick={() => {
                  stopSpeech();
                  setDocText(tab3Content);
                  setDirectEditText(tab3Content);
                  setDocTitle(`Giao_An_${monHoc}_Lop_${lop}`);
                  setNotification({
                    message: 'Đã nạp toàn bộ nội dung Giáo án từ Tab 3 sang văn bản giọng đọc!',
                    type: 'success'
                  });
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition-all flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Nạp Từ Giáo Án (Tab 3)</span>
              </button>
            )}

            {referenceCacheText && referenceCacheText.trim().length > 20 && (
              <button
                type="button"
                onClick={() => {
                  stopSpeech();
                  setDocText(referenceCacheText);
                  setDirectEditText(referenceCacheText);
                  setDocTitle(`SGK_${monHoc}_Lop_${lop}`);
                  setNotification({
                    message: 'Đã nạp nội dung Sách Giáo Khoa (Tab 1) sang văn bản giọng đọc!',
                    type: 'success'
                  });
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-all flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Nạp Từ SGK (Tab 1)</span>
              </button>
            )}
          </div>
        </div>

        {/* Drag & Drop File Upload Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${
            dragActive
              ? 'border-indigo-500 bg-indigo-950/40 shadow-lg shadow-indigo-500/20'
              : 'border-slate-700/80 hover:border-indigo-500/60 bg-slate-950/60 hover:bg-slate-900/60'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.doc,.pdf,.pptx,.ppt,.xlsx,.xls,.csv,.txt,.md,.png,.jpg,.jpeg"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="p-3 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              {isProcessingFile ? (
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">
                {isProcessingFile ? 'Đang đọc và phân tích tệp tài liệu...' : 'Kéo thả tệp Word (.docx, .doc), PDF, PPTX, TXT hoặc Bấm để tải lên'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Hỗ trợ mọi định dạng tài liệu giáo dục, sách giáo khoa, bài viết dài hàng trăm trang không giới hạn dung lượng
              </p>
            </div>
          </div>
        </div>

        {/* Voice, Speed and Pitch Control Center */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
          {/* Voice Selector */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Lựa chọn Giọng đọc Tiếng Việt ({EXPRESSIVE_VIETNAMESE_VOICES.length} giọng):</span>
            </label>
            <select
              value={selectedVoiceId}
              onChange={(e) => {
                setSelectedVoiceId(e.target.value);
                if (isPlaying) {
                  stopSpeech();
                  setIsPlaying(false);
                }
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 shadow-inner"
            >
              {EXPRESSIVE_VIETNAMESE_VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.region})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 italic truncate">
              {EXPRESSIVE_VIETNAMESE_VOICES.find(v => v.id === selectedVoiceId)?.description}
            </p>
          </div>

          {/* Speed Preset Selector */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FastForward className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tốc độ đọc:</span>
              </span>
              <span className="text-indigo-400 font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-800">
                {playbackSpeed}x
              </span>
            </label>
            <select
              value={playbackSpeed}
              onChange={(e) => {
                setPlaybackSpeed(parseFloat(e.target.value));
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 shadow-inner"
            >
              {TTS_SPEED_PRESETS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 italic truncate">
              {TTS_SPEED_PRESETS.find(s => s.value === playbackSpeed)?.description}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="md:col-span-2 flex flex-col justify-center bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Thời Lượng Ước Tính</span>
            <span className="text-sm font-extrabold text-indigo-300 font-mono mt-0.5">
              ~{estimatedMinutes} phút
            </span>
            <span className="text-[10px] text-slate-400">
              ({wordCount.toLocaleString('vi-VN')} từ)
            </span>
          </div>
        </div>

        {/* Audio Player Toolbar */}
        <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30 space-y-3 shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Playback Control Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={isPlaying ? handlePauseAudio : handlePlayAudio}
                disabled={isLoadingAudio || !docText.trim()}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-40"
              >
                {isLoadingAudio ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang nạp âm thanh...</span>
                  </>
                ) : isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Tạm Dừng</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>{isPaused ? 'Tiếp Tục Đọc' : 'Phát Giọng Đọc'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleStopAudio}
                disabled={!isPlaying && !isPaused}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all disabled:opacity-30"
                title="Dừng hẳn và về đầu"
              >
                <Square className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => skipSpeech(-10)}
                disabled={!isPlaying && !isPaused}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all disabled:opacity-30"
                title="Lùi 10 giây"
              >
                <Rewind className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => skipSpeech(10)}
                disabled={!isPlaying && !isPaused}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all disabled:opacity-30"
                title="Tua tới 10 giây"
              >
                <FastForward className="w-4 h-4" />
              </button>
            </div>

            {/* Download & Export Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadMp3}
                disabled={isDownloading || !docText.trim()}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-2 transition-all disabled:opacity-40"
                title="Tải toàn bộ file âm thanh MP3 hoàn chỉnh về máy"
              >
                {isDownloading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang kết xuất MP3...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Tải File Âm Thanh MP3 (Không giới hạn)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleExportWord}
                disabled={!docText.trim()}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/30 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-40"
                title="Xuất nội dung văn bản ra file Word"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Xuất Word (.docx)</span>
              </button>
            </div>
          </div>

          {/* Audio Progress Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="text-indigo-400 font-bold">{formatTime(currentTime)}</span>
              {currentChunkText && (
                <span className="text-slate-300 font-sans italic truncate max-w-md text-center">
                  "{currentChunkText.slice(0, 70)}..."
                </span>
              )}
              <span>{formatTime(duration || estimatedMinutes * 60)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={duration > 0 ? duration : (estimatedMinutes * 60 || 100)}
              step="0.5"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* AI Refinement & Direct Document Editor Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Biên Tập & Trau Chuốt Văn Bản / Kịch Bản Giọng Đọc</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                  AI Trợ lý Ngôn ngữ
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Nhập yêu cầu để AI sửa đoạn nào, tối ưu công thức toán $N^*$, loại bỏ ký hiệu thừa, hoặc sửa trực tiếp văn bản bên dưới.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!isDirectEditing) {
                  setDirectEditText(docText);
                  setIsDirectEditing(true);
                } else {
                  setIsDirectEditing(false);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                isDirectEditing
                  ? 'bg-amber-600/30 text-amber-200 border-amber-500/50 shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isDirectEditing ? 'Đóng Soạn Thảo' : 'Sửa Trực Tiếp (Text)'}</span>
            </button>

            {docText.trim() && (
              <button
                type="button"
                onClick={() => {
                  stopSpeech();
                  setDocText('');
                  setDirectEditText('');
                  setDocTitle('Van_Ban_Audio');
                  setNotification({
                    message: 'Đã xóa trắng văn bản để nhập mới.',
                    type: 'info'
                  });
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-800/40 transition-all flex items-center gap-1"
                title="Xóa nội dung hiện tại"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa</span>
              </button>
            )}
          </div>
        </div>

        {/* AI Prompt Input & Quick Preset Buttons */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAiRefine();
                }
              }}
              placeholder="Nhập yêu cầu AI sửa đoạn nào, nội dung gì trong tài liệu / kịch bản..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 shadow-inner"
            />

            <button
              type="button"
              onClick={() => handleAiRefine()}
              disabled={isAiProcessing || !aiPrompt.trim() || !docText.trim()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-40 shrink-0"
            >
              {isAiProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang Xử Lý...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Sửa Văn Bản</span>
                </>
              )}
            </button>
          </div>

          {/* Preset AI Action Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-400 mr-1">Tác vụ nhanh:</span>
            {[
              { label: '🎯 Chuẩn hóa ký hiệu Toán ($N^*$, phân số, tỉ số)', prompt: 'Chuẩn hóa toàn bộ các ký hiệu toán học $N^*$, $x \\in \\mathbb{N}^*$, phân số, lũy thừa để đọc chuẩn xác không bị vấp.' },
              { label: '🧹 Loại bỏ số trang, chú thích, header/footer thừa', prompt: 'Hãy lọc bỏ các số trang, dòng chú thích (footnote), tiêu đề trang thừa và giữ lại toàn văn sạch đẹp.' },
              { label: '🎙️ Viết lại câu từ trôi chảy, giàu cảm xúc', prompt: 'Hãy trau chuốt lại câu văn cho mạch lạc, tự nhiên, dễ nghe và giàu cảm xúc hơn khi đọc thành tiếng.' },
              { label: '✂️ Tóm tắt & cô đọng các ý chính', prompt: 'Hãy tóm tắt ngắn gọn các ý chính của tài liệu thành bản tóm tắt súc tích, dễ nhớ để nghe nhanh.' }
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setAiPrompt(chip.prompt);
                  handleAiRefine(chip.prompt);
                }}
                disabled={isAiProcessing || !docText.trim()}
                className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-950 hover:bg-purple-950/50 hover:border-purple-500/50 text-slate-300 hover:text-purple-200 border border-slate-800 transition-all text-left disabled:opacity-40"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Text Input / Document View Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              Nội dung văn bản ({charCount.toLocaleString('vi-VN')} ký tự, {wordCount.toLocaleString('vi-VN')} từ):
            </span>
            <span>
              {isDirectEditing ? 'Đang ở chế độ chỉnh sửa trực tiếp' : 'Dán văn bản hoặc tải file để cập nhật'}
            </span>
          </div>

          <textarea
            value={isDirectEditing ? directEditText : docText}
            onChange={(e) => {
              if (isDirectEditing) {
                setDirectEditText(e.target.value);
              } else {
                setDocText(e.target.value);
                setDirectEditText(e.target.value);
              }
            }}
            placeholder="Dán nội dung văn bản, bài giảng, đề thi, truyện đọc, sách giáo khoa hoặc tài liệu bất kỳ tại đây..."
            rows={14}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 shadow-inner"
          />

          {isDirectEditing && (
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsDirectEditing(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  stopSpeech();
                  setDocText(directEditText);
                  setIsDirectEditing(false);
                  setNotification({
                    message: 'Đã lưu thay đổi văn bản thành công! Bạn có thể phát âm thanh ngay.',
                    type: 'success'
                  });
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Thay Đổi Văn Bản</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
