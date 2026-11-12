// Configuração centralizada de URLs da API
// Em produção, o frontend e o backend ficam no mesmo domínio e usam /api.
const envBase =
  typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : undefined;
const sameDomainBase =
  typeof window !== 'undefined' ? new URL('/api', window.location.origin).toString() : '/api';
const _base = envBase || sameDomainBase;

export const API_CONFIG = {
  // Prefixo para chamadas ao backend (inclui /api)
  apiBase: _base.replace(/\/$/, ''),
};