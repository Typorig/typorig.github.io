/**
 * Curve Module - TSX Real DOM
 * Manages text bending / curved text for Text Layer
 */

import { h } from "../ui/jsx";
import { SliderControl } from "../ui/SliderControl";
import { LayerManager, Layer } from "../core/layer";
import { TextTransform } from "../text/text-transform";

export class CurveModule {
  private layerManager: LayerManager;
  private textTransform: TextTransform;

  constructor(layerManager: LayerManager, textTransform: TextTransform) {
    this.layerManager = layerManager;
    this.textTransform = textTransform;
  }

  private getTargetLayer(): Layer | null {
    let layer = this.textTransform.selectedLayer;
    if (!layer || layer.id === 0) {
      const active = this.layerManager.getActiveLayer();
      if (active && active.id !== 0 && active.type === "text") {
        layer = active;
      }
    }
    return layer && layer.type === "text" ? layer : null;
  }

  open(containerGroup: HTMLElement): void {
    if (!containerGroup) return;

    if (!containerGroup.querySelector(".curve-panel")) {
      containerGroup.dataset._savedInner = containerGroup.innerHTML;
    }

    const targetLayer = this.getTargetLayer();
    const currentBend = targetLayer?.curveBend ?? 0;

    const backBtn = (
      <button
        id="curve-back-btn"
        class="sub-item"
        style={{ marginBottom: "4px" }}
        onClick={() => this.close(containerGroup)}
      >
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path
            fill="currentColor"
            d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
          />
        </svg>
        <span>Back</span>
      </button>
    );

    const sliderControlEl = SliderControl({
      label: "Bending",
      value: currentBend,
      min: -100,
      max: 100,
      btnStep: 5,
      unit: "%",
      onChange: (val) => {
        const layer = this.getTargetLayer();
        if (layer) {
          layer.curveBend = val;
          this.textTransform.redrawTextLayer(layer);
          this.layerManager.render();
          if (this.textTransform.selectedLayer === layer) {
            this.textTransform.drawSelectionOverlay(layer);
          }
        }
      },
    });

    const panelEl = (
      <div
        class="curve-panel"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          userSelect: "none",
          padding: "12px 8px",
        }}
      >
        {backBtn}
        {sliderControlEl}
      </div>
    );

    containerGroup.innerHTML = "";
    containerGroup.appendChild(panelEl);
  }

  close(containerGroup: HTMLElement): void {
    if (!containerGroup) return;
    if (containerGroup.dataset._savedInner) {
      containerGroup.innerHTML = containerGroup.dataset._savedInner;
      delete containerGroup.dataset._savedInner;
    }
  }
}
