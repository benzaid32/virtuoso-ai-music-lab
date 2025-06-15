
import React, { useCallback } from 'react';
import { Upload, Music, Users } from 'lucide-react';
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
  { id: 'saxophone' as Instrument, name: 'Saxophone', emoji: '🎷' },
  { id: 'harmonica' as Instrument, name: 'Harmonica', emoji: '🎵' },
  { id: 'steelpan' as Instrument, name: 'Steel Pan', emoji: '🥁' },
  { id: 'electric-guitar' as Instrument, name: 'Electric Guitar', emoji: '🎸' }
];

const groups = [
  { id: 'orchestra' as Group, name: 'Orchestra', emoji: '🎼' },
  { id: 'soul-band' as Group, name: "60's Soul Band", emoji: '🎤' }
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
        <h2 className="text-2xl font-bold text-yellow-400 mb-2">Import Your Music</h2>
        <p className="text-gray-400">Choose your mode and upload a file to get started</p>
      </div>

      {/* Mode Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Select Mode</h3>
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant={selectedMode === 'solo' ? 'default' : 'outline'}
            className={`h-16 ${selectedMode === 'solo' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'border-gray-600 hover:border-yellow-400'}`}
            onClick={() => setSelectedMode('solo')}
          >
            <Music className="mr-2" />
            Solo
          </Button>
          <Button
            variant={selectedMode === 'group' ? 'default' : 'outline'}
            className={`h-16 ${selectedMode === 'group' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'border-gray-600 hover:border-yellow-400'}`}
            onClick={() => setSelectedMode('group')}
          >
            <Users className="mr-2" />
            Group
          </Button>
        </div>
      </div>

      {/* Instrument/Group Selection */}
      {selectedMode === 'solo' ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Choose Instrument</h3>
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
                  <div className="text-sm font-medium text-white">{instrument.name}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Choose Group</h3>
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
                  <div className="text-sm font-medium text-white">{group.name}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* File Upload */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Upload Audio File</h3>
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-yellow-400 transition-colors">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="space-y-2">
            <p className="text-white">Drop your audio file here or</p>
            <Button 
              variant="outline" 
              className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
              disabled={uploading}
            >
              <label htmlFor="file-upload" className="cursor-pointer">
                {uploading ? 'Uploading...' : 'Browse Files'}
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
          <p className="text-sm text-gray-500 mt-2">Supports MP3, WAV, FLAC, and more</p>
        </div>
      </div>
    </div>
  );
};

export default ImportScreen;
