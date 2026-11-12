import { API_CONFIG } from './apiConfig';
import { removerRoteiroDoCache, salvarRoteiroNoCache } from './roteiroCache';

export type StatusOrc = 'Rascunho' | 'Enviado' | 'Aprovado' | 'Rejeitado' | 'Cancelado';
export type StatusViagem = 'Não Iniciada' | 'Em Andamento' | 'Finalizada';

export interface DocumentoVenda {
  id: number;
  nome: string;
  tipo: string;
  arquivo: string;
}

export interface ItemOrc {
  id: number;
  descricao: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  desconto: number;
  link?: string;
  urlOperador?: string[];
  documentos?: DocumentoVenda[];
}

export interface Orcamento {
  id: number;
  numero: string;
  publicToken?: string;
  cliente: string;
  email: string;
  perfilViagem?: string[];
  promptPerfilViagemIA?: string;
  promptRoteiroIA?: string;
  passageiros?: string[];
  formaPagamento?: string;
  parcelas?: number | null;
  destino?: string;
  agenteViagem?: string;
  status: StatusOrc;
  statusViagem?: StatusViagem;
  dataCriacao: string;
  dataValidade?: string;

  itens?: ItemOrc[];
  pacotes?: any[];
  voos?: any[];
  hospedagem?: any[];
  roteiro?: string;
  dayByDay?: any[];
  transporte?: any[];
  restaurante?: any[];
  experiencias?: any[];
  seguro?: any[];
  observacoes?: string;
}

export type OrcamentoPayload = Omit<Orcamento, 'id'>;

const API_BASE_URL = API_CONFIG.apiBase;
const LIST_CACHE_TTL_MS = 60 * 1000;

let cachedList: { expiresAt: number; value: Orcamento[] } | null = null;
let pendingList: Promise<Orcamento[]> | null = null;

function invalidateListCache() {
  cachedList = null;
  pendingList = null;
}

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

export function listarOrcamentos() {
  if (cachedList && cachedList.expiresAt > Date.now()) {
    return Promise.resolve(cachedList.value);
  }

  if (pendingList) {
    return pendingList;
  }

  pendingList = request<Orcamento[]>('/orcamentos')
    .then((data) => {
      cachedList = { expiresAt: Date.now() + LIST_CACHE_TTL_MS, value: data };
      pendingList = null;
      return data;
    })
    .catch((error) => {
      pendingList = null;
      throw error;
    });

  return pendingList;
}

export function buscarOrcamentoPorId(id: number) {
  return request<Orcamento>(`/orcamentos/${id}`);
}

export function buscarOrcamentoPorNumero(numero: string) {
  const value = String(numero || '').trim();
  if (!value) {
    throw new Error('Número do orçamento não informado.');
  }

  return request<Orcamento>(`/orcamentos/numero/${encodeURIComponent(value)}`);
}

export function buscarOrcamentoPublico(publicToken: string) {
  const value = String(publicToken || '').trim();

  return request<Orcamento>(`/orcamentos/public/${encodeURIComponent(value)}`).catch((error) => {
    if (/^\d+$/.test(value)) {
      return buscarOrcamentoPorNumero(value);
    }

    throw error;
  });
}

export function criarOrcamento(payload: OrcamentoPayload) {
  return request<Orcamento>('/orcamentos', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((created) => {
    invalidateListCache();
    return created;
  });
}

export function atualizarOrcamento(id: number, payload: OrcamentoPayload) {
  return request<Orcamento>(`/orcamentos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }).then((updated) => {
    invalidateListCache();
    if (updated?.publicToken) {
      void salvarRoteiroNoCache(updated, true);
    }
    return updated;
  });
}

export function removerOrcamento(id: number) {
  return request<void>(`/orcamentos/${id}`, {
    method: 'DELETE',
  }).then(() => {
    invalidateListCache();
    return undefined;
  });
}

export async function limparCacheOrcamentoPublico(numero: string) {
  const value = String(numero || '').trim();
  if (!value) return;

  try {
    await removerRoteiroDoCache(value);
  } catch {
    // noop
  }
}