'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Bot, Loader2, ChevronsDown, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RealtimeAgent, RealtimeSession, type TransportLayerTranscriptDelta } from '@openai/agents/realtime';
import {
  selectNodeTool,
  searchAndSelectNodeTool,
  focusNodeTool,
  expandNodeTool,
  addNodeNoteTool,
  getNodeNoteTool,
  pinNodeTool,
  unpinNodeTool,
  toggleGraphFullscreenTool,
  getCurrentViewContextTool,
  showKnowledgeCardTool,
  readKnowledgeCardTool,
  readExpandedConceptTool,
  zoomToFitGraphTool,
  showChatPanelTool,
  showGraphPanelTool,
  exitFullscreenTool,
} from '@/lib/agents/tools';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceHelpOverlay from '@/components/VoiceHelpOverlay';
import { CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

export default function VoiceAgentWidget() {
  const [session, setSession] = useState<RealtimeSession | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isPTT, setIsPTT] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [history, setHistory] = useState<{ speaker: 'user' | 'assistant'; text: string }[]>([]);
  const historyRef = useRef<HTMLDivElement>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
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
        instructions: `you are a helpful ai assistant for the intellea application.
you help users explore knowledge graphs by voice.
you can select, focus on, and expand nodes in the graph.
if the user asks you to "show" them a knowledge card, use the \`show_knowledge_card\` tool to select the node and scroll to its card.
you can toggle fullscreen mode for the graph.
you can read out a knowledge card using the \`read_knowledge_card\` tool.
you can read the currently expanded concept using \`read_expanded_concept\`.
you can focus the camera on a node using the \`focus_node\` tool.
you can add notes to nodes with \`add_node_note\` and read them with \`get_node_note\`.
to understand what is currently on the screen, use the \`get_current_view_context\` tool.
you can switch views with \`show_chat_panel\` and \`show_graph_panel\`.
you can exit fullscreen with \`exit_fullscreen\`.`,
        tools: [
          selectNodeTool,
          searchAndSelectNodeTool,
          focusNodeTool,
          expandNodeTool,
          addNodeNoteTool,
          getNodeNoteTool,
          pinNodeTool,
          unpinNodeTool,
          toggleGraphFullscreenTool,
          getCurrentViewContextTool,
          showKnowledgeCardTool,
          zoomToFitGraphTool,
          readKnowledgeCardTool,
          readExpandedConceptTool,
          showChatPanelTool,
          showGraphPanelTool,
          exitFullscreenTool,
        ],
      });

      const newSession = new RealtimeSession(agent);

      newSession.on('history_added', (item: unknown) => {
        try {
          // Type guard to check if item has the expected structure
          if (
            typeof item === 'object' && 
            item !== null && 
            'type' in item && 
            'role' in item &&
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (item as any).type === 'message' && 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((item as any).role === 'user' || (item as any).role === 'assistant')
          ) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const typedItem = item as any;
            const part = typedItem.content?.find((c: unknown) => typeof c === 'object' && c !== null && ('text' in c || 'transcript' in c));
            const text = part?.text ?? part?.transcript ?? '';
            setHistory((h) => [...h, { speaker: typedItem.role, text }]);
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
          if (isPTT) {
            newSession.mute(true);
            setIsMuted(true);
          }
        } else if (status === 'disconnected') {
          setIsConnected(false);
          setSession(null);
          setIsPanelOpen(false);
          setVoiceSessionActive(false);
        }
      });
      
      newSession.on('error', (error: unknown) => {
        console.error("RealtimeSession error:", error);
        if (typeof error === 'object' && error !== null && 'error' in error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            console.error("Underlying error:", (error as any).error);
        }
      });

      await newSession.connect({ apiKey: token });
      setSession(newSession);

    } catch (error) {
      console.error('Failed to connect to voice agent:', error);
      setIsConnecting(false);
      setVoiceSessionActive(false);
    }
  }, [session, isConnecting, setVoiceSessionActive, isPTT]);

  const handleDisconnect = useCallback(() => {
    setVoiceSessionActive(false);
    setHistory([]);
    setTranscript('');
    session?.close();
  }, [session, setVoiceSessionActive]);
  
  const handleToggleMute = useCallback(() => {
    if(session){
      const newMutedState = !isMuted;
      session.mute(newMutedState);
      setIsMuted(newMutedState);
    }
  }, [session, isMuted]);

  const handleTogglePTT = () => {
    const newPTT = !isPTT;
    setIsPTT(newPTT);
    if (session) {
      session.mute(newPTT);
    }
    setIsMuted(newPTT);
  };

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'v') {
        if (isConnected) {
          handleDisconnect();
        } else if (!isConnecting) {
          handleConnect();
        }
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handleToggleMute();
      }
      if (isPTT && e.key === ' ' && !isPressing) {
        setIsPressing(true);
        session?.mute(false);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isPTT && e.key === ' ' && isPressing) {
        setIsPressing(false);
        session?.mute(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isConnected, isConnecting, handleConnect, handleDisconnect, handleToggleMute, isPTT, isPressing, session]);

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
                <Button onClick={() => setShowHelp(true)} variant="outline" size="sm">
                  <HelpCircle size={16} />
                </Button>
                <Button onClick={handleTogglePTT} variant="outline" size="sm">
                  {isPTT ? 'PTT On' : 'PTT Off'}
                </Button>
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
        <VoiceHelpOverlay open={showHelp} onClose={() => setShowHelp(false)} />
      </div>
    </>
  );
} 