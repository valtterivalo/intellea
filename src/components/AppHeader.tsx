'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  LogOut,
  PanelLeft,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  CreditCard,
  Info,
} from 'lucide-react';
import SearchNodes from '@/components/SearchNodes';
import { createClient } from '@/lib/supabase/client';
import {
  useAppStore,
  SessionSummary,
} from '@/store/useAppStore';
import { useShallow } from 'zustand/react/shallow';

interface AppHeaderProps {
  onShowOnboarding: () => void;
  onSubscribe: () => Promise<void>;
  isCheckoutLoading: boolean;
}

export default function AppHeader({ onShowOnboarding, onSubscribe, isCheckoutLoading }: AppHeaderProps) {
  const supabase = createClient();
  const router = useRouter();

  const {
    sessionsList,
    currentSessionId,
    currentSessionTitle,
    isSessionListLoading,
    isSessionLoading,
    isSavingSession,
    error,
    subscriptionStatus,
    isSubscriptionLoading,
  } = useAppStore(useShallow((state) => ({
    sessionsList: state.sessionsList,
    currentSessionId: state.currentSessionId,
    currentSessionTitle: state.currentSessionTitle,
    isSessionListLoading: state.isSessionListLoading,
    isSessionLoading: state.isSessionLoading,
    isSavingSession: state.isSavingSession,
    error: state.error,
    subscriptionStatus: state.subscriptionStatus,
    isSubscriptionLoading: state.isSubscriptionLoading,
  })));

  const {
    fetchSessions,
    fetchSubscriptionStatus,
    loadSession,
    saveSession,
    deleteSession,
    updateSessionTitleLocally,
    resetActiveSessionState,
    setError,
  } = useAppStore.getState();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  useEffect(() => {
    const getUserAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        fetchSessions(supabase, session.user.id);
        fetchSubscriptionStatus(supabase, session.user.id);
      } else {
        resetActiveSessionState();
      }
    };
    getUserAndFetch();
  }, [fetchSessions, fetchSubscriptionStatus, supabase, resetActiveSessionState]);

  useEffect(() => {
    const persistedSessionId = useAppStore.getState().currentSessionId;
    if (persistedSessionId) {
      const alreadyLoaded =
        useAppStore.getState().output !== null &&
        useAppStore.getState().currentSessionId === persistedSessionId;
      if (!alreadyLoaded) {
        loadSession(persistedSessionId, supabase);
      }
    }
  }, [loadSession, supabase]);

  const handleCreateSession = async () => {
    setIsSheetOpen(false);
    resetActiveSessionState();
  };

  const handleLoadSession = async (sessionId: string) => {
    setIsSheetOpen(false);
    if (sessionId !== currentSessionId) {
      await loadSession(sessionId, supabase);
    }
  };

  const handleDeleteSession = async (sessionId: string, sessionTitle: string) => {
    if (window.confirm(`Are you sure you want to delete the session "${sessionTitle || 'Untitled Session'}"?`)) {
      setIsSheetOpen(false);
      await deleteSession(sessionId, supabase);
    }
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateSessionTitleLocally(event.target.value);
  };

  const handleTitleBlur = () => {
    if (currentSessionId && subscriptionStatus === 'active') {
      saveSession(supabase);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    resetActiveSessionState();
    router.refresh();
  };

  const handleManageSubscription = async () => {
    setIsPortalLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/stripe/create-portal-session', { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create portal session');
      }
      const { url } = await response.json();
      if (!url) throw new Error('Missing portal URL from response');
      window.location.href = url;
    } catch (err) {
      console.error('Manage subscription error:', err);
      setError(`Failed to open portal: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsPortalLoading(false);
    }
  };

  return (
    <header className="flex items-center justify-between p-4 border-b flex-shrink-0">
      <div className="flex items-center gap-4">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <PanelLeft className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px] flex flex-col">
            <SheetHeader>
              <SheetTitle>Your Sessions</SheetTitle>
              <SheetDescription>
                Create, load, or delete your exploration sessions.
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-grow pr-4">
              {isSessionListLoading || isSubscriptionLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : error && !sessionsList ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error Loading</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : sessionsList && sessionsList.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No sessions found. Create one!</p>
              ) : sessionsList && sessionsList.length > 0 ? (
                <div className="space-y-2">
                  {sessionsList.map((session: SessionSummary) => (
                    <div
                      key={session.id}
                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted ${
                        session.id === currentSessionId ? 'bg-muted font-semibold' : ''
                      }`}
                      onClick={() => handleLoadSession(session.id)}
                    >
                      <div className="flex flex-col overflow-hidden mr-2">
                        <span className="text-sm truncate" title={session.title ?? 'Untitled Session'}>
                          {session.title || 'Untitled Session'}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          Updated {formatDistanceToNow(new Date(session.last_updated_at), { addSuffix: true })}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id, session.title ?? 'Untitled Session');
                        }}
                        title="Delete Session"
                        disabled={isSessionLoading || isSavingSession}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </ScrollArea>
            <SheetFooter className="mt-auto pt-4 border-t">
              <Button
                onClick={handleCreateSession}
                className="w-full"
                disabled={isSavingSession || isSessionLoading || isSubscriptionLoading || subscriptionStatus !== 'active'}
                title={subscriptionStatus !== 'active' ? 'Subscription required' : 'Create new session'}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Session
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        {currentSessionId ? (
          <Input
            value={currentSessionTitle ?? ''}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            className="text-lg font-semibold leading-none tracking-tight w-auto max-w-md"
            disabled={isSavingSession || isSessionLoading}
          />
        ) : (
          <h1 className="text-lg font-semibold leading-none tracking-tight">New Session</h1>
        )}
        {isSavingSession && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        <SearchNodes className="w-48" />
      </div>
      <div className="flex items-center gap-2">
        {isSubscriptionLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : subscriptionStatus === 'active' ? (
          <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={isPortalLoading}>
            {isPortalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
            Manage Billing
          </Button>
        ) : (
          <Button variant="default" size="sm" onClick={onSubscribe} disabled={isCheckoutLoading}>
            {isCheckoutLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Subscribe Now
          </Button>
        )}
        <Button variant="outline" size="icon" onClick={onShowOnboarding}>
          <Info className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
