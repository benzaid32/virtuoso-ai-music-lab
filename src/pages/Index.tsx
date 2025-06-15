
import React, { useState } from 'react';
import ImportScreen from '../components/ImportScreen';
import ProcessingScreen from '../components/ProcessingScreen';
import ExportScreen from '../components/ExportScreen';
import AudioControls from '../components/AudioControls';

export type Instrument = 'saxophone' | 'harmonica' | 'steelpan' | 'electric-guitar';
export type Group = 'orchestra' | 'soul-band';
export type Mode = 'solo' | 'group';

export interface AudioFile {
  name: string;
  url: string;
  waveform: number[];
}

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<'import' | 'processing' | 'export'>('import');
  const [selectedMode, setSelectedMode] = useState<Mode>('solo');
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument>('saxophone');
  const [selectedGroup, setSelectedGroup] = useState<Group>('orchestra');
  const [importedFile, setImportedFile] = useState<AudioFile | null>(null);
  const [generatedFile, setGeneratedFile] = useState<AudioFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleFileImport = (file: AudioFile) => {
    setImportedFile(file);
    setCurrentScreen('processing');
    
    // Simulate AI processing
    setTimeout(() => {
      setGeneratedFile({
        name: `Generated_${selectedMode}_${selectedInstrument || selectedGroup}.wav`,
        url: '#',
        waveform: Array.from({ length: 100 }, () => Math.random())
      });
      setCurrentScreen('export');
    }, 3000);
  };

  const handleBackToImport = () => {
    setCurrentScreen('import');
    setImportedFile(null);
    setGeneratedFile(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-studio-dark via-studio-medium to-studio-dark text-warm-white relative overflow-hidden">
      {/* Background ambient elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,193,7,0.05),transparent_70%)]" />
      
      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent mb-2">
            Virtuoso.ai
          </h1>
          <p className="text-xl text-gray-300">AI-Powered Music Generator</p>
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
              />
            )}
            {currentScreen === 'processing' && (
              <ProcessingScreen
                selectedMode={selectedMode}
                selectedInstrument={selectedInstrument}
                selectedGroup={selectedGroup}
                importedFile={importedFile}
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
