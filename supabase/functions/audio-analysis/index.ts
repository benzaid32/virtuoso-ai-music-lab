import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Professional Audio Analysis Server URL (PRODUCTION ENVIRONMENT)
const PROFESSIONAL_ANALYSIS_SERVER = Deno.env.get('AUDIO_ANALYSIS_SERVER_URL') || 'https://audio-analysis.virtuoso-ai.com';

console.log('🎵 Professional Audio Analysis Edge Function initialized (PRODUCTION)');
console.log(`📡 Analysis server: ${PROFESSIONAL_ANALYSIS_SERVER}`);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Enterprise-Grade Audio Analysis Edge Function
 * Uses librosa, essentia, and aubio for perfect musical alignment
 * NO MOCK DATA, NO FALLBACKS - Production Ready
 */
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Method not allowed. Use POST.' 
      }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    console.log('🔍 Starting professional audio analysis...');
    
    // Parse the request body
    const requestBody = await req.json();
    const { audioData, audioUrl } = requestBody;
    
    let audioFile: File | undefined;
    
    if (audioData) {
      // Handle base64 encoded audio
      console.log('📥 Processing base64 audio data...');
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      audioFile = new File([bytes], 'audio.wav', { type: 'audio/wav' });
      
    } else if (audioUrl) {
      // Handle audio URL
      console.log(`📥 Fetching audio from URL: ${audioUrl}`);
      const audioResponse = await fetch(audioUrl);
      
      if (!audioResponse.ok) {
        throw new Error(`Failed to fetch audio: ${audioResponse.status}`);
      }
      
      const audioBlob = await audioResponse.blob();
      audioFile = new File([audioBlob], 'audio.wav', { type: 'audio/wav' });
      
    } else {
      throw new Error('Either audioData or audioUrl must be provided');
    }

    console.log(`🎧 Audio file prepared: ${audioFile.size} bytes`);

    // Forward to professional analysis server
    console.log(`🚀 Forwarding to professional analysis server: ${PROFESSIONAL_ANALYSIS_SERVER}/analyze`);
    
    const formData = new FormData();
    formData.append('audio', audioFile);
    
    const analysisResponse = await fetch(`${PROFESSIONAL_ANALYSIS_SERVER}/analyze`, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type, let browser set it for FormData
      }
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error(`❌ Professional analysis failed: ${analysisResponse.status} - ${errorText}`);
      throw new Error(`Professional analysis server returned ${analysisResponse.status}: ${errorText}`);
    }

    const analysisResult = await analysisResponse.json();
    
    console.log('✅ Professional analysis completed:', {
      tempo: analysisResult.analysis?.tempo,
      key: analysisResult.analysis?.key,
      scale: analysisResult.analysis?.scale,
      confidence: analysisResult.analysis?.confidence
    });

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisResult.analysis,
        service: "Professional Audio Analysis (librosa + essentia + aubio)",
        message: "Enterprise-grade audio analysis completed"
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Professional analysis error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: `Analysis failed: ${error.message}`,
        service: "Professional Audio Analysis",
        message: "Error: Professional audio analysis service unavailable"
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
