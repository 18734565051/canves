/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ToolType = 'select' | 'rect' | 'ellipse' | 'line' | 'text' | 'path' | 'pan';

export interface CanvasElement {
  id: string;
  type: 'rect' | 'ellipse' | 'line' | 'text' | 'path';
  x: number;
  y: number;
  width?: number; // for rect
  height?: number; // for rect
  x2?: number; // for line
  y2?: number; // for line
  points?: [number, number][]; // for path freehand drawing
  stroke: string;
  fill?: string;
  strokeWidth: number;
  text?: string; // for text
  fontSize?: number; // for text
  opacity: number;
  rotation?: number; // in degrees
}

export interface CanvasState {
  panX: number;
  panY: number;
  zoom: number;
}
