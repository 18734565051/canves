/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Plus, 
  Minus, 
  MousePointer, 
  Hand, 
  Square, 
  Circle, 
  Minus as LineIcon, 
  Type, 
  Pencil, 
  Trash2, 
  Focus,
  Sparkles
} from 'lucide-react';
import { ToolType } from '../types';

interface ToolbarProps {
  currentTool: ToolType;
  setTool: (tool: ToolType) => void;
  onClear: () => void;
  onResetView: () => void;
  onAddSamples: () => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  setTool,
  onClear,
  onResetView,
  onAddSamples,
  zoom,
  onZoomChange
}) => {
  const tools = [
    { id: 'select' as ToolType, label: '选择核心', icon: MousePointer, tooltip: '选择并自由拖拽、旋转、修改图元 (快捷键: V)' },
    { id: 'pan' as ToolType, label: '平移画布', icon: Hand, tooltip: '太空拖拽：按下左键平移无限画布 (快捷键: H)' },
    { id: 'rect' as ToolType, label: '矩形图元', icon: Square, tooltip: '在画布点击或拉伸创建现代圆角矩形 (快捷键: R)' },
    { id: 'ellipse' as ToolType, label: '椭圆图元', icon: Circle, tooltip: '在画布点击或拉伸创建完美环状椭圆 (快捷键: O)' },
    { id: 'line' as ToolType, label: '连接线段', icon: LineIcon, tooltip: '创建高导向指示折线或连线 (快捷键: L)' },
    { id: 'text' as ToolType, label: '双击文本', icon: Type, tooltip: '一键点击添加可读标签及主题文本 (快捷键: T)' },
    { id: 'path' as ToolType, label: '手写路径', icon: Pencil, tooltip: '自由随笔：高动态自由手写勾勒 (快捷键: P)' }
  ];

  return (
    <div id="canvas-toolbar" className="flex flex-col bg-[#0f172a] text-slate-100 border-r border-slate-800 w-64 shrink-0 shadow-2xl h-full select-none justify-between">
      {/* Upper Tools Area */}
      <div className="flex flex-col p-4 gap-5 overflow-y-auto">
        {/* Header Branding */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2.5 w-2.5 bg-sky-500 rounded-full animate-pulse" />
            <h1 className="text-sm font-semibold tracking-wider uppercase text-slate-200">PySide6 Workspace</h1>
          </div>
          <p className="text-xs text-slate-400 font-medium">无线场景设计箱</p>
        </div>

        {/* Separator */}
        <div className="h-[1px] bg-slate-800" />

        {/* Basic Tools Grid */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-mono tracking-wider text-slate-500 mb-1 block uppercase">画布操作工具</span>
          
          {tools.map((t) => {
            const Icon = t.icon;
            const isActive = currentTool === t.id;
            return (
              <button
                key={t.id}
                id={`tool-btn-${t.id}`}
                onClick={() => setTool(t.id)}
                title={t.tooltip}
                className={`group flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                  isActive 
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/20 translate-x-1' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105 text-slate-400 group-hover:text-amber-400'}`} />
                  <span>{t.label}</span>
                </div>
                {!isActive && (
                  <span className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono uppercase group-hover:text-slate-400">
                    {t.id.slice(0, 1)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-2 mt-2">
          <span className="text-xs font-mono tracking-wider text-slate-500 mb-1 block uppercase">快速命令</span>
          
          <button
            id="center-view-btn"
            onClick={onResetView}
            className="flex items-center gap-2.5 w-full text-left text-xs text-slate-300 hover:bg-slate-800/80 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 hover:translate-x-0.5"
            title="将缩放比例还原为100%并对齐中心 (0,0)"
          >
            <Focus className="h-4 w-4 text-emerald-400" />
            <span>坐标重置居中</span>
          </button>

          <button
            id="add-samples-btn"
            onClick={onAddSamples}
            className="flex items-center gap-2.5 w-full text-left text-xs text-slate-300 hover:bg-slate-800/80 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 hover:translate-x-0.5"
            title="预先填充一组高素质的矩形、圆形、文本示例对象"
          >
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span>生成高素质样例</span>
          </button>

          <button
            id="clear-canvas-btn"
            onClick={onClear}
            className="flex items-center gap-2.5 w-full text-left text-xs text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 mt-1"
            title="清空当前所有图元物件"
          >
            <Trash2 className="h-4 w-4" />
            <span>彻底清空画布</span>
          </button>
        </div>
      </div>

      {/* Bottom Panel - Zoom and Guide */}
      <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex flex-col gap-3">
        {/* Zoom Control */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>缩放级别</span>
          <span className="text-sky-400 font-bold">{Math.round(zoom * 100)}%</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            id="zoom-out-btn"
            onClick={() => onZoomChange(Math.max(0.15, zoom - 0.15))}
            className="p-1 px-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer active:scale-90 transition-all font-bold"
            title="缩小"
          >
            <Minus className="h-3 w-3" />
          </button>
          
          <input
            id="zoom-range-slider"
            type="range"
            min="15"
            max="400"
            value={Math.round(zoom * 100)}
            onChange={(e) => onZoomChange(parseFloat(e.target.value) / 100)}
            className="flex-1 accent-sky-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />
          
          <button
            id="zoom-in-btn"
            onClick={() => onZoomChange(Math.min(4.0, zoom + 0.15))}
            className="p-1 px-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer active:scale-90 transition-all font-bold"
            title="放大"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Hotkey Guideline Note */}
        <div className="bg-slate-950/40 p-2.5 rounded-md border border-slate-800 text-[10px] text-slate-400 leading-relaxed font-sans">
          <p className="font-semibold text-slate-300 mb-0.5">💡 PC 桌面操控提示：</p>
          <ul className="list-disc list-inside space-y-0.5 text-slate-500 font-mono">
            <li><strong className="text-slate-350">鼠标中键:</strong> 任意拖拽平移</li>
            <li><strong className="text-slate-350">鼠标滚轮:</strong> 原心高质缩放</li>
            <li><strong className="text-slate-350">双击图元:</strong> 快速一键删除</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
