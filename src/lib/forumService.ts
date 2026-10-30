import { db, isFirestoreQuotaExceeded, checkAndHandleFirestoreError } from './firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { ForumMessageItem, ForumCommentItem } from '../types';
import { getDeviceId } from './licenseUtils';

export const STORAGE_KEY_FORUM_POSTS = 'app_forum_messages_v2';
export const STORAGE_KEY_DELETED_POSTS = 'app_forum_deleted_post_ids_v1';

export const SEED_FORUM_MESSAGES: ForumMessageItem[] = [
  {
    id: 'seed-forum-1',
    title: '📢 Chào mừng quý Thầy/Cô gia nhập Diễn đàn Sư phạm AI Lesson Planner Pro!',
    content: 'Kính chào quý Thầy/Cô trên cả nước! Diễn đàn là không gian giao lưu chuyên môn, chia sẻ giáo án chuẩn CV 5512/2345, ma trận đề thi phân hóa, phương pháp dạy học tích cực và kinh nghiệm ứng dụng AI trong giảng dạy. Thầy/Cô có thể đăng bài trao đổi công khai hoặc gửi tin nhắn riêng cho Admin (Thầy Cấn Văn Trường) để được hỗ trợ chuyên sâu và giải đáp bản quyền!',
    authorName: 'Thầy Cấn Văn Trường',
    authorSchool: 'Trường THCS Phùng Khắc Khoan, Hà Nội',
    authorAvatar: '',
    authorDeviceId: 'PKK-ADMIN',
    isAdmin: true,
    isVip: true,
    isPrivateToAdmin: false,
    status: 'approved',
    category: 'general',
    likesCount: 38,
    likedByDevices: ['PKK-ADMIN', 'PKK-8C42A1'],
    isPinned: true,
    comments: [
      {
        id: 'c-1',
        authorName: 'Cô Nguyễn Thị Mai',
        authorSchool: 'Trường THCS Trưng Vương, Hà Nội',
        content: 'Cảm ơn Thầy Trường rất nhiều! Phần mềm tạo giáo án 5512 và xuất sơ đồ TikZ rất mượt mà và chuẩn chỉnh!',
        createdAt: 'Hôm nay lúc 08:30',
        isVip: true
      },
      {
        id: 'c-2',
        authorName: 'Thầy Lê Hoàng Nam',
        authorSchool: 'Trường THPT Chuyên Lê Hồng Phong, TP.HCM',
        content: 'Chức năng ma trận đặc tả đề thi và xuất phiếu tô trắc nghiệm ô tròn chuẩn Sở GD&ĐT Hà Nội rất tiện dụng cho kỳ thi sắp tới.',
        createdAt: 'Hôm nay lúc 09:15',
        isVip: true
      }
    ],
    createdAt: 'Hôm nay lúc 07:00'
  },
  {
    id: 'seed-forum-2',
    title: '💡 Kinh nghiệm tích hợp 5 miền Khung Năng lực Số (NLS) vào tiến trình 4 hoạt động 5512',
    content: 'Khi soạn giáo án theo CV 5512, Thầy/Cô nên chú ý lồng ghép các chỉ số hành vi NLS (như NLS.1: Khai thác học liệu số, NLS.2: Giao tiếp & hợp tác trên không gian mạng, NLS.3: Sáng tạo sản phẩm số, NLS.5: Giải quyết vấn đề bằng công cụ số) vào Hoạt động 2 (Hình thành kiến thức) và Hoạt động 3 (Luyện tập). Điều này giúp tiết dạy được Hội đồng chuyên môn đánh giá rất cao!',
    authorName: 'Thầy Trần Minh Đức',
    authorSchool: 'Trường THCS Giảng Võ, Ba Đình, Hà Nội',
    authorAvatar: '',
    authorDeviceId: 'PKK-HN01',
    isAdmin: false,
    isVip: true,
    isPrivateToAdmin: false,
    status: 'approved',
    category: 'ai_tips',
    likesCount: 24,
    likedByDevices: ['PKK-ADMIN'],
    comments: [
      {
        id: 'c-3',
        authorName: 'Cô Phạm Thanh Hà',
        authorSchool: 'Trường THCS Lê Quý Đôn, Đà Nẵng',
        content: 'Rất hữu ích ạ! Trong Tab 1 & Tab 3 của phần mềm đã có sẵn tùy chọn tích hợp NLS và AI, bấm là tự chèn vào mục tiêu và hoạt động học.',
        createdAt: 'Hôm nay lúc 10:20',
        isVip: true
      }
    ],
    createdAt: 'Hôm qua lúc 15:40'
  },
  {
    id: 'seed-forum-3',
    title: '📐 Chia sẻ kinh nghiệm tạo hình vẽ Hình học không gian & Đồ thị Hàm số bằng TikZ',
    content: 'Các thầy cô dạy Toán lưu ý: Tab 5 của phần mềm có sẵn Thư viện TikZ và AI tự vẽ hình từ câu hỏi. Khi xuất sang file Word (.docx), phần mềm tự động biên dịch mã TikZ sang ảnh nét cao đặt chuẩn ở giữa trang, không bị lỗi font hay nhòe hình như copy ảnh thông thường!',
    authorName: 'Thầy Cấn Văn Trường',
    authorSchool: 'Trường THCS Phùng Khắc Khoan, Hà Nội',
    authorAvatar: '',
    authorDeviceId: 'PKK-ADMIN',
    isAdmin: true,
    isVip: true,
    isPrivateToAdmin: false,
    status: 'approved',
    category: 'lesson_plan',
    likesCount: 45,
    likedByDevices: ['PKK-ADMIN'],
    isPinned: true,
    comments: [],
    createdAt: 'Hôm qua lúc 11:20'
  },
  {
    id: 'seed-private-demo-1',
    title: '🔒 [Hộp thư 1-1] Kính gửi Thầy Cấn Văn Trường - Hỗ trợ tùy chỉnh Khung ma trận đề kiểm tra',
    content: 'Kính chào Thầy Cấn Văn Trường! Tôi là giáo viên dạy Toán tại Hà Nội, xin Thầy hướng dẫn cách thêm định dạng bảng ma trận đặc tả theo chuẩn mới nhất của Sở GD&ĐT Hà Nội vào giáo án cá nhân. Cảm ơn Thầy rất nhiều!',
    authorName: 'Cô Hoàng Thu Thảo',
    authorSchool: 'Trường THCS Thăng Long, Hà Nội',
    authorAvatar: '',
    authorDeviceId: 'PKK-DEMO-TEACHER',
    isAdmin: false,
    isVip: true,
    isPrivateToAdmin: true,
    status: 'approved',
    category: 'exam_matrix',
    likesCount: 5,
    likedByDevices: ['PKK-ADMIN'],
    isPinned: false,
    comments: [
      {
        id: 'c-admin-reply-1',
        authorName: 'Thầy Cấn Văn Trường (Admin)',
        authorSchool: 'Trường THCS Phùng Khắc Khoan, Hà Nội',
        content: 'Chào Cô Thảo! Thầy đã cập nhật sẵn mẫu ma trận đặc tả chuẩn Sở GD&ĐT Hà Nội và Bộ GD&ĐT tại Tab 2 (Tạo Đề & Ma Trận). Khi xuất Word, bảng sẽ tự động căn chuẩn A4 và có bảng đáp án trắc nghiệm tô tròn. Cô có thể nhắn tin trực tiếp tại đây bất cứ lúc nào nhé!',
        createdAt: 'Vừa xong',
        isAdmin: true,
        isVip: true
      }
    ],
    createdAt: 'Hôm nay lúc 08:00'
  }
];

export const getDeletedPostIds = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_POSTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
};

/**
 * Fetch messages from local cache or Firestore
 */
export const getCachedForumMessages = (): ForumMessageItem[] => {
  const deletedIds = new Set(getDeletedPostIds());
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FORUM_POSTS);
    if (raw) {
      const parsed: ForumMessageItem[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((p) => !deletedIds.has(p.id));
      }
    }
  } catch (e) {}
  return SEED_FORUM_MESSAGES.filter((p) => !deletedIds.has(p.id));
};

/**
 * Realtime listener for Forum Messages
 */
export const subscribeToForumMessages = (
  onUpdate: (messages: ForumMessageItem[]) => void,
  currentDeviceId: string,
  isAdmin: boolean
) => {
  // Emit cache first
  const initialList = getCachedForumMessages();
  onUpdate(filterAccessibleMessages(initialList, currentDeviceId, isAdmin));

  try {
    const forumCol = collection(db, 'forum_posts');
    const q = query(forumCol, limit(100));

    return onSnapshot(
      q,
      (snapshot) => {
        const deletedIds = new Set(getDeletedPostIds());
        if (!snapshot.empty) {
          const list: ForumMessageItem[] = [];
          snapshot.forEach((docSnap) => {
            if (!deletedIds.has(docSnap.id)) {
              list.push({ id: docSnap.id, ...(docSnap.data() as any) });
            }
          });

          // Merge with seeded posts if needed
          const combinedMap = new Map<string, ForumMessageItem>();
          list.forEach((item) => {
            if (!deletedIds.has(item.id)) combinedMap.set(item.id, item);
          });
          SEED_FORUM_MESSAGES.forEach((item) => {
            if (!deletedIds.has(item.id) && !combinedMap.has(item.id)) combinedMap.set(item.id, item);
          });
          const fullList = Array.from(combinedMap.values());

          // Sort: Pinned posts first, then newest timestamp/id first
          fullList.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            const timeA = (a as any).timestamp || (a.id.startsWith('post_') ? parseInt(a.id.split('_')[1], 10) : 0);
            const timeB = (b as any).timestamp || (b.id.startsWith('post_') ? parseInt(b.id.split('_')[1], 10) : 0);
            return timeB - timeA;
          });

          try {
            localStorage.setItem(STORAGE_KEY_FORUM_POSTS, JSON.stringify(fullList));
          } catch (e) {}

          onUpdate(filterAccessibleMessages(fullList, currentDeviceId, isAdmin));
        } else {
          // Keep local seeds without spamming remote Firestore writes
          onUpdate(filterAccessibleMessages(SEED_FORUM_MESSAGES.filter(p => !deletedIds.has(p.id)), currentDeviceId, isAdmin));
        }
      },
      (err) => {
        checkAndHandleFirestoreError(err);
      }
    );
  } catch (e) {
    return () => {};
  }
};

/**
 * Filter messages based on privacy and approval status
 */
export const filterAccessibleMessages = (
  messages: ForumMessageItem[],
  currentDeviceId: string,
  isAdmin: boolean
): ForumMessageItem[] => {
  return messages.filter((msg) => {
    // Admin sees everything (including pending and rejected)
    if (isAdmin) return true;

    // Post Author can always see their own posts and private messages
    if (msg.authorDeviceId && msg.authorDeviceId === currentDeviceId) return true;

    // Allow seed sample demo private message for previewing 1-1 chat features
    if (msg.isPrivateToAdmin && msg.id.startsWith('seed-private')) return true;

    // Normal users cannot see other people's private messages
    if (msg.isPrivateToAdmin) return false;

    // Normal users only see approved posts (or legacy posts without status)
    if (msg.status && msg.status !== 'approved') return false;

    return true;
  });
};

/**
 * Deeply clean an object for Firestore by removing any keys with `undefined` values
 */
export function cleanFirestoreObject<T extends Record<string, any>>(obj: T): T {
  const clean: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        clean[key] = cleanFirestoreObject(val);
      } else if (Array.isArray(val)) {
        clean[key] = val.map(item => (typeof item === 'object' && item !== null ? cleanFirestoreObject(item) : item));
      } else {
        clean[key] = val;
      }
    }
  }
  return clean as T;
}

/**
 * Post a new message to the Forum
 */
export const addForumMessage = async (
  message: Omit<ForumMessageItem, 'id' | 'createdAt' | 'likesCount' | 'likedByDevices' | 'comments'>
): Promise<ForumMessageItem> => {
  const newId = 'post_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const fullMessage: ForumMessageItem = {
    ...message,
    id: newId,
    imageUrl: message.imageUrl || '',
    authorAvatar: message.authorAvatar || '',
    status: (message.isAdmin || message.isPrivateToAdmin) ? 'approved' : 'pending', // Admin posts & private messages are active immediately
    likesCount: 0,
    likedByDevices: [],
    comments: [],
    createdAt: new Date().toLocaleString('vi-VN'),
    timestamp: Date.now()
  } as any;

  // 1. Update local cache
  const cached = getCachedForumMessages();
  const updated = [fullMessage, ...cached];
  try {
    localStorage.setItem(STORAGE_KEY_FORUM_POSTS, JSON.stringify(updated));
  } catch (e) {}

  // 2. Sync with Cloud Firestore (sanitized to prevent undefined field errors)
  if (!isFirestoreQuotaExceeded()) {
    try {
      const cleanData = cleanFirestoreObject(fullMessage);
      await setDoc(doc(db, 'forum_posts', newId), cleanData);
    } catch (e) {
      checkAndHandleFirestoreError(e);
    }
  }

  return fullMessage;
};

/**
 * Update an existing forum post
 */
export const updateForumMessage = async (
  messageId: string,
  updates: Partial<ForumMessageItem>
): Promise<void> => {
  const cached = getCachedForumMessages();
  const targetIndex = cached.findIndex((m) => m.id === messageId);
  if (targetIndex !== -1) {
    cached[targetIndex] = { ...cached[targetIndex], ...updates };
    try {
      localStorage.setItem(STORAGE_KEY_FORUM_POSTS, JSON.stringify(cached));
    } catch (e) {}
  }

  if (!isFirestoreQuotaExceeded()) {
    try {
      const docRef = doc(db, 'forum_posts', messageId);
      const cleanUpdates = cleanFirestoreObject(updates);
      await updateDoc(docRef, cleanUpdates);
    } catch (e) {
      checkAndHandleFirestoreError(e);
    }
  }
};

/**
 * Approve or Reject a forum post (Admin only)
 */
export const approveForumMessage = async (
  messageId: string,
  status: 'approved' | 'rejected'
): Promise<void> => {
  await updateForumMessage(messageId, { status });
};


/**
 * Add a comment to an existing forum message
 */
export const addForumComment = async (
  messageId: string,
  comment: Omit<ForumCommentItem, 'id' | 'createdAt'>
): Promise<void> => {
  const newComment: ForumCommentItem = {
    ...comment,
    imageUrl: comment.imageUrl || '',
    authorAvatar: comment.authorAvatar || '',
    id: 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
    createdAt: new Date().toLocaleString('vi-VN')
  };

  const cached = getCachedForumMessages();
  const target = cached.find((m) => m.id === messageId);
  if (target) {
    target.comments = [...(target.comments || []), newComment];
    try {
      localStorage.setItem(STORAGE_KEY_FORUM_POSTS, JSON.stringify(cached));
    } catch (e) {}
  }

  if (!isFirestoreQuotaExceeded()) {
    try {
      const docRef = doc(db, 'forum_posts', messageId);
      const cleanComments = (target ? target.comments : [newComment]).map(c => cleanFirestoreObject(c));
      await updateDoc(docRef, {
        comments: cleanComments
      });
    } catch (e) {
      checkAndHandleFirestoreError(e);
    }
  }
};

/**
 * Toggle like on a message
 */
export const toggleLikeForumMessage = async (
  messageId: string,
  deviceId: string
): Promise<void> => {
  const cached = getCachedForumMessages();
  const target = cached.find((m) => m.id === messageId);
  if (!target) return;

  const likedList = target.likedByDevices || [];
  const alreadyLiked = likedList.includes(deviceId);

  if (alreadyLiked) {
    target.likedByDevices = likedList.filter((id) => id !== deviceId);
    target.likesCount = Math.max(0, (target.likesCount || 1) - 1);
  } else {
    target.likedByDevices = [...likedList, deviceId];
    target.likesCount = (target.likesCount || 0) + 1;
  }

  try {
    localStorage.setItem(STORAGE_KEY_FORUM_POSTS, JSON.stringify(cached));
  } catch (e) {}

  if (!isFirestoreQuotaExceeded()) {
    try {
      const docRef = doc(db, 'forum_posts', messageId);
      await updateDoc(docRef, {
        likesCount: target.likesCount,
        likedByDevices: target.likedByDevices
      });
    } catch (e) {
      checkAndHandleFirestoreError(e);
    }
  }
};

/**
 * Admin reply to a message
 */
export const replyAsAdminToMessage = async (
  messageId: string,
  replyText: string
): Promise<void> => {
  const cached = getCachedForumMessages();
  const target = cached.find((m) => m.id === messageId);
  if (target) {
    target.adminResponse = replyText;
    target.adminResponseAt = new Date().toLocaleString('vi-VN');
    try {
      localStorage.setItem(STORAGE_KEY_FORUM_POSTS, JSON.stringify(cached));
    } catch (e) {}
  }

  if (!isFirestoreQuotaExceeded()) {
    try {
      const docRef = doc(db, 'forum_posts', messageId);
      await updateDoc(docRef, {
        adminResponse: replyText,
        adminResponseAt: new Date().toLocaleString('vi-VN')
      });
    } catch (e) {
      checkAndHandleFirestoreError(e);
    }
  }
};

/**
 * Delete a forum post (Only for Admin or Post Author, supports deleting seed & AI posts)
 */
export const deleteForumMessage = async (messageId: string): Promise<void> => {
  // 1. Record in permanently deleted IDs set
  const deletedIds = getDeletedPostIds();
  if (!deletedIds.includes(messageId)) {
    deletedIds.push(messageId);
    try {
      localStorage.setItem(STORAGE_KEY_DELETED_POSTS, JSON.stringify(deletedIds));
    } catch (e) {}
  }

  // 2. Remove from local cache
  const cached = getCachedForumMessages();
  const updated = cached.filter((m) => m.id !== messageId);
  try {
    localStorage.setItem(STORAGE_KEY_FORUM_POSTS, JSON.stringify(updated));
  } catch (e) {}

  // 3. Delete from Firestore if exists
  if (!isFirestoreQuotaExceeded()) {
    try {
      await deleteDoc(doc(db, 'forum_posts', messageId));
    } catch (e) {
      checkAndHandleFirestoreError(e);
    }
  }
};

/**
 * Delete a single comment from a forum post
 */
export const deleteForumComment = async (postId: string, commentId: string): Promise<void> => {
  const cached = getCachedForumMessages();
  const target = cached.find((m) => m.id === postId);
  if (target && target.comments) {
    target.comments = target.comments.filter((c) => c.id !== commentId);
    try {
      localStorage.setItem(STORAGE_KEY_FORUM_POSTS, JSON.stringify(cached));
    } catch (e) {}

    try {
      const docRef = doc(db, 'forum_posts', postId);
      await updateDoc(docRef, {
        comments: target.comments
      });
    } catch (e) {
      console.warn('Firestore delete comment warning:', e);
    }
  }
};

/**
 * Plays a pleasant web audio chime notification
 */
export const playNotificationChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {}
};



