/**
 * Enterprise-Grade Music Analysis Types
 * Professional audio analysis interfaces for broadcast-quality generation
 */

export interface MusicAnalysis {
  // Basic musical properties
  tempo: number;          // BPM
  key: string;           // Musical key (e.g., "C", "F#")
  mode: string;          // "major" | "minor"
  duration: number;      // Duration in seconds
  
  // Energy and confidence metrics
  energy: number;        // 0-1 energy level
  confidence: number;    // 0-1 analysis confidence
  
  // Advanced SyncLock metrics
  beatCount: number;     // Total beats detected
  chordCount: number;    // Total chords detected
  phraseCount: number;   // Musical phrases detected
  syncAccuracy: number;  // 0-1 synchronization accuracy
  harmonicIntegrity: number; // 0-1 harmonic quality
  
  // 🎯 DETAILED TIMING DATA FOR PERFECT ALIGNMENT
  chordProgression: Array<{
    chord: string;
    start_time: number;
    end_time: number;
  }>;
  phraseBoundaries: number[];  // Phrase start times in seconds
  beatPositions: number[];     // Beat positions in seconds
  timeSignature: string;       // e.g., "4/4"
  bpmConfidence: number;       // 0-1 BPM detection confidence
  keyConfidence: number;       // 0-1 key detection confidence
  
  // Generation constraints
  generationConstraints: {
    chordLock: 'strict' | 'moderate' | 'flexible';
    beatAlignment: number;    // 0-1 beat alignment strength
    temperature: number;      // 0-1 generation creativity
    maxInterval: number;      // Maximum melodic interval
    energyMatch: boolean;     // Match energy levels
    scaleConstraint: string;  // Musical scale constraint from SyncLock
  };
  
  // Advanced analysis data
  musicalDNA?: {
    harmonicPattern: number[];
    rhythmicSignature: number[];
    melodicContour: number[];
    dynamicProfile: number[];
  };
  
  symbolicData?: {
    chords: Array<{
      name: string;
      start: number;
      duration: number;
      confidence: number;
    }>;
    beats: Array<{
      time: number;
      strength: number;
    }>;
    phrases: Array<{
      start: number;
      end: number;
      type: string;
    }>;
    syncAnchors: Array<{
      time: number;
      type: 'beat' | 'chord' | 'phrase';
      importance: number;
    }>;
  };
  
  // Quality metrics
  qualityMetrics?: {
    snr: number;              // Signal-to-noise ratio
    dynamicRange: number;     // Dynamic range in dB
    spectralBalance: number;  // Frequency balance score
    temporalStability: number; // Tempo stability
  };
  
  // Quantum time grid (enterprise feature)
  quantumTimeGrid?: {
    resolution: number;       // Time resolution in ms
    gridPoints: number[];     // Precise timing anchors
    syncPrecision: number;    // Grid alignment precision
  };
}

export interface AudioAnalysisResult {
  success: boolean;
  analysis: MusicAnalysis;
  processingTime: number;
  error?: string;
}

export interface GenerationResult {
  success: boolean;
  audioUrl: {
    audio: string;
    spectrogram?: string;
  };
  targetStyle: string;
  service: string;
  message: string;
  synchronizationScore?: number;
  qualityReport?: string[];
  processingTime?: number;
}
