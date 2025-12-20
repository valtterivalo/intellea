/**
 * @fileoverview Lazy OpenAI client factory for server-side usage.
 * Exports: getOpenAIClient
 */
import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing Environment Variable OPENAI_API_KEY');
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}
