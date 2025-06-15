
import React from 'react';
import { Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Waveform from './Waveform';

interface ExportScreenProps {
  generatedFile: any;
  onBackToImport: () => void;
}

const ExportScreen: React.FC<ExportScreenProps> = ({
  generatedFile,
  onBackToImport
}) => {
  const handleDownload = () => {
    // In a real app, this would trigger the actual download
    console.log('Downloading:', generatedFile?.name);
    
    // Create a mock download
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,Mock Audio File');
    element.setAttribute('download', generatedFile?.name || 'generated-audio.wav');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-yellow-400 mb-2">Generation Complete!</h2>
        <p className="text-gray-400">Your AI-generated music is ready</p>
      </div>

      {/* Success Animation */}
      <div className="text-center mb-6">
        <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4 animate-pulse-glow">
          <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
            <span className="text-green-900 font-bold">✓</span>
          </div>
        </div>
      </div>

      {/* Generated File Info */}
      {generatedFile && (
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
          <h3 className="text-white font-semibold mb-2">Generated File:</h3>
          <p className="text-gray-400 mb-4">{generatedFile.name}</p>
          
          {/* Waveform Display */}
          <div className="mb-4">
            <Waveform waveformData={generatedFile.waveform || []} />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={handleDownload}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12"
        >
          <Download className="mr-2 h-5 w-5" />
          Download Audio
        </Button>
        
        <Button
          onClick={onBackToImport}
          variant="outline"
          className="flex-1 border-gray-600 hover:border-yellow-400 text-gray-300 hover:text-yellow-400 h-12"
        >
          <RotateCcw className="mr-2 h-5 w-5" />
          Generate Another
        </Button>
      </div>

      {/* File Details */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-2">File Details:</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Format:</span>
            <span className="text-white ml-2">WAV</span>
          </div>
          <div>
            <span className="text-gray-400">Quality:</span>
            <span className="text-white ml-2">44.1kHz</span>
          </div>
          <div>
            <span className="text-gray-400">Duration:</span>
            <span className="text-white ml-2">~3:45</span>
          </div>
          <div>
            <span className="text-gray-400">Size:</span>
            <span className="text-white ml-2">8.2 MB</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportScreen;
