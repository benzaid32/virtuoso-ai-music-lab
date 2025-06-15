
import React from 'react';
import { Music, Clock, Zap, Key } from 'lucide-react';
import { MusicAnalysis } from '../hooks/useMusicAnalysis';

interface MusicAnalysisDisplayProps {
  analysis: MusicAnalysis;
  analyzing: boolean;
}

const MusicAnalysisDisplay: React.FC<MusicAnalysisDisplayProps> = ({
  analysis,
  analyzing
}) => {
  if (analyzing) {
    return (
      <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <Music className="w-5 h-5 text-blue-400 animate-pulse" />
          <div>
            <p className="text-blue-300 font-medium">Analyzing your music...</p>
            <p className="text-blue-200 text-sm">Detecting key, tempo, and energy</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const confidenceLevel = analysis.confidence > 0.7 ? 'High' : 
                         analysis.confidence > 0.4 ? 'Medium' : 'Low';
  
  const confidenceColor = analysis.confidence > 0.7 ? 'text-green-400' : 
                         analysis.confidence > 0.4 ? 'text-yellow-400' : 'text-orange-400';

  return (
    <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
        <Music className="w-5 h-5 text-green-400" />
        <p className="text-green-300 font-medium">Music Analysis Complete</p>
        <span className={`text-xs px-2 py-1 rounded ${confidenceColor} bg-gray-800`}>
          {confidenceLevel} Confidence
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <Key className="w-4 h-4 text-green-400" />
          <div>
            <p className="text-gray-400">Key</p>
            <p className="text-white font-medium">{analysis.key} {analysis.mode}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-green-400" />
          <div>
            <p className="text-gray-400">Tempo</p>
            <p className="text-white font-medium">{analysis.tempo} BPM</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-green-400" />
          <div>
            <p className="text-gray-400">Energy</p>
            <p className="text-white font-medium">{Math.round(analysis.energy)}%</p>
          </div>
        </div>
      </div>
      
      <div className="mt-3 p-3 bg-green-500/5 rounded border-l-4 border-green-400">
        <p className="text-green-300 text-xs">
          ✨ AI will generate new music that matches these musical characteristics
        </p>
      </div>
    </div>
  );
};

export default MusicAnalysisDisplay;
