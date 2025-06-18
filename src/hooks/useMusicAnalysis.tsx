
import { useState, useCallback } from 'react';
import { uploadAudio, analyzeAudio, AudioServiceError } from '../lib/api/audio-service';
import { initializeStorage } from '../lib/supabase';

export interface MusicAnalysis {
  key: string;
  tempo: number;
  energy: number;
  mode: 'major' | 'minor';
  confidence: number;
  duration: number;
}

// Initialize storage on app startup
initializeStorage().catch(console.error);

export const useMusicAnalysis = () => {
  const [analysis, setAnalysis] = useState<MusicAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processAudioAnalysis = useCallback(async (audioFile: File): Promise<MusicAnalysis> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      console.log('Starting professional audio analysis process');
      
      // First get audio duration for our analysis result
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const duration = audioBuffer.duration;
      
      // Step 1: Upload audio using our enterprise service
      console.log('Uploading audio for analysis...');
      const audioUrl = await uploadAudio({ file: audioFile });
      console.log('Audio uploaded successfully', { audioUrl });
      
      // Step 2: Perform professional audio analysis
      console.log('Analyzing audio with professional ACRCloud service...');
      const backendAnalysis = await analyzeAudio(audioUrl);
      console.log('Professional analysis complete', backendAnalysis);
      
      // Step 3: Format result for UI consumption
      const analysisResult: MusicAnalysis = {
        key: backendAnalysis.key,
        tempo: backendAnalysis.tempo,
        energy: typeof backendAnalysis.energy === 'number' ? 
          (backendAnalysis.energy <= 1 ? Math.round(backendAnalysis.energy * 100) : backendAnalysis.energy) : 
          50, // Handles both 0-1 and 0-100 scale formats
        mode: backendAnalysis.mode,
        confidence: backendAnalysis.confidence,
        duration: Math.round(duration)
      };
      
      console.log('Analysis complete and processed:', analysisResult);
      setAnalysis(analysisResult);
      return analysisResult;

    } catch (err: any) {
      // Enterprise-grade error handling with detailed logging and user-friendly messages
      console.error('Audio analysis failed:', err);
      
      let errorMessage = 'Failed to analyze audio';
      let errorCode = 'UNKNOWN_ERROR';
      
      if (err instanceof AudioServiceError) {
        errorMessage = err.message;
        errorCode = err.code;
        
        // Send telemetry for monitoring
        const telemetryData = {
          errorCode: err.code,
          errorMessage: err.message,
          timestamp: new Date().toISOString(),
          // Don't log PII or sensitive data
        };
        
        console.info('Error telemetry:', telemetryData);
      } 
      
      // Set user-facing error
      setError(errorMessage);
      
      // Re-throw for upstream handling if needed
      throw new Error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    analysis,
    isAnalyzing,
    error,
    // Rename the function but keep the original name as an alias for backward compatibility
    analyzeAudio: processAudioAnalysis,
    processAudioAnalysis,
    setAnalysis,
    setError
  };
};
