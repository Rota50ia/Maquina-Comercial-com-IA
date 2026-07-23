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
```

## Regra central

A IA não pode prometer resultado, nenhum tipo de resultado.
