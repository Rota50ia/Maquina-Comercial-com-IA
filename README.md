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

## Implementação atual

- `GET /health`
- `POST /webhooks/quiz-raio-x`
- criação/atualização de contato;
- registro de submissão do quiz;
- tags iniciais;
- score comercial inicial;
- rota comercial inicial;
- log de evento.
- dashboard/CRM interno em `GET /crm`.
- busca e filtros de leads.
- painel de detalhe com diagnóstico, score, rota, tags e eventos.
- ações manuais no CRM.
- fila de handoff humano.
- agenda/fila de follow-up.
- sugestão segura de mensagem por gargalo/rota.
- registro de mensagem copiada/enviada no histórico.
- relatório gerencial simples com distribuição por gargalo, classificação, rota, volume diário e eventos comerciais.

## Rotas principais

```text
GET  /health
POST /webhooks/quiz-raio-x
GET  /crm
GET  /internal/leads
GET  /internal/leads/:contactId
GET  /internal/reports/summary
POST /internal/leads/:contactId/actions
```

## CRM interno

O CRM fica disponível em:

```text
https://api.maquinacomercial.rota50ia.com/crm
```

Em produção, o acesso é protegido por Basic Auth usando:

```text
DASHBOARD_USER
DASHBOARD_PASSWORD
```

Funcionalidades atuais:

```text
lista de leads
busca e filtros
detalhe do lead
score e classificação
rota comercial
tags
histórico de eventos
ações manuais
fila de handoff
agenda/fila de follow-up
sugestão segura de mensagem
registro de mensagem copiada/enviada
relatório gerencial simples
```

Fluxo operacional recomendado:

```text
Lead entra pelo quiz
→ operador abre o CRM
→ confere gargalo, score e rota
→ copia ou ajusta a mensagem sugerida
→ envia pelo WhatsApp
→ registra mensagem enviada
→ agenda follow-up ou aciona handoff humano
→ acompanha volume, gargalos e eventos na aba Relatório
```

## Eventos operacionais do CRM

```text
crm_marcar_para_contato
crm_contato_realizado
crm_handoff_humano
crm_handoff_resolvido
crm_followup_agendado
crm_followup_realizado
crm_mensagem_copiada
crm_mensagem_enviada
crm_lead_pausado
crm_lead_reativado
crm_lead_optout
```

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
