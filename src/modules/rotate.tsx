/**
 * Rotate Module - TypeScript thuần + TSX
 * Quản lý xoay (rotation) góc từ -180° đến 180° cho Active Layer
 * Tương tác với active layer qua eventBus hoặc LayerManager truyền vào
 */

import { h } from "../ui/jsx";
import { SliderControl } from "../ui/SliderControl";
import { eventBus } from "../core/event-bus";
import { Layer, LayerManager } from "../core/layer";

export interface RotateModuleOptions {
  layerManager?: LayerManager;
  targetLayer?: Layer | null;
  onAngleChange?: (angle: number) => void;
  onClose?: () => void;
}

let savedInnerHTML: string | null = null;

export const RotateModule = {
  /**
   * Mở Rotate sub-panel trong một container
   * @param containerGroup - Thẻ chứa sub-group (vd: .sub-group[data-section="text-props"])
   * @param options - Các tùy chọn LayerManager, Layer hoặc callback
   */
  open(containerGroup: HTMLElement | null, options: RotateModuleOptions = {}): void {
    if (!containerGroup) return;

    if (!containerGroup.querySelector(".rotate-panel")) {
      savedInnerHTML = containerGroup.innerHTML;
    }

    const { layerManager, onAngleChange, onClose } = options;

    let targetLayer = options.targetLayer;
    if (!targetLayer && layerManager) {
      targetLayer = layerManager.getActiveLayer();
      if (targetLayer && targetLayer.id === 0) {
        targetLayer = undefined;
      }
    }

    const currentRotation =
      targetLayer && typeof targetLayer.rotation === "number"
        ? Math.round(targetLayer.rotation)
        : 0;

    const backBtn = (
      <button
        type="button"
        id="rotate-back-btn"
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
      label: "Angle",
      value: currentRotation,
      min: -180,
      max: 180,
      btnStep: 1,
      unit: "°",
      onChange: (val: number) => {
        let active = targetLayer;
        if (!active && layerManager) {
          active = layerManager.getActiveLayer();
        }

        if (active && active.id !== 0) {
          active.rotation = val;
          if (layerManager) {
            layerManager.render();
          }
          eventBus.emit("layer:rotated", { layer: active, rotation: val });
        }

        if (onAngleChange) {
          onAngleChange(val);
        }
      },
    });

    const panelEl = (
      <div
        class="rotate-panel"
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
