@echo off
REM Script build C++ sang WebAssembly bằng Emscripten
REM Yêu cầu cài đặt emsdk trước khi chạy script này

echo Compiling filter.cpp to WebAssembly...

if not exist "..\public\wasm" mkdir "..\public\wasm"

emcc filter.cpp -O3 ^
  -s WASM=1 ^
  -s EXPORTED_FUNCTIONS="['_adjust_brightness', '_apply_grayscale', '_apply_invert', '_malloc', '_free']" ^
  -s EXPORTED_RUNTIME_METHODS="['ccall', 'cwrap']" ^
  -s ALLOW_MEMORY_GROWTH=1 ^
  -o ..\public\wasm\filter.js

echo Build WASM complete!
