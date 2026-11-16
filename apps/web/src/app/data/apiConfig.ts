// Configuração centralizada de URLs da API
// Em produção, o frontend deve chamar o backend via mesma origem em /api para não cair no HTML do SPA.
// Estratégia robusta: priorizar /api na mesma origem e ignorar backends inconsistentes.
const envBase =
  typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : undefined;

const normalizeBase = (value?: string) => {
  if (!value) return undefined;
  const trimmed = value.trim().replace(/\/+$/g, '');
  if (!trimmed) return undefined;
  if (trimmed === '/' || trimmed === '/api') return '/api';
  if (trimmed.startsWith('/')) return trimmed;
  return trimmed;
};

const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const envBaseNormalized = normalizeBase(envBase);
const shouldIgnoreRemoteEnv =
  !!envBaseNormalized &&
  !!currentOrigin &&
  (() => {
    try {
      const parsed = new URL(envBaseNormalized);
      return parsed.origin === currentOrigin || parsed.hostname === 'localhost';
    } catch {
      return false;
    }
  })();

export const API_CONFIG = {
  // Prefixo para chamadas ao backend. Em produção deve ser preenchido via VITE_API_URL.
  apiBase: shouldIgnoreRemoteEnv ? '/api' : envBaseNormalized || '/api',
};