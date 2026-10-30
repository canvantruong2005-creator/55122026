import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  BorderStyle,
  ImageRun,
  VerticalAlign,
  TableLayoutType,
  PageOrientation,
  ShadingType,
  Math as DocxMath,
  MathRun,
  MathFraction,
  MathRadical,
  MathSuperScript,
  MathSubScript,
  XmlComponent,
  RunProperties,
  createMathAccentCharacter
} from 'docx';
import { saveAs } from 'file-saver';
import { convertTikzToSvg } from './tikzRenderer';
import { sanitizeMathForVietnamese, repairVietnameseText, autoWrapVietnameseMathTokens, unpackLatexAlignedEnvironments } from './mathSanitizer';
import { validateLicenseKey, STORAGE_KEY_SAVED_LICENSE } from './licenseUtils';
import { normalizeVietnameseTerminology, repairAllLessonPlanTables, ungluePedagogicalHeadings, rebalanceLessonPlanActivityDurations, parsePeriodDurationMinutes, isActivityStepContent, isProductContent, splitStepsAndProduct } from './terminologyUtils';
import { autoNormalizeVietnameseFont } from './vietnameseFontConverter';

export interface WordExportOptions {
  headerText?: string;
  footerText?: string;
  watermarkText?: string;
  monHoc?: string;
  lop?: string;
  ngaySoan?: string;
  tiet?: string;
  tietPPCT?: string;
  baiHoc?: string;
  teacherName?: string;
  schoolName?: string;
  namHoc?: string;
  thoiluong?: string;
  hideActivityTime?: boolean;
  showPageNumbers?: boolean;
  fileName?: string;
  isLandscape?: boolean;
  isVip?: boolean;
}

/**
 * Converts vector SVG string to PNG Uint8Array via Canvas rasterization in browser.
 */
function convertSvgToPngUint8Array(svgString: string, width = 600, height = 400): Promise<Uint8Array | null> {
  return new Promise(resolve => {
    try {
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(url);
          const dataUrl = canvas.toDataURL('image/png');
          const bytes = base64ToUint8Array(dataUrl);
          resolve(bytes);
          return;
        }
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    } catch (err) {
      resolve(null);
    }
  });
}

/**
 * Renders a TikZ LaTeX block into a PNG image Uint8Array using Kroki, QuickChart, or local SVG rasterizer.
 */
async function fetchTikzImageBuffer(tikzCode: string): Promise<Uint8Array | null> {
  const cleanedCode = tikzCode.trim();
  const fullSource = cleanedCode.includes('\\documentclass')
    ? cleanedCode
    : `\\documentclass[tikz,border=8pt]{standalone}\n\\usepackage{tikz}\n\\usepackage{amsmath,amssymb}\n\\begin{document}\n${cleanedCode}\n\\end{document}`;

  // Attempt 1: Kroki API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://kroki.io/tikz/png', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: fullSource,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const arrayBuf = await res.arrayBuffer();
      if (arrayBuf.byteLength > 100) {
        return new Uint8Array(arrayBuf);
      }
    }
  } catch (err) {
    console.warn('TikZ Kroki rendering attempted fallback');
  }

  // Attempt 2: QuickChart TikZ API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const qcUrl = `https://quickchart.io/tikz?tikz=${encodeURIComponent(cleanedCode)}`;
    const res = await fetch(qcUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const arrayBuf = await res.arrayBuffer();
      if (arrayBuf.byteLength > 100) {
        return new Uint8Array(arrayBuf);
      }
    }
  } catch (err) {
    console.warn('QuickChart TikZ fallback attempted');
  }

  // Attempt 3: Client-side TikZ to SVG vector rendering + Canvas rasterizer
  try {
    const svgString = convertTikzToSvg(cleanedCode);
    if (svgString) {
      const pngBytes = await convertSvgToPngUint8Array(svgString);
      if (pngBytes && pngBytes.length > 100) {
        return pngBytes;
      }
    }
  } catch (err) {
    console.warn('TikZ local SVG fallback error:', err);
  }

  return null;
}

/**
 * Maps digits and letters to Unicode superscripts for roots and exponents.
 */
function toSuperscript(str: string): string {
  const map: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
    'n': 'ⁿ', 'i': 'ⁱ', 'k': 'ᵏ', 'm': 'ᵐ', 'x': 'ˣ', 'a': 'ᵃ', 'b': 'ᵇ'
  };
  return str.split('').map(c => map[c] || c).join('');
}

class MathAccentPr extends XmlComponent {
  constructor() {
    super('m:accPr');
    this.root.push(createMathAccentCharacter({ accent: '̂' }));
  }
}

class MathNormalTag extends XmlComponent {
  constructor() {
    super('m:nor');
  }
}

class MathNormalProperty extends XmlComponent {
  constructor() {
    super('m:rPr');
    this.root.push(new MathNormalTag());
  }
}

class MathTextComponent extends XmlComponent {
  constructor(text: string) {
    super('m:t');
    this.root.push(text);
  }
}

/**
 * Custom math run component that guarantees Times New Roman font and 14pt (size 28)
 * for all math formulas and symbols inside <m:oMath>, strictly adhering to user formatting rules.
 * Supports upright (m:nor) for numbers, operators, punctuation, and italics for variables.
 */
export class StyledMathRun extends XmlComponent {
  constructor(text: string, options: { font?: string; size?: number; normal?: boolean; bold?: boolean } = {}) {
    super('m:r');

    if (options.normal) {
      this.root.push(new MathNormalProperty());
    }

    this.root.push(new MathTextComponent(text));
  }
}

class MathAccentBase extends XmlComponent {
  constructor(text: string) {
    super('m:e');
    this.root.push(new StyledMathRun(text));
  }
}

/**
 * Creates native Microsoft Word equation accent for angles (e.g. wide circumflex over ABC, xOy, A).
 * Output XML: <m:acc><m:accPr><m:chr m:val="̂"/></m:accPr><m:e><m:r><m:t>ABC</m:t></m:r></m:e></m:acc>
 * Word renders this as an exact wide hat above the full vertex string (matching Vietnamese SGK standard).
 */
export class MathAccent extends XmlComponent {
  constructor(text: string) {
    super('m:acc');
    this.root.push(new MathAccentPr());
    this.root.push(new MathAccentBase(text));
  }
}

class MathVecAccentPr extends XmlComponent {
  constructor() {
    super('m:accPr');
    this.root.push(createMathAccentCharacter({ accent: '→' }));
  }
}

/**
 * Creates native Microsoft Word equation accent for vectors (e.g. arrow over AB, u).
 * Output XML: <m:acc><m:accPr><m:chr m:val="→"/></m:accPr><m:e><m:r><m:t>AB</m:t></m:r></m:e></m:acc>
 */
export class MathVecAccent extends XmlComponent {
  constructor(text: string) {
    super('m:acc');
    this.root.push(new MathVecAccentPr());
    this.root.push(new MathAccentBase(text));
  }
}

/**
 * Converts angle notation (e.g. ABC, xOy, A) into standard Unicode characters for plain text fallback.
 * Uses Vietnamese textbook standard placing the circumflex accent on the vertex (middle letter)
 * or Â, B̂, Ĉ for single letters. NEVER converts to ∠ABC.
 */
function convertAngleToUnicode(name: string): string {
  const clean = name.trim();
  if (!clean) return '';
  if (clean.length === 1) {
    const map: Record<string, string> = {
      'A': 'Â', 'B': 'B̂', 'C': 'Ĉ', 'D': 'D̂', 'E': 'Ê',
      'M': 'M̂', 'N': 'N̂', 'P': 'P̂', 'O': 'Ô', 'H': 'Ĥ',
      'K': 'K̂', 'S': 'Ŝ', 'x': 'x̂', 'y': 'ŷ', 'z': 'ẑ'
    };
    return map[clean] || `${clean}\u0302`;
  }
  if (clean.length === 3) {
    const v = clean[1];
    const mapVertex: Record<string, string> = {
      'A': 'Â', 'B': 'B̂', 'C': 'Ĉ', 'D': 'D̂', 'E': 'Ê',
      'M': 'M̂', 'N': 'N̂', 'P': 'P̂', 'O': 'Ô', 'H': 'Ĥ',
      'K': 'K̂', 'S': 'Ŝ', 'x': 'x̂', 'y': 'ŷ', 'z': 'ẑ'
    };
    const accentedVertex = mapVertex[v] || `${v}\u0302`;
    return `${clean[0]}${accentedVertex}${clean[2]}`;
  }
  const mid = Math.floor(clean.length / 2);
  return clean.substring(0, mid) + clean[mid] + '\u0302' + clean.substring(mid + 1);
}

/**
 * Helper to extract a balanced block starting with '{' or '[' from a string.
 * Supports fallback to a single token/character if braces were omitted by user or AI (e.g. \sqrt 2, \frac 1 2).
 */
function extractBalancedBlock(str: string, startIndex: number, openChar = '{', closeChar = '}'): { content: string; endIndex: number } | null {
  let i = startIndex;
  while (i < str.length && /\s/.test(str[i])) i++;
  if (i >= str.length) return null;

  if (str[i] === openChar) {
    let depth = 0;
    const start = i + 1;
    for (let j = i; j < str.length; j++) {
      if (str[j] === openChar && (j === 0 || str[j - 1] !== '\\')) {
        depth++;
      } else if (str[j] === closeChar && (j === 0 || str[j - 1] !== '\\')) {
        depth--;
        if (depth === 0) {
          return { content: str.substring(start, j), endIndex: j + 1 };
        }
      }
    }
    return null;
  }

  // Fallback for '{': match a single character/digit token or macro when braces were omitted (e.g. \sqrt 2, \frac 1 2, x^2, 60^\circ)
  if (openChar === '{') {
    const singleTokenMatch = str.substring(i).match(/^(?:\\[a-zA-Z]+|[0-9]+|[a-zA-Z])/);
    if (singleTokenMatch) {
      return { content: singleTokenMatch[0], endIndex: i + singleTokenMatch[0].length };
    }
  }

  return null;
}

/**
 * Extracts a trailing math atom (e.g. variable, number, or parenthesized block like `(x + 1)`)
 * to serve as the base for a superscript (^) or subscript (_).
 * Correctly separates coefficients and signs (e.g. -8x^3 -> before: "-8", atom: "x"; 4,5x^2 -> before: "4,5", atom: "x").
 */
function extractTrailingAtom(str: string): { before: string; atom: string } {
  const trimmed = str.trimEnd();
  if (trimmed.endsWith(')')) {
    let depth = 0;
    for (let i = trimmed.length - 1; i >= 0; i--) {
      if (trimmed[i] === ')') depth++;
      else if (trimmed[i] === '(') {
        depth--;
        if (depth === 0) {
          return { before: trimmed.substring(0, i), atom: trimmed.substring(i) };
        }
      }
    }
  }
  if (trimmed.endsWith(']')) {
    let depth = 0;
    for (let i = trimmed.length - 1; i >= 0; i--) {
      if (trimmed[i] === ']') depth++;
      else if (trimmed[i] === '[') {
        depth--;
        if (depth === 0) {
          return { before: trimmed.substring(0, i), atom: trimmed.substring(i) };
        }
      }
    }
  }
  if (trimmed.endsWith('}')) {
    let depth = 0;
    for (let i = trimmed.length - 1; i >= 0; i--) {
      if (trimmed[i] === '}') depth++;
      else if (trimmed[i] === '{') {
        depth--;
        if (depth === 0) {
          return { before: trimmed.substring(0, i), atom: trimmed.substring(i) };
        }
      }
    }
  }

  // If atom is a single variable letter (e.g. "x", "y", "z", "a", "b"):
  // Base is ONLY that variable! (e.g. "-8x" -> before: "-8", atom: "x"; "4,5x" -> before: "4,5", atom: "x")
  const letterMatch = /([a-zA-Z])$/.exec(trimmed);
  if (letterMatch) {
    return { before: trimmed.substring(0, trimmed.length - 1), atom: letterMatch[1] };
  }

  // If atom is pure digits (e.g. "10", "2", "25"):
  const numMatch = /([0-9]+)$/.exec(trimmed);
  if (numMatch) {
    return { before: trimmed.substring(0, numMatch.index), atom: numMatch[1] };
  }

  return { before: '', atom: trimmed };
}

/**
 * Converts a LaTeX math string into docx OMML components (MathFraction, MathRadical, MathAccent, MathSuperScript, MathSubScript, MathRun).
 * Generates true native Microsoft Word equation objects (<m:oMath>) matching textbook SGK formatting:
 * - \frac{1}{8} -> Word MathFraction with horizontal bar (matching user requirement, NO vulgar fractions ½, ⅛)
 * - \frac{\sqrt{X}}{\sqrt{X} + 1} + 2\frac{X - 1}{\sqrt{X} - 1} -> True Word algebraic fraction with nested radicals and horizontal division bars
 * - \widehat{ABC} -> True Word MathAccent with wide hat over ABC
 * - \vec{u}, \overrightarrow{AB} -> True Word MathAccent with vector arrow
 * - x^2, 180^\circ -> True Word MathSuperScript
 * - x_1, d_1 -> True Word MathSubScript
 */
export function parseLatexMathToDocx(latex: string): XmlComponent[] {
  // Pre-strip LaTeX aligned environments, alignment & and line breaks \\ so they never leak into Word Equation runs
  let s = latex.trim()
    .replace(/\\?mathbb(?:\s*\{\s*\}\s*(?:\^\s*(?:\*|\\ast|\{?\*\}?|\{?\\ast\}?)|\^)|\s*\{\s*\^\s*\*?\s*\}|\s*\^\s*(?:\*|\\ast|\{?\*\}?|\{?\\ast\}?)|\s*\^|\s*\\\^)/gi, 'ℕ*')
    .replace(/\\?mathbb\s*\{\s*N\s*\}\s*(?:\^\s*(?:\*|\\ast|\{?\*\}?|\{?\\ast\}?)|_\s*0|\*)|\$?\bℕ\s*\*\$?|\$?\bℕ\s*\^\s*\*|\$?\bN\s*\^\s*\*/g, 'ℕ*')
    .replace(/\\?mathbb\s*\{\s*R\s*\}\s*(?:\^\s*(?:\*|\\ast|\{?\*\}?|\{?\\ast\}?)|_\s*0|\*)|\$?\bℝ\s*\*\$?|\$?\bℝ\s*\^\s*\*|\$?\bR\s*\^\s*\*/g, 'ℝ*')
    .replace(/\\?mathbb\s*\{\s*Z\s*\}\s*(?:\^\s*(?:\*|\\ast|\{?\*\}?|\{?\\ast\}?)|_\s*0|\*)|\$?\bℤ\s*\*\$?|\$?\bℤ\s*\^\s*\*|\$?\bZ\s*\^\s*\*/g, 'ℤ*')
    .replace(/\\?mathbb\s*\{\s*Q\s*\}\s*(?:\^\s*(?:\*|\\ast|\{?\*\}?|\{?\\ast\}?)|_\s*0|\*)|\$?\bℚ\s*\*\$?|\$?\bℚ\s*\^\s*\*|\$?\bQ\s*\^\s*\*/g, 'ℚ*')
    .replace(/\\?mathbb\s*\{\s*N\s*\}|\$?\bℕ(?!\*)\$?|\bmathbb\s*N\b/g, 'ℕ')
    .replace(/\\?mathbb\s*\{\s*R\s*\}|\$?\bℝ(?!\*)\$?|\bmathbb\s*R\b/g, 'ℝ')
    .replace(/\\?mathbb\s*\{\s*Z\s*\}|\$?\bℤ(?!\*)\$?|\bmathbb\s*Z\b/g, 'ℤ')
    .replace(/\\?mathbb\s*\{\s*Q\s*\}|\$?\bℚ(?!\*)\$?|\bmathbb\s*Q\b/g, 'ℚ')
    .replace(/\\?mathbb\s*\{\s*I\s*\}|\$?\b𝕀\$?|\bmathbb\s*I\b/g, '𝕀')
    .replace(/\\?mathbb\s*\{\s*C\s*\}|\$?\bℂ\$?|\bmathbb\s*C\b/g, 'ℂ')
    .replace(/\\?mathbb\s*\{\s*\}/gi, 'ℕ')
    .replace(/\\mathbb(?![a-zA-Z{])/g, 'ℕ')
    .replace(/\\begin\s*\{\s*(?:aligned|align\*?|split|gather\*?)\s*\}/gi, '')
    .replace(/\\end\s*\{\s*(?:aligned|align\*?|split|gather\*?)\s*\}/gi, '')
    .replace(/\\\\\s*&/g, ' ')
    .replace(/\\\\/g, ' ')
    .replace(/&/g, '')
    .replace(/\\left\./g, '')
    .replace(/\\right\./g, '')
    .replace(/\\left\s*([(\[{|])/g, '$1')
    .replace(/\\right\s*([)\]}|])/g, '$1')
    .replace(/\\left\s*\\([{}])/g, '$1')
    .replace(/\\right\s*\\([{}])/g, '$1')
    .replace(/\\left\b/g, '')
    .replace(/\\right\b/g, '')
    .replace(/\\([,;:! ])/g, ' ')
    .replace(/\\+(?=[ \t.,;:!?)\\}\\]]|$)/g, '');

  const children: XmlComponent[] = [];
  let i = 0;

  // Pre-normalize slash fractions e.g. -1/4y^2z^3 -> -\dfrac{1}{4}y^2z^3, 1/2x -> \dfrac{1}{2}x
  // STRICTLY PREVENT matching dates (e.g. 16/08/2026) or official circular numbers
  s = s.replace(/(?<![$\w\/\-])([+-]?\d+)\/(\d+)(?!\d)(?!\/\d|\/[A-Za-zÀ-ỹ])\s*([xyzabctuvmn](?:[0-9_]*|\^[0-9a-zA-Z]+|\^\{[^{}]+\})*)?/g, (_m, num, den, vars) => {
    const isNeg = num.startsWith("-");
    const absNum = isNeg ? num.substring(1) : (num.startsWith("+") ? num.substring(1) : num);
    const prefix = isNeg ? "-\\dfrac" : "\\dfrac";
    return `${prefix}{${absNum}}{${den}}${vars ? ' ' + vars : ''}`;
  });

  function flushText(txt: string) {
    if (!txt) return;
    const cleaned = txt
      .replace(/\\square\b|\\Box\b/gi, '□')
      .replace(/\\blacksquare\b/gi, '■')
      .replace(/\\dots\b|\\cdots\b|\\ldots\b/g, '...')
      .replace(/\\circ\b|\\degree\b/g, '°')
      .replace(/\\pm\b/g, ' ± ')
      .replace(/\\mp\b/g, ' ∓ ')
      .replace(/\\times\b/g, '×')
      .replace(/\\cdot\b/g, ' . ')
      .replace(/·/g, ' . ')
      .replace(/\u22C5/g, ' . ')
      .replace(/\\div\b/g, ' ÷ ')
      .replace(/\\le\b|\\leq\b/g, ' ≤ ')
      .replace(/\\ge\b|\\geq\b/g, ' ≥ ')
      .replace(/\\ne\b|\\neq\b/g, ' ≠ ')
      .replace(/\\approx\b/g, ' ≈ ')
      .replace(/\\sim\b/g, ' ∼ ')
      .replace(/\\cong\b/g, ' ≅ ')
      .replace(/\\perp\b/g, ' ⊥ ')
      .replace(/\\parallel\b/g, ' ∥ ')
      .replace(/\\triangle\b/g, ' △ ')
      .replace(/\\in\b/g, ' ∈ ')
      .replace(/\\notin\b/g, ' ∉ ')
      .replace(/\\subset\b/g, ' ⊂ ')
      .replace(/\\subseteq\b/g, ' ⊆ ')
      .replace(/\\cap\b/g, ' ∩ ')
      .replace(/\\cup\b/g, ' ∪ ')
      .replace(/\\setminus\b/g, ' \\ ')
      .replace(/\\varnothing\b|\\emptyset\b/g, ' ∅ ')
      .replace(/\\infty\b/g, ' ∞ ')
      .replace(/\\mathbb(?:\s*\{\s*\}\s*(?:\^\s*(?:\*|\\ast|\{?\*\}?|\{?\\ast\}?)|\^)|\s*\{\s*\^\s*\*?\s*\}|\s*\^\s*(?:\*|\\ast|\{?\*\}?|\{?\\ast\}?)|\s*\^|\s*\\\^)/gi, 'ℕ*')
      .replace(/\\mathbb\{R\}/g, 'ℝ')
      .replace(/\\mathbb\{N\}\*/g, 'ℕ*')
      .replace(/\\mathbb\{N\}/g, 'ℕ')
      .replace(/\\mathbb\{Z\}/g, 'ℤ')
      .replace(/\\mathbb\{Q\}/g, 'ℚ')
      .replace(/\\mathbb\{C\}/g, 'ℂ')
      .replace(/\\mathbb(?![a-zA-Z{])/g, 'ℕ')
      .replace(/\\alpha\b/g, 'α')
      .replace(/\\beta\b/g, 'β')
      .replace(/\\gamma\b/g, 'γ')
      .replace(/\\pi\b/g, 'π')
      .replace(/\\theta\b/g, 'θ')
      .replace(/\\Rightarrow\b|\\implies\b|\\Longrightarrow\b/g, ' ⇒ ')
      .replace(/\\Leftarrow\b|\\Longleftarrow\b/g, ' ⇐ ')
      .replace(/\\Leftrightarrow\b|\\iff\b|\\Longleftrightarrow\b/g, ' ⇔ ')
      .replace(/\\to\b|\\rightarrow\b|\\longrightarrow\b/g, ' → ')
      .replace(/\\leftarrow\b|\\longleftarrow\b/g, ' ← ')
      .replace(/\\leftrightarrow\b/g, ' ↔ ')
      .replace(/\\mapsto\b/g, ' ↦ ')
      .replace(/\\angle\b/gi, ' ∠ ')
      .replace(/\\measuredangle\b/gi, ' ∡ ')
      .replace(/\\forall\b/g, ' ∀ ')
      .replace(/\\exists\b/g, ' ∃ ')
      .replace(/\\nexists\b/g, ' ∄ ')
      .replace(/\\equiv\b/g, ' ≡ ')
      .replace(/\\vee\b/g, ' ∨ ')
      .replace(/\\wedge\b/g, ' ∧ ')
      .replace(/\\left\b/g, '')
      .replace(/\\right\b/g, '')
      .replace(/\\([,;:! ])/g, ' ')
      .replace(/\\+(?=[ \t.,;:!?)\\}\\]]|$)/g, '')
      .replace(/\\quad\b/g, '   ')
      .replace(/\\qquad\b/g, '      ');

    // Tokenize into variables (italics) vs numbers/operators/punctuation/spaces (upright normal)
    const tokens = cleaned.split(/([a-zA-Z]+|[0-9]+(?:,[0-9]+)?|[^\sa-zA-Z0-9]+|\s+)/g);
    for (const tok of tokens) {
      if (!tok) continue;
      if (/^[a-zA-Z]+$/.test(tok)) {
        // Upright functions and physical units
        if (/^(?:sin|cos|tan|cot|arcsin|arccos|arctan|ln|log|lg|exp|lim|det|gcd|lcm|min|max|deg|dim|ucln|bcnn|cm|mm|dm|m|km|g|kg|h|s|min|rad|ha|l|ml|kV|V|A|mA|W|kW|J|kJ|N|Pa)$/i.test(tok)) {
          children.push(new StyledMathRun(tok, { normal: true }));
        } else {
          children.push(new StyledMathRun(tok, { normal: false }));
        }
      } else {
        // Numbers, operators, punctuation, arrows, symbols:
        // In Cambria Math, numbers and operators are natively upright.
        // DO NOT set normal: true (<m:nor/>), as <m:nor/> forces Word to look up glyphs in Times New Roman,
        // causing missing-glyph square box substitution errors for ⋅, ⇒, ⇔, □, ∈, etc.!
        children.push(new StyledMathRun(tok, { normal: false }));
      }
    }
  }

  let textBuffer = '';

  while (i < s.length) {
    // 0. Text blocks: \text{...}, \mathrm{...}, \textrm{...}, \textsf{...}, \textbf{...}, \mathbf{...}
    const textCmdMatch = /^\\(?:text|mathrm|textrm|textsf|textbf|mathbf)\b/.exec(s.substring(i));
    if (textCmdMatch) {
      flushText(textBuffer);
      textBuffer = '';
      const afterCmd = i + textCmdMatch[0].length;
      const textB = extractBalancedBlock(s, afterCmd, '{', '}');
      if (textB) {
        const isBold = /bold/.test(textCmdMatch[0]);
        children.push(new StyledMathRun(textB.content, { normal: true, bold: isBold }));
        i = textB.endIndex;
        continue;
      }
    }

    // 1. Fractions: \frac, \dfrac, \cfrac, \tfrac
    const fracMatch = /^\\(?:d|c|t)?frac\b/.exec(s.substring(i));
    if (fracMatch) {
      flushText(textBuffer);
      textBuffer = '';
      const afterFrac = i + fracMatch[0].length;
      const numB = extractBalancedBlock(s, afterFrac, '{', '}');
      if (numB) {
        const denB = extractBalancedBlock(s, numB.endIndex, '{', '}');
        if (denB) {
          const numChildren = parseLatexMathToDocx(numB.content);
          const denChildren = parseLatexMathToDocx(denB.content);
          children.push(
            new MathFraction({
              numerator: numChildren.length > 0 ? numChildren : [new StyledMathRun('', { normal: true })],
              denominator: denChildren.length > 0 ? denChildren : [new StyledMathRun('', { normal: true })]
            })
          );
          i = denB.endIndex;
          continue;
        }
      }
    }

    // 2. Radicals: \sqrt[degree]{radicand}, \sqrt{radicand}, \sqrt 5, √5, √xy, √(1+x)
    const sqrtMatch = /^(\\sqrt\b|√)/.exec(s.substring(i));
    if (sqrtMatch) {
      flushText(textBuffer);
      textBuffer = '';
      let afterSqrt = i + sqrtMatch[0].length;
      let degree: XmlComponent[] | undefined = undefined;
      while (afterSqrt < s.length && /\s/.test(s[afterSqrt])) afterSqrt++;
      if (s[afterSqrt] === '[') {
        const degB = extractBalancedBlock(s, afterSqrt, '[', ']');
        if (degB) {
          degree = parseLatexMathToDocx(degB.content);
          afterSqrt = degB.endIndex;
        }
      }
      while (afterSqrt < s.length && /\s/.test(s[afterSqrt])) afterSqrt++;
      let radContent = '';
      let radEndIndex = afterSqrt;
      if (s[afterSqrt] === '{') {
        const radB = extractBalancedBlock(s, afterSqrt, '{', '}');
        if (radB) {
          radContent = radB.content;
          radEndIndex = radB.endIndex;
        }
      } else if (s[afterSqrt] === '(') {
        const parenB = extractBalancedBlock(s, afterSqrt, '(', ')');
        if (parenB) {
          radContent = parenB.content;
          radEndIndex = parenB.endIndex;
        }
      } else {
        const atomMatch = /^[0-9]+|^[a-zA-Z]+/.exec(s.substring(afterSqrt));
        if (atomMatch) {
          radContent = atomMatch[0];
          radEndIndex = afterSqrt + atomMatch[0].length;
        }
      }

      if (!radContent) {
        let nextCharIdx = afterSqrt;
        while (nextCharIdx < s.length && /\s/.test(s[nextCharIdx])) nextCharIdx++;
        if (nextCharIdx < s.length) {
          radContent = s[nextCharIdx];
          radEndIndex = nextCharIdx + 1;
        } else {
          radContent = '';
          radEndIndex = afterSqrt;
        }
      }
      const radChildren = radContent ? parseLatexMathToDocx(radContent) : [new StyledMathRun('', { normal: true })];
      children.push(
        new MathRadical({
          children: radChildren.length > 0 ? radChildren : [new StyledMathRun('', { normal: true })],
          degree: degree
        })
      );
      i = radEndIndex;
      continue;
    }

    // 3. Angles: \widehat{...}, \widecheck{...}, \hat{...}
    const hatMatch = /^\\(?:widehat|widecheck|hat)\b/.exec(s.substring(i));
    if (hatMatch) {
      flushText(textBuffer);
      textBuffer = '';
      const afterHat = i + hatMatch[0].length;
      const hatB = extractBalancedBlock(s, afterHat, '{', '}');
      if (hatB) {
        children.push(new MathAccent(hatB.content.trim()));
        i = hatB.endIndex;
        continue;
      }
    }

    // 4. Vectors: \vec{...}, \overrightarrow{...}
    const vecMatch = /^\\(?:vec|overrightarrow)\b/.exec(s.substring(i));
    if (vecMatch) {
      flushText(textBuffer);
      textBuffer = '';
      const afterVec = i + vecMatch[0].length;
      const vecB = extractBalancedBlock(s, afterVec, '{', '}');
      if (vecB) {
        children.push(new MathVecAccent(vecB.content.trim()));
        i = vecB.endIndex;
        continue;
      }
    }

    // 4.5. Parenthesized or bracketed blocks with or without exponents: (...) or [...]
    // Handles: \left(\dfrac{1}{2}\right)^2, (-2)^3, (0,5)^3, \left[(-2) \cdot \dfrac{1}{2}\right], [4 \cdot (-2)]
    if (s[i] === '(' || s[i] === '[') {
      const openChar = s[i];
      const closeChar = openChar === '(' ? ')' : ']';
      const parenBlock = extractBalancedBlock(s, i, openChar, closeChar);
      if (parenBlock) {
        let afterParen = parenBlock.endIndex;
        while (afterParen < s.length && /\s/.test(s[afterParen])) {
          afterParen++;
        }

        // Check if immediately followed by superscript ^
        if (afterParen < s.length && s[afterParen] === '^') {
          flushText(textBuffer);
          textBuffer = '';
          const innerChildren = parseLatexMathToDocx(parenBlock.content);
          const baseChildren: XmlComponent[] = [
            new StyledMathRun(openChar, { normal: true }),
            ...(innerChildren.length > 0 ? innerChildren : [new StyledMathRun('', { normal: true })]),
            new StyledMathRun(closeChar, { normal: true })
          ];

          let supChildren: XmlComponent[] = [];
          let nextI = afterParen + 1;
          if (s[nextI] === '{') {
            const supB = extractBalancedBlock(s, nextI, '{', '}');
            if (supB) {
              const cleanSup = supB.content.replace(/\\square\b|\\Box\b/gi, '□').replace(/\\blacksquare\b/gi, '■');
              supChildren = parseLatexMathToDocx(cleanSup);
              nextI = supB.endIndex;
            }
          } else if (s.substring(nextI).startsWith('\\circ')) {
            supChildren = [new StyledMathRun('°', { normal: true })];
            nextI += 5;
          } else if (nextI < s.length && /[0-9a-zA-Z]/.test(s[nextI])) {
            const supMatch = /^[0-9]+|^[a-zA-Z]+/.exec(s.substring(nextI));
            if (supMatch) {
              const supVal = supMatch[0];
              supChildren = [new StyledMathRun(supVal, { normal: /^[0-9]+$/.test(supVal) })];
              nextI += supVal.length;
            }
          }

          children.push(
            new MathSuperScript({
              children: baseChildren,
              superScript: supChildren.length > 0 ? supChildren : [new StyledMathRun('', { normal: true })]
            })
          );
          i = nextI;
          continue;
        }

        // Check if immediately followed by subscript _
        if (afterParen < s.length && s[afterParen] === '_') {
          flushText(textBuffer);
          textBuffer = '';
          const innerChildren = parseLatexMathToDocx(parenBlock.content);
          const baseChildren: XmlComponent[] = [
            new StyledMathRun(openChar, { normal: true }),
            ...(innerChildren.length > 0 ? innerChildren : [new StyledMathRun('', { normal: true })]),
            new StyledMathRun(closeChar, { normal: true })
          ];

          let subChildren: XmlComponent[] = [];
          let nextI = afterParen + 1;
          if (s[nextI] === '{') {
            const subB = extractBalancedBlock(s, nextI, '{', '}');
            if (subB) {
              const cleanSub = subB.content.replace(/\\square\b|\\Box\b/gi, '□').replace(/\\blacksquare\b/gi, '■');
              subChildren = parseLatexMathToDocx(cleanSub);
              nextI = subB.endIndex;
            }
          } else if (nextI < s.length && /[0-9a-zA-Z]/.test(s[nextI])) {
            subChildren = [new StyledMathRun(s[nextI], { normal: /[0-9]/.test(s[nextI]) })];
            nextI += 1;
          }

          children.push(
            new MathSubScript({
              children: baseChildren,
              subScript: subChildren.length > 0 ? subChildren : [new StyledMathRun('', { normal: true })]
            })
          );
          i = nextI;
          continue;
        }

        // If block contains LaTeX markup, fractions, radicals, or dots, parse its contents
        if (parenBlock.content.includes('\\') || parenBlock.content.includes('/') || parenBlock.content.includes('^') || parenBlock.content.includes('·') || parenBlock.content.includes('*') || parenBlock.content.includes('.')) {
          flushText(textBuffer);
          textBuffer = '';
          const innerChildren = parseLatexMathToDocx(parenBlock.content);
          children.push(new StyledMathRun(openChar, { normal: true }));
          children.push(...innerChildren);
          children.push(new StyledMathRun(closeChar, { normal: true }));
          i = parenBlock.endIndex;
          continue;
        }
      }
    }

    // 5. Superscript / Exponent ^
    // Supports both bracketed ^{...} and single-character exponents ^2, ^3, ^y, ^\circ
    if (s[i] === '^') {
      let baseChild: XmlComponent;
      if (textBuffer.trimEnd().length > 0) {
        const trailing = extractTrailingAtom(textBuffer);
        if (trailing.before) {
          flushText(trailing.before);
        }
        if (trailing.atom.startsWith('(') && trailing.atom.endsWith(')')) {
          const innerAtom = trailing.atom.slice(1, -1).trim();
          baseChild = new StyledMathRun(`(${innerAtom.replace(/\\cdot/g, ' . ').replace(/·/g, ' . ').replace(/\u22C5/g, ' . ').replace(/\\times/g, '×')})`, { normal: false });
        } else if (trailing.atom.startsWith('[') && trailing.atom.endsWith(']')) {
          const innerAtom = trailing.atom.slice(1, -1).trim();
          baseChild = new StyledMathRun(`[${innerAtom.replace(/\\cdot/g, ' . ').replace(/·/g, ' . ').replace(/\u22C5/g, ' . ').replace(/\\times/g, '×')}]`, { normal: false });
        } else {
          const isNum = /^[0-9]+$/.test(trailing.atom);
          baseChild = new StyledMathRun(trailing.atom, { normal: isNum });
        }
        textBuffer = '';
      } else if (children.length > 0) {
        baseChild = children.pop()!;
      } else {
        baseChild = new StyledMathRun(' ', { normal: true });
      }

      let supChildren: XmlComponent[] = [];
      let nextI = i + 1;

      if (s[nextI] === '{') {
        const supB = extractBalancedBlock(s, nextI, '{', '}');
        if (supB) {
          const cleanSup = supB.content.replace(/\\square\b|\\Box\b/gi, '□').replace(/\\blacksquare\b/gi, '■');
          supChildren = parseLatexMathToDocx(cleanSup);
          nextI = supB.endIndex;
        }
      } else if (s.substring(nextI).startsWith('\\circ')) {
        supChildren = [new StyledMathRun('°', { normal: true })];
        nextI += 5;
      } else if (nextI < s.length && /[0-9a-zA-Z]/.test(s[nextI])) {
        const supMatch = /^[0-9]+|^[a-zA-Z]+/.exec(s.substring(nextI));
        if (supMatch) {
          const supVal = supMatch[0];
          supChildren = [new StyledMathRun(supVal, { normal: /^[0-9]+$/.test(supVal) })];
          nextI += supVal.length;
        }
      }

      if (supChildren.length > 0) {
        children.push(
          new MathSuperScript({
            children: [baseChild],
            superScript: supChildren
          })
        );
        i = nextI;
        continue;
      }
    }

    // 6. Subscript _
    // Supports both bracketed _{...} and single-character subscripts _1, _2, _n
    if (s[i] === '_') {
      let baseChild: XmlComponent;
      if (textBuffer.trimEnd().length > 0) {
        const trailing = extractTrailingAtom(textBuffer);
        if (trailing.before) {
          flushText(trailing.before);
        }
        if (trailing.atom.startsWith('(') && trailing.atom.endsWith(')')) {
          const innerAtom = trailing.atom.slice(1, -1).trim();
          baseChild = new StyledMathRun(`(${innerAtom.replace(/\\cdot/g, ' . ').replace(/·/g, ' . ').replace(/\u22C5/g, ' . ').replace(/\\times/g, '×')})`, { normal: false });
        } else if (trailing.atom.startsWith('[') && trailing.atom.endsWith(']')) {
          const innerAtom = trailing.atom.slice(1, -1).trim();
          baseChild = new StyledMathRun(`[${innerAtom.replace(/\\cdot/g, ' . ').replace(/·/g, ' . ').replace(/\u22C5/g, ' . ').replace(/\\times/g, '×')}]`, { normal: false });
        } else {
          const isNum = /^[0-9]+$/.test(trailing.atom);
          baseChild = new StyledMathRun(trailing.atom, { normal: isNum });
        }
        textBuffer = '';
      } else if (children.length > 0) {
        baseChild = children.pop()!;
      } else {
        baseChild = new StyledMathRun(' ', { normal: true });
      }

      let subChildren: XmlComponent[] = [];
      let nextI = i + 1;

      if (s[nextI] === '{') {
        const subB = extractBalancedBlock(s, nextI, '{', '}');
        if (subB) {
          const cleanSub = subB.content.replace(/\\square\b|\\Box\b/gi, '□').replace(/\\blacksquare\b/gi, '■');
          subChildren = parseLatexMathToDocx(cleanSub);
          nextI = subB.endIndex;
        }
      } else if (nextI < s.length && /[0-9a-zA-Z]/.test(s[nextI])) {
        const subMatch = /^[0-9]+|^[a-zA-Z]+/.exec(s.substring(nextI));
        if (subMatch) {
          const subVal = subMatch[0];
          subChildren = [new StyledMathRun(subVal, { normal: /^[0-9]+$/.test(subVal) })];
          nextI += subVal.length;
        }
      }

      if (subChildren.length > 0) {
        children.push(
          new MathSubScript({
            children: [baseChild],
            subScript: subChildren
          })
        );
        i = nextI;
        continue;
      }
    }

    textBuffer += s[i];
    i++;
  }

  flushText(textBuffer);
  return children;
}

/**
 * Parses LaTeX fractions (\frac, \dfrac, \tfrac, \cfrac) with balanced braces for plain text fallback.
 * Strictly avoids vulgar fraction characters (½, ⅓, ⅛) to respect textbook standard.
 */
function parseLatexFractions(input: string): string {
  let res = input;
  const fracRegex = /(?:\\|\b)(?:d|t|c)?frac\b/gi;
  let match: RegExpExecArray | null;
  let safety = 0;

  while ((match = fracRegex.exec(res)) !== null && safety < 100) {
    safety++;
    const matchStart = match.index;
    const afterMacro = matchStart + match[0].length;

    const numBlock = extractBalancedBlock(res, afterMacro, '{', '}');
    if (!numBlock) {
      fracRegex.lastIndex = afterMacro;
      continue;
    }

    const denBlock = extractBalancedBlock(res, numBlock.endIndex, '{', '}');
    if (!denBlock) {
      fracRegex.lastIndex = numBlock.endIndex;
      continue;
    }

    const cleanNum = parseLatexFractions(numBlock.content.trim());
    const cleanDen = parseLatexFractions(denBlock.content.trim());

    // Clean division representation for plain text fallback
    const needsParenNum = /[\s\+\-\*\/=]/.test(cleanNum) && !(cleanNum.startsWith('(') && cleanNum.endsWith(')'));
    const needsParenDen = /[\s\+\-\*\/=]/.test(cleanDen) && !(cleanDen.startsWith('(') && cleanDen.endsWith(')'));
    const nStr = needsParenNum ? `(${cleanNum})` : cleanNum;
    const dStr = needsParenDen ? `(${cleanDen})` : cleanDen;
    const fracStr = `${nStr}/${dStr}`;

    res = res.substring(0, matchStart) + fracStr + res.substring(denBlock.endIndex);
    fracRegex.lastIndex = 0;
  }

  return res;
}

/**
 * Recursively parses LaTeX radicals and roots (\sqrt, \sqrt[n], \cbrt) with balanced braces.
 * Supports standard square root, n-th roots, cube roots, nested radicals, and radical expressions containing fractions.
 */
function parseLaTeXRoots(input: string): string {
  let res = input;
  const sqrtRegex = /(?:\\|\b)(?:sqrt|cbrt)\b/gi;
  let match: RegExpExecArray | null;
  let safety = 0;

  while ((match = sqrtRegex.exec(res)) !== null && safety < 100) {
    safety++;
    const matchStart = match.index;
    const macro = match[0].toLowerCase();
    let afterMacro = matchStart + match[0].length;

    let degree = macro.includes('cbrt') ? '3' : '';
    let startOfRadicand = afterMacro;
    while (startOfRadicand < res.length && /\s/.test(res[startOfRadicand])) startOfRadicand++;

    if (!degree && startOfRadicand < res.length && res[startOfRadicand] === '[') {
      const degreeBlock = extractBalancedBlock(res, startOfRadicand, '[', ']');
      if (degreeBlock) {
        degree = degreeBlock.content.trim();
        afterMacro = degreeBlock.endIndex;
      }
    }

    const radicandBlock = extractBalancedBlock(res, afterMacro, '{', '}');
    if (!radicandBlock) {
      sqrtRegex.lastIndex = afterMacro;
      continue;
    }

    const cleanRadicand = parseLaTeXRoots(radicandBlock.content.trim());
    let degreePrefix = '√';
    if (degree === '2' || !degree) {
      degreePrefix = '√';
    } else {
      degreePrefix = `${toSuperscript(degree)}√`;
    }

    let rootStr = '';
    // Clean atom detection: simple numbers (2, 10, 0,5), simple variables (x, y, x_1), vulgar fractions (½), or already bracketed
    const isSimpleAtom =
      /^[0-9]+([,.][0-9]+)?$/.test(cleanRadicand) ||
      /^[A-Za-zΑ-Ωα-ω](?:_[0-9A-Za-z]+)?$/.test(cleanRadicand) ||
      /^[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]$/.test(cleanRadicand) ||
      (cleanRadicand.startsWith('(') && cleanRadicand.endsWith(')'));

    if (isSimpleAtom) {
      rootStr = `${degreePrefix}${cleanRadicand}`;
    } else {
      rootStr = `${degreePrefix}(${cleanRadicand})`;
    }

    res = res.substring(0, matchStart) + rootStr + res.substring(radicandBlock.endIndex);
    sqrtRegex.lastIndex = 0;
  }

  return res;
}

/**
 * Converts raw LaTeX math expressions into clean readable Unicode characters for Word.
 */
function convertTeXToReadableUnicode(text: string): string {
  if (!text) return '';

  let s = text
    .replace(/\\begin\s*\{\s*(?:aligned|align\*?|split|gather\*?)\s*\}/gi, '')
    .replace(/\\end\s*\{\s*(?:aligned|align\*?|split|gather\*?)\s*\}/gi, '')
    .replace(/\\\\\s*&/g, ' ')
    .replace(/\\\\/g, ' ')
    .replace(/(?:^|[\s,;])&(?=\s*[\w\d=+\-*\(])/g, ' ')
    // Clean extra backslashes before spaces/punctuation:
    .replace(/\\([,;:! ])/g, ' ')
    .replace(/\\+(?=[ \t.,;:!?)\\}\\]]|$)/g, '')
    // Clean broken subscripts & underscores:
    .replace(/([a-zA-Z0-9$]+)[,;:]\s*_{([^{}]+)}/g, '$1, $2')
    .replace(/(^|[\s,;:(])_{([a-zA-Zà-ỹÀ-Ỹ\s]+)}/g, '$1$2')
    .replace(/_{([a-zA-Zà-ỹÀ-Ỹ\s]+)}/g, '$1')
    // Clean trailing asterisks (strictly preserve ℕ*, ℤ*, ℚ*, ℝ*, N* and bold **):
    .replace(/([.,;:!?])\s*(?<!\*)\*(?!\*)/g, '$1 ')
    .replace(/(?<![ℕℤℚℝN*])\*(?!\*)([.,;:!?])/g, '$1')
    .replace(/(?<![ℕℤℚℝN*])\*(?!\*)[ \t]*$/gm, '')
    .replace(/(?<=[a-zA-Zà-ỹÀ-Ỹ]{2,})\*(?!\*)(?=\s)/g, '');

  // 0. Normalize LaTeX command boundaries, spacing, and delimiters
  s = s
    .replace(/\\?left\s*([(\[{|])/gi, '$1')
    .replace(/\\?right\s*([)\]}|])/gi, '$1')
    .replace(/\\mathbb\s+\{/g, '\\mathbb{')
    .replace(/\\(in|notin|subset|supset|subseteq|supseteq|cap|cup|setminus|leq|geq|le\b|ge\b|neq|ne\b|approx|equiv|pm|mp|times|div|cdot)\\([a-zA-Z]+)/g, '\\$1 \\$2')
    .replace(/([0-9a-zA-Z_'\*]+)\\([a-zA-Z]+)/g, '$1 \\$2')
    .replace(/\\(in|notin|subset|supset|subseteq|supseteq|cap|cup|setminus|leq|geq|le\b|ge\b|neq|ne\b|approx|equiv|pm|mp|times|div|cdot)([0-9a-zA-Z_'\*]+)/g, '\\$1 $2');

  // 1. Fractions & Radicals (Iterative multi-pass to resolve nested roots and fractions cleanly)
  let prevS = '';
  let pass = 0;
  while (s !== prevS && pass < 6) {
    prevS = s;
    pass++;
    s = parseLatexFractions(s);
    s = parseLaTeXRoots(s);
  }

  // 2. Degrees, Angles, Vectors, Hats & Geometry
  s = s
    .replace(/\^\s*\{?\s*\\?circ\s*\}?/gi, '°')
    .replace(/\^\s*\{?\s*°\s*\}?/g, '°')
    .replace(/\^\s*\{?\s*[oO]\s*\}?\b/g, '°')
    .replace(/\\degree\b/gi, '°')
    .replace(/\\circ\b/gi, '°')
    .replace(/\^°/g, '°')
    .replace(/(?:\\|\b)widehat\s*\{([^}]+)\}/gi, (_m, inner) => convertAngleToUnicode(inner))
    .replace(/(?:\\|\b)widecheck\s*\{([^}]+)\}/gi, (_m, inner) => convertAngleToUnicode(inner))
    .replace(/(?:\\|\b)hat\s*\{([^}]+)\}/gi, (_m, inner) => convertAngleToUnicode(inner))
    .replace(/(?:\\|\b)widehat\s+([A-Za-z0-9]+)\b/gi, (_m, inner) => convertAngleToUnicode(inner))
    .replace(/(?:\\|\b)angle\s*\{?([A-Za-z0-9]+)\}?/gi, (_m, inner) => convertAngleToUnicode(inner))
    .replace(/\\angle\b/gi, '∠')
    .replace(/\\vec\s*\{([^}]+)\}/gi, '$1⃗')
    .replace(/\\overrightarrow\s*\{([^}]+)\}/gi, '$1⃗')
    .replace(/\\overline\s*\{([^}]+)\}/gi, '$1')
    .replace(/(?:\\|\b)triangle\s*\{?([A-Za-z0-9]+)\}?/gi, '△$1')
    .replace(/\\triangle\b/gi, '△')
    .replace(/\\perp\b/gi, '⊥')
    .replace(/\\parallel\b/gi, '∥')
    .replace(/\\cong\b/gi, '≅')
    .replace(/\\sim\b/gi, '∼');

  // 3. Greek Letters
  s = s
    .replace(/\\alpha\b/g, 'α')
    .replace(/\\beta\b/g, 'β')
    .replace(/\\gamma\b/g, 'γ')
    .replace(/\\delta\b/g, 'δ')
    .replace(/\\Delta\b/g, 'Δ')
    .replace(/\\pi\b/g, 'π')
    .replace(/\\theta\b/g, 'θ')
    .replace(/\\omega\b/g, 'ω')
    .replace(/\\Omega\b/g, 'Ω')
    .replace(/\\lambda\b/g, 'λ')
    .replace(/\\sigma\b/g, 'σ')
    .replace(/\\mu\b/g, 'μ')
    .replace(/\\epsilon\b/g, 'ε')
    .replace(/\\phi\b/g, 'φ')
    .replace(/\\rho\b/g, 'ρ')
    .replace(/\\tau\b/g, 'τ');

  // 4. Relations, Operators, Sets & Arrows
  s = s
    // Clean up broken/truncated mathbb^ and mathbb^* artifacts
    .replace(/\$?\s*\\?mathbb(?:\s*\{\s*\}\s*(?:\^\s*(?:\*|\\ast|\{?\*\}?|\{?\\ast\}?)|\^)|\s*\{\s*\^\s*\*?\s*\}|\s*\^\s*(?:\*|\\ast|\{?\*\}?|\{?\\ast\}?)|\s*\^|\s*\\\^)\s*\$?|\bmathbb\^/gi, 'ℕ*')
    .replace(/\$?\s*\\?mathbb\s*\{\s*\}\s*\$?/gi, 'ℕ')
    // Sets (mathbb and bold variants, with or without backslash or spaces or $)
    // CRITICAL: MUST BE CASE-SENSITIVE for single letters (N, Z, Q, R, I, C) so variables like z^4, n^2, r^2 are NEVER corrupted into ℤ*, ℕ*, ℝ*!
    // And the asterisk (*) MUST BE REQUIRED, never optional (\*?)!
    .replace(/\$?\s*\\?mathbb\s*\{\s*N\s*\}\s*(?:\^\s*(?:\*|\\ast|\{?\*\}?|\{?\\ast\}?)|_\s*0|\*)\s*\$?|\$?ℕ\s*\*\$?|\$?ℕ\s*\^\s*\*|\$?N\s*\^\s*\*/g, 'ℕ*')
    .replace(/\$?\s*\\?mathbb\s*\{\s*R\s*\}\s*(?:\^\s*(?:\*|\\ast|\{?\*\}?|\{?\\ast\}?)|_\s*0|\*)\s*\$?|\$?ℝ\s*\*\$?|\$?ℝ\s*\^\s*\*|\$?R\s*\^\s*\*/g, 'ℝ*')
    .replace(/\$?\s*\\?mathbb\s*\{\s*Z\s*\}\s*(?:\^\s*(?:\*|\\ast|\{?\*\}?|\{?\\ast\}?)|_\s*0|\*)\s*\$?|\$?ℤ\s*\*\$?|\$?ℤ\s*\^\s*\*|\$?Z\s*\^\s*\*/g, 'ℤ*')
    .replace(/\$?\s*\\?mathbb\s*\{\s*Q\s*\}\s*(?:\^\s*(?:\*|\\ast|\{?\*\}?|\{?\\ast\}?)|_\s*0|\*)\s*\$?|\$?ℚ\s*\*\$?|\$?ℚ\s*\^\s*\*|\$?Q\s*\^\s*\*/g, 'ℚ*')
    .replace(/\$?\s*\\?mathbb\s*\{\s*N\s*\}\s*\$?|\$?ℕ(?!\*)\$?|\bmathbb\s*N\b/g, 'ℕ')
    .replace(/\$?\s*\\?mathbb\s*\{\s*R\s*\}\s*\$?|\$?ℝ(?!\*)\$?|\bmathbb\s*R\b/g, 'ℝ')
    .replace(/\$?\s*\\?mathbb\s*\{\s*Z\s*\}\s*\$?|\$?ℤ(?!\*)\$?|\bmathbb\s*Z\b/g, 'ℤ')
    .replace(/\$?\s*\\?mathbb\s*\{\s*Q\s*\}\s*\$?|\$?ℚ(?!\*)\$?|\bmathbb\s*Q\b/g, 'ℚ')
    .replace(/\$?\s*\\?mathbb\s*\{\s*I\s*\}\s*\$?|\$?𝕀\$?|\bmathbb\s*I\b/g, '𝕀')
    .replace(/\$?\s*\\?mathbb\s*\{\s*C\s*\}\s*\$?|\$?ℂ\$?|\bmathbb\s*C\b/g, 'ℂ')
    .replace(/\\mathbb(?![a-zA-Z{])/g, 'ℕ')
    .replace(/\\?mathbf\s*\{\s*([NZQRIC])\s*\}/g, (_m, letter) => {
      const upper = letter.toUpperCase();
      if (upper === 'N') return 'ℕ';
      if (upper === 'Z') return 'ℤ';
      if (upper === 'Q') return 'ℚ';
      if (upper === 'I') return '𝕀';
      if (upper === 'C') return 'ℂ';
      return 'ℝ';
    })
    .replace(/\bmathbb\s*N\s*\*/g, 'ℕ*')
    .replace(/\bmathbb\s*N\b/g, 'ℕ')
    .replace(/\bmathbb\s*Z\s*\*/g, 'ℤ*')
    .replace(/\bmathbb\s*Z\b/g, 'ℤ')
    .replace(/\bmathbb\s*Q\s*\*/g, 'ℚ*')
    .replace(/\bmathbb\s*Q\b/g, 'ℚ')
    .replace(/\bmathbb\s*R\s*\*/g, 'ℝ*')
    .replace(/\bmathbb\s*R\b/g, 'ℝ')
    .replace(/\bmathbb\s*I\b/g, '𝕀')
    .replace(/\bmathbb\s*C\b/g, 'ℂ')
    // Decimals with {,}
    .replace(/([0-9])\{,\}([0-9])/g, '$1,$2')
    .replace(/\{,\}/g, ',')
    .replace(/\\leq\b|\\le\b/g, '≤')
    .replace(/\\geq\b|\\ge\b/g, '≥')
    .replace(/\\neq\b|\\ne\b/g, '≠')
    .replace(/\\approx\b/g, '≈')
    .replace(/\\equiv\b/g, '≡')
    .replace(/\\times\b/g, '×')
    .replace(/\\cdot\b/g, ' . ')
    .replace(/·/g, ' . ')
    .replace(/\u22C5/g, ' . ')
    .replace(/\\div\b/g, '÷')
    .replace(/\\pm\b/g, '±')
    .replace(/\\mp\b/g, '∓')
    .replace(/\\propto\b/g, '∝')
    .replace(/\\in\b/g, '∈')
    .replace(/\\notin\b/g, '∉')
    .replace(/\\subset\b/g, '⊂')
    .replace(/\\subseteq\b/g, '⊆')
    .replace(/\\supset\b/g, '⊃')
    .replace(/\\supseteq\b/g, '⊇')
    .replace(/\\cup\b/g, '∪')
    .replace(/\\cap\b/g, '∩')
    .replace(/\\setminus\b/g, '\\')
    .replace(/\\varnothing\b|\\emptyset\b/g, '∅')
    .replace(/\\infty\b/g, '∞')
    .replace(/\\forall\b/g, '∀')
    .replace(/\\exists\b/g, '∃')
    .replace(/\\nexists\b/g, '∄')
    .replace(/\\to\b|\\rightarrow\b|\\longrightarrow\b/g, '→')
    .replace(/\\Leftarrow\b|\\longleftarrow\b/g, '⇐')
    .replace(/\\Rightarrow\b|\\implies\b|\\Longrightarrow\b/g, '⇒')
    .replace(/\\Leftrightarrow\b|\\iff\b|\\Longleftrightarrow\b/g, '⇔')
    .replace(/\\leftrightarrow\b/g, '↔')
    .replace(/\\(dots|cdots|ldots)/g, '...');

  // 5. Common Superscripts & Subscripts
  const unicodeSupMap: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
    'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ', 'y': 'ʸ', 'm': 'ᵐ', 'k': 'ᵏ'
  };
  const unicodeSubMap: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
    'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ', 'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ', 'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ', 'v': 'ᵥ', 'x': 'ₓ'
  };

  s = s
    .replace(/\^\{([^{}]+)\}/g, (_m, inner) => inner.split('').map((c: string) => unicodeSupMap[c] || c).join(''))
    .replace(/\^([0-9nixymk])/g, (_m, c) => unicodeSupMap[c] || c)
    .replace(/_\{([^{}]+)\}/g, (_m, inner) => {
      const trimmed = inner.trim();
      if (/^(?:ta|ta có|các|đó|được)$/i.test(trimmed) || /[\sà-ỹÀ-Ỹ]/.test(trimmed)) {
        return ' ' + trimmed;
      }
      return trimmed.split('').map((c: string) => unicodeSubMap[c] || c).join('');
    })
    .replace(/_([0-9aehijklmnoprstuvx])/g, (_m, c) => unicodeSubMap[c] || c);

  // 6. Boxed fill-in questions: \boxed{?}, \boxed{\dots}, \boxed{...}, \square, \Box -> [ ? ], [ ... ]
  s = s
    .replace(/\\boxed\{([^\}]*)\}/g, ' [ $1 ] ')
    .replace(/\\boxed\s*\?\s*/g, ' [ ? ] ')
    .replace(/\\boxed\s*\\?\.\.\.\s*/g, ' [ ... ] ')
    .replace(/\\boxed\b/g, ' [ ? ] ')
    .replace(/\\square\b|\\Box\b/gi, ' [ ? ] ')
    .replace(/\\blacksquare\b/gi, ' [ ■ ] ');

  // 7. Set notation symbols: \mid, \vert, \{, \}
  s = s
    .replace(/\\mid\b/g, ' | ')
    .replace(/\\vert\b/g, ' | ')
    .replace(/\\\{/g, '{')
    .replace(/\\\}/g, '}');

  // 8. Remove inline TeX formatting tags like \text{...}, {text {...}}, \mathrm{...} WITHOUT consuming outer set braces
  s = s
    .replace(/\\text\s*\{([^{}]+)\}/gi, ' $1 ')
    .replace(/\{text\s*\{([^{}]+)\}\}/gi, ' $1 ')
    .replace(/\\mathrm\s*\{([^{}]+)\}/gi, ' $1 ')
    .replace(/\{mathrm\s*\{([^{}]+)\}\}/gi, ' $1 ')
    .replace(/\\(text|mathrm|mathbf|mathit|mathsf|mathtt)\{([^}]+)\}/gi, ' $2 ');

  // 8a. Auto-repair set notation missing opening brace `{`
  s = s.replace(/(^|[\s\n|>$\(,])([A-Za-z0-9_'\*]+)\s*=\s*(?!\s*\{)([^{}\n=$;]+;[^{}\n=$]*)\}/g, (_m, lead, setName, elements) => {
    return `${lead}${setName} = {${elements.trim()}}`;
  });

  // 9. Common mathematical function names
  s = s
    .replace(/\\(sin|cos|tan|cot|ln|log|lim|det|gcd|min|max)\b/g, ' $1 ');

  // 10. Clean up escaped or standard TeX commands while STRICTLY PRESERVING curly braces { and }
  s = s
    .replace(/\\left\s*([\{\(\[\|])/gi, '$1')
    .replace(/\\right\s*([\}\)\]\|])/gi, '$1')
    .replace(/\bleft\b|\bright\b/gi, '')
    .replace(/\\quad\b|\\qquad\b/g, ' ')
    .replace(/\\,/g, ' ')
    .replace(/\\;/g, ' ')
    .replace(/\\!/g, '')
    .replace(/\\([a-zA-Z]+)\b/g, ' $1 ')
    .replace(/\\([\{\}])/g, '$1')
    .replace(/\\/g, '')
    .replace(/\$([^\$\n]+)\$/g, '$1');

  // Final cleanup of degree artifacts and spacing
  s = s
    .replace(/\^\s*°/g, '°')
    .replace(/\^\s*\{°\}/g, '°')
    .replace(/\^\(°\)/g, '°')
    .replace(/[ \t]{2,}/g, ' ');

  return repairVietnameseText(s);
}

/**
 * Decodes base64 data URL into Uint8Array for docx ImageRun.
 */
function base64ToUint8Array(base64Str: string): Uint8Array | null {
  try {
    const cleanBase64 = base64Str.replace(/^data:image\/\w+;base64,/, '');
    const binaryString = atob(cleanBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (err) {
    console.warn('Base64 decode error for Word image:', err);
    return null;
  }
}

function buildOpeningHeaderTable(options: WordExportOptions, isLandscape = false): Table {
  let school = 'Trường THCS Phùng Khắc Khoan';
  let teacher = 'Giáo viên: Cấn Văn Trường';

  if (options.headerText) {
    if (options.headerText.includes('|')) {
      const parts = options.headerText.split('|');
      school = parts[0].trim();
      if (parts[1] && parts[1].toLowerCase().includes('giáo viên')) {
        teacher = parts[1].trim();
      }
    } else {
      school = options.headerText.trim();
    }
  }

  if (options.footerText && options.footerText.toLowerCase().includes('giáo viên') && !teacher) {
    teacher = options.footerText.trim();
  }

  school = repairVietnameseText(school);
  teacher = repairVietnameseText(teacher);

  const borderNone = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const totalW = isLandscape ? 14287 : 9070;
  const leftW = isLandscape ? 7500 : 4800;
  const rightW = totalW - leftW;

  return new Table({
    width: { size: totalW, type: WidthType.DXA },
    columnWidths: [leftW, rightW],
    borders: {
      top: borderNone,
      bottom: borderNone,
      left: borderNone,
      right: borderNone,
      insideHorizontal: borderNone,
      insideVertical: borderNone
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: leftW, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: school,
                    italics: true,
                    size: 24,
                    color: '000000',
                    font: 'Times New Roman'
                  })
                ]
              })
            ]
          }),
          new TableCell({
            width: { size: rightW, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: teacher.startsWith('Giáo viên') ? teacher : `Giáo viên: ${teacher}`,
                    italics: true,
                    size: 24,
                    color: '000000',
                    font: 'Times New Roman'
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

export function formatVietnameseDate(dateStr?: string): string {
  if (!dateStr || !dateStr.trim()) {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    return `${d}/${m}/${y}`;
  }
  const s = dateStr.trim();
  // ISO format YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  // DD-MM-YYYY or DD.MM.YYYY
  const dmMatch = s.match(/^(\d{1,2})[-.](\d{1,2})[-.](\d{4})$/);
  if (dmMatch) {
    const [, d, m, y] = dmMatch;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  // DD/MM/YYYY
  const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, d, m, y] = slashMatch;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  // Try parsing Date
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    const d = String(parsed.getDate()).padStart(2, '0');
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const y = parsed.getFullYear();
    return `${d}/${m}/${y}`;
  }
  return s;
}

export function stripIntroductoryChatter(content: string): string {
  if (!content) return '';
  let cleaned = content.trim();

  // Format any "Ngày soạn: YYYY-MM-DD" pattern into "Ngày soạn: DD/MM/YYYY"
  cleaned = cleaned.replace(/Ngày soạn:\s*(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/gi, (_, y, m, d) => {
    return `Ngày soạn: ${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  });

  // Preserve "Ngày soạn:" if it exists at the top
  const ngaySoanMatch = cleaned.match(/^Ngày soạn:\s*[^\n]*/i);

  // Preserve any "TIẾT ... " line near the top if it exists
  const tietHeaderMatch = cleaned.match(/(?:^|\n)\s*(?:\*\*)?(?:TIẾT|Tiết)\s+[\d,\s\-–]+(?:\*\*)?(?=\s*\n|$)/i);

  // 1. Find the real start of academic/pedagogical documents
  // (headings like #, TIẾT, <div align="center">, PHIẾU, TÓM TẮT, KẾ HOẠCH, MA TRẬN, BẢNG ĐẶC TẢ, ĐỀ KIỂM TRA, ĐỀ THI, ĐÁP ÁN, PHỤ LỤC, I. MỤC TIÊU, PHẦN, BÀI, CHỦ ĐỀ, SỞ GD, TRƯỜNG THCS, v.v.)
  const match = cleaned.match(
    /(?:^|\n)\s*(#+\s+|<div\s+align=["']center["']>|(?:\*\*)?(?:TIẾT|Tiết)\s+[\d,\s\-–]+|(?:\*\*)?BÀI\s+\d+|(?:KẾ HOẠCH BÀI DẠY|GIÁO ÁN|PHIẾU BÀI TẬP|PHIẾU HỌC TẬP|PHIẾU HƯỚNG DẪN|TÓM TẮT|MA TRẬN|BẢNG ĐẶC TẢ|ĐỀ KIỂM TRA|ĐỀ THI|ĐÁP ÁN|HƯỚNG DẪN CHẤM|PHỤ LỤC|I\.\s*MỤC TIÊU|I\.\s*KIẾN THỨC|PHẦN\s+[I|V|X|0-9]|CHỦ ĐỀ|SỞ\s+GD|TRƯỜNG\s+THCS|UBND|BỘ\s+GIÁO\s+DỤC)\b)/i
  );

  if (match && match.index !== undefined && match.index > 0) {
    const preamble = cleaned.slice(0, match.index).trim();
    // Only strip preamble if it contains conversational greetings, meta-commentary, or introductory remarks
    const isPreambleConversational = /tuyệt vời|chuyên gia sư phạm|tổ trưởng chuyên môn|trân trọng|xin trình bày|xin gửi|dưới đây là|chào bạn|chào thầy|chào cô|sau đây là|tôi xin|được thiết kế|tuân thủ|vì tệp|không có dữ liệu chữ thô|suy luận chủ đề|đây là một chủ đề|tôi sẽ dựa|tôi hiểu|rất vui/i.test(
      preamble
    );

    // NEVER strip preamble if it contains essential pedagogical headers (Ngày soạn, Tiết, Bài...)
    const hasEssentialPedagogicalData = /(?:Ngày soạn|TIẾT|Tiết|BÀI|Bài|<div)/i.test(preamble);

    if (isPreambleConversational && !hasEssentialPedagogicalData) {
      cleaned = cleaned.slice(match.index).trim();
    }
  } else {
    // Fallback: If no explicit uppercase heading matched, remove conversational preamble paragraphs from top
    const paragraphs = cleaned.split(/\n\s*\n/);
    let firstValidIdx = 0;
    for (let i = 0; i < Math.min(paragraphs.length, 4); i++) {
      const p = paragraphs[i].trim();
      if (
        /^(?:Tuyệt vời|Chào bạn|Chào Thầy|Chào Cô|Với vai trò|Kính gửi|Dưới đây là|Sau đây là|Tôi xin|Tôi là|Vì tệp|Do tệp|Tôi sẽ|Tôi giả định|Đây là một chủ đề|Để hỗ trợ)/i.test(
          p
        ) ||
        /chuyên gia sư phạm|tổ trưởng chuyên môn|không có dữ liệu chữ thô|suy luận chủ đề/i.test(p)
      ) {
        firstValidIdx = i + 1;
      } else {
        break;
      }
    }
    if (firstValidIdx > 0 && firstValidIdx < paragraphs.length) {
      cleaned = paragraphs.slice(firstValidIdx).join('\n\n').trim();
    }
  }

  // 2. Strip trailing conversational sign-offs or farewell chatter at the very end
  cleaned = cleaned
    .replace(
      /\n\s*(?:---|\*\*\*|===)?\s*\n\s*(?:(?:Hy vọng|Chúc|Mong|Nếu cần|Trên đây là|Rất hân hạnh|Thầy\/Cô|Thầy cô|Chúc các em)[^\n]*\s*)*$/i,
      ''
    )
    .trim();

  // If preamble had "Ngày soạn:", re-attach it at the top if it got removed
  if (ngaySoanMatch && !cleaned.toLowerCase().startsWith('ngày soạn:')) {
    cleaned = `${ngaySoanMatch[0]}\n\n${cleaned.trim()}`;
  }

  // If preamble had a top "TIẾT ... " header and it got lost, ensure it is restored before lesson title
  if (tietHeaderMatch && !cleaned.match(/(?:^|\n)\s*(?:\*\*)?(?:TIẾT|Tiết)\s+[\d,\s\-–]+/i)) {
    const tietClean = tietHeaderMatch[0].trim();
    if (cleaned.toLowerCase().startsWith('ngày soạn:')) {
      cleaned = cleaned.replace(/^(Ngày soạn:[^\n]*\n+)/i, `$1${tietClean}\n\n`);
    } else {
      cleaned = `${tietClean}\n\n${cleaned}`;
    }
  }

  // Remove leading horizontal rules or separators like "---", "===", "***"
  cleaned = cleaned.replace(/^(?:---|===\s*|\*\*\*\s*)+\s*/g, '').trim();

  return cleaned;
}

/**
 * Automatically repairs and guarantees standard 2-column CV 5512 tables for ALL periods (Tiết 1, Tiết 2, Tiết 3...)
 * Ensures no period loses its table columns, table headers, or table borders.
 */
export function autoRepairLessonPlanTables(markdown: string): string {
  if (!markdown) return '';

  // If the document is an Exam / Matrix / Test Specification / Rubric document (without 5512 lesson plan activities), return without modifying tables
  const isExamOrMatrixDoc = /(?:#+\s*(?:KHUNG\s+)?MA\s*TRẬN|#+\s*BẢNG\s*ĐẶC\s*TẢ|#+\s*ĐỀ\s*KIỂM\s*TRA|#+\s*ĐỀ\s*THI|#+\s*BẢNG\s*ĐÁP\s*ÁN|#+\s*HƯỚNG\s*DẪN\s*CHẤM)/i.test(markdown);
  const isLessonPlanDoc = /(?:I\.\s*MỤC\s*TIÊU|TIẾN\s*TRÌNH\s*DẠY\s*HỌC|KẾ\s*HOẠCH\s*BÀI\s*DẠY|HOẠT\s*ĐỘNG\s*HÌNH\s*THÀNH)/i.test(markdown);

  if (isExamOrMatrixDoc && !isLessonPlanDoc) {
    return normalizeVietnameseTerminology(markdown);
  }

  let text = normalizeVietnameseTerminology(markdown);
  text = repairAllLessonPlanTables(text);

  // 0. Ensure approval/signature block at the bottom is separated by a clear divider so it never merges with activity tables
  text = text.replace(/(?:\n\s*)*(\|\s*(?:\*\*)?(?:Duyệt của BGH|DUYỆT CỦA BAN GIÁM HIỆU|Xác nhận BGH|DUYỆT CỦA BGH|DUYỆT CỦA TỔ|TỔ TRƯỞNG CHUYÊN MÔN|NGƯỜI LẬP KẾ HOẠCH|GIÁO VIÊN SOẠN|HIỆU TRƯỞNG)[^|\n]*\|)/gi, '\n\n---\n\n$1');

  // 1. Standardize existing table header divider if missing
  text = text.replace(/(?:^|\n)\s*(?:\|?\s*Hoạt động của GV và HS\s*\|\s*Sản phẩm dự kiến\s*\|?)(?!\s*\n\s*\|?\s*:?-+:?\s*\|)/gi, () => {
    return `\n| **Hoạt động của GV và HS** | **Dự kiến sản phẩm** |\n| :--- | :--- |`;
  });

  // 2. Scan and repair ALL Tiết sections (TIẾT 1, TIẾT 2, TIẾT 3, etc., or single-period lesson plans)
  const sections = text.split(/(?=(?:^|\n)(?:#{1,4}\s*TIẾT\s+\d+|\*{0,2}(?<!(?:chi|họa|thời|bài|tình)\s*)(?<![a-zA-ZÀ-ỹ])TIẾT\s+\d+[:\s\.\-]|#{1,4}\s*Tiết\s+\d+|\*{0,2}(?<!(?:chi|họa|thời|bài|tình)\s*)(?<![a-zA-ZÀ-ỹ])Tiết\s+\d+[:\s\.\-]))/i);
  const repairedSections = sections.map((sec, idx) => {
    if (sections.length > 1 && idx === 0 && !/^\s*(?:#{1,4}\s*TIẾT|\*{0,2}(?<!(?:chi|họa|thời|bài|tình)\s*)(?<![a-zA-ZÀ-ỹ])TIẾT\s+\d+|#{1,4}\s*Tiết|\*{0,2}(?<!(?:chi|họa|thời|bài|tình)\s*)(?<![a-zA-ZÀ-ỹ])Tiết\s+\d+)/i.test(sec)) {
      return sec; // Preamble or Section I, II
    }

    // Check if this section is a matrix table or assessment table (must not be converted)
    const isMatrixSec = /(?:ma trận|bảng đặc tả|khung ma trận|nhận biết|thông hiểu|vận dụng cao|tnkq|trắc nghiệm|tự luận)/i.test(sec) && !/hoạt động của gv/i.test(sec);
    if (isMatrixSec) {
      return sec;
    }

    // Auto-inject **2. HOẠT ĐỘNG HÌNH THÀNH KIẾN THỨC MỚI** before Hoạt động 1 if missing in this section
    sec = sec.replace(/(\|[^|\n]*1\.\s*HOẠT\s*ĐỘNG\s*KHỞI\s*ĐỘNG[^|\n]*\|[^|\n]*\|\s*\n\s*\|[ \t]*)(?:\*\*)?(?:Hoạt\s*động\s*1[:\s\(]|Hoạt\s*động\s*khám\s*phá)/gi, '$1**2. HOẠT ĐỘNG HÌNH THÀNH KIẾN THỨC MỚI**<br/>**Hoạt động 1: ');
    sec = sec.replace(/(\*\*(?:1\.\s*)?HOẠT\s*ĐỘNG\s*KHỞI\s*ĐỘNG[^*]*\*\*[\s\S]*?\|[\s\S]*?\n\s*\|[ \t]*)(?!\*\*2\.\s*HOẠT\s*ĐỘNG)(?:\*\*)?(?:Hoạt\s*động\s*1[:\s\(])/gi, '$1**2. HOẠT ĐỘNG HÌNH THÀNH KIẾN THỨC MỚI**<br/>**Hoạt động 1: ');

    // Wrap broken table rows missing leading or trailing pipes (e.g. "Bước 1: ... | Sản phẩm ...")
    sec = sec.replace(/^[ \t]*(?!\s*\|)((?:\*\*)?(?:Bước\s*\d|B\d[:\.]|Hoạt\s*động\s*\d|[1-5]\.\s*HOẠT\s*ĐỘNG|[A-D]\.\s*HOẠT\s*ĐỘNG)[^|\n]+?\|[^|\n]+?)(?<!\|\s*)$/gmi, '| $1 |');

    // If an activity header sits outside pipes before a table row, wrap it as a table row
    sec = sec.replace(/(?:^|\n)[ \t]*(\*\*(?:[1-5]\.\s*HOẠT\s*ĐỘNG|HOẠT\s*ĐỘNG\s*(?:KHỞI\s*ĐỘNG|HÌNH\s*THÀNH|LUYỆN\s*TẬP|VẬN\s*DỤNG)|[A-D]\.\s*HOẠT\s*ĐỘNG)[^*]*\*\*)[ \t]*(?:\n[ \t]*)+(?=\|[ \t]*(?:\*\*)?(?:Hoạt\s*động|Bước\s*1|[1-5]\.\s*))/gi, '\n| $1 | |\n');

    // Check if this period contains activities
    const hasActivities = /(?:A|B|C|D)\.\s*HOẠT ĐỘNG|HOẠT ĐỘNG\s*(?:\d+|KHỞI ĐỘNG|HÌNH THÀNH|LUYỆN TẬP|VẬN DỤNG)|\*\*Hoạt động\s*\d+|Bước\s*1[:\.]|\*\*Bước\s*1/i.test(sec);
    const hasTablePipes = sec.includes('|');
    const hasHeaderRow = /Hoạt động của GV|Hoạt động dạy học/i.test(sec) && /Sản phẩm dự kiến|Dự kiến sản phẩm|Sản phẩm/i.test(sec);

    if (hasActivities) {
      if (!hasTablePipes) {
        // Non-table format: convert activities into a pristine 2-column table
        const lines = sec.split('\n');
        const headerLines: string[] = [];
        const restLines: string[] = [];
        let foundActivity = false;

        for (const line of lines) {
          if (!foundActivity && /(?:A|B|C|D)\.\s*HOẠT ĐỘNG|HOẠT ĐỘNG\s*(?:\d+|KHỞI ĐỘNG|HÌNH THÀNH|LUYỆN TẬP|VẬN DỤNG)|\*\*Hoạt động\s*\d+|Bước\s*1[:\.]|\*\*Bước\s*1/i.test(line)) {
            foundActivity = true;
          }
          if (foundActivity) {
            restLines.push(line);
          } else {
            headerLines.push(line);
          }
        }

        const rest = restLines.join('\n');
        const activityBlocks = rest.split(/(?=(?:^|\n)\s*(?:(?:\*\*)?(?:A|B|C|D)\.\s*HOẠT ĐỘNG|HOẠT ĐỘNG\s*(?:\d+|KHỞI ĐỘNG|HÌNH THÀNH|LUYỆN TẬP|VẬN DỤNG)|\*\*Hoạt động\s*\d+))/i);

        const newTableRows: string[] = [];
        newTableRows.push('| **Hoạt động của GV và HS** | **Dự kiến sản phẩm** |');
        newTableRows.push('| :--- | :--- |');

        for (const block of activityBlocks) {
          const trimmedBlock = block.trim();
          if (!trimmedBlock) continue;
          const productSplit = trimmedBlock.split(/(?=(?:^|\n)\s*(?:\*\*)?(?:Sản phẩm dự kiến|Dự kiến sản phẩm|Nội dung ghi vở|Sản phẩm học tập|Kết quả thực hiện|Sản phẩm)[:.]?)/i);
          let col1 = productSplit[0].trim().replace(/\n/g, '<br/>');
          let col2 = (productSplit[1] || 'Học sinh hoàn thành nhiệm vụ và ghi chép vào vở.').trim().replace(/\n/g, '<br/>');
          col1 = col1.replace(/\|/g, '\\vert ');
          col2 = col2.replace(/\|/g, '\\vert ');
          newTableRows.push(`| ${col1} | ${col2} |`);
        }

        return `${headerLines.join('\n').trim()}\n\n${newTableRows.join('\n')}\n`;
      } else if (!hasHeaderRow) {
        // Has table rows with '|' but missing the header row: insert header right before the first table row (only if 2-3 cols)
        const lines = sec.split('\n');
        const resultLines: string[] = [];
        let headerInserted = false;

        for (const line of lines) {
          if (!headerInserted && line.trim().startsWith('|') && !line.trim().startsWith('|---') && !line.trim().startsWith('|:---')) {
            const colCount = line.split('|').map(p => p.trim()).filter(Boolean).length;
            if (colCount <= 3 && !/(?:nhận biết|thông hiểu|vận dụng cao|tnkq|tự luận|tỉ lệ)/i.test(line)) {
              resultLines.push('| **Hoạt động của GV và HS** | **Dự kiến sản phẩm** |');
              resultLines.push('| :--- | :--- |');
            }
            resultLines.push(line);
            headerInserted = true;
          } else {
            resultLines.push(line);
          }
        }
        return resultLines.join('\n');
      }
    }
    return sec;
  });
  text = repairedSections.join('\n\n');
  text = repairAllLessonPlanTables(text);

  return text;
}

export async function generateMarkdownWordBlob(
  markdownContent: string,
  options: WordExportOptions | string = {}
): Promise<Blob> {
  const normalizedOptions: WordExportOptions = typeof options === 'string' ? { fileName: options.endsWith('.docx') ? options : `${options}.docx` } : options;
  const {
    headerText,
    footerText,
    watermarkText,
    monHoc = '',
    lop = '',
    ngaySoan = '',
    showPageNumbers = true,
    fileName = 'Ke_Hoach_Bai_Day_THCS_Phung_Khac_Khoan.docx',
    isLandscape: explicitLandscape
  } = normalizedOptions;

  // Clean content: strip introductory conversational preambles, sanitize MathType TeX formulas, fix duplicate "BÀI:", replace "máy chiếu" with "máy tính, tivi", strip AI image prompt codes
  let cleanMarkdown = autoNormalizeVietnameseFont(
    normalizeVietnameseTerminology(
      autoRepairLessonPlanTables(
        sanitizeMathForVietnamese(stripIntroductoryChatter(markdownContent))
          .replace(/\*\*(?:Mô tả hình ảnh|Visual AI Prompt|Hình ảnh minh họa|Visual Prompt|Prompt Minh Họa|Prompt)\s*(?:\([^)]*\))?\s*:\*\*[\s\S]*?(?=\*\*(?:Lời dẫn|Lời thoại|Dialogue|Narrator|💡|Kiến thức|Bí kíp|Nhân vật|Phân cảnh|Phần cảnh)|###|##|$)/gi, '')
          .replace(/(?:^|\n)\s*(?:\*\*)?(?:Mô tả hình ảnh|Visual AI Prompt|Visual Prompt|Prompt Minh Họa|Prompt)\s*(?:\([^)]*\))?\s*(?:\*\*)?:?\s*[^\n]+(?:\n(?!\s*(?:Lời dẫn|Lời thoại|Dialogue|Narrator|💡|Kiến thức|Bí kíp|Nhân vật|Phân cảnh|Phần cảnh|###|##|\*\*))[^\n]+)*/gi, '')
          .replace(/\(Visual AI Prompt\)/gi, '')
          .replace(/\(Tấm truyện tranh giáo dục[^\)]*\)/gi, '')
          .replace(/\(Educational comic panel[^\)]*\)/gi, '')
          .replace(/\(Ảnh minh họa[^\)]*\)/gi, '')
          .replace(/<div\b[^>]*>/gi, '')
          .replace(/<\/div>/gi, '')
          .replace(/<center\b[^>]*>/gi, '')
          .replace(/<\/center>/gi, '')
          .replace(/^Kế hoạch bài dạy[^\n]*\n*/gim, '')
          .replace(/&nbsp;/gi, ' ')
          .replace(/&emsp;/gi, ' ')
          .replace(/&ensp;/gi, ' ')
          .replace(/&amp;/gi, '&')
          .replace(/&lt;/gi, '<')
          .replace(/&gt;/gi, '>')
          .replace(/BÀI:\s*BÀI\s*/gi, 'BÀI ')
          .replace(/BÀI:\s*Bài\s*/gi, 'BÀI ')
          .replace(/máy chiếu/gi, 'máy tính, tivi')
          .replace(/Máy chiếu/gi, 'Máy tính, tivi')
          .trim()
      )
    )
  );

  // Rebalance activity durations to match configured thoiluong (e.g. 35, 40, 45, 90 mins)
  const durationMatch = cleanMarkdown.match(/Thời\s*lượng\s*:\s*(\d+)\s*phút/i);
  const targetDuration = normalizedOptions.thoiluong
    ? parsePeriodDurationMinutes(normalizedOptions.thoiluong)
    : (durationMatch ? parseInt(durationMatch[1], 10) : 45);
  cleanMarkdown = rebalanceLessonPlanActivityDurations(cleanMarkdown, targetDuration, Boolean(normalizedOptions.hideActivityTime));

  // Unpack any multiline aligned LaTeX math blocks so they never leak raw \begin{aligned} or \\ &
  cleanMarkdown = unpackLatexAlignedEnvironments(cleanMarkdown);

  // Clean stray standalone $$ and $ lines throughout cleanMarkdown
  cleanMarkdown = cleanMarkdown
    .replace(/^[ \t]*\${1,3}[ \t]*$/gm, '')
    .replace(/\$\$\s*\$\$/g, '')
    .replace(/(?:^|\n)[ \t]*\${1,3}[ \t]*(?=\n|$)/g, '\n');

  // Deduplicate any repeated signature tables in cleanMarkdown
  const sigMatchRegex = /\|[ \t]*(?:DUYỆT CỦA BAN GIÁM HIỆU|DUYỆT CỦA BGH|Duyệt của BGH|XÁC NHẬN BGH)[ \t]*\|[\s\S]*?(?=(?:\n\s*\|[ \t]*(?:DUYỆT CỦA|XÁC NHẬN)|\n\s*\n\s*\|[ \t]*(?:DUYỆT CỦA|$)|$))/gi;
  const foundSigMatches = cleanMarkdown.match(sigMatchRegex);
  if (foundSigMatches && foundSigMatches.length > 1) {
    const lastSig = foundSigMatches[foundSigMatches.length - 1];
    cleanMarkdown = cleanMarkdown.replace(sigMatchRegex, '').trim() + '\n\n' + lastSig;
  }

  // Detect whether this document is an Appendix / Educational Plan, Exam/Matrix, or a single Lesson Plan (Kế hoạch bài dạy)
  const isAppendixDoc = /PHỤ LỤC\s*([123]|I{1,3})|KHUNG KẾ HOẠCH DẠY HỌC|KẾ HOẠCH GIÁO DỤC|KẾ HOẠCH DẠY HỌC CỦA TỔ|PHÂN PHỐI CHƯƠNG TRÌNH|BẢNG PHÂN PHỐI/i.test(cleanMarkdown);
  const isExamOrMatrixDoc = /KHUNG MA TRẬN|BẢNG MA TRẬN|MA TRẬN ĐỀ|BẢNG ĐẶC TẢ|ĐẶC TẢ ĐỀ|ĐỀ KIỂM TRA|ĐỀ THI|BẢNG ĐÁP ÁN|HƯỚNG DẪN CHẤM/i.test(cleanMarkdown);
  const isLessonPlan = !isAppendixDoc && !isExamOrMatrixDoc && /(?:I\.\s*MỤC TIÊU|I\.\s*KIẾN THỨC|TIẾN TRÌNH DẠY HỌC|KẾ HOẠCH BÀI DẠY|KẾ HOẠCH TỔ CHỨC|HOẠT ĐỘNG HÌNH THÀNH)/i.test(cleanMarkdown);

  // Format any existing ISO dates on Ngày soạn in cleanMarkdown
  cleanMarkdown = cleanMarkdown.replace(/Ngày soạn:\s*(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/gi, (_, y, m, d) => {
    return `Ngày soạn: ${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  });

  // Ensure "Ngày soạn: DD/MM/YYYY" line is present ONLY for Lesson Plans (never on Appendix documents)
  const targetNgaySoan = formatVietnameseDate(ngaySoan);
  const ngaySoanFormattedLine = `Ngày soạn: ${targetNgaySoan}`;

  if (isLessonPlan) {
    cleanMarkdown = cleanMarkdown.replace(/^(?:[ \t]*\${1,3}[ \t]*\n*)+/g, '').trim();
    if (!cleanMarkdown.toLowerCase().startsWith('ngày soạn:')) {
      cleanMarkdown = cleanMarkdown.replace(/^Ngày soạn:\s*[^\n]*\n?/im, '');
      cleanMarkdown = `${ngaySoanFormattedLine}\n\n${cleanMarkdown.trim()}`;
    } else {
      cleanMarkdown = cleanMarkdown.replace(/^Ngày soạn:\s*[^\n]*/i, ngaySoanFormattedLine);
    }
  }

  // Ensure "TIẾT theo PPCT" is ALWAYS present above lesson title before I. MỤC TIÊU for lesson plans
  if (isLessonPlan) {
    const preMainSection = cleanMarkdown.split(/(?:I\.\s*MỤC TIÊU|I\.\s*KIẾN THỨC)/i)[0] || '';
    const hasTietHeaderInTitle = /(?:^|\n)\s*(?:\*\*)?(?:TIẾT|Tiết)\s+[\d,\s\-–]+/i.test(preMainSection);

    if (!hasTietHeaderInTitle) {
      const explicitTiet = (normalizedOptions.tietPPCT || normalizedOptions.tiet || '').trim();
      let tietToInsert = explicitTiet;
      if (!tietToInsert) {
        const matchTietInBody = cleanMarkdown.match(/(?:^|\n)\s*(?:##\s*|\*\*)?(?:TIẾT|Tiết)\s+([\d,\s\-–]+)/i);
        if (matchTietInBody && matchTietInBody[1]) {
          tietToInsert = matchTietInBody[1].trim();
        }
      }
      if (tietToInsert) {
        const cleanTietNum = tietToInsert.replace(/^TIẾT\s*/i, '').trim();
        const tietFormatted = `**TIẾT ${cleanTietNum}**`;
        if (cleanMarkdown.match(/(?:^|\n)\s*(?:#+\s*|\*\*)?(?:BÀI|Bài)\s*[:\s\d]/i)) {
          cleanMarkdown = cleanMarkdown.replace(/((?:^|\n)\s*(?:#+\s*|\*\*)?(?:BÀI|Bài)\s*[:\s\d])/i, `\n\n${tietFormatted}\n$1`);
        } else if (cleanMarkdown.match(/(?:^|\n)\s*#+\s+[^\n]+/i)) {
          cleanMarkdown = cleanMarkdown.replace(/((?:^|\n)\s*#+\s+[^\n]+)/i, `\n\n${tietFormatted}\n$1`);
        }
      }
    }
  }

  // Determine page orientation: Respect explicit parameter if provided; otherwise auto-detect
  const isLandscape =
    explicitLandscape !== undefined
      ? explicitLandscape
      : /PHỤ LỤC\s*([123]|I{1,3})|PL[123]|KHGD|KẾ HOẠCH TỔ CHỨC|PHÂN PHỐI CHƯƠNG TRÌNH|BẢNG PHÂN PHỐI/i.test(cleanMarkdown);

  const totalTableWidthDxa = isLandscape ? 14287 : 9070;

  const children: (Paragraph | Table)[] = [];

  // Ensure all pedagogical headings and subheadings are properly unglued and split across newlines
  cleanMarkdown = ungluePedagogicalHeadings(cleanMarkdown);

  // Clean stray markdown hash-only lines, orphan blockquote markers
  cleanMarkdown = cleanMarkdown
    .replace(/^[ \t]*#{1,6}[ \t]*$/gm, '')
    .replace(/^[ \t]*[><\s]+$/gm, '');

  // Normalize excessive br sequences (e.g. 3 or more <br> to at most two)
  cleanMarkdown = cleanMarkdown.replace(/(?:<br\s*\/?>\s*){3,}/gi, '<br/><br/>');

  // Parse markdown lines, TikZ blocks, and tables
  // CRITICAL: Protect table rows so that <br> inside cells is NOT split into separate lines!
  // Non-table lines containing <br> are split into separate lines for clean paragraph breaks.
  const rawLines = cleanMarkdown.split('\n');
  const lines: string[] = [];
  for (const raw of rawLines) {
    const trimmed = raw.trim();
    if (trimmed.includes('|') && !trimmed.startsWith('#')) {
      // Table row: keep intact with all cells and <br> on a single line!
      lines.push(raw);
    } else if (/<br\s*\/?>/i.test(raw)) {
      // Non-table line with <br>: split into separate lines so paragraphs break cleanly
      const subLines = raw.split(/<br\s*\/?>/i);
      for (const sub of subLines) {
        if (sub.trim().length > 0) {
          lines.push(sub.trim());
        }
      }
    } else {
      lines.push(raw);
    }
  }
  let tableRowsData: string[][] = [];
  let inTable = false;
  let reachedMainBody = false;
  let isPoemSection = false;

  const flushTable = async () => {
    if (tableRowsData.length > 0) {
      // Check if table ends with signature rows (e.g. ['Duyệt của BGH', 'Duyệt của tổ'])
      const isSigRow = (row: string[]) =>
        row.some(cell => /(?:duyệt của|xác nhận|người lập kế hoạch|tổ trưởng chuyên môn|ban giám hiệu|giáo viên soạn|hiệu trưởng|bùi sỹ nghĩa)/i.test(cell));

      const firstSigIndex = tableRowsData.findIndex((row, idx) => idx > 0 && isSigRow(row));

      if (firstSigIndex > 0) {
        // Split into educational content table + signature block table
        const contentRows = tableRowsData.slice(0, firstSigIndex);
        const signatureRows = tableRowsData.slice(firstSigIndex);

        if (contentRows.length > 0) {
          children.push(await createDocxTable(contentRows, totalTableWidthDxa));
        }
        if (signatureRows.length > 0) {
          children.push(await createDocxTable(signatureRows, totalTableWidthDxa));
        }
      } else {
        children.push(await createDocxTable(tableRowsData, totalTableWidthDxa));
      }
      tableRowsData = [];
    }
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    let rawLine = lines[i].trim();

    // Skip empty lines, pure hash lines (like ### standing alone), orphan blockquotes/brackets, pure html artifacts, or stray $$ lines
    if (
      !rawLine ||
      /^#{1,6}\s*$/.test(rawLine) ||
      /^[><\s]+$/.test(rawLine) ||
      /^(?:<br\s*\/?>|<\/br>|<br>|<br|\s)+$/i.test(rawLine) ||
      rawLine === '<div>' ||
      rawLine === '</div>' ||
      /^<div\b/i.test(rawLine) ||
      /^\${1,3}\s*$/.test(rawLine) ||
      /^[\s$]+$/.test(rawLine)
    ) {
      continue;
    }

    // Clean leading blockquote markers and residual HTML breaks
    rawLine = rawLine.replace(/^[ \t]*>[ \t]*/g, '');
    if (!rawLine.includes('|')) {
      rawLine = rawLine.replace(/(?:<br\s*\/?>|<\/br>|<br>|<br)+/gi, ' ');
    }
    rawLine = rawLine.trim();

    if (!rawLine || /^#{1,6}\s*$/.test(rawLine) || /^[><\s]+$/.test(rawLine)) {
      continue;
    }

    if (
      /I\.\s*M[ỤÔUuô]C\s*TIÊU/i.test(rawLine) ||
      /I\.\s*KIẾN\s*THỨC/i.test(rawLine) ||
      /I\.\s*YÊU\s*CẦU/i.test(rawLine) ||
      /II\.\s*THIẾT\s*BỊ/i.test(rawLine) ||
      /III\.\s*TIẾN\s*TRÌNH/i.test(rawLine) ||
      /1\.\s*HOẠT\s*ĐỘNG\s*(?:KHỞI|HÌNH|LUYỆN|VẬN)/i.test(rawLine) ||
      /HOẠT\s*ĐỘNG\s*KHỞI\s*ĐỘNG/i.test(rawLine) ||
      /MỤC\s*TIÊU\s*BÀI\s*HỌC/i.test(rawLine)
    ) {
      reachedMainBody = true;
    }

    // Skip isolated horizontal rules like "---", "***", "___" (eliminates ugly dashes in Word output)
    if (/^[-*_]{2,}\s*$/.test(rawLine)) {
      if (inTable) await flushTable();
      continue;
    }

    // Left-aligned Ngày soạn line before I. MỤC TIÊU (matching Image 1, Font 14pt = size 28)
    if (!reachedMainBody && /^Ngày soạn:/i.test(rawLine)) {
      if (inTable) await flushTable();
      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 100, after: 120 },
          children: [
            new TextRun({
              text: rawLine.replace(/^\*+|\*+$|^#+\s*/g, '').replace(/Ngày soạn:\s*(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/gi, (_, y, m, d) => {
                return `Ngày soạn: ${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
              }),
              bold: true,
              size: 28, // 14pt chuẩn văn bản
              color: '000000',
              font: 'Times New Roman'
            })
          ]
        })
      );
      continue;
    }

    // Centered title & period lines before Main Body (BÀI 1: ..., TIẾT 1, 2, Thời lượng...)
    if (!reachedMainBody) {
      if (inTable) await flushTable();
      const cleanHeading = rawLine
        .replace(/^[\s#*]+|[\s#*]+$/g, '')
        .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
        .replace(/&nbsp;/gi, ' ')
        .trim();
      if (!cleanHeading) continue;

      const isPeriodLine = /^TIẾT\s+|^Tiết\s+/i.test(cleanHeading);
      const isDuration = /^\(?thời lượng/i.test(cleanHeading) || cleanHeading.toLowerCase().includes('thời lượng:');
      const isSubtitle = /^\*?\(.*?\)\*?$/.test(cleanHeading);

      if (isDuration || isSubtitle) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 120 },
            children: [
              new TextRun({
                text: cleanHeading.replace(/^[\s#*]+|[\s#*]+$/g, ''),
                bold: false,
                italics: true,
                size: 26, // 13pt
                color: '333333',
                font: 'Times New Roman'
              })
            ]
          })
        );
      } else if (isPeriodLine) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 60 },
            children: [
              new TextRun({
                text: cleanHeading.toUpperCase(),
                bold: true,
                size: 28, // 14pt
                color: '000000',
                font: 'Times New Roman'
              })
            ]
          })
        );
      } else {
        // Tên bài / Chủ đề / Kế hoạch bài dạy: LUÔN CĂN GIỮA (AlignmentType.CENTER), 16pt (size 32), In đậm
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 100 },
            children: [
              new TextRun({
                text: cleanHeading,
                bold: true,
                size: 32, // 16pt
                color: '002060',
                font: 'Times New Roman'
              })
            ]
          })
        );
      }

      if (!isLessonPlan) {
        reachedMainBody = true;
      }
      continue;
    }

    // 1. Detect TikZ Code Blocks in main body -> Replace completely with a single prominent text note without code box
    if (rawLine.includes('\\begin{tikzpicture}') || rawLine.startsWith('```tikz') || rawLine.trim() === '```') {
      if (inTable) await flushTable();

      let count = 0;
      while (i + 1 < lines.length && count < 50) {
        if (lines[i].includes('\\end{tikzpicture}') || lines[i].trim() === '```') {
          break;
        }
        i++;
        count++;
      }

      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [
            new TextRun({
              text: '[ HÌNH VẼ MINH HỌA (TIKZ) - THẦY/CÔ CHÈN HÌNH THỦ CÔNG TẠI ĐÂY ]',
              bold: true,
              italics: true,
              size: 26, // 13pt
              color: 'C00000', // Prominent Crimson Red
              font: 'Times New Roman'
            })
          ]
        })
      );
      continue;
    }

    // 2. Detect Markdown Image Tags ![alt](data:image/...) or ![alt](url) -> Safe manual insertion placeholder
    const imgMatch = rawLine.match(/!\[(.*?)\]\((data:image\/[a-zA-Z+]+;base64,[^)]+|https?:\/\/[^)]+)\)/);
    if (imgMatch) {
      if (inTable) await flushTable();

      const altText = imgMatch[1] || 'Hình ảnh tư liệu SGK';

      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [
            new TextRun({
              text: `[ HÌNH ÁNH MINH HỌA: ${altText} - THẦY/CÔ CHÈN HÌNH THỦ CÔNG TẠI ĐÂY ]`,
              bold: true,
              italics: true,
              size: 24,
              color: '002060',
              font: 'Times New Roman'
            })
          ]
        })
      );
      continue;
    }

    // 3. Detect Markdown Table Rows (line contains '|')
    // SPECIAL GUARD: If line is purely a standalone TIẾT header (e.g. '| TIẾT 2: LUYỆN TẬP |' or 'TIẾT 2: LUYỆN TẬP'), NEVER treat as a table row!
    // Must NOT match content rows that merely mention "tiết 1" or "tiết 2" in instructional text or pedagogical steps!
    const isTietLineInPipes =
      !/(?:hoạt\s*động|bước\s*\d|gv|hs|nhiệm\s*vụ|sản\s*phẩm|khởi\s*động|hình\s*thành|luyện\s*tập\s*\d|vận\s*dụng|mục\s*tiêu|nội\s*dung|<br|đơn\s*thức|bài\s*tập|thực\s*hiện|báo\s*cáo|kết\s*luận|chi\s*tiết|bản\s*lề|vòng\s*đệm|chốt|ốc|vít|thép|nhôm|đồng|gang|nhựa|cái|chiếc|bộ\s*phận|vật\s*liệu)/i.test(rawLine) &&
      rawLine.length < 120 &&
      /^[ \t]*(?:\|[ \t]*)?(?:#{1,4}\s*|\*{0,2})(?<!(?:chi|họa|thời|bài|tình)\s*)(?<![a-zA-ZÀ-ỹ])(?:TIẾT|Tiết)\s+\d+(?:[ \t]*[-–:][ \t]*[^\n|]+)?(?:\*{0,2})[ \t]*(?:\|[ \t]*)*$/i.test(rawLine);

    if (isTietLineInPipes) {
      if (inTable) {
        await flushTable();
      }
      let cleanHeading = rawLine
        .replace(/^[\s#*|]+|[\s#*|]+$/g, '')
        .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
        .replace(/&nbsp;/gi, ' ')
        .trim();
      cleanHeading = cleanHeading.toUpperCase();

      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
          children: [
            new TextRun({
              text: cleanHeading,
              bold: true,
              size: 28, // 14pt
              color: '002060',
              font: 'Times New Roman'
            })
          ]
        })
      );
      continue;
    }

    if (rawLine.includes('|') && !rawLine.startsWith('#')) {
      const rowContent = rawLine.replace(/^\||\|$/g, '').trim();

      // Skip divider lines like |---|---| or |:---|---:|
      if (/^[:\s|-]+$/.test(rowContent)) {
        inTable = true;
        continue;
      }

      // Check if this line is a signature/approval header row (e.g. | **DUYỆT CỦA BAN GIÁM HIỆU** | **DUYỆT CỦA TỔ CHUYÊN MÔN** |)
      const isSigLine = /(?:duyệt của|xác nhận|người lập kế hoạch|tổ trưởng chuyên môn|ban giám hiệu|giáo viên soạn|hiệu trưởng|bùi sỹ nghĩa)/i.test(rawLine);
      if (isSigLine && inTable && tableRowsData.length > 0) {
        // If we are currently collecting an educational activity table, flush it first so the signature block is a completely separate table!
        await flushTable();
      }

      const cells = splitMarkdownTableRow(rawLine);

      if (cells.length > 0) {
        inTable = true;
        tableRowsData.push(cells);
      }
    } else {
      if (!rawLine) {
        if (inTable) {
          // Peek ahead to see if table continues after blank line
          let continuesTable = false;
          for (let j = i + 1; j < lines.length; j++) {
            const next = lines[j].trim();
            if (!next) continue;
            if (next.includes('|') && !next.startsWith('#') && !/^[ \t]*(?:\|[ \t]*)?(?:#{1,4}\s*|\*{0,2})(?:TIẾT|Tiết)\s+\d+/i.test(next)) {
              continuesTable = true;
            }
            break;
          }
          if (!continuesTable) {
            await flushTable();
          }
        }
        continue;
      }

      // Line does NOT contain '|' and is not blank
      if (inTable) {
        const trimmed = rawLine.trim();
        const isStructuralBreak =
          /^(?:#{1,6}\s+|---|\*\*(?:TIẾT|I\.|II\.|III\.|IV\.|V\.|VI\.|TỔNG\s*KẾT|HƯỚNG\s*DẪN|DẶN\s*DÒ|DUYỆT|XÁC NHẬN|PHỤ LỤC|BẢNG ĐẶC TẢ|MA TRẬN))/i.test(trimmed) ||
          /^(?:(?:IV|V)\.\s*)?(?:TỔNG\s*KẾT|HƯỚNG\s*DẪN|DẶN\s*DÒ)/i.test(trimmed) ||
          /^(?:\*\*)?(?:[1-5]\.\s*HOẠT\s*ĐỘNG|[A-D]\.\s*HOẠT\s*ĐỘNG)/i.test(trimmed);

        if (!isStructuralBreak && tableRowsData.length > 0) {
          // Append to the last cell of the current table row!
          const lastRow = tableRowsData[tableRowsData.length - 1];
          if (lastRow.length > 0) {
            lastRow[lastRow.length - 1] += '<br/>' + trimmed;
            continue;
          }
        }
        await flushTable();
      }

      // Track Poem Section
      if (/NỘI DUNG BÀI THƠ|BÀI THƠ|LỤC BÁT|BỐN CHỮ|NĂM CHỮ|TỔNG\s*KẾT\s*(?:KIẾN\s*THỨC|BÀI\s*HỌC)?/i.test(rawLine)) {
        isPoemSection = true;
      } else if (/^(?:#{1,6}\s+)?(?:🧠|🎭|Ý NGHĨA|HƯỚNG DẪN|MỤC TIÊU|TIẾN TRÌNH|IV\.|V\.)/i.test(rawLine)) {
        isPoemSection = false;
      }

      // SPECIAL GUARD: Check if line is a Section Title (like "IV. HƯỚNG DẪN VỀ NHÀ" or "TỔNG KẾT KIẾN THỨC") with trailing content
      const inlineHwOrSummaryMatch = rawLine.match(/^(?:#{1,6}\s*)?\*{0,2}((?:IV\.\s*)?HƯỚNG\s*DẪN\s*(?:HỌC\s*SINH\s*HỌC\s*Ở\s*NHÀ|VỀ\s*NHÀ|TỰ\s*HỌC)(?:\s*\([^)]*\))?|(?:V\.\s*)?TỔNG\s*KẾT\s*(?:KIẾN\s*THỨC|BÀI\s*HỌC)?(?:\s*\([^)]*\))?)(?:\*\*)?[ \t]*(?:[:|–-]\s*|\*{2})[ \t]*(.+)$/i);
      if (inlineHwOrSummaryMatch) {
        const title = inlineHwOrSummaryMatch[1].replace(/[*#|]/g, '').trim().toUpperCase();
        let trailingContent = inlineHwOrSummaryMatch[2]
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/\\vert\s*/g, '|')
          .trim();

        // If poem section with slashes '/', split into separate verses (preserve fractions like 1/2 or units like km/h)
        if (trailingContent.includes('/') && /TỔNG\s*KẾT/i.test(title)) {
          trailingContent = trailingContent.replace(/(?<=[a-zA-ZÀ-ỹ0-9,;!?])\s*\/\s*(?=[a-zA-ZÀ-ỹ0-9])/gi, '\n');
        }

        // Auto-repair fractured math expressions (e.g. "(n" + "\n+ 3)" or "\n+ 4 = 9")
        trailingContent = trailingContent.replace(/([^\n])\n\s*(\+\s*(?:\d|\(|[a-z]\b|[A-Za-z0-9^_{}]+\s*=))/g, '$1 $2');
        trailingContent = trailingContent.replace(/(\([^)\n]*)\n\s*(\+[^)\n]*\))/g, '$1 $2');

        // If multiple bullet points are squished on the same line, split them (only if preceded by punctuation)
        trailingContent = trailingContent.replace(/([.;:!?])\s+([-*•]\s+)/g, '$1\n$2');
        trailingContent = trailingContent.replace(/([.;:!?])\s+(\+\s+[A-ZÀ-Ỹ])/g, '$1\n$2');

        // 1. Output the clean uppercase heading
        children.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: title,
                bold: true,
                size: 28, // 14pt
                color: '002060',
                font: 'Times New Roman'
              })
            ]
          })
        );

        // 2. Output trailing content as standard body paragraphs (not uppercase, not giant blue title)
        const subLines = trailingContent.split('\n').map(l => l.trim()).filter(Boolean);
        for (const subLine of subLines) {
          const isBullet = /^[-+*•]/.test(subLine);
          const cleanSub = subLine.replace(/^[-+*•]\s*/, '').trim();
          if (cleanSub) {
            const isSummaryPoem = /TỔNG\s*KẾT/i.test(title) && !isBullet && cleanSub.length < 120;
            children.push(createFormattedParagraph(isBullet ? `- ${cleanSub}` : cleanSub, isSummaryPoem ? AlignmentType.CENTER : AlignmentType.LEFT));
          }
        }
        continue;
      }

      // Detect if this line is a Lesson Title, Topic, or Period line inside body -> Must be CENTERED!
      const isBodyTitleOrPeriod = /^(?:#+\s*|\*{0,2})(?:BÀI\s+\d+|Bài\s+\d+|CHỦ ĐỀ\b|Chủ đề\b|TIẾT\s+\d+|Tiết\s+\d+|KẾ HOẠCH BÀI DẠY|GIÁO ÁN\b|TÊN BÀI\b|PHIẾU BÀI TẬP|ĐỀ KIỂM TRA|MA TRẬN\b|BẢNG ĐẶC TẢ)/i.test(rawLine);

      // Headings & Standard Paragraphs
      const isRomanSection = /^(?:#{1,6}\s*)?\*{0,2}(?:I|II|III|IV|V|VI|VII|VIII|IX|X)\./i.test(rawLine);
      const isTietHeader = /^(?:#{1,6}\s*)?\*{0,2}(?:TIẾT|Tiết)\s+\d+/i.test(rawLine);
      const isLetterSection = /^(?:#{1,6}\s*)?\*{0,2}[A-D]\.\s*M[ỤÔUuô]C\s*TIÊU/i.test(rawLine);

      if (
        isBodyTitleOrPeriod ||
        isRomanSection ||
        isTietHeader ||
        isLetterSection ||
        /^#{1,6}\s+/.test(rawLine)
      ) {
        let cleanHeading = rawLine
          .replace(/^[\s#*]+|[\s#*]+$/g, '')
          .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
          .replace(/&nbsp;/gi, ' ')
          .trim();

        // Enforce UPPERCASE for Roman numeral major sections, TIẾT X titles, and A/B major goals
        if (/^(?:I|II|III|IV|V|VI|VII|VIII|IX|X)\./i.test(cleanHeading) || /^(?:TIẾT|Tiết)\s+\d+/i.test(cleanHeading) || /^[A-D]\.\s*M[ỤÔUuô]C\s*TIÊU/i.test(cleanHeading)) {
          cleanHeading = cleanHeading.toUpperCase();
        }

        children.push(
          new Paragraph({
            alignment: isBodyTitleOrPeriod || isTietHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: cleanHeading,
                bold: true,
                size: isBodyTitleOrPeriod ? 32 : 28, // 16pt for Title, 14pt for Roman sections / Tiết
                color: '002060',
                font: 'Times New Roman'
              })
            ]
          })
        );
      } else if (rawLine.startsWith('**') && rawLine.endsWith('**') && rawLine.length > 4) {
        let text = rawLine
          .replace(/^[\s#*]+|[\s#*]+$/g, '')
          .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
          .replace(/<br\s*\/?>/gi, ' ')
          .trim();
        if (/^(?:I|II|III|IV|V|VI|VII|VIII|IX|X)\./i.test(text) || /^(?:TIẾT|Tiết)\s+\d+/i.test(text) || /^[A-D]\.\s*M[ỤÔUuô]C\s*TIÊU/i.test(text)) {
          text = text.toUpperCase();
        }
        const isBoldMajorSectionTitle = /^(?:PHẦN\s+\d+|CHUYÊN\s+ĐỀ|BÀI\s+TẬP\s+TỰ\s+LUYỆN|HOẠT\s+ĐỘNG\s+\d+|[I|V|X]+\.|[A-D]\.\s*M[ỤÔUuô]C\s*TIÊU|TIẾT\s+\d+|BÀI\s+\d+|Chủ\s*đề\b)/i.test(text) && text.length < 90;
        const isBoldCenteredTitle = /^(?:BÀI\s+\d+|Bài\s+\d+|CHỦ ĐỀ|TIẾT\s+\d+|Tiết\s+\d+|KẾ HOẠCH BÀI DẠY)/i.test(text);

        if (isBoldMajorSectionTitle) {
          children.push(
            new Paragraph({
              alignment: isBoldCenteredTitle ? AlignmentType.CENTER : AlignmentType.LEFT,
              spacing: { before: 200, after: 80 },
              children: [
                makeTextRunWithPreservedSpacing({
                  text: text,
                  bold: true,
                  size: isBoldCenteredTitle ? 32 : 28,
                  color: '002060',
                  font: 'Times New Roman'
                })
              ]
            })
          );
        } else {
          children.push(createFormattedParagraph(rawLine, AlignmentType.LEFT));
        }
      } else {
        // If in poem section and line contains slashes between words, split and render each verse centered
        if (isPoemSection && /(?<=[a-zA-ZÀ-ỹ0-9,;!?])\s*\/\s*(?=[a-zA-ZÀ-ỹ0-9])/i.test(rawLine)) {
          const verses = rawLine
            .split(/(?<=[a-zA-ZÀ-ỹ0-9,;!?])\s*\/\s*(?=[a-zA-ZÀ-ỹ0-9])/)
            .map(v => v.replace(/^[-+*•\s]+/, '').trim())
            .filter(Boolean);
          for (const verse of verses) {
            children.push(createFormattedParagraph(verse, AlignmentType.CENTER));
          }
        } else {
          // If in poem section and line is a short verse (not a list item), center-align it
          const isBullet = /^[-+*•\d+.]\s+/.test(rawLine);
          const shouldCenter = isPoemSection && !isBullet && rawLine.length < 120;
          children.push(createFormattedParagraph(rawLine, shouldCenter ? AlignmentType.CENTER : AlignmentType.LEFT));
        }
      }
    }
  }

  if (inTable) {
    await flushTable();
  }

  // Determine VIP Unlock Status
  let isVipActive = normalizedOptions.isVip;
  if (isVipActive === undefined && typeof window !== 'undefined') {
    try {
      const savedKey = localStorage.getItem(STORAGE_KEY_SAVED_LICENSE) || '';
      if (savedKey) {
        const res = validateLicenseKey(savedKey);
        isVipActive = res.valid && res.allowRemoveWatermark === true;
      } else {
        isVipActive = false;
      }
    } catch (e) {
      isVipActive = false;
    }
  }

  // If NOT VIP, inject prominent copyright watermark notice box at top of document
  if (!isVipActive) {
    const watermarkBanner = new Table({
      width: { size: totalTableWidthDxa, type: WidthType.DXA },
      borders: {
        top: { style: BorderStyle.DASHED, size: 2, color: 'DC2626' },
        bottom: { style: BorderStyle.DASHED, size: 2, color: 'DC2626' },
        left: { style: BorderStyle.DASHED, size: 2, color: 'DC2626' },
        right: { style: BorderStyle.DASHED, size: 2, color: 'DC2626' },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: totalTableWidthDxa, type: WidthType.DXA },
              shading: { fill: 'FEF2F2', type: ShadingType.CLEAR, color: 'auto' },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 100, after: 60 },
                  children: [
                    new TextRun({
                      text: '⚠️ BẢN QUYỀN BẢN THỬ NGHIỆM - HỆ THỐNG AI LESSON PLANNER PRO',
                      bold: true,
                      color: 'DC2626',
                      size: 22,
                      font: 'Times New Roman'
                    })
                  ]
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 0, after: 60 },
                  children: [
                    new TextRun({
                      text: 'Tác giả: Thầy Cấn Văn Trường (Zalo/SĐT: 0988.302.636) — Trường THCS Phùng Khắc Khoan, xã Tây Phương, TP. Hà Nội',
                      italics: true,
                      color: '4B5563',
                      size: 20,
                      font: 'Times New Roman'
                    })
                  ]
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 0, after: 100 },
                  children: [
                    new TextRun({
                      text: '👉 Vui lòng kích hoạt Mã Khóa VIP trong phần mềm để XÓA HOÀN TOÀN Watermark này và tự do xuất văn bản theo Trường & Họ tên của bạn.',
                      color: '1E40AF',
                      bold: true,
                      size: 20,
                      font: 'Times New Roman'
                    })
                  ]
                })
              ]
            })
          ]
        })
      ]
    });

    children.unshift(
      watermarkBanner,
      new Paragraph({ spacing: { before: 120, after: 120 }, children: [] })
    );
  }

  // Header & Footer content based on VIP license status and explicit watermarkText
  const defaultCopyrightNotice = isVipActive ? '' : '© BẢN QUYỀN: THẦY CẤN VĂN TRƯỜNG - TRƯỜNG THCS PHÙNG KHẮC KHOAN (0988.302.636)';
  const activeWatermark = watermarkText && watermarkText.trim() ? watermarkText.trim() : defaultCopyrightNotice;

  const finalHeaderLeft = headerText || (isVipActive ? (normalizedOptions.schoolName || 'Trường THCS Phùng Khắc Khoan') : 'AI LESSON PLANNER PRO - BẢN QUYỀN THẦY CẤN VĂN TRƯỜNG');
  const finalHeaderRight = isVipActive ? (normalizedOptions.namHoc || 'Năm học: 2026 - 2027') : 'BẢN DÙNG THỬ (CHƯA MỞ KHÓA VIP)';

  const finalFooterLeft = footerText
    ? (isVipActive ? footerText : (footerText.includes(defaultCopyrightNotice) ? footerText : `${footerText} | ${defaultCopyrightNotice}`))
    : (isVipActive ? (normalizedOptions.schoolName || 'Trường THCS Phùng Khắc Khoan') : activeWatermark);
  // Footer teacher title formatting: strictly "Giáo viên: [Tên]" (e.g. "Giáo viên: Cấn Văn Trường")
  let displayTeacher = (normalizedOptions.teacherName || '').trim();
  displayTeacher = displayTeacher.replace(/^(?:GV|Giáo\s+viên)\s*:?\s*/i, '').trim();
  displayTeacher = displayTeacher.replace(/^(?:Thầy|Cô)\s+/i, '').trim();
  if (!displayTeacher) {
    displayTeacher = 'Cấn Văn Trường';
  }
  const finalFooterRight = `Giáo viên: ${displayTeacher}`;


  // Create Document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: isLandscape
              ? {
                  width: 16838, // A4 Landscape width: 29.7cm (in twips/dxa)
                  height: 11906, // A4 Landscape height: 21.0cm (in twips/dxa)
                  orientation: PageOrientation.LANDSCAPE
                }
              : {
                  width: 11906, // A4 Portrait width: 21.0cm
                  height: 16838, // A4 Portrait height: 29.7cm
                  orientation: PageOrientation.PORTRAIT
                },
            margin: isLandscape
              ? {
                  top: 1134, // Top margin: 2.0cm
                  bottom: 1134, // Bottom margin: 2.0cm
                  left: 1417, // Left margin: 2.5cm
                  right: 1134 // Right margin: 2.0cm
                }
              : {
                  top: 1134, // Top margin: 2.0cm
                  bottom: 1134, // Bottom margin: 2.0cm
                  left: 1701, // Left margin: 3.0cm
                  right: 1134 // Right margin: 2.0cm
                }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Table({
                width: { size: totalTableWidthDxa, type: WidthType.DXA },
                layout: TableLayoutType.FIXED,
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: Math.floor(totalTableWidthDxa / 2), type: WidthType.DXA },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.LEFT,
                            children: [
                              new TextRun({
                                text: finalHeaderLeft,
                                size: isVipActive ? 22 : 18,
                                bold: !isVipActive,
                                color: isVipActive ? '000000' : 'B91C1C',
                                font: 'Times New Roman'
                              })
                            ]
                          })
                        ]
                      }),
                      new TableCell({
                        width: { size: Math.floor(totalTableWidthDxa / 2), type: WidthType.DXA },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                              new TextRun({
                                text: finalHeaderRight,
                                size: isVipActive ? 22 : 18,
                                italics: !isVipActive,
                                color: isVipActive ? '000000' : '6B7280',
                                font: 'Times New Roman'
                              })
                            ]
                          })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Table({
                width: { size: totalTableWidthDxa, type: WidthType.DXA },
                layout: TableLayoutType.FIXED,
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: Math.floor(totalTableWidthDxa / 2), type: WidthType.DXA },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.LEFT,
                            children: [
                              new TextRun({
                                text: finalFooterLeft,
                                size: isVipActive ? 22 : 18,
                                bold: !isVipActive,
                                color: isVipActive ? '000000' : 'B91C1C',
                                font: 'Times New Roman'
                              })
                            ]
                          })
                        ]
                      }),
                      new TableCell({
                        width: { size: Math.floor(totalTableWidthDxa / 2), type: WidthType.DXA },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                              new TextRun({
                                text: finalFooterRight,
                                size: isVipActive ? 22 : 18,
                                color: isVipActive ? '000000' : '6B7280',
                                font: 'Times New Roman'
                              })
                            ]
                          })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          })
        },
        children
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}

export async function exportMarkdownToWord(
  markdownContent: string,
  options: WordExportOptions | string = {}
): Promise<void> {
  const normalizedOptions: WordExportOptions = typeof options === 'string' ? { fileName: options.endsWith('.docx') ? options : `${options}.docx` } : options;
  const fileName = normalizedOptions.fileName || 'Ke_Hoach_Bai_Day_THCS_Phung_Khac_Khoan.docx';
  const blob = await generateMarkdownWordBlob(markdownContent, normalizedOptions);
  try {
    saveAs(blob, fileName);
  } catch (_e) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }
}

function isComplexMathFormula(mathText: string): boolean {
  const stripped = mathText.replace(/^\$\$?|\$\$?$/g, '').trim();
  if (!stripped) return false;

  // 1. If it contains Vietnamese accented letters -> NOT a valid standalone MathType formula (prevents MathType Vietnamese crashes)
  if (/[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(stripped)) {
    return false;
  }

  // 2. Simple points (A, B, C, M, N), segment names (AB, CD, OM), numbers (1, 2, 5, 100), simple variables (x, y), units (5 cm, 10 kg) -> Normal Word text
  if (/^[a-zA-Z0-9\s\.\,\%\°\-\_]{1,12}$/.test(stripped)) {
    return false;
  }

  // 3. If it contains TeX command backslashes (e.g. \frac, \sqrt, \alpha, \times) -> Complex math!
  if (/\\(frac|dfrac|tfrac|sqrt|sum|int|lim|alpha|beta|gamma|delta|Delta|pi|theta|times|div|pm|leq|geq|neq|approx|widehat|vec|parallel|perp|infty|left|right|begin|end)/i.test(stripped) || stripped.includes('\\')) {
    return true;
  }

  // 4. If it contains equations with operators = + - * / ^ _
  if (/[\+\-\*/=\^_\{\}<>]/.test(stripped)) {
    return true;
  }

  return false;
}

function makeTextRunWithPreservedSpacing(options: {
  text: string;
  bold?: boolean;
  italics?: boolean;
  size?: number;
  color?: string;
  font?: string;
}): TextRun {
  let t = options.text;
  if (!t) return new TextRun({ text: '', size: options.size || 28, font: options.font || 'Times New Roman' });

  // If text starts or ends with regular space, convert boundary space to non-breaking space \u00A0
  // to ensure Word XML never strips spaces between adjacent runs (prevents dính chữ)
  if (t.startsWith(' ') && !t.startsWith('\u00A0')) {
    t = '\u00A0' + t.slice(1);
  }
  if (t.endsWith(' ') && !t.endsWith('\u00A0')) {
    t = t.slice(0, -1) + '\u00A0';
  }
  if (t === ' ') {
    t = '\u00A0';
  }

  // If text contains math arrows or symbols unsupported in Times New Roman on Windows,
  // fall back to Segoe UI Symbol so Word does not display missing-glyph square boxes!
  let font = options.font || 'Times New Roman';
  if (!options.font && /^[⇒⇔→←□■✓∠△⊥∥∡∀∃∅ℝℕℤℚℂ]$/.test(t.trim())) {
    font = 'Segoe UI Symbol';
  }

  return new TextRun({
    ...options,
    text: t,
    font,
    size: options.size || 28
  });
}

function createFormattedParagraph(text: string, alignment: any = AlignmentType.LEFT): Paragraph {
  // Strip code fences like ```tikz or ```
  const textWithoutFences = text.replace(/```tikz|```/gi, '').trim();

  // Unpack any multiline LaTeX aligned environments and strip residual \begin{aligned}, \end{aligned}, \\ &, &
  let sanitizedText = repairVietnameseText(unpackLatexAlignedEnvironments(textWithoutFences))
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&emsp;/gi, ' ')
    .replace(/&ensp;/gi, ' ')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

  // Remove stray quotes around units: "kg", ''kg'', 'kg', "đồng", etc.
  sanitizedText = sanitizedText
    .replace(/["“”'‘’]{1,2}(kg|g|mg|tấn|tạ|yến|m|cm|mm|dm|km|lít|ml|đồng|nghìn\s*đồng|triệu\s*đồng|tỉ\s*đồng|km\/h|m\/s|phút|giây|giờ|ngày|năm|người|học\s*sinh|cây|quyển|viên|chiếc|quả)["“”'‘’]{1,2}/gi, '$1')
    .replace(/(?<=[0-9a-zA-Z\(\)\s*+×\-\/])["“”'‘’]{1,2}([a-zA-ZÀ-ỹ\s]+)["“”'‘’]{1,2}/g, '$1')
    .replace(/''/g, '"')
    .replace(/[`´’‘]{2,}/g, '"');

  // Auto-repair truncated or unclosed \text{ or \mathrm{
  sanitizedText = sanitizedText.replace(/\\(?:text|mathrm)\s*\{\s*([a-zA-ZÀ-ỹ\s0-9()]+)(?=[)\],;=+\-*\/<>.]|\$|$|<br|\n)/gi, ' $1 ');
  sanitizedText = sanitizedText.replace(/\\(?:text|mathrm)\s*\{/gi, ' ');

  // Deduplicate redundant colons: e.g. "**Ví dụ:** : :", "Ví dụ: : :", ":::"
  sanitizedText = sanitizedText
    .replace(/\*\*([^*]+:)\*\*\s*:+/g, '**$1** ')
    .replace(/\*\*([^*:]+)\*\*\s*:\s*:+/g, '**$1:** ')
    .replace(/(?::\s*){2,}/g, ': ')
    .replace(/:\s*:+/g, ':')
    .replace(/([a-zA-ZÀ-ỹ0-9]):\s*:\s*/g, '$1: ');

  if (!sanitizedText.trim() || /^[-*_=]{2,}\s*$/.test(sanitizedText.trim())) {
    return new Paragraph({
      alignment,
      spacing: { before: 40, after: 40 },
      children: [new TextRun({ text: '', size: 28, font: 'Times New Roman' })]
    });
  }

  // Clean extra backslashes before spaces/punctuation (e.g. ";\ " -> "; ", ",\ " -> ", ", "\ " -> " ")
  sanitizedText = sanitizedText
    .replace(/\\([,;:! ])/g, ' ')
    .replace(/\\+(?=[ \t.,;:!?)\\}\\]]|$)/g, '');

  // Clean markdown underscore artifacts & broken subscripts (e.g. "s,_{ta} có:" -> "s, ta có:")
  sanitizedText = sanitizedText
    .replace(/([a-zA-Z0-9$]+)[,;:]\s*_{([^{}]+)}/g, '$1, $2')
    .replace(/(^|[\s,;:(])_{([a-zA-Zà-ỹÀ-Ỹ\s]+)}/g, '$1$2')
    .replace(/_{([a-zA-Zà-ỹÀ-Ỹ\s]+)}/g, '$1')
    .replace(/_(Nội\s*dung|Lời\s*giải|Gợi\s*ý|Nhận\s*xét|Ví\s*dụ|Bài\s*tập|Chú\s*ý|Mục\s*tiêu|Sản\s*phẩm|Kết\s*luận|Đáp\s*án):?_/gi, (_m, label) => `**${label}:**`)
    .replace(/__([^_]+)__/g, '**$1**')
    .replace(/_([A-Za-z0-9à-ỹÀ-Ỹ\s,–—\-]{2,50})_/g, '$1')
    .replace(/([.,;:!?])_+/g, '$1')
    .replace(/_+([.,;:!?])/g, '$1')
    .replace(/(^|\s)_+([a-zA-Zà-ỹÀ-Ỹ0-9]+)_+(\s|$)/g, '$1$2$3')
    .replace(/(^|\s)_+([a-zA-Zà-ỹÀ-Ỹ]+)/g, '$1$2')
    .replace(/([a-zA-Zà-ỹÀ-Ỹ]+)_+(\s|$)/g, '$1$2');

  // Clean orphan single asterisks at punctuation boundaries and end of lines (strictly preserve ℕ*, ℤ*, ℚ*, ℝ*, N* and markdown bold **)
  sanitizedText = sanitizedText
    .replace(/([.,;:!?])\s*(?<!\*)\*(?!\*)/g, '$1 ')
    .replace(/(?<![ℕℤℚℝN*])\*(?!\*)([.,;:!?])/g, '$1')
    .replace(/(?<![ℕℤℚℝN*])\*(?!\*)[ \t]*$/gm, '')
    .replace(/(?<=[a-zA-Zà-ỹÀ-Ỹ]{2,})\*(?!\*)(?=\s)/g, '')
    .replace(/^[ \t]*\*(?!\*)[ \t]*([A-Za-zÀ-ỹ])/gm, '$1')
    .replace(/([a-zA-Zà-ỹÀ-Ỹ]{2,})\*(?!\*)/g, '$1')
    .replace(/(?<!\*)\*([a-zA-Zà-ỹÀ-Ỹ]{2,})/g, '$1');

  // Auto-close dangling ** at start of line or label
  sanitizedText = sanitizedText
    .replace(/(^|\n|\||<br\s*\/?>)[ \t]*\*\*(Bước\s*\d[:\.]\s*[^:\n*]+):(?!\*)[ \t]*/gi, '$1**$2:** ')
    .replace(/(^|\n|\||<br\s*\/?>)[ \t]*\*\*([1-5]\.\s*HOẠT\s*ĐỘNG[^\n*]+?)(?!\*)[ \t]*(?=\n|\||<br|$)/gi, '$1**$2**');
  if (/^\s*\*\*[^*]+$/.test(sanitizedText)) {
    // If it has a colon label (e.g. "**Bước 1: ...", "**Ví dụ 1: ...", "**Chú ý: ..."), close bold right after label!
    if (/^\s*\*\*([^:\n*]+:)\s*([^*]+)$/.test(sanitizedText)) {
      sanitizedText = sanitizedText.replace(/^\s*\*\*([^:\n*]+:)\s*([^*]+)$/, '**$1** $2');
    } else if (sanitizedText.trim().length < 80) {
      sanitizedText = sanitizedText.trim() + '**';
    } else {
      // Long multi-sentence paragraph starting with accidental **: strip leading ** rather than bolding entire paragraph!
      sanitizedText = sanitizedText.replace(/^\s*\*\*/, '');
    }
  }

  // Auto-bold numbered headings in Column 2 and whole document:
  // e.g. "1. Khởi động:", "1. Mở đầu...:", "2. Hình thành kiến thức:", "3. Luyện tập:", "4. Vận dụng:", "1. Khái niệm đơn thức:"
  sanitizedText = sanitizedText.replace(/^(\d+(?:\.\d+)*\.\s*(?:Về\s+)?(?:Khởi\s*động|Mở\s*đầu|Hình\s*thành|Luyện\s*tập|Vận\s*dụng|Kiến\s*thức|Tìm\s*tòi|Giáo\s*viên|Học\s*sinh|Năng\s*lực|Phẩm\s*chất|Mục\s*tiêu|Thiết\s*bị|Học\s*liệu|Nội\s*dung)[^:\n*]*?)(?::(?!\*)|\s*$)[ \t]*/i, '**$1:** ');
  sanitizedText = sanitizedText.replace(/^(\d+(?:\.\d+)*\.\s+[A-Za-zÀ-ỹ0-9\s,–—\-]{2,60}):(?!\*)[ \t]*/, '**$1:** ');
  // Standalone numbered headings without colon (e.g. "1. Khái niệm đơn thức", "2. Đơn thức thu gọn")
  sanitizedText = sanitizedText.replace(/^(\d+(?:\.\d+)*\.\s+(?!(?:Cho|Hãy|Tính|Tìm|Giải|Chứng\s*minh|Trong\s*các|Học\s*sinh|Giáo\s*viên\s*yêu\s*cầu|Điền|Vẽ|So\s*sánh|Rút\s*gọn|Nếu|Biết\s*rằng)\b)[A-Za-zÀ-ỹ0-9\s,–—\-]{2,50}?)(?::(?!\*)|\s*$)[ \t]*/, '**$1:** ');
  // Unify partially bolded numbered headings e.g. "1. **Khái niệm:**" or "**1.** Khái niệm:"
  sanitizedText = sanitizedText.replace(/^(\d+(?:\.\d+)*\.)\s*\*\*([^*]+)\*\*/, '**$1 $2**');
  sanitizedText = sanitizedText.replace(/^\*\*(\d+(?:\.\d+)*\.)\*\*\s*([^*:\n]+:)/, '**$1 $2**');

  // Sub-letter headings: a) Khái niệm:, b) Quy tắc:, a) Mục tiêu:
  sanitizedText = sanitizedText.replace(/^([a-d]\)\s+[A-Za-zÀ-ỹ0-9\s,–—\-]{2,50}?)(?::(?!\*)|\s*$)[ \t]*/i, '**$1:** ');

  // Pedagogical 4 steps: Bước 1: Chuyển giao nhiệm vụ
  sanitizedText = sanitizedText.replace(/^(Bước\s*[1-4][:.]\s*[^:\n*]+):?(?!\*)[ \t]*/i, '**$1:** ');

  // Pedagogical activity labels & exercise markers
  sanitizedText = sanitizedText.replace(/^((?:Hoạt\s*động|Nhiệm\s*vụ|Ví\s*dụ|Luyện\s*tập|Vận\s*dụng|Bài\s*tập|Bài|Thử\s*thách(?:\s*nhỏ)?|Tranh\s*luận|Khám\s*phá|Ghi\s*nhớ|Nhận\s*xét|Chú\s*ý|Định\s*nghĩa|Quy\s*tắc|Tính\s*chất|Công\s*thức|Lời\s*giải|Câu|Dạng)\s*(?:\d+(?:\.\d+)*[a-z]?)?):(?!\*)[ \t]*/i, '**$1:** ');

  // Specialized advanced homework & thought development labels
  sanitizedText = sanitizedText.replace(/^((?:Bài\s*tập\s*khó\s*phát\s*triển\s*tư\s*duy|Bài\s*tập\s*nâng\s*cao|Gợi\s*ý\s*phương\s*pháp\s*giải|Phương\s*pháp\s*giải|Bài\s*toán|Nhiệm\s*vụ\s*AI|Chuẩn\s*bị\s*bài\s*(?:sau|mới)|Ôn\s*tập\s*lý\s*thuyết))(?::(?!\*)|\s*$)[ \t]*/i, '**$1:** ');

  // Bullet items with bold headers: "- Ôn tập lý thuyết:", "- Hướng dẫn phương pháp giải bài tập SGK, SBT:"
  sanitizedText = sanitizedText.replace(/^([-+*•]\s*)((?:Hướng\s*dẫn\s*phương\s*pháp\s*giải\s*bài\s*tập[^:]*|Bài\s*tập\s*nâng\s*cao|Ôn\s*tập\s*lý\s*thuyết|Chuẩn\s*bị\s*bài\s*sau|Nhiệm\s*vụ\s*AI|Hướng\s*dẫn\s*tự\s*học)[^:]*):?(?!\*)[ \t]*/i, '$1**$2:** ');

  // Clean duplicate colons (e.g. **1. Khái niệm:** : -> **1. Khái niệm:**)
  sanitizedText = sanitizedText.replace(/\*\*([^*]+:)\*\*\s*:+/g, '**$1** ').replace(/(?::\s*){2,}/g, ': ');

  // Context-aware Capitalization inside paragraph (words of 2+ chars only to protect single math variables like x, y, a, b):
  // - First character after bullets (-, +, *, •, –, —)
  sanitizedText = sanitizedText.replace(/(^|[-+*•–—]\s*)([a-zà-ỹ]{2,})/g, (_m, lead, word) => lead + word.charAt(0).toUpperCase() + word.slice(1));
  // - First character after colon (e.g. ": thực hiện" -> ": Thực hiện", ": học sinh" -> ": Học sinh")
  sanitizedText = sanitizedText.replace(/(:\s*\*{0,2}[ \t]*)([a-zà-ỹ]{2,})/g, (_m, lead, word) => lead + word.charAt(0).toUpperCase() + word.slice(1));
  // - First character after numbered prefix ("1. ", "a) ")
  sanitizedText = sanitizedText.replace(/(^|\s\*{0,2})((?:\d+|[a-zA-Z]|[IVXLCDM]+)[.)][ \t]*)([a-zà-ỹ]{2,})/g, (_m, lead, prefix, word) => lead + prefix + word.charAt(0).toUpperCase() + word.slice(1));

  const rawClean = sanitizedText.replace(/\*/g, '').trim();
  const isRegularBulletLine = /^[-+*•]\s+/.test(rawClean);
  // Major section header: strictly short pedagogical headings (< 80 chars), NEVER full questions/exercises starting with numbers
  const isMajorHeaderLine =
    !isRegularBulletLine &&
    rawClean.length < 80 &&
    /^([1-5]\.\s*HOẠT ĐỘNG|[A-D]\.\s*HOẠT ĐỘNG|HOẠT ĐỘNG\s*\d+|[I|V|X]+\.\s*|[1-5]\.\s*(?:Khởi\s*động|Hình\s*thành|Luyện\s*tập|Vận\s*dụng|Mở\s*đầu|Kiến\s*thức|Năng\s*lực|Phẩm\s*chất|Giáo\s*viên|Học\s*sinh)|PHỤ LỤC\s*\d+|KẾ HOẠCH BÀI DẠY|GIÁO ÁN|TỔNG KẾT KIẾN THỨC|HƯỚNG DẪN VỀ NHÀ|Dặn dò\s*&)/i.test(rawClean);

  // Clean broken stray math delimiters (colons, bullets, unbalanced dollars)
  sanitizedText = sanitizedText
    .replace(/:\s*\$(?=\s*($|<br\s*\/?>|\n))/gi, ':')
    .replace(/(^|[\s\n|>])\$\s*:(?=\s)/g, '$1:')
    .replace(/^(\s*[-+*•–—]\s*)\$\s*(?=[a-zA-ZÀ-ỹ])/g, '$1');

  // Check if line has an odd number of $
  const dMatches = sanitizedText.match(/(?<!\\)\$/g);
  if (dMatches && dMatches.length % 2 === 1) {
    if (/(?<!\$)\$\s*([.,;:!?])\s*$/.test(sanitizedText)) {
      sanitizedText = sanitizedText.replace(/(?<!\$)\$\s*([.,;:!?])\s*$/, '$1');
    } else if (/(?<!\$)\$\s*$/.test(sanitizedText)) {
      sanitizedText = sanitizedText.replace(/(?<!\$)\$\s*$/, '');
    } else if (/^(\s*[-+*•–—]\s*)\$\s*/.test(sanitizedText)) {
      sanitizedText = sanitizedText.replace(/^(\s*[-+*•–—]\s*)\$\s*/, '$1');
    } else {
      const lastIdx = sanitizedText.lastIndexOf('$');
      sanitizedText = sanitizedText.slice(0, lastIdx) + sanitizedText.slice(lastIdx + 1);
    }
  }

  // Ensure all mathematical expressions (monomials, fractional coefficients, radicals, products) are wrapped in $...$
  sanitizedText = autoWrapVietnameseMathTokens(sanitizedText);

  const textRuns: (TextRun | DocxMath)[] = [];

  // Tokenize for Math formulas ($...$, $$...$$), TikZ blocks, Image placeholders, Bold, Italics, Code
  const tokenRegex = /(\$\$.*?\$\$|\$.*?\$|\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}|\[\[?.*?CHÈN.*?\]\]?|\[\s*HÌNH[_\s]?(?:VẼ|ẢNH)\s+MINH\s+HỌA.*?\]|\[.*?GIÁO\s+VIÊN\s+CHÈN\s+HÌNH.*?\]|!\[.*?\]\(.*?\)|\*\*.*?\*\*|\*(?!\*).*?\*|`.*?`)/gi;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(sanitizedText)) !== null) {
    if (match.index > lastIndex) {
      const plainText = sanitizedText.slice(lastIndex, match.index);
      const readablePlain = convertTeXToReadableUnicode(plainText).replace(/&nbsp;/gi, ' ').replace(/\*\*/g, '');
      textRuns.push(
        makeTextRunWithPreservedSpacing({
          text: readablePlain,
          bold: isMajorHeaderLine ? true : false,
          size: 28,
          color: '000000',
          font: 'Times New Roman'
        })
      );
    }

    const token = match[0];

    // 1. TikZ blocks -> Convert to prominent placeholder text instead of dumping raw code
    if (token.toLowerCase().startsWith('\\begin{tikzpicture}')) {
      textRuns.push(
        makeTextRunWithPreservedSpacing({
          text: '[ HÌNH VẼ MINH HỌA (TIKZ) - THẦY/CÔ CHÈN HÌNH THỦ CÔNG TẠI ĐÂY ]',
          bold: true,
          italics: true,
          size: 28,
          color: 'C00000', // Prominent Crimson Red
          font: 'Times New Roman'
        })
      );
    }
    // 2. Math formulas ($...$, $$...$$) -> Convert to native Microsoft Word DocxMath equations (<m:oMath>)
    // Supports textbook-grade horizontal fractions (MathFraction), radicals (MathRadical), angle hats (MathAccent), powers (MathSuperScript)
    else if (token.startsWith('$')) {
      const cleanMath = token.replace(/<br\s*\/?>/gi, '\n');
      const strippedText = cleanMath.replace(/^\$\$?|\$\$?$/g, '').trim();

      if (strippedText) {
        // Defensive check: if strippedText has Vietnamese accented words (e.g. "thức thu gọn", "có hệ số là")
        // NEVER parse as raw Word DocxMath, as Word displays variables in italics with no spaces!
        if (/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]/i.test(strippedText)) {
          const readable = convertTeXToReadableUnicode(strippedText).replace(/&nbsp;/gi, ' ');
          textRuns.push(
            makeTextRunWithPreservedSpacing({
              text: readable,
              bold: isMajorHeaderLine ? true : false,
              size: 28,
              color: '000000',
              font: 'Times New Roman'
            })
          );
        } else {
          const mathChildren = parseLatexMathToDocx(strippedText);
          if (mathChildren.length > 0) {
            textRuns.push(
              new DocxMath({
                children: mathChildren
              })
            );
          }
        }
      }
    }
    // 3. Image placeholders / Manual SGK insertion tags -> BOLD DISTINCT CRIMSON RED (#C00000)
    else if (
      (/CHÈN/i.test(token) || /HÌNH\s+(?:VẼ|ẢNH)/i.test(token) || /GIÁO\s+VIÊN\s+CHÈN/i.test(token) || token.startsWith('![') || token.startsWith('[[')) &&
      !/^\[\s*(?:\?|\.{3,}|[A-D0-9\s_-]+)\s*\]$/.test(token)
    ) {
      textRuns.push(
        makeTextRunWithPreservedSpacing({
          text: token.replace(/&nbsp;/gi, ' '),
          bold: true,
          italics: true,
          size: 28,
          color: 'C00000', // Prominent Crimson Red for easy spot
          font: 'Times New Roman'
        })
      );
    }
    // 4. Bold text (**bold**)
    else if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
      const boldText = convertTeXToReadableUnicode(token.slice(2, -2)).replace(/^[\s*#_]+|[\s*#_]+$/g, '').trim();
      textRuns.push(
        makeTextRunWithPreservedSpacing({
          text: boldText,
          bold: true,
          size: 28,
          color: '000000',
          font: 'Times New Roman'
        })
      );
    }
    // 5. Italic text (*italic*)
    else if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
      const innerText = token.slice(1, -1).trim();
      const cleanItalic = convertTeXToReadableUnicode(innerText).replace(/^[\s*#_]+|[\s*#_]+$/g, '').trim();

      // Check if this is a single variable like *x*, *y*, *z*, *a*, *b* -> render as native math!
      if (/^[a-zA-Z]$/.test(cleanItalic)) {
        const mathChildren = parseLatexMathToDocx(cleanItalic);
        textRuns.push(new DocxMath({ children: mathChildren }));
      }
      // Check if this is an explicitly intended pedagogical note: e.g. "(Ghi chú:...)", "(Xem hình...)", "(Hình...)"
      else if (/^\((?:ghi chú|lưu ý|xem hình|hình|chú thích|nguồn|sgk)/i.test(cleanItalic)) {
        textRuns.push(
          makeTextRunWithPreservedSpacing({
            text: cleanItalic,
            italics: true,
            size: 28,
            color: '000000',
            font: 'Times New Roman'
          })
        );
      }
      // Otherwise: Standard Vietnamese pedagogical text must be Roman / regular (chữ đứng), NOT arbitrary italics!
      else {
        textRuns.push(
          makeTextRunWithPreservedSpacing({
            text: cleanItalic,
            italics: false,
            bold: isMajorHeaderLine ? true : false,
            size: 28,
            color: '000000',
            font: 'Times New Roman'
          })
        );
      }
    }
    // 6. Inline code / math in backticks (`code`) -> Ensure uniform font & size (Times New Roman, 14pt = size 28)
    else if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
      const codeContent = convertTeXToReadableUnicode(token.slice(1, -1));
      textRuns.push(
        makeTextRunWithPreservedSpacing({
          text: codeContent,
          size: 28,
          color: '000000',
          font: 'Times New Roman'
        })
      );
    }
    // Fallback
    else {
      textRuns.push(
        makeTextRunWithPreservedSpacing({
          text: convertTeXToReadableUnicode(token).replace(/^[\s*#_]+|[\s*#_]+$/g, ''),
          bold: isMajorHeaderLine ? true : false,
          size: 28,
          color: '000000',
          font: 'Times New Roman'
        })
      );
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < sanitizedText.length) {
    const remainingText = sanitizedText.slice(lastIndex);
    const readableRemaining = convertTeXToReadableUnicode(remainingText).replace(/\*\*/g, '');
    textRuns.push(
      makeTextRunWithPreservedSpacing({
        text: readableRemaining,
        bold: isMajorHeaderLine ? true : false,
        size: 28,
        color: '000000',
        font: 'Times New Roman'
      })
    );
  }

  return new Paragraph({
    alignment,
    spacing: { before: 40, after: 40, line: 288 },
    children: textRuns
  });
}

function splitMarkdownTableRow(line: string): string[] {
  let safeLine = line.replace(/\\\|/g, '___ESCAPED_PIPE___');

  // Protect pipes inside $...$ or $$...$$
  safeLine = safeLine.replace(/(\$\$[\s\S]*?\$\$|\$[^\n$]+?\$)/g, (mathMatch) => {
    return mathMatch.replace(/\|/g, '___MATH_PIPE___');
  });

  // Protect pipes inside curly braces \{ ... \} or { ... }
  safeLine = safeLine.replace(/(\\\{[\s\S]*?\\\}|\{[^{}\n]*\|[^{}\n]*\})/g, (setMatch) => {
    return setMatch.replace(/\|/g, '___SET_PIPE___');
  });

  let cells = safeLine.split('|').map(c => c.trim());
  if (safeLine.trim().startsWith('|')) cells.shift();
  if (safeLine.trim().endsWith('|')) cells.pop();

  // Strip trailing empty cells
  while (cells.length > 2 && !cells[cells.length - 1]) {
    cells.pop();
  }

  return cells.map(c =>
    c.replace(/___ESCAPED_PIPE___/g, '\\vert ')
     .replace(/___MATH_PIPE___/g, '\\vert ')
     .replace(/___SET_PIPE___/g, '\\vert ')
  );
}

function normalizeTableRows(rows: string[][]): string[][] {
  if (rows.length === 0) return rows;

  const allTableText = rows.map(r => r.join(' ')).join(' ').toLowerCase();

  // 5512 Lesson Plan Activity Table detection: contains pedagogical markers
  const has5512Markers = rows.some(r =>
    r.some(cell => /(?:hoạt động của gv|hoạt động dạy học|dự kiến sản phẩm|sản phẩm dự kiến|bước\s*[1-4]|b[1-4][:.]|chuyển giao nhiệm vụ|thực hiện nhiệm vụ|báo cáo thảo luận|kết luận nhận định)/i.test(cell))
  );

  // Check if this table is an Appendix or School Schedule table
  const isPhuLucTable = !has5512Markers && /(?:phụ lục|kế hoạch dạy học của tổ|phân phối chương trình|khung kế hoạch giáo dục|tiết theo ppct|thiết bị dạy học|địa điểm dạy học)/i.test(allTableText);

  // Check if this table is a Signature / Approval table
  const isSigTable = !has5512Markers && /(?:duyệt của|xác nhận|người lập|tổ trưởng|ban giám hiệu|giáo viên soạn|hiệu trưởng|bùi sỹ nghĩa)/i.test(allTableText);

  // Check if this table is a Matrix, Exam Specification, Evaluation Rubric, or Assessment table
  const isMatrixOrSpecTable =
    !has5512Markers &&
    !isPhuLucTable &&
    !isSigTable &&
    (/(?:khung\s*ma\s*trận|bản\s*đặc\s*tả|bảng\s*đặc\s*tả|ma\s*trận\s*đề\s*kiểm\s*tra)/i.test(allTableText) ||
      rows.some(r => {
        const nonEmptyCells = r.filter(c => c && c.trim());
        return nonEmptyCells.length >= 4 && nonEmptyCells.some(c => /(?:nhận biết|thông hiểu|vận dụng cao|tnkq|tự luận|điểm số|tỉ lệ %|số câu)/i.test(c));
      }));

  const isLessonPlanActivityTable = has5512Markers;

  if (isLessonPlanActivityTable) {
    // 5512 Activity Tables MUST ALWAYS HAVE STRICTLY 2 COLUMNS!
    const resultRows: string[][] = [];

    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const rawRow = rows[rowIdx];
      // Clean trailing empty cells
      const row = [...rawRow];
      while (row.length > 2 && !row[row.length - 1]?.trim()) {
        row.pop();
      }

      // Header row: only normalize if row 0 is strictly a table column header (short labels, no activity steps)
      const isTrueHeaderRow =
        rowIdx === 0 &&
        row.length >= 2 &&
        (row[0] || '').trim().length < 80 &&
        (row[1] || '').trim().length < 80 &&
        !/(?:bước\s*\d|nhiệm vụ|sgk|luyện tập\s*\d|hoạt động\s*\d|\$)/i.test(row[0] || '') &&
        row.some(c => /hoạt động của gv|hoạt động dạy học|sản phẩm dự kiến|dự kiến sản phẩm/i.test(c));

      if (isTrueHeaderRow) {
        resultRows.push(['**Hoạt động của GV và HS**', '**Dự kiến sản phẩm**']);
        continue;
      }

      // Single-cell banner (e.g. TIẾT 2, Chương I)
      if (row.length === 1) {
        const c0 = (row[0] || '').trim();
        if (isProductContent(c0)) {
          // Check if previous row in resultRows can absorb this product as Col 2
          const prevIdx = resultRows.length - 1;
          let merged = false;
          if (prevIdx >= 0) {
            const prevRow = resultRows[prevIdx];
            if (prevRow.length === 2 && !prevRow[1]?.trim() && isActivityStepContent(prevRow[0])) {
              prevRow[1] = c0;
              merged = true;
            }
          }
          if (!merged) {
            resultRows.push(['', c0]);
          }
          continue;
        }

        const split = splitStepsAndProduct(c0);
        if (split.col2) {
          resultRows.push([split.col1, split.col2]);
        } else {
          resultRows.push(row);
        }
        continue;
      }

      // If row has 2 cells, but col 2 is empty and col 1 is an Activity Header Banner (e.g. "**1. HOẠT ĐỘNG KHỞI ĐỘNG**")
      const firstText = (row[0] || '').trim();
      const isActivityBanner = /^(?:\*\*)?(?:[1-5]\.\s*HOẠT\s*ĐỘNG|HOẠT\s*ĐỘNG\s*(?:[1-5]|KHỞI|HÌNH|LUYỆN|VẬN)|[A-D]\.\s*HOẠT\s*ĐỘNG|TIẾT\s+\d+|Chương|Phần|Chủ đề)/i.test(firstText);
      if (row.length === 2 && !row[1]?.trim() && isActivityBanner) {
        resultRows.push([row[0]]);
        continue;
      }

      if (row.length === 2) {
        let [c0, c1] = row;
        c0 = c0 || '';
        c1 = c1 || '';

        // Case 1: Col 1 has Product and Col 2 has Steps -> SWAP!
        if (isProductContent(c0) && isActivityStepContent(c1)) {
          resultRows.push([c1, c0]);
          continue;
        }

        // Case 2: Col 1 has Product and Col 2 is empty -> absorb into previous or ['', c0]
        if (!c1.trim() && isProductContent(c0)) {
          const prevIdx = resultRows.length - 1;
          let merged = false;
          if (prevIdx >= 0) {
            const prevRow = resultRows[prevIdx];
            if (prevRow.length === 2 && !prevRow[1]?.trim() && isActivityStepContent(prevRow[0])) {
              prevRow[1] = c0;
              merged = true;
            }
          }
          if (!merged) {
            resultRows.push(['', c0]);
          }
          continue;
        }

        // Case 3: Col 1 has both steps and product glued together, and Col 2 is empty
        if (!c1.trim()) {
          const split = splitStepsAndProduct(c0);
          if (split.col2) {
            resultRows.push([split.col1, split.col2]);
            continue;
          }
        }

        resultRows.push([c0, c1]);
        continue;
      }

      if (row.length === 3) {
        const [c0, c1, c2] = row;
        if (!c2 || !c2.trim()) {
          if (isProductContent(c1) || !isActivityStepContent(c1)) {
            resultRows.push([c0, c1]);
          } else {
            resultRows.push([`${c0}<br/>${c1}`, '']);
          }
          continue;
        }
        if (!c1 || !c1.trim()) {
          resultRows.push([c0, c2]);
          continue;
        }
        // If c2 is a summary/homework header or c1 is product (e.g. 4. Vận dụng), keep c0 as Col 1 and c1 as Col 2!
        const isC2Post = /^(?:\*\*)?(?:(?:IV|V)\.\s*)?(?:TỔNG\s*KẾT|HƯỚNG\s*DẪN|DẶN\s*DÒ)/i.test(c2);
        const isC1Prod = isProductContent(c1) || /^(?:\*\*)?(?:[1-5]\.\s*|[A-D]\.\s*)?(?:Vận\s*dụng|Luyện\s*tập|Khởi\s*động|Khám\s*phá|Hình\s*thành|Sản\s*phẩm|Lời\s*giải|Đáp\s*án|Giải\s*quyết)/i.test(c1);
        if (isC2Post || isC1Prod) {
          resultRows.push([c0, c1]);
          continue;
        }
        // If 3 columns (Step name, Teacher/Student interaction, Product)
        const combinedCol1 = `${c0}<br/>${c1}`;
        resultRows.push([combinedCol1, c2]);
        continue;
      }

      if (row.length > 3) {
        const col1 = row.slice(0, -1).filter(c => c && c.trim()).join('<br/>');
        const col2 = row[row.length - 1] || '';
        resultRows.push([col1, col2]);
        continue;
      }

      resultRows.push(row);
    }
    return resultRows;
  }

  // Generic & Matrix tables: Preserve ALL columns!
  let maxCols = 1;
  for (const r of rows) {
    if (r.length > maxCols) {
      maxCols = r.length;
    }
  }

  if (maxCols === 1) return rows;

  return rows.map(row => {
    // If a row has only 1 cell and represents a banner / header across table, leave it as 1 cell
    if (row.length === 1) {
      return row;
    }
    // If a row has the first cell as a Chapter/Semester/Topic title and all other cells are empty or dashes, collapse it to 1 cell so it spans across!
    const first = (row[0] || '').trim();
    const isHeaderLabel = /^(?:chương|phần|chủ đề|học kỳ|học kì|bài học stem|hoạt động trải nghiệm|kiểm tra|ôn tập|khung ma trận|bảng đặc tả)/i.test(first);
    const othersEmptyOrDash = row.slice(1).every(c => !c || !c.trim() || c.trim() === '-' || c.trim() === 'None');
    if (isHeaderLabel && othersEmptyOrDash) {
      return [first];
    }

    if (row.length > maxCols) {
      const fixedRow = row.slice(0, maxCols - 1);
      const extraTail = row.slice(maxCols - 1).join(' ');
      fixedRow.push(extraTail);
      return fixedRow;
    }
    return row;
  });
}

async function createDocxTable(rawRowsData: string[][], TOTAL_TABLE_WIDTH_DXA = 9070): Promise<Table> {
  if (rawRowsData.length === 0) {
    return new Table({ rows: [] });
  }

  const rowsData = normalizeTableRows(rawRowsData);
  const allTableText = rowsData.map(r => r.join(' ')).join(' ').toLowerCase();

  // Check if this table has educational content (Hoạt động, Bước, Mục tiêu, Sản phẩm, Kiến thức, v.v.)
  const hasEducationalContent = rowsData.some(row =>
    row.some(cell => /(?:hoạt động|bước\s*\d|mục tiêu|nội dung|sản phẩm|kiến thức|khởi động|luyện tập|vận dụng|chuyển giao|yêu cầu cần đạt|stt|tiết|bài tập|gv|hs|giáo viên|học sinh)/i.test(cell))
  );

  // Consider it a signature / approval table if it has NO educational content, is 6 rows or less, and contains signature/approval terms
  const isSignatureTable = !hasEducationalContent && rowsData.length <= 6 && (
    /(?:duyệt của bgh|xác nhận bgh|duyệt của tổ|người lập kế hoạch|tổ trưởng chuyên môn|ban giám hiệu|hiệu trưởng|người duyệt|giáo viên soạn|giáo viên bộ môn|chữ ký|kí và ghi rõ|ký và ghi rõ|bùi sỹ nghĩa)/i.test(allTableText) ||
    (/(?:duyệt|tổ trưởng|hiệu trưởng|ban giám hiệu|người lập)/i.test(allTableText) && /(?:ký|kí|họ tên)/i.test(allTableText))
  );

  const isMatrixOrSpecTable =
    /(?:ma trận|bản đặc tả|bảng đặc tả|khung ma trận|nhận biết|thông hiểu|vận dụng cao|tnkq|trắc nghiệm|tự luận|tổng số câu|tổng điểm|tỉ lệ %|cấp độ tư duy|mức độ nhận thức|đơn vị kiến thức|mạch kiến thức|số câu|số điểm|đáp án|phiếu soi|tiêu chí|rubric)/i.test(allTableText);

  const has5512Activity = rowsData.some(r =>
    r.some(cell => /(?:hoạt động của gv|hoạt động dạy học|dự kiến sản phẩm|sản phẩm dự kiến|bước\s*[1-4]|b[1-4][:.]|chuyển giao nhiệm vụ|thực hiện nhiệm vụ|báo cáo thảo luận|kết luận nhận định)/i.test(cell))
  );

  const isLessonPlanActivityTable = has5512Activity;

  const rawMaxCols = Math.max(...rowsData.map(r => r.length), 1);
  const maxCols = isLessonPlanActivityTable ? 2 : rawMaxCols;

  // Calculate explicit column widths array in dxa with full safety for any maxCols >= 1
  let colWidths: number[] = [];
  if (maxCols <= 1) {
    colWidths = [TOTAL_TABLE_WIDTH_DXA];
  } else if (TOTAL_TABLE_WIDTH_DXA > 10000) {
    // LANDSCAPE MODE (14,287 dxa total printable width)
    if (maxCols === 2) {
      colWidths = [7200, 7087];
    } else if (maxCols === 3) {
      colWidths = [2800, 7500, 3987];
    } else if (maxCols === 4) {
      colWidths = [1500, 5200, 2500, 5087];
    } else if (maxCols === 5) {
      // Phụ lục 1 / Phụ lục 2 / Phụ lục 3 (5 cột)
      colWidths = [800, 3600, 900, 7187, 1800];
    } else if (maxCols === 6) {
      // Phụ lục 1 (6 cột: STT, Bài học, Số tiết, Tiết theo PPCT, YCCĐ, Thiết bị)
      colWidths = [700, 3000, 750, 950, 7187, 1700];
    } else if (maxCols === 7) {
      // Phụ lục 3 (7 cột: STT, Bài học, Số tiết, Thời điểm, Thiết bị, Địa điểm, Ghi chú)
      colWidths = [650, 2600, 750, 950, 1500, 1400, 6437];
    } else if (maxCols === 8) {
      // Phụ lục 3 (8 cột: STT, Bài học, Tiết PPCT, Số tiết, Thời điểm, Thiết bị, Địa điểm, Ghi chú)
      colWidths = [600, 2300, 750, 700, 950, 1500, 1400, 6087];
    } else if (maxCols === 9) {
      // Phụ lục 2 Hoạt động giáo dục (9 cột)
      colWidths = [700, 2800, 3200, 800, 1100, 1400, 1400, 1200, 1687];
    } else if (maxCols === 10) {
      // 10-column Matrix Table
      colWidths = [600, 2600, 1200, 1200, 1200, 1200, 1200, 1200, 1800, 2087];
    } else if (maxCols === 11) {
      colWidths = [550, 2400, 1100, 1100, 1100, 1100, 1100, 1100, 1100, 1600, 1837];
    } else if (maxCols === 12) {
      colWidths = [500, 2200, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1500, 1887];
    } else if (maxCols === 13) {
      colWidths = [450, 2000, 950, 950, 950, 950, 950, 950, 950, 950, 950, 1400, 1787];
    } else if (maxCols === 14) {
      colWidths = [450, 1800, 900, 900, 900, 900, 900, 900, 900, 900, 900, 900, 1300, 1637];
    } else {
      const w0 = 500;
      const w1 = 2000;
      const rem = Math.max(0, TOTAL_TABLE_WIDTH_DXA - w0 - w1);
      const otherCols = Math.max(1, maxCols - 2);
      const restW = Math.max(100, Math.floor(rem / otherCols));
      const middleCols = Math.max(0, maxCols - 3);
      const lastW = Math.max(100, rem - restW * middleCols);
      colWidths = [w0, w1, ...Array(middleCols).fill(restW), lastW];
    }
  } else {
    // PORTRAIT MODE (9,070 dxa total printable width)
    if (maxCols === 2) {
      // Standard CV 5512 Table: Col 0 (Hoạt động GV/HS) 5100 dxa (~56%), Col 1 (Sản phẩm dự kiến / Nội dung) 3970 dxa (~44%)
      colWidths = [5100, 3970];
    } else if (maxCols === 3) {
      colWidths = [1800, 4500, 2770];
    } else if (maxCols === 4) {
      colWidths = [1000, 3200, 1800, 3070];
    } else if (maxCols === 5) {
      colWidths = [600, 2500, 700, 4170, 1100];
    } else if (maxCols === 6) {
      colWidths = [550, 2200, 600, 700, 4020, 1000];
    } else if (maxCols === 7) {
      colWidths = [500, 1900, 550, 750, 1050, 950, 3370];
    } else if (maxCols === 8) {
      colWidths = [450, 1700, 550, 550, 700, 950, 900, 3270];
    } else if (maxCols === 9) {
      colWidths = [450, 1600, 1800, 600, 800, 1000, 1000, 900, 920];
    } else if (maxCols === 10) {
      colWidths = [450, 1600, 750, 750, 750, 750, 750, 750, 1100, 1420];
    } else if (maxCols === 11) {
      colWidths = [400, 1500, 700, 700, 700, 700, 700, 700, 700, 1000, 1370];
    } else if (maxCols === 12) {
      colWidths = [400, 1400, 650, 650, 650, 650, 650, 650, 650, 650, 900, 1220];
    } else {
      const w0 = 400;
      const w1 = 1400;
      const rem = Math.max(0, TOTAL_TABLE_WIDTH_DXA - w0 - w1);
      const otherCols = Math.max(1, maxCols - 2);
      const restW = Math.max(100, Math.floor(rem / otherCols));
      const middleCols = Math.max(0, maxCols - 3);
      const lastW = Math.max(100, rem - restW * middleCols);
      colWidths = [w0, w1, ...Array(middleCols).fill(restW), lastW];
    }
  }

  // Strict safety check: Ensure colWidths has EXACTLY maxCols items and every value is a positive integer
  if (colWidths.length < maxCols) {
    const missing = maxCols - colWidths.length;
    const defaultW = Math.max(100, Math.floor(TOTAL_TABLE_WIDTH_DXA / maxCols));
    colWidths.push(...Array(Math.max(0, missing)).fill(defaultW));
  } else if (colWidths.length > maxCols) {
    colWidths = colWidths.slice(0, maxCols);
  }
  colWidths = colWidths.map(w => (Number.isFinite(w) && w > 0 ? Math.round(w) : Math.max(100, Math.floor(TOTAL_TABLE_WIDTH_DXA / maxCols))));

  const tableRows: TableRow[] = [];

  for (let rowIndex = 0; rowIndex < rowsData.length; rowIndex++) {
    const rowCells = rowsData[rowIndex];

    const paddedCells = [...rowCells];
    while (paddedCells.length < maxCols) {
      paddedCells.push('');
    }

    const firstCellText = paddedCells[0].trim();
    const secondCellText = paddedCells[1]?.trim() || '';

    const cleanFirst = firstCellText.replace(/[*#_`\[\]]/g, '').trim().toLowerCase();
    const cleanSecond = secondCellText.replace(/[*#_`\[\]]/g, '').trim().toLowerCase();

    // Check if this row is strictly a table column header (e.g. "Hoạt động của GV và HS", "Sản phẩm dự kiến", "STT")
    // MUST ONLY APPLY to rowIndex === 0 and MUST NOT be an activity or content row!
    const isStepOrContent =
      /(?:bước\s*\d|nhiệm vụ|sgk|trình chiếu|bài tập|luyện tập\s*\d|hoạt\s*động\s*\d|giao nhiệm vụ|thực hiện nhiệm vụ|báo cáo|kết luận|thảo luận|\$|\\in|\\notin|\\frac)/i.test(cleanFirst) ||
      cleanFirst.length > 70 ||
      cleanSecond.length > 70;

    const is5512Header =
      rowIndex === 0 &&
      !isStepOrContent &&
      (
        (cleanFirst.includes('hoạt động') && (cleanFirst.includes('gv') || cleanFirst.includes('dạy học') || cleanFirst.includes('giáo viên'))) ||
        (/^(?:hoạt\s*động\s*của\s*gv\s*và\s*hs|hoạt\s*động\s*dạy\s*học)$/i.test(cleanFirst))
      ) &&
      (
        cleanSecond.includes('sản phẩm') ||
        cleanSecond.includes('nội dung ghi') ||
        cleanSecond.includes('kết quả')
      );

    const isMatrixHeader =
      rowIndex === 0 &&
      !isStepOrContent &&
      /^(stt|tt|số tt|mạch nội dung|chủ đề|nội dung|mức độ|nhận biết|thông hiểu|vận dụng|tổng|đơn vị kiến thức|yêu cầu cần đạt|chuẩn cần đạt|câu hỏi|thời gian|điểm số|tỉ lệ|tiêu chí|phần|phương thức)/i.test(cleanFirst);

    const isGenericColHeader =
      rowIndex === 0 &&
      !isStepOrContent &&
      /^(stt|tt|số tt|tên bài|chủ đề|yêu cầu cần đạt|thiết bị|học liệu|môn học|thời lượng|địa điểm|chủ trì|hình thức|câu|đáp án)/i.test(cleanFirst) &&
      cleanFirst.length < 50;

    const isHeader = rowIndex === 0 && (is5512Header || isGenericColHeader || isMatrixHeader);

    // Check if this row is a Chapter/Section Header or Activity Banner (e.g. "Chương I:...", "HỌC KỲ I", "1. HOẠT ĐỘNG KHỞI ĐỘNG")
    // ONLY span across columns if ALL OTHER cells in the row are completely empty OR original row only had 1 cell!
    const restCellsEmpty = paddedCells.slice(1).every(c => !c.trim());
    const isSectionHeaderRow =
      !isHeader &&
      !isStepOrContent &&
      restCellsEmpty &&
      (
        rowCells.length === 1 ||
        /^(chương|chủ đề|học kỳ|phần|tiết|bài|mục|tổng\s*số|bảng\s*phân\s*phối|phụ\s*lục|[1-5]\.\s*hoạt\s*động|hoạt\s*động\s*(?:[1-5]|khởi\s*động|hình\s*thành|luyện\s*tập|vận\s*dụng)|[a-d]\.\s*hoạt\s*động)/i.test(cleanFirst)
      );

    const cells: TableCell[] = [];

    if (isSectionHeaderRow && maxCols > 1) {
      const borderStyleCell = isSignatureTable
        ? { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
        : { style: BorderStyle.SINGLE, size: 6, color: '000000' };

      const isTietSection = /^(?:tiết|chủ đề|bài)\b/i.test(cleanFirst);
      const headerAlignment = isTietSection ? AlignmentType.CENTER : AlignmentType.LEFT;

      // Span across all columns for Chapter / Section Title rows!
      const cleanHeaderLines = firstCellText
        .replace(/(?:<br\s*\/?>\s*)+[-*_=]{2,}(?:\s*<br\s*\/?>)+/gi, '\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&emsp;/gi, ' ')
        .replace(/&ensp;/gi, ' ')
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);

      const formatSectionTitle = (lineStr: string) => {
        if (!isTietSection) return lineStr;
        return lineStr.replace(/(\$\$[\s\S]*?\$\$|\$[^\$]+\$)|([^$]+)/g, (_m, mathPart, textPart) => {
          if (mathPart) return mathPart;
          return (textPart || '').toUpperCase();
        });
      };

      const headerParagraphs = cleanHeaderLines.length > 0
        ? cleanHeaderLines.map(l => createFormattedParagraph(formatSectionTitle(l), headerAlignment))
        : [createFormattedParagraph('', headerAlignment)];

      cells.push(
        new TableCell({
          width: { size: TOTAL_TABLE_WIDTH_DXA, type: WidthType.DXA },
          columnSpan: maxCols,
          verticalAlign: VerticalAlign.CENTER,
          shading: undefined, // NO cell background shading
          margins: { top: 120, bottom: 120, left: 150, right: 150 },
          borders: {
            top: borderStyleCell,
            bottom: borderStyleCell,
            left: borderStyleCell,
            right: borderStyleCell
          },
          children: headerParagraphs
        })
      );
    } else {
      for (let colIndex = 0; colIndex < paddedCells.length; colIndex++) {
        const cellText = paddedCells[colIndex];
        const cellW = colWidths[colIndex] || Math.floor(TOTAL_TABLE_WIDTH_DXA / maxCols);

        // Pre-unpack LaTeX aligned environments so equation steps become separate lines before split
        const unpackedCellText = unpackLatexAlignedEnvironments(cellText);

        // Clean HTML tags, br tags, HTML entities, and "máy chiếu"
        let cleanCellText = unpackedCellText
          .replace(/(?:<br\s*\/?>\s*)+[-*_=]{2,}(?:\s*<br\s*\/?>)+/gi, '<br/><br/>')
          .replace(/<br\s*\/?>\s*[-*_=]{2,}/gi, '<br/>')
          .replace(/[-*_=]{2,}\s*<br\s*\/?>/gi, '<br/>')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/gi, ' ')
          .replace(/&emsp;/gi, ' ')
          .replace(/&ensp;/gi, ' ')
          .replace(/&amp;/gi, '&')
          .replace(/&lt;/gi, '<')
          .replace(/&gt;/gi, '>')
          .replace(/máy chiếu/gi, 'máy tính, tivi')
          .replace(/Máy chiếu/gi, 'Máy tính, tivi');

        // Ensure pedagogical steps, questions, and examples always start on a fresh newline
        cleanCellText = cleanCellText
          .replace(/([^\n])\s*(?:\*\*)?(Bước\s*[1-4]|B[1-4][:.]|Hoạt\s*động\s*\d+[:.])\s*(Giao\s*nhiệm\s*vụ|Thực\s*hiện|Báo\s*cáo|Kết\s*luận|Chuyển\s*giao)/gi, '$1\n**$2: $3**')
          .replace(/([^\n])\s*(\*\*(?:Bước\s*[1-4]|Hoạt\s*động\s*\d+):?)/gi, '$1\n$2')
          .replace(/([^\n])\s*(\*\*(?:Ví\s*dụ\s*\d*|Luyện\s*tập\s*\d*|Ghi\s*nhớ|Chú\s*ý|Nhận\s*xét|Định\s*nghĩa|Vận\s*dụng\s*\d*|Khám\s*phá\s*\d*):?)/gi, '$1\n$2')
          .replace(/([^\n])\s*(\*(?:Ví\s*dụ\s*\d*|Luyện\s*tập\s*\d*|Ghi\s*nhớ|Chú\s*ý):)/gi, '$1\n$2');

        const rawLines = cleanCellText
          .split('\n')
          .map(l => l.trim())
          .filter(l => l.length > 0 && !/^[-*_=]{2,}\s*$/.test(l));

        // Filter out redundant activity metadata and stray letters ONLY for 5512 lesson plan activity tables
        const lines = rawLines.filter(l => {
          const t = l.trim();
          if (!t) return false;
          if (!isLessonPlanActivityTable) return true;
          // Stray letters: "a", "a)", "b", "c", "d"
          if (/^(?:\*\*)?[a-d][.)]?(?:\*\*)?$/i.test(t)) return false;
          // Redundant activity metadata: "Mục tiêu: ...", "b) Phương pháp & Kĩ thuật: ...", "c) Tiến trình tổ chức:"
          if (/^(?:\*\*)?(?:[a-d1-4][.)]?[ \t]*)?(?:Mục\s*tiêu|Phương\s*pháp(?:\s*(?:&|và)?\s*K[ĩỹ]\s*thuật)?|Nội\s*dung(?:\s*dạy\s*học)?|Sản\s*phẩm(?:\s*học\s*tập)?)(?:\*\*)?\s*:/i.test(t)) return false;
          if (/^(?:\*\*)?(?:[a-d1-4][.)]?[ \t]*)?(?:Tiến\s*trình\s*tổ\s*chức|Tổ\s*chức\s*thực\s*hiện|Tiến\s*trình\s*dạy\s*học|Tiến\s*trình\s*hoạt\s*động)(?:\*\*)?\s*:?$/i.test(t)) return false;
          return true;
        });

        const cellParagraphs: Paragraph[] = [];
        if (lines.length === 0) {
          cellParagraphs.push(new Paragraph({ children: [new TextRun({ text: '', size: 28, font: 'Times New Roman' })] }));
        } else if (isHeader) {
          lines.forEach(line => {
            cellParagraphs.push(
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80, after: 80 },
                children: [
                  new TextRun({
                    text: normalizeVietnameseTerminology(line).replace(/\*\*/g, '').toUpperCase(),
                    bold: true,
                    size: 28,
                    color: '000000',
                    font: 'Times New Roman'
                  })
                ]
              })
            );
          });
        } else {
          let inTikz = false;
          let tikzLines: string[] = [];

          for (let lIdx = 0; lIdx < lines.length; lIdx++) {
            const line = lines[lIdx];
            if (!line) continue;

            if (line.includes('\\begin{tikzpicture}')) {
              inTikz = true;
              tikzLines = [line];
              if (line.includes('\\end{tikzpicture}')) {
                inTikz = false;
                const fullTikz = tikzLines.join('\n');
                const imgBuf = await fetchTikzImageBuffer(fullTikz);
                if (imgBuf) {
                  cellParagraphs.push(
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 100, after: 100 },
                      children: [
                        new ImageRun({
                          data: imgBuf,
                          transformation: { width: 340, height: 210 },
                          type: 'png'
                        })
                      ]
                    })
                  );
                } else {
                  cellParagraphs.push(createFormattedParagraph('[ Sơ đồ TikZ ]', AlignmentType.CENTER));
                }
              }
              continue;
            }

            if (inTikz) {
              tikzLines.push(line);
              if (line.includes('\\end{tikzpicture}')) {
                inTikz = false;
                const fullTikz = tikzLines.join('\n');
                const imgBuf = await fetchTikzImageBuffer(fullTikz);
                if (imgBuf) {
                  cellParagraphs.push(
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 100, after: 100 },
                      children: [
                        new ImageRun({
                          data: imgBuf,
                          transformation: { width: 340, height: 210 },
                          type: 'png'
                        })
                      ]
                    })
                  );
                } else {
                  cellParagraphs.push(createFormattedParagraph('[ Sơ đồ TikZ ]', AlignmentType.CENTER));
                }
              }
              continue;
            }

            if (isSignatureTable) {
              if (/k[yí]\s*(?:và|,)\s*(?:ghi\s*rõ|đóng\s*dấu)/i.test(line)) {
                continue;
              }
              const isNameLine = !/duyệt của|tổ trưởng|xác nhận|người lập|ban giám hiệu/i.test(line);
              cellParagraphs.push(
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: isNameLine ? 500 : 80, after: 80 },
                  children: [
                    new TextRun({
                      text: line.replace(/^[\s#*]+|[\s#*]+$/g, ''),
                      bold: true,
                      size: 28,
                      color: '000000',
                      font: 'Times New Roman'
                    })
                  ]
                })
              );
              continue;
            }

            const defaultAlign = AlignmentType.LEFT;
            const normalizedLine = normalizeVietnameseTerminology(line);
            cellParagraphs.push(createFormattedParagraph(normalizedLine, defaultAlign));
          }
        }

        const borderStyleCell = isSignatureTable
          ? { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
          : { style: BorderStyle.SINGLE, size: 8, color: '000000' };

        cells.push(
          new TableCell({
            width: {
              size: cellW,
              type: WidthType.DXA
            },
            verticalAlign: VerticalAlign.TOP,
            shading: undefined, // NO cell background shading
            margins: { top: 100, bottom: 100, left: 150, right: 150 },
            borders: {
              top: borderStyleCell,
              bottom: borderStyleCell,
              left: borderStyleCell,
              right: borderStyleCell
            },
            children: cellParagraphs
          })
        );
      }
    }

    // In Microsoft Word, tableHeader (tblHeader) automatically repeats the header row
    // ("HOẠT ĐỘNG CỦA GV VÀ HS | DỰ KIẾN SẢN PHẨM" or "STT | Tên bài | ...") across subsequent content pages.
    // Setting tableHeader: isHeader && !isSignatureTable ensures that:
    // 1. Content pages spanning multiple pages repeat the column headers.
    // 2. The signature table (separated as its own table) NEVER repeats the activity header.
    // 3. If the last page has remaining activity content, the header repeats above that content, followed by the signature block.
    tableRows.push(
      new TableRow({
        tableHeader: isHeader && !isSignatureTable,
        cantSplit: isHeader || isSignatureTable,
        children: cells
      })
    );
  }

  const borderStyle = isSignatureTable
    ? { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
    : { style: BorderStyle.SINGLE, size: 8, color: '000000' };

  return new Table({
    width: { size: TOTAL_TABLE_WIDTH_DXA, type: WidthType.DXA },
    alignment: AlignmentType.CENTER,
    columnWidths: colWidths,
    layout: TableLayoutType.FIXED,
    borders: {
      top: borderStyle,
      bottom: borderStyle,
      left: borderStyle,
      right: borderStyle,
      insideHorizontal: borderStyle,
      insideVertical: borderStyle
    },
    rows: tableRows
  });
}

const CIRCLED_DIGITS = ['⓪', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨'];
const CIRCLED_LETTERS = ['Ⓐ', 'Ⓑ', 'Ⓒ', 'Ⓓ'];

/**
 * Generates the authentic Hanoi DoET Grade 10 THPT Standard OMR Bubble Sheet (Fits strictly on 1 Single A4 page).
 * Uses real circular bubbles (⓪-⑨ for digits, Ⓐ-Ⓓ for options), large size, and wide spacing for accurate OCR & pencil filling.
 */
export async function exportHanoiStandardBubbleSheet(options?: {
  questionCount?: number;
  monHoc?: string;
  lop?: string;
  schoolName?: string;
  examTitle?: string;
  teacherName?: string;
  fileName?: string;
}): Promise<void> {
  const count = options?.questionCount || 40;
  const monHoc = options?.monHoc || 'TOÁN HỌC';
  const lop = options?.lop || '9';
  const schoolName = options?.schoolName || 'TRƯỜNG THCS PHÙNG KHẮC KHOAN';
  const examTitle = options?.examTitle || 'KỲ THI TUYỂN SINH VÀO LỚP 10 THPT';
  const fileName = options?.fileName || `Phieu_To_Trac_Nghiem_Chuan_SoGDHN_${count}_Cau.docx`;

  const borderNone = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const borderThin = { style: BorderStyle.SINGLE, size: 4, color: '333333' };
  const borderSolid = { style: BorderStyle.SINGLE, size: 6, color: '1E293B' };

  // 1. Header Table (2 columns: Sở / Trường vs Tên Phiếu)
  const headerTable = new Table({
    width: { size: 10500, type: WidthType.DXA },
    columnWidths: [5800, 4700],
    layout: TableLayoutType.FIXED,
    borders: {
      top: borderNone,
      bottom: borderNone,
      left: borderNone,
      right: borderNone,
      insideHorizontal: borderNone,
      insideVertical: borderNone
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 5800, type: WidthType.DXA },
            margins: { top: 30, bottom: 30, left: 50, right: 50 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 15 },
                children: [
                  new TextRun({ text: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO HÀ NỘI', bold: true, size: 20, font: 'Times New Roman' }),
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 15 },
                children: [
                  new TextRun({ text: schoolName.toUpperCase(), bold: true, size: 20, font: 'Times New Roman' }),
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({ text: examTitle.toUpperCase(), italics: true, size: 18, font: 'Times New Roman' }),
                ]
              })
            ]
          }),
          new TableCell({
            width: { size: 4700, type: WidthType.DXA },
            margins: { top: 30, bottom: 30, left: 50, right: 50 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 15 },
                children: [
                  new TextRun({ text: 'PHIẾU TRẢ LỜI TRẮC NGHIỆM', bold: true, size: 24, color: 'B91C1C', font: 'Times New Roman' }),
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 15 },
                children: [
                  new TextRun({ text: `MÔN THI: ${monHoc.toUpperCase()} - LỚP: ${lop}`, bold: true, size: 20, font: 'Times New Roman' }),
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({ text: `(Dành cho bài thi trắc nghiệm chuẩn ${count} câu - Ô tròn OMR)`, italics: true, size: 17, font: 'Times New Roman' }),
                ]
              })
            ]
          })
        ]
      })
    ]
  });

  // 2. SBD Table (6 columns for 6 digits: 0-9 with genuine circled numbers ⓪..⑨)
  const sbdHeaderRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 6,
          width: { size: 2600, type: WidthType.DXA },
          margins: { top: 20, bottom: 20, left: 20, right: 20 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'SỐ BÁO DANH', bold: true, size: 17, font: 'Times New Roman' })]
            })
          ]
        })
      ]
    }),
    new TableRow({
      children: Array(6).fill(null).map(() => new TableCell({
        width: { size: 433, type: WidthType.DXA },
        margins: { top: 20, bottom: 20, left: 5, right: 5 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `   `, size: 16, font: 'Times New Roman' })]
          })
        ]
      }))
    })
  ];

  for (let digit = 0; digit <= 9; digit++) {
    sbdHeaderRows.push(
      new TableRow({
        children: Array(6).fill(null).map(() => new TableCell({
          width: { size: 433, type: WidthType.DXA },
          margins: { top: 12, bottom: 12, left: 2, right: 2 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 0 },
              children: [
                new TextRun({
                  text: CIRCLED_DIGITS[digit],
                  bold: true,
                  size: 22,
                  font: 'Segoe UI Symbol'
                })
              ]
            })
          ]
        }))
      })
    );
  }

  const sbdTable = new Table({
    width: { size: 2600, type: WidthType.DXA },
    borders: {
      top: borderThin,
      bottom: borderThin,
      left: borderThin,
      right: borderThin,
      insideHorizontal: borderThin,
      insideVertical: borderThin
    },
    rows: sbdHeaderRows
  });

  // 3. Mã Đề Table (3 columns for 3 digits: 0-9 with genuine circled numbers ⓪..⑨)
  const maDeHeaderRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 3,
          width: { size: 1600, type: WidthType.DXA },
          margins: { top: 20, bottom: 20, left: 20, right: 20 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'MÃ ĐỀ THI', bold: true, size: 17, font: 'Times New Roman' })]
            })
          ]
        })
      ]
    }),
    new TableRow({
      children: Array(3).fill(null).map(() => new TableCell({
        width: { size: 533, type: WidthType.DXA },
        margins: { top: 20, bottom: 20, left: 5, right: 5 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `   `, size: 16, font: 'Times New Roman' })]
          })
        ]
      }))
    })
  ];

  for (let digit = 0; digit <= 9; digit++) {
    maDeHeaderRows.push(
      new TableRow({
        children: Array(3).fill(null).map(() => new TableCell({
          width: { size: 533, type: WidthType.DXA },
          margins: { top: 12, bottom: 12, left: 2, right: 2 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 0 },
              children: [
                new TextRun({
                  text: CIRCLED_DIGITS[digit],
                  bold: true,
                  size: 22,
                  font: 'Segoe UI Symbol'
                })
              ]
            })
          ]
        }))
      })
    );
  }

  const maDeTable = new Table({
    width: { size: 1600, type: WidthType.DXA },
    borders: {
      top: borderThin,
      bottom: borderThin,
      left: borderThin,
      right: borderThin,
      insideHorizontal: borderThin,
      insideVertical: borderThin
    },
    rows: maDeHeaderRows
  });

  const studentInfoCell = new TableCell({
    width: { size: 6100, type: WidthType.DXA },
    margins: { top: 35, bottom: 35, left: 50, right: 50 },
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 0, after: 20 },
        children: [
          new TextRun({ text: '1. Họ và tên thí sinh: ', bold: true, size: 18, font: 'Times New Roman' }),
          new TextRun({ text: '................................................ Giới tính: ...........', size: 18, font: 'Times New Roman' })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 0, after: 20 },
        children: [
          new TextRun({ text: '2. Ngày sinh: ', bold: true, size: 18, font: 'Times New Roman' }),
          new TextRun({ text: '...../...../200...    ', size: 18, font: 'Times New Roman' }),
          new TextRun({ text: 'Nơi sinh: ', bold: true, size: 18, font: 'Times New Roman' }),
          new TextRun({ text: '................................................', size: 18, font: 'Times New Roman' })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 0, after: 20 },
        children: [
          new TextRun({ text: '3. Học sinh trường: ', bold: true, size: 18, font: 'Times New Roman' }),
          new TextRun({ text: `${schoolName} - Lớp: .............`, size: 18, font: 'Times New Roman' })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 0, after: 20 },
        children: [
          new TextRun({ text: '4. Phòng thi số: ', bold: true, size: 18, font: 'Times New Roman' }),
          new TextRun({ text: '............ Điểm thi: ............................................', size: 18, font: 'Times New Roman' })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 0, after: 15 },
        children: [
          new TextRun({ text: '5. Cán bộ coi thi 1: ', bold: true, size: 18, font: 'Times New Roman' }),
          new TextRun({ text: '................ Cán bộ coi thi 2: ................', size: 18, font: 'Times New Roman' })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 10, after: 0 },
        children: [
          new TextRun({ text: 'HƯỚNG DẪN TÔ ĐÚNG QUY CÁCH: ', bold: true, size: 17, color: 'B91C1C', font: 'Times New Roman' }),
          new TextRun({ text: '\n• Dùng bút chì 2B tô tròn và đậm kín ô. ĐÚNG: ', size: 16, font: 'Times New Roman' }),
          new TextRun({ text: '[ ⬤ ]', bold: true, color: '000000', size: 17, font: 'Segoe UI Symbol' }),
          new TextRun({ text: '  |  SAI: [ ◯ ]  [ ✕ ]  [ ✓ ]  [ ─ ]', size: 16, font: 'Segoe UI Symbol' })
        ]
      })
    ]
  });

  const middleInfoTable = new Table({
    width: { size: 10500, type: WidthType.DXA },
    columnWidths: [6100, 2700, 1700],
    layout: TableLayoutType.FIXED,
    borders: {
      top: borderThin,
      bottom: borderThin,
      left: borderThin,
      right: borderThin,
      insideHorizontal: borderThin,
      insideVertical: borderThin
    },
    rows: [
      new TableRow({
        children: [
          studentInfoCell,
          new TableCell({
            width: { size: 2700, type: WidthType.DXA },
            margins: { top: 15, bottom: 15, left: 15, right: 15 },
            children: [sbdTable]
          }),
          new TableCell({
            width: { size: 1700, type: WidthType.DXA },
            margins: { top: 15, bottom: 15, left: 15, right: 15 },
            children: [maDeTable]
          })
        ]
      })
    ]
  });

  // 4. Answer Sheet Grid: Real Circular Bubbles (Ⓐ Ⓑ Ⓒ Ⓓ) with Large Size and Wide Spacing
  // Choose columns based on question count:
  // <= 20 questions: 2 columns (10 rows per col)
  // <= 40 questions: 4 columns (10 rows per col)
  // <= 50 questions: 5 columns (10 rows per col) or 4 columns (13 rows per col)
  const safeCount = Math.max(1, Math.min(120, Math.round(Number(count) || 40)));
  let numCols = 4;
  if (safeCount <= 20) numCols = 2;
  else if (safeCount <= 30) numCols = 3;
  else if (safeCount <= 40) numCols = 4;
  else numCols = 5;

  const safeCols = Math.max(1, Math.min(10, numCols));
  const rowsPerCol = Math.ceil(safeCount / safeCols);
  const colWidth = Math.floor(10500 / safeCols);
  const colWidths = Array(safeCols).fill(colWidth);
  // Adjust last column to ensure total matches exactly 10500
  colWidths[safeCols - 1] = 10500 - (colWidth * (safeCols - 1));

  const answerTableRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          columnSpan: numCols,
          width: { size: 10500, type: WidthType.DXA },
          margins: { top: 40, bottom: 40, left: 50, right: 50 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: '■   PHẦN TRẢ LỜI TRẮC NGHIỆM (TÔ KÍN Ô TRÒN Ⓐ Ⓑ Ⓒ Ⓓ BẰNG BÚT CHÌ 2B)   ■',
                  bold: true,
                  size: 20,
                  color: '002060',
                  font: 'Times New Roman'
                })
              ]
            })
          ]
        })
      ]
    })
  ];

  for (let r = 0; r < rowsPerCol; r++) {
    const rowCells: TableCell[] = [];
    for (let c = 0; c < numCols; c++) {
      const qNum = c * rowsPerCol + r + 1;
      const currentCellW = colWidths[c];

      if (qNum <= count) {
        const formattedNum = qNum < 10 ? `0${qNum}` : `${qNum}`;
        rowCells.push(
          new TableCell({
            width: { size: currentCellW, type: WidthType.DXA },
            margins: { top: 35, bottom: 35, left: 25, right: 25 },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: `${formattedNum}. `,
                    bold: true,
                    size: 20,
                    font: 'Times New Roman'
                  }),
                  new TextRun({
                    text: ' Ⓐ',
                    bold: true,
                    size: 28, // Large high-contrast circle for easy filling and zero scan errors
                    color: '1E293B',
                    font: 'Segoe UI Symbol'
                  }),
                  new TextRun({
                    text: '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0Ⓑ',
                    bold: true,
                    size: 28,
                    color: '1E293B',
                    font: 'Segoe UI Symbol'
                  }),
                  new TextRun({
                    text: '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0Ⓒ',
                    bold: true,
                    size: 28,
                    color: '1E293B',
                    font: 'Segoe UI Symbol'
                  }),
                  new TextRun({
                    text: '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0Ⓓ',
                    bold: true,
                    size: 28,
                    color: '1E293B',
                    font: 'Segoe UI Symbol'
                  })
                ]
              })
            ]
          })
        );
      } else {
        rowCells.push(
          new TableCell({
            width: { size: currentCellW, type: WidthType.DXA },
            margins: { top: 35, bottom: 35, left: 25, right: 25 },
            children: [new Paragraph({ children: [new TextRun({ text: '', size: 18 })] })]
          })
        );
      }
    }
    answerTableRows.push(new TableRow({ children: rowCells }));
  }

  const answerTable = new Table({
    width: { size: 10500, type: WidthType.DXA },
    columnWidths: colWidths,
    layout: TableLayoutType.FIXED,
    borders: {
      top: borderThin,
      bottom: borderThin,
      left: borderThin,
      right: borderThin,
      insideHorizontal: borderThin,
      insideVertical: borderThin
    },
    rows: answerTableRows
  });

  // Check VIP for bubble sheet
  let isVipActive = false;
  if (typeof window !== 'undefined') {
    try {
      const savedKey = localStorage.getItem(STORAGE_KEY_SAVED_LICENSE) || '';
      if (savedKey) {
        const res = validateLicenseKey(savedKey);
        isVipActive = res.valid;
      }
    } catch (e) {}
  }

  const docChildren = [
    headerTable,
    new Paragraph({ spacing: { before: 30, after: 30 }, children: [] }),
    middleInfoTable,
    new Paragraph({ spacing: { before: 30, after: 30 }, children: [] }),
    answerTable
  ];

  if (!isVipActive) {
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 0 },
        children: [
          new TextRun({
            text: '⚠️ Bản quyền phiếu thi: Thầy Cấn Văn Trường (Zalo: 0988.302.636) — Nhập mã VIP để xóa dòng bản quyền.',
            italics: true,
            color: '6B7280',
            size: 16,
            font: 'Times New Roman'
          })
        ]
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 500,
              bottom: 500,
              left: 600,
              right: 600
            }
          }
        },
        children: docChildren
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, fileName);
}

