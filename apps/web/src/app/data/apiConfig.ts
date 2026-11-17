// Configuração centralizada da API do frontend.
// Em produção, nunca apontar para a própria origem do Vercel. A API real deve ficar no backend.
const envBase =
  typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : undefined;

const DEFAULT_LOCAL_API_BASE = 'http://localhost:3001/api';
const DEFAULT_PRODUCTION_API_BASE = 'https://321go-backend.vercel.app/api';

const normalizeBase = (value?: string) => {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed || trimmed === '/') return undefined;

  const withoutTrailingSlash = trimmed.replace(/\/+$/g, '');
  if (!withoutTrailingSlash) return undefined;

  if (withoutTrailingSlash === '/api') return '/api';
  if (withoutTrailingSlash.endsWith('/api')) return withoutTrailingSlash;

  return `${withoutTrailingSlash}/api`;
};

const currentHost = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
const isLocalhost = /^(localhost|127\.0\.0\.1|\[::1])$/.test(currentHost);
const envBaseNormalized = normalizeBase(envBase);

const isProductionLike = typeof window !== 'undefined' && !/^(localhost|127\.0\.0\.1|\[::1])$/.test(window.location.hostname.toLowerCase());

export const API_CONFIG = {
  apiBase:
    envBaseNormalized ||
    (isLocalhost ? DEFAULT_LOCAL_API_BASE : isProductionLike ? DEFAULT_PRODUCTION_API_BASE : DEFAULT_LOCAL_API_BASE),
};