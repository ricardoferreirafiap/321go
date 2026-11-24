export type AiProvider = 'openai' | 'groq' | 'gemini' | 'openrouter' | 'cloudflare';
export type AiMessage = {
    role: 'user' | 'assistant';
    content: string;
};
export declare class AiRepositoryError extends Error {
    readonly code: string;
    readonly statusCode: number;
    constructor(message: string, code: string, statusCode: number);
}
export declare class AiRepository {
    private readonly systemPrompt;
    generateReply(provider: AiProvider, messages: AiMessage[]): Promise<string>;
    private callOpenAiCompatible;
    private callGemini;
    private readJson;
    private mapOpenAiLikeError;
}
