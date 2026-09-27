import React, { useEffect, useState, useRef, ChangeEvent, MouseEvent } from "react";
import { useImageEditor } from "../context/ImageEditorContext";
import { CollageLayoutPattern } from "../types/editor";
import {
  LayoutGrid,
  Grid2X2,
  Grid3X3,
  Columns,
  Rows,
  LayoutTemplate,
  ChevronDown,
  Download,
  Check,
  PanelLeft,
  Grid
} from "lucide-react";

interface LayoutOption {
  id: CollageLayoutPattern;
  name: string;
  desc: string;
  tilesCount: number;
  icon: React.FC<{ className?: string }>;
}

export const CollageCanvas: React.FC = () => {
  const {
    imageSrc,
    collageImages,
    layoutPattern,
    setLayoutPattern,
    handleCollageTileUpload,
    collageCanvasRef,
    setIsExportOpen,
    isCollageHasPhotos,
    collageSettings
  } = useImageEditor();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [selectedTileIdx, setSelectedTileIdx] = useState<number>(0);
  const [hoveredTileIdx, setHoveredTileIdx] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Track which tile indices have user-uploaded / custom photos
  const [uploadedTileMap, setUploadedTileMap] = useState<Record<number, boolean>>({});

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onTileFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleCollageTileUpload(selectedTileIdx, e.target.files[0]);
      setUploadedTileMap(prev => ({ ...prev, [selectedTileIdx]: true }));
    }
  };

  const hasPhotoInTile = (idx: number): boolean => {
    if (uploadedTileMap[idx]) return true;
    if (idx === 0 && imageSrc !== null) return true;
    return false;
  };

  const getTileHoverLabel = (idx: number): string => {
    const hasPhoto = hasPhotoInTile(idx);
    if (!hasPhoto) return "Add Photo";
    if (layoutPattern === "split" && idx === 0) return "Change Main Photo";
    if (layoutPattern === "top1bottom2" && idx === 0) return "Change Hero Banner";
    if (layoutPattern === "bottom1top2" && idx === 0) return "Change Hero Banner";
    if (layoutPattern === "left1right3" && idx === 0) return "Change Main Photo";
    return "Change Photo";
  };

  const layoutOptions: LayoutOption[] = [
    { id: "2x2", name: "2 × 2 Grid", desc: "4 equal square tiles", tilesCount: 4, icon: Grid2X2 },
    {
      id: "split",
      name: "Asymmetric 3",
      desc: "1 main left hero, 2 right stacked",
      tilesCount: 3,
      icon: Grid3X3
    },
    {
      id: "h3",
      name: "3 Columns",
      desc: "3 vertical side-by-side strips",
      tilesCount: 3,
      icon: Columns
    },
    { id: "v3", name: "3 Rows", desc: "3 horizontal stacked strips", tilesCount: 3, icon: Rows },
    {
      id: "top1bottom2",
      name: "Top Hero + 2",
      desc: "1 wide top banner, 2 bottom tiles",
      tilesCount: 3,
      icon: LayoutTemplate
    },
    {
      id: "bottom1top2",
      name: "2 Top + Bottom Hero",
      desc: "2 top tiles, 1 wide bottom banner",
      tilesCount: 3,
      icon: LayoutTemplate
    },
    {
      id: "left1right3",
      name: "Left Hero + 3",
      desc: "1 large left photo, 3 small right stacked",
      tilesCount: 4,
      icon: PanelLeft
    },
    { id: "grid3x3", name: "3 × 3 Grid", desc: "9 mini photo tiles", tilesCount: 9, icon: Grid }
  ];

  const currentLayoutObj = layoutOptions.find(l => l.id === layoutPattern) || layoutOptions[0];

  const getCollageFilterString = (filter: string): string => {
    switch (filter) {
      case "vivid":
        return "saturate(165%) contrast(110%) brightness(105%)";
      case "warm":
        return "sepia(30%) saturate(125%) brightness(105%) hue-rotate(-10deg)";
      case "cool":
        return "saturate(115%) hue-rotate(15deg) contrast(105%)";
      case "mono":
        return "grayscale(100%) contrast(130%) brightness(105%)";
      case "vintage":
        return "sepia(45%) contrast(95%) brightness(105%) saturate(85%)";
      case "dramatic":
        return "contrast(145%) brightness(95%) saturate(120%)";
      case "cyber":
        return "hue-rotate(170deg) saturate(160%) contrast(120%)";
      case "none":
      default:
        return "none";
    }
  };

  // Calculate exact bounds for all 8 layout patterns on 1600x1200 resolution
  const getBounds = (
    pattern: CollageLayoutPattern,
    width: number,
    height: number,
    padding: number,
    gap: number
  ) => {
    if (pattern === "2x2") {
      const tileW = (width - padding * 2 - gap) / 2;
      const tileH = (height - padding * 2 - gap) / 2;
      return [
        { x: padding, y: padding, w: tileW, h: tileH },
        { x: padding + tileW + gap, y: padding, w: tileW, h: tileH },
        { x: padding, y: padding + tileH + gap, w: tileW, h: tileH },
        { x: padding + tileW + gap, y: padding + tileH + gap, w: tileW, h: tileH }
      ];
    } else if (pattern === "split") {
      const rightColW = (width - padding * 2 - gap) * 0.35;
      const mainW = (width - padding * 2 - gap) * 0.65;
      const sideH = (height - padding * 2 - gap) / 2;
      return [
        { x: padding, y: padding, w: mainW, h: height - padding * 2 },
        { x: padding + mainW + gap, y: padding, w: rightColW, h: sideH },
        { x: padding + mainW + gap, y: padding + sideH + gap, w: rightColW, h: sideH }
      ];
    } else if (pattern === "h3") {
      const tileW = (width - padding * 2 - gap * 2) / 3;
      const tileH = height - padding * 2;
      return [
        { x: padding, y: padding, w: tileW, h: tileH },
        { x: padding + tileW + gap, y: padding, w: tileW, h: tileH },
        { x: padding + (tileW + gap) * 2, y: padding, w: tileW, h: tileH }
      ];
    } else if (pattern === "v3") {
      const tileW = width - padding * 2;
      const tileH = (height - padding * 2 - gap * 2) / 3;
      return [
        { x: padding, y: padding, w: tileW, h: tileH },
        { x: padding, y: padding + tileH + gap, w: tileW, h: tileH },
        { x: padding, y: padding + (tileH + gap) * 2, w: tileW, h: tileH }
      ];
    } else if (pattern === "top1bottom2") {
      const topH = (height - padding * 2 - gap) * 0.55;
      const bottomH = (height - padding * 2 - gap) * 0.45;
      const bottomW = (width - padding * 2 - gap) / 2;
      return [
        { x: padding, y: padding, w: width - padding * 2, h: topH },
        { x: padding, y: padding + topH + gap, w: bottomW, h: bottomH },
        { x: padding + bottomW + gap, y: padding + topH + gap, w: bottomW, h: bottomH }
      ];
    } else if (pattern === "bottom1top2") {
      const topH = (height - padding * 2 - gap) * 0.45;
      const bottomH = (height - padding * 2 - gap) * 0.55;
      const topW = (width - padding * 2 - gap) / 2;
      return [
        { x: padding, y: padding, w: topW, h: topH },
        { x: padding + topW + gap, y: padding, w: topW, h: topH },
        { x: padding, y: padding + topH + gap, w: width - padding * 2, h: bottomH }
      ];
    } else if (pattern === "left1right3") {
      const mainW = (width - padding * 2 - gap) * 0.6;
      const rightColW = (width - padding * 2 - gap) * 0.4;
      const sideH = (height - padding * 2 - gap * 2) / 3;
      return [
        { x: padding, y: padding, w: mainW, h: height - padding * 2 },
        { x: padding + mainW + gap, y: padding, w: rightColW, h: sideH },
        { x: padding + mainW + gap, y: padding + sideH + gap, w: rightColW, h: sideH },
        { x: padding + mainW + gap, y: padding + (sideH + gap) * 2, w: rightColW, h: sideH }
      ];
    } else {
      // grid3x3 (9 mini tiles)
      const tileW = (width - padding * 2 - gap * 2) / 3;
      const tileH = (height - padding * 2 - gap * 2) / 3;
      const list = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          list.push({
            x: padding + c * (tileW + gap),
            y: padding + r * (tileH + gap),
            w: tileW,
            h: tileH
          });
        }
      }
      return list;
    }
  };

  // Render the Collage Canvas + Native Clipped Hover Layer
  useEffect(() => {
    const canvas = collageCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1600;
    const height = 1200;
    canvas.width = width;
    canvas.height = height;

    const { padding, gap, borderRadius, bgColor, filter } = collageSettings;
    const bounds = getBounds(layoutPattern, width, height, padding, gap);
    const loadedImages: Array<HTMLImageElement | null> = Array(bounds.length).fill(null);

    const drawGrid = () => {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      bounds.forEach((b, i) => {
        const img = loadedImages[i];

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, borderRadius);
        ctx.clip();

        // 1. Draw tile background color
        ctx.fillStyle = "#1c1b1b";
        ctx.fillRect(b.x, b.y, b.w, b.h);

        // 2. Draw image with object-fit cover + Global Filter
        if (img && img.complete) {
          const imgAspect = img.naturalWidth / img.naturalHeight;
          const tileAspect = b.w / b.h;
          let renderW = b.w;
          let renderH = b.h;
          let offsetX = b.x;
          let offsetY = b.y;

          if (imgAspect > tileAspect) {
            renderW = b.h * imgAspect;
            offsetX = b.x - (renderW - b.w) / 2;
          } else {
            renderH = b.w / imgAspect;
            offsetY = b.y - (renderH - b.h) / 2;
          }

          ctx.filter = getCollageFilterString(filter);
          ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
          ctx.filter = "none";
        }

        // 3. IF HOVERED: Draw translucent black overlay + plus circle + label (Strictly Clipped inside roundRect!)
        if (hoveredTileIdx === i) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
          ctx.fillRect(b.x, b.y, b.w, b.h);

          const cx = b.x + b.w / 2;
          const cy = b.y + b.h / 2 - 16;
          const radius = b.w < 250 || b.h < 250 ? 20 : 28;

          // Blue Circle Icon
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fillStyle = "#2563eb";
          ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
          ctx.shadowBlur = 12;
          ctx.fill();

          // Plus Icon Symbol
          ctx.shadowBlur = 0;
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = radius < 24 ? 3 : 4;
          ctx.lineCap = "round";
          ctx.beginPath();
          const pSize = radius < 24 ? 7 : 10;
          ctx.moveTo(cx - pSize, cy);
          ctx.lineTo(cx + pSize, cy);
          ctx.moveTo(cx, cy - pSize);
          ctx.lineTo(cx, cy + pSize);
          ctx.stroke();

          // Text Label
          const labelText = getTileHoverLabel(i);
          const fontSize = b.w < 250 || b.h < 250 ? 16 : 22;
          ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
          ctx.shadowBlur = 8;
          ctx.fillText(labelText, cx, cy + radius + (radius < 24 ? 8 : 14));
        }

        ctx.restore();

        // 4. Draw crisp tile border stroke
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, 16);
        ctx.strokeStyle = hoveredTileIdx === i ? "#2563eb" : "#2a2a2a";
        ctx.lineWidth = hoveredTileIdx === i ? 4 : 3;
        ctx.stroke();
        ctx.restore();
      });
    };

    bounds.forEach((_, idx) => {
      const src = collageImages[idx] || collageImages[0];
      if (!src) {
        drawGrid();
        return;
      }
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      img.onload = () => {
        loadedImages[idx] = img;
        drawGrid();
      };
      img.onerror = () => {
        drawGrid();
      };
    });
  }, [
    collageImages,
    layoutPattern,
    hoveredTileIdx,
    collageCanvasRef,
    imageSrc,
    uploadedTileMap,
    collageSettings
  ]);

  // Handle Mouse Hover Detection on Canvas
  const handleCanvasMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = collageCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = 1600 / rect.width;
    const scaleY = 1200 / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const bounds = getBounds(
      layoutPattern,
      1600,
      1200,
      collageSettings.padding,
      collageSettings.gap
    );
    const hitIdx = bounds.findIndex(
      b => mouseX >= b.x && mouseX <= b.x + b.w && mouseY >= b.y && mouseY <= b.y + b.h
    );

    if (hitIdx !== hoveredTileIdx) {
      setHoveredTileIdx(hitIdx !== -1 ? hitIdx : null);
    }
  };

  const handleCanvasMouseLeave = () => {
    setHoveredTileIdx(null);
  };

  // Handle Canvas Tile Click
  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = collageCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = 1600 / rect.width;
    const scaleY = 1200 / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const bounds = getBounds(
      layoutPattern,
      1600,
      1200,
      collageSettings.padding,
      collageSettings.gap
    );
    const hitIdx = bounds.findIndex(
      b => clickX >= b.x && clickX <= b.x + b.w && clickY >= b.y && clickY <= b.y + b.h
    );

    if (hitIdx !== -1) {
      setSelectedTileIdx(hitIdx);
      fileInputRef.current?.click();
    }
  };

  const CurrentIcon = currentLayoutObj.icon;

  return (
    <main className="flex-1 bg-[#131313] relative flex flex-col items-center justify-center p-6 select-none overflow-auto">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onTileFileChange}
      />

      {/* Top Controls Bar with Custom Dropdown Menu */}
      <div className="w-[640px] flex items-center justify-between mb-4 bg-[#1c1b1b] px-4 py-2.5 rounded-lg border border-[#2a2a2a] shadow-lg z-30">
        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          <span className="text-xs text-[#8d90a0] font-mono flex items-center gap-1.5 uppercase tracking-wider font-semibold">
            <LayoutGrid className="w-4 h-4 text-[#2563eb]" />
            LAYOUT PATTERN:
          </span>

          {/* Dropdown Button Trigger */}
          <button
            onClick={() => setIsDropdownOpen(prev => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#201f1f] hover:bg-[#2a2a2a] border border-[#2a2a2a] hover:border-[#434655] rounded-md text-xs font-semibold text-white transition cursor-pointer shadow-sm"
          >
            <CurrentIcon className="w-4 h-4 text-[#2563eb]" />
            <span>{currentLayoutObj.name}</span>
            <ChevronDown
              className={`w-4 h-4 text-[#8d90a0] transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Floating Layout Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-[125px] mt-2 w-[260px] bg-[#1c1b1b] border border-[#2a2a2a] rounded-xl shadow-2xl p-1.5 z-50 animate-fadeIn flex flex-col gap-1">
              <div className="px-2 py-1 text-[10px] font-mono uppercase text-[#8d90a0] border-b border-[#2a2a2a] mb-0.5">
                Select Collage Layout ({layoutOptions.length})
              </div>

              {layoutOptions.map(item => {
                const Icon = item.icon;
                const isSelected = layoutPattern === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setLayoutPattern(item.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between p-2 rounded-lg transition-all text-left cursor-pointer ${
                      isSelected
                        ? "bg-[#2563eb]/20 border border-[#2563eb] text-white"
                        : "hover:bg-[#201f1f] text-[#8d90a0] hover:text-white border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-1.5 rounded-md ${isSelected ? "bg-[#2563eb] text-white" : "bg-[#131313] text-[#8d90a0]"}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white leading-tight">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-[#8d90a0] leading-tight mt-0.5">
                          {item.desc}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#131313] text-[#b4c5ff] border border-[#2a2a2a]">
                        {item.tilesCount} tiles
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#2563eb]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Dedicated Export Collage Button - Rendered only when photos are added */}
        {isCollageHasPhotos && (
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563eb] hover:bg-blue-600 text-white font-semibold text-xs rounded-md transition shadow-md shadow-blue-900/30 cursor-pointer animate-fadeIn"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        )}
      </div>

      {/* Interactive Canvas Workspace - Perfect 4:3 Aspect Ratio matching 1600x1200 */}
      <div className="relative w-[640px] h-[480px] bg-[#131313] p-1.5 rounded-xl border border-[#2a2a2a] canvas-shadow overflow-hidden flex items-center justify-center">
        <canvas
          ref={collageCanvasRef}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
          onClick={handleCanvasClick}
          className="w-full h-full object-contain rounded-lg cursor-pointer"
        />
      </div>

      <p className="text-xs text-[#8d90a0] font-mono mt-3">
        Hover and click any tile to add or change its photo
      </p>
    </main>
  );
};
