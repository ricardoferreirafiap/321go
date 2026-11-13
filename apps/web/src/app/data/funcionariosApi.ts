import { API_CONFIG } from './apiConfig';

export interface Funcionario {
  id: number;
  name: string;
  role: string;
  department: string;
  status: 'Ativo' | 'Inativo';
  initials: string;
  accessLevel: 'Administrador' | 'Agente';
  email: string;
  saudacoes?: string;
  password?: string;
  photo?: string;
}

export interface LoginFuncionarioResponse {
  message: string;
  accessToken: string;
  funcionario: Funcionario;
}

export type FuncionarioPayload = Omit<Funcionario, 'id' | 'initials'>;

const API_BASE_URL = API_CONFIG.apiBase;
const LIST_CACHE_TTL_MS = 5 * 60 * 1000;

function logApiFailure(context: string, details: Record<string, unknown>) {
  console.error(`[API_FAILURE] ${context}`, details);
}

function buildApiFailureDetails(context: string, url: string, options?: RequestInit, error?: unknown, response?: Response, responseText?: string) {
  return {
    context,
    url,
    method: options?.method || 'GET',
    headers: options?.headers || {},
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
    responseStatus: response?.status,
    responseStatusText: response?.statusText,
    contentType: response ? response.headers.get('content-type') : undefined,
    responseBodyPreview: typeof responseText === 'string' ? responseText.slice(0, 1000) : undefined,
  };
}

let cachedList: { expiresAt: number; value: Funcionario[] } | null = null;
let pendingList: Promise<Funcionario[]> | null = null;

function invalidateListCache() {
  cachedList = null;
  pendingList = null;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  const url = `${API_BASE_URL}${path}`;

  try {
    response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      ...options,
    });
  } catch (error) {
    logApiFailure('fetch failed', buildApiFailureDetails('funcionarios request', url, options, error));
    throw new Error(`Não foi possível conectar ao backend. URL: ${url}. Verifique se o servidor está rodando e se a URL da API está correta. Detalhes no console.`);
  }

  const contentType = response.headers.get('content-type') || '';
  const responseText = await response.text();

  const isLikelyHtml = responseText.trimStart().startsWith('<!DOCTYPE') || responseText.trimStart().startsWith('<html');

  let parsedBody: any = null;
  if (responseText) {
    try {
      parsedBody = JSON.parse(responseText);
    } catch {
      parsedBody = null;
    }
  }

  if (!response.ok) {
    if (isLikelyHtml) {
      logApiFailure('html response', buildApiFailureDetails('funcionarios html response', url, options, undefined, response, responseText));
      throw new Error('A rota da API retornou HTML. No Vercel, configure VITE_API_URL para o backend e exclua /api do rewrite para index.html.');
    }

    logApiFailure('non-ok api response', buildApiFailureDetails('funcionarios non-ok response', url, options, undefined, response, responseText));
    throw new Error(parsedBody?.error || `Erro ao comunicar com o servidor (${response.status}).`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (isLikelyHtml || !contentType.includes('application/json')) {
    logApiFailure('invalid json response', buildApiFailureDetails('funcionarios invalid json response', url, options, undefined, response, responseText));
    throw new Error('Resposta inválida da API: esperado JSON. Verifique a configuração de deploy do backend.');
  }

  return parsedBody as T;
}

export function listarFuncionarios() {
  if (cachedList && cachedList.expiresAt > Date.now()) {
    return Promise.resolve(cachedList.value);
  }

  if (pendingList) {
    return pendingList;
  }

  pendingList = request<Funcionario[]>('/funcionarios')
    .then((value) => {
      cachedList = { expiresAt: Date.now() + LIST_CACHE_TTL_MS, value };
      return value;
    })
    .finally(() => {
      pendingList = null;
    });

  return pendingList;
}

export async function criarFuncionario(payload: FuncionarioPayload) {
  const funcionario = await request<Funcionario>('/funcionarios', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  invalidateListCache();
  return funcionario;
}

export async function atualizarFuncionario(id: number, payload: FuncionarioPayload) {
  const funcionario = await request<Funcionario>(`/funcionarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  invalidateListCache();
  return funcionario;
}

export async function removerFuncionario(id: number) {
  await request<void>(`/funcionarios/${id}`, {
    method: 'DELETE',
  });
  invalidateListCache();
}

export function loginFuncionario(email: string, password: string) {
  return (async () => {
    const url = `${API_BASE_URL}/auth/funcionarios/login`;
    let response: Response;

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
    } catch (error) {
      logApiFailure('login fetch failed', buildApiFailureDetails('funcionarios login request', url, { method: 'POST', body: JSON.stringify({ email, password }) }, error));
      throw new Error(`Não foi possível conectar ao backend. URL: ${url}. Verifique se o servidor está rodando e se a URL da API está correta. Detalhes no console.`);
    }

    const contentType = response.headers.get('content-type') || '';
    const responseText = await response.text();
    const isLikelyHtml = responseText.trimStart().startsWith('<!DOCTYPE') || responseText.trimStart().startsWith('<html');

    let parsedBody: unknown = null;
    if (responseText) {
      try {
        parsedBody = JSON.parse(responseText);
      } catch {
        parsedBody = null;
      }
    }

    const apiPayload =
      parsedBody && typeof parsedBody === 'object'
        ? (parsedBody as { message?: string | string[]; error?: string })
        : null;

    if (!response.ok) {
      if (isLikelyHtml) {
        logApiFailure('login html response', buildApiFailureDetails('funcionarios login html response', url, { method: 'POST' }, undefined, response, responseText));
        throw new Error('A rota da API retornou HTML. Verifique a configuração do backend de autenticação.');
      }

      const apiMessage = Array.isArray(apiPayload?.message)
        ? apiPayload.message.join(', ')
        : typeof apiPayload?.message === 'string'
          ? apiPayload.message
          : undefined;

      logApiFailure('login non-ok response', buildApiFailureDetails('funcionarios login non-ok response', url, { method: 'POST' }, undefined, response, responseText));
      throw new Error(apiMessage || apiPayload?.error || `Erro ao comunicar com o servidor (${response.status}).`);
    }

    if (isLikelyHtml || !contentType.includes('application/json')) {
      logApiFailure('login invalid json response', buildApiFailureDetails('funcionarios login invalid json response', url, { method: 'POST' }, undefined, response, responseText));
      throw new Error('Resposta inválida da API: esperado JSON. Verifique a configuração de deploy do backend.');
    }

    return parsedBody as LoginFuncionarioResponse;
  })();
}