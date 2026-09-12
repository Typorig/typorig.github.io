/**
 * Layer List Sidebar UI - TSX Real DOM
 * Khôi phục giao diện chuẩn ban đầu:
 * - Checkbox chọn layer để xóa
 * - Thumbnail ảnh/text thu nhỏ từ canvas của layer
 * - Tên layer và Subtitle Type (TEXT, BACKGROUND, ...)
 * - Nút khóa (Lock) và nút ẩn/hiện (Visibility)
 * - Kéo thả (Drag & Drop) để sắp xếp layer
 * - Nút xóa các layer đã chọn trong header
 */

import { h } from "./jsx";
import { eventBus } from "../core/event-bus";
import { LayerManager, LayerItemDTO } from "../core/layer";

export interface LayerListProps {
  container?: HTMLElement;
  layerManager: LayerManager;
  onSelect?: (id: number) => void;
  onDelete?: (id: number) => void;
  onMoveUp?: (id: number) => void;
  onMoveDown?: (id: number) => void;
}

export function createLayerListPanel(props: LayerListProps): HTMLElement {
  const container =
    props.container ||
    (document.getElementById("layer-list") as HTMLElement) ||
    ((<div class="layer-list"></div>) as HTMLElement);

  const layerManager = props.layerManager;
  const selectedLayers = new Set<number>();

  let draggedElement: HTMLElement | null = null;
  let draggedLayerId: number | null = null;

  function updateDeleteButtonVisibility(): void {
    const deleteBtn = document.getElementById("layer-delete-selected");
    if (deleteBtn) {
      deleteBtn.style.display = selectedLayers.size > 0 ? "flex" : "none";
    }
  }

  // Khởi tạo nút Delete selected trong header
  const deleteBtn = document.getElementById("layer-delete-selected");
  if (deleteBtn) {
    deleteBtn.onclick = () => {
      if (selectedLayers.size === 0) return;
      const count = selectedLayers.size;
      if (!confirm(`Bạn có chắc muốn xóa ${count} layer${count > 1 ? "s" : ""} đã chọn?`)) {
        return;
      }
      const toDelete = Array.from(selectedLayers);
      toDelete.forEach((id) => {
        if (id !== 0) {
          layerManager.deleteLayer(id);
          if (props.onDelete) props.onDelete(id);
        }
      });
      selectedLayers.clear();
      updateDeleteButtonVisibility();
    };
  }

  // Khởi tạo nút Close panel
  const closeBtn = document.querySelector(".layer-sidebar-close");
  if (closeBtn) {
    (closeBtn as HTMLElement).onclick = () => {
      const layerSidebar = document.getElementById("layer-sidebar");
      const body = document.getElementById("body");
      const layerBtn = document.querySelector('.top-btn[data-action="layer"]');
      layerSidebar?.classList.add("hidden");
      body?.classList.remove("layer-open");
      layerBtn?.classList.remove("active");
    };
  }

  function getThumbnail(layerId: number): string {
    const layerObj = layerManager.getLayer(layerId);
    if (layerObj && layerObj.canvas && layerObj.canvas.width > 0 && layerObj.canvas.height > 0) {
      try {
        return layerObj.canvas.toDataURL();
      } catch {
        // ignore
      }
    }
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 36"%3E%3Crect fill="%23555" width="48" height="36"/%3E%3C/svg%3E';
  }

  function render(layers?: LayerItemDTO[]): void {
    const currentLayers = layers || layerManager.getLayersList();
    container.innerHTML = "";

    if (!currentLayers || currentLayers.length === 0) {
      container.appendChild(
        <p style={{ color: "#888", fontSize: "12px", padding: "16px", textAlign: "center" }}>
          No layers available
        </p>
      );
      return;
    }

    // Hiển thị thứ tự ngược lại (layer trên cùng ở đầu danh sách)
    [...currentLayers].reverse().forEach((layer, index) => {
      const isBackground = layer.type === "background" || layer.id === 0;

      // 1. Checkbox
      const checkbox = (
        <input
          type="checkbox"
          class="layer-checkbox"
          title="Chọn layer để xóa"
          checked={selectedLayers.has(layer.id)}
          onClick={(e: MouseEvent) => {
            e.stopPropagation();
            const input = e.currentTarget as HTMLInputElement;
            if (input.checked) {
              selectedLayers.add(layer.id);
            } else {
              selectedLayers.delete(layer.id);
            }
            updateDeleteButtonVisibility();
          }}
        />
      ) as HTMLInputElement;

      // 2. Thumbnail
      const thumbnail = (
        <img
          class="layer-thumbnail"
          draggable={false}
          src={getThumbnail(layer.id)}
          alt={layer.name}
        />
      ) as HTMLImageElement;

      // 3. Layer Info (Name & Subtitle Type)
      const info = (
        <div class="layer-info">
          <div class="layer-name">{layer.name}</div>
          <div class="layer-type">{layer.type}</div>
        </div>
      );

      // 4. Lock Button
      const lockBtn = (
        <button
          type="button"
          class={`layer-action-btn ${layer.locked ? "active" : ""}`}
          title={layer.locked ? "Mở khóa layer" : "Khóa layer"}
          onClick={(e: MouseEvent) => {
            e.stopPropagation();
            if (!isBackground) {
              layerManager.toggleLayerLock(layer.id);
            }
          }}
        >
          {layer.locked ? (
            <svg viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"
              />
            </svg>
          )}
        </button>
      );

      // 5. Visibility Button (Eye)
      const hideBtn = (
        <button
          type="button"
          class={`layer-action-btn ${!layer.visible ? "hidden-layer" : ""}`}
          title={layer.visible ? "Ẩn layer" : "Hiện layer"}
          onClick={(e: MouseEvent) => {
            e.stopPropagation();
            if (!isBackground) {
              layerManager.toggleLayerVisibility(layer.id);
            }
          }}
        >
          {layer.visible ? (
            <svg viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
              />
            </svg>
          )}
        </button>
      );

      // Layer Item wrapper
      const item = (
        <div
          class={`layer-item ${layer.isActive ? "active" : ""} ${layer.locked ? "locked" : ""} ${isBackground ? "background-layer" : ""}`}
          data-layer-id={String(layer.id)}
          data-original-index={String(index)}
          draggable={!isBackground}
          onClick={(e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest("button") && !target.closest("input")) {
              layerManager.setActiveLayer(layer.id);
              if (props.onSelect) props.onSelect(layer.id);
            }
          }}
        >
          {checkbox}
          {thumbnail}
          {info}
          {lockBtn}
          {hideBtn}
        </div>
      ) as HTMLElement;

      // Drag and drop events
      if (!isBackground) {
        item.addEventListener("dragstart", (e: DragEvent) => {
          draggedElement = item;
          draggedLayerId = layer.id;
          item.classList.add("dragging");
          if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", String(layer.id));
          }
        });

        item.addEventListener("dragover", (e: DragEvent) => {
          e.preventDefault();
          const target = (e.target as HTMLElement).closest(".layer-item") as HTMLElement | null;
          if (target && target !== draggedElement) {
            const targetId = parseInt(target.dataset.layerId || "", 10);
            if (targetId === 0) {
              if (e.dataTransfer) e.dataTransfer.dropEffect = "none";
              target.classList.add("drag-over", "no-drop");
            } else {
              if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
              target.classList.add("drag-over");
              target.classList.remove("no-drop");
            }
          }
        });

        item.addEventListener("dragleave", (e: DragEvent) => {
          const target = (e.target as HTMLElement).closest(".layer-item") as HTMLElement | null;
          if (target) {
            target.classList.remove("drag-over", "no-drop");
          }
        });

        item.addEventListener("drop", (e: DragEvent) => {
          e.preventDefault();
          const target = (e.target as HTMLElement).closest(".layer-item") as HTMLElement | null;
          if (!target || target === draggedElement) return;
          const targetId = parseInt(target.dataset.layerId || "", 10);
          if (draggedLayerId !== null && !isNaN(targetId)) {
            layerManager.reorderLayer(draggedLayerId, targetId);
          }
        });

        item.addEventListener("dragend", () => {
          item.classList.remove("dragging");
          container.querySelectorAll(".layer-item").forEach((el) => {
            el.classList.remove("drag-over", "no-drop");
          });
          draggedElement = null;
          draggedLayerId = null;
        });
      }

      container.appendChild(item);
    });

    updateDeleteButtonVisibility();
  }

  // Đăng ký các sự kiện từ EventBus để đồng bộ hóa UI
  eventBus.on<LayerItemDTO[]>("layer:changed", (layers) => {
    render(layers);
  });

  eventBus.on("canvas:rendered", () => {
    render();
  });

  // Render ban đầu
  render();

  return container;
}
