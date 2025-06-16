import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MusicAnalysis {
  key: string;
  tempo: number;
  energy: number;
  mode: 'major' | 'minor';
  confidence: number;
}

class ProfessionalStableAudioService {
  private apiKey: string;
  private maxRetries = 3;
  private retryDelay = 3000; // 3 seconds

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch('https://api.stability.ai/v1/user/account', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async generateHighQualityMusic(prompt: string, duration: number): Promise<string> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`Stable Audio attempt ${attempt}/${this.maxRetries}`);
        console.log('Enhanced prompt:', prompt);

        const response = await fetch('https://api.stability.ai/v2beta/stable-audio/generate/music', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            duration,
            cfg_scale: 7.5, // Higher for better prompt adherence
            seed: Math.floor(Math.random() * 1000000),
            output_format: 'wav'
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Stable Audio API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        
        if (!result.audio_url) {
          throw new Error('No audio URL returned from Stable Audio');
        }

        console.log(`✅ High-quality music generated successfully on attempt ${attempt}`);
        return result.audio_url;

      } catch (error) {
        console.error(`❌ Stable Audio attempt ${attempt} failed:`, error);
        
        if (attempt < this.maxRetries) {
          console.log(`⏳ Retrying in ${this.retryDelay}ms...`);
          await this.delay(this.retryDelay);
        } else {
          throw new Error(`High-quality music generation failed after ${this.maxRetries} attempts: ${error.message}`);
        }
      }
    }

    throw new Error('Unexpected error in music generation');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

function createProfessionalPrompt(musicAnalysis: MusicAnalysis, mode: string, instrument?: string, group?: string): string {
  const keyInfo = `${musicAnalysis.key} ${musicAnalysis.mode}`;
  const tempoInfo = `${musicAnalysis.tempo} BPM`;
  const energyLevel = musicAnalysis.energy > 70 ? 'high energy' : 
                    musicAnalysis.energy > 40 ? 'medium energy' : 'calm energy';

  // Professional-grade prompts optimized for Stable Audio 2.0
  if (mode === 'solo') {
    const instrumentPrompts = {
      'saxophone': `Professional jazz saxophone solo, ${keyInfo}, ${tempoInfo}, ${energyLevel}, smooth melodic improvisation, rich harmonic content, studio quality, stereo`,
      'harmonica': `Expressive blues harmonica melody, ${keyInfo}, ${tempoInfo}, ${energyLevel}, authentic bends and vibrato, professional recording, stereo`,
      'steelpan': `Caribbean steelpan melody, ${keyInfo}, ${tempoInfo}, ${energyLevel}, tropical rhythms, authentic island feel, high-quality recording, stereo`,
      'electric-guitar': `Electric guitar solo, ${keyInfo}, ${tempoInfo}, ${energyLevel}, professional rock/blues style, melodic phrases, studio quality, stereo`
    };
    return instrumentPrompts[instrument!] || `Professional instrumental solo, ${keyInfo}, ${tempoInfo}, ${energyLevel}, studio quality, stereo`;
  } else {
    const groupPrompts = {
      'orchestra': `Full orchestral arrangement, ${keyInfo}, ${tempoInfo}, ${energyLevel}, rich harmonies, strings, brass, woodwinds, professional recording, stereo`,
      'soul-band': `1960s soul band arrangement, ${keyInfo}, ${tempoInfo}, ${energyLevel}, authentic rhythm section, horn arrangements, vintage sound, stereo`
    };
    return groupPrompts[group!] || `Professional full band arrangement, ${keyInfo}, ${tempoInfo}, ${energyLevel}, studio quality, stereo`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const stableAudioApiKey = Deno.env.get('STABLE_AUDIO_API_KEY');
    
    if (!stableAudioApiKey) {
      throw new Error('STABLE_AUDIO_API_KEY environment variable is required for high-quality music generation');
    }

    const { audioFile, mode, instrument, group, musicAnalysis } = await req.json();

    console.log('🎵 Professional music generation');
    console.log('🎼 Music analysis:', musicAnalysis);

    // Upload input audio file to storage
    const timestamp = Date.now();
    const fileName = `${timestamp}_${audioFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `anonymous/${fileName}`;

    // Convert base64 back to buffer
    const inputAudioBuffer = Uint8Array.from(atob(audioFile.data), c => c.charCodeAt(0));

    const { error: inputUploadError } = await supabase.storage
      .from('audio-files')
      .upload(filePath, inputAudioBuffer, {
        contentType: audioFile.mimeType,
        upsert: false
      });

    if (inputUploadError) {
      throw new Error(`Failed to upload input audio: ${inputUploadError.message}`);
    }

    // Create input audio record
    const { data: inputAudio, error: audioError } = await supabase
      .from('audio_files')
      .insert({
        user_id: 'anonymous',
        filename: fileName,
        original_filename: audioFile.name,
        file_path: filePath,
        file_size: audioFile.size,
        mime_type: audioFile.mimeType,
        file_type: 'uploaded',
        duration_seconds: musicAnalysis.duration || 0,
        waveform_data: []
      })
      .select()
      .single();

    if (audioError) {
      throw new Error(`Failed to create audio record: ${audioError.message}`);
    }

    // Create professional prompt based on real musical analysis
    const enhancedPrompt = createProfessionalPrompt(musicAnalysis, mode, instrument, group);

    console.log('🎯 Professional prompt:', enhancedPrompt);

    // Use only high-quality Stable Audio service
    const stableAudio = new ProfessionalStableAudioService(stableAudioApiKey);
    
    // Verify service availability
    const isAvailable = await stableAudio.isAvailable();
    if (!isAvailable) {
      throw new Error('Stable Audio service is currently unavailable. Please try again in a few minutes.');
    }

    // Generate high-quality music
    const audioUrl = await stableAudio.generateHighQualityMusic(enhancedPrompt, 60);

    console.log('✅ High-quality music generated successfully');
    console.log('🔗 Audio URL:', audioUrl);

    // Download and store the generated audio
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error('Failed to download generated audio');
    }

    const audioBlob = await audioResponse.blob();
    const audioBuffer = await audioBlob.arrayBuffer();

    const generatedFileName = `virtuoso_${mode}_${instrument || group}_${musicAnalysis.key}_${Date.now()}.wav`;
    const generatedFilePath = `${inputAudio.user_id}/${generatedFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(generatedFilePath, audioBuffer, {
        contentType: 'audio/wav',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Failed to upload: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('audio-files')
      .getPublicUrl(generatedFilePath);

    // Create database record
    const { data: generatedAudio, error: generatedError } = await supabase
      .from('audio_files')
      .insert({
        user_id: inputAudio.user_id,
        filename: generatedFileName,
        original_filename: `Virtuoso AI ${mode} - ${instrument || group} (${musicAnalysis.key} ${musicAnalysis.mode}).wav`,
        file_path: generatedFilePath,
        file_size: audioBuffer.byteLength,
        mime_type: 'audio/wav',
        file_type: 'generated',
        duration_seconds: 60,
        waveform_data: []
      })
      .select()
      .single();

    if (generatedError) {
      throw new Error(`Failed to create record: ${generatedError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        outputAudioId: generatedAudio.id,
        audioUrl: publicUrl,
        fileName: generatedAudio.original_filename,
        duration: 60,
        analysis: musicAnalysis,
        serviceName: 'Stable Audio 2.0',
        quality: 'Professional 44.1kHz Stereo',
        message: `High-quality AI music generated in ${musicAnalysis.key} ${musicAnalysis.mode} at ${musicAnalysis.tempo} BPM`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('❌ Professional music generation error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
