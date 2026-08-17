const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/portalweb'
});

async function removerSeguroTeste() {
  try {
    console.log('Buscando orçamento 26072901...');
    const result = await pool.query('SELECT id, numero, seguro FROM orcamentos WHERE numero = $1', ['26072901']);
    
    if (result.rows.length === 0) {
      console.log('Orçamento não encontrado');
      return;
    }
    
    const orcamento = result.rows[0];
    console.log('Orçamento encontrado:', orcamento.numero);
    console.log('Seguro atual:', JSON.stringify(orcamento.seguro, null, 2));
    
    // Remover o seguro 'teste' do array
    const seguroAtual = orcamento.seguro || [];
    const seguroFiltrado = seguroAtual.filter(item => {
      // Filtra itens que não sejam 'teste' ou não contenham 'teste' em campos relevantes
      const nome = item?.nome || item?.seguradora || item?.descricao || '';
      return !nome.toLowerCase().includes('teste');
    });
    
    console.log('Seguro após filtro:', JSON.stringify(seguroFiltrado, null, 2));
    
    // Atualizar o banco de dados
    await pool.query(
      'UPDATE orcamentos SET seguro = $1, atualizado_em = NOW() WHERE id = $2',
      [JSON.stringify(seguroFiltrado), orcamento.id]
    );
    
    console.log('Seguro "teste" removido com sucesso!');
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await pool.end();
  }
}

removerSeguroTeste();
