
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Replicate from "https://esm.sh/replicate@0.25.2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const replicateApiKey = Deno.env.get('REPLICATE_API_KEY');
    if (!replicateApiKey) {
      throw new Error('REPLICATE_API_KEY is not configured');
    }

    const replicate = new Replicate({
      auth: replicateApiKey,
    });

    const { projectId, mode, instrument, group, inputAudioId } = await req.json();

    console.log('Starting music generation for project:', projectId);

    // Get input audio file details
    const { data: inputAudio, error: audioError } = await supabase
      .from('audio_files')
      .select('*')
      .eq('id', inputAudioId)
      .single();

    if (audioError) {
      throw new Error(`Failed to get input audio: ${audioError.message}`);
    }

    // Get the public URL for the input audio
    const { data: { publicUrl: inputAudioUrl } } = supabase.storage
      .from('audio-files')
      .getPublicUrl(inputAudio.file_path);

    console.log('Input audio URL:', inputAudioUrl);

    // Create music generation prompt based on mode and selection
    let prompt = '';
    if (mode === 'solo') {
      const instrumentPrompts = {
        'saxophone': 'smooth jazz saxophone solo, melodic and soulful',
        'harmonica': 'bluesy harmonica melody, expressive and emotional',
        'steelpan': 'caribbean steelpan rhythm, tropical and upbeat',
        'electric-guitar': 'electric guitar riffs, energetic rock style'
      };
      prompt = instrumentPrompts[instrument] || 'melodic instrumental solo';
    } else {
      const groupPrompts = {
        'orchestra': 'full orchestra arrangement, classical and rich harmonies',
        'soul-band': '1960s soul band, groovy rhythm section with horns'
      };
      prompt = groupPrompts[group] || 'full band arrangement';
    }

    console.log('Generated prompt:', prompt);

    // Run MusicGen model using the correct model identifier
    console.log('Calling Replicate MusicGen...');
    const output = await replicate.run(
      "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
      {
        input: {
          prompt: prompt,
          duration: 30,
          model_version: "stereo-large",
          output_format: "wav",
          normalization_strategy: "loudness"
        }
      }
    );

    console.log('MusicGen output:', output);

    if (!output) {
      throw new Error('No output received from MusicGen');
    }

    // The output is a URL to the generated audio file
    const generatedAudioUrl = Array.isArray(output) ? output[0] : output;
    console.log('Generated audio URL:', generatedAudioUrl);

    // Download the generated audio
    const audioResponse = await fetch(generatedAudioUrl);
    if (!audioResponse.ok) {
      throw new Error('Failed to download generated audio');
    }

    const audioBlob = await audioResponse.blob();
    const audioBuffer = await audioBlob.arrayBuffer();

    // Upload the generated audio to Supabase Storage
    const generatedFileName = `generated_${mode}_${instrument || group}_${Date.now()}.wav`;
    const generatedFilePath = `${inputAudio.user_id}/${generatedFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(generatedFilePath, audioBuffer, {
        contentType: 'audio/wav',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Failed to upload generated audio: ${uploadError.message}`);
    }

    // Get public URL for the generated file
    const { data: { publicUrl: generatedPublicUrl } } = supabase.storage
      .from('audio-files')
      .getPublicUrl(generatedFilePath);

    // Create database record for generated audio
    const { data: generatedAudio, error: generatedError } = await supabase
      .from('audio_files')
      .insert({
        user_id: inputAudio.user_id,
        filename: generatedFileName,
        original_filename: `Generated ${mode} - ${instrument || group}.wav`,
        file_path: generatedFilePath,
        file_size: audioBuffer.byteLength,
        mime_type: 'audio/wav',
        file_type: 'generated',
        waveform_data: [] // Will be generated later if needed
      })
      .select()
      .single();

    if (generatedError) {
      throw new Error(`Failed to create generated audio record: ${generatedError.message}`);
    }

    // Update project status
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

    console.log('Music generation completed for project:', projectId);

    return new Response(
      JSON.stringify({
        success: true,
        projectId,
        outputAudioId: generatedAudio.id,
        audioUrl: generatedPublicUrl,
        message: 'Music generation completed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Error in generate-music function:', error);
    
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
