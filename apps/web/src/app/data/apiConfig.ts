// Configuração centralizada de URLs da API
// Em produção, quando o frontend e o backend compartilham o mesmo domínio, use /api.
const envBase =
  typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : undefined;

const normalizeBase = (value?: string) => {
  if (!value) return undefined;
  return value.trim().replace(/\/+$/g, '');
};

const sameDomainBase = '/api';
const resolvedBase = normalizeBase(envBase) || sameDomainBase;

export const API_CONFIG = {
  // Prefixo para chamadas ao backend (inclui /api)
  apiBase: resolvedBase,
};