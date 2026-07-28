"use strict";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const dropzone = document.getElementById("dropzone");
const canvasArea = document.getElementById("canvas-area");

let sourceImage = null;
let displayImage = null;
// Expose for other modules (color.js, bar.js)
window.sourceImage = null;
window.displayImage = null;
// Flag: true when user loaded a real photo (non-gradient/non-color)
window.hasRealImage = false;

// LayerManager instance
let layerManager = null;
window.layerManager = null;

// TextTransform instance
let textTransform = null;
window.textTransform = null;

/* ── Load image ── */
function loadImage(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      sourceImage = img;
      displayImage = img;
      window.sourceImage = img; // expose for other modules
      window.displayImage = img;
      window.hasRealImage = true; // loaded from drag-drop = real photo
      
      // Khởi tạo LayerManager nếu chưa có
      if (!layerManager) {
        layerManager = new LayerManager(canvas);
        window.layerManager = layerManager;
        
        // Khởi tạo TextTransform
        textTransform = new TextTransform(canvas, layerManager);
        window.textTransform = textTransform;
      }
      
      // Resize canvas và layers
      canvas.width = img.width;
      canvas.height = img.height;
      layerManager.resizeAllLayers(img.width, img.height);
      
      // Vẽ image lên Background layer
      const bgLayer = layerManager.getBackgroundLayer();
      bgLayer.drawImage(img, 0, 0);
      
      render();
      if (typeof window.updateCropButtonState === "function") window.updateCropButtonState();
      
      // Cập nhật layer list nếu sidebar đang mở
      if (typeof window.updateLayerList === "function") window.updateLayerList();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
window.loadImage = loadImage; // explicitly expose

/* ── Render ── */
function render() {
  if (!window.displayImage && !displayImage) return;
  const img = window.displayImage || displayImage;
  dropzone.classList.add("hidden");
  canvas.style.display = "block";

  // Use canvas dimensions if image is 1x1 transparent pixel
  if (img.src.startsWith('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ')) {
    // Keep current canvas dimensions
  } else {
    canvas.width = img.width;
    canvas.height = img.height;
  }
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Only draw image if it's not transparent
  if (window.hasRealImage || img.src.length > 100) {
    // Check if it's a transparent image (1x1 transparent pixel data URL is short)
    if (img.src.startsWith('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ') || 
        (img.width === 1200 && img.height === 600 && !window.hasRealImage && !window.ColorModule?.lastBackground)) {
      // Don't draw transparent image
    } else {
      ctx.drawImage(img, 0, 0);
    }
  }
  
  // Nếu có layerManager, resize và render layers
  if (layerManager) {
    layerManager.resizeAllLayers(canvas.width, canvas.height);
    layerManager.render();
    
    // Cập nhật layer list nếu sidebar đang mở
    if (typeof window.updateLayerList === "function") window.updateLayerList();
  }
}
// Expose render
window.render = render;

/* ── Init default canvas (2:1, Neon gradient) ── */
function initDefaultCanvas() {
  const W = 1200, H = 600; // 2:1 ratio
  canvas.width = W;
  canvas.height = H;
  canvas.style.display = "block";
  dropzone.classList.add("hidden");

  // Khởi tạo LayerManager
  layerManager = new LayerManager(canvas);
  window.layerManager = layerManager;

  // Khởi tạo TextTransform
  textTransform = new TextTransform(canvas, layerManager);
  window.textTransform = textTransform;

  // Bật layer-sidebar và nút Layer mặc định
  const layerBtn = document.querySelector('.top-btn[data-action="layer"]');
  const layerSidebar = document.getElementById("layer-sidebar");
  const body = document.getElementById("body");
  
  if (layerBtn) {
    layerBtn.classList.add("active");
  }
  if (layerSidebar) {
    layerSidebar.classList.remove("hidden");
  }
  if (body) {
    body.classList.add("layer-open");
  }

  // Neon gradient: #00f260 → #0575e6
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#00f260");
  grad.addColorStop(1, "#0575e6");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Vẽ gradient lên Background layer
  const bgLayer = layerManager.getBackgroundLayer();
  const bgGrad = bgLayer.ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, "#00f260");
  bgGrad.addColorStop(1, "#0575e6");
  bgLayer.ctx.fillStyle = bgGrad;
  bgLayer.ctx.fillRect(0, 0, W, H);

  // sourceImage for other modules
  const img = new Image();
  img.onload = () => {
    sourceImage = img;
    window.sourceImage = img;
    displayImage = img;
    window.displayImage = img;
    render();
  };
  img.src = canvas.toDataURL();
  // Not a real photo so hasRealImage stays false
}

/* ── Drag & drop ── */
canvasArea.addEventListener("dragover", (e) => { e.preventDefault(); canvasArea.classList.add("drag-over"); });
canvasArea.addEventListener("dragleave", () => { canvasArea.classList.remove("drag-over"); });
canvasArea.addEventListener("drop", (e) => {
  e.preventDefault();
  canvasArea.classList.remove("drag-over");
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) loadImage(file);
});

/* ── Text Layer Handler ── */
// Text handling moved to text.js module

// Run on load
initDefaultCanvas();


