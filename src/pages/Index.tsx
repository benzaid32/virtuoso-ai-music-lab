
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAudioUpload } from '../hooks/useAudioUpload';
import { useMusicAnalysis } from '../hooks/useMusicAnalysis';
import { useStableAudio } from '../hooks/useStableAudio';
import AuthForm from '../components/AuthForm';
import ImportScreen from '../components/ImportScreen';
import ProcessingScreen from '../components/ProcessingScreen';
import ExportScreen from '../components/ExportScreen';
import MusicAnalysisDisplay from '../components/MusicAnalysisDisplay';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export type Instrument = 'saxophone' | 'harmonica' | 'steelpan' | 'electric-guitar';
export type Group = 'orchestra' | 'soul-band';
export type Mode = 'solo' | 'group';

export interface AudioFile {
  id?: string;
  name: string;
  url: string;
  waveform: number[];
}

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { uploadAudioFile, uploading } = useAudioUpload();
  const { analyzeAudio, analyzing, analysis, setAnalysis } = useMusicAnalysis();
  const { generateWithStableAudio, generating, progress } = useStableAudio();
  
  const [currentScreen, setCurrentScreen] = useState<'import' | 'analysis' | 'processing' | 'export'>('import');
  const [selectedMode, setSelectedMode] = useState<Mode>('solo');
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument>('saxophone');
  const [selectedGroup, setSelectedGroup] = useState<Group>('orchestra');
  const [importedFile, setImportedFile] = useState<AudioFile | null>(null);
  const [generatedFile, setGeneratedFile] = useState<AudioFile | null>(null);
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null);

  const handleFileImport = async (file: File) => {
    console.log('Importing and analyzing file:', file.name);
    setUploadedAudioFile(file);
    
    // Upload file first
    const uploadedFile = await uploadAudioFile(file);
    if (uploadedFile) {
      setImportedFile(uploadedFile);
      setCurrentScreen('analysis');
      
      // Start music analysis
      const musicAnalysis = await analyzeAudio(file);
      if (musicAnalysis) {
        console.log('Analysis complete:', musicAnalysis);
      }
    }
  };

  const handleStartGeneration = async () => {
    if (!importedFile || !analysis) {
      console.error('Missing imported file or analysis');
      return;
    }

    setCurrentScreen('processing');
    
    // Start enhanced music generation
    const result = await generateWithStableAudio(
      selectedMode,
      selectedMode === 'solo' ? selectedInstrument : null,
      selectedMode === 'group' ? selectedGroup : null,
      importedFile.id!,
      analysis
    );
    
    if (result) {
      console.log('Generation result:', result);
      
      // Fetch the generated audio file details
      const { data: audioFile, error } = await supabase
        .from('audio_files')
        .select('*')
        .eq('id', result.outputAudioId)
        .single();

      if (!error && audioFile) {
        const { data: { publicUrl } } = supabase.storage
          .from('audio-files')
          .getPublicUrl(audioFile.file_path);

        let waveformData: number[] = [];
        if (audioFile.waveform_data) {
          if (Array.isArray(audioFile.waveform_data)) {
            waveformData = audioFile.waveform_data.filter((item): item is number => typeof item === 'number');
          }
        }

        setGeneratedFile({
          id: audioFile.id,
          name: audioFile.original_filename,
          url: publicUrl,
          waveform: waveformData
        });
        
        setCurrentScreen('export');
      }
    }
  };

  const handleBackToImport = () => {
    setCurrentScreen('import');
    setImportedFile(null);
    setGeneratedFile(null);
    setAnalysis(null);
    setUploadedAudioFile(null);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-studio-dark via-studio-medium to-studio-dark flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-studio-dark via-studio-medium to-studio-dark text-warm-white relative overflow-hidden">
      {/* Background ambient elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,193,7,0.05),transparent_70%)]" />
      
      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Header with user info */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent mb-2">
              Virtuoso.ai
            </h1>
            <p className="text-xl text-gray-300">AI Music Analysis & Generation</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-300">
              <User className="w-5 h-5" />
              <span>{user.email}</span>
            </div>
            <Button 
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Main workflow */}
          <div className="audio-panel rounded-3xl p-8 min-h-[400px] glow-gold">
            {currentScreen === 'import' && (
              <ImportScreen
                selectedMode={selectedMode}
                setSelectedMode={setSelectedMode}
                selectedInstrument={selectedInstrument}
                setSelectedInstrument={setSelectedInstrument}
                selectedGroup={selectedGroup}
                setSelectedGroup={setSelectedGroup}
                onFileImport={handleFileImport}
                uploading={uploading}
              />
            )}
            
            {currentScreen === 'analysis' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-yellow-400 mb-2">Music Analysis</h2>
                  <p className="text-gray-400">AI is analyzing your music's characteristics</p>
                </div>
                
                <MusicAnalysisDisplay analysis={analysis} analyzing={analyzing} />
                
                {analysis && !analyzing && (
                  <div className="text-center">
                    <Button
                      onClick={handleStartGeneration}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-3 text-lg"
                      disabled={generating}
                    >
                      Generate AI Music
                    </Button>
                    <p className="text-sm text-gray-400 mt-2">
                      This will create new music matching your audio's key, tempo, and energy
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {currentScreen === 'processing' && (
              <ProcessingScreen
                selectedMode={selectedMode}
                selectedInstrument={selectedInstrument}
                selectedGroup={selectedGroup}
                importedFile={importedFile}
                generating={generating}
                progress={progress}
              />
            )}
            
            {currentScreen === 'export' && (
              <ExportScreen
                generatedFile={generatedFile}
                onBackToImport={handleBackToImport}
              />
            )}
          </div>

          {/* Right Panel - Analysis Summary or 3D Visualization */}
          <div className="audio-panel rounded-3xl p-8 min-h-[400px] glow-blue">
            {analysis ? (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">Musical DNA</h3>
                <MusicAnalysisDisplay analysis={analysis} analyzing={false} />
                
                {importedFile && (
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Source Audio:</h4>
                    <p className="text-gray-400 text-sm">{importedFile.name}</p>
                    <div className="mt-2 text-xs text-blue-400">
                      <p>🎵 Key: {analysis.key} {analysis.mode}</p>
                      <p>⏱️ Tempo: {analysis.tempo} BPM</p>
                      <p>⚡ Energy: {Math.round(analysis.energy)}%</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full bg-gradient-to-b from-gray-900/50 to-black/50 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full animate-pulse" />
                  </div>
                  <p className="text-gray-400">Upload audio to see analysis</p>
                  <p className="text-sm text-gray-500">Key, tempo & energy detection</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
