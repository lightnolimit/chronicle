import 'dotenv/config';

const CHUTES_API_KEY = process.env.CHUTES_API_KEY;

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimits = new Map<string, RateLimitEntry>();
const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function checkRateLimit(walletAddress: string, type: string): boolean {
  const key = `${walletAddress}:${type}`;
  const now = Date.now();
  
  const entry = rateLimits.get(key);
  if (!entry || now > entry.resetTime) {
    rateLimits.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT) {
    return false;
  }
  
  entry.count++;
  return true;
}

export interface TextGenerationRequest {
  prompt: string;
  max_tokens?: number;
  temperature?: number;
}

export interface TextGenerationResponse {
  text: string;
}

export async function generateText(req: TextGenerationRequest, walletAddress: string): Promise<TextGenerationResponse> {
  if (!checkRateLimit(walletAddress, 'text')) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  if (!CHUTES_API_KEY) {
    throw new Error('AI service not configured');
  }

  const response = await fetch('https://llm.chutes.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CHUTES_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'Qwen/Qwen3-32B',
      messages: [
        {
          role: 'user',
          content: req.prompt,
        },
      ],
      max_tokens: req.max_tokens || 1024,
      temperature: req.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI generation failed: ${error}`);
  }

  const data: any = await response.json();
  return {
    text: data.choices?.[0]?.message?.content || 'No response generated',
  };
}

export interface ImageGenerationRequest {
  prompt: string;
  width?: number;
  height?: number;
}

export interface ImageGenerationResponse {
  image_b64: string;
}

export async function generateImage(req: ImageGenerationRequest, walletAddress: string): Promise<ImageGenerationResponse> {
  if (!checkRateLimit(walletAddress, 'image')) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  if (!CHUTES_API_KEY) {
    throw new Error('AI service not configured');
  }

  const response = await fetch('https://chutes-z-image-turbo.chutes.ai/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CHUTES_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: req.prompt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI generation failed: ${error}`);
  }

  const data: any = await response.json();
  return {
    image_b64: data.image || data.images?.[0] || '',
  };
}

export interface ImageEditRequest {
  prompt: string;
  image_b64: string;
  width?: number;
  height?: number;
  negative_prompt?: string;
  num_inference_steps?: number;
  true_cfg_scale?: number;
}

export async function editImage(req: ImageEditRequest, walletAddress: string): Promise<ImageGenerationResponse> {
  if (!checkRateLimit(walletAddress, 'image-edit')) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  if (!CHUTES_API_KEY) {
    throw new Error('AI service not configured');
  }

  const response = await fetch('https://chutes-qwen-image-edit-2509.chutes.ai/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CHUTES_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: req.prompt,
      image_b64s: [req.image_b64],
      width: req.width || 1024,
      height: req.height || 1024,
      negative_prompt: req.negative_prompt || '',
      num_inference_steps: req.num_inference_steps || 40,
      true_cfg_scale: req.true_cfg_scale || 4,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI generation failed: ${error}`);
  }

  const data: any = await response.json();
  return {
    image_b64: data.image || data.images?.[0] || '',
  };
}

export interface VideoGenerationRequest {
  prompt: string;
  image_b64: string;
  guidance_scale?: number;
  negative_prompt?: string;
}

export interface VideoGenerationResponse {
  video_url: string;
}

export async function generateVideo(req: VideoGenerationRequest, walletAddress: string): Promise<VideoGenerationResponse> {
  if (!checkRateLimit(walletAddress, 'video')) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  if (!CHUTES_API_KEY) {
    throw new Error('AI service not configured');
  }

  const response = await fetch('https://chutes-wan-2-2-i2v-14b-fast.chutes.ai/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CHUTES_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: req.prompt,
      image: req.image_b64,
      guidance_scale: req.guidance_scale || 1,
      negative_prompt: req.negative_prompt || '色调艳丽，过曝，静态，细节模糊不清，字幕，风格，作品，画作，画面，静止，整体发灰，最差质量，低质量，JPEG压缩残留，丑陋的，残缺的，多余的手指，画得不好的手部，画得不好的脸部，畸形的，毁容的，形态畸形的肢体，手指融合，静止不动的画面，杂乱的背景，三条腿，背景人很多，倒着走',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI generation failed: ${error}`);
  }

  const data: any = await response.json();
  return {
    video_url: data.video || data.videos?.[0] || '',
  };
}