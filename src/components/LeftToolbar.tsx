import React from 'react';
import { useImageEditor } from '../context/ImageEditorContext';
import { ToolType } from '../types/editor';
import { 
  Sliders, 
  Wand2, 
  Crop, 
  Columns, 
  LayoutGrid, 
  Type, 
  Pencil, 
  LucideIcon
} from 'lucide-react';

interface ToolItem {
  id: ToolType;
  label: string;
  icon: LucideIcon;
  action: () => void;
}

export const LeftToolbar: React.FC = () => {
  const { activeTool, setActiveTool, viewMode, setViewMode } = useImageEditor();

  const tools: ToolItem[] = [
    { id: 'adjust', label: 'Adjust', icon: Sliders, action: () => { setActiveTool('adjust'); setViewMode('editor'); } },
    { id: 'filters', label: 'Presets', icon: Wand2, action: () => { setActiveTool('filters'); setViewMode('editor'); } },
    { id: 'crop', label: 'Crop & Size', icon: Crop, action: () => { setActiveTool('crop'); setViewMode('editor'); } },
    { id: 'split', label: 'Compare', icon: Columns, action: () => { setActiveTool('split'); setViewMode('split'); } },
    { id: 'collage', label: 'Collage', icon: LayoutGrid, action: () => { setActiveTool('collage'); setViewMode('collage'); } },
    { id: 'text', label: 'Text', icon: Type, action: () => { setActiveTool('text'); setViewMode('editor'); } },
    { id: 'draw', label: 'Draw/Mask', icon: Pencil, action: () => { setActiveTool('draw'); setViewMode('editor'); } },
  ];

  return (
    <aside className="w-[64px] bg-[#1c1b1b] border-r border-[#2a2a2a] flex flex-col items-center py-3 select-none justify-between z-20">
      <div className="flex flex-col items-center gap-1.5 w-full">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = (activeTool === tool.id && viewMode === 'editor') || 
                           (tool.id === 'split' && viewMode === 'split') || 
                           (tool.id === 'collage' && viewMode === 'collage');

          return (
            <button
              key={tool.id}
              onClick={tool.action}
              className={`group w-11 h-11 rounded-lg flex flex-col items-center justify-center transition-all ${
                isActive 
                  ? 'bg-[#201f1f] text-[#2563eb] font-semibold' 
                  : 'text-[#8d90a0] hover:text-[#e5e2e1] hover:bg-[#201f1f]/60'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium tracking-tight mt-0.5">{tool.label}</span>

              <div className="absolute left-16 bg-[#2a2a2a] text-white text-xs px-2.5 py-1 rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap border border-[#434655]/40 font-mono">
                {tool.label}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
