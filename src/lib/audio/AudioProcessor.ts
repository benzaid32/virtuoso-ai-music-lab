/**
 * Professional Audio Processing Engine
 * Optimized for real-time music analysis and waveform visualization
 */

import { z } from 'zod';

/**
 * Enterprise-grade audio analysis result schema
 */
export const AudioAnalysisSchema = z.object({
  key: z.string(),
  mode: z.enum(['major', 'minor']),
  tempo: z.number(),
  energy: z.number(),
  confidence: z.number(),
  duration: z.number().optional()
});

export type AudioAnalysis = z.infer<typeof AudioAnalysisSchema>;

export interface WaveformData {
  peaks: number[];
  duration: number;
}

export class AudioProcessor {
  private static readonly SAMPLE_RATE = 22050; // Optimized sample rate
  private static readonly FFT_SIZE = 2048;
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly MAX_DURATION = 300; // 5 minutes
  
  /**
   * Enterprise optimization: Process only waveform visualization
   * This removes the mock analysis and only handles waveform data
   */
  static async processWaveformOnly(file: File): Promise<{
    waveform: WaveformData;
  }> {
    // Validate file
    this.validateFile(file);

    const arrayBuffer = await file.arrayBuffer();
    const audioContext = new AudioContext({ sampleRate: this.SAMPLE_RATE });
    
    try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Get mono channel data
      const samples = audioBuffer.getChannelData(0);
      const duration = audioBuffer.duration;
      
      // Limit processing duration
      const maxSamples = Math.min(samples.length, this.SAMPLE_RATE * this.MAX_DURATION);
      const processedSamples = samples.slice(0, maxSamples);

      // Only process waveform - no analysis
      const waveform = await this.generateWaveform(processedSamples, duration);
      
      console.log('✅ Generated waveform visualization only');
      return { waveform };
    } finally {
      await audioContext.close();
    }
  }

  /**
   * Process audio file and extract all analysis data
   */
  static async processAudioFile(file: File): Promise<{
    analysis: AudioAnalysis;
    waveform: WaveformData;
  }> {
    // Validate file
    this.validateFile(file);

    const arrayBuffer = await file.arrayBuffer();
    const audioContext = new AudioContext({ sampleRate: this.SAMPLE_RATE });
    
    try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Get mono channel data
      const samples = audioBuffer.getChannelData(0);
      const duration = audioBuffer.duration;
      
      // Limit processing duration
      const maxSamples = Math.min(samples.length, this.SAMPLE_RATE * this.MAX_DURATION);
      const processedSamples = samples.slice(0, maxSamples);

      // Process in parallel for efficiency
      const [analysis, waveform] = await Promise.all([
        this.analyzeAudio(processedSamples, this.SAMPLE_RATE, duration),
        this.generateWaveform(processedSamples, duration)
      ]);

      return { analysis, waveform };
    } finally {
      await audioContext.close();
    }
  }

  /**
   * Validate audio file constraints
   */
  private static validateFile(file: File): void {
    if (!file.type.startsWith('audio/')) {
      throw new Error('Invalid file type. Please upload an audio file.');
    }
    
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error('File too large. Please use files smaller than 50MB.');
    }
  }

  /**
   * Analyze audio for musical properties
   */
  private static async analyzeAudio(
    samples: Float32Array, 
    sampleRate: number, 
    duration: number
  ): Promise<AudioAnalysis> {
    
    const [tempo, energy, keyResult] = await Promise.all([
      this.detectTempo(samples, sampleRate),
      this.calculateEnergy(samples),
      this.detectKey(samples, sampleRate)
    ]);

    // Calculate overall confidence
    const tempoConfidence = tempo >= 60 && tempo <= 200 ? 0.9 : 0.6;
    const energyConfidence = energy > 0 ? 0.95 : 0.3;
    const confidence = (tempoConfidence + energyConfidence + keyResult.confidence) / 3;

    return {
      key: keyResult.key,
      mode: keyResult.mode,
      tempo: Math.round(tempo),
      energy: Math.round(energy * 100),
      confidence: Math.round(confidence * 100) / 100,
      duration: Math.round(duration)
    };
  }

  /**
   * Optimized tempo detection using autocorrelation
   */
  private static async detectTempo(samples: Float32Array, sampleRate: number): Promise<number> {
    const chunkSize = Math.floor(sampleRate * 0.1); // 100ms chunks
    const maxChunks = Math.min(100, Math.floor(samples.length / chunkSize));
    
    // Calculate RMS energy for each chunk
    const energies: number[] = [];
    for (let i = 0; i < maxChunks; i++) {
      const start = i * chunkSize;
      const chunk = samples.slice(start, start + chunkSize);
      energies.push(this.rmsEnergy(chunk));
    }

    // Find peaks (simple but effective)
    const peaks: number[] = [];
    const threshold = Math.max(...energies) * 0.6;
    
    for (let i = 1; i < energies.length - 1; i++) {
      if (energies[i] > threshold && 
          energies[i] > energies[i - 1] && 
          energies[i] > energies[i + 1]) {
        peaks.push(i * 0.1); // Convert to seconds
      }
    }

    if (peaks.length < 2) return 120; // Default tempo

    // Calculate average interval between peaks
    const intervals = peaks.slice(1).map((peak, i) => peak - peaks[i]);
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    
    const bpm = 60 / avgInterval;
    return Math.max(60, Math.min(200, bpm));
  }

  /**
   * Calculate RMS energy
   */
  private static calculateEnergy(samples: Float32Array): number {
    return this.rmsEnergy(samples);
  }

  private static rmsEnergy(samples: Float32Array): number {
    if (samples.length === 0) return 0;
    
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }

  /**
   * Optimized key detection using pitch class profiles
   */
  private static async detectKey(samples: Float32Array, sampleRate: number): Promise<{
    key: string;
    mode: 'major' | 'minor';
    confidence: number;
  }> {
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    // Krumhansl-Schmuckler key profiles
    const majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
    const minorProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
    
    // Simple but effective chroma calculation
    const chroma = this.calculateChroma(samples, sampleRate);
    
    let bestKey = 'C';
    let bestMode: 'major' | 'minor' = 'major';
    let bestScore = -1;
    let secondBestScore = -1;

    // Test all key/mode combinations
    for (let shift = 0; shift < 12; shift++) {
      // Test major
      const majorScore = this.correlate(chroma, majorProfile, shift);
      if (majorScore > bestScore) {
        secondBestScore = bestScore;
        bestScore = majorScore;
        bestKey = keys[shift];
        bestMode = 'major';
      } else if (majorScore > secondBestScore) {
        secondBestScore = majorScore;
      }

      // Test minor
      const minorScore = this.correlate(chroma, minorProfile, shift);
      if (minorScore > bestScore) {
        secondBestScore = bestScore;
        bestScore = minorScore;
        bestKey = keys[shift];
        bestMode = 'minor';
      } else if (minorScore > secondBestScore) {
        secondBestScore = minorScore;
      }
    }

    // Calculate confidence based on score separation
    const confidence = bestScore > 0 ? 
      Math.min(0.95, Math.max(0.3, (bestScore - secondBestScore) / bestScore)) : 0.3;

    return { key: bestKey, mode: bestMode, confidence };
  }

  /**
   * Calculate chroma features (simplified but effective)
   */
  private static calculateChroma(samples: Float32Array, sampleRate: number): number[] {
    const chroma = new Array(12).fill(0);
    const chunkSize = 4096;
    const numChunks = Math.min(20, Math.floor(samples.length / chunkSize));

    for (let i = 0; i < numChunks; i++) {
      const start = i * chunkSize;
      const chunk = samples.slice(start, start + chunkSize);
      
      // Simple pitch detection via zero-crossing
      const pitch = this.detectPitch(chunk, sampleRate);
      if (pitch > 80 && pitch < 2000) { // Musical range
        const midiNote = 12 * Math.log2(pitch / 440) + 69;
        const chromaClass = Math.round(midiNote) % 12;
        if (chromaClass >= 0) {
          chroma[chromaClass] += 1;
        }
      }
    }

    // Normalize
    const sum = chroma.reduce((a, b) => a + b, 0);
    return sum > 0 ? chroma.map(x => x / sum) : chroma;
  }

  /**
   * Simple pitch detection using autocorrelation
   */
  private static detectPitch(samples: Float32Array, sampleRate: number): number {
    const minPeriod = Math.floor(sampleRate / 800); // 800 Hz max
    const maxPeriod = Math.floor(sampleRate / 80);  // 80 Hz min
    
    let bestPeriod = 0;
    let bestCorrelation = 0;

    for (let period = minPeriod; period < Math.min(maxPeriod, samples.length / 2); period += 2) {
      let correlation = 0;
      let count = 0;

      for (let i = 0; i < samples.length - period; i += 4) {
        correlation += samples[i] * samples[i + period];
        count++;
      }

      correlation /= count;
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }

    return bestPeriod > 0 ? sampleRate / bestPeriod : 0;
  }

  /**
   * Correlate chroma with key profile
   */
  private static correlate(chroma: number[], profile: number[], shift: number): number {
    let correlation = 0;
    for (let i = 0; i < 12; i++) {
      const profileIndex = (i + shift) % 12;
      correlation += chroma[i] * profile[profileIndex];
    }
    return correlation;
  }

  /**
   * Generate optimized waveform visualization data
   */
  private static async generateWaveform(samples: Float32Array, duration: number): Promise<WaveformData> {
    const targetPeaks = 100; // Optimal for visualization
    const blockSize = Math.floor(samples.length / targetPeaks);
    const peaks: number[] = [];

    for (let i = 0; i < samples.length; i += blockSize) {
      const block = samples.slice(i, i + blockSize);
      const peak = Math.max(...Array.from(block).map(Math.abs));
      peaks.push(peak);
    }

    return {
      peaks: peaks.slice(0, targetPeaks), // Ensure exact length
      duration
    };
  }
} 