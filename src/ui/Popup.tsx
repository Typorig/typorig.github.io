/**
 * Popup and Dropdown UI Components - TSX Real DOM
 * Thay thế js/core/popup.js mà không phụ thuộc window.*
 */

import { h } from "./jsx";

export interface PopupOptions {
  title?: string;
  content?: string | Node;
  width?: string;
  maxHeight?: string;
  onClose?: () => void;
}

export interface PopupInstance {
  close: () => void;
}

export interface DropdownItem {
  label: string;
  icon?: string | Node;
  [key: string]: any;
}

export interface DropdownOptions {
  items: DropdownItem[];
  onItemClick?: (item: DropdownItem) => void;
}

/**
 * Hiển thị Modal Overlay Popup
 */
export function showPopup(opts?: PopupOptions): PopupInstance {
  const {
    title = "",
    content = "",
    width = "400px",
    maxHeight,
    onClose,
  } = opts || {};

  let closed = false;
  let onKey: ((e: KeyboardEvent) => void) | null = null;

  function close() {
    if (closed) return;
    closed = true;

    overlay.classList.add("popup-closing");
    if (onKey) {
      document.removeEventListener("keydown", onKey);
    }
    setTimeout(() => {
      overlay.remove();
    }, 150);
    if (onClose) onClose();
  }

  onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      close();
    }
  };

  const closeBtn = (
    <button
      type="button"
      class="popup-close"
      aria-label="Close"
      onClick={close}
    >
      &times;
    </button>
  );

  const headerEl = (
    <div class="popup-header">
      <span class="popup-title">{title}</span>
      {closeBtn}
    </div>
  );

  const bodyEl = <div class="popup-body"></div> as HTMLElement;
  if (typeof content === "string") {
    bodyEl.innerHTML = content;
  } else if (content instanceof Node) {
    bodyEl.appendChild(content);
  }

  const boxStyle: Record<string, string> = { width };
  if (maxHeight !== undefined) {
    boxStyle.maxHeight = maxHeight;
  }

  const box = (
    <div class="popup-box" style={boxStyle}>
      {headerEl}
      {bodyEl}
    </div>
  ) as HTMLElement;

  const overlay = (
    <div
      class="popup-overlay"
      onClick={(e: MouseEvent) => {
        if (e.target === overlay) {
          close();
        }
      }}
    >
      {box}
    </div>
  ) as HTMLElement;

  document.body.appendChild(overlay);
  document.addEventListener("keydown", onKey);

  requestAnimationFrame(() => {
    overlay.classList.add("popup-open");
  });

  return { close };
}

/**
 * Hiển thị Dropdown Menu tương tác với 1 trigger element
 */
export function showDropdown(
  triggerEl: HTMLElement,
  opts?: DropdownOptions
): void {
  const { items = [], onItemClick } = opts || {};

  // Đóng bất kỳ dropdown nào đang tồn tại
  document.querySelectorAll(".dropdown-menu").forEach((d) => d.remove());

  const menu = (<div class="dropdown-menu"></div>) as HTMLElement;

  items.forEach((item) => {
    const btn = (
      <button
        type="button"
        class="dropdown-item"
        onClick={(e: MouseEvent) => {
          e.stopPropagation();
          menu.remove();
          if (onItemClick) onItemClick(item);
        }}
      >
        {typeof item.icon === "string" ? (
          <span class="dropdown-item-icon" innerHTML={item.icon}></span>
        ) : item.icon instanceof Node ? (
          item.icon
        ) : null}
        <span>{item.label}</span>
      </button>
    ) as HTMLElement;

    menu.appendChild(btn);
  });

  document.body.appendChild(menu);

  const rect = triggerEl.getBoundingClientRect();
  menu.style.top = `${rect.bottom + 4}px`;
  menu.style.left = `${Math.min(
    rect.left,
    window.innerWidth - menu.offsetWidth - 8
  )}px`;

  const closeDropdown = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node) && e.target !== triggerEl) {
      menu.remove();
      document.removeEventListener("click", closeDropdown);
      document.removeEventListener("keydown", onKey);
    }
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      menu.remove();
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", closeDropdown);
    }
  };

  setTimeout(() => document.addEventListener("click", closeDropdown), 0);
  document.addEventListener("keydown", onKey);
}
