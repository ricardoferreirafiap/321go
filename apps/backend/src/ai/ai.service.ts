import { BadRequestException, HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { AiChatRequestDto } from './dto/ai-chat-request.dto';
import { AiProvider, AiRepository, AiRepositoryError } from './ai.repository';

@Injectable()
export class AiService {
  constructor(private readonly aiRepository: AiRepository) {}

  async chat(dto: AiChatRequestDto) {
    const provider = this.resolveProvider(dto.provedor);
    const messages = this.normalizeMessages(dto.messages);

    try {
      const reply = await this.aiRepository.generateReply(provider, messages);
      return { reply, provider };
    } catch (error) {
      if (error instanceof AiRepositoryError) {
        if (error.code === 'WONDERFUL_MISSING_INFORMATION') {
          return {
            reply: this.buildWonderfulMissingInformationReply(error.message),
            provider,
          };
        }

        throw new HttpException(
          {
            message: error.message,
            code: error.code,
          },
          error.statusCode,
        );
      }

      throw new InternalServerErrorException('Falha ao processar o chat de IA.');
    }
  }

  private resolveProvider(provider?: AiProvider): AiProvider {
    void provider;
    return 'wonderful';
  }

  private normalizeMessages(input: Array<{ role: 'user' | 'assistant'; content: unknown }>) {
    const normalized = input.map((message, index) => {
      const content = this.normalizeMessageContent(message.content);
      if (!content) {
        throw new BadRequestException(`Mensagem ${index + 1} sem conteudo valido.`);
      }

      return {
        role: message.role,
        content,
      };
    });

    if (!normalized.length) {
      throw new BadRequestException('Ao menos uma mensagem precisa ser enviada.');
    }

    return normalized;
  }

  private normalizeMessageContent(content: unknown): string {
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

        const typedPart = part as { type?: unknown; text?: unknown; image_url?: { url?: unknown } };
        if (typedPart.type === 'text' && typeof typedPart.text === 'string') {
          return typedPart.text.trim();
        }

        if (
          typedPart.type === 'image_url' &&
          typedPart.image_url &&
          typeof typedPart.image_url === 'object' &&
          typeof typedPart.image_url.url === 'string' &&
          typedPart.image_url.url.trim()
        ) {
          return `[imagem: ${typedPart.image_url.url.trim()}]`;
        }

        return '';
      })
      .filter(Boolean);

    return chunks.join(' ').trim();
  }

  private buildWonderfulMissingInformationReply(message: string): string {
    const raw = String(message || '').trim();
    const marker = 'A Wonderful solicitou mais informacoes:';
    const index = raw.indexOf(marker);
    const detail = index >= 0 ? raw.slice(index + marker.length).trim() : raw;

    return detail
      ? `Para continuar, preciso de mais informacoes: ${detail}`
      : 'Para continuar, preciso de mais informacoes para concluir sua solicitacao.';
  }
}

