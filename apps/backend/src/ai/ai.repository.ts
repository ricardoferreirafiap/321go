import { Injectable } from '@nestjs/common';

export type AiProvider = 'openai' | 'groq' | 'gemini' | 'openrouter' | 'cloudflare';

export type AiMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type OpenAiLikeResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  error?: {
    message?: string;
    code?: string;
  };
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
    code?: number | string;
  };
};

export class AiRepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

@Injectable()
export class AiRepository {
  private readonly systemPrompt = [
    'Voce e o Agente IA do PortalWeb.',
    'Responda sempre em portugues do Brasil.',
    'Seja objetivo, profissional e amigavel.',
    'Ajude com produtividade, atendimento comercial, vendas e suporte.',
  ].join(' ');

  async generateReply(provider: AiProvider, messages: AiMessage[]): Promise<string> {
    switch (provider) {
      case 'openai':
        return this.callOpenAiCompatible({
          provider,
          apiKey: process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        }, messages);
      case 'groq':
        return this.callOpenAiCompatible({
          provider,
          apiKey: process.env.GROQ_API_KEY,
          model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
          baseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
        }, messages);
      case 'openrouter':
        return this.callOpenAiCompatible({
          provider,
          apiKey: process.env.OPENROUTER_API_KEY,
          model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
          baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
        }, messages);
      case 'cloudflare':
        return this.callOpenAiCompatible({
          provider,
          apiKey: process.env.CLOUDFLARE_API_KEY,
          model: process.env.CLOUDFLARE_MODEL || '@cf/meta/llama-3.1-8b-instruct',
          baseUrl:
            process.env.CLOUDFLARE_BASE_URL ||
            (process.env.CLOUDFLARE_ACCOUNT_ID
              ? `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/v1`
              : ''),
        }, messages);
      case 'gemini':
        return this.callGemini(messages);
      default:
        return this.callOpenAiCompatible({
          provider: 'openai',
          apiKey: process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        }, messages);
    }
  }

  private async callOpenAiCompatible(
    config: { provider: AiProvider; apiKey?: string; model: string; baseUrl: string },
    messages: AiMessage[],
  ): Promise<string> {
    const providerKey = config.provider.toUpperCase();

    if (!config.apiKey) {
      const code = config.provider === 'openai' ? 'OPENAI_KEY_MISSING' : `${providerKey}_KEY_MISSING`;
      throw new AiRepositoryError(`${providerKey}_API_KEY nao configurada.`, code, 400);
    }

    if (!config.baseUrl) {
      throw new AiRepositoryError(`Base URL do provedor ${config.provider} nao configurada.`, 'AI_BASE_URL_MISSING', 500);
    }

    const endpoint = config.baseUrl.replace(/\/+$/g, '') + '/chat/completions';

    const body = {
      model: config.model,
      temperature: 0.4,
      messages: [{ role: 'system', content: this.systemPrompt }, ...messages],
    };

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(body),
      });
    } catch {
      throw new AiRepositoryError('Falha ao conectar ao provedor de IA.', 'AI_PROVIDER_UNAVAILABLE', 502);
    }

    const parsed = (await this.readJson<OpenAiLikeResponse>(response)) || {};

    if (!response.ok) {
      throw this.mapOpenAiLikeError(config.provider, response.status, parsed.error?.message, parsed.error?.code);
    }

    const rawContent = parsed.choices?.[0]?.message?.content;
    const content =
      typeof rawContent === 'string'
        ? rawContent
        : Array.isArray(rawContent)
          ? rawContent
              .map((part) => (part && part.type === 'text' && typeof part.text === 'string' ? part.text : ''))
              .join('')
          : '';

    if (!content.trim()) {
      throw new AiRepositoryError('Resposta vazia do provedor de IA.', 'AI_EMPTY_RESPONSE', 502);
    }

    return content;
  }

  private async callGemini(messages: AiMessage[]): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new AiRepositoryError('GEMINI_API_KEY nao configurada.', 'GEMINI_KEY_MISSING', 400);
    }

    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const prompt = [
      this.systemPrompt,
      ...messages.map((message) => `${message.role}: ${message.content}`),
    ].join('\n');

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4 },
        }),
      });
    } catch {
      throw new AiRepositoryError('Falha ao conectar ao provedor Gemini.', 'AI_PROVIDER_UNAVAILABLE', 502);
    }

    const parsed = (await this.readJson<GeminiResponse>(response)) || {};

    if (!response.ok) {
      throw new AiRepositoryError(
        parsed.error?.message || 'Falha na chamada Gemini.',
        'GEMINI_REQUEST_FAILED',
        response.status,
      );
    }

    const content = parsed.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
    if (!content.trim()) {
      throw new AiRepositoryError('Resposta vazia do Gemini.', 'AI_EMPTY_RESPONSE', 502);
    }

    return content;
  }

  private async readJson<T>(response: Response): Promise<T | null> {
    const raw = await response.text();
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private mapOpenAiLikeError(
    provider: AiProvider,
    status: number,
    providerMessage?: string,
    providerCode?: string,
  ): AiRepositoryError {
    const message = providerMessage || `Erro no provedor ${provider}.`;

    if (provider === 'openai') {
      if (status === 401) {
        return new AiRepositoryError(message, 'OPENAI_INVALID_KEY', 401);
      }
      if (status === 429) {
        if ((providerCode || '').toLowerCase().includes('insufficient_quota')) {
          return new AiRepositoryError(message, 'OPENAI_QUOTA_EXCEEDED', 429);
        }
        return new AiRepositoryError(message, 'OPENAI_RATE_LIMIT', 429);
      }
      if (status === 404 && /model/i.test(message)) {
        return new AiRepositoryError(message, 'OPENAI_MODEL_NOT_FOUND', 404);
      }
      if (status >= 500) {
        return new AiRepositoryError(message, 'OPENAI_TIMEOUT', 502);
      }
    }

    return new AiRepositoryError(message, `${provider.toUpperCase()}_REQUEST_FAILED`, status || 502);
  }
}

