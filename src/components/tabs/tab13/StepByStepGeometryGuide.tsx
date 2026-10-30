import React, { useState, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Compass,
  PenTool,
  Sparkles,
  BookOpen,
  Volume2,
  Award,
  Layers,
  Maximize2,
  Plus,
  Trash2,
  ArrowRight,
  X,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { generateGeminiText } from '../../../lib/geminiApi';

export interface DrawingStep {
  stepNumber: number;
  title: string;
  instruction: string;
  pedagogicalTip: string; // Mẹo sư phạm giúp học sinh tránh sai lầm
  toolNeeded: string; // Thước thẳng, Compa, Thước đo độ, Ê-ke
  visualState: {
    points: Array<{ id: string; x: number; y: number; label: string; color?: string }>;
    lines: Array<{ p1: string; p2: string; dashed?: boolean; color?: string; label?: string }>;
    arcs?: Array<{ cx: number; cy: number; r: number; startAngle: number; endAngle: number; dashed?: boolean; color?: string }>;
    angles?: Array<{ p1: string; vertex: string; p2: string; label?: string; isRight?: boolean }>;
    annotations?: Array<{ text: string; x: number; y: number; color?: string }>;
  };
}

export interface DrawingTutorial {
  id: string;
  title: string;
  grade: string;
  category: 'plane_2d' | 'solid_3d' | 'elementary';
  difficulty: 'Dễ' | 'Trung bình' | 'Nâng cao';
  summary: string;
  commonMistakes: string[]; // Các lỗi học sinh hay mắc phải
  steps: DrawingStep[];
  isCustom?: boolean;
}

export const STORAGE_CUSTOM_TUTORIALS = 'AI_LESSON_CUSTOM_GEOMETRY_TUTORIALS_V2';

export const GEOMETRY_TUTORIALS: DrawingTutorial[] = [
  // 1. Vẽ tam giác biết độ dài 3 cạnh bằng thước và compa (Lớp 6, 7)
  {
    id: 'draw_triangle_3_sides',
    title: '1. Vẽ Tam Giác ABC khi biết 3 cạnh (bằng Thước và Compa)',
    grade: 'Lớp 6, 7',
    category: 'plane_2d',
    difficulty: 'Dễ',
    summary: 'Phương pháp chuẩn mực dựng tam giác ABC với BC = 6cm, AB = 4cm, AC = 5cm bằng compa.',
    commonMistakes: [
      'Dùng thước áng chừng độ dài thay vì dùng compa quay cung tròn dẫn đến sai số lớn.',
      'Quên ghi tên các đỉnh A, B, C và số đo độ dài các cạnh.',
      'Tẩy xóa làm rách giấy khi quay compa lệch tâm.'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Bước 1: Vẽ đoạn thẳng cạnh đáy BC',
        instruction: 'Dùng thước thẳng có chia vạch đo và vẽ đoạn thẳng BC = 6 cm nằm ngang trên trang vở. Đánh dấu rõ 2 đầu mút B và C.',
        pedagogicalTip: '💡 Mẹo: Nên chọn cạnh có độ dài lớn nhất làm đáy nằm ngang để hình vẽ cân đối và dễ quan sát.',
        toolNeeded: 'Thước thẳng chia vạch',
        visualState: {
          points: [
            { id: 'B', x: 120, y: 280, label: 'B (0cm)' },
            { id: 'C', x: 420, y: 280, label: 'C (6cm)' }
          ],
          lines: [
            { p1: 'B', p2: 'C', color: '#3b82f6', label: 'BC = 6cm' }
          ],
          annotations: [
            { text: '📏 Đoạn thẳng BC = 6 cm', x: 230, y: 310, color: '#38bdf8' }
          ]
        }
      },
      {
        stepNumber: 2,
        title: 'Bước 2: Quay cung tròn tâm B bán kính AB = 4 cm',
        instruction: 'Mở khẩu độ compa bằng đúng 4 cm trên thước. Đặt đầu nhọn compa tại điểm B, quay một cung tròn nhỏ ở phía trên đoạn BC.',
        pedagogicalTip: '💡 Mẹo: Giữ chặt đầu kim compa tại điểm B, chỉ xoay nhẹ cán compa để cung tròn mờ và chuẩn xác.',
        toolNeeded: 'Compa + Thước thẳng',
        visualState: {
          points: [
            { id: 'B', x: 120, y: 280, label: 'B' },
            { id: 'C', x: 420, y: 280, label: 'C' }
          ],
          lines: [
            { p1: 'B', p2: 'C', color: '#3b82f6' }
          ],
          arcs: [
            { cx: 120, cy: 280, r: 200, startAngle: -1.2, endAngle: -0.6, dashed: true, color: '#f59e0b' }
          ],
          annotations: [
            { text: '⭕ Cung tròn (B; 4cm)', x: 190, y: 120, color: '#f59e0b' }
          ]
        }
      },
      {
        stepNumber: 3,
        title: 'Bước 3: Quay cung tròn tâm C bán kính AC = 5 cm cắt cung tròn trước tại A',
        instruction: 'Mở compa bán kính đúng 5 cm. Đặt đầu nhọn tại C, quay cung tròn cắt cung tròn tâm B ở Bước 2. Giao điểm của hai cung tròn chính là đỉnh A.',
        pedagogicalTip: '💡 Mẹo: Giao điểm phải là điểm giao cắt dứt khoát của 2 cung tròn, đánh dấu chấm tròn nhỏ và ghi chữ A.',
        toolNeeded: 'Compa',
        visualState: {
          points: [
            { id: 'B', x: 120, y: 280, label: 'B' },
            { id: 'C', x: 420, y: 280, label: 'C' },
            { id: 'A', x: 220, y: 100, label: 'A (Đỉnh tam giác)', color: '#ef4444' }
          ],
          lines: [
            { p1: 'B', p2: 'C', color: '#3b82f6' }
          ],
          arcs: [
            { cx: 120, cy: 280, r: 200, startAngle: -1.2, endAngle: -0.6, dashed: true, color: '#f59e0b' },
            { cx: 420, cy: 280, r: 250, startAngle: -2.6, endAngle: -2.0, dashed: true, color: '#10b981' }
          ],
          annotations: [
            { text: '🎯 Giao điểm A', x: 240, y: 80, color: '#ef4444' }
          ]
        }
      },
      {
        stepNumber: 4,
        title: 'Bước 4: Nối đoạn thẳng AB, AC và hoàn thiện',
        instruction: 'Dùng thước thẳng nối A với B và A với C. Ghi số đo các cạnh AB = 4cm, AC = 5cm, BC = 6cm. Ta được tam giác ABC hoàn chỉnh.',
        pedagogicalTip: '💡 Mẹo: Sau khi vẽ xong có thể để mờ nét cung tròn compa hoặc tẩy nhẹ, không tẩy hết để chứng minh bài dựng hình.',
        toolNeeded: 'Thước thẳng & Bút chì',
        visualState: {
          points: [
            { id: 'A', x: 220, y: 100, label: 'A', color: '#ef4444' },
            { id: 'B', x: 120, y: 280, label: 'B', color: '#ef4444' },
            { id: 'C', x: 420, y: 280, label: 'C', color: '#ef4444' }
          ],
          lines: [
            { p1: 'A', p2: 'B', color: '#3b82f6', label: '4 cm' },
            { p1: 'B', p2: 'C', color: '#3b82f6', label: '6 cm' },
            { p1: 'C', p2: 'A', color: '#3b82f6', label: '5 cm' }
          ],
          annotations: [
            { text: '✨ Hoàn thành tam giác ABC!', x: 200, y: 50, color: '#22c55e' }
          ]
        }
      }
    ]
  },

  // 2. Vẽ Tia Phân Giác Của Một Góc bằng Thước và Compa (Lớp 7)
  {
    id: 'draw_angle_bisector',
    title: '2. Vẽ Tia Phân Giác Của Góc xOy (bằng Thước & Compa)',
    grade: 'Lớp 7',
    category: 'plane_2d',
    difficulty: 'Dễ',
    summary: 'Cách chia đôi góc xOy thành 2 góc bằng nhau chuẩn xác tuyệt đối theo phương pháp hình học Euclid.',
    commonMistakes: [
      'Thay đổi khẩu độ compa giữa hai lần quay cung tròn tâm M và tâm N làm tia phân giác bị lệch.',
      'Quên ký hiệu 2 góc bằng nhau (vòng cung 1 vạch giống nhau).'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Bước 1: Vẽ góc xOy ban đầu',
        instruction: 'Vẽ đỉnh O và hai tia Ox, Oy tạo thành một góc nhọn hoặc góc tù bất kỳ.',
        pedagogicalTip: '💡 Mẹo: Vẽ 2 cạnh Ox, Oy đủ dài (khoảng 6-8cm) để dễ đặt compa.',
        toolNeeded: 'Thước thẳng',
        visualState: {
          points: [
            { id: 'O', x: 100, y: 260, label: 'O' },
            { id: 'X', x: 440, y: 260, label: 'x' },
            { id: 'Y', x: 360, y: 70, label: 'y' }
          ],
          lines: [
            { p1: 'O', p2: 'X', color: '#38bdf8' },
            { p1: 'O', p2: 'Y', color: '#38bdf8' }
          ]
        }
      },
      {
        stepNumber: 2,
        title: 'Bước 2: Quay cung tròn tâm O cắt Ox tại M, cắt Oy tại N',
        instruction: 'Đặt đầu kim compa tại gốc O với bán kính tùy ý (khoảng 4cm). Quay một cung tròn cắt tia Ox tại M và cắt tia Oy tại N sao cho OM = ON.',
        pedagogicalTip: '💡 Mẹo: Khoảng cách từ O đến M và O đến N bắt buộc phải bằng nhau.',
        toolNeeded: 'Compa',
        visualState: {
          points: [
            { id: 'O', x: 100, y: 260, label: 'O' },
            { id: 'X', x: 440, y: 260, label: 'x' },
            { id: 'Y', x: 360, y: 70, label: 'y' },
            { id: 'M', x: 260, y: 260, label: 'M', color: '#f59e0b' },
            { id: 'N', x: 210, y: 180, label: 'N', color: '#f59e0b' }
          ],
          lines: [
            { p1: 'O', p2: 'X', color: '#38bdf8' },
            { p1: 'O', p2: 'Y', color: '#38bdf8' }
          ],
          arcs: [
            { cx: 100, cy: 260, r: 160, startAngle: -0.8, endAngle: 0.1, dashed: true, color: '#f59e0b' }
          ],
          annotations: [
            { text: 'OM = ON', x: 190, y: 230, color: '#f59e0b' }
          ]
        }
      },
      {
        stepNumber: 3,
        title: 'Bước 3: Quay 2 cung tròn cùng bán kính từ M và N cắt nhau tại K',
        instruction: 'Giữ nguyên hoặc mở rộng bán kính compa. Lần lượt đặt tâm tại M quay một cung tròn, rồi đặt tâm tại N quay cung tròn cùng bán kính cắt cung kia tại điểm K.',
        pedagogicalTip: '💡 Mẹo: Bán kính từ M và N PHẢI BẰNG NHAU. Nếu thay đổi độ mở compa, tia phân giác sẽ bị lệch ngay.',
        toolNeeded: 'Compa',
        visualState: {
          points: [
            { id: 'O', x: 100, y: 260, label: 'O' },
            { id: 'X', x: 440, y: 260, label: 'x' },
            { id: 'Y', x: 360, y: 70, label: 'y' },
            { id: 'M', x: 260, y: 260, label: 'M', color: '#f59e0b' },
            { id: 'N', x: 210, y: 180, label: 'N', color: '#f59e0b' },
            { id: 'K', x: 360, y: 175, label: 'K', color: '#ef4444' }
          ],
          lines: [
            { p1: 'O', p2: 'X', color: '#38bdf8' },
            { p1: 'O', p2: 'Y', color: '#38bdf8' }
          ],
          arcs: [
            { cx: 260, cy: 260, r: 130, startAngle: -1.8, endAngle: -1.0, dashed: true, color: '#10b981' },
            { cx: 210, cy: 180, r: 130, startAngle: -0.4, endAngle: 0.4, dashed: true, color: '#10b981' }
          ],
          annotations: [
            { text: '🎯 Giao điểm K', x: 375, y: 170, color: '#ef4444' }
          ]
        }
      },
      {
        stepNumber: 4,
        title: 'Bước 4: Nối tia Oz đi qua O và K (Tia phân giác)',
        instruction: 'Đặt thước nối từ gốc O đi qua điểm K và kéo dài ra được tia Oz. Tia Oz chính là tia phân giác của góc xOy. Đánh dấu ký hiệu 2 góc bằng nhau.',
        pedagogicalTip: '💡 Mẹo: Đánh dấu 2 vòng cung có 1 vạch giống nhau ở góc xOz và góc zOy để biểu thị 2 góc bằng nhau.',
        toolNeeded: 'Thước thẳng',
        visualState: {
          points: [
            { id: 'O', x: 100, y: 260, label: 'O', color: '#ef4444' },
            { id: 'X', x: 440, y: 260, label: 'x' },
            { id: 'Y', x: 360, y: 70, label: 'y' },
            { id: 'Z', x: 450, y: 130, label: 'z (Phân giác)', color: '#22c55e' }
          ],
          lines: [
            { p1: 'O', p2: 'X', color: '#38bdf8' },
            { p1: 'O', p2: 'Y', color: '#38bdf8' },
            { p1: 'O', p2: 'Z', color: '#22c55e', label: 'Tia Oz' }
          ],
          annotations: [
            { text: '✨ Góc xOz = Góc zOy', x: 220, y: 210, color: '#22c55e' }
          ]
        }
      }
    ]
  },

  // 3. Vẽ 3 Đường Cao và Xác Định Trực Tâm H của Tam Giác (Lớp 7, 8, 9)
  {
    id: 'draw_altitudes_orthocenter',
    title: '3. Vẽ 3 Đường Cao và Xác Định Trực Tâm H của Tam Giác',
    grade: 'Lớp 7, 8, 9',
    category: 'plane_2d',
    difficulty: 'Trung bình',
    summary: 'Hướng dẫn sử dụng thước Ê-ke để hạ vuông góc chính xác từ từng đỉnh xuống cạnh đối diện, tìm trực tâm H.',
    commonMistakes: [
      'Đặt thước không vuông góc với cạnh đáy dẫn đến đường cao bị xiên.',
      'Quên đánh dấu ký hiệu góc vuông tại chân đường cao.',
      'Với tam giác tù, không biết kéo dài cạnh đáy ra ngoài để hạ đường cao ngoài.'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Bước 1: Vẽ tam giác nhọn ABC',
        instruction: 'Vẽ tam giác ABC với 3 góc nhọn để cả 3 đường cao và trực tâm H nằm hoàn toàn bên trong tam giác.',
        pedagogicalTip: '💡 Mẹo: Vẽ cạnh đáy BC nằm ngang và đỉnh A lệch về bên trái một chút để các đường cao không bị chồng khít lên nhau.',
        toolNeeded: 'Thước thẳng',
        visualState: {
          points: [
            { id: 'A', x: 220, y: 80, label: 'A' },
            { id: 'B', x: 100, y: 280, label: 'B' },
            { id: 'C', x: 440, y: 280, label: 'C' }
          ],
          lines: [
            { p1: 'A', p2: 'B', color: '#38bdf8' },
            { p1: 'B', p2: 'C', color: '#38bdf8' },
            { p1: 'C', p2: 'A', color: '#38bdf8' }
          ]
        }
      },
      {
        stepNumber: 2,
        title: 'Bước 2: Hạ đường cao AH vuông góc với BC (dùng Ê-ke)',
        instruction: 'Đặt một cạnh góc vuông của ê-ke trùng khít với cạnh BC, trượt ê-ke dọc theo BC sao cho cạnh góc vuông còn lại đi qua đỉnh A. Kẻ đoạn thẳng AH vuông góc BC tại H.',
        pedagogicalTip: '💡 Mẹo: Đánh dấu ngay ký hiệu góc vuông ∟ tại điểm H.',
        toolNeeded: 'Thước Ê-ke vuông',
        visualState: {
          points: [
            { id: 'A', x: 220, y: 80, label: 'A' },
            { id: 'B', x: 100, y: 280, label: 'B' },
            { id: 'C', x: 440, y: 280, label: 'C' },
            { id: 'H1', x: 220, y: 280, label: 'H₁ (Chân đ/cao)', color: '#ef4444' }
          ],
          lines: [
            { p1: 'A', p2: 'B', color: '#38bdf8' },
            { p1: 'B', p2: 'C', color: '#38bdf8' },
            { p1: 'C', p2: 'A', color: '#38bdf8' },
            { p1: 'A', p2: 'H1', color: '#ef4444', label: 'AH ⊥ BC' }
          ],
          angles: [
            { p1: 'A', vertex: 'H1', p2: 'C', isRight: true }
          ]
        }
      },
      {
        stepNumber: 3,
        title: 'Bước 3: Hạ đường cao BK vuông góc với AC',
        instruction: 'Đặt cạnh ê-ke trùng với cạnh AC, trượt tới đỉnh B và kẻ đường vuông góc BK cắt AC tại K. Điểm giao nhau giữa AH và BK chính là Trực tâm H của tam giác.',
        pedagogicalTip: '💡 Mẹo: Hai đường cao bất kỳ trong tam giác đã đủ để xác định trực tâm H.',
        toolNeeded: 'Thước Ê-ke vuông',
        visualState: {
          points: [
            { id: 'A', x: 220, y: 80, label: 'A' },
            { id: 'B', x: 100, y: 280, label: 'B' },
            { id: 'C', x: 440, y: 280, label: 'C' },
            { id: 'H1', x: 220, y: 280, label: 'H₁' },
            { id: 'K', x: 300, y: 153, label: 'K', color: '#f59e0b' },
            { id: 'H', x: 220, y: 198, label: 'H (Trực tâm)', color: '#22c55e' }
          ],
          lines: [
            { p1: 'A', p2: 'B', color: '#38bdf8' },
            { p1: 'B', p2: 'C', color: '#38bdf8' },
            { p1: 'C', p2: 'A', color: '#38bdf8' },
            { p1: 'A', p2: 'H1', color: '#ef4444' },
            { p1: 'B', p2: 'K', color: '#f59e0b' }
          ],
          angles: [
            { p1: 'A', vertex: 'H1', p2: 'C', isRight: true },
            { p1: 'B', vertex: 'K', p2: 'A', isRight: true }
          ],
          annotations: [
            { text: '🎯 Trực tâm H (Giao 3 đường cao)', x: 240, y: 198, color: '#22c55e' }
          ]
        }
      },
      {
        stepNumber: 4,
        title: 'Bước 4: Kẻ đường cao thứ 3 CI qua H vuông góc với AB (Kiểm tra)',
        instruction: 'Kẻ tia từ C đi qua trực tâm H cắt cạnh AB tại I. Bạn sẽ thấy CI tự động vuông góc với AB (tính chất đồng quy của 3 đường cao).',
        pedagogicalTip: '💡 Mẹo: Ba đường cao luôn đồng quy tại đúng 1 điểm H.',
        toolNeeded: 'Thước thẳng',
        visualState: {
          points: [
            { id: 'A', x: 220, y: 80, label: 'A', color: '#ef4444' },
            { id: 'B', x: 100, y: 280, label: 'B', color: '#ef4444' },
            { id: 'C', x: 440, y: 280, label: 'C', color: '#ef4444' },
            { id: 'H1', x: 220, y: 280, label: 'H₁' },
            { id: 'K', x: 300, y: 153, label: 'K' },
            { id: 'I', x: 168, y: 167, label: 'I' },
            { id: 'H', x: 220, y: 198, label: 'H (Trực tâm)', color: '#22c55e' }
          ],
          lines: [
            { p1: 'A', p2: 'B', color: '#38bdf8' },
            { p1: 'B', p2: 'C', color: '#38bdf8' },
            { p1: 'C', p2: 'A', color: '#38bdf8' },
            { p1: 'A', p2: 'H1', color: '#ef4444' },
            { p1: 'B', p2: 'K', color: '#f59e0b' },
            { p1: 'C', p2: 'I', color: '#a855f7' }
          ],
          angles: [
            { p1: 'A', vertex: 'H1', p2: 'C', isRight: true },
            { p1: 'B', vertex: 'K', p2: 'A', isRight: true },
            { p1: 'C', vertex: 'I', p2: 'A', isRight: true }
          ]
        }
      }
    ]
  },

  // 4. Vẽ Hình Chóp S.ABCD trong Không Gian 3D (Lớp 11, 12)
  {
    id: 'draw_pyramid_3d_solid',
    title: '4. Vẽ Hình Chóp Tứ Giác S.ABCD (Hình Học Không Gian 3D)',
    grade: 'Lớp 11, 12',
    category: 'solid_3d',
    difficulty: 'Nâng cao',
    summary: 'Quy tắc vàng vẽ hình không gian: Nét nhìn thấy vẽ nét liền, nét khuất bên trong vẽ nét đứt; vẽ đáy trước rồi dựng đỉnh S.',
    commonMistakes: [
      'Vẽ mặt đáy hình vuông/hình chữ nhật thành hình vuông thật thay vì hình biểu diễn bình hành.',
      'Vẽ tất cả các cạnh bằng nét liền (quên nét đứt của cạnh AB, AD hoặc đường cao SH bị khuất bên trong).',
      'Đỉnh S đặt quá thấp hoặc quá sát cạnh bên làm hình bị dẹt khó nhìn.'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Bước 1: Vẽ mặt đáy ABCD (Hình biểu diễn là Hình Bình Hành)',
        instruction: 'Vẽ tứ giác đáy ABCD dưới dạng hình bình hành nằm ngang nghiêng. Chú ý: 2 cạnh phía sau (AD và AB) bị khuất nên BẮT BUỘC vẽ bằng nét đứt (dashed), 2 cạnh phía trước (BC và CD) vẽ bằng nét liền.',
        pedagogicalTip: '💡 Mẹo vàng: Cạnh nhìn thấy = Nét liền, Cạnh bị che khuất = Nét đứt (---).',
        toolNeeded: 'Thước thẳng & Bút chì',
        visualState: {
          points: [
            { id: 'A', x: 160, y: 220, label: 'A (Khuất)', color: '#94a3b8' },
            { id: 'B', x: 80, y: 300, label: 'B' },
            { id: 'C', x: 360, y: 300, label: 'C' },
            { id: 'D', x: 440, y: 220, label: 'D' }
          ],
          lines: [
            { p1: 'A', p2: 'B', dashed: true, color: '#38bdf8' },
            { p1: 'A', p2: 'D', dashed: true, color: '#38bdf8' },
            { p1: 'B', p2: 'C', dashed: false, color: '#38bdf8' },
            { p1: 'C', p2: 'D', dashed: false, color: '#38bdf8' }
          ],
          annotations: [
            { text: '⚠️ Nét đứt (AD, AB) vì bị đáy che khuất', x: 190, y: 250, color: '#f59e0b' }
          ]
        }
      },
      {
        stepNumber: 2,
        title: 'Bước 2: Chọn vị trí đỉnh S và dựng đường cao SH (nếu có)',
        instruction: 'Chấm điểm S ở phía trên cao, thẳng hàng với vị trí chân đường cao H (ví dụ H là giao điểm 2 đường chéo hoặc trung điểm AB). Kẻ SH thẳng đứng nét đứt.',
        pedagogicalTip: '💡 Mẹo: Đỉnh S nên nằm cao hơn mặt đáy ít nhất 1.5 lần để hình thoáng, dễ vẽ các thiết diện sau này.',
        toolNeeded: 'Thước thẳng',
        visualState: {
          points: [
            { id: 'A', x: 160, y: 220, label: 'A' },
            { id: 'B', x: 80, y: 300, label: 'B' },
            { id: 'C', x: 360, y: 300, label: 'C' },
            { id: 'D', x: 440, y: 220, label: 'D' },
            { id: 'H', x: 260, y: 260, label: 'H (Tâm đáy)', color: '#10b981' },
            { id: 'S', x: 260, y: 60, label: 'S (Đỉnh chóp)', color: '#ef4444' }
          ],
          lines: [
            { p1: 'A', p2: 'B', dashed: true, color: '#38bdf8' },
            { p1: 'A', p2: 'D', dashed: true, color: '#38bdf8' },
            { p1: 'B', p2: 'C', dashed: false, color: '#38bdf8' },
            { p1: 'C', p2: 'D', dashed: false, color: '#38bdf8' },
            { p1: 'A', p2: 'C', dashed: true, color: '#64748b' },
            { p1: 'B', p2: 'D', dashed: true, color: '#64748b' },
            { p1: 'S', p2: 'H', dashed: true, color: '#10b981', label: 'SH ⊥ (ABCD)' }
          ],
          annotations: [
            { text: 'Đường cao SH thẳng đứng', x: 275, y: 150, color: '#10b981' }
          ]
        }
      },
      {
        stepNumber: 3,
        title: 'Bước 3: Nối các cạnh bên SA, SB, SC, SD',
        instruction: 'Nối S với các đỉnh của đáy: SA nằm ở mặt sau khuất -> Nét đứt; SB, SC, SD nằm ở mặt trước nhìn thấy -> Nét liền.',
        pedagogicalTip: '💡 Mẹo: Cạnh SA luôn vẽ nét đứt vì bị các mặt phẳng (SBC) và (SCD) che chắn.',
        toolNeeded: 'Thước thẳng',
        visualState: {
          points: [
            { id: 'A', x: 160, y: 220, label: 'A', color: '#94a3b8' },
            { id: 'B', x: 80, y: 300, label: 'B', color: '#ef4444' },
            { id: 'C', x: 360, y: 300, label: 'C', color: '#ef4444' },
            { id: 'D', x: 440, y: 220, label: 'D', color: '#ef4444' },
            { id: 'S', x: 260, y: 60, label: 'S', color: '#ef4444' }
          ],
          lines: [
            { p1: 'A', p2: 'B', dashed: true, color: '#38bdf8' },
            { p1: 'A', p2: 'D', dashed: true, color: '#38bdf8' },
            { p1: 'B', p2: 'C', dashed: false, color: '#38bdf8' },
            { p1: 'C', p2: 'D', dashed: false, color: '#38bdf8' },
            { p1: 'S', p2: 'A', dashed: true, color: '#f59e0b', label: 'SA (Khuất)' },
            { p1: 'S', p2: 'B', dashed: false, color: '#38bdf8' },
            { p1: 'S', p2: 'C', dashed: false, color: '#38bdf8' },
            { p1: 'S', p2: 'D', dashed: false, color: '#38bdf8' }
          ],
          annotations: [
            { text: '✨ Khối chóp S.ABCD hoàn chỉnh chuẩn 3D!', x: 160, y: 30, color: '#22c55e' }
          ]
        }
      }
    ]
  },

  // 5. Vẽ Đường Tròn Ngoại Tiếp Tam Giác (Lớp 9, 10)
  {
    id: 'draw_circumcircle_triangle',
    title: '5. Vẽ Đường Tròn Ngoại Tiếp Tam Giác ABC (Giao 3 Đường Trung Trực)',
    grade: 'Lớp 9, 10',
    category: 'plane_2d',
    difficulty: 'Trung bình',
    summary: 'Cách dựng 2 đường trung trực để tìm tâm O, sau đó quay compa đường tròn (O; OA) đi qua đúng 3 đỉnh A, B, C.',
    commonMistakes: [
      'Nhầm tâm ngoại tiếp O (giao đường trung trực) với tâm nội tiếp I (giao phân giác).',
      'Không xác định chính xác trung điểm cạnh trước khi kẻ vuông góc.'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Bước 1: Vẽ tam giác ABC và xác định trung điểm các cạnh',
        instruction: 'Vẽ tam giác ABC. Dùng thước chia đôi cạnh BC tìm trung điểm M, chia đôi cạnh AC tìm trung điểm N.',
        pedagogicalTip: '💡 Mẹo: Đo chính xác từng milimet trên thước để xác định trung điểm.',
        toolNeeded: 'Thước thẳng chia vạch',
        visualState: {
          points: [
            { id: 'A', x: 240, y: 90, label: 'A' },
            { id: 'B', x: 100, y: 270, label: 'B' },
            { id: 'C', x: 420, y: 270, label: 'C' },
            { id: 'M', x: 260, y: 270, label: 'M (Trung điểm BC)', color: '#f59e0b' },
            { id: 'N', x: 330, y: 180, label: 'N (Trung điểm AC)', color: '#f59e0b' }
          ],
          lines: [
            { p1: 'A', p2: 'B', color: '#38bdf8' },
            { p1: 'B', p2: 'C', color: '#38bdf8' },
            { p1: 'C', p2: 'A', color: '#38bdf8' }
          ]
        }
      },
      {
        stepNumber: 2,
        title: 'Bước 2: Dựng 2 đường trung trực vuông góc tại trung điểm',
        instruction: 'Dùng ê-ke dựng đường thẳng vuông góc với BC tại M, và đường thẳng vuông góc với AC tại N. Hai đường thẳng cắt nhau tại điểm O.',
        pedagogicalTip: '💡 Mẹo: Điểm O chính là tâm của đường tròn ngoại tiếp tam giác ABC (cách đều 3 đỉnh OA = OB = OC).',
        toolNeeded: 'Thước Ê-ke vuông',
        visualState: {
          points: [
            { id: 'A', x: 240, y: 90, label: 'A' },
            { id: 'B', x: 100, y: 270, label: 'B' },
            { id: 'C', x: 420, y: 270, label: 'C' },
            { id: 'M', x: 260, y: 270, label: 'M' },
            { id: 'N', x: 330, y: 180, label: 'N' },
            { id: 'O', x: 260, y: 195, label: 'O (Tâm ngoại tiếp)', color: '#ef4444' }
          ],
          lines: [
            { p1: 'A', p2: 'B', color: '#38bdf8' },
            { p1: 'B', p2: 'C', color: '#38bdf8' },
            { p1: 'C', p2: 'A', color: '#38bdf8' },
            { p1: 'M', p2: 'O', color: '#f59e0b', dashed: true },
            { p1: 'N', p2: 'O', color: '#f59e0b', dashed: true }
          ],
          angles: [
            { p1: 'O', vertex: 'M', p2: 'C', isRight: true }
          ]
        }
      },
      {
        stepNumber: 3,
        title: 'Bước 3: Đặt compa tại O, bán kính R = OA và quay đường tròn',
        instruction: 'Đặt đầu nhọn compa tại O, kéo đầu chì tới đỉnh A. Quay một vòng tròn trọn vẹn, đường tròn sẽ tự động đi qua hoàn hảo cả 3 đỉnh A, B, C.',
        pedagogicalTip: '💡 Mẹo: Giữ vững trục tâm O khi quay compa để đường tròn tròn đều và mượt mà.',
        toolNeeded: 'Compa',
        visualState: {
          points: [
            { id: 'A', x: 240, y: 90, label: 'A', color: '#ef4444' },
            { id: 'B', x: 100, y: 270, label: 'B', color: '#ef4444' },
            { id: 'C', x: 420, y: 270, label: 'C', color: '#ef4444' },
            { id: 'O', x: 260, y: 195, label: 'O', color: '#ef4444' }
          ],
          lines: [
            { p1: 'A', p2: 'B', color: '#38bdf8' },
            { p1: 'B', p2: 'C', color: '#38bdf8' },
            { p1: 'C', p2: 'A', color: '#38bdf8' },
            { p1: 'O', p2: 'A', color: '#a855f7', dashed: true, label: 'R = OA' }
          ],
          arcs: [
            { cx: 260, cy: 195, r: 106, startAngle: 0, endAngle: Math.PI * 2, color: '#a855f7' }
          ],
          annotations: [
            { text: '✨ Đường tròn ngoại tiếp (O; OA)', x: 160, y: 50, color: '#a855f7' }
          ]
        }
      }
    ]
  }
];

export interface StepByStepGeometryGuideProps {
  onLoadTutorialIntoCanvas?: (points: any[], lines: any[], circles: any[], angles: any[]) => void;
  onSendImageToLessonPlan?: (dataUrl: string) => void;
  onOpenExtractor?: (initialImage: string) => void;
  apiKeysInput?: string;
}

export const StepByStepGeometryGuide: React.FC<StepByStepGeometryGuideProps> = ({
  onLoadTutorialIntoCanvas,
  onSendImageToLessonPlan,
  onOpenExtractor,
  apiKeysInput = ''
}) => {
  // Load custom tutorials from local storage
  const [allTutorials, setAllTutorials] = useState<DrawingTutorial[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOM_TUTORIALS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [...GEOMETRY_TUTORIALS, ...parsed];
        }
      }
    } catch (e) {
      console.warn('Failed to parse custom tutorials from localStorage', e);
    }
    return GEOMETRY_TUTORIALS;
  });

  const [selectedTutId, setSelectedTutId] = useState<string>(allTutorials[0]?.id || GEOMETRY_TUTORIALS[0].id);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlayingAuto, setIsPlayingAuto] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<'all' | 'plane_2d' | 'solid_3d' | 'elementary'>('all');

  // AI Creation Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiGrade, setAiGrade] = useState<string>('Lớp 8');
  const [aiCategory, setAiCategory] = useState<'plane_2d' | 'solid_3d' | 'elementary'>('plane_2d');
  const [aiDifficulty, setAiDifficulty] = useState<'Dễ' | 'Trung bình' | 'Nâng cao'>('Trung bình');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>('');

  const currentTutorial = allTutorials.find((t) => t.id === selectedTutId) || allTutorials[0] || GEOMETRY_TUTORIALS[0];
  const currentStep = currentTutorial.steps[currentStepIdx] || currentTutorial.steps[0] || {
    stepNumber: 1,
    title: 'Bước 1',
    instruction: 'Chưa có bước hướng dẫn',
    pedagogicalTip: '',
    toolNeeded: 'Thước',
    visualState: { points: [], lines: [] }
  };

  // Save custom tutorials to localStorage
  const saveCustomTutorials = (newList: DrawingTutorial[]) => {
    setAllTutorials(newList);
    const customOnly = newList.filter(t => t.isCustom);
    try {
      localStorage.setItem(STORAGE_CUSTOM_TUTORIALS, JSON.stringify(customOnly));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  };

  // Auto player effect
  useEffect(() => {
    let timer: any = null;
    if (isPlayingAuto) {
      timer = setInterval(() => {
        setCurrentStepIdx((prev) => {
          if (prev < currentTutorial.steps.length - 1) {
            return prev + 1;
          } else {
            setIsPlayingAuto(false);
            return prev;
          }
        });
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isPlayingAuto, currentTutorial.steps.length]);

  const filteredTutorials = allTutorials.filter((t) => {
    if (filterCategory === 'all') return true;
    return t.category === filterCategory;
  });

  // Handle AI Tutorial Generation
  const handleGenerateAiTutorial = async () => {
    if (!aiPrompt.trim()) {
      setAiError('Vui lòng nhập yêu cầu bài vẽ hoặc tên bài toán hình học!');
      return;
    }

    setIsGeneratingAi(true);
    setAiError('');

    try {
      const promptInstruction = `Bạn là Chuyên gia Phương pháp Giảng dạy Sư phạm Hình học & Lập trình Đồ họa SVG cho giáo viên và học sinh Việt Nam (Chương trình GDPT 2018).
Hãy tạo một BÀI HƯỚNG DẪN TỪNG BƯỚC VẼ HÌNH HỌC (Step-by-Step Geometry Drawing Tutorial) theo yêu cầu sau:

Yêu cầu bài vẽ: "${aiPrompt.trim()}"
Khối lớp: "${aiGrade}"
Phân loại: "${aiCategory}"
Độ khó: "${aiDifficulty}"

Yêu cầu ĐẶC BIỆT VỀ DỮ LIỆU TỌA ĐỘ VÀ SƯ PHẠM:
1. Chia bài toán thành 3 đến 5 bước vẽ cực kỳ trực quan, tuần tự từ dễ đến khó (VD: Bước 1 vẽ đáy, Bước 2 vẽ cung tròn/dựng góc/đường cao, Bước 3 hoàn thiện...).
2. Mỗi bước cần có:
   - "stepNumber": số thứ tự (1, 2, 3...)
   - "title": Tên bước ngắn gọn (VD: "Bước 1: Vẽ đoạn thẳng cạnh đáy BC = 6cm")
   - "instruction": Hướng dẫn chi tiết học sinh đặt dụng cụ ra sao
   - "pedagogicalTip": Lời khuyên sư phạm (giúp học sinh yếu tránh sai lầm)
   - "toolNeeded": Tên dụng cụ (VD: "Thước thẳng", "Compa", "Ê-ke vuông", "Thước đo độ")
   - "visualState": Trạng thái đồ họa SVG trên khung viewBox "0 0 540 360".
     + points: Mảng các điểm [{ id: "A", x: 220, y: 130, label: "A", color: "#ef4444" }] (Tọa độ X nằm trong khoảng 80-460, Y trong khoảng 60-310).
     + lines: Mảng đoạn thẳng [{ p1: "B", p2: "C", color: "#3b82f6", dashed: false, label: "BC = 6cm" }] (nếu là hình không gian hoặc đường phụ bị khuất thì dashed: true).
     + arcs (tùy chọn): [{ cx: 120, cy: 280, r: 180, startAngle: -1.57, endAngle: -0.5, dashed: true, color: "#f59e0b" }].
     + angles (tùy chọn): [{ p1: "A", vertex: "B", p2: "C", label: "60°", isRight: false }].
     + annotations (tùy chọn): [{ text: "Đoạn thẳng BC = 6cm", x: 200, y: 300, color: "#38bdf8" }].

TRẢ VỀ DUY NHẤT MỘT ĐỐI TƯỢNG JSON HỢP LỆ THEO SCHEMA SAU (Không thêm bất kỳ chữ giải thích nào ngoài mã JSON):
{
  "id": "tut_ai_${Date.now()}",
  "title": "Tiêu đề bài hướng dẫn vẽ hình",
  "grade": "${aiGrade}",
  "category": "${aiCategory}",
  "difficulty": "${aiDifficulty}",
  "summary": "Tóm tắt mục tiêu bài vẽ và phương pháp dựng hình chuẩn",
  "commonMistakes": [
    "Lỗi 1 học sinh hay mắc...",
    "Lỗi 2 học sinh hay mắc..."
  ],
  "steps": [
    {
      "stepNumber": 1,
      "title": "Bước 1: ...",
      "instruction": "...",
      "pedagogicalTip": "...",
      "toolNeeded": "Thước thẳng",
      "visualState": {
        "points": [ ... ],
        "lines": [ ... ],
        "arcs": [ ... ],
        "angles": [ ... ],
        "annotations": [ ... ]
      }
    }
  ]
}`;

      const rawJson = await generateGeminiText({
        prompt: promptInstruction,
        apiKeys: apiKeysInput
      });

      let cleaned = rawJson.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const generatedTut: DrawingTutorial = JSON.parse(cleaned);
      generatedTut.id = `tut_custom_${Date.now()}`;
      generatedTut.isCustom = true;

      if (!generatedTut.steps || !Array.isArray(generatedTut.steps) || generatedTut.steps.length === 0) {
        throw new Error('Cấu trúc bước vẽ do AI sinh ra không hợp lệ.');
      }

      const updatedList = [generatedTut, ...allTutorials];
      saveCustomTutorials(updatedList);
      setSelectedTutId(generatedTut.id);
      setCurrentStepIdx(0);
      setIsAiModalOpen(false);
      setAiPrompt('');
      alert(`✓ Đã tạo thành công bài hướng dẫn: "${generatedTut.title}" với ${generatedTut.steps.length} bước vẽ trực quan!`);
    } catch (err: any) {
      console.error('Error generating tutorial with AI:', err);
      setAiError('Lỗi tạo bài hướng dẫn bằng AI: ' + (err?.message || String(err)));
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Delete a tutorial
  const handleDeleteTutorial = (tutId: string, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài hướng dẫn "${title}"?`)) return;
    const filtered = allTutorials.filter(t => t.id !== tutId);
    saveCustomTutorials(filtered);
    if (selectedTutId === tutId) {
      setSelectedTutId(filtered[0]?.id || GEOMETRY_TUTORIALS[0].id);
      setCurrentStepIdx(0);
    }
  };

  // Transfer diagram to Geometry Canvas
  const handleTransferToCanvas = () => {
    if (!onLoadTutorialIntoCanvas) {
      alert('Chức năng chuyển sang bảng vẽ Geometry Canvas đã sẵn sàng!');
      return;
    }

    const pts = currentStep.visualState.points.map((p) => ({
      id: p.id,
      x: p.x,
      y: p.y,
      label: p.label || p.id,
      color: p.color || '#ef4444',
      radius: 6
    }));

    const lns = currentStep.visualState.lines.map((l, i) => ({
      id: `line_${i}`,
      p1: l.p1,
      p2: l.p2,
      color: l.color || '#3b82f6',
      width: 2.5,
      dashed: !!l.dashed,
      label: l.label || ''
    }));

    const crcs = (currentStep.visualState.arcs || []).map((arc, i) => ({
      id: `circle_${i}`,
      centerId: currentStep.visualState.points[0]?.id || 'O',
      radius: arc.r,
      color: arc.color || '#9333ea',
      dashed: !!arc.dashed
    }));

    const angs = (currentStep.visualState.angles || []).map((ang, i) => ({
      id: `ang_${i}`,
      p1: ang.p1,
      vertex: ang.vertex,
      p2: ang.p2,
      color: '#dc2626',
      isRightAngle: !!ang.isRight,
      degreeValue: ang.label ? parseFloat(ang.label) || undefined : undefined
    }));

    onLoadTutorialIntoCanvas(pts, lns, crcs, angs);
  };

  return (
    <div className="bg-slate-900 border border-indigo-700/60 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-900/40">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              HƯỚNG DẪN TỪNG BƯỚC VẼ HÌNH HỌC CHO HỌC SINH (LỚP 1 - 12)
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Sư phạm trực quan
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Giải pháp giúp học sinh yếu kỹ năng vẽ hình nắm vững từng thao tác đặt thước, compa, ê-ke và quy tắc nét đứt / nét liền.
            </p>
          </div>
        </div>

        {/* Action Buttons: Add Tutorial & Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-900/30 transition-all hover:scale-105"
            title="Nhập mô tả đề bài và để AI tự tạo bài hướng dẫn từng bước kèm hình vẽ tương tác"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>🤖 Ra Lệnh Cho AI Tạo Bài Hướng Dẫn</span>
          </button>

          {/* Category Filters */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterCategory === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất cả ({allTutorials.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('plane_2d')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterCategory === 'plane_2d' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Hình phẳng 2D
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('solid_3d')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterCategory === 'solid_3d' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Không gian 3D
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left tutorial list, Right interactive player */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Tutorials Navigation */}
        <div className="lg:col-span-4 space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
          {filteredTutorials.map((tut) => {
            const isSelected = tut.id === selectedTutId;
            return (
              <div
                key={tut.id}
                onClick={() => {
                  setSelectedTutId(tut.id);
                  setCurrentStepIdx(0);
                  setIsPlayingAuto(false);
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all relative group ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border-indigo-500 shadow-md shadow-indigo-950/50 scale-[1.01]'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-amber-400">{tut.grade}</span>
                    {tut.isCustom && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-300 border border-purple-500/40">
                        AI/Tùy biến
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        tut.difficulty === 'Dễ'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : tut.difficulty === 'Trung bình'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {tut.difficulty}
                    </span>
                    {tut.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTutorial(tut.id, tut.title);
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 rounded transition-all"
                        title="Xóa bài hướng dẫn tự tạo này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <h4 className="text-sm font-bold text-slate-200 leading-snug line-clamp-2">{tut.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-1 mt-1">{tut.summary}</p>
                <div className="mt-2 text-[11px] text-indigo-300 font-medium flex items-center justify-between">
                  <span>{tut.steps.length} bước vẽ trực quan</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Interactive Step-by-step Visual Canvas Player */}
        <div className="lg:col-span-8 space-y-4">
          {/* Active Tutorial Title Bar */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-amber-400">{currentTutorial.grade} • {currentTutorial.difficulty}</div>
              <h3 className="text-base font-extrabold text-white">{currentTutorial.title}</h3>
            </div>

            {/* Step Indicators & Canvas Bridge Button */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                {currentTutorial.steps.map((st, idx) => (
                  <button
                    key={st.stepNumber}
                    type="button"
                    onClick={() => {
                      setCurrentStepIdx(idx);
                      setIsPlayingAuto(false);
                    }}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                      idx === currentStepIdx
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/50 scale-110'
                        : idx < currentStepIdx
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                    title={`Bước ${st.stepNumber}: ${st.title}`}
                  >
                    {st.stepNumber}
                  </button>
                ))}
              </div>

              {onLoadTutorialIntoCanvas && (
                <button
                  type="button"
                  onClick={handleTransferToCanvas}
                  className="px-3 py-1.5 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/50 text-xs font-semibold flex items-center gap-1.5 shadow transition-all ml-2"
                  title="Chuyển hình vẽ ở bước này sang Studio vẽ hình học để tùy chỉnh, đổi màu, kích thước điểm, kéo thả tương tác"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-300" />
                  <span>📐 Chuyển Sang Studio Vẽ Hình</span>
                </button>
              )}
            </div>
          </div>

          {/* SVG Visual Canvas Stage */}
          <div className="bg-slate-950 border-2 border-indigo-900/60 rounded-2xl p-4 relative overflow-hidden shadow-inner flex flex-col items-center justify-center min-h-[320px]">
            <svg
              viewBox="0 0 540 360"
              className="w-full h-auto max-h-[380px] select-none"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
            >
              <defs>
                <pattern id="guideGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2,2" />
                </pattern>
              </defs>
              <rect width="540" height="360" fill="url(#guideGrid)" />

              {/* Draw Arcs / Compass marks */}
              {currentStep.visualState.arcs?.map((arc, arcIdx) => {
                const startX = arc.cx + arc.r * Math.cos(arc.startAngle);
                const startY = arc.cy + arc.r * Math.sin(arc.startAngle);
                const endX = arc.cx + arc.r * Math.cos(arc.endAngle);
                const endY = arc.cy + arc.r * Math.sin(arc.endAngle);
                const isFullCircle = Math.abs(arc.endAngle - arc.startAngle) >= Math.PI * 1.95;

                if (isFullCircle) {
                  return (
                    <circle
                      key={`arc_${arcIdx}`}
                      cx={arc.cx}
                      cy={arc.cy}
                      r={arc.r}
                      fill="none"
                      stroke={arc.color || '#f59e0b'}
                      strokeWidth="2"
                      strokeDasharray={arc.dashed ? '4,4' : 'none'}
                    />
                  );
                }

                const d = `M ${startX} ${startY} A ${arc.r} ${arc.r} 0 0 1 ${endX} ${endY}`;
                return (
                  <path
                    key={`arc_${arcIdx}`}
                    d={d}
                    fill="none"
                    stroke={arc.color || '#f59e0b'}
                    strokeWidth="2"
                    strokeDasharray={arc.dashed ? '4,4' : 'none'}
                  />
                );
              })}

              {/* Draw Lines */}
              {currentStep.visualState.lines.map((l, lIdx) => {
                const p1 = currentStep.visualState.points.find((p) => p.id === l.p1);
                const p2 = currentStep.visualState.points.find((p) => p.id === l.p2);
                if (!p1 || !p2) return null;
                return (
                  <g key={`line_${lIdx}`}>
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={l.color || '#38bdf8'}
                      strokeWidth="2.5"
                      strokeDasharray={l.dashed ? '6,6' : 'none'}
                      strokeLinecap="round"
                    />
                    {l.label && (
                      <text
                        x={(p1.x + p2.x) / 2}
                        y={(p1.y + p2.y) / 2 - 8}
                        fill="#cbd5e1"
                        fontSize="12"
                        fontWeight="bold"
                        textAnchor="middle"
                        className="bg-slate-900 px-1"
                      >
                        {l.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Draw Right Angle Markers if any */}
              {currentStep.visualState.angles?.map((ang, angIdx) => {
                const vertex = currentStep.visualState.points.find((p) => p.id === ang.vertex);
                if (!vertex) return null;
                return (
                  <rect
                    key={`ang_${angIdx}`}
                    x={vertex.x}
                    y={vertex.y - 12}
                    width="12"
                    height="12"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="1.8"
                  />
                );
              })}

              {/* Draw Points */}
              {currentStep.visualState.points.map((p) => (
                <g key={p.id} className="transition-all duration-300">
                  <circle cx={p.x} cy={p.y} r="7" fill="#ffffff" />
                  <circle cx={p.x} cy={p.y} r="5" fill={p.color || '#ef4444'} />
                  <text
                    x={p.x + 8}
                    y={p.y - 8}
                    fill="#ffffff"
                    fontSize="13"
                    fontWeight="800"
                    stroke="#020617"
                    strokeWidth="3"
                    paintOrder="stroke"
                  >
                    {p.label}
                  </text>
                </g>
              ))}

              {/* Draw Annotations */}
              {currentStep.visualState.annotations?.map((anno, annoIdx) => (
                <g key={`anno_${annoIdx}`}>
                  <rect
                    x={anno.x - 6}
                    y={anno.y - 16}
                    width={anno.text.length * 7.5 + 16}
                    height="22"
                    rx="6"
                    fill="#0f172a"
                    stroke={anno.color || '#38bdf8'}
                    strokeWidth="1"
                  />
                  <text
                    x={anno.x}
                    y={anno.y}
                    fill={anno.color || '#38bdf8'}
                    fontSize="11"
                    fontWeight="bold"
                  >
                    {anno.text}
                  </text>
                </g>
              ))}
            </svg>

            {/* Tool badge */}
            <div className="absolute top-3 right-3 bg-slate-900/90 border border-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-300 flex items-center gap-1.5 shadow">
              <PenTool className="w-3.5 h-3.5 text-amber-400" />
              <span>Dụng cụ: {currentStep.toolNeeded}</span>
            </div>
          </div>

          {/* Step Detail Explanation & Pedagogical Tip */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-extrabold">
                  {currentStep.stepNumber}
                </span>
                {currentStep.title}
              </h4>
              <span className="text-xs text-slate-400">
                Bước {currentStep.stepNumber} / {currentTutorial.steps.length}
              </span>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed font-medium bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
              {currentStep.instruction}
            </p>

            {/* Pedagogical Tip Box */}
            <div className="bg-amber-950/30 border border-amber-500/40 p-3 rounded-lg flex items-start gap-2.5 text-xs text-amber-200">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300">Lời khuyên sư phạm cho học sinh: </strong>
                {currentStep.pedagogicalTip}
              </div>
            </div>

            {/* Common student mistakes */}
            {currentTutorial.commonMistakes && currentTutorial.commonMistakes.length > 0 && (
              <div className="bg-rose-950/20 border border-rose-500/30 p-3 rounded-lg text-xs text-rose-200 space-y-1">
                <div className="font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Các lỗi học sinh thường mắc phải:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300 pl-1">
                  {currentTutorial.commonMistakes.map((m, idx) => (
                    <li key={idx}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Playback Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentStepIdx === 0}
                onClick={() => {
                  setCurrentStepIdx((prev) => Math.max(0, prev - 1));
                  setIsPlayingAuto(false);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-all flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Bước Trước</span>
              </button>

              <button
                type="button"
                disabled={currentStepIdx === currentTutorial.steps.length - 1}
                onClick={() => {
                  setCurrentStepIdx((prev) => Math.min(currentTutorial.steps.length - 1, prev + 1));
                  setIsPlayingAuto(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
              >
                <span>Bước Kế Tiếp</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsPlayingAuto(!isPlayingAuto)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isPlayingAuto
                    ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isPlayingAuto ? 'Đang tự chạy...' : 'Tự Động Chạy'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setCurrentStepIdx(0);
                setIsPlayingAuto(false);
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Vẽ lại từ đầu</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Tutorial Generation Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/60 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Ra Lệnh Cho AI Tạo Bài Hướng Dẫn Vẽ Hình Học</h3>
                  <p className="text-xs text-slate-400">AI tự động tạo các bước vẽ tuần tự, chỉ dẫn thước/compa và tọa độ hình học trực quan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {aiError && (
              <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs text-rose-200">
                {aiError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Mô tả đề bài / Yêu cầu vẽ hình:
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ví dụ: Vẽ hình bình hành ABCD có cạnh AB = 6cm, AD = 4cm, góc A = 60 độ, kẻ hai đường chéo cắt nhau tại O..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 h-28 leading-relaxed text-xs"
                />
              </div>

              {/* Sample Prompts */}
              <div className="space-y-1">
                <span className="text-slate-400 font-medium">Gợi ý mẫu nhanh:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Vẽ hình thoi ABCD khi biết 2 đường chéo AC = 8cm, BD = 6cm',
                    'Vẽ hình chóp tam giác đều S.ABC nét khuất chuẩn',
                    'Dựng góc 60 độ bằng thước thẳng và compa không dùng thước đo góc',
                    'Dựng tiếp tuyến của đường tròn (O) từ điểm M nằm ngoài đường tròn',
                    'Vẽ hình thang cân ABCD có đáy lớn CD, đường cao AH và BK'
                  ].map((sample, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => setAiPrompt(sample)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700/60"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Khối lớp:</label>
                  <select
                    value={aiGrade}
                    onChange={(e) => setAiGrade(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                  >
                    <option value="Tiểu học (Lớp 4-5)">Tiểu học (Lớp 4-5)</option>
                    <option value="Lớp 6">Lớp 6</option>
                    <option value="Lớp 7">Lớp 7</option>
                    <option value="Lớp 8">Lớp 8</option>
                    <option value="Lớp 9">Lớp 9</option>
                    <option value="Lớp 10">Lớp 10</option>
                    <option value="Lớp 11">Lớp 11</option>
                    <option value="Lớp 12">Lớp 12</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phân loại hình:</label>
                  <select
                    value={aiCategory}
                    onChange={(e) => setAiCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                  >
                    <option value="plane_2d">Hình học phẳng 2D</option>
                    <option value="solid_3d">Hình học không gian 3D</option>
                    <option value="elementary">Hình học trực quan tiểu học</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Độ khó:</label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                  >
                    <option value="Dễ">Dễ (Cơ bản)</option>
                    <option value="Trung bình">Trung bình</option>
                    <option value="Nâng cao">Nâng cao (Học sinh giỏi)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                disabled={isGeneratingAi || !aiPrompt.trim()}
                onClick={handleGenerateAiTutorial}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-900/30 disabled:opacity-50"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI đang phân tích & vẽ hình...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Tạo Bài Hướng Dẫn Ngay</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
