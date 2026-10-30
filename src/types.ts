export interface ClassProfile {
  lop: string;
  mon: string;
  phan_mon: string;
  siso: string;
  nangluc: string;
  thoiluong: string;
  loaiga: string;
  ngaysoan?: string;
  tenbaiday?: string;
  boSach?: string;
  sgkTap?: string;
  monTichHop?: string;
  schoolName?: string;
  schoolYear?: string;
  toChuyenMon?: string;
  diaPhuong?: string;
  bghSigner?: string;
  deptSigner?: string;
  teacherSigner?: string;
  k1Periods?: number;
  k2Periods?: number;
  totalYearPeriods?: number;
  mathStreamMode?: 'parallel' | 'continuous';
  daiSoK1Periods?: number;
  daiSoK2Periods?: number;
  hinhHocK1Periods?: number;
  hinhHocK2Periods?: number;
  soGiaoVien?: string;
  trinhDoDaoTao?: string;
  thietBiDayHoc?: string;
  phongHocBoMon?: string;
  appendixCustomPrompt?: string;
  hideActivityTime?: boolean;
}

export interface LessonItem {
  id: string;
  name: string;
  duration: string; // e.g. "1", "2", "3"
  period: string;   // e.g. "1, 2" or "3"
  boundary: string; // e.g. "Tiết 1: Lý thuyết. Tiết 2: Luyện tập"
}

export interface AppSettings {
  pp: string[];
  kt: string[];
  last_run?: string;
  apiKeys: string[];
  licenseKey?: string;
}

export interface ExamResultItem {
  id: string;
  studentName: string;
  examCode: string;
  score: string;
  correctAnswers: string;
  wrongDetails: string;
  imageName?: string;
  teacherComment?: string;
  essayFeedback?: string;
}

export interface TikZDiagram {
  id: string;
  code: string;
  caption?: string;
}

export type LessonGoalType = 'standard' | 'split_multi_period';

export interface GeneratedLessonPlan {
  id: string;
  lessonName: string;
  duration: string;
  period: string;
  content: string; // Markdown text with tables, Math, TikZ
  createdAt: string;
}

export interface TeacherProfile {
  id?: string;
  name: string;
  school: string;
  province?: string;
  department?: string;
  subject: string;
  grade: string;
  avatarUrl?: string;
  phone?: string;
  email?: string;
  licenseKey?: string;
  boundDeviceId?: string;
  isVip?: boolean;
  isAdmin?: boolean;
  updatedAt?: string;
}

export interface ForumCommentItem {
  id: string;
  authorName: string;
  authorSchool: string;
  authorAvatar?: string;
  authorDeviceId?: string;
  isAdmin?: boolean;
  isVip?: boolean;
  content: string;
  imageUrl?: string;
  createdAt: string;
}

export interface ForumMessageItem {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  authorName: string;
  authorSchool: string;
  authorAvatar?: string;
  authorDeviceId?: string;
  authorEmail?: string;
  isAdmin?: boolean;
  isVip?: boolean;
  isPrivateToAdmin: boolean; // True if message is strictly private to Admin
  category: 'general' | 'lesson_plan' | 'exam_matrix' | 'ai_tips' | 'private_admin' | 'bug_report';
  likesCount: number;
  likedByDevices: string[];
  comments: ForumCommentItem[];
  attachedFileName?: string;
  attachedFileUrl?: string;
  isPinned?: boolean;
  adminResponse?: string;
  adminResponseAt?: string;
  status?: 'approved' | 'pending' | 'rejected';
  rejectionReason?: string;
  isSeed?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface OnlineTeacherPresence {
  deviceId: string;
  teacherName: string;
  school: string;
  province?: string;
  avatarUrl?: string;
  isAdmin?: boolean;
  isVip?: boolean;
  currentTab?: string;
  lastActiveAt: number;
  startedAt?: number;
  status?: 'online' | 'offline';
}

export interface InteractiveSimulation {
  id: string;
  title: string;
  subject: string;
  grade: string;
  topic: string;
  description: string;
  htmlCode: string;
  authorName?: string;
  authorSchool?: string;
  authorDeviceId?: string;
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
  isFeatured?: boolean;
  isBuiltIn?: boolean;
}


