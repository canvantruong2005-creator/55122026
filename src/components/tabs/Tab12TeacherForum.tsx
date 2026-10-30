import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Lock,
  Globe,
  Heart,
  MessageCircle,
  Pin,
  ShieldCheck,
  Award,
  Sparkles,
  User,
  School,
  Edit3,
  Camera,
  Trash2,
  Reply,
  CheckCircle2,
  HelpCircle,
  Filter,
  Search,
  BookOpen,
  Phone,
  Mail,
  MapPin,
  Flame,
  Check,
  XCircle,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  Upload,
  X,
  Maximize2,
  RefreshCw
} from 'lucide-react';
import { OnlineTeacherPresence, ForumMessageItem, ForumCommentItem, TeacherProfile } from '../../types';
import {
  initPresenceHeartbeat,
  subscribeToOnlinePresences,
  sendPresenceHeartbeat
} from '../../lib/presenceService';
import {
  subscribeToForumMessages,
  addForumMessage,
  updateForumMessage,
  approveForumMessage,
  addForumComment,
  toggleLikeForumMessage,
  replyAsAdminToMessage,
  deleteForumMessage,
  deleteForumComment,
  playNotificationChime
} from '../../lib/forumService';
import {
  getCachedTeacherProfile,
  saveTeacherProfile,
  subscribeToTeacherProfile
} from '../../lib/teacherProfile';
import { getDeviceId } from '../../lib/licenseUtils';
import { processAndCompressImage } from '../../lib/adminConfig';

interface Tab12TeacherForumProps {
  onOpenLicenseModal?: () => void;
  onNavigateTab?: (tabNumber: number) => void;
}

export const Tab12TeacherForum: React.FC<Tab12TeacherForumProps> = ({
  onOpenLicenseModal,
  onNavigateTab
}) => {
  // Device & Profile State
  const [myDeviceId, setMyDeviceId] = useState<string>('');
  const [profile, setProfile] = useState<TeacherProfile>(getCachedTeacherProfile());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [editProfileData, setEditProfileData] = useState<TeacherProfile>(profile);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  // Real-time Nationwide Online Presence State
  const [onlinePresences, setOnlinePresences] = useState<OnlineTeacherPresence[]>([]);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState<boolean>(false);

  // Forum Messages State
  const [messages, setMessages] = useState<ForumMessageItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [adminStatusFilter, setAdminStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyPrivateAdmin, setOnlyPrivateAdmin] = useState<boolean>(false);
  const [forumMainTab, setForumMainTab] = useState<'public_forum' | 'private_chat'>('public_forum');
  const [toastNotification, setToastNotification] = useState<{ title: string; message: string } | null>(null);
  const isInitialLoadRef = useRef<boolean>(true);

  // New Post Form State
  const [isNewPostOpen, setIsNewPostOpen] = useState<boolean>(false);
  const [newPostTitle, setNewPostTitle] = useState<string>('');
  const [newPostContent, setNewPostContent] = useState<string>('');
  const [newPostImage, setNewPostImage] = useState<string>('');
  const [newPostCategory, setNewPostCategory] = useState<ForumMessageItem['category']>('general');
  const [isPrivateToAdmin, setIsPrivateToAdmin] = useState<boolean>(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState<boolean>(false);

  // Edit Post State
  const [editingPost, setEditingPost] = useState<ForumMessageItem | null>(null);
  const [editPostTitle, setEditPostTitle] = useState<string>('');
  const [editPostContent, setEditPostContent] = useState<string>('');
  const [editPostImage, setEditPostImage] = useState<string>('');
  const [editPostCategory, setEditPostCategory] = useState<ForumMessageItem['category']>('general');
  const [editPostPinned, setEditPostPinned] = useState<boolean>(false);
  const [isSavingEditPost, setIsSavingEditPost] = useState<boolean>(false);

  // Active Comment Input & Image per Post
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [commentImages, setCommentImages] = useState<{ [postId: string]: string }>({});
  const [expandedComments, setExpandedComments] = useState<{ [postId: string]: boolean }>({});

  // Lightbox Zoom Image Modal
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Admin Reply Input per Post
  const [adminReplyInputs, setAdminReplyInputs] = useState<{ [postId: string]: string }>({});
  const [replyingAdminPostId, setReplyingAdminPostId] = useState<string | null>(null);

  // Refs for file inputs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const postImageInputRef = useRef<HTMLInputElement>(null);
  const editPostImageInputRef = useRef<HTMLInputElement>(null);
  const commentImageInputRefs = useRef<{ [postId: string]: HTMLInputElement | null }>({});

  // Initialize
  useEffect(() => {
    const devId = getDeviceId();
    setMyDeviceId(devId);

    // Subscribe to profile changes
    const unsubProfile = subscribeToTeacherProfile((newProf) => {
      setProfile(newProf);
      setEditProfileData(newProf);
    });

    // Subscribe to forum messages
    const unsubForum = subscribeToForumMessages(
      (newMsgs) => {
        // Notification check
        if (!isInitialLoadRef.current && newMsgs.length > 0) {
          const latest = newMsgs[0];
          if (latest && latest.isPrivateToAdmin) {
            if (profile.isAdmin && latest.authorDeviceId !== devId) {
              playNotificationChime();
              setToastNotification({
                title: '🔔 Tin Nhắn Riêng Mới Từ Giáo Viên',
                message: `${latest.authorName} (${latest.authorSchool || 'Trường THCS'}): "${latest.title || latest.content.slice(0, 50)}"`
              });
            } else if (!profile.isAdmin && (latest.adminResponse || latest.authorDeviceId === devId)) {
              if (latest.adminResponse) {
                playNotificationChime();
                setToastNotification({
                  title: '🔔 Phản Hồi Từ Admin Thầy Cấn Văn Trường',
                  message: `Thầy Cấn Văn Trường đã phản hồi: "${latest.adminResponse.slice(0, 60)}..."`
                });
              }
            }
          }
        }
        isInitialLoadRef.current = false;
        setMessages(newMsgs);
      },
      devId,
      profile.isAdmin || false
    );

    // Subscribe to realtime online teacher presences nationwide
    const unsubPresence = subscribeToOnlinePresences((list) => {
      setOnlinePresences(list);
    });

    const unsubHeartbeat = initPresenceHeartbeat(profile, () => 'Tab 12: Diễn đàn Sư phạm');

    return () => {
      unsubProfile?.();
      unsubForum?.();
      unsubPresence?.();
      unsubHeartbeat?.();
    };
  }, [profile.isAdmin]);

  // Handle Avatar Change via File
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Vui lòng chọn ảnh đại diện có dung lượng dưới 2MB!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setEditProfileData((prev) => ({ ...prev, avatarUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  // Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await saveTeacherProfile(editProfileData);
      setProfile(editProfileData);
      setIsProfileModalOpen(false);
      alert('✓ Đã cập nhật thành công thông tin cá nhân và đơn vị công tác!');
    } catch (err: any) {
      alert('Lỗi lưu thông tin: ' + (err?.message || String(err)));
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Post Image File Upload (New Post)
  const handlePostImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await processAndCompressImage(file, 900, 0.85);
      setNewPostImage(compressed);
    } catch (err: any) {
      alert('Lỗi xử lý ảnh: ' + (err?.message || err));
    }
  };

  // Handle Edit Post Image File Upload
  const handleEditPostImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await processAndCompressImage(file, 900, 0.85);
      setEditPostImage(compressed);
    } catch (err: any) {
      alert('Lỗi xử lý ảnh: ' + (err?.message || err));
    }
  };

  // Handle Comment Image File Upload
  const handleCommentImageFile = async (postId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await processAndCompressImage(file, 800, 0.82);
      setCommentImages(prev => ({ ...prev, [postId]: compressed }));
    } catch (err: any) {
      alert('Lỗi xử lý ảnh: ' + (err?.message || err));
    }
  };

  // Submit New Post
  const handleSubmitNewPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết/tin nhắn!');
      return;
    }

    setIsSubmittingPost(true);
    try {
      const createdMsg = await addForumMessage({
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
        imageUrl: newPostImage || undefined,
        authorName: profile.name || 'Thầy/Cô Giáo',
        authorSchool: profile.school || 'Trường THCS',
        authorAvatar: profile.avatarUrl || '',
        authorDeviceId: myDeviceId,
        isAdmin: !!profile.isAdmin,
        isVip: !!profile.isVip,
        isPrivateToAdmin: isPrivateToAdmin,
        category: newPostCategory,
        isPinned: false
      });

      // Instantly prepend to local state for zero-latency feedback
      setMessages((prev) => [createdMsg, ...prev.filter((m) => m.id !== createdMsg.id)]);

      const wasPrivate = isPrivateToAdmin;
      setNewPostTitle('');
      setNewPostContent('');
      setNewPostImage('');
      setIsPrivateToAdmin(false);
      setIsNewPostOpen(false);

      if (wasPrivate) {
        setForumMainTab('private_chat');
        setOnlyPrivateAdmin(true);
        alert('✓ Đã gửi tin nhắn riêng cho Admin (Thầy Cấn Văn Trường)! Thầy/Cô có thể theo dõi và nhận phản hồi trực tiếp ngay tại đây.');
      } else if (profile.isAdmin) {
        setForumMainTab('public_forum');
        setOnlyPrivateAdmin(false);
        alert('✓ Đã đăng bài chia sẻ công khai lên Diễn đàn Giáo viên!');
      } else {
        setForumMainTab('public_forum');
        setOnlyPrivateAdmin(false);
        alert('✓ Đã gửi bài viết lên Diễn đàn! Bài viết đã chuyển đến Admin (Thầy Cấn Văn Trường) duyệt và đang hiển thị trạng thái "Chờ Admin duyệt" ở đầu danh sách của Thầy/Cô.');
      }
    } catch (err: any) {
      alert('Lỗi đăng bài: ' + (err?.message || String(err)));
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Open Edit Post
  const handleOpenEditPost = (msg: ForumMessageItem) => {
    if (!profile.isAdmin) {
      alert('Chức năng sửa bài đăng chỉ dành riêng cho tài khoản Admin Thầy Cấn Văn Trường!');
      return;
    }
    setEditingPost(msg);
    setEditPostTitle(msg.title);
    setEditPostContent(msg.content);
    setEditPostImage(msg.imageUrl || '');
    setEditPostCategory(msg.category || 'general');
    setEditPostPinned(!!msg.isPinned);
  };

  // Save Edit Post
  const handleSaveEditPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.isAdmin) {
      alert('Chức năng sửa bài đăng chỉ dành riêng cho tài khoản Admin Thầy Cấn Văn Trường!');
      return;
    }
    if (!editingPost || !editPostTitle.trim() || !editPostContent.trim()) return;

    setIsSavingEditPost(true);
    try {
      await updateForumMessage(editingPost.id, {
        title: editPostTitle.trim(),
        content: editPostContent.trim(),
        imageUrl: editPostImage || undefined,
        category: editPostCategory,
        isPinned: profile.isAdmin ? editPostPinned : editingPost.isPinned
      });
      setEditingPost(null);
      alert('✓ Đã cập nhật bài viết thành công!');
    } catch (err: any) {
      alert('Lỗi cập nhật: ' + (err?.message || String(err)));
    } finally {
      setIsSavingEditPost(false);
    }
  };

  // Handle Admin Approval / Rejection
  const handleApproveStatus = async (postId: string, status: 'approved' | 'rejected') => {
    try {
      await approveForumMessage(postId, status);
      alert(status === 'approved' ? '✓ Đã phê duyệt bài viết công khai!' : '✓ Đã từ chối bài viết.');
    } catch (err: any) {
      alert('Lỗi phê duyệt: ' + (err?.message || String(err)));
    }
  };

  // Handle Like
  const handleToggleLike = async (postId: string) => {
    await toggleLikeForumMessage(postId, myDeviceId);
  };

  // Handle Comment Submit
  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    const img = commentImages[postId];
    if (!text && !img) return;

    await addForumComment(postId, {
      authorName: profile.name || 'Thầy/Cô Giáo',
      authorSchool: profile.school || 'Trường THCS',
      authorAvatar: profile.avatarUrl || '',
      authorDeviceId: myDeviceId,
      content: text || (img ? '📷 Đã gửi một hình ảnh' : ''),
      imageUrl: img || undefined,
      isVip: !!profile.isVip,
      isAdmin: !!profile.isAdmin
    });

    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    setCommentImages((prev) => {
      const next = { ...prev };
      delete next[postId];
      return next;
    });
    setExpandedComments((prev) => ({ ...prev, [postId]: true }));
  };

  // Handle Admin Reply
  const handleAdminReplySubmit = async (postId: string) => {
    const text = adminReplyInputs[postId]?.trim();
    if (!text) return;

    await replyAsAdminToMessage(postId, text);
    setAdminReplyInputs((prev) => ({ ...prev, [postId]: '' }));
    setReplyingAdminPostId(null);
    alert('✓ Đã phản hồi tin nhắn với tư cách Ban Quản Trị / Admin!');
  };

  // Handle Delete
  const handleDeletePost = async (postId: string) => {
    if (!profile.isAdmin) {
      alert('Chức năng xóa bài đăng chỉ dành riêng cho tài khoản Admin Thầy Cấn Văn Trường!');
      return;
    }
    try {
      setMessages((prev) => prev.filter((m) => m.id !== postId));
      await deleteForumMessage(postId);
    } catch (e) {
      console.warn('Error deleting forum message:', e);
    }
  };

  // Handle Delete Comment
  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!profile.isAdmin) {
      alert('Chức năng xóa bình luận chỉ dành riêng cho tài khoản Admin Thầy Cấn Văn Trường!');
      return;
    }
    try {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === postId) {
            return {
              ...m,
              comments: (m.comments || []).filter((c) => c.id !== commentId)
            };
          }
          return m;
        })
      );
      await deleteForumComment(postId, commentId);
    } catch (e) {
      console.warn('Error deleting comment:', e);
    }
  };

  // Count pending posts for Admin
  const pendingCount = useMemo(() => {
    return messages.filter((m) => m.status === 'pending').length;
  }, [messages]);

  // Private messages list & count
  const privateMessages = useMemo(() => {
    return messages.filter((m) => m.isPrivateToAdmin);
  }, [messages]);

  // Filtered Messages
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      // 0. Forum View Mode: If public forum, hide private messages from feed unless specifically requested
      if (forumMainTab === 'public_forum' && msg.isPrivateToAdmin && !onlyPrivateAdmin) {
        return false;
      }

      // If private chat tab, ONLY show private 1-1 messages
      if (forumMainTab === 'private_chat') {
        if (!msg.isPrivateToAdmin) return false;
        
        // Search query within private messages
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = (msg.title || '').toLowerCase().includes(q);
          const matchContent = (msg.content || '').toLowerCase().includes(q);
          const matchAuthor = (msg.authorName || '').toLowerCase().includes(q);
          const matchSchool = (msg.authorSchool || '').toLowerCase().includes(q);
          return matchTitle || matchContent || matchAuthor || matchSchool;
        }
        return true;
      }

      // 1. Private to Admin toggle
      if (onlyPrivateAdmin && !msg.isPrivateToAdmin) return false;

      // 2. Admin Approval status filter (for admin mode)
      if (profile.isAdmin && adminStatusFilter !== 'all') {
        if (adminStatusFilter === 'pending' && msg.status !== 'pending') return false;
        if (adminStatusFilter === 'approved' && msg.status !== 'approved' && msg.status !== undefined) return false;
        if (adminStatusFilter === 'rejected' && msg.status !== 'rejected') return false;
      }

      // 3. Category filter (only in public forum)
      if (selectedCategory !== 'all' && msg.category !== selectedCategory) {
        return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (msg.title || '').toLowerCase().includes(q);
        const matchContent = (msg.content || '').toLowerCase().includes(q);
        const matchAuthor = (msg.authorName || '').toLowerCase().includes(q);
        const matchSchool = (msg.authorSchool || '').toLowerCase().includes(q);
        return matchTitle || matchContent || matchAuthor || matchSchool;
      }

      return true;
    });
  }, [messages, forumMainTab, selectedCategory, adminStatusFilter, searchQuery, onlyPrivateAdmin, profile.isAdmin]);


  return (
    <div className="space-y-6">
      {/* Toast Notification Alert */}
      {toastNotification && (
        <div className="fixed top-5 right-5 z-50 max-w-md bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 p-4 rounded-2xl shadow-2xl border-2 border-amber-300 flex items-start gap-3 animate-in slide-in-from-top-3">
          <div className="p-2 bg-slate-950 text-amber-300 rounded-xl font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-extrabold text-sm text-slate-950">{toastNotification.title}</h4>
            <p className="text-xs text-slate-900 font-semibold mt-0.5 leading-snug">{toastNotification.message}</p>
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="text-slate-900 hover:text-white p-1 font-bold text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Header Banner & Teacher Personalization Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-700/60 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 relative z-10">
          {/* Forum Title & Description */}
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span>DIỄN ĐÀN SƯ PHẠM & HỎI ĐÁP ADMIN</span>
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> Giao lưu Sư phạm Toàn quốc
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Diễn Đàn Giáo Viên & Trò Chuyện Trực Tuyến
            </h2>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Không gian chia sẻ kinh nghiệm giảng dạy, giao lưu giáo án 5512, ma trận đề thi phân hóa và trao đổi chuyên môn.
              Thầy/Cô có thể <strong>đăng bài công khai</strong> hoặc <strong>gửi tin nhắn riêng cho Admin (Thầy Cấn Văn Trường)</strong> để được hỗ trợ chuyên sâu!
            </p>
          </div>

          {/* Teacher Profile Widget (Personalization) */}
          <div className="bg-slate-950/90 border border-indigo-500/40 rounded-xl p-4 shadow-lg flex items-center gap-3.5 min-w-[320px] shrink-0">
            {/* Avatar */}
            <div className="relative shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-13 h-13 rounded-full object-cover border-2 border-amber-400 shadow"
                />
              ) : (
                <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold text-lg border-2 border-indigo-400 shadow">
                  {profile.name ? profile.name.charAt(0) : 'GV'}
                </div>
              )}
              {profile.isVip && (
                <div
                  className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 rounded-full p-0.5 shadow"
                  title="Tài khoản VIP Đã Kích Hoạt"
                >
                  <Award className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-white truncate">{profile.name}</h4>
                {profile.isAdmin && (
                  <span className="bg-rose-500/20 text-rose-300 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-rose-500/40 shrink-0">
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-[11px] text-amber-300 font-semibold truncate flex items-center gap-1 mt-0.5">
                <School className="w-3 h-3 shrink-0" />
                <span>{profile.school || 'Chưa cập nhật trường'}</span>
              </p>
              <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                <span>Mã máy: <span className="font-mono text-cyan-400">{myDeviceId.substring(0, 10)}</span></span>
                <button
                  onClick={() => {
                    setEditProfileData(profile);
                    setIsProfileModalOpen(true);
                  }}
                  className="text-indigo-300 hover:text-white font-bold flex items-center gap-1 hover:underline ml-2"
                >
                  <Edit3 className="w-3 h-3" /> Cá nhân hóa
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Bar */}
        <div className="mt-5 pt-4 border-t border-indigo-800/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setIsPrivateToAdmin(false);
                setIsNewPostOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <Edit3 className="w-4 h-4" />
              <span>✍️ Đăng Bài Lên Diễn Đàn</span>
            </button>

            <button
              onClick={() => {
                setIsPrivateToAdmin(true);
                setIsNewPostOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
            >
              <Lock className="w-4 h-4" />
              <span>🔒 Nhắn Tin Riêng Cho Admin (Thầy Trường)</span>
            </button>

            <button
              onClick={() => {
                setEditProfileData(profile);
                setIsProfileModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 transition-all"
            >
              <User className="w-4 h-4 text-cyan-400" />
              <span>Đổi Tên Đơn Vị / Ảnh Đại Diện</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsOnlineModalOpen(true)}
            className="flex items-center gap-2.5 text-xs bg-slate-950/80 hover:bg-slate-800 border border-emerald-500/40 hover:border-emerald-400 text-slate-300 px-3.5 py-1.5 rounded-xl transition-all shadow-md group cursor-pointer"
            title="Bấm để xem danh sách chi tiết các Thầy/Cô đang trực tuyến thật trên toàn quốc"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>
              Trực tuyến thật: <strong className="text-emerald-400 font-bold">{onlinePresences.length} Giáo viên</strong> trên toàn quốc
            </span>
            <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-mono group-hover:bg-emerald-900 transition-colors">
              Xem danh sách 👁️
            </span>
          </button>

        </div>
      </div>

      {/* Mode Selector Tabs (Diễn đàn Công khai vs Hộp thư Riêng với Admin) */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 border border-slate-800 p-2 rounded-2xl">
        <button
          onClick={() => {
            setForumMainTab('public_forum');
            setOnlyPrivateAdmin(false);
          }}
          className={`flex-1 min-w-[220px] py-3 px-5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            forumMainTab === 'public_forum'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>🌐 Diễn Đàn Sư Phạm Công Khai</span>
          <span className="bg-white/20 text-white text-[11px] px-2 py-0.5 rounded-full font-bold">
            {messages.filter(m => !m.isPrivateToAdmin).length} bài
          </span>
        </button>

        <button
          onClick={() => {
            setForumMainTab('private_chat');
            setOnlyPrivateAdmin(true);
          }}
          className={`flex-1 min-w-[220px] py-3 px-5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            forumMainTab === 'private_chat'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-950/60 text-amber-300/80 hover:text-amber-300 hover:bg-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>🔒 Hộp Thư Tin Nhắn Riêng (1-1 Admin & Giáo Viên)</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
            forumMainTab === 'private_chat' ? 'bg-slate-950 text-amber-300' : 'bg-amber-500/20 text-amber-300'
          }`}>
            {privateMessages.length} tin
          </span>
        </button>
      </div>

      {/* 2. New Post Form Modal / Drawer */}
      {isNewPostOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {isPrivateToAdmin ? (
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Lock className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    <Globe className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isPrivateToAdmin ? 'Gửi Tin Nhắn Riêng Cho Admin (Thầy Cấn Văn Trường)' : 'Đăng Bài Viết Mới Lên Diễn Đàn Sư Phạm'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isPrivateToAdmin
                      ? 'Nội dung này được bảo mật 100%, chỉ có Admin và bạn mới xem và phản hồi được.'
                      : 'Chia sẻ công khai với toàn thể cộng đồng giáo viên trên cả nước.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewPostOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitNewPost} className="space-y-4 text-xs">
              {/* Privacy Mode Switch */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPrivateToAdmin(false)}
                  className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                    !isPrivateToAdmin
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>Công khai Diễn đàn</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrivateToAdmin(true)}
                  className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                    isPrivateToAdmin
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>Tin nhắn riêng Admin</span>
                </button>
              </div>

              {/* Category */}
              {!isPrivateToAdmin && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Chủ đề thảo luận:</label>
                  <select
                    value={newPostCategory}
                    onChange={(e) => setNewPostCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 font-medium"
                  >
                    <option value="general">💬 Thảo luận & Giao lưu Sư phạm</option>
                    <option value="lesson_plan">📐 Kế hoạch bài dạy (Giáo án CV 5512 / 2345)</option>
                    <option value="exam_matrix">📝 Đề thi, Ma trận & Bản đặc tả</option>
                    <option value="ai_tips">🤖 Kinh nghiệm ứng dụng AI & Khung Năng lực Số</option>
                    <option value="qna">❓ Hỏi đáp Chuyên môn & Thắc mắc Kỹ thuật</option>
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isPrivateToAdmin ? 'Tiêu đề tin nhắn / Yêu cầu hỗ trợ:' : 'Tiêu đề bài viết:'}
                </label>
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder={
                    isPrivateToAdmin
                      ? 'Ví dụ: Thầy Trường ơi hỗ trợ giúp em bản quyền VIP / Hỏi về ma trận đề thi...'
                      : 'Ví dụ: Chia sẻ kinh nghiệm tạo phiếu trắc nghiệm ô tròn / Hỏi về tích hợp NLS...'
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-medium placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
                  required
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nội dung chi tiết:</label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  rows={5}
                  placeholder={
                    isPrivateToAdmin
                      ? 'Nhập câu hỏi, phản hồi, hoặc yêu cầu gửi riêng tới Thầy Cấn Văn Trường...'
                      : 'Nhập nội dung chia sẻ, câu hỏi hoặc kinh nghiệm dạy học của Thầy/Cô...'
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-normal placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none leading-relaxed"
                  required
                />
              </div>

              {/* Image Attachment (Post Image) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Đính kèm hình ảnh (Đề thi, hình học, ảnh bảng, giáo án...):</span>
                  </span>
                  {newPostImage && (
                    <button
                      type="button"
                      onClick={() => setNewPostImage('')}
                      className="text-[11px] text-rose-400 hover:underline flex items-center gap-0.5"
                    >
                      <X className="w-3 h-3" /> Gỡ ảnh
                    </button>
                  )}
                </label>

                <input
                  type="file"
                  ref={postImageInputRef}
                  onChange={handlePostImageFile}
                  accept="image/*"
                  className="hidden"
                />

                {newPostImage ? (
                  <div className="relative rounded-xl border border-slate-700 overflow-hidden bg-slate-950 group max-h-48 flex items-center justify-center">
                    <img
                      src={newPostImage}
                      alt="Attached preview"
                      className="max-h-48 w-auto object-contain rounded"
                    />
                    <button
                      type="button"
                      onClick={() => setNewPostImage('')}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600/90 text-white hover:bg-rose-500 shadow"
                      title="Xóa ảnh này"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => postImageInputRef.current?.click()}
                    className="w-full py-2.5 px-3 rounded-lg border border-dashed border-slate-700 hover:border-cyan-500 bg-slate-950/60 hover:bg-slate-950 text-slate-400 hover:text-cyan-300 flex items-center justify-center gap-2 transition-all text-xs"
                  >
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>Tải ảnh từ máy tính (Tự động nén chất lượng cao sắc nét)</span>
                  </button>
                )}
              </div>

              {/* Author Preview Badge */}
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span>Người gửi:</span>
                  <strong className="text-white">{profile.name}</strong>
                  <span>-</span>
                  <span className="text-amber-300">{profile.school}</span>
                </div>
                <span className="text-indigo-400 font-mono">Mã máy: {myDeviceId.substring(0, 8)}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewPostOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPost}
                  className={`px-5 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all ${
                    isPrivateToAdmin
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmittingPost ? 'Đang gửi...' : isPrivateToAdmin ? 'Gửi Riêng Cho Admin' : 'Đăng Bài Ngay'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Personalization Modal (Tên đơn vị, Avatar, Môn học) */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Cá Nhân Hóa Hồ Sơ Giáo Viên</h3>
                  <p className="text-xs text-slate-400">Hiển thị tên trường đơn vị & ảnh đại diện theo mã máy riêng</p>
                </div>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {/* Avatar Section */}
              <div className="flex flex-col items-center justify-center gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="relative">
                  {editProfileData.avatarUrl ? (
                    <img
                      src={editProfileData.avatarUrl}
                      alt={editProfileData.name}
                      className="w-20 h-20 rounded-full object-cover border-2 border-amber-400 shadow"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl border-2 border-indigo-400 shadow">
                      {editProfileData.name ? editProfileData.name.charAt(0) : 'GV'}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 bg-amber-500 hover:bg-amber-400 text-slate-950 p-1.5 rounded-full shadow border border-slate-900"
                    title="Tải ảnh mới từ máy tính"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-center space-y-1">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="text-amber-300 hover:text-amber-200 font-bold text-xs underline"
                  >
                    Tải ảnh đại diện từ máy tính (.png, .jpg, .jpeg)
                  </button>
                  <p className="text-[10px] text-slate-500">Dung lượng tối đa 2MB. Ảnh sẽ được đồng bộ cùng mã máy.</p>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span>Họ và tên Giáo viên:</span>
                  {!profile.isAdmin && (
                    <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                      <Lock className="w-3 h-3 text-amber-400" />
                      Định danh theo Mã Bản quyền (Admin quản lý)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={editProfileData.name}
                  onChange={(e) => profile.isAdmin && setEditProfileData({ ...editProfileData, name: e.target.value })}
                  disabled={!profile.isAdmin}
                  placeholder="Họ và tên Giáo viên..."
                  className={`w-full border rounded-lg p-2.5 font-medium focus:outline-none ${
                    profile.isAdmin
                      ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-indigo-400'
                      : 'bg-slate-900/90 border-slate-800 text-slate-300 cursor-not-allowed select-none'
                  }`}
                  required
                />
                {!profile.isAdmin && (
                  <p className="text-[10px] text-slate-500 mt-1 italic">
                    * Họ tên được Admin Thầy Cấn Văn Trường cấp cố định theo máy. Để thay đổi, vui lòng liên hệ Admin qua Zalo: 0988.302.636.
                  </p>
                )}
              </div>

              {/* School / Unit Name */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span>Tên Đơn vị / Trường học:</span>
                  {!profile.isAdmin && (
                    <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                      <Lock className="w-3 h-3 text-amber-400" />
                      Đơn vị cố định
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={editProfileData.school}
                  onChange={(e) => profile.isAdmin && setEditProfileData({ ...editProfileData, school: e.target.value })}
                  disabled={!profile.isAdmin}
                  placeholder="Trường / Đơn vị công tác..."
                  className={`w-full border rounded-lg p-2.5 font-medium focus:outline-none ${
                    profile.isAdmin
                      ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-indigo-400'
                      : 'bg-slate-900/90 border-slate-800 text-slate-300 cursor-not-allowed select-none'
                  }`}
                  required
                />
              </div>

              {/* Province / Department */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tỉnh / Thành phố:</label>
                  <input
                    type="text"
                    value={editProfileData.province || ''}
                    onChange={(e) => setEditProfileData({ ...editProfileData, province: e.target.value })}
                    placeholder="Ví dụ: TP. Hà Nội"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-medium focus:border-indigo-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tổ chuyên môn:</label>
                  <input
                    type="text"
                    value={editProfileData.department || ''}
                    onChange={(e) => setEditProfileData({ ...editProfileData, department: e.target.value })}
                    placeholder="Ví dụ: Tổ Toán - Tin học"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-medium focus:border-indigo-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Subject & Grade */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Môn giảng dạy chính:</label>
                  <input
                    type="text"
                    value={editProfileData.subject || ''}
                    onChange={(e) => setEditProfileData({ ...editProfileData, subject: e.target.value })}
                    placeholder="Ví dụ: Toán học, KHTN, Ngữ văn..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-medium focus:border-indigo-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Khối lớp phụ trách:</label>
                  <input
                    type="text"
                    value={editProfileData.grade || ''}
                    onChange={(e) => setEditProfileData({ ...editProfileData, grade: e.target.value })}
                    placeholder="Ví dụ: Lớp 7, Lớp 9..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-medium focus:border-indigo-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Bound Device ID Display */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1 text-[11px]">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Mã thiết bị phần cứng (Hardware ID):</span>
                  <span className="font-mono text-cyan-400 font-bold">{myDeviceId}</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Mã máy này được sử dụng để cấp bản quyền VIP và bảo mật tin nhắn riêng với Admin.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSavingProfile ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3b. Edit Post Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Chỉnh Sửa Bài Viết</h3>
                  <p className="text-xs text-slate-400">Cập nhật tiêu đề, nội dung và chuyên mục bài đăng</p>
                </div>
              </div>
              <button
                onClick={() => setEditingPost(null)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditPost} className="space-y-4 text-xs">
              {/* Category */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Chủ đề thảo luận:</label>
                <select
                  value={editPostCategory}
                  onChange={(e) => setEditPostCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-medium focus:border-indigo-400 focus:outline-none"
                >
                  <option value="general">💬 Giao lưu Sư phạm & Kinh nghiệm Giảng dạy</option>
                  <option value="lesson_plan">📐 Kế hoạch Bài dạy (Giáo án CV 5512/2345)</option>
                  <option value="exam_matrix">📝 Đề kiểm tra, Ma trận & Phiếu tô trắc nghiệm</option>
                  <option value="ai_tips">🤖 Ứng dụng AI & Khung Năng lực Số (NLS)</option>
                  <option value="qna">❓ Hỏi đáp Chuyên môn & Thắc mắc Kỹ thuật</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tiêu đề bài viết:</label>
                <input
                  type="text"
                  value={editPostTitle}
                  onChange={(e) => setEditPostTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-medium focus:border-indigo-400 focus:outline-none"
                  required
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nội dung bài viết:</label>
                <textarea
                  value={editPostContent}
                  onChange={(e) => setEditPostContent(e.target.value)}
                  rows={5}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:border-indigo-400 focus:outline-none leading-relaxed"
                  required
                />
              </div>

              {/* Image Attachment (Edit Post) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Hình ảnh đính kèm bài viết:</span>
                  </span>
                  {editPostImage && (
                    <button
                      type="button"
                      onClick={() => setEditPostImage('')}
                      className="text-[11px] text-rose-400 hover:underline flex items-center gap-0.5"
                    >
                      <X className="w-3 h-3" /> Gỡ ảnh
                    </button>
                  )}
                </label>

                <input
                  type="file"
                  ref={editPostImageInputRef}
                  onChange={handleEditPostImageFile}
                  accept="image/*"
                  className="hidden"
                />

                {editPostImage ? (
                  <div className="relative rounded-xl border border-slate-700 overflow-hidden bg-slate-950 group max-h-48 flex items-center justify-center">
                    <img
                      src={editPostImage}
                      alt="Edit Attached preview"
                      className="max-h-48 w-auto object-contain rounded"
                    />
                    <button
                      type="button"
                      onClick={() => setEditPostImage('')}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600/90 text-white hover:bg-rose-500 shadow"
                      title="Xóa ảnh này"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => editPostImageInputRef.current?.click()}
                    className="w-full py-2.5 px-3 rounded-lg border border-dashed border-slate-700 hover:border-cyan-500 bg-slate-950/60 hover:bg-slate-950 text-slate-400 hover:text-cyan-300 flex items-center justify-center gap-2 transition-all text-xs"
                  >
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>Thêm ảnh mới cho bài viết</span>
                  </button>
                )}
              </div>

              {/* Pin option for Admin */}
              {profile.isAdmin && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="editPinned"
                    checked={editPostPinned}
                    onChange={(e) => setEditPostPinned(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <label htmlFor="editPinned" className="text-amber-300 font-bold cursor-pointer flex items-center gap-1">
                    <Pin className="w-3 h-3" /> Ghim bài viết này lên đầu trang
                  </label>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingEditPost}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSavingEditPost ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bài viết, tác giả, tên trường, nội dung thảo luận..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
            />
          </div>

          {/* Private Filter Toggle */}
          <button
            onClick={() => setOnlyPrivateAdmin(!onlyPrivateAdmin)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border shrink-0 ${
              onlyPrivateAdmin
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Chỉ xem tin nhắn riêng Admin</span>
          </button>
        </div>

        {/* Admin Moderation Tabs (Only for Admin) */}
        {profile.isAdmin && (
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-amber-500/30 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Quản lý Phê duyệt (Dành cho Admin):</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'pending', label: `⏳ Chờ duyệt (${pendingCount})` },
                { id: 'approved', label: '✓ Đã duyệt' },
                { id: 'rejected', label: '✕ Bị từ chối' }
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setAdminStatusFilter(st.id as any)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    adminStatusFilter === st.id
                      ? st.id === 'pending'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Categories Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {[
            { id: 'all', label: 'Tất cả bài viết' },
            { id: 'general', label: '💬 Giao lưu chung' },
            { id: 'lesson_plan', label: '📐 Giáo án 5512/2345' },
            { id: 'exam_matrix', label: '📝 Đề thi & Ma trận' },
            { id: 'ai_tips', label: '🤖 AI & Năng lực số' },
            { id: 'qna', label: '❓ Hỏi đáp chuyên môn' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white font-bold shadow'
                  : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Messages Feed List */}
      <div className="space-y-4">
        {/* If in Private Chat Mode: Show dedicated 1-1 Direct Conversation Banner & Quick Composer */}
        {forumMainTab === 'private_chat' && (
          <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/50 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-800/40 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-amber-200 flex items-center gap-2">
                    <span>Hộp Thư Tin Nhắn Riêng 1-1 (Giáo Viên ⟷ Admin Thầy Cấn Văn Trường)</span>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
                      Bảo Mật Tuyệt Đối
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {profile.isAdmin
                      ? '⚡ Đang ở chế độ Admin: Thầy có thể xem và phản hồi toàn bộ tin nhắn từ giáo viên trên cả nước.'
                      : 'Toàn bộ nội dung và phản hồi chỉ hiển thị giữa Thầy/Cô và Admin (Thầy Cấn Văn Trường).'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsPrivateToAdmin(true);
                  setIsNewPostOpen(true);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 shrink-0"
              >
                <Edit3 className="w-4 h-4" />
                <span>+ Gửi Tin Nhắn Mới Cho Admin</span>
              </button>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-3 border border-amber-500/30 text-xs text-amber-200/90 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Đang đồng bộ trực tuyến với ID Thiết bị: <strong className="font-mono text-cyan-300">{myDeviceId}</strong>
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Hotline/Zalo Admin: <strong className="text-amber-300">0988.302.636</strong>
              </span>
            </div>
          </div>
        )}

        {filteredMessages.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center space-y-3">
            <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">
              {forumMainTab === 'private_chat' ? 'Chưa có tin nhắn riêng nào' : 'Chưa có bài viết hoặc tin nhắn phù hợp'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {forumMainTab === 'private_chat'
                ? 'Hãy bấm nút "+ Gửi Tin Nhắn Mới Cho Admin" ở trên để gửi câu hỏi hoặc yêu cầu hỗ trợ chuyên sâu!'
                : 'Hãy là người đầu tiên đăng bài chia sẻ kinh nghiệm hoặc gửi tin nhắn riêng cho Admin (Thầy Cấn Văn Trường)!'}
            </p>
            <button
              onClick={() => {
                setIsPrivateToAdmin(forumMainTab === 'private_chat');
                setIsNewPostOpen(true);
              }}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow"
            >
              <Edit3 className="w-4 h-4" /> {forumMainTab === 'private_chat' ? 'Gửi Tin Nhắn Riêng' : 'Đăng Bài Ngay'}
            </button>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isLiked = msg.likedByDevices?.includes(myDeviceId);
            const isAuthor = msg.authorDeviceId === myDeviceId;
            const canEdit = Boolean(profile.isAdmin);
            const canDelete = Boolean(profile.isAdmin);

            return (
              <div
                key={msg.id}
                className={`bg-slate-900 border rounded-xl p-5 shadow-lg space-y-4 transition-all ${
                  msg.isPinned
                    ? 'border-amber-500/50 bg-gradient-to-b from-slate-900 to-amber-950/10'
                    : msg.status === 'pending'
                    ? 'border-amber-500/60 bg-amber-950/10'
                    : msg.status === 'rejected'
                    ? 'border-rose-900/60 bg-rose-950/10 opacity-75'
                    : msg.isPrivateToAdmin
                    ? 'border-amber-500/40 bg-slate-900/95'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header: Author + Badges + Date */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    {msg.authorAvatar ? (
                      <img
                        src={msg.authorAvatar}
                        alt={msg.authorName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-700 to-blue-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow">
                        {msg.authorName ? msg.authorName.charAt(0) : 'GV'}
                      </div>
                    )}

                    {/* Info */}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-white">{msg.authorName}</span>
                        {msg.isAdmin && (
                          <span className="bg-rose-500/20 text-rose-300 text-[10px] font-extrabold px-1.5 py-0.2 rounded border border-rose-500/40">
                            ADMIN (CHỦ NHIỆM)
                          </span>
                        )}
                        {msg.isVip && !msg.isAdmin && (
                          <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.2 rounded border border-amber-500/40">
                            VIP
                          </span>
                        )}
                        {msg.status === 'pending' && (
                          <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/50 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> Chờ Admin duyệt
                          </span>
                        )}
                        {msg.status === 'rejected' && (
                          <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-500/50 flex items-center gap-1">
                            <XCircle className="w-2.5 h-2.5" /> Bị từ chối
                          </span>
                        )}
                        {msg.isPinned && (
                          <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.2 rounded border border-amber-500/40 flex items-center gap-1">
                            <Pin className="w-2.5 h-2.5" /> Ghim
                          </span>
                        )}
                        {msg.isPrivateToAdmin && (
                          <span className="bg-amber-400 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                            <Lock className="w-2.5 h-2.5" /> Tin nhắn riêng cho Admin
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="text-amber-300/90 font-medium flex items-center gap-1">
                          <School className="w-3 h-3" />
                          <span>{msg.authorSchool}</span>
                        </span>
                        <span>•</span>
                        <span>{msg.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Right Actions (Edit & Delete) */}
                  <div className="flex items-center gap-1.5">
                    {canEdit && (
                      <button
                        onClick={() => handleOpenEditPost(msg)}
                        className="text-slate-400 hover:text-indigo-300 p-1 transition-colors"
                        title="Chỉnh sửa bài viết này"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDeletePost(msg.id)}
                        className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                        title="Xóa bài viết này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Admin Quick Approval Bar on Pending Post (Admin Only) */}
                {profile.isAdmin && msg.status === 'pending' && (
                  <div className="bg-amber-950/40 border border-amber-500/40 rounded-lg p-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      <span>Bài viết này đang chờ Admin duyệt để công khai:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveStatus(msg.id, 'approved')}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow"
                      >
                        <Check className="w-3.5 h-3.5" /> Phê duyệt đăng
                      </button>
                      <button
                        onClick={() => handleApproveStatus(msg.id, 'rejected')}
                        className="px-2.5 py-1 bg-rose-900 hover:bg-rose-800 text-rose-200 text-xs rounded-lg flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Từ chối
                      </button>
                    </div>
                  </div>
                )}


                {/* Post Title & Content */}
                <div className="space-y-2">
                  <h3 className="text-sm sm:text-base font-bold text-slate-100 leading-snug">
                    {msg.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {msg.content}
                  </p>

                  {/* Post Image Attachment */}
                  {msg.imageUrl && (
                    <div className="pt-2">
                      <div
                        onClick={() => setLightboxImage(msg.imageUrl || null)}
                        className="relative group cursor-pointer inline-block rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950/80 hover:border-cyan-500/80 transition-all shadow-md max-w-full sm:max-w-md"
                      >
                        <img
                          src={msg.imageUrl}
                          alt={msg.title}
                          className="max-h-72 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold backdrop-blur-[1px]">
                          <Maximize2 className="w-4 h-4 text-cyan-300" />
                          <span className="bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-700">Phóng to xem chi tiết</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Admin Official Response Box (If present) */}
                {msg.adminResponse && (
                  <div className="bg-gradient-to-r from-amber-950/40 to-slate-950 border border-amber-500/40 rounded-xl p-3.5 space-y-1.5 shadow-inner">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span>Phản hồi từ Admin (Thầy Cấn Văn Trường):</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{msg.adminResponseAt}</span>
                    </div>
                    <p className="text-xs text-amber-100/90 leading-relaxed pl-5 whitespace-pre-line">
                      {msg.adminResponse}
                    </p>
                  </div>
                )}

                {/* Admin Reply Action Form (Only for Admin) */}
                {profile.isAdmin && !msg.adminResponse && replyingAdminPostId === msg.id && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/50 space-y-2">
                    <label className="block text-xs font-bold text-amber-300">
                      Nhập phản hồi chính thức từ Admin:
                    </label>
                    <textarea
                      value={adminReplyInputs[msg.id] || ''}
                      onChange={(e) =>
                        setAdminReplyInputs((prev) => ({ ...prev, [msg.id]: e.target.value }))
                      }
                      rows={3}
                      placeholder="Chào Thầy/Cô, Admin xin phản hồi..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setReplyingAdminPostId(null)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={() => handleAdminReplySubmit(msg.id)}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow"
                      >
                        Gửi Phản Hồi Admin
                      </button>
                    </div>
                  </div>
                )}

                {/* Interaction Footer: Likes, Comments Count, Admin Reply Button */}
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
                  <div className="flex items-center gap-4">
                    {/* Like Button */}
                    <button
                      onClick={() => handleToggleLike(msg.id)}
                      className={`flex items-center gap-1.5 font-semibold transition-colors ${
                        isLiked ? 'text-rose-400' : 'text-slate-400 hover:text-rose-400'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-400' : ''}`} />
                      <span>{msg.likesCount || 0}</span>
                    </button>

                    {/* Comments Toggle */}
                    <button
                      onClick={() =>
                        setExpandedComments((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }))
                      }
                      className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-300 font-semibold transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{msg.comments?.length || 0} Bình luận</span>
                    </button>
                  </div>

                  {/* Admin Reply Trigger Button */}
                  {profile.isAdmin && !msg.adminResponse && replyingAdminPostId !== msg.id && (
                    <button
                      onClick={() => setReplyingAdminPostId(msg.id)}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold rounded-lg flex items-center gap-1"
                    >
                      <Reply className="w-3 h-3" /> Phản hồi với tư cách Admin
                    </button>
                  )}
                </div>

                {/* Comments Section (Collapsible) */}
                {expandedComments[msg.id] && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-3 bg-slate-950/60 p-3 rounded-xl">
                    {/* Existing Comments */}
                    {msg.comments && msg.comments.length > 0 ? (
                      <div className="space-y-2">
                        {msg.comments.map((comment) => (
                          <div key={comment.id} className="flex items-start gap-2.5 text-xs">
                            {comment.authorAvatar ? (
                              <img
                                src={comment.authorAvatar}
                                alt={comment.authorName}
                                className="w-7 h-7 rounded-full object-cover border border-slate-700 shrink-0 mt-0.5"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-[10px] shrink-0 mt-0.5">
                                {comment.authorName ? comment.authorName.charAt(0) : 'GV'}
                              </div>
                            )}

                            <div className="flex-1 bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-white text-[11px]">{comment.authorName}</span>
                                  {comment.isAdmin && (
                                    <span className="bg-rose-500/20 text-rose-300 text-[9px] font-extrabold px-1 rounded border border-rose-500/40">
                                      ADMIN
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400">({comment.authorSchool})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-500">{comment.createdAt}</span>
                                  {profile.isAdmin && (
                                    <button
                                      onClick={() => handleDeleteComment(msg.id, comment.id)}
                                      className="text-slate-500 hover:text-rose-400 p-0.5 transition-colors cursor-pointer"
                                      title="Xóa bình luận này (Quyền Admin)"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-slate-300 text-[11px] leading-relaxed">{comment.content}</p>

                              {/* Comment Image (If present) */}
                              {comment.imageUrl && (
                                <div className="pt-1">
                                  <div
                                    onClick={() => setLightboxImage(comment.imageUrl || null)}
                                    className="relative group cursor-pointer inline-block rounded-lg overflow-hidden border border-slate-700 bg-slate-950 max-w-xs hover:border-cyan-400 transition-all"
                                  >
                                    <img
                                      src={comment.imageUrl}
                                      alt="Bình luận kèm ảnh"
                                      className="max-h-40 w-auto object-contain transition-transform group-hover:scale-[1.02]"
                                    />
                                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px]">
                                      <Maximize2 className="w-3.5 h-3.5 text-cyan-300 mr-1" /> Phóng to
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">Chưa có bình luận nào. Hãy gửi lời trao đổi đầu tiên!</p>
                    )}

                    {/* Comment Image Preview if selected */}
                    {commentImages[msg.id] && (
                      <div className="relative inline-block border border-slate-700 rounded-lg p-1 bg-slate-900 group">
                        <img
                          src={commentImages[msg.id]}
                          alt="Comment attachment"
                          className="h-16 w-auto object-contain rounded"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setCommentImages((prev) => {
                              const next = { ...prev };
                              delete next[msg.id];
                              return next;
                            })
                          }
                          className="absolute -top-1 -right-1 p-0.5 rounded-full bg-rose-600 text-white hover:bg-rose-500 shadow"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* New Comment Input with Image Upload */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="file"
                        ref={(el) => {
                          commentImageInputRefs.current[msg.id] = el;
                        }}
                        onChange={(e) => handleCommentImageFile(msg.id, e)}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => commentImageInputRefs.current[msg.id]?.click()}
                        className={`p-2 rounded-lg border transition-all shrink-0 ${
                          commentImages[msg.id]
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border-slate-700'
                        }`}
                        title="Gửi kèm hình ảnh trong bình luận"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>

                      <input
                        type="text"
                        value={commentInputs[msg.id] || ''}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [msg.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddComment(msg.id);
                        }}
                        placeholder="Viết bình luận, phản hồi thảo luận..."
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-400"
                      />
                      <button
                        onClick={() => handleAddComment(msg.id)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow shrink-0"
                      >
                        <Send className="w-3 h-3" /> Gửi
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 6. Admin Contact Footer Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950/60 border border-indigo-700/50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white">Liên hệ Trực tiếp Chủ nhiệm Hệ thống: Thầy Cấn Văn Trường</h4>
            <p className="text-slate-400 text-[11px]">
              Trường THCS Phùng Khắc Khoan, TP. Hà Nội | Điện thoại/Zalo: <strong className="text-amber-300">0988.302.636</strong> | Email: <strong className="text-cyan-300">canvantruong2010@gmail.com</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsPrivateToAdmin(true);
              setIsNewPostOpen(true);
            }}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 shadow"
          >
            <Lock className="w-3.5 h-3.5" /> Gửi Tin Nhắn Riêng
          </button>
        </div>
      </div>

      {/* 7. Image Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-rose-400 p-2 text-sm font-bold flex items-center gap-1"
            >
              <X className="w-5 h-5" /> Đóng (ESC)
            </button>
            <img
              src={lightboxImage}
              alt="Full size preview"
              className="max-h-[85vh] max-w-full object-contain rounded-xl border border-slate-700 shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* 8. Real-time Nationwide Online Teachers Directory Modal */}
      {isOnlineModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-inner">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Thành Viên Trực Tuyến Trên Toàn Quốc</span>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
                      {onlinePresences.length} Đang Online
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Số liệu thực tế 100% được cập nhật qua heartbeat thời gian thực từ Cloud Firestore
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOnlineModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of active teachers */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 custom-scrollbar">
              {onlinePresences.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Đang quét dữ liệu kết nối trực tuyến từ các điểm cầu trên toàn quốc...
                </div>
              ) : (
                onlinePresences.map((teacher, idx) => {
                  const isMe = teacher.deviceId === myDeviceId;
                  return (
                    <div
                      key={teacher.deviceId || idx}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isMe
                          ? 'bg-gradient-to-r from-indigo-950/50 to-slate-900 border-indigo-500/60 shadow-md ring-1 ring-indigo-500/30'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          {teacher.avatarUrl ? (
                            <img
                              src={teacher.avatarUrl}
                              alt={teacher.teacherName}
                              className="w-11 h-11 rounded-full object-cover border-2 border-emerald-400/60 shadow"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-600 to-cyan-600 flex items-center justify-center text-white font-bold text-sm border-2 border-emerald-400/40 shadow">
                              {teacher.teacherName ? teacher.teacherName.charAt(0) : 'GV'}
                            </div>
                          )}
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse shadow" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                              {teacher.teacherName}
                            </h4>
                            {isMe && (
                              <span className="bg-indigo-500/30 text-indigo-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-indigo-500/50">
                                Chính bạn
                              </span>
                            )}
                            {teacher.isAdmin && (
                              <span className="bg-rose-500/20 text-rose-300 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-rose-500/40">
                                ADMIN
                              </span>
                            )}
                            {teacher.isVip && !teacher.isAdmin && (
                              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-500/40">
                                VIP
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-300 truncate flex items-center gap-1.5 mt-0.5">
                            <School className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{teacher.school || 'Trường THCS'}</span>
                            {teacher.province && (
                              <span className="text-slate-400">({teacher.province})</span>
                            )}
                          </p>

                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-1">
                            <span className="text-cyan-400 font-sans">{teacher.currentTab || 'Diễn đàn Sư phạm'}</span>
                            <span>•</span>
                            <span className="text-emerald-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                              Đang trực tuyến
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!isMe && (
                          <button
                            onClick={() => {
                              setIsOnlineModalOpen(false);
                              setIsPrivateToAdmin(true);
                              setIsNewPostOpen(true);
                              setNewPostTitle(`[Giao lưu] Gửi tới ${teacher.teacherName}`);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all hover:scale-105"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Nhắn tin</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Tự động cập nhật thời gian thực mỗi 25s</span>
              </span>
              <button
                onClick={() => setIsOnlineModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
