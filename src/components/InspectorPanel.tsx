import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useImageEditor, FILTER_PRESETS } from '../context/ImageEditorContext';
import { Adjustments } from '../types/editor';
import { 
  Sliders, 
  Wand2, 
  BarChart3, 
  RotateCcw, 
  ChevronDown, 
  Sun, 
  Contrast, 
  Droplet, 
  Thermometer, 
  Eye, 
  Sparkles,
  Zap,
  Crop as CropIcon,
  Type as TypeIcon,
  Pencil as PencilIcon,
  Trash2
} from 'lucide-react';

interface OpenSections {
  adjustments: boolean;
  filters: boolean;
  crop: boolean;
  text: boolean;
  draw: boolean;
  histogram: boolean;
}

export const InspectorPanel: React.FC = () => {
  const { 
    adjustments, 
    updateAdjustment, 
    resetAdjustments, 
    activeFilterId, 
    applyPresetFilter,
    imageDimensions,
    activeTool,
    imageSrc,
    selectedAspectRatio,
    setSelectedAspectRatio,
    textOverlay,
    setTextOverlay,
    clearDrawStrokes,
    drawStrokes
  } = useImageEditor();

  const [openSections, setOpenSections] = useState<OpenSections>({
    adjustments: true,
    filters: true,
    crop: true,
    text: true,
    draw: true,
    histogram: true
  });

  // Section DOM Refs for Auto-Scroll & Highlighting
  const adjustRef = useRef<HTMLDivElement | null>(null);
  const filtersRef = useRef<HTMLDivElement | null>(null);
  const cropRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const drawRef = useRef<HTMLDivElement | null>(null);

  // Local state for Text & Draw
  const [textInput, setTextInput] = useState<string>('Vespera Design');
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const [textSize, setTextSize] = useState<number>(35);
  const [brushSize, setBrushSize] = useState<number>(20);
  const [brushColor, setBrushColor] = useState<string>('#2563eb');

  // Reactively open and scroll to the matching section when activeTool changes
  useEffect(() => {
    if (!imageSrc) return;
    if (activeTool === 'adjust') {
      setOpenSections(prev => ({ ...prev, adjustments: true }));
      adjustRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else if (activeTool === 'filters') {
      setOpenSections(prev => ({ ...prev, filters: true }));
      filtersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else if (activeTool === 'crop') {
      setOpenSections(prev => ({ ...prev, crop: true }));
      cropRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else if (activeTool === 'text') {
      setOpenSections(prev => ({ ...prev, text: true }));
      textRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else if (activeTool === 'draw') {
      setOpenSections(prev => ({ ...prev, draw: true }));
      drawRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeTool, imageSrc]);

  // Sync Text Overlay when textInput, textColor, or textSize changes
  const applyTextLayer = (str: string, color: string, sz: number) => {
    setTextInput(str);
    setTextColor(color);
    setTextSize(sz);
    if (!str.trim()) {
      setTextOverlay(null);
    } else {
      setTextOverlay({
        text: str,
        color: color,
        fontSize: sz,
        x: textOverlay?.x ?? 15,
        y: textOverlay?.y ?? 25
      });
    }
  };

  // Do not render Inspector Panel if no image is opened
  if (!imageSrc) {
    return null;
  }

  const toggleSection = (section: keyof OpenSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSliderChange = (key: keyof Adjustments, e: ChangeEvent<HTMLInputElement>) => {
    updateAdjustment(key, Number(e.target.value));
  };

  return (
    <aside className="w-[280px] bg-[#1c1b1b] border-l border-[#2a2a2a] flex flex-col h-full overflow-y-auto select-none z-20 animate-fadeIn">
      {/* Inspector Panel Title */}
      <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center justify-between sticky top-0 bg-[#1c1b1b] z-30">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#2563eb]" />
          <span className="font-semibold text-xs tracking-wider uppercase text-[#e5e2e1]">INSPECTOR</span>
        </div>
        <button 
          onClick={resetAdjustments}
          className="text-[11px] text-[#8d90a0] hover:text-[#2563eb] flex items-center gap-1 font-mono transition"
          title="Reset to defaults"
        >
          <RotateCcw className="w-3 h-3" />
          <span>RESET</span>
        </button>
      </div>

      {/* Accordion Section 1: Light & Color Adjustments */}
      <div 
        ref={adjustRef}
        className={`border-b border-[#2a2a2a] transition-all duration-300 ${
          activeTool === 'adjust' ? 'bg-[#2563eb]/10 border-l-4 border-l-[#2563eb]' : ''
        }`}
      >
        <button 
          onClick={() => toggleSection('adjustments')}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-[#e5e2e1] hover:bg-[#201f1f] transition"
        >
          <div className="flex items-center gap-2">
            <Sliders className={`w-3.5 h-3.5 ${activeTool === 'adjust' ? 'text-[#2563eb]' : 'text-[#8d90a0]'}`} />
            <span className={`uppercase tracking-wider ${activeTool === 'adjust' ? 'text-white font-bold' : ''}`}>LIGHT & COLOR</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-[#8d90a0] transition-transform ${openSections.adjustments ? 'rotate-180' : ''}`} />
        </button>

        {openSections.adjustments && (
          <div className="p-4 flex flex-col gap-4 bg-[#131313]/40">
            {/* Brightness */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#8d90a0] flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-yellow-400" />
                  Brightness
                </span>
                <span className="text-white font-medium">{adjustments.brightness}%</span>
              </div>
              <input 
                type="range" min="0" max="200" value={adjustments.brightness}
                onChange={(e) => handleSliderChange('brightness', e)}
                className="w-full h-1.5 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
              />
            </div>

            {/* Contrast */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#8d90a0] flex items-center gap-1.5">
                  <Contrast className="w-3.5 h-3.5 text-blue-400" />
                  Contrast
                </span>
                <span className="text-white font-medium">{adjustments.contrast}%</span>
              </div>
              <input 
                type="range" min="0" max="200" value={adjustments.contrast}
                onChange={(e) => handleSliderChange('contrast', e)}
                className="w-full h-1.5 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
              />
            </div>

            {/* Saturation */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#8d90a0] flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-pink-400" />
                  Saturation
                </span>
                <span className="text-white font-medium">{adjustments.saturation}%</span>
              </div>
              <input 
                type="range" min="0" max="200" value={adjustments.saturation}
                onChange={(e) => handleSliderChange('saturation', e)}
                className="w-full h-1.5 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
              />
            </div>

            {/* Exposure */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#8d90a0] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Exposure
                </span>
                <span className="text-white font-medium">{adjustments.exposure > 0 ? `+${adjustments.exposure}` : adjustments.exposure}</span>
              </div>
              <input 
                type="range" min="-100" max="100" value={adjustments.exposure}
                onChange={(e) => handleSliderChange('exposure', e)}
                className="w-full h-1.5 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
              />
            </div>

            {/* Warmth */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#8d90a0] flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                  Warmth
                </span>
                <span className="text-white font-medium">{adjustments.temperature > 0 ? `+${adjustments.temperature}` : adjustments.temperature}</span>
              </div>
              <input 
                type="range" min="-50" max="50" value={adjustments.temperature}
                onChange={(e) => handleSliderChange('temperature', e)}
                className="w-full h-1.5 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
              />
            </div>

            {/* Blur */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#8d90a0] flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  Blur Radius
                </span>
                <span className="text-white font-medium">{adjustments.blur}px</span>
              </div>
              <input 
                type="range" min="0" max="20" value={adjustments.blur}
                onChange={(e) => handleSliderChange('blur', e)}
                className="w-full h-1.5 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
              />
            </div>

            {/* Vignette */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#8d90a0]">Vignette</span>
                <span className="text-white font-medium">{adjustments.vignette}%</span>
              </div>
              <input 
                type="range" min="0" max="100" value={adjustments.vignette}
                onChange={(e) => handleSliderChange('vignette', e)}
                className="w-full h-1.5 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Accordion Section 2: Filters */}
      <div 
        ref={filtersRef}
        className={`border-b border-[#2a2a2a] transition-all duration-300 ${
          activeTool === 'filters' ? 'bg-[#2563eb]/10 border-l-4 border-l-[#2563eb]' : ''
        }`}
      >
        <button 
          onClick={() => toggleSection('filters')}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-[#e5e2e1] hover:bg-[#201f1f] transition"
        >
          <div className="flex items-center gap-2">
            <Wand2 className={`w-3.5 h-3.5 ${activeTool === 'filters' ? 'text-[#2563eb]' : 'text-[#b4c5ff]'}`} />
            <span className={`uppercase tracking-wider ${activeTool === 'filters' ? 'text-white font-bold' : ''}`}>FILTERS</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-[#8d90a0] transition-transform ${openSections.filters ? 'rotate-180' : ''}`} />
        </button>

        {openSections.filters && (
          <div className="p-3 grid grid-cols-3 gap-2 bg-[#131313]/60">
            {FILTER_PRESETS.map((filter) => {
              const isActive = activeFilterId === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => applyPresetFilter(filter)}
                  className={`flex flex-col items-center p-2 rounded border text-center transition-all ${
                    isActive 
                      ? 'bg-[#2563eb]/20 border-[#2563eb] text-white shadow-md' 
                      : 'bg-[#201f1f] border-[#2a2a2a] text-[#8d90a0] hover:border-[#434655] hover:text-[#e5e2e1]'
                  }`}
                >
                  <Sparkles className={`w-4 h-4 mb-1 ${isActive ? 'text-[#2563eb]' : 'text-[#8d90a0]'}`} />
                  <span className="text-[10px] font-medium leading-tight truncate w-full">{filter.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Accordion Section 3: Crop & Resize */}
      <div 
        ref={cropRef}
        className={`border-b border-[#2a2a2a] transition-all duration-300 ${
          activeTool === 'crop' ? 'bg-[#2563eb]/10 border-l-4 border-l-[#2563eb]' : ''
        }`}
      >
        <button 
          onClick={() => toggleSection('crop')}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-[#e5e2e1] hover:bg-[#201f1f] transition"
        >
          <div className="flex items-center gap-2">
            <CropIcon className={`w-3.5 h-3.5 ${activeTool === 'crop' ? 'text-[#2563eb]' : 'text-[#8d90a0]'}`} />
            <span className={`uppercase tracking-wider ${activeTool === 'crop' ? 'text-white font-bold' : ''}`}>CROP & RATIO</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-[#8d90a0] transition-transform ${openSections.crop ? 'rotate-180' : ''}`} />
        </button>

        {openSections.crop && (
          <div className="p-4 flex flex-col gap-3 bg-[#131313]/50 text-xs">
            <label className="text-[11px] font-mono text-[#8d90a0] uppercase">Aspect Ratio Preset</label>
            <div className="grid grid-cols-3 gap-1.5 font-mono">
              {[
                { id: 'free', label: 'Free' },
                { id: '1:1', label: '1 : 1' },
                { id: '16:9', label: '16 : 9' },
                { id: '4:3', label: '4 : 3' },
                { id: '9:16', label: '9 : 16' },
                { id: '3:2', label: '3 : 2' },
              ].map((ratio) => (
                <button
                  key={ratio.id}
                  onClick={() => setSelectedAspectRatio(ratio.id)}
                  className={`py-1.5 px-2 rounded border text-center transition ${
                    selectedAspectRatio === ratio.id 
                      ? 'bg-[#2563eb] border-[#2563eb] text-white font-bold shadow' 
                      : 'bg-[#201f1f] border-[#2a2a2a] text-[#8d90a0] hover:text-white'
                  }`}
                >
                  {ratio.label}
                </button>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-[#2a2a2a] text-[11px] font-mono text-[#8d90a0]">
              <span>Dimensions:</span>
              <span className="text-white">{imageDimensions.width} × {imageDimensions.height} px</span>
            </div>
          </div>
        )}
      </div>

      {/* Accordion Section 4: Text & Overlay */}
      <div 
        ref={textRef}
        className={`border-b border-[#2a2a2a] transition-all duration-300 ${
          activeTool === 'text' ? 'bg-[#2563eb]/10 border-l-4 border-l-[#2563eb]' : ''
        }`}
      >
        <button 
          onClick={() => toggleSection('text')}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-[#e5e2e1] hover:bg-[#201f1f] transition"
        >
          <div className="flex items-center gap-2">
            <TypeIcon className={`w-3.5 h-3.5 ${activeTool === 'text' ? 'text-[#2563eb]' : 'text-[#8d90a0]'}`} />
            <span className={`uppercase tracking-wider ${activeTool === 'text' ? 'text-white font-bold' : ''}`}>TEXT & ANNOTATIONS</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-[#8d90a0] transition-transform ${openSections.text ? 'rotate-180' : ''}`} />
        </button>

        {openSections.text && (
          <div className="p-4 flex flex-col gap-3 bg-[#131313]/50">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono text-[#8d90a0] uppercase">Add Watermark / Text</label>
              <input 
                type="text" 
                value={textInput} 
                onChange={(e) => applyTextLayer(e.target.value, textColor, textSize)}
                placeholder="Type text..."
                className="w-full bg-[#201f1f] border border-[#2a2a2a] rounded px-3 py-1.5 text-xs text-white focus:border-[#2563eb] outline-none font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#8d90a0]">Font Size</span>
                <span className="text-white font-medium">{textSize}px</span>
              </div>
              <input 
                type="range" min="12" max="100" value={textSize}
                onChange={(e) => applyTextLayer(textInput, textColor, Number(e.target.value))}
                className="w-full h-1.5 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono text-[#8d90a0]">Text Color</label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  value={textColor} 
                  onChange={(e) => applyTextLayer(textInput, e.target.value, textSize)}
                  className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                />
                <span className="text-xs font-mono text-white">{textColor}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Accordion Section 5: Draw & Brush */}
      <div 
        ref={drawRef}
        className={`border-b border-[#2a2a2a] transition-all duration-300 ${
          activeTool === 'draw' ? 'bg-[#2563eb]/10 border-l-4 border-l-[#2563eb]' : ''
        }`}
      >
        <button 
          onClick={() => toggleSection('draw')}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-[#e5e2e1] hover:bg-[#201f1f] transition"
        >
          <div className="flex items-center gap-2">
            <PencilIcon className={`w-3.5 h-3.5 ${activeTool === 'draw' ? 'text-[#2563eb]' : 'text-[#8d90a0]'}`} />
            <span className={`uppercase tracking-wider ${activeTool === 'draw' ? 'text-white font-bold' : ''}`}>BRUSH & MASK</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-[#8d90a0] transition-transform ${openSections.draw ? 'rotate-180' : ''}`} />
        </button>

        {openSections.draw && (
          <div className="p-4 flex flex-col gap-3 bg-[#131313]/50">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#8d90a0]">Brush Size</span>
                <span className="text-white font-medium">{brushSize}px</span>
              </div>
              <input 
                type="range" min="2" max="60" value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full h-1.5 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono text-[#8d90a0]">Brush Color</label>
              <div className="flex items-center gap-1.5">
                {['#2563eb', '#94de2d', '#ffb596', '#ffffff', '#000000'].map(c => (
                  <button
                    key={c}
                    onClick={() => setBrushColor(c)}
                    className={`w-5 h-5 rounded-full border ${brushColor === c ? 'border-white ring-2 ring-[#2563eb]' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {drawStrokes.length > 0 && (
              <button
                onClick={clearDrawStrokes}
                className="mt-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#201f1f] hover:bg-red-950/40 hover:text-red-400 border border-[#2a2a2a] rounded text-xs text-[#8d90a0] font-mono transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Brush Drawing ({drawStrokes.length})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Accordion Section 6: Histogram & Metadata */}
      <div className="border-b border-[#2a2a2a]">
        <button 
          onClick={() => toggleSection('histogram')}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-[#e5e2e1] hover:bg-[#201f1f] transition"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-[#94de2d]" />
            <span className="uppercase tracking-wider">RGB HISTOGRAM</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-[#8d90a0] transition-transform ${openSections.histogram ? 'rotate-180' : ''}`} />
        </button>

        {openSections.histogram && (
          <div className="p-4 bg-[#131313]/60 flex flex-col gap-3">
            <div className="h-20 bg-[#0e0e0e] rounded border border-[#2a2a2a] p-2 relative overflow-hidden flex items-end gap-1">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-green-500/20 to-blue-500/20 opacity-50"></div>
              {[40, 65, 80, 55, 30, 90, 70, 45, 60, 85, 95, 50, 35, 75, 60, 40].map((h, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-gradient-to-t from-blue-600 to-indigo-400 rounded-t-xs opacity-75"
                  style={{ height: `${h}%` }}
                ></div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-[#8d90a0]">
              <div className="bg-[#201f1f] p-2 rounded border border-[#2a2a2a]">
                <span className="block text-[9px] uppercase text-[#8d90a0]">Dimensions</span>
                <span className="text-white font-medium">{imageDimensions.width} × {imageDimensions.height}</span>
              </div>
              <div className="bg-[#201f1f] p-2 rounded border border-[#2a2a2a]">
                <span className="block text-[9px] uppercase text-[#8d90a0]">Color Space</span>
                <span className="text-[#94de2d] font-medium">sRGB Wide</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
