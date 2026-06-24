"use strict";

/* ── Color Module ── */
const ColorModule = (() => {
  /* ── Palette data ── */
  const MONOCHROME_COLORS = [
    { name: "White",      hex: "#ffffff" },
    { name: "Light Gray", hex: "#d9d9d9" },
    { name: "Gray",       hex: "#808080" },
    { name: "Dark Gray",  hex: "#404040" },
    { name: "Black",      hex: "#000000" },
    { name: "Red",        hex: "#ff0000" },
    { name: "Dark Red",   hex: "#8b0000" },
    { name: "Maroon",     hex: "#800000" },
    { name: "Orange",     hex: "#ffa500" },
    { name: "Dark Orange",hex: "#cc5500" },
    { name: "Yellow",     hex: "#ffff00" },
    { name: "Olive",      hex: "#808000" },
    { name: "Lime",       hex: "#00ff00" },
    { name: "Green",      hex: "#008000" },
    { name: "Dark Green", hex: "#006400" },
    { name: "Cyan",       hex: "#00ffff" },
    { name: "Teal",       hex: "#008080" },
    { name: "Blue",       hex: "#0000ff" },
    { name: "Navy",       hex: "#000080" },
    { name: "Indigo",     hex: "#4b0082" },
    { name: "Purple",     hex: "#800080" },
    { name: "Magenta",    hex: "#ff00ff" },
    { name: "Pink",       hex: "#ffc0cb" },
    { name: "Brown",      hex: "#a52a2a" },
  ];

  const GRADIENT_PRESETS = [
    { name: "Sunset",        colors: ["#ff7e5f", "#feb47b"] },
    { name: "Ocean",         colors: ["#2193b0", "#6dd5ed"] },
    { name: "Forest",        colors: ["#134e5e", "#71b280"] },
    { name: "Lavender",      colors: ["#c471ed", "#f7797d"] },
    { name: "Peach",         colors: ["#f093fb", "#f5576c"] },
    { name: "Midnight",      colors: ["#0f0c29", "#302b63", "#24243e"] },
    { name: "Neon",          colors: ["#00f260", "#0575e6"] },
    { name: "Golden",        colors: ["#f7971e", "#ffd200"] },
    { name: "Grayscale",     colors: ["#bdc3c7", "#2c3e50"] },
    { name: "Rainbow",       colors: ["#ff0000", "#ffff00", "#00ff00", "#00ffff", "#0000ff", "#ff00ff"] },
    { name: "Fire",          colors: ["#ff4b1f", "#ff9068"] },
    { name: "Ice",           colors: ["#00b4db", "#0083b0"] },
    { name: "Mint",          colors: ["#11998e", "#38ef7d"] },
    { name: "Twilight",      colors: ["#a8edea", "#fed6e3"] },
    { name: "Coral",         colors: ["#fc5c7d", "#6a82fb"] },
  ];

  let currentTab = "monochrome";
  let isOpen = false;
  let savedHTML = ""; // snapshot of original sub-sidebar HTML

  /* ── Render ── */
  function render() {
    const container = document.getElementById("sub-sidebar");
    if (!container) return;

    container.innerHTML = `
      <div class="color-back">
        <button id="color-back-btn" class="sub-item" style="margin-bottom:4px;">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
          <span>Back</span>
        </button>
      </div>
      <div class="color-tabs">
        <button class="color-tab ${currentTab === "monochrome" ? "active" : ""}" data-tab="monochrome">Monochrome</button>
        <button class="color-tab ${currentTab === "gradient" ? "active" : ""}" data-tab="gradient">Gradient</button>
      </div>
      <div class="color-content" style="flex:1;overflow-y:auto;">
        ${currentTab === "monochrome" ? renderMonochrome() : renderGradient()}
      </div>
    `;

    // Bind events
    document.getElementById("color-back-btn").addEventListener("click", close);

    document.querySelectorAll(".color-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".color-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        currentTab = tab.dataset.tab;
        render();
      });
    });

    // Monochrome: color swatch clicks
    if (currentTab === "monochrome") {
      // "+" button → open native color picker
      const plusBtn = document.getElementById("mono-plus-btn");
      if (plusBtn) {
        plusBtn.addEventListener("click", () => {
          // Create temporary input
          const input = document.createElement("input");
          input.type = "color";
          input.value = "#ffffff";
          input.addEventListener("input", () => {
            applyColor(input.value);
          });
          input.click();
        });
      }

      document.querySelectorAll(".color-swatch").forEach((swatch) => {
        if (!swatch.dataset.color) return; // skip "+" btn
        swatch.addEventListener("click", () => {
          const hex = swatch.dataset.color;
          applyColor(hex);
        });
      });
    }

    // Gradient: preset clicks
    if (currentTab === "gradient") {
      // "+" button → custom gradient popup
      const plusBtn = document.getElementById("gradient-plus-btn");
      if (plusBtn) {
        plusBtn.addEventListener("click", () => {
          if (typeof GradientModule !== "undefined") {
            GradientModule.open();
          }
        });
      }

      document.querySelectorAll(".gradient-preset").forEach((preset) => {
        if (!preset.dataset.colors) return; // skip "+" btn
        preset.addEventListener("click", () => {
          const colors = JSON.parse(preset.dataset.colors);
          applyGradient(colors);
        });
      });
    }
  }

  function renderMonochrome() {
    let html = `
      <div style="margin-top:4px;font-size:11px;color:#999;margin-bottom:6px;">Custom Color</div>
      <div class="color-grid">
        <button class="color-swatch color-plus" id="mono-plus-btn" title="Custom color picker">
          <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        </button>
    `;
    MONOCHROME_COLORS.forEach((c) => {
      html += `<button class="color-swatch" data-color="${c.hex}" title="${c.name}" style="background:${c.hex};${isLightColor(c.hex) ? 'border:1px solid #666;' : ''}"></button>`;
    });
    html += `</div>`;
    return html;
  }

  function renderGradient() {
    let html = `
      <div style="font-size:11px;color:#999;margin-bottom:6px;">Custom Gradient</div>
      <button class="gradient-preset" id="gradient-plus-btn" title="Create custom gradient">
        <span class="gradient-plus-icon" style="width:36px;height:24px;border-radius:4px;border:1px solid #555;display:flex;align-items:center;justify-content:center;background:#333;">
          <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        </span>
        <span class="gradient-name" style="color:#999;">Custom...</span>
      </button>
      <div style="margin-top:8px;font-size:11px;color:#999;margin-bottom:6px;">Presets</div>
      <div class="gradient-grid">
    `;
    GRADIENT_PRESETS.forEach((g) => {
      const dir = g.colors.length > 2 ? "135deg" : "to right";
      const stops = g.colors.join(", ");
      html += `
        <button class="gradient-preset" data-colors='${JSON.stringify(g.colors)}' title="${g.name}">
          <span class="gradient-preview" style="background:linear-gradient(${dir}, ${stops});"></span>
          <span class="gradient-name">${g.name}</span>
        </button>
      `;
    });
    html += `</div>`;
    return html;
  }

  /* ── Helpers ── */
  function isLightColor(hex) {
    const c = hex.replace("#", "");
    const r = parseInt(c.substr(0,2), 16);
    const g = parseInt(c.substr(2,2), 16);
    const b = parseInt(c.substr(4,2), 16);
    return (r*299 + g*587 + b*114) / 1000 > 160;
  }

  /* ── Apply to canvas ── */
  function applyColor(hex) {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const sourceImage = window.sourceImage; // from app.js
    if (!sourceImage) return;

    // Composite: draw source over the solid color
    canvas.width = sourceImage.width;
    canvas.height = sourceImage.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill background with color
    ctx.fillStyle = hex;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw original image on top
    ctx.drawImage(sourceImage, 0, 0);
  }

  function applyGradient(colors) {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const sourceImage = window.sourceImage;
    if (!sourceImage) return;

    canvas.width = sourceImage.width;
    canvas.height = sourceImage.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    const step = 1 / (colors.length - 1);
    colors.forEach((c, i) => gradient.addColorStop(i * step, c));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw original image on top
    ctx.drawImage(sourceImage, 0, 0);
  }

  /* ── Open / Close ── */
  function open() {
    currentTab = "monochrome";
    const container = document.getElementById("sub-sidebar");
    if (!container) return;
    // Save HTML only first time or when switching sections
    if (!container.querySelector(".color-tabs")) {
      savedHTML = container.innerHTML;
    }
    isOpen = true;
    render();
  }

  function close() {
    isOpen = false;
    const container = document.getElementById("sub-sidebar");
    if (!container) return;
    container.innerHTML = savedHTML;
    // Rebind sub-item events
    document.querySelectorAll(".sub-item").forEach((item) => {
      item.addEventListener("click", function subClick() {
        document.querySelectorAll(".sub-item").forEach((i) => i.classList.remove("active"));
        this.classList.add("active");
        const sub = this.dataset.sub;
        console.log("Sub action:", sub);
        if (sub === "bg-from-camera") { openCamera(); }
        if (sub === "bg-from-upload") { openUpload(); }
        if (sub === "bg-color") { ColorModule.open(); }
      });
    });
  }

  function isActive() {
    return isOpen;
  }

  return { open, close, isActive };
})();
