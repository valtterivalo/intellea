import { StateCreator } from 'zustand';
import { AppState } from './useAppStore';

export interface VoiceSlice {
  isVoiceSessionActive: boolean;
  setVoiceSessionActive: (isActive: boolean) => void;
}

/**
 * @description Create the voice session slice of the store.
 */
export const createVoiceSlice: StateCreator<AppState, [], [], VoiceSlice> = (set) => ({
  isVoiceSessionActive: false,
  setVoiceSessionActive: (isActive: boolean) => set({ isVoiceSessionActive: isActive }),
}); 