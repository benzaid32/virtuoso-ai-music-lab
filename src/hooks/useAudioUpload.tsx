
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useAudioUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadAudioFile = async (file: File) => {
    setUploading(true);
    
    try {
      // Create a temporary URL for the uploaded file
      const url = URL.createObjectURL(file);
      
      toast({
        title: "Success",
        description: "File uploaded successfully!",
      });

      return {
        id: `temp-${Date.now()}`,
        name: file.name,
        url: url,
        waveform: []
      };
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadAudioFile, uploading };
};
