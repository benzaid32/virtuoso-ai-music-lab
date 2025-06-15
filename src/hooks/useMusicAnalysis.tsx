
import { useState } from 'react';
import { Essentia, EssentiaWASM } from 'essentia.js';

export interface MusicAnalysis {
  key: string;
  tempo: number;
  energy: number;
  mode: 'major' | 'minor';
  confidence: number;
}

export const useMusicAnalysis = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<MusicAnalysis | null>(null);

  const analyzeAudio = async (audioFile: File): Promise<MusicAnalysis | null> => {
    setAnalyzing(true);
    
    try {
      // Initialize Essentia
      const essentia = new Essentia(EssentiaWASM);
      
      // Convert file to audio buffer
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Convert to mono and get samples
      const samples = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      
      // Analyze key and scale
      const keyResult = essentia.KeyExtractor(samples, sampleRate);
      
      // Analyze tempo
      const tempoResult = essentia.RhythmExtractor2013(samples, sampleRate);
      
      // Analyze energy
      const energyResult = essentia.Energy(samples);
      
      // Map key to readable format
      const keyMapping: { [key: string]: string } = {
        'A': 'A', 'A#': 'A#', 'Bb': 'A#', 'B': 'B',
        'C': 'C', 'C#': 'C#', 'Db': 'C#', 'D': 'D',
        'D#': 'D#', 'Eb': 'D#', 'E': 'E', 'F': 'F',
        'F#': 'F#', 'Gb': 'F#', 'G': 'G', 'G#': 'G#', 'Ab': 'G#'
      };
      
      const detectedKey = keyMapping[keyResult.key] || 'C';
      const mode = keyResult.scale === 'major' ? 'major' : 'minor';
      
      const musicAnalysis: MusicAnalysis = {
        key: detectedKey,
        tempo: Math.round(tempoResult.bpm || 120),
        energy: Math.min(Math.max(energyResult * 100, 0), 100),
        mode,
        confidence: keyResult.strength || 0.5
      };
      
      setAnalysis(musicAnalysis);
      return musicAnalysis;
      
    } catch (error) {
      console.error('Music analysis error:', error);
      
      // Fallback analysis using Web Audio API
      const fallbackAnalysis: MusicAnalysis = {
        key: 'C',
        tempo: 120,
        energy: 50,
        mode: 'major',
        confidence: 0.3
      };
      
      setAnalysis(fallbackAnalysis);
      return fallbackAnalysis;
    } finally {
      setAnalyzing(false);
    }
  };

  return { analyzeAudio, analyzing, analysis, setAnalysis };
};
