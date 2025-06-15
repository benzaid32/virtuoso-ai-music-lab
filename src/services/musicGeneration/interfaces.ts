
export interface MusicGenerationService {
  generateMusic(prompt: string, duration: number): Promise<string>;
  isAvailable(): Promise<boolean>;
  getName(): string;
}

export interface MusicGenerationConfig {
  prompt: string;
  duration: number;
  retryAttempts: number;
  timeout: number;
}

export interface MusicGenerationResult {
  success: boolean;
  audioUrl?: string;
  error?: string;
  serviceName: string;
  duration: number;
}
