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
- edição de nome, e-mail e WhatsApp do lead no CRM.
- ações manuais no CRM.
- fila de handoff humano.
- resumo para atendimento humano no detalhe do lead.
- agenda/fila de follow-up.
- sugestão segura de mensagem por gargalo/rota.
- registro de mensagem copiada/enviada no histórico.
- relatório gerencial simples com distribuição por gargalo, classificação, rota, volume diário e eventos comerciais.
- guardrail automático antes de copiar/registrar mensagem no CRM.
- envio controlado de WhatsApp pelo backend via adaptador UAZAPI.
- recebimento de mensagens WhatsApp por webhook UAZAPI.
- detecção de intenção comercial em mensagens recebidas pelo WhatsApp.

## Rotas principais

```text
GET  /health
POST /webhooks/quiz-raio-x
POST /webhooks/uazapi
POST /webhooks/uazapi/:event
POST /webhooks/uazapi/:event/:type
GET  /crm
GET  /internal/leads
GET  /internal/leads/:contactId
PATCH /internal/leads/:contactId/contact
GET  /internal/reports/summary
POST /internal/messages/guardrail-check
POST /internal/leads/:contactId/messages/whatsapp
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
edição de contato
ações manuais
fila de handoff
resumo para atendimento humano
agenda/fila de follow-up
sugestão segura de mensagem
registro de mensagem copiada/enviada
relatório gerencial simples
guardrail automático de mensagens
envio controlado de WhatsApp via backend/UAZAPI
recebimento de mensagens WhatsApp via webhook UAZAPI
detecção de preço, call, compra ou interesse em mensagens recebidas
```

Fluxo operacional recomendado:

```text
Lead entra pelo quiz
→ operador abre o CRM
→ confere gargalo, score e rota
→ copia ou ajusta a mensagem sugerida
→ CRM valida a mensagem no guardrail
→ envia pelo WhatsApp via backend ou copia para envio manual
→ registra mensagem enviada
→ agenda follow-up ou aciona handoff humano
→ acompanha volume, gargalos e eventos na aba Relatório
```

## Eventos operacionais do CRM

```text
crm_marcar_para_contato
crm_contato_atualizado
crm_contato_realizado
crm_handoff_humano
crm_handoff_resolvido
crm_followup_agendado
crm_followup_realizado
crm_mensagem_copiada
crm_mensagem_enviada
crm_mensagem_bloqueada
crm_whatsapp_enviado
crm_whatsapp_envio_falhou
whatsapp_mensagem_recebida
whatsapp_intencao_comercial_detectada
uazapi_mensagem_ignorada
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
UAZAPI_BASE_URL
UAZAPI_TOKEN
```

Em produção, o dashboard exige `DASHBOARD_USER` e `DASHBOARD_PASSWORD`.
O envio direto de WhatsApp exige `UAZAPI_BASE_URL` e `UAZAPI_TOKEN`.

## Webhook UAZAPI

Endpoint recomendado para mensagens recebidas:

```text
https://api.maquinacomercial.rota50ia.com/webhooks/uazapi/messages?token=[WEBHOOK_SECRET]
```

Configuração recomendada na UAZAPI:

```json
{
  "enabled": true,
  "url": "https://api.maquinacomercial.rota50ia.com/webhooks/uazapi/messages?token=[WEBHOOK_SECRET]",
  "events": ["messages"],
  "excludeMessages": ["fromMeYes", "isGroupYes"],
  "addUrlEvents": false,
  "addUrlTypesMessages": false,
  "action": "add"
}
```

Também é aceito o header `x-maquina-webhook-token` com o valor de `WEBHOOK_SECRET`.

## Regra central

A IA não pode prometer resultado, nenhum tipo de resultado.
