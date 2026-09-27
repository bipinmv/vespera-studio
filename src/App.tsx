import React from "react";
import { ImageEditorProvider, useImageEditor } from "./context/ImageEditorContext";
import { Analytics } from "@vercel/analytics/react";
import { Header } from "./components/Header";
import { LeftToolbar } from "./components/LeftToolbar";
import { CanvasArea } from "./components/CanvasArea";
import { SplitViewCanvas } from "./components/SplitViewCanvas";
import { CollageCanvas } from "./components/CollageCanvas";
import { InspectorPanel } from "./components/InspectorPanel";
import { CollageInspectorPanel } from "./components/CollageInspectorPanel";
import { ExportModal } from "./components/ExportModal";
import { UnsavedChangesModal } from "./components/UnsavedChangesModal";

const MainLayout: React.FC = () => {
  const { viewMode } = useImageEditor();

  return (
    <div className="flex flex-col h-screen w-screen bg-[#131313] text-[#e5e2e1] overflow-hidden font-sans antialiased">
      <Header />

      <div className="flex flex-1 overflow-hidden relative">
        <LeftToolbar />

        {/* Keep CanvasArea mounted so canvasRef is always active */}
        <div
          className={
            viewMode === "editor"
              ? "flex-1 flex flex-col h-full overflow-hidden relative"
              : "hidden"
          }
        >
          <CanvasArea />
        </div>

        {viewMode === "split" && <SplitViewCanvas />}
        {viewMode === "collage" && <CollageCanvas />}

        {viewMode === "collage" ? <CollageInspectorPanel /> : <InspectorPanel />}
      </div>

      <ExportModal />
      <UnsavedChangesModal />
    </div>
  );
};

export default function App() {
  return (
    <ImageEditorProvider>
      <MainLayout />
      <Analytics />
    </ImageEditorProvider>
  );
}
