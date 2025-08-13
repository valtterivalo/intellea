/**
 * @fileoverview Model configuration and initialization
 * Exports: getModel, ModelType, AVAILABLE_MODELS
 */

import { groq } from '@ai-sdk/groq';
import { aisdk } from '@openai/agents-extensions';

export type ModelType = 'kimi-k2' | 'gpt-4o' | 'gpt-4.1';

export const AVAILABLE_MODELS = {
  'kimi-k2': {
    id: 'moonshotai/kimi-k2-instruct',
    provider: 'groq',
    displayName: 'Kimi K2',
    description: 'Fast Kimi K2 model via Groq (1T params, 32B active)',
    fastModel: true,
    supportsStructuredOutput: true,
  },
  'gpt-4o': {
    id: 'gpt-4o',
    provider: 'openai',
    displayName: 'GPT-4o',
    description: 'Most capable OpenAI model',
    supportsStructuredOutput: true,
  },
  'gpt-4.1': {
    id: 'gpt-4.1',
    provider: 'openai',
    displayName: 'GPT-4.1',
    description: 'Latest GPT-4 variant',
    supportsStructuredOutput: true,
  },
} as const;

function getGroqApiKey(): string {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is required for Groq models');
  }
  return apiKey;
}

export function getModel(modelType: ModelType = 'kimi-k2') {
  const config = AVAILABLE_MODELS[modelType];
  
  if (config.provider === 'groq') {
    try {
      getGroqApiKey(); // Validate API key exists
      return aisdk(groq(config.id));
    } catch (error) {
      console.warn(`Groq model ${modelType} unavailable, falling back to OpenAI:`, error);
      // Fallback to GPT-4o if Groq fails
      return 'gpt-4o';
    }
  }
  
  // Return OpenAI model string directly
  return config.id;
}

export function isGroqAvailable(): boolean {
  try {
    getGroqApiKey();
    return true;
  } catch {
    return false;
  }
}