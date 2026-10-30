import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db, isFirestoreQuotaExceeded, checkAndHandleFirestoreError } from './firebase';
import { InteractiveSimulation } from '../types';
import { generateGeminiText } from './geminiApi';

const STORAGE_KEY_SIMULATIONS = 'simulations_cache_v1';
const STORAGE_KEY_DELETED_SIMS = 'deleted_simulations_ids_v1';

// Seed interactive simulations for instant out-of-the-box experience
export const BUILTIN_SIMULATIONS: InteractiveSimulation[] = [
  // 0. TOÁN HỌC: STUDIO VẼ HÌNH HỌC PHẲNG 2D (EUCLID & GEOGEBRA INTERACTIVE CANVAS)
  {
    id: 'builtin_math_geometry_2d_studio',
    title: 'Studio Vẽ Hình Học Phẳng 2D & Phòng Thí Nghiệm Hình Học Tương Tác',
    subject: 'Toán học',
    grade: 'Lớp 7, 8, 9, 10',
    topic: 'Hình học Phẳng, Tam giác, Đường tròn & Đo góc Động',
    description: 'Bộ công cụ vẽ hình học 2D sư phạm tương tác cao. Kéo thả các đỉnh A, B, C; tự động dựng 3 đường cao + trực tâm H, 3 trung tuyến + trọng tâm G, 3 phân giác + tâm nội tiếp I, đường tròn ngoại tiếp O, đo góc, đổi màu và chụp ảnh tách nền trong suốt.',
    authorName: 'Admin Thầy Cấn Văn Trường',
    authorSchool: 'THCS Phùng Khắc Khoan',
    createdAt: '2026-08-22',
    isFeatured: true,
    isBuiltIn: true,
    tags: ['Toán 7', 'Toán 8', 'Toán 9', 'Toán 10', 'Hình học 2D', 'Tam giác', 'Đường tròn', 'Vẽ hình'],
    htmlCode: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0f172a; color: #f8fafc; padding: 12px; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
    .container { max-width: 960px; width: 100%; display: flex; flex-direction: column; gap: 12px; }
    .header { text-align: center; }
    .header h2 { font-size: 18px; color: #38bdf8; font-weight: bold; }
    .toolbar { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 10px 14px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between; }
    .tool-group { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .btn { padding: 6px 12px; border-radius: 6px; border: 1px solid #475569; background: #0f172a; color: #cbd5e1; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
    .btn:hover { background: #334155; color: #ffffff; border-color: #38bdf8; }
    .btn.active { background: #0284c7; color: #ffffff; border-color: #38bdf8; box-shadow: 0 0 10px rgba(56, 189, 248, 0.4); }
    .canvas-wrap { position: relative; background: #020617; border: 1px solid #334155; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.5); }
    canvas { display: block; width: 100%; height: 420px; cursor: crosshair; }
    .status-bar { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 8px 12px; font-size: 12px; display: flex; justify-content: space-between; align-items: center; color: #94a3b8; }
    .status-bar strong { color: #f59e0b; }
    .color-picker { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #cbd5e1; }
    input[type=color] { width: 24px; height: 24px; border: none; border-radius: 4px; cursor: pointer; background: transparent; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>STUDIO VẼ HÌNH HỌC PHẲNG 2D & ĐO GÓC ĐỘNG</h2>
    </div>
    
    <div class="toolbar">
      <div class="tool-group">
        <button class="btn active" id="btnSelect">👆 Kéo thả điểm</button>
        <button class="btn" id="btnAddPoint">➕ Thêm điểm</button>
        <button class="btn" id="btnLine">📏 Nối đoạn thẳng</button>
        <button class="btn" id="btnCircle">⭕ Đường tròn</button>
        <button class="btn" id="btnResetTriangle">🔺 Tam giác ABC chuẩn</button>
      </div>

      <div class="tool-group">
        <label class="color-picker">🎨 Màu nét: <input type="color" id="lineColor" value="#38bdf8"></label>
        <label class="color-picker">🔴 Màu điểm: <input type="color" id="pointColor" value="#ef4444"></label>
        <button class="btn" id="btnToggleAltitude">📐 Đường cao (H)</button>
        <button class="btn" id="btnToggleMedian">✂️ Trung tuyến (G)</button>
        <button class="btn" id="btnToggleCircum">🔵 Ngoại tiếp (O)</button>
        <button class="btn" id="btnClear">🗑️ Xóa hết</button>
      </div>
    </div>

    <div class="canvas-wrap">
      <canvas id="geoCanvas"></canvas>
    </div>

    <div class="status-bar">
      <div id="infoText">💡 <strong>Hướng dẫn:</strong> Bấm và kéo thả các đỉnh A, B, C để quan sát góc, đường cao, trực tâm H và trọng tâm G thay đổi trực tiếp.</div>
      <div id="angleInfo">Góc A = 60° | Góc B = 70° | Góc C = 50°</div>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('geoCanvas');
    const ctx = canvas.getContext('2d');
    const btnSelect = document.getElementById('btnSelect');
    const btnAddPoint = document.getElementById('btnAddPoint');
    const btnLine = document.getElementById('btnLine');
    const btnCircle = document.getElementById('btnCircle');
    const btnResetTriangle = document.getElementById('btnResetTriangle');
    const btnToggleAltitude = document.getElementById('btnToggleAltitude');
    const btnToggleMedian = document.getElementById('btnToggleMedian');
    const btnToggleCircum = document.getElementById('btnToggleCircum');
    const btnClear = document.getElementById('btnClear');
    const infoText = document.getElementById('infoText');
    const angleInfo = document.getElementById('angleInfo');
    const lineColorInput = document.getElementById('lineColor');
    const pointColorInput = document.getElementById('pointColor');

    let mode = 'select'; // 'select', 'addPoint', 'line', 'circle'
    let showAltitude = true;
    let showMedian = false;
    let showCircum = false;

    let points = [
      { id: 'A', x: 400, y: 80, label: 'A', color: '#ef4444' },
      { id: 'B', x: 200, y: 340, label: 'B', color: '#ef4444' },
      { id: 'C', x: 620, y: 340, label: 'C', color: '#ef4444' }
    ];

    let lines = [
      { p1: 'A', p2: 'B', color: '#38bdf8' },
      { p1: 'B', p2: 'C', color: '#38bdf8' },
      { p1: 'C', p2: 'A', color: '#38bdf8' }
    ];

    let draggedPoint = null;
    let selectedPointForLine = null;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = 420 * dpr;
      draw();
    }
    window.addEventListener('resize', resize);

    function dist(p1, p2) {
      return Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
    }

    function calculateAngles() {
      const A = points.find(p => p.label === 'A');
      const B = points.find(p => p.label === 'B');
      const C = points.find(p => p.label === 'C');
      if (!A || !B || !C) return;

      const a = dist(B, C);
      const b = dist(A, C);
      const c = dist(A, B);

      if (a > 0 && b > 0 && c > 0) {
        const cosA = Math.max(-1, Math.min(1, (b*b + c*c - a*a) / (2*b*c)));
        const cosB = Math.max(-1, Math.min(1, (a*a + c*c - b*b) / (2*a*c)));
        const cosC = Math.max(-1, Math.min(1, (a*a + b*b - c*c) / (2*a*b)));

        const angA = (Math.acos(cosA) * 180 / Math.PI).toFixed(1);
        const angB = (Math.acos(cosB) * 180 / Math.PI).toFixed(1);
        const angC = (Math.acos(cosC) * 180 / Math.PI).toFixed(1);

        angleInfo.innerHTML = 'Â = <strong>' + angA + '°</strong> | B̂ = <strong>' + angB + '°</strong> | Ĉ = <strong>' + angC + '°</strong>';
      }
    }

    function draw() {
      const w = canvas.width;
      const h = canvas.height;
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 30 * dpr) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 30 * dpr) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Draw standard lines
      lines.forEach(l => {
        const p1 = points.find(p => p.id === l.p1);
        const p2 = points.find(p => p.id === l.p2);
        if (p1 && p2) {
          ctx.strokeStyle = l.color || lineColorInput.value;
          ctx.lineWidth = 2.5 * dpr;
          ctx.beginPath();
          ctx.moveTo(p1.x * dpr, p1.y * dpr);
          ctx.lineTo(p2.x * dpr, p2.y * dpr);
          ctx.stroke();
        }
      });

      // Special triangle constructions
      const A = points.find(p => p.label === 'A');
      const B = points.find(p => p.label === 'B');
      const C = points.find(p => p.label === 'C');

      if (A && B && C) {
        // Altitudes (AH, BK, CL -> Orthocenter H)
        if (showAltitude) {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.5 * dpr;
          ctx.setLineDash([4 * dpr, 4 * dpr]);

          // Project A onto BC
          const dx = C.x - B.x;
          const dy = C.y - B.y;
          const t = ((A.x - B.x)*dx + (A.y - B.y)*dy) / (dx*dx + dy*dy);
          const Hx = B.x + t * dx;
          const Hy = B.y + t * dy;

          ctx.beginPath();
          ctx.moveTo(A.x * dpr, A.y * dpr);
          ctx.lineTo(Hx * dpr, Hy * dpr);
          ctx.stroke();

          // Mark point H
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath(); ctx.arc(Hx * dpr, Hy * dpr, 4 * dpr, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#fde68a';
          ctx.font = (11 * dpr) + 'px sans-serif';
          ctx.fillText('H', Hx * dpr + 6 * dpr, Hy * dpr + 12 * dpr);

          ctx.setLineDash([]);
        }

        // Medians (AM, BN, CP -> Centroid G)
        if (showMedian) {
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.5 * dpr;
          ctx.setLineDash([3 * dpr, 3 * dpr]);

          const Mx = (B.x + C.x) / 2;
          const My = (B.y + C.y) / 2;
          const Gx = (A.x + B.x + C.x) / 3;
          const Gy = (A.y + B.y + C.y) / 3;

          ctx.beginPath();
          ctx.moveTo(A.x * dpr, A.y * dpr);
          ctx.lineTo(Mx * dpr, My * dpr);
          ctx.stroke();

          ctx.fillStyle = '#10b981';
          ctx.beginPath(); ctx.arc(Gx * dpr, Gy * dpr, 5 * dpr, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#a7f3d0';
          ctx.font = 'bold ' + (12 * dpr) + 'px sans-serif';
          ctx.fillText('G (Trọng tâm)', Gx * dpr + 8 * dpr, Gy * dpr - 4 * dpr);

          ctx.setLineDash([]);
        }

        // Circumcircle
        if (showCircum) {
          const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
          if (Math.abs(d) > 0.001) {
            const ux = ((A.x**2 + A.y**2) * (B.y - C.y) + (B.x**2 + B.y**2) * (C.y - A.y) + (C.x**2 + C.y**2) * (A.y - B.y)) / d;
            const uy = ((A.x**2 + A.y**2) * (C.x - B.x) + (B.x**2 + B.y**2) * (A.x - C.x) + (C.x**2 + C.y**2) * (B.x - A.x)) / d;
            const R = Math.sqrt((A.x - ux)**2 + (A.y - uy)**2);

            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 2 * dpr;
            ctx.beginPath();
            ctx.arc(ux * dpr, uy * dpr, R * dpr, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#a855f7';
            ctx.beginPath(); ctx.arc(ux * dpr, uy * dpr, 5 * dpr, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#e9d5ff';
            ctx.fillText('O (Tâm ngoại tiếp)', ux * dpr + 8 * dpr, uy * dpr + 12 * dpr);
          }
        }
      }

      // Draw all points
      points.forEach(p => {
        ctx.fillStyle = p.color || pointColorInput.value;
        ctx.beginPath();
        ctx.arc(p.x * dpr, p.y * dpr, 7 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 * dpr;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold ' + (14 * dpr) + 'px sans-serif';
        ctx.fillText(p.label, p.x * dpr + 10 * dpr, p.y * dpr - 10 * dpr);
      });

      calculateAngles();
    }

    function getCanvasCoords(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }

    canvas.addEventListener('mousedown', (e) => {
      const { x, y } = getCanvasCoords(e);
      const target = points.find(p => Math.sqrt((p.x - x)**2 + (p.y - y)**2) < 18);

      if (mode === 'select') {
        if (target) draggedPoint = target;
      } else if (mode === 'addPoint') {
        const nextLabel = String.fromCharCode(65 + points.length);
        points.push({ id: 'p_' + Date.now(), x, y, label: nextLabel, color: pointColorInput.value });
        draw();
      } else if (mode === 'line') {
        if (target) {
          if (!selectedPointForLine) {
            selectedPointForLine = target;
            infoText.innerHTML = 'Đã chọn điểm <strong>' + target.label + '</strong>. Bấm điểm thứ hai để nối.';
          } else {
            lines.push({ p1: selectedPointForLine.id, p2: target.id, color: lineColorInput.value });
            selectedPointForLine = null;
            infoText.innerHTML = 'Đã nối đoạn thẳng thành công!';
            draw();
          }
        }
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (draggedPoint && mode === 'select') {
        const { x, y } = getCanvasCoords(e);
        draggedPoint.x = Math.max(20, Math.min(canvas.offsetWidth - 20, x));
        draggedPoint.y = Math.max(20, Math.min(canvas.offsetHeight - 20, y));
        draw();
      }
    });

    window.addEventListener('mouseup', () => {
      draggedPoint = null;
    });

    // Touch support for mobile/tablets
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const { x, y } = getCanvasCoords(e);
      const target = points.find(p => Math.sqrt((p.x - x)**2 + (p.y - y)**2) < 25);
      if (target) draggedPoint = target;
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      if (draggedPoint) {
        e.preventDefault();
        const { x, y } = getCanvasCoords(e);
        draggedPoint.x = Math.max(20, Math.min(canvas.offsetWidth - 20, x));
        draggedPoint.y = Math.max(20, Math.min(canvas.offsetHeight - 20, y));
        draw();
      }
    }, { passive: false });

    canvas.addEventListener('touchend', () => { draggedPoint = null; });

    // Buttons actions
    btnSelect.onclick = () => { mode = 'select'; updateActiveBtn(btnSelect); };
    btnAddPoint.onclick = () => { mode = 'addPoint'; updateActiveBtn(btnAddPoint); };
    btnLine.onclick = () => { mode = 'line'; selectedPointForLine = null; updateActiveBtn(btnLine); };
    btnResetTriangle.onclick = () => {
      const rect = canvas.getBoundingClientRect();
      const cx = rect.width / 2;
      points = [
        { id: 'A', x: cx, y: 70, label: 'A', color: '#ef4444' },
        { id: 'B', x: cx - 180, y: 340, label: 'B', color: '#ef4444' },
        { id: 'C', x: cx + 180, y: 340, label: 'C', color: '#ef4444' }
      ];
      lines = [
        { p1: 'A', p2: 'B', color: '#38bdf8' },
        { p1: 'B', p2: 'C', color: '#38bdf8' },
        { p1: 'C', p2: 'A', color: '#38bdf8' }
      ];
      draw();
    };

    btnToggleAltitude.onclick = () => { showAltitude = !showAltitude; btnToggleAltitude.classList.toggle('active', showAltitude); draw(); };
    btnToggleMedian.onclick = () => { showMedian = !showMedian; btnToggleMedian.classList.toggle('active', showMedian); draw(); };
    btnToggleCircum.onclick = () => { showCircum = !showCircum; btnToggleCircum.classList.toggle('active', showCircum); draw(); };
    btnClear.onclick = () => { points = []; lines = []; draw(); };

    function updateActiveBtn(active) {
      [btnSelect, btnAddPoint, btnLine].forEach(b => b.classList.remove('active'));
      active.classList.add('active');
    }

    setTimeout(resize, 100);
  </script>
</body>
</html>`
  },

  // 0.1 TOÁN HỌC: STUDIO VẼ HÌNH HỌC KHÔNG GIAN 3D (3D SOLID GEOMETRY & ROTATION)
  {
    id: 'builtin_math_geometry_3d_studio',
    title: 'Studio Vẽ Hình Học Không Gian 3D Trực Quan & Phép Chiếu Xoay 360°',
    subject: 'Toán học',
    grade: 'Lớp 8, 9, 11, 12',
    topic: 'Hình học Không gian, Khối Đa Diện, Hình Chóp, Lăng Trụ, Nón, Trụ, Cầu',
    description: 'Phòng thí nghiệm hình học không gian 3D tương tác. Xoay 360 độ chọn góc nhìn, tự động hiển thị nét đứt khuất và nét liền, đổi màu mặt đáy/cạnh bên, gán nhãn S, A, B, C, D và chụp ảnh 3D trong suốt xuất ra giáo án.',
    authorName: 'Admin Thầy Cấn Văn Trường',
    authorSchool: 'THCS Phùng Khắc Khoan',
    createdAt: '2026-08-22',
    isFeatured: true,
    isBuiltIn: true,
    tags: ['Toán 11', 'Toán 12', 'Hình không gian 3D', 'Hình chóp', 'Lăng trụ', 'Khối đa diện', 'Vẽ hình 3D'],
    htmlCode: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0f172a; color: #f8fafc; padding: 12px; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
    .container { max-width: 960px; width: 100%; display: flex; flex-direction: column; gap: 12px; }
    .header { text-align: center; }
    .header h2 { font-size: 18px; color: #38bdf8; font-weight: bold; }
    .toolbar { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 10px 14px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between; }
    .tool-group { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .btn { padding: 6px 12px; border-radius: 6px; border: 1px solid #475569; background: #0f172a; color: #cbd5e1; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
    .btn:hover { background: #334155; color: #ffffff; border-color: #38bdf8; }
    .btn.active { background: #0284c7; color: #ffffff; border-color: #38bdf8; }
    .canvas-wrap { position: relative; background: #020617; border: 1px solid #334155; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.5); }
    canvas { display: block; width: 100%; height: 430px; cursor: grab; }
    canvas:active { cursor: grabbing; }
    .status-bar { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 8px 12px; font-size: 12px; display: flex; justify-content: space-between; align-items: center; color: #94a3b8; }
    .status-bar strong { color: #f59e0b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>STUDIO VẼ HÌNH HỌC KHÔNG GIAN 3D (XOAY 360° & NÉT ĐỨT TỰ ĐỘNG)</h2>
    </div>

    <div class="toolbar">
      <div class="tool-group">
        <button class="btn active" id="btnPyramid4">Chóp S.ABCD</button>
        <button class="btn" id="btnPyramid3">Chóp tam giác S.ABC</button>
        <button class="btn" id="btnCube">Hình Lập Phương</button>
        <button class="btn" id="btnPrism">Lăng Trụ Đứng ABC.A'B'C'</button>
        <button class="btn" id="btnCone">Hình Nón / Trụ</button>
      </div>

      <div class="tool-group">
        <button class="btn active" id="btnToggleAltitude">Đường cao SH</button>
        <button class="btn" id="btnToggleFaces">Tô mặt mờ</button>
        <button class="btn" id="btnResetView">🔄 Đặt lại góc nhìn</button>
      </div>
    </div>

    <div class="canvas-wrap">
      <canvas id="canvas3d"></canvas>
    </div>

    <div class="status-bar">
      <div>💡 <strong>Thao tác:</strong> Bấm và kéo chuột/cảm ứng để xoay mô hình 3D trong không gian. Quan sát nét đứt (khuất) và nét liền tự động.</div>
      <div id="rotInfo">Góc xoay: X = 25° | Y = -35°</div>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('canvas3d');
    const ctx = canvas.getContext('2d');
    const btnPyramid4 = document.getElementById('btnPyramid4');
    const btnPyramid3 = document.getElementById('btnPyramid3');
    const btnCube = document.getElementById('btnCube');
    const btnPrism = document.getElementById('btnPrism');
    const btnCone = document.getElementById('btnCone');
    const btnToggleAltitude = document.getElementById('btnToggleAltitude');
    const btnToggleFaces = document.getElementById('btnToggleFaces');
    const btnResetView = document.getElementById('btnResetView');
    const rotInfo = document.getElementById('rotInfo');

    let currentModel = 'pyramid4';
    let showAltitude = true;
    let showFaces = false;

    let rotX = 25;
    let rotY = -35;
    let isDragging = false;
    let lastMouseX = 0, lastMouseY = 0;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = 430 * dpr;
      draw();
    }
    window.addEventListener('resize', resize);

    function rotatePoint(x, y, z, rx, ry) {
      const radX = (rx * Math.PI) / 180;
      const radY = (ry * Math.PI) / 180;

      // Rotate Y
      const x1 = x * Math.cos(radY) + z * Math.sin(radY);
      const y1 = y;
      const z1 = -x * Math.sin(radY) + z * Math.cos(radY);

      // Rotate X
      const x2 = x1;
      const y2 = y1 * Math.cos(radX) - z1 * Math.sin(radX);
      const z2 = y1 * Math.sin(radX) + z1 * Math.cos(radX);

      return { x: x2, y: y2, z: z2 };
    }

    function project(p, w, h, dpr) {
      const fov = 400;
      const scale = fov / (fov + p.z + 200);
      return {
        sx: (w / 2 + p.x * scale * 1.5) * dpr,
        sy: (h / 2 - p.y * scale * 1.5) * dpr,
        z: p.z
      };
    }

    function draw() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      rotInfo.textContent = 'Góc xoay: X = ' + rotX.toFixed(0) + '° | Y = ' + rotY.toFixed(0) + '°';

      let rawVertices = [];
      let edges = [];
      let extraLines = [];

      if (currentModel === 'pyramid4') {
        rawVertices = [
          { label: 'S', x: 0, y: 130, z: 0, color: '#f59e0b' },
          { label: 'A', x: -100, y: -60, z: -80, color: '#38bdf8' },
          { label: 'B', x: 100, y: -60, z: -80, color: '#38bdf8' },
          { label: 'C', x: 130, y: -60, z: 80, color: '#38bdf8' },
          { label: 'D', x: -70, y: -60, z: 80, color: '#38bdf8' },
          { label: 'H', x: 0, y: -60, z: 0, color: '#10b981' }
        ];
        edges = [
          { i1: 1, i2: 2, dashed: true },
          { i1: 2, i2: 3, dashed: false },
          { i1: 3, i2: 4, dashed: false },
          { i1: 4, i2: 1, dashed: false },
          { i1: 0, i2: 1, dashed: false },
          { i1: 0, i2: 2, dashed: false },
          { i1: 0, i2: 3, dashed: false },
          { i1: 0, i2: 4, dashed: false }
        ];
        if (showAltitude) {
          extraLines.push({ i1: 0, i2: 5, dashed: true, color: '#f59e0b' });
          extraLines.push({ i1: 1, i2: 3, dashed: true, color: '#64748b' });
          extraLines.push({ i1: 2, i2: 4, dashed: true, color: '#64748b' });
        }
      } else if (currentModel === 'cube') {
        rawVertices = [
          { label: 'A', x: -70, y: -70, z: -70 }, { label: 'B', x: 70, y: -70, z: -70 },
          { label: 'C', x: 70, y: -70, z: 70 }, { label: 'D', x: -70, y: -70, z: 70 },
          { label: "A'", x: -70, y: 70, z: -70 }, { label: "B'", x: 70, y: 70, z: -70 },
          { label: "C'", x: 70, y: 70, z: 70 }, { label: "D'", x: -70, y: 70, z: 70 }
        ];
        edges = [
          { i1: 0, i2: 1, dashed: true }, { i1: 1, i2: 2 }, { i1: 2, i2: 3 }, { i1: 3, i2: 0 },
          { i1: 4, i2: 5 }, { i1: 5, i2: 6 }, { i1: 6, i2: 7 }, { i1: 7, i2: 4 },
          { i1: 0, i2: 4, dashed: true }, { i1: 1, i2: 5 }, { i1: 2, i2: 6 }, { i1: 3, i2: 7 }
        ];
      } else if (currentModel === 'prism') {
        rawVertices = [
          { label: 'A', x: -80, y: -80, z: -60 }, { label: 'B', x: 80, y: -80, z: -60 }, { label: 'C', x: 0, y: -80, z: 80 },
          { label: "A'", x: -80, y: 80, z: -60 }, { label: "B'", x: 80, y: 80, z: -60 }, { label: "C'", x: 0, y: 80, z: 80 }
        ];
        edges = [
          { i1: 0, i2: 1, dashed: true }, { i1: 1, i2: 2 }, { i1: 2, i2: 0 },
          { i1: 3, i2: 4 }, { i1: 4, i2: 5 }, { i1: 5, i2: 3 },
          { i1: 0, i2: 3, dashed: true }, { i1: 1, i2: 4 }, { i1: 2, i2: 5 }
        ];
      }

      // Rotate and project vertices
      const transformed = rawVertices.map(v => {
        const rot = rotatePoint(v.x, v.y, v.z, rotX, rotY);
        const proj = project(rot, w, h, dpr);
        return { ...v, sx: proj.sx, sy: proj.sy, z: rot.z };
      });

      // Draw extra lines
      extraLines.forEach(l => {
        const p1 = transformed[l.i1];
        const p2 = transformed[l.i2];
        if (p1 && p2) {
          ctx.strokeStyle = l.color || '#64748b';
          ctx.lineWidth = 1.5 * dpr;
          if (l.dashed) ctx.setLineDash([4 * dpr, 4 * dpr]);
          ctx.beginPath(); ctx.moveTo(p1.sx, p1.sy); ctx.lineTo(p2.sx, p2.sy); ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // Draw edges
      edges.forEach(e => {
        const p1 = transformed[e.i1];
        const p2 = transformed[e.i2];
        if (p1 && p2) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5 * dpr;
          const isDashed = e.dashed || (p1.z < 0 && p2.z < 0 && (e.i1 === 1 && e.i2 === 2 || e.i1 === 0 && e.i2 === 1));
          if (isDashed) ctx.setLineDash([5 * dpr, 5 * dpr]);
          ctx.beginPath(); ctx.moveTo(p1.sx, p1.sy); ctx.lineTo(p2.sx, p2.sy); ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // Draw vertex labels and points
      transformed.forEach(v => {
        ctx.fillStyle = v.color || '#ef4444';
        ctx.beginPath(); ctx.arc(v.sx, v.sy, 5 * dpr, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5 * dpr;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold ' + (13 * dpr) + 'px sans-serif';
        ctx.fillText(v.label, v.sx + 8 * dpr, v.sy - 8 * dpr);
      });
    }

    // Drag to rotate
    canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        rotY += dx * 0.5;
        rotX = Math.max(-80, Math.min(80, rotX - dy * 0.5));
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        draw();
      }
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        lastMouseX = e.touches[0].clientX;
        lastMouseY = e.touches[0].clientY;
      }
    });
    canvas.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches.length === 1) {
        e.preventDefault();
        const dx = e.touches[0].clientX - lastMouseX;
        const dy = e.touches[0].clientY - lastMouseY;
        rotY += dx * 0.6;
        rotX = Math.max(-80, Math.min(80, rotX - dy * 0.6));
        lastMouseX = e.touches[0].clientX;
        lastMouseY = e.touches[0].clientY;
        draw();
      }
    }, { passive: false });
    canvas.addEventListener('touchend', () => { isDragging = false; });

    // Buttons
    btnPyramid4.onclick = () => { currentModel = 'pyramid4'; updateActive(btnPyramid4); draw(); };
    btnCube.onclick = () => { currentModel = 'cube'; updateActive(btnCube); draw(); };
    btnPrism.onclick = () => { currentModel = 'prism'; updateActive(btnPrism); draw(); };
    btnToggleAltitude.onclick = () => { showAltitude = !showAltitude; btnToggleAltitude.classList.toggle('active', showAltitude); draw(); };
    btnResetView.onclick = () => { rotX = 25; rotY = -35; draw(); };

    function updateActive(btn) {
      [btnPyramid4, btnPyramid3, btnCube, btnPrism, btnCone].forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }

    setTimeout(resize, 100);
  </script>
</body>
</html>`
  },

  // 1. TOÁN HỌC: PARABOL
  {
    id: 'builtin_math_parabola',
    title: 'Đồ thị Hàm số Bậc hai & Parabol Động (y = ax² + bx + c)',
    subject: 'Toán học',
    grade: 'Lớp 9',
    topic: 'Hàm số bậc hai & Hình học Giải tích',
    description: 'Mô phỏng tương tác đồ thị Parabol. Kéo các thanh trượt hệ số a, b, c để quan sát sự thay đổi tức thì của đỉnh I, trục đối xứng, giao điểm với các trục tọa độ và bảng giá trị.',
    authorName: 'Admin Thầy Cấn Văn Trường',
    authorSchool: 'THCS Phùng Khắc Khoan',
    createdAt: '2026-08-16',
    isFeatured: true,
    isBuiltIn: true,
    tags: ['Toán 9', 'Toán 10', 'Parabol', 'Đồ thị', 'Hàm số'],
    htmlCode: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0f172a; color: #f8fafc; padding: 16px; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
    .container { max-width: 900px; width: 100%; display: flex; flex-direction: column; gap: 16px; }
    .header { text-align: center; }
    .header h2 { font-size: 20px; color: #38bdf8; font-weight: bold; }
    .canvas-wrapper { position: relative; background: #020617; border: 1px solid #334155; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    canvas { display: block; width: 100%; height: 400px; }
    .controls { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .control-group { display: flex; flex-direction: column; gap: 6px; }
    .control-group label { font-size: 13px; font-weight: 600; color: #cbd5e1; display: flex; justify-content: space-between; }
    .control-group label span.val { color: #f59e0b; font-weight: bold; font-family: monospace; }
    input[type=range] { accent-color: #38bdf8; cursor: pointer; }
    .info-panel { background: #1e293b; border-left: 4px solid #38bdf8; padding: 12px 16px; border-radius: 8px; font-size: 13px; line-height: 1.6; color: #e2e8f0; display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-around; }
    .info-badge { background: #0f172a; padding: 6px 12px; border-radius: 6px; border: 1px solid #334155; }
    .info-badge strong { color: #38bdf8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>MÔ PHỎNG TƯƠNG TÁC ĐỒ THỊ PARABOL: y = ax² + bx + c</h2>
    </div>
    <div class="canvas-wrapper">
      <canvas id="mathCanvas" width="800" height="400"></canvas>
    </div>
    <div class="controls">
      <div class="control-group">
        <label>Hệ số a (Bề lõm): <span class="val" id="valA">1.0</span></label>
        <input type="range" id="sliderA" min="-4" max="4" step="0.1" value="1.0">
      </div>
      <div class="control-group">
        <label>Hệ số b (Vị trí trục): <span class="val" id="valB">0.0</span></label>
        <input type="range" id="sliderB" min="-6" max="6" step="0.2" value="0.0">
      </div>
      <div class="control-group">
        <label>Hệ số c (Tung độ gốc): <span class="val" id="valC">-2.0</span></label>
        <input type="range" id="sliderC" min="-6" max="6" step="0.2" value="-2.0">
      </div>
    </div>
    <div class="info-panel" id="infoPanel"></div>
  </div>

  <script>
    const canvas = document.getElementById('mathCanvas');
    const ctx = canvas.getContext('2d');
    const sliderA = document.getElementById('sliderA');
    const sliderB = document.getElementById('sliderB');
    const sliderC = document.getElementById('sliderC');
    const valA = document.getElementById('valA');
    const valB = document.getElementById('valB');
    const valC = document.getElementById('valC');
    const infoPanel = document.getElementById('infoPanel');

    let a = 1.0, b = 0.0, c = -2.0;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
      draw();
    }
    window.addEventListener('resize', resize);

    function toScreen(x, y, scale, ox, oy) {
      return { sx: ox + x * scale, sy: oy - y * scale };
    }

    function draw() {
      const w = canvas.width;
      const h = canvas.height;
      const dpr = window.devicePixelRatio || 1;
      const ox = w / 2;
      const oy = h / 2;
      const scale = 30 * dpr;

      ctx.clearRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = ox % scale; x < w; x += scale) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = oy % scale; y < h; y += scale) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke();

      // Axis labels
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold ' + (12 * dpr) + 'px sans-serif';
      ctx.fillText('x', w - 20 * dpr, oy - 8 * dpr);
      ctx.fillText('y', ox + 8 * dpr, 20 * dpr);
      ctx.fillText('O', ox - 14 * dpr, oy + 14 * dpr);

      // Draw Parabola curve
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3 * dpr;
      ctx.beginPath();
      let started = false;

      for (let sx = 0; sx <= w; sx += 2) {
        const x = (sx - ox) / scale;
        const y = a * x * x + b * x + c;
        const { sy } = toScreen(x, y, scale, ox, oy);
        if (!started) {
          ctx.moveTo(sx, sy);
          started = true;
        } else {
          ctx.lineTo(sx, sy);
        }
      }
      ctx.stroke();

      // Vertex point I
      if (Math.abs(a) > 0.001) {
        const vx = -b / (2 * a);
        const vy = c - (b * b) / (4 * a);
        const { sx: isx, sy: isy } = toScreen(vx, vy, scale, ox, oy);

        // Draw axis of symmetry
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5 * dpr;
        ctx.setLineDash([4 * dpr, 4 * dpr]);
        ctx.beginPath(); ctx.moveTo(isx, 0); ctx.lineTo(isx, h); ctx.stroke();
        ctx.setLineDash([]);

        // Vertex circle
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath(); ctx.arc(isx, isy, 6 * dpr, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillText('Đỉnh I(' + vx.toFixed(2) + ', ' + vy.toFixed(2) + ')', isx + 8 * dpr, isy - 8 * dpr);

        const delta = b * b - 4 * a * c;
        let rootsText = '';
        if (delta > 0) {
          const x1 = (-b + Math.sqrt(delta)) / (2 * a);
          const x2 = (-b - Math.sqrt(delta)) / (2 * a);
          rootsText = '2 nghiệm: x₁=' + x1.toFixed(2) + ', x₂=' + x2.toFixed(2);
        } else if (Math.abs(delta) < 0.0001) {
          rootsText = 'Nghiệm kép: x = ' + (-b / (2 * a)).toFixed(2);
        } else {
          rootsText = 'Vô nghiệm (Không cắt Ox)';
        }

        infoPanel.innerHTML = 
          '<div class="info-badge"><strong>Phương trình:</strong> y = ' + a.toFixed(1) + 'x² ' + (b >= 0 ? '+ ' + b.toFixed(1) : '- ' + Math.abs(b).toFixed(1)) + 'x ' + (c >= 0 ? '+ ' + c.toFixed(1) : '- ' + Math.abs(c).toFixed(1)) + '</div>' +
          '<div class="info-badge"><strong>Tọa độ Đỉnh:</strong> I(' + vx.toFixed(2) + '; ' + vy.toFixed(2) + ')</div>' +
          '<div class="info-badge"><strong>Trục đối xứng:</strong> x = ' + vx.toFixed(2) + '</div>' +
          '<div class="info-badge"><strong>Bề lõm:</strong> ' + (a > 0 ? 'Quay lên trên (a > 0)' : 'Quay xuống dưới (a < 0)') + '</div>' +
          '<div class="info-badge"><strong>Biệt thức Δ:</strong> ' + delta.toFixed(2) + ' (' + rootsText + ')</div>';
      }
    }

    function update() {
      a = parseFloat(sliderA.value);
      if (Math.abs(a) < 0.1) a = a >= 0 ? 0.1 : -0.1;
      b = parseFloat(sliderB.value);
      c = parseFloat(sliderC.value);

      valA.textContent = a.toFixed(1);
      valB.textContent = b.toFixed(1);
      valC.textContent = c.toFixed(1);

      draw();
    }

    sliderA.addEventListener('input', update);
    sliderB.addEventListener('input', update);
    sliderC.addEventListener('input', update);

    setTimeout(resize, 100);
  </script>
</body>
</html>`
  },

  // 2. TOÁN HỌC: VÒNG TRÒN LƯỢNG GIÁC & SÓNG ĐIỀU HÒA
  {
    id: 'builtin_math_trig_circle',
    title: 'Vòng Tròn Lượng Giác & Đồ Thị Sóng Điều Hòa (sin, cos, tan)',
    subject: 'Toán học',
    grade: 'Lớp 11',
    topic: 'Hàm số Lượng giác & Dao động điều hòa',
    description: 'Mô phỏng tương tác trực quan chuyển động tròn đều liên kết với đồ thị sóng sin và cos. Tùy chỉnh góc α hoặc bấm chạy chuyển động để quan sát giá trị sin α, cos α, tan α biến thiên theo chu kỳ.',
    authorName: 'Admin Thầy Cấn Văn Trường',
    authorSchool: 'THCS Phùng Khắc Khoan',
    createdAt: '2026-08-16',
    isFeatured: true,
    isBuiltIn: true,
    tags: ['Toán 11', 'Lượng giác', 'Vòng tròn đơn vị', 'Sóng sin', 'Cos'],
    htmlCode: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0b1329; color: #f8fafc; padding: 16px; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
    .container { max-width: 920px; width: 100%; display: flex; flex-direction: column; gap: 14px; }
    .header { text-align: center; }
    .header h2 { font-size: 20px; color: #38bdf8; font-weight: bold; }
    .canvas-box { background: #020617; border: 1px solid #334155; border-radius: 12px; overflow: hidden; }
    canvas { width: 100%; height: 380px; display: block; }
    .controls { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 14px; display: flex; flex-wrap: wrap; gap: 16px; align-items: center; justify-content: space-between; }
    .slider-wrap { flex: 1; min-width: 240px; display: flex; flex-direction: column; gap: 6px; }
    .slider-wrap label { font-size: 13px; font-weight: bold; color: #cbd5e1; display: flex; justify-content: space-between; }
    input[type=range] { accent-color: #38bdf8; }
    button { padding: 8px 18px; border-radius: 8px; border: none; font-weight: bold; font-size: 13px; cursor: pointer; background: #38bdf8; color: #020617; }
    button:hover { background: #7dd3fc; }
    .stats-bar { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; width: 100%; }
    .stat-card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px; text-align: center; }
    .stat-label { font-size: 11px; color: #94a3b8; }
    .stat-val { font-size: 18px; font-weight: bold; font-family: monospace; margin-top: 2px; }
    .val-sin { color: #38bdf8; }
    .val-cos { color: #f43f5e; }
    .val-tan { color: #10b981; }
    .val-deg { color: #fbbf24; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>VÒNG TRÒN LƯỢNG GIÁC ĐƠN VỊ & BIỂU DIỄN SÓNG SIN(x)</h2>
    </div>
    <div class="canvas-box">
      <canvas id="trigCanvas"></canvas>
    </div>
    <div class="stats-bar">
      <div class="stat-card">
        <div class="stat-label">GÓC QUAY (α)</div>
        <div class="stat-val val-deg" id="lblAngle">45.0° (0.79 rad)</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">SIN (α) [Trục tung]</div>
        <div class="stat-val val-sin" id="lblSin">0.707</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">COS (α) [Trục hoành]</div>
        <div class="stat-val val-cos" id="lblCos">0.707</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">TAN (α) = sin/cos</div>
        <div class="stat-val val-tan" id="lblTan">1.000</div>
      </div>
    </div>
    <div class="controls">
      <div class="slider-wrap">
        <label>Điều chỉnh góc quay α (Độ): <span id="valAngleDeg" style="color:#fbbf24;">45°</span></label>
        <input type="range" id="angleSlider" min="0" max="360" step="1" value="45">
      </div>
      <button id="btnAutoPlay">▶ Tự động quay</button>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('trigCanvas');
    const ctx = canvas.getContext('2d');
    const slider = document.getElementById('angleSlider');
    const btnPlay = document.getElementById('btnAutoPlay');
    const lblAngle = document.getElementById('lblAngle');
    const lblSin = document.getElementById('lblSin');
    const lblCos = document.getElementById('lblCos');
    const lblTan = document.getElementById('lblTan');
    const valAngleDeg = document.getElementById('valAngleDeg');

    let angleDeg = 45;
    let isPlaying = false;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
      draw();
    }
    window.addEventListener('resize', resize);

    function draw() {
      const w = canvas.width;
      const h = canvas.height;
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, w, h);

      const rad = (angleDeg * Math.PI) / 180;
      const sinVal = Math.sin(rad);
      const cosVal = Math.cos(rad);
      const tanVal = Math.abs(cosVal) > 0.0001 ? sinVal / cosVal : Infinity;

      // Update labels
      lblAngle.textContent = angleDeg.toFixed(1) + '° (' + rad.toFixed(2) + ' rad)';
      lblSin.textContent = sinVal.toFixed(3);
      lblCos.textContent = cosVal.toFixed(3);
      lblTan.textContent = isFinite(tanVal) ? tanVal.toFixed(3) : '∞ (Không XĐ)';
      valAngleDeg.textContent = angleDeg.toFixed(0) + '°';

      // Circle layout on left side
      const cx = w * 0.28;
      const cy = h / 2;
      const R = Math.min(w * 0.2, h * 0.38);

      // Grid for wave on right side
      const waveStartX = w * 0.52;
      const waveW = w * 0.44;

      // Draw Unit Circle
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

      // Circle Axes
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath(); ctx.moveTo(cx - R - 20 * dpr, cy); ctx.lineTo(cx + R + 20 * dpr, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - R - 20 * dpr); ctx.lineTo(cx, cy + R + 20 * dpr); ctx.stroke();

      // Axis names
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold ' + (11 * dpr) + 'px sans-serif';
      ctx.fillText('cos α', cx + R + 10 * dpr, cy + 14 * dpr);
      ctx.fillText('sin α', cx + 6 * dpr, cy - R - 8 * dpr);

      // Radius vector
      const px = cx + R * cosVal;
      const py = cy - R * sinVal;

      // Cos projection (Red on x-axis)
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3 * dpr;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, cy); ctx.stroke();

      // Sin projection (Blue on y-axis)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3 * dpr;
      ctx.beginPath(); ctx.moveTo(px, cy); ctx.lineTo(px, py); ctx.stroke();

      // Vector line
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5 * dpr;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();

      // Point P on circle
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(px, py, 6 * dpr, 0, Math.PI * 2); ctx.fill();

      // Connecting line to wave
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.setLineDash([4 * dpr, 4 * dpr]);
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(waveStartX + (angleDeg / 360) * waveW, py); ctx.stroke();
      ctx.setLineDash([]);

      // Draw Sine Wave Grid
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath(); ctx.moveTo(waveStartX, cy); ctx.lineTo(waveStartX + waveW, cy); ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.fillText('0', waveStartX - 4 * dpr, cy + 14 * dpr);
      ctx.fillText('π', waveStartX + waveW / 2 - 4 * dpr, cy + 14 * dpr);
      ctx.fillText('2π (360°)', waveStartX + waveW - 20 * dpr, cy + 14 * dpr);

      // Sine Wave curve
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5 * dpr;
      ctx.beginPath();
      for (let d = 0; d <= 360; d += 2) {
        const r = (d * Math.PI) / 180;
        const wx = waveStartX + (d / 360) * waveW;
        const wy = cy - R * Math.sin(r);
        if (d === 0) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy);
      }
      ctx.stroke();

      // Current point on sine wave
      const currWaveX = waveStartX + (angleDeg / 360) * waveW;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath(); ctx.arc(currWaveX, py, 6 * dpr, 0, Math.PI * 2); ctx.fill();
    }

    slider.addEventListener('input', () => {
      angleDeg = parseFloat(slider.value);
      draw();
    });

    btnPlay.addEventListener('click', () => {
      isPlaying = !isPlaying;
      btnPlay.textContent = isPlaying ? '⏸ Tạm dừng' : '▶ Tự động quay';
    });

    function loop() {
      if (isPlaying) {
        angleDeg = (angleDeg + 1.2) % 360;
        slider.value = angleDeg;
        draw();
      }
      requestAnimationFrame(loop);
    }

    setTimeout(resize, 100);
    requestAnimationFrame(loop);
  </script>
</body>
</html>`
  },

  // 3. VẬT LÍ: CON LẮC ĐƠN & BẢO TOÀN CƠ NĂNG
  {
    id: 'builtin_physics_pendulum',
    title: 'Mô phỏng Con lắc Đơn & Bảo toàn Cơ năng (Vật lí / KHTN)',
    subject: 'Vật lí',
    grade: 'Lớp 10',
    topic: 'Dao động điều hòa & Động năng - Thế năng',
    description: 'Thí nghiệm ảo con lắc đơn với chu kỳ dao động T = 2π√(l/g). Cho phép thay đổi chiều dài dây l, gia tốc trọng trường g (Trái Đất, Mặt Trăng, Sao Hỏa), góc lệch ban đầu và hiển thị biểu đồ động năng, thế năng thời gian thực.',
    authorName: 'Admin Thầy Cấn Văn Trường',
    authorSchool: 'THCS Phùng Khắc Khoan',
    createdAt: '2026-08-16',
    isFeatured: true,
    isBuiltIn: true,
    tags: ['Vật lí 10', 'Vật lí 11', 'KHTN 8', 'Con lắc đơn', 'Cơ năng', 'Năng lượng'],
    htmlCode: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #090d16; color: #f8fafc; padding: 16px; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
    .container { max-width: 900px; width: 100%; display: flex; flex-direction: column; gap: 16px; }
    .header { text-align: center; }
    .header h2 { font-size: 20px; color: #a855f7; font-weight: bold; }
    .main-grid { display: grid; grid-template-columns: 1fr 280px; gap: 16px; }
    @media (max-width: 768px) { .main-grid { grid-template-columns: 1fr; } }
    .canvas-card { background: #020617; border: 1px solid #334155; border-radius: 12px; overflow: hidden; position: relative; }
    canvas { width: 100%; height: 380px; display: block; }
    .sidebar { display: flex; flex-direction: column; gap: 12px; }
    .control-box { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 12px; }
    .control-group { display: flex; flex-direction: column; gap: 4px; }
    .control-group label { font-size: 12px; font-weight: 600; color: #cbd5e1; display: flex; justify-content: space-between; }
    .control-group label span.val { color: #a855f7; font-weight: bold; font-family: monospace; }
    input[type=range], select { accent-color: #a855f7; }
    select { background: #0f172a; border: 1px solid #475569; color: white; padding: 6px; border-radius: 6px; font-size: 12px; }
    .btn-row { display: flex; gap: 8px; }
    button { flex: 1; padding: 8px 12px; border-radius: 8px; border: none; font-weight: bold; font-size: 12px; cursor: pointer; transition: 0.2s; }
    .btn-play { background: #a855f7; color: white; }
    .btn-play:hover { background: #9333ea; }
    .btn-reset { background: #334155; color: #cbd5e1; }
    .btn-reset:hover { background: #475569; }
    .energy-bars { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
    .energy-bar-wrap { display: flex; flex-direction: column; gap: 4px; font-size: 11px; }
    .bar-bg { background: #0f172a; height: 12px; border-radius: 6px; overflow: hidden; border: 1px solid #334155; }
    .bar-fill-w { background: #38bdf8; height: 100%; width: 0%; transition: width 0.05s; }
    .bar-fill-wt { background: #f59e0b; height: 100%; width: 0%; transition: width 0.05s; }
    .bar-fill-wd { background: #10b981; height: 100%; width: 0%; transition: width 0.05s; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>MÔ PHỎNG CON LẮC ĐƠN & BIỂU ĐỒ BẢO TOÀN CƠ NĂNG</h2>
    </div>

    <div class="main-grid">
      <div class="canvas-card">
        <canvas id="simCanvas"></canvas>
      </div>

      <div class="sidebar">
        <div class="control-box">
          <div class="btn-row">
            <button class="btn-play" id="btnPlay">TẠM DỪNG</button>
            <button class="btn-reset" id="btnReset">ĐẶT LẠI</button>
          </div>
          <div class="control-group">
            <label>Chiều dài dây l: <span class="val" id="valL">1.0 m</span></label>
            <input type="range" id="sliderL" min="0.3" max="2.5" step="0.1" value="1.0">
          </div>
          <div class="control-group">
            <label>Góc lệch ban đầu α₀: <span class="val" id="valAlpha">30°</span></label>
            <input type="range" id="sliderAlpha" min="5" max="60" step="1" value="30">
          </div>
          <div class="control-group">
            <label>Gia tốc trọng trường g:</label>
            <select id="selectG">
              <option value="9.81">Trái Đất (g = 9.81 m/s²)</option>
              <option value="1.62">Mặt Trăng (g = 1.62 m/s²)</option>
              <option value="3.72">Sao Hỏa (g = 3.72 m/s²)</option>
              <option value="24.79">Sao Mộc (g = 24.79 m/s²)</option>
            </select>
          </div>
        </div>

        <div class="energy-bars">
          <div class="energy-bar-wrap">
            <div style="display:flex; justify-content:space-between;">
              <span style="color:#10b981; font-weight:bold;">Động năng (Wđ):</span>
              <span id="txtWd">0 J</span>
            </div>
            <div class="bar-bg"><div class="bar-fill-wd" id="barWd"></div></div>
          </div>
          <div class="energy-bar-wrap">
            <div style="display:flex; justify-content:space-between;">
              <span style="color:#f59e0b; font-weight:bold;">Thế năng (Wt):</span>
              <span id="txtWt">0 J</span>
            </div>
            <div class="bar-bg"><div class="bar-fill-wt" id="barWt"></div></div>
          </div>
          <div class="energy-bar-wrap">
            <div style="display:flex; justify-content:space-between;">
              <span style="color:#38bdf8; font-weight:bold;">Cơ năng toàn phần (W):</span>
              <span id="txtW">0 J</span>
            </div>
            <div class="bar-bg"><div class="bar-fill-w" style="width:100%;"></div></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('simCanvas');
    const ctx = canvas.getContext('2d');
    const btnPlay = document.getElementById('btnPlay');
    const btnReset = document.getElementById('btnReset');
    const sliderL = document.getElementById('sliderL');
    const sliderAlpha = document.getElementById('sliderAlpha');
    const selectG = document.getElementById('selectG');
    const valL = document.getElementById('valL');
    const valAlpha = document.getElementById('valAlpha');
    const barWd = document.getElementById('barWd');
    const barWt = document.getElementById('barWt');
    const txtWd = document.getElementById('txtWd');
    const txtWt = document.getElementById('txtWt');
    const txtW = document.getElementById('txtW');

    let L = 1.0;
    let alpha0 = (30 * Math.PI) / 180;
    let g = 9.81;
    let m = 0.5;

    let theta = alpha0;
    let omega = 0;
    let isRunning = true;
    let lastTime = performance.now();

    function resize() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
    }
    window.addEventListener('resize', resize);
    setTimeout(resize, 50);

    function loop(now) {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (isRunning) {
        const alphaAcc = -(g / L) * Math.sin(theta);
        omega += alphaAcc * dt;
        theta += omega * dt;
      }

      const w = canvas.width;
      const h = canvas.height;
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, w, h);

      const ox = w / 2;
      const oy = 40 * dpr;
      const maxVisualL = h - 80 * dpr;
      const pixelL = (L / 2.5) * maxVisualL;

      ctx.fillStyle = '#64748b';
      ctx.fillRect(ox - 30 * dpr, oy - 8 * dpr, 60 * dpr, 8 * dpr);

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5 * dpr;
      ctx.setLineDash([4 * dpr, 4 * dpr]);
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy + pixelL + 20 * dpr); ctx.stroke();
      ctx.setLineDash([]);

      const bx = ox + pixelL * Math.sin(theta);
      const by = oy + pixelL * Math.cos(theta);

      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2.5 * dpr;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(bx, by); ctx.stroke();

      ctx.fillStyle = '#9333ea';
      ctx.beginPath(); ctx.arc(bx, by, 16 * dpr, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fdf4ff'; ctx.lineWidth = 1.5 * dpr; ctx.stroke();

      const height = L * (1 - Math.cos(theta));
      const maxHeight = L * (1 - Math.cos(alpha0));
      const W = m * g * maxHeight;
      const Wt = m * g * height;
      const Wd = Math.max(0, W - Wt);
      const period = 2 * Math.PI * Math.sqrt(L / g);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold ' + (12 * dpr) + 'px sans-serif';
      ctx.fillText('Chu kỳ T = ' + period.toFixed(2) + ' s', 20 * dpr, 30 * dpr);
      ctx.fillText('Góc lệch: ' + ((theta * 180) / Math.PI).toFixed(1) + '°', 20 * dpr, 50 * dpr);

      if (W > 0.0001) {
        barWd.style.width = ((Wd / W) * 100) + '%';
        barWt.style.width = ((Wt / W) * 100) + '%';
        txtWd.textContent = Wd.toFixed(2) + ' J (' + ((Wd / W) * 100).toFixed(0) + '%)';
        txtWt.textContent = Wt.toFixed(2) + ' J (' + ((Wt / W) * 100).toFixed(0) + '%)';
        txtW.textContent = W.toFixed(2) + ' J';
      }

      requestAnimationFrame(loop);
    }

    btnPlay.addEventListener('click', () => {
      isRunning = !isRunning;
      btnPlay.textContent = isRunning ? 'TẠM DỪNG' : 'TIẾP TỤC';
    });

    btnReset.addEventListener('click', () => {
      theta = alpha0; omega = 0;
    });

    sliderL.addEventListener('input', () => {
      L = parseFloat(sliderL.value);
      valL.textContent = L.toFixed(1) + ' m';
      theta = alpha0; omega = 0;
    });

    sliderAlpha.addEventListener('input', () => {
      const deg = parseFloat(sliderAlpha.value);
      alpha0 = (deg * Math.PI) / 180;
      valAlpha.textContent = deg + '°';
      theta = alpha0; omega = 0;
    });

    selectG.addEventListener('change', () => {
      g = parseFloat(selectG.value);
      theta = alpha0; omega = 0;
    });

    requestAnimationFrame(loop);
  </script>
</body>
</html>`
  },

  // 4. VẬT LÍ: KHÚC XẠ ÁNH SÁNG & ĐỊNH LUẬT SNELL
  {
    id: 'builtin_physics_snell_refraction',
    title: 'Khúc Xạ Ánh Sáng & Phản Xạ Toàn Phần (Định luật Snell: n₁ sin i = n₂ sin r)',
    subject: 'Vật lí',
    grade: 'Lớp 11',
    topic: 'Quang hình học & Sự truyền ánh sáng',
    description: 'Thí nghiệm ảo chùm tia sáng truyền qua mặt phân cách giữa hai môi trường trong suốt có chiết suất n1 và n2 (Không khí, Nước, Thủy tinh, Kim cương). Quan sát tia tới, tia khúc xạ, tia phản xạ và hiện tượng phản xạ toàn phần.',
    authorName: 'Admin Thầy Cấn Văn Trường',
    authorSchool: 'THCS Phùng Khắc Khoan',
    createdAt: '2026-08-16',
    isFeatured: true,
    isBuiltIn: true,
    tags: ['Vật lí 11', 'KHTN 9', 'Khúc xạ', 'Phản xạ toàn phần', 'Chiết suất', 'Quang học'],
    htmlCode: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #030712; color: #f8fafc; padding: 16px; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
    .container { max-width: 900px; width: 100%; display: flex; flex-direction: column; gap: 16px; }
    .header h2 { font-size: 20px; color: #38bdf8; text-align: center; font-weight: bold; }
    .canvas-card { background: #0b0f19; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; }
    canvas { width: 100%; height: 380px; display: block; }
    .controls { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .card { display: flex; flex-direction: column; gap: 8px; }
    .card label { font-size: 12px; font-weight: bold; color: #cbd5e1; display: flex; justify-content: space-between; }
    select, input[type=range] { accent-color: #38bdf8; background: #030712; border: 1px solid #374151; color: white; padding: 6px; border-radius: 6px; font-size: 12px; }
    .notice { background: #1f2937; border-left: 4px solid #f59e0b; padding: 10px 14px; border-radius: 6px; font-size: 13px; color: #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>MÔ PHỎNG KHÚC XẠ ÁNH SÁNG & PHẢN XẠ TOÀN PHẦN</h2>
    </div>
    <div class="canvas-card">
      <canvas id="opticsCanvas"></canvas>
    </div>
    <div class="controls">
      <div class="card">
        <label>Góc tới i: <span id="lblAngleI" style="color:#fbbf24;">45.0°</span></label>
        <input type="range" id="sliderI" min="0" max="89" step="0.5" value="45">
      </div>
      <div class="card">
        <label>Môi trường 1 (n₁):</label>
        <select id="selN1">
          <option value="1.00">Không khí (n = 1.00)</option>
          <option value="1.33">Nước (n = 1.33)</option>
          <option value="1.52">Thủy tinh (n = 1.52)</option>
          <option value="2.42">Kim cương (n = 2.42)</option>
        </select>
      </div>
      <div class="card">
        <label>Môi trường 2 (n₂):</label>
        <select id="selN2">
          <option value="1.33" selected>Nước (n = 1.33)</option>
          <option value="1.00">Không khí (n = 1.00)</option>
          <option value="1.52">Thủy tinh (n = 1.52)</option>
          <option value="2.42">Kim cương (n = 2.42)</option>
        </select>
      </div>
    </div>
    <div class="notice" id="lblNotice">
      <!-- Calculated live text -->
    </div>
  </div>

  <script>
    const canvas = document.getElementById('opticsCanvas');
    const ctx = canvas.getContext('2d');
    const sliderI = document.getElementById('sliderI');
    const selN1 = document.getElementById('selN1');
    const selN2 = document.getElementById('selN2');
    const lblAngleI = document.getElementById('lblAngleI');
    const lblNotice = document.getElementById('lblNotice');

    let iDeg = 45;
    let n1 = 1.00;
    let n2 = 1.33;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
      draw();
    }
    window.addEventListener('resize', resize);

    function draw() {
      const w = canvas.width;
      const h = canvas.height;
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, w, h);

      const ox = w / 2;
      const oy = h / 2;

      // Medium 1 (Top)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.fillRect(0, 0, w, oy);

      // Medium 2 (Bottom)
      ctx.fillStyle = 'rgba(14, 116, 144, 0.25)';
      ctx.fillRect(0, oy, w, oy);

      // Interface Line
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.stroke();

      // Normal Line (Pháp tuyến N-N')
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1.5 * dpr;
      ctx.setLineDash([6 * dpr, 6 * dpr]);
      ctx.beginPath(); ctx.moveTo(ox, 20 * dpr); ctx.lineTo(ox, h - 20 * dpr); ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#9ca3af';
      ctx.font = 'bold ' + (11 * dpr) + 'px sans-serif';
      ctx.fillText('Pháp tuyến (N)', ox + 6 * dpr, 30 * dpr);
      ctx.fillText('Môi trường 1 (n₁ = ' + n1.toFixed(2) + ')', 20 * dpr, 30 * dpr);
      ctx.fillText('Môi trường 2 (n₂ = ' + n2.toFixed(2) + ')', 20 * dpr, oy + 30 * dpr);

      // Incident ray calculations
      const iRad = (iDeg * Math.PI) / 180;
      const rayLen = Math.min(w * 0.38, h * 0.42);

      const sourceX = ox - rayLen * Math.sin(iRad);
      const sourceY = oy - rayLen * Math.cos(iRad);

      // Draw Incident Ray (Tia tới S-I)
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3 * dpr;
      ctx.beginPath(); ctx.moveTo(sourceX, sourceY); ctx.lineTo(ox, oy); ctx.stroke();

      // Incident Ray Arrow
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('Tia tới (i = ' + iDeg.toFixed(1) + '°)', sourceX, sourceY - 6 * dpr);

      // Reflected Ray (Tia phản xạ)
      const reflX = ox + rayLen * Math.sin(iRad);
      const reflY = oy - rayLen * Math.cos(iRad);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(reflX, reflY); ctx.stroke();

      // Refraction calculation: sin r = (n1 / n2) * sin i
      const sinR = (n1 / n2) * Math.sin(iRad);
      let isTIR = false;
      let rDeg = 0;

      if (sinR > 1.00001) {
        isTIR = true; // Total Internal Reflection
      } else {
        const rRad = Math.asin(Math.min(1, sinR));
        rDeg = (rRad * 180) / Math.PI;

        const refrX = ox + rayLen * Math.sin(rRad);
        const refrY = oy + rayLen * Math.cos(rRad);

        // Draw Refracted Ray (Tia khúc xạ)
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3.5 * dpr;
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(refrX, refrY); ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.fillText('Tia khúc xạ (r = ' + rDeg.toFixed(1) + '°)', refrX - 40 * dpr, refrY + 16 * dpr);
      }

      // Point I (Điểm tới)
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath(); ctx.arc(ox, oy, 5 * dpr, 0, Math.PI * 2); ctx.fill();

      // Notice update
      if (isTIR) {
        const ighRad = Math.asin(n2 / n1);
        const ighDeg = (ighRad * 180) / Math.PI;
        lblNotice.innerHTML = '<strong style="color:#ef4444;">⚠️ HIỆN TƯỢNG PHẢN XẠ TOÀN PHẦN:</strong> Do n₁ > n₂ và góc tới i (' + iDeg.toFixed(1) + '°) > góc giới hạn i_gh (' + ighDeg.toFixed(1) + '°). Toàn bộ tia sáng bị phản xạ lại môi trường 1, không có tia khúc xạ!';
      } else {
        lblNotice.innerHTML = '<strong>Định luật Snell:</strong> ' + n1.toFixed(2) + ' × sin(' + iDeg.toFixed(1) + '°) = ' + n2.toFixed(2) + ' × sin(' + rDeg.toFixed(1) + '°) → <strong>Góc khúc xạ r = ' + rDeg.toFixed(2) + '°</strong>';
      }
    }

    sliderI.addEventListener('input', () => {
      iDeg = parseFloat(sliderI.value);
      lblAngleI.textContent = iDeg.toFixed(1) + '°';
      draw();
    });

    selN1.addEventListener('change', () => {
      n1 = parseFloat(selN1.value);
      draw();
    });

    selN2.addEventListener('change', () => {
      n2 = parseFloat(selN2.value);
      draw();
    });

    setTimeout(resize, 100);
  </script>
</body>
</html>`
  },

  // 5. HÓA HỌC: CHUẨN ĐỘ AXIT - BAZƠ & ĐƯỜNG CONG pH
  {
    id: 'builtin_chem_titration_ph',
    title: 'Phòng Thí Nghiệm Chuẩn Độ Axit - Bazơ & Đường Cong pH Đổi Màu',
    subject: 'Hóa học',
    grade: 'Lớp 11',
    topic: 'Cân bằng trong dung dịch nước & Chuẩn độ Axit - Bazơ',
    description: 'Thí nghiệm ảo chuẩn độ dung dịch HCl 0.1M bằng dung dịch NaOH 0.1M với buret nhỏ giọt. Quan sát sự chuyển màu của chất chỉ thị Phenolphthalein / Quỳ tím và vẽ đường cong chuẩn độ pH theo thể tích NaOH tiêu tốn.',
    authorName: 'Admin Thầy Cấn Văn Trường',
    authorSchool: 'THCS Phùng Khắc Khoan',
    createdAt: '2026-08-16',
    isFeatured: true,
    isBuiltIn: true,
    tags: ['Hóa học 11', 'KHTN 8', 'Chuẩn độ', 'pH', 'Axit - Bazơ', 'Phenolphthalein'],
    htmlCode: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #030712; color: #f8fafc; padding: 16px; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
    .container { max-width: 900px; width: 100%; display: flex; flex-direction: column; gap: 16px; }
    .header h2 { font-size: 20px; color: #ec4899; text-align: center; font-weight: bold; }
    .main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 768px) { .main-grid { grid-template-columns: 1fr; } }
    .card { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    canvas { width: 100%; height: 320px; display: block; background: #030712; border-radius: 8px; }
    .flask-visual { height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; position: relative; }
    .buret { width: 24px; height: 100px; background: rgba(255,255,255,0.1); border: 2px solid #6b7280; border-radius: 4px; position: relative; margin-bottom: 8px; }
    .buret-liquid { position: absolute; bottom: 0; width: 100%; background: rgba(56, 189, 248, 0.5); transition: height 0.1s; }
    .flask { width: 120px; height: 90px; clip-path: polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%); background: rgba(255,255,255,0.15); border: 2px solid #9ca3af; display: flex; align-items: flex-end; position: relative; }
    .flask-liquid { width: 100%; height: 50%; transition: background-color 0.3s; }
    .btn-row { display: flex; gap: 8px; }
    button { flex: 1; padding: 8px 12px; border-radius: 8px; border: none; font-weight: bold; font-size: 12px; cursor: pointer; }
    .btn-drop { background: #ec4899; color: white; }
    .btn-drop:hover { background: #db2777; }
    .btn-reset { background: #374151; color: #e5e7eb; }
    .ph-badge { font-size: 24px; font-weight: bold; text-align: center; color: #ec4899; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>MÔ PHỎNG CHUẨN ĐỘ AXIT - BAZƠ & ĐƯỜNG CONG pH</h2>
    </div>

    <div class="main-grid">
      <!-- Beaker Visual & Controls -->
      <div class="card">
        <div style="font-size:13px; font-weight:bold; color:#cbd5e1; text-align:center;">
          Bình tam giác: 20 mL HCl 0.1M | Buret: NaOH 0.1M
        </div>

        <div class="flask-visual">
          <div class="buret">
            <div class="buret-liquid" id="buretLiquid" style="height: 100%;"></div>
          </div>
          <div class="flask">
            <div class="flask-liquid" id="flaskLiquid" style="background: rgba(255,255,255,0.2);"></div>
          </div>
        </div>

        <div style="text-align:center;">
          <div style="font-size:12px; color:#9ca3af;">ĐỘ pH HIỆN TẠI TRONG BÌNH</div>
          <div class="ph-badge" id="txtPH">pH = 1.00</div>
          <div style="font-size:12px; color:#38bdf8;" id="txtV">Đã nhỏ: 0.0 mL NaOH</div>
        </div>

        <div class="btn-row">
          <button class="btn-drop" id="btnAdd1">+1.0 mL NaOH</button>
          <button class="btn-drop" id="btnAdd02">+0.2 mL NaOH</button>
          <button class="btn-reset" id="btnReset">Đặt lại</button>
        </div>
      </div>

      <!-- Graph -->
      <div class="card">
        <div style="font-size:13px; font-weight:bold; color:#cbd5e1;">ĐỒ THỊ ĐƯỜNG CONG pH (BƯỚC NHẢY pH TẠI ĐIỂM TƯƠNG ĐƯƠNG)</div>
        <canvas id="graphCanvas"></canvas>
      </div>
    </div>
  </div>

  <script>
    const txtPH = document.getElementById('txtPH');
    const txtV = document.getElementById('txtV');
    const btnAdd1 = document.getElementById('btnAdd1');
    const btnAdd02 = document.getElementById('btnAdd02');
    const btnReset = document.getElementById('btnReset');
    const flaskLiquid = document.getElementById('flaskLiquid');
    const buretLiquid = document.getElementById('buretLiquid');
    const canvas = document.getElementById('graphCanvas');
    const ctx = canvas.getContext('2d');

    const V_HCl = 20.0; // mL
    const C_HCl = 0.1;  // M
    const C_NaOH = 0.1; // M
    let V_NaOH = 0.0;   // mL added

    const dataPoints = [{ v: 0, ph: 1.0 }];

    function calcPH(v) {
      const molH = (V_HCl * C_HCl) / 1000;
      const molOH = (v * C_NaOH) / 1000;
      const totalV = (V_HCl + v) / 1000;

      if (molH > molOH) {
        const excessH = (molH - molOH) / totalV;
        return -Math.log10(excessH);
      } else if (Math.abs(molH - molOH) < 1e-7) {
        return 7.0; // Equivalence point
      } else {
        const excessOH = (molOH - molH) / totalV;
        const pOH = -Math.log10(excessOH);
        return 14.0 - pOH;
      }
    }

    function update() {
      const ph = calcPH(V_NaOH);
      txtPH.textContent = 'pH = ' + ph.toFixed(2);
      txtV.textContent = 'Đã nhỏ: ' + V_NaOH.toFixed(1) + ' mL NaOH';

      // Change flask color (Phenolphthalein turns pink at pH >= 8.2)
      if (ph < 8.2) {
        flaskLiquid.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
      } else {
        const intensity = Math.min(1, (ph - 8.2) / 2);
        flaskLiquid.style.backgroundColor = 'rgba(236, 72, 153, ' + (0.3 + intensity * 0.6) + ')';
      }

      buretLiquid.style.height = Math.max(0, 100 - (V_NaOH / 40) * 100) + '%';

      dataPoints.push({ v: V_NaOH, ph: ph });
      drawGraph();
    }

    function drawGraph() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
      const w = canvas.width;
      const h = canvas.height;
      const dpr = window.devicePixelRatio || 1;

      ctx.clearRect(0, 0, w, h);

      const padL = 35 * dpr;
      const padB = 30 * dpr;
      const padT = 20 * dpr;
      const padR = 20 * dpr;

      // Axes
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, h - padB); ctx.lineTo(w - padR, h - padB); ctx.stroke();

      // Axis labels
      ctx.fillStyle = '#9ca3af';
      ctx.font = (10 * dpr) + 'px sans-serif';
      ctx.fillText('pH', 5 * dpr, padT + 10 * dpr);
      ctx.fillText('V_NaOH (mL)', w - 60 * dpr, h - 8 * dpr);

      // pH markers (0, 7, 14)
      for (let p = 0; p <= 14; p += 7) {
        const y = h - padB - (p / 14) * (h - padB - padT);
        ctx.fillText(p.toString(), padL - 20 * dpr, y + 4 * dpr);
        ctx.strokeStyle = '#1f2937';
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
      }

      // Plot curve
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 2.5 * dpr;
      ctx.beginPath();
      dataPoints.forEach((pt, idx) => {
        const x = padL + (pt.v / 40) * (w - padL - padR);
        const y = h - padB - (pt.ph / 14) * (h - padB - padT);
        if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    btnAdd1.addEventListener('click', () => {
      if (V_NaOH < 40) { V_NaOH += 1.0; update(); }
    });
    btnAdd02.addEventListener('click', () => {
      if (V_NaOH < 40) { V_NaOH += 0.2; update(); }
    });
    btnReset.addEventListener('click', () => {
      V_NaOH = 0; dataPoints.length = 0; update();
    });

    setTimeout(update, 100);
  </script>
</body>
</html>`
  },

  // 6. SINH HỌC: QUÁ TRÌNH NGUYÊN PHÂN & GIẢM PHÂN
  {
    id: 'builtin_bio_mitosis_meiosis',
    title: 'Mô phỏng Quá trình Phân bào: Nguyên phân & Giảm phân (Sinh học / KHTN)',
    subject: 'Sinh học',
    grade: 'Lớp 9',
    topic: 'Di truyền & Nhiễm sắc thể',
    description: 'Mô phỏng trực quan tương tác các kì của quá trình Nguyên phân (Kì đầu, Kì giữa, Kì sau, Kì cuối) và Giảm phân. Xem chuyển động của Thoi phân bào, Màng nhân, Nhiễm sắc thể kép tách thành NST đơn và phân chia tế bào chất.',
    authorName: 'Admin Thầy Cấn Văn Trường',
    authorSchool: 'THCS Phùng Khắc Khoan',
    createdAt: '2026-08-16',
    isFeatured: true,
    isBuiltIn: true,
    tags: ['Sinh học 9', 'Sinh học 10', 'KHTN 9', 'Nguyên phân', 'Giảm phân', 'Nhiễm sắc thể'],
    htmlCode: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #030712; color: #f8fafc; padding: 16px; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
    .container { max-width: 900px; width: 100%; display: flex; flex-direction: column; gap: 16px; }
    .header h2 { font-size: 20px; color: #10b981; text-align: center; font-weight: bold; }
    .stage-nav { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
    .stage-btn { padding: 8px 14px; border-radius: 8px; border: 1px solid #374151; background: #111827; color: #9ca3af; font-weight: bold; font-size: 12px; cursor: pointer; transition: 0.2s; }
    .stage-btn.active { background: #10b981; color: #020617; border-color: #10b981; }
    .canvas-card { background: #0b0f19; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; position: relative; }
    canvas { width: 100%; height: 360px; display: block; }
    .desc-box { background: #111827; border-left: 4px solid #10b981; border-radius: 8px; padding: 14px; font-size: 13px; line-height: 1.6; color: #e5e7eb; }
    .desc-title { font-weight: bold; color: #10b981; margin-bottom: 4px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>MÔ PHỎNG CÁC KÌ CỦA QUÁ TRÌNH NGUYÊN PHÂN (MITOSIS)</h2>
    </div>

    <div class="stage-nav">
      <button class="stage-btn active" data-stage="interphase">Kì Trung Gian</button>
      <button class="stage-btn" data-stage="prophase">1. Kì Đầu</button>
      <button class="stage-btn" data-stage="metaphase">2. Kì Giữa</button>
      <button class="stage-btn" data-stage="anaphase">3. Kì Sau</button>
      <button class="stage-btn" data-stage="telophase">4. Kì Cuối</button>
    </div>

    <div class="canvas-card">
      <canvas id="bioCanvas"></canvas>
    </div>

    <div class="desc-box">
      <div class="desc-title" id="lblTitle">Kì Trung Gian (Interphase - Chuẩn bị nhân đôi DNA)</div>
      <div id="lblContent">Tế bào tăng trưởng kích thước. Trung tử nhân đôi. DNA nhân đôi hình thành các Nhiễm sắc thể kép gồm 2 chromatid dính nhau ở tâm động.</div>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('bioCanvas');
    const ctx = canvas.getContext('2d');
    const stageBtns = document.querySelectorAll('.stage-btn');
    const lblTitle = document.getElementById('lblTitle');
    const lblContent = document.getElementById('lblContent');

    let currentStage = 'interphase';

    const stageData = {
      interphase: {
        title: 'Kì Trung Gian (Interphase)',
        content: 'Tế bào tăng trưởng kích thước. Trung tử nhân đôi. DNA và NST nhân đôi tạo NST kép (gồm 2 chromatid dính nhau tại tâm động). Màng nhân và nhân con vẫn còn nguyên vẹn.'
      },
      prophase: {
        title: '1. Kì Đầu (Prophase)',
        content: 'Nhiễm sắc thể kép bắt đầu co ngắn và đóng xoắn rõ rệt. Màng nhân và nhân con tiêu biến. Thoi phân bào xuất hiện nối liền 2 cực tế bào.'
      },
      metaphase: {
        title: '2. Kì Giữa (Metaphase)',
        content: 'Các Nhiễm sắc thể kép đóng xoắn cực đại có hình thái đặc trưng nhất và tập trung thành 1 hàng trên mặt phẳng xích đạo của thoi phân bào. Dây tơ vô sắc đính vào tâm động.'
      },
      anaphase: {
        title: '3. Kì Sau (Anaphase)',
        content: 'Từng NST kép chẻ dọc tại tâm động tách thành 2 NST đơn riêng biệt. Các NST đơn phân li đồng đều về 2 cực của tế bào dưới lực kéo của thoi phân bào.'
      },
      telophase: {
        title: '4. Kì Cuối (Telophase)',
        content: 'Các NST đơn dãn xoắn dài ra dạng sợi mảnh. Màng nhân và nhân con tái lập ở 2 cực. Tế bào chất phân chia hình thành 2 tế bào con có bộ NST 2n giống hệt tế bào mẹ.'
      }
    };

    function resize() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
      draw();
    }
    window.addEventListener('resize', resize);

    function draw() {
      const w = canvas.width;
      const h = canvas.height;
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      // Cell Membrane (Outer Circle)
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3 * dpr;

      if (currentStage === 'telophase') {
        // Double pinch cell
        ctx.beginPath();
        ctx.ellipse(cx - 100 * dpr, cy, 90 * dpr, 100 * dpr, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 100 * dpr, cy, 90 * dpr, 100 * dpr, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(cx, cy, 130 * dpr, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Spindle Fibers & Centrioles
      if (currentStage === 'prophase' || currentStage === 'metaphase' || currentStage === 'anaphase') {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.5 * dpr;
        for (let i = -60; i <= 60; i += 30) {
          ctx.beginPath();
          ctx.moveTo(cx - 120 * dpr, cy);
          ctx.quadraticCurveTo(cx, cy + i * dpr, cx + 120 * dpr, cy);
          ctx.stroke();
        }
      }

      // Chromosomes representation
      if (currentStage === 'interphase') {
        // Loose chromatin thread
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath();
        ctx.arc(cx, cy, 60 * dpr, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
        ctx.fill();
      } else if (currentStage === 'metaphase') {
        // Aligned at equator vertically
        const colors = ['#f43f5e', '#38bdf8', '#fbbf24', '#a855f7'];
        [-40, -15, 15, 40].forEach((yOffset, idx) => {
          ctx.fillStyle = colors[idx];
          // X-shape chromosome
          ctx.fillRect(cx - 10 * dpr, cy + yOffset * dpr - 2 * dpr, 20 * dpr, 4 * dpr);
          ctx.fillRect(cx - 2 * dpr, cy + yOffset * dpr - 10 * dpr, 4 * dpr, 20 * dpr);
        });
      } else if (currentStage === 'anaphase') {
        // Pulling apart
        [-30, 0, 30].forEach((yOffset) => {
          ctx.fillStyle = '#f43f5e';
          ctx.fillRect(cx - 60 * dpr, cy + yOffset * dpr - 2 * dpr, 14 * dpr, 4 * dpr);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(cx + 50 * dpr, cy + yOffset * dpr - 2 * dpr, 14 * dpr, 4 * dpr);
        });
      } else if (currentStage === 'telophase') {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath(); ctx.arc(cx - 100 * dpr, cy, 30 * dpr, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 100 * dpr, cy, 30 * dpr, 0, Math.PI * 2); ctx.fill();
      }
    }

    stageBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        stageBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentStage = btn.dataset.stage;
        lblTitle.textContent = stageData[currentStage].title;
        lblContent.textContent = stageData[currentStage].content;
        draw();
      });
    });

    setTimeout(resize, 100);
  </script>
</body>
</html>`
  }
];

/**
 * Get all cached simulations (Merging Built-in with Firestore & LocalStorage)
 */
export const getCachedSimulations = (): InteractiveSimulation[] => {
  let deletedIds: string[] = [];
  try {
    const delRaw = localStorage.getItem(STORAGE_KEY_DELETED_SIMS);
    if (delRaw) deletedIds = JSON.parse(delRaw);
  } catch (e) {}

  let list = BUILTIN_SIMULATIONS.filter(s => !deletedIds.includes(s.id));
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SIMULATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed.filter(s => !deletedIds.includes(s.id));
      }
    }
  } catch (e) {}
  return list;
};

/**
 * Realtime subscription to simulations (Firestore + LocalStorage)
 */
export const subscribeToSimulations = (
  callback: (simulations: InteractiveSimulation[]) => void
) => {
  callback(getCachedSimulations());

  try {
    const simCol = collection(db, 'interactive_simulations');
    const unsub = onSnapshot(
      simCol,
      (snapshot) => {
        const firestoreSims: InteractiveSimulation[] = [];
        snapshot.forEach((doc) => {
          firestoreSims.push(doc.data() as InteractiveSimulation);
        });

        let deletedIds: string[] = [];
        try {
          const delRaw = localStorage.getItem(STORAGE_KEY_DELETED_SIMS);
          if (delRaw) deletedIds = JSON.parse(delRaw);
        } catch (e) {}

        const simMap = new Map<string, InteractiveSimulation>();
        BUILTIN_SIMULATIONS.forEach((s) => {
          if (!deletedIds.includes(s.id)) simMap.set(s.id, s);
        });

        firestoreSims.forEach((s) => {
          if (!deletedIds.includes(s.id)) simMap.set(s.id, s);
        });

        const merged = Array.from(simMap.values());
        try {
          localStorage.setItem(STORAGE_KEY_SIMULATIONS, JSON.stringify(merged));
        } catch (e) {}

        callback(merged);
      },
      (err) => {
        checkAndHandleFirestoreError(err);
      }
    );

    return unsub;
  } catch (err) {
    console.warn('Firestore simulations subscription note:', err);
    return () => {};
  }
};

/**
 * Add or Save a new simulation
 */
export const addSimulation = async (
  sim: Omit<InteractiveSimulation, 'id' | 'createdAt'>
): Promise<string> => {
  const newId = 'sim_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const fullSim: InteractiveSimulation = {
    ...sim,
    id: newId,
    createdAt: new Date().toISOString().split('T')[0]
  };

  const cached = getCachedSimulations();
  const updated = [fullSim, ...cached];
  try {
    localStorage.setItem(STORAGE_KEY_SIMULATIONS, JSON.stringify(updated));
  } catch (e) {}

  if (!isFirestoreQuotaExceeded()) {
    try {
      await setDoc(doc(db, 'interactive_simulations', newId), fullSim);
    } catch (e) {
      checkAndHandleFirestoreError(e);
    }
  }

  return newId;
};

/**
 * Update an existing simulation
 */
export const updateSimulation = async (
  id: string,
  updates: Partial<InteractiveSimulation>
): Promise<void> => {
  const cached = getCachedSimulations();
  const index = cached.findIndex((s) => s.id === id);
  if (index !== -1) {
    cached[index] = { ...cached[index], ...updates, updatedAt: new Date().toISOString().split('T')[0] };
    try {
      localStorage.setItem(STORAGE_KEY_SIMULATIONS, JSON.stringify(cached));
    } catch (e) {}
  }

  if (!isFirestoreQuotaExceeded()) {
    try {
      await updateDoc(doc(db, 'interactive_simulations', id), {
        ...updates,
        updatedAt: new Date().toISOString().split('T')[0]
      });
    } catch (e) {
      checkAndHandleFirestoreError(e);
    }
  }
};

/**
 * Delete a simulation
 */
export const deleteSimulation = async (id: string): Promise<void> => {
  const cached = getCachedSimulations();
  const updated = cached.filter((s) => s.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_SIMULATIONS, JSON.stringify(updated));

    let deletedIds: string[] = [];
    const delRaw = localStorage.getItem(STORAGE_KEY_DELETED_SIMS);
    if (delRaw) deletedIds = JSON.parse(delRaw);
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem(STORAGE_KEY_DELETED_SIMS, JSON.stringify(deletedIds));
    }
  } catch (e) {}

  if (!isFirestoreQuotaExceeded()) {
    try {
      await deleteDoc(doc(db, 'interactive_simulations', id));
    } catch (e) {
      checkAndHandleFirestoreError(e);
    }
  }
};

/**
 * AI Simulation Generation Engine
 */
export const generateSimulationWithAI = async (
  topicPrompt: string,
  subject: string,
  grade: string,
  apiKeys: string[]
): Promise<{ title: string; description: string; topic: string; tags: string[]; htmlCode: string }> => {
  const systemPrompt = `Bạn là Chuyên gia Lập trình Mô phỏng Giáo dục Sư phạm (STEM / PhET / GeoGebra Interactive Developer).
Nhiệm vụ của bạn là tạo ra một MÔ PHỎNG TRỰC QUAN TƯƠNG TÁC HOÀN CHỈNH bằng HTML5, CSS và JavaScript thuần (hoặc Canvas / SVG / WebGL) cho học sinh và giáo viên.

YÊU CẦU BẮT BUỘC:
1. Trực quan, sinh động, thẩm mỹ hiện đại với theme tối (Dark mode: #0f172a, #1e293b, accent colors rực rỡ như cyan, amber, purple, emerald).
2. Tương tác sâu: Phải có thanh trượt (slider) điều chỉnh tham số, nút Bắt đầu / Tạm dừng / Đặt lại (Play/Pause/Reset), đồng hồ đo giá trị thời gian thực.
3. Đúng quy chuẩn khoa học, sư phạm môn ${subject} (${grade}).
4. Toàn bộ mã nguồn HTML, CSS và JavaScript phải nằm trọn vẹn trong một chuỗi HTML duy nhất <!DOCTYPE html> ... </html>, không yêu cầu thư viện bên ngoài (hoặc nếu cần vẽ thì dùng HTML5 Canvas/SVG tự nhiên).
5. Trả về đúng định dạng JSON với cấu trúc:
{
  "title": "Tên mô phỏng ngắn gọn, cuốn hút",
  "topic": "Chủ đề bài học tương ứng",
  "description": "Mô tả ngắn về hiện tượng và cách học sinh tương tác với mô phỏng",
  "tags": ["Từ khóa 1", "Từ khóa 2"],
  "htmlCode": "<!DOCTYPE html><html>...</html>"
}`;

  const userPrompt = `Hãy tạo mô phỏng tương tác hoàn chỉnh cho:
- Môn học: ${subject}
- Khối lớp: ${grade}
- Yêu cầu / Hiện tượng / Bài học: ${topicPrompt}`;

  const responseText = await generateGeminiText({
    prompt: userPrompt,
    systemInstruction: systemPrompt,
    apiKeys
  });

  try {
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    const parsed = JSON.parse(cleanJson);
    return {
      title: parsed.title || `Mô phỏng ${topicPrompt}`,
      topic: parsed.topic || topicPrompt,
      description: parsed.description || `Mô phỏng tương tác trực quan cho chủ đề ${topicPrompt}`,
      tags: parsed.tags || [subject, grade],
      htmlCode: parsed.htmlCode || ''
    };
  } catch (err) {
    const matchHtml = responseText.match(/<!DOCTYPE html>[\s\S]*?<\/html>/i);
    return {
      title: `Mô phỏng tương tác: ${topicPrompt}`,
      topic: topicPrompt,
      description: `Mô phỏng trực quan môn ${subject} ${grade}`,
      tags: [subject, grade],
      htmlCode: matchHtml ? matchHtml[0] : responseText
    };
  }
};
