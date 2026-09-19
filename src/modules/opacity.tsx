/**
 * Opacity Module - TypeScript + TSX
 * Manages opacity for layers
 */

import { h } from "../ui/jsx";
import { SliderControl } from "../ui/SliderControl";
import { eventBus } from "../core/event-bus";
import { Layer, LayerManager } from "../core/layer";

export interface OpacityModuleOptions {
  layerManager?: LayerManager;
  targetLayer?: Layer | null;
  onOpacityChange?: (opacity: number) => void;
  onClose?: () => void;
}

let savedInnerHTML: string | null = null;

export const OpacityModule = {
  /**
   * Opens Opacity sub-panel inside a container
   * @param containerGroup - Container element
   * @param options - LayerManager, Layer or callback options
   */
  open(containerGroup: HTMLElement | null, options: OpacityModuleOptions = {}): void {
    if (!containerGroup) return;

    if (!containerGroup.querySelector(".opacity-panel")) {
      savedInnerHTML = containerGroup.innerHTML;
    }

    const { layerManager, onOpacityChange, onClose } = options;

    let targetLayer = options.targetLayer;
    if (!targetLayer && layerManager) {
      targetLayer = layerManager.getActiveLayer();
      if (targetLayer && targetLayer.id === 0) {
        targetLayer = undefined;
      }
    }

    const currentOpacity =
      targetLayer && typeof targetLayer.opacity === "number"
        ? Math.round(targetLayer.opacity * 100)
        : 100;

    const backBtn = (
      <button
        type="button"
        id="opacity-back-btn"
        class="sub-item"
        style={{ marginBottom: "4px" }}
        onClick={() => {
          this.close(containerGroup);
          if (onClose) onClose();
        }}
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
      label: "Opacity",
      value: currentOpacity,
      min: 0,
      max: 100,
      btnStep: 5,
      unit: "%",
      onChange: (val: number) => {
        let active = targetLayer;
        if (!active && layerManager) {
          active = layerManager.getActiveLayer();
        }

        const normalizedOpacity = val / 100;

        if (active && active.id !== 0) {
          active.setOpacity(normalizedOpacity);
          if (layerManager) {
            layerManager.render();
          }
          eventBus.emit("layer:opacity-changed", {
            layer: active,
            opacity: normalizedOpacity,
          });
        }

        if (onOpacityChange) {
          onOpacityChange(normalizedOpacity);
        }
      },
    });

    const panelEl = (
      <div
        class="opacity-panel"
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
    ) as HTMLElement;

    containerGroup.innerHTML = "";
    containerGroup.appendChild(panelEl);
  },

  close(containerGroup: HTMLElement | null): void {
    if (!containerGroup) return;
    if (savedInnerHTML !== null) {
      containerGroup.innerHTML = savedInnerHTML;
      savedInnerHTML = null;
    }
  },
};
