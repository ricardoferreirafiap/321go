import { API_CONFIG } from './apiConfig';

export type StatusLead = 'Novo' | 'Em Contato' | 'Qualificado' | 'Perdido' | 'Vendido';
export type StatusCrm = 'Novo Lead' | 'Qualificação' | 'Reunião' | 'Follow-ups' | 'Pagos' | 'Nutrição' | 'Finalizados';

export interface Lead {
  id: number;
  nome: string;
  email: string;
  whatsapp: string;
  status: StatusLead;
  statusCrm: StatusCrm;
  viagens: number;
  criadoEm: string;
  atendente: string;
}

export type LeadPayload = Omit<Lead, 'id'>;

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

export function listarLeads() {
  return request<Lead[]>('/leads');
}

export function criarLead(payload: LeadPayload) {
  return request<Lead>('/leads', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function atualizarLead(id: number, payload: LeadPayload) {
  return request<Lead>(`/leads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function removerLead(id: number) {
  return request<void>(`/leads/${id}`, {
    method: 'DELETE',
  });
}