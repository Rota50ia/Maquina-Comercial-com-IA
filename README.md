# Máquina Comercial com IA

Backend interno da Máquina Comercial com IA.

## Repositório

```text
https://github.com/Rota50ia/Maquina-Comercial-com-IA
```

## Stack

- Node.js 20
- TypeScript
- Fastify
- Prisma
- MySQL

## Primeira fatia implementada

- `GET /health`
- `POST /webhooks/quiz-raio-x`
- criação/atualização de contato;
- registro de submissão do quiz;
- tags iniciais;
- score comercial inicial;
- rota comercial inicial;
- log de evento.
- dashboard/CRM interno em `GET /crm`.

## Rodar localmente

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run dev
```

## Variáveis

```text
DATABASE_URL
WEBHOOK_SECRET
APP_ORIGIN
PORT
DASHBOARD_USER
DASHBOARD_PASSWORD
```

Em produção, o dashboard exige `DASHBOARD_USER` e `DASHBOARD_PASSWORD`.

## Regra central

A IA não pode prometer resultado, nenhum tipo de resultado.
