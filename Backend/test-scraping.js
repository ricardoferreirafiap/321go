// Script de teste para o endpoint de scraping
// Execute com: node Backend/test-scraping.js

const testUrl = 'https://www.hoteldo.com.br'; // URL de exemplo

async function testScraping() {
  try {
    console.log('Testando endpoint de scraping...');
    console.log('URL de teste:', testUrl);
    
    const response = await fetch('http://localhost:3001/api/scrape-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: testUrl }),
    });

    console.log('Status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro:', errorData);
      return;
    }

    const data = await response.json();
    console.log('✅ Sucesso!');
    console.log('Tamanho do HTML:', data.contentLength, 'caracteres');
    console.log('Primeiros 500 caracteres:');
    console.log(data.html.substring(0, 500));
    console.log('...');

  } catch (error) {
    console.error('❌ Erro ao testar:', error.message);
  }
}

testScraping();
