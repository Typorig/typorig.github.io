"use strict";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const dropzone = document.getElementById("dropzone");
const canvasArea = document.getElementById("canvas-area");
const imageInput = document.getElementById("imageInput");
const downloadBtn = document.getElementById("downloadBtn");

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

/* ── Top bar buttons ── */
document.querySelectorAll(".top-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const action = btn.dataset.action;
    // Toggle active for tools
    document.querySelectorAll(".top-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    console.log("Top action:", action);
  });
});

/* ── Sidebar sections ── */
document.querySelectorAll(".sidebar-section").forEach((sec) => {
  sec.addEventListener("click", () => {
    document.querySelectorAll(".sidebar-section").forEach((s) => s.classList.remove("active"));
    sec.classList.add("active");
    console.log("Section:", sec.dataset.section);
  });
});
