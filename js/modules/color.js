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
  let lastBackground = null;

  function getGradientEndpointsForCssAngle(angleDeg, W, H) {
    const theta = (angleDeg * Math.PI) / 180;
    const dx = Math.sin(theta);
    const dy = -Math.cos(theta);
    const cx = W / 2;
    const cy = H / 2;

    const points = [];
    const pushIfValid = (x, y, t) => {
      if (x >= 0 && x <= W && y >= 0 && y <= H) {
        points.push({ x, y, t });
      }
    };

    if (dx !== 0) {
      const t0 = (0 - cx) / dx;
      pushIfValid(0, cy + t0 * dy, t0);
      const tW = (W - cx) / dx;
      pushIfValid(W, cy + tW * dy, tW);
    }

    if (dy !== 0) {
      const t0 = (0 - cy) / dy;
      pushIfValid(cx + t0 * dx, 0, t0);
      const tH = (H - cy) / dy;
      pushIfValid(cx + tH * dx, H, tH);
    }

    if (points.length < 2) {
      return { x1: 0, y1: 0, x2: W, y2: H };
    }

    points.sort((a, b) => a.t - b.t);
    const p1 = points[0];
    const p2 = points[points.length - 1];
    return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
  }

  function renderBackgroundFill(bgCtx, W, H, fill) {
    if (!fill) return;

    bgCtx.clearRect(0, 0, W, H);

    if (fill.kind === "solid") {
      bgCtx.fillStyle = fill.hex;
      bgCtx.fillRect(0, 0, W, H);
      return;
    }

    if (fill.kind === "preset") {
      const { x1, y1, x2, y2 } = getGradientEndpointsForCssAngle(fill.angleDeg, W, H);
      const gradient = bgCtx.createLinearGradient(x1, y1, x2, y2);
      const step = 1 / (fill.colors.length - 1);
      fill.colors.forEach((c, i) => gradient.addColorStop(i * step, c));
      bgCtx.fillStyle = gradient;
      bgCtx.fillRect(0, 0, W, H);
      return;
    }

    if (fill.kind === "custom") {
      const gradData = fill.data;
      if (gradData.type === "linear") {
        const x1 = gradData.startPoint.x * W;
        const y1 = gradData.startPoint.y * H;
        const x2 = gradData.endPoint.x * W;
        const y2 = gradData.endPoint.y * H;

        const grad = bgCtx.createLinearGradient(x1, y1, x2, y2);
        gradData.stops.forEach(s => grad.addColorStop(s.offset, s.color));
        bgCtx.fillStyle = grad;
        bgCtx.fillRect(0, 0, W, H);
      } else {
        bgCtx.fillStyle = "#000";
        bgCtx.fillRect(0, 0, W, H);
        bgCtx.globalCompositeOperation = "screen";
        gradData.meshPoints.forEach((stop) => {
          const x = stop.x * W;
          const y = stop.y * H;
          const baseRadius = Math.max(W, H) * 0.8;
          const r = baseRadius * (stop.radius !== undefined ? stop.radius : 1.0);

          const radGrad = bgCtx.createRadialGradient(x, y, 0, x, y, r);
          radGrad.addColorStop(0, stop.color);
          radGrad.addColorStop(1, "transparent");

          bgCtx.fillStyle = radGrad;
          bgCtx.fillRect(0, 0, W, H);
        });
        bgCtx.globalCompositeOperation = "source-over";
      }
    }
  }

  function updateSourceFromCanvas() {
    const canvas = document.getElementById("canvas");
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
    const textTransform = window.textTransform;
    const layerManager = window.layerManager || null;
    let targetLayer = textTransform ? textTransform.selectedLayer : null;
    if (!targetLayer || targetLayer.id === 0) {
      if (layerManager) {
        targetLayer = layerManager.layers.find(l => l.id === layerManager.activeLayerId && l.id !== 0);
      }
    }

    if (targetLayer && targetLayer.type === "text") {
      targetLayer.fontColor = hex;
      if (textTransform && typeof textTransform.redrawTextLayer === "function") {
        textTransform.redrawTextLayer(targetLayer);
      }
      if (layerManager) {
        layerManager.render();
      }
      if (textTransform && textTransform.selectedLayer === targetLayer && typeof textTransform.drawSelectionOverlay === "function") {
        textTransform.drawSelectionOverlay(targetLayer);
      }
      return;
    }

    const canvas = document.getElementById("canvas");
    lastBackground = { kind: "solid", hex };

    if (layerManager && typeof layerManager.getBackgroundLayer === "function") {
      const bg = layerManager.getBackgroundLayer();
      if (!bg) return;
      const W = canvas.width;
      const H = canvas.height;
      renderBackgroundFill(bg.ctx, W, H, lastBackground);
      layerManager.render();
      if (typeof window.updateLayerList === "function") window.updateLayerList();
      updateSourceFromCanvas();
      return;
    }

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = hex;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    updateSourceFromCanvas();
  }

  /* ── Helper tạo Gradient Fill cho Context ── */
  function createGradientFillForCtx(ctx, bounds, fill) {
    if (!fill || !bounds) return null;
    const x = bounds.x;
    const y = bounds.y;
    const w = bounds.width || 100;
    const h = bounds.height || 50;

    if (fill.kind === "preset") {
      const { x1, y1, x2, y2 } = getGradientEndpointsForCssAngle(fill.angleDeg, w, h);
      const gradient = ctx.createLinearGradient(x + x1, y + y1, x + x2, y + y2);
      const step = 1 / (fill.colors.length - 1);
      fill.colors.forEach((c, i) => gradient.addColorStop(i * step, c));
      return gradient;
    }

    if (fill.kind === "custom") {
      const gradData = fill.data;
      if (gradData.type === "linear") {
        const x1 = x + gradData.startPoint.x * w;
        const y1 = y + gradData.startPoint.y * h;
        const x2 = x + gradData.endPoint.x * w;
        const y2 = y + gradData.endPoint.y * h;
        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        gradData.stops.forEach(s => grad.addColorStop(s.offset, s.color));
        return grad;
      }
    }
    return null;
  }

  function renderMeshToCanvas(fill, width, height) {
    const offCanvas = document.createElement("canvas");
    offCanvas.width = Math.max(1, Math.round(width));
    offCanvas.height = Math.max(1, Math.round(height));
    const offCtx = offCanvas.getContext("2d");
    renderBackgroundFill(offCtx, offCanvas.width, offCanvas.height, fill);
    return offCanvas;
  }

  function createMeshPatternForBounds(ctx, bounds, fill) {
    if (!fill || !bounds) return null;
    const w = Math.max(1, Math.round(bounds.width));
    const h = Math.max(1, Math.round(bounds.height));
    const offCanvas = document.createElement("canvas");
    offCanvas.width = w;
    offCanvas.height = h;
    const offCtx = offCanvas.getContext("2d");
    renderBackgroundFill(offCtx, w, h, fill);

    const pattern = ctx.createPattern(offCanvas, "no-repeat");
    if (pattern && typeof DOMMatrix !== "undefined") {
      const matrix = new DOMMatrix().translate(bounds.x, bounds.y);
      pattern.setTransform(matrix);
    }
    return pattern;
  }

  /* ── Apply Gradient to canvas (vào Background layer hoặc Text layer) ── */
  function applyGradientConfig(gradData) {
    console.log("[ColorModule.applyGradientConfig] received gradData:", gradData);
    const textTransform = window.textTransform;
    const layerManager = window.layerManager || null;
    let targetLayer = textTransform ? textTransform.selectedLayer : null;
    if (!targetLayer || targetLayer.id === 0) {
      if (layerManager) {
        targetLayer = layerManager.layers.find(l => l.id === layerManager.activeLayerId && l.id !== 0);
      }
    }

    if (targetLayer && targetLayer.type === "text") {
      targetLayer.fontColor = { kind: "custom", data: JSON.parse(JSON.stringify(gradData)) };
      if (textTransform && typeof textTransform.redrawTextLayer === "function") {
        textTransform.redrawTextLayer(targetLayer);
      }
      if (layerManager) {
        layerManager.render();
      }
      if (textTransform && textTransform.selectedLayer === targetLayer && typeof textTransform.drawSelectionOverlay === "function") {
        textTransform.drawSelectionOverlay(targetLayer);
      }
      return;
    }

    const canvas = document.getElementById("canvas");
    if (!layerManager || typeof layerManager.getBackgroundLayer !== "function") return;

    const bg = layerManager.getBackgroundLayer();
    if (!bg) return;
    const W = canvas.width;
    const H = canvas.height;
    lastBackground = { kind: "custom", data: JSON.parse(JSON.stringify(gradData)) };
    renderBackgroundFill(bg.ctx, W, H, lastBackground);
    layerManager.render();
    if (typeof window.updateLayerList === "function") window.updateLayerList();

    // Update sourceImage
    updateSourceFromCanvas();
  }

  function applyGradient(preset) {
    console.log("[ColorModule.applyGradient] preset:", preset);
    if (preset.isCustom) {
      applyGradientConfig(preset.data);
      return;
    }

    const textTransform = window.textTransform;
    const layerManager = window.layerManager || null;
    let targetLayer = textTransform ? textTransform.selectedLayer : null;
    if (!targetLayer || targetLayer.id === 0) {
      if (layerManager) {
        targetLayer = layerManager.layers.find(l => l.id === layerManager.activeLayerId && l.id !== 0);
      }
    }

    const angleDeg = preset.colors.length > 2 ? 135 : 90;
    const gradFill = { kind: "preset", colors: [...preset.colors], angleDeg };

    if (targetLayer && targetLayer.type === "text") {
      targetLayer.fontColor = gradFill;
      if (textTransform && typeof textTransform.redrawTextLayer === "function") {
        textTransform.redrawTextLayer(targetLayer);
      }
      if (layerManager) {
        layerManager.render();
      }
      if (textTransform && textTransform.selectedLayer === targetLayer && typeof textTransform.drawSelectionOverlay === "function") {
        textTransform.drawSelectionOverlay(targetLayer);
      }
      return;
    }

    const canvas = document.getElementById("canvas");
    if (!layerManager || typeof layerManager.getBackgroundLayer !== "function") return;

    const bg = layerManager.getBackgroundLayer();
    if (!bg) return;
    const W = canvas.width;
    const H = canvas.height;
    lastBackground = gradFill;
    renderBackgroundFill(bg.ctx, W, H, lastBackground);
    layerManager.render();
    if (typeof window.updateLayerList === "function") window.updateLayerList();

    // Update sourceImage
    updateSourceFromCanvas();
  }

  function reapplyBackground(updateSourceImage = true) {
    const canvas = document.getElementById("canvas");
    const layerManager = window.layerManager || null;
    if (!canvas || !layerManager || typeof layerManager.getBackgroundLayer !== "function") return;

    const bg = layerManager.getBackgroundLayer();
    if (!bg) return;

    const W = canvas.width;
    const H = canvas.height;
    
    if (lastBackground) {
      renderBackgroundFill(bg.ctx, W, H, lastBackground);
    } else if (!window.hasRealImage && window.displayImage && window.displayImage.src.length > 100) {
      // If there's no lastBackground but we have an image, draw it
      bg.ctx.clearRect(0, 0, W, H);
      bg.ctx.drawImage(window.displayImage, 0, 0, W, H);
    } else {
      // Transparent
      bg.ctx.clearRect(0, 0, W, H);
    }
    
    layerManager.render();
    if (typeof window.updateLayerList === "function") window.updateLayerList();
    if (updateSourceImage) updateSourceFromCanvas();
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

    // Rebind property click for text properties if textPropsGroup exists
    const textPropsGroup = document.querySelector('.sub-group[data-section="text-props"]');
    if (textPropsGroup && window.textHandler && typeof window.textHandler.initEventListeners === "function") {
      // Re-trigger property checks if needed
    }
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

  return {
    open,
    close,
    isActive,
    addGradientPreset,
    reapplyBackground,
    createGradientFillForCtx,
    renderMeshToCanvas,
    createMeshPatternForBounds,
    get lastBackground() { return lastBackground; },
    set lastBackground(val) { lastBackground = val; }
  };
})();
