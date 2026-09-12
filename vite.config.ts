import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3000,
    open: true,
    headers: {
      // Headers cho SharedArrayBuffer nếu dùng multi-thread WASM
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp"
    }
  },
  build: {
    target: "esnext"
  }
});
