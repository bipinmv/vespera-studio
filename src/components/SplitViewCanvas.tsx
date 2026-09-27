import React, { useEffect, useRef, useState, useCallback, MouseEvent, TouchEvent, ChangeEvent } from 'react';
import { useImageEditor } from '../context/ImageEditorContext';
import { SlidersHorizontal, Sparkles, FolderOpen, FileImage } from 'lucide-react';

export const SplitViewCanvas: React.FC = () => {
  const { imageSrc, adjustments, handleImageUpload } = useImageEditor();
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const isDraggingRef = useRef<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasEditedRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const renderEditedCanvas = useCallback(() => {
    const canvas = canvasEditedRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.complete) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const { brightness, contrast, saturation, exposure, blur, sepia, grayscale, hueRotate, invert } = adjustments;
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
  }, [adjustments]);

  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;
      renderEditedCanvas();
    };
  }, [imageSrc, renderEditedCanvas]);

  useEffect(() => {
    if (imageSrc) {
      renderEditedCanvas();
    }
  }, [adjustments, imageSrc, renderEditedCanvas]);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const onMouseDown = () => { isDraggingRef.current = true; };
  const onMouseUp = () => { isDraggingRef.current = false; };
  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) handleMove(e.clientX);
  };

  const onTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches && e.touches[0]) handleMove(e.touches[0].clientX);
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  if (!imageSrc) {
    return (
      <main className="flex-1 bg-[#131313] relative flex flex-col items-center justify-center p-6 select-none">
        <div className="w-full max-w-md bg-[#1c1b1b]/80 backdrop-blur-xl border border-[#2a2a2a] rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl z-20">
          <div className="w-16 h-16 rounded-2xl bg-[#2563eb]/20 border border-[#2563eb] flex items-center justify-center text-[#2563eb] mb-4">
            <FileImage className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white">No Image for Split Comparison</h2>
          <p className="text-xs text-[#8d90a0] mt-1 mb-5">Open an image first to use the Before/After comparison slider.</p>
          <div className="w-full">
            <label className="w-full py-2.5 px-4 bg-[#2563eb] hover:bg-blue-600 text-white font-medium text-xs rounded-xl cursor-pointer transition flex items-center justify-center gap-2">
              <FolderOpen className="w-4 h-4" />
              <span>Browse Image File</span>
              <input type="file" accept="image/*" onChange={onFileInputChange} className="hidden" />
            </label>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main 
      className="flex-1 bg-[#131313] relative flex flex-col items-center justify-center overflow-hidden p-6 select-none"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <div className="absolute top-4 left-6 flex items-center gap-2 text-xs font-mono text-[#8d90a0]">
        <SlidersHorizontal className="w-4 h-4 text-[#2563eb]" />
        <span>VESPERA STUDIO COMPARISON ENGINE</span>
      </div>

      <div 
        ref={containerRef}
        onMouseDown={onMouseDown}
        onTouchMove={onTouchMove}
        className="relative max-w-[75vw] max-h-[72vh] rounded canvas-shadow overflow-hidden cursor-ew-resize border border-[#2a2a2a]"
      >
        <img 
          src={imageSrc} 
          alt="Original" 
          className="max-w-[75vw] max-h-[72vh] object-contain block pointer-events-none"
        />

        <div 
          className="absolute top-0 bottom-0 right-0 overflow-hidden pointer-events-none"
          style={{ width: `${100 - sliderPosition}%` }}
        >
          <div 
            className="absolute top-0 bottom-0 right-0"
            style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%' }}
          >
            <canvas 
              ref={canvasEditedRef} 
              className="max-w-[75vw] max-h-[72vh] object-contain block"
            />
          </div>
        </div>

        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-[#2563eb] shadow-[0_0_12px_#2563eb] z-30"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#1c1b1b] border-2 border-[#2563eb] shadow-xl flex items-center justify-center text-white">
            <span className="text-[10px] font-bold">⇄</span>
          </div>
        </div>

        <div className="absolute bottom-3 left-4 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-mono text-white/80 border border-white/10 z-20">
          ORIGINAL
        </div>
        <div className="absolute bottom-3 right-4 bg-[#2563eb]/80 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-mono text-white font-medium shadow z-20 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>EDITED</span>
        </div>
      </div>

      <p className="text-xs text-[#8d90a0] font-mono mt-4">
        Drag the center slider left or right to compare Before vs After
      </p>
    </main>
  );
};
