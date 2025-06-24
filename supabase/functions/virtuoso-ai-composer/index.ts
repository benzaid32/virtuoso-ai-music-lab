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
  };
}

interface UdioGenerateResponse {
  workId?: string;
  id?: string;
  task_id?: string;
  data?: {
    id?: string;
  };
}

interface UdioFeedResponse {
  code: number;
  message: string;
  data: {
    type: string;
    response_data?: Array<{
      audio_url: string;
      id: string;
      status: string;
    }>;
  };
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

  try {
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

    console.log('✅ POST request received, parsing JSON...')
    const body = await req.json()
    console.log('📨 Request body:', JSON.stringify(body))

    const { prompt, targetStyle, analysis, workId: existingWorkId } = body

    // If workId is provided, check status instead of creating new generation
    if (existingWorkId) {
      console.log('🔍 Checking status for existing workId:', existingWorkId)
      
      const pollResponse = await fetch(`https://udioapi.pro/api/v2/feed?workId=${existingWorkId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('UDIO_API_KEY')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!pollResponse.ok) {
        console.error(`❌ Status check failed: ${pollResponse.status}`)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to check generation status',
            workId: existingWorkId
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 500 
          }
        )
      }

      const result: UdioFeedResponse = await pollResponse.json()
      console.log('📋 Status check result:', JSON.stringify(result))

      if (result.data?.type === 'SUCCESS' && result.data.response_data?.length) {
        const audioUrl = result.data.response_data[0].audio_url
        console.log('🎉 Music generation completed! Audio URL:', audioUrl)
        
        return new Response(
          JSON.stringify({
            success: true,
            audioUrl,
            targetStyle,
            service: 'Udio API',
            message: 'Music generated successfully'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      
      if (result.data?.type === 'FAILED') {
        console.error('❌ Music generation failed for existing workId')
        return new Response(
          JSON.stringify({ success: false, error: 'Music generation failed' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 500 
          }
        )
      }

      console.log('⏳ Generation still in progress for existing workId')
      console.log('📋 Status check result:', JSON.stringify(result))
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Generation still in progress',
          workId: existingWorkId,
          message: 'Music generation is still processing. Please try again in a few moments.'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 202
        }
      )
    }

    // 🚨 CRITICAL: If workId was provided, we should NEVER create a new generation
    // This prevents charging credits when just checking status
    if (existingWorkId) {
      console.error('❌ WorkId provided but generation not found or failed')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Generation not found or failed',
          workId: existingWorkId,
          message: 'The generation with this workId was not found or has failed. Please start a new generation.'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 404
        }
      )
    }

    // Validate required fields for new generation
    if (!prompt || !targetStyle) {
      console.error('❌ Missing required fields')
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: prompt and targetStyle' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      )
    }

    console.log('🎵 Starting NEW music generation...')
    console.log('🎯 Target style:', targetStyle)
    console.log('🎼 Prompt:', prompt)

    const UDIO_API_KEY = Deno.env.get('UDIO_API_KEY')
    if (!UDIO_API_KEY) {
      console.error('❌ UDIO_API_KEY not configured')
      return new Response(
        JSON.stringify({ success: false, error: 'UDIO_API_KEY not configured' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      )
    }

    // Call Udio API to generate music
    console.log('🚀 Calling Udio API generate endpoint...')
    const generateResponse = await fetch('https://udioapi.pro/api/v2/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UDIO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gpt_description_prompt: prompt,
        make_instrumental: true,
        model: 'chirp-v3-5'
      })
    })

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text()
      console.error('❌ Udio generate failed:', generateResponse.status, errorText)
      return new Response(
        JSON.stringify({ success: false, error: `Generation failed: ${generateResponse.status} - ${errorText}` }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      )
    }

    const task: UdioGenerateResponse = await generateResponse.json()
    console.log('📦 Task response:', task)
    
    const workId = task.workId || task.id || task.task_id || task.data?.id
    if (!workId) {
      console.error('❌ No workId in response:', task)
      return new Response(
        JSON.stringify({ success: false, error: 'No valid workId received from Udio API' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      )
    }

    console.log('✅ Work ID received:', workId)

    // Poll for completion with optimized settings for Edge Function limits
    console.log('⏳ Starting polling for completion...')
    const maxAttempts = 20  // Reduced from 60 to fit within Edge Function timeout
    const pollInterval = 5000 // Reduced to 5 seconds from 10 seconds

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`⏳ Polling attempt ${attempt}/${maxAttempts}`)
      
      // Start polling immediately on first attempt, then wait
      if (attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, pollInterval))
      }
      
      const pollResponse = await fetch(`https://udioapi.pro/api/v2/feed?workId=${workId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${UDIO_API_KEY}`,
          'Content-Type': 'application/json'
        }
      })

      if (!pollResponse.ok) {
        console.error(`❌ Polling failed: ${pollResponse.status}`)
        continue
      }

      const result: UdioFeedResponse = await pollResponse.json()
      console.log('📋 Polling result:', JSON.stringify(result))

      if (result.data?.type === 'SUCCESS' && result.data.response_data?.length) {
        const audioUrl = result.data.response_data[0].audio_url
        console.log('🎉 Music generated successfully! Audio URL:', audioUrl)
        
        return new Response(
          JSON.stringify({
            success: true,
            audioUrl,
            targetStyle,
            service: 'Udio API',
            message: 'Music generated successfully'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      
      if (result.data?.type === 'FAILED') {
        console.error('❌ Music generation failed')
        return new Response(
          JSON.stringify({ success: false, error: 'Music generation failed' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 500 
          }
        )
      }

      // If we're getting close to Edge Function timeout, return work ID for frontend polling
      if (attempt >= 15) {
        console.log('⚠️ Approaching Edge Function timeout, returning workId for frontend polling')
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Generation in progress - please try again in a few moments',
            workId,
            message: 'Music generation is still processing. This usually takes 2-3 minutes.'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 202 // Accepted but processing
          }
        )
      }
    }

    console.error('❌ Polling timeout within Edge Function limits')
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Generation timeout - please try again',
        workId,
        message: 'Music generation is taking longer than expected. Please try again in a few minutes.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 202 
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
