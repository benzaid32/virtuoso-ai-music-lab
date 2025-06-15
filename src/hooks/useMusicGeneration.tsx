
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { Instrument, Group, Mode } from '../pages/Index';

export const useMusicGeneration = () => {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
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
    setProgress('Preparing music generation...');

    try {
      // Create project record
      setProgress('Creating project...');
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

      setProgress('Generating music with AI...');
      console.log('Calling music generation function...');

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

      if (error) {
        console.error('Function invocation error:', error);
        throw new Error(error.message || 'Music generation failed');
      }

      console.log('Generation response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Music generation failed');
      }

      setProgress('Music generation completed!');
      
      toast({
        title: "Success",
        description: "Your AI-generated music is ready!",
      });

      return {
        projectId: data.projectId,
        outputAudioId: data.outputAudioId,
        audioUrl: data.audioUrl
      };
    } catch (error: any) {
      console.error('Generation error:', error);
      
      // Update project status to failed
      if (project?.id) {
        await supabase
          .from('music_projects')
          .update({ status: 'failed' })
          .eq('id', project.id);
      }

      toast({
        title: "Generation failed",
        description: error.message || 'An error occurred during music generation',
        variant: "destructive",
      });
      return null;
    } finally {
      setGenerating(false);
      setProgress('');
    }
  };

  return { generateMusic, generating, progress };
};
