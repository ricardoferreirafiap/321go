import { API_CONFIG } from './apiConfig';

export type TipoEvento = 'Reunião' | 'Viagem' | 'Tarefa' | 'Lembrete' | 'Outro';

export interface Evento {
  id?: number;
  titulo: string;
  descricao?: string;
  data: string;
  hora: string;
  tipo: string;
  cliente?: string;
  agente?: string;
}

export type EventoPayload = Omit<Evento, 'id'>;

const API_BASE_URL = API_CONFIG.apiBase;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      ...options,
    });
  } catch {
    throw new Error('Não foi possível conectar ao backend. Verifique se o servidor está rodando e se a URL da API está correta.');
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
      throw new Error('A rota da API retornou HTML. No Vercel, configure VITE_API_URL para o backend e exclua /api do rewrite para index.html.');
    }

    throw new Error(parsedBody?.error || `Erro ao comunicar com o servidor (${response.status}).`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (isLikelyHtml || !contentType.includes('application/json')) {
    throw new Error('Resposta inválida da API: esperado JSON. Verifique a configuração de deploy do backend.');
  }

  return parsedBody as T;
}

export function listarEventos() {
  return request<Evento[]>('/eventos');
}

export function criarEvento(payload: EventoPayload) {
  return request<Evento>('/eventos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function atualizarEvento(id: number, payload: EventoPayload) {
  return request<Evento>(`/eventos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function removerEvento(id: number) {
  return request<void>(`/eventos/${id}`, {
    method: 'DELETE',
  });
}