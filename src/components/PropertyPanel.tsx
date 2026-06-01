/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trash2, Trash, Settings2, Info, Eye, ShieldAlert } from 'lucide-react';
import { CanvasElement } from '../types';

interface PropertyPanelProps {
  selectedElement: CanvasElement | null;
  onUpdateElement: (updated: CanvasElement) => void;
  onDeleteElement: (id: string) => void;
  totalElements: number;
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
}

const PRESET_COLORS = [
  '#2563eb', // Blue
  '#16a34a', // Green
  '#ea580c', // Orange
  '#ca8a04', // Yellow
  '#dc2626', // Red
  '#7c3aed', // Purple
  '#db2777', // Pink
  '#0f172a', // Slate Slate
  '#ffffff', // White
  'transparent' // None
];

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedElement,
  onUpdateElement,
  onDeleteElement,
  totalElements,
  snapToGrid,
  setSnapToGrid
}) => {

  const handlePropChange = (field: keyof CanvasElement, value: any) => {
    if (!selectedElement) return;
    onUpdateElement({
      ...selectedElement,
      [field]: value
    });
  };

  return (
    <div id="property-inspector-panel" className="w-80 shrink-0 bg-[#0f172a] text-slate-200 border-l border-slate-800 h-full flex flex-col justify-between select-none">
      <div className="p-4 flex flex-col gap-5 overflow-y-auto flex-1">
        
        {/* Title */}
        <div className="flex items-center gap-2">
          <Settings2 className="h-4.5 w-4.5 text-sky-400" />
          <h2 className="text-sm font-semibold text-slate-100 tracking-wide uppercase">属性检测器</h2>
        </div>

        <div className="h-[1px] bg-slate-850" />

        {selectedElement ? (
          <div className="flex flex-col gap-4">
            {/* Shape Label Badge */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-sky-900/50 text-sky-300 font-mono font-bold px-2 py-0.5 rounded border border-sky-800 uppercase">
                {selectedElement.type === 'rect' && '矩形图元'}
                {selectedElement.type === 'ellipse' && '椭圆形目标'}
                {selectedElement.type === 'line' && '直线/网栅'}
                {selectedElement.type === 'text' && '互动富文本'}
                {selectedElement.type === 'path' && '自由随笔路径'}
              </span>
              <button
                id="delete-selected-el-btn"
                onClick={() => onDeleteElement(selectedElement.id)}
                className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 p-1.5 rounded transition flex items-center gap-1 cursor-pointer"
                title="删除图元"
              >
                <Trash className="h-3 w-3" />
                <span>物理删除</span>
              </button>
            </div>

            {/* Coordinate Controllers */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-mono">坐标 X (px)</label>
                <input
                  id="el-x-input"
                  type="number"
                  value={Math.round(selectedElement.x)}
                  onChange={(e) => handlePropChange('x', parseFloat(e.target.value) || 0)}
                  className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-100 text-xs w-full focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-mono">坐标 Y (px)</label>
                <input
                  id="el-y-input"
                  type="number"
                  value={Math.round(selectedElement.y)}
                  onChange={(e) => handlePropChange('y', parseFloat(e.target.value) || 0)}
                  className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-100 text-xs w-full focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>

            {/* Size Controllers (For Dimensions) */}
            {(selectedElement.type === 'rect' || selectedElement.type === 'ellipse') && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-mono">宽度 Width (px)</label>
                  <input
                    id="el-width-input"
                    type="number"
                    min="5"
                    value={Math.round(selectedElement.width || 100)}
                    onChange={(e) => handlePropChange('width', Math.max(5, parseFloat(e.target.value) || 1))}
                    className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-100 text-xs w-full focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-mono">高度 Height (px)</label>
                  <input
                    id="el-height-input"
                    type="number"
                    min="5"
                    value={Math.round(selectedElement.height || 100)}
                    onChange={(e) => handlePropChange('height', Math.max(5, parseFloat(e.target.value) || 1))}
                    className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-100 text-xs w-full focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Endpoints for Line */}
            {selectedElement.type === 'line' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-mono">终点 X2 (px)</label>
                  <input
                    id="el-x2-input"
                    type="number"
                    value={Math.round(selectedElement.x2 || 0)}
                    onChange={(e) => handlePropChange('x2', parseFloat(e.target.value) || 0)}
                    className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-100 text-xs w-full focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-mono">终点 Y2 (px)</label>
                  <input
                    id="el-y2-input"
                    type="number"
                    value={Math.round(selectedElement.y2 || 0)}
                    onChange={(e) => handlePropChange('y2', parseFloat(e.target.value) || 0)}
                    className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-100 text-xs w-full focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Text Value Block */}
            {selectedElement.type === 'text' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-mono">富文本内容</label>
                <input
                  id="el-text-value-input"
                  type="text"
                  value={selectedElement.text || ''}
                  onChange={(e) => handlePropChange('text', e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 text-xs w-full focus:outline-none focus:border-sky-500"
                />
              </div>
            )}

            {/* Text Font Size */}
            {selectedElement.type === 'text' && (
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">字号 Size (px)</span>
                  <span className="text-sky-450">{selectedElement.fontSize || 16}px</span>
                </div>
                <input
                  id="el-fontsize-slider"
                  type="range"
                  min="10"
                  max="72"
                  value={selectedElement.fontSize || 16}
                  onChange={(e) => handlePropChange('fontSize', parseInt(e.target.value))}
                  className="w-full accent-sky-500 h-1 bg-slate-800 rounded"
                />
              </div>
            )}

            {/* Rotation Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">旋转角度 Rotation</span>
                <span className="text-sky-450">{selectedElement.rotation || 0}°</span>
              </div>
              <input
                id="el-rotation-slider"
                type="range"
                min="0"
                max="360"
                value={selectedElement.rotation || 0}
                onChange={(e) => handlePropChange('rotation', parseInt(e.target.value))}
                className="w-full accent-sky-500 h-1 bg-slate-800 rounded"
              />
            </div>

            {/* Fill Color */}
            {selectedElement.type !== 'line' && selectedElement.type !== 'text' && selectedElement.type !== 'path' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-mono">填充颜色 Fill</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      id={`fill-preset-${c}`}
                      onClick={() => handlePropChange('fill', c)}
                      className={`h-6 rounded cursor-pointer border relative transition-all ${
                        selectedElement.fill === c ? 'ring-2 ring-sky-400 border-transparent scale-110' : 'border-slate-800 hover:scale-105'
                      }`}
                      style={{ 
                        backgroundColor: c === 'transparent' ? 'transparent' : c,
                        backgroundImage: c === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : undefined,
                        backgroundSize: '8px 8px',
                        backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0'
                      }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Stroke Color/Text Color */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-mono">
                {selectedElement.type === 'text' ? '字体色彩 Color' : '描边颜色 Stroke'}
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {PRESET_COLORS.filter(c => c !== 'transparent').map((c) => (
                  <button
                    key={c}
                    id={`stroke-preset-${c}`}
                    onClick={() => handlePropChange('stroke', c)}
                    className={`h-6 rounded cursor-pointer border transition-all ${
                      selectedElement.stroke === c ? 'ring-2 ring-sky-400 border-transparent scale-110' : 'border-slate-800 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>

            {/* Stroke Width */}
            {selectedElement.type !== 'text' && (
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">线宽 Width</span>
                  <span className="text-sky-450">{selectedElement.strokeWidth}px</span>
                </div>
                <input
                  id="el-line-width-slider"
                  type="range"
                  min="1"
                  max="16"
                  value={selectedElement.strokeWidth}
                  onChange={(e) => handlePropChange('strokeWidth', parseInt(e.target.value))}
                  className="w-full accent-sky-500 h-1 bg-slate-800 rounded"
                />
              </div>
            )}

            {/* Opacity Selector */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">不透明度 Opacity</span>
                <span className="text-sky-450">{Math.round((selectedElement.opacity || 1) * 100)}%</span>
              </div>
              <input
                id="el-opacity-slider"
                type="range"
                min="10"
                max="100"
                value={Math.round((selectedElement.opacity || 1) * 100)}
                onChange={(e) => handlePropChange('opacity', parseFloat(e.target.value) / 100)}
                className="w-full accent-sky-500 h-1 bg-slate-800 rounded"
              />
            </div>
            
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 gap-4">
            <div className="p-4 bg-slate-900 rounded-full border border-slate-850">
              <Info className="h-6 w-6 text-slate-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-slate-350 text-xs font-semibold">未选择任何图元对象</p>
              <p className="text-[11px] text-slate-500 leading-normal max-w-[200px] mx-auto">
                在画布上左键点击激活某个图元，或者点击左侧工具并在画布中创建新元素来查看属性。
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Global Config Area */}
      <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex flex-col gap-3">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">全局设置及物理参数</span>
        
        {/* Total Elements Counter */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">画布活动元素计数:</span>
          <span className="text-sky-400 font-mono font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{totalElements} 个</span>
        </div>

        {/* Snap to Grid Checkbox */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">启用自适应微网格对齐:</span>
          <button
            id="snap-grid-toggle-btn"
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
              snapToGrid ? 'bg-sky-500' : 'bg-slate-800'
            }`}
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
              snapToGrid ? 'translate-x-4' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {/* PySide6 QGraphicsScene Tip */}
        <div className="bg-sky-950/20 p-2.5 rounded border border-sky-900/40 text-[10px] text-sky-400 flex gap-2">
          <Eye className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            <strong>Qt 底层机制：</strong>画布上的每一个图形都由 <code>QGraphicsItem</code> 表示，并通过 <code>ItemIsMovable</code> 默认赋予桌面应用级的自由交互与移动能力。
          </p>
        </div>
      </div>
    </div>
  );
};
