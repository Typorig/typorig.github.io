"use strict";

/**
 * Texture Module
 * Quản lý họa tiết nền/bề mặt (Texture Upload, Delete, Scale) cho các Layer
 */
const TextureModule = (() => {

  /**
   * Mở Texture sub-panel trong một container (sub-sidebar group)
   * @param {HTMLElement} containerGroup - Thẻ chứa sub-group (vd: .sub-group[data-section="text-props"])
   * @param {Object} options - Các tùy chọn bổ sung
   */
  function open(containerGroup, options = {}) {
    if (!containerGroup) return;

    if (!containerGroup.querySelector(".texture-panel")) {
      containerGroup.dataset._savedInner = containerGroup.innerHTML;
    }

    const textTransform = window.textTransform;
    const layerManager = window.layerManager;
    let targetLayer = textTransform ? textTransform.selectedLayer : null;
    if (!targetLayer || targetLayer.id === 0) {
      if (layerManager) {
        targetLayer = layerManager.layers.find(l => l.id === layerManager.activeLayerId && l.id !== 0);
      }
    }

    const hasImage = !!(targetLayer && targetLayer.textureImage);
    const scalePercent = targetLayer && targetLayer.textureScale !== undefined ? Math.round(targetLayer.textureScale * 100) : 100;
    const sliderVal = Math.min(Math.max(scalePercent, 10), 200);
    const isDisabled = !hasImage;

    const panelEl = document.createElement("div");
    panelEl.className = "texture-panel";
    panelEl.style.cssText = "display:flex;flex-direction:column;gap:12px;user-select:none;padding:12px 8px;";

    const backBtn = document.createElement("button");
    backBtn.id = "texture-back-btn";
    backBtn.className = "sub-item";
    backBtn.style.marginBottom = "4px";
    backBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
      <span>Back</span>
    `;
    backBtn.addEventListener("click", () => close(containerGroup));
    panelEl.appendChild(backBtn);

    const btnGroup = document.createElement("div");
    btnGroup.style.cssText = "display:flex;gap:8px;";
    btnGroup.innerHTML = `
      <button id="texture-upload-btn" style="flex:1;background:#2a2a2a;border:1px solid #444;border-radius:4px;color:#fff;padding:6px 10px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;">
        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>
        <span>Upload</span>
      </button>
      <input type="file" id="texture-file-input" accept="image/*" style="display:none;" />

      <button id="texture-delete-btn" style="background:#2a2a2a;border:1px solid #444;border-radius:4px;color:${hasImage ? '#ff4d4d' : '#666'};padding:6px 10px;cursor:${hasImage ? 'pointer' : 'not-allowed'};display:flex;align-items:center;justify-content:center;gap:4px;font-size:12px;" ${isDisabled ? 'disabled' : ''}>
        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        <span>Delete</span>
      </button>
    `;
    panelEl.appendChild(btnGroup);

    const getActiveLayer = () => {
      const tt = window.textTransform;
      const lm = window.layerManager;
      let layer = tt ? tt.selectedLayer : null;
      if (!layer || layer.id === 0) {
        if (lm) {
          layer = lm.layers.find(l => l.id === lm.activeLayerId && l.id !== 0);
        }
      }
      return layer;
    };

    const sliderControlEl = SliderControl.create({
      label: "Scale",
      value: scalePercent,
      min: 10,
      max: 200,
      btnStep: 5,
      unit: "%",
      onChange: (newPercent) => {
        const layer = getActiveLayer();
        if (layer) {
          layer.textureScale = newPercent / 100;
          const tt = window.textTransform;
          const lm = window.layerManager;
          if (tt && layer.type === "text" && typeof tt.redrawTextLayer === "function") {
            tt.redrawTextLayer(layer);
          }
          if (lm) lm.render();
          if (tt && tt.selectedLayer === layer && typeof tt.drawSelectionOverlay === "function") {
            tt.drawSelectionOverlay(layer);
          }
        }
      }
    });

    if (isDisabled) {
      sliderControlEl.style.opacity = "0.4";
      sliderControlEl.style.pointerEvents = "none";
    }

    panelEl.appendChild(sliderControlEl);

    containerGroup.innerHTML = "";
    containerGroup.appendChild(panelEl);

    const uploadBtn = panelEl.querySelector("#texture-upload-btn");
    const fileInput = panelEl.querySelector("#texture-file-input");
    const deleteBtn = panelEl.querySelector("#texture-delete-btn");

    // Upload Event
    uploadBtn.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const layer = getActiveLayer();
          if (layer) {
            layer.textureImage = img;
            layer.textureScale = 1.0;

            const tt = window.textTransform;
            const lm = window.layerManager;
            if (tt && layer.type === "text" && typeof tt.redrawTextLayer === "function") {
              tt.redrawTextLayer(layer);
            }
            if (lm) lm.render();
            if (tt && tt.selectedLayer === layer && typeof tt.drawSelectionOverlay === "function") {
              tt.drawSelectionOverlay(layer);
            }

            open(containerGroup, options);
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });

    // Delete Event
    deleteBtn.addEventListener("click", () => {
      const layer = getActiveLayer();
      if (layer) {
        layer.textureImage = null;

        const tt = window.textTransform;
        const lm = window.layerManager;
        if (tt && layer.type === "text" && typeof tt.redrawTextLayer === "function") {
          tt.redrawTextLayer(layer);
        }
        if (lm) lm.render();
        if (tt && tt.selectedLayer === layer && typeof tt.drawSelectionOverlay === "function") {
          tt.drawSelectionOverlay(layer);
        }

        open(containerGroup, options);
      }
    });
  }

  function close(containerGroup) {
    if (!containerGroup) return;
    if (containerGroup.dataset._savedInner) {
      containerGroup.innerHTML = containerGroup.dataset._savedInner;
      delete containerGroup.dataset._savedInner;
    }
  }

  return {
    open,
    close
  };
})();
