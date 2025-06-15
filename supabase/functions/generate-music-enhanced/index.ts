
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
    
    const { projectId, mode, instrument, group, inputAudioId, musicAnalysis } = await req.json();

    console.log('Enhanced music generation for project:', projectId);
    console.log('Music analysis:', musicAnalysis);

    // Get input audio file details
    const { data: inputAudio, error: audioError } = await supabase
      .from('audio_files')
      .select('*')
      .eq('id', inputAudioId)
      .single();

    if (audioError) {
      throw new Error(`Failed to get input audio: ${audioError.message}`);
    }

    // Create enhanced prompts based on music analysis
    let enhancedPrompt = '';
    const keyInfo = `${musicAnalysis.key} ${musicAnalysis.mode}`;
    const tempoInfo = `${musicAnalysis.tempo} BPM`;
    const energyLevel = musicAnalysis.energy > 70 ? 'high energy' : 
                      musicAnalysis.energy > 40 ? 'medium energy' : 'low energy';

    if (mode === 'solo') {
      const instrumentPrompts = {
        'saxophone': `Professional jazz saxophone solo in ${keyInfo} at ${tempoInfo}, ${energyLevel}, smooth melodic improvisation with rich harmonic content`,
        'harmonica': `Expressive blues harmonica melody in ${keyInfo} at ${tempoInfo}, ${energyLevel}, with authentic bends and vibrato`,
        'steelpan': `Caribbean steelpan melody in ${keyInfo} at ${tempoInfo}, ${energyLevel}, tropical rhythms with authentic island feel`,
        'electric-guitar': `Electric guitar solo in ${keyInfo} at ${tempoInfo}, ${energyLevel}, professional rock/blues style with melodic phrases`
      };
      enhancedPrompt = instrumentPrompts[instrument] || `Melodic instrumental solo in ${keyInfo} at ${tempoInfo}, ${energyLevel}`;
    } else {
      const groupPrompts = {
        'orchestra': `Full orchestral arrangement in ${keyInfo} at ${tempoInfo}, ${energyLevel}, rich harmonies with strings, brass and woodwinds`,
        'soul-band': `1960s soul band arrangement in ${keyInfo} at ${tempoInfo}, ${energyLevel}, authentic rhythm section with horn arrangements`
      };
      enhancedPrompt = groupPrompts[group] || `Full band arrangement in ${keyInfo} at ${tempoInfo}, ${energyLevel}`;
    }

    console.log('Enhanced prompt:', enhancedPrompt);

    let generatedAudioUrl: string;

    // Try Stable Audio first if API key is available
    if (stableAudioApiKey) {
      console.log('Using Stable Audio API...');
      
      const stableAudioResponse = await fetch('https://api.stability.ai/v2beta/stable-audio/generate/music', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stableAudioApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          duration: 60,
          cfg_scale: 7,
          seed: Math.floor(Math.random() * 1000000)
        })
      });

      if (!stableAudioResponse.ok) {
        throw new Error(`Stable Audio API error: ${stableAudioResponse.status}`);
      }

      const stableResult = await stableAudioResponse.json();
      
      if (stableResult.audio_url) {
        generatedAudioUrl = stableResult.audio_url;
      } else {
        throw new Error('No audio URL returned from Stable Audio');
      }
    } else {
      console.log('Stable Audio API key not found, falling back to enhanced MusicGen...');
      
      // Fallback to enhanced MusicGen with better prompts
      const Replicate = (await import("https://esm.sh/replicate@0.25.2")).default;
      const replicateApiKey = Deno.env.get('REPLICATE_API_KEY');
      
      if (!replicateApiKey) {
        throw new Error('No API keys configured for music generation');
      }

      const replicate = new Replicate({ auth: replicateApiKey });

      const output = await replicate.run(
        "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
        {
          input: {
            prompt: enhancedPrompt,
            duration: 60,
            model_version: "stereo-large",
            output_format: "wav",
            normalization_strategy: "loudness",
            continuation: false
          }
        }
      );

      generatedAudioUrl = Array.isArray(output) ? output[0] : output;
    }

    console.log('Generated audio URL:', generatedAudioUrl);

    // Download and store the generated audio
    const audioResponse = await fetch(generatedAudioUrl);
    if (!audioResponse.ok) {
      throw new Error('Failed to download generated audio');
    }

    const audioBlob = await audioResponse.blob();
    const audioBuffer = await audioBlob.arrayBuffer();

    const generatedFileName = `ai_${mode}_${instrument || group}_${musicAnalysis.key}_${Date.now()}.wav`;
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
        original_filename: `AI ${mode} - ${instrument || group} (${keyInfo}).wav`,
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

    // Update project
    const { error: updateError } = await supabase
      .from('music_projects')
      .update({
        status: 'completed',
        output_audio_id: generatedAudio.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (updateError) {
      throw new Error(`Failed to update project: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        projectId,
        outputAudioId: generatedAudio.id,
        audioUrl: publicUrl,
        duration: 60,
        analysis: musicAnalysis,
        message: `AI music generated in ${keyInfo} at ${tempoInfo}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Enhanced generation error:', error);
    
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
