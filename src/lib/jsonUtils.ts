/**
 * Safe and resilient JSON extraction & parsing utility for AI outputs.
 * Handles markdown code fences, conversational preambles/postambles, unescaped control chars, and trailing commas.
 */

export function extractJsonFromText<T = any>(text: string, defaultValue?: T): T {
  if (!text || typeof text !== 'string') {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error('Dữ liệu phản hồi trống hoặc không hợp lệ.');
  }

  const trimmed = text.trim();

  // 1. Try direct parsing
  try {
    return JSON.parse(trimmed);
  } catch {}

  // 2. Try markdown json block: ```json ... ``` or ``` ... ```
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
  let match: RegExpExecArray | null;
  while ((match = codeBlockRegex.exec(trimmed)) !== null) {
    if (match[1]) {
      const candidate = match[1].trim();
      try {
        return JSON.parse(candidate);
      } catch {
        const sanitized = sanitizeJsonString(candidate);
        try {
          return JSON.parse(sanitized);
        } catch {}
      }
    }
  }

  // 3. Try finding outermost JSON Object: { ... }
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      const sanitized = sanitizeJsonString(candidate);
      try {
        return JSON.parse(sanitized);
      } catch {}
    }
  }

  // 4. Try finding outermost JSON Array: [ ... ]
  const firstBracket = trimmed.indexOf('[');
  const lastBracket = trimmed.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const candidate = trimmed.substring(firstBracket, lastBracket + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      const sanitized = sanitizeJsonString(candidate);
      try {
        return JSON.parse(sanitized);
      } catch {}
    }
  }

  if (defaultValue !== undefined) {
    return defaultValue;
  }

  throw new Error('Không thể phân tích dữ liệu JSON từ phản hồi của AI.');
}

/**
 * Clean common AI JSON mistakes like trailing commas, single quotes, unescaped newlines in strings
 */
function sanitizeJsonString(str: string): string {
  return str
    // Remove trailing commas before } or ]
    .replace(/,\s*([\]}])/g, '$1')
    // Remove any non-printable control characters except standard whitespace
    .replace(/[\u0000-\u0009\u000B-\u000C\u000E-\u001F]/g, '');
}
