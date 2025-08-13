/**
 * @fileoverview Multi-file upload component for document processing
 * Exports: FileUpload
 */

'use client';

import React, { useState, useRef } from 'react';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  className?: string;
  maxSizeBytes?: number;
  selectedFiles?: File[];
}

const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'text/plain', 
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export default function FileUpload({
  onFilesSelected,
  className = '',
  maxSizeBytes = 10 * 1024 * 1024, // 10MB
  selectedFiles = [],
}: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
      return 'Unsupported file type. Please upload PDF, TXT, MD, or DOCX files.';
    }
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${Math.round(maxSizeBytes / 1024 / 1024)}MB limit.`;
    }
    return null;
  };

  const handleFileSelect = (newFiles: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    for (const file of newFiles) {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
      } else {
        validFiles.push(file);
      }
    }
    
    if (errors.length > 0) {
      setError(errors.join('; '));
    } else {
      setError(null);
    }
    
    if (validFiles.length > 0) {
      const allFiles = [...selectedFiles, ...validFiles];
      onFilesSelected(allFiles);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const removeFile = (fileToRemove: File) => {
    const updatedFiles = selectedFiles.filter(file => file !== fileToRemove);
    onFilesSelected(updatedFiles);
    setError(null);
  };

  const removeAllFiles = () => {
    onFilesSelected([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-muted-foreground/50"
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,.docx"
          onChange={handleFileInputChange}
          className="hidden"
          multiple
        />
        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-1">
          Drop files here or click to select
        </p>
        <p className="text-xs text-muted-foreground">
          Supports PDF, TXT, MD, DOCX • Max {Math.round(maxSizeBytes / 1024 / 1024)}MB per file
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {selectedFiles.length} file{selectedFiles.length === 1 ? '' : 's'} selected
            </p>
            <Button variant="ghost" size="sm" onClick={removeAllFiles}>
              Clear all
            </Button>
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center gap-2 p-3 border rounded-lg">
                <File className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm flex-1 truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {Math.round(file.size / 1024)}KB
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeFile(file)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}