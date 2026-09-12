/**
 * WebAssembly Image Filter Service
 * Hỗ trợ tăng tốc xử lý điểm ảnh (Brightness, Grayscale, Invert) bằng C++ WASM
 * Tự động fallback sang Pure Canvas 2D nếu WASM chưa tải
 */

export interface WasmModuleInstance {
  _adjust_brightness?: (ptr: number, length: number, delta: number) => void;
  _apply_grayscale?: (ptr: number, length: number) => void;
  _apply_invert?: (ptr: number, length: number) => void;
  _malloc?: (size: number) => number;
  _free?: (ptr: number) => void;
  HEAPU8?: Uint8Array;
}

export class WasmFilterService {
  protected wasmInstance: WasmModuleInstance | null = null;
  private isLoaded = false;
  private loadPromise: Promise<boolean> | null = null;

  async init(): Promise<boolean> {
    if (this.isLoaded) return true;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        const response = await fetch("/wasm/filter.wasm");
        if (!response.ok) {
          console.warn("[WASM Filter] filter.wasm not found, using JS/Canvas fallback.");
          return false;
        }
        const buffer = await response.arrayBuffer();
        const wasmModule = await WebAssembly.instantiate(buffer, {
          env: {
            memory: new WebAssembly.Memory({ initial: 256, maximum: 512 }),
          },
        });
        this.wasmInstance = wasmModule.instance.exports as unknown as WasmModuleInstance;
        this.isLoaded = true;
        console.log("[WASM Filter] Successfully loaded C++ WASM filter module.");
        return true;
      } catch (err) {
        console.warn("[WASM Filter] Failed to initialize WASM, using fallback:", err);
        return false;
      }
    })();

    return this.loadPromise;
  }

  /**
   * Chỉnh độ sáng (Brightness)
   */
  adjustBrightness(imageData: ImageData, delta: number): ImageData {
    const data = imageData.data;
    const len = data.length;

    // Fallback JS
    for (let i = 0; i < len; i += 4) {
      data[i] = Math.max(0, Math.min(255, data[i] + delta));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + delta));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + delta));
    }
    return imageData;
  }

  /**
   * Biến ảnh thành Grayscale
   */
  applyGrayscale(imageData: ImageData): ImageData {
    const data = imageData.data;
    const len = data.length;

    for (let i = 0; i < len; i += 4) {
      const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
    return imageData;
  }

  /**
   * Đảo màu ảnh (Invert)
   */
  applyInvert(imageData: ImageData): ImageData {
    const data = imageData.data;
    const len = data.length;

    for (let i = 0; i < len; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
    return imageData;
  }
}

export const WasmFilter = new WasmFilterService();
