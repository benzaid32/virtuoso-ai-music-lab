
import { MusicGenerationService } from './interfaces';

export class MusicGenService implements MusicGenerationService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  getName(): string {
    return 'MusicGen';
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async generateMusic(prompt: string, duration: number): Promise<string> {
    // This service is only used in edge functions where Replicate import works
    // Client-side code should call the edge function instead
    throw new Error('MusicGenService should only be used in edge functions');
  }
}
