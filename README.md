# Portal com Menu Superior

Projeto com frontend em Vite/React localizado em `apps/web`.

O frontend consome um backend HTTP local configurado por variáveis de ambiente.

## Rodar localmente (frontend)

1. Instale dependências:

```bash
npm install
```

2. Ajuste os arquivos `.env` na raiz e em `Backend/.env` conforme seu ambiente local.

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

- `VITE_API_URL`: URL base do backend HTTP local.
- `VITE_SOCKET_URL`: URL base do Socket.IO local.

Exemplo local:

```env
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

## Deploy

### Vercel (frontend)

Configure no projeto Vercel:

- `VITE_API_URL=https://SEU_BACKEND_REAL/api`
- `VITE_SOCKET_URL=https://SEU_BACKEND_REAL`

### Backend local / hospedado

Configure no ambiente do backend:

- `FRONTEND_ORIGIN=https://SEU_FRONTEND.vercel.app`
- `FRONTEND_ORIGINS=https://SEU_FRONTEND.vercel.app,http://localhost:5173`
- `DATABASE_URL=...`