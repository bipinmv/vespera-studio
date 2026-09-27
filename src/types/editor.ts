export interface Adjustments {
  brightness: number; // 0 - 200%
  contrast: number; // 0 - 200%
  saturation: number; // 0 - 200%
  exposure: number; // -100 to +100
  temperature: number; // -100 to +100
  blur: number; // 0 - 20px
  vignette: number; // 0 - 100%
  hueRotate: number; // -180 to 180 deg
  grayscale: number; // 0 - 100%
  sepia: number; // 0 - 100%
  invert: number; // 0 - 100%
}

export interface FilterPreset {
  id: string;
  name: string;
  icon: string;
  adjustments: Adjustments;
}

export type ViewMode = "editor" | "split" | "collage";

export type ToolType = "adjust" | "filters" | "crop" | "split" | "collage" | "text" | "draw";

export type CollageLayoutPattern =
  "2x2" | "split" | "h3" | "v3" | "top1bottom2" | "bottom1top2" | "left1right3" | "grid3x3";

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface TextItem {
  id: string;
  text: string;
  color: string;
  fontSize: number;
  fontFamily?: string;
  x: number; // percentage 0 - 100
  y: number;
}

export type BrushMode = "brush" | "eraser";

export interface DrawStroke {
  id?: string;
  points: Array<{ x: number; y: number }>; // percentages 0 - 100
  color: string;
  size: number;
  opacity?: number;
  mode?: BrushMode;
}

export interface HistoryState {
  adjustments: Adjustments;
  imageSrc: string | null;
}

export type CollageFilter =
  "none" | "vivid" | "warm" | "cool" | "mono" | "vintage" | "dramatic" | "cyber";

export interface CollageSettings {
  gap: number;
  padding: number;
  borderRadius: number;
  bgColor: string;
  filter: CollageFilter;
}

export interface ImageEditorContextType {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  imageSrc: string | null;
  setImageSrc: (src: string | null) => void;
  applyCroppedImageSrc: (newSrc: string) => void;
  imageName: string;
  setImageName: (name: string) => void;
  imageDimensions: ImageDimensions;
  setImageDimensions: (dims: ImageDimensions) => void;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  adjustments: Adjustments;
  setAdjustments: React.Dispatch<React.SetStateAction<Adjustments>>;
  updateAdjustment: (key: keyof Adjustments, value: number) => void;
  resetAdjustments: () => void;
  activeFilterId: string;
  applyPresetFilter: (filter: FilterPreset) => void;
  isExportOpen: boolean;
  setIsExportOpen: (open: boolean) => void;
  history: HistoryState[];
  historyIndex: number;
  undo: () => void;
  redo: () => void;
  handleImageUpload: (file: File) => void;
  clearImage: () => void;
  hasChanges: boolean;

  // Aspect Ratio State
  selectedAspectRatio: string;
  setSelectedAspectRatio: (ratio: string) => void;

  // Multi-Text Overlay State
  textOverlays: TextItem[];
  selectedTextId: string | null;
  setSelectedTextId: (id: string | null) => void;
  addTextOverlay: (initialText?: string) => void;
  updateTextOverlay: (id: string, updates: Partial<Omit<TextItem, "id">>) => void;
  removeTextOverlay: (id: string) => void;
  clearTextOverlays: () => void;

  // Drawing & Masking State
  drawStrokes: DrawStroke[];
  addDrawStroke: (stroke: DrawStroke) => void;
  undoLastStroke: () => void;
  clearDrawStrokes: () => void;
  brushMode: BrushMode;
  setBrushMode: (mode: BrushMode) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  brushColor: string;
  setBrushColor: (color: string) => void;
  brushOpacity: number;
  setBrushOpacity: (opacity: number) => void;
  createBlankCanvas: (width?: number, height?: number, color?: string) => void;

  // Collage State & Export Support
  collageImages: string[];
  setCollageImages: React.Dispatch<React.SetStateAction<string[]>>;
  layoutPattern: CollageLayoutPattern;
  setLayoutPattern: (pattern: CollageLayoutPattern) => void;
  handleCollageTileUpload: (index: number, file: File) => void;
  isCollageHasPhotos: boolean;
  collageSettings: CollageSettings;
  updateCollageSettings: <K extends keyof CollageSettings>(
    key: K,
    value: CollageSettings[K]
  ) => void;
  resetCollageSettings: () => void;
  clearCollagePhotos: () => void;

  getProcessedCanvas: () => HTMLCanvasElement | null;
  originalImgRef: React.RefObject<HTMLImageElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  collageCanvasRef: React.RefObject<HTMLCanvasElement | null>;
}
