/**
 * Slider Control Component - Real DOM TSX
 * Zero-dependency slider with numeric input and +/- step buttons
 */

import { h } from "./jsx";

export interface SliderControlProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  sliderMin?: number;
  sliderMax?: number;
  step?: number;
  btnStep?: number;
  unit?: string;
  onChange: (value: number) => void;
}

export function SliderControl(props: SliderControlProps): HTMLElement {
  const {
    label,
    value = 0,
    min = 0,
    max = 100,
    sliderMin = min,
    sliderMax = max,
    step = 1,
    btnStep = step,
    unit = "",
    onChange,
  } = props;

  let currentVal = value;

  const valDisplay = (
    <span class="slider-val-display">
      {currentVal}
      {unit}
    </span>
  ) as HTMLElement;

  const rangeInput = (
    <input
      type="range"
      class="slider-range-input"
      min={sliderMin}
      max={sliderMax}
      step={step}
      value={Math.min(Math.max(currentVal, sliderMin), sliderMax)}
      style={{ flex: "1", cursor: "pointer", accentColor: "#00f260" }}
    />
  ) as HTMLInputElement;

  function updateValue(newVal: number): void {
    newVal = Math.max(min, Math.min(max, Math.round(newVal)));
    currentVal = newVal;
    valDisplay.textContent = `${newVal}${unit}`;
    rangeInput.value = String(Math.min(Math.max(newVal, sliderMin), sliderMax));
    onChange(newVal);
  }

  rangeInput.addEventListener("input", (e) => {
    updateValue(parseFloat((e.target as HTMLInputElement).value));
  });

  const minusBtn = (
    <button
      type="button"
      class="slider-btn-minus"
      style={{
        width: "28px",
        height: "28px",
        background: "#2a2a2a",
        border: "1px solid #444",
        borderRadius: "4px",
        color: "#fff",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "16px",
        fontWeight: "bold",
        userSelect: "none",
      }}
      onClick={() => updateValue(currentVal - btnStep)}
    >
      -
    </button>
  );

  const plusBtn = (
    <button
      type="button"
      class="slider-btn-plus"
      style={{
        width: "28px",
        height: "28px",
        background: "#2a2a2a",
        border: "1px solid #444",
        borderRadius: "4px",
        color: "#fff",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "16px",
        fontWeight: "bold",
        userSelect: "none",
      }}
      onClick={() => updateValue(currentVal + btnStep)}
    >
      +
    </button>
  );

  return (
    <div
      class="slider-control-group"
      style={{ display: "flex", flexDirection: "column", gap: "6px" }}
    >
      <div style={{ fontSize: "12px", color: "#fff", fontWeight: "500" }}>
        {label}: {valDisplay}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {minusBtn}
        {rangeInput}
        {plusBtn}
      </div>
    </div>
  ) as HTMLElement;
}

SliderControl.create = function (props: SliderControlProps): HTMLElement {
  return SliderControl(props);
};
