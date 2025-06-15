
import React, { useRef, useEffect, useState } from 'react';
import { Play, Square, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioControlsProps {
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentTime: number;
  duration: number;
  audioUrl?: string;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
}

const AudioControls: React.FC<AudioControlsProps> = ({
  isPlaying,
  setIsPlaying,
  currentTime,
  duration,
  audioUrl,
  onTimeUpdate,
  onDurationChange
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [localDuration, setLocalDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setLocalCurrentTime(time);
      onTimeUpdate?.(time);
    };

    const handleLoadedMetadata = () => {
      const dur = audio.duration;
      setLocalDuration(dur);
      onDurationChange?.(dur);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate, onDurationChange, setIsPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  const togglePlayback = () => {
    if (!audioUrl) return;
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !localDuration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * localDuration;
    
    audio.currentTime = newTime;
    setLocalCurrentTime(newTime);
  };

  return (
    <div className="audio-panel rounded-2xl p-6">
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
      )}
      
      <div className="flex items-center justify-center space-x-6">
        <Button
          variant="outline"
          size="lg"
          className="w-16 h-16 rounded-full border-gray-600 hover:border-yellow-400 hover:bg-yellow-400/10"
          disabled={!audioUrl}
        >
          <SkipBack className="h-6 w-6" />
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          className="w-20 h-20 rounded-full border-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20 glow-gold"
          onClick={togglePlayback}
          disabled={!audioUrl}
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
          disabled={!audioUrl}
        >
          <SkipForward className="h-6 w-6" />
        </Button>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <span>{formatTime(localCurrentTime)}</span>
          <div 
            className="flex-1 bg-gray-700 rounded-full h-2 cursor-pointer"
            onClick={handleProgressClick}
          >
            <div 
              className="bg-gradient-to-r from-yellow-400 to-blue-400 h-2 rounded-full transition-all"
              style={{ width: `${localDuration ? (localCurrentTime / localDuration) * 100 : 0}%` }}
            />
          </div>
          <span>{formatTime(localDuration)}</span>
        </div>
      </div>
    </div>
  );
};

export default AudioControls;
