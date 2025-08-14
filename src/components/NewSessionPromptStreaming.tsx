'use client';
/**
 * @fileoverview React component for new session creation with streaming progress.
 * Exports: NewSessionPromptStreaming
 */

import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Paperclip, X, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { createClient } from '@/lib/supabase/client';
import { useStreamingGeneration } from '@/hooks/useStreamingGeneration';
import FileUpload from './FileUpload';
import StreamingProgress from './StreamingProgress';

interface NewSessionPromptStreamingProps {
  isDemo?: boolean;
}

const NewSessionPromptStreaming: React.FC<NewSessionPromptStreamingProps> = ({ isDemo = false }) => {
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const streaming = useStreamingGeneration();

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

  // Handle streaming completion
  useEffect(() => {
    if (streaming.state.finalData && !streaming.state.isLoading) {
      const finalData = streaming.state.finalData;
      const store = useAppStore.getState();
      
      // Update store with final data
      store.setOutput(finalData);
      store.setActivePrompt(prompt);
      
      if (isDemo) {
        // For demo mode, set demo session
        store.currentSessionId = 'demo-session';
        store.currentSessionTitle = `${finalData.sessionTitle} (Demo)`;
        store.setPrompt('');
      } else {
        // For authenticated users, create session in Supabase
        createSessionInSupabase(finalData, prompt);
      }
    }
  }, [streaming.state.finalData, streaming.state.isLoading, isDemo, prompt]);

  // Handle streaming errors
  useEffect(() => {
    if (streaming.state.error) {
      const store = useAppStore.getState();
      store.setError(streaming.state.error);
    }
  }, [streaming.state.error]);

  const createSessionInSupabase = async (data: typeof streaming.state.finalData, lastPrompt: string) => {
    if (!data) return;
    
    try {
      const { data: { user } } = await createClient().auth.getUser();
      if (!user) {
        console.error('User not found when creating session');
        return;
      }
      
      const sessionPayload = {
        user_id: user.id,
        title: data.sessionTitle,
        last_prompt: lastPrompt,
        session_data: {
          visualizationData: data.visualizationData,
          knowledgeCards: data.knowledgeCards || [],
          explanationMarkdown: data.explanationMarkdown || ''
        }
      };

      const { data: sessionData, error: sessionError } = await createClient()
        .from('sessions')
        .insert(sessionPayload)
        .select('id')
        .single();

      if (sessionError || !sessionData) {
        console.error('Failed to create session:', sessionError?.message);
        return;
      }

      const store = useAppStore.getState();
      store.currentSessionId = sessionData.id;
      store.currentSessionTitle = data.sessionTitle;
      
      if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        console.log('New session created. ID:', sessionData.id);
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const promptDisabled = streaming.state.isLoading || isLoading || isSubscriptionLoading || (!isDemo && subscriptionStatus !== 'active');
  const sendDisabled = promptDisabled || (!prompt.trim() && uploadedFiles.length === 0);

  const handleFilesSelected = (files: File[]) => {
    setUploadedFiles(files);
  };

  const handleSubmitWithStreaming = async () => {
    if (!prompt.trim() && uploadedFiles.length === 0) return;
    if (streaming.state.isLoading) return;
    if (!isDemo && subscriptionStatus !== 'active') {
      console.error('You need an active subscription to generate new content.');
      return;
    }

    const currentPrompt = prompt;
    const activeSessionId = useAppStore.getState().currentSessionId;

    if (activeSessionId !== null) {
      console.log('Expansion not yet supported in streaming mode');
      return;
    }

    // For authenticated users, verify auth
    if (!isDemo) {
      const { data: { user } } = await createClient().auth.getUser();
      if (!user) {
        console.error('User not logged in. Cannot create session.');
        return;
      }
    }

    // Start streaming generation
    await streaming.startGeneration({
      prompt: currentPrompt,
      files: uploadedFiles,
      isDemo,
    });
  };

  const toggleFileUpload = () => {
    setShowFileUpload(!showFileUpload);
    if (showFileUpload) {
      setUploadedFiles([]);
    }
  };

  // Show streaming progress if generation is active
  if (streaming.state.isLoading || streaming.state.error) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <StreamingProgress 
          state={streaming.state}
          onCancel={streaming.cancelGeneration}
          showCancel={true}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5" />
            Start Exploring
          </CardTitle>
          <p className="text-muted-foreground">
            {isDemo ? 
              'Try our interactive knowledge graphs with any topic (text-only demo)' :
              'Ask about any topic, concept, or process to create an interactive knowledge graph'
            }
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Textarea
              placeholder={
                promptDisabled ? 
                  (isDemo ? 'Loading demo...' : 'Activate a subscription to explore.') :
                  'Ask about a topic, concept, or process...'
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={promptDisabled}
              className="resize-none min-h-[100px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!sendDisabled) handleSubmitWithStreaming();
                }
              }}
            />
            <div className="flex gap-2">
              {!isDemo && (
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
              )}
              <Button 
                onClick={handleSubmitWithStreaming} 
                disabled={sendDisabled}
                className="flex-1"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isDemo ? 'Try Demo' : 'Start Exploring'}
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

          {isDemo && (
            <div className="text-center text-xs text-muted-foreground border-t pt-4 mt-4">
              <p className="mb-1">Demo limitations:</p>
              <p>• Text-only topics (no file uploads)</p>
              <p>• No session saving</p>
              <p className="mt-2">
                <strong>Sign up for full access</strong> - unlimited sessions, document uploads, and more
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NewSessionPromptStreaming;