#!/usr/bin/env python
"""
Create a 10-second sample from the original audio file for testing
"""

import sys
from pydub import AudioSegment

def create_sample(input_file, output_file="sample.wav", duration_ms=10000):
    """Create a short WAV sample from the input audio file"""
    try:
        print(f"Loading audio file: {input_file}")
        audio = AudioSegment.from_file(input_file)
        
        # Take the first 10 seconds
        print(f"Creating {duration_ms/1000}s sample")
        sample = audio[:duration_ms]
        
        # Export as WAV (more compatible)
        print(f"Exporting to {output_file}")
        sample.export(output_file, format="wav")
        
        print(f"Sample created successfully: {output_file}")
        return output_file
    except Exception as e:
        print(f"Error creating sample: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python create-sample.py <input_audio_file> [output_file]")
        sys.exit(1)
        
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else "sample.wav"
    
    create_sample(input_file, output_file)
