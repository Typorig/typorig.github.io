"use strict";

/* ── Custom Gradient Module ── */
const GradientModule = (() => {
  // Common state
  let type = "linear"; // "linear" or "radial"

  // Linear mode state (1D stops mapped on 2D line S -> E)
  let stops1D = [
    { offset: 0, color: "#ff0000", radius: 0.1 },
    { offset: 1, color: "#0000ff", radius: 0.1 }
  ];
  let selectedStop1DIdx = 0;
  let startPoint = { x: 0.1, y: 0.5 };
  let endPoint = { x: 0.9, y: 0.5 };

  // Radial mode state (Independent 2D mesh points)
  let meshPoints = [
    { x: 0.2, y: 0.2, color: "#ff0000", radius: 1.0 },
    { x: 0.8, y: 0.2, color: "#0000ff", radius: 1.0 },
    { x: 0.5, y: 0.8, color: "#00ff00", radius: 1.0 }
  ];
  let selectedMeshIdx = 0;

  function open() {
    showPopup({
      title: "Gradient Editor",
      width: "540px",
      maxHeight: "none",
      content: `
        <div class="grad-editor-container" style="display:flex;flex-direction:column;gap:16px;">
          <!-- 1. Type selector -->
          <div style="display:flex;gap:4px;">
            <button id="cg-type-linear" class="color-tab ${type === "linear" ? "active" : ""}" style="flex:1;">Linear (S ➔ E)</button>
            <button id="cg-type-radial" class="color-tab ${type === "radial" ? "active" : ""}" style="flex:1;">Circular (Radial Mesh)</button>
          </div>

          <!-- 2. Interactive Canvas Area -->
          <div id="grad-canvas-wrapper" style="position:relative;height:180px;background:#111;border-radius:8px;border:1px solid #555;overflow:hidden;user-select:none;">
            <canvas id="grad-preview-canvas" style="width:100%;height:100%;display:block;"></canvas>
            <div id="grad-handles-container"></div>
          </div>

          <!-- 3. Linear-only Color Stops distribution bar -->
          <div id="cg-linear-distribution" style="display:none;flex-direction:column;position:relative;">
            <div class="grad-slider-container" style="position:relative;height:30px;user-select:none;">
              <div id="grad-bar" style="position:absolute;top:4px;left:10px;right:10px;height:16px;border-radius:4px;border:1px solid #555;box-shadow:inset 0 1px 3px rgba(0,0,0,0.5);"></div>
              <div id="grad-stops-container" style="position:absolute;top:0;left:0;right:0;height:24px;"></div>
            </div>
          </div>

          <!-- 4. Stop controls (+, -, reverse) -->
          <div style="display:flex;gap:12px;justify-content:center;">
            <button id="cg-btn-add" class="top-btn" style="border:1px solid #444;padding:6px 12px;"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg><span id="cg-add-text">Add Stop</span></button>
            <button id="cg-btn-remove" class="top-btn" style="border:1px solid #444;padding:6px 12px;"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 13H5v-2h14v2z"/></svg><span id="cg-remove-text">Remove Stop</span></button>
            <button id="cg-btn-reverse" class="top-btn" style="border:1px solid #444;padding:6px 12px;"><svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z"/></svg><span>Reverse</span></button>
          </div>

          <!-- 5. Config panel for active selection -->
          <div id="cg-stop-config" style="background:#222;padding:12px;border-radius:6px;border:1px solid #444;">
            <div style="display:flex;gap:12px;align-items:flex-end;">
              <div style="flex:1;">
                <label style="font-size:11px;color:#999;display:block;margin-bottom:4px;">Color</label>
                <input type="color" id="cg-stop-color" value="#ffffff" style="width:100%;height:32px;border:1px solid #555;border-radius:4px;background:#1e1e1e;cursor:pointer;padding:2px;" />
              </div>
              <div id="cg-coords-display" style="display:none;flex:1;flex-direction:column;">
                <label style="font-size:11px;color:#999;display:block;margin-bottom:4px;">Coordinates</label>
                <div style="font-family:monospace;font-size:12px;color:#ccc;background:#1e1e1e;padding:6px 8px;border-radius:4px;border:1px solid #555;height:32px;display:flex;align-items:center;justify-content:center;" id="cg-coords-val">
                  X: --, Y: --
                </div>
              </div>
            </div>
            <!-- Unified Spread / Radius % slider for active color stop -->
            <div style="margin-top:12px;" id="cg-spread-container">
              <div style="display:flex;justify-content:space-between;font-size:11px;color:#999;margin-bottom:4px;">
                <span>Spread / Radius (%)</span>
                <span id="cg-spread-val">10%</span>
              </div>
              <input type="range" id="cg-spread-range" min="10" max="250" value="10" style="width:100%;" />
            </div>
          </div>

          <!-- 6. Bottom action -->
          <div style="display:flex;gap:10px;align-items:center;">
            <button id="cg-apply-btn" style="padding:8px 14px;background:#094771;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;font-weight:600;">✓ Apply</button>
            <button id="cg-cancel-btn" style="padding:8px 14px;background:#555;color:#ccc;border:none;border-radius:4px;cursor:pointer;font-size:13px;">Cancel</button>
          </div>
        </div>
      `
    });

    bindEvents();
    updateUI();
  }

  function bindEvents() {
    const tabLinear = document.getElementById("cg-type-linear");
    const tabRadial = document.getElementById("cg-type-radial");

    tabLinear.addEventListener("click", () => {
      tabLinear.classList.add("active");
      tabRadial.classList.remove("active");
      type = "linear";
      updateUI();
    });

    tabRadial.addEventListener("click", () => {
      tabRadial.classList.add("active");
      tabLinear.classList.remove("active");
      type = "radial";
      updateUI();
    });

    // Add Stop/Point
    document.getElementById("cg-btn-add").addEventListener("click", () => {
      if (type === "linear") {
        if (stops1D.length >= 8) return;
        const last = stops1D[stops1D.length - 1];
        const offset = Math.min(1, last ? last.offset + 0.1 : 0.5);
        stops1D.push({ offset, color: "#ffffff", radius: 0.1 });
        stops1D.sort((a, b) => a.offset - b.offset);
        selectedStop1DIdx = stops1D.findIndex(s => s.offset === offset);
      } else {
        if (meshPoints.length >= 10) return;
        const rx = 0.3 + Math.random() * 0.4;
        const ry = 0.3 + Math.random() * 0.4;
        const randColor = "#" + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        meshPoints.push({ x: rx, y: ry, color: randColor, radius: 1.0 });
        selectedMeshIdx = meshPoints.length - 1;
      }
      updateUI();
    });

    // Remove Stop/Point
    document.getElementById("cg-btn-remove").addEventListener("click", () => {
      if (type === "linear") {
        if (stops1D.length <= 2) return;
        stops1D.splice(selectedStop1DIdx, 1);
        selectedStop1DIdx = Math.max(0, selectedStop1DIdx - 1);
      } else {
        if (meshPoints.length <= 1) return;
        meshPoints.splice(selectedMeshIdx, 1);
        selectedMeshIdx = Math.max(0, selectedMeshIdx - 1);
      }
      updateUI();
    });

    // Reverse (Linear & Radial support)
    document.getElementById("cg-btn-reverse").addEventListener("click", () => {
      if (type === "linear") {
        stops1D.forEach(s => s.offset = 1 - s.offset);
        stops1D.reverse();
      } else {
        // Reverse colors order of radial mesh points
        const colors = meshPoints.map(p => p.color).reverse();
        meshPoints.forEach((p, idx) => p.color = colors[idx]);
      }
      updateUI();
    });

    // Color picker
    const colorInput = document.getElementById("cg-stop-color");
    colorInput.addEventListener("input", (e) => {
      if (type === "linear") {
        if (stops1D[selectedStop1DIdx]) stops1D[selectedStop1DIdx].color = e.target.value;
      } else {
        if (meshPoints[selectedMeshIdx]) meshPoints[selectedMeshIdx].color = e.target.value;
      }
      updateUI();
    });

    // Unified Spread/Radius control
    const spreadRange = document.getElementById("cg-spread-range");
    spreadRange.addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      document.getElementById("cg-spread-val").textContent = val + "%";

      if (type === "linear") {
        if (stops1D[selectedStop1DIdx]) {
          stops1D[selectedStop1DIdx].radius = val / 100;
        }
      } else {
        if (meshPoints[selectedMeshIdx]) {
          meshPoints[selectedMeshIdx].radius = val / 100;
        }
      }
      updateUI();
    });

    // Apply
    document.getElementById("cg-apply-btn").addEventListener("click", () => {
      console.log("[GradientModule] Apply button clicked");
      applyToCanvas();
      
      // Save to ColorModule gradient presets list
      if (typeof ColorModule !== "undefined" && ColorModule.addGradientPreset) {
        if (type === "linear") {
          const gradData = {
            type: "linear",
            stops: getProcessedLinearStops(),
            startPoint: { x: startPoint.x, y: startPoint.y },
            endPoint: { x: endPoint.x, y: endPoint.y }
          };
          console.log("[GradientModule] Saving Linear gradient:", gradData);
          ColorModule.addGradientPreset(gradData, "Linear Custom");
        } else {
          const gradData = {
            type: "radial",
            meshPoints: meshPoints.map(p => ({ x: p.x, y: p.y, color: p.color, radius: p.radius }))
          };
          console.log("[GradientModule] Saving Radial gradient:", gradData);
          ColorModule.addGradientPreset(gradData, "Radial Custom");
        }
      }
      const closeBtn = document.querySelector(".popup-overlay .popup-close");
      if (closeBtn) closeBtn.click();
    });

    // Cancel
    document.getElementById("cg-cancel-btn").addEventListener("click", () => {
      const closeBtn = document.querySelector(".popup-overlay .popup-close");
      if (closeBtn) closeBtn.click();
    });
  }

  function updateUI() {
    const canvas2d = document.getElementById("grad-preview-canvas");
    const wrapper = document.getElementById("grad-canvas-wrapper");
    if (!canvas2d || !wrapper) return;

    canvas2d.width = wrapper.clientWidth;
    canvas2d.height = wrapper.clientHeight;
    const ctx2d = canvas2d.getContext("2d");

    const handlesContainer = document.getElementById("grad-handles-container");
    handlesContainer.innerHTML = "";

    const addText = document.getElementById("cg-add-text");
    const removeText = document.getElementById("cg-remove-text");
    const reverseBtn = document.getElementById("cg-btn-reverse");
    const linearDist = document.getElementById("cg-linear-distribution");
    const coordsDisplay = document.getElementById("cg-coords-display");

    if (type === "linear") {
      // ── LINEAR MODE UI ──
      addText.textContent = "Add Stop";
      removeText.textContent = "Remove Stop";
      reverseBtn.style.display = "inline-flex";
      linearDist.style.display = "flex";
      coordsDisplay.style.display = "none";

      // Draw Gradient Line
      const x1 = startPoint.x * canvas2d.width;
      const y1 = startPoint.y * canvas2d.height;
      const x2 = endPoint.x * canvas2d.width;
      const y2 = endPoint.y * canvas2d.height;

      const grad = ctx2d.createLinearGradient(x1, y1, x2, y2);
      const processedStops = getProcessedLinearStops();
      processedStops.forEach(s => grad.addColorStop(s.offset, s.color));
      ctx2d.fillStyle = grad;
      ctx2d.fillRect(0, 0, canvas2d.width, canvas2d.height);

      // Dash line S -> E
      ctx2d.beginPath();
      ctx2d.moveTo(x1, y1);
      ctx2d.lineTo(x2, y2);
      ctx2d.strokeStyle = "rgba(255,255,255,0.4)";
      ctx2d.setLineDash([4, 4]);
      ctx2d.stroke();
      ctx2d.setLineDash([]);

      // Spawn S & E handles
      const points = [
        { label: "S", pt: startPoint, color: "#00ffff" },
        { label: "E", pt: endPoint, color: "#ff00ff" }
      ];

      points.forEach((p) => {
        const handle = document.createElement("div");
        handle.className = "grad-handle-2d";
        handle.style.left = `calc(${p.pt.x * 100}% - 12px)`;
        handle.style.top = `calc(${p.pt.y * 100}% - 12px)`;
        handle.style.backgroundColor = p.color;
        handle.textContent = p.label;

        handle.addEventListener("mousedown", (e) => {
          e.preventDefault();
          const rect = wrapper.getBoundingClientRect();

          function onMouseMove(moveEv) {
            p.pt.x = Math.max(0, Math.min(1, (moveEv.clientX - rect.left) / rect.width));
            p.pt.y = Math.max(0, Math.min(1, (moveEv.clientY - rect.top) / rect.height));
            updateUI();
          }
          function onMouseUp() {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
          }
          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        });

        handlesContainer.appendChild(handle);
      });

      // Update 1D Distribution Slider Bar
      const bar = document.getElementById("grad-bar");
      if (bar) {
        const stopStrs = stops1D.map(s => `${s.color} ${s.offset * 100}%`).join(", ");
        bar.style.background = `linear-gradient(to right, ${stopStrs})`;
      }

      // Render 1D Stop indicators
      const stopsContainer = document.getElementById("grad-stops-container");
      if (stopsContainer) {
        stopsContainer.innerHTML = "";
        stops1D.forEach((stop, idx) => {
          const marker = document.createElement("div");
          marker.className = `grad-marker ${idx === selectedStop1DIdx ? "active" : ""}`;
          marker.style.left = `calc(${stop.offset * 100}% - 8px)`;
          marker.style.background = stop.color;

          marker.addEventListener("mousedown", (e) => {
            selectedStop1DIdx = idx;
            updateUI();
            e.preventDefault();

            const startX = e.clientX;
            const initialOffset = stop.offset;
            const rect = stopsContainer.getBoundingClientRect();

            function onMouseMove(moveEv) {
              const dx = moveEv.clientX - startX;
              const newOffset = Math.max(0, Math.min(1, initialOffset + dx / rect.width));
              stop.offset = newOffset;

              const current = stops1D[selectedStop1DIdx];
              stops1D.sort((a, b) => a.offset - b.offset);
              selectedStop1DIdx = stops1D.indexOf(current);

              updateUI();
            }
            function onMouseUp() {
              document.removeEventListener("mousemove", onMouseMove);
              document.removeEventListener("mouseup", onMouseUp);
            }
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
          });

          stopsContainer.appendChild(marker);
        });
      }

      // Config panel values
      const current = stops1D[selectedStop1DIdx];
      if (current) {
        document.getElementById("cg-stop-color").value = current.color;
        const radiusPercent = Math.round((current.radius || 1.0) * 100);
        document.getElementById("cg-spread-range").value = radiusPercent;
        document.getElementById("cg-spread-val").textContent = radiusPercent + "%";
      }

    } else {
      // ── RADIAL MESH MODE UI ──
      addText.textContent = "Add Point";
      removeText.textContent = "Remove Point";
      reverseBtn.style.display = "inline-flex";
      linearDist.style.display = "none";
      coordsDisplay.style.display = "flex";

      // Draw Mesh
      ctx2d.fillStyle = "#000";
      ctx2d.fillRect(0, 0, canvas2d.width, canvas2d.height);
      ctx2d.globalCompositeOperation = "screen";

      meshPoints.forEach((stop) => {
        const x = stop.x * canvas2d.width;
        const y = stop.y * canvas2d.height;
        // Apply relative spread % to standard size
        const baseRadius = Math.max(canvas2d.width, canvas2d.height) * 0.8;
        const r = baseRadius * (stop.radius || 0.8);

        const radGrad = ctx2d.createRadialGradient(x, y, 0, x, y, r);
        radGrad.addColorStop(0, stop.color);
        radGrad.addColorStop(1, "transparent");

        ctx2d.fillStyle = radGrad;
        ctx2d.fillRect(0, 0, canvas2d.width, canvas2d.height);
      });
      ctx2d.globalCompositeOperation = "source-over";

      // Spawn Mesh Handles
      meshPoints.forEach((stop, idx) => {
        const handle = document.createElement("div");
        handle.className = `grad-handle-2d ${idx === selectedMeshIdx ? "active" : ""}`;
        handle.style.left = `calc(${stop.x * 100}% - 12px)`;
        handle.style.top = `calc(${stop.y * 100}% - 12px)`;
        handle.style.backgroundColor = stop.color;
        handle.textContent = idx + 1;

        handle.addEventListener("mousedown", (e) => {
          selectedMeshIdx = idx;
          updateUI();
          e.preventDefault();
          const rect = wrapper.getBoundingClientRect();

          function onMouseMove(moveEv) {
            stop.x = Math.max(0, Math.min(1, (moveEv.clientX - rect.left) / rect.width));
            stop.y = Math.max(0, Math.min(1, (moveEv.clientY - rect.top) / rect.height));
            updateUI();
          }
          function onMouseUp() {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
          }
          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        });

        handlesContainer.appendChild(handle);
      });

      // Config panel values
      const current = meshPoints[selectedMeshIdx];
      if (current) {
        document.getElementById("cg-stop-color").value = current.color;
        const coordsVal = document.getElementById("cg-coords-val");
        if (coordsVal) {
          coordsVal.textContent = `X: ${Math.round(current.x * 100)}%, Y: ${Math.round(current.y * 100)}%`;
        }
        const radiusPercent = Math.round((current.radius || 0.8) * 100);
        document.getElementById("cg-spread-range").value = radiusPercent;
        document.getElementById("cg-spread-val").textContent = radiusPercent + "%";
      }
    }
  }

  function applyToCanvas() {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const sourceImage = window.sourceImage;
    if (!sourceImage) return;

    canvas.width = sourceImage.width;
    canvas.height = sourceImage.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (type === "linear") {
      // Linear using relative points S -> E
      const x1 = startPoint.x * canvas.width;
      const y1 = startPoint.y * canvas.height;
      const x2 = endPoint.x * canvas.width;
      const y2 = endPoint.y * canvas.height;

      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      const processedStops = getProcessedLinearStops();
      processedStops.forEach(s => grad.addColorStop(s.offset, s.color));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      // Radial multi-point Mesh blending
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalCompositeOperation = "screen";
      meshPoints.forEach((stop) => {
        const x = stop.x * canvas.width;
        const y = stop.y * canvas.height;
        // Apply point radius % on high-res canvas standard scale
        const baseRadius = Math.max(canvas.width, canvas.height) * 0.8;
        const r = baseRadius * (stop.radius || 0.8);

        const radGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
        radGrad.addColorStop(0, stop.color);
        radGrad.addColorStop(1, "transparent");

        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });
      ctx.globalCompositeOperation = "source-over";
    }

    // Overlay source image on top
    ctx.drawImage(sourceImage, 0, 0);
  }

  // Calculate adjusted stop offsets based on their individual radius percentage
  function getProcessedLinearStops() {
    if (stops1D.length < 2) return stops1D;
    
    const sorted = [...stops1D].sort((a, b) => a.offset - b.offset);
    const result = [];

    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];
      const r = current.radius !== undefined ? current.radius : 1.0;

      // 1. Nếu radius > 1.0 (Giãn nở): Tạo thêm điểm bảo vệ màu nguyên bản rộng hơn
      if (r > 1.0) {
        if (i > 0) {
          const prev = sorted[i - 1];
          const gap = current.offset - prev.offset;
          // Pushes current color towards previous stop
          const pushRatio = Math.min(0.45, (r - 1.0) * 0.25);
          result.push({
            offset: current.offset - gap * pushRatio,
            color: current.color
          });
        }
        
        result.push({ offset: current.offset, color: current.color });

        if (i < sorted.length - 1) {
          const next = sorted[i + 1];
          const gap = next.offset - current.offset;
          // Pushes current color towards next stop
          const pushRatio = Math.min(0.45, (r - 1.0) * 0.25);
          result.push({
            offset: current.offset + gap * pushRatio,
            color: current.color
          });
        }
      } 
      // 2. Nếu radius < 1.0 (Co cụm): Co dải màu dựa trên tỉ lệ radius
      else {
        // Co dải màu mượt mà
        if (i > 0) {
          const prev = sorted[i - 1];
          const gap = current.offset - prev.offset;
          result.push({
            offset: current.offset - gap * (1.0 - r),
            color: prev.color
          });
        }
        result.push({ offset: current.offset, color: current.color });
      }
    }

    // Sort to keep strict ascending offsets
    const finalStops = result.sort((a, b) => a.offset - b.offset);

    // Safeguard check to avoid exact identical offsets causing Canvas addColorStop to fail
    const filtered = [];
    for (let i = 0; i < finalStops.length; i++) {
      let offset = Math.max(0, Math.min(1, finalStops[i].offset));
      
      // Ensure strict ascending offsets by adding tiny delta if identical
      if (filtered.length > 0 && offset <= filtered[filtered.length - 1].offset) {
        offset = filtered[filtered.length - 1].offset + 0.001;
      }
      
      if (offset <= 1.0) {
        filtered.push({ offset, color: finalStops[i].color });
      }
    }

    return filtered;
  }

  return { open };
})();
