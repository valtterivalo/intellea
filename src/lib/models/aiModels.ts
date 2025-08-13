/**
 * @fileoverview AI SDK v5 model configuration and selection
 * Exports: getModel, selectModelForTask, ModelTask, AVAILABLE_MODELS
 */

import { openai } from '@ai-sdk/openai';
import { groq } from '@ai-sdk/groq';
// AI SDK v5 model interface - using return type inference

export type ModelTask = 
  | 'graph-generation'       // Fast model for graph operations
  | 'document-processing'    // Multimodal model for documents
  | 'concept-expansion'      // Fast model for concept expansion
  | 'session-generation'     // Auto-select based on document presence
  | 'text-only';             // Fast model for text-only operations

export type ModelProvider = 'openai' | 'groq';

export interface ModelConfig {
  id: string;
  provider: ModelProvider;
  displayName: string;
  description: string;
  fastModel?: boolean;
  multimodal?: boolean;
  supportsStructuredOutput: boolean;
}

export const AVAILABLE_MODELS = {
  'kimi-k2': {
    id: 'moonshotai/kimi-k2-instruct',
    provider: 'groq' as const,
    displayName: 'Kimi K2',
    description: 'Fast Kimi K2 model via Groq (1T params, 32B active)',
    fastModel: true,
    multimodal: false,
    supportsStructuredOutput: true,
  },
  'gpt-5': {
    id: 'gpt-5',
    provider: 'openai' as const,
    displayName: 'GPT-5',
    description: 'Most capable OpenAI model with advanced multimodal support',
    fastModel: false,
    multimodal: true,
    supportsStructuredOutput: true,
  },
  'gpt-5-mini': {
    id: 'gpt-5-mini',
    provider: 'openai' as const,
    displayName: 'GPT-5 Mini',
    description: 'Faster, cost-effective GPT-5 variant',
    fastModel: true,
    multimodal: true,
    supportsStructuredOutput: true,
  },
  'gpt-5-nano': {
    id: 'gpt-5-nano',
    provider: 'openai' as const,
    displayName: 'GPT-5 Nano',
    description: 'Ultra-fast GPT-5 variant for simple tasks',
    fastModel: true,
    multimodal: false,
    supportsStructuredOutput: true,
  },
  'gpt-4o': {
    id: 'gpt-4o',
    provider: 'openai' as const,
    displayName: 'GPT-4o',
    description: 'Legacy capable OpenAI model with multimodal support',
    fastModel: false,
    multimodal: true,
    supportsStructuredOutput: true,
  }
} as const;

export type ModelType = keyof typeof AVAILABLE_MODELS;

function validateEnvironment(): { groqAvailable: boolean; openaiAvailable: boolean } {
  const groqAvailable = Boolean(process.env.GROQ_API_KEY);
  const openaiAvailable = Boolean(process.env.OPENAI_API_KEY);
  
  if (!groqAvailable && !openaiAvailable) {
    throw new Error('At least one of GROQ_API_KEY or OPENAI_API_KEY must be set');
  }
  
  return { groqAvailable, openaiAvailable };
}

/**
 * Get an AI SDK v5 model instance for a specific model type
 */
export function getModel(modelType: ModelType) {
  const config = AVAILABLE_MODELS[modelType];
  const { groqAvailable, openaiAvailable } = validateEnvironment();
  
  if (config.provider === 'groq') {
    if (groqAvailable) {
      return groq(config.id);
    } else {
      console.warn(`Groq not available for ${modelType}, falling back to OpenAI GPT-5`);
      if (!openaiAvailable) {
        throw new Error('OpenAI API key not available for fallback');
      }
      return openai('gpt-5');
    }
  }
  
  if (config.provider === 'openai') {
    if (openaiAvailable) {
      return openai(config.id);
    } else {
      throw new Error(`OpenAI API key required for ${modelType}`);
    }
  }
  
  throw new Error(`Unknown provider for model type: ${modelType}`);
}

/**
 * Automatically select the best model for a specific task
 */
export function selectModelForTask(task: ModelTask, hasDocuments = false) {
  const { groqAvailable, openaiAvailable } = validateEnvironment();
  
  switch (task) {
    case 'document-processing':
      // Always use multimodal model for document processing - prefer GPT-5 over GPT-4o
      if (openaiAvailable) {
        return openai('gpt-5');
      }
      throw new Error('OpenAI API key required for document processing (multimodal support)');
      
    case 'session-generation':
      // Auto-select based on document presence
      if (hasDocuments) {
        return selectModelForTask('document-processing');
      }
      return selectModelForTask('text-only');
      
    case 'graph-generation':
    case 'concept-expansion':
    case 'text-only':
      // Use fast model when available - prefer Kimi K2 for speed
      if (groqAvailable) {
        return groq('moonshotai/kimi-k2-instruct');
      }
      // Fallback to OpenAI fast model - prefer GPT-5 Mini
      if (openaiAvailable) {
        return openai('gpt-5-mini');
      }
      throw new Error('No suitable models available');
      
    default:
      throw new Error(`Unknown task type: ${task}`);
  }
}

/**
 * Get model configuration information
 */
export function getModelConfig(modelType: ModelType): ModelConfig {
  return AVAILABLE_MODELS[modelType];
}

/**
 * Check if a model supports multimodal input
 */
export function isMultimodalModel(modelType: ModelType): boolean {
  return AVAILABLE_MODELS[modelType].multimodal ?? false;
}

/**
 * Check if providers are available
 */
export function getAvailableProviders(): { groq: boolean; openai: boolean } {
  const { groqAvailable, openaiAvailable } = validateEnvironment();
  return { groq: groqAvailable, openai: openaiAvailable };
}