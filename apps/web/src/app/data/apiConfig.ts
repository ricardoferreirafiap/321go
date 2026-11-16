// Configuração centralizada e explícita do backend.
// O frontend nunca deve chamar rotas relativas em /api no mesmo domínio da SPA.
const envBase =
  typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : undefined;

const normalizeBase = (value?: string) => {
  if (!value) return undefined;

  const trimmed = value.trim().replace(/\/+$/g, '');
  if (!trimmed) return undefined;

  if (trimmed === '/' || trimmed === '/api') return '/api';
  if (trimmed.endsWith('/api')) return trimmed;

  return `${trimmed}/api`;
};

const currentHost = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
const isLocalhost = /^(localhost|127\.0\.0\.1|\[::1])$/.test(currentHost);
const envBaseNormalized = normalizeBase(envBase);

export const API_CONFIG = {
  apiBase:
    envBaseNormalized ||
    (isLocalhost ? 'http://localhost:3001/api' : 'https://321go-backend.vercel.app/api'),
};