"use strict";

/**
 * SliderControl - Utility Component UI cho thanh kéo (Label, [-], Slider, [+])
 */
const SliderControl = (() => {

  /**
   * Tạo một phần tử điều khiển Slider
   * @param {Object} opts
   * @param {string} opts.label - Tiêu đề (vd: "Size", "Opacity", "Angle")
   * @param {number} opts.value - Giá trị hiện tại
   * @param {number} [opts.min=0] - Giá trị nhỏ nhất cho phép
   * @param {number} [opts.max=100] - Giá trị lớn nhất cho phép
   * @param {number} [opts.sliderMin] - Giá trị min của thanh range slider (mặc định = min)
   * @param {number} [opts.sliderMax] - Giá trị max của thanh range slider (mặc định = max)
   * @param {number} [opts.step=1] - Bước nhảy slider
   * @param {number} [opts.btnStep] - Bước nhảy nút [-] / [+] (mặc định = step)
   * @param {string} [opts.unit=""] - Đơn vị hiển thị (vd: "%", "°", "px")
   * @param {Function} opts.onChange - Callback khi giá trị thay đổi (newValue)
   * @returns {HTMLElement} Thẻ HTMLElement chứa bộ điều khiển slider
   */
  function create(opts = {}) {
    const label = opts.label || "";
    const value = opts.value !== undefined ? opts.value : 0;
    const min = opts.min !== undefined ? opts.min : 0;
    const max = opts.max !== undefined ? opts.max : 100;
    const sliderMin = opts.sliderMin !== undefined ? opts.sliderMin : min;
    const sliderMax = opts.sliderMax !== undefined ? opts.sliderMax : max;
    const step = opts.step || 1;
    const btnStep = opts.btnStep || step || 1;
    const unit = opts.unit || "";
    const onChange = opts.onChange || (() => {});

    const container = document.createElement("div");
    container.className = "slider-control-group";
    container.style.cssText = "display:flex;flex-direction:column;gap:6px;";

    const sliderVal = Math.min(Math.max(value, sliderMin), sliderMax);

    container.innerHTML = `
      <div style="font-size:12px;color:#fff;font-weight:500;">
        ${label}: <span class="slider-val-display">${value}${unit}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <button type="button" class="slider-btn-minus" style="width:28px;height:28px;background:#2a2a2a;border:1px solid #444;border-radius:4px;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:bold;user-select:none;">-</button>
        <input type="range" class="slider-range-input" min="${sliderMin}" max="${sliderMax}" step="${step}" value="${sliderVal}" style="flex:1;cursor:pointer;accent-color:#00f260;" />
        <button type="button" class="slider-btn-plus" style="width:28px;height:28px;background:#2a2a2a;border:1px solid #444;border-radius:4px;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:bold;user-select:none;">+</button>
      </div>
    `;

    const valDisplay = container.querySelector(".slider-val-display");
    const rangeInput = container.querySelector(".slider-range-input");
    const minusBtn = container.querySelector(".slider-btn-minus");
    const plusBtn = container.querySelector(".slider-btn-plus");

    let currentVal = value;

    function updateValue(newVal) {
      newVal = Math.max(min, Math.min(max, Math.round(newVal)));
      currentVal = newVal;
      valDisplay.textContent = `${newVal}${unit}`;
      rangeInput.value = Math.min(Math.max(newVal, sliderMin), sliderMax);
      onChange(newVal);
    }

    rangeInput.addEventListener("input", (e) => {
      updateValue(parseFloat(e.target.value));
    });

    minusBtn.addEventListener("click", () => {
      updateValue(currentVal - btnStep);
    });

    plusBtn.addEventListener("click", () => {
      updateValue(currentVal + btnStep);
    });

    return container;
  }

  return {
    create
  };
})();
