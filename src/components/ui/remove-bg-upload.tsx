"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useRemoveBgUpload } from '@/hooks/use-remove-bg-upload';
import { cleanupObjectURL } from '@/lib/remove-bg';
import {
  Upload,
  X,
  Image as ImageIcon,
  Link,
  Loader2,
  CheckCircle,
  AlertCircle,
  Wand2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface RemoveBgUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
  disabled?: boolean;
}

export function RemoveBgUpload({
  images,
  onImagesChange,
  maxImages = 10,
  className = '',
  disabled = false,
}: RemoveBgUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const { uploadImages, isUploading, uploadProgress, isServiceAvailable, checkService } = useRemoveBgUpload();

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (disabled || isUploading) return;

    const remainingSlots = maxImages - images.length;
    if (files.length > remainingSlots) {
      toast.error(`You can only upload ${remainingSlots} more image(s)`);
      return;
    }

    // Helper function for local upload without background removal
    const uploadLocally = async (filesToUpload: FileList) => {
      const uploadPromises = Array.from(filesToUpload).map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`);
        }

        // Validate file size (max 25MB to match API limits)
        if (file.size > 25 * 1024 * 1024) {
          throw new Error(`${file.name} is too large (max 25MB)`);
        }

        // Convert to data URL for local storage
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
          reader.readAsDataURL(file);
        });
      });

      const imageUrls = await Promise.all(uploadPromises);
      onImagesChange([...images, ...imageUrls]);
      return imageUrls;
    };

    try {
      if (isServiceAvailable) {
        // Try to use Remove.bg for background removal
        try {
          const results = await uploadImages(files);
          if (results.length > 0) {
            const newImageUrls = results.map(result => result.url);
            onImagesChange([...images, ...newImageUrls]);
            return; // Success, exit early
          }
        } catch (apiError) {
          const errorMessage = apiError instanceof Error ? apiError.message : 'API error';
          
          // Check if it's an API key configuration error
          if (errorMessage.includes('API key not configured') || errorMessage.includes('Remove.bg API key')) {
            console.log('Remove.bg API key not configured, falling back to local upload');
            toast.info('💡 Configure Remove.bg API key for automatic background removal');
            
            // Fall back to local upload
            const imageUrls = await uploadLocally(files);
            toast.success(`${imageUrls.length} image(s) uploaded successfully (without background removal)`);
            return;
          } else {
            // Other API errors, still try local upload as fallback
            console.log('Remove.bg API error, falling back to local upload:', errorMessage);
            const imageUrls = await uploadLocally(files);
            toast.success(`${imageUrls.length} image(s) uploaded successfully (without background removal)`);
            toast.warning('Background removal failed, but images were uploaded successfully');
            return;
          }
        }
      }
      
      // If service is not available or no results, upload locally
      const imageUrls = await uploadLocally(files);
      toast.success(`${imageUrls.length} image(s) uploaded successfully (without background removal)`);
      if (!isServiceAvailable) {
        toast.info('💡 Configure Remove.bg API key for automatic background removal');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload images';
      toast.error(errorMessage);
    }
  }, [images, onImagesChange, maxImages, disabled, isUploading, uploadImages, isServiceAvailable]);

  const handleUrlImport = useCallback(() => {
    if (!urlInput.trim() || disabled) return;

    try {
      new URL(urlInput);
      onImagesChange([...images, urlInput.trim()]);
      setUrlInput('');
      toast.success('Image URL added successfully');
    } catch {
      toast.error('Please enter a valid URL');
    }
  }, [urlInput, images, onImagesChange, disabled]);

  const removeImage = useCallback((index: number) => {
    if (disabled) return;
    
    // Clean up object URL if it's a blob URL
    const imageUrl = images[index];
    cleanupObjectURL(imageUrl);
    
    onImagesChange(images.filter((_, i) => i !== index));
  }, [images, onImagesChange, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setDragActive(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [disabled, handleFileUpload]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Service Status */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <div className="flex items-center gap-2">
          {isServiceAvailable ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-700">
                <Wand2 className="h-3 w-3 inline mr-1" />
                Remove.bg professional background removal service is active (50MP/HD quality)
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-amber-700">
                Background removal requires Remove.bg API key configuration
              </span>
            </>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={checkService}
          disabled={isUploading}
          className="h-8"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Check Service
        </Button>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Processing images with Remove.bg...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Drag & Drop Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled || isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={disabled || isUploading}
        />

        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <ImageIcon className="h-6 w-6 text-gray-400" />
            )}
          </div>

          <div>
            <p className="text-lg font-medium text-gray-500">
              {isUploading ? 'Processing images with Remove.bg...' : 'Drop images here or click to browse'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {isServiceAvailable 
                ? 'Supports JPG, PNG, WebP up to 25MB each (Professional AI background removal with Remove.bg)'
                : 'Supports JPG, PNG, WebP up to 25MB each (Configure Remove.bg API key for background removal)'
              }
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || isUploading}
              className="pointer-events-none"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose Files
            </Button>
            <span className="text-sm text-gray-400">or</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const url = prompt('Enter image URL:');
                if (url) {
                  setUrlInput(url);
                  handleUrlImport();
                }
              }}
              disabled={disabled || isUploading}
            >
              <Link className="h-4 w-4 mr-2" />
              Add URL
            </Button>
          </div>
        </div>
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Uploaded Images ({images.length}/{maxImages})
            </h4>
            <span className="text-xs text-gray-500">
              Data size: {Math.round(JSON.stringify(images).length / 1024)}KB
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                  <img
                    src={image}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiAxNkM5Ljc5IDEzLjc5IDkuNzkgMTAuMjEgMTIgOEMxNC4yMSAxMC4yMSAxNC4yMSAxMy43OSAxMiAxNloiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+';
                    }}
                  />
                </div>
                {/* Background removal indicator for processed images */}
                {(image.startsWith('blob:') || image.startsWith('data:image/removebg-')) && (
                  <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded">
                    <Wand2 className="h-2 w-2 inline mr-0.5" />
                    Remove.bg
                  </div>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(index)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* URL Import Section */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Add Image by URL</h4>
        <div className="flex gap-2">
          <Input
            placeholder="https://example.com/image.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleUrlImport();
              }
            }}
            className="flex-1"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUrlImport}
            disabled={disabled || !urlInput.trim()}
          >
            Add
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Enter a direct link to an image file
          {!isServiceAvailable && ' (configure Remove.bg API key for background removal)'}
        </p>
      </div>
    </div>
  );
}

// Export with both names for compatibility
export { RemoveBgUpload as BackgroundRemovalUpload };
export { RemoveBgUpload as ImageKitUpload };