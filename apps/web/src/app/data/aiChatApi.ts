import { API_CONFIG } from './apiConfig';

export type AIChatRole = "user" | "assistant";

export interface AIChatApiTextContentPart {
  type: "text";
  text: string;
}

export interface AIChatApiImageContentPart {
  type: "image_url";
  image_url: {
    url: string;
  };
}

export type AIChatApiMessageContent =
  | string
  | Array<AIChatApiTextContentPart | AIChatApiImageContentPart>;

export interface AIChatApiMessage {
  role: AIChatRole;
  content: AIChatApiMessageContent;
}

interface AIChatResponse {
  reply: string;
}

interface AIChatErrorResponse {
  error?: string;
  code?: string;
}

function mapAiError(code: string, fallback: string): string {
  switch (code) {
    case "OPENAI_KEY_MISSING":
    case "OPENAI_INVALID_KEY":
      return "A chave da OpenAI esta invalida ou ausente no backend. Verifique OPENAI_API_KEY.";
    case "OPENAI_QUOTA_EXCEEDED":
      return "Seu limite de cota da OpenAI foi atingido. Verifique faturamento e creditos.";
    case "OPENAI_RATE_LIMIT":
      return "Muitas requisicoes em sequencia. Aguarde alguns segundos e tente novamente.";
    case "OPENAI_MODEL_NOT_FOUND":
      return "O modelo configurado em OPENAI_MODEL nao existe ou nao esta disponivel para sua conta.";
    case "OPENAI_TIMEOUT":
      return "A resposta da OpenAI demorou demais. Tente novamente.";
    case "WONDERFUL_KEY_MISSING":
      return "A chave da Wonderful esta ausente no backend. Verifique WONDERFUL_API_KEY.";
    case "WONDERFUL_CONFIG_MISSING":
      return "Configuracao da Wonderful incompleta no backend. Verifique WEBHOOK_URL, WEBHOOK_SECRET, BASE_URL, API_KEY e WORKSPACE_ID.";
    case "WONDERFUL_REQUEST_FAILED":
      return sanitizeProviderFallbackMessage(fallback);
    case "WONDERFUL_MISSING_INFORMATION":
      return sanitizeProviderFallbackMessage(fallback);
    case "WONDERFUL_TIMEOUT":
      return "A Wonderful demorou para concluir o roteiro. Tente novamente em alguns instantes.";
    case "AI_BASE_URL_MISSING":
      return "A URL base do provedor de IA nao esta configurada no backend. Ajuste as variaveis de ambiente do provedor selecionado.";
    case "AI_PROVIDER_UNAVAILABLE":
      return "Nao foi possivel conectar ao provedor de IA. Tente novamente em instantes.";
    default:
      return sanitizeProviderFallbackMessage(fallback);
  }
}

function sanitizeProviderFallbackMessage(message: string): string {
  const text = String(message || "").trim();
  if (!text) {
    return "Falha ao processar a resposta do provedor de IA.";
  }

  // Evita exibir paginas HTML completas de erro no frontend.
  if (/<!doctype html>/i.test(text) || /<html[\s>]/i.test(text)) {
    if (/bucket cannot be viewed|not authorized to view this bucket/i.test(text)) {
      return "A URL configurada para o provedor Wonderful nao e uma API de chat valida (retornou pagina de bucket/Cloudflare). Ajuste WONDERFUL_BASE_URL para o endpoint oficial da API.";
    }
    return "O provedor de IA retornou uma resposta invalida em HTML. Verifique a URL base e as credenciais do provedor.";
  }

  return text;
}

const API_BASE_URL = API_CONFIG.apiBase;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
      ...options,
    });
  } catch {
    throw new Error("Nao foi possivel conectar ao backend de IA.");
  }

  const responseText = await response.text();
  let parsedBody: AIChatResponse | AIChatErrorResponse | null = null;

  if (responseText) {
    try {
      parsedBody = JSON.parse(responseText);
    } catch {
      parsedBody = null;
    }
  }

  if (!response.ok) {
    const backendCode =
      parsedBody && "code" in parsedBody && typeof parsedBody.code === "string"
        ? parsedBody.code
        : "";
    const fallbackMessage =
      parsedBody && "error" in parsedBody && typeof parsedBody.error === "string"
        ? parsedBody.error
        : `Erro ao comunicar com o servidor (${response.status}).`;

    throw new Error(mapAiError(backendCode, fallbackMessage));
  }

  if (!parsedBody || !("reply" in parsedBody) || typeof parsedBody.reply !== "string") {
    throw new Error("Resposta invalida da API de IA.");
  }

  return parsedBody as T;
}

export function enviarMensagemIA(
  messages: AIChatApiMessage[],
  provedor?: "openai" | "groq" | "gemini" | "openrouter" | "cloudflare" | "wonderful"
) {
  return request<AIChatResponse>("/ai/chat", {
    method: "POST",
    body: JSON.stringify({ messages, provedor }),
  });
}