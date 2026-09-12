/**
 * Crop Module - TypeScript thuần + TSX
 * Quản lý cắt ảnh (Crop), tỉ lệ (Aspect Ratio), góc bo (Rounded/Circle)
 * Dùng showPopup từ src/ui/Popup.tsx, không phụ thuộc window.*
 */

import { h } from "../ui/jsx";
import { showPopup, PopupInstance } from "../ui/Popup";
import { eventBus } from "../core/event-bus";
import { LayerManager } from "../core/layer";

export type CropShapeMode = "normal" | "rounded" | "circle";

export interface CropModuleOptions {
  layerManager?: LayerManager;
  sourceImage?: HTMLImageElement | null;
  onCropComplete?: (croppedImage: HTMLImageElement) => void;
  onClose?: () => void;
}

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class CropService {
  private isOpen = false;
  private cropPopup: PopupInstance | null = null;
  private cropMode: CropShapeMode = "normal";
  private borderRadius = 20;

  open(options: CropModuleOptions = {}): void {
    const { layerManager } = options;

    // Lấy source image từ options hoặc từ background layer
    let srcImg = options.sourceImage;
    if (!srcImg && layerManager) {
      const bgLayer = layerManager.getBackgroundLayer();
      if (bgLayer && bgLayer.image) {
        srcImg = bgLayer.image;
      }
    }

    if (!srcImg) {
      showPopup({
        title: "Crop",
        width: "360px",
        content: (
          <p
            style={{
              color: "#e74c3c",
              textAlign: "center",
              padding: "16px 0",
              fontSize: "13px",
            }}
          >
            ❌ Crop is only available for real photos.
            <br />
            Please load an image first.
          </p>
        ),
      });
      return;
    }

    this.isOpen = true;
    this.renderModal(srcImg, options);
  }

  private renderModal(
    srcImg: HTMLImageElement,
    options: CropModuleOptions
  ): void {
    const { onClose } = options;

    let crop: CropRect = { x: 0.05, y: 0.05, w: 0.9, h: 0.9 };
    let currentRatio: "free" | "original" | "custom" | number = "free";

    const cropCanvas = (
      <canvas
        id="crop-canvas"
        style={{ display: "block", maxWidth: "100%", maxHeight: "60vh" }}
      ></canvas>
    ) as HTMLCanvasElement;

    // SVG Mask elements
    const hole = (
      <rect
        id="crop-hole"
        x="10%"
        y="10%"
        width="80%"
        height="80%"
        fill="black"
      />
    ) as unknown as SVGElement;

    // Corner visible paths
    const hnw = (
      <path
        fill="none"
        stroke="#fff"
        stroke-width="4"
        style={{ pointerEvents: "none" }}
      />
    ) as unknown as SVGPathElement;
    const hne = (
      <path
        fill="none"
        stroke="#fff"
        stroke-width="4"
        style={{ pointerEvents: "none" }}
      />
    ) as unknown as SVGPathElement;
    const hsw = (
      <path
        fill="none"
        stroke="#fff"
        stroke-width="4"
        style={{ pointerEvents: "none" }}
      />
    ) as unknown as SVGPathElement;
    const hse = (
      <path
        fill="none"
        stroke="#fff"
        stroke-width="4"
        style={{ pointerEvents: "none" }}
      />
    ) as unknown as SVGPathElement;

    // Edge visible lines
    const hn = (
      <line
        stroke="#fff"
        stroke-width="4"
        style={{ pointerEvents: "none" }}
      />
    ) as unknown as SVGLineElement;
    const hs = (
      <line
        stroke="#fff"
        stroke-width="4"
        style={{ pointerEvents: "none" }}
      />
    ) as unknown as SVGLineElement;
    const hw = (
      <line
        stroke="#fff"
        stroke-width="4"
        style={{ pointerEvents: "none" }}
      />
    ) as unknown as SVGLineElement;
    const he = (
      <line
        stroke="#fff"
        stroke-width="4"
        style={{ pointerEvents: "none" }}
      />
    ) as unknown as SVGLineElement;

    // Hit targets (invisible thick targets)
    const tnw = (
      <path
        fill="none"
        stroke="transparent"
        stroke-width="32"
        style={{ cursor: "nwse-resize", pointerEvents: "auto" }}
      />
    ) as unknown as SVGPathElement;
    const tne = (
      <path
        fill="none"
        stroke="transparent"
        stroke-width="32"
        style={{ cursor: "nesw-resize", pointerEvents: "auto" }}
      />
    ) as unknown as SVGPathElement;
    const tsw = (
      <path
        fill="none"
        stroke="transparent"
        stroke-width="32"
        style={{ cursor: "nesw-resize", pointerEvents: "auto" }}
      />
    ) as unknown as SVGPathElement;
    const tse = (
      <path
        fill="none"
        stroke="transparent"
        stroke-width="32"
        style={{ cursor: "nwse-resize", pointerEvents: "auto" }}
      />
    ) as unknown as SVGPathElement;

    const tn = (
      <line
        stroke="transparent"
        stroke-width="32"
        style={{ cursor: "ns-resize", pointerEvents: "auto" }}
      />
    ) as unknown as SVGLineElement;
    const ts = (
      <line
        stroke="transparent"
        stroke-width="32"
        style={{ cursor: "ns-resize", pointerEvents: "auto" }}
      />
    ) as unknown as SVGLineElement;
    const tw = (
      <line
        stroke="transparent"
        stroke-width="32"
        style={{ cursor: "ew-resize", pointerEvents: "auto" }}
      />
    ) as unknown as SVGLineElement;
    const te = (
      <line
        stroke="transparent"
        stroke-width="32"
        style={{ cursor: "ew-resize", pointerEvents: "auto" }}
      />
    ) as unknown as SVGLineElement;

    const moveArea = (
      <rect
        fill="transparent"
        style={{ cursor: "move", pointerEvents: "auto" }}
      />
    ) as unknown as SVGRectElement;

    const svgOverlay = (
      <svg style={{ width: "100%", height: "100%", display: "block" }}>
        <defs>
          <mask id="crop-mask-unique">
            <rect width="100%" height="100%" fill="white" />
            {hole}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.45)"
          mask="url(#crop-mask-unique)"
        />
        {hnw}
        {hne}
        {hsw}
        {hse}
        {hn}
        {hs}
        {hw}
        {he}
        {tnw}
        {tne}
        {tsw}
        {tse}
        {tn}
        {ts}
        {tw}
        {te}
        {moveArea}
      </svg>
    ) as unknown as HTMLElement;

    const wrap = (
      <div
        id="crop-canvas-wrap"
        style={{
          position: "relative",
          background: "#000",
          borderRadius: "6px",
          overflow: "hidden",
          userSelect: "none",
          minHeight: "300px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ position: "relative", display: "inline-block" }}>
          {cropCanvas}
          <div
            style={{
              position: "absolute",
              inset: "0",
              pointerEvents: "none",
            }}
          >
            {svgOverlay}
          </div>
        </div>
      </div>
    ) as HTMLElement;

    // Aspect buttons definition
    const aspectRatios = [
      { label: "Free", value: "free" },
      { label: "Original", value: "original" },
      { label: "Custom...", value: "custom" },
      { label: "1:1", value: "1:1" },
      { label: "9:16", value: "9:16" },
      { label: "16:9", value: "16:9" },
      { label: "4:5", value: "4:5" },
      { label: "5:4", value: "5:4" },
      { label: "3:4", value: "3:4" },
      { label: "4:3", value: "4:3" },
      { label: "2:3", value: "2:3" },
      { label: "3:2", value: "3:2" },
      { label: "5:7", value: "5:7" },
      { label: "7:5", value: "7:5" },
    ];

    const aspectBtnElements: HTMLElement[] = [];

    const aspectBar = (
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          padding: "8px 0",
          borderBottom: "1px solid #444",
          borderTop: "1px solid #444",
          userSelect: "none",
        }}
      ></div>
    ) as HTMLElement;

    const modeRoundedBtn = (
      <button
        type="button"
        style={{
          padding: "6px 12px",
          background: "#333",
          border: "1px solid #555",
          borderRadius: "4px",
          color: "#ccc",
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: "600",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <svg viewBox="0 0 24 24" width="14" height="14">
          <path
            fill="currentColor"
            d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h12c.55 0 1 .45 1 1v13z"
          />
        </svg>
        Rounded Corners
      </button>
    ) as HTMLElement;

    const modeCircleBtn = (
      <button
        type="button"
        style={{
          padding: "6px 12px",
          background: "#333",
          border: "1px solid #555",
          borderRadius: "4px",
          color: "#ccc",
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: "600",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <svg viewBox="0 0 24 24" width="14" height="14">
          <path
            fill="currentColor"
            d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
          />
        </svg>
        Circle
      </button>
    ) as HTMLElement;

    const radiusInput = (
      <input
        type="number"
        value={this.borderRadius}
        min={0}
        max={200}
        style={{
          width: "64px",
          background: "#1e1e1e",
          border: "1px solid #555",
          borderRadius: "4px",
          padding: "4px 6px",
          color: "#e0e0e0",
          fontSize: "12px",
        }}
      />
    ) as HTMLInputElement;

    const radiusResetBtn = (
      <button
        type="button"
        style={{
          padding: "4px 8px",
          background: "#444",
          border: "none",
          borderRadius: "4px",
          color: "#ccc",
          cursor: "pointer",
          fontSize: "11px",
        }}
      >
        Reset
      </button>
    ) as HTMLElement;

    const radiusInputsOnly = (
      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "12px", color: "#aaa" }}>Radius (px):</span>
        {radiusInput}
      </div>
    ) as HTMLElement;

    const radiusInputWrap = (
      <div
        style={{
          display: "none",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {radiusInputsOnly}
        {radiusResetBtn}
      </div>
    ) as HTMLElement;

    const confirmBtn = (
      <button
        type="button"
        style={{
          padding: "8px 20px",
          background: "#094771",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: "600",
        }}
      >
        ✓ Apply Crop
      </button>
    ) as HTMLElement;

    const cancelBtn = (
      <button
        type="button"
        style={{
          padding: "8px 20px",
          background: "#555",
          color: "#ccc",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "13px",
        }}
      >
        Cancel
      </button>
    ) as HTMLElement;

    const shapeControlRow = (
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          justifyContent: "center",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {modeRoundedBtn}
          {modeCircleBtn}
        </div>
        {radiusInputWrap}
      </div>
    ) as HTMLElement;

    const actionRow = (
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {confirmBtn}
        {cancelBtn}
      </div>
    ) as HTMLElement;

    const contentBox = (
      <div
        class="crop-editor"
        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
      >
        {wrap}
        {aspectBar}
        {shapeControlRow}
        {actionRow}
      </div>
    ) as HTMLElement;

    this.cropPopup = showPopup({
      title: "Crop Image",
      width: "600px",
      maxHeight: "none",
      content: contentBox,
      onClose: () => {
        this.isOpen = false;
        if (onClose) onClose();
      },
    });

    // Sizing canvas to preview image
    const ctx = cropCanvas.getContext("2d");
    if (!ctx) return;

    const maxW = 560;
    const maxH = Math.min(
      window.innerHeight * 0.6,
      srcImg.height * (maxW / srcImg.width)
    );
    const scale = Math.min(maxW / srcImg.width, maxH / srcImg.height, 1);
    const dispW = Math.round(srcImg.width * scale);
    const dispH = Math.round(srcImg.height * scale);

    cropCanvas.width = dispW;
    cropCanvas.height = dispH;
    cropCanvas.style.width = `${dispW}px`;
    cropCanvas.style.height = `${dispH}px`;

    ctx.drawImage(srcImg, 0, 0, dispW, dispH);

    const updateCropUI = () => {
      const cw = cropCanvas.width;
      const ch = cropCanvas.height;

      const xp = crop.x * 100;
      const yp = crop.y * 100;
      const wp = crop.w * 100;
      const hp = crop.h * 100;

      const x = crop.x * cw;
      const y = crop.y * ch;
      const w = crop.w * cw;
      const h = crop.h * ch;

      hole.setAttribute("x", String(x));
      hole.setAttribute("y", String(y));
      hole.setAttribute("width", String(w));
      hole.setAttribute("height", String(h));

      if (this.cropMode === "circle") {
        hole.setAttribute("rx", String(w / 2));
        hole.setAttribute("ry", String(h / 2));
      } else if (this.cropMode === "rounded") {
        const scaleFactor = cw / srcImg.width;
        const displayRadius = this.borderRadius * scaleFactor;
        hole.setAttribute("rx", String(displayRadius));
        hole.setAttribute("ry", String(displayRadius));
      } else {
        hole.setAttribute("rx", "0");
        hole.setAttribute("ry", "0");
      }

      const len = 16;
      const nwPath = `M ${x} ${y + len} L ${x} ${y} L ${x + len} ${y}`;
      hnw.setAttribute("d", nwPath);
      tnw.setAttribute("d", nwPath);

      const nePath = `M ${x + w - len} ${y} L ${x + w} ${y} L ${x + w} ${y + len}`;
      hne.setAttribute("d", nePath);
      tne.setAttribute("d", nePath);

      const swPath = `M ${x} ${y + h - len} L ${x} ${y + h} L ${x + len} ${y + h}`;
      hsw.setAttribute("d", swPath);
      tsw.setAttribute("d", swPath);

      const sePath = `M ${x + w - len} ${y + h} L ${x + w} ${y + h} L ${x + w} ${y + h - len}`;
      hse.setAttribute("d", sePath);
      tse.setAttribute("d", sePath);

      if (currentRatio === "free") {
        hn.style.display = "";
        hs.style.display = "";
        hw.style.display = "";
        he.style.display = "";
        tn.style.pointerEvents = "auto";
        ts.style.pointerEvents = "auto";
        tw.style.pointerEvents = "auto";
        te.style.pointerEvents = "auto";

        const edgeLen = 24;
        const nx1 = x + w / 2 - edgeLen / 2;
        const ny1 = y;
        const nx2 = x + w / 2 + edgeLen / 2;
        const ny2 = y;
        hn.setAttribute("x1", String(nx1));
        hn.setAttribute("y1", String(ny1));
        hn.setAttribute("x2", String(nx2));
        hn.setAttribute("y2", String(ny2));
        tn.setAttribute("x1", String(nx1));
        tn.setAttribute("y1", String(ny1));
        tn.setAttribute("x2", String(nx2));
        tn.setAttribute("y2", String(ny2));

        const sx1 = x + w / 2 - edgeLen / 2;
        const sy1 = y + h;
        const sx2 = x + w / 2 + edgeLen / 2;
        const sy2 = y + h;
        hs.setAttribute("x1", String(sx1));
        hs.setAttribute("y1", String(sy1));
        hs.setAttribute("x2", String(sx2));
        hs.setAttribute("y2", String(sy2));
        ts.setAttribute("x1", String(sx1));
        ts.setAttribute("y1", String(sy1));
        ts.setAttribute("x2", String(sx2));
        ts.setAttribute("y2", String(sy2));

        const wx1 = x;
        const wy1 = y + h / 2 - edgeLen / 2;
        const wx2 = x;
        const wy2 = y + h / 2 + edgeLen / 2;
        hw.setAttribute("x1", String(wx1));
        hw.setAttribute("y1", String(wy1));
        hw.setAttribute("x2", String(wx2));
        hw.setAttribute("y2", String(wy2));
        tw.setAttribute("x1", String(wx1));
        tw.setAttribute("y1", String(wy1));
        tw.setAttribute("x2", String(wx2));
        tw.setAttribute("y2", String(wy2));

        const ex1 = x + w;
        const ey1 = y + h / 2 - edgeLen / 2;
        const ex2 = x + w;
        const ey2 = y + h / 2 + edgeLen / 2;
        he.setAttribute("x1", String(ex1));
        he.setAttribute("y1", String(ey1));
        he.setAttribute("x2", String(ex2));
        he.setAttribute("y2", String(ey2));
        te.setAttribute("x1", String(ex1));
        te.setAttribute("y1", String(ey1));
        te.setAttribute("x2", String(ex2));
        te.setAttribute("y2", String(ey2));
      } else {
        hn.style.display = "none";
        hs.style.display = "none";
        hw.style.display = "none";
        he.style.display = "none";
        tn.style.pointerEvents = "none";
        ts.style.pointerEvents = "none";
        tw.style.pointerEvents = "none";
        te.style.pointerEvents = "none";
      }

      moveArea.setAttribute("x", `${xp}%`);
      moveArea.setAttribute("y", `${yp}%`);
      moveArea.setAttribute("width", `${wp}%`);
      moveArea.setAttribute("height", `${hp}%`);
    };

    updateCropUI();

    // Dragging handlers
    const startDrag = (e: MouseEvent, mode: string) => {
      e.preventDefault();
      const rect = wrap.getBoundingClientRect();
      const startState = {
        startX: e.clientX,
        startY: e.clientY,
        crop: { ...crop },
      };

      const onMove = (me: MouseEvent) => {
        const dx = (me.clientX - startState.startX) / rect.width;
        const dy = (me.clientY - startState.startY) / rect.height;
        const c = startState.crop;
        const MIN = 0.05;
        const canvasAspect = cropCanvas.width / cropCanvas.height;

        if (mode === "move") {
          crop.x = Math.max(0, Math.min(1 - c.w, c.x + dx));
          crop.y = Math.max(0, Math.min(1 - c.h, c.y + dy));
        } else if (currentRatio === "free") {
          if (mode === "nw") {
            crop.x = Math.max(0, Math.min(c.x + c.w - MIN, c.x + dx));
            crop.y = Math.max(0, Math.min(c.y + c.h - MIN, c.y + dy));
            crop.w = c.x + c.w - crop.x;
            crop.h = c.y + c.h - crop.y;
          } else if (mode === "ne") {
            crop.y = Math.max(0, Math.min(c.y + c.h - MIN, c.y + dy));
            crop.w = Math.max(MIN, c.w + dx);
            crop.h = c.y + c.h - crop.y;
          } else if (mode === "sw") {
            crop.x = Math.max(0, Math.min(c.x + c.w - MIN, c.x + dx));
            crop.w = c.x + c.w - crop.x;
            crop.h = Math.max(MIN, c.h + dy);
          } else if (mode === "se") {
            crop.w = Math.max(MIN, c.w + dx);
            crop.h = Math.max(MIN, c.h + dy);
          } else if (mode === "n") {
            crop.y = Math.max(0, Math.min(c.y + c.h - MIN, c.y + dy));
            crop.h = c.y + c.h - crop.y;
          } else if (mode === "s") {
            crop.h = Math.max(MIN, c.h + dy);
          } else if (mode === "w") {
            crop.x = Math.max(0, Math.min(c.x + c.w - MIN, c.x + dx));
            crop.w = c.x + c.w - crop.x;
          } else if (mode === "e") {
            crop.w = Math.max(MIN, c.w + dx);
          }
        } else {
          let targetRatio = 1.0;
          if (currentRatio === "original") {
            targetRatio = srcImg.width / srcImg.height;
          } else if (typeof currentRatio === "number") {
            targetRatio = currentRatio;
          }

          const r = targetRatio / canvasAspect;
          if (mode === "se") {
            const maxScale = Math.min(1 - c.x, (1 - c.y) * r);
            const sc = Math.max(MIN, Math.min(maxScale, c.w + dx));
            crop.w = sc;
            crop.h = sc / r;
          } else if (mode === "nw") {
            const maxScale = Math.min(c.x + c.w, (c.y + c.h) * r);
            const sc = Math.max(MIN, Math.min(maxScale, c.w - dx));
            crop.x = c.x + c.w - sc;
            crop.y = c.y + c.h - sc / r;
            crop.w = sc;
            crop.h = sc / r;
          } else if (mode === "ne") {
            const maxScale = Math.min(1 - c.x, (c.y + c.h) * r);
            const sc = Math.max(MIN, Math.min(maxScale, c.w + dx));
            crop.y = c.y + c.h - sc / r;
            crop.w = sc;
            crop.h = sc / r;
          } else if (mode === "sw") {
            const maxScale = Math.min(c.x + c.w, (1 - c.y) * r);
            const sc = Math.max(MIN, Math.min(maxScale, c.w - dx));
            crop.x = c.x + c.w - sc;
            crop.w = sc;
            crop.h = sc / r;
          }
        }
        updateCropUI();
      };

      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    };

    tnw.addEventListener("mousedown", (e) => startDrag(e as MouseEvent, "nw"));
    tne.addEventListener("mousedown", (e) => startDrag(e as MouseEvent, "ne"));
    tsw.addEventListener("mousedown", (e) => startDrag(e as MouseEvent, "sw"));
    tse.addEventListener("mousedown", (e) => startDrag(e as MouseEvent, "se"));
    tn.addEventListener("mousedown", (e) => startDrag(e as MouseEvent, "n"));
    ts.addEventListener("mousedown", (e) => startDrag(e as MouseEvent, "s"));
    tw.addEventListener("mousedown", (e) => startDrag(e as MouseEvent, "w"));
    te.addEventListener("mousedown", (e) => startDrag(e as MouseEvent, "e"));
    moveArea.addEventListener("mousedown", (e) => startDrag(e as MouseEvent, "move"));

    // Aspect ratio click handler
    const applyRatio = (ratioStr: string) => {
      const canvasAspect = cropCanvas.width / cropCanvas.height;
      if (ratioStr === "free") {
        currentRatio = "free";
      } else if (ratioStr === "original") {
        currentRatio = "original";
        const targetRatio = srcImg.width / srcImg.height;
        const r = targetRatio / canvasAspect;
        if (r > 1) {
          crop.w = 0.9;
          crop.h = 0.9 / r;
        } else {
          crop.h = 0.9;
          crop.w = 0.9 * r;
        }
        crop.x = (1 - crop.w) / 2;
        crop.y = (1 - crop.h) / 2;
      } else if (ratioStr === "custom") {
        const inputW = (
          <input
            type="number"
            value="4"
            min="1"
            style={{
              width: "100%",
              background: "#1e1e1e",
              border: "1px solid #555",
              borderRadius: "4px",
              padding: "6px 8px",
              color: "#e0e0e0",
              fontSize: "13px",
            }}
          />
        ) as HTMLInputElement;

        const inputH = (
          <input
            type="number"
            value="3"
            min="1"
            style={{
              width: "100%",
              background: "#1e1e1e",
              border: "1px solid #555",
              borderRadius: "4px",
              padding: "6px 8px",
              color: "#e0e0e0",
              fontSize: "13px",
            }}
          />
        ) as HTMLInputElement;

        const customModal = showPopup({
          title: "Custom Aspect Ratio",
          width: "320px",
          content: (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <div style={{ flex: "1" }}>
                  <span style={{ fontSize: "10px", color: "#888" }}>Width</span>
                  {inputW}
                </div>
                <span
                  style={{
                    color: "#777",
                    lineHeight: "32px",
                    marginTop: "14px",
                  }}
                >
                  :
                </span>
                <div style={{ flex: "1" }}>
                  <span style={{ fontSize: "10px", color: "#888" }}>Height</span>
                  {inputH}
                </div>
              </div>
              <button
                type="button"
                style={{
                  padding: "8px",
                  background: "#094771",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "12px",
                  marginTop: "8px",
                }}
                onClick={() => {
                  const nw = parseFloat(inputW.value);
                  const nh = parseFloat(inputH.value);
                  if (nw > 0 && nh > 0) {
                    const targetRatio = nw / nh;
                    currentRatio = targetRatio;
                    const r = targetRatio / canvasAspect;
                    if (r > 1) {
                      crop.w = 0.9;
                      crop.h = 0.9 / r;
                    } else {
                      crop.h = 0.9;
                      crop.w = 0.9 * r;
                    }
                    crop.x = (1 - crop.w) / 2;
                    crop.y = (1 - crop.h) / 2;
                    updateCropUI();
                  }
                  customModal.close();
                }}
              >
                Set Ratio
              </button>
            </div>
          ),
        });
      } else {
        const parts = ratioStr.split(":");
        const nw = parseFloat(parts[0]);
        const nh = parseFloat(parts[1]);
        const targetRatio = nw / nh;
        currentRatio = targetRatio;
        const r = targetRatio / canvasAspect;
        if (r > 1) {
          crop.w = 0.9;
          crop.h = 0.9 / r;
        } else {
          crop.h = 0.9;
          crop.w = 0.9 * r;
        }
        crop.x = (1 - crop.w) / 2;
        crop.y = (1 - crop.h) / 2;
      }
      updateCropUI();
    };

    aspectRatios.forEach((item, index) => {
      const isDefault = index === 0;
      const btn = (
        <button
          type="button"
          class={`aspect-btn ${isDefault ? "active" : ""}`}
          style={{
            padding: "4px 10px",
            background: isDefault ? "#094771" : "#333",
            border: "1px solid #555",
            borderRadius: "4px",
            color: isDefault ? "#fff" : "#ccc",
            cursor: "pointer",
            fontSize: "11px",
            whiteSpace: "nowrap",
          }}
          onClick={() => {
            aspectBtnElements.forEach((b) => {
              b.style.background = "#333";
              b.style.color = "#ccc";
            });
            btn.style.background = "#094771";
            btn.style.color = "#fff";
            applyRatio(item.value);
          }}
        >
          {item.label}
        </button>
      ) as HTMLElement;

      aspectBtnElements.push(btn);
      aspectBar.appendChild(btn);
    });

    const resetShapeMode = () => {
      this.cropMode = "normal";
      modeRoundedBtn.style.display = "inline-flex";
      modeCircleBtn.style.display = "inline-flex";
      radiusInputWrap.style.display = "none";
      radiusInputsOnly.style.display = "inline-flex";
      modeRoundedBtn.style.background = "#333";
      modeRoundedBtn.style.color = "#ccc";
      modeCircleBtn.style.background = "#333";
      modeCircleBtn.style.color = "#ccc";
      updateCropUI();
    };

    modeRoundedBtn.addEventListener("click", () => {
      if (this.cropMode === "rounded") {
        resetShapeMode();
      } else {
        this.cropMode = "rounded";
        modeCircleBtn.style.display = "none";
        radiusInputWrap.style.display = "inline-flex";
        radiusInputsOnly.style.display = "inline-flex";
        modeRoundedBtn.style.background = "#094771";
        modeRoundedBtn.style.color = "#fff";
        updateCropUI();
      }
    });

    modeCircleBtn.addEventListener("click", () => {
      if (this.cropMode === "circle") {
        resetShapeMode();
      } else {
        this.cropMode = "circle";
        modeRoundedBtn.style.display = "none";
        modeCircleBtn.style.background = "#094771";
        modeCircleBtn.style.color = "#fff";
        radiusInputWrap.style.display = "inline-flex";
        radiusInputsOnly.style.display = "none";
        updateCropUI();
      }
    });

    radiusInput.addEventListener("input", () => {
      this.borderRadius = parseFloat(radiusInput.value) || 0;
      updateCropUI();
    });

    radiusResetBtn.addEventListener("click", resetShapeMode);

    cancelBtn.addEventListener("click", () => {
      if (this.cropPopup) this.cropPopup.close();
    });

    confirmBtn.addEventListener("click", () => {
      this.applyCrop(crop, dispW, dispH, srcImg, options);
    });
  }

  private applyCrop(
    crop: CropRect,
    dispW: number,
    dispH: number,
    srcImg: HTMLImageElement,
    options: CropModuleOptions
  ): void {
    const { layerManager, onCropComplete } = options;

    try {
      const imgW = srcImg.width;
      const imgH = srcImg.height;

      const factorX = imgW / dispW;
      const factorY = imgH / dispH;

      const sx = Math.round(crop.x * dispW * factorX);
      const sy = Math.round(crop.y * dispH * factorY);
      const sw = Math.round(crop.w * dispW * factorX);
      const sh = Math.round(crop.h * dispH * factorY);

      const targetCanvas = document.createElement("canvas");
      targetCanvas.width = sw;
      targetCanvas.height = sh;
      const targetCtx = targetCanvas.getContext("2d");
      if (!targetCtx) return;

      targetCtx.save();
      targetCtx.beginPath();

      if (this.cropMode === "circle") {
        targetCtx.ellipse(sw / 2, sh / 2, sw / 2, sh / 2, 0, 0, Math.PI * 2);
        targetCtx.clip();
      } else if (this.cropMode === "rounded" && this.borderRadius > 0) {
        if (typeof targetCtx.roundRect === "function") {
          targetCtx.roundRect(0, 0, sw, sh, this.borderRadius);
        } else {
          const r = Math.min(this.borderRadius, sw / 2, sh / 2);
          targetCtx.moveTo(r, 0);
          targetCtx.lineTo(sw - r, 0);
          targetCtx.quadraticCurveTo(sw, 0, sw, r);
          targetCtx.lineTo(sw, sh - r);
          targetCtx.quadraticCurveTo(sw, sh, sw - r, sh);
          targetCtx.lineTo(r, sh);
          targetCtx.quadraticCurveTo(0, sh, 0, sh - r);
          targetCtx.lineTo(0, r);
          targetCtx.quadraticCurveTo(0, 0, r, 0);
        }
        targetCtx.clip();
      }

      targetCtx.drawImage(srcImg, sx, sy, sw, sh, 0, 0, sw, sh);
      targetCtx.restore();

      const dataUrl = targetCanvas.toDataURL();
      const croppedImg = new Image();
      croppedImg.onload = () => {
        if (layerManager) {
          const bgLayer = layerManager.getBackgroundLayer();
          if (bgLayer) {
            bgLayer.canvas.width = sw;
            bgLayer.canvas.height = sh;
            bgLayer.ctx.clearRect(0, 0, sw, sh);
            bgLayer.ctx.drawImage(croppedImg, 0, 0);
            bgLayer.image = croppedImg;
          }
          const mainCanvas = document.getElementById("canvas") as HTMLCanvasElement | null;
          if (mainCanvas) {
            mainCanvas.width = sw;
            mainCanvas.height = sh;
          }
          layerManager.render();
        }

        eventBus.emit("image:cropped", { image: croppedImg, width: sw, height: sh });
        if (onCropComplete) {
          onCropComplete(croppedImg);
        }
      };
      croppedImg.src = dataUrl;
    } catch (err) {
      console.error("[CropModule] Apply error:", err);
    } finally {
      if (this.cropPopup) this.cropPopup.close();
    }
  }

  isActive(): boolean {
    return this.isOpen;
  }
}

export const CropModule = new CropService();
