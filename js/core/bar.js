"use strict";

/* ── Top bar buttons ── */
document.querySelectorAll(".top-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const action = btn.dataset.action;

    // Undo / Redo: flash active for 200ms
    if (action === "undo" || action === "redo") {
      btn.classList.add("active");
      setTimeout(() => btn.classList.remove("active"), 200);
      return;
    }

    // Ruler: toggle switch (sticky)
    if (action === "ruler") {
      btn.classList.toggle("active");
      return;
    }

    // Layer: toggle layer sidebar
    if (action === "layer") {
      btn.classList.toggle("active");
      const layerSidebar = document.getElementById("layer-sidebar");
      const body = document.getElementById("body");
      
      if (btn.classList.contains("active")) {
        layerSidebar.classList.remove("hidden");
        body.classList.add("layer-open");
        // Update layer list
        if (typeof updateLayerList === "function") {
          updateLayerList();
        }
      } else {
        layerSidebar.classList.add("hidden");
        body.classList.remove("layer-open");
      }
      return;
    }

    // Add: dropdown menu
    if (action === "add") {
      showDropdown(btn, {
        items: [
          { label: "Text", action: "add-text", icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M5 4v3h5.5v12h3V7H19V4H5z"/></svg>' },
          { label: "Current Date", action: "add-date", icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>' },
          { label: "Emojis", action: "add-emojis", icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>' },
          { label: "Shapes", action: "add-shapes", icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>' },
          { label: "Import", action: "add-import", icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>' },
        ],
        onItemClick: (item) => console.log("Add:", item.action)
      });
      return;
    }

    // Save: dropdown menu
    if (action === "save") {
      showDropdown(btn, {
        items: [
          { label: "Save as Project", action: "save-project", icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>' },
          { label: "Save as PNG", action: "save-png", icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>' },
          { label: "Save as JPG", action: "save-jpg", icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>' },
        ],
        onItemClick: (item) => {
          if (item.action === "save-png" || item.action === "save-jpg") {
            exportImage(item.action === "save-png" ? "png" : "jpeg");
          } else {
            console.log("Save:", item.action);
          }
        }
      });
      return;
    }

    // More: dropdown menu
    if (action === "more") {
      showDropdown(btn, {
        items: [
          { label: "View", action: "more-view", icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>' },
          { label: "Open Project (.trp)", action: "more-open", icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>' },
          { label: "Shortcut", action: "more-shortcut", icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM9 8h2v8H9zm4 0h2v8h-2z"/></svg>' },
          { label: "GitHub", action: "more-github", icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 2C6.475 2 2 6.475 2 12c0 4.425 2.875 8.175 6.85 9.5.5.075.675-.2.675-.475v-1.7c-2.75.6-3.325-1.3-3.325-1.3-.45-1.125-1.1-1.425-1.1-1.425-.9-.6.075-.6.075-.6 1 .075 1.525 1.025 1.525 1.025.9 1.525 2.35 1.075 2.925.825.075-.65.35-1.075.625-1.325-2.2-.25-4.5-1.1-4.5-4.9 0-1.075.375-1.95 1.025-2.625-.1-.25-.45-1.275.1-2.65 0 0 .825-.275 2.7 1.025.8-.225 1.65-.325 2.5-.325s1.7.1 2.5.325c1.875-1.3 2.7-1.025 2.7-1.025.55 1.375.2 2.4.1 2.65.65.675 1.025 1.55 1.025 2.625 0 3.8-2.3 4.65-4.5 4.9.35.3.675.925.675 1.85v2.725c0 .275.175.55.675.475C19.125 20.175 22 16.425 22 12c0-5.525-4.475-10-10-10"/></svg>' },
          { label: "About", action: "more-about", icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>' },
        ],
        onItemClick: (item) => {
          if (item.action === "more-github") {
            window.open("https://github.com/Typorig/typorig.github.io", "_blank");
          } else if (item.action === "more-about") {
            showPopup({
              title: "About Typorig",
              width: "420px",
              content: `
                <div style="text-align:center;padding:8px 0;">
                  <h2 style="font-size:20px;margin:0 0 4px;color:#fff;">Typorig</h2>
                  <p style="color:#aaa;margin:0 0 16px;font-size:13px;">by Sao Tin Developers</p>
                  <p style="color:#ccc;font-size:13px;line-height:1.6;margin:0 0 16px;">
                    Typorig is a browser-based image editing tool that runs entirely on the frontend.
                  </p>
                  <p style="font-size:12px;color:#999;margin:0 0 6px;">
                    License: <a href="https://github.com/Typorig/typorig.github.io/blob/master/LICENSE.md" target="_blank" style="color:#4da6ff;">Apache License Version 2.0</a>
                  </p>
                  <p style="font-size:12px;color:#999;margin:0 0 16px;">
                    GitHub: <a href="https://github.com/Typorig/typorig.github.io" target="_blank" style="color:#4da6ff;">github.com/Typorig/typorig.github.io</a>
                  </p>
                  <p style="color:#888;font-size:13px;margin:0;">Have fun using Typorig! :)</p>
                </div>
              `
            });
          } else {
            console.log("More:", item.action);
          }
        }
      });
      return;
    }
  });
});

/* ── Sidebar sections ── */
document.querySelectorAll(".sidebar-section").forEach((sec) => {
  sec.addEventListener("click", () => {
    document.querySelectorAll(".sidebar-section").forEach((s) => s.classList.remove("active"));
    sec.classList.add("active");

    const section = sec.dataset.section;
    const subSidebar = document.getElementById("sub-sidebar");
    const body = document.getElementById("body");
    const subGroups = document.querySelectorAll(".sub-group");

    // Close ColorModule if switching sections
    if (typeof ColorModule !== "undefined" && ColorModule.isActive()) {
      ColorModule.close();
    }

    const hasSub = section === "elements" || section === "text" || section === "background" || section === "effects";

    if (hasSub) {
      subSidebar.classList.remove("hidden");
      body.classList.add("sub-open");
      
      // Khôi phục sub-sidebar HTML gốc nếu đang ở panel tùy chỉnh (Size, Relative Position, v.v.)
      if (window._savedSubHTML) {
        subSidebar.innerHTML = window._savedSubHTML;
        window._savedSubHTML = null;
        // Rebind sub-item click listeners
        document.querySelectorAll(".sub-item").forEach((item) => {
          item.addEventListener("click", function subClick() {
            document.querySelectorAll(".sub-item").forEach((i) => i.classList.remove("active"));
            this.classList.add("active");
            const sub = this.dataset.sub;
            if (sub === "bg-from-camera") typeof openCamera === "function" && openCamera();
            if (sub === "bg-from-upload") typeof openUpload === "function" && openUpload();
            if (sub === "bg-transparent") typeof openTransparent === "function" && openTransparent();
            if (sub === "bg-crop" && typeof CropModule !== "undefined") CropModule.open();
            if (sub === "bg-color" && typeof openColorPanel === "function") openColorPanel();
            if (sub === "bg-size" && typeof openSizePanel === "function") openSizePanel();
          });
        });
      }

      // Hide all groups first, then show the active one
      const currentSubGroups = document.querySelectorAll(".sub-group");
      currentSubGroups.forEach((g) => g.classList.add("hidden"));
      
      // Nếu là text section và trước đó đã mở text-props hoặc có layer text đang chọn
      let targetSection = section;
      if (section === "text" && window.textTransform && window.textTransform.selectedLayer && window.textTransform.selectedLayer.type === "text") {
        targetSection = "text-props";
      }

      let activeGroup = document.querySelector(`.sub-group[data-section="${targetSection}"]`);
      if (!activeGroup && section === "text") {
        activeGroup = document.querySelector(`.sub-group[data-section="text"]`);
      }
      if (activeGroup) activeGroup.classList.remove("hidden");
    } else if (section === "setting") {
      // Setting opens as a popup — keep sub-sidebar as-is
      showPopup({
        title: "Settings",
        width: "480px",
        content: `
          <div style="display:flex;flex-direction:column;gap:16px;">
            <div class="setting-row">
              <label style="color:#ccc;font-size:13px;display:block;margin-bottom:4px;">Canvas Size</label>
              <div style="display:flex;gap:8px;">
                <input type="number" id="setting-canvas-w" value="1920" style="flex:1;background:#1e1e1e;border:1px solid #555;border-radius:4px;padding:6px 8px;color:#e0e0e0;font-size:13px;" placeholder="Width" />
                <span style="color:#777;line-height:32px;">×</span>
                <input type="number" id="setting-canvas-h" value="1080" style="flex:1;background:#1e1e1e;border:1px solid #555;border-radius:4px;padding:6px 8px;color:#e0e0e0;font-size:13px;" placeholder="Height" />
              </div>
            </div>
            <div class="setting-row">
              <label style="color:#ccc;font-size:13px;display:block;margin-bottom:4px;">Canvas Background Color</label>
              <input type="color" id="setting-canvas-bg" value="#1e1e1e" style="width:100%;height:36px;background:#1e1e1e;border:1px solid #555;border-radius:4px;cursor:pointer;" />
            </div>
            <div class="setting-row">
              <label style="color:#ccc;font-size:13px;display:block;margin-bottom:4px;">Theme</label>
              <select id="setting-theme" style="width:100%;background:#1e1e1e;border:1px solid #555;border-radius:4px;padding:6px 8px;color:#e0e0e0;font-size:13px;">
                <option value="dark">Dark (default)</option>
                <option value="light">Light</option>
              </select>
            </div>
            <div class="setting-row">
              <label style="color:#ccc;font-size:13px;display:block;margin-bottom:4px;">Language</label>
              <select id="setting-lang" style="width:100%;background:#1e1e1e;border:1px solid #555;border-radius:4px;padding:6px 8px;color:#e0e0e0;font-size:13px;">
                <option value="en">English</option>
                <option value="vi">Tiếng Việt</option>
              </select>
            </div>
            <div class="setting-row">
              <label style="color:#ccc;font-size:13px;display:block;margin-bottom:4px;">Shortcut Settings</label>
              <p style="color:#888;font-size:12px;margin:0;">Coming soon...</p>
            </div>
          </div>
        `
      });
    } else {
      subSidebar.classList.add("hidden");
      body.classList.remove("sub-open");
    }

    console.log("Section:", section);
  });
});

/* ── Sub sidebar items ── */
document.querySelectorAll(".sub-item").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".sub-item").forEach((i) => i.classList.remove("active"));
    item.classList.add("active");
    const sub = item.dataset.sub;
    console.log("Sub action:", sub);

    // From Camera
    if (sub === "bg-from-camera") {
      openCamera();
    }

    // From Upload
    if (sub === "bg-from-upload") {
      openUpload();
    }

    // Transparent
    if (sub === "bg-transparent") {
      openTransparent();
    }

    // Crop (only for real images)
    if (sub === "bg-crop") {
      if (typeof CropModule !== "undefined") CropModule.open();
    }

    // Color (Monochrome / Gradient)
    if (sub === "bg-color") {
      openColorPanel();
    }

    // Size
    if (sub === "bg-size") {
      openSizePanel();
    }
  });
});

/* ── Camera capture ── */
function openCamera() {
  let stream = null;
  let capturedDataUrl = null;

  const popup = showPopup({
    title: "Capture from Camera",
    width: "520px",
    content: `
      <div id="camera-container" style="position:relative;text-align:center;">
        <video id="camera-preview" autoplay playsinline style="width:100%;border-radius:6px;background:#000;max-height:60vh;display:none;"></video>
        <canvas id="camera-canvas" style="display:none;"></canvas>
        <div id="camera-placeholder" style="padding:60px 20px;color:#888;font-size:14px;text-align:center;">
          <p style="margin:0 0 8px;">⏳ Requesting camera access...</p>
          <p style="font-size:12px;color:#666;margin:0;">Please allow camera permission when prompted.</p>
        </div>
        <div id="camera-preview-wrapper" style="display:none;">
          <img id="camera-captured-img" style="width:100%;border-radius:6px;max-height:60vh;" />
        </div>
        <div style="display:flex;gap:12px;justify-content:center;margin-top:16px;">
          <button id="camera-capture-btn" style="padding:10px 24px;background:#094771;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600;">📷 Capture</button>
          <button id="camera-retake-btn" style="padding:10px 24px;background:#555;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;display:none;">🔄 Retake</button>
          <button id="camera-use-btn" style="padding:10px 24px;background:#2d8a2d;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600;display:none;">✓ Use Photo</button>
        </div>
      </div>
    `,
    onClose: stopCamera
  });

  const video = document.getElementById("camera-preview");
  const canvas = document.getElementById("camera-canvas");
  const placeholder = document.getElementById("camera-placeholder");
  const previewWrapper = document.getElementById("camera-preview-wrapper");
  const capturedImg = document.getElementById("camera-captured-img");
  const captureBtn = document.getElementById("camera-capture-btn");
  const retakeBtn = document.getElementById("camera-retake-btn");
  const useBtn = document.getElementById("camera-use-btn");

  async function startCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      video.srcObject = stream;
      await video.play();
      placeholder.style.display = "none";
      video.style.display = "block";
    } catch (err) {
      placeholder.innerHTML = `
        <p style="color:#e74c3c;margin:0 0 8px;">❌ Camera access denied</p>
        <p style="font-size:12px;color:#999;margin:0;">${err.message}</p>
      `;
    }
  }
  startCamera();

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
  }

  captureBtn.addEventListener("click", () => {
    if (!video.videoWidth) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const capCtx = canvas.getContext("2d");
    capCtx.drawImage(video, 0, 0);
    capturedDataUrl = canvas.toDataURL("image/png");

    // Show captured image, hide video
    video.style.display = "none";
    capturedImg.src = capturedDataUrl;
    previewWrapper.style.display = "block";

    captureBtn.style.display = "none";
    retakeBtn.style.display = "inline-flex";
    useBtn.style.display = "inline-flex";

    stopCamera();
  });

  retakeBtn.addEventListener("click", () => {
    previewWrapper.style.display = "none";
    capturedDataUrl = null;
    captureBtn.style.display = "inline-flex";
    retakeBtn.style.display = "none";
    useBtn.style.display = "none";
    startCamera();
  });

  useBtn.addEventListener("click", () => {
    if (capturedDataUrl) {
      // Convert data URL to a File and load into canvas
      fetch(capturedDataUrl)
        .then((r) => r.blob())
        .then((blob) => {
          const file = new File([blob], "camera-capture.png", { type: "image/png" });
          if (typeof window.loadImage === "function") {
            window.loadImage(file);
          }
        });
    }
    stopCamera();
    popup.close();
  });

}

/* ── Upload image (file or URL) ── */
function openUpload() {
  showPopup({
    title: "Upload Image",
    width: "420px",
    content: `
      <div id="upload-container" style="display:flex;flex-direction:column;gap:16px;">
        <!-- File upload -->
        <label style="color:#ccc;font-size:13px;font-weight:600;">From File</label>
        <input type="file" id="upload-file-input" accept="image/*" style="color:#ccc;font-size:13px;" />

        <div style="display:flex;align-items:center;gap:12px;color:#666;font-size:12px;">
          <span style="flex:1;height:1px;background:#444;"></span>
          <span>OR</span>
          <span style="flex:1;height:1px;background:#444;"></span>
        </div>

        <!-- URL input -->
        <label style="color:#ccc;font-size:13px;font-weight:600;">From URL</label>
        <div style="display:flex;gap:8px;">
          <input type="text" id="upload-url-input" placeholder="https://example.com/image.jpg" style="flex:1;background:#1e1e1e;border:1px solid #555;border-radius:4px;padding:8px 10px;color:#e0e0e0;font-size:13px;" />
          <button id="upload-url-btn" style="padding:8px 16px;background:#094771;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;font-weight:600;">Load</button>
        </div>

        <div id="upload-error" style="display:none;color:#e74c3c;font-size:12px;padding:8px;background:#3a1a1a;border-radius:4px;border:1px solid #5a2a2a;"></div>
      </div>
    `
  });

  const fileInput = document.getElementById("upload-file-input");
  const urlInput = document.getElementById("upload-url-input");
  const urlBtn = document.getElementById("upload-url-btn");
  const errorEl = document.getElementById("upload-error");

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.style.display = "block";
  }

  function hideError() {
    errorEl.style.display = "none";
  }

  function loadFromFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      showError("Please select a valid image file.");
      return;
    }
    if (typeof window.loadImage === "function") {
      window.loadImage(file);
      hideError();
      // Close popup after short delay so user sees confirmation
      setTimeout(() => {
        const popupOverlay = document.querySelector(".popup-overlay");
        if (popupOverlay) {
          const closeBtn = popupOverlay.querySelector(".popup-close");
          if (closeBtn) closeBtn.click();
        }
      }, 300);
    }
  }

  function loadFromUrl(url) {
    if (!url.trim()) {
      showError("Please enter an image URL.");
      return;
    }
    // Fetch the image via a proxy-less approach: load into Image with CORS
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Draw to canvas to get a blob, then pass to loadImage
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const cCtx = c.getContext("2d");
      cCtx.drawImage(img, 0, 0);
      c.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "url-image.png", { type: "image/png" });
          if (typeof window.loadImage === "function") {
            window.loadImage(file);
            hideError();
            setTimeout(() => {
              const popupOverlay = document.querySelector(".popup-overlay");
              if (popupOverlay) {
                const closeBtn = popupOverlay.querySelector(".popup-close");
                if (closeBtn) closeBtn.click();
              }
            }, 300);
          }
        } else {
          showError("Failed to process image from URL.");
        }
      });
    };
    img.onerror = () => {
      showError("Could not load image from URL. Check the link or CORS policy.");
    };
    img.src = url;
  }

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      loadFromFile(fileInput.files[0]);
    }
  });

  urlBtn.addEventListener("click", () => loadFromUrl(urlInput.value));
  urlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") loadFromUrl(urlInput.value);
  });
}

/* ── Color panel (delegates to ColorModule) ── */
function openColorPanel() {
  if (typeof ColorModule !== "undefined") {
    ColorModule.open();
  }
}

/* ── Transparent (clear canvas content, keep size) ── */
function openTransparent() {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width || 1200;
  const H = canvas.height || 600;
  ctx.clearRect(0, 0, W, H);

  // Update sourceImage to empty transparent
  // Create a 1x1 transparent pixel instead of full canvas to save memory and easily identify it
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 1;
  tempCanvas.height = 1;
  const dataUrl = tempCanvas.toDataURL();
  
  const img = new Image();
  img.onload = () => {
    // Set dimensions to match current canvas
    img.width = W;
    img.height = H;
    
    window.sourceImage = img;
    window.displayImage = img;
    window.hasRealImage = false;
    if (typeof window.updateCropButtonState === "function") {
      window.updateCropButtonState();
    }
    
    // Clear background layer if it exists
    if (window.layerManager) {
      const bgLayer = window.layerManager.layers.find(l => l.name === "Background");
      if (bgLayer) {
        bgLayer.ctx.clearRect(0, 0, bgLayer.canvas.width, bgLayer.canvas.height);
        // Also clear the image data in the background layer
        bgLayer.image = null;
        // Clear any gradient/color data
        if (window.ColorModule) {
          window.ColorModule.lastBackground = null;
        }
      }
      window.layerManager.render();
    } else if (typeof render === "function") {
      render();
    }
  };
  img.src = dataUrl;
}

/* ── Disable Crop button if no real image ── */
window.updateCropButtonState = function() {
  const cropBtns = document.querySelectorAll('.sub-item[data-sub="bg-crop"]');
  cropBtns.forEach(btn => {
    if (window.hasRealImage) {
      btn.classList.remove("disabled");
      btn.style.pointerEvents = "";
      btn.style.opacity = "";
    } else {
      btn.classList.add("disabled");
      btn.style.pointerEvents = "none";
      btn.style.opacity = "0.4";
    }
  });
};

// Initial check
setTimeout(window.updateCropButtonState, 100);

/* ── Size panel ── */
function openSizePanel() {
  const canvas = document.getElementById("canvas");
  const img = window.sourceImage;
  const w = canvas ? canvas.width : (img ? img.width : 800);
  const h = canvas ? canvas.height : (img ? img.height : 600);
  
  // Safe GCD function that won't throw
  function gcd(a, b) {
    if (!b) return a || 1;
    return gcd(b, a % b);
  }
  const g = gcd(w, h);
  let aspectW = Math.round(w / g);
  let aspectH = Math.round(h / g);
  let keepAspect = true;
  let currentW = w;
  let currentH = h;

  const presets = [
    { label: "Original", w: w, h: h },
    { label: "Square (1:1)", w: 1080, h: 1080 },
    { label: "Instagram Portrait (4:5)", w: 1080, h: 1350 },
    { label: "Instagram Landscape (1.91:1)", w: 1080, h: 565 },
    { label: "Twitter Post (16:9)", w: 1280, h: 720 },
    { label: "Twitter Header (3:1)", w: 1500, h: 500 },
    { label: "Facebook Post (1.91:1)", w: 1200, h: 630 },
    { label: "Facebook Cover (16:9)", w: 1640, h: 624 },
    { label: "YouTube Thumbnail (16:9)", w: 1280, h: 720 },
    { label: "TikTok (9:16)", w: 1080, h: 1920 },
    { label: "A4 (1:√2)", w: 2480, h: 3508 },
    { label: "A3 (1:√2)", w: 3508, h: 4961 },
  ];

  function constructHTML() {
    return `
      <div class="size-panel" style="display:flex;flex-direction:column;gap:12px;">
        <button id="size-back-btn" class="sub-item" style="margin-bottom:4px;">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
          <span>Back</span>
        </button>
        <!-- Aspect Ratio -->
        <div>
          <label style="font-size:11px;color:#999;display:block;margin-bottom:4px;">Aspect Ratio</label>
          <div id="size-aspect-display" style="font-family:monospace;font-size:13px;color:#e0e0e0;background:#1e1e1e;padding:8px 10px;border-radius:4px;border:1px solid #555;text-align:center;">
            ${aspectW}:${aspectH}
          </div>
        </div>
        <!-- Width / Height -->
        <div>
          <label style="font-size:11px;color:#999;display:block;margin-bottom:4px;">Dimensions</label>
          <div style="display:flex;gap:8px;">
            <div style="flex:1;">
              <span style="font-size:10px;color:#888;">Width</span>
              <input type="number" id="size-width" value="${currentW}" min="1" style="width:100%;background:#1e1e1e;border:1px solid #555;border-radius:4px;padding:6px 8px;color:#e0e0e0;font-size:13px;" />
            </div>
            <div style="flex:1;">
              <span style="font-size:10px;color:#888;">Height</span>
              <input type="number" id="size-height" value="${currentH}" min="1" style="width:100%;background:#1e1e1e;border:1px solid #555;border-radius:4px;padding:6px 8px;color:#e0e0e0;font-size:13px;" />
            </div>
          </div>
          <label style="display:flex;align-items:center;gap:6px;margin-top:6px;font-size:11px;color:#999;cursor:pointer;">
            <input type="checkbox" id="size-keep-aspect" checked />
            Keep aspect ratio
          </label>
        </div>
        <!-- Preset -->
        <div>
          <label style="font-size:11px;color:#999;display:block;margin-bottom:4px;">Preset</label>
          <button id="size-preset-btn" style="width:100%;padding:8px 10px;background:#1e1e1e;border:1px solid #555;border-radius:4px;color:#ccc;font-size:12px;cursor:pointer;text-align:left;display:flex;align-items:center;justify-content:space-between;">
            <span id="size-preset-label">Select preset...</span>
            <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>
          </button>
        </div>
        <!-- Apply -->
        <button id="size-apply-btn" style="padding:8px 14px;background:#094771;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;font-weight:600;">Apply</button>
      </div>
    `;
  }

  const container = document.getElementById("sub-sidebar");
  if (!container) return;

  // Close ColorModule if active
  if (typeof ColorModule !== "undefined" && ColorModule.isActive()) {
    ColorModule.close();
  }

  // Save original sub-sidebar HTML for back/restore (only if not already a panel)
  if (!container.querySelector(".size-panel")) {
    window._savedSubHTML = container.innerHTML;
  }
  container.innerHTML = constructHTML();

  const widthInput = document.getElementById("size-width");
  const heightInput = document.getElementById("size-height");
  const keepCheck = document.getElementById("size-keep-aspect");
  const aspectDisplay = document.getElementById("size-aspect-display");
  const presetBtn = document.getElementById("size-preset-btn");
  const applyBtn = document.getElementById("size-apply-btn");

  // Back button
  document.getElementById("size-back-btn").addEventListener("click", () => {
    if (window._savedSubHTML) {
      container.innerHTML = window._savedSubHTML;
      window._savedSubHTML = null;
      // Rebind sub-item events for Background group
      document.querySelectorAll(".sub-item").forEach((item) => {
        item.addEventListener("click", function subClick() {
          document.querySelectorAll(".sub-item").forEach((i) => i.classList.remove("active"));
          this.classList.add("active");
          const sub = this.dataset.sub;
          if (sub === "bg-from-camera") openCamera();
          if (sub === "bg-from-upload") openUpload();
          if (sub === "bg-transparent") openTransparent();
          if (sub === "bg-crop" && typeof CropModule !== "undefined") CropModule.open();
          if (sub === "bg-color") openColorPanel();
          if (sub === "bg-size") openSizePanel();
        });
      });
    }
  });

  // Keep aspect ratio logic
  function updateAspect() {
    const a = parseInt(widthInput.value);
    const b = parseInt(heightInput.value);
    if (a > 0 && b > 0) {
      const gv = gcd(a, b);
      aspectDisplay.textContent = `${a / gv}:${b / gv}`;
    }
  }

  widthInput.addEventListener("input", () => {
    if (keepCheck.checked) {
      const newW = parseInt(widthInput.value) || 1;
      heightInput.value = Math.round(newW * (currentH / currentW));
    }
    updateAspect();
  });

  heightInput.addEventListener("input", () => {
    if (keepCheck.checked) {
      const newH = parseInt(heightInput.value) || 1;
      widthInput.value = Math.round(newH * (currentW / currentH));
    }
    updateAspect();
  });

  keepCheck.addEventListener("change", () => {
    if (keepCheck.checked) {
      currentW = parseInt(widthInput.value) || w;
      currentH = parseInt(heightInput.value) || h;
    }
  });

  // Preset dropdown
  presetBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showDropdown(presetBtn, {
      items: presets.map(p => ({
        label: p.label,
        action: "preset",
        _w: p.w,
        _h: p.h
      })),
      onItemClick: (item) => {
        document.getElementById("size-preset-label").textContent = item.label;
        widthInput.value = item._w;
        heightInput.value = item._h;
        currentW = item._w;
        currentH = item._h;
        updateAspect();
      }
    });
  });

  // Apply
  applyBtn.addEventListener("click", () => {
    const newW = parseInt(widthInput.value);
    const newH = parseInt(heightInput.value);
    if (newW > 0 && newH > 0) {
      const c = document.getElementById("canvas");
      const ctx = c.getContext("2d");
      const srcImg = window.sourceImage;
      if (!srcImg) return;
      const layerManager = window.layerManager || null;

      if (layerManager && typeof layerManager.resizeAllLayers === "function") {
        c.width = newW;
        c.height = newH;
        layerManager.resizeAllLayers(newW, newH);
        if (typeof ColorModule !== "undefined" && typeof ColorModule.reapplyBackground === "function") {
          ColorModule.reapplyBackground(false);
        }
        layerManager.render();
        if (typeof window.updateLayerList === "function") window.updateLayerList();

        const dataUrl = c.toDataURL();
        const newImg = new Image();
        newImg.onload = () => {
          window.sourceImage = newImg;
          window.displayImage = newImg;
        };
        newImg.src = dataUrl;
        return;
      }

      c.width = newW;
      c.height = newH;
      ctx.clearRect(0, 0, newW, newH);
      ctx.drawImage(srcImg, 0, 0, newW, newH);
      const dataUrl = c.toDataURL();
      const newImg = new Image();
      newImg.onload = () => {
        window.sourceImage = newImg;
        window.displayImage = newImg;
        if (typeof render === "function") render();
      };
      newImg.src = dataUrl;
    }
  });
}

/* ── Export Image ── */
function exportImage(type = "png") {
  const canvas = document.getElementById("canvas");
  if (!canvas) return;
  
  if (window.layerManager) {
    window.layerManager.render();
  }
  
  const link = document.createElement("a");
  link.download = `typorig-export-${Date.now()}.${type === "jpeg" ? "jpg" : "png"}`;
  link.href = canvas.toDataURL(type === "jpeg" ? "image/jpeg" : "image/png", 0.95);
  link.click();
}

/* ── Layer Sidebar Controls ── */
document.addEventListener("DOMContentLoaded", () => {
  const layerCloseBtn = document.querySelector(".layer-sidebar-close");
  if (layerCloseBtn) {
    layerCloseBtn.addEventListener("click", () => {
      const layerSidebar = document.getElementById("layer-sidebar");
      const body = document.getElementById("body");
      const layerBtn = document.querySelector('.top-btn[data-action="layer"]');
      
      layerSidebar.classList.add("hidden");
      body.classList.remove("layer-open");
      if (layerBtn) {
        layerBtn.classList.remove("active");
      }
    });
  }
  
  // Delete selected layers button
  const deleteBtn = document.getElementById("layer-delete-selected");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      const layerManager = window.layerManager;
      const selectedLayers = window.selectedLayers;
      
      if (!layerManager || !selectedLayers || selectedLayers.size === 0) return;
      
      // Confirm deletion
      const count = selectedLayers.size;
      if (!confirm(`Bạn có chắc muốn xóa ${count} layer${count > 1 ? 's' : ''} đã chọn?`)) {
        return;
      }
      
      // Delete each selected layer (không thể xóa Background layer)
      const toDelete = Array.from(selectedLayers);
      toDelete.forEach(layerId => {
        if (layerId !== 0) { // Không xóa Background layer
          layerManager.deleteLayer(layerId);
        }
      });
      
      // Clear selection
      selectedLayers.clear();
      
      // Re-render
      layerManager.render();
      if (typeof window.updateLayerList === "function") {
        window.updateLayerList();
      }

      // Check if text layers still exist
      const hasTextLayers = layerManager.layers.some(l => l.type === "text");
      if (!hasTextLayers && window.textHandler && typeof window.textHandler.hideTextProperties === "function") {
        window.textHandler.hideTextProperties();
      }
    });
  }
});

