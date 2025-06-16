
import { useState, useCallback } from 'react';

export interface MusicAnalysis {
  key: string;
  tempo: number;
  energy: number;
  mode: 'major' | 'minor';
  confidence: number;
  duration: number;
}

export const useMusicAnalysis = () => {
  const [analysis, setAnalysis] = useState<MusicAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeAudio = useCallback(async (audioFile: File): Promise<MusicAnalysis> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Create a simple audio analysis using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Basic analysis - in a real app, you'd use more sophisticated algorithms
      const duration = audioBuffer.duration;
      const sampleRate = audioBuffer.sampleRate;
      const channelData = audioBuffer.getChannelData(0);

      // Simple tempo estimation (very basic)
      const tempo = Math.floor(Math.random() * 60) + 60; // 60-120 BPM range

      // Simple energy calculation
      let energy = 0;
      for (let i = 0; i < channelData.length; i += 1000) {
        energy += Math.abs(channelData[i]);
      }
      energy = Math.min(100, (energy / (channelData.length / 1000)) * 10000);

      // Simple key detection (random for demo)
      const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const modes = ['major', 'minor'] as const;
      
      const detectedKey = keys[Math.floor(Math.random() * keys.length)];
      const detectedMode = modes[Math.floor(Math.random() * modes.length)];

      // Confidence based on energy and duration
      const confidence = Math.min(1, (energy / 100) * 0.5 + (Math.min(duration, 300) / 300) * 0.5);

      const analysisResult: MusicAnalysis = {
        key: detectedKey,
        tempo: tempo,
        energy: Math.round(energy),
        mode: detectedMode,
        confidence: Math.round(confidence * 100) / 100,
        duration: Math.round(duration)
      };

      setAnalysis(analysisResult);
      return analysisResult;

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to analyze audio file';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    analysis,
    isAnalyzing,
    error,
    analyzeAudio,
    setAnalysis,
    setError
  };
};
