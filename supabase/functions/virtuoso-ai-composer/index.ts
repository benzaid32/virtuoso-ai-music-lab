import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

/**
 * Virtuoso AI Composer - Enterprise Music Generation Service
 * This microservice focuses exclusively on music generation
 * For audio analysis, use the dedicated audio-analysis microservice
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Enterprise Music Generation Services
class EnterpriseAudioService {
  private replicateApiKey: string;

  constructor() {
    this.replicateApiKey = Deno.env.get('REPLICATE_API_KEY') || '';
  }

  // Check Replicate availability  
  async checkReplicate(): Promise<boolean> {
    if (!this.replicateApiKey) {
      console.log('⚠️ REPLICATE_API_KEY not configured');
      return false;
    }

    try {
      const response = await fetch('https://api.replicate.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.replicateApiKey}`,
        }
      });

      console.log(`📊 Replicate check: ${response.status}`);
      return response.ok;
    } catch (error) {
      console.log('❌ Replicate test failed:', error.message);
      return false;
    }
  }

  // Generate music with Replicate
  async generateWithReplicate(prompt: string, style: string): Promise<string> {
    console.log(`🎵 Generating music with Replicate...`);
    
    // Create generation task using Riffusion model
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.replicateApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "8cf61ea6c56afd61d8f5b9ffd14d7c216c0a93844ce2d82ac1c9ecc9c7f24e05",
        input: {
          prompt_a: `${style} style: ${prompt}`,
          denoising: 0.75,
          seed_image_id: "vibes"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Replicate error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (result.id) {
      // Poll for completion
      return await this.pollReplicateTask(result.id);
    }
    
    throw new Error('No task ID returned by Replicate');
  }

  // Poll Replicate task status
  async pollReplicateTask(taskId: string): Promise<string> {
    console.log(`⏳ Polling Replicate task: ${taskId}`);
    
    const maxAttempts = 30; // 5 minutes max
    const pollInterval = 10000; // 10 seconds
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${this.replicateApiKey}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to check task status: ${response.status}`);
      }

      const status = await response.json();
      console.log(`📊 Task status: ${status.status}`);

      if (status.status === 'succeeded' && status.output) {
        return status.output;
      } else if (status.status === 'failed') {
        throw new Error('Music generation failed');
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    throw new Error('Music generation timeout');
  }
}

// Main music generation handler
async function generateMusic(targetStyle: string, prompt?: string): Promise<string> {
  console.log(`🎼 Starting music generation for style: ${targetStyle}`);
  
  const audioService = new EnterpriseAudioService();
  const musicPrompt = prompt || `Professional ${targetStyle} instrumental music with high quality production`;
  
  try {
    // Use Replicate for music generation
    if (await audioService.checkReplicate()) {
      console.log('🚀 Using Replicate for music generation');
      return await audioService.generateWithReplicate(musicPrompt, targetStyle);
    }
    
    throw new Error('No music generation services available');
    
  } catch (error) {
    console.error('❌ Music generation failed:', error);
    throw error;
  }
}

// Handle HTTP requests
serve(async (req: Request) => {
  console.log('🎵 Virtuoso AI Composer - Music Generation Service');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: corsHeaders, status: 405 }
    );
  }

  try {
    // Parse request
    const requestBody = await req.json();
    const { targetStyle, prompt, audioUrl } = requestBody;

    console.log('📋 Request parameters:', { targetStyle, prompt, audioUrl: audioUrl ? 'provided' : 'none' });

    // Validate required parameters
    if (!targetStyle) {
      return new Response(
        JSON.stringify({
          error: true,
          message: 'targetStyle is required'
        }),
        { headers: corsHeaders, status: 400 }
      );
    }

    // Generate music
    console.log(`🎼 Generating ${targetStyle} music...`);
    const audioUrl_result = await generateMusic(targetStyle, prompt);

    return new Response(
      JSON.stringify({
        success: true,
        audioUrl: audioUrl_result,
        targetStyle,
        service: 'Enterprise Music Generation',
        message: 'Music generated successfully'
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('❌ Request failed:', error);
    
    return new Response(
      JSON.stringify({
        error: true,
        message: error.message || 'Music generation failed',
        service: 'Enterprise Music Generation'
      }),
      { headers: corsHeaders, status: 500 }
    );
  }
});
