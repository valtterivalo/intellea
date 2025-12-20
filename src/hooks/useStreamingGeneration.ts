/**
 * @fileoverview React hook for consuming streaming graph generation with progress updates.
 * Exports: useStreamingGeneration
 */
import { useState, useCallback, useRef } from 'react';
import type { StreamingEvent } from '@/types/streaming';
import type { IntelleaResponse } from '@/types/intellea';

export interface StreamingState {
  isLoading: boolean;
  progress: number;
  message: string;
  stage?: string;
  data?: Partial<IntelleaResponse>;
  finalData?: IntelleaResponse;
  error?: string;
}

export interface UseStreamingGenerationResult {
  state: StreamingState;
  startGeneration: (params: GenerationParams) => Promise<void>;
  cancelGeneration: () => void;
}

export interface GenerationParams {
  prompt: string;
  files?: File[];
  isDemo?: boolean;
}

export interface StreamingCallbacks {
  onComplete?: (data: IntelleaResponse) => void;
  onError?: (message: string) => void;
}

export function useStreamingGeneration(callbacks: StreamingCallbacks = {}): UseStreamingGenerationResult {
  const [state, setState] = useState<StreamingState>({
    isLoading: false,
    progress: 0,
    message: '',
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const callbacksRef = useRef<StreamingCallbacks>(callbacks);
  callbacksRef.current = callbacks;

  const startGeneration = useCallback(async ({ prompt, files = [], isDemo = false }: GenerationParams) => {
    // Cancel any existing generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setState({
      isLoading: true,
      progress: 0,
      message: 'Starting generation...',
      data: undefined,
      finalData: undefined,
      error: undefined,
    });

    try {
      // Prepare request body
      let body: FormData | string;
      const headers: Record<string, string> = {};

      if (files.length > 0) {
        // Use FormData for file uploads
        const formData = new FormData();
        formData.append('prompt', prompt);
        if (isDemo) formData.append('isDemo', 'true');
        files.forEach((file, index) => {
          formData.append(`file_${index}`, file);
        });
        body = formData;
      } else {
        // Use JSON for text-only requests
        body = JSON.stringify({ prompt, isDemo });
        headers['Content-Type'] = 'application/json';
      }

      // Start streaming request
      const response = await fetch('/api/generate/stream', {
        method: 'POST',
        headers,
        body,
        signal: abortController.signal,
      });

      if (!response.ok) {
        let errorData: { error?: string } | undefined;
        try {
          errorData = await response.json();
        } catch {
          // ignore
        }
        
        // Handle specific status codes
        if (response.status === 429) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: errorData?.error || 'Rate limit exceeded. Please try again later.',
          }));
          callbacksRef.current.onError?.(errorData?.error || 'Rate limit exceeded. Please try again later.');
          return;
        }
        
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const eventData = JSON.parse(line.slice(6));
                handleStreamingEvent(eventData, setState, callbacksRef);
              } catch (error) {
                console.error('Error parsing streaming event:', error, 'Line:', line);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      if (abortController.signal.aborted) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          message: 'Generation cancelled',
        }));
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        callbacksRef.current.onError?.(errorMessage);
      }
    }
  }, []);

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    state,
    startGeneration,
    cancelGeneration,
  };
}

function handleStreamingEvent(
  event: StreamingEvent,
  setState: React.Dispatch<React.SetStateAction<StreamingState>>,
  callbacksRef: React.MutableRefObject<StreamingCallbacks>
) {
  switch (event.type) {
    case 'status':
      setState(prev => ({
        ...prev,
        message: event.message,
        progress: event.progress ?? prev.progress,
        stage: event.stage,
      }));
      break;

    case 'graph-partial':
      setState(prev => ({
        ...prev,
        data: event.data,
        message: event.nodeCount && event.linkCount 
          ? `Building graph... (${event.nodeCount} nodes, ${event.linkCount} connections)`
          : prev.message,
      }));
      break;

    case 'embeddings-started':
      setState(prev => ({
        ...prev,
        message: `Calculating embeddings for ${event.totalNodes} nodes...`,
      }));
      break;

    case 'embeddings-progress':
      setState(prev => ({
        ...prev,
        message: `Processing embeddings... (${event.completed}/${event.total})`,
        progress: Math.min(85, 70 + ((event.completed / event.total) * 15)),
      }));
      break;

    case 'positioning-started':
      const positioningMessages = {
        'umap-init': 'Initializing 3D positioning...',
        'umap-calculate': 'Calculating optimal positions...',
        'centering': 'Centering around root node...',
      };
      setState(prev => ({
        ...prev,
        message: positioningMessages[event.stage] || 'Positioning nodes...',
      }));
      break;

    case 'positioning-progress':
      setState(prev => ({
        ...prev,
        progress: Math.min(95, 85 + (event.progress * 0.1)),
      }));
      break;

    case 'documents-processing':
      setState(prev => ({
        ...prev,
        message: `Processing ${event.fileName}... (${event.progress}/${event.total})`,
        progress: Math.min(20, 5 + ((event.progress / event.total) * 15)),
      }));
      break;

    case 'file-upload-started':
      setState(prev => ({
        ...prev,
        message: `Starting upload: ${event.fileName} (${Math.round(event.fileSize / 1024)} KB)`,
      }));
      break;

    case 'file-upload-progress':
      const uploadStageMessages = {
        'converting': `Converting ${event.fileName}...`,
        'uploading': `Uploading ${event.fileName} to OpenAI...`,
        'processing': `OpenAI processing ${event.fileName}...`,
        'adding-to-vectorstore': `Adding ${event.fileName} to knowledge base...`
      };
      setState(prev => ({
        ...prev,
        message: uploadStageMessages[event.stage],
      }));
      break;

    case 'file-upload-complete':
      setState(prev => ({
        ...prev,
        message: `Completed: ${event.fileName}`,
      }));
      break;

    case 'complete':
      setState(prev => ({
        ...prev,
        isLoading: false,
        progress: 100,
        message: 'Knowledge graph ready!',
        finalData: event.data,
      }));
      callbacksRef.current.onComplete?.(event.data);
      break;

    case 'error':
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: event.error,
        stage: event.stage,
      }));
      callbacksRef.current.onError?.(event.error);
      break;

    default:
      console.log('Unknown streaming event type:', event);
  }
}
