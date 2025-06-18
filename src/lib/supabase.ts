import { createClient } from '@supabase/supabase-js';

// Ensure environment variables are properly typed
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Validate environment variables on initialization
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create client with singleton pattern for better performance
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Type-safe bucket access
export const STORAGE_BUCKETS = {
  AUDIO: 'audio-analysis',
} as const;

// Ensure bucket exists on app initialization
export const initializeStorage = async () => {
  try {
    const { data: buckets, error } = await supabaseClient.storage.listBuckets();
    
    if (error) {
      console.error('Error checking storage buckets:', error);
      return;
    }
    
    // Check if our audio analysis bucket exists
    const bucketExists = buckets.some(bucket => bucket.name === STORAGE_BUCKETS.AUDIO);
    
    if (!bucketExists) {
      // Create bucket if it doesn't exist
      const { error: createError } = await supabaseClient.storage.createBucket(
        STORAGE_BUCKETS.AUDIO, 
        { public: true, fileSizeLimit: 5242880 } // 5MB limit
      );
      
      if (createError) {
        console.error('Error creating storage bucket:', createError);
      } else {
        console.log('Audio analysis storage bucket created successfully');
      }
    }
  } catch (err) {
    console.error('Failed to initialize storage:', err);
  }
};
