
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { MusicAnalysis } from './useMusicAnalysis';
import { Instrument, Group, Mode } from '../pages/Index';

export const useStableAudio = () => {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  const generateWithStableAudio = async (
    mode: Mode,
    instrument: Instrument | null,
    group: Group | null,
    inputAudioId: string,
    musicAnalysis: MusicAnalysis
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
    setProgress('Creating project...');
    let projectId: string | null = null;

    try {
      // Create project record
      const { data: project, error: projectError } = await supabase
        .from('music_projects')
        .insert({
          user_id: user.id,
          name: `AI ${mode} - ${instrument || group} (${musicAnalysis.key} ${musicAnalysis.mode})`,
          mode,
          instrument,
          group_type: group,
          status: 'processing',
          input_audio_id: inputAudioId,
          generation_settings: {
            mode,
            instrument,
            group_type: group,
            detected_key: musicAnalysis.key,
            detected_tempo: musicAnalysis.tempo,
            detected_energy: musicAnalysis.energy,
            detected_mode: musicAnalysis.mode,
            confidence: musicAnalysis.confidence,
            timestamp: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (projectError) throw projectError;
      projectId = project.id;

      setProgress('Generating AI music based on analysis...');
      console.log('Calling enhanced music generation...');

      // Call our enhanced music generation edge function
      const { data, error } = await supabase.functions.invoke('generate-music-enhanced', {
        body: {
          projectId: project.id,
          mode,
          instrument,
          group,
          inputAudioId,
          musicAnalysis
        }
      });

      if (error) {
        console.error('Generation error:', error);
        throw new Error(error.message || 'Music generation failed');
      }

      if (!data.success) {
        throw new Error(data.error || 'Music generation failed');
      }

      setProgress('AI music generation completed!');
      
      toast({
        title: "Success",
        description: `Your AI-generated ${mode} in ${musicAnalysis.key} ${musicAnalysis.mode} is ready!`,
      });

      return {
        projectId: data.projectId,
        outputAudioId: data.outputAudioId,
        audioUrl: data.audioUrl
      };
    } catch (error: any) {
      console.error('Enhanced generation error:', error);
      
      if (projectId) {
        await supabase
          .from('music_projects')
          .update({ status: 'failed' })
          .eq('id', projectId);
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

  return { generateWithStableAudio, generating, progress };
};
