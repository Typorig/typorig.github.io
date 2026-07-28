"use strict";

/**
 * Relative Position Module
 * Quản lý căn chỉnh vị trí đối tượng (Text, Elements, ...) theo canvas
 */
const RelativePositionModule = (() => {
  let savedInnerHTML = null;

  /**
   * Mở Relative Position sub-panel trong một container (sub-sidebar group)
   * @param {HTMLElement} containerGroup - Thẻ chứa sub-group (vd: .sub-group[data-section="text-props"])
   * @param {Object} options - Các tùy chọn bổ sung
   */
  function open(containerGroup, options = {}) {
    if (!containerGroup) return;

    if (!containerGroup.querySelector(".relative-position-panel")) {
      containerGroup.dataset._savedInner = containerGroup.innerHTML;
    }

    containerGroup.innerHTML = `
      <div class="relative-position-panel" style="display:flex;flex-direction:column;gap:12px;user-select:none;padding:12px 8px;">
        <button id="rel-pos-back-btn" class="sub-item" style="margin-bottom:4px;">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
          <span>Back</span>
        </button>

        <label style="font-size:11px;color:#999;display:block;">Horizontal Alignment</label>
        <div style="display:flex;gap:8px;justify-content:center;">
          <!-- 1. Align Left (|<-) -->
          <button id="rel-align-left" title="Align Left" style="flex:1;padding:12px 8px;background:#2a2a2a;border:1px solid #444;border-radius:6px;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path fill="currentColor" d="M4 4h2v16H4V4zm6 7h10v2H10v3l-5-4 5-4v3z"/>
            </svg>
          </button>

          <!-- 2. Align Center Horizontal (>|<) -->
          <button id="rel-align-center-h" title="Align Center Horizontal" style="flex:1;padding:12px 8px;background:#2a2a2a;border:1px solid #444;border-radius:6px;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path fill="currentColor" d="M11 2h2v4h-2V2zm0 16h2v4h-2v-4zm-4-7V8l-5 4 5 4v-3h10v3l5-4-5-4v3H7z"/>
            </svg>
          </button>

          <!-- 3. Align Right (->|) -->
          <button id="rel-align-right" title="Align Right" style="flex:1;padding:12px 8px;background:#2a2a2a;border:1px solid #444;border-radius:6px;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path fill="currentColor" d="M18 4h2v16h-2V4zm-4 7H4v2h10v3l5-4-5-4v3z"/>
            </svg>
          </button>
        </div>

        <label style="font-size:11px;color:#999;display:block;margin-top:8px;">Vertical Alignment</label>
        <div style="display:flex;gap:8px;justify-content:center;">
          <!-- 4. Align Top ( | \n v \n _ ) -->
          <button id="rel-align-top" title="Align Top" style="flex:1;padding:12px 8px;background:#2a2a2a;border:1px solid #444;border-radius:6px;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path fill="currentColor" d="M4 4h16v2H4V4zm7 6v10h2V10h3l-4-5-4 5h3z"/>
            </svg>
          </button>

          <!-- 5. Align Center Vertical (v \n _ \n ^) -->
          <button id="rel-align-center-v" title="Align Center Vertical" style="flex:1;padding:12px 8px;background:#2a2a2a;border:1px solid #444;border-radius:6px;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path fill="currentColor" d="M2 11h4v2H2v-2zm16 0h4v2h-4v-2zm-7-4h3l-4-5-4 5h3v10H6l4 5 4-5h-3V7z"/>
            </svg>
          </button>

          <!-- 6. Align Bottom ( _ \n ^ \n | ) -->
          <button id="rel-align-bottom" title="Align Bottom" style="flex:1;padding:12px 8px;background:#2a2a2a;border:1px solid #444;border-radius:6px;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path fill="currentColor" d="M4 18h16v2H4v-2zm7-4V4h2v10h3l-4 5-4-5h3z"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Back Event
    document.getElementById("rel-pos-back-btn").addEventListener("click", () => {
      close(containerGroup);
    });

    // Alignment click handlers
    const alignLeft = document.getElementById("rel-align-left");
    const alignCenterH = document.getElementById("rel-align-center-h");
    const alignRight = document.getElementById("rel-align-right");
    const alignTop = document.getElementById("rel-align-top");
    const alignCenterV = document.getElementById("rel-align-center-v");
    const alignBottom = document.getElementById("rel-align-bottom");

    alignLeft.addEventListener("click", () => updatePosition("left"));
    alignCenterH.addEventListener("click", () => updatePosition("center-h"));
    alignRight.addEventListener("click", () => updatePosition("right"));
    alignTop.addEventListener("click", () => updatePosition("top"));
    alignCenterV.addEventListener("click", () => updatePosition("center-v"));
    alignBottom.addEventListener("click", () => updatePosition("bottom"));
  }

  function close(containerGroup) {
    if (!containerGroup) return;
    if (containerGroup.dataset._savedInner) {
      containerGroup.innerHTML = containerGroup.dataset._savedInner;
      delete containerGroup.dataset._savedInner;
    }
  }

  function updatePosition(type) {
    const textTransform = window.textTransform;
    const layerManager = window.layerManager;
    const canvas = document.getElementById("canvas");
    if (!canvas) return;

    let targetLayer = textTransform ? textTransform.selectedLayer : null;
    if (!targetLayer || targetLayer.id === 0) {
      if (layerManager) {
        targetLayer = layerManager.layers.find(l => l.id === layerManager.activeLayerId && l.id !== 0);
      }
    }

    if (!targetLayer) return;

    // Xử lý riêng cho text layer
    if (targetLayer.type === "text") {
      const bounds = textTransform ? textTransform.getTextBounds(targetLayer) : null;
      if (!bounds) return;

      const W = canvas.width;
      const H = canvas.height;

      switch (type) {
        case "left":
          targetLayer.x = 0;
          if (targetLayer.textAlign === "center") targetLayer.x += bounds.textWidth / 2;
          else if (targetLayer.textAlign === "right") targetLayer.x += bounds.textWidth;
          break;
        case "center-h":
          targetLayer.x = W / 2;
          if (targetLayer.textAlign === "left") targetLayer.x -= bounds.textWidth / 2;
          else if (targetLayer.textAlign === "right") targetLayer.x += bounds.textWidth / 2;
          break;
        case "right":
          targetLayer.x = W;
          if (targetLayer.textAlign === "left") targetLayer.x -= bounds.textWidth;
          else if (targetLayer.textAlign === "center") targetLayer.x -= bounds.textWidth / 2;
          break;
        case "top":
          targetLayer.y = targetLayer.fontSize;
          break;
        case "center-v":
          targetLayer.y = (H + targetLayer.fontSize) / 2;
          break;
        case "bottom":
          targetLayer.y = H - 10;
          break;
      }

      if (textTransform && typeof textTransform.redrawTextLayer === "function") {
        textTransform.redrawTextLayer(targetLayer);
      }
      if (layerManager) layerManager.render();
      if (textTransform && textTransform.selectedLayer === targetLayer && typeof textTransform.drawSelectionOverlay === "function") {
        textTransform.drawSelectionOverlay(targetLayer);
      }
    } else {
      // Hỗ trợ mở rộng cho các Elements layer thông thường khác
      const W = canvas.width;
      const H = canvas.height;
      const layerW = targetLayer.width || 100;
      const layerH = targetLayer.height || 100;

      switch (type) {
        case "left": targetLayer.x = 0; break;
        case "center-h": targetLayer.x = (W - layerW) / 2; break;
        case "right": targetLayer.x = W - layerW; break;
        case "top": targetLayer.y = 0; break;
        case "center-v": targetLayer.y = (H - layerH) / 2; break;
        case "bottom": targetLayer.y = H - layerH; break;
      }

      if (layerManager) layerManager.render();
    }
  }

  return {
    open,
    close,
    updatePosition
  };
})();
