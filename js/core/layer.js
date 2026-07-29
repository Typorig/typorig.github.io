"use strict";

/**
 * Layer Module - Quản lý các layer trong canvas
 * Layer 0 (Background/Root) là layer đặc biệt, luôn bị khóa
 */

class Layer {
  constructor(id, name, type = 'normal') {
    this.id = id;
    this.name = name;
    this.type = type; // 'background', 'text', 'image', 'shape', 'normal'
    this.visible = true;
    this.locked = type === 'background'; // Background layer luôn bị khóa
    this.opacity = 1.0;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.zIndex = id; // Layer 0 ở dưới cùng
    
    // Properties cho text layer
    this.text = null;
    this.fontSize = 48;
    this.fontFamily = 'Arial';
    this.fontWeight = 'normal';   // 'normal' | 'bold'
    this.fontStyle = 'normal';    // 'normal' | 'italic'
    this.textDecoration = 'none'; // 'none' | 'underline' | 'double-underline' | 'strikethrough' | 'dashed-underline' | 'wavy-underline' | 'dotted-underline'
    this.underline = false;       // tương thích ngược
    this.fontColor = '#000000';
    this.textAlign = 'left';
    this.paddingLeft = 0;
    this.paddingRight = 0;
    this.textureImage = null; // HTMLImageElement cho Texture
    this.textureScale = 1.0;  // 0.1 tới 2.0 (10% - 200%)
    this.x = 0;
    this.y = 0;
    
    // Properties cho transform
    this.rotation = 0;
    this.scaleX = 1;
    this.scaleY = 1;
  }

  /**
   * Thiết lập kích thước canvas của layer
   */
  setSize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  /**
   * Xóa nội dung layer
   */
  clear() {
    if (this.locked) {
      console.warn(`Layer "${this.name}" bị khóa, không thể xóa`);
      return;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Vẽ nội dung từ Image vào layer
   */
  drawImage(image, x = 0, y = 0, width = null, height = null) {
    if (this.locked && this.type !== 'background') {
      console.warn(`Layer "${this.name}" bị khóa, không thể vẽ`);
      return;
    }
    
    // Save image reference for background layer
    if (this.type === 'background') {
      this.image = image;
    }
    
    if (width && height) {
      this.ctx.drawImage(image, x, y, width, height);
    } else {
      this.ctx.drawImage(image, x, y);
    }
  }

  /**
   * Vẽ text lên layer
   */
  drawText(text, x, y) {
    if (this.locked) {
      console.warn(`Layer "${this.name}" bị khóa, không thể vẽ text`);
      return;
    }
    
    this.text = text ?? "";
    this.x = x;
    this.y = y;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    this.ctx.fillStyle = this.fontColor;
    this.ctx.textAlign = this.textAlign;
    const lines = String(this.text).split("\n");
    const lineHeight = Math.round(this.fontSize * 1.2);
    for (let i = 0; i < lines.length; i++) {
      this.ctx.fillText(lines[i], x, y + i * lineHeight);
    }
  }

  /**
   * Toggle hiển thị layer
   */
  toggleVisibility() {
    if (this.type === 'background') {
      console.warn('Không thể ẩn Background layer');
      return;
    }
    this.visible = !this.visible;
  }

  /**
   * Toggle khóa layer
   */
  toggleLock() {
    if (this.type === 'background') {
      console.warn('Background layer luôn bị khóa');
      return;
    }
    this.locked = !this.locked;
  }

  /**
   * Đổi tên layer
   */
  rename(newName) {
    if (this.type === 'background') {
      console.warn('Không thể đổi tên Background layer');
      return;
    }
    this.name = newName;
  }

  /**
   * Thiết lập opacity
   */
  setOpacity(opacity) {
    this.opacity = Math.max(0, Math.min(1, opacity));
  }
}

/**
 * LayerManager - Quản lý tất cả các layer
 */
class LayerManager {
  constructor(mainCanvas) {
    this.mainCanvas = mainCanvas;
    this.mainCtx = mainCanvas.getContext('2d');
    this.layers = [];
    this.activeLayerId = 0;
    this.nextLayerId = 1;
    
    // Tạo Background layer (Layer 0)
    this.createBackgroundLayer();
  }

  /**
   * Tạo Background layer đặc biệt
   */
  createBackgroundLayer() {
    const bgLayer = new Layer(0, 'Background', 'background');
    bgLayer.setSize(this.mainCanvas.width, this.mainCanvas.height);
    this.layers.push(bgLayer);
    return bgLayer;
  }

  /**
   * Tạo layer mới
   */
  createLayer(name, type = 'normal') {
    const layer = new Layer(this.nextLayerId++, name, type);
    layer.setSize(this.mainCanvas.width, this.mainCanvas.height);
    layer.zIndex = this.layers.length;
    this.layers.push(layer);
    this.activeLayerId = layer.id;
    return layer;
  }

  /**
   * Tạo text layer mới
   */
  createTextLayer(text, x, y, fontSize = 48, fontFamily = 'Arial', color = '#000000') {
    const safeName = String(text ?? "").replace(/\s+/g, " ").trim();
    const layerName = safeName.length > 20 ? safeName.substring(0, 20) + '...' : (safeName || "Text");
    const layer = this.createLayer(layerName, 'text');
    
    layer.fontSize = fontSize;
    layer.fontFamily = fontFamily;
    layer.fontColor = color;
    layer.drawText(String(text ?? ""), x, y);
    
    return layer;
  }

  /**
   * Lấy layer theo ID
   */
  getLayer(id) {
    return this.layers.find(l => l.id === id);
  }

  /**
   * Lấy active layer hiện tại
   */
  getActiveLayer() {
    return this.getLayer(this.activeLayerId);
  }

  /**
   * Lấy Background layer
   */
  getBackgroundLayer() {
    return this.layers[0];
  }

  /**
   * Chọn layer active
   */
  setActiveLayer(id) {
    const layer = this.getLayer(id);
    if (layer) {
      this.activeLayerId = id;
      if (window.textTransform) {
        if (layer.type === 'text') {
          window.textTransform.selectedLayer = layer;
        } else {
          window.textTransform.selectedLayer = null;
        }
        this.render();
      }
      return true;
    }
    return false;
  }

  /**
   * Xóa layer (không thể xóa Background)
   */
  deleteLayer(id) {
    if (id === 0) {
      console.warn('Không thể xóa Background layer');
      return false;
    }
    
    const index = this.layers.findIndex(l => l.id === id);
    if (index > 0) {
      this.layers.splice(index, 1);
      
      // Nếu xóa active layer, chọn layer khác
      if (this.activeLayerId === id) {
        const nextActive = this.layers[this.layers.length - 1];
        this.setActiveLayer(nextActive.id);
      }
      
      return true;
    }
    return false;
  }

  /**
   * Di chuyển layer lên trên (tăng z-index)
   */
  moveLayerUp(id) {
    if (id === 0) {
      console.warn('Không thể di chuyển Background layer');
      return false;
    }
    
    const index = this.layers.findIndex(l => l.id === id);
    if (index > 1 && index < this.layers.length - 1) {
      const layer = this.layers[index];
      const upperLayer = this.layers[index + 1];
      
      // Swap z-index
      [layer.zIndex, upperLayer.zIndex] = [upperLayer.zIndex, layer.zIndex];
      
      // Swap positions
      this.layers[index] = upperLayer;
      this.layers[index + 1] = layer;
      
      return true;
    }
    return false;
  }

  /**
   * Di chuyển layer xuống dưới (giảm z-index)
   */
  moveLayerDown(id) {
    if (id === 0) {
      console.warn('Không thể di chuyển Background layer');
      return false;
    }
    
    const index = this.layers.findIndex(l => l.id === id);
    if (index > 1) {
      const layer = this.layers[index];
      const lowerLayer = this.layers[index - 1];
      
      // Swap z-index
      [layer.zIndex, lowerLayer.zIndex] = [lowerLayer.zIndex, layer.zIndex];
      
      // Swap positions
      this.layers[index] = lowerLayer;
      this.layers[index - 1] = layer;
      
      return true;
    }
    return false;
  }

  /**
   * Resize tất cả layers khi main canvas thay đổi kích thước
   */
  resizeAllLayers(width, height) {
    this.layers.forEach(layer => {
      // Lưu nội dung cũ
      const oldCanvas = layer.canvas;
      const oldCtx = layer.ctx;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = oldCanvas.width;
      tempCanvas.height = oldCanvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(oldCanvas, 0, 0);
      
      // Resize
      layer.setSize(width, height);
      
      // Vẽ lại nội dung cũ
      layer.ctx.drawImage(tempCanvas, 0, 0);
    });
  }

  /**
   * Render tất cả layers lên main canvas
   */
  render() {
    // Clear main canvas
    this.mainCtx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
    
    // Vẽ các layer theo thứ tự z-index (từ dưới lên trên)
    const sortedLayers = [...this.layers].sort((a, b) => a.zIndex - b.zIndex);
    
    sortedLayers.forEach(layer => {
      if (!layer.visible) return;
      
      this.mainCtx.save();
      
      // Apply opacity
      this.mainCtx.globalAlpha = layer.opacity;
      
      // Apply transforms nếu có
      if (layer.rotation !== 0 || layer.scaleX !== 1 || layer.scaleY !== 1) {
        let centerX = this.mainCanvas.width / 2;
        let centerY = this.mainCanvas.height / 2;

        if (layer.type === "text" && window.textTransform) {
          const bounds = window.textTransform.getTextBounds(layer);
          if (bounds) {
            centerX = bounds.x + bounds.width / 2;
            centerY = bounds.y + bounds.height / 2;
          }
        }
        
        this.mainCtx.translate(centerX, centerY);
        this.mainCtx.rotate(layer.rotation * Math.PI / 180);
        this.mainCtx.scale(layer.scaleX, layer.scaleY);
        this.mainCtx.translate(-centerX, -centerY);
      }
      
      // Vẽ layer
      this.mainCtx.drawImage(layer.canvas, 0, 0);
      
      this.mainCtx.restore();
    });

    // Tự động vẽ khung nét đứt vùng chọn nếu có selectedLayer
    if (window.textTransform && window.textTransform.selectedLayer) {
      window.textTransform.drawSelectionOverlay(window.textTransform.selectedLayer);
    }
  }

  /**
   * Lấy danh sách layers (để hiển thị UI)
   */
  getLayersList() {
    return this.layers.map(layer => ({
      id: layer.id,
      name: layer.name,
      type: layer.type,
      visible: layer.visible,
      locked: layer.locked,
      opacity: layer.opacity,
      isActive: layer.id === this.activeLayerId
    }));
  }

  /**
   * Merge tất cả visible layers thành một image
   */
  mergeVisibleLayers() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.mainCanvas.width;
    tempCanvas.height = this.mainCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    const sortedLayers = [...this.layers].sort((a, b) => a.zIndex - b.zIndex);
    
    sortedLayers.forEach(layer => {
      if (layer.visible) {
        tempCtx.globalAlpha = layer.opacity;
        tempCtx.drawImage(layer.canvas, 0, 0);
      }
    });
    
    return tempCanvas;
  }
}

// Export cho global scope
window.Layer = Layer;
window.LayerManager = LayerManager;

/**
 * Render danh sách layers vào sidebar phải
 */
let selectedLayers = new Set(); // Lưu các layer được chọn để xóa

function updateLayerList() {
  const layerList = document.getElementById("layer-list");
  if (!layerList) return;
  
  const layerManager = window.layerManager;
  if (!layerManager) {
    layerList.innerHTML = '<p style="color:#888;font-size:12px;padding:16px;text-align:center;">No layers available</p>';
    return;
  }
  
  const layers = layerManager.getLayersList();
  
  // Clear existing content
  layerList.innerHTML = '';
  
  // Render layers (theo thứ tự ngược lại - layer trên cùng hiển thị đầu tiên)
  layers.slice().reverse().forEach((layer, index) => {
    const layerItem = document.createElement('div');
    const isBackground = layer.type === 'background' || layer.id === 0;
    layerItem.className = 'layer-item' + 
      (layer.isActive ? ' active' : '') + 
      (layer.locked ? ' locked' : '') + 
      (isBackground ? ' background-layer' : '');
    layerItem.dataset.layerId = layer.id;
    layerItem.dataset.originalIndex = index;
    
    // Chỉ cho phép kéo nếu không phải Background layer
    layerItem.draggable = !isBackground;
    
    if (!isBackground) {
      // Drag events chỉ cho các layer không phải Background
      layerItem.addEventListener('dragstart', handleDragStart);
      layerItem.addEventListener('dragover', handleDragOver);
      layerItem.addEventListener('drop', handleDrop);
      layerItem.addEventListener('dragend', handleDragEnd);
      layerItem.addEventListener('dragleave', handleDragLeave);
    }
    
    // Checkbox (để chọn nhiều layer cho việc xóa)
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'layer-checkbox';
    checkbox.checked = selectedLayers.has(layer.id);
    checkbox.title = 'Chọn layer để xóa';
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      if (checkbox.checked) {
        selectedLayers.add(layer.id);
      } else {
        selectedLayers.delete(layer.id);
      }
      updateDeleteButtonVisibility();
    });
    
    // Thumbnail
    const thumbnail = document.createElement('img');
    thumbnail.className = 'layer-thumbnail';
    thumbnail.draggable = false; // Prevent image drag
    const layerObj = layerManager.getLayer(layer.id);
    if (layerObj && layerObj.canvas) {
      // Tạo thumbnail từ canvas của layer
      thumbnail.src = layerObj.canvas.toDataURL();
    } else {
      thumbnail.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 36"%3E%3Crect fill="%23555" width="48" height="36"/%3E%3C/svg%3E';
    }
    
    // Layer info
    const info = document.createElement('div');
    info.className = 'layer-info';
    
    const name = document.createElement('div');
    name.className = 'layer-name';
    name.textContent = layer.name;
    
    const type = document.createElement('div');
    type.className = 'layer-type';
    type.textContent = layer.type;
    
    info.appendChild(name);
    info.appendChild(type);
    
    // Lock button
    const lockBtn = document.createElement('button');
    lockBtn.className = 'layer-action-btn' + (layer.locked ? ' active' : '');
    lockBtn.title = layer.locked ? 'Mở khóa layer' : 'Khóa layer';
    lockBtn.innerHTML = layer.locked 
      ? '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>'
      : '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"/></svg>';
    
    if (layer.type !== 'background') {
      lockBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const l = layerManager.getLayer(layer.id);
        if (l) {
          l.toggleLock();
          updateLayerList();
        }
      });
    }
    
    // Hide/Show button
    const hideBtn = document.createElement('button');
    hideBtn.className = 'layer-action-btn' + (!layer.visible ? ' hidden-layer' : '');
    hideBtn.title = layer.visible ? 'Ẩn layer' : 'Hiện layer';
    hideBtn.innerHTML = layer.visible
      ? '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>'
      : '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>';
    
    if (layer.type !== 'background') {
      hideBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const l = layerManager.getLayer(layer.id);
        if (l) {
          l.toggleVisibility();
          layerManager.render();
          updateLayerList();
        }
      });
    }
    
    // Click on layer item to select it (không kích hoạt khi click vào checkbox/buttons)
    layerItem.addEventListener('click', (e) => {
      // Chỉ select layer khi click vào phần chính, không phải buttons
      if (!e.target.closest('button') && !e.target.closest('input')) {
        layerManager.setActiveLayer(layer.id);
        updateLayerList();
      }
    });
    
    // Assemble layer item
    layerItem.appendChild(checkbox);
    layerItem.appendChild(thumbnail);
    layerItem.appendChild(info);
    layerItem.appendChild(lockBtn);
    layerItem.appendChild(hideBtn);
    
    layerList.appendChild(layerItem);
  });
  
  updateDeleteButtonVisibility();
}

// Drag and Drop handlers
let draggedElement = null;
let draggedLayerId = null;

function handleDragStart(e) {
  draggedElement = this;
  draggedLayerId = parseInt(this.dataset.layerId);
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  
  const target = e.target.closest('.layer-item');
  if (target && target !== draggedElement) {
    const targetLayerId = parseInt(target.dataset.layerId);
    
    // Nếu target là Background layer, hiển thị màu đỏ (không cho drop)
    if (targetLayerId === 0) {
      e.dataTransfer.dropEffect = 'none';
      target.classList.add('drag-over', 'no-drop');
    } else {
      e.dataTransfer.dropEffect = 'move';
      target.classList.add('drag-over');
      target.classList.remove('no-drop');
    }
  }
  
  return false;
}

function handleDragLeave(e) {
  const target = e.target.closest('.layer-item');
  if (target) {
    target.classList.remove('drag-over', 'no-drop');
  }
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  const target = e.target.closest('.layer-item');
  if (!target || target === draggedElement) return false;
  
  const targetLayerId = parseInt(target.dataset.layerId);
  const layerManager = window.layerManager;
  
  if (layerManager && draggedLayerId !== null && targetLayerId !== null) {
    // Không cho phép di chuyển Background layer
    if (draggedLayerId === 0) {
      console.warn('Không thể di chuyển Background layer');
      return false;
    }
    
    // Không cho phép đặt layer nào xuống dưới Background layer
    if (targetLayerId === 0) {
      console.warn('Không thể đặt layer xuống dưới Background layer');
      return false;
    }
    
    // Tìm index của cả hai layers
    const draggedIndex = layerManager.layers.findIndex(l => l.id === draggedLayerId);
    const targetIndex = layerManager.layers.findIndex(l => l.id === targetLayerId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Swap layers trong array
      const draggedLayer = layerManager.layers[draggedIndex];
      layerManager.layers.splice(draggedIndex, 1);
      layerManager.layers.splice(targetIndex, 0, draggedLayer);
      
      // Cập nhật z-index
      layerManager.layers.forEach((layer, idx) => {
        layer.zIndex = idx;
      });
      
      // Re-render
      layerManager.render();
      updateLayerList();
    }
  }
  
  return false;
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  
  // Remove all drag-over classes
  document.querySelectorAll('.layer-item').forEach(item => {
    item.classList.remove('drag-over', 'no-drop');
  });
  
  draggedElement = null;
  draggedLayerId = null;
}

// Delete button visibility
function updateDeleteButtonVisibility() {
  const deleteBtn = document.getElementById('layer-delete-selected');
  if (deleteBtn) {
    deleteBtn.style.display = selectedLayers.size > 0 ? 'flex' : 'none';
  }
}

// Export function globally
window.updateLayerList = updateLayerList;
window.selectedLayers = selectedLayers;
