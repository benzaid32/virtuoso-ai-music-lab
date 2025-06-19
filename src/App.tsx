/**
 * Virtuoso AI Music Lab
 * Enterprise Audio Processing App
 * 
 * Tech Stack:
 * - Audio Analysis: Essentia.js (musical feature extraction)
 * - Music Generation: Replicate MusicGen (meta/musicgen model)
 * - Backend: Supabase Edge Functions
 * 
 * Flow: 
 * 1. File Upload → 2. Audio Analysis → 3. Key/Tempo Detection → 4. AI Generation → 5. Output
 */

import { useState } from 'react';
import { Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { analyzeAudioFile } from '@/lib/api/audio-service';
import { AudioProcessor, type AudioAnalysis, type WaveformData } from '@/lib/audio/AudioProcessor';
import { supabase } from '@/integrations/supabase/client';

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
      console.log('🚀 Using professional Essentia.js audio analysis...');
      
      // Direct file analysis with no storage - enterprise grade approach
      console.log('🎵 Analyzing audio directly with professional Essentia.js service...');
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

  const handleAnalyze = async () => {
    if (!sourceFile) return;
    
    setState('analyzing');
    setProgress(10);
    setError(null);

    try {
      console.log('🎵 Starting analysis...');
      setProgress(50);
      
      const result = await analyzeAudioFile(sourceFile.url);
      console.log('✅ Analysis result:', result);
      
      setAnalysis(result);
      setProgress(100);
      setState('analyzed');
    } catch (error) {
      console.error('❌ Analysis error:', error);
      setError('Failed to analyze audio. Please try again.');
      setState('import');
      setProgress(0);
    }
  };

  const handleGenerate = async () => {
    if (!analysis || !sourceFile) return;
    
    setError(null);
    setState('generating');
    setProgress(10);
    
    try {
      // Get the instrument name
      const targetStyle = INSTRUMENTS.find(i => i.id === instrument)?.name || 'Saxophone';

      console.log('🎵 Generating music with Replicate MusicGen...');
      console.log('📋 Parameters:', { targetStyle, analysis });
      setProgress(20);

      // Prepare API request
      const requestBody = {
        // audioUrl: sourceFile.url, // TEMP: Remove blob URL (can't send over HTTP)
        targetStyle: targetStyle,
        analysis: analysis
      };

      try {
        // Call the Supabase edge function
        console.log('🚀 Calling edge function with:', requestBody);
        setProgress(30);

        // Debug the request body before sending
        console.log('🔍 Request body before sending:', requestBody);
        console.log('🔍 Analysis keys:', Object.keys(analysis));
        console.log('🔍 AudioUrl type:', typeof sourceFile.url, sourceFile.url.substring(0, 50));
        
        const { data, error } = await supabase.functions.invoke('virtuoso-ai-composer', {
          body: requestBody
        });
        
        console.log('📊 Raw response:', { data, error });
        setProgress(60);
        
        if (error) {
          throw new Error(`API Error: ${error.message}`);
        }

        // Parse the response if needed
        let parsedData = data;
        if (typeof data === 'string') {
          try {
            parsedData = JSON.parse(data);
            console.log('✅ Parsed string data:', parsedData);
          } catch (parseError) {
            console.error('⚠️ Parse error:', parseError);
          }
        }

        // Check for success
        if (!parsedData?.success) {
          throw new Error(`Generation failed: ${parsedData?.message || 'Unknown error'}`);
        }

        // Parse the audio URL - it might come directly as a string or nested in an object
        const audioUrl = typeof parsedData.audioUrl === 'string' 
          ? parsedData.audioUrl 
          : parsedData.audioUrl?.audio || parsedData.audioUrl;

        console.log('🎵 Generated audio URL:', audioUrl);
        setProgress(80);

        if (!audioUrl) {
          throw new Error('No audio URL in the response');
        }

        setGeneratedFile({
          id: 'generated',
          name: `Virtuoso AI ${targetStyle} - ${new Date().toISOString().slice(0, 10)}.wav`,
          url: audioUrl,
          waveform: { peaks: [], duration: 30 } // Placeholder for waveform
        });

        setProgress(100);
        setState('completed');

      } catch (apiError: any) {
        console.error('❌ API error:', apiError);
        throw apiError; // Re-throw to be handled by outer catch
      }

    } catch (error: any) {
      console.error('Generation error:', error);
      const errorMessage = `❌ ${error.message || 'Music generation failed. Please try again.'}`;
      setError(errorMessage);
      setState('analyzed'); // Return to analyzed state
      setProgress(0);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Virtuoso AI
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Transform any song into a perfect duet by adding AI-generated instrumental solos
          </p>
        </div>

        {/* Progress Indicator */}
        {(state === 'analyzing' || state === 'generating') && (
          <div className="max-w-md mx-auto mb-8 p-6 bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10">
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
              <span className="ml-3 text-white font-medium">
                {state === 'analyzing' ? 'Analyzing your music...' : 'Creating your solo track...'}
              </span>
            </div>
            <Progress value={progress} className="w-full h-2" />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-red-500/10 backdrop-blur-sm rounded-2xl border border-red-500/20">
            <p className="text-red-300 text-center">{error}</p>
          </div>
        )}

        {/* Main Content */}
        {state === 'import' && (
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Upload Section */}
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">Upload Your Track</h2>
                  <p className="text-gray-400">We'll analyze it and create a perfect companion</p>
                </div>
                
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <div className="border-2 border-dashed border-purple-500/50 rounded-2xl p-12 text-center transition-all duration-300 group-hover:border-purple-400 group-hover:bg-purple-500/5">
                    <Upload className="mx-auto h-16 w-16 text-purple-400 mb-4 transition-transform group-hover:scale-110" />
                    <p className="text-xl font-semibold text-white mb-2">Drop your audio file here</p>
                    <p className="text-gray-400">or click to browse</p>
                    <input
                      id="file-input"
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  {sourceFile && (
                    <div className="absolute inset-0 bg-green-500/10 border-2 border-green-500 rounded-2xl flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl mb-2">✅</div>
                        <p className="text-green-300 font-medium">{sourceFile.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Instrument Selection */}
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">Choose Your Instrument</h2>
                  <p className="text-gray-400">Pick what solo you want to add</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {INSTRUMENTS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setInstrument(item.id as Instrument)}
                      className={`
                        relative p-4 rounded-xl border-2 transition-all duration-300
                        ${instrument === item.id 
                          ? 'border-purple-400 bg-purple-500/20 scale-105' 
                          : 'border-white/10 bg-white/5 hover:border-purple-500/50 hover:bg-purple-500/10'
                        }
                      `}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">{item.emoji}</div>
                        <div className="text-white font-medium">{item.name}</div>
                        <div className="text-gray-400 text-xs">{item.desc}</div>
                      </div>
                      {instrument === item.id && (
                        <div className="absolute -top-1 -right-1 bg-purple-500 rounded-full w-6 h-6 flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {sourceFile && instrument && (
                  <div className="grid grid-cols-2 gap-3">
                    {GROUPS.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setGroup(item.id as Group)}
                        className={`
                          relative p-4 rounded-xl border-2 transition-all duration-300
                          ${group === item.id 
                            ? 'border-purple-400 bg-purple-500/20 scale-105' 
                            : 'border-white/10 bg-white/5 hover:border-purple-500/50 hover:bg-purple-500/10'
                          }
                        `}
                      >
                        <div className="text-center">
                          <div className="text-3xl mb-2">{item.emoji}</div>
                          <div className="text-white font-medium">{item.name}</div>
                          <div className="text-gray-400 text-xs">{item.desc}</div>
                        </div>
                        {group === item.id && (
                          <div className="absolute -top-1 -right-1 bg-purple-500 rounded-full w-6 h-6 flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {sourceFile && instrument && group && (
                  <button
                    onClick={handleAnalyze}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold text-lg transition-all duration-300 hover:from-purple-500 hover:to-pink-500 hover:scale-105 shadow-lg hover:shadow-purple-500/25"
                  >
                    Analyze & Create Solo
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {state === 'analyzed' && analysis && sourceFile && (
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">Perfect Match Found! 🎯</h2>
              <p className="text-xl text-gray-300">
                Ready to create your <span className="text-purple-400 font-semibold">
                  {INSTRUMENTS.find(i => i.id === instrument)?.name}
                </span> solo
              </p>
            </div>

            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-6">Track Analysis</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-4">
                <div className="text-center">
                  <div className="text-2xl mb-2">🎹</div>
                  <div className="text-purple-400 font-bold text-lg">{analysis.key} {analysis.mode}</div>
                  <div className="text-gray-400 text-sm">Key</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">🥁</div>
                  <div className="text-blue-400 font-bold text-lg">{analysis.tempo?.toFixed(1) || 0}</div>
                  <div className="text-gray-400 text-sm">BPM</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="text-green-400 font-bold text-lg">{analysis.energy?.toFixed(2) || 0}</div>
                  <div className="text-gray-400 text-sm">Energy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="text-pink-400 font-bold text-lg">{Math.round(analysis.confidence * 100)}%</div>
                  <div className="text-gray-400 text-sm">Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">🎵</div>
                  <div className="text-amber-400 font-bold text-lg">{analysis.beat_times?.length || 0}</div>
                  <div className="text-gray-400 text-sm">Beat Count</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">⏱️</div>
                  <div className="text-cyan-400 font-bold text-lg">{analysis.duration?.toFixed(0) || 0}s</div>
                  <div className="text-gray-400 text-sm">Duration</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              className="py-4 px-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold text-xl transition-all duration-300 hover:from-purple-500 hover:to-pink-500 hover:scale-105 shadow-lg hover:shadow-purple-500/25"
            >
              🎵 Generate My Solo Track
            </button>
          </div>
        )}

        {state === 'completed' && generatedFile && (
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div>
              <h2 className="text-4xl font-bold text-white mb-4">🎉 Your Duet is Ready!</h2>
              <p className="text-xl text-gray-300">
                Perfect {INSTRUMENTS.find(i => i.id === instrument)?.name} solo created
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 backdrop-blur-sm rounded-2xl p-8 border border-green-500/20">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-2">🎼 {generatedFile.name}</h3>
                  <p className="text-gray-300">Ready to play alongside your original track</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href={generatedFile.url}
                    download={generatedFile.name}
                    className="flex items-center justify-center py-3 px-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl text-white font-semibold transition-all duration-300 hover:from-green-500 hover:to-emerald-500 hover:scale-105"
                  >
                    <Download className="mr-2" />
                    Download Solo Track
                  </a>
                  <button
                    onClick={reset}
                    className="py-3 px-8 bg-white/10 border border-white/20 rounded-xl text-white font-semibold transition-all duration-300 hover:bg-white/20"
                  >
                    Create Another
                  </button>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <p className="text-yellow-200 text-sm">
                    💡 <strong>Pro Tip:</strong> Play both tracks together in your music app for the perfect duet!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
