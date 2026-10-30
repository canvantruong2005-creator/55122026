import React, { useState } from 'react';
import { GeoPoint, GeoLine, GeoCircle, GeoAngle } from './InteractiveGeometryCanvas';
import { X, Trash2, Plus, Edit3, Layers, Check, Circle, Minus, Sliders } from 'lucide-react';

interface GeometryObjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  points: GeoPoint[];
  lines: GeoLine[];
  circles: GeoCircle[];
  angles: GeoAngle[];
  onUpdatePoint: (id: string, updates: Partial<GeoPoint>) => void;
  onUpdateLine: (id: string, updates: Partial<GeoLine>) => void;
  onUpdateCircle?: (id: string, updates: Partial<GeoCircle>) => void;
  onUpdateAngle?: (id: string, updates: Partial<GeoAngle>) => void;
  onDeletePoint: (id: string) => void;
  onDeleteLine: (id: string) => void;
  onDeleteCircle: (id: string) => void;
  onDeleteAngle: (id: string) => void;
  onAddPoint: (label: string, x: number, y: number, color: string, radius: number) => void;
  onSelectObject?: (id: string, type: 'point' | 'line' | 'circle' | 'angle') => void;
}

export const GeometryObjectManagerModal: React.FC<GeometryObjectManagerModalProps> = ({
  isOpen,
  onClose,
  points,
  lines,
  circles,
  angles,
  onUpdatePoint,
  onUpdateLine,
  onUpdateCircle,
  onUpdateAngle,
  onDeletePoint,
  onDeleteLine,
  onDeleteCircle,
  onDeleteAngle,
  onAddPoint,
  onSelectObject
}) => {
  const [activeTab, setActiveTab] = useState<'points' | 'lines' | 'circles' | 'angles'>('points');
  const [newPointLabel, setNewPointLabel] = useState('');
  const [newPointX, setNewPointX] = useState(250);
  const [newPointY, setNewPointY] = useState(200);
  const [newPointColor, setNewPointColor] = useState('#dc2626');
  const [newPointRadius, setNewPointRadius] = useState(6);

  if (!isOpen) return null;

  const handleAddNewPointSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newPointLabel.trim() || String.fromCharCode(65 + (points.length % 26));
    onAddPoint(label, Number(newPointX) || 200, Number(newPointY) || 200, newPointColor, newPointRadius);
    setNewPointLabel('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-indigo-700/60 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Quản Lý Danh Sách Đối Tượng Hình Học</h3>
              <p className="text-xs text-slate-400">Xem, đổi tên, thay đổi kích cỡ, màu sắc hoặc xóa điểm, đoạn thẳng, đường tròn.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 pt-3 border-b border-slate-800 bg-slate-950/40 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('points')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'points'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📍 Điểm Số ({points.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lines')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'lines'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📏 Đoạn Thẳng ({lines.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('circles')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'circles'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>⭕ Đường Tròn ({circles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('angles')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'angles'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📐 Góc ({angles.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: POINTS */}
          {activeTab === 'points' && (
            <div className="space-y-4">
              {/* Add new point form */}
              <form onSubmit={handleAddNewPointSubmit} className="bg-slate-950 p-3 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs items-end">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tên điểm:</label>
                  <input
                    type="text"
                    value={newPointLabel}
                    onChange={(e) => setNewPointLabel(e.target.value)}
                    placeholder="VD: D, S, M..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tọa độ X:</label>
                  <input
                    type="number"
                    value={newPointX}
                    onChange={(e) => setNewPointX(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tọa độ Y:</label>
                  <input
                    type="number"
                    value={newPointY}
                    onChange={(e) => setNewPointY(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cỡ điểm:</label>
                  <select
                    value={newPointRadius}
                    onChange={(e) => setNewPointRadius(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white"
                  >
                    <option value={4}>4px (Nhỏ)</option>
                    <option value={6}>6px (Vừa)</option>
                    <option value={8}>8px (Lớn)</option>
                    <option value={11}>11px (To)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-1 shadow"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm điểm
                </button>
              </form>

              {/* Points Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Tên nhãn</th>
                      <th className="p-2.5">Màu</th>
                      <th className="p-2.5">Kích thước</th>
                      <th className="p-2.5">Tọa độ (X, Y)</th>
                      <th className="p-2.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {points.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40">
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={p.label}
                            onChange={(e) => onUpdatePoint(p.id, { label: e.target.value })}
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-white font-bold w-20"
                          />
                        </td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: p.color || '#dc2626' }} />
                            <select
                              value={p.color || '#dc2626'}
                              onChange={(e) => onUpdatePoint(p.id, { color: e.target.value })}
                              className="bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-slate-300 text-[11px]"
                            >
                              <option value="#dc2626">Đỏ</option>
                              <option value="#2563eb">Xanh dương</option>
                              <option value="#10b981">Xanh lá</option>
                              <option value="#ea580c">Cam</option>
                              <option value="#9333ea">Tím</option>
                              <option value="#f59e0b">Vàng</option>
                              <option value="#ffffff">Trắng</option>
                              <option value="#0f172a">Đen</option>
                            </select>
                          </div>
                        </td>
                        <td className="p-2.5">
                          <select
                            value={p.radius || 6}
                            onChange={(e) => onUpdatePoint(p.id, { radius: Number(e.target.value) })}
                            className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200"
                          >
                            <option value={4}>4px</option>
                            <option value={6}>6px</option>
                            <option value={8}>8px</option>
                            <option value={11}>11px</option>
                          </select>
                        </td>
                        <td className="p-2.5 text-slate-400 font-mono">
                          ({Math.round(p.x)}, {Math.round(p.y)})
                        </td>
                        <td className="p-2.5 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectObject(p.id, 'point');
                              onClose();
                            }}
                            className="px-2 py-1 rounded bg-indigo-950 hover:bg-indigo-900 text-indigo-300 font-medium"
                          >
                            Chọn
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeletePoint(p.id)}
                            className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300"
                            title="Xóa điểm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: LINES */}
          {activeTab === 'lines' && (
            <div className="space-y-4">
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Đoạn thẳng</th>
                      <th className="p-2.5">Ký hiệu / Độ dài</th>
                      <th className="p-2.5">Độ dày</th>
                      <th className="p-2.5">Kiểu nét</th>
                      <th className="p-2.5">Màu</th>
                      <th className="p-2.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {lines.map((l) => {
                      const p1 = points.find((p) => p.id === l.p1);
                      const p2 = points.find((p) => p.id === l.p2);
                      return (
                        <tr key={l.id} className="hover:bg-slate-800/40">
                          <td className="p-2.5 font-bold text-white">
                            {p1?.label || '?'}{p2?.label || '?'}
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={l.label || l.lengthValue || ''}
                              onChange={(e) => onUpdateLine(l.id, { label: e.target.value, lengthValue: e.target.value })}
                              placeholder="VD: a = 5cm"
                              className="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-white font-medium w-28"
                            />
                          </td>
                          <td className="p-2.5">
                            <select
                              value={l.width || 2.5}
                              onChange={(e) => onUpdateLine(l.id, { width: Number(e.target.value) })}
                              className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200"
                            >
                              <option value={1.5}>1.5px</option>
                              <option value={2.5}>2.5px</option>
                              <option value={4}>4px</option>
                              <option value={6}>6px</option>
                            </select>
                          </td>
                          <td className="p-2.5">
                            <button
                              type="button"
                              onClick={() => onUpdateLine(l.id, { dashed: !l.dashed })}
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                l.dashed ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {l.dashed ? '--- Nét đứt' : '── Nét liền'}
                            </button>
                          </td>
                          <td className="p-2.5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-3 h-1 rounded" style={{ backgroundColor: l.color || '#2563eb' }} />
                              <select
                                value={l.color || '#2563eb'}
                                onChange={(e) => onUpdateLine(l.id, { color: e.target.value })}
                                className="bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-slate-300 text-[11px]"
                              >
                                <option value="#2563eb">Xanh dương</option>
                                <option value="#dc2626">Đỏ</option>
                                <option value="#10b981">Xanh lá</option>
                                <option value="#ea580c">Cam</option>
                                <option value="#9333ea">Tím</option>
                                <option value="#0f172a">Đen</option>
                              </select>
                            </div>
                          </td>
                          <td className="p-2.5 text-right space-x-1">
                            <button
                              type="button"
                              onClick={() => {
                                onSelectObject(l.id, 'line');
                                onClose();
                              }}
                              className="px-2 py-1 rounded bg-indigo-950 hover:bg-indigo-900 text-indigo-300 font-medium"
                            >
                              Chọn
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteLine(l.id)}
                              className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300"
                              title="Xóa đoạn thẳng"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CIRCLES */}
          {activeTab === 'circles' && (
            <div className="space-y-4">
              {circles.length === 0 ? (
                <div className="text-center py-8 text-slate-400">Chưa có đường tròn nào trên bảng vẽ.</div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Tâm</th>
                        <th className="p-2.5">Bán kính</th>
                        <th className="p-2.5">Kiểu nét</th>
                        <th className="p-2.5 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {circles.map((c) => {
                        const center = points.find((p) => p.id === c.centerId);
                        return (
                          <tr key={c.id} className="hover:bg-slate-800/40">
                            <td className="p-2.5 font-bold text-white">Tâm ({center?.label || 'O'})</td>
                            <td className="p-2.5 text-slate-300">{c.radiusValue || 60}px</td>
                            <td className="p-2.5 text-slate-300">{c.dashed ? 'Nét đứt' : 'Nét liền'}</td>
                            <td className="p-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => onDeleteCircle(c.id)}
                                className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ANGLES */}
          {activeTab === 'angles' && (
            <div className="space-y-4">
              {angles.length === 0 ? (
                <div className="text-center py-8 text-slate-400">Chưa có ký hiệu góc nào trên bảng vẽ.</div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Đỉnh góc</th>
                        <th className="p-2.5">Loại góc</th>
                        <th className="p-2.5 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {angles.map((ang) => {
                        const vert = points.find((p) => p.id === ang.vertex);
                        return (
                          <tr key={ang.id} className="hover:bg-slate-800/40">
                            <td className="p-2.5 font-bold text-white">Đỉnh ({vert?.label || '?'})</td>
                            <td className="p-2.5 text-slate-300">{ang.isRightAngle ? 'Góc vuông 90°' : 'Góc cung tròn'}</td>
                            <td className="p-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => onDeleteAngle(ang.id)}
                                className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 p-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
          >
            Đóng bảng quản lý
          </button>
        </div>
      </div>
    </div>
  );
};
