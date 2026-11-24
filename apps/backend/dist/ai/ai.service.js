"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const ai_repository_1 = require("./ai.repository");
let AiService = class AiService {
    aiRepository;
    constructor(aiRepository) {
        this.aiRepository = aiRepository;
    }
    async chat(dto) {
        const provider = this.resolveProvider(dto.provedor);
        const messages = this.normalizeMessages(dto.messages);
        try {
            const reply = await this.aiRepository.generateReply(provider, messages);
            return { reply, provider };
        }
        catch (error) {
            if (error instanceof ai_repository_1.AiRepositoryError) {
                throw new common_1.HttpException({
                    message: error.message,
                    code: error.code,
                }, error.statusCode);
            }
            throw new common_1.InternalServerErrorException('Falha ao processar o chat de IA.');
        }
    }
    resolveProvider(provider) {
        const value = provider || process.env.AI_PROVIDER || 'openai';
        if (value === 'openai' || value === 'groq' || value === 'gemini' || value === 'openrouter' || value === 'cloudflare') {
            return value;
        }
        return 'openai';
    }
    normalizeMessages(input) {
        const normalized = input.map((message, index) => {
            const content = this.normalizeMessageContent(message.content);
            if (!content) {
                throw new common_1.BadRequestException(`Mensagem ${index + 1} sem conteudo valido.`);
            }
            return {
                role: message.role,
                content,
            };
        });
        if (!normalized.length) {
            throw new common_1.BadRequestException('Ao menos uma mensagem precisa ser enviada.');
        }
        return normalized;
    }
    normalizeMessageContent(content) {
        if (typeof content === 'string') {
            return content.trim();
        }
        if (!Array.isArray(content)) {
            return '';
        }
        const chunks = content
            .map((part) => {
            if (!part || typeof part !== 'object') {
                return '';
            }
            const typedPart = part;
            if (typedPart.type === 'text' && typeof typedPart.text === 'string') {
                return typedPart.text.trim();
            }
            if (typedPart.type === 'image_url' &&
                typedPart.image_url &&
                typeof typedPart.image_url === 'object' &&
                typeof typedPart.image_url.url === 'string' &&
                typedPart.image_url.url.trim()) {
                return `[imagem: ${typedPart.image_url.url.trim()}]`;
            }
            return '';
        })
            .filter(Boolean);
        return chunks.join(' ').trim();
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_repository_1.AiRepository])
], AiService);
//# sourceMappingURL=ai.service.js.map