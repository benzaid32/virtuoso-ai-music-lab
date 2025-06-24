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

import React, { useState, useRef } from 'react';
import { Upload, Music, Play, Pause, Download, Volume2, BarChart3, Clock, Zap, Target, Settings, Star } from 'lucide-react';
import { analyzeAudioFile, SimpleAudioService } from './lib/api/audio-service';
import type { MusicAnalysis, GenerationResult } from './lib/types/music-analysis';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { AudioProcessor, type WaveformData } from '@/lib/audio/AudioProcessor';
import { supabase } from '@/integrations/supabase/client';

type Mode = 'solo' | 'group';
type Instrument = 'saxophone' | 'harmonica' | 'steelpan' | 'electric-guitar';
type Group = 'orchestra' | 'soul-band';

interface AudioFile {
  id: string;
  name: string;
  url: string;
  waveform?: WaveformData;
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
  const [analysis, setAnalysis] = useState<MusicAnalysis | null>(null);
  const [sourceFile, setSourceFile] = useState<AudioFile | null>(null);
  const [generatedFile, setGeneratedFile] = useState<AudioFile | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [targetStyle, setTargetStyle] = useState('Jazz Saxophone');

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
      
      // Analyze file directly without storing it with timeout
      console.log('🎯 Starting audio analysis with 5-minute timeout for full file support...');
      const analysisTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Analysis timeout - please try again')), 300000)
      );
      
      const audioAnalysis = await Promise.race([
        analyzeAudioFile(file),
        analysisTimeout
      ]) as any;
      
      console.log('✅ Audio analysis completed successfully');
      setProgress(80);
      setProgress(100);

      // Set analysis and source file
      console.log('🔄 Setting analysis state with:', {
        beats: audioAnalysis.beatCount || 0,
        bpm: audioAnalysis.bpm || audioAnalysis.tempo,
        key: audioAnalysis.key
      });
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
    if (!sourceFile || !analysis) return;
    
    setState('analyzed');
    setProgress(100);
    setError(null);

    console.log('✅ Analysis already completed during upload:', analysis);
  };

  const handleGenerate = async () => {
    if (!analysis) return;

    const targetStyle = mode === 'solo' ? INSTRUMENTS.find(i => i.id === instrument)?.name : 
                      GROUPS.find(g => g.id === group)?.name;

    if (!targetStyle) return;

    setState('generating');
    setIsGenerating(true);
    setProgress(10);
    setError(null);

    try {
      console.log('🎵 Starting music generation...');
      setProgress(20);

      // Generate music prompt from analysis
      const prompt = `Professional ${targetStyle} solo instrumental in ${analysis.key} major at ${analysis.tempo} BPM, ${analysis.energy > 0.6 ? 'high' : analysis.energy > 0.4 ? 'medium' : 'low'} energy, balanced, studio quality recording, no vocals`;
      console.log('🎵 Generated prompt:', prompt);

      // Call Supabase Edge Function with proper request
      console.log('🚀 Calling Supabase Edge Function...');
      setProgress(30);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/virtuoso-ai-composer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          prompt,
          targetStyle,
          analysis: {
            tempo: analysis.tempo,
            key: analysis.key,
            energy: analysis.energy
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.text();
      console.log('📦 Raw response:', result);

      // Parse response - it might come as JSON string
      let data;
      try {
        data = typeof result === 'string' ? JSON.parse(result) : result;
      } catch (e) {
        console.error('Failed to parse response:', e);
        throw new Error('Invalid response format from server');
      }

      console.log('✅ Parsed response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      // Parse the audio URL - it might come directly as a string or nested in an object
      const audioUrl = typeof data.audioUrl === 'string' 
        ? data.audioUrl 
        : data.audioUrl?.audio || data.audioUrl;

      console.log('🎵 Generated audio URL:', audioUrl);
      setProgress(80);

      if (!audioUrl) {
        throw new Error('No audio URL in the response');
      }

      setGeneratedFile({
        id: 'generated',
        name: `Virtuoso AI ${targetStyle} - ${new Date().toISOString().slice(0, 10)}.wav`,
        url: audioUrl
        // No placeholder or mock waveform data - enterprise-grade real data only
      });

      setProgress(100);
      setState('completed');
      setIsGenerating(false);

    } catch (error: any) {
      console.error('Generation error:', error);
      const errorMessage = `❌ ${error.message || 'Music generation failed. Please try again.'}`;
      console.log(errorMessage);
      setError(errorMessage);
      setState('analyzed');
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handleGenerateMusic = async () => {
    if (!analysis || !sourceFile) {
      setError('Please analyze audio first');
      return;
    }

    try {
      console.log('🎯 Starting music generation...');
      console.log('Analysis data being sent:', analysis);

      const response = await fetch('/api/virtuoso-ai-composer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysis,
          targetStyle,
          generationConstraints: analysis.generationConstraints,
          musicalDNA: analysis.musicalDNA,
          symbolicData: analysis.symbolicData,
          quantumTimeGrid: analysis.quantumTimeGrid
        }),
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.status}`);
      }

      const data = await response.text();
      console.log('Raw response:', data);

      let parsedData;
      try {
        parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid response format from generation service');
      }

      console.log('Parsed generation result:', parsedData);

      if (!parsedData.success) {
        throw new Error(parsedData.error || 'Generation failed');
      }

      // Parse the audio URL - it might come directly as a string or nested in an object
      const audioUrl = typeof parsedData.audioUrl === 'string' 
        ? parsedData.audioUrl 
        : parsedData.audioUrl?.audio || parsedData.audioUrl;

      console.log('🎵 Generated audio URL:', audioUrl);

      setGeneratedFile({
        id: 'generated',
        name: `Virtuoso AI ${targetStyle} - ${new Date().toISOString().slice(0, 10)}.wav`,
        url: audioUrl
      });

    } catch (error) {
      console.error('❌ Generation error:', error);
      setError(error instanceof Error ? error.message : 'Generation failed');
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-2xl mb-2">🎹</div>
                  <div className="text-purple-400 font-bold text-lg">{analysis.key} {analysis.mode}</div>
                  <div className="text-gray-400 text-sm">Key</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">🥁</div>
                  <div className="text-blue-400 font-bold text-lg">{analysis.tempo?.toFixed(1)}</div>
                  <div className="text-gray-400 text-sm">BPM</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="text-green-400 font-bold text-lg">{analysis.energy?.toFixed(2)}</div>
                  <div className="text-gray-400 text-sm">Energy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="text-pink-400 font-bold text-lg">{Math.round(analysis.confidence * 100)}%</div>
                  <div className="text-gray-400 text-sm">Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">🎵</div>
                  <div className="text-amber-400 font-bold text-lg">{analysis.beatCount}</div>
                  <div className="text-gray-400 text-sm">Beat Count</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">⏱️</div>
                  <div className="text-cyan-400 font-bold text-lg">{analysis.duration?.toFixed(0)}s</div>
                  <div className="text-gray-400 text-sm">Duration</div>
                </div>
              </div>

              {/* Advanced SyncLock Data */}
              <div className="bg-gray-800/50 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-bold mb-4 text-gradient bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  🧬 SyncLock Musical DNA
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-lg mb-1">🎼</div>
                    <div className="text-blue-400 font-bold">{analysis.chordCount}</div>
                    <div className="text-gray-400 text-sm">Chords</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg mb-1">🎪</div>
                    <div className="text-purple-400 font-bold">{analysis.phraseCount}</div>
                    <div className="text-gray-400 text-sm">Phrases</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg mb-1">⚡</div>
                    <div className="text-green-400 font-bold">{Math.round(analysis.syncAccuracy * 100)}%</div>
                    <div className="text-gray-400 text-sm">Sync Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg mb-1">🔮</div>
                    <div className="text-pink-400 font-bold">{Math.round(analysis.harmonicIntegrity * 100)}%</div>
                    <div className="text-gray-400 text-sm">Harmony</div>
                  </div>
                </div>
                
                {/* Generation Constraints Display */}
                {analysis.generationConstraints && (
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm font-semibold mb-2 text-orange-400">🎯 AI Generation Constraints</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-gray-400">Scale:</span> 
                        <span className="text-blue-400 ml-1">{analysis.generationConstraints.scaleConstraint}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Chord Lock:</span> 
                        <span className="text-purple-400 ml-1">{analysis.generationConstraints.chordLock}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Beat Alignment:</span> 
                        <span className="text-pink-400 ml-1">{Math.round((analysis.generationConstraints.beatAlignment || 0) * 100)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Temperature:</span> 
                        <span className="text-green-400 ml-1">{analysis.generationConstraints.temperature}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Max Interval:</span> 
                        <span className="text-amber-400 ml-1">{analysis.generationConstraints.maxInterval}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Energy Match:</span> 
                        <span className="text-cyan-400 ml-1">{analysis.generationConstraints.energyMatch ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                )}
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
