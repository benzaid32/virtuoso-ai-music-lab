
import { MusicGenerationService, MusicGenerationConfig, MusicGenerationResult } from './interfaces';
import { StableAudioService } from './StableAudioService';
import { MusicGenService } from './MusicGenService';

export class MusicGenerationOrchestrator {
  private services: MusicGenerationService[] = [];
  private maxRetries = 3;
  private timeout = 120000; // 2 minutes

  constructor(stableAudioKey?: string, replicateKey?: string) {
    if (stableAudioKey) {
      this.services.push(new StableAudioService(stableAudioKey));
    }
    if (replicateKey) {
      this.services.push(new MusicGenService(replicateKey));
    }
  }

  async generateMusic(config: MusicGenerationConfig): Promise<MusicGenerationResult> {
    const { prompt, duration, retryAttempts = this.maxRetries } = config;

    for (const service of this.services) {
      console.log(`Attempting generation with ${service.getName()}...`);
      
      try {
        // Check service availability first
        const isAvailable = await this.withTimeout(
          service.isAvailable(),
          5000 // 5 second timeout for availability check
        );

        if (!isAvailable) {
          console.log(`${service.getName()} is not available, trying next service...`);
          continue;
        }

        // Attempt generation with retries
        for (let attempt = 1; attempt <= retryAttempts; attempt++) {
          try {
            console.log(`${service.getName()} attempt ${attempt}/${retryAttempts}`);
            
            const audioUrl = await this.withTimeout(
              service.generateMusic(prompt, duration),
              this.timeout
            );

            return {
              success: true,
              audioUrl,
              serviceName: service.getName(),
              duration
            };
          } catch (error) {
            console.error(`${service.getName()} attempt ${attempt} failed:`, error);
            
            if (attempt === retryAttempts) {
              console.log(`${service.getName()} failed after ${retryAttempts} attempts`);
              break;
            }
            
            // Exponential backoff
            await this.delay(Math.pow(2, attempt) * 1000);
          }
        }
      } catch (error) {
        console.error(`${service.getName()} service error:`, error);
      }
    }

    return {
      success: false,
      error: 'All music generation services failed',
      serviceName: 'None',
      duration: 0
    };
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
