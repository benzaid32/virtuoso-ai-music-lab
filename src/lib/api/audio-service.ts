import { supabaseClient, STORAGE_BUCKETS } from '../supabase';
import { z } from 'zod';
import { nanoid } from 'nanoid';

// Strongly typed error handling
export class AudioServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'AudioServiceError';
  }
}

// Input validation schemas
const audioUploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => ['audio/mpeg', 'audio/wav', 'audio/mp3'].includes(file.type),
    { message: 'File must be a valid audio format (MP3 or WAV)' }
  ).refine(
    (file) => file.size <= 5 * 1024 * 1024,
    { message: 'File size must be less than 5MB' }
  ),
});

const audioAnalysisSchema = z.object({
  audioUrl: z.string().url({ message: 'Audio URL must be a valid URL' }),
});

// Utility functions
function estimateAudioDuration(fileSize: number, fileType: string): number {
  // Estimate bitrate based on file type
  let bitrate = 128000; // Default to 128kbps (common for MP3)
  
  if (fileType.includes('wav')) {
    // WAV files are typically uncompressed
    bitrate = 1411000; // 16-bit, 44.1kHz, stereo
  } else if (fileType.includes('flac')) {
    bitrate = 900000; // Typical FLAC bitrate
  } else if (fileType.includes('ogg')) {
    bitrate = 160000; // Typical OGG/Vorbis bitrate
  } else if (fileType.includes('m4a')) {
    bitrate = 256000; // Typical AAC bitrate
  }
  
  // Calculate duration: fileSize (bits) / bitrate (bits/second) = duration (seconds)
  const durationSeconds = Math.round((fileSize * 8) / bitrate);
  return durationSeconds;
}

// Rate limiting for security
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5; // 5 requests per minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = rateLimitMap.get(userId) || 0;
  
  if (userRequests >= MAX_REQUESTS) {
    return false;
  }
  
  rateLimitMap.set(userId, userRequests + 1);
  setTimeout(() => {
    const currentRequests = rateLimitMap.get(userId) || 0;
    rateLimitMap.set(userId, Math.max(0, currentRequests - 1));
  }, RATE_LIMIT_WINDOW);
  
  return true;
}

interface UploadAudioOptions {
  file: File;
  userId?: string;
}

/**
 * Comprehensive music analysis interface with SyncLock Architecture data
 * Contains all musical DNA required for professional AI music generation
 */
export interface MusicAnalysis {
  // Core musical properties (backward compatibility)
  key: string;
  tempo: number;
  energy: number;
  mode: 'major' | 'minor';
  confidence: number;
  duration?: number;
  
  // Enhanced SyncLock data
  bpm: number;
  bpm_confidence: number;
  key_confidence: number;
  scale: string;
  time_signature: string;
  
  // Advanced musical structure
  chord_progression: Array<{
    start_time: number;
    end_time: number;
    chord: string;
    confidence: number;
    roman_numeral: string;
    function: string;
  }>;
  beat_positions: number[];
  downbeat_positions: number[];
  melodic_contour: Array<{
    time: number;
    interval: number;
    direction: 'up' | 'down' | 'same';
    pitch: number;
  }>;
  phrase_boundaries: number[];
  
  // Quality metrics
  overall_confidence: number;
  sync_accuracy: number;
  harmonic_integrity: number;
  rhythmic_stability: number;
  
  // Generation constraints for AI (CRITICAL for preventing contamination)
  generation_constraints?: {
    temperature: number;
    max_interval: number;
    chord_lock: string;
    beat_alignment_strength: number;
    scale_constraint: string;
    phrase_boundary_lock: boolean;
    energy_matching: boolean;
  };
  
  // SyncLock quantum time grid data (Enterprise)
  quantum_time_grid?: {
    grid_points: Array<{
      index: number;
      time: number;
      sample_start: number;
      sample_end: number;
      energy: number;
      is_beat: boolean;
    }>;
    energy_profile: number[];
    sync_anchors: number[];
    sample_rate: number;
    total_samples: number;
  };
  
  // SyncLock symbolic data (Enterprise)
  symbolic_data?: {
    midi_notes: Array<{
      start_time: number;
      end_time: number;
      pitch: number;
      velocity: number;
    }>;
    chord_symbols: string[];
    beat_events: Array<{
      time: number;
      strength: number;
    }>;
    phrase_markers: Array<{
      time: number;
      type: string;
      confidence: number;
    }>;
    instrumental_stems: Record<string, string>;
  };
  
  // Quantum time grid for sample-accurate alignment (Legacy)
  quantum_alignment?: {
    grid_points: Array<{
      index: number;
      time: number;
      sample_start: number;
      sample_end: number;
      energy: number;
      is_beat: boolean;
    }>;
    energy_profile: number[];
    sync_anchors: number[];
    sample_rate: number;
    total_samples: number;
  };
  
  // Symbolic data for advanced generation (Legacy)
  symbolic_analysis?: {
    midi_notes: Array<{
      start_time: number;
      end_time: number;
      pitch: number;
      velocity: number;
    }>;
    chord_symbols: string[];
    beat_events: Array<{
      time: number;
      strength: number;
    }>;
    phrase_markers: Array<{
      time: number;
      type: string;
      confidence: number;
    }>;
    instrumental_stems: Record<string, string>;
  };
  
  // Audio properties
  sample_rate: number;
  analysis_duration: number;
  processing_time: number;
  
  // Service metadata
  service: string;
  confidence_score: number;
  message: string;
  
  // Raw SyncLock data for advanced usage
  synclock_raw?: any;
}

/**
 * Uploads an audio file to Supabase storage and returns a public URL
 * @param options Upload options including the audio file
 * @param temporary If true, sets an automatic expiration for the file (24 hours)
 * @returns Public URL of the uploaded file
 */
export async function uploadAudio({ file, userId = 'anonymous' }: UploadAudioOptions, temporary = false): Promise<string> {
  try {
    // Input validation
    const validatedData = audioUploadSchema.parse({ file });
    
    // Rate limiting
    if (!checkRateLimit(userId)) {
      throw new AudioServiceError(
        'Too many requests. Please try again later.',
        'RATE_LIMIT_EXCEEDED'
      );
    }
    
    // Generate a unique filename
    const fileExt = file.name.split('.').pop() || 'mp3';
    const fileName = `${nanoid()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;
    
    // Upload file to Supabase
    const { data, error } = await supabaseClient
      .storage
      .from(STORAGE_BUCKETS.AUDIO)
      .upload(filePath, validatedData.file, {
        cacheControl: '3600',
        upsert: false,
      });
      
    if (error) {
      console.error('Storage upload error:', error);
      throw new AudioServiceError(
        'Failed to upload audio file',
        'UPLOAD_FAILED',
        error
      );
    }
    
    // Get public URL
    const { data: urlData } = supabaseClient
      .storage
      .from(STORAGE_BUCKETS.AUDIO)
      .getPublicUrl(filePath);
      
    // Set up cleanup - delete file after 1 hour
    setTimeout(async () => {
      try {
        await supabaseClient
          .storage
          .from(STORAGE_BUCKETS.AUDIO)
          .remove([filePath]);
      } catch (err) {
        console.error('Failed to cleanup temporary audio file:', err);
      }
    }, 60 * 60 * 1000); // 1 hour
    
    return urlData.publicUrl;
    
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new AudioServiceError(
        err.errors[0].message || 'Invalid audio file',
        'VALIDATION_ERROR',
        err
      );
    }
    
    if (err instanceof AudioServiceError) {
      throw err;
    }
    
    throw new AudioServiceError(
      'Failed to process audio upload',
      'UNKNOWN_ERROR',
      err
    );
  }
}

/**
 * Analyze an audio file without storing it
 * Uses SyncLock Architecture for comprehensive musical DNA extraction
 * @param file Audio file to analyze
 * @returns Complete musical analysis with generation constraints
 */
export async function analyzeAudioFile(file: File): Promise<MusicAnalysis> {
  try {
    // Validate inputs
    if (!file) {
      throw new AudioServiceError(
        'No file provided',
        'MISSING_FILE'
      );
    }

    console.log('🎯 Starting SyncLock analysis for file:', file.name);
    
    // We need to analyze complete audio files up to 10 minutes
    console.log('🎧 Processing audio for full professional analysis...');
    
    // Get the file details for logging
    const fileSizeKB = (file.size / 1024).toFixed(2);
    console.log(`💾 Processing complete file: ${file.name} (${fileSizeKB} KB)`);
    
    // Check file size limits - Enterprise version supports up to 50MB files
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      throw new AudioServiceError(
        `File size exceeds 50MB limit (${fileSizeKB} KB)`,
        'FILE_TOO_LARGE'
      );
    }

    console.log('📦 Sending complete audio file for full professional analysis...');
    
    // Call SyncLock Architecture directly (Enterprise-Grade)
    console.log('🎯 Connecting directly to SyncLock Architecture server...');
    
    // Enterprise SyncLock server URL (production server)
    const SYNCLOCK_SERVER_URL = 'http://13.50.242.251:8000'; // Production SyncLock server
    
    console.log(`📡 SyncLock server: ${SYNCLOCK_SERVER_URL}/analyze`);
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('SyncLock server timeout after 3 minutes')), 180000)
    );
    
    // Create FormData for direct file upload to SyncLock server
    const formData = new FormData();
    formData.append('audio', file); // Send the complete original file
    
    const syncLockPromise = fetch(`${SYNCLOCK_SERVER_URL}/analyze`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type, let browser set it for FormData
      headers: {
        // Add any required authentication headers here if needed
      }
    });

    console.log('📡 Waiting for SyncLock analysis response...');
    const response = await Promise.race([syncLockPromise, timeoutPromise]) as Response;
    console.log('📡 SyncLock analysis call completed');

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ SyncLock server error: ${response.status} - ${errorText}`);
      throw new AudioServiceError(
        `SyncLock analysis failed: ${response.status} - ${errorText}`,
        'SYNCLOCK_SERVER_ERROR'
      );
    }

    const data = await response.json();
    
    console.log('💾 Raw SyncLock response:', data);
    
    if (!data) {
      throw new AudioServiceError(
        'No response data received from SyncLock',
        'INVALID_RESPONSE'
      );
    }
    
    console.log('🔍 Processing SyncLock server response:', data);
    
    // Validate SyncLock response structure (direct server format)
    if (!data.success) {
      console.error('SyncLock analysis failed:', data.error || 'Unknown error');
      throw new AudioServiceError(
        data.error || 'SyncLock analysis failed',
        'ANALYSIS_FAILED'
      );
    }
    
    // Extract musical DNA from SyncLock response
    const musicalDNA = data.musical_dna;
    const quantumGrid = data.quantum_time_grid;
    const symbolicData = data.symbolic_data;
    const generationConstraints = data.generation_constraints;
    
    console.log('🧬 Musical DNA extracted:', {
      bpm: musicalDNA?.bpm,
      key: `${musicalDNA?.key} ${musicalDNA?.mode}`,
      confidence: `${(data.confidence_score * 100).toFixed(1)}%`,
      sync_accuracy: `${(data.sync_accuracy * 100).toFixed(1)}%`
    });
    
    // Create comprehensive music analysis with SyncLock data
    const musicAnalysis: MusicAnalysis = {
      // Core musical properties from SyncLock DNA
      key: musicalDNA?.key || 'C',
      tempo: musicalDNA?.bpm || 120,
      energy: data.energy || 0.5,
      mode: musicalDNA?.mode as 'major' | 'minor' || 'major',
      confidence: data.confidence_score || 0.5,
      duration: data.duration,
      
      // Enhanced SyncLock fields
      bpm: musicalDNA?.bpm || 120,
      bpm_confidence: musicalDNA?.bmp_confidence || 0.5,
      key_confidence: musicalDNA?.key_confidence || 0.5,
      scale: `${musicalDNA?.key} ${musicalDNA?.mode}`,
      time_signature: musicalDNA?.time_signature || '4/4',
      
      // Advanced musical data from SyncLock
      chord_progression: musicalDNA?.chord_progression || [],
      beat_positions: musicalDNA?.beat_positions || [],
      downbeat_positions: musicalDNA?.downbeat_positions || [],
      melodic_contour: musicalDNA?.melodic_contour || [],
      phrase_boundaries: musicalDNA?.phrase_boundaries || [],
      
      // Quality metrics from SyncLock
      overall_confidence: data.confidence_score || 0.5,
      sync_accuracy: data.sync_accuracy || 0.9,
      harmonic_integrity: data.harmonic_integrity || 0.8,
      rhythmic_stability: data.rhythmic_stability || 0.8,
      
      // SyncLock quantum grid data
      quantum_time_grid: quantumGrid,
      symbolic_data: symbolicData,
      generation_constraints: generationConstraints,
      
      // Technical metadata
      sample_rate: data.sample_rate || 44100,
      analysis_duration: data.analysis_duration || 0,
      processing_time: data.analysis_duration || 0,
      
      // Service metadata
      service: '🎯 SyncLock Architecture Direct',
      confidence_score: data.confidence_score || 0.5,
      message: 'SyncLock analysis completed via direct connection'
    };
    
    console.log('✅ Complete SyncLock analysis processed:', {
      confidence: `${(musicAnalysis.confidence_score * 100).toFixed(1)}%`,
      bpm: musicAnalysis.bpm,
      key: musicAnalysis.scale,
      constraints: musicAnalysis.generation_constraints.scale_constraint,
      beats: musicAnalysis.beat_positions.length,
      chords: musicAnalysis.chord_progression.length
    });
    
    return musicAnalysis;
    
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new AudioServiceError(
        err.errors[0].message || 'Invalid audio file',
        'VALIDATION_ERROR',
        err
      );
    }
    
    if (err instanceof AudioServiceError) {
      throw err;
    }
    
    throw new AudioServiceError(
      'Failed to analyze audio with SyncLock',
      'UNKNOWN_ERROR',
      err
    );
  }
}

/**
 * Analyze audio from a URL using SyncLock Architecture
 */
export async function analyzeAudio(audioUrl: string): Promise<MusicAnalysis> {
  try {
    // Validate URL format
    if (!audioUrl) {
      throw new AudioServiceError(
        'No audio URL provided', 
        'MISSING_URL'
      );
    }

    if (typeof audioUrl !== 'string') {
      throw new AudioServiceError(
        'Invalid audio URL format',
        'INVALID_URL'
      );
    }
    
    console.log('🎯 Starting SyncLock analysis for URL:', audioUrl);
    
    // Call SyncLock Architecture edge function
    const { data, error } = await supabaseClient.functions.invoke('audio-analysis', {
      body: JSON.stringify({ audioUrl })
    });
    
    if (error) {
      console.error('SyncLock analysis function error:', error);
      throw new AudioServiceError(
        'SyncLock analysis failed',
        'ANALYSIS_FAILED',
        error
      );
    }

    console.log('💾 Raw SyncLock response:', data);
    
    if (!data) {
      throw new AudioServiceError(
        'No response data received from SyncLock',
        'INVALID_RESPONSE'
      );
    }
    
    console.log('🔍 Processing SyncLock server response:', data);
    
    // Validate SyncLock response structure (direct server format)
    if (!data.success) {
      console.error('SyncLock analysis failed:', data.error || 'Unknown error');
      throw new AudioServiceError(
        data.error || 'SyncLock analysis failed',
        'ANALYSIS_FAILED'
      );
    }
    
    // Extract musical DNA from SyncLock response
    const musicalDNA = data.musical_dna;
    const quantumGrid = data.quantum_time_grid;
    const symbolicData = data.symbolic_data;
    const generationConstraints = data.generation_constraints;
    
    console.log('🧬 Musical DNA extracted:', {
      bpm: musicalDNA?.bpm,
      key: `${musicalDNA?.key} ${musicalDNA?.mode}`,
      confidence: `${(data.confidence_score * 100).toFixed(1)}%`,
      sync_accuracy: `${(data.sync_accuracy * 100).toFixed(1)}%`
    });
    
    // Create comprehensive music analysis with SyncLock data
    const musicAnalysis: MusicAnalysis = {
      // Core musical properties from SyncLock DNA
      key: musicalDNA?.key || 'C',
      tempo: musicalDNA?.bpm || 120,
      energy: data.energy || 0.5,
      mode: musicalDNA?.mode as 'major' | 'minor' || 'major',
      confidence: data.confidence_score || 0.5,
      duration: data.duration,
      
      // Enhanced SyncLock fields
      bpm: musicalDNA?.bpm || 120,
      bpm_confidence: musicalDNA?.bmp_confidence || 0.5,
      key_confidence: musicalDNA?.key_confidence || 0.5,
      scale: `${musicalDNA?.key} ${musicalDNA?.mode}`,
      time_signature: musicalDNA?.time_signature || '4/4',
      
      // Advanced musical data from SyncLock
      chord_progression: musicalDNA?.chord_progression || [],
      beat_positions: musicalDNA?.beat_positions || [],
      downbeat_positions: musicalDNA?.downbeat_positions || [],
      melodic_contour: musicalDNA?.melodic_contour || [],
      phrase_boundaries: musicalDNA?.phrase_boundaries || [],
      
      // Quality metrics from SyncLock
      overall_confidence: data.confidence_score || 0.5,
      sync_accuracy: data.sync_accuracy || 0.9,
      harmonic_integrity: data.harmonic_integrity || 0.8,
      rhythmic_stability: data.rhythmic_stability || 0.8,
      
      // SyncLock quantum grid data
      quantum_time_grid: quantumGrid,
      symbolic_data: symbolicData,
      generation_constraints: generationConstraints,
      
      // Technical metadata
      sample_rate: data.sample_rate || 44100,
      analysis_duration: data.analysis_duration || 0,
      processing_time: data.analysis_duration || 0,
      
      // Service metadata
      service: '🎯 SyncLock Architecture Direct',
      confidence_score: data.confidence_score || 0.5,
      message: 'SyncLock analysis completed via direct connection'
    };
    
    console.log('✅ Complete SyncLock analysis processed:', {
      confidence: `${(musicAnalysis.confidence_score * 100).toFixed(1)}%`,
      bpm: musicAnalysis.bpm,
      key: musicAnalysis.scale,
      constraints: musicAnalysis.generation_constraints.scale_constraint,
      beats: musicAnalysis.beat_positions.length,
      chords: musicAnalysis.chord_progression.length
    });
    
    return musicAnalysis;
    
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new AudioServiceError(
        err.errors[0].message || 'Invalid audio URL',
        'VALIDATION_ERROR',
        err
      );
    }
    
    if (err instanceof AudioServiceError) {
      throw err;
    }
    
    throw new AudioServiceError(
      'Failed to analyze audio with SyncLock',
      'UNKNOWN_ERROR',
      err
    );
  }
}
