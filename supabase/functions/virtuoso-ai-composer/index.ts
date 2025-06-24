// Follow the official Supabase CORS pattern exactly
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
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 405 
        }
      )
    }

    const { prompt, targetStyle, analysis }: GenerationRequest = await req.json()
    console.log('🎵 Generation request:', { prompt, targetStyle, analysis })

    const UDIO_API_KEY = Deno.env.get('UDIO_API_KEY')
    if (!UDIO_API_KEY) {
      throw new Error('UDIO_API_KEY not configured')
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
      throw new Error(`Generation failed: ${generateResponse.status} - ${errorText}`)
    }

    const task: UdioGenerateResponse = await generateResponse.json()
    console.log('📦 Task response:', task)
    
    const workId = task.workId || task.id || task.task_id || task.data?.id
    if (!workId) {
      console.error('❌ No workId in response:', task)
      throw new Error('No valid workId received from Udio API')
    }

    console.log('✅ Work ID received:', workId)

    // Poll for completion
    console.log('⏳ Starting polling for completion...')
    const maxAttempts = 60
    const pollInterval = 10000 // 10 seconds

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`⏳ Polling attempt ${attempt}/${maxAttempts}`)
      
      await new Promise(resolve => setTimeout(resolve, pollInterval))
      
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
      console.log('📋 Polling result:', result)

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
        throw new Error('Music generation failed')
      }
    }

    throw new Error('Polling timeout - music generation took too long')

  } catch (error) {
    console.error('❌ Edge Function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
