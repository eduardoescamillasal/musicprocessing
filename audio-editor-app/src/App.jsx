import React from "react";
import { useAudioEngine } from "./hooks/useAudioEngine";
import TransportPanel from "./components/TransportPanel";
import EffectsPanel from "./components/EffectsPanel";

export default function App() {
  const audioEngine = useAudioEngine();

  // If no file has been parsed yet, keep the UI minimal
  const {
    fileName,
    audioBuffer,
    isProcessing,
    containerRef,
    handleFileUpload,
  } = audioEngine;

  return (
    <div
      style={{
        backgroundColor: "#1e1e24",
        color: "#f3f4f6",
        minHeight: "100vh",
        padding: "20px",
        fontFamily: "monospace",
      }}
    >
      <header
        style={{
          borderBottom: "2px solid #374151",
          paddingBottom: "15px",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ color: "#38bdf8", margin: "0 0 10px 0" }}>
          Audacity Web Edition 🎛️
        </h2>
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          style={{ color: "#9ca3af" }}
        />
        {isProcessing && (
          <span style={{ marginLeft: "15px", color: "#fbbf24" }}>
            Processing Audio...
          </span>
        )}
      </header>

      {fileName && (
        <main>
          {/* Metadata Bar */}
          <div
            style={{
              display: "flex",
              gap: "20px",
              fontSize: "12px",
              color: "#9ca3af",
              marginBottom: "10px",
            }}
          >
            <div>
              <strong>Track Name:</strong> {fileName}
            </div>
            <div>
              <strong>Sample Rate:</strong> {audioBuffer?.sampleRate} Hz
            </div>
            <div>
              <strong>Duration:</strong> {audioBuffer?.duration.toFixed(2)}s
            </div>
          </div>

          {/* Core Waveform Display Container Element */}
          <div
            style={{
              backgroundColor: "#111827",
              borderRadius: "6px",
              padding: "15px",
              border: "1px solid #4f46e5",
              marginBottom: "20px",
            }}
          >
            <div ref={containerRef} />
          </div>

          {/* Interactive Workspace Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            <TransportPanel
              isPlaying={audioEngine.isPlaying}
              onPlayPause={audioEngine.handlePlayPause}
              onReverse={audioEngine.handleReverse}
            />

            <EffectsPanel
              semitones={audioEngine.semitones}
              onTranspose={audioEngine.handleTranspose}
              frequency={audioEngine.frequency}
              onFrequencyChange={audioEngine.handleFrequencyChange}
            />
          </div>
        </main>
      )}
    </div>
  );
}
