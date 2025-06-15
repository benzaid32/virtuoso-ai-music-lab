
import { MusicGenerationService, MusicGenerationConfig, MusicGenerationResult } from './interfaces';

export class StableAudioService implements MusicGenerationService {
  private apiKey: string;
  private baseUrl = 'https://api.stability.ai/v2beta/stable-audio/generate/music';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  getName(): string {
    return 'Stable Audio';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch('https://api.stability.ai/v1/user/account', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async generateMusic(prompt: string, duration: number): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        duration,
        cfg_scale: 7,
        seed: Math.floor(Math.random() * 1000000)
      })
    });

    if (!response.ok) {
      throw new Error(`Stable Audio API error: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.audio_url) {
      throw new Error('No audio URL returned from Stable Audio');
    }

    return result.audio_url;
  }
}
