
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAudioUpload } from '../hooks/useAudioUpload';
import { useMusicGeneration } from '../hooks/useMusicGeneration';
import AuthForm from '../components/AuthForm';
import ImportScreen from '../components/ImportScreen';
import ProcessingScreen from '../components/ProcessingScreen';
import ExportScreen from '../components/ExportScreen';
import AudioControls from '../components/AudioControls';
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
  const { generateMusic, generating, progress } = useMusicGeneration();
  
  const [currentScreen, setCurrentScreen] = useState<'import' | 'processing' | 'export'>('import');
  const [selectedMode, setSelectedMode] = useState<Mode>('solo');
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument>('saxophone');
  const [selectedGroup, setSelectedGroup] = useState<Group>('orchestra');
  const [importedFile, setImportedFile] = useState<AudioFile | null>(null);
  const [generatedFile, setGeneratedFile] = useState<AudioFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleFileImport = async (file: File) => {
    console.log('Importing file:', file.name);
    const uploadedFile = await uploadAudioFile(file);
    if (uploadedFile) {
      setImportedFile(uploadedFile);
      setCurrentScreen('processing');
      
      // Start music generation
      const result = await generateMusic(
        selectedMode,
        selectedMode === 'solo' ? selectedInstrument : null,
        selectedMode === 'group' ? selectedGroup : null,
        uploadedFile.id!
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
          console.log('Generated audio file:', audioFile);
          
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('audio-files')
            .getPublicUrl(audioFile.file_path);

          setGeneratedFile({
            id: audioFile.id,
            name: audioFile.original_filename,
            url: publicUrl,
            waveform: audioFile.waveform_data || []
          });
          
          setCurrentScreen('export');
        } else {
          console.error('Failed to fetch generated audio file:', error);
        }
      }
    }
  };

  const handleBackToImport = () => {
    setCurrentScreen('import');
    setImportedFile(null);
    setGeneratedFile(null);
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
            <p className="text-xl text-gray-300">AI-Powered Music Generator</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Screen - Import or Processing */}
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

          {/* Right Panel - 3D Visualization */}
          <div className="audio-panel rounded-3xl p-8 min-h-[400px] glow-blue">
            <div className="h-full bg-gradient-to-b from-gray-900/50 to-black/50 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full animate-pulse" />
                </div>
                <p className="text-gray-400">3D Visualization</p>
                <p className="text-sm text-gray-500">Coming soon...</p>
              </div>
            </div>
          </div>
        </div>

        {/* Audio Controls */}
        <AudioControls
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          currentTime={currentTime}
          duration={duration}
        />
      </div>
    </div>
  );
};

export default Index;
