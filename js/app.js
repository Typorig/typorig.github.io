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
      render();
      if (typeof window.updateCropButtonState === "function") window.updateCropButtonState();
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

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
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

  // Neon gradient: #00f260 → #0575e6
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#00f260");
  grad.addColorStop(1, "#0575e6");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

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

// Run on load
initDefaultCanvas();


