
import React, { useCallback } from 'react';
import { Upload, Music, Users, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Instrument, Group, Mode } from '../pages/Index';

interface ImportScreenProps {
  selectedMode: Mode;
  setSelectedMode: (mode: Mode) => void;
  selectedInstrument: Instrument;
  setSelectedInstrument: (instrument: Instrument) => void;
  selectedGroup: Group;
  setSelectedGroup: (group: Group) => void;
  onFileImport: (file: File) => void;
  uploading?: boolean;
}

const soloInstruments = [
  { id: 'saxophone' as Instrument, name: 'Saxophone', emoji: '🎷', description: 'Transform into smooth jazz' },
  { id: 'harmonica' as Instrument, name: 'Harmonica', emoji: '🎵', description: 'Convert to bluesy melody' },
  { id: 'steelpan' as Instrument, name: 'Steel Pan', emoji: '🥁', description: 'Reimagine as Caribbean rhythm' },
  { id: 'electric-guitar' as Instrument, name: 'Electric Guitar', emoji: '🎸', description: 'Rock-style transformation' }
];

const groups = [
  { id: 'orchestra' as Group, name: 'Orchestra', emoji: '🎼', description: 'Full classical arrangement' },
  { id: 'soul-band' as Group, name: "60's Soul Band", emoji: '🎤', description: 'Vintage soul transformation' }
];

const ImportScreen: React.FC<ImportScreenProps> = ({
  selectedMode,
  setSelectedMode,
  selectedInstrument,
  setSelectedInstrument,
  selectedGroup,
  setSelectedGroup,
  onFileImport,
  uploading = false
}) => {
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileImport(file);
    }
  }, [onFileImport]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-yellow-400 mb-2">Transform Your Music</h2>
        <p className="text-gray-400">AI will use your audio as the foundation for transformation</p>
      </div>

      {/* Enhanced Info Banner */}
      <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-blue-300 font-medium mb-1">How it works:</p>
            <p className="text-blue-200">
              Upload your audio → AI analyzes the musical patterns → Transforms it into your chosen style → 
              Get a 60-second enhanced version that keeps your original essence
            </p>
          </div>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Select Transformation Mode</h3>
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant={selectedMode === 'solo' ? 'default' : 'outline'}
            className={`h-16 ${selectedMode === 'solo' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'border-gray-600 hover:border-yellow-400'}`}
            onClick={() => setSelectedMode('solo')}
          >
            <Music className="mr-2" />
            Solo Instrument
          </Button>
          <Button
            variant={selectedMode === 'group' ? 'default' : 'outline'}
            className={`h-16 ${selectedMode === 'group' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'border-gray-600 hover:border-yellow-400'}`}
            onClick={() => setSelectedMode('group')}
          >
            <Users className="mr-2" />
            Full Ensemble
          </Button>
        </div>
      </div>

      {/* Enhanced Instrument/Group Selection */}
      {selectedMode === 'solo' ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Choose Target Instrument</h3>
          <div className="grid grid-cols-2 gap-3">
            {soloInstruments.map((instrument) => (
              <Card
                key={instrument.id}
                className={`p-4 cursor-pointer transition-all border-2 ${
                  selectedInstrument === instrument.id
                    ? 'border-yellow-400 bg-yellow-400/10'
                    : 'border-gray-600 hover:border-gray-400 bg-gray-800/50'
                }`}
                onClick={() => setSelectedInstrument(instrument.id)}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">{instrument.emoji}</div>
                  <div className="text-sm font-medium text-white mb-1">{instrument.name}</div>
                  <div className="text-xs text-gray-400">{instrument.description}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Choose Target Ensemble</h3>
          <div className="grid grid-cols-1 gap-3">
            {groups.map((group) => (
              <Card
                key={group.id}
                className={`p-4 cursor-pointer transition-all border-2 ${
                  selectedGroup === group.id
                    ? 'border-yellow-400 bg-yellow-400/10'
                    : 'border-gray-600 hover:border-gray-400 bg-gray-800/50'
                }`}
                onClick={() => setSelectedGroup(group.id)}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">{group.emoji}</div>
                  <div className="text-sm font-medium text-white mb-1">{group.name}</div>
                  <div className="text-xs text-gray-400">{group.description}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced File Upload */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Upload Your Audio</h3>
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-yellow-400 transition-colors">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="space-y-2">
            <p className="text-white">Upload your audio file for AI transformation</p>
            <Button 
              variant="outline" 
              className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
              disabled={uploading}
            >
              <label htmlFor="file-upload" className="cursor-pointer">
                {uploading ? 'Uploading...' : 'Choose Audio File'}
              </label>
            </Button>
            <input
              id="file-upload"
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Supports MP3, WAV, FLAC • Will be extended to 60 seconds
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImportScreen;
