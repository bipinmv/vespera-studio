import React, { ChangeEvent } from "react";
import { useImageEditor } from "../context/ImageEditorContext";
import {
  SlidersHorizontal,
  Columns,
  Undo2,
  Redo2,
  Upload,
  Download,
  RotateCcw
} from "lucide-react";

export const Header: React.FC = () => {
  const {
    imageSrc,
    viewMode,
    setViewMode,
    undo,
    redo,
    historyIndex,
    history,
    resetAdjustments,
    setIsExportOpen,
    handleImageUpload,
    imageName,
    hasChanges,
    isCollageHasPhotos
  } = useImageEditor();

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  const isExportAvailable = imageSrc !== null || (viewMode === "collage" && isCollageHasPhotos);

  return (
    <header className="h-14 bg-[#1c1b1b] border-b border-[#2a2a2a] px-4 flex items-center justify-between text-sm select-none z-30">
      {/* Left Branding */}
      <div className="flex items-center gap-3">
        <span className="font-black tracking-widest text-lg bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 bg-clip-text text-transparent select-none drop-shadow-[0_0_12px_rgba(59,130,246,0.35)]">
          VESPERA
        </span>

        {imageSrc && (
          <>
            <div className="h-4 w-px bg-[#2a2a2a] mx-1"></div>
            <span className="text-xs text-[#8d90a0] font-mono truncate max-w-[180px] hidden sm:inline-block">
              {imageName}
            </span>
          </>
        )}
      </div>

      {/* Center View Mode Switcher - Only shown when an image is open */}
      {imageSrc ? (
        <div className="flex items-center bg-[#131313] p-1 rounded-md border border-[#2a2a2a] animate-fadeIn">
          <button
            onClick={() => setViewMode("editor")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
              viewMode === "editor"
                ? "bg-[#2563eb] text-white shadow"
                : "text-[#8d90a0] hover:text-white hover:bg-[#201f1f]"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>

          {/* Split View Button: Enabled ONLY when edits/changes exist */}
          <button
            onClick={() => hasChanges && setViewMode("split")}
            disabled={!hasChanges}
            title={
              hasChanges
                ? "Compare original vs edited photo"
                : "Split View compares original vs edited photo. Apply an edit first."
            }
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
              viewMode === "split"
                ? "bg-[#2563eb] text-white shadow"
                : hasChanges
                  ? "text-[#8d90a0] hover:text-white hover:bg-[#201f1f]"
                  : "text-[#555] opacity-40 cursor-not-allowed"
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split View</span>
          </button>
        </div>
      ) : (
        <div />
      )}

      {/* Right Controls & CTA */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo & Reset - Only shown when an image is open */}
        {imageSrc && (
          <>
            <div className="flex items-center bg-[#131313] rounded border border-[#2a2a2a] p-0.5 animate-fadeIn">
              <button
                onClick={undo}
                disabled={historyIndex === 0}
                title="Undo (Cmd+Z)"
                className="p-1.5 text-[#8d90a0] hover:text-white disabled:opacity-30 disabled:hover:text-[#8d90a0] rounded transition"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                title="Redo (Cmd+Shift+Z)"
                className="p-1.5 text-[#8d90a0] hover:text-white disabled:opacity-30 disabled:hover:text-[#8d90a0] rounded transition"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>

            {/* Reset Adjustments */}
            <button
              onClick={resetAdjustments}
              title="Reset all adjustments"
              className="p-1.5 text-[#8d90a0] hover:text-white hover:bg-[#2a2a2a] rounded transition border border-[#2a2a2a] animate-fadeIn"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Upload Image Button */}
        <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#201f1f] hover:bg-[#2a2a2a] border border-[#434655]/60 text-xs font-medium text-[#e5e2e1] rounded cursor-pointer transition">
          <Upload className="w-3.5 h-3.5 text-[#b4c5ff]" />
          <span className="hidden md:inline">Open File</span>
          <input type="file" accept="image/*" onChange={onFileInputChange} className="hidden" />
        </label>

        {/* Export Modal CTA - Shown when image is open OR when collage has photos */}
        {isExportAvailable && (
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2563eb] hover:bg-blue-600 text-white font-medium text-xs rounded transition shadow-md shadow-blue-900/30 animate-fadeIn"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        )}
      </div>
    </header>
  );
};
