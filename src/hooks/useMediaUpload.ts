// src/hooks/useMediaUpload.ts (Enhanced)
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '@/lib/api/client';
import toast from 'react-hot-toast';

interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
  progress: number;
  uploading: boolean;
  url?: string;
}

export function useMediaUpload() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'video',
      progress: 0,
      uploading: false,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true,
  });
  
  const uploadFiles = async (onProgress?: (progress: number) => void): Promise<string[]> => {
    setIsUploading(true);
    const uploadedUrls: string[] = [];
    
    for (const mediaFile of files) {
      if (mediaFile.uploading) continue;
      
      const formData = new FormData();
      formData.append('file', mediaFile.file);
      
      try {
        setFiles((prev) =>
          prev.map((f) =>
            f.file === mediaFile.file ? { ...f, uploading: true } : f
          )
        );
        
        const response = await api.post('/upload/', formData, {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setFiles((prev) =>
                prev.map((f) =>
                  f.file === mediaFile.file
                    ? { ...f, progress: percentCompleted }
                    : f
                )
              );
              onProgress?.(percentCompleted);
            }
          },
        });
        
        const url = response.data.url;
        uploadedUrls.push(url);
        
        setFiles((prev) =>
          prev.map((f) =>
            f.file === mediaFile.file
              ? { ...f, uploading: false, url, progress: 100 }
              : f
          )
        );
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${mediaFile.file.name}`);
        setFiles((prev) =>
          prev.map((f) =>
            f.file === mediaFile.file
              ? { ...f, uploading: false, progress: 0 }
              : f
          )
        );
      }
    }
    
    setIsUploading(false);
    return uploadedUrls;
  };
  
  const removeFile = (index: number) => {
    const file = files[index];
    if (file.preview) {
      URL.revokeObjectURL(file.preview);
    }
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };
  
  const clearFiles = () => {
    files.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
  };
  
  return {
    files,
    isUploading,
    getRootProps,
    getInputProps,
    isDragActive,
    uploadFiles,
    removeFile,
    clearFiles,
  };
}
