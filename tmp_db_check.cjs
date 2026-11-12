const { Client } = require('pg');
const url = 'postgresql://neondb_owner:npg_JeTUcA3Zg2WC@ep-nameless-fog-ac4c8cdq-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
(async () => {
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orcamentos' ORDER BY ordinal_position");
  console.log('COLUMNS=' + cols.rows.map(r => r.column_name).join('|'));
  try {
    const r = await client.query("SELECT * FROM public.orcamentos LIMIT 1");
    console.log('ROWCOUNT=' + r.rowCount);
  } catch (e) {
    console.log('QUERY_ERR=' + (e.code || 'UNKNOWN') + '::' + e.message);
  }
  await client.end();
})();

