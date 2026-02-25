import { generateText, tool } from 'ai';
import { gemmaModel } from '../providers/chutes.js';
import { generateText as generateTextHandler, generateImage } from '../handlers/ai_generate.js';
import { z } from 'zod';

let walletAddressRef: string = '';

const PRICE_CHAT = 0.01;
const PRICE_IMAGE = 0.05;
const PRICE_VIDEO = 0.10;

function stripThinkingTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

const chatTool = tool({
  description: 'Chat with the AI assistant. Use this for general conversation, questions, and text-based tasks.',
  parameters: z.object({
    prompt: z.string().describe('The message or question to send to the AI'),
    max_tokens: z.number().optional().describe('Maximum tokens to generate'),
    temperature: z.number().optional().describe('Temperature for generation (0-2)'),
  }),
  execute: async ({ prompt, max_tokens, temperature }) => {
    try {
      const result = await generateTextHandler({ prompt, max_tokens, temperature }, walletAddressRef);
      return { text: result.text, toolType: 'chat', price: PRICE_CHAT };
    } catch (error: any) {
      return { text: `Error: ${error.message}`, toolType: 'chat', price: PRICE_CHAT };
    }
  },
});

const generateImageTool = tool({
  description: 'Generate an image from a text prompt. Use this when the user wants to create a visual image, illustration, or artwork.',
  parameters: z.object({
    prompt: z.string().describe('Detailed description of the image to generate'),
    width: z.number().optional().describe('Image width (default 1024)'),
    height: z.number().optional().describe('Image height (default 1024)'),
  }),
  execute: async ({ prompt, width, height }) => {
    try {
      const result = await generateImage({ prompt, width, height }, walletAddressRef);
      return { text: 'Image created successfully!', image_b64: result.image_b64, toolType: 'image', price: PRICE_IMAGE };
    } catch (error: any) {
      return { text: `Error: ${error.message}`, toolType: 'image', price: PRICE_IMAGE };
    }
  },
});

interface ToolResult {
  text: string;
  toolType: string;
  price: number;
  image_b64?: string;
}

interface AgentResponse {
  text: string;
  toolCalls?: any[];
  toolNeeded?: 'image' | 'video' | null;
  price?: number;
}

export async function handleAgentChat(prompt: string, walletAddress: string): Promise<AgentResponse> {
  walletAddressRef = walletAddress;
  
  const promptLower = prompt.toLowerCase();
  const isImageRequest = /\b(draw|paint|create|generate|make|show me|image|picture|photo|art|illustration|visual|logo|design)\b/i.test(promptLower);
  const isVideoRequest = /\b(animate|animation|video|movie|motion)\b/i.test(promptLower);
  
  if (isImageRequest || isVideoRequest) {
    const toolType = isVideoRequest ? 'video' : 'image';
    const price = isVideoRequest ? PRICE_VIDEO : PRICE_IMAGE;
    return {
      text: `${isVideoRequest ? 'Video' : 'Image'} generation will cost ${price}¢. Would you like me to proceed?`,
      toolNeeded: toolType,
      price,
    };
  }
  
  try {
    const result = await generateText({
      model: gemmaModel,
      tools: {
        chat: chatTool,
        generateImage: generateImageTool,
      },
      maxSteps: 10,
      prompt,
    });

    const toolCalls = result.toolCalls;
    
    if (toolCalls && toolCalls.length > 0) {
      for (const tc of toolCalls) {
        const toolResult = (tc as any).result as ToolResult;
        if (toolResult && toolResult.toolType === 'image') {
          return {
            text: `Image generation will cost ${PRICE_IMAGE}¢. Would you like me to proceed?`,
            toolNeeded: 'image',
            price: PRICE_IMAGE,
          };
        }
      }
    }

    return {
      text: stripThinkingTags(result.text),
      toolCalls,
      toolNeeded: null,
      price: PRICE_CHAT,
    };
  } catch (error: any) {
    console.error('Agent error:', error);
    return { text: `Error: ${error.message}`, toolNeeded: null, price: PRICE_CHAT };
  }
}

export async function executeTool(toolType: 'image' | 'video', prompt: string, walletAddress: string): Promise<{ text: string; image_b64?: string }> {
  walletAddressRef = walletAddress;
  
  if (toolType === 'image') {
    const result = await generateImage({ prompt }, walletAddress);
    return { text: 'Image created successfully!', image_b64: result.image_b64 };
  }
  
  return { text: 'Video generation not yet implemented.' };
}

export { PRICE_CHAT, PRICE_IMAGE, PRICE_VIDEO };
