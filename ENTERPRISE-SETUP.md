# Virtuoso AI Music Lab - Enterprise Setup Guide

## Overview

Virtuoso AI Music Lab is an enterprise-grade AI music style transformation platform. This guide covers the professional API integrations and setup required for production use.

## Enterprise API Integrations

### 1. Music Generation: MusicAPI.ai

- **Primary API**: MusicAPI.ai Professional Audio Transformation
- **Endpoint**: `https://api.musicapi.ai/v1/music/generate`
- **Features**: 
  - Audio-to-audio style transfer
  - High-quality Sonic model
  - Commercial licensing included
  - Enterprise-grade reliability
- **Setup**: Add `MUSICAPI_AI_KEY` to Supabase secrets

### 2. Audio Analysis: ACRCloud

- **Professional API**: ACRCloud Audio Recognition
- **Features**:
  - Music key detection
  - Tempo/BPM analysis
  - Energy calculation
  - Audio fingerprinting
  - Industry-standard accuracy
- **Setup**: Add `ACR_ACCESS_KEY` and `ACR_ACCESS_SECRET` to Supabase secrets (Already configured)

## Deployment Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   React     │      │Supabase Functions │      │Enterprise APIs  │
│  Frontend   │─────▶│ Edge Function    │─────▶│  - ACRCloud     │
│             │      │                  │      │  - MusicAPI.ai   │
└─────────────┘      └──────────────────┘      └─────────────────┘
```

- **Edge Function URL**: `https://qxomxsjmmaktavblimfz.functions.supabase.co/virtuoso-ai-composer`
- **Production Deployment**: All components are production-ready

## API Keys and Environment Setup

### Supabase Edge Function Secrets

Set the following secrets using the Supabase CLI:

```bash
# MusicAPI.ai for music generation
npx supabase secrets set MUSICAPI_AI_KEY=your-music-api-key

# ACRCloud for professional audio analysis
npx supabase secrets set ACR_ACCESS_KEY=
npx supabase secrets set ACR_ACCESS_SECRET=OAQgl5tkcwXcRe0pS4QjMTkaBdaZgYu

# Replicate for fallback music generation (optional)
npx supabase secrets set REPLICATE_API_KEY=your-replicate-key
```

### Frontend Environment Variables

Create a `.env` file from the template:

```bash
cp .env.template .env
```

Then update the values with your Supabase project information.

## Testing the Enterprise Setup

### Audio Analysis Testing

```bash
# Test ACRCloud audio analysis
curl -X POST https://qxomxsjmmaktavblimfz.functions.supabase.co/virtuoso-ai-composer \
  -H "Content-Type: application/json" \
  -d '{"audioUrl": "https://example.com/audio-sample.mp3", "targetStyle": "analysis"}'
```

Expected response:

```json
{
  "success": true,
  "analysis": {
    "key": "C",
    "mode": "major",
    "tempo": 120,
    "energy": 0.75,
    "confidence": 0.92
  }
}
```

### Music Generation Testing

```bash
# Test MusicAPI.ai music generation
curl -X POST https://qxomxsjmmaktavblimfz.functions.supabase.co/virtuoso-ai-composer \
  -H "Content-Type: application/json" \
  -d '{"audioUrl": "https://example.com/audio-sample.mp3", "targetStyle": "jazz"}'
```

Expected response:

```json
{
  "success": true,
  "generatedAudioUrl": "https://storage.example.com/generated-music.mp3",
  "analysis": {
    "key": "D",
    "mode": "minor",
    "tempo": 95,
    "energy": 0.65,
    "confidence": 0.89
  }
}
```

## Error Handling and Monitoring

- Enterprise-grade error handling implemented throughout the stack
- Detailed logging with meaningful error codes
- Rate limiting for security and cost control
- Automatic temporary file cleanup
- Error telemetry for monitoring and alerting

## Cost Estimation

- **ACRCloud**: Europe Free Trial (14 days), then based on API usage
- **MusicAPI.ai**: Based on generation minutes
- **Supabase Edge Functions**: Included in Supabase Pro plan

## Maintenance and Updates

Update the Edge Function:

```bash
npx supabase functions deploy virtuoso-ai-composer
```

## Enterprise Support

For enterprise support inquiries, contact:

- Technical support: support@example.com
- API access issues: api@example.com
