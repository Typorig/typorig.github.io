"use strict";

/* ── Crop Module ── */
const CropModule = (() => {
  let isOpen = false;
  let savedHTML = "";

  // Crop drag state
  let dragState = null; // { mode: 'move'|'nw'|'ne'|'sw'|'se', startX, startY, startRect }
  let cropMode = "normal"; // "normal", "rounded", "circle"
  let borderRadius = 20; // default 20px

  function open() {
    if (!window.hasRealImage) {
      showPopup({
        title: "Crop",
        width: "360px",
        content: `<p style="color:#e74c3c;text-align:center;padding:16px 0;">❌ Crop is only available for real photos.<br>Please load an image first.</p>`
      });
      return;
    }

    const container = document.getElementById("sub-sidebar");
    if (!container) return;

    if (typeof ColorModule !== "undefined" && ColorModule.isActive()) {
      ColorModule.close();
    }

    if (!container.querySelector(".crop-panel")) {
      window._savedSubHTML = container.innerHTML;
    }

    isOpen = true;
    render();
  }

  function close() {
    console.log("close")
    isOpen = false;
    cropMode = "normal";
    borderRadius = 20;
    const container = document.getElementById("sub-sidebar");
    if (!container || !window._savedSubHTML) return;
    
    container.innerHTML = window._savedSubHTML;
    window._savedSubHTML = null;

    // Rebind background sub-items
    document.querySelectorAll(".sub-item").forEach((item) => {
      item.addEventListener("click", function() {
        document.querySelectorAll(".sub-item").forEach((i) => i.classList.remove("active"));
        this.classList.add("active");
        const sub = this.dataset.sub;
        if (sub === "bg-from-camera") typeof openCamera === "function" && openCamera();
        if (sub === "bg-from-upload") typeof openUpload === "function" && openUpload();
        if (sub === "bg-transparent") typeof openTransparent === "function" && openTransparent();
        if (sub === "bg-crop") CropModule.open();
        if (sub === "bg-color") typeof openColorPanel === "function" && openColorPanel();
        if (sub === "bg-size") typeof openSizePanel === "function" && openSizePanel();
      });
    });
  }

  /* ── Render: open a popup with crop interface ── */
  let cropPopup = null;

  function render() {
    // Actually use a popup for the crop tool (better visual space)
    cropPopup = showPopup({
      title: "Crop Image",
      width: "600px",
      maxHeight: "none",
      content: `
        <div class="crop-editor" style="display:flex;flex-direction:column;gap:12px;">
          <div id="crop-canvas-wrap" style="position:relative;background:#000;border-radius:6px;overflow:hidden;user-select:none;min-height:300px;display:flex;align-items:center;justify-content:center;">
            <div style="position:relative;display:inline-block;">
              <canvas id="crop-canvas" style="display:block;max-width:100%;max-height:60vh;"></canvas>
              <div id="crop-overlay" style="position:absolute;inset:0;pointer-events:none;">
                <svg id="crop-svg" style="width:100%;height:100%;display:block;">
                  <defs>
                    <mask id="crop-mask">
                      <rect width="100%" height="100%" fill="white" />
                      <rect id="crop-hole" x="10%" y="10%" width="80%" height="80%" fill="black" />
                    </mask>
                  </defs>
                  <rect width="100%" height="100%" fill="rgba(0,0,0,0.45)" mask="url(#crop-mask)" />
                  <!-- Visible Corner handles 4px thick -->
                  <path id="crop-handle-nw" d="" fill="none" stroke="#fff" stroke-width="4" style="pointer-events:none;" />
                  <path id="crop-handle-ne" d="" fill="none" stroke="#fff" stroke-width="4" style="pointer-events:none;" />
                  <path id="crop-handle-sw" d="" fill="none" stroke="#fff" stroke-width="4" style="pointer-events:none;" />
                  <path id="crop-handle-se" d="" fill="none" stroke="#fff" stroke-width="4" style="pointer-events:none;" />

                  <!-- Visible Edge handles 4px thick -->
                  <line id="crop-handle-n" x1="0" y1="0" x2="0" y2="0" stroke="#fff" stroke-width="4" style="pointer-events:none;" />
                  <line id="crop-handle-s" x1="0" y1="0" x2="0" y2="0" stroke="#fff" stroke-width="4" style="pointer-events:none;" />
                  <line id="crop-handle-w" x1="0" y1="0" x2="0" y2="0" stroke="#fff" stroke-width="4" style="pointer-events:none;" />
                  <line id="crop-handle-e" x1="0" y1="0" x2="0" y2="0" stroke="#fff" stroke-width="4" style="pointer-events:none;" />

                  <!-- Invisible Thick Hit Targets (32px thick) for easy clicking -->
                  <path id="crop-target-nw" d="" fill="none" stroke="transparent" stroke-width="32" style="cursor:nwse-resize;pointer-events:auto;" />
                  <path id="crop-target-ne" d="" fill="none" stroke="transparent" stroke-width="32" style="cursor:nesw-resize;pointer-events:auto;" />
                  <path id="crop-target-sw" d="" fill="none" stroke="transparent" stroke-width="32" style="cursor:nesw-resize;pointer-events:auto;" />
                  <path id="crop-target-se" d="" fill="none" stroke="transparent" stroke-width="32" style="cursor:nwse-resize;pointer-events:auto;" />
                  
                  <line id="crop-target-n" x1="0" y1="0" x2="0" y2="0" stroke="transparent" stroke-width="32" style="cursor:ns-resize;pointer-events:auto;" />
                  <line id="crop-target-s" x1="0" y1="0" x2="0" y2="0" stroke="transparent" stroke-width="32" style="cursor:ns-resize;pointer-events:auto;" />
                  <line id="crop-target-w" x1="0" y1="0" x2="0" y2="0" stroke="transparent" stroke-width="32" style="cursor:ew-resize;pointer-events:auto;" />
                  <line id="crop-target-e" x1="0" y1="0" x2="0" y2="0" stroke="transparent" stroke-width="32" style="cursor:ew-resize;pointer-events:auto;" />

                  <!-- Transparent rect for move -->
                  <rect id="crop-move-area" x="0" y="0" width="0" height="0" fill="transparent" style="cursor:move;pointer-events:auto;" />
                </svg>
              </div>
            </div>
          </div>
          
          <!-- Aspect Ratio Bar -->
          <div class="crop-aspect-container" style="display:flex;gap:8px;overflow-x:auto;padding:8px 0;border-bottom:1px solid #444;border-top:1px solid #444;user-select:none;scrollbar-width:thin;">
            <button class="aspect-btn active" data-ratio="free" style="padding:4px 10px;background:#333;border:1px solid #555;border-radius:4px;color:#ccc;cursor:pointer;font-size:11px;white-space:nowrap;">Free</button>
            <button class="aspect-btn" data-ratio="original" style="padding:4px 10px;background:#333;border:1px solid #555;border-radius:4px;color:#ccc;cursor:pointer;font-size:11px;white-space:nowrap;">Original</button>
            <button class="aspect-btn" data-ratio="custom" style="padding:4px 10px;background:#333;border:1px solid #555;border-radius:4px;color:#ccc;cursor:pointer;font-size:11px;white-space:nowrap;">Custom...</button>
            <button class="aspect-btn" data-ratio="1:1" style="padding:4px 10px;background:#333;border:1px solid #555;border-radius:4px;color:#ccc;cursor:pointer;font-size:11px;white-space:nowrap;">1:1</button>
            <button class="aspect-btn" data-ratio="9:16" style="padding:4px 10px;background:#333;border:1px solid #555;border-radius:4px;color:#ccc;cursor:pointer;font-size:11px;white-space:nowrap;">9:16</button>
            <button class="aspect-btn" data-ratio="16:9" style="padding:4px 10px;background:#333;border:1px solid #555;border-radius:4px;color:#ccc;cursor:pointer;font-size:11px;white-space:nowrap;">16:9</button>
            <button class="aspect-btn" data-ratio="4:5" style="padding:4px 10px;background:#333;border:1px solid #555;border-radius:4px;color:#ccc;cursor:pointer;font-size:11px;white-space:nowrap;">4:5</button>
            <button class="aspect-btn" data-ratio="5:4" style="padding:4px 10px;background:#333;border:1px solid #555;border-radius:4px;color:#ccc;cursor:pointer;font-size:11px;white-space:nowrap;">5:4</button>
            <button class="aspect-btn" data-ratio="3:4" style="padding:4px 10px;background:#333;border:1px solid #555;border-radius:4px;color:#ccc;cursor:pointer;font-size:11px;white-space:nowrap;">3:4</button>
            <button class="aspect-btn" data-ratio="4:3" style="padding:4px 10px;background:#333;border:1px solid #555;border-radius:4px;color:#ccc;cursor:pointer;font-size:11px;white-space:nowrap;">4:3</button>
            <button class="aspect-btn" data-ratio="2:3" style="padding:4px 10px;background:#333;border:1px solid #555;border-radius:4px;color:#ccc;cursor:pointer;font-size:11px;white-space:nowrap;">2:3</button>
            <button class="aspect-btn" data-ratio="3:2" style="padding:4px 10px;background:#333;border:1px solid #555;border-radius:4px;color:#ccc;cursor:pointer;font-size:11px;white-space:nowrap;">3:2</button>
            <button class="aspect-btn" data-ratio="5:7" style="padding:4px 10px;background:#333;border:1px solid #555;border-radius:4px;color:#ccc;cursor:pointer;font-size:11px;white-space:nowrap;">5:7</button>
            <button class="aspect-btn" data-ratio="7:5" style="padding:4px 10px;background:#333;border:1px solid #555;border-radius:4px;color:#ccc;cursor:pointer;font-size:11px;white-space:nowrap;">7:5</button>
            <button class="aspect-btn" data-ratio="1:2" style="padding:4px 10px;background:#333;border:1px solid #555;border-radius:4px;color:#ccc;cursor:pointer;font-size:11px;white-space:nowrap;">1:2</button>
            <button class="aspect-btn" data-ratio="2:1" style="padding:4px 10px;background:#333;border:1px solid #555;border-radius:4px;color:#ccc;cursor:pointer;font-size:11px;white-space:nowrap;">2:1</button>
          </div>

          <!-- Border Radius & Shape Controls -->
          <div style="display:flex;gap:12px;align-items:center;justify-content:center;user-select:none;">
            <!-- Group for Normal/Rounded/Circle modes -->
            <div id="crop-shape-modes" style="display:flex;gap:8px;align-items:center;">
              <button id="crop-mode-rounded" style="padding:6px 12px;background:#333;border:1px solid #555;border-radius:4px;color:#ccc;cursor:pointer;font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:4px;">
                <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h12c.55 0 1 .45 1 1v13z"/></svg>
                Rounded Corners
              </button>
              <button id="crop-mode-circle" style="padding:6px 12px;background:#333;border:1px solid #555;border-radius:4px;color:#ccc;cursor:pointer;font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:4px;">
                <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
                Circle
              </button>
            </div>

            <!-- Input area for Rounded mode (hidden initially) -->
            <div id="crop-radius-input-wrap" style="display:none;align-items:center;gap:8px;">
              <div id="crop-radius-inputs-only" style="display:inline-flex;align-items:center;gap:8px;">
                <span style="font-size:12px;color:#aaa;">Radius (px):</span>
                <input type="number" id="crop-radius-px" value="20" min="0" max="200" style="width:64px;background:#1e1e1e;border:1px solid #555;border-radius:4px;padding:4px 6px;color:#e0e0e0;font-size:12px;" />
              </div>
              <button id="crop-radius-reset" style="padding:4px 8px;background:#444;border:none;border-radius:4px;color:#ccc;cursor:pointer;font-size:11px;">Reset</button>
            </div>
          </div>

          <div style="display:flex;gap:12px;align-items:center;justify-content:center;">
            <button id="crop-confirm-btn" style="padding:8px 20px;background:#094771;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;font-weight:600;">✓ Apply Crop</button>
            <button id="crop-cancel-btn" style="padding:8px 20px;background:#555;color:#ccc;border:none;border-radius:4px;cursor:pointer;font-size:13px;">Cancel</button>
          </div>
        </div>
      `
    });

    // ── Initialize canvas with source image ──
    const canvas = document.getElementById("crop-canvas");
    const ctx = canvas.getContext("2d");
    const wrap = document.getElementById("crop-canvas-wrap");
    const srcImg = window.sourceImage;
    if (!srcImg) return;

    // Size canvas to fit
    const maxW = wrap.clientWidth - 2;
    const maxH = Math.min(window.innerHeight * 0.6, srcImg.height * (maxW / srcImg.width));
    const scale = Math.min(maxW / srcImg.width, maxH / srcImg.height, 1);
    const dispW = Math.round(srcImg.width * scale);
    const dispH = Math.round(srcImg.height * scale);
    canvas.width = dispW;
    canvas.height = dispH;

    // Ensure canvas fits inside wrap
    canvas.style.width = dispW + "px";
    canvas.style.height = dispH + "px";

    // Draw image
    ctx.drawImage(srcImg, 0, 0, dispW, dispH);

    // ── Crop rect in normalized 0-1 ──
    let crop = { x: 0.05, y: 0.05, w: 0.9, h: 0.9 };
    let currentRatio = "free"; // "free", "original", "custom", or numeric float

    const hole = document.getElementById("crop-hole");
    const hnw = document.getElementById("crop-handle-nw");
    const hne = document.getElementById("crop-handle-ne");
    const hsw = document.getElementById("crop-handle-sw");
    const hse = document.getElementById("crop-handle-se");
    const hn = document.getElementById("crop-handle-n");
    const hs = document.getElementById("crop-handle-s");
    const hw = document.getElementById("crop-handle-w");
    const he = document.getElementById("crop-handle-e");

    const tnw = document.getElementById("crop-target-nw");
    const tne = document.getElementById("crop-target-ne");
    const tsw = document.getElementById("crop-target-sw");
    const tse = document.getElementById("crop-target-se");
    const tn = document.getElementById("crop-target-n");
    const ts = document.getElementById("crop-target-s");
    const tw = document.getElementById("crop-target-w");
    const te = document.getElementById("crop-target-e");

    const moveArea = document.getElementById("crop-move-area");

    function updateCropUI() {
      const cw = canvas.width;
      const ch = canvas.height;

      const xp = crop.x * 100;
      const yp = crop.y * 100;
      const wp = crop.w * 100;
      const hp = crop.h * 100;
      
      // Calculate actual pixel coordinates of the crop box
      const x = crop.x * cw;
      const y = crop.y * ch;
      const w = crop.w * cw;
      const h = crop.h * ch;

      // Update hole using pixel values to support precise pixel border-radius
      hole.setAttribute("x", x);
      hole.setAttribute("y", y);
      hole.setAttribute("width", w);
      hole.setAttribute("height", h);

      if (cropMode === "circle") {
        hole.setAttribute("rx", w / 2);
        hole.setAttribute("ry", h / 2);
      } else if (cropMode === "rounded") {
        // Convert scale from original image back to display canvas for accurate scale preview
        const imgW = srcImg.width;
        const scaleFactor = cw / imgW;
        const displayRadius = borderRadius * scaleFactor;
        hole.setAttribute("rx", displayRadius);
        hole.setAttribute("ry", displayRadius);
      } else {
        hole.setAttribute("rx", 0);
        hole.setAttribute("ry", 0);
      }

      const len = 16; // Length of the corner bars

      // NW Corner: Top-left L-shape
      const nwPath = `M ${x} ${y + len} L ${x} ${y} L ${x + len} ${y}`;
      hnw.setAttribute("d", nwPath);
      tnw.setAttribute("d", nwPath);
      
      // NE Corner: Top-right L-shape
      const nePath = `M ${x + w - len} ${y} L ${x + w} ${y} L ${x + w} ${y + len}`;
      hne.setAttribute("d", nePath);
      tne.setAttribute("d", nePath);
      
      // SW Corner: Bottom-left L-shape
      const swPath = `M ${x} ${y + h - len} L ${x} ${y + h} L ${x + len} ${y + h}`;
      hsw.setAttribute("d", swPath);
      tsw.setAttribute("d", swPath);
      
      // SE Corner: Bottom-right L-shape
      const sePath = `M ${x + w - len} ${y + h} L ${x + w} ${y + h} L ${x + w} ${y + h - len}`;
      hse.setAttribute("d", sePath);
      tse.setAttribute("d", sePath);

      // Hide or show edge handles based on ratio
      if (currentRatio === "free") {
        hn.style.display = ""; hs.style.display = ""; hw.style.display = ""; he.style.display = "";
        tn.style.pointerEvents = "auto"; ts.style.pointerEvents = "auto";
        tw.style.pointerEvents = "auto"; te.style.pointerEvents = "auto";

        // Edge straight lines (centered on each edge, length 24px)
        const edgeLen = 24;
        
        // N Edge: horizontal line
        const nx1 = x + w/2 - edgeLen/2, ny1 = y, nx2 = x + w/2 + edgeLen/2, ny2 = y;
        hn.setAttribute("x1", nx1); hn.setAttribute("y1", ny1); hn.setAttribute("x2", nx2); hn.setAttribute("y2", ny2);
        tn.setAttribute("x1", nx1); tn.setAttribute("y1", ny1); tn.setAttribute("x2", nx2); tn.setAttribute("y2", ny2);
        
        // S Edge: horizontal line
        const sx1 = x + w/2 - edgeLen/2, sy1 = y + h, sx2 = x + w/2 + edgeLen/2, sy2 = y + h;
        hs.setAttribute("x1", sx1); hs.setAttribute("y1", sy1); hs.setAttribute("x2", sx2); hs.setAttribute("y2", sy2);
        ts.setAttribute("x1", sx1); ts.setAttribute("y1", sy1); ts.setAttribute("x2", sx2); ts.setAttribute("y2", sy2);
        
        // W Edge: vertical line
        const wx1 = x, wy1 = y + h/2 - edgeLen/2, wx2 = x, wy2 = y + h/2 + edgeLen/2;
        hw.setAttribute("x1", wx1); hw.setAttribute("y1", wy1); hw.setAttribute("x2", wx2); hw.setAttribute("y2", wy2);
        tw.setAttribute("x1", wx1); tw.setAttribute("y1", wy1); tw.setAttribute("x2", wx2); tw.setAttribute("y2", wy2);
        
        // E Edge: vertical line
        const ex1 = x + w, ey1 = y + h/2 - edgeLen/2, ex2 = x + w, ey2 = y + h/2 + edgeLen/2;
        he.setAttribute("x1", ex1); he.setAttribute("y1", ey1); he.setAttribute("x2", ex2); he.setAttribute("y2", ey2);
        te.setAttribute("x1", ex1); te.setAttribute("y1", ey1); te.setAttribute("x2", ex2); te.setAttribute("y2", ey2);
      } else {
        // Hide edges
        hn.style.display = "none"; hs.style.display = "none"; hw.style.display = "none"; he.style.display = "none";
        tn.style.pointerEvents = "none"; ts.style.pointerEvents = "none";
        tw.style.pointerEvents = "none"; te.style.pointerEvents = "none";
      }

      moveArea.setAttribute("x", xp + "%");
      moveArea.setAttribute("y", yp + "%");
      moveArea.setAttribute("width", wp + "%");
      moveArea.setAttribute("height", hp + "%");
    }

    updateCropUI();

    // ── Drag logic ──
    function startDrag(e, mode) {
      e.preventDefault();
      const rect = wrap.getBoundingClientRect();
      dragState = {
        mode,
        startX: e.clientX,
        startY: e.clientY,
        crop: { x: crop.x, y: crop.y, w: crop.w, h: crop.h }
      };

      function onMove(me) {
        const dx = (me.clientX - dragState.startX) / rect.width;
        const dy = (me.clientY - dragState.startY) / rect.height;
        const c = dragState.crop;
        const MIN = 0.05;

        // Image canvas aspect ratio factor (e.g. 2:1 is 2.0)
        const canvasAspect = canvas.width / canvas.height;

        if (mode === "move") {
          crop.x = Math.max(0, Math.min(1 - c.w, c.x + dx));
          crop.y = Math.max(0, Math.min(1 - c.h, c.y + dy));
        } else {
          if (currentRatio === "free") {
            // Free crop (original behavior)
            if (mode === "nw") {
              crop.x = Math.max(0, Math.min(c.x + c.w - MIN, c.x + dx));
              crop.y = Math.max(0, Math.min(c.y + c.h - MIN, c.y + dy));
              crop.w = c.x + c.w - crop.x;
              crop.h = c.y + c.h - crop.y;
            } else if (mode === "ne") {
              crop.y = Math.max(0, Math.min(c.y + c.h - MIN, c.y + dy));
              crop.w = Math.max(MIN, c.w + dx);
              crop.h = c.y + c.h - crop.y;
            } else if (mode === "sw") {
              crop.x = Math.max(0, Math.min(c.x + c.w - MIN, c.x + dx));
              crop.w = c.x + c.w - crop.x;
              crop.h = Math.max(MIN, c.h + dy);
            } else if (mode === "se") {
              crop.w = Math.max(MIN, c.w + dx);
              crop.h = Math.max(MIN, c.h + dy);
            } else if (mode === "n") {
              crop.y = Math.max(0, Math.min(c.y + c.h - MIN, c.y + dy));
              crop.h = c.y + c.h - crop.y;
            } else if (mode === "s") {
              crop.h = Math.max(MIN, c.h + dy);
            } else if (mode === "w") {
              crop.x = Math.max(0, Math.min(c.x + c.w - MIN, c.x + dx));
              crop.w = c.x + c.w - crop.x;
            } else if (mode === "e") {
              crop.w = Math.max(MIN, c.w + dx);
            }
          } else {
            // Lock aspect ratio crop (Only corner handles used)
            let targetRatio = 1.0;
            if (currentRatio === "original") {
              targetRatio = srcImg.width / srcImg.height;
            } else {
              targetRatio = currentRatio; // numerical value (e.g. 16/9)
            }

            // Normalise targetRatio relative to canvas aspect ratio
            const r = targetRatio / canvasAspect;

            if (mode === "se") {
              const maxScale = Math.min(1 - c.x, (1 - c.y) * r);
              const scale = Math.max(MIN, Math.min(maxScale, c.w + dx));
              crop.w = scale;
              crop.h = scale / r;
            } else if (mode === "nw") {
              const maxScale = Math.min(c.x + c.w, (c.y + c.h) * r);
              const scale = Math.max(MIN, Math.min(maxScale, c.w - dx));
              crop.x = c.x + c.w - scale;
              crop.y = c.y + c.h - (scale / r);
              crop.w = scale;
              crop.h = scale / r;
            } else if (mode === "ne") {
              const maxScale = Math.min(1 - c.x, (c.y + c.h) * r);
              const scale = Math.max(MIN, Math.min(maxScale, c.w + dx));
              crop.y = c.y + c.h - (scale / r);
              crop.w = scale;
              crop.h = scale / r;
            } else if (mode === "sw") {
              const maxScale = Math.min(c.x + c.w, (1 - c.y) * r);
              const scale = Math.max(MIN, Math.min(maxScale, c.w - dx));
              crop.x = c.x + c.w - scale;
              crop.w = scale;
              crop.h = scale / r;
            }
          }
        }
        updateCropUI();
      }

      function onUp() {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        dragState = null;
      }

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    }

    // ── Handle Ratio Changes ──
    function applyRatio(ratioStr) {
      const canvasAspect = canvas.width / canvas.height;
      if (ratioStr === "free") {
        currentRatio = "free";
      } else if (ratioStr === "original") {
        currentRatio = "original";
        const targetRatio = srcImg.width / srcImg.height;
        const r = targetRatio / canvasAspect;
        // Fit largest possible box with ratio
        if (r > 1) { // wider than canvas
          crop.w = 0.9;
          crop.h = 0.9 / r;
        } else {
          crop.h = 0.9;
          crop.w = 0.9 * r;
        }
        crop.x = (1 - crop.w) / 2;
        crop.y = (1 - crop.h) / 2;
      } else if (ratioStr === "custom") {
        // Create custom HTML input dialog instead of prompt()
        showPopup({
          title: "Custom Aspect Ratio",
          width: "320px",
          content: `
            <div style="display:flex;flex-direction:column;gap:12px;">
              <div style="display:flex;gap:8px;align-items:center;">
                <div style="flex:1;">
                  <span style="font-size:10px;color:#888;">Width</span>
                  <input type="number" id="custom-ratio-w" value="4" min="1" style="width:100%;background:#1e1e1e;border:1px solid #555;border-radius:4px;padding:6px 8px;color:#e0e0e0;font-size:13px;" />
                </div>
                <span style="color:#777;line-height:32px;margin-top:14px;">:</span>
                <div style="flex:1;">
                  <span style="font-size:10px;color:#888;">Height</span>
                  <input type="number" id="custom-ratio-h" value="3" min="1" style="width:100%;background:#1e1e1e;border:1px solid #555;border-radius:4px;padding:6px 8px;color:#e0e0e0;font-size:13px;" />
                </div>
              </div>
              <button id="custom-ratio-confirm" style="padding:8px;background:#094771;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:600;font-size:12px;margin-top:8px;">Set Ratio</button>
            </div>
          `
        });

        document.getElementById("custom-ratio-confirm").addEventListener("click", () => {
          const nw = parseFloat(document.getElementById("custom-ratio-w").value);
          const nh = parseFloat(document.getElementById("custom-ratio-h").value);
          if (nw > 0 && nh > 0) {
            const targetRatio = nw / nh;
            currentRatio = targetRatio;
            const r = targetRatio / canvasAspect;
            if (r > 1) {
              crop.w = 0.9;
              crop.h = 0.9 / r;
            } else {
              crop.h = 0.9;
              crop.w = 0.9 * r;
            }
            crop.x = (1 - crop.w) / 2;
            crop.y = (1 - crop.h) / 2;
            updateCropUI();
          }
          
          // Close the custom ratio popup (nested)
          // Find the second overlay (topmost) and remove it
          const overlays = document.querySelectorAll(".popup-overlay");
          if (overlays.length > 1) {
            overlays[overlays.length - 1].remove();
          }
        });
      } else {
        // Numeric formats like "1:1", "16:9"
        const parts = ratioStr.split(":");
        const nw = parseFloat(parts[0]);
        const nh = parseFloat(parts[1]);
        const targetRatio = nw / nh;
        currentRatio = targetRatio;
        const r = targetRatio / canvasAspect;
        if (r > 1) {
          crop.w = 0.9;
          crop.h = 0.9 / r;
        } else {
          crop.h = 0.9;
          crop.w = 0.9 * r;
        }
        crop.x = (1 - crop.w) / 2;
        crop.y = (1 - crop.h) / 2;
      }
      updateCropUI();
    }

    document.querySelectorAll(".aspect-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".aspect-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        
        // Highlight active visually using style
        document.querySelectorAll(".aspect-btn").forEach(b => {
          b.style.background = "#333";
          b.style.color = "#ccc";
        });
        btn.style.background = "#094771";
        btn.style.color = "#fff";

        applyRatio(btn.dataset.ratio);
      });
    });

    // ── Shape & Radius handlers ──
    const modeRoundedBtn = document.getElementById("crop-mode-rounded");
    const modeCircleBtn = document.getElementById("crop-mode-circle");
    const radiusInputWrap = document.getElementById("crop-radius-input-wrap");
    const radiusInputsOnly = document.getElementById("crop-radius-inputs-only");
    const radiusInput = document.getElementById("crop-radius-px");
    const radiusResetBtn = document.getElementById("crop-radius-reset");

    modeRoundedBtn.addEventListener("click", () => {
      if (cropMode === "rounded") {
        // Toggle off back to normal
        resetShapeMode();
      } else {
        cropMode = "rounded";
        modeCircleBtn.style.display = "none";
        radiusInputWrap.style.display = "inline-flex";
        radiusInputsOnly.style.display = "inline-flex"; // Show input
        modeRoundedBtn.style.background = "#094771";
        modeRoundedBtn.style.color = "#fff";
        updateCropUI();
      }
    });

    modeCircleBtn.addEventListener("click", () => {
      if (cropMode === "circle") {
        resetShapeMode();
      } else {
        cropMode = "circle";
        modeRoundedBtn.style.display = "none";
        modeCircleBtn.style.background = "#094771";
        modeCircleBtn.style.color = "#fff";
        radiusInputWrap.style.display = "inline-flex";
        radiusInputsOnly.style.display = "none"; // Hide Radius label and input
        updateCropUI();
      }
    });

    radiusInput.addEventListener("input", () => {
      borderRadius = parseFloat(radiusInput.value) || 0;
      updateCropUI();
    });

    function resetShapeMode() {
      cropMode = "normal";
      modeRoundedBtn.style.display = "inline-flex";
      modeCircleBtn.style.display = "inline-flex";
      radiusInputWrap.style.display = "none";
      radiusInputsOnly.style.display = "inline-flex"; // restore display
      modeRoundedBtn.style.background = "#333";
      modeRoundedBtn.style.color = "#ccc";
      modeCircleBtn.style.background = "#333";
      modeCircleBtn.style.color = "#ccc";
      updateCropUI();
    }

    radiusResetBtn.addEventListener("click", resetShapeMode);

    tnw.addEventListener("mousedown", (e) => startDrag(e, "nw"));
    tne.addEventListener("mousedown", (e) => startDrag(e, "ne"));
    tsw.addEventListener("mousedown", (e) => startDrag(e, "sw"));
    tse.addEventListener("mousedown", (e) => startDrag(e, "se"));
    tn.addEventListener("mousedown", (e) => startDrag(e, "n"));
    ts.addEventListener("mousedown", (e) => startDrag(e, "s"));
    tw.addEventListener("mousedown", (e) => startDrag(e, "w"));
    te.addEventListener("mousedown", (e) => startDrag(e, "e"));
    moveArea.addEventListener("mousedown", (e) => startDrag(e, "move"));

    // ── Buttons ──
    document.getElementById("crop-confirm-btn").addEventListener("click", () => {
      applyCrop(crop, dispW, dispH, scale);
    });

    document.getElementById("crop-cancel-btn").addEventListener("click", () => {
      if (cropPopup) cropPopup.close();
    });
  }

  function applyCrop(crop, dispW, dispH, scale) {
    try {
      const mainCanvas = document.getElementById("canvas");
      const mainCtx = mainCanvas.getContext("2d");
      const srcImg = window.sourceImage;
      if (!srcImg) return;

      // Convert normalized crop to actual image coordinates
      const imgW = srcImg.width;
      const imgH = srcImg.height;
      
      const factorX = imgW / dispW;
      const factorY = imgH / dispH;
      
      const sx = Math.round(crop.x * dispW * factorX);
      const sy = Math.round(crop.y * dispH * factorY);
      const sw = Math.round(crop.w * dispW * factorX);
      const sh = Math.round(crop.h * dispH * factorY);

      mainCanvas.width = sw;
      mainCanvas.height = sh;
      mainCtx.clearRect(0, 0, sw, sh);

      // Save context for clipping
      mainCtx.save();
      
      // Define path for clipping
      mainCtx.beginPath();
      if (cropMode === "circle") {
        // Draw ellipse inside the crop box
        mainCtx.ellipse(sw / 2, sh / 2, sw / 2, sh / 2, 0, 0, Math.PI * 2);
        mainCtx.clip();
      } else if (cropMode === "rounded" && borderRadius > 0) {
        if (typeof mainCtx.roundRect === "function") {
          mainCtx.roundRect(0, 0, sw, sh, borderRadius);
        } else {
          // Fallback path drawing for roundRect if not supported
          const r = Math.min(borderRadius, sw / 2, sh / 2);
          mainCtx.moveTo(r, 0);
          mainCtx.lineTo(sw - r, 0);
          mainCtx.quadraticCurveTo(sw, 0, sw, r);
          mainCtx.lineTo(sw, sh - r);
          mainCtx.quadraticCurveTo(sw, sh, sw - r, sh);
          mainCtx.lineTo(r, sh);
          mainCtx.quadraticCurveTo(0, sh, 0, sh - r);
          mainCtx.lineTo(0, r);
          mainCtx.quadraticCurveTo(0, 0, r, 0);
        }
        mainCtx.clip();
      }

      // Draw the cropped image inside clip
      mainCtx.drawImage(srcImg, sx, sy, sw, sh, 0, 0, sw, sh);
      mainCtx.restore();

      const dataUrl = mainCanvas.toDataURL();
      const newImg = new Image();
      newImg.onload = () => {
        window.sourceImage = newImg;
        window.displayImage = newImg;
        if (typeof window.render === "function") window.render();
      };
      newImg.src = dataUrl;
    } catch (e) {
      console.error("Crop error:", e);
      alert("Error cropping image: " + e.message);
    } finally {
      if (cropPopup) cropPopup.close();
    }
  }

  function isActive() {
    return isOpen;
  }

  return { open, close, isActive };
})();
