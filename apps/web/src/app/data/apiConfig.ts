// Configuração centralizada de URLs da API
// Em dev o Vite proxia /api → localhost:3001, então usamos caminhos relativos.
// Em produção VITE_API_URL já aponta para https://backend.com/api.
const _base = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '/api';

export const API_CONFIG = {
  // Prefixo para chamadas ao backend (inclui /api)
  apiBase: _base,
};
