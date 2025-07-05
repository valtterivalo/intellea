/**
 * @fileoverview Zustand slice tracking voice session state.
 * Exports createVoiceSlice.
 */
import { StateCreator } from 'zustand';
import { AppState } from './useAppStore';

export interface VoiceSlice {
  isVoiceSessionActive: boolean;
  setVoiceSessionActive: (isActive: boolean) => void;
}

export const createVoiceSlice: StateCreator<AppState, [], [], VoiceSlice> = (set) => ({
  isVoiceSessionActive: false,
  setVoiceSessionActive: (isActive: boolean) => set({ isVoiceSessionActive: isActive }),
}); 
