import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Sparkles,
  Download,
  Printer,
  FileText,
  CheckCircle2,
  Layers,
  Wand2,
  Cpu,
  HelpCircle,
  Key,
  ShieldCheck,
  Award,
  Video,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Check,
  Copy,
  Lightbulb,
  FileCheck,
  Camera,
  Music,
  Code,
  Calendar,
  Grid,
  FileDown,
  User,
  Upload,
  Save,
  Plus,
  RefreshCw,
  Trash2,
  PauseCircle,
  PlayCircle,
  Activity,
  Zap,
  Lock,
  Unlock,
  Phone,
  Mail,
  School,
  FolderOpen,
  Image as ImageIcon,
  AlertTriangle,
  AlertCircle,
  MessageSquare,
  FolderTree,
  Sliders,
  FileCode2,
  Terminal
} from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, Header, Footer, PageNumber, BorderStyle, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import {
  AdminProfile,
  SharedApiKey,
  DEFAULT_ADMIN_PROFILE,
  fetchAdminProfile,
  saveAdminProfileToFirestore,
  subscribeAdminProfile,
  fetchSharedApiKeys,
  saveSharedApiKeyToFirestore,
  bulkAddSharedApiKeys,
  deleteSharedApiKeyFromFirestore,
  subscribeSharedApiKeys,
  processAndCompressImage,
  DriveConfig,
  DEFAULT_DRIVE_CONFIG,
  DEFAULT_DRIVE_FOLDER_ID,
  fetchDriveConfig,
  saveDriveConfigToFirestore
} from '../../lib/adminConfig';
import { testGeminiApiKey } from '../../lib/geminiApi';
import { STORAGE_KEY_SAVED_LICENSE } from '../../lib/licenseUtils';
import { CommunityDriveModal } from '../CommunityDriveModal';

interface Tab10IntroductionProps {
  onNavigateTab?: (tabNumber: number) => void;
  onOpenLicenseModal?: () => void;
  onOpenApiGuide?: () => void;
}

export const Tab10Introduction: React.FC<Tab10IntroductionProps> = ({
  onNavigateTab,
  onOpenLicenseModal,
  onOpenApiGuide
}) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'features' | 'guide' | 'tips' | 'license' | 'author_admin' | 'gallery_templates'>('overview');
  const [selectedTemplateModal, setSelectedTemplateModal] = useState<any | null>(null);
  const [copiedZalo, setCopiedZalo] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);

  // Admin and Profile State
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(DEFAULT_ADMIN_PROFILE);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Shared API Keys State
  const [sharedKeys, setSharedKeys] = useState<SharedApiKey[]>([]);
  const [rawKeysInput, setRawKeysInput] = useState('');
  const [isAddingKeys, setIsAddingKeys] = useState(false);
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [keyActionMsg, setKeyActionMsg] = useState('');

  // Admin Auth Gate State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');

  // Drive Config State
  const [driveConfig, setDriveConfig] = useState<DriveConfig>(DEFAULT_DRIVE_CONFIG);
  const [isSavingDriveConfig, setIsSavingDriveConfig] = useState(false);
  const [driveSuccessMsg, setDriveSuccessMsg] = useState('');
  const [copiedScript, setCopiedScript] = useState(false);
  const [showDriveUploadModal, setShowDriveUploadModal] = useState(false);

  useEffect(() => {
    // Check if user is already admin
    try {
      const savedKey = localStorage.getItem(STORAGE_KEY_SAVED_LICENSE);
      if (savedKey && savedKey.trim().toUpperCase() === 'CANVANTRUONGVIP1990') {
        setIsAdminUnlocked(true);
      }
    } catch (e) {}

    // Load Admin Profile
    fetchAdminProfile().then(p => {
      if (p) setAdminProfile(p);
    });
    const unsubProfile = subscribeAdminProfile(p => {
      if (p) setAdminProfile(p);
    });

    // Load Shared API Keys
    fetchSharedApiKeys().then(keys => {
      if (keys) setSharedKeys(keys);
    });
    const unsubKeys = subscribeSharedApiKeys(keys => {
      if (keys) setSharedKeys(keys);
    });

    // Load Drive Config
    fetchDriveConfig().then(cfg => {
      if (cfg) setDriveConfig(cfg);
    });

    return () => {
      if (typeof unsubProfile === 'function') unsubProfile();
      if (typeof unsubKeys === 'function') unsubKeys();
    };
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError('');
    if (adminPassInput.trim().toUpperCase() === 'CANVANTRUONGVIP1990') {
      setIsAdminUnlocked(true);
      setAdminPassInput('');
    } else {
      setAdminAuthError('Mật khẩu / Khóa Admin không chính xác!');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedDataUrl = await processAndCompressImage(file, 600, 0.85);
      setAdminProfile(prev => ({ ...prev, photoUrl: compressedDataUrl }));
    } catch (err) {
      alert('Lỗi nén ảnh: ' + String(err));
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setProfileSuccessMsg('');
    try {
      await saveAdminProfileToFirestore(adminProfile);
      setProfileSuccessMsg('✅ Đã lưu hồ sơ và ảnh Admin thành công lên Cloud Firestore!');
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    } catch (err) {
      alert('Lỗi lưu thông tin: ' + String(err));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddSharedKeys = async () => {
    if (!rawKeysInput.trim()) {
      alert('Vui lòng dán ít nhất 1 API Key!');
      return;
    }
    setIsAddingKeys(true);
    setKeyActionMsg('');
    try {
      const count = await bulkAddSharedApiKeys(rawKeysInput, 'Key Dùng Chung');
      setKeyActionMsg(`🎉 Đã thêm thành công ${count} API Key vào kho dùng chung toàn hệ thống!`);
      setRawKeysInput('');
      const updated = await fetchSharedApiKeys();
      setSharedKeys(updated);
      setTimeout(() => setKeyActionMsg(''), 4000);
    } catch (err) {
      alert('Lỗi thêm API Keys: ' + String(err));
    } finally {
      setIsAddingKeys(false);
    }
  };

  const handleToggleKeyStatus = async (item: SharedApiKey) => {
    const nextStatus = item.status === 'active' ? 'paused' : 'active';
    const updated: SharedApiKey = { ...item, status: nextStatus, updatedAt: new Date().toLocaleString('vi-VN') };
    await saveSharedApiKeyToFirestore(updated);
    setSharedKeys(prev => prev.map(k => k.id === item.id ? updated : k));
  };

  const handleDeleteSharedKey = async (id: string) => {
    try {
      setSharedKeys(prev => prev.filter(k => k.id !== id));
      await deleteSharedApiKeyFromFirestore(id);
    } catch (err) {
      console.warn('Error deleting shared key:', err);
    }
  };

  const handleTestSharedKey = async (item: SharedApiKey) => {
    setTestingKeyId(item.id);
    try {
      const result = await testGeminiApiKey(item.key);
      const updated: SharedApiKey = {
        ...item,
        lastTestedAt: new Date().toLocaleString('vi-VN'),
        testStatus: result.valid ? 'valid' : 'invalid'
      };
      await saveSharedApiKeyToFirestore(updated);
      setSharedKeys(prev => prev.map(k => k.id === item.id ? updated : k));

      if (result.valid) {
        alert(`✅ Key [${item.label}] kết nối THÀNH CÔNG với model [${result.model}]!`);
      } else {
        alert(`❌ Key [${item.label}] KHÔNG kết nối được: ${result.error}`);
      }
    } catch (e: any) {
      alert('Lỗi kiểm tra key: ' + (e?.message || e));
    } finally {
      setTestingKeyId(null);
    }
  };

  const handleSaveDriveConfig = async () => {
    setIsSavingDriveConfig(true);
    setDriveSuccessMsg('');
    try {
      await saveDriveConfigToFirestore(driveConfig);
      setDriveSuccessMsg('✅ Đã lưu cấu hình Kho Google Drive thành công!');
      setTimeout(() => setDriveSuccessMsg(''), 4000);
    } catch (e: any) {
      alert('Lỗi lưu cấu hình Drive: ' + (e?.message || e));
    } finally {
      setIsSavingDriveConfig(false);
    }
  };

  const [isTestingDriveWebhook, setIsTestingDriveWebhook] = useState<boolean>(false);
  const [driveTestStatus, setDriveTestStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const handleTestAndInitDriveFolders = async () => {
    const webhook = driveConfig.webhookUrl?.trim();
    if (!webhook) {
      alert('Vui lòng nhập đường dẫn Webhook Google Apps Script trước khi kiểm tra!');
      return;
    }

    setIsTestingDriveWebhook(true);
    setDriveTestStatus(null);
    try {
      const response = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'create_all_folders' })
      });
      const result = await response.json();
      if (result && result.status === 'success') {
        setDriveTestStatus({
          success: true,
          message: result.message || 'Kết nối thành công! Đã tự động tạo cây thư mục chuẩn trên Google Drive!'
        });
      } else {
        setDriveTestStatus({
          success: false,
          message: result.message || 'Không thể tạo thư mục. Thầy/Cô vui lòng kiểm tra lại quyền Webhook (chọn Anyone) và tạo Phiên bản mới.'
        });
      }
    } catch (e: any) {
      setDriveTestStatus({
        success: false,
        message: 'Lỗi gửi yêu cầu đến Webhook. Lưu ý: Thầy/Cô cần mở Apps Script > Triển khai > Quản lý bản triển khai > Chỉnh sửa > Phiên bản MỚI > Triển khai.'
      });
    } finally {
      setIsTestingDriveWebhook(false);
    }
  };

  const APPS_SCRIPT_CODE = `/**
 * GOOGLE APPS SCRIPT - TỰ ĐỘNG PHÂN CHIA THƯ MỤC & KHO TÀI NGUYÊN
 * CHỦ NHIỆM: THẦY CẤN VĂN TRƯỜNG - THCS PHÙNG KHẮC KHOAN (0988.302.636)
 * FOLDER ID GỐC: 1dqJ4kXBc3zDnQPmddbAZY8rp-gHWegfL
 */
var FOLDER_ID = "1dqJ4kXBc3zDnQPmddbAZY8rp-gHWegfL";

// Hàm đệ quy tìm hoặc tự động tạo cây thư mục con phân cấp
function getOrCreateNestedFolder(rootFolder, folderPathArray) {
  var currentFolder = rootFolder;
  if (!folderPathArray) return currentFolder;

  var paths = [];
  if (Array.isArray(folderPathArray)) {
    paths = folderPathArray;
  } else if (typeof folderPathArray === 'string') {
    try {
      var parsed = JSON.parse(folderPathArray);
      if (Array.isArray(parsed)) paths = parsed;
      else paths = folderPathArray.split(/[\\/\\\\]+/);
    } catch(e) {
      paths = folderPathArray.split(/[\\/\\\\]+/);
    }
  }

  for (var i = 0; i < paths.length; i++) {
    var subName = String(paths[i] || '').trim();
    if (!subName) continue;

    var subFolders = currentFolder.getFoldersByName(subName);
    if (subFolders.hasNext()) {
      currentFolder = subFolders.next();
    } else {
      currentFolder = currentFolder.createFolder(subName);
    }
  }
  return currentFolder;
}

// Danh mục khởi tạo cây thư mục mặc định
function createStandardFolderTree(rootFolder) {
  var levels = [
    {
      name: "01. CẤP TIỂU HỌC (Lớp 1 - 5)",
      grades: ["Lớp 1", "Lớp 2", "Lớp 3", "Lớp 4", "Lớp 5"],
      subjects: ["Môn Toán", "Môn Tiếng Việt", "Môn Tự nhiên và Xã hội", "Môn Khoa học", "Môn Tiếng Anh", "Môn Tin học & Công nghệ"]
    },
    {
      name: "02. CẤP THCS (Lớp 6 - 9)",
      grades: ["Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9"],
      subjects: ["Môn Toán học", "Môn Ngữ văn", "Môn Khoa học tự nhiên", "Môn Tiếng Anh", "Môn Lịch sử & Địa lí", "Môn Tin học", "Môn GDCD", "Môn Công nghệ"]
    },
    {
      name: "03. CẤP THPT (Lớp 10 - 12)",
      grades: ["Lớp 10", "Lớp 11", "Lớp 12"],
      subjects: ["Môn Toán học", "Môn Ngữ văn", "Môn Vật lí", "Môn Hóa học", "Môn Sinh học", "Môn Tiếng Anh", "Môn Lịch sử", "Môn Địa lí", "Môn Tin học"]
    }
  ];

  var docTypes = [
    "1. Kế hoạch bài dạy (Giáo án CV 5512)",
    "2. Kế hoạch bài dạy Tiểu học (CV 2345)",
    "3. Đề kiểm tra & Ma trận đặc tả",
    "4. Đề thi trắc nghiệm & Đáp án",
    "5. Bài giảng điện tử & Trò chơi",
    "6. Sáng kiến kinh nghiệm & Chuyên đề",
    "7. Bồi dưỡng HSG & Phụ đạo"
  ];

  // 1. Tạo thư mục cấp học và văn bản chỉ đạo
  getOrCreateNestedFolder(rootFolder, ["04. VĂN BẢN & CHỈ ĐẠO BỘ GD&ĐT"]);
  getOrCreateNestedFolder(rootFolder, ["00. ĐÓNG GÓP MỚI CHỜ DUYỆT"]);

  for (var i = 0; i < levels.length; i++) {
    var lvl = levels[i];
    for (var g = 0; g < lvl.grades.length; g++) {
      var gr = lvl.grades[g];
      for (var s = 0; s < lvl.subjects.length; s++) {
        var sb = lvl.subjects[s];
        getOrCreateNestedFolder(rootFolder, [lvl.name, gr, sb, docTypes[0]]);
      }
    }
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Google Drive Webhook của Thầy Cấn Văn Trường đang hoạt động tốt!",
    folderId: FOLDER_ID
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : "";
    if (!rawData) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Không nhận được dữ liệu tải lên."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(rawData);
    var rootFolder = DriveApp.getFolderById(FOLDER_ID);

    // 1. Xử lý yêu cầu khởi tạo toàn bộ cây thư mục
    if (data.action === "create_all_folders" || data.action === "init_folders") {
      createStandardFolderTree(rootFolder);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Đã tự động khởi tạo toàn bộ cây thư mục phân cấp trên Google Drive thành công!",
        folderUrl: rootFolder.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var fileName = data.fileName || ("TaiLieu_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss") + ".docx");
    var fileBase64 = data.fileBase64;
    var authorName = data.authorName || "Giáo viên";
    var schoolName = data.schoolName || "";
    var subject = data.subject || "";
    var subSubject = data.subSubject || "";
    var grade = data.grade || "";
    var lessonPeriod = data.lessonPeriod || "";
    var lessonTitle = data.lessonTitle || "";
    var docTypeLabel = data.docTypeLabel || "Tài liệu chuyên môn";
    var note = data.note || "";
    var folderPaths = data.folderPaths;

    if (!fileBase64) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Thiếu dữ liệu tệp đính kèm."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Tự động phân tích thư mục nếu chưa có folderPaths
    if (!folderPaths || (Array.isArray(folderPaths) && folderPaths.length === 0)) {
      var levelName = "04. TÀI LIỆU CHUNG";
      var gNum = parseInt(String(grade).replace(/\\D/g, ""), 10);
      if (gNum >= 1 && gNum <= 5) levelName = "01. CẤP TIỂU HỌC (Lớp 1 - 5)";
      else if (gNum >= 6 && gNum <= 9) levelName = "02. CẤP THCS (Lớp 6 - 9)";
      else if (gNum >= 10 && gNum <= 12) levelName = "03. CẤP THPT (Lớp 10 - 12)";

      var gradeName = grade ? ("Lớp " + String(grade).replace(/\\D/g, "")) : "Lớp Khác";
      var subjName = subject ? ("Môn " + subject) : "Chung";
      var catName = docTypeLabel || "Tài liệu chuyên môn";
      folderPaths = [levelName, gradeName, subjName, catName];
    }

    // 2. Tìm hoặc tự động tạo cây thư mục con lồng nhau tương ứng
    var targetFolder = getOrCreateNestedFolder(rootFolder, folderPaths);

    // 3. Giải mã dữ liệu và tạo tệp Word / PDF / PPTX trong đúng thư mục con
    var decoded = Utilities.base64Decode(fileBase64);
    var contentType = "application/octet-stream";
    var lowerName = fileName.toLowerCase();
    if (lowerName.endsWith(".docx")) {
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else if (lowerName.endsWith(".doc")) {
      contentType = "application/msword";
    } else if (lowerName.endsWith(".pdf")) {
      contentType = "application/pdf";
    } else if (lowerName.endsWith(".pptx")) {
      contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    }

    var blob = Utilities.newBlob(decoded, contentType, fileName);
    var file = targetFolder.createFile(blob);

    // 4. Gắn thông tin mô tả chi tiết vào tệp
    var description = "★ TÀI LIỆU ĐÓNG GÓP KHO GOOGLE DRIVE THẦY CẤN VĂN TRƯỜNG\\n" +
                      "• Vị trí lưu: " + (Array.isArray(folderPaths) ? folderPaths.join(" > ") : folderPaths) + "\\n" +
                      "• Loại tài liệu: " + docTypeLabel + "\\n" +
                      "• Bài học / Tiêu đề: " + lessonTitle + "\\n" +
                      "• Môn học: " + subject + (subSubject ? (" (" + subSubject + ")") : "") + " | Lớp: " + grade + (lessonPeriod ? (" | " + lessonPeriod) : "") + "\\n" +
                      "• Tác giả / Người soạn: " + authorName + (schoolName ? (" - Đơn vị: " + schoolName) : "") + "\\n" +
                      "• Thời gian tải lên: " + Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss") + "\\n" +
                      (note ? ("• Ghi chú / Tóm tắt: " + note) : "");
    file.setDescription(description);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Đã lưu thành công tệp vào đúng thư mục: " + (Array.isArray(folderPaths) ? folderPaths.join(" > ") : folderPaths) + " trên Google Drive!",
      fileName: fileName,
      fileUrl: file.getUrl(),
      folderUrl: targetFolder.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Lỗi xử lý lưu Drive: " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const handleCopyAppsScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const maskKey = (raw: string): string => {
    if (!raw) return '';
    if (raw.length <= 12) return raw;
    return `${raw.slice(0, 8)}...${raw.slice(-6)}`;
  };

  const activeSharedCount = sharedKeys.filter(k => k.status === 'active').length;

  const handleCopyZalo = () => {
    navigator.clipboard.writeText('0988302636');
    setCopiedZalo(true);
    setTimeout(() => setCopiedZalo(false), 2000);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleExportWordGuide = async () => {
    setIsExportingWord(true);
    try {
      const borderNone = {
        top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        right: { style: BorderStyle.NONE, size: 0, color: 'auto' }
      };

      const borderThin = {
        top: { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' },
        left: { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' },
        right: { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' }
      };

      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                font: 'Times New Roman',
                size: 26 // 13pt
              },
              paragraph: {
                spacing: { line: 280, before: 60, after: 60 }
              }
            }
          }
        },
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 1134, // 2cm
                  bottom: 1134,
                  left: 1417, // 2.5cm
                  right: 1134 // 2cm
                }
              }
            },
            headers: {
              default: new Header({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      new TextRun({
                        text: 'Tài liệu Hướng dẫn Sử dụng - AI Lesson Planner Pro (Thầy Cấn Văn Trường)',
                        italics: true,
                        size: 18,
                        color: '6B7280'
                      })
                    ]
                  })
                ]
              })
            },
            footers: {
              default: new Footer({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ text: 'Trang ', size: 18, color: '6B7280' }),
                      new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '6B7280' }),
                      new TextRun({ text: ' / ', size: 18, color: '6B7280' }),
                      new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: '6B7280' })
                    ]
                  })
                ]
              })
            },
            children: [
              // Header Table
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 45, type: WidthType.PERCENTAGE },
                        borders: borderNone,
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({ text: 'TRƯỜNG THCS PHÙNG KHẮC KHOAN', bold: true, size: 22 }),
                              new TextRun({ text: '\nTỔ CHUYÊN MÔN / BAN SƯ PHẠM', bold: true, size: 22 })
                            ]
                          })
                        ]
                      }),
                      new TableCell({
                        width: { size: 55, type: WidthType.PERCENTAGE },
                        borders: borderNone,
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({ text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', bold: true, size: 22 }),
                              new TextRun({ text: '\nĐộc lập - Tự do - Hạnh phúc', bold: true, italics: true, size: 22 })
                            ]
                          })
                        ]
                      })
                    ]
                  })
                ]
              }),

              new Paragraph({ spacing: { before: 180, after: 180 } }),

              // Title
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'TÀI LIỆU GIỚI THIỆU TÍNH NĂNG & HƯỚNG DẪN SỬ DỤNG',
                    bold: true,
                    size: 32, // 16pt
                    color: '1E3A8A'
                  })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'HỆ THỐNG TRỢ LÝ AI SOẠN GIÁO ÁN (CV 2345 & 5512) & KHẢO THÍ ĐA CẤP HỌC (TIỂU HỌC - THCS - THPT)',
                    bold: true,
                    size: 26,
                    color: '059669'
                  })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Tác giả & Chủ nhiệm Phần mềm: Thầy Cấn Văn Trường - Hotline/Zalo: 0988.302.636',
                    italics: true,
                    size: 22,
                    color: '4B5563'
                  })
                ]
              }),

              new Paragraph({ spacing: { before: 180, after: 120 } }),

              // Phần I
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'I. TỔNG QUAN HỆ THỐNG',
                    bold: true,
                    size: 28,
                    color: '1E3A8A'
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'AI Lesson Planner Pro là hệ thống phần mềm chuyên biệt được phát triển nhằm hỗ trợ tối đa cho giáo viên giảng dạy TẤT CẢ CÁC CẤP HỌC (Tiểu học, THCS và THPT từ Lớp 1 đến Lớp 12) và TẤT CẢ CÁC MÔN HỌC (Tiếng Việt, Toán Tiểu học, Tự nhiên và Xã hội, Khoa học Tiểu học, Lịch sử và Địa lí Tiểu học, Đạo đức, Tin học và Công nghệ, Toán học, Khoa học tự nhiên, Vật lí, Hóa học, Sinh học, Ngữ văn, Tiếng Anh / Ngoại ngữ, Lịch sử và Địa lí, Tin học, Công nghệ, GDCD / GDKT&PL, Nghệ thuật, GDTC, Hoạt động trải nghiệm, GD địa phương...). Ứng dụng bám sát theo chuẩn Công văn 2345/BGDĐT (đối với Tiểu học) và Công văn 5512/BGDĐT (đối với THCS & THPT), Chương trình GDPT 2018 của Bộ Giáo dục và Đào tạo, tích hợp công nghệ trí tuệ nhân tạo Gemini thế hệ mới nhất giúp tự động hóa toàn diện quy trình giảng dạy, biên soạn tài liệu, khảo thí và thiết kế đồ thị/hình vẽ sư phạm.'
                  })
                ]
              }),

              new Paragraph({ spacing: { before: 120, after: 120 } }),

              // Phần II
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'II. DANH MỤC 15 PHÂN HỆ TÍNH NĂNG CHÍNH CỦA HỆ THỐNG',
                    bold: true,
                    size: 28,
                    color: '1E3A8A'
                  })
                ]
              }),

              // Table Features
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 8, type: WidthType.PERCENTAGE },
                        borders: borderThin,
                        shading: { fill: 'E5E7EB' },
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'STT', bold: true, size: 22 })] })]
                      }),
                      new TableCell({
                        width: { size: 27, type: WidthType.PERCENTAGE },
                        borders: borderThin,
                        shading: { fill: 'E5E7EB' },
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Phân hệ / Tab', bold: true, size: 22 })] })]
                      }),
                      new TableCell({
                        width: { size: 65, type: WidthType.PERCENTAGE },
                        borders: borderThin,
                        shading: { fill: 'E5E7EB' },
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Chức năng & Lợi ích nổi bật', bold: true, size: 22 })] })]
                      })
                    ]
                  }),
                  ...[
                    {
                      stt: '1',
                      tab: 'Tab 1: Lớp & PP Dạy',
                      desc: 'Quản lý hồ sơ đa môn học & từng lớp học từ Lớp 1 đến Lớp 12 (sĩ số, phân hóa học lực, thời lượng 35/45 phút). Cung cấp thư viện 24 phương pháp & kỹ thuật dạy học tích cực (Khăn trải bàn, Mảnh ghép, KWL, Sơ đồ tư duy, Bàn tay nặn bột, Dạy học theo trạm...) kèm mục tiêu chuẩn CV 2345 (Tiểu học) và CV 5512 (THCS-THPT).'
                    },
                    {
                      stt: '2',
                      tab: 'Tab 2: Quét SGK & Soạn AI',
                      desc: 'Đọc và phân tích ảnh chụp/file PDF SGK chuẩn Bộ sách Kết nối tri thức với cuộc sống. Trích xuất 100% nguyên văn bài học mọi môn (Tiểu học đến THPT), tự động sinh tiến trình 4 hoạt động dạy học với kịch bản sư phạm phân hóa, dự kiến khó khăn và thơ đúc kết bài học.'
                    },
                    {
                      stt: '3',
                      tab: 'Tab 3: Trình Duyệt GA & Word (CV 5512/2345)',
                      desc: 'Trình soạn thảo giáo án chuyên nghiệp chuẩn CV 5512/2345: Bảng 2 cột nghiêm ngặt (Cột 1: Hoạt động GV & HS, Cột 2: Dự kiến sản phẩm và lời giải chi tiết 100%), tự động khóa bảng 2 cột không bao giờ nhảy hàng ở Tiết 2+, lặp lại dòng tiêu đề bảng (Repeat Header Rows) khi qua nhiều trang A4, tách riêng bảng chữ ký và tách Hướng dẫn về nhà độc lập 14pt; hỗ trợ công thức Toán LaTeX ($...$, $$...$$) và xuất file Word (.docx) chuẩn lề A4 1-click.'
                    },
                    {
                      stt: '4',
                      tab: 'Tab 4: Ma trận, Đề thi THPT 2025 & Tạo đề tương tự',
                      desc: 'Thiết kế Ma trận & Bản đặc tả theo chuẩn GDPT 2018; Cập nhật Cấu trúc Đề thi Tốt nghiệp THPT Quốc gia mới từ năm 2025 (Phần I: 12 câu nhiều lựa chọn, Phần II: 4 câu Đúng/Sai, Phần III: 6 câu Trả lời ngắn); Tùy chỉnh tỉ lệ % Trắc nghiệm/Tự luận, thang điểm từng phần; Tính năng "Tạo Đề Tương Tự Từ Đề Gốc Đã Cho" và xuất Phiếu tô trắc nghiệm chuẩn 1 trang A4.'
                    },
                    {
                      stt: '5',
                      tab: 'Tab 5: Audio Diễn Cảm & Bóc Băng Ghi Âm Không Giới Hạn Sang Word',
                      desc: 'Biên soạn phiếu tự học, Infographic, đọc giọng truyền cảm Tiếng Việt có tua bài và tải file .mp3; Tính năng mới "Bóc băng ghi âm không giới hạn thời lượng & Chuyển giọng nói sang Word (.docx)" với khả năng tự động nhận diện chuẩn xác 100% công thức Toán/Lí/Hóa sang LaTeX ($a^2$, $\\sqrt{x}$, $\\frac{a}{b}$, $a \\neq 0$), tự động lọc bỏ từ lặp do nói vấp, hỗ trợ ghi âm Micro hoặc tải file âm thanh dài (cả tiết dạy 45-90 phút), tóm tắt bài giảng và xuất file Word đẹp mắt.'
                    },
                    {
                      stt: '6',
                      tab: 'Tab 6: Chấm Thi AI Vision',
                      desc: 'Chấm tự động phiếu trắc nghiệm bằng AI Vision trong 3 giây cho bài kiểm tra mọi môn. Nhận diện SBD, Mã đề, chấm điểm chính xác, phân tích các câu học sinh hay sai và xuất bảng điểm chi tiết ra Excel / Word.'
                    },
                    {
                      stt: '7',
                      tab: 'Tab 7: Trợ lý AI Sư phạm & Tri Thức Toàn Năng',
                      desc: 'Trợ lý thông minh giải đáp hướng dẫn 15 Tab web, chuyên môn sư phạm đa bậc học (Tiểu học CV 2345, THCS & THPT CV 5512), tạo ảnh AI minh họa bài giảng, và giải đáp toàn diện kiến thức khoa học, văn hóa, đời sống.'
                    },
                    {
                      stt: '8',
                      tab: 'Tab 8: Kế hoạch GD (Phụ lục 1,2,3)',
                      desc: 'Tự động biên soạn Kế hoạch dạy học môn học của Tổ chuyên môn / Khối lớp (Phụ lục 1), Kế hoạch tổ chức hoạt động giáo dục (Phụ lục 2), và Kế hoạch giáo dục cá nhân của giáo viên (Phụ lục 3) chuẩn CV 2345 & CV 5512 cho mọi môn học.'
                    },
                    {
                      stt: '9',
                      tab: 'Tab 9: TikZ Studio (Vẽ hình Vector)',
                      desc: 'Studio chuyên biệt vẽ hình hình học không gian, đồ thị hàm số, hình học phẳng, sơ đồ thí nghiệm KHTN và sơ đồ minh họa bằng mã LaTeX TikZ chuẩn AI. Xem trước Canvas trực quan và xuất file Word / PNG / SVG.'
                    },
                    {
                      stt: '10',
                      tab: 'Tab 10: Hướng Dẫn Sử Dụng & Quản Trị Hệ Thống',
                      desc: 'Cẩm nang hướng dẫn sử dụng chi tiết, mẹo sư phạm, xuất cẩm nang Word (.docx), cấu hình kho Google Drive tự động phân loại thư mục và bảng điều khiển cấp quyền Admin Thầy Cấn Văn Trường.'
                    },
                    {
                      stt: '11',
                      tab: 'Tab 11: Kho Tài Liệu Số & Văn Bản Chỉ Đạo',
                      desc: 'Kho dữ liệu số cộng đồng và thư mục lưu trữ các văn bản chỉ đạo của Bộ GD&ĐT về Trí tuệ nhân tạo (AI), Khung Năng lực Số (NLS), Công văn 5512, 2345, đề thi và giáo án mẫu.'
                    },
                    {
                      stt: '12',
                      tab: 'Tab 12: Diễn Đàn Sư Phạm & Hộp Thư 1-1 Với Admin',
                      desc: 'Không gian giao lưu sư phạm, trao đổi giáo án, đề thi và nhắn tin riêng tư 1-1 trực tiếp với Admin Thầy Cấn Văn Trường có thông báo Toast và chuông thời gian thực.'
                    },
                    {
                      stt: '13',
                      tab: 'Tab 13: Mô Phỏng Trực Quan & Thí Nghiệm AI',
                      desc: 'Phòng thí nghiệm ảo và mô phỏng tương tác HTML5 Canvas/SVG cho Vật lí, Hóa học, Sinh học, Toán học, KHTN; tự sinh mô phỏng mới bằng AI.'
                    },
                    {
                      stt: '14',
                      tab: 'Tab 14: Đối Chiếu & Tổng Hợp Tài Liệu Đa Nguồn',
                      desc: 'Nạp cùng lúc nhiều tài liệu (PDF, Word .docx/.doc, PPTX, XLSX, TXT), hỗ trợ chọn quét theo khoảng trang từng file hoặc toàn bộ, đối chiếu ma trận điểm khác biệt và tổng hợp chuyên đề nâng cao chuẩn 5512.'
                    },
                    {
                      stt: '15',
                      tab: 'Tab 15: Thẩm Định Thể Thức Word & Đổi Tên Hàng Loạt AI',
                      desc: 'Thẩm định và tự động chuẩn hóa font chữ, cỡ chữ, căn lề trang A4, dãn dòng, dãn đoạn, thụt lề, viền bảng nét đơn, sửa lỗi dấu câu tiếng Việt theo NĐ 30/2020, HD 05, CV 5512 hoặc Tùy biến mẫu riêng (Lưu/Xuất JSON). Kèm công cụ Đổi tên hàng loạt Thư mục & Tệp tin bằng AI, xuất file Script .BAT 1-click tự động chạy trên Windows và tải file nén .ZIP cấu trúc thư mục.'
                    }
                  ].map(item => (
                    new TableRow({
                      children: [
                        new TableCell({
                          borders: borderThin,
                          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.stt, size: 22 })] })]
                        }),
                        new TableCell({
                          borders: borderThin,
                          children: [new Paragraph({ children: [new TextRun({ text: item.tab, bold: true, size: 22 })] })]
                        }),
                        new TableCell({
                          borders: borderThin,
                          children: [new Paragraph({ children: [new TextRun({ text: item.desc, size: 22 })] })]
                        })
                      ]
                    })
                  ))
                ]
              }),

              new Paragraph({ spacing: { before: 140, after: 120 } }),

              // Phần III
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'III. HƯỚNG DẪN CÁC BƯỚC SỬ DỤNG (QUICK START GUIDE)',
                    bold: true,
                    size: 28,
                    color: '1E3A8A'
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: '• Bước 1: Kích hoạt Bản quyền: ', bold: true }),
                  new TextRun({ text: 'Nhập mã bản quyền chính thức (hoặc mã Dùng thử được cấp) vào mục Bản quyền. Quản trị viên Thầy Trường có thể cấp mã dùng thử cho mọi máy tính với thời hạn tự đặt.' })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: '• Bước 2: Thiết lập Gemini API Key: ', bold: true }),
                  new TextRun({ text: 'Truy cập https://aistudio.google.com/app/apikey để lấy khóa API Gemini miễn phí. Nhập 1 hoặc nhiều khóa (ngăn cách bởi dấu phẩy) để hệ thống tự động xoay vòng key không giới hạn.' })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: '• Bước 3: Nhập thông tin & Tải tài liệu SGK: ', bold: true }),
                  new TextRun({ text: 'Tại Tab 1 & Tab 2, chọn môn học, lớp học và tải ảnh/PDF bài học trong sách giáo khoa cần soạn.' })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: '• Bước 4: Tạo & Xuất Giáo án Word: ', bold: true }),
                  new TextRun({ text: 'Nhấn nút "Soạn Giáo Án AI Chuẩn 5512", kiểm tra tiến trình 4 hoạt động tại Tab 3 và nhấn "Xuất File Word (.docx)" để tải về máy tính sử dụng ngay.' })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: '• Bước 5: Tạo Đề thi, Phiếu tô & Chấm thi: ', bold: true }),
                  new TextRun({ text: 'Tại Tab 4 sinh ma trận và trộn 4 mã đề kèm Phiếu tô trắc nghiệm chuẩn Sở Hà Nội (1 trang A4). Tại Tab 6 tải ảnh bài làm học sinh để AI chấm tự động.' })
                ]
              }),

              new Paragraph({ spacing: { before: 140, after: 120 } }),

              // Phần IV
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'IV. THÔNG TIN BẢN QUYỀN & HỖ TRỢ KỸ THUẬT',
                    bold: true,
                    size: 28,
                    color: '1E3A8A'
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: '• Tác giả & Quản trị viên: ', bold: true }),
                  new TextRun({ text: 'Thầy Cấn Văn Trường - Giáo viên Trường THCS Phùng Khắc Khoan, xã Tây Phương, TP. Hà Nội.' })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: '• Hotline / Zalo hỗ trợ 24/7: ', bold: true }),
                  new TextRun({ text: '0988.302.636', bold: true, color: '059669' })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: '• Email liên hệ: ', bold: true }),
                  new TextRun({ text: 'canvantruong2010@gmail.com' })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: '• Tính năng Mã dùng thử: ', bold: true }),
                  new TextRun({ text: 'Admin có thể cấp mã dùng thử dạng "DDMMYY-TRIAL-CHECKSUM-PRO" để mọi máy tính của giáo viên đều kích hoạt và trải nghiệm được trong thời hạn quy định.' })
                ]
              })
            ]
          }
        ]
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, 'Tai_Lieu_Gioi_Thieu_Va_Huong_Dan_AI_Lesson_Planner_Pro.docx');
    } catch (err) {
      console.error('Error exporting word guide:', err);
      alert('Có lỗi xảy ra khi tạo file Word: ' + String(err));
    } finally {
      setIsExportingWord(false);
    }
  };

  const FEATURES_LIST = [
    {
      id: 1,
      tab: 1,
      title: 'Tab 1: Hồ sơ Lớp & Thiết lập Phương pháp Dạy học',
      icon: UsersIcon,
      badge: 'Quản lý & Sư phạm',
      color: 'blue',
      summary: 'Quản lý đa môn học, đa lớp học từ Lớp 1 đến Lớp 12, sĩ số, phân hóa đối tượng và tích hợp 24 phương pháp & kỹ thuật dạy học tích cực GDPT 2018.',
      details: [
        'Hỗ trợ tất cả các môn học: Tiếng Việt, Toán (Tiểu học & THCS/THPT), KHTN, Tự nhiên và Xã hội, Khoa học, Lịch sử - Địa lí, Ngữ văn, Tiếng Anh, Tin học, Công nghệ, GDCD...',
        'Lựa chọn 24 phương pháp dạy học tích cực: Khăn trải bàn, Mảnh ghép, KWL, Sơ đồ tư duy, Bàn tay nặn bột, Dạy học theo trạm, Đóng vai...',
        'Tự động đồng bộ mục tiêu bài học chuẩn CV 2345 (Tiểu học) và CV 5512 (THCS & THPT) sang các tab soạn giáo án.'
      ]
    },
    {
      id: 2,
      tab: 2,
      title: 'Tab 2: Quét SGK & Soạn Giáo án AI (CV 2345 / 5512)',
      icon: BookOpen,
      badge: 'Trí tuệ nhân tạo AI',
      color: 'indigo',
      summary: 'Đọc file PDF hoặc ảnh chụp sách giáo khoa mọi môn học (Tiểu học đến THPT), trích xuất chính xác 100% và sinh giáo án chuẩn quy định Bộ GD&ĐT.',
      details: [
        'Đọc chuẩn Bộ sách: Kết nối tri thức với cuộc sống cho tất cả các môn học từ Lớp 1 đến Lớp 12.',
        'Trích xuất nguyên văn định nghĩa, văn bản, công thức, bài tập SGK không bị sai lệch.',
        'Thiết kế tiến trình bài dạy tích cực: Khởi động, Khám phá / Hình thành kiến thức, Luyện tập, Vận dụng.',
        'Kịch bản phân công nhiệm vụ chi tiết: Hoạt động của GV - Hoạt động của HS - Sản phẩm dự kiến - Dự kiến khó khăn - Thơ đúc kết bài học.'
      ]
    },
    {
      id: 3,
      tab: 3,
      title: 'Tab 3: Trình duyệt Soạn thảo & Xuất bản Word chuẩn Form A4 (CV 5512 / 2345)',
      icon: FileText,
      badge: 'Soạn thảo & In ấn',
      color: 'emerald',
      summary: 'Trình soạn thảo trực quan chuẩn CV 5512/2345 (bảng 2 cột nghiêm ngặt, tự động khóa cột không nhảy hàng Tiết 2+, lặp tiêu đề bảng nhiều trang), công thức LaTeX và xuất file Word .docx 1-click chuẩn A4.',
      details: [
        'Bảng 2 cột chuẩn 5512: Cột 1 (Hoạt động của GV và HS) và Cột 2 (Dự kiến sản phẩm có lời giải chi tiết 100%), tuyệt đối không tạo bảng 3 cột.',
        'Khóa tự động cấu trúc bảng 2 cột cho tất cả các Tiết (Tiết 1, Tiết 2, Tiết 3,...), không bao giờ bị nhảy cột hay xô lệch.',
        'Cơ chế lặp lại dòng tiêu đề bảng (Repeat Header Rows) khi bảng kéo dài sang trang 2, trang 3; tách riêng bảng chữ ký BGH/Tổ chuyên môn.',
        'Tự động tách Hướng dẫn về nhà và Tổng kết bài học thành các đoạn văn độc lập, giữ nguyên font chữ 14pt chuẩn mực.',
        'Hỗ trợ công thức Toán học MathType/LaTeX chuẩn ($...$, $$...$$), không lỗi font khi dán sang Microsoft Word.',
        'Tùy chỉnh Header, Footer, Watermark (Bản quyền cá nhân/trường học), căn lề trang chuẩn Bộ GD&ĐT.'
      ]
    },
    {
      id: 4,
      tab: 4,
      title: 'Tab 4: Ma trận, Đề thi THPT 2025 & Tạo đề tương tự từ đề gốc',
      icon: Grid,
      badge: 'Khảo thí & Đề thi 2025',
      color: 'amber',
      summary: 'Thiết kế ma trận đề 4 mức độ nhận thức, cập nhật Cấu trúc Đề thi Tốt nghiệp THPT Quốc gia 2025 mới (Phần I, II, III), tùy biến thang điểm và tính năng "Tạo Đề Tương Tự Từ Đề Gốc Đã Cho".',
      details: [
        'Hỗ trợ Cấu trúc THPT Quốc gia 2025: Phần I (12 câu nhiều lựa chọn), Phần II (4 câu Đúng/Sai 4 ý), Phần III (6 câu Trả lời ngắn), Phần IV (Tự luận).',
        'Tùy chỉnh linh hoạt tỉ lệ % Trắc nghiệm / Tự luận, số lượng câu hỏi và điểm số từng câu.',
        'Tính năng đột phá "🔄 Tạo Đề Tương Tự": Dán/tải đề gốc bất kỳ ➔ AI tự động sinh 1-8 mã đề tương đương về độ khó & ma trận nhưng thay đổi số liệu/ngữ cảnh + Kèm Master Key & Lời giải + Sửa tay hoặc AI tinh chỉnh.',
        'Xuất Phiếu tô trắc nghiệm chuẩn 1 trang A4 và xuất file Word đề thi đẹp mắt.'
      ]
    },
    {
      id: 5,
      tab: 5,
      title: 'Tab 5: Audio Diễn Cảm & Bóc Băng Ghi Âm Không Giới Hạn Sang Word',
      icon: Music,
      badge: 'Đa phương tiện & Bóc băng Word',
      color: 'purple',
      summary: 'Tạo phiếu tự học, sơ đồ Infographic, đọc Audio Tiếng Việt có tua bài & Tính năng mới "Bóc băng ghi âm không giới hạn thời lượng & Chuyển giọng nói sang Word (.docx)".',
      details: [
        'Thu âm trực tiếp không giới hạn thời lượng từ Micro hoặc nạp file âm thanh dài (.mp3, .m4a, .wav, .aac, .ogg, .webm, .flac) từ 5 phút đến trọn vẹn tiết dạy 45-90 phút.',
        'Nhận diện chuẩn xác 100% công thức Toán/Lí/Hóa khi đọc (phân số, căn thức, luỹ thừa, góc, tam giác, a khác không) và chuyển thành chuẩn LaTeX ($a^2$, $\\sqrt{x}$, $\\frac{a}{b}$, $a \\neq 0$) không lỗi font.',
        'Tự động lọc từ thừa, sửa lỗi nói vấp, ngắt câu và giữ nguyên văn phong sư phạm chuẩn mực.',
        '3 chế độ bóc băng: Bóc băng nguyên văn, Tóm tắt & lập kế hoạch bài dạy, Trích xuất câu hỏi/bài tập từ lời giảng.',
        'Trình soạn thảo trực tiếp A4 WYSIWYG, sao chép sang Tab 3 và Xuất file Word (.docx) chuyên nghiệp.'
      ]
    },
    {
      id: 6,
      tab: 6,
      title: 'Tab 6: Chấm thi Trắc nghiệm Thông minh bằng AI Vision',
      icon: Camera,
      badge: 'AI Vision Chấm bài',
      color: 'rose',
      summary: 'Tải ảnh chụp phiếu làm bài của học sinh, AI Vision quét và chấm điểm trong 3 giây, thống kê câu sai và xuất bảng điểm Excel/Word.',
      details: [
        'Tự động nhận diện Số báo danh (SBD), Mã đề thi, các ô tròn học sinh đã tô đen.',
        'Đối chiếu đáp án chuẩn, tính điểm số chính xác 100%.',
        'Thống kê câu học sinh làm sai nhiều để giáo viên chữa bài trực tiếp.',
        'Tích hợp nút in/tải Phiếu tô trắc nghiệm chuẩn Sở GD&ĐT Hà Nội để phát cho học sinh làm bài.'
      ]
    },
    {
      id: 7,
      tab: 7,
      title: 'Tab 7: Trợ lý AI Sư phạm & Cố vấn Tri Thức Toàn Năng',
      icon: Wand2,
      badge: 'Chuyên gia Sư phạm & Tri thức',
      color: 'cyan',
      summary: 'Giải đáp hướng dẫn 14 Tab web, chuyên môn sư phạm đa bậc học (Tiểu học CV 2345, THCS & THPT CV 5512), công thức toán học KaTeX chuẩn đẹp ($a \\neq 0$), đồ thị hình học TikZ vector, mô phỏng tương tác HTML5 và tạo ảnh AI minh họa bài giảng.',
      details: [
        'Hiển thị công thức Toán học, Vật lí, Hóa học chuẩn xác qua KaTeX, sửa triệt để lỗi ký hiệu không bằng (\\neq, ≠), căn thức, phân số.',
        'Tích hợp trình biên dịch đồ họa TikZ vector và nhúng trực tiếp các mô phỏng khoa học tương tác HTML5 Canvas toàn màn hình.',
        'Hệ thống điều phối API Key 3 tầng thông minh: Khóa hệ thống mặc định ➔ Khóa Admin bổ sung (cập nhật tức thời) ➔ Khóa cá nhân của giáo viên.',
        'Tư vấn sư phạm: Trò chơi khởi động, hoạt động nhóm phân hóa, dạy học trải nghiệm STEM, xây dựng Rubric và tạo ảnh AI minh họa.'
      ]
    },
    {
      id: 8,
      tab: 8,
      title: 'Tab 8: Kế hoạch Giáo dục Nhà trường (Phụ lục 1, 2, 3)',
      icon: Calendar,
      badge: 'Kế hoạch Tổ & GV',
      color: 'teal',
      summary: 'Tự động biên soạn Kế hoạch dạy học môn học của Tổ/Khối chuyên môn (PL1), Hoạt động giáo dục (PL2) và Kế hoạch giáo dục giáo viên (PL3) chuẩn CV 2345 & CV 5512.',
      details: [
        'Phụ lục 1: Kế hoạch dạy học môn học theo phân phối chương trình cả năm.',
        'Phụ lục 2: Kế hoạch tổ chức các hoạt động giáo dục, ngoại khóa, trải nghiệm STEM.',
        'Phụ lục 3: Kế hoạch giáo dục của cá nhân giáo viên trong năm học.'
      ]
    },
    {
      id: 9,
      tab: 9,
      title: 'Tab 9: TikZ Studio - Vẽ Hình Vector & Sơ Đồ Trực Quan Chuẩn AI',
      icon: Code,
      badge: 'TikZ & Vector',
      color: 'orange',
      summary: 'Studio chuyên biệt vẽ hình hình học không gian, đồ thị hàm số, sơ đồ thí nghiệm, hình minh họa bằng mã LaTeX TikZ, xuất Word/PNG sắc nét.',
      details: [
        'Vẽ hình hình học không gian (chóp, lăng trụ, nón, trụ, cầu), hình học phẳng, đồ thị hàm số.',
        'Vẽ sơ đồ thí nghiệm Vật lý - Hóa học - Sinh học, biểu đồ và sơ đồ tư duy dạng vector chuẩn đẹp.',
        'Xem trước Canvas tương tác trực tiếp, chỉnh sửa thông số và xuất file Word / PNG / SVG độ phân giải cao.'
      ]
    },
    {
      id: 10,
      tab: 10,
      title: 'Tab 10: Hướng Dẫn Sử Dụng & Quản Trị Hệ Thống (Thầy Trường)',
      icon: BookOpen,
      badge: 'Cẩm Nang & Admin',
      color: 'blue',
      summary: 'Cẩm nang hướng dẫn sử dụng chi tiết, mẹo sư phạm, xuất cẩm nang Word (.docx), cấu hình kho Google Drive và bảng điều khiển cấp quyền Admin.',
      details: [
        'Tải trọn bộ tài liệu cẩm nang hướng dẫn sử dụng định dạng Word (.docx) và PDF.',
        'Quản lý hồ sơ tác giả, ảnh chân dung và thông tin liên hệ Thầy Cấn Văn Trường.',
        'Cấu hình đồng bộ kho lưu trữ Google Drive tự động phân loại thư mục theo cấp học.',
        'Cấp mã bản quyền và mã dùng thử linh hoạt cho giáo viên toàn quốc.'
      ]
    },
    {
      id: 11,
      tab: 11,
      title: 'Tab 11: Kho Tài Liệu Số & Văn Bản Chỉ Đạo (AI, Năng Lực Số, CV 5512/2345)',
      icon: FolderOpen,
      badge: 'Kho Số & Đóng Góp',
      color: 'indigo',
      summary: 'Kho dữ liệu số cộng đồng và thư mục lưu trữ các văn bản chỉ đạo của Bộ GD&ĐT về Trí tuệ nhân tạo (AI), Khung Năng lực Số (NLS), Công văn 5512, 2345, đề thi và giáo án mẫu.',
      details: [
        'Hệ thống thư mục đa cấp: Công văn & Chỉ đạo về AI, Khung Năng lực số (NLS), CV 5512/2345, Giáo án chuẩn mẫu.',
        'Tìm kiếm, xem trước nhanh tài liệu toàn văn và tải về định dạng Microsoft Word (.DOCX) chuẩn thể thức.',
        'Nạp 1-click vào Bộ nhớ AI tham chiếu để phân tích tự động khi soạn bài hoặc tạo đề thi.',
        'Đóng góp và tải lên tài liệu mới của thầy cô lên Kho cộng đồng dùng chung qua Webhook Google Drive.'
      ]
    },
    {
      id: 12,
      tab: 12,
      title: 'Tab 12: Diễn Đàn Sư Phạm & Hộp Thư Tin Nhắn Riêng 1-1 Với Admin',
      icon: MessageSquare,
      badge: 'Cộng Đồng & Hỗ Trợ 1-1',
      color: 'rose',
      summary: 'Không gian giao lưu sư phạm, trao đổi giáo án, đề thi và nhắn tin riêng tư 1-1 trực tiếp với Admin Thầy Cấn Văn Trường có thông báo Toast và chuông thời gian thực.',
      details: [
        'Diễn đàn công khai: Đăng bài chia sẻ kinh nghiệm, giáo án CV 5512/2345, ma trận đề thi phân hóa và nhận xét chuyên môn.',
        'Hộp thư riêng 1-1 với Admin: Nhắn tin riêng tư trực tiếp tới Thầy Cấn Văn Trường, hỗ trợ bản quyền, giải đáp kỹ thuật bảo mật tuyệt đối.',
        'Thông báo thời gian thực (Realtime Toast & Audio): Chuông thông báo và biểu tượng nổi ngay khi Admin phản hồi hoặc có bài viết mới.',
        'Hệ thống duyệt bài & ghim bài: Admin kiểm duyệt bài đăng văn minh, ghim các bài viết chất lượng cao lên đầu trang.'
      ]
    },
    {
      id: 13,
      tab: 13,
      title: 'Tab 13: Mô Phỏng Trực Quan & Thí Nghiệm Sư Phạm AI',
      icon: Activity,
      badge: 'Thí Nghiệm Ảo HTML5',
      color: 'purple',
      summary: 'Phòng thí nghiệm ảo và mô phỏng tương tác HTML5 Canvas/SVG cho Vật lí, Hóa học, Sinh học, Toán học, KHTN; tự sinh mô phỏng mới bằng AI.',
      details: [
        'Tương tác kéo thả thanh trượt (slider) thay đổi biến số, đo lường năng lượng thời gian thực.',
        'Phòng thí nghiệm đa môn: Parabol động, Dao động con lắc, Quang hình học, Phản ứng hóa học, Quang hợp...',
        'Trình tạo mô phỏng AI: Tự động lập trình mã HTML5 tương tác theo chủ đề yêu cầu trong 10 giây.',
        'Toàn quyền thêm, sửa mã nguồn và xóa mô phỏng cho giáo viên và quản trị viên.'
      ]
    },
    {
      id: 14,
      tab: 14,
      title: 'Tab 14: Đối Chiếu & Tổng Hợp Tài Liệu Đa Nguồn (Multi-Doc Synthesis & Comparison)',
      icon: Layers,
      badge: 'So Sánh & Tổng Hợp',
      color: 'cyan',
      summary: 'Nạp cùng lúc nhiều tài liệu (PDF, Word .docx/.doc, PPTX, XLSX, TXT), hỗ trợ chọn quét theo khoảng trang từng file hoặc toàn bộ, đối chiếu ma trận điểm khác biệt và tổng hợp chuyên đề nâng cao chuẩn 5512.',
      details: [
        'Tải lên đồng thời nhiều file sách giáo khoa (KNTT, Cánh Diều, Chân Trời), đề thi, giáo án không bị lỗi font hay ký tự lạ.',
        'Điều khiển quét linh hoạt theo từng file: Chọn quét Toàn bộ file, Chọn từ trang ... đến trang ... (tiết kiệm API Key) hoặc Trích đoạn nhanh.',
        'Tích hợp công nghệ AI OCR đa tầng Key: Đọc hiểu văn bản và sơ đồ hình vẽ phức tạp tự động.',
        'Xuất file Microsoft Word (.docx) chuẩn thể thức A4, bảng biểu 2 cột và tiêu đề khoa học.'
      ]
    },
    {
      id: 15,
      tab: 15,
      title: 'Tab 15: Thẩm Định Thể Thức Word & Đổi Tên Hàng Loạt Bằng AI (.BAT/ZIP)',
      icon: FolderTree,
      badge: 'Thể Thức & Đổi Tên AI',
      color: 'amber',
      summary: 'Thẩm định & Chuẩn hóa định dạng file Word (.docx) hàng loạt theo Nghị định 30/2020, HD 05, CV 5512/3666, Tùy biến Mẫu riêng; Kèm Đổi tên hàng loạt Thư mục & Tệp tin bằng AI, xuất Script .BAT 1-click tự động.',
      details: [
        'Phân hệ 1: Thẩm định thể thức văn bản Word (.docx) hàng loạt: Kiểm tra và chuẩn hóa font chữ, cỡ chữ, căn lề A4, dãn dòng, dãn đoạn, thụt lề, viền bảng nét đơn, sửa lỗi dấu câu tiếng Việt theo NĐ 30, HD 05, CV 5512 hoặc Tùy biến mẫu riêng (Lưu/Xuất JSON).',
        'Phân hệ 2: Đổi tên hàng loạt Thư mục & Tệp tin bằng AI: Nhập yêu cầu bằng tiếng Việt tự nhiên, AI tự suy luận ngữ cảnh đổi tên theo tuần, khối lớp, môn học, chuẩn hóa snake_case.',
        'Tải Script Đổi Tên Tự Động (.BAT): Tự động quét và đổi tên mọi thư mục con/file trong thư mục hiện tại mà không cần khớp tên cũ, hỗ trợ Unicode Tiếng Việt 100%.',
        'Tải trọn bộ file nén .ZIP chứa cây thư mục chuẩn mẫu hoặc toàn bộ file đã đổi tên.'
      ]
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/60 rounded-2xl p-6 sm:p-8 shadow-xl text-slate-100 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Phiên bản GDPT 2018 Toàn Diện (Tiểu học - THCS - THPT)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Bản quyền: Thầy Cấn Văn Trường
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              TỔNG QUAN TÍNH NĂNG & CẨM NANG HƯỚNG DẪN SỬ DỤNG
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Chào mừng quý Thầy Cô đến với <strong>AI Lesson Planner Pro</strong> — Hệ thống Trợ lý AI Toàn diện chuyên sâu biên soạn Kế hoạch bài dạy (chuẩn Công văn 2345/BGDĐT cho <strong>Tiểu học</strong> và Công văn 5512/BGDĐT cho <strong>THCS - THPT</strong>), khảo thí đề thi phân hóa, chấm thi AI Vision và vẽ hình TikZ vector dành cho <strong>TẤT CẢ CÁC BẬC HỌC TỪ LỚP 1 ĐẾN LỚP 12 VÀ MỌI MÔN HỌC</strong> (Toán học, Tiếng Việt, Khoa học tự nhiên, Tự nhiên & Xã hội, Khoa học, Vật lí, Hóa học, Sinh học, Ngữ văn, Tiếng Anh, Lịch sử & Địa lí, Tin học, Công nghệ, GDCD...).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <button
              onClick={handleExportWordGuide}
              disabled={isExportingWord}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2 transition-all"
            >
              <FileDown className="w-4 h-4" />
              <span>{isExportingWord ? 'Đang tạo Word...' : 'Tải File Hướng Dẫn (.DOCX)'}</span>
            </button>

            <button
              onClick={handlePrintPdf}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs shadow flex items-center justify-center gap-2 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>In / Lưu File PDF (.PDF)</span>
            </button>

            <button
              onClick={onOpenLicenseModal}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition-all"
            >
              <Key className="w-4 h-4" />
              <span>Xem / Đổi Mã Bản Quyền</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveSection('overview')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSection === 'overview'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>1. Tổng Quan 14 Phân Hệ Toàn Diện</span>
        </button>

        <button
          onClick={() => setActiveSection('guide')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSection === 'guide'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>2. Hướng Dẫn Từng Bước (Quick Start)</span>
        </button>

        <button
          onClick={() => setActiveSection('tips')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSection === 'tips'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>3. Mẹo Khai Thác Sư Phạm</span>
        </button>

        <button
          onClick={() => setActiveSection('license')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSection === 'license'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>4. Chính Sách & Mã Dùng Thử</span>
        </button>

        <button
          onClick={() => setActiveSection('gallery_templates')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSection === 'gallery_templates'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/30'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span>6. Xem Mẫu Giáo Án, Đề Thi & Hình Ảnh (Trực Quan)</span>
        </button>

        <button
          onClick={() => setActiveSection('author_admin')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSection === 'author_admin'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30'
              : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/60'
          }`}
        >
          <User className="w-3.5 h-3.5 text-purple-400" />
          <span>5. Hồ Sơ Tác Giả & Quản Trị Hệ Thống (Thầy Trường)</span>
        </button>
      </div>

      {/* SECTION 1: OVERVIEW OF ALL 15 TABS */}
      {activeSection === 'overview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <span>BẢNG CHI TIẾT 15 PHÂN HỆ CHỨC NĂNG CỦA ỨNG DỤNG</span>
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Nhấp vào từng thẻ để chuyển nhanh đến phân hệ tương ứng
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES_LIST.map(feat => {
              const IconComp = feat.icon;
              return (
                <div
                  key={feat.id}
                  onClick={() => onNavigateTab && onNavigateTab(feat.tab)}
                  className="group p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/60 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {feat.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {feat.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {feat.summary}
                      </p>
                    </div>

                    <ul className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400">
                      {feat.details.slice(0, 2).map((d, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                    <span>Mở phân hệ này</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: QUICK START GUIDE */}
      {activeSection === 'guide' && (
        <div className="space-y-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              <span>QUY TRÌNH 5 BƯỚC SỬ DỤNG NHANH (QUICK START GUIDE)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Chỉ với 5 phút làm quen, quý Thầy Cô có thể biên soạn trọn bộ giáo án và đề thi chuẩn Bộ GD&ĐT
            </p>
          </div>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                1
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Bước 1: Kích hoạt Mã Bản Quyền (Hoặc Mã Dùng Thử)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Khi khởi động lần đầu, quý Thầy Cô nhập mã bản quyền đã được cấp. Nếu quý Thầy Cô nhận được <strong>Mã Dùng Thử (TRIAL)</strong> từ Thầy Cấn Văn Trường, mã này có thể kích hoạt trên <strong>mọi máy tính</strong> mà không bị ràng buộc thiết bị cho đến hết ngày hết hạn.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                2
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Bước 2: Cài đặt Gemini API Key Miễn Phí
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Truy cập trang Google AI Studio (<a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-500 underline">aistudio.google.com</a>) bằng tài khoản Gmail cá nhân để tạo khóa API miễn phí trong 1 phút. Quý Thầy Cô có thể nhập nhiều API key ngăn cách bằng dấu phẩy để hệ thống tự động xoay vòng key.
                </p>
                {onOpenApiGuide && (
                  <button
                    onClick={onOpenApiGuide}
                    className="text-xs text-blue-500 hover:underline font-semibold flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Xem video / hướng dẫn chi tiết cách lấy API Key</span>
                  </button>
                )}
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                3
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Bước 3: Thiết lập Thông tin Lớp học & Tải tài liệu SGK
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Tại <strong>Tab 1</strong>, chọn môn học (KHTN, Toán...), lớp học và phương pháp dạy học ưa thích. Tại <strong>Tab 2</strong>, tải ảnh chụp hoặc file PDF bài học trong SGK. AI sẽ tự động đọc và nhận diện toàn bộ nội dung bài học.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                4
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Bước 4: Soạn Giáo án & Xuất file Word (.docx) chuẩn Form A4
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Nhấn nút <strong>"Soạn Giáo Án AI Chuẩn 5512"</strong>. Hệ thống sẽ tạo tiến trình 4 hoạt động dạy học với kịch bản chi tiết, dự kiến khó khăn và thơ đúc kết bài học. Quý Thầy Cô chuyển sang <strong>Tab 3</strong> để chỉnh sửa và nhấn nút <strong>"Xuất File Word (.docx)"</strong>.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                5
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Bước 5: Tạo Đề thi, Xuất Phiếu tô trắc nghiệm & Chấm thi AI
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Tại <strong>Tab 4</strong>, tạo ma trận và trộn 4 mã đề hoán vị (101, 102, 103, 104) kèm nút xuất <strong>"Phiếu tô trắc nghiệm chuẩn mẫu thi vào 10 Sở GD&ĐT Hà Nội (1 trang A4)"</strong>. Sau khi học sinh làm bài, tại <strong>Tab 6</strong> chụp ảnh phiếu làm bài để AI Vision chấm điểm tự động trong 3 giây.
                </p>
              </div>
            </div>

            {/* Step 6 */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5">
              <div className="w-7 h-7 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                6
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="font-bold text-sm text-amber-900 dark:text-amber-300">
                  Bước 6: Thẩm Định Thể Thức Word & Đổi Tên Thư Mục / Tệp Tin Bằng AI (Tab 15)
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Tại <strong>Tab 15</strong>, Thầy Cô có thể:
                  <br />• <strong>Thẩm định thể thức file Word (.docx)</strong>: Tự động chuẩn hóa cỡ chữ, dãn dòng 1.2-1.5 lines, lề trang A4 (Trên 20mm, Dưới 20mm, Trái 30mm, Phải 15mm), viền bảng nét đơn và sửa dấu câu tiếng Việt theo Nghị định 30/2020 hoặc Tùy biến mẫu riêng của trường.
                  <br />• <strong>Đổi tên thư mục & tệp tin bằng AI</strong>: Nhập câu lệnh tiếng Việt tự nhiên (VD: <em>"Đổi tên các thư mục thành Tuần 01 đến Tuần 35 môn Toán 9"</em>) ➔ Nhấn <strong>"⚡ Tải Script Đổi Tên TỰ ĐỘNG (.BAT)"</strong> ➔ Sao chép file <code>.bat</code> vào thư mục chứa các thư mục con và nhấp đúp chạy là hoàn tất 100%!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: PEDAGOGICAL TIPS */}
      {activeSection === 'tips' && (
        <div className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <span>MẸO SƯ PHẠM & TỐI ƯU HIỆU QUẢ SỬ DỤNG</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Kinh nghiệm thực tiễn giúp quý Thầy Cô khai thác tối đa sức mạnh của phần mềm
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
              <h3 className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>1. Tối ưu Hạn ngạch API Gemini</span>
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Mỗi tài khoản Gmail cá nhân được miễn phí hạn ngạch từ Google AI Studio. Quý Thầy Cô có thể tạo 2-3 khóa API từ các tài khoản Gmail khác nhau và dán vào ô API Keys (ngăn cách bằng dấu phẩy) để hệ thống tự động luân phiên sử dụng, không lo bị gián đoạn khi soạn giáo án dài.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-2">
              <h3 className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4" />
                <span>2. Chuẩn Xuất File Word, Thể Thức & Ký Hiệu Toán Học 100%</span>
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Khi xuất file Word (.docx) và soạn thảo AI:
                <br />• <strong>Tên bài dạy, Chủ đề & Tiết theo PPCT</strong>: Luôn được <strong>tự động căn giữa</strong> (Center), 16pt in đậm nổi bật.
                <br />• <strong>Đề mục La Mã & Tiêu đề Tiết dạy</strong>: <code>**I. MỤC TIÊU**</code>, <code>**II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU**</code>, <code>**III. TIẾN TRÌNH DẠY HỌC**</code>, <code>**IV. HƯỚNG DẪN VỀ NHÀ**</code> luôn <strong>VIẾT HOA TOÀN BỘ VÀ IN ĐẬM</strong>. Tiêu đề Tiết dạy (<code>**TIẾT 2: LUYỆN TẬP**</code>, <code>**TIẾT 1: KHỞI ĐỘNG VÀ HÌNH THÀNH KIẾN THỨC MỚI**</code>) viết hoa toàn bộ chủ đề và in đậm.
                <br />• <strong>Mục tiêu riêng từng tiết</strong>: Bắt đầu bằng gạch đầu dòng và chữ 'M' viết hoa: <code>- **Mục tiêu riêng Tiết 1 (Lý thuyết):**</code>, <code>- **Mục tiêu riêng Tiết 2 (Luyện tập & Vận dụng):**</code>. Nội dung con bên dưới phân cấp bằng <code>+ </code> và viết hoa đầu câu.
                <br />• <strong>Quy tắc chữ "Luyện tập" & Tiêu đề 4 hoạt động chính</strong>: 4 hoạt động chính (<code>**1. HOẠT ĐỘNG KHỞI ĐỘNG**</code>, <code>**2. HOẠT ĐỘNG HÌNH THÀNH KIẾN THỨC MỚI**</code>, <code>**3. HOẠT ĐỘNG LUYỆN TẬP**</code>, <code>**4. HOẠT ĐỘNG VẬN DỤNG**</code>) luôn <strong>VIẾT HOA TOÀN BỘ VÀ IN ĐẬM</strong>. Sau dấu chấm (.), dấu hai chấm (:), gạch đầu dòng (- ), hoặc đầu đề mục (2. Luyện tập:, Luyện tập 3:), chữ "Luyện tập" hoặc chữ cái đầu <strong>tự động viết hoa</strong>; khi nằm giữa câu thông thường viết thường theo đúng ngữ cảnh.
                <br />• <strong>Năng lực số & Năng lực AI</strong>: Chỉ <strong>in đậm duy nhất dòng tiêu đề đề mục chính</strong> (<code>- **Năng lực số (TT 02/2025/TT-BGDĐT):**</code>), toàn bộ các dòng tiêu chí con bên dưới (<code>+ 1.1TC1b:...</code>) không in đậm.
                <br />• <strong>Ô vuông điền khuyết & Ký hiệu</strong>: Phân biệt rõ ô vuông điền khuyết (dạng <code>[ ? ]</code>, <code>[   ]</code>) với lỗi font/tofu; tự động tách các từ bị dính chữ (chia hết, liệt kê tập, không thuộc, thay vào, Hệ Mặt Trời...). Mọi ký hiệu tập hợp toán học luôn <strong>bảo toàn nguyên vẹn cặp dấu ngoặc nhọn {'{ }'}</strong> (ví dụ: L = {'{N; H; A; T; R; A; N; G}'}).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
              <h3 className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Camera className="w-4 h-4" />
                <span>3. Chụp ảnh Phiếu tô để AI Vision Chấm Chuẩn 100%</span>
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Khi chụp ảnh phiếu trắc nghiệm của học sinh tại Tab 6, quý Thầy Cô nên đặt phiếu trên mặt phẳng đủ ánh sáng, chụp thẳng góc và thấy rõ 4 góc của phiếu thi. Sử dụng mẫu phiếu chuẩn Sở Hà Nội (1 trang A4) của ứng dụng để đạt độ chính xác nhận diện cao nhất.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-2">
              <h3 className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <Music className="w-4 h-4" />
                <span>4. Phát Âm Thanh Bài Giảng Không Gián Đoạn</span>
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Tính năng Audio tại Tab 5 đã được tích hợp cơ chế chia nhỏ câu và keep-alive chống ngắt quãng của trình duyệt, đồng thời tự động chuyển đổi ký hiệu toán học như dấu ngoặc tập hợp {'{ }'}, phân số thành lời đọc tự nhiên, rất thích hợp để học sinh nghe lại bài tự học ở nhà.
              </p>
            </div>

            {/* Tip 5: Batch Renamer Windows BAT Troubleshooting */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 col-span-1 md:col-span-2">
              <h3 className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5 text-sm">
                <FolderTree className="w-4 h-4 text-amber-600" />
                <span>5. HƯỚNG DẪN & KHẮC PHỤC LỖI ĐỔI TÊN HÀNG LOẠT THƯ MỤC / TỆP TIN BẰNG FILE .BAT (Tab 15)</span>
              </h3>
              <div className="space-y-2 text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  <strong>❓ Vì sao trước đây chạy file .bat không thấy đổi tên?</strong>
                  <br />
                  Khi tạo thư mục mới trên Windows, tên mặc định là <code>New folder</code>, <code>New folder (2)</code>, <code>New folder (3)</code>... hoặc tên cũ có dấu Tiếng Việt khác nhau. Nếu file script cũ so sánh đúng tên gốc thì sẽ báo lỗi không tìm thấy.
                </p>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-lg border border-amber-200 dark:border-amber-900/60">
                  <div className="font-bold text-amber-800 dark:text-amber-200 mb-1">
                    ✅ QUY TRÌNH 4 BƯỚC THỰC HIỆN ĐỔI TÊN THÀNH CÔNG 100%:
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300">
                    <li>Vào <strong>Tab 15</strong> ➔ Chọn phân hệ <strong>"📁 THƯ MỤC / TỆP TIN"</strong> ➔ Nhập câu lệnh yêu cầu (VD: <em>"Tạo 35 thư mục từ Tuần 1 đến Tuần 35 môn Toán 9"</em>) ➔ Bấm <strong>"✨ AI Xử Lý & Hiểu Yêu Cầu Đổi Tên"</strong>.</li>
                    <li>Bấm nút màu vàng nổi bật: <strong>"⚡ Tải Script Đổi Tên TỰ ĐỘNG (.BAT)"</strong> (sẽ tải về file <code>Doi_Ten_ThuMuc_TuDong.bat</code>).</li>
                    <li><strong>Copy (Sao chép) file .bat vừa tải vào BÊN TRONG thư mục gốc</strong> chứa các thư mục con cần đổi tên (Ví dụ: đặt vào trong thư mục <code>D:\GiaoAn_Toan_2024\</code>).</li>
                    <li><strong>Nhấp đúp chuột (Double click)</strong> vào file <code>Doi_Ten_ThuMuc_TuDong.bat</code>. Nếu Windows hiện thông báo bảo vệ <em>"Windows protected your PC"</em>, hãy bấm <strong>"More info" ➔ "Run anyway"</strong>. Cửa sổ màu xanh lam sẽ tự động duyệt toàn bộ các thư mục hiện có và đổi tên sang tên mới chỉ trong 1 giây!</li>
                    <li><em>Mẹo phụ:</em> Nếu không muốn chạy file .bat, Thầy Cô có thể bấm nút <strong>"Tải ZIP Thư Mục Mẫu"</strong> để giải nén ngay cây thư mục hoàn chỉnh đã được đặt tên chuẩn.</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Tip 6: Word Formatting Presets */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-2 col-span-1 md:col-span-2">
              <h3 className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5 text-sm">
                <FileCode2 className="w-4 h-4 text-blue-600" />
                <span>6. THẨM ĐỊNH THỂ THỨC VĂN BẢN WORD (.DOCX) & TÙY BIẾN MẪU RIÊNG (Tab 15)</span>
              </h3>
              <div className="space-y-2 text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  Hệ thống cho phép thẩm định và chuẩn hóa hàng loạt file Word (.docx) theo 4 mẫu chuẩn quốc gia:
                  <br />• <strong>Nghị định 30/2020/NĐ-CP</strong>: Chuẩn văn bản hành chính nhà nước (Lề trên 20-25mm, dưới 20-25mm, trái 30-35mm, phải 15-20mm, font Times New Roman cỡ 13-14, dãn dòng 1.2-1.5 lines).
                  <br />• <strong>Hướng dẫn 05-HD/VPTW</strong>: Chuẩn thể thức văn bản Đảng.
                  <br />• <strong>Chuẩn Kế hoạch bài dạy 5512/BGDĐT & 3666</strong>: Bảng hoạt động 2 cột, viền đen nét đơn rõ nét, không bị ngắt trang giữa hàng.
                  <br />• <strong>Chuẩn Sáng kiến kinh nghiệm (SKKN)</strong>: Lề trái 35mm phục vụ đóng gáy sách bìa cứng, thụt lề đầu dòng 1.27cm.
                </p>
                <p>
                  <strong>⭐ Tùy Biến Mẫu Riêng:</strong> Bấm nút <strong>"+ Tạo Mẫu Định Dạng Mới"</strong> tại Tab 15 để thiết lập lề trang, font chữ, cỡ chữ tiêu đề/nội dung riêng cho trường học hoặc tổ chuyên môn của Thầy Cô. Thầy Cô có thể bấm <strong>"Lưu Mẫu"</strong> để lưu vĩnh viễn trên máy hoặc <strong>"Xuất File Mẫu (.json)"</strong> để gửi cho đồng nghiệp nạp vào dùng chung!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: LICENSE POLICY & TRIAL CODES */}
      {activeSection === 'license' && (
        <div className="space-y-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span>CHÍNH SÁCH BẢN QUYỀN & MÃ DÙNG THỬ (TRIAL)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Quy định sử dụng bản quyền và cơ chế cấp mã trải nghiệm của phần mềm
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] border border-emerald-300 dark:border-emerald-800">
                  MÃ CHÍNH THỨC
                </span>
                <span>Khóa Cố Định Theo Thiết Bị (1 Máy)</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Mỗi mã bản quyền chính thức được gắn chặt với Mã Thiết Bị (Device ID: <code>PKK-XXXXXX</code>) của máy tính quý Thầy Cô. Mã có hiệu lực trọn đời hoặc theo gói niên khóa đã đăng ký. Khi đổi máy tính mới, Admin Thầy Trường có thể hỗ trợ mở khóa để chuyển bản quyền sang máy mới.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[11px] border border-purple-300 dark:border-purple-800">
                  MÃ DÙNG THỬ (TRIAL)
                </span>
                <span>Chạy Được Trên Mọi Máy Tính (Đa Thiết Bị)</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Dành cho các đợt tập huấn chuyên môn, hội đồng bộ môn hoặc quý Thầy Cô muốn dùng thử toàn diện trước khi đăng ký. Mã dùng thử có định dạng <code>DDMMYY-TRIAL-CHECKSUM-PRO</code>, có thể kích hoạt trên <strong>bất kỳ máy tính nào</strong> và tự động khóa lại khi hết thời hạn quy định.
              </p>
            </div>
          </div>

          {/* Author Contact Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-amber-500/40 text-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                THÔNG TIN TÁC GIẢ & HỖ TRỢ KỸ THUẬT 24/7
              </div>
              <div className="text-base font-extrabold text-white">
                Thầy Cấn Văn Trường — THCS Phùng Khắc Khoan, Hà Nội
              </div>
              <div className="text-xs text-slate-300">
                Hotline / Zalo: <strong className="text-amber-300">0988.302.636</strong> | Email: <code>canvantruong2010@gmail.com</code>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyZalo}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow flex items-center gap-1.5"
              >
                {copiedZalo ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedZalo ? 'Đã chép SĐT Zalo' : 'Sao chép Zalo Thầy Trường'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: VISUAL TEMPLATES & IMAGES GALLERY */}
      {activeSection === 'gallery_templates' && (
        <div className="space-y-6 text-slate-800 dark:text-slate-200 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-400" />
                <span>THƯ VIỆN CÁC MẪU CHUẨN SƯ PHẠM & HÌNH ẢNH MINH HỌA HỆ THỐNG</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Xem trực quan cấu trúc biểu mẫu giáo án 5512, tiểu học 2345, đề thi 2025, phiếu trắc nghiệm, SKKN và đồ họa TikZ
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold self-start sm:self-auto">
              8 Bộ Mẫu Chuẩn Bộ GD&ĐT
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                id: 'khbd_5512',
                title: 'Mẫu Kế hoạch Bài dạy (KHBD) Chuẩn Công văn 5512/BGDĐT',
                level: 'THCS & THPT (Lớp 6 - 12)',
                badge: 'CV 5512/BGDĐT',
                badgeColor: 'indigo',
                description: 'Cấu trúc hoàn chỉnh 4 hoạt động: Mở đầu, Hình thành kiến thức mới, Luyện tập, Vận dụng. Bảng đôi 2 cột Hoạt động của GV - Hoạt động của HS, tích hợp năng lực số và mã TikZ.',
                svgIcon: 'file-text',
                previewHighlights: [
                  'I. MỤC TIÊU: Kiến thức, Năng lực chung, Năng lực đặc thù & Phẩm chất',
                  'II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU: GV & HS, mô phỏng tương tác',
                  'III. TIẾN TRÌNH DẠY HỌC: Bảng 2 cột chuẩn 4 bước sư phạm (Chuyển giao ➔ Thực hiện ➔ Báo cáo thảo luận ➔ Kết luận nhận định)',
                  'Tích hợp sẵn khung năng lực số NLS (TT 02/2025) và Khung giáo dục AI'
                ],
                targetTab: 8
              },
              {
                id: 'khbd_2345',
                title: 'Mẫu Kế hoạch Bài dạy Tiểu học Chuẩn Công văn 2345/BGDĐT',
                level: 'Tiểu học (Lớp 1 - 5)',
                badge: 'CV 2345/BGDĐT',
                badgeColor: 'emerald',
                description: 'Mẫu thiết kế chuyên sâu cho các môn Toán, Tiếng Việt, Tự nhiên & Xã hội, Khoa học, Lịch sử - Địa lí cấp Tiểu học với ngôn từ gần gũi, nhiều trò chơi và hoạt động trải nghiệm.',
                svgIcon: 'book',
                previewHighlights: [
                  '1. Khởi động (Trò chơi, bài hát, câu đố khởi động hứng thú)',
                  '2. Khám phá (Trực quan hóa qua tranh ảnh, đồ dùng học tập, video)',
                  '3. Luyện tập - Thực hành (Bài tập cá nhân, nhóm đôi, trò chơi học tập)',
                  '4. Vận dụng - Trải nghiệm (Liên hệ thực tế đời sống, giải quyết tình huống)'
                ],
                targetTab: 8
              },
              {
                id: 'dethi_2025',
                title: 'Mẫu Cấu trúc Đề thi Tốt nghiệp THPT Quốc gia 2025 Mới',
                level: 'Khảo thí & Đề thi 2025',
                badge: 'Cấu trúc THPT 2025',
                badgeColor: 'amber',
                description: 'Cập nhật chuẩn 100% định dạng đề thi mới của Bộ GD&ĐT gồm 4 phần: Trắc nghiệm 4 lựa chọn, Trắc nghiệm Đúng/Sai 4 ý, Câu hỏi Trả lời ngắn và Tự luận phân hóa.',
                svgIcon: 'grid',
                previewHighlights: [
                  'Phần I: 12 câu trắc nghiệm nhiều lựa chọn (Nhận biết, Thông hiểu)',
                  'Phần II: 4 câu hỏi Đúng/Sai (Mỗi câu gồm 4 ý a, b, c, d phân hóa)',
                  'Phần III: 6 câu hỏi Trắc nghiệm trả lời ngắn (Vận dụng cao, tư duy mở)',
                  'Kèm Ma trận 4 mức độ nhận thức & Bảng đặc tả chi tiết điểm số (Tổng 10.0đ)'
                ],
                targetTab: 4
              },
              {
                id: 'phieu_to_tn',
                title: 'Mẫu Phiếu Trả lời Trắc nghiệm Chuẩn Khổ A4 (Sở GD&ĐT Hà Nội)',
                level: 'Phiếu Tô & AI Vision',
                badge: 'Phiếu Tô Chuẩn A4',
                badgeColor: 'rose',
                description: 'Phiếu làm bài trắc nghiệm chuẩn 1 trang A4 tích hợp số báo danh, mã đề, 40-50 câu hỏi, căn chỉnh góc marker để AI Vision quét chấm tự động trong 3 giây.',
                svgIcon: 'camera',
                previewHighlights: [
                  'Khổ A4 dọc, viền bo chuẩn tỉ lệ quang học chống lệch góc khi chụp ảnh',
                  'Khung thông tin học sinh: Họ tên, Lớp, Trường, Hội đồng thi, Ngày thi',
                  'Ô tô Số báo danh (6 chữ số) và Mã đề thi (3 chữ số)',
                  'Phần tô đáp án tròn chuẩn font quang học, tương thích hoàn toàn Tab 6'
                ],
                targetTab: 6
              },
              {
                id: 'skkn_chuan',
                title: 'Mẫu Sáng kiến Kinh nghiệm (SKKN) & Báo cáo Chuyên đề Sư phạm',
                level: 'Nghiên cứu Sư phạm & Hội đồng Thẩm định',
                badge: 'SKKN Chuẩn Sở GD&ĐT',
                badgeColor: 'purple',
                description: 'Mẫu trình bày Sáng kiến kinh nghiệm chuẩn cấp Quận/Huyện/Tỉnh: Trang bìa, mục lục, lý do chọn đề tài, cơ sở lý luận - thực tiễn, các biện pháp thực hiện và bảng số liệu thực nghiệm.',
                svgIcon: 'award',
                previewHighlights: [
                  'Trang bìa chuẩn: Sở GD&ĐT, Tên đề tài, Tác giả, Chức vụ, Năm học',
                  'Phần 1: ĐẶT VẤN ĐỀ (Lý do chọn đề tài, Mục đích, Đối tượng, Phạm vi)',
                  'Phần 2: NỘI DUNG (Cơ sở lý luận, Thực trạng, Các biện pháp thực hiện)',
                  'Phần 3: KẾT QUẢ THỰC NGHIỆM & BẢNG ĐỐI CHỨNG (Trước - Sau áp dụng)',
                  'Phần 4: BÀI HỌC KINH NGHIỆM & KIẾN NGHỊ'
                ],
                targetTab: 15
              },
              {
                id: 'ke_hoach_to_cm',
                title: 'Mẫu Kế hoạch Tổ Chuyên môn & Giáo viên (Phụ lục 1, 2, 3)',
                level: 'Tổ Chuyên môn & Quản lý Nhà trường',
                badge: 'CV 5512 & 3666',
                badgeColor: 'teal',
                description: 'Bộ biểu mẫu kế hoạch dạy học môn học của tổ bộ môn (PL1), kế hoạch tổ chức hoạt động giáo dục (PL2) và kế hoạch giáo dục cá nhân của giáo viên (PL3).',
                svgIcon: 'calendar',
                previewHighlights: [
                  'Phụ lục 1: Kế hoạch dạy học các môn học theo tuần, tiết, bài, thiết bị dạy học',
                  'Phụ lục 2: Kế hoạch tổ chức các hoạt động ngoại khóa, chuyên đề, trải nghiệm STEM',
                  'Phụ lục 3: Kế hoạch giáo dục của giáo viên (Nhiệm vụ, chỉ tiêu, kiểm tra đánh giá)',
                  'Xuất bảng biểu Word (.docx) căn lề 2cm-2.5cm chuẩn Nghị định 30/2020'
                ],
                targetTab: 8
              },
              {
                id: 'tikz_studio',
                title: 'Mẫu Bản vẽ Đồ họa Vector TikZ & Hình học Không gian',
                level: 'Toán học - Vật lí - Hóa học',
                badge: 'TikZ Studio Vector',
                badgeColor: 'orange',
                description: 'Thư viện hình vẽ vector hình học phẳng, hình học không gian (chóp, lăng trụ, nón, trụ, cầu), đồ thị hàm số và sơ đồ thí nghiệm khoa học sắc nét không vỡ hạt.',
                svgIcon: 'code',
                previewHighlights: [
                  'Hình học không gian: Chóp tứ giác đều S.ABCD, Lăng trụ đứng tam giác ABC.A\'B\'C\'',
                  'Đồ thị hàm số: Parabol bậc 2, Hàm phân thức bậc nhất, Hàm số lượng giác',
                  'Sơ đồ thí nghiệm Vật lý - Hóa học: Mạch điện, bình điện phân, ống nghiệm',
                  'Mã TikZ độc lập, nhúng trực tiếp vào Word hoặc xuất ảnh PNG 300 DPI'
                ],
                targetTab: 9
              },
              {
                id: 'format_checker',
                title: 'Mẫu Thẩm định & Chuẩn hóa Thể thức Văn bản Word Nghị định 30',
                level: 'Thể thức Văn bản & Hành chính',
                badge: 'Nghị định 30/2020/NĐ-CP',
                badgeColor: 'cyan',
                description: 'Bảng tiêu chuẩn kỹ thuật văn bản: Font Times New Roman, Cỡ chữ 13-14pt, Căn lề Trái 3cm - Phải 2cm - Trên/Dưới 2cm, Dãn dòng 1.2-1.5 lines, Bảng viền nét đơn.',
                svgIcon: 'folder-tree',
                previewHighlights: [
                  'Kiểm tra tự động 12 tiêu chí thể thức văn bản hành chính và giáo án',
                  'Tự động sửa lỗi dính chữ, lỗi khoảng trắng trước dấu câu (. , : ; ! ?)',
                  'Chuẩn hóa viền bảng biểu nét đơn thanh mảnh (Single border 0.5pt)',
                  'Tải file mẫu JSON cấu hình thể thức riêng của trường/phòng GD&ĐT'
                ],
                targetTab: 15
              }
            ].map(tpl => (
              <div
                key={tpl.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/60 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-xl group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                      {tpl.badge}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {tpl.level}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug">
                    {tpl.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {tpl.description}
                  </p>

                  <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Đặc điểm cấu trúc nổi bật:</span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-slate-400">
                      {tpl.previewHighlights.map((hl, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{hl}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTemplateModal(tpl)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Xem Chi Tiết Mẫu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateTab && onNavigateTab(tpl.targetTab)}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
                  >
                    <span>Đến Tab {tpl.targetTab}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Preview for Selected Template */}
      {selectedTemplateModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedTemplateModal(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl text-slate-100 relative animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                  {selectedTemplateModal.badge}
                </span>
                <span className="text-xs text-slate-400">{selectedTemplateModal.level}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTemplateModal(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <h3 className="text-lg font-bold text-white">
              {selectedTemplateModal.title}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedTemplateModal.description}
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-amber-300">
                📋 Cấu Trúc Khung Mẫu Chuẩn:
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {selectedTemplateModal.previewHighlights.map((h: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedTemplateModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetTab = selectedTemplateModal.targetTab;
                  setSelectedTemplateModal(null);
                  if (onNavigateTab) onNavigateTab(targetTab);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <span>Mở Công Cụ Soạn Thảo Tab {selectedTemplateModal.targetTab}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: AUTHOR PROFILE & ADMIN MANAGEMENT HUB */}
      {activeSection === 'author_admin' && (
        <div className="space-y-6 text-slate-800 dark:text-slate-200">
          {/* Main Author Showcase Profile Card */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl border border-purple-500/40 shadow-2xl text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Photo Avatar */}
              <div className="relative group shrink-0">
                {adminProfile.photoUrl ? (
                  <img
                    src={adminProfile.photoUrl}
                    alt={adminProfile.fullName}
                    className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl object-cover border-4 border-amber-400 shadow-2xl shadow-purple-950/60"
                  />
                ) : (
                  <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-tr from-purple-800 to-indigo-700 border-4 border-amber-400/80 flex flex-col items-center justify-center text-white shadow-2xl">
                    <User className="w-12 h-12 text-amber-300 mb-1" />
                    <span className="font-extrabold text-sm tracking-wider">THẦY TRƯỜNG</span>
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow border-2 border-slate-900 uppercase">
                  Tác Giả
                </div>
              </div>

              {/* Profile Details */}
              <div className="space-y-3 flex-1 text-center md:text-left">
                <div>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                      {adminProfile.fullName || 'Thầy Cấn Văn Trường'}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
                      ADMIN MASTER
                    </span>
                  </div>
                  <p className="text-xs text-amber-300 font-semibold mt-0.5">
                    {adminProfile.title || 'Giáo viên - Tác giả Hệ thống AI Lesson Planner Pro'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <School className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>{adminProfile.school || 'THCS Phùng Khắc Khoan, xã Tây Phương, Hà Nội'}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Hotline / Zalo: <strong className="text-amber-300">{adminProfile.zalo || '0988.302.636'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Email: <code>{adminProfile.email || 'canvantruong2010@gmail.com'}</code></span>
                  </div>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <Award className="w-4 h-4 text-yellow-400 shrink-0" />
                    <span>{adminProfile.achievements || 'Tiên phong Chuyển đổi số Sư phạm GDPT 2018'}</span>
                  </div>
                </div>

                {adminProfile.bio && (
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-200 leading-relaxed italic">
                    "{adminProfile.bio}"
                  </div>
                )}

                {/* Direct Action Buttons */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                  <button
                    onClick={handleCopyZalo}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-all"
                  >
                    {copiedZalo ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedZalo ? 'Đã chép Zalo' : 'Sao chép Zalo Thầy Trường'}</span>
                  </button>

                  <a
                    href={`https://zalo.me/${(adminProfile.zalo || '0988302636').replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Mở Chat Zalo</span>
                  </a>

                  {!isAdminUnlocked && (
                    <button
                      onClick={() => setIsAdminUnlocked(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700/60 font-bold text-xs flex items-center gap-1.5 transition-all"
                    >
                      <Lock className="w-3.5 h-3.5 text-purple-300" />
                      <span>Đăng nhập Quản Trị Admin</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ADMIN MANAGEMENT CONSOLE (Unlocked when Admin key is present or entered) */}
          {!isAdminUnlocked ? (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                KHU VỰC QUẢN TRỊ DÀNH CHO ADMIN THẦY TRƯỜNG
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Nhập mã khóa SuperAdmin (<code>CANVANTRUONGVIP1990</code>) để mở quyền cập nhật ảnh đại diện, thông tin hồ sơ và quản lý API Keys dùng chung trên toàn hệ thống.
              </p>

              <form onSubmit={handleAdminLogin} className="space-y-2 pt-2">
                <input
                  type="password"
                  value={adminPassInput}
                  onChange={e => setAdminPassInput(e.target.value)}
                  placeholder="Nhập khóa Admin CANVANTRUONGVIP1990..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-center font-mono text-xs focus:border-purple-500 focus:outline-none"
                />
                {adminAuthError && (
                  <p className="text-rose-500 font-bold text-xs">{adminAuthError}</p>
                )}
                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Unlock className="w-4 h-4" />
                  <span>MỞ KHÓA BẢNG ĐIỀU KHIỂN ADMIN</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top Admin Status Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold">ĐÃ MỞ KHÓA QUYỀN QUẢN TRỊ VIÊN SUPERADMIN (THẦY TRƯỜNG)</span>
                    <p className="text-[11px] opacity-85">Mọi thay đổi về ảnh đại diện và API Key sẽ lập tức cập nhật lên Cloud Firestore cho toàn bộ giáo viên.</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAdminUnlocked(false)}
                  className="px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold text-[11px]"
                >
                  Khóa lại
                </button>
              </div>

              {/* PANEL 1: UPDATE ADMIN PHOTO & PROFILE */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>1. CẬP NHẬT ẢNH ĐẠI DIỆN & THÔNG TIN TÁC GIẢ LÊN CLOUD</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Ảnh và thông tin này được hiển thị trang trọng trên Header Banner, Trang giới thiệu và Bản quyền.
                    </p>
                  </div>
                </div>

                {/* Photo Upload & Preview */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative shrink-0">
                    {adminProfile.photoUrl ? (
                      <img
                        src={adminProfile.photoUrl}
                        alt="Preview Avatar"
                        className="w-28 h-28 rounded-2xl object-cover border-2 border-purple-500 shadow-lg"
                      />
                    ) : (
                      <div className="w-28 h-28 rounded-2xl bg-purple-100 dark:bg-purple-950/60 border-2 border-dashed border-purple-400 dark:border-purple-600 flex flex-col items-center justify-center text-purple-600 dark:text-purple-300">
                        <ImageIcon className="w-8 h-8 opacity-60" />
                        <span className="text-[10px] mt-1 font-semibold">Chưa có ảnh</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 flex-1 text-center sm:text-left">
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      Tải Ảnh Đại Diện Từ Máy Tính Của Thầy Trường:
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Chọn file ảnh bất kỳ (.JPG, .PNG, .WEBP). Hệ thống tự động căn chỉnh và nén chất lượng cao sắc nét để lưu trữ bền vững trên đám mây Firestore.
                    </p>

                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{adminProfile.photoUrl ? 'Chọn Ảnh Khác Từ Máy' : 'Tải Ảnh Lên Từ Máy Tính'}</span>
                      </button>

                      {adminProfile.photoUrl && (
                        <button
                          type="button"
                          onClick={() => setAdminProfile(prev => ({ ...prev, photoUrl: '' }))}
                          className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 text-xs font-semibold"
                        >
                          Xóa ảnh này
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Edit Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Họ và Tên Tác Giả:
                    </label>
                    <input
                      type="text"
                      value={adminProfile.fullName}
                      onChange={e => setAdminProfile(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-semibold focus:border-purple-500 focus:outline-none"
                      placeholder="VD: Thầy Cấn Văn Trường"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Chức danh & Chuyên môn:
                    </label>
                    <input
                      type="text"
                      value={adminProfile.title}
                      onChange={e => setAdminProfile(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none"
                      placeholder="VD: Giáo viên - Tác giả Hệ thống AI Lesson Planner Pro"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Đơn vị công tác & Địa chỉ:
                    </label>
                    <input
                      type="text"
                      value={adminProfile.school}
                      onChange={e => setAdminProfile(prev => ({ ...prev, school: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none"
                      placeholder="VD: Trường THCS Phùng Khắc Khoan, xã Tây Phương, TP. Hà Nội"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Số điện thoại / Zalo hỗ trợ:
                    </label>
                    <input
                      type="text"
                      value={adminProfile.zalo}
                      onChange={e => setAdminProfile(prev => ({ ...prev, zalo: e.target.value, phone: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-cyan-600 dark:text-cyan-300 font-mono font-bold focus:border-purple-500 focus:outline-none"
                      placeholder="VD: 0988.302.636"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Email liên hệ:
                    </label>
                    <input
                      type="email"
                      value={adminProfile.email}
                      onChange={e => setAdminProfile(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none"
                      placeholder="VD: canvantruong2010@gmail.com"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Lời tự bạch / Thông điệp gửi Thầy Cô giáo toàn quốc:
                    </label>
                    <textarea
                      value={adminProfile.bio}
                      onChange={e => setAdminProfile(prev => ({ ...prev, bio: e.target.value }))}
                      rows={2}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none"
                      placeholder="Lời giới thiệu gửi quý Thầy Cô..."
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Thành tích & Danh hiệu sư phạm:
                    </label>
                    <input
                      type="text"
                      value={adminProfile.achievements}
                      onChange={e => setAdminProfile(prev => ({ ...prev, achievements: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none"
                      placeholder="VD: Giáo viên Dạy Giỏi - Tiên phong Chuyển đổi số Sư phạm GDPT 2018"
                    />
                  </div>
                </div>

                {profileSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}

                <button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/30 text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingProfile ? 'Đang lưu lên Cloud Firestore...' : 'LƯU HỒ SƠ & ẢNH ĐẠI DIỆN LÊN CLOUD FIRESTORE'}</span>
                </button>
              </div>

              {/* PANEL 2: SHARED API KEYS CLOUD POOL */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Key className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>2. QUẢN LÝ KHO API KEY GEMINI DÙNG CHUNG TOÀN HỆ THỐNG</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Thêm các khóa API Gemini để chia sẻ tự động cho toàn bộ giáo viên, luân phiên chống quá tải khi soạn giáo án và chấm bài thi.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-mono font-bold text-xs">
                    {activeSharedCount} Key Đang Bật
                  </span>
                </div>

                {/* Add Keys Form */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    DÁN CÁC MÃ API KEY MỚI (MỖI DÒNG 1 KEY HOẶC CÁCH NHAU BẰNG DẤU PHẨY):
                  </label>
                  <textarea
                    value={rawKeysInput}
                    onChange={e => setRawKeysInput(e.target.value)}
                    placeholder="Dán các API Key (bắt đầu bằng AIzaSy... hoặc AQ.Ab8RN...)"
                    rows={3}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-mono text-cyan-600 dark:text-cyan-300 text-xs focus:border-emerald-500 focus:outline-none"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Tạo key miễn phí tại: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 font-semibold underline">aistudio.google.com</a>
                    </span>

                    <button
                      onClick={handleAddSharedKeys}
                      disabled={isAddingKeys}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAddingKeys ? 'Đang thêm...' : '+ Thêm Vào Kho Dùng Chung'}</span>
                    </button>
                  </div>

                  {keyActionMsg && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{keyActionMsg}</span>
                    </div>
                  )}
                </div>

                {/* List of Shared Keys */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Danh Sách Các API Key Đang Lưu Trữ ({sharedKeys.length}):
                    </span>
                    <button
                      onClick={async () => {
                        const updated = await fetchSharedApiKeys();
                        setSharedKeys(updated);
                      }}
                      className="text-[11px] text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-300 flex items-center gap-1 font-semibold"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Làm mới</span>
                    </button>
                  </div>

                  {sharedKeys.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
                      Chưa có API Key nào trong kho đám mây. Hãy dán API Key vào ô trên để chia sẻ cho Thầy Cô!
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {sharedKeys.map((item, idx) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white text-xs">{item.label || `Key #${idx + 1}`}</span>
                              <span
                                className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                                  item.status === 'active'
                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                }`}
                              >
                                {item.status === 'active' ? 'ĐANG BẬT' : 'TẠM DỪNG'}
                              </span>

                              {item.testStatus === 'valid' && (
                                <span className="px-1.5 py-0.2 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 text-[10px] border border-cyan-300 dark:border-cyan-800 flex items-center gap-1 font-bold">
                                  <Zap className="w-2.5 h-2.5 text-cyan-500" />
                                  <span>Live OK</span>
                                </span>
                              )}
                              {item.testStatus === 'invalid' && (
                                <span className="px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] border border-rose-300 dark:border-rose-800 font-bold">
                                  Lỗi/Die
                                </span>
                              )}
                            </div>

                            <div className="font-mono text-cyan-600 dark:text-cyan-300 text-[11px] truncate">
                              {maskKey(item.key)}
                            </div>

                            <div className="text-[10px] text-slate-400">
                              Thêm lúc: {item.createdAt} {item.lastTestedAt ? `| Test gần nhất: ${item.lastTestedAt}` : ''}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleTestSharedKey(item)}
                              disabled={testingKeyId === item.id}
                              className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-cyan-700 dark:text-cyan-300 text-[11px] font-bold flex items-center gap-1"
                              title="Kiểm tra kết nối Gemini"
                            >
                              <Activity className={`w-3 h-3 ${testingKeyId === item.id ? 'animate-spin' : ''}`} />
                              <span>{testingKeyId === item.id ? 'Test...' : 'Test Key'}</span>
                            </button>

                            <button
                              onClick={() => handleToggleKeyStatus(item)}
                              className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-300"
                              title={item.status === 'active' ? 'Tạm dừng key này' : 'Bật lại key này'}
                            >
                              {item.status === 'active' ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                            </button>

                            <button
                              onClick={() => handleDeleteSharedKey(item.id)}
                              className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400"
                              title="Xóa vĩnh viễn"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* PANEL 3: GOOGLE DRIVE REPOSITORY INTEGRATION */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <span>3. CẤU HÌNH KHO LƯU TRỮ GOOGLE DRIVE THẦY CẤN VĂN TRƯỜNG</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Giúp giáo viên tải trực tiếp giáo án vào thư mục Google Drive để lưu trữ lâu dài và chia sẻ tài nguyên rộng rãi.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowDriveUploadModal(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all"
                      title="Mở giao diện tải tài liệu đã hoàn chỉnh lên Google Drive"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>📤 Tải Tài Liệu Lên Drive</span>
                    </button>
                    <a
                      href={driveConfig.folderUrl || `https://drive.google.com/drive/folders/${DEFAULT_DRIVE_FOLDER_ID}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 font-bold text-xs flex items-center gap-1.5"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Mở Kho Drive</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Folder ID display */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Google Drive Folder ID (Đã tích hợp):
                      </label>
                      <input
                        type="text"
                        value={driveConfig.folderId || DEFAULT_DRIVE_FOLDER_ID}
                        onChange={e => setDriveConfig(prev => ({
                          ...prev,
                          folderId: e.target.value,
                          folderUrl: `https://drive.google.com/drive/folders/${e.target.value.trim()}`
                        }))}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-mono text-cyan-600 dark:text-cyan-300 text-xs focus:border-sky-500 focus:outline-none"
                        placeholder={DEFAULT_DRIVE_FOLDER_ID}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Đường dẫn Webhook (Google Apps Script URL):
                      </label>
                      <input
                        type="url"
                        value={driveConfig.webhookUrl || ''}
                        onChange={e => setDriveConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-mono text-cyan-600 dark:text-cyan-300 text-xs focus:border-sky-500 focus:outline-none"
                        placeholder="https://script.google.com/macros/s/.../exec"
                      />
                    </div>
                  </div>

                  {driveSuccessMsg && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{driveSuccessMsg}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleSaveDriveConfig}
                      disabled={isSavingDriveConfig}
                      className="flex-1 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-sky-900/30 text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingDriveConfig ? 'Đang lưu cấu hình Drive...' : 'LƯU CẤU HÌNH DRIVE VÀO HỆ THỐNG'}</span>
                    </button>

                    <button
                      onClick={handleTestAndInitDriveFolders}
                      disabled={isTestingDriveWebhook || !driveConfig.webhookUrl}
                      className="py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/30 text-xs flex items-center justify-center gap-2 transition-all"
                      title="Kiểm tra kết nối và tự động khởi tạo toàn bộ cây thư mục cấp học trên Google Drive"
                    >
                      <Sparkles className={`w-4 h-4 ${isTestingDriveWebhook ? 'animate-spin' : ''}`} />
                      <span>{isTestingDriveWebhook ? 'Đang khởi tạo cây thư mục...' : '⚡ TỰ ĐỘNG TẠO CÂY THƯ MỤC TRÊN DRIVE'}</span>
                    </button>
                  </div>

                  {driveTestStatus && (
                    <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                      driveTestStatus.success
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                        : 'bg-rose-950/80 border-rose-500 text-rose-300'
                    }`}>
                      {driveTestStatus.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-bold">{driveTestStatus.success ? 'Khởi tạo thư mục thành công!' : 'Chưa thể tạo tự động thư mục'}</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed opacity-90">{driveTestStatus.message}</p>
                      </div>
                    </div>
                  )}

                  {/* Warning & Solution Guide */}
                  <div className="p-4 rounded-2xl bg-amber-950/40 border-2 border-amber-500/80 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-amber-300 font-extrabold text-sm">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                      <span>⚠️ TẠI SAO TẢI LÊN CHƯA TỰ CHIA THƯ MỤC VÀ CÁCH KHẮC PHỤC TRONG 30 GIÂY:</span>
                    </div>
                    <p className="text-amber-100 text-xs leading-relaxed">
                      <strong>Nguyên nhân:</strong> Khi Thầy dán mã mới vào Google Apps Script rồi bấm Lưu, Google vẫn chạy <strong>Phiên bản cũ (Version 1 - phiên bản chưa có lệnh tạo thư mục con)</strong>.
                    </p>
                    <div className="bg-black/40 p-3 rounded-xl border border-amber-500/40 space-y-1.5 text-xs text-amber-200">
                      <p className="font-bold text-amber-300">✅ 3 Bước Cập Nhật Phiên Bản Mới (Bắt Buộc):</p>
                      <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-200">
                        <li>Vào <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-sky-300 underline font-bold">script.google.com</a> ➔ Dán đè toàn bộ mã bên dưới ➔ Bấm <strong>Lưu (Ctrl+S)</strong>.</li>
                        <li>Bấm nút <strong>Triển khai (Deploy)</strong> ở góc phải trên ➔ Chọn <strong>Quản lý bản triển khai (Manage deployments)</strong>.</li>
                        <li>Bấm biểu tượng cây bút chì ✏️ <strong>Chỉnh sửa (Edit)</strong> ➔ Tại dòng <strong>Phiên bản (Version)</strong>, bấm chọn <strong>"Mới" (New version)</strong> ➔ Nhấn <strong>Triển khai (Deploy)</strong>.</li>
                      </ol>
                    </div>
                  </div>

                  {/* Code Snippet and Guide */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Code className="w-4 h-4 text-sky-500" />
                        MÃ NGUỒN GOOGLE APPS SCRIPT PHIÊN BẢN MỚI (TỰ ĐỘNG TẠO THƯ MỤC):
                      </span>
                      <button
                        onClick={handleCopyAppsScript}
                        className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all"
                      >
                        {copiedScript ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                            Đã sao chép!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Sao chép toàn bộ mã Script
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="p-3 bg-slate-900 text-cyan-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60 border border-slate-800">
                      {APPS_SCRIPT_CODE}
                    </pre>

                    <div className="p-4 bg-sky-900/90 dark:bg-slate-900 border-2 border-sky-400 dark:border-sky-500 rounded-xl space-y-2 text-xs shadow-md">
                      <p className="font-bold text-sm text-amber-300 dark:text-amber-300 flex items-center gap-1.5">
                        <span>⚡ Hướng dẫn 4 bước cài đặt Webhook trên Google Apps Script:</span>
                      </p>
                      <ol className="list-decimal list-inside space-y-1.5 text-xs text-white dark:text-slate-100 font-medium leading-relaxed">
                        <li>Truy cập <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-amber-300 hover:text-amber-200 underline font-bold px-1 bg-black/30 rounded">script.google.com</a> bằng tài khoản Gmail của Thầy (<span className="text-sky-200 font-bold">canvantruong2010@gmail.com</span>) và tạo dự án mới.</li>
                        <li>Dán toàn bộ mã ở trên vào tệp <code className="bg-black/50 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">Mã.gs</code> (hoặc <code className="bg-black/50 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">Code.gs</code>) rồi nhấn <strong className="text-amber-300">Lưu</strong> (Ctrl+S).</li>
                        <li>Nhấn nút <strong className="text-sky-200">Triển khai (Deploy)</strong> &gt; <strong className="text-sky-200">Triển khai mới (New deployment)</strong> &gt; Chọn loại <strong className="text-emerald-300">Ứng dụng web (Web app)</strong>.</li>
                        <li>Mục <em className="text-amber-200 font-semibold">"Ai có quyền truy cập" (Who has access)</em>: Chọn <strong className="text-emerald-300">Bất kỳ ai (Anyone)</strong> &gt; Nhấn <strong className="text-sky-200">Triển khai</strong> &gt; Cấp quyền truy cập Drive &gt; Sao chép link Web URL dán vào ô bên trên.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Community Drive Modal */}
      <CommunityDriveModal
        isOpen={showDriveUploadModal}
        onClose={() => setShowDriveUploadModal(false)}
      />
    </div>
  );
};

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
