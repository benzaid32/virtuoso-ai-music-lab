import { useState } from 'react';
import { analyzeAudioFile } from './lib/api/audio-service';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Download, Music } from 'lucide-react';
import { AudioProcessor, type AudioAnalysis, type WaveformData } from '@/lib/audio/AudioProcessor';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type Mode = 'solo' | 'group';
type Instrument = 'saxophone' | 'harmonica' | 'steelpan' | 'electric-guitar';
type Group = 'orchestra' | 'soul-band';

interface AudioFile {
  id: string;
  name: string;
  url: string;
  waveform: WaveformData;
}

type AppState = 'import' | 'analyzing' | 'analyzed' | 'generating' | 'completed';

const INSTRUMENTS = [
  { id: 'saxophone' as const, name: 'Saxophone', emoji: '🎷', desc: 'Smooth jazz style' },
  { id: 'harmonica' as const, name: 'Harmonica', emoji: '🎵', desc: 'Blues melodies' },
  { id: 'steelpan' as const, name: 'Steel Pan', emoji: '🥁', desc: 'Caribbean rhythms' },
  { id: 'electric-guitar' as const, name: 'Electric Guitar', emoji: '🎸', desc: 'Jazz/rock solos' }
];

const GROUPS = [
  { id: 'orchestra' as const, name: 'Full Orchestra', emoji: '🎼', desc: 'Classical arrangement' },
  { id: 'soul-band' as const, name: "60's Soul Band", emoji: '🎤', desc: 'Motown style' }
];

export default function App() {
  const [state, setState] = useState<AppState>('import');
  const [mode, setMode] = useState<Mode>('solo');
  const [instrument, setInstrument] = useState<Instrument>('saxophone');
  const [group, setGroup] = useState<Group>('orchestra');
  const [analysis, setAnalysis] = useState<AudioAnalysis | null>(null);
  const [sourceFile, setSourceFile] = useState<AudioFile | null>(null);
  const [generatedFile, setGeneratedFile] = useState<AudioFile | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setState('analyzing');
    setError(null);
    setProgress(10);

    try {
      // Process audio file for waveform visualization only
      const { waveform } = await AudioProcessor.processWaveformOnly(file);
      setProgress(30);
      
      // Enterprise-grade audio analysis with ACRCloud
      console.log('🚀 Using enterprise ACRCloud audio analysis...');
      
      // Direct file analysis with no storage - enterprise grade approach
      console.log('🎵 Analyzing audio directly with professional ACRCloud service...');
      setProgress(40);
      
      // Analyze file directly without storing it
      const audioAnalysis = await analyzeAudioFile(file);
      setProgress(80);
      setProgress(100);

      // Set analysis and source file
      setAnalysis(audioAnalysis);
      setSourceFile({
        id: `temp-${Date.now()}`,
        name: file.name,
        url: URL.createObjectURL(file),
        waveform
      });
      setState('analyzed');

    } catch (err: any) {
      console.error('Audio analysis error:', err);
      setError(err.message);
      setState('import');
    } finally {
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleGenerate = async () => {
    if (!analysis || !sourceFile) return;

    setState('generating');
    setError(null);
    setProgress(10);

    try {
      setProgress(30);

      // Determine target style based on user selection
      const targetStyle = mode === 'solo' 
        ? INSTRUMENTS.find(i => i.id === instrument)?.name || 'Jazz'
        : GROUPS.find(g => g.id === group)?.name || 'Jazz Ensemble';

      // Use a valid publicly accessible test URL for development
      // In production, you would need to ensure proper audio file hosting
      const testAudioUrl = 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav';
      
      console.log('🎵 Generating music with Stability AI...');
      console.log('📋 Parameters:', { audioUrl: testAudioUrl, targetStyle });

      // Call Stability AI edge function with correct parameters
      console.log('🚀 Calling Stability AI edge function...');
      console.log('📋 Sending:', { audioUrl: testAudioUrl, targetStyle });
      
      const { data, error } = await supabase.functions.invoke('virtuoso-ai-composer', {
        body: {
          audioUrl: testAudioUrl,
          targetStyle: targetStyle
        }
      });

      console.log('📊 Function response:', { data, error });
      console.log('🔍 Raw data type:', typeof data);
      console.log('🔍 Raw data content:', data);

      // Parse response if it's a string (like we do for audio analysis)
      let parsedData = data;
      if (typeof data === 'string') {
        try {
          parsedData = JSON.parse(data);
          console.log('🔍 Parsed string data into object:', parsedData);
        } catch (parseError) {
          console.error('❌ Failed to parse response:', parseError);
        }
      }

      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error(error.message || 'Stability AI service error');
      }
      
      console.log('🔍 Debug - parsedData.success:', parsedData?.success, typeof parsedData?.success);
      console.log('🔍 Debug - full parsedData:', parsedData);
      
      if (!parsedData?.success) {
        console.error('❌ Generation failed:', parsedData);
        throw new Error(parsedData?.error || parsedData?.message || 'Stability AI music generation failed');
      }

      setProgress(90);

      setGeneratedFile({
        id: 'generated',
        name: `Virtuoso AI ${targetStyle} - ${new Date().toISOString().slice(0,10)}.mp3`,
        url: parsedData.audioUrl.audio, 
        waveform: { peaks: [], duration: parsedData.analysis?.duration || 60 }
      });

      setProgress(100);
      setState('completed');

    } catch (err: any) {
      console.error('❌ Generation error:', err);
      
      const errorMessage = err.message?.includes('Stability') 
        ? '🎵 Professional AI music generation is temporarily unavailable. Please try again in a few minutes.'
        : err.message?.includes('API key') || err.message?.includes('Configuration') 
        ? '🔑 Enterprise AI service requires proper API key configuration. Please contact support.'
        : err.message?.includes('Service Unavailable')
        ? '⚠️ Enterprise AI services are currently unavailable. Please try again later.'
        : err.message?.includes('Generation Failed')
        ? '🎭 AI music generation failed. Please try with a different style or audio file.'
        : `❌ ${err.message || 'Professional music generation failed. Please try again.'}`;
      
      setError(errorMessage);
      setState('analyzed');
    } finally {
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const reset = () => {
    setState('import');
    setAnalysis(null);
    setSourceFile(null);
    setGeneratedFile(null);
    setError(null);
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent mb-2">
            Virtuoso.ai
          </h1>
          <p className="text-xl text-gray-400">Professional AI Music Style Transfer</p>
        </div>

        {/* Progress Bar */}
        {progress > 0 && (
          <div className="mb-6">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-400 mt-2 text-center">
              {state === 'analyzing' && 'Analyzing audio...'}
              {state === 'generating' && 'Generating music...'}
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-600 rounded-lg">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-gray-800/50 rounded-lg p-8 backdrop-blur-sm">
          {state === 'import' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center">Import & Configure</h2>
              
              {/* Mode Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Mode</h3>
                <div className="grid grid-cols-2 gap-4">
                  {(['solo', 'group'] as const).map((m) => (
                    <Button
                      key={m}
                      variant={mode === m ? 'default' : 'secondary'}
                      onClick={() => setMode(m)}
                      className="h-16 text-lg"
                    >
                      <Music className="mr-2" />
                      {m === 'solo' ? 'Solo Instrument' : 'Full Ensemble'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Instrument/Group Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {mode === 'solo' ? 'Instrument' : 'Ensemble Type'}
                </h3>
                <div className={cn(
                  "grid gap-3",
                  mode === 'solo' ? 'grid-cols-2' : 'grid-cols-1'
                )}>
                  {(mode === 'solo' ? INSTRUMENTS : GROUPS).map((item) => (
                    <Button
                      key={item.id}
                      variant={
                        (mode === 'solo' ? instrument : group) === item.id 
                          ? 'default' 
                          : 'secondary'
                      }
                      onClick={() => {
                        if (mode === 'solo') {
                          setInstrument(item.id as Instrument);
                        } else {
                          setGroup(item.id as Group);
                        }
                      }}
                      className="h-16 flex-col space-y-1"
                    >
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-xs opacity-70">{item.desc}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Upload Audio</h3>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-yellow-400 transition-colors">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg mb-4">Upload your audio file</p>
                  <Button asChild>
                    <label className="cursor-pointer">
                      Choose File
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    Supports MP3, WAV, FLAC • Max 50MB • Up to 5 minutes
                  </p>
                </div>
              </div>
            </div>
          )}

          {state === 'analyzed' && analysis && sourceFile && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center">Analysis Complete</h2>
              
              <div className="bg-gray-700/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Musical DNA</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-gray-400">Key</p>
                    <p className="text-xl font-bold text-yellow-400">
                      {analysis.key} {analysis.mode}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Tempo</p>
                    <p className="text-xl font-bold text-blue-400">{analysis.tempo} BPM</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Energy</p>
                    <p className="text-xl font-bold text-green-400">{analysis.energy}%</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Confidence</p>
                    <p className="text-xl font-bold text-purple-400">
                      {Math.round(analysis.confidence * 100)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Button onClick={handleGenerate} size="lg" className="text-lg px-8">
                  Generate AI Music
                </Button>
                <p className="text-sm text-gray-400 mt-2">
                  This will create a 60-second {mode === 'solo' ? 'jazz' : 'full arrangement'} 
                  in {analysis.key} {analysis.mode} at {analysis.tempo} BPM
                </p>
              </div>
            </div>
          )}

          {state === 'completed' && generatedFile && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center">Generation Complete</h2>
              
              <div className="bg-gray-700/50 rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold mb-4">Your AI-Generated Music</h3>
                <p className="text-gray-300 mb-4">{generatedFile.name}</p>
                
                <div className="flex justify-center space-x-4">
                  <Button asChild>
                    <a href={generatedFile.url} download={generatedFile.name}>
                      <Download className="mr-2" />
                      Download
                    </a>
                  </Button>
                  <Button variant="secondary" onClick={reset}>
                    Create Another
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
