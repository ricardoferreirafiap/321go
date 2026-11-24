import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiChatRequestDto } from './dto/ai-chat-request.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  chat(@Body() dto: AiChatRequestDto) {
    return this.aiService.chat(dto);
  }
}

