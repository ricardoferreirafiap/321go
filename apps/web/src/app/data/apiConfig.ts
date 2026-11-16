// Configuração centralizada para o caso simples e funcional: frontend + API no mesmo projeto Vercel.
// Em produção, o browser pode chamar a mesma origem e o rewrite apenas não captura /api.
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
const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const isLocalhost = /^(localhost|127\.0\.0\.1|\[::1])$/.test(currentHost);
const envBaseNormalized = normalizeBase(envBase);
const sameOriginApiBase = currentOrigin ? `${currentOrigin}/api` : undefined;

export const API_CONFIG = {
  apiBase:
    envBaseNormalized ||
    (isLocalhost ? 'http://localhost:3001/api' : sameOriginApiBase || 'http://localhost:3001/api'),
};