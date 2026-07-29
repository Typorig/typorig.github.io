"use strict";

/**
 * Text Module
 * Xử lý các chức năng liên quan đến text layers
 */

class TextHandler {
  constructor() {
    window.textHandler = this;
    this.initEventListeners();
  }

  /**
   * Khởi tạo event listeners cho text
   */
  initEventListeners() {
    // Event listener cho nút "New Text"
    document.addEventListener("click", (e) => {
      const target = e.target.closest('[data-sub="text-new"]');
      if (target) {
        // Hiển thị text properties trong sub-sidebar
        this.showTextProperties();
        
        // Tạo text layer nếu có layerManager
        if (window.layerManager) {
          this.createNewTextLayer();
        }
      }
      
      // Event listener cho nút Back trong text properties
      const backBtn = e.target.closest('[data-sub="text-props-back"]');
      if (backBtn) {
        this.hideTextProperties();
      }
      
      // Event listener cho các property items
      const propItem = e.target.closest('[data-prop]');
      if (propItem) {
        const propType = propItem.getAttribute('data-prop');
        this.handlePropertyClick(propType);
      }
    });
  }

  /**
   * Hiển thị text properties (ẩn sub-group text, hiện text-props)
   */
  showTextProperties() {
    const textGroup = document.querySelector('.sub-group[data-section="text"]');
    const textPropsGroup = document.querySelector('.sub-group[data-section="text-props"]');
    
    if (textPropsGroup && textPropsGroup.dataset._savedInner) {
      textPropsGroup.innerHTML = textPropsGroup.dataset._savedInner;
      delete textPropsGroup.dataset._savedInner;
    }

    if (textGroup) textGroup.classList.add("hidden");
    if (textPropsGroup) textPropsGroup.classList.remove("hidden");
  }

  /**
   * Ẩn text properties (hiện lại sub-group text)
   */
  hideTextProperties() {
    const textGroup = document.querySelector('.sub-group[data-section="text"]');
    const textPropsGroup = document.querySelector('.sub-group[data-section="text-props"]');
    
    if (textGroup) textGroup.classList.remove("hidden");
    if (textPropsGroup) textPropsGroup.classList.add("hidden");
  }

  /**
   * Xử lý khi click vào property item
   * @param {string} propType - Loại property được click
   */
  handlePropertyClick(propType) {
    console.log("Property clicked:", propType);
    if (propType === "relative-position") {
      this.openRelativePositionPanel();
    } else if (propType === "size") {
      this.openSizePanel();
    } else if (propType === "padding") {
      this.openPaddingPanel();
    } else if (propType === "color") {
      this.openColorPanel();
    } else if (propType === "texture") {
      this.openTexturePanel();
    } else if (propType === "opacity") {
      this.openOpacityPanel();
    } else if (propType === "rotate") {
      this.openRotatePanel();
    } else if (propType === "style") {
      this.openStylePanel();
    }
  }

  /**
   * Hiển thị panel Relative Position trong sub-sidebar
   */
  openRelativePositionPanel() {
    const textPropsGroup = document.querySelector('.sub-group[data-section="text-props"]');
    if (textPropsGroup && typeof RelativePositionModule !== "undefined") {
      RelativePositionModule.open(textPropsGroup);
    }
  }

  /**
   * Hiển thị panel Size trong sub-sidebar (như Relative Position)
   */
  openSizePanel() {
    const textPropsGroup = document.querySelector('.sub-group[data-section="text-props"]');
    if (!textPropsGroup) return;

    if (!textPropsGroup.querySelector(".size-panel")) {
      textPropsGroup.dataset._savedInner = textPropsGroup.innerHTML;
    }

    const textTransform = window.textTransform;
    const layerManager = window.layerManager;
    let targetLayer = textTransform ? textTransform.selectedLayer : null;
    if (!targetLayer || targetLayer.id === 0) {
      if (layerManager) {
        targetLayer = layerManager.layers.find(l => l.id === layerManager.activeLayerId && l.id !== 0);
      }
    }

    const currentSize = targetLayer && targetLayer.fontSize !== undefined ? Math.round(targetLayer.fontSize) : 48;

    const panelEl = document.createElement("div");
    panelEl.className = "size-panel";
    panelEl.style.cssText = "display:flex;flex-direction:column;gap:12px;user-select:none;padding:12px 8px;";

    const backBtn = document.createElement("button");
    backBtn.id = "size-back-btn";
    backBtn.className = "sub-item";
    backBtn.style.marginBottom = "4px";
    backBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
      <span>Back</span>
    `;
    backBtn.addEventListener("click", () => {
      if (textPropsGroup.dataset._savedInner) {
        textPropsGroup.innerHTML = textPropsGroup.dataset._savedInner;
        delete textPropsGroup.dataset._savedInner;
      }
    });
    panelEl.appendChild(backBtn);

    const sliderControlEl = SliderControl.create({
      label: "Size",
      value: currentSize,
      min: 1,
      max: 1000,
      sliderMin: 2,
      sliderMax: 300,
      btnStep: 1,
      onChange: (newSize) => {
        const tt = window.textTransform;
        const lm = window.layerManager;
        let layer = tt ? tt.selectedLayer : null;
        if (!layer || layer.id === 0) {
          if (lm) {
            layer = lm.layers.find(l => l.id === lm.activeLayerId && l.id !== 0);
          }
        }

        if (layer && layer.type === "text") {
          layer.fontSize = newSize;
          if (tt && typeof tt.redrawTextLayer === "function") {
            tt.redrawTextLayer(layer);
          }
          if (lm) {
            lm.render();
          }
          if (tt && tt.selectedLayer === layer && typeof tt.drawSelectionOverlay === "function") {
            tt.drawSelectionOverlay(layer);
          }
        }
      }
    });

    panelEl.appendChild(sliderControlEl);
    textPropsGroup.innerHTML = "";
    textPropsGroup.appendChild(panelEl);
  }

  /**
   * Hiển thị panel Padding trong sub-sidebar (như Size và Relative Position)
   */
  openPaddingPanel() {
    const textPropsGroup = document.querySelector('.sub-group[data-section="text-props"]');
    if (!textPropsGroup) return;

    if (!textPropsGroup.querySelector(".padding-panel")) {
      textPropsGroup.dataset._savedInner = textPropsGroup.innerHTML;
    }

    const textTransform = window.textTransform;
    const layerManager = window.layerManager;
    let targetLayer = textTransform ? textTransform.selectedLayer : null;
    if (!targetLayer || targetLayer.id === 0) {
      if (layerManager) {
        targetLayer = layerManager.layers.find(l => l.id === layerManager.activeLayerId && l.id !== 0);
      }
    }

    const currentLeft = targetLayer && targetLayer.paddingLeft !== undefined ? Math.round(targetLayer.paddingLeft) : 0;
    const currentRight = targetLayer && targetLayer.paddingRight !== undefined ? Math.round(targetLayer.paddingRight) : 0;

    const panelEl = document.createElement("div");
    panelEl.className = "padding-panel";
    panelEl.style.cssText = "display:flex;flex-direction:column;gap:12px;user-select:none;padding:12px 8px;";

    const backBtn = document.createElement("button");
    backBtn.id = "padding-back-btn";
    backBtn.className = "sub-item";
    backBtn.style.marginBottom = "4px";
    backBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
      <span>Back</span>
    `;
    backBtn.addEventListener("click", () => {
      if (textPropsGroup.dataset._savedInner) {
        textPropsGroup.innerHTML = textPropsGroup.dataset._savedInner;
        delete textPropsGroup.dataset._savedInner;
      }
    });
    panelEl.appendChild(backBtn);

    const updatePadding = (side, val) => {
      val = Math.round(val);
      const tt = window.textTransform;
      const lm = window.layerManager;
      let layer = tt ? tt.selectedLayer : null;
      if (!layer || layer.id === 0) {
        if (lm) {
          layer = lm.layers.find(l => l.id === lm.activeLayerId && l.id !== 0);
        }
      }

      if (layer && layer.type === "text") {
        if (side === "left") {
          layer.paddingLeft = val;
        } else if (side === "right") {
          layer.paddingRight = val;
        }
        if (tt && typeof tt.redrawTextLayer === "function") {
          tt.redrawTextLayer(layer);
        }
        if (lm) {
          lm.render();
        }
        if (tt && tt.selectedLayer === layer && typeof tt.drawSelectionOverlay === "function") {
          tt.drawSelectionOverlay(layer);
        }
      }
    };

    const leftSliderEl = SliderControl.create({
      label: "left padding",
      value: currentLeft,
      min: -1000,
      max: 1000,
      sliderMin: -20,
      sliderMax: 100,
      btnStep: 1,
      onChange: (val) => updatePadding("left", val)
    });

    const rightSliderEl = SliderControl.create({
      label: "right padding",
      value: currentRight,
      min: -1000,
      max: 1000,
      sliderMin: -20,
      sliderMax: 100,
      btnStep: 1,
      onChange: (val) => updatePadding("right", val)
    });

    panelEl.appendChild(leftSliderEl);
    panelEl.appendChild(rightSliderEl);
    textPropsGroup.innerHTML = "";
    textPropsGroup.appendChild(panelEl);
  }

  /**
   * Mở ColorModule cho Text
   */
  openColorPanel() {
    if (typeof ColorModule !== "undefined" && typeof ColorModule.open === "function") {
      ColorModule.open();
    }
  }

  /**
   * Hiển thị panel Texture trong sub-sidebar
   */
  openTexturePanel() {
    const textPropsGroup = document.querySelector('.sub-group[data-section="text-props"]');
    if (textPropsGroup && typeof TextureModule !== "undefined") {
      TextureModule.open(textPropsGroup);
    }
  }

  /**
   * Hiển thị panel Opacity trong sub-sidebar
   */
  openOpacityPanel() {
    const textPropsGroup = document.querySelector('.sub-group[data-section="text-props"]');
    if (textPropsGroup && typeof OpacityModule !== "undefined") {
      OpacityModule.open(textPropsGroup);
    }
  }

  /**
   * Hiển thị panel Style trong sub-sidebar
   */
  openStylePanel() {
    const textPropsGroup = document.querySelector('.sub-group[data-section="text-props"]');
    if (!textPropsGroup) return;

    if (!textPropsGroup.querySelector(".style-panel")) {
      textPropsGroup.dataset._savedInner = textPropsGroup.innerHTML;
    }

    const textTransform = window.textTransform;
    const layerManager = window.layerManager;
    let targetLayer = textTransform ? textTransform.selectedLayer : null;
    if (!targetLayer || targetLayer.id === 0) {
      if (layerManager) {
        targetLayer = layerManager.layers.find(l => l.id === layerManager.activeLayerId && l.id !== 0);
      }
    }

    const isBold = targetLayer && targetLayer.fontWeight === "bold";
    const isItalic = targetLayer && targetLayer.fontStyle === "italic";
    const currentDec = targetLayer && targetLayer.textDecoration ? targetLayer.textDecoration : (targetLayer && targetLayer.underline ? 'underline' : 'none');

    const panelEl = document.createElement("div");
    panelEl.className = "style-panel";
    panelEl.style.cssText = "display:flex;flex-direction:column;gap:12px;user-select:none;padding:12px 8px;";

    const backBtn = document.createElement("button");
    backBtn.id = "style-back-btn";
    backBtn.className = "sub-item";
    backBtn.style.marginBottom = "4px";
    backBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
      <span>Back</span>
    `;
    backBtn.addEventListener("click", () => {
      if (textPropsGroup.dataset._savedInner) {
        textPropsGroup.innerHTML = textPropsGroup.dataset._savedInner;
        delete textPropsGroup.dataset._savedInner;
      }
    });
    panelEl.appendChild(backBtn);

    const btnGrid = document.createElement("div");
    btnGrid.style.cssText = "display:grid;grid-template-columns:repeat(4, 1fr);gap:8px;";

    const btnStyle = (active) => `
      padding:10px 4px;background:${active ? '#00f260' : '#2a2a2a'};
      border:1px solid ${active ? '#00f260' : '#444'};border-radius:6px;
      color:${active ? '#000' : '#fff'};cursor:pointer;display:flex;
      align-items:center;justify-content:center;font-size:15px;font-weight:bold;
    `;

    btnGrid.innerHTML = `
      <button id="style-bold-btn" style="${btnStyle(isBold)}" title="Bold (In đậm)">B</button>
      <button id="style-italic-btn" style="${btnStyle(isItalic)}" title="Italic (In nghiêng)"><i>I</i></button>
      <button id="style-underline-btn" style="${btnStyle(currentDec === 'underline')}" title="Underline (Gạch chân)"><u>U</u></button>
      <button id="style-double-btn" style="${btnStyle(currentDec === 'double-underline')}" title="Double Underline (Gạch đôi)"><span style="border-bottom:3px double currentColor;padding-bottom:2px;">O</span></button>
      <button id="style-strike-btn" style="${btnStyle(currentDec === 'strikethrough')}" title="Strikethrough (Gạch ngang chữ)"><s>S</s></button>
      <button id="style-dashed-btn" style="${btnStyle(currentDec === 'dashed-underline')}" title="Dashed Underline (Gạch chân đứt nét)"><span style="border-bottom:2px dashed currentColor;">H</span></button>
      <button id="style-wavy-btn" style="${btnStyle(currentDec === 'wavy-underline')}" title="Wavy Underline (Gạch sóng)"><span style="text-decoration:wavy underline;">W</span></button>
      <button id="style-dotted-btn" style="${btnStyle(currentDec === 'dotted-underline')}" title="Dotted Underline (Gạch dấu chấm)"><span style="border-bottom:2px dotted currentColor;">T</span></button>
      <button id="style-reset-btn" style="${btnStyle(false)};grid-column: span 4;" title="Clear Style (Xóa Style)">
        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
      </button>
    `;
    panelEl.appendChild(btnGrid);

    textPropsGroup.innerHTML = "";
    textPropsGroup.appendChild(panelEl);

    const getActiveTextLayer = () => {
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

    const updateAndRedraw = (layer) => {
      if (!layer) return;
      const tt = window.textTransform;
      const lm = window.layerManager;
      if (tt && typeof tt.redrawTextLayer === "function") {
        tt.redrawTextLayer(layer);
      }
      if (lm) lm.render();
      if (tt && tt.selectedLayer === layer && typeof tt.drawSelectionOverlay === "function") {
        tt.drawSelectionOverlay(layer);
      }
      this.openStylePanel();
    };

    const setDecoration = (type) => {
      const layer = getActiveTextLayer();
      if (layer && layer.type === "text") {
        layer.textDecoration = layer.textDecoration === type ? 'none' : type;
        layer.underline = layer.textDecoration === 'underline';
        updateAndRedraw(layer);
      }
    };

    // Events
    panelEl.querySelector("#style-bold-btn").addEventListener("click", () => {
      const layer = getActiveTextLayer();
      if (layer && layer.type === "text") {
        layer.fontWeight = layer.fontWeight === "bold" ? "normal" : "bold";
        updateAndRedraw(layer);
      }
    });

    panelEl.querySelector("#style-italic-btn").addEventListener("click", () => {
      const layer = getActiveTextLayer();
      if (layer && layer.type === "text") {
        layer.fontStyle = layer.fontStyle === "italic" ? "normal" : "italic";
        updateAndRedraw(layer);
      }
    });

    panelEl.querySelector("#style-underline-btn").addEventListener("click", () => setDecoration('underline'));
    panelEl.querySelector("#style-double-btn").addEventListener("click", () => setDecoration('double-underline'));
    panelEl.querySelector("#style-strike-btn").addEventListener("click", () => setDecoration('strikethrough'));
    panelEl.querySelector("#style-dashed-btn").addEventListener("click", () => setDecoration('dashed-underline'));
    panelEl.querySelector("#style-wavy-btn").addEventListener("click", () => setDecoration('wavy-underline'));
    panelEl.querySelector("#style-dotted-btn").addEventListener("click", () => setDecoration('dotted-underline'));

    // Reset Style (Trash Icon)
    panelEl.querySelector("#style-reset-btn").addEventListener("click", () => {
      const layer = getActiveTextLayer();
      if (layer && layer.type === "text") {
        layer.fontWeight = "normal";
        layer.fontStyle = "normal";
        layer.textDecoration = "none";
        layer.underline = false;
        updateAndRedraw(layer);
      }
    });
  }

  /**
   * Hiển thị panel Rotate trong sub-sidebar
   */
  openRotatePanel() {
    const textPropsGroup = document.querySelector('.sub-group[data-section="text-props"]');
    if (textPropsGroup && typeof RotateModule !== "undefined") {
      RotateModule.open(textPropsGroup);
    }
  }

  /**
   * Tạo text layer mới
   * @param {string} text - Nội dung text
   * @param {number} x - Vị trí x
   * @param {number} y - Vị trí y
   * @param {number} fontSize - Kích thước font
   * @param {string} fontFamily - Font chữ
   * @param {string} color - Màu chữ
   * @returns {object} Text layer mới
   */
  createNewTextLayer(
    text = "Sample Text",
    x = null,
    y = null,
    fontSize = 48,
    fontFamily = "Arial",
    color = "#000000"
  ) {
    const canvas = document.getElementById("canvas");
    const layerManager = window.layerManager;

    if (!layerManager) {
      console.error("LayerManager not initialized");
      return null;
    }

    // Tính toán vị trí center nếu không được cung cấp
    const centerX = x !== null ? x : canvas.width / 2;
    const centerY = y !== null ? y : canvas.height / 2;

    // Tạo text layer
    const textLayer = layerManager.createTextLayer(
      text,
      centerX,
      centerY,
      fontSize,
      fontFamily,
      color
    );

    // Render lại canvas
    layerManager.render();

    // Cập nhật layer list
    if (typeof window.updateLayerList === "function") {
      window.updateLayerList();
    }

    console.log("Created new text layer:", textLayer.name);
    console.log("Total layers:", layerManager.layers.length);

    if (window.textTransform && typeof window.textTransform.startTextEditing === "function") {
      window.textTransform.selectedLayer = textLayer;
      window.textTransform.layerManager.setActiveLayer(textLayer.id);
      window.textTransform.layerManager.render();
      window.textTransform.drawSelectionOverlay(textLayer);
      window.textTransform.startTextEditing(textLayer);
    }

    return textLayer;
  }

  /**
   * Cập nhật text của một layer
   * @param {object} textLayer - Text layer cần cập nhật
   * @param {string} newText - Nội dung text mới
   */
  updateTextContent(textLayer, newText) {
    if (!textLayer || textLayer.type !== "text") {
      console.error("Invalid text layer");
      return;
    }

    textLayer.text = newText;

    // Render lại
    if (window.layerManager) {
      window.layerManager.render();
    }
  }

  /**
   * Cập nhật style của text layer
   * @param {object} textLayer - Text layer cần cập nhật
   * @param {object} styleOptions - Các thuộc tính style cần cập nhật
   */
  updateTextStyle(textLayer, styleOptions = {}) {
    if (!textLayer || textLayer.type !== "text") {
      console.error("Invalid text layer");
      return;
    }

    // Cập nhật các thuộc tính nếu được cung cấp
    if (styleOptions.fontSize !== undefined) {
      textLayer.fontSize = styleOptions.fontSize;
    }
    if (styleOptions.fontFamily !== undefined) {
      textLayer.fontFamily = styleOptions.fontFamily;
    }
    if (styleOptions.color !== undefined) {
      textLayer.color = styleOptions.color;
    }

    // Render lại
    if (window.layerManager) {
      window.layerManager.render();
    }
  }

  /**
   * Di chuyển text layer
   * @param {object} textLayer - Text layer cần di chuyển
   * @param {number} newX - Vị trí x mới
   * @param {number} newY - Vị trí y mới
   */
  moveTextLayer(textLayer, newX, newY) {
    if (!textLayer || textLayer.type !== "text") {
      console.error("Invalid text layer");
      return;
    }

    textLayer.x = newX;
    textLayer.y = newY;

    // Render lại
    if (window.layerManager) {
      window.layerManager.render();
    }
  }
}

// Khởi tạo và export TextHandler
const textHandler = new TextHandler();
window.textHandler = textHandler;
