export type AiProvider = 'openai' | 'groq' | 'gemini' | 'openrouter' | 'cloudflare' | 'wonderful';
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
    private buildAuthHeaderValue;
    private callWonderfulAgent;
    private buildWonderfulPayload;
    private extractWonderfulDestination;
    private normalizeDestinationCandidate;
    private extractLineValue;
    private extractBlockValue;
    private detectBudget;
    private detectTravelers;
    private normalizeWonderfulSummary;
    private normalizeMissingInformation;
    private extractWonderfulFailureReason;
    private sleep;
    private resolveWonderfulPollIntervalMs;
    private resolveWonderfulMaxAttempts;
    private callGemini;
    private readPayload;
    private mapOpenAiLikeError;
}
