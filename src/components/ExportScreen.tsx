
import React from 'react';
import { Download, RotateCcw, Play, Pause } from 'lucide-react';
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
  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const handleDownload = () => {
    if (generatedFile?.url) {
      console.log('Downloading file:', generatedFile.name);
      
      // Create download link
      const link = document.createElement('a');
      link.href = generatedFile.url;
      link.download = generatedFile.name || 'generated-music.wav';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  React.useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => setIsPlaying(false);
      const handlePause = () => setIsPlaying(false);
      
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('pause', handlePause);
      
      return () => {
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('pause', handlePause);
      };
    }
  }, []);

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
          
          {/* Audio Player */}
          <div className="mb-4 flex items-center justify-center space-x-4">
            <Button
              onClick={togglePlayback}
              variant="outline"
              size="sm"
              className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Pause' : 'Play Preview'}
            </Button>
            
            <audio 
              ref={audioRef} 
              src={generatedFile.url}
              preload="metadata"
              onLoadedData={() => console.log('Audio loaded')}
              onError={(e) => console.error('Audio error:', e)}
            />
          </div>
          
          {/* Waveform Display */}
          {generatedFile.waveform && generatedFile.waveform.length > 0 && (
            <div className="mb-4">
              <Waveform waveformData={generatedFile.waveform} />
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={handleDownload}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12"
          disabled={!generatedFile?.url}
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
            <span className="text-gray-400">AI Model:</span>
            <span className="text-white ml-2">MusicGen Large</span>
          </div>
          <div>
            <span className="text-gray-400">Duration:</span>
            <span className="text-white ml-2">~30s</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportScreen;
