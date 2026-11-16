// Configuração centralizada de URLs da API
// Em produção, o frontend deve chamar o backend via VITE_API_URL.
// Nunca forçar /api quando a URL do backend foi configurada corretamente.
const envBase =
  typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : undefined;

const normalizeBase = (value?: string) => {
  if (!value) return undefined;

  let trimmed = value.trim().replace(/\/+$/g, '');
  if (!trimmed) return undefined;

  if (trimmed === '/' || trimmed === '/api') return '/api';
  if (trimmed.endsWith('/api')) {
    trimmed = trimmed.slice(0, -'/api'.length);
  }

  if (!trimmed) return '/api';
  if (trimmed.startsWith('/')) return trimmed;
  return trimmed;
};

const currentHost = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
const isLocalhost = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(currentHost);
const envBaseNormalized = normalizeBase(envBase);

export const API_CONFIG = {
  // Em produção, usar o backend explícito. Em desenvolvimento local, /api pode ser usado via proxy do Vite.
  apiBase: envBaseNormalized || (isLocalhost ? '/api' : 'https://321go-backend.vercel.app'),
};