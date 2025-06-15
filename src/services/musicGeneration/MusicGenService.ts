
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
    const Replicate = (await import("https://esm.sh/replicate@0.25.2")).default;
    const replicate = new Replicate({ auth: this.apiKey });

    const output = await replicate.run(
      "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
      {
        input: {
          prompt,
          duration,
          model_version: "stereo-large",
          output_format: "wav",
          normalization_strategy: "loudness",
          continuation: false
        }
      }
    );

    return Array.isArray(output) ? output[0] : output;
  }
}
