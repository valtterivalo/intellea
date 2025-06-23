'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Bot, Loader2, ChevronsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RealtimeAgent, RealtimeSession, type TransportLayerTranscriptDelta } from '@openai/agents/realtime';
import {
  selectNodeTool,
  focusNodeTool,
  expandNodeTool,
  toggleGraphFullscreenTool,
  getCurrentViewContextTool,
  scrollToKnowledgeCardsTool,
  scrollToExplanationTool,
  zoomToFitGraphTool,
} from '@/lib/agents/tools';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

export default function VoiceAgentWidget() {
  const [session, setSession] = useState<RealtimeSession | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [history, setHistory] = useState<{ speaker: 'user' | 'assistant'; text: string }[]>([]);
  const historyRef = useRef<HTMLDivElement>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { setVoiceSessionActive } = useAppStore.getState();

  const handleConnect = useCallback(async () => {
    if (session || isConnecting) return;

    setIsConnecting(true);
    try {
      const response = await fetch('/api/realtime/token', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to get token');
      const { token } = await response.json();

      const agent = new RealtimeAgent({
        name: 'Intellea Voice Assistant',
        instructions: 'You are a helpful AI assistant for the Intellea application. You can help users explore knowledge graphs by voice. You can select, focus on, and expand nodes in the graph, and toggle fullscreen mode for the graph. You can also focus the camera on a node using the `focus_node` tool. To understand what is currently on the screen, use the `get_current_view_context` tool.',
        tools: [
          selectNodeTool,
          focusNodeTool,
          expandNodeTool,
          toggleGraphFullscreenTool,
          getCurrentViewContextTool,
          scrollToKnowledgeCardsTool,
          scrollToExplanationTool,
          zoomToFitGraphTool,
        ],
      });

      const newSession = new RealtimeSession(agent);

      newSession.on('history_added', (item: any) => {
        try {
          if (item.type === 'message' && (item.role === 'user' || item.role === 'assistant')) {
            const part = item.content?.find((c: any) => 'text' in c || 'transcript' in c);
            const text = part?.text ?? part?.transcript ?? '';
            setHistory((h) => [...h, { speaker: item.role, text }]);
          }
        } catch (err) {
          console.error('Failed to parse history item', err);
        }
      });

      newSession.transport.on('audio_transcript_delta', (delta: TransportLayerTranscriptDelta) => {
        setTranscript(prev => prev + delta.delta);
      });
      
      newSession.transport.on('turn_done', () => {
        setTranscript('');
      });

      newSession.transport.on('connection_change', (status) => {
        if (status === 'connected') {
          setIsConnected(true);
          setIsConnecting(false);
          setIsPanelOpen(true);
          setVoiceSessionActive(true);
        } else if (status === 'disconnected') {
          setIsConnected(false);
          setSession(null);
          setIsPanelOpen(false);
          setVoiceSessionActive(false);
        }
      });
      
      newSession.on('error', (error: any) => {
        console.error("RealtimeSession error:", error);
        if (error?.error) {
            console.error("Underlying error:", error.error);
        }
      });

      await newSession.connect({ apiKey: token });
      setSession(newSession);

    } catch (error) {
      console.error('Failed to connect to voice agent:', error);
      setIsConnecting(false);
      setVoiceSessionActive(false);
    }
  }, [session, isConnecting, setVoiceSessionActive]);

  const handleDisconnect = () => {
    setVoiceSessionActive(false);
    setHistory([]);
    setTranscript('');
    session?.close();
  };
  
  const handleToggleMute = () => {
    if(session){
      const newMutedState = !isMuted;
      session.mute(newMutedState);
      setIsMuted(newMutedState);
    }
  }

  useEffect(() => {
    const el = historyRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [history, transcript]);

  const handleClearHistory = () => {
    setHistory([]);
  }

  const togglePanel = () => {
    if (isConnected) {
      setIsPanelOpen(prev => !prev);
    }
  };

  const getStatusText = () => {
    if (isConnecting) return "Connecting...";
    if (isConnected) return "Connected";
    return "Disconnected";
  }

  const handleFabClick = () => {
    if (isConnected) {
      togglePanel();
    } else {
      handleConnect();
    }
  }

  return (
    <>
      <div className="fixed bottom-8 right-8 z-50 flex items-end gap-2">
        <AnimatePresence>
          {isPanelOpen && isConnected && (
            <motion.div
              className="w-80 bg-card rounded-lg shadow-xl border flex flex-col"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
                <CardTitle className="text-base">Voice Assistant</CardTitle>
                 <div className="flex items-center gap-1">
                    <span className={cn("h-2 w-2 rounded-full", isConnected ? "bg-green-500" : "bg-red-500")}></span>
                    <span className="text-xs text-muted-foreground">{getStatusText()}</span>
                </div>
              </CardHeader>
              <CardContent className="p-3 h-40 overflow-y-auto text-sm">
                <div ref={historyRef} className="space-y-2">
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      className={item.speaker === 'user' ? 'text-right' : 'text-left'}
                    >
                      <span
                        className={
                          item.speaker === 'user'
                            ? 'bg-primary text-primary-foreground inline-block rounded px-2 py-1'
                            : 'bg-muted inline-block rounded px-2 py-1'
                        }
                      >
                        {item.text}
                      </span>
                    </div>
                  ))}
                  {transcript && (
                    <div className="text-right">
                      <span className="bg-primary text-primary-foreground inline-block rounded px-2 py-1">
                        {transcript}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="p-3 border-t flex justify-end gap-2">
                <Button onClick={handleToggleMute} variant="outline" size="sm">
                  {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                </Button>
                <Button onClick={handleClearHistory} variant="outline" size="sm">
                  Clear
                </Button>
                <Button onClick={handleDisconnect} variant="destructive" size="sm">
                  Disconnect
                </Button>
              </CardFooter>
            </motion.div>
          )}
        </AnimatePresence>
        
        <Button
          size="icon"
          className="rounded-full w-16 h-16 shadow-lg"
          onClick={handleFabClick}
          disabled={isConnecting}
        >
          {isConnecting ? <Loader2 className="animate-spin" /> : isConnected ? (isPanelOpen ? <ChevronsDown /> : <Mic />) : <Bot />}
        </Button>
      </div>
    </>
  );
} 