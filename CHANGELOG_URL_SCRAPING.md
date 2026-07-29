# Mudanças na Análise de URL do Operador

## Problema Identificado
Ao colar uma URL do operador no campo "URL do Operador" e executar a análise com IA, o relatório retornava apenas informações limitadas:
- **Relatório da URL**
- Provedor: Groq
- **Operador:** 321Go Portal do Morumbi
- **Link:** /logo.png

Isso ocorria porque o `fetch` estava sendo feito diretamente do navegador, enfrentando problemas de CORS (Cross-Origin Resource Sharing). A maioria dos sites bloqueia requisições de outros domínios por questões de segurança.

## Solução Implementada
Criamos um endpoint no backend (`/api/scrape-url`) que faz o download do HTML da URL do operador, evitando problemas de CORS.

### Arquivos Modificados:

1. **Backend/index.js**
   - Adicionado `app.use(express.json())` para parsear requisições JSON
   - Criado endpoint `POST /api/scrape-url` que:
     - Valida a URL fornecida
     - Faz o fetch com headers apropriados (User-Agent, Accept, etc.)
     - Retorna o conteúdo HTML completo para o frontend

2. **apps/web/src/app/data/apiConfig.ts** (NOVO)
   - Arquivo de configuração centralizada das URLs da API
   - Define `API_CONFIG.backendUrl` (padrão: http://localhost:3001)
   - Permite configurar via variável de ambiente `VITE_BACKEND_URL`

3. **apps/web/src/app/components/PacotesForm.tsx**
   - Importação do `API_CONFIG`
   - Atualizado fetch para usar `${API_CONFIG.backendUrl}/api/scrape-url`
   - Agora faz requisição POST com a URL no body
   - Trata erros apropriadamente

4. **.env.example**
   - Adicionada variável `VITE_BACKEND_URL=http://localhost:3001`
   - Documentação para configuração em produção

## Como Usar

### Desenvolvimento Local
1. Certifique-se de que o backend está rodando na porta 3001:
   ```bash
   npm run dev:backend
   ```

2. O frontend usará automaticamente `http://localhost:3001` (padrão)

3. Cole a URL completa do operador no campo "URL do Operador"

4. Clique em "Analisar com IA"

### Configuração para Produção
1. Crie um arquivo `.env` na raiz do projeto

2. Configure a variável de ambiente:
   ```
   VITE_BACKEND_URL=https://seu-backend-em-producao.com
   ```

3. Faça o deploy do backend com o endpoint `/api/scrape-url` disponível

## Benefícios
- ✅ **Evita problemas de CORS**: O backend faz a requisição sem restrições
- ✅ **Headers apropriados**: User-Agent e Accept headers que imitam um navegador real
- ✅ **Tratamento de erros**: Mensagens claras de erro quando o scraping falha
- ✅ **Configurável**: Fácil ajustar URL do backend via variável de ambiente
- ✅ **Seguro**: Validação de URL no backend antes de fazer fetch

## Próximos Passos (Opcional)
Para melhorar ainda mais a análise de URLs complexas, considere:
- Usar Puppeteer/Playwright para renderizar JavaScript
- Adicionar cache de URLs já analisadas
- Implementar timeout configurável
- Adicionar rate limiting para evitar abuso
