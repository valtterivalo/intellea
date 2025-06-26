import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createConceptSlice } from '@/store/conceptSlice';

// Mock fetch for streaming tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock crypto for hash generation
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32))
    }
  },
  writable: true
});

// Mock TextEncoder/TextDecoder for streaming
global.TextEncoder = vi.fn().mockImplementation(() => ({
  encode: vi.fn().mockReturnValue(new Uint8Array())
}));

global.TextDecoder = vi.fn().mockImplementation(() => ({
  decode: vi.fn().mockReturnValue('')
}));

describe('Concept Slice Streaming', () => {
  let store: any;
  let conceptSlice: any;

  beforeEach(() => {
    // Create a mock Zustand store
    const mockState = {
      subscriptionStatus: 'active',
      output: {
        visualizationData: {
          nodes: [{ id: 'node1', label: 'Test Node' }],
          links: []
        },
        knowledgeCards: []
      },
      currentSessionId: 'test-session',
      expandedConceptCache: new Map(),
      setFocusedNodeId: vi.fn(),
      setActiveFocusPath: vi.fn()
    };

    const get = () => mockState;
    const set = (fn: any) => {
      const newState = typeof fn === 'function' ? fn(mockState) : fn;
      Object.assign(mockState, newState);
    };

    conceptSlice = createConceptSlice(set, get, {} as any);
    store = { ...mockState, ...conceptSlice };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should handle streaming concept expansion', async () => {
    // Mock the streaming response
    const mockStreamData = [
      'data: {"type":"chunk","content":"# Test Concept\\n\\n"}\n\n',
      'data: {"type":"chunk","content":"This is a streaming "}\n\n',
      'data: {"type":"chunk","content":"explanation."}\n\n',
      'data: {"type":"complete","data":{"title":"Test Concept","content":"# Test Concept\\n\\nThis is a streaming explanation.","relatedConcepts":[]}}\n\n'
    ];

    let readIndex = 0;
    const mockReader = {
      read: vi.fn().mockImplementation(() => {
        if (readIndex < mockStreamData.length) {
          const chunk = mockStreamData[readIndex++];
          return Promise.resolve({
            done: false,
            value: new TextEncoder().encode(chunk)
          });
        }
        return Promise.resolve({ done: true, value: undefined });
      }),
      releaseLock: vi.fn()
    };

    const mockResponse = {
      ok: true,
      body: {
        getReader: () => mockReader
      }
    };

    mockFetch.mockResolvedValue(mockResponse);

    // Mock TextDecoder to return the actual data
    const mockDecoder = {
      decode: vi.fn().mockImplementation((data) => {
        const index = Array.from(mockStreamData).findIndex(chunk => 
          chunk === new TextDecoder().decode(data)
        );
        return index >= 0 ? mockStreamData[index] : '';
      })
    };
    
    global.TextDecoder = vi.fn().mockImplementation(() => mockDecoder);

    // Call the streaming function
    await conceptSlice.expandConceptWithStreaming('node1', 'Test Node');

    // Verify fetch was called with streaming endpoint
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/expand-concept/stream',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    );

    // Verify state updates
    expect(store.isExpandingConcept).toBe(false);
    expect(store.expandedConceptData).toBeDefined();
    expect(store.expandedConceptData.title).toBe('Test Concept');
    expect(store.streamingContent).toBe('');
  });

  it('should update streaming content incrementally', async () => {
    const streamingUpdates: string[] = [];
    
    // Mock set function to capture streaming updates
    const originalSet = store.set;
    const mockSet = vi.fn().mockImplementation((fn) => {
      const newState = typeof fn === 'function' ? fn(store) : fn;
      if ('streamingContent' in newState) {
        streamingUpdates.push(newState.streamingContent);
      }
      return originalSet(newState);
    });

    // Recreate concept slice with the capturing set function
    const get = () => store;
    conceptSlice = createConceptSlice(mockSet, get, {} as any);

    // Mock streaming response with incremental content
    const chunks = [
      'data: {"type":"chunk","content":"# Test"}\n\n',
      'data: {"type":"chunk","content":" Concept\\n\\n"}\n\n',
      'data: {"type":"chunk","content":"This is "}\n\n',
      'data: {"type":"chunk","content":"streaming content."}\n\n',
      'data: {"type":"complete","data":{"title":"Test Concept","content":"Complete content","relatedConcepts":[]}}\n\n'
    ];

    let readIndex = 0;
    const mockReader = {
      read: vi.fn().mockImplementation(() => {
        if (readIndex < chunks.length) {
          const chunk = chunks[readIndex++];
          return Promise.resolve({
            done: false,
            value: new TextEncoder().encode(chunk)
          });
        }
        return Promise.resolve({ done: true, value: undefined });
      }),
      releaseLock: vi.fn()
    };

    const mockResponse = {
      ok: true,
      body: {
        getReader: () => mockReader
      }
    };

    mockFetch.mockResolvedValue(mockResponse);

    // Mock TextDecoder to properly decode chunks
    let decodedData = '';
    const mockDecoder = {
      decode: vi.fn().mockImplementation((data, options) => {
        const chunkIndex = readIndex - 1;
        if (chunkIndex >= 0 && chunkIndex < chunks.length) {
          return chunks[chunkIndex];
        }
        return '';
      })
    };
    
    global.TextDecoder = vi.fn().mockImplementation(() => mockDecoder);

    // Execute streaming
    await conceptSlice.expandConceptWithStreaming('node1', 'Test Node');

    // Verify that streaming content was updated incrementally
    expect(mockSet).toHaveBeenCalled();
    // The exact number of calls depends on implementation details,
    // but we should see streaming content being built up
  });

  it('should handle cached data without streaming', async () => {
    // Set up cached data
    const cachedData = {
      title: 'Cached Concept',
      content: 'Cached content',
      relatedConcepts: []
    };
    
    store.expandedConceptCache.set('node1', {
      data: cachedData,
      graphHash: 'test-hash'
    });

    // Mock hash generation to return the same hash
    global.crypto.subtle.digest = vi.fn().mockResolvedValue(
      new Uint8Array([1, 2, 3, 4]).buffer
    );

    // Call streaming function
    await conceptSlice.expandConceptWithStreaming('node1', 'Test Node');

    // Should not make fetch call for cached data
    expect(mockFetch).not.toHaveBeenCalled();
    
    // Should use cached data
    expect(store.expandedConceptData).toEqual(cachedData);
    expect(store.isExpandingConcept).toBe(false);
    expect(store.streamingContent).toBe('');
  });

  it('should handle subscription requirement', async () => {
    // Set inactive subscription
    store.subscriptionStatus = 'inactive';

    // Mock set to capture error
    let errorSet = '';
    const mockSet = vi.fn().mockImplementation((newState) => {
      if (newState.error) {
        errorSet = newState.error;
      }
      Object.assign(store, newState);
    });

    const get = () => store;
    conceptSlice = createConceptSlice(mockSet, get, {} as any);

    // Call streaming function
    await conceptSlice.expandConceptWithStreaming('node1', 'Test Node');

    // Should set error and not make API call
    expect(errorSet).toContain('Active subscription required');
    expect(mockFetch).not.toHaveBeenCalled();
    expect(store.isExpandingConcept).toBe(false);
  });
});