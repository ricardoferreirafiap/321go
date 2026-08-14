# Portal com Menu Superior

Projeto com frontend em Vite/React localizado em `apps/web`.

O frontend consome um backend HTTP/Socket.IO externo configurado por variáveis de ambiente.

## Rodar localmente (frontend)

1. Instale dependências:

```bash
npm install
```

2. Crie os arquivos de ambiente necessários para o frontend.

3. Suba o frontend:

```bash
npm run dev:frontend
```

- Frontend: https://localhost:5173

Para testar o modo offline por outro dispositivo da rede, acesse o frontend com
`https://IP_DA_MAQUINA:5173` e aceite o certificado local antes de desconectar a rede.
Service Workers não são habilitados em endereços IP servidos por HTTP.

## Variáveis de ambiente

Use os arquivos de ambiente do frontend em `apps/web` como referência.

### Frontend (Vite)

- `VITE_API_URL`: URL base do backend HTTP. Em produção, deve incluir o prefixo `/api` do backend.
- `VITE_SOCKET_URL`: URL base do Socket.IO.

Exemplo de produção em `apps/web/.env.production`:

```env
# Defina os valores reais na Vercel.
VITE_API_URL=https://SEU_BACKEND_REAL.up.railway.app/api
VITE_SOCKET_URL=https://SEU_BACKEND_REAL.up.railway.app
```

## Deploy: Vercel + Railway

### Vercel (frontend)

Configure no projeto Vercel:

- `VITE_API_URL=https://SEU_BACKEND_REAL.up.railway.app/api`
- `VITE_SOCKET_URL=https://SEU_BACKEND_REAL.up.railway.app`

### Railway (backend externo)

Configure no serviço Railway:

- `FRONTEND_ORIGIN=https://SEU_FRONTEND.vercel.app`
- `FRONTEND_ORIGINS=https://SEU_FRONTEND.vercel.app,http://localhost:5173`
- `DATABASE_URL=...`
  