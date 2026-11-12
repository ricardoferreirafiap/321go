import { API_CONFIG } from './apiConfig';

export interface DestinationApiResponseItem {
  id: number;
  data: Record<string, unknown>;
}

export interface HospedagemDestinoResultado {
  placeId: number;
  nome: string;
  local: string;
  endereco: string;
  classificacao: number;
  totalAvaliacoes: number;
  tiposQuarto: string[];
  amenidades: string[];
  precoBase: number;
  photos: string | null;
  linkOperadora: string;
}

export interface HospedagemBuscaResponse {
  itens: HospedagemDestinoResultado[];
  fallback: boolean;
  fallbackReason?: string;
}

export interface ExperienciaDestinoResultado {
  placeId: number;
  nome: string;
  local: string;
  endereco: string;
  classificacao: number;
  totalAvaliacoes: number;
  descricao: string;
  priceLevel: string | number;
}

export interface RestauranteDestinoResultado {
  placeId: number;
  nome: string;
  local: string;
  endereco: string;
  classificacao: number;
  totalAvaliacoes: number;
  telefone: string;
  website: string;
  priceLevel: string | number;
}

export interface RestauranteBuscaResponse {
  itens: RestauranteDestinoResultado[];
  fallback: boolean;
  fallbackReason?: string;
}

export interface ExperienciaBuscaResponse {
  itens: ExperienciaDestinoResultado[];
  fallback: boolean;
  fallbackReason?: string;
}

const API_BASE_URL = API_CONFIG.apiBase;

async function request<T>(path: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch {
    throw new Error('Não foi possível conectar ao backend de destinos.');
  }

  const contentType = response.headers.get('content-type') || '';
  const responseText = await response.text();
  const isLikelyHtml = responseText.trimStart().startsWith('<!DOCTYPE') || responseText.trimStart().startsWith('<html');

  let parsedBody: Record<string, unknown> | null = null;
  if (responseText) {
    try {
      parsedBody = JSON.parse(responseText) as Record<string, unknown>;
    } catch {
      parsedBody = null;
    }
  }

  const parsedBodyData = parsedBody ?? {};

  if (!response.ok) {
    if (isLikelyHtml) {
      throw new Error('A rota da API de destinos retornou HTML. Verifique a configuração do backend NestJS.');
    }

    const apiMessage = Array.isArray(parsedBodyData.message)
      ? parsedBodyData.message.join(', ')
      : parsedBodyData.message;

    throw new Error(String(apiMessage || parsedBodyData.error || `Erro ao comunicar com o servidor (${response.status}).`));
  }

  if (isLikelyHtml || !contentType.includes('application/json')) {
    throw new Error('Resposta inválida da API de destinos: esperado JSON.');
  }

  return parsedBody as T;
}

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getString(data: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function getNumber(data: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const value = data[key];
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric;
    }
  }

  return 0;
}

function getStringArray(data: Record<string, unknown>, keys: string[]): string[] {
  for (const key of keys) {
    const value = data[key];
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }
  }

  return [];
}

function buildSearchableText(data: Record<string, unknown>): string {
  return normalizeText(
    [
      data['nome'],
      data['name'],
      data['titulo'],
      data['title'],
      data['local'],
      data['cidade'],
      data['estado'],
      data['pais'],
      data['endereco'],
      data['descricao'],
      data['tipo'],
      data['categoria'],
    ]
      .filter(Boolean)
      .join(' '),
  );
}

async function fetchDestinations(query: string, limit = 200): Promise<DestinationApiResponseItem[]> {
  const items = await request<DestinationApiResponseItem[]>(`/destinations?limit=${limit}&offset=0`);
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) => buildSearchableText(item.data).includes(normalizedQuery));
}

function buildHospedagemFallbackItens(query: string): HospedagemDestinoResultado[] {
  const normalizedQuery = String(query || '').trim() || 'Destino';
  const city = (normalizedQuery.split(',')[0] || normalizedQuery).trim();

  const baseNames = [
    'Hotel Central',
    'Pousada Vista Mar',
    'Resort Premium',
    'Hotel Boutique',
    'Suítes Executivas',
  ];

  return baseNames.map((baseName, index) => ({
    placeId: index + 1,
    nome: `${baseName} ${city}`,
    local: city,
    endereco: `${city}, Brasil`,
    classificacao: 4.2,
    totalAvaliacoes: 120 + index * 35,
    tiposQuarto: ['Standard', 'Superior', 'Suíte'],
    amenidades: ['Wi-Fi', 'Café da manhã', 'Recepção 24h'],
    precoBase: 320 + index * 40,
    photos: null,
    linkOperadora: '',
  }));
}

export async function buscarHospedagensDestino(query: string): Promise<HospedagemBuscaResponse> {
  const normalizedQuery = String(query || '').trim();
  if (!normalizedQuery) {
    return { itens: [], fallback: false };
  }

  try {
    const response = await request<{ totalPlaces?: number; options?: HospedagemDestinoResultado[]; fallback?: string }>(
      `/place-lodging?place=${encodeURIComponent(normalizedQuery)}`,
    );

    const options = Array.isArray(response?.options) ? response.options : [];
    const itens = options.slice(0, 10).map((item, index) => ({
      placeId: Number(item?.placeId) || index + 1,
      nome: String(item?.nome || normalizedQuery),
      local: String(item?.local || normalizedQuery),
      endereco: String(item?.endereco || normalizedQuery),
      classificacao: Number(item?.classificacao || 0),
      totalAvaliacoes: Number(item?.totalAvaliacoes || 0),
      tiposQuarto: Array.isArray(item?.tiposQuarto) && item.tiposQuarto.length ? item.tiposQuarto : ['Standard', 'Superior', 'Suíte'],
      amenidades: Array.isArray(item?.amenidades) && item.amenidades.length ? item.amenidades : ['WiFi Grátis', 'Café da Manhã'],
      precoBase: Number(item?.precoBase || 150),
      photos: item?.photos || null,
      linkOperadora: String(item?.linkOperadora || ''),
    }));

    return {
      itens,
      fallback: typeof response?.fallback === 'string' && response.fallback.length > 0,
      fallbackReason: typeof response?.fallback === 'string' ? response.fallback : undefined,
    };
  } catch {
    try {
      const items = await fetchDestinations(normalizedQuery);

      const itens = items.slice(0, 10).map((item) => {
        const nome = getString(item.data, ['nome', 'name', 'titulo', 'title']) || normalizedQuery;
        const local = getString(item.data, ['local', 'cidade', 'destino', 'nome', 'name']) || normalizedQuery;
        const endereco = getString(item.data, ['endereco', 'formattedAddress', 'address']) || local;
        const classificacao = getNumber(item.data, ['classificacao', 'rating', 'score']);
        const totalAvaliacoes = getNumber(item.data, ['totalAvaliacoes', 'userRatingCount', 'avaliacoes']);
        const amenidades = getStringArray(item.data, ['amenidades', 'amenities', 'facilidades']);
        const precoBase = getNumber(item.data, ['precoBase', 'preco', 'price']) || 150;
        const tiposQuarto = getStringArray(item.data, ['tiposQuarto', 'roomTypes']);

        return {
          placeId: item.id,
          nome,
          local,
          endereco,
          classificacao,
          totalAvaliacoes,
          tiposQuarto: tiposQuarto.length ? tiposQuarto : ['Standard', 'Superior', 'Suíte'],
          amenidades: amenidades.length ? amenidades : ['WiFi Grátis', 'Café da Manhã'],
          precoBase,
          photos: null,
          linkOperadora: getString(item.data, ['linkOperadora', 'website', 'url']),
        };
      });

      if (itens.length > 0) {
        return {
          itens,
          fallback: true,
          fallbackReason: 'legacy-dataset',
        };
      }
    } catch {
      // segue para fallback local em memória
    }

    return {
      itens: buildHospedagemFallbackItens(normalizedQuery),
      fallback: true,
      fallbackReason: 'local-fallback',
    };
  }
}

export async function buscarExperienciasDestino(query: string): Promise<ExperienciaBuscaResponse> {
  const normalizedQuery = String(query || '').trim();
  if (!normalizedQuery) {
    return { itens: [], fallback: false };
  }

  try {
    const response = await request<{ options?: ExperienciaDestinoResultado[]; fallback?: string }>(
      `/place-experiences?place=${encodeURIComponent(normalizedQuery)}`,
    );

    const options = Array.isArray(response?.options) ? response.options : [];
    const itens = options.slice(0, 10).map((item, index) => ({
      placeId: Number(item?.placeId) || index + 1,
      nome: String(item?.nome || normalizedQuery),
      local: String(item?.local || normalizedQuery),
      endereco: String(item?.endereco || normalizedQuery),
      classificacao: Number(item?.classificacao || 0),
      totalAvaliacoes: Number(item?.totalAvaliacoes || 0),
      descricao: String(item?.descricao || ''),
      priceLevel: String(item?.priceLevel || ''),
    }));

    return {
      itens,
      fallback: typeof response?.fallback === 'string' && response.fallback.length > 0,
      fallbackReason: typeof response?.fallback === 'string' ? response.fallback : undefined,
    };
  } catch {
    const items = await fetchDestinations(normalizedQuery);
    const itens = items.slice(0, 10).map((item) => ({
      placeId: item.id,
      nome: getString(item.data, ['nome', 'name', 'titulo', 'title']) || normalizedQuery,
      local: getString(item.data, ['local', 'cidade', 'destino', 'nome', 'name']) || normalizedQuery,
      endereco: getString(item.data, ['endereco', 'formattedAddress', 'address']) || normalizedQuery,
      classificacao: getNumber(item.data, ['classificacao', 'rating', 'score']),
      totalAvaliacoes: getNumber(item.data, ['totalAvaliacoes', 'userRatingCount', 'avaliacoes']),
      descricao: getString(item.data, ['descricao', 'description', 'resumo']),
      priceLevel: getString(item.data, ['priceLevel', 'faixaPreco']) || getNumber(item.data, ['priceLevel', 'price']),
    }));

    return {
      itens,
      fallback: true,
      fallbackReason: 'legacy-dataset',
    };
  }
}

export async function buscarRestaurantesDestino(query: string): Promise<RestauranteBuscaResponse> {
  const normalizedQuery = String(query || '').trim();
  if (!normalizedQuery) {
    return { itens: [], fallback: false };
  }

  try {
    const response = await request<{ options?: RestauranteDestinoResultado[]; fallback?: string }>(
      `/place-restaurants?place=${encodeURIComponent(normalizedQuery)}`,
    );

    const options = Array.isArray(response?.options) ? response.options : [];
    const itens = options.slice(0, 10).map((item, index) => ({
      placeId: Number(item?.placeId) || index + 1,
      nome: String(item?.nome || normalizedQuery),
      local: String(item?.local || normalizedQuery),
      endereco: String(item?.endereco || normalizedQuery),
      classificacao: Number(item?.classificacao || 0),
      totalAvaliacoes: Number(item?.totalAvaliacoes || 0),
      telefone: String(item?.telefone || ''),
      website: String(item?.website || ''),
      priceLevel: String(item?.priceLevel || ''),
    }));

    return {
      itens,
      fallback: typeof response?.fallback === 'string' && response.fallback.length > 0,
      fallbackReason: typeof response?.fallback === 'string' ? response.fallback : undefined,
    };
  } catch {
    const items = await fetchDestinations(normalizedQuery);
    const itens = items.slice(0, 10).map((item) => ({
      placeId: item.id,
      nome: getString(item.data, ['nome', 'name', 'titulo', 'title']) || normalizedQuery,
      local: getString(item.data, ['local', 'cidade', 'destino', 'nome', 'name']) || normalizedQuery,
      endereco: getString(item.data, ['endereco', 'formattedAddress', 'address']) || normalizedQuery,
      classificacao: getNumber(item.data, ['classificacao', 'rating', 'score']),
      totalAvaliacoes: getNumber(item.data, ['totalAvaliacoes', 'userRatingCount', 'avaliacoes']),
      telefone: getString(item.data, ['telefone', 'phone', 'internationalPhoneNumber']),
      website: getString(item.data, ['website', 'websiteUri', 'url']),
      priceLevel: getString(item.data, ['priceLevel', 'faixaPreco']) || getNumber(item.data, ['priceLevel', 'price']),
    }));

    return {
      itens,
      fallback: true,
      fallbackReason: 'legacy-dataset',
    };
  }
}