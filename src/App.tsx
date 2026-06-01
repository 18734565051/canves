/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { InfiniteCanvas } from './components/InfiniteCanvas';
import { PropertyPanel } from './components/PropertyPanel';
import { CodePanel } from './components/CodePanel';
import { CanvasElement, CanvasState, ToolType } from './types';
import { Info, HelpCircle } from 'lucide-react';

const INITIAL_SAMPLES: CanvasElement[] = [
  {
    id: 'welcome-rect',
    type: 'rect',
    x: -120,
    y: -120,
    width: 240,
    height: 140,
    stroke: '#2563eb',
    fill: '#2563eb18',
    strokeWidth: 2,
    opacity: 1,
    rotation: 0
  },
  {
    id: 'welcome-title',
    type: 'text',
    x: -100,
    y: -100,
    stroke: '#1e293b',
    strokeWidth: 1,
    text: '无线画布引擎 (Core v1.0)',
    fontSize: 16,
    opacity: 1,
    rotation: 0
  },
  {
    id: 'welcome-desc1',
    type: 'text',
    x: -100,
    y: -70,
    stroke: '#475569',
    strokeWidth: 1,
    text: '- 按住鼠标中键或抓手工具即可平移',
    fontSize: 12,
    opacity: 0.9,
    rotation: 0
  },
  {
    id: 'welcome-desc2',
    type: 'text',
    x: -100,
    y: -45,
    stroke: '#475569',
    strokeWidth: 1,
    text: '- 滚动鼠标滚轮实现原心位置缩放',
    fontSize: 12,
    opacity: 0.9,
    rotation: 0
  },
  {
    id: 'ellipse-accent1',
    type: 'ellipse',
    x: 180,
    y: -120,
    width: 140,
    height: 140,
    stroke: '#16a34a',
    fill: '#16a34a15',
    strokeWidth: 2,
    opacity: 0.95,
    rotation: 20
  },
  {
    id: 'ellipse-text',
    type: 'text',
    x: 210,
    y: -60,
    stroke: '#15803d',
    strokeWidth: 1,
    text: 'QGraphicsItem',
    fontSize: 12,
    opacity: 1,
    rotation: 20
  },
  {
    id: 'accent-line',
    type: 'line',
    x: -50,
    y: 80,
    x2: 250,
    y2: 80,
    stroke: '#ea580c',
    strokeWidth: 3,
    opacity: 0.9,
    rotation: 0
  }
];

export default function App() {
  const [elements, setElements] = useState<CanvasElement[]>(INITIAL_SAMPLES);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [currentTool, setTool] = useState<ToolType>('select');
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  
  // High quality coordinate tracking with (0,0) centered dynamically on client render window load
  const [canvasState, setCanvasState] = useState<CanvasState>({
    panX: 420, // Default center approximation
    panY: 220,
    zoom: 1.0
  });

  useEffect(() => {
    // Dynamic alignment on visual mount
    const container = document.getElementById('infinite-canvas-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      setCanvasState({
        panX: rect.width / 2,
        panY: rect.height / 2,
        zoom: 1.0
      });
    }
  }, []);

  const handleClearElements = () => {
    if (window.confirm('您确定要彻底清空画布上的所有图元物件吗？')) {
      setElements([]);
      setSelectedElementId(null);
    }
  };

  const handleResetViewport = () => {
    const container = document.getElementById('infinite-canvas-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      setCanvasState({
        panX: rect.width / 2,
        panY: rect.height / 2,
        zoom: 1.0
      });
    } else {
      setCanvasState({
        panX: 400,
        panY: 250,
        zoom: 1.0
      });
    }
  };

  const handleAddSamples = () => {
    setElements([...elements, ...INITIAL_SAMPLES.map(el => ({
      ...el,
      id: `${el.id}-dupe-${Date.now()}`,
      x: el.x + (Math.random() * 200 - 100),
      y: el.y + (Math.random() * 200 - 100)
    }))]);
  };

  const handleUpdateElement = (updated: CanvasElement) => {
    setElements(elements.map(el => el.id === updated.id ? updated : el));
  };

  const handleDeleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    setSelectedElementId(null);
  };

  const selectedElement = elements.find(el => el.id === selectedElementId) || null;

  return (
    <div id="app-designer-root" className="h-screen w-screen flex flex-col overflow-hidden bg-[#090d16] font-sans text-slate-200">
      
      {/* Top Main Designer Banner */}
      <header id="main-header" className="bg-[#0f172a] border-b border-slate-850 px-6 py-3.5 shrink-0 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 stroke-current stroke-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v16.5m0-16.5h16.5m-16.5 0L19.5 20.25M19.5 3.75v16.5m0-16.5L3.75 20.25" />
            </svg>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-sm tracking-tight">PySide6 Infinite Canvas Studio</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-full uppercase border border-slate-700">
                Qt GUI 视图层建模
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">无代码交互式网格设计器 • 直链桌面应用生成框架</p>
          </div>
        </div>

        {/* Quick System Guidances */}
        <div className="flex items-center gap-6 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>编译环境: PySide 6.8+ (Qt v6)</span>
          </div>
          <div className="h-3.5 w-[1px] bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-sky-400" />
            <span>场景原点: 坐标系垂直向下</span>
          </div>
        </div>
      </header>

      {/* Main content split */}
      <div className="flex-1 flex min-h-0 bg-[#090d16]">
        {/* Left Side toolbox */}
        <Toolbar
          currentTool={currentTool}
          setTool={setTool}
          onClear={handleClearElements}
          onResetView={handleResetViewport}
          onAddSamples={handleAddSamples}
          zoom={canvasState.zoom}
          onZoomChange={(z) => setCanvasState({ ...canvasState, zoom: z })}
        />

        {/* Center content - divided vertically (Canvas + Code output) */}
        <div className="flex-grow flex flex-col min-h-0 relative bg-slate-100">
          
          {/* Main Visual Arena */}
          <div className="flex-1 min-h-0 relative">
            <InfiniteCanvas
              elements={elements}
              onElementsChange={setElements}
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              currentTool={currentTool}
              setTool={setTool}
              canvasState={canvasState}
              onCanvasStateChange={setCanvasState}
              snapToGrid={snapToGrid}
            />
          </div>

          {/* Code output Drawer / Console */}
          <CodePanel elements={elements} />
        </div>

        {/* Right Side properties inspector */}
        <PropertyPanel
          selectedElement={selectedElement}
          onUpdateElement={handleUpdateElement}
          onDeleteElement={handleDeleteElement}
          totalElements={elements.length}
          snapToGrid={snapToGrid}
          setSnapToGrid={setSnapToGrid}
        />
      </div>
    </div>
  );
}

