
import React from 'react';
import { Download, RotateCcw, Play, Pause, Volume2, Repeat } from 'lucide-react';
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
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [isLooping, setIsLooping] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const handleDownload = () => {
    if (generatedFile?.url) {
      console.log('Downloading file:', generatedFile.name);
      
      // Create download link
      const link = document.createElement('a');
      link.href = generatedFile.url;
      link.download = generatedFile.name || 'generated-music-60s.wav';
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

  const toggleLoop = () => {
    if (audioRef.current) {
      audioRef.current.loop = !isLooping;
      setIsLooping(!isLooping);
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  React.useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
      const handleLoadedMetadata = () => setDuration(audio.duration);
      const handleEnded = () => setIsPlaying(false);
      const handlePause = () => setIsPlaying(false);
      
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('pause', handlePause);
      
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('pause', handlePause);
      };
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-yellow-400 mb-2">Generation Complete! 🎵</h2>
        <p className="text-gray-400">Your AI-transformed music is ready</p>
      </div>

      {/* Success Animation */}
      <div className="text-center mb-6">
        <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4 animate-pulse-glow">
          <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
            <span className="text-green-900 font-bold">✓</span>
          </div>
        </div>
      </div>

      {/* Enhanced Audio Player */}
      {generatedFile && (
        <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
          <h3 className="text-white font-semibold mb-4">Generated File:</h3>
          <p className="text-gray-400 mb-4">{generatedFile.name}</p>
          
          {/* Enhanced Audio Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-4">
              <Button
                onClick={togglePlayback}
                variant="outline"
                size="lg"
                className="w-16 h-16 rounded-full border-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20 glow-gold"
              >
                {isPlaying ? <Pause className="w-6 h-6 text-yellow-400" /> : <Play className="w-6 h-6 text-yellow-400" />}
              </Button>
              
              <Button
                onClick={toggleLoop}
                variant="outline"
                size="sm"
                className={`border-gray-600 ${isLooping ? 'bg-blue-500/20 border-blue-400 text-blue-400' : 'text-gray-400'} hover:border-blue-400`}
              >
                <Repeat className="w-4 h-4 mr-2" />
                Loop
              </Button>
              
              <div className="flex items-center text-gray-400">
                <Volume2 className="w-4 h-4 mr-2" />
                <span className="text-sm">60s Extended</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <div 
                className="bg-gray-700 rounded-full h-3 cursor-pointer group"
                onClick={handleProgressClick}
              >
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-blue-400 h-3 rounded-full transition-all group-hover:from-yellow-300 group-hover:to-blue-300"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            
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
            <div className="mt-4">
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
          Download 60s Audio
        </Button>
        
        <Button
          onClick={onBackToImport}
          variant="outline"
          className="flex-1 border-gray-600 hover:border-yellow-400 text-gray-300 hover:text-yellow-400 h-12"
        >
          <RotateCcw className="mr-2 h-5 w-5" />
          Transform Another
        </Button>
      </div>

      {/* Enhanced File Details */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-2">Transformation Details:</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Format:</span>
            <span className="text-white ml-2">Stereo WAV</span>
          </div>
          <div>
            <span className="text-gray-400">Duration:</span>
            <span className="text-white ml-2">60 seconds</span>
          </div>
          <div>
            <span className="text-gray-400">AI Model:</span>
            <span className="text-white ml-2">MusicGen Stereo</span>
          </div>
          <div>
            <span className="text-gray-400">Method:</span>
            <span className="text-white ml-2">Audio-based Generation</span>
          </div>
        </div>
        <div className="mt-3 p-3 bg-blue-500/10 rounded border-l-4 border-blue-400">
          <p className="text-blue-300 text-xs">
            ✨ This music was generated using your uploaded audio as the foundation, 
            transformed through AI into the selected instrument/group arrangement.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExportScreen;
