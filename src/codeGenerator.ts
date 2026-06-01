/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CanvasElement } from './types';

export function generatePySide6Code(elements: CanvasElement[]): string {
  // Translate colors to hex and QColor representation
  const hexToQColor = (hex: string, opacity: number = 1) => {
    // defaults if not hex
    if (!hex.startsWith('#')) {
      if (hex === 'transparent') return 'QColor(0, 0, 0, 0)';
      return `QColor("${hex}")`;
    }
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const a = Math.round(opacity * 255);
    return `QColor(${r}, ${g}, ${b}, ${a})`;
  };

  const shapesCode = elements.map((el, index) => {
    const varName = `item_${index}_${el.type}`;
    let itemInit = '';
    
    // Convert fill/stroke colors
    const penColor = hexToQColor(el.stroke);
    const penWidth = el.strokeWidth;
    let brushCode = 'Qt.NoBrush';
    if (el.fill && el.fill !== 'transparent') {
      brushCode = `QBrush(${hexToQColor(el.fill, el.opacity)})`;
    }

    const penCode = `QPen(${penColor}, ${penWidth})`;

    switch (el.type) {
      case 'rect':
        itemInit = `        # 创建矩形元素
        ${varName} = QGraphicsRectItem(${el.x}, ${el.y}, ${el.width || 100}, ${el.height || 100})
        ${varName}.setPen(${penCode})
        ${varName}.setBrush(${brushCode})`;
        break;
      case 'ellipse':
        // cx, cy are actual x, y in types. rx, ry are stored or derived
        const rWidth = (el.width || 80);
        const rHeight = (el.height || 80);
        itemInit = `        # 创建椭圆/圆形元素
        ${varName} = QGraphicsEllipseItem(${el.x}, ${el.y}, ${rWidth}, ${rHeight})
        ${varName}.setPen(${penCode})
        ${varName}.setBrush(${brushCode})`;
        break;
      case 'line':
        itemInit = `        # 创建线段元素
        ${varName} = QGraphicsLineItem(${el.x}, ${el.y}, ${el.x2 || (el.x + 100)}, ${el.y2 || (el.y + 100)})
        ${varName}.setPen(${penCode})`;
        break;
      case 'text':
        const textColorCode = hexToQColor(el.stroke, el.opacity);
        itemInit = `        # 创建文本元素
        ${varName} = QGraphicsTextItem("${el.text || 'Text'}")
        ${varName}.setDefaultTextColor(${textColorCode})
        ${varName}.setFont(QFont("Arial", ${el.fontSize || 16}))
        ${varName}.setPos(${el.x}, ${el.y})`;
        break;
      case 'path':
        if (el.points && el.points.length > 0) {
          const ptString = el.points.map(pt => `QPointF(${pt[0]}, ${pt[1]})`).join(', ');
          itemInit = `        # 创建手写路径元素
          path = QPainterPath()
          points = [${ptString}]
          if points:
              path.moveTo(points[0])
              for pt in points[1:]:
                  path.lineTo(pt)
          ${varName} = QGraphicsPathItem(path)
          ${varName}.setPen(${penCode})
          # 路径半透明背景填充
          ${varName}.setBrush(Qt.NoBrush)`;
        } else {
          return '';
        }
        break;
    }

    // Set common flags for interactivity
    const interactionFlags = [
      'QGraphicsItem.ItemIsMovable',
      'QGraphicsItem.ItemIsSelectable',
      'QGraphicsItem.ItemSendsGeometryChanges'
    ].join(' | ');

    const rotationCode = el.rotation ? `\n        ${varName}.setRotation(${el.rotation})` : '';

    return `${itemInit}
        ${varName}.setFlags(${interactionFlags})${rotationCode}
        self.scene.addItem(${varName})
`;
  }).filter(line => line !== '').join('\n');

  return `import sys
import math
from PySide6.QtCore import Qt, QPointF, QRectF, QPoint
from PySide6.QtGui import (QPainter, QMouseEvent, QWheelEvent, QColor, QPen, 
                           QBrush, QFont, QPainterPath, QAction, QIcon, QKeySequence)
from PySide6.QtWidgets import (QApplication, QGraphicsView, QGraphicsScene, 
                             QGraphicsRectItem, QGraphicsEllipseItem, 
                             QGraphicsLineItem, QGraphicsPathItem, QGraphicsTextItem,
                             QMainWindow, QVBoxLayout, QHBoxLayout, QWidget, 
                             QPushButton, QLabel, QFileDialog, QGraphicsItem,
                             QStatusBar, QToolBar, QColorDialog, QInputDialog,
                             QGraphicsSceneMouseEvent)

class InfiniteCanvasView(QGraphicsView):
    """
    自定义 QGraphicsView 容器，提供无限画布的缩放 (Scroll-to-zoom) 和平移 (Middle-mouse drag) 交互功能。
    """
    def __init__(self, scene, parent=None):
        super().__init__(scene, parent)
        self.setRenderHint(QPainter.Antialiasing) # 开启抗锯齿
        self.setRenderHint(QPainter.SmoothPixmapTransform)
        self.setViewportUpdateMode(QGraphicsView.FullViewportUpdate)
        
        # 隐藏水平和垂直滚动条以提供完美的沉浸式画布感觉
        self.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        self.setVerticalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        
        # 拖拽平移相关变量
        self._is_panning = False
        self._pan_start_pos = QPoint()
        
        # 图形操作辅助
        self.current_tool = "select" # 选项: "select", "rect", "ellipse", "line", "text"
        
        # 初始化缩放限制
        self.min_zoom_factor = 0.15
        self.max_zoom_factor = 8.0
        
        # 提示用户可以通过中键进行平移
        self.setCursor(Qt.ArrowCursor)

    def drawBackground(self, painter: QPainter, rect: QRectF):
        """
        覆盖本方法，利用当前的场景尺寸网格绘制无限网格线，
        它会伴随着画布的缩放与拖拽平移自动自适应无缝绘制。
        """
        # 填充高素质护眼微灰白色背景
        painter.fillRect(rect, QColor(248, 249, 250))
        
        # 1. 细网格（小刻度）
        grid_size = 40
        left = int(math.floor(rect.left() - (rect.left() % grid_size)))
        top = int(math.floor(rect.top() - (rect.top() % grid_size)))
        right = int(math.ceil(rect.right()))
        bottom = int(math.ceil(rect.bottom()))
        
        # 获取当前视图的缩放比例，网格线自适应变浅或隐去
        zoom_level = self.transform().m11()
        
        if zoom_level > 0.3:
            # 细网格画笔
            sub_pen = QPen(QColor(226, 232, 240, int(min(255, 30 * zoom_level))), 1, Qt.SolidLine)
            painter.setPen(sub_pen)
            for x in range(left, right, grid_size):
                painter.drawLine(x, int(rect.top()), x, int(rect.bottom()))
            for y in range(top, bottom, grid_size):
                painter.drawLine(int(rect.left()), y, int(rect.right()), y)
                
        # 2. 粗网格（大主刻度格 200px）
        major_grid_size = 200
        major_left = int(math.floor(rect.left() - (rect.left() % major_grid_size)))
        major_top = int(math.floor(rect.top() - (rect.top() % major_grid_size)))
        
        major_pen = QPen(QColor(203, 213, 225, int(min(255, 120 * zoom_level))), 1.5, Qt.SolidLine)
        painter.setPen(major_pen)
        for x in range(major_left, right, major_grid_size):
            painter.drawLine(x, int(rect.top()), x, int(rect.bottom()))
        for y in range(major_top, bottom, major_grid_size):
            painter.drawLine(int(rect.left()), y, int(rect.right()), y)

    def wheelEvent(self, event: QWheelEvent):
        """
        鼠标滚轮滚动：以鼠标指针所在位置为原点进行自适应高灵敏缩放。
        """
        zoom_factor = 1.15
        if event.angleDelta().y() < 0:
            zoom_factor = 1.0 / zoom_factor
            
        # 获得当前的缩放倍数
        current_zoom = self.transform().m11()
        new_zoom = current_zoom * zoom_factor
        
        # 缩放界限约束
        if new_zoom < self.min_zoom_factor or new_zoom > self.max_zoom_factor:
            return
            
        # 得到鼠标在场景下的映射坐标，使缩放聚焦指针
        old_scene_pos = self.mapToScene(event.position().toPoint())
        
        # 执行缩放
        self.scale(zoom_factor, zoom_factor)
        
        # 拖拽位移平移补偿，使得鼠标落点不变
        new_scene_pos = self.mapToScene(event.position().toPoint())
        delta = new_scene_pos - old_scene_pos
        self.translate(delta.x(), delta.y())
        
        # 向上级触发通知，以便更新状态栏
        if hasattr(self.window(), "update_status"):
            self.window().update_status()

    def mousePressEvent(self, event: QMouseEvent):
        """
        中键点击 / 或在空格平移工具下：记录起始坐标，开始平移画布。
        """
        if event.button() == Qt.MiddleButton or (event.button() == Qt.LeftButton and self.current_tool == "pan"):
            self._is_panning = True
            self._pan_start_pos = event.position().toPoint()
            self.setCursor(Qt.ClosedHandCursor)
            event.accept()
            return

        super().mousePressEvent(event)

    def mouseMoveEvent(self, event: QMouseEvent):
        """
        中键拖拽：自适应更新平移偏量。
        """
        if self._is_panning:
            current_pos = event.position().toPoint()
            delta = current_pos - self._pan_start_pos
            self._pan_start_pos = current_pos
            
            # 操作滚动条实现平移
            self.horizontalScrollBar().setValue(self.horizontalScrollBar().value() - delta.x())
            self.verticalScrollBar().setValue(self.verticalScrollBar().value() - delta.y())
            event.accept()
            return
            
        super().mouseMoveEvent(event)
        
        # 更新状态栏当前鼠标的场景位置坐标
        scene_pos = self.mapToScene(event.position().toPoint())
        if hasattr(self.window(), "statusBar"):
            self.window().statusBar().showMessage(f" 坐标: X={int(scene_pos.x())}, Y={int(scene_pos.y())} | 缩放比率: {int(self.transform().m11() * 100)}% | 提示：按住鼠标中键或选中平移工具即可拖动平移。")

    def mouseReleaseEvent(self, event: QMouseEvent):
        """
        拖拽平移释放。
        """
        if event.button() == Qt.MiddleButton or (event.button() == Qt.LeftButton and self._is_panning):
            self._is_panning = False
            if self.current_tool == "pan":
                self.setCursor(Qt.OpenHandCursor)
            else:
                self.setCursor(Qt.ArrowCursor)
            event.accept()
            return
            
        super().mouseReleaseEvent(event)


class PySide6CanvasMainWindow(QMainWindow):
    """
    主窗体，包裹无限画布视图及顶部的图形操作控件、属性控制器及工具箱。
    """
    def __init__(self):
        super().__init__()
        self.setWindowTitle("PySide6 交互式无线画布应用程序")
        self.resize(1100, 750)
        
        # 初始化底层的图形场景，覆盖很大的坐标范围模拟无限大场景
        self.scene = QGraphicsScene(-50000, -50000, 100000, 100000)
        self.view = InfiniteCanvasView(self.scene, self)
        
        self.setup_ui()
        self.load_initial_elements()
        self.update_status()

    def setup_ui(self):
        # 1. 主容器采用水平布局：左侧控制区 & 右侧画布
        main_widget = QWidget()
        self.setCentralWidget(main_widget)
        main_layout = QHBoxLayout(main_widget)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)
        
        # 2. 侧边栏工具控制箱
        sidebar = QWidget()
        sidebar.setFixedWidth(240)
        sidebar.setStyleSheet("background-color: #1e293b; color: white;")
        sidebar_layout = QVBoxLayout(sidebar)
        sidebar_layout.setContentsMargins(15, 20, 15, 20)
        sidebar_layout.setSpacing(12)
        
        # 侧边栏标题
        title_label = QLabel("画布操作工具箱")
        title_label.setFont(QFont("Arial", 14, QFont.Bold))
        title_label.setStyleSheet("color: #38bdf8; margin-bottom: 10px;")
        sidebar_layout.addWidget(title_label)
        
        # 创建工具选择组
        self.tool_info = QLabel("当前工具: 选择与移动")
        self.tool_info.setStyleSheet("color: #94a3b8; font-size: 11px;")
        sidebar_layout.addWidget(self.tool_info)
        
        tools = [
            ("选择与移动", "select", "选择、拖动图元进行属性操控"),
            ("抓手平移画布", "pan", "拖拽左键移动无限画布视区"),
            ("添加矩形物件", "rect", "在画布中心区域生成互动矩形"),
            ("添加椭圆物件", "ellipse", "在画布中心区域生成互动椭圆"),
            ("添加文本标签", "text", "新建文本对象"),
            ("画一条连线", "line", "新建起始连线")
        ]
        
        for name, tool_id, desc in tools:
            btn = QPushButton(name)
            btn.setStyleSheet("""
                QPushButton {
                    background-color: #334155;
                    border: none;
                    color: #f8fafc;
                    padding: 8px 12px;
                    text-align: left;
                    border-radius: 4px;
                }
                QPushButton:hover {
                    background-color: #475569;
                }
                QPushButton:checked {
                    background-color: #0284c7;
                    font-weight: bold;
                }
            """)
            btn.setCheckable(True)
            if tool_id == "select":
                btn.setChecked(True)
            btn.clicked.connect(lambda checked, t=tool_id, n=name: self.set_active_tool(t, n))
            sidebar_layout.addWidget(btn)
            
            # 保存一下按钮引用，方便撤销选中
            if not hasattr(self, "tool_buttons"):
                self.tool_buttons = []
            self.tool_buttons.append((tool_id, btn))
            
        # 分割线
        line_separator = QWidget()
        line_separator.setFixedHeight(1)
        line_separator.setStyleSheet("background-color: #334155;")
        sidebar_layout.addWidget(line_separator)
        
        # 新增操作管理区
        action_label = QLabel("画布管理及属性")
        action_label.setFont(QFont("Arial", 11, QFont.Bold))
        action_label.setStyleSheet("color: #e2e8f0;")
        sidebar_layout.addWidget(action_label)
        
        # 清除按钮
        clear_btn = QPushButton("清空画布")
        clear_btn.setStyleSheet("background-color: #ef4444; color: white; border-radius: 4px; padding: 6px;")
        clear_btn.clicked.connect(self.clear_scene)
        sidebar_layout.addWidget(clear_btn)
        
        # 居中复位
        reset_btn = QPushButton("画布重置 & 居中")
        reset_btn.setStyleSheet("background-color: #10b981; color: white; border-radius: 4px; padding: 6px;")
        reset_btn.clicked.connect(self.reset_viewport)
        sidebar_layout.addWidget(reset_btn)
        
        # 加添弹性块
        sidebar_layout.addStretch()
        
        # 版本签名说明
        help_desc = QLabel("⚙️ 交互指南：\n- 滚轮: 原点聚焦缩放\n- 鼠标中键: 任意平移画布\n- 双击图元: 互动删除它\n- 鼠标左键: 自由拖拽选中")
        help_desc.setStyleSheet("color: #94a3b8; font-size: 11px; line-height: 15px;")
        sidebar_layout.addWidget(help_desc)
        
        main_layout.addWidget(sidebar)
        main_layout.addWidget(self.view)
        
        # 加载标准的 Qt 状态栏以便能够展现信息
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)

    def set_active_tool(self, tool_id, tool_name):
        # 激活工具更改
        self.view.current_tool = tool_id
        if tool_id == "pan":
            self.view.setCursor(Qt.OpenHandCursor)
        else:
            self.view.setCursor(Qt.ArrowCursor)
            
        self.tool_info.setText(f"当前工具: {tool_name}")
        
        # 互斥状态维护
        for tid, btn in self.tool_buttons:
            btn.setChecked(tid == tool_id)
            
        # 如果是添加物体的工具，触发一键快捷添加，并切回选择模式
        if tool_id in ["rect", "ellipse", "text", "line"]:
            self.add_shape_shortcut(tool_id)
            self.set_active_tool("select", "选择与移动")

    def add_shape_shortcut(self, shape_type):
        """
        根据选中的特殊交互直接在当前视图的可视中心添加拖动图元
        """
        center_pos = self.view.mapToScene(self.view.viewport().rect().center())
        cx, cy = center_pos.x(), center_pos.y()
        
        flags = QGraphicsItem.ItemIsMovable | QGraphicsItem.ItemIsSelectable | QGraphicsItem.ItemSendsGeometryChanges
        
        if shape_type == "rect":
            rect_item = QGraphicsRectItem(cx - 50, cy - 50, 100, 100)
            rect_item.setPen(QPen(QColor("#2563eb"), 2))
            rect_item.setBrush(QBrush(QColor(147, 197, 253, 100))) # 半透明蓝
            rect_item.setFlags(flags)
            self.scene.addItem(rect_item)
        elif shape_type == "ellipse":
            ellipse_item = QGraphicsEllipseItem(cx - 50, cy - 50, 100, 100)
            ellipse_item.setPen(QPen(QColor("#16a34a"), 2))
            ellipse_item.setBrush(QBrush(QColor(187, 247, 208, 100))) # 半透明绿
            ellipse_item.setFlags(flags)
            self.scene.addItem(ellipse_item)
        elif shape_type == "line":
            line_item = QGraphicsLineItem(cx - 50, cy - 50, cx + 50, cy + 50)
            line_item.setPen(QPen(QColor("#ea580c"), 3))
            line_item.setFlags(flags)
            self.scene.addItem(line_item)
        elif shape_type == "text":
            text, ok = QInputDialog.getText(self, "添加文本物件", "输入您想要放置的文本:")
            if ok and text:
                text_item = QGraphicsTextItem(text)
                text_item.setDefaultTextColor(QColor("#c026d3"))
                text_item.setFont(QFont("Arial", 16, QFont.Bold))
                text_item.setPos(cx - 30, cy - 15)
                text_item.setFlags(flags)
                self.scene.addItem(text_item)
                
        self.scene.update()

    def clear_scene(self):
        self.scene.clear()
        self.scene.update()
        self.statusBar().showMessage("画布已清空。", 2000)

    def reset_viewport(self):
        # 重置画布变换矩阵为1:1，并将视口定位到中心(0,0)坐标
        self.view.resetTransform()
        self.view.centerOn(0, 0)
        self.update_status()
        self.statusBar().showMessage("画布重置成功，已定位到中央！", 2000)

    def update_status(self):
        scale_percent = int(self.view.transform().m11() * 100)
        self.status_bar.showMessage(f" 坐标: X=0, Y=0 | 缩放比率: {scale_percent}% | 提示：按住鼠标中键或选中平移工具即可拖动平移。")

    def mouseDoubleClickEvent(self, event):
        """
        双击逻辑：如果双击了画布上的任何元素，自动快速将其删除作为交互删除演示。
        """
        clicked_item = self.view.itemAt(event.position().toPoint())
        if clicked_item:
            self.scene.removeItem(clicked_item)
            self.statusBar().showMessage("已删除双击选择的图元物件", 2000)
            event.accept()
        else:
            super().mouseDoubleClickEvent(event)

    def load_initial_elements(self):
        """
        在画布下预先烘焙和加载导出的互动图形，包含所有用户在 React 设计器中绘制过的图形对象！
        """
        flags = QGraphicsItem.ItemIsMovable | QGraphicsItem.ItemIsSelectable | QGraphicsItem.ItemSendsGeometryChanges
        
${shapesCode || `        # 预设初始样例
        # 1. 蓝色高档矩形
        rect = QGraphicsRectItem(-120, -120, 150, 100)
        rect.setPen(QPen(QColor(37, 99, 235), 2))
        rect.setBrush(QBrush(QColor(147, 197, 253, 100)))
        rect.setFlags(flags)
        self.scene.addItem(rect)
        
        # 2. 橙色圆形
        circle = QGraphicsEllipseItem(50, -50, 120, 120)
        circle.setPen(QPen(QColor(234, 88, 12), 2))
        circle.setBrush(QBrush(QColor(253, 186, 116, 120)))
        circle.setFlags(flags)
        self.scene.addItem(circle)
        
        # 3. 紫色标题标签
        text = QGraphicsTextItem("欢迎使用无线画布")
        text.setDefaultTextColor(QColor("#7c3aed"))
        text.setFont(QFont("Arial", 18, QFont.Bold))
        text.setPos(-100, -220)
        text.setFlags(flags)
        self.scene.addItem(text)`}


if __name__ == "__main__":
    app = QApplication(sys.argv)
    
    # 设置软件整体现代扁平化夜阑配色风格样式表
    app.setStyleSheet(\"""
        QMainWindow {
            background-color: #f1f5f9;
        }
        QStatusBar {
            background-color: #f8fafc;
            color: #475569;
            font-size: 11px;
            border-top: 1px solid #e2e8f0;
        }
    \""")
    
    window = PySide6CanvasMainWindow()
    window.show()
    sys.exit(app.exec())
`;
}
