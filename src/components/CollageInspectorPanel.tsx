import React, { useState } from "react";
import { useImageEditor } from "../context/ImageEditorContext";
import { CollageFilter } from "../types/editor";
import {
  Sparkles,
  RotateCcw,
  ChevronDown,
  Layers,
  Palette,
  Sliders,
  Trash2,
  Download,
  Square,
  Sun,
  Flame,
  CloudSnow,
  Moon,
  Camera,
  Film,
  Zap
} from "lucide-react";

interface FilterOption {
  id: CollageFilter;
  name: string;
  desc: string;
  previewBg: string;
  icon: React.FC<{ className?: string }>;
}

export const CollageInspectorPanel: React.FC = () => {
  const {
    collageSettings,
    updateCollageSettings,
    resetCollageSettings,
    clearCollagePhotos,
    setIsExportOpen,
    isCollageHasPhotos,
    layoutPattern
  } = useImageEditor();

  const [openSections, setOpenSections] = useState({
    filters: true,
    geometry: true,
    background: true
  });

  const toggleSection = (key: "filters" | "geometry" | "background") => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filterOptions: FilterOption[] = [
    {
      id: "none",
      name: "Original",
      desc: "No color grade",
      previewBg: "from-zinc-700 to-zinc-900",
      icon: Square
    },
    {
      id: "vivid",
      name: "Vivid Pop",
      desc: "Punchy saturation",
      previewBg: "from-amber-500 via-rose-500 to-indigo-500",
      icon: Sun
    },
    {
      id: "warm",
      name: "Warm Amber",
      desc: "Golden hour mood",
      previewBg: "from-amber-600 to-orange-700",
      icon: Flame
    },
    {
      id: "cool",
      name: "Nordic Cool",
      desc: "Crisp cold tones",
      previewBg: "from-sky-500 to-teal-700",
      icon: CloudSnow
    },
    {
      id: "mono",
      name: "Noir B&W",
      desc: "High-contrast monochrome",
      previewBg: "from-white via-zinc-400 to-black",
      icon: Moon
    },
    {
      id: "vintage",
      name: "Vintage Film",
      desc: "Classic analog patina",
      previewBg: "from-yellow-800 to-amber-950",
      icon: Camera
    },
    {
      id: "dramatic",
      name: "Dramatic",
      desc: "Deep crushed blacks",
      previewBg: "from-zinc-900 via-red-950 to-black",
      icon: Film
    },
    {
      id: "cyber",
      name: "Cyber Neon",
      desc: "Surreal electric hues",
      previewBg: "from-fuchsia-600 via-purple-600 to-cyan-500",
      icon: Zap
    }
  ];

  const bgPresets = [
    { label: "Obsidian", color: "#131313" },
    { label: "Pitch Black", color: "#000000" },
    { label: "Studio Dark", color: "#1c1b1b" },
    { label: "Gallery White", color: "#ffffff" },
    { label: "Warm Cream", color: "#f5f5f0" },
    { label: "Slate Gray", color: "#1e293b" },
    { label: "Midnight Blue", color: "#0f172a" },
    { label: "Deep Crimson", color: "#450a0a" }
  ];

  return (
    <aside className="w-[300px] bg-[#1c1b1b] border-l border-[#2a2a2a] flex flex-col h-full select-none z-20 overflow-y-auto">
      {/* Panel Top Header */}
      <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center justify-between bg-[#181818]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Layers className="w-3 h-3" />
          </div>
          <span className="font-semibold text-xs tracking-wider text-white uppercase">
            Collage Settings
          </span>
        </div>
        <button
          onClick={resetCollageSettings}
          title="Reset collage spacing and colors"
          className="flex items-center gap-1 text-[11px] text-[#8d90a0] hover:text-white px-2 py-0.5 rounded hover:bg-[#2a2a2a] transition"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      <div className="flex-1 divide-y divide-[#2a2a2a]">
        {/* Section 1: Global Filter for Collage */}
        <div>
          <button
            onClick={() => toggleSection("filters")}
            className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-[#e5e2e1] hover:bg-[#201f1f] transition"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span className="uppercase tracking-wider">GLOBAL PHOTO FILTER</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[#8d90a0] transition-transform ${openSections.filters ? "rotate-180" : ""}`}
            />
          </button>

          {openSections.filters && (
            <div className="p-3 bg-[#131313]/60 flex flex-col gap-2">
              <p className="text-[10px] text-[#8d90a0] font-mono leading-tight px-0.5">
                Harmonize all collage tiles under a single aesthetic tone.
              </p>

              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {filterOptions.map(option => {
                  const Icon = option.icon;
                  const isSelected = collageSettings.filter === option.id;

                  return (
                    <button
                      key={option.id}
                      onClick={() => updateCollageSettings("filter", option.id)}
                      className={`relative flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                        isSelected
                          ? "bg-[#2563eb]/15 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/50"
                          : "bg-[#1a1a1a] border-[#2e2e2e] text-[#8d90a0] hover:text-[#e5e2e1] hover:border-[#444]"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center shrink-0 bg-gradient-to-br ${option.previewBg} shadow-xs`}
                      >
                        <Icon className="w-3.5 h-3.5 text-white drop-shadow" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-[11px] font-medium leading-tight truncate text-white">
                          {option.name}
                        </div>
                        <div className="text-[9px] text-[#8d90a0] truncate font-mono">
                          {option.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Spacing & Geometry */}
        <div>
          <button
            onClick={() => toggleSection("geometry")}
            className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-[#e5e2e1] hover:bg-[#201f1f] transition"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span className="uppercase tracking-wider">GEOMETRY & SPACING</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[#8d90a0] transition-transform ${openSections.geometry ? "rotate-180" : ""}`}
            />
          </button>

          {openSections.geometry && (
            <div className="p-4 bg-[#131313]/60 flex flex-col gap-4">
              {/* Tile Gap Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#8d90a0] font-mono text-[11px]">Tile Gap (Spacing)</span>
                  <span className="text-white font-medium font-mono text-[11px]">
                    {collageSettings.gap}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="48"
                  value={collageSettings.gap}
                  onChange={e => updateCollageSettings("gap", Number(e.target.value))}
                  className="w-full h-1.5 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
                />
              </div>

              {/* Outer Padding Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#8d90a0] font-mono text-[11px]">
                    Outer Border (Margin)
                  </span>
                  <span className="text-white font-medium font-mono text-[11px]">
                    {collageSettings.padding}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="64"
                  value={collageSettings.padding}
                  onChange={e => updateCollageSettings("padding", Number(e.target.value))}
                  className="w-full h-1.5 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
                />
              </div>

              {/* Corner Radius Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#8d90a0] font-mono text-[11px]">
                    Corner Radius (Rounding)
                  </span>
                  <span className="text-white font-medium font-mono text-[11px]">
                    {collageSettings.borderRadius}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="48"
                  value={collageSettings.borderRadius}
                  onChange={e => updateCollageSettings("borderRadius", Number(e.target.value))}
                  className="w-full h-1.5 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
                />
                <div className="flex justify-between text-[9px] text-[#666] font-mono px-0.5">
                  <span>Sharp (0px)</span>
                  <span>Rounded (16px)</span>
                  <span>Pill (48px)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Mat & Background Color */}
        <div>
          <button
            onClick={() => toggleSection("background")}
            className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-[#e5e2e1] hover:bg-[#201f1f] transition"
          >
            <div className="flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span className="uppercase tracking-wider">MAT & BACKGROUND COLOR</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[#8d90a0] transition-transform ${openSections.background ? "rotate-180" : ""}`}
            />
          </button>

          {openSections.background && (
            <div className="p-4 bg-[#131313]/60 flex flex-col gap-3">
              <div className="grid grid-cols-4 gap-2">
                {bgPresets.map(preset => {
                  const isSelected =
                    collageSettings.bgColor.toLowerCase() === preset.color.toLowerCase();
                  return (
                    <button
                      key={preset.color}
                      onClick={() => updateCollageSettings("bgColor", preset.color)}
                      title={preset.label}
                      className={`h-8 rounded-md border flex items-center justify-center transition-all ${
                        isSelected
                          ? "border-blue-500 ring-2 ring-blue-500/50 scale-105 shadow"
                          : "border-[#333] hover:border-[#666]"
                      }`}
                      style={{ backgroundColor: preset.color }}
                    >
                      {isSelected && (
                        <div
                          className={`w-2 h-2 rounded-full ${preset.color === "#ffffff" || preset.color === "#f5f5f0" ? "bg-black" : "bg-white"}`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom Color Input */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#8d90a0] font-mono">Custom Color:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={collageSettings.bgColor}
                    onChange={e => updateCollageSettings("bgColor", e.target.value)}
                    className="w-7 h-7 rounded border border-[#2a2a2a] cursor-pointer bg-transparent"
                  />
                  <span className="text-xs font-mono text-[#e5e2e1]">
                    {collageSettings.bgColor.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Sticky Action Buttons */}
      <div className="p-3 border-t border-[#2a2a2a] bg-[#181818] flex flex-col gap-2">
        <button
          onClick={() => setIsExportOpen(true)}
          disabled={!isCollageHasPhotos}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#2563eb] hover:bg-blue-600 disabled:opacity-40 disabled:hover:bg-[#2563eb] text-white text-xs font-medium rounded transition shadow-md shadow-blue-900/30"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Collage</span>
        </button>

        <button
          onClick={clearCollagePhotos}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#201f1f] hover:bg-red-950/40 hover:text-red-400 border border-[#2a2a2a] rounded text-xs text-[#8d90a0] font-mono transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Reset Photos</span>
        </button>
      </div>
    </aside>
  );
};
