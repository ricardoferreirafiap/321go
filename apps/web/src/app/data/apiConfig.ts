// Configuração centralizada de URLs da API
// Em produção, o frontend deve apontar explicitamente para o backend do Vercel.
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

const defaultLocalApi = 'http://localhost:3001';
const resolvedBase = normalizeBase(envBase) || defaultLocalApi;

export const API_CONFIG = {
  // Prefixo para chamadas ao backend. Em produção deve ser preenchido via VITE_API_URL.
  apiBase: resolvedBase,
};