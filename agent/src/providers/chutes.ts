import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import 'dotenv/config';

export const chutes = createOpenAICompatible({
  name: 'chutes',
  baseURL: 'https://llm.chutes.ai/v1',
  headers: {
    Authorization: `Bearer ${process.env.CHUTES_API_KEY}`,
  },
});

export const gemmaModel = chutes('unsloth/gemma-3-27b-it');
