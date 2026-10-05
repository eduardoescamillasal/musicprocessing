import React from "react";

export default function EffectsPanel({
  semitones,
  onTranspose,
  frequency,
  onFrequencyChange,
}) {
  const semitoneSteps = [-12, -5, -1, 0, 1, 5, 12];

  return (
    <div
      style={{
        backgroundColor: "#27272a",
        padding: "15px",
        borderRadius: "6px",
      }}
    >
      <h4 style={{ color: "#38bdf8", marginTop: 0 }}>
        Pitch Shift & Transposition
      </h4>
      <div style={{ marginBottom: "15px" }}>
        <label>
          Semitone Adjustment ({semitones > 0 ? `+${semitones}` : semitones}):
        </label>
        <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
          {semitoneSteps.map((steps) => (
            <button
              key={steps}
              onClick={() => onTranspose(steps)}
              style={{
                flex: 1,
                padding: "5px",
                cursor: "pointer",
                backgroundColor: semitones === steps ? "#4f46e5" : "#3f3f46",
                color: "white",
                border: "none",
                borderRadius: "2px",
              }}
            >
              {steps === 0 ? "Reset" : steps > 0 ? `+${steps}` : steps}
            </button>
          ))}
        </div>
      </div>

      <h4 style={{ color: "#38bdf8", marginTop: "20px" }}>
        Frequency Equalization
      </h4>
      <label>Center Boost Frequency: {frequency} Hz</label>
      <input
        type="range"
        min="100"
        max="12000"
        step="100"
        value={frequency}
        onChange={onFrequencyChange}
        style={{ width: "100%", marginTop: "10px" }}
      />
    </div>
  );
}
