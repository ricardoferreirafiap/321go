// Configuração centralizada de URLs da API
// Em produção, o frontend deve chamar o backend via VITE_API_URL.
// A base do backend deve incluir /api porque todos os endpoints do backend estão sob esse prefixo.
const envBase =
  typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : undefined;

const normalizeBase = (value?: string) => {
  if (!value) return undefined;

  const trimmed = value.trim().replace(/\/+$/g, '');
  if (!trimmed) return undefined;

  if (trimmed === '/') return '/api';
  if (trimmed === '/api') return '/api';
  if (trimmed.endsWith('/api')) return trimmed;

  return `${trimmed}/api`;
};

const currentHost = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
const isLocalhost = /^(localhost|127\.0\.0\.1|\[::1])$/.test(currentHost);
const envBaseNormalized = normalizeBase(envBase);

export const API_CONFIG = {
  // Em produção, usar o backend explícito ou o mesmo domínio com /api.
  // Em desenvolvimento local, o backend fica em http://localhost:3001/api.
  apiBase:
    envBaseNormalized ||
    (isLocalhost ? 'http://localhost:3001/api' : 'https://321go-backend.vercel.app/api'),
};