"use strict";

/* ── Popup (modal overlay) ── */
function showPopup(opts) {
  const {
    title = "",
    content = "",
    width = "400px",
    maxHeight, // allow overriding CSS max-height (e.g. "none" for large popups)
    onClose
  } = opts || {};

  // Overlay
  const overlay = document.createElement("div");
  overlay.className = "popup-overlay";
  // Popup box
  const box = document.createElement("div");
  box.className = "popup-box";
  box.style.width = width;
  if (maxHeight !== undefined) box.style.maxHeight = maxHeight;
  box.innerHTML = `
    <div class="popup-header">
      <span class="popup-title">${title}</span>
      <button class="popup-close" aria-label="Close">&times;</button>
    </div>
    <div class="popup-body">${content}</div>
  `;
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  function close() {
    overlay.classList.add("popup-closing");
    setTimeout(() => { overlay.remove(); }, 150);
    if (onClose) onClose();
  }

  // Close on overlay click or X button
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  box.querySelector(".popup-close").addEventListener("click", close);
  // Escape key
  const onKey = (e) => { if (e.key === "Escape") { close(); document.removeEventListener("keydown", onKey); } };
  document.addEventListener("keydown", onKey);

  // Animate in
  requestAnimationFrame(() => overlay.classList.add("popup-open"));

  return { close };
}

/* ── Dropdown menu ── */
function showDropdown(triggerEl, opts) {
  const {
    items = [],
    onItemClick
  } = opts || {};

  // Close any existing dropdown
  document.querySelectorAll(".dropdown-menu").forEach((d) => d.remove());

  const menu = document.createElement("div");
  menu.className = "dropdown-menu";

  items.forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "dropdown-item";
    btn.innerHTML = `${item.icon || ""}<span>${item.label}</span>`;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.remove();
      if (onItemClick) onItemClick(item);
    });
    menu.appendChild(btn);
  });

  document.body.appendChild(menu);

  // Position below trigger
  const rect = triggerEl.getBoundingClientRect();
  menu.style.top = (rect.bottom + 4) + "px";
  menu.style.left = Math.min(rect.left, window.innerWidth - menu.offsetWidth - 8) + "px";

  // Close on outside click
  const closeDropdown = (e) => {
    if (!menu.contains(e.target) && e.target !== triggerEl) {
      menu.remove();
      document.removeEventListener("click", closeDropdown);
      document.removeEventListener("keydown", onKey);
    }
  };
  const onKey = (e) => { if (e.key === "Escape") { menu.remove(); document.removeEventListener("keydown", onKey); document.removeEventListener("click", closeDropdown); } };
  setTimeout(() => document.addEventListener("click", closeDropdown), 0);
  document.addEventListener("keydown", onKey);
}
