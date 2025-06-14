import { StateCreator } from 'zustand';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatSlice {
  messages: ChatMessage[];
  send: (content: string) => Promise<void>;
}

export const createChatSlice: StateCreator<ChatSlice, [], [], ChatSlice> = (set, get) => ({
  messages: [],
  send: async (content: string) => {
    const newMsg: ChatMessage = { role: 'user', content };
    set((state) => ({ messages: [...state.messages, newMsg] }));
    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...get().messages, newMsg] }),
      });
      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      let assistant: ChatMessage = { role: 'assistant', content: '' };
      set((state) => ({ messages: [...state.messages, assistant] }));
      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          set((state) => {
            const msgs = [...state.messages];
            const last = msgs[msgs.length - 1];
            msgs[msgs.length - 1] = { ...last, content: last.content + chunk };
            return { messages: msgs };
          });
        }
      } else {
        const text = await resp.text();
        set((state) => {
          const msgs = [...state.messages];
          msgs[msgs.length - 1] = { role: 'assistant', content: text };
          return { messages: msgs };
        });
      }
    } catch (err: any) {
      set((state) => ({ messages: [...state.messages, { role: 'assistant', content: `Error: ${err.message}` }] }));
    }
  },
});

export default createChatSlice;
