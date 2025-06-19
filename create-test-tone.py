#!/usr/bin/env python
"""
Generate a simple test tone WAV file for audio analysis server testing
"""

import numpy as np
from scipy.io import wavfile

def create_test_tone(filename="test-tone.wav", duration=5, sample_rate=44100):
    """Create a simple test tone with a specific frequency"""
    # Generate time array
    t = np.linspace(0, duration, sample_rate * duration)
    
    # Generate a 440 Hz sine wave (A4 note)
    frequency = 440.0  # A4 note
    data = np.sin(2 * np.pi * frequency * t) * 0.5
    
    # Add a second frequency to make it more interesting (E4 note)
    frequency2 = 659.25  # E5 note
    data += np.sin(2 * np.pi * frequency2 * t) * 0.3
    
    # Add some dynamics (amplitude envelope)
    envelope = np.ones_like(data)
    attack = int(0.01 * sample_rate)
    release = int(0.5 * sample_rate)
    envelope[:attack] = np.linspace(0, 1, attack)
    envelope[-release:] = np.linspace(1, 0, release)
    data = data * envelope
    
    # Normalize to 16-bit range
    data = np.int16(data * 32767)
    
    # Save to WAV file
    print(f"Creating {duration}-second test tone at {sample_rate} Hz")
    wavfile.write(filename, sample_rate, data)
    print(f"Test tone saved to {filename}")
    return filename

if __name__ == "__main__":
    create_test_tone()
