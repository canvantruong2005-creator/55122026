import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Upload, 
  Sliders, 
  Check, 
  Download, 
  Sparkles, 
  X, 
  Wand2, 
  RefreshCw, 
  Copy, 
  Eye, 
  RotateCw, 
  FlipHorizontal, 
  Pipette, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Palette, 
  CheckCircle2, 
  Crop, 
  Eraser, 
  Trash2, 
  Undo2, 
  Target, 
  Scissors, 
  Scan, 
  Maximize2,
  Minimize2
} from 'lucide-react';

interface ImageBgRemoverProps {
  onInsertImageToContent: (imageMarkdownTag: string) => void;
  onClose?: () => void;
}

type BgRemovalMode = 'white_textbook' | 'color_picker' | 'corner_auto' | 'high_contrast' | 'invert_lineart';
type BgReplacement = 'transparent' | 'pure_white' | 'chalkboard_green' | 'soft_paper' | 'custom_color';
type ActiveTool = 'none' | 'crop' | 'eyedropper' | 'detect_objects' | 'brush_eraser' | 'box_eraser';

interface DetectedObject {
  id: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  pixelCount: number;
  center: { x: number; y: number };
}

export const ImageBgRemover: React.FC<ImageBgRemoverProps> = ({
  onInsertImageToContent,
  onClose
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawOriginalUrl, setRawOriginalUrl] = useState<string>(''); // Pure uploaded image
  const [currentBaseUrl, setCurrentBaseUrl] = useState<string>(''); // Image after crop/edits
  const [processedUrl, setProcessedUrl] = useState<string>(''); // Final output after background removal
  
  // History stack for Undo
  const [historyStack, setHistoryStack] = useState<string[]>([]);

  // Active Tool Mode
  const [activeTool, setActiveTool] = useState<ActiveTool>('none');
  
  // Modes & Settings
  const [mode, setMode] = useState<BgRemovalMode>('white_textbook');
  const [bgReplacement, setBgReplacement] = useState<BgReplacement>('transparent');
  const [customBgColor, setCustomBgColor] = useState<string>('#ffffff');
  
  // Tuning parameters
  const [tolerance, setTolerance] = useState<number>(35); // 0-100 threshold
  const [smoothEdge, setSmoothEdge] = useState<number>(2); // 0-10 feathering / smoothing
  const [contrastBoost, setContrastBoost] = useState<number>(20); // 0-100
  const [brightness, setBrightness] = useState<number>(0); // -50 to 50
  const [denoiseThreshold, setDenoiseThreshold] = useState<number>(15); // 0-50
  
  // Custom picked color for color keying
  const [pickedColor, setPickedColor] = useState<{ r: number; g: number; b: number }>({ r: 255, g: 255, b: 255 });
  const [pickedHexColor, setPickedHexColor] = useState<string>('#ffffff');
  
  // Rotation & Flip
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [isFlippedH, setIsFlippedH] = useState<boolean>(false);
  
  // Crop tool state
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  type CropDragHandle = 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e' | 'create';
  const [cropDragMode, setCropDragMode] = useState<CropDragHandle | null>(null);
  const cropDragStartRef = useRef<{ clientX: number; clientY: number; box: { x: number; y: number; width: number; height: number }; imageRect: DOMRect } | null>(null);
  const imageWrapperRef = useRef<HTMLDivElement | null>(null);
  
  // Smart Object Detection state
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<number | null>(null);
  const [isDetectingObjects, setIsDetectingObjects] = useState<boolean>(false);

  // Brush Eraser state
  const [eraserSize, setEraserSize] = useState<number>(24);
  const [isErasing, setIsErasing] = useState<boolean>(false);
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [imageTitle, setImageTitle] = useState<string>('Hình_SGK_Tách_Nền');
  const [inserted, setInserted] = useState<boolean>(false);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const [previewZoom, setPreviewZoom] = useState<number>(1);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const interactiveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageDisplayRef = useRef<HTMLDivElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/\s+/g, '_');
      setImageTitle(cleanName || 'Hinh_Anh_SGK');

      const reader = new FileReader();
      reader.onload = event => {
        const url = (event.target?.result as string) || '';
        setRawOriginalUrl(url);
        setCurrentBaseUrl(url);
        setHistoryStack([url]);
        setRotationAngle(0);
        setIsFlippedH(false);
        setCropBox(null);
        setDetectedObjects([]);
        setActiveTool('none');
      };
      reader.readAsDataURL(file);
    }
  };

  const pushToHistory = (newUrl: string) => {
    setHistoryStack(prev => [...prev.slice(-10), newUrl]);
    setCurrentBaseUrl(newUrl);
  };

  const handleUndo = () => {
    if (historyStack.length > 1) {
      const newStack = [...historyStack];
      newStack.pop(); // Remove current
      const previousUrl = newStack[newStack.length - 1];
      setHistoryStack(newStack);
      setCurrentBaseUrl(previousUrl);
      setDetectedObjects([]);
      setSelectedObjectId(null);
      setCropBox(null);
    }
  };

  // Convert RGB to Hex
  const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + [r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  // Convert Hex to RGB
  const hexToRgb = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      const r = parseInt(cleanHex[0] + cleanHex[0], 16);
      const g = parseInt(cleanHex[1] + cleanHex[1], 16);
      const b = parseInt(cleanHex[2] + cleanHex[2], 16);
      return { r, g, b };
    }
    if (cleanHex.length === 6) {
      const r = parseInt(cleanHex.slice(0, 2), 16);
      const g = parseInt(cleanHex.slice(2, 4), 16);
      const b = parseInt(cleanHex.slice(4, 6), 16);
      return { r, g, b };
    }
    return { r: 255, g: 255, b: 255 };
  };

  const handleSelectPredefinedColor = (hex: string) => {
    const rgb = hexToRgb(hex);
    setPickedColor(rgb);
    setPickedHexColor(hex);
    setMode('color_picker');
  };

  // =========================================================================
  // CORE PROCESSING: Background Removal & Enhancement
  // =========================================================================
  const processImage = useCallback(() => {
    if (!currentBaseUrl) return;
    setIsProcessing(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current || document.createElement('canvas');
      
      const isSideways = rotationAngle === 90 || rotationAngle === 270;
      canvas.width = isSideways ? img.height : img.width;
      canvas.height = isSideways ? img.width : img.height;
      
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      // Handle transformation (Rotation & Flip)
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotationAngle * Math.PI) / 180);
      if (isFlippedH) {
        ctx.scale(-1, 1);
      }
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const w = canvas.width;
      const h = canvas.height;

      // Auto-detect corner background color if in corner_auto mode
      let targetR = pickedColor.r;
      let targetG = pickedColor.g;
      let targetB = pickedColor.b;

      if (mode === 'corner_auto') {
        const cornerSamples = [
          0,
          (w - 1) * 4,
          ((h - 1) * w) * 4,
          ((h - 1) * w + (w - 1)) * 4
        ];
        let sumR = 0, sumG = 0, sumB = 0;
        cornerSamples.forEach(idx => {
          sumR += data[idx];
          sumG += data[idx + 1];
          sumB += data[idx + 2];
        });
        targetR = Math.round(sumR / 4);
        targetG = Math.round(sumG / 4);
        targetB = Math.round(sumB / 4);
      } else if (mode === 'white_textbook') {
        targetR = 255;
        targetG = 255;
        targetB = 255;
      }

      const cFactor = (259 * (contrastBoost + 255)) / (255 * (259 - contrastBoost));
      const maxDistance = (tolerance / 100) * 441.67;
      const softDistance = maxDistance * (1 + smoothEdge * 0.1);

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];
        let a = data[i + 3];

        // Apply Brightness
        if (brightness !== 0) {
          r = Math.min(255, Math.max(0, r + brightness * 2));
          g = Math.min(255, Math.max(0, g + brightness * 2));
          b = Math.min(255, Math.max(0, b + brightness * 2));
        }

        // Apply Contrast Boost
        if (contrastBoost !== 0) {
          r = Math.min(255, Math.max(0, cFactor * (r - 128) + 128));
          g = Math.min(255, Math.max(0, cFactor * (g - 128) + 128));
          b = Math.min(255, Math.max(0, cFactor * (b - 128) + 128));
        }

        // Mode: Invert Lineart (Blackboard to Whiteboard)
        if (mode === 'invert_lineart') {
          r = 255 - r;
          g = 255 - g;
          b = 255 - b;
        }

        // Mode: High Contrast Lineart (Binarization)
        if (mode === 'high_contrast') {
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const highThreshold = 255 - (tolerance * 2.2);
          if (lum >= highThreshold) {
            a = 0;
          } else {
            r = Math.max(0, r - 50);
            g = Math.max(0, g - 50);
            b = Math.max(0, b - 50);
          }
        } else {
          const dist = Math.sqrt(
            Math.pow(r - targetR, 2) +
            Math.pow(g - targetG, 2) +
            Math.pow(b - targetB, 2)
          );

          if (dist <= maxDistance) {
            a = 0;
          } else if (dist < softDistance && smoothEdge > 0) {
            const alphaRatio = (dist - maxDistance) / (softDistance - maxDistance);
            a = Math.round(a * Math.min(1, Math.max(0, alphaRatio)));
          }

          if (mode === 'white_textbook' && a > 0 && a < 255) {
            const avgBrightness = (r + g + b) / 3;
            if (avgBrightness > 220 && (r - b < denoiseThreshold)) {
              a = 0;
            }
          }
        }

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = a;
      }

      ctx.putImageData(imgData, 0, 0);

      // Handle Background Replacement if selected
      if (bgReplacement !== 'transparent') {
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = canvas.width;
        finalCanvas.height = canvas.height;
        const finalCtx = finalCanvas.getContext('2d');
        if (finalCtx) {
          let fillStyle = '#ffffff';
          if (bgReplacement === 'pure_white') fillStyle = '#ffffff';
          else if (bgReplacement === 'chalkboard_green') fillStyle = '#0f3a22';
          else if (bgReplacement === 'soft_paper') fillStyle = '#faf8f5';
          else if (bgReplacement === 'custom_color') fillStyle = customBgColor;

          finalCtx.fillStyle = fillStyle;
          finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
          finalCtx.drawImage(canvas, 0, 0);
          setProcessedUrl(finalCanvas.toDataURL('image/png'));
        }
      } else {
        setProcessedUrl(canvas.toDataURL('image/png'));
      }

      setIsProcessing(false);
    };

    img.src = currentBaseUrl;
  }, [
    currentBaseUrl,
    mode,
    tolerance,
    smoothEdge,
    contrastBoost,
    brightness,
    denoiseThreshold,
    pickedColor,
    rotationAngle,
    isFlippedH,
    bgReplacement,
    customBgColor
  ]);

  useEffect(() => {
    if (currentBaseUrl) {
      processImage();
    }
  }, [processImage]);

  // =========================================================================
  // TOOL 1: CROP IMAGE (Cắt lấy phần ảnh & Kéo chuột tương tác)
  // =========================================================================
  useEffect(() => {
    if (!cropDragMode) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!cropDragStartRef.current || !imageWrapperRef.current) return;
      const { clientX: startX, clientY: startY, box: startBox, imageRect } = cropDragStartRef.current;
      if (!imageRect || imageRect.width === 0 || imageRect.height === 0) return;

      const deltaXPercent = ((e.clientX - startX) / imageRect.width) * 100;
      const deltaYPercent = ((e.clientY - startY) / imageRect.height) * 100;
      const minSize = 4; // Minimum 4% width / height

      if (cropDragMode === 'move') {
        const newX = Math.max(0, Math.min(100 - startBox.width, startBox.x + deltaXPercent));
        const newY = Math.max(0, Math.min(100 - startBox.height, startBox.y + deltaYPercent));
        setCropBox({ ...startBox, x: newX, y: newY });
      } else if (cropDragMode === 'se') {
        const newW = Math.max(minSize, Math.min(100 - startBox.x, startBox.width + deltaXPercent));
        const newH = Math.max(minSize, Math.min(100 - startBox.y, startBox.height + deltaYPercent));
        setCropBox({ ...startBox, width: newW, height: newH });
      } else if (cropDragMode === 'nw') {
        const rawNewX = startBox.x + deltaXPercent;
        const newX = Math.max(0, Math.min(startBox.x + startBox.width - minSize, rawNewX));
        const newW = startBox.width - (newX - startBox.x);
        const rawNewY = startBox.y + deltaYPercent;
        const newY = Math.max(0, Math.min(startBox.y + startBox.height - minSize, rawNewY));
        const newH = startBox.height - (newY - startBox.y);
        setCropBox({ x: newX, y: newY, width: newW, height: newH });
      } else if (cropDragMode === 'ne') {
        const rawNewY = startBox.y + deltaYPercent;
        const newY = Math.max(0, Math.min(startBox.y + startBox.height - minSize, rawNewY));
        const newH = startBox.height - (newY - startBox.y);
        const newW = Math.max(minSize, Math.min(100 - startBox.x, startBox.width + deltaXPercent));
        setCropBox({ x: startBox.x, y: newY, width: newW, height: newH });
      } else if (cropDragMode === 'sw') {
        const rawNewX = startBox.x + deltaXPercent;
        const newX = Math.max(0, Math.min(startBox.x + startBox.width - minSize, rawNewX));
        const newW = startBox.width - (newX - startBox.x);
        const newH = Math.max(minSize, Math.min(100 - startBox.y, startBox.height + deltaYPercent));
        setCropBox({ x: newX, y: startBox.y, width: newW, height: newH });
      } else if (cropDragMode === 'n') {
        const rawNewY = startBox.y + deltaYPercent;
        const newY = Math.max(0, Math.min(startBox.y + startBox.height - minSize, rawNewY));
        const newH = startBox.height - (newY - startBox.y);
        setCropBox({ ...startBox, y: newY, height: newH });
      } else if (cropDragMode === 's') {
        const newH = Math.max(minSize, Math.min(100 - startBox.y, startBox.height + deltaYPercent));
        setCropBox({ ...startBox, height: newH });
      } else if (cropDragMode === 'w') {
        const rawNewX = startBox.x + deltaXPercent;
        const newX = Math.max(0, Math.min(startBox.x + startBox.width - minSize, rawNewX));
        const newW = startBox.width - (newX - startBox.x);
        setCropBox({ ...startBox, x: newX, width: newW });
      } else if (cropDragMode === 'e') {
        const newW = Math.max(minSize, Math.min(100 - startBox.x, startBox.width + deltaXPercent));
        setCropBox({ ...startBox, width: newW });
      } else if (cropDragMode === 'create') {
        const currentXPercent = Math.max(0, Math.min(100, ((e.clientX - imageRect.left) / imageRect.width) * 100));
        const currentYPercent = Math.max(0, Math.min(100, ((e.clientY - imageRect.top) / imageRect.height) * 100));
        const startXPercent = Math.max(0, Math.min(100, ((startX - imageRect.left) / imageRect.width) * 100));
        const startYPercent = Math.max(0, Math.min(100, ((startY - imageRect.top) / imageRect.height) * 100));
        
        const x = Math.min(startXPercent, currentXPercent);
        const y = Math.min(startYPercent, currentYPercent);
        const width = Math.max(minSize, Math.abs(currentXPercent - startXPercent));
        const height = Math.max(minSize, Math.abs(currentYPercent - startYPercent));
        setCropBox({ x, y, width, height });
      }
    };

    const handleWindowMouseUp = () => {
      setCropDragMode(null);
      cropDragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [cropDragMode]);

  const startCropDrag = (e: React.MouseEvent, handle: CropDragHandle) => {
    e.stopPropagation();
    e.preventDefault();
    if (!imageWrapperRef.current || !cropBox) return;
    const rect = imageWrapperRef.current.getBoundingClientRect();
    cropDragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      box: { ...cropBox },
      imageRect: rect
    };
    setCropDragMode(handle);
  };

  const handleStartCreateCrop = (e: React.MouseEvent) => {
    if (activeTool !== 'crop' || !imageWrapperRef.current) return;
    const rect = imageWrapperRef.current.getBoundingClientRect();
    const startXPercent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const startYPercent = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    
    const initialBox = { x: startXPercent, y: startYPercent, width: 4, height: 4 };
    setCropBox(initialBox);
    cropDragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      box: initialBox,
      imageRect: rect
    };
    setCropDragMode('create');
  };

  const applyCrop = () => {
    if (!cropBox || !currentBaseUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const realX = Math.round((cropBox.x / 100) * img.width);
      const realY = Math.round((cropBox.y / 100) * img.height);
      const realW = Math.round((cropBox.width / 100) * img.width);
      const realH = Math.round((cropBox.height / 100) * img.height);

      if (realW <= 5 || realH <= 5) {
        alert('Vùng chọn cắt quá nhỏ! Vui lòng kéo chọn vùng ảnh lớn hơn.');
        return;
      }

      canvas.width = realW;
      canvas.height = realH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, realX, realY, realW, realH, 0, 0, realW, realH);
      const croppedDataUrl = canvas.toDataURL('image/png');
      pushToHistory(croppedDataUrl);
      setCropBox(null);
      setActiveTool('none');
    };
    img.src = currentBaseUrl;
  };

  const setCropPreset = (preset: '1:1' | '4:3' | '16:9' | '3:2' | 'free' | 'trim') => {
    if (!currentBaseUrl) return;
    setActiveTool('crop');

    if (preset === 'free') {
      setCropBox({
        x: 10,
        y: 10,
        width: 80,
        height: 80
      });
      return;
    }

    if (preset === 'trim') {
      // Auto trim white/transparent margins
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, img.width, img.height).data;

        let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
        for (let y = 0; y < img.height; y++) {
          for (let x = 0; x < img.width; x++) {
            const idx = (y * img.width + x) * 4;
            const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
            const isNonWhite = a > 20 && (r < 240 || g < 240 || b < 240);
            if (isNonWhite) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (maxX > minX && maxY > minY) {
          const pad = 10;
          const left = Math.max(0, minX - pad);
          const top = Math.max(0, minY - pad);
          const w = Math.min(img.width - left, (maxX - minX) + pad * 2);
          const h = Math.min(img.height - top, (maxY - minY) + pad * 2);
          setCropBox({
            x: (left / img.width) * 100,
            y: (top / img.height) * 100,
            width: (w / img.width) * 100,
            height: (h / img.height) * 100
          });
        }
      };
      img.src = currentBaseUrl;
      return;
    }

    let aspect = 1;
    if (preset === '1:1') aspect = 1;
    if (preset === '4:3') aspect = 4 / 3;
    if (preset === '16:9') aspect = 16 / 9;
    if (preset === '3:2') aspect = 3 / 2;

    const w = 70;
    const h = w / aspect;
    setCropBox({
      x: Math.max(0, (100 - w) / 2),
      y: Math.max(0, (100 - h) / 2),
      width: w,
      height: Math.min(95, h)
    });
  };

  // =========================================================================
  // TOOL 2: SMART OBJECT DETECTION (Tự động nhận diện & chọn xóa đối tượng)
  // =========================================================================
  const detectObjectsInImage = () => {
    if (!currentBaseUrl) return;
    setIsDetectingObjects(true);
    setActiveTool('detect_objects');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 600; // Resize for fast connected component analysis
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsDetectingObjects(false);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // Binary mask: 1 = foreground object, 0 = background
      const mask = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) {
        const idx = i * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
        const isBg = a < 50 || (r > 235 && g > 235 && b > 235);
        mask[i] = isBg ? 0 : 1;
      }

      // Connected Component Labeling (Union-Find / Breadth-First Grid Search)
      const visited = new Uint8Array(w * h);
      const objects: DetectedObject[] = [];
      let objId = 1;

      for (let y = 0; y < h; y += 2) {
        for (let x = 0; x < w; x += 2) {
          const idx = y * w + x;
          if (mask[idx] === 1 && visited[idx] === 0) {
            // Start flood fill
            const queue = [idx];
            visited[idx] = 1;
            let minX = x, maxX = x, minY = y, maxY = y;
            let pixelCount = 0;

            while (queue.length > 0) {
              const curr = queue.pop()!;
              const cx = curr % w;
              const cy = Math.floor(curr / w);
              pixelCount++;

              if (cx < minX) minX = cx;
              if (cx > maxX) maxX = cx;
              if (cy < minY) minY = cy;
              if (cy > maxY) maxY = cy;

              // 4-Neighbors
              const neighbors = [
                cy > 0 ? curr - w : -1,
                cy < h - 1 ? curr + w : -1,
                cx > 0 ? curr - 1 : -1,
                cx < w - 1 ? curr + 1 : -1
              ];

              for (const n of neighbors) {
                if (n >= 0 && mask[n] === 1 && visited[n] === 0) {
                  visited[n] = 1;
                  queue.push(n);
                }
              }
            }

            const boxWidth = maxX - minX;
            const boxHeight = maxY - minY;

            // Filter out tiny dust noise (< 15 pixels or < 4px width/height)
            if (pixelCount >= 18 && (boxWidth >= 6 || boxHeight >= 6)) {
              objects.push({
                id: objId++,
                minX: (minX / w) * 100,
                minY: (minY / h) * 100,
                maxX: (maxX / w) * 100,
                maxY: (maxY / h) * 100,
                width: ((maxX - minX + 2) / w) * 100,
                height: ((maxY - minY + 2) / h) * 100,
                pixelCount,
                center: {
                  x: (((minX + maxX) / 2) / w) * 100,
                  y: (((minY + maxY) / 2) / h) * 100
                }
              });
            }
          }
        }
      }

      // Sort objects by area descending
      objects.sort((a, b) => (b.width * b.height) - (a.width * a.height));
      setDetectedObjects(objects.slice(0, 20)); // Keep top 20 most prominent objects
      setIsDetectingObjects(false);
    };
    img.src = currentBaseUrl;
  };

  // Erase a specific detected object or Keep ONLY this object
  const handleActionOnObject = (targetObj: DetectedObject, action: 'erase' | 'keep_only') => {
    if (!currentBaseUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const objX = Math.round((targetObj.minX / 100) * img.width);
      const objY = Math.round((targetObj.minY / 100) * img.height);
      const objW = Math.round((targetObj.width / 100) * img.width);
      const objH = Math.round((targetObj.height / 100) * img.height);

      if (action === 'erase') {
        // Draw whole image, then clear the target object area to transparent/white
        ctx.drawImage(img, 0, 0);
        ctx.clearRect(objX - 2, objY - 2, objW + 4, objH + 4);
      } else {
        // Keep ONLY this object: create transparent canvas, copy only this region
        ctx.drawImage(img, objX, objY, objW, objH, objX, objY, objW, objH);
      }

      const updatedUrl = canvas.toDataURL('image/png');
      pushToHistory(updatedUrl);
      setSelectedObjectId(null);
      // Re-detect objects after modification
      setTimeout(() => detectObjectsInImage(), 200);
    };
    img.src = currentBaseUrl;
  };

  // Clean all small noise objects (< 100 pixels)
  const handleCleanSmallArtifacts = () => {
    if (!currentBaseUrl || detectedObjects.length === 0) return;
    const smallObjects = detectedObjects.filter(o => o.pixelCount < 80);
    if (smallObjects.length === 0) {
      alert('Không phát hiện thấy đốm rác nhỏ nào cần xóa!');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);

      smallObjects.forEach(obj => {
        const ox = Math.round((obj.minX / 100) * img.width);
        const oy = Math.round((obj.minY / 100) * img.height);
        const ow = Math.round((obj.width / 100) * img.width);
        const oh = Math.round((obj.height / 100) * img.height);
        ctx.clearRect(ox - 2, oy - 2, ow + 4, oh + 4);
      });

      const updatedUrl = canvas.toDataURL('image/png');
      pushToHistory(updatedUrl);
      alert(`🧹 Đã tự động tẩy sạch ${smallObjects.length} đốm rác / chữ thừa nhỏ!`);
      setTimeout(() => detectObjectsInImage(), 200);
    };
    img.src = currentBaseUrl;
  };

  // =========================================================================
  // TOOL 3: BRUSH ERASER (Cọ tẩy thủ công)
  // =========================================================================
  const handleCanvasErase = (e: React.MouseEvent<HTMLImageElement>) => {
    if (activeTool !== 'brush_eraser' || !currentBaseUrl) return;

    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = target.naturalWidth / rect.width;
    const scaleY = target.naturalHeight / rect.height;
    const realX = x * scaleX;
    const realY = y * scaleY;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(realX, realY, eraserSize * scaleX, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const updatedUrl = canvas.toDataURL('image/png');
      setCurrentBaseUrl(updatedUrl);
    };
    img.src = currentBaseUrl;
  };

  // =========================================================================
  // COLOR PICKER (Eyedropper)
  // =========================================================================
  const handleOriginalImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (activeTool === 'brush_eraser') {
      handleCanvasErase(e);
      return;
    }

    if (activeTool === 'crop') {
      // Crop drag handles handled by overlay
      return;
    }

    if (activeTool !== 'eyedropper' && mode !== 'color_picker') return;

    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = target.naturalWidth / rect.width;
    const scaleY = target.naturalHeight / rect.height;

    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = target.naturalWidth;
    sampleCanvas.height = target.naturalHeight;
    const sampleCtx = sampleCanvas.getContext('2d');
    if (!sampleCtx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      sampleCtx.drawImage(img, 0, 0);
      const pixel = sampleCtx.getImageData(Math.floor(x * scaleX), Math.floor(y * scaleY), 1, 1).data;
      const rgb = { r: pixel[0], g: pixel[1], b: pixel[2] };
      setPickedColor(rgb);
      setPickedHexColor(rgbToHex(rgb.r, rgb.g, rgb.b));
      setMode('color_picker');
      setActiveTool('none');
    };
    img.src = currentBaseUrl;
  };

  // Insert to Lesson Plan
  const handleInsert = () => {
    const finalUrl = processedUrl || currentBaseUrl;
    if (!finalUrl) {
      alert('Vui lòng tải ảnh lên trước!');
      return;
    }

    const tag = `\n\n![Ảnh tư liệu: ${imageTitle}](${finalUrl})\n\n`;
    onInsertImageToContent(tag);
    setInserted(true);
    setTimeout(() => setInserted(false), 2500);
  };

  const handleCopyToClipboard = async () => {
    const finalUrl = processedUrl || currentBaseUrl;
    if (!finalUrl) return;

    try {
      const res = await fetch(finalUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type || 'image/png']: blob })
      ]);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2000);
      alert('📋 Đã sao chép ảnh vào Clipboard! Thầy/Cô có thể nhấn Ctrl+V để dán trực tiếp vào file Word.');
    } catch (err) {
      console.warn('Lỗi copy clipboard:', err);
      alert('Trình duyệt không hỗ trợ copy trực tiếp blob. Thầy/Cô hãy bấm "Tải Ảnh (.PNG)" để lưu và chèn vào Word.');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 text-slate-100 space-y-5 shadow-2xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Bộ Tách Nền, Cắt Ảnh & Tẩy Xóa Đối Tượng SGK Thông Minh</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                PRO 2026
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Cắt lấy phần hình, chọn màu tách nền, tự động nhận diện đối tượng & tẩy xóa chữ/vùng thừa trên trang in SGK
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {historyStack.length > 1 && (
            <button
              type="button"
              onClick={handleUndo}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-1 border border-slate-700 cursor-pointer shadow"
              title="Hoàn tác thao tác chỉnh sửa vừa làm"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Hoàn tác ({historyStack.length - 1})</span>
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Top Upload Zone & Mode Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Upload Column */}
        <div className="lg:col-span-5 space-y-3">
          <label className="block text-xs font-semibold text-slate-300">
            1. Tải ảnh từ máy tính (Ảnh chụp SGK, sơ đồ, đồ thị, bài toán hình học):
          </label>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-2xl cursor-pointer bg-slate-950/60 hover:bg-slate-950 transition-all p-4 text-center group">
            <Upload className="w-7 h-7 text-cyan-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-200 line-clamp-1">
              {selectedFile ? selectedFile.name : 'Nhấn để chọn ảnh (.PNG, .JPG, .WEBP)'}
            </span>
            <span className="text-[10px] text-slate-500 mt-1">
              Hỗ trợ ảnh chụp điện thoại, ảnh scan SGK, tài liệu tham khảo
            </span>
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>

          {/* Quick Transform tools */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              disabled={!currentBaseUrl}
              onClick={() => setRotationAngle(prev => (prev + 90) % 360)}
              className="flex-1 py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Xoay ảnh 90 độ theo chiều kim đồng hồ"
            >
              <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Xoay 90° ({rotationAngle}°)</span>
            </button>
            <button
              type="button"
              disabled={!currentBaseUrl}
              onClick={() => setIsFlippedH(prev => !prev)}
              className={`py-1.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isFlippedH
                  ? 'bg-cyan-600 text-white border-cyan-500'
                  : 'bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border-slate-700'
              }`}
              title="Lật gương ảnh theo chiều ngang"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span>Lật ngang</span>
            </button>
          </div>
        </div>

        {/* Algorithm Modes & Background replacement */}
        <div className="lg:col-span-7 space-y-3">
          <label className="block text-xs font-semibold text-slate-300">
            2. Chọn Thuật toán Tách Nền & Tùy biến Nền thay thế:
          </label>

          {/* Mode Selection Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'white_textbook', label: '📖 Nền Trắng SGK', desc: 'Khử vàng ố, giữ nét mực' },
              { id: 'corner_auto', label: '🤖 Tự Quét 4 Góc', desc: 'Tự quét màu nền đồng nhất' },
              { id: 'color_picker', label: '🎯 Chọn Màu Cần Tách', desc: 'Chấm màu trên ảnh / Bảng màu' },
              { id: 'high_contrast', label: '📐 Sơ Đồ & Hình Toán', desc: 'Tăng đậm nét vẽ hình học' },
              { id: 'invert_lineart', label: '🔄 Đảo Màu Nét Vẽ', desc: 'Bảng đen thành Giấy trắng' }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id as BgRemovalMode)}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === item.id
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="font-bold text-[11px] flex items-center justify-between">
                  <span>{item.label}</span>
                  {mode === item.id && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
              </button>
            ))}
          </div>

          {/* Background Replacement Options */}
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>Nền Xuất Ra:</span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'transparent', label: 'Trong suốt (PNG)' },
                { id: 'pure_white', label: 'Trắng (#FFF)' },
                { id: 'soft_paper', label: 'Giấy kem mềm' },
                { id: 'chalkboard_green', label: 'Bảng xanh' },
                { id: 'custom_color', label: 'Tùy màu' }
              ].map(bg => (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => setBgReplacement(bg.id as BgReplacement)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                    bgReplacement === bg.id
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {bg.label}
                </button>
              ))}
              {bgReplacement === 'custom_color' && (
                <input
                  type="color"
                  value={customBgColor}
                  onChange={e => setCustomBgColor(e.target.value)}
                  className="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer ml-1"
                  title="Chọn màu nền tùy ý"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SPECIAL TOOLBAR: CROP, COLOR PICKER, OBJECT DETECTOR & ERASER
          ========================================================================= */}
      <div className="bg-slate-950 p-3.5 rounded-2xl border border-cyan-900/50 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 font-extrabold text-[11px] border border-cyan-800">
              CÔNG CỤ XỬ LÝ NÂNG CAO
            </span>
            <span className="text-xs text-slate-300 font-bold">
              Cắt lấy phần ảnh, chọn màu tách nền, AI nhận diện đối tượng & tẩy xóa:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Tool: Crop Image */}
            <button
              type="button"
              disabled={!currentBaseUrl}
              onClick={() => {
                if (activeTool === 'crop') {
                  setActiveTool('none');
                  setCropBox(null);
                } else {
                  setActiveTool('crop');
                  setCropPreset('4:3');
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                activeTool === 'crop'
                  ? 'bg-amber-600 text-white border-amber-400 ring-2 ring-amber-400 shadow-lg'
                  : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-700/50'
              }`}
            >
              <Crop className="w-3.5 h-3.5" />
              <span>✂️ Cắt Lấy Phần Ảnh</span>
            </button>

            {/* Tool: Smart Object Detection */}
            <button
              type="button"
              disabled={!currentBaseUrl || isDetectingObjects}
              onClick={detectObjectsInImage}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                activeTool === 'detect_objects'
                  ? 'bg-purple-600 text-white border-purple-400 ring-2 ring-purple-400 shadow-lg'
                  : 'bg-slate-900 hover:bg-slate-800 text-purple-300 border-purple-700/50'
              }`}
            >
              <Scan className={`w-3.5 h-3.5 ${isDetectingObjects ? 'animate-spin' : ''}`} />
              <span>🤖 Nhận Diện Đối Tượng ({detectedObjects.length})</span>
            </button>

            {/* Tool: Brush Eraser */}
            <button
              type="button"
              disabled={!currentBaseUrl}
              onClick={() => setActiveTool(prev => prev === 'brush_eraser' ? 'none' : 'brush_eraser')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                activeTool === 'brush_eraser'
                  ? 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-400 shadow-lg'
                  : 'bg-slate-900 hover:bg-slate-800 text-rose-300 border-rose-700/50'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>🧹 Cọ Tẩy Xóa</span>
            </button>
          </div>
        </div>

        {/* Sub-toolbar for Active Tool */}
        {activeTool === 'crop' && (
          <div className="p-3 bg-amber-950/50 rounded-xl border border-amber-800/80 space-y-2.5 text-xs animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-bold text-amber-200 flex items-center gap-1">
                  <Scissors className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tỉ lệ khung cắt:</span>
                </span>
                {([
                  { key: 'free', label: 'Tự do' },
                  { key: '1:1', label: '1:1' },
                  { key: '4:3', label: '4:3' },
                  { key: '16:9', label: '16:9' },
                  { key: '3:2', label: '3:2' },
                  { key: 'trim', label: '✨ Tự động cắt sát viền' }
                ] as const).map(p => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setCropPreset(p.key)}
                    className="px-2.5 py-1 rounded-lg bg-amber-900/70 hover:bg-amber-800 text-amber-100 border border-amber-700 text-[11px] font-bold cursor-pointer transition-colors shadow-sm"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={applyCrop}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 cursor-pointer transition-all active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Cắt Ngay Phần Đã Chọn</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCropBox(null);
                    setActiveTool('none');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Hủy bỏ
                </button>
              </div>
            </div>

            <div className="text-[11px] text-amber-300/90 bg-amber-900/30 px-2.5 py-1.5 rounded-lg border border-amber-800/40 flex items-center gap-1.5">
              <span>💡</span>
              <span>
                <strong>Hướng dẫn chuột:</strong> Nhấp & kéo trên ảnh để vẽ vùng cắt mới. Kéo <strong>4 góc vuông</strong> hoặc <strong>4 cạnh</strong> để co giãn to/nhỏ. Kéo <strong>phần giữa</strong> để di chuyển vị trí.
              </span>
            </div>
          </div>
        )}

        {activeTool === 'detect_objects' && detectedObjects.length > 0 && (
          <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-800/60 space-y-2 text-xs animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-purple-200 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-purple-400" />
                <span>Đã phát hiện {detectedObjects.length} đối tượng (khối chữ / hình vẽ) trên ảnh:</span>
              </span>
              <button
                type="button"
                onClick={handleCleanSmallArtifacts}
                className="px-2.5 py-1 rounded-lg bg-purple-900/80 hover:bg-purple-800 text-purple-200 font-bold border border-purple-700 flex items-center gap-1 cursor-pointer"
                title="Tự động xóa sạch các đốm rác nhỏ li ti trên trang in"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Tẩy sạch đốm rác nhỏ</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 max-h-36 overflow-y-auto pr-1">
              {detectedObjects.map(obj => (
                <div
                  key={obj.id}
                  className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-2 transition-all ${
                    selectedObjectId === obj.id
                      ? 'bg-purple-600 text-white border-purple-300 ring-2 ring-purple-400'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-purple-600'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedObjectId(obj.id)}
                    className="font-bold text-xs cursor-pointer"
                  >
                    #{obj.id} ({Math.round(obj.width)}x{Math.round(obj.height)}%)
                  </button>
                  <div className="flex items-center gap-1 border-l border-slate-700 pl-1.5">
                    <button
                      type="button"
                      onClick={() => handleActionOnObject(obj, 'erase')}
                      className="p-1 rounded hover:bg-rose-600 text-rose-300 hover:text-white cursor-pointer"
                      title="Xóa đối tượng này"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleActionOnObject(obj, 'keep_only')}
                      className="p-1 rounded hover:bg-emerald-600 text-emerald-300 hover:text-white cursor-pointer"
                      title="Chỉ giữ lại đối tượng này (Xóa tất cả các phần khác)"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTool === 'brush_eraser' && (
          <div className="p-3 bg-rose-950/40 rounded-xl border border-rose-800/60 flex flex-wrap items-center justify-between gap-3 text-xs animate-fade-in">
            <span className="font-bold text-rose-200 flex items-center gap-1.5">
              <Eraser className="w-4 h-4 text-rose-400" />
              <span>Chế độ Cọ Tẩy: Nhấp hoặc rê chuột lên ảnh bên dưới để xóa các chi tiết rác thừa</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-semibold">Cỡ cọ tẩy:</span>
              <input
                type="range"
                min="8"
                max="60"
                value={eraserSize}
                onChange={e => setEraserSize(Number(e.target.value))}
                className="w-32 accent-rose-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
              <span className="font-mono text-rose-300 font-bold">{eraserSize}px</span>
            </div>
          </div>
        )}

        {/* Color Palette Picker for Background Keying */}
        <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <Pipette className="w-3.5 h-3.5 text-cyan-400" />
              <span>Chọn Màu Cần Tách Nền:</span>
            </span>
            <div className="flex items-center gap-1.5">
              {[
                { hex: '#ffffff', label: 'Trắng SGK', border: 'border-slate-300' },
                { hex: '#f4e8d1', label: 'Giấy ố vàng', border: 'border-amber-400' },
                { hex: '#0f3a22', label: 'Bảng xanh', border: 'border-emerald-600' },
                { hex: '#dcebff', label: 'Xanh scan', border: 'border-blue-400' },
                { hex: '#000000', label: 'Nền đen', border: 'border-slate-600' }
              ].map(c => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => handleSelectPredefinedColor(c.hex)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${c.border} ${
                    pickedHexColor.toLowerCase() === c.hex.toLowerCase() ? 'ring-2 ring-cyan-400 scale-110 shadow' : ''
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={`Màu ${c.label} (${c.hex})`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-700 cursor-pointer">
              <span className="text-[11px] text-slate-400">Mã màu:</span>
              <input
                type="color"
                value={pickedHexColor}
                onChange={e => handleSelectPredefinedColor(e.target.value)}
                className="w-5 h-5 rounded border-0 bg-transparent cursor-pointer"
              />
              <span className="font-mono text-[11px] text-cyan-300 font-bold uppercase">{pickedHexColor}</span>
            </label>

            <button
              type="button"
              disabled={!currentBaseUrl}
              onClick={() => setActiveTool(prev => prev === 'eyedropper' ? 'none' : 'eyedropper')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTool === 'eyedropper'
                  ? 'bg-cyan-600 text-white animate-pulse'
                  : 'bg-slate-800 text-cyan-300 hover:bg-slate-700'
              }`}
            >
              <Pipette className="w-3.5 h-3.5" />
              <span>{activeTool === 'eyedropper' ? '🎯 Bấm lên ảnh để lấy màu' : 'Chấm màu trên ảnh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sliders & Parameters Fine-Tuning */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3.5">
        <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-2 border-b border-slate-800 pb-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>3. Tinh Chỉnh Độ Trong Suốt & Làm Đậm Nét Vẽ Toán Học / Sơ Đồ:</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tolerance */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-300">
              <span>Độ lọc màu nền (Tolerance):</span>
              <span className="font-mono text-cyan-400 font-bold">{tolerance}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="90"
              value={tolerance}
              onChange={e => setTolerance(Number(e.target.value))}
              disabled={!currentBaseUrl}
              className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Càng cao xóa càng rộng dải màu nền</span>
          </div>

          {/* Smooth Edge */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-300">
              <span>Làm mịn viền (Feathering):</span>
              <span className="font-mono text-cyan-400 font-bold">{smoothEdge} px</span>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              value={smoothEdge}
              onChange={e => setSmoothEdge(Number(e.target.value))}
              disabled={!currentBaseUrl}
              className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Khử răng cưa cho đường nét mượt mà</span>
          </div>

          {/* Contrast Boost */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-300">
              <span>Tăng tương phản nét vẽ:</span>
              <span className="font-mono text-cyan-400 font-bold">{contrastBoost}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              value={contrastBoost}
              onChange={e => setContrastBoost(Number(e.target.value))}
              disabled={!currentBaseUrl}
              className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Làm đậm nét chữ và đồ thị</span>
          </div>

          {/* Brightness */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-300">
              <span>Độ sáng (Brightness):</span>
              <span className="font-mono text-cyan-400 font-bold">{brightness > 0 ? `+${brightness}` : brightness}</span>
            </div>
            <input
              type="range"
              min="-40"
              max="40"
              value={brightness}
              onChange={e => setBrightness(Number(e.target.value))}
              disabled={!currentBaseUrl}
              className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Cân bằng sáng tối ảnh chụp</span>
          </div>
        </div>
      </div>

      {/* Image Preview Comparison */}
      {currentBaseUrl && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Đối Chiếu Trực Tiếp Ảnh Gốc & Ảnh Đã Xử Lý:</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewZoom(prev => Math.max(0.6, prev - 0.2))}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                title="Thu nhỏ xem trước"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono text-slate-400">{Math.round(previewZoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setPreviewZoom(prev => Math.min(2.0, prev + 0.2))}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                title="Phóng to xem trước"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original Image Canvas with Interactive Overlays */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-center space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span className="flex items-center gap-1">
                  <span>Ảnh Gốc Làm Việc</span>
                  {activeTool === 'crop' && <span className="text-amber-400 font-bold">(Đang chọn vùng cắt)</span>}
                  {activeTool === 'detect_objects' && <span className="text-purple-400 font-bold">(Đang hiển thị đối tượng)</span>}
                  {activeTool === 'brush_eraser' && <span className="text-rose-400 font-bold">(Cọ tẩy: Bấm để xóa)</span>}
                </span>
                {activeTool === 'eyedropper' && <span className="text-cyan-400 font-bold animate-pulse">🎯 Bấm điểm màu</span>}
              </div>

              <div
                ref={imageDisplayRef}
                className="h-72 flex items-center justify-center overflow-hidden bg-slate-900/90 rounded-xl relative select-none p-2"
                style={{ transform: `scale(${previewZoom})`, transformOrigin: 'center center' }}
              >
                <div
                  ref={imageWrapperRef}
                  onMouseDown={activeTool === 'crop' ? handleStartCreateCrop : undefined}
                  className="relative inline-flex items-center justify-center max-h-full max-w-full cursor-crosshair"
                >
                  <img
                    src={currentBaseUrl}
                    alt="Original"
                    onClick={handleOriginalImageClick}
                    className="max-h-64 max-w-full object-contain pointer-events-auto block select-none"
                    draggable={false}
                  />

                  {/* Crop Box Overlay with Interactive Drag & Resize Handles */}
                  {activeTool === 'crop' && cropBox && (
                    <div
                      className="absolute border-2 border-amber-400 bg-amber-500/25 shadow-2xl select-none z-20 cursor-move transition-none backdrop-brightness-110"
                      style={{
                        left: `${cropBox.x}%`,
                        top: `${cropBox.y}%`,
                        width: `${cropBox.width}%`,
                        height: `${cropBox.height}%`
                      }}
                      onMouseDown={(e) => startCropDrag(e, 'move')}
                    >
                      {/* Top banner tag */}
                      <div className="absolute -top-6 left-0 bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded shadow flex items-center gap-1 pointer-events-none select-none whitespace-nowrap z-30">
                        <Scissors className="w-3 h-3 text-slate-950" />
                        <span>Vùng Cắt: {Math.round(cropBox.width)}% × {Math.round(cropBox.height)}%</span>
                      </div>

                      {/* 4 Corner Resize Handles */}
                      <div
                        onMouseDown={(e) => startCropDrag(e, 'nw')}
                        className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-amber-500 rounded-sm cursor-nwse-resize hover:scale-125 hover:bg-amber-100 shadow-md transition-transform z-30"
                        title="Kéo góc trên-trái để phóng to / thu nhỏ"
                      />
                      <div
                        onMouseDown={(e) => startCropDrag(e, 'ne')}
                        className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-amber-500 rounded-sm cursor-nesw-resize hover:scale-125 hover:bg-amber-100 shadow-md transition-transform z-30"
                        title="Kéo góc trên-phải để phóng to / thu nhỏ"
                      />
                      <div
                        onMouseDown={(e) => startCropDrag(e, 'sw')}
                        className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-amber-500 rounded-sm cursor-nesw-resize hover:scale-125 hover:bg-amber-100 shadow-md transition-transform z-30"
                        title="Kéo góc dưới-trái để phóng to / thu nhỏ"
                      />
                      <div
                        onMouseDown={(e) => startCropDrag(e, 'se')}
                        className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-amber-500 rounded-sm cursor-nwse-resize hover:scale-125 hover:bg-amber-100 shadow-md transition-transform z-30"
                        title="Kéo góc dưới-phải để phóng to / thu nhỏ"
                      />

                      {/* 4 Edge Midpoint Handles */}
                      <div
                        onMouseDown={(e) => startCropDrag(e, 'n')}
                        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-3 bg-amber-400 border border-slate-950 rounded-full cursor-ns-resize hover:scale-125 shadow z-30"
                        title="Kéo cạnh trên"
                      />
                      <div
                        onMouseDown={(e) => startCropDrag(e, 's')}
                        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-3 bg-amber-400 border border-slate-950 rounded-full cursor-ns-resize hover:scale-125 shadow z-30"
                        title="Kéo cạnh dưới"
                      />
                      <div
                        onMouseDown={(e) => startCropDrag(e, 'w')}
                        className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-5 bg-amber-400 border border-slate-950 rounded-full cursor-ew-resize hover:scale-125 shadow z-30"
                        title="Kéo cạnh trái"
                      />
                      <div
                        onMouseDown={(e) => startCropDrag(e, 'e')}
                        className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-5 bg-amber-400 border border-slate-950 rounded-full cursor-ew-resize hover:scale-125 shadow z-30"
                        title="Kéo cạnh phải"
                      />

                      {/* Center move guide */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 hover:opacity-75">
                        <span className="text-[9px] text-amber-100 font-bold bg-slate-950/70 px-1.5 py-0.5 rounded shadow">
                          Kéo để di chuyển
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Detected Objects Overlays */}
                  {activeTool === 'detect_objects' && detectedObjects.map(obj => (
                    <div
                      key={obj.id}
                      onClick={() => setSelectedObjectId(obj.id)}
                      className={`absolute border-2 rounded transition-all cursor-pointer flex items-center justify-center ${
                        selectedObjectId === obj.id
                          ? 'border-purple-400 bg-purple-500/30 ring-2 ring-purple-400 z-10'
                          : 'border-cyan-400/80 bg-cyan-500/10 hover:bg-purple-500/20 hover:border-purple-400'
                      }`}
                      style={{
                        left: `${obj.minX}%`,
                        top: `${obj.minY}%`,
                        width: `${obj.width}%`,
                        height: `${obj.height}%`
                      }}
                      title={`Đối tượng #${obj.id}: Bấm để chọn xóa hoặc giữ`}
                    >
                      <span className="bg-purple-900/90 text-purple-200 border border-purple-600 font-extrabold text-[9px] px-1 py-0.5 rounded shadow">
                        #{obj.id}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Processed Result */}
            <div className="bg-slate-950 border border-cyan-800/60 rounded-2xl p-3 text-center space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-cyan-300">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ảnh Đã Tách Nền & Tăng Nét Hoàn Chỉnh</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {bgReplacement === 'transparent' ? 'Trong suốt' : bgReplacement}
                </span>
              </div>
              <div
                className="h-64 flex items-center justify-center overflow-hidden rounded-xl relative"
                style={{
                  backgroundImage:
                    bgReplacement === 'transparent'
                      ? 'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)'
                      : 'none',
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                  backgroundColor: bgReplacement === 'transparent' ? '#0f172a' : 'transparent',
                  transform: `scale(${previewZoom})`,
                  transformOrigin: 'center center'
                }}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Đang tối ưu thuật toán tách nền...
                  </div>
                ) : (
                  <img
                    src={processedUrl || currentBaseUrl}
                    alt="Processed"
                    className="max-h-full max-w-full object-contain"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Title & Metadata Input */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
              <label className="text-slate-400 text-[11px] whitespace-nowrap font-medium">Tên mô tả ảnh:</label>
              <input
                type="text"
                value={imageTitle}
                onChange={e => setImageTitle(e.target.value)}
                placeholder="VD: Hinh_1_SGK_Hinh_Hop_Chu_Nhat"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-medium"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleCopyToClipboard}
                className="px-3 py-2 rounded-xl bg-indigo-900/90 hover:bg-indigo-800 text-indigo-100 border border-indigo-700/60 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-105"
                title="Sao chép ảnh vào clipboard để dán trực tiếp vào file Word"
              >
                <Copy className="w-3.5 h-3.5 text-indigo-300" />
                <span>{copiedImage ? 'Đã Chép Ảnh!' : '📋 Copy Ảnh (Ctrl+V vào Word)'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const finalUrl = processedUrl || currentBaseUrl;
                  if (!finalUrl) return;
                  const link = document.createElement('a');
                  link.href = finalUrl;
                  link.download = `${imageTitle}_TachNen.png`;
                  link.click();
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Tải Ảnh (.PNG)</span>
              </button>

              <button
                type="button"
                onClick={handleInsert}
                className={`px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                  inserted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white'
                }`}
              >
                {inserted ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Đã Chèn Vào Giáo Án Thành Công!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Chèn Vào Giáo Án (Cuối Văn Bản)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={interactiveCanvasRef} className="hidden" />
    </div>
  );
};
