'use client';

import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Paperclip, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { usePromptSubmit } from './hooks/usePromptSubmit';
import { useShallow } from 'zustand/react/shallow';
import FileUpload from './FileUpload';

const PromptFooter: React.FC = () => {
  const handleSubmit = usePromptSubmit();
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const {
    prompt,
    setPrompt,
    isLoading,
    isSubscriptionLoading,
    subscriptionStatus,
    currentSessionId,
  } = useAppStore(
    useShallow((state) => ({
      prompt: state.prompt,
      setPrompt: state.setPrompt,
      isLoading: state.isLoading,
      isSubscriptionLoading: state.isSubscriptionLoading,
      subscriptionStatus: state.subscriptionStatus,
      currentSessionId: state.currentSessionId,
    }))
  );

  const promptDisabled = isLoading || isSubscriptionLoading || (subscriptionStatus !== 'active' && !currentSessionId);
  const sendDisabled = promptDisabled || !prompt.trim();

  const handleFilesSelected = (files: File[]) => {
    setUploadedFiles(files);
  };

  const toggleFileUpload = () => {
    setShowFileUpload(!showFileUpload);
  };

  return (
    <footer className="p-4 border-t bg-background flex-shrink-0">
      <div className="max-w-6xl mx-auto w-full px-4">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex gap-2 flex-1">
              <Textarea
                placeholder={promptDisabled ? 'Activate a subscription or load a session to explore.' : 'Ask about a topic, concept, or process...'}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={promptDisabled || isLoading}
                className="flex-1 resize-none"
                rows={showFileUpload ? 3 : 1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!sendDisabled) handleSubmit();
                  }
                }}
              />
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleFileUpload}
                  disabled={promptDisabled}
                  title={showFileUpload ? 'Hide file upload' : 'Upload document'}
                >
                  {showFileUpload ? <X className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}
                </Button>
                <Button onClick={handleSubmit} disabled={sendDisabled}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
                </Button>
              </div>
            </div>
          </div>
          
          {showFileUpload && (
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-3">Upload Document</h3>
              <FileUpload 
                onFilesSelected={handleFilesSelected} 
                selectedFiles={uploadedFiles}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Upload documents to create a knowledge graph from their content
              </p>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default PromptFooter;
