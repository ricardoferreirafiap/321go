// Configuração centralizada de URLs da API
// Em produção, quando o frontend e o backend ficam no mesmo domínio, use /api.
const envBase =
  typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : undefined;

const normalizeBase = (value?: string) => {
  if (!value) return undefined;

  const trimmed = value.trim().replace(/\/+$/g, '');
  if (!trimmed) return undefined;
  if (trimmed.startsWith('/')) return trimmed;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') {
      return trimmed;
    }
    return trimmed;
  } catch {
    return trimmed;
  }
};

const productionBase = 'https://321go-backend.vercel.app';
const resolvedBase = normalizeBase(envBase) || productionBase;

export const API_CONFIG = {
  // Prefixo para chamadas ao backend (inclui /api)
  apiBase: resolvedBase,
};