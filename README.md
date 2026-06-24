# Typorig

**Typorig** is a browser-based image editing tool that runs entirely on the frontend. Built with vanilla web technologies and WebAssembly (WASM), it requires no complex frameworks or libraries such as React, Vue, or Angular.

## Features

- **Pure frontend** — All processing happens in the browser. No server-side dependencies.
- **Vanilla Web + WASM** — Lightweight and fast, leveraging WebAssembly for performance-critical operations.
- **Easy to use** — Simple, intuitive interface designed for quick edits.
- **No installation needed** — Works directly in any modern web browser.

## Comparison with Other Tools

| Tool | Typorig Advantage |
|------|-------------------|
| **Photopea** | Typorig is designed to be simpler and more beginner-friendly, focusing on ease of use over complexity. |
| **PixelLab (mobile)** | PixelLab is great but lacks a web or desktop version. Typorig works on any platform with a browser. |
| **Canva** | Basic features like adding custom fonts often require payment. Gradient color design is very limited. Typorig offers more freedom. |
| **Adobe Photoshop** | Overly complex, forces app installation or extension/add-on setup. No adequate mobile version. Typorig runs instantly in the browser with no setup. |

## Tech Stack

- **HTML / CSS / JavaScript** — Vanilla frontend
- **WebAssembly (WASM)** — High-performance image processing
- No frameworks (React, Vue, Angular, etc.)
- No external libraries

## Getting Started

1. Open `index.html` in a modern web browser.
2. Upload or load an image.
3. Start editing directly in the browser.

> No build steps, no package managers, no configuration needed.

## Project Structure

```
Typorig/
├── index.html          # Main entry point
├── css/
│   └── styles.css      # Stylesheets
├── js/
│   └── app.js          # Core application logic
├── wasm/               # WebAssembly modules (image processing)
├── font/               # Custom font assets
└── README.md           # This file
```

## License

Apache License Version 2.0