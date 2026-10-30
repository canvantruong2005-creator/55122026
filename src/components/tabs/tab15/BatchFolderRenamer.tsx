import React, { useState, useRef } from 'react';
import {
  FolderArchive,
  FolderPlus,
  Play,
  Download,
  Copy,
  Check,
  Sparkles,
  Sliders,
  Trash2,
  HelpCircle,
  FileCode2,
  FolderTree,
  Terminal,
  FolderOpen,
  ArrowRight,
  Archive,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
  Edit3,
  Bot,
  Lightbulb,
  CornerDownRight,
  Files,
  Upload
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { FolderRenameItem, FolderRenameRule } from './types';

// Convert Vietnamese accented characters to non-accented
const removeVietnameseAccents = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

const sanitizeFileName = (name: string): string => {
  return name.replace(/[/\\?%*:|"<>]/g, '_').trim();
};

export const BatchFolderRenamer: React.FC = () => {
  // Target Type: 'folder' | 'file'
  const [targetType, setTargetType] = useState<'folder' | 'file'>('folder');

  // Input Tab: 'interactive_dir' | 'paste_list' | 'ai_prompt' | 'template_zip'
  const [activeTab, setActiveTab] = useState<'interactive_dir' | 'paste_list' | 'ai_prompt' | 'template_zip'>('ai_prompt');
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Items list
  const [items, setItems] = useState<FolderRenameItem[]>([
    { id: '1', oldName: 'New folder', newName: '01_Giao_An_Khoi_6_2024_2025', status: 'ready', aiExplanation: 'Tuần 1 / Khối 6' },
    { id: '2', oldName: 'New folder (2)', newName: '02_Giao_An_Khoi_7_2024_2025', status: 'ready', aiExplanation: 'Tuần 2 / Khối 7' },
    { id: '3', oldName: 'New folder (3)', newName: '03_Giao_An_Khoi_8_2024_2025', status: 'ready', aiExplanation: 'Tuần 3 / Khối 8' },
    { id: '4', oldName: 'New folder (4)', newName: '04_Giao_An_Khoi_9_2024_2025', status: 'ready', aiExplanation: 'Tuần 4 / Khối 9' }
  ]);

  // Uploaded real files (when targetType === 'file')
  const [uploadedFiles, setUploadedFiles] = useState<Map<string, File>>(new Map());

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState<string>(
    'Đổi các thư mục này thành tên các Khối lớp: "01_Giao_An_Khoi_6", "02_Giao_An_Khoi_7", "03_Giao_An_Khoi_8", "04_Giao_An_Khoi_9" kèm hậu tố "_2024_2025"'
  );

  // Quick Prompt Chips
  const QUICK_PROMPTS = [
    {
      label: '⚡ Đổi "New folder" thành Tuần 01, Tuần 02...',
      prompt: 'Đổi các thư mục New folder (1), New folder (2)... thành dạng: "Tuan_01_BaiHoc", "Tuan_02_BaiHoc", "Tuan_03_BaiHoc"... theo thứ tự tăng dần kèm năm học 2024_2025.'
    },
    {
      label: '⚡ Chuẩn hóa Snake_Case không dấu',
      prompt: 'Bỏ toàn bộ dấu tiếng Việt, viết hoa chữ cái đầu mỗi từ, nối bằng dấu gạch dưới (_), loại bỏ các ký tự đặc biệt thừa.'
    },
    {
      label: '⚡ Đổi tên Giáo án Toán Khối 6..9',
      prompt: 'Đổi tên các thư mục lần lượt thành: "01_Toan_Khoi_6", "02_Toan_Khoi_7", "03_Toan_Khoi_8", "04_Toan_Khoi_9" năm học 2024-2025.'
    },
    {
      label: '⚡ Đổi tên File Đề thi & Đáp án',
      prompt: 'Đổi tên các file thành dạng: DeThi_GiuaKy1_Toan_[Lớp]_[NamHoc] và Dapan_GiuaKy1_Toan_[Lớp]_[NamHoc]. Giữ nguyên đuôi mở rộng file (.docx, .pdf).'
    },
    {
      label: '⚡ Đánh số thứ tự 01_, 02_ + Viết hoa',
      prompt: 'Thêm số thứ tự 2 chữ số (01_, 02_, 03_...) vào đầu tên mỗi mục và chuyển tên thành chữ IN HOA.'
    },
    {
      label: '⚡ Thêm Tiền tố [KHDH_2024_2025]',
      prompt: 'Giữ nguyên nội dung chính, thêm tiền tố "[KHDH_2024_2025]_" vào trước tên của tất cả các mục.'
    }
  ];

  // Rename Rules (For Manual/Rule Mode)
  const [rule, setRule] = useState<FolderRenameRule>({
    mode: 'numbering',
    prefix: '',
    suffix: '_2024_2025',
    findText: '',
    replaceText: '',
    startNumber: 1,
    numberDigits: 2,
    numberSeparator: '_',
    template: '{num}_{name}{suffix}',
    caseTransform: 'none'
  });

  // Raw text input for paste mode
  const [rawFolderText, setRawFolderText] = useState<string>(
    'New folder\nNew folder (2)\nNew folder (3)\nNew folder (4)\nNew folder (5)'
  );

  // Apply Rules to items manually
  const applyRulesToItems = (rawItems: FolderRenameItem[], currentRule: FolderRenameRule): FolderRenameItem[] => {
    return rawItems.map((item, index) => {
      let name = item.oldName;
      let ext = '';

      if (targetType === 'file' && name.includes('.')) {
        const lastDot = name.lastIndexOf('.');
        ext = name.slice(lastDot);
        name = name.slice(0, lastDot);
      }

      // Find and replace
      if (currentRule.findText) {
        name = name.split(currentRule.findText).join(currentRule.replaceText);
      }

      // Case transform
      if (currentRule.caseTransform === 'uppercase') {
        name = name.toUpperCase();
      } else if (currentRule.caseTransform === 'lowercase') {
        name = name.toLowerCase();
      } else if (currentRule.caseTransform === 'capitalize') {
        name = name
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
      } else if (currentRule.caseTransform === 'remove_accents') {
        name = removeVietnameseAccents(name);
      }

      // Numbering
      const numVal = currentRule.startNumber + index;
      const numStr = String(numVal).padStart(currentRule.numberDigits, '0');

      let finalName = name;
      if (currentRule.mode === 'numbering') {
        finalName = `${numStr}${currentRule.numberSeparator}${currentRule.prefix}${name}${currentRule.suffix}`;
      } else if (currentRule.mode === 'prefix_suffix') {
        finalName = `${currentRule.prefix}${name}${currentRule.suffix}`;
      } else if (currentRule.mode === 'slug') {
        finalName = removeVietnameseAccents(name)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
      }

      finalName = sanitizeFileName(finalName) + ext;

      return {
        ...item,
        newName: finalName,
        status: 'ready'
      };
    });
  };

  // Update rule and re-apply
  const updateRule = (partial: Partial<FolderRenameRule>) => {
    const updatedRule = { ...rule, ...partial };
    setRule(updatedRule);
    setItems(prev => applyRulesToItems(prev, updatedRule));
  };

  // Parse Raw Text from paste mode
  const handleParseRawText = () => {
    const lines = rawFolderText
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      alert('Vui lòng nhập ít nhất một tên mục!');
      return;
    }

    const newItems: FolderRenameItem[] = lines.map((line, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      oldName: line,
      newName: line,
      status: 'ready'
    }));

    const formatted = applyRulesToItems(newItems, rule);
    setItems(formatted);
    setStatusMsg(`Đã nạp ${formatted.length} tên mục thành công!`);
  };

  // Handle Folder selection via standard webkitdirectory
  const handleFolderInputSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const folderNamesSet = new Set<string>();
    files.forEach(file => {
      const relPath = (file as any).webkitRelativePath || file.name;
      const parts = relPath.split('/');
      if (parts.length >= 3) {
        folderNamesSet.add(parts[1]);
      } else if (parts.length === 2) {
        folderNamesSet.add(parts[0]);
      }
    });

    let extractedList = Array.from(folderNamesSet).filter(Boolean);
    if (extractedList.length === 0) {
      extractedList = files.map(f => f.name.replace(/\.[^/.]+$/, ''));
    }

    const newItems: FolderRenameItem[] = extractedList.map((name, idx) => ({
      id: `dir-${Date.now()}-${idx}`,
      oldName: name,
      newName: name,
      status: 'ready'
    }));

    const formatted = applyRulesToItems(newItems, rule);
    setItems(formatted);
    if (folderInputRef.current) folderInputRef.current.value = '';
    setStatusMsg(`Đã quét được ${formatted.length} thư mục từ máy tính! Bấm "AI Xử Lý" để đổi tên thông minh hoặc tải script bên dưới.`);
  };

  // Handle File selection
  const handleFileInputSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const fileMap = new Map<string, File>();
    const newItems: FolderRenameItem[] = files.map((file, idx) => {
      const id = `file-${Date.now()}-${idx}`;
      fileMap.set(id, file);
      return {
        id,
        oldName: file.name,
        newName: file.name,
        status: 'ready'
      };
    });

    setUploadedFiles(fileMap);
    const formatted = applyRulesToItems(newItems, rule);
    setItems(formatted);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setStatusMsg(`Đã nạp ${newItems.length} tệp tin từ máy tính!`);
  };

  // =========================================================
  // ✨ AI PROCESSING LOGIC (GEMINI)
  // =========================================================
  const handleAiProcessRenaming = async () => {
    if (items.length === 0) {
      alert('Vui lòng nạp hoặc nhập danh sách tên mục trước khi yêu cầu AI đổi tên!');
      return;
    }
    if (!aiPrompt.trim()) {
      alert('Vui lòng nhập yêu cầu đổi tên để AI xử lý!');
      return;
    }

    setIsAiProcessing(true);
    setStatusMsg('✨ AI đang phân tích yêu cầu đổi tên và tạo danh sách tên mới chuẩn hóa...');

    try {
      const originalNames = items.map(it => it.oldName);

      const systemInstruction = `Bạn là chuyên gia tự động hóa và quản trị tài liệu giáo dục hàng đầu. 
Nhiệm vụ của bạn là nhận danh sách tên ${targetType === 'folder' ? 'thư mục' : 'tệp tin'} gốc và yêu cầu đổi tên bằng tiếng Việt của người dùng.
Hãy hiểu chính xác ý định của người dùng và tạo ra tên mới tương ứng cho từng mục.

QUY TẮC QUAN TRỌNG:
1. Trả về DUY NHẤT một mảng JSON hợp lệ, không chứa markdown thừa bên ngoài mảng JSON. Cấu trúc mỗi phần tử:
[
  {
    "oldName": "tên gốc chính xác",
    "newName": "tên mới đã được chuẩn hóa theo yêu cầu",
    "reason": "giải thích ngắn lý do / quy luật"
  }
]
2. Giữ nguyên số lượng phần tử đúng bằng số lượng phần tử đầu vào.
3. Không sử dụng các ký tự cấm trong hệ điều hành Windows: \\ / : * ? " < > |
4. ${targetType === 'file' ? 'Nếu là tệp tin, HÃY GIỮ NGUYÊN HOẶC TỰ ĐỘNG GẮN ĐÚNG PHẦN MỞ RỘNG FILE (.docx, .pdf, .xlsx, .pptx, .png, .jpg...) của tên gốc.' : 'Nếu là thư mục, không cần gắn phần mở rộng file.'}
5. Nếu người dùng yêu cầu đổi "New folder (1), New folder (2)...", hãy suy luận ngữ cảnh (ví dụ theo tuần, theo bài, theo khối lớp, theo môn học) để đặt tên mạch lạc theo thứ tự.`;

      const userPromptPayload = `DANH SÁCH TÊN GỐC (${targetType.toUpperCase()}S):
${JSON.stringify(originalNames, null, 2)}

YÊU CẦU ĐỔI TÊN CỦA NGƯỜI DÙNG:
"${aiPrompt}"

Hãy phân tích và trả về mảng JSON kết quả đổi tên cho từng mục.`;

      // Get user API key from localStorage if saved
      let userApiKeys: string[] = [];
      try {
        const savedKeys = localStorage.getItem('gemini_api_keys');
        if (savedKeys) {
          userApiKeys = JSON.parse(savedKeys);
        }
      } catch (e) {
        // ignore
      }

      const resp = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userPromptPayload,
          systemInstruction,
          apiKeys: userApiKeys
        })
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${resp.status}`);
      }

      const data = await resp.json();
      let responseText = data.text || '';

      // Clean JSON formatting
      responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const jsonStart = responseText.indexOf('[');
      const jsonEnd = responseText.lastIndexOf(']');

      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('AI không trả về cấu trúc JSON hợp lệ.');
      }

      const jsonSub = responseText.slice(jsonStart, jsonEnd + 1);
      const parsedResults: Array<{ oldName: string; newName: string; reason?: string }> = JSON.parse(jsonSub);

      // Merge back into items
      const updatedItems = items.map((item, idx) => {
        const match = parsedResults.find(r => r.oldName === item.oldName) || parsedResults[idx];
        if (match && match.newName) {
          return {
            ...item,
            newName: sanitizeFileName(match.newName),
            aiExplanation: match.reason || 'AI đã chuẩn hóa theo yêu cầu',
            status: 'ready' as const
          };
        }
        return item;
      });

      setItems(updatedItems);
      setStatusMsg(`✨ AI đã xử lý và đổi tên thành công cho ${updatedItems.length} ${targetType === 'folder' ? 'thư mục' : 'tệp tin'}! Hãy kiểm tra bảng bên dưới và tải script.`);
    } catch (err: any) {
      console.error('AI Rename Error:', err);
      // Fallback local logic
      setStatusMsg(`Lưu ý: Không thể kết nối AI (${err.message}). Đang áp dụng bộ quy tắc chuẩn hóa thay thế...`);
      setItems(prev => applyRulesToItems(prev, rule));
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Helper to convert PowerShell script to UTF-16LE Base64 for -EncodedCommand
  const encodePowerShellCommand = (psScript: string): string => {
    const codeUnits = new Uint16Array(psScript.length);
    for (let i = 0; i < psScript.length; i++) {
      codeUnits[i] = psScript.charCodeAt(i);
    }
    const byteView = new Uint8Array(codeUnits.buffer);
    let binary = '';
    for (let i = 0; i < byteView.byteLength; i++) {
      binary += String.fromCharCode(byteView[i]);
    }
    return btoa(binary);
  };

  // =========================================================
  // SCRIPT GENERATORS (100% RELIABLE WINDOWS & MAC)
  // =========================================================

  // 1. Windows .BAT (Sequential Auto-Renaming & Auto-Creating folders)
  const handleDownloadAutoSequentialBat = () => {
    if (items.length === 0) return;

    const isFolder = targetType === 'folder';
    const newNamesJson = JSON.stringify(items.map(it => it.newName));

    // Standalone PowerShell script with full Unicode and auto-create support
    const psScript = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "DOI TEN ${isFolder ? 'THU MUC' : 'TEP TIN'} TU DONG - AI LESSON PLANNER"
Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "   KICH BAN DOI TEN / TAO MOI ${isFolder ? 'THU MUC' : 'TEP TIN'} TU DONG (AI PRO)" -ForegroundColor Yellow
Write-Host "====================================================================" -ForegroundColor Cyan
$currentDir = (Get-Location).Path
Write-Host ("Thu muc hien tai: " + $currentDir) -ForegroundColor Gray
Write-Host ""

$rawList = '${newNamesJson.replace(/'/g, "''")}'
$newNames = $rawList | ConvertFrom-Json

${
  isFolder
    ? `
# Lay danh sach tat ca thu muc con hien tai
$targetItems = Get-ChildItem -Directory | Sort-Object CreationTime

if ($targetItems.Count -eq 0) {
  Write-Host "Chua co thu muc con nao trong thu muc nay." -ForegroundColor Yellow
  Write-Host ("He thong se TU DONG TAO MOI " + $newNames.Count + " thu muc theo danh sach...") -ForegroundColor Cyan
  Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
  $created = 0
  foreach ($name in $newNames) {
    if (-not (Test-Path -LiteralPath $name)) {
      New-Item -ItemType Directory -Name $name | Out-Null
      Write-Host ("  [TAO MOI] " + $name) -ForegroundColor Green
      $created++
    }
  }
  Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
  Write-Host ("HOAN TAT: Da tao moi thanh cong " + $created + " thu muc!") -ForegroundColor Green
} else {
  Write-Host ("Tim thay " + $targetItems.Count + " thu muc con. Bat dau doi ten theo thu tu...") -ForegroundColor Cyan
  Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

  $count = [Math]::Min($targetItems.Count, $newNames.Count)
  $success = 0
  $fail = 0

  for ($i = 0; $i -lt $count; $i++) {
    $item = $targetItems[$i]
    $targetName = $newNames[$i]

    if ($item.Name -ne $targetName) {
      try {
        Rename-Item -LiteralPath $item.FullName -NewName $targetName -ErrorAction Stop
        Write-Host ("  [THANH CONG] " + $item.Name + " -> " + $targetName) -ForegroundColor Green
        $success++
      } catch {
        Write-Host ("  [LOI] Khong the doi " + $item.Name + ": " + $_.Exception.Message) -ForegroundColor Red
        $fail++
      }
    } else {
      Write-Host ("  [BO QUA] Ten da dung: " + $targetName) -ForegroundColor DarkGray
    }
  }

  Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
  Write-Host ("HOAN TAT: Da doi ten thanh cong " + $success + " thu muc!") -ForegroundColor Green
}
`
    : `
# Doi ten tep tin
$targetItems = Get-ChildItem -File | Where-Object { $_.Extension -ne '.bat' -and $_.Extension -ne '.ps1' } | Sort-Object CreationTime

if ($targetItems.Count -eq 0) {
  Write-Host "KHONG TIM THAY TEP TIN NAO DE DOI TEN!" -ForegroundColor Yellow
  Write-Host "Vui long dat file script .bat nay vao ben trong thu muc chua cac tep tin can doi ten va chay lai." -ForegroundColor Yellow
} else {
  Write-Host ("Tim thay " + $targetItems.Count + " tep tin. Bat dau doi ten...") -ForegroundColor Cyan
  Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

  $count = [Math]::Min($targetItems.Count, $newNames.Count)
  $success = 0
  $fail = 0

  for ($i = 0; $i -lt $count; $i++) {
    $item = $targetItems[$i]
    $targetName = $newNames[$i]

    if ($item.Name -ne $targetName) {
      try {
        Rename-Item -LiteralPath $item.FullName -NewName $targetName -ErrorAction Stop
        Write-Host ("  [THANH CONG] " + $item.Name + " -> " + $targetName) -ForegroundColor Green
        $success++
      } catch {
        Write-Host ("  [LOI] Khong the doi " + $item.Name + ": " + $_.Exception.Message) -ForegroundColor Red
        $fail++
      }
    } else {
      Write-Host ("  [BO QUA] Ten da dung: " + $targetName) -ForegroundColor DarkGray
    }
  }

  Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
  Write-Host ("HOAN TAT: Da doi ten thanh cong " + $success + " tep tin!") -ForegroundColor Green
}
`
}
Write-Host ""
`;

    const encodedPs = encodePowerShellCommand(psScript);

    const batContent = `@echo off
chcp 65001 > nul
title DOI TEN / TAO MOI ${isFolder ? 'THU MUC' : 'TEP TIN'} TU DONG
color 0B
cd /d "%~dp0"

powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encodedPs}

echo.
echo ====================================================================
echo Nhan phim bat ky de thoat...
pause > nul
`;

    const blob = new Blob([batContent], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `Doi_Ten_${isFolder ? 'ThuMuc' : 'TepTin'}_TuDong.bat`);
    setStatusMsg(`Đã tải Script .BAT tự động chuẩn 100%! Hãy sao chép file .bat này vào thư mục làm việc và nhấp đúp để chạy.`);
  };

  // 2. Windows .BAT (Exact Mapping Mode)
  const handleDownloadWindowsBat = () => {
    if (items.length === 0) return;
    const isFolder = targetType === 'folder';
    const pairsJson = JSON.stringify(items.map(it => ({ Old: it.oldName, New: it.newName })));

    const psScript = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "DOI TEN ${isFolder ? 'THU MUC' : 'TEP TIN'} KHOP CHINH XAC"
Write-Host ""
Write-Host "====================================================================" -ForegroundColor Green
Write-Host "   KICH BAN DOI TEN ${isFolder ? 'THU MUC' : 'TEP TIN'} KHOP DANH SACH CHINH XAC" -ForegroundColor Yellow
Write-Host "====================================================================" -ForegroundColor Green
$currentDir = (Get-Location).Path
Write-Host ("Thu muc hien tai: " + $currentDir) -ForegroundColor Gray
Write-Host ""

$rawList = '${pairsJson.replace(/'/g, "''")}'
$items = $rawList | ConvertFrom-Json

$successCount = 0
$notFoundCount = 0
$failCount = 0

foreach ($it in $items) {
  if ($it.Old -eq $it.New) { continue }
  
  if (Test-Path -LiteralPath $it.Old) {
    try {
      Rename-Item -LiteralPath $it.Old -NewName $it.New -ErrorAction Stop
      Write-Host ("  [THANH CONG] " + $it.Old + " -> " + $it.New) -ForegroundColor Green
      $successCount++
    } catch {
      Write-Host ("  [LOI] Khong the doi ten " + $it.Old + ": " + $_.Exception.Message) -ForegroundColor Red
      $failCount++
    }
  } else {
    Write-Host ("  [KHONG TIM THAY] Khong co muc nao ten la: """ + $it.Old + """") -ForegroundColor Yellow
    $notFoundCount++
  }
}

Write-Host ""
Write-Host "----------------------------------------------------------" -ForegroundColor Cyan
Write-Host ("[KET QUA] Da doi ten: " + $successCount + " | Khong tim thay: " + $notFoundCount + " | Loi: " + $failCount) -ForegroundColor Cyan
if ($notFoundCount -gt 0) {
  Write-Host "Goi y: Hay su dung nut 'Tai Script Tu Dong' de tu dong doi ten ma khong can khop ten cu!" -ForegroundColor Yellow
}
Write-Host ""
`;

    const encodedPs = encodePowerShellCommand(psScript);

    const batContent = `@echo off
chcp 65001 > nul
title DOI TEN ${isFolder ? 'THU MUC' : 'TEP TIN'} KHOP DANH SACH
color 0A
cd /d "%~dp0"

powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encodedPs}

echo.
echo ====================================================================
echo Nhan phim bat ky de thoat...
pause > nul
`;

    const blob = new Blob([batContent], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `Doi_Ten_${isFolder ? 'ThuMuc' : 'TepTin'}_KhopChinhXac.bat`);
    setStatusMsg(`Đã tải Script .BAT khớp tên!`);
  };

  // 3. Copy PowerShell 1-liner
  const handleCopyPowershellOneLiner = () => {
    const isFolder = targetType === 'folder';
    const pairs = items.map(
      it => `@{o='${it.oldName.replace(/'/g, "''")}';n='${it.newName.replace(/'/g, "''")}'}`
    ).join(',');

    const cmd = `powershell -NoProfile -Command "@(${pairs}) | ForEach-Object { if (Test-Path -LiteralPath $_.o) { Rename-Item -LiteralPath $_.o -NewName $_.n -Force; Write-Host ('[OK] ' + $_.o + ' -> ' + $_.n) } }"`;

    navigator.clipboard.writeText(cmd);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
    setStatusMsg('Đã sao chép lệnh PowerShell 1-dòng! Bạn có thể dán trực tiếp vào cửa sổ PowerShell tại thư mục đó.');
  };

  // 4. Download Shell Script for Mac/Linux (.sh)
  const handleDownloadShellScript = () => {
    if (items.length === 0) return;
    const isFolder = targetType === 'folder';

    const shContent = `#!/bin/bash
cd "$(dirname "$0")"
echo "=== KICH BAN DOI TEN ${isFolder ? 'THU MUC' : 'TEP TIN'} (MACOS / LINUX) ==="

${items
  .map(
    it =>
      `if [ -e "${it.oldName}" ]; then\n  mv "${it.oldName}" "${it.newName}" && echo "[THANH CONG] ${it.oldName} -> ${it.newName}"\nfi`
  )
  .join('\n')}

echo "Hoan tat!"
`;

    const blob = new Blob([shContent], { type: 'text/x-sh;charset=utf-8' });
    saveAs(blob, `doi_ten_${isFolder ? 'thumuc' : 'teptin'}.sh`);
    setStatusMsg('Đã tải script shell .SH cho MacOS / Linux!');
  };

  // 5. Download ZIP of Empty Folder Hierarchy
  const handleDownloadEmptyFoldersZip = async () => {
    if (items.length === 0) return;
    setStatusMsg('Đang tạo file nén ZIP chứa cấu trúc các thư mục mới...');

    try {
      const zip = new JSZip();
      for (const item of items) {
        // Create folder inside zip
        zip.folder(item.newName);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `Cay_Thu_Muc_Chuan_${new Date().toISOString().slice(0, 10)}.zip`);
      setStatusMsg('Đã tải thành công file ZIP chứa các thư mục mới! Chỉ cần giải nén là có ngay cây thư mục hoàn chỉnh.');
    } catch (err: any) {
      console.error(err);
      setStatusMsg(`Lỗi tạo file ZIP: ${err.message}`);
    }
  };

  // 6. Download ZIP of All Renamed Files (When in File mode)
  const handleDownloadAllRenamedFilesZip = async () => {
    if (items.length === 0) return;
    if (uploadedFiles.size === 0) {
      alert('Chưa có dữ liệu tệp tin được nạp từ máy tính. Vui lòng bấm "+ Nạp Danh Sách Tệp Từ Máy" để tải ZIP đổi tên!');
      return;
    }

    setStatusMsg('Đang đóng gói file ZIP chứa các tệp tin đã đổi tên...');
    try {
      const zip = new JSZip();
      for (const item of items) {
        const fileObj = uploadedFiles.get(item.id);
        if (fileObj) {
          zip.file(item.newName, fileObj);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `Danh_Sach_Tep_Da_Doi_Ten_${new Date().toISOString().slice(0, 10)}.zip`);
      setStatusMsg('Đã tải thành công file ZIP chứa toàn bộ các tệp tin đã đổi tên!');
    } catch (err: any) {
      console.error(err);
      setStatusMsg(`Lỗi đóng gói file ZIP: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Target Type Switcher & Main Header */}
      <div className="bg-slate-950 p-4 rounded-xl border border-yellow-900/50 space-y-3.5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 text-slate-950 font-bold shadow-md">
              {targetType === 'folder' ? <FolderTree className="w-5 h-5" /> : <Files className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Đổi Tên Hàng Loạt Bằng AI & Script Tự Động:</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-950 text-yellow-300 border border-yellow-700 font-bold">
                  {targetType === 'folder' ? '📁 THƯ MỤC' : '📄 TỆP TIN'}
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Cho phép nhập yêu cầu tự nhiên (Tiếng Việt), AI hiểu ý định và đổi tên hàng loạt cực nhanh, hỗ trợ xuất file ZIP và Script .BAT 1-chạm
              </p>
            </div>
          </div>

          {/* Switch target type: Folder vs File */}
          <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setTargetType('folder')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                targetType === 'folder'
                  ? 'bg-yellow-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Đổi Tên Thư Mục</span>
            </button>

            <button
              onClick={() => setTargetType('file')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                targetType === 'file'
                  ? 'bg-yellow-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Files className="w-3.5 h-3.5" />
              <span>Đổi Tên Tệp Tin</span>
            </button>
          </div>
        </div>

        {/* Input Methods Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-3">
          <button
            onClick={() => setActiveTab('ai_prompt')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'ai_prompt'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>✨ 1. Nhập Yêu Cầu AI Đổi Tên</span>
          </button>

          <button
            onClick={() => setActiveTab('interactive_dir')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'interactive_dir'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>2. Nạp Từ Máy Tính</span>
          </button>

          <button
            onClick={() => setActiveTab('paste_list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'paste_list'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>3. Dán Danh Sách Tên</span>
          </button>

          <button
            onClick={() => setActiveTab('template_zip')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'template_zip'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>4. Quy Tắc Thủ Công</span>
          </button>
        </div>

        {/* Tab 1: AI Prompt Input (The Main Requested Feature!) */}
        {activeTab === 'ai_prompt' && (
          <div className="p-3.5 bg-slate-900/90 rounded-xl border border-yellow-700/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Nhập Yêu Cầu Tự Nhiên Để AI Hiểu & Đổi Tên:</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Đang có <strong className="text-white">{items.length}</strong> mục trong danh sách
              </span>
            </div>

            <div className="space-y-2">
              <textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                rows={3}
                placeholder={`Nhập yêu cầu bằng tiếng Việt (Ví dụ: Đổi tên các ${targetType === 'folder' ? 'thư mục' : 'file'} theo cấu trúc: Tuần 01, Tuần 02... năm học 2024-2025; hoặc bỏ dấu tiếng Việt, viết hoa chữ cái đầu)...`}
                className="w-full bg-slate-950 border border-yellow-800/60 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none leading-relaxed"
              />

              {/* Quick Prompt Chips */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3 text-amber-400" />
                  <span>Gợi ý mẫu yêu cầu nhanh:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((qp, idx) => (
                    <button
                      key={idx}
                      onClick={() => setAiPrompt(qp.prompt)}
                      className="px-2.5 py-1 bg-slate-950 hover:bg-yellow-950 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-yellow-700/60 rounded-lg text-[11px] font-medium transition-all cursor-pointer text-left"
                    >
                      {qp.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                {targetType === 'folder' ? (
                  <button
                    onClick={() => folderInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>Nạp Thư Mục Từ Máy</span>
                  </button>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Nạp Tệp Từ Máy</span>
                  </button>
                )}
              </div>

              <button
                onClick={handleAiProcessRenaming}
                disabled={isAiProcessing || items.length === 0}
                className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer ${
                  !isAiProcessing && items.length > 0
                    ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black shadow-amber-500/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isAiProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AI Đang Xử Lý Yêu Cầu...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>✨ AI Xử Lý & Hiểu Yêu Cầu Đổi Tên</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Interactive Pick Directory or Files */}
        {activeTab === 'interactive_dir' && (
          <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h5 className="text-xs font-bold text-slate-200">
                  Nạp Trực Tiếp Danh Sách {targetType === 'folder' ? 'Thư Mục' : 'Tệp Tin'} Từ Máy Tính:
                </h5>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Chọn thư mục chứa các thư mục con hoặc danh sách file cần đổi tên
                </p>
              </div>

              <div className="flex items-center gap-2">
                {targetType === 'folder' ? (
                  <>
                    <button
                      onClick={() => folderInputRef.current?.click()}
                      className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span>Chọn Thư Mục Gốc</span>
                    </button>
                    <input
                      type="file"
                      ref={folderInputRef}
                      onChange={handleFolderInputSelect}
                      // @ts-ignore
                      webkitdirectory="true"
                      directory="true"
                      multiple
                      className="hidden"
                    />
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Chọn Danh Sách Tệp</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileInputSelect}
                      multiple
                      className="hidden"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Paste List */}
        {activeTab === 'paste_list' && (
          <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">
                Dán danh sách tên (mỗi dòng một tên {targetType === 'folder' ? 'thư mục' : 'file'}):
              </label>
              <button
                onClick={handleParseRawText}
                className="px-3 py-1 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer"
              >
                Áp dụng danh sách
              </button>
            </div>
            <textarea
              value={rawFolderText}
              onChange={e => setRawFolderText(e.target.value)}
              rows={4}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 font-mono focus:border-yellow-400 focus:outline-none"
            />
          </div>
        )}

        {/* Tab 4: Manual Rules Configuration */}
        {activeTab === 'template_zip' && (
          <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Chế độ đặt tên:</label>
              <select
                value={rule.mode}
                onChange={e => updateRule({ mode: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs"
              >
                <option value="numbering">Đánh số thứ tự (01_, 02_...)</option>
                <option value="prefix_suffix">Thêm Tiền tố / Hậu tố</option>
                <option value="slug">Chuẩn hóa Snake_Case (khong_dau)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Tiền tố (Prefix):</label>
              <input
                type="text"
                value={rule.prefix}
                onChange={e => updateRule({ prefix: e.target.value })}
                placeholder="VD: KHDH_"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Hậu tố (Suffix):</label>
              <input
                type="text"
                value={rule.suffix}
                onChange={e => updateRule({ suffix: e.target.value })}
                placeholder="VD: _2024_2025"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Chuyển đổi kiểu chữ:</label>
              <select
                value={rule.caseTransform}
                onChange={e => updateRule({ caseTransform: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs"
              >
                <option value="none">Giữ nguyên</option>
                <option value="capitalize">Viết Hoa Chữ Cái Đầu</option>
                <option value="uppercase">IN HOA TOÀN BỘ</option>
                <option value="lowercase">in thường toàn bộ</option>
                <option value="remove_accents">Bỏ dấu tiếng Việt</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Output Actions Bar */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="font-bold text-white">Tổng số mục: {items.length} {targetType === 'folder' ? 'thư mục' : 'tệp tin'}</span>
            <span className="px-2 py-0.5 rounded-full bg-yellow-950 text-yellow-300 border border-yellow-700 text-[10px] font-bold">
              Đã sẵn sàng
            </span>
          </div>

          {/* Execution Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {targetType === 'folder' ? (
              <>
                {/* 1. AUTO-SEQUENTIAL BATCH SCRIPT (Solves the New folder mismatch problem 100%) */}
                <button
                  onClick={handleDownloadAutoSequentialBat}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                  title="Tự động quét và đổi tên mọi thư mục hiện có theo thứ tự mà không cần khớp tên cũ!"
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  <span>⚡ Tải Script Đổi Tên TỰ ĐỘNG (.BAT)</span>
                </button>

                {/* 2. Download Empty Folders ZIP */}
                <button
                  onClick={handleDownloadEmptyFoldersZip}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-yellow-300 border border-yellow-700/60 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Tải ZIP Thư Mục Mẫu</span>
                </button>

                {/* 3. Copy PowerShell 1-liner */}
                <button
                  onClick={handleCopyPowershellOneLiner}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Đã Copy Lệnh' : 'Copy Lệnh PowerShell'}</span>
                </button>
              </>
            ) : (
              <>
                {/* File Renaming Actions */}
                <button
                  onClick={handleDownloadAllRenamedFilesZip}
                  className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Tải Toàn Bộ File Đã Đổi Tên (.ZIP)</span>
                </button>

                <button
                  onClick={handleDownloadAutoSequentialBat}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-yellow-300 border border-yellow-700/60 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  <span>Tải Script Đổi Tên File (.BAT)</span>
                </button>
              </>
            )}

            {items.length > 0 && (
              <button
                onClick={() => setItems([])}
                className="p-1.5 bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 rounded-lg text-xs cursor-pointer"
                title="Xóa danh sách"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Status Notification */}
        {statusMsg && (
          <div className="px-3 py-2 bg-yellow-950/40 border border-yellow-800/40 rounded-lg text-yellow-300 text-xs flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
            <span className="flex-1">{statusMsg}</span>
          </div>
        )}

        {/* Comparison & Editable Table */}
        {items.length > 0 ? (
          <div className="space-y-2">
            <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
              <span>Bảng xem trước & chỉnh sửa tên trực tiếp:</span>
              <span className="text-amber-400 font-semibold">* Bạn có thể chỉnh sửa lại ô Tên Mới nếu muốn</span>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-[200px] overflow-hidden">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <div className="overflow-hidden">
                      <div className="font-mono text-slate-400 truncate text-[11px]" title={item.oldName}>
                        {item.oldName}
                      </div>
                      {item.aiExplanation && (
                        <div className="text-[10px] text-amber-400/80 flex items-center gap-1 truncate">
                          <CornerDownRight className="w-2.5 h-2.5 shrink-0" />
                          <span>{item.aiExplanation}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-1 min-w-[260px]">
                    <span className="text-yellow-400 font-bold text-xs">➔</span>
                    <input
                      type="text"
                      value={item.newName}
                      onChange={e => {
                        const val = e.target.value;
                        setItems(prev => prev.map(it => (it.id === item.id ? { ...it, newName: val } : it)));
                      }}
                      className="flex-1 bg-slate-950 border border-yellow-700/60 rounded-lg px-2.5 py-1 text-yellow-200 font-semibold focus:border-yellow-400 focus:outline-none text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {targetType === 'file' && uploadedFiles.has(item.id) && (
                      <button
                        onClick={() => {
                          const f = uploadedFiles.get(item.id);
                          if (f) saveAs(f, item.newName);
                        }}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded cursor-pointer"
                        title="Tải riêng tệp này"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    )}

                    <button
                      onClick={() => setItems(prev => prev.filter(it => it.id !== item.id))}
                      className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                      title="Xóa mục này"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
            <FolderTree className="w-8 h-8 mx-auto mb-2 text-yellow-400/50" />
            <p className="text-xs text-slate-400 font-medium">
              Chưa có mục nào trong danh sách. Bấm "Nạp Từ Máy Tính" hoặc "Dán Danh Sách Tên" để bắt đầu.
            </p>
          </div>
        )}

        {/* Guide box on how to execute Windows script properly */}
        <div className="mt-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
          <div className="font-bold text-amber-300 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Hướng dẫn chạy file Script đổi tên trên máy tính Windows:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1 leading-relaxed">
            <li>
              Bấm nút <strong>"⚡ Tải Script Đổi Tên TỰ ĐỘNG (.BAT)"</strong> để tải file script về máy.
            </li>
            <li>
              <strong>Sao chép (Copy)</strong> file <code className="text-yellow-300 font-mono bg-slate-950 px-1 rounded">Doi_Ten_..._TuDong.bat</code> vừa tải vào <strong>đúng thư mục</strong> chứa các thư mục / tệp tin bạn cần đổi tên.
            </li>
            <li>
              <strong>Bấm đúp chuột (Double click)</strong> vào file <code className="text-yellow-300 font-mono bg-slate-950 px-1 rounded">.bat</code> đó. Cửa sổ dòng lệnh sẽ tự động quét và đổi tên toàn bộ ngay lập tức!
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};
