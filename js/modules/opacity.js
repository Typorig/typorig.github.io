"use strict";

/**
 * Opacity Module
 * Quản lý độ trong suốt (opacity) cho mọi Layer (Text, Elements, ...)
 */
const OpacityModule = (() => {

  /**
   * Mở Opacity sub-panel trong một container (sub-sidebar group)
   * @param {HTMLElement} containerGroup - Thẻ chứa sub-group (vd: .sub-group[data-section="text-props"])
   * @param {Object} options - Các tùy chọn bổ sung
   */
  function open(containerGroup, options = {}) {
    if (!containerGroup) return;

    if (!containerGroup.querySelector(".opacity-panel")) {
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

    const currentOpacity = targetLayer && targetLayer.opacity !== undefined ? Math.round(targetLayer.opacity * 100) : 100;

    const panelEl = document.createElement("div");
    panelEl.className = "opacity-panel";
    panelEl.style.cssText = "display:flex;flex-direction:column;gap:12px;user-select:none;padding:12px 8px;";

    const backBtn = document.createElement("button");
    backBtn.id = "opacity-back-btn";
    backBtn.className = "sub-item";
    backBtn.style.marginBottom = "4px";
    backBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
      <span>Back</span>
    `;
    backBtn.addEventListener("click", () => close(containerGroup));
    panelEl.appendChild(backBtn);

    const sliderControlEl = SliderControl.create({
      label: "Opacity",
      value: currentOpacity,
      min: 0,
      max: 100,
      btnStep: 5,
      unit: "%",
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
          layer.opacity = val / 100;
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
