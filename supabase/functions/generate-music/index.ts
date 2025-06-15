
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

    // Create enhanced prompts that actually describe transforming the input
    let prompt = '';
    let duration = 60; // Extended to 60 seconds instead of 30
    
    if (mode === 'solo') {
      const instrumentPrompts = {
        'saxophone': 'Transform this audio into a smooth jazz saxophone arrangement with melodic improvisation, maintaining the original rhythm and harmony while adding soulful saxophone melodies',
        'harmonica': 'Reimagine this piece as a bluesy harmonica melody, keeping the core musical structure while adding expressive harmonica techniques and blues progressions',
        'steelpan': 'Convert this music into a vibrant caribbean steelpan arrangement, preserving the original tempo while adding tropical steel drum rhythms and island harmonies',
        'electric-guitar': 'Transform this into an electric guitar-driven piece with energetic riffs and rock elements, maintaining the original musical foundation while adding guitar-specific techniques'
      };
      prompt = instrumentPrompts[instrument] || 'melodic instrumental solo arrangement of the input audio';
    } else {
      const groupPrompts = {
        'orchestra': 'Arrange this music for full orchestra with rich string sections, brass, and woodwinds, expanding the original composition into a classical orchestral masterpiece',
        'soul-band': 'Transform this into a 1960s soul band arrangement with groovy rhythm section, horn section, and vintage soul styling while keeping the original musical essence'
      };
      prompt = groupPrompts[group] || 'full band arrangement of the input audio';
    }

    console.log('Generated prompt:', prompt);

    // Use MusicGen with the input audio as reference
    console.log('Calling Replicate MusicGen with input audio...');
    const output = await replicate.run(
      "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
      {
        input: {
          prompt: prompt,
          input_audio: inputAudioUrl, // Changed from audio_input to input_audio
          duration: duration,
          model_version: "stereo-large",
          output_format: "wav",
          normalization_strategy: "loudness",
          continuation: true,
          continuation_start: 0,
          continuation_end: Math.min(30, duration) // Use first 30 seconds of input as seed
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
        original_filename: `Generated ${mode} - ${instrument || group} (60s).wav`,
        file_path: generatedFilePath,
        file_size: audioBuffer.byteLength,
        mime_type: 'audio/wav',
        file_type: 'generated',
        duration_seconds: duration,
        waveform_data: []
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
        duration: duration,
        message: 'Enhanced music generation completed successfully'
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
