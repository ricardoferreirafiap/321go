import { API_CONFIG } from './apiConfig';

export type TipoLancamento = 'receita' | 'despesa';

export interface LancamentoFinanceiro {
  id: number;
  tipo: TipoLancamento;
  descricao: string;
  valor: number;
  comissaoPercentual: number | null;
  comissaoValor: number | null;
  data: string;
  oculto: boolean;
  orcamentoPago: boolean;
  formaPagamento: string;
  parcelas: number | null;
  orcamentoId: number | null;
  orcamentoNumero: string;
  cliente: string;
}

export interface LancamentoFinanceiroPayload {
  tipo: TipoLancamento;
  descricao: string;
  valor: number;
  comissaoPercentual?: number | null;
  comissaoValor?: number | null;
  data: string;
  oculto?: boolean;
  orcamentoPago?: boolean;
  formaPagamento?: string;
  parcelas?: number | null;
  orcamentoId?: number | null;
}

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

export function listarLancamentosFinanceiros() {
  return request<LancamentoFinanceiro[]>('/financeiro');
}

export function criarLancamentoFinanceiro(payload: LancamentoFinanceiroPayload) {
  return request<LancamentoFinanceiro>('/financeiro', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function atualizarLancamentoFinanceiro(id: number, payload: LancamentoFinanceiroPayload) {
  return request<LancamentoFinanceiro>(`/financeiro/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function removerLancamentoFinanceiro(id: number) {
  return request<void>(`/financeiro/${id}`, {
    method: 'DELETE',
  });
}