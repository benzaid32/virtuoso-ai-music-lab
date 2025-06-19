#!/usr/bin/env python
"""
Enterprise Audio Analysis Test Client
Tests the professional audio analysis server with real audio files
"""

import os
import sys
import json
import requests
from pathlib import Path
import time

# Audio Analysis Server URL
SERVER_URL = "http://16.16.138.18:8000"
TIMEOUT = 120  # 2-minute timeout for analysis requests

def test_health():
    """Test the server's health endpoint"""
    try:
        response = requests.get(f"{SERVER_URL}/health", timeout=10)
        response.raise_for_status()
        health_data = response.json()
        print("\n✅ Server Health Check:")
        print(json.dumps(health_data, indent=2))
        return True
    except Exception as e:
        print(f"\n❌ Server Health Check Failed: {e}")
        return False

def analyze_audio(audio_path):
    """Analyze audio file using the professional server"""
    if not os.path.exists(audio_path):
        print(f"\n❌ Audio file not found: {audio_path}")
        return None
    
    try:
        file_size = os.path.getsize(audio_path) / (1024 * 1024)  # Size in MB
        print(f"\n🎵 Analyzing audio file: {os.path.basename(audio_path)} ({file_size:.2f} MB)")
        print(f"💡 This may take a while for longer files. Timeout set to {TIMEOUT} seconds.")
        
        start_time = time.time()
        
        # Prepare multipart/form-data
        files = {'audio': open(audio_path, 'rb')}
        
        print("📤 Uploading and processing audio file...")
        # Send audio file for analysis with extended timeout
        response = requests.post(
            f"{SERVER_URL}/analyze", 
            files=files,
            timeout=TIMEOUT
        )
        
        # Check for HTTP errors
        response.raise_for_status()
        
        # Parse and return results
        analysis_data = response.json()
        
        # Calculate processing time
        processing_time = time.time() - start_time
        print(f"✅ Analysis complete in {processing_time:.2f} seconds")
        
        return analysis_data
    except requests.exceptions.Timeout:
        print(f"\n❌ Analysis request timed out after {TIMEOUT} seconds.")
        print("   This could be due to a large audio file or server processing limitations.")
        print("   Try with a shorter audio clip or increase the TIMEOUT value.")
        return None
    except Exception as e:
        print(f"\n❌ Analysis failed: {str(e)}")
        if hasattr(e, "response") and e.response is not None:
            print(f"   Status code: {e.response.status_code}")
            try:
                print(f"   Response: {e.response.text}")
            except:
                pass
        return None
    finally:
        # Ensure file is closed
        if 'files' in locals() and 'audio' in files:
            files['audio'].close()

def main():
    """Main test function"""
    print("\n===== Professional Audio Analysis Server Test =====")
    
    # Test server health
    if not test_health():
        print("\n🛑 Server health check failed. Exiting.")
        return 1
    
    # Check for audio file argument
    if len(sys.argv) > 1:
        audio_path = sys.argv[1]
    else:
        # Default to first MP3 in audio directory
        audio_dir = Path("audio")
        if audio_dir.exists():
            mp3_files = list(audio_dir.glob("*.mp3"))
            if mp3_files:
                audio_path = str(mp3_files[0])
            else:
                print("No MP3 files found in the 'audio' directory")
                return 1
        else:
            print("No 'audio' directory found. Please provide an audio file path.")
            return 1
    
    # Analyze audio file
    result = analyze_audio(audio_path)
    
    if result:
        print("\n✅ Analysis Results:")
        print(json.dumps(result, indent=2))
        print("\n🎉 Test completed successfully!")
        return 0
    else:
        print("\n❌ Audio analysis failed.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
