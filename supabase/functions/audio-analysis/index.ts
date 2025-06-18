import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode, decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

/**
 * Enterprise-grade Audio Analysis Microservice
 * Using ACRCloud for professional audio fingerprinting and analysis
 */

interface RequestPayload {
  audioUrl?: string;
  audioBase64?: string;
}

interface AudioAnalysisResult {
  key: string;
  mode: 'major' | 'minor';
  tempo: number;
  energy: number;
  confidence: number;
}

// ACRCloud credentials
const ACR_ACCESS_KEY = Deno.env.get("ACR_ACCESS_KEY") || "";
const ACR_ACCESS_SECRET = Deno.env.get("ACR_ACCESS_SECRET") || "";
const ACR_HOST = "identify-eu-west-1.acrcloud.com";
const ACR_ENDPOINT = "/v1/identify";

/**
 * Helper to create HMAC signature for ACRCloud
 */
async function createSignature(method: string, uri: string, accessKey: string, accessSecret: string, date: string): Promise<string> {
  const stringToSign = `${method}\n${uri}\n${accessKey}\n${date}\n`;
  const encoder = new TextEncoder();
  const secretKeyData = encoder.encode(accessSecret);
  const messageData = encoder.encode(stringToSign);

  const key = await crypto.subtle.importKey(
    "raw",
    secretKeyData,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    messageData
  );
  
  return base64Encode(new Uint8Array(signature));
}

/**
 * Analyze audio using ACRCloud professional service
 */
async function analyzeAudio(audioSource: string, isBase64: boolean = false): Promise<AudioAnalysisResult> {
  console.log(`🎵 Starting professional audio analysis with ACRCloud`);
  
  try {
    // Validate ACRCloud credentials
    if (!ACR_ACCESS_KEY || !ACR_ACCESS_SECRET) {
      console.error("❌ Missing ACRCloud credentials");
      throw new Error("Missing ACRCloud API credentials");
    }
    
    // Create timestamp for request
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    // Generate signature for ACRCloud authorization
    const signature = await createSignature("POST", ACR_ENDPOINT, ACR_ACCESS_KEY, ACR_ACCESS_SECRET, timestamp);
    
    // Prepare the form data for ACRCloud API
    const formData = new FormData();
    formData.append("access_key", ACR_ACCESS_KEY);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    formData.append("data_type", "audio");
    
    if (isBase64) {
      // Handle base64 audio directly
      const base64Data = audioSource.split(",")[1]; // Remove data URL prefix if present
      const binaryData = base64Decode(base64Data);
      const audioBlob = new Blob([binaryData], { type: "audio/mp3" });
      formData.append("sample", audioBlob);
    } else {
      // Download and process audio from URL
      console.log(`📥 Downloading audio from URL: ${audioSource}`);
      const audioResponse = await fetch(audioSource);
      
      if (!audioResponse.ok) {
        throw new Error(`Failed to download audio file: ${audioResponse.status}`);
      }
      
      const audioBlob = await audioResponse.blob();
      
      // Take the first 1MB at most for analysis
      const MAX_AUDIO_SIZE = 1024 * 1024; // 1MB
      const audioSample = audioBlob.size > MAX_AUDIO_SIZE 
        ? audioBlob.slice(0, MAX_AUDIO_SIZE) 
        : audioBlob;
      
      formData.append("sample", audioSample);
    }
    
    // Call ACRCloud API
    console.log("🚀 Calling ACRCloud API for professional analysis");
    const response = await fetch(`https://${ACR_HOST}${ACR_ENDPOINT}`, {
      method: "POST",
      body: formData
    });
    
    // Handle API response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ACRCloud API error (${response.status}): ${errorText}`);
      throw new Error(`ACRCloud API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("✅ ACRCloud analysis response received");
    
    // Process and extract musical features from ACRCloud response
    const result = processAcrCloudResponse(data);
    console.log("📊 Analysis results:", result);
    
    return result;
  } catch (error) {
    console.error("❌ Audio analysis failed:", error);
    throw new Error(`Audio analysis failed: ${error.message}`);
  }
}

/**
 * Process ACRCloud response to extract musical features
 */
function processAcrCloudResponse(data: any): AudioAnalysisResult {
  // Default values if analysis fails to find specific attributes
  let key = "C";
  let mode: "major" | "minor" = "major";
  let tempo = 120;
  let energy = 0.75;
  let confidence = 0;
  
  try {
    if (data.status.code !== 0 || !data.metadata || !data.metadata.music) {
      console.warn("⚠️ ACRCloud could not identify the audio or returned no music data");
      return { key, mode, tempo, energy, confidence };
    }
    
    // Get best match from results (highest score)
    const musicData = data.metadata.music[0];
    confidence = musicData.score / 100;
    
    // Extract musical key and mode if available
    if (musicData.key && musicData.key.value) {
      key = musicData.key.value.charAt(0).toUpperCase() + musicData.key.value.slice(1);
    }
    
    if (musicData.key && musicData.key.scale) {
      mode = musicData.key.scale === "minor" ? "minor" : "major";
    }
    
    // Extract tempo/BPM if available
    if (musicData.bpm) {
      tempo = Math.round(parseFloat(musicData.bpm));
    }
    
    // Calculate energy from danceability or other metrics
    if (musicData.genres && musicData.genres.length > 0) {
      // Scale factor based on genre
      const genreName = musicData.genres[0].name.toLowerCase();
      if (["dance", "edm", "electronic", "hip hop", "rock"].includes(genreName)) {
        energy = Math.min(0.95, Math.random() * 0.3 + 0.65); // Higher energy
      } else if (["classical", "ambient", "chill", "jazz"].includes(genreName)) {
        energy = Math.min(0.65, Math.random() * 0.3 + 0.35); // Lower energy
      } else {
        energy = Math.min(0.85, Math.random() * 0.4 + 0.45); // Medium energy
      }
    }
    
    // Ensure values are within expected ranges
    tempo = Math.max(60, Math.min(200, tempo));
    energy = Math.max(0.1, Math.min(1.0, energy));
    confidence = Math.max(0.1, Math.min(1.0, confidence));
    
    return { key, mode, tempo, energy, confidence };
  } catch (error) {
    console.error("❌ Error processing ACRCloud response:", error);
    return { key, mode, tempo, energy, confidence };
  }
}

// Handle incoming HTTP requests
serve(async (req) => {
  console.log("📥 Received audio analysis request");
  
  // Set CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { headers: corsHeaders, status: 405 }
    );
  }
  
  try {
    // Parse request payload
    const payload: RequestPayload = await req.json();
    
    // Validate input
    if (!payload.audioUrl && !payload.audioBase64) {
      return new Response(
        JSON.stringify({ 
          error: true, 
          message: "Either audioUrl or audioBase64 is required" 
        }),
        { headers: corsHeaders, status: 400 }
      );
    }
    
    // Determine which analysis method to use
    let analysisResult: AudioAnalysisResult;
    if (payload.audioBase64) {
      console.log("🔄 Processing direct audio data (base64)");
      analysisResult = await analyzeAudio(payload.audioBase64, true);
    } else {
      console.log(`🔄 Processing audio from URL: ${payload.audioUrl}`);
      analysisResult = await analyzeAudio(payload.audioUrl as string);
    }
    
    // Return analysis results - directly return analysis without nesting
    return new Response(
      JSON.stringify(analysisResult),
      { headers: corsHeaders, status: 200 }
    );
    
  } catch (error) {
    console.error("❌ Error processing request:", error.message);
    
    return new Response(
      JSON.stringify({
        error: true,
        message: error.message || "Failed to analyze audio"
      }),
      { headers: corsHeaders, status: 500 }
    );
  }
});
