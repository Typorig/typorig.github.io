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

  const BUILT_IN_PRESETS = [
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

  // Custom gradients are persisted in localStorage
  let customPresets = [];

  function loadCustomGradients() {
    try {
      const saved = localStorage.getItem("typorig_custom_gradients");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) customPresets = parsed;
      }
    } catch (e) { /* ignore */ }
  }

  function saveCustomGradients() {
    try {
      localStorage.setItem("typorig_custom_gradients", JSON.stringify(customPresets));
    } catch (e) { /* ignore */ }
  }

  // Computed full list: custom first, then built-in
  function getAllPresets() {
    return [...customPresets, ...BUILT_IN_PRESETS];
  }

  // Initialize
  loadCustomGradients();

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
        if (!preset.dataset.colors && preset.dataset.index === undefined) return; // skip "+" btn
        preset.addEventListener("click", () => {
          if (preset.dataset.index !== undefined) {
            const idx = parseInt(preset.dataset.index);
            const gradPreset = getAllPresets()[idx];
            console.log("[ColorModule] Clicked preset:", gradPreset);
            applyGradient(gradPreset);
          } else {
            const colors = JSON.parse(preset.dataset.colors);
            applyGradient({ colors });
          }
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
    getAllPresets().forEach((g, idx) => {
      let bgStyle = "";
      if (g.isCustom && g.data) {
        if (g.data.type === "linear") {
          // Calculate angle for linear gradient
          const dx = g.data.endPoint.x - g.data.startPoint.x;
          const dy = g.data.endPoint.y - g.data.startPoint.y;
          let angle = Math.atan2(dy, dx) * (180 / Math.PI);
          // Convert math angle to CSS angle (0deg = up, 90deg = right)
          let cssAngle = angle + 90;
          
          const stopStrs = g.data.stops.map(s => `${s.color} ${Math.round(s.offset * 100)}%`).join(", ");
          bgStyle = `background:linear-gradient(${Math.round(cssAngle)}deg, ${stopStrs})`;
        } else {
          // Match the canvas screen blending with multiple radial gradients
          const bgImages = g.data.meshPoints.map(p => {
            const x = Math.round(p.x * 100);
            const y = Math.round(p.y * 100);
            // In canvas, baseRadius was 0.8 * max(w, h). Let's use 80% as base for CSS.
            const r = Math.round((p.radius !== undefined ? p.radius : 1.0) * 80);
            return `radial-gradient(circle at ${x}% ${y}%, ${p.color} 0%, transparent ${r}%)`;
          });
          bgStyle = `background-image:${bgImages.join(", ")}; background-color:#000; background-blend-mode:screen;`;
        }
      } else {
        const dir = g.colors.length > 2 ? "135deg" : "to right";
        const stops = g.colors.join(", ");
        bgStyle = `background:linear-gradient(${dir}, ${stops})`;
      }

      html += `
        <button class="gradient-preset" data-index="${idx}" title="${g.name}">
          <span class="gradient-preview" style="${bgStyle};"></span>
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

    canvas.width = canvas.width; // keep same size
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill with solid color — replaces everything
    ctx.fillStyle = hex;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update sourceImage to the new canvas content
    const dataUrl = canvas.toDataURL();
    const img = new Image();
    img.onload = () => {
      window.sourceImage = img;
      window.displayImage = img;
      if (typeof window.updateCropButtonState === "function") window.updateCropButtonState();
    };
    img.src = dataUrl;
    window.hasRealImage = false;
  }

  /* ── Apply Gradient to canvas ── */
  function applyGradientConfig(gradData) {
    console.log("[ColorModule.applyGradientConfig] received gradData:", gradData);
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    // Keep current dimensions
    const W = canvas.width || 1200;
    const H = canvas.height || 600;
    ctx.clearRect(0, 0, W, H);

    if (gradData.type === "linear") {
      const x1 = gradData.startPoint.x * W;
      const y1 = gradData.startPoint.y * H;
      const x2 = gradData.endPoint.x * W;
      const y2 = gradData.endPoint.y * H;

      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      gradData.stops.forEach(s => grad.addColorStop(s.offset, s.color));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "screen";
      gradData.meshPoints.forEach((stop) => {
        const x = stop.x * W;
        const y = stop.y * H;
        const baseRadius = Math.max(W, H) * 0.8;
        const r = baseRadius * (stop.radius !== undefined ? stop.radius : 1.0);

        const radGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
        radGrad.addColorStop(0, stop.color);
        radGrad.addColorStop(1, "transparent");

        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, W, H);
      });
      ctx.globalCompositeOperation = "source-over";
    }

    // Update sourceImage — replaces everything
    const dataUrl = canvas.toDataURL();
    const img = new Image();
    img.onload = () => {
      window.sourceImage = img;
      window.displayImage = img;
      if (typeof window.updateCropButtonState === "function") window.updateCropButtonState();
    };
    img.src = dataUrl;
    window.hasRealImage = false;
  }

  function applyGradient(preset) {
    console.log("[ColorModule.applyGradient] preset:", preset);
    if (preset.isCustom) {
      applyGradientConfig(preset.data);
      return;
    }

    // Default built-in presets — replaces everything
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const W = canvas.width || 1200;
    const H = canvas.height || 600;
    ctx.clearRect(0, 0, W, H);

    const gradient = ctx.createLinearGradient(0, 0, W, H);
    const step = 1 / (preset.colors.length - 1);
    preset.colors.forEach((c, i) => gradient.addColorStop(i * step, c));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Update sourceImage
    const dataUrl = canvas.toDataURL();
    const img = new Image();
    img.onload = () => {
      window.sourceImage = img;
      window.displayImage = img;
      if (typeof window.updateCropButtonState === "function") window.updateCropButtonState();
    };
    img.src = dataUrl;
    window.hasRealImage = false;
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
        if (sub === "bg-transparent") { openTransparent(); }
        if (sub === "bg-crop") { if (typeof CropModule !== "undefined") CropModule.open(); }
        if (sub === "bg-color") { ColorModule.open(); }
        if (sub === "bg-size" && typeof openSizePanel === "function") { openSizePanel(); }
      });
    });
  }

  /* ── Add custom gradient to presets list ── */
  function addGradientPreset(gradData, name) {
    customPresets.unshift({
      name: name || "Custom",
      isCustom: true,
      data: JSON.parse(JSON.stringify(gradData)) // deep copy
    });
    if (customPresets.length > 10) customPresets.pop(); // limit custom to 10
    saveCustomGradients(); // persist to localStorage
    if (isOpen && currentTab === "gradient") render();
  }

  function isActive() {
    return isOpen;
  }

  return { open, close, isActive, addGradientPreset };
})();
