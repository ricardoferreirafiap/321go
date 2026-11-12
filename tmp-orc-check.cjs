const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const env = {};
for (const line of fs.readFileSync(path.resolve('Backend/.env'), 'utf8').split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i <= 0) continue;
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}
const s = env.DATABASE_URL || env.POSTGRES_URL || env.POSTGRES_PRISMA_URL || env.POSTGRES_URL_NON_POOLING || env.NEON_DATABASE_URL;
const pool = new Pool({
  connectionString: s,
  ssl: /neon\.tech|postgres\.ssl|render\.com|supabase\.co|sslmode=verify-full/i.test(s) ? { rejectUnauthorized: false } : false,
});
const sql = `SELECT id, numero, public_token, cliente, email, destino, agente_viagem, status, data_criacao, data_validade, observacoes,
  COALESCE((SELECT jsonb_agg(item - ARRAY['documentos', 'voucher', 'voucherTipo', 'voucherNome', 'documento', 'arquivo', 'base64']::text[]) FROM jsonb_array_elements(COALESCE(itens, '[]'::jsonb)) item), '[]'::jsonb) AS itens,
  COALESCE((SELECT jsonb_agg(item - ARRAY['documentos', 'voucher', 'voucherTipo', 'voucherNome', 'documento', 'arquivo', 'base64']::text[]) FROM jsonb_array_elements(COALESCE(pacotes, '[]'::jsonb)) item), '[]'::jsonb) AS pacotes,
  COALESCE((SELECT jsonb_agg(item - ARRAY['documentos', 'voucher', 'voucherTipo', 'voucherNome', 'documento', 'arquivo', 'base64']::text[]) FROM jsonb_array_elements(COALESCE(voos, '[]'::jsonb)) item), '[]'::jsonb) AS voos,
  COALESCE((SELECT jsonb_agg(item - ARRAY['documentos', 'voucher', 'voucherTipo', 'voucherNome', 'documento', 'arquivo', 'base64']::text[]) FROM jsonb_array_elements(COALESCE(hospedagem, '[]'::jsonb)) item), '[]'::jsonb) AS hospedagem,
  day_by_day,
  COALESCE((SELECT jsonb_agg(item - ARRAY['documentos', 'voucher', 'voucherTipo', 'voucherNome', 'documento', 'arquivo', 'base64']::text[]) FROM jsonb_array_elements(COALESCE(transporte, '[]'::jsonb)) item), '[]'::jsonb) AS transporte,
  COALESCE((SELECT jsonb_agg(item - ARRAY['documentos', 'voucher', 'voucherTipo', 'voucherNome', 'documento', 'arquivo', 'base64']::text[]) FROM jsonb_array_elements(COALESCE(restaurante, '[]'::jsonb)) item), '[]'::jsonb) AS restaurante,
  COALESCE((SELECT jsonb_agg(item - ARRAY['documentos', 'voucher', 'voucherTipo', 'voucherNome', 'documento', 'arquivo', 'base64']::text[]) FROM jsonb_array_elements(COALESCE(experiencias, '[]'::jsonb)) item), '[]'::jsonb) AS experiencias,
  COALESCE((SELECT jsonb_agg(item - ARRAY['documentos', 'voucher', 'voucherTipo', 'voucherNome', 'documento', 'arquivo', 'base64']::text[]) FROM jsonb_array_elements(COALESCE(seguro, '[]'::jsonb)) item), '[]'::jsonb) AS seguro,
  COALESCE((SELECT jsonb_agg(item - ARRAY['documentos', 'voucher', 'voucherTipo', 'voucherNome', 'documento', 'arquivo', 'base64']::text[]) FROM jsonb_array_elements(COALESCE(perfil_viagem, '[]'::jsonb)) item), '[]'::jsonb) AS perfil_viagem,
  COALESCE((SELECT jsonb_agg(item - ARRAY['documentos', 'voucher', 'voucherTipo', 'voucherNome', 'documento', 'arquivo', 'base64']::text[]) FROM jsonb_array_elements(COALESCE(passageiros, '[]'::jsonb)) item), '[]'::jsonb) AS passageiros,
  forma_pagamento, parcelas, status_viagem
FROM public.orcamentos
ORDER BY data_criacao DESC, id DESC
LIMIT 5;`;

(async () => {
  try {
    const res = await pool.query(sql);
    console.log('OK', res.rows.length);
    console.log(JSON.stringify(res.rows[0], null, 2));
  } catch (e) {
    console.error('CODE', e.code);
    console.error('MESSAGE', e.message);
    console.error('DETAIL', e.detail);
    process.exit(1);
  }
})();

