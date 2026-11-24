import { AiService } from './ai.service';
import { AiChatRequestDto } from './dto/ai-chat-request.dto';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    chat(dto: AiChatRequestDto): Promise<{
        reply: string;
        provider: import("./ai.repository").AiProvider;
    }>;
}
