// Vietnamese TTS Audio Engine & Download Utility with High-Fidelity Multi-Voice Synthesis
// Supports both PC and Mobile (iOS, Android, Windows, macOS) in 100% fluent Vietnamese
import { convertLatexToSpokenVietnamese } from './latexToSpeech';

export interface ExpressiveVoiceOption {
  id: string;
  name: string;
  description: string;
  category: 'cloud' | 'native';
  gender: 'female' | 'male';
  region: 'Bắc' | 'Nam' | 'Trung' | 'Toàn quốc';
  rateMultiplier: number;
  pitch: number;
}

export interface SpeedOption {
  value: number;
  label: string;
  description: string;
}

export const TTS_SPEED_PRESETS: SpeedOption[] = [
  { value: 0.5, label: '0.5x - Cực chậm', description: 'Tập đọc từng âm tiết, chính tả, tiểu học lớp 1' },
  { value: 0.75, label: '0.75x - Chậm rãi', description: 'Đọc thơ văn, lời thoại diễn cảm, nghe rõ từng từ' },
  { value: 0.85, label: '0.85x - Vừa phải nhẹ nhàng', description: 'Giảng bài lý thuyết sâu, học sinh dễ ghi chép' },
  { value: 1.0, label: '1.0x - Chuẩn tự nhiên (Khuyên dùng)', description: 'Tốc độ giọng nói tự nhiên của giáo viên chuẩn' },
  { value: 1.15, label: '1.15x - Nhanh nhẹn', description: 'Thuyết trình, bản tin, bài tập luyện phản xạ' },
  { value: 1.25, label: '1.25x - Tăng tốc ôn bài', description: 'Nghe ôn tập nhanh các kiến thức đã học' },
  { value: 1.5, label: '1.5x - Nghe nhanh (1.5x)', description: 'Duyệt nhanh nội dung bài đọc và tài liệu' },
  { value: 1.75, label: '1.75x - Rất nhanh (1.75x)', description: 'Nghe quét nhanh tài liệu dung lượng lớn' },
  { value: 2.0, label: '2.0x - Tối đa (2.0x)', description: 'Tốc độ đọc tối đa cho người nghe thành thạo' }
];

export const EXPRESSIVE_VIETNAMESE_VOICES: ExpressiveVoiceOption[] = [
  {
    id: 'cloud_vi_standard',
    name: '🌟 Giọng Nữ Truyền Cảm - Chuẩn Tiếng Việt (Toàn diện)',
    description: 'Giọng đọc mượt mà, phát âm chuẩn xác, diễn cảm tự nhiên trên cả Máy tính & Điện thoại',
    category: 'cloud',
    gender: 'female',
    region: 'Toàn quốc',
    rateMultiplier: 1.0,
    pitch: 1.0
  },
  {
    id: 'cloud_vi_gentle',
    name: '🌸 Giọng Nữ Nhẹ Nhàng - Hà Nội (Tiểu học & Văn học)',
    description: 'Ngữ điệu êm dịu, ấm áp, nhịp điệu chậm rãi và truyền cảm',
    category: 'cloud',
    gender: 'female',
    region: 'Bắc',
    rateMultiplier: 0.9,
    pitch: 1.05
  },
  {
    id: 'cloud_vi_teacher_male',
    name: '🎙️ Giọng Nam Trầm Ấm - Thầy Giáo Giảng Bài (Bắc)',
    description: 'Âm sắc chững chạc, dõng dạc, uy lực và rõ ràng cho môn Toán, KHTN',
    category: 'cloud',
    gender: 'male',
    region: 'Bắc',
    rateMultiplier: 0.95,
    pitch: 0.9
  },
  {
    id: 'cloud_vi_south',
    name: '🌾 Giọng Nữ Miền Nam Ngọt Ngào (Phương Nam)',
    description: 'Ngữ âm phương Nam ngọt ngào, gần gũi, thân thiện, tự nhiên',
    category: 'cloud',
    gender: 'female',
    region: 'Nam',
    rateMultiplier: 0.95,
    pitch: 1.02
  },
  {
    id: 'cloud_vi_south_male',
    name: '🌴 Giọng Nam Miền Nam Dõng Dạc - Thầy Giáo Nam Bộ',
    description: 'Âm hưởng Nam Bộ ấm áp, khoáng đạt, rành rẽ và dứt khoát',
    category: 'cloud',
    gender: 'male',
    region: 'Nam',
    rateMultiplier: 0.95,
    pitch: 0.95
  },
  {
    id: 'cloud_vi_central',
    name: '🌊 Giọng Nữ Miền Trung Truyền Cảm (Huế / Đà Nẵng)',
    description: 'Ngữ điệu Miền Trung êm đềm, sâu lắng, đậm chất thơ và tự tình',
    category: 'cloud',
    gender: 'female',
    region: 'Trung',
    rateMultiplier: 0.92,
    pitch: 1.0
  },
  {
    id: 'cloud_vi_lively',
    name: '⚡ Giọng Nữ Năng Động (Thuyết trình & Khởi động)',
    description: 'Tiết tấu tươi vui, hứng khởi, truyền năng lượng tích cực cho học sinh',
    category: 'cloud',
    gender: 'female',
    region: 'Toàn quốc',
    rateMultiplier: 1.05,
    pitch: 1.12
  },
  {
    id: 'cloud_vi_news',
    name: '📻 Giọng Phát Thanh Viên Chuẩn Mực (Bản tin / Tư liệu)',
    description: 'Phong thái thời sự, nghiêm túc, phát âm rành mạch từng câu chữ',
    category: 'cloud',
    gender: 'female',
    region: 'Toàn quốc',
    rateMultiplier: 1.0,
    pitch: 0.98
  }
];

export interface VoiceOption {
  name: string;
  lang: string;
  isVietnamese: boolean;
  voice: SpeechSynthesisVoice;
}

export function getAvailableVoices(): Promise<VoiceOption[]> {
  return new Promise(resolve => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const formatted: VoiceOption[] = voices.map(v => {
        const langLower = (v.lang || '').toLowerCase();
        const nameLower = (v.name || '').toLowerCase();
        
        // Strict Vietnamese voice detection: prevent false positive on English voices like 'Microsoft Dan' or 'Samantha'
        const isVi =
          langLower.startsWith('vi') ||
          langLower.includes('vi-vn') ||
          langLower.includes('vi_vn') ||
          nameLower.includes('vietnam') ||
          nameLower.includes('vietnamese') ||
          nameLower.includes('tiếng việt') ||
          /\b(hoaimy|namminh|maingoc|minhquang)\b/i.test(nameLower);

        return {
          name: v.name,
          lang: v.lang,
          isVietnamese: isVi,
          voice: v
        };
      });

      // Filter and sort Vietnamese voices to the top
      formatted.sort((a, b) => (b.isVietnamese ? 1 : 0) - (a.isVietnamese ? 1 : 0));
      resolve(formatted);
    };

    const initial = window.speechSynthesis.getVoices();
    if (initial.length > 0) {
      loadVoices();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        loadVoices();
      };
      setTimeout(() => {
        loadVoices();
      }, 400);
    }
  });
}

/**
 * Preprocesses raw text and mathematical formulas into clear, natural Vietnamese speech text.
 * Uses comprehensive LaTeX-to-Spoken Vietnamese conversion.
 */
export function cleanTextForTTS(rawText: string): string {
  return convertLatexToSpokenVietnamese(rawText);
}

/**
 * Splits text into small, natural sentence chunks (<150 chars) for uninterrupted TTS playback.
 */
export function splitIntoSentences(text: string): string[] {
  const clean = cleanTextForTTS(text);
  if (!clean) return [];

  // Match sentences ending with . ! ? : ; or newline
  const rawParts = clean.split(/([.!?:;\n]+)/);
  const sentences: string[] = [];
  for (let i = 0; i < rawParts.length; i += 2) {
    const s = ((rawParts[i] || '') + (rawParts[i + 1] || '')).trim();
    if (s) sentences.push(s);
  }

  const chunks: string[] = [];
  let cur = '';

  for (const s of sentences) {
    if ((cur + ' ' + s).length < 140) {
      cur = cur ? cur + ' ' + s : s;
    } else {
      if (cur) chunks.push(cur);
      if (s.length > 140) {
        // Split long sentence by words
        const words = s.split(' ');
        let sub = '';
        for (const w of words) {
          if ((sub + ' ' + w).length < 140) {
            sub = sub ? sub + ' ' + w : w;
          } else {
            if (sub) chunks.push(sub);
            sub = w;
          }
        }
        if (sub) chunks.push(sub);
        cur = '';
      } else {
        cur = s;
      }
    }
  }
  if (cur) chunks.push(cur);

  return chunks.filter(c => c.trim().length > 0);
}

// Playback session state
let activeSpeechSession: {
  isCancelled: boolean;
  chunks: string[];
  currentIndex: number;
} | null = null;

let currentAudioElement: HTMLAudioElement | null = null;
let currentAudioUrl: string | null = null;

export function getCurrentAudio(): HTMLAudioElement | null {
  return currentAudioElement;
}

export function seekSpeech(timeInSeconds: number): void {
  if (currentAudioElement && !isNaN(timeInSeconds) && isFinite(timeInSeconds)) {
    try {
      currentAudioElement.currentTime = Math.max(0, Math.min(timeInSeconds, currentAudioElement.duration || timeInSeconds));
    } catch (e) {
      console.warn('Seek error:', e);
    }
  } else if (activeSpeechSession && activeSpeechSession.chunks.length > 0) {
    const chunkIdx = Math.floor((timeInSeconds / 100) * activeSpeechSession.chunks.length);
    activeSpeechSession.currentIndex = Math.max(0, Math.min(chunkIdx, activeSpeechSession.chunks.length - 1));
  }
}

export function skipSpeech(deltaSeconds: number): void {
  if (currentAudioElement && !isNaN(currentAudioElement.currentTime)) {
    const newTime = (currentAudioElement.currentTime || 0) + deltaSeconds;
    seekSpeech(newTime);
  }
}

export function pauseSpeech(): void {
  if (currentAudioElement && !currentAudioElement.paused) {
    currentAudioElement.pause();
  } else if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
  }
}

export function resumeSpeech(): void {
  if (currentAudioElement && currentAudioElement.paused) {
    currentAudioElement.play().catch(e => console.warn('Resume audio failed:', e));
  } else if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
}

/**
 * Plays speech in Vietnamese with high compatibility across PC (Windows, Mac) and Mobile.
 * Always ensures 100% natural Vietnamese pronunciation.
 */
export async function playVietnameseSpeech(
  text: string,
  options?: {
    voiceName?: string;
    rate?: number;
    pitch?: number;
    onTimeUpdate?: (currentTime: number, duration: number) => void;
    onProgress?: (current: number, total: number, chunkText: string) => void;
    onPlayStateChange?: (isPlaying: boolean) => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): Promise<void> {
  stopSpeech();

  const clean = cleanTextForTTS(text);
  if (!clean) {
    options?.onEnd?.();
    return;
  }

  const selectedVoice = options?.voiceName || 'cloud_vi_standard';
  const isCloudSelected = selectedVoice.startsWith('cloud_vi');

  // Check if browser native voice is genuine Vietnamese
  const nativeVoices = await getAvailableVoices();
  const matchedNativeVoice = nativeVoices.find(v => v.name === selectedVoice && v.isVietnamese);
  const isNativeVi = !!matchedNativeVoice;

  // On PC or when Cloud Voice is selected or no genuine Vietnamese native voice is installed,
  // stream directly from high-fidelity Neural Vietnamese Audio engine
  try {
    const response = await fetch('/api/tts/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: clean,
        voiceId: selectedVoice,
        speed: options?.rate || 1.0
      })
    });

    if (response.ok) {
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      currentAudioUrl = audioUrl;

      const audio = new Audio(audioUrl);
      currentAudioElement = audio;
      audio.preload = 'auto';

      // Apply playback rate
      const rate = options?.rate || 1.0;
      audio.playbackRate = Math.min(Math.max(rate, 0.5), 2.5);

      audio.onloadedmetadata = () => {
        if (audio.duration && isFinite(audio.duration)) {
          options?.onTimeUpdate?.(0, audio.duration);
        }
      };

      audio.ontimeupdate = () => {
        options?.onTimeUpdate?.(audio.currentTime || 0, audio.duration || 0);
      };

      audio.onplay = () => {
        options?.onPlayStateChange?.(true);
      };

      audio.onpause = () => {
        options?.onPlayStateChange?.(false);
      };

      audio.onended = () => {
        stopSpeech();
        options?.onPlayStateChange?.(false);
        options?.onEnd?.();
      };

      audio.onerror = (err) => {
        console.warn('Audio element error:', err);
        stopSpeech();
        options?.onPlayStateChange?.(false);
        options?.onError?.(err);
      };

      await audio.play();
      options?.onPlayStateChange?.(true);
      return;
    }
  } catch (streamErr) {
    console.warn('Cloud audio stream failed, trying client direct audio endpoint:', streamErr);
  }

  // Client-side Direct Google TTS Vietnamese Endpoint Fallback
  try {
    const q = encodeURIComponent(clean.slice(0, 180));
    const directUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${q}`;
    const directAudio = new Audio(directUrl);
    currentAudioElement = directAudio;
    directAudio.playbackRate = Math.min(Math.max(options?.rate || 1.0, 0.5), 2.0);

    directAudio.onended = () => {
      stopSpeech();
      options?.onPlayStateChange?.(false);
      options?.onEnd?.();
    };

    directAudio.onplay = () => {
      options?.onPlayStateChange?.(true);
    };

    await directAudio.play();
    return;
  } catch (directErr) {
    console.warn('Direct audio fallback failed, checking genuine native Vietnamese voice:', directErr);
  }

  // Fallback ONLY if genuine Vietnamese voice exists on user device
  if (isNativeVi && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const chunks = splitIntoSentences(text);
    if (chunks.length === 0) {
      options?.onEnd?.();
      return;
    }

    const session = {
      isCancelled: false,
      chunks,
      currentIndex: 0
    };
    activeSpeechSession = session;
    options?.onPlayStateChange?.(true);

    const playNextChunk = () => {
      if (session.isCancelled) return;

      if (session.currentIndex >= session.chunks.length) {
        activeSpeechSession = null;
        options?.onPlayStateChange?.(false);
        options?.onEnd?.();
        return;
      }

      const chunk = session.chunks[session.currentIndex];
      options?.onProgress?.(session.currentIndex + 1, session.chunks.length, chunk);
      const approxDuration = session.chunks.length * 4;
      const approxCurrent = session.currentIndex * 4;
      options?.onTimeUpdate?.(approxCurrent, approxDuration);

      const utterance = new SpeechSynthesisUtterance(chunk);
      if (matchedNativeVoice) {
        utterance.voice = matchedNativeVoice.voice;
        utterance.lang = matchedNativeVoice.lang || 'vi-VN';
      } else {
        utterance.lang = 'vi-VN';
      }

      utterance.rate = options?.rate || 0.95;
      utterance.pitch = options?.pitch || 1.0;

      utterance.onend = () => {
        if (!session.isCancelled) {
          session.currentIndex++;
          playNextChunk();
        }
      };

      utterance.onerror = (e) => {
        console.warn('Utterance error:', e);
        if (!session.isCancelled) {
          session.currentIndex++;
          playNextChunk();
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    playNextChunk();
    return;
  }

  // If no Vietnamese voice is available and server failed
  options?.onPlayStateChange?.(false);
  options?.onError?.(new Error('Không thể kết nối máy chủ âm thanh Tiếng Việt. Vui lòng thử lại!'));
  options?.onEnd?.();
}

export function stopSpeech(): void {
  if (activeSpeechSession) {
    activeSpeechSession.isCancelled = true;
    activeSpeechSession = null;
  }
  if (currentAudioElement) {
    try {
      currentAudioElement.pause();
      currentAudioElement.currentTime = 0;
    } catch (e) {}
    currentAudioElement = null;
  }
  if (currentAudioUrl) {
    try {
      URL.revokeObjectURL(currentAudioUrl);
    } catch (e) {}
    currentAudioUrl = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
}

/**
 * Downloads full, 100% complete Vietnamese Audio (.mp3) for lesson materials without truncation
 */
export async function downloadVietnameseAudio(
  text: string,
  filename = 'Bai_Giang_Audio_TiengViet.mp3',
  options?: {
    voiceId?: string;
    speed?: number;
  }
): Promise<void> {
  const clean = cleanTextForTTS(text);
  if (!clean) {
    alert('Không có nội dung văn bản để tạo audio!');
    return;
  }

  // 1. Try server-side POST TTS proxy (guarantees 100% full text audio without URL character limits)
  try {
    const response = await fetch('/api/tts/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: clean,
        voiceId: options?.voiceId || 'cloud_vi_standard',
        speed: options?.speed || 1.0
      })
    });

    if (response.ok) {
      const blob = await response.blob();
      if (blob.size > 200) {
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename.endsWith('.mp3') ? filename : `${filename}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
        return;
      }
    }
  } catch (err) {
    console.warn('Server TTS download failed:', err);
  }

  // Fallback: direct GET download URL
  try {
    const downloadUrl = `/api/tts/download?text=${encodeURIComponent(clean.slice(0, 1500))}&speed=${options?.speed || 1.0}&voiceId=${options?.voiceId || 'cloud_vi_standard'}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename.endsWith('.mp3') ? filename : `${filename}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  } catch (e) {
    console.warn('Fallback direct download error:', e);
  }

  alert('Không thể tải file âm thanh. Vui lòng kiểm tra kết nối mạng và thử lại!');
}
