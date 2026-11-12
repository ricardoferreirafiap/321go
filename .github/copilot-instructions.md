# Projeto 321Go

## Arquitetura obrigatória

### Frontend

- Next.js App Router

### Backend

- NestJS

### Banco

- PostgreSQL Neon

### ORM

- Prisma

### Deploy

- Frontend: Vercel

## Regras obrigatórias

- Nunca criar APIs dentro do Next.js.
- Toda regra de negócio pertence ao NestJS.
- Todo acesso ao banco pertence ao NestJS.
- Frontend apenas consome REST API.
- Sempre utilizar DTO.
- Sempre utilizar Services.
- Sempre utilizar Repository Pattern.
- Nunca criar SQL manual.
- Sempre utilizar Prisma.
- Sempre utilizar TypeScript.
- Sempre seguir Clean Architecture.
- Sempre manter código modular.
- Nunca alterar funcionalidades existentes sem solicitação.

## Diretrizes de implementação

- Toda nova funcionalidade de backend deve ser organizada em módulos do NestJS.
- Controllers devem ser finos e delegar para Services.
- Services devem concentrar casos de uso e regras de negócio.
- Repositories devem encapsular acesso a dados via Prisma.
- DTOs devem ser usados para entrada, saída e contratos entre camadas.
- O frontend não deve conter regra de negócio nem acesso direto ao banco.
- O frontend deve consumir apenas endpoints REST expostos pelo backend.
- Mudanças devem ser pequenas, modulares e restritas ao escopo solicitado.

## Qualidade e manutenção

- Preservar comportamentos existentes salvo solicitação explícita.
- Evitar refatorações paralelas sem relação com a tarefa.
- Atualizar documentação quando arquitetura, deploy, variáveis de ambiente ou fluxos mudarem.
- Preferir código claro, tipado e consistente com a arquitetura definida.