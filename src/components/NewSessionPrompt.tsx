'use client';
/**
 * @fileoverview React component for new session creation prompt interface.
 * Exports: NewSessionPrompt
 */

import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Paperclip, X, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { createClient } from '@/lib/supabase/client';
import FileUpload from './FileUpload';

// Helper to create FormData with files (simplified approach)
function createFormDataWithFiles(prompt: string, files: File[]): FormData {
  const formData = new FormData();
  formData.append('prompt', prompt);
  files.forEach((file, index) => {
    formData.append(`file_${index}`, file);
  });
  return formData;
}

const NewSessionPrompt: React.FC = () => {
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const {
    prompt,
    setPrompt,
    isLoading,
    isSubscriptionLoading,
    subscriptionStatus,
  } = useAppStore(
    useShallow((state) => ({
      prompt: state.prompt,
      setPrompt: state.setPrompt,
      isLoading: state.isLoading,
      isSubscriptionLoading: state.isSubscriptionLoading,
      subscriptionStatus: state.subscriptionStatus,
    }))
  );

  const promptDisabled = isLoading || isSubscriptionLoading || subscriptionStatus !== 'active';
  const sendDisabled = promptDisabled || (!prompt.trim() && uploadedFiles.length === 0);

  const handleFilesSelected = (files: File[]) => {
    setUploadedFiles(files);
  };

  const handleSubmitWithFiles = async () => {
    if (!prompt.trim() && uploadedFiles.length === 0) return;
    if (isLoading) return;
    if (subscriptionStatus !== 'active') {
      console.error('You need an active subscription to generate new content.');
      return;
    }

    const currentPrompt = prompt;
    const activeSessionId = useAppStore.getState().currentSessionId;
    
    if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
      if (process.env.NEXT_PUBLIC_DEBUG === 'true') console.log(`Submit triggered. Prompt: "${currentPrompt}", Current Session ID: ${activeSessionId}`);
      if (uploadedFiles.length > 0) {
        if (process.env.NEXT_PUBLIC_DEBUG === 'true') console.log('Files selected:', uploadedFiles.map(f => ({name: f.name, type: f.type, size: f.size})));
        if (process.env.NEXT_PUBLIC_DEBUG === 'true') console.log('Using FormData for direct file upload...');
      }
    }

    useAppStore.getState().setLoading(true);
    useAppStore.getState().setOutput(null);
    useAppStore.getState().setActivePrompt(null);
    useAppStore.getState().setError(null);

    try {
      if (activeSessionId === null) {
        // New session creation
        if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
          if (process.env.NEXT_PUBLIC_DEBUG === 'true') console.log('Creating new session with files...', uploadedFiles.map(f => f.name));
        }
        
        const { data: { user } } = await createClient().auth.getUser();
        if (!user) {
          throw new Error('User not logged in. Cannot create session.');
        }

        // Use FormData for file uploads (simple approach)
        const response = await fetch('/api/generate', {
          method: 'POST',
          body: uploadedFiles.length > 0 
            ? createFormDataWithFiles(currentPrompt, uploadedFiles)
            : JSON.stringify({ prompt: currentPrompt }),
          headers: uploadedFiles.length > 0 
            ? {} // Let browser set Content-Type for FormData
            : { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            /* ignore */
          }
          throw new Error(errorData?.error || `HTTP error! status: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }

        // Create session with generated data
        const initialOutput = data.output;
        const rootNode = initialOutput.visualizationData?.nodes?.find((n: { isRoot?: boolean }) => n.isRoot === true);
        
        // Use LLM-generated session title, with fallbacks
        const sessionTitle = initialOutput.sessionTitle || rootNode?.label || 'Untitled Session';

        // Store all data in session_data field as per current schema
        const sessionPayload = {
          user_id: user.id,
          title: sessionTitle,
          last_prompt: currentPrompt,
          session_data: {
            visualizationData: initialOutput.visualizationData,
            knowledgeCards: initialOutput.knowledgeCards || [],
            explanationMarkdown: initialOutput.explanationMarkdown || ''
          }
        };

        const { data: sessionData, error: sessionError } = await createClient()
          .from('sessions')
          .insert(sessionPayload)
          .select('id')
          .single();

        if (sessionError || !sessionData) {
          throw new Error(`Failed to create session: ${sessionError?.message}`);
        }

        // Update store
        useAppStore.getState().setOutput(initialOutput);
        useAppStore.getState().setActivePrompt(currentPrompt);
        const store = useAppStore.getState();
        store.currentSessionId = sessionData.id;
        store.currentSessionTitle = sessionTitle;

        if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
          if (process.env.NEXT_PUBLIC_DEBUG === 'true') console.log('New session created with files. ID:', sessionData.id);
        }
      } else {
        // Existing session
        if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
          if (process.env.NEXT_PUBLIC_DEBUG === 'true') console.log(`Submitting to existing session ${activeSessionId} with files`);
        }

        const response = await fetch('/api/generate', {
          method: 'POST',
          body: uploadedFiles.length > 0 
            ? createFormDataWithFiles(currentPrompt, uploadedFiles)
            : JSON.stringify({ prompt: currentPrompt }),
          headers: uploadedFiles.length > 0 
            ? {} // Let browser set Content-Type for FormData
            : { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            /* ignore */
          }
          throw new Error(errorData?.error || `HTTP error! status: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }

        useAppStore.getState().setOutput(data.output);
        useAppStore.getState().setActivePrompt(currentPrompt);
        
        if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
          if (process.env.NEXT_PUBLIC_DEBUG === 'true') console.log(`Auto-saving session ${activeSessionId}...`);
        }
        useAppStore.getState().saveSession(createClient());
      }
    } catch (error) {
      console.error('Failed during handleSubmitWithFiles:', error);
      const errorMessage = `Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`;
      if (activeSessionId !== null) {
        useAppStore.getState().setOutput(errorMessage);
      }
      useAppStore.getState().setError(errorMessage);
      useAppStore.getState().setActivePrompt(currentPrompt);
    } finally {
      useAppStore.getState().setLoading(false);
    }
  };

  const toggleFileUpload = () => {
    setShowFileUpload(!showFileUpload);
    if (showFileUpload) {
      // Clear files when closing upload
      setUploadedFiles([]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5" />
            Start Exploring
          </CardTitle>
          <p className="text-muted-foreground">
            Ask about any topic, concept, or process to create an interactive knowledge graph
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Textarea
              placeholder={promptDisabled ? 'Activate a subscription to explore.' : 'Ask about a topic, concept, or process...'}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={promptDisabled || isLoading}
              className="resize-none min-h-[100px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!sendDisabled) handleSubmitWithFiles();
                }
              }}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFileUpload}
                disabled={promptDisabled}
                className="flex-shrink-0"
              >
                {showFileUpload ? <X className="mr-2 h-4 w-4" /> : <Paperclip className="mr-2 h-4 w-4" />}
                {showFileUpload ? 'Cancel Upload' : 'Upload Document'}
              </Button>
              <Button 
                onClick={handleSubmitWithFiles} 
                disabled={sendDisabled}
                className="flex-1"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {isLoading ? 'Generating...' : 'Start Exploring'}
              </Button>
            </div>
          </div>
          
          {showFileUpload && (
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-3">Upload Documents</h3>
              <FileUpload 
                onFilesSelected={handleFilesSelected} 
                selectedFiles={uploadedFiles}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Upload PDF, TXT, MD, or DOCX files to create a knowledge graph from their content
              </p>
            </div>
          )}

          <div className="text-center text-xs text-muted-foreground border-t pt-4">
            <p className="mb-2">Try asking about:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="bg-muted px-2 py-1 rounded text-xs">Machine Learning</span>
              <span className="bg-muted px-2 py-1 rounded text-xs">Climate Change</span>
              <span className="bg-muted px-2 py-1 rounded text-xs">Quantum Physics</span>
              <span className="bg-muted px-2 py-1 rounded text-xs">Philosophy of Mind</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewSessionPrompt;