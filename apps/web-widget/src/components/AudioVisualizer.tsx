import { useEffect, useRef, useState } from "react";

export interface AudioVisualizerProps {
  isActive: boolean;
  /** Optional audio context for real-time visualization */
  audioContext?: AudioContext;
  /** Optional media stream for analysis */
  mediaStream?: MediaStream;
}

export const AudioVisualizer = ({
  isActive,
  audioContext,
  mediaStream,
}: AudioVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const [levels, setLevels] = useState<number[]>([0, 0, 0, 0, 0]);

  useEffect(() => {
    if (!isActive || !audioContext || !mediaStream) {
      // Fallback to animated bars when no real audio
      const interval = setInterval(() => {
        setLevels(
          Array.from({ length: 5 }, () => Math.random() * 0.5 + 0.3)
        );
      }, 150);
      return () => clearInterval(interval);
    }

    // Set up real audio analysis
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 32;
    const source = audioContext.createMediaStreamSource(mediaStream);
    source.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      const normalized = Array.from(dataArray.slice(0, 5)).map(
        (val) => val / 255
      );
      setLevels(normalized);

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      source.disconnect();
      analyserRef.current = null;
    };
  }, [isActive, audioContext, mediaStream]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="codex-audio-visualizer" aria-label="Audio activity indicator">
      <canvas ref={canvasRef} hidden />
      <div className="codex-audio-visualizer__bars">
        {levels.map((level, index) => (
          <div
            key={index}
            className="codex-audio-visualizer__bar"
            style={{
              height: `${Math.max(level * 100, 20)}%`,
              transition: "height 0.1s ease-out",
            }}
          />
        ))}
      </div>
    </div>
  );
};
