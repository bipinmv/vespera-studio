import React, { useEffect } from "react";
import { useImageEditor } from "../context/ImageEditorContext";
import { AlertTriangle, Download, Trash2, X } from "lucide-react";

export const UnsavedChangesModal: React.FC = () => {
  const { isUnsavedChangesModalOpen, setIsUnsavedChangesModalOpen, saveAndExit, discardAndExit } =
    useImageEditor();

  // Close on Escape key
  useEffect(() => {
    if (!isUnsavedChangesModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsUnsavedChangesModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isUnsavedChangesModalOpen, setIsUnsavedChangesModalOpen]);

  if (!isUnsavedChangesModalOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-changes-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={e => {
        if (e.target === e.currentTarget) {
          setIsUnsavedChangesModalOpen(false);
        }
      }}
    >
      <div className="bg-[#1c1b1b] border border-[#2e2e2e] shadow-2xl shadow-black/90 rounded-2xl p-5 max-w-sm w-full relative overflow-hidden animate-scaleUp">
        {/* Ambient Top Glow Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

        {/* Close Button */}
        <button
          onClick={() => setIsUnsavedChangesModalOpen(false)}
          className="absolute top-3.5 right-3.5 p-1 rounded-lg text-[#8d90a0] hover:text-white hover:bg-[#2a2a2a] transition"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Icon and Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>

          <div>
            <h3 id="unsaved-changes-title" className="text-sm font-semibold text-white">
              Unsaved Changes
            </h3>
            <p className="text-xs text-[#8d90a0] mt-0.5">Save your changes before leaving?</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={() => setIsUnsavedChangesModalOpen(false)}
            className="px-3 py-1.5 bg-transparent hover:bg-[#252525] text-[#8d90a0] hover:text-white border border-[#2a2a2a] rounded-lg text-xs font-medium transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={discardAndExit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#241717] hover:bg-red-950/60 active:scale-[0.99] text-red-300 hover:text-red-200 border border-red-900/40 text-xs font-medium rounded-lg transition cursor-pointer"
            title="Discard changes and exit"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Discard</span>
          </button>

          <button
            onClick={saveAndExit}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2563eb] hover:bg-blue-600 active:scale-[0.99] text-white font-medium text-xs rounded-lg shadow-md shadow-blue-900/30 transition cursor-pointer"
            title="Save changes and exit"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
};
