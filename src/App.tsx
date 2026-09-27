import React from 'react';
import { ImageEditorProvider, useImageEditor } from './context/ImageEditorContext';
import { Header } from './components/Header';
import { LeftToolbar } from './components/LeftToolbar';
import { CanvasArea } from './components/CanvasArea';
import { SplitViewCanvas } from './components/SplitViewCanvas';
import { CollageCanvas } from './components/CollageCanvas';
import { InspectorPanel } from './components/InspectorPanel';
import { ExportModal } from './components/ExportModal';

const MainLayout: React.FC = () => {
  const { viewMode } = useImageEditor();

  return (
    <div className="flex flex-col h-screen w-screen bg-[#131313] text-[#e5e2e1] overflow-hidden font-sans antialiased">
      <Header />

      <div className="flex flex-1 overflow-hidden relative">
        <LeftToolbar />

        {/* Keep CanvasArea mounted so canvasRef is always active */}
        <div className={viewMode === 'editor' ? 'flex-1 flex flex-col h-full overflow-hidden relative' : 'hidden'}>
          <CanvasArea />
        </div>

        {viewMode === 'split' && <SplitViewCanvas />}
        {viewMode === 'collage' && <CollageCanvas />}

        <InspectorPanel />
      </div>

      <ExportModal />
    </div>
  );
};

export default function App() {
  return (
    <ImageEditorProvider>
      <MainLayout />
    </ImageEditorProvider>
  );
}
