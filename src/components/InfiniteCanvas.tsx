/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { CanvasElement, CanvasState, ToolType } from '../types';

interface InfiniteCanvasProps {
  elements: CanvasElement[];
  onElementsChange: (els: CanvasElement[]) => void;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  currentTool: ToolType;
  setTool: (tool: ToolType) => void;
  canvasState: CanvasState;
  onCanvasStateChange: (state: CanvasState) => void;
  snapToGrid: boolean;
}

export const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({
  elements,
  onElementsChange,
  selectedElementId,
  onSelectElement,
  currentTool,
  setTool,
  canvasState,
  onCanvasStateChange,
  snapToGrid,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { panX, panY, zoom } = canvasState;

  // Active interaction tracking
  const [dragMode, setDragMode] = useState<'none' | 'canvas-pan' | 'item-move' | 'item-resize' | 'item-line-p2' | 'drawing-rect' | 'drawing-ellipse' | 'drawing-line' | 'drawing-path'>('none');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Specific item drag offset
  const [activeElementOffset, setActiveElementOffset] = useState({ x: 0, y: 0 });
  const [drawingElementId, setDrawingElementId] = useState<string | null>(null);

  // Focus status for text quick editing
  const [editingTextElementId, setEditingTextElementId] = useState<string | null>(null);
  const [tempTextValue, setTempTextValue] = useState('');

  // Track keydown for Spacebar panning shortcut
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT') {
        setIsSpacePressed(true);
        e.preventDefault();
      }
      
      // Shortcut keys
      if (document.activeElement?.tagName === 'INPUT') return;
      switch (e.key.toLowerCase()) {
        case 'v': setTool('select'); break;
        case 'h': setTool('pan'); break;
        case 'r': setTool('rect'); break;
        case 'o': setTool('ellipse'); break;
        case 'l': setTool('line'); break;
        case 't': setTool('text'); break;
        case 'p': setTool('path'); break;
        case 'escape': 
          onSelectElement(null); 
          setEditingTextElementId(null);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setTool, onSelectElement]);

  // Convert client viewport mouse position into scaled infinite scene coordinates
  const getSceneCoords = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - panX) / zoom;
    const y = (clientY - rect.top - panY) / zoom;
    return { x, y };
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    // Get current client mouse point
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Compute original scene coord under mouse focus points
    const sceneX = (mouseX - panX) / zoom;
    const sceneY = (mouseY - panY) / zoom;

    // Zoom speed
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const nextZoom = Math.min(6.0, Math.max(0.15, zoom * factor));

    // Calculate compensation translation so pointer alignment stays locked
    const nextPanX = mouseX - sceneX * nextZoom;
    const nextPanY = mouseY - sceneY * nextZoom;

    onCanvasStateChange({
      zoom: nextZoom,
      panX: nextPanX,
      panY: nextPanY
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    // Check Middle button (wheel click) or spacebar click or hand tool
    const isPanningAttempt = e.button === 1 || isSpacePressed || currentTool === 'pan';
    
    if (isPanningAttempt) {
      setDragMode('canvas-pan');
      setDragStart({ x: e.clientX, y: e.clientY });
      setPanStart({ x: panX, y: panY });
      e.preventDefault();
      return;
    }

    if (e.button !== 0) return; // Only accept primary click for operations

    const sceneCoords = getSceneCoords(e.clientX, e.clientY);
    let clickX = sceneCoords.x;
    let clickY = sceneCoords.y;

    if (snapToGrid) {
      clickX = Math.round(clickX / 40) * 40;
      clickY = Math.round(clickY / 40) * 40;
    }

    // Toggle Text Editing Exit
    if (editingTextElementId) {
      setEditingTextElementId(null);
    }

    // Creating modes
    if (currentTool !== 'select') {
      const newId = `el-${Date.now()}`;
      let newElement: CanvasElement;

      const randomColors = ['#2563eb', '#16a34a', '#ea580c', '#7c3aed', '#dc2626'];
      const strokeClr = randomColors[Math.floor(Math.random() * randomColors.length)];

      switch (currentTool) {
        case 'rect':
          newElement = {
            id: newId,
            type: 'rect',
            x: clickX,
            y: clickY,
            width: 0,
            height: 0,
            stroke: strokeClr,
            fill: `${strokeClr}20`, // transparent pastel tone initial
            strokeWidth: 2,
            opacity: 1,
            rotation: 0
          };
          setDragMode('drawing-rect');
          break;
        case 'ellipse':
          newElement = {
            id: newId,
            type: 'ellipse',
            x: clickX,
            y: clickY,
            width: 0,
            height: 0,
            stroke: strokeClr,
            fill: `${strokeClr}20`,
            strokeWidth: 2,
            opacity: 1,
            rotation: 0
          };
          setDragMode('drawing-ellipse');
          break;
        case 'line':
          newElement = {
            id: newId,
            type: 'line',
            x: clickX,
            y: clickY,
            x2: clickX,
            y2: clickY,
            stroke: strokeClr,
            strokeWidth: 3,
            opacity: 1,
            rotation: 0
          };
          setDragMode('drawing-line');
          break;
        case 'text':
          newElement = {
            id: newId,
            type: 'text',
            x: clickX,
            y: clickY,
            stroke: '#1e293b',
            strokeWidth: 1,
            text: '编辑我的文本标签...',
            fontSize: 20,
            opacity: 1,
            rotation: 0
          };
          onElementsChange([...elements, newElement]);
          onSelectElement(newId);
          setEditingTextElementId(newId);
          setTempTextValue('编辑我的文本标签...');
          setTool('select'); // Automatically hop back to pointer tool!
          return;
        case 'path':
          newElement = {
            id: newId,
            type: 'path',
            x: clickX,
            y: clickY,
            points: [[clickX, clickY]],
            stroke: '#ea580c',
            strokeWidth: 3,
            opacity: 1,
            rotation: 0
          };
          setDragMode('drawing-path');
          break;
        default:
          return;
      }

      setDrawingElementId(newId);
      onElementsChange([...elements, newElement]);
      onSelectElement(newId);
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // Select mode: check if user clicked on specific element
    // Loop backwards to support top-most layers first
    const clickedItem = [...elements].reverse().find(el => {
      if (el.type === 'rect') {
        return (
          clickX >= el.x && 
          clickX <= el.x + (el.width || 0) &&
          clickY >= el.y &&
          clickY <= el.y + (el.height || 0)
        );
      } else if (el.type === 'ellipse') {
        const cx = el.x + (el.width || 0) / 2;
        const cy = el.y + (el.height || 0) / 2;
        const rx = (el.width || 0) / 2;
        const ry = (el.height || 0) / 2;
        return (
          Math.pow(clickX - cx, 2) / Math.pow(rx || 1, 2) +
          Math.pow(clickY - cy, 2) / Math.pow(ry || 1, 2) <= 1
        );
      } else if (el.type === 'text') {
        // Approximate collision box
        const textLen = (el.text || '').length * 10;
        return (
          clickX >= el.x &&
          clickX <= el.x + textLen &&
          clickY >= el.y - (el.fontSize || 16) &&
          clickY <= el.y + 10
        );
      } else if (el.type === 'line') {
        // Simple distance check to endpoints or center
        const insideEndpoint1 = Math.hypot(clickX - el.x, clickY - el.y) < 15;
        const insideEndpoint2 = Math.hypot(clickX - (el.x2 || el.x), clickY - (el.y2 || el.y)) < 15;
        return insideEndpoint1 || insideEndpoint2;
      }
      return false;
    });

    if (clickedItem) {
      onSelectElement(clickedItem.id);
      setDragMode('item-move');
      setDragStart({ x: e.clientX, y: e.clientY });
      setActiveElementOffset({
        x: sceneCoords.x - clickedItem.x,
        y: sceneCoords.y - clickedItem.y
      });
    } else {
      // Clear selection
      onSelectElement(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragMode === 'none') return;

    if (dragMode === 'canvas-pan') {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      onCanvasStateChange({
        ...canvasState,
        panX: panStart.x + dx,
        panY: panStart.y + dy
      });
      return;
    }

    const sceneCoords = getSceneCoords(e.clientX, e.clientY);
    let currentX = sceneCoords.x;
    let currentY = sceneCoords.y;

    if (snapToGrid) {
      currentX = Math.round(currentX / 40) * 40;
      currentY = Math.round(currentY / 40) * 40;
    }

    if (dragMode === 'item-move' && selectedElementId) {
      onElementsChange(
        elements.map(el => {
          if (el.id !== selectedElementId) return el;
          let newX = sceneCoords.x - activeElementOffset.x;
          let newY = sceneCoords.y - activeElementOffset.y;
          if (snapToGrid) {
            newX = Math.round(newX / 40) * 40;
            newY = Math.round(newY / 40) * 40;
          }
          
          if (el.type === 'line') {
            const dx = newX - el.x;
            const dy = newY - el.y;
            return {
              ...el,
              x: newX,
              y: newY,
              x2: (el.x2 || el.x) + dx,
              y2: (el.y2 || el.y) + dy
            };
          }
          return { ...el, x: newX, y: newY };
        })
      );
      return;
    }

    // Handles item resizing via corner nodes
    if (dragMode === 'item-resize' && selectedElementId) {
      onElementsChange(
        elements.map(el => {
          if (el.id !== selectedElementId) return el;
          const newW = Math.max(10, currentX - el.x);
          const newH = Math.max(10, currentY - el.y);
          return {
            ...el,
            width: newW,
            height: newH
          };
        })
      );
      return;
    }

    // Handles item endpoint modification for Lines
    if (dragMode === 'item-line-p2' && selectedElementId) {
      onElementsChange(
        elements.map(el => {
          if (el.id !== selectedElementId) return el;
          return {
            ...el,
            x2: currentX,
            y2: currentY
          };
        })
      );
      return;
    }

    // Generating shapes interactive dimension expansions during drag
    if (drawingElementId) {
      onElementsChange(
        elements.map(el => {
          if (el.id !== drawingElementId) return el;

          if (el.type === 'rect' || el.type === 'ellipse') {
            const startX = el.x;
            const startY = el.y;
            const currentW = Math.max(1, currentX - startX);
            const currentH = Math.max(1, currentY - startY);
            return {
              ...el,
              width: currentW,
              height: currentH
            };
          } else if (el.type === 'line') {
            return {
              ...el,
              x2: currentX,
              y2: currentY
            };
          } else if (el.type === 'path') {
            return {
              ...el,
              points: [...(el.points || []), [currentX, currentY]]
            };
          }
          return el;
        })
      );
    }
  };

  const handleMouseUp = () => {
    // If we've completed drawing a shape and it has 0 dimension, spawn standard defaults
    if (drawingElementId) {
      onElementsChange(
        elements.map(el => {
          if (el.id !== drawingElementId) return el;
          if (el.type === 'rect' || el.type === 'ellipse') {
            if (!el.width || !el.height) {
              return {
                ...el,
                width: 100,
                height: 100
              };
            }
          } else if (el.type === 'line') {
            if (el.x === el.x2 && el.y === el.y2) {
              return {
                ...el,
                x2: el.x + 100,
                y2: el.y + 100
              };
            }
          }
          return el;
        })
      );
      setDrawingElementId(null);
      setTool('select'); // Clear tool selection to Select mode for easy interactions!
    }

    setDragMode('none');
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    // Allows interactive doubleclick deleting Demo (just like PySide6 canvas view doubleclick delete demo!)
    const sceneCoords = getSceneCoords(e.clientX, e.clientY);
    const clickX = sceneCoords.x;
    const clickY = sceneCoords.y;

    const clickedItem = [...elements].reverse().find(el => {
      if (el.type === 'rect') {
        return (
          clickX >= el.x && 
          clickX <= el.x + (el.width || 0) &&
          clickY >= el.y &&
          clickY <= el.y + (el.height || 0)
        );
      } else if (el.type === 'ellipse') {
        const cx = el.x + (el.width || 0) / 2;
        const cy = el.y + (el.height || 0) / 2;
        const rx = (el.width || 0) / 2;
        const ry = (el.height || 0) / 2;
        return (
          Math.pow(clickX - cx, 2) / Math.pow(rx || 1, 2) +
          Math.pow(clickY - cy, 2) / Math.pow(ry || 1, 2) <= 1
        );
      } else if (el.type === 'text') {
        const textLen = (el.text || '').length * 10;
        return (
          clickX >= el.x &&
          clickX <= el.x + textLen &&
          clickY >= el.y - (el.fontSize || 16) &&
          clickY <= el.y + 10
        );
      } else if (el.type === 'line') {
        return Math.hypot(clickX - el.x, clickY - el.y) < 20 || Math.hypot(clickX - (el.x2 || el.x), clickY - (el.y2 || el.y)) < 20;
      }
      return false;
    });

    if (clickedItem) {
      // Delete the item immediately
      onElementsChange(elements.filter(el => el.id !== clickedItem.id));
      onSelectElement(null);
    }
  };

  // Cursor selector
  const getCursorClass = () => {
    if (dragMode === 'canvas-pan') return 'cursor-grabbing';
    if (isSpacePressed || currentTool === 'pan') return 'cursor-grab';
    switch (currentTool) {
      case 'rect':
      case 'ellipse':
      case 'line':
        return 'cursor-crosshair';
      case 'text':
        return 'cursor-text';
      case 'path':
        return 'cursor-pencil';
      default:
        return 'cursor-default';
    }
  };

  const selectedElement = elements.find(el => el.id === selectedElementId);

  return (
    <div
      id="infinite-canvas-container"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onWheel={handleWheel}
      className={`flex-1 h-full relative overflow-hidden bg-[#f1f5f9] select-none outline-none ${getCursorClass()}`}
      style={{ touchAction: 'none' }}
    >
      {/* Infinite Grid Base Background Layer */}
      <div
        id="infinite-grid-base"
        className="absolute inset-0 pointer-events-none transition-all duration-75"
        style={{
          backgroundImage: `
            radial-gradient(circle, rgba(148, 163, 184, 0.20) 1px, transparent 1px),
            radial-gradient(circle, rgba(148, 163, 184, 0.45) 1.5px, transparent 1.5px)
          `,
          backgroundSize: `${40 * zoom}px ${40 * zoom}px, ${200 * zoom}px ${200 * zoom}px`,
          backgroundPosition: `${panX}px ${panY}px, ${panX}px ${panY}px`,
        }}
      />

      {/* Grid Coordinates Origin Axes (0,0 indicators) */}
      <div
        id="origin-axis-x"
        className="absolute h-[1px] bg-slate-450/20 pointer-events-none border-t border-dashed border-indigo-400/30"
        style={{ top: panY, left: 0, right: 0 }}
      >
        <span className="absolute left-6 bottom-1 font-mono text-[9px] text-slate-400 font-bold uppercase tracking-wider">
          QGraphicsScene X-Axis (0)
        </span>
      </div>

      <div
        id="origin-axis-y"
        className="absolute w-[1px] bg-slate-450/20 pointer-events-none border-l border-dashed border-indigo-400/30"
        style={{ left: panX, top: 0, bottom: 0 }}
      >
        <span className="absolute top-12 left-1.5 font-mono text-[9px] text-slate-400 font-bold uppercase tracking-wider [writing-mode:vertical-lr]">
          QGraphicsScene Y-Axis (0)
        </span>
      </div>

      {/* Axis intersection marker */}
      <div
        id="origin-locator-badge"
        className="absolute pointer-events-none font-mono text-[9px] bg-indigo-500/90 text-white rounded px-2 py-0.5 shadow-md shadow-indigo-500/10 font-bold select-none"
        style={{
          left: panX + 8,
          top: panY - 18,
        }}
      >
        Scene (0, 0) Origin
      </div>

      {/* Interactive Transformable Group Container */}
      <div
        id="canvas-transform-group"
        className="absolute origin-top-left w-full h-full pointer-events-none"
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
        }}
      >
        {/* Render elements using SVG for high-detail lines and scaling properties */}
        <svg id="svg-element-board" className="w-full h-full overflow-visible pointer-events-auto">
          {elements.map((el) => {
            const isSelected = el.id === selectedElementId;
            const opacity = el.opacity ?? 1;

            const baseStyle = {
              opacity,
              transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
              transformOrigin: el.type === 'rect' || el.type === 'ellipse' 
                ? `${el.x + (el.width || 100) / 2}px ${el.y + (el.height || 100) / 2}px` 
                : `${el.x}px ${el.y}px`,
              transition: 'transform 0.1s ease-out'
            };

            switch (el.type) {
              case 'rect':
                return (
                  <rect
                    key={el.id}
                    id={`svg-item-rect-${el.id}`}
                    x={el.x}
                    y={el.y}
                    width={el.width || 100}
                    height={el.height || 100}
                    rx="4" // Rounded corners by default for quality decoration
                    stroke={el.stroke}
                    fill={el.fill || 'transparent'}
                    strokeWidth={el.strokeWidth}
                    style={baseStyle}
                    className={`cursor-pointer transition-shadow ${
                      isSelected ? 'filter drop-shadow(0 4px 6px rgba(0,0,0,0.15))' : ''
                    }`}
                  />
                );

              case 'ellipse':
                const rx = (el.width || 100) / 2;
                const ry = (el.height || 100) / 2;
                return (
                  <ellipse
                    key={el.id}
                    id={`svg-item-ellipse-${el.id}`}
                    cx={el.x + rx}
                    cy={el.y + ry}
                    rx={rx}
                    ry={ry}
                    stroke={el.stroke}
                    fill={el.fill || 'transparent'}
                    strokeWidth={el.strokeWidth}
                    style={baseStyle}
                    className="cursor-pointer"
                  />
                );

              case 'line':
                return (
                  <g key={el.id} style={baseStyle}>
                    <line
                      id={`svg-item-line-${el.id}`}
                      x1={el.x}
                      y1={el.y}
                      x2={el.x2 || el.x}
                      y2={el.y2 || el.y}
                      stroke={el.stroke}
                      strokeWidth={el.strokeWidth}
                      className="cursor-pointer"
                    />
                    {/* Anchor handles specifically for selecting the lines */}
                    <circle 
                      cx={el.x} 
                      cy={el.y} 
                      r={6 / zoom} 
                      fill="#ea580c" 
                      className="cursor-pointer pointer-events-auto"
                    />
                    <circle 
                      cx={el.x2 || el.x} 
                      cy={el.y2 || el.y} 
                      r={6 / zoom} 
                      fill="#38bdf8" 
                      className="cursor-pointer pointer-events-auto"
                    />
                  </g>
                );

              case 'text':
                if (el.id === editingTextElementId) {
                  // If double clicked or text editing triggered, let's render a text component
                  return null; 
                }
                return (
                  <text
                    key={el.id}
                    id={`svg-item-text-${el.id}`}
                    x={el.x}
                    y={el.y + 16}
                    fill={el.stroke}
                    fontSize={el.fontSize || 18}
                    fontFamily="Inter, Arial, sans-serif"
                    fontWeight="600"
                    style={{
                      ...baseStyle,
                      userSelect: 'none',
                    }}
                    className="cursor-text font-semibold tracking-tight"
                  >
                    {el.text || 'Text'}
                  </text>
                );

              case 'path':
                if (!el.points || el.points.length === 0) return null;
                const d = `M ${el.points[0][0]} ${el.points[0][1]} ` + 
                          el.points.slice(1).map(p => `L ${p[0]} ${p[1]}`).join(' ');
                return (
                  <path
                    key={el.id}
                    id={`svg-item-path-${el.id}`}
                    d={d}
                    stroke={el.stroke}
                    strokeWidth={el.strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={baseStyle}
                    className="cursor-pointer"
                  />
                );

              default:
                return null;
            }
          })}

          {/* Rendering the active handle selection overlay outlines */}
          {selectedElement && (
            <g id="selection-outline-group" className="pointer-events-auto">
              {/* Highlight Outline */}
              {selectedElement.type === 'rect' || selectedElement.type === 'ellipse' ? (
                <>
                  <rect
                    id="selected-item-bbox"
                    x={selectedElement.x - 2}
                    y={selectedElement.y - 2}
                    width={(selectedElement.width || 100) + 4}
                    height={(selectedElement.height || 100) + 4}
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth={2 / zoom}
                    strokeDasharray={`${4 / zoom}, ${4 / zoom}`}
                    style={{
                      transform: selectedElement.rotation ? `rotate(${selectedElement.rotation}deg)` : undefined,
                      transformOrigin: `${selectedElement.x + (selectedElement.width || 100) / 2}px ${selectedElement.y + (selectedElement.height || 100) / 2}px`
                    }}
                  />
                  {/* Resizing Knob (Bottom-Right) */}
                  <rect
                    id="resize-handle-br"
                    x={selectedElement.x + (selectedElement.width || 100) - 4 / zoom}
                    y={selectedElement.y + (selectedElement.height || 100) - 4 / zoom}
                    width={10 / zoom}
                    height={10 / zoom}
                    fill="#ffffff"
                    stroke="#0284c7"
                    strokeWidth={2 / zoom}
                    className="cursor-se-resize shadow-md"
                    style={{
                      transform: selectedElement.rotation ? `rotate(${selectedElement.rotation}deg)` : undefined,
                      transformOrigin: `${selectedElement.x + (selectedElement.width || 100) / 2}px ${selectedElement.y + (selectedElement.height || 100) / 2}px`
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setDragMode('item-resize');
                    }}
                  />
                </>
              ) : selectedElement.type === 'line' ? (
                <>
                  {/* Handle 1 for Line start */}
                  <circle
                    id="line-handle-p1"
                    cx={selectedElement.x}
                    cy={selectedElement.y}
                    r={8 / zoom}
                    fill="#ffffff"
                    stroke="#ea580c"
                    strokeWidth={2.5 / zoom}
                    className="cursor-move"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setDragMode('item-move');
                      setActiveElementOffset({ x: 0, y: 0 }); // drag p1
                    }}
                  />
                  {/* Handle 2 for Line End */}
                  <circle
                    id="line-handle-p2"
                    cx={selectedElement.x2 || selectedElement.x}
                    cy={selectedElement.y2 || selectedElement.y}
                    r={8 / zoom}
                    fill="#ffffff"
                    stroke="#38bdf8"
                    strokeWidth={2.5 / zoom}
                    className="cursor-move"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setDragMode('item-line-p2');
                    }}
                  />
                </>
              ) : null}
            </g>
          )}
        </svg>

        {/* Input prompt overlay for double-clicked text box inside the scaled workspace */}
        {editingTextElementId && selectedElement && selectedElement.type === 'text' && (
          <div
            id="text-edit-overlay"
            className="absolute z-50 pointer-events-auto bg-[#0f172a] p-1.5 rounded-lg border border-slate-700 shadow-xl flex items-center gap-1.5"
            style={{
              left: selectedElement.x,
              top: selectedElement.y - 45,
              transform: `scale(${1 / zoom})`,
              transformOrigin: 'top left'
            }}
          >
            <input
              id="inline-text-editor"
              type="text"
              autoFocus
              value={tempTextValue}
              onChange={(e) => {
                setTempTextValue(e.target.value);
                onElementsChange(
                  elements.map(el => el.id === editingTextElementId ? { ...el, text: e.target.value } : el)
                );
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setEditingTextElementId(null);
                }
              }}
              className="bg-slate-900 text-xs px-2.5 py-1 text-slate-100 border border-slate-850 rounded focus:outline-none focus:border-sky-500 w-48 font-semibold font-sans"
            />
            <button
              id="confirm-text-btn"
              onClick={() => setEditingTextElementId(null)}
              className="bg-sky-600 hover:bg-sky-500 text-white rounded text-[10px] uppercase font-bold px-2 py-1 cursor-pointer font-sans"
            >
              确定
            </button>
          </div>
        )}
      </div>

      {/* Visual Canvas Micro Coordinates HUD (Heads-Up Display) */}
      <div
        id="coordinates-hud"
        className="absolute bottom-4 left-4 bg-[#0f172a]/95 text-slate-350 px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] font-mono shadow-xl select-none backdrop-blur shadow-slate-950/20 flex flex-col gap-0.5"
      >
        <div className="flex gap-4">
          <span>视图平移 (Pan): <strong className="text-sky-400">X={Math.round(panX)}, Y={Math.round(panY)}</strong></span>
          <span>缩放比: <strong className="text-amber-400">{Math.round(zoom * 100)}%</strong></span>
        </div>
        <div className="text-slate-500">
          工具模式: <strong className="text-emerald-400 font-sans">
            {currentTool === 'select' && '选择 (拖拉移动)'}
            {currentTool === 'pan' && '手握 (纯画布拖拽)'}
            {currentTool === 'rect' && 'QGraphicsRectItem (绘制)'}
            {currentTool === 'ellipse' && 'QGraphicsEllipseItem (绘制)'}
            {currentTool === 'line' && 'QGraphicsLineItem (绘制)'}
            {currentTool === 'text' && 'QGraphicsTextItem (输入)'}
            {currentTool === 'path' && 'QGraphicsPathItem (自由手写)'}
          </strong>
        </div>
      </div>
    </div>
  );
};
