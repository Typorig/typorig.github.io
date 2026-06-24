"use strict";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const dropzone = document.getElementById("dropzone");
const canvasArea = document.getElementById("canvas-area");

let sourceImage = null;
let displayImage = null;

/* ── Load image ── */
function loadImage(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      sourceImage = img;
      displayImage = img;
      render();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* ── Render ── */
function render() {
  if (!displayImage) return;
  dropzone.classList.add("hidden");
  canvas.style.display = "block";

  canvas.width = displayImage.width;
  canvas.height = displayImage.height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(displayImage, 0, 0);
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


