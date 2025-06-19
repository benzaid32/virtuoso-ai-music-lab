import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Enterprise Audio Analysis Server URL on EC2
const PROFESSIONAL_ANALYSIS_SERVER = Deno.env.get('AUDIO_ANALYSIS_SERVER_URL');

console.log('🎵 Professional Audio Analysis Edge Function initialized (ENTERPRISE PRODUCTION)');
console.log(`📡 EC2 Analysis server: ${PROFESSIONAL_ANALYSIS_SERVER}`);

// Validate server URL is configured - fail immediately if not set
if (!PROFESSIONAL_ANALYSIS_SERVER) {
  console.error('❌ CRITICAL ERROR: AUDIO_ANALYSIS_SERVER_URL environment variable not set!');
  console.error('❌ Enterprise audio analysis requires a valid EC2 server URL');
}

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
    
    // Enterprise-grade parameter handling with backward compatibility
    // Accept both audioBase64 (from frontend) and audioData (standard API)
    const audioData = requestBody.audioData || requestBody.audioBase64;
    const { audioUrl } = requestBody;
    
    console.log(`📦 Request parameters: audioData=${!!audioData}, audioUrl=${!!audioUrl}`);
    
    let audioFile: File | undefined;
    
    if (audioData) {
      // Handle base64 encoded audio (support both data URL and pure base64)
      console.log('📥 Processing base64 audio data...');
      
      // Extract base64 data from data URL if present
      let base64Data = audioData;
      if (audioData.includes(',')) {
        // Data URL format: "data:audio/mp3;base64,ABC123..."
        base64Data = audioData.split(',')[1];
        console.log('🔧 Extracted base64 from data URL format');
      }
      
      try {
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Extract file extension from data URL if available
        let mimeType = 'audio/wav';
        if (audioData.includes('data:')) {
          const mimeMatch = audioData.match(/data:([^;]+)/);
          if (mimeMatch) {
            mimeType = mimeMatch[1];
            console.log(`🎵 Detected MIME type: ${mimeType}`);
          }
        }
        
        audioFile = new File([bytes], 'audio.wav', { type: mimeType });
        
      } catch (decodeError) {
        console.error('❌ Base64 decode error:', decodeError);
        throw new Error(`Invalid base64 audio data: ${decodeError.message}`);
      }
      
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
      throw new Error('Either audioData/audioBase64 or audioUrl must be provided');
    }

    console.log(`🎧 Audio file prepared: ${audioFile.size} bytes`);

    // Forward to professional analysis server
    console.log(`🚀 Forwarding to EC2 analysis server: ${PROFESSIONAL_ANALYSIS_SERVER}/analyze`);
    
    // Add request timestamp for performance monitoring
    const requestStartTime = Date.now();
    
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
    
    // Calculate processing time for monitoring
    const processingTime = (Date.now() - requestStartTime) / 1000;
    
    console.log(`✅ EC2 analysis completed in ${processingTime.toFixed(2)}s:`, {
      tempo: analysisResult.analysis?.tempo,
      key: analysisResult.analysis?.key,
      scale: analysisResult.analysis?.scale,
      confidence: analysisResult.analysis?.confidence,
      energy: analysisResult.analysis?.energy,
      duration: analysisResult.analysis?.duration
    });

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisResult.analysis,
        service: "Enterprise Audio Analysis (EC2)",
        processingTime: processingTime.toFixed(2),
        message: "Enterprise-grade audio analysis completed"
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ EC2 analysis error:', error);
    
    // Include server URL in logs (but sanitize for security)
    const serverUrlParts = PROFESSIONAL_ANALYSIS_SERVER ? new URL(PROFESSIONAL_ANALYSIS_SERVER).hostname : 'undefined';
    console.error(`Failed to connect to EC2 server: ${serverUrlParts}`);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: `Analysis failed: ${error.message}`,
        service: "Enterprise Audio Analysis (EC2)",
        message: "Error: EC2 audio analysis service unavailable"
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
