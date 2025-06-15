
import React from 'react';
import { Loader2, Wand2 } from 'lucide-react';
import { Instrument, Group, Mode } from '../pages/Index';

interface ProcessingScreenProps {
  selectedMode: Mode;
  selectedInstrument: Instrument;
  selectedGroup: Group;
  importedFile: any;
  generating?: boolean;
  progress?: string;
}

const ProcessingScreen: React.FC<ProcessingScreenProps> = ({
  selectedMode,
  selectedInstrument,
  selectedGroup,
  importedFile,
  generating = false,
  progress = ''
}) => {
  return (
    <div className="space-y-6 text-center">
      <div>
        <h2 className="text-2xl font-bold text-yellow-400 mb-2">AI Processing</h2>
        <p className="text-gray-400">Creating your {selectedMode} arrangement...</p>
        {progress && (
          <p className="text-sm text-blue-400 mt-2">{progress}</p>
        )}
      </div>

      {/* Processing Animation */}
      <div className="relative">
        <div className="w-32 h-32 mx-auto mb-6 relative">
          <div className={`absolute inset-0 bg-gradient-to-r from-yellow-400 to-blue-400 rounded-full ${generating ? 'animate-spin' : ''}`}>
            <div className="absolute inset-2 bg-gray-900 rounded-full flex items-center justify-center">
              <Wand2 className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </div>
        
        <div className="flex justify-center items-center space-x-2 mb-6">
          {generating && <Loader2 className="w-5 h-5 animate-spin text-blue-400" />}
          <span className="text-white">
            {generating ? (progress || 'Generating music with AI...') : 'Processing complete!'}
          </span>
        </div>
      </div>

      {/* File Info */}
      {importedFile && (
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
          <h3 className="text-white font-semibold mb-2">Processing File:</h3>
          <p className="text-gray-400">{importedFile.name}</p>
        </div>
      )}

      {/* Selection Summary */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-2">Configuration:</h3>
        <div className="space-y-1 text-gray-400">
          <p>Mode: <span className="text-white capitalize">{selectedMode}</span></p>
          {selectedMode === 'solo' ? (
            <p>Instrument: <span className="text-white capitalize">{selectedInstrument.replace('-', ' ')}</span></p>
          ) : (
            <p>Group: <span className="text-white">{selectedGroup === 'orchestra' ? 'Orchestra' : "60's Soul Band"}</span></p>
          )}
        </div>
      </div>

      {/* Waveform Visualization */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4">Audio Waveform</h3>
        <div className="flex items-end justify-center space-x-1 h-16">
          {Array.from({ length: 40 }, (_, i) => (
            <div
              key={i}
              className="bg-gradient-to-t from-blue-500 to-yellow-400 animate-waveform rounded-sm"
              style={{
                width: '3px',
                height: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProcessingScreen;
