import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { convertLatexToSpokenVietnamese } from "./src/lib/latexToSpeech";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Centralized Built-in System Gemini API Keys
const SYSTEM_GEMINI_API_KEYS: string[] = [
  "AQ.Ab8RN6LgoHagKW06yf-5hsUy6KEiQJeSAFHc4laV7YuO4vwSvw",
  "AQ.Ab8RN6K-2LrDJSJg5SxjGQEk_hmevTXQyoYLCNL11dpOunZk1A",
  "AQ.Ab8RN6KaCcfRIbbDzzbD4tnYLbcTSLXH1nJ04zQRA8spyrnobg"
];

// Helper function to call Gemini with multi-key and multi-model fallback
const CANDIDATE_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-flash-lite-latest",
  "gemini-3.5-flash-lite",
  "gemini-3-flash-preview",
  "gemini-3.8-flash",
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
  "gemini-3.7-flash",
  "gemini-3.1-pro-preview"
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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function generateWithFallback(
  apiKeys: string[] | string | undefined,
  contents: any[],
  config?: any
): Promise<string> {
  const envKey = process.env.GEMINI_API_KEY;
  const rawInput = Array.isArray(apiKeys)
    ? apiKeys
    : typeof apiKeys === "string"
    ? [apiKeys]
    : [];

  const userKeys: string[] = [];
  for (const item of rawInput) {
    if (typeof item === "string" && item.trim()) {
      const parts = item.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);
      userKeys.push(...parts);
    }
  }

  // Priority: 1. Environment Key (if valid), 2. User custom keys from client/UI, 3. Built-in default keys
  const allCandidateKeys = [
    ...(isLikelyValidKey(envKey) ? [envKey!.trim()] : []),
    ...userKeys,
    ...SYSTEM_GEMINI_API_KEYS
  ];

  // Deduplicate and filter valid keys
  const keysToTry = Array.from(
    new Set(
      allCandidateKeys.filter(isLikelyValidKey)
    )
  );

  if (keysToTry.length === 0) {
    throw new Error("Chưa có API Key khả dụng. Thầy/Cô vui lòng nhập API Key Gemini ở Tab 2.");
  }

  let lastError: any = null;

  for (const key of keysToTry) {
    const ai = new GoogleGenAI({ apiKey: key });

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
        const errStr = err?.message || String(err);
        lastError = err;

        const isQuotaExceeded =
          errStr.includes("RESOURCE_EXHAUSTED") ||
          errStr.includes("429") ||
          errStr.includes("exceeded your current quota") ||
          errStr.includes("RATE_LIMIT_EXCEEDED") ||
          errStr.includes("quota");

        const isModelUnavailable =
          errStr.includes("404") ||
          errStr.includes("NOT_FOUND") ||
          errStr.includes("no longer available") ||
          errStr.includes("is not supported") ||
          errStr.includes("model not found");

        const isServerBusy =
          errStr.includes("503") ||
          errStr.includes("high demand") ||
          errStr.includes("UNAVAILABLE") ||
          errStr.includes("overloaded");

        const isAuthInvalid =
          errStr.includes("API_KEY_INVALID") ||
          errStr.includes("API key not valid") ||
          errStr.includes("API_KEY_EXPIRED") ||
          errStr.includes("PERMISSION_DENIED") ||
          errStr.includes("CONSUMER_SUSPENDED") ||
          errStr.includes("UNAUTHENTICATED") ||
          errStr.includes('"code": 401') ||
          errStr.includes('"code": 403') ||
          errStr.includes('"code": 400') ||
          errStr.includes("invalid api key");

        const isNetworkOrFetchFailed =
          errStr.includes("fetch failed") ||
          errStr.includes("ECONNRESET") ||
          errStr.includes("ENOTFOUND") ||
          errStr.includes("UND_ERR_");

        // 1. Model not found or deprecated: try next model in candidate list
        if (isModelUnavailable) {
          console.warn(`[Gemini Fallback] Key (${key.slice(0, 6)}...) Model (${model}) not available, trying next candidate model...`);
          continue;
        }

        // 2. Key authentication failure / suspended / invalid: drop key and rotate to next key
        if (isAuthInvalid) {
          isKeyInvalid = true;
          console.warn(`[Gemini Fallback] Key (${key.slice(0, 6)}...) failed auth/validation (${errStr.slice(0, 80)}), rotating to next key...`);
          break;
        }

        // 3. Quota exceeded or rate limited (429 / RESOURCE_EXHAUSTED):
        if (isQuotaExceeded) {
          console.warn(`[Gemini Fallback] Key (${key.slice(0, 6)}...) hit quota/rate limit on ${model}, trying next candidate model in pool...`);
          await sleep(150);
          continue;
        }

        // 4. Server overloaded / 503:
        if (isServerBusy) {
          console.warn(`[Gemini Fallback] Key (${key.slice(0, 6)}...) Model (${model}) server busy (503), switching to next model...`);
          await sleep(300);
          continue;
        }

        // 5. Network / fetch failed: rotate key
        if (isNetworkOrFetchFailed) {
          isKeyInvalid = true;
          console.warn(`[Gemini Fallback] Key (${key.slice(0, 6)}...) network/fetch error (${errStr.slice(0, 80)}), rotating to next key...`);
          break;
        }

        console.warn(`[Gemini Fallback] Key (${key.slice(0, 6)}...) Model (${model}) error:`, errStr.slice(0, 120));
      }
    }
  }

  let errMsg = lastError?.message || "Lỗi xử lý Gemini API";
  if (
    errMsg.includes("429") ||
    errMsg.includes("RESOURCE_EXHAUSTED") ||
    errMsg.includes("quota") ||
    errMsg.includes("overloaded") ||
    errMsg.includes("high demand") ||
    errMsg.includes("exceeded your current quota")
  ) {
    errMsg = "Hạn ngạch API Key mặc định của hệ thống hiện đang tạm thời quá tải lượt dùng (hoặc chưa có Key Admin chia sẻ). Thầy/Cô vui lòng dán thêm 1-2 API Key Gemini miễn phí cá nhân (tại Tab 2 hoặc bấm biểu tượng Chìa khóa) để tiếp tục soạn bài ngay lập tức mà không bị gián đoạn!";
  } else if (
    errMsg.includes("503") ||
    errMsg.includes("UNAVAILABLE")
  ) {
    errMsg = "Hệ thống AI hiện đang có lượng truy cập cao (Lỗi 503). Thầy/Cô vui lòng thử lại sau vài giây hoặc nhập API Key cá nhân ở Tab 2 để được ưu tiên xử lý tức thì!";
  } else if (
    errMsg.includes("API_KEY_INVALID") ||
    errMsg.includes("API key not valid") ||
    errMsg.includes("PERMISSION_DENIED")
  ) {
    errMsg = "Mã API Key chưa chính xác hoặc đã hết hạn. Thầy/Cô vui lòng kiểm tra và nhập lại API Key cá nhân tại Tab 2 (Quét SGK & AI) để tiếp tục sử dụng!";
  }

  throw new Error(errMsg);
}

// API Health
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// In-memory cache for synthesized Vietnamese TTS audio chunks and merged tracks
const ttsChunkCache = new Map<string, Buffer>();
const ttsMergedCache = new Map<string, Buffer>();

async function fetchAudioChunkWithFallback(chunkText: string, speed: number = 1.0): Promise<Buffer | null> {
  const trimmed = chunkText.trim();
  if (!trimmed) return null;

  const cacheKey = `${trimmed}_${speed}`;
  if (ttsChunkCache.has(cacheKey)) {
    return ttsChunkCache.get(cacheKey)!;
  }

  const q = encodeURIComponent(trimmed);
  const speedParam = speed < 0.9 ? "0.24" : "1";

  const endpoints = [
    `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${q}&ttsspeed=${speedParam}`,
    `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=gtx&q=${q}`,
    `https://translate.google.com.vn/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${q}&ttsspeed=${speedParam}`,
    `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=vi&client=gtx&q=${q}`
  ];

  for (const url of endpoints) {
    try {
      const resp = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Referer": "https://translate.google.com/",
          "Accept": "*/*"
        }
      });
      if (resp.ok) {
        const arrayBuf = await resp.arrayBuffer();
        if (arrayBuf.byteLength > 80) {
          const buf = Buffer.from(arrayBuf);
          if (ttsChunkCache.size > 1500) {
            const firstKey = ttsChunkCache.keys().next().value;
            if (firstKey) ttsChunkCache.delete(firstKey);
          }
          ttsChunkCache.set(cacheKey, buf);
          return buf;
        }
      }
    } catch (err) {
      // Continue to next mirror
    }
  }

  return null;
}

// Proxy Vietnamese TTS Audio download & stream with multiple natural voices, pitch, and rates
async function handleTtsDownload(req: express.Request, res: express.Response) {
  try {
    const rawText = req.method === "POST" ? req.body.text : req.query.text;
    const voiceId = req.method === "POST" ? req.body.voiceId : req.query.voiceId;
    const speed = parseFloat(String(req.method === "POST" ? req.body.speed : req.query.speed)) || 1.0;
    const text = String(rawText || "").trim();

    if (!text) {
      return res.status(400).json({ error: "Missing text" });
    }

    // Clean text and mathematical formulas into spoken Vietnamese
    const clean = convertLatexToSpokenVietnamese(text);
    const mergedCacheKey = `${clean.slice(0, 200)}_${clean.length}_${speed}_${voiceId}`;

    let merged: Buffer | null = ttsMergedCache.get(mergedCacheKey) || null;

    if (!merged) {
      // Split text into natural breath-level and sentence-level chunks (130-160 chars) without breaking phrases
      const rawSentences = clean.split(/([.!?:;\n]+)/);
      const sentences: string[] = [];
      for (let i = 0; i < rawSentences.length; i += 2) {
        const part = ((rawSentences[i] || "") + (rawSentences[i + 1] || "")).trim();
        if (part) sentences.push(part);
      }

      const chunks: string[] = [];
      let currentChunk = "";

      for (const sentence of sentences) {
        if ((currentChunk + " " + sentence).length <= 150) {
          currentChunk = currentChunk ? currentChunk + " " + sentence : sentence;
        } else {
          if (currentChunk) chunks.push(currentChunk);
          if (sentence.length > 150) {
            // Split long sentence by clauses or spaces without cutting words
            const clauses = sentence.split(/([,;–—]\s*)/);
            let subChunk = "";
            for (let c = 0; c < clauses.length; c += 2) {
              const clausePart = ((clauses[c] || "") + (clauses[c + 1] || "")).trim();
              if ((subChunk + " " + clausePart).length <= 150) {
                subChunk = subChunk ? subChunk + " " + clausePart : clausePart;
              } else {
                if (subChunk) chunks.push(subChunk);
                if (clausePart.length > 150) {
                  const words = clausePart.split(" ");
                  let wordSub = "";
                  for (const w of words) {
                    if ((wordSub + " " + w).length <= 150) {
                      wordSub = wordSub ? wordSub + " " + w : w;
                    } else {
                      if (wordSub) chunks.push(wordSub);
                      wordSub = w;
                    }
                  }
                  if (wordSub) chunks.push(wordSub);
                  subChunk = "";
                } else {
                  subChunk = clausePart;
                }
              }
            }
            if (subChunk) chunks.push(subChunk);
            currentChunk = "";
          } else {
            currentChunk = sentence;
          }
        }
      }
      if (currentChunk) chunks.push(currentChunk);
      if (chunks.length === 0) chunks.push(clean.slice(0, 150));

      // Support unlimited length documents / books / long articles without truncation
      const targetChunks = chunks.filter(c => c.trim().length > 0).slice(0, 10000);
      const audioBuffers: Buffer[] = [];

      // Parallel batching to fetch chunks rapidly
      const BATCH_SIZE = 8;
      for (let i = 0; i < targetChunks.length; i += BATCH_SIZE) {
        const batch = targetChunks.slice(i, i + BATCH_SIZE);
        const promises = batch.map(chunk => fetchAudioChunkWithFallback(chunk, speed));
        const results = await Promise.all(promises);
        for (const resBuf of results) {
          if (resBuf && resBuf.length > 0) {
            audioBuffers.push(resBuf);
          }
        }
      }

      if (audioBuffers.length === 0) {
        return res.status(500).json({ error: "Could not fetch audio chunks" });
      }

      merged = Buffer.concat(audioBuffers);
      if (ttsMergedCache.size > 200) {
        const firstKey = ttsMergedCache.keys().next().value;
        if (firstKey) ttsMergedCache.delete(firstKey);
      }
      ttsMergedCache.set(mergedCacheKey, merged);
    }

    const totalSize = merged.length;
    const range = req.headers.range;

    // Handle HTTP Range for smooth seeking without glitching
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
      const chunksize = (end - start) + 1;
      const partialBuffer = merged.subarray(start, end + 1);

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${totalSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400"
      });
      res.end(partialBuffer);
      return;
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", totalSize);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Disposition", `attachment; filename="Bai_Giang_Audio_TiengViet.mp3"`);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(merged);
  } catch (err: any) {
    console.error("handleTtsDownload error:", err);
    res.status(500).json({ error: err.message || "Lỗi xử lý âm thanh" });
  }
}

app.get("/api/tts/download", (req, res) => {
  handleTtsDownload(req, res);
});

app.post("/api/tts/download", (req, res) => {
  handleTtsDownload(req, res);
});

app.get("/api/tts/stream", (req, res) => {
  handleTtsDownload(req, res);
});

app.post("/api/tts/stream", (req, res) => {
  handleTtsDownload(req, res);
});

// Centralized Licenses Storage in Server Memory / File for Realtime Admin Revocation
let serverIssuedLicenses: any[] = [
  {
    id: '1',
    key: 'CANVANTRUONGVIP1990',
    ownerName: 'Thầy Cấn Văn Trường (SUPERADMIN MASTER)',
    school: 'Trường THCS Phùng Khắc Khoan, TP. Hà Nội',
    issuedAt: '01/01/2026 08:00',
    expiryDate: '2099-12-31',
    status: 'active'
  }
];

// GET all issued licenses (Syncs down to client)
app.get("/api/licenses", (_req, res) => {
  res.json({ licenses: serverIssuedLicenses });
});

// POST update issued licenses (Admin creates, pauses, revokes or deletes)
app.post("/api/licenses/sync", (req, res) => {
  try {
    const { licenses } = req.body;
    if (Array.isArray(licenses)) {
      serverIssuedLicenses = licenses;
      res.json({ success: true, count: serverIssuedLicenses.length });
    } else {
      res.status(400).json({ error: "Invalid licenses data format" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Generic Text/Content Generation
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const { prompt, apiKeys, systemInstruction, images, maxOutputTokens } = req.body;

    if (!prompt && (!images || images.length === 0)) {
      return res.status(400).json({ error: "Yêu cầu phải có prompt hoặc hình ảnh." });
    }

    const contents: any[] = [];

    // Add inline files if provided (base64 audio, image, pdf, etc.)
    if (Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        if (typeof img === "string" && img.startsWith("data:")) {
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
      contents.push(typeof prompt === "string" ? { text: prompt } : prompt);
    }

    const config: any = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    // Set maxOutputTokens to 65536 for maximum detailed lesson plan generation
    config.maxOutputTokens = maxOutputTokens || 65536;

    const text = await generateWithFallback(apiKeys, contents, config);

    res.json({ text });
  } catch (err: any) {
    console.error("Error in /api/gemini/generate:", err);
    res.status(500).json({ error: err.message || "Lỗi xử lý AI" });
  }
});

// Vision Grading Endpoint
app.post("/api/gemini/vision", async (req, res) => {
  try {
    const { prompt, imageBase64, apiKeys } = req.body;

    const contents: any[] = [];
    if (imageBase64) {
      let mimeType = "image/jpeg";
      let data = imageBase64;
      if (imageBase64.startsWith("data:")) {
        const parts = imageBase64.split(",");
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
      contents.push(typeof prompt === "string" ? { text: prompt } : prompt);
    }

    const text = await generateWithFallback(apiKeys, contents);

    res.json({ text });
  } catch (err: any) {
    console.error("Error in /api/gemini/vision:", err);
    res.status(500).json({ error: err.message || "Lỗi chấm thi Vision" });
  }
});

// Chat Session Endpoint
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { history, message, apiKeys, systemInstruction, images } = req.body;

    const contents: any[] = [];
    if (Array.isArray(history)) {
      contents.push(...history);
    }

    const userParts: any[] = [];
    if (Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        if (typeof img === "string" && img.startsWith("data:")) {
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
      userParts.push({ text: "Hãy đọc hiểu ảnh đính kèm và phân tích nội dung/công thức toán học." });
    }

    contents.push({ role: "user", parts: userParts });

    const config: any = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    const text = await generateWithFallback(apiKeys, contents, config);

    res.json({ text });
  } catch (err: any) {
    console.error("Error in /api/gemini/chat:", err);
    res.status(500).json({ error: err.message || "Lỗi Chatbot AI" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server AI Lesson Planner Pro running on http://localhost:${PORT}`);
  });
}

startServer();
