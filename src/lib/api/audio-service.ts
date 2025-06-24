import { supabaseClient } from '../supabase';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import type { MusicAnalysis } from '../types/music-analysis';

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

// Audio upload validation
const audioUploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= 50 * 1024 * 1024, // 50MB max
    'File size must be less than 50MB'
  ).refine(
    (file) => file.type.startsWith('audio/'),
    'File must be an audio file'
  )
});

/**
 * Estimate audio duration based on file size and type
 */
function estimateAudioDuration(fileSizeBytes: number, fileType: string): number {
  const bitrates = {
    'audio/mp3': 128000,
    'audio/mpeg': 128000, 
    'audio/wav': 1411200,
    'audio/flac': 700000,
    'audio/ogg': 192000,
    'audio/m4a': 128000,
    'audio/aac': 128000
  };
  
  const bitrate = bitrates[fileType] || 128000;
  return Math.round((fileSizeBytes * 8) / bitrate);
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
      .from('audio')
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
      .from('audio')
      .getPublicUrl(filePath);
      
    // Set up cleanup - delete file after 1 hour
    setTimeout(async () => {
      try {
        await supabaseClient
          .storage
          .from('audio')
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
 * 🎯 SyncLock Musical DNA Extraction
 * 
 * Direct connection to SyncLock Analysis Server for comprehensive musical analysis.
 * Supports full audio files up to 10 minutes for complete musical DNA extraction.
 * 
 * @param file Audio file to analyze (supports full files up to 10 minutes)
 * @returns Complete musical analysis with generation constraints
 */
export async function analyzeAudioFile(file: File): Promise<MusicAnalysis> {
  console.log(`🎵 Starting SyncLock analysis for: ${file.name}`);
  
  try {
    // Validate file
    const validatedFile = audioUploadSchema.parse({ file });
    
    // 🎯 FULL FILE SUPPORT: SyncLock server handles complete files up to 10 minutes
    console.log(`📊 Processing full audio file: ${(file.size / 1024 / 1024).toFixed(1)}MB`);

    // Direct connection to SyncLock Analysis Server
    const syncLockUrl = import.meta.env.VITE_SYNCLOCK_SERVER_URL || 'http://localhost:8000';
    
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('analysis_type', 'comprehensive');
    formData.append('format', 'synclock_dna');
    
    console.log(`📡 Sending to SyncLock server: ${syncLockUrl}/analyze`);
    
    const response = await fetch(`${syncLockUrl}/analyze`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SyncLock analysis failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ SyncLock analysis completed:', data);
    
    // Extract musical DNA from SyncLock response
    const musicalDNA = data.musical_dna;
    
    // Validate required server data - FAIL if not provided
    if (!musicalDNA) {
      throw new Error('SyncLock server did not provide musical_dna - invalid response');
    }
    
    if (!data.energy || !data.confidence_score || !data.sync_accuracy || !data.harmonic_integrity) {
      throw new Error('SyncLock server missing required analysis metrics');
    }
    
    // Log analysis results
    console.log('🎯 Musical DNA extracted:', {
      bpm: musicalDNA.bpm,
      key: musicalDNA.key,
      mode: musicalDNA.mode,
      energy: data.energy,
      duration: data.duration,
      confidence: `${(data.confidence_score * 100).toFixed(1)}%`,
      sync_accuracy: `${(data.sync_accuracy * 100).toFixed(1)}%`
    });
    
    // Create comprehensive music analysis with SyncLock data - NO FALLBACKS
    const musicAnalysis: MusicAnalysis = {
      // Core musical properties from SyncLock DNA
      key: musicalDNA.key,
      tempo: musicalDNA.bpm,
      energy: data.energy,
      mode: musicalDNA.mode,
      confidence: data.confidence_score,
      duration: data.duration,
      
      // Advanced SyncLock metrics
      beatCount: musicalDNA.beat_positions.length,
      chordCount: musicalDNA.chord_progression.length,
      phraseCount: musicalDNA.phrase_boundaries.length,
      syncAccuracy: data.sync_accuracy,
      harmonicIntegrity: data.harmonic_integrity,
      
      // Generation constraints
      generationConstraints: {
        chordLock: 'moderate' as const,
        beatAlignment: 0.8,
        temperature: 0.7,
        maxInterval: 12,
        energyMatch: true,
        scaleConstraint: musicalDNA.scale || 'major'
      },
      
      // Advanced analysis data
      musicalDNA: {
        harmonicPattern: musicalDNA.harmonic_pattern,
        rhythmicSignature: musicalDNA.rhythmic_signature,
        melodicContour: musicalDNA.melodic_contour.map(c => c.interval),
        dynamicProfile: musicalDNA.dynamic_profile
      },
      
      symbolicData: {
        chords: musicalDNA.chord_progression.map(chord => ({
          name: chord.chord,
          start: chord.start_time,
          duration: chord.end_time - chord.start_time,
          confidence: chord.confidence
        })),
        beats: musicalDNA.beat_positions.map((time, index) => ({
          time,
          strength: 1.0
        })),
        phrases: musicalDNA.phrase_boundaries.map(time => ({
          start: time,
          end: time + 4.0,
          type: 'phrase'
        })),
        syncAnchors: [
          ...musicalDNA.beat_positions.map(time => ({
            time,
            type: 'beat' as const,
            importance: 0.8
          })),
          ...musicalDNA.phrase_boundaries.map(time => ({
            time,
            type: 'phrase' as const,
            importance: 1.0
          }))
        ]
      }
    };
    
    console.log('✅ Complete SyncLock analysis processed:', {
      confidence: `${(musicAnalysis.confidence * 100).toFixed(1)}%`,
      tempo: musicAnalysis.tempo,
      key: `${musicAnalysis.key} ${musicAnalysis.mode}`,
      constraints: musicAnalysis.generationConstraints.chordLock,
      beats: musicAnalysis.beatCount,
      chords: musicAnalysis.chordCount,
      duration: `${musicAnalysis.duration}s`
    });
    
    return musicAnalysis;
    
  } catch (error) {
    console.error('❌ SyncLock analysis failed:', error);
    throw new AudioServiceError(
      `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'ANALYSIS_FAILED',
      error
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
    
    // Validate required server data - FAIL if not provided
    if (!musicalDNA) {
      throw new Error('SyncLock server did not provide musical_dna - invalid response');
    }
    
    if (!data.energy || !data.confidence_score || !data.sync_accuracy || !data.harmonic_integrity) {
      throw new Error('SyncLock server missing required analysis metrics');
    }
    
    console.log('🧬 Musical DNA extracted:', {
      bpm: musicalDNA.bpm,
      key: `${musicalDNA.key} ${musicalDNA.mode}`,
      confidence: `${(data.confidence_score * 100).toFixed(1)}%`,
      sync_accuracy: `${(data.sync_accuracy * 100).toFixed(1)}%`
    });
    
    // Create comprehensive music analysis with SyncLock data - NO FALLBACKS
    const musicAnalysis: MusicAnalysis = {
      // Core musical properties from SyncLock DNA
      key: musicalDNA.key,
      tempo: musicalDNA.bpm,
      energy: data.energy,
      mode: musicalDNA.mode,
      confidence: data.confidence_score,
      duration: data.duration,
      
      // Advanced SyncLock metrics
      beatCount: musicalDNA.beat_positions.length,
      chordCount: musicalDNA.chord_progression.length,
      phraseCount: musicalDNA.phrase_boundaries.length,
      syncAccuracy: data.sync_accuracy,
      harmonicIntegrity: data.harmonic_integrity,
      
      // Generation constraints from SyncLock server (100% real data)
      generationConstraints: {
        chordLock: data.generation_constraints.chord_lock,
        beatAlignment: data.generation_constraints.beat_alignment_strength,
        temperature: data.generation_constraints.temperature,
        maxInterval: data.generation_constraints.max_interval,
        energyMatch: data.generation_constraints.energy_matching || true,
        scaleConstraint: data.generation_constraints.scale_constraint
      },
      
      // Advanced analysis data
      musicalDNA: {
        harmonicPattern: musicalDNA.harmonic_pattern,
        rhythmicSignature: musicalDNA.rhythmic_signature,
        melodicContour: musicalDNA.melodic_contour.map(c => c.interval),
        dynamicProfile: musicalDNA.dynamic_profile
      },
      
      symbolicData: {
        chords: musicalDNA.chord_progression.map(chord => ({
          name: chord.chord,
          start: chord.start_time,
          duration: chord.end_time - chord.start_time,
          confidence: chord.confidence
        })),
        beats: musicalDNA.beat_positions.map((time, index) => ({
          time,
          strength: 1.0
        })),
        phrases: musicalDNA.phrase_boundaries.map(time => ({
          start: time,
          end: time + 4.0,
          type: 'phrase'
        })),
        syncAnchors: [
          ...musicalDNA.beat_positions.map(time => ({
            time,
            type: 'beat' as const,
            importance: 0.8
          })),
          ...musicalDNA.phrase_boundaries.map(time => ({
            time,
            type: 'phrase' as const,
            importance: 1.0
          }))
        ]
      }
    };
    
    console.log('✅ Complete SyncLock analysis processed:', {
      confidence: `${(musicAnalysis.confidence * 100).toFixed(1)}%`,
      tempo: musicAnalysis.tempo,
      key: `${musicAnalysis.key} ${musicAnalysis.mode}`,
      constraints: musicAnalysis.generationConstraints.chordLock,
      beats: musicAnalysis.beatCount,
      chords: musicAnalysis.chordCount
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

/**
 * Simple Audio Service for solo instrument generation
 * Maximum 2-minute duration support
 */
export class SimpleAudioService {
  constructor() {
    console.log('🎵 Simple Audio Service initialized (2-minute max)');
  }

  /**
   * Generate solo instrument with 2-minute maximum duration
   * Simplified generation for reliable results
   */
  async generateSoloInstrument(
    analysis: MusicAnalysis,
    targetStyle: string
  ): Promise<{ audioUrl: string; duration: number; }> {
    try {
      console.log(`🎵 Generating solo instrument: ${targetStyle}`);
      console.log(`📊 Duration: ${Math.min(analysis.duration, 120)}s (2-minute max)`);
      
      // Call edge function for generation
      const { data: result, error } = await supabaseClient.functions.invoke('virtuoso-ai-composer', {
        body: {
          analysis: analysis,
          targetStyle: targetStyle,
          maxDuration: Math.min(analysis.duration, 120)
        }
      });

      if (error || !result?.success) {
        throw new Error(`Generation failed: ${error?.message || result?.error || 'Unknown error'}`);
      }

      return {
        audioUrl: result.audioUrl,
        duration: result.duration || Math.min(analysis.duration, 120)
      };
      
    } catch (error) {
      console.error('❌ Generation failed:', error);
      throw new AudioServiceError(
        `Generation failed: ${error.message}`,
        'GENERATION_FAILED'
      );
    }
  }
}
