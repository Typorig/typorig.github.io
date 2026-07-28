"use strict";

/**
 * Text Transform Module
 * Xử lý drag để di chuyển và resize text trên canvas
 */

class TextTransform {
  constructor(canvas, layerManager) {
    this.canvas = canvas;
    this.layerManager = layerManager;
    this.isDragging = false;
    this.isResizing = false;
    this.isEditing = false;
    this.selectedLayer = null;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.textStartX = 0;
    this.textStartY = 0;
    this.resizeStartY = 0;
    this.textStartSize = 0;
    this.cursorMode = 'default'; // 'move', 'resize', 'default'
    this.editorEl = null;
    this.editingLayer = null;
    this.editingOriginalText = "";
    
    this.initEventListeners();
  }

  /**
   * Khởi tạo event listeners cho canvas
   */
  initEventListeners() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * Lấy vị trí chuột trên canvas
   */
  getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  /**
   * Tính toán bounding box của text
   */
  getTextBounds(layer) {
    if (!layer || layer.type !== 'text' || layer.text === null || layer.text === undefined) return null;
    
    const ctx = layer.ctx;
    ctx.font = `${layer.fontSize}px ${layer.fontFamily}`;
    const lines = String(layer.text).split("\n");
    const widths = lines.map(line => ctx.measureText(line).width);
    const width = Math.max(10, ...widths);
    const lineHeight = Math.round(layer.fontSize * 1.2);
    const height = Math.max(layer.fontSize, (Math.max(1, lines.length) - 1) * lineHeight + layer.fontSize);
    
    const pLeft = layer.paddingLeft || 0;
    const pRight = layer.paddingRight || 0;

    let x0 = layer.x;
    if (layer.textAlign === 'center') {
      x0 = layer.x - width / 2;
    } else if (layer.textAlign === 'right') {
      x0 = layer.x - width;
    }

    const boundsX = x0 - pLeft;
    const boundsWidth = Math.max(1, width + pLeft + pRight);
    const bottomBaselineY = layer.y + Math.max(0, lines.length - 1) * lineHeight;
    
    return {
      x: boundsX,
      y: layer.y - layer.fontSize,
      width: boundsWidth,
      height: height,
      textWidth: width,
      x0: x0,
      // Resize handle (góc phải dưới)
      resizeHandleX: boundsX + boundsWidth,
      resizeHandleY: bottomBaselineY,
      resizeHandleSize: 12
    };
  }

  /**
   * Kiểm tra chuột có trong vùng text không
   */
  isPointInText(x, y, bounds) {
    if (!bounds) return false;
    return x >= bounds.x && x <= bounds.x + bounds.width &&
           y >= bounds.y && y <= bounds.y + bounds.height;
  }

  /**
   * Kiểm tra chuột có trên resize handle không
   */
  isPointInResizeHandle(x, y, bounds) {
    if (!bounds) return false;
    const handleX = bounds.resizeHandleX;
    const handleY = bounds.resizeHandleY;
    const size = bounds.resizeHandleSize;
    
    return x >= handleX - size && x <= handleX + size &&
           y >= handleY - size && y <= handleY + size;
  }

  /**
   * Tìm text layer tại vị trí chuột (từ trên xuống)
   */
  findTextLayerAt(x, y) {
    const layers = [...this.layerManager.layers]
      .filter(l => l.type === 'text' && l.visible && !l.locked)
      .sort((a, b) => b.zIndex - a.zIndex); // Từ trên xuống
    
    for (const layer of layers) {
      const bounds = this.getTextBounds(layer);
      if (this.isPointInText(x, y, bounds)) {
        return { layer, bounds };
      }
    }
    
    return null;
  }

  /**
   * Xử lý mousedown
   */
  handleMouseDown(e) {
    if (this.isEditing) return;
    const pos = this.getMousePos(e);
    const result = this.findTextLayerAt(pos.x, pos.y);
    
    if (result) {
      const { layer, bounds } = result;
      
      // Kiểm tra xem có click vào resize handle không
      if (this.isPointInResizeHandle(pos.x, pos.y, bounds)) {
        this.isResizing = true;
        this.selectedLayer = layer;
        this.resizeStartY = pos.y;
        this.textStartSize = layer.fontSize;
        this.canvas.style.cursor = 'ns-resize';
      } else {
        // Bắt đầu drag
        this.isDragging = true;
        this.selectedLayer = layer;
        this.dragStartX = pos.x;
        this.dragStartY = pos.y;
        this.textStartX = layer.x;
        this.textStartY = layer.y;
        this.canvas.style.cursor = 'move';
      }
      
      // Set active layer
      this.layerManager.setActiveLayer(layer.id);
      if (typeof window.updateLayerList === 'function') {
        window.updateLayerList();
      }
      
      // Auto open text-props when clicking a text layer
      if (typeof window.textHandler !== "undefined" && typeof window.textHandler.showTextProperties === "function") {
        window.textHandler.showTextProperties();
        const textSection = document.querySelector('.sidebar-section[data-section="text"]');
        if (textSection) {
          document.querySelectorAll('.sidebar-section').forEach(s => s.classList.remove('active'));
          textSection.classList.add('active');
        }
        const subSidebar = document.getElementById("sub-sidebar");
        const body = document.getElementById("body");
        if (subSidebar) subSidebar.classList.remove("hidden");
        if (body) body.classList.add("sub-open");
      }
    } else {
      // Click ra ngoài text - bỏ chọn
      this.selectedLayer = null;
      this.layerManager.setActiveLayer(0); // Chuyển active layer về Background (layer 0)
      this.canvas.style.cursor = 'default';
      if (typeof window.updateLayerList === 'function') {
        window.updateLayerList();
      }
      this.layerManager.render(); // Render lại để xóa overlay
      
      // Ẩn text properties panel khi bỏ chọn text
      if (typeof window.textHandler !== "undefined" && typeof window.textHandler.hideTextProperties === "function") {
        window.textHandler.hideTextProperties();
      }
    }
  }

  /**
   * Xử lý mousemove
   */
  handleMouseMove(e) {
    if (this.isEditing) return;
    const pos = this.getMousePos(e);
    
    if (this.isDragging && this.selectedLayer) {
      // Di chuyển text
      const dx = pos.x - this.dragStartX;
      const dy = pos.y - this.dragStartY;
      
      this.selectedLayer.x = this.textStartX + dx;
      this.selectedLayer.y = this.textStartY + dy;
      
      // Vẽ lại text layer
      this.redrawTextLayer(this.selectedLayer);
      this.layerManager.render();
      this.drawSelectionOverlay(this.selectedLayer);
      
    } else if (this.isResizing && this.selectedLayer) {
      // Resize text
      const dy = pos.y - this.resizeStartY;
      const newSize = Math.max(10, this.textStartSize + dy);
      
      this.selectedLayer.fontSize = Math.round(newSize);
      
      // Update UI size panel if open
      const sizeDisplay = document.getElementById("size-value-display");
      const sizeSlider = document.getElementById("size-slider");
      if (sizeDisplay) sizeDisplay.textContent = Math.round(newSize);
      if (sizeSlider) sizeSlider.value = Math.min(Math.max(Math.round(newSize), 2), 300);

      // Vẽ lại text layer
      this.redrawTextLayer(this.selectedLayer);
      this.layerManager.render();
      this.drawSelectionOverlay(this.selectedLayer);
      
    } else {
      // Cập nhật cursor dựa trên vị trí chuột
      const result = this.findTextLayerAt(pos.x, pos.y);
      
      if (result) {
        const { layer, bounds } = result;
        
        // Vẽ overlay nếu hover vào text đang được chọn
        if (this.selectedLayer && layer.id === this.selectedLayer.id) {
          this.layerManager.render();
          this.drawSelectionOverlay(this.selectedLayer);
        }
        
        if (this.isPointInResizeHandle(pos.x, pos.y, bounds)) {
          this.canvas.style.cursor = 'ns-resize';
        } else {
          this.canvas.style.cursor = 'move';
        }
      } else {
        this.canvas.style.cursor = 'default';
        
        // Nếu đang có selectedLayer và hover ra ngoài, vẫn giữ overlay
        if (this.selectedLayer) {
          this.layerManager.render();
          this.drawSelectionOverlay(this.selectedLayer);
        }
      }
    }
  }

  /**
   * Xử lý mouseup
   */
  handleMouseUp(e) {
    if (this.isEditing) return;
    if (this.isDragging || this.isResizing) {
      this.isDragging = false;
      this.isResizing = false;
      
      // Render lại với overlay của selectedLayer
      this.layerManager.render();
      if (this.selectedLayer) {
        this.drawSelectionOverlay(this.selectedLayer);
      }
      
      const pos = this.getMousePos(e);
      const result = this.findTextLayerAt(pos.x, pos.y);
      
      if (result) {
        const { bounds } = result;
        if (this.isPointInResizeHandle(pos.x, pos.y, bounds)) {
          this.canvas.style.cursor = 'ns-resize';
        } else {
          this.canvas.style.cursor = 'move';
        }
      } else {
        this.canvas.style.cursor = 'default';
      }
    }
  }

  /**
   * Xử lý mouseleave
   */
  handleMouseLeave(e) {
    this.handleMouseUp(e);
  }

  handleKeyDown(e) {
    if (this.isEditing) return;
    if (!this.selectedLayer || this.selectedLayer.type !== "text") return;
    if (!this.selectedLayer.visible || this.selectedLayer.locked) return;

    const active = document.activeElement;
    const tag = active ? active.tagName : "";
    if (tag === "INPUT" || tag === "TEXTAREA" || (active && active.isContentEditable)) return;

    if (e.key === "Backspace") {
      e.preventDefault();
      const active = document.activeElement;
      const tag = active ? active.tagName : "";
      if (tag !== "INPUT" && tag !== "TEXTAREA" && !(active && active.isContentEditable)) {
        // Only trigger editing if user wasn't focused on input controls
        this.startTextEditing(this.selectedLayer, { deleteBackward: true });
      }
      return;
    }
    if (e.key === "Delete") {
      e.preventDefault();
      const layerId = this.selectedLayer.id;
      if (layerId !== 0) {
        this.selectedLayer = null;
        this.layerManager.deleteLayer(layerId);
        this.layerManager.render();
        if (typeof window.updateLayerList === "function") {
          window.updateLayerList();
        }
        // Switch sub-sidebar back to main "New Text" menu if no text layers exist
        const hasTextLayers = this.layerManager.layers.some(l => l.type === "text");
        if (!hasTextLayers && window.textHandler && typeof window.textHandler.hideTextProperties === "function") {
          window.textHandler.hideTextProperties();
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

  handleDoubleClick(e) {
    const pos = this.getMousePos(e);
    const result = this.findTextLayerAt(pos.x, pos.y);
    if (!result) return;
    const { layer } = result;
    if (layer.locked || !layer.visible) return;
    this.layerManager.setActiveLayer(layer.id);
    if (typeof window.updateLayerList === 'function') {
      window.updateLayerList();
    }
    this.selectedLayer = layer;
    this.layerManager.render();
    this.drawSelectionOverlay(layer);
    this.startTextEditing(layer);
  }

  /**
   * Vẽ lại text layer
   */
  redrawTextLayer(layer) {
    if (!layer || layer.type !== 'text') return;
    
    // Clear layer canvas
    layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
    
    // Vẽ lại text
    layer.ctx.font = `${layer.fontSize}px ${layer.fontFamily}`;

    const bounds = this.getTextBounds(layer);
    let isPatternFill = false;
    let textPattern = null;

    // Ưu tiên Texture hơn Color
    if (layer.textureImage && bounds) {
      const img = layer.textureImage;
      const scale = layer.textureScale !== undefined ? layer.textureScale : 1.0;

      const offCanvas = document.createElement("canvas");
      const targetW = Math.max(1, Math.round(bounds.width * scale));
      const targetH = Math.max(1, Math.round(bounds.height * scale));

      offCanvas.width = targetW;
      offCanvas.height = targetH;
      const offCtx = offCanvas.getContext("2d");

      // Phong to ở góc trên bên trái
      offCtx.drawImage(img, 0, 0, targetW, targetH);

      // Nếu scale < 100% (scale < 1.0) -> repeat ảnh con, nếu scale >= 1.0 -> phong to ở góc trên bên trái (no-repeat)
      const repeatMode = scale < 1.0 ? "repeat" : "no-repeat";
      textPattern = layer.ctx.createPattern(offCanvas, repeatMode);

      if (textPattern && typeof DOMMatrix !== "undefined") {
        const matrix = new DOMMatrix().translate(bounds.x, bounds.y);
        textPattern.setTransform(matrix);
      }
      isPatternFill = true;
    } else if (typeof layer.fontColor === "object" && layer.fontColor !== null) {
      const fillObj = layer.fontColor;
      const isMesh = fillObj.kind === "custom" && fillObj.data && (fillObj.data.type === "radial" || fillObj.data.type === "mesh");
      if (isMesh) {
        if (typeof ColorModule !== "undefined" && typeof ColorModule.createMeshPatternForBounds === "function") {
          textPattern = ColorModule.createMeshPatternForBounds(layer.ctx, bounds, fillObj);
          isPatternFill = true;
        }
      } else if (typeof ColorModule !== "undefined" && typeof ColorModule.createGradientFillForCtx === "function") {
        const gradFill = ColorModule.createGradientFillForCtx(layer.ctx, bounds, fillObj);
        layer.ctx.fillStyle = gradFill || "#000000";
      } else {
        layer.ctx.fillStyle = "#000000";
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

    if (layer.textAlign === 'left') {
      drawX += (pLeft - pRight);
    } else if (layer.textAlign === 'right') {
      drawX += (pLeft - pRight);
    } else if (layer.textAlign === 'center') {
      drawX += (pLeft - pRight);
    }

    // Kiểm tra và giữ chữ ở mép Bounding Box nếu bên kia vẫn còn không gian
    if (bounds) {
      const textW = bounds.textWidth;
      let textLeft = drawX;
      if (layer.textAlign === 'center') textLeft = drawX - textW / 2;
      else if (layer.textAlign === 'right') textLeft = drawX - textW;

      let textRight = textLeft + textW;
      const boxLeft = bounds.x;
      const boxRight = bounds.x + bounds.width;

      // Nếu chữ vượt bên phải mà mép trái của Box vẫn còn thừa chỗ (chữ không bị kẹp 2 đầu)
      if (textRight > boxRight && textLeft > boxLeft) {
        const overflowR = textRight - boxRight;
        const availableL = textLeft - boxLeft;
        const shift = Math.min(overflowR, availableL);
        drawX -= shift;
      }
      // Nếu chữ vượt bên trái mà mép phải của Box vẫn còn thừa chỗ
      else if (textLeft < boxLeft && textRight < boxRight) {
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
      // Clip theo vùng Bounding Box tổng (đã bao gồm L và R)
      layer.ctx.rect(bounds.x, bounds.y, Math.max(0, bounds.width), Math.max(0, bounds.height));
      layer.ctx.clip();
    }

    for (let i = 0; i < lines.length; i++) {
      layer.ctx.fillText(lines[i], drawX, layer.y + i * lineHeight);
    }

    if (bounds) {
      layer.ctx.restore();
    }
  }

  /**
   * Vẽ overlay selection lên main canvas
   */
  drawSelectionOverlay(layer) {
    if (!layer) return;
    
    const bounds = this.getTextBounds(layer);
    if (!bounds) return;
    
    const ctx = this.layerManager.mainCtx;
    
    ctx.save();

    // Rotate overlay theo góc xoay của layer
    if (layer.rotation) {
      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    // Vẽ border xung quanh text
    ctx.strokeStyle = '#00f260';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(bounds.x - 5, bounds.y - 5, bounds.width + 10, bounds.height + 10);
    ctx.setLineDash([]);
    
    // Vẽ resize handle
    const handleSize = bounds.resizeHandleSize;
    ctx.fillStyle = '#00f260';
    ctx.fillRect(
      bounds.resizeHandleX - handleSize / 2,
      bounds.resizeHandleY - handleSize / 2,
      handleSize,
      handleSize
    );
    
    // Vẽ border cho handle
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      bounds.resizeHandleX - handleSize / 2,
      bounds.resizeHandleY - handleSize / 2,
      handleSize,
      handleSize
    );
    
    ctx.restore();
  }

  startTextEditing(layer, options = {}) {
    if (!layer || layer.type !== 'text') return;
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

  commitTextEditing() {
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
      if (typeof window.updateLayerList === 'function') {
        window.updateLayerList();
      }
      // Check if text layers still exist
      const hasTextLayers = this.layerManager.layers.some(l => l.type === "text");
      if (!hasTextLayers && window.textHandler && typeof window.textHandler.hideTextProperties === "function") {
        window.textHandler.hideTextProperties();
      }
      return;
    }

    this.editingLayer.text = newText;

    const safeName = newText.replace(/\s+/g, " ").trim();
    const newName = safeName.length > 20 ? safeName.substring(0, 20) + "..." : (safeName || "Text");
    this.editingLayer.name = newName;

    this.redrawTextLayer(this.editingLayer);
    this.layerManager.render();
    this.drawSelectionOverlay(this.editingLayer);
    if (typeof window.updateLayerList === 'function') {
      window.updateLayerList();
    }

    this.removeEditor();
  }

  cancelTextEditing() {
    if (!this.isEditing || !this.editorEl || !this.editingLayer) return;
    this.editingLayer.text = this.editingOriginalText;
    this.redrawTextLayer(this.editingLayer);
    this.layerManager.render();
    this.drawSelectionOverlay(this.editingLayer);
    this.removeEditor();
  }

  removeEditor() {
    if (this.editorEl && this.editorEl.parentNode) {
      this.editorEl.parentNode.removeChild(this.editorEl);
    }
    this.editorEl = null;
    this.editingLayer = null;
    this.editingOriginalText = "";
    this.isEditing = false;
  }

  autosizeEditor(editor) {
    editor.style.height = "auto";
    editor.style.height = `${Math.max(20, editor.scrollHeight)}px`;
  }

  positionEditorForLayer(layer, editor) {
    const bounds = this.getTextBounds(layer);
    if (!bounds) return;

    const canvasArea = document.getElementById("canvas-area");
    if (!canvasArea) return;

    const areaRect = canvasArea.getBoundingClientRect();
    const canvasRect = this.canvas.getBoundingClientRect();
    const scaleX = canvasRect.width / this.canvas.width;
    const scaleY = canvasRect.height / this.canvas.height;

    const leftPx = (canvasRect.left - areaRect.left) + bounds.x * scaleX;
    const topPx = (canvasRect.top - areaRect.top) + bounds.y * scaleY;
    const widthPx = Math.max(20, (bounds.width + 2) * scaleX);
    const heightPx = Math.max(20, (bounds.height + 2) * scaleY);

    editor.style.left = `${leftPx}px`;
    editor.style.top = `${topPx}px`;
    editor.style.width = `${widthPx}px`;
    editor.style.minHeight = `${heightPx}px`;
    editor.style.fontSize = `${Math.max(10, layer.fontSize * scaleY)}px`;
    editor.style.lineHeight = `${Math.max(12, Math.round(layer.fontSize * 1.2) * scaleY)}px`;
    editor.style.fontFamily = layer.fontFamily;
    editor.style.color = layer.fontColor;
    editor.style.textAlign = layer.textAlign;
  }
}

// Export
window.TextTransform = TextTransform;
