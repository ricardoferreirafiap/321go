import { API_CONFIG } from './apiConfig';

export interface Produto {
  id: number;
  nome: string;
  codigo: string;
  categoria: string;
  preco: number;
  fornecedor: string;
  operadora: string;
  unidade: string;
  status: 'Ativo' | 'Inativo';
}

export type ProdutoPayload = Omit<Produto, 'id'>;

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
    throw new Error('Nao foi possivel conectar ao backend. Verifique se o servidor esta rodando e se a URL da API esta correta.');
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
    throw new Error('Resposta invalida da API: esperado JSON. Verifique a configuracao de deploy do backend.');
  }

  return parsedBody as T;
}

export function listarProdutos() {
  return request<Produto[]>('/produtos');
}

export function criarProduto(payload: ProdutoPayload) {
  return request<Produto>('/produtos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function atualizarProduto(id: number, payload: ProdutoPayload) {
  return request<Produto>(`/produtos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}