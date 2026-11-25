import { AiChatMessageDto } from './ai-chat-message.dto';
export declare class AiChatRequestDto {
    messages: AiChatMessageDto[];
    provedor?: 'openai' | 'groq' | 'gemini' | 'openrouter' | 'cloudflare' | 'wonderful';
}
