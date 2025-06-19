#!/usr/bin/env python3
"""
Enterprise Audio Analysis Test Client
Tests the professional audio analysis server with robust error handling
"""

import requests
import json
import os
import sys
import time
from typing import Dict, Any, Optional
import argparse

class EnterpriseAudioTester:
    """Professional Audio Analysis Test Client"""
    
    def __init__(self, server_url: str = None):
        """Initialize with server URL, defaulting to EC2 if not provided"""
        self.server_url = server_url or "http://16.16.138.18:8000"
        self.health_endpoint = f"{self.server_url}/health"
        self.analyze_endpoint = f"{self.server_url}/analyze"
        print("\n===== Professional Audio Analysis Server Test =====\n")
    
    def check_health(self) -> bool:
        """Verify server health with proper enterprise error handling"""
        try:
            print("✅ Server Health Check:")
            response = requests.get(
                self.health_endpoint, 
                timeout=10
            )
            response.raise_for_status()
            health_data = response.json()
            print(json.dumps(health_data, indent=2))
            
            if health_data.get("status") == "healthy":
                return True
            else:
                print(f"❌ Server reports unhealthy status: {health_data}")
                return False
                
        except requests.exceptions.ConnectionError:
            print(f"❌ Connection failed: Could not connect to {self.server_url}")
            print("   Please verify your network connection and server availability.")
            return False
        except requests.exceptions.Timeout:
            print(f"❌ Request timed out: Server at {self.server_url} is not responding")
            return False
        except requests.exceptions.RequestException as e:
            print(f"❌ Health check failed: {str(e)}")
            return False
    
    def analyze_audio(self, audio_path: str) -> Optional[Dict[str, Any]]:
        """
        Analyze audio file with enterprise-grade error handling
        Returns analysis results or None if analysis failed
        """
        if not os.path.exists(audio_path):
            print(f"❌ Error: Audio file not found: {audio_path}")
            return None
            
        file_size_mb = os.path.getsize(audio_path) / (1024 * 1024)
        print(f"📊 Audio file: {os.path.basename(audio_path)} ({file_size_mb:.2f} MB)")
            
        try:
            print(f"📤 Uploading and analyzing audio file...")
            start_time = time.time()
            
            with open(audio_path, "rb") as audio_file:
                files = {"audio": (os.path.basename(audio_path), audio_file)}
                response = requests.post(
                    self.analyze_endpoint,
                    files=files,
                    timeout=120  # Extended timeout for large files
                )
                
            response.raise_for_status()
            result = response.json()
            
            # Calculate processing time
            processing_time = time.time() - start_time
            print(f"⏱️ Analysis completed in {processing_time:.2f} seconds\n")
            
            if result.get("success"):
                analysis = result.get("analysis", {})
                
                # Print key musical features
                print(f"🎵 Musical Features:")
                print(f"  • Key: {analysis.get('key')} {analysis.get('scale')}")
                print(f"  • Tempo: {analysis.get('tempo'):.1f} BPM")
                print(f"  • Confidence: {analysis.get('confidence', 0):.2f}")
                print(f"  • Energy: {analysis.get('energy', 0):.2f}")
                print(f"  • Duration: {analysis.get('duration'):.2f} seconds")
                print(f"  • Beat Count: {len(analysis.get('beat_times', []))}")
                print(f"  • Onset Count: {len(analysis.get('onset_times', []))}")
                
                print("\n✅ Analysis successful!")
                return analysis
            else:
                print(f"❌ Server returned error: {result.get('message')}")
                return None
                
        except requests.exceptions.ConnectionError:
            print(f"❌ Connection failed during analysis")
            return None
        except requests.exceptions.Timeout:
            print(f"❌ Analysis timed out - file may be too large or complex")
            return None
        except requests.exceptions.HTTPError as e:
            print(f"❌ HTTP error: {e}")
            if response.status_code == 400:
                print(f"   Bad request: {response.text}")
            elif response.status_code == 500:
                print(f"   Server error: {response.text}")
            return None
        except requests.exceptions.RequestException as e:
            print(f"❌ Analysis request failed: {str(e)}")
            return None
        except Exception as e:
            print(f"❌ Unexpected error: {str(e)}")
            return None

def main():
    """Main function to run the Enterprise Audio Tester"""
    parser = argparse.ArgumentParser(description="Enterprise Audio Analysis Tester")
    parser.add_argument("audio_file", help="Audio file path to analyze")
    parser.add_argument("--server", help="Server URL (defaults to EC2 instance)", default=None)
    args = parser.parse_args()
    
    # Create enterprise tester
    tester = EnterpriseAudioTester(args.server)
    
    # Run health check
    if tester.check_health():
        print("\n🚀 Server is healthy, proceeding with analysis\n")
        # Analyze audio file
        analysis = tester.analyze_audio(args.audio_file)
        if analysis:
            return 0
        else:
            return 1
    else:
        print("\n❌ Server health check failed. Please verify server status.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
