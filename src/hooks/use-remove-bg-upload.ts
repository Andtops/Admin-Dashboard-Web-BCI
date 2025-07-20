import { useState, useCallback, useEffect } from 'react';
import { 
  removeBackground, 
  removeBackgroundBatch, 
  checkRemoveBgService,
  type BackgroundRemovalResult
} from '@/lib/remove-bg';
import { toast } from 'sonner';

interface UseRemoveBgUploadReturn {
  uploadImage: (file: File) => Promise<BackgroundRemovalResult | null>;
  uploadImages: (files: FileList | File[]) => Promise<BackgroundRemovalResult[]>;
  isUploading: boolean;
  uploadProgress: number;
  isServiceAvailable: boolean;
  checkService: () => Promise<void>;
}

export function useRemoveBgUpload(): UseRemoveBgUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isServiceAvailable, setIsServiceAvailable] = useState(false);

  // Check if Remove.bg service is available
  const checkService = useCallback(async () => {
    try {
      const available = await checkRemoveBgService();
      setIsServiceAvailable(available);
      
      console.log('Remove.bg service available:', available);
    } catch (error) {
      console.error('Remove.bg service check failed:', error);
      setIsServiceAvailable(false);
    }
  }, []);

  // Check service availability on mount
  useEffect(() => {
    checkService();
  }, [checkService]);

  const uploadImage = useCallback(async (file: File): Promise<BackgroundRemovalResult | null> => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(`${file.name} is not an image file`);
      return null;
    }

    // Validate file size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      toast.error(`${file.name} is too large (max 25MB)`);
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await removeBackground(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast.success(`${file.name} processed successfully - background removed with Remove.bg`);
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      // Re-throw the error so the component can handle it
      throw error;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, []);

  const uploadImages = useCallback(async (
    files: FileList | File[]
  ): Promise<BackgroundRemovalResult[]> => {
    const fileArray = Array.from(files);
    
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const results = await removeBackgroundBatch(
        fileArray,
        (completed, total) => {
          setUploadProgress((completed / total) * 100);
        }
      );
      
      setUploadProgress(100);
      
      if (results.length > 0) {
        toast.success(`${results.length} image(s) processed successfully - backgrounds removed with Remove.bg`);
      } else {
        console.log('No images were processed successfully');
      }
      
      return results;
    } catch (error) {
      console.error('Batch upload error:', error);
      // Re-throw the error so the component can handle it
      throw error;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, []);

  return {
    uploadImage,
    uploadImages,
    isUploading,
    uploadProgress,
    isServiceAvailable,
    checkService,
  };
}