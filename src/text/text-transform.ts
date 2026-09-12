/**
 * Text Transform Module - TypeScript chuẩn
 * Xử lý hit-testing, drag di chuyển, resize cỡ chữ, xoay và chỉnh sửa chữ in-place trên canvas
 */

import { Layer, LayerManager } from "../core/layer";
import { eventBus } from "../core/event-bus";
import { ColorModule } from "../modules/color";

export interface TextBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  textWidth: number;
  x0: number;
  resizeHandleX: number;
  resizeHandleY: number;
  resizeHandleSize: number;
}

export interface TextEditingOptions {
  deleteBackward?: boolean;
  deleteForward?: boolean;
  insertText?: string;
}

export class TextTransform {
  canvas: HTMLCanvasElement;
  layerManager: LayerManager;
  isDragging = false;
  isResizing = false;
  isEditing = false;
  selectedLayer: Layer | null = null;
  dragStartX = 0;
  dragStartY = 0;
  textStartX = 0;
  textStartY = 0;
  resizeStartY = 0;
  textStartSize = 0;
  cursorMode: "default" | "move" | "ns-resize" = "default";
  editorEl: HTMLTextAreaElement | null = null;
  editingLayer: Layer | null = null;
  editingOriginalText = "";

  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;
  private boundMouseLeave: (e: MouseEvent) => void;
  private boundDoubleClick: (e: MouseEvent) => void;
  private boundKeyDown: (e: KeyboardEvent) => void;
  private unsubscribers: Array<() => void> = [];

  constructor(canvas: HTMLCanvasElement, layerManager: LayerManager) {
    this.canvas = canvas;
    this.layerManager = layerManager;

    this.boundMouseDown = this.handleMouseDown.bind(this);
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);
    this.boundMouseLeave = this.handleMouseLeave.bind(this);
    this.boundDoubleClick = this.handleDoubleClick.bind(this);
    this.boundKeyDown = this.handleKeyDown.bind(this);

    this.initEventListeners();
    this.initEventBus();

    // Đồng bộ vào window để tương thích ngược nếu các script cũ cần truy cập
    (window as unknown as { textTransform?: TextTransform }).textTransform = this;
  }

  /**
   * Khởi tạo event listeners cho canvas và bàn phím
   */
  initEventListeners(): void {
    this.canvas.addEventListener("mousedown", this.boundMouseDown);
    this.canvas.addEventListener("mousemove", this.boundMouseMove);
    this.canvas.addEventListener("mouseup", this.boundMouseUp);
    this.canvas.addEventListener("mouseleave", this.boundMouseLeave);
    this.canvas.addEventListener("dblclick", this.boundDoubleClick);
    document.addEventListener("keydown", this.boundKeyDown);
  }

  /**
   * Đăng ký nhận sự kiện qua eventBus
   */
  private initEventBus(): void {
    const unsubSelect = eventBus.on<Layer>("layer:selected", (layer) => {
      if (layer && layer.type === "text") {
        this.selectedLayer = layer;
      } else {
        this.selectedLayer = null;
      }
    });

    const unsubRedraw = eventBus.on<Layer>("text:redraw", (layer) => {
      if (layer) {
        this.redrawTextLayer(layer);
        this.layerManager.render();
        if (this.selectedLayer?.id === layer.id) {
          this.drawSelectionOverlay(layer);
        }
      }
    });

    this.unsubscribers.push(unsubSelect, unsubRedraw);
  }

  destroy(): void {
    this.canvas.removeEventListener("mousedown", this.boundMouseDown);
    this.canvas.removeEventListener("mousemove", this.boundMouseMove);
    this.canvas.removeEventListener("mouseup", this.boundMouseUp);
    this.canvas.removeEventListener("mouseleave", this.boundMouseLeave);
    this.canvas.removeEventListener("dblclick", this.boundDoubleClick);
    document.removeEventListener("keydown", this.boundKeyDown);
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
  }

  /**
   * Lấy vị trí chuột trên canvas đã bù trừ scale
   */
  getMousePos(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  /**
   * Tính toán bounding box của text layer (hỗ trợ curved text, padding, align)
   */
  getTextBounds(layer: Layer | null): TextBounds | null {
    if (
      !layer ||
      layer.type !== "text" ||
      layer.text === null ||
      layer.text === undefined
    ) {
      return null;
    }

    const ctx = layer.ctx;
    const weight = layer.fontWeight || "normal";
    const style = layer.fontStyle || "normal";
    ctx.font = `${style} ${weight} ${layer.fontSize}px ${layer.fontFamily}`;

    const lines = String(layer.text).split("\n");
    const widths = lines.map((line) => ctx.measureText(line).width);
    const width = Math.max(10, ...widths);
    const lineHeight = Math.round(layer.fontSize * 1.2);

    // Khoảng trống phía dưới baseline cho đuôi chữ (g, p, q, y) và gạch chân
    const extraBottom = Math.round(layer.fontSize * 0.35);

    // Curve sagitta: khoảng trống cho text cong
    // curveHorzPad: phần đầu chữ (fontSize cao) xoay góc halfAngle sẽ nhô ngang
    let curveSagitta = 0;
    let curveHorzPad = 0;
    if (layer.curveBend && layer.curveBend !== 0) {
      const bendAbs = Math.abs(layer.curveBend);
      const halfAngleRad = ((bendAbs * 1.8) / 2) * (Math.PI / 180);
      if (halfAngleRad > 0.01 && width > 1) {
        const R = Math.max(width, 1) / 2 / Math.sin(halfAngleRad);
        curveSagitta = R * (1 - Math.cos(halfAngleRad));
        curveHorzPad =
          layer.fontSize * Math.sin(Math.min(halfAngleRad, Math.PI / 2));
      }
    }

    const height = Math.max(
      layer.fontSize,
      (Math.max(1, lines.length) - 1) * lineHeight +
        layer.fontSize +
        extraBottom +
        curveSagitta
    );

    const pLeft = layer.paddingLeft || 0;
    const pRight = layer.paddingRight || 0;

    let x0 = layer.x;
    if (layer.textAlign === "center") {
      x0 = layer.x - width / 2;
    } else if (layer.textAlign === "right") {
      x0 = layer.x - width;
    }

    const boundsX = x0 - pLeft - curveHorzPad;
    const boundsWidth = Math.max(1, width + pLeft + pRight + 2 * curveHorzPad);
    const bottomBaselineY =
      layer.y + Math.max(0, lines.length - 1) * lineHeight + extraBottom;

    // Dịch top lên nếu curve hướng lên (bend > 0)
    const topShift = layer.curveBend && layer.curveBend > 0 ? curveSagitta : 0;

    return {
      x: boundsX,
      y: layer.y - layer.fontSize - topShift,
      width: boundsWidth,
      height: height + topShift,
      textWidth: width,
      x0,
      resizeHandleX: boundsX + boundsWidth,
      resizeHandleY: bottomBaselineY,
      resizeHandleSize: 12,
    };
  }

  /**
   * Kiểm tra tọa độ chuột có nằm trong vùng bounding box không
   */
  isPointInText(x: number, y: number, bounds: TextBounds | null): boolean {
    if (!bounds) return false;
    return (
      x >= bounds.x &&
      x <= bounds.x + bounds.width &&
      y >= bounds.y &&
      y <= bounds.y + bounds.height
    );
  }

  /**
   * Kiểm tra tọa độ chuột có nằm trong nút kéo resize handle không
   */
  isPointInResizeHandle(
    x: number,
    y: number,
    bounds: TextBounds | null
  ): boolean {
    if (!bounds) return false;
    const handleX = bounds.resizeHandleX;
    const handleY = bounds.resizeHandleY;
    const size = bounds.resizeHandleSize;

    return (
      x >= handleX - size &&
      x <= handleX + size &&
      y >= handleY - size &&
      y <= handleY + size
    );
  }

  /**
   * Tìm text layer tại vị trí chuột (duyệt zIndex từ trên xuống)
   */
  findTextLayerAt(
    x: number,
    y: number
  ): { layer: Layer; bounds: TextBounds } | null {
    const layers = [...this.layerManager.layers]
      .filter((l) => l.type === "text" && l.visible && !l.locked)
      .sort((a, b) => b.zIndex - a.zIndex);

    for (const layer of layers) {
      const bounds = this.getTextBounds(layer);
      if (bounds && this.isPointInText(x, y, bounds)) {
        return { layer, bounds };
      }
    }

    return null;
  }

  /**
   * Xử lý sự kiện mousedown
   */
  handleMouseDown(e: MouseEvent): void {
    if (this.isEditing) return;
    const pos = this.getMousePos(e);
    const result = this.findTextLayerAt(pos.x, pos.y);

    if (result) {
      const { layer, bounds } = result;

      if (this.isPointInResizeHandle(pos.x, pos.y, bounds)) {
        this.isResizing = true;
        this.selectedLayer = layer;
        this.resizeStartY = pos.y;
        this.textStartSize = layer.fontSize;
        this.canvas.style.cursor = "ns-resize";
      } else {
        this.isDragging = true;
        this.selectedLayer = layer;
        this.dragStartX = pos.x;
        this.dragStartY = pos.y;
        this.textStartX = layer.x;
        this.textStartY = layer.y;
        this.canvas.style.cursor = "move";
      }

      this.layerManager.setActiveLayer(layer.id);
      eventBus.emit("text:selected", layer);
      eventBus.emit("text:show-properties");

      const textSection = document.querySelector(
        '.sidebar-section[data-section="text"]'
      );
      if (textSection) {
        document
          .querySelectorAll(".sidebar-section")
          .forEach((s) => s.classList.remove("active"));
        textSection.classList.add("active");
      }
      const subSidebar = document.getElementById("sub-sidebar");
      const body = document.getElementById("body");
      if (subSidebar) subSidebar.classList.remove("hidden");
      if (body) body.classList.add("sub-open");
    } else {
      this.selectedLayer = null;
      this.layerManager.setActiveLayer(0);
      this.canvas.style.cursor = "default";
      this.layerManager.render();
      eventBus.emit("text:deselected");
      eventBus.emit("text:hide-properties");
    }
  }

  /**
   * Xử lý sự kiện mousemove
   */
  handleMouseMove(e: MouseEvent): void {
    if (this.isEditing) return;
    const pos = this.getMousePos(e);

    if (this.isDragging && this.selectedLayer) {
      const dx = pos.x - this.dragStartX;
      const dy = pos.y - this.dragStartY;

      this.selectedLayer.x = this.textStartX + dx;
      this.selectedLayer.y = this.textStartY + dy;

      this.redrawTextLayer(this.selectedLayer);
      this.layerManager.render();
      this.drawSelectionOverlay(this.selectedLayer);
      eventBus.emit("text:moved", {
        layer: this.selectedLayer,
        x: this.selectedLayer.x,
        y: this.selectedLayer.y,
      });
    } else if (this.isResizing && this.selectedLayer) {
      const dy = pos.y - this.resizeStartY;
      const newSize = Math.max(10, this.textStartSize + dy);

      this.selectedLayer.fontSize = Math.round(newSize);

      const sizeDisplay = document.getElementById("size-value-display");
      const sizeSlider = document.getElementById("size-slider") as HTMLInputElement | null;
      if (sizeDisplay) sizeDisplay.textContent = String(Math.round(newSize));
      if (sizeSlider) {
        sizeSlider.value = String(
          Math.min(Math.max(Math.round(newSize), 2), 300)
        );
      }

      this.redrawTextLayer(this.selectedLayer);
      this.layerManager.render();
      this.drawSelectionOverlay(this.selectedLayer);
      eventBus.emit("text:size-changed", {
        layer: this.selectedLayer,
        fontSize: this.selectedLayer.fontSize,
      });
    } else {
      const result = this.findTextLayerAt(pos.x, pos.y);

      if (result) {
        const { layer, bounds } = result;

        if (this.selectedLayer && layer.id === this.selectedLayer.id) {
          this.layerManager.render();
          this.drawSelectionOverlay(this.selectedLayer);
        }

        if (this.isPointInResizeHandle(pos.x, pos.y, bounds)) {
          this.canvas.style.cursor = "ns-resize";
        } else {
          this.canvas.style.cursor = "move";
        }
      } else {
        this.canvas.style.cursor = "default";

        if (this.selectedLayer) {
          this.layerManager.render();
          this.drawSelectionOverlay(this.selectedLayer);
        }
      }
    }
  }

  /**
   * Xử lý sự kiện mouseup
   */
  handleMouseUp(e: MouseEvent): void {
    if (this.isEditing) return;
    if (this.isDragging || this.isResizing) {
      this.isDragging = false;
      this.isResizing = false;

      this.layerManager.render();
      if (this.selectedLayer) {
        this.drawSelectionOverlay(this.selectedLayer);
      }

      const pos = this.getMousePos(e);
      const result = this.findTextLayerAt(pos.x, pos.y);

      if (result) {
        const { bounds } = result;
        if (this.isPointInResizeHandle(pos.x, pos.y, bounds)) {
          this.canvas.style.cursor = "ns-resize";
        } else {
          this.canvas.style.cursor = "move";
        }
      } else {
        this.canvas.style.cursor = "default";
      }
    }
  }

  /**
   * Xử lý sự kiện mouseleave
   */
  handleMouseLeave(e: MouseEvent): void {
    this.handleMouseUp(e);
  }

  /**
   * Xử lý phím tắt khi đang chọn text layer
   */
  handleKeyDown(e: KeyboardEvent): void {
    if (this.isEditing) return;
    if (!this.selectedLayer || this.selectedLayer.type !== "text") return;
    if (!this.selectedLayer.visible || this.selectedLayer.locked) return;

    const active = document.activeElement;
    const tag = active ? active.tagName : "";
    if (
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      (active && (active as HTMLElement).isContentEditable)
    ) {
      return;
    }

    if (e.key === "Backspace") {
      e.preventDefault();
      this.startTextEditing(this.selectedLayer, { deleteBackward: true });
      return;
    }

    if (e.key === "Delete") {
      e.preventDefault();
      const layerId = this.selectedLayer.id;
      if (layerId !== 0) {
        this.selectedLayer = null;
        this.layerManager.deleteLayer(layerId);
        this.layerManager.render();
        const hasTextLayers = this.layerManager.layers.some(
          (l) => l.type === "text"
        );
        if (!hasTextLayers) {
          eventBus.emit("text:hide-properties");
        }
      }
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      this.startTextEditing(this.selectedLayer, { insertText: "\n" });
      return;
    }

    if (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      this.startTextEditing(this.selectedLayer, { insertText: e.key });
    }
  }

  /**
   * Nhấp đúp chuột để kích hoạt chế độ chỉnh sửa chữ
   */
  handleDoubleClick(e: MouseEvent): void {
    const pos = this.getMousePos(e);
    const result = this.findTextLayerAt(pos.x, pos.y);
    if (!result) return;
    const { layer } = result;
    if (layer.locked || !layer.visible) return;

    this.layerManager.setActiveLayer(layer.id);
    this.selectedLayer = layer;
    this.layerManager.render();
    this.drawSelectionOverlay(layer);
    this.startTextEditing(layer);
  }

  /**
   * Vẽ lại toàn bộ nội dung của text layer lên canvas riêng của layer đó
   */
  redrawTextLayer(layer: Layer | null): void {
    if (!layer || layer.type !== "text") return;

    layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);

    const weight = layer.fontWeight || "normal";
    const style = layer.fontStyle || "normal";
    layer.ctx.font = `${style} ${weight} ${layer.fontSize}px ${layer.fontFamily}`;

    const bounds = this.getTextBounds(layer);
    let isPatternFill = false;
    let textPattern: CanvasPattern | null = null;

    // Ưu tiên Texture hơn Color
    if (layer.textureImage && bounds) {
      const img = layer.textureImage;
      const scale =
        layer.textureScale !== undefined ? layer.textureScale : 1.0;

      const targetW = Math.max(1, Math.round(bounds.width * scale));
      const targetH = Math.max(1, Math.round(bounds.height * scale));

      // Dùng cache: chỉ vẽ lại offscreen canvas khi ảnh/scale/kích thước thay đổi
      if (
        !layer._textureCacheCanvas ||
        layer._textureCacheImg !== img ||
        layer._textureCacheScale !== scale ||
        layer._textureCacheW !== targetW ||
        layer._textureCacheH !== targetH
      ) {
        if (!layer._textureCacheCanvas) {
          layer._textureCacheCanvas = document.createElement("canvas");
        }
        layer._textureCacheCanvas.width = targetW;
        layer._textureCacheCanvas.height = targetH;
        const offCtx = layer._textureCacheCanvas.getContext("2d");
        if (offCtx) {
          offCtx.drawImage(img, 0, 0, targetW, targetH);
        }
        layer._textureCacheImg = img;
        layer._textureCacheScale = scale;
        layer._textureCacheW = targetW;
        layer._textureCacheH = targetH;
      }

      const repeatMode = scale < 1.0 ? "repeat" : "no-repeat";
      textPattern = layer.ctx.createPattern(layer._textureCacheCanvas, repeatMode);

      if (textPattern && typeof DOMMatrix !== "undefined") {
        const matrix = new DOMMatrix().translate(bounds.x, bounds.y);
        textPattern.setTransform(matrix);
      }
      isPatternFill = true;
    } else if (
      typeof layer.fontColor === "object" &&
      layer.fontColor !== null
    ) {
      const fillObj = layer.fontColor;
      const isMesh =
        fillObj.kind === "custom" &&
        fillObj.data &&
        (fillObj.data.type === "radial" || fillObj.data.type === "mesh");

      if (isMesh) {
        textPattern = ColorModule.createMeshPatternForBounds(
          layer.ctx,
          bounds,
          fillObj
        );
        isPatternFill = true;
      } else {
        const gradFill = ColorModule.createGradientFillForCtx(
          layer.ctx,
          bounds,
          fillObj
        );
        layer.ctx.fillStyle = gradFill || "#000000";
      }
    } else {
      layer.ctx.fillStyle = layer.fontColor || "#000000";
    }

    if (isPatternFill && textPattern) {
      layer.ctx.fillStyle = textPattern;
    }

    layer.ctx.textAlign = layer.textAlign;

    let drawX = layer.x;
    const pLeft = layer.paddingLeft || 0;
    const pRight = layer.paddingRight || 0;

    drawX += pLeft - pRight;

    // Kiểm tra và giữ chữ ở mép Bounding Box nếu bên kia còn không gian
    const curveBendCheck = layer.curveBend || 0;
    if (bounds && curveBendCheck === 0) {
      const textW = bounds.textWidth;
      let textLeft = drawX;
      if (layer.textAlign === "center") textLeft = drawX - textW / 2;
      else if (layer.textAlign === "right") textLeft = drawX - textW;

      const textRight = textLeft + textW;
      const boxLeft = bounds.x;
      const boxRight = bounds.x + bounds.width;

      if (textRight > boxRight && textLeft > boxLeft) {
        const overflowR = textRight - boxRight;
        const availableL = textLeft - boxLeft;
        const shift = Math.min(overflowR, availableL);
        drawX -= shift;
      } else if (textLeft < boxLeft && textRight < boxRight) {
        const overflowL = boxLeft - textLeft;
        const availableR = boxRight - textRight;
        const shift = Math.min(overflowL, availableR);
        drawX += shift;
      }
    }

    const lines = String(layer.text ?? "").split("\n");
    const lineHeight = Math.round(layer.fontSize * 1.2);

    if (bounds) {
      layer.ctx.save();
      layer.ctx.beginPath();
      layer.ctx.rect(
        bounds.x,
        bounds.y,
        Math.max(0, bounds.width),
        Math.max(0, bounds.height)
      );
      layer.ctx.clip();
    }

    for (let i = 0; i < lines.length; i++) {
      const lineY = layer.y + i * lineHeight;
      const lineText = lines[i];
      if (!lineText) continue;

      const bend = layer.curveBend || 0;

      if (bend !== 0) {
        // Curved text: đặt từng ký tự dọc theo cung tròn
        const totalAngleDeg = bend * 1.8;
        const totalAngleRad = (totalAngleDeg * Math.PI) / 180;
        const halfAngle = Math.abs(totalAngleRad) / 2;
        const sign = bend >= 0 ? 1 : -1;

        const chars = [...lineText];
        const charWidths = chars.map((c) => layer.ctx.measureText(c).width);
        const lineTotalWidth = charWidths.reduce((a, b) => a + b, 0);

        if (lineTotalWidth > 1 && halfAngle > 0.001) {
          const R = lineTotalWidth / 2 / Math.sin(halfAngle);
          const cosHalf = Math.cos(halfAngle);

          let lineLeft = drawX;
          if (layer.textAlign === "center") {
            lineLeft = drawX - lineTotalWidth / 2;
          } else if (layer.textAlign === "right") {
            lineLeft = drawX - lineTotalWidth;
          }

          let cumX = 0;
          for (let j = 0; j < chars.length; j++) {
            const ch = chars[j];
            const cw = charWidths[j];
            if (cw < 0.1) {
              cumX += cw;
              continue;
            }

            const charCenter = cumX + cw / 2;
            const dx = charCenter - lineTotalWidth / 2;
            cumX += cw;

            const theta = Math.asin(dx / R);
            const px = lineLeft + lineTotalWidth / 2 + dx;
            const py = lineY - sign * R * (Math.cos(theta) - cosHalf);

            layer.ctx.save();
            layer.ctx.translate(px, py);
            layer.ctx.rotate(sign * theta);
            layer.ctx.fillText(ch, -cw / 2, 0);
            layer.ctx.restore();
          }

          // Trang trí cho curved text dọc theo cung tròn
          const dec =
            layer.textDecoration || (layer.underline ? "underline" : "none");
          if (dec !== "none") {
            const textWidth = lineTotalWidth;
            const fontSize = layer.fontSize;
            const strokeWidth = Math.max(1, Math.round(fontSize * 0.06));
            const underlineOff = Math.round(fontSize * 0.15);
            const strikeOff = Math.round(fontSize * -0.3);

            layer.ctx.save();
            layer.ctx.strokeStyle = layer.ctx.fillStyle;
            layer.ctx.lineWidth = strokeWidth;

            let decOffset = underlineOff;
            if (dec === "strikethrough") decOffset = strikeOff;

            if (dec === "dashed-underline") {
              const dashLen = Math.max(3, Math.round(fontSize * 0.15));
              layer.ctx.setLineDash([dashLen, dashLen]);
            }

            let cumDx = 0;
            for (let j = 0; j < chars.length; j++) {
              const cw = charWidths[j];
              const charCenter = cumDx + cw / 2;
              const dx = charCenter - textWidth / 2;
              cumDx += cw;

              if (cw < 0.1) continue;

              const theta = Math.asin(dx / R);
              const tangentAngle = -sign * theta;

              if (dec === "dotted-underline") {
                const dotRadius = Math.max(1.5, Math.round(fontSize * 0.04));
                const dotStep = dotRadius * 3;
                for (let ddx = -cw / 2 + 1; ddx < cw / 2; ddx += dotStep) {
                  const dTheta = Math.asin((dx + ddx) / R);
                  const dPx = lineLeft + lineTotalWidth / 2 + dx + ddx;
                  const dPy =
                    lineY -
                    sign * R * (Math.cos(dTheta) - cosHalf) +
                    underlineOff * Math.cos(tangentAngle);
                  layer.ctx.beginPath();
                  layer.ctx.arc(dPx, dPy, dotRadius, 0, Math.PI * 2);
                  layer.ctx.fill();
                }
              } else if (dec === "double-underline" || dec === "underline") {
                const segStart = -cw / 2;
                const segEnd = cw / 2;
                const sTheta = Math.asin((dx + segStart) / R);
                const eTheta = Math.asin((dx + segEnd) / R);
                const off =
                  dec === "double-underline"
                    ? Math.max(2, Math.round(fontSize * 0.08))
                    : 0;

                const sPx = lineLeft + lineTotalWidth / 2 + dx + segStart;
                const ePx = lineLeft + lineTotalWidth / 2 + dx + segEnd;
                const sPy =
                  lineY -
                  sign * R * (Math.cos(sTheta) - cosHalf) +
                  (underlineOff - off / 2) * Math.cos(tangentAngle);
                const ePy =
                  lineY -
                  sign * R * (Math.cos(eTheta) - cosHalf) +
                  (underlineOff - off / 2) * Math.cos(tangentAngle);

                layer.ctx.beginPath();
                layer.ctx.moveTo(sPx, sPy);
                layer.ctx.lineTo(ePx, ePy);
                layer.ctx.stroke();

                if (off > 0) {
                  const sPy2 =
                    lineY -
                    sign * R * (Math.cos(sTheta) - cosHalf) +
                    (underlineOff + off / 2) * Math.cos(tangentAngle);
                  const ePy2 =
                    lineY -
                    sign * R * (Math.cos(eTheta) - cosHalf) +
                    (underlineOff + off / 2) * Math.cos(tangentAngle);
                  layer.ctx.beginPath();
                  layer.ctx.moveTo(sPx, sPy2);
                  layer.ctx.lineTo(ePx, ePy2);
                  layer.ctx.stroke();
                }
              } else if (dec === "strikethrough") {
                const sTheta2 = Math.asin((dx - cw / 2) / R);
                const eTheta2 = Math.asin((dx + cw / 2) / R);
                const sPx = lineLeft + lineTotalWidth / 2 + dx - cw / 2;
                const ePx = lineLeft + lineTotalWidth / 2 + dx + cw / 2;
                const sPy =
                  lineY -
                  sign * R * (Math.cos(sTheta2) - cosHalf) +
                  strikeOff * Math.cos(tangentAngle);
                const ePy =
                  lineY -
                  sign * R * (Math.cos(eTheta2) - cosHalf) +
                  strikeOff * Math.cos(tangentAngle);
                layer.ctx.beginPath();
                layer.ctx.moveTo(sPx, sPy);
                layer.ctx.lineTo(ePx, ePy);
                layer.ctx.stroke();
              } else {
                const sTheta2 = Math.asin((dx - cw / 2) / R);
                const eTheta2 = Math.asin((dx + cw / 2) / R);
                const sPx = lineLeft + lineTotalWidth / 2 + dx - cw / 2;
                const ePx = lineLeft + lineTotalWidth / 2 + dx + cw / 2;
                const sPy =
                  lineY -
                  sign * R * (Math.cos(sTheta2) - cosHalf) +
                  decOffset * Math.cos(tangentAngle);
                const ePy =
                  lineY -
                  sign * R * (Math.cos(eTheta2) - cosHalf) +
                  decOffset * Math.cos(tangentAngle);
                layer.ctx.beginPath();
                layer.ctx.moveTo(sPx, sPy);
                layer.ctx.lineTo(ePx, ePy);
                layer.ctx.stroke();
              }
            }

            layer.ctx.restore();
          }
        } else {
          layer.ctx.fillText(lineText, drawX, lineY);
        }
      } else {
        // Normal straight text
        layer.ctx.fillText(lineText, drawX, lineY);

        const dec =
          layer.textDecoration || (layer.underline ? "underline" : "none");
        if (dec !== "none" && lineText) {
          const textWidth = layer.ctx.measureText(lineText).width;
          let startX = drawX;
          if (layer.textAlign === "center") {
            startX = drawX - textWidth / 2;
          } else if (layer.textAlign === "right") {
            startX = drawX - textWidth;
          }

          const fontSize = layer.fontSize;
          const strokeWidth = Math.max(1, Math.round(fontSize * 0.06));
          const underlineY = lineY + Math.round(fontSize * 0.15);
          const strikeY = lineY - Math.round(fontSize * 0.3);

          layer.ctx.save();
          layer.ctx.strokeStyle = layer.ctx.fillStyle;
          layer.ctx.lineWidth = strokeWidth;

          if (dec === "underline") {
            layer.ctx.beginPath();
            layer.ctx.moveTo(startX, underlineY);
            layer.ctx.lineTo(startX + textWidth, underlineY);
            layer.ctx.stroke();
          } else if (dec === "double-underline") {
            const offset = Math.max(2, Math.round(fontSize * 0.08));
            layer.ctx.beginPath();
            layer.ctx.moveTo(startX, underlineY - offset / 2);
            layer.ctx.lineTo(startX + textWidth, underlineY - offset / 2);
            layer.ctx.moveTo(startX, underlineY + offset / 2);
            layer.ctx.lineTo(startX + textWidth, underlineY + offset / 2);
            layer.ctx.stroke();
          } else if (dec === "strikethrough") {
            layer.ctx.beginPath();
            layer.ctx.moveTo(startX, strikeY);
            layer.ctx.lineTo(startX + textWidth, strikeY);
            layer.ctx.stroke();
          } else if (dec === "dashed-underline") {
            const dashLen = Math.max(3, Math.round(fontSize * 0.15));
            layer.ctx.setLineDash([dashLen, dashLen]);
            layer.ctx.beginPath();
            layer.ctx.moveTo(startX, underlineY);
            layer.ctx.lineTo(startX + textWidth, underlineY);
            layer.ctx.stroke();
          } else if (dec === "dotted-underline") {
            const dotRadius = Math.max(1.5, Math.round(fontSize * 0.04));
            const step = dotRadius * 3;
            layer.ctx.fillStyle = layer.ctx.strokeStyle;
            for (let x = startX; x <= startX + textWidth; x += step) {
              layer.ctx.beginPath();
              layer.ctx.arc(x, underlineY, dotRadius, 0, Math.PI * 2);
              layer.ctx.fill();
            }
          } else if (dec === "wavy-underline") {
            const wavelength = Math.max(4, Math.round(fontSize * 0.15));
            const amplitude = Math.max(1.5, Math.round(fontSize * 0.05));
            layer.ctx.beginPath();
            let x = startX;
            layer.ctx.moveTo(x, underlineY);
            while (x < startX + textWidth) {
              layer.ctx.quadraticCurveTo(
                x + wavelength / 4,
                underlineY - amplitude,
                x + wavelength / 2,
                underlineY
              );
              layer.ctx.quadraticCurveTo(
                x + (3 * wavelength) / 4,
                underlineY + amplitude,
                x + wavelength,
                underlineY
              );
              x += wavelength;
            }
            layer.ctx.stroke();
          }

          layer.ctx.restore();
        }
      }
    }

    if (bounds) {
      layer.ctx.restore();
    }
  }

  /**
   * Vẽ khung chọn (selection overlay) và resize handle lên canvas chính
   */
  drawSelectionOverlay(layer: Layer | null): void {
    if (!layer) return;

    const bounds = this.getTextBounds(layer);
    if (!bounds) return;

    const ctx = this.layerManager.mainCtx;

    ctx.save();

    if (layer.rotation) {
      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    ctx.strokeStyle = "#00f260";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      bounds.x - 10,
      bounds.y - 10,
      bounds.width + 20,
      bounds.height + 20
    );
    ctx.setLineDash([]);

    const handleSize = bounds.resizeHandleSize;
    ctx.fillStyle = "#00f260";
    ctx.fillRect(
      bounds.resizeHandleX - handleSize / 2,
      bounds.resizeHandleY - handleSize / 2,
      handleSize,
      handleSize
    );

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      bounds.resizeHandleX - handleSize / 2,
      bounds.resizeHandleY - handleSize / 2,
      handleSize,
      handleSize
    );

    ctx.restore();
  }

  /**
   * Bắt đầu chế độ chỉnh sửa chữ bằng textarea overlay
   */
  startTextEditing(layer: Layer | null, options: TextEditingOptions = {}): void {
    if (!layer || layer.type !== "text") return;
    if (layer.locked || !layer.visible) return;

    if (this.isEditing) {
      this.commitTextEditing();
    }

    const bounds = this.getTextBounds(layer);
    if (!bounds) return;

    const canvasArea = document.getElementById("canvas-area");
    if (!canvasArea) return;

    const editor = document.createElement("textarea");
    editor.className = "canvas-text-editor";
    const prevText = String(layer.text ?? "");
    let initialText = prevText;
    if (options.deleteBackward) {
      initialText = prevText.slice(0, Math.max(0, prevText.length - 1));
    } else if (options.deleteForward) {
      initialText = prevText.slice(1);
    }
    if (options.insertText) {
      initialText = initialText + String(options.insertText);
    }
    editor.value = initialText;
    editor.setAttribute("spellcheck", "false");
    editor.rows = 1;

    editor.addEventListener("mousedown", (ev) => ev.stopPropagation());
    editor.addEventListener("dblclick", (ev) => ev.stopPropagation());
    editor.addEventListener("click", (ev) => ev.stopPropagation());

    editor.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") {
        ev.preventDefault();
        this.cancelTextEditing();
        return;
      }
      if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") {
        ev.preventDefault();
        this.commitTextEditing();
      }
    });

    editor.addEventListener("input", () => {
      this.positionEditorForLayer(layer, editor);
      this.autosizeEditor(editor);
    });

    editor.addEventListener("blur", () => {
      this.commitTextEditing();
    });

    canvasArea.appendChild(editor);

    this.isEditing = true;
    this.editorEl = editor;
    this.editingLayer = layer;
    this.editingOriginalText = String(layer.text ?? "");

    layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
    this.layerManager.render();
    this.drawSelectionOverlay(layer);

    this.positionEditorForLayer(layer, editor);
    this.autosizeEditor(editor);

    setTimeout(() => {
      editor.focus();
      editor.setSelectionRange(editor.value.length, editor.value.length);
    }, 0);
  }

  /**
   * Lưu lại nội dung text đã sửa từ textarea overlay vào layer
   */
  commitTextEditing(): void {
    if (!this.isEditing || !this.editorEl || !this.editingLayer) return;
    const newText = String(this.editorEl.value ?? "");
    const layerIdToCommit = this.editingLayer.id;
    const shouldDeleteLayer = newText.trim().length === 0;

    if (shouldDeleteLayer) {
      this.removeEditor();
      if (this.selectedLayer && this.selectedLayer.id === layerIdToCommit) {
        this.selectedLayer = null;
      }
      this.layerManager.deleteLayer(layerIdToCommit);
      this.layerManager.render();

      const hasTextLayers = this.layerManager.layers.some(
        (l) => l.type === "text"
      );
      if (!hasTextLayers) {
        eventBus.emit("text:hide-properties");
      }
      return;
    }

    this.editingLayer.text = newText;

    const safeName = newText.replace(/\s+/g, " ").trim();
    const newName =
      safeName.length > 20
        ? safeName.substring(0, 20) + "..."
        : safeName || "Text";
    this.editingLayer.name = newName;

    this.redrawTextLayer(this.editingLayer);
    this.layerManager.render();
    this.drawSelectionOverlay(this.editingLayer);
    eventBus.emit("layer:changed", this.layerManager.getLayersList());
    eventBus.emit("text:edited", {
      layer: this.editingLayer,
      text: newText,
    });

    this.removeEditor();
  }

  /**
   * Hủy bỏ chỉnh sửa, khôi phục nội dung text ban đầu
   */
  cancelTextEditing(): void {
    if (!this.isEditing || !this.editorEl || !this.editingLayer) return;
    this.editingLayer.text = this.editingOriginalText;
    this.redrawTextLayer(this.editingLayer);
    this.layerManager.render();
    this.drawSelectionOverlay(this.editingLayer);
    this.removeEditor();
  }

  /**
   * Xóa thẻ textarea overlay khỏi DOM
   */
  removeEditor(): void {
    if (this.editorEl && this.editorEl.parentNode) {
      this.editorEl.parentNode.removeChild(this.editorEl);
    }
    this.editorEl = null;
    this.editingLayer = null;
    this.editingOriginalText = "";
    this.isEditing = false;
  }

  /**
   * Tự động điều chỉnh chiều cao textarea theo scrollHeight
   */
  autosizeEditor(editor: HTMLTextAreaElement): void {
    editor.style.height = "auto";
    editor.style.height = `${Math.max(20, editor.scrollHeight)}px`;
  }

  /**
   * Định vị textarea overlay khít với vị trí layer trên màn hình
   */
  positionEditorForLayer(layer: Layer, editor: HTMLTextAreaElement): void {
    const bounds = this.getTextBounds(layer);
    if (!bounds) return;

    const canvasArea = document.getElementById("canvas-area");
    if (!canvasArea) return;

    const areaRect = canvasArea.getBoundingClientRect();
    const canvasRect = this.canvas.getBoundingClientRect();
    const scaleX = canvasRect.width / this.canvas.width;
    const scaleY = canvasRect.height / this.canvas.height;

    const leftPx = canvasRect.left - areaRect.left + bounds.x * scaleX;
    const topPx = canvasRect.top - areaRect.top + bounds.y * scaleY;
    const widthPx = Math.max(20, (bounds.width + 2) * scaleX);
    const heightPx = Math.max(20, (bounds.height + 2) * scaleY);

    editor.style.left = `${leftPx}px`;
    editor.style.top = `${topPx}px`;
    editor.style.width = `${widthPx}px`;
    editor.style.minHeight = `${heightPx}px`;
    editor.style.fontSize = `${Math.max(10, layer.fontSize * scaleY)}px`;
    editor.style.lineHeight = `${Math.max(
      12,
      Math.round(layer.fontSize * 1.2) * scaleY
    )}px`;
    editor.style.fontFamily = layer.fontFamily;
    editor.style.color =
      typeof layer.fontColor === "string" ? layer.fontColor : "#ffffff";
    editor.style.textAlign = layer.textAlign;
  }
}
