
import React from 'react';
import { Play, Square, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioControlsProps {
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentTime: number;
  duration: number;
}

const AudioControls: React.FC<AudioControlsProps> = ({
  isPlaying,
  setIsPlaying,
  currentTime,
  duration
}) => {
  return (
    <div className="audio-panel rounded-2xl p-6">
      <div className="flex items-center justify-center space-x-6">
        <Button
          variant="outline"
          size="lg"
          className="w-16 h-16 rounded-full border-gray-600 hover:border-yellow-400 hover:bg-yellow-400/10"
        >
          <SkipBack className="h-6 w-6" />
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          className="w-20 h-20 rounded-full border-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20 glow-gold"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? (
            <Square className="h-8 w-8 text-yellow-400" />
          ) : (
            <Play className="h-8 w-8 text-yellow-400 ml-1" />
          )}
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          className="w-16 h-16 rounded-full border-gray-600 hover:border-yellow-400 hover:bg-yellow-400/10"
        >
          <SkipForward className="h-6 w-6" />
        </Button>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <span>0:00</span>
          <div className="flex-1 bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-yellow-400 to-blue-400 h-2 rounded-full transition-all"
              style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
            />
          </div>
          <span>3:45</span>
        </div>
      </div>
    </div>
  );
};

export default AudioControls;
