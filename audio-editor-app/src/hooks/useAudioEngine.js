import { useState, useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

export function useAudioEngine() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [fileName, setFileName] = useState("");
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [frequency, setFrequency] = useState(4000);
  const [semitones, setSemitones] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);

  // Web Audio DAW Graph Nodes
  const audioCtxRef = useRef(null);
  const currentSourceRef = useRef(null);
  const filterNodeRef = useRef(null);

  // Playback tracking parameters
  const startTimeRef = useRef(0);
  const pauseTimeRef = useRef(0);

  // 1. Initialize Visual Waveform Canvas when container element is ready
  useEffect(() => {
    if (!containerRef.current) return;

    wavesurferRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#4f46e5",
      progressColor: "#818cf8",
      cursorColor: "#f43f5e",
      height: 128,
      responsive: true,
      barWidth: 2,
      barGap: 1,
      interact: true, // Allows users to click on the waveform to scrub positions
    });

    // Sync timeline cursor scrubbing into our global position tracker
    wavesurferRef.current.on("interaction", (newProgress) => {
      if (audioBuffer) {
        const targetTime = newProgress * audioBuffer.duration;
        pauseTimeRef.current = targetTime;
        if (isPlaying) {
          stopBufferPlayback();
          startBufferPlayback(targetTime);
        }
      }
    });

    return () => {
      if (wavesurferRef.current) wavesurferRef.current.destroy();
    };
  }, [audioBuffer, isPlaying]);

  // 2. Synchronize layout buffer changes with the canvas drawer interface
  useEffect(() => {
    if (!audioBuffer || !wavesurferRef.current) return;
    try {
      wavesurferRef.current.loadDecodedBuffer(audioBuffer);
    } catch (err) {
      console.error("Wavesurfer visual sync error:", err);
    } finally {
      setIsProcessing(false);
    }
  }, [audioBuffer]);

  // 3. Keep updating wavesurfer cursor position visually during Web Audio playback
  useEffect(() => {
    let animationFrame;
    const updateVisualCursor = () => {
      if (isPlaying && audioBuffer) {
        const elapsed =
          audioCtxRef.current.currentTime -
          startTimeRef.current +
          pauseTimeRef.current;
        const progress = Math.min(elapsed / audioBuffer.duration, 1);

        wavesurferRef.current.setTime(elapsed);

        if (progress >= 1) {
          setIsPlaying(false);
          pauseTimeRef.current = 0;
        } else {
          animationFrame = requestAnimationFrame(updateVisualCursor);
        }
      }
    };

    if (isPlaying) {
      animationFrame = requestAnimationFrame(updateVisualCursor);
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying, audioBuffer]);

  // 4. Handle Upload and File Loading
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setFileName(file.name);
    setIsProcessing(true);

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }

    const arrayBuffer = await file.arrayBuffer();
    try {
      const decodedBuffer = await audioCtxRef.current.decodeAudioData(
        arrayBuffer
      );
      setAudioBuffer(decodedBuffer);
      pauseTimeRef.current = 0; // Reset tracking indicators
    } catch (err) {
      alert("Error parsing file: " + err.message);
      setIsProcessing(false);
    }
  };

  // 5. Direct Web Audio API Node Playback Engine
  const startBufferPlayback = (offsetTime) => {
    if (!audioCtxRef.current || !audioBuffer) return;

    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }

    // Create the playback source node
    const sourceNode = audioCtxRef.current.createBufferSource();
    sourceNode.buffer = audioBuffer;

    // Build real-time filter matrix (Peaking Equalization)
    const filter = audioCtxRef.current.createBiquadFilter();
    filter.type = "peaking";
    filter.frequency.setValueAtTime(frequency, audioCtxRef.current.currentTime);
    filter.Q.setValueAtTime(2.0, audioCtxRef.current.currentTime);
    filter.gain.setValueAtTime(15, audioCtxRef.current.currentTime); // Obvious high-impact dynamic boost

    // Connect node graph chains: Source -> Filter -> Speakers
    sourceNode.connect(filter);
    filter.connect(audioCtxRef.current.destination);

    // Save references to change parameters dynamically or stop execution
    filterNodeRef.current = filter;
    currentSourceRef.current = sourceNode;
    startTimeRef.current = audioCtxRef.current.currentTime;

    sourceNode.start(0, offsetTime);
  };

  const stopBufferPlayback = () => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (e) {}
      currentSourceRef.current.disconnect();
      currentSourceRef.current = null;
    }
  };

  const handlePlayPause = () => {
    if (!audioBuffer) return;

    if (isPlaying) {
      // Pause behavior
      const elapsedSinceStart =
        audioCtxRef.current.currentTime - startTimeRef.current;
      pauseTimeRef.current += elapsedSinceStart;
      stopBufferPlayback();
      setIsPlaying(false);
    } else {
      // Play behavior
      if (pauseTimeRef.current >= audioBuffer.duration)
        pauseTimeRef.current = 0;
      startBufferPlayback(pauseTimeRef.current);
      setIsPlaying(true);
    }
  };

  const handleFrequencyChange = (e) => {
    const value = Number(e.target.value);
    setFrequency(value);
    if (filterNodeRef.current && audioCtxRef.current) {
      filterNodeRef.current.frequency.setValueAtTime(
        value,
        audioCtxRef.current.currentTime
      );
    }
  };

  // 6. Transposition Algorithm (Resampling Method)
  const handleTranspose = (semitoneShift) => {
    if (!audioBuffer) return;
    const wasPlaying = isPlaying;

    stopBufferPlayback();
    setIsPlaying(false);
    setSemitones(semitoneShift);
    setIsProcessing(true);

    setTimeout(() => {
      const ctx = audioCtxRef.current;
      const factor = Math.pow(2, semitoneShift / 12);

      const newBuffer = ctx.createBuffer(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );

      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const oldData = audioBuffer.getChannelData(channel);
        const newData = newBuffer.getChannelData(channel);

        for (let i = 0; i < newBuffer.length; i++) {
          const oldIndex = i * factor;
          const baseIndex = Math.floor(oldIndex);
          const fraction = oldIndex - baseIndex;

          if (baseIndex + 1 < oldData.length) {
            newData[i] =
              oldData[baseIndex] * (1 - fraction) +
              oldData[baseIndex + 1] * fraction;
          } else {
            newData[i] = oldData[baseIndex] || 0;
          }
        }
      }

      setAudioBuffer(newBuffer);
      if (wasPlaying) {
        setTimeout(() => {
          startBufferPlayback(pauseTimeRef.current);
          setIsPlaying(true);
        }, 100);
      }
    }, 50);
  };

  // 7. Destructive Audio Reversal Vector Modifier
  const handleReverse = () => {
    if (!audioBuffer) return;
    const wasPlaying = isPlaying;

    stopBufferPlayback();
    setIsPlaying(false);
    setIsProcessing(true);

    setTimeout(() => {
      const ctx = audioCtxRef.current;
      const newBuffer = ctx.createBuffer(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );

      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const originalData = audioBuffer.getChannelData(channel);
        const reversedData = newBuffer.getChannelData(channel);
        const len = audioBuffer.length;

        for (let i = 0; i < len; i++) {
          reversedData[i] = originalData[len - 1 - i];
        }
      }

      // Flip timeline bookmark position to keep relative cursor synchronized
      pauseTimeRef.current = audioBuffer.duration - pauseTimeRef.current;

      setAudioBuffer(newBuffer);
      if (wasPlaying) {
        setTimeout(() => {
          startBufferPlayback(pauseTimeRef.current);
          setIsPlaying(true);
        }, 100);
      }
    }, 50);
  };

  return {
    isPlaying,
    fileName,
    audioBuffer,
    frequency,
    semitones,
    isProcessing,
    containerRef,
    handleFileUpload,
    handlePlayPause,
    handleFrequencyChange,
    handleTranspose,
    handleReverse,
  };
}
