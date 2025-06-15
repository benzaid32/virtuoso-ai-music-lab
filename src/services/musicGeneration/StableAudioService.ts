
import { MusicGenerationService } from './interfaces';

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
    if (!this.apiKey) return false;
    
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
    if (!this.apiKey) {
      throw new Error('Stable Audio API key not configured');
    }

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
      const errorText = await response.text();
      throw new Error(`Stable Audio API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.audio_url) {
      throw new Error('No audio URL returned from Stable Audio API');
    }

    return result.audio_url;
  }
}
