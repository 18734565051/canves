/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Code, Copy, Download, Check, Terminal, Play, FileText } from 'lucide-react';
import { generatePySide6Code } from '../codeGenerator';
import { CanvasElement } from '../types';

interface CodePanelProps {
  elements: CanvasElement[];
}

export const CodePanel: React.FC<CodePanelProps> = ({ elements }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab2] = useState<'code' | 'guide'>('code');

  const pythonCode = generatePySide6Code(elements);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pythonCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([pythonCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pyside6_infinite_canvas.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="pyside6-code-panel" className="bg-[#0b1329] border-t border-slate-850 h-[300px] flex flex-col shrink-0 text-slate-300">
      {/* Code Header Control Bar */}
      <div className="bg-[#0f172a] border-b border-slate-850 px-5 py-2.5 flex items-center justify-between select-none">
        {/* Title */}
        <div className="flex items-center gap-2">
          <Code className="h-4.5 w-4.5 text-sky-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            PySide6 动态代码生成器
          </span>
          <span className="text-[10px] bg-sky-950 font-mono text-sky-300 px-2 py-0.5 rounded-full border border-sky-800">
            自动构建 {elements.length} 个图元初始化
          </span>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-[#0b1329] rounded p-0.5 border border-slate-800 gap-1 text-xs">
          <button
            id="tab-code-btn"
            onClick={() => setActiveTab2('code')}
            className={`px-3 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'code' ? 'bg-sky-600 text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Python 完整应用代码</span>
          </button>
          <button
            id="tab-guide-btn"
            onClick={() => setActiveTab2('guide')}
            className={`px-3 py-1 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'guide' ? 'bg-sky-600 text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>桌面端快速运行指南</span>
          </button>
        </div>

        {/* Export Actuators */}
        <div className="flex items-center gap-2">
          <button
            id="copy-code-btn"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-100 rounded border border-slate-700 transition cursor-pointer"
            title="一键复制到剪贴板"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">自适应复制完毕!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>复制代码</span>
              </>
            )}
          </button>

          <button
            id="download-py-btn"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-xs text-white rounded font-medium transition cursor-pointer"
            title="下载为 .py 脚本"
          >
            <Download className="h-3.5 w-3.5" />
            <span>下载应用程序脚本</span>
          </button>
        </div>
      </div>

      {/* Tabs Display Panel */}
      <div className="flex-1 overflow-auto min-h-0 font-mono text-xs leading-relaxed">
        {activeTab === 'code' ? (
          <div className="p-4 relative">
            <pre id="python-code-block" className="text-[#a5b4fc] selection:bg-slate-800 scrollbar-thin scrollbar-thumb-slate-800">
              <code>{pythonCode}</code>
            </pre>
          </div>
        ) : (
          <div className="p-6 text-slate-300 font-sans leading-relaxed space-y-4 max-w-4xl">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-sky-950 text-sky-400 rounded border border-sky-900/60 mt-1">
                <Play className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-slate-100 font-bold text-sm mb-1">
                  100% 本地 1:1 实现，如何运行此 PySide6 无线画布？
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  通过将此智能生成的脚本下载到本地电脑，你可以通过极速安装 Python 环境和 <code>PySide6</code> 桌面渲染库运行此窗体，无需额外搭建。
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="text-xs font-bold text-slate-200">步骤一：安装依赖项</span>
                </div>
                <p className="text-xs text-slate-400">
                  确保你的系统装有 Python 3.8+。在终端中执行以下 pip 包管理器命令：
                </p>
                <div className="bg-black/40 text-sky-400 p-2.5 rounded font-mono text-[11px] border border-slate-850 flex items-center justify-between">
                  <span>pip install PySide6</span>
                  <button 
                    onClick={() => navigator.clipboard.writeText('pip install PySide6')}
                    className="text-[10px] text-slate-500 hover:text-white px-2 py-0.5 rounded bg-slate-800 transition select-none cursor-pointer"
                  >
                    复制
                  </button>
                </div>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold text-slate-200">步骤二：极速执行</span>
                </div>
                <p className="text-xs text-slate-400">
                  将代码保存为 <code>pyside6_infinite_canvas.py</code> 文件后，使用以下命令运行：
                </p>
                <div className="bg-black/40 text-emerald-400 p-2.5 rounded font-mono text-[11px] border border-slate-850 flex items-center justify-between">
                  <span>python pyside6_infinite_canvas.py</span>
                  <button 
                    onClick={() => navigator.clipboard.writeText('python pyside6_infinite_canvas.py')}
                    className="text-[10px] text-slate-500 hover:text-white px-2 py-0.5 rounded bg-slate-800 transition select-none cursor-pointer"
                  >
                    复制
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-950/20 border border-yellow-900/30 text-xs text-yellow-500/90 rounded flex items-start gap-3 mt-2">
              <span className="font-bold shrink-0 mt-0.5">⚠️ 环境提示:</span>
              <p className="leading-relaxed">
                PySide6 (Qt for Python 6) 是商业级桌面跨平台 GUI 开发标配支架。我们在生成的 Python 脚本末端为您内置了 <code>load_initial_elements()</code> 启动引擎，将您在上面 Web 无线画布上创建的所有复杂图元（矩形、环椭圆、直线文本等）直接编纂转换进入了桌面场景初始化，在本地秒速执行！
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
