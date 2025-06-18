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

export interface MusicAnalysis {
  key: string;
  tempo: number;
  energy: number;
  mode: 'major' | 'minor';
  confidence: number;
  duration?: number;
}

/**
 * Convert file to base64 for direct analysis
 * @param file Audio file to convert
 * @returns Promise with base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Uploads an audio file to Supabase storage and returns a public URL
 * @param options Upload options including the audio file
 * @returns Public URL of the uploaded file
 */
export async function uploadAudio({ file, userId = 'anonymous' }: UploadAudioOptions): Promise<string> {
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
 * @param file Audio file to analyze
 * @returns Music analysis with key, tempo, etc.
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

    // Convert file to base64
    const audioBase64 = await fileToBase64(file);
    
    // Call dedicated audio analysis function
    const { data, error } = await supabaseClient.functions.invoke('audio-analysis', {
      body: JSON.stringify({ audioBase64 })
    });
    
    if (error) {
      console.error('Analysis function error:', error);
      throw new AudioServiceError(
        'Audio analysis failed',
        'ANALYSIS_FAILED',
        error
      );
    }

    console.log('💾 Raw response data:', data);
    
    if (!data) {
      throw new AudioServiceError(
        'No response data received',
        'INVALID_RESPONSE'
      );
    }
    
    // Parse JSON string response if needed
    let parsedData: any;
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data);
        console.log('🔍 Parsed string data into object:', parsedData);
      } catch (e) {
        console.error('Failed to parse JSON string:', e);
        throw new AudioServiceError(
          'Invalid JSON response format',
          'INVALID_RESPONSE'
        );
      }
    } else {
      parsedData = data;
      console.log('🔍 Data was already an object');
    }
    
    // Special debug logging
    console.log('🔍 Data type:', typeof parsedData);
    console.log('🔍 Has analysis prop:', parsedData.hasOwnProperty('analysis'));
    console.log('🔍 Has success prop:', parsedData.hasOwnProperty('success'));
    
    // Extract the actual music analysis data
    let musicAnalysis: MusicAnalysis;
    
    if (parsedData.hasOwnProperty('analysis') && typeof parsedData.analysis === 'object') {
      // Case: { analysis: {...} }
      musicAnalysis = parsedData.analysis;
    } else if (
      parsedData.hasOwnProperty('success') && 
      parsedData.success && 
      parsedData.hasOwnProperty('analysis') && 
      typeof parsedData.analysis === 'object'
    ) {
      // Case: { success: true, analysis: {...} }
      musicAnalysis = parsedData.analysis;
    } else if (
      parsedData.hasOwnProperty('key') && 
      parsedData.hasOwnProperty('mode') &&
      parsedData.hasOwnProperty('tempo')
    ) {
      // Case: direct analysis object { key, mode, tempo, ... }
      musicAnalysis = parsedData as MusicAnalysis;
    } else {
      console.error('Unrecognized response format:', parsedData);
      throw new AudioServiceError(
        'Invalid analysis data format',
        'INVALID_RESPONSE'
      );
    }
    
    // Validate we have required analysis fields
    if (!musicAnalysis || 
        typeof musicAnalysis !== 'object' || 
        !musicAnalysis.key || 
        !musicAnalysis.mode || 
        !musicAnalysis.tempo) {
      console.error('Invalid analysis structure:', musicAnalysis);
      throw new AudioServiceError(
        'Invalid or incomplete analysis data',
        'INVALID_RESPONSE'
      );
    }
    
    console.log('✅ Final music analysis:', musicAnalysis);
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
      'Failed to analyze audio',
      'UNKNOWN_ERROR',
      err
    );
  }
}

/**
 * Analyze audio from a URL
 * Uses ACRCloud via Supabase Edge Function
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
    
    // Call dedicated audio analysis function
    const { data, error } = await supabaseClient.functions.invoke('audio-analysis', {
      body: JSON.stringify({ audioUrl })
    });
    
    if (error) {
      console.error('Analysis function error:', error);
      throw new AudioServiceError(
        'Audio analysis failed',
        'ANALYSIS_FAILED',
        error
      );
    }

    console.log('💾 Raw response data:', data);
    
    if (!data) {
      throw new AudioServiceError(
        'No response data received',
        'INVALID_RESPONSE'
      );
    }
    
    // Parse JSON string response if needed
    let parsedData: any;
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data);
        console.log('🔍 Parsed string data into object:', parsedData);
      } catch (e) {
        console.error('Failed to parse JSON string:', e);
        throw new AudioServiceError(
          'Invalid JSON response format',
          'INVALID_RESPONSE'
        );
      }
    } else {
      parsedData = data;
      console.log('🔍 Data was already an object');
    }
    
    // Special debug logging
    console.log('🔍 Data type:', typeof parsedData);
    console.log('🔍 Has analysis prop:', parsedData.hasOwnProperty('analysis'));
    console.log('🔍 Has success prop:', parsedData.hasOwnProperty('success'));
    
    // Extract the actual music analysis data
    let musicAnalysis: MusicAnalysis;
    
    if (parsedData.hasOwnProperty('analysis') && typeof parsedData.analysis === 'object') {
      // Case: { analysis: {...} }
      musicAnalysis = parsedData.analysis;
    } else if (
      parsedData.hasOwnProperty('success') && 
      parsedData.success && 
      parsedData.hasOwnProperty('analysis') && 
      typeof parsedData.analysis === 'object'
    ) {
      // Case: { success: true, analysis: {...} }
      musicAnalysis = parsedData.analysis;
    } else if (
      parsedData.hasOwnProperty('key') && 
      parsedData.hasOwnProperty('mode') &&
      parsedData.hasOwnProperty('tempo')
    ) {
      // Case: direct analysis object { key, mode, tempo, ... }
      musicAnalysis = parsedData as MusicAnalysis;
    } else {
      console.error('Unrecognized response format:', parsedData);
      throw new AudioServiceError(
        'Invalid analysis data format',
        'INVALID_RESPONSE'
      );
    }
    
    // Validate we have required analysis fields
    if (!musicAnalysis || 
        typeof musicAnalysis !== 'object' || 
        !musicAnalysis.key || 
        !musicAnalysis.mode || 
        !musicAnalysis.tempo) {
      console.error('Invalid analysis structure:', musicAnalysis);
      throw new AudioServiceError(
        'Invalid or incomplete analysis data',
        'INVALID_RESPONSE'
      );
    }
    
    console.log('✅ Final music analysis:', musicAnalysis);
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
      'Failed to analyze audio',
      'UNKNOWN_ERROR',
      err
    );
  }
}
