import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Compass,
  Maximize2,
  Minimize2,
  RotateCcw,
  Download,
  Copy,
  Check,
  Scissors,
  Layers,
  Sparkles,
  Camera,
  Eye,
  Type,
  Plus,
  Trash2,
  Grid,
  Circle,
  Square,
  Box,
  Palette,
  Sliders,
  Move,
  CheckCircle2,
  Share2,
  HelpCircle,
  FolderPlus,
  PenTool,
  Upload,
  BookOpen,
  MousePointer,
  RotateCw,
  Ruler,
  Triangle,
  FileImage,
  Loader2,
  Wand2,
  FileCheck
} from 'lucide-react';
import { generateGeminiText } from '../../../lib/geminiApi';
import { performOcrOnImageDataUrl } from '../../../lib/fileUtils';
import { GeometryObjectInspector } from './GeometryObjectInspector';
import { GeometryObjectManagerModal } from './GeometryObjectManagerModal';

export type GeoMode =
  | 'select'
  | 'addPoint'
  | 'segment'
  | 'line'
  | 'ray'
  | 'midpoint'
  | 'bisector'
  | 'perpendicular'
  | 'parallel'
  | 'altitude'
  | 'circleCenterRadius'
  | 'circle3Points'
  | 'measureLength'
  | 'measureAngle'
  | 'rightAngleMark'
  | 'deleteObject';

export interface GeoPoint {
  id: string;
  x: number;
  y: number;
  label: string;
  color?: string;
  radius?: number;
  isFixed?: boolean;
}

export interface GeoLine {
  id: string;
  p1: string;
  p2: string;
  type: 'segment' | 'line' | 'ray' | 'perpendicular' | 'parallel' | 'bisector';
  dashed?: boolean;
  color?: string;
  width?: number;
  label?: string;
  lengthValue?: string; // e.g. "5 cm", "a", "2a"
}

export interface GeoCircle {
  id: string;
  centerId: string;
  radiusPointId?: string;
  radiusValue?: number; // pixel radius
  type: 'standard' | 'circumcircle' | 'incircle';
  points3Ids?: [string, string, string]; // For circumcircle or incircle
  dashed?: boolean;
  color?: string;
}

export interface GeoAngle {
  id: string;
  p1: string;
  vertex: string;
  p2: string;
  isRightAngle?: boolean;
  showDegrees?: boolean;
  degreeValue?: number;
  color?: string;
}

// Virtual Instrumental Overlay Mode
export type VirtualInstrument = 'none' | 'ruler' | 'compass' | 'set_square' | 'protractor';

export interface InteractiveGeometryCanvasProps {
  onSendImageToLessonPlan?: (dataUrl: string) => void;
  onOpenExtractor?: (initialImage: string) => void;
  importedData?: {
    points: GeoPoint[];
    lines: GeoLine[];
    circles: GeoCircle[];
    angles: GeoAngle[];
  } | null;
}

export const InteractiveGeometryCanvas: React.FC<InteractiveGeometryCanvasProps> = ({
  onSendImageToLessonPlan,
  onOpenExtractor,
  importedData
}) => {
  // Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageUploadInputRef = useRef<HTMLInputElement>(null);

  // Interaction Mode
  const [activeMode, setActiveMode] = useState<GeoMode>('select');

  // Virtual Instrument State
  const [activeInstrument, setActiveInstrument] = useState<VirtualInstrument>('none');
  const [rulerAngle, setRulerAngle] = useState<number>(0);
  const [rulerLength, setRulerLength] = useState<number>(300); // 300px ~ 15cm
  const [rulerPos, setRulerPos] = useState<{ x: number; y: number }>({ x: 120, y: 180 });
  const [compassRadius, setCompassRadius] = useState<number>(100);
  const [compassAngle, setCompassAngle] = useState<number>(30);
  const [compassPos, setCompassPos] = useState<{ x: number; y: number }>({ x: 300, y: 220 });
  const [setSquareAngle, setSetSquareAngle] = useState<number>(0);
  const [setSquarePos, setSetSquarePos] = useState<{ x: number; y: number }>({ x: 180, y: 150 });
  const [protractorAngle, setProtractorAngle] = useState<number>(0);
  const [protractorPos, setProtractorPos] = useState<{ x: number; y: number }>({ x: 280, y: 200 });

  // Canvas Styling & Background Separations
  const [canvasBg, setCanvasBg] = useState<'white' | 'dark' | 'grid_school' | 'transparent'>('white');
  const [lineColor, setLineColor] = useState<string>('#2563eb'); // High-contrast Royal Blue
  const [pointColor, setPointColor] = useState<string>('#dc2626'); // High-contrast Red
  const [isDashedNext, setIsDashedNext] = useState<boolean>(false);
  const [lineWidth, setLineWidth] = useState<number>(2.5);
  const [pointRadius, setPointRadius] = useState<number>(6);
  const [highContrastMode, setHighContrastMode] = useState<boolean>(true);

  // Real Measurement Scale & Dynamic Metric States
  const [showRealMeasurements, setShowRealMeasurements] = useState<boolean>(true);
  const [pxPerCm, setPxPerCm] = useState<number>(30); // Standard mathematical scale: 30px = 1.0cm

  // Fullscreen Mode
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Object Inspector & Manager states
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedObjectType, setSelectedObjectType] = useState<'point' | 'line' | 'circle' | 'angle' | null>(null);
  const [isObjectManagerOpen, setIsObjectManagerOpen] = useState<boolean>(false);

  // Geometry State (Editable & Interactive)
  const [points, setPoints] = useState<GeoPoint[]>([
    { id: 'p_A', x: 260, y: 80, label: 'A', color: '#dc2626', radius: 6 },
    { id: 'p_B', x: 110, y: 320, label: 'B', color: '#dc2626', radius: 6 },
    { id: 'p_C', x: 440, y: 320, label: 'C', color: '#dc2626', radius: 6 }
  ]);

  const [lines, setLines] = useState<GeoLine[]>([
    { id: 'l_AB', p1: 'p_A', p2: 'p_B', type: 'segment', dashed: false, color: '#2563eb', width: 2.5, label: 'c' },
    { id: 'l_BC', p1: 'p_B', p2: 'p_C', type: 'segment', dashed: false, color: '#2563eb', width: 2.5, label: 'a' },
    { id: 'l_CA', p1: 'p_C', p2: 'p_A', type: 'segment', dashed: false, color: '#2563eb', width: 2.5, label: 'b' }
  ]);

  const [circles, setCircles] = useState<GeoCircle[]>([]);
  const [angles, setAngles] = useState<GeoAngle[]>([]);

  // Receive importedData from Step-by-Step Geometry Guide
  useEffect(() => {
    if (importedData) {
      if (importedData.points && importedData.points.length > 0) {
        setPoints(importedData.points);
      }
      if (importedData.lines) setLines(importedData.lines);
      if (importedData.circles) setCircles(importedData.circles);
      if (importedData.angles) setAngles(importedData.angles);
      setSelectedObjectId(null);
      setSelectedObjectType(null);
      setStatusMessage('✓ Đã nạp thành công sơ đồ hình học từ Hướng Dẫn vào Studio!');
    }
  }, [importedData]);

  // Selection & Dragging state
  const [draggedPointId, setDraggedPointId] = useState<string | null>(null);
  const [selectedPointIds, setSelectedPointIds] = useState<string[]>([]);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Bấm và kéo thả các điểm để di chuyển hình học linh hoạt.');

  // AI Image Recognition & Step-by-step Guide modals
  const [isAiRecognizing, setIsAiRecognizing] = useState<boolean>(false);
  const [aiRecognizeStatus, setAiRecognizeStatus] = useState<string>('');
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [selectedGuideTopic, setSelectedGuideTopic] = useState<string>('triangle_altitude');
  const [guideCurrentStep, setGuideCurrentStep] = useState<number>(0);

  // Undo/Redo Stacks
  const [history, setHistory] = useState<Array<{ points: GeoPoint[]; lines: GeoLine[]; circles: GeoCircle[]; angles: GeoAngle[] }>>([]);

  // Save state to undo history
  const pushHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(-15), { points, lines, circles, angles }]);
  }, [points, lines, circles, angles]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setPoints(last.points);
    setLines(last.lines);
    setCircles(last.circles);
    setAngles(last.angles);
    setSelectedPointIds([]);
  };

  // Helper distance & math functions
  const dist = (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1);

  const distToSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return dist(px, py, x1, y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return dist(px, py, x1 + t * (x2 - x1), y1 + t * (y2 - y1));
  };

  // Object CRUD Handlers
  const handleDeletePoint = (id: string) => {
    pushHistory();
    setPoints((prev) => prev.filter((p) => p.id !== id));
    setLines((prev) => prev.filter((l) => l.p1 !== id && l.p2 !== id));
    setCircles((prev) => prev.filter((c) => c.centerId !== id && c.radiusPointId !== id && (!c.points3Ids || !c.points3Ids.includes(id))));
    setAngles((prev) => prev.filter((a) => a.vertex !== id && a.p1 !== id && a.p2 !== id));
    if (selectedObjectId === id) {
      setSelectedObjectId(null);
      setSelectedObjectType(null);
    }
    setStatusMessage('Đã xóa điểm và các liên kết.');
  };

  const handleDeleteLine = (id: string) => {
    pushHistory();
    setLines((prev) => prev.filter((l) => l.id !== id));
    if (selectedObjectId === id) {
      setSelectedObjectId(null);
      setSelectedObjectType(null);
    }
    setStatusMessage('Đã xóa đoạn thẳng.');
  };

  const handleDeleteCircle = (id: string) => {
    pushHistory();
    setCircles((prev) => prev.filter((c) => c.id !== id));
    if (selectedObjectId === id) {
      setSelectedObjectId(null);
      setSelectedObjectType(null);
    }
    setStatusMessage('Đã xóa đường tròn.');
  };

  const handleDeleteAngle = (id: string) => {
    pushHistory();
    setAngles((prev) => prev.filter((a) => a.id !== id));
    if (selectedObjectId === id) {
      setSelectedObjectId(null);
      setSelectedObjectType(null);
    }
    setStatusMessage('Đã xóa góc.');
  };

  const handleUpdatePoint = (id: string, updates: Partial<GeoPoint>) => {
    setPoints((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const handleUpdateLine = (id: string, updates: Partial<GeoLine>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const handleUpdateCircle = (id: string, updates: Partial<GeoCircle>) => {
    setCircles((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleUpdateAngle = (id: string, updates: Partial<GeoAngle>) => {
    setAngles((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const handleAddPointManual = (label: string, x: number, y: number, color: string, radius: number) => {
    pushHistory();
    const newP: GeoPoint = {
      id: 'p_' + Date.now(),
      label: label || 'P',
      x,
      y,
      color,
      radius
    };
    setPoints((prev) => [...prev, newP]);
    setStatusMessage(`Đã thêm điểm ${newP.label}`);
  };

  // Calculate angle between 3 points in degrees
  const computeAngleDegrees = (p1: GeoPoint, vertex: GeoPoint, p2: GeoPoint): number => {
    const v1x = p1.x - vertex.x;
    const v1y = p1.y - vertex.y;
    const v2x = p2.x - vertex.x;
    const v2y = p2.y - vertex.y;
    const dot = v1x * v2x + v1y * v2y;
    const mag1 = Math.hypot(v1x, v1y);
    const mag2 = Math.hypot(v2x, v2y);
    if (mag1 === 0 || mag2 === 0) return 0;
    const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
    return Math.round((Math.acos(cosAngle) * 180) / Math.PI * 10) / 10;
  };

  // Redraw Canvas Engine
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width;
    const h = canvas.height;

    // 1. Fill Background
    ctx.clearRect(0, 0, w, h);
    if (canvasBg === 'white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
    } else if (canvasBg === 'dark') {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);
    } else if (canvasBg === 'grid_school') {
      // School Grid Notebook Paper
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1 * dpr;
      for (let x = 0; x < w; x += 25 * dpr) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 25 * dpr) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }

    // 2. Draw Circles
    circles.forEach((c) => {
      const center = points.find((p) => p.id === c.centerId);
      if (!center) return;

      let r = c.radiusValue || 60;
      if (c.type === 'circumcircle' && c.points3Ids) {
        const pA = points.find((p) => p.id === c.points3Ids![0]);
        const pB = points.find((p) => p.id === c.points3Ids![1]);
        const pC = points.find((p) => p.id === c.points3Ids![2]);
        if (pA && pB && pC) {
          r = dist(center.x, center.y, pA.x, pA.y);
        }
      } else if (c.radiusPointId) {
        const radP = points.find((p) => p.id === c.radiusPointId);
        if (radP) r = dist(center.x, center.y, radP.x, radP.y);
      }

      const isObjSelected = selectedObjectId === c.id && selectedObjectType === 'circle';

      ctx.save();
      ctx.beginPath();
      ctx.arc(center.x * dpr, center.y * dpr, r * dpr, 0, Math.PI * 2);
      ctx.strokeStyle = isObjSelected ? '#f59e0b' : c.color || '#9333ea';
      ctx.lineWidth = (isObjSelected ? 3.5 : 2) * dpr;
      if (c.dashed) {
        ctx.setLineDash([6 * dpr, 6 * dpr]);
      }
      ctx.stroke();
      ctx.restore();
    });

    // 3. Draw Lines & Segments with anti-loss high contrast
    lines.forEach((l) => {
      const p1 = points.find((p) => p.id === l.p1);
      const p2 = points.find((p) => p.id === l.p2);
      if (!p1 || !p2) return;

      const isObjSelected = selectedObjectId === l.id && selectedObjectType === 'line';

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(p1.x * dpr, p1.y * dpr);
      ctx.lineTo(p2.x * dpr, p2.y * dpr);
      ctx.strokeStyle = isObjSelected ? '#f59e0b' : l.color || lineColor;
      ctx.lineWidth = (isObjSelected ? (l.width || lineWidth || 2.5) + 2 : (l.width || lineWidth || 2.5)) * dpr;
      ctx.lineCap = 'round';

      if (l.dashed) {
        ctx.setLineDash([7 * dpr, 7 * dpr]);
      } else {
        ctx.setLineDash([]);
      }

      // High-contrast halo for background separation
      if (highContrastMode && canvasBg === 'white') {
        ctx.shadowColor = 'rgba(0,0,0,0.08)';
        ctx.shadowBlur = 2 * dpr;
      }
      ctx.stroke();

      // Real-time calculated measurement along the line
      const realDistPx = dist(p1.x, p1.y, p2.x, p2.y);
      const realDistCm = (realDistPx / pxPerCm).toFixed(1).replace(/\.0$/, '');

      let labelText = '';
      if (showRealMeasurements) {
        if (l.label && l.label.trim() !== '') {
          // If label exists (e.g., 'a' or 'AB'), display with real measurement in cm
          labelText = `${l.label} (${realDistCm}cm)`;
        } else if (l.lengthValue) {
          labelText = `${l.lengthValue}`;
        } else {
          labelText = `${realDistCm}cm`;
        }
      } else if (l.label || l.lengthValue) {
        labelText = l.lengthValue || l.label || '';
      }

      if (labelText) {
        const mx = ((p1.x + p2.x) / 2) * dpr;
        const my = ((p1.y + p2.y) / 2) * dpr;

        // Perpendicular offset so text floats clearly above the line
        const lineAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const perpAngle = lineAngle - Math.PI / 2;
        const offX = Math.cos(perpAngle) * 11 * dpr;
        const offY = Math.sin(perpAngle) * 11 * dpr;

        ctx.font = `bold ${12.5 * dpr}px sans-serif`;
        // Text Halo for high legibility
        ctx.fillStyle = canvasBg === 'white' ? '#0f172a' : '#38bdf8';
        ctx.strokeStyle = canvasBg === 'white' ? '#ffffff' : '#020617';
        ctx.lineWidth = 4 * dpr;
        ctx.strokeText(labelText, mx + offX, my + offY);
        ctx.fillText(labelText, mx + offX, my + offY);
      }

      ctx.restore();
    });

    // 4. Draw Angles & Right Angle Marks with LIVE EXACT DEGREES
    angles.forEach((ang) => {
      const p1 = points.find((p) => p.id === ang.p1);
      const vert = points.find((p) => p.id === ang.vertex);
      const p2 = points.find((p) => p.id === ang.p2);
      if (!p1 || !vert || !p2) return;

      const a1 = Math.atan2(p1.y - vert.y, p1.x - vert.x);
      const a2 = Math.atan2(p2.y - vert.y, p2.x - vert.x);

      // Compute Real-Time Geometric Angle in degrees directly from point coordinates
      const realDeg = computeAngleDegrees(p1, vert, p2);
      const isActuallyRight = Math.abs(realDeg - 90) < 0.6;
      const isObjSelected = selectedObjectId === ang.id && selectedObjectType === 'angle';

      ctx.save();
      if (ang.isRightAngle || (isActuallyRight && ang.isRightAngle !== false)) {
        // Draw square right-angle mark (Chuẩn góc vuông 90 độ thực tế)
        const size = 14 * dpr;
        const u1x = Math.cos(a1) * size;
        const u1y = Math.sin(a1) * size;
        const u2x = Math.cos(a2) * size;
        const u2y = Math.sin(a2) * size;

        ctx.beginPath();
        ctx.moveTo(vert.x * dpr + u1x, vert.y * dpr + u1y);
        ctx.lineTo(vert.x * dpr + u1x + u2x, vert.y * dpr + u1y + u2y);
        ctx.lineTo(vert.x * dpr + u2x, vert.y * dpr + u2y);
        ctx.strokeStyle = isObjSelected ? '#f59e0b' : ang.color || '#dc2626';
        ctx.lineWidth = (isObjSelected ? 3.5 : 2) * dpr;
        ctx.stroke();

        // Right angle 90° label if real measurement is enabled
        if (showRealMeasurements) {
          const midAngle = (a1 + a2) / 2;
          const labelX = vert.x * dpr + Math.cos(midAngle) * 26 * dpr;
          const labelY = vert.y * dpr + Math.sin(midAngle) * 26 * dpr;
          ctx.font = `bold ${10.5 * dpr}px sans-serif`;
          ctx.fillStyle = '#dc2626';
          ctx.strokeStyle = canvasBg === 'white' ? '#ffffff' : '#000000';
          ctx.lineWidth = 3 * dpr;
          ctx.strokeText(`90°`, labelX, labelY);
          ctx.fillText(`90°`, labelX, labelY);
        }
      } else {
        // Draw Angle Arc
        ctx.beginPath();
        ctx.arc(vert.x * dpr, vert.y * dpr, 24 * dpr, a1, a2);
        ctx.strokeStyle = isObjSelected ? '#f59e0b' : ang.color || '#ea580c';
        ctx.lineWidth = (isObjSelected ? 3.5 : 2) * dpr;
        ctx.stroke();

        // Live Real Degrees Display (Đo thật trực tiếp từ tọa độ điểm)
        const displayDeg = `${realDeg.toFixed(1).replace(/\.0$/, '')}°`;
        const midAngle = (a1 + a2) / 2;
        const labelX = vert.x * dpr + Math.cos(midAngle) * 38 * dpr;
        const labelY = vert.y * dpr + Math.sin(midAngle) * 38 * dpr;

        ctx.font = `bold ${12 * dpr}px sans-serif`;
        ctx.fillStyle = '#ea580c';
        ctx.strokeStyle = canvasBg === 'white' ? '#ffffff' : '#000000';
        ctx.lineWidth = 3 * dpr;
        ctx.strokeText(displayDeg, labelX, labelY);
        ctx.fillText(displayDeg, labelX, labelY);
      }
      ctx.restore();
    });

    // 5. Draw Points with Thick High-Contrast Rim & Anti-Loss Protection
    points.forEach((p) => {
      const isSelected = selectedPointIds.includes(p.id) || (selectedObjectId === p.id && selectedObjectType === 'point');
      const r = (p.radius || pointRadius || 6) * dpr;

      ctx.save();

      // Outer contrasting rim (White ring on dark, Black ring on white)
      ctx.beginPath();
      ctx.arc(p.x * dpr, p.y * dpr, r + 2.5 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = canvasBg === 'white' ? '#0f172a' : '#ffffff';
      ctx.fill();

      // Inner Point Fill
      ctx.beginPath();
      ctx.arc(p.x * dpr, p.y * dpr, r, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#f59e0b' : p.color || pointColor;
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 3.5 * dpr;
        ctx.stroke();
      }

      // Point Label with Anti-Bleed Protective Halo
      ctx.font = `bold ${14 * dpr}px sans-serif`;
      ctx.strokeStyle = canvasBg === 'white' ? '#ffffff' : '#020617';
      ctx.lineWidth = 4 * dpr;
      ctx.strokeText(p.label, p.x * dpr + (r + 4 * dpr), p.y * dpr - (r + 4 * dpr));

      ctx.fillStyle = canvasBg === 'white' ? '#0f172a' : '#ffffff';
      ctx.fillText(p.label, p.x * dpr + (r + 4 * dpr), p.y * dpr - (r + 4 * dpr));

      ctx.restore();
    });

    // 6. Draw Virtual Instruments Overlays (Ruler, Compass, Set Square, Protractor)
    if (activeInstrument === 'ruler') {
      ctx.save();
      ctx.translate(rulerPos.x * dpr, rulerPos.y * dpr);
      ctx.rotate((rulerAngle * Math.PI) / 180);

      // Ruler Body (Translucent acrylic with cm/mm graduations)
      const rW = rulerLength * dpr;
      const rH = 45 * dpr;
      ctx.fillStyle = 'rgba(240, 249, 255, 0.88)';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5 * dpr;
      ctx.fillRect(0, 0, rW, rH);
      ctx.strokeRect(0, 0, rW, rH);

      // Millimeter & Centimeter ticks aligned with real scale
      ctx.fillStyle = '#0369a1';
      ctx.strokeStyle = '#0284c7';
      const rulerStepPx = pxPerCm * dpr;
      const totalCm = Math.floor(rulerLength / pxPerCm);
      for (let i = 0; i <= totalCm; i++) {
        const xPos = i * rulerStepPx;
        // cm tick
        ctx.beginPath();
        ctx.moveTo(xPos, 0);
        ctx.lineTo(xPos, 13 * dpr);
        ctx.lineWidth = 1.5 * dpr;
        ctx.stroke();

        ctx.font = `bold ${10 * dpr}px sans-serif`;
        ctx.fillText(`${i}`, xPos - 3 * dpr, 24 * dpr);

        // mm sub-ticks (10 divisions per cm, 5mm is slightly longer)
        if (i < totalCm) {
          for (let m = 1; m < 10; m++) {
            ctx.beginPath();
            ctx.moveTo(xPos + (m * rulerStepPx) / 10, 0);
            ctx.lineTo(xPos + (m * rulerStepPx) / 10, m === 5 ? 8.5 * dpr : 5 * dpr);
            ctx.lineWidth = (m === 5 ? 1.0 : 0.7) * dpr;
            ctx.stroke();
          }
        }
      }

      ctx.restore();
    } else if (activeInstrument === 'protractor') {
      ctx.save();
      ctx.translate(protractorPos.x * dpr, protractorPos.y * dpr);
      ctx.rotate((protractorAngle * Math.PI) / 180);

      const rad = 110 * dpr;
      // Semi-circle protractor
      ctx.beginPath();
      ctx.arc(0, 0, rad, Math.PI, 0, false);
      ctx.closePath();
      ctx.fillStyle = 'rgba(254, 243, 199, 0.85)';
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2 * dpr;
      ctx.stroke();

      // Degree radial ticks
      for (let deg = 0; deg <= 180; deg += 10) {
        const radAng = Math.PI - (deg * Math.PI) / 180;
        const x1 = Math.cos(radAng) * rad;
        const y1 = -Math.sin(radAng) * rad;
        const tickLen = deg % 30 === 0 ? 14 * dpr : 8 * dpr;
        const x2 = Math.cos(radAng) * (rad - tickLen);
        const y2 = -Math.sin(radAng) * (rad - tickLen);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        if (deg % 30 === 0) {
          const textX = Math.cos(radAng) * (rad - 22 * dpr);
          const textY = -Math.sin(radAng) * (rad - 22 * dpr);
          ctx.font = `${9 * dpr}px sans-serif`;
          ctx.fillStyle = '#92400e';
          ctx.textAlign = 'center';
          ctx.fillText(`${deg}°`, textX, textY);
        }
      }

      // Center crosshair
      ctx.beginPath();
      ctx.arc(0, 0, 4 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = '#dc2626';
      ctx.fill();
      ctx.restore();
    } else if (activeInstrument === 'set_square') {
      ctx.save();
      ctx.translate(setSquarePos.x * dpr, setSquarePos.y * dpr);
      ctx.rotate((setSquareAngle * Math.PI) / 180);

      const size = 180 * dpr;
      ctx.beginPath();
      ctx.moveTo(0, 0); // Right-angle vertex
      ctx.lineTo(size, 0);
      ctx.lineTo(0, size);
      ctx.closePath();
      ctx.fillStyle = 'rgba(220, 252, 231, 0.88)';
      ctx.fill();
      ctx.strokeStyle = '#16a34a';
      ctx.lineWidth = 2 * dpr;
      ctx.stroke();

      // Right angle square marker at vertex (0,0)
      ctx.strokeRect(0, 0, 16 * dpr, 16 * dpr);

      // Inner hollow triangle cutout
      ctx.beginPath();
      ctx.moveTo(25 * dpr, 25 * dpr);
      ctx.lineTo((size - 50 * dpr), 25 * dpr);
      ctx.lineTo(25 * dpr, (size - 50 * dpr));
      ctx.closePath();
      ctx.stroke();

      ctx.restore();
    } else if (activeInstrument === 'compass') {
      ctx.save();
      ctx.translate(compassPos.x * dpr, compassPos.y * dpr);

      const rad = compassRadius * dpr;
      // Compass Needle Point
      ctx.beginPath();
      ctx.arc(0, 0, 5 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = '#dc2626';
      ctx.fill();

      // Compass Pencil Tip
      const pencilX = Math.cos((compassAngle * Math.PI) / 180) * rad;
      const pencilY = Math.sin((compassAngle * Math.PI) / 180) * rad;

      ctx.beginPath();
      ctx.arc(pencilX, pencilY, 5 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = '#2563eb';
      ctx.fill();

      // Compass metallic arms
      ctx.beginPath();
      ctx.moveTo(0, -35 * dpr);
      ctx.lineTo(0, 0);
      ctx.moveTo(0, -35 * dpr);
      ctx.lineTo(pencilX, pencilY);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3.5 * dpr;
      ctx.stroke();

      // Top Hinge
      ctx.beginPath();
      ctx.arc(0, -35 * dpr, 7 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();

      // Arc preview guide
      ctx.beginPath();
      ctx.arc(0, 0, rad, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.4)';
      ctx.setLineDash([4 * dpr, 4 * dpr]);
      ctx.stroke();

      ctx.restore();
    }
  }, [
    canvasBg,
    lineColor,
    pointColor,
    highContrastMode,
    lineWidth,
    pointRadius,
    points,
    lines,
    circles,
    angles,
    selectedPointIds,
    activeInstrument,
    rulerPos,
    rulerAngle,
    rulerLength,
    protractorPos,
    protractorAngle,
    setSquarePos,
    setSquareAngle,
    compassPos,
    compassRadius,
    compassAngle
  ]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = window.devicePixelRatio || 1;
      const width = container.clientWidth || 800;
      const height = isFullscreen ? window.innerHeight - 140 : 480;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      redraw();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redraw, isFullscreen]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Get Click Coordinates on Canvas
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  // Find point near coordinate
  const findPointNear = (x: number, y: number, radiusThreshold = 22) => {
    return points.find((p) => dist(p.x, p.y, x, y) <= Math.max(radiusThreshold, (p.radius || 6) + 6));
  };

  // Find line near coordinate
  const findLineNear = (x: number, y: number, threshold = 12) => {
    return lines.find((l) => {
      const p1 = points.find((p) => p.id === l.p1);
      const p2 = points.find((p) => p.id === l.p2);
      if (!p1 || !p2) return false;
      return distToSegment(x, y, p1.x, p1.y, p2.x, p2.y) <= threshold;
    });
  };

  // Find circle near coordinate
  const findCircleNear = (x: number, y: number, threshold = 12) => {
    return circles.find((c) => {
      const center = points.find((p) => p.id === c.centerId);
      if (!center) return false;
      let r = c.radiusValue || 60;
      if (c.radiusPointId) {
        const radP = points.find((p) => p.id === c.radiusPointId);
        if (radP) r = dist(center.x, center.y, radP.x, radP.y);
      }
      const d = dist(center.x, center.y, x, y);
      return Math.abs(d - r) <= threshold;
    });
  };

  // Find angle near coordinate
  const findAngleNear = (x: number, y: number, threshold = 25) => {
    return angles.find((a) => {
      const vert = points.find((p) => p.id === a.vertex);
      if (!vert) return false;
      return dist(vert.x, vert.y, x, y) <= threshold;
    });
  };

  // Canvas Mouse Down / Click
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const hitPoint = findPointNear(x, y);

    if (activeMode === 'select') {
      if (hitPoint) {
        setDraggedPointId(hitPoint.id);
        setSelectedObjectId(hitPoint.id);
        setSelectedObjectType('point');
        setStatusMessage(`Đang chọn Điểm ${hitPoint.label}. Kéo rê để di chuyển hoặc chỉnh sửa bên dưới.`);
        return;
      }
      const hitLine = findLineNear(x, y);
      if (hitLine) {
        setSelectedObjectId(hitLine.id);
        setSelectedObjectType('line');
        setStatusMessage(`Đang chọn Đoạn thẳng. Bạn có thể đổi màu, nét đứt, nhập độ dài.`);
        return;
      }
      const hitCircle = findCircleNear(x, y);
      if (hitCircle) {
        setSelectedObjectId(hitCircle.id);
        setSelectedObjectType('circle');
        setStatusMessage(`Đang chọn Đường tròn.`);
        return;
      }
      const hitAngle = findAngleNear(x, y);
      if (hitAngle) {
        setSelectedObjectId(hitAngle.id);
        setSelectedObjectType('angle');
        setStatusMessage(`Đang chọn Góc.`);
        return;
      }
      // Clicked outside
      setSelectedObjectId(null);
      setSelectedObjectType(null);
      return;
    }

    if (activeMode === 'deleteObject') {
      if (hitPoint) {
        handleDeletePoint(hitPoint.id);
        return;
      }
      const hitLine = findLineNear(x, y);
      if (hitLine) {
        handleDeleteLine(hitLine.id);
        return;
      }
      const hitCircle = findCircleNear(x, y);
      if (hitCircle) {
        handleDeleteCircle(hitCircle.id);
        return;
      }
      const hitAngle = findAngleNear(x, y);
      if (hitAngle) {
        handleDeleteAngle(hitAngle.id);
        return;
      }
      return;
    }

    if (activeMode === 'addPoint') {
      pushHistory();
      const nextChar = String.fromCharCode(65 + (points.length % 26));
      const newP: GeoPoint = {
        id: 'p_' + Date.now(),
        x,
        y,
        label: nextChar,
        color: pointColor
      };
      setPoints((prev) => [...prev, newP]);
      setStatusMessage(`Đã thêm điểm ${newP.label}`);
      return;
    }

    // Two-point tools: segment, midpoint, altitude, perpendicular, parallel
    if (activeMode === 'segment') {
      if (hitPoint) {
        if (selectedPointIds.length === 0) {
          setSelectedPointIds([hitPoint.id]);
          setStatusMessage(`Đã chọn điểm ${hitPoint.label}. Chọn tiếp điểm thứ 2 để nối.`);
        } else if (selectedPointIds.length === 1 && selectedPointIds[0] !== hitPoint.id) {
          pushHistory();
          const p1 = selectedPointIds[0];
          const p2 = hitPoint.id;
          const newLine: GeoLine = {
            id: 'l_' + Date.now(),
            p1,
            p2,
            type: 'segment',
            dashed: isDashedNext,
            color: lineColor,
            width: lineWidth
          };
          setLines((prev) => [...prev, newLine]);
          setSelectedPointIds([]);
          setStatusMessage(`Đã nối đoạn thẳng thành công!`);
        }
      }
      return;
    }

    // Midpoint tool
    if (activeMode === 'midpoint') {
      if (hitPoint) {
        if (selectedPointIds.length === 0) {
          setSelectedPointIds([hitPoint.id]);
          setStatusMessage(`Chọn điểm thứ hai để tìm trung điểm.`);
        } else if (selectedPointIds.length === 1 && selectedPointIds[0] !== hitPoint.id) {
          pushHistory();
          const pA = points.find((p) => p.id === selectedPointIds[0])!;
          const pB = hitPoint;
          const mx = (pA.x + pB.x) / 2;
          const my = (pA.y + pB.y) / 2;
          const midPoint: GeoPoint = {
            id: 'p_mid_' + Date.now(),
            x: mx,
            y: my,
            label: 'M',
            color: '#10b981'
          };
          setPoints((prev) => [...prev, midPoint]);
          setSelectedPointIds([]);
          setStatusMessage(`Đã xác định trung điểm M của ${pA.label}${pB.label}!`);
        }
      }
      return;
    }

    // Angle Bisector tool (Requires 3 points: A, B, C -> Bisector of Angle B)
    if (activeMode === 'bisector') {
      if (hitPoint) {
        const newSel = [...selectedPointIds, hitPoint.id];
        setSelectedPointIds(newSel);

        if (newSel.length === 1) {
          setStatusMessage(`Chọn điểm thứ 2 (Đỉnh của góc cần chia đôi).`);
        } else if (newSel.length === 2) {
          setStatusMessage(`Chọn điểm thứ 3 để hoàn thành góc.`);
        } else if (newSel.length === 3) {
          pushHistory();
          const pA = points.find((p) => p.id === newSel[0])!;
          const pB = points.find((p) => p.id === newSel[1])!; // Vertex
          const pC = points.find((p) => p.id === newSel[2])!;

          // Angle bisector unit direction vector
          const v1x = pA.x - pB.x;
          const v1y = pA.y - pB.y;
          const len1 = Math.hypot(v1x, v1y) || 1;

          const v2x = pC.x - pB.x;
          const v2y = pC.y - pB.y;
          const len2 = Math.hypot(v2x, v2y) || 1;

          const bx = v1x / len1 + v2x / len2;
          const by = v1y / len1 + v2y / len2;
          const bLen = Math.hypot(bx, by) || 1;

          // Create target point along bisector
          const targetP: GeoPoint = {
            id: 'p_bis_' + Date.now(),
            x: pB.x + (bx / bLen) * 160,
            y: pB.y + (by / bLen) * 160,
            label: 'D',
            color: '#10b981'
          };

          const bisLine: GeoLine = {
            id: 'l_bis_' + Date.now(),
            p1: pB.id,
            p2: targetP.id,
            type: 'bisector',
            dashed: false,
            color: '#10b981',
            label: 'Phân giác'
          };

          setPoints((prev) => [...prev, targetP]);
          setLines((prev) => [...prev, bisLine]);
          setSelectedPointIds([]);
          setStatusMessage(`Đã vẽ tia phân giác của góc ${pA.label}${pB.label}${pC.label}!`);
        }
      }
      return;
    }

    // Circumcircle (3 points)
    if (activeMode === 'circle3Points') {
      if (hitPoint) {
        const newSel = [...selectedPointIds, hitPoint.id];
        setSelectedPointIds(newSel);

        if (newSel.length < 3) {
          setStatusMessage(`Chọn điểm ${newSel.length + 1} / 3 để dựng đường tròn ngoại tiếp.`);
        } else {
          pushHistory();
          const pA = points.find((p) => p.id === newSel[0])!;
          const pB = points.find((p) => p.id === newSel[1])!;
          const pC = points.find((p) => p.id === newSel[2])!;

          const d = 2 * (pA.x * (pB.y - pC.y) + pB.x * (pC.y - pA.y) + pC.x * (pA.y - pB.y));
          if (Math.abs(d) > 0.001) {
            const ux = ((pA.x ** 2 + pA.y ** 2) * (pB.y - pC.y) + (pB.x ** 2 + pB.y ** 2) * (pC.y - pA.y) + (pC.x ** 2 + pC.y ** 2) * (pA.y - pB.y)) / d;
            const uy = ((pA.x ** 2 + pA.y ** 2) * (pC.x - pB.x) + (pB.x ** 2 + pB.y ** 2) * (pA.x - pC.x) + (pC.x ** 2 + pC.y ** 2) * (pB.x - pA.x)) / d;

            const centerO: GeoPoint = {
              id: 'p_O_' + Date.now(),
              x: ux,
              y: uy,
              label: 'O',
              color: '#9333ea'
            };

            const circum: GeoCircle = {
              id: 'c_' + Date.now(),
              centerId: centerO.id,
              type: 'circumcircle',
              points3Ids: [pA.id, pB.id, pC.id],
              color: '#9333ea'
            };

            setPoints((prev) => [...prev, centerO]);
            setCircles((prev) => [...prev, circum]);
            setSelectedPointIds([]);
            setStatusMessage(`Đã vẽ đường tròn ngoại tiếp (O) đi qua 3 điểm!`);
          }
        }
      }
      return;
    }

    // Altitude (Hạ đường cao vuông góc từ 1 đỉnh xuống cạnh đáy)
    if (activeMode === 'altitude') {
      if (hitPoint) {
        const newSel = [...selectedPointIds, hitPoint.id];
        setSelectedPointIds(newSel);

        if (newSel.length === 1) {
          setStatusMessage(`Chọn điểm đáy thứ 1.`);
        } else if (newSel.length === 2) {
          setStatusMessage(`Chọn điểm đáy thứ 2.`);
        } else if (newSel.length === 3) {
          pushHistory();
          const pApex = points.find((p) => p.id === newSel[0])!;
          const pB = points.find((p) => p.id === newSel[1])!;
          const pC = points.find((p) => p.id === newSel[2])!;

          // Project pApex onto line BC
          const bcX = pC.x - pB.x;
          const bcY = pC.y - pB.y;
          const lenSq = bcX * bcX + bcY * bcY || 1;
          const t = ((pApex.x - pB.x) * bcX + (pApex.y - pB.y) * bcY) / lenSq;

          const footX = pB.x + t * bcX;
          const footY = pB.y + t * bcY;

          const footH: GeoPoint = {
            id: 'p_H_' + Date.now(),
            x: footX,
            y: footY,
            label: 'H',
            color: '#dc2626'
          };

          const altLine: GeoLine = {
            id: 'l_alt_' + Date.now(),
            p1: pApex.id,
            p2: footH.id,
            type: 'perpendicular',
            dashed: false,
            color: '#dc2626',
            label: 'h'
          };

          const rightAng: GeoAngle = {
            id: 'ang_h_' + Date.now(),
            p1: pApex.id,
            vertex: footH.id,
            p2: pC.id,
            isRightAngle: true,
            color: '#dc2626'
          };

          setPoints((prev) => [...prev, footH]);
          setLines((prev) => [...prev, altLine]);
          setAngles((prev) => [...prev, rightAng]);
          setSelectedPointIds([]);
          setStatusMessage(`Đã hạ đường cao ${pApex.label}H vuông góc với ${pB.label}${pC.label}!`);
        }
      }
      return;
    }

    // Measure Angle (Chọn 3 điểm: P1 -> Vertex -> P2)
    if (activeMode === 'measureAngle') {
      if (hitPoint) {
        const newSel = [...selectedPointIds, hitPoint.id];
        setSelectedPointIds(newSel);

        if (newSel.length === 1) {
          setStatusMessage(`Đã chọn điểm thứ nhất. Hãy chọn điểm ĐỈNH của góc.`);
        } else if (newSel.length === 2) {
          setStatusMessage(`Đã chọn đỉnh. Hãy chọn điểm thứ 3 để hoàn thành đo góc.`);
        } else if (newSel.length === 3) {
          pushHistory();
          const p1 = points.find((p) => p.id === newSel[0])!;
          const vert = points.find((p) => p.id === newSel[1])!;
          const p2 = points.find((p) => p.id === newSel[2])!;

          const deg = computeAngleDegrees(p1, vert, p2);

          const newAng: GeoAngle = {
            id: 'ang_' + Date.now(),
            p1: p1.id,
            vertex: vert.id,
            p2: p2.id,
            isRightAngle: Math.abs(deg - 90) < 0.5,
            showDegrees: true,
            degreeValue: deg,
            color: '#ea580c'
          };

          setAngles((prev) => [...prev, newAng]);
          setSelectedPointIds([]);
          setStatusMessage(`Đã đo góc ∠${p1.label}${vert.label}${p2.label} = ${deg}°!`);
        }
      }
      return;
    }

    // Right Angle Mark Tool (3 points)
    if (activeMode === 'rightAngleMark') {
      if (hitPoint) {
        const newSel = [...selectedPointIds, hitPoint.id];
        setSelectedPointIds(newSel);

        if (newSel.length === 1) {
          setStatusMessage(`Chọn đỉnh của góc vuông.`);
        } else if (newSel.length === 2) {
          setStatusMessage(`Chọn điểm cạnh thứ 2.`);
        } else if (newSel.length === 3) {
          pushHistory();
          const p1 = points.find((p) => p.id === newSel[0])!;
          const vert = points.find((p) => p.id === newSel[1])!;
          const p2 = points.find((p) => p.id === newSel[2])!;

          const rightAng: GeoAngle = {
            id: 'ang_sq_' + Date.now(),
            p1: p1.id,
            vertex: vert.id,
            p2: p2.id,
            isRightAngle: true,
            color: '#dc2626'
          };

          setAngles((prev) => [...prev, rightAng]);
          setSelectedPointIds([]);
          setStatusMessage(`Đã thêm ký hiệu góc vuông 90° tại đỉnh ${vert.label}!`);
        }
      }
      return;
    }

    // Measure Real Distance & Length of Segment (Đo thật, chính xác theo tọa độ và quy đổi cm)
    if (activeMode === 'measureLength') {
      if (hitPoint) {
        if (selectedPointIds.length === 0) {
          setSelectedPointIds([hitPoint.id]);
          setStatusMessage(`Đã chọn điểm ${hitPoint.label}. Hãy chọn điểm thứ hai để đo độ dài thực tế.`);
        } else if (selectedPointIds.length === 1 && selectedPointIds[0] !== hitPoint.id) {
          const p1 = points.find((p) => p.id === selectedPointIds[0])!;
          const p2 = hitPoint;
          const pixelDist = dist(p1.x, p1.y, p2.x, p2.y);
          const realCm = (pixelDist / pxPerCm).toFixed(1).replace(/\.0$/, '');

          pushHistory();
          setLines((prev) => {
            const existing = prev.find((l) => (l.p1 === p1.id && l.p2 === p2.id) || (l.p1 === p2.id && l.p2 === p1.id));
            if (existing) {
              return prev.map((l) =>
                l.id === existing.id
                  ? { ...l, label: `${p1.label}${p2.label}`, lengthValue: `${realCm} cm` }
                  : l
              );
            } else {
              return [
                ...prev,
                {
                  id: 'l_' + Date.now(),
                  p1: p1.id,
                  p2: p2.id,
                  type: 'segment',
                  label: `${p1.label}${p2.label}`,
                  lengthValue: `${realCm} cm`,
                  color: lineColor,
                  width: lineWidth
                }
              ];
            }
          });
          setSelectedPointIds([]);
          setStatusMessage(`✓ ĐO THẬT: Độ dài ${p1.label}${p2.label} = ${realCm} cm (${Math.round(pixelDist)} px).`);
        }
      }
      return;
    }
  };

  // Canvas Mouse Move (Drag points or virtual instruments)
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggedPointId) return;
    const { x, y } = getCanvasCoords(e);
    setPoints((prev) => prev.map((p) => (p.id === draggedPointId ? { ...p, x, y } : p)));
  };

  // Canvas Mouse Up
  const handleMouseUp = () => {
    if (draggedPointId) {
      setDraggedPointId(null);
    }
  };

  // Draw segment along Ruler Edge
  const handleDrawAlongRuler = () => {
    pushHistory();
    const rad = (rulerAngle * Math.PI) / 180;
    const p1x = rulerPos.x;
    const p1y = rulerPos.y;
    const p2x = rulerPos.x + Math.cos(rad) * rulerLength;
    const p2y = rulerPos.y + Math.sin(rad) * rulerLength;

    const pA: GeoPoint = {
      id: 'p_r1_' + Date.now(),
      x: p1x,
      y: p1y,
      label: String.fromCharCode(65 + (points.length % 26)),
      color: pointColor
    };
    const pB: GeoPoint = {
      id: 'p_r2_' + Date.now(),
      x: p2x,
      y: p2y,
      label: String.fromCharCode(66 + (points.length % 26)),
      color: pointColor
    };

    const newLine: GeoLine = {
      id: 'l_r_' + Date.now(),
      p1: pA.id,
      p2: pB.id,
      type: 'segment',
      color: lineColor,
      width: lineWidth,
      dashed: isDashedNext
    };

    setPoints((prev) => [...prev, pA, pB]);
    setLines((prev) => [...prev, newLine]);
    setStatusMessage(`Đã kẻ đoạn thẳng ${pA.label}${pB.label} theo mép thước thẳng!`);
  };

  // Stamp circle using Compass
  const handleDrawWithCompass = () => {
    pushHistory();
    const centerO: GeoPoint = {
      id: 'p_comp_O_' + Date.now(),
      x: compassPos.x,
      y: compassPos.y,
      label: 'O',
      color: '#dc2626'
    };

    const newCircle: GeoCircle = {
      id: 'c_comp_' + Date.now(),
      centerId: centerO.id,
      radiusValue: compassRadius,
      type: 'standard',
      color: '#2563eb'
    };

    setPoints((prev) => [...prev, centerO]);
    setCircles((prev) => [...prev, newCircle]);
    setStatusMessage(`Đã dùng compa quay đường tròn tâm (O) bán kính ${Math.round(compassRadius / 10)} cm!`);
  };

  // Stamp right angle using Set Square (Ê-ke)
  const handleDrawWithSetSquare = () => {
    pushHistory();
    const rad = (setSquareAngle * Math.PI) / 180;
    const size = 150;
    const vX = setSquarePos.x;
    const vY = setSquarePos.y;

    const p1x = vX + Math.cos(rad) * size;
    const p1y = vY + Math.sin(rad) * size;

    const p2x = vX + Math.cos(rad + Math.PI / 2) * size;
    const p2y = vY + Math.sin(rad + Math.PI / 2) * size;

    const pV: GeoPoint = { id: 'p_eke_V_' + Date.now(), x: vX, y: vY, label: 'A', color: '#dc2626' };
    const p1: GeoPoint = { id: 'p_eke_1_' + Date.now(), x: p1x, y: p1y, label: 'B', color: '#dc2626' };
    const p2: GeoPoint = { id: 'p_eke_2_' + Date.now(), x: p2x, y: p2y, label: 'C', color: '#dc2626' };

    const l1: GeoLine = { id: 'l_eke_1_' + Date.now(), p1: pV.id, p2: p1.id, type: 'segment', color: lineColor };
    const l2: GeoLine = { id: 'l_eke_2_' + Date.now(), p1: pV.id, p2: p2.id, type: 'segment', color: lineColor };

    const rightAng: GeoAngle = {
      id: 'ang_eke_' + Date.now(),
      p1: p1.id,
      vertex: pV.id,
      p2: p2.id,
      isRightAngle: true,
      color: '#dc2626'
    };

    setPoints((prev) => [...prev, pV, p1, p2]);
    setLines((prev) => [...prev, l1, l2]);
    setAngles((prev) => [...prev, rightAng]);
    setStatusMessage(`Đã dùng Ê-ke kẻ góc vuông 90° tại đỉnh ${pV.label}!`);
  };

  // Preset Shapes for Curriculum Grades 1 - 12
  const handleLoadPreset = (presetKey: string) => {
    pushHistory();
    if (presetKey === 'square_elem') {
      // Grade 1-5: Exact Square ABCD (Side = 180px = 6.0cm)
      setPoints([
        { id: 'p_A', x: 170, y: 130, label: 'A', color: '#dc2626' },
        { id: 'p_B', x: 350, y: 130, label: 'B', color: '#dc2626' },
        { id: 'p_C', x: 350, y: 310, label: 'C', color: '#dc2626' },
        { id: 'p_D', x: 170, y: 310, label: 'D', color: '#dc2626' }
      ]);
      setLines([
        { id: 'l_AB', p1: 'p_A', p2: 'p_B', type: 'segment', label: 'a', color: '#2563eb' },
        { id: 'l_BC', p1: 'p_B', p2: 'p_C', type: 'segment', label: 'a', color: '#2563eb' },
        { id: 'l_CD', p1: 'p_C', p2: 'p_D', type: 'segment', label: 'a', color: '#2563eb' },
        { id: 'l_DA', p1: 'p_D', p2: 'p_A', type: 'segment', label: 'a', color: '#2563eb' }
      ]);
      setCircles([]);
      setAngles([
        { id: 'ang_A', p1: 'p_B', vertex: 'p_A', p2: 'p_D', isRightAngle: true, color: '#dc2626' },
        { id: 'ang_B', p1: 'p_A', vertex: 'p_B', p2: 'p_C', isRightAngle: true, color: '#dc2626' },
        { id: 'ang_C', p1: 'p_B', vertex: 'p_C', p2: 'p_D', isRightAngle: true, color: '#dc2626' },
        { id: 'ang_D', p1: 'p_C', vertex: 'p_D', p2: 'p_A', isRightAngle: true, color: '#dc2626' }
      ]);
      setStatusMessage('Đã tải mẫu: Hình Vuông ABCD (Kích thước thật: cạnh 6.0 cm, 4 góc vuông 90°)');
    } else if (presetKey === 'right_triangle_alt') {
      // Grade 7-9: Right Triangle ABC with Altitude AH
      setPoints([
        { id: 'p_A', x: 180, y: 100, label: 'A', color: '#dc2626' },
        { id: 'p_B', x: 100, y: 340, label: 'B', color: '#dc2626' },
        { id: 'p_C', x: 480, y: 340, label: 'C', color: '#dc2626' },
        { id: 'p_H', x: 180, y: 340, label: 'H', color: '#10b981' }
      ]);
      setLines([
        { id: 'l_AB', p1: 'p_A', p2: 'p_B', type: 'segment', color: '#2563eb', label: 'c' },
        { id: 'l_BC', p1: 'p_B', p2: 'p_C', type: 'segment', color: '#2563eb', label: 'a' },
        { id: 'l_CA', p1: 'p_C', p2: 'p_A', type: 'segment', color: '#2563eb', label: 'b' },
        { id: 'l_AH', p1: 'p_A', p2: 'p_H', type: 'perpendicular', color: '#10b981', label: 'h' }
      ]);
      setCircles([]);
      setAngles([
        { id: 'ang_A', p1: 'p_B', vertex: 'p_A', p2: 'p_C', isRightAngle: true, color: '#dc2626' },
        { id: 'ang_H', p1: 'p_A', vertex: 'p_H', p2: 'p_C', isRightAngle: true, color: '#10b981' }
      ]);
      setStatusMessage('Đã tải mẫu: Tam giác vuông ABC vuông tại A có đường cao AH');
    } else if (presetKey === 'pyramid_sabcd_3d') {
      // Grade 11-12: Pyramid S.ABCD with hidden dashed edges
      setPoints([
        { id: 'p_S', x: 260, y: 50, label: 'S', color: '#dc2626' },
        { id: 'p_A', x: 180, y: 220, label: 'A', color: '#2563eb' },
        { id: 'p_B', x: 100, y: 340, label: 'B', color: '#2563eb' },
        { id: 'p_C', x: 400, y: 340, label: 'C', color: '#2563eb' },
        { id: 'p_D', x: 480, y: 220, label: 'D', color: '#2563eb' }
      ]);
      setLines([
        { id: 'l_SA', p1: 'p_S', p2: 'p_A', type: 'segment', dashed: true, color: '#ea580c' },
        { id: 'l_SB', p1: 'p_S', p2: 'p_B', type: 'segment', dashed: false, color: '#2563eb' },
        { id: 'l_SC', p1: 'p_S', p2: 'p_C', type: 'segment', dashed: false, color: '#2563eb' },
        { id: 'l_SD', p1: 'p_S', p2: 'p_D', type: 'segment', dashed: false, color: '#2563eb' },
        { id: 'l_AB', p1: 'p_A', p2: 'p_B', type: 'segment', dashed: true, color: '#ea580c' },
        { id: 'l_AD', p1: 'p_A', p2: 'p_D', type: 'segment', dashed: true, color: '#ea580c' },
        { id: 'l_BC', p1: 'p_B', p2: 'p_C', type: 'segment', dashed: false, color: '#2563eb' },
        { id: 'l_CD', p1: 'p_C', p2: 'p_D', type: 'segment', dashed: false, color: '#2563eb' }
      ]);
      setCircles([]);
      setAngles([]);
      setStatusMessage('Đã tải mẫu: Hình Chóp Tứ Giác S.ABCD (Không gian 3D nét đứt nét liền)');
    } else if (presetKey === 'rectangle_elem') {
      // Grade 1-5: Exact Rectangle ABCD (Width = 300px = 10.0cm, Height = 180px = 6.0cm)
      setPoints([
        { id: 'p_A', x: 130, y: 140, label: 'A', color: '#dc2626' },
        { id: 'p_B', x: 430, y: 140, label: 'B', color: '#dc2626' },
        { id: 'p_C', x: 430, y: 320, label: 'C', color: '#dc2626' },
        { id: 'p_D', x: 130, y: 320, label: 'D', color: '#dc2626' }
      ]);
      setLines([
        { id: 'l_AB', p1: 'p_A', p2: 'p_B', type: 'segment', label: 'a', color: '#2563eb' },
        { id: 'l_BC', p1: 'p_B', p2: 'p_C', type: 'segment', label: 'b', color: '#2563eb' },
        { id: 'l_CD', p1: 'p_C', p2: 'p_D', type: 'segment', label: 'a', color: '#2563eb' },
        { id: 'l_DA', p1: 'p_D', p2: 'p_A', type: 'segment', label: 'b', color: '#2563eb' }
      ]);
      setCircles([]);
      setAngles([
        { id: 'ang_A', p1: 'p_B', vertex: 'p_A', p2: 'p_D', isRightAngle: true, color: '#dc2626' },
        { id: 'ang_B', p1: 'p_A', vertex: 'p_B', p2: 'p_C', isRightAngle: true, color: '#dc2626' }
      ]);
      setStatusMessage('Đã tải mẫu: Hình Chữ Nhật ABCD (Kích thước thật: 10.0 cm x 6.0 cm, 4 góc vuông)');
    } else if (presetKey === 'equilateral_triangle') {
      // Grade 6-8: Exact Equilateral Triangle ABC (All sides = 240px = 8.0cm, All angles = 60.0°)
      setPoints([
        { id: 'p_A', x: 260, y: 142, label: 'A', color: '#dc2626' },
        { id: 'p_B', x: 140, y: 350, label: 'B', color: '#dc2626' },
        { id: 'p_C', x: 380, y: 350, label: 'C', color: '#dc2626' }
      ]);
      setLines([
        { id: 'l_AB', p1: 'p_A', p2: 'p_B', type: 'segment', label: 'a', color: '#2563eb' },
        { id: 'l_BC', p1: 'p_B', p2: 'p_C', type: 'segment', label: 'a', color: '#2563eb' },
        { id: 'l_CA', p1: 'p_C', p2: 'p_A', type: 'segment', label: 'a', color: '#2563eb' }
      ]);
      setCircles([]);
      setAngles([
        { id: 'ang_A', p1: 'p_B', vertex: 'p_A', p2: 'p_C', degreeValue: 60, color: '#ea580c' },
        { id: 'ang_B', p1: 'p_A', vertex: 'p_B', p2: 'p_C', degreeValue: 60, color: '#ea580c' },
        { id: 'ang_C', p1: 'p_A', vertex: 'p_C', p2: 'p_B', degreeValue: 60, color: '#ea580c' }
      ]);
      setStatusMessage('Đã tải mẫu: Tam Giác Đều ABC (Kích thước thật: 3 cạnh 8.0 cm, 3 góc 60.0°)');
    } else if (presetKey === 'parallelogram') {
      // Grade 8: Parallelogram ABCD
      setPoints([
        { id: 'p_A', x: 180, y: 140, label: 'A', color: '#dc2626' },
        { id: 'p_B', x: 440, y: 140, label: 'B', color: '#dc2626' },
        { id: 'p_C', x: 360, y: 330, label: 'C', color: '#dc2626' },
        { id: 'p_D', x: 100, y: 330, label: 'D', color: '#dc2626' }
      ]);
      setLines([
        { id: 'l_AB', p1: 'p_A', p2: 'p_B', type: 'segment', color: '#2563eb' },
        { id: 'l_BC', p1: 'p_B', p2: 'p_C', type: 'segment', color: '#2563eb' },
        { id: 'l_CD', p1: 'p_C', p2: 'p_D', type: 'segment', color: '#2563eb' },
        { id: 'l_DA', p1: 'p_D', p2: 'p_A', type: 'segment', color: '#2563eb' }
      ]);
      setCircles([]);
      setAngles([]);
      setStatusMessage('Đã tải mẫu: Hình Bình Hành ABCD');
    } else if (presetKey === 'trapezoid') {
      // Grade 8: Isosceles Trapezoid ABCD
      setPoints([
        { id: 'p_A', x: 190, y: 130, label: 'A', color: '#dc2626' },
        { id: 'p_B', x: 370, y: 130, label: 'B', color: '#dc2626' },
        { id: 'p_C', x: 470, y: 330, label: 'C', color: '#dc2626' },
        { id: 'p_D', x: 90, y: 330, label: 'D', color: '#dc2626' }
      ]);
      setLines([
        { id: 'l_AB', p1: 'p_A', p2: 'p_B', type: 'segment', label: 'Đáy nhỏ', color: '#2563eb' },
        { id: 'l_BC', p1: 'p_B', p2: 'p_C', type: 'segment', color: '#2563eb' },
        { id: 'l_CD', p1: 'p_C', p2: 'p_D', type: 'segment', label: 'Đáy lớn', color: '#2563eb' },
        { id: 'l_DA', p1: 'p_D', p2: 'p_A', type: 'segment', color: '#2563eb' }
      ]);
      setCircles([]);
      setAngles([]);
      setStatusMessage('Đã tải mẫu: Hình Thang Cân ABCD');
    } else if (presetKey === 'cube_3d') {
      // Grade 11-12: Cube ABCD.A'B'C'D' (3D)
      setPoints([
        { id: 'p_A1', x: 150, y: 100, label: "A'", color: '#dc2626' },
        { id: 'p_B1', x: 330, y: 100, label: "B'", color: '#dc2626' },
        { id: 'p_C1', x: 430, y: 180, label: "C'", color: '#dc2626' },
        { id: 'p_D1', x: 250, y: 180, label: "D'", color: '#dc2626' },
        { id: 'p_A', x: 150, y: 260, label: 'A', color: '#2563eb' },
        { id: 'p_B', x: 330, y: 260, label: 'B', color: '#2563eb' },
        { id: 'p_C', x: 430, y: 340, label: 'C', color: '#2563eb' },
        { id: 'p_D', x: 250, y: 340, label: 'D', color: '#2563eb' }
      ]);
      setLines([
        { id: 'l_t1', p1: 'p_A1', p2: 'p_B1', type: 'segment', dashed: false, color: '#2563eb' },
        { id: 'l_t2', p1: 'p_B1', p2: 'p_C1', type: 'segment', dashed: false, color: '#2563eb' },
        { id: 'l_t3', p1: 'p_C1', p2: 'p_D1', type: 'segment', dashed: false, color: '#2563eb' },
        { id: 'l_t4', p1: 'p_D1', p2: 'p_A1', type: 'segment', dashed: false, color: '#2563eb' },
        { id: 'l_b1', p1: 'p_A', p2: 'p_B', type: 'segment', dashed: true, color: '#ea580c' },
        { id: 'l_b2', p1: 'p_B', p2: 'p_C', type: 'segment', dashed: false, color: '#2563eb' },
        { id: 'l_b3', p1: 'p_C', p2: 'p_D', type: 'segment', dashed: false, color: '#2563eb' },
        { id: 'l_b4', p1: 'p_D', p2: 'p_A', type: 'segment', dashed: true, color: '#ea580c' },
        { id: 'l_v1', p1: 'p_A1', p2: 'p_A', type: 'segment', dashed: true, color: '#ea580c' },
        { id: 'l_v2', p1: 'p_B1', p2: 'p_B', type: 'segment', dashed: false, color: '#2563eb' },
        { id: 'l_v3', p1: 'p_C1', p2: 'p_C', type: 'segment', dashed: false, color: '#2563eb' },
        { id: 'l_v4', p1: 'p_D1', p2: 'p_D', type: 'segment', dashed: false, color: '#2563eb' }
      ]);
      setCircles([]);
      setAngles([]);
      setStatusMessage("Đã tải mẫu: Hình Lập Phương ABCD.A'B'C'D' (3D Chuẩn nét đứt)");
    } else if (presetKey === 'prism_3d') {
      // Grade 11-12: Triangular Prism ABC.A'B'C'
      setPoints([
        { id: 'p_A', x: 180, y: 80, label: "A'", color: '#dc2626' },
        { id: 'p_B', x: 100, y: 160, label: "B'", color: '#dc2626' },
        { id: 'p_C', x: 340, y: 140, label: "C'", color: '#dc2626' },
        { id: 'p_A1', x: 180, y: 260, label: 'A', color: '#2563eb' },
        { id: 'p_B1', x: 100, y: 340, label: 'B', color: '#2563eb' },
        { id: 'p_C1', x: 340, y: 320, label: 'C', color: '#2563eb' }
      ]);
      setLines([
        { id: 'l_top1', p1: 'p_A', p2: 'p_B', type: 'segment', dashed: false, color: '#2563eb' },
        { id: 'l_top2', p1: 'p_B', p2: 'p_C', type: 'segment', dashed: false, color: '#2563eb' },
        { id: 'l_top3', p1: 'p_C', p2: 'p_A', type: 'segment', dashed: false, color: '#2563eb' },
        { id: 'l_bot1', p1: 'p_A1', p2: 'p_B1', type: 'segment', dashed: true, color: '#ea580c' },
        { id: 'l_bot2', p1: 'p_B1', p2: 'p_C1', type: 'segment', dashed: false, color: '#2563eb' },
        { id: 'l_bot3', p1: 'p_C1', p2: 'p_A1', type: 'segment', dashed: true, color: '#ea580c' },
        { id: 'l_lat1', p1: 'p_A', p2: 'p_A1', type: 'segment', dashed: true, color: '#ea580c' },
        { id: 'l_lat2', p1: 'p_B', p2: 'p_B1', type: 'segment', dashed: false, color: '#2563eb' },
        { id: 'l_lat3', p1: 'p_C', p2: 'p_C1', type: 'segment', dashed: false, color: '#2563eb' }
      ]);
      setCircles([]);
      setAngles([]);
      setStatusMessage("Đã tải mẫu: Hình Lăng Trụ Đứng ABC.A'B'C'");
    }
  };

  // AI Image Recognition (Tách và nhận diện đối tượng hình học từ ảnh tải lên hoặc dán)
  const handleProcessImageToGeometry = async (dataUrl: string) => {
    setIsAiRecognizing(true);
    setAiRecognizeStatus('AI Gemini Vision đang phân tích các đỉnh, đoạn thẳng, góc và đường tròn trong hình...');

    const prompt = `Bạn là Trợ lý AI Chuyên gia Hình học và Trắc địa.
Nhiệm vụ của bạn: Hãy phân tích bức ảnh hình học này và chuyển đổi thành cấu trúc các điểm, đoạn thẳng (nét liền/đứt), đường tròn và góc vuông.
Trả về định dạng JSON thuần túy (không kèm markdown \`\`\`json):
{
  "points": [
    { "id": "p_A", "x": 200, "y": 80, "label": "A", "color": "#dc2626" },
    { "id": "p_B", "x": 100, "y": 300, "label": "B", "color": "#dc2626" }
  ],
  "lines": [
    { "id": "l_1", "p1": "p_A", "p2": "p_B", "dashed": false, "label": "c" }
  ],
  "circles": [],
  "angles": []
}
Tọa độ x từ 50 đến 600, y từ 50 đến 400.`;

    try {
      const result = await performOcrOnImageDataUrl(dataUrl, [], prompt);
      if (result) {
        // Parse json from result
        const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (parsed && Array.isArray(parsed.points) && parsed.points.length > 0) {
          pushHistory();
          setPoints(parsed.points);
          if (Array.isArray(parsed.lines)) setLines(parsed.lines);
          if (Array.isArray(parsed.circles)) setCircles(parsed.circles);
          if (Array.isArray(parsed.angles)) setAngles(parsed.angles);
          setAiRecognizeStatus('✅ Đã nhận diện và tạo thành công các đối tượng tương tác từ hình ảnh!');
        } else {
          setAiRecognizeStatus('⚠️ Không tìm thấy cấu trúc hình học phù hợp trong ảnh.');
        }
      }
    } catch (err: any) {
      setAiRecognizeStatus(`❌ Lỗi phân tích: ${err?.message || String(err)}`);
    } finally {
      setIsAiRecognizing(false);
    }
  };

  // Handle File upload for image recognition
  const handleImageFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      handleProcessImageToGeometry(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // High-Resolution Lossless Copy / Export
  const handleCopyImageLossless = (transparent: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width;
    const h = canvas.height;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = w;
    exportCanvas.height = h;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    if (!transparent && canvasBg !== 'transparent') {
      ctx.fillStyle = canvasBg === 'dark' ? '#090d16' : '#ffffff';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.drawImage(canvas, 0, 0);

    exportCanvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setIsCopied(true);
        setStatusMessage('✓ Đã sao chép ảnh hình học vào bộ nhớ tạm! Bạn có thể nhấn Ctrl + V để dán ngay vào Word/PowerPoint.');
        setTimeout(() => setIsCopied(false), 3000);
      } catch (err) {
        const url = exportCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `hinh_hoc_${Date.now()}.png`;
        link.href = url;
        link.click();
        setStatusMessage('Đã tải ảnh PNG hình học về máy tính!');
      }
    }, 'image/png');
  };

  // Step-by-step drawing tutorial library
  const drawingGuides = [
    {
      id: 'triangle_altitude',
      title: 'Vẽ Tam Giác Vuông & Hạ Đường Cao (Lớp 7 - 9)',
      steps: [
        'Bước 1: Dùng Thước thẳng kẻ cạnh đáy BC nằm ngang dài 6cm.',
        'Bước 2: Dùng Ê-ke đặt góc 90° tại đỉnh A, kẻ 2 cạnh góc vuông AB và AC vuông góc.',
        'Bước 3: Chọn công cụ "📐 Đường cao ⊥", bấm đỉnh A và 2 điểm B, C để tự động hạ đường cao AH vuông góc.',
        'Bước 4: Bấm "🏷️ Gán độ dài" hoặc "Đo góc" để kiểm tra các thông số.'
      ]
    },
    {
      id: 'bisector_compass',
      title: 'Dựng Tia Phân Giác Bằng Compa (Lớp 6 - 8)',
      steps: [
        'Bước 1: Vẽ góc xOy bất kỳ.',
        'Bước 2: Mở Compa với bán kính tùy ý, đặt kim tại đỉnh O, quay cung tròn cắt Ox tại A và Oy tại B.',
        'Bước 3: Giữ nguyên bán kính compa, lần lượt đặt kim tại A và B, quay 2 cung tròn cắt nhau tại điểm C.',
        'Bước 4: Nối tia OC, ta được tia phân giác của góc xOy.'
      ]
    },
    {
      id: 'pyramid_3d',
      title: 'Vẽ Hình Chóp S.ABCD Trong Không Gian 3D (Lớp 11 - 12)',
      steps: [
        'Bước 1: Vẽ đáy ABCD là hình bình hành với cạnh AB và AD là NÉT ĐỨT (vì bị khuất), BC và CD là NÉT LIỀN.',
        'Bước 2: Lấy điểm đỉnh S nằm phía trên mặt phẳng đáy.',
        'Bước 3: Nối cạnh bên SA bằng NÉT ĐỨT (nằm phía sau), các cạnh SB, SC, SD bằng NÉT LIỀN.',
        'Bước 4: Kéo thả các đỉnh để xoay góc nhìn 3D trực quan nhất!'
      ]
    }
  ];

  return (
    <div
      ref={containerRef}
      className={`bg-slate-900 border border-indigo-700/60 rounded-2xl shadow-2xl transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 p-4 bg-slate-950 overflow-auto' : 'p-4 sm:p-5 space-y-4'
      }`}
    >
      {/* 1. Header Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-900/40">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              GEOMETRY STUDIO - VẼ HÌNH HỌC TƯƠNG TÁC ĐA NĂNG (GSP STYLE)
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                EUCLID & 3D
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Đầy đủ Thước thẳng, Compa, Ê-ke, Thước đo góc, AI nhận diện hình ảnh, vẽ tia phân giác, đường tròn qua 3 điểm và tách nền chống mất nét.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Background switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setCanvasBg('white')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                canvasBg === 'white' ? 'bg-white text-slate-900 shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Nền trắng sáng chuẩn in ấn Word & Giáo án"
            >
              ⚪ Nền Trắng
            </button>
            <button
              type="button"
              onClick={() => setCanvasBg('dark')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                canvasBg === 'dark' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Nền tối bảo vệ mắt cho máy chiếu"
            >
              ⚫ Nền Tối
            </button>
            <button
              type="button"
              onClick={() => setCanvasBg('grid_school')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                canvasBg === 'grid_school' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Lưới ô ly vở học sinh"
            >
              📄 Ô Ly Vở
            </button>
          </div>

          {/* Tutorial Guide button */}
          <button
            type="button"
            onClick={() => setIsGuideModalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white flex items-center gap-1.5 shadow"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Hướng Dẫn Vẽ Hình</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              isFullscreen
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Phóng toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
          </button>
        </div>
      </div>

      {/* 2. Virtual Geometry Instruments HUD Bar (Thước thẳng, Compa, Ê-ke, Thước đo góc) */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/80 p-2.5 rounded-xl border border-indigo-800/40">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 mr-1">
            <Ruler className="w-4 h-4 text-cyan-400" />
            <span>Dụng Cụ Vẽ Hình Trực Quan:</span>
          </span>

          <button
            type="button"
            onClick={() => setActiveInstrument(activeInstrument === 'ruler' ? 'none' : 'ruler')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all ${
              activeInstrument === 'ruler'
                ? 'bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-600/40'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Thước Thẳng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveInstrument(activeInstrument === 'compass' ? 'none' : 'compass')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all ${
              activeInstrument === 'compass'
                ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/40'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Compa</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveInstrument(activeInstrument === 'set_square' ? 'none' : 'set_square')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all ${
              activeInstrument === 'set_square'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/40'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Triangle className="w-3.5 h-3.5" />
            <span>Ê-ke (Góc Vuông)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveInstrument(activeInstrument === 'protractor' ? 'none' : 'protractor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all ${
              activeInstrument === 'protractor'
                ? 'bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-600/40'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Circle className="w-3.5 h-3.5" />
            <span>Thước Đo Góc 180°</span>
          </button>
        </div>

        {/* AI Image to Geometry Recognition input */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={imageUploadInputRef}
            onChange={handleImageFileInput}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => imageUploadInputRef.current?.click()}
            disabled={isAiRecognizing}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white flex items-center gap-1.5 shadow"
          >
            {isAiRecognizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5 text-amber-300" />}
            <span>AI Nhận Diện Hình Từ Ảnh / Đề Thi</span>
          </button>
        </div>
      </div>

      {/* Virtual Instrument Interactive Controller Floating Sub-bar */}
      {activeInstrument !== 'none' && (
        <div className="flex flex-wrap items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-sky-800/50 text-xs animate-in fade-in">
          {activeInstrument === 'ruler' && (
            <>
              <span className="font-bold text-sky-400">📏 Thước Thẳng ({Math.round(rulerLength / 20)} cm, {rulerAngle}°):</span>
              <button
                type="button"
                onClick={() => setRulerAngle((prev) => (prev + 15) % 360)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 font-medium flex items-center gap-1"
              >
                <RotateCw className="w-3 h-3" /> Xoay +15°
              </button>
              <button
                type="button"
                onClick={() => setRulerAngle((prev) => (prev - 15 + 360) % 360)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 font-medium flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Xoay -15°
              </button>
              <button
                type="button"
                onClick={handleDrawAlongRuler}
                className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold shadow flex items-center gap-1"
              >
                ✏️ Kẻ Đoạn Thẳng Theo Mép Thước
              </button>
            </>
          )}

          {activeInstrument === 'compass' && (
            <>
              <span className="font-bold text-purple-400">⭕ Compa (Bán kính: {Math.round(compassRadius / 10)} cm):</span>
              <button
                type="button"
                onClick={() => setCompassRadius((prev) => Math.min(220, prev + 15))}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 font-medium"
              >
                ➕ Mở Rộng Bán Kính
              </button>
              <button
                type="button"
                onClick={() => setCompassRadius((prev) => Math.max(30, prev - 15))}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 font-medium"
              >
                ➖ Thu Hẹp
              </button>
              <button
                type="button"
                onClick={handleDrawWithCompass}
                className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold shadow flex items-center gap-1"
              >
                ⭕ Quay Compa Vẽ Đường Tròn
              </button>
            </>
          )}

          {activeInstrument === 'set_square' && (
            <>
              <span className="font-bold text-emerald-400">📐 Ê-ke (Góc vuông 90°):</span>
              <button
                type="button"
                onClick={() => setSetSquareAngle((prev) => (prev + 45) % 360)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 font-medium flex items-center gap-1"
              >
                <RotateCw className="w-3 h-3" /> Xoay 45°
              </button>
              <button
                type="button"
                onClick={handleDrawWithSetSquare}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow flex items-center gap-1"
              >
                📐 Kẻ Góc Vuông 90° Tại Đỉnh Ê-ke
              </button>
            </>
          )}

          {activeInstrument === 'protractor' && (
            <>
              <span className="font-bold text-amber-400">🎯 Thước Đo Góc (0° - 180°):</span>
              <button
                type="button"
                onClick={() => setProtractorAngle((prev) => (prev + 15) % 360)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium flex items-center gap-1"
              >
                <RotateCw className="w-3 h-3" /> Xoay +15°
              </button>
              <button
                type="button"
                onClick={() => setProtractorAngle((prev) => (prev - 15 + 360) % 360)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Xoay -15°
              </button>
              <span className="text-slate-400">Đặt tâm thước vào đỉnh góc cần đo</span>
            </>
          )}
        </div>
      )}

      {/* 3. Secondary Toolbar: Geometric Tools selector */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
        {/* Left tool buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveMode('select')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              activeMode === 'select'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/40'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            👆 Di chuyển điểm
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('addPoint')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              activeMode === 'addPoint'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/40'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            ➕ Thêm điểm
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('segment');
              setSelectedPointIds([]);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              activeMode === 'segment'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/40'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            📏 Nối đoạn thẳng
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('measureAngle');
              setSelectedPointIds([]);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              activeMode === 'measureAngle'
                ? 'bg-orange-600 text-white border-orange-400 shadow-md shadow-orange-600/40'
                : 'bg-slate-900 text-orange-400 border-slate-800 hover:bg-slate-800'
            }`}
            title="Đo số đo góc (Chọn 3 điểm: P1 -> Đỉnh -> P2)"
          >
            🎯 Đo Số Đo Góc (°)
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('rightAngleMark');
              setSelectedPointIds([]);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              activeMode === 'rightAngleMark'
                ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/40'
                : 'bg-slate-900 text-rose-400 border-slate-800 hover:bg-slate-800'
            }`}
            title="Ký hiệu góc vuông 90° (Chọn 3 điểm)"
          >
            📐 Ký Hiệu Góc Vuông
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('bisector');
              setSelectedPointIds([]);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              activeMode === 'bisector'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/40'
                : 'bg-slate-900 text-emerald-400 border-slate-800 hover:bg-slate-800'
            }`}
            title="Dựng tia phân giác của một góc (Chọn 3 điểm A -> Đỉnh B -> C)"
          >
            ✂️ Tia Phân Giác
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('circle3Points');
              setSelectedPointIds([]);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              activeMode === 'circle3Points'
                ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/40'
                : 'bg-slate-900 text-purple-300 border-slate-800 hover:bg-slate-800'
            }`}
            title="Dựng đường tròn ngoại tiếp đi qua 3 điểm"
          >
            ⭕ Đường tròn qua 3 điểm
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('midpoint');
              setSelectedPointIds([]);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              activeMode === 'midpoint'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/40'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            📍 Trung điểm
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('altitude');
              setSelectedPointIds([]);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              activeMode === 'altitude'
                ? 'bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-600/40'
                : 'bg-slate-900 text-amber-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            📐 Đường cao ⊥
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('measureLength');
              setSelectedPointIds([]);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
              activeMode === 'measureLength'
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-600/40'
                : 'bg-slate-900 text-cyan-300 border-slate-800 hover:bg-slate-800'
            }`}
            title="Đo độ dài thực tế giữa 2 điểm (tự động tính theo tọa độ & cm thật)"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>📏 Đo độ dài thật</span>
          </button>

          {/* Toggle Live Real Measurements */}
          <button
            type="button"
            onClick={() => setShowRealMeasurements(!showRealMeasurements)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
              showRealMeasurements
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/40 ring-2 ring-emerald-400/40'
                : 'bg-slate-900 text-emerald-400 border-slate-800 hover:bg-slate-800'
            }`}
            title="Bật/Tắt hiển thị số đo thực tế (cm & độ °) trực tiếp trên canvas"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{showRealMeasurements ? '📐 Số đo thật: BẬT' : '📐 Số đo thật: TẮT'}</span>
          </button>

          {/* Real Scale Ratio Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 font-semibold">Tỉ lệ cm:</span>
            <select
              value={pxPerCm}
              onChange={(e) => setPxPerCm(Number(e.target.value))}
              className="bg-slate-950 text-emerald-300 font-bold border border-slate-700 rounded px-1.5 py-0.5 focus:outline-none focus:border-emerald-400 cursor-pointer"
              title="Quy ước số pixel trên 1 centimet thật"
            >
              <option value={20}>1cm = 20px</option>
              <option value={25}>1cm = 25px</option>
              <option value={30}>1cm = 30px (Chuẩn)</option>
              <option value={40}>1cm = 40px</option>
              <option value={50}>1cm = 50px</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveMode('deleteObject');
              setSelectedPointIds([]);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              activeMode === 'deleteObject'
                ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/40'
                : 'bg-slate-900 text-rose-300 border-slate-800 hover:bg-slate-800'
            }`}
            title="Bấm vào điểm, đoạn thẳng, góc hoặc đường tròn để xóa"
          >
            🗑️ Xóa đối tượng
          </button>

          {/* Dashed toggle */}
          <button
            type="button"
            onClick={() => setIsDashedNext(!isDashedNext)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              isDashedNext
                ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="Chuyển chế độ nét đứt khuất trong không gian 3D"
          >
            {isDashedNext ? '--- Nét Đứt Khuất (ON)' : '── Nét Liền'}
          </button>

          {/* Manage all objects button */}
          <button
            type="button"
            onClick={() => setIsObjectManagerOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 flex items-center gap-1 shadow"
            title="Mở bảng quản lý, đổi tên, đổi màu, kích thước mọi điểm, đoạn thẳng"
          >
            📋 Quản lý đối tượng ({points.length + lines.length + circles.length + angles.length})
          </button>
        </div>

        {/* Undo and Clear */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 border border-slate-800 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Hoàn tác</span>
          </button>

          <button
            type="button"
            onClick={() => {
              pushHistory();
              setPoints([]);
              setLines([]);
              setCircles([]);
              setAngles([]);
              setSelectedPointIds([]);
              setSelectedObjectId(null);
              setSelectedObjectType(null);
              setStatusMessage('Đã xóa toàn bộ bảng vẽ.');
            }}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa hết</span>
          </button>
        </div>
      </div>

      {/* 4. Preset Shapes Bar (Lớp 1 đến 12) */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800/80 text-xs">
        <span className="font-bold text-amber-400 flex items-center gap-1 shrink-0 mr-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Mẫu Hình Lớp 1-12:</span>
        </span>
        <button
          type="button"
          onClick={() => handleLoadPreset('square_elem')}
          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
        >
          Lớp 1-5: Hình Vuông
        </button>
        <button
          type="button"
          onClick={() => handleLoadPreset('rectangle_elem')}
          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
        >
          Lớp 1-5: Hình Chữ Nhật
        </button>
        <button
          type="button"
          onClick={() => handleLoadPreset('equilateral_triangle')}
          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
        >
          Lớp 6-7: Tam Giác Đều
        </button>
        <button
          type="button"
          onClick={() => handleLoadPreset('right_triangle_alt')}
          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
        >
          Lớp 7-9: Tam giác vuông + AH
        </button>
        <button
          type="button"
          onClick={() => handleLoadPreset('parallelogram')}
          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
        >
          Lớp 8: Hình Bình Hành
        </button>
        <button
          type="button"
          onClick={() => handleLoadPreset('trapezoid')}
          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
        >
          Lớp 8: Hình Thang Cân
        </button>
        <button
          type="button"
          onClick={() => handleLoadPreset('pyramid_sabcd_3d')}
          className="px-2 py-1 rounded bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-200 font-medium"
        >
          Lớp 11-12: Chóp S.ABCD (3D)
        </button>
        <button
          type="button"
          onClick={() => handleLoadPreset('cube_3d')}
          className="px-2 py-1 rounded bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-200 font-medium"
        >
          Lớp 11-12: Hình Lập Phương (3D)
        </button>
        <button
          type="button"
          onClick={() => handleLoadPreset('prism_3d')}
          className="px-2 py-1 rounded bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-200 font-medium"
        >
          Lớp 11-12: Lăng Trụ Đứng (3D)
        </button>
      </div>

      {/* Live Object Inspector Panel for Selected Object */}
      {selectedObjectId && selectedObjectType && (
        <GeometryObjectInspector
          selectedObjectId={selectedObjectId}
          selectedObjectType={selectedObjectType}
          points={points}
          lines={lines}
          circles={circles}
          angles={angles}
          pxPerCm={pxPerCm}
          pointColor={pointColor}
          setPointColor={setPointColor}
          pointRadius={pointRadius}
          setPointRadius={setPointRadius}
          lineColor={lineColor}
          setLineColor={setLineColor}
          lineWidth={lineWidth}
          setLineWidth={setLineWidth}
          isDashedNext={isDashedNext}
          setIsDashedNext={setIsDashedNext}
          onUpdatePoint={handleUpdatePoint}
          onUpdateLine={handleUpdateLine}
          onUpdateCircle={handleUpdateCircle}
          onUpdateAngle={handleUpdateAngle}
          onDeletePoint={handleDeletePoint}
          onDeleteLine={handleDeleteLine}
          onDeleteCircle={handleDeleteCircle}
          onDeleteAngle={handleDeleteAngle}
          onOpenManager={() => setIsObjectManagerOpen(true)}
          onClose={() => {
            setSelectedObjectId(null);
            setSelectedObjectType(null);
          }}
        />
      )}

      {/* Geometry Object Manager Modal */}
      {isObjectManagerOpen && (
        <GeometryObjectManagerModal
          isOpen={isObjectManagerOpen}
          onClose={() => setIsObjectManagerOpen(false)}
          points={points}
          lines={lines}
          circles={circles}
          angles={angles}
          onUpdatePoint={handleUpdatePoint}
          onUpdateLine={handleUpdateLine}
          onUpdateCircle={handleUpdateCircle}
          onUpdateAngle={handleUpdateAngle}
          onDeletePoint={handleDeletePoint}
          onDeleteLine={handleDeleteLine}
          onDeleteCircle={handleDeleteCircle}
          onDeleteAngle={handleDeleteAngle}
          onAddPoint={handleAddPointManual}
        />
      )}

      {/* AI Recognize status indicator */}
      {aiRecognizeStatus && (
        <div className="bg-indigo-950/70 border border-indigo-700/50 px-3 py-2 rounded-xl text-xs text-indigo-200 flex items-center justify-between animate-in fade-in">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{aiRecognizeStatus}</span>
          </span>
          <button onClick={() => setAiRecognizeStatus('')} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* 5. Canvas Stage */}
      <div
        className="relative rounded-2xl overflow-hidden border-2 border-indigo-700/60 shadow-2xl select-none"
        style={{
          background: canvasBg === 'white' ? '#ffffff' : canvasBg === 'dark' ? '#090d16' : '#f8fafc'
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={(e) => {
            const coords = getCanvasCoords(e);
            const hit = findPointNear(coords.x, coords.y, 25);
            if (hit) setDraggedPointId(hit.id);
          }}
          onTouchMove={(e) => {
            if (draggedPointId) {
              const coords = getCanvasCoords(e);
              setPoints((prev) => prev.map((p) => (p.id === draggedPointId ? { ...p, x: coords.x, y: coords.y } : p)));
            }
          }}
          onTouchEnd={() => setDraggedPointId(null)}
          className="cursor-crosshair block w-full touch-none"
        />

        {/* High-Contrast anti-loss indicator */}
        <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] text-emerald-300 font-semibold flex items-center gap-1.5 shadow">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Tương phản cao chống mất nét: BẬT</span>
        </div>
      </div>

      {/* 6. Status message & Export Toolbar */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs font-medium text-slate-300 flex items-center gap-2">
          <span className="text-amber-400 font-bold">💡 Trạng thái:</span>
          <span>{statusMessage}</span>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          {/* Direct 1-Click Copy Image to Word */}
          <button
            type="button"
            onClick={() => handleCopyImageLossless(false)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-900/30 flex items-center gap-1.5 transition-all"
            title="Sao chép ảnh chất lượng cao để dán trực tiếp (Ctrl+V) vào Word/Giáo án"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'ĐÃ SAO CHÉP!' : 'SAO CHÉP DÁN VÀO WORD'}</span>
          </button>

          {/* Direct Transparent PNG Export */}
          <button
            type="button"
            onClick={() => handleCopyImageLossless(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/40 flex items-center gap-1.5 transition-all"
            title="Xuất ảnh PNG trong suốt không mất nét"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải PNG Trong Suốt</span>
          </button>

          {/* Open in Background Extractor Modal */}
          <button
            type="button"
            onClick={() => {
              const canvas = canvasRef.current;
              if (canvas && onOpenExtractor) {
                onOpenExtractor(canvas.toDataURL('image/png'));
              }
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
            title="Mở bảng lọc màu nâng cao"
          >
            <Scissors className="w-3.5 h-3.5 text-amber-400" />
            <span>Bộ Lọc Tách Nền</span>
          </button>

          {/* Send to Lesson Plan */}
          {onSendImageToLessonPlan && (
            <button
              type="button"
              onClick={() => {
                const canvas = canvasRef.current;
                if (canvas && onSendImageToLessonPlan) {
                  onSendImageToLessonPlan(canvas.toDataURL('image/png'));
                  alert('✓ Đã chuyển hình vẽ sang Kế hoạch bài dạy (Giáo án) thành công!');
                }
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 transition-all shadow"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dán Vào Giáo Án</span>
            </button>
          )}
        </div>
      </div>

      {/* Step-by-Step Drawing Guide Modal */}
      {isGuideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>HƯỚNG DẪN TỪNG BƯỚC CÁCH VẼ HÌNH HỌC CHO HỌC SINH</span>
              </h3>
              <button
                onClick={() => setIsGuideModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                ✕ Đóng
              </button>
            </div>

            {/* Guide Topics Tab */}
            <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-800">
              {drawingGuides.map((guide) => (
                <button
                  key={guide.id}
                  onClick={() => {
                    setSelectedGuideTopic(guide.id);
                    setGuideCurrentStep(0);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedGuideTopic === guide.id
                      ? 'bg-amber-600 text-white shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {guide.title}
                </button>
              ))}
            </div>

            {/* Steps Content */}
            {(() => {
              const currentGuide = drawingGuides.find((g) => g.id === selectedGuideTopic) || drawingGuides[0];
              return (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                      {currentGuide.title}
                    </h4>
                    <div className="space-y-2 text-xs text-slate-200">
                      {currentGuide.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg border transition-all ${
                            guideCurrentStep === idx
                              ? 'bg-amber-950/50 border-amber-500/60 text-amber-100 font-semibold'
                              : 'bg-slate-900/50 border-slate-800 text-slate-400'
                          }`}
                        >
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setGuideCurrentStep((prev) => Math.max(0, prev - 1))}
                      disabled={guideCurrentStep === 0}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40"
                    >
                      ← Bước trước
                    </button>
                    <span className="text-xs text-slate-400">
                      Bước {guideCurrentStep + 1} / {currentGuide.steps.length}
                    </span>
                    <button
                      onClick={() => setGuideCurrentStep((prev) => Math.min(currentGuide.steps.length - 1, prev + 1))}
                      disabled={guideCurrentStep === currentGuide.steps.length - 1}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-40"
                    >
                      Bước kế tiếp →
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
