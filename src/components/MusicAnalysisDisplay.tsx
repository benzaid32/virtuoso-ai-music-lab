import React, { useState } from 'react';
import { Music, Clock, Zap, Key, Target, Brain, Activity, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { MusicAnalysis } from '../lib/api/audio-service';

interface MusicAnalysisDisplayProps {
  analysis: MusicAnalysis;
  analyzing: boolean;
}

const MusicAnalysisDisplay: React.FC<MusicAnalysisDisplayProps> = ({
  analysis,
  analyzing
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Debug logging
  console.log('🔍 MusicAnalysisDisplay received analysis:', {
    hasAnalysis: !!analysis,
    beats: analysis?.beat_positions?.length || 0,
    bpm: analysis?.bpm || analysis?.tempo,
    key: analysis?.key,
    confidence: analysis?.confidence_score
  });
  
  // CRITICAL DEBUG: Check exact structure
  if (analysis) {
    console.log('🔍 CRITICAL - Full analysis object keys:', Object.keys(analysis));
    console.log('🔍 CRITICAL - beat_positions value:', analysis.beat_positions);
    console.log('🔍 CRITICAL - beat_positions type:', typeof analysis.beat_positions);
    console.log('🔍 CRITICAL - beat_positions length:', analysis.beat_positions?.length);
  }

  if (analyzing) {
    return (
      <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <Target className="w-5 h-5 text-blue-400 animate-pulse" />
          <div>
            <p className="text-blue-300 font-medium">🎯 SyncLock Architecture analyzing...</p>
            <p className="text-blue-200 text-sm">Extracting complete musical DNA with sample-accurate alignment</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const confidenceLevel = analysis.confidence_score > 0.8 ? 'Excellent' : 
                         analysis.confidence_score > 0.6 ? 'Good' : 
                         analysis.confidence_score > 0.4 ? 'Fair' : 'Poor';
  
  const confidenceColor = analysis.confidence_score > 0.8 ? 'text-green-400' : 
                         analysis.confidence_score > 0.6 ? 'text-blue-400' : 
                         analysis.confidence_score > 0.4 ? 'text-yellow-400' : 'text-orange-400';

  return (
    <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-green-400" />
          <p className="text-green-300 font-medium">🎯 SyncLock Analysis Complete</p>
          <span className={`text-xs px-2 py-1 rounded ${confidenceColor} bg-gray-800`}>
            {confidenceLevel} ({(analysis.confidence_score * 100).toFixed(1)}%)
          </span>
        </div>
        
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-1 text-gray-400 hover:text-white text-sm"
        >
          <span>Details</span>
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      
      {/* Core Musical DNA */}
      <div className="grid grid-cols-4 gap-4 text-sm mb-4">
        <div className="flex items-center space-x-2">
          <Key className="w-4 h-4 text-green-400" />
          <div>
            <p className="text-gray-400">Key</p>
            <p className="text-white font-medium">{analysis.key} {analysis.mode}</p>
            <p className="text-xs text-gray-500">{(analysis.key_confidence * 100).toFixed(0)}% confidence</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-green-400" />
          <div>
            <p className="text-gray-400">Tempo</p>
            <p className="text-white font-medium">{analysis.bpm?.toFixed(1) || analysis.tempo} BPM</p>
            <p className="text-xs text-gray-500">{((analysis.bpm_confidence || 0.5) * 100).toFixed(0)}% confidence</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-green-400" />
          <div>
            <p className="text-gray-400">Energy</p>
            <p className="text-white font-medium">{Math.round((analysis.energy || 0.5) * 100)}%</p>
            <p className="text-xs text-gray-500">{analysis.time_signature || '4/4'}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Brain className="w-4 h-4 text-green-400" />
          <div>
            <p className="text-gray-400">Analysis</p>
            <p className="text-white font-medium">{analysis.beat_positions?.length || 0} beats</p>
            <p className="text-xs text-gray-500">{(analysis.analysis_duration || 0).toFixed(1)}s analysis</p>
          </div>
        </div>
      </div>

      {/* Quality Metrics */}
      <div className="grid grid-cols-3 gap-4 text-sm mb-4">
        <div className="bg-blue-500/10 p-3 rounded">
          <p className="text-blue-300 font-medium">Sync Accuracy</p>
          <p className="text-white text-lg">{((analysis.sync_accuracy || 0.5) * 100).toFixed(1)}%</p>
        </div>
        
        <div className="bg-purple-500/10 p-3 rounded">
          <p className="text-purple-300 font-medium">Harmonic Integrity</p>
          <p className="text-white text-lg">{((analysis.harmonic_integrity || 0.5) * 100).toFixed(1)}%</p>
        </div>
        
        <div className="bg-orange-500/10 p-3 rounded">
          <p className="text-orange-300 font-medium">Rhythmic Stability</p>
          <p className="text-white text-lg">{((analysis.rhythmic_stability || 0.5) * 100).toFixed(1)}%</p>
        </div>
      </div>

      {/* Advanced Analysis Details */}
      {showAdvanced && (
        <div className="space-y-4 pt-4 border-t border-green-400/30">
          
          {/* Musical Structure */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-green-300 font-medium mb-2">Musical Structure</p>
              <div className="space-y-1">
                <p className="text-gray-400">
                  Beats: <span className="text-white">{analysis.beat_positions?.length || 0}</span>
                </p>
                <p className="text-gray-400">
                  Downbeats: <span className="text-white">{analysis.downbeat_positions?.length || 0}</span>
                </p>
                <p className="text-gray-400">
                  Chords: <span className="text-white">{analysis.chord_progression?.length || 0}</span>
                </p>
                <p className="text-gray-400">
                  Phrases: <span className="text-white">{analysis.phrase_boundaries?.length || 0}</span>
                </p>
              </div>
            </div>
            
            <div>
              <p className="text-green-300 font-medium mb-2">Generation Constraints</p>
              <div className="space-y-1">
                <p className="text-gray-400">
                  Temperature: <span className="text-white">{analysis.generation_constraints?.temperature || 0.5}</span>
                </p>
                <p className="text-gray-400">
                  Max Interval: <span className="text-white">{analysis.generation_constraints?.max_interval || 7} semitones</span>
                </p>
                <p className="text-gray-400">
                  Chord Lock: <span className="text-white">{analysis.generation_constraints?.chord_lock || 'strict'}</span>
                </p>
                <p className="text-gray-400">
                  Beat Alignment: <span className="text-white">{((analysis.generation_constraints?.beat_alignment_strength || 0.95) * 100).toFixed(0)}%</span>
                </p>
              </div>
            </div>
          </div>

          {/* Scale Constraint */}
          <div className="bg-green-500/5 p-3 rounded border-l-4 border-green-400">
            <p className="text-green-300 font-medium">Scale Constraint</p>
            <p className="text-white text-sm">{analysis.generation_constraints?.scale_constraint || `${analysis.key} ${analysis.mode} diatonic`}</p>
          </div>

          {/* Chord Progression Preview */}
          {analysis.chord_progression && analysis.chord_progression.length > 0 && (
            <div>
              <p className="text-green-300 font-medium mb-2">Chord Progression (first 8)</p>
              <div className="flex flex-wrap gap-2">
                {analysis.chord_progression.slice(0, 8).map((chord, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-gray-800 text-white text-xs rounded"
                  >
                    {chord.chord}
                  </span>
                ))}
                {analysis.chord_progression.length > 8 && (
                  <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                    +{analysis.chord_progression.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Quantum Alignment Info */}
          {analysis.quantum_alignment && (
            <div className="bg-blue-500/5 p-3 rounded border-l-4 border-blue-400">
              <p className="text-blue-300 font-medium">Quantum Time Grid</p>
              <div className="grid grid-cols-3 gap-4 text-sm mt-2">
                <p className="text-gray-400">
                  Grid Points: <span className="text-white">{analysis.quantum_alignment.grid_points?.length || 0}</span>
                </p>
                <p className="text-gray-400">
                  Sync Anchors: <span className="text-white">{analysis.quantum_alignment.sync_anchors?.length || 0}</span>
                </p>
                <p className="text-gray-400">
                  Sample Rate: <span className="text-white">{analysis.quantum_alignment.sample_rate || 44100} Hz</span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-4 p-3 bg-green-500/5 rounded border-l-4 border-green-400">
        <p className="text-green-300 text-sm font-medium">
          🎯 SyncLock Generation Guarantee
        </p>
        <p className="text-green-200 text-xs">
          AI will generate music with mathematical precision using these constraints to prevent contamination and ensure {((analysis.generation_constraints?.beat_alignment_strength || 0.95) * 100).toFixed(0)}% sync accuracy
        </p>
      </div>
    </div>
  );
};

export default MusicAnalysisDisplay;
