"use strict";

/**
 * Rotate Module
 * Quản lý xoay (rotation) góc từ -180° đến 180° cho mọi Layer (Text, Elements, ...)
 */
const RotateModule = (() => {

  /**
   * Mở Rotate sub-panel trong một container (sub-sidebar group)
   * @param {HTMLElement} containerGroup - Thẻ chứa sub-group (vd: .sub-group[data-section="text-props"])
   * @param {Object} options - Các tùy chọn bổ sung
   */
  function open(containerGroup, options = {}) {
    if (!containerGroup) return;

    if (!containerGroup.querySelector(".rotate-panel")) {
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

    const currentRotation = targetLayer && targetLayer.rotation !== undefined ? Math.round(targetLayer.rotation) : 0;

    const panelEl = document.createElement("div");
    panelEl.className = "rotate-panel";
    panelEl.style.cssText = "display:flex;flex-direction:column;gap:12px;user-select:none;padding:12px 8px;";

    const backBtn = document.createElement("button");
    backBtn.id = "rotate-back-btn";
    backBtn.className = "sub-item";
    backBtn.style.marginBottom = "4px";
    backBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
      <span>Back</span>
    `;
    backBtn.addEventListener("click", () => close(containerGroup));
    panelEl.appendChild(backBtn);

    const sliderControlEl = SliderControl.create({
      label: "Angle",
      value: currentRotation,
      min: -180,
      max: 180,
      btnStep: 1,
      unit: "°",
      onChange: (val) => {
        const tt = window.textTransform;
        const lm = window.layerManager;
        let layer = tt ? tt.selectedLayer : null;
        if (!layer || layer.id === 0) {
          if (lm) {
            layer = lm.layers.find(l => l.id === lm.activeLayerId && l.id !== 0);
          }
        }

        if (layer) {
          layer.rotation = val;
          if (lm) lm.render();
          if (tt && tt.selectedLayer === layer && typeof tt.drawSelectionOverlay === "function") {
            tt.drawSelectionOverlay(layer);
          }
        }
      }
    });

    panelEl.appendChild(sliderControlEl);
    containerGroup.innerHTML = "";
    containerGroup.appendChild(panelEl);
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
