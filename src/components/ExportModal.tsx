import React, { useState, useEffect } from "react";
import { useImageEditor } from "../context/ImageEditorContext";
import { X, Download, FileImage, AlertCircle, Info } from "lucide-react";

type ImageFormat = "image/png" | "image/jpeg" | "image/webp" | "image/svg+xml";

export const ExportModal: React.FC = () => {
  const {
    isExportOpen,
    setIsExportOpen,
    imageName,
    imageSrc,
    viewMode,
    getProcessedCanvas,
    markAsSaved
  } = useImageEditor();

  const [format, setFormat] = useState<ImageFormat>("image/png");
  const [quality, setQuality] = useState<number>(100);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [estimatedSizeStr, setEstimatedSizeStr] = useState<string>("Calculating...");
  const [exportError, setExportError] = useState<string | null>(null);

  // Calculate REAL exact file size using getProcessedCanvas()
  useEffect(() => {
    if (!isExportOpen) return;
    setExportError(null);

    const canvas = getProcessedCanvas();
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      setEstimatedSizeStr("No Image Loaded");
      return;
    }

    if (format === "image/svg+xml") {
      try {
        const dataUrl = canvas.toDataURL("image/png");
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}"><image width="${canvas.width}" height="${canvas.height}" href="${dataUrl}"/></svg>`;
        const bytes = new Blob([svgContent], { type: "image/svg+xml" }).size;
        if (bytes < 1024 * 1024) {
          setEstimatedSizeStr(`${(bytes / 1024).toFixed(1)} KB`);
        } else {
          setEstimatedSizeStr(`${(bytes / (1024 * 1024)).toFixed(2)} MB`);
        }
      } catch (err) {
        setEstimatedSizeStr("N/A");
      }
      return;
    }

    try {
      canvas.toBlob(
        blob => {
          if (!blob) {
            setEstimatedSizeStr("N/A");
            return;
          }
          const bytes = blob.size;
          if (bytes < 1024) {
            setEstimatedSizeStr(`${bytes} B`);
          } else if (bytes < 1024 * 1024) {
            setEstimatedSizeStr(`${(bytes / 1024).toFixed(1)} KB`);
          } else {
            setEstimatedSizeStr(`${(bytes / (1024 * 1024)).toFixed(2)} MB`);
          }
        },
        format,
        quality / 100
      );
    } catch (err) {
      console.error("Error calculating export blob size:", err);
      setEstimatedSizeStr("N/A");
    }
  }, [format, quality, isExportOpen, imageSrc, viewMode, getProcessedCanvas]);

  if (!isExportOpen) return null;

  const handleDownload = () => {
    const canvas = getProcessedCanvas();
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      setExportError("Please create a collage or open an image before downloading.");
      return;
    }

    setIsExporting(true);
    setExportError(null);

    const ext =
      format === "image/png"
        ? "png"
        : format === "image/jpeg"
          ? "jpg"
          : format === "image/webp"
            ? "webp"
            : "svg";
    const sanitizeName = (name: string) => name.replace(/\.[^/.]+$/, "");
    const baseName =
      viewMode === "collage"
        ? "vespera_collage"
        : imageName && imageName !== "No file opened"
          ? sanitizeName(imageName)
          : "vespera_export";
    const filename = `${baseName}_edited.${ext}`;

    const triggerDownload = (url: string) => {
      const link = document.createElement("a");
      link.download = filename;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
      setIsExportOpen(false);
      markAsSaved();
    };

    // Special SVG handling
    if (format === "image/svg+xml") {
      try {
        const dataUrl = canvas.toDataURL("image/png");
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">\n  <image width="${canvas.width}" height="${canvas.height}" href="${dataUrl}"/>\n</svg>`;
        const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
        const blobUrl = URL.createObjectURL(blob);
        triggerDownload(blobUrl);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      } catch (err) {
        setExportError("Failed to generate SVG file.");
        setIsExporting(false);
      }
      return;
    }

    // Standard raster format handling (PNG, JPEG, WEBP)
    try {
      canvas.toBlob(
        blob => {
          if (!blob) {
            try {
              const dataUrl = canvas.toDataURL(format, quality / 100);
              triggerDownload(dataUrl);
            } catch (dataErr) {
              setExportError("Failed to generate image file.");
              setIsExporting(false);
            }
            return;
          }

          const blobUrl = URL.createObjectURL(blob);
          triggerDownload(blobUrl);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
        },
        format,
        quality / 100
      );
    } catch (err) {
      console.error("Canvas export error:", err);
      try {
        const dataUrl = canvas.toDataURL(format, quality / 100);
        triggerDownload(dataUrl);
      } catch (fallbackErr) {
        setExportError("Security error exporting cross-origin image.");
        setIsExporting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="bg-[#1c1b1b] border border-[#2a2a2a] w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileImage className="w-5 h-5 text-[#2563eb]" />
            <h3 className="font-semibold text-base text-white">
              {viewMode === "collage" ? "Export & Save Collage" : "Export & Convert Image"}
            </h3>
          </div>
          <button
            onClick={() => setIsExportOpen(false)}
            className="text-[#8d90a0] hover:text-white p-1 rounded-full hover:bg-[#201f1f] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-5">
          {/* Format Picker */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono uppercase text-[#8d90a0]">Export Format</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "PNG", mime: "image/png" as ImageFormat, desc: "Lossless" },
                { label: "JPEG", mime: "image/jpeg" as ImageFormat, desc: "Compressed" },
                { label: "WEBP", mime: "image/webp" as ImageFormat, desc: "Modern Web" },
                { label: "SVG", mime: "image/svg+xml" as ImageFormat, desc: "Vector Wrap" }
              ].map(item => (
                <button
                  key={item.mime}
                  onClick={() => setFormat(item.mime)}
                  className={`flex flex-col items-center p-2.5 rounded-lg border text-center transition-all ${
                    format === item.mime
                      ? "bg-[#2563eb]/20 border-[#2563eb] text-white shadow-md"
                      : "bg-[#201f1f] border-[#2a2a2a] text-[#8d90a0] hover:border-[#434655] hover:text-[#e5e2e1]"
                  }`}
                >
                  <span className="font-bold text-xs">{item.label}</span>
                  <span className="text-[9px] text-[#8d90a0] truncate w-full">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Compression Quality Slider & Presets */}
          {format !== "image/svg+xml" && (
            <div className="flex flex-col gap-2 bg-[#131313] p-3.5 rounded-lg border border-[#2a2a2a]">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#8d90a0]">Image Quality</span>
                <span className="text-[#2563eb] font-bold">
                  {quality}% {quality === 100 ? "(Max Quality)" : ""}
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={quality}
                onChange={e => setQuality(Number(e.target.value))}
                className="w-full h-1.5 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
              />

              <div className="flex items-center gap-1.5 mt-1 font-mono text-[10px]">
                {[
                  { label: "Max (100%)", val: 100 },
                  { label: "High (90%)", val: 90 },
                  { label: "Web (75%)", val: 75 }
                ].map(p => (
                  <button
                    key={p.val}
                    onClick={() => setQuality(p.val)}
                    className={`px-2 py-0.5 rounded border transition ${
                      quality === p.val
                        ? "bg-[#2563eb] text-white border-[#2563eb] font-bold"
                        : "bg-[#201f1f] text-[#8d90a0] border-[#2a2a2a] hover:text-white"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Real Exact Estimated Size Display */}
          <div className="bg-[#131313] p-3 rounded-lg border border-[#2a2a2a] flex items-center justify-between text-xs font-mono">
            <span className="text-[#8d90a0]">Estimated File Size:</span>
            <span className="text-[#94de2d] font-semibold text-sm">{estimatedSizeStr}</span>
          </div>

          {/* Explanation note on metadata stripping */}
          <div className="p-3 bg-[#131313]/60 border border-[#2a2a2a] rounded-lg flex items-start gap-2 text-[11px] text-[#8d90a0]">
            <Info className="w-4 h-4 shrink-0 text-[#2563eb] mt-0.5" />
            <span>
              Canvas export automatically cleans heavy EXIF camera metadata and compresses pixel
              data. Keep quality at <strong>100%</strong> for maximum file size & clarity.
            </span>
          </div>

          {/* Error Banner */}
          {exportError && (
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-lg flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{exportError}</span>
            </div>
          )}
        </div>

        {/* Modal Footer CTA */}
        <div className="px-5 py-4 bg-[#131313]/60 border-t border-[#2a2a2a] flex items-center justify-end gap-3">
          <button
            onClick={() => setIsExportOpen(false)}
            className="px-4 py-2 text-xs font-medium text-[#8d90a0] hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={isExporting || (!imageSrc && viewMode !== "collage")}
            className="flex items-center gap-2 px-5 py-2 bg-[#2563eb] hover:bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-900/40 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isExporting ? (
              <span>Processing...</span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download {viewMode === "collage" ? "Collage" : "Image"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
