// Remove.bg background removal service
export interface BackgroundRemovalResult {
  url: string;
  fileName: string;
  originalSize: number;
  processedSize: number;
}

// Check if Remove.bg service is available
export async function checkRemoveBgService(): Promise<boolean> {
  try {
    const response = await fetch('/api/remove-background', {
      method: 'GET',
    });
    
    if (response.ok) {
      const data = await response.json();
      // Check if Remove.bg provider is available
      return data.provider && data.provider.available;
    }
    
    return false;
  } catch (error) {
    console.error('Remove.bg service check failed:', error);
    return false;
  }
}

// Remove background from image using Remove.bg API
export async function removeBackground(file: File): Promise<BackgroundRemovalResult> {
  try {
    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    if (file.size > 25 * 1024 * 1024) {
      throw new Error('File size must be less than 25MB');
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);

    // Call Remove.bg background removal API
    const response = await fetch('/api/remove-background', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.details || errorMessage;
      } catch {
        // If response is not JSON, use status text
      }
      throw new Error(errorMessage);
    }

    // Get the processed image blob
    const blob = await response.blob();
    
    // Get metadata from response headers
    const fileName = response.headers.get('X-File-Name') || 
                    `${file.name.split('.')[0]}_bg_removed_${Date.now()}.png`;
    const originalSize = parseInt(response.headers.get('X-Original-Size') || '0');
    const processedSize = parseInt(response.headers.get('X-Processed-Size') || '0');

    // Convert blob to data URL for permanent storage
    const url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        // Add a marker to identify remove.bg processed images
        const markedDataUrl = dataUrl.replace('data:image/', 'data:image/removebg-');
        resolve(markedDataUrl);
      };
      reader.onerror = () => reject(new Error('Failed to convert processed image to data URL'));
      reader.readAsDataURL(blob);
    });

    console.log('Background removed successfully using Remove.bg');

    return {
      url,
      fileName,
      originalSize: originalSize || file.size,
      processedSize: processedSize || blob.size,
    };

  } catch (error) {
    console.error('Remove.bg background removal failed:', error);
    throw error;
  }
}

// Remove background from multiple files
export async function removeBackgroundBatch(
  files: File[],
  onProgress?: (completed: number, total: number) => void
): Promise<BackgroundRemovalResult[]> {
  const results: BackgroundRemovalResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    try {
      const result = await removeBackground(files[i]);
      results.push(result);
      
      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    } catch (error) {
      console.error(`Failed to process file ${files[i].name}:`, error);
      // Continue with other files even if one fails
    }
  }
  
  return results;
}

// Convert data URL to File object
export function dataURLtoFile(dataURL: string, filename: string): File {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
}

// Convert File to data URL
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Cleanup object URLs to prevent memory leaks
export function cleanupObjectURL(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
  // Data URLs don't need cleanup as they're just strings
}