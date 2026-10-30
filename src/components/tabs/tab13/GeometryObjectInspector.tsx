import React from 'react';
import { GeoPoint, GeoLine, GeoCircle, GeoAngle } from './InteractiveGeometryCanvas';
import { Trash2, X, Sparkles, Sliders, Layers, Check, Edit2, CircleDot } from 'lucide-react';

const VIBRANT_COLORS = [
  { name: 'Đỏ', hex: '#dc2626' },
  { name: 'Xanh dương', hex: '#2563eb' },
  { name: 'Xanh lá', hex: '#10b981' },
  { name: 'Cam', hex: '#ea580c' },
  { name: 'Tím', hex: '#9333ea' },
  { name: 'Hồng sen', hex: '#e11d48' },
  { name: 'Vàng hổ phách', hex: '#f59e0b' },
  { name: 'Xanh cyan', hex: '#06b6d4' },
  { name: 'Đen than', hex: '#0f172a' },
  { name: 'Trắng tinh', hex: '#ffffff' }
];

interface GeometryObjectInspectorProps {
  selectedObjectId: string | null;
  selectedObjectType: 'point' | 'line' | 'circle' | 'angle' | null;
  points: GeoPoint[];
  lines: GeoLine[];
  circles: GeoCircle[];
  angles: GeoAngle[];
  pxPerCm?: number;
  pointColor?: string;
  setPointColor?: (c: string) => void;
  pointRadius?: number;
  setPointRadius?: (r: number) => void;
  lineColor?: string;
  setLineColor?: (c: string) => void;
  lineWidth?: number;
  setLineWidth?: (w: number) => void;
  isDashedNext?: boolean;
  setIsDashedNext?: (d: boolean) => void;
  onUpdatePoint: (id: string, updates: Partial<GeoPoint>) => void;
  onUpdateLine: (id: string, updates: Partial<GeoLine>) => void;
  onUpdateCircle: (id: string, updates: Partial<GeoCircle>) => void;
  onUpdateAngle: (id: string, updates: Partial<GeoAngle>) => void;
  onDeletePoint: (id: string) => void;
  onDeleteLine: (id: string) => void;
  onDeleteCircle: (id: string) => void;
  onDeleteAngle: (id: string) => void;
  onDeselect?: () => void;
  onClose?: () => void;
  onOpenManager?: () => void;
}

export const GeometryObjectInspector: React.FC<GeometryObjectInspectorProps> = ({
  selectedObjectId,
  selectedObjectType,
  points,
  lines,
  circles,
  angles,
  pxPerCm = 30,
  pointColor,
  setPointColor,
  pointRadius,
  setPointRadius,
  lineColor,
  setLineColor,
  lineWidth,
  setLineWidth,
  isDashedNext,
  setIsDashedNext,
  onUpdatePoint,
  onUpdateLine,
  onUpdateCircle,
  onUpdateAngle,
  onDeletePoint,
  onDeleteLine,
  onDeleteCircle,
  onDeleteAngle,
  onDeselect,
  onClose,
  onOpenManager
}) => {
  const handleDismiss = onDeselect || onClose || (() => {});

  const computeAngleDegrees = (p1?: GeoPoint, vertex?: GeoPoint, p2?: GeoPoint): number => {
    if (!p1 || !vertex || !p2) return 0;
    const v1x = p1.x - vertex.x;
    const v1y = p1.y - vertex.y;
    const v2x = p2.x - vertex.x;
    const v2y = p2.y - vertex.y;
    const dot = v1x * v2x + v1y * v2y;
    const mag1 = Math.hypot(v1x, v1y);
    const mag2 = Math.hypot(v2x, v2y);
    if (mag1 === 0 || mag2 === 0) return 0;
    const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
    return Math.round(((Math.acos(cosAngle) * 180) / Math.PI) * 10) / 10;
  };

  // If Point is selected
  if (selectedObjectType === 'point' && selectedObjectId) {
    const point = points.find((p) => p.id === selectedObjectId);
    if (!point) return null;

    const currentRadius = point.radius || pointRadius || 6;
    const currentColor = point.color || pointColor || '#dc2626';

    return (
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/90 border-2 border-indigo-500/60 p-3 rounded-xl shadow-xl space-y-2.5 animate-in fade-in slide-in-from-top-1">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-800/40 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: currentColor }} />
            <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <CircleDot className="w-3.5 h-3.5" /> Tùy chỉnh Điểm: <span className="text-white text-sm font-bold bg-indigo-900/80 px-2 py-0.5 rounded">{point.label}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDeletePoint(point.id)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600/90 hover:bg-rose-500 text-white flex items-center gap-1 shadow"
              title="Xóa điểm này khỏi bảng vẽ"
            >
              <Trash2 className="w-3 h-3" /> Xóa điểm
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title="Bỏ chọn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Label name */}
          <div className="space-y-1">
            <label className="block text-slate-300 font-semibold">Tên nhãn điểm:</label>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={point.label}
                onChange={(e) => onUpdatePoint(point.id, { label: e.target.value })}
                className="w-full bg-slate-900 border border-indigo-700/60 rounded-lg px-2.5 py-1 text-white font-bold focus:outline-none focus:border-indigo-400"
                placeholder="A, B, C, A', M, S..."
              />
            </div>
          </div>

          {/* Point size */}
          <div className="space-y-1">
            <label className="block text-slate-300 font-semibold">Kích cỡ điểm ({currentRadius}px):</label>
            <div className="flex items-center gap-1">
              {[4, 6, 8, 11].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => onUpdatePoint(point.id, { radius: sz })}
                  className={`flex-1 py-1 rounded-lg font-bold border transition-all ${
                    currentRadius === sz
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {sz === 4 ? 'Nhỏ' : sz === 6 ? 'Vừa' : sz === 8 ? 'Lớn' : 'Rất to'}
                </button>
              ))}
            </div>
          </div>

          {/* Coordinates X, Y with Real Metric */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-slate-300 font-semibold">Tọa độ (X, Y):</label>
              <span className="text-[10px] text-emerald-400 font-mono">~{((point.x) / pxPerCm).toFixed(1)}cm, {((point.y) / pxPerCm).toFixed(1)}cm</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-mono">X:</span>
              <input
                type="number"
                value={Math.round(point.x)}
                onChange={(e) => onUpdatePoint(point.id, { x: Number(e.target.value) || 0 })}
                className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1 text-white font-mono text-center focus:outline-none"
              />
              <span className="text-slate-400 font-mono">Y:</span>
              <input
                type="number"
                value={Math.round(point.y)}
                onChange={(e) => onUpdatePoint(point.id, { y: Number(e.target.value) || 0 })}
                className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1 text-white font-mono text-center focus:outline-none"
              />
            </div>
          </div>

          {/* Color swatches */}
          <div className="space-y-1">
            <label className="block text-slate-300 font-semibold">Màu sắc điểm:</label>
            <div className="flex flex-wrap items-center gap-1.5">
              {VIBRANT_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => onUpdatePoint(point.id, { color: c.hex })}
                  className={`w-5 h-5 rounded-full border transition-all ${
                    currentColor === c.hex
                      ? 'border-amber-400 scale-125 ring-2 ring-amber-400/50 shadow'
                      : 'border-slate-600 hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If Line is selected
  if (selectedObjectType === 'line' && selectedObjectId) {
    const line = lines.find((l) => l.id === selectedObjectId);
    if (!line) return null;

    const p1 = points.find((p) => p.id === line.p1);
    const p2 = points.find((p) => p.id === line.p2);
    const currentColor = line.color || lineColor || '#2563eb';
    const currentWidth = line.width || lineWidth || 2.5;

    // Real Geometric Length Calculation
    const realDistPx = p1 && p2 ? Math.hypot(p2.x - p1.x, p2.y - p1.y) : 0;
    const realDistCm = (realDistPx / pxPerCm).toFixed(1).replace(/\.0$/, '');

    return (
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/90 border-2 border-indigo-500/60 p-3 rounded-xl shadow-xl space-y-2.5 animate-in fade-in slide-in-from-top-1">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-800/40 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 rounded" style={{ backgroundColor: currentColor }} />
            <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> Tùy chỉnh Đoạn thẳng: <span className="text-white text-sm font-bold bg-indigo-900/80 px-2 py-0.5 rounded">{p1?.label || '?'}{p2?.label || '?'}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDeleteLine(line.id)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600/90 hover:bg-rose-500 text-white flex items-center gap-1 shadow"
              title="Xóa đoạn thẳng này"
            >
              <Trash2 className="w-3 h-3" /> Xóa đường
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title="Bỏ chọn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real Measurement Banner */}
        <div className="bg-slate-900/90 border border-emerald-500/40 px-3 py-1.5 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <span>📏 Số đo thực tế:</span>
            </span>
            <span className="text-white font-mono font-bold text-sm bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-600/40">{realDistCm} cm</span>
            <span className="text-slate-400 font-mono">({Math.round(realDistPx)} px)</span>
          </div>
          <button
            type="button"
            onClick={() => onUpdateLine(line.id, { label: `${p1?.label || ''}${p2?.label || ''}`, lengthValue: `${realDistCm} cm` })}
            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow"
            title="Gán số đo thật vào nhãn hiển thị của đoạn thẳng"
          >
            <Check className="w-3 h-3" /> Gán nhãn {realDistCm}cm
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Label / Length Value */}
          <div className="space-y-1">
            <label className="block text-slate-300 font-semibold">Gán ký hiệu / Tên:</label>
            <input
              type="text"
              value={line.label || line.lengthValue || ''}
              onChange={(e) => onUpdateLine(line.id, { label: e.target.value, lengthValue: e.target.value })}
              className="w-full bg-slate-900 border border-indigo-700/60 rounded-lg px-2.5 py-1 text-white font-bold focus:outline-none focus:border-indigo-400"
              placeholder="VD: a, b, c, h_a..."
            />
          </div>

          {/* Thickness */}
          <div className="space-y-1">
            <label className="block text-slate-300 font-semibold">Độ dày nét ({currentWidth}px):</label>
            <div className="flex items-center gap-1">
              {[1.5, 2.5, 4, 6].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => onUpdateLine(line.id, { width: w })}
                  className={`flex-1 py-1 rounded-lg font-bold border transition-all ${
                    currentWidth === w
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {w}px
                </button>
              ))}
            </div>
          </div>

          {/* Style Solid vs Dashed */}
          <div className="space-y-1">
            <label className="block text-slate-300 font-semibold">Kiểu nét (3D / 2D):</label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onUpdateLine(line.id, { dashed: false })}
                className={`flex-1 py-1 rounded-lg font-bold border transition-all ${
                  !line.dashed
                    ? 'bg-sky-600 text-white border-sky-400 shadow'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                ── Nét liền
              </button>
              <button
                type="button"
                onClick={() => onUpdateLine(line.id, { dashed: true })}
                className={`flex-1 py-1 rounded-lg font-bold border transition-all ${
                  line.dashed
                    ? 'bg-amber-600 text-white border-amber-400 shadow'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                --- Nét đứt khuất
              </button>
            </div>
          </div>

          {/* Color swatches */}
          <div className="space-y-1">
            <label className="block text-slate-300 font-semibold">Màu sắc nét vẽ:</label>
            <div className="flex flex-wrap items-center gap-1.5">
              {VIBRANT_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => onUpdateLine(line.id, { color: c.hex })}
                  className={`w-5 h-5 rounded-full border transition-all ${
                    currentColor === c.hex
                      ? 'border-amber-400 scale-125 ring-2 ring-amber-400/50 shadow'
                      : 'border-slate-600 hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If Circle is selected
  if (selectedObjectType === 'circle' && selectedObjectId) {
    const circle = circles.find((c) => c.id === selectedObjectId);
    if (!circle) return null;
    const center = points.find((p) => p.id === circle.centerId);
    const currentColor = circle.color || '#9333ea';

    // Real Circle Metrics
    const radPx = circle.radiusValue || 60;
    const radCm = (radPx / pxPerCm).toFixed(1).replace(/\.0$/, '');
    const circumCm = (2 * Math.PI * (radPx / pxPerCm)).toFixed(1);
    const areaCm2 = (Math.PI * Math.pow(radPx / pxPerCm, 2)).toFixed(1);

    return (
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/90 border-2 border-indigo-500/60 p-3 rounded-xl shadow-xl space-y-2.5 animate-in fade-in slide-in-from-top-1">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-800/40 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full border-2" style={{ borderColor: currentColor }} />
            <span className="text-xs font-extrabold text-purple-400 uppercase tracking-wider">
              Tùy chỉnh Đường Tròn (Tâm {center?.label || 'O'})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDeleteCircle(circle.id)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600/90 hover:bg-rose-500 text-white flex items-center gap-1 shadow"
            >
              <Trash2 className="w-3 h-3" /> Xóa tròn
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real Circle Metrics Banner */}
        <div className="bg-slate-900/90 border border-purple-500/40 px-3 py-1.5 rounded-lg flex flex-wrap items-center gap-4 text-xs font-mono">
          <span className="text-purple-300 font-bold">R = {radCm} cm ({radPx}px)</span>
          <span className="text-slate-300">Chu vi C = {circumCm} cm</span>
          <span className="text-slate-300">Diện tích S = {areaCm2} cm²</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="space-y-1">
            <label className="block text-slate-300 font-semibold">Bán kính R ({radCm}cm):</label>
            <input
              type="number"
              value={circle.radiusValue || 60}
              onChange={(e) => onUpdateCircle(circle.id, { radiusValue: Number(e.target.value) || 30 })}
              className="w-full bg-slate-900 border border-indigo-700/60 rounded-lg px-2.5 py-1 text-white font-bold focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-slate-300 font-semibold">Kiểu nét:</label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onUpdateCircle(circle.id, { dashed: false })}
                className={`flex-1 py-1 rounded-lg font-bold border transition-all ${
                  !circle.dashed ? 'bg-purple-600 text-white border-purple-400' : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}
              >
                ── Nét liền
              </button>
              <button
                type="button"
                onClick={() => onUpdateCircle(circle.id, { dashed: true })}
                className={`flex-1 py-1 rounded-lg font-bold border transition-all ${
                  circle.dashed ? 'bg-amber-600 text-white border-amber-400' : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}
              >
                --- Nét đứt
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-slate-300 font-semibold">Màu sắc:</label>
            <div className="flex flex-wrap items-center gap-1.5">
              {VIBRANT_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => onUpdateCircle(circle.id, { color: c.hex })}
                  className={`w-5 h-5 rounded-full border transition-all ${
                    currentColor === c.hex ? 'border-amber-400 scale-125 ring-2 ring-amber-400/50' : 'border-slate-600 hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If Angle is selected
  if (selectedObjectType === 'angle' && selectedObjectId) {
    const angle = angles.find((a) => a.id === selectedObjectId);
    if (!angle) return null;
    const vert = points.find((p) => p.id === angle.vertex);
    const p1 = points.find((p) => p.id === angle.p1);
    const p2 = points.find((p) => p.id === angle.p2);
    const currentColor = angle.color || '#ea580c';

    // Real Degree Calculation
    const realDeg = computeAngleDegrees(p1, vert, p2);

    return (
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/90 border-2 border-indigo-500/60 p-3 rounded-xl shadow-xl space-y-2.5 animate-in fade-in slide-in-from-top-1">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-800/40 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-orange-400 uppercase tracking-wider">
              Tùy chỉnh Góc (Đỉnh {vert?.label || '?'})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDeleteAngle(angle.id)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600/90 hover:bg-rose-500 text-white flex items-center gap-1 shadow"
            >
              <Trash2 className="w-3 h-3" /> Xóa góc
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real Angle Measurement Banner */}
        <div className="bg-slate-900/90 border border-orange-500/40 px-3 py-1.5 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-orange-400">📐 Góc đo thực tế:</span>
            <span className="text-white font-mono font-bold text-sm bg-orange-950/80 px-2 py-0.5 rounded border border-orange-600/40">{realDeg}°</span>
            <span className="text-slate-400 font-sans">(Tự động cập nhật khi di chuyển các điểm)</span>
          </div>
          {Math.abs(realDeg - 90) < 0.8 && (
            <span className="px-2 py-0.5 rounded bg-rose-900/80 text-rose-300 font-bold text-[11px] border border-rose-600/40">
              ✓ Vuông góc 90°
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <label className="block text-slate-300 font-semibold">Loại ký hiệu góc:</label>
            <button
              type="button"
              onClick={() => onUpdateAngle(angle.id, { isRightAngle: !angle.isRightAngle })}
              className={`w-full py-1.5 rounded-lg font-bold border transition-all ${
                angle.isRightAngle ? 'bg-rose-600 text-white border-rose-400' : 'bg-slate-900 text-slate-300 border-slate-700'
              }`}
            >
              {angle.isRightAngle ? '📐 Ký hiệu góc vuông 90° (BẬT)' : '⭕ Góc thường (Cung tròn)'}
            </button>
          </div>

          <div className="space-y-1">
            <label className="block text-slate-300 font-semibold">Màu sắc:</label>
            <div className="flex flex-wrap items-center gap-1.5">
              {VIBRANT_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => onUpdateAngle(angle.id, { color: c.hex })}
                  className={`w-5 h-5 rounded-full border transition-all ${
                    currentColor === c.hex ? 'border-amber-400 scale-125 ring-2 ring-amber-400/50' : 'border-slate-600 hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If Nothing is selected: Default quick properties & Objects Manager Launcher
  return (
    <div className="bg-slate-950/80 border border-slate-800/90 p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-bold text-slate-400 flex items-center gap-1">
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          <span>Thông Số Mặc Định:</span>
        </span>

        {/* Default Point Color */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Màu điểm:</span>
          <div className="flex items-center gap-1">
            {VIBRANT_COLORS.slice(0, 5).map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setPointColor(c.hex)}
                className={`w-4 h-4 rounded-full border ${
                  pointColor === c.hex ? 'ring-2 ring-white scale-125' : 'border-slate-700'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
        </div>

        {/* Default Line Color */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Màu đường:</span>
          <div className="flex items-center gap-1">
            {VIBRANT_COLORS.slice(1, 6).map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setLineColor(c.hex)}
                className={`w-4 h-4 rounded-full border ${
                  lineColor === c.hex ? 'ring-2 ring-white scale-125' : 'border-slate-700'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
        </div>

        {/* Default Point Size */}
        <div className="flex items-center gap-1">
          <span className="text-slate-400">Cỡ điểm:</span>
          <select
            value={pointRadius}
            onChange={(e) => setPointRadius(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white font-medium text-xs focus:outline-none"
          >
            <option value={4}>4px (Nhỏ)</option>
            <option value={6}>6px (Chuẩn)</option>
            <option value={8}>8px (Lớn)</option>
            <option value={11}>11px (Cực đại)</option>
          </select>
        </div>

        {/* Default Line Width */}
        <div className="flex items-center gap-1">
          <span className="text-slate-400">Nét:</span>
          <select
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white font-medium text-xs focus:outline-none"
          >
            <option value={1.5}>1.5px (Mảnh)</option>
            <option value={2.5}>2.5px (Chuẩn)</option>
            <option value={4}>4.0px (Dày)</option>
            <option value={6}>6.0px (Đậm)</option>
          </select>
        </div>
      </div>

      {/* Button to open Object Manager Tree */}
      <button
        type="button"
        onClick={onOpenManager}
        className="px-3 py-1.5 rounded-lg font-bold bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-700/60 shadow flex items-center gap-1.5 transition-all"
      >
        <Layers className="w-3.5 h-3.5 text-indigo-400" />
        <span>Danh Sách Đối Tượng ({points.length} Điểm, {lines.length} Đường)</span>
      </button>
    </div>
  );
};
