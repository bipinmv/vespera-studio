import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  DragEvent,
  ChangeEvent,
  WheelEvent,
  MouseEvent
} from "react";
import { useImageEditor } from "../context/ImageEditorContext";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  UploadCloud,
  Image as ImageIcon,
  Plus,
  FileImage,
  FolderOpen,
  Check,
  X,
  Move
} from "lucide-react";

interface CropBox {
  x: number; // percentage 0 - 100
  y: number;
  w: number;
  h: number;
}

type DragMode = "create" | "move" | "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w" | null;

export const CanvasArea: React.FC = () => {
  const {
    imageSrc,
    applyCroppedImageSrc,
    adjustments,
    zoomLevel,
    setZoomLevel,
    setImageDimensions,
    imageDimensions,
    handleImageUpload,
    clearImage,
    handleRequestHome,
    activeTool,
    setActiveTool,
    selectedAspectRatio,
    textOverlays,
    selectedTextId,
    setSelectedTextId,
    updateTextOverlay,
    drawStrokes,
    addDrawStroke,
    brushMode,
    brushSize,
    brushColor,
    brushOpacity,
    createBlankCanvas
  } = useImageEditor();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cropOverlayRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggingTextId, setDraggingTextId] = useState<string | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);

  // Professional Crop State with 8-Handle Resizing & Box Moving
  const [cropBox, setCropBox] = useState<CropBox>({ x: 15, y: 15, w: 70, h: 70 });
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [initialCropBox, setInitialCropBox] = useState<CropBox | null>(null);

  // Brush Drawing State
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [brushPos, setBrushPos] = useState<{ x: number; y: number } | null>(null);
  const [currentStrokePoints, setCurrentStrokePoints] = useState<Array<{ x: number; y: number }>>(
    []
  );

  // Automatically enforce selected Aspect Ratio on cropBox
  useEffect(() => {
    if (selectedAspectRatio === "free") return;

    let targetRatio = 1; // w / h
    if (selectedAspectRatio === "1:1") targetRatio = 1;
    else if (selectedAspectRatio === "16:9") targetRatio = 16 / 9;
    else if (selectedAspectRatio === "4:3") targetRatio = 4 / 3;
    else if (selectedAspectRatio === "9:16") targetRatio = 9 / 16;
    else if (selectedAspectRatio === "3:2") targetRatio = 3 / 2;

    const img = imageRef.current;
    const canvasAspect = img && img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : 1;

    setCropBox(prev => {
      const newW = prev.w;
      const newH = Math.min(100 - prev.y, (newW * canvasAspect) / targetRatio);
      return { ...prev, h: Math.max(5, newH) };
    });
  }, [selectedAspectRatio]);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;

    if (!canvas || !img || !img.complete) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const {
      brightness,
      contrast,
      saturation,
      exposure,
      temperature,
      blur,
      sepia,
      grayscale,
      hueRotate,
      invert,
      vignette
    } = adjustments;

    const effectiveBrightness = Math.max(0, brightness + exposure * 0.5);

    ctx.filter = `
      brightness(${effectiveBrightness}%) 
      contrast(${contrast}%) 
      saturate(${saturation}%) 
      sepia(${sepia}%) 
      grayscale(${grayscale}%) 
      blur(${blur}px) 
      hue-rotate(${hueRotate}deg) 
      invert(${invert}%)
    `.trim();

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.filter = "none";

    // Temperature Warmth Tint
    if (temperature !== 0) {
      ctx.save();
      if (temperature > 0) {
        ctx.fillStyle = `rgba(255, 170, 0, ${(temperature / 100) * 0.3})`;
      } else {
        ctx.fillStyle = `rgba(0, 120, 255, ${(Math.abs(temperature) / 100) * 0.3})`;
      }
      ctx.globalCompositeOperation = "color-burn";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    // Vignette Effect
    if (vignette > 0) {
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) * 0.3,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) * 0.7
      );
      const alpha = (vignette / 100) * 0.85;
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, `rgba(0,0,0,${alpha})`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Render Brush Strokes onto a persistent isolated offscreen canvas layer
    if (drawStrokes.length > 0 || currentStrokePoints.length > 0) {
      if (!drawCanvasRef.current) {
        drawCanvasRef.current = document.createElement("canvas");
      }
      const drawCanvas = drawCanvasRef.current;
      if (drawCanvas.width !== canvas.width || drawCanvas.height !== canvas.height) {
        drawCanvas.width = canvas.width;
        drawCanvas.height = canvas.height;
      }
      const dCtx = drawCanvas.getContext("2d");
      if (dCtx) {
        dCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        dCtx.lineCap = "round";
        dCtx.lineJoin = "round";

        const allStrokes = [...drawStrokes];
        if (currentStrokePoints.length > 0) {
          allStrokes.push({
            points: currentStrokePoints,
            color: brushColor,
            size: brushSize,
            opacity: brushOpacity,
            mode: brushMode
          });
        }

        allStrokes.forEach(stroke => {
          if (!stroke.points || stroke.points.length === 0) return;
          dCtx.save();
          if (stroke.mode === "eraser") {
            dCtx.globalCompositeOperation = "destination-out";
            dCtx.strokeStyle = "rgba(0,0,0,1)";
            dCtx.fillStyle = "rgba(0,0,0,1)";
          } else {
            dCtx.globalCompositeOperation = "source-over";
            dCtx.globalAlpha = stroke.opacity ?? 1;
            dCtx.strokeStyle = stroke.color;
            dCtx.fillStyle = stroke.color;
          }
          const strokeWidth = Math.max(1, stroke.size * (canvas.width / 600));
          dCtx.lineWidth = strokeWidth;

          if (stroke.points.length === 1) {
            dCtx.beginPath();
            const px = (stroke.points[0].x / 100) * canvas.width;
            const py = (stroke.points[0].y / 100) * canvas.height;
            dCtx.arc(px, py, strokeWidth / 2, 0, Math.PI * 2);
            dCtx.fill();
          } else {
            dCtx.beginPath();
            dCtx.moveTo(
              (stroke.points[0].x / 100) * canvas.width,
              (stroke.points[0].y / 100) * canvas.height
            );
            for (let i = 1; i < stroke.points.length; i++) {
              dCtx.lineTo(
                (stroke.points[i].x / 100) * canvas.width,
                (stroke.points[i].y / 100) * canvas.height
              );
            }
            dCtx.stroke();
          }
          dCtx.restore();
        });

        ctx.drawImage(drawCanvas, 0, 0);
      }
    }

    // Render Multi-Text Overlay Layers
    textOverlays.forEach(item => {
      if (!item.text.trim()) return;
      ctx.save();
      const realFontSize = (item.fontSize / 100) * canvas.height * 0.15;
      const font = item.fontFamily || "Geist, sans-serif";
      ctx.font = `bold ${realFontSize}px ${font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = item.color;
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      const tx = (item.x / 100) * canvas.width;
      const ty = (item.y / 100) * canvas.height;
      ctx.fillText(item.text, tx, ty);
      ctx.restore();
    });
  }, [
    adjustments,
    drawStrokes,
    currentStrokePoints,
    textOverlays,
    brushColor,
    brushSize,
    brushOpacity,
    brushMode
  ]);

  useEffect(() => {
    if (!imageSrc) return;
    setIsImageLoading(true);

    const img = new Image();
    if (imageSrc.startsWith("http://") || imageSrc.startsWith("https://")) {
      img.crossOrigin = "anonymous";
    }
    img.src = imageSrc;
    img.onload = () => {
      imageRef.current = img;
      const width = img.naturalWidth || img.width || 800;
      const height = img.naturalHeight || img.height || 600;
      setImageDimensions({ width, height });
      setIsImageLoading(false);
      renderCanvas();
    };
    img.onerror = () => {
      setIsImageLoading(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc]);

  useEffect(() => {
    if (imageSrc) {
      renderCanvas();
    }
  }, [
    adjustments,
    rotation,
    imageSrc,
    drawStrokes,
    currentStrokePoints,
    textOverlays,
    brushColor,
    brushSize,
    brushOpacity,
    brushMode,
    renderCanvas
  ]);

  // Global Escape key to deselect active text overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedTextId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSelectedTextId]);

  // Mouse Wheel Zoom
  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (!imageSrc) return;
    e.preventDefault();
    setZoomLevel(prev => {
      const step = 15;
      if (e.deltaY < 0) {
        return Math.min(400, prev + step);
      } else {
        return Math.max(25, prev - step);
      }
    });
  };

  // Drag File Drop
  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  // Global Clipboard Paste Support (Cmd+V / Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: globalThis.ClipboardEvent) => {
      if (imageSrc) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            handleImageUpload(file);
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [imageSrc, handleImageUpload]);

  // ----------------------------------------------------
  // PROFESSIONAL CROP OVERLAY DRAG & RESIZE CONTROLLERS
  // ----------------------------------------------------
  const handleCropOverlayMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (activeTool !== "crop" || !cropOverlayRef.current) return;
    const rect = cropOverlayRef.current.getBoundingClientRect();
    const curX = ((e.clientX - rect.left) / rect.width) * 100;
    const curY = ((e.clientY - rect.top) / rect.height) * 100;

    setDragStartPos({ x: curX, y: curY });
    setInitialCropBox({ ...cropBox });

    // Check if clicked inside existing crop box -> Move mode
    if (
      curX >= cropBox.x &&
      curX <= cropBox.x + cropBox.w &&
      curY >= cropBox.y &&
      curY <= cropBox.y + cropBox.h
    ) {
      setDragMode("move");
    } else {
      // Clicked outside -> Create new box
      setDragMode("create");
      setCropBox({ x: curX, y: curY, w: 5, h: 5 });
    }
  };

  const startHandleDrag = (mode: DragMode, e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (activeTool !== "crop" || !cropOverlayRef.current) return;
    const rect = cropOverlayRef.current.getBoundingClientRect();
    const curX = ((e.clientX - rect.left) / rect.width) * 100;
    const curY = ((e.clientY - rect.top) / rect.height) * 100;

    setDragMode(mode);
    setDragStartPos({ x: curX, y: curY });
    setInitialCropBox({ ...cropBox });
  };

  const handleCropMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!dragMode || !dragStartPos || !initialCropBox || !cropOverlayRef.current) return;
    const rect = cropOverlayRef.current.getBoundingClientRect();
    const curX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const curY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    const deltaX = curX - dragStartPos.x;
    const deltaY = curY - dragStartPos.y;

    if (dragMode === "move") {
      // Shift box position while keeping dimensions fixed
      const newX = Math.max(0, Math.min(100 - initialCropBox.w, initialCropBox.x + deltaX));
      const newY = Math.max(0, Math.min(100 - initialCropBox.h, initialCropBox.y + deltaY));
      setCropBox({ ...initialCropBox, x: newX, y: newY });
      return;
    }

    if (dragMode === "create") {
      const x = Math.min(dragStartPos.x, curX);
      const y = Math.min(dragStartPos.y, curY);
      const w = Math.abs(curX - dragStartPos.x);
      const h = Math.abs(curY - dragStartPos.y);
      setCropBox({ x, y, w: Math.max(5, w), h: Math.max(5, h) });
      return;
    }

    // Handle corner/edge resizing
    let nextX = initialCropBox.x;
    let nextY = initialCropBox.y;
    let nextW = initialCropBox.w;
    let nextH = initialCropBox.h;

    if (dragMode.includes("e")) {
      nextW = Math.max(5, Math.min(100 - initialCropBox.x, initialCropBox.w + deltaX));
    }
    if (dragMode.includes("s")) {
      nextH = Math.max(5, Math.min(100 - initialCropBox.y, initialCropBox.h + deltaY));
    }
    if (dragMode.includes("w")) {
      const potentialW = initialCropBox.w - deltaX;
      if (potentialW >= 5 && initialCropBox.x + deltaX >= 0) {
        nextX = initialCropBox.x + deltaX;
        nextW = potentialW;
      }
    }
    if (dragMode.includes("n")) {
      const potentialH = initialCropBox.h - deltaY;
      if (potentialH >= 5 && initialCropBox.y + deltaY >= 0) {
        nextY = initialCropBox.y + deltaY;
        nextH = potentialH;
      }
    }

    // Enforce active Aspect Ratio constraint during handle resize
    if (selectedAspectRatio !== "free") {
      let ratio = 1;
      if (selectedAspectRatio === "1:1") ratio = 1;
      else if (selectedAspectRatio === "16:9") ratio = 16 / 9;
      else if (selectedAspectRatio === "4:3") ratio = 4 / 3;
      else if (selectedAspectRatio === "9:16") ratio = 9 / 16;
      else if (selectedAspectRatio === "3:2") ratio = 3 / 2;

      const img = imageRef.current;
      const canvasAspect = img && img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : 1;
      nextH = (nextW * canvasAspect) / ratio;
    }

    setCropBox({ x: nextX, y: nextY, w: nextW, h: nextH });
  };

  const handleCropMouseUp = () => {
    setDragMode(null);
    setDragStartPos(null);
    setInitialCropBox(null);
  };

  // Accurate Canvas Point Mapping (accounting for zoom and rotation)
  const getCanvasPoint = (clientX: number, clientY: number): { x: number; y: number } => {
    if (!canvasRef.current) return { x: 50, y: 50 };
    const rect = canvasRef.current.getBoundingClientRect();
    if (rotation === 0) {
      const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
      return { x, y };
    }
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rad = -(rotation * Math.PI) / 180;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const unrotatedDx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const unrotatedDy = dx * Math.sin(rad) + dy * Math.cos(rad);
    const unrotatedWidth = canvasRef.current.offsetWidth * (zoomLevel / 100);
    const unrotatedHeight = canvasRef.current.offsetHeight * (zoomLevel / 100);
    const x = Math.max(
      0,
      Math.min(100, ((unrotatedDx + unrotatedWidth / 2) / unrotatedWidth) * 100)
    );
    const y = Math.max(
      0,
      Math.min(100, ((unrotatedDy + unrotatedHeight / 2) / unrotatedHeight) * 100)
    );
    return { x, y };
  };

  // Interactive Brush & Eraser Drawing with Continuous Mouse Capture & RAF Batching
  const handleCanvasMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== "draw") {
      setActiveTool("draw");
    }
    setSelectedTextId(null);
    if (!canvasRef.current) return;

    e.preventDefault();
    setIsDrawing(true);
    const pt = getCanvasPoint(e.clientX, e.clientY);
    const points: { x: number; y: number }[] = [pt];
    setCurrentStrokePoints([pt]);

    let rafId: number | null = null;

    const onWindowMove = (moveEvt: globalThis.MouseEvent) => {
      const newPt = getCanvasPoint(moveEvt.clientX, moveEvt.clientY);
      points.push(newPt);
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          rafId = null;
          setCurrentStrokePoints([...points]);
        });
      }
    };

    const onWindowUp = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      window.removeEventListener("mousemove", onWindowMove);
      window.removeEventListener("mouseup", onWindowUp);
      setIsDrawing(false);
      if (points.length > 0) {
        addDrawStroke({
          points: [...points],
          color: brushColor,
          size: brushSize,
          opacity: brushOpacity,
          mode: brushMode
        });
      }
      setCurrentStrokePoints([]);
    };

    window.addEventListener("mousemove", onWindowMove);
    window.addEventListener("mouseup", onWindowUp);
  };

  const handleCanvasMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === "draw") {
      setBrushPos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
    }
  };

  const handleCanvasMouseLeave = () => {
    setBrushPos(null);
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  // Drag and reposition a specific text overlay by id
  const handleTextDragStart = (id: string, e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const item = textOverlays.find(t => t.id === id);
    if (!canvasRef.current || !item) return;

    setSelectedTextId(id);
    setDraggingTextId(id);
    const canvas = canvasRef.current;
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startTextX = item.x;
    const startTextY = item.y;

    const onMouseMove = (moveEvent: globalThis.MouseEvent) => {
      const zoom = zoomLevel / 100;
      const rad = -(rotation * Math.PI) / 180;
      const screenDx = moveEvent.clientX - startMouseX;
      const screenDy = moveEvent.clientY - startMouseY;
      const localDx = (screenDx * Math.cos(rad) - screenDy * Math.sin(rad)) / zoom;
      const localDy = (screenDx * Math.sin(rad) + screenDy * Math.cos(rad)) / zoom;

      const deltaXPercent = (localDx / canvas.offsetWidth) * 100;
      const deltaYPercent = (localDy / canvas.offsetHeight) * 100;

      const newX = Math.max(2, Math.min(98, startTextX + deltaXPercent));
      const newY = Math.max(2, Math.min(98, startTextY + deltaYPercent));

      updateTextOverlay(id, {
        x: Math.round(newX * 10) / 10,
        y: Math.round(newY * 10) / 10
      });
    };

    const onMouseUp = () => {
      setDraggingTextId(null);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Apply Crop Action (Pushes to History so Undo Crop works!)
  const applyCrop = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const img = imageRef.current;
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const realX = Math.round((cropBox.x / 100) * img.naturalWidth);
    const realY = Math.round((cropBox.y / 100) * img.naturalHeight);
    const realW = Math.round((cropBox.w / 100) * img.naturalWidth);
    const realH = Math.round((cropBox.h / 100) * img.naturalHeight);

    if (realW < 10 || realH < 10) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = realW;
    tempCanvas.height = realH;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    tempCtx.drawImage(img, realX, realY, realW, realH, 0, 0, realW, realH);

    tempCanvas.toBlob(blob => {
      if (!blob) return;
      const croppedUrl = URL.createObjectURL(blob);
      applyCroppedImageSrc(croppedUrl);
      setActiveTool("adjust");
      setCropBox({ x: 15, y: 15, w: 70, h: 70 });
    }, "image/png");
  };

  const cancelCrop = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setActiveTool("adjust");
  };

  return (
    <main
      ref={containerRef}
      onWheel={handleWheel}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onMouseDown={e => {
        if (e.target === containerRef.current || (e.target as HTMLElement).tagName === "MAIN") {
          setSelectedTextId(null);
        }
      }}
      className="flex-1 bg-[#131313] relative flex flex-col items-center justify-center overflow-hidden p-6 select-none cursor-crosshair"
    >
      {/* Background Canvas Grid Pattern */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#8d90a0 1px, transparent 1px)`,
          backgroundSize: "24px 24px"
        }}
      ></div>

      {/* Dragging Active Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-[#2563eb]/20 backdrop-blur-md border-2 border-dashed border-[#2563eb] flex flex-col items-center justify-center z-50 transition-all">
          <UploadCloud className="w-16 h-16 text-[#2563eb] animate-bounce" />
          <p className="text-xl font-bold text-white mt-3">Drop Image to Edit in Vespera</p>
          <span className="text-xs text-[#b4c5ff] font-mono mt-1">
            PNG, JPG, WEBP, or SVG supported
          </span>
        </div>
      )}

      {/* EMPTY STATE - ORGANIC MOVING / ROTATING FLUID SHAPE WITH ORIGINAL CONTENT */}
      {!imageSrc ? (
        <div className="flex flex-col items-center justify-center z-20 animate-fadeIn select-none p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileInputChange}
            className="hidden"
          />

          {/* Fluid Blob Interactive Container */}
          <div
            onClick={e => {
              if ((e.target as HTMLElement).closest("label, input")) return;
              fileInputRef.current?.click();
            }}
            className="relative w-[380px] h-[390px] sm:w-[470px] sm:h-[480px] flex items-center justify-center cursor-pointer group"
          >
            {/* Layer 1: Outermost Translucent Slow Rotating Fluid Shape */}
            <div className="absolute inset-0 bg-[#2563eb]/20 animate-blob-outer transition-transform group-hover:scale-105 duration-700" />

            {/* Layer 2: Middle Translucent Reverse Rotating Fluid Shape */}
            <div className="absolute inset-3 sm:inset-4 bg-[#2563eb]/35 animate-blob-mid transition-transform group-hover:scale-105 duration-700" />

            {/* Layer 3: Innermost Obsidian Glass Fluid Shape */}
            <div className="absolute inset-6 sm:inset-7 bg-gradient-to-b from-[#1c1b1b]/95 via-[#18181b]/95 to-[#121622]/95 backdrop-blur-2xl border-2 border-[#2563eb]/50 shadow-[0_0_60px_rgba(37,99,235,0.35)] animate-blob-inner transition-transform group-hover:scale-105 duration-700" />

            {/* Center Content (Stationary, upright, and crystal clear) */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-4 max-w-[280px] sm:max-w-[340px]">
              {/* Icon with gradient ring & plus badge */}
              <div className="relative mb-3.5 transition-transform group-hover:scale-105 duration-300">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-[#2563eb] to-[#b4c5ff] p-0.5 shadow-xl shadow-blue-900/30">
                  <div className="w-full h-full bg-[#131313] rounded-[14px] flex items-center justify-center text-[#2563eb]">
                    <FileImage className="w-8 h-8 sm:w-9 sm:h-9" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-[#2563eb] text-white p-1 rounded-full border-2 border-[#1c1b1b]">
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Title & Description */}
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Open an Image to Begin
              </h2>
              <p className="text-[11px] sm:text-xs text-[#8d90a0] mt-1.5 leading-relaxed max-w-[260px] sm:max-w-xs">
                Drag and drop your photo anywhere on screen, or browse from your device.
              </p>

              {/* Browse Button */}
              <div className="mt-4 sm:mt-5 w-full max-w-[220px]">
                <label
                  onClick={e => e.stopPropagation()}
                  className="w-full py-2.5 px-4 bg-[#2563eb] hover:bg-blue-600 text-white font-semibold text-xs rounded-xl cursor-pointer transition shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Browse Image File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onFileInputChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Or start blank canvas for sketching */}
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  createBlankCanvas(1200, 800, "#18181b");
                }}
                className="mt-2 text-[11px] text-[#8d90a0] hover:text-[#b4c5ff] transition-colors underline underline-offset-4 cursor-pointer"
              >
                or create a blank canvas to sketch
              </button>

              {/* Supported Formats */}
              <div className="flex items-center gap-1.5 sm:gap-2 mt-4 pt-3.5 border-t border-[#2a2a2a]/80 w-full justify-center text-[10px] font-mono text-[#8d90a0]">
                <span className="uppercase text-[9px] text-[#56596b]">Supported:</span>
                {["PNG", "JPEG", "WEBP", "SVG"].map(fmt => (
                  <span
                    key={fmt}
                    className="px-2 py-0.5 rounded bg-[#131313]/90 border border-[#2a2a2a] text-[#a1a4b5]"
                  >
                    {fmt}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* CANVAS WORKSPACE */
        <>
          {/* Top Crop Action Bar */}
          {activeTool === "crop" && (
            <div
              onMouseDown={e => e.stopPropagation()}
              onMouseUp={e => e.stopPropagation()}
              onClick={e => e.stopPropagation()}
              className="absolute top-4 bg-[#1c1b1b] border border-[#2a2a2a] p-1.5 rounded-full flex items-center gap-2 shadow-2xl z-50 animate-fadeIn"
            >
              <button
                onClick={applyCrop}
                className="px-4 py-1.5 bg-[#2563eb] hover:bg-blue-600 text-white text-xs font-semibold rounded-full flex items-center gap-1.5 whitespace-nowrap shadow-md cursor-pointer transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Crop</span>
              </button>
              <button
                onClick={cancelCrop}
                className="px-3 py-1.5 hover:bg-[#2a2a2a] text-[#8d90a0] hover:text-white text-xs font-medium rounded-full flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </div>
          )}

          <div
            className="relative transition-transform duration-200 ease-out max-w-full max-h-full flex items-center justify-center"
            style={{
              transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`
            }}
          >
            <div className="relative inline-block leading-none">
              <canvas
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={handleCanvasMouseLeave}
                onMouseUp={handleCanvasMouseUp}
                className={`max-w-[75vw] max-h-[72vh] w-auto h-auto canvas-shadow rounded-sm border border-[#2a2a2a] block ${
                  activeTool === "draw"
                    ? brushMode === "eraser"
                      ? "cursor-cell"
                      : "cursor-crosshair"
                    : ""
                }`}
              />

              {/* Dynamic Live Brush / Eraser Size Ring Cursor */}
              {activeTool === "draw" && brushPos && (
                <div
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/90 shadow-[0_0_2px_rgba(0,0,0,0.8)] z-40 transition-none"
                  style={{
                    left: brushPos.x,
                    top: brushPos.y,
                    width: Math.max(1, brushSize * ((canvasRef.current?.offsetWidth || 600) / 600)),
                    height: Math.max(
                      1,
                      brushSize * ((canvasRef.current?.offsetWidth || 600) / 600)
                    ),
                    backgroundColor:
                      brushMode === "eraser" ? "rgba(255,255,255,0.25)" : `${brushColor}33`,
                    borderColor: brushMode === "eraser" ? "#ffffff" : brushColor
                  }}
                />
              )}

              {/* Draggable Multi-Text Overlay Elements */}
              {textOverlays.map(item => {
                if (!item.text.trim()) return null;
                const isSelected = item.id === selectedTextId;
                const isDraggingThis = item.id === draggingTextId;

                return (
                  <div
                    key={item.id}
                    onMouseDown={e => handleTextDragStart(item.id, e)}
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedTextId(item.id);
                    }}
                    style={{
                      left: `${item.x}%`,
                      top: `${item.y}%`
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-30 select-none group cursor-grab active:cursor-grabbing pointer-events-auto ${
                      isSelected ? "z-40" : ""
                    }`}
                  >
                    <div
                      className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ${
                        isDraggingThis
                          ? "border-2 border-dashed border-[#2563eb] bg-[#2563eb]/25 shadow-xl scale-105 ring-2 ring-[#2563eb]/50"
                          : isSelected
                            ? "border-2 border-dashed border-[#2563eb] bg-[#2563eb]/15 shadow-md"
                            : activeTool === "text"
                              ? "border border-dashed border-[#2563eb]/60 bg-[#2563eb]/5 hover:border-[#2563eb] hover:bg-[#2563eb]/15"
                              : "border border-transparent hover:border-dashed hover:border-white/50 hover:bg-black/30"
                      }`}
                    >
                      {/* Transparent placeholder matching text size */}
                      <span
                        style={{
                          fontSize: `${Math.max(10, Math.min(48, item.fontSize * 0.45))}px`,
                          fontFamily: item.fontFamily || "Geist, sans-serif"
                        }}
                        className="font-bold opacity-0 pointer-events-none whitespace-pre"
                      >
                        {item.text}
                      </span>

                      {/* Drag / Selection indicator badge */}
                      <div
                        className={`absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap flex items-center gap-1 transition-opacity ${
                          isDraggingThis || isSelected
                            ? "opacity-100 bg-[#1c1b1b] border border-[#2563eb] text-white shadow-lg"
                            : "opacity-0 group-hover:opacity-100 bg-[#1c1b1b] border border-[#2a2a2a] text-[#8d90a0]"
                        }`}
                      >
                        <Move className="w-2.5 h-2.5 text-[#2563eb]" />
                        <span>
                          {isDraggingThis
                            ? `${Math.round(item.x)}%, ${Math.round(item.y)}%`
                            : isSelected
                              ? "Selected • Drag to move"
                              : "Click to select"}
                        </span>
                        {isSelected && !isDraggingThis && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedTextId(null);
                            }}
                            className="ml-1 text-[#8d90a0] hover:text-white transition p-0.5 rounded hover:bg-[#2a2a2a]"
                            title="Unselect (or press Esc)"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Interactive 8-Handle Crop Selection Overlay */}
              {activeTool === "crop" && (
                <div
                  ref={cropOverlayRef}
                  onMouseDown={handleCropOverlayMouseDown}
                  onMouseMove={handleCropMouseMove}
                  onMouseUp={handleCropMouseUp}
                  className="absolute inset-0 z-30 cursor-crosshair border border-[#2563eb]/30"
                >
                  <div
                    className="absolute border-2 border-[#2563eb] bg-[#2563eb]/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] cursor-move"
                    style={{
                      left: `${cropBox.x}%`,
                      top: `${cropBox.y}%`,
                      width: `${cropBox.w}%`,
                      height: `${cropBox.h}%`
                    }}
                  >
                    {/* 4 Corner Handles */}
                    <div
                      onMouseDown={e => startHandleDrag("nw", e)}
                      className="w-3.5 h-3.5 bg-white border-2 border-[#2563eb] absolute -top-2 -left-2 cursor-nwse-resize rounded-full shadow hover:scale-125 transition-transform"
                    />
                    <div
                      onMouseDown={e => startHandleDrag("ne", e)}
                      className="w-3.5 h-3.5 bg-white border-2 border-[#2563eb] absolute -top-2 -right-2 cursor-nesw-resize rounded-full shadow hover:scale-125 transition-transform"
                    />
                    <div
                      onMouseDown={e => startHandleDrag("sw", e)}
                      className="w-3.5 h-3.5 bg-white border-2 border-[#2563eb] absolute -bottom-2 -left-2 cursor-nesw-resize rounded-full shadow hover:scale-125 transition-transform"
                    />
                    <div
                      onMouseDown={e => startHandleDrag("se", e)}
                      className="w-3.5 h-3.5 bg-white border-2 border-[#2563eb] absolute -bottom-2 -right-2 cursor-nwse-resize rounded-full shadow hover:scale-125 transition-transform"
                    />

                    {/* 4 Edge Handles */}
                    <div
                      onMouseDown={e => startHandleDrag("n", e)}
                      className="w-6 h-2 bg-white border border-[#2563eb] absolute -top-1 left-1/2 -translate-x-1/2 cursor-ns-resize rounded-sm shadow hover:scale-110 transition-transform"
                    />
                    <div
                      onMouseDown={e => startHandleDrag("s", e)}
                      className="w-6 h-2 bg-white border border-[#2563eb] absolute -bottom-1 left-1/2 -translate-x-1/2 cursor-ns-resize rounded-sm shadow hover:scale-110 transition-transform"
                    />
                    <div
                      onMouseDown={e => startHandleDrag("w", e)}
                      className="w-2 h-6 bg-white border border-[#2563eb] absolute top-1/2 -left-1 -translate-y-1/2 cursor-ew-resize rounded-sm shadow hover:scale-110 transition-transform"
                    />
                    <div
                      onMouseDown={e => startHandleDrag("e", e)}
                      className="w-2 h-6 bg-white border border-[#2563eb] absolute top-1/2 -right-1 -translate-y-1/2 cursor-ew-resize rounded-sm shadow hover:scale-110 transition-transform"
                    />

                    {/* 3x3 Grid Overlay Lines */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                      <div className="border-r border-b border-white/60"></div>
                      <div className="border-r border-b border-white/60"></div>
                      <div className="border-b border-white/60"></div>
                      <div className="border-r border-b border-white/60"></div>
                      <div className="border-r border-b border-white/60"></div>
                      <div className="border-b border-white/60"></div>
                      <div className="border-r border-white/60"></div>
                      <div className="border-r border-white/60"></div>
                      <div></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {isImageLoading && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center text-white text-xs font-mono">
                Loading image...
              </div>
            )}
          </div>

          {/* Floating Bottom Canvas Controls Bar */}
          <div className="absolute bottom-5 bg-[#1c1b1b]/90 backdrop-blur-md border border-[#2a2a2a] px-4 py-2 rounded-full flex items-center gap-4 text-xs shadow-xl z-20">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5 border-r border-[#2a2a2a] pr-3">
              <button
                onClick={() => setZoomLevel(prev => Math.max(25, prev - 15))}
                className="p-1 hover:text-white text-[#8d90a0] transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono text-white text-xs w-10 text-center">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(300, prev + 15))}
                className="p-1 hover:text-white text-[#8d90a0] transition"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="p-1 hover:text-white text-[#8d90a0] transition ml-1"
                title="Reset Zoom (100%)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Rotate Button */}
            <button
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="flex items-center gap-1.5 text-[#8d90a0] hover:text-white transition border-r border-[#2a2a2a] pr-3"
              title="Rotate 90°"
            >
              <RotateCw className="w-4 h-4" />
              <span>Rotate</span>
            </button>

            {/* Image Resolution Metadata */}
            <div className="flex items-center gap-1.5 text-[#8d90a0] font-mono text-[11px] border-r border-[#2a2a2a] pr-3">
              <ImageIcon className="w-3.5 h-3.5 text-[#b4c5ff]" />
              <span>
                {imageDimensions.width} × {imageDimensions.height} px
              </span>
            </div>

            {/* Close / Replace Image */}
            <button
              onClick={handleRequestHome}
              className="text-[#8d90a0] hover:text-red-400 transition font-mono text-[11px]"
              title="Close current image"
            >
              Close Image
            </button>
          </div>
        </>
      )}
    </main>
  );
};
