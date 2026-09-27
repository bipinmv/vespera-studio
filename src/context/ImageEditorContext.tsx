import React, { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { 
  Adjustments, 
  FilterPreset, 
  ViewMode, 
  ToolType, 
  ImageDimensions, 
  ImageEditorContextType,
  TextOverlay,
  DrawStroke,
  HistoryState,
  CollageLayoutPattern
} from '../types/editor';

const ImageEditorContext = createContext<ImageEditorContextType | null>(null);

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  exposure: 0,
  temperature: 0,
  blur: 0,
  vignette: 0,
  hueRotate: 0,
  grayscale: 0,
  sepia: 0,
  invert: 0,
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1600&q=80';

export const FILTER_PRESETS: FilterPreset[] = [
  { id: 'none', name: 'Original', icon: 'auto_awesome', adjustments: { ...DEFAULT_ADJUSTMENTS } },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: 'electric_bolt', adjustments: { ...DEFAULT_ADJUSTMENTS, contrast: 135, saturation: 160, hueRotate: -25, exposure: 10 } },
  { id: 'vintage', name: 'Vintage', icon: 'photo_camera_back', adjustments: { ...DEFAULT_ADJUSTMENTS, sepia: 40, contrast: 110, temperature: 25, saturation: 85 } },
  { id: 'bw', name: 'Mono Tech', icon: 'filter_b_and_w', adjustments: { ...DEFAULT_ADJUSTMENTS, grayscale: 100, contrast: 140, brightness: 105 } },
  { id: 'dramatic', name: 'Dramatic', icon: 'movie_filter', adjustments: { ...DEFAULT_ADJUSTMENTS, contrast: 150, saturation: 120, brightness: 90, vignette: 35 } },
  { id: 'film_grain', name: 'Film Grain', icon: 'grain', adjustments: { ...DEFAULT_ADJUSTMENTS, contrast: 115, saturation: 90, temperature: -15, exposure: 5 } },
  { id: 'emerald', name: 'Emerald', icon: 'gem', adjustments: { ...DEFAULT_ADJUSTMENTS, hueRotate: 45, saturation: 130, contrast: 115, temperature: -20 } },
  { id: 'warm_amber', name: 'Warm Amber', icon: 'sun', adjustments: { ...DEFAULT_ADJUSTMENTS, temperature: 40, saturation: 125, brightness: 105 } },
  { id: 'nordic_cold', name: 'Nordic Cold', icon: 'snowflake', adjustments: { ...DEFAULT_ADJUSTMENTS, temperature: -40, contrast: 130, saturation: 80, vignette: 20 } },
  { id: 'noir_matte', name: 'Noir Matte', icon: 'moon', adjustments: { ...DEFAULT_ADJUSTMENTS, grayscale: 100, contrast: 85, brightness: 110, vignette: 40 } },
  { id: 'pastel_dream', name: 'Pastel Dream', icon: 'cloud', adjustments: { ...DEFAULT_ADJUSTMENTS, brightness: 115, saturation: 80, contrast: 90, exposure: 15 } },
  { id: 'vivid_pop', name: 'Vivid Pop', icon: 'sparkles', adjustments: { ...DEFAULT_ADJUSTMENTS, saturation: 190, contrast: 125, brightness: 105 } },
];

interface ProviderProps {
  children: ReactNode;
}

export const ImageEditorProvider: React.FC<ProviderProps> = ({ children }) => {
  const [activeTool, setActiveTool] = useState<ToolType>('adjust');
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('No file opened');
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions>({ width: 0, height: 0 });
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS);
  const [activeFilterId, setActiveFilterId] = useState<string>('none');
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Crop Aspect Ratio State
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>('free');

  // Text Overlay State
  const [textOverlay, setTextOverlay] = useState<TextOverlay | null>(null);

  // Drawing Strokes State
  const [drawStrokes, setDrawStrokes] = useState<DrawStroke[]>([]);

  // Collage State & Controls
  const [collageImages, setCollageImages] = useState<string[]>([FALLBACK_IMAGE, FALLBACK_IMAGE, FALLBACK_IMAGE, FALLBACK_IMAGE]);
  const [userUploadedTileCount, setUserUploadedTileCount] = useState<number>(0);
  const [layoutPattern, setLayoutPattern] = useState<CollageLayoutPattern>('2x2');

  // Update collage initial image when a new imageSrc is loaded
  useEffect(() => {
    if (imageSrc) {
      setCollageImages(prev => [imageSrc, prev[1] || imageSrc, prev[2] || imageSrc, prev[3] || imageSrc]);
    }
  }, [imageSrc]);

  // Determine if user has uploaded/selected any photos into collage or editor
  const isCollageHasPhotos = useMemo(() => {
    return imageSrc !== null || userUploadedTileCount > 0;
  }, [imageSrc, userUploadedTileCount]);

  // History State for full Undo / Redo support (including crops)
  const [history, setHistory] = useState<HistoryState[]>([{ adjustments: DEFAULT_ADJUSTMENTS, imageSrc: null }]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const originalImgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const collageCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute if any changes/edits have been made to the photo
  const hasChanges = useMemo(() => {
    if (viewMode === 'collage') return isCollageHasPhotos;
    if (!imageSrc) return false;
    if (historyIndex > 0) return true;
    if (drawStrokes.length > 0) return true;
    if (textOverlay !== null) return true;
    return (
      adjustments.brightness !== 100 ||
      adjustments.contrast !== 100 ||
      adjustments.saturation !== 100 ||
      adjustments.exposure !== 0 ||
      adjustments.temperature !== 0 ||
      adjustments.blur !== 0 ||
      adjustments.vignette !== 0 ||
      adjustments.hueRotate !== 0 ||
      adjustments.grayscale !== 0 ||
      adjustments.sepia !== 0 ||
      adjustments.invert !== 0
    );
  }, [viewMode, isCollageHasPhotos, imageSrc, historyIndex, drawStrokes, textOverlay, adjustments]);

  useEffect(() => {
    if (!imageSrc) {
      originalImgRef.current = null;
      setImageDimensions({ width: 0, height: 0 });
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      originalImgRef.current = img;
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
  }, [imageSrc]);

  const handleCollageTileUpload = useCallback((index: number, file: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCollageImages(prev => {
      const next = [...prev];
      next[index] = url;
      return next;
    });
    setUserUploadedTileCount(c => c + 1);
  }, []);

  const updateAdjustment = useCallback((key: keyof Adjustments, value: number) => {
    setAdjustments(prev => {
      const updated = { ...prev, [key]: value };
      setHistory(hPrev => [
        ...hPrev.slice(0, historyIndex + 1), 
        { adjustments: updated, imageSrc }
      ]);
      setHistoryIndex(hPrev => hPrev + 1);
      return updated;
    });
  }, [historyIndex, imageSrc]);

  const applyCroppedImageSrc = useCallback((newSrc: string) => {
    setImageSrc(newSrc);
    setHistory(hPrev => [
      ...hPrev.slice(0, historyIndex + 1),
      { adjustments, imageSrc: newSrc }
    ]);
    setHistoryIndex(hPrev => hPrev + 1);
  }, [historyIndex, adjustments]);

  const applyPresetFilter = useCallback((filter: FilterPreset) => {
    setActiveFilterId(filter.id);
    setAdjustments(filter.adjustments);
    setHistory(prev => [
      ...prev.slice(0, historyIndex + 1), 
      { adjustments: filter.adjustments, imageSrc }
    ]);
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex, imageSrc]);

  const resetAdjustments = useCallback(() => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setActiveFilterId('none');
    setTextOverlay(null);
    setDrawStrokes([]);
    setSelectedAspectRatio('free');
    setHistory(prev => [
      ...prev.slice(0, historyIndex + 1), 
      { adjustments: DEFAULT_ADJUSTMENTS, imageSrc }
    ]);
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex, imageSrc]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const targetState = history[newIndex];
      setAdjustments(targetState.adjustments);
      if (targetState.imageSrc !== imageSrc) {
        setImageSrc(targetState.imageSrc);
      }
    }
  }, [historyIndex, history, imageSrc]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const targetState = history[newIndex];
      setAdjustments(targetState.adjustments);
      if (targetState.imageSrc !== imageSrc) {
        setImageSrc(targetState.imageSrc);
      }
    }
  }, [historyIndex, history, imageSrc]);

  const handleImageUpload = useCallback((file: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setImageName(file.name);
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setActiveFilterId('none');
    setTextOverlay(null);
    setDrawStrokes([]);
    setSelectedAspectRatio('free');
    setHistory([{ adjustments: DEFAULT_ADJUSTMENTS, imageSrc: url }]);
    setHistoryIndex(0);
  }, []);

  const clearImage = useCallback(() => {
    setImageSrc(null);
    setImageName('No file opened');
    setImageDimensions({ width: 0, height: 0 });
    originalImgRef.current = null;
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setActiveFilterId('none');
    setTextOverlay(null);
    setDrawStrokes([]);
    setSelectedAspectRatio('free');
    setHistory([{ adjustments: DEFAULT_ADJUSTMENTS, imageSrc: null }]);
    setHistoryIndex(0);
    setUserUploadedTileCount(0);
  }, []);

  const addDrawStroke = useCallback((stroke: DrawStroke) => {
    setDrawStrokes(prev => [...prev, stroke]);
  }, []);

  const clearDrawStrokes = useCallback(() => {
    setDrawStrokes([]);
  }, []);

  // Generate a processed canvas: handles both Editor Mode single image & Collage Mode grid
  const getProcessedCanvas = useCallback((): HTMLCanvasElement | null => {
    // 1. In Collage View Mode, return the rendered collage canvas
    if (viewMode === 'collage' && collageCanvasRef.current) {
      return collageCanvasRef.current;
    }

    // 2. In Editor / Split View Mode, render from originalImgRef
    const img = originalImgRef.current;
    if (!imageSrc || !img || !img.complete || img.naturalWidth === 0) {
      if (collageCanvasRef.current) return collageCanvasRef.current;
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const { brightness, contrast, saturation, exposure, temperature, blur, sepia, grayscale, hueRotate, invert, vignette } = adjustments;
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
    ctx.filter = 'none';

    // Apply Warmth / Temperature Tinting Layer
    if (temperature !== 0) {
      ctx.save();
      if (temperature > 0) {
        ctx.fillStyle = `rgba(255, 170, 0, ${(temperature / 100) * 0.3})`;
      } else {
        ctx.fillStyle = `rgba(0, 120, 255, ${(Math.abs(temperature) / 100) * 0.3})`;
      }
      ctx.globalCompositeOperation = 'color-burn';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    // Apply Vignette Overlay
    if (vignette > 0) {
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.3,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.7
      );
      const alpha = (vignette / 100) * 0.85;
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, `rgba(0,0,0,${alpha})`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Render Drawing Brush Strokes
    if (drawStrokes.length > 0) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      drawStrokes.forEach(stroke => {
        if (stroke.points.length < 2) return;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = (stroke.size / 100) * canvas.width * 0.05;
        ctx.beginPath();
        ctx.moveTo((stroke.points[0].x / 100) * canvas.width, (stroke.points[0].y / 100) * canvas.height);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo((stroke.points[i].x / 100) * canvas.width, (stroke.points[i].y / 100) * canvas.height);
        }
        ctx.stroke();
      });
      ctx.restore();
    }

    // Render Text Overlay Layer
    if (textOverlay && textOverlay.text.trim()) {
      ctx.save();
      const realFontSize = (textOverlay.fontSize / 100) * canvas.height * 0.15;
      ctx.font = `bold ${realFontSize}px Geist, sans-serif`;
      ctx.fillStyle = textOverlay.color;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      const tx = (textOverlay.x / 100) * canvas.width;
      const ty = (textOverlay.y / 100) * canvas.height;
      ctx.fillText(textOverlay.text, tx, ty);
      ctx.restore();
    }

    return canvas;
  }, [viewMode, imageSrc, adjustments, drawStrokes, textOverlay]);

  return (
    <ImageEditorContext.Provider
      value={{
        activeTool, setActiveTool,
        viewMode, setViewMode,
        imageSrc, setImageSrc,
        applyCroppedImageSrc,
        imageName, setImageName,
        imageDimensions, setImageDimensions,
        zoomLevel, setZoomLevel,
        adjustments, setAdjustments,
        updateAdjustment, resetAdjustments,
        activeFilterId, applyPresetFilter,
        isExportOpen, setIsExportOpen,
        history, historyIndex, undo, redo,
        handleImageUpload,
        clearImage,
        hasChanges,
        selectedAspectRatio, setSelectedAspectRatio,
        textOverlay, setTextOverlay,
        drawStrokes, addDrawStroke, clearDrawStrokes,
        collageImages, setCollageImages,
        layoutPattern, setLayoutPattern,
        handleCollageTileUpload,
        isCollageHasPhotos,
        getProcessedCanvas,
        originalImgRef, canvasRef, collageCanvasRef
      }}
    >
      {children}
    </ImageEditorContext.Provider>
  );
};

export const useImageEditor = (): ImageEditorContextType => {
  const context = useContext(ImageEditorContext);
  if (!context) {
    throw new Error('useImageEditor must be used within an ImageEditorProvider');
  }
  return context;
};
