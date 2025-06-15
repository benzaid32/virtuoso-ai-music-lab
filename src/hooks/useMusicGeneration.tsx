
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { Instrument, Group, Mode } from '../pages/Index';

export const useMusicGeneration = () => {
  const [generating, setGenerating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const generateMusic = async (
    mode: Mode,
    instrument: Instrument | null,
    group: Group | null,
    inputAudioId: string
  ) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to generate music",
        variant: "destructive",
      });
      return null;
    }

    setGenerating(true);

    try {
      // Create project record
      const { data: project, error: projectError } = await supabase
        .from('music_projects')
        .insert({
          user_id: user.id,
          name: `Generated ${mode} - ${instrument || group}`,
          mode,
          instrument,
          group_type: group,
          status: 'processing',
          input_audio_id: inputAudioId,
          generation_settings: {
            mode,
            instrument,
            group_type: group,
            timestamp: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Call music generation edge function
      const { data, error } = await supabase.functions.invoke('generate-music', {
        body: {
          projectId: project.id,
          mode,
          instrument,
          group,
          inputAudioId
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Music generation started successfully!",
      });

      return data;
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setGenerating(false);
    }
  };

  return { generateMusic, generating };
};
