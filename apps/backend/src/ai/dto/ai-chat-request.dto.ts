import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsOptional, ValidateNested } from 'class-validator';
import { AiChatMessageDto } from './ai-chat-message.dto';

export class AiChatRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AiChatMessageDto)
  messages: AiChatMessageDto[];

  @IsOptional()
  @IsIn(['openai', 'groq', 'gemini', 'openrouter', 'cloudflare', 'wonderful'])
  provedor?: 'openai' | 'groq' | 'gemini' | 'openrouter' | 'cloudflare' | 'wonderful';
}

