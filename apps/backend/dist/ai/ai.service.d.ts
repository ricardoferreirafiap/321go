import { AiChatRequestDto } from './dto/ai-chat-request.dto';
import { AiProvider, AiRepository } from './ai.repository';
export declare class AiService {
    private readonly aiRepository;
    constructor(aiRepository: AiRepository);
    chat(dto: AiChatRequestDto): Promise<{
        reply: string;
        provider: AiProvider;
    }>;
    private resolveProvider;
    private normalizeMessages;
    private normalizeMessageContent;
}
