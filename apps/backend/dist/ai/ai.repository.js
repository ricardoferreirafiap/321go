"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiRepository = exports.AiRepositoryError = void 0;
const common_1 = require("@nestjs/common");
class AiRepositoryError extends Error {
    code;
    statusCode;
    constructor(message, code, statusCode) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
    }
}
exports.AiRepositoryError = AiRepositoryError;
let AiRepository = class AiRepository {
    systemPrompt = [
        'Voce e o Agente IA do PortalWeb.',
        'Responda sempre em portugues do Brasil.',
        'Seja objetivo, profissional e amigavel.',
        'Ajude com produtividade, atendimento comercial, vendas e suporte.',
    ].join(' ');
    async generateReply(provider, messages) {
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
                    baseUrl: process.env.CLOUDFLARE_BASE_URL ||
                        (process.env.CLOUDFLARE_ACCOUNT_ID
                            ? `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/v1`
                            : ''),
                }, messages);
            case 'wonderful':
                return this.callWonderfulAgent(messages);
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
    async callOpenAiCompatible(config, messages) {
        const providerKey = config.provider.toUpperCase();
        if (!config.apiKey) {
            const code = config.provider === 'openai' ? 'OPENAI_KEY_MISSING' : `${providerKey}_KEY_MISSING`;
            throw new AiRepositoryError(`${providerKey}_API_KEY nao configurada.`, code, 400);
        }
        if (!config.baseUrl) {
            throw new AiRepositoryError(`Base URL do provedor ${config.provider} nao configurada.`, 'AI_BASE_URL_MISSING', 500);
        }
        const endpointPath = config.endpointPath || '/chat/completions';
        const normalizedPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
        const endpoint = config.baseUrl.replace(/\/+$/g, '') + normalizedPath;
        const authHeaderName = (config.authHeaderName || 'Authorization').trim() || 'Authorization';
        const authHeaderValue = this.buildAuthHeaderValue(config.apiKey, config.authScheme);
        const body = {
            model: config.model,
            temperature: 0.4,
            messages: [{ role: 'system', content: this.systemPrompt }, ...messages],
        };
        let response;
        try {
            response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    [authHeaderName]: authHeaderValue,
                    ...(config.provider === 'wonderful' ? { 'x-api-key': config.apiKey } : {}),
                },
                body: JSON.stringify(body),
            });
        }
        catch {
            throw new AiRepositoryError('Falha ao conectar ao provedor de IA.', 'AI_PROVIDER_UNAVAILABLE', 502);
        }
        const parsed = await this.readPayload(response);
        if (!response.ok) {
            throw this.mapOpenAiLikeError(config.provider, response.status, parsed.json?.error?.message || parsed.text, parsed.json?.error?.code);
        }
        const rawContent = parsed.json?.choices?.[0]?.message?.content;
        const content = typeof rawContent === 'string'
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
    buildAuthHeaderValue(apiKey, authScheme) {
        const normalizedScheme = (authScheme || '').trim();
        if (!normalizedScheme || /^(none|raw)$/i.test(normalizedScheme)) {
            return String(apiKey);
        }
        return `${normalizedScheme} ${apiKey}`;
    }
    async callWonderfulAgent(messages) {
        const webhookUrl = (process.env.WONDERFUL_WEBHOOK_URL || '').trim();
        const webhookSecret = (process.env.WONDERFUL_WEBHOOK_SECRET || '').trim();
        const baseUrl = (process.env.WONDERFUL_BASE_URL || '').trim().replace(/\/+$/g, '');
        const apiKey = (process.env.WONDERFUL_API_KEY || '').trim();
        const workspaceId = (process.env.WONDERFUL_WORKSPACE_ID || '').trim();
        if (!webhookUrl || !webhookSecret || !baseUrl || !apiKey || !workspaceId) {
            throw new AiRepositoryError('Configuracao da Wonderful incompleta. Verifique WONDERFUL_WEBHOOK_URL, WONDERFUL_WEBHOOK_SECRET, WONDERFUL_BASE_URL, WONDERFUL_API_KEY e WONDERFUL_WORKSPACE_ID.', 'WONDERFUL_CONFIG_MISSING', 500);
        }
        const payload = this.buildWonderfulPayload(messages);
        let createResponse;
        try {
            createResponse = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Secret': webhookSecret,
                },
                body: JSON.stringify({ payload }),
            });
        }
        catch {
            throw new AiRepositoryError('Falha ao conectar ao webhook da Wonderful.', 'AI_PROVIDER_UNAVAILABLE', 502);
        }
        const createParsed = await this.readPayload(createResponse);
        if (!createResponse.ok) {
            throw new AiRepositoryError(createParsed.json?.error?.message || createParsed.text || 'Falha ao iniciar tarefa na Wonderful.', 'WONDERFUL_REQUEST_FAILED', createResponse.status || 502);
        }
        const taskId = String(createParsed.json?.data?.id || '').trim();
        if (!taskId) {
            throw new AiRepositoryError('Wonderful nao retornou o id da tarefa.', 'WONDERFUL_INVALID_RESPONSE', 502);
        }
        const pollIntervalMs = this.resolveWonderfulPollIntervalMs();
        const maxAttempts = this.resolveWonderfulMaxAttempts(pollIntervalMs);
        const taskUrl = `${baseUrl}/api/v1/tasks/${encodeURIComponent(taskId)}`;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            if (attempt > 0) {
                await this.sleep(pollIntervalMs);
            }
            let taskResponse;
            try {
                taskResponse = await fetch(taskUrl, {
                    method: 'GET',
                    headers: {
                        'x-api-key': apiKey,
                        'x-workspace-id': workspaceId,
                    },
                });
            }
            catch {
                throw new AiRepositoryError('Falha ao consultar tarefa na Wonderful.', 'AI_PROVIDER_UNAVAILABLE', 502);
            }
            const taskParsed = await this.readPayload(taskResponse);
            if (!taskResponse.ok) {
                throw new AiRepositoryError(taskParsed.json?.error?.message || taskParsed.text || 'Falha ao consultar status da tarefa na Wonderful.', 'WONDERFUL_REQUEST_FAILED', taskResponse.status || 502);
            }
            const status = String(taskParsed.json?.data?.task?.status || '').toLowerCase();
            if (status === 'completed') {
                const summary = taskParsed.json?.data?.task?.resolution_summary;
                const parsedSummary = this.parseWonderfulSummary(summary);
                if (String(parsedSummary?.status || '').toLowerCase() === 'missing_information') {
                    const details = this.normalizeMissingInformation(parsedSummary.missing_information);
                    throw new AiRepositoryError(`A Wonderful solicitou mais informacoes: ${details || 'dados obrigatorios ausentes.'}`, 'WONDERFUL_MISSING_INFORMATION', 400);
                }
                const content = this.normalizeWonderfulSummary(summary);
                if (!content) {
                    throw new AiRepositoryError('Tarefa concluida sem resolution_summary.', 'WONDERFUL_INVALID_RESPONSE', 502);
                }
                return content;
            }
            if (status === 'failed' || status === 'cancelled' || status === 'error') {
                const task = taskParsed.json?.data?.task;
                const reason = this.extractWonderfulFailureReason(task);
                const detail = reason ? ` Detalhe: ${reason}` : '';
                throw new AiRepositoryError(`A tarefa da Wonderful falhou.${detail}`, 'WONDERFUL_REQUEST_FAILED', 502);
            }
        }
        throw new AiRepositoryError('Tempo limite ao aguardar resposta da Wonderful.', 'WONDERFUL_TIMEOUT', 504);
    }
    buildWonderfulPayload(messages) {
        const userMessages = messages.filter((message) => message.role === 'user').map((message) => message.content);
        const source = userMessages[userMessages.length - 1] || messages[messages.length - 1]?.content || '';
        const buscaRestaurante = this.extractLineValue(source, /BUSCA_RESTAURANTE\s*:\s*(.+)/i);
        if (buscaRestaurante) {
            const tipoCozinha = this.extractLineValue(source, /COZINHA\s*:\s*(.+)/i) || 'nao informada';
            const faixaPreco = this.extractLineValue(source, /FAIXA_PRECO\s*:\s*(.+)/i) || 'nao informada';
            const referenciaExplita = this.extractLineValue(source, /REFERENCIA_RESTAURANTE\s*:\s*(.+)/i);
            const referenciaRestaurante = referenciaExplita || this.extractRestaurantReference(buscaRestaurante) || 'nao informada';
            const modoBusca = referenciaRestaurante !== 'nao informada' ? 'nome-restaurante' : 'local-cidade';
            const diasBuscaRaw = this.extractLineValue(source, /\b(\d+)\s*dias?\b|dias?\s*[:=]\s*(\d+)/i, true);
            const diasBusca = diasBuscaRaw ? Number(diasBuscaRaw) : 1;
            return {
                perfil: {
                    estilo: 'roteiro gastronomico',
                    orcamento: this.mapPriceRangeToBudget(faixaPreco) || this.detectBudget(source),
                    viajantes: 'casal',
                },
                destino: buscaRestaurante,
                dias: Number.isFinite(diasBusca) && diasBusca > 0 ? diasBusca : 1,
                preferencias: {
                    tipoCozinha,
                    faixaPreco,
                    referenciaRestaurante,
                    modoBusca,
                    consultaOriginal: buscaRestaurante,
                },
            };
        }
        const buscaExperiencias = this.extractLineValue(source, /BUSCA_EXPERIENCIAS?\s*:\s*(.+)/i);
        if (buscaExperiencias) {
            const referenciaAtracao = this.extractLineValue(source, /REFERENCIA_ATRACAO\s*:\s*(.+)/i);
            return {
                perfil: {
                    estilo: 'experiencias turisticas',
                    orcamento: this.detectBudget(source),
                    viajantes: this.detectTravelers(source),
                },
                destino: buscaExperiencias,
                dias: 1,
                preferencias: {
                    modoBusca: 'local-cidade-atracao',
                    referenciaAtracao: referenciaAtracao || 'nao informada',
                    consultaOriginal: buscaExperiencias,
                },
            };
        }
        const destino = this.extractWonderfulDestination(source);
        const diasRaw = this.extractLineValue(source, /\b(\d+)\s*dias?\b|dias?\s*[:=]\s*(\d+)/i, true);
        const dias = diasRaw ? Number(diasRaw) : null;
        const perfil = this.extractBlockValue(source, /-\s*Perfil da viagem selecionado:\s*([\s\S]*?)(?:\n\s*-\s*Diretrizes adicionais|$)/i);
        return {
            perfil: {
                estilo: perfil || 'nao informado',
                orcamento: this.detectBudget(source),
                viajantes: this.detectTravelers(source),
            },
            destino: destino || 'nao informado',
            dias: Number.isFinite(dias) && dias > 0 ? dias : 3,
        };
    }
    extractWonderfulDestination(source) {
        const fromRestaurantSearch = this.extractLineValue(source, /BUSCA_RESTAURANTE\s*:\s*(.+)/i);
        const fromPacotes = this.extractLineValue(source, /-\s*Destino\(s\)\s*priorizados\s*dos\s*pacotes[^:]*:\s*(.+)/i);
        const fromPrincipal = this.extractLineValue(source, /-\s*Destino principal:\s*(.+)/i);
        const fromVoos = this.extractLineValue(source, /-\s*Destino\(s\)\s*dos\s*voos:\s*(.+)/i);
        const fromIdaArrow = this.extractLineValue(source, /\bIda:\s*[^\n|]*?->\s*([^\n|]+?)(?:\s+em\s+\d{2}\/\d{2}\/\d{4}|\||$)/i);
        const candidates = [fromRestaurantSearch, fromPacotes, fromPrincipal, fromVoos, fromIdaArrow]
            .map((item) => this.normalizeDestinationCandidate(item))
            .filter(Boolean);
        return candidates[0] || '';
    }
    normalizeDestinationCandidate(value) {
        const trimmed = String(value || '').trim();
        if (!trimmed)
            return '';
        const cleaned = trimmed
            .replace(/^destino\s*[:\-]\s*/i, '')
            .replace(/^\*+|\*+$/g, '')
            .trim();
        const normalized = cleaned
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
        if (normalized === 'nao informado' ||
            normalized === 'nao informada' ||
            normalized === 'destino nao informado' ||
            normalized === 'destino nao informada') {
            return '';
        }
        return cleaned;
    }
    extractLineValue(input, pattern, captureAnyGroup = false) {
        const match = input.match(pattern);
        if (!match)
            return '';
        if (captureAnyGroup) {
            const group = match.slice(1).find((item) => item && item.trim());
            return (group || '').trim();
        }
        return String(match[1] || '').trim();
    }
    extractBlockValue(input, pattern) {
        const match = input.match(pattern);
        if (!match)
            return '';
        return String(match[1] || '').replace(/\s+/g, ' ').trim();
    }
    detectBudget(input) {
        const normalized = input.toLowerCase();
        if (normalized.includes('economic'))
            return 'economico';
        if (normalized.includes('econ'))
            return 'economico';
        if (normalized.includes('luxo'))
            return 'luxo';
        if (normalized.includes('premium'))
            return 'premium';
        return 'intermediario';
    }
    detectTravelers(input) {
        const normalized = input.toLowerCase();
        if (normalized.includes('crianca') || normalized.includes('crian'))
            return 'familia com criancas';
        if (normalized.includes('casal'))
            return 'casal';
        if (normalized.includes('grupo'))
            return 'grupo';
        if (normalized.includes('solo'))
            return 'viajante solo';
        return 'nao informado';
    }
    mapPriceRangeToBudget(priceRange) {
        const normalized = String(priceRange || '').trim();
        if (normalized === '$')
            return 'economico';
        if (normalized === '$$$')
            return 'luxo';
        if (normalized === '$$')
            return 'intermediario';
        return '';
    }
    extractRestaurantReference(query) {
        const normalizedQuery = String(query || '').trim();
        if (!normalizedQuery)
            return '';
        const quoted = normalizedQuery.match(/"([^"]+)"/) || normalizedQuery.match(/'([^']+)'/);
        if (quoted?.[1]) {
            return String(quoted[1]).trim();
        }
        const prefixed = normalizedQuery.match(/\b(?:restaurante|bistro|bistrô|cantina|churrascaria|pizzaria|bar)\s+([a-zA-ZÀ-ÿ0-9 .&'\-]{3,})/i);
        if (prefixed?.[1]) {
            return String(prefixed[1]).trim();
        }
        return '';
    }
    normalizeWonderfulSummary(summary) {
        if (!summary)
            return '';
        if (typeof summary === 'string')
            return summary.trim();
        try {
            return JSON.stringify(summary, null, 2);
        }
        catch {
            return String(summary);
        }
    }
    parseWonderfulSummary(summary) {
        if (!summary)
            return null;
        if (typeof summary === 'object') {
            return summary;
        }
        if (typeof summary !== 'string') {
            return null;
        }
        const trimmed = summary.trim();
        if (!trimmed) {
            return null;
        }
        try {
            const parsed = JSON.parse(trimmed);
            return parsed && typeof parsed === 'object' ? parsed : null;
        }
        catch {
            return null;
        }
    }
    normalizeMissingInformation(missing) {
        if (!missing)
            return '';
        if (Array.isArray(missing)) {
            return missing.map((item) => String(item).trim()).filter(Boolean).join(', ');
        }
        if (typeof missing === 'string')
            return missing.trim();
        try {
            return JSON.stringify(missing);
        }
        catch {
            return String(missing);
        }
    }
    extractWonderfulFailureReason(task) {
        if (!task)
            return '';
        const possibleKeys = [
            'failure_reason',
            'fail_reason',
            'error_message',
            'error',
            'message',
            'last_error',
            'status_detail',
            'status_message',
            'resolution_summary',
        ];
        for (const key of possibleKeys) {
            const value = task[key];
            if (!value)
                continue;
            if (typeof value === 'string' && value.trim()) {
                return value.trim();
            }
            try {
                const serialized = JSON.stringify(value);
                if (serialized && serialized !== '{}') {
                    return serialized;
                }
            }
            catch {
            }
        }
        return '';
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    resolveWonderfulPollIntervalMs() {
        const raw = Number(process.env.WONDERFUL_POLL_INTERVAL_MS || 2000);
        if (!Number.isFinite(raw))
            return 2000;
        return Math.min(10000, Math.max(1000, Math.floor(raw)));
    }
    resolveWonderfulMaxAttempts(intervalMs) {
        const raw = Number(process.env.WONDERFUL_MAX_ATTEMPTS || 0);
        if (Number.isFinite(raw) && raw > 0) {
            return Math.max(1, Math.floor(raw));
        }
        const timeoutMsRaw = Number(process.env.WONDERFUL_TIMEOUT_MS || 30000);
        const timeoutMs = Number.isFinite(timeoutMsRaw) && timeoutMsRaw > 0 ? Math.floor(timeoutMsRaw) : 30000;
        return Math.max(1, Math.ceil(timeoutMs / intervalMs));
    }
    async callGemini(messages) {
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
        let response;
        try {
            response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.4 },
                }),
            });
        }
        catch {
            throw new AiRepositoryError('Falha ao conectar ao provedor Gemini.', 'AI_PROVIDER_UNAVAILABLE', 502);
        }
        const parsed = await this.readPayload(response);
        if (!response.ok) {
            throw new AiRepositoryError(parsed.json?.error?.message || parsed.text || 'Falha na chamada Gemini.', 'GEMINI_REQUEST_FAILED', response.status);
        }
        const content = parsed.json?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
        if (!content.trim()) {
            throw new AiRepositoryError('Resposta vazia do Gemini.', 'AI_EMPTY_RESPONSE', 502);
        }
        return content;
    }
    async readPayload(response) {
        const raw = await response.text();
        if (!raw) {
            return { json: null, text: '' };
        }
        try {
            return { json: JSON.parse(raw), text: raw };
        }
        catch {
            return { json: null, text: raw };
        }
    }
    mapOpenAiLikeError(provider, status, providerMessage, providerCode) {
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
};
exports.AiRepository = AiRepository;
exports.AiRepository = AiRepository = __decorate([
    (0, common_1.Injectable)()
], AiRepository);
//# sourceMappingURL=ai.repository.js.map