// Follow the official Supabase CORS pattern exactly
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerationRequest {
  prompt: string;
  targetStyle: string;
  analysis: {
    tempo: number;
    key: string;
    energy: number;
    mode?: string;
    duration?: number;
  };
  audioFile: string;
  predictionId?: string;
}

interface ReplicateResponse {
  id: string;
  status: string;
  output: {
    audio?: string; // MusicGen Remixer direct audio URL
    mp3?: string;   // Fallback for other models
  } | string | null; // MusicGen Remixer can return direct URL string
}

console.log('🎵 Virtuoso AI Composer Edge Function loaded');

Deno.serve(async (req) => {
  console.log(`🔍 Function called with method: ${req.method}`)
  console.log(`🔍 Request URL: ${req.url}`)

  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    console.log(`✅ Handling OPTIONS request with CORS headers`)
    return new Response('ok', { headers: corsHeaders })
  }

  // Handle polling endpoint (GET request)
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url);
      const predictionId = url.searchParams.get('predictionId');
      
      if (!predictionId) {
        return new Response(
          JSON.stringify({ success: false, error: 'predictionId parameter required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      console.log('🔎 Polling prediction status:', predictionId);
      
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${Deno.env.get('REPLICATE_API_KEY')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!pollResponse.ok) {
        return new Response(
          JSON.stringify({ success: false, error: `Replicate API error: ${pollResponse.status}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: pollResponse.status }
        );
      }

      const result: ReplicateResponse = await pollResponse.json();
      console.log('📋 Polling result:', { status: result.status, id: result.id });

      if (result.status === 'succeeded' && result.output) {
        // MusicGen Remixer can return different output formats
        let audioUrl: string | null = null;
        
        if (typeof result.output === 'string') {
          audioUrl = result.output;
        } else if (result.output && typeof result.output === 'object') {
          audioUrl = result.output.audio || result.output.mp3 || null;
        }
        
        if (audioUrl) {
          console.log('🎉 Generation completed! Audio URL:', audioUrl);
          return new Response(
            JSON.stringify({
              success: true,
              status: 'completed',
              audioUrl: audioUrl,
              model: 'MusicGen Remixer'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else if (result.status === 'failed') {
        console.error('❌ Generation failed:', result);
        return new Response(
          JSON.stringify({
            success: false,
            status: 'failed',
            error: `Generation failed: ${result.error || 'Unknown error'}`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Still processing
      return new Response(
        JSON.stringify({
          success: true,
          status: result.status,
          message: 'Generation still in progress'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } catch (error) {
      console.error('❌ Error in polling:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
  }

  try {
    console.log(`📥 Processing ${req.method} request...`)
    
    if (req.method !== 'POST') {
      console.log(`❌ Method not allowed: ${req.method} (expected POST)`)
      return new Response(
        JSON.stringify({ success: false, error: `Method ${req.method} not allowed. Only POST requests are supported.` }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 405 
        }
      )
    }
    
    console.log(`✅ POST request received, parsing body...`)

    console.log('✅ POST request received, parsing JSON...')
    const requestBody = await req.json()
    console.log('📨 Request body:', JSON.stringify(requestBody))

    const { prompt, targetStyle, analysis, audioFile, predictionId: existingPredictionId } = requestBody

    // If predictionId is provided, check status instead of creating new generation
    if (existingPredictionId) {
      console.log('🔍 Checking status for existing predictionId:', existingPredictionId)
      
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${existingPredictionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${Deno.env.get('REPLICATE_API_KEY')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!pollResponse.ok) {
        console.error(`❌ Status check failed: ${pollResponse.status}`)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to check generation status',
            predictionId: existingPredictionId
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 500 
          }
        )
      }

      const result: ReplicateResponse = await pollResponse.json()
      console.log('📋 Status check result:', JSON.stringify(result))

      if (result.status === 'succeeded' && result.output) {
        // MusicGen Remixer can return different output formats
        let audioUrl: string | null = null;
        
        if (typeof result.output === 'string') {
          // Direct URL string
          audioUrl = result.output;
        } else if (result.output?.audio) {
          // Object with audio property
          audioUrl = result.output.audio;
        } else if (result.output?.mp3) {
          // Fallback for other models
          audioUrl = result.output.mp3;
        }
        
        if (audioUrl) {
          console.log('🎉 Audio-to-audio generation completed! Audio URL:', audioUrl)
          
          return new Response(
            JSON.stringify({
              success: true,
              audioUrl,
              targetStyle,
              service: 'Replicate MusicGen Remixer',
              message: 'Audio-to-audio style transfer completed with perfect timing preservation'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
      }
      
      if (result.status === 'failed') {
        console.error('❌ Music generation failed for existing predictionId')
        return new Response(
          JSON.stringify({ success: false, error: 'Music generation failed' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 500 
          }
        )
      }

      console.log('⏳ Generation still in progress for existing predictionId')
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Generation still in progress',
          predictionId: existingPredictionId,
          message: 'Music generation is still processing. Please try again in a few moments.'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 202
        }
      )
    }

    // Get audio file from request for audio-to-audio generation
    if (!audioFile) {
      console.error('❌ No audio file provided for remix')
      return new Response(
        JSON.stringify({ success: false, error: 'Audio file required for audio-to-audio generation' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      )
    }

    console.log('🎵 Starting audio-to-audio generation with MusicGen Remixer...');
    console.log('📋 Input parameters:', {
      prompt: prompt.substring(0, 100) + '...',
      targetStyle,
      analysis: analysis,
      duration: analysis.duration
    });

    // 🚫 STRICT VALIDATION: ZERO TOLERANCE FOR MOCK DATA
    if (!analysis) {
      console.error('❌ No analysis data provided')
      return new Response(
        JSON.stringify({ success: false, error: 'SyncLock analysis data required for audio-to-audio generation' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      )
    }

    // 🚫 VALIDATE REQUIRED REAL DATA - NO FALLBACKS ALLOWED
    if (!analysis.key || !analysis.tempo || analysis.energy === undefined) {
      console.error('❌ Missing required analysis data:', { 
        key: analysis.key, 
        tempo: analysis.tempo, 
        energy: analysis.energy 
      })
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Incomplete SyncLock analysis data. Real key, tempo, and energy values required from SyncLock server.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      )
    }

    console.log('✅ Using REAL SyncLock analysis data:', {
      key: analysis.key,
      tempo: analysis.tempo,
      energy: analysis.energy,
      mode: analysis.mode,
      duration: analysis.duration
    });

    // 🎯 MUSICGEN REMIXER - Audio-to-Audio Style Transfer for Perfect Timing
    console.log('🎵 Using MusicGen Remixer for audio-to-audio style transfer with perfect timing preservation...');
    
    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY')
    if (!REPLICATE_API_KEY) {
      console.error('❌ REPLICATE_API_KEY not configured')
      return new Response(
        JSON.stringify({ success: false, error: 'REPLICATE_API_KEY not configured' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      )
    }

    // 🎸 Audio-to-Audio generation that maintains EXACT timing and structure
    const generateResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: '0b769f28e399c7c30e4f2360691b9b11c294183e9ab2fd9f3398127b556c86d7', // MusicGen Remixer
        input: {
          // 🎯 Original audio as primary input (maintains timing/rhythm/structure)
          music_input: audioFile,
          
          // 🎵 Style transfer prompt (what instrument/style to transform to) - ZERO FALLBACKS
          prompt: `Transform this music into a professional ${targetStyle} performance. Maintain the exact timing, rhythm, and structure while changing only the instrumentation to ${targetStyle}. Keep the same key (${analysis.key}), tempo (${Math.round(analysis.tempo)} BPM), and ${analysis.energy > 0.7 ? 'high energy' : analysis.energy > 0.5 ? 'moderate energy' : 'gentle'} feel.`,
          
          // ⚡ Audio-to-audio parameters for perfect alignment
          model_version: 'chord-large', // Best model for audio conditioning
          multi_band_diffusion: true, // Enhanced audio quality
          beat_sync_threshold: 1.1, // Perfect beat alignment
          classifier_free_guidance: 3.0, // Style transfer strength
          output_format: 'mp3',
          duration: 60 // 🚀 TESTING: Limit to 1 minute for faster results
        }
      })
    });

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text()
      console.error('❌ Replicate MusicGen-Style failed:', generateResponse.status, errorText)
      return new Response(
        JSON.stringify({ success: false, error: `Generation failed: ${generateResponse.status} - ${errorText}` }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      )
    }

    const prediction: ReplicateResponse = await generateResponse.json()
    console.log('📦 MusicGen-Style prediction response:', prediction)

    const predictionId = prediction.id
    if (!predictionId) {
      console.error('❌ No prediction ID in response:', prediction)
      return new Response(
        JSON.stringify({ success: false, error: 'No valid prediction ID received from Replicate API' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      )
    }

    console.log('✅ Prediction ID received:', predictionId)
    console.log('🚀 Starting ASYNC generation - returning prediction ID for frontend polling')

    // Return prediction ID immediately for async polling
    return new Response(
      JSON.stringify({ 
        success: true, 
        predictionId: predictionId,
        status: 'processing',
        model: 'MusicGen Remixer',
        estimatedTime: '1-3 minutes (60 second duration)',
        message: 'Generation started. Use the prediction ID to check status.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Error in Edge Function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
