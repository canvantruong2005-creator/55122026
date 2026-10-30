import { GoogleGenAI } from '@google/genai';
import { getActiveSharedApiKeysSync } from './adminConfig';

interface GenerateOptions {
  prompt: string;
  apiKeys?: string[] | string;
  systemInstruction?: string;
  images?: string[];
  maxOutputTokens?: number;
}

interface VisionOptions {
  prompt: string;
  imageBase64: string;
  apiKeys?: string[] | string;
}

export interface ChatOptions {
  message: string;
  apiKeys?: string[] | string;
  systemInstruction?: string;
  history?: any[];
  images?: string[];
}

// Built-in system Gemini API keys pool for seamless instant usage across all tabs
export const DEFAULT_BUILTIN_API_KEYS: string[] = [
  'AQ.Ab8RN6LgoHagKW06yf-5hsUy6KEiQJeSAFHc4laV7YuO4vwSvw',
  'AQ.Ab8RN6K-2LrDJSJg5SxjGQEk_hmevTXQyoYLCNL11dpOunZk1A',
  'AQ.Ab8RN6KaCcfRIbbDzzbD4tnYLbcTSLXH1nJ04zQRA8spyrnobg'
];

export const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3-flash-preview',
  'gemini-3.8-flash',
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.7-flash',
  'gemini-3.1-pro-preview'
];

function isLikelyValidKey(k: any): boolean {
  if (!k || typeof k !== 'string') return false;
  const trimmed = k.trim();
  if (trimmed.length < 20) return false;
  if (
    trimmed === 'GEMINI_API_KEY' ||
    trimmed.startsWith('GEMINI_') ||
    trimmed.startsWith('YOUR_') ||
    trimmed === 'undefined' ||
    trimmed === 'null' ||
    trimmed.includes('...') ||
    trimmed.includes(' ')
  ) {
    return false;
  }
  return true;
}

/**
 * Resolves user keys, shared admin cloud keys, environment variables, and built-in system keys into a prioritized, deduplicated array.
 */
export function resolveApiKeys(apiKeys?: string[] | string): string[] {
  const rawInput = Array.isArray(apiKeys)
    ? apiKeys
    : typeof apiKeys === 'string'
    ? [apiKeys]
    : [];

  const userKeys: string[] = [];
  for (const item of rawInput) {
    if (typeof item === 'string' && item.trim()) {
      const parts = item.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);
      userKeys.push(...parts);
    }
  }

  // Active Shared Cloud Keys from Admin
  const sharedAdminKeys = getActiveSharedApiKeysSync();

  // Check Vite client-side env variable or server env variable if available
  let envKey = '';
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) {
      envKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
    } else if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
      envKey = process.env.GEMINI_API_KEY;
    }
  } catch (e) {}

  // USER SPECIFIED PRIORITY ORDER:
  // 1. Environment Key (GEMINI_API_KEY)
  // 2. Local user keys added in UI (GV tự thêm key dùng cá nhân)
  // 3. Active Shared Cloud Keys from Admin
  // 4. Built-in system keys
  const combined = [
    ...(isLikelyValidKey(envKey) ? [envKey.trim()] : []),
    ...userKeys,
    ...sharedAdminKeys,
    ...DEFAULT_BUILTIN_API_KEYS
  ];

  return Array.from(
    new Set(
      combined.filter(isLikelyValidKey)
    )
  );
}

/**
 * Quick diagnostic tool to test if an API Key is valid and active
 */
export async function testGeminiApiKey(apiKey: string): Promise<{ valid: boolean; model?: string; error?: string }> {
  const key = apiKey.trim();
  if (!key || key.length < 10) {
    return { valid: false, error: 'Key quá ngắn hoặc không hợp lệ' };
  }

  const ai = new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });

  for (const model of CANDIDATE_MODELS) {
    try {
      const resp = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: 'Ping test' }] }]
      });
      if (resp && resp.text) {
        return { valid: true, model };
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
        return { valid: false, error: 'API Key không hợp lệ hoặc đã bị vô hiệu hóa bởi Google' };
      }
    }
  }

  return { valid: false, error: 'Không thể kết nối hoặc Key đã hết hạn ngạch' };
}


// Helper to execute GoogleGenAI client-side with key rotation and candidate model fallbacks
async function generateClientDirect(
  apiKeys: string[] | string | undefined,
  contents: any[],
  systemInstruction?: string,
  maxOutputTokens?: number
): Promise<string> {
  const validKeys = resolveApiKeys(apiKeys);

  if (validKeys.length === 0) {
    throw new Error('Chưa có API Key khả dụng. Thầy/Cô có thể nhập thêm API Key Gemini ở Tab 2.');
  }

  let lastError: any = null;

  for (const apiKey of validKeys) {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
    const config: any = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    config.maxOutputTokens = maxOutputTokens || 65536;

    let isKeyInvalid = false;

    for (const model of CANDIDATE_MODELS) {
      if (isKeyInvalid) break;

      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config
        });

        if (response && response.text) {
          return response.text;
        }
      } catch (err: any) {
        const msg = err?.message || String(err);
        lastError = err;

        const isQuotaExceeded =
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('429') ||
          msg.includes('exceeded your current quota') ||
          msg.includes('RATE_LIMIT_EXCEEDED') ||
          msg.includes('quota');

        const isModelUnavailable =
          msg.includes('404') ||
          msg.includes('NOT_FOUND') ||
          msg.includes('no longer available') ||
          msg.includes('is not supported') ||
          msg.includes('model not found');

        const isServerBusy =
          msg.includes('503') ||
          msg.includes('high demand') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('overloaded');

        const isAuthInvalid =
          msg.includes('API_KEY_INVALID') ||
          msg.includes('API key not valid') ||
          msg.includes('API_KEY_EXPIRED') ||
          msg.includes('PERMISSION_DENIED') ||
          msg.includes('CONSUMER_SUSPENDED') ||
          msg.includes('UNAUTHENTICATED') ||
          msg.includes('"code": 401') ||
          msg.includes('"code": 403') ||
          msg.includes('"code": 400') ||
          msg.includes('invalid api key');

        const isNetworkOrFetchFailed =
          msg.includes('fetch failed') ||
          msg.includes('Failed to fetch') ||
          msg.includes('NetworkError') ||
          msg.includes('ECONNRESET') ||
          msg.includes('ENOTFOUND') ||
          msg.includes('UND_ERR_');

        if (isModelUnavailable) {
          console.warn(`[Client Direct] Key ${apiKey.slice(0, 6)}... Model ${model} not available, trying next candidate model...`);
          continue;
        }

        if (isAuthInvalid) {
          isKeyInvalid = true;
          console.warn(`[Client Direct] Key ${apiKey.slice(0, 6)}... failed auth/validation (${msg.slice(0, 80)}), moving to next key...`);
          break;
        }

        if (isQuotaExceeded) {
          console.warn(`[Client Direct] Key ${apiKey.slice(0, 6)}... hit quota/rate limit on ${model}, trying next model in pool...`);
          continue;
        }

        if (isServerBusy) {
          console.warn(`[Client Direct] Key ${apiKey.slice(0, 6)}... Model ${model} server busy (503), switching to next model...`);
          continue;
        }

        if (isNetworkOrFetchFailed) {
          isKeyInvalid = true;
          console.warn(`[Client Direct] Key ${apiKey.slice(0, 6)}... network/fetch failed (${msg.slice(0, 80)}), moving to next key...`);
          break;
        }

        console.warn(`Key ${apiKey.slice(0, 6)}... với model ${model} gặp lỗi:`, msg.slice(0, 100));
      }
    }
  }

  let errMsg = lastError?.message || 'Không thể kết nối AI Gemini với các API Key hiện có. Vui lòng thử lại hoặc kiểm tra API Key ở Tab 2.';
  if (
    errMsg.includes('429') ||
    errMsg.includes('RESOURCE_EXHAUSTED') ||
    errMsg.includes('quota') ||
    errMsg.includes('overloaded') ||
    errMsg.includes('high demand') ||
    errMsg.includes('exceeded your current quota')
  ) {
    errMsg = 'Hạn ngạch API Key mặc định của hệ thống hiện đang tạm thời quá tải lượt dùng (hoặc chưa có Key Admin chia sẻ). Thầy/Cô vui lòng dán thêm 1-2 API Key Gemini miễn phí cá nhân tại Tab 2 (hoặc bấm biểu tượng Chìa khóa) để tiếp tục soạn bài mượt mà và không bị gián đoạn!';
  } else if (
    errMsg.includes('503') ||
    errMsg.includes('UNAVAILABLE')
  ) {
    errMsg = 'Hệ thống AI hiện đang chịu tải cao (Lỗi 503). Thầy/Cô vui lòng thử lại sau vài giây hoặc nhập API Key cá nhân tại Tab 2 để được ưu tiên xử lý tức thì!';
  } else if (
    errMsg.includes('API_KEY_INVALID') ||
    errMsg.includes('API key not valid') ||
    errMsg.includes('PERMISSION_DENIED')
  ) {
    errMsg = 'Mã API Key cá nhân chưa chính xác hoặc đã hết hạn. Thầy/Cô vui lòng kiểm tra và nhập lại API Key tại Tab 2 (Quét SGK & AI) để tiếp tục sử dụng!';
  }

  throw new Error(errMsg);
}

// Universal Text Generation (Server backend + Client SDK fallback)
export async function generateGeminiText(options: GenerateOptions): Promise<string> {
  const { prompt, apiKeys, systemInstruction, images, maxOutputTokens } = options || {};
  const resolvedKeys = resolveApiKeys(apiKeys);

  // 1. Try server-side API endpoint first
  let serverError: any = null;
  try {
    const res = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, apiKeys: resolvedKeys, systemInstruction, images, maxOutputTokens })
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (res.ok && data.text) return data.text;
      if (data.error) {
        serverError = new Error(data.error);
      }
    }
  } catch (e: any) {
    serverError = e;
  }

  // 2. Client-side SDK fallback if server did not succeed
  try {
    const contents: any[] = [];
    if (Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        if (typeof img === 'string' && img.startsWith('data:')) {
          const matches = img.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
          if (matches) {
            contents.push({
              inlineData: {
                mimeType: matches[1],
                data: matches[2]
              }
            });
          }
        }
      }
    }
    if (prompt) {
      contents.push({ text: prompt });
    }

    return await generateClientDirect(resolvedKeys, contents, systemInstruction, maxOutputTokens);
  } catch (clientErr: any) {
    throw serverError || clientErr;
  }
}

export const generateGeminiContent = generateGeminiText;

/**
 * Transcribe Audio (MP3, WAV, M4A, OGG, WebM) into structured Vietnamese text, LaTeX equations, and pedagogy-ready formats.
 */
export async function transcribeAudioWithGemini(options: {
  audioBase64: string;
  apiKeys?: string[] | string;
  taskMode?: 'verbatim' | 'lesson_summary' | 'qa_extract';
  customInstructions?: string;
  subject?: string;
  grade?: string;
}): Promise<string> {
  const { audioBase64, apiKeys, taskMode = 'verbatim', customInstructions, subject = 'Toán học', grade = '8' } = options;

  let systemPrompt = `Bạn là Trợ lý Sư phạm Cao cấp chuyên gia Bóc băng & Chuyển đổi Âm thanh / Giọng nói sang Văn bản (Audio-to-Text).
Nhiệm vụ của bạn là lắng nghe thật kỹ tệp âm thanh lời giảng / ghi âm của Thầy/Cô và thực hiện chuyển đổi chính xác tuyệt đối:

1. ĐẶC BIỆT VỀ CÔNG THỨC TOÁN & KÝ HIỆU KHOA HỌC:
- Mọi công thức Toán học, Vật lý, Hóa học mà giáo viên nói (ví dụ: "a bình cộng b bình", "căn bậc hai của x bình cộng một", "phân số a trên b", "a khác không", "tam giác ABC vuông tại A", "góc sáu mươi độ") PHẢI ĐƯỢC CHUYỂN ĐỔI CHÍNH XÁC SANG CHUẨN LATEX $...$ hoặc $$...$$ (Ví dụ: $a^2 + b^2$, $\\sqrt{x^2+1}$, $\\frac{a}{b}$, $a \\neq 0$, $\\triangle ABC$, $60^\\circ$).
- Không bọc dấu $ vào chữ tiếng Việt thông thường hay số thứ tự.

2. CÁC CHẾ ĐỘ XỬ LÝ:`;

  if (taskMode === 'lesson_summary') {
    systemPrompt += `
- Chế độ: TÓM TẮT BÀI GIẢNG & LẬP KẾ HOẠCH BÀI DẠY.
- Phân tích bài giảng, chia thành các phần: Mục tiêu bài học, Kiến thức trọng tâm, Các ví dụ mẫu và phương pháp giải, Bài tập vận dụng và Lời dặn dò.`;
  } else if (taskMode === 'qa_extract') {
    systemPrompt += `
- Chế độ: TRÍCH XUẤT HỆ THỐNG CÂU HỎI & BÀI TẬP TỪ LỜI GIẢNG.
- Tổng hợp toàn bộ các câu hỏi gợi mở, ví dụ giải mẫu và bài tập mà giáo viên đã nêu trong đoạn âm thanh. Kèm theo hướng dẫn giải chi tiết.`;
  } else {
    systemPrompt += `
- Chế độ: BÓC BĂNG NGUYÊN VĂN & ĐỊNH DẠNG SƯ PHẠM.
- Bóc băng chính xác 100% nội dung lời nói, ngắt câu và ngắt đoạn mạch lạc, sửa các lỗi lặp từ thừa do nói vấp, giữ nguyên văn phong sư phạm chuẩn mực.`;
  }

  if (customInstructions) {
    systemPrompt += `\n\nYêu cầu bổ sung từ Thầy/Cô: ${customInstructions}`;
  }

  const userPrompt = `Hãy bóc băng và chuyển đổi tệp âm thanh này môn ${subject} Lớp ${grade} sang văn bản định dạng Markdown rõ ràng, chuẩn mực sư phạm để sẵn sàng xuất sang file Word (.docx).`;

  return await generateGeminiText({
    prompt: userPrompt,
    images: [audioBase64],
    systemInstruction: systemPrompt,
    apiKeys
  });
}

// Universal Vision Grading & OCR
export async function generateGeminiVision(options: VisionOptions): Promise<string> {
  const { prompt, imageBase64, apiKeys } = options || {};
  const resolvedKeys = resolveApiKeys(apiKeys);

  let serverError: any = null;
  // 1. Try server-side API first
  try {
    const res = await fetch('/api/gemini/vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, imageBase64, apiKeys: resolvedKeys })
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (res.ok && data.text) return data.text;
      if (data.error) {
        serverError = new Error(data.error);
      }
    }
  } catch (e: any) {
    serverError = e;
  }

  // 2. Client-side SDK fallback
  try {
    const contents: any[] = [];
    if (imageBase64) {
      let mimeType = 'image/jpeg';
      let data = imageBase64;
      if (imageBase64.startsWith('data:')) {
        const parts = imageBase64.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        if (mimeMatch) mimeType = mimeMatch[1];
        data = parts[1];
      }
      contents.push({
        inlineData: {
          mimeType,
          data
        }
      });
    }
    if (prompt) {
      contents.push({ text: prompt });
    }

    return await generateClientDirect(resolvedKeys, contents);
  } catch (clientErr: any) {
    throw serverError || clientErr;
  }
}

// Universal Chat
export async function generateGeminiChat(options: ChatOptions): Promise<string> {
  const { message, apiKeys, systemInstruction, history, images } = options || {};
  const resolvedKeys = resolveApiKeys(apiKeys);

  let serverError: any = null;
  // 1. Try server-side API
  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, apiKeys: resolvedKeys, systemInstruction, history, images })
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (res.ok && data.text) return data.text;
      if (data.error) {
        serverError = new Error(data.error);
      }
    }
  } catch (e: any) {
    serverError = e;
  }

  // 2. Client-side SDK fallback
  try {
    const contents: any[] = [];
    if (Array.isArray(history)) {
      contents.push(...history);
    }

    const userParts: any[] = [];
    if (Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        if (typeof img === 'string' && img.startsWith('data:')) {
          const matches = img.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
          if (matches) {
            userParts.push({
              inlineData: {
                mimeType: matches[1],
                data: matches[2]
              }
            });
          }
        }
      }
    }

    if (message) {
      userParts.push({ text: message });
    } else if (userParts.length === 0) {
      userParts.push({ text: 'Hãy đọc hiểu ảnh đính kèm và phân tích nội dung/công thức toán học.' });
    }

    contents.push({ role: 'user', parts: userParts });

    return await generateClientDirect(resolvedKeys, contents, systemInstruction);
  } catch (clientErr: any) {
    throw serverError || clientErr;
  }
}

export interface AudioTranscribeOptions {
  prompt?: string;
  audioBase64: string;
  mimeType?: string;
  apiKeys?: string[] | string;
}

// Universal Audio Transcription and Audio Understanding with Gemini
export async function generateGeminiAudioTranscript(options: AudioTranscribeOptions): Promise<string> {
  const { prompt = 'Hãy chuyển đổi toàn bộ âm thanh bài giảng này thành văn bản Tiếng Việt chính xác, đầy đủ, đúng ngữ pháp, ngắt câu và định dạng rõ ràng.', audioBase64, mimeType = 'audio/mp3', apiKeys } = options;
  const resolvedKeys = resolveApiKeys(apiKeys);

  let data = audioBase64;
  let resolvedMime = mimeType;
  if (audioBase64.startsWith('data:')) {
    const parts = audioBase64.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    if (mimeMatch) resolvedMime = mimeMatch[1];
    data = parts[1];
  }

  const contents = [
    {
      inlineData: {
        mimeType: resolvedMime,
        data: data
      }
    },
    { text: prompt }
  ];

  return await generateClientDirect(resolvedKeys, contents);
}


