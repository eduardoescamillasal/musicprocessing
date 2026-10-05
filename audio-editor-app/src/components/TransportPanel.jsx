import React from "react";

export default function TransportPanel({ isPlaying, onPlayPause, onReverse }) {
  return (
    <div
      style={{
        backgroundColor: "#27272a",
        padding: "15px",
        borderRadius: "6px",
      }}
    >
      <h4 style={{ color: "#38bdf8", marginTop: 0 }}>Transport Controls</h4>
      <button
        onClick={onPlayPause}
        style={{
          padding: "10px 20px",
          cursor: "pointer",
          marginRight: "10px",
          fontWeight: "bold",
          backgroundColor: "#10b981",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
        }}
      >
        {isPlaying ? "⏸️ Pause" : "▶️ Play"}
      </button>

      <h4 style={{ color: "#38bdf8", marginTop: "20px" }}>
        Destructive Effects
      </h4>
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={onReverse}
          style={{
            padding: "8px 12px",
            cursor: "pointer",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          🔄 Reverse Track
        </button>
      </div>
    </div>
  );
}
