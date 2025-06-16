
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MusicAnalysis {
  key: string;
  mode: string;
  tempo: number;
  energy: number;
  confidence: number;
}

export const useStableAudio = () => {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const generateWithStableAudio = async (
    mode: 'solo' | 'group',
    instrument: string | null,
    groupType: string | null,
    inputAudioId: string,
    analysis: MusicAnalysis
  ) => {
    setGenerating(true);
    setProgress(0);

    try {
      // Start progress simulation
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 10, 90));
      }, 1000);

      const { data, error } = await supabase.functions.invoke('generate-music-enhanced', {
        body: {
          mode,
          instrument,
          groupType,
          inputAudioId,
          analysis
        }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Music generated successfully!",
      });

      return data;
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate music",
        variant: "destructive",
      });
      return null;
    } finally {
      setGenerating(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  return { generateWithStableAudio, generating, progress };
};
