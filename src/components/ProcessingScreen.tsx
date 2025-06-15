
import React from 'react';
import { Loader2, Wand2, Music2 } from 'lucide-react';
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
        <p className="text-gray-400">Transforming your audio with {selectedMode} arrangement...</p>
        {progress && (
          <p className="text-sm text-blue-400 mt-2">{progress}</p>
        )}
      </div>

      {/* Enhanced Processing Animation */}
      <div className="relative">
        <div className="w-32 h-32 mx-auto mb-6 relative">
          <div className={`absolute inset-0 bg-gradient-to-r from-yellow-400 to-blue-400 rounded-full ${generating ? 'animate-spin' : ''}`}>
            <div className="absolute inset-2 bg-gray-900 rounded-full flex items-center justify-center">
              <div className="flex space-x-1">
                <Wand2 className="w-6 h-6 text-yellow-400" />
                <Music2 className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center items-center space-x-2 mb-6">
          {generating && <Loader2 className="w-5 h-5 animate-spin text-blue-400" />}
          <span className="text-white">
            {generating ? (progress || 'AI is analyzing and transforming your audio...') : 'Processing complete!'}
          </span>
        </div>
      </div>

      {/* Enhanced Info Display */}
      {importedFile && (
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
          <h3 className="text-white font-semibold mb-2">Input Audio:</h3>
          <p className="text-gray-400 mb-2">{importedFile.name}</p>
          <div className="text-sm text-blue-400">
            <p>✨ AI will use your audio as the foundation</p>
            <p>🎵 Extended to 60 seconds duration</p>
          </div>
        </div>
      )}

      {/* Enhanced Configuration Summary */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-2">Transformation Settings:</h3>
        <div className="space-y-2 text-gray-400">
          <p>Mode: <span className="text-white capitalize">{selectedMode}</span></p>
          {selectedMode === 'solo' ? (
            <p>Target: <span className="text-white capitalize">{selectedInstrument.replace('-', ' ')} arrangement</span></p>
          ) : (
            <p>Target: <span className="text-white">{selectedGroup === 'orchestra' ? 'Full Orchestra' : "60's Soul Band"} arrangement</span></p>
          )}
          <p>Duration: <span className="text-white">60 seconds</span></p>
          <p>Quality: <span className="text-white">Stereo Hi-Fi</span></p>
        </div>
      </div>

      {/* Enhanced Waveform Visualization */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4">Audio Analysis</h3>
        <div className="flex items-end justify-center space-x-1 h-16">
          {Array.from({ length: 60 }, (_, i) => (
            <div
              key={i}
              className={`${generating ? 'bg-gradient-to-t from-blue-500 to-yellow-400 animate-pulse' : 'bg-gray-600'} rounded-sm transition-all duration-300`}
              style={{
                width: '2px',
                height: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.05}s`
              }}
            />
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {generating ? 'Analyzing musical patterns...' : 'Analysis complete'}
        </p>
      </div>
    </div>
  );
};

export default ProcessingScreen;
