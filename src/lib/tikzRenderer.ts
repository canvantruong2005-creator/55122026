/**
 * TikZ to SVG Renderer and Utilities
 * Provides vector SVG rendering for geometric shapes, function plots, coordinate grids, and physics/chemistry figures,
 * as well as LaTeX formatting helpers and Overleaf template code generation.
 */

export interface ParsedTikzShape {
  type: 'line' | 'polygon' | 'circle' | 'rectangle' | 'node' | 'plot' | 'arrow' | 'axis';
  points?: { x: number; y: number }[];
  center?: { x: number; y: number };
  radius?: number;
  width?: number;
  height?: number;
  text?: string;
  color?: string;
  fillColor?: string;
  dashed?: boolean;
  strokeWidth?: number;
}

export function extractTikzBlocks(text: string): { code: string; fullMatch: string }[] {
  const regex = /\\begin\{tikzpicture\}([\s\S]*?)\\end\{tikzpicture\}/g;
  const blocks: { code: string; fullMatch: string }[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    blocks.push({
      code: match[1].trim(),
      fullMatch: match[0]
    });
  }
  return blocks;
}

export function cleanTikzCode(code: string): string {
  let cleaned = code.replace(/\\texttt\{([^}]*)\}/g, '$1');
  cleaned = cleaned.replace(/\\text\{([^}]*)\}/g, '$1');
  cleaned = cleaned.replace(/^\$+|\$+$/g, '').trim();
  if (!cleaned.includes('\\begin{tikzpicture}')) {
    cleaned = `\\begin{tikzpicture}\n${cleaned}\n\\end{tikzpicture}`;
  }
  return cleaned;
}

export function generateOverleafTemplate(tikzCode: string, title: string = "Hinh_Ve_TikZ"): string {
  const cleanCode = cleanTikzCode(tikzCode);
  return `% =========================================================
% MÃ TIKZ CHO OVERLEAF - BẢN QUYỀN AI LESSON PLANNER PRO
% Bài/Tên hình: ${title}
% Hướng dẫn: Dán nguyên nội dung này vào file main.tex trên Overleaf
% =========================================================
\\documentclass[tikz, border=10pt]{standalone}
\\usepackage{amsmath, amsfonts, amssymb}
\\usepackage{tikz}
\\usetikzlibrary{calc, shapes, arrows, angles, quotes, patterns}

\\begin{document}

${cleanCode}

\\end{document}`;
}

export function evalTikzMath(expr: string, x: number): number {
  try {
    let clean = expr
      .replace(/\\x/g, 'x')
      .replace(/[\{\}]/g, '')
      .replace(/\^/g, '**')
      .replace(/(\d+)\s*x/gi, '$1*x')
      .replace(/x\s*x/gi, 'x*x');
    
    const sanitized = clean.replace(/\bx\b/gi, `(${x})`);
    const func = new Function(`return (${sanitized});`);
    const val = func();
    return typeof val === 'number' && !isNaN(val) ? val : 0;
  } catch (e) {
    return 0;
  }
}

/**
 * Intelligent TikZ to SVG converter that renders coordinates, triangles, shapes, 
 * coordinate axes, nodes, and function plots into vector SVG elements.
 */
export function convertTikzToSvg(tikzBody: string, svgWidth = 520, svgHeight = 380): string {
  // Parse explicit coordinates like \coordinate (A) at (0,3); or \filldraw (2,-1) circle...
  const coordinates: Record<string, { x: number; y: number }> = {};
  const explicitPoints: { x: number; y: number; label?: string }[] = [];

  // 1. Extract \coordinate (A) at (x,y);
  const coordRegex = /\\coordinate\s*\(([A-Za-z0-9_]+)\)\s*at\s*\((-?\d*\.?\d+),\s*(-?\d*\.?\d+)\);/g;
  let match;
  while ((match = coordRegex.exec(tikzBody)) !== null) {
    const pt = { x: parseFloat(match[2]), y: parseFloat(match[3]) };
    coordinates[match[1]] = pt;
    explicitPoints.push({ ...pt, label: match[1] });
  }

  // 2. Extract explicit point coordinates in \filldraw, \node, \draw: (-2,0), (2,-1), etc.
  const rawPtRegex = /\((-?\d*\.?\d+),\s*(-?\d*\.?\d+)\)/g;
  while ((match = rawPtRegex.exec(tikzBody)) !== null) {
    const px = parseFloat(match[1]);
    const py = parseFloat(match[2]);
    if (!isNaN(px) && !isNaN(py)) {
      explicitPoints.push({ x: px, y: py });
    }
  }

  // Check if this is a function plot or parabola drawing
  const isParabolaOrPlot = /plot|domain|parabola|variable|x\^2|x\*x|\\x/i.test(tikzBody);

  // Extract explicit plot math expression if available e.g. plot (\x, {\x^2 - 4*\x + 3}) or plot[domain=-1:5]
  let plotExpr = '\\x^2 - 4*\\x + 3';
  const plotExprMatch = tikzBody.match(/plot[^\(]*\(\s*\\x\s*,\s*\{?([^\}\)]+)\}?\s*\)/i);
  if (plotExprMatch && plotExprMatch[1]) {
    plotExpr = plotExprMatch[1].trim();
  } else {
    // Try matching formula after y = or expression with \x
    const exprMatch = tikzBody.match(/\\x[^\;\\,\\)]+/i);
    if (exprMatch) {
      plotExpr = exprMatch[0].trim();
    }
  }

  // Determine domain range
  let domainMin = -1.0, domainMax = 5.0;
  const domainMatch = tikzBody.match(/domain\s*=\s*(-?\d*\.?\d+)\s*:\s*(-?\d*\.?\d+)/);
  if (domainMatch) {
    domainMin = parseFloat(domainMatch[1]);
    domainMax = parseFloat(domainMatch[2]);
  }

  // Determine viewport bounds automatically based on plot and explicit points
  let minX = domainMin - 1.0;
  let maxX = domainMax + 1.0;
  let minY = -2.0;
  let maxY = 5.0;

  if (isParabolaOrPlot) {
    // Sample curve points to calculate dynamic minY, maxY
    let sampledMinY = Infinity;
    let sampledMaxY = -Infinity;
    for (let step = 0; step <= 50; step++) {
      const x = domainMin + (step / 50) * (domainMax - domainMin);
      const y = evalTikzMath(plotExpr, x);
      if (y < sampledMinY) sampledMinY = y;
      if (y > sampledMaxY) sampledMaxY = y;
    }
    if (sampledMinY !== Infinity && sampledMaxY !== -Infinity) {
      minY = Math.min(minY, sampledMinY - 1.2);
      maxY = Math.max(maxY, Math.min(sampledMaxY + 1.2, 12)); // cap extreme y
    }
  }

  if (explicitPoints.length > 0) {
    const pXs = explicitPoints.map(p => p.x);
    const pYs = explicitPoints.map(p => p.y);
    minX = Math.min(minX, Math.min(...pXs) - 1.0);
    maxX = Math.max(maxX, Math.max(...pXs) + 1.0);
    minY = Math.min(minY, Math.min(...pYs) - 1.2);
    maxY = Math.max(maxY, Math.max(...pYs) + 1.2);
  }

  // Scaling mapper functions
  const padding = 50;
  const mapX = (x: number) => padding + ((x - minX) / (maxX - minX)) * (svgWidth - 2 * padding);
  const mapY = (y: number) => svgHeight - (padding + ((y - minY) / (maxY - minY)) * (svgHeight - 2 * padding));

  const svgElements: string[] = [];

  // SVG Definitions (Arrow Markers, Grids)
  svgElements.push(`
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#334155"/>
      </marker>
    </defs>
  `);

  // Background Grid lines
  if (isParabolaOrPlot) {
    svgElements.push(`<rect width="${svgWidth}" height="${svgHeight}" fill="#f8fafc" rx="8"/>`);
    // Light grid pattern
    for (let gx = Math.ceil(minX); gx <= Math.floor(maxX); gx++) {
      const px = mapX(gx);
      svgElements.push(`<line x1="${px}" y1="0" x2="${px}" y2="${svgHeight}" stroke="#f1f5f9" stroke-width="1"/>`);
    }
    for (let gy = Math.ceil(minY); gy <= Math.floor(maxY); gy++) {
      const py = mapY(gy);
      svgElements.push(`<line x1="0" y1="${py}" x2="${svgWidth}" y2="${py}" stroke="#f1f5f9" stroke-width="1"/>`);
    }
  }

  // 1. Draw Coordinate Axes Ox, Oy if plot or axis requested
  if (isParabolaOrPlot || tikzBody.includes('->') || tikzBody.includes('axis')) {
    // X-axis
    svgElements.push(
      `<line x1="${mapX(minX + 0.3)}" y1="${mapY(0)}" x2="${mapX(maxX - 0.2)}" y2="${mapY(0)}" stroke="#1e293b" stroke-width="2" marker-end="url(#arrow)"/>`
    );
    // Y-axis
    svgElements.push(
      `<line x1="${mapX(0)}" y1="${mapY(minY + 0.3)}" x2="${mapX(0)}" y2="${mapY(maxY - 0.2)}" stroke="#1e293b" stroke-width="2" marker-end="url(#arrow)"/>`
    );
    // Axis Labels: O, x, y
    svgElements.push(
      `<text x="${mapX(0) - 14}" y="${mapY(0) + 16}" font-family="Times New Roman, serif" font-style="italic" font-size="15" font-weight="bold" fill="#0f172a">O</text>`
    );
    svgElements.push(
      `<text x="${mapX(maxX - 0.2) + 8}" y="${mapY(0) + 14}" font-family="Times New Roman, serif" font-style="italic" font-size="15" font-weight="bold" fill="#0f172a">x</text>`
    );
    svgElements.push(
      `<text x="${mapX(0) - 16}" y="${mapY(maxY - 0.2) - 8}" font-family="Times New Roman, serif" font-style="italic" font-size="15" font-weight="bold" fill="#0f172a">y</text>`
    );
  }

  // 2. Render Parabola / Function Plot Curve using evalTikzMath
  if (isParabolaOrPlot) {
    const numSteps = 150;
    const step = (domainMax - domainMin) / numSteps;
    const pathPts: string[] = [];

    for (let i = 0; i <= numSteps; i++) {
      const xVal = domainMin + i * step;
      const yVal = evalTikzMath(plotExpr, xVal);

      const sx = mapX(xVal);
      const sy = mapY(yVal);
      if (i === 0) {
        pathPts.push(`M ${sx.toFixed(1)} ${sy.toFixed(1)}`);
      } else {
        pathPts.push(`L ${sx.toFixed(1)} ${sy.toFixed(1)}`);
      }
    }

    // Append Smooth Red Curve
    svgElements.push(
      `<path d="${pathPts.join(' ')}" fill="none" stroke="#dc2626" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`
    );
  }

  // 3. Draw Dashed Projection Lines and Point Circles for Explicit Points (e.g., (0,3), (1,0), (2,-1), (3,0))
  const processedPts = new Set<string>();
  for (const pt of explicitPoints) {
    const key = `${pt.x.toFixed(2)},${pt.y.toFixed(2)}`;
    if (processedPts.has(key)) continue;
    processedPts.add(key);

    const px = mapX(pt.x);
    const py = mapY(pt.y);
    const pZeroX = mapX(0);
    const pZeroY = mapY(0);

    // If point is not O(0,0) and plot is active, draw projection lines
    if (isParabolaOrPlot && (pt.x !== 0 || pt.y !== 0)) {
      if (pt.y !== 0) {
        // Vertical projection line from point to Ox
        svgElements.push(
          `<line x1="${px}" y1="${pZeroY}" x2="${px}" y2="${py}" stroke="#64748b" stroke-width="1.2" stroke-dasharray="4,4"/>`
        );
      }
      if (pt.x !== 0) {
        // Horizontal projection line from point to Oy
        svgElements.push(
          `<line x1="${pZeroX}" y1="${py}" x2="${px}" y2="${py}" stroke="#64748b" stroke-width="1.2" stroke-dasharray="4,4"/>`
        );
      }

      // Point Dot
      svgElements.push(
        `<circle cx="${px}" cy="${py}" r="4" fill="#2563eb" stroke="#ffffff" stroke-width="1"/>`
      );

      // Axis Tick Number Labels
      if (pt.x !== 0) {
        const offsetY = pt.y >= 0 ? 16 : -8;
        svgElements.push(
          `<text x="${px}" y="${pZeroY + offsetY}" font-family="Times New Roman, serif" font-size="13" font-weight="bold" fill="#1e293b" text-anchor="middle">${pt.x}</text>`
        );
      }
      if (pt.y !== 0) {
        const offsetX = pt.x >= 0 ? -14 : 14;
        svgElements.push(
          `<text x="${pZeroX + offsetX}" y="${py + 4}" font-family="Times New Roman, serif" font-size="13" font-weight="bold" fill="#1e293b" text-anchor="middle">${pt.y}</text>`
        );
      }
    } else {
      // Normal shape point dot
      svgElements.push(
        `<circle cx="${px}" cy="${py}" r="3.5" fill="#2563eb"/>`
      );
    }

    if (pt.label) {
      svgElements.push(
        `<text x="${px + 8}" y="${py - 8}" font-family="Times New Roman, serif" font-style="italic" font-size="14" font-weight="bold" fill="#0f172a">${pt.label}</text>`
      );
    }
  }

  // Parse lines / paths with cycle or coordinates
  const lines = tikzBody.split(';');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Draw explicit axis arrows \draw[->] (-2,0) -- (4,0)
    if (!isParabolaOrPlot && line.includes('\\draw') && line.includes('->')) {
      const ptMatches = line.match(/\((-?\d*\.?\d+),\s*(-?\d*\.?\d+)\)/g);
      if (ptMatches && ptMatches.length >= 2) {
        const p1 = parsePtStr(ptMatches[0]);
        const p2 = parsePtStr(ptMatches[1]);
        if (p1 && p2) {
          svgElements.push(
            `<line x1="${mapX(p1.x)}" y1="${mapY(p1.y)}" x2="${mapX(p2.x)}" y2="${mapY(p2.y)}" stroke="#2563eb" stroke-width="2" marker-end="url(#arrow)"/>`
          );
        }
      }
    }

    // Draw polygons / lines: \draw (A) -- (B) -- (C) -- cycle;
    if (line.includes('\\draw') || line.includes('\\fill')) {
      const isFill = line.includes('\\fill');
      const isDashed = line.includes('dashed');
      const isRed = line.includes('red');
      const isBlue = line.includes('blue');
      const isGreen = line.includes('green');

      const color = isRed ? '#dc2626' : isBlue ? '#2563eb' : isGreen ? '#16a34a' : '#1e293b';
      const fillColor = isFill ? (isBlue ? 'rgba(37,99,235,0.12)' : 'rgba(220,38,38,0.12)') : 'none';

      // Match named coordinates or explicit coordinates
      const ptMatches = line.match(/\((?:[A-Za-z0-9_]+|-?\d*\.?\d+,\s*-?\d*\.?\d+)\)/g);
      if (ptMatches && ptMatches.length >= 2) {
        const points: { x: number; y: number }[] = [];
        for (const ptStr of ptMatches) {
          const cleanName = ptStr.replace(/[()]/g, '');
          if (coordinates[cleanName]) {
            points.push(coordinates[cleanName]);
          } else {
            const parsed = parsePtStr(ptStr);
            if (parsed) points.push(parsed);
          }
        }

        if (points.length >= 2) {
          const svgPoints = points.map(p => `${mapX(p.x)},${mapY(p.y)}`).join(' ');
          if (line.includes('cycle') || points.length > 2) {
            svgElements.push(
              `<polygon points="${svgPoints}" fill="${fillColor}" stroke="${color}" stroke-width="2" ${isDashed ? 'stroke-dasharray="4,4"' : ''}/>`
            );
          } else {
            svgElements.push(
              `<polyline points="${svgPoints}" fill="none" stroke="${color}" stroke-width="2" ${isDashed ? 'stroke-dasharray="4,4"' : ''}/>`
            );
          }
        }
      }
    }

    // Parse Nodes / Labels: \node[above] at (A) {$A$};
    if (line.includes('\\node')) {
      const atMatch = line.match(/at\s*\((?:([A-Za-z0-9_]+)|(-?\d*\.?\d+),\s*(-?\d*\.?\d+))\)/);
      const textMatch = line.match(/\{([^}]+)\}/);
      if (atMatch && textMatch) {
        let labelX = 0, labelY = 0;
        if (atMatch[1] && coordinates[atMatch[1]]) {
          labelX = coordinates[atMatch[1]].x;
          labelY = coordinates[atMatch[1]].y;
        } else if (atMatch[2] && atMatch[3]) {
          labelX = parseFloat(atMatch[2]);
          labelY = parseFloat(atMatch[3]);
        }

        let cleanText = textMatch[1].replace(/\$/g, '').trim();
        // Position offset
        let dx = 0, dy = -12;
        if (line.includes('above')) dy = -16;
        if (line.includes('below')) dy = 18;
        if (line.includes('left')) dx = -16;
        if (line.includes('right')) dx = 16;

        svgElements.push(
          `<text x="${mapX(labelX) + dx}" y="${mapY(labelY) + dy}" font-family="Times New Roman, serif" font-style="italic" font-size="15" font-weight="bold" fill="#0f172a" text-anchor="middle" dominant-baseline="middle">${cleanText}</text>`
        );
        svgElements.push(
          `<circle cx="${mapX(labelX)}" cy="${mapY(labelY)}" r="3" fill="#0284c7"/>`
        );
      }
    }

    // Parse Circles: \draw (X) circle (2pt) or (2)
    if (line.includes('circle')) {
      const atMatch = line.match(/\((?:([A-Za-z0-9_]+)|(-?\d*\.?\d+),\s*(-?\d*\.?\d+))\)\s*circle/);
      if (atMatch) {
        let cx = 0, cy = 0;
        if (atMatch[1] && coordinates[atMatch[1]]) {
          cx = coordinates[atMatch[1]].x;
          cy = coordinates[atMatch[1]].y;
        } else if (atMatch[2] && atMatch[3]) {
          cx = parseFloat(atMatch[2]);
          cy = parseFloat(atMatch[3]);
        }
        svgElements.push(
          `<circle cx="${mapX(cx)}" cy="${mapY(cy)}" r="4" fill="#2563eb"/>`
        );
      }
    }
  }

  // SVG Marker definition for arrows
  const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" class="w-full h-auto bg-white rounded-lg border border-slate-200 shadow-sm">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb"/>
    </marker>
  </defs>
  <!-- Background grid pattern -->
  <rect width="100%" height="100%" fill="#f8fafc"/>
  <g stroke="#e2e8f0" stroke-width="0.5" stroke-dasharray="2,2">
    ${Array.from({ length: 11 }).map((_, i) => `<line x1="${(svgWidth / 10) * i}" y1="0" x2="${(svgWidth / 10) * i}" y2="${svgHeight}"/>`).join('')}
    ${Array.from({ length: 9 }).map((_, i) => `<line x1="0" y1="${(svgHeight / 8) * i}" x2="${svgWidth}" y2="${(svgHeight / 8) * i}"/>`).join('')}
  </g>
  <g>`;

  const svgFooter = `</g></svg>`;

  return svgHeader + svgElements.join('\n') + svgFooter;
}

function parsePtStr(str: string): { x: number; y: number } | null {
  const match = str.match(/\((-?\d*\.?\d+),\s*(-?\d*\.?\d+)\)/);
  if (match) {
    return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
  }
  return null;
}
