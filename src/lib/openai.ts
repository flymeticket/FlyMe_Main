import OpenAI from 'openai';
import { env } from './env';

let _client: OpenAI | null = null;
export function getOpenAI(): OpenAI {
  if (_client) return _client;
  _client = new OpenAI({ apiKey: env.openaiApiKey });
  return _client;
}
