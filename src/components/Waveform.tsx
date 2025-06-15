
import React from 'react';

interface WaveformProps {
  waveformData: number[];
  isPlaying?: boolean;
  currentTime?: number;
}

const Waveform: React.FC<WaveformProps> = ({ 
  waveformData, 
  isPlaying = false, 
  currentTime = 0 
}) => {
  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="flex items-end justify-center space-x-1 h-24">
        {waveformData.map((amplitude, index) => {
          const height = Math.max(amplitude * 80, 2);
          const progress = currentTime * waveformData.length;
          const isPast = index < progress;
          
          return (
            <div
              key={index}
              className={`rounded-sm transition-colors duration-200 ${
                isPast 
                  ? 'bg-gradient-to-t from-yellow-400 to-yellow-300' 
                  : 'bg-gradient-to-t from-blue-400 to-blue-300'
              } ${isPlaying ? 'animate-pulse' : ''}`}
              style={{
                width: '2px',
                height: `${height}px`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Waveform;
